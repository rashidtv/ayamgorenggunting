<template>
  <div class="stall-view">
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

    <!-- Quick Sales Menu -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <h2>Quick Sales</h2>
          <p>Tap to sell items instantly</p>
        </div>
        <!-- REMOVED: last-updated and refresh button -->
      </div>

      <!-- DYNAMIC MENU FROM DATABASE -->
      <div v-if="menuItems.length > 0" class="menu-grid">
        <div 
          v-for="item in menuItems" 
          :key="item.item_name"
          class="menu-item-wrapper"
        >
          <div class="menu-item" :class="{ 'has-quantity': item.quantity > 0 }">
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
              <!-- RECIPE INDICATOR -->
              <div class="item-recipe-info" v-if="item.recipe && item.recipe.length > 0">
                <span class="recipe-badge">📋 {{ item.recipe.length }} ingredient{{ item.recipe.length > 1 ? 's' : '' }}</span>
                <span class="recipe-detail" v-for="r in item.recipe" :key="r.material_name">
                  {{ r.material_name }}: {{ r.quantity_used }} piece{{ r.quantity_used > 1 ? 's' : '' }}
                </span>
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
              <button 
                @click="sellItemWithQuantity(item)" 
                class="sell-badge"
                :disabled="loading || connectionError || !activeStallId || (menuQuantities[item.item_name] || 0) <= 0"
              >
                <span class="sell-icon">→</span> SELL
              </button>
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
          <!-- Inventory update buttons - HIDDEN for Cashier -->
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
          <!-- Show message for Cashier -->
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
          
          <!-- Product Performance Breakdown -->
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
      inventory: [],
      processedInventory: [],
      todaySales: { items_sold: 0, total_revenue: 0 },
      analytics: { dailySales: [], productSales: {} },
      menuItems: [],
      menuQuantities: {},
      loading: false,
      loadingData: false,
      loadingMenu: false,
      connectionError: false,
      hasDuplicates: false,
      lastUpdateTime: 'Just now',
      iconMap: {
        'Regular AGG': '🍗',
        'Spicy AGG': '🌶️',
        'Large AGG': '🍗',
        'Family Pack': '👨‍👩‍👧‍👦'
      }
    }
  },
  computed: {
    authStore() { return useAuthStore() },
    lowStockCount() { return this.processedInventory.filter(item => item.current_level <= item.alert_level).length },
    activeStallId() { return this.stallId ? parseInt(this.stallId) : this.authStore.activeStallId }
  },
  mounted() {
    this.loadData()
    this.loadMenu()
    this.interval = setInterval(this.loadData, 30000)
  },
  beforeUnmount() {
    clearInterval(this.interval)
  },
  methods: {
    formatCurrency, 
    formatNumber,

    getIcon(itemName) {
      return this.iconMap[itemName] || '🍗'
    },

    getImageUrl(imagePath) {
      if (!imagePath) return null
      if (imagePath.startsWith('http') || imagePath.startsWith('data:image')) {
        return imagePath
      }
      if (imagePath.startsWith('/uploads/')) {
        const backendUrl = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com'
        return `${backendUrl}${imagePath}`
      }
      return imagePath
    },

    getUnit(materialName) {
      return 'pieces'
    },

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
        console.log('📸 Menu items with recipes:', res.data.map(item => ({
          name: item.item_name,
          hasRecipe: item.recipe && item.recipe.length > 0,
          recipeCount: item.recipe ? item.recipe.length : 0
        })))
        this.menuItems = res.data.map(item => ({
          ...item,
          quantity: 0
        }))
        this.menuQuantities = {}
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

    // ==================== MENU QUANTITY METHODS ====================

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
    },

    async sellItemWithQuantity(item) {
      const qty = this.menuQuantities[item.item_name] || 0
      if (qty <= 0) {
        this.$emit('show-notification', 'Please select quantity first', 'warning')
        return
      }
      
      this.loading = true
      try {
        for (let i = 0; i < qty; i++) {
          await axios.post(`${API_BASE}/sell`, {
            itemName: item.item_name,
            price: item.price,
            stallId: this.activeStallId
          }, {
            headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
          })
        }
        this.menuQuantities[item.item_name] = 0
        const menuItem = this.menuItems.find(i => i.item_name === item.item_name)
        if (menuItem) {
          menuItem.quantity = 0
        }
        await this.loadData()
        this.$emit('show-notification', `Sold ${qty} × ${item.item_name} for ${this.formatCurrency(item.price * qty)}!`, 'success')
      } catch (err) {
        console.error(err)
        this.$emit('show-notification', 'Error selling item', 'error')
      } finally {
        this.loading = false
      }
    },

    async sellItem(itemName, price) {
      if (!this.activeStallId) return
      this.loading = true
      try {
        await axios.post(`${API_BASE}/sell`, { itemName, price, stallId: this.activeStallId }, {
          headers: { Authorization: `Bearer ${this.authStore.token || this.token}` }
        })
        await this.loadData()
        this.$emit('show-notification', `Sold ${itemName} for ${this.formatCurrency(price)}!`, 'success')
      } catch (err) {
        console.error(err)
        this.$emit('show-notification', 'Error selling item', 'error')
      } finally { this.loading = false }
    },

    async updateStock(materialName, newLevel) {
      try {
        await axios.post(`${API_BASE}/inventory/update`, { materialName, newLevel, stallId: this.activeStallId }, {
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

    // ==================== ANALYTICS METHODS ====================
    
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

    // ==================== CHART METHODS ====================
    
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

/* Connection Banner */
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

/* Stats Grid */
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

/* Sections */
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

/* Menu Grid */
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

/* Quantity Controls */
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

.sell-badge {
  background: var(--success);
  color: white;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 4px;
  text-transform: uppercase;
  width: 100%;
  justify-content: center;
}

.sell-badge:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.sell-badge:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Inventory Summary */
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

/* Inventory Grid */
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

/* Inventory Actions - Only for non-cashier */
.inventory-actions {
  display: flex;
  gap: var(--space-sm);
}

.stock-btn {
  flex: 1;
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
}

/* Cashier message - shown when role is cashier */
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

/* Analytics */
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

/* Chart Container */
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

/* Product Breakdown */
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

/* Loading Section */
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

/* Empty State for Menu */
.menu-empty {
  padding: 2rem 1rem;
  text-align: center;
}

.menu-empty .empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.menu-empty h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.3rem;
}

.menu-empty p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* ============================================ */
/* RECIPE INDICATORS                           */
/* ============================================ */
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

.recipe-detail {
  font-size: 0.6rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.05rem 0.4rem;
  border-radius: 8px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */
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
  
  .sell-badge {
    padding: 0.2rem 0.6rem;
    font-size: 0.65rem;
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
}

@media (max-width: 480px) {
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
}

@media (min-width: 769px) {
  .item-recipe-info {
    gap: 0.5rem;
  }
  
  .recipe-detail {
    font-size: 0.65rem;
    padding: 0.05rem 0.5rem;
  }
}
</style>