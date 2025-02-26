import config from "../../config.js";
import order_db from "../orders/order_db.js";
import { calculateTotalOunces, covertToOunces, determine_parcel } from "./shipping_helpers.js";

import EasyPostApi from "@easypost/api";

const EasyPost = new EasyPostApi(config.EASY_POST);

export const buyLabel = async ({ shipment_id, shipping_rate }) => {
  try {
    return await EasyPost.Shipment.buy(shipment_id, shipping_rate?.id);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        error.errors?.map(errorItem => `${errorItem.field} ${errorItem.message}`).join(", ") || error.message
      );
    }
    return null;
  }
};

// Helper function to delay execution
const sleep = async ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

// Completely refactored to avoid linting issues
async function fetchTracker(label) {
  const maxAttempts = 3;

  const attemptFetch = async attemptNumber => {
    try {
      return await EasyPost.Tracker.retrieve(label.tracker.id);
    } catch (error) {
      if (attemptNumber >= maxAttempts) {
        throw new Error("Max retries reached. Tracker could not be found.");
      }

      await sleep(2000);
      return attemptFetch(attemptNumber + 1);
    }
  };

  return attemptFetch(1);
}

export const addTracking = async ({ label, order, shipping_rate, isReturnTracking = false }) => {
  try {
    const tracker = await fetchTracker(label);
    // Create a copy of the order to avoid modifying function parameters
    const updatedOrder = { ...order };

    if (isReturnTracking) {
      updatedOrder.shipping = {
        ...updatedOrder.shipping,
        return_shipment_tracker: label.tracker.id,
        return_shipping_label: label,
      };
      updatedOrder.return_tracking_url = tracker.public_url;
      updatedOrder.return_tracking_number = label.tracking_code;
    } else {
      updatedOrder.shipping = {
        ...updatedOrder.shipping,
        shipment_tracker: label.tracker.id,
        shipping_label: label,
        shipping_rate,
        shipment_id: label.id,
      };
      updatedOrder.tracking_number = label.tracking_code;
      updatedOrder.tracking_url = tracker.public_url;

      const hasFiniteStock = updatedOrder.orderItems.some(item => item.finite_stock === true);
      const hasInfiniteStock = updatedOrder.orderItems.some(
        item => item.finite_stock === false || item.finite_stock === undefined
      );

      if (hasInfiniteStock) {
        updatedOrder.status = "crafting";
      } else if (hasFiniteStock) {
        updatedOrder.status = "label_created";
      } else {
        // You might want to set a default status here or handle this case differently
        updatedOrder.status = "label_created"; // Default to this if all are undefined
      }
    }

    await order_db.update_orders_db(updatedOrder._id, updatedOrder);
    return updatedOrder;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(errorItem => `${errorItem.field} ${errorItem.message}`).join(", "));
    }
    return null;
  }
};

export const clearTracking = async ({ order, isReturnTracking = false }) => {
  try {
    // Create a copy of the order to avoid modifying function parameters
    const updatedOrder = { ...order };

    if (isReturnTracking) {
      updatedOrder.shipping = {
        ...updatedOrder.shipping,
        return_shipment_tracker: null,
        return_shipping_label: null,
      };
      updatedOrder.return_tracking_url = null;
      updatedOrder.return_tracking_number = null;
    } else {
      updatedOrder.shipping = {
        ...updatedOrder.shipping,
        shipment_tracker: null,
        shipping_label: null,
      };
      updatedOrder.tracking_number = null;
      updatedOrder.tracking_url = null;
    }

    await order_db.update_orders_db(updatedOrder._id, updatedOrder);
    return updatedOrder;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(errorItem => `${errorItem.field} ${errorItem.message}`).join(", "));
    }
    return null;
  }
};

export const createTracker = async ({ order }) => {
  try {
    const label = await EasyPost.Shipment.retrieve(order.shipping.shipment_id);
    const tracker = await EasyPost.Tracker.create({
      tracking_code: order.tracking_number,
      carrier: order.shipping?.shipping_rate?.carrier || label.selected_rate.carrier,
    });

    // Create a copy of the order to avoid modifying function parameters
    const updatedOrder = {
      ...order,
      tracking_url: tracker.public_url,
    };

    updatedOrder.shipping = {
      ...updatedOrder.shipping,
      shipping_label: label,
      shipping_rate: order.shipping?.shipping_rate || label.selected_rate,
      shipment_tracker: tracker.id,
    };

    await order_db.update_orders_db(updatedOrder._id, updatedOrder);
    return tracker;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(errorItem => `${errorItem.field} ${errorItem.message}`).join(", "));
    }
    return null;
  }
};

export const refundLabel = async ({ order, is_return_tracking }) => {
  try {
    const refund = await EasyPost.Refund.create({
      carrier: order.shipping.shipping_rate.carrier,
      tracking_codes: [is_return_tracking ? order.return_tracking_number : order.tracking_number],
    });

    // Create a copy of the order to avoid modifying function parameters
    const updatedOrder = { ...order };

    if (refund) {
      if (is_return_tracking) {
        updatedOrder.shipping = {
          ...updatedOrder.shipping,
          return_shipment_tracker: null,
          return_shipping_label: null,
        };
        updatedOrder.return_tracking_url = null;
        updatedOrder.return_tracking_number = null;
      } else {
        updatedOrder.shipping = {
          ...updatedOrder.shipping,
          shipment_id: null,
          shipping_rate: null,
          shipment_tracker: null,
          shipping_label: null,
        };
        updatedOrder.tracking_number = null;
        updatedOrder.tracking_url = null;
      }
    }

    return await order_db.update_orders_db(updatedOrder._id, updatedOrder);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(errorItem => `${errorItem.field} ${errorItem.message}`).join(", "));
    }
    return null;
  }
};

export const createLabel = async ({ order, shipping_rate }) => {
  try {
    const { shipment } = await createShippingRates({ order, returnLabel: false });
    const rateMatch = shipment.rates.find(
      rateItem => rateItem.service === shipping_rate.service && rateItem.carrier === shipping_rate.carrier
    );
    return await EasyPost.Shipment.buy(shipment.id, rateMatch.id);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(errorItem => `${errorItem.field} ${errorItem.message}`).join(", "));
    }
    return null;
  }
};

const getHSTariffNumber = category => {
  switch (category) {
    case "microlights":
      return "8513.10";
    case "gloves":
      return "6116.10";
    case "batteries":
      return "8506.10";
    default:
      return "3926.40";
  }
};

const getDescription = category => {
  switch (category) {
    case "microlights":
      return "Microlight";
    case "gloves":
      return "Gloves";
    case "batteries":
      return "Coin Batteries";
    default:
      return "3D Print";
  }
};

export const createShippingRates = async ({ order, returnLabel, returnToHeadquarters }) => {
  try {
    // No longer need to fetch parcels since we're using custom sizes
    const shippableItems = order.orderItems.filter(item => item.itemType === "product");
    const parcel = determine_parcel(shippableItems);

    const customerAddress = {
      verify: ["delivery"],
      email: order.shipping.email,
      name: `${order.shipping.first_name} ${order.shipping.last_name}`,
      street1: order.shipping.address_1,
      street2: order.shipping.address_2,
      city: order.shipping.city,
      state: order.shipping.state,
      zip: order.shipping.postalCode,
      country: order.shipping.country,
      phone: order.shipping?.phone_number?.length > 0 ? order.shipping.phone_number : config.PHONE_NUMBER,
    };

    const productionReturnAddress = {
      street1: config.PRODUCTION_ADDRESS,
      email: config.INFO_EMAIL,
      city: config.PRODUCTION_CITY,
      state: config.PRODUCTION_STATE,
      zip: config.PRODUCTION_POSTAL_CODE,
      country: config.PRODUCTION_COUNTRY,
      company: "Glow LEDs",
      phone: config.PHONE_NUMBER,
    };

    let returnAddress = productionReturnAddress;

    const headquartersReturnAddress = {
      street1: config.HEADQUARTERS_ADDRESS_1,
      street2: config.HEADQUARTERS_ADDRESS_2,
      email: config.INFO_EMAIL,
      city: config.HEADQUARTERS_CITY,
      state: config.HEADQUARTERS_STATE,
      zip: config.HEADQUARTERS_POSTAL_CODE,
      country: config.HEADQUARTERS_COUNTRY,
      company: "Glow LEDs",
      phone: config.HEADQUARTERS_PHONE,
    };

    if (returnToHeadquarters === "true") {
      returnAddress = headquartersReturnAddress;
    }

    const shipment = await EasyPost.Shipment.create({
      to_address: returnLabel ? returnAddress : customerAddress,
      from_address: returnLabel ? customerAddress : returnAddress,
      parcel: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight: calculateTotalOunces(shippableItems),
      },
      customs_info: {
        eel_pfc: "NOEEI 30.37(a)",
        customs_certify: true,
        customs_signer: `${order.shipping.first_name} ${order.shipping.last_name}`,
        contents_type: "merchandise",
        restriction_type: "none",
        non_delivery_option: "return",
        customs_items: shippableItems.map(item => {
          return {
            description: getDescription(item.category),
            quantity: item.quantity,
            value: item.price,
            weight: covertToOunces(item),
            origin_country: "US",
            hs_tariff_number: getHSTariffNumber(item.category),
          };
        }),
      },
      options: {
        commercial_invoice_letterhead: "IMAGE_1",
        commercial_invoice_signature: "IMAGE_2",
        handling_instructions: order.shipping.handling_instructions,
      },
    });
    return { shipment, parcel };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(errorItem => `${errorItem.field} ${errorItem.message}`).join(", "));
    }
    return null;
  }
};

export const createCustomShippingRates = async ({ toShipping, fromShipping, parcel }) => {
  try {
    const isInternational = toShipping.country !== "US" || toShipping.international;
    const weight = parcel.weight_pounds * 16 + (parcel.weight_ounces || 0);

    const shipmentConfig = {
      to_address: {
        verify: ["delivery"],
        email: toShipping.email,
        company: toShipping.company,
        name: `${toShipping.first_name} ${toShipping.last_name}`,
        street1: toShipping.address_1,
        street2: toShipping.address_2,
        city: toShipping.city,
        state: toShipping.state,
        zip: toShipping.postalCode,
        country: toShipping.country,
        phone: toShipping.phone,
      },
      from_address: {
        email: fromShipping.email,
        company: fromShipping.company,
        name: `${fromShipping.first_name} ${fromShipping.last_name}`,
        street1: fromShipping.address_1,
        street2: fromShipping.address_2,
        city: fromShipping.city,
        state: fromShipping.state,
        zip: fromShipping.postalCode,
        country: fromShipping.country,
        phone: fromShipping.phone,
      },
      parcel: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight,
      },
      options: {
        commercial_invoice_letterhead: "IMAGE_1",
        commercial_invoice_signature: "IMAGE_2",
        handling_instructions: toShipping.handling_instructions,
      },
    };

    // Add customs info for international shipments
    if (isInternational) {
      const { customs_info } = parcel;
      shipmentConfig.customs_info = {
        eel_pfc: "NOEEI 30.37(a)",
        customs_certify: true,
        customs_signer: `${fromShipping.first_name} ${fromShipping.last_name}`,
        contents_type: customs_info.contents_type,
        restriction_type: customs_info.restriction_type,
        non_delivery_option: customs_info.non_delivery_option,
        customs_items: customs_info.customs_items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          value: item.value,
          weight: item.weight_pounds * 16 + (item.weight_ounces || 0),
          origin_country: item.origin_country,
          hs_tariff_number: item.hs_tariff_number,
        })),
      };
    }

    const shipment = await EasyPost.Shipment.create(shipmentConfig);

    // Sort rates by price
    if (shipment.rates) {
      shipment.rates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
    }

    return { shipment, parcel };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(errorItem => `${errorItem.field} ${errorItem.message}`).join(", "));
    }
    return null;
  }
};
