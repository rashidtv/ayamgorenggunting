<template>
  <div class="dashboard-header">
    <!-- ===== TOP ROW: User Controls (only when logged in) ===== -->
    <div v-if="!isPublic" class="top-controls-row">
      <div class="user-controls">
        <button 
          @click="toggleNotifications" 
          class="control-btn" 
          :title="notificationsEnabled ? 'Disable alerts' : 'Enable alerts'"
        >
          <span class="control-icon">{{ notificationsEnabled ? '🔔' : '🔕' }}</span>
        </button>
        <button @click="toggleDarkMode" class="control-btn" :title="darkMode ? 'Light mode' : 'Dark mode'">
          <span class="control-icon">{{ darkMode ? '☀️' : '🌙' }}</span>
        </button>
        <span class="user-badge">{{ roleText }}</span>
        <button @click="logout" class="logout-btn" title="Sign Out">
          <span class="logout-text">Logout</span>
        </button>
      </div>
    </div>

    <!-- ===== BANNER SECTION ===== -->
    <div v-if="bannerUrl" class="banner-section">
      <img :src="bannerUrl" alt="System Banner" class="dashboard-banner" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardHeader',
  props: {
    roleText: {
      type: String,
      required: true,
      default: 'User'
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    bannerUrl: {
      type: String,
      default: null
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    toggleDarkMode() {
      this.$emit('toggle-dark-mode')
    },
    toggleNotifications() {
      this.$emit('toggle-notifications')
    },
    logout() {
      this.$emit('logout')
    }
  }
}
</script>

<style scoped>
.dashboard-header {
  width: 100%;
}

/* ============================================ */
/* TOP CONTROLS ROW                             */
/* ============================================ */
.top-controls-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 1.25rem;
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: nowrap;
}

.control-btn {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.3rem 0.4rem;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.control-btn:hover {
  background: var(--surface-elevated);
  border-color: var(--primary);
}

.user-badge {
  background: var(--primary-gradient);
  color: white;
  padding: 0.2rem 0.7rem;
  border-radius: var(--radius-xl);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.logout-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 500;
}

.logout-btn:hover {
  background: var(--error);
  color: white;
  border-color: var(--error);
}

/* ============================================ */
/* BANNER SECTION                               */
/* ============================================ */
.banner-section {
  margin-bottom: 1.25rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: var(--surface);
  padding: 0.5rem;
}

.dashboard-banner {
  width: 100%;
  height: auto;
  max-height: 220px;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */
@media (max-width: 1024px) {
  .dashboard-banner {
    max-height: 180px;
  }
}

@media (max-width: 768px) {
  .top-controls-row {
    justify-content: center;
  }
  
  .user-controls {
    justify-content: center;
    gap: 0.25rem;
  }
  
  .user-badge {
    font-size: 0.6rem;
    padding: 0.15rem 0.5rem;
  }
  
  .logout-btn {
    font-size: 0.6rem;
    padding: 0.15rem 0.5rem;
  }
  
  .control-btn {
    padding: 0.2rem 0.3rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .dashboard-banner {
    max-height: 90px;
  }
  
  .user-controls {
    gap: 0.2rem;
  }
  
  .user-badge {
    font-size: 0.5rem;
    padding: 0.1rem 0.4rem;
  }
  
  .logout-btn {
    font-size: 0.5rem;
    padding: 0.1rem 0.4rem;
  }
  
  .control-btn {
    padding: 0.15rem 0.25rem;
    font-size: 0.65rem;
  }
}
</style>