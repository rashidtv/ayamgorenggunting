<template>
  <div class="ssa-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <h2>👑 Super Admin Dashboard</h2>
      <p class="subtitle">System-wide management & monitoring</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ health.total_users || 0 }}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stalls">🏪</div>
        <div class="stat-info">
          <div class="stat-value">{{ health.total_stalls || 0 }}</div>
          <div class="stat-label">Total Stalls</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon db">💾</div>
        <div class="stat-info">
          <div class="stat-value">{{ health.db_size_mb || 0 }} MB</div>
          <div class="stat-label">Database Size</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon uptime">📈</div>
        <div class="stat-info">
          <div class="stat-value">{{ health.uptime || 99.95 }}%</div>
          <div class="stat-label">Uptime</div>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="two-col">
      <!-- Left: Announcements -->
      <div class="card">
        <div class="card-header">
          <h3>📢 Global Announcements</h3>
          <button @click="showAnnouncementModal = true" class="btn btn-primary btn-sm">
            + New
          </button>
        </div>
        <div class="card-body">
          <div v-if="announcements.length === 0" class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No announcements yet</p>
          </div>
          <div v-for="a in announcements" :key="a.id" class="announcement-item">
            <div class="announcement-content">
              <strong>{{ a.title }}</strong>
              <p>{{ a.content }}</p>
              <small>Target: {{ a.target_roles?.join(', ') || 'All' }}</small>
            </div>
            <button @click="deleteAnnouncement(a.id)" class="btn-delete">✕</button>
          </div>
        </div>
      </div>

      <!-- Right: Quick Actions -->
      <div class="card">
        <div class="card-header">
          <h3>⚡ Quick Actions</h3>
        </div>
        <div class="card-body">
          <div class="quick-actions">
            <button @click="openCompanyModal()" class="quick-btn">
              <span class="quick-icon">🏢</span>
              <span>New Company</span>
            </button>
            <button @click="loadData" class="quick-btn">
              <span class="quick-icon">🔄</span>
              <span>Refresh Data</span>
            </button>
            <button @click="activeTab = 'settings'" class="quick-btn">
              <span class="quick-icon">⚙️</span>
              <span>System Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SETTINGS TAB - System Admin Only              -->
    <!-- ============================================ -->
    <div v-if="activeTab === 'settings'" class="card full-width">
      <div class="card-header">
        <div>
          <h3>⚙️ System Settings</h3>
          <span class="card-subtitle">Customize the platform appearance</span>
        </div>
        <button @click="activeTab = null" class="btn-close">✕ Close</button>
      </div>
      <div class="card-body">
        <!-- Banner Upload Section -->
        <div class="settings-section">
          <h4>Login Page Banner</h4>
          <p class="settings-description">
            Upload a banner image that will appear on the login page across all companies.
            Recommended size: 3840 x 2160 pixels (16:9 ratio)
          </p>
          
          <div class="banner-upload-area">
            <!-- Current Banner Preview -->
            <div v-if="bannerPreview || systemBanner" class="banner-preview">
              <img 
                :src="bannerPreview || systemBanner" 
                alt="Login Banner" 
                class="banner-image-preview"
              />
              <button 
                v-if="bannerPreview" 
                @click="removeBannerPreview" 
                class="remove-banner-btn"
                title="Remove banner"
              >
                ✕
              </button>
            </div>
            
            <!-- Upload Area -->
            <div 
              v-else 
              class="upload-drop-zone"
              @dragover.prevent 
              @drop.prevent="handleBannerDrop"
            >
              <input 
                type="file" 
                ref="bannerInput" 
                accept="image/*" 
                @change="handleBannerSelect" 
                style="display:none" 
              />
              <div class="upload-content">
                <span class="upload-icon">🖼️</span>
                <p>Drag & drop your banner image here</p>
                <p class="upload-hint">or <span @click="$refs.bannerInput.click()" class="upload-link">click to browse</span></p>
                <p class="upload-format">Supports: JPG, PNG, WebP | Max: 10MB</p>
              </div>
            </div>
            
            <!-- Upload Progress -->
            <div v-if="uploading" class="upload-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
              </div>
              <span class="progress-text">{{ uploadProgress }}%</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="banner-actions">
            <button 
              @click="saveBanner" 
              class="btn btn-primary" 
              :disabled="!bannerPreview || uploading"
            >
              {{ uploading ? 'Uploading...' : 'Save Banner' }}
            </button>
            <button 
              v-if="systemBanner" 
              @click="removeBanner" 
              class="btn btn-danger"
            >
              Remove Banner
            </button>
          </div>
          
          <!-- Current Banner Info -->
          <div v-if="systemBanner" class="banner-info">
            <span class="info-label">Current Banner:</span>
            <span class="info-value">{{ systemBanner }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Companies Table -->
    <div v-if="activeTab !== 'settings'" class="card full-width">
      <div class="card-header">
        <h3>🏢 Companies</h3>
        <button @click="openCompanyModal()" class="btn btn-primary btn-sm">+ New</button>
      </div>
      <div class="card-body table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Tier</th>
              <th>Max Stalls</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in companies" :key="c.id">
              <td><strong>{{ c.name }}</strong></td>
              <td><code>{{ c.code }}</code></td>
              <td><span class="badge-tier">{{ c.subscription_tier || 'basic' }}</span></td>
              <td>{{ c.max_stalls || 5 }}</td>
              <td>
                <span :class="['status-badge', c.is_active ? 'active' : 'inactive']">
                  {{ c.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="selectCompany(c)" class="btn-icon-sm" title="Manage Stalls & Users">📋</button>
                  <button @click="openEditCompany(c)" class="btn-icon-sm" title="Edit">✏️</button>
                  <button @click="toggleCompany(c)" class="btn-icon-sm" :title="c.is_active ? 'Deactivate' : 'Activate'">
                    {{ c.is_active ? '⏸️' : '▶️' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="companies.length === 0" class="empty-state">
          <span class="empty-icon">🏢</span>
          <p>No companies created yet</p>
        </div>
      </div>
    </div>

    <!-- Stall & User Management for Selected Company -->
    <div v-if="selectedCompany && activeTab !== 'settings'" class="card full-width selected-company">
      <div class="card-header">
        <h3>📍 {{ selectedCompany.name }} – Management</h3>
        <button @click="selectedCompany = null" class="btn-close">✕ Close</button>
      </div>
      <div class="card-body">
        <!-- Tabs -->
        <div class="tabs">
          <button class="tab active">Stalls</button>
          <button class="tab">Users</button>
        </div>

        <!-- Stalls -->
        <div class="sub-section">
          <div class="sub-header">
            <h4>Stalls</h4>
            <button @click="openStallModal()" class="btn btn-primary btn-sm">+ New Stall</button>
          </div>
          <table class="data-table compact">
            <thead>
              <tr><th>Name</th><th>Code</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in stalls" :key="s.id">
                <td>{{ s.name }}</td>
                <td><code>{{ s.code }}</code></td>
                <td>
                  <span :class="['status-badge', s.is_active ? 'active' : 'inactive']">
                    {{ s.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <button @click="toggleStall(s)" class="btn-icon-sm">
                    {{ s.is_active ? '⏸️' : '▶️' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Users -->
        <div class="sub-section">
          <div class="sub-header">
            <h4>Users</h4>
            <button @click="openUserModal()" class="btn btn-primary btn-sm">+ New User</button>
          </div>
          <table class="data-table compact">
            <thead>
              <tr><th>Username</th><th>Role</th><th>Stalls</th></tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td>{{ u.username }}</td>
                <td><span class="role-badge">{{ u.role }}</span></td>
                <td>{{ (u.assigned_stalls || []).map(s => s.name).join(', ') || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Low Stock Alerts -->
        <div class="sub-section">
          <h4>⚠️ Low Stock Alerts</h4>
          <div v-if="lowStock.length === 0" class="empty-state small">
            ✅ All stock levels are healthy
          </div>
          <div v-for="item in lowStock" :key="item.stall_name + item.material_name" class="alert-item">
            <span class="alert-icon">⚠️</span>
            <span>{{ item.stall_name }} – {{ item.material_name }}: {{ item.current_level }}kg (Alert: {{ item.alert_level }}kg)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="companyModal" class="modal-overlay" @click.self="companyModal=false">
      <div class="modal">
        <h3>{{ editingCompany ? 'Edit Company' : 'New Company' }}</h3>
        <div class="modal-body">
          <input v-model="companyForm.name" placeholder="Company Name" />
          <input v-model="companyForm.code" placeholder="Company Code" />
          <select v-model="companyForm.subscription_tier">
            <option>basic</option>
            <option>premium</option>
            <option>enterprise</option>
          </select>
          <input type="number" v-model="companyForm.max_stalls" placeholder="Max Stalls" />
        </div>
        <div class="modal-actions">
          <button @click="companyModal=false" class="btn btn-ghost">Cancel</button>
          <button @click="saveCompany" class="btn btn-primary">{{ editingCompany ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <div v-if="stallModal" class="modal-overlay" @click.self="stallModal=false">
      <div class="modal">
        <h3>New Stall</h3>
        <div class="modal-body">
          <input v-model="newStall.name" placeholder="Stall Name" />
          <input v-model="newStall.code" placeholder="Stall Code" />
          <input v-model="newStall.location" placeholder="Location" />
        </div>
        <div class="modal-actions">
          <button @click="stallModal=false" class="btn btn-ghost">Cancel</button>
          <button @click="createStall" class="btn btn-primary">Create</button>
        </div>
      </div>
    </div>

    <div v-if="userModal" class="modal-overlay" @click.self="userModal=false">
      <div class="modal">
        <h3>New User</h3>
        <div class="modal-body">
          <input v-model="newUser.username" placeholder="Username" />
          <input type="password" v-model="newUser.password" placeholder="Password" />
          <input v-model="newUser.full_name" placeholder="Full Name" />
          <select v-model="newUser.role">
            <option value="stall_admin">Stall Admin</option>
            <option value="cashier">Cashier</option>
          </select>
          <select v-if="newUser.role === 'stall_admin'" multiple v-model="newUser.stall_ids">
            <option v-for="s in stalls" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="userModal=false" class="btn btn-ghost">Cancel</button>
          <button @click="createUser" class="btn btn-primary">Create</button>
        </div>
      </div>
    </div>

    <div v-if="showAnnouncementModal" class="modal-overlay" @click.self="showAnnouncementModal=false">
      <div class="modal">
        <h3>📢 New Announcement</h3>
        <div class="modal-body">
          <input v-model="newAnnouncement.title" placeholder="Title" />
          <textarea v-model="newAnnouncement.content" placeholder="Content" rows="3"></textarea>
          <select multiple v-model="newAnnouncement.target_roles">
            <option>super_super_admin</option>
            <option>super_admin</option>
            <option>stall_admin</option>
            <option>cashier</option>
          </select>
          <input type="date" v-model="newAnnouncement.end_date" />
        </div>
        <div class="modal-actions">
          <button @click="showAnnouncementModal=false" class="btn btn-ghost">Cancel</button>
          <button @click="createAnnouncement" class="btn btn-primary">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import API_BASE from '../config/api.js'

export default {
  props: ['token'],
  data() {
    return {
      // Existing data
      health: { total_users: 0, total_stalls: 0, db_size_mb: 0, uptime: 99.95 },
      announcements: [],
      companies: [],
      selectedCompany: null,
      stalls: [],
      users: [],
      lowStock: [],
      companyModal: false,
      editingCompany: false,
      companyForm: { name: '', code: '', subscription_tier: 'basic', max_stalls: 5 },
      stallModal: false,
      newStall: { name: '', code: '', location: '' },
      userModal: false,
      newUser: { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] },
      showAnnouncementModal: false,
      newAnnouncement: { title: '', content: '', target_roles: [], end_date: '' },
      
      // New Settings data
      activeTab: null,
      bannerPreview: null,
      bannerFile: null,
      uploading: false,
      uploadProgress: 0,
      systemBanner: localStorage.getItem('systemBanner') || null,
    }
  },
  mounted() {
    this.loadData()
    this.fetchBanner()
  },
  methods: {
    // =============================================
    // EXISTING METHODS
    // =============================================
    async loadData() {
      try {
        const [health, ann, comp] = await Promise.all([
          axios.get(`${API_BASE}/system/health`, { headers: { Authorization: `Bearer ${this.token}` } }),
          axios.get(`${API_BASE}/announcements`, { headers: { Authorization: `Bearer ${this.token}` } }),
          axios.get(`${API_BASE}/companies`, { headers: { Authorization: `Bearer ${this.token}` } })
        ])
        this.health = health.data
        this.announcements = ann.data
        this.companies = comp.data
        if (this.selectedCompany) {
          this.loadStalls()
          this.loadUsers()
          this.loadLowStock()
        }
        this.$emit('show-notification', 'Data refreshed', 'success')
      } catch (err) {
        this.$emit('show-notification', err.message, 'error')
      }
    },
    selectCompany(company) {
      this.selectedCompany = company
      this.loadStalls()
      this.loadUsers()
      this.loadLowStock()
    },
    async loadStalls() {
      const res = await axios.get(`${API_BASE}/companies/${this.selectedCompany.id}/stalls`, { headers: { Authorization: `Bearer ${this.token}` } })
      this.stalls = res.data
    },
    async loadUsers() {
      const res = await axios.get(`${API_BASE}/companies/${this.selectedCompany.id}/users`, { headers: { Authorization: `Bearer ${this.token}` } })
      this.users = res.data
    },
    async loadLowStock() {
      const res = await axios.get(`${API_BASE}/companies/${this.selectedCompany.id}/low-stock`, { headers: { Authorization: `Bearer ${this.token}` } })
      this.lowStock = res.data
    },
    openCompanyModal(company = null) {
      this.editingCompany = !!company
      this.companyForm = company ? { ...company } : { name: '', code: '', subscription_tier: 'basic', max_stalls: 5 }
      this.companyModal = true
    },
    openEditCompany(company) { this.openCompanyModal(company) },
    async saveCompany() {
      try {
        if (this.editingCompany) {
          await axios.put(`${API_BASE}/companies/${this.companyForm.id}`, this.companyForm, { headers: { Authorization: `Bearer ${this.token}` } })
        } else {
          await axios.post(`${API_BASE}/companies`, this.companyForm, { headers: { Authorization: `Bearer ${this.token}` } })
        }
        this.companyModal = false
        this.loadData()
        this.$emit('show-notification', this.editingCompany ? 'Company updated' : 'Company created', 'success')
      } catch (err) { this.$emit('show-notification', 'Operation failed', 'error') }
    },
    async toggleCompany(company) {
      await axios.put(`${API_BASE}/companies/${company.id}`, { is_active: !company.is_active }, { headers: { Authorization: `Bearer ${this.token}` } })
      this.loadData()
    },
    openStallModal() { this.newStall = { name: '', code: '', location: '' }; this.stallModal = true },
    async createStall() {
      await axios.post(`${API_BASE}/companies/${this.selectedCompany.id}/stalls`, this.newStall, { headers: { Authorization: `Bearer ${this.token}` } })
      this.stallModal = false
      this.loadStalls()
      this.$emit('show-notification', 'Stall created', 'success')
    },
    async toggleStall(stall) {
      await axios.put(`${API_BASE}/stalls/${stall.id}/toggle`, {}, { headers: { Authorization: `Bearer ${this.token}` } })
      this.loadStalls()
    },
    openUserModal() { this.newUser = { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] }; this.userModal = true },
    async createUser() {
      await axios.post(`${API_BASE}/companies/${this.selectedCompany.id}/users`, this.newUser, { headers: { Authorization: `Bearer ${this.token}` } })
      this.userModal = false
      this.loadUsers()
      this.$emit('show-notification', 'User created', 'success')
    },
    async createAnnouncement() {
      await axios.post(`${API_BASE}/announcements`, this.newAnnouncement, { headers: { Authorization: `Bearer ${this.token}` } })
      this.showAnnouncementModal = false
      this.loadData()
      this.$emit('show-notification', 'Announcement created', 'success')
    },
    async deleteAnnouncement(id) {
      await axios.delete(`${API_BASE}/announcements/${id}`, { headers: { Authorization: `Bearer ${this.token}` } })
      this.loadData()
    },

    // =============================================
    // BANNER MANAGEMENT METHODS
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

    handleBannerSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.processBannerFile(file)
      }
    },

    handleBannerDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.processBannerFile(file)
      }
    },

    processBannerFile(file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.$emit('show-notification', 'File too large. Maximum size is 10MB.', 'error')
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        this.$emit('show-notification', 'Please upload JPG, PNG, or WebP images only.', 'error')
        return
      }
      
      this.bannerFile = file
      const reader = new FileReader()
      reader.onload = (e) => {
        this.bannerPreview = e.target.result
      }
      reader.readAsDataURL(file)
      
      // Reset input
      if (this.$refs.bannerInput) {
        this.$refs.bannerInput.value = ''
      }
    },

    async saveBanner() {
      if (!this.bannerPreview) {
        this.$emit('show-notification', 'Please select an image first.', 'warning')
        return
      }
      
      this.uploading = true
      this.uploadProgress = 0
      
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          if (this.uploadProgress < 90) {
            this.uploadProgress += 10
          }
        }, 200)
        
        // Upload the banner
        const formData = new FormData()
        formData.append('banner', this.bannerFile || this.dataUrlToBlob(this.bannerPreview))
        
        const response = await axios.post(`${API_BASE}/system/banner`, formData, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            this.uploadProgress = Math.min(percentCompleted, 95)
          }
        })
        
        clearInterval(progressInterval)
        this.uploadProgress = 100
        
        if (response.data.success) {
          this.systemBanner = response.data.bannerUrl
          localStorage.setItem('systemBanner', response.data.bannerUrl)
          this.$emit('show-notification', 'Banner uploaded successfully!', 'success')
          
          // Clear preview after save
          setTimeout(() => {
            this.bannerPreview = null
            this.bannerFile = null
            this.uploadProgress = 0
            this.uploading = false
          }, 1000)
        }
      } catch (err) {
        console.error('Banner upload error:', err)
        const errorMsg = err.response?.data?.error || 'Failed to upload banner. Please try again.'
        this.$emit('show-notification', errorMsg, 'error')
        this.uploading = false
        this.uploadProgress = 0
      }
    },

    async removeBanner() {
      if (!confirm('Remove the system banner image?')) return
      
      try {
        await axios.delete(`${API_BASE}/system/banner`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.systemBanner = null
        this.bannerPreview = null
        this.bannerFile = null
        localStorage.removeItem('systemBanner')
        this.$emit('show-notification', 'Banner removed successfully.', 'success')
      } catch (err) {
        console.error('Remove banner error:', err)
        this.$emit('show-notification', 'Failed to remove banner.', 'error')
      }
    },

    removeBannerPreview() {
      this.bannerPreview = null
      this.bannerFile = null
      if (this.$refs.bannerInput) {
        this.$refs.bannerInput.value = ''
      }
    },

    dataUrlToBlob(dataUrl) {
      const arr = dataUrl.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], { type: mime })
    }
  }
}
</script>

<style scoped>
.ssa-dashboard {
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Page Header */
.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.page-header .subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0.25rem 0 0 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.users { background: #e0f2fe; color: #0284c7; }
.stat-icon.stalls { background: #dbeafe; color: #2563eb; }
.stat-icon.db { background: #ede9fe; color: #7c3aed; }
.stat-icon.uptime { background: #d1fae5; color: #059669; }

.stat-info .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.stat-info .stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Two Column Layout */
.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Cards */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.card.full-width {
  grid-column: 1 / -1;
  margin-bottom: 1.5rem;
}

.card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--background);
}

.card-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.card-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 400;
}

.card-body {
  padding: 1.25rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-sm {
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--background);
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.btn-close:hover {
  background: var(--background);
  color: var(--text);
}

.btn-delete {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.btn-delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

.btn-icon-sm {
  background: transparent;
  border: none;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-icon-sm:hover {
  background: var(--background);
}

/* Tables */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}

.data-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  color: var(--text);
}

.data-table tr:hover td {
  background: var(--background);
}

.data-table code {
  background: var(--background);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.data-table.compact td,
.data-table.compact th {
  padding: 0.4rem 0.6rem;
}

/* Status Badges */
.status-badge {
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.badge-tier {
  background: var(--background);
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.role-badge {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: capitalize;
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* Announcements */
.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border-light);
}

.announcement-item:last-child {
  border-bottom: none;
}

.announcement-content strong {
  display: block;
  font-size: 0.9rem;
}

.announcement-content p {
  margin: 0.2rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.announcement-content small {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

/* Quick Actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
}

.quick-btn:hover {
  border-color: #F94908;
  background: rgba(249, 73, 8, 0.05);
}

.quick-icon {
  font-size: 1.2rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-state .empty-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-state.small {
  padding: 0.5rem;
  font-size: 0.85rem;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab {
  padding: 0.4rem 1rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
}

.tab.active {
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
}

/* Sub Sections */
.sub-section {
  margin-top: 1.25rem;
}

.sub-section:first-child {
  margin-top: 0;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.sub-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}

/* Alerts */
.alert-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
}

.alert-item:last-child {
  margin-bottom: 0;
}

.alert-icon {
  font-size: 1rem;
}

/* ============================================ */
/* SETTINGS - BANNER UPLOAD                    */
/* ============================================ */
.settings-section {
  padding: 0.5rem 0;
}

.settings-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
}

.settings-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.banner-upload-area {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  background: var(--background);
  margin-bottom: 1rem;
}

.banner-upload-area:hover {
  border-color: #F94908;
}

.banner-preview {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.banner-image-preview {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.remove-banner-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-banner-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.upload-drop-zone {
  width: 100%;
  padding: 2rem;
  cursor: pointer;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 3rem;
}

.upload-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.upload-hint {
  font-size: 0.85rem !important;
}

.upload-link {
  color: #F94908;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.upload-link:hover {
  color: #d63d07;
}

.upload-format {
  font-size: 0.75rem !important;
  color: var(--text-tertiary) !important;
}

.upload-progress {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.banner-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.banner-info {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: 8px;
  font-size: 0.8rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.info-value {
  color: var(--text);
  word-break: break-all;
  font-size: 0.75rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--surface);
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-body input,
.modal-body select,
.modal-body textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--surface);
  color: var(--text);
  width: 100%;
}

.modal-body input:focus,
.modal-body select:focus,
.modal-body textarea:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .two-col {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .data-table {
    font-size: 0.8rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.4rem 0.5rem;
  }
  
  .modal {
    width: 95%;
    padding: 1rem;
  }

  .banner-preview {
    max-width: 100%;
  }
  
  .banner-image-preview {
    max-height: 200px;
  }
  
  .upload-drop-zone {
    padding: 1rem;
  }
  
  .upload-icon {
    font-size: 2rem;
  }
  
  .upload-content p {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-info .stat-value {
    font-size: 1.2rem;
  }
}
</style>