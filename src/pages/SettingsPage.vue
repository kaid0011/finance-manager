<template>
  <q-page class="q-pa-md max-width-container">
    <div class="text-h5 text-weight-bold text-blue-grey-9 q-mb-md">Account Settings</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card class="settings-card shadow-1">
          <q-card-section class="bg-blue-grey-1">
            <div class="text-subtitle1 text-weight-bold text-blue-grey-9">Change Password</div>
          </q-card-section>
          
          <q-card-section>
            <q-form @submit="handleChangePassword" class="q-gutter-md">
              <div class="text-caption text-grey-7">Logged in as: <strong>{{ authStore.user?.email }}</strong></div>
              
              <q-input v-model="newPassword" type="password" label="New Password" outlined dense required />
              <q-input v-model="confirmPassword" type="password" label="Confirm Password" outlined dense required :error="passwordMismatch" error-message="Passwords do not match" />
              
              <div v-if="successMessage" class="text-teal-9 text-weight-bold">{{ successMessage }}</div>
              <div v-if="authStore.authError" class="text-red-9">{{ authStore.authError }}</div>

              <q-btn type="submit" color="blue-grey-9" label="Update Password" :loading="authStore.isLoading" :disable="passwordMismatch" unelevated />
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const newPassword = ref('')
const confirmPassword = ref('')
const successMessage = ref('')

const passwordMismatch = computed(() => {
  return confirmPassword.value !== '' && newPassword.value !== confirmPassword.value
})

const handleChangePassword = async () => {
  if (passwordMismatch.value) return
  
  successMessage.value = ''
  const result = await authStore.updatePassword(newPassword.value)
  
  if (!result.error) {
    successMessage.value = 'Password successfully updated.'
    newPassword.value = ''
    confirmPassword.value = ''
    
    // Clear success message after 3 seconds
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
}
</script>

<style scoped>
.max-width-container { max-width: 1000px; margin: 0 auto; }
.settings-card { border-radius: 12px; overflow: hidden; }
</style>