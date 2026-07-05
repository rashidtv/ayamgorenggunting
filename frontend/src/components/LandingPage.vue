<template>
  <div class="landing-page">
    <!-- ===== PUBLIC HEADER ===== -->
    <DashboardHeader 
      :is-public="true"
      role-text="Chickory Hub"
      :banner-url="systemBanner"
    />

    <!-- ===== HERO SECTION ===== -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-grid">
          <div class="hero-content">
            <div class="hero-badge">🚀 #1 Chicken Business Platform</div>
            <h1>Manage Your <br><span>Chicken Business</span><br>Like a Pro</h1>
            <p>All-in-one platform designed specifically for chicken stall owners. Track sales, manage inventory, and grow your business from anywhere.</p>
            <div class="hero-actions">
              <button @click="openRegistration" class="btn-primary btn-lg">
                Start Free Trial
                <span class="btn-arrow">→</span>
              </button>
              <button @click="goToLogin" class="btn-outline btn-lg">
                🔑 Sign In
              </button>
            </div>
            <div class="hero-trust">
              <div class="trust-item">
                <span class="trust-icon">⭐</span>
                <span>Trusted by 50+ stalls</span>
              </div>
              <div class="trust-item">
                <span class="trust-icon">📱</span>
                <span>PWA enabled</span>
              </div>
              <div class="trust-item">
                <span class="trust-icon">🔒</span>
                <span>Bank-grade security</span>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-dashboard-preview">
              <div class="preview-card">
                <div class="preview-header">
                  <span class="preview-dot red"></span>
                  <span class="preview-dot yellow"></span>
                  <span class="preview-dot green"></span>
                  <span class="preview-title">📊 Dashboard</span>
                </div>
                <div class="preview-stats">
                  <div class="preview-stat">
                    <span class="stat-number">RM 1,463</span>
                    <span class="stat-label">Revenue</span>
                  </div>
                  <div class="preview-stat">
                    <span class="stat-number">72</span>
                    <span class="stat-label">Items Sold</span>
                  </div>
                </div>
                <div class="preview-chart">
                  <div class="chart-bar" style="height: 60%"></div>
                  <div class="chart-bar" style="height: 80%"></div>
                  <div class="chart-bar" style="height: 40%"></div>
                  <div class="chart-bar" style="height: 90%"></div>
                  <div class="chart-bar" style="height: 70%"></div>
                  <div class="chart-bar" style="height: 50%"></div>
                  <div class="chart-bar" style="height: 85%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== PROBLEM / SOLUTION ===== -->
    <section class="problem-section">
      <div class="container">
        <div class="problem-grid">
          <div class="problem-item">
            <div class="problem-icon">📋</div>
            <h3>Manual Record Keeping</h3>
            <p>Stop wasting time with spreadsheets and paper. Track everything digitally.</p>
          </div>
          <div class="problem-item">
            <div class="problem-icon">📦</div>
            <h3>Inventory Chaos</h3>
            <p>Know exactly when to restock. Never run out of chicken again.</p>
          </div>
          <div class="problem-item">
            <div class="problem-icon">📊</div>
            <h3>No Real Insights</h3>
            <p>Get real-time analytics and make data-driven decisions for your business.</p>
          </div>
          <div class="problem-item">
            <div class="problem-icon">👥</div>
            <h3>Multi-stall Complexity</h3>
            <p>Manage multiple stalls from one dashboard. Simple, unified, efficient.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== WHY US ===== -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Why Chickory Hub</span>
          <h2>Built for Chicken Business Owners</h2>
          <p>Everything you need to run your stall efficiently</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">⚡</span>
            </div>
            <h3>Real-time Sales</h3>
            <p>Track sales as they happen. See revenue, items sold, and trends instantly.</p>
          </div>
          <div class="feature-card highlight">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">🛒</span>
            </div>
            <h3>Smart Inventory</h3>
            <p>Auto-deduct chicken from inventory when items are sold. Set low-stock alerts.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">📱</span>
            </div>
            <h3>Works on Any Device</h3>
            <p>Install as PWA on your phone. Works offline. No app store required.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">🔐</span>
            </div>
            <h3>Role-Based Access</h3>
            <p>Stall Admins manage inventory. Cashiers focus on selling. Super Admins oversee all.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">📊</span>
            </div>
            <h3>Analytics Dashboard</h3>
            <p>Visual charts, top-selling items, stall performance. Know your business.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">👨‍👩‍👧‍👦</span>
            </div>
            <h3>Multi-Stall Management</h3>
            <p>Own multiple stalls? Manage them all from one place with one login.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== COMPARISON ===== -->
    <section class="comparison-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Why We're Different</span>
          <h2>Chickory Hub vs The Rest</h2>
        </div>
        <div class="comparison-table">
          <div class="comparison-row header">
            <div class="comparison-cell feature">Feature</div>
            <div class="comparison-cell chickory">🍗 Chickory Hub</div>
            <div class="comparison-cell competitor">📊 Excel/Spreadsheets</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell feature">Real-time Sales</div>
            <div class="comparison-cell chickory">✅ Yes</div>
            <div class="comparison-cell competitor">❌ No</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell feature">Inventory Auto-Deduct</div>
            <div class="comparison-cell chickory">✅ Yes</div>
            <div class="comparison-cell competitor">❌ Manual</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell feature">Multi-Stall Management</div>
            <div class="comparison-cell chickory">✅ Yes</div>
            <div class="comparison-cell competitor">❌ Complex</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell feature">Role-Based Access</div>
            <div class="comparison-cell chickory">✅ Yes</div>
            <div class="comparison-cell competitor">❌ No</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell feature">Mobile PWA</div>
            <div class="comparison-cell chickory">✅ Yes</div>
            <div class="comparison-cell competitor">❌ No</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell feature">Analytics & Charts</div>
            <div class="comparison-cell chickory">✅ Yes</div>
            <div class="comparison-cell competitor">❌ Manual</div>
          </div>
          <div class="comparison-row">
            <div class="comparison-cell feature">Low Stock Alerts</div>
            <div class="comparison-cell chickory">✅ Yes</div>
            <div class="comparison-cell competitor">❌ No</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== PRICING ===== -->
    <section class="pricing-section">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Simple Pricing</span>
          <h2>One Plan. All Features.</h2>
          <p>No hidden fees. Cancel anytime.</p>
        </div>
        <div class="pricing-card">
          <div class="pricing-badge">🔥 Most Popular</div>
          <div class="pricing-header">
            <h3>Annual Plan</h3>
            <div class="price">
              <span class="amount">RM940</span>
              <span class="period">/year</span>
            </div>
            <div class="price-sub">Includes RM100 setup fee</div>
          </div>
          <div class="pricing-features">
            <ul>
              <li>✅ All features included</li>
              <li>✅ Unlimited stalls</li>
              <li>✅ Unlimited users</li>
              <li>✅ 24/7 support</li>
              <li>✅ Automatic updates</li>
              <li>✅ No hidden fees</li>
            </ul>
          </div>
          <button @click="openRegistration" class="btn-primary btn-block">
            🚀 Start Now
          </button>
          <p class="pricing-note">14-day free trial. No credit card required.</p>
        </div>
      </div>
    </section>

    <!-- ===== CTA ===== -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>Ready to Grow Your Chicken Business?</h2>
          <p>Join 50+ stalls already using Chickory Hub to manage their business better.</p>
          <button @click="openRegistration" class="btn-primary btn-lg">
            🚀 Get Started Now
          </button>
        </div>
      </div>
    </section>

    <!-- ===== REGISTRATION MODAL ===== -->
    <div v-if="showRegistration" class="modal-overlay" @click.self="closeRegistration">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>🚀 Start Your 14-Day Free Trial</h3>
          <button @click="closeRegistration" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <form @submit.prevent="submitRegistration">
            <div class="form-group">
              <label>Company Name *</label>
              <input v-model="regForm.company_name" type="text" required placeholder="e.g., Fried Chicken Sdn Bhd" />
            </div>
            <div class="form-group">
              <label>Contact Person *</label>
              <input v-model="regForm.contact_person" type="text" required placeholder="Full name" />
            </div>
            <div class="form-group">
              <label>Email Address *</label>
              <input v-model="regForm.email" type="email" required placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label>Phone Number *</label>
              <input v-model="regForm.phone" type="tel" required placeholder="012-3456789" />
            </div>
            <div class="form-group">
              <label>Payment Receipt</label>
              <div class="receipt-upload-area" @dragover.prevent @drop.prevent="handleReceiptDrop">
                <input type="file" ref="receiptInput" accept="image/*,application/pdf" @change="handleReceiptUpload" style="display:none" />
                <div v-if="regForm.receiptPreview" class="receipt-preview">
                  <img v-if="regForm.receiptPreview.startsWith('data:image')" :src="regForm.receiptPreview" alt="Receipt" />
                  <span v-else class="file-name">{{ regForm.receiptPreview }}</span>
                  <button @click="removeReceipt" class="remove-file">✕</button>
                </div>
                <div v-else class="receipt-placeholder" @click="$refs.receiptInput.click()">
                  <span class="upload-icon">📎</span>
                  <p>Upload payment receipt (PDF or image)</p>
                  <small>Max size: 5MB</small>
                </div>
              </div>
            </div>
            <button type="submit" class="btn-primary full-width" :disabled="submitting">
              {{ submitting ? 'Submitting...' : 'Start Free Trial' }}
            </button>
            <div class="modal-footer-links">
              <span>Already have an account?</span>
              <a href="#" @click.prevent="closeRegistration; goToLogin()">Sign in</a>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ===== FOOTER ===== -->
    <footer class="landing-footer">
      <div class="container">
        <div class="footer-content">
          <span class="footer-logo">🍗 Chickory Hub</span>
          <span class="footer-text">© 2026 All rights reserved</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import axios from 'axios'
import DashboardHeader from './DashboardHeader.vue'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.chickoryhub.com/api'

export default {
  name: 'LandingPage',
  components: {
    DashboardHeader
  },
  data() {
    return {
      systemBanner: localStorage.getItem('systemBanner') || null,
      showRegistration: false,
      submitting: false,
      regForm: {
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        receiptFile: null,
        receiptPreview: null
      }
    }
  },
  mounted() {
    this.fetchBanner()
  },
  methods: {
    async fetchBanner() {
      try {
        const response = await axios.get(`${API_BASE}/system/banner`)
        if (response.data.bannerUrl) {
          this.systemBanner = response.data.bannerUrl
          localStorage.setItem('systemBanner', response.data.bannerUrl)
        }
      } catch (err) {
        console.log('No system banner found')
      }
    },
    openRegistration() {
      this.showRegistration = true
    },
    closeRegistration() {
      this.showRegistration = false
      this.regForm = {
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        receiptFile: null,
        receiptPreview: null
      }
    },
    goToLogin() {
      this.$emit('show-login')
    },
    handleReceiptUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.processReceiptFile(file)
      }
    },
    handleReceiptDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file) {
        this.processReceiptFile(file)
      }
    },
    processReceiptFile(file) {
      if (file.size > 5 * 1024 * 1024) {
        this.$emit('show-notification', 'File too large. Maximum size is 5MB.', 'error')
        return
      }
      
      this.regForm.receiptFile = file
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.regForm.receiptPreview = e.target.result
        }
        reader.readAsDataURL(file)
      } else {
        this.regForm.receiptPreview = file.name
      }
      
      if (this.$refs.receiptInput) {
        this.$refs.receiptInput.value = ''
      }
    },
    removeReceipt() {
      this.regForm.receiptFile = null
      this.regForm.receiptPreview = null
    },
    async submitRegistration() {
      this.submitting = true
      
      try {
        let receiptBase64 = null
        if (this.regForm.receiptFile) {
          const reader = new FileReader()
          receiptBase64 = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result)
            reader.readAsDataURL(this.regForm.receiptFile)
          })
        }
        
        const payload = {
          company_name: this.regForm.company_name,
          contact_person: this.regForm.contact_person,
          email: this.regForm.email,
          phone: this.regForm.phone,
          payment_receipt: receiptBase64
        }
        
        const response = await axios.post(`${API_BASE}/register/request`, payload)
        
        if (response.data.success) {
          this.$emit('show-notification', 'Registration submitted successfully! Please wait for approval.', 'success')
          this.closeRegistration()
        }
      } catch (err) {
        console.error('Registration error:', err)
        const errorMsg = err.response?.data?.error || 'Failed to submit registration. Please try again.'
        this.$emit('show-notification', errorMsg, 'error')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--background);
  overflow-x: hidden;
}

/* ============================================ */
/* CONTAINER                                    */
/* ============================================ */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* ============================================ */
/* SECTION HEADER                               */
/* ============================================ */
.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
  background: rgba(249, 73, 8, 0.08);
  padding: 0.3rem 1rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.section-header h2 {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.section-header p {
  font-size: 1.05rem;
  color: var(--text-secondary);
}

/* ============================================ */
/* HERO SECTION                                 */
/* ============================================ */
.hero-section {
  padding: 3rem 0 4rem;
  background: linear-gradient(135deg, var(--background) 0%, var(--surface) 100%);
  border-bottom: 1px solid var(--border);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.hero-content {
  max-width: 600px;
}

.hero-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
  background: rgba(249, 73, 8, 0.08);
  padding: 0.25rem 1rem;
  border-radius: 20px;
  margin-bottom: 1.5rem;
}

.hero-content h1 {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.hero-content h1 span {
  color: var(--primary);
}

.hero-content p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 2rem;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 2rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(249, 73, 8, 0.3);
}

.btn-primary.btn-lg {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.btn-primary .btn-arrow {
  transition: transform 0.3s ease;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-primary.btn-block {
  width: 100%;
  justify-content: center;
}

.btn-primary.full-width {
  width: 100%;
  justify-content: center;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 2rem;
  background: transparent;
  color: var(--text);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-outline.btn-lg {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.btn-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-2px);
}

.hero-trust {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.trust-icon {
  font-size: 0.9rem;
}

/* Hero Visual */
.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-dashboard-preview {
  width: 100%;
  max-width: 500px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
}

.preview-card {
  width: 100%;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.preview-dot.red { background: #ef4444; }
.preview-dot.yellow { background: #f59e0b; }
.preview-dot.green { background: #10b981; }

.preview-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.preview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.preview-stat {
  background: var(--background);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  text-align: center;
}

.preview-stat .stat-number {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}

.preview-stat .stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.preview-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 80px;
  gap: 0.3rem;
  padding-top: 0.5rem;
}

.chart-bar {
  flex: 1;
  min-height: 10px;
  background: linear-gradient(180deg, var(--primary), var(--primary-light));
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}

/* ============================================ */
/* PROBLEM SECTION                              */
/* ============================================ */
.problem-section {
  padding: 4rem 0;
  background: var(--surface);
}

.problem-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

.problem-item {
  text-align: center;
  padding: 1.5rem;
}

.problem-icon {
  font-size: 2.2rem;
  margin-bottom: 0.75rem;
  display: block;
}

.problem-item h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.problem-item p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ============================================ */
/* FEATURES                                     */
/* ============================================ */
.features-section {
  padding: 4rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.feature-card {
  background: var(--surface);
  padding: 2rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  text-align: center;
  transition: var(--transition);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.feature-card.highlight {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(249, 73, 8, 0.03), rgba(250, 106, 46, 0.03));
}

.feature-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(249, 73, 8, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.feature-icon {
  font-size: 1.6rem;
}

.feature-card h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.feature-card p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ============================================ */
/* COMPARISON                                   */
/* ============================================ */
.comparison-section {
  padding: 4rem 0;
  background: var(--surface);
}

.comparison-table {
  max-width: 800px;
  margin: 0 auto;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
}

.comparison-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  background: var(--background);
}

.comparison-row.header {
  background: var(--surface);
  font-weight: 600;
  border-bottom: 2px solid var(--border);
}

.comparison-row:nth-child(even) {
  background: var(--surface);
}

.comparison-cell {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: var(--text);
  border-bottom: 1px solid var(--border-light);
}

.comparison-cell.feature {
  font-weight: 500;
}

.comparison-cell.chickory {
  color: var(--primary);
  font-weight: 600;
}

.comparison-cell.competitor {
  color: var(--text-secondary);
}

.comparison-row:last-child .comparison-cell {
  border-bottom: none;
}

/* ============================================ */
/* PRICING                                      */
/* ============================================ */
.pricing-section {
  padding: 4rem 0;
}

.pricing-card {
  max-width: 420px;
  margin: 0 auto;
  background: var(--surface);
  padding: 2.5rem;
  border-radius: var(--radius-lg);
  border: 2px solid var(--border);
  text-align: center;
  transition: var(--transition);
  position: relative;
}

.pricing-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  padding: 0.2rem 1rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.pricing-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.price {
  margin-bottom: 0.25rem;
}

.price .amount {
  font-size: 3rem;
  font-weight: 800;
  color: var(--primary);
}

.price .period {
  font-size: 1rem;
  color: var(--text-secondary);
}

.price-sub {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.pricing-features {
  margin: 1.5rem 0;
  text-align: left;
}

.pricing-features ul {
  list-style: none;
  padding: 0;
}

.pricing-features li {
  padding: 0.4rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.pricing-note {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

/* ============================================ */
/* CTA                                          */
/* ============================================ */
.cta-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  text-align: center;
}

.cta-content h2 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.cta-content p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.cta-content .btn-primary {
  background: white;
  color: var(--primary);
}

.cta-content .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

/* ============================================ */
/* MODAL                                        */
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
  background: #ffffff;
  border-radius: var(--radius);
  max-width: 520px;
  width: 92%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-lg {
  max-width: 640px;
}

.modal-modern-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.modal-modern-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #94a3b8;
  padding: 0 0.25rem;
  border-radius: 4px;
  transition: var(--transition);
  line-height: 1;
}

.modal-close-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.modal-modern-body {
  padding: 1.25rem;
  overflow-y: auto;
  max-height: 60vh;
  background: #ffffff;
}

/* ============================================ */
/* FORM                                         */
/* ============================================ */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.form-group input {
  padding: 0.5rem 0.7rem;
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  background: #ffffff;
  color: #1e293b;
  width: 100%;
  transition: var(--transition);
}

.form-group input:focus {
  outline: none;
  border-color: #F94908;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.08);
}

.modal-footer-links {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.modal-footer-links a {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.modal-footer-links a:hover {
  text-decoration: underline;
}

/* ============================================ */
/* RECEIPT UPLOAD                               */
/* ============================================ */
.receipt-upload-area {
  border: 2px dashed #e2e8f0;
  border-radius: var(--radius-sm);
  padding: 1rem;
  text-align: center;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.receipt-upload-area:hover {
  border-color: #F94908;
}

.receipt-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: #94a3b8;
}

.upload-icon {
  font-size: 2rem;
}

.receipt-placeholder p {
  margin: 0;
  font-size: 0.85rem;
}

.receipt-placeholder small {
  font-size: 0.7rem;
}

.receipt-preview {
  position: relative;
  max-width: 200px;
  margin: 0 auto;
}

.receipt-preview img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  border: 1px solid #e2e8f0;
}

.receipt-preview .file-name {
  font-size: 0.8rem;
  color: #1e293b;
  word-break: break-all;
}

.remove-file {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================================ */
/* FOOTER                                       */
/* ============================================ */
.landing-footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 1.5rem 0;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-logo {
  font-weight: 600;
  color: var(--primary);
}

.footer-text {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* ============================================ */
/* RESPONSIVE                                   */
/* ============================================ */
@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .hero-content {
    max-width: 100%;
  }
  
  .hero-content p {
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .hero-trust {
    justify-content: center;
  }
  
  .hero-visual {
    order: -1;
  }
  
  .hero-dashboard-preview {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .problem-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-dashboard-preview {
    max-width: 100%;
  }
  
  .problem-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .problem-item {
    padding: 1rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }
  
  .comparison-row {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }
  
  .comparison-cell {
    padding: 0.4rem;
    font-size: 0.8rem;
  }
  
  .comparison-row.header {
    display: none;
  }
  
  .comparison-cell.feature {
    font-weight: 700;
    border-bottom: 1px solid var(--border-light);
  }
  
  .section-header h2 {
    font-size: 1.6rem;
  }
  
  .pricing-card {
    padding: 1.5rem;
  }
  
  .price .amount {
    font-size: 2.2rem;
  }
  
  .cta-content h2 {
    font-size: 1.6rem;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-badge {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero-content h1 {
    font-size: 1.8rem;
  }
  
  .hero-content p {
    font-size: 0.95rem;
  }
  
  .problem-grid {
    grid-template-columns: 1fr;
  }
  
  .problem-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
    padding: 0.75rem 1rem;
    background: var(--surface);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
  }
  
  .problem-icon {
    font-size: 1.6rem;
    margin-bottom: 0;
    flex-shrink: 0;
  }
  
  .problem-item h3 {
    font-size: 0.9rem;
    margin-bottom: 0.1rem;
  }
  
  .problem-item p {
    font-size: 0.8rem;
  }
  
  .features-grid {
    max-width: 100%;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
  
  .modal-modern {
    width: 95%;
  }
  
  .modal-modern-body {
    padding: 1rem;
  }
  
  .preview-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .comparison-cell {
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
  }
  
  .container {
    padding: 0 1rem;
  }
  
  .hero-trust {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .trust-item {
    font-size: 0.8rem;
  }
}
</style>