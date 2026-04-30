<template>
  <q-card class="password-change-card q-pa-md q-mt-xl">
    <q-card-section>
      <div class="text-h6 text-weight-bold text-blue-grey-9">Change Password</div>
      <div class="text-caption text-grey-7">
        Please enter your current password to authorize this change.
      </div>
    </q-card-section>

    <q-card-section>
      <q-form @submit.prevent="submitPasswordChange" class="q-gutter-md">
        
        <!-- Current Password -->
        <q-input
          v-model="passwordForm.current"
          :type="showCurrent ? 'text' : 'password'"
          label="Current Password"
          outlined
          dense
          lazy-rules
          :rules="[val => !!val || 'Please enter your current password']"
        >
          <template v-slot:append>
            <q-icon
              :name="showCurrent ? 'visibility_off' : 'visibility'"
              class="cursor-pointer text-grey-6"
              @click="showCurrent = !showCurrent"
            />
          </template>
        </q-input>

        <q-separator class="q-my-md" />

        <!-- New Password -->
        <q-input
          v-model="passwordForm.new"
          :type="showNew ? 'text' : 'password'"
          label="New Password"
          outlined
          dense
          lazy-rules
          :rules="[
            val => !!val || 'New password is required',
            val => val.length >= 6 || 'Password must be at least 6 characters'
          ]"
        >
          <template v-slot:append>
            <q-icon
              :name="showNew ? 'visibility_off' : 'visibility'"
              class="cursor-pointer text-grey-6"
              @click="showNew = !showNew"
            />
          </template>
        </q-input>

        <!-- Confirm New Password -->
        <q-input
          v-model="passwordForm.confirm"
          :type="showConfirm ? 'text' : 'password'"
          label="Confirm New Password"
          outlined
          dense
          lazy-rules
          :rules="[
            val => !!val || 'Please confirm your new password',
            val => val === passwordForm.new || 'Passwords do not match'
          ]"
        >
          <template v-slot:append>
            <q-icon
              :name="showConfirm ? 'visibility_off' : 'visibility'"
              class="cursor-pointer text-grey-6"
              @click="showConfirm = !showConfirm"
            />
          </template>
        </q-input>

        <!-- Action Buttons -->
        <div class="row justify-end q-mt-lg">
          <q-btn 
            label="Cancel" 
            color="grey-7" 
            flat 
            class="q-mr-sm" 
            @click="resetForm" 
            :disable="isLoading"
          />
          <q-btn 
            type="submit" 
            label="Update Password" 
            color="teal-9" 
            unelevated 
            :loading="isLoading" 
          />
        </div>

      </q-form>
    </q-card-section>
  </q-card>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore' 

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

// --- State ---
const passwordForm = reactive({
  current: '',
  new: '',
  confirm: ''
})

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const isLoading = ref(false)

// --- Actions ---
const resetForm = () => {
  passwordForm.current = ''
  passwordForm.new = ''
  passwordForm.confirm = ''
  showCurrent.value = false
  showNew.value = false
  showConfirm.value = false
}

const submitPasswordChange = async () => {
  isLoading.value = true
  const result = await authStore.changePassword(passwordForm.current, passwordForm.new)

  if (!result.error) {
    // 1. Show Success Message
    $q.notify({
      color: 'teal-9',
      textColor: 'white',
      icon: 'check_circle',
      message: 'Password updated successfully! Please log in again.'
    })
    
    resetForm()

    // 2. Auto Log Out
    await authStore.logout()

    // 3. Redirect to the login page (ensure '/login' matches your actual route path)
    router.push('/login') 
    
  } else {
    // Fail! Show the error message
    $q.notify({
      color: 'red-9',
      textColor: 'white',
      icon: 'error',
      message: result.message || 'Failed to update password. Please try again.'
    })
  }
  
  isLoading.value = false
}
</script>
<style scoped>
.password-change-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  max-width: 500px;
  margin: 0 auto;
  border: 1px solid #eceff1;
}

:deep(.q-field--focused .q-field__control) {
  border-color: #004d40 !important;
}
</style>