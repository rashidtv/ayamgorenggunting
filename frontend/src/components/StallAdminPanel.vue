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

        <!-- Action Buttons -->
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
      
      <!-- ===== DASHBOARD TAB ===== -->
      <div v-if="activeTab === 'dashboard'" class="tab-panel">
        
        <!-- Stats Cards -->
        <div class="stats-grid">
          <!-- My Stalls - Clickable to Stalls Tab -->
          <div class="stat-card glass clickable" style="--stat-color: #2563eb; --stat-color-alpha: rgba(37, 99, 235, 0.15);" @click="switchTab('stalls')">
            <div class="stat-icon">🏪</div>
            <div class="stat-content">
              <span class="stat-number">{{ stalls.length }}</span>
              <span class="stat-label">My Stalls</span>
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
          
          <!-- My Users - Clickable to Users Tab -->
          <div class="stat-card glass clickable" style="--stat-color: #7c3aed; --stat-color-alpha: rgba(124, 58, 237, 0.15);" @click="switchTab('users')">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <span class="stat-number">{{ users.length }}</span>
              <span class="stat-label">My Users</span>
            </div>
            <div class="stat-trend up">↑ 8%</div>
            <div class="stat-hover">Click to view →</div>
          </div>
          
          <!-- My Menu - Clickable to Menu Assignment -->
          <div class="stat-card glass clickable" style="--stat-color: #f59e0b; --stat-color-alpha: rgba(245, 158, 11, 0.15);" @click="switchTabWithSubTab('menu', 'assignment')">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <span class="stat-number">{{ menuItems.length }}</span>
              <span class="stat-label">My Menu</span>
              <div class="stat-breakdown">
                <span class="stat-breakdown-item active">● {{ menuItems.filter(item => item.price > 0).length }} Active</span>
              </div>
              <span class="stat-sub-label">{{ menuItems.length }} Total Items</span>
            </div>
            <div class="stat-trend neutral">📋</div>
            <div class="stat-hover">Click to manage →</div>
          </div>
          
          <!-- Low Stock Alert - Clickable to Inventory -->
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

        <!-- KPI Cards with Sparkline -->
        <div class="kpi-grid">
          <!-- Revenue -->
          <div class="kpi-card" style="--kpi-color: #F94908; --kpi-color-alpha: rgba(249, 73, 8, 0.08);">
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
          </div>

          <!-- Menu Sold - Clickable to Menu Performance -->
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

          <!-- Average per Stall -->
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

          <!-- Top Stall - Clickable to Stall Performance -->
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
            <!-- Stats Row - Simplified -->
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
            <!-- ✅ Show empty state when no period sales -->
            <div v-if="dashboardDisplayStalls.length === 0" class="empty-state-modern">
              <span>📊</span>
              <p>No stall sales for {{ getPeriodLabel() }}</p>
              <p style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                Try selecting a different period
              </p>
            </div>
            
            <div v-else class="stall-table-wrapper">
              <!-- Table Headers -->
              <div class="stall-table-header">
                <span class="stall-table-header-rank">Rank</span>
                <span class="stall-table-header-name">Stall</span>
                <span class="stall-table-header-revenue">Revenue</span>
                <span class="stall-table-header-status">Status</span>
                <span class="stall-table-header-details">Details</span>
              </div>
              
              <!-- Table Rows -->
              <div class="stall-table-body">
                <div 
                  v-for="(stall, index) in dashboardDisplayStalls" 
                  :key="stall.id" 
                  class="stall-table-row clickable-item"
                  @click="viewStallDetails(stall)"
                >
                  <!-- Rank -->
                  <span class="stall-table-rank">
                    <span class="rank-number" :class="getRankClass(index)">
                      {{ index + 1 }}
                    </span>
                  </span>
                  
                  <!-- Stall Name + Bar -->
                  <span class="stall-table-name">
                    <span class="stall-name-text">{{ stall.name }}</span>
                    <span class="stall-name-bar">
                      <span class="stall-bar-fill" :style="{ width: getStallBarWidth(stall.revenue) + '%' }"></span>
                    </span>
                  </span>
                  
                  <!-- Revenue -->
                  <span class="stall-table-revenue">{{ formatCurrency(stall.revenue || 0) }}</span>
                  
                  <!-- Status with Color & Emoji -->
                  <span class="stall-table-status">
                    <span :class="['status-indicator', getStallStatusClass(stall)]">
                      {{ getStallStatusEmoji(stall) }} {{ getStallStatus(stall) }}
                    </span>
                  </span>
                  
                  <!-- Details -->
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

      <!-- ===== INVENTORY TAB ===== -->
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
            
            <!-- Stats Cards -->
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

            <!-- Filter Bar -->
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

            <!-- Inventory Table with Pagination -->
            <div v-if="stalls.length === 0" class="empty-state-modern">
              <span>📦</span>
              <p>No stalls found. Contact your administrator.</p>
            </div>

            <div v-else>
              <div class="inventory-table-wrapper">
                <!-- Table Header -->
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

                <!-- Table Rows - Paginated -->
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
                    <!-- Show inventory items without pencil button -->
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

              <!-- Pagination Controls -->
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

              <!-- Quick Action Buttons - Simplified -->
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
             
            </div> <!-- ← THIS CLOSES THE v-else div -->
          </div> <!-- ← THIS CLOSES card-modern-body -->
        </div> <!-- ← THIS CLOSES card-modern -->
      </div> <!-- ← THIS CLOSES inventory tab-panel -->

      <!-- ===== QUICK UPDATE MODAL ===== -->
      <div v-if="quickUpdateModal" class="modal-overlay" @click.self="quickUpdateModal=false">
        <div class="modal-modern modal-sm">
          <div class="modal-modern-header">
            <h3>⚡ Quick Update: {{ quickUpdateStallName }}</h3>
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
                    @click="quickUpdateItemSave(stallId, item.material_name, item.newLevel)" 
                    class="btn-modern primary small"
                  >
                    Save
                  </button>
                  <button 
                    @click="quickUpdateItemAdd(stallId, item.material_name, 5)" 
                    class="btn-modern secondary small"
                  >
                    +5
                  </button>
                  <button 
                    @click="quickUpdateItemAdd(stallId, item.material_name, 1)" 
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

      <!-- ===== BULK UPDATE MODAL ===== -->
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

            <!-- Preview -->
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

            <!-- Material Update -->
            <div class="bulk-materials">
              <h4>Update Materials</h4>
              
              <!-- Quick Actions -->
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

              <!-- Material Grid -->
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

      <!-- ===== STALLS TAB ===== -->
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
        </div>
        
        <!-- Stall Management -->
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
              <!-- Stats Cards -->
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

              <!-- Filter Bar - Like Inventory -->
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

              <!-- Bulk Action Buttons -->
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

              <!-- Stall List with Pagination -->
              <div v-if="filteredStallsList.length === 0" class="empty-state-modern">
                <span>🏪</span>
                <p>No stalls found matching your filters</p>
              </div>

              <div v-else>
                <div class="inventory-table-wrapper">
                  <!-- Table Header -->
                  <div class="inventory-table-header">
                    <div class="inventory-table-cell checkbox">
                      <input type="checkbox" v-model="selectAllStalls" @change="toggleSelectAllStalls" />
                    </div>
                    <div class="inventory-table-cell name">Stall</div>
                    <div class="inventory-table-cell state">State</div>
                    <div class="inventory-table-cell status">Status</div>
                    <div class="inventory-table-cell actions">Actions</div>
                  </div>

                  <!-- Table Rows - Paginated -->
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

                <!-- Pagination Controls -->
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
        
        <!-- Stall Performance - Full List -->
        <div v-else-if="stallSubTab === 'performance'" class="sub-tab-content">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>📊 Stall Performance</h3>
                <span class="card-subtitle">All stalls ranked by total revenue (all-time)</span>
              </div>
              <div class="header-actions">
                <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
                <button @click="switchTab('dashboard')" class="btn-back">← Back to Dashboard</button>
              </div>
            </div>
            
            <div class="card-modern-body">
              
              <!-- Stats Cards -->
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

              <!-- Filter Bar -->
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

              <!-- Performance Table with Pagination -->
              <div v-if="filteredPerformanceList.length === 0" class="empty-state-modern">
                <span>📊</span>
                <p>No stalls found matching your criteria</p>
                <button @click="clearPerformanceFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
                  Clear Filters
                </button>
              </div>

              <div v-else>
                <div class="performance-table-wrapper">
                  <!-- Table Header with Sort -->
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
                      <!-- Rank -->
                      <span class="performance-table-rank">
                        <span class="rank-number" :class="getRankClass(index)">
                          {{ index + 1 }}
                        </span>
                      </span>
                      
                      <!-- Stall Name + Bar -->
                      <span class="performance-table-name">
                        <span class="stall-name-text">{{ stall.name }}</span>
                        <span class="stall-name-bar">
                          <span class="stall-bar-fill" :style="{ width: getStallBarWidth(stall.revenue) + '%' }"></span>
                        </span>
                      </span>
                      
                      <!-- Revenue -->
                      <span class="performance-table-revenue">{{ formatCurrency(stall.revenue || 0) }}</span>
                      
                      <!-- Status with Color & Emoji -->
                      <span class="performance-table-status">
                        <span :class="['status-indicator', getPerformanceStatusClass(stall)]">
                          {{ getPerformanceStatusEmoji(stall) }} {{ getPerformanceStatusText(stall) }}
                        </span>
                      </span>
                      
                      <!-- Details -->
                      <span class="performance-table-details">👆</span>
                    </div>
                  </div>
                </div>

                <!-- Pagination Controls -->
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
              </div> <!-- ✅ THIS CLOSES THE v-else div -->
            </div> <!-- ✅ THIS CLOSES card-modern-body -->
          </div> <!-- ✅ THIS CLOSES card-modern -->
        </div> <!-- ✅ THIS CLOSES sub-tab-content -->
      </div> <!-- ← THIS CLOSES THE STALLS TAB PANEL -->

      <!-- ===== USERS TAB ===== -->
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
            
            <!-- Stats Cards -->
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

            <!-- Filter Bar -->
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

            <!-- Bulk Action Buttons -->
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

            <!-- User Table with Pagination -->
            <div v-if="filteredUsersList.length === 0" class="empty-state-modern">
              <span>👥</span>
              <p>No users found matching your criteria</p>
              <button @click="clearUserFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
                Clear Filters
              </button>
            </div>

            <div v-else>
              <div class="users-table-wrapper">
                <!-- Table Header -->
                <div class="users-table-header">
                  <div class="users-table-cell checkbox">
                    <input type="checkbox" v-model="selectAllUsers" @change="toggleSelectAllUsers" />
                  </div>
                  <div class="users-table-cell username">Username</div>
                  <div class="users-table-cell fullname">Full Name</div>
                  <div class="users-table-cell role">Role</div>
                  <div class="users-table-cell stalls">Assigned Stalls</div>
                  <div class="users-table-cell status">Status</div>
                  <div class="users-table-cell actions">Actions</div>
                </div>

                <!-- Table Rows - Paginated -->
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
                  <div class="users-table-cell status">
                    <span :class="['status-badge', user.is_active !== false ? 'active' : 'inactive']">
                      {{ user.is_active !== false ? '🟢 Active' : '⚪ Inactive' }}
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

              <!-- Pagination Controls -->
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

<!-- ===== MENU TAB ===== -->
<div v-if="activeTab === 'menu'" class="tab-panel">
  <div class="sub-tabs">
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
  
  <!-- ========================================== -->
  <!-- MENU ASSIGNMENT SUB-TAB                    -->
  <!-- ========================================== -->
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
          <button @click="loadMenuAssignments" class="btn-modern secondary small">⟳ Refresh</button>
        </div>
      </div>
      <div class="card-modern-body">
        
        <!-- Stats Cards -->
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

        <!-- ===== STALL VIEW TOGGLE ===== -->
        <div class="stall-view-toggle" style="margin-bottom: 1rem;">
          <button 
            class="btn-modern secondary small" 
            :class="{ active: showStallMenuView }"
            @click="showStallMenuView = !showStallMenuView"
          >
            {{ showStallMenuView ? '📋 Hide Stall View' : '🏪 Show Stall Menu View' }}
          </button>
        </div>

        <!-- ===== STALL MENU VIEW ===== -->
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

        <!-- ===== MODE TOGGLE ===== -->
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

        <!-- ========================================== -->
        <!-- SINGLE STALL MODE (EXISTING)              -->
        <!-- ========================================== -->
        <div v-if="assignMode === 'single'" class="assign-mode-content">
          <!-- Filter Bar -->
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

          <!-- Stall Selection (Single Stall) -->
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
            
            <!-- Single Stall Assign Button -->
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

              <!-- Pagination Controls -->
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

        <!-- ========================================== -->
        <!-- BULK ASSIGN MODE (NEW)                     -->
        <!-- ========================================== -->
        <div v-if="assignMode === 'bulk'" class="assign-mode-content bulk-mode">
          
          <!-- Step 1: Select Stalls -->
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

          <!-- Step 2: Select Menus -->
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

          <!-- Step 3: Execute -->
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
  
  <!-- ========================================== -->
  <!-- MENU PERFORMANCE SUB-TAB                   -->
  <!-- ========================================== -->
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
        
        <!-- Stats Cards - Overview -->
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

        <!-- Status Breakdown Cards -->
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

        <!-- Filter Bar -->
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

        <!-- Performance Table with Pagination -->
        <div v-if="filteredMenuPerformance.length === 0" class="empty-state-modern">
          <span>📊</span>
          <p>No sales data available for {{ getPeriodLabel() }}</p>
          <button @click="clearMenuPerformanceFilters" class="btn-modern primary small" style="margin-top: 0.5rem;">
            Clear Filters
          </button>
        </div>

        <div v-else>
          <div class="performance-table-wrapper">
            <!-- Table Header with Sort -->
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
                <span class="performance-table-rank">
                  <span class="rank-number" :class="getRankClass(index)">
                    {{ index + 1 }}
                  </span>
                </span>
                
                <span class="performance-table-name">
                  <span class="menu-name-text">{{ item.name }}</span>
                  <span class="menu-name-bar">
                    <span class="menu-bar-fill" :style="{ width: getPerformancePercentage(item.quantity) + '%' }"></span>
                  </span>
                </span>
                
                <span class="performance-table-revenue">{{ formatCurrency(item.revenue || 0) }}</span>
                
                <span class="performance-table-status">
                  <span :class="['status-indicator', getMenuStatusClass(item.quantity)]">
                    {{ getMenuStatusEmoji(item.quantity) }} {{ getMenuStatus(item.quantity) }}
                  </span>
                </span>
                
                <span class="performance-table-details">👆</span>
              </div>
            </div>
          </div>

          <!-- Pagination Controls -->
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
<!-- BULK ASSIGN TO STALLS MODAL                -->
<!-- ========================================== -->
<div v-if="bulkAssignModal" class="modal-overlay" @click.self="bulkAssignModal=false">
  <div class="modal-modern modal-lg">
    <div class="modal-modern-header">
      <h3>📦 Bulk Assign Menus to Stalls</h3>
      <button @click="bulkAssignModal=false" class="modal-close-btn">✕</button>
    </div>
    <div class="modal-modern-body">
      <!-- Summary -->
      <div class="bulk-assign-summary">
        <p>📋 <strong>{{ selectedMenuItems.length }}</strong> menu item(s) selected</p>
        <p>🏪 <strong>{{ bulkAssignStalls.length }}</strong> stall(s) selected</p>
        <p class="bulk-assign-total">
          Total: <strong>{{ selectedMenuItems.length * bulkAssignStalls.length }}</strong> assignments
        </p>
      </div>

      <!-- Stall Selection -->
      <div class="bulk-assign-stalls">
        <div class="bulk-assign-header">
          <label class="bulk-assign-select-all">
            <input type="checkbox" v-model="selectAllBulkStalls" @change="toggleAllBulkStalls" />
            <strong>Select All Stalls</strong>
          </label>
          <span class="bulk-assign-count">{{ bulkAssignStalls.length }} / {{ stalls.length }} selected</span>
        </div>
        
        <div class="bulk-assign-stall-list">
          <label v-for="stall in stalls" :key="stall.id" class="bulk-assign-stall-item">
            <input 
              type="checkbox" 
              :value="stall.id"
              v-model="bulkAssignStalls"
            />
            <span class="stall-name">{{ stall.name }}</span>
            <span class="stall-code">{{ stall.code }}</span>
            <span :class="['stall-status', stall.is_active ? 'active' : 'inactive']">
              {{ stall.is_active ? '🟢' : '⚪' }}
            </span>
          </label>
        </div>
      </div>
    </div>
    <div class="modal-modern-footer">
      <button @click="bulkAssignModal=false" class="btn-modern secondary">Cancel</button>
      <button 
        @click="executeBulkAssign" 
        class="btn-modern primary"
        :disabled="bulkAssignStalls.length === 0 || bulkAssignLoading"
      >
        {{ bulkAssignLoading ? 'Assigning...' : `📦 Assign to ${bulkAssignStalls.length} Stall(s)` }}
      </button>
    </div>
  </div>
</div>

<!-- ===== REVENUE TAB ===== -->
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
      
      <!-- Stats Cards -->
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

      <!-- Filter Bar -->
      <div class="filter-bar-modern">
        <div class="filter-group">
          <select v-model="revenuePeriod" class="filter-select" @change="loadRevenueData">
            <option v-for="p in revenuePeriods" :key="p.value" :value="p.value">
              {{ p.label }}
            </option>
          </select>
        </div>
        
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

      <!-- Revenue Charts -->
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

      <!-- Revenue Table -->
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
            <span class="revenue-table-rank sortable" @click="sortRevenue('rank')">
              Rank <span class="sort-arrow">{{ getRevenueSortArrow('rank') }}</span>
            </span>
            <span class="revenue-table-name sortable" @click="sortRevenue('name')">
              Stall <span class="sort-arrow">{{ getRevenueSortArrow('name') }}</span>
            </span>
            <span class="revenue-table-state sortable" @click="sortRevenue('state')">
              State <span class="sort-arrow">{{ getRevenueSortArrow('state') }}</span>
            </span>
            <span class="revenue-table-revenue sortable" @click="sortRevenue('revenue')">
              Revenue <span class="sort-arrow">{{ getRevenueSortArrow('revenue') }}</span>
            </span>
            <span class="revenue-table-transactions sortable" @click="sortRevenue('transactions')">
              Transactions <span class="sort-arrow">{{ getRevenueSortArrow('transactions') }}</span>
            </span>
            <span class="revenue-table-avg sortable" @click="sortRevenue('avg')">
              Avg <span class="sort-arrow">{{ getRevenueSortArrow('avg') }}</span>
            </span>
            <span class="revenue-table-status">Status</span>
            <span class="revenue-table-details">Details</span>
          </div>
          
          <div class="revenue-table-body">
            <div 
              v-for="(item, index) in paginatedRevenueData" 
              :key="item.id" 
              class="revenue-table-row clickable-item"
              @click="viewRevenueStallDetails(item)"
            >
              <span class="revenue-table-rank">
                <span class="rank-number" :class="getRankClass(index)">
                  {{ index + 1 }}
                </span>
              </span>
              
              <span class="revenue-table-name">
                <span class="stall-name-text">{{ item.name }}</span>
                <span class="stall-code-text">{{ item.code }}</span>
              </span>
              
              <span class="revenue-table-state">
                <span class="state-tag">{{ item.state || '-' }}</span>
              </span>
              
              <span class="revenue-table-revenue">
                {{ formatCurrency(item.revenue || 0) }}
              </span>
              
              <span class="revenue-table-transactions">
                {{ formatNumber(item.transactions || 0) }}
              </span>
              
              <span class="revenue-table-avg">
                {{ formatCurrency(item.avgTransaction || 0) }}
              </span>
              
              <span class="revenue-table-status">
                <span :class="['status-indicator', getRevenueStatusClass(item)]">
                  {{ getRevenueStatusEmoji(item) }} {{ getRevenueStatusText(item) }}
                </span>
              </span>
              
              <span class="revenue-table-details">👆</span>
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

      <!-- ============================================ -->
      <!-- MODALS                                       -->
      <!-- ============================================ -->
      
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
              <div class="stall-breakdown-title">
                🏆 Top Selling Stalls
              </div>
              
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
            
            <div v-else-if="selectedMenuItem?.stallBreakdown?.length === 0" class="empty-state-modern">
              <span>📊</span>
              <p>No stall sales data available for this menu item</p>
            </div>
          </div>
          <div class="modal-modern-footer">
            <button @click="closeMenuDetailModal" class="btn-modern secondary">Close</button>
          </div>
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
      activeTab: 'dashboard',
      tabs: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'stalls', label: 'Stalls', icon: '🏪' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'menu', label: 'Menu', icon: '📋' },
        { id: 'revenue', label: 'Revenue', icon: '💰' }
      ],

       // ===== REVENUE TAB DATA =====
    revenuePeriod: 'week',
    revenueStateFilter: 'All States',
    revenueStallFilter: 'all',
    revenueMinAmount: 0,
    revenueSearch: '',
    revenuePage: 1,
    revenueItemsPerPage: 10,
    revenueSortBy: 'revenue',
    revenueSortOrder: 'desc',
    revenueData: [],
    revenueChartInstance: null,
    revenueStateChartInstance: null,
    revenueLoading: false,
    
    revenuePeriods: [
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'quarter', label: 'Quarter' },
      { value: 'halfyear', label: 'Half Year' },
      { value: 'year', label: 'Year' },
      { value: 'custom', label: 'Custom Range' }
    ],
    
    revenueCustomStart: null,
    revenueCustomEnd: null,
    revenueCustomDays: 30,

      showStallMenuView: false,
    loadingStallMenus: false,
    stallMenuAssignments: [],
    expandedStallMenus: [],

      // Mode toggle
      assignMode: 'single', // 'single' or 'bulk'
      
      // Bulk assign to multiple stalls
      selectedStallsForAssign: [],
      selectAllStallsForAssign: false,
      selectedMenuItemsForBulk: [],
      selectAllMenusForBulk: false,
      bulkMenuSearch: '',
      bulkAssignToStallsLoading: false,
      bulkAssignMessage: '',
      bulkAssignMessageType: 'success',

      // Menu Tab Data
      menuSearch: '',
      menuCategoryFilter: 'all',
      menuStateFilter: 'All States',
      menuCurrentPage: 1,
      menuItemsPerPage: 10,
      selectedMenuItems: [],
      selectAllMenuItems: false,
      
      // Menu Performance Data
      menuPerformancePage: 1,
      menuPerformancePerPage: 10,
      menuPerformanceCategoryFilter: 'all',
      menuPerformanceStateFilter: 'All States',
      menuPerformanceSortBy: 'rank',
      menuPerformanceSortOrder: 'desc',

      userStateFilter: 'All States',
      stallPerformancePeriod: [],
      userCurrentPage: 1,
      userItemsPerPage: 10,
      selectedUsers: [],
      selectAllUsers: false,
      currentUserId: null,
      performanceSearch: '',
      performanceStateFilter: 'All States',
      performanceStatusFilter: 'all',
      performancePage: 1,
      performanceSortBy: 'rank',
      performanceSortOrder: 'asc',
      _stallCurrentPage: 1,
      currentPage: 1,
      currentStallPage: 1,
      selectAllStalls: false,
      itemsPerPage: 10,
      selectedStalls: [],
      selectAll: false,
      quickUpdateModal: false,
      quickUpdateStallId: null,
      quickUpdateStallName: '',
      quickUpdateItems: [],

      malaysiaStates: [
        'All States', 'Selangor', 'Kuala Lumpur', 'Putrajaya',
        'Johor', 'Kedah', 'Kelantan', 'Melaka', 
        'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
        'Penang', 'Sabah', 'Sarawak', 'Terengganu', 'Labuan'
      ],
      stateFilter: 'All States',
      
      bulkUpdateModal: false,
      bulkUpdateMaterials: [],
      bulkUpdateMode: 'selected',
      bulkUpdateProgress: 0,
      bulkUpdating: false,
      bulkUpdateType: 'set',
      bulkUpdateValue: 10,
      
      quickActions: [
        { label: 'Set to Alert Level', value: 'alert' },
        { label: 'Set to 100', value: '100' },
        { label: 'Set to 50', value: '50' },
        { label: 'Add +10', value: 'add10' },
        { label: 'Add +20', value: 'add20' },
        { label: 'Reset to 0', value: '0' }
      ],
    
      chartFullscreen: false,
      chartOffset: 0,
      chartWindow: 7,
      chartInstance: null,
      isChartInitialized: false,
      stallSubTab: 'management',
      menuSubTab: 'assignment',
      
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
        { value: 'halfyear', label: 'Half Year' },
        { value: 'year', label: 'Year' },
        { value: 'custom', label: 'Custom Range' }
      ],
      
      customDateStart: null,
      customDateEnd: null,
      customDays: 30,
      
      stallDetailModal: false,
      selectedStall: null,
      menuDetailModal: false,
      selectedMenuItem: null,
      stallDetailChartInstance: null,
      
      showAllStalls: false,
      showAllMenuItems: false,
      
      expandedInventoryStall: null,
      stallInventory: {},
      inventory: [],
      inventorySearch: '',
      inventoryFilter: 'all',
      
      stallSearch: '',
      stallStatusFilter: 'all',
      
      userSearch: '',
      userRoleFilter: 'all',
      
      userModal: false,
      editingUser: false,
      userForm: { username: '', password: '', full_name: '', role: 'stall_admin', stall_ids: [] },
      stallModal: false,
      editingStall: false,
      stallForm: { id: null, name: '', code: '', location: '' },
      
      exporting: false,
      resizeObserver: null,

      selectedAssignmentStall: null,
      menuAssignments: {},
      originalMenuAssignments: {},
      loadingMenuAssignments: false,
      savingAssignment: false,
      savedAssignmentMessage: '',
      savedAssignmentType: 'success'
    }
  },

  computed: {

      // ===== REVENUE COMPUTED =====
  getRevenuePeriodLabel() {
    const p = this.revenuePeriods.find(p => p.value === this.revenuePeriod)
    if (this.revenuePeriod === 'custom') {
      return `Custom (${this.revenueCustomDays} days)`
    }
    return p ? p.label : 'Week'
  },

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
    
    if (this.revenueMinAmount > 0) {
      data = data.filter(item => (item.revenue || 0) >= this.revenueMinAmount)
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

    // ===== BULK ASSIGN COMPUTED =====
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

    // ===== MENU PERFORMANCE BREAKDOWN =====
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

    // ===== MENU ASSIGNMENT COMPUTED =====
    menuStats() {
      const total = this.menuItems.length
      const active = this.menuItems.filter(item => item.price > 0).length
      const inactive = total - active
      
      return {
        total,
        active,
        inactive
      }
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
      return Math.ceil(this.filteredMenuItemsForAssignment.length / this.menuItemsPerPage) || 1
    },

    menuStartIndex() {
      if (this.filteredMenuItemsForAssignment.length === 0) return 0
      return (this.menuCurrentPage - 1) * this.menuItemsPerPage + 1
    },

    menuEndIndex() {
      if (this.filteredMenuItemsForAssignment.length === 0) return 0
      return Math.min(this.menuCurrentPage * this.menuItemsPerPage, this.filteredMenuItemsForAssignment.length)
    },

    selectedMenuItemsCount() {
      return this.selectedMenuItems.length
    },

    // ===== MENU PERFORMANCE COMPUTED =====
    menuPerformanceStats() {
      const totalItems = this.menuPerformance.length
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
        totalItems,
        totalRevenue,
        topItemName: topItem?.name || '-',
        topItemRevenue: maxRevenue || 0
      }
    },

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

    menuCategories() {
      const categories = new Set()
      this.menuItems.forEach(item => {
        if (item.category) {
          categories.add(item.category)
        }
      })
      return ['all', ...Array.from(categories)]
    },

    // ===== USERS COMPUTED =====
    userStats() {
      const users = this.users.filter(u => 
        u.role !== 'super_admin' && u.role !== 'super_super_admin'
      )
      
      let total = users.length
      let admins = users.filter(u => u.role === 'stall_admin').length
      let cashiers = users.filter(u => u.role === 'cashier').length
      let active = users.filter(u => u.is_active !== false).length
      let inactive = users.filter(u => u.is_active === false).length
      
      return {
        total,
        admins,
        cashiers,
        active,
        inactive
      }
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

    dashboardDisplayStalls() {
      const stallsWithSales = this.stallPerformancePeriod.filter(stall => 
        (stall.revenue || 0) > 0
      )
      if (this.showAllStalls) {
        return stallsWithSales
      }
      return stallsWithSales.slice(0, 5)
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

    filteredPerformanceList() {
      let list = this.stallPerformance.filter(stall => {
        const search = this.performanceSearch.toLowerCase()
        const matchesSearch = stall.name.toLowerCase().includes(search) ||
                              (stall.code && stall.code.toLowerCase().includes(search))
        
        const stallData = this.stalls.find(s => s.id === stall.id)
        const matchesState = this.performanceStateFilter === 'All States' || 
                             (stallData && stallData.state === this.performanceStateFilter)
        
        const revenue = stall.revenue || 0
        let status = 'no-sales'
        if (revenue === 0) status = 'no-sales'
        else if (revenue > 1000) status = 'excellent'
        else if (revenue > 500) status = 'good'
        else if (revenue > 100) status = 'average'
        else status = 'poor'
        
        const matchesStatus = this.performanceStatusFilter === 'all' || 
                              status === this.performanceStatusFilter
        
        return matchesSearch && matchesState && matchesStatus
      })

      return this.sortPerformanceList(list)
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

    totalPages() {
      return Math.ceil(this.filteredInventoryStalls.length / this.itemsPerPage) || 1
    },
    
    paginatedStalls() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredInventoryStalls.slice(start, end)
    },
    
    startIndex() {
      return (this.currentPage - 1) * this.itemsPerPage + 1
    },
    
    endIndex() {
      return Math.min(this.currentPage * this.itemsPerPage, this.filteredInventoryStalls.length)
    },

    inventoryStats() {
      let lowStock = 0
      
      if (!this.inventory || !Array.isArray(this.inventory) || this.inventory.length === 0) {
        return {
          total: this.stalls.length || 0,
          active: this.stalls.filter(s => s.is_active).length || 0,
          inactive: this.stalls.filter(s => !s.is_active).length || 0,
          lowStock: 0
        }
      }
      
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

    selectedCount() {
      return this.selectedStalls.length
    },

    bulkUpdatePreview() {
      const stalls = this.bulkUpdateMode === 'all' 
        ? this.filteredInventoryStalls 
        : this.filteredInventoryStalls.filter(s => this.selectedStalls.includes(s.id))
      return stalls
    },

    dashboardStallPerformanceSubtitle() {
      const hasPeriodSales = this.stallPerformancePeriod.some(s => (s.revenue || 0) > 0)
      
      if (!hasPeriodSales) {
        return `No sales for ${this.getPeriodLabel()}`
      }
      
      const count = this.dashboardDisplayStalls.length
      if (count === 0) return `No stalls with sales for ${this.getPeriodLabel()}`
      if (count === 1) return `Top stall with sales for ${this.getPeriodLabel()}`
      return `Top ${count} stalls with sales for ${this.getPeriodLabel()}`
    },

    stallPerformanceSubtitle() {
      const count = this.displayStalls.length
      if (count === 0) return 'No stalls with sales (all-time)'
      if (count === 1) return 'Top stall by total revenue (all-time)'
      return `Top ${count} stalls by total revenue (all-time)`
    },

    displayStalls() {
      const stallsWithSales = this.stallPerformance.filter(stall => 
        (stall.revenue || 0) > 0 || (stall.items || 0) > 0
      )
      if (this.showAllStalls) {
        return stallsWithSales
      }
      return stallsWithSales.slice(0, 5)
    },
    
    displayMenuItems() {
      if (this.showAllMenuItems) {
        return this.menuPerformance
      }
      return this.menuPerformance.slice(0, 5)
    },

    lowStockCount() {
      return this.lowStock.length
    },
    
    chartVisibleData() {
      return this.salesTrend.slice(this.chartOffset, this.chartOffset + this.chartWindow)
    },
    
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
    
    filteredLowStock() {
      if (this.inventorySearch) {
        return this.lowStock.filter(item => 
          item.stall_name.toLowerCase().includes(this.inventorySearch.toLowerCase()) ||
          item.material_name.toLowerCase().includes(this.inventorySearch.toLowerCase())
        )
      }
      return this.lowStock
    },
    
    // ===== STALL MANAGEMENT COMPUTED PROPERTIES =====
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

    selectedStallsCount() {
      return this.selectedStalls.length
    },

    stallTotalPages() {
      if (!this.filteredStallsList || this.filteredStallsList.length === 0) {
        return 1
      }
      return Math.ceil(this.filteredStallsList.length / this.itemsPerPage) || 1
    },

    stallStartIndex() {
      if (!this.filteredStallsList || this.filteredStallsList.length === 0) {
        return 0
      }
      const start = (this.stallCurrentPage - 1) * this.itemsPerPage + 1
      return Math.min(start, this.filteredStallsList.length)
    },

    stallCurrentPage: {
      get() {
        return this._stallCurrentPage || 1
      },
      set(val) {
        this._stallCurrentPage = val
      }
    },

    stallEndIndex() {
      if (!this.filteredStallsList || this.filteredStallsList.length === 0) {
        return 0
      }
      const end = Math.min(this.stallCurrentPage * this.itemsPerPage, this.filteredStallsList.length)
      return end
    },

    filteredStallsList() {
      if (!this.stalls || this.stalls.length === 0) {
        return []
      }
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
    
    paginatedStallsList() {
      if (!this.filteredStallsList || this.filteredStallsList.length === 0) {
        return []
      }
      const start = (this.stallCurrentPage - 1) * this.itemsPerPage
      const end = Math.min(start + this.itemsPerPage, this.filteredStallsList.length)
      return this.filteredStallsList.slice(start, end)
    },
    
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
      revenuePeriod(newVal, oldVal) {
    if (newVal !== oldVal) {
      if (newVal === 'custom') {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 30)
        this.revenueCustomStart = start.toISOString().split('T')[0]
        this.revenueCustomEnd = end.toISOString().split('T')[0]
      }
      this.loadRevenueData()
    }
  },

    selectedPeriod(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.stallPerformance = []
        this.menuPerformance = []
        this.salesTrend = []
        this.consolidatedSales.topStall = '-'
        this.consolidatedSales.topRevenue = 0
        this.consolidatedSales.totalRevenue = 0
        this.consolidatedSales.totalItems = 0
        this.refreshAllData()
      }
    },
    inventorySearch() {
      this.resetPagination()
    },
    stateFilter() {
      this.resetPagination()
    },
    stallStatusFilter() {
      this.resetStallPagination()
    },
    stallSearch() {
      this.resetStallPagination()
    },
    inventoryFilter() {
      this.resetPagination()
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

  methods: {

      // =============================================
  // REVENUE TAB METHODS
  // =============================================

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
      } else if (sortBy === 'avg') {
        valA = a.avgTransaction || 0
        valB = b.avgTransaction || 0
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

  sortRevenue(column) {
    if (this.revenueSortBy === column) {
      this.revenueSortOrder = this.revenueSortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      this.revenueSortBy = column
      this.revenueSortOrder = column === 'rank' || column === 'revenue' || column === 'transactions' || column === 'avg' ? 'desc' : 'asc'
    }
    this.revenuePage = 1
  },

  getRevenueSortArrow(column) {
    if (this.revenueSortBy !== column) return '⇅'
    return this.revenueSortOrder === 'asc' ? '↑' : '↓'
  },

  resetRevenuePagination() {
    this.revenuePage = 1
  },

  prevRevenuePage() {
    if (this.revenuePage > 1) {
      this.revenuePage--
    }
  },

  nextRevenuePage() {
    if (this.revenuePage < this.revenueTotalPages) {
      this.revenuePage++
    }
  },

  clearRevenueFilters() {
    this.revenueStateFilter = 'All States'
    this.revenueStallFilter = 'all'
    this.revenueSearch = ''
    this.revenueMinAmount = 0
    this.revenuePage = 1
    this.revenueSortBy = 'revenue'
    this.revenueSortOrder = 'desc'
  },

  viewRevenueStallDetails(item) {
    this.viewStallDetails(item)
  },

  async refreshRevenueData() {
    await this.loadRevenueData()
  },

  async loadRevenueData() {
    this.revenueLoading = true
    try {
      const days = this.revenuePeriod === 'today' ? 1 :
                   this.revenuePeriod === 'week' ? 7 :
                   this.revenuePeriod === 'month' ? 30 :
                   this.revenuePeriod === 'quarter' ? 90 :
                   this.revenuePeriod === 'halfyear' ? 180 :
                   this.revenuePeriod === 'year' ? 365 :
                   this.revenueCustomDays || 30

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
        this.initRevenueChart()
        this.initRevenueStateChart()
      })

    } catch (err) {
      console.error('Failed to load revenue data:', err)
      this.$emit('show-notification', 'Failed to load revenue data', 'error')
    } finally {
      this.revenueLoading = false
    }
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
            <div style="color:#94a3b8;font-size:11px;">Avg: ${new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(item.avgTransaction || 0)}</div>
          `
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: 500,
          rotate: names.length > 5 ? 30 : 0,
          interval: 0
        },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: function(value) {
            if (value >= 1000) return 'RM' + (value / 1000).toFixed(0) + 'k'
            return 'RM' + value
          }
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
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: states,
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: 500,
          rotate: states.length > 5 ? 30 : 0,
          interval: 0
        },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: function(value) {
            if (value >= 1000) return 'RM' + (value / 1000).toFixed(0) + 'k'
            return 'RM' + value
          }
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
              { offset: 0, color: '#7c3aed' },
              { offset: 1, color: '#a78bfa' }
            ]
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
      sheet.addRow(['Period', this.getRevenuePeriodLabel()])
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
      
      // Auto-expand first stall if any
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
    // BULK ASSIGN MODE METHODS
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
    // MENU ASSIGNMENT - PAGINATION & FILTERS
    // =============================================

    resetMenuPagination() {
      this.menuCurrentPage = 1
    },

    prevMenuPage() {
      if (this.menuCurrentPage > 1) {
        this.menuCurrentPage--
      }
    },

    nextMenuPage() {
      if (this.menuCurrentPage < this.menuTotalPages) {
        this.menuCurrentPage++
      }
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

    // =============================================
    // BULK ASSIGN MENUS TO SINGLE STALL
    // =============================================

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
    // MENU PERFORMANCE - PAGINATION & FILTERS
    // =============================================

    resetMenuPerformancePagination() {
      this.menuPerformancePage = 1
    },

    prevMenuPerformancePage() {
      if (this.menuPerformancePage > 1) {
        this.menuPerformancePage--
      }
    },

    nextMenuPerformancePage() {
      if (this.menuPerformancePage < this.menuPerformanceTotalPages) {
        this.menuPerformancePage++
      }
    },

    clearMenuPerformanceFilters() {
      this.menuPerformanceCategoryFilter = 'all'
      this.menuPerformanceStateFilter = 'All States'
      this.menuPerformancePage = 1
      this.menuPerformanceSortBy = 'rank'
      this.menuPerformanceSortOrder = 'desc'
    },

    // =============================================
    // MENU PERFORMANCE - SORTING
    // =============================================

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
    // USERS TAB - PAGINATION & FILTERS
    // =============================================

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

    resetUserPagination() {
      this.userCurrentPage = 1
    },

    prevUserPage() {
      if (this.userCurrentPage > 1) {
        this.userCurrentPage--
      }
    },

    nextUserPage() {
      if (this.userCurrentPage < this.userTotalPages) {
        this.userCurrentPage++
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
          if (userId === this.currentUserId) {
            continue
          }
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

    // =============================================
    // NAVIGATE TO STALL
    // =============================================

    navigateToStall(stallId) {
      this.activeTab = 'stalls'
      this.stallSubTab = 'management'
      this.stallSearch = this.stalls.find(s => s.id === stallId)?.name || ''
      this.dropdownOpen = false
    },

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

    // =============================================
    // PERFORMANCE TAB METHODS
    // =============================================

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

    resetPerformancePagination() {
      this.performancePage = 1
    },

    prevPerformancePage() {
      if (this.performancePage > 1) {
        this.performancePage--
      }
    },

    nextPerformancePage() {
      if (this.performancePage < this.performanceTotalPages) {
        this.performancePage++
      }
    },

    clearPerformanceFilters() {
      this.performanceSearch = ''
      this.performanceStateFilter = 'All States'
      this.performanceStatusFilter = 'all'
      this.performancePage = 1
      this.performanceSortBy = 'rank'
      this.performanceSortOrder = 'asc'
    },

    // =============================================
    // INVENTORY METHODS
    // =============================================

    async updateStock(materialName, newLevel, stallId) {
      try {
        const roundedLevel = Math.round(Number(newLevel) || 0)
        await axios.post(`${API_BASE}/inventory/update`, { 
          materialName, 
          newLevel: roundedLevel, 
          stallId: stallId || this.activeStallId 
        }, {
          headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
        })
        await this.loadAllStallsInventory()
        this.$emit('show-notification', `Updated ${materialName} to ${roundedLevel} pieces`, 'success')
      } catch (err) {
        console.error(err)
        this.$emit('show-notification', 'Error updating stock', 'error')
      }
    },

    processInventoryData(data) {
      const map = new Map()
      data.forEach(item => {
        if (!map.has(item.material_name)) {
          map.set(item.material_name, { 
            ...item, 
            current_level: Math.round(Number(item.current_level) || 0), 
            alert_level: Math.round(Number(item.alert_level) || 0) 
          })
        } else {
          const existing = map.get(item.material_name)
          existing.current_level += Math.round(Number(item.current_level) || 0)
        }
      })
      this.inventory = data
      this.processedInventory = Array.from(map.values()).map(item => ({
        ...item,
        current_level: Math.round(Number(item.current_level) || 0),
        alert_level: Math.round(Number(item.alert_level) || 0)
      }))
    },

    toggleAllStalls() {
      this.selectAllStalls = !this.selectAllStalls
      if (this.selectAllStalls) {
        // Select all stall IDs logic here
      } else {
        // Deselect all logic here
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

    resetStallPagination() {
      this.stallCurrentPage = 1
    },

    prevStallPage() {
      if (this.stallCurrentPage > 1) {
        this.stallCurrentPage--
      }
    },

    nextStallPage() {
      if (this.stallCurrentPage < this.stallTotalPages) {
        this.stallCurrentPage++
      }
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

    openBulkUpdateModal() {
      const materialSet = new Set()
      const stalls = this.filteredInventoryStalls.filter(s => this.selectedStalls.includes(s.id))
      
      stalls.forEach(stall => {
        const inventory = this.getStallInventory(stall.id)
        inventory.forEach(item => {
          materialSet.add(item.material_name)
        })
      })

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

    async executeBulkUpdate() {
      this.bulkUpdating = true
      this.bulkUpdateProgress = 0

      const stalls = this.bulkUpdateMode === 'all' 
        ? this.filteredInventoryStalls 
        : this.bulkUpdateMode === 'low-stock'
          ? this.filteredInventoryStalls.filter(s => this.hasLowStock(s.id))
          : this.filteredInventoryStalls.filter(s => this.selectedStalls.includes(s.id))

      const selectedMaterials = this.bulkUpdateMaterials.filter(m => m.selected)
      const total = stalls.length * selectedMaterials.length
      let completed = 0

      try {
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
            
            await this.updateInventoryStock(stall.id, material.name, newLevel)
            completed++
            this.bulkUpdateProgress = Math.round((completed / total) * 100)
          }
        }
        
        this.$emit('show-notification', 'Bulk update completed successfully!', 'success')
        this.bulkUpdateModal = false
      } catch (err) {
        this.$emit('show-notification', 'Bulk update failed: ' + err.message, 'error')
      } finally {
        this.bulkUpdating = false
        this.bulkUpdateProgress = 0
        await this.loadAllStallsInventory()
      }
    },

    exportInventory() {
      this.exportCurrentTab()
    },

    async quickAddStockByItem(item) {
      await this.quickAddStock(
        this.stalls.find(s => s.name === item.stall_name)?.id,
        item.material_name,
        5
      )
    },

    quickUpdateStall(stallId) {
      this.toggleInventoryStall(stallId)
      this.$nextTick(() => {
        const el = document.querySelector(`[data-stall-id="${stallId}"]`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    },

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

    quickUpdateItem(stallId, materialName) {
      this.openStallInventoryModal(stallId)
      this.$nextTick(() => {
        const input = document.querySelector(`.quick-update-item input`)
        if (input) input.focus()
      })
    },

    async quickUpdateItemSave(stallId, materialName, newLevel) {
      if (newLevel === undefined || newLevel === null || newLevel === '') {
        this.$emit('show-notification', 'Please enter a valid value', 'error')
        return
      }
      await this.updateInventoryStock(stallId, materialName, newLevel)
      const item = this.quickUpdateItems.find(i => i.material_name === materialName)
      if (item) {
        item.current_level = newLevel
        item.newLevel = newLevel
      }
      this.$emit('show-notification', `${materialName} updated to ${newLevel}`, 'success')
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

    async resetAllLowStock() {
      if (this.inventoryStats.lowStock === 0) {
        this.$emit('show-notification', 'No low stock items to reset', 'info')
        return
      }
      
      if (!confirm(`Reset ${this.inventoryStats.lowStock} low stock items to alert levels?`)) return
      
      this.loading = true
      let updated = 0
      
      try {
        for (const stall of this.stalls) {
          const inventory = this.getStallInventorySummary(stall.id)
          
          for (const item of inventory) {
            if (item.current_level <= item.alert_level) {
              const newLevel = item.alert_level + 20
              await this.updateInventoryStock(stall.id, item.material_name, newLevel)
              updated++
            }
          }
        }
        
        this.$emit('show-notification', `✅ Reset ${updated} low stock items`, 'success')
        await this.loadAllStallsInventory()
        
      } catch (error) {
        console.error('Error resetting low stock:', error)
        this.$emit('show-notification', 'Error resetting low stock items', 'error')
      } finally {
        this.loading = false
      }
    },

    // =============================================
    // PAGINATION
    // =============================================

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },

    goToPage(page) {
      this.currentPage = Math.max(1, Math.min(page, this.totalPages))
    },

    resetPagination() {
      this.currentPage = 1
    },

    // =============================================
    // STALL DETAIL CHART - GROUPING HELPERS
    // =============================================

    groupSalesData(salesData, grouping, period) {
      if (!salesData || salesData.length === 0) return []
      
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
      const grouped = {}
      salesData.forEach(item => {
        const date = new Date(item.date)
        const weekStart = this.getWeekStart(date)
        const key = weekStart.toISOString()
        if (!grouped[key]) {
          grouped[key] = { date: key, revenue: 0, items: 0 }
        }
        grouped[key].revenue += parseFloat(item.revenue) || 0
        grouped[key].items += parseInt(item.items) || 0
      })
      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
    },

    groupByMonth(salesData) {
      const grouped = {}
      salesData.forEach(item => {
        const date = new Date(item.date)
        const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-01T00:00:00.000Z'
        if (!grouped[key]) {
          const label = date.toLocaleDateString('en-MY', { 
            month: 'short', 
            year: 'numeric',
            timeZone: 'UTC'
          })
          grouped[key] = { 
            date: key, 
            label: label,
            revenue: 0, 
            items: 0 
          }
        }
        grouped[key].revenue += parseFloat(item.revenue) || 0
        grouped[key].items += parseInt(item.items) || 0
      })
      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
    },

    formatHourLabel(dateStr) {
      const date = new Date(dateStr)
      const hour = date.getUTCHours()
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hours12 = hour % 12 || 12
      return `${hours12}:00 ${ampm}`
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
    // TAB NAVIGATION WITH SUB-TAB
    // =============================================

    switchTabWithSubTab(tabId, subTabId) {
      this.activeTab = tabId
      if (tabId === 'stalls') {
        this.stallSubTab = subTabId || 'management'
      } else if (tabId === 'menu') {
        this.menuSubTab = subTabId || 'assignment'
      }
      this.dropdownOpen = false
    },

    // =============================================
    // TOP STALL HELPERS
    // =============================================

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

    getSparklinePoints(data) {
      if (!data || data.length === 0) {
        return '0,40 200,40'
      }
      
      const cleanData = data.map(v => {
        const val = parseFloat(v)
        return isNaN(val) || val === null || val === undefined ? 0 : val
      })
      
      if (cleanData.every(v => v === 0)) {
        return '0,40 200,40'
      }
      
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
        const days = this.selectedPeriod === 'today' ? 1 :
                     this.selectedPeriod === 'week' ? 7 :
                     this.selectedPeriod === 'month' ? 30 :
                     this.selectedPeriod === 'quarter' ? 90 :
                     this.selectedPeriod === 'halfyear' ? 180 :
                     this.selectedPeriod === 'year' ? 365 :
                     this.customDays || 30
        
        const stallIds = this.stalls.map(s => s.id)
        if (!stallIds || stallIds.length === 0) {
          return
        }
        
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
        this.selectedMenuItem.totalQuantity = 0
        this.selectedMenuItem.totalRevenue = 0
      }
    },

    closeMenuDetailModal() {
      this.menuDetailModal = false
      this.selectedMenuItem = null
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
      } else {
        this.refreshAllData()
      }
    },

    handleClickOutside(event) {
      const container = this.$el
      if (container && !container.contains(event.target)) {
        this.dropdownOpen = false
        this.periodDropdownOpen = false
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
      this.periodDropdownOpen = false
      this.refreshAllData()
      this.$emit('show-notification', `Showing ${diffDays + 1} days of data`, 'success')
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
      
      if (this.selectedPeriod === 'today') {
        const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
        if (!dateParts) return dateStr
        
        const hour = parseInt(dateParts[4])
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const hours12 = hour % 12 || 12
        
        return `${hours12}:00 ${ampm}`
      }
      
      if (this.selectedPeriod === 'custom') {
        const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (!dateParts) return dateStr
        const date = new Date(Date.UTC(
          parseInt(dateParts[1]),
          parseInt(dateParts[2]) - 1,
          parseInt(dateParts[3])
        ))
        return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      }
      
      if (this.selectedPeriod === 'quarter' || 
          this.selectedPeriod === 'halfyear' || 
          this.selectedPeriod === 'year') {
        const dateParts = dateStr.match(/(\d{4})-(\d{2})/)
        if (!dateParts) return dateStr
        const date = new Date(Date.UTC(
          parseInt(dateParts[1]),
          parseInt(dateParts[2]) - 1,
          1
        ))
        return date.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
      }
      
      if (this.selectedPeriod === 'month') {
        if (dateStr.includes('W')) return dateStr
        const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (!dateParts) return dateStr
        const date = new Date(Date.UTC(
          parseInt(dateParts[1]),
          parseInt(dateParts[2]) - 1,
          parseInt(dateParts[3])
        ))
        const weekStart = this.getWeekStart(date)
        return weekStart.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', timeZone: 'UTC' })
      }
      
      if (this.selectedPeriod === 'week') {
        const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (!dateParts) return dateStr
        const date = new Date(Date.UTC(
          parseInt(dateParts[1]),
          parseInt(dateParts[2]) - 1,
          parseInt(dateParts[3])
        ))
        const dayOfWeek = date.getUTCDay()
        const orderedDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const dayName = orderedDayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1]
        const dayNum = date.getUTCDate()
        const month = date.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
        return `${dayName} ${dayNum} ${month}`
      }
      
      const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (!dateParts) return dateStr
      const date = new Date(Date.UTC(
        parseInt(dateParts[1]),
        parseInt(dateParts[2]) - 1,
        parseInt(dateParts[3])
      ))
      return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
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
      const p = this.periods.find(p => p.value === this.selectedPeriod)
      if (this.selectedPeriod === 'custom') {
        return `Custom (${this.customDays} days)`
      }
      return p ? p.label : 'Week'
    },

    getUnit(materialName) {
      return 'pieces'
    },

    // =============================================
    // CHART STATS
    // =============================================

    getBestDayName() {
      if (this.salesTrend.length === 0) return '-'
      const max = Math.max(...this.salesTrend.map(d => d.revenue || 0))
      const day = this.salesTrend.find(d => d.revenue === max)
      if (!day) return '-'
      
      if (this.selectedPeriod === 'today') {
        if (day.label) return day.label
        const dateParts = day.date.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
        if (!dateParts) return '-'
        
        const hour = parseInt(dateParts[4])
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const hours12 = hour % 12 || 12
        
        return `${hours12}:00 ${ampm}`
      }
      
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

    // =============================================
    // STALL DETAILS - WITH PERIOD SUPPORT
    // =============================================

    viewStallDetails(stall) {
      this.selectedStall = stall
      this.stallDetailModal = true
      this.selectedStallId = stall.id
      
      this.fetchStallDetails(stall.id, this.selectedPeriod)
      
      this.$nextTick(() => {
        this.initStallDetailChart(stall.id, this.selectedPeriod)
      })
    },

    async fetchStallDetails(stallId, period = 'week') {
      try {
        const days = period === 'today' ? 1 :
                     period === 'week' ? 7 :
                     period === 'month' ? 30 :
                     period === 'quarter' ? 90 :
                     period === 'halfyear' ? 180 :
                     period === 'year' ? 365 :
                     this.customDays || 30
        
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
        
        const stallIndex = this.stallPerformance.findIndex(s => s.id === stallId)
        if (stallIndex !== -1) {
          this.stallPerformance[stallIndex] = { ...this.stallPerformance[stallIndex], ...this.selectedStall }
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

      const days = period === 'today' ? 1 :
                   period === 'week' ? 7 :
                   period === 'month' ? 30 :
                   period === 'quarter' ? 90 :
                   period === 'halfyear' ? 180 :
                   period === 'year' ? 365 :
                   period === 'custom' ? this.customDays || 30 :
                   30

      let grouping

      if (period === 'today') {
        grouping = 'hour'
      } else if (period === 'week') {
        grouping = 'day'
      } else if (period === 'month') {
        grouping = 'week'
      } else if (period === 'quarter' || period === 'halfyear' || period === 'year') {
        grouping = 'month'
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

      axios.get(`${API_BASE}/sales-analytics?days=${days}&stallId=${stallId}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      .then(response => {
        const data = response.data || {}
        let salesData = data.dailySales || []

        if (!salesData || salesData.length === 0) {
          const option = {
            title: {
              text: `No sales data for ${this.getPeriodLabel()}`,
              left: 'center',
              top: 'center',
              textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 }
            }
          }
          this.stallDetailChartInstance.setOption(option)
          this.stallDetailChartInstance.resize()
          return
        }

        let groupedData = this.groupSalesData(salesData, grouping, period)
        
        const chartLabels = groupedData.map(item => {
          if (period === 'today') {
            return this.formatHourLabel(item.date)
          } else if (period === 'week') {
            return this.formatDayLabel(item.date)
          } else if (period === 'month') {
            return this.formatWeekRangeLabel(item.date)
          } else if (period === 'quarter' || period === 'halfyear' || period === 'year') {
            return this.formatMonthLabel(item.date)
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

        const tooltipFormatter = (params) => {
          const index = params[0]?.dataIndex || 0
          const revenue = parseFloat(revenues[index]) || 0
          const itemsCount = parseInt(items[index]) || 0
          const dateLabel = chartLabels[index] || ''
          
          let tooltipLabel = dateLabel
          
          if (period === 'week' && groupedData[index]) {
            const fullDate = new Date(groupedData[index].date)
            tooltipLabel = fullDate.toLocaleDateString('en-MY', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric',
              timeZone: 'UTC'
            })
          }
          
          if (period === 'custom' && groupedData[index]) {
            const customDays = this.customDays || 30
            const fullDate = new Date(groupedData[index].date)
            if (customDays <= 14) {
              tooltipLabel = fullDate.toLocaleDateString('en-MY', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                timeZone: 'UTC'
              })
            } else if (customDays <= 60) {
              const weekStart = this.getWeekStart(fullDate)
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekEnd.getDate() + 6)
              tooltipLabel = `${weekStart.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', timeZone: 'UTC' })} - ${weekEnd.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`
            } else {
              tooltipLabel = fullDate.toLocaleDateString('en-MY', { 
                month: 'short', 
                year: 'numeric',
                timeZone: 'UTC'
              })
            }
          }
          
          return `
            <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">${tooltipLabel}</div>
            <div style="font-size:13px;font-weight:600;color:#F94908;margin-bottom:2px;">
              RM ${revenue.toFixed(2)}
            </div>
            <div style="font-size:11px;color:#64748b;">
              ${itemsCount} items sold
            </div>
          `
        }

        const option = {
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: [8, 12],
            textStyle: { color: '#1e293b', fontSize: 12, fontWeight: 400 },
            formatter: tooltipFormatter
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
              rotate: (period === 'today' || period === 'month' || period === 'custom') && chartLabels.length > 7 ? 30 : 0
            }
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
            axisLabel: { 
              color: '#94a3b8', 
              fontSize: 11,
              formatter: (value) => 'RM' + value
            },
            name: 'Revenue (RM)',
            nameTextStyle: { 
              color: '#94a3b8', 
              fontSize: 11,
              fontWeight: 500
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
        console.error('Failed to load stall detail chart data:', err)
      })
    },

    getTodayInMalaysia() {
      const now = new Date()
      const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
      const today = new Date(malaysiaTime)
      today.setHours(0, 0, 0, 0)
      return today
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

    getWeekNumber(date) {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
      const week1 = new Date(d.getFullYear(), 0, 4)
      return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
    },

    splitTodayIntoHours(dailySales) {
      if (!dailySales || dailySales.length === 0) return []
      
      if (dailySales.length > 1) {
        return dailySales
      }
      
      const dayData = dailySales[0]
      if (!dayData) return []
      
      const totalRevenue = dayData.revenue || 0
      const totalItems = dayData.items || 0
      
      if (totalRevenue > 0 || totalItems > 0) {
        return dailySales
      }
      
      return []
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
            textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 }
          }
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
          textStyle: { color: '#1e293b', fontSize: 11, fontWeight: 400 },
          formatter: function(params) {
            const index = params[0]?.dataIndex || 0
            const revenue = data[index]?.revenue || 0
            const itemsCount = data[index]?.items || 0
            const dateStr = data[index]?.date || data[index]?.label || ''
            let formattedDate = dateStr
            
            if (dateStr && !dateStr.includes('W')) {
              if (this.selectedPeriod === 'today') {
                const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
                if (dateParts) {
                  const hour = parseInt(dateParts[4])
                  const minute = parseInt(dateParts[5])
                  const ampm = hour >= 12 ? 'PM' : 'AM'
                  const hours12 = hour % 12 || 12
                  const minutes = String(minute).padStart(2, '0')
                  formattedDate = `${hours12}:${minutes} ${ampm}`
                }
              } else if (this.selectedPeriod === 'week') {
                const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
                if (dateParts) {
                  const date = new Date(Date.UTC(
                    parseInt(dateParts[1]),
                    parseInt(dateParts[2]) - 1,
                    parseInt(dateParts[3])
                  ))
                  formattedDate = date.toLocaleDateString('en-MY', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC'
                  })
                }
              } else if (this.selectedPeriod === 'month') {
                if (data[index]?.displayLabel) {
                  formattedDate = data[index].displayLabel
                } else {
                  const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
                  if (dateParts) {
                    const date = new Date(Date.UTC(
                      parseInt(dateParts[1]),
                      parseInt(dateParts[2]) - 1,
                      parseInt(dateParts[3])
                    ))
                    const weekStart = this.getWeekStart(date)
                    const weekEnd = new Date(weekStart)
                    weekEnd.setDate(weekEnd.getDate() + 6)
                    const startDay = weekStart.getUTCDate()
                    const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
                    const endDay = weekEnd.getUTCDate()
                    const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
                    if (startMonth === endMonth) {
                      formattedDate = `${startDay}-${endDay} ${startMonth}`
                    } else {
                      formattedDate = `${startDay} ${startMonth}-${endDay} ${endMonth}`
                    }
                  }
                }
              } else if (this.selectedPeriod === 'quarter' || 
                         this.selectedPeriod === 'halfyear' || 
                         this.selectedPeriod === 'year') {
                const dateParts = dateStr.match(/(\d{4})-(\d{2})/)
                if (dateParts) {
                  const date = new Date(Date.UTC(
                    parseInt(dateParts[1]),
                    parseInt(dateParts[2]) - 1,
                    1
                  ))
                  formattedDate = date.toLocaleDateString('en-MY', { 
                    month: 'short', 
                    year: 'numeric',
                    timeZone: 'UTC'
                  })
                }
              } else if (this.selectedPeriod === 'custom') {
                const customDays = this.customDays || 30
                const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
                if (dateParts) {
                  const date = new Date(Date.UTC(
                    parseInt(dateParts[1]),
                    parseInt(dateParts[2]) - 1,
                    parseInt(dateParts[3])
                  ))
                  if (customDays <= 14) {
                    formattedDate = date.toLocaleDateString('en-MY', { 
                      weekday: 'short',
                      day: 'numeric', 
                      month: 'short',
                      timeZone: 'UTC'
                    })
                  } else if (customDays <= 60) {
                    const weekStart = this.getWeekStart(date)
                    const weekEnd = new Date(weekStart)
                    weekEnd.setDate(weekEnd.getDate() + 6)
                    const startDay = weekStart.getUTCDate()
                    const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
                    const endDay = weekEnd.getUTCDate()
                    const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
                    if (startMonth === endMonth) {
                      formattedDate = `${startDay}-${endDay} ${startMonth}`
                    } else {
                      formattedDate = `${startDay} ${startMonth}-${endDay} ${endMonth}`
                    }
                  } else {
                    formattedDate = date.toLocaleDateString('en-MY', { 
                      month: 'short', 
                      year: 'numeric',
                      timeZone: 'UTC'
                    })
                  }
                }
              } else {
                const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
                if (dateParts) {
                  const date = new Date(Date.UTC(
                    parseInt(dateParts[1]),
                    parseInt(dateParts[2]) - 1,
                    parseInt(dateParts[3])
                  ))
                  const day = date.getUTCDate()
                  const monthName = date.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
                  const yearNum = date.getUTCFullYear()
                  const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10]
                  formattedDate = `${day}${suffix} ${monthName} ${yearNum}`
                }
              }
            }
            
            return `
              <div style="font-weight:500;margin-bottom:2px;font-size:10px;color:#94a3b8;letter-spacing:0.2px;">${formattedDate}</div>
              <div style="color:#F94908;font-size:14px;font-weight:700;line-height:1.3;">${new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(revenue)}</div>
              <div style="color:#94a3b8;font-size:10px;margin-top:2px;">${itemsCount} items sold</div>
            `
          }.bind(this)
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
            smooth: false,
            lineStyle: { color: '#F94908', width: 2.5, type: 'solid' },
            symbol: 'circle',
            symbolSize: chartWidth < 400 ? 5 : 7,
            itemStyle: { color: '#F94908', borderColor: '#ffffff', borderWidth: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(249, 73, 8, 0.12)' },
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

    getPeakRevenue() {
      if (this.salesTrend.length === 0) return 0
      return Math.max(...this.salesTrend.map(d => d.revenue || 0))
    },

    getPeakDay() {
      if (this.salesTrend.length === 0) return ''
      const max = Math.max(...this.salesTrend.map(d => d.revenue || 0))
      const day = this.salesTrend.find(d => d.revenue === max)
      if (!day) return ''
      
      if (this.selectedPeriod === 'today') {
        const dateParts = day.date.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
        if (!dateParts) return ''
        
        const hour = parseInt(dateParts[4])
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const hours12 = hour % 12 || 12
        
        return `${hours12}:00 ${ampm}`
      }
      
      return this.formatShortDate(day.date)
    },

    getAverageRevenue() {
      if (this.salesTrend.length === 0) return 0
      const total = this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0)
      return total / this.salesTrend.length
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
    // DATA LOADING
    // =============================================

    async refreshAllData() {
      await this.loadData()
    },

    async loadData() {
      try {
        console.log('🔄 Loading stall admin data...')
        
        await this.loadStalls()
        console.log('✅ Stalls loaded:', this.stalls.length)
        
        this._stallCurrentPage = 1
        
        if (this.selectedPeriod === 'today' || this.selectedPeriod === 'week') {
          this.stallPerformance = []
          this.menuPerformance = []
          this.salesTrend = []
          this.consolidatedSales.topStall = '-'
          this.consolidatedSales.topRevenue = 0
          this.consolidatedSales.totalRevenue = 0
          this.consolidatedSales.totalItems = 0
        }
        
        await this.loadSalesAnalytics()
        
        await Promise.all([
          this.loadUsers(),
          this.loadLowStock(),
          this.loadStallPerformance(),
          this.loadMenuItems()
        ])
        
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

    async loadLowStock() {
      try {
        const res = await axios.get(`${API_BASE}/companies/1/low-stock`, { 
          headers: { Authorization: `Bearer ${this.token}` } 
        })
        this.lowStock = res.data
        console.log('✅ Low stock loaded:', this.lowStock.length)
      } catch (err) {
        console.error('Failed to load low stock:', err)
        this.lowStock = []
      }
    },

    async loadSalesAnalytics() {
      try {
        const days = this.selectedPeriod === 'today' ? 1 :
                     this.selectedPeriod === 'week' ? 7 :
                     this.selectedPeriod === 'month' ? 30 :
                     this.selectedPeriod === 'quarter' ? 90 :
                     this.selectedPeriod === 'halfyear' ? 180 :
                     this.selectedPeriod === 'year' ? 365 :
                     this.customDays || 30
        
        console.log(`📊 Loading sales analytics for days: ${days} period: ${this.selectedPeriod}`)
        
        const res = await axios.get(
          `${API_BASE}/sales-analytics?days=${days}`,
          { headers: { Authorization: `Bearer ${this.token}` } }
        )
        
        console.log('📊 Sales analytics response:', res.data)
        
        const data = res.data || {}
        
        let dailySales = (data.dailySales || []).map(day => ({
          ...day,
          items: parseInt(day.items) || 0,
          revenue: parseFloat(day.revenue) || 0
        }))
        
        console.log('📊 Daily sales before filtering:', dailySales.length, 'records')
        
        if (this.selectedPeriod === 'today') {
          dailySales = this.splitTodayIntoHours(dailySales)
          console.log('📊 After hourly split:', dailySales.length, 'records')
        }
        
        if (this.selectedPeriod === 'week') {
          const now = new Date()
          const dayOfWeek = now.getUTCDay()
          const daysToMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1)
          
          const monday = new Date(now)
          monday.setUTCDate(now.getUTCDate() - daysToMonday)
          monday.setUTCHours(0, 0, 0, 0)
          
          const sunday = new Date(monday)
          sunday.setUTCDate(monday.getUTCDate() + 6)
          sunday.setUTCHours(23, 59, 59, 999)
          
          console.log('📊 Week range (UTC):', monday.toISOString(), 'to', sunday.toISOString())
          
          dailySales = dailySales.filter(day => {
            const date = new Date(day.date)
            const timestamp = date.getTime()
            return timestamp >= monday.getTime() && timestamp <= sunday.getTime()
          })
          
          console.log('📊 Filtered to current week:', dailySales.length, 'records')
        }
        
        if (this.selectedPeriod === 'month') {
          dailySales = this.groupSalesByWeek(dailySales)
        } else if (this.selectedPeriod === 'quarter' || this.selectedPeriod === 'halfyear') {
          dailySales = this.groupSalesByMonth(dailySales)
        } else if (this.selectedPeriod === 'year') {
          dailySales = this.groupSalesByMonth(dailySales)
        } else if (this.selectedPeriod === 'custom') {
          dailySales = this.groupSalesCustom(dailySales)
        }
        
        this.salesTrend = dailySales
        
        console.log('📊 Final salesTrend:', this.salesTrend.length, 'records')
        
        const totalRevenue = dailySales.reduce((sum, d) => sum + (d.revenue || 0), 0)
        const totalItems = dailySales.reduce((sum, d) => sum + (d.items || 0), 0)
        
        console.log('📊 Total revenue:', totalRevenue, 'Total items:', totalItems)
        
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

    async loadStallPerformance() {
      const stallIds = this.stalls.map(s => s.id)
      if (!stallIds || stallIds.length === 0) {
        this.stallPerformance = []
        this.stallPerformancePeriod = []
        return
      }
      
      try {
        const allTimeRes = await axios.get(
          `${API_BASE}/stall-performance?stallIds=${stallIds.join(',')}`,
          { headers: { Authorization: `Bearer ${this.token}` } }
        )
        this.stallPerformance = this.mergeStallData(allTimeRes.data || [])
        
        const days = this.getPeriodDays()
        const periodRes = await axios.get(
          `${API_BASE}/stall-performance?days=${days}&stallIds=${stallIds.join(',')}`,
          { headers: { Authorization: `Bearer ${this.token}` } }
        )
        this.stallPerformancePeriod = this.mergeStallData(periodRes.data || [])
        
        if (this.stallPerformancePeriod.length > 0 && this.stallPerformancePeriod[0].revenue > 0) {
          this.consolidatedSales.topStall = this.stallPerformancePeriod[0].name
          this.consolidatedSales.topRevenue = this.stallPerformancePeriod[0].revenue
        }
        
        console.log('✅ All-time stalls:', this.stallPerformance.length)
        console.log('✅ Period stalls:', this.stallPerformancePeriod.length)
        
      } catch (err) {
        console.error('Failed to load stall performance:', err)
        this.stallPerformance = []
        this.stallPerformancePeriod = []
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
          return {
            ...stall,
            revenue: 0,
            items: 0,
            avgTransaction: 0
          }
        }
      }).sort((a, b) => b.revenue - a.revenue)
    },

    async loadMenuPerformance() {
      try {
        const productSales = this.productSales || {}
        
        const hasPeriodSales = this.salesTrend && this.salesTrend.length > 0
        const periodRevenue = hasPeriodSales ? this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0) : 0
        const periodItems = hasPeriodSales ? this.salesTrend.reduce((sum, d) => sum + (d.items || 0), 0) : 0
        
        if (!hasPeriodSales || (periodRevenue === 0 && periodItems === 0)) {
          this.menuPerformance = []
          console.log('📊 Menu performance: 0 items (no sales for this period)')
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
        
        if (this.selectedPeriod === 'today' || this.selectedPeriod === 'week') {
          const periodItemsList = filteredItems.filter(item => item.revenue > 0 && item.quantity > 0)
          this.menuPerformance = periodItemsList
          console.log(`📊 Menu performance for ${this.selectedPeriod}:`, this.menuPerformance.length, 'items')
          return
        }
        
        if (filteredItems.length > 0) {
          this.menuPerformance = filteredItems
          return
        }
        
        const days = this.selectedPeriod === 'today' ? 1 :
                     this.selectedPeriod === 'week' ? 7 :
                     this.selectedPeriod === 'month' ? 30 :
                     this.selectedPeriod === 'quarter' ? 90 :
                     this.selectedPeriod === 'halfyear' ? 180 :
                     this.selectedPeriod === 'year' ? 365 :
                     this.customDays || 30
        
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
        console.log('📊 Menu performance from API (filtered):', this.menuPerformance.length, 'items')
      } catch (err) {
        console.error('Failed to load menu performance:', err)
        this.menuPerformance = []
      }
    },

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
    // INVENTORY METHODS
    // =============================================

    async initializeStallInventory(stallId) {
      try {
        const checkRes = await axios.get(`${API_BASE}/inventory?stallId=${stallId}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        const chickenExists = checkRes.data.some(item => item.material_name === 'Chicken')
        if (!chickenExists) {
          await axios.post(`${API_BASE}/inventory/update`, {
            stallId: stallId,
            materialName: 'Chicken',
            newLevel: 100,
            alertLevel: 10
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
          })
        }
      } catch (err) {
        console.error('Failed to initialize inventory:', err)
      }
    },

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
      
      const roundedLevel = Math.round(Number(newLevel) || 0)
      
      try {
        await axios.post(`${API_BASE}/inventory/update`, {
          stallId, 
          materialName, 
          newLevel: roundedLevel
        }, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        
        await this.loadAllStallsInventory()
        await this.loadLowStock()
        
        this.$emit('show-notification', `${materialName} updated to ${roundedLevel} pieces`, 'success')
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
          sheet.addRow(['Name', 'Code', 'State', 'Company', 'Users', 'Status'])
          for (const stall of this.filteredStallsList) {
            sheet.addRow([
              stall.name,
              stall.code,
              stall.state || '-',
              stall.company_name || '-',
              stall.user_count || 0,
              stall.is_active ? 'Active' : 'Inactive'
            ])
          }
          fileName = `Chickory_Stalls_${new Date().toISOString().split('T')[0]}.xlsx`
        } else if (this.activeTab === 'menu') {
          sheet = workbook.addWorksheet('Menu')
          sheet.addRow(['📋 Menu Management', ''])
          sheet.addRow(['Item Name', 'Price', 'Category'])
          for (const item of this.filteredMenuItemsForAssignment) {
            sheet.addRow([item.item_name, item.price, item.category || 'Main'])
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
  } // ← END OF METHODS
} // ← END OF EXPORT DEFAULT
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

/* Custom Date Range */
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

@media (max-width: 600px) {
  .date-range-inputs {
    flex-direction: column;
    gap: 0.35rem;
  }
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
/* KPI CARDS - FULLY ALIGNED                   */
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

/* ============================================ */
/* RESPONSIVE - KPI & STATS CARDS              */
/* ============================================ */
@media (max-width: 1024px) {
  .stats-grid,
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stat-card.glass {
    height: 165px;
    padding: 0.75rem 0.5rem;
  }
  
  .kpi-card {
    height: 140px;
    padding: 0.75rem 0.5rem;
  }
  
  .stat-card.glass .stat-icon,
  .kpi-card .kpi-icon {
    font-size: 1.6rem;
    height: 2.2rem;
  }
  
  .stat-card.glass .stat-number,
  .kpi-card .kpi-value,
  .kpi-card .kpi-value-topstall {
    font-size: 1.5rem;
    height: 2rem;
  }
  
  .stat-card.glass .stat-label,
  .kpi-card .kpi-label {
    font-size: 0.65rem;
    height: 1rem;
  }
  
  .stat-card.glass .stat-breakdown,
  .stat-card.glass .stat-sub-label,
  .kpi-card .kpi-change,
  .kpi-card .kpi-status-badge,
  .kpi-card .kpi-trend-label {
    font-size: 0.6rem;
    height: 1.2rem;
  }
  
  .kpi-card .sparkline-container {
    height: 30px;
  }
}

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
  
  .inventory-stall-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .modal-form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-modern {
    width: 95%;
  }
  
  .chart-modern-nav-label {
    min-width: 60px;
    font-size: 0.6rem;
  }
  
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

@media (max-width: 600px) {
  .stats-grid,
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
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
  
  .stat-card.glass .stat-icon,
  .kpi-card .kpi-icon {
    font-size: 1.4rem;
    height: 1.8rem;
  }
  
  .stat-card.glass .stat-number,
  .kpi-card .kpi-value,
  .kpi-card .kpi-value-topstall {
    font-size: 1.2rem;
    height: 1.6rem;
  }
  
  .stat-card.glass .stat-label,
  .kpi-card .kpi-label {
    font-size: 0.6rem;
    height: 0.9rem;
  }
  
  .stat-card.glass .stat-breakdown,
  .stat-card.glass .stat-sub-label,
  .kpi-card .kpi-change,
  .kpi-card .kpi-status-badge,
  .kpi-card .kpi-trend-label {
    font-size: 0.55rem;
    height: 1.1rem;
  }
  
  .kpi-card .sparkline-container {
    height: 25px;
    opacity: 0.3;
  }
}

@media (max-width: 480px) {
  .stats-grid,
  .kpi-grid {
    gap: 0.5rem;
  }
  
  .stat-card.glass {
    height: 135px;
    padding: 0.4rem 0.3rem;
    border-radius: 10px;
  }
  
  .kpi-card {
    height: 115px;
    padding: 0.4rem 0.3rem;
    border-radius: 10px;
  }
  
  .stat-card.glass .stat-icon,
  .kpi-card .kpi-icon {
    font-size: 1.2rem;
    height: 1.6rem;
  }
  
  .stat-card.glass .stat-number,
  .kpi-card .kpi-value,
  .kpi-card .kpi-value-topstall {
    font-size: 1rem;
    height: 1.4rem;
  }
  
  .stat-card.glass .stat-label,
  .kpi-card .kpi-label {
    font-size: 0.55rem;
    height: 0.8rem;
  }
  
  .stat-card.glass .stat-breakdown,
  .stat-card.glass .stat-sub-label,
  .kpi-card .kpi-change,
  .kpi-card .kpi-status-badge,
  .kpi-card .kpi-trend-label {
    font-size: 0.5rem;
    height: 1rem;
  }
  
  .kpi-card .sparkline-container {
    height: 20px;
    opacity: 0.2;
  }
  
  .kpi-card .kpi-trend-label {
    display: none;
  }
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

.chart-modern-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
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

.card-modern-body {
  padding: 1rem;
}

/* ============================================ */
/* STALL PERFORMANCE                            */
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
/* MENU PERFORMANCE                             */
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
/* MENU PERFORMANCE STATS GRID - 3 CARDS        */
/* ============================================ */
.menu-performance-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.menu-performance-stats-grid .stat-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.menu-performance-stats-grid .stat-chip .stat-chip-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
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
  display: block;
  text-align: center;
}

.menu-performance-stats-grid .stat-chip.revenue .stat-chip-value { color: #F94908; }
.menu-performance-stats-grid .stat-chip.top-item .stat-chip-value { 
  color: #f59e0b; 
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .menu-performance-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .menu-performance-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .menu-performance-stats-grid .stat-chip {
    padding: 0.35rem 0.6rem;
  }
  
  .menu-performance-stats-grid .stat-chip .stat-chip-value {
    font-size: 1rem;
  }
  
  .menu-performance-stats-grid .stat-chip .stat-chip-label {
    font-size: 0.6rem;
  }
}

/* ============================================ */
/* SUB-TABS                                     */
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

.sub-tab-content {
  animation: fadeIn 0.3s ease;
}

@media (max-width: 600px) {
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
/* MODALS                                       */
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
}

.status-badge.excellent { background: #d1fae5; color: #059669; }
.status-badge.good { background: #dbeafe; color: #2563eb; }
.status-badge.average { background: #fef3c7; color: #d97706; }
.status-badge.poor { background: #fee2e2; color: #dc2626; }
.status-badge.no-sales { background: #f3f4f6; color: #6b7280; }

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
/* MENU DETAIL MODAL - TOP STALL BREAKDOWN     */
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
/* RESPONSIVE - MOBILE                         */
/* ============================================ */
@media (max-width: 600px) {
  .stall-breakdown-header { gap: 0.3rem; padding: 0.2rem 0.3rem; font-size: 0.5rem; }
  .stall-breakdown-header-name { min-width: 50px; }
  .stall-breakdown-header-revenue { min-width: 60px; }
  .stall-breakdown-header-quantity { min-width: 50px; }
  .stall-breakdown-header-bar { min-width: 40px; }
  .stall-breakdown-item { gap: 0.3rem; padding: 0.3rem 0.3rem; flex-wrap: wrap; }
  .stall-breakdown-name { min-width: 50px; font-size: 0.75rem; flex: 1; }
  .stall-breakdown-revenue { min-width: 60px; font-size: 0.75rem; }
  .stall-breakdown-quantity { min-width: 50px; font-size: 0.75rem; }
  .stall-breakdown-bar-wrapper { min-width: 40px; flex: 1; width: 100%; }
  
  .stall-performance-table-container,
  .menu-performance-table-container { max-height: 320px; padding: 0.25rem; }
  
  .stall-table-header,
  .menu-table-header { gap: 0.3rem; padding: 0.2rem 0.3rem; font-size: 0.5rem; }
  .stall-table-header-rank,
  .menu-table-header-rank { min-width: 30px; }
  .stall-table-header-revenue,
  .menu-table-header-revenue { min-width: 50px; }
  .stall-table-header-status,
  .menu-table-header-status { min-width: 60px; }
  .stall-table-header-details,
  .menu-table-header-details { min-width: 30px; }
  
  .stall-table-row,
  .menu-table-row { gap: 0.3rem; padding: 0.25rem 0.3rem; }
  .stall-table-rank,
  .menu-table-rank { min-width: 30px; }
  .rank-number { width: 22px; height: 22px; font-size: 0.6rem; }
  .stall-table-name,
  .menu-table-name { min-width: 50px; }
  .stall-name-text,
  .menu-name-text { font-size: 0.7rem; }
  .stall-table-revenue,
  .menu-table-revenue { min-width: 50px; font-size: 0.7rem; }
  .stall-table-status,
  .menu-table-status { min-width: 60px; }
  .status-indicator { font-size: 0.5rem; padding: 0.05rem 0.3rem; gap: 0.15rem; }
  .stall-table-details,
  .menu-table-details { min-width: 30px; font-size: 0.7rem; }
}

@media (max-width: 400px) {
  .stall-table-header-revenue,
  .menu-table-header-revenue { min-width: 40px; }
  .stall-table-header-status,
  .menu-table-header-status { min-width: 50px; }
  .stall-table-revenue,
  .menu-table-revenue { min-width: 40px; font-size: 0.65rem; }
  .stall-table-status,
  .menu-table-status { min-width: 50px; }
  .status-indicator { font-size: 0.45rem; padding: 0.05rem 0.2rem; }
}

/* ============================================ */
/* RESPONSIVE - GENERAL                         */
/* ============================================ */
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .stat-card { padding: 0.5rem; }
  .stat-number { font-size: 1.1rem; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .kpi-value { font-size: 1.1rem; }
  .echarts-container { height: 200px; }
  .chart-wrapper { min-height: 200px; }
  .chart-modern-body { padding: 0.75rem; }
  .chart-modern-stats { grid-template-columns: repeat(2, 1fr); gap: 0.35rem; }
  .chart-modern-stat-value { font-size: 0.8rem; }
  .filter-bar { flex-direction: column; }
  .filter-search { min-width: unset; }
  .filter-select { min-width: unset; }
  .inventory-items-grid { grid-template-columns: 1fr; }
  .inventory-stall-header { flex-direction: column; align-items: flex-start; }
  .modal-form-row { grid-template-columns: 1fr; }
  .modal-modern { width: 95%; }
  .chart-modern-nav-label { min-width: 60px; font-size: 0.6rem; }
  .assignment-header { flex-direction: column; align-items: stretch; }
  .assignment-count { margin-right: 0; text-align: center; }
  .assignment-item-label { font-size: 0.8rem; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .stat-card { padding: 0.5rem; flex-direction: column; text-align: center; gap: 0.25rem; }
  .stat-icon { width: 32px; height: 32px; font-size: 1rem; }
  .stat-number { font-size: 0.95rem; }
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .kpi-card { padding: 0.5rem; }
  .kpi-value { font-size: 0.95rem; }
  .echarts-container { height: 160px; }
  .chart-wrapper { min-height: 160px; }
  .chart-modern-stats { grid-template-columns: repeat(2, 1fr); gap: 0.25rem; padding: 0.35rem; }
  .chart-modern-stat { padding: 0.15rem; }
  .chart-modern-stat-value { font-size: 0.75rem; }
  .chart-modern-stat-label { font-size: 0.5rem; }
  .chart-modern-nav-label { min-width: 50px; font-size: 0.55rem; }
  .list-item-content { gap: 0.35rem; }
  .list-item-name { font-size: 0.75rem; }
  .list-item-btn { font-size: 0.75rem; }
  .empty-state-modern span { font-size: 1.5rem; }
  .action-buttons { flex-direction: row; width: 100%; }
  .header-action-btn { flex: 1; justify-content: center; }
  .dropdown-toggle { font-size: 0.8rem; padding: 0.35rem 0.6rem; }
  .dropdown-label { font-size: 0.8rem; }
}

/* ============================================ */
/* INVENTORY - MODERN STYLES                    */
/* ============================================ */

.inventory-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Stats Chips */
.inventory-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
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

.stat-chip.active .stat-chip-value { color: #10b981; }
.stat-chip.inactive .stat-chip-value { color: #6b7280; }
.stat-chip.warning .stat-chip-value { color: #ef4444; }

/* Filter Bar Modern */
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

/* ============================================ */
/* INVENTORY TABLE - RESPONSIVE FIX            */
/* ============================================ */

.inventory-table-wrapper {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ✅ Table Header - Desktop */
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

/* ✅ Table Row - Desktop */
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

/* ✅ Table Cells - Fixed Widths */
.inventory-table-cell {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.inventory-table-cell.checkbox { 
  width: 40px; 
  flex-shrink: 0; 
}

.inventory-table-cell.name { 
  flex: 1; 
  min-width: 100px;
  flex-direction: column; 
  align-items: flex-start; 
}

.inventory-table-cell.state { 
  width: 100px; 
  flex-shrink: 0; 
  font-size: 0.75rem; 
  color: var(--text-secondary); 
}

.inventory-table-cell.items { 
  flex: 1.5; 
  min-width: 120px;
  flex-wrap: wrap; 
  gap: 0.25rem; 
}

.inventory-table-cell.status { 
  width: 130px; 
  flex-shrink: 0; 
  flex-wrap: wrap; 
  gap: 0.25rem; 
}

.inventory-table-cell.actions { 
  width: 80px; 
  flex-shrink: 0; 
  justify-content: flex-end; 
  gap: 0.25rem; 
}

/* ✅ Checkbox styling */
.inventory-table-cell input[type="checkbox"] {
  accent-color: var(--primary);
  cursor: pointer;
  width: 16px;
  height: 16px;
}

/* ✅ Stall name and code */
.stall-name { 
  font-weight: 500; 
  font-size: 0.85rem; 
}

.stall-code { 
  font-size: 0.6rem; 
  color: var(--text-tertiary); 
  font-family: monospace; 
}

/* ✅ Item tags */
.item-tag {
  background: var(--background);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  font-size: 0.6rem;
  border: 1px solid var(--border-light);
  white-space: nowrap;
}

.item-tag-warning { color: #ef4444; }

/* ✅ Status badges */
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

/* ✅ Action buttons */
.btn-icon {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.btn-icon:hover {
  background: var(--background);
  color: var(--text);
}

/* ============================================ */
/* ✅ RESPONSIVE - TABLET & MOBILE              */
/* ============================================ */

@media (max-width: 1024px) {
  .inventory-table-cell.state { width: 80px; }
  .inventory-table-cell.status { width: 110px; }
  .inventory-table-cell.actions { width: 70px; }
}

@media (max-width: 768px) {
  /* ✅ Stack filter bar vertically */
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
  
  /* ✅ Stats chips - 2 columns */
  .inventory-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* ✅ Table becomes card-style on mobile */
  .inventory-table-wrapper {
    border: none;
    border-radius: 0;
  }
  
  .inventory-table-header {
    display: none; /* Hide header on mobile */
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
  
  /* ✅ Each cell becomes a row with label */
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
  
  /* ✅ Add labels for each field on mobile */
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
  
  .inventory-table-cell.actions {
    justify-content: flex-start;
    padding-top: 0.3rem;
    border-top: 1px solid var(--border-light);
    margin-top: 0.3rem;
  }
  
  .inventory-table-cell.actions::before {
    content: "Actions: ";
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }
  
  /* ✅ Fix item tags wrapping */
  .inventory-table-cell.items {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  /* ✅ Status badges on mobile */
  .inventory-table-cell.status {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  /* ✅ Action buttons on mobile */
  .inventory-table-cell.actions {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .btn-icon {
    width: 32px;
    height: 32px;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  /* ✅ Stats chips - 2 columns, smaller */
  .inventory-stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
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
  
  /* ✅ Mobile row padding */
  .inventory-table-row {
    padding: 0.5rem;
  }
  
  .inventory-table-cell {
    padding: 0.15rem 0;
  }
  
  .inventory-table-cell.name::before,
  .inventory-table-cell.state::before,
  .inventory-table-cell.items::before,
  .inventory-table-cell.status::before,
  .inventory-table-cell.actions::before {
    min-width: 50px;
    font-size: 0.6rem;
  }
  
  .stall-name {
    font-size: 0.8rem;
  }
  
  .item-tag {
    font-size: 0.55rem;
    padding: 0.05rem 0.3rem;
  }
  
  .status-badge {
    font-size: 0.55rem;
    padding: 0.05rem 0.3rem;
  }
  
  .inventory-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .inventory-actions .btn-modern {
    width: 100%;
    justify-content: center;
  }
  
  .bulk-material-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================ */
/* EXPANDED DETAILS - Mobile                   */
/* ============================================ */

.inventory-detail-expanded {
  padding: 1rem;
  background: var(--background);
  border-bottom: 1px solid var(--border);
}

.inventory-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

@media (max-width: 600px) {
  .inventory-items-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================ */
/* BULK UPDATE MODAL - CLEAN & COMPACT         */
/* ============================================ */

/* Mode Selection */
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

/* Preview */
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

/* Materials Section */
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

/* Material Grid - Clean & Compact */
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

/* Footer */
.modal-modern-footer .btn-modern {
  font-size: 0.75rem;
  padding: 0.25rem 0.8rem;
}

/* ============================================ */
/* RESPONSIVE - BULK UPDATE MODAL              */
/* ============================================ */

@media (max-width: 600px) {
  .bulk-mode-selector {
    flex-direction: column;
  }
  
  .mode-btn {
    width: 100%;
    text-align: center;
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }
  
  .bulk-material-item {
    flex-wrap: wrap;
    gap: 0.2rem;
  }
  
  .bulk-material-label {
    flex: 1 0 100%;
  }
  
  .bulk-material-inputs {
    flex: 1 0 100%;
    justify-content: flex-start;
  }
  
  .quick-actions {
    justify-content: center;
  }
  
  .modal-modern-footer {
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .modal-modern-footer .btn-modern {
    width: 100%;
    justify-content: center;
  }
}

/* ============================================ */
/* PAGINATION                                   */
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
/* INVENTORY ITEMS INLINE                       */
/* ============================================ */

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

.inventory-item-inline .item-name {
  font-weight: 500;
}

.inventory-item-inline .item-level {
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.inventory-item-inline .item-warning {
  color: #ef4444;
  font-size: 0.6rem;
}

.inventory-item-inline.low {
  border-color: #ef4444;
  background: #fef2f2;
}

.btn-icon.tiny {
  width: 18px;
  height: 18px;
  font-size: 0.6rem;
}

/* ============================================ */
/* QUICK UPDATE MODAL                           */
/* ============================================ */

.modal-sm {
  max-width: 500px;
}

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

.quick-update-name {
  font-weight: 600;
  font-size: 0.85rem;
}

.quick-update-current {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.quick-update-status {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  border-radius: 8px;
}

.quick-update-status.ok {
  background: #d1fae5;
  color: #059669;
}

.quick-update-status.low {
  background: #fee2e2;
  color: #dc2626;
}

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
/* INVENTORY QUICK ACTIONS                      */
/* ============================================ */

.inventory-quick-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  align-items: center;
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .pagination-controls {
    justify-content: center;
  }
  
  .inventory-quick-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .inventory-quick-actions .btn-modern {
    width: 100%;
    justify-content: center;
  }
  
  .quick-update-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-update-info {
    justify-content: space-between;
  }
  
  .quick-update-actions {
    justify-content: flex-start;
  }
  
  .modal-sm {
    width: 95%;
    max-width: 95%;
  }
}

@media (max-width: 480px) {
  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .pagination-btn {
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
  }
  
  .inventory-item-inline {
    font-size: 0.55rem;
    padding: 0.05rem 0.2rem;
  }
  
  .quick-update-actions {
    justify-content: center;
  }
}

/* ============================================ */
/* ACTION BUTTON - TOP UP                       */
/* ============================================ */

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--primary);
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-action:hover {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 8px rgba(249, 73, 8, 0.2);
}

.btn-action:active {
  transform: scale(0.95);
}

/* ✅ Mobile adjustment */
@media (max-width: 480px) {
  .btn-action {
    padding: 0.1rem 0.4rem;
    font-size: 0.6rem;
  }
}

.filter-input {
  font-size: var(--font-size);
  padding: var(--space-sm) var(--space);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--text);
  width: 100%;
}

/* ✅ Ensure dropdowns match */
.filter-select,
.filters-row select,
.filters-row input {
  font-size: var(--font-size);
}

/* ✅ Responsive consistency */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
  }
  
  .filter-input,
  .filters-row select,
  .filters-row input {
    font-size: var(--font-size);
    width: 100%;
  }
  
  .refresh-btn {
    font-size: var(--font-size);
    width: 100%;
  }
}

/* ✅ RESPONSIVE FIXES */
@media (max-width: 768px) {
  /* Consistent font size for all filter elements */
  .filter-input,
  .filter-select,
  .filter-search input,
  .filter-group select {
    font-size: 14px !important;
  }
  
  /* ✅ Make states and status in 1 row */
  .filter-bar-modern {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .filter-bar-modern .filter-group {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
  
  .filter-bar-modern .filter-group select {
    flex: 1;
    min-width: 0;
    font-size: 14px !important;
  }
  
  /* ✅ 2 stalls per row on mobile */
  .inventory-table-wrapper {
    overflow-x: auto;
  }
  
  .inventory-table-header,
  .inventory-table-row {
    display: grid;
    grid-template-columns: 40px 1fr 1fr 1.5fr 1fr 80px;
    gap: 0.5rem;
    padding: 0.5rem;
    font-size: 13px;
    min-width: 600px;
  }
  
  /* Mobile card view - 2 per row */
  @media (max-width: 480px) {
    .inventory-table-wrapper {
      overflow-x: visible;
    }
    
    .inventory-table-header {
      display: none;
    }
    
    .inventory-table-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      min-width: auto;
    }
    
    .inventory-table-row .inventory-table-cell.checkbox {
      grid-column: 1;
      grid-row: 1;
    }
    
    .inventory-table-row .inventory-table-cell.name {
      grid-column: 2;
      grid-row: 1;
      text-align: right;
    }
    
    .inventory-table-row .inventory-table-cell.state {
      grid-column: 1;
      grid-row: 2;
    }
    
    .inventory-table-row .inventory-table-cell.items {
      grid-column: 2;
      grid-row: 2;
      text-align: right;
    }
    
    .inventory-table-row .inventory-table-cell.status {
      grid-column: 1;
      grid-row: 3;
    }
    
    .inventory-table-row .inventory-table-cell.actions {
      grid-column: 2;
      grid-row: 3;
      text-align: right;
    }
    
    .inventory-table-cell .stall-name {
      font-size: 14px;
      font-weight: 600;
    }
    
    .inventory-table-cell .stall-code {
      font-size: 12px;
    }
    
    .inventory-item-inline {
      font-size: 12px;
    }
    
    .status-badge {
      font-size: 11px;
      padding: 2px 8px;
    }
    
    .btn-action {
      font-size: 12px;
      padding: 4px 8px;
    }
    
    /* Stats chips responsive */
    .inventory-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    
    .stat-chip {
      padding: 0.5rem;
    }
    
    .stat-chip-value {
      font-size: 18px;
    }
    
    .stat-chip-label {
      font-size: 11px;
    }
  }
}

/* For tablet */
@media (min-width: 481px) and (max-width: 768px) {
  .filter-bar-modern {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .filter-bar-modern .filter-search {
    flex: 1 1 100%;
  }
  
  .filter-bar-modern .filter-group {
    flex: 1;
    min-width: 0;
  }
  
  .filter-bar-modern .filter-actions {
    flex: 1 1 100%;
    display: flex;
    gap: 0.5rem;
  }
}

/* ✅ RESPONSIVE FIXES - ONLY WHAT YOU REQUESTED */

/* ✅ Consistent font size on mobile for all filter elements */
@media (max-width: 768px) {
  .filter-input,
  .filter-select,
  .filter-search input,
  .filter-group select {
    font-size: 14px !important;
  }
}

/* ✅ All States and All Status in 1 row on mobile */
@media (max-width: 768px) {
  .filter-bar-modern .filter-group {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
  
  .filter-bar-modern .filter-group select {
    flex: 1;
    min-width: 0;
    font-size: 14px !important;
  }
}

/* ✅ 2 stalls per row on mobile - card view */
@media (max-width: 480px) {
  .inventory-table-wrapper {
    overflow-x: visible;
  }
  
  .inventory-table-header {
    display: none;
  }
  
  .inventory-table-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.3rem;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    min-width: auto;
  }
  
  .inventory-table-row .inventory-table-cell.checkbox {
    grid-column: 1;
    grid-row: 1;
  }
  
  .inventory-table-row .inventory-table-cell.name {
    grid-column: 2;
    grid-row: 1;
    text-align: right;
  }
  
  .inventory-table-row .inventory-table-cell.state {
    grid-column: 1;
    grid-row: 2;
  }
  
  .inventory-table-row .inventory-table-cell.items {
    grid-column: 2;
    grid-row: 2;
    text-align: right;
  }
  
  .inventory-table-row .inventory-table-cell.status {
    grid-column: 1;
    grid-row: 3;
  }
  
  .inventory-table-row .inventory-table-cell.actions {
    grid-column: 2;
    grid-row: 3;
    text-align: right;
  }
}

/* ✅ Action buttons in Stall Management */
.inventory-table-cell .btn-action {
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

.inventory-table-cell .btn-action:hover:not(:disabled) {
  background: var(--background);
  border-color: var(--primary);
  color: var(--text);
}

.inventory-table-cell .btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.inventory-table-cell .btn-action:first-child:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.05);
}

.inventory-table-cell .btn-action:last-child:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(249, 73, 8, 0.05);
}

/* ============================================ */
/* PERFORMANCE STATS GRID - 5 CARDS             */
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

.performance-stats-grid .stat-chip .stat-chip-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
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
/* PERFORMANCE TABLE                           */
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
/* RESPONSIVE - PERFORMANCE TAB                 */
/* ============================================ */
@media (max-width: 1024px) {
  .performance-stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .performance-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .performance-table-header {
    font-size: 0.6rem;
    padding: 0.3rem 0.5rem;
  }
  
  .performance-table-row {
    padding: 0.3rem 0.5rem;
  }
  
  .performance-table-rank { min-width: 35px; }
  .performance-table-revenue { min-width: 70px; font-size: 0.7rem; }
  .performance-table-status { min-width: 80px; }
  .performance-table-details { min-width: 35px; }
}

@media (max-width: 480px) {
  .performance-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .performance-stats-grid .stat-chip {
    padding: 0.35rem 0.6rem;
  }
  
  .performance-stats-grid .stat-chip .stat-chip-value {
    font-size: 1rem;
  }
  
  .performance-stats-grid .stat-chip .stat-chip-label {
    font-size: 0.6rem;
  }
  
  .performance-table-header {
    font-size: 0.5rem;
    padding: 0.2rem 0.3rem;
    min-width: 400px;
  }
  
  .performance-table-row {
    padding: 0.2rem 0.3rem;
    min-width: 400px;
  }
  
  .performance-table-rank { min-width: 30px; }
  .performance-table-name { min-width: 60px; }
  .performance-table-revenue { min-width: 60px; font-size: 0.65rem; }
  .performance-table-status { min-width: 70px; }
  .performance-table-details { min-width: 30px; }
  
  .rank-number {
    width: 22px;
    height: 22px;
    font-size: 0.6rem;
  }
  
  .stall-name-text {
    font-size: 0.7rem;
  }
  
  .status-indicator {
    font-size: 0.5rem;
    padding: 0.05rem 0.3rem;
  }
}

/* ============================================ */
/* BACK TO DASHBOARD BUTTON                     */
/* ============================================ */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.7rem;
  color: var(--text-secondary);
  transition: var(--transition);
  margin-top: 0.15rem;
}

.btn-back:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: translateX(-2px);
}

/* ✅ Responsive adjustment */
@media (max-width: 768px) {
  .btn-back {
    font-size: 0.65rem;
    padding: 0.15rem 0.5rem;
  }
}

/* ============================================ */
/* HEADER ACTIONS - Consistent across all tabs  */
/* ============================================ */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ============================================ */
/* BACK TO DASHBOARD BUTTON                     */
/* ============================================ */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
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

/* ✅ Responsive adjustment */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  .header-actions .btn-modern,
  .header-actions .btn-back {
    width: 100%;
    justify-content: center;
  }
  
  .btn-back {
    font-size: 0.7rem;
    padding: 0.25rem 0.6rem;
  }
}

/* ============================================ */
/* USERS TAB - STATS GRID                      */
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

.users-stats-grid .stat-chip .stat-chip-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
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
  min-width: 600px;
}

.users-table-row {
  display: flex;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
  align-items: center;
  min-width: 600px;
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
.users-table-cell.stalls { flex: 1.5; min-width: 100px; flex-wrap: wrap; gap: 0.25rem; }
.users-table-cell.status { width: 100px; flex-shrink: 0; }
.users-table-cell.actions { width: 120px; flex-shrink: 0; justify-content: flex-end; gap: 0.25rem; }

/* ✅ Checkbox styling */
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

/* ✅ Role badges */
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

/* ✅ Stall badges */
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

/* ✅ Action buttons */
.users-table-cell .btn-action {
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

.users-table-cell .btn-action:hover:not(:disabled) {
  background: var(--background);
  border-color: var(--primary);
  color: var(--text);
}

.users-table-cell .btn-action.danger:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.users-table-cell .btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ✅ Responsive */
@media (max-width: 768px) {
  .users-stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .users-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .users-stats-grid .stat-chip {
    padding: 0.35rem 0.6rem;
  }
  
  .users-stats-grid .stat-chip .stat-chip-value {
    font-size: 1rem;
  }
  
  .users-stats-grid .stat-chip .stat-chip-label {
    font-size: 0.6rem;
  }
  
  .users-table-header {
    font-size: 0.5rem;
    padding: 0.2rem 0.3rem;
    min-width: 500px;
  }
  
  .users-table-row {
    padding: 0.2rem 0.3rem;
    min-width: 500px;
  }
  
  .users-table-cell.username { min-width: 60px; }
  .users-table-cell.fullname { min-width: 60px; }
  .users-table-cell.role { width: 70px; }
  .users-table-cell.status { width: 70px; }
  .users-table-cell.actions { width: 80px; }
  
  .role-badge {
    font-size: 0.55rem;
    padding: 0.1rem 0.4rem;
  }
  
  .stall-badge {
    font-size: 0.5rem;
    padding: 0.05rem 0.3rem;
  }
  
  .users-table-cell .btn-action {
    font-size: 0.55rem;
    padding: 0.1rem 0.3rem;
  }
}

/* ✅ Danger button style */
.btn-modern.danger {
  background: #ef4444;
  color: white;
}

.btn-modern.danger:hover {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

/* ============================================ */
/* USERS TAB - CORRECT FONT SIZES               */
/* ============================================ */

/* ✅ Table header - keep smaller */
.users-table-header {
  font-size: 0.7rem !important;
}

/* ✅ Table cells - use appropriate size */
.users-table-wrapper .users-table-row .users-table-cell {
  font-size: 0.8rem !important;
}

/* ✅ Username - slightly bold but same size */
.users-table-wrapper .users-table-row .users-table-cell .username-text {
  font-size: 0.8rem !important;
  font-weight: 500;
}

/* ✅ Full name - same size */
.users-table-wrapper .users-table-row .users-table-cell .fullname {
  font-size: 0.8rem !important;
}

/* ✅ Role badges - smaller */
.users-table-wrapper .users-table-row .users-table-cell .role-badge {
  font-size: 0.65rem !important;
  padding: 0.1rem 0.5rem;
}

/* ✅ Stall badges - smallest */
.users-table-wrapper .users-table-row .users-table-cell .stall-badge {
  font-size: 0.6rem !important;
  padding: 0.05rem 0.3rem;
}

/* ✅ Status badges - smaller */
.users-table-wrapper .users-table-row .users-table-cell .status-badge {
  font-size: 0.6rem !important;
  padding: 0.05rem 0.3rem;
}

/* ✅ No stalls text */
.users-table-wrapper .users-table-row .users-table-cell .no-stalls {
  font-size: 0.6rem !important;
}

/* ✅ Action buttons - smaller */
.users-table-wrapper .users-table-row .users-table-cell .btn-action {
  font-size: 0.6rem !important;
  padding: 0.1rem 0.3rem;
}

/* ============================================ */
/* MENU PERFORMANCE BREAKDOWN GRID - 5 CARDS   */
/* ============================================ */
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

.menu-performance-breakdown-grid .stat-chip .stat-chip-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
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
/* BULK ASSIGN MODAL                           */
/* ============================================ */
.bulk-assign-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
}

.bulk-assign-summary p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
}

.bulk-assign-summary p strong {
  color: var(--text);
}

.bulk-assign-total {
  font-weight: 600;
  color: var(--primary) !important;
}

.bulk-assign-total strong {
  color: var(--primary);
  font-size: 1rem;
}

.bulk-assign-stalls {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
}

.bulk-assign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 0.5rem;
}

.bulk-assign-select-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.bulk-assign-select-all input[type="checkbox"] {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.bulk-assign-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.bulk-assign-stall-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bulk-assign-stall-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.bulk-assign-stall-item:hover {
  background: var(--background);
}

.bulk-assign-stall-item input[type="checkbox"] {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.bulk-assign-stall-item .stall-name {
  font-weight: 500;
  font-size: 0.85rem;
  flex: 1;
}

.bulk-assign-stall-item .stall-code {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  font-family: monospace;
}

.bulk-assign-stall-item .stall-status {
  font-size: 0.8rem;
}

.bulk-assign-stall-item .stall-status.active { color: #10b981; }
.bulk-assign-stall-item .stall-status.inactive { color: #6b7280; }

/* ============================================ */
/* RESPONSIVE - MENU PERFORMANCE                */
/* ============================================ */
@media (max-width: 1024px) {
  .menu-performance-breakdown-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .menu-performance-breakdown-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .bulk-assign-summary {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

@media (max-width: 480px) {
  .menu-performance-breakdown-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .menu-performance-breakdown-grid .stat-chip {
    padding: 0.35rem 0.6rem;
  }
  
  .menu-performance-breakdown-grid .stat-chip .stat-chip-value {
    font-size: 1rem;
  }
  
  .menu-performance-breakdown-grid .stat-chip .stat-chip-label {
    font-size: 0.6rem;
  }
  
  .bulk-assign-stall-item {
    padding: 0.2rem 0.3rem;
    font-size: 0.8rem;
  }
  
  .bulk-assign-stall-item .stall-name {
    font-size: 0.75rem;
  }
}

/* Mode Toggle */
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

/* Bulk Mode */
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

.bulk-mode .stall-name {
  font-weight: 500;
  font-size: 0.85rem;
  flex: 1;
}

.bulk-mode .stall-code {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  font-family: monospace;
}

.bulk-mode .stall-status {
  font-size: 0.8rem;
}
.bulk-mode .stall-status.active { color: #10b981; }
.bulk-mode .stall-status.inactive { color: #6b7280; }

.bulk-mode .menu-name {
  font-weight: 500;
  font-size: 0.85rem;
  flex: 1;
}

.bulk-mode .menu-price {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
}

.bulk-mode .menu-category {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
}

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

/* Responsive */
@media (max-width: 768px) {
  .bulk-mode .stall-checkbox-grid,
  .bulk-mode .menu-checkbox-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .bulk-mode .step-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .bulk-mode .bulk-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .bulk-mode .stall-checkbox-grid,
  .bulk-mode .menu-checkbox-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================ */
/* STALL MENU VIEW                              */
/* ============================================ */
.stall-view-toggle {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

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

.stall-menu-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
}

.stall-menu-code {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  font-family: monospace;
}

.stall-menu-count {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--background);
  padding: 0.05rem 0.5rem;
  border-radius: 10px;
  border: 1px solid var(--border-light);
}

.stall-menu-toggle {
  font-size: 0.7rem;
  color: var(--text-secondary);
  transition: var(--transition);
}

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

.stall-menu-tag .menu-name {
  font-weight: 500;
}

.empty-state-modern.small {
  padding: 0.5rem;
}

.empty-state-modern.small span {
  font-size: 1.2rem;
}

.empty-state-modern.small p {
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 480px) {
  .stall-menu-info {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .stall-menu-name {
    font-size: 0.8rem;
  }
  
  .stall-menu-count {
    font-size: 0.6rem;
  }
}

/* ============================================ */
/* REVENUE TAB STYLES                           */
/* ============================================ */

/* Stats Grid - 5 Cards */
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

.revenue-stats-grid .stat-chip .stat-chip-value.positive {
  color: #10b981;
}

.revenue-stats-grid .stat-chip .stat-chip-value.negative {
  color: #ef4444;
}

.revenue-stats-grid .stat-chip .stat-chip-sub {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.revenue-stats-grid .stat-chip.revenue .stat-chip-value { color: #F94908; }
.revenue-stats-grid .stat-chip.transactions .stat-chip-value { color: #2563eb; }
.revenue-stats-grid .stat-chip.average .stat-chip-value { color: #7c3aed; }
.revenue-stats-grid .stat-chip.growth .stat-chip-value { font-size: 1.1rem; }
.revenue-stats-grid .stat-chip.top-stall .stat-chip-value { 
  color: #f59e0b; 
  font-size: 0.9rem;
}

/* Revenue Charts Grid */
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

/* Revenue Table */
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
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  min-width: 700px;
}

.revenue-table-header .sortable {
  cursor: pointer;
  user-select: none;
  transition: var(--transition);
}

.revenue-table-header .sortable:hover {
  color: var(--text);
}

.revenue-table-header .sort-arrow {
  font-size: 0.5rem;
  margin-left: 0.15rem;
  color: var(--text-tertiary);
}

.revenue-table-rank { min-width: 50px; text-align: center; }
.revenue-table-name { flex: 1.5; min-width: 100px; text-align: left; }
.revenue-table-state { flex: 0.8; min-width: 80px; text-align: left; }
.revenue-table-revenue { flex: 1; min-width: 80px; text-align: right; }
.revenue-table-transactions { flex: 0.8; min-width: 70px; text-align: right; }
.revenue-table-avg { flex: 0.8; min-width: 70px; text-align: right; }
.revenue-table-status { flex: 0.8; min-width: 80px; text-align: center; }
.revenue-table-details { min-width: 40px; text-align: center; }

.revenue-table-body {
  display: flex;
  flex-direction: column;
}

.revenue-table-row {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: var(--transition);
  min-width: 700px;
}

.revenue-table-row:hover {
  background: var(--background);
}

.revenue-table-row:last-child {
  border-bottom: none;
}

.revenue-table-rank { min-width: 50px; text-align: center; }
.revenue-table-name { flex: 1.5; min-width: 100px; text-align: left; }
.revenue-table-state { flex: 0.8; min-width: 80px; text-align: left; }
.revenue-table-revenue { flex: 1; min-width: 80px; text-align: right; font-weight: 600; color: var(--text); }
.revenue-table-transactions { flex: 0.8; min-width: 70px; text-align: right; color: var(--text-secondary); }
.revenue-table-avg { flex: 0.8; min-width: 70px; text-align: right; color: var(--text-secondary); }
.revenue-table-status { flex: 0.8; min-width: 80px; text-align: center; }
.revenue-table-details { min-width: 40px; text-align: center; font-size: 0.8rem; color: var(--text-tertiary); }

.revenue-table-row:hover .revenue-table-details {
  color: var(--primary);
}

.stall-code-text {
  display: block;
  font-size: 0.55rem;
  color: var(--text-tertiary);
  font-family: monospace;
}

.state-tag {
  display: inline-block;
  padding: 0.05rem 0.4rem;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  font-size: 0.6rem;
  color: var(--text-secondary);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.loading-state .loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
}

.loading-state .spinner-ring {
  width: 100%;
  height: 100%;
  border: 3px solid var(--border);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive - Revenue Tab */
@media (max-width: 1024px) {
  .revenue-stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .revenue-charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .revenue-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .revenue-stats-grid .stat-chip .stat-chip-value {
    font-size: 1rem;
  }
  
  .revenue-table-header {
    font-size: 0.55rem;
    padding: 0.3rem 0.5rem;
  }
  
  .revenue-table-row {
    padding: 0.3rem 0.5rem;
  }
  
  .revenue-table-rank { min-width: 35px; }
  .revenue-table-name { min-width: 70px; }
  .revenue-table-state { min-width: 60px; }
  .revenue-table-revenue { min-width: 60px; font-size: 0.8rem; }
  .revenue-table-transactions { min-width: 50px; font-size: 0.8rem; }
  .revenue-table-avg { min-width: 50px; font-size: 0.8rem; }
  .revenue-table-status { min-width: 60px; }
  .revenue-table-details { min-width: 30px; }
  
  .rank-number {
    width: 22px;
    height: 22px;
    font-size: 0.6rem;
  }
  
  .status-indicator {
    font-size: 0.5rem;
    padding: 0.05rem 0.3rem;
  }
}

@media (max-width: 480px) {
  .revenue-stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  .revenue-stats-grid .stat-chip {
    padding: 0.35rem 0.6rem;
  }
  
  .revenue-stats-grid .stat-chip .stat-chip-value {
    font-size: 0.9rem;
  }
  
  .revenue-stats-grid .stat-chip .stat-chip-label {
    font-size: 0.55rem;
  }
}

</style>