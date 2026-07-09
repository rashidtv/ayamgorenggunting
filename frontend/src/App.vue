<template>
  <div id="app" :class="{
    'admin-theme': user?.role === 'admin',
    'stall-theme': user?.role === 'user',
    'dark-mode': darkMode
  }">

    <FirstLoginReset 
      v-if="showFirstLoginReset"
      @reset-complete="handleResetComplete"
    />
    <!-- PWA Install Prompt -->
    <div v-if="showInstallPrompt" class="pwa-install-prompt">
      <div class="install-content">
        <div class="install-info">
          <div class="install-icon">🍗</div>
          <div class="install-text">
            <h3>Install Chickory Hub</h3>
            <p>Get the app experience on your device</p>
          </div>
        </div>
        <div class="install-actions">
          <button @click="dismissInstall" class="btn btn-outline">Later</button>
          <button @click="installPWA" class="btn btn-primary">Install</button>
        </div>
      </div>
    </div>

    <!-- ===== PUBLIC PAGES ===== -->
    <template v-if="!user">

    <ResetPassword 
      v-if="showResetPassword && resetToken"
      :token="resetToken"
      @reset-complete="showResetPassword = false"
    />
      <!-- Landing Page -->
      <LandingPage 
        v-if="!showLogin"
        @show-login="showLogin = true"
        @show-notification="showNotification"
      />
      
      <!-- Login Page -->
      <Login 
        v-else
        @login-success="handleLoginSuccess"
        @show-first-login-reset="showFirstLoginReset = true"
        @show-landing="showLogin = false"
        :company-logo="companyLogo"
      />
    </template>

    <!-- ===== AUTHENTICATED APP ===== -->
    <div v-else class="app-layout">
      <!-- Logo Upload Modal -->
      <div v-if="logoUploadModal" class="modal-overlay" @click.self="logoUploadModal=false">
        <div class="modal-modern">
          <div class="modal-modern-header">
            <h3>Upload Company Logo</h3>
            <button @click="logoUploadModal=false" class="modal-close-btn">✕</button>
          </div>
          <div class="modal-modern-body">
            <div class="logo-upload-area" @dragover.prevent @drop.prevent="handleLogoDrop">
              <input type="file" ref="logoInput" accept="image/*" @change="handleLogoUpload" style="display:none" />
              <button @click="$refs.logoInput.click()" class="btn-modern primary">
                📁 Choose Image
              </button>
              <p class="upload-hint">Drag & drop or click to upload (PNG, JPG, SVG)</p>
            </div>
            <div v-if="tempLogoPreview" class="logo-preview">
              <img :src="tempLogoPreview" alt="Logo preview" />
            </div>
          </div>
          <div class="modal-modern-footer">
            <button @click="logoUploadModal=false" class="btn-modern secondary">Cancel</button>
            <button @click="saveLogo" class="btn-modern primary">Save Logo</button>
          </div>
        </div>
      </div>

      <!-- ===== GLOBAL HEADER ===== -->
      <DashboardHeader 
        :role-text="userRoleText"
        :dark-mode="darkMode"
        :notifications-enabled="notificationsEnabled"
        :banner-url="systemBanner"
        @toggle-dark-mode="toggleDarkMode"
        @toggle-notifications="toggleNotifications"
        @logout="logout"
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
                @show-notification="showNotification"
              />
              
              <!-- Super Admin -->
              <SuperAdminPanel
                v-else-if="user.role === 'super_admin'"
                :token="token || ''"
                @show-notification="showNotification"
                :company-logo="companyLogo"
              />
              
              <!-- Stall Admin -->
              <StallAdminPanel
                v-else-if="user.role === 'stall_admin'"
                :token="token || ''"
                @show-notification="showNotification"
              />
              
              <!-- Cashier -->
              <StallView
                v-else-if="user.role === 'cashier' && isValidStallId"
                :key="stallIdForView"
                :stallId="stallIdForView"
                :token="token || ''"
                :role="user.role"
                @show-notification="showNotification"
              />
            </template>
          </div>
        </div>
      </main>

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
  </div>
</template>

<script>
import axios from 'axios'
import Login from './components/Login.vue';
import LandingPage from './components/LandingPage.vue';
import FirstLoginReset from './components/FirstLoginReset.vue';
import ResetPassword from './components/ResetPassword.vue';
import StallView from './components/StallView.vue';
import SuperAdminPanel from './components/SuperAdminPanel.vue';
import SuperSuperAdminPanel from './components/SuperSuperAdminPanel.vue';
import StallAdminPanel from './components/StallAdminPanel.vue';
import DashboardHeader from './components/DashboardHeader.vue';
import { useAuthStore } from './stores/auth';
import API_BASE from './config/api.js';

export default {
  name: 'App',
  components: {
    Login,
    LandingPage,
    ResetPassword,
    StallView,
    SuperAdminPanel,
    SuperSuperAdminPanel,
    FirstLoginReset,
    StallAdminPanel,
    DashboardHeader,
  },
  data() {
    return {
      user: null,
      token: null,
      notifications: [],
      darkMode: false,
      loading: false,
      showFirstLoginReset: false,
      lastUpdateTime: 'Just now',
      isPWA: false,
      showInstallPrompt: false,
      deferredPrompt: null,
      isOnline: true,
      activeStallId: null,
      notificationsEnabled: true,
      companyLogo: localStorage.getItem('companyLogo') || null,
      logoUploadModal: false,
      tempLogoPreview: null,
      tempLogoFile: null,
      systemBanner: localStorage.getItem('systemBanner') || null,
      showLogin: false,
      showResetPassword: false,
      resetToken: null,
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
    userRoleText() {
      if (!this.user) return 'Guest';
      const roleMap = {
        'super_super_admin': 'Super Super Admin',
        'super_admin': 'Super Admin',
        'stall_admin': 'Stall Admin',
        'cashier': 'Cashier'
      };
      return roleMap[this.user.role] || this.user.role || 'User';
    },
    stallIdForView() {
      if (!this.user) return '';
      if (this.user.role === 'super_super_admin' || this.user.role === 'super_admin' || this.user.role === 'stall_admin') {
        return '';
      }
      const stallId = this.activeStallId || this.user.stall_id;
      return stallId ? String(stallId) : '';
    },
    isValidStallId() {
      const id = this.stallIdForView;
      return id !== '' && id !== null && id !== undefined;
    },
  },
  watch: {
    user: {
      handler(newUser) {
        if (newUser) {
          const authStore = useAuthStore();
          this.activeStallId = authStore.activeStallId || newUser.stall_id || null;
        }
      },
      immediate: true,
    },
  },
  
  mounted() {
    this.initializeApp();
    this.initializePWA();
    this.checkNetworkStatus();

    if (sessionStorage.getItem('needsPasswordReset')) {
      this.showFirstLoginReset = true;
      this.showLogin = false;
    }
    
    this.handleUrlRouting();
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showNotification('Something went wrong. Please try again.', 'error');
    });
  },
  
  methods: {
    // =============================================
    // FIRST LOGIN RESET
    // =============================================
    handleResetComplete() {
      this.showFirstLoginReset = false;
      this.showLogin = true;
    },

    // =============================================
    // ROUTING HANDLING
    // =============================================
    handleUrlRouting() {
      const path = window.location.pathname;
      const hash = window.location.hash;
      
      console.log('📍 Path:', path);
      console.log('📍 Hash:', hash);
      
      if (path === '/login' || hash === '#/login') {
        this.showLogin = true;
        console.log('🔐 Login page detected, showing login');
        return;
      }
      
      if (path.startsWith('/reset-password') || hash.startsWith('#/reset-password')) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
          this.resetToken = token;
          this.showResetPassword = true;
          this.showLogin = false;
          return;
        }
      }
      
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        this.showLogin = false;
        return;
      }
      
      this.showLogin = false;
    },

    // =============================================
    // LOGO MANAGEMENT
    // =============================================
    openLogoUpload() {
      this.logoUploadModal = true
    },
    handleLogoUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.tempLogoFile = file
        const reader = new FileReader()
        reader.onload = (e) => {
          this.tempLogoPreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    handleLogoDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.tempLogoFile = file
        const reader = new FileReader()
        reader.onload = (e) => {
          this.tempLogoPreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    saveLogo() {
      if (this.tempLogoPreview) {
        this.companyLogo = this.tempLogoPreview
        localStorage.setItem('companyLogo', this.tempLogoPreview)
        this.logoUploadModal = false
        this.showNotification('Logo updated successfully!', 'success')
      }
    },

    // =============================================
    // BANNER MANAGEMENT
    // =============================================
    async fetchBanner() {
      try {
        const response = await axios.get(`${API_BASE}/system/banner`)
        if (response.data.bannerUrl) {
          this.systemBanner = response.data.bannerUrl
          localStorage.setItem('systemBanner', response.data.bannerUrl)
        }
      } catch (err) {
        console.log('No system banner found')
      }
    },

    // =============================================
    // AUTHENTICATION
    // =============================================
    handleLoginSuccess(responseData) {
      console.log('🔵 handleLoginSuccess called with:', responseData);
      
      const userData = responseData?.user;
      const authToken = responseData?.token;
      
      if (!userData || !authToken) {
        console.error('❌ Invalid login response:', responseData);
        this.showNotification('Login failed. Please try again.', 'error');
        return;
      }

      console.log('✅ User data extracted:', userData);
      console.log('✅ Token extracted:', authToken);
      
      this.loading = true;
      const authStore = useAuthStore();

      const safeUserData = {
        ...userData,
        stall_id: userData.stall_id || null,
        assigned_stalls: userData.assigned_stalls || [],
      };

      authStore.setUser(safeUserData, authToken);

      this.$nextTick(() => {
        setTimeout(() => {
          this.user = safeUserData;
          this.token = authToken;
          this.activeStallId = authStore.activeStallId || safeUserData.stall_id || null;
          localStorage.setItem('user', JSON.stringify(safeUserData));
          localStorage.setItem('token', authToken);
          localStorage.setItem('darkMode', this.darkMode);
          console.log('✅ User saved to localStorage:', localStorage.getItem('user'));
          this.loading = false;
          this.showLogin = false;
          this.showNotification(`Welcome back, ${safeUserData.username}!`, 'success');
          this.updateLastUpdateTime();
          this.fetchBanner();
        }, 500);
      });
    },

    logout() {
      const authStore = useAuthStore();
      authStore.logout();
      this.showNotification('Signing out...', 'info');

      setTimeout(() => {
        this.user = null;
        this.token = null;
        this.activeStallId = null;
        this.showLogin = false;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.showNotification('Signed out successfully', 'success');
      }, 600);
    },

    // =============================================
    // NOTIFICATIONS
    // =============================================
    showNotification(message, type = 'info') {
      if (!this.notificationsEnabled) {
        console.log(`[🔕 Notification disabled] ${type}: ${message}`);
        return;
      }
      
      const notification = {
        message,
        type,
        id: Date.now() + Math.random(),
        progress: 100,
      };
      this.notifications.push(notification);

      const progressInterval = setInterval(() => {
        const noteIndex = this.notifications.findIndex((n) => n.id === notification.id);
        if (noteIndex !== -1) {
          this.notifications[noteIndex].progress -= 2;
        }
      }, 100);

      setTimeout(() => {
        clearInterval(progressInterval);
        const index = this.notifications.findIndex((n) => n.id === notification.id);
        if (index !== -1) {
          this.notifications.splice(index, 1);
        }
      }, 5000);
    },

    toggleNotifications() {
      this.notificationsEnabled = !this.notificationsEnabled;
      localStorage.setItem('notificationsEnabled', JSON.stringify(this.notificationsEnabled));
      
      if (this.notificationsEnabled) {
        this.showNotification('🔔 Notifications enabled', 'success');
      } else {
        const tempEnabled = this.notificationsEnabled;
        this.notificationsEnabled = true;
        const notification = {
          message: '🔕 Notifications disabled',
          type: 'info',
          id: Date.now() + Math.random(),
          progress: 100,
        };
        this.notifications.push(notification);
        
        setTimeout(() => {
          const index = this.notifications.findIndex((n) => n.id === notification.id);
          if (index !== -1) {
            this.notifications.splice(index, 1);
          }
        }, 3000);
        
        this.notificationsEnabled = tempEnabled;
      }
    },

    removeNotification(index) {
      this.notifications.splice(index, 1);
    },

    getNotificationTitle(type) {
      const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information',
      };
      return titles[type] || 'Notification';
    },

    // =============================================
    // THEME
    // =============================================
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
      this.applyTheme();
      this.showNotification(
        this.darkMode ? 'Dark mode enabled' : 'Light mode enabled',
        'info'
      );
    },

    applyTheme() {
      if (this.darkMode) {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
    },

    updateLastUpdateTime() {
      const now = new Date();
      this.lastUpdateTime = now.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    // =============================================
    // PWA
    // =============================================
    initializePWA() {
      this.isPWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        setTimeout(() => {
          this.showInstallPrompt = true;
        }, 3000);
      });

      window.addEventListener('appinstalled', () => {
        this.showInstallPrompt = false;
        this.deferredPrompt = null;
        this.isPWA = true;
        this.showNotification('App installed successfully!', 'success');
      });
    },

    async installPWA() {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          this.showInstallPrompt = false;
        }
        this.deferredPrompt = null;
      }
    },

    dismissInstall() {
      this.showInstallPrompt = false;
      localStorage.setItem('installPromptDismissed', Date.now().toString());
    },

    // =============================================
    // NETWORK
    // =============================================
    checkNetworkStatus() {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.showNotification('Connection restored', 'success');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.showNotification('Working in offline mode', 'warning');
      });
    },

    // =============================================
    // INIT
    // =============================================
    initializeApp() {
      const storedDarkMode = localStorage.getItem('darkMode');
      if (storedDarkMode === 'true') {
        this.darkMode = true;
      }
      this.applyTheme();

      const savedNotifications = localStorage.getItem('notificationsEnabled');
      if (savedNotifications !== null) {
        this.notificationsEnabled = JSON.parse(savedNotifications);
      }

      const savedLogo = localStorage.getItem('companyLogo');
      if (savedLogo) {
        this.companyLogo = savedLogo;
      }

      const savedBanner = localStorage.getItem('systemBanner');
      if (savedBanner) {
        this.systemBanner = savedBanner;
      }

      setInterval(() => {
        this.updateLastUpdateTime();
      }, 60000);

      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        this.loading = true;
        try {
          const userData = JSON.parse(storedUser);
          if (userData && typeof userData === 'object') {
            const safeUserData = {
              ...userData,
              stall_id: userData.stall_id || null,
              assigned_stalls: userData.assigned_stalls || [],
            };
            this.user = safeUserData;
            this.token = storedToken;
            const authStore = useAuthStore();
            authStore.setUser(safeUserData, storedToken);
            this.activeStallId = authStore.activeStallId || safeUserData.stall_id || null;
          } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        } finally {
          this.loading = false;
          if (this.user) {
            this.showNotification('Welcome back!', 'success');
            this.updateLastUpdateTime();
            this.fetchBanner();
          }
        }
      }
    },
  }
}
</script>

<style>
/* All your existing styles remain exactly the same */
/* ===== ROOT VARIABLES - Keep existing ===== */
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

.app-layout * {
  transition: var(--transition);
}

/* ===== LAYOUT ===== */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ===== LOGO UPLOAD MODAL ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-modern {
  background: var(--surface);
  border-radius: var(--radius);
  max-width: 480px;
  width: 92%;
  max-height: 90vh;
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

.modal-modern-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-modern-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0 0.25rem;
}

.modal-close-btn:hover {
  color: var(--text);
}

.modal-modern-body {
  padding: 1.25rem;
  overflow-y: auto;
  max-height: 60vh;
}

.logo-upload-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: center;
  margin-bottom: 1rem;
}

.logo-upload-area .btn-modern {
  margin-bottom: 0.5rem;
}

.btn-modern {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.8rem;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: var(--transition);
}

.btn-modern.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
}

.btn-modern.primary:hover {
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
  transform: translateY(-1px);
}

.btn-modern.secondary {
  background: var(--background);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-modern.secondary:hover {
  background: var(--surface-elevated);
  color: var(--text);
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.logo-preview {
  text-align: center;
  margin-top: 0.5rem;
}

.logo-preview img {
  max-width: 120px;
  max-height: 120px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.modal-modern-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* ===== MAIN CONTENT ===== */
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

/* ===== LOADING ===== */
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

/* ===== FOOTER ===== */
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
  color: var(--primary);
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

/* ===== PWA ===== */
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
  background: var(--primary-gradient);
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

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
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

/* ===== PRINT ===== */
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