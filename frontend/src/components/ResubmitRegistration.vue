<template>
  <div class="resubmit-overlay" @click.self="closeModal">
    <div class="resubmit-modal">
      <!-- ✅ Close Button - Restored -->
      <button class="modal-close-btn" @click="closeModal">✕</button>
      
      <div class="resubmit-modal-header">
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

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your registration data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Unable to Load Registration</h3>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button @click="closeModal" class="btn-secondary">Close</button>
          <button @click="goToHome" class="btn-primary">Go to Home</button>
        </div>
      </div>

      <!-- Rejection History -->
      <div v-else-if="rejectionHistory.length > 0" class="rejection-history">
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
      <form v-if="canResubmit && !loading && !error" @submit.prevent="handleResubmit" class="resubmit-form">
        <div class="form-group">
          <label for="company_name">Company Name *</label>
          <input
            type="text"
            id="company_name"
            v-model="form.company_name"
            required
            placeholder="Enter company name"
            :disabled="submitting"
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
            :disabled="submitting"
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
            :disabled="true"
            class="disabled-field"
          />
          <small>Email cannot be changed</small>
        </div>

        <div class="form-group">
          <label for="phone">Phone Number *</label>
          <input
            type="text"
            id="phone"
            v-model="form.phone"
            required
            placeholder="Enter phone number"
            :disabled="submitting"
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
            :disabled="submitting"
          />
          <small>Format: XXXXXX-XX-XXXX (e.g., 900101-10-1234)</small>
        </div>

        <div class="form-group">
          <label for="payment_receipt">Payment Receipt *</label>
          
          <!-- ✅ Show existing receipt if available -->
          <div v-if="existingReceipt" class="existing-receipt">
            <div class="receipt-info">
              <span class="receipt-label">📎 Current receipt:</span>
              <span class="receipt-filename">{{ getReceiptFileName(existingReceipt) }}</span>
            </div>
            <div class="receipt-actions">
              <button @click.prevent="viewExistingReceipt" class="receipt-link" type="button">
                View
              </button>
              <button @click="removeExistingReceipt" class="remove-receipt-btn" type="button" title="Remove existing receipt">
                ✕
              </button>
            </div>
          </div>
          
          <!-- File upload -->
          <input
            type="file"
            id="payment_receipt"
            ref="fileInput"
            @change="handleFileUpload"
            accept=".jpg,.jpeg,.png,.pdf"
            :disabled="submitting"
            :required="!existingReceipt"
          />
          <small>Accepted formats: JPG, PNG, PDF (Max 5MB)</small>
          
          <div v-if="form.payment_receipt" class="file-name">
            📎 New file selected: {{ form.payment_receipt.name }}
          </div>
        </div>

        <button type="submit" :disabled="submitting || !isFormValid" class="btn-primary">
          <span v-if="submitting">⏳ Submitting...</span>
          <span v-else>Submit Resubmission</span>
        </button>

        <div v-if="submitError" class="error-message">{{ submitError }}</div>
        <div v-if="submitSuccess" class="success-message">{{ submitSuccess }}</div>
      </form>

      <!-- Max Attempts Reached -->
      <div v-else-if="!canResubmit && !loading && !error" class="max-attempts">
        <div class="error-icon">⚠️</div>
        <h3>Maximum Attempts Reached</h3>
        <p>You have reached the maximum number of resubmission attempts (3).</p>
        <p>Please contact our support team for further assistance.</p>
        <div class="support-info">
          <p><strong>Email:</strong> support@chickoryhub.com</p>
        </div>
        <div class="error-actions">
          <button @click="closeModal" class="btn-secondary">Close</button>
          <button @click="goToHome" class="btn-primary">Go to Home</button>
        </div>
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
      existingReceipt: null,
      rejectionHistory: [],
      rejectionCount: 0,
      attemptsLeft: 3,
      canResubmit: true,
      loading: true,
      submitting: false,
      error: '',
      submitError: '',
      submitSuccess: '',
      requestId: null,
      isDataLoaded: false,
      receiptFileRemoved: false
    };
  },
  computed: {
    isFormValid() {
      // ✅ All fields must be filled AND either have a receipt or a new file selected
      const hasReceipt = this.existingReceipt || this.form.payment_receipt;
      return this.isDataLoaded &&
        this.form.company_name?.trim() &&
        this.form.contact_person?.trim() &&
        this.form.email?.trim() &&
        this.form.phone?.trim() &&
        this.form.ic_number?.trim() &&
        hasReceipt;
    }
  },
  mounted() {
    this.extractRequestId();
    if (this.requestId) {
      this.loadRegistrationData();
    } else {
      this.error = 'Invalid resubmit link. Please check your email.';
      this.loading = false;
    }
  },
  methods: {
    extractRequestId() {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const id = params.get('id');
      if (id) {
        this.requestId = decodeURIComponent(id);
        console.log('📝 Request ID:', this.requestId);
      }
    },

    async loadRegistrationData() {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await axios.get(
          `${API_BASE}/register/rejection-history/${encodeURIComponent(this.requestId)}`
        );
        
        const data = response.data;
        
        if (data.original_data) {
          this.form.company_name = data.original_data.company_name || '';
          this.form.contact_person = data.original_data.contact_person || '';
          this.form.email = data.original_data.email || this.requestId || '';
          this.form.phone = data.original_data.phone || '';
          this.form.ic_number = data.original_data.ic_number || '';
          
          // ✅ Store existing receipt
          this.existingReceipt = data.original_data.payment_receipt || null;
          this.isDataLoaded = true;
        }
        
        this.rejectionHistory = data.rejection_history || [];
        this.rejectionCount = data.rejection_count || 0;
        this.attemptsLeft = data.attempts_remaining || 0;
        this.canResubmit = this.attemptsLeft > 0;
        
        console.log('📊 Rejection data loaded:', data);
        console.log('📎 Existing receipt:', this.existingReceipt);
      } catch (error) {
        console.error('Error loading registration data:', error);
        
        if (error.response?.status === 404) {
          this.error = 'Registration not found. The link may have expired.';
        } else if (error.response?.status === 500) {
          this.error = 'Unable to load registration data. Please try again later.';
        } else {
          this.error = error.response?.data?.error || 'Failed to load registration data. Please try again.';
        }
      } finally {
        this.loading = false;
      }
    },

    getReceiptFileName(receiptPath) {
      if (!receiptPath) return 'No receipt';
      // Extract filename from path
      const parts = receiptPath.split('/');
      return parts[parts.length - 1] || receiptPath;
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          this.submitError = 'File size exceeds 5MB limit. Please choose a smaller file.';
          event.target.value = '';
          return;
        }
        this.form.payment_receipt = file;
        this.submitError = '';
      }
    },

    viewExistingReceipt() {
      if (this.existingReceipt) {
        // Emit event to view receipt
        this.$emit('view-receipt', this.existingReceipt);
      }
    },

    removeExistingReceipt() {
      if (confirm('Remove the existing receipt? You will need to upload a new one.')) {
        this.existingReceipt = null;
        this.receiptFileRemoved = true;
        this.form.payment_receipt = null;
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
      }
    },

    async handleResubmit() {
      this.submitError = '';
      this.submitSuccess = '';

      // Validate IC format
      const icRegex = /^\d{6}-\d{2}-\d{4}$/;
      if (!icRegex.test(this.form.ic_number)) {
        this.submitError = 'Invalid IC number format. Use: XXXXXX-XX-XXXX';
        return;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.form.email)) {
        this.submitError = 'Invalid email format.';
        return;
      }

      // ✅ Check if there's a receipt (either existing or new)
      if (!this.existingReceipt && !this.form.payment_receipt) {
        this.submitError = 'Payment receipt is required. Please upload a receipt.';
        return;
      }

      // Check if all fields are filled
      if (!this.isFormValid) {
        this.submitError = 'Please fill in all required fields.';
        return;
      }

      this.submitting = true;

      try {
        const formData = new FormData();
        formData.append('company_name', this.form.company_name);
        formData.append('contact_person', this.form.contact_person);
        formData.append('email', this.form.email);
        formData.append('phone', this.form.phone);
        formData.append('ic_number', this.form.ic_number);
        
        // ✅ Send the receipt - either new file or existing
        if (this.form.payment_receipt) {
          // If user uploaded a new file, use it
          formData.append('payment_receipt', this.form.payment_receipt);
        } else if (this.existingReceipt) {
          // If user kept the existing receipt, send the URL/path as a string
          formData.append('payment_receipt', this.existingReceipt);
        }

        const response = await axios.post(
          `${API_BASE}/register/resubmit/${this.requestId}`,
          formData,
          { 
            headers: { 
              'Content-Type': 'multipart/form-data'
            } 
          }
        );

        if (response.data.success) {
          this.submitSuccess = '✅ Registration resubmitted successfully! Please wait for approval.';
          
          // Clear form
          this.form.payment_receipt = null;
          if (this.$refs.fileInput) {
            this.$refs.fileInput.value = '';
          }
          
          // Close after 3 seconds
          setTimeout(() => {
            this.closeModal();
          }, 3000);
        }
      } catch (error) {
        console.error('Resubmit error:', error);
        this.submitError = error.response?.data?.error || 'Failed to resubmit. Please try again.';
      } finally {
        this.submitting = false;
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

    closeModal() {
      this.$emit('close');
      if (window.location.hash.startsWith('#/resubmit-registration')) {
        window.location.hash = '#/';
      }
    },

    goToHome() {
      this.closeModal();
      window.location.hash = '#/';
    }
  }
};
</script>

<style scoped>
.resubmit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.resubmit-modal {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  position: relative;
}

/* ✅ Close Button */
.modal-close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
  transition: var(--transition);
  z-index: 10;
}

.modal-close-btn:hover {
  color: #1e293b;
}

.resubmit-modal-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-right: 2rem;
}

.resubmit-modal-header h2 {
  color: #1e293b;
  font-size: 1.5rem;
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

.loading-state {
  text-align: center;
  padding: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #F94908;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 1rem 0;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.error-state p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
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

.resubmit-form .form-group input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.resubmit-form .form-group .disabled-field {
  background: #f1f5f9;
  color: #64748b;
}

.resubmit-form .form-group small {
  display: block;
  margin-top: 0.375rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

/* ✅ Existing Receipt Display */
.existing-receipt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  margin-bottom: 0.5rem;
}

.receipt-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.receipt-label {
  font-size: 0.85rem;
  color: #16a34a;
}

.receipt-filename {
  font-size: 0.85rem;
  color: #065f46;
  font-weight: 500;
}

.receipt-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.receipt-link {
  color: #F94908;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  background: none;
  border: none;
  text-decoration: underline;
}

.receipt-link:hover {
  color: #d63d07;
}

.remove-receipt-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #dc2626;
  font-size: 1rem;
  padding: 0 0.25rem;
}

.remove-receipt-btn:hover {
  color: #991b1b;
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
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  padding: 0.875rem 2rem;
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .resubmit-modal {
    padding: 1.5rem;
    margin: 10px;
  }
  
  .existing-receipt {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>