import React, { useEffect } from "react";
import { state_names } from "../../../utils/helper_functions";
import { Loading } from "../../../shared/SharedComponents";
import { ShippingChoice } from ".";
import { useDispatch, useSelector } from "react-redux";
import { validate_shipping } from "../../../utils/validations";
import useWindowDimensions from "../../../shared/Hooks/useWindowDimensions";
import { isMobile } from "react-device-detect";
import ReactGoogleAutocomplete from "./ReactGoogleAutocomplete";
import { GLAutocomplete, GLButton } from "../../../shared/GlowLEDsComponents";
import GLTooltip from "../../../shared/GlowLEDsComponents/GLTooltip/GLTooltip";

import { save_shipping, updateGoogleShipping } from "../../../slices/cartSlice";
import * as API from "../../../api";
import config from "../../../config";
import {
  set_hide_pay_button,
  set_show_shipping,
  set_shipping_completed,
  showHideSteps,
  setShippingValidation,
  setLoadingShipping,
  setFreeShipping,
  setTaxPrice,
  setModalText,
  openSaveShippingModal,
  closeSaveShippingModal,
  setShippingSaved,
  nextStep,
  setEmailValidations,
  clearShippingRates,
  activatePromo,
  set_promo_code,
  set_promo_code_validations,
  set_shipping_choice,
  setSplitOrder,
  closeSplitOrderModal,
  openSplitOrderModal,
} from "../placeOrderSlice";

import GLActionModal from "../../../shared/GlowLEDsComponents/GLActionModal/GLActionModal";
import { getHasNonPreOrderItems, getHasPreOrderItems, hasActiveSaleItems } from "../placeOrderHelpers";
import GLButtonV2 from "../../../shared/GlowLEDsComponents/GLButtonV2/GLButtonV2";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";

const ShippingStep = () => {
  const { width } = useWindowDimensions();
  const all_shipping = API.useGetAllShippingOrdersQuery();
  const cartPage = useSelector(state => state.carts.cartPage);
  const { my_cart, shipping, payment } = cartPage;
  const { cartItems } = my_cart;

  const placeOrder = useSelector(state => state.placeOrder);
  const {
    hide_pay_button,
    show_shipping,
    show_payment,
    shipping_completed,
    shipping_choice,
    itemsPrice,
    loadingShipping,
    show_shipping_complete,
    promo_code,
    shippingPrice,
    activePromoCodeIndicator,
    taxPrice,
    totalPrice,
    tip,
    order_note,
    production_note,
    showSaveShippingModal,
    shippingSaved,
    shippingValidations,
    modalText,
    showSplitOrderModal,
    tax_rate,
  } = placeOrder;

  const hasPreOrderItems = getHasPreOrderItems(cartItems);
  const hasNonPreOrderItems = getHasNonPreOrderItems(cartItems);

  const {
    first_name: first_name_validations,
    last_name: last_name_validations,
    address_1: address_validations,
    city: city_validations,
    state: state_validations,
    postal_code: postal_code_validations,
    phone_number: phone_number_validations,
    country: country_validations,
  } = shippingValidations;

  const dispatch = useDispatch();

  const userPage = useSelector(state => state.users.userPage);
  const { current_user } = userPage;

  useEffect(() => {
    dispatch(set_hide_pay_button(true));
  }, []);

  useEffect(() => {
    let clean = true;
    if (clean) {
      if (shipping && shipping.first_name && shipping.first_name.length > 1) {
        dispatch(save_shipping(shipping));
      }
    }
    return () => (clean = false);
  }, []);

  const validateShipping = e => {
    e.preventDefault();

    const data = {
      ...shipping,
      email: shipping.email ? shipping.email : current_user.email,
    };

    const request = validate_shipping(data);
    if (Object.keys(request?.errors).length > 0) {
      dispatch(setShippingValidation({ errors: request.errors }));
      return;
    }

    if (request.isValid) {
      const normalizedCurrentUserShipping = normalizeAddress(
        { ...current_user?.shipping, email: current_user?.email } || {}
      );
      const normalizedNewShipping = normalizeAddress(shipping || {});
      if (current_user?.shipping && normalizedCurrentUserShipping !== normalizedNewShipping && !shippingSaved) {
        if (current_user?.shipping) {
          dispatch(setModalText("Your address is different from your saved one. Would you like to update it?"));
        } else {
          dispatch(setModalText("Would you like to save your address for future use?"));
        }
        dispatch(openSaveShippingModal(true)); // Open the modal
        return;
      } else {
        if (hasPreOrderItems && hasNonPreOrderItems) {
          dispatch(openSplitOrderModal());
        } else {
          submitShipping();
        }
      }
    }
  };
  const normalizeAddress = address => {
    return JSON.stringify(address).toLowerCase().replace(/\s/g, "");
  };

  const submitShipping = (splitOrder = false) => {
    dispatch(clearShippingRates());

    if (shipping && Object.keys(shipping).length > 0) {
      dispatch(setLoadingShipping(true));
      const hasItemsWithDimensions = cartItems.some(item => item.dimensions && item.dimensions.package_volume > 0);

      if (!hasItemsWithDimensions) {
        dispatch(setFreeShipping());
        dispatch(set_show_shipping(false));
        dispatch(set_shipping_choice(false));
        dispatch(set_shipping_completed(true));
        dispatch(nextStep("payment"));
      } else {
        if (shipping?.hasOwnProperty("address_1") && shipping.address_1.length > 0 && shipping_completed) {
          get_shipping_rates(splitOrder);
        }
      }
      if (shipping.international) {
        dispatch(setTaxPrice(0));
      } else {
        dispatch(API.getTaxRates({ shipping, itemsPrice }));
      }
    }
    dispatch(set_show_shipping(false));
    dispatch(set_shipping_completed(true));
    isMobile && window.scrollTo({ top: 340, behavior: "smooth" });
    dispatch(setShippingSaved(false));
  };

  const get_shipping_rates = async splitOrder => {
    const order = {
      orderItems: cartItems,
      shipping,
      payment,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      current_user,
      tip,
      order_note,
      production_note,
      promo_code: activePromoCodeIndicator && promo_code,
    };

    dispatch(API.shippingRates({ order, splitOrder }));
  };

  const next_step = async step => {
    dispatch(nextStep(step));
    const promo_code_storage = sessionStorage.getItem("promo_code");
    if (promo_code_storage && promo_code_storage.length > 0) {
      dispatch(set_promo_code(promo_code_storage.toUpperCase()));

      const request = await dispatch(
        API.validatePromoCode({ promo_code: promo_code_storage.toUpperCase(), current_user, cartItems, shipping })
      );

      const hasSaleItems = hasActiveSaleItems(cartItems);

      if (request.payload.isValid) {
        // if (!hasSaleItems) {
        dispatch(
          activatePromo({
            cartItems,
            tax_rate,
            activePromoCodeIndicator,
            current_user,
            validPromo: request.payload.promo,
          })
        );
        // }
      } else {
        dispatch(set_promo_code_validations(request.payload.errors.promo_code));
        dispatch(set_promo_code(""));
      }
    }

    if (step === "shipping" && shipping.email.length === 0) {
      dispatch(setEmailValidations("Email Field Empty"));
    }

    if (isMobile) {
      const scrollTo = step === "shipping" ? 340 : 560;
      window.scrollTo({ top: scrollTo, behavior: "smooth" });
    }
  };

  const calculateEstimatedShippingTime = () => {
    const today = new Date();

    if (placeOrder.splitOrder) {
      const inStockItems = cartItems.filter(item => !item.isPreOrder && item.itemType === "product");
      const preOrderItems = cartItems.filter(item => item.isPreOrder && item.itemType === "product");

      const inStockEstimate = Math.max(...inStockItems.map(item => item.processing_time[1]));

      const preOrderReleaseDate = new Date(Math.max(...preOrderItems.map(item => new Date(item.preOrderReleaseDate))));
      const daysUntilRelease = Math.ceil((preOrderReleaseDate - today) / (1000 * 60 * 60 * 24));
      const preOrderEstimate =
        Math.max(0, daysUntilRelease) + Math.max(...preOrderItems.map(item => item.processing_time[1]));

      return {
        inStock: inStockEstimate,
        preOrder: preOrderEstimate,
      };
    } else {
      const maxProcessingTime = Math.max(
        ...cartItems.filter(item => item.itemType === "product").map(item => item.processing_time[1])
      );

      // Only calculate preorder release date if there are preorder items
      const preOrderItems = cartItems.filter(item => item.isPreOrder);
      if (preOrderItems.length === 0) {
        return maxProcessingTime;
      }

      const preOrderReleaseDate = new Date(Math.max(...preOrderItems.map(item => new Date(item.preOrderReleaseDate))));

      const daysUntilRelease = Math.ceil((preOrderReleaseDate - today) / (1000 * 60 * 60 * 24));
      return Math.max(0, daysUntilRelease) + maxProcessingTime;
    }
  };

  return (
    <div>
      <div className="jc-b mt-10px">
        <Typography variant="h4">{"2. Shipping"}</Typography>
        {shipping_completed && !show_shipping && (
          <GLButtonV2
            variant="contained"
            className="mv-10px"
            color="secondary"
            onClick={() => dispatch(showHideSteps("shipping"))}
          >
            {"Edit"}
          </GLButtonV2>
        )}
      </div>
      {shipping_completed && (
        <div className="mt-20px">
          {show_shipping ? (
            <>
              <ul className={`shipping-container mv-0px pv-0px ${width > 400 ? "" : "p-0px"}`}>
                {current_user && current_user.shipping && current_user.shipping.hasOwnProperty("first_name") && (
                  <li>
                    <GLButton onClick={e => dispatch(save_shipping({ ...current_user.shipping }))} variant="primary">
                      {"Use Saved Shipping"}
                    </GLButton>
                  </li>
                )}
                {current_user?.isAdmin && (
                  <GLAutocomplete
                    margin="normal"
                    value={shipping}
                    variant="filled"
                    loading={!all_shipping.isLoading}
                    options={all_shipping.isLoading ? [] : all_shipping.data}
                    getOptionLabel={option => (option ? `${option.first_name} ${option.last_name}` : "")}
                    optionDisplay={option => (option ? `${option.first_name} ${option.last_name}` : "")}
                    isOptionEqualToValue={(option, value) => option.uniqueKey === value.uniqueKey}
                    name="product"
                    label="Choose Shipping"
                    onChange={(event, newValue) => {
                      if (newValue) {
                        const stateShortName = state_names.find(
                          state => state.long_name === newValue.state || state.short_name === newValue.state
                        )?.short_name;

                        dispatch(
                          save_shipping({
                            ...newValue,
                            state: stateShortName,
                          })
                        );
                      }
                    }}
                  />
                )}

                <li>
                  <div className="jc-b">
                    <div className="mr-5px w-50per">
                      <label htmlFor="first_name">{"First Name"}</label>
                      <input
                        type="text"
                        className="w-100per"
                        value={shipping.first_name}
                        name="first_name"
                        id="first_name"
                        onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                      />

                      <div
                        className="validation_text"
                        style={{
                          justifyContent: "center",
                        }}
                      >
                        {first_name_validations}
                      </div>
                    </div>
                    <div className="ml-5px w-50per">
                      <label htmlFor="last_name">{"Last Name"}</label>
                      <input
                        type="text"
                        className="w-100per"
                        value={shipping.last_name}
                        name="last_name"
                        id="last_name"
                        onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                      />

                      <div
                        className="validation_text"
                        style={{
                          justifyContent: "center",
                        }}
                      >
                        {last_name_validations}
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <label htmlFor="address_autocomplete">{"Address"}</label>
                  <ReactGoogleAutocomplete
                    apiKey={config.VITE_GOOGLE_PLACES_KEY}
                    className="fs-16px"
                    name="address_1"
                    value={shipping.address_1}
                    options={{
                      types: ["address"],
                    }}
                    onPlaceSelected={place => {
                      let autocompleteElement = document.querySelector("#autocomplete");
                      const street_num = autocompleteElement ? autocompleteElement.value : "";

                      const payload = {
                        shipping: place,
                        street_num,
                      };

                      dispatch(updateGoogleShipping(payload));
                    }}
                    onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                  />
                </li>
                <div
                  className="validation_text"
                  style={{
                    justifyContent: "center",
                  }}
                >
                  {address_validations}
                </div>
                <li>
                  <label htmlFor="address_2">{"Apt/Suite"}</label>
                  <input
                    type="text"
                    value={shipping.address_2}
                    name="address_2"
                    id="address_2"
                    onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                  />
                </li>
                <li>
                  <label htmlFor="city">{"City"}</label>
                  <input
                    type="text"
                    value={shipping.city}
                    name="city"
                    id="city"
                    onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                  />
                </li>
                <div
                  className="validation_text"
                  style={{
                    justifyContent: "center",
                  }}
                >
                  {city_validations}
                </div>
                {!shipping.international && (
                  <li>
                    <label className="mb-1rem" htmlFor="state">
                      {"State"}
                    </label>
                    <div className="ai-c h-25px mb-15px jc-c">
                      <div className="custom-select w-100per">
                        <select
                          className="qty_select_dropdown w-100per"
                          onChange={e => dispatch(save_shipping({ ...shipping, state: e.target.value }))}
                          value={shipping.state}
                        >
                          {state_names.map((state, index) => (
                            <option key={index} value={state.short_name}>
                              {state.long_name}
                            </option>
                          ))}
                        </select>
                        <span className="custom-arrow" />
                      </div>
                    </div>
                  </li>
                )}
                {shipping.international && (
                  <li>
                    <label htmlFor="state">{"State"}</label>
                    <input
                      type="text"
                      value={shipping.state}
                      name="state"
                      id="state"
                      onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                    />
                  </li>
                )}
                <div
                  className="validation_text"
                  style={{
                    justifyContent: "center",
                  }}
                >
                  {state_validations}
                </div>
                <li>
                  <label htmlFor="postalCode">{"Postal Code"}</label>
                  <input
                    type="text"
                    value={shipping.postalCode}
                    name="postalCode"
                    id="postalCode"
                    onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                  />
                </li>
                <div
                  className="validation_text"
                  style={{
                    justifyContent: "center",
                  }}
                >
                  {postal_code_validations}
                </div>
                <div>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="large"
                        name="international"
                        defaultChecked={shipping.international}
                        onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.checked }))}
                      />
                    }
                    label="International"
                  />

                  {shipping.international && (
                    <>
                      <li>
                        <label htmlFor="country">{"Country"}</label>
                        <input
                          type="text"
                          value={shipping.country}
                          name="country"
                          id="country"
                          onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                        />
                      </li>
                      <div
                        className="validation_text"
                        style={{
                          justifyContent: "center",
                        }}
                      >
                        {country_validations}
                      </div>
                    </>
                  )}
                  {shipping.international && (
                    <>
                      <li>
                        <label htmlFor="phone_number">{"Phone Number"}</label>
                        <input
                          type="text"
                          value={shipping.phone_number}
                          name="phone_number"
                          id="phone_number"
                          onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                        />
                      </li>
                      <div
                        className="validation_text"
                        style={{
                          justifyContent: "center",
                        }}
                      >
                        {phone_number_validations}
                      </div>
                    </>
                  )}
                  <li>
                    <label htmlFor="handling_instructions">{"Special DeliveryInstructions"}</label>
                    <input
                      type="text"
                      value={shipping.handling_instructions}
                      name="handling_instructions"
                      placeholder="Door Code, Leave on Porch, etc."
                      id="handling_instructions"
                      onChange={e => dispatch(save_shipping({ ...shipping, [e.target.name]: e.target.value }))}
                    />
                  </li>
                </div>

                <li>
                  <GLButton onClick={validateShipping} variant="primary" className="bob">
                    {"Continue"}
                  </GLButton>
                </li>
              </ul>
            </>
          ) : (
            <div className="wrap jc-b w-100per pos-rel mt-20px">
              {shipping && shipping.hasOwnProperty("first_name") && (
                <div className="paragraph_font lh-25px mb-10px">
                  <div>
                    {shipping.first_name} {shipping.last_name}
                  </div>
                  <div>
                    {shipping.address_1} {shipping.address_2}
                  </div>
                  <div>
                    {shipping.city}
                    {", "}
                    {shipping.state} {shipping.postalCode}
                    {", "}
                    {shipping.country}
                  </div>
                  <div>{shipping?.phone_number}</div>
                  <div>{shipping.international && "International"}</div>
                </div>
              )}

              <Loading loading={loadingShipping} />

              {shipping_choice && (
                <>
                  <ShippingChoice />
                  {cartItems.some(item => item.processing_time) && (
                    <>
                      {placeOrder.splitOrder ? (
                        <>
                          <Typography variant="subtitle2" className="mb-0px mt-0px">
                            {"Estimated Time to Ship (In-Stock Items): "}
                            {calculateEstimatedShippingTime().inStock} {"business"}
                            {"days"}
                          </Typography>
                          <Typography variant="subtitle2" className="mb-0px mt-0px">
                            {"Estimated Time to Ship (Pre-Order Items): "}
                            {calculateEstimatedShippingTime().preOrder} {"business days"}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="subtitle2" className="mb-0px mt-0px">
                          {"Estimated Time to Ship: "}
                          {calculateEstimatedShippingTime()} {"business days"}
                        </Typography>
                      )}
                    </>
                  )}
                </>
              )}
              {!show_payment && (
                <GLTooltip
                  tooltip={
                    !show_shipping_complete && !hide_pay_button && "You must select shipping speed before continuing"
                  }
                  className="w-100per"
                >
                  <GLButton
                    type="submit"
                    variant={!show_shipping_complete && !hide_pay_button ? "disabled" : "primary"}
                    id="open-modal"
                    className={`${show_shipping_complete && !hide_pay_button ? "bob" : "disabled"} mt-10px w-100per`}
                    onClick={() => {
                      if (show_shipping_complete && !hide_pay_button) {
                        next_step("payment");
                      }
                    }}
                  >
                    {"Continue"}
                  </GLButton>
                </GLTooltip>
              )}
            </div>
          )}
        </div>
      )}
      {width < 400 && <hr />}
      <GLActionModal
        isOpen={showSaveShippingModal}
        onConfirm={() => {
          dispatch(
            API.saveUser({
              user: {
                ...current_user,
                shipping: {
                  ...shipping,
                  email: current_user.email,
                  country: shipping.international ? shipping.country : "US",
                },
              },
              profile: true,
            })
          );
          dispatch(closeSaveShippingModal(false));
          if (hasPreOrderItems && hasNonPreOrderItems) {
            dispatch(openSplitOrderModal());
          } else {
            submitShipping();
          }
        }}
        onCancel={() => {
          submitShipping();
          dispatch(closeSaveShippingModal(false));
        }}
        title="Save Shipping Address"
        confirmLabel="Save Shipping"
        confirmColor="primary"
        cancelLabel="Continue without Saving Shipping"
        cancelColor="secondary"
        disableEscapeKeyDown
      >
        <p>{modalText}</p>
        <p>
          <strong>{"Note"}</strong>
          {": You can change your saved address later from your profile page"}
        </p>
      </GLActionModal>
      <GLActionModal
        isOpen={showSplitOrderModal}
        onConfirm={() => {
          dispatch(setSplitOrder(true));
          dispatch(closeSplitOrderModal(false));
          submitShipping(true);
        }}
        onCancel={() => {
          dispatch(setSplitOrder(false));
          dispatch(closeSplitOrderModal(false));
          submitShipping();
        }}
        title="Your order contains both pre-order and in-stock items."
        confirmLabel="Yes, split my order"
        confirmColor="primary"
        cancelLabel="No, ship everything together"
        cancelColor="secondary"
        disableEscapeKeyDown
      >
        <p>{"Would you like to receive your in-stock items first and pre-order items later?"}</p>
        <p>
          <strong>{"Note"}</strong>
          {": If you split your order, you must pay for shipping twice."}
        </p>
      </GLActionModal>
    </div>
  );
};

export default ShippingStep;
