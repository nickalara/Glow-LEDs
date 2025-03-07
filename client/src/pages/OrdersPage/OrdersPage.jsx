import { useDispatch } from "react-redux";

import { Helmet } from "react-helmet";
import { GLAutocomplete } from "../../shared/GlowLEDsComponents";
import GLTableV2 from "../../shared/GlowLEDsComponents/GLTableV2/GLTableV2";
import { open_create_order_modal } from "../../slices/orderSlice";
import { EditOrderModal, OrderDropdown } from "./components";
import * as API from "../../api";

import { orderStatusColors, determineOrderColors, orderExceptionStatusColors } from "./ordersPageHelpers";
import ShippingModal from "./components/ShippingModal";
import { openCreateLabelModal, open_create_pickup_modal } from "../../slices/shippingSlice";
import CreatePickupModal from "./components/CreatePickupModal";
import RefundOrderModal from "./components/RefundOrderModal";
import CreateLabelModal from "./components/CreateLabelModal";
import { toTitleCase } from "../../utils/helper_functions";
import LinkLabelModal from "./components/LinkLabelModal";
import LinkExternalTrackingModal from "./components/LinkExternalTrackingModal";
import { useOrdersPage } from "./useOrdersPage";
import { showConfirm } from "../../slices/snackbarSlice";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { columnDefs, remoteApi, remoteFiltersApi, loading, remoteVersionRequirement, selectedRows, order } =
    useOrdersPage({ userId: null });

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Helmet>
        <title>{"Admin Orders | Glow LEDs"}</title>
      </Helmet>

      <GLTableV2
        remoteApi={remoteApi}
        remoteFiltersApi={remoteFiltersApi}
        remoteVersionRequirement={remoteVersionRequirement}
        remoteVersionRequirementType="orders/setRemoteVersionRequirement"
        tableName="Orders"
        searchPlaceholder="Search by ID, Name, Email, #code"
        colors={[...Object.values(orderExceptionStatusColors), ...Object.values(orderStatusColors)]}
        determineColor={determineOrderColors}
        namespaceScope="orders"
        namespace="orderTable"
        columnDefs={columnDefs}
        enableDropdownRow
        rowName="_id"
        dropdownComponent={row => (
          <OrderDropdown row={row} determineColor={determineOrderColors} colspan={columnDefs.length + 1} />
        )}
        loading={loading}
        enableRowSelect={true}
        titleActions={
          <div className="row g-10px ai-c">
            {selectedRows.length > 1 && (
              <GLAutocomplete
                value={order.status}
                variant="outlined"
                options={[
                  ...Object.keys(orderStatusColors),
                  "Set isPrioritized",
                  "Set isPaused",
                  "Set isUpdated",
                  "Set isPrintIssue",
                  "Set isRefunded",
                  "Set isReassured",
                  "Unset isPrioritized",
                  "Unset isPaused",
                  "Unset isUpdated",
                  "Unset isPrintIssue",
                  "Unset isRefunded",
                  "Unset isReassured",
                ]}
                optionDisplay={option => toTitleCase(option)}
                getOptionLabel={option => toTitleCase(option)}
                fullWidth
                isOptionEqualToValue={(option, value) => option === value}
                name="status"
                label="Batch Set Status"
                onChange={(e, value) => {
                  dispatch(
                    showConfirm({
                      title: "Confirm Status Update",
                      message: `Are you sure you want to Update Status on ${selectedRows.length} Orders?`,
                      onConfirm: () => {
                        dispatch(API.updateMultipleOrderStatus({ ids: selectedRows, status: value }));
                      },
                    })
                  );
                }}
              />
            )}
            <div className="row g-10px ai-c">
              {selectedRows.length > 1 && (
                <Button
                  color="secondary"
                  variant="contained"
                  onClick={() => {
                    dispatch(
                      showConfirm({
                        title: "Confirm Delete",
                        message: `Are you sure you want to Delete ${selectedRows.length} Orders?`,
                        onConfirm: () => {
                          dispatch(API.deleteMultipleOrders(selectedRows));
                        },
                      })
                    );
                  }}
                >
                  {"Delete Orders"}
                </Button>
              )}
              {selectedRows.length > 0 && (
                <Button color="secondary" variant="contained" onClick={() => dispatch(open_create_pickup_modal())}>
                  {"Create UPS Pickup"}
                </Button>
              )}
              <Button color="secondary" variant="contained" onClick={() => dispatch(openCreateLabelModal())}>
                {"Create Label"}
              </Button>
              <Button color="primary" variant="contained" onClick={() => dispatch(open_create_order_modal())}>
                {"Create Order"}
              </Button>
            </div>
          </div>
        }
      />

      <EditOrderModal />
      <ShippingModal />
      <CreatePickupModal />
      <RefundOrderModal />
      <CreateLabelModal />
      <LinkLabelModal />
      <LinkExternalTrackingModal />
    </Container>
  );
};
export default OrdersPage;
