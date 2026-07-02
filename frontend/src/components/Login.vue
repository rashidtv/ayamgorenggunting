<template>
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
                />
                <div class="input-underline"></div>
              </div>
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

          <!-- Footer -->
          <div class="login-footer">
            <span class="footer-icon">🍗</span>
            <span class="footer-text">Chickory Hub —</span>
            <span class="footer-text">Business Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'

export default {
  name: 'Login',
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
      error: '',
      loading: false,
      bannerImage: localStorage.getItem('systemBanner') || null
    }
  },
  mounted() {
    this.fetchBanner()
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
        
        if (response.data && response.data.user && response.data.token) {
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
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F94908 0%, #fa6a2e 50%, #f97316 100%);
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

/* Animated Background */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.floating-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
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

/* Layout */
.login-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  width: 100%;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
}

/* ===== BRAND PANEL - BANNER DISPLAY ===== */
.brand-panel {
  background: linear-gradient(135deg, #F94908 0%, #fa6a2e 50%, #f97316 100%);
  color: white;
  padding: 0;  /* Keep padding 0 so background fills entire panel */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-height: 400px;
}

.brand-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.brand-panel::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.5); opacity: 0.6; }
}

.brand-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 2rem;  /* ADD THIS - moves the image right */
}

/* ===== BANNER IMAGE ===== */
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
  object-fit: cover;
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

@keyframes textFadeIn {
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
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
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.05);
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
}

.login-card {
  width: 100%;
  max-width: 400px;
  min-height: 450px;
  display: flex;
  flex-direction: column;
}

/* Login Form */
.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
  flex-shrink: 0;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text, #1e293b);
  margin-bottom: 0.25rem;
}

.form-subtitle {
  color: var(--text-secondary, #64748b);
  font-size: 0.9rem;
}

/* Input Fields */
.input-group {
  margin-bottom: 1.25rem;
  flex-shrink: 0;
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
  color: var(--text-tertiary, #94a3b8);
  z-index: 2;
}

.modern-input {
  width: 100%;
  padding: 0.875rem 0.875rem 0.875rem 2.75rem;
  border: 2px solid var(--border, #e2e8f0);
  border-radius: 10px;
  font-size: 0.9rem;
  background: var(--surface, #ffffff);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
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
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #F94908;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.modern-input:focus + .input-underline {
  transform: scaleX(1);
}

/* Login Button */
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
  margin-top: auto;
  flex-shrink: 0;
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
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
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

.btn-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1rem;
}

/* ===== LOGIN FOOTER ===== */
.login-footer {
  text-align: center;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  border-top: 1px solid var(--border, #e2e8f0);
  font-size: 0.8rem;
  color: var(--text-secondary, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.footer-icon {
  font-size: 1rem;
}

.footer-text {
  font-weight: 400;
  letter-spacing: 0.3px;
}

.footer-text:last-child {
  font-weight: 300;
  opacity: 0.7;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .login-container {
    padding: 0.5rem;
    align-items: stretch;
  }
  
  .login-content {
    grid-template-columns: 1fr;
    height: auto;
    min-height: auto;
    margin: 0;
  }
  
  .brand-panel {
    padding: 0;
    min-height: 200px;
    max-height: 300px;
  }
  
  .login-banner-image {
    object-fit: cover;
    min-height: 200px;
  }
  
  .banner-fallback {
    padding: 1.5rem;
  }
  
  .logo-animation {
    width: 70px;
    height: 70px;
    margin-bottom: 1rem;
  }
  
  .logo-icon {
    font-size: 2.5rem;
  }
  
  .ring-1 { width: 55px; height: 55px; }
  .ring-2 { width: 65px; height: 65px; }
  .ring-3 { width: 75px; height: 75px; }
  
  .brand-title {
    font-size: 2.2rem;
  }
  
  .brand-tagline {
    font-size: 0.8rem;
    margin-bottom: 1.5rem;
  }
  
  .feature-list {
    display: none;
  }
  
  .login-panel {
    padding: 1.5rem;
    min-height: 400px;
  }
  
  .login-card {
    min-height: auto;
  }
}

@media (max-width: 480px) {
  .brand-panel {
    min-height: 150px;
    max-height: 220px;
  }
  
  .login-banner-image {
    min-height: 150px;
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
  
  .login-footer {
    font-size: 0.7rem;
    flex-direction: column;
    gap: 0.2rem;
  }
}
</style>