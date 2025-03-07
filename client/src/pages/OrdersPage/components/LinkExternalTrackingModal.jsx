import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import GLActionModal from "../../../shared/GlowLEDsComponents/GLActionModal/GLActionModal";
import * as API from "../../../api";
import { closeExternalTrackingModal } from "../../../slices/shippingSlice";
import { showConfirm } from "../../../slices/snackbarSlice";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

const carriers = [
  { id: "usps", name: "USPS" },
  { id: "ups", name: "UPS" },
  { id: "fedex", name: "FedEx" },
  { id: "dhl", name: "DHL" },
  { id: "dhl_express", name: "DHL Express" },
  { id: "amazon_logistics", name: "Amazon Logistics" },
  { id: "other", name: "Other" },
];

const LinkExternalTrackingModal = () => {
  const dispatch = useDispatch();
  const orderPage = useSelector(state => state.orders.orderPage);
  const { order } = orderPage;
  const shipping = useSelector(state => state.shipping.shippingPage);
  const { externalTrackingModal } = shipping;
  const userPage = useSelector(state => state.users.userPage);
  const { current_user } = userPage;

  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("usps");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrackingChange = e => {
    setTrackingNumber(e.target.value);
  };

  const handleCarrierChange = e => {
    setCarrier(e.target.value);
  };

  const handleSubmit = () => {
    if (!trackingNumber.trim()) {
      return;
    }

    setIsSubmitting(true);
    dispatch(
      showConfirm({
        title: "Are you sure you want to link this external tracking number?",
        inputLabel: "Describe why you made this change to the order",
        onConfirm: inputText => {
          dispatch(
            API.linkExternalTracking({
              order_id: order._id,
              tracking_code: trackingNumber,
              carrier: carrier,
              notes: inputText,
              current_user,
            })
          )
            .then(() => {
              dispatch(closeExternalTrackingModal());
              setIsSubmitting(false);
              setTrackingNumber("");
              setCarrier("usps");
            })
            .catch(error => {
              setIsSubmitting(false);
              // Handle error silently but still show on console
              console.error("Error linking external tracking:", error);
            });
        },
        onCancel: () => {
          setIsSubmitting(false);
        },
      })
    );
  };

  return (
    <div>
      <GLActionModal
        isOpen={externalTrackingModal}
        onConfirm={handleSubmit}
        onCancel={() => {
          dispatch(closeExternalTrackingModal());
          setTrackingNumber("");
          setCarrier("usps");
        }}
        confirmDisabled={!trackingNumber.trim() || isSubmitting}
        title="Link External Tracking"
        confirmLabel="Save"
        confirmColor="primary"
        cancelLabel="Cancel"
        cancelColor="secondary"
        disableEscapeKeyDown
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body1" gutterBottom>
              {
                "Link an external tracking number to this order. This will allow you to track shipments created outside of EasyPost."
              }
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Tracking Number"
              variant="outlined"
              fullWidth
              value={trackingNumber}
              onChange={handleTrackingChange}
              required
              autoFocus
              placeholder="Enter tracking number"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="carrier-select-label">{"Carrier"}</InputLabel>
              <Select
                labelId="carrier-select-label"
                id="carrier-select"
                value={carrier}
                onChange={handleCarrierChange}
                label="Carrier"
              >
                {carriers.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </GLActionModal>
    </div>
  );
};

export default LinkExternalTrackingModal;
