<template>
  <div class="login-container">
    <div class="login-background">
      <div class="background-pattern"></div>
    </div>
    
    <div class="login-card">
      <div class="card-header">
        <div class="logo-section">
          <div class="logo">🍗</div>
          <h1>Ayam Goreng Gunting</h1>
          <p class="subtitle">Business Management System</p>
        </div>
      </div>

      <div class="card-body">
        <!-- Connection Status -->
        <div class="connection-status" :class="connectionStatus">
          <div class="status-indicator"></div>
          <span class="status-text">
            {{ connectionStatus === 'online' ? 'Connected to server' : 
               connectionStatus === 'checking' ? 'Checking server connection...' : 
               'Server offline - starting in demo mode' }}
          </span>
        </div>

        <form @submit.prevent="login" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <div class="input-wrapper">
              <input 
                id="username"
                v-model="username" 
                type="text" 
                required
                placeholder="Enter your username"
                class="form-input"
                :disabled="connectionStatus === 'checking'"
              >
              <span class="input-icon">👤</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <div class="input-wrapper">
              <input 
                id="password"
                v-model="password" 
                type="password" 
                required
                placeholder="Enter your password"
                class="form-input"
                :disabled="connectionStatus === 'checking'"
              >
              <span class="input-icon">🔒</span>
            </div>
          </div>
          
          <button 
            type="submit" 
            :disabled="loading || connectionStatus !== 'online'" 
            class="btn btn-primary login-btn"
          >
            <span v-if="loading" class="btn-loading">
              <span class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
              Signing in...
            </span>
            <span v-else class="btn-content">
              <span class="btn-icon">→</span>
              Sign In
            </span>
          </button>
        </form>

        <div v-if="error" class="error-message">
          <div class="error-icon">⚠️</div>
          <div class="error-content">
            <div class="error-title">Login Failed</div>
            <div class="error-text">{{ error }}</div>
          </div>
        </div>

        <div class="demo-section">
          <div class="section-header">
            <h3>Demo Accounts</h3>
            <p>Try the system with sample data</p>
          </div>
          <div class="demo-accounts">
            <div 
              v-for="account in demoAccounts" 
              :key="account.username"
              class="demo-account"
              @click="fillDemoAccount(account)"
            >
              <div class="account-badge" :class="account.role">
                {{ account.role === 'admin' ? 'ADMIN' : 'STAFF' }}
              </div>
              <div class="account-info">
                <div class="account-username">{{ account.username }}</div>
                <div class="account-password">password: {{ account.password }}</div>
              </div>
              <div class="account-action">→</div>
            </div>
          </div>
        </div>

        <div class="system-info">
          <div class="info-item">
            <span class="info-label">Server:</span>
            <span class="info-value">http://localhost:5001/api</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span>
            <span :class="['info-status', connectionStatus]">
              {{ connectionStatus.toUpperCase() }}
            </span>
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
        // You could implement demo mode logic here
        return
      }

      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.post(`${API_BASE}/login`, {
          username: this.username,
          password: this.password
        }, { timeout: 5000 })
        
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
  padding: var(--space);
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
}

.login-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.card-header {
  padding: var(--space-xl);
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  text-align: center;
}

.logo-section .logo {
  font-size: 3rem;
  margin-bottom: var(--space);
}

.logo-section h1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: var(--space-xs);
}

.subtitle {
  opacity: 0.9;
  font-size: var(--font-size-sm);
}

.card-body {
  padding: var(--space-xl);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--space);
  padding: var(--space);
  border-radius: var(--radius);
  margin-bottom: var(--space-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.connection-status.checking {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.connection-status.online {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.connection-status.offline {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.checking .status-indicator {
  background: var(--info);
  animation: pulse 1s infinite;
}

.online .status-indicator {
  background: var(--success);
}

.offline .status-indicator {
  background: var(--warning);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.login-form {
  margin-bottom: var(--space-lg);
}

.form-group {
  margin-bottom: var(--space);
}

.form-label {
  display: block;
  margin-bottom: var(--space-xs);
  font-weight: 600;
  color: var(--text);
  font-size: var(--font-size-sm);
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: var(--space) var(--space) var(--space) var(--space-xl);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: var(--font-size);
  transition: var(--transition);
  background: var(--background);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-icon {
  position: absolute;
  left: var(--space);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
}

.login-btn {
  width: 100%;
  padding: var(--space);
  font-size: var(--font-size);
  margin-top: var(--space);
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.loading-dots {
  display: flex;
  gap: 2px;
}

.loading-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: bounce 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  } 40% {
    transform: scale(1);
  }
}

.btn-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn-icon {
  font-size: var(--font-size-lg);
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: var(--space);
  padding: var(--space);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius);
  margin-bottom: var(--space-lg);
}

.error-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: 600;
  color: var(--error);
  margin-bottom: var(--space-xs);
  font-size: var(--font-size-sm);
}

.error-text {
  color: var(--error);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.demo-section {
  border-top: 1px solid var(--border);
  padding-top: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.section-header {
  text-align: center;
  margin-bottom: var(--space);
}

.section-header h3 {
  font-size: var(--font-size);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-xs);
}

.section-header p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.demo-accounts {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.demo-account {
  display: flex;
  align-items: center;
  gap: var(--space);
  padding: var(--space);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: var(--transition);
}

.demo-account:hover {
  background: var(--surface-elevated);
  border-color: var(--primary);
  transform: translateY(-1px);
}

.account-badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  color: white;
}

.account-badge.admin {
  background: var(--primary);
}

.account-badge.user {
  background: var(--secondary);
}

.account-info {
  flex: 1;
}

.account-username {
  font-weight: 600;
  color: var(--text);
  font-size: var(--font-size-sm);
  margin-bottom: 2px;
}

.account-password {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-family: 'Monaco', 'Consolas', monospace;
}

.account-action {
  color: var(--text-tertiary);
  font-weight: 600;
}

.system-info {
  border-top: 1px solid var(--border);
  padding-top: var(--space);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.info-label {
  font-weight: 600;
}

.info-value {
  font-family: 'Monaco', 'Consolas', monospace;
}

.info-status {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
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
@media (max-width: 480px) {
  .login-card {
    margin: var(--space);
  }
  
  .card-header,
  .card-body {
    padding: var(--space);
  }
  
  .demo-account {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
  
  .account-action {
    align-self: flex-end;
  }
}
</style>