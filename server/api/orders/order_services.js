import {
  sendGiftCardEmail,
  getCodeUsage,
  getMonthlyCodeUsage,
  handleUserCreation,
  normalizeOrderFilters,
  normalizeOrderSearch,
  processPayment,
  sendCodeUsedEmail,
  sendOrderEmail,
  sendTicketEmail,
  splitOrderItems,
  createSplitOrder,
} from "./order_interactors.js";
import Order from "./order.js";
import order_db from "./order_db.js";
import promo_db from "../promos/promo_db.js";
import User from "../users/user.js";
import user_db from "../users/user_db.js";
import cart_services from "../carts/cart_services.js";
import product_services from "../products/product_services.js";
import promo_services from "../promos/promo_services.js";
import {
  dates_in_year,
  determine_filter,
  isEmail,
  month_dates,
  removeDuplicates,
  toCapitalize,
} from "../../utils/util.js";
import { getFilteredData } from "../api_helpers.js";
import SalesTax from "sales-tax";
import affiliate_db from "../affiliates/affiliate_db.js";
import { useGiftCard } from "../gift_cards/gift_card_interactors.js";
import { determineRevenueTier } from "../affiliates/affiliate_helpers.js";

SalesTax.setTaxOriginCountry("US"); // Set this to your business's country code

export default {
  get_table_orders_s: async query => {
    try {
      const sort_options = ["createdAt", "user.first_name", "totalPrice"];
      const { filter, sort, limit, page } = getFilteredData({
        query,
        sort_options,
        search_name: "shipping.first_name",
        normalizeFilters: normalizeOrderFilters,
        normalizeSearch: normalizeOrderSearch,
      });
      const orders = await order_db.table_orders_db(filter, sort, limit, page);
      const count = await order_db.count_orders_db(filter);
      return {
        data: orders,
        total_count: count,
        currentPage: parseInt(page, 10),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_user_table_orders_s: async (query, params) => {
    try {
      const sort_options = ["createdAt", "user.first_name", "totalPrice"];
      const { filter, sort, limit, page } = getFilteredData({
        query,
        sort_options,
        search_name: "shipping.first_name",
        // normalizeFilters: normalizeOrderFilters,
        // normalizeSearch: normalizeOrderSearch,
      });
      const scopedByUser = params.user_id ? { ...filter, user: params.user_id } : filter;
      const orders = await order_db.get_user_table_orders_db(scopedByUser, sort, limit, page);
      const count = await order_db.count_orders_db(scopedByUser);
      return {
        data: orders,
        total_count: count,
        currentPage: parseInt(page, 10),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  findAll_orders_s: async query => {
    try {
      const sort_options = ["createdAt", "user.first_name", "totalPrice"];
      const { filter, sort, limit, page } = getFilteredData({
        query,
        sort_options,
        search_name: "shipping.first_name",
        normalizeFilters: normalizeOrderFilters,
        normalizeSearch: normalizeOrderSearch,
      });
      const orders = await order_db.table_orders_db(filter, sort, limit, page);
      const count = await order_db.count_orders_db(filter);
      return {
        data: orders,
        total_count: count,
        currentPage: parseInt(page, 10),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  create_filters_orders_s: async query => {
    try {
      const availableFilters = {
        order_status: [
          "Unpaid",
          "Paid",
          "Paid Pre Order",
          "Label Created",
          "Crafting",
          "Crafted",
          "Packaged",
          "Shipped",
          "In Transit",
          "Out For Delivery",
          "Delivered",
          "Return Label Created",
          "isPaused",
          "isRefunded",
          "isUpdated",
          "isPrintIssue",
        ],
        shipping: ["international"],
        carrier: ["usps", "ups", "fedex"],
        users: await Order.distinct("user").populate("user"),
      };
      return { availableFilters };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  findAllOld_orders_s: async query => {
    try {
      const page = query.page ? query.page : "1";
      const limit = query.limit ? query.limit : "10";
      let search;
      if (query.search && query.search.match(/^[0-9a-fA-F]{24}$/)) {
        search = query.search ? { _id: query.search } : {};
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
              promo_code: query.search.slice(1, query.search.length).toLowerCase(),
            }
          : {};
      } else {
        search = query.search
          ? {
              $expr: {
                $regexMatch: {
                  input: {
                    $concat: ["$shipping.first_name", " ", "$shipping.last_name"],
                  },
                  regex: query.search,
                  options: "i",
                },
              },
            }
          : {};
      }
      const sort_query = query.sort && query.sort.toLowerCase();
      const sort = { createdAt: -1 };
      const filter = { deleted: false, status: sort_query };
      const orders = await order_db.findAll_orders_db({ ...filter, ...search }, sort, limit, page);
      const count = await order_db.count_orders_db({ ...filter, ...search });
      if (count !== undefined) {
        return {
          orders,
          totalPages: Math.ceil(count / parseInt(limit, 10)),
          currentPage: page,
        };
      } else {
        throw new Error("Count is undefined");
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  findMy_orders_s: async params => {
    try {
      const sort = { _id: -1 };
      const filter = { deleted: false, user: params.id };
      const limit = "0";
      const page = "1";
      return await order_db.findAll_orders_db(filter, sort, limit, page);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  findById_orders_s: async params => {
    try {
      return await order_db.findById_orders_db(params.id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  place_order_orders_s: async body => {
    const {
      order,
      cartId,
      paymentMethod,
      create_account,
      new_password,
      splitOrder,
      preOrderShippingRate,
      nonPreOrderShippingRate,
    } = body;

    try {
      // Check if any orderItem has subcategory "sampler" and quantity greater than 1
      const hasSamplerWithQtyGreaterThanOne = order.orderItems.some(
        item => item.subcategory === "sampler" && item.quantity > 1
      );

      if (hasSamplerWithQtyGreaterThanOne) {
        throw new Error("Only one sampler pack allowed per order.");
      }

      // Use existing user ID if provided, otherwise create or retrieve user
      let userId = order.user;
      if (!userId) {
        userId = await handleUserCreation(order.shipping, create_account, new_password);
      }

      const orders = [];
      let nonPreOrderOrder;
      let preOrderOrder;

      if (splitOrder) {
        const { preOrderItems, nonPreOrderItems } = splitOrderItems(order.orderItems);

        if (nonPreOrderItems.length > 0) {
          nonPreOrderOrder = await createSplitOrder(order, nonPreOrderItems, userId, false, nonPreOrderShippingRate);
          orders.push(nonPreOrderOrder);
        }

        if (preOrderItems.length > 0) {
          preOrderOrder = await createSplitOrder(order, preOrderItems, userId, true, preOrderShippingRate);
          orders.push(preOrderOrder);
        }

        // Link the orders
        if (nonPreOrderOrder && preOrderOrder) {
          nonPreOrderOrder.splitOrder = preOrderOrder._id;
          preOrderOrder.splitOrder = nonPreOrderOrder._id;
          await nonPreOrderOrder.save();
          await preOrderOrder.save();
        }
      } else {
        const createdOrder = await Order.create({
          ...order,
          user: userId,
          status: "unpaid",
        });
        orders.push(createdOrder);
      }

      // Process payment for non-pre-order items or the entire order if not split
      // Determine which order to process payment for
      let paymentOrder;
      if (splitOrder) {
        if (nonPreOrderOrder) {
          paymentOrder = nonPreOrderOrder;
        } else if (preOrderOrder) {
          paymentOrder = preOrderOrder;
        }
      } else {
        paymentOrder = orders[0];
      }

      // Process payment if necessary
      if (paymentOrder) {
        if (paymentMethod || paymentOrder.totalPrice <= 0) {
          try {
            paymentOrder = await processPayment(paymentOrder._id, paymentMethod, paymentOrder.totalPrice);

            // After processing payment, update the preOrderOrder if it exists
            if (splitOrder && preOrderOrder && preOrderOrder._id !== paymentOrder._id) {
              preOrderOrder.status = "paid_pre_order";
              preOrderOrder.paidAt = Date.now();
              preOrderOrder.payment = paymentOrder.payment; // Use the same payment info
              await preOrderOrder.save();
            }
          } catch (error) {
            // If payment fails, throw error with order ID
            const err = new Error(error.message);
            err.orderId = paymentOrder._id;
            throw err;
          }
        } else {
          throw new Error("Payment method is required for orders with a positive total price.");
        }
      }

      // Update stock and empty cart first
      try {
        await product_services.update_stock_products_s({ cartItems: order.orderItems });
      } catch (error) {
        console.error("Error updating product stock:", error);
        // Continue execution even if stock update fails
      }
      await cart_services.empty_carts_s({ id: cartId });

      // Handle promo code
      if (order.promo && order.promo.length !== 16) {
        await promo_services.update_code_used_promos_s({ promo_code: order.promo.promo_code });
      }

      // Handle gift cards
      if (order.giftCard) {
        // Single gift card passed as giftCard
        try {
          await useGiftCard(order.giftCard.code, order.giftCard.amountUsed, paymentOrder._id);
        } catch (error) {
          console.error("Error applying gift card:", error);
        }
      } else if (order.giftCards && order.giftCards.length > 0) {
        // Multiple gift cards passed as giftCards array
        await Promise.all(
          order.giftCards.map(async giftCard => {
            try {
              await useGiftCard(giftCard.code, giftCard.amountUsed, paymentOrder._id);
            } catch (error) {
              console.error(`Error applying gift card ${giftCard.code}:`, error);
            }
          })
        );
      }

      // Send emails asynchronously without waiting
      orders.forEach(async updateOrder => {
        try {
          const freshOrder = await order_db.findById_orders_db(updateOrder._id);
          // Set a timeout for email sending
          const emailTimeout = 10000; // 10 seconds timeout

          const sendEmailWithTimeout = async emailPromise => {
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("Email sending timed out")), emailTimeout);
            });

            try {
              const result = await Promise.race([emailPromise, timeoutPromise]);
              clearTimeout(timeoutId);
              return result;
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          };

          // Send order confirmation email
          sendEmailWithTimeout(sendOrderEmail(freshOrder)).catch(error => {
            console.error("Error sending order confirmation email:", error);
          });

          // Send ticket email if needed
          if (updateOrder.orderItems.some(item => item.itemType === "ticket")) {
            sendEmailWithTimeout(sendTicketEmail(freshOrder)).catch(error => {
              console.error("Error sending ticket email:", error);
            });
          }

          // Send gift card email if needed
          if (updateOrder.orderItems.some(item => item.itemType === "gift_card")) {
            sendEmailWithTimeout(sendGiftCardEmail(freshOrder)).catch(error => {
              console.error("Error sending gift card email:", error);
            });
          }

          // Send promo code used email if needed
          if (order.promo && order.promo.length !== 16) {
            sendEmailWithTimeout(sendCodeUsedEmail(order.promo.promo_code)).catch(error => {
              console.error("Error sending promo code used email:", error);
            });
          }
        } catch (error) {
          console.error("Error in email sending process:", error);
        }
      });

      return orders;
    } catch (error) {
      console.log({ error });
      if (error instanceof Error) {
        // Include the order ID in the error if it exists
        if (error.orderId) {
          const err = new Error(error.message);
          err.orderId = error.orderId;
          throw err;
        }
        throw new Error(error.message);
      }
    }
  },

  create_orders_s: async body => {
    try {
      const newOrder = await order_db.create_orders_db(body);
      return await order_db.findById_orders_db(newOrder._id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  update_orders_s: async (params, body) => {
    try {
      return await order_db.update_orders_db(params.id, body);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  remove_orders_s: async params => {
    try {
      return await order_db.remove_orders_db(params.id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  test_delete_orders_s: async params => {
    try {
      return await order_db.remove_orders_db(params.id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  occurrences_orders_s: async () => {
    try {
      return await order_db.get_occurances_products_db();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  top_customers_orders_s: async params => {
    try {
      const users = await user_db.findAll_users_db({ deleted: false }, { _id: -1 }, "0", "1");
      const orders = await Promise.all(
        users.map(async user => {
          const orders = await order_db.findAll_orders_db({ deleted: false, user: user._id }, { _id: -1 }, "0", "1");
          const amount = orders.reduce((total, c) => parseFloat(total) + parseFloat(c.totalPrice), 0);
          return {
            user,
            number_of_orders: orders.length,
            amount,
          };
        })
      );
      const sorted_orders = orders
        .map(order => {
          return {
            user: order.user,
            number_of_orders: order.number_of_orders,
            amount: order.amount,
          };
        })
        .sort((a, b) => (a.amount > b.amount ? -1 : 1))
        .slice(0, 20);
      return sorted_orders;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  category_occurrences_orders_s: async params => {
    try {
      const sort = {};
      const filter = { deleted: false, user: params._id };
      const limit = "50";
      const page = "1";
      const orders = await order_db.findAll_orders_db(filter, sort, limit, page);
      const products = [];
      const ids = [];
      orders.forEach(order => {
        order.orderItems.map(item => {
          products.push(item.category);
          ids.push(item._id);
          if (item.secondary_product) {
            products.push(item.secondary_product.category);
            ids.push(item.secondary_product._id);
          }
        });
      });
      // //
      const result = {};
      const ids_result = {};
      for (let i = 0; i < products.length; ++i) {
        if (!result[products[i]]) {
          result[products[i]] = 0;
          ids_result[ids[i]] = 0;
        }
        ++result[products[i]];
        ++ids_result[ids[i]];
      }
      // //
      const final_result = [];
      for (const i in result) {
        const entry = { category: i, occurrence: result[i], id: ids_result[i] };
        final_result.push(entry);
      }
      final_result.sort((a, b) => (a.occurrence > b.occurrence ? -1 : 1));
      return final_result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },

  tax_rates_orders_s: async query => {
    const { state, country } = query;

    try {
      // Fetch the sales tax for the given state and country
      const taxInfo = await SalesTax.getSalesTax(country, state);

      // Prepare the result based on the fetched tax information
      if (taxInfo && taxInfo.rate !== undefined) {
        // Constructing an object with relevant tax information
        const result = {
          state,
          country,
          taxRate: `${taxInfo.rate * 100}%`,
          type: taxInfo.type, // Assuming you might be interested in the type of tax (VAT, GST, etc.)
          area: taxInfo.area, // Useful if you want to know the tax jurisdiction area (national, regional, worldwide)
        };

        return result;
      } else {
        return { error: "Tax rate information not available" };
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },

  eligible_for_review_orders_s: async body => {
    try {
      const sort = {};
      const filter = {
        deleted: false,
        ...body,
      };
      const limit = "0";
      const page = "1";
      return await order_db.findAll_orders_db(filter, sort, limit, page);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },

  invoice_orders_s: async id => {
    try {
      return await order_db.findById_orders_db(id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_product_quantities_orders_s: async () => {
    try {
      return await order_db.get_product_quantities_orders_db();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_all_shipping_orders_s: async () => {
    try {
      return await order_db.get_all_shipping_orders_db();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_all_time_revenue_orders_s: async () => {
    try {
      return await order_db.get_all_time_revenue_orders_db();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_product_range_revenue_orders_s: async (params, query) => {
    try {
      const { start_date, end_date } = query;
      return await order_db.get_product_range_revenue_orders_db(params.product_id, start_date, end_date);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_all_product_range_revenue_orders_s: async query => {
    try {
      const { start_date, end_date } = query;
      return await order_db.get_all_product_range_revenue_orders_db(start_date, end_date);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_range_revenue_orders_s: async query => {
    try {
      const { start_date, end_date } = query;
      return await order_db.get_range_revenue_orders_db(start_date, end_date);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_daily_revenue_orders_s: async query => {
    try {
      const { start_date, end_date } = query;
      return await order_db.get_daily_revenue_orders_db(start_date, end_date);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_monthly_revenue_product_orders_s: async (params, query) => {
    const { year } = query;
    const { product_id } = params;
    try {
      return await order_db.get_monthly_revenue_product_orders_db(year, product_id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_yearly_revenue_product_orders_s: async params => {
    const { product_id } = params;
    try {
      return await order_db.get_yearly_revenue_product_orders_db(product_id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_monthly_revenue_orders_s: async query => {
    const { year } = query;
    try {
      return await order_db.get_monthly_revenue_orders_db(year);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_yearly_revenue_orders_s: async () => {
    try {
      return await order_db.get_yearly_revenue_orders_db();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_range_category_revenue_orders_s: async query => {
    try {
      const { start_date, end_date } = query;
      return await order_db.get_range_category_revenue_orders_db(start_date, end_date);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_all_time_category_revenue_orders_s: async () => {
    try {
      return await order_db.get_all_time_category_revenue_orders_db();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_all_time_tips_revenue_orders_s: async () => {
    try {
      return await order_db.get_all_time_tips_revenue_orders_db();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_range_gloves_data_orders_s: async query => {
    const { start_date, end_date } = query;
    try {
      return await order_db.get_range_gloves_data_orders_db(start_date, end_date);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  get_range_tips_reveune_orders_s: async query => {
    try {
      const { start_date, end_date } = query;
      return await order_db.get_range_tips_revenue_orders_db(start_date, end_date);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  affiliate_earnings_s: async query => {
    const { start_date, end_date } = query;

    // Retrieve affiliates
    const a_filter = { deleted: false, active: true };
    const affiliates = await affiliate_db.findAll_affiliates_db(a_filter, {}, "0", "1");

    const filtered_affiliates = affiliates.filter(affiliate => {
      return affiliate.sponsor === true || affiliate.promoter === true;
    });

    const affiliateEarnings = await Promise.all(
      filtered_affiliates.map(async affiliate => {
        const promo_code = affiliate?.public_code?.promo_code;
        const sponsor = affiliate.sponsor;
        const sponsorTeamCaptain = affiliate.sponsorTeamCaptain;
        const affiliateMetrics = await getCodeUsage({
          promo_code,
          start_date,
          end_date,
          sponsor,
          sponsorTeamCaptain,
        });

        return {
          ...affiliateMetrics,
          artist_name: affiliate.artist_name,
        };
      })
    );

    return affiliateEarnings;
  },
  code_usage_orders_s: async (params, query) => {
    const { start_date, end_date, sponsor, sponsorTeamCaptain } = query;
    const { promo_code } = params;
    try {
      const { number_of_uses, revenue, earnings } = await getCodeUsage({
        promo_code,
        start_date,
        end_date,
        sponsor,
        sponsorTeamCaptain,
      });
      return { number_of_uses, revenue, earnings };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  monthly_code_usage_orders_s: async (params, query) => {
    const { start_date, end_date, sponsor, sponsorTeamCaptain } = query;
    const { promo_code } = params;
    try {
      const monthlyEarnings = await getMonthlyCodeUsage({
        promo_code,
        start_date,
        end_date,
        sponsor,
        sponsorTeamCaptain,
      });

      return monthlyEarnings;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  remove_multiple_orders_s: async body => {
    try {
      return await order_db.remove_multiple_orders_db(body.ids);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  update_multiple_status_orders_s: async body => {
    const { ids, status } = body;
    try {
      return await order_db.update_multiple_status_orders_db({ ids, status });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  transfer_orders_s: async params => {
    const { oldUserId, newUserId } = params;

    try {
      const orders = await Order.find({ user: oldUserId });

      if (!orders) {
        throw new Error("No orders found for the old user");
      }

      const updatedOrders = await Promise.all(
        orders.map(async order => {
          order.user = newUserId;
          return order.save();
        })
      );

      return updatedOrders;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  sample_testing_orders_s: async body => {
    const { cartItems } = body;
    const users = [
      "5f2d7c0e9005a57059801ce8", // Kurt LaVacque S
      "5f93cb1e7f9e40002a736df7", // Keith Booher XL
      "610244349fb496002a222c7d", // Cody Chau S
      "5f65757db5dd3d002a5fc474", // Nicolas McClain L
      "5f6a7891f8bfc0002ab4904b", // Joseph Cosmo L
      "600a151a3a0d3c002a9216e4", // Mckinnley Riojas L
      "6053f4b5fa20db002a1d00f3", // Adam Barlet L
      "60ae85667df9a9002a1611d8", // Derek Ward L
      "63771ba2927e460029580d16", // Kevin Cablay L
      "63c0a57b8fab120004b8d2cd", // Cristina Moskewicz S
      "60243f3afe97542f0f15d665", // Dustin Chau M
      "5fc91b9d231358002a003b21", // Gian Weiss S
      "61e3bb71b1b687002bab24ac", // Mathew Howk XXL
    ];
    try {
      for (const userId of users) {
        // Fetch user details
        const user = await User.findById(userId);
        if (!user) {
          console.log(`User with id ${userId} not found`);
          continue;
        }

        // Create a new order for the user
        const order = new Order({
          user: userId,
          orderItems: cartItems,
          shipping: user.shipping,
          totalPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          status: { $nin: ["unpaid", "canceled"] },
          paidAt: Date.now(),
          // Add other necessary fields here
        });

        // Save the order
        await order.save();
      }
      return "Success";
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
  pay_order_s: async (id, paymentMethod) => {
    try {
      const order = await Order.findById(id);
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status !== "unpaid") {
        throw new Error("Order is not in unpaid status");
      }

      const updatedOrder = await processPayment(id, paymentMethod, order.totalPrice);

      // Send order confirmation emails
      await sendOrderEmail(updatedOrder);
      if (updatedOrder.orderItems.some(item => item.itemType === "ticket")) {
        await sendTicketEmail(updatedOrder);
      }
      if (updatedOrder.orderItems.some(item => item.itemType === "gift_card")) {
        await sendGiftCardEmail(updatedOrder);
      }

      // Handle promo code if it exists
      if (updatedOrder.promo && updatedOrder.promo.length !== 16) {
        await promo_services.update_code_used_promos_s({ promo_code: updatedOrder.promo.promo_code });
        await sendCodeUsedEmail(updatedOrder.promo.promo_code);
      }

      // Handle gift cards if they exist
      if (updatedOrder.giftCard) {
        // Single gift card
        try {
          await useGiftCard(updatedOrder.giftCard.code, updatedOrder.giftCard.amountUsed, id);
        } catch (error) {
          console.error("Error applying gift card:", error);
        }
      } else if (updatedOrder.giftCards && updatedOrder.giftCards.length > 0) {
        // Array of gift cards
        await Promise.all(
          updatedOrder.giftCards.map(async giftCard => {
            try {
              await useGiftCard(giftCard.code, giftCard.amountUsed, id);
            } catch (error) {
              console.error(`Error applying gift card ${giftCard.code}:`, error);
            }
          })
        );
      }

      return updatedOrder;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  },
};
