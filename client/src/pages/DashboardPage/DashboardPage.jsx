import { Helmet } from "react-helmet";

import * as API from "../../api";
import { determineTabName } from "./dashboardHelpers";
import { useDispatch, useSelector } from "react-redux";
import { DatePicker, IRSCategoryExpenses } from "./components";
import { Loading } from "../../shared/SharedComponents";

import { openGcodeContinuousModal, setTabIndex } from "./dashboardSlice";
import GLTabPanel from "../../shared/GlowLEDsComponents/GLTabPanel/GLTabPanel";
import YearlyMonthlyDailyRevenue from "./components/YearlyMonthlyDailyRevenue";
import AffiliateEarnings from "./components/AffiliateEarnings";
import CategorySales from "./components/CategorySales";
import CurrentStock from "./components/CurrentStock";
import TotalsTable from "./components/TotalsTable";
import AllProductRevenue from "./components/AllProductRevenue";
import GcodeGeneratorModal from "./components/GcodeGeneratorModal/GcodeGeneratorModal";
import ProductRevenue from "./components/ProductRevenue";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

const DashboardPage = () => {
  const dispatch = useDispatch();
  const dashboardPage = useSelector(state => state.dashboards);

  const { year, month, start_date, end_date, start_end_date, loading, tabIndex } = dashboardPage;

  const range_revenue = API.useGetRangeRevenueOrdersQuery({ start_date, end_date });
  const category_range_revenue = API.useGetRangeCategoryRevenueOrdersQuery({ start_date, end_date });
  const tips_range_revenue = API.useGetRangeTipsRevenueOrdersQuery({ start_date, end_date });
  const affiliate_earnings_code_usage = API.useGetRangeAffiliateEarningsCodeUsageQuery({ start_date, end_date });
  const all_product_revenue = API.useGetProductRevenueQuery({ start_date, end_date });
  const range_payouts = API.useGetRangePayoutsQuery({ start_date, end_date });
  const range_expenses = API.useGetRangeExpensesQuery({ start_date, end_date });

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Helmet>
        <title>{"Dashboard | Glow LEDs"}</title>
      </Helmet>
      <h2 className="ta-c w-100per jc-c fs-30px">{"Glow LEDs Dashboard"}</h2>
      <div className="jc-b w-100per">
        <Button variant="contained" onClick={() => dispatch(openGcodeContinuousModal(true))}>
          {"Gcode Generater"}
        </Button>
      </div>

      <Loading loading={loading} />
      <div className="m-auto w-100per">
        <DatePicker
          year={year}
          month={month}
          start_date={start_date}
          end_date={end_date}
          start_end_date={start_end_date}
        />

        <TotalsTable
          range_revenue={range_revenue}
          tips_range_revenue={tips_range_revenue}
          range_payouts={range_payouts}
          range_expenses={range_expenses}
          month={month}
          year={year}
        />

        <Paper>
          <AppBar position="sticky" color="transparent">
            <Tabs
              value={tabIndex}
              className="jc-b"
              onChange={(e, newValue) => {
                dispatch(setTabIndex(newValue));
              }}
              variant="scrollable"
              scrollButtons="false"
            >
              <Tab label={`${determineTabName(month, year)} Revenue`} value={0} />

              <Tab label="Affiliate Earnings" value={1} />
              <Tab label="Product Categories" value={2} />
              <Tab label="All Products" value={3} />
              <Tab label="Product Revenue" value={4} />
              <Tab label="IRS Expenses" value={5} />
            </Tabs>
          </AppBar>
        </Paper>
        <GLTabPanel value={tabIndex} index={0}>
          <YearlyMonthlyDailyRevenue />
        </GLTabPanel>
        <GLTabPanel value={tabIndex} index={1}>
          <AffiliateEarnings month={month} year={year} affiliate_earnings_code_usage={affiliate_earnings_code_usage} />
        </GLTabPanel>
        <GLTabPanel value={tabIndex} index={2}>
          <CategorySales category_range_revenue={category_range_revenue} />
        </GLTabPanel>
        <GLTabPanel value={tabIndex} index={3}>
          <AllProductRevenue all_product_revenue={all_product_revenue} />
        </GLTabPanel>
        <GLTabPanel value={tabIndex} index={4}>
          <ProductRevenue />
        </GLTabPanel>
        <GLTabPanel value={tabIndex} index={5}>
          <IRSCategoryExpenses />
        </GLTabPanel>
        <CurrentStock />
        <CurrentStock />
        <GcodeGeneratorModal />
      </div>
    </Container>
  );
};
export default DashboardPage;
