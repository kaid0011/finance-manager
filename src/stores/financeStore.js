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
        const [accRes, transRes, schedRes, goalsRes, loansRes] = await Promise.all([
          supabase.from("accounts").select("*").order("name"),
          supabase
            .from("transactions")
            .select("*, from_acc:from_account(name), to_acc:to_account(name)")
            .order("date", { ascending: false }),
        supabase.from("schedules").select("*, from_acc:from_account(name), to_acc:to_account(name)").order("created_at", { ascending: false }),
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
        console.log("Total Transactions:", this.transactions.length, this.transactions);
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
        // If recurring, generate 24 periods (up to 2 years) of runway.
        let limit =
          payload.schedule_type === "installment" ? payload.duration : 24;

        for (let i = 0; i < limit; i++) {
          dates.push(currDate.toISOString().split("T")[0]);

          if (payload.frequency === "monthly") {
            currDate.setMonth(currDate.getMonth() + 1);
          } else if (payload.frequency === "per_cutoff") {
            let d = currDate.getDate();
            // If current is <= 15, jump to end of month. Else jump to 15th next month.
            if (d <= 15) {
              currDate = new Date(
                currDate.getFullYear(),
                currDate.getMonth() + 1,
                0,
              );
            } else {
              currDate = new Date(
                currDate.getFullYear(),
                currDate.getMonth() + 1,
                15,
              );
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

        const { error: batchErr } = await supabase.from("transactions").insert(batchTransactions);
        
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
async createLoan(payload) {
      this.isLoading = true;
      try {
        // We only need to insert the loan! No fake transactions required.
        const { error } = await supabase.from("loans").insert([payload]);
        if (error) throw error;
        await this.fetchInitialData();
        return { error: false };
      } catch (err) {
        console.error(err);
        return { error: true, message: err.message };
      } finally {
        this.isLoading = false;
      }
    },

  },
});
