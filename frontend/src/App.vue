<template>
  <div id="app" :class="{
    'admin-theme': user?.role === 'admin',
    'stall-theme': user?.role === 'user',
    'dark-mode': darkMode
  }">
    <!-- Notifications -->
    <div class="notifications-container">
      <transition-group name="notification-slide">
        <div v-for="(notification, index) in notifications" :key="notification.id"
          :class="['notification', `notification-${notification.type}`]">
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

    <!-- Router View -->
    <router-view @show-notification="showNotification" />
  </div>
</template>

<script>
import { useAuthStore } from './stores/auth'

export default {
  name: 'App',
  data() {
    return {
      notifications: [],
      darkMode: false
    }
  },
  computed: {
    user() {
      const authStore = useAuthStore()
      return authStore.user
    }
  },
  mounted() {
    this.initializeApp()
  },
  methods: {
    initializeApp() {
      // Dark mode
      const storedDarkMode = localStorage.getItem('darkMode')
      if (storedDarkMode === 'true') {
        this.darkMode = true
        document.documentElement.classList.add('dark-theme')
      }
      
      // Check for hash-based navigation (backward compatibility)
      this.handleLegacyHashRouting()
    },
    
    handleLegacyHashRouting() {
      // Support old hash-based links
      const hash = window.location.hash
      if (hash) {
        console.log('📍 Legacy hash detected:', hash)
      }
    },
    
    showNotification(message, type = 'info') {
      const notification = {
        message,
        type,
        id: Date.now() + Math.random(),
        progress: 100,
      }
      this.notifications.push(notification)

      const progressInterval = setInterval(() => {
        const noteIndex = this.notifications.findIndex((n) => n.id === notification.id)
        if (noteIndex !== -1) {
          this.notifications[noteIndex].progress -= 2
        }
      }, 100)

      setTimeout(() => {
        clearInterval(progressInterval)
        const index = this.notifications.findIndex((n) => n.id === notification.id)
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
        info: 'Information',
      }
      return titles[type] || 'Notification'
    }
  }
}
</script>

<style>
/* ===== ROOT VARIABLES ===== */
:root {
  --primary: #F94908;
  --primary-dark: #d63d07;
  --primary-light: #fa6a2e;
  --primary-gradient: linear-gradient(135deg, #F94908, #fa6a2e);
  --secondary: #64748b;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  --background: #f8fafc;
  --surface: #ffffff;
  --surface-elevated: #f1f5f9;
  --text: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --radius-sm: 6px;
  --radius: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
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

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ===== NOTIFICATIONS ===== */
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

.notification-success { border-left-color: var(--success); }
.notification-error { border-left-color: var(--error); }
.notification-warning { border-left-color: var(--warning); }
.notification-info { border-left-color: var(--info); }

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

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .notifications-container {
    left: var(--space);
    right: var(--space);
    max-width: none;
  }
  .notification {
    min-width: auto;
  }
}

/* ===== ACCESSIBILITY ===== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>