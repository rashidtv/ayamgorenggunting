<template>
  <div class="login-page">
    <!-- ===== HEADER WITH BANNER ===== -->
    <DashboardHeader 
      :is-public="true"
      role-text="Chickory Hub"
      :banner-url="bannerImage"
    />

    <!-- ===== LOGIN CONTENT ===== -->
    <main class="login-main">
      <div class="login-container">
        <!-- Animated Background -->
        <div class="background-animation">
          <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
          </div>
        </div>

        <div class="login-content">
          <!-- Brand Panel - Now showing banner -->
          <div class="brand-panel">
            <div class="brand-content">
              <!-- BANNER IMAGE - Full width, no text overlay -->
              <div class="banner-wrapper">
                <img 
                  v-if="bannerImage" 
                  :src="bannerImage" 
                  alt="Chickory Hub Banner" 
                  class="login-banner-image"
                />
                <!-- Fallback if no banner -->
                <div v-else class="banner-fallback">
                  <div class="logo-animation">
                    <div class="logo-icon">🍗</div>
                    <div class="logo-rings">
                      <div class="ring ring-1"></div>
                      <div class="ring ring-2"></div>
                      <div class="ring ring-3"></div>
                    </div>
                  </div>
                  <h1 class="brand-title">
                    <span class="brand-text">Chickory</span>
                    <span class="brand-text">Hub</span>
                  </h1>
                  <p class="brand-tagline">Business Intelligence Platform</p>
                </div>
              </div>
              
              <!-- Feature List - Only show if no banner -->
              <div v-if="!bannerImage" class="feature-list">
                <div class="feature-item">
                  <span class="feature-icon">📊</span>
                  <span>Real-time Analytics</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🛒</span>
                  <span>Multi-stall Management</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📱</span>
                  <span>PWA Ready</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Panel - Login Form -->
          <div class="login-panel">
            <div class="login-card">
              <!-- Back to Home Button -->
              <div class="login-back">
                <button @click="goHome" class="back-btn">
                  ← Back to Home
                </button>
              </div>

              <form @submit.prevent="login" class="login-form">
                <div class="form-header">
                  <h2 class="form-title">Welcome Back</h2>
                  <p class="form-subtitle">Sign in to your account</p>
                </div>

                <div class="input-group">
                  <div class="input-field">
                    <div class="input-icon">👤</div>
                    <input 
                      v-model="username" 
                      type="text" 
                      required
                      placeholder="Enter username"
                      class="modern-input"
                      :disabled="loading"
                    />
                    <div class="input-underline"></div>
                  </div>
                </div>

                <div class="input-group">
                  <div class="input-field">
                    <div class="input-icon">🔒</div>
                    <input 
                      v-model="password" 
                      type="password" 
                      required
                      placeholder="Enter password"
                      class="modern-input"
                      :disabled="loading"
                    />
                    <div class="input-underline"></div>
                  </div>
                </div>

                <!-- Login Options: Remember Me & Forgot Password -->
                <div class="login-options">
                  <label class="remember-me">
                    <input type="checkbox" v-model="rememberMe" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" @click.prevent="openForgotPassword" class="forgot-link">
                    Forgot password?
                  </a>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="error-message">
                  ❌ {{ error }}
                </div>

                <button 
                  type="submit" 
                  :disabled="loading" 
                  class="modern-login-btn"
                >
                  <div class="btn-content">
                    <span v-if="loading" class="btn-loading">
                      <div class="loading-spinner"></div>
                      Authenticating...
                    </span>
                    <span v-else class="btn-text">
                      <span class="btn-icon">→</span>
                      Sign In
                    </span>
                  </div>
                  <div class="btn-shine"></div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ===== FOOTER ===== -->
    <GlobalFooter />

    <!-- ===== FORGOT PASSWORD MODAL ===== -->
    <div v-if="showForgotPassword" class="modal-overlay" @click.self="closeForgotPassword">
      <div class="modal-modern">
        <div class="modal-modern-header">
          <h3>🔑 Reset Password</h3>
          <button @click="closeForgotPassword" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <p class="reset-description">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <div class="form-group">
            <label>Email Address</label>
            <input 
              v-model="resetEmail" 
              type="email" 
              placeholder="Enter your registered email"
              required
            />
          </div>
          <div v-if="resetMessage" class="reset-message" :class="resetMessageType">
            {{ resetMessage }}
          </div>
          <button @click="requestPasswordReset" class="btn-primary full-width" :disabled="resetLoading">
            {{ resetLoading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </div>
        <div class="modal-modern-footer">
          <button @click="closeForgotPassword" class="btn-modern secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- ===== RESET CONFIRMATION MODAL ===== -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="closeResetConfirm">
      <div class="modal-modern">
        <div class="modal-modern-header">
          <h3>✅ Check Your Email</h3>
          <button @click="closeResetConfirm" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <div class="reset-confirm-content">
            <div class="reset-confirm-icon">📧</div>
            <h3>Password Reset Link Sent</h3>
            <p>We've sent a password reset link to <strong>{{ resetEmail }}</strong></p>
            <p class="reset-confirm-note">If you don't see it, check your spam folder.</p>
          </div>
        </div>
        <div class="modal-modern-footer">
          <button @click="closeResetConfirm" class="btn-modern primary">OK, Got it</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import DashboardHeader from './DashboardHeader.vue'
import GlobalFooter from './GlobalFooter.vue'

const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'

export default {
  name: 'Login',
  components: {
    DashboardHeader,
    GlobalFooter
  },
  props: {
    companyLogo: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      username: '',
      password: '',
      rememberMe: false,
      error: '',
      loading: false,
      bannerImage: localStorage.getItem('systemBanner') || null,
      
      showForgotPassword: false,
      resetEmail: '',
      resetLoading: false,
      resetMessage: '',
      resetMessageType: 'info',
      showResetConfirm: false
    }
  },
  mounted() {
    this.fetchBanner()
    
    if (localStorage.getItem('rememberMe') === 'true') {
      this.username = localStorage.getItem('username') || ''
      this.rememberMe = true
    }
  },
  methods: {
    async fetchBanner() {
      try {
        const response = await axios.get(`${API_BASE}/system/banner`)
        if (response.data.bannerUrl) {
          this.bannerImage = response.data.bannerUrl
          localStorage.setItem('systemBanner', response.data.bannerUrl)
        }
      } catch (err) {
        console.log('No system banner found, using default')
      }
    },

    async login() {
      if (!this.username || !this.password) {
        this.error = 'Please enter username and password'
        return
      }
      
      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.post(`${API_BASE}/login`, {
          username: this.username,
          password: this.password
        }, { timeout: 10000 })
        
        console.log('📤 Full login response:', response)
        console.log('📤 Response data:', response.data)
        console.log('📤 User:', response.data?.user)
        console.log('📤 Token:', response.data?.token)
        
        if (response.data && response.data.requiresReset) {
          console.log('🔄 First login detected, redirecting to reset...')
          sessionStorage.setItem('needsPasswordReset', 'true')
          sessionStorage.setItem('resetUserId', response.data.userId)
          sessionStorage.setItem('resetUser', JSON.stringify({
            username: response.data.username,
            full_name: response.data.full_name,
            email: response.data.email
          }))
          
          this.$emit('show-first-login-reset')
          window.location.hash = '#/first-login-reset'
          this.loading = false
          return
        }
        
        if (response.data && response.data.user && response.data.token) {
          if (this.rememberMe) {
            localStorage.setItem('rememberMe', 'true')
            localStorage.setItem('username', this.username)
          } else {
            localStorage.removeItem('rememberMe')
            localStorage.removeItem('username')
          }
          
          this.$emit('login-success', response.data)
        } else {
          console.error('❌ Invalid login response structure:', response.data)
          this.error = 'Invalid server response. Please try again.'
          this.loading = false
        }
        
      } catch (error) {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          this.error = 'Cannot connect to server. Please check if backend is running.'
        } else if (error.response?.status === 401) {
          this.error = 'Invalid username or password'
        } else {
          this.error = 'Login failed. Please try again.'
        }
        console.error('❌ Login error:', error)
        this.loading = false
      } finally {
        if (this.loading) {
          this.loading = false
        }
      }
    },

    goHome() {
      this.$emit('show-landing')
    },

    openForgotPassword() {
      this.showForgotPassword = true
      this.resetEmail = ''
      this.resetMessage = ''
      this.resetMessageType = 'info'
    },
    
    closeForgotPassword() {
      this.showForgotPassword = false
      this.resetEmail = ''
      this.resetMessage = ''
      this.resetLoading = false
    },
    
    closeResetConfirm() {
      this.showResetConfirm = false
      this.closeForgotPassword()
    },
    
    async requestPasswordReset() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.resetEmail) {
        this.resetMessage = 'Please enter your email address'
        this.resetMessageType = 'error'
        return
      }
      if (!emailRegex.test(this.resetEmail)) {
        this.resetMessage = 'Please enter a valid email address'
        this.resetMessageType = 'error'
        return
      }
      
      this.resetLoading = true
      this.resetMessage = ''
      
      try {
        const response = await axios.post(`${API_BASE}/auth/forgot-password`, {
          email: this.resetEmail
        })
        
        this.closeForgotPassword()
        this.showResetConfirm = true
        
        this.$emit('show-notification', 'Password reset link sent to your email!', 'success')
        
      } catch (error) {
        console.error('Reset error:', error)
        
        if (error.response?.status === 404) {
          this.resetMessage = 'No account found with this email address'
          this.resetMessageType = 'error'
        } else if (error.response?.data?.error) {
          this.resetMessage = error.response.data.error
          this.resetMessageType = 'error'
        } else {
          this.resetMessage = 'Failed to send reset link. Please try again later.'
          this.resetMessageType = 'error'
        }
      } finally {
        this.resetLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

/* ===== MAIN CONTENT ===== */
.login-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
}

.login-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
  position: relative;
}

/* ===== ANIMATED BACKGROUND ===== */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: 20px;
}

.floating-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(249, 73, 8, 0.05);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 120px;
  height: 120px;
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.shape-2 {
  width: 80px;
  height: 80px;
  top: 60%;
  right: 5%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 10%;
  animation-delay: 4s;
}

.shape-4 {
  width: 90px;
  height: 90px;
  top: 20%;
  right: 10%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(180deg); }
}

/* ===== LOGIN CONTENT ===== */
.login-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  width: 100%;
  min-height: 500px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  z-index: 2;
}

/* ===== BRAND PANEL ===== */
.brand-panel {
  background: linear-gradient(135deg, #F94908 0%, #fa6a2e 50%, #f97316 100%);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  overflow: hidden;
}

.brand-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.banner-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.login-banner-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* ===== FALLBACK (NO BANNER) ===== */
.banner-fallback {
  text-align: center;
  padding: 2rem;
  width: 100%;
}

.logo-animation {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
}

.logo-icon {
  font-size: 3.5rem;
  position: relative;
  z-index: 3;
  animation: bounce 2s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.logo-rings {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

.ring-1 {
  width: 80px;
  height: 80px;
  animation-delay: 0s;
}

.ring-2 {
  width: 95px;
  height: 95px;
  animation-delay: 1s;
}

.ring-3 {
  width: 110px;
  height: 110px;
  animation-delay: 2s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.05); }
}

.brand-title {
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  line-height: 1.1;
  color: white;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
  animation: textFadeIn 1.2s ease-out;
}

.brand-title .brand-text {
  display: inline-block;
  animation: shimmer 3s ease-in-out infinite;
  background: linear-gradient(to right, #ffffff, #ffedd5, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes shimmer {
  0% { background-position: 0% center; }
  50% { background-position: 200% center; }
  100% { background-position: 0% center; }
}

.brand-tagline {
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 2rem;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.9);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  opacity: 0.9;
  justify-content: center;
  color: white;
}

.feature-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* ===== LOGIN PANEL ===== */
.login-panel {
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  background: #ffffff;
}

.login-card {
  width: 100%;
  max-width: 400px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.login-back {
  margin-bottom: 0.5rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-secondary, #64748b);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.back-btn:hover {
  color: #F94908;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.form-subtitle {
  color: #64748b;
  font-size: 0.9rem;
}

/* ===== INPUT FIELDS ===== */
.input-group {
  margin-bottom: 1rem;
}

.input-field {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  color: #94a3b8;
  z-index: 2;
}

.modern-input {
  width: 100%;
  padding: 0.875rem 0.875rem 0.875rem 2.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  background: #ffffff;
  transition: all 0.3s ease;
}

.modern-input:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.1);
  transform: translateY(-1px);
}

.modern-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-underline {
  display: none;
}

/* ===== LOGIN OPTIONS ===== */
.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
}

.remember-me input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #F94908;
}

.forgot-link {
  color: #F94908;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
}

.forgot-link:hover {
  text-decoration: underline;
}

.error-message {
  color: #ef4444;
  font-size: 0.85rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 6px;
  text-align: center;
  margin-bottom: 0.75rem;
}

/* ===== LOGIN BUTTON ===== */
.modern-login-btn {
  width: 100%;
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.modern-login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(249, 73, 8, 0.35);
}

.modern-login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s ease;
}

.modern-login-btn:hover .btn-shine {
  left: 100%;
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ============================================ */
/* MODALS                                       */
/* ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-modern {
  background: #ffffff;
  border-radius: 12px;
  max-width: 440px;
  width: 92%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-modern-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.modal-modern-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #94a3b8;
  padding: 0 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
}

.modal-close-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.modal-modern-body {
  padding: 1.25rem;
  overflow-y: auto;
  max-height: 60vh;
  background: #ffffff;
}

.modal-modern-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: #fafafa;
}

/* Form Group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.form-group input {
  padding: 0.5rem 0.7rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #ffffff;
  color: #1e293b;
  width: 100%;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249,73,8,0.08);
}

.reset-description {
  color: #64748b;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.reset-message {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.reset-message.success {
  background: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.reset-message.error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.reset-message.info {
  background: #dbeafe;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249,73,8,0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary.full-width {
  width: 100%;
  justify-content: center;
}

.btn-modern {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.8rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-modern.secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-modern.secondary:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-modern.primary {
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
}

.btn-modern.primary:hover {
  box-shadow: 0 4px 12px rgba(249,73,8,0.3);
}

/* Reset Confirmation */
.reset-confirm-content {
  text-align: center;
  padding: 1rem 0;
}

.reset-confirm-icon {
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
}

.reset-confirm-content h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.reset-confirm-content p {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.reset-confirm-note {
  font-size: 0.8rem !important;
  color: #94a3b8 !important;
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */
@media (max-width: 768px) {
  .login-content {
    grid-template-columns: 1fr;
    min-height: auto;
    margin: 0;
  }
  
  .brand-panel {
    padding: 0;
    min-height: 250px;
    max-height: 300px;
  }
  
  .login-banner-image {
    object-fit: contain;
    min-height: 250px;
    max-height: 300px;
  }
  
  .brand-title {
    font-size: 2.2rem;
  }
  
  .brand-tagline {
    font-size: 0.8rem;
  }
  
  .feature-list {
    display: none;
  }
  
  .login-panel {
    padding: 1.5rem;
  }
  
  .login-card {
    min-height: auto;
  }
  
  .login-options {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .background-animation {
    border-radius: 0;
  }
  
  .login-container {
    min-height: auto;
  }
}

@media (max-width: 480px) {
  .brand-panel {
    min-height: 180px;
    max-height: 220px;
  }
  
  .login-banner-image {
    min-height: 180px;
  }
  
  .brand-title {
    font-size: 1.8rem;
  }
  
  .brand-tagline {
    font-size: 0.75rem;
  }
  
  .form-title {
    font-size: 1.4rem;
  }
  
  .login-panel {
    padding: 1rem;
  }
  
  .login-card {
    padding: 0;
  }
  
  .modal-modern {
    width: 95%;
  }
}
</style>