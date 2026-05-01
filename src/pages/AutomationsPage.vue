<template>
  <q-page class="q-pa-md max-width-container">
    
    <!-- HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-blue-grey-9">Automations & Schedules</div>
      <div class="row q-gutter-sm">
        <!-- Global History Button -->
        <q-btn outline color="blue-grey-5" icon="history" label="History" @click="historyDialog = true" />
        <q-btn color="teal-9" icon="add" label="New Automation" @click="openAddDialog" unelevated />
      </div>
    </div>

    <!-- LEGEND -->
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

    <!-- EMPTY STATE FOR ACTIVE -->
    <div v-if="activeSchedules.length === 0" class="text-center q-py-xl bg-white rounded-borders shadow-1">
      <q-icon name="event_repeat" size="xl" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-sm">No Active Automations</div>
      <div class="text-caption text-grey-5">Create a schedule to automatically generate future planned transactions.</div>
    </div>

    <!-- MAIN GRID (Only Active & Paused) -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6" v-for="sched in activeSchedules" :key="sched.id">
        <q-card 
          class="schedule-card" 
          :class="[
            sched.status === 'paused' ? 'bg-grey-2 opacity-80' : 
            sched.loan_id ? 'bg-red-1 border-red' :
            sched.schedule_type === 'installment' ? 'bg-orange-1 border-orange' :
            'bg-blue-1 border-blue'
          ]"
        > 
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-h6 text-weight-bold text-blue-grey-9">
                <q-icon 
                  :name="sched.status === 'paused' ? 'pause_circle' : 'autorenew'" 
                  :color="sched.status === 'paused' ? 'orange-8' : 'teal-9'" 
                  size="sm" class="q-mr-xs" 
                />
                {{ sched.name }}
              </div>
              
              <div class="row items-center">
                <!-- Duplicate Button -->
                <q-btn flat round dense color="teal-7" icon="content_copy" @click="duplicateSchedule(sched)" class="q-mr-sm">
                  <q-tooltip>Duplicate as New Rule</q-tooltip>
                </q-btn>

                <!-- Edit / Lock Buttons -->
                <q-btn v-if="!sched.loan_id" flat round dense color="blue-grey-5" icon="edit" @click="openEditDialog(sched)" class="q-mr-sm">
                  <q-tooltip>Edit Schedule</q-tooltip>
                </q-btn>
                <q-btn v-else flat round dense color="red-3" icon="lock" class="q-mr-sm">
                  <q-tooltip class="bg-red-9 text-weight-bold text-caption">Locked: Edit payment terms in the Loans tab</q-tooltip>
                </q-btn>
                
                <!-- Pause / Resume Button -->
                <q-btn v-if="sched.status === 'paused'" flat round dense color="teal-9" icon="play_circle" @click="updateStatus(sched, 'active')" class="q-mr-sm">
                  <q-tooltip>Resume Automation</q-tooltip>
                </q-btn>
                <q-btn v-else flat round dense color="orange-8" icon="pause_circle" @click="updateStatus(sched, 'paused')" class="q-mr-sm">
                  <q-tooltip>Pause Automation</q-tooltip>
                </q-btn>

                <!-- End Automation Dropdown -->
                <q-btn flat round dense color="red-8" icon="stop_circle">
                  <q-tooltip>End Automation</q-tooltip>
                  <q-menu>
                    <q-list style="min-width: 180px">
                      <q-item clickable v-close-popup @click="confirmEndStatus(sched, 'completed')">
                        <q-item-section avatar><q-icon name="check_circle" color="teal-9" size="sm" /></q-item-section>
                        <q-item-section>Mark Completed</q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="confirmEndStatus(sched, 'discontinued')">
                        <q-item-section avatar><q-icon name="cancel" color="red-8" size="sm" /></q-item-section>
                        <q-item-section>Discontinue</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>

                <q-chip v-if="sched.status === 'paused'" dense color="orange-1" text-color="orange-9" class="text-weight-bold q-ml-sm" icon="pause">
                  Paused
                </q-chip>
              </div>
            </div>

            <div class="row q-gutter-sm text-caption text-blue-grey-8 text-weight-bold q-mb-sm">
              <q-chip dense size="sm" :color="sched.status === 'active' ? 'teal-1' : 'grey-3'" :text-color="sched.status === 'active' ? 'teal-10' : 'grey-7'" class="text-weight-bold">
                {{ 
                  sched.frequency === 'monthly' ? 'Monthly' : 
                  sched.frequency === 'weekly' ? 'Weekly' :
                  sched.frequency === 'biweekly' ? 'Every 2 Weeks' :
                  sched.frequency === '5_20' ? '5th & 20th' :
                  sched.frequency === '10_25' ? '10th & 25th' : '15th & End of Month'
                }}
              </q-chip>
              <q-chip dense size="sm" :color="sched.status === 'active' ? 'teal-1' : 'grey-3'" :text-color="sched.status === 'active' ? 'teal-10' : 'grey-7'">
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

    <!-- HISTORY DIALOG (Completed & Discontinued) -->
    <q-dialog v-model="historyDialog">
      <q-card style="width: 100%; max-width: 600px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white row items-center">
          <div class="text-h6"><q-icon name="history" size="sm" class="q-mr-sm" /> Inactive Automations</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-none">
          <div v-if="historySchedules.length === 0" class="text-center q-pa-xl text-grey-6">
            <q-icon name="auto_delete" size="xl" color="grey-4" />
            <div class="text-subtitle1 q-mt-sm">No discontinued or completed automations.</div>
          </div>

          <q-list v-else separator>
            <q-item v-for="sched in historySchedules" :key="sched.id" class="q-py-md">
              <q-item-section avatar>
                <q-icon :name="sched.status === 'completed' ? 'check_circle' : 'block'" :color="sched.status === 'completed' ? 'teal-9' : 'grey-6'" size="md" />
              </q-item-section>
              
              <q-item-section>
                <q-item-label class="text-weight-bold text-blue-grey-9 text-strike">{{ sched.name }}</q-item-label>
                <q-item-label caption>
                  ₱{{ formatMoney(sched.amount) }} • {{ sched.frequency }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-chip dense :color="sched.status === 'completed' ? 'teal-1' : 'grey-3'" :text-color="sched.status === 'completed' ? 'teal-9' : 'grey-8'" class="text-weight-bold text-capitalize">
                  {{ sched.status }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- CREATE / EDIT DIALOG -->
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

            <div class="q-px-sm">
              <div class="text-caption text-grey-8">Is this a recurring bill or a fixed installment?</div>
              <div class="row justify-start q-mt-xs">
                <q-radio v-model="formData.schedule_type" val="recurring" label="Recurring (Never expires)" color="teal-9" :disable="isEditing" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'
import { useQuasar } from 'quasar'

const financeStore = useFinanceStore()
const $q = useQuasar()

// --- THE MAGIC SPLIT ---
const activeSchedules = computed(() => {
  // Add a safety check: if schedules doesn't exist yet, return an empty array
  if (!financeStore.schedules) return []
  
  return financeStore.schedules.filter(s => s.status === 'active' || s.status === 'paused')
})

const historySchedules = computed(() => {
  // Add the same safety check here
  if (!financeStore.schedules) return []
  
  return financeStore.schedules.filter(s => s.status === 'completed' || s.status === 'discontinued')
})

const historyDialog = ref(false)

// --- FORM STATE ---
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
  schedule_type: 'recurring',
  duration: null,
  from_account: null,
  to_account: null,
  status: 'active'
})

const resetForm = () => {
  formData.name = ''
  formData.amount = null
  formData.start_date = getTodayDate()
  formData.frequency = 'monthly'
  formData.action_type = 'expense'
  formData.schedule_type = 'recurring'
  formData.duration = null
  formData.from_account = null
  formData.to_account = null
  formData.status = 'active'
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
  formData.status = sched.status || 'active'

  openDialog.value = true
}

const formatMoney = (val) => val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'

// --- ACTIONS ---
const submitSchedule = async () => {
  const payload = { ...formData }
  
  if (payload.action_type === 'expense') payload.to_account = null
  if (payload.action_type === 'income') payload.from_account = null
  if (payload.schedule_type === 'recurring') payload.duration = null

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

const duplicateSchedule = (sched) => {
  isEditing.value = false
  editingId.value = null
  
  formData.name = `${sched.name} (Copy)`
  formData.amount = sched.amount
  formData.start_date = sched.start_date
  formData.frequency = sched.frequency
  formData.action_type = sched.action_type
  formData.schedule_type = sched.schedule_type
  formData.duration = sched.duration
  formData.from_account = sched.from_account
  formData.to_account = sched.to_account
  formData.status = 'active'

  openDialog.value = true
}

// --- STATUS HANDLERS ---
const updateStatus = async (sched, newStatus) => {
  const result = await financeStore.updateScheduleStatus(sched.id, newStatus)
  
  if (!result.error) {
    $q.notify({
      type: 'positive',
      message: `Automation ${newStatus === 'active' ? 'resumed' : 'paused'}.`,
      timeout: 1500
    })
  }
}

const confirmEndStatus = (sched, endStatus) => {
  const actionText = endStatus === 'completed' ? 'mark this as Completed' : 'Discontinue this automation'
  
  $q.dialog({
    title: endStatus === 'completed' ? 'Complete Automation' : 'Discontinue Automation',
    message: `Are you sure you want to ${actionText}? This will permanently stop all future transactions, but the history will remain.`,
    cancel: true,
    persistent: true,
    ok: {
      label: endStatus === 'completed' ? 'Mark Completed' : 'Discontinue',
      color: endStatus === 'completed' ? 'teal-9' : 'red-8',
      unelevated: true
    }
  }).onOk(async () => {
    const result = await financeStore.updateScheduleStatus(sched.id, endStatus)
    
    if (!result.error) {
      $q.notify({
        type: 'positive',
        message: `Automation has been ${endStatus === 'completed' ? 'completed' : 'discontinued'}.`,
        color: endStatus === 'completed' ? 'teal-9' : 'grey-8',
        icon: endStatus === 'completed' ? 'check_circle' : 'block'
      })
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to update: ' + result.message
      })
    }
  })
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
.border-orange { border-left: 6px solid #e65100; }
.border-red { border-left: 6px solid #c62828; }
.rounded-borders { border-radius: 8px; }
.opacity-80 { opacity: 0.8; }
</style>