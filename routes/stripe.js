import express from "express";
import stripe from "stripe";
import dotenv from "dotenv";
import Order from "../models/order.js";
dotenv.config();

const Stripe = stripe(process.env.STRIPE_KEY);
const stripeRoute = express.Router();

stripeRoute.post("/create-checkout-session", async (req, res) => {
  const customer = await Stripe.customers.create({
    metadata: {
      userId: req.body.userId,
    },
  });

  const line_items = req.body.cartItems.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image.url],
          description: item.desc,
          metadata: {
            id: item.id,
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.cartQuantity,
    };
  });

  const session = await Stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "KE"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "usd",
          },
          display_name: "Free shipping",
          // Delivers between 5-7 business days
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 5,
            },
            maximum: {
              unit: "business_day",
              value: 7,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 1500,
            currency: "usd",
          },
          display_name: "Next day air",
          // Delivers in exactly 1 business day
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 1,
            },
          },
        },
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
    line_items,
    mode: "payment",
    customer: customer.id,
    success_url: `${process.env.CLIENT_URL}/checkout-success`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
  });

  // res.redirect(303, session.url);
  res.send({ url: session.url });
});

// Create order function

const createOrder = async (customer, data, lineItems) => {
  // const Items = JSON.parse(customer.metadata.cart);

  // const products = Items.map((item) => {
  //   return {
  //     productId: item.id,
  //     quantity: item.cartQuantity,
  //     name: item.name,
  //     price: item.price,
  //     brand: item.brand,
  //   };
  // });

  const newOrder = new Order({
    userId: customer.metadata.userId,
    customerId: data.customer,
    paymentIntentId: data.payment_intent,
    products: lineItems.data,
    subtotal: data.amount_subtotal,
    total: data.amount_total,
    shipping: data.customer_details,
    payment_status: data.payment_status,
  });

  try {
    const savedOrder = await newOrder.save();
    console.log("Processed Order:", savedOrder);
  } catch (err) {
    console.log(err);
  }
};

// Stripe webhoook
let webhookSecret;

stripeRoute.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    let signature = req.headers["stripe-signature"];
    let data;
    let eventType;

    // Check if webhook signing is configured.

    // webhookSecret =
    //   "whsec_2b00d512ffa157315174ffecc115686d383fd1ed0cc206a4dbb1ad1a95d97302";

    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;

      try {
        event = Stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
        console.log("webhook verified");
      } catch (err) {
        console.log(`Webhook error  ${err.message}`);
        res.status(400).send(`Webhook error:  ${err.message}`);
        return;
      }
      // Extract the object from the event.
      data = event.data.object;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data.object;
      eventType = req.body.type;
    }

    // Handle the checkout.session.completed event
    if (eventType === "checkout.session.completed") {
      Stripe.customers
        .retrieve(data.customer)
        .then((customer) => {
          // console.log(customer);
          // console.log(data);
          Stripe.checkout.sessions.listLineItems(
            data.id,
            {},
            function (err, lineItems) {
              console.log("line_items", lineItems);
              createOrder(customer, data, lineItems);
            }
          );
        })
        .catch((err) => console.log(err.message));
    }

    res.status(200).end();
  }
);
export default stripeRoute;
