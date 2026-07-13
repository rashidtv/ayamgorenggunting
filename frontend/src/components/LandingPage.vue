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
            <p>All-in-one platform for chicken stall owners. Track sales, manage inventory, and grow your business from anywhere.</p>
            <div class="hero-actions">
              <button @click="openRegistration" class="btn-primary btn-lg">
                Register Now
                <span class="btn-arrow">→</span>
              </button>
              <button @click="goToLogin" class="btn-outline btn-lg">
                🔑 Sign In
              </button>
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
                  <svg viewBox="0 0 300 60" class="trend-svg">
                    <polyline
                      points="0,50 30,45 60,55 90,30 120,40 150,15 180,25 210,10 240,20 270,5 300,35"
                      fill="none"
                      stroke="#F94908"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <polygon
                      points="0,50 30,45 60,55 90,30 120,40 150,15 180,25 210,10 240,20 270,5 300,35 300,60 0,60"
                      fill="url(#trendGradient)"
                      opacity="0.2"
                    />
                    <defs>
                      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#F94908;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#F94908;stop-opacity:0" />
                      </linearGradient>
                    </defs>
                    <circle cx="270" cy="5" r="4" fill="#F94908" />
                    <circle cx="210" cy="10" r="4" fill="#F94908" />
                    <circle cx="150" cy="15" r="4" fill="#F94908" />
                    <circle cx="90" cy="30" r="4" fill="#F94908" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== ALL FEATURES ===== -->
    <section class="all-features-section">
      <div class="container">
        <div class="all-features-grid">
          <div class="all-feature-card">
            <div class="all-feature-icon">⚡</div>
            <h3>Real-time Sales</h3>
            <p>Track revenue and items sold instantly</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">🛒</div>
            <h3>Smart Inventory</h3>
            <p>Auto-deduct stock, set low alerts</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">📱</div>
            <h3>PWA Works Anywhere</h3>
            <p>Offline capable, no app store</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">🔐</div>
            <h3>Role-Based Access</h3>
            <p>Cashiers, Admins, Super Admins</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>Visual charts & performance</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">👨‍👩‍👧‍👦</div>
            <h3>Multi-Stall</h3>
            <p>All stalls, one dashboard</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">📋</div>
            <h3>No More Paper</h3>
            <p>Digital record keeping</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">📦</div>
            <h3>Never Run Out</h3>
            <p>Smart inventory alerts</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">📊</div>
            <h3>Know Your Business</h3>
            <p>Real-time analytics</p>
          </div>
          <div class="all-feature-card">
            <div class="all-feature-icon">👥</div>
            <h3>One Dashboard</h3>
            <p>Manage all stalls</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== PRICING ===== -->
<section class="pricing-section">
  <div class="container">
    <div class="pricing-header">
      <h2>One Plan. All Features.</h2>
      <p>Everything you need to run your chicken business.</p>
    </div>
    <div class="pricing-grid single">
      <div class="pricing-card featured">
        <div class="pricing-card-header">
          <h3>Chickory Hub Standard</h3>
          <div class="price">
            <span class="amount">RM940</span>
            <span class="period">/year</span>
          </div>
          <p class="price-sub">Includes RM100 setup fee (one-time)</p>
        </div>
        <ul class="pricing-list">
          <li>✅ Complete dashboard & analytics</li>
          <li>✅ Smart inventory management</li>
          <li>✅ Real-time sales tracking</li>
          <li>✅ Role-based access control</li>
          <li>✅ Free updates & improvements</li>
          <li>✅ Priority support</li>
        </ul>
        <button @click="openRegistration" class="btn-primary btn-block">
          Register Now
        </button>
      </div>
    </div>
  </div>
</section>

    <!-- ===== CTA ===== -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>Ready to Grow Your Business?</h2>
          <p>Start managing your chicken business the smart way.</p>
          <button @click="openRegistration" class="btn-primary btn-lg">
            🚀 Register Now
          </button>
        </div>
      </div>
    </section>

    <!-- ===== REGISTRATION MODAL ===== -->
    <div v-if="showRegistration" class="modal-overlay" @click.self="closeRegistration">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>🚀 Register Your Business</h3>
          <button @click="closeRegistration" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-modern-body">
          <!-- ✅ ERROR MESSAGE - Shows when registration fails -->
          <div v-if="registrationError" class="registration-error">
            <span class="error-icon">❌</span>
            <div>
              <strong>Registration Failed</strong>
              <p>{{ registrationError }}</p>
              <p v-if="registrationError.includes('already registered')" class="error-hint">
                <a href="#" @click.prevent="closeRegistration; goToLogin()">Click here to login</a>
              </p>
              <p v-if="registrationError.includes('contact support')" class="error-hint">
                Email: <a href="mailto:support@chickoryhub.com">support@chickoryhub.com</a>
              </p>
            </div>
          </div>

          <!-- ✅ SUCCESS MESSAGE - Shows when registration succeeds -->
          <div v-if="registrationSuccess" class="registration-success">
            <span class="success-icon">✅</span>
            <div>
              <strong>Registration Submitted!</strong>
              <p>{{ registrationSuccess }}</p>
              <p class="success-hint">You will receive an email once your registration is reviewed.</p>
            </div>
          </div>

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
              <label>IC Number *</label>
              <input 
                v-model="regForm.ic_number" 
                type="text" 
                required 
                placeholder="XXXXXX-XX-XXXX" 
                maxlength="14"
                @input="formatICNumber"
                :class="{ 'input-error': regForm.ic_number && !validateICNumber(regForm.ic_number) }"
              />
              <small style="color: var(--text-tertiary); font-size: 0.7rem;">
                Format: 6 digits - 2 digits - 4 digits (e.g., 880101-10-1234)
              </small>
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
              {{ submitting ? 'Submitting...' : 'Register Now' }}
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
          <span class="footer-logo">Chickory Hub</span>
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
      registrationError: '',
      registrationSuccess: '',
      regForm: {
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        ic_number: '',
        receiptFile: null,
        receiptPreview: null
      }
    }
  },
  mounted() {
    this.fetchBanner()
  },
  methods: {
    formatICNumber(event) {
      let value = event.target.value.replace(/\D/g, '');
      
      // Format as XXXXXX-XX-XXXX
      if (value.length > 6) {
        value = value.substring(0, 6) + '-' + value.substring(6);
      }
      if (value.length > 9) {
        value = value.substring(0, 9) + '-' + value.substring(9);
      }
      if (value.length > 14) {
        value = value.substring(0, 14);
      }
      
      this.regForm.ic_number = value;
    },

    validateICNumber(ic) {
      const regex = /^\d{6}-\d{2}-\d{4}$/;
      return regex.test(ic);
    },

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
      // Clear previous messages
      this.registrationError = ''
      this.registrationSuccess = ''
    },

    closeRegistration() {
      this.showRegistration = false
      this.registrationError = ''
      this.registrationSuccess = ''
      this.regForm = {
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        ic_number: '',
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
        this.registrationError = 'File too large. Maximum size is 5MB.'
        this.$emit('show-notification', 'File too large. Maximum size is 5MB.', 'error')
        return
      }
      
      this.regForm.receiptFile = file
      this.registrationError = ''
      
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
      this.registrationError = ''
      this.registrationSuccess = ''
      
      // ✅ Validate IC number
      if (!this.validateICNumber(this.regForm.ic_number)) {
        this.registrationError = 'Please enter a valid IC number (format: XXXXXX-XX-XXXX)'
        this.submitting = false
        return
      }
      
      // ✅ Validate company name
      if (!this.regForm.company_name.trim()) {
        this.registrationError = 'Please enter your company name'
        this.submitting = false
        return
      }
      
      // ✅ Validate contact person
      if (!this.regForm.contact_person.trim()) {
        this.registrationError = 'Please enter the contact person name'
        this.submitting = false
        return
      }
      
      // ✅ Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.regForm.email)) {
        this.registrationError = 'Please enter a valid email address'
        this.submitting = false
        return
      }
      
      // ✅ Validate phone
      if (!this.regForm.phone.trim()) {
        this.registrationError = 'Please enter your phone number'
        this.submitting = false
        return
      }
      
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
          company_name: this.regForm.company_name.trim(),
          contact_person: this.regForm.contact_person.trim(),
          email: this.regForm.email.trim().toLowerCase(),
          phone: this.regForm.phone.trim(),
          ic_number: this.regForm.ic_number,
          payment_receipt: receiptBase64
        }
        
        console.log('📤 Sending registration payload:', { ...payload, payment_receipt: payload.payment_receipt ? 'Present' : 'None' })
        
        const response = await axios.post(`${API_BASE}/register/request`, payload, {
          timeout: 30000
        })
        
        console.log('📥 Registration response:', response.data)
        
        if (response.data.success) {
          this.registrationSuccess = 'Registration submitted successfully! Please wait for approval.'
          this.$emit('show-notification', '✅ Registration submitted successfully! Please wait for approval.', 'success')
          
          // ✅ Close modal after delay
          setTimeout(() => {
            this.closeRegistration()
          }, 3000)
        }
      } catch (err) {
        console.error('❌ Registration error:', err)
        console.error('❌ Error response:', err.response)
        console.error('❌ Error data:', err.response?.data)
        
        // ✅ Get the specific error message from backend
        let errorMsg = 'Registration failed. Please try again.'
        
        if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
          errorMsg = 'Network error. Please check your internet connection and try again.'
        } else if (err.response) {
          // Backend responded with an error
          if (err.response.data?.error) {
            errorMsg = err.response.data.error
          } else if (err.response.data?.message) {
            errorMsg = err.response.data.message
          } else if (err.response.status === 400) {
            errorMsg = 'Invalid request. Please check your input and try again.'
          } else if (err.response.status === 500) {
            errorMsg = 'Server error. Please try again later or contact support.'
          }
        }
        
        this.registrationError = errorMsg
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
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
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
  height: 60px;
  display: flex;
  align-items: flex-end;
}

.trend-svg {
  width: 100%;
  height: 60px;
}

/* ============================================ */
/* ALL FEATURES                                 */
/* ============================================ */
.all-features-section {
  padding: 4rem 0;
  background: var(--surface);
}

.all-features-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
}

.all-feature-card {
  text-align: center;
  padding: 1.5rem 1rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
  transition: var(--transition);
  background: var(--background);
}

.all-feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.all-feature-icon {
  font-size: 2.2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  background: rgba(249, 73, 8, 0.10);
  color: #F94908;
  transition: var(--transition);
}

.all-feature-card:hover .all-feature-icon {
  background: rgba(249, 73, 8, 0.20);
  transform: scale(1.05);
}

.all-feature-card h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.2rem;
}

.all-feature-card p {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

/* ============================================ */
/* PRICING - SINGLE PLAN                        */
/* ============================================ */
.pricing-section {
  padding: 4rem 0;
  background: var(--background);
}

.pricing-header {
  text-align: center;
  margin-bottom: 3rem;
}

.pricing-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.pricing-header p {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.pricing-grid.single {
  display: grid;
  grid-template-columns: 1fr;
  max-width: 500px;
  margin: 0 auto;
}

.pricing-card {
  background: var(--surface);
  padding: 2.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  text-align: center;
  transition: var(--transition);
  position: relative;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.pricing-card.featured {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.pricing-card.featured:hover {
  box-shadow: var(--shadow-lg);
}

.pricing-card-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.pricing-card-header .price {
  margin-bottom: 0.25rem;
}

.pricing-card-header .amount {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--primary);
}

.pricing-card-header .period {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.pricing-card-header .price-sub {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.pricing-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  text-align: left;
}

.pricing-list li {
  padding: 0.4rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.plan-note {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-top: 0.75rem;
}

.btn-primary.btn-block {
  width: 100%;
  justify-content: center;
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
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.cta-content p {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
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

.input-error {
  border-color: #ef4444 !important;
  background: #fef2f2 !important;
}

.input-error:focus {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
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
/* REGISTRATION MESSAGES                        */
/* ============================================ */
.registration-error {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  color: #991b1b;
}

.registration-error .error-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.registration-error strong {
  display: block;
  font-size: 0.9rem;
}

.registration-error p {
  margin: 0.1rem 0;
  font-size: 0.85rem;
}

.registration-error .error-hint {
  margin-top: 0.3rem;
  font-size: 0.8rem;
}

.registration-error .error-hint a {
  color: #F94908;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.registration-error .error-hint a:hover {
  color: #d63d07;
}

.registration-success {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  color: #166534;
}

.registration-success .success-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.registration-success strong {
  display: block;
  font-size: 0.9rem;
}

.registration-success p {
  margin: 0.1rem 0;
  font-size: 0.85rem;
}

.registration-success .success-hint {
  font-size: 0.8rem;
  color: #15803d;
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
  
  .hero-visual {
    order: -1;
  }
  
  .hero-dashboard-preview {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .all-features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-header h2 {
    font-size: 1.5rem;
  }
  
  .pricing-card {
    padding: 1.5rem;
  }
  
  .pricing-card-header .amount {
    font-size: 2.2rem;
  }
}

@media (max-width: 480px) {
  .pricing-card {
    padding: 1.25rem;
  }
  
  .pricing-card-header .amount {
    font-size: 1.8rem;
  }
  
  .pricing-list li {
    font-size: 0.8rem;
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
  
  .all-features-grid {
    grid-template-columns: repeat(2, 1fr);
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
  
  .hero-dashboard-preview {
    padding: 1rem;
  }
  
  .preview-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .preview-stat .stat-number {
    font-size: 1rem;
  }
  
  .all-features-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .all-feature-icon {
    width: 48px;
    height: 48px;
    font-size: 1.6rem;
  }
  
  .all-feature-card {
    padding: 1rem 0.75rem;
  }
  
  .all-feature-card h3 {
    font-size: 0.8rem;
  }
  
  .all-feature-card p {
    font-size: 0.65rem;
  }
  
  .container {
    padding: 0 1rem;
  }
  
  .pricing-card {
    padding: 1.5rem;
  }
  
  .price .amount {
    font-size: 2.2rem;
  }
  
  .cta-content h2 {
    font-size: 1.5rem;
  }
}
</style>