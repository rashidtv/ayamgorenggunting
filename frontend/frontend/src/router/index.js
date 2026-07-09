import { createRouter, createWebHashHistory } from 'vue-router'

// Import components
import LandingPage from '../components/LandingPage.vue'
import Login from '../components/Login.vue'
import DashboardWrapper from '../components/DashboardWrapper.vue'
import ResetPassword from '../components/ResetPassword.vue'
import FirstLoginReset from '../components/FirstLoginReset.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { public: true },
    props: (route) => ({ token: route.query.token })
  },
  {
    path: '/first-login-reset',
    name: 'FirstLoginReset',
    component: FirstLoginReset,
    meta: { requiresFirstLogin: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardWrapper,
    meta: { requiresAuth: true }
  },
  // Catch-all redirect for unknown routes
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// ==================== ROUTE GUARDS ====================

const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

const needsFirstLoginReset = () => {
  return sessionStorage.getItem('needsPasswordReset') === 'true'
}

router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated()
  const needsReset = needsFirstLoginReset()
  
  console.log(`🔀 Navigating to: ${to.path} | Auth: ${authenticated} | NeedsReset: ${needsReset}`)
  
  // FIRST LOGIN RESET - Highest priority
  if (needsReset && to.path !== '/first-login-reset') {
    console.log('🔄 Redirecting to first login reset')
    return next('/first-login-reset')
  }
  
  // If already on first-login-reset but doesn't need it
  if (to.path === '/first-login-reset' && !needsReset) {
    console.log('🔄 No reset needed, redirecting to dashboard')
    return next(authenticated ? '/dashboard' : '/login')
  }
  
  // AUTHENTICATION CHECK
  if (to.meta.requiresAuth && !authenticated) {
    console.log('🔒 Authentication required, redirecting to login')
    return next('/login')
  }
  
  // Already authenticated - redirect from public pages
  if (to.meta.public && authenticated && to.path !== '/') {
    console.log('👤 Already authenticated, redirecting to dashboard')
    return next('/dashboard')
  }
  
  // ALWAYS ALLOW these pages
  if (to.path === '/' || to.path === '/login' || to.path === '/first-login-reset' || to.path === '/reset-password') {
    return next()
  }
  
  // Default: proceed
  next()
})

router.afterEach((to) => {
  // Update page title
  const titles = {
    '/': 'Chickory Hub - Home',
    '/login': 'Chickory Hub - Login',
    '/dashboard': 'Chickory Hub - Dashboard',
    '/reset-password': 'Chickory Hub - Reset Password',
    '/first-login-reset': 'Chickory Hub - First Login'
  }
  document.title = titles[to.path] || 'Chickory Hub'
  
  // Scroll to top
  window.scrollTo(0, 0)
})

router.onError((error) => {
  console.error('Router error:', error)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.log('🔄 Lazy loading failed, refreshing...')
    window.location.reload()
  }
})

export default router