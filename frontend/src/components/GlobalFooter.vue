<template>
  <footer class="global-footer">
    <div class="footer-content">
      <div class="footer-brand">
        <span class="footer-logo">Chickory Hub</span>
      </div>
      <div class="footer-info">
        <span class="footer-text">© 2026 All rights reserved</span>
        <span class="footer-divider">|</span>
        <span class="footer-powered">Powered by Rashid Base Resources</span>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'GlobalFooter'
}
</script>

<style scoped>
.global-footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 1rem 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer-brand {
  display: flex;
  align-items: center;
}

.footer-logo {
  font-weight: 600;
  color: var(--primary);
  font-size: 0.9rem;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.footer-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.footer-divider {
  color: var(--border);
  font-size: 0.75rem;
}

.footer-powered {
  font-size: 0.6rem;
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 0.25rem;
    padding: 0 1rem;
  }
  
  .footer-info {
    justify-content: center;
    flex-direction: column;
    gap: 0.1rem;
  }
  
  .footer-divider {
    display: none;
  }
  
  .footer-text {
    font-size: 0.65rem;
  }
  
  .footer-powered {
    font-size: 0.55rem;
  }
}

@media (max-width: 480px) {
  .footer-logo {
    font-size: 0.8rem;
  }
  
  .footer-text {
    font-size: 0.6rem;
  }
  
  .footer-powered {
    font-size: 0.5rem;
  }
}
</style>