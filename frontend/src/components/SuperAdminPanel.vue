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
          <div v-if="['dashboard', 'revenue', 'transactions', 'stalls', 'menu'].includes(activeTab)" class="period-dropdown-wrapper">
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
              
              <!-- Custom Date Range -->
              <div v-if="selectedPeriod === 'custom'" class="custom-date-range">
                <div class="date-range-inputs">
                  <div class="date-input-group">
                    <label>From</label>
                    <input type="date" v-model="customDateStart" @change="applyCustomRange" />
                  </div>
                  <div class="date-input-group">
                    <label>To</label>
                    <input type="date" v-model="customDateEnd" @change="applyCustomRange" />
                  </div>
                </div>
                <button @click="applyCustomRange" class="btn-modern primary small" style="width: 100%; margin-top: 0.5rem;">
                  Apply Range
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons - ONLY IN DASHBOARD -->
          <div class="action-buttons" v-if="activeTab === 'dashboard'">
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
        
        <!-- ========================================== -->
        <!-- ===== DASHBOARD TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'dashboard'" class="tab-panel">
          
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card glass clickable" style="--stat-color: #2563eb; --stat-color-alpha: rgba(37, 99, 235, 0.15);" @click="switchTab('stalls')">
              <div class="stat-icon">🏪</div>
              <div class="stat-content">
                <span class="stat-number">{{ stalls.length }}</span>
                <span class="stat-label">Total Stalls</span>
                <div class="stat-breakdown">
                  <span class="stat-breakdown-item active">● {{ stalls.filter(s => s.is_active).length }} Active</span>
                  <span class="stat-breakdown-divider">·</span>
                  <span class="stat-breakdown-item inactive">○ {{ stalls.filter(s => !s.is_active).length }} Inactive</span>
                </div>
                <span class="stat-sub-label">{{ stalls.length }} Total Stalls</span>
              </div>
              <div class="stat-trend up">↑ 12%</div>
              <div class="stat-hover">Click to view →</div>
            </div>
            
            <div class="stat-card glass clickable" style="--stat-color: #7c3aed; --stat-color-alpha: rgba(124, 58, 237, 0.15);" @click="switchTab('users')">
              <div class="stat-icon">👥</div>
              <div class="stat-content">
                <span class="stat-number">{{ users.filter(u => u.role !== 'super_super_admin' && u.role !== 'super_admin').length }}</span>
                <span class="stat-label">Total Users</span>
              </div>
              <div class="stat-trend up">↑ 8%</div>
              <div class="stat-hover">Click to view →</div>
            </div>
            
            <div class="stat-card glass clickable" style="--stat-color: #f59e0b; --stat-color-alpha: rgba(245, 158, 11, 0.15);" @click="switchTabWithSubTab('menu', 'assignment')">
              <div class="stat-icon">📋</div>
              <div class="stat-content">
                <span class="stat-number">{{ menuItems.length }}</span>
                <span class="stat-label">Menu Items</span>
                <div class="stat-breakdown">
                  <span class="stat-breakdown-item active">● {{ menuItems.filter(item => item.price > 0).length }} Active</span>
                </div>
                <span class="stat-sub-label">{{ menuItems.length }} Total Items</span>
              </div>
              <div class="stat-trend neutral">📋</div>
              <div class="stat-hover">Click to manage →</div>
            </div>
            
            <div class="stat-card glass clickable highlight" style="--stat-color: #dc2626; --stat-color-alpha: rgba(220, 38, 38, 0.15);" @click="switchTab('inventory')">
              <div class="stat-icon">⚠️</div>
              <div class="stat-content">
                <span class="stat-number">{{ lowStock.length }}</span>
                <span class="stat-label">Low Stock Alert</span>
                <span class="stat-sub-label" v-if="lowStock.length > 0">{{ lowStock.length }} items need attention</span>
                <span class="stat-sub-label" v-else>All stocks are healthy</span>
              </div>
              <div class="stat-trend" :class="lowStock.length > 0 ? 'down' : 'up'">
                {{ lowStock.length > 0 ? '⚠' : '✓' }}
              </div>
              <div class="stat-hover">Click to view →</div>
            </div>
          </div>

          <!-- ===== KPI CARDS WITH SPARKLINE ===== -->
          <div class="kpi-grid">
            <div class="kpi-card clickable" 
                style="--kpi-color: #F94908; --kpi-color-alpha: rgba(249, 73, 8, 0.08);" 
                @click="switchTab('revenue')">
              <div class="kpi-icon">💰</div>
              <div class="kpi-value">{{ formatCurrency(consolidatedSales.totalRevenue || 0) }}</div>
              <div class="kpi-label">Revenue</div>
              <div class="kpi-change" :class="getRevenueChange() >= 0 ? 'positive' : 'negative'">
                <span class="trend-icon">{{ getRevenueChange() >= 0 ? '↑' : '↓' }}</span>
                {{ Math.abs(getRevenueChange()).toFixed(1) }}%
              </div>
              <div class="kpi-trend-label" :class="getRevenueChange() >= 0 ? 'positive' : 'negative'">
                {{ getRevenueChange() >= 0 ? '↑ Upward trend' : '↓ Downward trend' }}
              </div>
              <div class="sparkline-container">
                <svg viewBox="0 0 200 40" preserveAspectRatio="none">
                  <polyline
                    :points="getSparklinePoints(salesTrend.map(d => d.revenue || 0))"
                    class="sparkline-line"
                    :style="{ stroke: getRevenueChange() >= 0 ? '#10b981' : '#ef4444' }"
                  />
                  <polyline
                    :points="getSparklinePoints(salesTrend.map(d => d.revenue || 0))"
                    class="sparkline-area"
                    :style="{ fill: getRevenueChange() >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }"
                  />
                </svg>
              </div>
              <div class="kpi-hover">Click to view revenue →</div>
            </div>

            <div class="kpi-card clickable" style="--kpi-color: #2563eb; --kpi-color-alpha: rgba(37, 99, 235, 0.08);" @click="switchTabWithSubTab('menu', 'performance')">
              <div class="kpi-icon">📈</div>
              <div class="kpi-value">{{ formatNumber(consolidatedSales.totalItems || 0) }}</div>
              <div class="kpi-label">Menu Sold</div>
              <div class="kpi-change" :class="getItemsChange() >= 0 ? 'positive' : 'negative'">
                <span class="trend-icon">{{ getItemsChange() >= 0 ? '↑' : '↓' }}</span>
                {{ Math.abs(getItemsChange()).toFixed(1) }}%
              </div>
              <div class="kpi-status-badge" :class="getMenuStatusClass(consolidatedSales.totalItems)">
                {{ getMenuStatusEmoji(consolidatedSales.totalItems) }} {{ getMenuStatus(consolidatedSales.totalItems) }}
              </div>
              <div class="sparkline-container">
                <svg viewBox="0 0 200 40" preserveAspectRatio="none">
                  <polyline
                    :points="getSparklinePoints(salesTrend.map(d => d.items || 0))"
                    class="sparkline-line"
                    :style="{ stroke: getItemsChange() >= 0 ? '#10b981' : '#ef4444' }"
                  />
                  <polyline
                    :points="getSparklinePoints(salesTrend.map(d => d.items || 0))"
                    class="sparkline-area"
                    :style="{ fill: getItemsChange() >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }"
                  />
                </svg>
              </div>
            </div>

            <div class="kpi-card" style="--kpi-color: #7c3aed; --kpi-color-alpha: rgba(124, 58, 237, 0.08);">
              <div class="kpi-icon">⭐</div>
              <div class="kpi-value">{{ formatCurrency(consolidatedSales.averagePerStall || 0) }}</div>
              <div class="kpi-label">Avg per Stall</div>
              <div class="kpi-change neutral">
                <span class="trend-icon">•</span>
                {{ stalls.length > 0 ? `${stalls.length} stalls` : 'No stalls' }}
              </div>
              <div class="sparkline-container">
                <svg viewBox="0 0 200 40" preserveAspectRatio="none">
                  <polyline
                    :points="getSparklinePoints(salesTrend.map(d => d.revenue / (stalls.length || 1) || 0))"
                    class="sparkline-line"
                    style="stroke: #7c3aed;"
                  />
                  <polyline
                    :points="getSparklinePoints(salesTrend.map(d => d.revenue / (stalls.length || 1) || 0))"
                    class="sparkline-area"
                    style="fill: rgba(124, 58, 237, 0.1);"
                  />
                </svg>
              </div>
            </div>

            <div class="kpi-card highlight clickable" style="--kpi-color: #f59e0b; --kpi-color-alpha: rgba(245, 158, 11, 0.08);" @click="switchTabWithSubTab('stalls', 'performance')">
              <div class="kpi-icon">🏆</div>
              <div class="kpi-value kpi-value-topstall">{{ getTopStallName() }}</div>
              <div class="kpi-label">Top Stall</div>
              <div class="kpi-change" v-if="getTopStallRevenue() > 0">
                <span class="trend-icon">🏆</span>
                {{ formatCurrency(getTopStallRevenue()) }}
              </div>
              <div class="kpi-change neutral" v-else>
                <span class="trend-icon">•</span>
                No sales yet
              </div>
              <div class="kpi-status-badge" :class="getTopStallStatusClass()">
                {{ getTopStallStatusEmoji() }} {{ getTopStallStatusText() }}
              </div>
              <div class="sparkline-container">
                <svg viewBox="0 0 200 40" preserveAspectRatio="none">
                  <polyline
                    :points="getSparklinePoints(salesTrend.map(d => d.revenue || 0))"
                    class="sparkline-line"
                    style="stroke: #f59e0b;"
                  />
                  <polyline
                    :points="getSparklinePoints(salesTrend.map(d => d.revenue || 0))"
                    class="sparkline-area"
                    style="fill: rgba(245, 158, 11, 0.1);"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Professional Chart -->
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
              <div class="chart-modern-stats" v-if="salesTrend.length > 0">
                <div class="chart-modern-stat">
                  <span class="chart-modern-stat-label">Peak</span>
                  <span class="chart-modern-stat-value">{{ formatCurrency(getPeakRevenue()) }}</span>
                  <span class="chart-modern-stat-sub">{{ getPeakDay() }}</span>
                </div>
                <div class="chart-modern-stat">
                  <span class="chart-modern-stat-label">Trend</span>
                  <span class="chart-modern-stat-value" :class="getTrendDirection()">
                    {{ getTrendDirection() === 'up' ? '↑' : getTrendDirection() === 'down' ? '↓' : '→' }}
                    {{ getTrendPercentage() }}%
                  </span>
                  <span class="chart-modern-stat-sub">{{ getTrendDirection() === 'up' ? 'Rising' : getTrendDirection() === 'down' ? 'Declining' : 'Stable' }}</span>
                </div>
                <div class="chart-modern-stat">
                  <span class="chart-modern-stat-label">Best Day</span>
                  <span class="chart-modern-stat-value">{{ getBestDayName() }}</span>
                  <span class="chart-modern-stat-sub">{{ formatCurrency(getBestDayRevenue()) }}</span>
                </div>
                <div class="chart-modern-stat">
                  <span class="chart-modern-stat-label">Total</span>
                  <span class="chart-modern-stat-value">{{ formatCurrency(getTotalRevenue()) }}</span>
                  <span class="chart-modern-stat-sub">{{ formatNumber(getTotalItems()) }} items</span>
                </div>
              </div>

              <div class="chart-wrapper" ref="chartWrapper">
                <div v-if="salesTrend.length > 0" class="chart-container">
                  <div ref="chartRef" class="echarts-container"></div>
                </div>
                <div v-else class="chart-modern-empty">
                  <span>📊</span>
                  <p>No sales data available for {{ getPeriodLabel() }}</p>
                </div>
              </div>

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

          <!-- ===== STALL PERFORMANCE ===== -->
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>🏆 Stall Performance</h3>
                <span class="card-subtitle">{{ dashboardStallPerformanceSubtitle }}</span>
              </div>
              <button 
                @click="switchTabWithSubTab('stalls', 'performance')" 
                class="btn-modern secondary small"
              >
                View All →
              </button>
            </div>
            <div class="card-modern-body stall-performance-table-container">
              <div v-if="dashboardDisplayStalls.length === 0" class="empty-state-modern">
                <span>📊</span>
                <p>No stall sales for {{ getPeriodLabel() }}</p>
                <p style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                  Try selecting a different period
                </p>
              </div>
              
              <div v-else class="stall-table-wrapper">
                <div class="stall-table-header">
                  <span class="stall-table-header-rank">Rank</span>
                  <span class="stall-table-header-name">Stall</span>
                  <span class="stall-table-header-revenue">Revenue</span>
                  <span class="stall-table-header-status">Status</span>
                  <span class="stall-table-header-details">Details</span>
                </div>
                
                <div class="stall-table-body">
                  <div 
                    v-for="(stall, index) in dashboardDisplayStalls" 
                    :key="stall.id" 
                    class="stall-table-row clickable-item"
                    @click="viewStallDetails(stall)"
                  >
                    <span class="stall-table-rank">
                      <span class="rank-number" :class="getRankClass(index)">
                        {{ index + 1 }}
                      </span>
                    </span>
                    
                    <span class="stall-table-name">
                      <span class="stall-name-text">{{ stall.name }}</span>
                      <span class="stall-name-bar">
                        <span class="stall-bar-fill" :style="{ width: getStallBarWidth(stall.revenue) + '%' }"></span>
                      </span>
                    </span>
                    
                    <span class="stall-table-revenue">{{ formatCurrency(stall.revenue || 0) }}</span>
                    
                    <span class="stall-table-status">
                      <span :class="['status-indicator', getStallStatusClass(stall)]">
                        {{ getStallStatusEmoji(stall) }} {{ getStallStatus(stall) }}
                      </span>
                    </span>
                    
                    <span class="stall-table-details">👆</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== MENU PERFORMANCE ===== -->
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>🍗 Menu Performance</h3>
                <span class="card-subtitle">Top selling items for {{ getPeriodLabel() }}</span>
              </div>
              <button @click="switchTabWithSubTab('menu', 'performance')" class="btn-modern secondary small">
                View All →
              </button>
            </div>
            <div class="card-modern-body menu-performance-table-container">
              <div v-if="menuPerformance.length === 0" class="empty-state-modern">
                <span>🍗</span>
                <p>No sales data available for {{ getPeriodLabel() }}</p>
              </div>
              
              <div v-else class="menu-table-wrapper">
                <div class="menu-table-header">
                  <span class="menu-table-header-rank">Rank</span>
                  <span class="menu-table-header-name">Menu</span>
                  <span class="menu-table-header-revenue">Revenue</span>
                  <span class="menu-table-header-status">Status</span>
                  <span class="menu-table-header-details">Details</span>
                </div>
                
                <div class="menu-table-body">
                  <div 
                    v-for="(item, index) in displayMenuItems" 
                    :key="item.name" 
                    class="menu-table-row clickable-item"
                    @click="viewMenuItemDetails(item)"
                  >
                    <span class="menu-table-rank">
                      <span class="rank-number" :class="getRankClass(index)">
                        {{ index + 1 }}
                      </span>
                    </span>
                    
                    <span class="menu-table-name">
                      <span class="menu-name-text">{{ item.name }}</span>
                      <span class="menu-name-bar">
                        <span class="menu-bar-fill" :style="{ width: getPerformancePercentage(item.quantity) + '%' }"></span>
                      </span>
                    </span>
                    
                    <span class="menu-table-revenue">{{ formatCurrency(item.revenue || 0) }}</span>
                    
                    <span class="menu-table-status">
                      <span :class="['status-indicator', getMenuStatusClass(item.quantity)]">
                        {{ getMenuStatusEmoji(item.quantity) }} {{ getMenuStatus(item.quantity) }}
                      </span>
                    </span>
                    
                    <span class="menu-table-details">👆</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ===== INVENTORY TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'inventory'" class="tab-panel">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>📦 Inventory Management</h3>
                <span class="card-subtitle">{{ filteredInventoryStalls.length }} stalls</span>
              </div>
              <div class="inventory-actions">
                <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
                <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                <button @click="openBulkUpdateModal" class="btn-modern primary" :disabled="selectedStalls.length === 0">
                  📦 Bulk Update ({{ selectedCount }})
                </button>
              </div>
            </div>
            <div class="card-modern-body">
              
              <div class="inventory-stats-grid">
                <div class="stat-chip">
                  <span class="stat-chip-label">Total Stalls</span>
                  <span class="stat-chip-value">{{ inventoryStats.total }}</span>
                </div>
                <div class="stat-chip active">
                  <span class="stat-chip-label">Active</span>
                  <span class="stat-chip-value">{{ inventoryStats.active }}</span>
                </div>
                <div class="stat-chip inactive">
                  <span class="stat-chip-label">Inactive</span>
                  <span class="stat-chip-value">{{ inventoryStats.inactive }}</span>
                </div>
                <div class="stat-chip warning">
                  <span class="stat-chip-label">⚠️ Low Stock</span>
                  <span class="stat-chip-value">{{ inventoryStats.lowStock }}</span>
                </div>
              </div>

              <div class="filter-bar-modern">
                <div class="filter-search">
                  <input 
                    type="text" 
                    v-model="inventorySearch" 
                    placeholder="Search stalls or materials..." 
                    class="filter-input"
                    @input="resetPagination"
                  />
                </div>
                
                <div class="filter-group">
                  <select v-model="stateFilter" class="filter-select" @change="resetPagination">
                    <option v-for="state in malaysiaStates" :key="state" :value="state">
                      {{ state }}
                    </option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <select v-model="inventoryFilter" class="filter-select" @change="resetPagination">
                    <option value="all">All Status</option>
                    <option value="active">🟢 Active</option>
                    <option value="inactive">⚪ Inactive</option>
                    <option value="low">⚠️ Low Stock</option>
                  </select>
                </div>

                <div class="filter-actions">
                  <button @click="toggleSelectAll" class="btn-modern secondary small">
                    {{ selectAll ? 'Deselect All' : 'Select All' }}
                  </button>
                  <button @click="clearFilters" class="btn-modern secondary small">
                    Clear Filters
                  </button>
                </div>
              </div>

              <div v-if="stalls.length === 0" class="empty-state-modern">
                <span>📦</span>
                <p>No stalls found. Contact your administrator.</p>
              </div>

              <div v-else>
                <div class="inventory-table-wrapper">
                  <div class="inventory-table-header">
                    <div class="inventory-table-cell checkbox">
                      <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
                    </div>
                    <div class="inventory-table-cell name">Stall</div>
                    <div class="inventory-table-cell state">State</div>
                    <div class="inventory-table-cell items">Inventory</div>
                    <div class="inventory-table-cell status">Status</div>
                    <div class="inventory-table-cell actions">Actions</div>
                  </div>

                  <div 
                    v-for="stall in paginatedStalls" 
                    :key="stall.id" 
                    class="inventory-table-row"
                    :class="{ selected: selectedStalls.includes(stall.id) }"
                  >
                    <div class="inventory-table-cell checkbox">
                      <input 
                        type="checkbox" 
                        :value="stall.id"
                        v-model="selectedStalls"
                      />
                    </div>
                    <div class="inventory-table-cell name">
                      <span class="stall-name">{{ stall.name }}</span>
                      <span class="stall-code">{{ stall.code }}</span>
                    </div>
                    <div class="inventory-table-cell state">
                      {{ stall.state || '-' }}
                    </div>
                    <div class="inventory-table-cell items">
                      <div 
                        v-for="item in getStallInventorySummary(stall.id)" 
                        :key="item.material_name" 
                        class="inventory-item-inline"
                        :class="{ 'low': item.current_level <= item.alert_level }"
                      >
                        <span class="item-name">{{ item.material_name }}</span>
                        <span class="item-level">{{ item.current_level }}</span>
                        <span v-if="item.current_level <= item.alert_level" class="item-warning">⚠️</span>
                      </div>
                    </div>
                    <div class="inventory-table-cell status">
                      <span :class="['status-badge', stall.is_active ? 'active' : 'inactive']">
                        {{ stall.is_active ? '🟢 Active' : '⚪ Inactive' }}
                      </span>
                      <span v-if="hasLowStock(stall.id)" class="status-badge low">
                        ⚠️ Low Stock
                      </span>
                    </div>
                    <div class="inventory-table-cell actions">
                      <button @click="openStallInventoryModal(stall.id)" class="btn-action" title="Top Up">
                        📦 Top Up
                      </button>
                    </div>
                  </div>
                </div>

                <div class="pagination-container">
                  <div class="pagination-info">
                    Showing {{ startIndex }} - {{ endIndex }} of {{ filteredInventoryStalls.length }} stalls
                  </div>
                  <div class="pagination-controls">
                    <button 
                      @click="prevPage" 
                      class="pagination-btn"
                      :disabled="currentPage <= 1"
                    >
                      ◀ Previous
                    </button>
                    <span class="pagination-page">
                      Page {{ currentPage }} of {{ totalPages }}
                    </span>
                    <button 
                      @click="nextPage" 
                      class="pagination-btn"
                      :disabled="currentPage >= totalPages"
                    >
                      Next ▶
                    </button>
                  </div>
                </div>

                <div class="inventory-quick-actions">
                  <button 
                    @click="openBulkUpdateModal" 
                    class="btn-modern primary"
                    :disabled="selectedStalls.length === 0"
                  >
                    📦 Update Selected ({{ selectedCount }})
                  </button>
                  <button 
                    @click="resetAllLowStock" 
                    class="btn-modern secondary"
                    :disabled="inventoryStats.lowStock === 0"
                  >
                    🔄 Reset Low Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ===== STALLS TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'stalls'" class="tab-panel">
          <div class="sub-tabs">
            <button 
              class="sub-tab" 
              :class="{ active: stallSubTab === 'management' }"
              @click="stallSubTab = 'management'"
            >
              🏪 Stall Management
            </button>
            <button 
              class="sub-tab" 
              :class="{ active: stallSubTab === 'performance' }"
              @click="stallSubTab = 'performance'"
            >
              📊 Stall Performance
            </button>
            <button 
              class="sub-tab" 
              :class="{ active: stallSubTab === 'shifts' }"
              @click="stallSubTab = 'shifts'"
            >
              🕐 Shift History
            </button>
          </div>
          
          <!-- ===== SHIFT HISTORY SUB-TAB ===== -->
          <div v-if="stallSubTab === 'shifts'" class="sub-tab-content">
            <div class="card-modern">
              <div class="card-modern-header">
                <div>
                  <h3>🕐 Shift History</h3>
                  <span class="card-subtitle">{{ shiftHistoryTotal }} shifts found</span>
                </div>
                <div class="header-actions">
                  <button @click="loadShiftHistory" class="btn-modern secondary small">⟳ Refresh</button>
                  <button @click="exportShiftHistory" class="btn-modern primary small">📊 Export</button>
                  <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                </div>
              </div>
              <div class="card-modern-body">
                <div class="filter-bar-modern">
                  <div class="filter-search">
                    <input 
                      type="text" 
                      v-model="shiftHistorySearch" 
                      placeholder="Search shifts..." 
                      class="filter-input"
                      @input="resetShiftPagination"
                    />
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="shiftHistoryStateFilter" class="filter-select" @change="resetShiftPagination; loadShiftHistory()">
                      <option v-for="state in malaysiaStates" :key="state" :value="state">
                        {{ state }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="shiftHistoryStallFilter" class="filter-select" @change="resetShiftPagination; loadShiftHistory()">
                      <option value="all">All Stalls</option>
                      <option 
                        v-for="stall in stalls" 
                        :key="stall.id" 
                        :value="stall.id"
                      >
                        {{ stall.name }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="shiftHistoryStatusFilter" class="filter-select" @change="resetShiftPagination">
                      <option value="all">All Status</option>
                      <option value="open">🟢 Open</option>
                      <option value="closed">⚪ Closed</option>
                    </select>
                  </div>
                  
                  <div class="filter-actions">
                    <button @click="clearShiftFilters" class="btn-modern secondary small">
                      Clear Filters
                    </button>
                  </div>
                </div>
                
                <div v-if="shiftHistoryLoading" class="loading-state">
                  <div class="loading-spinner"><div class="spinner-ring"></div></div>
                  <p>Loading shift history...</p>
                </div>
                
                <div v-else-if="filteredShiftHistory.length === 0" class="empty-state-modern">
                  <span>🕐</span>
                  <p>No shifts found matching your criteria</p>
                </div>
                
                <div v-else>
                  <div class="shift-history-table-wrapper">
                    <div class="shift-history-table-header">
                      <span class="shift-history-header-date">Date</span>
                      <span class="shift-history-header-stall">Stall</span>
                      <span class="shift-history-header-revenue">Revenue</span>
                      <span class="shift-history-header-transactions">Orders</span>
                      <span class="shift-history-header-float">Float</span>
                      <span class="shift-history-header-variance">Variance</span>
                      <span class="shift-history-header-inventory">Inventory Used</span>
                      <span class="shift-history-header-status">Status</span>
                      <span class="shift-history-header-details">Details</span>
                    </div>
                    
                    <div 
                      v-for="shift in paginatedShiftHistory" 
                      :key="shift.id" 
                      class="shift-history-table-row clickable-item"
                      @click="viewShiftDetails(shift)"
                    >
                      <span class="shift-history-date" data-label="Date">{{ formatDateTime(shift.opened_at) }}</span>
                      <span class="shift-history-stall" data-label="Stall">{{ getStallName(shift.stall_id) }}</span>
                      <span class="shift-history-revenue" data-label="Revenue">
                        {{ formatCurrency(shift.revenue || shift.total_revenue || 0) }}
                      </span>
                      <span class="shift-history-transactions" data-label="Orders">{{ shift.transaction_count || 0 }}</span>
                      <span class="shift-history-float" data-label="Float">{{ formatCurrency(shift.starting_float) }}</span>
                      <span class="shift-history-variance" data-label="Variance" :class="getVarianceClass(shift)">
                        {{ formatCurrency(shift.variance) }}
                      </span>
                      <span class="shift-history-inventory" data-label="Inventory Used">
                        <span v-if="shift.has_inventory_data && Object.keys(shift.inventory_usage || {}).length > 0">
                          <span 
                            v-for="(usage, material) in shift.inventory_usage" 
                            :key="material"
                            class="inventory-usage-tag"
                          >
                            {{ material }}: {{ usage }}
                          </span>
                        </span>
                        <span v-else class="no-inventory-data">-</span>
                      </span>
                      <span class="shift-history-status" data-label="Status">
                        <span class="status-badge" :class="shift.status">
                          {{ shift.status === 'open' ? '🟢 Open' : '⚪ Closed' }}
                        </span>
                      </span>
                      <span class="shift-history-details" data-label="Details">👆</span>
                    </div>
                  </div>
                  
                  <div class="pagination-container">
                    <div class="pagination-info">
                      Showing {{ shiftStartIndex }} - {{ shiftEndIndex }} of {{ filteredShiftHistory.length }} shifts
                    </div>
                    <div class="pagination-controls">
                      <button 
                        @click="prevShiftPage" 
                        class="pagination-btn"
                        :disabled="shiftCurrentPage <= 1"
                      >
                        ◀ Previous
                      </button>
                      <span class="pagination-page">
                        Page {{ shiftCurrentPage }} of {{ shiftTotalPages }}
                      </span>
                      <button 
                        @click="nextShiftPage" 
                        class="pagination-btn"
                        :disabled="shiftCurrentPage >= shiftTotalPages"
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== SHIFT DETAIL MODAL ===== -->
          <div v-if="shiftDetailModal" class="modal-overlay" @click.self="shiftDetailModal=false">
            <div class="modal-modern modal-lg">
              <div class="modal-modern-header">
                <h3>🕐 Shift Details</h3>
                <button @click="shiftDetailModal=false" class="modal-close-btn">✕</button>
              </div>
              <div class="modal-modern-body">
                <div v-if="selectedShift">
                  <div class="shift-detail-grid">
                    <div class="shift-detail-item">
                      <span class="label">Stall</span>
                      <span class="value">{{ getStallName(selectedShift.stall_id) }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Opened</span>
                      <span class="value">{{ formatDateTime(selectedShift.opened_at) }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Opened By</span>
                      <span class="value">{{ selectedShift.opened_by_name || '-' }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Closed</span>
                      <span class="value">{{ formatDateTime(selectedShift.closed_at) || '-' }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Closed By</span>
                      <span class="value">{{ selectedShift.closed_by_name || '-' }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Status</span>
                      <span class="value">
                        <span class="status-badge" :class="selectedShift.status">
                          {{ selectedShift.status === 'open' ? '🟢 Open' : '⚪ Closed' }}
                        </span>
                      </span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Starting Float</span>
                      <span class="value">{{ formatCurrency(selectedShift.starting_float) }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Revenue</span>
                      <span class="value revenue">{{ formatCurrency(selectedShift.revenue || 0) }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Orders</span>
                      <span class="value">{{ selectedShift.transaction_count || 0 }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Expected Cash</span>
                      <span class="value">{{ formatCurrency(selectedShift.expected_cash) }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Ending Cash</span>
                      <span class="value">{{ formatCurrency(selectedShift.ending_cash) }}</span>
                    </div>
                    <div class="shift-detail-item">
                      <span class="label">Variance</span>
                      <span class="value" :class="getVarianceClass(selectedShift)">
                        {{ formatCurrency(selectedShift.variance) }}
                      </span>
                    </div>
                  </div>
                  
                  <div v-if="selectedShift.opening_inventory || selectedShift.closing_inventory" class="shift-detail-inventory">
                    <h4>📦 Inventory</h4>
                    <div class="inventory-detail-grid">
                      <div class="inventory-detail-header">
                        <span class="inventory-detail-material">Material</span>
                        <span class="inventory-detail-opening">Opening</span>
                        <span class="inventory-detail-closing">Closing</span>
                        <span class="inventory-detail-usage">Used</span>
                      </div>
                      <div 
                        v-for="(opening, material) in selectedShift.opening_inventory" 
                        :key="material"
                        class="inventory-detail-row"
                      >
                        <span class="inventory-detail-material">{{ material }}</span>
                        <span class="inventory-detail-opening">{{ opening }}</span>
                        <span class="inventory-detail-closing">{{ selectedShift.closing_inventory?.[material] || 0 }}</span>
                        <span class="inventory-detail-usage" :class="getUsageClass(selectedShift, material)">
                          {{ getInventoryUsage(selectedShift, material) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="selectedShift.notes || selectedShift.closing_notes" class="shift-detail-notes">
                    <div v-if="selectedShift.notes">
                      <strong>Opening Notes:</strong>
                      <p>{{ selectedShift.notes }}</p>
                    </div>
                    <div v-if="selectedShift.closing_notes">
                      <strong>Closing Notes:</strong>
                      <p>{{ selectedShift.closing_notes }}</p>
                    </div>
                  </div>
                  
                  <div class="shift-detail-transactions">
                    <h4>📋 Orders ({{ selectedShift.transactions?.length || 0 }})</h4>
                    <div v-if="selectedShift.transactions?.length === 0" class="empty-state-modern small">
                      <span>📭</span>
                      <p>No orders for this shift</p>
                    </div>
                    <div v-else class="shift-transaction-list">
                      <div 
                        v-for="tx in selectedShift.transactions" 
                        :key="tx.id" 
                        class="shift-transaction-item"
                      >
                        <span class="tx-time">{{ formatTime(tx.created_at) }}</span>
                        <span class="tx-id">#{{ tx.order_number }}</span>
                        <span class="tx-items">{{ tx.item_count || 0 }} items</span>
                        <span class="tx-amount">{{ formatCurrency(tx.total_amount) }}</span>
                        <span class="tx-status" :class="tx.status || 'completed'">
                          {{ tx.status || 'completed' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-modern-footer">
                <button @click="shiftDetailModal=false" class="btn-modern secondary">Close</button>
                <button @click="exportShiftReport" class="btn-modern primary" v-if="selectedShift">📊 Export</button>
              </div>
            </div>
          </div>
          
          <!-- ===== STALL MANAGEMENT SUB-TAB ===== -->
          <div v-if="stallSubTab === 'management'" class="sub-tab-content">
            <div class="card-modern">
              <div class="card-modern-header">
                <div>
                  <h3>🏪 Stall Management</h3>
                  <span class="card-subtitle">{{ filteredStallsList.length }} stalls</span>
                </div>
                <div class="header-actions">
                  <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
                  <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                  <button @click="openStallModal()" class="btn-modern primary">+ New Stall</button>
                </div>
              </div>
              <div class="card-modern-body">
                <div class="inventory-stats-grid">
                  <div class="stat-chip">
                    <span class="stat-chip-label">Total Stalls</span>
                    <span class="stat-chip-value">{{ stallStats.total }}</span>
                  </div>
                  <div class="stat-chip active">
                    <span class="stat-chip-label">Active</span>
                    <span class="stat-chip-value">{{ stallStats.active }}</span>
                  </div>
                  <div class="stat-chip inactive">
                    <span class="stat-chip-label">Inactive</span>
                    <span class="stat-chip-value">{{ stallStats.inactive }}</span>
                  </div>
                  <div class="stat-chip warning">
                    <span class="stat-chip-label">⚠️ Low Stock</span>
                    <span class="stat-chip-value">{{ stallStats.lowStock }}</span>
                  </div>
                </div>

                <div class="filter-bar-modern">
                  <div class="filter-search">
                    <input 
                      type="text" 
                      v-model="stallSearch" 
                      placeholder="Search stalls..." 
                      class="filter-input"
                      @input="resetStallPagination"
                    />
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="stateFilter" class="filter-select" @change="resetStallPagination">
                      <option v-for="state in malaysiaStates" :key="state" :value="state">
                        {{ state }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="stallStatusFilter" class="filter-select" @change="resetStallPagination">
                      <option value="all">All Status</option>
                      <option value="active">🟢 Active</option>
                      <option value="inactive">⚪ Inactive</option>
                    </select>
                  </div>

                  <div class="filter-actions">
                    <button @click="toggleSelectAllStalls" class="btn-modern secondary small">
                      {{ selectAllStalls ? 'Deselect All' : 'Select All' }}
                    </button>
                    <button @click="clearStallFilters" class="btn-modern secondary small">
                      Clear Filters
                    </button>
                  </div>
                </div>

                <div class="inventory-quick-actions" v-if="selectedStalls.length > 0">
                  <button 
                    @click="bulkActivateStalls" 
                    class="btn-modern primary"
                    :disabled="loading"
                  >
                    ✅ Activate Selected ({{ selectedStallsCount }})
                  </button>
                  <button 
                    @click="bulkDeactivateStalls" 
                    class="btn-modern secondary"
                    :disabled="loading"
                  >
                    ⏸️ Deactivate Selected ({{ selectedStallsCount }})
                  </button>
                  <span class="selected-count-label">{{ selectedStallsCount }} stall(s) selected</span>
                </div>

                <div v-if="filteredStallsList.length === 0" class="empty-state-modern">
                  <span>🏪</span>
                  <p>No stalls found matching your filters</p>
                </div>

                <div v-else>
                  <div class="inventory-table-wrapper">
                    <div class="inventory-table-header">
                      <div class="inventory-table-cell checkbox">
                        <input type="checkbox" v-model="selectAllStalls" @change="toggleSelectAllStalls" />
                      </div>
                      <div class="inventory-table-cell name">Stall</div>
                      <div class="inventory-table-cell state">State</div>
                      <div class="inventory-table-cell status">Status</div>
                      <div class="inventory-table-cell actions">Actions</div>
                    </div>

                    <div 
                      v-for="stall in paginatedStallsList" 
                      :key="stall.id" 
                      class="inventory-table-row"
                      :class="{ selected: selectedStalls.includes(stall.id) }"
                    >
                      <div class="inventory-table-cell checkbox">
                        <input 
                          type="checkbox" 
                          :value="stall.id"
                          v-model="selectedStalls"
                          @change="selectAllStalls = selectedStalls.length === paginatedStallsList.length && paginatedStallsList.length > 0"
                        />
                      </div>
                      <div class="inventory-table-cell name">
                        <span class="stall-name">{{ stall.name }}</span>
                        <span class="stall-code">{{ stall.code }}</span>
                        <span class="stall-company">{{ stall.company_name || '-' }}</span>
                      </div>
                      <div class="inventory-table-cell state">
                        {{ stall.state || '-' }}
                      </div>
                      <div class="inventory-table-cell status">
                        <span :class="['status-badge', stall.is_active ? 'active' : 'inactive']">
                          {{ stall.is_active ? '🟢 Active' : '⚪ Inactive' }}
                        </span>
                        <span v-if="hasLowStock(stall.id)" class="status-badge low">
                          ⚠️ Low Stock
                        </span>
                      </div>
                      <div class="inventory-table-cell actions">
                        <button @click="openEditStallModal(stall)" class="btn-action" title="Edit" :disabled="selectedStalls.length > 0">
                          ✏️ Edit
                        </button>
                        <button @click="toggleStallStatus(stall)" class="btn-action" :title="stall.is_active ? 'Deactivate' : 'Activate'" :disabled="selectedStalls.length > 0">
                          {{ stall.is_active ? '⏸️ Deactivate' : '▶️ Activate' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="pagination-container">
                    <div class="pagination-info" v-if="filteredStallsList.length > 0">
                      Showing {{ stallStartIndex }} - {{ stallEndIndex }} of {{ filteredStallsList.length }} stalls
                    </div>
                    <div class="pagination-info" v-else>
                      Showing 0 - 0 of 0 stalls
                    </div>
                    <div class="pagination-controls">
                      <button 
                        @click="prevStallPage" 
                        class="pagination-btn"
                        :disabled="stallCurrentPage <= 1"
                      >
                        ◀ Previous
                      </button>
                      <span class="pagination-page">
                        Page {{ stallCurrentPage }} of {{ stallTotalPages }}
                      </span>
                      <button 
                        @click="nextStallPage" 
                        class="pagination-btn"
                        :disabled="stallCurrentPage >= stallTotalPages"
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- ===== STALL PERFORMANCE SUB-TAB ===== -->
          <div v-else-if="stallSubTab === 'performance'" class="sub-tab-content">
            <div class="card-modern">
              <div class="card-modern-header">
                <div>
                  <h3>📊 Stall Performance</h3>
                  <span class="card-subtitle">All stalls ranked by revenue for {{ getPeriodLabel() }}</span>
                </div>
                <div class="header-actions">
                  <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
                  <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                </div>
              </div>
              
              <div class="card-modern-body">
                <div class="performance-stats-grid">
                  <div class="stat-chip excellent">
                    <span class="stat-chip-label">🟢 Excellent</span>
                    <span class="stat-chip-value">{{ performanceStats.excellent }}</span>
                  </div>
                  <div class="stat-chip good">
                    <span class="stat-chip-label">🔵 Good</span>
                    <span class="stat-chip-value">{{ performanceStats.good }}</span>
                  </div>
                  <div class="stat-chip average">
                    <span class="stat-chip-label">🟡 Average</span>
                    <span class="stat-chip-value">{{ performanceStats.average }}</span>
                  </div>
                  <div class="stat-chip poor">
                    <span class="stat-chip-label">🔴 Poor</span>
                    <span class="stat-chip-value">{{ performanceStats.poor }}</span>
                  </div>
                  <div class="stat-chip no-sales">
                    <span class="stat-chip-label">⚪ No Sales</span>
                    <span class="stat-chip-value">{{ performanceStats.noSales }}</span>
                  </div>
                </div>

                <div class="filter-bar-modern">
                  <div class="filter-search">
                    <input 
                      type="text" 
                      v-model="performanceSearch" 
                      placeholder="Search stalls by name or code..." 
                      class="filter-input"
                      @input="resetPerformancePagination"
                    />
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="performanceStateFilter" class="filter-select" @change="resetPerformancePagination">
                      <option v-for="state in malaysiaStates" :key="state" :value="state">
                        {{ state }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="performanceStatusFilter" class="filter-select" @change="resetPerformancePagination">
                      <option value="all">All Status</option>
                      <option value="excellent">🟢 Excellent</option>
                      <option value="good">🔵 Good</option>
                      <option value="average">🟡 Average</option>
                      <option value="poor">🔴 Poor</option>
                      <option value="no-sales">⚪ No Sales</option>
                    </select>
                  </div>

                  <div class="filter-actions">
                    <button @click="clearPerformanceFilters" class="btn-modern secondary small">
                      Clear Filters
                    </button>
                  </div>
                </div>

                <div v-if="filteredPerformanceList.length === 0" class="empty-state-modern">
                  <span>📊</span>
                  <p>No stalls found matching your criteria</p>
                  <button @click="clearPerformanceFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
                    Clear Filters
                  </button>
                </div>

                <div v-else>
                  <div class="performance-table-wrapper">
                    <div class="performance-table-header">
                      <span class="performance-table-header-rank sortable" @click="sortPerformance('rank')">
                        Rank <span class="sort-arrow">{{ getSortArrow('rank') }}</span>
                      </span>
                      <span class="performance-table-header-name sortable" @click="sortPerformance('name')">
                        Stall <span class="sort-arrow">{{ getSortArrow('name') }}</span>
                      </span>
                      <span class="performance-table-header-revenue sortable" @click="sortPerformance('revenue')">
                        Revenue <span class="sort-arrow">{{ getSortArrow('revenue') }}</span>
                      </span>
                      <span class="performance-table-header-status sortable" @click="sortPerformance('status')">
                        Status <span class="sort-arrow">{{ getSortArrow('status') }}</span>
                      </span>
                      <span class="performance-table-header-details">Details</span>
                    </div>
                    
                    <div class="performance-table-body">
                      <div 
                        v-for="(stall, index) in paginatedPerformanceList" 
                        :key="stall.id" 
                        class="performance-table-row clickable-item"
                        @click="viewStallDetails(stall)"
                      >
                        <span class="performance-table-rank" data-label="Rank">
                          <span class="rank-number" :class="getRankClass(index)">
                            {{ index + 1 }}
                          </span>
                        </span>
                        
                        <span class="performance-table-name" data-label="Stall">
                          <span class="stall-name-text">{{ stall.name }}</span>
                          <span class="stall-code-text">{{ stall.code }}</span>
                          <span class="stall-name-bar">
                            <span class="stall-bar-fill" :style="{ width: getStallBarWidth(stall.revenue) + '%' }"></span>
                          </span>
                        </span>
                        
                        <span class="performance-table-revenue" data-label="Revenue">{{ formatCurrency(stall.revenue || 0) }}</span>
                        
                        <span class="performance-table-status" data-label="Status">
                          <span :class="['status-indicator', getPerformanceStatusClass(stall)]">
                            {{ getPerformanceStatusEmoji(stall) }} {{ getPerformanceStatusText(stall) }}
                          </span>
                        </span>
                        
                        <span class="performance-table-details" data-label="Details">👆</span>
                      </div>
                    </div>
                  </div>

                  <div class="pagination-container">
                    <div class="pagination-info">
                      Showing {{ performanceStartIndex }} - {{ performanceEndIndex }} of {{ filteredPerformanceList.length }} stalls
                    </div>
                    <div class="pagination-controls">
                      <button 
                        @click="prevPerformancePage" 
                        class="pagination-btn"
                        :disabled="performancePage <= 1"
                      >
                        ◀ Previous
                      </button>
                      <span class="pagination-page">
                        Page {{ performancePage }} of {{ performanceTotalPages }}
                      </span>
                      <button 
                        @click="nextPerformancePage" 
                        class="pagination-btn"
                        :disabled="performancePage >= performanceTotalPages"
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ===== USERS TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'users'" class="tab-panel">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>👥 User Management</h3>
                <span class="card-subtitle">{{ filteredUsersList.length }} users</span>
              </div>
              <div class="header-actions">
                <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
                <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                <button @click="openUserModal()" class="btn-modern primary">+ New User</button>
              </div>
            </div>
            <div class="card-modern-body">
              
              <div class="users-stats-grid">
                <div class="stat-chip">
                  <span class="stat-chip-label">Total Users</span>
                  <span class="stat-chip-value">{{ userStats.total }}</span>
                </div>
                <div class="stat-chip admin">
                  <span class="stat-chip-label">👤 Admins</span>
                  <span class="stat-chip-value">{{ userStats.admins }}</span>
                </div>
                <div class="stat-chip cashier">
                  <span class="stat-chip-label">💰 Cashiers</span>
                  <span class="stat-chip-value">{{ userStats.cashiers }}</span>
                </div>
                <div class="stat-chip active">
                  <span class="stat-chip-label">🟢 Active</span>
                  <span class="stat-chip-value">{{ userStats.active }}</span>
                </div>
                <div class="stat-chip inactive">
                  <span class="stat-chip-label">⚪ Inactive</span>
                  <span class="stat-chip-value">{{ userStats.inactive }}</span>
                </div>
              </div>

              <div class="filter-bar-modern">
                <div class="filter-search">
                  <input 
                    type="text" 
                    v-model="userSearch" 
                    placeholder="Search users by name or username..." 
                    class="filter-input"
                    @input="resetUserPagination"
                  />
                </div>
                
                <div class="filter-group">
                  <select v-model="userStateFilter" class="filter-select" @change="resetUserPagination">
                    <option v-for="state in malaysiaStates" :key="state" :value="state">
                      {{ state }}
                    </option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <select v-model="userRoleFilter" class="filter-select" @change="resetUserPagination">
                    <option value="all">All Roles</option>
                    <option value="stall_admin">👤 Admin</option>
                    <option value="cashier">💰 Cashier</option>
                  </select>
                </div>

                <div class="filter-actions">
                  <button @click="toggleSelectAllUsers" class="btn-modern secondary small">
                    {{ selectAllUsers ? 'Deselect All' : 'Select All' }}
                  </button>
                  <button @click="clearUserFilters" class="btn-modern secondary small">
                    Clear Filters
                  </button>
                </div>
              </div>

              <div class="inventory-quick-actions" v-if="selectedUsers.length > 0">
                <button 
                  @click="bulkRoleChange('stall_admin')" 
                  class="btn-modern primary"
                  :disabled="loading"
                >
                  👤 Make Admin ({{ selectedUsersCount }})
                </button>
                <button 
                  @click="bulkRoleChange('cashier')" 
                  class="btn-modern secondary"
                  :disabled="loading"
                >
                  💰 Make Cashier ({{ selectedUsersCount }})
                </button>
                <button 
                  @click="bulkDeleteUsers" 
                  class="btn-modern danger"
                  :disabled="loading"
                >
                  🗑️ Delete Selected ({{ selectedUsersCount }})
                </button>
                <span class="selected-count-label">{{ selectedUsersCount }} user(s) selected</span>
              </div>

              <div v-if="filteredUsersList.length === 0" class="empty-state-modern">
                <span>👥</span>
                <p>No users found matching your criteria</p>
                <button @click="clearUserFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
                  Clear Filters
                </button>
              </div>

              <div v-else>
                <div class="users-table-wrapper">
                  <div class="users-table-header">
                    <div class="users-table-cell checkbox">
                      <input type="checkbox" v-model="selectAllUsers" @change="toggleSelectAllUsers" />
                    </div>
                    <div class="users-table-cell username">Username</div>
                    <div class="users-table-cell fullname">Full Name</div>
                    <div class="users-table-cell role">Role</div>
                    <div class="users-table-cell company">Company</div>
                    <div class="users-table-cell stalls">Assigned Stalls</div>
                    <div class="users-table-cell actions">Actions</div>
                  </div>

                  <div 
                    v-for="user in paginatedUsersList" 
                    :key="user.id" 
                    class="users-table-row"
                    :class="{ selected: selectedUsers.includes(user.id) }"
                  >
                    <div class="users-table-cell checkbox">
                      <input 
                        type="checkbox" 
                        :value="user.id"
                        v-model="selectedUsers"
                        @change="selectAllUsers = selectedUsers.length === paginatedUsersList.length && paginatedUsersList.length > 0"
                        :disabled="user.id === currentUserId"
                      />
                    </div>
                    <div class="users-table-cell username">
                      <span class="username-text">{{ user.username }}</span>
                    </div>
                    <div class="users-table-cell fullname">
                      {{ user.full_name || '-' }}
                    </div>
                    <div class="users-table-cell role">
                      <span :class="['role-badge', user.role]">
                        {{ user.role === 'stall_admin' ? '👤 Admin' : '💰 Cashier' }}
                      </span>
                    </div>
                    <div class="users-table-cell company">
                      {{ user.company_name || '-' }}
                    </div>
                    <div class="users-table-cell stalls">
                      <span 
                        v-for="stall in (user.assigned_stalls || [])" 
                        :key="stall.id"
                        class="stall-badge clickable"
                        @click="navigateToStall(stall.id)"
                        :title="'Click to view ' + stall.name"
                      >
                        {{ stall.name }}
                      </span>
                      <span v-if="!user.assigned_stalls || user.assigned_stalls.length === 0" class="no-stalls">
                        No stalls assigned
                      </span>
                    </div>
                    <div class="users-table-cell actions">
                      <button @click="openEditUserModal(user)" class="btn-action" title="Edit" :disabled="selectedUsers.length > 0">
                        ✏️ Edit
                      </button>
                      <button @click="deleteUser(user.id, user.username)" class="btn-action danger" title="Delete" :disabled="selectedUsers.length > 0 || user.id === currentUserId">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div class="pagination-container">
                  <div class="pagination-info">
                    Showing {{ userStartIndex }} - {{ userEndIndex }} of {{ filteredUsersList.length }} users
                  </div>
                  <div class="pagination-controls">
                    <button 
                      @click="prevUserPage" 
                      class="pagination-btn"
                      :disabled="userCurrentPage <= 1"
                    >
                      ◀ Previous
                    </button>
                    <span class="pagination-page">
                      Page {{ userCurrentPage }} of {{ userTotalPages }}
                    </span>
                    <button 
                      @click="nextUserPage" 
                      class="pagination-btn"
                      :disabled="userCurrentPage >= userTotalPages"
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ===== MENU TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'menu'" class="tab-panel">
          <div class="sub-tabs">
            <button 
              class="sub-tab" 
              :class="{ active: menuSubTab === 'management' }"
              @click="menuSubTab = 'management'"
            >
              📋 Menu Management
            </button>
            <button 
              class="sub-tab" 
              :class="{ active: menuSubTab === 'assignment' }"
              @click="menuSubTab = 'assignment'"
            >
              📋 Menu Assignment
            </button>
            <button 
              class="sub-tab" 
              :class="{ active: menuSubTab === 'performance' }"
              @click="menuSubTab = 'performance'"
            >
              📊 Menu Performance
            </button>
          </div>
          
          <!-- ===== MENU MANAGEMENT SUB-TAB ===== -->
          <div v-if="menuSubTab === 'management'" class="sub-tab-content">
            <div class="card-modern">
              <div class="card-modern-header">
                <div>
                  <h3>📋 Menu Management</h3>
                  <span class="card-subtitle">{{ filteredMenuItemsForManagement.length }} menu items</span>
                </div>
                <div class="header-actions">
                  <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
                  <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                  <button @click="openMenuModal()" class="btn-modern primary">+ New Item</button>
                </div>
              </div>
              <div class="card-modern-body">
                <div class="inventory-stats-grid">
                  <div class="stat-chip">
                    <span class="stat-chip-label">Total Items</span>
                    <span class="stat-chip-value">{{ menuStats.total }}</span>
                  </div>
                  <div class="stat-chip active">
                    <span class="stat-chip-label">Active</span>
                    <span class="stat-chip-value">{{ menuStats.active }}</span>
                  </div>
                  <div class="stat-chip inactive">
                    <span class="stat-chip-label">Inactive</span>
                    <span class="stat-chip-value">{{ menuStats.inactive }}</span>
                  </div>
                </div>

                <div class="filter-bar-modern">
                  <div class="filter-search">
                    <input 
                      type="text" 
                      v-model="menuSearch" 
                      placeholder="Search menu items..." 
                      class="filter-input"
                      @input="resetMenuPagination"
                    />
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="menuCategoryFilter" class="filter-select" @change="resetMenuPagination">
                      <option v-for="cat in menuCategories" :key="cat" :value="cat">
                        {{ cat === 'all' ? 'All Categories' : cat }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-actions">
                    <button @click="clearMenuFilters" class="btn-modern secondary small">
                      Clear Filters
                    </button>
                  </div>
                </div>

                <div v-if="filteredMenuItemsForManagement.length === 0" class="empty-state-modern">
                  <span>📋</span>
                  <p>No menu items found. Create your first menu item!</p>
                </div>

                <div v-else>
                  <div class="inventory-table-wrapper">
                    <!-- ===== FIXED: 5 Separate Headers ===== -->
                    <div class="inventory-table-header">
                      <div class="inventory-table-cell name">Item Name</div>
                      <div class="inventory-table-cell price">Price</div>
                      <div class="inventory-table-cell category">Category</div>
                      <div class="inventory-table-cell recipe">Recipe</div>
                      <div class="inventory-table-cell actions">Actions</div>
                    </div>

                    <div 
                      v-for="(item, index) in paginatedMenuItemsForManagement" 
                      :key="item.item_name" 
                      class="inventory-table-row"
                    >
                      <!-- ===== FIXED: Added data-label attributes ===== -->
                      <div class="inventory-table-cell name" data-label="Item Name">
                        <span class="stall-name">{{ item.item_name }}</span>
                      </div>
                      <div class="inventory-table-cell price" data-label="Price">
                        {{ formatCurrency(item.price) }}
                      </div>
                      <div class="inventory-table-cell category" data-label="Category">
                        {{ item.category || 'Main' }}
                      </div>
                      <div class="inventory-table-cell recipe" data-label="Recipe">
                        <span v-if="item.recipe && item.recipe.length > 0" class="recipe-tags">
                          <span v-for="(r, idx) in item.recipe" :key="idx" class="recipe-tag">
                            {{ r.material_name }}: {{ r.quantity_used }}
                          </span>
                        </span>
                        <span v-else class="text-muted">No recipe</span>
                      </div>
                      <div class="inventory-table-cell actions" data-label="Actions">
                        <button @click="openEditMenuModal(item)" class="btn-action" title="Edit">✏️</button>
                        <button @click="deleteMenuItem(item.item_name)" class="btn-action danger" title="Delete">🗑️</button>
                      </div>
                    </div>
                  </div>

                  <div class="pagination-container">
                    <div class="pagination-info">
                      Showing {{ menuStartIndex }} - {{ menuEndIndex }} of {{ filteredMenuItemsForManagement.length }} items
                    </div>
                    <div class="pagination-controls">
                      <button 
                        @click="prevMenuPage" 
                        class="pagination-btn"
                        :disabled="menuCurrentPage <= 1"
                      >
                        ◀ Previous
                      </button>
                      <span class="pagination-page">
                        Page {{ menuCurrentPage }} of {{ menuTotalPages }}
                      </span>
                      <button 
                        @click="nextMenuPage" 
                        class="pagination-btn"
                        :disabled="menuCurrentPage >= menuTotalPages"
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== MENU MODAL ===== -->
          <div v-if="menuModal" class="modal-overlay" @click.self="closeMenuModal">
            <div class="modal-modern modal-lg">
              <div class="modal-modern-header">
                <h3>{{ editingMenu ? 'Edit Menu Item' : 'New Menu Item' }}</h3>
                <button @click="closeMenuModal" class="modal-close-btn">✕</button>
              </div>
              <div class="modal-modern-body" style="background: #ffffff;">
                <div class="modal-form-row">
                  <div class="modal-form-group">
                    <label>Item Name</label>
                    <input v-model="menuForm.item_name" placeholder="e.g., Nasi Ayam" :disabled="editingMenu" />
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
                
                <div class="modal-form-group recipe-section">
                  <label>Recipe (Ingredients)</label>
                  <p class="recipe-hint">Add chicken pieces needed for this menu item. Leave empty if no chicken needed.</p>
                  
                  <div v-for="(ingredient, index) in menuForm.recipe" :key="index" class="recipe-row">
                    <div class="recipe-field">
                      <label class="recipe-label">Ingredient</label>
                      <input 
                        v-model="ingredient.material_name" 
                        placeholder="Chicken" 
                        class="recipe-input" 
                        value="Chicken"
                      />
                    </div>
                    <div class="recipe-field">
                      <label class="recipe-label">Pieces Needed</label>
                      <input 
                        type="number" 
                        v-model="ingredient.quantity_used" 
                        placeholder="e.g., 2" 
                        class="recipe-input-small" 
                        step="1" 
                        min="1"
                      />
                    </div>
                    <button @click="removeRecipeIngredient(index)" class="btn-icon-sm danger" title="Remove ingredient">✕</button>
                  </div>
                  
                  <button @click="addRecipeIngredient" class="btn-modern secondary small add-recipe-btn">
                    + Add Chicken to Recipe
                  </button>
                </div>
              </div>
              <div class="modal-modern-footer">
                <button @click="closeMenuModal" class="btn-modern secondary">Cancel</button>
                <button @click="saveMenuItem" class="btn-modern primary">{{ editingMenu ? 'Update' : 'Create' }}</button>
              </div>
            </div>
          </div>
          
          <!-- ===== MENU ASSIGNMENT SUB-TAB ===== -->
          <div v-if="menuSubTab === 'assignment'" class="sub-tab-content">
            <div class="card-modern">
              <div class="card-modern-header">
                <div>
                  <h3>📋 Menu Assignment</h3>
                  <span class="card-subtitle">{{ filteredMenuItemsForAssignment.length }} menu items</span>
                </div>
                <div class="header-actions">
                  <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
                  <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                </div>
              </div>
              <div class="card-modern-body">
                
                <div class="inventory-stats-grid">
                  <div class="stat-chip">
                    <span class="stat-chip-label">Total Items</span>
                    <span class="stat-chip-value">{{ menuStats.total }}</span>
                  </div>
                  <div class="stat-chip active">
                    <span class="stat-chip-label">Active</span>
                    <span class="stat-chip-value">{{ menuStats.active }}</span>
                  </div>
                  <div class="stat-chip inactive">
                    <span class="stat-chip-label">Inactive</span>
                    <span class="stat-chip-value">{{ menuStats.inactive }}</span>
                  </div>
                </div>

                <div class="stall-view-toggle" style="margin-bottom: 1rem;">
                  <button 
                    class="btn-modern secondary small" 
                    :class="{ active: showStallMenuView }"
                    @click="showStallMenuView = !showStallMenuView"
                  >
                    {{ showStallMenuView ? '📋 Hide Stall View' : '🏪 Show Stall Menu View' }}
                  </button>
                </div>

                <div v-if="showStallMenuView" class="stall-menu-view">
                  <div class="card-modern" style="border: 1px solid var(--primary);">
                    <div class="card-modern-header" style="background: var(--background);">
                      <div>
                        <h4>🏪 Stall Menu Assignments</h4>
                        <span class="card-subtitle">{{ stalls.length }} stalls with menu assignments</span>
                      </div>
                      <button @click="loadAllStallMenuAssignments" class="btn-modern secondary small">
                        ⟳ Refresh
                      </button>
                    </div>
                    <div class="card-modern-body" style="max-height: 400px; overflow-y: auto;">
                      <div v-if="loadingStallMenus" class="loading-state">
                        <div class="loading-spinner small"><div class="spinner-ring"></div></div>
                        <p>Loading stall menu assignments...</p>
                      </div>
                      
                      <div v-else-if="stallMenuAssignments.length === 0" class="empty-state-modern">
                        <span>🏪</span>
                        <p>No stalls found</p>
                      </div>
                      
                      <div v-else>
                        <div v-for="stall in stallMenuAssignments" :key="stall.id" class="stall-menu-item">
                          <div class="stall-menu-header" @click="toggleStallMenuExpand(stall.id)">
                            <div class="stall-menu-info">
                              <span class="stall-menu-name">{{ stall.name }}</span>
                              <span class="stall-menu-code">{{ stall.code }}</span>
                              <span :class="['status-badge', stall.is_active ? 'active' : 'inactive']">
                                {{ stall.is_active ? '🟢 Active' : '⚪ Inactive' }}
                              </span>
                              <span class="stall-menu-count">{{ stall.menus.length }} menus assigned</span>
                            </div>
                            <span class="stall-menu-toggle">{{ expandedStallMenus.includes(stall.id) ? '▲' : '▼' }}</span>
                          </div>
                          
                          <div v-if="expandedStallMenus.includes(stall.id)" class="stall-menu-list">
                            <div v-if="stall.menus.length === 0" class="empty-state-modern small">
                              <span>📋</span>
                              <p>No menus assigned to this stall</p>
                            </div>
                            <div v-else>
                              <div v-for="menu in stall.menus" :key="menu" class="stall-menu-tag">
                                <span class="menu-name">{{ menu }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mode-toggle">
                  <button 
                    class="mode-btn" 
                    :class="{ active: assignMode === 'single' }"
                    @click="assignMode = 'single'"
                  >
                    🎯 Single Stall
                  </button>
                  <button 
                    class="mode-btn" 
                    :class="{ active: assignMode === 'bulk' }"
                    @click="assignMode = 'bulk'"
                  >
                    📦 Bulk Assign
                  </button>
                </div>

                <!-- SINGLE STALL MODE -->
                <div v-if="assignMode === 'single'" class="assign-mode-content">
                  <div class="filter-bar-modern">
                    <div class="filter-search">
                      <input 
                        type="text" 
                        v-model="menuSearch" 
                        placeholder="Search menu items..." 
                        class="filter-input"
                        @input="resetMenuPagination"
                      />
                    </div>
                    
                    <div class="filter-group">
                      <select v-model="menuCategoryFilter" class="filter-select" @change="resetMenuPagination">
                        <option v-for="cat in menuCategories" :key="cat" :value="cat">
                          {{ cat === 'all' ? 'All Categories' : cat }}
                        </option>
                      </select>
                    </div>

                    <div class="filter-actions">
                      <button @click="toggleSelectAllMenuItems" class="btn-modern secondary small">
                        {{ selectAllMenuItems ? 'Deselect All' : 'Select All' }}
                      </button>
                      <button @click="clearMenuFilters" class="btn-modern secondary small">
                        Clear Filters
                      </button>
                    </div>
                  </div>

                  <div class="filter-bar" style="margin-bottom: 1rem;">
                    <div class="filter-search">
                      <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">Select Stall</label>
                      <select v-model="selectedAssignmentStall" class="filter-select" style="width: 100%;">
                        <option value="">-- Select a stall --</option>
                        <option v-for="stall in stalls" :key="stall.id" :value="stall.id">
                          {{ stall.name }} ({{ stall.code }})
                        </option>
                      </select>
                    </div>
                    
                    <div style="display: flex; align-items: flex-end; padding-bottom: 0.25rem;">
                      <button 
                        @click="bulkAssignMenusToStalls" 
                        class="btn-modern primary"
                        :disabled="selectedMenuItems.length === 0 || !selectedAssignmentStall || savingAssignment"
                      >
                        📦 Assign Selected ({{ selectedMenuItemsCount }}) to Stall
                      </button>
                    </div>
                  </div>

                  <div v-if="!selectedAssignmentStall" class="empty-state-modern">
                    <span>🏪</span>
                    <p>Please select a stall to manage its menu</p>
                  </div>

                  <div v-else-if="loadingMenuAssignments" class="loading-state small">
                    <div class="loading-spinner small"><div class="spinner-ring"></div></div>
                    <p>Loading menu assignments...</p>
                  </div>

                  <div v-else>
                    <div v-if="filteredMenuItemsForAssignment.length === 0" class="empty-state-modern">
                      <span>📋</span>
                      <p>No menu items found matching your criteria</p>
                      <button @click="clearMenuFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
                        Clear Filters
                      </button>
                    </div>

                    <div v-else>
                      <div class="menu-assignment-list">
                        <div v-for="item in paginatedMenuItems" :key="item.item_name" class="assignment-item">
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
                      </div>

                      <div class="pagination-container">
                        <div class="pagination-info">
                          Showing {{ menuStartIndex }} - {{ menuEndIndex }} of {{ filteredMenuItemsForAssignment.length }} menu items
                        </div>
                        <div class="pagination-controls">
                          <button 
                            @click="prevMenuPage" 
                            class="pagination-btn"
                            :disabled="menuCurrentPage <= 1"
                          >
                            ◀ Previous
                          </button>
                          <span class="pagination-page">
                            Page {{ menuCurrentPage }} of {{ menuTotalPages }}
                          </span>
                          <button 
                            @click="nextMenuPage" 
                            class="pagination-btn"
                            :disabled="menuCurrentPage >= menuTotalPages"
                          >
                            Next ▶
                          </button>
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

                <!-- BULK ASSIGN MODE -->
                <div v-if="assignMode === 'bulk'" class="assign-mode-content bulk-mode">
                  <div class="bulk-step">
                    <div class="step-header">
                      <span class="step-number">1</span>
                      <h4>Select Stalls</h4>
                      <span class="step-count">{{ selectedStallsForAssign.length }} / {{ stalls.length }} selected</span>
                      <button @click="toggleAllStallsForAssign" class="btn-modern secondary small">
                        {{ selectAllStallsForAssign ? 'Deselect All' : 'Select All' }}
                      </button>
                    </div>
                    
                    <div class="stall-checkbox-grid">
                      <label v-for="stall in stalls" :key="stall.id" class="stall-checkbox-item">
                        <input 
                          type="checkbox" 
                          :value="stall.id" 
                          v-model="selectedStallsForAssign" 
                        />
                        <span class="stall-name">{{ stall.name }}</span>
                        <span class="stall-code">{{ stall.code }}</span>
                        <span class="stall-status" :class="stall.is_active ? 'active' : 'inactive'">
                          {{ stall.is_active ? '🟢' : '⚪' }}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div class="bulk-step">
                    <div class="step-header">
                      <span class="step-number">2</span>
                      <h4>Select Menus</h4>
                      <span class="step-count">{{ selectedMenuItemsForBulk.length }} selected</span>
                      <button @click="toggleAllMenusForBulk" class="btn-modern secondary small">
                        {{ selectAllMenusForBulk ? 'Deselect All' : 'Select All' }}
                      </button>
                      <div class="filter-search" style="flex:1; min-width:150px;">
                        <input 
                          type="text" 
                          v-model="bulkMenuSearch" 
                          placeholder="Search menus..." 
                          class="filter-input" 
                        />
                      </div>
                    </div>
                    
                    <div class="menu-checkbox-grid">
                      <label 
                        v-for="item in filteredBulkMenuItems" 
                        :key="item.item_name" 
                        class="menu-checkbox-item"
                      >
                        <input 
                          type="checkbox" 
                          :value="item.item_name" 
                          v-model="selectedMenuItemsForBulk" 
                        />
                        <span class="menu-name">{{ item.item_name }}</span>
                        <span class="menu-price">{{ formatCurrency(item.price) }}</span>
                        <span class="menu-category">{{ item.category || 'Main' }}</span>
                      </label>
                    </div>
                  </div>

                  <div class="bulk-actions">
                    <div class="bulk-summary">
                      <strong>Summary:</strong> 
                      {{ selectedMenuItemsForBulk.length }} menu(s) × {{ selectedStallsForAssign.length }} stall(s) = 
                      <strong class="total-assignments">{{ selectedMenuItemsForBulk.length * selectedStallsForAssign.length }}</strong> assignments
                    </div>
                    
                    <button 
                      @click="executeBulkAssignToStalls" 
                      class="btn-modern primary"
                      :disabled="selectedStallsForAssign.length === 0 || selectedMenuItemsForBulk.length === 0 || bulkAssignToStallsLoading"
                    >
                      {{ bulkAssignToStallsLoading ? 'Assigning...' : `📦 Assign to ${selectedStallsForAssign.length} Stall(s)` }}
                    </button>
                  </div>

                  <div v-if="bulkAssignMessage" class="assignment-message" :class="bulkAssignMessageType">
                    {{ bulkAssignMessage }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- ===== MENU PERFORMANCE SUB-TAB ===== -->
          <div v-else-if="menuSubTab === 'performance'" class="sub-tab-content">
            <div class="card-modern">
              <div class="card-modern-header">
                <div>
                  <h3>📊 Menu Performance</h3>
                  <span class="card-subtitle">All menu items ranked by sales for {{ getPeriodLabel() }}</span>
                </div>
                <div class="header-actions">
                  <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
                  <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                </div>
              </div>
              <div class="card-modern-body">
                <div class="menu-performance-stats-grid">
                  <div class="stat-chip">
                    <span class="stat-chip-label">📊 Total Items</span>
                    <span class="stat-chip-value">{{ menuPerformance.length }}</span>
                  </div>
                  <div class="stat-chip revenue">
                    <span class="stat-chip-label">💰 Total Revenue</span>
                    <span class="stat-chip-value">{{ formatCurrency(menuPerformanceStats.totalRevenue) }}</span>
                  </div>
                  <div class="stat-chip top-item">
                    <span class="stat-chip-label">🏆 Top Item</span>
                    <span class="stat-chip-value">{{ menuPerformanceStats.topItemName }}</span>
                    <span class="stat-chip-sub">{{ formatCurrency(menuPerformanceStats.topItemRevenue) }}</span>
                  </div>
                </div>

                <div class="menu-performance-breakdown-grid">
                  <div class="stat-chip excellent">
                    <span class="stat-chip-label">🟢 Excellent</span>
                    <span class="stat-chip-value">{{ menuPerformanceBreakdown.excellent }}</span>
                  </div>
                  <div class="stat-chip good">
                    <span class="stat-chip-label">🔵 Good</span>
                    <span class="stat-chip-value">{{ menuPerformanceBreakdown.good }}</span>
                  </div>
                  <div class="stat-chip average">
                    <span class="stat-chip-label">🟡 Average</span>
                    <span class="stat-chip-value">{{ menuPerformanceBreakdown.average }}</span>
                  </div>
                  <div class="stat-chip poor">
                    <span class="stat-chip-label">🔴 Poor</span>
                    <span class="stat-chip-value">{{ menuPerformanceBreakdown.poor }}</span>
                  </div>
                  <div class="stat-chip no-sales">
                    <span class="stat-chip-label">⚪ No Sales</span>
                    <span class="stat-chip-value">{{ menuPerformanceBreakdown.noSales }}</span>
                  </div>
                </div>

                <div class="filter-bar-modern">
                  <div class="filter-group">
                    <select v-model="menuPerformanceCategoryFilter" class="filter-select" @change="resetMenuPerformancePagination">
                      <option v-for="cat in menuCategories" :key="cat" :value="cat">
                        {{ cat === 'all' ? 'All Categories' : cat }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="filter-group">
                    <select v-model="menuPerformanceStateFilter" class="filter-select" @change="resetMenuPerformancePagination">
                      <option v-for="state in malaysiaStates" :key="state" :value="state">
                        {{ state }}
                      </option>
                    </select>
                  </div>

                  <div class="filter-actions">
                    <button @click="clearMenuPerformanceFilters" class="btn-modern secondary small">
                      Clear Filters
                    </button>
                  </div>
                </div>

                <div v-if="filteredMenuPerformance.length === 0" class="empty-state-modern">
                  <span>📊</span>
                  <p>No sales data available for {{ getPeriodLabel() }}</p>
                  <button @click="clearMenuPerformanceFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
                    Clear Filters
                  </button>
                </div>

                <div v-else>
                  <div class="performance-table-wrapper">
                    <div class="performance-table-header">
                      <span class="performance-table-header-rank sortable" @click="sortMenuPerformance('rank')">
                        Rank <span class="sort-arrow">{{ getMenuSortArrow('rank') }}</span>
                      </span>
                      <span class="performance-table-header-name sortable" @click="sortMenuPerformance('name')">
                        Menu <span class="sort-arrow">{{ getMenuSortArrow('name') }}</span>
                      </span>
                      <span class="performance-table-header-revenue sortable" @click="sortMenuPerformance('revenue')">
                        Revenue <span class="sort-arrow">{{ getMenuSortArrow('revenue') }}</span>
                      </span>
                      <span class="performance-table-header-status sortable" @click="sortMenuPerformance('status')">
                        Status <span class="sort-arrow">{{ getMenuSortArrow('status') }}</span>
                      </span>
                      <span class="performance-table-header-details">Details</span>
                    </div>
                    
                    <div class="performance-table-body">
                      <div 
                        v-for="(item, index) in paginatedMenuPerformance" 
                        :key="item.name" 
                        class="performance-table-row clickable-item"
                        @click="viewMenuItemDetails(item)"
                      >
                        <span class="performance-table-rank" data-label="Rank">
                          <span class="rank-number" :class="getRankClass(index)">
                            {{ index + 1 }}
                          </span>
                        </span>
                        
                        <span class="performance-table-name" data-label="Menu">
                          <span class="menu-name-text">{{ item.name }}</span>
                          <span class="menu-name-bar">
                            <span class="menu-bar-fill" :style="{ width: getPerformancePercentage(item.quantity) + '%' }"></span>
                          </span>
                        </span>
                        
                        <span class="performance-table-revenue" data-label="Revenue">{{ formatCurrency(item.revenue || 0) }}</span>
                        
                        <span class="performance-table-status" data-label="Status">
                          <span :class="['status-indicator', getMenuStatusClass(item.quantity)]">
                            {{ getMenuStatusEmoji(item.quantity) }} {{ getMenuStatus(item.quantity) }}
                          </span>
                        </span>
                        
                        <span class="performance-table-details" data-label="Details">👆</span>
                      </div>
                    </div>
                  </div>

                  <div class="pagination-container">
                    <div class="pagination-info">
                      Showing {{ menuPerformanceStartIndex }} - {{ menuPerformanceEndIndex }} of {{ filteredMenuPerformance.length }} items
                    </div>
                    <div class="pagination-controls">
                      <button 
                        @click="prevMenuPerformancePage" 
                        class="pagination-btn"
                        :disabled="menuPerformancePage <= 1"
                      >
                        ◀ Previous
                      </button>
                      <span class="pagination-page">
                        Page {{ menuPerformancePage }} of {{ menuPerformanceTotalPages }}
                      </span>
                      <button 
                        @click="nextMenuPerformancePage" 
                        class="pagination-btn"
                        :disabled="menuPerformancePage >= menuPerformanceTotalPages"
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ===== REVENUE TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'revenue'" class="tab-panel">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>💰 Revenue Overview</h3>
                <span class="card-subtitle">{{ getRevenuePeriodLabel }}</span>
              </div>
              <div class="header-actions">
                <button @click="refreshRevenueData" class="btn-modern secondary small">⟳ Refresh</button>
                <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                <button @click="exportRevenueData" class="btn-modern primary small">📊 Export</button>
              </div>
            </div>
            <div class="card-modern-body">
              
              <div class="revenue-stats-grid">
                <div class="stat-chip revenue">
                  <span class="stat-chip-label">💰 Total Revenue</span>
                  <span class="stat-chip-value">{{ formatCurrency(revenueStats.totalRevenue) }}</span>
                </div>
                <div class="stat-chip transactions">
                  <span class="stat-chip-label">📋 Total Transactions</span>
                  <span class="stat-chip-value">{{ formatNumber(revenueStats.totalTransactions) }}</span>
                </div>
                <div class="stat-chip average">
                  <span class="stat-chip-label">📊 Avg Transaction</span>
                  <span class="stat-chip-value">{{ formatCurrency(revenueStats.avgTransaction) }}</span>
                </div>
                <div class="stat-chip growth">
                  <span class="stat-chip-label">📈 Revenue Growth</span>
                  <span class="stat-chip-value" :class="revenueGrowth >= 0 ? 'positive' : 'negative'">
                    {{ revenueGrowth >= 0 ? '↑' : '↓' }} {{ Math.abs(revenueGrowth).toFixed(1) }}%
                  </span>
                </div>
                <div class="stat-chip top-stall">
                  <span class="stat-chip-label">🏆 Top Stall</span>
                  <span class="stat-chip-value">{{ revenueStats.topStallName }}</span>
                  <span class="stat-chip-sub">{{ formatCurrency(revenueStats.topStallRevenue) }}</span>
                </div>
              </div>

              <div class="filter-bar-modern">
                <div class="filter-group">
                  <select v-model="revenueStateFilter" class="filter-select" @change="resetRevenuePagination">
                    <option v-for="state in malaysiaStates" :key="state" :value="state">
                      {{ state }}
                    </option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <select v-model="revenueStallFilter" class="filter-select" @change="resetRevenuePagination">
                    <option value="all">All Stalls</option>
                    <option v-for="stall in stalls" :key="stall.id" :value="stall.id">
                      {{ stall.name }}
                    </option>
                  </select>
                </div>

                <div class="filter-search" style="min-width: 150px;">
                  <input 
                    type="text" 
                    v-model="revenueSearch" 
                    placeholder="Search stalls..." 
                    class="filter-input"
                    @input="resetRevenuePagination"
                  />
                </div>

                <div class="filter-actions">
                  <button @click="clearRevenueFilters" class="btn-modern secondary small">
                    Clear Filters
                  </button>
                </div>
              </div>

              <div class="revenue-charts-grid">
                <div class="revenue-chart-card">
                  <h4>📈 Revenue by Stall</h4>
                  <div ref="revenueChartRef" class="revenue-chart-container"></div>
                </div>
                
                <div class="revenue-chart-card">
                  <h4>📍 Revenue by State</h4>
                  <div ref="revenueStateChartRef" class="revenue-chart-container"></div>
                </div>
              </div>

              <div v-if="revenueLoading" class="loading-state">
                <div class="loading-spinner"><div class="spinner-ring"></div></div>
                <p>Loading revenue data...</p>
              </div>

              <div v-else-if="filteredRevenueData.length === 0" class="empty-state-modern">
                <span>💰</span>
                <p>No revenue data available for the selected filters</p>
                <button @click="clearRevenueFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
                  Clear Filters
                </button>
              </div>

              <div v-else>
                <div class="revenue-table-wrapper">
                  <div class="revenue-table-header">
                    <span class="revenue-table-header-rank">Rank</span>
                    <span class="revenue-table-header-name">Stall</span>
                    <span class="revenue-table-header-state">State</span>
                    <span class="revenue-table-header-revenue">Revenue</span>
                    <span class="revenue-table-header-status">Status</span>
                    <span class="revenue-table-header-details">Details</span>
                  </div>
                  
                  <div class="revenue-table-body">
                    <div 
                      v-for="(item, index) in paginatedRevenueData" 
                      :key="item.id" 
                      class="revenue-table-row clickable-item"
                      @click="viewAllTransactions(item)"
                    >
                      <span class="revenue-table-rank" data-label="Rank">
                        <span class="rank-number" :class="getRankClass(index)">
                          {{ index + 1 }}
                        </span>
                      </span>
                      
                      <span class="revenue-table-name" data-label="Stall">
                        <span class="stall-name-text">{{ item.name }}</span>
                        <span class="stall-code-text">{{ item.code }}</span>
                      </span>
                      
                      <span class="revenue-table-state" data-label="State">
                        <span class="state-tag">{{ item.state || '-' }}</span>
                      </span>
                      
                      <span class="revenue-table-revenue" data-label="Revenue">{{ formatCurrency(item.revenue || 0) }}</span>
                      
                      <span class="revenue-table-status" data-label="Status">
                        <span :class="['status-indicator', getRevenueStatusClass(item)]">
                          {{ getRevenueStatusEmoji(item) }} {{ getRevenueStatusText(item) }}
                        </span>
                      </span>
                      
                      <span class="revenue-table-details" data-label="Details">
                        <button @click.stop="viewAllTransactions(item)" class="btn-view-transactions" title="View Transactions">
                          📋
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="pagination-container">
                  <div class="pagination-info">
                    Showing {{ revenueStartIndex }} - {{ revenueEndIndex }} of {{ filteredRevenueData.length }} stalls
                  </div>
                  <div class="pagination-controls">
                    <button 
                      @click="prevRevenuePage" 
                      class="pagination-btn"
                      :disabled="revenuePage <= 1"
                    >
                      ◀ Previous
                    </button>
                    <span class="pagination-page">
                      Page {{ revenuePage }} of {{ revenueTotalPages }}
                    </span>
                    <button 
                      @click="nextRevenuePage" 
                      class="pagination-btn"
                      :disabled="revenuePage >= revenueTotalPages"
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ===== TRANSACTIONS TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'transactions'" class="tab-panel transactions-tab">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>📋 Transactions</h3>
                <span class="card-subtitle">{{ filteredTransactions.length }} transactions found</span>
              </div>
              <div class="header-actions">
                <button @click="refreshTransactions" class="btn-modern secondary small">⟳ Refresh</button>
                <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
                <button @click="exportTransactions" class="btn-modern primary small">📊 Export</button>
              </div>
            </div>
            <div class="card-modern-body">
              
              <div class="transactions-stats-grid">
                <div class="stat-chip">
                  <span class="stat-chip-label">📊 Total Transactions</span>
                  <span class="stat-chip-value">{{ transactionStats.total }}</span>
                </div>
                <div class="stat-chip revenue">
                  <span class="stat-chip-label">💰 Total Revenue</span>
                  <span class="stat-chip-value">{{ formatCurrency(transactionStats.totalRevenue) }}</span>
                </div>
                <div class="stat-chip average">
                  <span class="stat-chip-label">📈 Avg Transaction</span>
                  <span class="stat-chip-value">{{ formatCurrency(transactionStats.average) }}</span>
                </div>
                <div class="stat-chip active">
                  <span class="stat-chip-label">✅ Completed</span>
                  <span class="stat-chip-value">{{ transactionStats.completed }}</span>
                </div>
                <div class="stat-chip warning">
                  <span class="stat-chip-label">⏳ Pending</span>
                  <span class="stat-chip-value">{{ transactionStats.pending }}</span>
                </div>
              </div>

              <div class="filter-bar-modern">
                <div class="filter-search">
                  <input 
                    type="text" 
                    v-model="transactionSearch" 
                    placeholder="Search by order ID or stall..." 
                    class="filter-input"
                    @input="resetTransactionPagination"
                  />
                </div>
                
                <div class="filter-group">
                  <select v-model="transactionStallFilter" class="filter-select" @change="resetTransactionPagination">
                    <option value="all">All Stalls</option>
                    <option v-for="stall in stalls" :key="stall.id" :value="stall.id">
                      {{ stall.name }}
                    </option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <select v-model="transactionStatusFilter" class="filter-select" @change="resetTransactionPagination">
                    <option value="all">All Status</option>
                    <option value="completed">✅ Completed</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="failed">❌ Failed</option>
                  </select>
                </div>

                <div class="filter-actions">
                  <button @click="clearTransactionFilters" class="btn-modern secondary small">
                    Clear Filters
                  </button>
                </div>
              </div>

              <div v-if="transactionsLoading" class="loading-state">
                <div class="loading-spinner"><div class="spinner-ring"></div></div>
                <p>Loading transactions...</p>
              </div>

              <div v-else-if="filteredTransactions.length === 0" class="empty-state-modern">
                <span>📭</span>
                <p>No transactions found matching your criteria</p>
                <button @click="clearTransactionFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
                  Clear Filters
                </button>
              </div>

              <div v-else>
                <div class="revenue-table-wrapper">
                  <div class="revenue-table-header">
                    <span class="revenue-table-header-rank">Order</span>
                    <span class="revenue-table-header-name">Stall</span>
                    <span class="revenue-table-header-revenue">Amount</span>
                    <span class="revenue-table-header-status">Status</span>
                    <span class="revenue-table-header-state">Date</span>
                    <span class="revenue-table-header-details">Details</span>
                  </div>
                  
                  <div class="revenue-table-body">
                    <div 
                      v-for="(tx, index) in paginatedTransactions" 
                      :key="tx.id" 
                      class="revenue-table-row clickable-item"
                      @click="viewTransactionDetails(tx)"
                    >
                      <span class="revenue-table-rank" data-label="Order">
                        <span class="order-id">#{{ tx.order_number || 'N/A' }}</span>
                      </span>
                      
                      <span class="revenue-table-name" data-label="Stall">
                        <span class="stall-name-text">{{ tx.stall_name || '-' }}</span>
                      </span>
                      
                      <span class="revenue-table-revenue" data-label="Amount">{{ formatCurrency(tx.total_amount || 0) }}</span>
                      
                      <span class="revenue-table-status" data-label="Status">
                        <span :class="['status-indicator', tx.status || 'completed']">
                          {{ getTransactionStatusEmoji(tx.status) }} {{ tx.status || 'Completed' }}
                        </span>
                      </span>
                      
                      <span class="revenue-table-state" data-label="Date">
                        <span class="state-tag">{{ formatTableDate(tx.created_at) }}</span>
                      </span>
                      
                      <span class="revenue-table-details" data-label="Details">
                        <button @click.stop="viewTransactionDetails(tx)" class="btn-view-transactions" title="View Details">
                          👁️
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="pagination-container">
                  <div class="pagination-info">
                    Showing {{ transactionStartIndex }} - {{ transactionEndIndex }} of {{ filteredTransactions.length }} transactions
                  </div>
                  <div class="pagination-controls">
                    <button 
                      @click="prevTransactionPage" 
                      class="pagination-btn"
                      :disabled="transactionPage <= 1"
                    >
                      ◀ Previous
                    </button>
                    <span class="pagination-page">
                      Page {{ transactionPage }} of {{ transactionTotalPages }}
                    </span>
                    <button 
                      @click="nextTransactionPage" 
                      class="pagination-btn"
                      :disabled="transactionPage >= transactionTotalPages"
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ===== REGISTRATIONS TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'registrations'" class="tab-panel">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>📝 Registration Requests</h3>
                <span class="card-subtitle">{{ pendingRegistrations.length }} pending registration{{ pendingRegistrations.length !== 1 ? 's' : '' }}</span>
              </div>
              <button @click="loadRegistrations" class="btn-modern secondary small">
                ⟳ Refresh
              </button>
            </div>
            <div class="card-modern-body">
              <div v-if="loadingRegistrations" class="loading-state small">
                <div class="loading-spinner small"><div class="spinner-ring"></div></div>
                <p>Loading registrations...</p>
              </div>
              
              <div v-else-if="registrations.length === 0" class="empty-state-modern">
                <span>📭</span>
                <p>No registration requests found</p>
              </div>
              
              <div v-else>
                <div class="registrations-table-wrapper">
                  <div class="registrations-table-header">
                    <span class="registrations-table-header-company">Company</span>
                    <span class="registrations-table-header-contact">Contact</span>
                    <span class="registrations-table-header-email">Email</span>
                    <span class="registrations-table-header-phone">Phone</span>
                    <span class="registrations-table-header-ic">IC Number</span>
                    <span class="registrations-table-header-status">Status</span>
                    <span class="registrations-table-header-actions">Actions</span>
                  </div>
                  
                  <div 
                    v-for="reg in registrations" 
                    :key="reg.id" 
                    class="registrations-table-row"
                  >
                    <span class="registrations-table-cell company" data-label="Company">{{ reg.company_name }}</span>
                    <span class="registrations-table-cell contact" data-label="Contact">{{ reg.contact_person }}</span>
                    <span class="registrations-table-cell email" data-label="Email">{{ reg.email }}</span>
                    <span class="registrations-table-cell phone" data-label="Phone">{{ reg.phone }}</span>
                    <span class="registrations-table-cell ic" data-label="IC Number">{{ reg.ic_number }}</span>
                    <span class="registrations-table-cell status" data-label="Status">
                      <span :class="['status-badge', `status-${reg.status}`]">
                        {{ reg.status.toUpperCase() }}
                      </span>
                    </span>
                    <span class="registrations-table-cell actions" data-label="Actions">
                      <button v-if="reg.status === 'pending'" @click="approveRegistration(reg.id)" class="btn-action primary" title="Approve">
                        ✅
                      </button>
                      <button v-if="reg.status === 'pending'" @click="openRejectModal(reg.id)" class="btn-action danger" title="Reject">
                        ❌
                      </button>
                      <button v-if="reg.payment_receipt" @click="viewReceipt(reg.payment_receipt)" class="btn-action" title="View Receipt">
                        📎
                      </button>
                      <button v-if="reg.status === 'rejected' && reg.rejection_count > 0" @click="viewRejectionHistory(reg.id)" class="btn-action" title="View Rejection History">
                        📋
                      </button>
                    </span>
                  </div>
                </div>
                
                <div v-if="registrations.some(r => r.status === 'rejected' && r.rejection_reason)" class="rejection-notes-section">
                  <h4>❌ Rejection Details</h4>
                  <div v-for="reg in registrations.filter(r => r.status === 'rejected' && r.rejection_reason)" :key="reg.id" class="rejection-note">
                    <span class="rejection-company">{{ reg.company_name }}</span>
                    <span class="rejection-reason">{{ reg.rejection_reason }}</span>
                    <span class="rejection-count">(Attempt {{ reg.rejection_count || 1 }})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- ===== COMPANIES TAB ===== -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'companies'" class="tab-panel">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>🏢 Company Management</h3>
                <span class="card-subtitle">{{ filteredCompanies.length }} companies</span>
              </div>
              <button @click="loadCompanies" class="btn-modern secondary small">
                ⟳ Refresh
              </button>
            </div>
            <div class="card-modern-body">
              <div class="filter-bar">
                <div class="filter-search">
                  <input 
                    type="text" 
                    v-model="companySearch" 
                    placeholder="Search companies..." 
                    class="filter-input"
                  />
                </div>
              </div>

              <div v-if="loadingCompanies" class="loading-state small">
                <div class="loading-spinner small"><div class="spinner-ring"></div></div>
                <p>Loading companies...</p>
              </div>

              <div v-else-if="filteredCompanies.length === 0" class="empty-state-modern">
                <span>🏢</span>
                <p>No companies found</p>
              </div>

              <div v-else class="companies-table-wrapper">
                <table class="companies-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>IC Number</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Created / Subscription</th>
                      <th>Users</th>
                      <th>Stalls</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="company in filteredCompanies" :key="company.id">
                      <td><strong>{{ company.company_name || company.name }}</strong></td>
                      <td>{{ company.contact_person || '-' }}</td>
                      <td>{{ company.email || '-' }}</td>
                      <td>{{ company.phone || '-' }}</td>
                      <td>{{ company.ic_number || '-' }}</td>
                      <td><code>{{ company.code || 'N/A' }}</code></td>
                      <td>
                        <span :class="['status-tag', company.is_active !== false ? 'active' : 'inactive']">
                          {{ company.is_active !== false ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <div class="subscription-info">
                          <span class="sub-label">Start:</span>
                          {{ formatDate(company.created_at) }}
                          <br>
                          <span class="sub-label">End:</span>
                          {{ formatSubscriptionEnd(company.created_at) }}
                        </div>
                      </td>
                      <td><span class="count-badge">{{ company.user_count || 0 }}</span></td>
                      <td><span class="count-badge">{{ company.stall_count || 0 }}</span></td>
                      <td>
                        <button 
                          v-if="company.payment_receipt" 
                          @click="viewReceipt(company.payment_receipt)" 
                          class="btn-modern primary small"
                        >
                          View
                        </button>
                        <span v-else class="text-muted">No receipt</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div> <!-- closes tab-content -->

      <!-- ========================================== -->
      <!-- MODALS                                     -->
      <!-- ========================================== -->

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

      <!-- STALL DETAILS MODAL -->
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

      <!-- MENU ITEM DETAILS MODAL -->
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
            
            <div v-if="selectedMenuItem?.stallBreakdown?.length > 0" class="stall-breakdown-container">
              <div class="stall-breakdown-title">🏆 Top Selling Stalls</div>
              <div class="stall-breakdown-header">
                <span class="stall-breakdown-header-name">Stall</span>
                <span class="stall-breakdown-header-revenue">Revenue</span>
                <span class="stall-breakdown-header-quantity">Quantity</span>
                <span class="stall-breakdown-header-bar">Performance</span>
              </div>
              <div 
                v-for="stall in selectedMenuItem.stallBreakdown" 
                :key="stall.stallName"
                class="stall-breakdown-item"
              >
                <span class="stall-breakdown-name">{{ stall.stallName }}</span>
                <span class="stall-breakdown-revenue">{{ formatCurrency(stall.revenue) }}</span>
                <span class="stall-breakdown-quantity">{{ formatNumber(stall.quantity) }}</span>
                <div class="stall-breakdown-bar-wrapper">
                  <div class="stall-breakdown-bar">
                    <div class="stall-breakdown-fill" :style="{ width: Math.min(stall.percentage, 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-modern-footer">
            <button @click="closeMenuDetailModal" class="btn-modern secondary">Close</button>
          </div>
        </div>
      </div>

      <!-- TRANSACTION DETAIL MODAL -->
      <div v-if="transactionDetailModal" class="modal-overlay" @click.self="transactionDetailModal = false">
        <div class="modal-modern modal-lg">
          <div class="modal-modern-header">
            <h3>📋 Transaction #{{ selectedTransaction?.order_number || 'N/A' }}</h3>
            <button @click="transactionDetailModal = false" class="modal-close-btn">✕</button>
          </div>
          <div class="modal-modern-body">
            <div class="transaction-detail-grid">
              <div class="transaction-detail-card">
                <span class="detail-label">Order ID</span>
                <span class="detail-value">#{{ selectedTransaction?.order_number || 'N/A' }}</span>
              </div>
              <div class="transaction-detail-card">
                <span class="detail-label">Stall</span>
                <span class="detail-value">{{ selectedTransaction?.stall_name || '-' }}</span>
              </div>
              <div class="transaction-detail-card">
                <span class="detail-label">Total Amount</span>
                <span class="detail-value">{{ formatCurrency(selectedTransaction?.total_amount || 0) }}</span>
              </div>
              <div class="transaction-detail-card">
                <span class="detail-label">Status</span>
                <span :class="['status-badge', selectedTransaction?.status || 'completed']">
                  {{ getTransactionStatusEmoji(selectedTransaction?.status) }} {{ selectedTransaction?.status || 'Completed' }}
                </span>
              </div>
              <div class="transaction-detail-card">
                <span class="detail-label">📅 Date & Time</span>
                <span class="detail-value">{{ formatFullDateTime(selectedTransaction?.created_at) }}</span>
              </div>
              <div class="transaction-detail-card">
                <span class="detail-label">👤 Processed By</span>
                <span class="detail-value">{{ getProcessedByName(selectedTransaction) }}</span>
              </div>
            </div>
            
            <div class="transaction-items-section">
              <h4>🛒 Items</h4>
              <div v-if="getTransactionItems(selectedTransaction).length > 0" class="transaction-items-list">
                <div class="transaction-items-header">
                  <span class="item-header-name">Item</span>
                  <span class="item-header-qty">Qty</span>
                  <span class="item-header-price">Price</span>
                  <span class="item-header-total">Total</span>
                </div>
                <div 
                  v-for="(item, idx) in getTransactionItems(selectedTransaction)" 
                  :key="idx" 
                  class="transaction-item-row"
                >
                  <span class="item-name">{{ getItemName(item) }}</span>
                  <span class="item-qty">× {{ getItemQuantity(item) }}</span>
                  <span class="item-price">{{ formatCurrency(getItemPrice(item)) }}</span>
                  <span class="item-total">{{ formatCurrency(getItemTotal(item)) }}</span>
                </div>
              </div>
              <div v-else class="empty-state-modern small">
                <span>📭</span>
                <p>No items found for this transaction</p>
              </div>
            </div>
          </div>
          <div class="modal-modern-footer">
            <button @click="transactionDetailModal = false" class="btn-modern secondary">Close</button>
          </div>
        </div>
      </div>

      <!-- TRANSACTION MODAL -->
      <div v-if="transactionModal" class="modal-overlay" @click.self="transactionModal = false">
        <div class="modal-modern modal-lg">
          <div class="modal-modern-header">
            <h3>📊 {{ selectedStallForModal?.name || 'Transaction Details' }}</h3>
            <button @click="transactionModal = false" class="modal-close-btn">✕</button>
          </div>
          <div class="modal-modern-body">
            <div class="modal-stats-grid">
              <div class="modal-stat">
                <span class="modal-stat-label">Total Transactions</span>
                <span class="modal-stat-value">{{ formatNumber(selectedStallForModal?.transactions || 0) }}</span>
              </div>
              <div class="modal-stat">
                <span class="modal-stat-label">Total Revenue</span>
                <span class="modal-stat-value">{{ formatCurrency(selectedStallForModal?.revenue || 0) }}</span>
              </div>
              <div class="modal-stat">
                <span class="modal-stat-label">Avg Transaction</span>
                <span class="modal-stat-value">{{ formatCurrency(selectedStallForModal?.avgTransaction || 0) }}</span>
              </div>
              <div class="modal-stat">
                <span class="modal-stat-label">Top Item</span>
                <span class="modal-stat-value">{{ selectedStallForModal?.topItem || '-' }}</span>
              </div>
            </div>
            
            <div class="modal-transactions">
              <h4>📜 Recent Transactions</h4>
              <div v-if="modalTransactionsLoading" class="loading-state small">
                <div class="loading-spinner small"><div class="spinner-ring"></div></div>
                <p>Loading transactions...</p>
              </div>
              <div v-else-if="modalTransactions.length === 0" class="empty-state-modern small">
                <span>📭</span>
                <p>No transactions found</p>
              </div>
              <div v-else class="modal-transactions-list">
                <div v-for="tx in modalTransactions" :key="tx.id" class="modal-transaction-item">
                  <span class="modal-tx-date">{{ formatDate(tx.created_at) }}</span>
                  <span class="modal-tx-id">#{{ tx.order_id || 'N/A' }}</span>
                  <span class="modal-tx-items">{{ tx.items_count || tx.items?.length || 0 }} items</span>
                  <span class="modal-tx-amount">{{ formatCurrency(tx.total_amount || 0) }}</span>
                  <span :class="['transaction-status', tx.status || 'completed']">
                    {{ tx.status || '✅ Completed' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-modern-footer">
            <button @click="transactionModal = false" class="btn-modern secondary">Close</button>
          </div>
        </div>
      </div>

      <!-- REJECT MODAL -->
      <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal=false">
        <div class="modal-modern">
          <div class="modal-modern-header">
            <h3>❌ Reject Registration</h3>
            <button @click="showRejectModal=false" class="modal-close-btn">✕</button>
          </div>
          <div class="modal-modern-body">
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
              Please provide a reason for rejecting this registration request.
            </p>
            <div class="modal-form-group">
              <label>Rejection Reason *</label>
              <textarea 
                v-model="rejectReason" 
                rows="4"
                placeholder="e.g., Payment receipt is unclear. Please resubmit with a clearer image."
                style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: inherit; resize: vertical;"
              ></textarea>
            </div>
          </div>
          <div class="modal-modern-footer">
            <button @click="showRejectModal=false" class="btn-modern secondary">Cancel</button>
            <button @click="confirmReject" class="btn-modern danger" :disabled="!rejectReason.trim()">
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>

      <!-- REJECTION HISTORY MODAL -->
      <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
        <div class="modal-modern">
          <div class="modal-modern-header">
            <h3>📋 Rejection History</h3>
            <button @click="showHistoryModal = false" class="modal-close-btn">✕</button>
          </div>
          <div class="modal-modern-body">
            <div v-if="rejectionHistory.length === 0" class="empty-state-modern">
              <span>📭</span>
              <p>No rejection history for this registration.</p>
            </div>
            <div v-for="(item, index) in rejectionHistory" :key="index" class="history-item">
              <div class="history-header">
                <span class="attempt-badge">Attempt {{ item.attempt }}</span>
                <span class="history-date">{{ formatDate(item.rejected_at) }}</span>
              </div>
              <div class="history-reason">
                <strong>Reason:</strong> {{ item.reason }}
              </div>
              <div class="history-rejected-by">
                <strong>Rejected by:</strong> {{ item.rejected_by }}
              </div>
            </div>
          </div>
          <div class="modal-modern-footer">
            <button @click="showHistoryModal = false" class="btn-modern secondary">Close</button>
          </div>
        </div>
      </div>

      <!-- VIEW RECEIPT MODAL -->
      <div v-if="viewReceiptModal" class="modal-overlay" @click.self="viewReceiptModal=false">
        <div class="modal-modern modal-lg">
          <div class="modal-modern-header">
            <h3>📎 Payment Receipt</h3>
            <button @click="viewReceiptModal=false" class="modal-close-btn">✕</button>
          </div>
          <div class="modal-modern-body" style="text-align: center; padding: 2rem;">
            <div v-if="viewReceiptUrl && viewReceiptUrl.startsWith('data:image')">
              <img 
                :src="viewReceiptUrl" 
                alt="Payment Receipt" 
                style="max-width: 100%; max-height: 500px; border-radius: var(--radius-sm); border: 1px solid var(--border);" 
                @error="handleReceiptError"
              />
              <p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-tertiary);">
                📸 Image receipt
              </p>
            </div>
            <div v-else-if="viewReceiptUrl && (viewReceiptUrl.includes('.pdf') || viewReceiptUrl.includes('application/pdf') || viewReceiptUrl.startsWith('data:application/pdf'))">
              <div style="background: #f8fafc; padding: 2rem; border-radius: 8px; border: 1px dashed var(--border);">
                <span style="font-size: 3rem;">📄</span>
                <p style="margin-top: 0.5rem; font-weight: 600;">PDF Receipt</p>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Click Download to save the PDF</p>
                <button @click="downloadReceipt" class="btn-modern primary" style="margin-top: 0.5rem;">
                  ⬇️ Download PDF
                </button>
              </div>
            </div>
            <div v-else-if="viewReceiptUrl && viewReceiptUrl.startsWith('http')">
              <img 
                :src="viewReceiptUrl" 
                alt="Payment Receipt" 
                style="max-width: 100%; max-height: 500px; border-radius: var(--radius-sm); border: 1px solid var(--border);" 
                @error="handleReceiptError"
              />
              <p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-tertiary);">
                📎 Receipt from server
              </p>
            </div>
            <div v-else>
              <div style="padding: 2rem;">
                <span style="font-size: 3rem;">📭</span>
                <p style="margin-top: 0.5rem; color: var(--text-secondary);">No receipt available</p>
                <p style="font-size: 0.85rem; color: var(--text-tertiary);">The user did not upload a receipt.</p>
              </div>
            </div>
          </div>
          <div class="modal-modern-footer">
            <button @click="viewReceiptModal=false" class="btn-modern secondary">Close</button>
          </div>
        </div>
      </div>

      <!-- TOP UP MODAL -->
  <div v-if="quickUpdateModal" class="modal-overlay" @click.self="quickUpdateModal=false">
    <div class="modal-modern modal-sm">
      <div class="modal-modern-header">
        <h3>📦 Top Up: {{ quickUpdateStallName }}</h3>
        <button @click="quickUpdateModal=false" class="modal-close-btn">✕</button>
      </div>
      <div class="modal-modern-body">
        <div class="quick-update-grid">
          <div 
            v-for="item in quickUpdateItems" 
            :key="item.material_name" 
            class="quick-update-item"
          >
            <div class="quick-update-info">
              <span class="quick-update-name">{{ item.material_name }}</span>
              <span class="quick-update-current">
                Current: {{ item.current_level }}{{ getUnit(item.material_name) }}
              </span>
              <span 
                class="quick-update-status"
                :class="item.current_level <= item.alert_level ? 'low' : 'ok'"
              >
                {{ item.current_level <= item.alert_level ? '⚠️ LOW' : '✅ OK' }}
              </span>
            </div>
            <div class="quick-update-actions">
              <input 
                type="number" 
                v-model.number="item.newLevel" 
                :placeholder="item.current_level"
                class="filter-input small"
                step="1"
                min="0"
              />
              <button 
                @click="quickUpdateItemSave(quickUpdateStallId, item.material_name, item.newLevel)" 
                class="btn-modern primary small"
              >
                Save
              </button>
              <button 
                @click="quickUpdateItemAdd(quickUpdateStallId, item.material_name, 5)" 
                class="btn-modern secondary small"
              >
                +5
              </button>
              <button 
                @click="quickUpdateItemAdd(quickUpdateStallId, item.material_name, 1)" 
                class="btn-modern secondary small"
              >
                +1
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-modern-footer">
        <button @click="quickUpdateModal=false" class="btn-modern secondary">Close</button>
        <button @click="quickUpdateSaveAll" class="btn-modern primary">Save All</button>
      </div>
    </div>
  </div>

  <!-- BULK UPDATE MODAL -->
  <div v-if="bulkUpdateModal" class="modal-overlay" @click.self="bulkUpdateModal=false">
    <div class="modal-modern modal-lg">
      <div class="modal-modern-header">
        <h3>📦 Bulk Update Inventory</h3>
        <button @click="bulkUpdateModal=false" class="modal-close-btn">✕</button>
      </div>
      <div class="modal-modern-body">
        <!-- Mode Selection -->
        <div class="bulk-mode-selector">
          <button 
            class="mode-btn" 
            :class="{ active: bulkUpdateMode === 'selected' }"
            @click="bulkUpdateMode = 'selected'"
          >
            Selected ({{ selectedCount }})
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: bulkUpdateMode === 'all' }"
            @click="bulkUpdateMode = 'all'"
          >
            All Filtered ({{ filteredInventoryStalls.length }})
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: bulkUpdateMode === 'low-stock' }"
            @click="bulkUpdateMode = 'low-stock'"
          >
            Low Stock Only ({{ inventoryStats.lowStock }})
          </button>
        </div>

        <div class="bulk-preview">
          <p><strong>Updating:</strong> {{ bulkUpdatePreview.length }} stalls</p>
          <div class="bulk-stall-tags">
            <span v-for="stall in bulkUpdatePreview.slice(0, 5)" :key="stall.id" class="stall-tag">
              {{ stall.name }}
            </span>
            <span v-if="bulkUpdatePreview.length > 5" class="stall-tag more">
              +{{ bulkUpdatePreview.length - 5 }} more
            </span>
          </div>
        </div>

        <div class="bulk-materials">
          <h4>Update Materials</h4>
          
          <div class="quick-actions">
            <span class="quick-label">Quick:</span>
            <button 
              v-for="action in quickActions" 
              :key="action.label"
              class="btn-modern secondary small"
              @click="applyQuickAction(action)"
            >
              {{ action.label }}
            </button>
          </div>

          <div class="bulk-material-grid">
            <div v-for="material in bulkUpdateMaterials" :key="material.name" class="bulk-material-item">
              <label class="bulk-material-label">
                <input type="checkbox" v-model="material.selected" />
                <span class="bulk-material-name">{{ material.name }}</span>
              </label>
              <div class="bulk-material-inputs">
                <select v-model="material.operation" class="filter-select small">
                  <option value="set">Set to</option>
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
                <input 
                  type="number" 
                  v-model.number="material.value" 
                  class="filter-input small"
                  placeholder="Value"
                />
              </div>
              <span class="bulk-material-unit">{{ getUnit(material.name) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-modern-footer">
        <button @click="bulkUpdateModal=false" class="btn-modern secondary">Cancel</button>
        <button @click="executeBulkUpdate" class="btn-modern primary" :disabled="bulkUpdating">
          {{ bulkUpdating ? 'Updating...' : 'Apply to All' }}
        </button>
      </div>
    </div>
  </div>

    </div> <!-- closes sa-dashboard -->
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
      companyLogo: { type: String, default: null },
      user: { type: Object, default: null }
    },

    data() {
      return {
        // ===== TABS =====
        activeTab: 'dashboard',
        tabs: [
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'inventory', label: 'Inventory', icon: '📦' },
          { id: 'stalls', label: 'Stalls', icon: '🏪' },
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'menu', label: 'Menu', icon: '📋' },
          { id: 'revenue', label: 'Revenue', icon: '💰' },
          { id: 'transactions', label: 'Transactions', icon: '📋' },
          { id: 'registrations', label: 'Registrations', icon: '📝' },
          { id: 'companies', label: 'Companies', icon: '🏢' }
        ],
        
        // ===== SUB-TABS =====
        stallSubTab: 'management',
        menuSubTab: 'management',
        
        // ===== DROPDOWNS =====
        dropdownOpen: false,
        periodDropdownOpen: false,
        selectedPeriod: 'week',
        periods: [
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'quarter', label: 'Quarter' },
          { value: 'halfyear', label: 'Half Year' },
          { value: 'year', label: 'Year' },
          { value: 'custom', label: 'Custom Range' }
        ],
        customDateStart: null,
        customDateEnd: null,
        customDays: 30,

        // ===== MALAYSIA STATES =====
        malaysiaStates: [
          'All States', 'Selangor', 'Kuala Lumpur', 'Putrajaya',
          'Johor', 'Kedah', 'Kelantan', 'Melaka', 
          'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
          'Penang', 'Sabah', 'Sarawak', 'Terengganu', 'Labuan'
        ],
        stateFilter: 'All States',

        // ===== DATA =====
        stalls: [],
        users: [],
        lowStock: [],
        menuItems: [],
        companies: [],
        registrations: [],
        pendingRegistrations: [],
        loadingRegistrations: false,
        loadingCompanies: false,
        companySearch: '',

        // ===== SALES DATA =====
        consolidatedSales: {
          totalRevenue: 0,
          totalItems: 0,
          averagePerStall: 0,
          topStall: '-',
          topRevenue: 0
        },
        stallPerformance: [],
        stallPerformanceAllTime: [],
        menuPerformance: [],
        salesTrend: [],
        productSales: {},

        // ===== INVENTORY =====
        stallInventory: {},
        inventory: [],
        inventorySearch: '',
        inventoryFilter: 'all',
        expandedInventoryStall: null,
        selectedStalls: [],
        selectAll: false,
        currentPage: 1,
        itemsPerPage: 10,

        // ===== STALL MANAGEMENT =====
        stallSearch: '',
        stallStatusFilter: 'all',
        _stallCurrentPage: 1,
        selectAllStalls: false,

        // ===== USER MANAGEMENT =====
        userSearch: '',
        userRoleFilter: 'all',
        userStateFilter: 'All States',
        userCurrentPage: 1,
        userItemsPerPage: 10,
        selectedUsers: [],
        selectAllUsers: false,
        currentUserId: null,

        // ===== MENU =====
        // Menu Management
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
        
        // Menu Assignment
        menuSearch: '',
        menuCategoryFilter: 'all',
        menuCurrentPage: 1,
        menuItemsPerPage: 10,
        selectedMenuItems: [],
        selectAllMenuItems: false,
        selectedAssignmentStall: null,
        menuAssignments: {},
        originalMenuAssignments: {},
        loadingMenuAssignments: false,
        savingAssignment: false,
        savedAssignmentMessage: '',
        savedAssignmentType: 'success',
        showStallMenuView: false,
        loadingStallMenus: false,
        stallMenuAssignments: [],
        expandedStallMenus: [],
        assignMode: 'single',
        selectedStallsForAssign: [],
        selectAllStallsForAssign: false,
        selectedMenuItemsForBulk: [],
        selectAllMenusForBulk: false,
        bulkMenuSearch: '',
        bulkAssignToStallsLoading: false,
        bulkAssignMessage: '',
        bulkAssignMessageType: 'success',

        // ===== MENU PERFORMANCE =====
        menuPerformancePage: 1,
        menuPerformancePerPage: 10,
        menuPerformanceCategoryFilter: 'all',
        menuPerformanceStateFilter: 'All States',
        menuPerformanceSortBy: 'rank',
        menuPerformanceSortOrder: 'desc',

        // ===== REVENUE =====
        revenueStateFilter: 'All States',
        revenueStallFilter: 'all',
        revenueSearch: '',
        revenuePage: 1,
        revenueItemsPerPage: 10,
        revenueSortBy: 'revenue',
        revenueSortOrder: 'desc',
        revenueData: [],
        revenueChartInstance: null,
        revenueStateChartInstance: null,
        revenueLoading: false,

        // ===== TRANSACTIONS =====
        transactions: [],
        transactionsLoading: false,
        transactionPage: 1,
        transactionItemsPerPage: 10,
        transactionSearch: '',
        transactionStallFilter: 'all',
        transactionStatusFilter: 'all',
        transactionDateFrom: null,
        transactionDateTo: null,
        transactionSortBy: 'created_at',
        transactionSortOrder: 'desc',

        // ===== PERFORMANCE =====
        performanceSearch: '',
        performanceStateFilter: 'All States',
        performanceStatusFilter: 'all',
        performancePage: 1,
        performanceSortBy: 'rank',
        performanceSortOrder: 'asc',

        // ===== SHIFT HISTORY =====
        shiftHistory: [],
        shiftHistoryLoading: false,
        shiftHistoryTotal: 0,
        shiftHistorySearch: '',
        shiftHistoryStateFilter: 'All States',
        shiftHistoryStallFilter: 'all',
        shiftHistoryStatusFilter: 'all',
        shiftCurrentPage: 1,
        shiftItemsPerPage: 10,
        shiftDetailModal: false,
        selectedShift: null,

        // ===== MODALS =====
        userModal: false,
        editingUser: false,
        userForm: { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] },
        stallModal: false,
        editingStall: false,
        stallForm: { id: null, name: '', code: '', location: '' },
        stallDetailModal: false,
        selectedStall: null,
        menuDetailModal: false,
        selectedMenuItem: null,
        stallDetailChartInstance: null,
        transactionModal: false,
        selectedStallForModal: null,
        modalTransactions: [],
        modalTransactionsLoading: false,
        transactionDetailModal: false,
        selectedTransaction: null,
        showRejectModal: false,
        rejectReason: '',
        rejectId: null,
        showHistoryModal: false,
        rejectionHistory: [],
        viewReceiptModal: false,
        viewReceiptUrl: null,

        // ===== BULK UPDATE =====
        bulkUpdateModal: false,
        bulkUpdateMaterials: [],
        bulkUpdateMode: 'selected',
        bulkUpdating: false,
        quickActions: [
          { label: 'Set to Alert Level', value: 'alert' },
          { label: 'Set to 100', value: '100' },
          { label: 'Set to 50', value: '50' },
          { label: 'Add +10', value: 'add10' },
          { label: 'Add +20', value: 'add20' },
          { label: 'Reset to 0', value: '0' }
        ],
        quickUpdateModal: false,
        quickUpdateStallId: null,
        quickUpdateStallName: '',
        quickUpdateItems: [],

        // ===== CHART =====
        chartFullscreen: false,
        chartOffset: 0,
        chartWindow: 7,
        chartInstance: null,
        isChartInitialized: false,
        resizeObserver: null,

        // ===== EXPORT =====
        exporting: false,
        loading: false,

        // ===== BULK ASSIGN MODAL =====
        bulkAssignModal: false,
        bulkAssignStalls: [],
        bulkAssignLoading: false,
        selectAllBulkStalls: false,
      }
    },

    // ===== COMPUTED =====
    computed: {
      activeTabLabel() {
        const tab = this.tabs.find(t => t.id === this.activeTab)
        return tab ? tab.label : 'Dashboard'
      },
      activeTabIcon() {
        const tab = this.tabs.find(t => t.id === this.activeTab)
        return tab ? tab.icon : '📊'
      },

      // ===== INVENTORY =====
      filteredInventoryStalls() {
        return this.stalls.filter(stall => {
          const matchesSearch = stall.name.toLowerCase().includes(this.inventorySearch.toLowerCase()) ||
                                this.getStallInventory(stall.id).some(item => 
                                  item.material_name.toLowerCase().includes(this.inventorySearch.toLowerCase())
                                )
          const matchesState = this.stateFilter === 'All States' || 
                              (stall.state || '') === this.stateFilter
          const matchesStatus = this.inventoryFilter === 'all' || 
                                (this.inventoryFilter === 'active' && stall.is_active) ||
                                (this.inventoryFilter === 'inactive' && !stall.is_active) ||
                                (this.inventoryFilter === 'low' && this.hasLowStock(stall.id))
          return matchesSearch && matchesState && matchesStatus
        })
      },
      paginatedStalls() {
        const start = (this.currentPage - 1) * this.itemsPerPage
        const end = start + this.itemsPerPage
        return this.filteredInventoryStalls.slice(start, end)
      },
      totalPages() {
        return Math.ceil(this.filteredInventoryStalls.length / this.itemsPerPage) || 1
      },
      startIndex() {
        if (!this.filteredInventoryStalls || this.filteredInventoryStalls.length === 0) {
          return 0
        }
        const start = (this.currentPage - 1) * this.itemsPerPage + 1
        return Math.min(start, this.filteredInventoryStalls.length)
      },
      endIndex() {
        if (!this.filteredInventoryStalls || this.filteredInventoryStalls.length === 0) {
          return 0
        }
        return Math.min(this.currentPage * this.itemsPerPage, this.filteredInventoryStalls.length)
      },
      selectedCount() {
        return this.selectedStalls.length
      },
      inventoryStats() {
        let lowStock = 0
        this.stalls.forEach(stall => {
          const items = this.getStallInventorySummary(stall.id)
          items.forEach(item => {
            if (item.current_level <= item.alert_level) {
              lowStock++
            }
          })
        })
        return {
          total: this.stalls.length,
          active: this.stalls.filter(s => s.is_active).length,
          inactive: this.stalls.filter(s => !s.is_active).length,
          lowStock: lowStock
        }
      },
      bulkUpdatePreview() {
        const stalls = this.bulkUpdateMode === 'all' 
          ? this.filteredInventoryStalls 
          : this.filteredInventoryStalls.filter(s => this.selectedStalls.includes(s.id))
        return stalls
      },

      // ===== STALLS =====
      filteredStallsList() {
        return this.stalls.filter(stall => {
          const matchesSearch = stall.name.toLowerCase().includes(this.stallSearch.toLowerCase()) ||
                                stall.code.toLowerCase().includes(this.stallSearch.toLowerCase())
          const matchesState = this.stateFilter === 'All States' || 
                              (stall.state || '') === this.stateFilter
          const matchesStatus = this.stallStatusFilter === 'all' || 
                                (this.stallStatusFilter === 'active' && stall.is_active) ||
                                (this.stallStatusFilter === 'inactive' && !stall.is_active)
          return matchesSearch && matchesState && matchesStatus
        })
      },
      stallTotalPages() {
        if (!this.filteredStallsList || this.filteredStallsList.length === 0) {
          return 1
        }
        return Math.ceil(this.filteredStallsList.length / this.itemsPerPage) || 1
      },
      paginatedStallsList() {
        const start = (this.stallCurrentPage - 1) * this.itemsPerPage
        const end = start + this.itemsPerPage
        return this.filteredStallsList.slice(start, end)
      },
      stallStartIndex() {
        if (!this.filteredStallsList || this.filteredStallsList.length === 0) {
          return 0
        }
        const start = (this.stallCurrentPage - 1) * this.itemsPerPage + 1
        return Math.min(start, this.filteredStallsList.length)
      },
      stallEndIndex() {
        if (!this.filteredStallsList || this.filteredStallsList.length === 0) {
          return 0
        }
        return Math.min(this.stallCurrentPage * this.itemsPerPage, this.filteredStallsList.length)
      },
      selectedStallsCount() {
        return this.selectedStalls.length
      },
      stallStats() {
        let lowStockCount = 0
        this.stalls.forEach(stall => {
          if (this.hasLowStock(stall.id)) {
            lowStockCount++
          }
        })
        return {
          total: this.stalls.length || 0,
          active: this.stalls.filter(s => s.is_active).length || 0,
          inactive: this.stalls.filter(s => !s.is_active).length || 0,
          lowStock: lowStockCount
        }
      },

      // ===== STALL PERFORMANCE =====
      dashboardDisplayStalls() {
        const stallsWithSales = this.stallPerformance.filter(stall => 
          (stall.revenue || 0) > 0
        )
        return stallsWithSales.slice(0, 5)
      },
      dashboardStallPerformanceSubtitle() {
        const hasPeriodSales = this.stallPerformance.some(s => (s.revenue || 0) > 0)
        if (!hasPeriodSales) {
          return `No sales for ${this.getPeriodLabel()}`
        }
        const count = this.dashboardDisplayStalls.length
        if (count === 0) return `No stalls with sales for ${this.getPeriodLabel()}`
        if (count === 1) return `Top stall with sales for ${this.getPeriodLabel()}`
        return `Top ${count} stalls with sales for ${this.getPeriodLabel()}`
      },
      filteredPerformanceList() {
    // Start with all stalls sorted by revenue (already sorted from loadStallPerformance)
    let list = this.stallPerformance.map(stall => ({
      ...stall,
      // Ensure revenue is a number
      revenue: parseFloat(stall.revenue) || 0
    }))
    
    // Apply search filter
    if (this.performanceSearch) {
      const search = this.performanceSearch.toLowerCase()
      list = list.filter(stall => 
        stall.name.toLowerCase().includes(search) ||
        (stall.code && stall.code.toLowerCase().includes(search))
      )
    }
    
    // Apply state filter
    if (this.performanceStateFilter !== 'All States') {
      list = list.filter(stall => stall.state === this.performanceStateFilter)
    }
    
    // Apply status filter
    if (this.performanceStatusFilter !== 'all') {
      list = list.filter(stall => {
        const revenue = stall.revenue || 0
        let status = 'no-sales'
        if (revenue === 0) status = 'no-sales'
        else if (revenue > 1000) status = 'excellent'
        else if (revenue > 500) status = 'good'
        else if (revenue > 100) status = 'average'
        else status = 'poor'
        return status === this.performanceStatusFilter
      })
    }
    
    // ===== SORT BY REVENUE (HIGHEST FIRST) =====
    list.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    
    return list
  },
      paginatedPerformanceList() {
        const start = (this.performancePage - 1) * this.itemsPerPage
        const end = start + this.itemsPerPage
        return this.filteredPerformanceList.slice(start, end)
      },
      performanceTotalPages() {
        return Math.ceil(this.filteredPerformanceList.length / this.itemsPerPage) || 1
      },
      performanceStartIndex() {
        if (this.filteredPerformanceList.length === 0) return 0
        return (this.performancePage - 1) * this.itemsPerPage + 1
      },
      performanceEndIndex() {
        if (this.filteredPerformanceList.length === 0) return 0
        return Math.min(this.performancePage * this.itemsPerPage, this.filteredPerformanceList.length)
      },
      performanceStats() {
        let excellent = 0, good = 0, average = 0, poor = 0, noSales = 0
        this.stallPerformance.forEach(stall => {
          const revenue = stall.revenue || 0
          if (revenue === 0) noSales++
          else if (revenue > 1000) excellent++
          else if (revenue > 500) good++
          else if (revenue > 100) average++
          else poor++
        })
        return { excellent, good, average, poor, noSales }
      },

      // ===== USERS =====
      filteredUsersList() {
        return this.users.filter(user => {
          if (user.role === 'super_admin' || user.role === 'super_super_admin') {
            return false
          }
          const search = this.userSearch.toLowerCase()
          const matchesSearch = user.username.toLowerCase().includes(search) ||
                                (user.full_name && user.full_name.toLowerCase().includes(search))
          const matchesRole = this.userRoleFilter === 'all' || user.role === this.userRoleFilter
          const matchesState = this.userStateFilter === 'All States' || 
                              (user.assigned_stalls && user.assigned_stalls.some(stall => 
                                stall.state === this.userStateFilter
                              ))
          return matchesSearch && matchesRole && matchesState
        })
      },
      userTotalPages() {
        return Math.ceil(this.filteredUsersList.length / this.userItemsPerPage) || 1
      },
      paginatedUsersList() {
        const start = (this.userCurrentPage - 1) * this.userItemsPerPage
        const end = start + this.userItemsPerPage
        return this.filteredUsersList.slice(start, end)
      },
      userStartIndex() {
        if (this.filteredUsersList.length === 0) return 0
        return (this.userCurrentPage - 1) * this.userItemsPerPage + 1
      },
      userEndIndex() {
        if (this.filteredUsersList.length === 0) return 0
        return Math.min(this.userCurrentPage * this.userItemsPerPage, this.filteredUsersList.length)
      },
      selectedUsersCount() {
        return this.selectedUsers.length
      },
      userStats() {
        const users = this.users.filter(u => 
          u.role !== 'super_admin' && u.role !== 'super_super_admin'
        )
        return {
          total: users.length,
          admins: users.filter(u => u.role === 'stall_admin').length,
          cashiers: users.filter(u => u.role === 'cashier').length,
          active: users.filter(u => u.is_active !== false).length,
          inactive: users.filter(u => u.is_active === false).length
        }
      },

      // ===== MENU =====
      filteredMenuItemsForManagement() {
        let items = this.menuItems
        if (this.menuSearch) {
          const search = this.menuSearch.toLowerCase()
          items = items.filter(item => 
            item.item_name.toLowerCase().includes(search)
          )
        }
        if (this.menuCategoryFilter !== 'all') {
          items = items.filter(item => 
            (item.category || 'Main') === this.menuCategoryFilter
          )
        }
        return items.sort((a, b) => a.item_name.localeCompare(b.item_name))
      },
      paginatedMenuItemsForManagement() {
        const start = (this.menuCurrentPage - 1) * this.menuItemsPerPage
        const end = start + this.menuItemsPerPage
        return this.filteredMenuItemsForManagement.slice(start, end)
      },
      filteredMenuItemsForAssignment() {
        let items = this.menuItems
        if (this.menuSearch) {
          const search = this.menuSearch.toLowerCase()
          items = items.filter(item => 
            item.item_name.toLowerCase().includes(search)
          )
        }
        if (this.menuCategoryFilter !== 'all') {
          items = items.filter(item => 
            (item.category || 'Main') === this.menuCategoryFilter
          )
        }
        return items.sort((a, b) => a.item_name.localeCompare(b.item_name))
      },
      paginatedMenuItems() {
        const start = (this.menuCurrentPage - 1) * this.menuItemsPerPage
        const end = start + this.menuItemsPerPage
        return this.filteredMenuItemsForAssignment.slice(start, end)
      },
      menuTotalPages() {
        if (!this.filteredMenuItemsForManagement || this.filteredMenuItemsForManagement.length === 0) {
          return 1
        }
        return Math.ceil(this.filteredMenuItemsForManagement.length / this.menuItemsPerPage) || 1
      },
      menuStartIndex() {
        if (!this.filteredMenuItemsForManagement || this.filteredMenuItemsForManagement.length === 0) {
          return 0
        }
        const start = (this.menuCurrentPage - 1) * this.menuItemsPerPage + 1
        return Math.min(start, this.filteredMenuItemsForManagement.length)
      },
      menuEndIndex() {
        if (!this.filteredMenuItemsForManagement || this.filteredMenuItemsForManagement.length === 0) {
          return 0
        }
        return Math.min(this.menuCurrentPage * this.menuItemsPerPage, this.filteredMenuItemsForManagement.length)
      },
      selectedMenuItemsCount() {
        return this.selectedMenuItems.length
      },
      menuStats() {
        const total = this.menuItems.length
        const active = this.menuItems.filter(item => item.price > 0).length
        const inactive = total - active
        return { total, active, inactive }
      },
      menuCategories() {
        const categories = new Set()
        this.menuItems.forEach(item => {
          if (item.category) {
            categories.add(item.category)
          }
        })
        return ['all', ...Array.from(categories)]
      },
      filteredBulkMenuItems() {
        let items = this.menuItems
        if (this.bulkMenuSearch) {
          const search = this.bulkMenuSearch.toLowerCase()
          items = items.filter(item => 
            item.item_name.toLowerCase().includes(search)
          )
        }
        return items.sort((a, b) => a.item_name.localeCompare(b.item_name))
      },

      // ===== MENU PERFORMANCE =====
      filteredMenuPerformance() {
        let items = this.menuPerformance
        if (this.menuPerformanceCategoryFilter !== 'all') {
          items = items.filter(item => 
            (item.category || 'Main') === this.menuPerformanceCategoryFilter
          )
        }
        if (this.menuPerformanceStateFilter !== 'All States') {
          items = items.filter(item => {
            if (item.stallBreakdown) {
              return item.stallBreakdown.some(stall => 
                stall.state === this.menuPerformanceStateFilter
              )
            }
            return true
          })
        }
        return this.sortMenuPerformanceList(items)
      },
      paginatedMenuPerformance() {
        const start = (this.menuPerformancePage - 1) * this.menuPerformancePerPage
        const end = start + this.menuPerformancePerPage
        return this.filteredMenuPerformance.slice(start, end)
      },
      menuPerformanceTotalPages() {
        return Math.ceil(this.filteredMenuPerformance.length / this.menuPerformancePerPage) || 1
      },
      menuPerformanceStartIndex() {
        if (this.filteredMenuPerformance.length === 0) return 0
        return (this.menuPerformancePage - 1) * this.menuPerformancePerPage + 1
      },
      menuPerformanceEndIndex() {
        if (this.filteredMenuPerformance.length === 0) return 0
        return Math.min(this.menuPerformancePage * this.menuPerformancePerPage, this.filteredMenuPerformance.length)
      },
      menuPerformanceStats() {
        const totalRevenue = this.menuPerformance.reduce((sum, item) => sum + (item.revenue || 0), 0)
        let topItem = null
        let maxRevenue = 0
        this.menuPerformance.forEach(item => {
          const revenue = item.revenue || 0
          if (revenue > maxRevenue) {
            maxRevenue = revenue
            topItem = item
          }
        })
        return {
          totalItems: this.menuPerformance.length,
          totalRevenue,
          topItemName: topItem?.name || '-',
          topItemRevenue: maxRevenue || 0
        }
      },
      menuPerformanceBreakdown() {
        let excellent = 0, good = 0, average = 0, poor = 0, noSales = 0
        this.menuPerformance.forEach(item => {
          const qty = parseInt(item.quantity) || 0
          if (qty === 0) noSales++
          else if (qty > 50) excellent++
          else if (qty > 20) good++
          else if (qty > 5) average++
          else poor++
        })
        return { excellent, good, average, poor, noSales }
      },
      displayMenuItems() {
        if (this.showAllMenuItems) {
          return this.menuPerformance
        }
        return this.menuPerformance.slice(0, 5)
      },

      // ===== REVENUE =====
      filteredRevenueData() {
        let data = this.revenueData
        if (this.revenueStateFilter !== 'All States') {
          data = data.filter(item => item.state === this.revenueStateFilter)
        }
        if (this.revenueStallFilter !== 'all') {
          data = data.filter(item => item.id === this.revenueStallFilter)
        }
        if (this.revenueSearch) {
          const search = this.revenueSearch.toLowerCase()
          data = data.filter(item => 
            item.name.toLowerCase().includes(search) ||
            item.code?.toLowerCase().includes(search)
          )
        }
        return this.sortRevenueData(data)
      },
      paginatedRevenueData() {
        const start = (this.revenuePage - 1) * this.revenueItemsPerPage
        const end = start + this.revenueItemsPerPage
        return this.filteredRevenueData.slice(start, end)
      },
      revenueTotalPages() {
        return Math.ceil(this.filteredRevenueData.length / this.revenueItemsPerPage) || 1
      },
      revenueStartIndex() {
        if (this.filteredRevenueData.length === 0) return 0
        return (this.revenuePage - 1) * this.revenueItemsPerPage + 1
      },
      revenueEndIndex() {
        if (this.filteredRevenueData.length === 0) return 0
        return Math.min(this.revenuePage * this.revenueItemsPerPage, this.filteredRevenueData.length)
      },
      revenueStats() {
        const totalRevenue = this.revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0)
        const totalTransactions = this.revenueData.reduce((sum, item) => sum + (item.transactions || 0), 0)
        const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
        let topStall = null
        let maxRevenue = 0
        this.revenueData.forEach(item => {
          if ((item.revenue || 0) > maxRevenue) {
            maxRevenue = item.revenue || 0
            topStall = item
          }
        })
        return {
          totalRevenue,
          totalTransactions,
          avgTransaction,
          topStallName: topStall?.name || '-',
          topStallRevenue: maxRevenue || 0
        }
      },
      revenueStateStats() {
        const stateMap = {}
        this.revenueData.forEach(item => {
          const state = item.state || 'Unknown'
          if (!stateMap[state]) {
            stateMap[state] = { state, revenue: 0, transactions: 0, stalls: 0 }
          }
          stateMap[state].revenue += item.revenue || 0
          stateMap[state].transactions += item.transactions || 0
          stateMap[state].stalls += 1
        })
        return Object.values(stateMap).sort((a, b) => b.revenue - a.revenue)
      },
      revenueGrowth() {
        if (this.revenueData.length < 2) return 0
        const sorted = [...this.revenueData].sort((a, b) => a.revenue - b.revenue)
        const first = sorted[0]?.revenue || 0
        const last = sorted[sorted.length - 1]?.revenue || 0
        if (first === 0) return 0
        return ((last - first) / first * 100)
      },
      getRevenuePeriodLabel() {
        const p = this.periods.find(p => p.value === this.selectedPeriod)
        if (this.selectedPeriod === 'custom') {
          return `Custom (${this.customDays} days)`
        }
        return p ? p.label : 'Week'
      },

      // ===== TRANSACTIONS =====
      filteredTransactions() {
        let data = this.transactions
        if (this.transactionSearch) {
          const search = this.transactionSearch.toLowerCase()
          data = data.filter(tx => 
            (tx.order_number && tx.order_number.toLowerCase().includes(search)) ||
            (tx.stall_name && tx.stall_name.toLowerCase().includes(search))
          )
        }
        if (this.transactionStallFilter !== 'all') {
          data = data.filter(tx => tx.stall_id === this.transactionStallFilter)
        }
        if (this.transactionStatusFilter !== 'all') {
          data = data.filter(tx => (tx.status || 'completed') === this.transactionStatusFilter)
        }
        if (this.transactionDateFrom) {
          const from = new Date(this.transactionDateFrom)
          from.setHours(0, 0, 0, 0)
          data = data.filter(tx => {
            const date = new Date(tx.created_at)
            return date >= from
          })
        }
        if (this.transactionDateTo) {
          const to = new Date(this.transactionDateTo)
          to.setHours(23, 59, 59, 999)
          data = data.filter(tx => {
            const date = new Date(tx.created_at)
            return date <= to
          })
        }
        const sortBy = this.transactionSortBy
        const order = this.transactionSortOrder
        data.sort((a, b) => {
          let valA = a[sortBy] || ''
          let valB = b[sortBy] || ''
          if (sortBy === 'total_amount' || sortBy === 'item_count') {
            valA = parseFloat(valA) || 0
            valB = parseFloat(valB) || 0
          }
          if (typeof valA === 'string') {
            valA = valA.toLowerCase()
            valB = valB.toLowerCase()
          }
          if (order === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0
          } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0
          }
        })
        return data
      },
      paginatedTransactions() {
        const start = (this.transactionPage - 1) * this.transactionItemsPerPage
        const end = start + this.transactionItemsPerPage
        return this.filteredTransactions.slice(start, end)
      },
      transactionTotalPages() {
        return Math.ceil(this.filteredTransactions.length / this.transactionItemsPerPage) || 1
      },
      transactionStartIndex() {
        if (this.filteredTransactions.length === 0) return 0
        return (this.transactionPage - 1) * this.transactionItemsPerPage + 1
      },
      transactionEndIndex() {
        if (this.filteredTransactions.length === 0) return 0
        return Math.min(this.transactionPage * this.transactionItemsPerPage, this.filteredTransactions.length)
      },
      transactionStats() {
        const total = this.transactions.length
        const totalRevenue = this.transactions.reduce((sum, tx) => {
          const amount = tx.total_amount || tx.amount || tx.total || 0
          return sum + parseFloat(amount)
        }, 0)
        const average = total > 0 ? totalRevenue / total : 0
        const completed = this.transactions.filter(tx => {
          const status = (tx.status || '').toLowerCase()
          return status === 'completed'
        }).length
        const pending = this.transactions.filter(tx => {
          const status = (tx.status || '').toLowerCase()
          return status === 'pending'
        }).length
        return { total, totalRevenue, average, completed, pending }
      },

      // ===== SHIFT HISTORY =====
      filteredShiftHistory() {
        let data = this.shiftHistory
        if (this.shiftHistorySearch) {
          const search = this.shiftHistorySearch.toLowerCase()
          data = data.filter(shift => {
            const stallName = this.getStallName(shift.stall_id).toLowerCase()
            const date = this.formatDate(shift.opened_at).toLowerCase()
            const revenue = this.formatCurrency(shift.revenue || 0).toLowerCase()
            const status = (shift.status || '').toLowerCase()
            return stallName.includes(search) ||
                  date.includes(search) ||
                  revenue.includes(search) ||
                  status.includes(search)
          })
        }
        if (this.shiftHistoryStateFilter !== 'All States') {
          data = data.filter(shift => {
            const stall = this.stalls.find(s => s.id === shift.stall_id)
            return stall && stall.state === this.shiftHistoryStateFilter
          })
        }
        if (this.shiftHistoryStallFilter !== 'all') {
          data = data.filter(s => s.stall_id === this.shiftHistoryStallFilter)
        }
        if (this.shiftHistoryStatusFilter !== 'all') {
          data = data.filter(s => s.status === this.shiftHistoryStatusFilter)
        }
        return data.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at))
      },
      paginatedShiftHistory() {
        const start = (this.shiftCurrentPage - 1) * this.shiftItemsPerPage
        const end = start + this.shiftItemsPerPage
        return this.filteredShiftHistory.slice(start, end)
      },
      shiftTotalPages() {
        return Math.ceil(this.filteredShiftHistory.length / this.shiftItemsPerPage) || 1
      },
      shiftStartIndex() {
        if (this.filteredShiftHistory.length === 0) return 0
        return (this.shiftCurrentPage - 1) * this.shiftItemsPerPage + 1
      },
      shiftEndIndex() {
        if (this.filteredShiftHistory.length === 0) return 0
        return Math.min(this.shiftCurrentPage * this.shiftItemsPerPage, this.filteredShiftHistory.length)
      },

      // ===== COMPANIES =====
      filteredCompanies() {
        return this.companies.filter(company => {
          const search = this.companySearch.toLowerCase()
          return company.name.toLowerCase().includes(search) ||
                (company.code && company.code.toLowerCase().includes(search))
        })
      },

      // ===== CHART =====
      chartVisibleData() {
        return this.salesTrend.slice(this.chartOffset, this.chartOffset + this.chartWindow)
      },
    },

    // ===== WATCHERS =====
    watch: {
      selectedPeriod(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.stallPerformance = []
          this.menuPerformance = []
          this.salesTrend = []
          this.consolidatedSales.topStall = '-'
          this.consolidatedSales.topRevenue = 0
          this.consolidatedSales.totalRevenue = 0
          this.consolidatedSales.totalItems = 0
          this.refreshAllDataForPeriod()
        }
      },
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
            setTimeout(() => this.initChart(), 100)
          } else {
            setTimeout(() => this.initChart(), 150)
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

    // ===== MOUNTED =====
    mounted() {
      this.loadData()
      document.addEventListener('click', this.handleClickOutside)
      this.currentUserId = this.user?.id || null
    },

    // ===== BEFORE UNMOUNT =====
    beforeUnmount() {
      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }
      if (this.stallDetailChartInstance) {
        this.stallDetailChartInstance.dispose()
        this.stallDetailChartInstance = null
      }
      if (this.revenueChartInstance) {
        this.revenueChartInstance.dispose()
        this.revenueChartInstance = null
      }
      if (this.revenueStateChartInstance) {
        this.revenueStateChartInstance.dispose()
        this.revenueStateChartInstance = null
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
      }
      document.removeEventListener('click', this.handleClickOutside)
      window.removeEventListener('resize', this.handleChartResize)
    },

    // ===== METHODS =====
    methods: {

      // =============================================
      // TIME ZONE HELPERS (Malaysia Time)
      // =============================================
      getTodayInMalaysia() {
        const now = new Date()
        const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
        const today = new Date(malaysiaTime)
        today.setHours(0, 0, 0, 0)
        return today
      },

      formatDate(dateStr) {
        if (!dateStr) return 'N/A'
        const date = new Date(dateStr)
        return date.toLocaleString('en-MY', {
          timeZone: 'Asia/Kuala_Lumpur',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },

      formatDateTime(dateStr) {
        if (!dateStr) return ''
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return ''
          return date.toLocaleString('en-MY', { 
            timeZone: 'Asia/Kuala_Lumpur',
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
          })
        } catch {
          return ''
        }
      },

      formatTime(dateStr) {
        if (!dateStr) return ''
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return ''
          return date.toLocaleTimeString('en-MY', { 
            timeZone: 'Asia/Kuala_Lumpur',
            hour: '2-digit', 
            minute: '2-digit' 
          })
        } catch {
          return ''
        }
      },

      formatFullDateTime(dateStr) {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-MY', {
          timeZone: 'Asia/Kuala_Lumpur',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      },

      formatTableDate(dateStr) {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-MY', {
          timeZone: 'Asia/Kuala_Lumpur',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      },

      formatShortDate(dateStr) {
        if (!dateStr) return ''
        if (this.selectedPeriod === 'today') {
          const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
          if (!dateParts) return dateStr
          const hour = parseInt(dateParts[4])
          const ampm = hour >= 12 ? 'PM' : 'AM'
          const hours12 = hour % 12 || 12
          return `${hours12}:00 ${ampm}`
        }
        const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (!dateParts) return dateStr
        const date = new Date(Date.UTC(
          parseInt(dateParts[1]),
          parseInt(dateParts[2]) - 1,
          parseInt(dateParts[3])
        ))
        return date.toLocaleDateString('en-MY', { 
          timeZone: 'Asia/Kuala_Lumpur',
          weekday: 'short', 
          day: 'numeric' 
        })
      },

      formatFullDate(dateStr) {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('en-MY', { 
          timeZone: 'Asia/Kuala_Lumpur',
          weekday: 'long', 
          day: 'numeric', 
          month: 'short' 
        })
      },

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

      getUnit(materialName) {
        return 'pieces'
      },

      getPeriodLabel() {
        const p = this.periods.find(p => p.value === this.selectedPeriod)
        if (this.selectedPeriod === 'custom') {
          return `Custom (${this.customDays} days)`
        }
        return p ? p.label : 'Week'
      },

      getWeekStart(date) {
        const d = new Date(date)
        const day = d.getUTCDay()
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
        const weekStart = new Date(d)
        weekStart.setUTCDate(diff)
        weekStart.setUTCHours(0, 0, 0, 0)
        return weekStart
      },

      // =============================================
  // GROUPING HELPERS - ADD THESE IF MISSING
  // =============================================

  groupSalesData(salesData, grouping, period) {
    if (!salesData || salesData.length === 0) return []
    
    // Month - Group by Week
    if (period === 'month') {
      return this.groupByWeek(salesData)
    }
    
    // Quarter, Half Year, Year - Group by Month
    if (period === 'quarter' || period === 'halfyear' || period === 'year') {
      return this.groupByMonth(salesData)
    }
    
    // Today - Group by Hour
    if (period === 'today') {
      return this.groupByHour(salesData)
    }
    
    // Week - Group by Day
    if (period === 'week') {
      return this.groupByDay(salesData)
    }
    
    // Custom - Adaptive
    if (period === 'custom') {
      const customDays = this.customDays || 30
      if (customDays <= 14) {
        return this.groupByDay(salesData)
      } else if (customDays <= 60) {
        return this.groupByWeek(salesData)
      } else {
        return this.groupByMonth(salesData)
      }
    }
    
    // Fallback
    if (grouping === 'hour') {
      return this.groupByHour(salesData)
    } else if (grouping === 'day') {
      return this.groupByDay(salesData)
    } else if (grouping === 'week') {
      return this.groupByWeek(salesData)
    } else if (grouping === 'month') {
      return this.groupByMonth(salesData)
    }
    
    return salesData
  },


  groupByHour(salesData) {
    const grouped = {}
    salesData.forEach(item => {
      const date = new Date(item.date)
      const hour = date.getUTCHours()
      const key = date.toISOString().split('T')[0] + 'T' + String(hour).padStart(2, '0') + ':00:00.000Z'
      if (!grouped[key]) {
        grouped[key] = { date: key, revenue: 0, items: 0 }
      }
      grouped[key].revenue += parseFloat(item.revenue) || 0
      grouped[key].items += parseInt(item.items) || 0
    })
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  },

  groupByDay(salesData) {
    const grouped = {}
    salesData.forEach(item => {
      const date = new Date(item.date)
      const key = date.toISOString().split('T')[0] + 'T00:00:00.000Z'
      if (!grouped[key]) {
        grouped[key] = { date: key, revenue: 0, items: 0 }
      }
      grouped[key].revenue += parseFloat(item.revenue) || 0
      grouped[key].items += parseInt(item.items) || 0
    })
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  },

  groupByWeek(salesData) {
    if (!salesData || salesData.length === 0) return []
    
    const grouped = {}
    
    salesData.forEach(item => {
      const date = new Date(item.date)
      
      // Get week start (Monday)
      const day = date.getUTCDay()
      const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1)
      const weekStart = new Date(date)
      weekStart.setUTCDate(diff)
      weekStart.setUTCHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
      weekEnd.setUTCHours(23, 59, 59, 999)
      
      const key = weekStart.toISOString().split('T')[0]
      
      // Format label
      const startDay = weekStart.getUTCDate()
      const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
      const endDay = weekEnd.getUTCDate()
      const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
      
      let label
      if (startMonth === endMonth) {
        label = `${startDay}-${endDay} ${startMonth}`
      } else {
        label = `${startDay} ${startMonth}-${endDay} ${endMonth}`
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          date: weekStart.toISOString(),
          label: label,
          displayLabel: label,
          revenue: 0,
          items: 0
        }
      }
      
      grouped[key].revenue += parseFloat(item.revenue) || 0
      grouped[key].items += parseInt(item.items) || 0
    })
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  },

  groupByMonth(salesData) {
    if (!salesData || salesData.length === 0) return []
    
    const grouped = {}
    
    salesData.forEach(item => {
      const date = new Date(item.date)
      const month = date.getUTCMonth()
      const year = date.getUTCFullYear()
      const key = `${year}-${month}`
      
      if (!grouped[key]) {
        const label = date.toLocaleDateString('en-MY', { 
          month: 'short', 
          year: 'numeric',
          timeZone: 'UTC'
        })
        grouped[key] = {
          date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
          label: label,
          displayLabel: label,
          revenue: 0,
          items: 0
        }
      }
      
      grouped[key].revenue += parseFloat(item.revenue) || 0
      grouped[key].items += parseInt(item.items) || 0
    })
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  },

      // ===== Label helpers for charts =====
formatHourLabel(dateStr) {
  if (!dateStr) return ''
  
  try {
    // Parse the date string directly (same as sales overview chart)
    const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    if (!dateParts) {
      // Fallback: try creating a date object
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
      const hour = date.getHours()
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hours12 = hour % 12 || 12
      return `${hours12}:00 ${ampm}`
    }
    
    const hour = parseInt(dateParts[4])
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hours12 = hour % 12 || 12
    
    return `${hours12}:00 ${ampm}`
  } catch {
    return ''
  }
},

      formatDayLabel(dateStr) {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-MY', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short',
          timeZone: 'UTC'
        })
      },

      formatWeekRangeLabel(dateStr) {
        const date = new Date(dateStr)
        const weekStart = this.getWeekStart(date)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        const startDay = weekStart.getUTCDate()
        const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
        const endDay = weekEnd.getUTCDate()
        const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
        
        if (startMonth === endMonth) {
          return `${startDay}-${endDay} ${startMonth}`
        } else {
          return `${startDay} ${startMonth}-${endDay} ${endMonth}`
        }
      },

      formatMonthLabel(dateStr) {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-MY', { 
          month: 'short', 
          year: 'numeric',
          timeZone: 'UTC'
        })
      },

      // =============================================
      // PERIOD & RANGE HELPERS
      // =============================================
      getPeriodDays() {
        switch(this.selectedPeriod) {
          case 'today': return 1
          case 'week': return 7
          case 'month': return 30
          case 'quarter': return 90
          case 'halfyear': return 180
          case 'year': return 365
          case 'custom': return this.customDays || 30
          default: return 7
        }
      },

      applyCustomRange() {
        if (!this.customDateStart || !this.customDateEnd) {
          this.$emit('show-notification', 'Please select both start and end dates', 'warning')
          return
        }
        const start = new Date(this.customDateStart)
        const end = new Date(this.customDateEnd)
        if (start > end) {
          this.$emit('show-notification', 'Start date must be before end date', 'error')
          return
        }
        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        this.customDays = diffDays + 1
        this.selectedPeriod = 'custom'
        this.periodDropdownOpen = false
        this.refreshAllDataForPeriod()
        this.$emit('show-notification', `Showing ${diffDays + 1} days of data`, 'success')
      },

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
        if (value === 'custom') {
          const end = new Date()
          const start = new Date()
          start.setDate(start.getDate() - 30)
          this.customDateStart = start.toISOString().split('T')[0]
          this.customDateEnd = end.toISOString().split('T')[0]
          return
        }
        this.refreshAllDataForPeriod()
      },

      handleClickOutside(event) {
        const container = this.$el
        if (container && !container.contains(event.target)) {
          this.dropdownOpen = false
          this.periodDropdownOpen = false
        }
      },

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
        if (tabId === 'revenue') {
          this.$nextTick(() => {
            setTimeout(() => this.loadRevenueData(), 200)
          })
        }
        if (tabId === 'transactions') {
          this.$nextTick(() => {
            setTimeout(() => this.loadTransactions(), 200)
          })
        }
        if (tabId === 'dashboard') {
          this.$nextTick(() => {
            setTimeout(() => this.initChart(), 100)
          })
        }
        if (['stalls', 'menu', 'revenue', 'transactions'].includes(tabId)) {
          this.$nextTick(() => {
            setTimeout(() => this.refreshAllDataForPeriod(), 300)
          })
        }
      },

      switchTabWithSubTab(tabId, subTabId) {
        this.activeTab = tabId
        if (tabId === 'stalls') {
          this.stallSubTab = subTabId || 'management'
        } else if (tabId === 'menu') {
          this.menuSubTab = subTabId || 'management'
        }
        this.dropdownOpen = false
      },

      // =============================================
      // DATA LOADING
      // =============================================
      async loadData() {
        try {
          console.log('🔄 Loading Super Admin data...')
          await this.loadCompanies()
          await this.loadStalls()
          this._stallCurrentPage = 1
          
          await Promise.all([
            this.loadUsers(),
            this.loadLowStock(),
            this.loadMenuItems(),
            this.loadRegistrations()
          ])
          
          await this.loadSalesAnalytics()
          await this.loadStallPerformance()
          await this.loadMenuPerformance()
          await this.loadAllStallsInventory()
          await this.loadShiftHistory()
          
          this.resetChartNavigation()
          this.$emit('show-notification', 'Data refreshed', 'success')
        } catch (err) {
          console.error('Load data error:', err)
          this.$emit('show-notification', err.message, 'error')
        }
      },

      async refreshAllData() {
        await this.loadData()
      },

      async refreshAllDataForPeriod() {
        try {
          console.log('🔄 Refreshing data for period:', this.selectedPeriod)
          this.stallPerformance = []
          this.menuPerformance = []
          this.salesTrend = []
          this.consolidatedSales.topStall = '-'
          this.consolidatedSales.topRevenue = 0
          this.consolidatedSales.totalRevenue = 0
          this.consolidatedSales.totalItems = 0
          this.revenueData = []
          this.transactions = []
          
          await this.loadSalesAnalytics()
          await this.loadStallPerformance()
          await this.loadMenuPerformance()
          await this.loadRevenueData()
          await this.loadTransactions()
          await this.loadShiftHistory()
          
          this.resetChartNavigation()
          this.$nextTick(() => {
            this.initChart()
            this.initRevenueChart()
            this.initRevenueStateChart()
          })
          this.$emit('show-notification', `Data updated for ${this.getPeriodLabel()}`, 'success')
        } catch (err) {
          console.error('Error refreshing data for period:', err)
          this.$emit('show-notification', 'Failed to update data for period', 'error')
        }
      },

      // =============================================
      // COMPANIES
      // =============================================
      async loadCompanies() {
        this.loadingCompanies = true
        try {
          const res = await axios.get(`${API_BASE}/companies`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.companies = res.data.map(company => ({
            ...company,
            user_count: company.user_count || 0,
            stall_count: company.stall_count || 0,
            contact_person: company.contact_person || '-',
            email: company.email || '-',
            phone: company.phone || '-',
            ic_number: company.ic_number || '-',
            payment_receipt: company.payment_receipt || null
          }))
          console.log('✅ Companies loaded:', this.companies.length)
        } catch (err) {
          console.error('Failed to load companies:', err)
          this.$emit('show-notification', 'Failed to load companies', 'error')
        } finally {
          this.loadingCompanies = false
        }
      },

      formatSubscriptionEnd(createdAt) {
        if (!createdAt) return 'N/A'
        const startDate = new Date(createdAt)
        const endDate = new Date(startDate)
        endDate.setFullYear(endDate.getFullYear() + 1)
        return endDate.toLocaleDateString('en-MY', {
          timeZone: 'Asia/Kuala_Lumpur',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      },

      // =============================================
      // STALLS
      // =============================================
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

      async saveStall() {
        try {
          if (this.editingStall) {
            await axios.put(`${API_BASE}/stalls/${this.stallForm.id}`, {
              name: this.stallForm.name,
              code: this.stallForm.code,
              location: this.stallForm.location
            }, { headers: { Authorization: `Bearer ${this.token}` } })
            this.$emit('show-notification', 'Stall updated', 'success')
          } else {
            await axios.post(`${API_BASE}/companies/1/stalls`, {
              name: this.stallForm.name,
              code: this.stallForm.code,
              location: this.stallForm.location
            }, { headers: { Authorization: `Bearer ${this.token}` } })
            this.$emit('show-notification', 'Stall created', 'success')
          }
          this.stallModal = false
          this.loadStalls()
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
          this.loadStalls()
          await this.loadAllStallsInventory()
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

      // =============================================
      // USERS
      // =============================================
      async loadUsers() {
        try {
          const res = await axios.get(`${API_BASE}/users/all`, { 
            headers: { Authorization: `Bearer ${this.token}` } 
          })
          this.users = res.data.filter(user => {
            if (user.role === 'super_admin' || user.role === 'super_super_admin') {
              return false
            }
            return true
          }).map(user => ({
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

      navigateToStall(stallId) {
        this.activeTab = 'stalls'
        this.stallSubTab = 'management'
        this.stallSearch = this.stalls.find(s => s.id === stallId)?.name || ''
        this.dropdownOpen = false
      },

      // =============================================
      // SALES ANALYTICS - FIXED (Copied from Stall Admin)
      // =============================================
      async loadSalesAnalytics() {
        try {
          const days = this.getPeriodDays()
          console.log(`📊 Loading sales analytics for days: ${days} period: ${this.selectedPeriod}`)
          
          const res = await axios.get(
            `${API_BASE}/sales-analytics?days=${days}`,
            { headers: { Authorization: `Bearer ${this.token}` } }
          )
          
          const data = res.data || {}
          let dailySales = (data.dailySales || []).map(day => ({
            ...day,
            items: parseInt(day.items) || 0,
            revenue: parseFloat(day.revenue) || 0
          }))
          
          // Group by period exactly like Stall Admin
          if (this.selectedPeriod === 'today') {
            dailySales = this.splitTodayIntoHours(dailySales)
          } else if (this.selectedPeriod === 'week') {
            const now = this.getTodayInMalaysia()
            const dayOfWeek = now.getDay()
            const daysToMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1)
            const monday = new Date(now)
            monday.setDate(now.getDate() - daysToMonday)
            monday.setHours(0, 0, 0, 0)
            const sunday = new Date(monday)
            sunday.setDate(monday.getDate() + 6)
            sunday.setHours(23, 59, 59, 999)
            
            dailySales = dailySales.filter(day => {
              const date = new Date(day.date)
              const timestamp = date.getTime()
              return timestamp >= monday.getTime() && timestamp <= sunday.getTime()
            })
          } else if (this.selectedPeriod === 'month') {
            dailySales = this.groupSalesByWeek(dailySales)
          } else if (this.selectedPeriod === 'quarter' || this.selectedPeriod === 'halfyear') {
            dailySales = this.groupSalesByMonth(dailySales)
          } else if (this.selectedPeriod === 'year') {
            dailySales = this.groupSalesByMonth(dailySales)
          } else if (this.selectedPeriod === 'custom') {
            dailySales = this.groupSalesCustom(dailySales)
          }
          
          this.salesTrend = dailySales
          
          const totalRevenue = dailySales.reduce((sum, d) => sum + (d.revenue || 0), 0)
          const totalItems = dailySales.reduce((sum, d) => sum + (d.items || 0), 0)
          
          this.consolidatedSales.totalItems = totalItems
          this.consolidatedSales.totalRevenue = totalRevenue
          this.consolidatedSales.averagePerStall = this.stalls.length > 0 ? 
            totalRevenue / this.stalls.length : 0
          
          if (data.topStall && data.topStall !== '-') {
            this.consolidatedSales.topStall = data.topStall
            this.consolidatedSales.topRevenue = parseFloat(data.topRevenue) || 0
          }
          
          this.productSales = data.productSales || {}
          await this.loadMenuPerformance()
          
          if (this.salesTrend.length > 0) {
            this.$nextTick(() => {
              this.initChart()
              this.updateChart()
            })
          }
          console.log('✅ Sales analytics loaded successfully')
        } catch (err) {
          console.error('❌ Failed to load sales analytics:', err)
          this.salesTrend = []
          this.consolidatedSales.totalItems = 0
          this.consolidatedSales.totalRevenue = 0
          this.consolidatedSales.topStall = '-'
          this.consolidatedSales.topRevenue = 0
          this.productSales = {}
        }
      },

      splitTodayIntoHours(dailySales) {
        if (!dailySales || dailySales.length === 0) return []
        if (dailySales.length > 1) return dailySales
        const dayData = dailySales[0]
        if (!dayData) return []
        const totalRevenue = dayData.revenue || 0
        const totalItems = dayData.items || 0
        if (totalRevenue > 0 || totalItems > 0) {
          return dailySales
        }
        return []
      },

      groupSalesByWeek(dailySales) {
        if (!dailySales || dailySales.length === 0) return []
        const grouped = {}
        dailySales.forEach(day => {
          const date = new Date(day.date)
          const weekStart = this.getWeekStart(date)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          const key = weekStart.toISOString().split('T')[0]
          if (!grouped[key]) {
            const startDay = weekStart.getUTCDate()
            const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
            const endDay = weekEnd.getUTCDate()
            const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
            let label
            if (startMonth === endMonth) {
              label = `${startDay}-${endDay} ${startMonth}`
            } else {
              label = `${startDay} ${startMonth}-${endDay} ${endMonth}`
            }
            grouped[key] = {
              date: weekStart.toISOString(),
              label: label,
              displayLabel: label,
              revenue: 0,
              items: 0
            }
          }
          grouped[key].revenue += day.revenue || 0
          grouped[key].items += day.items || 0
        })
        return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
      },

      groupSalesByMonth(dailySales) {
        if (!dailySales || dailySales.length === 0) return []
        const grouped = {}
        dailySales.forEach(day => {
          const date = new Date(day.date)
          const month = date.getMonth()
          const year = date.getFullYear()
          const key = `${year}-${month}`
          if (!grouped[key]) {
            const label = date.toLocaleDateString('en-MY', { 
              month: 'short', 
              year: 'numeric',
              timeZone: 'UTC'
            })
            grouped[key] = {
              date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
              label: label,
              revenue: 0,
              items: 0,
              month: month,
              year: year
            }
          }
          grouped[key].revenue += day.revenue || 0
          grouped[key].items += day.items || 0
        })
        return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
      },

      groupSalesCustom(dailySales) {
        if (!dailySales || dailySales.length === 0) return []
        const days = dailySales.length
        if (days <= 14) {
          return dailySales.map(day => ({
            ...day,
            label: new Date(day.date).toLocaleDateString('en-MY', { 
              month: 'short', 
              day: 'numeric',
              timeZone: 'UTC'
            })
          }))
        }
        if (days <= 60) {
          return this.groupSalesByWeek(dailySales)
        }
        return this.groupSalesByMonth(dailySales)
      },

      // =============================================
      // STALL PERFORMANCE
      // =============================================
    // In your loadStallPerformance method, ensure proper sorting
  async loadStallPerformance() {
    const stallIds = this.stalls.map(s => s.id)
    if (!stallIds || stallIds.length === 0) {
      this.stallPerformance = []
      return
    }
    
    try {
      const days = this.getPeriodDays()
      const res = await axios.get(
        `${API_BASE}/stall-performance?days=${days}&stallIds=${stallIds.join(',')}`,
        { headers: { Authorization: `Bearer ${this.token}` } }
      )
      
      // ===== MERGE AND SORT BY REVENUE (HIGHEST FIRST) =====
      this.stallPerformance = this.mergeStallData(res.data || [])
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      
      console.log('✅ Stall performance loaded:', this.stallPerformance.length)
      console.log('🏆 Rankings:')
      this.stallPerformance.forEach((stall, index) => {
        console.log(`  #${index + 1}: ${stall.name} - RM ${stall.revenue || 0}`)
      })
      
    } catch (err) {
      console.error('Failed to load stall performance:', err)
      this.stallPerformance = []
    }
  },

      mergeStallData(performanceData) {
    return this.stalls.map(stall => {
      const perf = performanceData.find(p => p.id === stall.id || p.stall_id === stall.id)
      if (perf) {
        return {
          ...stall,
          revenue: parseFloat(perf.revenue) || 0,
          items: parseInt(perf.items_sold) || 0,
          avgTransaction: parseFloat(perf.avg_transaction) || 0
        }
      } else {
        // ===== STALL WITH NO SALES =====
        return {
          ...stall,
          revenue: 0,
          items: 0,
          avgTransaction: 0
        }
      }
    })
  },

      // =============================================
      // MENU PERFORMANCE
      // =============================================
      async loadMenuPerformance() {
        try {
          const productSales = this.productSales || {}
          const hasPeriodSales = this.salesTrend && this.salesTrend.length > 0
          const periodRevenue = hasPeriodSales ? this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0) : 0
          const periodItems = hasPeriodSales ? this.salesTrend.reduce((sum, d) => sum + (d.items || 0), 0) : 0
          
          if (!hasPeriodSales || (periodRevenue === 0 && periodItems === 0)) {
            this.menuPerformance = []
            return
          }
          
          let filteredItems = Object.keys(productSales)
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
          
          if (['today', 'week'].includes(this.selectedPeriod)) {
            const periodItemsList = filteredItems.filter(item => item.revenue > 0 && item.quantity > 0)
            this.menuPerformance = periodItemsList
            return
          }
          
          if (filteredItems.length > 0) {
            this.menuPerformance = filteredItems
            return
          }
          
          const days = this.getPeriodDays()
          const res = await axios.get(
            `${API_BASE}/menu-performance?days=${days}`,
            { headers: { Authorization: `Bearer ${this.token}` } }
          )
          
          let menuData = (res.data || [])
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
          
          this.menuPerformance = menuData
        } catch (err) {
          console.error('Failed to load menu performance:', err)
          this.menuPerformance = []
        }
      },

      // =============================================
      // MENU ITEMS
      // =============================================
      async loadMenuItems() {
        try {
          const res = await axios.get(`${API_BASE}/menu`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.menuItems = res.data || []
          console.log('✅ Menu items loaded:', this.menuItems.length)
        } catch (err) {
          console.error('Failed to load menu items:', err)
          this.menuItems = []
        }
      },

      // =============================================
      // MENU MANAGEMENT - CRUD (Restored from Original Super Admin)
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
        this.menuForm.recipe.push({ 
          material_name: 'Chicken', 
          quantity_used: 1 
        })
      },

      removeRecipeIngredient(index) {
        this.menuForm.recipe.splice(index, 1)
      },

      compressImage(base64Data, maxWidth = 200, maxHeight = 200, quality = 0.6) {
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
            console.warn('Compression failed, using original:', err)
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
            recipe: this.menuForm.recipe
              .filter(r => r.material_name && r.quantity_used > 0)
              .map(r => ({
                material_name: r.material_name || 'Chicken',
                quantity_used: parseInt(r.quantity_used) || 1
              }))
          }
          
          if (this.menuForm.imagePreview) {
            let imageData = this.menuForm.imagePreview
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
            if (imageData && imageData.length < 1 * 1024 * 1024) {
              payload.image = imageData
            }
          }
          
          if (this.editingMenu) {
            await axios.put(`${API_BASE}/menu/${encodeURIComponent(this.menuForm.item_name)}`, payload, {
              headers: { Authorization: `Bearer ${this.token}` }
            })
            this.$emit('show-notification', 'Menu item updated successfully!', 'success')
          } else {
            await axios.post(`${API_BASE}/menu`, payload, {
              headers: { Authorization: `Bearer ${this.token}` }
            })
            this.$emit('show-notification', 'Menu item created successfully!', 'success')
          }
          
          this.closeMenuModal()
          await this.loadMenuItems()
        } catch (err) {
          console.error('Save menu error:', err)
          const errorMsg = err.response?.data?.error || err.message || 'Operation failed'
          this.$emit('show-notification', `Failed to save: ${errorMsg}`, 'error')
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

      // =============================================
      // MENU ASSIGNMENT
      // =============================================
      async loadMenuAssignments() {
        if (!this.selectedAssignmentStall) return
        this.loadingMenuAssignments = true
        this.savedAssignmentMessage = ''
        try {
          await this.loadMenuItems()
          const res = await axios.get(`${API_BASE}/menu/assignments/${this.selectedAssignmentStall}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          const assignedItems = res.data || []
          this.menuAssignments = {}
          this.menuItems.forEach(item => {
            this.menuAssignments[item.item_name] = assignedItems.includes(item.item_name)
          })
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
          const selectedItems = Object.keys(this.menuAssignments).filter(key => this.menuAssignments[key] === true)
          await axios.post(`${API_BASE}/menu/assignments`, {
            stallId: this.selectedAssignmentStall,
            items: selectedItems
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
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
          setTimeout(() => { this.savedAssignmentMessage = '' }, 3000)
        }
      },

      resetMenuPagination() {
        this.menuCurrentPage = 1
      },

      prevMenuPage() {
        if (this.menuCurrentPage > 1) this.menuCurrentPage--
      },

      nextMenuPage() {
        if (this.menuCurrentPage < this.menuTotalPages) this.menuCurrentPage++
      },

      toggleSelectAllMenuItems() {
        this.selectAllMenuItems = !this.selectAllMenuItems
        if (this.selectAllMenuItems) {
          this.selectedMenuItems = this.paginatedMenuItems.map(item => item.item_name)
        } else {
          this.selectedMenuItems = []
        }
      },

      clearMenuFilters() {
        this.menuSearch = ''
        this.menuCategoryFilter = 'all'
        this.menuCurrentPage = 1
        this.selectedMenuItems = []
        this.selectAllMenuItems = false
      },

      async bulkAssignMenusToStalls() {
        if (this.selectedMenuItems.length === 0) {
          this.$emit('show-notification', 'No menu items selected', 'warning')
          return
        }
        if (!this.selectedAssignmentStall) {
          this.$emit('show-notification', 'Please select a stall first', 'warning')
          return
        }
        if (!confirm(`Assign ${this.selectedMenuItems.length} selected menu item(s) to ${this.stalls.find(s => s.id === this.selectedAssignmentStall)?.name}?`)) {
          return
        }
        this.savingAssignment = true
        try {
          const res = await axios.get(`${API_BASE}/menu/assignments/${this.selectedAssignmentStall}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          const currentAssignments = res.data || []
          const allAssignments = [...new Set([...currentAssignments, ...this.selectedMenuItems])]
          await axios.post(`${API_BASE}/menu/assignments`, {
            stallId: this.selectedAssignmentStall,
            items: allAssignments
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.selectedMenuItems.forEach(itemName => {
            this.menuAssignments[itemName] = true
          })
          this.originalMenuAssignments = { ...this.menuAssignments }
          this.selectedMenuItems = []
          this.selectAllMenuItems = false
          this.$emit('show-notification', `✅ ${allAssignments.length} menu items assigned to stall`, 'success')
        } catch (err) {
          console.error('Bulk assign error:', err)
          this.$emit('show-notification', 'Failed to assign menu items', 'error')
        } finally {
          this.savingAssignment = false
        }
      },

      // =============================================
      // MENU ASSIGNMENT - STALL VIEW
      // =============================================
      toggleStallMenuExpand(stallId) {
        if (this.expandedStallMenus.includes(stallId)) {
          this.expandedStallMenus = this.expandedStallMenus.filter(id => id !== stallId)
        } else {
          this.expandedStallMenus.push(stallId)
        }
      },

      async loadAllStallMenuAssignments() {
        this.loadingStallMenus = true
        try {
          const stallMenus = []
          for (const stall of this.stalls) {
            try {
              const res = await axios.get(`${API_BASE}/menu/assignments/${stall.id}`, {
                headers: { Authorization: `Bearer ${this.token}` }
              })
              stallMenus.push({
                id: stall.id,
                name: stall.name,
                code: stall.code,
                is_active: stall.is_active,
                menus: res.data || []
              })
            } catch (err) {
              console.error(`Failed to load menus for stall ${stall.id}:`, err)
              stallMenus.push({
                id: stall.id,
                name: stall.name,
                code: stall.code,
                is_active: stall.is_active,
                menus: []
              })
            }
          }
          this.stallMenuAssignments = stallMenus
          if (stallMenus.length > 0 && this.expandedStallMenus.length === 0) {
            this.expandedStallMenus.push(stallMenus[0].id)
          }
        } catch (err) {
          console.error('Failed to load stall menu assignments:', err)
          this.$emit('show-notification', 'Failed to load stall menu assignments', 'error')
        } finally {
          this.loadingStallMenus = false
        }
      },

      // =============================================
      // MENU ASSIGNMENT - BULK MODE
      // =============================================
      toggleAllStallsForAssign() {
        this.selectAllStallsForAssign = !this.selectAllStallsForAssign
        if (this.selectAllStallsForAssign) {
          this.selectedStallsForAssign = this.stalls.map(s => s.id)
        } else {
          this.selectedStallsForAssign = []
        }
      },

      toggleAllMenusForBulk() {
        this.selectAllMenusForBulk = !this.selectAllMenusForBulk
        if (this.selectAllMenusForBulk) {
          this.selectedMenuItemsForBulk = this.filteredBulkMenuItems.map(item => item.item_name)
        } else {
          this.selectedMenuItemsForBulk = []
        }
      },

      async executeBulkAssignToStalls() {
        if (this.selectedStallsForAssign.length === 0) {
          this.bulkAssignMessage = 'Please select at least one stall'
          this.bulkAssignMessageType = 'error'
          this.$emit('show-notification', 'Please select at least one stall', 'warning')
          return
        }
        if (this.selectedMenuItemsForBulk.length === 0) {
          this.bulkAssignMessage = 'Please select at least one menu item'
          this.bulkAssignMessageType = 'error'
          this.$emit('show-notification', 'Please select at least one menu item', 'warning')
          return
        }
        const total = this.selectedStallsForAssign.length * this.selectedMenuItemsForBulk.length
        if (!confirm(`Assign ${this.selectedMenuItemsForBulk.length} menu(s) to ${this.selectedStallsForAssign.length} stall(s)? (${total} total assignments)`)) {
          return
        }
        this.bulkAssignToStallsLoading = true
        this.bulkAssignMessage = ''
        let successCount = 0
        let errorCount = 0
        try {
          for (const stallId of this.selectedStallsForAssign) {
            try {
              const res = await axios.get(`${API_BASE}/menu/assignments/${stallId}`, {
                headers: { Authorization: `Bearer ${this.token}` }
              })
              const currentAssignments = res.data || []
              const allAssignments = [...new Set([...currentAssignments, ...this.selectedMenuItemsForBulk])]
              await axios.post(`${API_BASE}/menu/assignments`, {
                stallId: stallId,
                items: allAssignments
              }, {
                headers: { Authorization: `Bearer ${this.token}` }
              })
              successCount++
            } catch (err) {
              console.error(`Failed to assign to stall ${stallId}:`, err)
              errorCount++
            }
          }
          if (this.selectedAssignmentStall) {
            this.selectedMenuItemsForBulk.forEach(itemName => {
              this.menuAssignments[itemName] = true
            })
            this.originalMenuAssignments = { ...this.menuAssignments }
          }
          if (errorCount === 0) {
            this.bulkAssignMessage = `✅ Successfully assigned ${this.selectedMenuItemsForBulk.length} menu(s) to ${successCount} stall(s)`
            this.bulkAssignMessageType = 'success'
            this.$emit('show-notification', `✅ Assigned to ${successCount} stall(s) successfully`, 'success')
          } else {
            this.bulkAssignMessage = `⚠️ Assigned to ${successCount} stall(s), ${errorCount} failed`
            this.bulkAssignMessageType = 'warning'
            this.$emit('show-notification', `⚠️ ${successCount} succeeded, ${errorCount} failed`, 'warning')
          }
          this.selectedStallsForAssign = []
          this.selectedMenuItemsForBulk = []
          this.selectAllStallsForAssign = false
          this.selectAllMenusForBulk = false
          this.bulkMenuSearch = ''
          if (this.selectedAssignmentStall) {
            await this.loadMenuAssignments()
          }
        } catch (err) {
          console.error('Bulk assign error:', err)
          this.bulkAssignMessage = '❌ Failed to complete bulk assignment'
          this.bulkAssignMessageType = 'error'
          this.$emit('show-notification', 'Failed to complete bulk assignment', 'error')
        } finally {
          this.bulkAssignToStallsLoading = false
        }
      },

      // =============================================
      // LOW STOCK
      // =============================================
      async loadLowStock() {
        try {
          const res = await axios.get(`${API_BASE}/companies/1/low-stock`, { 
            headers: { Authorization: `Bearer ${this.token}` } 
          })
          this.lowStock = res.data
        } catch (err) {
          console.error('Failed to load low stock:', err)
          this.lowStock = []
        }
      },

      // =============================================
      // INVENTORY - FIXED
      // =============================================
      async loadAllStallsInventory() {
    this.inventory = []
    
    for (const stall of this.stalls) {
      try {
        const res = await axios.get(`${API_BASE}/inventory?stallId=${stall.id}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        
        if (res.data && res.data.length > 0) {
          const items = res.data.map(item => ({
            ...item,
            stall_id: stall.id,
            current_level: Math.round(Number(item.current_level) || 0),
            alert_level: Math.round(Number(item.alert_level) || 0)
          }))
          this.inventory = [...this.inventory, ...items]
        }
        
        this.stallInventory[stall.id] = res.data.map(item => ({
          ...item,
          newLevel: Math.round(Number(item.current_level) || 0)
        }))
        
      } catch (err) {
        console.error(`Load inventory for stall ${stall.id} error:`, err)
        this.stallInventory[stall.id] = []
      }
    }
    
    console.log('✅ Inventory loaded:', this.inventory.length, 'items')
  },

      getStallInventory(stallId) {
        if (this.inventory && Array.isArray(this.inventory) && this.inventory.length > 0) {
          const items = this.inventory.filter(item => item.stall_id === stallId)
          if (items.length > 0) {
            return items.map(item => ({
              ...item,
              current_level: Math.round(Number(item.current_level) || 0),
              alert_level: Math.round(Number(item.alert_level) || 0)
            }))
          }
        }
        if (this.stallInventory && this.stallInventory[stallId]) {
          return this.stallInventory[stallId].map(item => ({
            ...item,
            current_level: Math.round(Number(item.current_level) || 0),
            alert_level: Math.round(Number(item.alert_level) || 0)
          }))
        }
        return []
      },

      getStallInventorySummary(stallId) {
        if (this.inventory && Array.isArray(this.inventory) && this.inventory.length > 0) {
          const items = this.inventory.filter(item => item.stall_id === stallId)
          if (items.length > 0) {
            const grouped = {}
            items.forEach(item => {
              if (!grouped[item.material_name]) {
                grouped[item.material_name] = {
                  material_name: item.material_name,
                  current_level: 0,
                  alert_level: item.alert_level || 5,
                  stall_id: stallId
                }
              }
              grouped[item.material_name].current_level += Number(item.current_level) || 0
            })
            return Object.values(grouped).map(item => ({
              ...item,
              current_level: Math.round(Number(item.current_level) || 0),
              alert_level: Math.round(Number(item.alert_level) || 0)
            }))
          }
        }
        if (this.stallInventory && this.stallInventory[stallId]) {
          const items = this.stallInventory[stallId]
          const grouped = {}
          items.forEach(item => {
            if (!grouped[item.material_name]) {
              grouped[item.material_name] = {
                material_name: item.material_name,
                current_level: 0,
                alert_level: item.alert_level || 5,
                stall_id: stallId
              }
            }
            grouped[item.material_name].current_level += Number(item.current_level) || 0
          })
          return Object.values(grouped).map(item => ({
            ...item,
            current_level: Math.round(Number(item.current_level) || 0),
            alert_level: Math.round(Number(item.alert_level) || 0)
          }))
        }
        return []
      },

      hasLowStock(stallId) {
        return this.getStallInventory(stallId).some(item => item.current_level <= item.alert_level)
      },

      async updateInventoryStock(stallId, materialName, newLevel) {
    if (newLevel === undefined || newLevel === null || newLevel === '') {
      this.$emit('show-notification', 'Please enter a valid value', 'error')
      return
    }
    
    const roundedLevel = Math.round(Number(newLevel) || 0)
    
    try {
      await axios.post(`${API_BASE}/inventory/update`, {
        stallId, 
        materialName, 
        newLevel: roundedLevel
      }, {
        headers: { Authorization: `Bearer ${this.token}` }  // ← Use this.token, not authStore
      })
      
      await this.loadAllStallsInventory()
      await this.loadLowStock()
      
      this.$emit('show-notification', `${materialName} updated to ${roundedLevel} pieces`, 'success')
    } catch (err) {
      console.error('Update inventory error:', err)
      this.$emit('show-notification', 'Failed to update stock: ' + (err.response?.data?.error || err.message), 'error')
    }
  },

      // =============================================
      // INVENTORY - BULK UPDATE (FIXED)
      // =============================================
  openStallInventoryModal(stallId) {
    const stall = this.stalls.find(s => s.id === stallId)
    if (!stall) return
    
    this.quickUpdateStallId = stallId
    this.quickUpdateStallName = stall.name
    this.quickUpdateItems = this.getStallInventory(stallId).map(item => ({
      ...item,
      newLevel: item.current_level
    }))
    this.quickUpdateModal = true
  },

      async quickUpdateItemSave(stallId, materialName, newLevel) {
    if (newLevel === undefined || newLevel === null || newLevel === '') {
      this.$emit('show-notification', 'Please enter a valid value', 'error')
      return
    }
    
    const roundedLevel = Math.round(Number(newLevel) || 0)
    await this.updateInventoryStock(stallId, materialName, roundedLevel)
    
    const item = this.quickUpdateItems.find(i => i.material_name === materialName)
    if (item) {
      item.current_level = roundedLevel
      item.newLevel = roundedLevel
    }
    
    this.$emit('show-notification', `${materialName} updated to ${roundedLevel} pieces`, 'success')
  },

      async quickUpdateItemAdd(stallId, materialName, amount) {
    const item = this.quickUpdateItems.find(i => i.material_name === materialName)
    if (item) {
      const newLevel = item.current_level + amount
      await this.quickUpdateItemSave(stallId, materialName, newLevel)
    }
  },

      async quickUpdateSaveAll() {
    for (const item of this.quickUpdateItems) {
      if (item.newLevel !== undefined && item.newLevel !== item.current_level) {
        await this.updateInventoryStock(this.quickUpdateStallId, item.material_name, item.newLevel)
      }
    }
    this.$emit('show-notification', 'All items updated successfully!', 'success')
    this.quickUpdateModal = false
    await this.loadAllStallsInventory()
  },

  openBulkUpdateModal() {
    const materialSet = new Set()
    const stalls = this.bulkUpdateMode === 'all' 
      ? this.filteredInventoryStalls 
      : this.filteredInventoryStalls.filter(s => this.selectedStalls.includes(s.id))
    
    stalls.forEach(stall => {
      const inventory = this.getStallInventory(stall.id)
      inventory.forEach(item => {
        materialSet.add(item.material_name)
      })
    })

    // If no materials found, add default Chicken
    if (materialSet.size === 0) {
      materialSet.add('Chicken')
    }

    this.bulkUpdateMaterials = Array.from(materialSet).map(name => ({
      name: name,
      selected: true,
      operation: 'set',
      value: 10
    }))

    this.bulkUpdateModal = true
  },

      applyQuickAction(action) {
    this.bulkUpdateMaterials.forEach(material => {
      let value = 0
      switch (action.value) {
        case 'alert':
          const firstStall = this.filteredInventoryStalls.find(s => this.selectedStalls.includes(s.id))
          if (firstStall) {
            const item = this.getStallInventory(firstStall.id).find(i => i.material_name === material.name)
            value = item ? item.alert_level : 10
          }
          break
        case '100':
          value = 100
          break
        case '50':
          value = 50
          break
        case 'add10':
          material.operation = 'add'
          value = 10
          break
        case 'add20':
          material.operation = 'add'
          value = 20
          break
        case '0':
          value = 0
          break
        default:
          value = parseInt(action.value) || 10
      }
      material.value = value
      material.operation = action.value === 'add10' || action.value === 'add20' ? 'add' : 'set'
    })
  },

      // ===== FIXED: Bulk Update with proper error handling =====
  async executeBulkUpdate() {
    this.bulkUpdating = true
    
    const stalls = this.bulkUpdateMode === 'all' 
      ? this.filteredInventoryStalls 
      : this.bulkUpdateMode === 'low-stock'
        ? this.filteredInventoryStalls.filter(s => this.hasLowStock(s.id))
        : this.filteredInventoryStalls.filter(s => this.selectedStalls.includes(s.id))

    const selectedMaterials = this.bulkUpdateMaterials.filter(m => m.selected)
    
    if (stalls.length === 0) {
      this.$emit('show-notification', 'No stalls selected for update', 'warning')
      this.bulkUpdating = false
      return
    }
    
    if (selectedMaterials.length === 0) {
      this.$emit('show-notification', 'No materials selected for update', 'warning')
      this.bulkUpdating = false
      return
    }
    
    try {
      let totalUpdated = 0
      let totalErrors = 0
      
      for (const stall of stalls) {
        for (const material of selectedMaterials) {
          let newLevel = material.value
          const inventory = this.getStallInventory(stall.id)
          const item = inventory.find(i => i.material_name === material.name)
          
          if (item) {
            if (material.operation === 'add') {
              newLevel = item.current_level + material.value
            } else if (material.operation === 'subtract') {
              newLevel = Math.max(0, item.current_level - material.value)
            }
          }
          
          try {
            await this.updateInventoryStock(stall.id, material.name, newLevel)
            totalUpdated++
          } catch (err) {
            console.error(`Failed to update ${material.name} for stall ${stall.name}:`, err)
            totalErrors++
          }
        }
      }
      
      if (totalErrors === 0) {
        this.$emit('show-notification', `✅ Successfully updated ${totalUpdated} inventory items across ${stalls.length} stalls`, 'success')
      } else {
        this.$emit('show-notification', `⚠️ ${totalUpdated} updated, ${totalErrors} failed`, 'warning')
      }
      
      this.bulkUpdateModal = false
      await this.loadAllStallsInventory()
    } catch (err) {
      console.error('Bulk update error:', err)
      this.$emit('show-notification', 'Bulk update failed: ' + err.message, 'error')
    } finally {
      this.bulkUpdating = false
    }
  },

      // ===== FIXED: Reset Low Stock with proper handling =====
  async resetAllLowStock() {
    // Find all low stock items
    let lowStockItems = []
    for (const stall of this.stalls) {
      const inventory = this.getStallInventorySummary(stall.id)
      for (const item of inventory) {
        if (item.current_level <= item.alert_level) {
          lowStockItems.push({ stall, item })
        }
      }
    }
    
    if (lowStockItems.length === 0) {
      this.$emit('show-notification', 'No low stock items to reset', 'info')
      return
    }
    
    const alertLevel = lowStockItems[0]?.item.alert_level || 10
    if (!confirm(`Reset ${lowStockItems.length} low stock items to ${alertLevel + 20} pieces each?`)) {
      return
    }
    
    this.loading = true
    let updated = 0
    let errors = 0
    
    try {
      for (const { stall, item } of lowStockItems) {
        try {
          const newLevel = (item.alert_level || 10) + 20
          await this.updateInventoryStock(stall.id, item.material_name, newLevel)
          updated++
        } catch (err) {
          console.error(`Failed to reset ${item.material_name} for stall ${stall.name}:`, err)
          errors++
        }
      }
      
      if (errors === 0) {
        this.$emit('show-notification', `✅ Reset ${updated} low stock items successfully`, 'success')
      } else {
        this.$emit('show-notification', `⚠️ ${updated} reset, ${errors} failed`, 'warning')
      }
      
      await this.loadAllStallsInventory()
    } catch (error) {
      console.error('Error resetting low stock:', error)
      this.$emit('show-notification', 'Error resetting low stock items', 'error')
    } finally {
      this.loading = false
    }
  },

      toggleSelectAll() {
        this.selectAll = !this.selectAll
        if (this.selectAll) {
          this.selectedStalls = this.filteredInventoryStalls.map(s => s.id)
        } else {
          this.selectedStalls = []
        }
      },

      clearFilters() {
        this.inventorySearch = ''
        this.stateFilter = 'All States'
        this.inventoryFilter = 'all'
      },

      resetPagination() {
        this.currentPage = 1
      },

      prevPage() {
        if (this.currentPage > 1) this.currentPage--
      },

      nextPage() {
        if (this.currentPage < this.totalPages) this.currentPage++
      },

      // =============================================
      // STALL MANAGEMENT - PAGINATION
      // =============================================
      stallCurrentPage: {
        get() { return this._stallCurrentPage || 1 },
        set(val) { this._stallCurrentPage = val }
      },

      resetStallPagination() {
        this.stallCurrentPage = 1
      },

      prevStallPage() {
        if (this.stallCurrentPage > 1) this.stallCurrentPage--
      },

      nextStallPage() {
        if (this.stallCurrentPage < this.stallTotalPages) this.stallCurrentPage++
      },

      toggleSelectAllStalls() {
        this.selectAllStalls = !this.selectAllStalls
        if (this.selectAllStalls) {
          this.selectedStalls = this.paginatedStallsList.map(s => s.id)
        } else {
          this.selectedStalls = []
        }
      },

      clearStallFilters() {
        this.stallSearch = ''
        this.stateFilter = 'All States'
        this.stallStatusFilter = 'all'
        this.selectedStalls = []
        this.selectAllStalls = false
        this.stallCurrentPage = 1
      },

      async bulkActivateStalls() {
        if (this.selectedStalls.length === 0) {
          this.$emit('show-notification', 'No stalls selected', 'warning')
          return
        }
        if (!confirm(`Activate ${this.selectedStalls.length} selected stall(s)?`)) return
        this.loading = true
        let activated = 0
        try {
          for (const stallId of this.selectedStalls) {
            const stall = this.stalls.find(s => s.id === stallId)
            if (stall && !stall.is_active) {
              await axios.put(`${API_BASE}/stalls/${stall.id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${this.token}` }
              })
              activated++
            }
          }
          this.$emit('show-notification', `✅ Activated ${activated} stall(s)`, 'success')
          this.selectedStalls = []
          this.selectAllStalls = false
          await this.loadStalls()
          await this.loadAllStallsInventory()
        } catch (error) {
          console.error('Bulk activate error:', error)
          this.$emit('show-notification', 'Error activating stalls', 'error')
        } finally {
          this.loading = false
        }
      },

      async bulkDeactivateStalls() {
        if (this.selectedStalls.length === 0) {
          this.$emit('show-notification', 'No stalls selected', 'warning')
          return
        }
        if (!confirm(`Deactivate ${this.selectedStalls.length} selected stall(s)?`)) return
        this.loading = true
        let deactivated = 0
        try {
          for (const stallId of this.selectedStalls) {
            const stall = this.stalls.find(s => s.id === stallId)
            if (stall && stall.is_active) {
              await axios.put(`${API_BASE}/stalls/${stall.id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${this.token}` }
              })
              deactivated++
            }
          }
          this.$emit('show-notification', `✅ Deactivated ${deactivated} stall(s)`, 'success')
          this.selectedStalls = []
          this.selectAllStalls = false
          await this.loadStalls()
          await this.loadAllStallsInventory()
        } catch (error) {
          console.error('Bulk deactivate error:', error)
          this.$emit('show-notification', 'Error deactivating stalls', 'error')
        } finally {
          this.loading = false
        }
      },

      // =============================================
      // USER MANAGEMENT - PAGINATION & BULK
      // =============================================
      resetUserPagination() {
        this.userCurrentPage = 1
      },

      prevUserPage() {
        if (this.userCurrentPage > 1) this.userCurrentPage--
      },

      nextUserPage() {
        if (this.userCurrentPage < this.userTotalPages) this.userCurrentPage++
      },

      toggleSelectAllUsers() {
        this.selectAllUsers = !this.selectAllUsers
        if (this.selectAllUsers) {
          this.selectedUsers = this.paginatedUsersList.map(u => u.id)
        } else {
          this.selectedUsers = []
        }
      },

      clearUserFilters() {
        this.userSearch = ''
        this.userStateFilter = 'All States'
        this.userRoleFilter = 'all'
        this.selectedUsers = []
        this.selectAllUsers = false
        this.userCurrentPage = 1
      },

      async bulkRoleChange(role) {
        if (this.selectedUsers.length === 0) {
          this.$emit('show-notification', 'No users selected', 'warning')
          return
        }
        const roleLabel = role === 'stall_admin' ? 'Admin' : 'Cashier'
        if (!confirm(`Change ${this.selectedUsers.length} user(s) role to ${roleLabel}?`)) return
        this.loading = true
        let updated = 0
        try {
          for (const userId of this.selectedUsers) {
            const user = this.users.find(u => u.id === userId)
            if (user && user.role !== role) {
              await axios.put(`${API_BASE}/users/${userId}`, {
                ...user,
                role: role
              }, {
                headers: { Authorization: `Bearer ${this.token}` }
              })
              updated++
            }
          }
          this.$emit('show-notification', `✅ Updated ${updated} user(s) to ${roleLabel}`, 'success')
          this.selectedUsers = []
          this.selectAllUsers = false
          await this.loadUsers()
        } catch (error) {
          console.error('Bulk role change error:', error)
          this.$emit('show-notification', 'Error updating user roles', 'error')
        } finally {
          this.loading = false
        }
      },

      async bulkDeleteUsers() {
        if (this.selectedUsers.length === 0) {
          this.$emit('show-notification', 'No users selected', 'warning')
          return
        }
        if (!confirm(`Delete ${this.selectedUsers.length} selected user(s)? This action cannot be undone.`)) return
        this.loading = true
        let deleted = 0
        try {
          for (const userId of this.selectedUsers) {
            if (userId === this.currentUserId) continue
            await axios.delete(`${API_BASE}/users/${userId}`, {
              headers: { Authorization: `Bearer ${this.token}` }
            })
            deleted++
          }
          this.$emit('show-notification', `✅ Deleted ${deleted} user(s)`, 'success')
          this.selectedUsers = []
          this.selectAllUsers = false
          await this.loadUsers()
        } catch (error) {
          console.error('Bulk delete error:', error)
          this.$emit('show-notification', 'Error deleting users', 'error')
        } finally {
          this.loading = false
        }
      },

      // =============================================
      // MENU PERFORMANCE - PAGINATION & SORTING
      // =============================================
      resetMenuPerformancePagination() {
        this.menuPerformancePage = 1
      },

      prevMenuPerformancePage() {
        if (this.menuPerformancePage > 1) this.menuPerformancePage--
      },

      nextMenuPerformancePage() {
        if (this.menuPerformancePage < this.menuPerformanceTotalPages) this.menuPerformancePage++
      },

      clearMenuPerformanceFilters() {
        this.menuPerformanceCategoryFilter = 'all'
        this.menuPerformanceStateFilter = 'All States'
        this.menuPerformancePage = 1
        this.menuPerformanceSortBy = 'rank'
        this.menuPerformanceSortOrder = 'desc'
      },

      sortMenuPerformanceList(list) {
        const sorted = [...list]
        const sortBy = this.menuPerformanceSortBy
        const order = this.menuPerformanceSortOrder
        sorted.sort((a, b) => {
          let valA, valB
          if (sortBy === 'rank') {
            valA = a.revenue || 0
            valB = b.revenue || 0
          } else if (sortBy === 'name') {
            valA = a.name.toLowerCase()
            valB = b.name.toLowerCase()
            return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
          } else if (sortBy === 'revenue') {
            valA = a.revenue || 0
            valB = b.revenue || 0
          } else if (sortBy === 'status') {
            const statusOrder = { 'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'no-sales': 1 }
            valA = statusOrder[this.getMenuStatusClass(a.quantity)] || 0
            valB = statusOrder[this.getMenuStatusClass(b.quantity)] || 0
          }
          if (order === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0
          } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0
          }
        })
        return sorted
      },

      sortMenuPerformance(column) {
        if (this.menuPerformanceSortBy === column) {
          this.menuPerformanceSortOrder = this.menuPerformanceSortOrder === 'asc' ? 'desc' : 'asc'
        } else {
          this.menuPerformanceSortBy = column
          this.menuPerformanceSortOrder = column === 'rank' || column === 'revenue' ? 'desc' : 'asc'
        }
        this.menuPerformancePage = 1
      },

      getMenuSortArrow(column) {
        if (this.menuPerformanceSortBy !== column) return '⇅'
        return this.menuPerformanceSortOrder === 'asc' ? '↑' : '↓'
      },

      // =============================================
      // PERFORMANCE - PAGINATION & SORTING
      // =============================================
      resetPerformancePagination() {
        this.performancePage = 1
      },

      prevPerformancePage() {
        if (this.performancePage > 1) this.performancePage--
      },

      nextPerformancePage() {
        if (this.performancePage < this.performanceTotalPages) this.performancePage++
      },

      clearPerformanceFilters() {
        this.performanceSearch = ''
        this.performanceStateFilter = 'All States'
        this.performanceStatusFilter = 'all'
        this.performancePage = 1
        this.performanceSortBy = 'rank'
        this.performanceSortOrder = 'asc'
      },

      sortPerformanceList(list) {
        const sorted = [...list]
        const sortBy = this.performanceSortBy
        const order = this.performanceSortOrder
        sorted.sort((a, b) => {
          let valA, valB
          if (sortBy === 'rank') {
            valA = a.revenue || 0
            valB = b.revenue || 0
          } else if (sortBy === 'name') {
            valA = a.name.toLowerCase()
            valB = b.name.toLowerCase()
            return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
          } else if (sortBy === 'revenue') {
            valA = a.revenue || 0
            valB = b.revenue || 0
          } else if (sortBy === 'status') {
            const statusOrder = { 'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'no-sales': 1 }
            valA = statusOrder[this.getPerformanceStatusClass(a)] || 0
            valB = statusOrder[this.getPerformanceStatusClass(b)] || 0
          }
          if (order === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0
          } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0
          }
        })
        return sorted
      },

      sortPerformance(column) {
        if (this.performanceSortBy === column) {
          this.performanceSortOrder = this.performanceSortOrder === 'asc' ? 'desc' : 'asc'
        } else {
          this.performanceSortBy = column
          this.performanceSortOrder = column === 'rank' || column === 'revenue' ? 'desc' : 'asc'
        }
        this.performancePage = 1
      },

      getSortArrow(column) {
        if (this.performanceSortBy !== column) return '⇅'
        return this.performanceSortOrder === 'asc' ? '↑' : '↓'
      },

      // =============================================
      // REVENUE
      // =============================================
      async loadRevenueData() {
        this.revenueLoading = true
        try {
          const days = this.getPeriodDays()
          const stallIds = this.stalls.map(s => s.id)
          if (!stallIds || stallIds.length === 0) {
            this.revenueData = []
            this.revenueLoading = false
            return
          }
          const res = await axios.get(
            `${API_BASE}/stall-performance?days=${days}&stallIds=${stallIds.join(',')}`,
            { headers: { Authorization: `Bearer ${this.token}` } }
          )
          const performanceData = res.data || []
          this.revenueData = this.stalls.map(stall => {
            const perf = performanceData.find(p => p.id === stall.id || p.stall_id === stall.id)
            return {
              ...stall,
              revenue: parseFloat(perf?.revenue) || 0,
              transactions: parseInt(perf?.items_sold) || 0,
              avgTransaction: parseFloat(perf?.avg_transaction) || 0,
              state: stall.state || 'Unknown'
            }
          }).sort((a, b) => b.revenue - a.revenue)
          this.$nextTick(() => {
            setTimeout(() => {
              this.initRevenueChart()
              this.initRevenueStateChart()
            }, 100)
          })
        } catch (err) {
          console.error('Failed to load revenue data:', err)
          this.$emit('show-notification', 'Failed to load revenue data', 'error')
        } finally {
          this.revenueLoading = false
        }
      },

      sortRevenueData(list) {
        const sorted = [...list]
        const sortBy = this.revenueSortBy
        const order = this.revenueSortOrder
        sorted.sort((a, b) => {
          let valA, valB
          if (sortBy === 'rank' || sortBy === 'revenue') {
            valA = a.revenue || 0
            valB = b.revenue || 0
          } else if (sortBy === 'name') {
            valA = a.name.toLowerCase()
            valB = b.name.toLowerCase()
            return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
          } else if (sortBy === 'state') {
            valA = (a.state || '').toLowerCase()
            valB = (b.state || '').toLowerCase()
            return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
          } else if (sortBy === 'transactions') {
            valA = a.transactions || 0
            valB = b.transactions || 0
          } else if (sortBy === 'status') {
            const statusOrder = { 'excellent': 5, 'good': 4, 'average': 3, 'poor': 2, 'no-sales': 1 }
            valA = statusOrder[this.getRevenueStatusClass(a)] || 0
            valB = statusOrder[this.getRevenueStatusClass(b)] || 0
          }
          if (order === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0
          } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0
          }
        })
        return sorted
      },

      resetRevenuePagination() {
        this.revenuePage = 1
      },

      prevRevenuePage() {
        if (this.revenuePage > 1) this.revenuePage--
      },

      nextRevenuePage() {
        if (this.revenuePage < this.revenueTotalPages) this.revenuePage++
      },

      clearRevenueFilters() {
        this.revenueStateFilter = 'All States'
        this.revenueStallFilter = 'all'
        this.revenueSearch = ''
        this.revenuePage = 1
        this.revenueSortBy = 'revenue'
        this.revenueSortOrder = 'desc'
      },

      async refreshRevenueData() {
        await this.loadRevenueData()
      },

      getRevenueStatusText(item) {
        const revenue = item.revenue || 0
        if (revenue === 0) return 'No Sales'
        if (revenue > 1000) return 'Excellent'
        if (revenue > 500) return 'Good'
        if (revenue > 100) return 'Average'
        return 'Poor'
      },

      getRevenueStatusEmoji(item) {
        const revenue = item.revenue || 0
        if (revenue === 0) return '⚪'
        if (revenue > 1000) return '🟢'
        if (revenue > 500) return '🔵'
        if (revenue > 100) return '🟡'
        return '🔴'
      },

      getRevenueStatusClass(item) {
        const revenue = item.revenue || 0
        if (revenue === 0) return 'no-sales'
        if (revenue > 1000) return 'excellent'
        if (revenue > 500) return 'good'
        if (revenue > 100) return 'average'
        return 'poor'
      },

      initRevenueChart() {
        if (!this.$refs.revenueChartRef) return
        if (this.revenueChartInstance) {
          this.revenueChartInstance.dispose()
          this.revenueChartInstance = null
        }
        this.revenueChartInstance = echarts.init(this.$refs.revenueChartRef)
        const sortedData = [...this.revenueData].sort((a, b) => b.revenue - a.revenue)
        const topStalls = sortedData.slice(0, 10)
        const names = topStalls.map(item => item.name)
        const revenues = topStalls.map(item => item.revenue || 0)
        const option = {
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: [8, 12],
            textStyle: { color: '#1e293b', fontSize: 12 },
            formatter: function(params) {
              const index = params[0]?.dataIndex || 0
              const item = topStalls[index]
              return `
                <div style="font-weight:600;margin-bottom:4px;">${item.name}</div>
                <div style="color:#F94908;font-size:14px;font-weight:700;">${new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(item.revenue || 0)}</div>
                <div style="color:#94a3b8;font-size:11px;">${item.transactions || 0} transactions</div>
              `
            }
          },
          grid: { left: '3%', right: '4%', bottom: '10%', top: '8%', containLabel: true },
          xAxis: {
            type: 'category',
            data: names,
            axisLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 500, rotate: names.length > 5 ? 30 : 0, interval: 0 },
            axisLine: { lineStyle: { color: '#e2e8f0' } }
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
            axisLabel: { color: '#94a3b8', fontSize: 10, formatter: function(value) {
              if (value >= 1000) return 'RM' + (value / 1000).toFixed(0) + 'k'
              return 'RM' + value
            }}
          },
          series: [{
            type: 'bar',
            data: revenues,
            barWidth: '40%',
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [{ offset: 0, color: '#F94908' }, { offset: 1, color: '#fa6a2e' }]
              }
            },
            emphasis: { itemStyle: { color: '#d63d07' } }
          }]
        }
        this.revenueChartInstance.setOption(option)
        this.revenueChartInstance.resize()
      },

      initRevenueStateChart() {
        if (!this.$refs.revenueStateChartRef) return
        if (this.revenueStateChartInstance) {
          this.revenueStateChartInstance.dispose()
          this.revenueStateChartInstance = null
        }
        this.revenueStateChartInstance = echarts.init(this.$refs.revenueStateChartRef)
        const stateData = this.revenueStateStats
        const states = stateData.map(item => item.state)
        const revenues = stateData.map(item => item.revenue)
        const option = {
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: [8, 12],
            textStyle: { color: '#1e293b', fontSize: 12 },
            formatter: function(params) {
              const index = params[0]?.dataIndex || 0
              const item = stateData[index]
              return `
                <div style="font-weight:600;margin-bottom:4px;">📍 ${item.state}</div>
                <div style="color:#F94908;font-size:14px;font-weight:700;">${new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(item.revenue)}</div>
                <div style="color:#94a3b8;font-size:11px;">${item.transactions} transactions</div>
                <div style="color:#94a3b8;font-size:11px;">${item.stalls} stalls</div>
              `
            }
          },
          grid: { left: '3%', right: '4%', bottom: '10%', top: '8%', containLabel: true },
          xAxis: {
            type: 'category',
            data: states,
            axisLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 500, rotate: states.length > 5 ? 30 : 0, interval: 0 },
            axisLine: { lineStyle: { color: '#e2e8f0' } }
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
            axisLabel: { color: '#94a3b8', fontSize: 10, formatter: function(value) {
              if (value >= 1000) return 'RM' + (value / 1000).toFixed(0) + 'k'
              return 'RM' + value
            }}
          },
          series: [{
            type: 'bar',
            data: revenues,
            barWidth: '40%',
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#a78bfa' }]
              }
            },
            emphasis: { itemStyle: { color: '#5b21b6' } }
          }]
        }
        this.revenueStateChartInstance.setOption(option)
        this.revenueStateChartInstance.resize()
      },

      async exportRevenueData() {
        try {
          this.$emit('show-notification', 'Exporting revenue data...', 'info')
          const ExcelJS = await import('exceljs')
          const { saveAs } = await import('file-saver')
          const workbook = new ExcelJS.Workbook()
          const sheet = workbook.addWorksheet('Revenue Data')
          sheet.addRow(['Revenue Report', ''])
          sheet.addRow(['Period', this.getRevenuePeriodLabel])
          sheet.addRow(['Total Revenue', this.formatCurrency(this.revenueStats.totalRevenue)])
          sheet.addRow(['Total Transactions', this.formatNumber(this.revenueStats.totalTransactions)])
          sheet.addRow(['Average Transaction', this.formatCurrency(this.revenueStats.avgTransaction)])
          sheet.addRow([])
          sheet.addRow(['Rank', 'Stall', 'State', 'Revenue', 'Transactions', 'Avg Transaction', 'Status'])
          this.revenueData.forEach((item, index) => {
            sheet.addRow([
              index + 1,
              item.name,
              item.state || '-',
              item.revenue || 0,
              item.transactions || 0,
              item.avgTransaction || 0,
              this.getRevenueStatusText(item)
            ])
          })
          sheet.columns.forEach(col => { col.width = Math.max(col.width || 0, 15) })
          const buffer = await workbook.xlsx.writeBuffer()
          saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
            `Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
          this.$emit('show-notification', 'Revenue data exported!', 'success')
        } catch (err) {
          console.error('Export error:', err)
          this.$emit('show-notification', 'Export failed', 'error')
        }
      },

      // =============================================
      // TRANSACTIONS
      // =============================================
      async loadTransactions() {
        this.transactionsLoading = true
        try {
          const days = this.getPeriodDays()
          const stallIds = this.stalls.map(s => s.id)
          if (!stallIds || stallIds.length === 0) {
            this.transactions = []
            this.transactionsLoading = false
            return
          }
          const res = await axios.get(
            `${API_BASE}/transactions?stallIds=${stallIds.join(',')}&days=${days}&limit=200`,
            { headers: { Authorization: `Bearer ${this.token}` } }
          )
          this.transactions = res.data || []
        } catch (err) {
          console.error('Failed to load transactions:', err)
          this.transactions = []
          if (err.response?.status !== 404) {
            this.$emit('show-notification', 'Failed to load transactions', 'error')
          }
        } finally {
          this.transactionsLoading = false
        }
      },

      refreshTransactions() {
        this.loadTransactions()
        this.$emit('show-notification', 'Transactions refreshed', 'success')
      },

      getTransactionStatusEmoji(status) {
        const s = (status || '').toLowerCase()
        if (s === 'completed') return '✅'
        if (s === 'pending') return '⏳'
        if (s === 'failed') return '❌'
        return '✅'
      },

      resetTransactionPagination() {
        this.transactionPage = 1
      },

      prevTransactionPage() {
        if (this.transactionPage > 1) this.transactionPage--
      },

      nextTransactionPage() {
        if (this.transactionPage < this.transactionTotalPages) this.transactionPage++
      },

      clearTransactionFilters() {
        this.transactionSearch = ''
        this.transactionStallFilter = 'all'
        this.transactionStatusFilter = 'all'
        this.transactionDateFrom = null
        this.transactionDateTo = null
        this.transactionPage = 1
        this.transactionSortBy = 'created_at'
        this.transactionSortOrder = 'desc'
        this.transactions = []
        this.loadTransactions()
      },

      async exportTransactions() {
        try {
          this.$emit('show-notification', 'Exporting transactions...', 'info')
          const ExcelJS = await import('exceljs')
          const { saveAs } = await import('file-saver')
          const workbook = new ExcelJS.Workbook()
          const sheet = workbook.addWorksheet('Transactions')
          sheet.addRow(['Transactions Report', ''])
          sheet.addRow(['Generated', new Date().toLocaleString()])
          sheet.addRow(['Total Transactions', this.transactions.length])
          sheet.addRow(['Total Revenue', this.formatCurrency(this.transactionStats.totalRevenue)])
          sheet.addRow([])
          sheet.addRow(['Order ID', 'Stall', 'Items', 'Amount', 'Status', 'Date'])
          this.filteredTransactions.forEach(tx => {
            sheet.addRow([
              tx.order_number || 'N/A',
              tx.stall_name || '-',
              tx.item_count || tx.items?.length || 0,
              tx.total_amount || 0,
              tx.status || 'Completed',
              this.formatFullDate(tx.created_at)
            ])
          })
          sheet.columns.forEach(col => { col.width = Math.max(col.width || 0, 15) })
          const buffer = await workbook.xlsx.writeBuffer()
          saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
            `Transactions_${new Date().toISOString().split('T')[0]}.xlsx`)
          this.$emit('show-notification', 'Transactions exported!', 'success')
        } catch (err) {
          console.error('Export error:', err)
          this.$emit('show-notification', 'Export failed', 'error')
        }
      },

      // =============================================
      // TRANSACTION DETAILS
      // =============================================
      viewTransactionDetails(tx) {
        this.selectedTransaction = tx
        this.transactionDetailModal = true
      },

      getProcessedByName(transaction) {
        if (!transaction) return 'System'
        return transaction.cashier_name || 
              transaction.user_full_name || 
              transaction.username || 
              'System'
      },

      getTransactionItems(transaction) {
        if (!transaction) return []
        if (transaction.items && Array.isArray(transaction.items)) {
          return transaction.items
        }
        const alternatives = ['order_items', 'details', 'products', 'menu_items']
        for (const key of alternatives) {
          if (transaction[key] && Array.isArray(transaction[key]) && transaction[key].length > 0) {
            return transaction[key]
          }
        }
        return []
      },

      getItemName(item) {
        if (!item) return 'Unknown Item'
        return item.item_name || item.name || item.product_name || item.menu_name || 'Unknown Item'
      },

      getItemQuantity(item) {
        if (!item) return 0
        return parseInt(item.quantity || item.qty || item.count || 1)
      },

      getItemPrice(item) {
        if (!item) return 0
        return parseFloat(item.price || item.unit_price || 0)
      },

      getItemTotal(item) {
        return this.getItemQuantity(item) * this.getItemPrice(item)
      },

      async viewAllTransactions(item) {
        if (this.activeTab === 'revenue') {
          this.activeTab = 'transactions'
          this.transactionStallFilter = item.id
          this.transactionSearch = item.name
          this.loadTransactions()
          this.$emit('show-notification', `📊 Viewing transactions for ${item.name}`, 'info')
          return
        }
        this.selectedStallForModal = item
        this.transactionModal = true
        this.modalTransactionsLoading = true
        try {
          const days = 30
          const res = await axios.get(
            `${API_BASE}/transactions?stallId=${item.id}&days=${days}&limit=50`,
            { headers: { Authorization: `Bearer ${this.token}` } }
          )
          this.modalTransactions = res.data || []
        } catch (err) {
          console.error('Failed to load transactions:', err)
          this.modalTransactions = []
        } finally {
          this.modalTransactionsLoading = false
        }
      },

      // =============================================
      // REGISTRATIONS
      // =============================================
      async loadRegistrations() {
        this.loadingRegistrations = true
        try {
          const res = await axios.get(`${API_BASE}/register/pending`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          this.registrations = res.data
          this.pendingRegistrations = res.data.filter(r => r.status === 'pending')
        } catch (err) {
          console.error('Failed to load registrations:', err)
          this.$emit('show-notification', 'Failed to load registrations', 'error')
        } finally {
          this.loadingRegistrations = false
        }
      },

      async approveRegistration(id) {
        if (!confirm('Approve this registration?')) return
        try {
          const res = await axios.post(`${API_BASE}/register/approve/${id}`, {}, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          if (res.data.success) {
            this.$emit('show-notification', 'Registration approved! Welcome email sent.', 'success')
            this.loadRegistrations()
            this.loadData()
          }
        } catch (err) {
          this.$emit('show-notification', err.response?.data?.error || 'Failed to approve', 'error')
        }
      },

      openRejectModal(id) {
        this.rejectId = id
        this.rejectReason = ''
        this.showRejectModal = true
      },

      async confirmReject() {
        if (!this.token) {
          this.$emit('show-notification', 'You are not authenticated', 'error')
          return
        }
        if (!this.rejectReason || this.rejectReason.trim() === '') {
          this.$emit('show-notification', 'Please provide a rejection reason', 'warning')
          return
        }
        try {
          const response = await axios.post(
            `${API_BASE}/register/reject/${this.rejectId}`,
            { rejection_reason: this.rejectReason.trim() },
            { headers: { Authorization: `Bearer ${this.token}` } }
          )
          if (response.data.success) {
            this.$emit('show-notification', 'Registration rejected. Email sent.', 'success')
            this.showRejectModal = false
            this.rejectReason = ''
            this.rejectId = null
            this.loadRegistrations()
          }
        } catch (err) {
          console.error('Failed to reject registration:', err)
          this.$emit('show-notification', err.response?.data?.error || 'Failed to reject', 'error')
        }
      },

      async viewRejectionHistory(requestId) {
        try {
          const response = await axios.get(
            `${API_BASE}/register/rejection-history/${requestId}`,
            { headers: { Authorization: `Bearer ${this.token}` } }
          )
          this.rejectionHistory = response.data.rejection_history || []
          this.showHistoryModal = true
        } catch (error) {
          console.error('Error fetching rejection history:', error)
          this.$emit('show-notification', 'Failed to load rejection history', 'error')
        }
      },

      viewReceipt(url) {
        console.log('📎 Viewing receipt:', url)
        if (!url) {
          this.viewReceiptUrl = null
          this.viewReceiptModal = true
          return
        }
        if (url.startsWith('data:')) {
          this.viewReceiptUrl = url
          this.viewReceiptModal = true
          return
        }
        if (url.startsWith('/uploads/')) {
          const baseUrl = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'
          this.viewReceiptUrl = `${baseUrl}${url}`
          this.viewReceiptModal = true
          return
        }
        if (url.startsWith('http')) {
          this.viewReceiptUrl = url
          this.viewReceiptModal = true
          return
        }
        if (url.endsWith('.pdf') || url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg')) {
          const baseUrl = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'
          this.viewReceiptUrl = `${baseUrl}/uploads/${url}`
          this.viewReceiptModal = true
          return
        }
        this.viewReceiptUrl = url
        this.viewReceiptModal = true
      },

      downloadReceipt() {
        if (!this.viewReceiptUrl) {
          this.$emit('show-notification', 'No receipt to download', 'error')
          return
        }
        try {
          if (this.viewReceiptUrl.startsWith('data:application/pdf')) {
            const base64Data = this.viewReceiptUrl.split(',')[1]
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            this.triggerDownload(url, 'receipt-' + Date.now() + '.pdf')
            return
          }
          if (this.viewReceiptUrl.startsWith('data:image')) {
            const link = document.createElement('a')
            link.href = this.viewReceiptUrl
            link.download = 'receipt-' + Date.now() + '.jpg'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            this.$emit('show-notification', 'Receipt downloaded!', 'success')
            return
          }
          if (this.viewReceiptUrl.startsWith('http')) {
            const link = document.createElement('a')
            link.href = this.viewReceiptUrl
            link.download = 'receipt-' + Date.now() + '.pdf'
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            this.$emit('show-notification', 'Download started!', 'success')
            return
          }
          this.$emit('show-notification', 'Unable to download this file type', 'error')
        } catch (error) {
          console.error('Download error:', error)
          this.$emit('show-notification', 'Failed to download receipt', 'error')
        }
      },

      triggerDownload(url, filename) {
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => { URL.revokeObjectURL(url) }, 1000)
        this.$emit('show-notification', 'PDF downloaded successfully!', 'success')
      },

      handleReceiptError() {
        this.$emit('show-notification', 'Failed to load receipt image', 'error')
      },

      // =============================================
      // SHIFT HISTORY (FIXED)
      // =============================================
      async loadShiftHistory() {
        this.shiftHistoryLoading = true
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'
          const stallIds = this.stalls.map(s => s.id)
          if (stallIds.length === 0) {
            this.shiftHistory = []
            this.shiftHistoryTotal = 0
            this.shiftHistoryLoading = false
            return
          }
          let allShifts = []
          let totalCount = 0
          const now = this.getTodayInMalaysia()
          let startDate = null
          let endDate = null
          if (this.selectedPeriod === 'today') {
            startDate = new Date(now)
            startDate.setHours(0, 0, 0, 0)
            endDate = new Date(now)
            endDate.setHours(23, 59, 59, 999)
          } else if (this.selectedPeriod === 'week') {
            const dayOfWeek = now.getDay()
            const daysToMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1)
            startDate = new Date(now)
            startDate.setDate(now.getDate() - daysToMonday)
            startDate.setHours(0, 0, 0, 0)
            endDate = new Date(startDate)
            endDate.setDate(startDate.getDate() + 6)
            endDate.setHours(23, 59, 59, 999)
          } else if (this.selectedPeriod === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            endDate.setHours(23, 59, 59, 999)
          }
          if (this.shiftHistoryStallFilter === 'all') {
            for (const stall of this.stalls) {
              try {
                let url = `${apiBase}/shifts/history?stallId=${stall.id}&limit=1000`
                if (startDate && endDate) {
                  url += `&from=${startDate.toISOString()}&to=${endDate.toISOString()}`
                }
                const res = await axios.get(url, {
                  headers: { Authorization: `Bearer ${this.token}` }
                })
                const shifts = res.data.shifts || []
                allShifts = [...allShifts, ...shifts]
                totalCount += res.data.total || 0
              } catch (err) {
                console.warn(`Failed to load shifts for stall ${stall.id}:`, err.message)
              }
            }
            allShifts.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at))
            this.shiftHistory = allShifts
            this.shiftHistoryTotal = totalCount
          } else {
            try {
              let url = `${apiBase}/shifts/history?stallId=${this.shiftHistoryStallFilter}&limit=1000`
              if (startDate && endDate) {
                url += `&from=${startDate.toISOString()}&to=${endDate.toISOString()}`
              }
              const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${this.token}` }
              })
              this.shiftHistory = res.data.shifts || []
              this.shiftHistoryTotal = res.data.total || 0
            } catch (err) {
              console.warn(`Failed to load shifts for specific stall:`, err.message)
              this.shiftHistory = []
              this.shiftHistoryTotal = 0
            }
          }
          // Process inventory data
          this.shiftHistory = this.shiftHistory.map(shift => {
            let openingInventory = {}
            let closingInventory = {}
            try {
              openingInventory = typeof shift.opening_inventory === 'string' 
                ? JSON.parse(shift.opening_inventory) 
                : (shift.opening_inventory || {})
            } catch { openingInventory = {} }
            try {
              closingInventory = typeof shift.closing_inventory === 'string' 
                ? JSON.parse(shift.closing_inventory) 
                : (shift.closing_inventory || {})
            } catch { closingInventory = {} }
            const inventoryUsage = {}
            Object.keys(openingInventory).forEach(key => {
              const opening = parseFloat(openingInventory[key]) || 0
              const closing = parseFloat(closingInventory[key]) || 0
              inventoryUsage[key] = Math.max(0, opening - closing)
            })
            return {
              ...shift,
              revenue: parseFloat(shift.revenue || shift.total_revenue || 0),
              transaction_count: parseInt(shift.transaction_count || 0),
              starting_float: parseFloat(shift.starting_float) || 0,
              variance: parseFloat(shift.variance) || 0,
              expected_cash: parseFloat(shift.expected_cash) || 0,
              ending_cash: parseFloat(shift.ending_cash) || 0,
              total_revenue: parseFloat(shift.revenue || 0),
              opening_inventory: openingInventory,
              closing_inventory: closingInventory,
              inventory_usage: inventoryUsage,
              has_inventory_data: Object.keys(openingInventory).length > 0 || Object.keys(closingInventory).length > 0
            }
          })
          console.log('📊 Shift history loaded:', this.shiftHistory.length)
        } catch (err) {
          console.error('Failed to load shift history:', err)
          this.shiftHistory = []
          this.shiftHistoryTotal = 0
        } finally {
          this.shiftHistoryLoading = false
        }
      },

      getStallName(stallId) {
        const stall = this.stalls.find(s => s.id === stallId)
        return stall ? stall.name : 'Unknown'
      },

      getVarianceClass(shift) {
        const variance = parseFloat(shift.variance) || 0
        if (variance > 0) return 'over'
        if (variance < 0) return 'short'
        return 'balanced'
      },

      getInventoryUsage(shift, material) {
        if (!shift || !shift.opening_inventory) return 0
        const opening = parseFloat(shift.opening_inventory[material]) || 0
        const closing = parseFloat(shift.closing_inventory?.[material]) || 0
        return Math.max(0, opening - closing)
      },

      getUsageClass(shift, material) {
        const usage = this.getInventoryUsage(shift, material)
        if (usage > 0) return 'used'
        return 'zero'
      },

      resetShiftPagination() {
        this.shiftCurrentPage = 1
      },

      prevShiftPage() {
        if (this.shiftCurrentPage > 1) this.shiftCurrentPage--
      },

      nextShiftPage() {
        if (this.shiftCurrentPage < this.shiftTotalPages) this.shiftCurrentPage++
      },

      clearShiftFilters() {
        this.shiftHistoryStallFilter = 'all'
        this.shiftHistoryStatusFilter = 'all'
        this.shiftHistorySearch = ''
        this.shiftHistoryStateFilter = 'All States'
        this.shiftCurrentPage = 1
        this.loadShiftHistory()
      },

      async viewShiftDetails(shift) {
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'
          const res = await axios.get(
            `${apiBase}/shifts/${shift.id}`,
            { headers: { Authorization: `Bearer ${this.token}` } }
          )
          this.selectedShift = res.data
          this.shiftDetailModal = true
        } catch (err) {
          console.error('Failed to load shift details:', err)
          this.$emit('show-notification', 'Failed to load shift details', 'error')
        }
      },

      async exportShiftHistory() {
        try {
          this.$emit('show-notification', 'Exporting shift history...', 'info')
          const ExcelJS = await import('exceljs')
          const { saveAs } = await import('file-saver')
          const workbook = new ExcelJS.Workbook()
          const sheet = workbook.addWorksheet('Shift History')
          sheet.addRow(['Shift History Report', ''])
          sheet.addRow(['Generated', new Date().toLocaleString()])
          sheet.addRow(['Total Shifts', this.filteredShiftHistory.length])
          sheet.addRow([])
          sheet.addRow(['Date', 'Stall', 'Revenue', 'Orders', 'Float', 'Variance', 'Status'])
          this.filteredShiftHistory.forEach(shift => {
            sheet.addRow([
              this.formatDate(shift.opened_at),
              this.getStallName(shift.stall_id),
              shift.revenue || 0,
              shift.transaction_count || 0,
              shift.starting_float || 0,
              shift.variance || 0,
              shift.status || 'closed'
            ])
          })
          sheet.columns.forEach(col => { col.width = Math.max(col.width || 0, 15) })
          const buffer = await workbook.xlsx.writeBuffer()
          saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
            `Shift_History_${new Date().toISOString().split('T')[0]}.xlsx`)
          this.$emit('show-notification', 'Shift history exported!', 'success')
        } catch (err) {
          console.error('Export error:', err)
          this.$emit('show-notification', 'Export failed', 'error')
        }
      },

      async exportShiftReport() {
        if (!this.selectedShift) return
        try {
          this.$emit('show-notification', 'Exporting shift report...', 'info')
          const ExcelJS = await import('exceljs')
          const { saveAs } = await import('file-saver')
          const workbook = new ExcelJS.Workbook()
          const sheet = workbook.addWorksheet('Shift Report')
          sheet.addRow(['Shift Report', ''])
          sheet.addRow(['Stall', this.getStallName(this.selectedShift.stall_id)])
          sheet.addRow(['Opened', this.formatDateTime(this.selectedShift.opened_at)])
          sheet.addRow(['Closed', this.formatDateTime(this.selectedShift.closed_at) || 'Open'])
          sheet.addRow(['Status', this.selectedShift.status])
          sheet.addRow(['Revenue', this.selectedShift.revenue])
          sheet.addRow(['Orders', this.selectedShift.transaction_count])
          sheet.addRow(['Starting Float', this.selectedShift.starting_float])
          sheet.addRow(['Ending Cash', this.selectedShift.ending_cash])
          sheet.addRow(['Expected Cash', this.selectedShift.expected_cash])
          sheet.addRow(['Variance', this.selectedShift.variance])
          sheet.addRow([])
          sheet.addRow(['Orders', ''])
          sheet.addRow(['Order ID', 'Amount', 'Items', 'Status', 'Time'])
          ;(this.selectedShift.transactions || []).forEach(tx => {
            sheet.addRow([
              tx.order_number || 'N/A',
              tx.total_amount || 0,
              tx.item_count || 0,
              tx.status || 'completed',
              this.formatTime(tx.created_at)
            ])
          })
          sheet.columns.forEach(col => { col.width = Math.max(col.width || 0, 15) })
          const buffer = await workbook.xlsx.writeBuffer()
          saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
            `Shift_Report_${this.selectedShift.id}_${new Date().toISOString().split('T')[0]}.xlsx`)
          this.$emit('show-notification', 'Shift report exported!', 'success')
        } catch (err) {
          console.error('Export error:', err)
          this.$emit('show-notification', 'Export failed', 'error')
        }
      },

      // =============================================
      // STALL DETAILS - FIXED
      // =============================================
viewStallDetails(stall) {
  this.selectedStall = stall
  this.stallDetailModal = true
  this.selectedStallId = stall.id
  
  this.fetchStallDetails(stall.id, this.selectedPeriod)
  
  this.$nextTick(() => {
    // ✅ Only initialize chart if stall has sales
    if (stall.revenue && stall.revenue > 0) {
      this.initStallDetailChart(stall.id, this.selectedPeriod)
    } else {
      // Show empty state in chart container
      if (this.$refs.stallDetailChartRef) {
        if (this.stallDetailChartInstance) {
          this.stallDetailChartInstance.dispose()
          this.stallDetailChartInstance = null
        }
        this.stallDetailChartInstance = echarts.init(this.$refs.stallDetailChartRef)
        this.stallDetailChartInstance.setOption({
          title: {
            text: `📊 No sales for ${this.getPeriodLabel()}`,
            left: 'center',
            top: 'center',
            textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 }
          }
        })
        this.stallDetailChartInstance.resize()
      }
    }
  })
},

      async fetchStallDetails(stallId, period = 'week') {
        try {
          const days = this.getPeriodDays()
          const res = await axios.get(`${API_BASE}/stall-performance?days=${days}&stallId=${stallId}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          const data = res.data || {}
          if (data && data.length > 0) {
            const stallData = data[0]
            this.selectedStall.items = parseInt(stallData.items_sold) || 0
            this.selectedStall.avgTransaction = parseFloat(stallData.avg_transaction) || 0
            this.selectedStall.revenue = parseFloat(stallData.revenue) || 0
          }
        } catch (err) {
          console.error('Failed to fetch stall details:', err)
        }
      },

      closeStallDetailModal() {
        this.stallDetailModal = false
        this.selectedStall = null
        if (this.stallDetailChartInstance) {
          this.stallDetailChartInstance.dispose()
          this.stallDetailChartInstance = null
        }
      },

initStallDetailChart(stallId, period = 'week') {
  if (!this.$refs.stallDetailChartRef) return

  if (this.stallDetailChartInstance) {
    this.stallDetailChartInstance.dispose()
    this.stallDetailChartInstance = null
  }

  this.stallDetailChartInstance = echarts.init(this.$refs.stallDetailChartRef)

  if (!stallId) {
    console.warn('No stall ID found for detail chart')
    return
  }

  // ===== DETERMINE DAYS BASED ON PERIOD =====
  const days = period === 'today' ? 1 :
               period === 'week' ? 7 :
               period === 'month' ? 30 :
               period === 'quarter' ? 90 :
               period === 'halfyear' ? 180 :
               period === 'year' ? 365 :
               period === 'custom' ? this.customDays || 30 :
               30

  // ===== DETERMINE GROUPING BASED ON PERIOD =====
  let grouping
  if (period === 'today') {
    grouping = 'hour'
  } else if (period === 'week') {
    grouping = 'day'
  } else if (period === 'month') {
    grouping = 'week'  // ← Group by week (Mon-Sun)
  } else if (period === 'quarter' || period === 'halfyear' || period === 'year') {
    grouping = 'month'  // ← Group by month
  } else if (period === 'custom') {
    const customDays = this.customDays || 30
    if (customDays <= 14) {
      grouping = 'day'
    } else if (customDays <= 60) {
      grouping = 'week'
    } else {
      grouping = 'month'
    }
  } else {
    grouping = 'day'
  }

  // ===== FETCH DATA USING stall-sales-trend =====
  const url = `${API_BASE}/stall-sales-trend?stallId=${stallId}&days=${days}&period=${period}`;
  
  console.log(`📊 Fetching stall sales trend for stall ${stallId}, period: ${period}, grouping: ${grouping}`);
  
  axios.get(url, {
    headers: { Authorization: `Bearer ${this.token}` }
  })
  .then(response => {
    const data = response.data || {};
    let salesData = data.data || [];
    
    console.log(`📊 Fetched ${salesData.length} records from sales table for period: ${period}`);
    
    if (!salesData || salesData.length === 0) {
      const option = {
        title: {
          text: `No sales for ${this.getPeriodLabel()}`,
          left: 'center',
          top: 'center',
          textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 }
        }
      }
      this.stallDetailChartInstance.setOption(option)
      this.stallDetailChartInstance.resize()
      return
    }

    // ===== GROUP THE DATA CORRECTLY =====
    let groupedData = this.groupSalesData(salesData, grouping, period)
    
    // ===== GENERATE LABELS =====
    const chartLabels = groupedData.map(item => {
      if (period === 'today') {
        return this.formatHourLabel(item.date)
      } else if (period === 'week') {
        return this.formatDayLabel(item.date)
      } else if (period === 'month') {
        return this.formatWeekRangeLabel(item.date)  // ← Shows "Jul 1-7", "Jul 8-14", etc.
      } else if (period === 'quarter' || period === 'halfyear' || period === 'year') {
        return this.formatMonthLabel(item.date)  // ← Shows "Jul", "Aug", "Sep", etc.
      } else if (period === 'custom') {
        const customDays = this.customDays || 30
        if (customDays <= 14) {
          return this.formatDayLabel(item.date)
        } else if (customDays <= 60) {
          return this.formatWeekRangeLabel(item.date)
        } else {
          return this.formatMonthLabel(item.date)
        }
      }
      return item.label || item.date
    })
    
    const revenues = groupedData.map(d => parseFloat(d.revenue) || 0)
    const items = groupedData.map(d => parseInt(d.items) || 0)
    
    // ===== CHECK IF THERE'S ANY REVENUE =====
    const hasRevenue = revenues.some(r => r > 0)
    if (!hasRevenue) {
      const option = {
        title: {
          text: `No sales for ${this.getPeriodLabel()}`,
          left: 'center',
          top: 'center',
          textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 }
        }
      }
      this.stallDetailChartInstance.setOption(option)
      this.stallDetailChartInstance.resize()
      return
    }

    // ===== CREATE CHART =====
    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#1e293b', fontSize: 12 },
        formatter: (params) => {
          const index = params[0]?.dataIndex || 0
          const revenue = parseFloat(revenues[index]) || 0
          const itemsCount = parseInt(items[index]) || 0
          let label = chartLabels[index] || ''
          
          // Show full date in tooltip for week ranges
          if (period === 'month' && groupedData[index]) {
            const date = new Date(groupedData[index].date)
            const weekStart = this.getWeekStart(date)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)
            label = `${weekStart.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', timeZone: 'UTC' })} - ${weekEnd.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`
          }
          
          return `
            <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">${label}</div>
            <div style="font-size:13px;font-weight:600;color:#F94908;margin-bottom:2px;">
              RM ${revenue.toFixed(2)}
            </div>
            <div style="font-size:11px;color:#64748b;">${itemsCount} items sold</div>
          `
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartLabels,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { 
          color: '#94a3b8', 
          fontSize: 11,
          fontWeight: 500,
          rotate: chartLabels.length > 7 ? 30 : 0
        }
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
        data: revenues,
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
    console.error('Failed to load stall sales trend:', err)
    const option = {
      title: {
        text: 'Error loading sales data',
        left: 'center',
        top: 'center',
        textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 }
      }
    }
    this.stallDetailChartInstance.setOption(option)
    this.stallDetailChartInstance.resize()
  })
},

      // =============================================
      // MENU ITEM DETAILS
      // =============================================
      async viewMenuItemDetails(item) {
        this.selectedMenuItem = {
          ...item,
          stallBreakdown: [],
          totalQuantity: 0
        }
        this.menuDetailModal = true
        await this.fetchMenuTopStalls(item.name)
      },

      async fetchMenuTopStalls(itemName) {
        try {
          const days = this.getPeriodDays()
          const stallIds = this.stalls.map(s => s.id)
          if (!stallIds || stallIds.length === 0) return
          const res = await axios.get(`${API_BASE}/menu-performance?days=${days}&itemName=${encodeURIComponent(itemName)}`, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
          const stallData = res.data || []
          const maxQuantity = stallData.reduce((max, s) => Math.max(max, s.quantity || 0), 0)
          this.selectedMenuItem.stallBreakdown = stallData.map(stall => ({
            stallName: stall.stall_name || 'Unknown',
            quantity: parseInt(stall.quantity) || 0,
            revenue: parseFloat(stall.revenue) || 0,
            percentage: maxQuantity > 0 ? (stall.quantity / maxQuantity) * 100 : 0
          })).sort((a, b) => b.quantity - a.quantity)
          this.selectedMenuItem.totalQuantity = stallData.reduce((sum, s) => sum + (s.quantity || 0), 0)
          this.selectedMenuItem.totalRevenue = stallData.reduce((sum, s) => sum + (s.revenue || 0), 0)
        } catch (err) {
          console.error('Failed to fetch top stalls:', err)
          this.selectedMenuItem.stallBreakdown = []
        }
      },

      closeMenuDetailModal() {
        this.menuDetailModal = false
        this.selectedMenuItem = null
      },

      // =============================================
      // RANKING HELPERS
      // =============================================
      getRankClass(index) {
        if (index === 0) return 'gold'
        if (index === 1) return 'silver'
        if (index === 2) return 'bronze'
        return ''
      },

      getStallStatusEmoji(stall) {
        if (!stall || !stall.revenue || stall.revenue === 0) return '⚪'
        if (stall.revenue > 1000) return '🟢'
        if (stall.revenue > 500) return '🔵'
        if (stall.revenue > 100) return '🟡'
        return '🔴'
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

      getPerformanceStatusText(stall) {
        const revenue = stall.revenue || 0
        if (revenue === 0) return 'No Sales'
        if (revenue > 1000) return 'Excellent'
        if (revenue > 500) return 'Good'
        if (revenue > 100) return 'Average'
        return 'Poor'
      },

      getPerformanceStatusEmoji(stall) {
        const revenue = stall.revenue || 0
        if (revenue === 0) return '⚪'
        if (revenue > 1000) return '🟢'
        if (revenue > 500) return '🔵'
        if (revenue > 100) return '🟡'
        return '🔴'
      },

      getPerformanceStatusClass(stall) {
        const revenue = stall.revenue || 0
        if (revenue === 0) return 'no-sales'
        if (revenue > 1000) return 'excellent'
        if (revenue > 500) return 'good'
        if (revenue > 100) return 'average'
        return 'poor'
      },

      getMenuStatusEmoji(quantity) {
        const qty = parseInt(quantity) || 0
        if (qty === 0) return '⚪'
        if (qty > 50) return '🟢'
        if (qty > 20) return '🔵'
        if (qty > 5) return '🟡'
        return '🔴'
      },

      getMenuStatus(quantity) {
        const qty = parseInt(quantity) || 0
        if (qty === 0) return 'No Sales'
        if (qty > 50) return 'Excellent'
        if (qty > 20) return 'Good'
        if (qty > 5) return 'Average'
        return 'Poor'
      },

      getMenuStatusClass(quantity) {
        const qty = parseInt(quantity) || 0
        if (qty === 0) return 'no-sales'
        if (qty > 50) return 'excellent'
        if (qty > 20) return 'good'
        if (qty > 5) return 'average'
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

      getTopStallName() {
        if (this.consolidatedSales.topStall && this.consolidatedSales.topStall !== '-') {
          return this.consolidatedSales.topStall
        }
        return '-'
      },

      getTopStallRevenue() {
        if (this.consolidatedSales.topRevenue && this.consolidatedSales.topRevenue > 0) {
          return this.consolidatedSales.topRevenue
        }
        return 0
      },

      getTopStallStatusText() {
        const revenue = this.getTopStallRevenue()
        if (revenue === 0) return 'No Sales'
        if (revenue > 1000) return 'Excellent'
        if (revenue > 500) return 'Good'
        if (revenue > 100) return 'Average'
        return 'Poor'
      },

      getTopStallStatusEmoji() {
        const revenue = this.getTopStallRevenue()
        if (revenue === 0) return '⚪'
        if (revenue > 1000) return '🟢'
        if (revenue > 500) return '🔵'
        if (revenue > 100) return '🟡'
        return '🔴'
      },

      getTopStallStatusClass() {
        const revenue = this.getTopStallRevenue()
        if (revenue === 0) return 'no-sales'
        if (revenue > 1000) return 'excellent'
        if (revenue > 500) return 'good'
        if (revenue > 100) return 'average'
        return 'poor'
      },

      // =============================================
      // SPARKLINES
      // =============================================
      getSparklinePoints(data) {
        if (!data || data.length === 0) return '0,40 200,40'
        const cleanData = data.map(v => {
          const val = parseFloat(v)
          return isNaN(val) || val === null || val === undefined ? 0 : val
        })
        if (cleanData.every(v => v === 0)) return '0,40 200,40'
        if (cleanData.length === 1) {
          const value = cleanData[0]
          const y = 40 - ((value - 0) / (value || 1)) * 35
          return `0,${y} 200,${y}`
        }
        const points = cleanData.map((value, index) => {
          const x = (index / (cleanData.length - 1)) * 200
          const max = Math.max(...cleanData, 1)
          const min = Math.min(...cleanData, 0)
          const range = max - min || 1
          const y = 40 - ((value - min) / range) * 35
          return `${x},${y}`
        })
        const lastX = (cleanData.length - 1) / (cleanData.length - 1) * 200
        points.push(`${lastX},40`)
        points.push(`0,40`)
        return points.join(' ')
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
            title: { text: `No sales data for ${this.getPeriodLabel()}`, left: 'center', top: 'center',
              textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 } }
          }
          this.chartInstance.setOption(option, true)
          return
        }
        const dates = data.map(d => {
          if (d.label) return d.label
          return this.formatShortDate(d.date)
        })
        const revenues = data.map(d => d.revenue || 0)
        const chartWidth = this.$refs.chartRef?.clientWidth || 0
        const labelInterval = chartWidth < 400 && dates.length > 7 ? Math.floor(dates.length / 6) : 0
        const option = {
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: [6, 10],
            textStyle: { color: '#1e293b', fontSize: 11 },
            formatter: function(params) {
              const index = params[0]?.dataIndex || 0
              const revenue = data[index]?.revenue || 0
              const itemsCount = data[index]?.items || 0
              const dateStr = data[index]?.date || data[index]?.label || ''
              let formattedDate = dateStr
              if (dateStr && !dateStr.includes('W')) {
                const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
                if (dateParts) {
                  const date = new Date(Date.UTC(
                    parseInt(dateParts[1]),
                    parseInt(dateParts[2]) - 1,
                    parseInt(dateParts[3])
                  ))
                  formattedDate = date.toLocaleDateString('en-MY', { 
                    timeZone: 'Asia/Kuala_Lumpur',
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                  })
                }
              }
              return `
                <div style="font-weight:500;margin-bottom:2px;font-size:10px;color:#94a3b8;">${formattedDate}</div>
                <div style="color:#F94908;font-size:14px;font-weight:700;">${new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(revenue)}</div>
                <div style="color:#94a3b8;font-size:10px;margin-top:2px;">${itemsCount} items sold</div>
              `
            }
          },
          grid: { left: chartWidth < 400 ? '5%' : '3%', right: chartWidth < 400 ? '5%' : '4%',
            bottom: '12%', top: '8%', containLabel: true },
          xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisLabel: { color: '#94a3b8', fontSize: chartWidth < 400 ? 9 : 11, fontWeight: 500,
              interval: labelInterval, rotate: chartWidth < 400 ? 30 : 0, margin: 12 }
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
            axisLabel: { color: '#94a3b8', fontSize: chartWidth < 400 ? 9 : 11,
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
              itemStyle: { borderRadius: [4, 4, 0, 0],
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#F94908' }, { offset: 1, color: '#fa6a2e' }]
                }
              },
              emphasis: { itemStyle: { color: '#d63d07' } }
            },
            {
              name: 'Trend Line',
              type: 'line',
              data: revenues,
              smooth: false,
              lineStyle: { color: '#F94908', width: 2.5 },
              symbol: 'circle',
              symbolSize: chartWidth < 400 ? 5 : 7,
              itemStyle: { color: '#F94908', borderColor: '#ffffff', borderWidth: 2 },
              areaStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: 'rgba(249, 73, 8, 0.12)' }, { offset: 1, color: 'rgba(249, 73, 8, 0.01)' }]
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

      getPeakRevenue() {
        if (this.salesTrend.length === 0) return 0
        return Math.max(...this.salesTrend.map(d => d.revenue || 0))
      },

      getPeakDay() {
        if (this.salesTrend.length === 0) return ''
        const max = Math.max(...this.salesTrend.map(d => d.revenue || 0))
        const day = this.salesTrend.find(d => d.revenue === max)
        if (!day) return ''
        return this.formatShortDate(day.date)
      },

      getBestDayName() {
        if (this.salesTrend.length === 0) return '-'
        const max = Math.max(...this.salesTrend.map(d => d.revenue || 0))
        const day = this.salesTrend.find(d => d.revenue === max)
        if (!day) return '-'
        return this.formatShortDate(day.date) || '-'
      },

      getBestDayRevenue() {
        if (this.salesTrend.length === 0) return 0
        const max = Math.max(...this.salesTrend.map(d => d.revenue || 0))
        return max
      },

      getTotalRevenue() {
        return this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0)
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
          backdrop.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--surface); z-index: 9998;`
          document.body.appendChild(backdrop)
          setTimeout(() => this.initChart(), 100)
        } else {
          document.body.style.overflow = ''
          const backdrop = document.getElementById('fullscreen-backdrop')
          if (backdrop) backdrop.remove()
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
          }
          setTimeout(() => this.initChart(), 150)
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
          } else if (this.activeTab === 'menu') {
            sheet = workbook.addWorksheet('Menu')
            sheet.addRow(['📋 Menu Management', ''])
            sheet.addRow(['Item Name', 'Price', 'Category', 'Recipe'])
            for (const item of this.filteredMenuItemsForManagement) {
              const recipe = (item.recipe || []).map(r => `${r.material_name}: ${r.quantity_used}`).join(', ')
              sheet.addRow([item.item_name, item.price, item.category || 'Main', recipe || 'No recipe'])
            }
            fileName = `Chickory_Menu_${new Date().toISOString().split('T')[0]}.xlsx`
          } else if (this.activeTab === 'registrations') {
            sheet = workbook.addWorksheet('Registrations')
            sheet.addRow(['📝 Registration Requests', ''])
            sheet.addRow(['Company', 'Contact', 'Email', 'Phone', 'IC Number', 'Status', 'Date'])
            for (const reg of this.registrations) {
              sheet.addRow([
                reg.company_name,
                reg.contact_person,
                reg.email,
                reg.phone,
                reg.ic_number || '-',
                reg.status,
                this.formatDate(reg.created_at)
              ])
            }
            fileName = `Chickory_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`
          } else if (this.activeTab === 'users') {
            sheet = workbook.addWorksheet('Users')
            sheet.addRow(['Username', 'Full Name', 'Role', 'Company', 'Stalls'])
            for (const user of this.filteredUsersList) {
              sheet.addRow([
                user.username,
                user.full_name || '-',
                user.role,
                user.company_name || '-',
                (user.assigned_stalls || []).map(s => s.name).join(', ') || '-'
              ])
            }
            fileName = `Chickory_Users_${new Date().toISOString().split('T')[0]}.xlsx`
          } else {
            sheet = workbook.addWorksheet('Data')
            sheet.addRow(['Export data for', this.activeTab])
            fileName = `Chickory_Export_${new Date().toISOString().split('T')[0]}.xlsx`
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
    } // ← END OF METHODS
  } // ← END OF EXPORT DEFAULT
  </script>

  <style scoped>
  /* ============================================ */
  /* SUPER ADMIN - ONLY UNIQUE STYLES             */
  /* ============================================ */

  /* All common styles are in app.vue */
  /* Only Super Admin-specific styles below */

  /* ============================================ */
  /* CONTROLS SECTION                            */
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
  /* REGISTRATIONS TABLE - Super Admin Only      */
  /* ============================================ */
  .registrations-table-wrapper {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .registrations-table-header {
    display: flex;
    padding: 0.5rem 0.75rem;
    background: var(--background);
    border-bottom: 1px solid var(--border);
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: var(--text-secondary);
    min-width: 750px;
  }

  .registrations-table-row {
    display: flex;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border-light);
    transition: var(--transition);
    align-items: center;
    min-width: 750px;
  }

  .registrations-table-row:hover {
    background: var(--background);
  }

  .registrations-table-cell {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .registrations-table-header-company { flex: 1.2; min-width: 100px; }
  .registrations-table-header-contact { flex: 1; min-width: 80px; }
  .registrations-table-header-email { flex: 1.2; min-width: 100px; }
  .registrations-table-header-phone { flex: 0.8; min-width: 70px; }
  .registrations-table-header-ic { flex: 0.8; min-width: 80px; }
  .registrations-table-header-status { flex: 0.8; min-width: 80px; text-align: center; }
  .registrations-table-header-actions { flex: 0.8; min-width: 80px; justify-content: flex-end; }

  .registrations-table-cell.company { flex: 1.2; min-width: 100px; font-weight: 500; font-size: 0.85rem; }
  .registrations-table-cell.contact { flex: 1; min-width: 80px; }
  .registrations-table-cell.email { flex: 1.2; min-width: 100px; font-size: 0.8rem; }
  .registrations-table-cell.phone { flex: 0.8; min-width: 70px; }
  .registrations-table-cell.ic { flex: 0.8; min-width: 80px; font-family: monospace; font-size: 0.8rem; }
  .registrations-table-cell.status { flex: 0.8; min-width: 80px; justify-content: center; }
  .registrations-table-cell.actions { flex: 0.8; min-width: 80px; justify-content: flex-end; gap: 0.25rem; }

  .rejection-notes-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .rejection-notes-section h4 {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text);
  }

  .rejection-note {
    display: flex;
    gap: 0.5rem;
    padding: 0.3rem 0.5rem;
    background: #fef2f2;
    border-radius: var(--radius-sm);
    border-left: 3px solid #dc2626;
    margin-bottom: 0.25rem;
    font-size: 0.8rem;
    flex-wrap: wrap;
  }

  .rejection-company { font-weight: 600; }
  .rejection-reason { color: var(--text-secondary); flex: 1; }
  .rejection-count { color: var(--text-tertiary); font-size: 0.7rem; }

  /* ============================================ */
  /* COMPANIES TABLE - Super Admin Only           */
  /* ============================================ */
  .companies-table-wrapper {
    overflow-x: auto;
    margin-top: 0.5rem;
  }

  .companies-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .companies-table thead {
    background: var(--background);
    border-bottom: 2px solid var(--border);
  }

  .companies-table th {
    padding: 0.6rem 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .companies-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border-light);
    vertical-align: middle;
    color: var(--text);
    font-size: 0.85rem;
  }

  .companies-table tr:hover td {
    background: var(--background);
  }

  .companies-table code {
    background: var(--background);
    padding: 0.05rem 0.4rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-family: monospace;
  }

  .count-badge {
    display: inline-block;
    background: var(--primary);
    color: white;
    padding: 0.05rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
  }

  .text-muted {
    color: var(--text-tertiary);
  }

  .subscription-info {
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .sub-label {
    color: var(--text-tertiary);
    font-size: 0.65rem;
    font-weight: 500;
  }

  /* ============================================ */
  /* MENU MANAGEMENT - Recipe Tags                */
  /* ============================================ */
  .recipe-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
  }

  .recipe-tag {
    display: inline-block;
    background: var(--background);
    padding: 0.05rem 0.4rem;
    border-radius: 10px;
    font-size: 0.6rem;
    border: 1px solid var(--border-light);
    white-space: nowrap;
  }

  /* ============================================ */
  /* IMAGE UPLOAD                                */
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
  /* RECIPE SECTION                              */
  /* ============================================ */
  .recipe-section {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    margin-top: 0.5rem;
  }

  .recipe-hint {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.75rem;
    font-style: italic;
  }

  .recipe-row {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
    margin-bottom: 0.75rem;
    padding: 0.5rem;
    background: #ffffff;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }

  .recipe-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .recipe-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .recipe-input {
    padding: 0.4rem 0.6rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.85rem;
    width: 100%;
    background: #ffffff;
    color: #1e293b;
    transition: all 0.3s ease;
  }

  .recipe-input:focus {
    outline: none;
    border-color: #F94908;
    box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.08);
  }

  .recipe-input-small {
    padding: 0.4rem 0.6rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.85rem;
    width: 80px;
    background: #ffffff;
    color: #1e293b;
    transition: all 0.3s ease;
  }

  .recipe-input-small:focus {
    outline: none;
    border-color: #F94908;
    box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.08);
  }

  .add-recipe-btn {
    margin-top: 0.5rem;
    width: 100%;
    justify-content: center;
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

  .btn-icon-sm:hover { background: var(--background); }
  .btn-icon-sm.danger { color: #ef4444; }
  .btn-icon-sm.danger:hover { background: #fee2e2; }

  /* ============================================ */
  /* STALL PERFORMANCE - Name + Code              */
  /* ============================================ */
  .stall-name-text {
    font-weight: 500;
    font-size: 0.85rem;
    color: var(--text);
  }

  .stall-code-text {
    font-size: 0.6rem;
    color: var(--text-tertiary);
    font-family: monospace;
    display: block;
  }

  /* ============================================ */
  /* PERFORMANCE TABLE - FIX OVERFLOW            */
  /* ============================================ */
  .performance-table-wrapper {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
  }

  .performance-table-header {
    display: flex;
    padding: 0.5rem 0.75rem;
    background: var(--background);
    border-bottom: 1px solid var(--border);
    font-weight: 600;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: var(--text-secondary);
    min-width: 480px;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .performance-table-header-rank { 
    min-width: 45px; 
    text-align: center; 
    cursor: pointer; 
    flex-shrink: 0;
  }
  .performance-table-header-name { 
    flex: 1.5; 
    text-align: left; 
    cursor: pointer; 
    min-width: 80px;
  }
  .performance-table-header-revenue { 
    min-width: 80px; 
    text-align: right; 
    cursor: pointer; 
    flex-shrink: 0;
  }
  .performance-table-header-status { 
    min-width: 90px; 
    text-align: center; 
    cursor: pointer; 
    flex-shrink: 0;
  }
  .performance-table-header-details { 
    min-width: 40px; 
    text-align: center; 
    flex-shrink: 0;
  }

  /* ===== FIXED: Menu Management Mobile ===== */
  @media (max-width: 768px) {
    /* Menu management - show labels on mobile */
    .inventory-table-row .inventory-table-cell.name::before {
      content: "Item Name: ";
      font-weight: 600;
      font-size: 0.7rem;
      color: var(--text-secondary);
      min-width: 60px;
      flex-shrink: 0;
    }
    
    .inventory-table-row .inventory-table-cell.price::before {
      content: "Price: ";
      font-weight: 600;
      font-size: 0.7rem;
      color: var(--text-secondary);
      min-width: 60px;
      flex-shrink: 0;
    }
    
    .inventory-table-row .inventory-table-cell.category::before {
      content: "Category: ";
      font-weight: 600;
      font-size: 0.7rem;
      color: var(--text-secondary);
      min-width: 60px;
      flex-shrink: 0;
    }
    
    .inventory-table-row .inventory-table-cell.recipe::before {
      content: "Recipe: ";
      font-weight: 600;
      font-size: 0.7rem;
      color: var(--text-secondary);
      min-width: 60px;
      flex-shrink: 0;
    }
    
    .inventory-table-row .inventory-table-cell.actions::before {
      content: "Actions: ";
      font-weight: 600;
      font-size: 0.7rem;
      color: var(--text-secondary);
      min-width: 60px;
      flex-shrink: 0;
    }
    
    /* Performance table mobile */
    .performance-table-header {
      display: none;
    }
    
    .performance-table-row {
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
    
    .performance-table-row > span {
      display: flex !important;
      justify-content: space-between !important;
      width: 100% !important;
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
    
    .performance-table-row > span {
      text-align: right;
    }
    
    /* Revenue Table - Mobile alignment */
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
    
    .revenue-table-row > span {
      text-align: right;
    }
    
    /* Registrations mobile */
    .registrations-table-header {
      display: none;
    }
    
    .registrations-table-row {
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
    
    .registrations-table-cell {
      display: flex;
      align-items: center;
      padding: 0.2rem 0;
      width: 100%;
    }
    
    .registrations-table-cell::before {
      content: attr(data-label);
      font-weight: 600;
      font-size: 0.6rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      min-width: 60px;
      flex-shrink: 0;
    }
    
    .registrations-table-cell.actions {
      justify-content: flex-start;
      padding-top: 0.3rem;
      border-top: 1px solid var(--border-light);
      margin-top: 0.3rem;
    }
    
    /* Controls row mobile */
    .controls-row {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
    
    .action-buttons {
      margin-left: 0;
      justify-content: center;
    }
    
    /* Recipe section mobile */
    .recipe-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .recipe-input-small {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .action-buttons {
      flex-direction: row;
      width: 100%;
    }
    
    .header-action-btn {
      flex: 1;
      justify-content: center;
    }
    
    .recipe-section {
      padding: 0.75rem;
    }
    
    .image-upload-area {
      min-height: 80px;
      padding: 0.75rem;
    }
  }
  </style>