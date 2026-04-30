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
    component: ResetPasswordPage,
    meta: { requiresAuth: true },
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

  // Always ensure authStore is initialized before deciding
  if (authStore.user === null) {
    await authStore.initialize()
  }

  // If the route requires auth, and they don't have a user -> redirect to login
  if (to.meta.requiresAuth && !authStore.user) {
    return next('/login')
  }

  // If they are already logged in and try to go to the login page -> redirect to dashboard
  if (to.path === '/login' && authStore.user) {
    return next('/')
  }

  return next()
})

export default router