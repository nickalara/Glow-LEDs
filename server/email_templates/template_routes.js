// *********************************************************************************
// html-routes.js - this file offers a set of routes for sending users to the various html pages
// *********************************************************************************

import App from "./App.js";
import AccountCreatedTemplate from "./pages/AccountCreatedTemplate.js";
import AffiliateTemplate from "./pages/AffiliateTemplate.js";
import AnnouncementTemplate from "./pages/AnnouncementTemplate.js";
import ContactTemplate from "./pages/ContactTemplate.js";
import ContactConfirmationTemplate from "./pages/ContactConfirmationTemplate.js";
import FeatureTemplate from "./pages/FeatureTemplate.js";
import OrderTemplate from "./pages/OrderTemplate.js";
import SuccessfulPasswordResetTemplate from "./pages/SuccessfulPasswordResetTemplate.js";
import ReviewTemplate from "./pages/ReviewTemplate.js";
import EmailSubscriptionTemplate from "./pages/EmailSubscriptionTemplate.js";
import OrderStatusTemplate from "./pages/OrderStatusTemplate.js";
import CustomContactTemplate from "./pages/CustomContactTemplate.js";
import CodeUsedTemplate from "./pages/CodeUsedTemplate.js";
import ShippingStatusTemplate from "./pages/ShippingStatusTemplate.js";
import VerifyEmailPasswordResetTemplate from "./pages/VerifyEmailPasswordResetTemplate.js";
import AffiliateOnboardingTemplate from "./pages/AffiliateOnboardingTemplate.js";
import express from "express";
import InvoiceTemplate from "./pages/InvoiceTemplate.js";
import order_db from "../api/orders/order_db.js";
import order_services from "../api/orders/order_services.js";
import content_db from "../api/contents/content_db.js";
import affiliate_db from "../api/affiliates/affiliate_db.js";
import promo_db from "../api/promos/promo_db.js";
import { make_private_code, months } from "../utils/util.js";
import user_db from "../api/users/user_db.js";
import { determine_status } from "../api/emails/email_interactors.js";
import email_db from "../api/emails/email_db.js";
import paycheck_db from "../api/paychecks/paycheck_db.js";
import CurrentStockTemplate from "./pages/CurrentStockTemplate.js";
import product_db from "../api/products/product_db.js";
import config from "../config.js";
import verify from "./pages/VerifyTemplate.js";
import { domain } from "./email_template_helpers.js";
import PaycheckTemplate from "./pages/PaycheckTemplate.js";
import TicketTemplate from "./pages/TicketTemplate.js";
import ReturnLabelTemplate from "./pages/ReturnLabelTemplate.js";
import Order from "../api/orders/order.js";

const router = express.Router();

router.get("/email_subscription", async (req, res) => {
  const contents = await content_db.findAll_contents_db({ deleted: false }, { _id: -1 }, "0", "1");
  const body = {
    email: config.CONTACT_EMAIL,
    promo_code: make_private_code(5),
    categories: contents && contents[0]?.menus[0]?.menu_items,
  };

  res.send(
    App({
      body: EmailSubscriptionTemplate({
        ...body,
        title: "Enjoy 10% off your next purchase!",
      }),
      unsubscribe: true,
    })
  );
});
router.get("/verify", async (req, res) => {
  const user = await user_db.findById_users_db("6379a4497212b9524b2a49b2");

  res.send(
    App({
      body: verify({
        title: "Verify your Email",
        url: `${domain()}/verify/123456`,
        user,
      }),

      unsubscribe: false,
    })
  );
});
router.get("/refund", async (req, res) => {
  const data = await order_db.findById_orders_db("625646bf3b0e10057d288e9b");
  // const data = await Order.findOne({ _id: "625644ee81243b01b485d360" })
  //   .populate("user")
  //   .populate("orderItems.product")
  //   .populate("orderItems.secondary_product");

  const body = {
    email: {
      show_image: true,
      active: true,
      deleted: false,
      email_type: "Order",
      h1: "Partial Refund Successful!",
      image: "",
      h2: "Your Order has been refunded for Duplicate Order on 12/10/2021",
      createdAt: "2020-11-19T16:24:12.273Z",
      updatedAt: "2021-07-06T18:52:09.037Z",
      images: [],
      p: "",
    },

    title: "Thank you for your purchase!",
    order: data,
  };
  res.send(App({ body: OrderTemplate(body), unsubscribe: false }));
});
router.get("/current_stock", async (req, res) => {
  const data = await product_db.current_stock_products_db();
  res.send(App({ body: CurrentStockTemplate(data) }));
});
router.get("/affiliate_onboard", async (req, res) => {
  const data = await user_db.findById_users_db("6527c4d2563238af50ee33aa");
  res.send(App({ body: AffiliateOnboardingTemplate(data) }));
});
router.get("/code_used", async (req, res) => {
  // const promo_code = "cosmo";
  // const date = new Date();
  // const monthNumber = date.getMonth();
  // const year = date.getFullYear();
  // const promo = await promo_db.findBy_promos_db({ promo_code, deleted: false });
  // const affiliate = await affiliate_db.findBy_affiliates_db({ public_code: promo?._id, deleted: false });
  // const stats = await order_services.affiliate_code_usage_orders_s(
  //   { promo_code },
  //   {
  //     month: months[monthNumber].toLowerCase(),
  //     year,
  //   }
  // );
  // res.send(
  //   App({
  //     body: CodeUsedTemplate({
  //       affiliate,
  //       number_of_uses: stats.number_of_uses,
  //       earnings: affiliate?.sponsor ? stats.revenue * 0.15 : stats.revenue * 0.1,
  //     }),
  //     title: "Welcome to the Team!",
  //   })
  // );
});
router.get("/paycheck", async (req, res) => {
  const paycheckDocument = await paycheck_db.findById_paychecks_db("656bc32d9701b7f4b9b9bd43");

  res.send(App({ body: PaycheckTemplate(paycheckDocument), unsubscribe: false }));
});
router.get("/order", async (req, res) => {
  const orderDocument = await order_db.findById_orders_db("676ec4d5ddcc3482552549d4");
  const body = {
    email: {
      show_image: true,
      active: true,
      deleted: false,
      email_type: "Order",
      h1: "Thank you for your purchase!",
      image: "",
      h2: "we are starting production on your order. We will notify your as your order progresses.",
      createdAt: "2020-11-19T16:24:12.273Z",
      updatedAt: "2021-07-06T18:52:09.037Z",
      images: [],
      p: "",
    },

    title: "Thank you for your purchase!",
    order: orderDocument,
  };
  res.send(App({ body: OrderTemplate(body), unsubscribe: false }));
});
router.get("/ticket", async (req, res) => {
  const body = {
    "email": {
      "h1": "Your Event Tickets",
      "h2": "Here are your QR codes for event entry.",
    },
    "order": {
      "shipping": {
        "first_name": "Kurt",
        "last_name": "LaVacque",
        "email": "siqymufo@pelagius.net",
        "address_1": "222 Gibson Lake Rd",
        "address_2": "",
        "city": "Crystal Falls",
        "state": "MI",
        "postalCode": "49920",
        "international": false,
        "country": "US",
      },
      "payment": {
        "refund": [],
        "refund_reason": [],
        "paymentMethod": "stripe",
        "payment": {},
        "charge": {},
      },
      "_id": "66df079b45e19055855ce506",
      "user": {
        "shipping": {},
        "_id": "6379a4497212b9524b2a49b2",
        "isAdmin": true,
        "isVerified": true,
        "is_affiliated": true,
        "is_employee": true,
        "palettes": [],
        "email_subscription": true,
        "deleted": false,
        "first_name": "Admin",
        "last_name": "test",
        "email": "admin@test.com",
        "password": "$2a$10$z99KsjpQmtQ.jzm0jsmtJu0eWHIkAMk3iNMvYbQbKAlHJBmuZjZzW",
        "createdAt": "2022-11-20T03:51:37.402Z",
        "updatedAt": "2024-08-24T15:52:07.917Z",
        "__v": 1,
        "guest": true,
        "cart": "642c3f469216481ed2708a92",
        "affiliate": "648626f7ad972f000246e9a8",
        "isWholesaler": false,
      },
      "orderItems": [{}, {}],
      "itemsPrice": 60,
      "taxPrice": 3.5999999999999996,
      "shippingPrice": 0,
      "totalPrice": 63.6,
      "status": "paid",
      "isReassured": false,
      "isRefunded": false,
      "isUpdated": true,
      "isPrintIssue": false,
      "isPaused": false,
      "isError": false,
      "isPrioritized": false,
      "guest": false,
      "parcel": null,
      "order_note": "",
      "production_note": "",
      "tip": 0,
      "promo_code": "",
      "is_error": false,
      "deleted": false,
      "messages": [],
      "payments": [],
      "refunds": [],
      "change_log": [{}],
      "createdAt": "2024-09-09T14:35:07.709Z",
      "updatedAt": "2024-09-09T17:28:22.028Z",
      "__v": 0,
      "paidAt": "2024-09-09T14:35:10.265Z",
    },
    "ticketQRCodes": [
      {
        "ticketType": "Space City Gloving Competition - Competitor Experience Pass",
        "qrCode":
          "data:image/png;base64,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",
      },
      {
        ticketType: "Space City Gloving Competition - Spectator Experience Pass",
        qrCode:
          "data:image/png;base64,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",
      },
    ],
  };

  res.send(App({ body: TicketTemplate(body), unsubscribe: false }));
});
router.get("/order_status", async (req, res) => {
  const orderDocument = await order_db.findById_orders_db("659cd96631c5c5730673e47b");
  const body = {
    email: {
      show_image: true,
      active: true,
      deleted: false,
      email_type: "Order",
      h1: "Thank you for your purchase!",
      image: "",
      h2: "your shipment is on the way! Track your shipment to see the delivery status.",
      createdAt: "2020-11-19T16:24:12.273Z",
      updatedAt: "2021-07-06T18:52:09.037Z",
      images: [],
      p: "",
    },

    title: "Thank you for your purchase!",
    status: "shipped",
    order: orderDocument,
  };
  res.send(App({ body: OrderStatusTemplate(body), unsubscribe: false }));
});
router.get("/shipping_status", async (req, res) => {
  const orderDocument = await order_db.findById_orders_db("64a11a605157930002f3eb94");
  const body = {
    email: {},
    status: "out_for_delivery",
    title: determine_status("out_for_delivery"),
    order: orderDocument,
  };
  res.send(App({ body: ShippingStatusTemplate(body), unsubscribe: false }));
});
router.get("/invoice", async (req, res) => {
  const orderDocument = await order_db.findById_orders_db("67c5efe129d63e5c7f6a10b2");
  const body = {
    email: {
      show_image: true,
      active: true,
      deleted: false,
      email_type: "Order",
      h1: "Thank you for your purchase!",
      image: "",
      h2: "we are starting production on your order. We will notify your as your order progresses.",
      createdAt: "2020-11-19T16:24:12.273Z",
      updatedAt: "2021-07-06T18:52:09.037Z",
      images: [],
      p: "",
    },

    title: "Thank you for your purchase!",
    order: orderDocument,
  };
  res.send(InvoiceTemplate(body));
});

router.get("/shipping_status", async (req, res) => {
  const orderDocument = await order_db.findById_orders_db("659cd96631c5c5730673e47b");
  const body = {
    email: {},
    status: "out_for_delivery",
    title: determine_status("out_for_delivery"),
    order: orderDocument,
  };
  res.send(App({ body: ShippingStatusTemplate(body), unsubscribe: false }));
});
router.get("/review", async (req, res) => {
  const contents = await content_db.findAll_contents_db({ deleted: false }, { _id: -1 }, "0", "1");
  const body = {
    email: config.CONTACT_EMAIL,
    promo_code: "xoteag",
    categories: contents && contents[0].home_page?.slideshow,
  };

  res.send(App({ body: ReviewTemplate(body), title: "Enjoy 10% off your next purchase!" }));
});
router.get("/affiliate", async (req, res) => {
  const body = {
    affiliate: {
      _id: "5f6a57dbf04766002a52230e",
      active: true,
      deleted: false,
      artist_name: "Cosmo",
      instagram_handle: "cosmoglover",
      facebook_name: "cosmoglover",
      percentage_off: 30,
      promo_code: "cosmo",
      createdAt: "2020-09-22T20:00:27.101Z",
      updatedAt: "2022-01-10T20:58:07.152Z",
      __v: 0,
      promoter: false,
      sponsor: true,
      user: "5f6a7891f8bfc0002ab4904b",
      picture: "https://thumbs2.imgbox.com/f7/ca/Su3FEQr9_t.jpg",
      bio: "I'm here for the flow.  Gaming, Magic the Gathering, Poi",
      inspiration: "Stunna, Flowsonn, Megasloth, Puppet",
      location: "Baytown, TX",
      years: "9",
      team: true,
      video: "k5GRzQ8683w",
      products: [
        "5f610da07279cf002a073d89",
        "5eb1eb29094a5e002a417d0a",
        "5f90e245454528002af7df4a",
        "5f90e21b454528002af7df42",
        "605008e3d2946c002a82c293",
        "5ff882654cb3b7002a667747",
        "5f90e202454528002af7df30",
        "600722965510ff002aceaeb0",
      ],
      microlights: [],
      pathname: "cosmo",
      private_code: {
        _id: "5f6a5a82f04766002a522310",
        excluded_categories: [],
        excluded_products: [],
        active: true,
        deleted: false,
        promo_code: "xcpwtv",
        for_customer: false,
        percentage_off: 50,
        createdAt: "2020-09-22T20:11:46.431Z",
        updatedAt: "2021-07-02T00:41:15.084Z",
        __v: 0,
        user: "5f6a7891f8bfc0002ab4904b",
        minimum_total: null,
        admin_only: false,
        affiliate_only: true,
        used_once: false,
        free_shipping: true,
      },
      public_code: {
        _id: "5f6a57ebf04766002a52230f",
        excluded_categories: [],
        excluded_products: [],
        active: true,
        deleted: false,
        promo_code: "cosmo",
        for_customer: true,
        percentage_off: 10,
        createdAt: "2020-09-22T20:00:43.566Z",
        updatedAt: "2021-12-09T03:40:49.329Z",
        __v: 0,
        minimum_total: 0,
        admin_only: false,
        affiliate_only: false,
        used_once: true,
        end_date: "2021-01-01T00:00:00.000Z",
        start_date: "2021-01-01T00:00:00.000Z",
        included_categories: [],
        included_products: [],
        sponsor_only: false,
      },
      venmo: "@joseph-conner-12",
    },
  };

  res.send(App({ body: AffiliateTemplate(body), title: "Welcome to the Team!" }));
});
router.get("/feature", async (req, res) => {
  const body = {
    feature: {
      _id: "609013742c7976002ad6f8b3",
      images: [],
      deleted: false,
      user: "60243f3bfe97542f0f15d668",
      artist_name: "lilwhip ",
      instagram_handle: "lilwhip_gloving ",
      facebook_name: "Dylan Arrazati",
      email: "arraz100@mail.chapman.edu",
      first_name: "Dylan",
      last_name: "Arrazati",
      song_id: "Song: Schedules, Artist: David Cutter Music ",
      link: "https://youtu.be/AHfQ2U5Gg4E",
      video: "QoagvTQgsJ8",
      description:
        "My name is Dylan Arrazati, but I go by lilwhip in the gloving community. I’m about to graduate with a bachelors in biochemistry and Spanish so that’s exciting. I also just hit the one year mark of my gloving journey, and I’m so excited to continue growing as a glover:) In the video I’m sharing, I’m using the frosted glowskinz for my atoms🙌🏼 I also have them for my spectras and both sets of skinz work amazing. ",
      pathname: "lilwhip _glovers_945",
      category: "glovers",
      createdAt: "2021-05-03T15:15:00.977Z",
      updatedAt: "2021-05-13T02:36:44.136Z",
      __v: 0,
      release_date: "2021-05-12T00:00:00.000Z",
    },
  };
  res.send(App({ body: FeatureTemplate(body), title: "Thank you for sending us your art!" }));
});
router.get("/announcement", async (req, res) => {
  const email = await email_db.findAll_emails_db({ deleted: false, active: true }, { _id: -1 }, "1", "1");

  res.send(
    App({
      body: AnnouncementTemplate(email[0]),
      unsubscribe: true,
      header_footer_color: email[0].header_footer_color,
      background_color: email[0].background_color,
    })
  );
});

router.get("/contact", (req, res) => {
  res.send(ContactTemplate(req.body));
});
router.get("/custom_contact", (req, res) => {
  const data = {
    first_name: "Kurt",
    last_name: "LaVacque",
    email: "lavacquek@icloud.com",
    order: {},
  };
  res.send(CustomContactTemplate(data));
});

router.get("/contact_confirmation", (req, res) => {
  res.send(ContactConfirmationTemplate(req.body));
});

router.get("/reset_password", async (req, res) => {
  const user = await user_db.findByEmail_users_db("lavacquek@icloud.com");
  res.send(App({ body: VerifyEmailPasswordResetTemplate(user), title: "Password Reset Instructions " }));
});
router.get("/reset_password", async (req, res) => {
  const user = await user_db.findById_users_db("5f2d7c0e9005a57059801ce8");
  res.send(App({ body: SuccessfulPasswordResetTemplate(user), title: "Password Reset Successful" }));
});
router.get("/account_created", async (req, res) => {
  const user = await user_db.findById_users_db("5f2d7c0e9005a57059801ce8");
  const contents = await content_db.findAll_contents_db({ deleted: false }, { _id: -1 }, "0", "1");
  const body = {
    user,
    categories: contents && contents[0]?.menus[0]?.menu_items,
  };

  res.send(App({ body: AccountCreatedTemplate(body), title: "Glow LEDs Account Created" }));
});

router.get("/return_label", async (req, res) => {
  const order = await Order.findOne({ "shipping.return_shipping_label": { $exists: true } });
  res.send(App({ body: ReturnLabelTemplate({ order, title: "Return Label" }) }));
});

export default router;
