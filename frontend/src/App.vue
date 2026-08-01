<template>
  <div id="app" :class="{
    'admin-theme': user?.role === 'admin',
    'stall-theme': user?.role === 'user',
    'dark-mode': darkMode
  }">

    <!-- ===== FIRST LOGIN RESET - HIGHEST PRIORITY ===== -->
    <FirstLoginReset 
      v-if="showFirstLoginReset"
      @reset-complete="handleResetComplete"
    />
    
    <!-- Resubmit Registration -->
    <ResubmitRegistration 
      v-if="showResubmitRegistration"
      @close="showResubmitRegistration = false"
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
      <!-- Landing Page -->
      <LandingPage 
        v-if="!showLogin"
        @show-login="showLogin = true"
        @show-notification="showNotification"
      />
      
      <!-- Login Page with Reset Overlay -->
      <div v-else class="login-page-wrapper" style="position: relative; min-height: 100vh;">
        <!-- Login Page -->
        <Login 
          @login-success="handleLoginSuccess"
          @show-first-login-reset="showFirstLoginReset = true"
          @show-landing="showLogin = false"
          :company-logo="companyLogo"
        />
        
        <!-- Reset Password Overlay - Only shows when login is active -->
        <ResetPassword 
          v-if="showResetPassword && resetToken"
          :token="resetToken"
          @reset-complete="handleResetComplete"
          @close="showResetPassword = false"
        />
      </div>
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
                :user="user"
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

      <!-- Notifications Container - FIXED POSITION -->
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

      <!-- Global Footer -->
      <GlobalFooter />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Login from './components/Login.vue';
import LandingPage from './components/LandingPage.vue';
import FirstLoginReset from './components/FirstLoginReset.vue';
import ResetPassword from './components/ResetPassword.vue';
import ResubmitRegistration from './components/ResubmitRegistration.vue';
import StallView from './components/StallView.vue';
import SuperAdminPanel from './components/SuperAdminPanel.vue';
import SuperSuperAdminPanel from './components/SuperSuperAdminPanel.vue';
import StallAdminPanel from './components/StallAdminPanel.vue';
import DashboardHeader from './components/DashboardHeader.vue';
import { useAuthStore } from './stores/auth';
import GlobalFooter from './components/GlobalFooter.vue';
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
    ResubmitRegistration,
    StallAdminPanel,
    DashboardHeader,
    GlobalFooter,
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
      showResubmitRegistration: false,
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

    if (window.location.hash === '#/first-login-reset' || window.location.hash.startsWith('#/first-login-reset')) {
      if (sessionStorage.getItem('needsPasswordReset')) {
        this.showFirstLoginReset = true;
        this.showLogin = false;
      } else {
        window.location.hash = '#/login';
      }
    }

    if (window.location.hash.startsWith('#/reset-password')) {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const token = params.get('token');
      if (token) {
        this.resetToken = token;
        this.showResetPassword = true;
        this.showLogin = true;
        this.showFirstLoginReset = false;
        console.log('✅ Reset token found on mount, showing login with overlay');
      }
    }

    if (sessionStorage.getItem('needsPasswordReset')) {
      this.showFirstLoginReset = true;
      this.showLogin = false;
    }
    
    this.handleUrlRouting();
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showNotification('Something went wrong. Please try again.', 'error');
    });
    
    window.addEventListener('hashchange', this.handleUrlRouting);
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
      
      if (hash === '#/first-login-reset' || hash.startsWith('#/first-login-reset')) {
        console.log('🔄 First login reset page detected');
        if (sessionStorage.getItem('needsPasswordReset')) {
          this.showFirstLoginReset = true;
          this.showLogin = false;
          return;
        } else {
          window.location.hash = '#/login';
          return;
        }
      }
      
      if (hash.startsWith('#/reset-password')) {
        console.log('🔑 Reset password page detected');
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const token = params.get('token');
        if (token) {
          this.resetToken = token;
          this.showResetPassword = true;
          this.showLogin = true;
          this.showFirstLoginReset = false;
          console.log('✅ Reset token found, showing login with overlay');
          return;
        } else {
          console.log('❌ No token found in reset link');
        }
      }

      if (hash.startsWith('#/resubmit-registration')) {
        console.log('📝 Resubmit registration page detected');
        this.showResubmitRegistration = true;
        this.showLogin = false;
        return;
      }

      if (path === '/login' || hash === '#/login') {
        this.showLogin = true;
        this.showFirstLoginReset = false;
        console.log('🔐 Login page detected, showing login');
        return;
      }
      
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        this.showLogin = false;
        return;
      }
      
      this.showLogin = false;
      this.showFirstLoginReset = false;
      this.showResetPassword = false;
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
          console.log('✅ App.vue - user set to:', this.user);
          console.log('✅ App.vue - user.assigned_stalls:', this.user?.assigned_stalls);
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
    // NOTIFICATIONS - FIXED
    // =============================================
    showNotification(message, type = 'info') {
      // Always show notifications regardless of settings
      const notification = {
        message,
        type,
        id: Date.now() + Math.random(),
        progress: 100,
      };
      
      // Add to array - the template will render it
      this.notifications.push(notification);

      // Auto dismiss after 5 seconds
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
        // Show a one-time notification that they're disabled
        const tempEnabled = this.notificationsEnabled;
        this.notificationsEnabled = true;
        this.showNotification('🔕 Notifications disabled', 'info');
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
    // THEME - FIXED
    // =============================================
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
      this.applyTheme();
      this.showNotification(
        this.darkMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled',
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
/* ============================================ */
/* GLOBAL CSS VARIABLES                         */
/* ============================================ */
:root {
  --primary: #F94908;
  --primary-light: #fa6a2e;
  --primary-dark: #d63d07;
  --surface: #ffffff;
  --surface-elevated: #f1f5f9;
  --background: #f8fafc;
  --text: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --shadow: 0 2px 8px rgba(0,0,0,0.06);
  --radius: 12px;
  --radius-sm: 8px;
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --notification-bg: #ffffff;
  --notification-text: #1e293b;
  --notification-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* ============================================ */
/* DARK THEME - FIXED                           */
/* ============================================ */
.dark-theme {
  --surface: #1e293b;
  --surface-elevated: #2d3748;
  --background: #0f172a;
  --text: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --border: #334155;
  --border-light: #1e293b;
  --shadow: 0 2px 8px rgba(0,0,0,0.3);
  --notification-bg: #1e293b;
  --notification-text: #f1f5f9;
  --notification-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--background);
  color: var(--text);
  line-height: 1.6;
  transition: background 0.3s ease, color 0.3s ease;
}

/* ============================================ */
/* NOTIFICATIONS CONTAINER - FIXED              */
/* ============================================ */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  width: 100%;
  pointer-events: none;
}

.notifications-container .notification {
  pointer-events: auto;
  background: var(--notification-bg);
  color: var(--notification-text);
  border-radius: var(--radius);
  box-shadow: var(--notification-shadow);
  padding: 14px 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-left: 4px solid var(--primary);
  animation: notificationSlideIn 0.4s ease forwards;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.notifications-container .notification.notification-success {
  border-left-color: #10b981;
}

.notifications-container .notification.notification-error {
  border-left-color: #ef4444;
}

.notifications-container .notification.notification-warning {
  border-left-color: #f59e0b;
}

.notifications-container .notification.notification-info {
  border-left-color: #3b82f6;
}

.notification-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.notification-message {
  font-size: 0.85rem;
  opacity: 0.9;
  word-wrap: break-word;
}

.notification-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 4px;
  flex-shrink: 0;
  margin-top: -2px;
  transition: color 0.2s ease;
}

.notification-close:hover {
  color: var(--text);
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--primary);
  transition: width 0.1s linear;
}

.notification.notification-success .notification-progress {
  background: #10b981;
}

.notification.notification-error .notification-progress {
  background: #ef4444;
}

.notification.notification-warning .notification-progress {
  background: #f59e0b;
}

.notification.notification-info .notification-progress {
  background: #3b82f6;
}

@keyframes notificationSlideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

/* ============================================ */
/* DROPDOWNS                                   */
/* ============================================ */
.tab-dropdown {
  position: relative;
  min-width: 160px;
  flex-shrink: 0;
}

.period-dropdown-wrapper {
  position: relative;
  min-width: 140px;
  flex-shrink: 0;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: #ffffff !important;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
  transition: var(--transition);
  width: 100%;
}

.dropdown-toggle:hover {
  border-color: var(--primary);
}

.dropdown-toggle.open .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-arrow {
  font-size: 0.6rem;
  color: var(--text-secondary);
  margin-left: auto;
  transition: transform 0.2s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: #ffffff !important;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 50;
  animation: dropdownSlide 0.2s ease;
  padding: 0.25rem 0 !important;
  min-width: 180px;
}

.period-menu {
  min-width: 140px;
  padding: 0.25rem 0 !important;
  max-width: 320px !important;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.75rem !important;
  background: #ffffff !important;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: var(--transition);
  text-align: left;
  margin: 0 !important;
}

.period-menu .dropdown-item {
  background: #ffffff !important;
}

.dropdown-item:hover {
  background: #f8fafc !important;
  color: var(--text);
}

.dropdown-item.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important;
  color: white !important;
}

.dropdown-badge {
  background: #ef4444;
  color: white;
  border-radius: 50%;
  padding: 0 6px;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
  line-height: 18px;
  margin-left: auto;
}

@keyframes dropdownSlide {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.custom-date-range {
  padding: 0.75rem;
  background: var(--background);
  border-top: 1px solid var(--border);
  margin-top: 0.25rem;
}

.date-range-inputs {
  display: flex;
  gap: 0.5rem;
}

.date-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.date-input-group label {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.date-input-group input {
  padding: 0.3rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  background: #ffffff;
  color: var(--text);
  width: 100%;
}

.date-input-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.06);
}

/* ============================================ */
/* STATS GRID - GLASS CARDS                    */
/* ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.stat-card.glass {
  height: 175px;
  min-height: unset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.75rem 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

/* Dark theme override for glass cards */
.dark-theme .stat-card.glass {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-card.glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    var(--stat-color-alpha, rgba(37, 99, 235, 0.08)),
    rgba(255, 255, 255, 0.05)
  );
  border-radius: 16px;
  z-index: 0;
  pointer-events: none;
}

.stat-card.glass::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    ellipse at 30% 20%,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
}

.stat-card.glass > * {
  position: relative;
  z-index: 1;
}

.stat-card.glass:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 40px var(--stat-color-alpha, rgba(37, 99, 235, 0.15));
  border-color: var(--stat-color, #2563eb);
}

.stat-card.glass.clickable {
  cursor: pointer;
}

.stat-card.glass.clickable:hover .stat-hover {
  opacity: 1;
  transform: translateX(0);
}

.stat-card.glass .stat-hover {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.5rem;
  color: var(--stat-color, #2563eb);
  opacity: 0;
  transition: all 0.3s ease;
  transform: translateX(10px);
  font-weight: 600;
  letter-spacing: 0.3px;
  z-index: 1;
}

.stat-card.glass .stat-icon {
  font-size: 2rem;
  line-height: 1;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.1rem;
  flex-shrink: 0;
}

.stat-card.glass .stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}

.stat-card.glass .stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.glass .stat-breakdown {
  font-size: 0.65rem;
  font-weight: 500;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.stat-card.glass .stat-breakdown-item {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  font-weight: 500;
}

.stat-card.glass .stat-breakdown-item.active {
  color: #10b981;
}

.stat-card.glass .stat-breakdown-item.inactive {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.stat-card.glass .stat-breakdown-divider {
  color: var(--text-tertiary);
  opacity: 0.3;
  font-size: 0.5rem;
}

.stat-card.glass .stat-sub-label {
  font-size: 0.65rem;
  font-weight: 500;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  opacity: 0.7;
  flex-shrink: 0;
}

.stat-card.glass .stat-trend {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 0.2rem;
  white-space: nowrap;
}

.stat-card.glass .stat-trend.up { 
  color: #10b981; 
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.2);
}

.stat-card.glass .stat-trend.down { 
  color: #ef4444; 
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.2);
}

.stat-card.glass .stat-trend.neutral { 
  color: var(--text-secondary); 
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.05);
}

/* ============================================ */
/* KPI CARDS                                   */
/* ============================================ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  height: 150px;
  min-height: unset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.75rem 0.5rem;
  background: var(--surface);
  border-radius: 16px;
  border: 2px solid var(--border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.dark-theme .kpi-card {
  background: var(--surface);
  border-color: var(--border);
}

.kpi-card:hover {
  border-color: var(--kpi-color, var(--primary));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: none;
}

.kpi-card.clickable {
  cursor: pointer;
}

.kpi-card.clickable:hover {
  border-color: var(--kpi-color);
  box-shadow: 0 4px 16px var(--kpi-color-alpha);
}

.kpi-card.highlight {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02));
  border-color: rgba(245, 158, 11, 0.3);
}

.kpi-card.highlight:hover {
  border-color: #f59e0b;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
}

.kpi-card .kpi-icon {
  font-size: 2rem;
  line-height: 1;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.1rem;
  flex-shrink: 0;
}

.kpi-card .kpi-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}

.kpi-card .kpi-value-topstall {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}

.kpi-card .kpi-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-card .kpi-change {
  font-size: 0.65rem;
  font-weight: 500;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.kpi-card .kpi-change .trend-icon {
  font-size: 0.6rem;
}

.kpi-card .kpi-change.positive {
  color: #10b981;
  background: rgba(16, 185, 129, 0.08);
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
}

.kpi-card .kpi-change.negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
}

.kpi-card .kpi-change.neutral {
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
}

.kpi-card .kpi-status-badge {
  font-size: 0.65rem;
  font-weight: 500;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.05rem 0.5rem;
  border-radius: 20px;
  flex-shrink: 0;
}

.kpi-card .kpi-status-badge.excellent {
  background: #d1fae5;
  color: #059669;
}

.kpi-card .kpi-status-badge.good {
  background: #dbeafe;
  color: #2563eb;
}

.kpi-card .kpi-status-badge.average {
  background: #fef3c7;
  color: #d97706;
}

.kpi-card .kpi-status-badge.poor {
  background: #fee2e2;
  color: #dc2626;
}

.kpi-card .kpi-status-badge.no-sales {
  background: #f3f4f6;
  color: #6b7280;
}

.kpi-card .kpi-status-badge.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

.kpi-card .kpi-trend-label {
  font-size: 0.65rem;
  font-weight: 500;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  flex-shrink: 0;
}

.kpi-card .kpi-trend-label.positive {
  color: #10b981;
}

.kpi-card .kpi-trend-label.negative {
  color: #ef4444;
}

.kpi-card .kpi-trend-label.neutral {
  color: var(--text-tertiary);
}

.kpi-card .sparkline-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 35px;
  opacity: 0.4;
}

.kpi-card .sparkline-container svg {
  width: 100%;
  height: 100%;
}

.kpi-card .sparkline-container .sparkline-line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.kpi-card .sparkline-container .sparkline-area {
  opacity: 0.3;
}

.kpi-card .kpi-hover {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.5rem;
  color: var(--kpi-color, #F94908);
  opacity: 0;
  transition: all 0.3s ease;
  transform: translateX(10px);
  font-weight: 600;
  letter-spacing: 0.3px;
  z-index: 1;
}

.kpi-card.clickable:hover .kpi-hover {
  opacity: 1;
  transform: translateX(0);
}

/* ============================================ */
/* CHART MODERN                                */
/* ============================================ */
.chart-modern {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: var(--transition);
  margin-bottom: 1.25rem;
}

.dark-theme .chart-modern {
  background: var(--surface);
  border-color: var(--border);
}

.chart-modern.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--surface);
  border-radius: 0;
  border: none;
  padding: 1.5rem;
  overflow: auto;
}

.chart-modern-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chart-modern-title h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.chart-modern-sub {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.chart-modern-controls {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.chart-modern-fullscreen {
  padding: 0.1rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
  transition: var(--transition);
  color: var(--text-tertiary);
}

.chart-modern-fullscreen:hover {
  border-color: var(--primary);
  color: var(--text);
}

.chart-modern-body {
  padding: 1.25rem;
}

.chart-modern-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.dark-theme .chart-modern-stats {
  background: var(--surface-elevated);
}

.chart-modern-stat {
  text-align: center;
  padding: 0.25rem;
}

.chart-modern-stat-label {
  display: block;
  font-size: 0.55rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.chart-modern-stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
}

.chart-modern-stat-value.up { color: #10b981; }
.chart-modern-stat-value.down { color: #ef4444; }

.chart-modern-stat-sub {
  font-size: 0.55rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.chart-modern-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.35rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.dark-theme .chart-modern-nav {
  background: var(--surface-elevated);
}

.chart-modern-nav-btn {
  padding: 0.15rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
  transition: var(--transition);
  color: var(--text-secondary);
}

.chart-modern-nav-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--text);
}

.chart-modern-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.chart-modern-nav-btn.reset {
  border-color: var(--primary);
  color: var(--primary);
}

.chart-modern-nav-btn.reset:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.chart-modern-nav-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

.chart-modern-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  color: var(--text-secondary);
}

.chart-modern-empty span {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.chart-modern-empty p {
  font-size: 0.85rem;
  margin: 0;
}

.echarts-container {
  width: 100%;
  height: 300px;
}

.chart-modern.fullscreen .echarts-container {
  height: calc(100vh - 250px);
}

/* ============================================ */
/* CLICKABLE ITEMS                              */
/* ============================================ */
.clickable-item {
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.clickable-item:hover {
  background: var(--background);
  transform: translateX(4px);
}

/* ============================================ */
/* CARD MODERN                                 */
/* ============================================ */
.card-modern {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1.25rem;
}

.dark-theme .card-modern {
  background: var(--surface);
  border-color: var(--border);
}

.card-modern-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-modern-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.card-subtitle {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.period-tag {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
}

.card-modern-body {
  padding: 1rem;
}

/* ============================================ */
/* STATS CHIPS                                 */
/* ============================================ */
.stat-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.dark-theme .stat-chip {
  background: var(--surface-elevated);
  border-color: var(--border);
}

.stat-chip .stat-chip-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-chip .stat-chip-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}

.stat-chip .stat-chip-sub {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  font-weight: 500;
  display: block;
  text-align: center;
}

.stat-chip.active .stat-chip-value { color: #10b981; }
.stat-chip.inactive .stat-chip-value { color: #6b7280; }
.stat-chip.warning .stat-chip-value { color: #ef4444; }
.stat-chip.excellent .stat-chip-value { color: #10b981; }
.stat-chip.good .stat-chip-value { color: #3b82f6; }
.stat-chip.average .stat-chip-value { color: #f59e0b; }
.stat-chip.poor .stat-chip-value { color: #ef4444; }
.stat-chip.no-sales .stat-chip-value { color: #6b7280; }
.stat-chip.admin .stat-chip-value { color: #7c3aed; }
.stat-chip.cashier .stat-chip-value { color: #10b981; }
.stat-chip.revenue .stat-chip-value { color: #F94908; }
.stat-chip.transactions .stat-chip-value { color: #2563eb; }
.stat-chip.growth .stat-chip-value { font-size: 1.1rem; }
.stat-chip.top-stall .stat-chip-value { color: #f59e0b; font-size: 0.9rem; }

/* ============================================ */
/* FILTER BAR                                  */
/* ============================================ */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-bar-modern {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.dark-theme .filter-bar-modern {
  background: var(--surface-elevated);
  border-color: var(--border);
}

.filter-bar-modern .filter-search {
  flex: 1;
  min-width: 150px;
}

.filter-bar-modern .filter-group {
  min-width: 120px;
}

.filter-bar-modern .filter-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  margin-left: auto;
}

.filter-search {
  flex: 1;
  min-width: 140px;
}

.filter-input {
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  transition: var(--transition);
}

.dark-theme .filter-input {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}

.filter-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.06);
}

.filter-select {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  min-width: 110px;
}

.dark-theme .filter-select {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

.filter-result {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  background: var(--background);
  border-radius: 16px;
  border: 1px solid var(--border-light);
}

/* ============================================ */
/* BUTTONS                                      */
/* ============================================ */
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

.dark-theme .btn-modern.secondary {
  background: var(--surface-elevated);
  border-color: var(--border);
  color: var(--text-secondary);
}

.btn-modern.secondary:hover {
  background: var(--surface-elevated);
  color: var(--text);
}

.btn-modern.small {
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
}

.btn-modern.danger {
  background: #ef4444;
  color: white;
}

.btn-modern.danger:hover {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: var(--transition);
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: translateX(-2px);
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.65rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-action:hover:not(:disabled) {
  background: var(--background);
  border-color: var(--primary);
  color: var(--text);
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-action.primary {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-action.primary:hover {
  background: var(--primary);
  color: white;
}

.btn-action.danger {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-action.danger:hover {
  background: #ef4444;
  color: white;
}

/* ============================================ */
/* STATUS & BADGE STYLES                       */
/* ============================================ */
.status-badge {
  padding: 0.05rem 0.4rem;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.active { background: #d1fae5; color: #059669; }
.status-badge.inactive { background: #f3f4f6; color: #6b7280; }
.status-badge.low { background: #fee2e2; color: #dc2626; }
.status-badge.open { background: #d1fae5; color: #059669; }
.status-badge.closed { background: #f3f4f6; color: #6b7280; }
.status-badge.status-pending { background: #fef3c7; color: #92400e; }
.status-badge.status-approved { background: #d1fae5; color: #059669; }
.status-badge.status-rejected { background: #fee2e2; color: #dc2626; }

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.status-indicator.excellent { background: #d1fae5; color: #059669; }
.status-indicator.good { background: #dbeafe; color: #2563eb; }
.status-indicator.average { background: #fef3c7; color: #d97706; }
.status-indicator.poor { background: #fee2e2; color: #dc2626; }
.status-indicator.no-sales { background: #f3f4f6; color: #6b7280; }

.status-tag {
  padding: 0.05rem 0.4rem;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-tag.active { background: #d1fae5; color: #059669; }
.status-tag.inactive { background: #fee2e2; color: #dc2626; }
.status-tag.danger { background: #fee2e2; color: #dc2626; }

.role-badge {
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.role-badge.stall_admin {
  background: #ede9fe;
  color: #7c3aed;
}

.role-badge.cashier {
  background: #d1fae5;
  color: #059669;
}

/* ============================================ */
/* RANKING                                     */
/* ============================================ */
.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.7rem;
  background: var(--background);
  color: var(--text-secondary);
}

.rank-number.gold { background: #fbbf24; color: #78350f; }
.rank-number.silver { background: #d1d5db; color: #374151; }
.rank-number.bronze { background: #f59e0b; color: #78350f; }

/* ============================================ */
/* EMPTY STATE                                  */
/* ============================================ */
.empty-state-modern {
  text-align: center;
  padding: 2rem 0.5rem;
  color: var(--text-secondary);
}

.empty-state-modern span {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-state-modern p {
  font-size: 0.85rem;
  margin: 0;
}

.empty-state-modern.small {
  padding: 1rem 0.5rem;
}

.empty-state-modern.small span {
  font-size: 1.5rem;
}

.empty-state-modern.small p {
  font-size: 0.75rem;
}

/* ============================================ */
/* PAGINATION                                  */
/* ============================================ */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pagination-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.75rem;
  transition: var(--transition);
  color: var(--text-secondary);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--text);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-page {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text);
  min-width: 60px;
  text-align: center;
}

/* ============================================ */
/* MODALS                                      */
/* ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-modern {
  background: #ffffff !important;
  border-radius: var(--radius);
  max-width: 500px;
  width: 92%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dark-theme .modal-modern {
  background: #1e293b !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.modal-lg {
  max-width: 600px;
}

.modal-sm {
  max-width: 500px;
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
  color: var(--text);
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
  background: #ffffff !important;
  padding: 1.25rem;
  overflow-y: auto;
  max-height: 60vh;
}

.dark-theme .modal-modern-body {
  background: #1e293b !important;
  color: var(--text);
}

.modal-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.modal-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.modal-form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.modal-form-group input,
.modal-form-group select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  width: 100%;
}

.dark-theme .modal-form-group input,
.dark-theme .modal-form-group select {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}

.modal-form-group input:focus,
.modal-form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.06);
}

.modal-form-group small {
  font-size: 0.65rem;
  color: var(--text-tertiary);
}

.modal-modern-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: #f8fafc;
}

.dark-theme .modal-modern-footer {
  background: #0f172a;
  border-top-color: var(--border);
}

.stall-select-multiple {
  min-height: 60px;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
}

/* ============================================ */
/* SUB-TABS                                    */
/* ============================================ */
.sub-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  background: var(--background);
  padding: 0.25rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.dark-theme .sub-tabs {
  background: var(--surface-elevated);
  border-color: var(--border);
}

.sub-tab {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
  color: var(--text-secondary);
}

.sub-tab:hover {
  background: var(--surface);
  color: var(--text);
}

.sub-tab.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.dark-theme .sub-tab.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.sub-tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ============================================ */
/* DETAIL MODALS                               */
/* ============================================ */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.detail-item {
  background: var(--background);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  text-align: center;
}

.dark-theme .detail-item {
  background: var(--surface-elevated);
}

.detail-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.detail-chart-container {
  margin-top: 1rem;
}

.detail-chart-container h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text);
}

.detail-chart {
  width: 100%;
  height: 200px;
}

/* ============================================ */
/* TRANSACTION DETAIL MODAL                    */
/* ============================================ */
.transaction-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.transaction-detail-card {
  background: var(--background);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  text-align: center;
}

.dark-theme .transaction-detail-card {
  background: var(--surface-elevated);
  border-color: var(--border);
}

.transaction-detail-card .detail-label {
  display: block;
  font-size: 0.55rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.1rem;
}

.transaction-detail-card .detail-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.transaction-items-section {
  margin-top: 0.5rem;
}

.transaction-items-section h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.transaction-items-header {
  display: flex;
  padding: 0.3rem 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.6rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.3px;
}

.item-header-name { flex: 2; text-align: left; }
.item-header-qty { flex: 0.5; text-align: center; }
.item-header-price { flex: 1; text-align: right; }
.item-header-total { flex: 1; text-align: right; }

.transaction-item-row {
  display: flex;
  align-items: center;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--border-light);
  font-size: 0.8rem;
}

.transaction-item-row .item-name { flex: 2; text-align: left; font-weight: 500; }
.transaction-item-row .item-qty { flex: 0.5; text-align: center; color: var(--text-secondary); }
.transaction-item-row .item-price { flex: 1; text-align: right; color: var(--text-secondary); }
.transaction-item-row .item-total { flex: 1; text-align: right; font-weight: 600; color: var(--text); }

/* ============================================ */
/* MODAL STATS GRID                            */
/* ============================================ */
.modal-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.modal-stat {
  background: var(--background);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  text-align: center;
}

.modal-stat-label {
  display: block;
  font-size: 0.6rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.15rem;
}

.modal-stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.modal-transactions {
  margin-top: 0.5rem;
}

.modal-transactions h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.modal-transactions-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 300px;
  overflow-y: auto;
}

.modal-transaction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--background);
  font-size: 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

.modal-tx-date { min-width: 100px; color: var(--text-secondary); font-size: 0.7rem; }
.modal-tx-id { min-width: 80px; font-weight: 600; color: var(--text); font-family: monospace; }
.modal-tx-items { min-width: 60px; color: var(--text-secondary); text-align: center; }
.modal-tx-amount { min-width: 70px; text-align: right; font-weight: 600; color: var(--text); }

.transaction-status {
  padding: 0.05rem 0.3rem;
  border-radius: 8px;
  font-size: 0.55rem;
  font-weight: 600;
}

.transaction-status.completed {
  background: #d1fae5;
  color: #059669;
}

.transaction-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.transaction-status.failed {
  background: #fee2e2;
  color: #dc2626;
}

/* ============================================ */
/* SHIFT DETAIL MODAL                          */
/* ============================================ */
.shift-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.shift-detail-item {
  background: var(--background);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  text-align: center;
}

.shift-detail-item .label {
  display: block;
  font-size: 0.6rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.1rem;
}

.shift-detail-item .value {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.shift-detail-item .value.revenue {
  color: var(--primary);
}

.shift-detail-item .value.over {
  color: #10b981;
}

.shift-detail-item .value.short {
  color: #ef4444;
}

.shift-detail-notes {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.shift-detail-notes p {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.shift-detail-transactions {
  margin-top: 1rem;
}

.shift-detail-transactions h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.shift-transaction-list {
  max-height: 200px;
  overflow-y: auto;
}

.shift-transaction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-sm);
  border-bottom: 1px solid var(--border-light);
}

.shift-transaction-item .tx-time {
  min-width: 55px;
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.shift-transaction-item .tx-id {
  min-width: 80px;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text);
  font-family: monospace;
}

.shift-transaction-item .tx-items {
  min-width: 50px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.shift-transaction-item .tx-amount {
  min-width: 60px;
  text-align: right;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text);
}

.shift-transaction-item .tx-status {
  font-size: 0.55rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  text-transform: uppercase;
}

.shift-transaction-item .tx-status.completed {
  background: #d1fae5;
  color: #059669;
}

.shift-transaction-item .tx-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.shift-transaction-item .tx-status.failed {
  background: #fee2e2;
  color: #dc2626;
}

/* ============================================ */
/* SHIFT HISTORY INVENTORY                      */
/* ============================================ */
.shift-history-inventory {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  font-size: 0.7rem;
  padding: 0.2rem 0;
}

.inventory-usage-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.05rem 0.4rem;
  background: var(--background);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  font-size: 0.6rem;
  white-space: nowrap;
}

.no-inventory-data {
  color: var(--text-tertiary);
  font-style: italic;
}

/* ============================================ */
/* SHIFT DETAIL INVENTORY                      */
/* ============================================ */
.shift-detail-inventory {
  margin: 1rem 0;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.shift-detail-inventory h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.inventory-detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.inventory-detail-header {
  display: grid;
  grid-template-columns: 1fr 0.8fr 0.8fr 0.8fr;
  padding: 0.3rem 0.5rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.6rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.inventory-detail-row {
  display: grid;
  grid-template-columns: 1fr 0.8fr 0.8fr 0.8fr;
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--border-light);
  font-size: 0.8rem;
  align-items: center;
}

.inventory-detail-row:last-child {
  border-bottom: none;
}

.inventory-detail-usage.used {
  color: var(--primary);
  font-weight: 600;
}

.inventory-detail-usage.zero {
  color: var(--text-tertiary);
}

/* ============================================ */
/* INVENTORY TABLE                             */
/* ============================================ */
.inventory-table-wrapper {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.inventory-table-header {
  display: flex;
  padding: 0.5rem 0.75rem;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  min-width: 600px;
}

.inventory-table-row {
  display: flex;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
  align-items: center;
  min-width: 600px;
}

.inventory-table-row:hover {
  background: var(--background);
}

.inventory-table-row.selected {
  background: rgba(249, 73, 8, 0.05);
  border-left: 3px solid var(--primary);
}

.inventory-table-cell {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.inventory-table-cell.checkbox { width: 40px; flex-shrink: 0; }
.inventory-table-cell.name { flex: 1; min-width: 100px; flex-direction: column; align-items: flex-start; }
.inventory-table-cell.state { width: 100px; flex-shrink: 0; font-size: 0.75rem; color: var(--text-secondary); }
.inventory-table-cell.items { flex: 1.5; min-width: 120px; flex-wrap: wrap; gap: 0.25rem; }
.inventory-table-cell.status { width: 130px; flex-shrink: 0; flex-wrap: wrap; gap: 0.25rem; }
.inventory-table-cell.actions { width: 80px; flex-shrink: 0; justify-content: flex-end; gap: 0.25rem; }

.inventory-table-cell input[type="checkbox"] {
  accent-color: var(--primary);
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.stall-name { font-weight: 500; font-size: 0.85rem; }
.stall-code { font-size: 0.6rem; color: var(--text-tertiary); font-family: monospace; }
.stall-company { font-size: 0.6rem; color: var(--text-secondary); }

.inventory-item-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  background: var(--background);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  border: 1px solid var(--border-light);
  font-size: 0.65rem;
  margin-right: 0.15rem;
  margin-bottom: 0.15rem;
}

.inventory-item-inline .item-name { font-weight: 500; }
.inventory-item-inline .item-level { font-weight: 600; min-width: 20px; text-align: center; }
.inventory-item-inline .item-warning { color: #ef4444; font-size: 0.6rem; }
.inventory-item-inline.low { border-color: #ef4444; background: #fef2f2; }

/* ============================================ */
/* USERS TABLE                                 */
/* ============================================ */
.users-table-wrapper {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.users-table-header {
  display: flex;
  padding: 0.5rem 0.75rem;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  min-width: 700px;
}

.users-table-row {
  display: flex;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
  align-items: center;
  min-width: 700px;
}

.users-table-row:hover {
  background: var(--background);
}

.users-table-row.selected {
  background: rgba(249, 73, 8, 0.05);
  border-left: 3px solid var(--primary);
}

.users-table-cell {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.users-table-cell.checkbox { width: 40px; flex-shrink: 0; }
.users-table-cell.username { flex: 1; min-width: 80px; }
.users-table-cell.fullname { flex: 1; min-width: 80px; }
.users-table-cell.role { width: 100px; flex-shrink: 0; }
.users-table-cell.company { width: 120px; flex-shrink: 0; }
.users-table-cell.stalls { flex: 1.5; min-width: 100px; flex-wrap: wrap; gap: 0.25rem; }
.users-table-cell.actions { width: 120px; flex-shrink: 0; justify-content: flex-end; gap: 0.25rem; }

.users-table-cell input[type="checkbox"] {
  accent-color: var(--primary);
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.users-table-cell input[type="checkbox"]:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.username-text { font-weight: 500; font-size: 0.8rem; }

.stall-badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  margin: 0.1rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 0.6rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.stall-badge.clickable {
  cursor: pointer;
  transition: var(--transition);
}

.stall-badge.clickable:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: scale(1.05);
}

.no-stalls {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  font-style: italic;
}

/* ============================================ */
/* REVENUE TABLE                               */
/* ============================================ */
.revenue-table-wrapper {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.revenue-table-header {
  display: flex;
  padding: 0.5rem 0.75rem;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  min-width: 650px;
}

.revenue-table-row {
  display: flex;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
  align-items: center;
  min-width: 650px;
}

.revenue-table-row:hover {
  background: var(--background);
}

.revenue-table-cell {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.revenue-table-header-rank { min-width: 40px; text-align: center; }
.revenue-table-header-name { flex: 1; text-align: left; }
.revenue-table-header-state { min-width: 80px; text-align: left; }
.revenue-table-header-revenue { min-width: 70px; text-align: right; }
.revenue-table-header-status { min-width: 85px; text-align: center; }
.revenue-table-header-details { min-width: 40px; text-align: center; }

.revenue-table-rank { min-width: 40px; text-align: center; }
.revenue-table-name { flex: 1; min-width: 80px; text-align: left; }
.revenue-table-state { min-width: 80px; text-align: left; }
.revenue-table-revenue { min-width: 70px; text-align: right; font-weight: 600; color: var(--text); }
.revenue-table-status { min-width: 85px; text-align: center; }
.revenue-table-details { min-width: 40px; text-align: center; font-size: 0.8rem; color: var(--text-tertiary); }

.revenue-table-row:hover .revenue-table-details {
  color: var(--primary);
}

.order-id {
  font-weight: 600;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text);
}

/* ============================================ */
/* PERFORMANCE TAB                             */
/* ============================================ */
.performance-table-wrapper {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.performance-table-header {
  display: flex;
  padding: 0.5rem 0.75rem;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  min-width: 500px;
}

.performance-table-header-rank { min-width: 50px; text-align: center; cursor: pointer; }
.performance-table-header-name { flex: 1; text-align: left; cursor: pointer; }
.performance-table-header-revenue { min-width: 100px; text-align: right; cursor: pointer; }
.performance-table-header-status { min-width: 100px; text-align: center; cursor: pointer; }
.performance-table-header-details { min-width: 50px; text-align: center; }

.performance-table-header .sortable {
  cursor: pointer;
  user-select: none;
  transition: var(--transition);
}

.performance-table-header .sortable:hover {
  color: var(--text);
}

.performance-table-header .sort-arrow {
  font-size: 0.6rem;
  margin-left: 0.2rem;
  color: var(--text-tertiary);
}

.performance-table-body {
  display: flex;
  flex-direction: column;
}

.performance-table-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: var(--transition);
  min-width: 500px;
}

.performance-table-row:hover {
  background: var(--background);
}

.performance-table-row:last-child {
  border-bottom: none;
}

.performance-table-rank { min-width: 50px; text-align: center; }
.performance-table-name { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; min-width: 80px; }
.performance-table-revenue { min-width: 100px; text-align: right; font-weight: 600; font-size: 0.8rem; color: var(--text); }
.performance-table-status { min-width: 100px; text-align: center; }
.performance-table-details { min-width: 50px; text-align: center; font-size: 0.8rem; color: var(--text-tertiary); }

.performance-table-row:hover .performance-table-details {
  color: var(--primary);
}

/* ============================================ */
/* STALL PERFORMANCE TABLE                     */
/* ============================================ */
.stall-table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stall-table-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.stall-table-header-rank { min-width: 40px; text-align: center; }
.stall-table-header-name { flex: 1; text-align: left; }
.stall-table-header-revenue { min-width: 70px; text-align: right; }
.stall-table-header-status { min-width: 85px; text-align: center; }
.stall-table-header-details { min-width: 40px; text-align: center; }

.stall-table-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stall-table-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}

.stall-table-row:hover {
  background: var(--background);
  border-color: var(--border-light);
  transform: translateX(2px);
}

.stall-table-rank { min-width: 40px; text-align: center; }

.stall-table-name {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 80px;
}

.stall-name-text {
  font-weight: 500;
  font-size: 0.8rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stall-name-bar {
  width: 100%;
  height: 4px;
  background: var(--background);
  border-radius: 2px;
  overflow: hidden;
}

.stall-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.stall-table-revenue {
  min-width: 70px;
  text-align: right;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text);
}

.stall-table-status { min-width: 85px; text-align: center; }

.stall-table-details {
  min-width: 40px;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-tertiary);
  transition: var(--transition);
}

.stall-table-row:hover .stall-table-details {
  color: var(--primary);
}

/* ============================================ */
/* MENU TABLE                                  */
/* ============================================ */
.menu-table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.menu-table-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.menu-table-header-rank { min-width: 40px; text-align: center; }
.menu-table-header-name { flex: 1; text-align: left; }
.menu-table-header-revenue { min-width: 70px; text-align: right; }
.menu-table-header-status { min-width: 85px; text-align: center; }
.menu-table-header-details { min-width: 40px; text-align: center; }

.menu-table-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.menu-table-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}

.menu-table-row:hover {
  background: var(--background);
  border-color: var(--border-light);
  transform: translateX(2px);
}

.menu-table-rank { min-width: 40px; text-align: center; }

.menu-table-name {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 80px;
}

.menu-name-text {
  font-weight: 500;
  font-size: 0.8rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-name-bar {
  width: 100%;
  height: 4px;
  background: var(--background);
  border-radius: 2px;
  overflow: hidden;
}

.menu-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-table-revenue {
  min-width: 70px;
  text-align: right;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text);
}

.menu-table-status { min-width: 85px; text-align: center; }

.menu-table-details {
  min-width: 40px;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-tertiary);
  transition: var(--transition);
}

.menu-table-row:hover .menu-table-details {
  color: var(--primary);
}

/* ============================================ */
/* MENU ASSIGNMENT                             */
/* ============================================ */
.mode-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  border: 1px solid var(--border);
}

.mode-toggle .mode-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: var(--transition);
  background: transparent;
  color: var(--text-secondary);
}

.mode-toggle .mode-btn:hover {
  background: var(--surface);
  color: var(--text);
}

.mode-toggle .mode-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 8px rgba(249, 73, 8, 0.2);
}

.menu-assignment-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assignment-item {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
  transition: var(--transition);
}

.assignment-item:hover {
  border-color: var(--primary);
}

.assignment-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assignment-item-info { flex: 1; }

.assignment-item-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.assignment-item-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary);
}

.assignment-item-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex-wrap: wrap;
}

.assignment-item-name { font-weight: 500; font-size: 0.85rem; color: var(--text); }
.assignment-item-price { font-size: 0.8rem; font-weight: 600; color: var(--primary); }
.assignment-item-category { font-size: 0.65rem; color: var(--text-secondary); background: var(--surface); padding: 0.05rem 0.4rem; border-radius: 10px; border: 1px solid var(--border-light); }

.assignment-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.assignment-message {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.assignment-message.success {
  background: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.assignment-message.error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.assignment-message.info {
  background: #dbeafe;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

/* ============================================ */
/* BULK MODE                                   */
/* ============================================ */
.bulk-mode .bulk-step {
  background: var(--background);
  border-radius: var(--radius-sm);
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--border);
}

.bulk-mode .step-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.bulk-mode .step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.bulk-mode .step-header h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.bulk-mode .step-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-left: auto;
}

.bulk-mode .stall-checkbox-grid,
.bulk-mode .menu-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.25rem;
}

.bulk-mode .stall-checkbox-item,
.bulk-mode .menu-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  background: var(--surface);
  border: 1px solid var(--border-light);
}

.bulk-mode .stall-checkbox-item:hover,
.bulk-mode .menu-checkbox-item:hover {
  background: var(--background);
  border-color: var(--primary);
}

.bulk-mode .stall-checkbox-item input[type="checkbox"],
.bulk-mode .menu-checkbox-item input[type="checkbox"] {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.bulk-mode .stall-name { font-weight: 500; font-size: 0.85rem; flex: 1; }
.bulk-mode .stall-code { font-size: 0.65rem; color: var(--text-tertiary); font-family: monospace; }
.bulk-mode .stall-status { font-size: 0.8rem; }
.bulk-mode .stall-status.active { color: #10b981; }
.bulk-mode .stall-status.inactive { color: #6b7280; }

.bulk-mode .menu-name { font-weight: 500; font-size: 0.85rem; flex: 1; }
.bulk-mode .menu-price { font-size: 0.8rem; font-weight: 600; color: var(--primary); }
.bulk-mode .menu-category { font-size: 0.65rem; color: var(--text-secondary); background: var(--background); padding: 0.05rem 0.4rem; border-radius: 10px; }

.bulk-mode .bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  flex-wrap: wrap;
}

.bulk-mode .bulk-summary {
  font-size: 0.9rem;
  color: var(--text-secondary);
  flex: 1;
}

.bulk-mode .total-assignments {
  color: var(--primary);
  font-size: 1.1rem;
}

/* ============================================ */
/* STALL MENU VIEW                             */
/* ============================================ */
.stall-view-toggle .btn-modern.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.stall-menu-view {
  margin-bottom: 1rem;
}

.stall-menu-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.stall-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: var(--transition);
  background: var(--surface);
}

.stall-menu-header:hover {
  background: var(--background);
}

.stall-menu-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stall-menu-name { font-weight: 600; font-size: 0.85rem; color: var(--text); }
.stall-menu-code { font-size: 0.65rem; color: var(--text-tertiary); font-family: monospace; }

.stall-menu-count {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.05rem 0.5rem;
  border-radius: 10px;
  border: 1px solid var(--border-light);
}

.stall-menu-toggle { font-size: 0.7rem; color: var(--text-secondary); transition: var(--transition); }

.stall-menu-list {
  padding: 0.75rem;
  background: var(--background);
  border-top: 1px solid var(--border-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.stall-menu-tag {
  background: var(--surface);
  padding: 0.15rem 0.6rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text);
}

.stall-menu-tag .menu-name { font-weight: 500; }

/* ============================================ */
/* BULK UPDATE MODAL                           */
/* ============================================ */
.bulk-mode-selector {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
  flex-wrap: wrap;
}

.mode-btn {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.7rem;
  transition: var(--transition);
  color: var(--text-secondary);
}

.mode-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: white;
}

.mode-btn:hover:not(.active) {
  border-color: var(--primary);
  color: var(--text);
}

.bulk-preview {
  padding: 0.4rem 0.6rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  margin-bottom: 0.6rem;
}

.bulk-preview p {
  font-size: 0.7rem;
  margin: 0 0 0.2rem 0;
  color: var(--text-secondary);
}

.bulk-stall-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
}

.stall-tag {
  padding: 0.05rem 0.4rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 0.6rem;
  color: var(--text-secondary);
}

.stall-tag.more {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.bulk-materials h4 {
  font-size: 0.7rem;
  font-weight: 600;
  margin: 0 0 0.3rem 0;
  color: var(--text-secondary);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  align-items: center;
  margin-bottom: 0.4rem;
}

.quick-label {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.bulk-material-grid {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-height: 180px;
  overflow-y: auto;
  padding: 0.2rem 0;
}

.bulk-material-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.4rem;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
}

.bulk-material-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  min-width: 70px;
}

.bulk-material-label input[type="checkbox"] {
  accent-color: var(--primary);
  cursor: pointer;
  width: 14px;
  height: 14px;
}

.bulk-material-name {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text);
}

.bulk-material-inputs {
  display: flex;
  gap: 0.2rem;
  align-items: center;
  flex: 1;
}

.bulk-material-inputs .filter-select.small {
  min-width: 55px;
  padding: 0.1rem 0.2rem;
  font-size: 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.bulk-material-inputs .filter-input.small {
  width: 45px;
  padding: 0.1rem 0.2rem;
  font-size: 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.bulk-material-unit {
  font-size: 0.55rem;
  color: var(--text-tertiary);
  min-width: 25px;
}

/* ============================================ */
/* QUICK UPDATE MODAL                          */
/* ============================================ */
.quick-update-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-update-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-update-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-update-name { font-weight: 600; font-size: 0.85rem; }
.quick-update-current { font-size: 0.7rem; color: var(--text-secondary); }

.quick-update-status {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  border-radius: 8px;
}

.quick-update-status.ok { background: #d1fae5; color: #059669; }
.quick-update-status.low { background: #fee2e2; color: #dc2626; }

.quick-update-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  flex-wrap: wrap;
}

.quick-update-actions .filter-input.small {
  width: 50px;
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
}

/* ============================================ */
/* INVENTORY STATS & ACTIONS                   */
/* ============================================ */
.inventory-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.inventory-quick-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  align-items: center;
}

/* ============================================ */
/* REVENUE STATS                               */
/* ============================================ */
.revenue-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.revenue-stats-grid .stat-chip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  text-align: center;
}

.revenue-stats-grid .stat-chip .stat-chip-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.15rem;
}

.revenue-stats-grid .stat-chip .stat-chip-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}

.revenue-stats-grid .stat-chip .stat-chip-value.positive { color: #10b981; }
.revenue-stats-grid .stat-chip .stat-chip-value.negative { color: #ef4444; }
.revenue-stats-grid .stat-chip .stat-chip-sub { font-size: 0.6rem; color: var(--text-tertiary); font-weight: 500; }

.revenue-stats-grid .stat-chip.revenue .stat-chip-value { color: #F94908; }
.revenue-stats-grid .stat-chip.transactions .stat-chip-value { color: #2563eb; }
.revenue-stats-grid .stat-chip.average .stat-chip-value { color: #7c3aed; }
.revenue-stats-grid .stat-chip.growth .stat-chip-value { font-size: 1.1rem; }
.revenue-stats-grid .stat-chip.top-stall .stat-chip-value { color: #f59e0b; font-size: 0.9rem; }

/* ============================================ */
/* REVENUE CHARTS                              */
/* ============================================ */
.revenue-charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.revenue-chart-card {
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  padding: 0.75rem;
}

.revenue-chart-card h4 {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
}

.revenue-chart-container {
  width: 100%;
  height: 200px;
}

/* ============================================ */
/* TRANSACTIONS STATS                          */
/* ============================================ */
.transactions-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.transactions-stats-grid .stat-chip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  text-align: center;
}

.transactions-stats-grid .stat-chip .stat-chip-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.15rem;
}

.transactions-stats-grid .stat-chip .stat-chip-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}

.transactions-stats-grid .stat-chip.revenue .stat-chip-value { color: #F94908; }
.transactions-stats-grid .stat-chip.active .stat-chip-value { color: #10b981; }
.transactions-stats-grid .stat-chip.warning .stat-chip-value { color: #f59e0b; }

/* ============================================ */
/* USERS STATS                                 */
/* ============================================ */
.users-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.users-stats-grid .stat-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.users-stats-grid .stat-chip .stat-chip-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}

.users-stats-grid .stat-chip.admin .stat-chip-value { color: #7c3aed; }
.users-stats-grid .stat-chip.cashier .stat-chip-value { color: #10b981; }
.users-stats-grid .stat-chip.active .stat-chip-value { color: #10b981; }
.users-stats-grid .stat-chip.inactive .stat-chip-value { color: #6b7280; }

/* ============================================ */
/* PERFORMANCE STATS                           */
/* ============================================ */
.performance-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.performance-stats-grid .stat-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.performance-stats-grid .stat-chip .stat-chip-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}

.performance-stats-grid .stat-chip.excellent .stat-chip-value { color: #10b981; }
.performance-stats-grid .stat-chip.good .stat-chip-value { color: #3b82f6; }
.performance-stats-grid .stat-chip.average .stat-chip-value { color: #f59e0b; }
.performance-stats-grid .stat-chip.poor .stat-chip-value { color: #ef4444; }
.performance-stats-grid .stat-chip.no-sales .stat-chip-value { color: #6b7280; }

/* ============================================ */
/* MENU PERFORMANCE STATS                      */
/* ============================================ */
.menu-performance-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.menu-performance-stats-grid .stat-chip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  text-align: center;
}

.menu-performance-stats-grid .stat-chip .stat-chip-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.15rem;
}

.menu-performance-stats-grid .stat-chip .stat-chip-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}

.menu-performance-stats-grid .stat-chip .stat-chip-sub {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.menu-performance-stats-grid .stat-chip.revenue .stat-chip-value { color: #F94908; }
.menu-performance-stats-grid .stat-chip.top-item .stat-chip-value { color: #f59e0b; font-size: 0.9rem; }

.menu-performance-breakdown-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.menu-performance-breakdown-grid .stat-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.menu-performance-breakdown-grid .stat-chip .stat-chip-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}

.menu-performance-breakdown-grid .stat-chip.excellent .stat-chip-value { color: #10b981; }
.menu-performance-breakdown-grid .stat-chip.good .stat-chip-value { color: #3b82f6; }
.menu-performance-breakdown-grid .stat-chip.average .stat-chip-value { color: #f59e0b; }
.menu-performance-breakdown-grid .stat-chip.poor .stat-chip-value { color: #ef4444; }
.menu-performance-breakdown-grid .stat-chip.no-sales .stat-chip-value { color: #6b7280; }

/* ============================================ */
/* SHIFT HISTORY TABLE                         */
/* ============================================ */
.shift-history-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-top: 1rem;
}

.shift-history-table-header {
  display: grid;
  grid-template-columns: 140px 1.5fr 100px 80px 100px 100px 90px 50px;
  background: var(--background);
  border-bottom: 2px solid var(--border);
  padding: 0.6rem 0.75rem;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  min-width: 750px;
  gap: 0.5rem;
}

.shift-history-table-row {
  display: grid;
  grid-template-columns: 140px 1.5fr 100px 80px 100px 100px 90px 50px;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  align-items: center;
  cursor: pointer;
  transition: var(--transition);
  min-width: 750px;
  gap: 0.5rem;
}

.shift-history-table-row:hover {
  background: var(--background);
}

.shift-history-date {
  font-size: 0.8rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shift-history-stall {
  font-weight: 500;
  font-size: 0.8rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shift-history-revenue {
  text-align: right;
  font-weight: 600;
  color: var(--primary);
  font-size: 0.85rem;
}

.shift-history-transactions {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.shift-history-float {
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.shift-history-variance {
  text-align: right;
  font-weight: 600;
  font-size: 0.8rem;
}

.shift-history-variance.over { color: #10b981; }
.shift-history-variance.short { color: #ef4444; }
.shift-history-variance.balanced { color: #2563eb; }

.shift-history-status .status-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
}

.shift-history-status .status-badge.open {
  background: #d1fae5;
  color: #059669;
}

.shift-history-status .status-badge.closed {
  background: #f3f4f6;
  color: #6b7280;
}

.shift-history-details {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.shift-history-table-row:hover .shift-history-details {
  color: var(--primary);
}

/* ============================================ */
/* STALL BREAKDOWN                             */
/* ============================================ */
.stall-breakdown-container {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.stall-breakdown-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.75rem;
}

.stall-breakdown-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
}

.stall-breakdown-header-name { flex: 2; min-width: 80px; text-align: left; }
.stall-breakdown-header-revenue { min-width: 80px; text-align: right; }
.stall-breakdown-header-quantity { min-width: 70px; text-align: right; }
.stall-breakdown-header-bar { flex: 1.5; min-width: 60px; text-align: left; padding-left: 0.5rem; }

.stall-breakdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
}

.stall-breakdown-item:last-child {
  border-bottom: none;
}

.stall-breakdown-item:hover {
  background: var(--surface);
  border-radius: var(--radius-sm);
}

.stall-breakdown-name { flex: 2; min-width: 80px; font-weight: 500; font-size: 0.85rem; color: var(--text); }
.stall-breakdown-revenue { min-width: 80px; text-align: right; font-weight: 600; font-size: 0.85rem; color: var(--primary); }
.stall-breakdown-quantity { min-width: 70px; text-align: right; font-size: 0.85rem; color: var(--text-secondary); }

.stall-breakdown-bar-wrapper { flex: 1.5; min-width: 60px; display: flex; align-items: center; }
.stall-breakdown-bar { width: 100%; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.stall-breakdown-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--primary), var(--primary-light)); transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

/* ============================================ */
/* STATE TAG                                   */
/* ============================================ */
.state-tag {
  display: inline-block;
  padding: 0.05rem 0.4rem;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  font-size: 0.6rem;
  color: var(--text-secondary);
}

/* ============================================ */
/* STALL PERFORMANCE CONTAINER                 */
/* ============================================ */
.stall-performance-table-container {
  padding: 0.5rem;
  max-height: 380px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--primary) var(--background);
}

.stall-performance-table-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  display: block !important;
}

.stall-performance-table-container::-webkit-scrollbar-track {
  background: var(--background);
  border-radius: 3px;
}

.stall-performance-table-container::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 3px;
}

/* ============================================ */
/* MENU PERFORMANCE CONTAINER                  */
/* ============================================ */
.menu-performance-table-container {
  padding: 0.5rem;
  max-height: 380px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--primary) var(--background);
}

.menu-performance-table-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  display: block !important;
}

.menu-performance-table-container::-webkit-scrollbar-track {
  background: var(--background);
  border-radius: 3px;
}

.menu-performance-table-container::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 3px;
}

/* ============================================ */
/* HEADER ACTIONS                              */
/* ============================================ */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ============================================ */
/* SELECTED COUNT LABEL                        */
/* ============================================ */
.selected-count-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */

@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .performance-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .menu-performance-breakdown-grid { grid-template-columns: repeat(3, 1fr); }
  .revenue-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .transactions-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .users-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .revenue-charts-grid { grid-template-columns: 1fr; }
  .inventory-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .shift-detail-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .sub-tabs {
    flex-direction: column;
    gap: 0.15rem;
  }
  
  .sub-tab {
    width: 100%;
    text-align: center;
    padding: 0.4rem 1rem;
    font-size: 0.75rem;
  }
  
  .filter-bar-modern {
    flex-direction: column;
  }
  
  .filter-bar-modern .filter-search {
    min-width: unset;
    width: 100%;
  }
  
  .filter-bar-modern .filter-group {
    min-width: unset;
    width: 100%;
  }
  
  .filter-bar-modern .filter-actions {
    margin-left: 0;
    justify-content: flex-start;
    width: 100%;
  }
  
  .inventory-table-header {
    display: none;
  }
  
  .inventory-table-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
    min-width: unset;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
    background: var(--surface);
  }
  
  .inventory-table-row.selected {
    border-left: 3px solid var(--primary);
    border-color: var(--primary);
  }
  
  .inventory-table-cell {
    display: flex;
    align-items: center;
    padding: 0.2rem 0;
    width: 100%;
    flex-shrink: 1;
  }
  
  .inventory-table-cell.checkbox {
    width: 100%;
    justify-content: flex-start;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 0.3rem;
  }
  
  .inventory-table-cell.checkbox input[type="checkbox"] {
    margin-right: 0.5rem;
  }
  
  .inventory-table-cell.name::before {
    content: "Stall: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .inventory-table-cell.state::before {
    content: "State: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .inventory-table-cell.items::before {
    content: "Items: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .inventory-table-cell.status::before {
    content: "Status: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }

  
  .users-table-header {
    display: none;
  }
  
  .users-table-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
    min-width: unset;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
    background: var(--surface);
  }
  
  .users-table-cell {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 0.2rem 0 !important;
  width: 100% !important;
  flex-shrink: 1 !important;
}
  
  .users-table-cell.checkbox {
    width: 100%;
    justify-content: flex-start;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 0.3rem;
  }
  
  .users-table-cell.username::before {
    content: "Username: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .users-table-cell.fullname::before {
    content: "Full Name: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .users-table-cell.role::before {
    content: "Role: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .users-table-cell.company::before {
    content: "Company: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .users-table-cell.stalls::before {
    content: "Stalls: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .users-table-cell.actions {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding-top: 0.3rem !important;
  border-top: 1px solid var(--border-light) !important;
  margin-top: 0.3rem !important;
  flex-wrap: wrap !important;
  gap: 0.25rem !important;
  width: 100% !important;
}
  
.users-table-cell.actions::before {
  content: "Actions: " !important;
  font-weight: 600 !important;
  font-size: 0.7rem !important;
  color: var(--text-secondary) !important;
  min-width: 60px !important;
  flex-shrink: 0 !important;
  text-align: left !important;
}

.users-table-cell.actions .btn-action {
  text-align: right !important;
  flex-shrink: 0 !important;
}

.users-table-cell.actions .btn-action:first-child {
  margin-left: auto !important;
}
  
  .performance-table-header {
    display: none;
  }
  
  .performance-table-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
    min-width: unset;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
    background: var(--surface);
  }
  
  .performance-table-row > span {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  
  .performance-table-row > span::before {
    content: attr(data-label);
    font-weight: 600;
    font-size: 0.6rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    min-width: 60px;
    flex-shrink: 0;
    text-align: left;
  }
  
  .revenue-table-header {
    display: none;
  }
  
  .revenue-table-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
    min-width: unset;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
    background: var(--surface);
  }
  
  .revenue-table-row > span {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  
  .revenue-table-row > span::before {
    content: attr(data-label);
    font-weight: 600;
    font-size: 0.6rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    min-width: 60px;
    flex-shrink: 0;
    text-align: left;
  }
  
  .shift-history-table-header {
    display: none;
  }
  
  .shift-history-table-row {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 1rem;
    gap: 0.3rem;
    min-width: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
  }
  
  .shift-history-table-row > span {
    display: flex;
    justify-content: space-between;
    width: 100%;
    text-align: right;
  }
  
  .shift-history-table-row > span::before {
    content: attr(data-label);
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    min-width: 80px;
    text-align: left;
    padding-right: 0.5rem;
    flex-shrink: 0;
  }
  
  .modal-form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-modern {
    width: 95%;
  }
  
  .modal-sm {
    width: 95%;
    max-width: 95%;
  }
  
  .shift-detail-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .transaction-detail-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .modal-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card.glass {
    height: 165px;
    padding: 0.75rem 0.5rem;
  }
  
  .kpi-card {
    height: 140px;
    padding: 0.75rem 0.5rem;
  }
  
  .stat-card.glass .stat-number,
  .kpi-card .kpi-value {
    font-size: 1.5rem;
    height: 2rem;
  }
  
  .chart-modern-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .bulk-mode .stall-checkbox-grid,
  .bulk-mode .menu-checkbox-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .inventory-quick-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .inventory-quick-actions .btn-modern {
    width: 100%;
    justify-content: center;
  }
  
  .pagination-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .performance-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .menu-performance-breakdown-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .revenue-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .transactions-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .users-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .menu-performance-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .revenue-chart-container {
    height: 180px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  .kpi-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  .stat-card.glass {
    height: 150px;
    padding: 0.5rem;
    border-radius: 12px;
  }
  
  .kpi-card {
    height: 125px;
    padding: 0.5rem;
    border-radius: 12px;
  }
  
  .stat-card.glass .stat-number,
  .kpi-card .kpi-value {
    font-size: 1.2rem;
    height: 1.6rem;
  }
  
  .stat-card.glass .stat-icon,
  .kpi-card .kpi-icon {
    font-size: 1.4rem;
    height: 1.8rem;
  }
  
  .kpi-card .sparkline-container {
    height: 25px;
    opacity: 0.3;
  }
  
  .inventory-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .stat-chip {
    padding: 0.35rem 0.6rem;
  }
  
  .stat-chip .stat-chip-value {
    font-size: 1rem;
  }
  
  .stat-chip .stat-chip-label {
    font-size: 0.6rem;
  }
  
  .performance-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .menu-performance-breakdown-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .performance-stats-grid .stat-chip,
  .menu-performance-breakdown-grid .stat-chip {
    padding: 0.35rem 0.6rem;
  }
  
  .performance-stats-grid .stat-chip .stat-chip-value,
  .menu-performance-breakdown-grid .stat-chip .stat-chip-value {
    font-size: 1rem;
  }
  
  .revenue-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .transactions-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .users-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .revenue-stats-grid .stat-chip,
  .transactions-stats-grid .stat-chip,
  .users-stats-grid .stat-chip {
    padding: 0.35rem 0.6rem;
  }
  
  .revenue-stats-grid .stat-chip .stat-chip-value,
  .transactions-stats-grid .stat-chip .stat-chip-value,
  .users-stats-grid .stat-chip .stat-chip-value {
    font-size: 0.85rem;
  }
  
  .shift-detail-grid {
    grid-template-columns: 1fr;
  }
  
  .transaction-detail-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .bulk-mode .stall-checkbox-grid,
  .bulk-mode .menu-checkbox-grid {
    grid-template-columns: 1fr;
  }
  
  .bulk-mode .bulk-actions {
    flex-direction: column;
  }
  
  .quick-update-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-update-actions {
    justify-content: center;
  }
  
  .assignment-item-label {
    font-size: 0.75rem;
  }
  
  .menu-assignment-list .assignment-item {
    padding: 0.35rem 0.5rem;
  }
  
  .chart-modern-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.25rem;
    padding: 0.35rem;
  }
  
  .chart-modern-stat {
    padding: 0.15rem;
  }
  
  .chart-modern-stat-value {
    font-size: 0.75rem;
  }
  
  .chart-modern-stat-label {
    font-size: 0.5rem;
  }
  
  .echarts-container {
    height: 160px;
  }
  
  .revenue-chart-container {
    height: 150px;
  }
  
  .detail-chart {
    height: 150px;
  }
}

/* ============================================ */
/* PERIOD DROPDOWN FIXES                        */
/* ============================================ */

/* Desktop - Make period dropdown wider */
@media (min-width: 769px) {
  .period-dropdown-wrapper {
    min-width: 200px !important;
  }
  
  .period-dropdown-wrapper .dropdown-menu.period-menu {
    min-width: 260px !important;
    max-width: 320px !important;
    padding: 0.5rem !important;
  }
  
  .period-dropdown-wrapper .custom-date-range {
    padding: 0.75rem !important;
    width: 100% !important;
  }
  
  .period-dropdown-wrapper .date-range-inputs {
    display: flex !important;
    flex-direction: row !important;
    gap: 0.5rem !important;
    width: 100% !important;
  }
  
  .period-dropdown-wrapper .date-input-group {
    flex: 1 !important;
    min-width: 0 !important;
  }
  
  .period-dropdown-wrapper .date-input-group input {
    width: 100% !important;
    font-size: 0.75rem !important;
    padding: 0.3rem 0.4rem !important;
  }
  
  .period-dropdown-wrapper .date-input-group label {
    font-size: 0.6rem !important;
  }
  
  .period-dropdown-wrapper .custom-date-range .btn-modern {
    width: 100% !important;
    font-size: 0.7rem !important;
    padding: 0.25rem 0.5rem !important;
  }
}

/* Tablet - Keep responsive */
@media (max-width: 768px) {
  .period-dropdown-wrapper {
    min-width: unset !important;
    width: 100% !important;
  }
  
  .period-dropdown-wrapper .dropdown-menu.period-menu {
    min-width: unset !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .period-dropdown-wrapper .date-range-inputs {
    flex-direction: column !important;
    gap: 0.35rem !important;
  }
  
  .period-dropdown-wrapper .date-input-group {
    width: 100% !important;
  }
  
  .period-dropdown-wrapper .date-input-group input {
    width: 100% !important;
    font-size: 14px !important;
    padding: 0.3rem 0.4rem !important;
  }
}

/* Small mobile - ensure everything fits */
@media (max-width: 480px) {
  .period-dropdown-wrapper .dropdown-menu.period-menu {
    max-width: 100% !important;
    width: 100% !important;
  }
  
  .period-dropdown-wrapper .date-input-group input {
    font-size: 14px !important;
    padding: 0.35rem 0.4rem !important;
  }
  
  .period-dropdown-wrapper .custom-date-range .btn-modern {
    font-size: 0.7rem !important;
    padding: 0.3rem !important;
  }
}

@media (max-width: 768px) {
  /* ===== FIX: Change "Item Name" to "Stall Name" ===== */
  .inventory-table-cell.name::before {
    content: "Stall Name: " !important;
    font-weight: 600 !important;
    font-size: 0.7rem !important;
    color: var(--text-secondary) !important;
    min-width: 60px !important;
    flex-shrink: 0 !important;
    text-align: left !important;
    align-self: flex-start !important;
  }
  
  /* ===== ALL CELLS: Label left, Value right ===== */
  .inventory-table-cell {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 0.2rem 0 !important;
    width: 100% !important;
    flex-shrink: 1 !important;
  }
  
  /* ===== CHECKBOX: Keep left ===== */
  .inventory-table-cell.checkbox {
    justify-content: flex-start !important;
    padding-bottom: 0.3rem !important;
    border-bottom: 1px solid var(--border-light) !important;
    margin-bottom: 0.3rem !important;
  }
  
  .inventory-table-cell.checkbox::before {
    content: "Select: " !important;
    font-weight: 600 !important;
    font-size: 0.7rem !important;
    color: var(--text-secondary) !important;
    min-width: 60px !important;
    flex-shrink: 0 !important;
    text-align: left !important;
  }
  
  /* ===== STALL NAME: Keep column layout like desktop ===== */
  .inventory-table-cell.name {
    flex-direction: column !important;
    align-items: flex-end !important;    /* ← Values RIGHT */
    justify-content: flex-start !important;
    width: 100% !important;
  }
  
  .inventory-table-cell.name .stall-name {
    text-align: right !important;
    font-size: 0.85rem !important;
    font-weight: 500 !important;
    color: var(--text) !important;
    width: 100% !important;
  }
  
  .inventory-table-cell.name .stall-code {
    text-align: right !important;
    font-size: 0.6rem !important;
    color: var(--text-tertiary) !important;
    font-family: monospace !important;
    display: block !important;
    width: 100% !important;
    margin-top: 0.1rem !important;
  }
  
  /* ===== STATE: Label left, Value right ===== */
  .inventory-table-cell.state::before {
    content: "State: " !important;
    font-weight: 600 !important;
    font-size: 0.7rem !important;
    color: var(--text-secondary) !important;
    min-width: 60px !important;
    flex-shrink: 0 !important;
    text-align: left !important;
  }
  
  .inventory-table-cell.state {
    justify-content: space-between !important;
    text-align: right !important;
  }
  
  /* ===== ITEMS: Label LEFT, Values RIGHT ===== */
  .inventory-table-cell.items::before {
    content: "Items: " !important;
    font-weight: 600 !important;
    font-size: 0.7rem !important;
    color: var(--text-secondary) !important;
    min-width: 60px !important;
    flex-shrink: 0 !important;
    text-align: left !important;
  }
  
  .inventory-table-cell.items {
    justify-content: space-between !important;
    flex-wrap: wrap !important;
    gap: 0.25rem !important;
  }
  
  .inventory-table-cell.items .inventory-item-inline {
    text-align: right !important;
  }
  
  /* ===== STATUS: Label LEFT, Badge RIGHT ===== */
  .inventory-table-cell.status::before {
    content: "Status: " !important;
    font-weight: 600 !important;
    font-size: 0.7rem !important;
    color: var(--text-secondary) !important;
    min-width: 60px !important;
    flex-shrink: 0 !important;
    text-align: left !important;
  }
  
  .inventory-table-cell.status {
    justify-content: space-between !important;
    flex-wrap: wrap !important;
    gap: 0.25rem !important;
  }
  
  .inventory-table-cell.status .status-badge {
    text-align: right !important;
  }


/* ===== ACTIONS: Label LEFT, Buttons RIGHT ===== */
.inventory-table-cell.actions {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding-top: 0.3rem !important;
  border-top: 1px solid var(--border-light) !important;
  margin-top: 0.3rem !important;
  flex-wrap: wrap !important;
  gap: 0.25rem !important;
  width: 100% !important;
}

.inventory-table-cell.actions::before {
  content: "Actions: " !important;
  font-weight: 600 !important;
  font-size: 0.7rem !important;
  color: var(--text-secondary) !important;
  min-width: 60px !important;
  flex-shrink: 0 !important;
  text-align: left !important;
}

.inventory-table-cell.actions .btn-action {
  text-align: right !important;
  flex-shrink: 0 !important;
}

/* Push the first button (Edit) to the right */
.inventory-table-cell.actions .btn-action:first-child {
  margin-left: auto !important;
}


/* ===== EVEN SMALLER SCREENS ===== */
@media (max-width: 480px) {
  .inventory-table-cell::before {
    font-size: 0.6rem !important;
    min-width: 50px !important;
  }
  
  .inventory-table-cell .stall-name {
    font-size: 0.75rem !important;
  }
  
  .inventory-table-cell .stall-code {
    font-size: 0.55rem !important;
  }
  
  .inventory-item-inline {
    font-size: 0.55rem !important;
    padding: 0.05rem 0.25rem !important;
  }
  
  .inventory-table-cell.actions .btn-action {
    font-size: 0.55rem !important;
    padding: 0.1rem 0.3rem !important;
  }
  
  .inventory-table-cell.status .status-badge {
    font-size: 0.5rem !important;
    padding: 0.05rem 0.3rem !important;
  }
}

/* ============================================ */
/* USERS TAB - CONSISTENT FONT SIZES            */
/* ============================================ */

/* All user table cells - consistent size */
.users-table-wrapper .users-table-row .users-table-cell {
  font-size: 0.8rem !important;
}

/* Username - same size */
.users-table-wrapper .users-table-row .users-table-cell .username-text {
  font-size: 0.8rem !important;
  font-weight: 500;
}

/* Full name - same size */
.users-table-wrapper .users-table-row .users-table-cell .fullname {
  font-size: 0.8rem !important;
}

/* Company - ensure same size */
.users-table-wrapper .users-table-row .users-table-cell .company {
  font-size: 0.8rem !important;
}

/* Role badges - smaller */
.users-table-wrapper .users-table-row .users-table-cell .role-badge {
  font-size: 0.65rem !important;
  padding: 0.1rem 0.5rem;
}

/* Stall badges - smallest */
.users-table-wrapper .users-table-row .users-table-cell .stall-badge {
  font-size: 0.6rem !important;
  padding: 0.05rem 0.3rem;
}

/* Status badges - consistent */
.users-table-wrapper .users-table-row .users-table-cell .status-badge {
  font-size: 0.6rem !important;
  padding: 0.05rem 0.3rem;
}

/* No stalls text */
.users-table-wrapper .users-table-row .users-table-cell .no-stalls {
  font-size: 0.6rem !important;
}

/* Action buttons - smaller */
.users-table-wrapper .users-table-row .users-table-cell .btn-action {
  font-size: 0.6rem !important;
  padding: 0.1rem 0.3rem;
}
}

/* ============================================ */
/* MENU MANAGEMENT - OVERRIDE INVENTORY CLASSES */
/* ============================================ */

/* Mobile - Fix menu item name label */
@media (max-width: 768px) {
  .menu-management-table .inventory-table-row .inventory-table-cell.name::before {
    content: "Item Name: " !important;
  }
}

/* Desktop - Fix header column widths */
.menu-management-table .inventory-table-header .inventory-table-cell.price {
  width: 80px !important;
  flex-shrink: 0 !important;
}

.menu-management-table .inventory-table-header .inventory-table-cell.category {
  width: 100px !important;
  flex-shrink: 0 !important;
}

.menu-management-table .inventory-table-header .inventory-table-cell.recipe {
  flex: 1.5 !important;
  min-width: 100px !important;
}

/* ============================================ */
/* MENU MANAGEMENT - FONT SIZE FIXES            */
/* ============================================ */

/* Fix Price and Category font sizes on mobile */
@media (max-width: 768px) {
  .menu-management-table .inventory-table-row .inventory-table-cell.price {
    font-size: 0.8rem !important;
  }
  
  .menu-management-table .inventory-table-row .inventory-table-cell.category {
    font-size: 0.8rem !important;
  }
  
  .menu-management-table .inventory-table-row .inventory-table-cell.recipe .recipe-tag {
    font-size: 0.65rem !important;
  }
}

/* Desktop - Consistent font sizes */
.menu-management-table .inventory-table-row .inventory-table-cell.price {
  font-size: 0.85rem !important;
  font-weight: 600 !important;
}

.menu-management-table .inventory-table-row .inventory-table-cell.category {
  font-size: 0.85rem !important;
}

/* ============================================ */
/* MENU MANAGEMENT - STATUS COLUMN              */
/* ============================================ */

.menu-management-table .inventory-table-header .inventory-table-cell.status {
  width: 100px;
  flex-shrink: 0;
  text-align: center;
}

.menu-management-table .inventory-table-row .inventory-table-cell.status {
  width: 100px;
  flex-shrink: 0;
  justify-content: center;
}

@media (max-width: 768px) {
  .menu-management-item .inventory-table-cell.status::before {
    content: "Status: " !important;
    font-weight: 600 !important;
    font-size: 0.7rem !important;
    color: var(--text-secondary) !important;
    min-width: 60px !important;
    flex-shrink: 0 !important;
    text-align: left !important;
  }
  
  .menu-management-item .inventory-table-cell.status {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 0.2rem 0 !important;
    width: 100% !important;
  }
}

/* ============================================ */
/* FIX: MENU MANAGEMENT DESKTOP TABLE LAYOUT    */
/* ============================================ */

/* Desktop (≥ 769px) - Show as proper table */
@media (min-width: 769px) {
  .menu-management-table .inventory-table-header {
    display: flex !important;
    padding: 0.5rem 0.75rem !important;
    background: var(--background) !important;
    border-bottom: 2px solid var(--border) !important;
    font-weight: 600 !important;
    font-size: 0.7rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.3px !important;
    color: var(--text-secondary) !important;
  }

  .menu-management-table .inventory-table-row {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    padding: 0.5rem 0.75rem !important;
    min-width: unset !important;
    border: none !important;
    border-bottom: 1px solid var(--border-light) !important;
    border-radius: 0 !important;
    margin-bottom: 0 !important;
    background: transparent !important;
  }

  .menu-management-table .inventory-table-row:hover {
    background: var(--background) !important;
  }

  .menu-management-table .inventory-table-cell {
    display: flex !important;
    align-items: center !important;
    padding: 0.2rem 0.5rem !important;
    flex-shrink: 0 !important;
    flex-direction: row !important;
    justify-content: flex-start !important;
    width: auto !important;
  }

  /* Hide label pseudo-elements on desktop */
  .menu-management-table .inventory-table-cell::before {
    display: none !important;
  }

  /* Cell widths */
  .menu-management-table .inventory-table-cell.name {
    flex: 1 !important;
    min-width: 120px !important;
  }

  .menu-management-table .inventory-table-cell.price {
    width: 80px !important;
    flex-shrink: 0 !important;
  }

  .menu-management-table .inventory-table-cell.category {
    width: 100px !important;
    flex-shrink: 0 !important;
  }

  .menu-management-table .inventory-table-cell.recipe {
    flex: 1.5 !important;
    min-width: 120px !important;
  }

  .menu-management-table .inventory-table-cell.status {
    width: 100px !important;
    flex-shrink: 0 !important;
    justify-content: center !important;
  }

  .menu-management-table .inventory-table-cell.actions {
    width: 120px !important;
    flex-shrink: 0 !important;
    justify-content: flex-end !important;
    gap: 0.25rem !important;
  }
}

/* Mobile (≤ 768px) - Show as cards with labels */
@media (max-width: 768px) {
  .menu-management-table .inventory-table-header {
    display: none !important;
  }

  .menu-management-table .inventory-table-row {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    padding: 0.75rem !important;
    min-width: unset !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-sm) !important;
    margin-bottom: 0.5rem !important;
    background: var(--surface) !important;
  }

  .menu-management-table .inventory-table-cell {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 0.2rem 0 !important;
    width: 100% !important;
    flex-shrink: 1 !important;
  }

  .menu-management-table .inventory-table-cell::before {
    content: attr(data-label) !important;
    font-weight: 600 !important;
    font-size: 0.7rem !important;
    color: var(--text-secondary) !important;
    min-width: 60px !important;
    flex-shrink: 0 !important;
    text-align: left !important;
  }
}

</style>