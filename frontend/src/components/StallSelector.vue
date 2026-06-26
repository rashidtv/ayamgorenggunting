<template>
  <div v-if="stalls.length > 1" class="stall-selector">
    <label>🏪 Active Stall:</label>
    <select v-model="selectedId" @change="onChange">
      <option v-for="s in stalls" :key="s.id" :value="s.id">
        {{ s.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const stalls = computed(() => authStore.assignedStalls);
const selectedId = computed({
  get: () => authStore.activeStallId,
  set: (val) => authStore.switchStall(val),
});

const onChange = () => {
  // Reload inventory or refresh data
  window.location.reload();
};
</script>

<style scoped>
.stall-selector {
  background: #f0f0f0;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
select {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
}
</style>