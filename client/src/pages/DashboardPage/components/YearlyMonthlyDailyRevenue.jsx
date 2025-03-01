import { GLDisplayTable } from "../../../shared/GlowLEDsComponents/GLDisplayTable";
import { format_date } from "../../../utils/helper_functions";
import {
  combineDailyRevenueAndExpenses,
  combineMonthlyRevenueAndExpenses,
  combineYearlyRevenueAndExpenses,
  conditionalColor,
  months,
} from "../dashboardHelpers";
import * as API from "../../../api";
import { useSelector } from "react-redux";
import { Loading } from "../../../shared/SharedComponents";

const YearlyMonthlyDailyRevenue = () => {
  const dashboardPage = useSelector(state => state.dashboards);

  const { year, month, start_date, end_date } = dashboardPage;

  const daily_revenue = API.useGetDailyRevenueOrdersQuery({ start_date, end_date });
  const monthly_revenue = API.useGetMonthlyRevenueOrdersQuery({ year });
  const yearly_revenue = API.useGetYearlyRevenueOrdersQuery();
  const daily_expenses = API.useGetDailyExpenseOrdersQuery({ start_date, end_date });
  const monthly_expenses = API.useGetMonthlyExpenseOrdersQuery({ year });
  const yearly_expenses = API.useGetYearlyExpenseOrdersQuery();
  const daily_paychecks = API.useGetDailyPaycheckOrdersQuery({ start_date, end_date });
  const monthly_paychecks = API.useGetMonthlyPaycheckOrdersQuery({ year });
  const yearly_paychecks = API.useGetYearlyPaycheckOrdersQuery();

  let combinedYearlyData = [];

  if (yearly_revenue.isSuccess && yearly_expenses.isSuccess && yearly_paychecks.isSuccess) {
    combinedYearlyData = combineYearlyRevenueAndExpenses(
      yearly_revenue.data,
      yearly_expenses.data,
      yearly_paychecks.data
    );
  }
  let combinedMonthlyData = [];

  if (monthly_revenue.isSuccess && monthly_expenses.isSuccess && monthly_paychecks.isSuccess) {
    combinedMonthlyData = combineMonthlyRevenueAndExpenses(
      monthly_revenue.data,
      monthly_expenses.data,
      monthly_paychecks.data
    );
  }
  let combinedDailyData = [];

  if (daily_revenue.isSuccess && daily_expenses.isSuccess && daily_paychecks.isSuccess) {
    combinedDailyData = combineDailyRevenueAndExpenses(daily_revenue.data, daily_expenses.data, daily_paychecks.data);
  }

  return (
    <>
      <Loading loading={daily_revenue.isLoading && monthly_revenue.isLoading && yearly_revenue.isLoading} />
      {!month && !year && (
        <div>
          {combinedYearlyData.length > 0 && (
            <GLDisplayTable
              title="Yearly Revenue and Expenses"
              rows={combinedYearlyData}
              columnDefs={[
                { title: "Year", display: "year", sortable: true },
                { title: "Revenue", display: row => `$${row.revenue?.toFixed(2)}`, sortable: true },
                { title: "Expenses", display: row => `-$${(row.expense + row.paycheck)?.toFixed(2)}`, sortable: true },
                {
                  title: "Profit",
                  display: row => `$${(row.revenue - (row.expense + row.paycheck))?.toFixed(2)}`,
                  conditionalColor: row => conditionalColor(row.revenue, row.expense + row.paycheck),
                  sortable: true,
                },
                { title: "Payouts", display: row => `-$${row.paycheck?.toFixed(2)}`, sortable: true },
                {
                  title: "Revenue Monthly Average",
                  display: row => `$${row.revenueMonthlyAverage?.toFixed(2)}`,
                  sortable: true,
                },
                {
                  title: "Expense Monthly Average",
                  display: row => `$${row.expenseMonthlyAverage?.toFixed(2)}`,
                  sortable: true,
                },
              ]}
            />
          )}
        </div>
      )}
      {!month && year && (
        <div>
          {combinedMonthlyData.length > 0 && (
            <GLDisplayTable
              title="Monthly Revenue"
              rows={combinedMonthlyData}
              columnDefs={[
                { title: "Month", display: row => months[row.month - 1], sortable: true },
                { title: "Revenue", display: row => `$${row.revenue?.toFixed(2)}`, sortable: true },
                { title: "Expenses", display: row => `-$${(row.expense + row.paycheck)?.toFixed(2)}`, sortable: true },
                {
                  title: "Profit",
                  display: row => `$${(row.revenue - (row.expense + row.paycheck))?.toFixed(2)}`,
                  conditionalColor: row => conditionalColor(row.revenue, row.expense + row.paycheck),
                  sortable: true,
                },
                { title: "Payouts", display: row => `-$${row.paycheck?.toFixed(2)}`, sortable: true },
                { title: "Daily Average", display: row => `$${row.revenueDailyAverage?.toFixed(2)}`, sortable: true },
                {
                  title: "Expense Daily Average",
                  display: row => `$${row.expenseDailyAverage?.toFixed(2)}`,
                  sortable: true,
                },
              ]}
            />
          )}
        </div>
      )}
      {month && year && (
        <>
          {combinedDailyData.length > 0 && (
            <GLDisplayTable
              title="Daily Revenue"
              rows={combinedDailyData}
              columnDefs={[
                { title: "Day", display: row => format_date(row.date), sortable: true },
                { title: "Revenue", display: row => `$${row.revenue?.toFixed(2)}`, sortable: true },
                { title: "Expenses", display: row => `-$${(row.expense + row.paycheck)?.toFixed(2)}`, sortable: true },
                {
                  title: "Profit",
                  display: row => `$${(row.revenue - (row.expense + row.paycheck))?.toFixed(2)}`,
                  conditionalColor: row => conditionalColor(row.revenue, row.expense + row.paycheck),
                  sortable: true,
                },
                { title: "Payouts", display: row => `-$${row.paycheck?.toFixed(2)}`, sortable: true },
                { title: "Hourly Average", display: row => `$${row.revenueHourlyAverage?.toFixed(2)}`, sortable: true },
                {
                  title: "Expense Hourly Average",
                  display: row => `$${row.expenseHourlyAverage?.toFixed(2)}`,
                  sortable: true,
                },
              ]}
            />
          )}
        </>
      )}
    </>
  );
};

export default YearlyMonthlyDailyRevenue;
