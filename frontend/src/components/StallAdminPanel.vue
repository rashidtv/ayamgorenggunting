<template>
  <div class="sa-dashboard">
    
    <!-- ===== CONTROLS SECTION ===== -->
    <div class="controls-section">
      <div class="controls-row">
        <!-- Tab Dropdown -->
        <div class="tab-dropdown">
          <button class="dropdown-toggle" :class="{ open: dropdownOpen }" @click="toggleDropdown">
            <span class="dropdown-icon">{{ activeTabIcon }}</span>
            <span class="dropdown-label">{{ activeTabLabel }}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="dropdownOpen" class="dropdown-menu">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['dropdown-item', { active: activeTab === tab.id }]"
              @click="selectTab(tab.id)"
            >
              <span class="dropdown-item-icon">{{ tab.icon }}</span>
              <span class="dropdown-item-label">{{ tab.label }}</span>
              <span v-if="tab.id === 'inventory' && lowStock.length > 0" class="dropdown-badge">
                {{ lowStock.length }}
              </span>
            </button>
          </div>
        </div>

        <!-- Period Dropdown -->
        <div v-if="activeTab === 'dashboard'" class="period-dropdown-wrapper">
          <button class="dropdown-toggle" :class="{ open: periodDropdownOpen }" @click="togglePeriodDropdown">
            <span class="dropdown-icon">📅</span>
            <span class="dropdown-label">{{ getPeriodLabel() }}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="periodDropdownOpen" class="dropdown-menu period-menu">
            <button 
              v-for="p in periods" 
              :key="p.value"
              :class="['dropdown-item', { active: selectedPeriod === p.value }]"
              @click="selectPeriod(p.value)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="refreshAllData" class="header-action-btn" title="Refresh Data">
            <span class="action-icon">⟳</span>
            <span class="action-label">Refresh</span>
          </button>
          <button @click="exportCurrentTab" class="header-action-btn primary" :disabled="exporting">
            <span class="action-icon">{{ exporting ? '...' : '⬇' }}</span>
            <span class="action-label">Export</span>
          </button>
        </div>
      </div>
    </div>



    <!-- ============================================ -->
    <!-- TAB CONTENT                                 -->
    <!-- ============================================ -->
    <div class="tab-content">
      
      <!-- ===== DASHBOARD TAB ===== -->
      <div v-if="activeTab === 'dashboard'" class="tab-panel">
        
            <!-- ============================================ -->
    <!-- STATS CARDS                                  -->
    <!-- ============================================ -->
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color: #2563eb;">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <span class="stat-number">{{ stalls.length }}</span>
          <span class="stat-label">My Stalls</span>
        </div>
        <div class="stat-trend up">+12%</div>
      </div>
      <div class="stat-card" style="--stat-color: #7c3aed;">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <span class="stat-number">{{ users.length }}</span>
          <span class="stat-label">My Users</span>
        </div>
        <div class="stat-trend up">+8%</div>
      </div>
      <div class="stat-card clickable" style="--stat-color: #dc2626;" @click="switchTab('inventory')">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <span class="stat-number">{{ lowStock.length }}</span>
          <span class="stat-label">Low Stock Alerts</span>
        </div>
        <div class="stat-trend" :class="lowStock.length > 0 ? 'down' : 'up'">
          {{ lowStock.length > 0 ? '⚠️' : '✅' }}
        </div>
        <div class="stat-hover">Click to view →</div>
      </div>
    </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Revenue</div>
            <div class="kpi-value">{{ formatCurrency(consolidatedSales.totalRevenue || 0) }}</div>
            <div class="kpi-change" :class="getRevenueChange() >= 0 ? 'positive' : 'negative'">
              {{ getRevenueChange() >= 0 ? '↑' : '↓' }} {{ Math.abs(getRevenueChange()).toFixed(1) }}%
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Items Sold</div>
            <div class="kpi-value">{{ formatNumber(consolidatedSales.totalItems || 0) }}</div>
            <div class="kpi-change" :class="getItemsChange() >= 0 ? 'positive' : 'negative'">
              {{ getItemsChange() >= 0 ? '↑' : '↓' }} {{ Math.abs(getItemsChange()).toFixed(1) }}%
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Average per Stall</div>
            <div class="kpi-value">{{ formatCurrency(consolidatedSales.averagePerStall || 0) }}</div>
          </div>
          <div class="kpi-card highlight">
            <div class="kpi-label">🏆 Top Stall</div>
            <div class="kpi-value" style="font-size: 1.1rem;">{{ consolidatedSales.topStall || '-' }}</div>
            <div class="kpi-change" v-if="consolidatedSales.topRevenue">
              {{ formatCurrency(consolidatedSales.topRevenue || 0) }}
            </div>
          </div>
        </div>

        <!-- Professional Chart with ECharts -->
        <div class="chart-modern" :class="{ 'fullscreen': chartFullscreen }">
          <div class="chart-modern-header">
            <div class="chart-modern-title">
              <h3>Sales Overview</h3>
              <span class="chart-modern-sub">{{ getPeriodLabel() }} trend</span>
            </div>
            <div class="chart-modern-controls">
              <button @click="toggleChartFullscreen" class="chart-modern-fullscreen">
                {{ chartFullscreen ? '✕' : '⛶' }}
              </button>
            </div>
          </div>

          <div class="chart-modern-body">
            <!-- Stats Row -->
            <div class="chart-modern-stats" v-if="salesTrend.length > 0">
              <div class="chart-modern-stat">
                <span class="chart-modern-stat-label">Peak</span>
                <span class="chart-modern-stat-value">{{ formatCurrency(getPeakRevenue()) }}</span>
                <span class="chart-modern-stat-sub">{{ getPeakDay() }}</span>
              </div>
              <div class="chart-modern-stat">
                <span class="chart-modern-stat-label">Average</span>
                <span class="chart-modern-stat-value">{{ formatCurrency(getAverageRevenue()) }}</span>
              </div>
              <div class="chart-modern-stat">
                <span class="chart-modern-stat-label">Items</span>
                <span class="chart-modern-stat-value">{{ formatNumber(getTotalItems()) }}</span>
              </div>
              <div class="chart-modern-stat">
                <span class="chart-modern-stat-label">Trend</span>
                <span class="chart-modern-stat-value" :class="getTrendDirection()">
                  {{ getTrendDirection() === 'up' ? '↑' : getTrendDirection() === 'down' ? '↓' : '→' }}
                  {{ getTrendPercentage() }}%
                </span>
              </div>
            </div>

            <!-- ECharts Container -->
            <div class="chart-wrapper" ref="chartWrapper">
              <div v-if="salesTrend.length > 0" class="chart-container">
                <div ref="chartRef" class="echarts-container"></div>
              </div>
              <div v-else class="chart-modern-empty">
                <span>📊</span>
                <p>No sales data available for {{ getPeriodLabel() }}</p>
              </div>
            </div>

            <!-- Navigation -->
            <div v-if="salesTrend.length > chartWindow" class="chart-modern-nav">
              <button @click="navigateChart('prev')" class="chart-modern-nav-btn" :disabled="chartOffset <= 0">←</button>
              <span class="chart-modern-nav-label">
                {{ chartOffset + 1 }}–{{ Math.min(chartOffset + chartWindow, salesTrend.length) }} of {{ salesTrend.length }}
              </span>
              <button @click="navigateChart('next')" class="chart-modern-nav-btn" :disabled="chartOffset + chartWindow >= salesTrend.length">→</button>
              <button @click="resetChartNavigation" class="chart-modern-nav-btn reset" v-if="chartOffset > 0 || chartWindow < salesTrend.length">↺</button>
            </div>
          </div>
        </div>

        <!-- Stall Performance - Clickable -->
        <div class="card-modern">
          <div class="card-modern-header">
            <div class="card-modern-header">
  <div>
    <h3>🏆 Stall Performance</h3>
    <span class="card-subtitle">Ranked by revenue for {{ getPeriodLabel() }}</span>
  </div>
  <!-- ✅ REMOVED duplicate period-tag -->
</div>
          <div class="card-modern-body">
  <div v-if="stallPerformance.length === 0" class="empty-state-modern">
    <span>📊</span>
    <p>No sales data available for {{ getPeriodLabel() }}</p>
  </div>
  <div 
    v-for="(stall, index) in stallPerformance.slice(0, 5)" 
    :key="stall.id" 
    class="stall-rank-item clickable-item"
    @click="viewStallDetails(stall)"
  >
    <div class="stall-rank">
      <span class="stall-rank-number" :class="getRankClass(index)">
        {{ index + 1 }}
      </span>
      <span class="stall-rank-name">{{ stall.name }}</span>
    </div>
    <div class="stall-rank-bar">
      <div 
        class="stall-rank-fill" 
        :style="{ width: getStallBarWidth(stall.revenue) + '%' }"
        :class="getRankClass(index)"
      ></div>
    </div>
    <span class="stall-rank-revenue">{{ formatCurrency(stall.revenue || 0) }}</span>
    <!-- ✅ ADDED: Status column -->
    <span class="stall-rank-status">
      <span :class="['status-tag', stall.is_active ? 'active' : 'inactive']">
        {{ stall.is_active ? 'Active' : 'Inactive' }}
      </span>
    </span>
    <span class="stall-rank-click">👆 Click for details</span>
  </div>
</div>
        </div>

        <!-- Menu Performance - Clickable -->
        <div class="card-modern">
          <div class="card-modern-header">
            <div>
              <h3>🍗 Menu Performance</h3>
              <span class="card-subtitle">Top selling items for {{ getPeriodLabel() }}</span>
            </div>
          </div>
          <div class="card-modern-body">
            <div v-if="menuPerformance.length === 0" class="empty-state-modern">
              <span>🍗</span>
              <p>No sales data available for {{ getPeriodLabel() }}</p>
            </div>
            <div 
              v-for="(item, index) in menuPerformance.slice(0, 5)" 
              :key="item.name" 
              class="menu-rank-item clickable-item"
              @click="viewMenuItemDetails(item)"
            >
              <div class="menu-rank-info">
                <span class="menu-rank-number">{{ index + 1 }}</span>
                <span class="menu-rank-name">{{ item.name }}</span>
                <span class="menu-rank-qty">{{ item.quantity }} sold</span>
              </div>
              <div class="menu-rank-bar">
                <div 
                  class="menu-rank-fill" 
                  :style="{ width: getPerformancePercentage(item.quantity) + '%' }"
                ></div>
              </div>
              <span class="menu-rank-revenue">{{ formatCurrency(item.revenue || 0) }}</span>
              <span class="menu-rank-click">👆 Click for details</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== INVENTORY TAB ===== -->
      <div v-if="activeTab === 'inventory'" class="tab-panel">
        <div class="card-modern">
          <div class="card-modern-header">
            <div>
              <h3>📦 Inventory Management</h3>
              <span class="card-subtitle">{{ filteredInventoryStalls.length }} stalls</span>
            </div>
            <button @click="loadAllStallsInventory()" class="btn-modern secondary small">
              ⟳ Refresh
            </button>
          </div>
          <div class="card-modern-body">
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

            <div v-if="stalls.length === 0" class="empty-state-modern">
              <span>📦</span>
              <p>No stalls found. Contact your administrator.</p>
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

      <!-- ===== STALLS TAB - FULL CRUD ===== -->
      <div v-if="activeTab === 'stalls'" class="tab-panel">
        <div class="card-modern">
          <div class="card-modern-header">
            <div>
              <h3>🏪 Stall Management</h3>
              <span class="card-subtitle">{{ filteredStallsList.length }} stalls</span>
            </div>
            <button @click="openStallModal()" class="btn-modern primary">+ New Stall</button>
          </div>
          <div class="card-modern-body">
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

            <div v-if="filteredStallsList.length === 0" class="empty-state-modern">
              <span>🏪</span>
              <p>No stalls found</p>
            </div>

            <div v-for="(s, index) in filteredStallsList" :key="s.id" class="list-item">
              <div class="list-item-content">
                <span class="list-item-index">{{ index + 1 }}</span>
                <div class="list-item-info">
                  <span class="list-item-name">{{ s.name }}</span>
                  <span class="list-item-code">{{ s.code }}</span>
                </div>
                <span class="list-item-company">{{ s.company_name || '-' }}</span>
                <span class="list-item-users">{{ s.user_count || 0 }} users</span>
                <span :class="['status-tag', s.is_active ? 'active' : 'inactive']">
                  {{ s.is_active ? 'Active' : 'Inactive' }}
                </span>
                <div class="list-item-actions">
                  <button @click="openEditStallModal(s)" class="list-item-btn" title="Edit">✏️</button>
                  <button @click="toggleStallStatus(s)" class="list-item-btn" :title="s.is_active ? 'Deactivate' : 'Activate'">
                    {{ s.is_active ? '⏸️' : '▶️' }}
                  </button>
                  <button @click="deleteStall(s.id, s.name)" class="list-item-btn danger" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== USERS TAB ===== -->
      <div v-if="activeTab === 'users'" class="tab-panel">
        <div class="card-modern">
          <div class="card-modern-header">
            <div>
              <h3>👥 User Management</h3>
              <span class="card-subtitle">{{ filteredUsersList.length }} users</span>
            </div>
            <button @click="openUserModal()" class="btn-modern primary">+ New User</button>
          </div>
          <div class="card-modern-body">
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

            <div v-if="filteredUsersList.length === 0" class="empty-state-modern">
              <span>👥</span>
              <p>No users found</p>
            </div>

            <div v-for="(u, index) in filteredUsersList" :key="u.id" class="list-item">
              <div class="list-item-content">
                <span class="list-item-index">{{ index + 1 }}</span>
                <div class="list-item-info">
                  <span class="list-item-name">{{ u.username }}</span>
                  <span class="list-item-sub">{{ u.full_name || '-' }}</span>
                </div>
                <span class="role-tag">{{ u.role }}</span>
                <span class="list-item-stalls">{{ (u.assigned_stalls || []).map(s => s.name).join(', ') || '-' }}</span>
                <div class="list-item-actions">
                  <button @click="openEditUserModal(u)" class="list-item-btn" title="Edit">✏️</button>
                  <button @click="deleteUser(u.id, u.username)" class="list-item-btn danger" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MENU ASSIGNMENT TAB ===== -->
      <div v-if="activeTab === 'menu-assignment'" class="tab-panel">
        <div class="card-modern">
          <div class="card-modern-header">
            <div>
              <h3>📋 Menu Assignment</h3>
              <span class="card-subtitle">Assign menu items to stalls</span>
            </div>
            <button @click="loadMenuAssignments" class="btn-modern secondary small">
              ⟳ Refresh
            </button>
          </div>
          <div class="card-modern-body">
            <!-- Select Stall -->
            <div class="filter-bar">
              <div class="filter-search">
                <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">Select Stall</label>
                <select v-model="selectedAssignmentStall" class="filter-select" style="width: 100%;">
                  <option value="">-- Select a stall --</option>
                  <option v-for="stall in stalls" :key="stall.id" :value="stall.id">
                    {{ stall.name }} ({{ stall.code }})
                  </option>
                </select>
              </div>
            </div>

            <!-- Menu Assignment List -->
            <div v-if="!selectedAssignmentStall" class="empty-state-modern">
              <span>🏪</span>
              <p>Please select a stall to manage its menu</p>
            </div>

            <div v-else-if="loadingMenuAssignments" class="loading-state small">
              <div class="loading-spinner small"><div class="spinner-ring"></div></div>
              <p>Loading menu assignments...</p>
            </div>

            <div v-else class="menu-assignment-list">
              <div class="assignment-header">
                <span class="assignment-count">{{ filteredMenuItemsForAssignment.length }} menu items</span>
                <button @click="selectAllMenus" class="btn-modern secondary small">
                  ✅ Select All
                </button>
                <button @click="deselectAllMenus" class="btn-modern secondary small">
                  ❌ Deselect All
                </button>
              </div>

              <div v-if="filteredMenuItemsForAssignment.length === 0" class="empty-state-modern">
                <span>📋</span>
                <p>No menu items available. Please contact your administrator to create menu items.</p>
              </div>

              <div v-for="item in filteredMenuItemsForAssignment" :key="item.item_name" class="assignment-item">
                <div class="assignment-item-content">
                  <div class="assignment-item-info">
                    <div class="assignment-item-checkbox">
                      <input 
                        type="checkbox" 
                        :id="`menu-${item.item_name}`" 
                        v-model="menuAssignments[item.item_name]"
                        :disabled="savingAssignment"
                      />
                      <label :for="`menu-${item.item_name}`" class="assignment-item-label">
                        <span class="assignment-item-name">{{ item.item_name }}</span>
                        <span class="assignment-item-price">{{ formatCurrency(item.price) }}</span>
                        <span class="assignment-item-category">{{ item.category || 'Main' }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="selectedAssignmentStall" class="assignment-actions">
                <button @click="saveMenuAssignments" class="btn-modern primary" :disabled="savingAssignment">
                  {{ savingAssignment ? 'Saving...' : '💾 Save Assignments' }}
                </button>
                <button @click="resetMenuAssignments" class="btn-modern secondary">
                  ↩ Reset
                </button>
              </div>

              <div v-if="savedAssignmentMessage" class="assignment-message" :class="savedAssignmentType">
                {{ savedAssignmentMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STALL MODAL                                  -->
    <!-- ============================================ -->
    <div v-if="stallModal" class="modal-overlay" @click.self="stallModal=false">
      <div class="modal-modern">
        <div class="modal-modern-header">
          <h3>{{ editingStall ? 'Edit Stall' : 'New Stall' }}</h3>
          <button @click="stallModal=false" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <div class="modal-form-group">
            <label>Stall Name</label>
            <input v-model="stallForm.name" placeholder="Stall Name" />
          </div>
          <div class="modal-form-group">
            <label>Stall Code</label>
            <input v-model="stallForm.code" placeholder="Stall Code" />
          </div>
          <div class="modal-form-group">
            <label>Location</label>
            <input v-model="stallForm.location" placeholder="Location" />
          </div>
        </div>
        <div class="modal-modern-footer">
          <button @click="stallModal=false" class="btn-modern secondary">Cancel</button>
          <button @click="saveStall" class="btn-modern primary">{{ editingStall ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- USER MODAL                                   -->
    <!-- ============================================ -->
    <div v-if="userModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>{{ editingUser ? 'Edit User' : 'New User' }}</h3>
          <button @click="closeUserModal" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <div class="modal-form-row">
            <div class="modal-form-group">
              <label>Username</label>
              <input v-model="userForm.username" placeholder="Username" :disabled="editingUser" />
            </div>
            <div class="modal-form-group">
              <label>Full Name</label>
              <input v-model="userForm.full_name" placeholder="Full Name" />
            </div>
          </div>
          <div class="modal-form-row">
            <div class="modal-form-group">
              <label>Password</label>
              <input v-if="!editingUser" type="password" v-model="userForm.password" placeholder="Password" />
              <input v-else type="password" v-model="userForm.password" placeholder="Leave blank to keep" />
            </div>
            <div class="modal-form-group">
              <label>Role</label>
              <select v-model="userForm.role">
                <option value="stall_admin">Stall Admin</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
          </div>
          <div class="modal-form-group">
            <label>Assign Stalls:</label>
            <select multiple class="stall-select-multiple" v-model="userForm.stall_ids">
              <option v-for="s in stalls" :value="s.id">{{ s.name }}</option>
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
          </div>
        </div>
        <div class="modal-modern-footer">
          <button @click="closeUserModal" class="btn-modern secondary">Cancel</button>
          <button @click="saveUser" class="btn-modern primary">{{ editingUser ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- STALL DETAILS MODAL                         -->
    <!-- ============================================ -->
    <div v-if="stallDetailModal" class="modal-overlay" @click.self="closeStallDetailModal">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>🏪 {{ selectedStall?.name || 'Stall Details' }}</h3>
          <button @click="closeStallDetailModal" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Revenue</span>
              <span class="detail-value">{{ formatCurrency(selectedStall?.revenue || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Items Sold</span>
              <span class="detail-value">{{ selectedStall?.items || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Avg Transaction</span>
              <span class="detail-value">{{ formatCurrency(selectedStall?.avgTransaction || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span :class="['status-badge', getStallStatusClass(selectedStall)]">
                  {{ getStallStatus(selectedStall) }}
                </span>
              </span>
            </div>
          </div>
          <div class="detail-chart-container">
            <h4>Sales Trend</h4>
            <div ref="stallDetailChartRef" class="detail-chart"></div>
          </div>
        </div>
        <div class="modal-modern-footer">
          <button @click="closeStallDetailModal" class="btn-modern secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- MENU ITEM DETAILS MODAL                     -->
    <!-- ============================================ -->
    <div v-if="menuDetailModal" class="modal-overlay" @click.self="closeMenuDetailModal">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>🍗 {{ selectedMenuItem?.name || 'Menu Item Details' }}</h3>
          <button @click="closeMenuDetailModal" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Total Revenue</span>
              <span class="detail-value">{{ formatCurrency(selectedMenuItem?.revenue || 0) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Quantity Sold</span>
              <span class="detail-value">{{ selectedMenuItem?.quantity || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Average Price</span>
              <span class="detail-value">{{ formatCurrency((selectedMenuItem?.revenue || 0) / (selectedMenuItem?.quantity || 1)) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-modern-footer">
          <button @click="closeMenuDetailModal" class="btn-modern secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { 
  TitleComponent, 
  TooltipComponent, 
  GridComponent, 
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register ECharts components
use([
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  CanvasRenderer
])

const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'

export default {
  props: {
    token: { type: String, required: true },
    companyLogo: { type: String, default: null }
  },

  data() {
    return {
      // ===== TABS - NO MENU CRUD, NO REGISTRATIONS, NO COMPANIES =====
      activeTab: 'dashboard',
      tabs: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'stalls', label: 'Stalls', icon: '🏪' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'menu-assignment', label: 'Menu Assignment', icon: '📋' }
      ],
      
      // Chart settings
      chartFullscreen: false,
      chartOffset: 0,
      chartWindow: 7,
      chartInstance: null,
      isChartInitialized: false,
      
      // Data
      dropdownOpen: false,
      periodDropdownOpen: false,
      stalls: [],
      users: [],
      lowStock: [],
      menuItems: [],
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
      
      // Detail Modals
      stallDetailModal: false,
      selectedStall: null,
      menuDetailModal: false,
      selectedMenuItem: null,
      stallDetailChartInstance: null,
      
      // Inventory
      expandedInventoryStall: null,
      stallInventory: {},
      inventorySearch: '',
      inventoryFilter: 'all',
      
      // Stalls tab
      stallSearch: '',
      stallStatusFilter: 'all',
      
      // Users tab
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
      resizeObserver: null,

      // Menu Assignment
      selectedAssignmentStall: null,
      menuAssignments: {},
      originalMenuAssignments: {},
      loadingMenuAssignments: false,
      savingAssignment: false,
      savedAssignmentMessage: '',
      savedAssignmentType: 'success',
    }
  },

  computed: {
    lowStockCount() {
      return this.lowStock.length
    },
    chartVisibleData() {
      return this.salesTrend.slice(this.chartOffset, this.chartOffset + this.chartWindow)
    },
    filteredMenuItemsForAssignment() {
      return this.menuItems.sort((a, b) => a.item_name.localeCompare(b.item_name))
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
    // ✅ Only show stall_admin and cashier (hide super_admin and super_super_admin)
    if (user.role === 'super_admin' || user.role === 'super_super_admin') {
      return false;
    }
    
    const search = this.userSearch.toLowerCase();
    const matchesSearch = user.username.toLowerCase().includes(search) ||
                          (user.full_name && user.full_name.toLowerCase().includes(search));
    const matchesRole = this.userRoleFilter === 'all' || user.role === this.userRoleFilter;
    return matchesSearch && matchesRole;
  })
},
    activeTabLabel() {
      const tab = this.tabs.find(t => t.id === this.activeTab)
      return tab ? tab.label : 'Dashboard'
    },
    activeTabIcon() {
      const tab = this.tabs.find(t => t.id === this.activeTab)
      return tab ? tab.icon : '📊'
    }
  },

  mounted() {
    this.loadData()
    document.addEventListener('click', this.handleClickOutside)
  },

  watch: {
    salesTrend: {
      handler() {
        this.$nextTick(() => {
          this.initChart()
        })
      },
      deep: true
    },
    chartVisibleData: {
      handler() {
        this.updateChart()
      },
      deep: true
    },
    chartFullscreen(val) {
      this.$nextTick(() => {
        if (val) {
          setTimeout(() => {
            this.initChart()
          }, 100)
        } else {
          setTimeout(() => {
            this.initChart()
          }, 150)
        }
      })
    },
    selectedAssignmentStall: {
      handler(newStallId) {
        if (newStallId) {
          this.loadMenuAssignments()
        }
      }
    }
  },

  beforeUnmount() {
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
    if (this.stallDetailChartInstance) {
      this.stallDetailChartInstance.dispose()
      this.stallDetailChartInstance = null
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    document.removeEventListener('click', this.handleClickOutside)
    window.removeEventListener('resize', this.handleChartResize)
  },

  methods: {
    // =============================================
    // DROPDOWN METHODS
    // =============================================
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen
      if (this.dropdownOpen) this.periodDropdownOpen = false
    },
    togglePeriodDropdown() {
      this.periodDropdownOpen = !this.periodDropdownOpen
      if (this.periodDropdownOpen) this.dropdownOpen = false
    },
    selectTab(tabId) {
      this.activeTab = tabId
      this.dropdownOpen = false
      this.switchTab(tabId)
    },
    selectPeriod(value) {
      this.selectedPeriod = value
      this.periodDropdownOpen = false
      this.refreshAllData()
    },
    handleClickOutside(event) {
      const container = this.$el
      if (container && !container.contains(event.target)) {
        this.dropdownOpen = false
        this.periodDropdownOpen = false
      }
    },

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
    formatNumber(value) {
      const num = Number(value) || 0
      const rounded = Math.round(num)
      return new Intl.NumberFormat('en-MY').format(rounded)
    },
    formatShortDate(dateStr) {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric' })
    },
    formatFullDate(dateStr) {
      if (!dateStr) return ''
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
      return 'pieces'
    },

    // =============================================
    // STALL DETAILS
    // =============================================
    viewStallDetails(stall) {
  // ✅ Use the actual stall data passed from the performance list
  this.selectedStall = stall
  this.stallDetailModal = true
  
  // ✅ Store the stall ID for chart data
  this.selectedStallId = stall.id
  
  this.$nextTick(() => {
    this.initStallDetailChart()
  })
},,
    closeStallDetailModal() {
      this.stallDetailModal = false
      this.selectedStall = null
      if (this.stallDetailChartInstance) {
        this.stallDetailChartInstance.dispose()
        this.stallDetailChartInstance = null
      }
    },
    initStallDetailChart() {
  if (!this.$refs.stallDetailChartRef) return
  
  if (this.stallDetailChartInstance) {
    this.stallDetailChartInstance.dispose()
    this.stallDetailChartInstance = null
  }
  
  this.stallDetailChartInstance = echarts.init(this.$refs.stallDetailChartRef)
  
  // ✅ Get sales data for this specific stall from the API
  const stallId = this.selectedStall?.id
  
  if (!stallId) {
    console.warn('No stall ID found for detail chart')
    return
  }
  
  // ✅ Fetch actual data for this stall
  axios.get(`${API_BASE}/sales-analytics?days=7&stallId=${stallId}`, {
    headers: { Authorization: `Bearer ${this.token}` }
  })
  .then(response => {
    const data = response.data || {}
    const salesData = data.dailySales || []
    
    const days = salesData.map(d => this.formatShortDate(d.date))
    const revenues = salesData.map(d => d.revenue || 0)
    
    const finalDays = days.length > 0 ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const finalRevenues = revenues.length > 0 ? revenues : Array.from({length: 7}, () => 0)
    
    const option = {
      tooltip: { trigger: 'axis' },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: finalDays,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { 
          color: '#94a3b8', 
          fontSize: 11,
          formatter: (value) => 'RM' + value
        }
      },
      series: [{
        type: 'bar',
        data: finalRevenues,
        barWidth: '40%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#F94908' },
              { offset: 1, color: '#fa6a2e' }
            ]
          }
        }
      }]
    }
    
    this.stallDetailChartInstance.setOption(option)
    this.stallDetailChartInstance.resize()
  })
  .catch(err => {
    console.error('Failed to load stall detail chart data:', err)
  })
},
    
    // =============================================
    // MENU ITEM DETAILS
    // =============================================
    viewMenuItemDetails(item) {
      this.selectedMenuItem = item
      this.menuDetailModal = true
    },
    closeMenuDetailModal() {
      this.menuDetailModal = false
      this.selectedMenuItem = null
    },
    
    // =============================================
    // HELPER: Get today's date in Malaysia timezone
    // =============================================
    getTodayInMalaysia() {
      const now = new Date()
      const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
      const today = new Date(malaysiaTime)
      today.setHours(0, 0, 0, 0)
      return today
    },
    
    // =============================================
    // ECHARTS - Professional Chart
    // =============================================
    initChart() {
      if (!this.$refs.chartRef) return
      
      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }
      
      this.chartInstance = echarts.init(this.$refs.chartRef)
      this.isChartInitialized = true
      
      this.updateChart()
      
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
      }
      
      this.resizeObserver = new ResizeObserver(() => {
        this.handleChartResize()
      })
      this.resizeObserver.observe(this.$refs.chartRef)
      
      window.removeEventListener('resize', this.handleChartResize)
      window.addEventListener('resize', this.handleChartResize)
    },
    
    updateChart() {
      if (!this.chartInstance) return
      
      const data = this.chartVisibleData
      if (data.length === 0) {
        const option = {
          title: {
            text: `No sales data for ${this.getPeriodLabel()}`,
            left: 'center',
            top: 'center',
            textStyle: {
              color: '#94a3b8',
              fontSize: 14,
              fontWeight: 400
            }
          }
        }
        this.chartInstance.setOption(option, true)
        return
      }
      
      const dates = data.map(d => this.formatShortDate(d.date))
      const revenues = data.map(d => d.revenue || 0)
      
      const chartWidth = this.$refs.chartRef?.clientWidth || 0
      const labelInterval = chartWidth < 400 && dates.length > 7 ? Math.floor(dates.length / 6) : 0
      
      const option = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: { color: '#1e293b', fontSize: 13 },
          formatter: function(params) {
            const index = params[0]?.dataIndex || 0
            const revenue = data[index]?.revenue || 0
            const itemsCount = data[index]?.items || 0
            return `
              <div style="font-weight:600;margin-bottom:4px;">${data[index]?.label || ''}</div>
              <div style="color:#F94908;font-size:16px;font-weight:700;">${new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(revenue)}</div>
              <div style="color:#64748b;font-size:12px;">${itemsCount} items sold</div>
            `
          }
        },
        grid: {
          left: chartWidth < 400 ? '5%' : '3%',
          right: chartWidth < 400 ? '5%' : '4%',
          bottom: '12%',
          top: '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisLabel: {
            color: '#94a3b8',
            fontSize: chartWidth < 400 ? 9 : 11,
            fontWeight: 500,
            interval: labelInterval,
            rotate: chartWidth < 400 ? 30 : 0,
            margin: 12,
            showMaxLabel: true,
            showMinLabel: true
          },
          axisTick: { show: false },
          splitLine: { show: false }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
          axisLabel: {
            color: '#94a3b8',
            fontSize: chartWidth < 400 ? 9 : 11,
            formatter: function(value) {
              if (value >= 1000) return 'RM' + (value / 1000).toFixed(1) + 'k'
              return 'RM' + value
            }
          },
          name: chartWidth > 500 ? 'Revenue (RM)' : '',
          nameTextStyle: { color: '#94a3b8', fontSize: chartWidth < 400 ? 9 : 11 }
        },
        series: [
          {
            name: 'Revenue',
            type: 'bar',
            data: revenues,
            barWidth: chartWidth < 400 ? '35%' : '55%',
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#F94908' },
                  { offset: 1, color: '#fa6a2e' }
                ]
              }
            },
            emphasis: { itemStyle: { color: '#d63d07' } }
          },
          {
            name: 'Trend Line',
            type: 'line',
            data: revenues,
            smooth: true,
            lineStyle: { color: '#F94908', width: 2, type: 'solid' },
            symbol: 'circle',
            symbolSize: chartWidth < 400 ? 4 : 6,
            itemStyle: { color: '#F94908', borderColor: '#ffffff', borderWidth: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(249, 73, 8, 0.15)' },
                  { offset: 1, color: 'rgba(249, 73, 8, 0.01)' }
                ]
              }
            },
            z: 10
          }
        ]
      }
      
      this.chartInstance.setOption(option, true)
    },
    
    handleChartResize() {
      if (this.chartInstance) {
        this.chartInstance.resize()
        this.updateChart()
      }
      if (this.stallDetailChartInstance) {
        this.stallDetailChartInstance.resize()
      }
    },
    
    // =============================================
    // CHART STATS
    // =============================================
    getPeakRevenue() {
      if (this.salesTrend.length === 0) return 0
      return Math.max(...this.salesTrend.map(d => d.revenue || 0))
    },
    getPeakDay() {
      if (this.salesTrend.length === 0) return ''
      const max = Math.max(...this.salesTrend.map(d => d.revenue || 0))
      const day = this.salesTrend.find(d => d.revenue === max)
      return day ? this.formatShortDate(day.date) : ''
    },
    getAverageRevenue() {
      if (this.salesTrend.length === 0) return 0
      const total = this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0)
      return total / this.salesTrend.length
    },
    getTotalItems() {
      return this.salesTrend.reduce((sum, d) => {
        const items = parseInt(d.items) || 0
        return sum + items
      }, 0)
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
      if (this.salesTrend.length < 2) return 0
      const first = this.salesTrend[0]?.revenue || 0
      const last = this.salesTrend[this.salesTrend.length - 1]?.revenue || 0
      if (first === 0) return 0
      return ((last - first) / first * 100)
    },
    getItemsChange() {
      if (this.salesTrend.length < 2) return 0
      const first = this.salesTrend[0]?.items || 0
      const last = this.salesTrend[this.salesTrend.length - 1]?.items || 0
      if (first === 0) return 0
      return ((last - first) / first * 100)
    },
    
    // =============================================
    // CHART NAVIGATION
    // =============================================
    navigateChart(direction) {
      if (direction === 'prev' && this.chartOffset > 0) {
        this.chartOffset = Math.max(0, this.chartOffset - this.chartWindow)
      } else if (direction === 'next' && this.chartOffset + this.chartWindow < this.salesTrend.length) {
        this.chartOffset = Math.min(
          this.salesTrend.length - this.chartWindow,
          this.chartOffset + this.chartWindow
        )
      }
      this.updateChart()
    },
    resetChartNavigation() {
      this.chartOffset = 0
      this.chartWindow = Math.min(7, this.salesTrend.length)
      this.updateChart()
    },
    toggleChartFullscreen() {
      this.chartFullscreen = !this.chartFullscreen
      
      if (this.chartFullscreen) {
        document.body.style.overflow = 'hidden'
        const backdrop = document.createElement('div')
        backdrop.id = 'fullscreen-backdrop'
        backdrop.style.cssText = `
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: var(--surface);
          z-index: 9998;
        `
        document.body.appendChild(backdrop)
        setTimeout(() => {
          this.initChart()
        }, 100)
      } else {
        document.body.style.overflow = ''
        const backdrop = document.getElementById('fullscreen-backdrop')
        if (backdrop) backdrop.remove()
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
        setTimeout(() => {
          this.initChart()
        }, 150)
      }
    },
    
    // =============================================
    // MENU ASSIGNMENT METHODS
    // =============================================
    async loadMenuAssignments() {
  if (!this.selectedAssignmentStall) return
  
  this.loadingMenuAssignments = true
  this.savedAssignmentMessage = ''
  
  try {
    // Load all menu items
    await this.loadMenuItems()
    
    // Load current assignments for the selected stall
    const res = await axios.get(`${API_BASE}/menu/assignments/${this.selectedAssignmentStall}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    })
    
    // ✅ Build assignment map - only selected items should be true
    const assignedItems = res.data || []
    console.log('📝 Currently assigned items:', assignedItems)
    
    this.menuAssignments = {}
    this.menuItems.forEach(item => {
      this.menuAssignments[item.item_name] = assignedItems.includes(item.item_name)
    })
    
    console.log('📝 Menu assignments map:', this.menuAssignments)
    
    // Save original state for reset
    this.originalMenuAssignments = { ...this.menuAssignments }
    
  } catch (err) {
    console.error('Failed to load menu assignments:', err)
    this.$emit('show-notification', 'Failed to load menu assignments', 'error')
  } finally {
    this.loadingMenuAssignments = false
  }
},

    async saveMenuAssignments() {
  if (!this.selectedAssignmentStall) return
  
  this.savingAssignment = true
  this.savedAssignmentMessage = ''
  
  try {
    // ✅ FIX: Only get selected items (where value is true)
    const selectedItems = Object.keys(this.menuAssignments).filter(key => this.menuAssignments[key] === true)
    
    console.log('📝 Saving assignments for stall:', this.selectedAssignmentStall)
    console.log('📝 Selected items:', selectedItems)
    
    await axios.post(`${API_BASE}/menu/assignments`, {
      stallId: this.selectedAssignmentStall,
      items: selectedItems
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    })
    
    // Save original state
    this.originalMenuAssignments = { ...this.menuAssignments }
    
    this.savedAssignmentMessage = `✅ Menu assignments saved successfully! (${selectedItems.length} items)`
    this.savedAssignmentType = 'success'
    this.$emit('show-notification', 'Menu assignments saved!', 'success')
    
  } catch (err) {
    console.error('Failed to save menu assignments:', err)
    this.savedAssignmentMessage = '❌ Failed to save menu assignments'
    this.savedAssignmentType = 'error'
    this.$emit('show-notification', 'Failed to save menu assignments', 'error')
  } finally {
    this.savingAssignment = false
  }
},

    resetMenuAssignments() {
      if (this.selectedAssignmentStall) {
        this.menuAssignments = { ...this.originalMenuAssignments }
        this.savedAssignmentMessage = '↩ Reset to saved state'
        this.savedAssignmentType = 'info'
        setTimeout(() => {
          this.savedAssignmentMessage = ''
        }, 3000)
      }
    },

    selectAllMenus() {
      this.menuItems.forEach(item => {
        this.menuAssignments[item.item_name] = true
      })
    },

    deselectAllMenus() {
      this.menuItems.forEach(item => {
        this.menuAssignments[item.item_name] = false
      })
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
          }, { headers: { Authorization: `Bearer ${this.token}` } });
          this.$emit('show-notification', 'Stall updated', 'success');
        } else {
          await axios.post(`${API_BASE}/companies/1/stalls`, {
            name: this.stallForm.name,
            code: this.stallForm.code,
            location: this.stallForm.location
          }, { headers: { Authorization: `Bearer ${this.token}` } });
          this.$emit('show-notification', 'Stall created', 'success');
        }
        this.stallModal = false;
        this.loadStalls();
        await this.loadAllStallsInventory();
      } catch (err) {
        console.error('Save stall error:', err);
        this.$emit('show-notification', err.response?.data?.error || 'Operation failed', 'error');
      }
    },
    async toggleStallStatus(stall) {
      try {
        await axios.put(`${API_BASE}/stalls/${stall.id}/toggle`, {}, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.loadStalls();
        this.$emit('show-notification', `Stall ${stall.is_active ? 'deactivated' : 'activated'}`, 'success');
      } catch (err) {
        this.$emit('show-notification', 'Failed to update stall', 'error');
      }
    },
    async deleteStall(stallId, stallName) {
      if (confirm(`Delete stall "${stallName}"?`)) {
        try {
          await axios.delete(`${API_BASE}/stalls/${stallId}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          this.loadStalls();
          this.$emit('show-notification', 'Stall deleted', 'success');
        } catch (err) {
          this.$emit('show-notification', 'Failed to delete stall', 'error');
        }
      }
    },
    
    // =============================================
    // STALL RANKING
    // =============================================
    getRankClass(index) {
      if (index === 0) return 'gold'
      if (index === 1) return 'silver'
      if (index === 2) return 'bronze'
      return ''
    },
    getStallStatus(stall) {
      if (!stall || !stall.revenue || stall.revenue === 0) return 'No Sales'
      if (stall.revenue > 1000) return 'Excellent'
      if (stall.revenue > 500) return 'Good'
      if (stall.revenue > 100) return 'Average'
      return 'Poor'
    },
    getStallStatusClass(stall) {
      if (!stall || !stall.revenue || stall.revenue === 0) return 'no-sales'
      if (stall.revenue > 1000) return 'excellent'
      if (stall.revenue > 500) return 'good'
      if (stall.revenue > 100) return 'average'
      return 'poor'
    },
    getStallBarWidth(revenue) {
      const max = Math.max(...this.stallPerformance.map(s => s.revenue || 0), 1)
      return Math.min((revenue / max) * 100, 100)
    },
    getPerformancePercentage(quantity) {
      const max = Math.max(...this.menuPerformance.map(p => p.quantity), 1)
      return Math.min((quantity / max) * 100, 100)
    },
    
    // =============================================
    // TAB MANAGEMENT
    // =============================================
    switchTab(tabId) {
      this.activeTab = tabId
      if (tabId === 'inventory' && this.lowStock.length > 0) {
        this.inventoryFilter = 'low'
      }
      if (tabId === 'inventory') {
        this.$nextTick(() => {
          document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth' })
        })
      }
      if (tabId === 'dashboard') {
        this.$nextTick(() => {
          setTimeout(() => {
            this.initChart()
          }, 100)
        })
      }
    },
    
    // =============================================
    // DATA LOADING
    // =============================================
    async refreshAllData() {
      await this.loadData()
    },
    async loadData() {
  try {
    // ✅ Load all data in parallel
    await Promise.all([
      this.loadStalls(),
      this.loadUsers(),
      this.loadLowStock(),
      this.loadSalesAnalytics(),  // This internally calls loadMenuPerformance
      this.loadStallPerformance(),
      this.loadMenuItems()
    ])
    // ✅ loadMenuPerformance is already called inside loadSalesAnalytics
    // No need to call it again here
    
    await this.loadAllStallsInventory()
    this.resetChartNavigation()
    this.$emit('show-notification', 'Data refreshed', 'success')
  } catch (err) {
    console.error('Load data error:', err)
    this.$emit('show-notification', err.message, 'error')
  }
},
    async loadStalls() {
      try {
        const res = await axios.get(`${API_BASE}/stalls/all`, { 
          headers: { Authorization: `Bearer ${this.token}` } 
        })
        this.stalls = res.data.map(stall => ({
          ...stall,
          company_name: stall.company_name || 'N/A',
          user_count: stall.user_count || 0
        }))
        console.log('✅ Stalls loaded:', this.stalls.length)
      } catch (err) {
        console.error('Failed to load stalls:', err)
        this.stalls = []
      }
    },
    async loadUsers() {
      try {
        const res = await axios.get(`${API_BASE}/users/all`, { 
          headers: { Authorization: `Bearer ${this.token}` } 
        })
        this.users = res.data.filter(user => user.role !== 'super_super_admin').map(user => ({
          ...user,
          company_name: user.company_name || 'N/A',
          assigned_stalls: user.assigned_stalls || []
        }))
        console.log('✅ Users loaded:', this.users.length)
      } catch (err) {
        console.error('Failed to load users:', err)
        this.users = []
      }
    },
    async loadLowStock() {
      const res = await axios.get(`${API_BASE}/companies/1/low-stock`, { 
        headers: { Authorization: `Bearer ${this.token}` } 
      })
      this.lowStock = res.data
    },


async loadSalesAnalytics() {
  this.productSales = {}
  
  const days = this.selectedPeriod === 'today' ? 0 :
               this.selectedPeriod === 'week' ? 7 :
               this.selectedPeriod === 'month' ? 30 :
               this.selectedPeriod === 'quarter' ? 90 : 365
  
  const apiDays = this.selectedPeriod === 'today' ? 1 : days
  
  try {
    console.log('📊 Fetching sales analytics for ALL assigned stalls, period:', this.selectedPeriod)
    
    const res = await axios.get(`${API_BASE}/sales-analytics?days=${apiDays}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    })
    const data = res.data || {}
    
    // ✅ Debug: log what the backend returned
    console.log('📊 Backend productSales:', Object.keys(data.productSales || {}).length)
    
    let dailySales = (data.dailySales || []).map(day => ({
      ...day,
      items: parseInt(day.items) || 0,
      revenue: parseFloat(day.revenue) || 0
    }))
    
    if (this.selectedPeriod === 'today') {
      const today = this.getTodayInMalaysia()
      dailySales = dailySales.filter(day => {
        const dayDate = new Date(day.date)
        dayDate.setHours(0, 0, 0, 0)
        return dayDate.getTime() === today.getTime()
      })
    }
    
    this.salesTrend = dailySales
    
    const totalRevenue = dailySales.reduce((sum, d) => sum + d.revenue, 0)
    const totalItems = dailySales.reduce((sum, d) => sum + d.items, 0)
    
    this.consolidatedSales.totalItems = totalItems
    this.consolidatedSales.totalRevenue = totalRevenue
    this.consolidatedSales.averagePerStall = this.stalls.length > 0 ? 
      totalRevenue / this.stalls.length : 0
    
    this.consolidatedSales.topStall = data.topStall || '-'
    this.consolidatedSales.topRevenue = parseFloat(data.topRevenue) || 0
    
    this.productSales = data.productSales || {}
    
    await this.loadMenuPerformance()
  } catch (err) {
    console.error('Failed to load sales analytics:', err)
    this.salesTrend = []
    this.consolidatedSales.totalItems = 0
    this.consolidatedSales.totalRevenue = 0
    this.consolidatedSales.topStall = '-'
    this.consolidatedSales.topRevenue = 0
    this.productSales = {}
  }
},

async loadStallPerformance() {
  const days = this.selectedPeriod === 'today' ? 0 :
               this.selectedPeriod === 'week' ? 7 :
               this.selectedPeriod === 'month' ? 30 :
               this.selectedPeriod === 'quarter' ? 90 : 365
  
  const apiDays = this.selectedPeriod === 'today' ? 1 : days
  
  try {
    // ✅ Get all stall IDs from multiple sources
    let stallIds = []
    
    // 1. Try from authStore
    if (this.authStore?.user?.assigned_stalls?.length > 0) {
      stallIds = this.authStore.user.assigned_stalls.map(s => s.id)
    }
    // 2. Try from stalls array (already loaded)
    else if (this.stalls?.length > 0) {
      stallIds = this.stalls.map(s => s.id)
    }
    // 3. Try from localStorage
    else {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          if (user?.assigned_stalls?.length > 0) {
            stallIds = user.assigned_stalls.map(s => s.id)
          }
        } catch (e) {}
      }
    }
    
    if (!stallIds || stallIds.length === 0) {
      console.warn('⚠️ No stall IDs found for stall performance')
      this.stallPerformance = []
      return
    }
    
    console.log('📊 Fetching stall performance for stalls:', stallIds)
    
    const res = await axios.get(`${API_BASE}/stall-performance?days=${apiDays}&stallIds=${stallIds.join(',')}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    })
    
    let stallData = res.data || []
    
    if (!Array.isArray(stallData)) {
      stallData = [stallData]
    }
    
    if (this.selectedPeriod === 'today') {
      const today = this.getTodayInMalaysia()
      const hasTodaySales = this.salesTrend.some(day => {
        const dayDate = new Date(day.date)
        dayDate.setHours(0, 0, 0, 0)
        return dayDate.getTime() === today.getTime()
      })
      if (!hasTodaySales) {
        stallData = []
      }
    }
    
    this.stallPerformance = stallData
  } catch (err) {
    console.error('Failed to load stall performance:', err)
    this.stallPerformance = []
  }
},


async loadMenuPerformance() {
  try {
    const productSales = this.productSales || {}
    
    console.log('📊 productSales keys:', Object.keys(productSales).length)
    
    // ✅ Filter items with actual sales
    const filteredItems = Object.keys(productSales)
      .filter(name => {
        const item = productSales[name]
        const quantity = parseInt(item.quantity) || 0
        const revenue = parseFloat(item.revenue) || 0
        return quantity > 0 && revenue > 0
      })
      .map(name => ({
        name: name,
        quantity: parseInt(productSales[name].quantity) || 0,
        revenue: parseFloat(productSales[name].revenue) || 0
      }))
      .sort((a, b) => b.quantity - a.quantity)
    
    // ✅ If we have filtered items, use them
    if (filteredItems.length > 0) {
      this.menuPerformance = filteredItems
      console.log('📊 Menu performance (filtered):', this.menuPerformance.length, 'items')
      return
    }
    
    // ✅ If productSales exists but all items have zero sales, show empty
    if (Object.keys(productSales).length > 0) {
      console.log('📊 productSales exists but all items have zero sales')
      this.menuPerformance = []
      return
    }
    
    // ✅ Fallback to API with proper filtering
    const days = this.selectedPeriod === 'today' ? 1 :
                 this.selectedPeriod === 'week' ? 7 :
                 this.selectedPeriod === 'month' ? 30 :
                 this.selectedPeriod === 'quarter' ? 90 : 365
    
    console.log('📊 Fetching menu performance from API, days:', days)
    
    const res = await axios.get(`${API_BASE}/menu-performance?days=${days}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    })
    
    // ✅ Filter API results too
    this.menuPerformance = (res.data || [])
      .filter(item => {
        const quantity = parseInt(item.quantity) || 0
        const revenue = parseFloat(item.revenue) || 0
        return quantity > 0 && revenue > 0
      })
      .map(item => ({
        name: item.item_name,
        quantity: parseInt(item.quantity) || 0,
        revenue: parseFloat(item.revenue) || 0
      }))
      .sort((a, b) => b.quantity - a.quantity)
    
    console.log('📊 Menu performance from API (filtered):', this.menuPerformance.length, 'items')
    
  } catch (err) {
    console.error('Failed to load menu performance:', err)
    this.menuPerformance = []
  }
},
    
    // =============================================
    // MENU ITEMS (For Assignment)
    // =============================================
    async loadMenuItems() {
      try {
        const res = await axios.get(`${API_BASE}/menu`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.menuItems = res.data || []
      } catch (err) {
        console.error('Failed to load menu items:', err)
        this.menuItems = []
      }
    },
    
    // =============================================
    // INVENTORY METHODS
    // =============================================
    async initializeStallInventory(stallId) {
      try {
        const checkRes = await axios.get(`${API_BASE}/inventory?stallId=${stallId}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        
        const chickenExists = checkRes.data.some(item => item.material_name === 'Chicken');
        
        if (!chickenExists) {
          await axios.post(`${API_BASE}/inventory/update`, {
            stallId: stallId,
            materialName: 'Chicken',
            newLevel: 100,
            alertLevel: 10
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          console.log('✅ Inventory initialized for stall', stallId);
        }
      } catch (err) {
        console.error('Failed to initialize inventory:', err);
      }
    },
    
    async loadAllStallsInventory() {
      for (const stall of this.stalls) {
        try {
          const res = await axios.get(`${API_BASE}/inventory?stallId=${stall.id}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          if (res.data.length === 0) {
            await this.initializeStallInventory(stall.id);
            const res2 = await axios.get(`${API_BASE}/inventory?stallId=${stall.id}`, {
              headers: { Authorization: `Bearer ${this.token}` }
            });
            this.stallInventory[stall.id] = res2.data.map(item => ({
              ...item,
              newLevel: item.current_level
            }));
          } else {
            this.stallInventory[stall.id] = res.data.map(item => ({
              ...item,
              newLevel: item.current_level
            }));
          }
        } catch (err) {
          console.error(`Load inventory for stall ${stall.id} error:`, err);
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
          { material_name: 'Chicken', current_level: '?', alert_level: 10 }
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
          this.$emit('show-notification', 'User updated', 'success')
        } else {
          if (!this.userForm.password || this.userForm.password.trim() === '') {
            this.$emit('show-notification', 'Password is required', 'error')
            return
          }
          payload.username = this.userForm.username
          payload.password = this.userForm.password
          await axios.post(`${API_BASE}/companies/1/users`, payload, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'User created', 'success')
        }
        this.closeUserModal()
        this.loadUsers()
      } catch (err) {
        this.$emit('show-notification', err.response?.data?.error || 'Operation failed', 'error')
      }
    },
    async deleteUser(userId, username) {
      if (confirm(`Delete user "${username}"?`)) {
        try {
          await axios.delete(`${API_BASE}/users/${userId}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.loadUsers()
          this.$emit('show-notification', 'User deleted', 'success')
        } catch (err) {
          this.$emit('show-notification', 'Failed to delete user', 'error')
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
        this.$emit('show-notification', 'Generating Excel...', 'info')
        const ExcelJS = await import('exceljs')
        const { saveAs } = await import('file-saver')
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Chickory Hub'
        
        let sheet, fileName
        if (this.activeTab === 'dashboard') {
          sheet = workbook.addWorksheet('Dashboard')
          sheet.addRow(['📊 Chickory Hub Dashboard', ''])
          sheet.addRow(['Period', this.getPeriodLabel()])
          sheet.addRow(['Total Revenue', this.formatCurrency(this.consolidatedSales.totalRevenue || 0)])
          sheet.addRow(['Total Items Sold', this.formatNumber(this.consolidatedSales.totalItems || 0)])
          sheet.addRow(['Average per Stall', this.formatCurrency(this.consolidatedSales.averagePerStall || 0)])
          sheet.addRow(['Top Stall', this.consolidatedSales.topStall || '-'])
          sheet.addRow([])
          sheet.addRow(['Date', 'Revenue (RM)', 'Items Sold'])
          for (const day of this.salesTrend) {
            sheet.addRow([this.formatShortDate(day.date), day.revenue || 0, day.items || 0])
          }
          fileName = `Chickory_Dashboard_${this.getPeriodLabel()}_${new Date().toISOString().split('T')[0]}.xlsx`
        } else if (this.activeTab === 'inventory') {
          sheet = workbook.addWorksheet('Inventory')
          sheet.addRow(['Stall', 'Material', 'Level', 'Alert', 'Status'])
          for (const stall of this.filteredInventoryStalls) {
            for (const item of this.getStallInventory(stall.id)) {
              sheet.addRow([
                stall.name,
                item.material_name,
                `${item.current_level}${this.getUnit(item.material_name)}`,
                `${item.alert_level}${this.getUnit(item.material_name)}`,
                item.current_level <= item.alert_level ? 'LOW' : 'OK'
              ])
            }
          }
          fileName = `Chickory_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`
        } else if (this.activeTab === 'stalls') {
          sheet = workbook.addWorksheet('Stalls')
          sheet.addRow(['Name', 'Code', 'Company', 'Users', 'Status'])
          for (const stall of this.filteredStallsList) {
            sheet.addRow([
              stall.name,
              stall.code,
              stall.company_name || '-',
              stall.user_count || 0,
              stall.is_active ? 'Active' : 'Inactive'
            ])
          }
          fileName = `Chickory_Stalls_${new Date().toISOString().split('T')[0]}.xlsx`
        } else if (this.activeTab === 'menu-assignment') {
          sheet = workbook.addWorksheet('Menu Assignment')
          sheet.addRow(['📋 Menu Assignment', ''])
          sheet.addRow(['Stall:', this.stalls.find(s => s.id === this.selectedAssignmentStall)?.name || 'No stall selected'])
          sheet.addRow([])
          sheet.addRow(['Menu Item', 'Assigned'])
          for (const item of this.filteredMenuItemsForAssignment) {
            sheet.addRow([item.item_name, this.menuAssignments[item.item_name] ? '✅ Yes' : '❌ No'])
          }
          fileName = `Chickory_Menu_Assignment_${new Date().toISOString().split('T')[0]}.xlsx`
        } else {
          sheet = workbook.addWorksheet('Users')
          sheet.addRow(['Username', 'Role', 'Stalls'])
          for (const user of this.filteredUsersList) {
            sheet.addRow([
              user.username,
              user.role,
              (user.assigned_stalls || []).map(s => s.name).join(', ') || '-'
            ])
          }
          fileName = `Chickory_Users_${new Date().toISOString().split('T')[0]}.xlsx`
        }
        
        sheet.columns.forEach(col => { col.width = Math.max(col.width || 0, 20) })
        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName)
        this.$emit('show-notification', 'Excel downloaded!', 'success')
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
.sa-dashboard {
  --primary: #F94908;
  --primary-light: #fa6a2e;
  --primary-dark: #d63d07;
  --bg: var(--background);
  --surface: var(--surface);
  --text: var(--text);
  --text-secondary: var(--text-secondary);
  --text-tertiary: var(--text-tertiary);
  --border: var(--border);
  --shadow: 0 2px 8px rgba(0,0,0,0.06);
  --radius: 12px;
  --radius-sm: 8px;
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============================================ */
/* CONTROLS SECTION - BELOW BANNER              */
/* ============================================ */
.controls-section {
  margin-bottom: 1.25rem;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: var(--background);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

/* ============================================ */
/* DROPDOWNS - WHITE BACKGROUND                 */
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

/* Dropdown Toggle - White background */
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

/* Dropdown Menu - White background */
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
}

/* Dropdown Items - White background */
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

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
}

.header-action-btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.85rem;
  transition: var(--transition);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.header-action-btn:hover {
  border-color: var(--primary);
  color: var(--text);
  transform: translateY(-1px);
}

.header-action-btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
}

.header-action-btn.primary:hover {
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
  color: white;
}

.header-action-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 1rem;
}

.action-label {
  font-size: 0.75rem;
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

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  border-color: var(--stat-color);
}

.stat-card .stat-hover {
  position: absolute;
  bottom: 0.25rem;
  right: 1rem;
  font-size: 0.6rem;
  color: var(--stat-color);
  opacity: 0;
  transition: var(--transition);
}

.stat-card.clickable:hover .stat-hover {
  opacity: 1;
}

.stat-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background);
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
  background: var(--background);
}

.stat-trend.up { color: #10b981; }
.stat-trend.down { color: #ef4444; }

/* ============================================ */
/* KPI CARDS                                    */
/* ============================================ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  text-align: center;
  transition: var(--transition);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.kpi-card.highlight {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(249, 73, 8, 0.05), rgba(250, 106, 46, 0.05));
}

.kpi-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
  margin: 0.2rem 0;
}

.kpi-change {
  font-size: 0.7rem;
  font-weight: 600;
}

.kpi-change.positive { color: #10b981; }
.kpi-change.negative { color: #ef4444; }

/* ============================================ */
/* ECHARTS CONTAINER                           */
/* ============================================ */
.echarts-container {
  width: 100%;
  height: 300px;
}

.chart-modern.fullscreen .echarts-container {
  height: calc(100vh - 250px);
}

/* ============================================ */
/* CHART MODERN                                 */
/* ============================================ */
.chart-modern {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: var(--transition);
  margin-bottom: 1.25rem;
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

/* Chart Stats */
.chart-modern-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.chart-modern-stat {
  text-align: center;
}

.chart-modern-stat-label {
  display: block;
  font-size: 0.55rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-modern-stat-value {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
}

.chart-modern-stat-value.up { color: #10b981; }
.chart-modern-stat-value.down { color: #ef4444; }

.chart-modern-stat-sub {
  font-size: 0.5rem;
  color: var(--text-tertiary);
}

/* Chart Navigation */
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

.stall-rank-click,
.menu-rank-click {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  opacity: 0;
  transition: var(--transition);
  margin-left: 0.5rem;
}

.clickable-item:hover .stall-rank-click,
.clickable-item:hover .menu-rank-click {
  opacity: 1;
}

/* ============================================ */
/* MODERN CARDS                                 */
/* ============================================ */
.card-modern {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1.25rem;
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
/* STALL RANKING                                */
/* ============================================ */
.stall-rank-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.stall-rank-item:last-child {
  border-bottom: none;
}

.stall-rank {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
}

.stall-rank-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.7rem;
  background: var(--background);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.stall-rank-number.gold { background: #fbbf24; color: #78350f; }
.stall-rank-number.silver { background: #d1d5db; color: #374151; }
.stall-rank-number.bronze { background: #f59e0b; color: #78350f; }

.stall-rank-name {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text);
}

.stall-rank-bar {
  flex: 1;
  height: 4px;
  background: var(--background);
  border-radius: 2px;
  overflow: hidden;
}

.stall-rank-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--primary);
}

.stall-rank-fill.gold { background: #fbbf24; }
.stall-rank-fill.silver { background: #d1d5db; }
.stall-rank-fill.bronze { background: #f59e0b; }

.stall-rank-revenue {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  min-width: 80px;
  text-align: right;
}

/* ============================================ */
/* MENU RANKING                                 */
/* ============================================ */
.menu-rank-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.menu-rank-item:last-child {
  border-bottom: none;
}

.menu-rank-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.menu-rank-number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.65rem;
  background: var(--background);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.menu-rank-name {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text);
}

.menu-rank-qty {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.menu-rank-bar {
  height: 3px;
  background: var(--background);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.2rem;
}

.menu-rank-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-rank-revenue {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text);
  text-align: right;
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
  background: var(--background);
  border-radius: 16px;
  border: 1px solid var(--border-light);
}

/* ============================================ */
/* MENU ASSIGNMENT                             */
/* ============================================ */
.menu-assignment-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assignment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.assignment-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: auto;
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

.assignment-item-info {
  flex: 1;
}

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

.assignment-item-name {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text);
}

.assignment-item-price {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
}

.assignment-item-category {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--surface);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  border: 1px solid var(--border-light);
}

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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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
  background: var(--background);
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
  background: var(--background);
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
  background: var(--background);
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
  background: var(--background);
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

.list-item-company {
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.05rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-light);
  min-width: 80px;
  text-align: center;
  white-space: nowrap;
}

.list-item-users {
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: #f0fdf4;
  padding: 0.05rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #bbf7d0;
  min-width: 80px;
  text-align: center;
  white-space: nowrap;
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
  background: var(--background);
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

.btn-modern.secondary:hover {
  background: var(--surface-elevated);
  color: var(--text);
}

.btn-modern.small {
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
}

/* ============================================ */
/* MODALS - WHITE BACKGROUND                    */
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

.modal-lg {
  max-width: 600px;
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
  background: #ffffff !important;
  padding: 1.25rem;
  overflow-y: auto;
  max-height: 60vh;
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

.stall-select-multiple {
  min-height: 60px;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
}

/* ============================================ */
/* DETAIL MODALS                                */
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

.status-badge {
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.excellent { background: #d1fae5; color: #059669; }
.status-badge.good { background: #dbeafe; color: #2563eb; }
.status-badge.average { background: #fef3c7; color: #d97706; }
.status-badge.poor { background: #fee2e2; color: #dc2626; }
.status-badge.no-sales { background: #f3f4f6; color: #6b7280; }

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

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */
@media (max-width: 768px) {
  .controls-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .tab-dropdown,
  .period-dropdown-wrapper {
    min-width: unset;
    width: 100%;
  }
  
  .action-buttons {
    margin-left: 0;
    justify-content: center;
  }
  
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .stat-card { padding: 0.75rem; }
  .stat-number { font-size: 1.1rem; }
  
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .kpi-value { font-size: 1.1rem; }
  
  .echarts-container { height: 200px; }
  .chart-wrapper { min-height: 200px; }
  
  .chart-modern-body { padding: 0.75rem; }
  
  .chart-modern-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.35rem;
  }
  
  .chart-modern-stat-value { font-size: 0.8rem; }
  
  .filter-bar { flex-direction: column; }
  .filter-search { min-width: unset; }
  .filter-select { min-width: unset; }
  
  .inventory-items-grid { grid-template-columns: 1fr; }
  .inventory-stall-header { flex-direction: column; align-items: flex-start; }
  
  .modal-form-row { grid-template-columns: 1fr; }
  .modal-modern { width: 95%; }
  
  .stall-rank-item { flex-wrap: wrap; }
  .stall-rank { min-width: unset; }
  .stall-rank-revenue { min-width: unset; }
  
  .chart-modern-nav-label { min-width: 60px; font-size: 0.6rem; }
  
  .assignment-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .assignment-count {
    margin-right: 0;
    text-align: center;
  }
  
  .assignment-item-label {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .stat-card { padding: 0.5rem; flex-direction: column; text-align: center; gap: 0.25rem; }
  .stat-icon { width: 32px; height: 32px; font-size: 1rem; }
  .stat-number { font-size: 0.95rem; }
  
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .kpi-card { padding: 0.5rem; }
  .kpi-value { font-size: 0.95rem; }
  
  .echarts-container { height: 160px; }
  .chart-wrapper { min-height: 160px; }
  
  .chart-modern-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.25rem;
    padding: 0.35rem;
  }
  
  .chart-modern-stat { padding: 0.15rem; }
  .chart-modern-stat-value { font-size: 0.75rem; }
  .chart-modern-stat-label { font-size: 0.5rem; }
  
  .chart-modern-nav-label { min-width: 50px; font-size: 0.55rem; }
  
  .list-item-content { gap: 0.35rem; }
  .list-item-name { font-size: 0.75rem; }
  .list-item-btn { font-size: 0.75rem; }
  
  .empty-state-modern span { font-size: 1.5rem; }
  
  .action-buttons {
    flex-direction: row;
    width: 100%;
  }
  
  .header-action-btn {
    flex: 1;
    justify-content: center;
  }
  
  .dropdown-toggle {
    font-size: 0.8rem;
    padding: 0.35rem 0.6rem;
  }
  
  .dropdown-label {
    font-size: 0.8rem;
  }
}

/* ============================================ */
/* STALL RANK STATUS                            */
/* ============================================ */
.stall-rank-status {
  min-width: 80px;
  text-align: center;
}

.stall-rank-status .status-tag {
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
}

.stall-rank-status .status-tag.active {
  background: #d1fae5;
  color: #059669;
}

.stall-rank-status .status-tag.inactive {
  background: #fee2e2;
  color: #dc2626;
}

</style>