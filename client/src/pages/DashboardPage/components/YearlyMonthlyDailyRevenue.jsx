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
import { Button } from "@mui/material";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  const expensesByCategory = API.useGetExpensesByCategoryQuery({ start_date, end_date });
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
  let combinedCategoryData = [];
  if (expensesByCategory.isSuccess) {
    combinedCategoryData = Object.entries(expensesByCategory.data).map(([category, amount]) => ({
      category,
      amount,
    }));
  }

  const generateIRSExpenseReport = () => {
    if (!combinedCategoryData.length) return;

    // Sort data by amount in descending order
    const sortedData = [...combinedCategoryData].sort((a, b) => b.amount - a.amount);

    // Format number with commas
    const formatCurrency = number => {
      return `$${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Create table data once for both success and error cases
    const tableData = sortedData.map(row => [row.category, formatCurrency(row.amount)]);
    const total = sortedData.reduce((sum, row) => sum + row.amount, 0);
    tableData.push([
      {
        content: "Total",
        styles: { fontStyle: "bold" },
      },
      {
        content: formatCurrency(total),
        styles: { fontStyle: "bold" },
      },
    ]);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Add logo
    const logoImg = new Image();
    logoImg.src = "/images/optimized_images/logo_images/glow_logo_desaturated_optimized.png";

    // We need to wait for the image to load before we can add it to the PDF
    logoImg.onload = () => {
      const imgWidth = 25;
      const imgHeight = (logoImg.height * imgWidth) / logoImg.width;
      doc.addImage(logoImg, "PNG", margin, margin, imgWidth, imgHeight);

      // Add header
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`${year} Glow LEDs Expenses Report`, pageWidth / 2, margin + imgHeight + 2, { align: "center" });

      // Add date range
      doc.setFontSize(10);
      doc.text(`Period: ${format_date(start_date)} - ${format_date(end_date)}`, pageWidth / 2, margin + imgHeight + 8, {
        align: "center",
      });

      // Add tax year
      doc.text("Tax Year: " + year, margin, margin + imgHeight + 14);

      // Configure table to fit on one page
      doc.autoTable({
        startY: margin + imgHeight + 20,
        head: [["Category", "Amount"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: [255, 255, 255],
          fontSize: 10,
        },
        footStyles: {
          fillColor: [240, 240, 240],
          fontSize: 10,
        },
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 40, halign: "right" },
        },
        margin: { top: margin, right: margin, bottom: margin + 20, left: margin },
        tableWidth: "auto",
      });

      doc.setFontSize(8);
      // Save the PDF
      doc.save(`${year} Glow LEDs Expenses Report.pdf`);
    };

    // Handle image loading error
    logoImg.onerror = () => {
      // If logo fails to load, generate without logo
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Glow LEDs Expenses Report", pageWidth / 2, margin, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Period: ${format_date(start_date)} - ${format_date(end_date)}`, pageWidth / 2, margin + 8, {
        align: "center",
      });
      doc.text("Tax Year: " + year, margin, margin + 16);

      doc.autoTable({
        startY: margin + 25,
        head: [["Category", "Amount"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: [255, 255, 255],
          fontSize: 10,
        },
        footStyles: {
          fillColor: [240, 240, 240],
          fontSize: 10,
        },
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 40, halign: "right" },
        },
        margin: { top: margin, right: margin, bottom: margin + 20, left: margin },
        tableWidth: "auto",
      });

      doc.save(`${year} Glow LEDs Expenses Report.pdf`);
    };
  };

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
      {combinedCategoryData && (
        <>
          {combinedCategoryData.length > 0 && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={generateIRSExpenseReport}
                style={{ marginBottom: "1rem" }}
              >
                {"Download IRS Expense Report"}
              </Button>
              <GLDisplayTable
                title="IRS Category Expenses"
                rows={combinedCategoryData}
                defaultSorting={[1, "desc"]}
                columnDefs={[
                  { title: "Category", display: "category", sortable: true },
                  { title: "Amount", display: row => `$${row.amount.toFixed(2)}`, sortable: true },
                ]}
              />
            </>
          )}
        </>
      )}
    </>
  );
};

export default YearlyMonthlyDailyRevenue;
