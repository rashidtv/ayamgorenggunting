<template>
  <div class="sa-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>🏢 Company Management</h2>
        <p class="subtitle">Manage your company, stalls, inventory, and users</p>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stalls">🏪</div>
        <div class="stat-info">
          <div class="stat-value">{{ stalls.length }}</div>
          <div class="stat-label">Total Stalls</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon users">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ users.length }}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon alert">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">{{ lowStock.length }}</div>
          <div class="stat-label">Low Stock Alerts</div>
        </div>
      </div>
    </div>

    <!-- Period Selector + Export Button -->
    <div class="period-selector-wrapper">
      <div class="period-selector">
        <button 
          v-for="p in periods" 
          :key="p.value"
          :class="['period-btn', { active: selectedPeriod === p.value }]"
          @click="selectedPeriod = p.value; refreshAllData()"
        >
          {{ p.label }}
        </button>
      </div>
      <button @click="exportExcel" class="btn btn-primary" :disabled="exporting">
        <span v-if="exporting">⏳ Generating...</span>
        <span v-else>📊 Export Excel</span>
      </button>
    </div>

    <!-- Consolidated Sales -->
    <div class="card full-width">
      <div class="card-header">
        <h3>📊 Consolidated Sales</h3>
        <span class="period-label">{{ getPeriodLabel() }}</span>
      </div>
      <div class="card-body">
        <div class="consolidated-stats">
          <div class="consolidated-stat">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value">{{ formatCurrency(consolidatedSales.totalRevenue || 0) }}</span>
          </div>
          <div class="consolidated-stat">
            <span class="stat-label">Total Items Sold</span>
            <span class="stat-value">{{ consolidatedSales.totalItems || 0 }}</span>
          </div>
          <div class="consolidated-stat">
            <span class="stat-label">Average per Stall</span>
            <span class="stat-value">{{ formatCurrency(consolidatedSales.averagePerStall || 0) }}</span>
          </div>
          <div class="consolidated-stat">
            <span class="stat-label">Top Performing Stall</span>
            <span class="stat-value highlight">{{ consolidatedSales.topStall || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Sales Trend -->
    <div class="card full-width" id="chart-container">
      <div class="card-header">
        <h3>📈 Daily Sales Trend</h3>
        <span class="period-label">{{ getPeriodLabel() }}</span>
      </div>
      <div class="card-body">
        <div class="chart-container">
          <div v-if="salesTrend.length > 0" class="chart-wrapper" id="sales-chart">
            <!-- Trend Line -->
            <div class="trend-line-container">
              <svg class="trend-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
                <polyline
                  :points="getTrendPoints()"
                  fill="none"
                  stroke="#F94908"
                  stroke-width="2"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                <circle
                  v-for="(point, index) in getTrendPointsArray()"
                  :key="index"
                  :cx="point.x"
                  :cy="point.y"
                  r="2.5"
                  fill="#F94908"
                />
              </svg>
            </div>
            <!-- Bar Chart -->
            <div class="chart-bars">
              <div 
                v-for="day in salesTrend" 
                :key="day.date"
                class="chart-bar-wrapper"
              >
                <div class="chart-bar" :style="{ height: getBarHeight(day.revenue) + '%' }">
                  <span class="bar-value">{{ formatCurrency(day.revenue) }}</span>
                </div>
                <span class="bar-label">{{ formatDate(day.date) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No sales data available for this period</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stall Performance Ranking -->
    <div class="card full-width">
      <div class="card-header">
        <h3>🏆 Stall Performance Ranking</h3>
        <span class="period-label">{{ getPeriodLabel() }}</span>
      </div>
      <div class="card-body table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Stall Name</th>
              <th>Revenue</th>
              <th>Items Sold</th>
              <th>Avg Transaction</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stall, index) in stallPerformance" :key="stall.id">
              <td>{{ index + 1 }}</td>
              <td><strong>{{ stall.name }}</strong></td>
              <td>{{ formatCurrency(stall.revenue || 0) }}</td>
              <td>{{ stall.items || 0 }}</td>
              <td>{{ formatCurrency(stall.avgTransaction || 0) }}</td>
              <td>
                <span :class="['status-badge', getStallStatusClass(stall) ]">
                  {{ getStallStatus(stall) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="stallPerformance.length === 0" class="empty-state">
          <span class="empty-icon">📊</span>
          <p>No sales data available for this period</p>
        </div>
      </div>
    </div>

    <!-- Menu Performance -->
    <div class="card full-width">
      <div class="card-header">
        <h3>🍗 Menu Performance</h3>
        <span class="period-label">{{ getPeriodLabel() }}</span>
      </div>
      <div class="card-body table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Menu Item</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in menuPerformance" :key="item.name">
              <td>{{ index + 1 }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td>{{ item.quantity }}</td>
              <td>{{ formatCurrency(item.revenue || 0) }}</td>
              <td>
                <div class="performance-bar-container">
                  <div class="performance-bar" :style="{ width: getPerformancePercentage(item.quantity) + '%' }"></div>
                  <span class="performance-label">{{ getPerformancePercentage(item.quantity) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="menuPerformance.length === 0" class="empty-state">
          <span class="empty-icon">🍗</span>
          <p>No menu sales data available for this period</p>
        </div>
      </div>
    </div>

    <!-- Menu Management -->
    <div class="card full-width">
      <MenuManagement :token="token" @show-notification="$emit('show-notification', $event)" />
    </div>

    <!-- Stall Management -->
    <div class="card full-width">
      <div class="card-header">
        <h3>🏪 Stall Management</h3>
        <button @click="openStallModal()" class="btn btn-primary btn-sm">+ New Stall</button>
      </div>
      <div class="card-body table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in stalls" :key="s.id">
              <td><strong>{{ s.name }}</strong></td>
              <td><code>{{ s.code }}</code></td>
              <td>{{ s.location || '-' }}</td>
              <td>
                <span :class="['status-badge', s.is_active ? 'active' : 'inactive']">
                  {{ s.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="openEditStallModal(s)" class="btn-icon-sm" title="Edit Stall">✏️</button>
                  <button @click="toggleStallStatus(s)" class="btn-icon-sm" :title="s.is_active ? 'Deactivate' : 'Activate'">
                    {{ s.is_active ? '⏸️' : '▶️' }}
                  </button>
                  <button @click="deleteStall(s.id, s.name)" class="btn-icon-sm danger" title="Delete Stall">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="stalls.length === 0" class="empty-state">
          <span class="empty-icon">🏪</span>
          <p>No stalls found. Create your first stall!</p>
        </div>
      </div>
    </div>

    <!-- Inventory Management -->
    <div class="card full-width">
      <div class="card-header">
        <h3>📦 Inventory Management</h3>
        <div class="header-actions">
          <span class="badge-count">{{ stalls.length }} Stalls</span>
          <button @click="loadAllStallsInventory()" class="btn btn-outline btn-sm">🔄 Refresh All</button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="stalls.length === 0" class="empty-state">
          <span class="empty-icon">📦</span>
          <p>No stalls found. Create a stall first.</p>
        </div>
        <div v-for="stall in stalls" :key="stall.id" class="stall-inventory-item">
          <div class="stall-inventory-header" @click="toggleInventoryStall(stall.id)">
            <div class="stall-info">
              <span class="stall-name">{{ stall.name }}</span>
              <span :class="['status-badge', stall.is_active ? 'active' : 'inactive']">
                {{ stall.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="stall-inventory-summary">
              <span v-for="item in getStallInventorySummary(stall.id)" :key="item.material_name" class="inventory-chip">
                {{ item.material_name }}: {{ item.current_level }}{{ getUnit(item.material_name) }}
                <span v-if="item.current_level <= item.alert_level" class="low-stock-dot">⚠️</span>
              </span>
              <span class="toggle-icon">{{ expandedInventoryStall === stall.id ? '▲' : '▼' }}</span>
            </div>
          </div>
          <div v-if="expandedInventoryStall === stall.id" class="stall-inventory-details">
            <div class="inventory-edit-grid">
              <div v-for="item in getStallInventory(stall.id)" :key="item.material_name" class="inventory-edit-item">
                <div class="inventory-edit-info">
                  <span class="material-name">{{ item.material_name }}</span>
                  <span class="current-stock">Current: {{ item.current_level }}{{ getUnit(item.material_name) }}</span>
                  <span :class="['alert-badge', item.current_level <= item.alert_level ? 'low' : 'ok']">
                    {{ item.current_level <= item.alert_level ? '⚠️ LOW' : '✅ OK' }}
                  </span>
                </div>
                <div class="inventory-edit-controls">
                  <input type="number" v-model.number="item.newLevel" :placeholder="item.current_level" step="0.5" class="inventory-input" />
                  <button @click="updateInventoryStock(stall.id, item.material_name, item.newLevel)" class="btn btn-primary btn-sm">
                    Update
                  </button>
                  <button @click="quickAddStock(stall.id, item.material_name, 5)" class="btn btn-outline btn-sm">+5</button>
                  <button @click="quickAddStock(stall.id, item.material_name, 1)" class="btn btn-outline btn-sm">+1</button>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" :style="{ width: getInventoryPercentage(item) + '%' }" :class="item.current_level <= item.alert_level ? 'low' : ''"></div>
                </div>
              </div>
            </div>
            <div class="inventory-actions-bottom">
              <button @click="bulkUpdateInventory(stall.id)" class="btn btn-primary btn-sm">📦 Bulk Update All</button>
              <button @click="resetInventoryToAlert(stall.id)" class="btn btn-outline btn-sm">Reset to Alert Level</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Management -->
    <div class="card full-width">
      <div class="card-header">
        <h3>👥 User Management</h3>
        <button @click="openUserModal()" class="btn btn-primary btn-sm">+ New User</button>
      </div>
      <div class="card-body table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Assigned Stalls</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td><strong>{{ u.username }}</strong></td>
              <td>{{ u.full_name || '-' }}</td>
              <td><span class="role-badge">{{ u.role }}</span></td>
              <td>{{ (u.assigned_stalls || []).map(s => s.name).join(', ') || '-' }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="openEditUserModal(u)" class="btn-icon-sm" title="Edit User">✏️</button>
                  <button @click="deleteUser(u.id, u.username)" class="btn-icon-sm danger" title="Delete User">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="users.length === 0" class="empty-state">
          <span class="empty-icon">👥</span>
          <p>No users found. Create your first user!</p>
        </div>
      </div>
    </div>

    <!-- Low Stock Alerts -->
    <div class="card full-width">
      <div class="card-header">
        <h3>⚠️ Low Stock Alerts</h3>
        <span class="badge-count">{{ lowStock.length }}</span>
      </div>
      <div class="card-body">
        <div v-if="lowStock.length === 0" class="empty-state small">
          ✅ All stock levels are healthy
        </div>
        <div v-for="item in lowStock" :key="item.stall_name + item.material_name" class="alert-item">
          <span class="alert-icon">⚠️</span>
          <span class="alert-stall">{{ item.stall_name }}</span>
          <span class="alert-material">{{ item.material_name }}</span>
          <span class="alert-level">{{ item.current_level }}{{ getUnit(item.material_name) }}</span>
          <span class="alert-threshold">(Alert: {{ item.alert_level }}{{ getUnit(item.material_name) }})</span>
        </div>
      </div>
    </div>

    <!-- ==================== MODALS ==================== -->

    <!-- User Modal (Create/Edit) -->
    <div v-if="userModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal modal-lg">
        <h3>{{ editingUser ? 'Edit User' : 'New User' }}</h3>
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
              <label>Password (leave blank to keep current)</label>
              <input v-if="!editingUser" type="password" v-model="userForm.password" placeholder="Password" />
              <input v-else type="password" v-model="userForm.password" placeholder="Leave blank to keep current" />
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
            <label>Assign Stalls (for stall_admin and cashier):</label>
            <select multiple class="stall-select-multiple" v-model="userForm.stall_ids">
              <option v-for="s in stalls" :value="s.id">{{ s.name }}</option>
            </select>
            <small class="hint-text">Hold Ctrl/Cmd to select multiple stalls</small>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeUserModal" class="btn btn-ghost">Cancel</button>
          <button @click="saveUser" class="btn btn-primary">{{ editingUser ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- Stall Modal (Create/Edit) -->
    <div v-if="stallModal" class="modal-overlay" @click.self="stallModal=false">
      <div class="modal">
        <h3>{{ editingStall ? 'Edit Stall' : 'New Stall' }}</h3>
        <div class="modal-body">
          <input v-model="stallForm.name" placeholder="Stall Name" />
          <input v-model="stallForm.code" placeholder="Stall Code" />
          <input v-model="stallForm.location" placeholder="Location" />
        </div>
        <div class="modal-actions">
          <button @click="stallModal=false" class="btn btn-ghost">Cancel</button>
          <button @click="saveStall" class="btn btn-primary">{{ editingStall ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import API_BASE from '../config/api.js'
import MenuManagement from './MenuManagement.vue'

export default {
  props: ['token'],
  components: {
    MenuManagement
  },
  data() {
    return {
      companies: [],
      stalls: [],
      users: [],
      lowStock: [],
      consolidatedSales: {
        totalRevenue: 0,
        totalItems: 0,
        averagePerStall: 0,
        topStall: '-'
      },
      stallPerformance: [],
      menuPerformance: [],
      salesTrend: [],
      productSales: {},
      expandedStall: null,
      selectedPeriod: 'week',
      periods: [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'quarter', label: 'Quarter' },
        { value: 'year', label: 'Year' }
      ],
      userModal: false,
      editingUser: false,
      userForm: { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] },
      stallModal: false,
      editingStall: false,
      stallForm: { id: null, name: '', code: '', location: '' },
      expandedInventoryStall: null,
      stallInventory: {},
      inventoryMaterials: ['Chicken', 'Flour', 'Oil'],
      exporting: false
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount)
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric' })
    },
    getPeriodLabel() {
      var p = this.periods.find(function(p) { return p.value === this.selectedPeriod }.bind(this))
      return p ? p.label : 'Week'
    },
    getPerformancePercentage(quantity) {
      var max = Math.max.apply(null, this.menuPerformance.map(function(p) { return p.quantity }).concat([1]))
      return Math.round((quantity / max) * 100)
    },
    
    // ==================== STALL STATUS ====================
    getStallStatus(stall) {
      if (!stall.revenue || stall.revenue === 0) return 'No Sales'
      if (stall.revenue > 1000) return 'Excellent'
      if (stall.revenue > 500) return 'Good'
      if (stall.revenue > 100) return 'Average'
      return 'Poor'
    },
    getStallStatusClass(stall) {
      if (!stall.revenue || stall.revenue === 0) return 'no-sales'
      if (stall.revenue > 1000) return 'excellent'
      if (stall.revenue > 500) return 'good'
      if (stall.revenue > 100) return 'average'
      return 'poor'
    },
    
    // ==================== DATA LOADING ====================
    async refreshAllData() {
      await this.loadData()
    },
    
    async loadData() {
      try {
        await Promise.all([
          this.loadStalls(),
          this.loadUsers(),
          this.loadLowStock(),
          this.loadSalesAnalytics(),
          this.loadStallPerformance(),
          this.loadMenuPerformance()
        ])
        await this.loadAllStallsInventory()
        this.$emit('show-notification', 'Data refreshed', 'success')
      } catch (err) {
        this.$emit('show-notification', err.message, 'error')
      }
    },
    
    async loadStalls() {
      var res = await axios.get(API_BASE + '/companies/1/stalls', { headers: { Authorization: 'Bearer ' + this.token } })
      this.stalls = res.data
      for (var i = 0; i < this.stalls.length; i++) {
        var stall = this.stalls[i]
        var salesRes = await axios.get(API_BASE + '/stall-today-sales?stallId=' + stall.id, {
          headers: { Authorization: 'Bearer ' + this.token }
        })
        stall.todayRevenue = salesRes.data.total_revenue || 0
        stall.todayItems = salesRes.data.items_sold || 0
      }
    },
    
    async loadUsers() {
      var res = await axios.get(API_BASE + '/companies/1/users', { headers: { Authorization: 'Bearer ' + this.token } })
      this.users = res.data
    },
    
    async loadLowStock() {
      var res = await axios.get(API_BASE + '/companies/1/low-stock', { headers: { Authorization: 'Bearer ' + this.token } })
      this.lowStock = res.data
    },
    
    async loadSalesAnalytics() {
      var days = 7
      if (this.selectedPeriod === 'today') days = 1
      else if (this.selectedPeriod === 'week') days = 7
      else if (this.selectedPeriod === 'month') days = 30
      else if (this.selectedPeriod === 'quarter') days = 90
      else if (this.selectedPeriod === 'year') days = 365

      try {
        var res = await axios.get(API_BASE + '/sales-analytics?days=' + days, {
          headers: { Authorization: 'Bearer ' + this.token }
        })
        var data = res.data || {}
        
        this.salesTrend = data.dailySales || []
        this.consolidatedSales.totalRevenue = data.totalRevenue || 0
        this.consolidatedSales.totalItems = data.totalItems || 0
        this.consolidatedSales.averagePerStall = this.stalls.length > 0 ? 
          (data.totalRevenue || 0) / this.stalls.length : 0
        this.consolidatedSales.topStall = data.topStall || '-'
        
        this.productSales = data.productSales || {}
        
        await this.loadMenuPerformance()
        
      } catch (err) {
        console.error('Failed to load sales analytics:', err)
        this.salesTrend = []
        this.consolidatedSales = {
          totalRevenue: 0,
          totalItems: 0,
          averagePerStall: 0,
          topStall: '-'
        }
        this.productSales = {}
        this.$emit('show-notification', 'Failed to load sales data', 'error')
      }
    },
    
    async loadStallPerformance() {
      var days = 7
      if (this.selectedPeriod === 'today') days = 1
      else if (this.selectedPeriod === 'week') days = 7
      else if (this.selectedPeriod === 'month') days = 30
      else if (this.selectedPeriod === 'quarter') days = 90
      else if (this.selectedPeriod === 'year') days = 365

      try {
        var res = await axios.get(API_BASE + '/stall-performance?days=' + days, {
          headers: { Authorization: 'Bearer ' + this.token }
        })
        this.stallPerformance = res.data || []
        
        if (this.stallPerformance.length > 0 && !this.consolidatedSales.topStall) {
          this.consolidatedSales.topStall = this.stallPerformance[0]?.name || '-'
        }
        
      } catch (err) {
        console.error('Failed to load stall performance:', err)
        this.stallPerformance = []
      }
    },
    
    async loadMenuPerformance() {
      try {
        var productSales = this.productSales || {}
        var menuPerformance = Object.keys(productSales).map(function(name) {
          return {
            name: name,
            quantity: productSales[name].quantity || 0,
            revenue: productSales[name].revenue || 0
          }
        })
        menuPerformance.sort(function(a, b) { return b.quantity - a.quantity })
        this.menuPerformance = menuPerformance
      } catch (err) {
        console.error('Failed to load menu performance:', err)
        this.menuPerformance = []
      }
    },
    
    // ==================== CHART METHODS ====================
    getBarHeight(revenue) {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return 5
      var max = Math.max.apply(null, dailySales.map(function(d) { return d.revenue || 0 }).concat([1]))
      return Math.max((revenue / max) * 80, 5)
    },

    getTrendPoints() {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return ''
      if (dailySales.length === 1) {
        return '50,5'
      }
      var maxRevenue = Math.max.apply(null, dailySales.map(function(d) { return d.revenue || 0 }).concat([1]))
      var points = dailySales.map(function(day, index) {
        var x = (index / (dailySales.length - 1)) * 100
        var y = 40 - ((day.revenue / maxRevenue) * 35)
        return x + ',' + y
      })
      return points.join(' ')
    },

    getTrendPointsArray() {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return []
      if (dailySales.length === 1) {
        return [{ x: 50, y: 5 }]
      }
      var maxRevenue = Math.max.apply(null, dailySales.map(function(d) { return d.revenue || 0 }).concat([1]))
      return dailySales.map(function(day, index) {
        return {
          x: (index / (dailySales.length - 1)) * 100,
          y: 40 - ((day.revenue / maxRevenue) * 35)
        }
      })
    },

    // ==================== INVENTORY MANAGEMENT ====================
    getUnit(materialName) {
      return materialName === 'Oil' ? 'L' : 'kg'
    },

    async loadAllStallsInventory() {
      for (var i = 0; i < this.stalls.length; i++) {
        var stall = this.stalls[i]
        try {
          var res = await axios.get(API_BASE + '/inventory?stallId=' + stall.id, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.stallInventory[stall.id] = res.data.map(function(item) {
            return {
              ...item,
              newLevel: item.current_level
            }
          })
        } catch (err) {
          // Silently fail – inventory will load on expand
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
        var res = await axios.get(API_BASE + '/inventory?stallId=' + stallId, {
          headers: { Authorization: 'Bearer ' + this.token }
        })
        this.stallInventory[stallId] = res.data.map(function(item) {
          return {
            ...item,
            newLevel: item.current_level
          }
        })
      } catch (err) {
        this.$emit('show-notification', 'Failed to load inventory', 'error')
      }
    },

    getStallInventory(stallId) {
      return this.stallInventory[stallId] || []
    },

    getStallInventorySummary(stallId) {
      var inventory = this.getStallInventory(stallId)
      if (inventory.length === 0) {
        return [
          { material_name: 'Chicken', current_level: '?', alert_level: 10 },
          { material_name: 'Flour', current_level: '?', alert_level: 5 },
          { material_name: 'Oil', current_level: '?', alert_level: 8 }
        ]
      }
      return inventory
    },

    getInventoryPercentage(item) {
      var max = Math.max(item.current_level, item.alert_level * 2)
      return Math.min((item.current_level / max) * 100, 100)
    },

    async updateInventoryStock(stallId, materialName, newLevel) {
      if (newLevel === undefined || newLevel === null || newLevel === '') {
        this.$emit('show-notification', 'Please enter a valid value', 'error')
        return
      }
      try {
        await axios.post(API_BASE + '/inventory/update', {
          stallId: stallId,
          materialName: materialName,
          newLevel: parseFloat(newLevel)
        }, {
          headers: { Authorization: 'Bearer ' + this.token }
        })
        await this.loadStallInventory(stallId)
        this.$emit('show-notification', materialName + ' updated to ' + newLevel + this.getUnit(materialName), 'success')
      } catch (err) {
        this.$emit('show-notification', 'Failed to update stock', 'error')
      }
    },

    async quickAddStock(stallId, materialName, amount) {
      var inventory = this.stallInventory[stallId] || []
      var item = null
      for (var i = 0; i < inventory.length; i++) {
        if (inventory[i].material_name === materialName) {
          item = inventory[i]
          break
        }
      }
      if (item) {
        var newLevel = item.current_level + amount
        await this.updateInventoryStock(stallId, materialName, newLevel)
      }
    },

    async bulkUpdateInventory(stallId) {
      var inventory = this.stallInventory[stallId] || []
      if (inventory.length === 0) return

      try {
        for (var i = 0; i < inventory.length; i++) {
          var item = inventory[i]
          if (item.newLevel !== undefined && item.newLevel !== item.current_level) {
            await axios.post(API_BASE + '/inventory/update', {
              stallId: stallId,
              materialName: item.material_name,
              newLevel: item.newLevel
            }, {
              headers: { Authorization: 'Bearer ' + this.token }
            })
          }
        }
        await this.loadStallInventory(stallId)
        this.$emit('show-notification', 'All stocks updated successfully', 'success')
      } catch (err) {
        this.$emit('show-notification', 'Bulk update failed', 'error')
      }
    },

    async resetInventoryToAlert(stallId) {
      if (!confirm('Reset all stocks to alert levels for this stall?')) return
      
      var inventory = this.stallInventory[stallId] || []
      try {
        for (var i = 0; i < inventory.length; i++) {
          var item = inventory[i]
          await axios.post(API_BASE + '/inventory/update', {
            stallId: stallId,
            materialName: item.material_name,
            newLevel: item.alert_level
          }, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
        }
        await this.loadStallInventory(stallId)
        this.$emit('show-notification', 'All stocks reset to alert levels', 'success')
      } catch (err) {
        this.$emit('show-notification', 'Reset failed', 'error')
      }
    },

    // ==================== USER CRUD ====================
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
        stall_ids: (user.assigned_stalls || []).map(function(s) { return s.id })
      }
      this.userModal = true
    },
    
    closeUserModal() {
      this.userModal = false
      this.editingUser = false
    },
    
    async saveUser() {
      try {
        var payload = {
          full_name: this.userForm.full_name,
          role: this.userForm.role,
          stall_ids: this.userForm.stall_ids
        }
        
        if (this.userForm.password && this.userForm.password.trim() !== '') {
          payload.password = this.userForm.password
        }
        
        if (this.editingUser) {
          await axios.put(API_BASE + '/users/' + this.userForm.id, payload, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.$emit('show-notification', 'User updated successfully', 'success')
        } else {
          if (!this.userForm.password || this.userForm.password.trim() === '') {
            this.$emit('show-notification', 'Password is required for new user', 'error')
            return
          }
          payload.username = this.userForm.username
          payload.password = this.userForm.password
          await axios.post(API_BASE + '/companies/1/users', payload, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.$emit('show-notification', 'User created successfully', 'success')
        }
        this.closeUserModal()
        this.loadUsers()
      } catch (err) {
        this.$emit('show-notification', err.response?.data?.error || 'Operation failed', 'error')
      }
    },
    
    async deleteUser(userId, username) {
      if (confirm('Are you sure you want to delete user "' + username + '"? This action cannot be undone.')) {
        try {
          await axios.delete(API_BASE + '/users/' + userId, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.loadUsers()
          this.$emit('show-notification', 'User "' + username + '" deleted', 'success')
        } catch (err) {
          this.$emit('show-notification', 'Failed to delete user', 'error')
        }
      }
    },

    // ==================== STALL CRUD ====================
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
          await axios.put(API_BASE + '/stalls/' + this.stallForm.id, {
            name: this.stallForm.name,
            code: this.stallForm.code,
            location: this.stallForm.location
          }, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.$emit('show-notification', 'Stall updated successfully', 'success')
        } else {
          await axios.post(API_BASE + '/companies/1/stalls', {
            name: this.stallForm.name,
            code: this.stallForm.code,
            location: this.stallForm.location
          }, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.$emit('show-notification', 'Stall created successfully', 'success')
        }
        this.stallModal = false
        this.loadStalls()
        await this.loadAllStallsInventory()
      } catch (err) {
        this.$emit('show-notification', err.response?.data?.error || 'Operation failed', 'error')
      }
    },

    async toggleStallStatus(stall) {
      try {
        await axios.put(API_BASE + '/stalls/' + stall.id + '/toggle', {}, {
          headers: { Authorization: 'Bearer ' + this.token }
        })
        this.loadStalls()
        this.$emit('show-notification', 'Stall ' + (stall.is_active ? 'deactivated' : 'activated'), 'success')
      } catch (err) {
        this.$emit('show-notification', 'Failed to update stall status', 'error')
      }
    },

    async deleteStall(stallId, stallName) {
      if (confirm('Are you sure you want to delete stall "' + stallName + '"? This will remove all associated inventory and sales data.')) {
        try {
          await axios.delete(API_BASE + '/stalls/' + stallId, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.loadStalls()
          this.$emit('show-notification', 'Stall "' + stallName + '" deleted', 'success')
        } catch (err) {
          this.$emit('show-notification', 'Failed to delete stall', 'error')
        }
      }
    },

    // ==================== EXCEL EXPORT ====================
async exportExcel() {
  if (this.exporting) return
  this.exporting = true
  
  try {
    this.$emit('show-notification', 'Generating Excel file...', 'info')
    
    // Import required libraries
    var ExcelJS = await import('exceljs')
    var saveAsModule = await import('file-saver')
    var saveAs = saveAsModule.saveAs
    var html2canvas = await import('html2canvas')
    
    // ============================================================
    // CAPTURE CHART AS IMAGE
    // ============================================================
    var chartContainer = document.getElementById('sales-chart')
    var chartImageBase64 = null
    
    if (chartContainer && this.salesTrend.length > 0) {
      try {
        var canvas = await html2canvas.default(chartContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: chartContainer.scrollWidth,
          height: chartContainer.scrollHeight
        })
        chartImageBase64 = canvas.toDataURL('image/png')
      } catch (err) {
        console.error('Failed to capture chart:', err)
      }
    }
    
    // ============================================================
    // CREATE WORKBOOK WITH EXCELJS
    // ============================================================
    var workbook = new ExcelJS.Workbook()
    workbook.creator = 'Chickory Hub'
    workbook.created = new Date()
    
    // ============================================================
    // 1. Consolidated Sales Sheet
    // ============================================================
    var sheet1 = workbook.addWorksheet('Consolidated Sales')
    
    // Add headers
    sheet1.addRow(['📊 CONSOLIDATED SALES', '', ''])
    sheet1.addRow(['Period', this.getPeriodLabel(), ''])
    sheet1.addRow(['Total Revenue', this.formatCurrency(this.consolidatedSales.totalRevenue || 0), ''])
    sheet1.addRow(['Total Items Sold', this.consolidatedSales.totalItems || 0, ''])
    sheet1.addRow(['Average per Stall', this.formatCurrency(this.consolidatedSales.averagePerStall || 0), ''])
    sheet1.addRow(['Top Performing Stall', this.consolidatedSales.topStall || '-', ''])
    sheet1.addRow(['', '', ''])
    sheet1.addRow(['📈 DAILY SALES TREND (Bar Chart + Trend Line)', '', ''])
    sheet1.addRow(['Date', 'Revenue (RM)', 'Items Sold'])
    
    // Add daily sales data
    for (var i = 0; i < this.salesTrend.length; i++) {
      var day = this.salesTrend[i]
      sheet1.addRow([
        this.formatDate(day.date),
        day.revenue || 0,
        day.items || 0
      ])
    }
    
    // Insert chart image if available
    if (chartImageBase64) {
      // Add a blank row before image
      sheet1.addRow(['', '', ''])
      sheet1.addRow(['📊 Chart:', '', ''])
      
      // Insert image at cell A12 (adjust based on rows count)
      var imageId = workbook.addImage({
        base64: chartImageBase64,
        extension: 'png'
      })
      
      // Calculate where to place the image (after the data)
      var imageRow = 10 + this.salesTrend.length + 2
      sheet1.addImage(imageId, {
        tl: { col: 0, row: imageRow },
        ext: { width: 700, height: 350 }
      })
    }
    
    // Set column widths
    sheet1.getColumn(1).width = 30
    sheet1.getColumn(2).width = 18
    sheet1.getColumn(3).width = 15
    
    // ============================================================
    // 2. Stall Performance Sheet
    // ============================================================
    var sheet2 = workbook.addWorksheet('Stall Performance')
    
    sheet2.addRow(['🏆 STALL PERFORMANCE RANKING', '', '', '', '', ''])
    sheet2.addRow(['Rank', 'Stall Name', 'Revenue (RM)', 'Items Sold', 'Avg Transaction (RM)', 'Status'])
    
    for (var j = 0; j < this.stallPerformance.length; j++) {
      var stall = this.stallPerformance[j]
      sheet2.addRow([
        j + 1,
        stall.name,
        stall.revenue || 0,
        stall.items || 0,
        stall.avgTransaction || 0,
        this.getStallStatus(stall)
      ])
    }
    
    // Style the header row
    var headerRow2 = sheet2.getRow(2)
    headerRow2.font = { bold: true }
    
    sheet2.getColumn(1).width = 8
    sheet2.getColumn(2).width = 22
    sheet2.getColumn(3).width = 15
    sheet2.getColumn(4).width = 12
    sheet2.getColumn(5).width = 18
    sheet2.getColumn(6).width = 12
    
    // ============================================================
    // 3. Menu Performance Sheet
    // ============================================================
    var sheet3 = workbook.addWorksheet('Menu Performance')
    
    sheet3.addRow(['🍗 MENU PERFORMANCE', '', '', '', ''])
    sheet3.addRow(['Rank', 'Menu Item', 'Quantity Sold', 'Revenue (RM)', 'Percentage'])
    
    for (var k = 0; k < this.menuPerformance.length; k++) {
      var item = this.menuPerformance[k]
      sheet3.addRow([
        k + 1,
        item.name,
        item.quantity || 0,
        item.revenue || 0,
        this.getPerformancePercentage(item.quantity) + '%'
      ])
    }
    
    // Style the header row
    var headerRow3 = sheet3.getRow(2)
    headerRow3.font = { bold: true }
    
    sheet3.getColumn(1).width = 8
    sheet3.getColumn(2).width = 22
    sheet3.getColumn(3).width = 15
    sheet3.getColumn(4).width = 15
    sheet3.getColumn(5).width = 12
    
    // ============================================================
    // GENERATE & DOWNLOAD
    // ============================================================
    var buffer = await workbook.xlsx.writeBuffer()
    var blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    var fileName = 'Chickory_Hub_Report_' + this.getPeriodLabel() + '_' + new Date().toISOString().split('T')[0] + '.xlsx'
    saveAs(blob, fileName)
    
    this.$emit('show-notification', 'Excel file downloaded successfully!', 'success')
  } catch (error) {
    console.error('Export error:', error)
    this.$emit('show-notification', 'Failed to export Excel file: ' + error.message, 'error')
  } finally {
    this.exporting = false
  }
}
  }
}
</script>

<style scoped>
.sa-dashboard {
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.header-left .subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0.25rem 0 0 0;
}

/* Period Selector + Export Button */
.period-selector-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.period-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.period-btn {
  padding: 0.4rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.period-btn:hover {
  border-color: #F94908;
  color: var(--text);
}

.period-btn.active {
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
  border-color: #F94908;
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

.stat-icon.stalls { background: #dbeafe; color: #2563eb; }
.stat-icon.users { background: #e0f2fe; color: #0284c7; }
.stat-icon.alert { background: #fef3c7; color: #d97706; }

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

/* Cards */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.card.full-width {
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

.card-body {
  padding: 1.25rem;
}

/* Consolidated Stats */
.consolidated-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.consolidated-stat {
  text-align: center;
  padding: 0.5rem;
}

.consolidated-stat .stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.consolidated-stat .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.consolidated-stat .stat-value.highlight {
  color: #F94908;
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

/* Status Badges */
.status-badge {
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active { background: #d1fae5; color: #059669; }
.status-badge.inactive { background: #fee2e2; color: #dc2626; }
.status-badge.excellent { background: #d1fae5; color: #059669; }
.status-badge.good { background: #dbeafe; color: #2563eb; }
.status-badge.average { background: #fef3c7; color: #d97706; }
.status-badge.poor { background: #fee2e2; color: #dc2626; }
.status-badge.no-sales { background: #f3f4f6; color: #6b7280; }

.role-badge {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: capitalize;
  font-weight: 500;
}

.badge-count {
  background: #F94908;
  color: white;
  padding: 0.1rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}

.period-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

/* Chart */
.chart-container {
  padding: 0.5rem 0;
  position: relative;
}

.chart-wrapper {
  position: relative;
}

.trend-line-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  z-index: 2;
  pointer-events: none;
}

.trend-svg {
  width: 100%;
  height: 100%;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  gap: 0.5rem;
  padding-top: 45px;
  position: relative;
  z-index: 1;
}

.chart-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}

.chart-bar {
  width: 100%;
  max-width: 50px;
  background: linear-gradient(180deg, #F94908, #fa6a2e);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  transition: height 0.3s ease;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.bar-value {
  font-size: 0.6rem;
  color: var(--text-secondary);
  margin-top: -1rem;
  white-space: nowrap;
}

.bar-label {
  font-size: 0.6rem;
  color: var(--text-secondary);
  margin-top: 0.3rem;
}

/* Performance Bar */
.performance-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.performance-bar {
  height: 6px;
  background: linear-gradient(90deg, #F94908, #fa6a2e);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.performance-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  min-width: 40px;
}

/* Inventory Management */
.stall-inventory-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.stall-inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stall-inventory-header:hover {
  background: var(--background);
}

.stall-inventory-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.inventory-chip {
  background: var(--background);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  border: 1px solid var(--border);
}

.low-stock-dot {
  color: #dc2626;
  font-size: 0.7rem;
}

.stall-inventory-details {
  padding: 1rem;
  border-top: 1px solid var(--border-light);
  background: var(--background);
}

.inventory-edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.75rem;
}

.inventory-edit-item {
  background: var(--surface);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.inventory-edit-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.inventory-edit-info .material-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.inventory-edit-info .current-stock {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.alert-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
}

.alert-badge.low { background: #fee2e2; color: #dc2626; }
.alert-badge.ok { background: #d1fae5; color: #059669; }

.inventory-edit-controls {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
}

.inventory-input {
  width: 80px;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.85rem;
}

.inventory-input:focus {
  outline: none;
  border-color: #F94908;
}

.progress-bar-container {
  margin-top: 0.5rem;
  width: 100%;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-container .progress-bar {
  height: 100%;
  background: #10b981;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-bar-container .progress-bar.low {
  background: #ef4444;
}

.inventory-actions-bottom {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  flex-wrap: wrap;
}

.alert-item:last-child { margin-bottom: 0; }
.alert-icon { font-size: 1rem; }
.alert-stall { font-weight: 600; }
.alert-material { color: var(--text-secondary); }
.alert-level { font-weight: 600; color: #dc2626; }
.alert-threshold { font-size: 0.75rem; color: var(--text-tertiary); }

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

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-outline:hover {
  background: var(--background);
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

.btn-icon-sm {
  background: transparent;
  border: none;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-icon-sm:hover { background: var(--background); }
.btn-icon-sm.danger { color: #ef4444; }
.btn-icon-sm.danger:hover { background: #fee2e2; }

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

.modal-lg { max-width: 700px; }
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
.modal-body select {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--surface);
  color: var(--text);
  width: 100%;
}

.modal-body input:focus,
.modal-body select:focus {
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

/* Form Helpers */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.hint-text {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.stall-select-multiple {
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .consolidated-stats { grid-template-columns: 1fr 1fr; }
  .data-table { font-size: 0.8rem; }
  .data-table th, .data-table td { padding: 0.4rem 0.5rem; }
  .modal { width: 95%; padding: 1rem; }
  .chart-bars { height: 120px; }
  .form-row { grid-template-columns: 1fr; }
  .inventory-edit-grid { grid-template-columns: 1fr; }
  .stall-inventory-header { flex-direction: column; align-items: flex-start; }
  .inventory-edit-controls { flex-wrap: wrap; }
  .inventory-actions-bottom { flex-direction: column; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .consolidated-stats { grid-template-columns: 1fr; }
  .period-selector-wrapper { flex-direction: column; align-items: stretch; }
  .period-selector { justify-content: center; }
  .period-btn { font-size: 0.75rem; padding: 0.3rem 0.6rem; }
}
</style>