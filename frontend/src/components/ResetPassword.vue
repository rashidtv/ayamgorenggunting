<template>
  <div class="reset-overlay">
    <div class="reset-modal">
      <div class="reset-modal-header">
        <h2>Reset Your Password</h2>
        <p>Enter your new password below.</p>
      </div>

      <!-- Token Validation State -->
      <div v-if="!tokenValidated" class="loading-state">
        <div class="spinner"></div>
        <p>Validating your reset link...</p>
      </div>

      <!-- Invalid Token State -->
      <div v-else-if="!isValidToken" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Invalid or Expired Link</h3>
        <p>{{ error || 'The password reset link is invalid or has expired.' }}</p>
        <button @click="goToLogin" class="btn-primary">Back to Login</button>
      </div>

      <!-- Reset Form -->
      <form v-else @submit.prevent="handleReset" class="reset-form">
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
          <span v-else>Reset Password</span>
        </button>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
        
        <!-- Back to Login button when error occurs -->
        <button v-if="error" @click="goToLogin" class="btn-secondary" style="margin-top: 10px;">
          Back to Login
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import API_BASE from '../config/api.js';

export default {
  name: 'ResetPassword',
  props: {
    token: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      newPassword: '',
      confirmPassword: '',
      loading: false,
      error: '',
      success: '',
      isValidToken: false,
      tokenValidated: false,
      resetToken: this.token || ''
    };
  },
  mounted() {
    console.log('🔑 ResetPassword mounted with token prop:', this.token);
    this.extractTokenFromUrl();
    if (this.resetToken) {
      this.validateToken();
    } else {
      this.error = 'Missing reset token. Please use the link from your email.';
      this.tokenValidated = true;
      this.isValidToken = false;
    }
  },
  methods: {
    extractTokenFromUrl() {
      if (!this.resetToken) {
        const hash = window.location.hash;
        if (hash.includes('?')) {
          const params = new URLSearchParams(hash.split('?')[1]);
          const urlToken = params.get('token');
          if (urlToken) {
            this.resetToken = urlToken;
            console.log('✅ Token extracted from URL:', this.resetToken);
            this.$emit('token-received', this.resetToken);
          }
        }
      }
    },

    async validateToken() {
      try {
        console.log('🔍 Validating token:', this.resetToken);
        const response = await axios.post(`${API_BASE}/auth/validate-reset-token`, {
          token: this.resetToken
        });
        
        if (response.data.valid) {
          this.isValidToken = true;
          console.log('✅ Token is valid');
        } else {
          this.error = 'Invalid or expired token. Please request a new password reset.';
          this.isValidToken = false;
        }
      } catch (error) {
        console.error('Token validation error:', error);
        this.error = error.response?.data?.error || 'Failed to validate token. Please try again.';
        this.isValidToken = false;
      } finally {
        this.tokenValidated = true;
      }
    },

    async handleReset() {
      this.error = '';
      this.success = '';

      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Passwords do not match';
        return;
      }

      if (!/^[a-zA-Z0-9]+$/.test(this.newPassword)) {
        this.error = 'Password must contain only letters and numbers';
        return;
      }

      if (this.newPassword.length < 8) {
        this.error = 'Password must be at least 8 characters long';
        return;
      }

      this.loading = true;

      try {
        const response = await axios.post(`${API_BASE}/auth/reset-password`, {
          token: this.resetToken,
          newPassword: this.newPassword
        });

        this.success = '✅ Password reset successful! Redirecting to login...';
        
        // Emit reset complete event to parent
        this.$emit('reset-complete');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.hash = '#/login';
          window.location.reload();
        }, 2000);

      } catch (err) {
        console.error('Reset error:', err);
        this.error = err.response?.data?.error || 'Failed to reset password. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    goToLogin() {
    // Emit close event to parent
    this.$emit('close');
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

.loading-state {
  text-align: center;
  padding: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #F94908;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 1rem 0;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.error-state p {
  color: #64748b;
  margin-bottom: 1.5rem;
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

.btn-primary {
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

.btn-primary:hover:not(:disabled) {
  background: #d63d07;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  width: 100%;
  padding: 0.875rem;
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
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