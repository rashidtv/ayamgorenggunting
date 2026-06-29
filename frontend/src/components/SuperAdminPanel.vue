<template>
  <div class="sa-dashboard">
    <!-- ============================================ -->
    <!-- HEADER SECTION                               -->
    <!-- ============================================ -->
    <div class="page-header">
      <div class="header-left">
        <h2>🏢 Company Management</h2>
        <p class="subtitle">Manage your company, stalls, inventory, and users</p>
      </div>
    </div>

    <!-- Stats Cards -->
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
      <div class="stat-card clickable" @click="switchTab('inventory')">
        <div class="stat-icon alert">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">{{ lowStock.length }}</div>
          <div class="stat-label">Low Stock Alerts</div>
          <div class="stat-hint">Click to view</div>
        </div>
      </div>
    </div>

    <!-- Period Selector + Export -->
    <div v-if="activeTab === 'dashboard'" class="period-selector-wrapper">
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
      <button @click="exportCurrentTab" class="btn btn-primary" :disabled="exporting">
        <span v-if="exporting">⏳ Generating...</span>
        <span v-else>📊 Export Excel</span>
      </button>
    </div>

    <!-- ============================================ -->
    <!-- TAB NAVIGATION - Mobile Friendly             -->
    <!-- ============================================ -->
    <div class="tab-navigation-wrapper">
      <div class="tab-navigation">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.id === 'inventory' && lowStock.length > 0" class="tab-badge">
            {{ lowStock.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- TAB CONTENT                                 -->
    <!-- ============================================ -->
    <div class="tab-content">
      <!-- ===== DASHBOARD TAB ===== -->
      <div v-if="activeTab === 'dashboard'" class="tab-panel">
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
                <span class="stat-change" v-if="getRevenueChange() !== null">
                  {{ getRevenueChange() >= 0 ? '↑' : '↓' }} {{ Math.abs(getRevenueChange()).toFixed(1) }}%
                </span>
              </div>
              <div class="consolidated-stat">
                <span class="stat-label">Total Items Sold</span>
                <span class="stat-value">{{ consolidatedSales.totalItems || 0 }}</span>
                <span class="stat-change" v-if="getItemsChange() !== null">
                  {{ getItemsChange() >= 0 ? '↑' : '↓' }} {{ Math.abs(getItemsChange()).toFixed(1) }}%
                </span>
              </div>
              <div class="consolidated-stat">
                <span class="stat-label">Average per Stall</span>
                <span class="stat-value">{{ formatCurrency(consolidatedSales.averagePerStall || 0) }}</span>
              </div>
              <div class="consolidated-stat">
                <span class="stat-label">Top Performing Stall</span>
                <span class="stat-value highlight">{{ consolidatedSales.topStall || '-' }}</span>
                <span class="stat-change" v-if="consolidatedSales.topRevenue">
                  {{ formatCurrency(consolidatedSales.topRevenue || 0) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Minimalist Daily Sales Trend -->
        <div class="card full-width" id="chart-container">
          <div class="card-header">
            <div class="chart-header-left">
              <h3>📈 Daily Sales Trend</h3>
              <span class="period-label">{{ getPeriodLabel() }}</span>
            </div>
            <div class="chart-controls">
              <div class="chart-view-toggle">
                <button 
                  @click="chartView = 'bars'" 
                  :class="['view-btn', { active: chartView === 'bars' }]"
                  title="Bar Chart"
                >
                  ▦
                </button>
                <button 
                  @click="chartView = 'line'" 
                  :class="['view-btn', { active: chartView === 'line' }]"
                  title="Line Chart"
                >
                  ∿
                </button>
                <button 
                  @click="chartView = 'mixed'" 
                  :class="['view-btn', { active: chartView === 'mixed' }]"
                  title="Mixed Chart"
                >
                  ⊹
                </button>
              </div>
              <button @click="toggleChartFullscreen" class="btn btn-ghost btn-sm" title="Fullscreen">
                ⛶
              </button>
            </div>
          </div>
          <div class="card-body" :class="{ 'chart-fullscreen': chartFullscreen }">
            <div class="chart-container" ref="chartContainer">
              <!-- Chart Summary Stats -->
              <div class="chart-summary" v-if="salesTrend.length > 0">
                <div class="summary-stat">
                  <span class="summary-label">Peak</span>
                  <span class="summary-value">{{ formatCurrency(getPeakRevenue()) }}</span>
                  <span class="summary-day">{{ getPeakDay() }}</span>
                </div>
                <div class="summary-stat">
                  <span class="summary-label">Average</span>
                  <span class="summary-value">{{ formatCurrency(getAverageRevenue()) }}</span>
                </div>
                <div class="summary-stat">
                  <span class="summary-label">Items</span>
                  <span class="summary-value">{{ getTotalItems() }}</span>
                </div>
                <div class="summary-stat">
                  <span class="summary-label">Trend</span>
                  <span class="summary-value" :class="getTrendDirection()">
                    {{ getTrendDirection() === 'up' ? '↑' : getTrendDirection() === 'down' ? '↓' : '→' }}
                    {{ getTrendPercentage() }}%
                  </span>
                </div>
              </div>

              <!-- Chart -->
              <div v-if="salesTrend.length > 0" class="chart-wrapper" id="sales-chart">
                <!-- Trend Line (overlay for mixed view) -->
                <div class="trend-line-container" v-if="chartView === 'mixed'">
                  <svg class="trend-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <polyline
                      :points="getTrendPoints()"
                      fill="none"
                      stroke="#F94908"
                      stroke-width="2.5"
                      stroke-linejoin="round"
                      stroke-linecap="round"
                    />
                    <circle
                      v-for="(point, index) in getTrendPointsArray()"
                      :key="index"
                      :cx="point.x"
                      :cy="point.y"
                      r="3"
                      fill="#F94908"
                      stroke="white"
                      stroke-width="1.5"
                      @mouseenter="showTooltip(index)"
                      @mouseleave="hideTooltip"
                    />
                  </svg>
                </div>
                
                <!-- Line Chart -->
                <div v-if="chartView === 'line'" class="line-chart-container">
                  <svg class="line-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#F94908;stop-opacity:0.15" />
                        <stop offset="100%" style="stop-color:#F94908;stop-opacity:0.01" />
                      </linearGradient>
                    </defs>
                    <polygon
                      :points="getAreaPoints()"
                      fill="url(#areaGradient)"
                    />
                    <polyline
                      :points="getLinePoints()"
                      fill="none"
                      stroke="#F94908"
                      stroke-width="2.5"
                      stroke-linejoin="round"
                      stroke-linecap="round"
                    />
                    <circle
                      v-for="(point, index) in getLinePointsArray()"
                      :key="index"
                      :cx="point.x"
                      :cy="point.y"
                      r="3.5"
                      fill="#F94908"
                      stroke="white"
                      stroke-width="1.5"
                      @mouseenter="showTooltip(index)"
                      @mouseleave="hideTooltip"
                    />
                  </svg>
                </div>

                <!-- Minimalist Bar Chart -->
                <div v-if="chartView === 'bars' || chartView === 'mixed'" class="chart-bars">
                  <div 
                    v-for="(day, index) in salesTrend" 
                    :key="day.date"
                    class="chart-bar-wrapper"
                    @mouseenter="showTooltip(index)"
                    @mouseleave="hideTooltip"
                  >
                    <div class="chart-bar" :style="{ height: getBarHeight(day.revenue) + '%' }">
                      <span class="bar-value">{{ formatCurrency(day.revenue) }}</span>
                    </div>
                    <span class="bar-label">{{ formatDate(day.date) }}</span>
                  </div>
                </div>

                <!-- Tooltip -->
                <div v-if="tooltipVisible && hoveredIndex !== null" 
                     class="chart-tooltip" 
                     :style="tooltipPosition">
                  <div class="tooltip-date">{{ formatDate(salesTrend[hoveredIndex]?.date) }}</div>
                  <div class="tooltip-revenue">{{ formatCurrency(salesTrend[hoveredIndex]?.revenue || 0) }}</div>
                  <div class="tooltip-items">{{ salesTrend[hoveredIndex]?.items || 0 }} items</div>
                </div>
              </div>
              <div v-else class="empty-state">
                <span class="empty-icon">📊</span>
                <p>No sales data available for this period</p>
              </div>

              <!-- Chart Navigation -->
              <div v-if="salesTrend.length > 0" class="chart-navigation">
                <button @click="navigateChart('prev')" class="nav-btn" :disabled="chartOffset <= 0">
                  ◀
                </button>
                <span class="nav-label">
                  {{ getChartRangeLabel() }}
                </span>
                <button @click="navigateChart('next')" class="nav-btn" :disabled="chartOffset + chartWindow >= salesTrend.length">
                  ▶
                </button>
                <button @click="resetChartNavigation" class="nav-btn reset-btn" v-if="chartOffset > 0 || chartWindow < salesTrend.length">
                  ↺
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Stall Performance Ranking -->
        <div class="card full-width">
          <div class="card-header">
            <h3>🏆 Stall Performance</h3>
            <span class="period-label">{{ getPeriodLabel() }}</span>
          </div>
          <div class="card-body table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Stall</th>
                  <th>Revenue</th>
                  <th>Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(stall, index) in stallPerformance" :key="stall.id">
                  <td>
                    <span class="rank-badge" :class="getRankClass(index)">
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td><strong>{{ stall.name }}</strong></td>
                  <td>{{ formatCurrency(stall.revenue || 0) }}</td>
                  <td>{{ stall.items || 0 }}</td>
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
              <p>No sales data available</p>
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
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Revenue</th>
                  <th>%</th>
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
              <p>No menu sales data available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== INVENTORY TAB ===== -->
      <div v-if="activeTab === 'inventory'" class="tab-panel">
        <div class="card full-width" id="inventory-section">
          <div class="card-header">
            <h3>📦 Inventory Management</h3>
            <div class="header-actions">
              <button @click="loadAllStallsInventory()" class="btn btn-outline btn-sm">🔄 Refresh</button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-controls">
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="inventorySearch" 
                  placeholder="🔍 Search..." 
                  class="search-input"
                />
              </div>
              <div class="filter-box">
                <select v-model="inventoryFilter" class="filter-select">
                  <option value="all">All Stalls</option>
                  <option value="low">⚠️ Low Stock</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <span class="filter-result">{{ filteredInventoryStalls.length }}</span>
            </div>

            <div v-if="stalls.length === 0" class="empty-state">
              <span class="empty-icon">📦</span>
              <p>No stalls found. Create a stall first.</p>
            </div>
            <div v-for="stall in filteredInventoryStalls" :key="stall.id" class="stall-inventory-item">
              <div class="stall-inventory-header" @click="toggleInventoryStall(stall.id)">
                <div class="stall-info">
                  <span class="stall-name">{{ stall.name }}</span>
                  <span :class="['status-badge', stall.is_active ? 'active' : 'inactive']">
                    {{ stall.is_active ? 'Active' : 'Inactive' }}
                  </span>
                  <span v-if="hasLowStock(stall.id)" class="low-stock-warning">⚠️</span>
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
                  <div 
                    v-for="item in getFilteredInventoryItems(stall.id)" 
                    :key="item.material_name" 
                    class="inventory-edit-item"
                    :class="{ 'low-stock-item': item.current_level <= item.alert_level }"
                  >
                    <div class="inventory-edit-info">
                      <span class="material-name">{{ item.material_name }}</span>
                      <span class="current-stock">{{ item.current_level }}{{ getUnit(item.material_name) }}</span>
                      <span :class="['alert-badge', item.current_level <= item.alert_level ? 'low' : 'ok']">
                        {{ item.current_level <= item.alert_level ? '⚠️' : '✅' }}
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
                  <button @click="bulkUpdateInventory(stall.id)" class="btn btn-primary btn-sm">📦 Bulk Update</button>
                  <button @click="resetInventoryToAlert(stall.id)" class="btn btn-outline btn-sm">Reset to Alert</button>
                </div>
              </div>
            </div>
            <div v-if="filteredInventoryStalls.length === 0" class="empty-state">
              <span class="empty-icon">🔍</span>
              <p>No stalls match your search</p>
            </div>

            <div v-if="lowStock.length > 0" class="low-stock-summary">
              <h4>📋 Low Stock Alerts</h4>
              <div v-for="item in filteredLowStock" :key="item.stall_name + item.material_name" class="alert-item compact">
                <span class="alert-icon">⚠️</span>
                <span class="alert-stall">{{ item.stall_name }}</span>
                <span class="alert-material">{{ item.material_name }}</span>
                <span class="alert-level">{{ item.current_level }}{{ getUnit(item.material_name) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== STALLS TAB ===== -->
      <div v-if="activeTab === 'stalls'" class="tab-panel">
        <div class="card full-width">
          <div class="card-header">
            <h3>🏪 Stall Management</h3>
            <button @click="openStallModal()" class="btn btn-primary btn-sm">+ New</button>
          </div>
          <div class="card-body">
            <div class="table-controls">
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="stallSearch" 
                  placeholder="🔍 Search..." 
                  class="search-input"
                />
              </div>
              <div class="filter-box">
                <select v-model="stallStatusFilter" class="filter-select">
                  <option value="all">All</option>
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⚪ Inactive</option>
                </select>
              </div>
              <span class="filter-result">{{ filteredStallsList.length }}</span>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(s, index) in filteredStallsList" :key="s.id">
                    <td>{{ index + 1 }}</td>
                    <td><strong>{{ s.name }}</strong></td>
                    <td><code>{{ s.code }}</code></td>
                    <td>
                      <span :class="['status-badge', s.is_active ? 'active' : 'inactive']">
                        {{ s.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button @click="openEditStallModal(s)" class="btn-icon-sm" title="Edit">✏️</button>
                        <button @click="toggleStallStatus(s)" class="btn-icon-sm" :title="s.is_active ? 'Deactivate' : 'Activate'">
                          {{ s.is_active ? '⏸️' : '▶️' }}
                        </button>
                        <button @click="deleteStall(s.id, s.name)" class="btn-icon-sm danger" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="filteredStallsList.length === 0" class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>No stalls found</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== USERS TAB ===== -->
      <div v-if="activeTab === 'users'" class="tab-panel">
        <div class="card full-width">
          <div class="card-header">
            <h3>👥 User Management</h3>
            <button @click="openUserModal()" class="btn btn-primary btn-sm">+ New</button>
          </div>
          <div class="card-body">
            <div class="table-controls">
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="userSearch" 
                  placeholder="🔍 Search..." 
                  class="search-input"
                />
              </div>
              <div class="filter-box">
                <select v-model="userRoleFilter" class="filter-select">
                  <option value="all">All Roles</option>
                  <option value="stall_admin">👤 Admin</option>
                  <option value="cashier">💰 Cashier</option>
                </select>
              </div>
              <span class="filter-result">{{ filteredUsersList.length }}</span>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Stalls</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(u, index) in filteredUsersList" :key="u.id">
                    <td>{{ index + 1 }}</td>
                    <td><strong>{{ u.username }}</strong></td>
                    <td><span class="role-badge">{{ u.role }}</span></td>
                    <td>{{ (u.assigned_stalls || []).map(s => s.name).join(', ') || '-' }}</td>
                    <td>
                      <div class="action-buttons">
                        <button @click="openEditUserModal(u)" class="btn-icon-sm" title="Edit">✏️</button>
                        <button @click="deleteUser(u.id, u.username)" class="btn-icon-sm danger" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="filteredUsersList.length === 0" class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>No users found</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- MODALS                                       -->
    <!-- ============================================ -->

    <!-- User Modal -->
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
            <small class="hint-text">Hold Ctrl/Cmd to select multiple</small>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeUserModal" class="btn btn-ghost">Cancel</button>
          <button @click="saveUser" class="btn btn-primary">{{ editingUser ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- Stall Modal -->
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
const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'

export default {
  props: ['token'],
  data() {
    return {
      // Tabs
      activeTab: 'dashboard',
      tabs: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'stalls', label: 'Stalls', icon: '🏪' },
        { id: 'users', label: 'Users', icon: '👥' }
      ],
      
      // Data
      stalls: [],
      users: [],
      lowStock: [],
      consolidatedSales: {
        totalRevenue: 0,
        totalItems: 0,
        averagePerStall: 0,
        topStall: '-',
        topRevenue: 0
      },
      stallPerformance: [],
      menuPerformance: [],
      salesTrend: [],
      productSales: {},
      selectedPeriod: 'week',
      periods: [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'quarter', label: 'Quarter' },
        { value: 'year', label: 'Year' }
      ],
      
      // Chart settings
      chartView: 'bars',
      chartFullscreen: false,
      chartOffset: 0,
      chartWindow: 7,
      tooltipVisible: false,
      hoveredIndex: null,
      tooltipPosition: { left: '50%', top: '10px' },
      
      // Inventory
      expandedInventoryStall: null,
      stallInventory: {},
      inventorySearch: '',
      inventoryFilter: 'all',
      
      // Stalls tab filters
      stallSearch: '',
      stallStatusFilter: 'all',
      
      // Users tab filters
      userSearch: '',
      userRoleFilter: 'all',
      
      // Modals
      userModal: false,
      editingUser: false,
      userForm: { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] },
      stallModal: false,
      editingStall: false,
      stallForm: { id: null, name: '', code: '', location: '' },
      
      exporting: false,
    }
  },
  computed: {
    lowStockCount() {
      return this.lowStock.length
    },
    
    // ===== INVENTORY FILTERS =====
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
    
    // ===== STALLS FILTERS =====
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
    
    // ===== USERS FILTERS =====
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
    this.loadData()
  },
  methods: {
    // =============================================
    // TAB MANAGEMENT
    // =============================================
    switchTab(tabId) {
      this.activeTab = tabId
      if (tabId === 'inventory') {
        if (this.lowStock.length > 0) {
          this.inventoryFilter = 'low'
        }
        this.$nextTick(() => {
          const element = document.getElementById('inventory-section')
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        })
      }
    },

    // =============================================
    // FORMATTING HELPERS
    // =============================================
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount)
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric' })
    },
    formatDateFull(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-MY', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short' 
      })
    },
    getPeriodLabel() {
      var p = this.periods.find(p => p.value === this.selectedPeriod)
      return p ? p.label : 'Week'
    },
    getUnit(materialName) {
      return materialName === 'Oil' ? 'L' : 'kg'
    },

    // =============================================
    // CHART SUMMARY STATS
    // =============================================
    getPeakRevenue() {
      if (this.salesTrend.length === 0) return 0
      return Math.max(...this.salesTrend.map(d => d.revenue || 0))
    },
    getPeakDay() {
      if (this.salesTrend.length === 0) return ''
      const max = Math.max(...this.salesTrend.map(d => d.revenue || 0))
      const day = this.salesTrend.find(d => d.revenue === max)
      return day ? this.formatDate(day.date) : ''
    },
    getAverageRevenue() {
      if (this.salesTrend.length === 0) return 0
      const total = this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0)
      return total / this.salesTrend.length
    },
    getTotalItems() {
      return this.salesTrend.reduce((sum, d) => sum + (d.items || 0), 0)
    },
    getTrendDirection() {
      if (this.salesTrend.length < 2) return 'neutral'
      const first = this.salesTrend[0]?.revenue || 0
      const last = this.salesTrend[this.salesTrend.length - 1]?.revenue || 0
      if (last > first) return 'up'
      if (last < first) return 'down'
      return 'neutral'
    },
    getTrendPercentage() {
      if (this.salesTrend.length < 2) return 0
      const first = this.salesTrend[0]?.revenue || 0
      const last = this.salesTrend[this.salesTrend.length - 1]?.revenue || 0
      if (first === 0) return 0
      return ((last - first) / first * 100).toFixed(1)
    },
    getRevenueChange() {
      if (this.salesTrend.length < 2) return null
      const first = this.salesTrend[0]?.revenue || 0
      const last = this.salesTrend[this.salesTrend.length - 1]?.revenue || 0
      if (first === 0) return null
      return ((last - first) / first * 100)
    },
    getItemsChange() {
      if (this.salesTrend.length < 2) return null
      const first = this.salesTrend[0]?.items || 0
      const last = this.salesTrend[this.salesTrend.length - 1]?.items || 0
      if (first === 0) return null
      return ((last - first) / first * 100)
    },

    // =============================================
    // CHART NAVIGATION
    // =============================================
    getChartRangeLabel() {
      const start = this.chartOffset + 1
      const end = Math.min(this.chartOffset + this.chartWindow, this.salesTrend.length)
      return `${start} - ${end} of ${this.salesTrend.length}`
    },
    navigateChart(direction) {
      if (direction === 'prev' && this.chartOffset > 0) {
        this.chartOffset = Math.max(0, this.chartOffset - this.chartWindow)
      } else if (direction === 'next' && this.chartOffset + this.chartWindow < this.salesTrend.length) {
        this.chartOffset = Math.min(
          this.salesTrend.length - this.chartWindow,
          this.chartOffset + this.chartWindow
        )
      }
    },
    resetChartNavigation() {
      this.chartOffset = 0
      this.chartWindow = Math.min(7, this.salesTrend.length)
    },
    toggleChartFullscreen() {
      this.chartFullscreen = !this.chartFullscreen
      if (this.chartFullscreen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    },

    // =============================================
    // CHART TOOLTIP
    // =============================================
    showTooltip(index) {
      this.hoveredIndex = index
      this.tooltipVisible = true
      const container = this.$refs.chartContainer
      if (container) {
        const rect = container.getBoundingClientRect()
        const x = (index / (this.salesTrend.length - 1)) * 100
        this.tooltipPosition = {
          left: `calc(${x}% - 60px)`,
          top: '10px'
        }
      }
    },
    hideTooltip() {
      this.tooltipVisible = false
      this.hoveredIndex = null
    },

    // =============================================
    // STALL STATUS
    // =============================================
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
    getRankClass(index) {
      if (index === 0) return 'gold'
      if (index === 1) return 'silver'
      if (index === 2) return 'bronze'
      return ''
    },
    getPerformancePercentage(quantity) {
      var max = Math.max.apply(null, this.menuPerformance.map(p => p.quantity).concat([1]))
      return Math.round((quantity / max) * 100)
    },

    // =============================================
    // CHART DRAWING
    // =============================================
    getBarHeight(revenue) {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return 5
      var max = Math.max.apply(null, dailySales.map(d => d.revenue || 0).concat([1]))
      return Math.max((revenue / max) * 80, 5)
    },
    
    getTrendPoints() {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return ''
      if (dailySales.length === 1) return '50,5'
      var maxRevenue = Math.max.apply(null, dailySales.map(d => d.revenue || 0).concat([1]))
      return dailySales.map((day, index) => {
        var x = (index / (dailySales.length - 1)) * 100
        var y = 40 - ((day.revenue / maxRevenue) * 35)
        return x + ',' + y
      }).join(' ')
    },
    getTrendPointsArray() {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return []
      if (dailySales.length === 1) return [{ x: 50, y: 5 }]
      var maxRevenue = Math.max.apply(null, dailySales.map(d => d.revenue || 0).concat([1]))
      return dailySales.map((day, index) => ({
        x: (index / (dailySales.length - 1)) * 100,
        y: 40 - ((day.revenue / maxRevenue) * 35)
      }))
    },
    
    getAreaPoints() {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return ''
      var maxRevenue = Math.max.apply(null, dailySales.map(d => d.revenue || 0).concat([1]))
      var points = dailySales.map((day, index) => {
        var x = (index / (dailySales.length - 1)) * 100
        var y = 100 - ((day.revenue / maxRevenue) * 85)
        return x + ',' + y
      })
      return '0,100,' + points.join(',') + ',100,100'
    },
    getLinePoints() {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return ''
      var maxRevenue = Math.max.apply(null, dailySales.map(d => d.revenue || 0).concat([1]))
      return dailySales.map((day, index) => {
        var x = (index / (dailySales.length - 1)) * 100
        var y = 100 - ((day.revenue / maxRevenue) * 85)
        return x + ',' + y
      }).join(' ')
    },
    getLinePointsArray() {
      var dailySales = this.salesTrend || []
      if (dailySales.length === 0) return []
      if (dailySales.length === 1) return [{ x: 50, y: 5 }]
      var maxRevenue = Math.max.apply(null, dailySales.map(d => d.revenue || 0).concat([1]))
      return dailySales.map((day, index) => ({
        x: (index / (dailySales.length - 1)) * 100,
        y: 100 - ((day.revenue / maxRevenue) * 85)
      }))
    },

    // =============================================
    // DATA LOADING
    // =============================================
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
        this.resetChartNavigation()
        this.$emit('show-notification', 'Data refreshed', 'success')
      } catch (err) {
        this.$emit('show-notification', err.message, 'error')
      }
    },
    async loadStalls() {
      var res = await axios.get(API_BASE + '/companies/1/stalls', { 
        headers: { Authorization: 'Bearer ' + this.token } 
      })
      this.stalls = res.data
    },
    async loadUsers() {
      var res = await axios.get(API_BASE + '/companies/1/users', { 
        headers: { Authorization: 'Bearer ' + this.token } 
      })
      this.users = res.data
    },
    async loadLowStock() {
      var res = await axios.get(API_BASE + '/companies/1/low-stock', { 
        headers: { Authorization: 'Bearer ' + this.token } 
      })
      this.lowStock = res.data
    },
    async loadSalesAnalytics() {
      var days = this.selectedPeriod === 'today' ? 1 :
                 this.selectedPeriod === 'week' ? 7 :
                 this.selectedPeriod === 'month' ? 30 :
                 this.selectedPeriod === 'quarter' ? 90 : 365

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
        this.consolidatedSales.topRevenue = data.topRevenue || 0
        this.productSales = data.productSales || {}
        await this.loadMenuPerformance()
      } catch (err) {
        console.error('Failed to load sales analytics:', err)
      }
    },
    async loadStallPerformance() {
      var days = this.selectedPeriod === 'today' ? 1 :
                 this.selectedPeriod === 'week' ? 7 :
                 this.selectedPeriod === 'month' ? 30 :
                 this.selectedPeriod === 'quarter' ? 90 : 365
      try {
        var res = await axios.get(API_BASE + '/stall-performance?days=' + days, {
          headers: { Authorization: 'Bearer ' + this.token }
        })
        this.stallPerformance = res.data || []
      } catch (err) {
        this.stallPerformance = []
      }
    },
    async loadMenuPerformance() {
      try {
        var productSales = this.productSales || {}
        var menuPerformance = Object.keys(productSales).map(name => ({
          name: name,
          quantity: productSales[name].quantity || 0,
          revenue: productSales[name].revenue || 0
        }))
        menuPerformance.sort((a, b) => b.quantity - a.quantity)
        this.menuPerformance = menuPerformance
      } catch (err) {
        this.menuPerformance = []
      }
    },

    // =============================================
    // INVENTORY MANAGEMENT
    // =============================================
    async loadAllStallsInventory() {
      for (var stall of this.stalls) {
        try {
          var res = await axios.get(API_BASE + '/inventory?stallId=' + stall.id, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.stallInventory[stall.id] = res.data.map(item => ({
            ...item,
            newLevel: item.current_level
          }))
        } catch (err) {}
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
        this.stallInventory[stallId] = res.data.map(item => ({
          ...item,
          newLevel: item.current_level
        }))
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
      const inventory = this.getStallInventory(stallId)
      return inventory.some(item => item.current_level <= item.alert_level)
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
        await this.loadLowStock()
        this.$emit('show-notification', materialName + ' updated to ' + newLevel + this.getUnit(materialName), 'success')
      } catch (err) {
        this.$emit('show-notification', 'Failed to update stock', 'error')
      }
    },
    async quickAddStock(stallId, materialName, amount) {
      var inventory = this.stallInventory[stallId] || []
      var item = inventory.find(i => i.material_name === materialName)
      if (item) {
        await this.updateInventoryStock(stallId, materialName, item.current_level + amount)
      }
    },
    async bulkUpdateInventory(stallId) {
      var inventory = this.stallInventory[stallId] || []
      if (inventory.length === 0) return
      try {
        for (var item of inventory) {
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
        await this.loadLowStock()
        this.$emit('show-notification', 'All stocks updated successfully', 'success')
      } catch (err) {
        this.$emit('show-notification', 'Bulk update failed', 'error')
      }
    },
    async resetInventoryToAlert(stallId) {
      if (!confirm('Reset all stocks to alert levels for this stall?')) return
      var inventory = this.stallInventory[stallId] || []
      try {
        for (var item of inventory) {
          await axios.post(API_BASE + '/inventory/update', {
            stallId: stallId,
            materialName: item.material_name,
            newLevel: item.alert_level
          }, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
        }
        await this.loadStallInventory(stallId)
        await this.loadLowStock()
        this.$emit('show-notification', 'All stocks reset to alert levels', 'success')
      } catch (err) {
        this.$emit('show-notification', 'Reset failed', 'error')
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
            this.$emit('show-notification', 'Password is required', 'error')
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
      if (confirm('Delete user "' + username + '"?')) {
        try {
          await axios.delete(API_BASE + '/users/' + userId, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.loadUsers()
          this.$emit('show-notification', 'User deleted', 'success')
        } catch (err) {
          this.$emit('show-notification', 'Failed to delete user', 'error')
        }
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
          await axios.put(API_BASE + '/stalls/' + this.stallForm.id, {
            name: this.stallForm.name,
            code: this.stallForm.code,
            location: this.stallForm.location
          }, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.$emit('show-notification', 'Stall updated', 'success')
        } else {
          await axios.post(API_BASE + '/companies/1/stalls', {
            name: this.stallForm.name,
            code: this.stallForm.code,
            location: this.stallForm.location
          }, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.$emit('show-notification', 'Stall created', 'success')
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
        this.$emit('show-notification', 'Failed to update stall', 'error')
      }
    },
    async deleteStall(stallId, stallName) {
      if (confirm('Delete stall "' + stallName + '"?')) {
        try {
          await axios.delete(API_BASE + '/stalls/' + stallId, {
            headers: { Authorization: 'Bearer ' + this.token }
          })
          this.loadStalls()
          this.$emit('show-notification', 'Stall deleted', 'success')
        } catch (err) {
          this.$emit('show-notification', 'Failed to delete stall', 'error')
        }
      }
    },

    // =============================================
    // EXPORT
    // =============================================
    async exportCurrentTab() {
      if (this.exporting) return
      this.exporting = true
      
      try {
        this.$emit('show-notification', 'Generating Excel file...', 'info')
        
        const ExcelJS = await import('exceljs')
        const saveAsModule = await import('file-saver')
        const saveAs = saveAsModule.saveAs
        const html2canvas = await import('html2canvas')
        
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Chickory Hub'
        workbook.created = new Date()
        
        let sheet
        let fileName
        
        if (this.activeTab === 'dashboard') {
          sheet = workbook.addWorksheet('Dashboard')
          sheet.addRow(['📊 CHICKORY HUB DASHBOARD', '', ''])
          sheet.addRow(['Period', this.getPeriodLabel(), ''])
          sheet.addRow(['Total Revenue', this.formatCurrency(this.consolidatedSales.totalRevenue || 0), ''])
          sheet.addRow(['Total Items Sold', this.consolidatedSales.totalItems || 0, ''])
          sheet.addRow(['Average per Stall', this.formatCurrency(this.consolidatedSales.averagePerStall || 0), ''])
          sheet.addRow(['Top Performing Stall', this.consolidatedSales.topStall || '-', ''])
          sheet.addRow(['', '', ''])
          sheet.addRow(['📈 DAILY SALES TREND', '', ''])
          sheet.addRow(['Date', 'Revenue (RM)', 'Items Sold'])
          for (var day of this.salesTrend) {
            sheet.addRow([this.formatDate(day.date), day.revenue || 0, day.items || 0])
          }
          
          const chartContainer = document.getElementById('sales-chart')
          if (chartContainer && this.salesTrend.length > 0) {
            try {
              const canvas = await html2canvas.default(chartContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
              })
              const chartImageBase64 = canvas.toDataURL('image/png')
              const imageId = workbook.addImage({ base64: chartImageBase64, extension: 'png' })
              const imageRow = 10 + this.salesTrend.length + 2
              sheet.addImage(imageId, { tl: { col: 0, row: imageRow }, ext: { width: 700, height: 350 } })
            } catch (err) {}
          }
          
          fileName = 'Chickory_Hub_Dashboard_' + this.getPeriodLabel() + '_' + new Date().toISOString().split('T')[0] + '.xlsx'
        } else if (this.activeTab === 'inventory') {
          sheet = workbook.addWorksheet('Inventory')
          sheet.addRow(['📦 INVENTORY MANAGEMENT', '', '', ''])
          sheet.addRow(['Stall Name', 'Material', 'Current Level', 'Alert Level', 'Status'])
          for (var stall of this.filteredInventoryStalls) {
            const inventory = this.getStallInventory(stall.id)
            for (var item of inventory) {
              sheet.addRow([
                stall.name,
                item.material_name,
                item.current_level + this.getUnit(item.material_name),
                item.alert_level + this.getUnit(item.material_name),
                item.current_level <= item.alert_level ? '⚠️ LOW' : '✅ OK'
              ])
            }
          }
          fileName = 'Chickory_Hub_Inventory_' + new Date().toISOString().split('T')[0] + '.xlsx'
        } else if (this.activeTab === 'stalls') {
          sheet = workbook.addWorksheet('Stalls')
          sheet.addRow(['🏪 STALL MANAGEMENT', '', '', ''])
          sheet.addRow(['Name', 'Code', 'Status'])
          for (var stall of this.filteredStallsList) {
            sheet.addRow([
              stall.name,
              stall.code,
              stall.is_active ? 'Active' : 'Inactive'
            ])
          }
          fileName = 'Chickory_Hub_Stalls_' + new Date().toISOString().split('T')[0] + '.xlsx'
        } else if (this.activeTab === 'users') {
          sheet = workbook.addWorksheet('Users')
          sheet.addRow(['👥 USER MANAGEMENT', '', '', ''])
          sheet.addRow(['Username', 'Role', 'Assigned Stalls'])
          for (var user of this.filteredUsersList) {
            sheet.addRow([
              user.username,
              user.role,
              (user.assigned_stalls || []).map(s => s.name).join(', ') || '-'
            ])
          }
          fileName = 'Chickory_Hub_Users_' + new Date().toISOString().split('T')[0] + '.xlsx'
        }
        
        sheet.columns.forEach(col => {
          col.width = Math.max(col.width || 0, 20)
        })
        
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, fileName)
        
        this.$emit('show-notification', 'Excel file downloaded!', 'success')
      } catch (error) {
        console.error('Export error:', error)
        this.$emit('show-notification', 'Failed to export: ' + error.message, 'error')
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>

<style scoped>
/* ============================================ */
/* ROOT & BASE                                  */
/* ============================================ */
.sa-dashboard {
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ============================================ */
/* HEADER                                       */
/* ============================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-left h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.header-left .subtitle {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0.15rem 0 0 0;
}

/* ============================================ */
/* STATS GRID                                   */
/* ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.12);
  border-color: #F94908;
}

.stat-hint {
  font-size: 0.6rem;
  color: #F94908;
  font-weight: 500;
  margin-top: 1px;
  opacity: 0.6;
}

.stat-card.clickable:hover .stat-hint {
  opacity: 1;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-icon.stalls { background: #dbeafe; color: #2563eb; }
.stat-icon.users { background: #e0f2fe; color: #0284c7; }
.stat-icon.alert { background: #fef3c7; color: #d97706; }

.stat-info .stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.stat-info .stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.stat-change {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--success);
  display: inline-block;
  margin-top: 1px;
}

.stat-change:has(↓) {
  color: var(--error);
}

/* ============================================ */
/* PERIOD SELECTOR                              */
/* ============================================ */
.period-selector-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.period-selector {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  flex: 1;
}

.period-btn {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
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

/* ============================================ */
/* TAB NAVIGATION - Mobile Friendly             */
/* ============================================ */
.tab-navigation-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1.25rem;
  scrollbar-width: none;
}

.tab-navigation-wrapper::-webkit-scrollbar {
  display: none;
}

.tab-navigation {
  display: flex;
  gap: 0.35rem;
  background: var(--surface);
  padding: 0.4rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  min-width: max-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
}

.tab-btn:hover {
  background: var(--background);
  color: var(--text);
}

.tab-btn.active {
  background: linear-gradient(135deg, #F94908, #fa6a2e);
  color: white;
  box-shadow: 0 2px 8px rgba(249, 73, 8, 0.25);
}

.tab-icon {
  font-size: 1rem;
}

.tab-label {
  font-size: 0.8rem;
}

.tab-badge {
  background: #ef4444;
  color: white;
  border-radius: 50%;
  padding: 0 5px;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 16px;
  text-align: center;
  line-height: 16px;
}

/* ============================================ */
/* TAB CONTENT                                  */
/* ============================================ */
.tab-content {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ============================================ */
/* CARDS                                        */
/* ============================================ */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.card.full-width {
  width: 100%;
}

.card-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--background);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}

.chart-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-body {
  padding: 1rem;
}

.card-body.chart-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--surface);
  padding: 1.5rem;
  overflow: auto;
  animation: fadeIn 0.25s ease;
}

/* ============================================ */
/* CHART CONTROLS                               */
/* ============================================ */
.chart-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.chart-view-toggle {
  display: flex;
  gap: 2px;
  background: var(--background);
  padding: 2px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.view-btn {
  padding: 0.15rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: var(--text-tertiary);
}

.view-btn:hover {
  background: var(--surface-elevated);
  color: var(--text);
}

.view-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 6px rgba(249, 73, 8, 0.25);
}

/* ============================================ */
/* CHART SUMMARY                                */
/* ============================================ */
.chart-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.6rem;
  background: var(--background);
  border-radius: 6px;
}

.summary-stat {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.6rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.summary-value {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
}

.summary-value.up { color: var(--success); }
.summary-value.down { color: var(--error); }

.summary-day {
  font-size: 0.55rem;
  color: var(--text-tertiary);
}

/* ============================================ */
/* MINIMALIST CHART                            */
/* ============================================ */
.chart-container {
  padding: 0.25rem 0;
  position: relative;
}

.chart-wrapper {
  position: relative;
}

/* Trend Line Overlay */
.trend-line-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 35px;
  z-index: 2;
  pointer-events: none;
}

.trend-svg {
  width: 100%;
  height: 100%;
}

.trend-svg circle {
  cursor: pointer;
  pointer-events: all;
  transition: r 0.2s;
}

.trend-svg circle:hover {
  r: 5;
}

/* Line Chart */
.line-chart-container {
  width: 100%;
  height: 160px;
  position: relative;
}

.line-chart-svg {
  width: 100%;
  height: 100%;
}

.line-chart-svg circle {
  cursor: pointer;
  pointer-events: all;
  transition: r 0.2s;
}

.line-chart-svg circle:hover {
  r: 5;
}

/* Minimalist Bar Chart */
.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 160px;
  gap: 0.35rem;
  padding-top: 35px;
  position: relative;
  z-index: 1;
}

.chart-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  cursor: pointer;
}

.chart-bar {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(180deg, #F94908, #fa6a2e);
  border-radius: 3px 3px 0 0;
  min-height: 3px;
  position: relative;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.chart-bar-wrapper:hover .chart-bar {
  transform: scaleY(1.03);
  transform-origin: bottom;
  box-shadow: 0 2px 10px rgba(249, 73, 8, 0.2);
}

.bar-value {
  font-size: 0.55rem;
  color: var(--text-tertiary);
  margin-top: -0.9rem;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
}

.chart-bar-wrapper:hover .bar-value {
  opacity: 1;
}

.bar-label {
  font-size: 0.55rem;
  color: var(--text-tertiary);
  margin-top: 0.2rem;
}

/* Chart Tooltip */
.chart-tooltip {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  box-shadow: var(--shadow-lg);
  z-index: 10;
  min-width: 100px;
  pointer-events: none;
  animation: fadeIn 0.15s ease;
}

.tooltip-date {
  font-size: 0.65rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.tooltip-revenue {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
}

.tooltip-items {
  font-size: 0.6rem;
  color: var(--text-tertiary);
}

/* Chart Navigation */
.chart-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.35rem 0.5rem;
  background: var(--background);
  border-radius: 6px;
}

.nav-btn {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  color: var(--text);
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.nav-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.nav-btn.reset-btn {
  border-color: var(--primary);
  color: var(--primary);
}

.nav-btn.reset-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.nav-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

/* ============================================ */
/* CONSOLIDATED STATS                           */
/* ============================================ */
.consolidated-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
}

.consolidated-stat {
  text-align: center;
  padding: 0.35rem;
}

.consolidated-stat .stat-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-bottom: 0.15rem;
}

.consolidated-stat .stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}

.consolidated-stat .stat-value.highlight {
  color: #F94908;
}

.period-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
}

/* ============================================ */
/* TABLE CONTROLS                               */
/* ============================================ */
.table-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 150px;
}

.search-input {
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.06);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.filter-box {
  min-width: 110px;
}

.filter-select {
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%2364748b' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.6rem center;
  padding-right: 2rem;
}

.filter-select:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.06);
}

.filter-result {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  background: var(--background);
  border-radius: 16px;
  white-space: nowrap;
  border: 1px solid var(--border-light);
  min-width: 28px;
  text-align: center;
}

/* ============================================ */
/* TABLES                                       */
/* ============================================ */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
  text-align: left;
  padding: 0.4rem 0.6rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--border);
}

.data-table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--border-light);
  color: var(--text);
}

.data-table tr:hover td {
  background: var(--background);
}

.data-table code {
  background: var(--background);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-size: 0.75rem;
}

/* ============================================ */
/* STATUS BADGES                                */
/* ============================================ */
.status-badge {
  padding: 0.1rem 0.5rem;
  border-radius: 16px;
  font-size: 0.65rem;
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

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.65rem;
  background: var(--background);
  color: var(--text-secondary);
}

.rank-badge.gold {
  background: #fbbf24;
  color: #78350f;
}

.rank-badge.silver {
  background: #d1d5db;
  color: #374151;
}

.rank-badge.bronze {
  background: #f59e0b;
  color: #78350f;
}

.role-badge {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.65rem;
  text-transform: capitalize;
  font-weight: 500;
}

.badge-count {
  background: #F94908;
  color: white;
  padding: 0.1rem 0.5rem;
  border-radius: 16px;
  font-size: 0.65rem;
  font-weight: 600;
}

/* ============================================ */
/* PERFORMANCE BARS                             */
/* ============================================ */
.performance-bar-container {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.performance-bar {
  height: 4px;
  background: linear-gradient(90deg, #F94908, #fa6a2e);
  border-radius: 2px;
  transition: width 0.3s ease;
  min-width: 10px;
}

.performance-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  min-width: 32px;
  text-align: right;
}

/* ============================================ */
/* INVENTORY MANAGEMENT                         */
/* ============================================ */
.stall-inventory-item {
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.stall-inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.stall-inventory-header:hover {
  background: var(--background);
}

.stall-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.stall-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.low-stock-warning {
  font-size: 0.65rem;
  color: #dc2626;
  background: #fee2e2;
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  font-weight: 600;
}

.stall-inventory-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.inventory-chip {
  background: var(--background);
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-size: 0.7rem;
  border: 1px solid var(--border);
}

.low-stock-dot {
  color: #dc2626;
  font-size: 0.6rem;
}

.toggle-icon {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.stall-inventory-details {
  padding: 0.75rem;
  border-top: 1px solid var(--border-light);
  background: var(--background);
}

.inventory-edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.5rem;
}

.inventory-edit-item {
  background: var(--surface);
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.inventory-edit-item.low-stock-item {
  border-color: #dc2626;
  background: #fef2f2;
}

.inventory-edit-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
}

.inventory-edit-info .material-name {
  font-weight: 600;
  font-size: 0.85rem;
}

.inventory-edit-info .current-stock {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.alert-badge {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.05rem 0.3rem;
  border-radius: 8px;
}

.alert-badge.low { background: #fee2e2; color: #dc2626; }
.alert-badge.ok { background: #d1fae5; color: #059669; }

.inventory-edit-controls {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  flex-wrap: wrap;
}

.inventory-input {
  width: 60px;
  padding: 0.2rem 0.35rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.8rem;
}

.inventory-input:focus {
  outline: none;
  border-color: #F94908;
}

.progress-bar-container {
  margin-top: 0.35rem;
  width: 100%;
  height: 3px;
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
  margin-top: 0.5rem;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

/* ============================================ */
/* LOW STOCK SUMMARY                            */
/* ============================================ */
.low-stock-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.low-stock-summary h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  background: #fef3c7;
  border-radius: 4px;
  margin-bottom: 0.2rem;
  font-size: 0.8rem;
  flex-wrap: wrap;
}

.alert-item:last-child { margin-bottom: 0; }
.alert-icon { font-size: 0.9rem; }
.alert-stall { font-weight: 600; }
.alert-material { color: var(--text-secondary); }
.alert-level { font-weight: 600; color: #dc2626; }

.alert-item.compact {
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
}

/* ============================================ */
/* HEADER ACTIONS                               */
/* ============================================ */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

/* ============================================ */
/* ACTION BUTTONS                               */
/* ============================================ */
.action-buttons {
  display: flex;
  gap: 0.15rem;
}

.btn-icon-sm {
  background: transparent;
  border: none;
  padding: 0.15rem 0.3rem;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-icon-sm:hover { background: var(--background); }
.btn-icon-sm.danger { color: #ef4444; }
.btn-icon-sm.danger:hover { background: #fee2e2; }

/* ============================================ */
/* BUTTONS                                      */
/* ============================================ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
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
  box-shadow: 0 3px 10px rgba(249, 73, 8, 0.25);
}

.btn-primary:disabled {
  opacity: 0.5;
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
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--background);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ============================================ */
/* EMPTY STATE                                  */
/* ============================================ */
.empty-state {
  text-align: center;
  padding: 1.5rem 0.5rem;
  color: var(--text-secondary);
}

.empty-state .empty-icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.35rem;
}

.empty-state.small {
  padding: 0.35rem;
  font-size: 0.8rem;
}

.empty-state p {
  font-size: 0.85rem;
}

/* ============================================ */
/* MODALS                                       */
/* ============================================ */
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

.modal {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.25rem;
  max-width: 480px;
  width: 92%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg { max-width: 640px; }
.modal h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-body input,
.modal-body select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  width: 100%;
}

.modal-body input:focus,
.modal-body select:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.08);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.hint-text {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.stall-select-multiple {
  min-height: 60px;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */

/* Tablet */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .consolidated-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .inventory-edit-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Small Tablet / Large Phone */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-left h2 {
    font-size: 1.1rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  
  .stat-card {
    padding: 0.75rem;
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .stat-info .stat-value {
    font-size: 1rem;
  }
  
  .stat-info .stat-label {
    font-size: 0.6rem;
  }
  
  .tab-btn {
    padding: 0.35rem 0.7rem;
    font-size: 0.75rem;
  }
  
  .tab-label {
    font-size: 0.7rem;
  }
  
  .tab-icon {
    font-size: 0.85rem;
  }
  
  .tab-badge {
    min-width: 14px;
    line-height: 14px;
    font-size: 0.5rem;
  }
  
  .consolidated-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .consolidated-stat .stat-value {
    font-size: 1rem;
  }
  
  .consolidated-stat .stat-label {
    font-size: 0.6rem;
  }
  
  .chart-summary {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.35rem;
  }
  
  .chart-bars {
    height: 120px;
    gap: 0.25rem;
    padding-top: 30px;
  }
  
  .chart-bar {
    max-width: 28px;
  }
  
  .bar-value {
    font-size: 0.5rem;
    margin-top: -0.7rem;
  }
  
  .bar-label {
    font-size: 0.5rem;
  }
  
  .line-chart-container {
    height: 120px;
  }
  
  .data-table {
    font-size: 0.75rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.3rem 0.4rem;
  }
  
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: unset;
  }
  
  .filter-box {
    min-width: unset;
  }
  
  .filter-result {
    align-self: flex-start;
  }
  
  .inventory-edit-grid {
    grid-template-columns: 1fr;
  }
  
  .stall-inventory-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .inventory-edit-controls {
    flex-wrap: wrap;
  }
  
  .inventory-actions-bottom {
    flex-direction: column;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-controls {
    width: 100%;
    justify-content: flex-start;
  }
  
  .chart-navigation {
    flex-wrap: wrap;
  }
  
  .nav-label {
    min-width: 60px;
    font-size: 0.65rem;
  }
  
  .card-body.chart-fullscreen {
    padding: 0.75rem;
  }
  
  .modal {
    width: 95%;
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .period-selector-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
  
  .period-selector {
    justify-content: center;
  }
  
  .period-btn {
    font-size: 0.7rem;
    padding: 0.25rem 0.6rem;
  }
}

/* Phone */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .consolidated-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .chart-summary {
    grid-template-columns: 1fr 1fr;
  }
  
  .chart-bars {
    height: 90px;
    gap: 0.15rem;
    padding-top: 25px;
  }
  
  .chart-bar {
    max-width: 20px;
    border-radius: 2px 2px 0 0;
  }
  
  .bar-value {
    font-size: 0.4rem;
    margin-top: -0.6rem;
  }
  
  .bar-label {
    font-size: 0.45rem;
  }
  
  .line-chart-container {
    height: 90px;
  }
  
  .trend-line-container {
    height: 25px;
  }
  
  .data-table {
    font-size: 0.65rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.2rem 0.3rem;
  }
  
  .status-badge {
    font-size: 0.55rem;
    padding: 0.05rem 0.35rem;
  }
  
  .rank-badge {
    width: 16px;
    height: 16px;
    font-size: 0.5rem;
  }
  
  .performance-bar {
    height: 3px;
  }
  
  .performance-label {
    font-size: 0.55rem;
    min-width: 24px;
  }
  
  .tab-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }
  
  .tab-label {
    font-size: 0.6rem;
  }
  
  .tab-icon {
    font-size: 0.75rem;
  }
  
  .btn {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
  
  .btn-sm {
    font-size: 0.6rem;
    padding: 0.15rem 0.4rem;
  }
  
  .search-input {
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
  }
  
  .filter-select {
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
  }
  
  .filter-result {
    font-size: 0.65rem;
    padding: 0.1rem 0.4rem;
  }
  
  .card-header h3 {
    font-size: 0.8rem;
  }
  
  .period-btn {
    font-size: 0.65rem;
    padding: 0.2rem 0.5rem;
  }
}

/* Extra Small */
@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .consolidated-stats {
    grid-template-columns: 1fr;
  }
  
  .chart-summary {
    grid-template-columns: 1fr 1fr;
  }
  
  .header-left h2 {
    font-size: 0.95rem;
  }
  
  .header-left .subtitle {
    font-size: 0.7rem;
  }
  
  .tab-btn {
    padding: 0.2rem 0.35rem;
    font-size: 0.6rem;
  }
  
  .tab-label {
    font-size: 0.55rem;
  }
  
  .tab-icon {
    font-size: 0.65rem;
  }
}
</style>