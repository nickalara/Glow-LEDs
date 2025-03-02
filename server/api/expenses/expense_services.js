import Expense from "./expense.js";
import expense_db from "./expense_db.js";
import { formatDateToISODate } from "../../utils/util.js";
import { getFilteredData } from "../api_helpers.js";
import {
  determine_application,
  determine_category,
  determine_place,
  normalizeExpenseFilters,
  normalizeExpenseSearch,
} from "./expense_helpers.js";

export default {
  findAll_expenses_s: async query => {
    try {
      const sort_options = ["date_of_purchase", "expense_name", "place_of_purchase", "card", "category", "amount"];
      const { filter, sort, limit, page } = getFilteredData({
        query,
        sort_options,
        search_name: "expense_name",
        normalizeFilters: normalizeExpenseFilters,
        normalizeSearch: normalizeExpenseSearch,
      });
      const expenses = await expense_db.findAll_expenses_db(filter, sort, limit, page);
      const count = await expense_db.count_expenses_db(filter);
      return {
        data: expenses,
        total_count: count,
        currentPage: page,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return [];
  },
  create_filters_expenses_s: async () => {
    try {
      const availableFilters = {
        place_of_purchase: await Expense.distinct("place_of_purchase", { deleted: false }),
        category: await Expense.distinct("category", { deleted: false }),
        irs_category: await Expense.distinct("irs_category", { deleted: false }),
        card: await Expense.distinct("card", { deleted: false }),
        reason: await Expense.distinct("reason", { deleted: false }),
        is_subscription: ["only_is_subscription"],
      };
      const booleanFilters = {
        is_subscription: {
          label: "Show Subscriptions",
        },
      };
      return { availableFilters, booleanFilters };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return { availableFilters: {}, booleanFilters: {} };
  },

  findAllByDate_expenses_s: async body => {
    try {
      const filter = {
        deleted: false,
        date_of_purchase: {
          $gte: new Date(body.date_1),
          $lt: new Date(body.date_2),
        },
      };
      const sort = { date_of_purchase: 1 };

      return await expense_db.findAll_expenses_db(filter, sort, "0", "1");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return [];
  },
  findById_expenses_s: async params => {
    try {
      return await expense_db.findById_expenses_db(params.id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  create_expenses_s: async body => {
    try {
      return await expense_db.create_expenses_db(body);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  bulk_create_expenses_s: async body => {
    const { expenses } = body;
    try {
      // Check all expenses in parallel for duplicates
      const existingChecks = await Promise.all(
        expenses.map(expense =>
          Expense.findOne({
            date_of_purchase: new Date(expense.date_of_purchase),
            expense_name: expense.expense_name,
            amount: expense.amount,
            card: expense.card,
            deleted: false,
          })
        )
      );

      const uniqueExpenses = expenses.filter((_, index) => !existingChecks[index]);

      if (uniqueExpenses.length === 0) {
        return { message: "No new expenses to add - all records already exist" };
      }

      const result = await expense_db.bulk_create_expenses_db(uniqueExpenses);
      return {
        message: `Created ${result.length} new expenses, skipped ${expenses.length - uniqueExpenses.length} duplicates`,
        result,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },

  create_all_expenses_s: async body => {
    const { data, card, properties } = body;
    try {
      const expenses = [];
      for (let line = 1; line < data.length; line += 1) {
        const object = {};
        for (let i = 0; i < data[line].length; i += 1) {
          object[properties[i]] = data[line][i];
        }
        expenses.push(object);
      }

      const payment_check = [
        "AUTOPAY PAYMENT - THANK YOU",
        "CUSTOMER SERVICE PAYMENT - THANK YOU",
        "RETURNED AUTOPAY (DEORY)",
      ];

      expenses.forEach(async expense => {
        if (!payment_check.includes(expense.description)) {
          const row = {
            date_of_purchase: formatDateToISODate(expense.date),
            expense_name: expense.description,
            place_of_purchase: determine_place(expense.description),
            card,
            url: "",
            application: determine_application(expense.description),
            category: determine_category(expense.description),
            amount: card === "GL AMEX" ? Math.abs(parseFloat(expense.amount)) * -1 : parseFloat(expense.amount),
          };
          await expense_db.create_expenses_db(row);
        }
      });

      return "Success";
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  update_expenses_s: async (params, body) => {
    try {
      return await expense_db.update_expenses_db(params.id, body);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  remove_expenses_s: async params => {
    try {
      return await expense_db.remove_expenses_db(params.id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  remove_multiple_expenses_s: async body => {
    try {
      return await expense_db.remove_multiple_expenses_db(body.ids);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  update_multiple_field_expenses_s: async body => {
    try {
      return await expense_db.update_multiple_field_expenses_db(body.ids, body.field, body.value);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  subscriptions_expenses_s: async () => {
    try {
      const today = new Date();
      const currentDayOfMonth = String(today.getDate()).padStart(2, "0"); // For monthly frequency
      const currentDayOfWeek = today.toLocaleString("en-US", { weekday: "long" }); // For weekly frequency
      const currentMonth = today.toLocaleString("en-US", { month: "long" }); // For yearly frequency

      const allSubscriptions = await Expense.find({
        is_subscription: true,
        deleted: false,
      });

      const todaysSubscriptions = allSubscriptions.filter(subscription => {
        const validToFormatted = subscription.subscription.valid_to
          ? new Date(subscription.subscription.valid_to).toISOString().split("T")[0]
          : null;

        let isDueToday = false;
        switch (subscription.subscription.frequency) {
          case "Weekly":
            isDueToday = subscription.subscription.repeats_on === currentDayOfWeek;
            break;
          case "Monthly":
            isDueToday = String(subscription.subscription.repeats_on) === currentDayOfMonth;
            break;
          case "Yearly":
            isDueToday = subscription.subscription.repeats_on === currentMonth;
            break;
          default:
            isDueToday = false;
            break;
        }

        return isDueToday && (!validToFormatted || today.toISOString().split("T")[0] <= validToFormatted);
      });

      await Promise.all(
        todaysSubscriptions.map(async subscription => {
          const newExpenseData = {
            expense_name: subscription.expense_name,
            application: subscription.application,
            invoice_url: subscription.invoice_url,
            place_of_purchase: subscription.place_of_purchase,
            date_of_purchase: new Date(), // current date as the purchase date
            category: subscription.category,
            card: subscription.card,
            amount: subscription.subscription.amount, // amount from subscription
            is_subscription: false, // since this is a one-time expense record
            parent_subscription: subscription._id, // reference to the subscription
          };

          return Expense.create(newExpenseData);
        })
      );

      return "Success";
    } catch (error) {
      console.error("Error processing subscription expenses: ", error);
      throw new Error();
    }
  },
  backfill_subscriptions_expenses_s: async params => {
    const { id } = params;
    try {
      const today = new Date();
      const subscription = await Expense.findById(id);

      if (!subscription || !subscription.is_subscription || subscription.deleted) {
        throw new Error("Subscription not found or invalid");
      }

      const startDate = new Date(subscription.date_of_purchase); // Start date of the subscription
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of the current month
      const validToDate = subscription.subscription.valid_to ? new Date(subscription.subscription.valid_to) : null;

      for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
        const dayOfMonth = parseInt(subscription.subscription.repeats_on, 10) || startDate.getDate();
        const purchaseDate = new Date(date.getFullYear(), date.getMonth(), dayOfMonth);
        // Ensure purchaseDate does not exceed the last day of the month
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        if (purchaseDate > monthEnd) {
          purchaseDate.setDate(monthEnd.getDate());
        }

        // Check against valid_to date
        if (validToDate && purchaseDate > validToDate) {
          break; // Skip to next month if purchaseDate is after valid_to date
        }

        const rangeStart = new Date(purchaseDate);
        rangeStart.setDate(purchaseDate.getDate() - 1); // One day before
        rangeStart.setHours(0, 0, 0, 0);

        const rangeEnd = new Date(purchaseDate);
        rangeEnd.setDate(purchaseDate.getDate() + 1); // One day after
        rangeEnd.setHours(23, 59, 59, 999);

        const existingExpense = Expense.findOne({
          parent_subscription: subscription._id,
          date_of_purchase: {
            $gte: rangeStart,
            $lt: rangeEnd,
          },
          deleted: false,
        });
        if (!existingExpense) {
          // Create a new expense record for this month
          const newExpenseData = {
            expense_name: subscription.expense_name,
            application: subscription.application,
            invoice_url: subscription.invoice_url,
            place_of_purchase: subscription.place_of_purchase,
            date_of_purchase: purchaseDate, // Use the start of the month as the purchase date
            category: subscription.category,
            card: subscription.card,
            amount: subscription.subscription.amount, // amount from subscription
            is_subscription: false, // since this is a one-time expense record
            parent_subscription: subscription._id, // reference to the subscription
          };

          Expense.create(newExpenseData);
        }
      }

      return "Backfill complete";
    } catch (error) {
      console.error("Error backfilling subscription expenses: ", error);
      throw new Error();
    }
  },
};
