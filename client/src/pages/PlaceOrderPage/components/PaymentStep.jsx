import { GLAutocomplete, GLButton } from "../../../shared/GlowLEDsComponents";
import useWindowDimensions from "../../../shared/Hooks/useWindowDimensions";
import {
  set_order_note,
  set_production_note,
  set_promo_code,
  set_tip,
  set_create_account,
  set_new_password,
  set_paid,
  set_paymentMethod,
  showHideSteps,
  removePromo,
  activatePromo,
  setLoadingPayment,
  set_user,
  set_promo_code_validations,
} from "../placeOrderSlice";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

import StripeCheckout from "./StripeCheckout/StripeCheckout";
import { determineCartTotal } from "../../../utils/helper_functions";
import * as API from "../../../api";
import { useNavigate } from "react-router-dom";
import { Loading } from "../../../shared/SharedComponents";
import { getHasPreOrderItems, getPreOrderReleaseDate, hasActiveSaleItems } from "../placeOrderHelpers";
import GLButtonV2 from "../../../shared/GlowLEDsComponents/GLButtonV2/GLButtonV2";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Sell from "@mui/icons-material/Sell";
import Typography from "@mui/material/Typography";

const PaymentStep = () => {
  const navigate = useNavigate();
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();

  const cartPage = useSelector(state => state.carts.cartPage);
  const { my_cart, shipping, payment } = cartPage;
  const { cartItems } = my_cart;

  const userPage = useSelector(state => state.users.userPage);
  const { current_user, users } = userPage;

  const items_price = determineCartTotal(cartItems);

  const placeOrder = useSelector(state => state.placeOrder);
  const {
    payment_completed,
    show_promo_code,
    promo_code_validations,
    create_account,
    password_validations,
    previousShippingPrice,
    shipment_id,
    shipping_rate,
    parcel,
    show_payment,
    shippingPrice,
    promo_code,
    itemsPrice,
    taxPrice,
    totalPrice,
    user,
    tip,
    paid,
    loading_tax_rates,
    order_note,
    tax_rate,
    activePromoCodeIndicator,
    production_note,
    new_password,
    splitOrder,
    preOrderShippingPrice,
    nonPreOrderShippingPrice,
    giftCardAmount,
    giftCardCode,
    active_promo_codes,
    active_gift_cards,
  } = placeOrder;

  const hasPreOrderItems = getHasPreOrderItems(cartItems);
  const preOrderReleaseDate = getPreOrderReleaseDate(cartItems);
  const hasSaleItems = hasActiveSaleItems(cartItems);

  const check_code = async e => {
    e.preventDefault();
    if (promo_code.length === 16) {
      // Gift card validation
      try {
        const result = await dispatch(API.validateGiftCard(promo_code)).unwrap();
        if (result.isValid) {
          dispatch(
            activatePromo({
              tax_rate,
              validGiftCard: result.giftCard,
              cartItems,
              current_user,
            })
          );
        } else {
          dispatch(set_promo_code_validations("Invalid gift card code"));
        }
      } catch (error) {
        dispatch(set_promo_code_validations(error.message));
      }
    } else {
      // Existing promo code validation
      try {
        const result = await dispatch(
          API.validatePromoCode({ promo_code, cartItems, shipping, current_user })
        ).unwrap();
        if (result.isValid) {
          dispatch(
            activatePromo({
              tax_rate,
              validPromo: result.promo,
              cartItems,
              current_user,
            })
          );
        } else {
          dispatch(set_promo_code_validations(result.errors.promo_code));
        }
      } catch (error) {
        dispatch(set_promo_code_validations("Error validating code"));
      }
    }
  };
  // const data = new Date()
  const today = new Date();

  const create_order_without_paying = async () => {
    dispatch(
      API.saveOrder({
        orderItems: cartItems,
        shipping: {
          ...shipping,
          email: user.email,
          shipment_id: shipment_id && shipment_id,
          shipping_rate: shipping_rate && shipping_rate,
        },
        payment,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        user: current_user._id,
        order_note,
        production_note,
        tip,
        promo_code,
        parcel: parcel ? parcel : null,
        status: "paid",
        paidAt: paid ? today : null,
      })
    );

    dispatch(setLoadingPayment(false));
    dispatch(API.emptyCart(my_cart._id));
    dispatch(API.updateStock({ cartItems }));
    if (promo_code) {
      dispatch(API.promoCodeUsed(promo_code.toLowerCase()));
      dispatch(API.sendCodeUsedEmail(promo_code.toLowerCase()));
    }
    navigate("/secure/glow/orders");
    sessionStorage.removeItem("shippingAddress");
  };

  const create_no_payment_order = async () => {
    dispatch(
      API.placeOrder({
        order: {
          orderItems: cartItems,
          shipping: shipment_id
            ? {
                ...shipping,
                shipment_id,
                shipping_rate,
              }
            : shipping,
          payment,
          itemsPrice,
          shippingPrice,
          previousShippingPrice,
          taxPrice,
          totalPrice,
          user: current_user._id,
          order_note,
          production_note,
          tip,
          promo_code: activePromoCodeIndicator && promo_code.length !== 16 ? promo_code : null,
          giftCards:
            activePromoCodeIndicator && promo_code.length === 16
              ? [
                  {
                    code: giftCardCode,
                    amountUsed: giftCardAmount,
                    source: "customer",
                  },
                ]
              : active_gift_cards.length > 0
                ? active_gift_cards.map(card => ({
                    code: card.code,
                    amountUsed: card.amountUsed,
                    source: "customer",
                  }))
                : null,
          parcel: parcel || null,
          status: "paid",
          paidAt: today,
          preOrderShippingDate: preOrderReleaseDate,
          hasPreOrderItems,
        },
        splitOrder,
        preOrderShippingPrice: splitOrder ? preOrderShippingPrice : null,
        nonPreOrderShippingPrice: splitOrder ? nonPreOrderShippingPrice : null,
        cartId: my_cart._id,
        create_account,
        new_password,
      })
    );
  };

  const create_order_without_user = async () => {
    dispatch(
      API.saveOrder({
        orderItems: cartItems,
        shipping: shipment_id
          ? {
              ...shipping,
              shipment_id,
              shipping_rate,
            }
          : shipping,
        payment,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        order_note,
        production_note,
        tip,
        promo_code,
        parcel,
      })
    );

    dispatch(setLoadingPayment(false));
    dispatch(API.emptyCart(my_cart._id));
    dispatch(API.updateStock({ cartItems }));
    if (promo_code) {
      dispatch(API.promoCodeUsed(promo_code.toLowerCase()));
    }
    navigate("/secure/glow/orders");
    sessionStorage.removeItem("shippingAddress");
  };

  return (
    <div>
      <div className="mv-0px">
        <div className="jc-b mv-10px">
          <Typography variant="h4">{"3. Payment & Review"}</Typography>
          {payment_completed && !show_payment && (
            <GLButtonV2
              variant="contained"
              className="mv-10px"
              color="secondary"
              onClick={() => dispatch(showHideSteps("payment"))}
            >
              {"Edit"}
            </GLButtonV2>
          )}
        </div>
        <Loading loading={loading_tax_rates} />
        {show_payment && !loading_tax_rates && (
          <div className="w-100per">
            <div className="w-100per ">
              <div htmlFor="order_note">{"Add a note"}</div>
              <input
                type="text"
                name="order_note"
                id="order_note"
                className="w-100per"
                onChange={e => dispatch(set_order_note(e.target.value))}
              />
            </div>
            {current_user?.isAdmin && (
              <div className="w-100per mt-10px">
                <div htmlFor="production_note">{"Add a production note"}</div>
                <input
                  type="text"
                  name="production_note"
                  id="production_note"
                  className="w-100per"
                  onChange={e => dispatch(set_production_note(e.target.value))}
                />
              </div>
            )}
            {show_promo_code && !hasSaleItems && (
              <div>
                <div className="mv-10px">
                  <label htmlFor="promo_code">{"Promo Code or Gift Card"}</label>
                  <form onSubmit={e => check_code(e)} className="row">
                    <input
                      type="text"
                      name="promo_code"
                      id="promo_code"
                      value={promo_code}
                      className="w-100per"
                      style={{
                        textTransform: "uppercase",
                      }}
                      onChange={e => {
                        dispatch(set_promo_code(e.target.value.toUpperCase()));
                      }}
                    />

                    <GLButton
                      type="submit"
                      variant="primary"
                      style={{
                        curser: "pointer",
                      }}
                    >
                      {"Apply"}
                    </GLButton>
                  </form>
                </div>
                <div
                  className="validation_text"
                  style={{
                    textAlign: "center",
                  }}
                >
                  {promo_code_validations}
                </div>
                {(active_promo_codes.length > 0 || active_gift_cards.length > 0) && (
                  <div className="promo_codes mv-1rem">
                    {active_promo_codes.map((promoCode, index) => (
                      <Box key={index} display="flex" alignItems="center" className="mb-5px">
                        <GLButton
                          variant="icon"
                          onClick={() =>
                            dispatch(
                              removePromo({
                                items_price,
                                tax_rate,
                                shippingPrice,
                                preOrderShippingPrice,
                                nonPreOrderShippingPrice,
                                previousShippingPrice,
                                shipping,
                                splitOrder,
                                code: promoCode.promo_code,
                                cartItems,
                                current_user,
                              })
                            )
                          }
                          aria-label="Delete"
                        >
                          <i className="fas fa-times mr-5px" />
                        </GLButton>
                        <Sell sx={{ mr: 1 }} />
                        {promoCode.percentage_off
                          ? `${promoCode.promo_code?.toUpperCase() || ""} ${promoCode.percentage_off}% Off`
                          : promoCode.amount_off
                            ? `${promoCode.promo_code?.toUpperCase() || ""} $${promoCode.amount_off} Off`
                            : promoCode.free_shipping
                              ? `${promoCode.promo_code?.toUpperCase() || ""} Free Shipping`
                              : promoCode.promo_code?.toUpperCase() || ""}
                      </Box>
                    ))}
                    {active_gift_cards.map((giftCard, index) => (
                      <Box key={index} display="flex" alignItems="center" className="mb-5px">
                        <GLButton
                          variant="icon"
                          onClick={() =>
                            dispatch(
                              removePromo({
                                items_price,
                                tax_rate,
                                shippingPrice,
                                preOrderShippingPrice,
                                nonPreOrderShippingPrice,
                                previousShippingPrice,
                                shipping,
                                splitOrder,
                                code: giftCard.code,
                                cartItems,
                                current_user,
                              })
                            )
                          }
                          aria-label="Delete"
                        >
                          <i className="fas fa-times mr-5px" />
                        </GLButton>
                        <Sell sx={{ mr: 1 }} />
                        {`Gift Card: $${giftCard.amountUsed.toFixed(2)} Applied ($${giftCard.totalOrderCost.toFixed(2)} Remaining)`}
                      </Box>
                    ))}
                  </div>
                )}
              </div>
            )}
            {hasSaleItems && (
              <div className="mv-10px">
                <Typography variant="body1" color="warning.main">
                  {
                    "Promo codes cannot be used during sales events. However, affiliate codes will still be credited for the order."
                  }
                </Typography>
              </div>
            )}
            <div>
              <div className="w-100per mb-1rem">
                <label htmlFor="tip" className="fs-16px">
                  {"Leave a tip for our production team 💙"}
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="1"
                  name="tip"
                  id="tip"
                  placeholder="$0.00"
                  defaultValue={`$${tip && parseFloat(tip).toFixed(2)}`}
                  className="w-100per"
                  onChange={e => {
                    dispatch(set_tip(parseFloat(e.target.value)));
                  }}
                />
              </div>
            </div>
            {!current_user.first_name && (
              <div>
                <div className="mv-2rem">
                  <input
                    type="checkbox"
                    name="create_account"
                    defaultChecked={create_account}
                    style={{
                      transform: "scale(1.5)",
                    }}
                    className="mr-1rem"
                    id="create_account"
                    onChange={e => {
                      dispatch(set_create_account(e.target.checked));
                    }}
                  />

                  <label htmlFor="create_account mb-20px">{"Create an account for faster checkout"}</label>
                </div>
              </div>
            )}
            {current_user && !current_user.first_name && create_account && (
              <div className="column mb-2rem">
                <label htmlFor="new_password">{"Password"}</label>
                <input
                  type="password"
                  id="new_password"
                  name="password"
                  onChange={e => dispatch(set_new_password(e.target.value))}
                />

                <label htmlFor="new_password" className="validation_text fs-16px jc-c">
                  {password_validations}
                </label>
              </div>
            )}
            <div>
              {cartItems.length > 0 && totalPrice ? (
                <StripeCheckout hasPreOrderItems={hasPreOrderItems} preOrderReleaseDate={preOrderReleaseDate} />
              ) : (
                <div></div>
              )}
              {(!totalPrice || totalPrice === 0) && (
                <>
                  <p htmlFor="password">{"Payment is not necessary at this time"}</p>
                  <GLButton
                    onClick={() => {
                      create_no_payment_order();
                    }}
                    variant="primary"
                    className="w-100per bob mb-12px"
                  >
                    {"Complete Order"}
                  </GLButton>
                </>
              )}
            </div>
            {current_user.isAdmin && (
              <div className="mt-2rem">
                {current_user.isAdmin && users && (
                  <div>
                    <div>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="large"
                            name="paid"
                            id="paid"
                            onChange={e => {
                              dispatch(set_paid(e.target.checked));
                            }}
                          />
                        }
                        label="Already Paid?"
                      />
                    </div>
                    {paid && (
                      <div className="ai-c h-25px mv-10px mt-2rem mb-30px jc-c">
                        <div className="custom-select w-100per">
                          <select
                            className="qty_select_dropdown w-100per"
                            onChange={e => dispatch(set_paymentMethod(e.target.value))}
                          >
                            <option key={1} defaultValue="">
                              {"Payment Method"}
                            </option>
                            {[
                              "stripe",
                              "venmo",
                              "cashapp",
                              "paypal",
                              "cash",
                              "zelle",
                              "facebook",
                              "promo",
                              "sponsor",
                              "replacement",
                              "no payment",
                            ].map((method, index) => (
                              <option key={index} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                          <span className="custom-arrow" />
                        </div>
                      </div>
                    )}
                    <GLAutocomplete
                      margin="normal"
                      value={user || ""}
                      variant="filled"
                      options={users.filter(user => !user.deleted).filter(user => user.first_name)}
                      getOptionLabel={option => (option ? `${option.first_name} ${option.last_name}` : "")}
                      optionDisplay={option => (option ? `${option.first_name} ${option.last_name}` : "")}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      name="users"
                      label="Choose User"
                      onChange={(event, newValue) => {
                        dispatch(set_user(newValue));
                      }}
                    />

                    <GLButton onClick={create_order_without_paying} variant="secondary" className="w-100per mb-12px">
                      {"Create Order For User"}
                    </GLButton>
                  </div>
                )}
                {current_user.isAdmin && users && (
                  <GLButton onClick={create_order_without_user} variant="secondary" className="w-100per mb-12px">
                    {"Create Order Without User"}
                  </GLButton>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {width < 400 && <hr />}
    </div>
  );
};

export default PaymentStep;
