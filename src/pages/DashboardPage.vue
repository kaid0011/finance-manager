<template>
  <q-page class="q-pa-md max-width-container">
    
    <!-- NAVIGATION & VIEW MODE -->
    <div class="row items-center justify-between q-mb-md bg-white q-pa-sm rounded-borders shadow-1">
      <q-btn flat round icon="chevron_left" color="blue-grey-9" @click="changePeriod(-1)" />
      
      <div class="row items-center justify-center q-gutter-x-sm">
        <div class="text-h6 text-weight-bold text-blue-grey-9 text-center" style="min-width: 180px;">
          {{ activePeriod.label }}
        </div>
        
        <q-select 
          v-model="viewMode"
          :options="viewModeOptions"
          dense borderless emit-value map-options
          options-dense
          class="text-caption text-weight-bold text-teal-9 bg-teal-1 q-px-sm rounded-borders"
          style="min-width: 140px; margin-left: 10px;"
        />
      </div>

      <q-btn flat round icon="chevron_right" color="blue-grey-9" @click="changePeriod(1)" />
    </div>

    <!-- MAIN BALANCE METRICS -->
    <div class="row q-col-gutter-sm q-mb-lg">
      
      <!-- 1. Historical Rollover Net -->
      <div class="col-6 col-md-3">
        <q-card class="metric-card bg-blue-grey-1">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-blue-grey-8 text-weight-bold text-uppercase">Past Rollover</div>
            <div class="text-h6 text-weight-bold" :class="historicalNet >= 0 ? 'text-green-9' : 'text-red-9'">
              {{ historicalNet >= 0 ? '+' : '' }}₱{{ formatMoney(historicalNet) }}
            </div>
            <div class="text-caption text-blue-grey-6">All time prior to period</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 2. Current Period IN -->
      <div class="col-6 col-md-3">
        <q-card class="metric-card bg-green-1">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-green-9 text-weight-bold text-uppercase">{{ periodLabelText }} IN (+)</div>
            <div class="text-h6 text-weight-bold text-green-10">₱{{ formatMoney(periodIncome) }}</div>
            <div class="text-caption text-green-8">
              Cleared & Planned
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 3. Current Period OUT -->
      <div class="col-6 col-md-3">
        <q-card class="metric-card bg-red-1">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-red-9 text-weight-bold text-uppercase">{{ periodLabelText }} OUT (-)</div>
            <div class="text-h6 text-weight-bold text-red-10">₱{{ formatMoney(periodExpense) }}</div>
            <div class="text-caption text-red-8">
              Cleared & Planned
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 4. Current Period NET (WITH TOGGLE) -->
      <div class="col-6 col-md-3">
        <q-card class="metric-card relative-position" :class="displayedNetFlow >= 0 ? 'bg-teal-1' : 'bg-orange-1'">
          <q-card-section class="q-pa-sm">
            <div class="row justify-between items-center q-mb-xs">
              <div class="text-caption text-weight-bold text-uppercase" :class="displayedNetFlow >= 0 ? 'text-teal-9' : 'text-orange-9'">
                {{ includePastNet ? 'Cumulative Net' : `${periodLabelText} NET` }}
              </div>
              
              <q-toggle 
                v-model="includePastNet" 
                :color="displayedNetFlow >= 0 ? 'teal-9' : 'orange-9'" 
                dense 
                size="xs"
              >
                <q-tooltip>Include Past Rollover Net</q-tooltip>
              </q-toggle>
            </div>
            
            <div class="text-h6 text-weight-bold" :class="displayedNetFlow >= 0 ? 'text-teal-10' : 'text-orange-10'">
              {{ displayedNetFlow >= 0 ? '+' : '' }}₱{{ formatMoney(displayedNetFlow) }}
            </div>
            
            <div class="text-caption" :class="displayedNetFlow >= 0 ? 'text-teal-8' : 'text-orange-8'">
              <span v-if="includePastNet">Past Net + (In - Out)</span>
              <span v-else>Total In - Total Out</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- SMART FUNDING ASSISTANT -->
    <div v-if="requiredTransfers.length > 0" class="q-mb-lg">
      <div class="text-subtitle2 text-weight-bold text-orange-9 q-mb-sm flex items-center">
        <q-icon name="warning" size="sm" class="q-mr-xs" /> Action Required: Account Funding
      </div>
      
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-md-6" v-for="suggestion in requiredTransfers" :key="suggestion.id">
          <q-card class="bg-orange-1 border-orange shadow-1" style="border-radius: 8px;">
            <q-card-section class="q-pa-sm row items-center justify-between">
              <div>
                <div class="text-weight-bold text-blue-grey-9">{{ suggestion.name }} is short on cash.</div>
                <div class="text-caption text-orange-9">
                  Bal: ₱{{ formatMoney(suggestion.currentBalance) }} | Planned Bills: ₱{{ formatMoney(suggestion.needed) }}
                </div>
              </div>
              <div class="text-right">
                <q-btn 
                  color="orange-9" 
                  unelevated 
                  dense 
                  class="q-px-sm text-weight-bold"
                  @click="executeSmartTransfer(suggestion)"
                >
                  Send ₱{{ formatMoney(suggestion.transferAmount) }}
                </q-btn>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- LEDGER -->
    <q-card class="ledger-card">
      <q-card-section class="row items-center justify-between bg-blue-grey-9 text-white q-pa-sm">
        <div class="text-subtitle1 text-weight-bold q-ml-sm">{{ periodLabelText }} Ledger</div>
        <q-btn color="teal-13" text-color="blue-grey-10" icon="add" label="Plan / Add" @click="openAddDialog" unelevated />
      </q-card-section>

      <q-table
        flat
        :rows="periodTransactions"
        :columns="columns"
        row-key="id"
        :loading="financeStore.isLoading"
        :pagination="{ rowsPerPage: 15 }"
        wrap-cells
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-select
              v-model="props.row.status"
              :options="['cleared', 'planned']"
              dense
              borderless
              emit-value
              map-options
              @update:model-value="val => quickUpdateStatus(props.row.id, val)"
              style="min-width: 100px;"
            >
              <template v-slot:selected>
                <q-chip 
                  :color="props.row.status === 'cleared' ? 'positive' : 'warning'" 
                  text-color="white" 
                  dense 
                  square
                  size="sm"
                  class="cursor-pointer full-width flex justify-center"
                >
                  <span class="text-capitalize text-weight-bold">{{ props.row.status }}</span>
                  <q-icon name="arrow_drop_down" size="xs" color="white" class="q-ml-xs"/>
                </q-chip>
              </template>
            </q-select>
          </q-td>
        </template>

        <template v-slot:body-cell-action_type="props">
          <q-td :props="props">
            <span class="text-capitalize text-weight-bold" 
                  :class="{
                    'text-green-8': props.row.action_type === 'income',
                    'text-red-8': props.row.action_type === 'expense',
                    'text-blue-8': props.row.action_type === 'transfer'
                  }">
              {{ props.row.action_type }}
            </span>
          </q-td>
        </template>

        <!-- UPDATED: Now shows Transfers flowing IN -->
        <template v-slot:body-cell-in_amount="props">
          <q-td :props="props" :class="(props.row.action_type === 'income' || props.row.action_type === 'transfer') ? 'bg-green-1' : ''">
            <span v-if="props.row.action_type === 'income'" class="text-green-9 text-weight-bold">
              + ₱{{ formatMoney(props.row.amount) }}
            </span>
            <span v-else-if="props.row.action_type === 'transfer'" class="text-blue-9 text-weight-bold">
              + ₱{{ formatMoney(props.row.amount) }} <q-icon name="sync" size="xs"/>
            </span>
          </q-td>
        </template>

        <!-- UPDATED: Now shows Transfers flowing OUT -->
        <template v-slot:body-cell-out_amount="props">
          <q-td :props="props" :class="(props.row.action_type === 'expense' || props.row.action_type === 'transfer') ? 'bg-red-1' : ''">
            <span v-if="props.row.action_type === 'expense'" class="text-red-9 text-weight-bold">
              - ₱{{ formatMoney(props.row.amount) }}
            </span>
            <span v-else-if="props.row.action_type === 'transfer'" class="text-blue-9 text-weight-bold">
              - ₱{{ formatMoney(props.row.amount) }} <q-icon name="sync" size="xs"/>
            </span>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <template v-if="!isReadOnly(props.row)">
              <q-btn flat round dense color="blue-grey-5" icon="edit" @click="openEditDialog(props.row)">
                <q-tooltip>Edit Details</q-tooltip>
              </q-btn>
            </template>
            <template v-else>
              <q-icon name="lock" color="grey-5" size="sm">
                <q-tooltip>System Managed / Locked</q-tooltip>
              </q-icon>
            </template>
          </q-td>
        </template>

      </q-table>
    </q-card>

    <q-dialog v-model="openDialog" @hide="resetForm">
      <q-card style="min-width: 350px; width: 100%; max-width: 500px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white">
          <div class="text-h6">{{ isEditing ? 'Edit Transaction' : 'Log / Plan Transaction' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="submitTransaction" class="q-gutter-md">
            
            <div class="row q-col-gutter-sm items-center">
              <div class="col-8">
                <q-input v-model="formData.date" type="date" label="Date" outlined dense required />
              </div>
              <div class="col-4 flex justify-end">
                <q-checkbox 
                  v-model="formData.status" 
                  true-value="cleared" 
                  false-value="planned" 
                  label="Cleared?" 
                  color="teal-9" 
                  keep-color
                />
              </div>
            </div>

            <div class="q-px-sm">
              <div class="text-caption text-grey-8">Transaction Type</div>
              <div class="row justify-between q-mt-xs">
                <q-radio v-model="formData.action_type" val="income" label="Income" color="green-8" />
                <q-radio v-model="formData.action_type" val="expense" label="Expense" color="red-8" />
                <q-radio v-model="formData.action_type" val="transfer" label="Transfer" color="blue-8" />
              </div>
            </div>

            <q-select 
              v-if="formData.action_type === 'expense' || formData.action_type === 'transfer'"
              v-model="formData.from_account" 
              :options="financeStore.accounts" 
              option-label="name" 
              option-value="id"
              map-options emit-value label="From Account" outlined dense 
            />

            <q-select 
              v-if="formData.action_type === 'income' || formData.action_type === 'transfer'"
              v-model="formData.to_account" 
              :options="financeStore.accounts" 
              option-label="name" 
              option-value="id"
              map-options emit-value label="To Account" outlined dense 
            />

            <q-input v-model.number="formData.amount" type="number" step="0.01" label="Amount (₱)" outlined dense required />
            <q-input v-model="formData.description" type="text" label="Description" outlined dense />

            <div class="row justify-between items-center q-mt-md">
              <div>
                <q-btn v-if="isEditing" flat label="Delete" color="red-9" icon="delete" @click="deleteTransaction(editingId)" />
              </div>
              <div>
                <q-btn flat label="Cancel" color="grey" v-close-popup class="q-mr-sm" />
                <q-btn type="submit" :label="isEditing ? 'Save Changes' : 'Save Entry'" color="blue-grey-9" :loading="financeStore.isLoading" unelevated />
              </div>
            </div>

          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<style scoped>
.max-width-container { max-width: 1200px; margin: 0 auto; }
.rounded-borders { border-radius: 8px; }
.metric-card { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); height: 100%; }
.ledger-card { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.border-orange { border-left: 4px solid #e65100; }
:deep(.q-table__top) { padding: 0; }
:deep(.q-table th) { font-weight: 700; color: #263238; background-color: #f5f7f8; }
:deep(.q-field--borderless .q-field__control:before) { border: none !important; }
</style>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'

const financeStore = useFinanceStore()
const openDialog = ref(false)

// --- VIEW MODE STATE ---
const currentDate = ref(new Date())
const includePastNet = ref(true) 
const viewMode = ref('15_end')

const viewModeOptions = [
  { label: 'Calendar Month', value: 'monthly' },
  { label: 'Cut-off: 15th & End', value: '15_end' },
  { label: 'Cut-off: 5th & 20th', value: '5_20' },
  { label: 'Cut-off: 10th & 25th', value: '10_25' }
]

const periodLabelText = computed(() => viewMode.value === 'monthly' ? 'Month' : 'Period')

// --- THE REAL-WORLD PAYROLL ENGINE ---
const getAdjustedPayday = (y, m, d) => {
  const date = new Date(y, m, d);
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 6) date.setDate(date.getDate() - 1); 
  else if (dayOfWeek === 0) date.setDate(date.getDate() - 2); 
  return date;
};

const formatPeriodLabel = (start, end) => {
  const sMonth = start.toLocaleString('default', { month: 'short' });
  const sDay = start.getDate();
  const sYear = start.getFullYear();
  
  const eMonth = end.toLocaleString('default', { month: 'short' });
  const eDay = end.getDate();
  const eYear = end.getFullYear();

  if (sYear !== eYear) return `${sMonth} ${sDay}, ${sYear} - ${eMonth} ${eDay}, ${eYear}`;
  if (sMonth !== eMonth) return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${sYear}`;
  return `${sMonth} ${sDay} - ${eDay}, ${sYear}`;
};

const getPeriodBoundaries = (dateObj, mode) => {
  const y = dateObj.getFullYear();
  const m = dateObj.getMonth();

  if (mode === 'monthly') {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0); 
    return { start, end, label: dateObj.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  }

  let anchors = [];
  if (mode === '15_end') anchors = [15, 'end'];
  else if (mode === '5_20') anchors = [5, 20];
  else if (mode === '10_25') anchors = [10, 25];

  const candidateDates = [];
  for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
    const targetM = m + monthOffset;
    anchors.forEach(anchor => {
      let d = anchor;
      if (anchor === 'end') d = new Date(y, targetM + 1, 0).getDate();
      candidateDates.push(getAdjustedPayday(y, targetM, d));
    });
  }

  candidateDates.sort((a, b) => a - b);

  let start = null;
  let end = null;
  const targetTime = new Date(y, m, dateObj.getDate()).getTime(); 

  for (let i = 0; i < candidateDates.length - 1; i++) {
    const currentPayday = candidateDates[i];
    
    const periodEnd = new Date(candidateDates[i + 1]);
    periodEnd.setDate(periodEnd.getDate() - 1); 

    if (targetTime >= currentPayday.getTime() && targetTime <= periodEnd.getTime()) {
      start = currentPayday;
      end = periodEnd;
      break;
    }
  }

  return { start, end, label: formatPeriodLabel(start, end) };
};

const activePeriod = computed(() => getPeriodBoundaries(currentDate.value, viewMode.value))

// --- SMART NAVIGATION ---
const changePeriod = (offset) => {
  const d = new Date(currentDate.value);
  if (viewMode.value === 'monthly') {
    d.setMonth(d.getMonth() + offset);
  } else {
    if (offset > 0) {
      d.setTime(activePeriod.value.end.getTime());
      d.setDate(d.getDate() + 1);
    } else {
      d.setTime(activePeriod.value.start.getTime());
      d.setDate(d.getDate() - 1);
    }
  }
  currentDate.value = new Date(d);
};

// --- DATA FILTERING LOGIC ---
const isInPeriod = (dateString) => {
  const d = new Date(dateString); d.setHours(0,0,0,0);
  const s = new Date(activePeriod.value.start); s.setHours(0,0,0,0);
  const e = new Date(activePeriod.value.end); e.setHours(23,59,59,999);
  return d >= s && d <= e;
};

const isBeforeCurrentPeriod = (dateString) => {
  const d = new Date(dateString); d.setHours(0,0,0,0);
  const s = new Date(activePeriod.value.start); s.setHours(0,0,0,0);
  return d < s;
};

const formatMoney = (val) => val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
const getTodayDate = () => new Date().toISOString().split('T')[0]

// --- FORM LOGIC & SANITIZATION ---
const isEditing = ref(false)
const editingId = ref(null)

const formData = reactive({
  date: getTodayDate(), status: 'planned', action_type: 'expense',
  from_account: null, to_account: null, amount: null, description: ''
})

const resetForm = () => {
  Object.assign(formData, { date: getTodayDate(), status: 'planned', action_type: 'expense', from_account: null, to_account: null, amount: null, description: '' })
  isEditing.value = false; editingId.value = null;
}

const isReadOnly = (row) => {
  if (!row.description) return false;
  const desc = row.description.toLowerCase();
  return desc.includes('(auto)') || desc.includes('loan');
}

const sanitizeAccountId = (val) => {
  if (!val) return null;
  if (typeof val === 'object') {
    if (val.id) return val.id;
    if (val.name) {
      const matched = financeStore.accounts.find(a => a.name === val.name);
      return matched ? matched.id : null;
    }
  }
  const matchedAccount = financeStore.accounts.find(a => a.name === val);
  if (matchedAccount) return matchedAccount.id;
  return val;
}

const openAddDialog = () => { resetForm(); openDialog.value = true; }

const openEditDialog = (row) => {
  if (isReadOnly(row)) return; 

  isEditing.value = true
  editingId.value = row.id
  
  formData.date = row.date
  formData.status = row.status
  formData.action_type = row.action_type
  formData.amount = row.amount
  formData.description = row.description
  
  formData.from_account = sanitizeAccountId(row.from_account)
  formData.to_account = sanitizeAccountId(row.to_account)
  
  openDialog.value = true
}

const deleteTransaction = async (id) => { 
  if (confirm('Are you sure you want to delete this transaction?')) {
    await financeStore.deleteTransaction(id);
    openDialog.value = false;
    resetForm();
  }
}

const quickUpdateStatus = async (id, newStatus) => { 
  await financeStore.updateTransaction(id, { status: newStatus }) 
}

const submitTransaction = async () => {
  const payload = {
    date: formData.date,
    status: formData.status,
    action_type: formData.action_type,
    amount: formData.amount,
    description: formData.description,
    from_account: sanitizeAccountId(formData.from_account),
    to_account: sanitizeAccountId(formData.to_account)
  }

  let result
  if (isEditing.value) {
    result = await financeStore.updateTransaction(editingId.value, payload)
  } else {
    result = await financeStore.addTransaction(payload)
  }

  if (!result.error) {
    openDialog.value = false
    resetForm()
  }
}

const columns = [
  { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'action_type', label: 'Type', field: 'action_type', align: 'left' },
  { name: 'from', label: 'From', field: row => row.from_account?.name || '-', align: 'left' },
  { name: 'to', label: 'To', field: row => row.to_account?.name || '-', align: 'left' },
  { name: 'in_amount', label: 'IN (+)', field: 'amount', align: 'right', headerClasses: 'bg-green-1 text-green-9 text-weight-bolder' },
  { name: 'out_amount', label: 'OUT (-)', field: 'amount', align: 'right', headerClasses: 'bg-red-1 text-red-9 text-weight-bolder' },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' } 
]

// --- MATH AGGREGATION (CLEARED + PLANNED Combined) ---
const periodTransactions = computed(() => financeStore.transactions.filter(t => isInPeriod(t.date)))

const historicalNet = computed(() => {
  return financeStore.transactions.filter(t => isBeforeCurrentPeriod(t.date))
    .reduce((acc, t) => acc + (t.action_type === 'income' ? Number(t.amount) : t.action_type === 'expense' ? -Number(t.amount) : 0), 0)
})

// UPDATED: Now counts Transfers as an IN (+) metric
const periodIncome = computed(() => {
  return periodTransactions.value.filter(t => t.action_type === 'income' || t.action_type === 'transfer')
    .reduce((acc, t) => acc + Number(t.amount), 0)
})

// Ensures Transfers remain explicitly calculated as an OUT (-) metric
const periodExpense = computed(() => {
  return periodTransactions.value.filter(t => t.action_type === 'expense' || t.action_type === 'transfer')
    .reduce((acc, t) => acc + Number(t.amount), 0)
})

const netPeriodFlow = computed(() => periodIncome.value - periodExpense.value)

const displayedNetFlow = computed(() => includePastNet.value ? netPeriodFlow.value + historicalNet.value : netPeriodFlow.value)

// --- SMART FUNDING ASSISTANT ---
const getAccountBalance = (accountId) => {
  return financeStore.transactions
    .filter(t => t.status === 'cleared')
    .reduce((acc, t) => {
      let flow = 0;
      const safeToId = sanitizeAccountId(t.to_account);
      const safeFromId = sanitizeAccountId(t.from_account);

      if (safeToId === accountId && (t.action_type === 'income' || t.action_type === 'transfer')) {
        flow += Number(t.amount);
      }
      if (safeFromId === accountId && (t.action_type === 'expense' || t.action_type === 'transfer')) {
        flow -= Number(t.amount);
      }
      return acc + flow;
    }, 0);
};

const getAccountPlannedOutflow = (accountId) => {
  return periodTransactions.value
    .filter(t => {
      const safeFromId = sanitizeAccountId(t.from_account);
      return t.status === 'planned' && safeFromId === accountId && (t.action_type === 'expense' || t.action_type === 'transfer');
    })
    .reduce((acc, t) => acc + Number(t.amount), 0);
};

const requiredTransfers = computed(() => {
  const suggestions = [];
  financeStore.accounts.forEach(acc => {
    const bal = getAccountBalance(acc.id);
    const plannedOut = getAccountPlannedOutflow(acc.id);
    const deficit = plannedOut - bal;

    if (deficit > 0) {
      suggestions.push({
        id: acc.id, name: acc.name, currentBalance: bal, needed: plannedOut, transferAmount: deficit
      });
    }
  });
  return suggestions.sort((a, b) => b.transferAmount - a.transferAmount);
});

const executeSmartTransfer = (suggestion) => {
  resetForm();
  isEditing.value = false;
  
  formData.action_type = 'transfer';
  formData.to_account = suggestion.id; 
  formData.amount = suggestion.transferAmount; 
  formData.description = `Auto-Fund for upcoming ${suggestion.name} bills`;
  
  openDialog.value = true;
}

onMounted(async () => await financeStore.fetchInitialData())
</script>