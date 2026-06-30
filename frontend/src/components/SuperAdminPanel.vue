<template>
  <div class="sa-dashboard">
    <!-- ============================================ -->
    <!-- MODERN HEADER WITH HAMBURGER MENU            -->
    <!-- ============================================ -->
    <div class="dashboard-header-modern">
      <div class="header-top">
        <div class="header-left">
          <button @click="toggleMobileMenu" class="hamburger-btn" aria-label="Toggle menu">
            <span class="hamburger-line" :class="{ active: mobileMenuOpen }"></span>
            <span class="hamburger-line" :class="{ active: mobileMenuOpen }"></span>
            <span class="hamburger-line" :class="{ active: mobileMenuOpen }"></span>
          </button>
          <div class="brand-section">
            <div class="logo-container" @click="openLogoUpload">
              <img v-if="companyLogo" :src="companyLogo" alt="Logo" class="header-logo" />
              <span v-else class="logo-placeholder-text">🍗</span>
              <div class="logo-upload-overlay">
                <span>📷</span>
              </div>
            </div>
            <div class="brand-text">
              <h2>Chickory Hub</h2>
              <span>Ayam Goreng Gunting</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="period-selector-compact" v-if="activeTab === 'dashboard'">
            <button 
              v-for="p in periods" 
              :key="p.value"
              :class="['period-btn-compact', { active: selectedPeriod === p.value }]"
              @click="selectedPeriod = p.value; refreshAllData()"
            >
              {{ p.label }}
            </button>
          </div>
          <div class="header-actions-compact">
            <button @click="refreshAllData" class="action-btn-compact" title="Refresh">
              ⟳
            </button>
            <button @click="exportCurrentTab" class="action-btn-compact primary" :disabled="exporting">
              {{ exporting ? '...' : '⬇' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu Dropdown -->
      <transition name="slide-down">
        <div v-if="mobileMenuOpen" class="mobile-menu">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['mobile-menu-item', { active: activeTab === tab.id }]"
            @click="switchTab(tab.id); mobileMenuOpen = false"
          >
            <span class="menu-item-icon">{{ tab.icon }}</span>
            <span class="menu-item-label">{{ tab.label }}</span>
            <span v-if="tab.id === 'inventory' && lowStock.length > 0" class="menu-badge">
              {{ lowStock.length }}
            </span>
          </button>
        </div>
      </transition>

      <!-- Desktop Tab Navigation -->
      <div class="tab-navigation-desktop">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn-desktop', { active: activeTab === tab.id }]"
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
    <!-- STATS CARDS                                  -->
    <!-- ============================================ -->
    <div class="stats-grid-modern">
      <div class="stat-card-modern" style="--stat-color: #2563eb;">
        <div class="stat-icon-modern">🏪</div>
        <div class="stat-content-modern">
          <span class="stat-number-modern">{{ stalls.length }}</span>
          <span class="stat-label-modern">Total Stalls</span>
        </div>
        <div class="stat-trend-modern up">+12%</div>
      </div>
      <div class="stat-card-modern" style="--stat-color: #7c3aed;">
        <div class="stat-icon-modern">👥</div>
        <div class="stat-content-modern">
          <span class="stat-number-modern">{{ users.length }}</span>
          <span class="stat-label-modern">Total Users</span>
        </div>
        <div class="stat-trend-modern up">+8%</div>
      </div>
      <div class="stat-card-modern clickable" style="--stat-color: #dc2626;" @click="switchTab('inventory')">
        <div class="stat-icon-modern">⚠️</div>
        <div class="stat-content-modern">
          <span class="stat-number-modern">{{ lowStock.length }}</span>
          <span class="stat-label-modern">Low Stock Alerts</span>
        </div>
        <div class="stat-trend-modern" :class="lowStock.length > 0 ? 'down' : 'up'">
          {{ lowStock.length > 0 ? '⚠️' : '✅' }}
        </div>
        <div class="stat-hover-modern">Click to view</div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- TAB CONTENT                                 -->
    <!-- ============================================ -->
    <div class="tab-content-modern">
      <!-- ===== DASHBOARD TAB ===== -->
      <div v-if="activeTab === 'dashboard'" class="tab-panel-modern">
        
        <!-- KPI Cards Section -->
        <div class="section-card">
          <div class="section-header">
            <h3>📊 Performance Overview</h3>
            <span class="section-badge">{{ getPeriodLabel() }}</span>
          </div>
          <div class="kpi-grid-modern">
            <div class="kpi-card-modern">
              <div class="kpi-label">Revenue</div>
              <div class="kpi-value">{{ formatCurrency(consolidatedSales.totalRevenue || 0) }}</div>
              <div class="kpi-change" :class="getRevenueChange() >= 0 ? 'positive' : 'negative'">
                {{ getRevenueChange() >= 0 ? '↑' : '↓' }} {{ Math.abs(getRevenueChange()).toFixed(1) }}%
              </div>
            </div>
            <div class="kpi-card-modern">
              <div class="kpi-label">Items Sold</div>
              <div class="kpi-value">{{ formatNumber(consolidatedSales.totalItems || 0) }}</div>
              <div class="kpi-change" :class="getItemsChange() >= 0 ? 'positive' : 'negative'">
                {{ getItemsChange() >= 0 ? '↑' : '↓' }} {{ Math.abs(getItemsChange()).toFixed(1) }}%
              </div>
            </div>
            <div class="kpi-card-modern">
              <div class="kpi-label">Average per Stall</div>
              <div class="kpi-value">{{ formatCurrency(consolidatedSales.averagePerStall || 0) }}</div>
            </div>
            <div class="kpi-card-modern highlight">
              <div class="kpi-label">🏆 Top Stall</div>
              <div class="kpi-value" style="font-size: 1.1rem;">{{ consolidatedSales.topStall || '-' }}</div>
              <div class="kpi-change" v-if="consolidatedSales.topRevenue">
                {{ formatCurrency(consolidatedSales.topRevenue || 0) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="section-card chart-section" :class="{ 'fullscreen': chartFullscreen }">
          <div class="section-header">
            <div>
              <h3>📈 Sales Trend</h3>
              <span class="section-subtitle">{{ getPeriodLabel() }} overview</span>
            </div>
            <div class="chart-actions">
              <button @click="toggleChartFullscreen" class="action-btn-small">
                {{ chartFullscreen ? '✕' : '⛶' }}
              </button>
            </div>
          </div>
          <div class="section-body">
            <!-- Chart Stats -->
            <div class="chart-stats-mini" v-if="salesTrend.length > 0">
              <div class="chart-stat-mini">
                <span class="stat-mini-label">Peak</span>
                <span class="stat-mini-value">{{ formatCurrency(getPeakRevenue()) }}</span>
                <span class="stat-mini-sub">{{ getPeakDay() }}</span>
              </div>
              <div class="chart-stat-mini">
                <span class="stat-mini-label">Average</span>
                <span class="stat-mini-value">{{ formatCurrency(getAverageRevenue()) }}</span>
              </div>
              <div class="chart-stat-mini">
                <span class="stat-mini-label">Items</span>
                <span class="stat-mini-value">{{ formatNumber(getTotalItems()) }}</span>
              </div>
              <div class="chart-stat-mini">
                <span class="stat-mini-label">Trend</span>
                <span class="stat-mini-value" :class="getTrendDirection()">
                  {{ getTrendDirection() === 'up' ? '↑' : getTrendDirection() === 'down' ? '↓' : '→' }}
                  {{ getTrendPercentage() }}%
                </span>
              </div>
            </div>

            <!-- ECharts -->
            <div class="chart-wrapper-modern" ref="chartWrapper">
              <div v-if="salesTrend.length > 0" class="chart-container-modern">
                <div ref="chartRef" class="echarts-container-modern"></div>
              </div>
              <div v-else class="chart-empty-modern">
                <span>📊</span>
                <p>No sales data for {{ getPeriodLabel() }}</p>
              </div>
            </div>

            <!-- Chart Navigation -->
            <div v-if="salesTrend.length > chartWindow" class="chart-nav-modern">
              <button @click="navigateChart('prev')" class="nav-btn-modern" :disabled="chartOffset <= 0">←</button>
              <span class="nav-label-modern">
                {{ chartOffset + 1 }}–{{ Math.min(chartOffset + chartWindow, salesTrend.length) }} of {{ salesTrend.length }}
              </span>
              <button @click="navigateChart('next')" class="nav-btn-modern" :disabled="chartOffset + chartWindow >= salesTrend.length">→</button>
              <button @click="resetChartNavigation" class="nav-btn-modern reset" v-if="chartOffset > 0 || chartWindow < salesTrend.length">↺</button>
            </div>
          </div>
        </div>

        <!-- Stall Performance -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3>🏆 Stall Performance</h3>
              <span class="section-subtitle">Top performers for {{ getPeriodLabel() }}</span>
            </div>
            <span class="section-badge">{{ getPeriodLabel() }}</span>
          </div>
          <div class="section-body">
            <div v-if="stallPerformance.length === 0" class="empty-state-modern">
              <span>📊</span>
              <p>No sales data for {{ getPeriodLabel() }}</p>
            </div>
            <div 
              v-for="(stall, index) in stallPerformance.slice(0, 5)" 
              :key="stall.id" 
              class="rank-item-modern clickable"
              @click="viewStallDetails(stall)"
            >
              <div class="rank-left">
                <span class="rank-number" :class="getRankClass(index)">{{ index + 1 }}</span>
                <span class="rank-name">{{ stall.name }}</span>
              </div>
              <div class="rank-bar-modern">
                <div 
                  class="rank-fill-modern" 
                  :style="{ width: getStallBarWidth(stall.revenue) + '%' }"
                  :class="getRankClass(index)"
                ></div>
              </div>
              <div class="rank-right">
                <span class="rank-revenue">{{ formatCurrency(stall.revenue || 0) }}</span>
                <span class="rank-click-hint">👆</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Menu Performance -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3>🍗 Menu Performance</h3>
              <span class="section-subtitle">Top selling items for {{ getPeriodLabel() }}</span>
            </div>
          </div>
          <div class="section-body">
            <div v-if="menuPerformance.length === 0" class="empty-state-modern">
              <span>🍗</span>
              <p>No sales data for {{ getPeriodLabel() }}</p>
            </div>
            <div 
              v-for="(item, index) in menuPerformance.slice(0, 5)" 
              :key="item.name" 
              class="rank-item-modern clickable"
              @click="viewMenuItemDetails(item)"
            >
              <div class="rank-left">
                <span class="rank-number">{{ index + 1 }}</span>
                <span class="rank-name">{{ item.name }}</span>
                <span class="rank-qty">{{ item.quantity }} sold</span>
              </div>
              <div class="rank-bar-modern">
                <div 
                  class="rank-fill-modern menu" 
                  :style="{ width: getPerformancePercentage(item.quantity) + '%' }"
                ></div>
              </div>
              <div class="rank-right">
                <span class="rank-revenue">{{ formatCurrency(item.revenue || 0) }}</span>
                <span class="rank-click-hint">👆</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== INVENTORY TAB ===== -->
      <div v-if="activeTab === 'inventory'" class="tab-panel-modern">
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3>📦 Inventory Management</h3>
              <span class="section-subtitle">{{ filteredInventoryStalls.length }} stalls</span>
            </div>
            <button @click="loadAllStallsInventory()" class="btn-modern-sm secondary">⟳ Refresh</button>
          </div>
          <div class="section-body">
            <div class="filter-bar-modern">
              <div class="search-box-modern">
                <input 
                  type="text" 
                  v-model="inventorySearch" 
                  placeholder="🔍 Search stalls or materials..." 
                  class="search-input-modern"
                />
              </div>
              <select v-model="inventoryFilter" class="filter-select-modern">
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

            <div v-for="stall in filteredInventoryStalls" :key="stall.id" class="inventory-stall-modern">
              <div class="inventory-stall-header" @click="toggleInventoryStall(stall.id)">
                <div class="stall-info-modern">
                  <span class="stall-name-modern">{{ stall.name }}</span>
                  <span :class="['status-tag-modern', stall.is_active ? 'active' : 'inactive']">
                    {{ stall.is_active ? 'Active' : 'Inactive' }}
                  </span>
                  <span v-if="hasLowStock(stall.id)" class="status-tag-modern danger">⚠️ Low Stock</span>
                </div>
                <div class="stall-summary-modern">
                  <span v-for="item in getStallInventorySummary(stall.id)" :key="item.material_name" class="inventory-tag-modern">
                    {{ item.material_name }}: {{ item.current_level }}{{ getUnit(item.material_name) }}
                    <span v-if="item.current_level <= item.alert_level" class="low-dot">⚠️</span>
                  </span>
                  <span class="toggle-icon-modern">{{ expandedInventoryStall === stall.id ? '−' : '+' }}</span>
                </div>
              </div>

              <div v-if="expandedInventoryStall === stall.id" class="inventory-details-modern">
                <div class="inventory-grid-modern">
                  <div 
                    v-for="item in getFilteredInventoryItems(stall.id)" 
                    :key="item.material_name" 
                    class="inventory-item-modern"
                    :class="{ 'low': item.current_level <= item.alert_level }"
                  >
                    <div class="item-header-modern">
                      <span class="item-name-modern">{{ item.material_name }}</span>
                      <span :class="['item-status-modern', item.current_level <= item.alert_level ? 'low' : 'ok']">
                        {{ item.current_level <= item.alert_level ? '⚠️' : '✅' }}
                      </span>
                    </div>
                    <div class="item-level-modern">
                      <span class="item-current">{{ item.current_level }}{{ getUnit(item.material_name) }}</span>
                      <span class="item-alert">Alert: {{ item.alert_level }}{{ getUnit(item.material_name) }}</span>
                    </div>
                    <div class="item-progress-modern">
                      <div class="progress-track-modern">
                        <div 
                          class="progress-fill-modern" 
                          :style="{ width: getInventoryPercentage(item) + '%' }"
                          :class="{ low: item.current_level <= item.alert_level }"
                        ></div>
                      </div>
                    </div>
                    <div class="item-actions-modern">
                      <input type="number" v-model.number="item.newLevel" :placeholder="item.current_level" step="0.5" class="item-input-modern" />
                      <button @click="updateInventoryStock(stall.id, item.material_name, item.newLevel)" class="btn-modern-sm primary">Update</button>
                      <button @click="quickAddStock(stall.id, item.material_name, 5)" class="btn-modern-sm secondary">+5</button>
                      <button @click="quickAddStock(stall.id, item.material_name, 1)" class="btn-modern-sm secondary">+1</button>
                    </div>
                  </div>
                </div>
                <div class="inventory-actions-modern">
                  <button @click="bulkUpdateInventory(stall.id)" class="btn-modern-sm primary">📦 Bulk Update</button>
                  <button @click="resetInventoryToAlert(stall.id)" class="btn-modern-sm secondary">Reset to Alert</button>
                </div>
              </div>
            </div>

            <div v-if="lowStock.length > 0" class="alerts-section-modern">
              <h4>⚠️ Low Stock Alerts</h4>
              <div v-for="item in filteredLowStock" :key="item.stall_name + item.material_name" class="alert-row-modern">
                <span class="alert-stall">{{ item.stall_name }}</span>
                <span class="alert-material">{{ item.material_name }}</span>
                <span class="alert-level">{{ item.current_level }}{{ getUnit(item.material_name) }}</span>
                <span class="alert-threshold">(Alert: {{ item.alert_level }}{{ getUnit(item.material_name) }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== STALLS TAB ===== -->
      <div v-if="activeTab === 'stalls'" class="tab-panel-modern">
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3>🏪 Stall Management</h3>
              <span class="section-subtitle">{{ filteredStallsList.length }} stalls</span>
            </div>
            <button @click="openStallModal()" class="btn-modern-sm primary">+ New Stall</button>
          </div>
          <div class="section-body">
            <div class="filter-bar-modern">
              <div class="search-box-modern">
                <input 
                  type="text" 
                  v-model="stallSearch" 
                  placeholder="🔍 Search stalls..." 
                  class="search-input-modern"
                />
              </div>
              <select v-model="stallStatusFilter" class="filter-select-modern">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div v-if="filteredStallsList.length === 0" class="empty-state-modern">
              <span>🏪</span>
              <p>No stalls found</p>
            </div>

            <div v-for="(s, index) in filteredStallsList" :key="s.id" class="list-item-modern">
              <div class="list-item-content-modern">
                <span class="list-index">{{ index + 1 }}</span>
                <div class="list-info">
                  <span class="list-name">{{ s.name }}</span>
                  <span class="list-code">{{ s.code }}</span>
                </div>
                <span :class="['status-tag-modern', s.is_active ? 'active' : 'inactive']">
                  {{ s.is_active ? 'Active' : 'Inactive' }}
                </span>
                <div class="list-actions">
                  <button @click="openEditStallModal(s)" class="action-btn-icon" title="Edit">✏️</button>
                  <button @click="toggleStallStatus(s)" class="action-btn-icon" :title="s.is_active ? 'Deactivate' : 'Activate'">
                    {{ s.is_active ? '⏸️' : '▶️' }}
                  </button>
                  <button @click="deleteStall(s.id, s.name)" class="action-btn-icon danger" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== USERS TAB ===== -->
      <div v-if="activeTab === 'users'" class="tab-panel-modern">
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3>👥 User Management</h3>
              <span class="section-subtitle">{{ filteredUsersList.length }} users</span>
            </div>
            <button @click="openUserModal()" class="btn-modern-sm primary">+ New User</button>
          </div>
          <div class="section-body">
            <div class="filter-bar-modern">
              <div class="search-box-modern">
                <input 
                  type="text" 
                  v-model="userSearch" 
                  placeholder="🔍 Search users..." 
                  class="search-input-modern"
                />
              </div>
              <select v-model="userRoleFilter" class="filter-select-modern">
                <option value="all">All Roles</option>
                <option value="stall_admin">👤 Admin</option>
                <option value="cashier">💰 Cashier</option>
              </select>
            </div>

            <div v-if="filteredUsersList.length === 0" class="empty-state-modern">
              <span>👥</span>
              <p>No users found</p>
            </div>

            <div v-for="(u, index) in filteredUsersList" :key="u.id" class="list-item-modern">
              <div class="list-item-content-modern">
                <span class="list-index">{{ index + 1 }}</span>
                <div class="list-info">
                  <span class="list-name">{{ u.username }}</span>
                  <span class="list-sub">{{ u.full_name || '-' }}</span>
                </div>
                <span class="role-tag-modern">{{ u.role }}</span>
                <span class="list-stalls">{{ (u.assigned_stalls || []).map(s => s.name).join(', ') || '-' }}</span>
                <div class="list-actions">
                  <button @click="openEditUserModal(u)" class="action-btn-icon" title="Edit">✏️</button>
                  <button @click="deleteUser(u.id, u.username)" class="action-btn-icon danger" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MENU MANAGEMENT TAB ===== -->
      <div v-if="activeTab === 'menu'" class="tab-panel-modern">
        <div class="section-card">
          <div class="section-header">
            <div>
              <h3>📋 Menu Management</h3>
              <span class="section-subtitle">Manage your menu items</span>
            </div>
            <button @click="openMenuModal()" class="btn-modern-sm primary">+ New Item</button>
          </div>
          <div class="section-body">
            <div class="filter-bar-modern">
              <div class="search-box-modern">
                <input 
                  type="text" 
                  v-model="menuSearch" 
                  placeholder="🔍 Search menu items..." 
                  class="search-input-modern"
                />
              </div>
              <select v-model="menuCategoryFilter" class="filter-select-modern">
                <option value="all">All Categories</option>
                <option value="Main">Main</option>
                <option value="Side">Side</option>
                <option value="Drink">Drink</option>
                <option value="Dessert">Dessert</option>
              </select>
              <span class="filter-result-modern">{{ filteredMenuItems.length }} items</span>
            </div>

            <div v-if="filteredMenuItems.length === 0" class="empty-state-modern">
              <span>📋</span>
              <p>No menu items found</p>
            </div>

            <div v-for="(item, index) in filteredMenuItems" :key="item.item_name" class="menu-item-modern">
              <div class="menu-item-content-modern">
                <span class="menu-index">{{ index + 1 }}</span>
                <div class="menu-info">
                  <span class="menu-name">{{ item.item_name }}</span>
                  <span class="menu-price">{{ formatCurrency(item.price) }}</span>
                  <span class="menu-category">{{ item.category || 'Main' }}</span>
                </div>
                <div class="menu-recipe">
                  <span class="recipe-label">Recipe:</span>
                  <span v-if="item.recipe && item.recipe.length > 0" class="recipe-items">
                    {{ item.recipe.map(r => `${r.material_name}: ${r.quantity_used}${getUnit(r.material_name)}`).join(', ') }}
                  </span>
                  <span v-else class="recipe-empty">No recipe</span>
                </div>
                <div class="menu-actions">
                  <button @click="openEditMenuModal(item)" class="action-btn-icon" title="Edit">✏️</button>
                  <button @click="deleteMenuItem(item.item_name)" class="action-btn-icon danger" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- MODALS                                       -->
    <!-- ============================================ -->

    <!-- Stall Detail Modal -->
    <div v-if="stallDetailModal" class="modal-overlay-modern" @click.self="closeStallDetailModal">
      <div class="modal-modern-large">
        <div class="modal-header-modern">
          <h3>🏪 {{ selectedStall?.name || 'Stall Details' }}</h3>
          <button @click="closeStallDetailModal" class="modal-close-modern">✕</button>
        </div>
        <div class="modal-body-modern">
          <div class="detail-grid-modern">
            <div class="detail-card">
              <span class="detail-label">Revenue</span>
              <span class="detail-value">{{ formatCurrency(selectedStall?.revenue || 0) }}</span>
            </div>
            <div class="detail-card">
              <span class="detail-label">Items Sold</span>
              <span class="detail-value">{{ selectedStall?.items || 0 }}</span>
            </div>
            <div class="detail-card">
              <span class="detail-label">Avg Transaction</span>
              <span class="detail-value">{{ formatCurrency(selectedStall?.avgTransaction || 0) }}</span>
            </div>
            <div class="detail-card">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span :class="['status-badge-modern', getStallStatusClass(selectedStall)]">
                  {{ getStallStatus(selectedStall) }}
                </span>
              </span>
            </div>
          </div>
          <div class="detail-chart-modern">
            <h4>Sales Trend</h4>
            <div ref="stallDetailChartRef" class="detail-chart-container"></div>
          </div>
        </div>
        <div class="modal-footer-modern">
          <button @click="closeStallDetailModal" class="btn-modern-sm secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Menu Item Detail Modal -->
    <div v-if="menuDetailModal" class="modal-overlay-modern" @click.self="closeMenuDetailModal">
      <div class="modal-modern-large">
        <div class="modal-header-modern">
          <h3>🍗 {{ selectedMenuItem?.name || 'Menu Item Details' }}</h3>
          <button @click="closeMenuDetailModal" class="modal-close-modern">✕</button>
        </div>
        <div class="modal-body-modern">
          <div class="detail-grid-modern">
            <div class="detail-card">
              <span class="detail-label">Total Revenue</span>
              <span class="detail-value">{{ formatCurrency(selectedMenuItem?.revenue || 0) }}</span>
            </div>
            <div class="detail-card">
              <span class="detail-label">Quantity Sold</span>
              <span class="detail-value">{{ selectedMenuItem?.quantity || 0 }}</span>
            </div>
            <div class="detail-card">
              <span class="detail-label">Average Price</span>
              <span class="detail-value">{{ formatCurrency((selectedMenuItem?.revenue || 0) / (selectedMenuItem?.quantity || 1)) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer-modern">
          <button @click="closeMenuDetailModal" class="btn-modern-sm secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Logo Upload Modal -->
    <div v-if="logoUploadModal" class="modal-overlay-modern" @click.self="logoUploadModal=false">
      <div class="modal-modern">
        <div class="modal-header-modern">
          <h3>Upload Company Logo</h3>
          <button @click="logoUploadModal=false" class="modal-close-modern">✕</button>
        </div>
        <div class="modal-body-modern">
          <div class="logo-upload-area-modern" @dragover.prevent @drop.prevent="handleLogoDrop">
            <input type="file" ref="logoInput" accept="image/*" @change="handleLogoUpload" style="display:none" />
            <button @click="$refs.logoInput.click()" class="btn-modern-sm primary">📁 Choose Image</button>
            <p class="upload-hint-modern">Drag & drop or click to upload (PNG, JPG, SVG)</p>
          </div>
          <div v-if="tempLogoPreview" class="logo-preview-modern">
            <img :src="tempLogoPreview" alt="Logo preview" />
          </div>
        </div>
        <div class="modal-footer-modern">
          <button @click="logoUploadModal=false" class="btn-modern-sm secondary">Cancel</button>
          <button @click="saveLogo" class="btn-modern-sm primary">Save Logo</button>
        </div>
      </div>
    </div>

    <!-- Menu Item Modal with Image Upload -->
    <div v-if="menuModal" class="modal-overlay-modern" @click.self="closeMenuModal">
      <div class="modal-modern-large">
        <div class="modal-header-modern">
          <h3>{{ editingMenu ? 'Edit Menu Item' : 'New Menu Item' }}</h3>
          <button @click="closeMenuModal" class="modal-close-modern">✕</button>
        </div>
        <div class="modal-body-modern">
          <div class="modal-form-grid">
            <div class="form-group-modern">
              <label>Item Name</label>
              <input v-model="menuForm.item_name" placeholder="e.g., AGG" :disabled="editingMenu" />
            </div>
            <div class="form-group-modern">
              <label>Price (RM)</label>
              <input type="number" v-model="menuForm.price" placeholder="0.00" step="0.5" />
            </div>
          </div>
          <div class="modal-form-grid">
            <div class="form-group-modern">
              <label>Category</label>
              <input v-model="menuForm.category" placeholder="e.g., Main, Side, Drink" />
            </div>
            <div class="form-group-modern">
              <label>Description</label>
              <input v-model="menuForm.description" placeholder="Brief description" />
            </div>
          </div>
          <div class="form-group-modern">
            <label>Item Image</label>
            <div class="image-upload-area" @dragover.prevent @drop.prevent="handleMenuImageDrop">
              <input type="file" ref="menuImageInput" accept="image/*" @change="handleMenuImageUpload" style="display:none" />
              <div v-if="menuForm.imagePreview" class="image-preview">
                <img :src="menuForm.imagePreview" alt="Menu item" />
                <button @click="menuForm.imagePreview = null; menuForm.imageFile = null" class="remove-image">✕</button>
              </div>
              <div v-else class="image-placeholder" @click="$refs.menuImageInput.click()">
                <span>📷</span>
                <p>Click to upload image</p>
              </div>
            </div>
          </div>
          <div class="form-group-modern">
            <label>Recipe (Ingredients)</label>
            <div v-for="(ingredient, index) in menuForm.recipe" :key="index" class="recipe-row-modern">
              <input v-model="ingredient.material_name" placeholder="Material" class="recipe-input-modern" />
              <input type="number" v-model="ingredient.quantity_used" placeholder="Qty" class="recipe-input-small-modern" step="0.5" />
              <button @click="removeRecipeIngredient(index)" class="action-btn-icon danger">✕</button>
            </div>
            <button @click="addRecipeIngredient" class="btn-modern-sm secondary">+ Add Ingredient</button>
          </div>
        </div>
        <div class="modal-footer-modern">
          <button @click="closeMenuModal" class="btn-modern-sm secondary">Cancel</button>
          <button @click="saveMenuItem" class="btn-modern-sm primary">{{ editingMenu ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <div v-if="userModal" class="modal-overlay-modern" @click.self="closeUserModal">
      <div class="modal-modern-large">
        <div class="modal-header-modern">
          <h3>{{ editingUser ? 'Edit User' : 'New User' }}</h3>
          <button @click="closeUserModal" class="modal-close-modern">✕</button>
        </div>
        <div class="modal-body-modern">
          <div class="modal-form-grid">
            <div class="form-group-modern">
              <label>Username</label>
              <input v-model="userForm.username" placeholder="Username" :disabled="editingUser" />
            </div>
            <div class="form-group-modern">
              <label>Full Name</label>
              <input v-model="userForm.full_name" placeholder="Full Name" />
            </div>
          </div>
          <div class="modal-form-grid">
            <div class="form-group-modern">
              <label>Password</label>
              <input v-if="!editingUser" type="password" v-model="userForm.password" placeholder="Password" />
              <input v-else type="password" v-model="userForm.password" placeholder="Leave blank to keep" />
            </div>
            <div class="form-group-modern">
              <label>Role</label>
              <select v-model="userForm.role">
                <option value="stall_admin">Stall Admin</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
          </div>
          <div class="form-group-modern">
            <label>Assign Stalls:</label>
            <select multiple class="stall-select-modern" v-model="userForm.stall_ids">
              <option v-for="s in stalls" :value="s.id">{{ s.name }}</option>
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
          </div>
        </div>
        <div class="modal-footer-modern">
          <button @click="closeUserModal" class="btn-modern-sm secondary">Cancel</button>
          <button @click="saveUser" class="btn-modern-sm primary">{{ editingUser ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>

    <!-- Stall Modal -->
    <div v-if="stallModal" class="modal-overlay-modern" @click.self="stallModal=false">
      <div class="modal-modern">
        <div class="modal-header-modern">
          <h3>{{ editingStall ? 'Edit Stall' : 'New Stall' }}</h3>
          <button @click="stallModal=false" class="modal-close-modern">✕</button>
        </div>
        <div class="modal-body-modern">
          <div class="form-group-modern">
            <label>Stall Name</label>
            <input v-model="stallForm.name" placeholder="Stall Name" />
          </div>
          <div class="form-group-modern">
            <label>Stall Code</label>
            <input v-model="stallForm.code" placeholder="Stall Code" />
          </div>
          <div class="form-group-modern">
            <label>Location</label>
            <input v-model="stallForm.location" placeholder="Location" />
          </div>
        </div>
        <div class="modal-footer-modern">
          <button @click="stallModal=false" class="btn-modern-sm secondary">Cancel</button>
          <button @click="saveStall" class="btn-modern-sm primary">{{ editingStall ? 'Update' : 'Create' }}</button>
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
      mobileMenuOpen: false,
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
      companyLogo: localStorage.getItem('companyLogo') || null,
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
      
      // Logo
      logoUploadModal: false,
      tempLogoPreview: null,
      tempLogoFile: null,
      
      // Detail Modals
      stallDetailModal: false,
      selectedStall: null,
      menuDetailModal: false,
      selectedMenuItem: null,
      stallDetailChartInstance: null,
      
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
        recipe: [],
        imagePreview: null,
        imageFile: null
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
    if (this.stallDetailChartInstance) {
      this.stallDetailChartInstance.dispose()
      this.stallDetailChartInstance = null
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
    // MOBILE MENU
    // =============================================
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
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
        this.$emit('show-notification', 'Logo updated successfully!', 'success')
        // Emit event to update App.vue logo
        this.$root.$emit('logo-updated', this.tempLogoPreview)
      }
    },
    
    // =============================================
    // MENU IMAGE MANAGEMENT
    // =============================================
    handleMenuImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.menuForm.imageFile = file
        const reader = new FileReader()
        reader.onload = (e) => {
          this.menuForm.imagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    handleMenuImageDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.menuForm.imageFile = file
        const reader = new FileReader()
        reader.onload = (e) => {
          this.menuForm.imagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    
    // =============================================
    // STALL DETAILS
    // =============================================
    viewStallDetails(stall) {
      this.selectedStall = stall
      this.stallDetailModal = true
      this.$nextTick(() => {
        this.initStallDetailChart()
      })
    },
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
      
      // Use actual sales trend data if available
      const salesData = this.salesTrend || []
      const days = salesData.map(d => this.formatShortDate(d.date))
      const revenues = salesData.map(d => d.revenue || 0)
      
      // If no data, use mock data
      const finalDays = days.length > 0 ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const finalRevenues = revenues.length > 0 ? revenues : Array.from({length: 7}, () => Math.floor(Math.random() * 500) + 50)
      
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
    // MENU MANAGEMENT - CRUD
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
          recipe: this.menuForm.recipe.filter(r => r.material_name && r.quantity_used > 0),
          image: this.menuForm.imagePreview // Save image as base64
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
      this.mobileMenuOpen = false
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
        
        if (this.selectedPeriod === 'today' && dailySales.length === 0) {
          this.consolidatedSales.topStall = '-'
          this.consolidatedSales.topRevenue = 0
        } else {
          this.consolidatedSales.topStall = data.topStall || '-'
          this.consolidatedSales.topRevenue = parseFloat(data.topRevenue) || 0
        }
        
        this.productSales = data.productSales || {}
        
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
/* MODERN HEADER WITH HAMBURGER                */
/* ============================================ */
.dashboard-header-modern {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hamburger-btn {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.hamburger-btn:hover {
  background: var(--background);
}

.hamburger-line {
  width: 22px;
  height: 2px;
  background: var(--text);
  border-radius: 2px;
  transition: var(--transition);
}

.hamburger-line.active:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}

.hamburger-line.active:nth-child(2) {
  opacity: 0;
}

.hamburger-line.active:nth-child(3) {
  transform: rotate(-45deg) translate(4px, -4px);
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-container {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: var(--transition);
}

.logo-container:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.header-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder-text {
  font-size: 1.5rem;
}

.logo-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition);
  color: white;
  font-size: 1.2rem;
}

.logo-container:hover .logo-upload-overlay {
  opacity: 1;
}

.brand-text h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
  line-height: 1.2;
}

.brand-text span {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.period-selector-compact {
  display: flex;
  gap: 0.25rem;
}

.period-btn-compact {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 500;
  transition: var(--transition);
  color: var(--text-secondary);
}

.period-btn-compact:hover {
  border-color: var(--primary);
  color: var(--text);
}

.period-btn-compact.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border-color: var(--primary);
}

.header-actions-compact {
  display: flex;
  gap: 0.35rem;
}

.action-btn-compact {
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.85rem;
  transition: var(--transition);
  color: var(--text-secondary);
}

.action-btn-compact:hover {
  border-color: var(--primary);
  color: var(--text);
}

.action-btn-compact.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
}

.action-btn-compact.primary:hover {
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.action-btn-compact.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================ */
/* MOBILE MENU                                  */
/* ============================================ */
.mobile-menu {
  display: none;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-menu.open {
  display: flex;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  transition: var(--transition);
  font-size: 0.85rem;
  color: var(--text-secondary);
  width: 100%;
  text-align: left;
}

.mobile-menu-item:hover {
  background: var(--background);
  color: var(--text);
}

.mobile-menu-item.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
}

.menu-item-icon {
  font-size: 1rem;
}

.menu-item-label {
  font-size: 0.85rem;
}

.menu-badge {
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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ============================================ */
/* DESKTOP TAB NAVIGATION                      */
/* ============================================ */
.tab-navigation-desktop {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.tab-btn-desktop {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.tab-btn-desktop:hover {
  background: var(--background);
  color: var(--text);
}

.tab-btn-desktop.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  box-shadow: 0 2px 8px rgba(249, 73, 8, 0.2);
}

.tab-icon {
  font-size: 0.9rem;
}

.tab-label {
  font-size: 0.8rem;
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
/* STATS GRID MODERN                           */
/* ============================================ */
.stats-grid-modern {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.stat-card-modern {
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

.stat-card-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--stat-color, var(--primary));
  opacity: 0.6;
}

.stat-card-modern:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.stat-card-modern.clickable {
  cursor: pointer;
}

.stat-card-modern.clickable:hover {
  border-color: var(--stat-color);
}

.stat-hover-modern {
  position: absolute;
  bottom: 0.25rem;
  right: 1rem;
  font-size: 0.6rem;
  color: var(--stat-color);
  opacity: 0;
  transition: var(--transition);
}

.stat-card-modern.clickable:hover .stat-hover-modern {
  opacity: 1;
}

.stat-icon-modern {
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

.stat-content-modern {
  flex: 1;
}

.stat-number-modern {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.stat-label-modern {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-trend-modern {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 20px;
  background: var(--background);
}

.stat-trend-modern.up { color: #10b981; }
.stat-trend-modern.down { color: #ef4444; }

/* ============================================ */
/* TAB CONTENT MODERN                          */
/* ============================================ */
.tab-content-modern {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.tab-panel-modern {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ============================================ */
/* SECTION CARDS                                */
/* ============================================ */
.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.section-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  background: var(--background);
}

.section-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.section-subtitle {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.section-badge {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--surface);
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.section-body {
  padding: 1rem;
}

/* ============================================ */
/* KPI GRID MODERN                              */
/* ============================================ */
.kpi-grid-modern {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.kpi-card-modern {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  text-align: center;
  transition: var(--transition);
}

.kpi-card-modern:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.kpi-card-modern.highlight {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(249, 73, 8, 0.05), rgba(250, 106, 46, 0.05));
}

.kpi-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  margin: 0.15rem 0;
}

.kpi-change {
  font-size: 0.65rem;
  font-weight: 600;
}

.kpi-change.positive { color: #10b981; }
.kpi-change.negative { color: #ef4444; }

/* ============================================ */
/* CHART SECTION                                */
/* ============================================ */
.chart-section.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--surface);
  border-radius: 0;
  border: none;
  margin: 0;
  padding: 1rem;
  overflow: auto;
}

.chart-actions {
  display: flex;
  gap: 0.35rem;
}

.action-btn-small {
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
  transition: var(--transition);
  color: var(--text-tertiary);
}

.action-btn-small:hover {
  border-color: var(--primary);
  color: var(--text);
}

.chart-stats-mini {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.chart-stat-mini {
  text-align: center;
}

.stat-mini-label {
  display: block;
  font-size: 0.55rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-mini-value {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
}

.stat-mini-value.up { color: #10b981; }
.stat-mini-value.down { color: #ef4444; }

.stat-mini-sub {
  font-size: 0.5rem;
  color: var(--text-tertiary);
}

/* ============================================ */
/* ECHARTS CONTAINER                           */
/* ============================================ */
.echarts-container-modern {
  width: 100%;
  height: 280px;
}

.chart-wrapper-modern {
  position: relative;
  width: 100%;
  min-height: 280px;
}

.chart-container-modern {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-empty-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
  color: var(--text-secondary);
}

.chart-empty-modern span {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.chart-empty-modern p {
  font-size: 0.85rem;
  margin: 0;
}

/* ============================================ */
/* CHART NAVIGATION                            */
/* ============================================ */
.chart-nav-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.35rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.nav-btn-modern {
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
  transition: var(--transition);
  color: var(--text-secondary);
}

.nav-btn-modern:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--text);
}

.nav-btn-modern:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-btn-modern.reset {
  border-color: var(--primary);
  color: var(--primary);
}

.nav-btn-modern.reset:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.nav-label-modern {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

/* ============================================ */
/* RANK ITEMS                                   */
/* ============================================ */
.rank-item-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.rank-item-modern:last-child {
  border-bottom: none;
}

.rank-item-modern.clickable {
  cursor: pointer;
  transition: var(--transition);
}

.rank-item-modern.clickable:hover {
  background: var(--background);
  transform: translateX(4px);
  border-radius: var(--radius-sm);
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 140px;
}

.rank-number {
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

.rank-number.gold { background: #fbbf24; color: #78350f; }
.rank-number.silver { background: #d1d5db; color: #374151; }
.rank-number.bronze { background: #f59e0b; color: #78350f; }

.rank-name {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text);
}

.rank-qty {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.rank-bar-modern {
  flex: 1;
  height: 4px;
  background: var(--background);
  border-radius: 2px;
  overflow: hidden;
}

.rank-fill-modern {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--primary);
}

.rank-fill-modern.gold { background: #fbbf24; }
.rank-fill-modern.silver { background: #d1d5db; }
.rank-fill-modern.bronze { background: #f59e0b; }
.rank-fill-modern.menu { background: linear-gradient(90deg, var(--primary), var(--primary-light)); }

.rank-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 80px;
  justify-content: flex-end;
}

.rank-revenue {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.rank-click-hint {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  opacity: 0;
  transition: var(--transition);
}

.rank-item-modern.clickable:hover .rank-click-hint {
  opacity: 1;
}

/* ============================================ */
/* FILTER BAR MODERN                           */
/* ============================================ */
.filter-bar-modern {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-box-modern {
  flex: 1;
  min-width: 140px;
}

.search-input-modern {
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  transition: var(--transition);
}

.search-input-modern:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.06);
}

.filter-select-modern {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  min-width: 110px;
}

.filter-select-modern:focus {
  outline: none;
  border-color: var(--primary);
}

.filter-result-modern {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  background: var(--background);
  border-radius: 16px;
  border: 1px solid var(--border-light);
}

/* ============================================ */
/* INVENTORY MODERN                             */
/* ============================================ */
.inventory-stall-modern {
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

.stall-info-modern {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.stall-name-modern {
  font-weight: 600;
  font-size: 0.85rem;
}

.stall-summary-modern {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.inventory-tag-modern {
  background: var(--background);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  font-size: 0.65rem;
  border: 1px solid var(--border-light);
}

.low-dot {
  color: #dc2626;
  font-size: 0.6rem;
}

.toggle-icon-modern {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.inventory-details-modern {
  padding: 0.75rem;
  border-top: 1px solid var(--border-light);
  background: var(--background);
}

.inventory-grid-modern {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.inventory-item-modern {
  background: var(--surface);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.inventory-item-modern.low {
  border-color: #dc2626;
  background: #fef2f2;
}

.item-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.item-name-modern {
  font-weight: 600;
  font-size: 0.8rem;
}

.item-status-modern {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.05rem 0.3rem;
  border-radius: 8px;
}

.item-status-modern.ok { background: #d1fae5; color: #059669; }
.item-status-modern.low { background: #fee2e2; color: #dc2626; }

.item-level-modern {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.item-current {
  font-weight: 600;
  color: var(--text);
}

.item-progress-modern {
  margin: 0.35rem 0;
}

.progress-track-modern {
  width: 100%;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill-modern {
  height: 100%;
  border-radius: 2px;
  background: #10b981;
  transition: width 0.3s ease;
}

.progress-fill-modern.low {
  background: #ef4444;
}

.item-actions-modern {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  align-items: center;
}

.item-input-modern {
  width: 50px;
  padding: 0.15rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.75rem;
}

.item-input-modern:focus {
  outline: none;
  border-color: var(--primary);
}

.inventory-actions-modern {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

/* ============================================ */
/* ALERTS SECTION                               */
/* ============================================ */
.alerts-section-modern {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.alerts-section-modern h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.alert-row-modern {
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

.alert-stall { font-weight: 600; }
.alert-material { color: var(--text-secondary); }
.alert-level { font-weight: 600; color: #dc2626; }
.alert-threshold { font-size: 0.65rem; color: var(--text-tertiary); }

/* ============================================ */
/* LIST ITEMS MODERN                            */
/* ============================================ */
.list-item-modern {
  border-bottom: 1px solid var(--border-light);
  padding: 0.35rem 0;
}

.list-item-modern:last-child {
  border-bottom: none;
}

.list-item-content-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.list-index {
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

.list-info {
  flex: 1;
  min-width: 100px;
}

.list-name {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text);
}

.list-sub {
  display: block;
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.list-code {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: monospace;
}

.list-stalls {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.list-actions {
  display: flex;
  gap: 0.15rem;
}

.action-btn-icon {
  padding: 0.1rem 0.3rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: var(--transition);
  color: var(--text-secondary);
}

.action-btn-icon:hover {
  background: var(--background);
  color: var(--text);
}

.action-btn-icon.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* ============================================ */
/* MENU ITEMS MODERN                            */
/* ============================================ */
.menu-item-modern {
  border-bottom: 1px solid var(--border-light);
  padding: 0.5rem 0;
}

.menu-item-modern:last-child {
  border-bottom: none;
}

.menu-item-content-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.menu-index {
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

.menu-info {
  flex: 1;
  min-width: 120px;
}

.menu-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
}

.menu-price {
  font-size: 0.8rem;
  color: var(--primary);
  font-weight: 600;
  margin-left: 0.5rem;
}

.menu-category {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  margin-left: 0.5rem;
}

.menu-recipe {
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

.menu-actions {
  display: flex;
  gap: 0.15rem;
}

/* ============================================ */
/* STATUS TAGS MODERN                          */
/* ============================================ */
.status-tag-modern {
  padding: 0.05rem 0.4rem;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-tag-modern.active { background: #d1fae5; color: #059669; }
.status-tag-modern.inactive { background: #fee2e2; color: #dc2626; }
.status-tag-modern.danger { background: #fee2e2; color: #dc2626; }

.role-tag-modern {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge-modern {
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge-modern.active { background: #d1fae5; color: #059669; }
.status-badge-modern.inactive { background: #fee2e2; color: #dc2626; }
.status-badge-modern.excellent { background: #d1fae5; color: #059669; }
.status-badge-modern.good { background: #dbeafe; color: #2563eb; }
.status-badge-modern.average { background: #fef3c7; color: #d97706; }
.status-badge-modern.poor { background: #fee2e2; color: #dc2626; }
.status-badge-modern.no-sales { background: #f3f4f6; color: #6b7280; }

/* ============================================ */
/* BUTTONS MODERN                               */
/* ============================================ */
.btn-modern-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.7rem;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: var(--transition);
}

.btn-modern-sm.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
}

.btn-modern-sm.primary:hover {
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
  transform: translateY(-1px);
}

.btn-modern-sm.secondary {
  background: var(--background);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-modern-sm.secondary:hover {
  background: var(--surface-elevated);
  color: var(--text);
}

/* ============================================ */
/* MODALS MODERN                                */
/* ============================================ */
.modal-overlay-modern {
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

.modal-modern-large {
  max-width: 600px;
  width: 92%;
}

.modal-header-modern {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header-modern h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.modal-close-modern {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0 0.25rem;
}

.modal-close-modern:hover {
  color: var(--text);
}

.modal-body-modern {
  padding: 1.25rem;
  overflow-y: auto;
  max-height: 60vh;
}

.modal-footer-modern {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* ============================================ */
/* DETAIL MODALS                                */
/* ============================================ */
.detail-grid-modern {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.detail-card {
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

.detail-chart-modern {
  margin-top: 1rem;
}

.detail-chart-modern h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text);
}

.detail-chart-container {
  width: 100%;
  height: 200px;
}

/* ============================================ */
/* FORM GROUP MODERN                            */
/* ============================================ */
.modal-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.form-group-modern {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.form-group-modern label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-group-modern input,
.form-group-modern select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);
  width: 100%;
}

.form-group-modern input:focus,
.form-group-modern select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.06);
}

.form-group-modern small {
  font-size: 0.65rem;
  color: var(--text-tertiary);
}

.stall-select-modern {
  min-height: 60px;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
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
.recipe-row-modern {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.3rem;
}

.recipe-input-modern {
  flex: 1;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.8rem;
}

.recipe-input-small-modern {
  width: 60px;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.8rem;
}

/* ============================================ */
/* LOGO UPLOAD                                  */
/* ============================================ */
.logo-upload-area-modern {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: center;
  margin-bottom: 1rem;
}

.logo-upload-area-modern .btn-modern-sm {
  margin-bottom: 0.5rem;
}

.upload-hint-modern {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.logo-preview-modern {
  text-align: center;
  margin-top: 0.5rem;
}

.logo-preview-modern img {
  max-width: 120px;
  max-height: 120px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
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
/* RESPONSIVE                                   */
/* ============================================ */
@media (max-width: 1024px) {
  .stats-grid-modern { grid-template-columns: repeat(3, 1fr); }
  .kpi-grid-modern { grid-template-columns: repeat(2, 1fr); }
  .detail-grid-modern { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .hamburger-btn {
    display: flex;
  }
  
  .tab-navigation-desktop {
    display: none;
  }
  
  .mobile-menu {
    display: flex;
  }
  
  .header-top {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-left {
    justify-content: space-between;
  }
  
  .header-right {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .period-selector-compact {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .header-actions-compact {
    justify-content: center;
  }
  
  .stats-grid-modern { grid-template-columns: repeat(3, 1fr); }
  .stat-card-modern { padding: 0.75rem; }
  .stat-number-modern { font-size: 1.1rem; }
  
  .kpi-grid-modern { grid-template-columns: repeat(2, 1fr); }
  .kpi-value { font-size: 1.1rem; }
  
  .echarts-container-modern { height: 200px; }
  .chart-wrapper-modern { min-height: 200px; }
  
  .section-body { padding: 0.75rem; }
  
  .filter-bar-modern { flex-direction: column; }
  .search-box-modern { min-width: unset; }
  .filter-select-modern { min-width: unset; }
  
  .inventory-grid-modern { grid-template-columns: 1fr; }
  .inventory-stall-header { flex-direction: column; align-items: flex-start; }
  
  .modal-form-grid { grid-template-columns: 1fr; }
  .modal-modern, .modal-modern-large { width: 95%; }
  
  .rank-item-modern { flex-wrap: wrap; }
  .rank-left { min-width: unset; }
  .rank-right { min-width: unset; }
  
  .chart-nav-modern { flex-wrap: wrap; }
  .nav-label-modern { min-width: 60px; font-size: 0.6rem; }
  
  .menu-item-content-modern {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  
  .menu-recipe {
    min-width: unset;
    width: 100%;
  }
  
  .menu-actions {
    align-self: flex-end;
  }
  
  .recipe-row-modern { flex-wrap: wrap; }
  .detail-grid-modern { grid-template-columns: 1fr 1fr; }
  .detail-chart-container { height: 150px; }
  
  .list-item-content-modern {
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  
  .list-info {
    min-width: unset;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stats-grid-modern { grid-template-columns: 1fr 1fr; }
  .stat-card-modern { padding: 0.5rem; flex-direction: column; text-align: center; gap: 0.25rem; }
  .stat-icon-modern { width: 32px; height: 32px; font-size: 1rem; }
  .stat-number-modern { font-size: 0.95rem; }
  
  .kpi-grid-modern { grid-template-columns: 1fr 1fr; }
  .kpi-card-modern { padding: 0.5rem; }
  .kpi-value { font-size: 0.95rem; }
  
  .echarts-container-modern { height: 160px; }
  .chart-wrapper-modern { min-height: 160px; }
  
  .chart-stats-mini { grid-template-columns: repeat(2, 1fr); }
  .stat-mini-value { font-size: 0.75rem; }
  
  .brand-text h2 { font-size: 0.95rem; }
  .logo-container { width: 34px; height: 34px; }
  .logo-placeholder-text { font-size: 1.2rem; }
  
  .period-btn-compact { font-size: 0.55rem; padding: 0.15rem 0.4rem; }
  .tab-btn-desktop { padding: 0.25rem 0.5rem; font-size: 0.65rem; }
  .tab-label { font-size: 0.65rem; }
  
  .rank-left { flex-wrap: wrap; }
  .rank-right { justify-content: flex-start; }
  
  .detail-grid-modern { grid-template-columns: 1fr; }
  .detail-chart-container { height: 120px; }
  
  .menu-info { min-width: unset; width: 100%; }
  .menu-price { display: inline-block; }
  
  .list-actions { align-self: flex-end; }
}
</style>