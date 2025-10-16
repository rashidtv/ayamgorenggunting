<template>
  <div class="loading-spinner">
    <div class="spinner"></div>
    <span v-if="message" class="loading-message">{{ message }}</span>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: ['message']
}
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-left: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-message {
  color: var(--text-light);
  font-size: 0.9rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>