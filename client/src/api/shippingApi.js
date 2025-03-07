/* eslint-disable consistent-return */
import { createAsyncThunk } from "@reduxjs/toolkit";

import axios from "axios";

import { errorMessage } from "../helpers/sharedHelpers";
import { showError, showSuccess } from "../slices/snackbarSlice";

export const buyLabel = createAsyncThunk("shipping/buyLabel", async ({ orderId }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await axios.put(`/api/shipping/${orderId}/buy_label`, {});
    dispatch(showSuccess({ message: `Label Purchased` }));
    return data;
  } catch (error) {
    dispatch(showError({ message: errorMessage(error) }));
    return rejectWithValue(error.response?.data);
  }
});

export const createLabel = createAsyncThunk(
  "shipping/createLabel",
  async ({ orderId, speed }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/${orderId}/create_label/${speed}`, {});
      dispatch(showSuccess({ message: `Label Purchased` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createCustomLabel = createAsyncThunk(
  "shipping/createCustomLabel",
  async ({ selectedRateId, shipmentId }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/create_custom_label`, { selectedRateId, shipmentId });
      dispatch(showSuccess({ message: `Label Purchased` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getShipments = createAsyncThunk(
  "shipping/getShipments",
  async (_params, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.get(`/api/shipping/shipments`);
      dispatch(showSuccess({ message: `Shipments Found` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);
export const createTracker = createAsyncThunk(
  "shipping/createTracker",
  async ({ orderId }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/${orderId}/create_tracker`, {});
      dispatch(showSuccess({ message: `Order Linked to Tracker` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);
export const initiateReturnExchange = createAsyncThunk(
  "shipping/initiateReturnExchange",
  async ({ orderId, returnToHeadquarters, returnItems, exchangeItems }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(
        `/api/shipping/${orderId}/initiate_return_exchange?return_to_headquarters=${
          returnToHeadquarters ? "true" : "false"
        }`,
        { returnItems, exchangeItems }
      );
      dispatch(showSuccess({ message: `Return/Exchange Initiated` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const shippingRates = createAsyncThunk(
  "shipping/shippingRates",
  async ({ order, splitOrder }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/shipping_rates`, { order, splitOrder });
      return { data, splitOrder };
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const customShippingRates = createAsyncThunk(
  "shipping/customShippingRates",
  async ({ toShipping, fromShipping, parcel }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/custom_shipping_rates`, { toShipping, fromShipping, parcel });
      dispatch(showSuccess({ message: `Custom Shipping Rates Found` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const refundLabel = createAsyncThunk(
  "shipping/refundLabel",
  async ({ orderId, isReturnTracking }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/${orderId}/refund_label/${isReturnTracking}`);
      dispatch(showSuccess({ message: `Return Label Created` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const generateCSVLabel = createAsyncThunk(
  "shipping/generateCSVLabel",
  async ({ orderId }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/${orderId}/generate_csv_label`);
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createPickup = createAsyncThunk(
  "shipping/createPickup",
  async ({ readyTime, latestTimeAvailable, orderIds }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/create_pickup`, { readyTime, latestTimeAvailable, orderIds });
      dispatch(showSuccess({ message: `Pickup Rates Found` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);
export const confirmPickup = createAsyncThunk(
  "shipping/confirmPickup",
  async ({ pickupId, rateId, orders }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/confirm_pickup`, { pickupId, rateId, orders });
      dispatch(showSuccess({ message: `Pickup Confirmed` }));

      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const differentShippingRates = createAsyncThunk(
  "shipping/differentShippingRates",
  async (order, { dispatch, rejectWithValue }) => {
    try {
      if (order.shipping.shipment_id && !order.shipping.shipping_label) {
        const { data } = await axios.get(
          `/api/shipping/${order._id}/different_shipping_rates/${order.shipping.shipment_id}`
        );
        dispatch(
          showSuccess({
            message: `New Shipping Rates Found`,
          })
        );
        return data;
      } else {
        const { data } = await axios.put(`/api/shipping/shipping_rates`, { order });
        return data;
      }
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const linkExternalTracking = createAsyncThunk(
  "shipping/linkExternalTracking",
  async ({ order_id, tracking_code, carrier, notes }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/shipping/${order_id}/link_external_tracking`, {
        tracking_code,
        carrier,
        notes,
      });
      dispatch(showSuccess({ message: `External tracking linked successfully` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);
