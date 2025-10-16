 <!-- Force Deploy -->
<template>
  <div id="app" :class="{
    'admin-theme': user?.role === 'admin', 
    'stall-theme': user?.role === 'user',
    'dark-mode': darkMode
  }">
    <!-- PWA Install Prompt -->
    <div v-if="showInstallPrompt" class="pwa-install-prompt">
      <div class="install-content">
        <div class="install-info">
          <div class="install-icon">🍗</div>
          <div class="install-text">
            <h3>Install AGG System</h3>
            <p>Get the app experience on your device</p>
          </div>
        </div>
        <div class="install-actions">
          <button @click="dismissInstall" class="btn btn-outline">Later</button>
          <button @click="installPWA" class="btn btn-primary">Install</button>
        </div>
      </div>
    </div>

    <div v-if="!user" class="auth-container">
      <Login @login-success="handleLoginSuccess" />
    </div>
    
    <div v-else class="app-layout">
      <!-- Modern Header -->
      <header class="app-header">
        <div class="header-content">
          <div class="brand">
            <div class="logo">
              <span class="logo-icon">🍗</span>
              <div class="logo-text">
                <h1>Ayam Goreng Gunting</h1>
                <span class="tagline">Business Management System</span>
              </div>
            </div>
          </div>
          <div class="header-controls">
            <div class="control-group">
              <button @click="toggleDarkMode" class="control-btn" :title="darkMode ? 'Light mode' : 'Dark mode'">
                <span class="control-icon">{{ darkMode ? '☀️' : '🌙' }}</span>
              </button>
              <div class="user-menu">
                <span class="user-greeting">Hello, {{ user.username }}</span>
                <div class="user-badge">
                  <span class="user-role">{{ user.role === 'admin' ? 'Administrator' : `Stall ${user.stall_id}` }}</span>
                </div>
              </div>
            </div>
            <button @click="logout" class="btn btn-ghost logout-btn">
              <span class="btn-icon">↩</span>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="main-content">
        <div class="content-wrapper">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner">
              <div class="spinner-ring"></div>
            </div>
            <p>Loading your dashboard...</p>
          </div>
          
          <div v-else class="dashboard-container">
            <StallView 
              v-if="user.role === 'user'" 
              :stallId="user.stall_id" 
              :token="token" 
              @show-notification="showNotification"
            />
            
            <AdminDashboard 
              v-if="user.role === 'admin'" 
              :token="token" 
              @show-notification="showNotification"
            />
          </div>
        </div>
      </main>

      <!-- Enhanced Notifications -->
      <div class="notifications-container">
        <transition-group name="notification-slide">
          <div 
            v-for="(notification, index) in notifications" 
            :key="notification.id"
            :class="['notification', `notification-${notification.type}`]"
          >
            <div class="notification-icon">
              <span v-if="notification.type === 'success'">✅</span>
              <span v-else-if="notification.type === 'error'">❌</span>
              <span v-else-if="notification.type === 'warning'">⚠️</span>
              <span v-else>ℹ️</span>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ getNotificationTitle(notification.type) }}</div>
              <div class="notification-message">{{ notification.message }}</div>
            </div>
            <button @click="removeNotification(index)" class="notification-close">
              <span>×</span>
            </button>
            <div class="notification-progress" :style="{ width: notification.progress + '%' }"></div>
          </div>
        </transition-group>
      </div>

      <!-- Modern Footer -->
      <footer class="app-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="footer-logo">🍗 AGG System</span>
            <span class="footer-version">v2.0</span>
          </div>
          <div class="footer-info">
            <span class="status-indicator" :class="{ online: isOnline }">
              <span class="status-dot"></span>
              {{ isOnline ? 'System Online' : 'Offline Mode' }}
            </span>
            <span class="last-sync">Last updated: {{ lastUpdateTime }}</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import Login from './components/Login.vue'
import StallView from './components/StallView.vue'
import AdminDashboard from './components/AdminDashboard.vue'

export default {
  name: 'App',
  components: {
    Login,
    StallView,
    AdminDashboard
  },
  data() {
    return {
      user: null,
      token: null,
      notifications: [],
      darkMode: false,
      loading: false,
      lastUpdateTime: 'Just now',
      isPWA: false,
      showInstallPrompt: false,
      deferredPrompt: null,
      updateSW: null,
      isOnline: true
    }
  },
  methods: {
    handleLoginSuccess(userData, authToken) {
      this.loading = true
      
      setTimeout(() => {
        this.user = userData
        this.token = authToken
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', authToken)
        localStorage.setItem('darkMode', this.darkMode)
        this.loading = false
        this.showNotification(`Welcome back, ${userData.username}!`, 'success')
        this.updateLastUpdateTime()
      }, 1200)
    },
    
    logout() {
      this.showNotification('Signing out...', 'info')
      
      setTimeout(() => {
        this.user = null
        this.token = null
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        this.showNotification('Signed out successfully', 'success')
      }, 600)
    },
    
    showNotification(message, type = 'info') {
      const notification = { 
        message, 
        type, 
        id: Date.now() + Math.random(),
        progress: 100
      }
      
      this.notifications.push(notification)
      
      // Animate progress bar
      const progressInterval = setInterval(() => {
        const noteIndex = this.notifications.findIndex(n => n.id === notification.id)
        if (noteIndex !== -1) {
          this.notifications[noteIndex].progress -= 2
        }
      }, 100)

      // Auto-remove after 5 seconds
      setTimeout(() => {
        clearInterval(progressInterval)
        const index = this.notifications.findIndex(n => n.id === notification.id)
        if (index !== -1) {
          this.notifications.splice(index, 1)
        }
      }, 5000)
    },
    
    removeNotification(index) {
      this.notifications.splice(index, 1)
    },
    
    getNotificationTitle(type) {
      const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information'
      }
      return titles[type] || 'Notification'
    },
    
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      localStorage.setItem('darkMode', this.darkMode)
      this.applyTheme()
      this.showNotification(
        this.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 
        'info'
      )
    },
    
    applyTheme() {
      if (this.darkMode) {
        document.documentElement.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
      }
    },
    
    updateLastUpdateTime() {
      const now = new Date()
      this.lastUpdateTime = now.toLocaleTimeString('en-MY', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    },
    
    initializePWA() {
      this.isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        this.deferredPrompt = e
        setTimeout(() => {
          this.showInstallPrompt = true
        }, 3000)
      })

      window.addEventListener('appinstalled', () => {
        this.showInstallPrompt = false
        this.deferredPrompt = null
        this.isPWA = true
        this.showNotification('App installed successfully!', 'success')
      })
    },

    async installPWA() {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt()
        const { outcome } = await this.deferredPrompt.userChoice
        if (outcome === 'accepted') {
          this.showInstallPrompt = false
        }
        this.deferredPrompt = null
      }
    },

    dismissInstall() {
      this.showInstallPrompt = false
      localStorage.setItem('installPromptDismissed', Date.now().toString())
    },

    checkNetworkStatus() {
      this.isOnline = navigator.onLine
      
      window.addEventListener('online', () => {
        this.isOnline = true
        this.showNotification('Connection restored', 'success')
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        this.showNotification('Working in offline mode', 'warning')
      })
    },
    
    initializeApp() {
      // Load preferences
      const storedDarkMode = localStorage.getItem('darkMode')
      if (storedDarkMode === 'true') {
        this.darkMode = true
      }
      this.applyTheme()

      // Auto-update time
      setInterval(() => {
        this.updateLastUpdateTime()
      }, 60000)

      // Check for stored auth
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')
      
      if (storedUser && storedToken) {
        this.loading = true
        setTimeout(() => {
          this.user = JSON.parse(storedUser)
          this.token = storedToken
          this.loading = false
          this.showNotification('Welcome back!', 'success')
          this.updateLastUpdateTime()
        }, 1000)
      }
    }
  },
  mounted() {
    this.initializeApp()
    this.initializePWA()
    this.checkNetworkStatus()
    
    // Global error handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      this.showNotification('Something went wrong. Please try again.', 'error')
    })
  }
}
</script>

<style>
/* ===== MODERN DESIGN SYSTEM ===== */
:root {
  /* Colors - Light Theme */
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #8b5cf6;
  --secondary: #64748b;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Neutrals */
  --background: #f8fafc;
  --surface: #ffffff;
  --surface-elevated: #ffffff;
  --text: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  
  /* Transitions */
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark Theme */
.dark-theme {
  --background: #0f172a;
  --surface: #1e293b;
  --surface-elevated: #334155;
  --text: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --border: #334155;
  --border-light: #1e293b;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
}

/* Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background: var(--background);
  color: var(--text);
  line-height: 1.6;
  transition: var(--transition-slow);
}

/* Smooth transitions */
.app-layout * {
  transition: var(--transition);
}

/* ===== LAYOUT COMPONENTS ===== */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Modern Header */
.app-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.8);
}

.dark-theme .app-header {
  background: rgba(30, 41, 59, 0.8);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.brand {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.logo-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text h1 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.tagline {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.control-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.control-btn {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-sm);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: var(--surface-elevated);
  border-color: var(--primary);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.user-greeting {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.user-badge {
  background: var(--primary);
  color: white;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

/* Button System */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space);
  border-radius: var(--radius);
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-outline:hover {
  background: var(--surface-elevated);
  border-color: var(--primary);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--surface-elevated);
  color: var(--text);
}

.btn-icon {
  font-size: var(--font-size);
}

.logout-btn {
  color: var(--error);
}

.logout-btn:hover {
  background: var(--error);
  color: white;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: var(--space-lg);
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-container {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Loading States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--text-secondary);
}

.loading-spinner {
  position: relative;
  width: 48px;
  height: 48px;
  margin-bottom: var(--space);
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Enhanced Notifications */
.notifications-container {
  position: fixed;
  top: var(--space);
  right: var(--space);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-width: 400px;
}

.notification {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid var(--primary);
  padding: var(--space);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  gap: var(--space);
  min-width: 320px;
  animation: slideInRight 0.3s ease-out;
}

.notification-success {
  border-left-color: var(--success);
}

.notification-error {
  border-left-color: var(--error);
}

.notification-warning {
  border-left-color: var(--warning);
}

.notification-info {
  border-left-color: var(--info);
}

.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-xs);
}

.notification-message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: var(--transition);
  flex-shrink: 0;
}

.notification-close:hover {
  background: var(--background);
  color: var(--text);
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  transition: width 0.1s linear;
}

/* Modern Footer */
.app-footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: var(--space) 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.footer-logo {
  font-weight: 600;
}

.footer-version {
  background: var(--background);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error);
}

.status-indicator.online .status-dot {
  background: var(--success);
}

.last-sync {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: var(--font-size-xs);
}

/* PWA Install Prompt */
.pwa-install-prompt {
  position: fixed;
  bottom: var(--space);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 10000;
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
}

.install-content {
  padding: var(--space);
  display: flex;
  flex-direction: column;
  gap: var(--space);
}

.install-info {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.install-icon {
  font-size: 2rem;
  background: var(--primary);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.install-text h3 {
  font-size: var(--font-size);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-xs);
}

.install-text p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.install-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    padding: 0 var(--space);
    flex-direction: column;
    gap: var(--space);
    height: auto;
    padding: var(--space);
  }

  .header-controls {
    width: 100%;
    justify-content: space-between;
  }

  .user-greeting {
    display: none;
  }

  .main-content {
    padding: var(--space);
  }

  .footer-content {
    flex-direction: column;
    gap: var(--space);
    text-align: center;
  }

  .notifications-container {
    left: var(--space);
    right: var(--space);
    max-width: none;
  }

  .notification {
    min-width: auto;
  }
}

/* Print Styles */
@media print {
  .app-header,
  .notifications-container,
  .app-footer,
  .pwa-install-prompt {
    display: none !important;
  }
  
  .main-content {
    padding: 0;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus styles */
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>