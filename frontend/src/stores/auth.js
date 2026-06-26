import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    activeStallId: null,
  }),
  getters: {
    assignedStalls: (state) => state.user?.assigned_stalls || [],
    isMultiStallAdmin: (state) => state.user?.assigned_stalls?.length > 1,
  },
  actions: {
    setUser(user, token) {
      this.user = user;
      this.token = token;
      this.activeStallId = user?.assigned_stalls?.[0]?.id || null;
    },
    switchStall(stallId) {
      this.activeStallId = stallId;
    },
    logout() {
      this.user = null;
      this.token = null;
      this.activeStallId = null;
    },
  },
});