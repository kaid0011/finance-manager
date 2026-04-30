<template>
  <q-page class="q-pa-md max-width-container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-blue-grey-9">Automations & Schedules</div>
      <q-btn color="teal-9" icon="add" label="New Automation" @click="openAddDialog" unelevated />
    </div>
<div class="row q-gutter-md items-center q-mb-lg text-caption text-weight-bold text-grey-7">
      <div class="row items-center">
        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #c62828;" class="q-mr-sm"></div>
        Loan Payoff
      </div>
      <div class="row items-center">
        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #e65100;" class="q-mr-sm"></div>
        Fixed Installment
      </div>
      <div class="row items-center">
        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #1565c0;" class="q-mr-sm"></div>
        Recurring Bill
      </div>
    </div>
    <!-- Empty State -->
    <div v-if="financeStore.schedules.length === 0" class="text-center q-py-xl bg-white rounded-borders shadow-1">
      <q-icon name="event_repeat" size="xl" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-sm">No Automations Found</div>
      <div class="text-caption text-grey-5">Create a schedule to automatically generate future planned transactions.</div>
    </div>

    <!-- Schedules Grid -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6" v-for="sched in financeStore.schedules" :key="sched.id">
        <!-- Smart Dynamic Background Color -->
      <!-- Smart Dynamic Background Color by Schedule Lifespan -->
        <q-card 
          class="schedule-card" 
          :class="[
            !sched.is_active ? 'bg-grey-2 opacity-80' : 
            sched.loan_id ? 'bg-red-1 border-red' :
            sched.schedule_type === 'installment' ? 'bg-orange-1 border-orange' :
            'bg-blue-1 border-blue'
          ]"
        > <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-h6 text-weight-bold text-blue-grey-9">
                <q-icon name="autorenew" :color="sched.is_active ? 'teal-9' : 'grey-5'" size="sm" class="q-mr-xs" />
                {{ sched.name }}
              </div>
              
              <div class="row items-center">
                <!-- SMART EDIT BUTTON: Locks if tied to a loan! -->
                <q-btn v-if="!sched.loan_id" flat round dense color="blue-grey-5" icon="edit" @click="openEditDialog(sched)" class="q-mr-sm">
                  <q-tooltip>Edit Schedule</q-tooltip>
                </q-btn>
                <q-btn v-else flat round dense color="red-3" icon="lock" class="q-mr-sm">
                  <q-tooltip class="bg-red-9 text-weight-bold text-caption">Locked: Edit payment terms in the Loans tab</q-tooltip>
                </q-btn>

                <!-- Users can still pause/play a loan schedule from here -->
                <q-toggle
                  v-model="sched.is_active"
                  color="teal-9"
                  checked-icon="check"
                  unchecked-icon="clear"
                  @update:model-value="() => toggleScheduleStatus(sched)"
                />
              </div>
            </div>

            <div class="row q-gutter-sm text-caption text-blue-grey-8 text-weight-bold q-mb-sm">
       <q-chip dense size="sm" :color="sched.is_active ? 'teal-1' : 'grey-3'" :text-color="sched.is_active ? 'teal-10' : 'grey-7'" class="text-weight-bold">
                {{ 
                  sched.frequency === 'monthly' ? 'Monthly' : 
                  sched.frequency === 'weekly' ? 'Weekly' :
                  sched.frequency === 'biweekly' ? 'Every 2 Weeks' :
                  sched.frequency === '5_20' ? '5th & 20th' :
                  sched.frequency === '10_25' ? '10th & 25th' : '15th & End of Month'
                }}
              </q-chip>
              <q-chip dense size="sm" :color="sched.is_active ? 'teal-1' : 'grey-3'" :text-color="sched.is_active ? 'teal-10' : 'grey-7'">
                ₱{{ formatMoney(sched.amount) }}
              </q-chip>
            </div>

            <div class="text-caption text-grey-7 q-mt-md">
              <div v-if="sched.action_type === 'income'">
                <strong>Flow:</strong> Income &rarr; {{ sched.to_acc?.name || 'Unknown' }}
              </div>
              <div v-else-if="sched.action_type === 'transfer'">
                <strong>Flow:</strong> {{ sched.from_acc?.name || 'Unknown' }} &rarr; {{ sched.to_acc?.name || 'Unknown' }}
              </div>
              <div v-else-if="sched.action_type === 'expense' && sched.loan_id">
                <strong>Flow:</strong> {{ sched.from_acc?.name || 'Unknown' }} &rarr; Paying Loan: <strong class="text-red-9">{{ sched.loan?.name || 'Unknown' }}</strong>
              </div>
              <div v-else>
                <strong>Flow:</strong> {{ sched.from_acc?.name || 'Unknown' }} &rarr; Standard Expense
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Create/Edit Schedule Dialog -->
    <q-dialog v-model="openDialog" @hide="resetForm" persistent>
      <q-card style="min-width: 350px; width: 100%; max-width: 500px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white">
          <div class="text-h6">{{ isEditing ? 'Edit Automation Rule' : 'Create Automation Rule' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="submitSchedule" class="q-gutter-md">
            
            <q-input v-model="formData.name" type="text" label="Rule Name (e.g., Spotify, Internet)" outlined dense required autofocus />
            <q-input v-model.number="formData.amount" type="number" step="0.01" label="Amount (₱)" outlined dense required />
            <q-input v-model="formData.start_date" type="date" label="Start Date / First Payment" outlined dense required :disable="isEditing" />

          <q-select 
              v-model="formData.frequency" 
              :options="[
                {label: 'Monthly (Same date every month)', value: 'monthly'},
                {label: 'Weekly (Every 7 days)', value: 'weekly'},
                {label: 'Every 2 Weeks (Every 14 days)', value: 'biweekly'},
                {label: 'Twice a Month (15th & End of Month)', value: '15_end'},
                {label: 'Twice a Month (5th & 20th)', value: '5_20'},
                {label: 'Twice a Month (10th & 25th)', value: '10_25'}
              ]" 
              option-label="label" option-value="value" map-options emit-value
              label="Payment Frequency" outlined dense required :disable="isEditing" 
            />

            <div class="q-px-sm">
              <div class="text-caption text-grey-8">Transaction Type</div>
              <div class="row justify-start q-mt-xs">
                <q-radio v-model="formData.action_type" val="income" label="Income" color="green-8" />
                <q-radio v-model="formData.action_type" val="expense" label="Standard Expense" color="red-8" />
                <q-radio v-model="formData.action_type" val="transfer" label="Transfer to Vault" color="blue-8" />
              </div>
            </div>

            <!-- DYNAMIC INPUTS BASED ON TYPE -->
            <q-select 
              v-if="formData.action_type === 'expense' || formData.action_type === 'transfer'"
              v-model="formData.from_account" 
              :options="financeStore.accounts" 
              option-label="name" 
              option-value="id"
              map-options emit-value
              label="From Account" outlined dense required
            />

            <q-select 
              v-if="formData.action_type === 'income' || formData.action_type === 'transfer'"
              v-model="formData.to_account" 
              :options="financeStore.accounts" 
              option-label="name" 
              option-value="id"
              map-options emit-value
              label="To Account" outlined dense required
            />

            <!-- INSTALLMENT DURATION -->
<!-- INSTALLMENT DURATION -->
            <div class="q-px-sm">
              <div class="text-caption text-grey-8">Is this a recurring bill or a fixed installment?</div>
              <div class="row justify-start q-mt-xs">
                <q-radio v-model="formData.schedule_type" val="ongoing" label="Recurring (Never expires)" color="teal-9" :disable="isEditing" />
                <q-radio v-model="formData.schedule_type" val="installment" label="Fixed Installment" color="teal-9" :disable="isEditing" />
              </div>
            </div>

            <q-input 
              v-if="formData.schedule_type === 'installment'"
              v-model.number="formData.duration" 
              type="number" label="How many total payments?" outlined dense required :disable="isEditing" 
            />

            <div class="row justify-end q-mt-lg">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" :label="isEditing ? 'Save Changes' : 'Generate Rule'" color="teal-9" :loading="financeStore.isLoading" unelevated />
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
const isEditing = ref(false)
const editingId = ref(null)

const getTodayDate = () => new Date().toISOString().split('T')[0]

const formData = reactive({
  name: '',
  amount: null,
  start_date: getTodayDate(),
  frequency: 'monthly',
  action_type: 'expense',
  schedule_type: 'ongoing',
  duration: null,
  from_account: null,
  to_account: null
})

const resetForm = () => {
  formData.name = ''
  formData.amount = null
  formData.start_date = getTodayDate()
  formData.frequency = 'monthly'
  formData.action_type = 'expense'
  formData.schedule_type = 'ongoing'
  formData.duration = null
  formData.from_account = null
  formData.to_account = null
  isEditing.value = false
  editingId.value = null
}

const openAddDialog = () => {
  resetForm()
  openDialog.value = true
}

const openEditDialog = (sched) => {
  isEditing.value = true
  editingId.value = sched.id
  
  formData.name = sched.name
  formData.amount = sched.amount
  formData.start_date = sched.start_date
  formData.frequency = sched.frequency
  formData.action_type = sched.action_type
  formData.schedule_type = sched.schedule_type
  formData.duration = sched.duration
  formData.from_account = sched.from_account
  formData.to_account = sched.to_account

  openDialog.value = true
}

const formatMoney = (val) => val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'

const toggleScheduleStatus = async (sched) => {
  await financeStore.toggleSchedule(sched.id, !sched.is_active)
}

const submitSchedule = async () => {
  const payload = { ...formData }
  
  // Clean up unused variables
  if (payload.action_type === 'expense') payload.to_account = null
  if (payload.action_type === 'income') payload.from_account = null
  if (payload.schedule_type === 'ongoing') payload.duration = null

  let result
  if (isEditing.value) {
    result = await financeStore.updateSchedule(editingId.value, payload)
  } else {
    result = await financeStore.createSchedule(payload)
  }

  if (!result.error) {
    openDialog.value = false
    resetForm()
  }
}

onMounted(() => {
  if (financeStore.accounts.length === 0 || financeStore.schedules.length === 0) financeStore.fetchInitialData()
})
</script>

<style scoped>
.max-width-container { max-width: 1000px; margin: 0 auto; }
.schedule-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transition: all 0.3s ease; }
.border-teal { border-left: 6px solid #004d40; }
.border-green { border-left: 6px solid #2e7d32; }
.border-blue { border-left: 6px solid #1565c0; }
.border-red { border-left: 6px solid #c62828; }
.rounded-borders { border-radius: 8px; }
.opacity-80 { opacity: 0.8; }
</style>