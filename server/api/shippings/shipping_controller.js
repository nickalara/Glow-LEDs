import shipping_services from "./shipping_services.js";

export default {
  buy_label_shipping_c: async (req, res) => {
    const { params } = req;

    try {
      const shipping = await shipping_services.buy_label_shipping_s(params);
      if (shipping) {
        console.log("ordersChanged socket triggered");
        req.io.emit("ordersChanged");
        return res.status(200).send(shipping);
      }
      return res.status(404).send({ message: "Shipping Not Found" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error Finding Shipping";
      res.status(500).send({ error, message: errorMessage });
    }
  },
  create_label_shipping_c: async (req, res) => {
    const { params } = req;
    try {
      const shipping = await shipping_services.create_label_shipping_s(params);
      if (shipping) {
        return res.status(200).send(shipping);
      }
      return res.status(404).send({ message: "Shipping Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  refund_label_shipping_c: async (req, res) => {
    const { params } = req;
    try {
      const shipping = await shipping_services.refund_label_shipping_s(params);
      if (shipping) {
        console.log("ordersChanged socket triggered");
        req.io.emit("ordersChanged");
        return res.status(200).send(shipping);
      }
      return res.status(404).send({ message: "Shipping Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  create_tracker_shipping_c: async (req, res) => {
    const { params } = req;
    try {
      const shipping = await shipping_services.create_tracker_shipping_s(params);
      if (shipping) {
        console.log("ordersChanged socket triggered");
        req.io.emit("ordersChanged");
        return res.status(200).send(shipping);
      }
      return res.status(404).send({ message: "Shipping Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },

  initiate_return_exchange_shipping_c: async (req, res) => {
    const { params, query, body } = req;
    try {
      const shipping = await shipping_services.initiate_return_exchange_shipping_s(params, query, body);
      if (shipping) {
        console.log("ordersChanged socket triggered");
        req.io.emit("ordersChanged");
        return res.status(200).send(shipping);
      }
      return res.status(500).send({ message: "Error Updating Shipping" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  generate_csv_label_shipping_c: async (req, res) => {
    const { params } = req;
    try {
      const shipping = await shipping_services.generate_csv_label_shipping_s(params);
      if (shipping) {
        return res.status(200).send(shipping);
      }
      return res.status(500).send({ message: "Error Updating Shipping" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  shipments_shipping_c: async (req, res) => {
    try {
      const shipping = await shipping_services.shipments_shipping_s();
      if (shipping) {
        return res.status(200).send(shipping);
      }
      return res.status(500).send({ message: "Error Updating Shipping" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  create_pickup_shipping_c: async (req, res) => {
    const { body } = req;
    try {
      const shipping = await shipping_services.create_pickup_shipping_s(body);
      if (shipping) {
        return res.status(200).send(shipping);
      }
      return res.status(500).send({ message: "Error Updating Shipping" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  confirm_pickup_shipping_c: async (req, res) => {
    const { body } = req;
    try {
      const shipping = await shipping_services.confirm_pickup_shipping_s(body);
      if (shipping) {
        return res.status(200).send(shipping);
      }
      return res.status(500).send({ message: "Error Updating Shipping" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  verify_address_shipping_c: async (req, res) => {
    const { body } = req;

    try {
      const shipping = await shipping_services.buy_label_shipping_s(body);
      if (shipping) {
        return res.status(200).send(shipping);
      }
      return res.status(404).send({ message: "Shipping Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  different_shipping_rates_shipping_c: async (req, res) => {
    const { params } = req;

    try {
      const shipping = await shipping_services.different_shipping_rates_shipping_s(params);
      if (shipping) {
        return res.status(200).send(shipping);
      }
      return res.status(500).send({ message: "Error Updating Shipping" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  custom_shipping_rates_shipping_c: async (req, res) => {
    const { body } = req;
    try {
      const shipping = await shipping_services.custom_shipping_rates_shipping_s(body);
      if (shipping) {
        return res.status(201).send(shipping);
      }
      return res.status(500).send({ message: "Error Creating Shipping" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
  create_custom_label_shipping_c: async (req, res) => {
    const { body } = req;
    try {
      const shipping = await shipping_services.create_custom_label_shipping_s(body);
      if (shipping) {
        return res.status(201).send(shipping);
      }
      return res.status(500).send({ message: "Error Creating Shipping" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },

  shipping_rates_shipping_c: async (req, res) => {
    const { body } = req;
    try {
      const shipping = await shipping_services.shipping_rates_shipping_s(body);

      if (shipping) {
        return res.status(200).send(shipping);
      }
      return res.status(200).send({ message: "Error Updating Shipping" });
    } catch (error) {
      res.status(200).json({ error, message: error.message });
    }
  },

  link_external_tracking_shipping_c: async (req, res) => {
    const { params, body } = req;
    try {
      const shipping = await shipping_services.link_external_tracking_shipping_s(params, body);
      if (shipping) {
        console.log("ordersChanged socket triggered");
        req.io.emit("ordersChanged");
        return res.status(200).send(shipping);
      }
      return res.status(404).send({ message: "Shipping Not Found" });
    } catch (error) {
      res.status(500).send({ error, message: error.message });
    }
  },
};
