/* eslint-disable max-lines-per-function */

import { createSlice } from "@reduxjs/toolkit";
import * as API from "../api";
import { printInvoice, printLabel } from "../pages/OrdersPage/ordersPageHelpers";

const shippingSlice = createSlice({
  name: "shippingPage",
  initialState: {
    loading_label: false,
    loading: false,
    invoice: "",
    label: "",
    shippingRates: [],
    shippingRate: {},
    linkLabelModal: false,
    externalTrackingModal: false,
    create_pickup_modal: false,
    createLabelModal: false,
    shipments: [],
    csvLabel: [],
    rate: {},
    hideLabelButton: true,
    selectedRateId: "",
    selectedShipmentId: "",
    shipmentId: "",
    parcel: { parcelChoice: {}, length: "", width: "", height: "", weight_pounds: "", weight_ounces: "" },

    toShipping: {
      first_name: "",
      last_name: "",
      address_1: "",
      address_2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      international: "",
      phone: "",
      email: "",
      company: "",
    },
    fromShipping: {
      first_name: "",
      last_name: "",
      address_1: "",
      address_2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      international: "",
      phone: "",
      email: "",
      company: "",
    },
    customs_info: {
      contents_type: "",
      restriction_type: "",
      non_delivery_option: "",
      customs_items: [],
    },
  },
  reducers: {
    clearPrints: (state, { payload }) => {
      state.invoice = "";
      state.label = "";
    },
    setToShipping: (state, { payload }) => {
      const updatedToShipping = payload;
      return {
        ...state,
        toShipping: { ...state.toShipping, ...updatedToShipping },
      };
    },

    setFromShipping: (state, { payload }) => {
      const updatedFromShipping = payload;
      return {
        ...state,
        fromShipping: { ...state.fromShipping, ...updatedFromShipping },
      };
    },
    setParcel: (state, { payload }) => {
      if (payload.parcelChoice) {
        return {
          ...state,
          parcel: {
            ...state.parcel,
            parcelChoice: payload.parcelChoice,
            length: payload.parcelChoice.length,
            width: payload.parcelChoice.width,
            height: payload.parcelChoice.height,
          },
        };
      } else {
        const packageDimmenisons = payload;
        return {
          ...state,
          parcel: { ...state.parcel, ...packageDimmenisons },
        };
      }
    },
    chooseShippingRate: (state, { payload }) => {
      const { rate, speed } = payload;
      state.hideLabelButton = false;
      state.shippingRate = rate;
      state.rate = { rate, speed };
    },
    openCreateLabelModal: (state, { payload }) => {
      state.createLabelModal = true;
    },
    closeCreateLabelModal: (state, { payload }) => {
      state.createLabelModal = false;
      state.selectedRateId = "";
      state.shipmentId = "";
      state.parcel = { parcelChoice: {}, length: "", width: "", height: "", weight_pounds: "", weight_ounces: "" };

      state.toShipping = {
        first_name: "",
        last_name: "",
        address_1: "",
        address_2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        international: "",
        phone: "",
        email: "",
        company: "",
      };
      state.fromShipping = {
        first_name: "",
        last_name: "",
        address_1: "",
        address_2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        international: "",
        phone: "",
        email: "",
        company: "",
      };
    },
    open_create_pickup_modal: (state, { payload }) => {
      state.create_pickup_modal = true;
    },
    close_create_pickup_modal: (state, { payload }) => {
      state.create_pickup_modal = false;
    },
    reChooseShippingRate: (state, { payload }) => {
      state.hideLabelButton = true;
      state.shippingRate = {};
    },
    setSelectedRateId: (state, { payload }) => {
      state.selectedRateId = payload;
    },
    resetRates: (state, { payload }) => {
      state.shippingRates = [];
      state.shipmentId = "";
      state.label = "";
      state.selectedRateId = "";
    },
    openLinkLabelModal: (state, { payload }) => {
      state.linkLabelModal = true;
    },
    closeLinkLabelModal: (state, { payload }) => {
      state.linkLabelModal = false;
      state.selectedShipmentId = "";
    },
    openExternalTrackingModal: (state, { payload }) => {
      state.externalTrackingModal = true;
    },
    closeExternalTrackingModal: (state, { payload }) => {
      state.externalTrackingModal = false;
    },
    setSelectedShipmentId: (state, { payload }) => {
      state.selectedShipmentId = payload;
    },
  },
  extraReducers: {
    [API.buyLabel.pending]: (state, { payload }) => {
      state.loading_label = true;
      state.invoice = "";
      state.label = "";
    },
    [API.buyLabel.fulfilled]: (state, { payload }) => {
      const { invoice, label } = payload;
      state.loading_label = false;
      state.invoice = invoice;
      state.label = label;
      printInvoice(invoice);
      printLabel(label);
      state.message = "Label Bought";
    },
    [API.buyLabel.rejected]: (state, { payload, error }) => {
      state.loading_label = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.createLabel.pending]: (state, { payload }) => {
      state.loading_label = true;
      state.invoice = "";
      state.label = "";
    },
    [API.createLabel.fulfilled]: (state, { payload }) => {
      const { invoice, label } = payload;
      state.loading_label = false;
      state.invoice = invoice;
      state.label = label;
      printInvoice(invoice);
      printLabel(label);
      state.message = "Label Bought";
    },
    [API.createLabel.rejected]: (state, { payload, error }) => {
      state.loading_label = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.initiateReturnExchange.pending]: (state, { payload }) => {
      state.loading_label = true;
      state.invoice = "";
      state.label = "";
    },
    [API.initiateReturnExchange.fulfilled]: (state, { payload }) => {
      const { label } = payload;
      state.loading_label = false;
      state.label = label;
      state.message = "Label Bought";
    },
    [API.initiateReturnExchange.rejected]: (state, { payload, error }) => {
      state.loading_label = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.createTracker.pending]: (state, { payload }) => {
      state.loading_label = true;
    },
    [API.createTracker.fulfilled]: (state, { payload }) => {
      state.loading_label = false;
    },
    [API.createTracker.rejected]: (state, { payload, error }) => {
      state.loading_label = false;
    },
    [API.createPickup.pending]: (state, { payload }) => {
      state.loading_label = true;
    },
    [API.createPickup.fulfilled]: (state, { payload }) => {
      state.loading_label = false;
      state.pickup = payload.pickup;
      state.orders = payload.orders;
    },
    [API.createPickup.rejected]: (state, { payload, error }) => {
      state.loading_label = false;
    },
    [API.confirmPickup.pending]: (state, { payload }) => {
      state.loading_label = true;
    },
    [API.confirmPickup.fulfilled]: (state, { payload }) => {
      state.loading_label = false;
      state.pickup = {};
      state.orders = {};
      state.create_pickup_modal = false;
    },
    [API.confirmPickup.rejected]: (state, { payload, error }) => {
      state.loading_label = false;
    },
    [API.generateCSVLabel.pending]: (state, { payload }) => {
      state.loading_label = true;
    },
    [API.generateCSVLabel.fulfilled]: (state, { payload }) => {
      state.loading_label = false;
      state.csvLabel = payload;
    },
    [API.generateCSVLabel.rejected]: (state, { payload, error }) => {
      state.loading_label = false;
    },
    [API.differentShippingRates.pending]: (state, { payload }) => {
      state.loading = true;
      state.shippingRates = [];
    },
    [API.differentShippingRates.fulfilled]: (state, { payload }) => {
      const { shipment } = payload;
      state.loading = false;
      state.success = true;
      state.shippingRates = shipment.rates;
      state.shipment_id = shipment.id;
      state.message = "Orders Transfered to New User";
    },
    [API.differentShippingRates.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.customShippingRates.pending]: (state, { payload }) => {
      state.loading = true;
      state.shippingRates = [];
    },
    [API.customShippingRates.fulfilled]: (state, { payload }) => {
      const { shipment } = payload;
      state.loading = false;
      state.success = true;
      state.shippingRates = shipment.rates;
      state.shipmentId = shipment.id;
      state.message = "Orders Transfered to New User";
    },
    [API.customShippingRates.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.createCustomLabel.pending]: (state, { payload }) => {
      state.loading = true;
      state.label = "";
    },
    [API.createCustomLabel.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.label = payload.postage_label.label_url;
      printLabel(payload.postage_label.label_url);
      state.message = "Label Bought";
    },
    [API.createCustomLabel.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.getShipments.pending]: (state, { payload }) => {
      state.loadingShipments = true;
      state.label = "";
    },
    [API.getShipments.fulfilled]: (state, { payload }) => {
      state.loadingShipments = false;
      state.linkLabelModal = true;
      state.shipments = payload.shipments;
    },
    [API.getShipments.rejected]: (state, { payload, error }) => {
      state.loadingShipments = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.linkExternalTracking.pending]: (state, { payload }) => {
      state.loading_label = true;
    },
    [API.linkExternalTracking.fulfilled]: (state, { payload }) => {
      state.loading_label = false;
      state.message = "External tracking linked successfully";
    },
    [API.linkExternalTracking.rejected]: (state, { payload, error }) => {
      state.loading_label = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
  },
});

export const {
  clearPrints,
  chooseShippingRate,
  reChooseShippingRate,
  open_create_pickup_modal,
  close_create_pickup_modal,
  openCreateLabelModal,
  closeCreateLabelModal,
  setToShipping,
  setFromShipping,
  setParcel,
  setSelectedRateId,
  resetRates,
  openLinkLabelModal,
  closeLinkLabelModal,
  openExternalTrackingModal,
  closeExternalTrackingModal,
  setSelectedShipmentId,
} = shippingSlice.actions;
export default shippingSlice.reducer;
