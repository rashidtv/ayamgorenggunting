<template>
  <div class="admin-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Business Dashboard</h1>
        <p>Real-time insights and management tools</p>
      </div>
      <div class="header-actions">
        <button @click="refreshData" class="btn btn-ghost">
          <span class="btn-icon">🔄</span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon revenue">💰</div>
        <div class="metric-content">
          <div class="metric-value">{{ formatCurrency(todayStats.total_revenue) }}</div>
          <div class="metric-label">Today's Revenue</div>
          <div class="metric-trend positive">+12.5% vs yesterday</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon sales">📦</div>
        <div class="metric-content">
          <div class="metric-value">{{ todayStats.total_items }}</div>
          <div class="metric-label">Items Sold</div>
          <div class="metric-trend positive">+8.2% vs yesterday</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon stalls">🏪</div>
        <div class="metric-content">
          <div class="metric-value">{{ todayStats.active_stalls || 0 }}</div>
          <div class="metric-label">Active Stalls</div>
          <div class="metric-trend">of {{ totalStalls }} total</div>
        </div>
      </div>
      
      <div class="metric-card" v-if="lowStock.length > 0">
        <div class="metric-icon alert">⚠️</div>
        <div class="metric-content">
          <div class="metric-value">{{ lowStock.length }}</div>
          <div class="metric-label">Low Stock Alerts</div>
          <div class="metric-trend negative">Needs attention</div>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Quick Actions -->
      <div class="dashboard-card">
        <div class="card-header">
          <h2>Quick Actions</h2>
          <p>Manage your business operations</p>
        </div>
        <div class="card-body">
          <div class="actions-grid">
            <button class="action-card" @click="showComingSoon('Generate Report')">
              <div class="action-icon">📊</div>
              <div class="action-content">
                <h3>Generate Report</h3>
                <p>Export detailed sales analytics</p>
              </div>
              <div class="action-badge coming-soon">Soon</div>
            </button>
            
            <button class="action-card" @click="showComingSoon('Inventory Overview')">
              <div class="action-icon">📦</div>
              <div class="action-content">
                <h3>Inventory Overview</h3>
                <p>View all stock levels</p>
              </div>
              <div class="action-badge coming-soon">Soon</div>
            </button>
            
            <button class="action-card" @click="showComingSoon('Manage Stalls')">
              <div class="action-icon">🏪</div>
              <div class="action-content">
                <h3>Manage Stalls</h3>
                <p>Stall settings & staff</p>
              </div>
              <div class="action-badge coming-soon">Soon</div>
            </button>
            
            <button class="action-card" @click="showComingSoon('Supplier Orders')">
              <div class="action-icon">🚚</div>
              <div class="action-content">
                <h3>Supplier Orders</h3>
                <p>Manage inventory orders</p>
              </div>
              <div class="action-badge coming-soon">Soon</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Stall Performance -->
      <div class="dashboard-card">
        <div class="card-header">
          <h2>Stall Performance</h2>
          <p>Today's sales by stall</p>
        </div>
        <div class="card-body">
          <div class="performance-list">
            <div 
              v-for="stall in stallPerformance" 
              :key="stall.stall_id"
              class="performance-item"
            >
              <div class="stall-info">
                <div class="stall-avatar">S{{ stall.stall_id }}</div>
                <div class="stall-details">
                  <h4>Stall {{ stall.stall_id }}</h4>
                  <p>{{ stall.items_sold }} items sold</p>
                </div>
              </div>
              <div class="performance-metrics">
                <div class="revenue">{{ formatCurrency(stall.total_revenue) }}</div>
                <div :class="['performance-badge', getStallStatus(stall)]">
                  {{ getStallStatus(stall) }}
                </div>
              </div>
            </div>
            <div v-if="stallPerformance.length === 0" class="empty-state">
              <div class="empty-icon">📊</div>
              <p>No sales data available for today</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div class="dashboard-card" v-if="lowStock.length > 0">
        <div class="card-header alert-header">
          <h2>Low Stock Alerts</h2>
          <span class="alert-count">{{ lowStock.length }}</span>
        </div>
        <div class="card-body">
          <div class="alerts-list">
            <div 
              v-for="alert in lowStock.slice(0, 3)" 
              :key="alert.stall_id + alert.material_name"
              class="alert-item"
            >
              <div class="alert-indicator"></div>
              <div class="alert-content">
                <h4>{{ alert.material_name }}</h4>
                <p>Stall {{ alert.stall_id }} • {{ alert.current_level }}kg left</p>
              </div>
              <button class="btn btn-sm btn-outline" @click="showComingSoon('Restock')">
                Restock
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="dashboard-card">
        <div class="card-header">
          <h2>Recent Activity</h2>
          <p>Latest system events</p>
        </div>
        <div class="card-body">
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon">💰</div>
              <div class="activity-content">
                <p><strong>Stall 1</strong> sold Regular AGG</p>
                <span class="activity-time">2 minutes ago</span>
              </div>
              <div class="activity-amount">RM 8.00</div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">📦</div>
              <div class="activity-content">
                <p><strong>Stall 2</strong> inventory updated</p>
                <span class="activity-time">5 minutes ago</span>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">🏪</div>
              <div class="activity-content">
                <p><strong>Stall 1</strong> started new session</p>
                <span class="activity-time">10 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Coming Soon Modal -->
    <div v-if="showComingSoonModal" class="modal-overlay" @click="closeComingSoon">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🚧 Coming Soon</h3>
          <button @click="closeComingSoon" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="coming-soon-content">
            <div class="coming-soon-icon">🔮</div>
            <h4>{{ comingSoonFeature }}</h4>
            <p>This feature is currently in development and will be available in the next update. We're working hard to bring you more powerful management tools.</p>
            <div class="feature-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">⚡</span>
                <span>Enhanced analytics</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">📊</span>
                <span>Detailed reporting</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🔔</span>
                <span>Smart notifications</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeComingSoon" class="btn btn-primary">Got it!</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { formatCurrency } from '../utils/currency.js'

import { API_BASE } from '../config/api.js'

export default {
  name: 'AdminDashboard',
  props: ['token'],
  data() {
    return {
      todayStats: {
        total_items: 0,
        total_revenue: 0,
        active_stalls: 0
      },
      lowStock: [],
      stallPerformance: [],
      analytics: {
        dailySales: [],
        productSales: []
      },
      stalls: [],
      connectionError: false,
      loadingData: false,
      
      // Coming Soon Modal
      showComingSoonModal: false,
      comingSoonFeature: ''
    }
  },
  computed: {
    totalStalls() {
      return this.stalls.length || 2
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    formatCurrency,
    
    async loadData() {
      this.loadingData = true
      this.connectionError = false
      
      try {
        await Promise.all([
          this.loadTodayStats(),
          this.loadLowStock(),
          this.loadStallPerformance(),
          this.loadStalls()
        ])
      } catch (error) {
        console.error('Error loading admin data:', error)
        this.connectionError = true
        this.$emit('show-notification', 'Failed to load dashboard data', 'error')
      } finally {
        this.loadingData = false
      }
    },
    
    async loadTodayStats() {
      try {
        const response = await axios.get(`${API_BASE}/admin/today-stats`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.todayStats = response.data
      } catch (error) {
        console.error('Error loading today stats:', error)
        throw error
      }
    },
    
    async loadLowStock() {
      try {
        const response = await axios.get(`${API_BASE}/admin/low-stock`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.lowStock = response.data
      } catch (error) {
        console.error('Error loading low stock:', error)
        throw error
      }
    },
    
    async loadStallPerformance() {
      try {
        const response = await axios.get(`${API_BASE}/admin/stall-performance`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.stallPerformance = response.data
      } catch (error) {
        console.error('Error loading stall performance:', error)
        throw error
      }
    },
    
    async loadStalls() {
      try {
        const response = await axios.get(`${API_BASE}/admin/stalls`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.stalls = response.data
      } catch (error) {
        console.error('Error loading stalls:', error)
        throw error
      }
    },
    
    getStallStatus(stall) {
      if (stall.items_sold === 0) return 'inactive'
      if (stall.total_revenue < 100) return 'slow'
      if (stall.total_revenue < 500) return 'good'
      return 'excellent'
    },
    
    refreshData() {
      this.loadData()
      this.$emit('show-notification', 'Dashboard refreshed', 'success')
    },
    
    showComingSoon(feature) {
      this.comingSoonFeature = feature
      this.showComingSoonModal = true
    },
    
    closeComingSoon() {
      this.showComingSoonModal = false
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 0;
}

.dashboard-header {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
  border: 1px solid var(--border);
}

.header-content h1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: var(--space-xs);
  color: var(--text);
}

.header-content p {
  color: var(--text-secondary);
  font-size: var(--font-size);
}

.header-actions {
  margin-top: var(--space);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space);
  margin-bottom: var(--space-lg);
}

.metric-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space);
  transition: var(--transition);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
}

.metric-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.metric-icon.revenue {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.metric-icon.sales {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.metric-icon.stalls {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.metric-icon.alert {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-xs);
}

.metric-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-xs);
}

.metric-trend {
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.metric-trend.positive {
  color: var(--success);
}

.metric-trend.negative {
  color: var(--error);
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--space-lg);
}

.dashboard-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.card-header h2 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-xs);
}

.card-header p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.alert-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-count {
  background: var(--error);
  color: white;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.card-body {
  padding: var(--space-lg);
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space);
}

.action-card {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space);
  display: flex;
  align-items: center;
  gap: var(--space);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  text-align: left;
  width: 100%;
}

.action-card:hover {
  background: var(--surface-elevated);
  border-color: var(--primary);
  transform: translateY(-1px);
}

.action-icon {
  font-size: 1.5rem;
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-content {
  flex: 1;
}

.action-content h3 {
  font-size: var(--font-size);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-xs);
}

.action-content p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.action-badge {
  position: absolute;
  top: var(--space);
  right: var(--space);
  background: var(--warning);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

/* Performance List */
.performance-list {
  display: flex;
  flex-direction: column;
  gap: var(--space);
}

.performance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space);
  background: var(--background);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.stall-info {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.stall-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.stall-details h4 {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}

.stall-details p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.performance-metrics {
  display: flex;
  align-items: center;
  gap: var(--space);
}

.revenue {
  font-weight: 600;
  color: var(--text);
}

.performance-badge {
  padding: 4px 8px;
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.performance-badge.excellent {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.performance-badge.good {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.performance-badge.slow {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.performance-badge.inactive {
  background: rgba(100, 116, 139, 0.1);
  color: var(--text-secondary);
}

/* Alerts List */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space);
}

.alert-item {
  display: flex;
  align-items: center;
  gap: var(--space);
  padding: var(--space);
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius);
}

.alert-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--warning);
  animation: pulse 2s infinite;
}

.alert-content {
  flex: 1;
}

.alert-content h4 {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}

.alert-content p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--space);
  padding: var(--space);
  background: var(--background);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.activity-icon {
  font-size: var(--font-size-lg);
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  background: var(--surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-content {
  flex: 1;
}

.activity-content p {
  font-weight: 500;
  color: var(--text);
  margin-bottom: 2px;
}

.activity-time {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

.activity-amount {
  font-weight: 600;
  color: var(--success);
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space);
  opacity: 0.5;
}

/* Modal Styles */
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
  padding: var(--space);
}

.modal-content {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius);
}

.modal-close:hover {
  background: var(--background);
  color: var(--text);
}

.modal-body {
  padding: var(--space-lg);
}

.coming-soon-content {
  text-align: center;
}

.coming-soon-icon {
  font-size: 4rem;
  margin-bottom: var(--space);
}

.coming-soon-content h4 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space);
}

.coming-soon-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-lg);
}

.feature-benefits {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: var(--space);
  padding: var(--space-sm);
  background: var(--background);
  border-radius: var(--radius);
}

.benefit-icon {
  font-size: var(--font-size-lg);
}

.modal-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .performance-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space);
  }
  
  .performance-metrics {
    width: 100%;
    justify-content: space-between;
  }
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
}
</style>