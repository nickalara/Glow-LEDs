import { GLDisplayTable } from "../../../shared/GlowLEDsComponents/GLDisplayTable";
import { Loading } from "../../../shared/SharedComponents";
import { Button, Typography, Box, Paper } from "@mui/material";
import {
  useIRSCategoryExpenses,
  generateIRSExpenseReport,
  categoryColumnDefs,
  calculateBusinessUsePercentage,
  isHomeOfficeCategory,
} from "./IRSCategoryExpensesHelpers";

/**
 * Component for displaying and generating reports for IRS category expenses
 */
const IRSCategoryExpenses = () => {
  // Use custom hook to get data and state
  const { categoryData, isLoading, year, start_date, end_date } = useIRSCategoryExpenses();

  // Get home office percentage information
  const homeOfficeInfo = calculateBusinessUsePercentage();

  // Handler for generating expense report
  const handleGenerateReport = () => {
    generateIRSExpenseReport({
      categoryData,
      year,
      start_date,
      end_date,
    });
  };

  // Find categories that are adjusted for home office percentage
  const adjustedCategories = categoryData
    .filter(item => isHomeOfficeCategory(item.category))
    .map(item => item.category)
    .join(", ");

  // Create note text with proper spacing
  const noteText = `Note: The expenses for ${adjustedCategories} are adjusted to ${homeOfficeInfo.formattedPercentage} of the total amount based on the business use percentage of your home.`;

  return (
    <Box mt={2}>
      <Loading loading={isLoading} />
      {categoryData.length > 0 && (
        <>
          <Button variant="contained" color="primary" onClick={handleGenerateReport} style={{ marginBottom: "1rem" }}>
            {"Download IRS Expense Report"}
          </Button>

          <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: "#f9f9f9" }}>
            <Typography variant="h6" gutterBottom>
              {"Home Office Deduction Information"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
              <Box>
                <Typography variant="body2">
                  <strong>{"Total Home Square Footage:"}</strong> {homeOfficeInfo.apartmentSquareFootage.toFixed(2)}{" "}
                  {"sq ft"}
                </Typography>
                <Typography variant="body2">
                  <strong>{"Office Square Footage:"}</strong> {homeOfficeInfo.officeSquareFootage.toFixed(2)} {"sq ft"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2">
                  <strong>{"Business Use Percentage:"}</strong> {homeOfficeInfo.formattedPercentage}
                </Typography>
                <Typography variant="body2">
                  <strong>{"Adjusted Categories:"}</strong> {adjustedCategories}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic", color: "#666" }}>
              {noteText}
            </Typography>
          </Paper>

          <GLDisplayTable
            title="IRS Category Expenses"
            rows={categoryData}
            defaultSorting={[1, "desc"]}
            columnDefs={categoryColumnDefs}
          />
        </>
      )}
    </Box>
  );
};

export default IRSCategoryExpenses;
