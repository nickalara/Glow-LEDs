import expense_db from "./expense_db.js";
import expense_services from "./expense_services.js";

export default {
  findAll_expenses_c: async (req, res) => {
    const { query } = req;
    try {
      const expenses = await expense_services.findAll_expenses_s(query);
      if (expenses) {
        return res.status(200).send(expenses);
      }
      return res.status(404).send({ message: "Expenses Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  create_filters_expenses_c: async (req, res) => {
    const { query } = req;
    try {
      const expense_filters = await expense_services.create_filters_expenses_s(query);
      if (expense_filters) {
        return res.status(200).send(expense_filters);
      }
      return res.status(404).send({ message: "Expenses Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  findAllByDate_expenses_c: async (req, res) => {
    const { body } = req;
    try {
      const expenses = await expense_services.findAllByDate_expenses_s(body);
      if (expenses) {
        return res.status(200).send(expenses);
      }
      return res.status(404).send({ message: "Expenses Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  findById_expenses_c: async (req, res) => {
    const { params } = req;
    try {
      const expense = await expense_services.findById_expenses_s(params);

      if (expense) {
        return res.status(200).send(expense);
      }
      return res.status(404).send({ message: "Expense Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  create_expenses_c: async (req, res) => {
    const { body } = req;
    try {
      const expense = await expense_services.create_expenses_s(body);
      if (expense) {
        return res.status(201).send(expense);
      }
      return res.status(500).send({ message: "Error Creating Expense" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  bulk_create_expenses_c: async (req, res) => {
    const { body } = req;
    try {
      const expense = await expense_services.bulk_create_expenses_s(body);
      if (expense) {
        return res.status(201).send(expense);
      }
      return res.status(500).send({ message: "Error Creating Expense" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  create_all_expenses_c: async (req, res) => {
    const { body } = req;
    try {
      const expense = await expense_services.create_all_expenses_s(body);
      if (expense) {
        return res.status(201).send(expense);
      }
      return res.status(500).send({ message: "Error Creating Expense" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  update_expenses_c: async (req, res) => {
    const { params, body } = req;
    try {
      const expense = await expense_services.update_expenses_s(params, body);
      if (expense) {
        return res.status(200).send(expense);
      }
      return res.status(500).send({ message: "Error Updating Expense" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  remove_expenses_c: async (req, res) => {
    const { params } = req;
    try {
      const expense = await expense_services.remove_expenses_s(params);
      if (expense) {
        return res.status(204).send({ message: "Expense Deleted" });
      }
      return res.status(500).send({ message: "Error Deleting Expense" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  get_range_expenses_expenses_c: async (req, res) => {
    const { start_date, end_date } = req.query;
    try {
      const expense = await expense_db.get_range_expenses_expenses_db(start_date, end_date);
      if (expense) {
        return res.status(200).send(expense);
      }
      return res.status(500).send({ message: "Error Finding Expenses" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  get_daily_expenses_expenses_c: async (req, res) => {
    const { start_date, end_date } = req.query;
    try {
      const expense = await expense_db.get_daily_expenses_expenses_db(start_date, end_date);
      if (expense) {
        return res.status(200).send(expense);
      }
      return res.status(500).send({ message: "Error Finding Expenses" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  get_expenses_by_category_expenses_c: async (req, res) => {
    const { start_date, end_date } = req.query;
    try {
      const expense = await expense_db.get_expenses_by_category_expenses_db(start_date, end_date);
      if (expense) {
        return res.status(200).send(expense);
      }
      return res.status(500).send({ message: "Error Finding Expenses" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  get_monthly_expenses_expenses_c: async (req, res) => {
    const { year } = req.query;
    try {
      const expense = await expense_db.get_monthly_expenses_expenses_db(year);
      if (expense) {
        return res.status(200).send(expense);
      }
      return res.status(500).send({ message: "Error Finding Expenses" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  get_yearly_expenses_expenses_c: async (req, res) => {
    try {
      const expense = await expense_db.get_yearly_expenses_expenses_db();
      if (expense) {
        return res.status(200).send(expense);
      }
      return res.status(500).send({ message: "Error Finding Expenses" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  remove_multiple_expenses_c: async (req, res) => {
    const { body } = req;
    try {
      const expense = await expense_services.remove_multiple_expenses_s(body);
      if (expense) {
        return res.status(204).send({ message: "Expense Deleted" });
      }
      return res.status(500).send({ message: "Error Deleting Expense" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  update_multiple_field_expenses_c: async (req, res) => {
    const { body } = req;
    try {
      const expense = await expense_services.update_multiple_field_expenses_s(body);
      if (expense) {
        return res.status(200).send({ message: `${body.field} Updated` });
      }
      return res.status(500).send({ message: `Error Updating ${body.field}` });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  subscriptions_expenses_c: async (req, res) => {
    const { body } = req;
    try {
      const expense = await expense_services.subscriptions_expenses_s(body);
      if (expense) {
        return res.status(204).send({ message: "Subscription Expenses Logged" });
      }
      return res.status(500).send({ message: "Error Logging Subscription Expenses" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  backfill_subscriptions_expenses_c: async (req, res) => {
    const { params } = req;
    try {
      const expense = await expense_services.backfill_subscriptions_expenses_s(params);
      if (expense) {
        return res.status(204).send({ message: "Backfill Subscription Expenses Logged" });
      }
      return res.status(500).send({ message: "Error Logging Backfill Subscription Expenses" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
};
