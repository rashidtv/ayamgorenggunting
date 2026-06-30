<template>
  <div class="super-admin-panel">
    <!-- ============================================ -->
    <!-- HEADER WITH STATS                            -->
    <!-- ============================================ -->
    <div class="panel-header">
      <div class="header-left">
        <h1 class="panel-title">🏢 Super Admin Dashboard</h1>
        <span class="company-badge">{{ companyName || 'AGG Holdings' }}</span>
      </div>
      <div class="header-right">
        <button @click="refreshAllData" class="btn-modern secondary" :disabled="loading">
          <span class="btn-icon">⟳</span> Refresh
        </button>
        <button @click="exportAllData" class="btn-modern primary" :disabled="exporting">
          <span class="btn-icon">{{ exporting ? '...' : '⬇' }}</span> Export
        </button>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STATS CARDS                                  -->
    <!-- ============================================ -->
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color: #2563eb;">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <span class="stat-number">{{ stalls.length }}</span>
          <span class="stat-label">Total Stalls</span>
        </div>
        <div class="stat-trend up">+12%</div>
      </div>
      <div class="stat-card" style="--stat-color: #7c3aed;">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <span class="stat-number">{{ users.length }}</span>
          <span class="stat-label">Total Users</span>
        </div>
        <div class="stat-trend up">+8%</div>
      </div>
      <div class="stat-card" style="--stat-color: #dc2626;">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <span class="stat-number">{{ lowStock.length }}</span>
          <span class="stat-label">Low Stock Alerts</span>
        </div>
        <div class="stat-trend" :class="lowStock.length > 0 ? 'down' : 'up'">
          {{ lowStock.length > 0 ? '⚠️' : '✅' }}
        </div>
      </div>
      <div class="stat-card" style="--stat-color: #059669;">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <span class="stat-number">{{ menuItems.length }}</span>
          <span class="stat-label">Menu Items</span>
        </div>
        <div class="stat-trend up">+5%</div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- TAB NAVIGATION                               -->
    <!-- ============================================ -->
    <div class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
        <span v-if="tab.id === 'inventory' && lowStock.length > 0" class="tab-badge">
          {{ lowStock.length }}
        </span>
      </button>
    </div>

    <!-- ============================================ -->
    <!-- TAB CONTENT                                  -->
    <!-- ============================================ -->
    <div class="tab-content">
      
      <!-- ===== INVENTORY TAB ===== -->
      <div v-if="activeTab === 'inventory'" class="tab-panel">
        <div class="card-modern">
          <div class="card-header">
            <div>
              <h3>📦 Inventory Management</h3>
              <span class="card-subtitle">{{ filteredInventoryStalls.length }} stalls</span>
            </div>
            <button @click="loadAllStallsInventory()" class="btn-modern secondary small">
              ⟳ Refresh
            </button>
          </div>
          <div class="card-body">
            <div class="filter-bar">
              <div class="filter-search">
                <input 
                  type="text" 
                  v-model="inventorySearch" 
                  placeholder="Search stalls or materials..." 
                  class="filter-input"
                />
              </div>
              <select v-model="inventoryFilter" class="filter-select">
                <option value="all">All Stalls</option>
                <option value="low">⚠️ Low Stock</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div v-if="stalls.length === 0" class="empty-state">
              <span>📦</span>
              <p>No stalls found. Create your first stall!</p>
            </div>

            <div v-for="stall in filteredInventoryStalls" :key="stall.id" class="inventory-stall">
              <div class="inventory-stall-header" @click="toggleInventoryStall(stall.id)">
                <div class="inventory-stall-info">
                  <span class="inventory-stall-name">{{ stall.name }}</span>
                  <span :class="['status-tag', stall.is_active ? 'active' : 'inactive']">
                    {{ stall.is_active ? 'Active' : 'Inactive' }}
                  </span>
                  <span v-if="hasLowStock(stall.id)" class="status-tag danger">⚠️ Low Stock</span>
                </div>
                <div class="inventory-stall-summary">
                  <span v-for="item in getStallInventorySummary(stall.id)" :key="item.material_name" class="inventory-tag">
                    {{ item.material_name }}: {{ item.current_level }}{{ getUnit(item.material_name) }}
                    <span v-if="item.current_level <= item.alert_level" class="inventory-tag-warning">⚠️</span>
                  </span>
                  <span class="inventory-toggle">{{ expandedInventoryStall === stall.id ? '−' : '+' }}</span>
                </div>
              </div>

              <div v-if="expandedInventoryStall === stall.id" class="inventory-stall-details">
                <div class="inventory-items-grid">
                  <div 
                    v-for="item in getFilteredInventoryItems(stall.id)" 
                    :key="item.material_name" 
                    class="inventory-item-card"
                    :class="{ 'low': item.current_level <= item.alert_level }"
                  >
                    <div class="inventory-item-header">
                      <span class="inventory-item-name">{{ item.material_name }}</span>
                      <span :class="['inventory-item-status', item.current_level <= item.alert_level ? 'low' : 'ok']">
                        {{ item.current_level <= item.alert_level ? '⚠️ LOW' : '✅ OK' }}
                      </span>
                    </div>
                    <div class="inventory-item-level">
                      <span class="inventory-item-current">{{ item.current_level }}{{ getUnit(item.material_name) }}</span>
                      <span class="inventory-item-alert">Alert: {{ item.alert_level }}{{ getUnit(item.material_name) }}</span>
                    </div>
                    <div class="inventory-item-progress">
                      <div class="inventory-progress-track">
                        <div 
                          class="inventory-progress-fill" 
                          :style="{ width: getInventoryPercentage(item) + '%' }"
                          :class="{ low: item.current_level <= item.alert_level }"
                        ></div>
                      </div>
                    </div>
                    <div class="inventory-item-actions">
                      <input type="number" v-model.number="item.newLevel" :placeholder="item.current_level" step="0.5" class="inventory-item-input" />
                      <button @click="updateInventoryStock(stall.id, item.material_name, item.newLevel)" class="btn-modern primary small">Update</button>
                      <button @click="quickAddStock(stall.id, item.material_name, 5)" class="btn-modern secondary small">+5</button>
                      <button @click="quickAddStock(stall.id, item.material_name, 1)" class="btn-modern secondary small">+1</button>
                    </div>
                  </div>
                </div>
                <div class="inventory-stall-actions">
                  <button @click="bulkUpdateInventory(stall.id)" class="btn-modern primary small">📦 Bulk Update</button>
                  <button @click="resetInventoryToAlert(stall.id)" class="btn-modern secondary small">Reset to Alert</button>
                </div>
              </div>
            </div>

            <div v-if="lowStock.length > 0" class="alerts-section">
              <h4 class="alerts-title">⚠️ Low Stock Alerts</h4>
              <div v-for="item in filteredLowStock" :key="item.stall_name + item.material_name" class="alert-row">
                <span class="alert-row-stall">{{ item.stall_name }}</span>
                <span class="alert-row-material">{{ item.material_name }}</span>
                <span class="alert-row-level">{{ item.current_level }}{{ getUnit(item.material_name) }}</span>
                <span class="alert-row-threshold">(Alert: {{ item.alert_level }}{{ getUnit(item.material_name) }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== STALLS TAB ===== -->
      <div v-if="activeTab === 'stalls'" class="tab-panel">
        <div class="card-modern">
          <div class="card-header">
            <div>
              <h3>🏪 Stall Management</h3>
              <span class="card-subtitle">{{ filteredStallsList.length }} stalls</span>
            </div>
            <button @click="openStallModal()" class="btn-modern primary">+ New Stall</button>
          </div>
          <div class="card-body">
            <div class="filter-bar">
              <div class="filter-search">
                <input 
                  type="text" 
                  v-model="stallSearch" 
                  placeholder="Search stalls..." 
                  class="filter-input"
                />
              </div>
              <select v-model="stallStatusFilter" class="filter-select">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div v-if="filteredStallsList.length === 0" class="empty-state">
              <span>🏪</span>
              <p>No stalls found</p>
            </div>

            <div v-for="(stall, index) in filteredStallsList" :key="stall.id" class="list-item">
              <div class="list-item-content">
                <span class="list-item-index">{{ index + 1 }}</span>
                <div class="list-item-info">
                  <span class="list-item-name">{{ stall.name }}</span>
                  <span class="list-item-code">{{ stall.code }}</span>
                </div>
                <span :class="['status-tag', stall.is_active ? 'active' : 'inactive']">
                  {{ stall.is_active ? 'Active' : 'Inactive' }}
                </span>
                <div class="list-item-actions">
                  <button @click="openEditStallModal(stall)" class="list-item-btn" title="Edit">✏️</button>
                  <button @click="toggleStallStatus(stall)" class="list-item-btn" :title="stall.is_active ? 'Deactivate' : 'Activate'">
                    {{ stall.is_active ? '⏸️' : '▶️' }}
                  </button>
                  <button @click="deleteStall(stall.id, stall.name)" class="list-item-btn danger" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== USERS TAB ===== -->
      <div v-if="activeTab === 'users'" class="tab-panel">
        <div class="card-modern">
          <div class="card-header">
            <div>
              <h3>👥 User Management</h3>
              <span class="card-subtitle">{{ filteredUsersList.length }} users</span>
            </div>
            <button @click="openUserModal()" class="btn-modern primary">+ New User</button>
          </div>
          <div class="card-body">
            <div class="filter-bar">
              <div class="filter-search">
                <input 
                  type="text" 
                  v-model="userSearch" 
                  placeholder="Search users..." 
                  class="filter-input"
                />
              </div>
              <select v-model="userRoleFilter" class="filter-select">
                <option value="all">All Roles</option>
                <option value="stall_admin">👤 Admin</option>
                <option value="cashier">💰 Cashier</option>
              </select>
            </div>

            <div v-if="filteredUsersList.length === 0" class="empty-state">
              <span>👥</span>
              <p>No users found</p>
            </div>

            <div v-for="(user, index) in filteredUsersList" :key="user.id" class="list-item">
              <div class="list-item-content">
                <span class="list-item-index">{{ index + 1 }}</span>
                <div class="list-item-info">
                  <span class="list-item-name">{{ user.username }}</span>
                  <span class="list-item-sub">{{ user.full_name || '-' }}</span>
                </div>
                <span class="role-tag">{{ user.role }}</span>
                <span class="list-item-stalls">{{ (user.assigned_stalls || []).map(s => s.name).join(', ') || '-' }}</span>
                <div class="list-item-actions">
                  <button @click="openEditUserModal(user)" class="list-item-btn" title="Edit">✏️</button>
                  <button @click="deleteUser(user.id, user.username)" class="list-item-btn danger" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MENU TAB ===== -->
      <div v-if="activeTab === 'menu'" class="tab-panel">
        <div class="card-modern">
          <div class="card-header">
            <div>
              <h3>📋 Menu Management</h3>
              <span class="card-subtitle">{{ filteredMenuItems.length }} items</span>
            </div>
            <button @click="openMenuModal()" class="btn-modern primary">+ New Item</button>
          </div>
          <div class="card-body">
            <div class="filter-bar">
              <div class="filter-search">
                <input 
                  type="text" 
                  v-model="menuSearch" 
                  placeholder="Search menu items..." 
                  class="filter-input"
                />
              </div>
              <select v-model="menuCategoryFilter" class="filter-select">
                <option value="all">All Categories</option>
                <option value="Main">Main</option>
                <option value="Side">Side</option>
                <option value="Drink">Drink</option>
                <option value="Dessert">Dessert</option>
              </select>
              <span class="filter-result">{{ filteredMenuItems.length }} items</span>
            </div>

            <div v-if="filteredMenuItems.length === 0" class="empty-state">
              <span>📋</span>
              <p>No menu items found. Create your first menu item!</p>
            </div>

            <div v-for="(item, index) in filteredMenuItems" :key="item.item_name" class="menu-item-row">
              <div class="menu-item-row-content">
                <span class="menu-item-index">{{ index + 1 }}</span>
                <div class="menu-item-info">
                  <span class="menu-item-name">{{ item.item_name }}</span>
                  <span class="menu-item-price">{{ formatCurrency(item.price) }}</span>
                  <span class="menu-item-category">{{ item.category || 'Main' }}</span>
                </div>
                <div class="menu-item-recipe">
                  <span class="recipe-label">Recipe:</span>
                  <span v-if="item.recipe && item.recipe.length > 0" class="recipe-items">
                    {{ item.recipe.map(r => `${r.material_name}: ${r.quantity_used}${getUnit(r.material_name)}`).join(', ') }}
                  </span>
                  <span v-else class="recipe-empty">No recipe</span>
                </div>
                <div class="menu-item-actions">
                  <button @click="openEditMenuModal(item)" class="list-item-btn" title="Edit">✏️</button>
                  <button @click="deleteMenuItem(item.item_name)" class="list-item-btn danger" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STALL MODAL                                  -->
    <!-- ============================================ -->
    <div v-if="stallModal" class="modal-overlay" @click.self="closeStallModal">
      <div class="modal-modern">
        <div class="modal-header">
          <h3>{{ editingStall ? 'Edit Stall' : 'New Stall' }}</h3>
          <button @click="closeStallModal" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Stall Name</label>
            <input v-model="stallForm.name" placeholder="Stall Name" />
          </div>
          <div class="form-group">
            <label>Stall Code</label>
            <input v-model="stallForm.code" placeholder="Stall Code" />
          </div>
          <div class="form-group">
            <label>Location</label>
            <input v-model="stallForm.location" placeholder="Location" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeStallModal" class="btn-modern secondary">Cancel</button>
          <button @click="saveStall" class="btn-modern primary">{{ editingStall ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- USER MODAL                                   -->
    <!-- ============================================ -->
    <div v-if="userModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-modern modal-lg">
        <div class="modal-header">
          <h3>{{ editingUser ? 'Edit User' : 'New User' }}</h3>
          <button @click="closeUserModal" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Username</label>
              <input v-model="userForm.username" placeholder="Username" :disabled="editingUser" />
            </div>
            <div class="form-group">
              <label>Full Name</label>
              <input v-model="userForm.full_name" placeholder="Full Name" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Password</label>
              <input v-if="!editingUser" type="password" v-model="userForm.password" placeholder="Password" />
              <input v-else type="password" v-model="userForm.password" placeholder="Leave blank to keep" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select v-model="userForm.role">
                <option value="stall_admin">Stall Admin</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Assign Stalls:</label>
            <select multiple class="stall-select-multiple" v-model="userForm.stall_ids">
              <option v-for="s in stalls" :value="s.id">{{ s.name }}</option>
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeUserModal" class="btn-modern secondary">Cancel</button>
          <button @click="saveUser" class="btn-modern primary">{{ editingUser ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- MENU MODAL                                   -->
    <!-- ============================================ -->
    <div v-if="menuModal" class="modal-overlay" @click.self="closeMenuModal">
      <div class="modal-modern modal-lg">
        <div class="modal-header">
          <h3>{{ editingMenu ? 'Edit Menu Item' : 'New Menu Item' }}</h3>
          <button @click="closeMenuModal" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Item Name</label>
              <input v-model="menuForm.item_name" placeholder="e.g., AGG" :disabled="editingMenu" />
            </div>
            <div class="form-group">
              <label>Price (RM)</label>
              <input type="number" v-model="menuForm.price" placeholder="0.00" step="0.5" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <input v-model="menuForm.category" placeholder="e.g., Main, Side, Drink" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <input v-model="menuForm.description" placeholder="Brief description" />
            </div>
          </div>
          <div class="form-group">
            <label>Item Image</label>
            <div class="image-upload-area" @dragover.prevent @drop.prevent="handleMenuImageDrop">
              <input type="file" ref="menuImageInput" accept="image/*" @change="handleMenuImageUpload" style="display:none" />
              <div v-if="menuForm.imagePreview" class="image-preview">
                <img :src="menuForm.imagePreview" alt="Menu item" />
                <button @click="removeMenuImage" class="remove-image">✕</button>
              </div>
              <div v-else class="image-placeholder" @click="$refs.menuImageInput.click()">
                <span>📷</span>
                <p>Click to upload image (max 2MB)</p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Recipe (Ingredients)</label>
            <div v-for="(ingredient, index) in menuForm.recipe" :key="index" class="recipe-row">
              <input v-model="ingredient.material_name" placeholder="Material name" class="recipe-input" />
              <input type="number" v-model="ingredient.quantity_used" placeholder="Qty" class="recipe-input-small" step="0.5" />
              <button @click="removeRecipeIngredient(index)" class="btn-icon-sm danger">✕</button>
            </div>
            <button @click="addRecipeIngredient" class="btn-modern secondary small">+ Add Ingredient</button>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeMenuModal" class="btn-modern secondary">Cancel</button>
          <button @click="saveMenuItem" class="btn-modern primary">{{ editingMenu ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'

export default {
  name: 'SuperAdminPanel',
  props: {
    token: {
      type: String,
      required: true
    },
    companyLogo: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      // Company
      companyName: 'AGG Holdings',
      companyId: 1,
      
      // Data
      stalls: [],
      users: [],
      lowStock: [],
      menuItems: [],
      
      // Tabs
      activeTab: 'inventory',
      tabs: [
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'stalls', label: 'Stalls', icon: '🏪' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'menu', label: 'Menu', icon: '📋' }
      ],
      
      // Inventory
      expandedInventoryStall: null,
      stallInventory: {},
      inventorySearch: '',
      inventoryFilter: 'all',
      
      // Stalls
      stallSearch: '',
      stallStatusFilter: 'all',
      
      // Users
      userSearch: '',
      userRoleFilter: 'all',
      
      // Menu
      menuSearch: '',
      menuCategoryFilter: 'all',
      
      // Stall Modal
      stallModal: false,
      editingStall: false,
      stallForm: { id: null, name: '', code: '', location: '' },
      
      // User Modal
      userModal: false,
      editingUser: false,
      userForm: { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] },
      
      // Menu Modal
      menuModal: false,
      editingMenu: false,
      menuForm: {
        item_name: '',
        price: 0,
        description: '',
        category: '',
        recipe: [],
        imagePreview: null,
        imageFile: null
      },
      
      // UI State
      loading: false,
      exporting: false,
    }
  },
  computed: {
    filteredMenuItems() {
      return this.menuItems.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(this.menuSearch.toLowerCase())
        const matchesCategory = this.menuCategoryFilter === 'all' || item.category === this.menuCategoryFilter
        return matchesSearch && matchesCategory
      })
    },
    filteredInventoryStalls() {
      return this.stalls.filter(stall => {
        const matchesSearch = stall.name.toLowerCase().includes(this.inventorySearch.toLowerCase()) ||
                              this.getStallInventory(stall.id).some(item => 
                                item.material_name.toLowerCase().includes(this.inventorySearch.toLowerCase())
                              )
        const matchesStatus = this.inventoryFilter === 'all' || 
                              (this.inventoryFilter === 'active' && stall.is_active) ||
                              (this.inventoryFilter === 'inactive' && !stall.is_active) ||
                              (this.inventoryFilter === 'low' && this.hasLowStock(stall.id))
        return matchesSearch && matchesStatus
      })
    },
    filteredLowStock() {
      if (this.inventorySearch) {
        return this.lowStock.filter(item => 
          item.stall_name.toLowerCase().includes(this.inventorySearch.toLowerCase()) ||
          item.material_name.toLowerCase().includes(this.inventorySearch.toLowerCase())
        )
      }
      return this.lowStock
    },
    filteredStallsList() {
      return this.stalls.filter(stall => {
        const matchesSearch = stall.name.toLowerCase().includes(this.stallSearch.toLowerCase()) ||
                              stall.code.toLowerCase().includes(this.stallSearch.toLowerCase())
        const matchesStatus = this.stallStatusFilter === 'all' || 
                              (this.stallStatusFilter === 'active' && stall.is_active) ||
                              (this.stallStatusFilter === 'inactive' && !stall.is_active)
        return matchesSearch && matchesStatus
      })
    },
    filteredUsersList() {
      return this.users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(this.userSearch.toLowerCase()) ||
                              (user.full_name && user.full_name.toLowerCase().includes(this.userSearch.toLowerCase()))
        const matchesRole = this.userRoleFilter === 'all' || user.role === this.userRoleFilter
        return matchesSearch && matchesRole
      })
    }
  },
  mounted() {
    this.loadAllData()
  },
  methods: {
    // =============================================
    // FORMATTING
    // =============================================
    formatCurrency(amount) {
      const num = Number(amount) || 0
      return new Intl.NumberFormat('en-MY', { 
        style: 'currency', 
        currency: 'MYR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num)
    },
    getUnit(materialName) {
      return materialName === 'Oil' ? 'L' : 'kg'
    },
    
    // =============================================
    // MODAL CLOSE METHODS
    // =============================================
    closeStallModal() {
      this.stallModal = false
      this.editingStall = false
      this.stallForm = { id: null, name: '', code: '', location: '' }
    },
    closeUserModal() {
      this.userModal = false
      this.editingUser = false
      this.userForm = { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] }
    },
    closeMenuModal() {
      this.menuModal = false
      this.editingMenu = false
      this.menuForm = {
        item_name: '',
        price: 0,
        description: '',
        category: '',
        recipe: [],
        imagePreview: null,
        imageFile: null
      }
    },
    
    // =============================================
    // IMAGE COMPRESSION
    // =============================================
    compressImage(base64Data, maxWidth = 300, maxHeight = 300, quality = 0.7) {
      return new Promise((resolve) => {
        try {
          const img = new Image()
          img.onload = () => {
            let width = img.width
            let height = img.height
            
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
            
            const canvas = document.createElement('canvas')
            canvas.width = Math.round(width)
            canvas.height = Math.round(height)
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)
            
            const compressed = canvas.toDataURL('image/jpeg', quality)
            resolve(compressed)
          }
          img.onerror = () => {
            resolve(null)
          }
          img.src = base64Data
        } catch (err) {
          console.error('Compression error:', err)
          resolve(null)
        }
      })
    },
    
    // =============================================
    // MENU IMAGE HANDLING
    // =============================================
    handleMenuImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      if (file.size > 2 * 1024 * 1024) {
        this.$emit('show-notification', 'Image is too large. Maximum size is 2MB.', 'error')
        event.target.value = ''
        return
      }
      
      this.menuForm.imageFile = file
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const compressed = await this.compressImage(e.target.result, 300, 300, 0.7)
          this.menuForm.imagePreview = compressed || e.target.result
        } catch (err) {
          this.menuForm.imagePreview = e.target.result
        }
      }
      reader.readAsDataURL(file)
    },
    handleMenuImageDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) {
          this.$emit('show-notification', 'Image is too large. Maximum size is 2MB.', 'error')
          return
        }
        this.menuForm.imageFile = file
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const compressed = await this.compressImage(e.target.result, 300, 300, 0.7)
            this.menuForm.imagePreview = compressed || e.target.result
          } catch (err) {
            this.menuForm.imagePreview = e.target.result
          }
        }
        reader.readAsDataURL(file)
      }
    },
    removeMenuImage() {
      this.menuForm.imagePreview = null
      this.menuForm.imageFile = null
      if (this.$refs.menuImageInput) {
        this.$refs.menuImageInput.value = ''
      }
    },
    
    // =============================================
    // TAB MANAGEMENT
    // =============================================
    switchTab(tabId) {
      this.activeTab = tabId
    },
    
    // =============================================
    // DATA LOADING
    // =============================================
    async loadAllData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadStalls(),
          this.loadUsers(),
          this.loadLowStock(),
          this.loadMenuItems()
        ])
        await this.loadAllStallsInventory()
        this.$emit('show-notification', 'Data loaded successfully', 'success')
      } catch (err) {
        console.error('Load data error:', err)
        this.$emit('show-notification', 'Failed to load data', 'error')
      } finally {
        this.loading = false
      }
    },
    async refreshAllData() {
      await this.loadAllData()
    },
    
    async loadStalls() {
      try {
        const res = await axios.get(`${API_BASE}/companies/${this.companyId}/stalls`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.stalls = res.data || []
      } catch (err) {
        console.error('Load stalls error:', err)
        this.stalls = []
      }
    },
    async loadUsers() {
      try {
        const res = await axios.get(`${API_BASE}/companies/${this.companyId}/users`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.users = res.data || []
      } catch (err) {
        console.error('Load users error:', err)
        this.users = []
      }
    },
    async loadLowStock() {
      try {
        const res = await axios.get(`${API_BASE}/companies/${this.companyId}/low-stock`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.lowStock = res.data || []
      } catch (err) {
        console.error('Load low stock error:', err)
        this.lowStock = []
      }
    },
    async loadMenuItems() {
      try {
        const res = await axios.get(`${API_BASE}/menu`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.menuItems = res.data || []
      } catch (err) {
        console.error('Load menu error:', err)
        this.menuItems = []
      }
    },
    
    // =============================================
    // INVENTORY METHODS
    // =============================================
    async loadAllStallsInventory() {
      for (const stall of this.stalls) {
        try {
          const res = await axios.get(`${API_BASE}/inventory?stallId=${stall.id}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.stallInventory[stall.id] = res.data.map(item => ({
            ...item,
            newLevel: item.current_level
          }))
        } catch (err) {
          console.error(`Load inventory for stall ${stall.id} error:`, err)
        }
      }
    },
    toggleInventoryStall(stallId) {
      this.expandedInventoryStall = this.expandedInventoryStall === stallId ? null : stallId
      if (this.expandedInventoryStall === stallId) {
        this.loadStallInventory(stallId)
      }
    },
    async loadStallInventory(stallId) {
      try {
        const res = await axios.get(`${API_BASE}/inventory?stallId=${stallId}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.stallInventory[stallId] = res.data.map(item => ({
          ...item,
          newLevel: item.current_level
        }))
      } catch (err) {
        console.error('Load stall inventory error:', err)
        this.$emit('show-notification', 'Failed to load inventory', 'error')
      }
    },
    getStallInventory(stallId) {
      return this.stallInventory[stallId] || []
    },
    getStallInventorySummary(stallId) {
      const inventory = this.getStallInventory(stallId)
      if (inventory.length === 0) {
        return [
          { material_name: 'Chicken', current_level: '?', alert_level: 10 },
          { material_name: 'Flour', current_level: '?', alert_level: 5 },
          { material_name: 'Oil', current_level: '?', alert_level: 8 }
        ]
      }
      return inventory
    },
    getFilteredInventoryItems(stallId) {
      const inventory = this.getStallInventory(stallId)
      if (this.inventoryFilter === 'low') {
        return inventory.filter(item => item.current_level <= item.alert_level)
      }
      if (this.inventorySearch) {
        return inventory.filter(item => 
          item.material_name.toLowerCase().includes(this.inventorySearch.toLowerCase())
        )
      }
      return inventory
    },
    hasLowStock(stallId) {
      return this.getStallInventory(stallId).some(item => item.current_level <= item.alert_level)
    },
    getInventoryPercentage(item) {
      const max = Math.max(item.current_level, item.alert_level * 2)
      return Math.min((item.current_level / max) * 100, 100)
    },
    async updateInventoryStock(stallId, materialName, newLevel) {
      if (newLevel === undefined || newLevel === null || newLevel === '') {
        this.$emit('show-notification', 'Please enter a valid value', 'error')
        return
      }
      try {
        await axios.post(`${API_BASE}/inventory/update`, {
          stallId, materialName, newLevel: parseFloat(newLevel)
        }, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        await this.loadStallInventory(stallId)
        await this.loadLowStock()
        this.$emit('show-notification', `${materialName} updated to ${newLevel}${this.getUnit(materialName)}`, 'success')
      } catch (err) {
        console.error('Update inventory error:', err)
        this.$emit('show-notification', 'Failed to update stock', 'error')
      }
    },
    async quickAddStock(stallId, materialName, amount) {
      const inventory = this.stallInventory[stallId] || []
      const item = inventory.find(i => i.material_name === materialName)
      if (item) {
        await this.updateInventoryStock(stallId, materialName, item.current_level + amount)
      }
    },
    async bulkUpdateInventory(stallId) {
      const inventory = this.stallInventory[stallId] || []
      if (inventory.length === 0) return
      try {
        for (const item of inventory) {
          if (item.newLevel !== undefined && item.newLevel !== item.current_level) {
            await axios.post(`${API_BASE}/inventory/update`, {
              stallId, materialName: item.material_name, newLevel: item.newLevel
            }, {
              headers: { Authorization: `Bearer ${this.token}` }
            })
          }
        }
        await this.loadStallInventory(stallId)
        await this.loadLowStock()
        this.$emit('show-notification', 'All stocks updated', 'success')
      } catch (err) {
        console.error('Bulk update error:', err)
        this.$emit('show-notification', 'Bulk update failed', 'error')
      }
    },
    async resetInventoryToAlert(stallId) {
      if (!confirm('Reset all stocks to alert levels for this stall?')) return
      const inventory = this.stallInventory[stallId] || []
      try {
        for (const item of inventory) {
          await axios.post(`${API_BASE}/inventory/update`, {
            stallId, materialName: item.material_name, newLevel: item.alert_level
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
        }
        await this.loadStallInventory(stallId)
        await this.loadLowStock()
        this.$emit('show-notification', 'All stocks reset to alert levels', 'success')
      } catch (err) {
        console.error('Reset inventory error:', err)
        this.$emit('show-notification', 'Reset failed', 'error')
      }
    },
    
    // =============================================
    // STALL CRUD
    // =============================================
    openStallModal() {
      this.editingStall = false
      this.stallForm = { id: null, name: '', code: '', location: '' }
      this.stallModal = true
    },
    openEditStallModal(stall) {
      this.editingStall = true
      this.stallForm = {
        id: stall.id,
        name: stall.name,
        code: stall.code,
        location: stall.location || ''
      }
      this.stallModal = true
    },
    async saveStall() {
      try {
        if (this.editingStall) {
          await axios.put(`${API_BASE}/stalls/${this.stallForm.id}`, {
            name: this.stallForm.name,
            code: this.stallForm.code,
            location: this.stallForm.location
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'Stall updated successfully!', 'success')
        } else {
          await axios.post(`${API_BASE}/companies/${this.companyId}/stalls`, {
            name: this.stallForm.name,
            code: this.stallForm.code,
            location: this.stallForm.location
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'Stall created successfully!', 'success')
        }
        this.closeStallModal()
        await this.loadStalls()
        await this.loadAllStallsInventory()
      } catch (err) {
        console.error('Save stall error:', err)
        this.$emit('show-notification', err.response?.data?.error || 'Operation failed', 'error')
      }
    },
    async toggleStallStatus(stall) {
      try {
        await axios.put(`${API_BASE}/stalls/${stall.id}/toggle`, {}, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        await this.loadStalls()
        this.$emit('show-notification', `Stall ${stall.is_active ? 'deactivated' : 'activated'}`, 'success')
      } catch (err) {
        console.error('Toggle stall error:', err)
        this.$emit('show-notification', 'Failed to update stall', 'error')
      }
    },
    async deleteStall(stallId, stallName) {
      if (confirm(`Delete stall "${stallName}"? This action cannot be undone.`)) {
        try {
          await axios.delete(`${API_BASE}/stalls/${stallId}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          await this.loadStalls()
          this.$emit('show-notification', 'Stall deleted successfully!', 'success')
        } catch (err) {
          console.error('Delete stall error:', err)
          this.$emit('show-notification', 'Failed to delete stall', 'error')
        }
      }
    },
    
    // =============================================
    // USER CRUD
    // =============================================
    openUserModal() {
      this.editingUser = false
      this.userForm = { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] }
      this.userModal = true
    },
    openEditUserModal(user) {
      this.editingUser = true
      this.userForm = {
        id: user.id,
        username: user.username,
        full_name: user.full_name || '',
        role: user.role,
        password: '',
        stall_ids: (user.assigned_stalls || []).map(s => s.id)
      }
      this.userModal = true
    },
    async saveUser() {
      try {
        const payload = {
          full_name: this.userForm.full_name,
          role: this.userForm.role,
          stall_ids: this.userForm.stall_ids
        }
        if (this.userForm.password && this.userForm.password.trim() !== '') {
          payload.password = this.userForm.password
        }
        if (this.editingUser) {
          await axios.put(`${API_BASE}/users/${this.userForm.id}`, payload, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'User updated successfully!', 'success')
        } else {
          if (!this.userForm.password || this.userForm.password.trim() === '') {
            this.$emit('show-notification', 'Password is required', 'error')
            return
          }
          payload.username = this.userForm.username
          payload.password = this.userForm.password
          await axios.post(`${API_BASE}/companies/${this.companyId}/users`, payload, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'User created successfully!', 'success')
        }
        this.closeUserModal()
        await this.loadUsers()
      } catch (err) {
        console.error('Save user error:', err)
        this.$emit('show-notification', err.response?.data?.error || 'Operation failed', 'error')
      }
    },
    async deleteUser(userId, username) {
      if (confirm(`Delete user "${username}"? This action cannot be undone.`)) {
        try {
          await axios.delete(`${API_BASE}/users/${userId}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          await this.loadUsers()
          this.$emit('show-notification', 'User deleted successfully!', 'success')
        } catch (err) {
          console.error('Delete user error:', err)
          this.$emit('show-notification', 'Failed to delete user', 'error')
        }
      }
    },
    
    // =============================================
    // MENU CRUD
    // =============================================
    openMenuModal() {
      this.editingMenu = false
      this.menuForm = {
        item_name: '',
        price: 0,
        description: '',
        category: '',
        recipe: [],
        imagePreview: null,
        imageFile: null
      }
      this.menuModal = true
    },
    openEditMenuModal(item) {
      this.editingMenu = true
      this.menuForm = {
        item_name: item.item_name,
        price: item.price,
        description: item.description || '',
        category: item.category || '',
        recipe: (item.recipe || []).map(r => ({ ...r })),
        imagePreview: item.image || null,
        imageFile: null
      }
      this.menuModal = true
    },
    addRecipeIngredient() {
      this.menuForm.recipe.push({ material_name: '', quantity_used: 0 })
    },
    removeRecipeIngredient(index) {
      this.menuForm.recipe.splice(index, 1)
    },
    async saveMenuItem() {
      try {
        if (!this.menuForm.item_name || !this.menuForm.price) {
          this.$emit('show-notification', 'Item name and price are required', 'error')
          return
        }
        
        const payload = {
          item_name: this.menuForm.item_name,
          price: parseFloat(this.menuForm.price),
          description: this.menuForm.description || '',
          category: this.menuForm.category || 'Main',
          recipe: this.menuForm.recipe.filter(r => r.material_name && r.quantity_used > 0)
        }
        
        // Handle image - compress if needed
        if (this.menuForm.imagePreview) {
          let imageData = this.menuForm.imagePreview
          
          // If it's a base64 string and too large, compress it
          if (imageData && imageData.length > 500000) {
            try {
              const compressed = await this.compressImage(imageData, 200, 200, 0.6)
              if (compressed && compressed.length < imageData.length) {
                imageData = compressed
              }
            } catch (e) {
              console.warn('Image compression failed, using original', e)
            }
          }
          
          // Only include if under 1MB after compression
          if (imageData && imageData.length < 1 * 1024 * 1024) {
            payload.image = imageData
          } else {
            try {
              const compressed = await this.compressImage(imageData, 100, 100, 0.5)
              if (compressed && compressed.length < 1 * 1024 * 1024) {
                payload.image = compressed
              } else {
                this.$emit('show-notification', 'Image is too large. Please use a smaller image.', 'warning')
              }
            } catch (e) {
              this.$emit('show-notification', 'Could not compress image. Proceeding without image.', 'warning')
            }
          }
        }
        
        if (this.editingMenu) {
          await axios.put(`${API_BASE}/menu/${encodeURIComponent(this.menuForm.item_name)}`, payload, {
            headers: { 
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            }
          })
          this.$emit('show-notification', 'Menu item updated successfully!', 'success')
        } else {
          await axios.post(`${API_BASE}/menu`, payload, {
            headers: { 
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            }
          })
          this.$emit('show-notification', 'Menu item created successfully!', 'success')
        }
        
        this.closeMenuModal()
        await this.loadMenuItems()
      } catch (err) {
        console.error('Save menu error:', err)
        if (err.response?.status === 413) {
          this.$emit('show-notification', 'Image too large. Please use a smaller image (under 1MB).', 'error')
        } else {
          const errorMsg = err.response?.data?.error || err.message || 'Operation failed'
          this.$emit('show-notification', `Failed to save: ${errorMsg}`, 'error')
        }
      }
    },
    async deleteMenuItem(itemName) {
      if (confirm(`Delete menu item "${itemName}"? This action cannot be undone.`)) {
        try {
          await axios.delete(`${API_BASE}/menu/${encodeURIComponent(itemName)}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'Menu item deleted successfully!', 'success')
          await this.loadMenuItems()
        } catch (err) {
          console.error('Delete menu error:', err)
          this.$emit('show-notification', 'Failed to delete menu item', 'error')
        }
      }
    },
    
    // =============================================
    // EXPORT
    // =============================================
    async exportAllData() {
      if (this.exporting) return
      this.exporting = true
      try {
        this.$emit('show-notification', 'Generating Excel...', 'info')
        
        const ExcelJS = await import('exceljs')
        const { saveAs } = await import('file-saver')
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Chickory Hub'
        
        // Stalls Sheet
        const stallSheet = workbook.addWorksheet('Stalls')
        stallSheet.addRow(['Stall Name', 'Code', 'Status'])
        for (const stall of this.stalls) {
          stallSheet.addRow([stall.name, stall.code, stall.is_active ? 'Active' : 'Inactive'])
        }
        stallSheet.columns.forEach(col => { col.width = 20 })
        
        // Users Sheet
        const userSheet = workbook.addWorksheet('Users')
        userSheet.addRow(['Username', 'Full Name', 'Role', 'Assigned Stalls'])
        for (const user of this.users) {
          userSheet.addRow([
            user.username,
            user.full_name || '-',
            user.role,
            (user.assigned_stalls || []).map(s => s.name).join(', ') || '-'
          ])
        }
        userSheet.columns.forEach(col => { col.width = 20 })
        
        // Menu Sheet
        const menuSheet = workbook.addWorksheet('Menu')
        menuSheet.addRow(['Item Name', 'Price (RM)', 'Category', 'Recipe'])
        for (const item of this.menuItems) {
          const recipe = (item.recipe || []).map(r => `${r.material_name}: ${r.quantity_used}${this.getUnit(r.material_name)}`).join(', ')
          menuSheet.addRow([item.item_name, item.price, item.category || 'Main', recipe || 'No recipe'])
        }
        menuSheet.columns.forEach(col => { col.width = 20 })
        
        // Inventory Sheet
        const invSheet = workbook.addWorksheet('Inventory')
        invSheet.addRow(['Stall', 'Material', 'Current Level', 'Alert Level', 'Status'])
        for (const stall of this.stalls) {
          for (const item of this.getStallInventory(stall.id)) {
            invSheet.addRow([
              stall.name,
              item.material_name,
              `${item.current_level}${this.getUnit(item.material_name)}`,
              `${item.alert_level}${this.getUnit(item.material_name)}`,
              item.current_level <= item.alert_level ? '⚠️ LOW' : '✅ OK'
            ])
          }
        }
        invSheet.columns.forEach(col => { col.width = 20 })
        
        const fileName = `Chickory_SuperAdmin_Export_${new Date().toISOString().split('T')[0]}.xlsx`
        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName)
        this.$emit('show-notification', 'Export completed successfully!', 'success')
      } catch (err) {
        console.error('Export error:', err)
        this.$emit('show-notification', 'Export failed', 'error')
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>

<style scoped>
/* ============================================ */
/* CSS VARIABLES                                */
/* ============================================ */
.super-admin-panel {
  --primary: #F94908;
  --primary-light: #fa6a2e;
  --primary-dark: #d63d07;
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-elevated: #f1f5f9;
  --text: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --shadow: 0 2px 8px rgba(0,0,0,0.06);
  --radius: 12px;
  --radius-sm: 8px;
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============================================ */
/* PANEL HEADER                                 */
/* ============================================ */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.company-badge {
  background: var(--primary-gradient);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 0.5rem;
}

/* ============================================ */
/* STATS GRID                                   */
/* ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--stat-color, var(--primary));
  opacity: 0.6;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.stat-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-trend {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 20px;
  background: var(--bg);
}

.stat-trend.up { color: #10b981; }
.stat-trend.down { color: #ef4444; }

/* ============================================ */
/* TAB NAVIGATION                               */
/* ============================================ */
.tab-navigation {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  background: var(--surface);
  padding: 0.25rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow-x: auto;
}

.tab-navigation::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  position: relative;
}

.tab-btn:hover {
  background: var(--bg);
  color: var(--text);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  box-shadow: 0 2px 8px rgba(249, 73, 8, 0.2);
}

.tab-icon {
  font-size: 1rem;
}

.tab-badge {
  background: #ef4444;
  color: white;
  border-radius: 50%;
  padding: 0 6px;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
  line-height: 18px;
}

/* ============================================ */
/* MODERN CARDS                                 */
/* ============================================ */
.card-modern {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.card-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.card-subtitle {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.card-body {
  padding: 1rem;
}

/* ============================================ */
/* FILTER BAR                                   */
/* ============================================ */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
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

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

.filter-result {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  background: var(--bg);
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
  background: var(--bg);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-modern.secondary:hover {
  background: var(--surface-elevated);
  color: var(--text);
}

.btn-modern.small {
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
}

.btn-modern:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 0.9rem;
}

/* ============================================ */
/* LIST ITEMS                                   */
/* ============================================ */
.list-item {
  border-bottom: 1px solid var(--border-light);
  padding: 0.25rem 0;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.list-item-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.6rem;
  background: var(--bg);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.list-item-info {
  flex: 1;
  min-width: 100px;
}

.list-item-name {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text);
}

.list-item-sub {
  display: block;
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.list-item-code {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: monospace;
}

.list-item-stalls {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.list-item-actions {
  display: flex;
  gap: 0.15rem;
}

.list-item-btn {
  padding: 0.1rem 0.3rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: var(--transition);
  color: var(--text-secondary);
}

.list-item-btn:hover {
  background: var(--bg);
  color: var(--text);
}

.list-item-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* ============================================ */
/* STATUS TAGS                                  */
/* ============================================ */
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

.role-tag {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: capitalize;
}

/* ============================================ */
/* INVENTORY                                    */
/* ============================================ */
.inventory-stall {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.inventory-stall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: var(--transition);
  flex-wrap: wrap;
  gap: 0.35rem;
}

.inventory-stall-header:hover {
  background: var(--bg);
}

.inventory-stall-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.inventory-stall-name {
  font-weight: 600;
  font-size: 0.85rem;
}

.inventory-stall-summary {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.inventory-tag {
  background: var(--bg);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  font-size: 0.65rem;
  border: 1px solid var(--border-light);
}

.inventory-tag-warning {
  color: #dc2626;
}

.inventory-toggle {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.inventory-stall-details {
  padding: 0.75rem;
  border-top: 1px solid var(--border-light);
  background: var(--bg);
}

.inventory-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.inventory-item-card {
  background: var(--surface);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.inventory-item-card.low {
  border-color: #dc2626;
  background: #fef2f2;
}

.inventory-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.inventory-item-name {
  font-weight: 600;
  font-size: 0.8rem;
}

.inventory-item-status {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.05rem 0.3rem;
  border-radius: 8px;
}

.inventory-item-status.ok { background: #d1fae5; color: #059669; }
.inventory-item-status.low { background: #fee2e2; color: #dc2626; }

.inventory-item-level {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.inventory-item-current {
  font-weight: 600;
  color: var(--text);
}

.inventory-item-progress {
  margin: 0.35rem 0;
}

.inventory-progress-track {
  width: 100%;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.inventory-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: #10b981;
  transition: width 0.3s ease;
}

.inventory-progress-fill.low {
  background: #ef4444;
}

.inventory-item-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  align-items: center;
}

.inventory-item-input {
  width: 50px;
  padding: 0.15rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.75rem;
}

.inventory-item-input:focus {
  outline: none;
  border-color: var(--primary);
}

.inventory-stall-actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

/* ============================================ */
/* ALERTS                                       */
/* ============================================ */
.alerts-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.alerts-title {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.alert-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.5rem;
  background: #fef3c7;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
  flex-wrap: wrap;
}

.alert-row-stall { font-weight: 600; }
.alert-row-material { color: var(--text-secondary); }
.alert-row-level { font-weight: 600; color: #dc2626; }
.alert-row-threshold { font-size: 0.65rem; color: var(--text-tertiary); }

/* ============================================ */
/* MENU ITEMS                                   */
/* ============================================ */
.menu-item-row {
  border-bottom: 1px solid var(--border-light);
  padding: 0.5rem 0;
}

.menu-item-row:last-child {
  border-bottom: none;
}

.menu-item-row-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.menu-item-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.6rem;
  background: var(--bg);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.menu-item-info {
  flex: 1;
  min-width: 120px;
}

.menu-item-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
}

.menu-item-price {
  font-size: 0.8rem;
  color: var(--primary);
  font-weight: 600;
  margin-left: 0.5rem;
}

.menu-item-category {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--bg);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  margin-left: 0.5rem;
}

.menu-item-recipe {
  font-size: 0.7rem;
  color: var(--text-secondary);
  flex: 1;
  min-width: 150px;
}

.recipe-label {
  font-weight: 500;
}

.recipe-items {
  color: var(--text);
}

.recipe-empty {
  color: var(--text-tertiary);
  font-style: italic;
}

.menu-item-actions {
  display: flex;
  gap: 0.15rem;
}

/* ============================================ */
/* IMAGE UPLOAD                                 */
/* ============================================ */
.image-upload-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius-sm);
  padding: 1rem;
  text-align: center;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.image-upload-area:hover {
  border-color: var(--primary);
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-tertiary);
}

.image-placeholder span {
  font-size: 2rem;
}

.image-placeholder p {
  font-size: 0.75rem;
  margin: 0;
}

.image-preview {
  position: relative;
  max-width: 120px;
  margin: 0 auto;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================================ */
/* RECIPE ROWS                                  */
/* ============================================ */
.recipe-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.3rem;
}

.recipe-input {
  flex: 1;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.8rem;
}

.recipe-input-small {
  width: 60px;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.8rem;
}

.btn-icon-sm {
  background: transparent;
  border: none;
  padding: 0.15rem 0.3rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: var(--transition);
}

.btn-icon-sm:hover { background: var(--bg); }
.btn-icon-sm.danger { color: #ef4444; }
.btn-icon-sm.danger:hover { background: #fee2e2; }

/* ============================================ */
/* MODALS - FIXED WHITE BACKGROUND              */
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
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: modalFadeIn 0.25s ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-modern {
  background: #ffffff;
  border-radius: var(--radius);
  max-width: 520px;
  width: 92%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-lg {
  max-width: 640px;
}

.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #94a3b8;
  padding: 0 0.25rem;
  border-radius: 4px;
  transition: var(--transition);
  line-height: 1;
}

.modal-close-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  max-height: 60vh;
  background: #ffffff;
}

.modal-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: #fafafa;
}

/* ============================================ */
/* FORM FIELDS                                  */
/* ============================================ */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.form-group input,
.form-group select {
  padding: 0.5rem 0.7rem;
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  background: #ffffff;
  color: #1e293b;
  width: 100%;
  transition: var(--transition);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.08);
}

.form-group input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-group small {
  font-size: 0.65rem;
  color: #94a3b8;
}

.stall-select-multiple {
  min-height: 80px;
  padding: 0.35rem;
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-sm);
  background: #ffffff;
  color: #1e293b;
  width: 100%;
}

.stall-select-multiple:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.08);
}

/* ============================================ */
/* EMPTY STATE                                  */
/* ============================================ */
.empty-state {
  text-align: center;
  padding: 2rem 0.5rem;
  color: var(--text-secondary);
}

.empty-state span {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 0.85rem;
  margin: 0;
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-left {
    justify-content: center;
  }
  
  .header-right {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-number {
    font-size: 1.1rem;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-search {
    min-width: unset;
  }
  
  .filter-select {
    min-width: unset;
  }
  
  .inventory-items-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-modern {
    width: 95%;
    max-width: 95%;
  }
  
  .modal-lg {
    max-width: 95%;
  }
  
  .menu-item-row-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  
  .menu-item-recipe {
    min-width: unset;
    width: 100%;
  }
  
  .menu-item-actions {
    align-self: flex-end;
  }
  
  .recipe-row {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .stat-card {
    padding: 0.5rem;
    flex-direction: column;
    text-align: center;
    gap: 0.25rem;
  }
  
  .stat-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .stat-number {
    font-size: 0.95rem;
  }
  
  .panel-title {
    font-size: 1.2rem;
  }
  
  .tab-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
  
  .tab-icon {
    font-size: 0.8rem;
  }
  
  .list-item-content {
    gap: 0.35rem;
  }
  
  .list-item-name {
    font-size: 0.75rem;
  }
  
  .list-item-btn {
    font-size: 0.75rem;
  }
  
  .empty-state span {
    font-size: 1.5rem;
  }
  
  .menu-item-info {
    min-width: unset;
    width: 100%;
  }
  
  .menu-item-price {
    display: inline-block;
  }
}
</style>