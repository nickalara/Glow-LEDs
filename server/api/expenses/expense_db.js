import Expense from "./expense.js";

export default {
  findAll_expenses_db: async (filter, sort, limit, page) => {
    try {
      return await Expense.find(filter)
        .sort(sort)
        .populate("documents")
        .populate("parent_subscription")
        .limit(parseInt(limit, 10))
        .skip(Math.max(parseInt(page, 10), 0) * parseInt(limit, 10))
        .exec();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return [];
  },
  findById_expenses_db: async id => {
    try {
      return await Expense.findOne({ _id: id, deleted: false }).populate("documents").populate("parent_subscription");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  create_expenses_db: async body => {
    try {
      return await Expense.create(body);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  bulk_create_expenses_db: async expenses => {
    try {
      return await Expense.insertMany(expenses);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  update_expenses_db: async (id, body) => {
    try {
      const expense = await Expense.findOne({ _id: id, deleted: false });
      if (expense) {
        return await Expense.updateOne({ _id: id }, body);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  remove_expenses_db: async id => {
    try {
      const expense = await Expense.findOne({ _id: id, deleted: false });
      if (expense) {
        return await Expense.updateOne({ _id: id }, { deleted: true });
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  remove_multiple_expenses_db: async ids => {
    try {
      return await Expense.updateMany({ _id: { $in: ids } }, { deleted: true });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return null;
  },
  update_multiple_field_expenses_db: async (ids, field, value) => {
    try {
      const updateObj = {};
      updateObj[field] = value;
      return await Expense.updateMany({ _id: { $in: ids } }, updateObj);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      return null;
    }
  },
  count_expenses_db: async filter => {
    try {
      return await Expense.countDocuments(filter);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return 0;
  },
  get_range_expenses_expenses_db: async (start_date, end_date) => {
    try {
      const totalAmount = await Expense.aggregate([
        {
          $match: {
            deleted: false,
            is_direct_expense: true,
            date_of_purchase: {
              $gte: new Date(start_date),
              $lt: new Date(end_date),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]).exec();
      return totalAmount;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return 0;
  },
  get_monthly_expenses_expenses_db: async year => {
    try {
      const amountByMonth = await Expense.aggregate([
        {
          $match: {
            deleted: false,
            is_direct_expense: true,
            date_of_purchase: {
              $gte: new Date(`${year}-01-01T00:00:00.000Z`),
              $lt: new Date(`${parseInt(year, 10) + 1}-01-01T00:00:00.000Z`),
            },
            irs_category: {
              $nin: ["Travel", "Meals", "Rent or Lease", "Car and Truck Expenses"],
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$date_of_purchase" },
              day: { $dayOfMonth: "$date_of_purchase" },
            },
            dailyAmount: {
              $sum: "$amount",
            },
          },
        },
        {
          $group: {
            _id: {
              month: "$_id.month",
            },
            amount: {
              $sum: "$dailyAmount",
            },
            dailyAverage: {
              $avg: "$dailyAmount",
            },
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id.month",
            amount: 1,
            dailyAverage: 1,
          },
        },
      ]).exec();

      return amountByMonth;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return [];
  },

  get_yearly_expenses_expenses_db: async () => {
    try {
      const amountByYear = await Expense.aggregate([
        {
          $match: {
            deleted: false,
            is_direct_expense: true,
            irs_category: {
              $nin: ["Travel", "Meals", "Rent or Lease", "Car and Truck Expenses"],
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date_of_purchase" },
              month: { $month: "$date_of_purchase" },
            },
            monthlyAmount: {
              $sum: "$amount",
            },
          },
        },
        {
          $group: {
            _id: {
              year: "$_id.year",
            },
            amount: {
              $sum: "$monthlyAmount",
            },
            monthlyAverage: {
              $avg: "$monthlyAmount",
            },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            amount: 1,
            monthlyAverage: 1,
          },
        },
      ]).exec();
      return amountByYear;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return [];
  },
  get_daily_expenses_expenses_db: async (start_date, end_date) => {
    try {
      const amountByDay = await Expense.aggregate([
        {
          $match: {
            deleted: false,
            is_direct_expense: true,
            date_of_purchase: {
              $gte: new Date(start_date),
              $lt: new Date(end_date),
            },
            irs_category: {
              $nin: ["Travel", "Meals", "Rent or Lease", "Car and Truck Expenses"],
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date_of_purchase" },
              month: { $month: "$date_of_purchase" },
              day: { $dayOfMonth: "$date_of_purchase" },
              hour: { $hour: "$date_of_purchase" },
            },
            hourlyAmount: {
              $sum: "$amount",
            },
          },
        },
        {
          $group: {
            _id: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
            amount: {
              $sum: "$hourlyAmount",
            },
            hourlyAverage: {
              $avg: "$hourlyAmount",
            },
          },
        },
        {
          $project: {
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
              },
            },
            amount: 1,
            hourlyAverage: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            date: 1,
          },
        },
      ]).exec();

      return amountByDay;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return [];
  },
  get_expenses_by_category_expenses_db: async (start_date, end_date) => {
    try {
      const expenses = await Expense.aggregate([
        {
          $match: {
            deleted: false,
            date_of_purchase: {
              $gte: new Date(start_date),
              $lt: new Date(end_date),
            },
            $or: [
              {
                card: {
                  $in: [
                    "Amazon 9204",
                    "Amazon Business 1004",
                    "Amazon Business 0584",
                    "Chase 2365",
                    "Stripe",
                    "Charles Schwab 9432",
                  ],
                },
              },
              {
                $and: [{ card: "Mastercard 7404" }, { irs_category: "Rent or Lease" }],
              },
              {
                $and: [{ card: "Mastercard 7404" }, { irs_category: "Utilities" }],
              },
              {
                $and: [{ card: "Amex 3002" }, { irs_category: "Utilities" }],
              },
              {
                $and: [{ card: "Mastercard 7404" }, { irs_category: "Legal and Professional Services" }],
              },
              {
                $and: [{ card: "Mastercard 7404" }, { irs_category: "Car and Truck Expenses" }],
              },
              {
                $and: [{ card: "Amex 3002" }, { irs_category: "Car and Truck Expenses" }],
              },
              {
                $and: [{ reason: { $exists: true } }, { irs_category: "Meals" }],
              },
            ],
          },
        },
        {
          $group: {
            _id: "$irs_category",
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $project: {
            _id: 0,
            irs_category: "$_id",
            totalAmount: 1,
          },
        },
      ]);

      // Convert array to object
      return expenses.reduce((acc, category) => {
        const newAcc = { ...acc };
        newAcc[category.irs_category] = category.totalAmount;
        return newAcc;
      }, {});
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
    return {};
  },
};
