<template>
  <div class="dashboard-wrapper">
    <!-- Dashboard Header -->
    <DashboardHeader 
      :role-text="userRoleText"
      :dark-mode="darkMode"
      :notifications-enabled="notificationsEnabled"
      :banner-url="systemBanner"
      @toggle-dark-mode="toggleDarkMode"
      @toggle-notifications="toggleNotifications"
      @logout="handleLogout"
    />
    
    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"><div class="spinner-ring"></div></div>
          <p>Loading your dashboard...</p>
        </div>
        <div v-else class="dashboard-container">
          <template v-if="user && user.role">
            <!-- Super Super Admin -->
            <SuperSuperAdminPanel
              v-if="user.role === 'super_super_admin'"
              :token="token || ''"
              @show-notification="emitNotification"
            />
            
            <!-- Super Admin -->
            <SuperAdminPanel
              v-else-if="user.role === 'super_admin'"
              :token="token || ''"
              @show-notification="emitNotification"
              :company-logo="companyLogo"
            />
            
            <!-- Stall Admin -->
            <StallAdminPanel
              v-else-if="user.role === 'stall_admin'"
              :token="token || ''"
              @show-notification="emitNotification"
            />
            
            <!-- Cashier -->
            <StallView
              v-else-if="user.role === 'cashier' && isValidStallId"
              :key="stallIdForView"
              :stallId="stallIdForView"
              :token="token || ''"
              :role="user.role"
              @show-notification="emitNotification"
            />
          </template>
        </div>
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <span class="footer-logo">🍗 Chickory Hub</span>
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
</template>

<script>
import DashboardHeader from './DashboardHeader.vue'
import SuperSuperAdminPanel from './SuperSuperAdminPanel.vue'
import SuperAdminPanel from './SuperAdminPanel.vue'
import StallAdminPanel from './StallAdminPanel.vue'
import StallView from './StallView.vue'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'DashboardWrapper',
  components: {
    DashboardHeader,
    SuperSuperAdminPanel,
    SuperAdminPanel,
    StallAdminPanel,
    StallView
  },
  data() {
    return {
      user: null,
      token: null,
      loading: false,
      darkMode: false,
      notificationsEnabled: true,
      lastUpdateTime: 'Just now',
      isOnline: true,
      companyLogo: localStorage.getItem('companyLogo') || null,
      systemBanner: localStorage.getItem('systemBanner') || null,
      activeStallId: null
    }
  },
  computed: {
    userRoleText() {
      if (!this.user) return 'Guest'
      const roleMap = {
        'super_super_admin': 'Super Super Admin',
        'super_admin': 'Super Admin',
        'stall_admin': 'Stall Admin',
        'cashier': 'Cashier'
      }
      return roleMap[this.user.role] || this.user.role || 'User'
    },
    stallIdForView() {
      if (!this.user) return ''
      if (this.user.role === 'super_super_admin' || this.user.role === 'super_admin' || this.user.role === 'stall_admin') {
        return ''
      }
      const stallId = this.activeStallId || this.user.stall_id
      return stallId ? String(stallId) : ''
    },
    isValidStallId() {
      const id = this.stallIdForView
      return id !== '' && id !== null && id !== undefined
    }
  },
  mounted() {
    this.initializeDashboard()
    this.checkNetworkStatus()
    
    // Update time every minute
    setInterval(() => {
      this.updateLastUpdateTime()
    }, 60000)
  },
  methods: {
    initializeDashboard() {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser)
          this.user = userData
          this.token = storedToken
          this.activeStallId = userData.stall_id || null
          this.loading = false
          
          const authStore = useAuthStore()
          authStore.setUser(userData, storedToken)
          
          this.updateLastUpdateTime()
        } catch (error) {
          console.error('Failed to load user data:', error)
          this.handleLogout()
        }
      } else {
        this.$router.push('/login')
      }
    },
    handleLogout() {
      const authStore = useAuthStore()
      authStore.logout()
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      this.$router.push('/login')
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      localStorage.setItem('darkMode', this.darkMode)
      document.documentElement.classList.toggle('dark-theme', this.darkMode)
    },
    toggleNotifications() {
      this.notificationsEnabled = !this.notificationsEnabled
      localStorage.setItem('notificationsEnabled', JSON.stringify(this.notificationsEnabled))
    },
    emitNotification(data) {
      this.$emit('show-notification', data)
    },
    updateLastUpdateTime() {
      const now = new Date()
      this.lastUpdateTime = now.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    checkNetworkStatus() {
      this.isOnline = navigator.onLine
      window.addEventListener('online', () => {
        this.isOnline = true
        this.$emit('show-notification', { message: 'Connection restored', type: 'success' })
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
        this.$emit('show-notification', { message: 'Working in offline mode', type: 'warning' })
      })
    }
  }
}
</script>

<style scoped>
.dashboard-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background, #f8fafc);
}

.main-content {
  flex: 1;
  padding: var(--space-lg, 2rem);
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-container {
  animation: fadeIn 0.5s ease-out;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary, #64748b);
}

.loading-spinner {
  position: relative;
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid var(--primary, #F94908);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.app-footer {
  background: var(--surface, #fff);
  border-top: 1px solid var(--border, #e2e8f0);
  padding: 1rem 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.footer-logo {
  font-weight: 600;
  color: var(--primary, #F94908);
}

.footer-version {
  background: var(--background, #f8fafc);
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error, #ef4444);
}

.status-indicator.online .status-dot {
  background: var(--success, #10b981);
}

.last-sync {
  font-family: monospace;
  font-size: 0.75rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  .footer-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>