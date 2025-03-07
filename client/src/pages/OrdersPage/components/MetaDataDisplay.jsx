import { determine_tracking_link } from "../ordersPageHelpers";
import { useDispatch } from "react-redux";
import { API_Emails } from "../../../utils";
import { toCapitalize } from "../../../utils/helper_functions";
import { set_loading_label } from "../../../slices/orderSlice";
import config from "../../../config";
import * as API from "../../../api";

import { applySearch } from "../../../shared/GlowLEDsComponents/GLTableV2/actions/actions";
import { formatDate } from "../../../utils/helpers/universal_helpers";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

const MetaDataDisplay = ({ row }) => {
  const dispatch = useDispatch();
  const send_order_status_email = async (status, message_to_user) => {
    dispatch(set_loading_label(true));
    await API_Emails.send_order_status_email(
      row,
      "Your Order has been " + toCapitalize(status) + "!",
      row.shipping.email,
      status,
      message_to_user
    );
    dispatch(API.saveOrder({ ...row, isUpdated: false }));
    dispatch(set_loading_label(false));
  };

  const send_order_email = async () => {
    try {
      dispatch(set_loading_label(true));
      await API_Emails.send_order_email(row, "Thank you for your Glow LEDs Order", row.shipping.email);
      const has_ticket = row.orderItems.some(item => item.itemType === "ticket");
      if (has_ticket) {
        dispatch(
          API.sendTicketEmail({
            order: row,
            subject: "New Order Created by " + row.shipping.first_name,
            email: config.VITE_INFO_EMAIL,
          })
        );
      }
      dispatch(set_loading_label(false));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error sending order email:", error);
    }
  };
  const send_ticket_email = async () => {
    dispatch(set_loading_label(true));
    const has_ticket = row.orderItems.some(item => item.itemType === "ticket");
    if (has_ticket) {
      dispatch(
        API.sendTicketEmail({
          order: row,
          subject: "New Order Created by " + row.shipping.first_name,
          email: row.shipping.email,
        })
      );
    }
    dispatch(set_loading_label(false));
  };

  const send_refund_email = async () => {
    dispatch(set_loading_label(true));
    await API_Emails.send_refund_email(row, "Refund Successful", row.shipping.email, true);

    dispatch(set_loading_label(false));
  };
  const totalRefundAmount = row?.payment?.refund ? row?.payment?.refund?.reduce((a, c) => a + c.amount, 0) / 100 : 0;
  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <h3 className="fs-20px mv-5px">{"Meta Data"}</h3>
      </Grid>
      <Grid item container xs={12} alignItems="center" justifyContent="space-between">
        <Typography component="label" className="mv-0px mr-5px">
          {"ID #:"}
        </Typography>
        <Typography component="label" className=" mv-0px">
          {row._id}
        </Typography>
      </Grid>
      <Grid item container xs={12} alignItems="center" justifyContent="space-between">
        <Typography component="label" className="mv-0px mr-5px">
          {"Payment Method:"}
        </Typography>
        <Typography component="label" className=" mv-0px">
          {row?.payment?.paymentMethod}
        </Typography>
      </Grid>

      {/* Promo Code Display - showing both legacy string and new record link */}
      <Grid item container xs={12} alignItems="center" justifyContent="space-between">
        <Typography component="label" className="mv-0px mr-5px">
          {"Promo Code:"}
        </Typography>
        <Typography component="label" className=" mv-0px">
          {row.promo_code && row?.promo_code?.toUpperCase()}
          {!row.promo_code && row.promo && row.promo?.code?.toUpperCase()}
        </Typography>
      </Grid>

      {/* Gift Cards Display */}
      {row.giftCards && row.giftCards.length > 0 && (
        <Grid item xs={12}>
          <Typography component="label" className="mv-0px mr-5px">
            {"Gift Cards:"}
          </Typography>
          {row.giftCards.map((giftCard, index) => (
            <Grid item container key={index} xs={12} alignItems="center" justifyContent="space-between" sx={{ pl: 2 }}>
              <Typography component="label" className="mv-0px mr-5px">
                {giftCard.code}
                {":"}
              </Typography>
              <Typography component="label" className="mv-0px">
                {"$"}
                {(giftCard.amountUsed / 100).toFixed(2)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      )}

      <Grid item container xs={12} alignItems="center" justifyContent="space-between">
        <Typography component="label" className="mv-0px mr-5px">
          {"Total Price Paid:"}
        </Typography>
        <Typography component="label" className=" mv-0px">
          {"$"}
          {(row?.payment?.charge?.amount / 100)?.toFixed(2)}
        </Typography>
      </Grid>
      <Grid item container xs={12} alignItems="center" justifyContent="space-between">
        <Typography component="label" className="mv-0px mr-5px">
          {"Total Price:"}
        </Typography>
        <Typography component="label" className=" mv-0px">
          {"$"}
          {row.totalPrice?.toFixed(2)}
        </Typography>
      </Grid>

      <Grid item container xs={12} alignItems="center" justifyContent="space-between">
        <Typography component="label" className="mv-0px mr-5px">
          {"Outstanding Balance:"}
        </Typography>
        <Typography component="label" className=" mv-0px">
          {"$"}
          {(row?.payment?.charge?.amount / 100 - row.totalPrice)?.toFixed(2)}
        </Typography>
      </Grid>
      <Grid item container xs={12} alignItems="center" justifyContent="space-between">
        <Typography component="label" className="mv-0px mr-5px">
          {"Total Refund:"}
        </Typography>
        <Typography component="label" className=" mv-0px">
          {"$"}
          {totalRefundAmount?.toFixed(2)}
        </Typography>
      </Grid>

      {row.hasPreOrderItems && (
        <Grid item container xs={12} alignItems="center" justifyContent="space-between">
          <Typography component="label" className="mv-0px mr-5px">
            {"Pre-Order Shipping Date:"}
          </Typography>
          <Typography component="label" className=" mv-0px">
            {formatDate(row.preOrderShippingDate)}
          </Typography>
        </Grid>
      )}

      {row.tracking_number && (
        <Grid item container xs={12} alignItems="center" justifyContent="space-between">
          <Typography component="label" className="mv-0px mr-5px">
            {"Tracking #:"}
          </Typography>
          <Typography component="label" className=" mv-0px">
            <a
              href={row.tracking_url ? row.tracking_url : determine_tracking_link(row.tracking_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="mv-2rem"
              style={{
                textDecoration: "underline",
                color: "white",
              }}
            >
              {row.tracking_number}
            </a>
          </Typography>
        </Grid>
      )}
      {row.return_tracking_number && (
        <Grid item container xs={12} alignItems="center" justifyContent="space-between">
          <Typography component="label" className="mv-0px mr-5px">
            {"Return Tracking #:"}{" "}
          </Typography>
          <Typography component="label" className=" mv-0px">
            <a
              href={
                row.return_tracking_url ? row.return_tracking_url : determine_tracking_link(row.return_tracking_number)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mv-2rem"
              style={{
                textDecoration: "underline",
                color: "white",
              }}
            >
              {row.return_tracking_number}
            </a>
          </Typography>
        </Grid>
      )}
      {row.splitOrder && (
        <Grid item xs={12}>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            onClick={() => dispatch(applySearch("orderTable", row.splitOrder))}
          >
            {"Go to Split Order"}
          </Button>
        </Grid>
      )}
      <Grid item xs={12}>
        <Button color="secondary" variant="contained" fullWidth onClick={() => send_order_email()}>
          {"Send Order Email"}
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Button color="secondary" variant="contained" fullWidth onClick={() => send_ticket_email()}>
          {"Send Ticket Email"}
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Button color="secondary" variant="contained" fullWidth onClick={() => send_order_status_email("updated")}>
          {"Send Update Order Email"}
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Button color="secondary" variant="contained" fullWidth onClick={() => send_refund_email()}>
          {"Send Refund Email"}
        </Button>
      </Grid>
    </Grid>
  );
};

export default MetaDataDisplay;
