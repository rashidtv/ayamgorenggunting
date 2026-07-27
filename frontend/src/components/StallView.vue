<template>
  <div class="stall-view" :class="{ 'with-cart': cartItems.length > 0 }">

    <!-- ===== SHIFT STATUS BAR ===== -->
    <div v-if="shift.enabled" class="shift-status-bar">
      <div class="shift-status-left">
        <span class="shift-indicator" :class="shiftStatus ? 'open' : 'closed'">
          {{ shiftStatus ? '🟢 OPEN' : '⚪ CLOSED' }}
        </span>
        <span class="shift-time" v-if="shiftStatus">
          Opened: {{ formatTime(currentShift?.opened_at) }}
        </span>
        <span class="shift-time" v-else>
          No active shift
        </span>
        <span class="shift-float" v-if="shiftStatus">
          Float: {{ formatCurrency(shiftStartingFloat) }}
        </span>
      </div>
      <div class="shift-status-right">
        <span class="shift-stats" v-if="shiftStatus">
          Revenue: {{ formatCurrency(shiftRevenue) }} | 
          Orders: {{ todayTransactions.length }}
        </span>
        <button @click="openShiftModal" v-if="!shiftStatus" class="btn-shift open">
          🟢 Open Shift
        </button>
        <button @click="closeShiftModal" v-else class="btn-shift close">
          🔴 Close Shift
        </button>
      </div>
    </div>

    <!-- ===== TODAY'S TRANSACTIONS ===== -->
    <div v-if="shift.enabled && shiftStatus" class="today-transactions">
      <div class="today-transactions-header">
        <h4>📋 Today's Orders ({{ todayTransactions.length }})</h4>
        <div class="today-transactions-controls">
          <button @click="refreshTodayTransactions" class="btn-refresh" title="Refresh">⟳</button>
          <button @click="toggleTodayTransactionsExpand" class="btn-expand" :title="showAllTodayTransactions ? 'Collapse' : 'Expand'">
            {{ showAllTodayTransactions ? '▲' : '▼' }}
          </button>
        </div>
      </div>
      <div class="today-transactions-list" :class="{ expanded: showAllTodayTransactions }">
        <div v-if="todayTransactions.length === 0" class="empty-state">
          <span>📭</span>
          <p>No orders yet today</p>
        </div>
        <div 
          v-for="tx in paginatedTodayTransactions" 
          :key="tx.id" 
          class="today-transaction-item"
          @click="viewTransaction(tx)"
        >
          <span class="tx-time">{{ formatTime(tx.created_at) }}</span>
          <span class="tx-id">#{{ tx.order_number }}</span>
          <span class="tx-items">{{ tx.item_count || 0 }} items</span>
          <span class="tx-amount">{{ formatCurrency(tx.total_amount) }}</span>
          <span class="tx-status" :class="tx.status || 'completed'">
            {{ tx.status || 'completed' }}
          </span>
        </div>
        
        <!-- Pagination for Today's Orders -->
        <div v-if="todayTransactions.length > todayItemsPerPage && !showAllTodayTransactions" class="pagination-container compact">
          <div class="pagination-info">
            Showing {{ todayStartIndex }} - {{ todayEndIndex }} of {{ todayTransactions.length }}
          </div>
          <div class="pagination-controls">
            <button 
              @click="prevTodayPage" 
              class="pagination-btn"
              :disabled="todayPage <= 1"
            >
              ◀
            </button>
            <span class="pagination-page">
              {{ todayPage }} / {{ todayTotalPages }}
            </span>
            <button 
              @click="nextTodayPage" 
              class="pagination-btn"
              :disabled="todayPage >= todayTotalPages"
            >
              ▶
            </button>
          </div>
        </div>
        
        <div v-if="todayTransactions.length > 10 && !showAllTodayTransactions" class="view-more">
          <button @click="toggleTodayTransactionsExpand">View All {{ todayTransactions.length }} →</button>
        </div>
        <div v-if="showAllTodayTransactions && todayTransactions.length > 10" class="view-more">
          <button @click="toggleTodayTransactionsExpand">Show Less ↑</button>
        </div>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="connectionError" class="connection-banner error">
      <div class="banner-content">
        <span class="banner-icon">⚠️</span>
        <div class="banner-text">
          <div class="banner-title">Connection Issue</div>
          <div class="banner-desc">Cannot connect to server. Please ensure backend is running.</div>
        </div>
        <button @click="loadData" class="btn btn-outline retry-btn">
          <span class="btn-icon">🔄</span> Retry Connection
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon revenue">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatCurrency(todaySales.total_revenue) }}</div>
          <div class="stat-label">Today's Revenue</div>
          <div class="stat-trend">Live</div>
        </div>
        <div class="stat-glow"></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon items">📦</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatNumber(todaySales.items_sold || 0) }}</div>
          <div class="stat-label">Items Sold</div>
          <div class="stat-trend">Today</div>
        </div>
        <div class="stat-glow"></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon inventory">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ lowStockCount }}</div>
          <div class="stat-label">Low Stock</div>
          <div class="stat-trend" :class="{ warning: lowStockCount > 0 }">
            {{ lowStockCount > 0 ? 'Needs Attention' : 'All Good' }}
          </div>
        </div>
        <div class="stat-glow"></div>
      </div>
    </div>

    <!-- MAIN CONTENT: Menu + Cart Side by Side -->
    <div class="main-content">
      <!-- Left: Menu Items -->
      <div class="menu-section">
        <div class="section-header">
          <div class="section-title">
            <h2>Quick Sales</h2>
            <p>Select items and add to order</p>
          </div>
          <div class="cart-summary-badge" v-if="cartItems.length > 0">
            🛒 {{ cartItemCount }} item{{ cartItemCount > 1 ? 's' : '' }}
          </div>
        </div>

        <!-- DYNAMIC MENU FROM DATABASE -->
        <div v-if="menuItems.length > 0" class="menu-grid">
          <div 
            v-for="item in menuItems" 
            :key="item.item_name"
            class="menu-item-wrapper"
          >
            <div class="menu-item" :class="{ 'has-quantity': menuQuantities[item.item_name] > 0 }">
              <div class="item-image-wrapper">
                <img 
                  v-if="item.image && item.image.startsWith('data:image')" 
                  :src="item.image" 
                  :alt="item.item_name"
                  class="item-image"
                />
                <div v-else class="item-icon">{{ getIcon(item.item_name) }}</div>
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.item_name }}</div>
                <div class="item-description">{{ item.description || 'Delicious fried chicken' }}</div>
                <div class="item-recipe-info" v-if="item.recipe && item.recipe.length > 0">
                  <span class="recipe-badge">📋 {{ item.recipe.length }} ingredient{{ item.recipe.length > 1 ? 's' : '' }}</span>
                </div>
                <div v-else class="item-recipe-info no-recipe">
                  <span class="recipe-badge">✅ No ingredients needed</span>
                </div>
              </div>
              <div class="item-action">
                <div class="item-price">{{ formatCurrency(item.price) }}</div>
                <div class="quantity-controls">
                  <button 
                    @click="adjustQuantity(item, -1)" 
                    class="qty-btn"
                    :disabled="loading || connectionError || !activeStallId || (menuQuantities[item.item_name] || 0) <= 0"
                  >
                    −
                  </button>
                  <span class="qty-display">{{ menuQuantities[item.item_name] || 0 }}</span>
                  <button 
                    @click="adjustQuantity(item, 1)" 
                    class="qty-btn"
                    :disabled="loading || connectionError || !activeStallId"
                  >
                    +
                  </button>
                </div>
              </div>
              <div class="item-glow"></div>
            </div>
          </div>
        </div>

        <!-- EMPTY STATE -->
        <div v-else-if="!loadingData && !loadingMenu" class="empty-state menu-empty">
          <span class="empty-icon">📋</span>
          <h3>No Menu Items Available</h3>
          <p>Please contact your administrator to set up menu items.</p>
        </div>

        <!-- MENU LOADING STATE -->
        <div v-if="loadingMenu" class="loading-state small">
          <div class="loading-spinner small"><div class="spinner-ring"></div></div>
          <p>Loading menu...</p>
        </div>
      </div>

      <!-- Right: Order Cart Panel -->
      <div class="order-panel" v-if="cartItems.length > 0">
        <div class="order-header">
          <h3>🛒 Current Order</h3>
          <button @click="clearCart" class="clear-btn" :disabled="loading">
            🗑️ Clear
          </button>
        </div>
        
        <div class="order-items">
          <div v-for="item in cartItems" :key="item.menuItem.item_name" class="order-item">
            <div class="order-item-info">
              <span class="order-item-name">{{ item.menuItem.item_name }}</span>
              <span class="order-item-qty">×{{ item.quantity }}</span>
            </div>
            <span class="order-item-price">{{ formatCurrency(item.menuItem.price * item.quantity) }}</span>
          </div>
        </div>
        
        <div class="order-total">
          <span class="total-label">TOTAL</span>
          <span class="total-value">{{ formatCurrency(cartTotal) }}</span>
        </div>
        
        <button 
          @click="sellAll" 
          class="sell-all-btn" 
          :disabled="loading || cartItems.length === 0 || (shift.enabled && !shiftStatus)"
        >
          <span v-if="loading">⏳ Processing...</span>
          <span v-else-if="shift.enabled && !shiftStatus">🔒 Open Shift First</span>
          <span v-else>💰 SELL ALL ({{ cartItemCount }} item{{ cartItemCount > 1 ? 's' : '' }})</span>
        </button>
      </div>
    </div>

    <!-- Inventory Management -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <h2>Inventory Management</h2>
          <p>Current stock levels and alerts</p>
        </div>
        <div class="inventory-summary">
          <div class="summary-item"><span class="summary-label">Total Items</span><span class="summary-value">{{ processedInventory.length }}</span></div>
          <div class="summary-item" :class="{ warning: lowStockCount > 0 }"><span class="summary-label">Low Stock</span><span class="summary-value">{{ lowStockCount }}</span></div>
          <div class="summary-item"><span class="summary-label">In Stock</span><span class="summary-value">{{ processedInventory.length - lowStockCount }}</span></div>
        </div>
      </div>
      <div class="inventory-grid">
        <div 
          v-for="item in processedInventory" 
          :key="item.material_name"
          :class="['inventory-item', { 'low-stock': item.current_level <= item.alert_level, 'critical-stock': item.current_level <= item.alert_level * 0.5 }]"
        >
          <div class="inventory-header">
            <div class="material-info">
              <div class="material-icon">📦</div>
              <div class="material-details">
                <div class="material-name">{{ item.material_name }}</div>
                <div class="material-category">Raw Material</div>
              </div>
            </div>
            <div class="stock-status" v-if="item.current_level <= item.alert_level">
              <span class="status-badge" :class="{ critical: item.current_level <= item.alert_level * 0.5 }">
                {{ item.current_level <= item.alert_level * 0.5 ? 'CRITICAL' : 'LOW' }}
              </span>
            </div>
          </div>
          <div class="stock-levels">
            <div class="level-current">
              <span class="level-value">{{ item.current_level.toFixed(0) }}</span>
              <span class="level-unit">pieces</span>
            </div>
            <div class="level-alert">Alert at: {{ item.alert_level }} pieces</div>
          </div>
          <div class="stock-progress">
            <div class="progress-info">
              <span class="progress-label">Stock Level</span>
              <span class="progress-percentage">{{ getStockPercentage(item) }}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" :style="{ width: getStockPercentage(item) + '%' }" :class="{ low: item.current_level <= item.alert_level, critical: item.current_level <= item.alert_level * 0.5 }"></div></div>
          </div>
          <div class="inventory-actions" v-if="role !== 'cashier'">
            <button @click="updateStock(item.material_name, item.current_level + 10)" class="btn btn-outline stock-btn" :disabled="connectionError">
              <span class="btn-icon">+</span> Add 10 pieces
            </button>
            <button @click="updateStock(item.material_name, item.current_level + 5)" class="btn btn-ghost stock-btn" :disabled="connectionError">
              <span class="btn-icon">+</span> Add 5 pieces
            </button>
            <button @click="updateStock(item.material_name, item.current_level + 1)" class="btn btn-ghost stock-btn" :disabled="connectionError">
              <span class="btn-icon">+</span> Add 1 piece
            </button>
          </div>
          <div v-else class="cashier-stock-message">
            <span class="message-icon">🔒</span>
            <span class="message-text">Stock management is restricted to Stall Admins only</span>
          </div>
          <div class="inventory-glow"></div>
        </div>
      </div>
    </div>

    <!-- Sales Analytics -->
    <div class="section" v-if="!loadingData && !connectionError">
      <div class="section-header">
        <div class="section-title"><h2>Sales Analytics</h2><p>Last 7 days performance overview</p></div>
        <div class="analytics-summary">
          <div class="analytics-stat">
            <div class="analytics-value">{{ getWeeklyTotal() }}</div>
            <div class="analytics-label">Weekly Revenue</div>
          </div>
          <div class="analytics-stat">
            <div class="analytics-value">{{ getWeeklyItems() }}</div>
            <div class="analytics-label">Items Sold</div>
          </div>
        </div>
      </div>
      <div class="analytics-card">
        <div v-if="analytics.dailySales.length === 0" class="no-data">
          <div class="no-data-icon">📊</div>
          <div class="no-data-text"><h3>No Sales Data</h3><p>Start selling to see analytics here</p></div>
        </div>
        <div v-else class="analytics-content">
          <div class="chart-header">
            <h3>Daily Revenue Trend</h3>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color primary"></div>
                <span>Daily Revenue</span>
              </div>
            </div>
          </div>
          <div class="chart-container">
            <div class="chart-wrapper">
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
              <div class="sales-chart">
                <div v-for="day in analytics.dailySales" :key="day.date" class="chart-bar">
                  <div class="bar-container">
                    <div class="bar-fill" :style="{ height: getBarHeight(day.revenue) + '%' }"></div>
                  </div>
                  <div class="bar-label">
                    <div class="bar-date">{{ formatDate(day.date) }}</div>
                    <div class="bar-revenue">{{ formatCurrency(day.revenue) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="product-breakdown" v-if="getProductSalesArray().length > 0">
            <h4>Product Performance</h4>
            <div class="product-grid">
              <div v-for="product in getProductSalesArray()" :key="product.name" class="product-item">
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-sales">{{ product.quantity }} sold</div>
                </div>
                <div class="product-bar">
                  <div class="product-fill" :style="{ width: getProductPercentage(product.quantity) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loadingData" class="loading-section">
      <div class="loading-spinner"><div class="spinner-ring"></div></div>
      <p>Loading stall data...</p>
    </div>

    <!-- ============================================ -->
    <!-- OPEN SHIFT MODAL                              -->
    <!-- ============================================ -->
    <div v-if="showOpenShiftModal" class="modal-overlay" @click.self="handleOpenShiftModalClose">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>🟢 Open Shift</h3>
          <button @click="handleOpenShiftModalClose" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <div class="modal-form-group">
            <label>Starting Cash Float (RM) <span class="required">*</span></label>
            <input 
              type="number" 
              v-model.number="shift.floatInput" 
              placeholder="Enter starting cash amount"
              min="0"
              step="0.01"
              class="filter-input"
              required
            />
            <small>Enter the amount of cash in the register at the start of the shift</small>
          </div>
          
          <div class="modal-form-group">
            <label>📦 Opening Inventory Count <span class="required">*</span></label>
            <div class="inventory-count-grid">
              <div 
                v-for="item in processedInventory" 
                :key="item.material_name"
                class="inventory-count-item"
              >
                <span class="inventory-count-name">{{ item.material_name }}</span>
                <input 
                  type="number" 
                  v-model.number="shift.inventoryCounts[item.material_name]" 
                  :placeholder="item.current_level || 0"
                  min="0"
                  class="filter-input small"
                />
                <span class="inventory-count-unit">pieces</span>
              </div>
            </div>
            <small>Enter the current stock count for each ingredient</small>
          </div>
          
          <div class="modal-form-group">
            <label>Notes (Optional)</label>
            <input v-model="shift.notes" placeholder="Any notes for this shift" class="filter-input" />
          </div>
        </div>
        <div class="modal-modern-footer">
          <button @click="handleOpenShiftModalClose" class="btn-modern secondary">Cancel</button>
          <button @click="confirmOpenShift" class="btn-modern primary" :disabled="shift.floatInput <= 0 || shift.loading || !shiftInventoryValid">
            {{ shift.loading ? 'Opening...' : 'Open Shift' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- CLOSE SHIFT MODAL                             -->
    <!-- ============================================ -->
    <div v-if="showCloseShiftModal" class="modal-overlay" @click.self="handleCloseShiftModalClose">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>🔴 Close Shift</h3>
          <button @click="handleCloseShiftModalClose" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <div class="shift-summary-grid">
            <div class="shift-summary-item">
              <span class="label">Opened</span>
              <span class="value">{{ formatDateTime(currentShift?.opened_at) }}</span>
            </div>
            <div class="shift-summary-item">
              <span class="label">Revenue</span>
              <span class="value revenue">{{ formatCurrency(shiftRevenue) }}</span>
            </div>
            <div class="shift-summary-item">
              <span class="label">Transactions</span>
              <span class="value">{{ todayTransactions.length }}</span>
            </div>
            <div class="shift-summary-item">
              <span class="label">Starting Float</span>
              <span class="value">{{ formatCurrency(shiftStartingFloat) }}</span>
            </div>
            <div class="shift-summary-item">
              <span class="label">Expected Cash</span>
              <span class="value">{{ formatCurrency(shiftStartingFloat + shiftRevenue) }}</span>
            </div>
            <div class="shift-summary-item">
              <span class="label">Ending Cash <span class="required">*</span></span>
              <input 
                type="number" 
                v-model.number="shift.endingCash" 
                placeholder="Enter cash count"
                min="0"
                step="0.01"
                class="filter-input"
                required
              />
            </div>
          </div>
          
          <div class="modal-form-group" style="margin-top: 1rem;">
            <label>📦 Closing Inventory Count <span class="required">*</span></label>
            <div class="inventory-count-grid">
              <div 
                v-for="item in processedInventory" 
                :key="item.material_name"
                class="inventory-count-item"
              >
                <span class="inventory-count-name">{{ item.material_name }}</span>
                <span class="inventory-count-opening">Opening: {{ shift.inventoryCounts[item.material_name] || 0 }}</span>
                <input 
                  type="number" 
                  v-model.number="shift.endingInventory[item.material_name]" 
                  :placeholder="item.current_level || 0"
                  min="0"
                  class="filter-input small"
                  required
                />
                <span class="inventory-count-unit">pieces</span>
                <span class="inventory-count-usage" v-if="shift.endingInventory[item.material_name] !== undefined && shift.inventoryCounts[item.material_name] !== undefined">
  Used: {{ Math.max(0, (shift.inventoryCounts[item.material_name] || 0) - (shift.endingInventory[item.material_name] || 0)) }}
</span>
              </div>
            </div>
            <small>Enter the current stock count for each ingredient</small>
          </div>
          
          <div v-if="shift.endingCash > 0" class="shift-variance" :class="getVarianceClass()">
            <strong>Variance:</strong> 
            {{ formatCurrency(shift.endingCash - (shiftStartingFloat + shiftRevenue)) }}
            <span v-if="shift.endingCash - (shiftStartingFloat + shiftRevenue) > 0">(Over)</span>
            <span v-else-if="shift.endingCash - (shiftStartingFloat + shiftRevenue) < 0">(Short)</span>
            <span v-else>(Balanced ✅)</span>
          </div>
          
          <div class="modal-form-group" style="margin-top: 1rem;">
            <label>Closing Notes (Optional)</label>
            <input v-model="shift.closeNotes" placeholder="Any notes for closing" class="filter-input" />
          </div>
        </div>
        <div class="modal-modern-footer">
          <button @click="handleCloseShiftModalClose" class="btn-modern secondary">Cancel</button>
          <button @click="confirmCloseShift" class="btn-modern primary" :disabled="shift.endingCash <= 0 || shift.loading || !shiftEndingInventoryValid">
            {{ shift.loading ? 'Closing...' : 'Close Shift' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import { formatCurrency, formatNumber } from '../utils/currency.js'
import API_BASE from '../config/api.js'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'StallView',
  props: { 
    stallId: { type: String, default: null }, 
    token: { type: String, default: null },
    role: { type: String, default: 'stall_admin' }
  },
  data() {
    return {
      // ===== Shift data =====
      shift: {
        enabled: true,
        currentShift: null,
        status: false,
        startTime: null,
        startingFloat: 0,
        revenue: 0,
        todayTransactions: [],
        showOpenModal: false,
        showCloseModal: false,
        floatInput: 0,
        endingCash: 0,
        notes: '',
        closeNotes: '',
        loading: false,
        // Inventory tracking
        inventoryCounts: {},
        endingInventory: {}
      },
      inventory: [],
      processedInventory: [],
      todaySales: { items_sold: 0, total_revenue: 0 },
      analytics: { dailySales: [], productSales: {} },
      menuItems: [],
      menuQuantities: {},
      cartItems: [],
      loading: false,
      loadingData: false,
      loadingMenu: false,
      connectionError: false,
      hasDuplicates: false,
      lastUpdateTime: 'Just now',
      // Today's orders pagination
      todayPage: 1,
      todayItemsPerPage: 5,
      showAllTodayTransactions: false,
      iconMap: {
        'Regular AGG': '🍗',
        'Spicy AGG': '🌶️',
        'Large AGG': '🍗',
        'Family Pack': '👨‍👩‍👧‍👦'
      }
    }
  },
  computed: {

    inventoryUsage() {
    const usage = {};
    this.processedInventory.forEach(item => {
      const opening = this.shift.inventoryCounts[item.material_name] || 0;
      const ending = this.shift.endingInventory[item.material_name] || 0;
      usage[item.material_name] = Math.max(0, opening - ending);
    });
    return usage;
  }
},
    // ===== Shift computed =====
    shiftStatus() {
      if (!this.shift || !this.shift.enabled) return false;
      return this.shift.status || false;
    },
    currentShift() {
      if (!this.shift || !this.shift.enabled) return null;
      return this.shift.currentShift || null;
    },
    shiftRevenue() {
      if (!this.shift || !this.shift.enabled) return 0;
      return this.shift.revenue || 0;
    },
    todayTransactions() {
      if (!this.shift || !this.shift.enabled) return [];
      return this.shift.todayTransactions || [];
    },
    shiftStartingFloat() {
      if (!this.shift || !this.shift.enabled) return 0;
      return this.shift.startingFloat || 0;
    },
    showOpenShiftModal() {
      if (!this.shift || !this.shift.enabled) return false;
      return this.shift.showOpenModal || false;
    },
    showCloseShiftModal() {
      if (!this.shift || !this.shift.enabled) return false;
      return this.shift.showCloseModal || false;
    },
    // Today's orders pagination
    paginatedTodayTransactions() {
      if (this.showAllTodayTransactions) {
        return this.todayTransactions;
      }
      const start = (this.todayPage - 1) * this.todayItemsPerPage;
      const end = start + this.todayItemsPerPage;
      return this.todayTransactions.slice(start, end);
    },
    todayTotalPages() {
      return Math.ceil(this.todayTransactions.length / this.todayItemsPerPage) || 1;
    },
    todayStartIndex() {
      if (this.todayTransactions.length === 0) return 0;
      return (this.todayPage - 1) * this.todayItemsPerPage + 1;
    },
    todayEndIndex() {
      if (this.todayTransactions.length === 0) return 0;
      return Math.min(this.todayPage * this.todayItemsPerPage, this.todayTransactions.length);
    },
    // Inventory validation
    shiftInventoryValid() {
      if (!this.shift || !this.shift.inventoryCounts) return false;
      return this.processedInventory.every(item => 
        this.shift.inventoryCounts[item.material_name] !== undefined && 
        this.shift.inventoryCounts[item.material_name] !== null &&
        this.shift.inventoryCounts[item.material_name] >= 0
      );
    },
    shiftEndingInventoryValid() {
      if (!this.shift || !this.shift.endingInventory) return false;
      return this.processedInventory.every(item => 
        this.shift.endingInventory[item.material_name] !== undefined && 
        this.shift.endingInventory[item.material_name] !== null &&
        this.shift.endingInventory[item.material_name] >= 0
      );
    },
    authStore() { return useAuthStore() },
    lowStockCount() { return this.processedInventory.filter(item => item.current_level <= item.alert_level).length },
    activeStallId() { return this.stallId ? parseInt(this.stallId) : this.authStore.activeStallId },
    cartTotal() {
      return this.cartItems.reduce((total, item) => {
        return total + (item.menuItem.price * item.quantity)
      }, 0)
    },
    cartItemCount() {
      return this.cartItems.reduce((count, item) => count + item.quantity, 0)
    }
  },
  mounted() {
    this.loadData()
    this.loadMenu()
    this.interval = setInterval(this.loadData, 30000)
    
    if (this.shift && this.shift.enabled) {
      this.loadCurrentShift();
    }
  },
  beforeUnmount() {
    clearInterval(this.interval)
  },
  methods: {
    formatCurrency, 
    formatNumber,

    // =============================================
    // SHIFT METHODS
    // =============================================

    async loadCurrentShift() {
      if (!this.shift || !this.shift.enabled) return;
      
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api';
        const res = await axios.get(
          `${API_BASE}/shifts/current?stallId=${this.stallId}`,
          { headers: { Authorization: `Bearer ${this.token}` } }
        );
        
        if (res.data) {
          this.shift.currentShift = res.data;
          this.shift.status = true;
          this.shift.startTime = res.data.opened_at;
          this.shift.startingFloat = parseFloat(res.data.starting_float) || 0;
          this.shift.revenue = parseFloat(res.data.revenue) || 0;
          
          // Restore opening inventory if available
          if (res.data.opening_inventory) {
            this.shift.inventoryCounts = res.data.opening_inventory;
          }
          
          await this.loadTodayTransactions();
        } else {
          this.shift.currentShift = null;
          this.shift.status = false;
          this.shift.todayTransactions = [];
          this.shift.revenue = 0;
          this.shift.inventoryCounts = {};
          this.shift.endingInventory = {};
        }
      } catch (err) {
        console.warn('Failed to load current shift:', err);
        this.shift.status = false;
        this.shift.currentShift = null;
      }
    },

    async loadTodayTransactions() {
      if (!this.shift || !this.shift.enabled || !this.shift.status) return;
      
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api';
        const today = new Date().toISOString().split('T')[0];
        const res = await axios.get(
          `${API_BASE}/transactions?stallId=${this.stallId}&date=${today}&limit=100`,
          { headers: { Authorization: `Bearer ${this.token}` } }
        );
        this.shift.todayTransactions = res.data || [];
        
        this.shift.revenue = this.shift.todayTransactions.reduce((sum, tx) => 
          sum + parseFloat(tx.total_amount || 0), 0
        );
        
        // Reset pagination when transactions update
        this.resetTodayPagination();
      } catch (err) {
        console.warn('Failed to load today transactions:', err);
        this.shift.todayTransactions = [];
      }
    },

    // === OPEN SHIFT ===
   // In StallView.vue - Update the openShiftModal method

openShiftModal() {
  if (!this.shift || !this.shift.enabled) return;
  
  // ✅ Get the previous shift's ending cash and inventory
  this.getPreviousShiftData();
  
  this.shift.notes = '';
  this.shift.showOpenModal = true;
},

async getPreviousShiftData() {
  try {
    const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api';
    // Get the most recent closed shift for this stall
    const res = await axios.get(
      `${API_BASE}/shifts/history?stallId=${this.stallId}&limit=1&status=closed`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    
    const shifts = res.data.shifts || [];
    if (shifts.length > 0) {
      const prevShift = shifts[0];
      // Use the previous shift's ending cash as starting float
      this.shift.floatInput = parseFloat(prevShift.ending_cash) || 0;
      
      // If the previous shift had closing inventory, use it as opening inventory
      if (prevShift.closing_inventory) {
        this.shift.inventoryCounts = { ...prevShift.closing_inventory };
      } else {
        // Fallback to current stock
        this.processedInventory.forEach(item => {
          this.shift.inventoryCounts[item.material_name] = item.current_level || 0;
        });
      }
    } else {
      // No previous shift, use current stock
      this.shift.floatInput = 0;
      this.processedInventory.forEach(item => {
        this.shift.inventoryCounts[item.material_name] = item.current_level || 0;
      });
    }
  } catch (err) {
    console.warn('Failed to get previous shift data:', err);
    // Fallback to current stock
    this.shift.floatInput = 0;
    this.processedInventory.forEach(item => {
      this.shift.inventoryCounts[item.material_name] = item.current_level || 0;
    });
  }
},

    closeOpenShiftModal() {
      this.shift.showOpenModal = false;
      this.shift.floatInput = 0;
      this.shift.notes = '';
      this.shift.inventoryCounts = {};
    },

    handleOpenShiftModalClose() {
      // If there are values entered, ask for confirmation
      if (this.shift.floatInput > 0 || this.shift.notes) {
        if (confirm('Are you sure you want to close? Any entered data will be lost.')) {
          this.closeOpenShiftModal();
        }
      } else {
        this.closeOpenShiftModal();
      }
    },

    async confirmOpenShift() {
      if (!this.shift || !this.shift.enabled) return;
      
      if (this.shift.floatInput <= 0) {
        this.$emit('show-notification', 'Please enter a valid starting cash amount (minimum RM 0.01)', 'warning');
        return;
      }
      
      const missingInventory = this.processedInventory.some(item => 
        this.shift.inventoryCounts[item.material_name] === undefined || 
        this.shift.inventoryCounts[item.material_name] === null ||
        this.shift.inventoryCounts[item.material_name] < 0
      );
      
      if (missingInventory) {
        this.$emit('show-notification', 'Please enter valid inventory counts for all items', 'warning');
        return;
      }
      
      this.shift.loading = true;
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api';
        await axios.post(
          `${API_BASE}/shifts/open`,
          {
            stallId: this.stallId,
            startingFloat: this.shift.floatInput,
            notes: this.shift.notes,
            openingInventory: this.shift.inventoryCounts
          },
          { headers: { Authorization: `Bearer ${this.token}` } }
        );
        
        this.shift.showOpenModal = false;
        this.$emit('show-notification', 'Shift opened successfully!', 'success');
        await this.loadCurrentShift();
        
      } catch (err) {
        console.error('Failed to open shift:', err);
        this.$emit('show-notification', err.response?.data?.error || 'Failed to open shift', 'error');
      } finally {
        this.shift.loading = false;
      }
    },

    // === CLOSE SHIFT ===
    closeShiftModal() {
      if (!this.shift || !this.shift.enabled || !this.shift.status) return;
      this.shift.endingCash = 0;
      this.shift.closeNotes = '';
      // Initialize ending inventory from current stock
      this.shift.endingInventory = {};
      this.processedInventory.forEach(item => {
        this.shift.endingInventory[item.material_name] = item.current_level || 0;
      });
      this.shift.showCloseModal = true;
    },

    closeCloseShiftModal() {
      this.shift.showCloseModal = false;
      this.shift.endingCash = 0;
      this.shift.closeNotes = '';
      this.shift.endingInventory = {};
    },

    handleCloseShiftModalClose() {
      // If there are values entered, ask for confirmation
      if (this.shift.endingCash > 0 || this.shift.closeNotes) {
        if (confirm('Are you sure you want to close? Any entered data will be lost.')) {
          this.closeCloseShiftModal();
        }
      } else {
        this.closeCloseShiftModal();
      }
    },

    async confirmCloseShift() {
      if (!this.shift || !this.shift.enabled || !this.shift.status) {
        this.$emit('show-notification', 'No active shift to close', 'warning');
        return;
      }
      
      if (this.shift.endingCash <= 0) {
        this.$emit('show-notification', 'Please enter the ending cash count (minimum RM 0.01)', 'warning');
        return;
      }
      
      const missingInventory = this.processedInventory.some(item => 
        this.shift.endingInventory[item.material_name] === undefined || 
        this.shift.endingInventory[item.material_name] === null ||
        this.shift.endingInventory[item.material_name] < 0
      );
      
      if (missingInventory) {
        this.$emit('show-notification', 'Please enter valid ending inventory counts for all items', 'warning');
        return;
      }
      
      this.shift.loading = true;
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api';
        await axios.post(
          `${API_BASE}/shifts/close`,
          {
            shiftId: this.shift.currentShift.id,
            endingCash: this.shift.endingCash,
            notes: this.shift.closeNotes,
            endingInventory: this.shift.endingInventory
          },
          { headers: { Authorization: `Bearer ${this.token}` } }
        );
        
        this.shift.showCloseModal = false;
        this.$emit('show-notification', 'Shift closed successfully!', 'success');
        await this.loadCurrentShift();
        
      } catch (err) {
        console.error('Failed to close shift:', err);
        this.$emit('show-notification', err.response?.data?.error || 'Failed to close shift', 'error');
      } finally {
        this.shift.loading = false;
      }
    },

    getVarianceClass() {
      const expected = this.shiftStartingFloat + this.shiftRevenue;
      const variance = this.shift.endingCash - expected;
      if (variance > 0) return 'over';
      if (variance < 0) return 'short';
      return 'balanced';
    },

    // === TODAY'S ORDERS PAGINATION ===
    resetTodayPagination() {
      this.todayPage = 1;
      this.showAllTodayTransactions = false;
    },

    toggleTodayTransactionsExpand() {
      this.showAllTodayTransactions = !this.showAllTodayTransactions;
      if (this.showAllTodayTransactions) {
        this.todayPage = 1;
      }
    },

    prevTodayPage() {
      if (this.todayPage > 1) {
        this.todayPage--;
      }
    },

    nextTodayPage() {
      if (this.todayPage < this.todayTotalPages) {
        this.todayPage++;
      }
    },

    refreshTodayTransactions() {
      this.loadTodayTransactions();
    },

    viewTransaction(tx) {
      this.$emit('view-transaction', tx);
    },

    viewAllTransactions() {
      this.$emit('switch-tab', 'transactions');
    },

    // =============================================
    // UTILITY FORMATTING
    // =============================================

    formatTime(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    },

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('en-MY', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch {
        return '';
      }
    },

    getIcon(itemName) {
      return this.iconMap[itemName] || '🍗'
    },

    getUnit(materialName) {
      return 'pieces'
    },

    // =============================================
    // DATA LOADING
    // =============================================

    async loadData() {
      if (!this.activeStallId) return
      this.loadingData = true
      this.connectionError = false
      try {
        await Promise.all([this.loadInventory(), this.loadTodaySales(), this.loadAnalytics()])
      } catch (error) {
        console.error(error)
        this.connectionError = true
        this.$emit('show-notification', 'Failed to load data from server', 'error')
      } finally { this.loadingData = false }
    },

    async loadMenu() {
      this.loadingMenu = true
      try {
        const res = await axios.get(`${API_BASE}/menu`, {
          headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
        })
        
        const assignmentsRes = await axios.get(`${API_BASE}/menu/assignments/${this.activeStallId}`, {
          headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
        })
        
        const assignedItems = assignmentsRes.data || []
        console.log('📝 Assigned items for stall:', assignedItems)
        
        let filteredItems = res.data
        if (assignedItems.length > 0) {
          filteredItems = res.data.filter(item => assignedItems.includes(item.item_name))
        }
        
        this.menuItems = filteredItems.map(item => ({
          ...item,
          quantity: 0
        }))
        this.menuQuantities = {}
        
        console.log('📝 Filtered menu items:', this.menuItems.length)
        
      } catch (error) {
        console.error('Failed to load menu:', error)
        this.menuItems = []
        this.$emit('show-notification', 'Failed to load menu items', 'error')
      } finally {
        this.loadingMenu = false
      }
    },

    async loadInventory() {
      const response = await axios.get(`${API_BASE}/inventory`, {
        params: { stallId: this.activeStallId },
        headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
      })
      this.processInventoryData(response.data)
    },

    processInventoryData(data) {
      const map = new Map()
      data.forEach(item => {
        if (!map.has(item.material_name)) {
          map.set(item.material_name, { ...item, current_level: Number(item.current_level), alert_level: Number(item.alert_level) })
        } else {
          const existing = map.get(item.material_name)
          existing.current_level += Number(item.current_level)
        }
      })
      this.inventory = data
      this.processedInventory = Array.from(map.values())
    },

    async loadTodaySales() {
      const response = await axios.get(`${API_BASE}/stall-today-sales`, {
        params: { stallId: this.activeStallId },
        headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
      })
      this.todaySales = response.data
    },

    async loadAnalytics() {
      const response = await axios.get(`${API_BASE}/sales-analytics`, {
        params: { stallId: this.activeStallId, days: 7 },
        headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
      })
      this.analytics = response.data
    },

    // =============================================
    // MENU QUANTITY & CART
    // =============================================

    adjustQuantity(item, delta) {
      if (!this.activeStallId) return
      const key = item.item_name
      if (!this.menuQuantities[key]) {
        this.menuQuantities[key] = 0
      }
      const newQty = this.menuQuantities[key] + delta
      if (newQty < 0) return
      this.menuQuantities[key] = newQty
      const menuItem = this.menuItems.find(i => i.item_name === key)
      if (menuItem) {
        menuItem.quantity = newQty
      }
      this.syncCartItem(item)
    },

    syncCartItem(item) {
      const qty = this.menuQuantities[item.item_name] || 0
      const existing = this.cartItems.find(i => i.menuItem.item_name === item.item_name)
      
      if (qty > 0) {
        if (existing) {
          existing.quantity = qty
        } else {
          this.cartItems.push({ menuItem: item, quantity: qty })
        }
      } else {
        if (existing) {
          this.cartItems = this.cartItems.filter(i => i.menuItem.item_name !== item.item_name)
        }
      }
    },

    clearCart() {
      this.cartItems = []
      this.menuQuantities = {}
      this.menuItems.forEach(item => {
        item.quantity = 0
      })
      this.$emit('show-notification', 'Cart cleared', 'info')
    },

    async sellAll() {
      if (this.cartItems.length === 0) {
        this.$emit('show-notification', 'No items to sell', 'warning')
        return
      }
      
      // Check if shift is open (only if shift is enabled)
      if (this.shift.enabled && !this.shiftStatus) {
        this.$emit('show-notification', '⚠️ Please open a shift before making sales', 'warning')
        return
      }
      
      this.loading = true
      try {
        const orderData = {
          stallId: this.activeStallId,
          items: this.cartItems.map(item => ({
            itemName: item.menuItem.item_name,
            price: item.menuItem.price,
            quantity: item.quantity
          })),
          total: this.cartTotal,
          itemCount: this.cartItemCount
        }
        
        const orderResponse = await axios.post(`${API_BASE}/orders`, orderData, {
          headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
        })
        
        this.$emit('show-notification', 
          `✅ Order #${orderResponse.data.orderNumber} complete! ${this.cartItemCount} items for ${this.formatCurrency(this.cartTotal)}`, 
          'success'
        )
        
        this.clearCart()
        await this.loadData()
        await this.loadTodayTransactions()
        
      } catch (err) {
        console.error('Order error:', err)
        this.$emit('show-notification', 'Error processing order', 'error')
      } finally {
        this.loading = false
      }
    },

    // =============================================
    // INVENTORY MANAGEMENT
    // =============================================

    async updateStock(materialName, newLevel) {
      try {
        await axios.post(`${API_BASE}/inventory/update`, { 
          materialName, 
          newLevel, 
          stallId: this.activeStallId 
        }, {
          headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
        })
        await this.loadInventory()
        this.$emit('show-notification', `Updated ${materialName} to ${newLevel}${this.getUnit(materialName)}`, 'success')
      } catch (err) {
        console.error(err)
        this.$emit('show-notification', 'Error updating stock', 'error')
      }
    },

    getStockPercentage(item) {
      const max = Math.max(item.current_level, item.alert_level * 2)
      const percentage = Math.min((item.current_level / max) * 100, 100)
      return percentage.toFixed(0)
    },

    // =============================================
    // ANALYTICS
    // =============================================

    getWeeklyTotal() {
      const total = this.analytics.dailySales.reduce((sum, day) => {
        const revenue = typeof day.revenue === 'number' ? day.revenue : parseFloat(day.revenue) || 0
        return sum + revenue
      }, 0)
      return this.formatCurrency(total)
    },

    getWeeklyItems() {
      const total = this.analytics.dailySales.reduce((sum, day) => {
        const items = typeof day.items === 'number' ? day.items : parseInt(day.items) || 0
        return sum + items
      }, 0)
      return total
    },

    getProductSalesArray() {
      const productSales = this.analytics.productSales || {}
      return Object.keys(productSales).map(name => {
        const data = productSales[name]
        return {
          name: name,
          quantity: typeof data.quantity === 'number' ? data.quantity : parseInt(data.quantity) || 0,
          revenue: typeof data.revenue === 'number' ? data.revenue : parseFloat(data.revenue) || 0
        }
      })
    },

    // =============================================
    // CHART HELPERS
    // =============================================

    getBarHeight(revenue) {
      const dailySales = this.analytics.dailySales || []
      if (dailySales.length === 0) return 5
      const max = Math.max(...dailySales.map(d => d.revenue || 0), 1)
      return Math.max((revenue / max) * 80, 5)
    },

    getTrendPoints() {
      const dailySales = this.analytics.dailySales || []
      if (dailySales.length === 0) return ''
      if (dailySales.length === 1) {
        return '50,5'
      }
      const maxRevenue = Math.max(...dailySales.map(d => d.revenue || 0), 1)
      const points = dailySales.map((day, index) => {
        const x = (index / (dailySales.length - 1)) * 100
        const y = 40 - ((day.revenue / maxRevenue) * 35)
        return `${x},${y}`
      })
      return points.join(' ')
    },

    getTrendPointsArray() {
      const dailySales = this.analytics.dailySales || []
      if (dailySales.length === 0) return []
      if (dailySales.length === 1) {
        return [{ x: 50, y: 5 }]
      }
      const maxRevenue = Math.max(...dailySales.map(d => d.revenue || 0), 1)
      return dailySales.map((day, index) => ({
        x: (index / (dailySales.length - 1)) * 100,
        y: 40 - ((day.revenue / maxRevenue) * 35)
      }))
    },

    getProductPercentage(quantity) {
      const productArray = this.getProductSalesArray()
      const max = Math.max(...productArray.map(p => p.quantity), 1)
      return Math.round((quantity / max) * 100)
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric' })
    },

    onStallChanged(stallId) { this.loadData() }
  }
}
</script>

<style scoped>
.stall-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* ===== MAIN CONTENT ===== */
.main-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--space-lg);
}

.menu-section {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  overflow: hidden;
}

/* ===== CONNECTION BANNER ===== */
.connection-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space);
  margin-bottom: var(--space);
  position: relative;
  overflow: hidden;
}

.connection-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--error);
  opacity: 0.6;
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space);
}

.banner-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
}

.banner-title {
  font-weight: 600;
  color: var(--error);
  margin-bottom: var(--space-xs);
  font-size: var(--font-size-sm);
}

.banner-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.retry-btn {
  flex-shrink: 0;
}

/* ===== STATS GRID ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space);
}

.stat-card {
  background: var(--surface);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: var(--space);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  opacity: 0.8;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.stat-icon.items {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.stat-icon.inventory {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.stat-info {
  flex: 1;
  position: relative;
  z-index: 2;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--text);
  margin-bottom: var(--space-xs);
  line-height: 1;
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.stat-trend {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--success);
  padding: 2px 6px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: var(--radius-sm);
  display: inline-block;
}

.stat-trend.warning {
  color: var(--warning);
  background: rgba(245, 158, 11, 0.1);
}

/* ===== SECTIONS ===== */
.section {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  overflow: hidden;
}

.section-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
  background: var(--background);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space);
}

.section-title h2 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-xs);
}

.section-title p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* ===== MENU ===== */
.menu-grid {
  padding: var(--space-lg);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space);
}

.menu-item-wrapper {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space);
  padding: var(--space-lg);
  background: var(--background);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: default;
  transition: var(--transition);
  text-align: left;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.menu-item.has-quantity {
  border-color: var(--primary);
  background: rgba(249, 73, 8, 0.05);
}

.menu-item:hover:not(.has-quantity) {
  border-color: var(--border);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.item-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(99, 102, 241, 0.1),
    transparent
  );
  transition: left 0.5s ease;
}

.menu-item:hover .item-glow {
  left: 100%;
}

.item-image-wrapper {
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  background: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 3px;
}

.item-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-xs);
  font-size: var(--font-size);
}

.item-description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.item-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
  min-width: 80px;
}

.item-price {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary);
}

/* ===== QUANTITY CONTROLS ===== */
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.3rem 0;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  border-color: var(--primary);
  background: var(--primary);
  color: white;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-display {
  min-width: 24px;
  text-align: center;
  font-weight: 700;
  font-size: var(--font-size);
  color: var(--text);
}

/* ===== ORDER PANEL ===== */
.order-panel {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--primary);
  padding: var(--space-lg);
  position: sticky;
  top: var(--space);
  max-height: 650px;
  display: flex;
  flex-direction: column;
  height: fit-content;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space);
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid var(--border);
}

.order-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
}

.clear-btn {
  background: none;
  border: 1px solid var(--error);
  color: var(--error);
  padding: var(--space-xs) var(--space);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.clear-btn:hover:not(:disabled) {
  background: var(--error);
  color: white;
}

.clear-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.order-items {
  flex: 1;
  overflow-y: auto;
  margin-bottom: var(--space);
  max-height: 300px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--border-light);
}

.order-item-info {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.order-item-name {
  font-weight: 500;
  color: var(--text);
  font-size: var(--font-size-sm);
}

.order-item-qty {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.order-item-price {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space) 0;
  border-top: 2px solid var(--border);
  margin-top: var(--space-sm);
}

.total-label {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
}

.total-value {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--primary);
}

.sell-all-btn {
  width: 100%;
  padding: var(--space);
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: var(--font-size);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  margin-top: var(--space);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.sell-all-btn:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.sell-all-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.sell-all-btn:disabled:not([disabled]) {
  opacity: 0.6;
  background: #6b7280;
}

/* ===== INVENTORY ===== */
.inventory-summary {
  display: flex;
  gap: var(--space);
  background: var(--background);
  padding: var(--space);
  border-radius: var(--radius);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space);
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  min-width: 100px;
}

.summary-item.warning {
  border-color: var(--warning);
  background: rgba(245, 158, 11, 0.05);
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
  font-weight: 600;
}

.summary-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
}

.inventory-grid {
  padding: var(--space-lg);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space);
}

.inventory-item {
  background: var(--background);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  border: 2px solid var(--border);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.inventory-item.low-stock {
  border-color: var(--warning);
  background: rgba(245, 158, 11, 0.05);
}

.inventory-item.critical-stock {
  border-color: var(--error);
  background: rgba(239, 68, 68, 0.05);
}

.inventory-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.inventory-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(99, 102, 241, 0.05),
    transparent
  );
  transition: left 0.5s ease;
}

.inventory-item:hover .inventory-glow {
  left: 100%;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space);
}

.material-info {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.material-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  background: var(--surface);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-details {
  flex: 1;
}

.material-name {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}

.material-category {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.status-badge {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  background: var(--warning);
  color: white;
}

.status-badge.critical {
  background: var(--error);
}

.stock-levels {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space);
}

.level-current {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.level-value {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--text);
  line-height: 1;
}

.level-unit {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.level-alert {
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.stock-progress {
  margin-bottom: var(--space);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.progress-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.progress-percentage {
  color: var(--text);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--success);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.low {
  background: var(--warning);
}

.progress-fill.critical {
  background: var(--error);
}

.inventory-actions {
  display: flex;
  gap: var(--space-sm);
}

.stock-btn {
  flex: 1;
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
}

.cashier-stock-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-sm);
  margin-top: 0.5rem;
}

.message-icon {
  font-size: 1rem;
}

.message-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* ===== ANALYTICS ===== */
.analytics-summary {
  display: flex;
  gap: var(--space);
}

.analytics-stat {
  text-align: center;
  padding: var(--space);
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  min-width: 120px;
}

.analytics-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary);
  margin-bottom: var(--space-xs);
}

.analytics-label {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.analytics-card {
  padding: var(--space-lg);
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--text-secondary);
  text-align: center;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: var(--space);
  opacity: 0.5;
}

.no-data-text h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--space-xs);
  color: var(--text);
}

.no-data-text p {
  font-size: var(--font-size-sm);
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space);
}

.chart-header h3 {
  font-size: var(--font-size);
  font-weight: 600;
  color: var(--text);
}

.chart-legend {
  display: flex;
  gap: var(--space);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.primary {
  background: var(--primary);
}

.chart-container {
  padding: 0.5rem 0;
  position: relative;
  width: 100%;
}

.chart-wrapper {
  position: relative;
  width: 100%;
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

.sales-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 0.5rem;
  height: 180px;
  padding: 50px 0 0 0;
  position: relative;
  z-index: 1;
  width: 100%;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 0.3rem;
  min-width: 0;
}

.bar-container {
  flex: 1;
  width: 100%;
  max-width: 50px;
  min-width: 20px;
  display: flex;
  align-items: flex-end;
  background: var(--background);
  border-radius: var(--radius);
  padding: 4px;
  height: 100%;
  min-height: 20px;
}

.bar-fill {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: 2px;
  width: 100%;
  transition: height 0.3s ease;
  min-height: 4px;
}

.bar-label {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: 1.2;
  margin-top: 0.2rem;
}

.bar-date {
  font-weight: 600;
  margin-bottom: 2px;
}

.bar-revenue {
  font-weight: 700;
  color: var(--text);
  font-size: 0.65rem;
}

.product-breakdown {
  margin-top: var(--space-lg);
}

.product-breakdown h4 {
  font-size: var(--font-size);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space);
}

.product-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.product-item {
  display: flex;
  align-items: center;
  gap: var(--space);
  padding: var(--space-sm);
  background: var(--background);
  border-radius: var(--radius);
}

.product-info {
  flex: 1;
  min-width: 120px;
}

.product-name {
  font-weight: 600;
  color: var(--text);
  font-size: var(--font-size-sm);
  margin-bottom: 2px;
}

.product-sales {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

.product-bar {
  flex: 2;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.product-fill {
  height: 100%;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* ===== LOADING ===== */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--text-secondary);
}

.loading-spinner {
  position: relative;
  width: 48px;
  height: 48px;
  margin-bottom: var(--space);
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-state.small {
  padding: 1.5rem 1rem;
}

.loading-spinner.small {
  width: 32px;
  height: 32px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== RECIPE INDICATORS ===== */
.item-recipe-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.recipe-badge {
  font-size: 0.6rem;
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  white-space: nowrap;
}

.no-recipe .recipe-badge {
  background: #d1fae5;
  color: #059669;
}

/* ===== SHIFT STATUS BAR ===== */
.shift-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.shift-status-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.shift-indicator {
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
}

.shift-indicator.open {
  background: #d1fae5;
  color: #059669;
}

.shift-indicator.closed {
  background: #f3f4f6;
  color: #6b7280;
}

.shift-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.shift-float {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--surface);
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  border: 1px solid var(--border-light);
}

.shift-status-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.shift-stats {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.btn-shift {
  padding: 0.3rem 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: var(--transition);
}

.btn-shift.open {
  background: #10b981;
  color: white;
}

.btn-shift.open:hover {
  background: #059669;
}

.btn-shift.close {
  background: #ef4444;
  color: white;
}

.btn-shift.close:hover {
  background: #dc2626;
}

/* ===== TODAY'S TRANSACTIONS ===== */
.today-transactions {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-top: 1rem;
}

.today-transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
}

.today-transactions-header h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.today-transactions-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-refresh {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-secondary);
  padding: 0.1rem 0.3rem;
  transition: var(--transition);
}

.btn-refresh:hover {
  color: var(--primary);
  transform: rotate(180deg);
}

.btn-expand {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-secondary);
  padding: 0.1rem 0.3rem;
  transition: var(--transition);
}

.btn-expand:hover {
  color: var(--primary);
}

.today-transactions-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.25rem;
  transition: max-height 0.3s ease;
}

.today-transactions-list.expanded {
  max-height: 800px;
}

.today-transaction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  border-bottom: 1px solid var(--border-light);
}

.today-transaction-item:hover {
  background: var(--background);
}

.tx-time {
  font-size: 0.65rem;
  color: var(--text-secondary);
  min-width: 55px;
}

.tx-id {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text);
  font-family: monospace;
  min-width: 80px;
}

.tx-items {
  font-size: 0.7rem;
  color: var(--text-secondary);
  min-width: 50px;
}

.tx-amount {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text);
  min-width: 60px;
  text-align: right;
}

.tx-status {
  font-size: 0.55rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  border-radius: 10px;
  text-transform: uppercase;
}

.tx-status.completed {
  background: #d1fae5;
  color: #059669;
}

.tx-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.tx-status.failed {
  background: #fee2e2;
  color: #dc2626;
}

.view-more {
  text-align: center;
  padding: 0.35rem;
}

.view-more button {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.75rem;
}

.view-more button:hover {
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 1.5rem 0.5rem;
  color: var(--text-secondary);
}

.empty-state span {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.25rem;
}

.empty-state p {
  font-size: 0.8rem;
  margin: 0;
}

/* ===== PAGINATION COMPACT ===== */
.pagination-container.compact {
  padding: 0.35rem 0.5rem;
  border-top: 1px solid var(--border-light);
}

.pagination-container.compact .pagination-info {
  font-size: 0.65rem;
}

.pagination-container.compact .pagination-btn {
  padding: 0.15rem 0.4rem;
  font-size: 0.65rem;
}

.pagination-container.compact .pagination-page {
  font-size: 0.65rem;
  min-width: 40px;
}

/* ===== SHIFT MODALS ===== */
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
  max-width: 700px;
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

.modal-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.75rem;
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

.required {
  color: #ef4444;
  font-weight: 700;
}

.modal-modern-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: #f8fafc;
}

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

.btn-modern.primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
  transform: translateY(-1px);
}

.btn-modern.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* ===== INVENTORY COUNT GRID ===== */
.inventory-count-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.inventory-count-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.6rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  flex-wrap: wrap;
}

.inventory-count-name {
  font-weight: 600;
  font-size: 0.8rem;
  min-width: 70px;
}

.inventory-count-item input {
  width: 60px;
  padding: 0.15rem 0.3rem;
}

.inventory-count-unit {
  font-size: 0.6rem;
  color: var(--text-secondary);
}

.inventory-count-opening {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.inventory-count-usage {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--primary);
}

/* ===== SHIFT SUMMARY GRID ===== */
.shift-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.shift-summary-item {
  background: var(--background);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  text-align: center;
}

.shift-summary-item .label {
  display: block;
  font-size: 0.6rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.1rem;
}

.shift-summary-item .value {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
}

.shift-summary-item .value.revenue {
  color: var(--primary);
}

.shift-summary-item input {
  width: 100%;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.shift-variance {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  text-align: center;
  font-size: 0.9rem;
}

.shift-variance.over {
  background: #d1fae5;
  color: #059669;
}

.shift-variance.short {
  background: #fee2e2;
  color: #dc2626;
}

.shift-variance.balanced {
  background: #dbeafe;
  color: #2563eb;
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .order-panel {
    position: static;
    max-height: none;
    border: 2px solid var(--border);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space);
  }
  
  .inventory-summary {
    justify-content: space-between;
  }
  
  .summary-item {
    min-width: auto;
    flex: 1;
  }
  
  .menu-grid {
    padding: var(--space);
  }
  
  .menu-item {
    flex-wrap: wrap;
    padding: var(--space);
  }
  
  .item-action {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 0.5rem;
  }
  
  .quantity-controls {
    margin: 0;
  }
  
  .inventory-grid {
    grid-template-columns: 1fr;
    padding: var(--space);
  }
  
  .sales-chart {
    height: 140px;
    gap: 0.3rem;
    padding: 40px 0 0 0;
  }
  
  .bar-container {
    max-width: 35px;
    min-width: 15px;
    min-height: 15px;
  }
  
  .bar-label {
    font-size: 0.6rem;
  }
  
  .bar-date {
    font-size: 0.6rem;
  }
  
  .bar-revenue {
    font-size: 0.55rem;
  }
  
  .trend-line-container {
    height: 30px;
  }
  
  .inventory-actions {
    flex-direction: column;
  }
  
  .analytics-summary {
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .analytics-stat {
    min-width: auto;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .item-image-wrapper {
    width: 70px;
    height: 70px;
  }
  
  .item-icon {
    font-size: 1.6rem;
    width: 40px;
    height: 40px;
  }
  
  .order-panel {
    padding: var(--space);
  }
  
  .shift-status-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
  }
  
  .shift-status-left,
  .shift-status-right {
    justify-content: center;
  }
  
  .shift-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .today-transaction-item {
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  
  .tx-time {
    min-width: 45px;
    font-size: 0.6rem;
  }
  
  .tx-id {
    min-width: 60px;
    font-size: 0.7rem;
  }
  
  .tx-amount {
    font-size: 0.7rem;
  }
  
  .inventory-count-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
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
  
  .stat-value {
    font-size: 0.95rem;
  }
  
  .inventory-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
  
  .product-info {
    min-width: 100px;
  }
  
  .sales-chart {
    height: 110px;
    gap: 0.2rem;
    padding: 30px 0 0 0;
  }
  
  .bar-container {
    max-width: 25px;
    min-width: 12px;
    min-height: 12px;
    padding: 2px;
  }
  
  .bar-label {
    font-size: 0.5rem;
  }
  
  .bar-date {
    font-size: 0.5rem;
  }
  
  .bar-revenue {
    font-size: 0.5rem;
  }
  
  .trend-line-container {
    height: 25px;
  }

  .item-image-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 8px;
  }
  
  .item-icon {
    font-size: 1.3rem;
    width: 36px;
    height: 36px;
  }
  
  .shift-summary-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .inventory-count-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-modern {
    width: 95%;
  }
  
  .modal-lg {
    max-width: 95%;
  }
}

@media (min-width: 769px) {
  .item-recipe-info {
    gap: 0.5rem;
  }
}
</style>