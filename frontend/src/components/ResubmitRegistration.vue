<template>
  <div class="resubmit-container">
    <div class="resubmit-card">
      <div class="resubmit-header">
        <h2>📝 Resubmit Registration</h2>
        <p v-if="rejectionCount > 0" class="attempt-info">
          Attempt {{ rejectionCount }} of 3
          <span class="attempts-left" v-if="attemptsLeft > 0">
            ({{ attemptsLeft }} attempts remaining)
          </span>
          <span class="attempts-warning" v-else>
            (No attempts remaining)
          </span>
        </p>
      </div>

      <!-- Rejection History -->
      <div v-if="rejectionHistory.length > 0" class="rejection-history">
        <h4>Rejection History</h4>
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

      <!-- Resubmit Form -->
      <form @submit.prevent="handleResubmit" class="resubmit-form" v-if="canResubmit">
        <div class="form-group">
          <label for="company_name">Company Name *</label>
          <input
            type="text"
            id="company_name"
            v-model="form.company_name"
            required
            placeholder="Enter company name"
          />
        </div>

        <div class="form-group">
          <label for="contact_person">Contact Person *</label>
          <input
            type="text"
            id="contact_person"
            v-model="form.contact_person"
            required
            placeholder="Enter contact person name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
            placeholder="Enter email address"
          />
        </div>

        <div class="form-group">
          <label for="phone">Phone Number *</label>
          <input
            type="text"
            id="phone"
            v-model="form.phone"
            required
            placeholder="Enter phone number"
          />
        </div>

        <div class="form-group">
          <label for="ic_number">IC Number *</label>
          <input
            type="text"
            id="ic_number"
            v-model="form.ic_number"
            required
            placeholder="XXXXXX-XX-XXXX"
            pattern="\d{6}-\d{2}-\d{4}"
          />
          <small>Format: XXXXXX-XX-XXXX (e.g., 900101-10-1234)</small>
        </div>

        <div class="form-group">
          <label for="payment_receipt">Payment Receipt (Optional)</label>
          <input
            type="file"
            id="payment_receipt"
            @change="handleFileUpload"
            accept=".jpg,.jpeg,.png,.pdf"
          />
          <small>Accepted formats: JPG, PNG, PDF (Max 5MB)</small>
          <div v-if="form.payment_receipt" class="file-name">
            📎 {{ form.payment_receipt.name || form.payment_receipt }}
          </div>
        </div>

        <button type="submit" :disabled="loading" class="btn-primary">
          <span v-if="loading">⏳ Submitting...</span>
          <span v-else>Submit Resubmission</span>
        </button>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
      </form>

      <!-- Max Attempts Reached -->
      <div v-else class="max-attempts">
        <div class="error-icon">⚠️</div>
        <h3>Maximum Attempts Reached</h3>
        <p>You have reached the maximum number of resubmission attempts (3).</p>
        <p>Please contact our support team for further assistance.</p>
        <div class="support-info">
          <p><strong>Email:</strong> support@chickoryhub.com</p>
          <p><strong>Phone:</strong> +60 12-345 6789</p>
        </div>
        <button @click="goToLogin" class="btn-primary">Back to Login</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import API_BASE from '../config/api.js';

export default {
  name: 'ResubmitRegistration',
  data() {
    return {
      form: {
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        ic_number: '',
        payment_receipt: null
      },
      rejectionHistory: [],
      rejectionCount: 0,
      attemptsLeft: 3,
      canResubmit: true,
      loading: false,
      error: '',
      success: '',
      requestId: null
    };
  },
  mounted() {
    this.extractRequestId();
    if (this.requestId) {
      this.loadRegistrationData();
    } else {
      this.error = 'Invalid resubmit link. Please check your email.';
    }
  },
  methods: {
    extractRequestId() {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const id = params.get('id');
      if (id) {
        this.requestId = id;
        console.log('📝 Request ID:', this.requestId);
      }
    },

    async loadRegistrationData() {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        const response = await axios.get(
          `${API_BASE}/register/rejection-history/${this.requestId}`,
          config
        );
        
        const data = response.data;
        this.rejectionHistory = data.rejection_history || [];
        this.rejectionCount = data.rejection_count || 0;
        this.attemptsLeft = data.attempts_remaining || 0;
        this.canResubmit = this.attemptsLeft > 0;
        
        console.log('📊 Rejection data loaded:', data);
      } catch (error) {
        console.error('Error loading registration data:', error);
        this.error = 'Failed to load registration data. Please try again.';
      }
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          this.error = 'File size exceeds 5MB limit. Please choose a smaller file.';
          event.target.value = '';
          return;
        }
        this.form.payment_receipt = file;
        this.error = '';
      }
    },

    async handleResubmit() {
      this.error = '';
      this.success = '';

      // Validate IC format
      const icRegex = /^\d{6}-\d{2}-\d{4}$/;
      if (!icRegex.test(this.form.ic_number)) {
        this.error = 'Invalid IC number format. Use: XXXXXX-XX-XXXX';
        return;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.form.email)) {
        this.error = 'Invalid email format.';
        return;
      }

      this.loading = true;

      try {
        const formData = new FormData();
        formData.append('company_name', this.form.company_name);
        formData.append('contact_person', this.form.contact_person);
        formData.append('email', this.form.email);
        formData.append('phone', this.form.phone);
        formData.append('ic_number', this.form.ic_number);
        if (this.form.payment_receipt) {
          formData.append('payment_receipt', this.form.payment_receipt);
        }

        // Store the email for redirection
        const email = this.form.email;

        const response = await axios.post(
          `${API_BASE}/register/resubmit/${this.requestId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        this.success = '✅ Registration resubmitted successfully! Please wait for approval.';
        
        // Clear form
        this.form = {
          company_name: '',
          contact_person: '',
          email: '',
          phone: '',
          ic_number: '',
          payment_receipt: null
        };
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.hash = '#/login';
          window.location.reload();
        }, 3000);

      } catch (error) {
        console.error('Resubmit error:', error);
        this.error = error.response?.data?.error || 'Failed to resubmit. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    goToLogin() {
      window.location.hash = '#/login';
    }
  }
};
</script>

<style scoped>
.resubmit-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.resubmit-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}

.resubmit-header {
  text-align: center;
  margin-bottom: 2rem;
}

.resubmit-header h2 {
  color: #1e293b;
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.attempt-info {
  color: #64748b;
  font-size: 0.95rem;
}

.attempts-left {
  color: #16a34a;
  font-weight: 600;
}

.attempts-warning {
  color: #dc2626;
  font-weight: 600;
}

.rejection-history {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.rejection-history h4 {
  color: #1e293b;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.history-item {
  background: white;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-left: 3px solid #F94908;
}

.history-item:last-child {
  margin-bottom: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.attempt-badge {
  background: #F94908;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.history-date {
  color: #94a3b8;
  font-size: 0.8rem;
}

.history-reason,
.history-rejected-by {
  color: #64748b;
  font-size: 0.85rem;
  margin: 0.125rem 0;
}

.resubmit-form .form-group {
  margin-bottom: 1.25rem;
}

.resubmit-form .form-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  color: #334155;
  font-size: 0.9rem;
}

.resubmit-form .form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f8fafc;
  color: #1e293b;
}

.resubmit-form .form-group input:focus {
  outline: none;
  border-color: #F94908;
  background: white;
  box-shadow: 0 0 0 3px rgba(249, 73, 8, 0.1);
}

.resubmit-form .form-group small {
  display: block;
  margin-top: 0.375rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

.file-name {
  margin-top: 0.375rem;
  color: #16a34a;
  font-size: 0.85rem;
}

.btn-primary {
  width: 100%;
  padding: 0.875rem;
  background: #F94908;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background: #d63d07;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 73, 8, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  border: 1px solid #fecaca;
  text-align: center;
  font-size: 0.9rem;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  text-align: center;
  font-size: 0.9rem;
}

.max-attempts {
  text-align: center;
  padding: 1rem 0;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.max-attempts h3 {
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.max-attempts p {
  color: #64748b;
  margin: 0.25rem 0;
}

.support-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
  text-align: left;
}

.support-info p {
  color: #1e293b;
  margin: 0.25rem 0;
}

@media (max-width: 480px) {
  .resubmit-card {
    padding: 1.5rem;
    margin: 10px;
  }
}
</style>