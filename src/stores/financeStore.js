import { defineStore } from "pinia";
import { supabase } from "@/supabase/config.js";

export const useFinanceStore = defineStore("financeStore", {
  state: () => ({
    isLoading: false,
    accounts: [],
    transactions: [],
    schedules: [],
    savings: [],
    goals: [],
    loans: [],
  }),
  getters: {
    // Only returns accounts that are active (used for dropdown menus)
    activeAccounts: (state) =>
      state.accounts.filter((acc) => acc.is_active !== false),
  },

  actions: {
    async fetchInitialData() {
      this.isLoading = true;
      try {
        const [accRes, transRes, schedRes, goalsRes, loansRes] =
          await Promise.all([
            supabase.from("accounts").select("*").order("name"),
            supabase
              .from("transactions")
              .select("*, from_acc:from_account(name), to_acc:to_account(name)")
              .order("date", { ascending: false }),
            supabase
              .from("schedules")
              .select(
                "*, from_acc:from_account(name), to_acc:to_account(name), loan:loan_id(name)",
              )
              .order("created_at", { ascending: false }),
            supabase
              .from("savings_goals")
              .select("*")
              .order("created_at", { ascending: false }),
            supabase
              .from("loans")
              .select("*")
              .order("created_at", { ascending: false }),
          ]);

        if (accRes.error) throw accRes.error;
        if (transRes.error) throw transRes.error;
        if (schedRes.error) throw schedRes.error;
        if (goalsRes.error) throw goalsRes.error;
        if (loansRes.error) throw loansRes.error;

        this.goals = goalsRes.data;
        this.accounts = accRes.data;
        this.transactions = transRes.data;
        this.schedules = schedRes.data;
        this.loans = loansRes.data;
        console.log("=== STORE FETCH COMPLETE ===");
        console.log(
          "Total Transactions:",
          this.transactions.length,
          this.transactions,
        );
        console.log("Total Schedules:", this.schedules.length, this.schedules);
      } catch (err) {
        console.error("Error fetching data:", err.message);
      } finally {
        this.isLoading = false;
      }
    },

    async addTransaction(payload) {
      this.isLoading = true;
      try {
        const { error } = await supabase.from("transactions").insert([payload]);
        if (error) throw error;
        await this.fetchInitialData();
        return { error: false };
      } catch (err) {
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },

    // --- NEW: THE AUTOMATION ENGINE ---
    async createSchedule(payload) {
      this.isLoading = true;
      try {
        // 1. Save the Schedule rule to DB
        const { data: schedule, error: schedErr } = await supabase
          .from("schedules")
          .insert([payload])
          .select()
          .single();
        if (schedErr) throw schedErr;

// 2. Generate the exact future dates
        let dates = [];
        let currDate = new Date(payload.start_date);
        
        // If recurring, generate 24 periods. If installment, use the provided duration.
        let limit = payload.schedule_type === "installment" ? payload.duration : 24;

       for (let i = 0; i < limit; i++) {
          dates.push(currDate.toISOString().split("T")[0]);

          if (payload.frequency === "monthly") {
            currDate.setMonth(currDate.getMonth() + 1);
          } else if (payload.frequency === "weekly") {
            currDate.setDate(currDate.getDate() + 7);
          } else if (payload.frequency === "biweekly") {
            currDate.setDate(currDate.getDate() + 14);
          } else {
            // --- THE PHILIPPINE PAYDAY ENGINE ---
            let y = currDate.getFullYear();
            let m = currDate.getMonth();
            let d = currDate.getDate();

            let pd1 = 15; let pd2 = 'end'; 
            if (payload.frequency === '5_20') { pd1 = 5; pd2 = 20; }
            else if (payload.frequency === '10_25') { pd1 = 10; pd2 = 25; }

            let actualPd2 = pd2 === 'end' ? new Date(y, m + 1, 0).getDate() : pd2;

            if (d < pd1 || d >= actualPd2) {
              if (d >= actualPd2) {
                currDate = new Date(y, m + 1, pd1);
              } else {
                currDate = new Date(y, m, pd1);
              }
            } else {
              currDate = new Date(y, m, actualPd2);
            }
          }
        }
        // 3. Batch generate the planned transactions
        const batchTransactions = dates.map((d) => ({
          schedule_id: schedule.id,
          date: d,
          status: "planned",
          action_type: payload.action_type,
          from_account: payload.from_account,
          to_account: payload.to_account || null,
          loan_id: payload.loan_id || null,
          amount: payload.amount,
          description: payload.name + " (Auto)",
        }));

        const { error: batchErr } = await supabase
          .from("transactions")
          .insert(batchTransactions);

        if (batchErr) {
          console.error("🚨 BATCH INSERT FAILED:", batchErr);
          throw batchErr;
        }

        await this.fetchInitialData();
        return { error: false };
      } catch (err) {
        console.error(err);
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },

    async toggleSchedule(id, currentState) {
      this.isLoading = true;
      const newState = !currentState;
      try {
        // Update status
        await supabase
          .from("schedules")
          .update({ is_active: newState })
          .eq("id", id);

        if (!newState) {
          // If turned off, automatically delete all FUTURE PLANNED transactions linked to it
          const today = new Date().toISOString().split("T")[0];
          await supabase
            .from("transactions")
            .delete()
            .eq("schedule_id", id)
            .eq("status", "planned")
            .gte("date", today);
        }
        await this.fetchInitialData();
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    async endSchedule(id) {
  this.isLoading = true
  try {
    const { error } = await supabase
      .from('schedules')
      .update({ 
        is_active: false, 
        status: 'completed' // Add this text column to your Supabase table
      })
      .eq('id', id)

    if (error) throw error

    // Update local state instantly
    const index = this.schedules.findIndex(s => s.id === id)
    if (index !== -1) {
      this.schedules[index].is_active = false
      this.schedules[index].status = 'completed'
    }
    
    return { error: false }
  } catch (err) {
    console.error('Error ending schedule:', err)
    return { error: true, message: err.message }
  } finally {
    this.isLoading = false
  }
},
    async updateTransaction(id, payload) {
      this.isLoading = true;
      try {
        const { error } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        await this.fetchInitialData(); // Refresh the view
        return { error: false };
      } catch (err) {
        console.error("Update error:", err.message);
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },

    async deleteTransaction(id) {
      this.isLoading = true;
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id);
        if (error) throw error;
        await this.fetchInitialData();
      } catch (err) {
        console.error("Delete error:", err.message);
      } finally {
        this.isLoading = false;
      }
    },

    async addAccount(payload) {
      this.isLoading = true;
      try {
        const { error } = await supabase.from("accounts").insert([payload]);
        if (error) throw error;
        await this.fetchInitialData();
        return { error: false };
      } catch (err) {
        console.error(err.message);
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },

    async updateAccount(id, payload) {
      this.isLoading = true;
      try {
        const { error } = await supabase
          .from("accounts")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        await this.fetchInitialData();
        return { error: false };
      } catch (err) {
        console.error(err.message);
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },

    async deleteAccount(id) {
      this.isLoading = true;
      try {
        const { error } = await supabase.from("accounts").delete().eq("id", id);
        if (error) throw error;
        await this.fetchInitialData();
      } catch (err) {
        console.error(
          "Cannot delete account with existing transactions:",
          err.message,
        );
        alert(
          "Cannot delete this account because it has linked transactions. Please deactivate it instead.",
        );
      } finally {
        this.isLoading = false;
      }
    },

    async createGoal(payload) {
      this.isLoading = true;
      try {
        const { error } = await supabase
          .from("savings_goals")
          .insert([payload]);
        if (error) throw error;
        await this.fetchInitialData();
        return { error: false };
      } catch (err) {
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },

    async addFundsToGoal(id, amountToAdd, currentAmount) {
      this.isLoading = true;
      try {
        const newTotal = Number(currentAmount) + Number(amountToAdd);
        const { error } = await supabase
          .from("savings_goals")
          .update({ current_amount: newTotal })
          .eq("id", id);
        if (error) throw error;
        await this.fetchInitialData();
        return { error: false };
      } catch (err) {
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },
    async createLoan(payload, schedulePayload = null) {
      this.isLoading = true;
      try {
        // 1. Insert the loan and get its new ID
        const { data: newLoan, error } = await supabase
          .from("loans")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        // 2. If the user opted to automate, instantly hook it into the Automation Engine!
        if (schedulePayload) {
          schedulePayload.loan_id = newLoan.id;
          schedulePayload.name = `Auto-Pay: ${newLoan.name}`; // Name it nicely for the dashboard

          // Call your existing automation function
          const schedResult = await this.createSchedule(schedulePayload);
          if (schedResult.error) throw new Error(schedResult.message);
        } else {
          // Only fetch if we didn't run createSchedule (which does its own fetch)
          await this.fetchInitialData();
        }

        return { error: false };
      } catch (err) {
        console.error(err);
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },
   async updateLoan(id, payload, schedulePayload = null) {
      this.isLoading = true;
      try {
        // 1. Update the Loan details
        const { error } = await supabase
          .from("loans")
          .update(payload)
          .eq("id", id);
          
        if (error) throw error;
        
        // 2. Magic Sync: Update or Create the associated Automation Schedule!
        if (schedulePayload) {
          schedulePayload.loan_id = id;
          schedulePayload.name = `Auto-Pay: ${payload.name}`;
          
          // Check if this loan already has an automation running
          const existingSched = this.schedules.find(s => s.loan_id === id);
          
          if (existingSched) {
            // 🔥 THE FIX: Just send the clean schedulePayload directly! 
            // We no longer spread the "dirty" existingSched.
            const schedResult = await this.updateSchedule(existingSched.id, schedulePayload);
            if (schedResult.error) throw new Error(schedResult.message);
          } else {
            // It doesn't exist yet! Let's create it.
            const schedResult = await this.createSchedule(schedulePayload);
            if (schedResult.error) throw new Error(schedResult.message);
          }
        } else {
          // Only fetch manually if we didn't trigger the schedule functions
          await this.fetchInitialData();
        }

        return { error: false };
      } catch (err) {
        console.error("Update Loan Error:", err.message);
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },
    async updateSchedule(id, payload) {
      this.isLoading = true;
      try {
        // 1. Update the base schedule record
        const { error: schedErr } = await supabase
          .from("schedules")
          .update(payload)
          .eq("id", id);
        if (schedErr) throw schedErr;

        // 2. Cascade the changes to all FUTURE, PLANNED transactions linked to it!
        // We only update planned ones so we don't accidentally rewrite history.
        const today = new Date().toISOString().split("T")[0];
        const transPayload = {
          amount: payload.amount,
          description: payload.name + " (Auto)",
          action_type: payload.action_type,
          from_account: payload.from_account,
          to_account: payload.to_account || null,
          loan_id: payload.loan_id || null,
        };

        const { error: transErr } = await supabase
          .from("transactions")
          .update(transPayload)
          .eq("schedule_id", id)
          .eq("status", "planned")
          .gte("date", today);

        if (transErr) throw transErr;

        await this.fetchInitialData();
        return { error: false };
      } catch (err) {
        console.error("Update Schedule Error:", err.message);
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },
async updateScheduleStatus(id, newStatus) {
  this.isLoading = true
  try {
    // 1. Update the automation's status in the database
    const { error: updateError } = await supabase
      .from('schedules')
      .update({ status: newStatus })
      .eq('id', id)

    if (updateError) throw updateError

    // 2. THE NEW CLEANUP LOGIC
    // If we are killing the automation, wipe out its future/planned transactions
    if (newStatus === 'completed' || newStatus === 'discontinued') {
      const { error: cleanupError } = await supabase
        .from('transactions') // Make sure this matches your actual table name
        .delete()
        .eq('schedule_id', id)
        .eq('status', 'planned') // Change this if your column uses is_cleared: false or something similar

      if (cleanupError) {
        console.error('Failed to clean up planned transactions:', cleanupError)
        // We don't throw here because the schedule status still successfully updated
      }

      // Optional: If your store also holds a global array of transactions, clean it up locally
      if (this.transactions) {
        this.transactions = this.transactions.filter(
          t => !(t.schedule_id === id && t.status === 'planned')
        )
      }
    }

    // 3. Update the local UI state for the schedule grid
    const index = this.schedules.findIndex(s => s.id === id)
    if (index !== -1) {
      this.schedules[index].status = newStatus
    }
    
    return { error: false }
  } catch (err) {
    return { error: true, message: err.message }
  } finally {
    this.isLoading = false
  }
},
  },
});
