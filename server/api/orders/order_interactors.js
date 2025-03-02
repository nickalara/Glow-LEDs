import GiftCardTemplate from "../../email_templates/pages/GiftCardTemplate.js";
import { generateRandomCode, isEmail } from "../../utils/util.js";
import GiftCard from "../gift_cards/gift_card.js";
import mongoose from "mongoose";
import order_db from "./order_db.js";
import Order from "./order.js";
import User from "../users/user.js";
import { normalizeCustomerInfo, normalizePaymentInfo } from "../payments/payment_helpers.js";
import {
  createOrUpdateCustomer,
  createPaymentIntent,
  confirmPaymentIntent,
  logStripeFeeToExpenses,
  updateOrder,
} from "../payments/payment_interactors.js";
import OrderTemplate from "../../email_templates/pages/OrderTemplate.js";
import CodeUsedTemplate from "../../email_templates/pages/CodeUsedTemplate.js";
import config from "../../config.js";
import Affiliate from "../affiliates/affiliate.js";
import order_services from "./order_services.js";
import App from "../../email_templates/App.js";
import TicketTemplate from "../../email_templates/pages/TicketTemplate.js";
import { generateTicketQRCodes, sendEmail } from "../emails/email_interactors.js";
import promo_db from "../promos/promo_db.js";
import bcrypt from "bcryptjs";
import { useGiftCard } from "../gift_cards/gift_card_interactors.js";
import { determineRevenueTier } from "../affiliates/affiliate_helpers.js";
import dayjs from "dayjs";

export const normalizeOrderFilters = input => {
  const output = {};
  Object.keys(input).forEach(key => {
    switch (key) {
      case "order_status":
        for (const status of input.order_status) {
          switch (status) {
            case "Unpaid":
              output.status = "unpaid";
              break;
            case "Paid":
              output.status = "paid";
              break;
            case "Label Created":
              output.status = "label_created";
              break;
            case "Crafting":
              output.status = "crafting";
              break;
            case "Crafted":
              output.status = "crafted";
              break;
            case "Packaged":
              output.status = "packaged";
              break;
            case "Shipped":
              output.status = "shipped";
              break;
            case "In Transit":
              output.status = "in_transit";
              break;
            case "Out For Delivery":
              output.status = "out_for_delivery";
              break;
            case "Delivered":
              output.status = "delivered";
              break;
            case "isRefunded":
              output.isRefunded = true;
              break;
            case "isPaused":
              output.isPaused = true;
              break;
            case "Paid Pre Order":
              output.status = "paid_pre_order";
              break;
            case "Canceled":
              output.status = "canceled";
              break;
            case "isPrioritized":
              output.isPrioritized = true;
              break;
            case "isPrintIssue":
              output.isPrintIssue = true;
              break;
            case "Return Label Created":
              output.status = "return_label_created";
              break;
          }
        }
        break;
      case "shipping":
        for (const shipping of input.shipping) {
          output[`shipping.${shipping}`] = true;
        }
        break;
      case "user":
        for (const user of input.user) {
          output.user = user;
        }
        break;
      case "carrier":
        for (const carrier of input.carrier) {
          if (carrier === "ups") {
            output["shipping.shipping_rate.carrier"] = "UPSDAP";
          } else if (carrier === "fedex") {
            output["shipping.shipping_rate.carrier"] = "Fedex";
          } else if (carrier === "usps") {
            output["shipping.shipping_rate.carrier"] = "USPS";
          }
        }
        break;
      case "Unpaid":
        if (!input.Paid.includes(1)) {
          output.status = "unpaid";
        }
        break;

      default:
        break;
    }
  });
  return output;
};

export const normalizeOrderSearch = query => {
  let search = {};
  const USPS_REGEX = /^[0-9]{20,22}$/; // Matches USPS tracking numbers
  const FEDEX_REGEX = /^[0-9]{12,15}$/; // Matches FedEx tracking numbers
  const UPS_REGEX = /^1Z[A-Z0-9]{16}$/; // Matches UPS tracking numbers

  if (query.search && query.search.match(/^[0-9a-fA-F]{24}$/)) {
    search = query.search ? { _id: new mongoose.Types.ObjectId(query.search) } : {};
  } else if (query.search && isEmail(query.search)) {
    search = query.search
      ? {
          $expr: {
            $regexMatch: {
              input: "$shipping.email",
              regex: query.search,
              options: "i",
            },
          },
        }
      : {};
  } else if (query.search && query.search.substring(0, 1) === "#") {
    search = query.search
      ? {
          promo_code: query.search.slice(1, query.search.length),
        }
      : {};
  } else if (query.search && query.search.match(/^[A-Za-z0-9]{16}$/)) {
    // Search for 16-character alphanumeric strings as potential gift card codes without the "!" prefix
    search = query.search
      ? {
          $or: [
            {
              "giftCards.code": {
                $regex: new RegExp(query.search, "i"),
              },
            },
            {
              giftCardCode: {
                $regex: new RegExp(query.search, "i"),
              },
            },
          ],
        }
      : {};
  } else if (query.search && query.search.match(USPS_REGEX)) {
    search = query.search
      ? {
          tracking_number: query.search,
        }
      : {};
  } else if (query.search && query.search.match(UPS_REGEX)) {
    search = query.search
      ? {
          tracking_number: query.search,
        }
      : {};
  } else if (query.search && query.search.match(FEDEX_REGEX)) {
    search = query.search
      ? {
          tracking_number: query.search,
        }
      : {};
  } else {
    search = query.search
      ? {
          $or: [
            {
              $expr: {
                $regexMatch: {
                  input: {
                    $concat: ["$shipping.first_name", " ", "$shipping.last_name"],
                  },
                  regex: query.search,
                  options: "i",
                },
              },
            },
            {
              "orderItems.name": {
                $regex: query.search,
                $options: "i",
              },
            },
          ],
        }
      : {};
  }
  return search;
};

export const getCodeUsage = async ({ promo_code, start_date, end_date, sponsor, sponsorTeamCaptain }) => {
  try {
    const matchFilter = {
      deleted: false,
      status: { $nin: ["unpaid", "canceled"] },
      createdAt: { $gte: new Date(dayjs(start_date).startOf("day")), $lte: new Date(dayjs(end_date).endOf("day")) },
      promo_code: new RegExp(`^${promo_code}$`, "i"), // Match exact promo code
    };

    let earningsMultiplier = 0.1;
    if (sponsor === true || sponsor === "true") {
      earningsMultiplier = 0.15;
    }
    if (sponsorTeamCaptain === true || sponsorTeamCaptain === "true") {
      earningsMultiplier = 0.2;
    }

    // First get the ticket count and order details
    const ticketCountPipeline = [
      { $match: matchFilter },
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.itemType": "ticket",
        },
      },
      {
        $group: {
          _id: null,
          ticket_uses: { $sum: "$orderItems.quantity" },
          ticket_orders: {
            $push: {
              order_id: "$_id",
              first_name: "$shipping.first_name",
              last_name: "$shipping.last_name",
              quantity: "$orderItems.quantity",
              date: "$createdAt",
              ticket_type: "$orderItems.name",
            },
          },
        },
      },
    ];

    // Then get the revenue data
    const revenuePipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          number_of_uses: { $sum: 1 },
          revenue: { $sum: "$itemsPrice" },
          totalRefund: { $sum: { $ifNull: [{ $sum: "$refunds.amount" }, 0] } },
        },
      },
      {
        $project: {
          number_of_uses: 1,
          revenue: 1,
          earnings: { $multiply: ["$revenue", earningsMultiplier] },
          totalRefund: 1,
        },
      },
      {
        $addFields: {
          revenue: { $subtract: ["$revenue", { $divide: ["$totalRefund", 100] }] },
        },
      },
    ];

    const [ticketResults, revenueResults] = await Promise.all([
      Order.aggregate(ticketCountPipeline),
      Order.aggregate(revenuePipeline),
    ]);

    if (revenueResults.length === 0) {
      return {
        number_of_uses: 0,
        revenue: 0,
        earnings: 0,
        ticket_uses: 0,
        ticket_orders: [],
      };
    }

    const { number_of_uses, revenue, earnings } = revenueResults[0];
    const ticket_uses = ticketResults[0]?.ticket_uses || 0;
    const ticket_orders = ticketResults[0]?.ticket_orders || [];

    console.log({ ticket_orders });

    return {
      number_of_uses,
      revenue,
      earnings,
      ticket_uses,
      ticket_orders,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const getMonthlyCodeUsage = async ({ promo_code, start_date, end_date, sponsor, sponsorTeamCaptain }) => {
  try {
    const matchFilter = {
      deleted: false,
      status: { $nin: ["unpaid", "canceled"] },
      createdAt: { $gte: new Date(start_date), $lte: new Date(end_date) },
      promo_code: new RegExp(`^${promo_code}$`, "i"),
    };

    let earningsMultiplier = 0.1;
    if (sponsor === true || sponsor === "true") {
      earningsMultiplier = 0.15;
    }
    if (sponsorTeamCaptain === true || sponsorTeamCaptain === "true") {
      earningsMultiplier = 0.2;
    }

    const aggregationPipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          number_of_uses: { $sum: 1 },
          revenue: { $sum: "$itemsPrice" },
          totalRefund: { $sum: { $ifNull: [{ $sum: "$refunds.amount" }, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          number_of_uses: 1,
          revenue: 1,
          earnings: { $multiply: ["$revenue", earningsMultiplier] },
          totalRefund: 1,
        },
      },
      {
        $addFields: {
          revenue: { $subtract: ["$revenue", { $divide: ["$totalRefund", 100] }] },
        },
      },
    ];

    const results = await Order.aggregate(aggregationPipeline);
    return results;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const handleUserCreation = async (shipping, create_account, new_password) => {
  try {
    const { email, first_name, last_name } = shipping;
    const lowercaseEmail = email.toLowerCase();

    // Check if user exists
    let user = await User.findOne({ email: lowercaseEmail });

    if (!user) {
      // Create new user if email doesn't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(create_account ? new_password : config.TEMP_PASS, salt);

      user = await User.create({
        email: lowercaseEmail,
        first_name,
        last_name,
        isVerified: true,
        email_subscription: true,
        guest: !create_account,
        password: hashedPassword,
      });
    } else {
      // Update existing user
      const updateData = {
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        email_subscription: true,
        guest: !create_account,
      };

      if (!user.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(create_account ? new_password : config.TEMP_PASS, salt);
      }

      await User.updateOne({ _id: user._id }, updateData);
      user = await User.findOne({ _id: user._id });
    }

    return user._id;
  } catch (error) {
    throw new Error("Failed to create or find user");
  }
};

export const processPayment = async (orderId, paymentMethod, totalPrice) => {
  try {
    let newTotalPrice = totalPrice;
    const order = await Order.findById(orderId).populate("user");

    // If gift card was used, process it first
    if (order.giftCardCode && order.giftCardAmount) {
      await useGiftCard(order.giftCardCode, order.giftCardAmount, orderId);
      // Adjust the amount to charge via Stripe
      newTotalPrice -= order.giftCardAmount;
    }
    let confirmedPayment;

    // Only process Stripe payment if there's remaining balance
    if (newTotalPrice > 0) {
      if (!paymentMethod) {
        throw new Error("Payment method is required for orders with a positive total price.");
      }
      const customerInformation = normalizeCustomerInfo({ shipping: order.shipping, paymentMethod });
      const paymentInformation = normalizePaymentInfo({ totalPrice: newTotalPrice });
      const customer = await createOrUpdateCustomer(customerInformation);
      const paymentIntent = await createPaymentIntent(customer, paymentInformation);
      confirmedPayment = await confirmPaymentIntent(paymentIntent, paymentMethod.id);
      await logStripeFeeToExpenses(confirmedPayment);
    } else {
      // No payment is needed; set confirmedPayment to an empty object or null
      confirmedPayment = null;
    }

    const hasPreOrderItems = order.orderItems.some(item => item.isPreOrder);
    const updatedOrder = await updateOrder(order, confirmedPayment, paymentMethod, hasPreOrderItems);

    return updatedOrder;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw new Error(error);
  }
};

export const sendOrderEmail = async orderData => {
  try {
    const bodyConfirmation = {
      email: {
        h1: "YOUR ORDER HAS BEEN PLACED! 🎉",
        h2: "We are starting production on your order! We will notify your as your order progresses.",
      },
      title: "Thank you for your purchase!",
      order: orderData,
    };
    const mailOptionsConfirmation = {
      from: config.DISPLAY_INFO_EMAIL,
      to: orderData.shipping.email,
      subject: "Thank you for your Glow LEDs Order",
      html: App({ body: OrderTemplate(bodyConfirmation), unsubscribe: false }),
    };
    await sendEmail(mailOptionsConfirmation);
  } catch (error) {
    console.error("Error sending order email:", error);
    throw new Error("Failed to send order email");
  }
};

export const sendExchangeOrderEmail = async orderData => {
  try {
    const bodyConfirmation = {
      email: {
        h1: "YOUR EXCHANGE ORDER HAS BEEN PLACED! 🎉",
        h2: "We will begin production on your exchange order when your return items are received. We will notify your as your order progresses.",
      },
      title: "Thank you for your purchase!",
      order: orderData,
    };
    const mailOptionsConfirmation = {
      from: config.DISPLAY_INFO_EMAIL,
      to: orderData.shipping.email,
      subject: "Thank you for your Glow LEDs Order",
      html: App({ body: OrderTemplate(bodyConfirmation), unsubscribe: false }),
    };
    await sendEmail(mailOptionsConfirmation);
  } catch (error) {
    console.error("Error sending order email:", error);
    throw new Error("Failed to send order email");
  }
};

export const sendTicketEmail = async orderData => {
  try {
    const ticketQRCodes = await generateTicketQRCodes(orderData);
    const bodyTickets = {
      email: {
        h1: "YOUR EVENT TICKETS",
        h2: "Here are your QR codes for event entry.",
      },
      title: "Your Event Tickets",
      order: orderData,
      ticketQRCodes,
    };
    const mailOptionsTickets = {
      from: config.DISPLAY_INFO_EMAIL,
      to: orderData.shipping.email,
      subject: "Your Event Tickets",
      html: App({ body: TicketTemplate(bodyTickets), unsubscribe: false }),
    };
    if (orderData.orderItems.every(item => item.itemType === "ticket")) {
      await order_db.update_orders_db(orderData._id, { status: "delivered", deliveredAt: new Date() });
    }
    await sendEmail(mailOptionsTickets);
  } catch (error) {
    console.error("Error sending ticket email:", error);
    throw new Error("Failed to send ticket email");
  }
};

export const sendCodeUsedEmail = async promo_code => {
  try {
    const today = new Date();
    const first_of_month = new Date(today.getFullYear(), today.getMonth(), 1);
    const promo = await promo_db.findBy_promos_db({ promo_code: promo_code.toLowerCase(), deleted: false });

    if (promo) {
      const affiliates = await Affiliate.find({ deleted: false });
      const affiliate = affiliates.find(affiliate => affiliate.public_code.toString() === promo._id.toString());

      if (affiliate) {
        const users = await User.find({ deleted: false, is_affiliated: true });
        const user = users.find(user => user?.affiliate?.toString() === affiliate._id.toString());

        const stats = await order_services.code_usage_orders_s(
          { promo_code },
          { start_date: first_of_month, end_date: today, sponsor: affiliate.artist_name }
        );

        const mailBodyData = {
          name: affiliate.artist_name,
          promo_code,
          percentage_off: determineRevenueTier(affiliate, stats.revenue),
          number_of_uses: stats.number_of_uses,
          earnings: affiliate.sponsor ? stats.revenue * 0.15 : stats.revenue * 0.1,
        };

        const mailOptions = {
          from: config.DISPLAY_INFO_EMAIL,
          to: user.email,
          subject: `Your code was just used!`,
          html: App({
            body: CodeUsedTemplate(mailBodyData),
            unsubscribe: false,
          }),
        };
        await sendEmail(mailOptions);
      }
    }
  } catch (error) {
    throw new Error("Failed to send code used email");
  }
};

export const splitOrderItems = orderItems => {
  const preOrderItems = orderItems.filter(item => item.isPreOrder);
  const nonPreOrderItems = orderItems.filter(item => !item.isPreOrder);
  return { preOrderItems, nonPreOrderItems };
};

export const createSplitOrder = async (originalOrder, items, userId, isPreOrder = false, shipping_rate) => {
  const { itemsPrice, shippingPrice, taxPrice } = calculateOrderPrices(items, originalOrder, shipping_rate);

  const splitOrder = {
    ...originalOrder,
    orderItems: items,
    shipping: {
      ...originalOrder.shipping,
      shipping_rate,
      shipment_id: shipping_rate?.id,
    },
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice: parseFloat(itemsPrice) + parseFloat(shippingPrice) + parseFloat(taxPrice),
    user: userId,
    hasPreOrderItems: isPreOrder,
    preOrderShippingDate: isPreOrder ? originalOrder.preOrderShippingDate : null,
  };

  return await Order.create(splitOrder);
};

export const calculateOrderPrices = (items, originalOrder, shipping_rate) => {
  const itemsPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingPrice = originalOrder.shipping.international
    ? shipping_rate?.rate
    : shipping_rate?.list_rate || shipping_rate?.rate || 0;
  const taxPrice = originalOrder?.taxRate ? itemsPrice * originalOrder?.taxRate : 0;

  return { itemsPrice, shippingPrice, taxPrice };
};

export const generateGiftCards = async orderItems => {
  const giftCardsByAmount = [];

  for (const item of orderItems) {
    if (item.itemType === "gift_card") {
      // Get the price as the initial balance if data.initialBalance is not present
      const initialBalance = item.data?.initialBalance || item.price;

      const giftCardsForAmount = {
        initialBalance,
        quantity: item.quantity,
        codes: [],
      };

      // Generate gift cards for this amount
      for (let i = 0; i < item.quantity; i++) {
        const code = generateRandomCode(16); // Generate 16-character unique code

        await GiftCard.create({
          code,
          initialBalance,
          currentBalance: initialBalance,
          source: "customer",
          isActive: true,
        });

        giftCardsForAmount.codes.push(code);
      }

      giftCardsByAmount.push(giftCardsForAmount);
    }
  }

  return giftCardsByAmount;
};

export const generateGiftCard = async ({ amount }) => {
  const initialBalance = amount;

  const code = generateRandomCode(16); // Generate 16-character unique code

  const giftCard = await GiftCard.create({
    code,
    initialBalance,
    currentBalance: initialBalance,
    source: "customer",
    isActive: true,
  });

  const newGiftCard = await GiftCard.findOne({ _id: giftCard._id });

  return newGiftCard;
};

export const sendGiftCardEmail = async order => {
  const giftCardItems = order.orderItems.filter(item => item.itemType === "gift_card");

  if (giftCardItems.length > 0) {
    const giftCards = await generateGiftCards(giftCardItems);

    const mailOptionsConfirmation = {
      from: config.DISPLAY_INFO_EMAIL,
      to: order.shipping.email,
      subject: `Your Glow LEDs Gift Card${giftCards.length > 1 ? "s" : ""} Codes`,
      html: App({ body: GiftCardTemplate(giftCards, order._id), unsubscribe: false }),
      headers: {
        "Precedence": "transactional",
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
    };

    await sendEmail(mailOptionsConfirmation);

    return giftCards;
  }

  return null;
};
