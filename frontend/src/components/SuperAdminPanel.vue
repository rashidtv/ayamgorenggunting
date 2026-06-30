<template>
  <!-- ============================================ -->
  <!-- COMPLETE TEMPLATE - UNCHANGED                -->
  <!-- ============================================ -->
  <div class="sa-dashboard">
    <!-- MODERN HEADER -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-badge">🏢</div>
          <div>
            <h1>Company Management</h1>
            <p>Real-time insights & control</p>
          </div>
        </div>
        <div class="header-right">
          <button @click="refreshAllData" class="header-btn" title="Refresh Data">
            <span class="refresh-icon">⟳</span>
          </button>
          <button @click="exportCurrentTab" class="header-btn primary" :disabled="exporting">
            <span>{{ exporting ? '...' : '⬇' }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- STATS CARDS -->
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
      <div class="stat-card clickable" style="--stat-color: #dc2626;" @click="switchTab('inventory')">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <span class="stat-number">{{ lowStock.length }}</span>
          <span class="stat-label">Low Stock Alerts</span>
        </div>
        <div class="stat-trend" :class="lowStock.length > 0 ? 'down' : 'up'">
          {{ lowStock.length > 0 ? '⚠️ Needs attention' : '✅ All good' }}
        </div>
        <div class="stat-hover">Click to view →</div>
      </div>
    </div>

    <!-- PERIOD SELECTOR -->
    <div v-if="activeTab === 'dashboard'" class="period-section">
      <div class="period-pills">
        <button 
          v-for="p in periods" 
          :key="p.value"
          :class="['period-pill', { active: selectedPeriod === p.value }]"
          @click="selectedPeriod = p.value; refreshAllData()"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- TAB NAVIGATION -->
    <div class="tab-nav">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-pill', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        <span class="tab-pill-icon">{{ tab.icon }}</span>
        <span class="tab-pill-label">{{ tab.label }}</span>
        <span v-if="tab.id === 'inventory' && lowStock.length > 0" class="tab-pill-badge">
          {{ lowStock.length }}
        </span>
      </button>
    </div>

    <!-- TAB CONTENT -->
    <div class="tab-content">
      <!-- ===== DASHBOARD TAB ===== -->
      <div v-if="activeTab === 'dashboard'" class="tab-panel">
        
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

        <!-- Stall Performance -->
        <div class="card-modern">
          <div class="card-modern-header">
            <div>
              <h3>🏆 Stall Performance</h3>
              <span class="card-subtitle">Ranked by revenue for {{ getPeriodLabel() }}</span>
            </div>
            <span class="period-tag">{{ getPeriodLabel() }}</span>
          </div>
          <div class="card-modern-body">
            <div v-if="stallPerformance.length === 0" class="empty-state-modern">
              <span>📊</span>
              <p>No sales data available for {{ getPeriodLabel() }}</p>
            </div>
            <div v-for="(stall, index) in stallPerformance.slice(0, 5)" :key="stall.id" class="stall-rank-item">
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
            </div>
          </div>
        </div>

        <!-- Menu Performance -->
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
            <div v-for="(item, index) in menuPerformance.slice(0, 5)" :key="item.name" class="menu-rank-item">
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

      <!-- ===== MENU MANAGEMENT TAB ===== -->
      <div v-if="activeTab === 'menu'" class="tab-panel">
        <div class="card-modern">
          <div class="card-modern-header">
            <div>
              <h3>📋 Menu Management</h3>
              <span class="card-subtitle">Manage your menu items and recipes</span>
            </div>
            <button @click="openMenuModal()" class="btn-modern primary">+ New Item</button>
          </div>
          <div class="card-modern-body">
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

            <div v-if="filteredMenuItems.length === 0" class="empty-state-modern">
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

    <!-- MENU MODAL -->
    <div v-if="menuModal" class="modal-overlay" @click.self="closeMenuModal">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>{{ editingMenu ? 'Edit Menu Item' : 'New Menu Item' }}</h3>
          <button @click="closeMenuModal" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <div class="modal-form-row">
            <div class="modal-form-group">
              <label>Item Name</label>
              <input v-model="menuForm.item_name" placeholder="e.g., AGG" :disabled="editingMenu" />
            </div>
            <div class="modal-form-group">
              <label>Price (RM)</label>
              <input type="number" v-model="menuForm.price" placeholder="0.00" step="0.5" />
            </div>
          </div>
          <div class="modal-form-row">
            <div class="modal-form-group">
              <label>Category</label>
              <input v-model="menuForm.category" placeholder="e.g., Main, Side, Drink" />
            </div>
            <div class="modal-form-group">
              <label>Description</label>
              <input v-model="menuForm.description" placeholder="Brief description" />
            </div>
          </div>
          <div class="modal-form-group">
            <label>Recipe (Ingredients)</label>
            <div v-for="(ingredient, index) in menuForm.recipe" :key="index" class="recipe-row">
              <input v-model="ingredient.material_name" placeholder="Material name" class="recipe-input" />
              <input type="number" v-model="ingredient.quantity_used" placeholder="Qty" class="recipe-input-small" step="0.5" />
              <button @click="removeRecipeIngredient(index)" class="btn-icon-sm danger">✕</button>
            </div>
            <button @click="addRecipeIngredient" class="btn-modern secondary small">+ Add Ingredient</button>
          </div>
        </div>
        <div class="modal-modern-footer">
          <button @click="closeMenuModal" class="btn-modern secondary">Cancel</button>
          <button @click="saveMenuItem" class="btn-modern primary">{{ editingMenu ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- USER MODAL -->
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

    <!-- STALL MODAL -->
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
  props: ['token'],
  data() {
    return {
      // Tabs
      activeTab: 'dashboard',
      tabs: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'stalls', label: 'Stalls', icon: '🏪' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'menu', label: 'Menu', icon: '📋' }
      ],
      
      // Chart settings
      chartFullscreen: false,
      chartOffset: 0,
      chartWindow: 7,
      chartInstance: null,
      isChartInitialized: false,
      
      // Data
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
      
      // Menu filters
      menuSearch: '',
      menuCategoryFilter: 'all',
      
      // Menu Modal
      menuModal: false,
      editingMenu: false,
      menuForm: {
        item_name: '',
        price: 0,
        description: '',
        category: '',
        recipe: []
      },
      
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
    }
  },
  computed: {
    lowStockCount() {
      return this.lowStock.length
    },
    chartVisibleData() {
      return this.salesTrend.slice(this.chartOffset, this.chartOffset + this.chartWindow)
    },
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
    this.loadData()
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
    }
  },
  beforeUnmount() {
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    window.removeEventListener('resize', this.handleChartResize)
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
      return materialName === 'Oil' ? 'L' : 'kg'
    },
    
    // =============================================
    // HELPER: Get today's date in Malaysia timezone
    // =============================================
    getTodayInMalaysia() {
      const now = new Date()
      // Malaysia is UTC+8
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
      
      // Responsive adjustments - show all dates
      const chartWidth = this.$refs.chartRef?.clientWidth || 0
      const labelInterval = chartWidth < 400 && dates.length > 7 ? Math.floor(dates.length / 6) : 0
      
      const option = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: '#1e293b',
            fontSize: 13
          },
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
          axisLine: {
            lineStyle: { color: '#e2e8f0' }
          },
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
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          splitLine: {
            lineStyle: {
              color: '#f1f5f9',
              type: 'dashed'
            }
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: chartWidth < 400 ? 9 : 11,
            formatter: function(value) {
              if (value >= 1000) {
                return 'RM' + (value / 1000).toFixed(1) + 'k'
              }
              return 'RM' + value
            }
          },
          name: chartWidth > 500 ? 'Revenue (RM)' : '',
          nameTextStyle: {
            color: '#94a3b8',
            fontSize: chartWidth < 400 ? 9 : 11
          }
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
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#F94908' },
                  { offset: 1, color: '#fa6a2e' }
                ]
              }
            },
            emphasis: {
              itemStyle: {
                color: '#d63d07'
              }
            }
          },
          {
            name: 'Trend Line',
            type: 'line',
            data: revenues,
            smooth: true,
            lineStyle: {
              color: '#F94908',
              width: 2,
              type: 'solid'
            },
            symbol: 'circle',
            symbolSize: chartWidth < 400 ? 4 : 6,
            itemStyle: {
              color: '#F94908',
              borderColor: '#ffffff',
              borderWidth: 2
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
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
    // MENU MANAGEMENT - CRUD
    // =============================================
    openMenuModal() {
      this.editingMenu = false
      this.menuForm = {
        item_name: '',
        price: 0,
        description: '',
        category: '',
        recipe: []
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
        recipe: (item.recipe || []).map(r => ({ ...r }))
      }
      this.menuModal = true
    },
    closeMenuModal() {
      this.menuModal = false
      this.editingMenu = false
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
          description: this.menuForm.description,
          category: this.menuForm.category || 'Main',
          recipe: this.menuForm.recipe.filter(r => r.material_name && r.quantity_used > 0)
        }
        
        if (this.editingMenu) {
          await axios.put(`${API_BASE}/menu/${encodeURIComponent(this.menuForm.item_name)}`, payload, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'Menu item updated', 'success')
        } else {
          await axios.post(`${API_BASE}/menu`, payload, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'Menu item created', 'success')
        }
        
        this.closeMenuModal()
        await this.loadMenuItems()
      } catch (err) {
        this.$emit('show-notification', err.response?.data?.error || 'Operation failed', 'error')
      }
    },
    async deleteMenuItem(itemName) {
      if (confirm(`Delete menu item "${itemName}"?`)) {
        try {
          await axios.delete(`${API_BASE}/menu/${encodeURIComponent(itemName)}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.$emit('show-notification', 'Menu item deleted', 'success')
          await this.loadMenuItems()
        } catch (err) {
          this.$emit('show-notification', 'Failed to delete menu item', 'error')
        }
      }
    },
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
    // STALL RANKING
    // =============================================
    getRankClass(index) {
      if (index === 0) return 'gold'
      if (index === 1) return 'silver'
      if (index === 2) return 'bronze'
      return ''
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
    // DATA LOADING - FIXED with Malaysia timezone
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
          this.loadMenuPerformance(),
          this.loadMenuItems()
        ])
        await this.loadAllStallsInventory()
        this.resetChartNavigation()
        this.$emit('show-notification', 'Data refreshed', 'success')
      } catch (err) {
        this.$emit('show-notification', err.message, 'error')
      }
    },
    async loadStalls() {
      const res = await axios.get(`${API_BASE}/companies/1/stalls`, { 
        headers: { Authorization: `Bearer ${this.token}` } 
      })
      this.stalls = res.data
    },
    async loadUsers() {
      const res = await axios.get(`${API_BASE}/companies/1/users`, { 
        headers: { Authorization: `Bearer ${this.token}` } 
      })
      this.users = res.data
    },
    async loadLowStock() {
      const res = await axios.get(`${API_BASE}/companies/1/low-stock`, { 
        headers: { Authorization: `Bearer ${this.token}` } 
      })
      this.lowStock = res.data
    },
    async loadSalesAnalytics() {
      const days = this.selectedPeriod === 'today' ? 0 :
                   this.selectedPeriod === 'week' ? 7 :
                   this.selectedPeriod === 'month' ? 30 :
                   this.selectedPeriod === 'quarter' ? 90 : 365
      
      const apiDays = this.selectedPeriod === 'today' ? 1 : days
      
      try {
        const res = await axios.get(`${API_BASE}/sales-analytics?days=${apiDays}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        const data = res.data || {}
        
        // Parse daily sales
        let dailySales = (data.dailySales || []).map(day => ({
          ...day,
          items: parseInt(day.items) || 0,
          revenue: parseFloat(day.revenue) || 0
        }))
        
        // For 'today', filter to only show today's data using Malaysia timezone
        if (this.selectedPeriod === 'today') {
          const today = this.getTodayInMalaysia()
          
          dailySales = dailySales.filter(day => {
            const dayDate = new Date(day.date)
            dayDate.setHours(0, 0, 0, 0)
            return dayDate.getTime() === today.getTime()
          })
        }
        
        this.salesTrend = dailySales
        
        // Calculate totals from filtered data
        const totalRevenue = dailySales.reduce((sum, d) => sum + d.revenue, 0)
        const totalItems = dailySales.reduce((sum, d) => sum + d.items, 0)
        
        this.consolidatedSales.totalItems = totalItems
        this.consolidatedSales.totalRevenue = totalRevenue
        this.consolidatedSales.averagePerStall = this.stalls.length > 0 ? 
          totalRevenue / this.stalls.length : 0
        
        // If no sales today, clear top stall
        if (this.selectedPeriod === 'today' && dailySales.length === 0) {
          this.consolidatedSales.topStall = '-'
          this.consolidatedSales.topRevenue = 0
        } else {
          this.consolidatedSales.topStall = data.topStall || '-'
          this.consolidatedSales.topRevenue = parseFloat(data.topRevenue) || 0
        }
        
        this.productSales = data.productSales || {}
        
        // If no daily sales for today, clear product sales
        if (this.selectedPeriod === 'today' && dailySales.length === 0) {
          this.productSales = {}
        }
        
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
        const res = await axios.get(`${API_BASE}/stall-performance?days=${apiDays}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        let stallData = res.data || []
        
        // FIXED: For 'today', check if there are any sales today using salesTrend
        // If salesTrend is empty, there are no sales today, so clear stall data
        if (this.selectedPeriod === 'today') {
          // Use salesTrend as source of truth - if no sales today, clear stall data
          if (this.salesTrend.length === 0) {
            stallData = []
          }
        }
        
        this.stallPerformance = stallData
      } catch (err) {
        this.stallPerformance = []
      }
    },
    async loadMenuPerformance() {
      try {
        const productSales = this.productSales || {}
        this.menuPerformance = Object.keys(productSales).map(name => ({
          name: name,
          quantity: parseInt(productSales[name].quantity) || 0,
          revenue: parseFloat(productSales[name].revenue) || 0
        })).sort((a, b) => b.quantity - a.quantity)
      } catch (err) {
        this.menuPerformance = []
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
          this.$emit('show-notification', 'Stall updated', 'success')
        } else {
          await axios.post(`${API_BASE}/companies/1/stalls`, {
            name: this.stallForm.name,
            code: this.stallForm.code,
            location: this.stallForm.location
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
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
        await axios.put(`${API_BASE}/stalls/${stall.id}/toggle`, {}, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.loadStalls()
        this.$emit('show-notification', `Stall ${stall.is_active ? 'deactivated' : 'activated'}`, 'success')
      } catch (err) {
        this.$emit('show-notification', 'Failed to update stall', 'error')
      }
    },
    async deleteStall(stallId, stallName) {
      if (confirm(`Delete stall "${stallName}"?`)) {
        try {
          await axios.delete(`${API_BASE}/stalls/${stallId}`, {
            headers: { Authorization: `Bearer ${this.token}` }
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
          sheet.addRow(['Name', 'Code', 'Status'])
          for (const stall of this.filteredStallsList) {
            sheet.addRow([stall.name, stall.code, stall.is_active ? 'Active' : 'Inactive'])
          }
          fileName = `Chickory_Stalls_${new Date().toISOString().split('T')[0]}.xlsx`
        } else if (this.activeTab === 'menu') {
          sheet = workbook.addWorksheet('Menu')
          sheet.addRow(['📋 Menu Management', ''])
          sheet.addRow(['Item Name', 'Price', 'Category', 'Recipe'])
          for (const item of this.filteredMenuItems) {
            const recipe = (item.recipe || []).map(r => `${r.material_name}: ${r.quantity_used}${this.getUnit(r.material_name)}`).join(', ')
            sheet.addRow([item.item_name, item.price, item.category || 'Main', recipe || 'No recipe'])
          }
          fileName = `Chickory_Menu_${new Date().toISOString().split('T')[0]}.xlsx`
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
/* HEADER                                       */
/* ============================================ */
.dashboard-header {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-badge {
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-left h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--text);
}

.header-left p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 0.5rem;
}

.header-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 1.1rem;
  transition: var(--transition);
  color: var(--text-secondary);
}

.header-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}

.header-btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
}

.header-btn.primary:hover {
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
  color: white;
}

.refresh-icon {
  display: inline-block;
  transition: transform 0.6s;
}

.header-btn:hover .refresh-icon {
  transform: rotate(180deg);
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

@media (max-width: 768px) {
  .stat-card .stat-hover {
    display: none;
  }
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
/* PERIOD SECTION                               */
/* ============================================ */
.period-section {
  margin-bottom: 1.25rem;
}

.period-pills {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.period-pill {
  padding: 0.3rem 1rem;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: var(--transition);
  color: var(--text-secondary);
}

.period-pill:hover {
  border-color: var(--primary);
  color: var(--text);
}

.period-pill.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border-color: var(--primary);
}

/* ============================================ */
/* TAB NAVIGATION                               */
/* ============================================ */
.tab-nav {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  background: var(--surface);
  padding: 0.25rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-nav::-webkit-scrollbar {
  display: none;
}

.tab-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
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

.tab-pill:hover {
  background: var(--background);
  color: var(--text);
}

.tab-pill.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  box-shadow: 0 2px 8px rgba(249, 73, 8, 0.2);
}

.tab-pill-icon {
  font-size: 0.9rem;
}

.tab-pill-label {
  font-size: 0.8rem;
}

.tab-pill-badge {
  background: #ef4444;
  color: white;
  border-radius: 50%;
  padding: 0 5px;
  font-size: 0.55rem;
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
/* KPI CARDS                                    */
/* ============================================ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
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
/* CHART WRAPPER                                */
/* ============================================ */
.chart-wrapper {
  position: relative;
  width: 100%;
  min-height: 300px;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
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
/* MODERN CARDS                                 */
/* ============================================ */
.card-modern {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
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
/* MENU MANAGEMENT                              */
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
  background: var(--background);
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
  background: var(--background);
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

/* Recipe row in modal */
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

/* Modal large */
.modal-lg {
  max-width: 600px;
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
/* INVENTORY                                    */
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
/* RESPONSIVE                                   */
/* ============================================ */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
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
  
  .tab-pill { padding: 0.35rem 0.6rem; font-size: 0.75rem; }
  .tab-pill-label { font-size: 0.7rem; }
  
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
  
  .modal-lg {
    max-width: 95%;
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
  
  .header-left h1 { font-size: 1rem; }
  .header-badge { width: 36px; height: 36px; font-size: 1.2rem; }
  
  .tab-pill { padding: 0.25rem 0.4rem; font-size: 0.65rem; }
  .tab-pill-icon { font-size: 0.7rem; }
  .tab-pill-label { font-size: 0.6rem; }
  
  .list-item-content { gap: 0.35rem; }
  .list-item-name { font-size: 0.75rem; }
  .list-item-btn { font-size: 0.75rem; }
  
  .empty-state-modern span { font-size: 1.5rem; }
  
  .menu-item-info {
    min-width: unset;
    width: 100%;
  }
  
  .menu-item-price {
    display: inline-block;
  }
}
</style>