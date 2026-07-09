<template>
  <div class="reset-container">
    <div class="reset-box">
      <div class="reset-header">
        <h2>🔐 First Login</h2>
        <p>Welcome, <strong>{{ userInfo.full_name || userInfo.username }}</strong>!</p>
        <p class="sub-text">Please set your new password to continue.</p>
      </div>
      
      <form @submit.prevent="handleReset">
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
        
        <button type="submit" :disabled="loading" class="btn-primary">
          <span v-if="loading">⏳ Resetting...</span>
          <span v-else>✅ Reset Password</span>
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
      
      if (this.newPassword !== this.confirmPassword) {
        this.error = '❌ Passwords do not match';
        return;
      }
      
      if (!/^[a-zA-Z0-9]+$/.test(this.newPassword)) {
        this.error = '❌ Password must contain only letters and numbers';
        return;
      }
      
      if (this.newPassword.length < 8) {
        this.error = '❌ Password must be at least 8 characters long';
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
        
        sessionStorage.removeItem('needsPasswordReset');
        sessionStorage.removeItem('resetUserId');
        sessionStorage.removeItem('resetUser');
        
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
        
      } catch (err) {
        this.error = err.response?.data?.error || '❌ Failed to reset password. Please try again.';
        console.error('Reset error:', err);
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    if (!sessionStorage.getItem('needsPasswordReset') || !sessionStorage.getItem('resetUserId')) {
      window.location.hash = '#/login';
    }
  }
};
</script>

<style scoped>
.reset-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.reset-box {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
}

.reset-header {
  text-align: center;
  margin-bottom: 2rem;
}

.reset-header h2 {
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1.75rem;
}

.reset-header p {
  color: #64748b;
  margin: 0.25rem 0;
}

.reset-header .sub-text {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  color: #334155;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f8fafc;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group small {
  display: block;
  margin-top: 0.375rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

.btn-primary {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
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
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  text-align: center;
}

@media (max-width: 480px) {
  .reset-box {
    padding: 1.5rem;
  }
}
</style>