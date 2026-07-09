<template>
  <div class="reset-overlay">
    <div class="reset-modal">
      <div class="reset-modal-header">
        <h2>First Login</h2>
        <p>Welcome, <strong>{{ userInfo.full_name || userInfo.username }}</strong>!</p>
        <p class="sub-text">Please set your new password to continue.</p>
      </div>
      
      <form @submit.prevent="handleReset" class="reset-form">
        <div class="form-group">
          <label for="currentPassword">Temporary Password</label>
          <input
            type="password"
            id="currentPassword"
            v-model="currentPassword"
            required
            placeholder="Enter your temporary password"
            autocomplete="current-password"
          />
        </div>
        
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            v-model="newPassword"
            required
            placeholder="Enter new password"
            autocomplete="new-password"
          />
          <small>⚠️ Must be alphanumeric only (letters and numbers) and at least 8 characters</small>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Confirm new password"
            autocomplete="new-password"
          />
        </div>
        
        <button type="submit" :disabled="loading" class="btn-reset">
          <span v-if="loading">⏳ Resetting...</span>
          <span v-else>Reset Password</span>
        </button>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import API_BASE from '../config/api.js';

export default {
  name: 'FirstLoginReset',
  data() {
    return {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      loading: false,
      error: '',
      success: ''
    };
  },
  computed: {
    userInfo() {
      try {
        return JSON.parse(sessionStorage.getItem('resetUser') || '{}');
      } catch {
        return {};
      }
    }
  },
  methods: {
    async handleReset() {
      this.error = '';
      this.success = '';
      
      // Validate passwords match
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Passwords do not match';
        return;
      }
      
      // Validate alphanumeric
      if (!/^[a-zA-Z0-9]+$/.test(this.newPassword)) {
        this.error = 'Password must contain only letters and numbers';
        return;
      }
      
      // Validate length
      if (this.newPassword.length < 8) {
        this.error = 'Password must be at least 8 characters long';
        return;
      }
      
      this.loading = true;
      
      try {
        const response = await axios.post(`${API_BASE}/auth/first-login-reset`, {
          userId: sessionStorage.getItem('resetUserId'),
          currentPassword: this.currentPassword,
          newPassword: this.newPassword
        });
        
        this.success = '✅ Password reset successful! Redirecting to login...';
        
        // Clear session data
        sessionStorage.removeItem('needsPasswordReset');
        sessionStorage.removeItem('resetUserId');
        sessionStorage.removeItem('resetUser');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.hash = '#/login';
          window.location.reload(); // Force reload to clear state
        }, 2000);
        
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to reset password. Please try again.';
        console.error('Reset error:', err);
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    // Check if user is supposed to be here
    if (!sessionStorage.getItem('needsPasswordReset') || !sessionStorage.getItem('resetUserId')) {
      window.location.hash = '#/login';
    }
  }
};
</script>

<style scoped>
.reset-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.reset-modal {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.reset-modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.reset-modal-header h2 {
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.reset-modal-header p {
  color: #64748b;
  margin: 0.25rem 0;
}

.reset-modal-header .sub-text {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}

.reset-form .form-group {
  margin-bottom: 1.25rem;
}

.reset-form .form-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  color: #334155;
  font-size: 0.9rem;
}

.reset-form .form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f8fafc;
  color: #1e293b;
}

.reset-form .form-group input:focus {
  outline: none;
  border-color: #F94908;
  background: white;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.1);
}

.reset-form .form-group small {
  display: block;
  margin-top: 0.375rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

.btn-reset {
  width: 100%;
  padding: 0.875rem;
  background: #F94908;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-reset:hover:not(:disabled) {
  background: #d63d07;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.btn-reset:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  border: 1px solid #fecaca;
  text-align: center;
  font-size: 0.9rem;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  text-align: center;
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .reset-modal {
    padding: 1.5rem;
    margin: 10px;
  }
}
</style>