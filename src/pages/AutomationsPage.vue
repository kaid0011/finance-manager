<template>
  <q-page class="q-pa-md max-width-container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-blue-grey-9">Active Automations</div>
      <q-btn color="teal-9" icon="add" label="New Schedule" @click="openDialog = true" unelevated />
    </div>
    
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6" v-for="sched in financeStore.schedules" :key="sched.id">
        <q-card class="schedule-card" :class="!sched.is_active ? 'bg-grey-3' : ''">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-h6 text-weight-bold" :class="!sched.is_active ? 'text-grey-6' : 'text-blue-grey-9'">
                {{ sched.name }}
              </div>
              <div class="text-caption text-grey-7 text-uppercase">
                <q-icon name="event" class="q-mr-xs"/>
                {{ sched.schedule_type }} • {{ sched.frequency.replace('_', ' ') }}
              </div>
              <div class="text-subtitle2 q-mt-sm text-weight-bold" :class="sched.action_type === 'income' ? 'text-green-8' : 'text-red-8'">
                ₱{{ Number(sched.amount).toLocaleString(undefined, {minimumFractionDigits: 2}) }} / period
              </div>
            </div>

            <div class="column items-center">
              <q-toggle 
                :model-value="sched.is_active" 
                color="teal-9"
                @update:model-value="financeStore.toggleSchedule(sched.id, sched.is_active)"
              />
              <div class="text-caption text-grey-6 text-weight-bold">{{ sched.is_active ? 'ACTIVE' : 'STOPPED' }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="openDialog">
      <q-card style="min-width: 350px; width: 100%; max-width: 500px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white">
          <div class="text-h6">Create Automation</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="submitSchedule" class="q-gutter-md">
            <q-input v-model="formData.name" type="text" label="Name (e.g., Netflix, iPhone Installment)" outlined dense required />
            
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select v-model="formData.schedule_type" :options="['installment', 'recurring']" label="Schedule Type" outlined dense required class="text-capitalize" />
              </div>
              <div class="col-6">
                <q-select v-model="formData.action_type" :options="['income', 'expense', 'transfer']" label="Transaction Type" outlined dense required class="text-capitalize" />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model="formData.start_date" type="date" label="First Payment Date" outlined dense required />
              </div>
              <div class="col-6">
                <q-select v-model="formData.frequency" :options="[{label: 'Monthly', value: 'monthly'}, {label: 'Every Cut Off (15th/EOM)', value: 'per_cutoff'}]" emit-value map-options label="Frequency" outlined dense required />
              </div>
            </div>

            <q-input v-if="formData.schedule_type === 'installment'" v-model.number="formData.duration" type="number" label="Total Periods (e.g. 6)" outlined dense required />

            <q-select v-if="formData.action_type !== 'income'" v-model="formData.from_account" :options="financeStore.accounts" option-label="name" option-value="id" map-options emit-value label="Charge From Account" outlined dense />
            <q-select v-if="formData.action_type !== 'expense'" v-model="formData.to_account" :options="financeStore.accounts" option-label="name" option-value="id" map-options emit-value label="Send To Account" outlined dense />
            <q-input v-model.number="formData.amount" type="number" step="0.01" label="Amount Per Period (₱)" outlined dense required />

            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" label="Start Automation" color="teal-9" :loading="financeStore.isLoading" unelevated />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'

const financeStore = useFinanceStore()
const openDialog = ref(false)

const formData = reactive({
  name: '',
  schedule_type: 'recurring',
  action_type: 'expense',
  frequency: 'monthly',
  start_date: new Date().toISOString().split('T')[0],
  duration: null,
  from_account: null,
  to_account: null,
  amount: null
})

const submitSchedule = async () => {
  const result = await financeStore.createSchedule({...formData})
  if (!result.error) {
    openDialog.value = false
    formData.name = ''
    formData.amount = null
    formData.duration = null
  }
}

onMounted(() => {
  if (financeStore.accounts.length === 0) financeStore.fetchInitialData()
})
</script>

<style scoped>
.max-width-container { max-width: 1000px; margin: 0 auto; }
.schedule-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border-left: 6px solid #008080; }
.schedule-card.bg-grey-3 { border-left-color: #9e9e9e; opacity: 0.8; }
</style>