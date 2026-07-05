<template>
  <div class="reset-container">
    <div class="reset-card">
      <div class="reset-header">
        <div class="reset-logo">🍗 Chickory Hub</div>
        <h2>Set New Password</h2>
        <p>Create a new password for your account</p>
      </div>
      
      <form @submit.prevent="handleReset" class="reset-form">
        <div class="form-group">
          <label>New Password</label>
          <input 
            v-model="newPassword" 
            type="password" 
            placeholder="Enter new password"
            required
            minlength="8"
          />
          <small>Password must be at least 8 characters</small>
        </div>
        
        <div class="form-group">
          <label>Confirm Password</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="Confirm new password"
            required
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          ❌ {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="success-message">
          ✅ {{ successMessage }}
        </div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Updating...' : 'Update Password' }}
        </button>
      </form>
      
      <div class="reset-footer">
        <a href="#" @click.prevent="goToLogin">← Back to Login</a>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.chickoryhub.com/api'

export default {
  name: 'ResetPassword',
  props: {
    token: { type: String, required: true }
  },
  data() {
    return {
      newPassword: '',
      confirmPassword: '',
      loading: false,
      errorMessage: '',
      successMessage: '',
      tokenValid: false
    }
  },
  mounted() {
    this.validateToken()
  },
  methods: {
    async validateToken() {
      try {
        const response = await axios.post(`${API_BASE}/auth/validate-reset-token`, {
          token: this.token
        })
        this.tokenValid = response.data.valid
        if (!this.tokenValid) {
          this.errorMessage = 'Invalid or expired reset link. Please request a new one.'
        }
      } catch (error) {
        this.errorMessage = 'Invalid or expired reset link. Please request a new one.'
        this.tokenValid = false
      }
    },
    async handleReset() {
      if (!this.tokenValid) {
        this.errorMessage = 'Invalid or expired reset link'
        return
      }
      
      if (this.newPassword.length < 8) {
        this.errorMessage = 'Password must be at least 8 characters'
        return
      }
      
      if (this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'Passwords do not match'
        return
      }
      
      this.loading = true
      this.errorMessage = ''
      
      try {
        await axios.post(`${API_BASE}/auth/reset-password`, {
          token: this.token,
          newPassword: this.newPassword
        })
        
        this.successMessage = 'Password reset successfully! Redirecting to login...'
        this.$emit('reset-complete')
        
        setTimeout(() => {
          this.goToLogin()
        }, 3000)
        
      } catch (error) {
        console.error('Reset error:', error)
        this.errorMessage = error.response?.data?.error || 'Failed to reset password'
      } finally {
        this.loading = false
      }
    },
    goToLogin() {
      window.location.href = '/'
    }
  }
}
</script>

<style scoped>
.reset-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F94908 0%, #fa6a2e 50%, #f97316 100%);
  padding: 1.5rem;
}

.reset-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.reset-header {
  text-align: center;
  margin-bottom: 2rem;
}

.reset-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #F94908;
  margin-bottom: 0.5rem;
}

.reset-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.reset-header p {
  color: #64748b;
  font-size: 0.9rem;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.form-group input {
  padding: 0.6rem 0.8rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #ffffff;
  color: #1e293b;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.08);
}

.form-group small {
  font-size: 0.75rem;
  color: #94a3b8;
}

.error-message {
  color: #ef4444;
  font-size: 0.85rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 6px;
  text-align: center;
}

.success-message {
  color: #10b981;
  font-size: 0.85rem;
  padding: 0.5rem;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 6px;
  text-align: center;
}

.btn-primary {
  padding: 0.75rem;
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-footer {
  margin-top: 1.5rem;
  text-align: center;
}

.reset-footer a {
  color: #64748b;
  text-decoration: none;
  font-size: 0.85rem;
}

.reset-footer a:hover {
  color: #F94908;
}

@media (max-width: 480px) {
  .reset-card {
    padding: 1.5rem;
  }
}
</style>