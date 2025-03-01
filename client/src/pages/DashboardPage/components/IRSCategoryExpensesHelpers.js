import { format_date } from "../../../utils/helper_functions";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as API from "../../../api";
import { useSelector } from "react-redux";

/**
 * Home office information for tax deduction calculations
 */
export const homeInfo = {
  apartmentSquareFootage: 2690.98,
  officeSquareFootage: 322.92,
};

/**
 * Calculate the business use percentage of home
 * @returns {Object} - Object containing percentage and calculation details
 */
export const calculateBusinessUsePercentage = () => {
  const { apartmentSquareFootage, officeSquareFootage } = homeInfo;
  const percentage = (officeSquareFootage / apartmentSquareFootage) * 100;

  return {
    percentage: percentage,
    formattedPercentage: percentage.toFixed(2) + "%",
    officeSquareFootage,
    apartmentSquareFootage,
  };
};

/**
 * Custom hook to fetch and transform IRS category expense data
 * @returns {Object} - Object containing data and loading state
 */
export const useIRSCategoryExpenses = () => {
  // Get dashboard state from Redux
  const dashboardPage = useSelector(state => state.dashboards);
  const { year, start_date, end_date } = dashboardPage;

  // Fetch expense data by category
  const expensesByCategory = API.useGetExpensesByCategoryQuery({ start_date, end_date });

  // Transform API data into component-friendly format
  const rawCategoryData = expensesByCategory.isSuccess ? transformCategoryData(expensesByCategory.data) : [];

  // Apply home office adjustments
  const categoryData = rawCategoryData.map(row => adjustExpenseForHomeOffice(row));

  return {
    categoryData,
    isLoading: expensesByCategory.isLoading,
    year,
    start_date,
    end_date,
  };
};

/**
 * Transforms raw category expense data into a format suitable for display
 * @param {Object} expensesData - Raw expense data from API
 * @returns {Array} - Array of objects with category and amount properties
 */
export const transformCategoryData = expensesData => {
  if (!expensesData) return [];

  return Object.entries(expensesData).map(([category, amount]) => ({
    category,
    amount,
  }));
};

/**
 * Formats a number as currency with commas and 2 decimal places
 * @param {Number} number - Number to format
 * @returns {String} - Formatted currency string
 */
export const formatCurrency = number => {
  return `$${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Determines if a category is subject to home office percentage adjustment
 * @param {String} category - Expense category
 * @returns {Boolean} - True if category should be adjusted by home office percentage
 */
export const isHomeOfficeCategory = category => {
  const homeOfficeCategories = ["Rent or Lease", "Utilities"];
  return homeOfficeCategories.includes(category);
};

/**
 * Adjusts expense amount based on home office percentage if applicable
 * @param {Object} row - Expense row with category and amount
 * @returns {Object} - Adjusted expense row
 */
export const adjustExpenseForHomeOffice = row => {
  if (!isHomeOfficeCategory(row.category)) {
    return { ...row, isAdjusted: false };
  }

  const { percentage } = calculateBusinessUsePercentage();
  const originalAmount = row.amount;
  const adjustedAmount = (originalAmount * percentage) / 100;

  return {
    ...row,
    originalAmount,
    amount: adjustedAmount,
    isAdjusted: true,
    adjustmentPercentage: percentage,
  };
};

/**
 * Prepares table data for PDF generation with home office adjustments
 * @param {Array} categoryData - Array of category data objects
 * @returns {Object} - Object containing tableData, total, and adjustment details
 */
export const prepareTableData = categoryData => {
  // Sort data by amount in descending order
  const sortedData = [...categoryData].sort((a, b) => b.amount - a.amount);

  // Create table data
  const tableData = sortedData.map(row => {
    if (row.isAdjusted) {
      return [
        row.category + ` (${row.adjustmentPercentage.toFixed(2)}% of ${formatCurrency(row.originalAmount)})`,
        formatCurrency(row.amount),
      ];
    }
    return [row.category, formatCurrency(row.amount)];
  });

  // Calculate total
  const total = sortedData.reduce((sum, row) => sum + row.amount, 0);

  // Add total row
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

  // Get adjustment details for the report
  const homeOfficeDetails = calculateBusinessUsePercentage();

  return {
    tableData,
    total,
    homeOfficeDetails,
  };
};

/**
 * Adds home office information to the PDF
 * @param {Object} doc - jsPDF document
 * @param {Object} params - Parameters for adding home office info
 * @param {Number} params.startY - Y position to start adding content
 * @param {Object} params.homeOfficeDetails - Home office calculation details
 * @returns {Number} - New Y position after adding content
 */
export const addHomeOfficeInfo = (doc, { startY, homeOfficeDetails }) => {
  const margin = 20;
  let yPos = startY + 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Home Office Deduction Information", margin, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.text(`Total Home Square Footage: ${homeOfficeDetails.apartmentSquareFootage.toFixed(2)} sq ft`, margin, yPos);

  yPos += 6;
  doc.text(`Office Square Footage: ${homeOfficeDetails.officeSquareFootage.toFixed(2)} sq ft`, margin, yPos);

  yPos += 6;
  doc.text(`Business Use Percentage: ${homeOfficeDetails.formattedPercentage}`, margin, yPos);

  yPos += 6;
  doc.text("Note: Rent and Utilities expenses are adjusted based on business use percentage.", margin, yPos);

  return yPos + 10;
};

/**
 * Generates PDF with logo
 * @param {Object} params - Parameters for PDF generation
 * @param {Array} params.tableData - Table data for PDF
 * @param {String} params.year - Year for report title
 * @param {String} params.start_date - Start date for report period
 * @param {String} params.end_date - End date for report period
 * @param {Object} params.homeOfficeDetails - Home office calculation details
 */
export const generatePDFWithLogo = ({ tableData, year, start_date, end_date, homeOfficeDetails }) => {
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
    const tableEndY = doc.autoTable({
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
    }).lastAutoTable.finalY;

    // Add home office information
    addHomeOfficeInfo(doc, {
      startY: tableEndY,
      homeOfficeDetails,
    });

    doc.setFontSize(8);
    // Save the PDF
    doc.save(`${year} Glow LEDs Expenses Report.pdf`);
  };

  // Handle image loading error
  logoImg.onerror = () => {
    generatePDFWithoutLogo({ tableData, year, start_date, end_date, homeOfficeDetails });
  };
};

/**
 * Generates PDF without logo (fallback)
 * @param {Object} params - Parameters for PDF generation
 * @param {Array} params.tableData - Table data for PDF
 * @param {String} params.year - Year for report title
 * @param {String} params.start_date - Start date for report period
 * @param {String} params.end_date - End date for report period
 * @param {Object} params.homeOfficeDetails - Home office calculation details
 */
export const generatePDFWithoutLogo = ({ tableData, year, start_date, end_date, homeOfficeDetails }) => {
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

  const tableEndY = doc.autoTable({
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
  }).lastAutoTable.finalY;

  // Add home office information
  addHomeOfficeInfo(doc, {
    startY: tableEndY,
    homeOfficeDetails,
  });

  doc.save(`${year} Glow LEDs Expenses Report.pdf`);
};

/**
 * Main function to generate IRS expense report
 * @param {Object} params - Parameters for report generation
 * @param {Array} params.categoryData - Category data for report
 * @param {String} params.year - Year for report
 * @param {String} params.start_date - Start date for report period
 * @param {String} params.end_date - End date for report period
 */
export const generateIRSExpenseReport = ({ categoryData, year, start_date, end_date }) => {
  if (!categoryData || !categoryData.length) return;

  const { tableData, homeOfficeDetails } = prepareTableData(categoryData);
  generatePDFWithLogo({ tableData, year, start_date, end_date, homeOfficeDetails });
};

/**
 * Column definitions for the IRS category expenses table
 */
export const categoryColumnDefs = [
  {
    title: "Category",
    display: row => {
      if (row.isAdjusted) {
        return `${row.category} (${row.adjustmentPercentage.toFixed(2)}% of $${row.originalAmount.toFixed(2)})`;
      }
      return row.category;
    },
    sortable: true,
  },
  {
    title: "Amount",
    display: row => `$${row.amount.toFixed(2)}`,
    sortable: true,
  },
];
