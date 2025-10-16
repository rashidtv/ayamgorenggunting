<template>
  <div class="stall-view">
    <!-- Connection Status -->
    <div v-if="connectionError" class="connection-banner error">
      <div class="banner-content">
        <span class="banner-icon">⚠️</span>
        <div class="banner-text">
          <div class="banner-title">Connection Issue</div>
          <div class="banner-desc">Cannot connect to server. Please ensure backend is running on port 5001.</div>
        </div>
        <button @click="loadData" class="btn btn-outline retry-btn">
          <span class="btn-icon">🔄</span>
          Retry
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
          <div class="stat-trend">Today</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon items">📦</div>
        <div class="stat-info">
          <div class="stat-value">{{ todaySales.items_sold }}</div>
          <div class="stat-label">Items Sold</div>
          <div class="stat-trend">Today</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon inventory">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ lowStockCount }}</div>
          <div class="stat-label">Low Stock Items</div>
          <div class="stat-trend" :class="{ 'warning': lowStockCount > 0 }">
            {{ lowStockCount > 0 ? 'Needs Attention' : 'All Good' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <h2>Quick Sales</h2>
          <p>Tap to sell items instantly</p>
        </div>
        <div class="section-actions">
          <div class="last-updated">Updated: {{ lastUpdateTime }}</div>
        </div>
      </div>
      <div class="menu-grid">
        <button 
          v-for="item in menuItems" 
          :key="item.name"
          @click="sellItem(item.name, item.price)"
          class="menu-item"
          :disabled="loading || connectionError"
        >
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-description">{{ item.description }}</div>
          </div>
          <div class="item-action">
            <div class="item-price">{{ formatCurrency(item.price) }}</div>
            <div class="sell-badge">
              <span class="sell-icon">→</span>
              SELL
            </div>
          </div>
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
          <div class="summary-item">
            <span class="summary-label">Total Items</span>
            <span class="summary-value">{{ processedInventory.length }}</span>
          </div>
          <div class="summary-item" :class="{ 'warning': lowStockCount > 0 }">
            <span class="summary-label">Low Stock</span>
            <span class="summary-value">{{ lowStockCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">In Stock</span>
            <span class="summary-value">{{ processedInventory.length - lowStockCount }}</span>
          </div>
        </div>
      </div>
      
      <div class="inventory-grid">
        <div 
          v-for="item in processedInventory" 
          :key="item.material_name"
          :class="['inventory-item', { 
            'low-stock': item.current_level <= item.alert_level,
            'critical-stock': item.current_level <= item.alert_level * 0.5
          }]"
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
              <span class="status-badge" :class="{ 'critical': item.current_level <= item.alert_level * 0.5 }">
                {{ item.current_level <= item.alert_level * 0.5 ? 'CRITICAL' : 'LOW' }}
              </span>
            </div>
          </div>
          
          <div class="stock-levels">
            <div class="level-current">
              <span class="level-value">{{ item.current_level.toFixed(2) }}</span>
              <span class="level-unit">kg</span>
            </div>
            <div class="level-alert">
              Alert at: {{ item.alert_level }}kg
            </div>
          </div>
          
          <div class="stock-progress">
            <div class="progress-info">
              <span class="progress-label">Stock Level</span>
              <span class="progress-percentage">{{ getStockPercentage(item) }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: getStockPercentage(item) + '%' }"
                :class="{ 
                  'low': item.current_level <= item.alert_level,
                  'critical': item.current_level <= item.alert_level * 0.5
                }"
              ></div>
            </div>
          </div>
          
          <div class="inventory-actions">
            <button 
              @click="updateStock(item.material_name, item.current_level + 5)"
              class="btn btn-outline stock-btn"
              :disabled="connectionError"
            >
              <span class="btn-icon">+</span>
              Add 5kg
            </button>
            <button 
              @click="updateStock(item.material_name, item.current_level + 1)"
              class="btn btn-ghost stock-btn"
              :disabled="connectionError"
            >
              <span class="btn-icon">+</span>
              Add 1kg
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sales Analytics -->
    <div class="section" v-if="!loadingData && !connectionError">
      <div class="section-header">
        <div class="section-title">
          <h2>Sales Analytics</h2>
          <p>Last 7 days performance overview</p>
        </div>
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
          <div class="no-data-text">
            <h3>No Sales Data</h3>
            <p>Start selling to see analytics here</p>
          </div>
        </div>
        <div v-else class="analytics-content">
          <div class="sales-chart">
            <div 
              v-for="day in analytics.dailySales" 
              :key="day.date"
              class="chart-bar"
            >
              <div class="bar-container">
                <div 
                  class="bar-fill"
                  :style="{ height: getBarHeight(day.revenue) + '%' }"
                ></div>
              </div>
              <div class="bar-label">
                <div class="bar-date">{{ formatDate(day.date) }}</div>
                <div class="bar-revenue">{{ formatCurrency(day.revenue) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingData" class="loading-section">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
      </div>
      <p>Loading stall data...</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { formatCurrency, formatNumber } from '../utils/currency.js'

import { API_BASE } from '../config/api.js'

export default {
  name: 'StallView',
  props: ['stallId', 'token'],
  data() {
    return {
      inventory: [],
      processedInventory: [],
      todaySales: {
        items_sold: 0,
        total_revenue: 0
      },
      analytics: {
        dailySales: [],
        productSales: []
      },
      loading: false,
      loadingData: false,
      connectionError: false,
      hasDuplicates: false,
      lastUpdateTime: 'Just now',
      menuItems: [
        { 
          name: 'Regular AGG', 
          price: 8.00, 
          icon: '🍗',
          description: 'Classic fried chicken'
        },
        { 
          name: 'Spicy AGG', 
          price: 9.00, 
          icon: '🌶️',
          description: 'Spicy flavor'
        },
        { 
          name: 'Large AGG', 
          price: 12.00, 
          icon: '🍗',
          description: 'Large portion'
        },
        { 
          name: 'Family Pack', 
          price: 25.00, 
          icon: '👨‍👩‍👧‍👦',
          description: 'Family bundle'
        }
      ]
    }
  },
  computed: {
    lowStockCount() {
      return this.processedInventory.filter(item => item.current_level <= item.alert_level).length
    }
  },
  mounted() {
    this.loadData()
    this.interval = setInterval(this.loadData, 30000)
    this.updateTimeInterval = setInterval(this.updateLastUpdateTime, 60000)
  },
  beforeUnmount() {
    clearInterval(this.interval)
    clearInterval(this.updateTimeInterval)
  },
  methods: {
    formatCurrency,
    formatNumber,
    
    updateLastUpdateTime() {
      const now = new Date()
      this.lastUpdateTime = now.toLocaleTimeString('en-MY', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    },
    
    async loadData() {
      this.loadingData = true
      this.connectionError = false
      
      try {
        await Promise.all([
          this.loadInventory(),
          this.loadTodaySales(),
          this.loadAnalytics()
        ])
        this.updateLastUpdateTime()
      } catch (error) {
        console.error('Error loading data:', error)
        this.connectionError = true
        this.$emit('show-notification', 'Failed to load data from server', 'error')
      } finally {
        this.loadingData = false
      }
    },
    
    async loadInventory() {
      try {
        const response = await axios.get(`${API_BASE}/inventory`, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 5000
        })
        this.processInventoryData(response.data)
      } catch (error) {
        console.error('Error loading inventory:', error)
        throw error
      }
    },
    
    processInventoryData(inventoryData) {
      const uniqueMap = new Map()
      let hasDuplicates = false
      
      inventoryData.forEach(item => {
        if (!uniqueMap.has(item.material_name)) {
          uniqueMap.set(item.material_name, {
            ...item,
            current_level: Number(item.current_level),
            alert_level: Number(item.alert_level)
          })
        } else {
          hasDuplicates = true
          const existing = uniqueMap.get(item.material_name)
          uniqueMap.set(item.material_name, {
            ...existing,
            current_level: existing.current_level + Number(item.current_level)
          })
        }
      })
      
      this.inventory = inventoryData
      this.processedInventory = Array.from(uniqueMap.values())
      this.hasDuplicates = hasDuplicates
    },
    
    async loadTodaySales() {
      try {
        const response = await axios.get(`${API_BASE}/stall-today-sales`, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 5000
        })
        this.todaySales = response.data
      } catch (error) {
        console.error('Error loading sales:', error)
        throw error
      }
    },
    
    async loadAnalytics() {
      try {
        const response = await axios.get(`${API_BASE}/sales-analytics`, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 5000
        })
        this.analytics = response.data
      } catch (error) {
        console.error('Error loading analytics:', error)
        throw error
      }
    },
    
    async sellItem(itemName, price) {
      if (this.connectionError) {
        this.$emit('show-notification', 'Server connection lost. Please check backend.', 'error')
        return
      }

      this.loading = true
      try {
        await axios.post(`${API_BASE}/sell`, {
          itemName,
          price
        }, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 10000
        })
        
        await this.loadData()
        this.$emit('show-notification', `Sold ${itemName} for ${this.formatCurrency(price)}!`, 'success')
      } catch (error) {
        console.error('Error selling item:', error)
        if (error.code === 'ERR_NETWORK') {
          this.connectionError = true
          this.$emit('show-notification', 'Cannot connect to server. Check if backend is running on port 5001.', 'error')
        } else if (error.response?.status === 400) {
          this.$emit('show-notification', error.response.data.error || 'Cannot sell item - recipe missing', 'error')
        } else {
          this.$emit('show-notification', 'Error selling item. Please try again.', 'error')
        }
      } finally {
        this.loading = false
      }
    },
    
    async updateStock(materialName, newLevel) {
      if (this.connectionError) {
        this.$emit('show-notification', 'Server connection lost.', 'error')
        return
      }

      try {
        await axios.post(`${API_BASE}/inventory/update`, {
          materialName,
          newLevel
        }, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 10000
        })
        
        await this.loadInventory()
        this.$emit('show-notification', `Updated ${materialName} stock to ${newLevel}kg`, 'success')
      } catch (error) {
        console.error('Error updating stock:', error)
        if (error.code === 'ERR_NETWORK') {
          this.connectionError = true
        }
        this.$emit('show-notification', 'Error updating stock', 'error')
      }
    },
    
    getStockPercentage(item) {
      const maxLevel = Math.max(item.current_level, item.alert_level * 2)
      return Math.min((item.current_level / maxLevel) * 100, 100)
    },
    
    getWeeklyTotal() {
      return this.formatCurrency(this.analytics.dailySales.reduce((sum, day) => sum + day.revenue, 0))
    },
    
    getWeeklyItems() {
      return this.analytics.dailySales.reduce((sum, day) => sum + (day.quantity || 0), 0)
    },
    
    getBarHeight(revenue) {
      const maxRevenue = Math.max(...this.analytics.dailySales.map(d => d.revenue))
      return maxRevenue > 0 ? (revenue / maxRevenue) * 80 : 0
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-MY', { 
        weekday: 'short',
        day: 'numeric'
      })
    }
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
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius);
  padding: var(--space);
  margin-bottom: var(--space);
}

.connection-banner.error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
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
  color: var(--warning);
  margin-bottom: var(--space-xs);
  font-size: var(--font-size-sm);
}

.error .banner-title {
  color: var(--error);
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

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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

.section-actions {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.last-updated {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  background: var(--background);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius);
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

/* Menu Grid */
.menu-grid {
  padding: var(--space-lg);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space);
  padding: var(--space-lg);
  background: var(--background);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  width: 100;
}

.menu-item:hover:not(:disabled) {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.menu-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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
}

.item-price {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary);
}

.sell-badge {
  background: var(--success);
  color: white;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  text-transform: uppercase;
}

.sell-icon {
  font-size: var(--font-size-sm);
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

.sales-chart {
  display: flex;
  align-items: end;
  gap: var(--space);
  height: 200px;
  padding: var(--space) 0;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: var(--space-sm);
}

.bar-container {
  flex: 1;
  width: 100%;
  max-width: 50px;
  display: flex;
  align-items: end;
  background: var(--background);
  border-radius: var(--radius);
  padding: 4px;
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
}

.bar-date {
  font-weight: 600;
  margin-bottom: 2px;
}

.bar-revenue {
  font-weight: 700;
  color: var(--text);
  font-size: 0.7rem;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
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
    grid-template-columns: 1fr;
    padding: var(--space);
  }
  
  .inventory-grid {
    grid-template-columns: 1fr;
    padding: var(--space);
  }
  
  .sales-chart {
    gap: var(--space-sm);
  }
  
  .bar-container {
    max-width: 40px;
  }
  
  .inventory-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .inventory-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
  
  .analytics-summary {
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .analytics-stat {
    min-width: auto;
  }
}
</style>