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
          <!-- Connection Status - Fixed for Mobile -->
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
                  {{ getStatusTitle() }}
                </div>
                <div class="status-desc">
                  {{ getStatusDescription() }}
                </div>
              </div>
            </div>
          </div>

          <!-- Login Form -->
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
                  {{ getShortStatus() }}
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
    getStatusTitle() {
      const titles = {
        online: 'System Connected',
        checking: 'Checking Connection',
        offline: 'Offline Mode'
      }
      return titles[this.connectionStatus] || 'Checking...'
    },
    
    getStatusDescription() {
      const descriptions = {
        online: 'All systems operational',
        checking: 'Checking server availability',
        offline: 'Limited functionality available'
      }
      return descriptions[this.connectionStatus] || 'Checking connection...'
    },
    
    getShortStatus() {
      const statusMap = {
        online: 'ONLINE',
        checking: 'CHECKING',
        offline: 'OFFLINE'
      }
      return statusMap[this.connectionStatus] || 'UNKNOWN'
    },
    
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
  background: rgba(255, 255, 255, 0.1);
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
}

/* Brand Panel */
.brand-panel {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 2rem;
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
  width: 100%;
  max-width: 400px;
}

.logo-animation {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
}

.logo-icon {
  font-size: 3rem;
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
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  line-height: 1.1;
  word-wrap: break-word;
}

.brand-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  line-height: 1.4;
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
}

.feature-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* Login Panel */
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
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

/* Connection Status - Fixed for Mobile */
.connection-status {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  flex-shrink: 0;
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
  align-items: flex-start;
  gap: 0.75rem;
}

.status-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-text {
  flex: 1;
  min-width: 0; /* Prevent text overflow */
}

.status-title {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  color: var(--text);
  line-height: 1.2;
  word-wrap: break-word;
}

.status-desc {
  font-size: 0.75rem;
  opacity: 0.7;
  line-height: 1.3;
  color: var(--text-secondary);
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
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
  line-height: 1.2;
  word-wrap: break-word;
}

.form-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.3;
}

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
  color: var(--text-tertiary);
  z-index: 2;
}

.modern-input {
  width: 100%;
  padding: 0.875rem 0.875rem 0.875rem 2.75rem;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 0.9rem;
  background: var(--surface);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.modern-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
  margin-top: auto;
  flex-shrink: 0;
}

.modern-login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
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

.btn-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1rem;
}

/* Demo Section */
.demo-section {
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.section-divider {
  text-align: center;
  margin-bottom: 1rem;
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
  padding: 0 0.75rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.demo-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 60px;
}

.demo-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
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
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

.demo-card:hover::before {
  transform: scaleX(1);
}

.demo-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
  flex-shrink: 0;
  min-width: 45px;
  text-align: center;
}

.demo-card.admin .demo-badge {
  background: var(--primary);
}

.demo-card.user .demo-badge {
  background: var(--secondary);
}

.demo-info {
  flex: 1;
  min-width: 0;
}

.demo-username {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.125rem;
  font-size: 0.85rem;
  line-height: 1.2;
}

.demo-password {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Consolas', monospace;
  line-height: 1.2;
}

.demo-arrow {
  color: var(--text-tertiary);
  font-weight: 600;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  font-size: 0.9rem;
}

.demo-card:hover .demo-arrow {
  transform: translateX(3px);
  color: var(--primary);
}

/* System Info */
.system-info {
  border-top: 1px solid var(--border);
  padding-top: 1.25rem;
  flex-shrink: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.info-item {
  text-align: center;
}

.info-label {
  display: block;
  font-size: 0.65rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.info-value {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
}

.info-status {
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  display: inline-block;
  line-height: 1;
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

/* ==================== RESPONSIVE FIXES ==================== */

/* Tablet */
@media (max-width: 1024px) {
  .login-content {
    grid-template-columns: 1fr 1.1fr;
    max-width: 900px;
  }
  
  .brand-panel {
    padding: 1.5rem;
  }
  
  .login-panel {
    padding: 1.5rem;
  }
  
  .brand-title {
    font-size: 1.75rem;
  }
}

/* Mobile - Switch to single column */
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
    padding: 2rem 1.5rem;
    min-height: 200px;
  }
  
  .brand-content {
    max-width: none;
  }
  
  .logo-animation {
    width: 80px;
    height: 80px;
    margin-bottom: 1rem;
  }
  
  .logo-icon {
    font-size: 2.5rem;
  }
  
  .ring-1 { width: 65px; height: 65px; }
  .ring-2 { width: 75px; height: 75px; }
  .ring-3 { width: 85px; height: 85px; }
  
  .brand-title {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }
  
  .brand-subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
  
  .feature-list {
    display: none;
  }
  
  .login-panel {
    padding: 1.5rem;
    min-height: 500px;
  }
  
  .login-card {
    min-height: auto;
  }
  
  .form-title {
    font-size: 1.4rem;
  }
  
  .status-title {
    font-size: 0.8rem;
  }
  
  .status-desc {
    font-size: 0.7rem;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .login-container {
    padding: 0.25rem;
  }
  
  .login-content {
    border-radius: 16px;
  }
  
  .brand-panel {
    padding: 1.5rem 1rem;
    min-height: 180px;
  }
  
  .login-panel {
    padding: 1.25rem 1rem;
  }
  
  .logo-animation {
    width: 70px;
    height: 70px;
  }
  
  .logo-icon {
    font-size: 2rem;
  }
  
  .ring-1 { width: 55px; height: 55px; }
  .ring-2 { width: 65px; height: 65px; }
  .ring-3 { width: 75px; height: 75px; }
  
  .brand-title {
    font-size: 1.5rem;
  }
  
  .brand-subtitle {
    font-size: 0.85rem;
  }
  
  .connection-status {
    padding: 1rem;
    margin-bottom: 1.25rem;
  }
  
  .status-content {
    gap: 0.5rem;
  }
  
  .status-icon {
    font-size: 1.1rem;
  }
  
  .form-header {
    margin-bottom: 1.5rem;
  }
  
  .form-title {
    font-size: 1.3rem;
  }
  
  .modern-input {
    padding: 0.75rem 0.75rem 0.75rem 2.5rem;
    font-size: 0.85rem;
  }
  
  .input-icon {
    left: 0.75rem;
  }
  
  .modern-login-btn {
    padding: 0.875rem;
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
  }
  
  .demo-card {
    padding: 0.625rem 0.75rem;
    min-height: 55px;
  }
  
  .demo-badge {
    min-width: 40px;
    font-size: 0.6rem;
    padding: 0.2rem 0.4rem;
  }
  
  .demo-username {
    font-size: 0.8rem;
  }
  
  .demo-password {
    font-size: 0.65rem;
  }
  
  .info-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  
  .info-label {
    font-size: 0.6rem;
  }
  
  .info-value {
    font-size: 0.7rem;
  }
  
  .info-status {
    font-size: 0.6rem;
    padding: 0.15rem 0.3rem;
  }
}

/* Extra Small Devices */
@media (max-width: 360px) {
  .brand-title {
    font-size: 1.3rem;
  }
  
  .form-title {
    font-size: 1.2rem;
  }
  
  .modern-input {
    padding: 0.625rem 0.625rem 0.625rem 2.25rem;
  }
  
  .input-icon {
    left: 0.625rem;
    font-size: 0.9rem;
  }
  
  .demo-card {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  
  .demo-info {
    min-width: 100%;
    order: 3;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

/* Height adjustments for very short screens */
@media (max-height: 700px) {
  .login-container {
    align-items: flex-start;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  
  .login-content {
    max-height: 95vh;
    overflow-y: auto;
  }
}

/* Landscape mode fixes */
@media (max-height: 600px) and (orientation: landscape) {
  .login-container {
    padding: 0.5rem;
  }
  
  .login-content {
    grid-template-columns: 1fr 1fr;
    max-height: 95vh;
  }
  
  .brand-panel {
    padding: 1rem;
  }
  
  .login-panel {
    padding: 1rem;
  }
  
  .logo-animation {
    width: 60px;
    height: 60px;
    margin-bottom: 0.5rem;
  }
  
  .logo-icon {
    font-size: 1.75rem;
  }
  
  .feature-list {
    display: none;
  }
}
</style>