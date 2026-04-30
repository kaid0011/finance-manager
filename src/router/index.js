import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import MainLayout from '../layouts/MainLayout.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import ReportsPage from '../pages/ReportsPage.vue'
import AutomationsPage from '../pages/AutomationsPage.vue'
import AccountsPage from '../pages/AccountsPage.vue'
import SavingsPage from '../pages/SavingsPage.vue'
import LoansPage from '../pages/LoansPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import ResetPasswordPage from '@/pages/ResetPasswordPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

const routes = [
  {
    path: '/login',
    component: LoginPage 
  },
  {
    path: '/reset-password',
    component: ResetPasswordPage
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: DashboardPage },
      { path: 'reports', component: ReportsPage },
      { path: 'automations', component: AutomationsPage },
      { path: 'accounts', component: AccountsPage },
      { path: 'savings', component: SavingsPage },
      { path: 'loans', component: LoansPage },
      { path: 'settings', component: SettingsPage },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If the app just loaded, check if they have an active token in their browser cookies
  if (authStore.user === null) {
    await authStore.initialize()
  }

  if (to.path === '/reset-password') {
    return next()
  }
  // If the route requires auth, and they don't have a user, kick them to login
  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } 
  // If they are already logged in and try to go to the login page, kick them to dashboard
  else if (to.path === '/login' && authStore.user) {
    next('/')
  } 
  else {
    next() // Let them through
  }
})

export default router