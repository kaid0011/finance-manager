<template>
  <q-layout view="hHh Lpr fFf" class="bg-grey-2">
    
    <!-- ADDED v-if: Only show the header if logged in -->
    <q-header v-if="authStore.user" elevated class="bg-blue-grey-9 text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-icon name="account_balance" size="sm" class="q-mr-sm q-ml-sm" />
        <q-toolbar-title class="text-weight-bold">
          Finance Manager Pro
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- ADDED v-if: Only show the side menu if logged in -->
    <q-drawer v-if="authStore.user" v-model="leftDrawerOpen" bordered class="bg-white" :width="250">
      <q-list padding>
        <q-item-label header class="text-weight-bold text-uppercase text-grey-6">Main Menu</q-item-label>

        <q-item clickable v-ripple to="/" exact active-class="text-teal-9 bg-teal-1">
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section class="text-weight-medium">Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/reports" exact active-class="text-teal-9 bg-teal-1">
          <q-item-section avatar>
            <q-icon name="bar_chart" />
          </q-item-section>
          <q-item-section class="text-weight-medium">Monthly Reports</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/automations" exact active-class="text-teal-9 bg-teal-1">
          <q-item-section avatar>
            <q-icon name="event_repeat" />
          </q-item-section>
          <q-item-section class="text-weight-medium">Automations</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/accounts" exact active-class="text-teal-9 bg-teal-1">
          <q-item-section avatar>
            <q-icon name="account_balance_wallet" />
          </q-item-section>
          <q-item-section class="text-weight-medium">Manage Accounts</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/savings" exact active-class="text-teal-9 bg-teal-1">
          <q-item-section avatar>
            <q-icon name="track_changes" />
          </q-item-section>
          <q-item-section class="text-weight-medium">Savings/Goals</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/loans" exact active-class="text-teal-9 bg-teal-1">
          <q-item-section avatar>
            <q-icon name="credit_score" />
          </q-item-section>
          <q-item-section class="text-weight-medium">Debt & Loans</q-item-section>
        </q-item>

        <q-separator class="q-my-md" />
        <q-item clickable v-ripple to="/settings" exact active-class="text-teal-9 bg-teal-1">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section class="text-weight-medium">Settings</q-item-section>
        </q-item>
        
        <q-item clickable v-ripple @click="handleLogout" class="text-red-9">
          <q-item-section avatar>
            <q-icon name="logout" color="red-9" />
          </q-item-section>
          <q-item-section class="text-weight-bold">Sign Out</q-item-section>
        </q-item>

      </q-list>
    </q-drawer>

    <!-- The Page Container will still render the Login Page perfectly full-screen -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const leftDrawerOpen = ref(true)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style scoped>
/* Scoped styles are intentionally empty as Quasar handles the layout utility classes perfectly */
</style>