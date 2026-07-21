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
      <span class="card-subtitle">{{ stallPerformanceSubtitle }}</span>
    </div>
    <button 
      @click="switchTabWithSubTab('stalls', 'performance')" 
      class="btn-modern secondary small"
    >
      View All →
    </button>
  </div>
  <div class="card-modern-body stall-performance-table-container">
    <!-- Show empty state when no stalls have sales -->
    <div v-if="displayStalls.length === 0" class="empty-state-modern">
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
          v-for="(stall, index) in displayStalls" 
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
        <button @click="openBulkUpdateModal" class="btn-modern primary" :disabled="selectedStalls.length === 0">
          📦 Bulk Update ({{ selectedCount }})
        </button>
        <button @click="loadAllStallsInventory()" class="btn-modern secondary small">
          ⟳ Refresh
        </button>
        <button @click="exportInventory" class="btn-modern secondary small">
          ⬇ Export
        </button>
      </div>
    </div>
    <div class="card-modern-body">
      
      <!-- ✅ Stats Cards -->
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

      <!-- ✅ Filter Bar -->
      <div class="filter-bar-modern">
        <div class="filter-search">
          <input 
            type="text" 
            v-model="inventorySearch" 
            placeholder="Search stalls or materials..." 
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <select v-model="stateFilter" class="filter-select">
            <option v-for="state in malaysiaStates" :key="state" :value="state">
              {{ state }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <select v-model="inventoryFilter" class="filter-select">
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

      <!-- ✅ Stall Table -->
      <div v-if="stalls.length === 0" class="empty-state-modern">
        <span>📦</span>
        <p>No stalls found. Contact your administrator.</p>
      </div>

      <div v-else class="inventory-table-wrapper">
        <!-- Table Header -->
        <div class="inventory-table-header">
          <div class="inventory-table-cell checkbox">
            <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
          </div>
          <div class="inventory-table-cell name">Stall</div>
          <div class="inventory-table-cell state">State</div>
          <div class="inventory-table-cell items">Items</div>
          <div class="inventory-table-cell status">Status</div>
          <div class="inventory-table-cell actions">Actions</div>
        </div>

        <!-- Table Rows -->
        <div 
          v-for="stall in filteredInventoryStalls" 
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
            <span v-for="item in getStallInventorySummary(stall.id)" :key="item.material_name" class="item-tag">
              {{ item.material_name }}: {{ item.current_level }}{{ getUnit(item.material_name) }}
              <span v-if="item.current_level <= item.alert_level" class="item-tag-warning">⚠️</span>
            </span>
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
            <button @click="toggleInventoryStall(stall.id)" class="btn-icon" :title="expandedInventoryStall === stall.id ? 'Collapse' : 'Expand'">
              {{ expandedInventoryStall === stall.id ? '−' : '+' }}
            </button>
            <button @click="quickUpdateStall(stall.id)" class="btn-icon" title="Quick Update">
              ⚡
            </button>
          </div>
        </div>
      </div>

      <!-- ✅ Expanded Inventory Details -->
      <div v-for="stall in filteredInventoryStalls" :key="'detail-' + stall.id">
        <div v-if="expandedInventoryStall === stall.id" class="inventory-detail-expanded">
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
            <button @click="bulkUpdateStallInventory(stall.id)" class="btn-modern primary small">📦 Bulk Update</button>
            <button @click="resetInventoryToAlert(stall.id)" class="btn-modern secondary small">Reset to Alert</button>
          </div>
        </div>
      </div>

      <!-- ✅ Low Stock Alerts -->
      <div v-if="lowStock.length > 0" class="alerts-section">
        <h4 class="alerts-title">⚠️ Low Stock Alerts</h4>
        <div v-for="item in filteredLowStock" :key="item.stall_name + item.material_name" class="alert-row">
          <span class="alert-row-stall">{{ item.stall_name }}</span>
          <span class="alert-row-material">{{ item.material_name }}</span>
          <span class="alert-row-level">{{ item.current_level }}{{ getUnit(item.material_name) }}</span>
          <span class="alert-row-threshold">(Alert: {{ item.alert_level }}{{ getUnit(item.material_name) }})</span>
          <button @click="quickAddStockByItem(item)" class="btn-modern primary small">+5</button>
        </div>
      </div>
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
        
        <!-- Stall Performance - Full List -->
        <div v-else-if="stallSubTab === 'performance'" class="sub-tab-content">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>📊 Stall Performance</h3>
                <span class="card-subtitle">All stalls ranked by revenue for {{ getPeriodLabel() }}</span>
              </div>
              <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
            </div>
            <div class="card-modern-body stall-performance-table-container">
              <div v-if="stallPerformance.length === 0" class="empty-state-modern">
                <span>📊</span>
                <p>No sales data available for {{ getPeriodLabel() }}</p>
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
                    v-for="(stall, index) in stallPerformance" 
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
        
        <!-- Menu Assignment -->
        <div v-if="menuSubTab === 'assignment'" class="sub-tab-content">
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
        
        <!-- Menu Performance - Full List -->
        <div v-else-if="menuSubTab === 'performance'" class="sub-tab-content">
          <div class="card-modern">
            <div class="card-modern-header">
              <div>
                <h3>📊 Menu Performance</h3>
                <span class="card-subtitle">All menu items ranked by sales for {{ getPeriodLabel() }}</span>
              </div>
              <button @click="refreshAllData" class="btn-modern secondary small">⟳ Refresh</button>
            </div>
            <div class="card-modern-body menu-performance-table-container">
              <div v-if="menuPerformance.length === 0" class="empty-state-modern">
                <span>📊</span>
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
                    v-for="(item, index) in menuPerformance" 
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
        { id: 'menu', label: 'Menu', icon: '📋' }
      ],

      selectedStalls: [],
      selectAll: false,

          // ✅ New: Malaysian States
    malaysiaStates: [
      'All States', 'Selangor', 'Kuala Lumpur', 'Putrajaya',
      'Johor', 'Kedah', 'Kelantan', 'Melaka', 
      'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
      'Penang', 'Sabah', 'Sarawak', 'Terengganu', 'Labuan'
    ],
    stateFilter: 'All States',
    
    // ✅ New: Bulk Update
    bulkUpdateModal: false,
    bulkUpdateMaterials: [],
    bulkUpdateMode: 'selected', // 'selected' | 'all' | 'low-stock'
    bulkUpdateProgress: 0,
    bulkUpdating: false,
    bulkUpdateType: 'set', // 'set' | 'add' | 'subtract'
    bulkUpdateValue: 10,
    
    // ✅ New: Quick Actions
    quickActions: [
      { label: 'Set to Alert Level', value: 'alert' },
      { label: 'Set to 100', value: '100' },
      { label: 'Set to 50', value: '50' },
      { label: 'Add +10', value: 'add10' },
      { label: 'Add +20', value: 'add20' },
      { label: 'Reset to 0', value: '0' }
    ]
  }
      
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
      savedAssignmentType: 'success',
    }
  },

  computed: {

    // ✅ Counts for stats cards
inventoryStats() {
  const total = this.filteredInventoryStalls.length
  const active = this.filteredInventoryStalls.filter(s => s.is_active).length
  const inactive = this.filteredInventoryStalls.filter(s => !s.is_active).length
  const lowStock = this.filteredInventoryStalls.filter(s => this.hasLowStock(s.id)).length
  return { total, active, inactive, lowStock }
},

// ✅ Selected stalls count
selectedCount() {
  return this.selectedStalls.length
},

// ✅ Bulk update preview
bulkUpdatePreview() {
  const stalls = this.bulkUpdateMode === 'all' 
    ? this.filteredInventoryStalls 
    : this.filteredInventoryStalls.filter(s => this.selectedStalls.includes(s.id))
  return stalls
}

    stallPerformanceSubtitle() {
    const count = this.displayStalls.length
    if (count === 0) return `No stalls with sales for ${this.getPeriodLabel()}`
    if (count === 1) return `Top stall with sales for ${this.getPeriodLabel()}`
    return `Top ${count} stalls with sales for ${this.getPeriodLabel()}`
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
    
    filteredMenuItemsForAssignment() {
      return this.menuItems.sort((a, b) => a.item_name.localeCompare(b.item_name))
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

     selectedPeriod(newVal, oldVal) {
    if (newVal !== oldVal) {
      // ✅ Clear all data when period changes
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

  // ✅ Toggle Select All
  toggleSelectAll() {
    this.selectAll = !this.selectAll
    if (this.selectAll) {
      this.selectedStalls = this.filteredInventoryStalls.map(s => s.id)
    } else {
      this.selectedStalls = []
    }
  },

  // ✅ Clear Filters
  clearFilters() {
    this.inventorySearch = ''
    this.stateFilter = 'All States'
    this.inventoryFilter = 'all'
  },

  // ✅ Open Bulk Update Modal
  openBulkUpdateModal() {
    // Get all unique materials from selected stalls
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

  // ✅ Apply Quick Action
  applyQuickAction(action) {
    this.bulkUpdateMaterials.forEach(material => {
      let value = 0
      switch (action.value) {
        case 'alert':
          // Get alert level from first stall
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

  // ✅ Execute Bulk Update
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
          
          // Get current level
          const inventory = this.getStallInventory(stall.id)
          const item = inventory.find(i => i.material_name === material.name)
          
          if (item) {
            if (material.operation === 'add') {
              newLevel = item.current_level + material.value
            } else if (material.operation === 'subtract') {
              newLevel = Math.max(0, item.current_level - material.value)
            }
            // 'set' uses the value directly
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

  // ✅ Export Inventory
  exportInventory() {
    // Similar to existing export, but with inventory data
    this.exportCurrentTab()
  },

  // ✅ Quick Add Stock by Item (for alerts)
  async quickAddStockByItem(item) {
    await this.quickAddStock(
      this.stalls.find(s => s.name === item.stall_name)?.id,
      item.material_name,
      5
    )
  },

  // ✅ Quick Update Single Stall
  quickUpdateStall(stallId) {
    this.toggleInventoryStall(stallId)
    // Scroll to the expanded view
    this.$nextTick(() => {
      const el = document.querySelector(`[data-stall-id="${stallId}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
}

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
    // ✅ Use getWeekStart() which starts on Monday
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
      // ✅ Create label with month + year
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

// =============================================
// STALL DETAIL CHART - LABEL FORMATTING
// =============================================

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
  // ✅ Use getWeekStart() which starts on Monday
  const weekStart = this.getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6) // Monday + 6 = Sunday
  
  const startDay = weekStart.getUTCDate()
  const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
  const endDay = weekEnd.getUTCDate()
  const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
  
  // ✅ Simplified format: "20-26 Jul" or "27 Jul-2 Aug"
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
  // ✅ PRIMARY: Use consolidatedSales (already filtered for current period)
  if (this.consolidatedSales.topStall && this.consolidatedSales.topStall !== '-') {
    return this.consolidatedSales.topStall
  }
  
  // ✅ SECONDARY: Use salesTrend
  if (this.salesTrend && this.salesTrend.length > 0) {
    const totalRevenue = this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0)
    if (totalRevenue > 0 && this.stalls.length > 0) {
      return this.stalls[0]?.name || '-'
    }
  }
  
  // ✅ FALLBACK: Use stallPerformance (total data)
  if (this.stallPerformance && this.stallPerformance.length > 0) {
    let topStall = null
    let maxRevenue = 0
    for (const stall of this.stallPerformance) {
      const revenue = parseFloat(stall.revenue) || 0
      if (revenue > maxRevenue) {
        maxRevenue = revenue
        topStall = stall
      }
    }
    if (topStall && maxRevenue > 0) {
      return topStall.name || topStall.stall_name || '-'
    }
  }
  
  return '-'
},

getTopStallRevenue() {
  // ✅ PRIMARY: Use consolidatedSales (already filtered for current period)
  if (this.consolidatedSales.topRevenue && this.consolidatedSales.topRevenue > 0) {
    return this.consolidatedSales.topRevenue
  }
  
  // ✅ SECONDARY: Use salesTrend (already filtered for current period)
  if (this.salesTrend && this.salesTrend.length > 0) {
    return this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0)
  }
  
  // ✅ FALLBACK: Use stallPerformance (total data)
  if (this.stallPerformance && this.stallPerformance.length > 0) {
    let maxRevenue = 0
    for (const stall of this.stallPerformance) {
      const revenue = parseFloat(stall.revenue) || 0
      if (revenue > maxRevenue) {
        maxRevenue = revenue
      }
    }
    if (maxRevenue > 0) {
      return maxRevenue
    }
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
// SPARKLINE HELPER
// =============================================
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

    // =============================================
    // STALL PERFORMANCE - STATUS EMOJI
    // =============================================
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

    // =============================================
    // MENU PERFORMANCE - STATUS METHODS
    // =============================================
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

    // =============================================
    // CUSTOM DATE RANGE
    // =============================================
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
    const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!dateParts) return dateStr;
    
    // ✅ The date from backend is already in Malaysia time
    // Just use the hour as-is (it's already correct)
    const hour = parseInt(dateParts[4]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hours12 = hour % 12 || 12;
    
    return `${hours12}:00 ${ampm}`;
  }
  
  // For custom range, show smart labels
  if (this.selectedPeriod === 'custom') {
    const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateParts) return dateStr;
    const date = new Date(Date.UTC(
      parseInt(dateParts[1]),
      parseInt(dateParts[2]) - 1,
      parseInt(dateParts[3])
    ));
    return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  
  // For quarter, halfyear, year - show month names
  if (this.selectedPeriod === 'quarter' || 
      this.selectedPeriod === 'halfyear' || 
      this.selectedPeriod === 'year') {
    const dateParts = dateStr.match(/(\d{4})-(\d{2})/);
    if (!dateParts) return dateStr;
    const date = new Date(Date.UTC(
      parseInt(dateParts[1]),
      parseInt(dateParts[2]) - 1,
      1
    ));
    return date.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' });
  }
  
  // For week grouping in month view
  if (this.selectedPeriod === 'month') {
    if (dateStr.includes('W')) return dateStr;
    const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateParts) return dateStr;
    const date = new Date(Date.UTC(
      parseInt(dateParts[1]),
      parseInt(dateParts[2]) - 1,
      parseInt(dateParts[3])
    ));
    const weekStart = this.getWeekStart(date);
    return weekStart.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  
// For week view, show day name + date + month (e.g., "Mon 20 Jul")
if (this.selectedPeriod === 'week') {
  const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!dateParts) return dateStr;
  const date = new Date(Date.UTC(
    parseInt(dateParts[1]),
    parseInt(dateParts[2]) - 1,
    parseInt(dateParts[3])
  ));
  const dayOfWeek = date.getUTCDay();
  const orderedDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayName = orderedDayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
  const dayNum = date.getUTCDate();
  const month = date.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' });
  return `${dayName} ${dayNum} ${month}`;  // ✅ Day + Date + Month
}
  
  // Default fallback
  const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!dateParts) return dateStr;
  const date = new Date(Date.UTC(
    parseInt(dateParts[1]),
    parseInt(dateParts[2]) - 1,
    parseInt(dateParts[3])
  ));
  return date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
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
    // ✅ FIX: Use day.date instead of dateStr
    const dateParts = day.date.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!dateParts) return '-';
    
    const hour = parseInt(dateParts[4]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hours12 = hour % 12 || 12;
    
    return `${hours12}:00 ${ampm}`;
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

  // ✅ Determine grouping based on period
  let grouping;
  let dateFormat;

  if (period === 'today') {
    grouping = 'hour';
  } else if (period === 'week') {
    grouping = 'day';
  } else if (period === 'month') {
    grouping = 'week';
  } else if (period === 'quarter' || period === 'halfyear' || period === 'year') {
    grouping = 'month';
  } else if (period === 'custom') {
    // ✅ For custom date range, decide grouping based on number of days
    const customDays = this.customDays || 30;
    if (customDays <= 14) {
      grouping = 'day';
    } else if (customDays <= 60) {
      grouping = 'week';
    } else {
      grouping = 'month';
    }
  } else {
    grouping = 'day'; // default
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

    // ✅ Group data based on the selected period
    let groupedData = this.groupSalesData(salesData, grouping, period)
    
    // ✅ Format labels based on grouping and period
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
        // ✅ Format based on the grouping
        const customDays = this.customDays || 30;
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

    // ✅ Build tooltip formatter based on period
    const tooltipFormatter = (params) => {
      const index = params[0]?.dataIndex || 0
      const revenue = parseFloat(revenues[index]) || 0
      const itemsCount = parseInt(items[index]) || 0
      const dateLabel = chartLabels[index] || ''
      
      let tooltipLabel = dateLabel
      
      // ✅ Add full date for week view tooltip
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
      
      // ✅ For custom view, show appropriate tooltip
      if (period === 'custom' && groupedData[index]) {
        const customDays = this.customDays || 30;
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
          // Week range tooltip
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

    // ✅ Determine label rotation based on label length
    const maxLabelLength = chartLabels.reduce((max, label) => Math.max(max, label.length), 0)
    const labelRotate = maxLabelLength > 12 ? 30 : 0

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
    
    // =============================================
    // HELPER
    // =============================================
    getTodayInMalaysia() {
      const now = new Date()
      const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
      const today = new Date(malaysiaTime)
      today.setHours(0, 0, 0, 0)
      return today
    },
    
    // =============================================
    // GROUPING HELPERS
    // =============================================
groupSalesByWeek(dailySales) {
  if (!dailySales || dailySales.length === 0) return []
  
  const grouped = {}
  
  dailySales.forEach(day => {
    const date = new Date(day.date)
    // ✅ Use getWeekStart() which starts on Monday
    const weekStart = this.getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6) // Monday + 6 = Sunday
    
    const key = weekStart.toISOString().split('T')[0]
    
    if (!grouped[key]) {
      const startDay = weekStart.getUTCDate()
      const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
      const endDay = weekEnd.getUTCDate()
      const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' })
      
      let label;
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
      // ✅ Add year to the label
      const label = date.toLocaleDateString('en-MY', { 
        month: 'short', 
        year: 'numeric',
        timeZone: 'UTC'
      })
      grouped[key] = {
        date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        label: label,  // ✅ Month + Year
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
  
  // ✅ If days <= 14, group by day with proper labels
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
  
  // ✅ If days <= 60, group by week with week ranges
  if (days <= 60) {
    return this.groupSalesByWeek(dailySales)
  }
  
  // ✅ If days > 60, group by month with month + year
  return this.groupSalesByMonth(dailySales)
},

    getWeekNumber(date) {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
      const week1 = new Date(d.getFullYear(), 0, 4)
      return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
    },

    
    // =============================================
    // SPLIT TODAY'S DATA INTO HOURLY BUCKETS
    // =============================================
    splitTodayIntoHours(dailySales) {
  if (!dailySales || dailySales.length === 0) return []
  
  // ✅ If data already has multiple records, use as-is
  if (dailySales.length > 1) {
    return dailySales
  }
  
  const dayData = dailySales[0]
  if (!dayData) return []
  
  const totalRevenue = dayData.revenue || 0
  const totalItems = dayData.items || 0
  
  // ✅ If there's REAL data, return it AS-IS
  if (totalRevenue > 0 || totalItems > 0) {
    return dailySales
  }
  
  // ✅ No data → return empty
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
  
  // ✅ Format dates based on period
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
            // ✅ Today: Show Malaysia time (UTC+8)
            const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
            if (dateParts) {
              const hour = parseInt(dateParts[4]);
              const minute = parseInt(dateParts[5]);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hours12 = hour % 12 || 12;
              const minutes = String(minute).padStart(2, '0');
              formattedDate = `${hours12}:${minutes} ${ampm}`;
            }
          } else if (this.selectedPeriod === 'week') {
            // ✅ Week: Show full date with day name
            const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateParts) {
              const date = new Date(Date.UTC(
                parseInt(dateParts[1]),
                parseInt(dateParts[2]) - 1,
                parseInt(dateParts[3])
              ));
              formattedDate = date.toLocaleDateString('en-MY', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC'
              });
            }
          } else if (this.selectedPeriod === 'month') {
            // ✅ Month: Show week range
            if (data[index]?.displayLabel) {
              formattedDate = data[index].displayLabel
            } else {
              const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (dateParts) {
                const date = new Date(Date.UTC(
                  parseInt(dateParts[1]),
                  parseInt(dateParts[2]) - 1,
                  parseInt(dateParts[3])
                ));
                const weekStart = this.getWeekStart(date);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const startDay = weekStart.getUTCDate();
                const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' });
                const endDay = weekEnd.getUTCDate();
                const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' });
                if (startMonth === endMonth) {
                  formattedDate = `${startDay}-${endDay} ${startMonth}`;
                } else {
                  formattedDate = `${startDay} ${startMonth}-${endDay} ${endMonth}`;
                }
              }
            }
          } else if (this.selectedPeriod === 'quarter' || 
                     this.selectedPeriod === 'halfyear' || 
                     this.selectedPeriod === 'year') {
            // ✅ Quarter/Half Year/Year: Show month + year
            const dateParts = dateStr.match(/(\d{4})-(\d{2})/);
            if (dateParts) {
              const date = new Date(Date.UTC(
                parseInt(dateParts[1]),
                parseInt(dateParts[2]) - 1,
                1
              ));
              formattedDate = date.toLocaleDateString('en-MY', { 
                month: 'short', 
                year: 'numeric',
                timeZone: 'UTC'
              });
            }
          } else if (this.selectedPeriod === 'custom') {
            // ✅ Custom: Show appropriate format based on range
            const customDays = this.customDays || 30;
            const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateParts) {
              const date = new Date(Date.UTC(
                parseInt(dateParts[1]),
                parseInt(dateParts[2]) - 1,
                parseInt(dateParts[3])
              ));
              if (customDays <= 14) {
                formattedDate = date.toLocaleDateString('en-MY', { 
                  weekday: 'short',
                  day: 'numeric', 
                  month: 'short',
                  timeZone: 'UTC'
                });
              } else if (customDays <= 60) {
                const weekStart = this.getWeekStart(date);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const startDay = weekStart.getUTCDate();
                const startMonth = weekStart.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' });
                const endDay = weekEnd.getUTCDate();
                const endMonth = weekEnd.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' });
                if (startMonth === endMonth) {
                  formattedDate = `${startDay}-${endDay} ${startMonth}`;
                } else {
                  formattedDate = `${startDay} ${startMonth}-${endDay} ${endMonth}`;
                }
              } else {
                formattedDate = date.toLocaleDateString('en-MY', { 
                  month: 'short', 
                  year: 'numeric',
                  timeZone: 'UTC'
                });
              }
            }
          } else {
            // ✅ Default: Show full date
            const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateParts) {
              const date = new Date(Date.UTC(
                parseInt(dateParts[1]),
                parseInt(dateParts[2]) - 1,
                parseInt(dateParts[3])
              ));
              const day = date.getUTCDate();
              const monthName = date.toLocaleDateString('en-MY', { month: 'short', timeZone: 'UTC' });
              const yearNum = date.getUTCFullYear();
              const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
              formattedDate = `${day}${suffix} ${monthName} ${yearNum}`;
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
  if (!day) return ''
  
  if (this.selectedPeriod === 'today') {
    // ✅ FIX: Use day.date instead of dateStr
    const dateParts = day.date.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!dateParts) return '';
    
    const hour = parseInt(dateParts[4]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hours12 = hour % 12 || 12;
    
    return `${hours12}:00 ${ampm}`;
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
    
    // ✅ Clear previous data when loading new period
    if (this.selectedPeriod === 'today' || this.selectedPeriod === 'week') {
      this.stallPerformance = []
      this.menuPerformance = []
      this.salesTrend = []
      this.consolidatedSales.topStall = '-'
      this.consolidatedSales.topRevenue = 0
      this.consolidatedSales.totalRevenue = 0
      this.consolidatedSales.totalItems = 0
    }
    
    // ✅ Step 1: Load stalls first
    await this.loadStalls()
    
    // ✅ Step 2: Load sales analytics (for chart and overview)
    await this.loadSalesAnalytics()
    
    // ✅ Step 3: Load everything else in parallel
    await Promise.all([
      this.loadUsers(),
      this.loadLowStock(),
      this.loadStallPerformance(),  // Now always fetches fresh data
      this.loadMenuItems()
    ])
    
    // ✅ Step 4: Load inventory
    await this.loadAllStallsInventory()
    
    // ✅ Step 5: Reset chart
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
            return false;
          }
          return true;
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
    
    // ✅ FOR TODAY: Split into hourly buckets
    if (this.selectedPeriod === 'today') {
      dailySales = this.splitTodayIntoHours(dailySales)
      console.log('📊 After hourly split:', dailySales.length, 'records')
    }
    
    // ✅ FOR WEEK: Filter to current week only (Monday-Sunday)
    if (this.selectedPeriod === 'week') {
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const daysToMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1);
      
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - daysToMonday);
      monday.setUTCHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      sunday.setUTCHours(23, 59, 59, 999);
      
      console.log('📊 Week range (UTC):', monday.toISOString(), 'to', sunday.toISOString());
      
      dailySales = dailySales.filter(day => {
        const date = new Date(day.date);
        const timestamp = date.getTime();
        return timestamp >= monday.getTime() && timestamp <= sunday.getTime();
      });
      
      console.log('📊 Filtered to current week:', dailySales.length, 'records');
    }
    
    // For month view - group by week
    if (this.selectedPeriod === 'month') {
      dailySales = this.groupSalesByWeek(dailySales)
    } 
    else if (this.selectedPeriod === 'quarter' || this.selectedPeriod === 'halfyear') {
      dailySales = this.groupSalesByMonth(dailySales)
    } 
    else if (this.selectedPeriod === 'year') {
      dailySales = this.groupSalesByMonth(dailySales)
    } 
    else if (this.selectedPeriod === 'custom') {
      dailySales = this.groupSalesCustom(dailySales)
    }
    
    this.salesTrend = dailySales
    
    console.log('📊 Final salesTrend:', this.salesTrend.length, 'records')
    
    // Calculate totals
    const totalRevenue = dailySales.reduce((sum, d) => sum + (d.revenue || 0), 0)
    const totalItems = dailySales.reduce((sum, d) => sum + (d.items || 0), 0)
    
    console.log('📊 Total revenue:', totalRevenue, 'Total items:', totalItems)
    
    this.consolidatedSales.totalItems = totalItems
    this.consolidatedSales.totalRevenue = totalRevenue
    this.consolidatedSales.averagePerStall = this.stalls.length > 0 ? 
      totalRevenue / this.stalls.length : 0
    
    // ✅ Use topStall from API response (already filtered)
    if (data.topStall && data.topStall !== '-') {
      this.consolidatedSales.topStall = data.topStall
      this.consolidatedSales.topRevenue = parseFloat(data.topRevenue) || 0
    } else {
      // Don't override if no data - let stall performance set it
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
  // ✅ Calculate days based on selected period
  const days = this.selectedPeriod === 'today' ? 1 :
               this.selectedPeriod === 'week' ? 7 :
               this.selectedPeriod === 'month' ? 30 :
               this.selectedPeriod === 'quarter' ? 90 :
               this.selectedPeriod === 'halfyear' ? 180 :
               this.selectedPeriod === 'year' ? 365 :
               this.customDays || 30
  
  try {
    const stallIds = this.stalls.map(s => s.id)
    if (!stallIds || stallIds.length === 0) {
      this.stallPerformance = []
      console.log('✅ Stall performance loaded: 0 (no stalls)')
      return
    }
    
    // ✅ Always fetch fresh data - don't depend on salesTrend
    const res = await axios.get(
      `${API_BASE}/stall-performance?days=${days}&stallIds=${stallIds.join(',')}`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    )
    
    // ✅ API now returns only stalls with revenue > 0 (backend handles filtering)
    this.stallPerformance = res.data || []
    
    // ✅ Update top stall from stall data (not from salesTrend)
    if (this.stallPerformance.length > 0) {
      const topStall = this.stallPerformance[0] // Already sorted by revenue
      this.consolidatedSales.topStall = topStall.name || '-'
      this.consolidatedSales.topRevenue = parseFloat(topStall.revenue) || 0
    }
    // If no stall performance data, keep whatever was set by loadSalesAnalytics
    
    console.log('✅ Stall performance loaded:', this.stallPerformance.length)
  } catch (err) {
    console.error('Failed to load stall performance:', err)
    this.stallPerformance = []
  }
},

async loadMenuPerformance() {
  try {
    const productSales = this.productSales || {}
    
    // ✅ Check if there's any data for this period
    const hasPeriodSales = this.salesTrend && this.salesTrend.length > 0
    const periodRevenue = hasPeriodSales ? this.salesTrend.reduce((sum, d) => sum + (d.revenue || 0), 0) : 0
    const periodItems = hasPeriodSales ? this.salesTrend.reduce((sum, d) => sum + (d.items || 0), 0) : 0
    
    // ✅ If no sales for this period, clear menu performance
    if (!hasPeriodSales || (periodRevenue === 0 && periodItems === 0)) {
      this.menuPerformance = []
      console.log('📊 Menu performance: 0 items (no sales for this period)')
      return
    }
    
    // ✅ Filter items with revenue > 0
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
    
    // ✅ For today or week, only show items with revenue > 0
    if (this.selectedPeriod === 'today' || this.selectedPeriod === 'week') {
      const periodItemsList = filteredItems.filter(item => item.revenue > 0 && item.quantity > 0)
      this.menuPerformance = periodItemsList
      console.log(`📊 Menu performance for ${this.selectedPeriod}:`, this.menuPerformance.length, 'items')
      return
    }
    
    // ✅ For other periods (month, quarter, year)
    if (filteredItems.length > 0) {
      this.menuPerformance = filteredItems
      return
    }
    
    // ✅ Fallback: fetch from API if no productSales
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
    
    // =============================================
    // MENU ITEMS (For Assignment)
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

/* Inventory Table */
.inventory-table-wrapper {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

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
}

.inventory-table-row {
  display: flex;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
  align-items: center;
}

.inventory-table-row:hover {
  background: var(--background);
}

.inventory-table-row.selected {
  background: rgba(249, 73, 8, 0.05);
  border-left: 3px solid var(--primary);
}

.inventory-table-cell {
  display: flex;
  align-items: center;
}

.inventory-table-cell.checkbox { width: 40px; flex-shrink: 0; }
.inventory-table-cell.name { flex: 1; flex-direction: column; align-items: flex-start; }
.inventory-table-cell.state { width: 100px; flex-shrink: 0; font-size: 0.75rem; color: var(--text-secondary); }
.inventory-table-cell.items { flex: 1.5; flex-wrap: wrap; gap: 0.25rem; }
.inventory-table-cell.status { width: 130px; flex-shrink: 0; flex-wrap: wrap; gap: 0.25rem; }
.inventory-table-cell.actions { width: 80px; flex-shrink: 0; justify-content: flex-end; gap: 0.25rem; }

.inventory-table-cell input[type="checkbox"] {
  accent-color: var(--primary);
  cursor: pointer;
}

.stall-name { font-weight: 500; font-size: 0.85rem; }
.stall-code { font-size: 0.6rem; color: var(--text-tertiary); font-family: monospace; }

.item-tag {
  background: var(--background);
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  font-size: 0.6rem;
  border: 1px solid var(--border-light);
  white-space: nowrap;
}

.item-tag-warning { color: #ef4444; }

.status-badge {
  padding: 0.05rem 0.4rem;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
}

.status-badge.active { background: #d1fae5; color: #059669; }
.status-badge.inactive { background: #f3f4f6; color: #6b7280; }
.status-badge.low { background: #fee2e2; color: #dc2626; }

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

/* Expanded Details */
.inventory-detail-expanded {
  padding: 1rem;
  background: var(--background);
  border-bottom: 1px solid var(--border);
}

/* Bulk Update Modal */
.bulk-mode-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.mode-btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.8rem;
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

.bulk-preview {
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
}

.bulk-stall-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.stall-tag {
  padding: 0.1rem 0.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.7rem;
}

.stall-tag.more {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.bulk-materials h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.quick-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.bulk-material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.bulk-material-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.bulk-material-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  flex: 1;
}

.bulk-material-name {
  font-size: 0.8rem;
  font-weight: 500;
}

.bulk-material-inputs {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.bulk-material-inputs .filter-select.small {
  min-width: 60px;
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
}

.bulk-material-inputs .filter-input.small {
  width: 50px;
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
}

.bulk-material-unit {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  min-width: 30px;
}

/* Progress Bar */
.bulk-progress {
  width: 100%;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.bulk-progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .inventory-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-bar-modern {
    flex-direction: column;
  }
  
  .filter-bar-modern .filter-actions {
    margin-left: 0;
    justify-content: flex-start;
  }
  
  .inventory-table-header,
  .inventory-table-row {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .inventory-table-cell.checkbox { width: 30px; }
  .inventory-table-cell.state { width: 80px; }
  .inventory-table-cell.status { width: 100px; }
  .inventory-table-cell.actions { width: 60px; }
  
  .bulk-material-grid {
    grid-template-columns: 1fr;
  }
}

</style>