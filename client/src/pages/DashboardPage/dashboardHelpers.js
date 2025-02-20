export const getMonthStartEndDates = ({ month, year }) => {
  if (month && year) {
    const monthNumber = new Date(Date.parse(`${month} 1, ${year}`)).getMonth();
    const start_date = new Date(year, monthNumber, 1);
    const end_date = new Date(year, monthNumber + 1, 0);
    return { start_date: start_date.toISOString().substring(0, 10), end_date: end_date.toISOString().substring(0, 10) };
  } else if (year) {
    return {
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
    };
  } else {
    // Default start date when year is not provided
    const todayISO = new Date().toISOString();
    return { start_date: "2018-01-01", end_date: todayISO };
  }
};

export const colors = [
  "#b33434",
  "#b9742f",
  "#bfbf26",
  "#7ccd2a",
  "#2bc92b",
  "#29c779",
  "#27bfbf",
  "#2873bd",
  "#2a2ab5",
  "#742bbd",
  "#bd28bd",
  "#c12573",
];

export const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const isLoading = data => {
  return !data.isLoading && data.data[0];
};

export const timeLabel = (month, year) => {
  return year && month ? `${year} ${month}` : year ? year : month ? month : "All Time";
};

export const determineTabName = (month, year) => {
  if (year && month) {
    return "Daily";
  } else if (year) {
    return "Monthly";
  } else {
    return "Yearly";
  }
};

export const combineYearlyRevenueAndExpenses = (revenueData, expensesData, paycheckData) => {
  let combinedData = [];

  for (let revenue of revenueData) {
    let expense = expensesData.find(exp => exp.year === revenue.year);
    let paycheck = paycheckData.find(pay => pay.year === revenue.year);

    combinedData.push({
      year: revenue.year,
      revenue: revenue.totalPrice,
      revenueMonthlyAverage: revenue.monthlyAverage,
      expense: expense ? expense.amount : 0,
      expenseMonthlyAverage: expense ? expense.monthlyAverage : 0,
      paycheck: paycheck ? paycheck.amount : 0,
    });
  }

  // Add expense-only and paycheck-only entries
  [...expensesData, ...paycheckData].forEach(item => {
    if (!combinedData.find(data => data.year === item.year)) {
      combinedData.push({
        year: item.year,
        revenue: 0,
        revenueMonthlyAverage: 0,
        expense: item.amount || 0,
        expenseMonthlyAverage: item.monthlyAverage || 0,
        paycheck: item.amount || 0,
      });
    }
  });

  combinedData.sort((a, b) => a.year - b.year);

  return combinedData;
};

export const combineMonthlyRevenueAndExpenses = (revenueData, expensesData, paycheckData) => {
  let combinedData = [];

  for (let revenue of revenueData) {
    let expense = expensesData.find(exp => exp.month === revenue.month);
    let paycheck = paycheckData.find(pay => pay.month === revenue.month);

    combinedData.push({
      month: revenue.month,
      revenue: revenue.totalPrice,
      revenueDailyAverage: revenue.dailyAverage,
      expense: expense ? expense.amount : 0,
      expenseDailyAverage: expense ? expense.dailyAverage : 0,
      paycheck: paycheck ? paycheck.amount : 0,
    });
  }

  // Add expense-only and paycheck-only entries
  [...expensesData, ...paycheckData].forEach(item => {
    if (!combinedData.find(data => data.month === item.month)) {
      combinedData.push({
        month: item.month,
        revenue: 0,
        revenueDailyAverage: 0,
        expense: item.amount || 0,
        expenseDailyAverage: item.dailyAverage || 0,
        paycheck: item.amount || 0,
      });
    }
  });

  combinedData.sort((a, b) => a.month - b.month);

  return combinedData;
};

export const combineDailyRevenueAndExpenses = (revenueData, expensesData, paycheckData) => {
  let combinedData = [];

  for (let revenue of revenueData) {
    let expense = expensesData.find(exp => new Date(exp.date).toDateString() === new Date(revenue.date).toDateString());
    let paycheck = paycheckData.find(
      pay => new Date(pay.date).toDateString() === new Date(revenue.date).toDateString()
    );

    combinedData.push({
      date: revenue.date,
      revenue: revenue.totalPrice,
      revenueHourlyAverage: revenue.hourlyAverage,
      expense: expense ? expense.amount : 0,
      expenseHourlyAverage: expense ? expense.hourlyAverage : 0,
      paycheck: paycheck ? paycheck.amount : 0,
    });
  }

  // Add expense-only and paycheck-only entries
  [...expensesData, ...paycheckData].forEach(item => {
    if (!combinedData.find(data => new Date(data.date).toDateString() === new Date(item.date).toDateString())) {
      combinedData.push({
        date: item.date,
        revenue: 0,
        revenueHourlyAverage: 0,
        expense: item.amount || 0,
        expenseHourlyAverage: item.hourlyAverage || 0,
        paycheck: item.amount || 0,
      });
    }
  });

  combinedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return combinedData;
};

export const conditionalColor = (value1, value2) => {
  return value1 - value2 < 0 ? "red" : value1 - value2 > 0 ? "green" : "black";
};
