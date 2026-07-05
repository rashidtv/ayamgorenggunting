<template>
  <div class="landing-page">
    <!-- ===== PUBLIC HEADER ===== -->
    <DashboardHeader 
      :is-public="true"
      role-text="Chickory Hub"
      :banner-url="systemBanner"
    />

    <!-- ===== FEATURES ===== -->
    <section class="features-section">
      <div class="container">
        <h2>Why Choose Chickory Hub?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Real-time Analytics</h3>
            <p>Track sales, inventory, and performance in real-time</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🛒</div>
            <h3>Multi-stall Management</h3>
            <p>Manage multiple stalls from a single dashboard</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>PWA Ready</h3>
            <p>Access your business from any device, anywhere</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Secure & Reliable</h3>
            <p>Enterprise-grade security with role-based access</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== PRICING ===== -->
    <section class="pricing-section">
      <div class="container">
        <h2>Simple Pricing</h2>
        <div class="pricing-card">
          <div class="pricing-header">
            <h3>Annual Plan</h3>
            <div class="price">
              <span class="amount">RM70</span>
              <span class="period">/month</span>
            </div>
            <div class="price-detail">RM840/year + RM100 setup fee</div>
            <div class="price-total">Total: RM940 for first year</div>
          </div>
          <div class="pricing-features">
            <ul>
              <li>✅ All features included</li>
              <li>✅ Unlimited stalls</li>
              <li>✅ Unlimited users</li>
              <li>✅ 24/7 support</li>
              <li>✅ Automatic updates</li>
            </ul>
          </div>
          <button @click="openRegistration" class="btn-primary">Get Started</button>
        </div>
      </div>
    </section>

    <!-- ===== REGISTRATION MODAL ===== -->
    <div v-if="showRegistration" class="modal-overlay" @click.self="closeRegistration">
      <div class="modal-modern modal-lg">
        <div class="modal-modern-header">
          <h3>Register Your Business</h3>
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
                  <p>Click to upload payment receipt (PDF or image)</p>
                  <small>Max size: 5MB</small>
                </div>
              </div>
            </div>
            <button type="submit" class="btn-primary full-width" :disabled="submitting">
              {{ submitting ? 'Submitting...' : 'Submit Registration' }}
            </button>
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

const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api'

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
/* FEATURES                                     */
/* ============================================ */
.features-section {
  padding: 4rem 0;
}

.features-section h2 {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--text);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
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
  box-shadow: var(--shadow);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.feature-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ============================================ */
/* PRICING                                      */
/* ============================================ */
.pricing-section {
  padding: 4rem 0;
  background: var(--surface);
}

.pricing-section h2 {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--text);
}

.pricing-card {
  max-width: 400px;
  margin: 0 auto;
  background: var(--background);
  padding: 2rem;
  border-radius: var(--radius);
  border: 2px solid var(--border);
  text-align: center;
  transition: var(--transition);
}

.pricing-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow);
}

.pricing-header h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text);
}

.price {
  margin-bottom: 0.5rem;
}

.price .amount {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
}

.price .period {
  font-size: 1rem;
  color: var(--text-secondary);
}

.price-detail {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.price-total {
  margin-top: 0.5rem;
  font-weight: 600;
  color: var(--text);
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
  padding: 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* ============================================ */
/* BUTTONS                                      */
/* ============================================ */
.btn-primary {
  display: inline-block;
  padding: 0.8rem 2rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
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
@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .pricing-card {
    margin: 0 1rem;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .features-section {
    padding: 2rem 0;
  }
  
  .pricing-section {
    padding: 2rem 0;
  }
  
  .pricing-card {
    padding: 1.5rem;
  }
  
  .modal-modern {
    width: 95%;
  }
  
  .container {
    padding: 0 1rem;
  }
}
</style>