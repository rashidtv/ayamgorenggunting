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
      <!-- Left Panel - Brand -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="logo-animation">
            <div class="logo-icon">🍗</div>
            <div class="logo-rings">
              <div class="ring ring-1"></div>
              <div class="ring ring-2"></div>
              <div class="ring ring-3"></div>
            </div>
          </div>
          <h1 class="brand-title">Ayam Goreng<br>Gunting</h1>
          <p class="brand-subtitle">Business Intelligence Platform</p>
          <div class="feature-list">
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
          <!-- Connection Status -->
          <div class="connection-status" :class="connectionStatus">
            <div class="status-glow"></div>
            <div class="status-content">
              <div class="status-icon">
                <span v-if="connectionStatus === 'online'">🔗</span>
                <span v-else-if="connectionStatus === 'checking'">⏳</span>
                <span v-else>⚠️</span>
              </div>
              <div class="status-text">
                <div class="status-title">
                  {{ connectionStatus === 'online' ? 'System Connected' : 
                     connectionStatus === 'checking' ? 'Establishing Connection' : 
                     'Offline Mode' }}
                </div>
                <div class="status-desc">
                  {{ connectionStatus === 'online' ? 'All systems operational' : 
                     connectionStatus === 'checking' ? 'Checking server availability' : 
                     'Limited functionality available' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="login" class="login-form">
            <div class="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
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
                  :disabled="connectionStatus === 'checking'"
                >
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
                  :disabled="connectionStatus === 'checking'"
                >
                <div class="input-underline"></div>
              </div>
            </div>

            <button 
              type="submit" 
              :disabled="loading || connectionStatus !== 'online'" 
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

          <!-- Demo Accounts -->
          <div class="demo-section">
            <div class="section-divider">
              <span>Quick Access</span>
            </div>
            <div class="demo-grid">
              <div 
                v-for="account in demoAccounts" 
                :key="account.username"
                class="demo-card"
                @click="fillDemoAccount(account)"
                :class="account.role"
              >
                <div class="demo-badge">{{ account.role === 'admin' ? 'ADMIN' : 'STAFF' }}</div>
                <div class="demo-info">
                  <div class="demo-username">{{ account.username }}</div>
                  <div class="demo-password">password: ••••••••</div>
                </div>
                <div class="demo-arrow">→</div>
              </div>
            </div>
          </div>

          <!-- System Info -->
          <div class="system-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Environment</span>
                <span class="info-value">Production</span>
              </div>
              <div class="info-item">
                <span class="info-label">Version</span>
                <span class="info-value">v2.1.0</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status</span>
                <span :class="['info-status', connectionStatus]">
                  {{ connectionStatus.toUpperCase() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { API_BASE } from '../config/api.js'

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      error: '',
      loading: false,
      connectionStatus: 'checking',
      demoAccounts: [
        { username: 'admin', password: 'password', role: 'admin' },
        { username: 'stall_01', password: 'password', role: 'user' },
        { username: 'stall_02', password: 'password', role: 'user' }
      ]
    }
  },
  mounted() {
    this.checkServer()
  },
  methods: {
    async checkServer() {
      this.connectionStatus = 'checking'
      try {
        const response = await axios.get(`${API_BASE}/health`, { timeout: 3000 })
        if (response.data.status === 'OK') {
          this.connectionStatus = 'online'
          this.error = ''
        } else {
          this.connectionStatus = 'offline'
        }
      } catch (error) {
        this.connectionStatus = 'offline'
        console.error('Server check failed:', error.message)
      }
    },
    
    fillDemoAccount(account) {
      this.username = account.username
      this.password = account.password
    },
    
    async login() {
      if (this.connectionStatus !== 'online') {
        this.error = 'Server is not available. Starting in demo mode...'
        return
      }

      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.post(`${API_BASE}/login`, {
          username: this.username,
          password: this.password
        }, { timeout: 10000 })
        
        this.$emit('login-success', response.data.user, response.data.token)
      } catch (error) {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          this.connectionStatus = 'offline'
          this.error = 'Cannot connect to server. Please check if backend is running.'
        } else if (error.response?.status === 401) {
          this.error = 'Invalid username or password'
        } else {
          this.error = 'Login failed. Please try again.'
        }
        console.error('Login error:', error)
      } finally {
        this.loading = false
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
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
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  top: 20%;
  right: 20%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* Layout */
.login-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  width: 95%;
  height: 90vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
}

/* Brand Panel */
.brand-panel {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
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

.brand-content {
  text-align: center;
  position: relative;
  z-index: 2;
}

.logo-animation {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
}

.logo-icon {
  font-size: 4rem;
  position: relative;
  z-index: 3;
  animation: bounce 2s ease-in-out infinite;
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
  width: 100px;
  height: 100px;
  animation-delay: 0s;
}

.ring-2 {
  width: 120px;
  height: 120px;
  animation-delay: 1s;
}

.ring-3 {
  width: 140px;
  height: 140px;
  animation-delay: 2s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
  opacity: 0.9;
}

.feature-icon {
  font-size: 1.2rem;
}

/* Login Panel */
.login-panel {
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

/* Connection Status */
.connection-status {
  background: var(--surface);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
}

.connection-status.online {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.2);
}

.connection-status.checking {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.connection-status.offline {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.2);
}

.status-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--success), var(--primary));
  opacity: 0.6;
}

.connection-status.online .status-glow {
  background: linear-gradient(90deg, var(--success), #10b981);
}

.connection-status.checking .status-glow {
  background: linear-gradient(90deg, var(--info), #3b82f6);
}

.connection-status.offline .status-glow {
  background: linear-gradient(90deg, var(--warning), #f59e0b);
}

.status-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  font-size: 1.5rem;
}

.status-text {
  flex: 1;
}

.status-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.status-desc {
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Login Form */
.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.form-header p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-field {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  color: var(--text-tertiary);
  z-index: 2;
}

.modern-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--surface);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.modern-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
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
  background: var(--primary);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.modern-input:focus + .input-underline {
  transform: scaleX(1);
}

/* Login Button */
.modern-login-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
  padding: 1.25rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
}

.modern-login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
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
    rgba(255, 255, 255, 0.4),
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
  gap: 0.75rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1.1rem;
}

/* Demo Section */
.demo-section {
  margin-bottom: 2rem;
}

.section-divider {
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.section-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border);
}

.section-divider span {
  background: var(--surface);
  padding: 0 1rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.demo-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.demo-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.demo-card.admin::before {
  background: var(--primary);
}

.demo-card.user::before {
  background: var(--secondary);
}

.demo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

.demo-card:hover::before {
  transform: scaleX(1);
}

.demo-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
  flex-shrink: 0;
}

.demo-card.admin .demo-badge {
  background: var(--primary);
}

.demo-card.user .demo-badge {
  background: var(--secondary);
}

.demo-info {
  flex: 1;
}

.demo-username {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
}

.demo-password {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Consolas', monospace;
}

.demo-arrow {
  color: var(--text-tertiary);
  font-weight: 600;
  transition: transform 0.3s ease;
}

.demo-card:hover .demo-arrow {
  transform: translateX(4px);
  color: var(--primary);
}

/* System Info */
.system-info {
  border-top: 1px solid var(--border);
  padding-top: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.info-item {
  text-align: center;
}

.info-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.info-value {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
}

.info-status {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.info-status.online {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.info-status.offline {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.info-status.checking {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

/* Responsive */
@media (max-width: 768px) {
  .login-content {
    grid-template-columns: 1fr;
    height: auto;
    margin: 1rem;
  }
  
  .brand-panel {
    display: none;
  }
  
  .login-panel {
    padding: 2rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .login-panel {
    padding: 1.5rem;
  }
  
  .login-card {
    max-width: none;
  }
}
</style>