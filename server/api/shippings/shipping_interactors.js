import config from "../../config.js";
import order_db from "../orders/order_db.js";
import parcel_db from "../parcels/parcel_db.js";
import { calculateTotalOunces, covertToOunces, determine_parcel } from "./shipping_helpers.js";

import EasyPostApi from "@easypost/api";

const EasyPost = new EasyPostApi(config.EASY_POST);

export const buyLabel = async ({ shipment_id, shipping_rate }) => {
  try {
    return await EasyPost.Shipment.buy(shipment_id, shipping_rate?.id);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(error => `${error.field} ${error.message}`).join(", ") || error.message);
    }
  }
};

const maxRetries = 3;
let retries = 0;

async function fetchTracker(label) {
  while (retries < maxRetries) {
    try {
      const tracker = await EasyPost.Tracker.retrieve(label.tracker.id);
      return tracker;
    } catch (error) {
      retries++;
      console.log(`Retry ${retries}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait for 2 seconds
    }
  }
  throw new Error("Max retries reached. Tracker could not be found.");
}

export const addTracking = async ({ label, order, shipping_rate, isReturnTracking = false }) => {
  try {
    const tracker = await fetchTracker(label);

    if (isReturnTracking) {
      order.shipping.return_shipment_tracker = label.tracker.id;
      order.return_tracking_url = tracker.public_url;
      order.return_tracking_number = label.tracking_code;
      order.shipping.return_shipping_label = label;
    } else {
      order.shipping.shipment_tracker = label.tracker.id;
      order.tracking_number = label.tracking_code;
      order.tracking_url = tracker.public_url;
      order.shipping.shipping_label = label;
      order.shipping.shipping_rate = shipping_rate;
      order.shipping.shipment_id = label.id;

      const hasFiniteStock = order.orderItems.some(item => item.finite_stock === true);
      const hasInfiniteStock = order.orderItems.some(
        item => item.finite_stock === false || item.finite_stock === undefined
      );

      if (hasInfiniteStock) {
        order.status = "crafting";
      } else if (hasFiniteStock) {
        order.status = "label_created";
      } else {
        // You might want to set a default status here or handle this case differently
        order.status = "label_created"; // Default to this if all are undefined
      }
    }

    await order_db.update_orders_db(order._id, order);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(error => `${error.field} ${error.message}`).join(", "));
    }
  }
};

export const clearTracking = async ({ order, isReturnTracking = false }) => {
  try {
    if (isReturnTracking) {
      order.shipping.return_shipment_tracker = null;
      order.return_tracking_url = null;
      order.return_tracking_number = null;
      order.shipping.return_shipping_label = null;
    } else {
      order.shipping.shipment_tracker = null;
      order.tracking_number = null;
      order.tracking_url = null;
      order.shipping.shipping_label = null;
    }

    await order_db.update_orders_db(order._id, order);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(error => `${error.field} ${error.message}`).join(", "));
    }
  }
};

export const createTracker = async ({ order }) => {
  try {
    const label = await EasyPost.Shipment.retrieve(order.shipping.shipment_id);
    const tracker = await EasyPost.Tracker.create({
      tracking_code: order.tracking_number,
      carrier: order.shipping?.shipping_rate?.carrier || label.selected_rate.carrier,
    });
    order.tracking_url = tracker.public_url;
    order.shipping.shipping_label = label;
    order.shipping.shipping_rate = order.shipping?.shipping_rate || label.selected_rate;
    order.shipping.shipment_tracker = tracker.id;
    order.tracking_url = tracker.public_url;
    await order_db.update_orders_db(order._id, order);
    return tracker;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(error => `${error.field} ${error.message}`).join(", "));
    }
  }
};

export const refundLabel = async ({ order, is_return_tracking }) => {
  try {
    const refund = await EasyPost.Refund.create({
      carrier: order.shipping.shipping_rate.carrier,
      tracking_codes: [is_return_tracking ? order.return_tracking_number : order.tracking_number],
    });
    if (refund) {
      if (is_return_tracking) {
        order.shipping.return_shipment_tracker = null;
        order.return_tracking_url = null;
        order.return_tracking_number = null;
        order.shipping.return_shipping_label = null;
      } else {
        order.shipping.shipment_id = null;
        order.shipping.shipping_rate = null;
        order.shipping.shipment_tracker = null;
        order.tracking_number = null;
        order.tracking_url = null;
        order.shipping.shipping_label = null;
      }
    }

    return await order_db.update_orders_db(order._id, order);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(error => `${error.field} ${error.message}`).join(", "));
    }
  }
};

export const createLabel = async ({ order, shipping_rate }) => {
  try {
    const { shipment } = await createShippingRates({ order, returnLabel: false });
    const rate = shipment.rates.find(
      rate => rate.service === shipping_rate.service && rate.carrier === shipping_rate.carrier
    );
    return await EasyPost.Shipment.buy(shipment.id, rate.id);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.errors?.map(error => `${error.field} ${error.message}`).join(", "));
    }
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
    console.log({ error, errors: error.errors });
    if (error instanceof Error) {
      throw new Error(error.errors?.map(error => `${error.field} ${error.message}`).join(", "));
    }
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
    console.log({ error, errors: error.errors });
    if (error instanceof Error) {
      throw new Error(error.errors?.map(error => `${error.field} ${error.message}`).join(", "));
    }
  }
};
