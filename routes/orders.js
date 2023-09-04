import Order from "../models/order.js";
import { auth, isUser, isAdmin } from "../middleware/auth.js";
import moment from "moment";
import express from "express";
const orderRoute = express();

//CREATE

// createOrder is fired by stripe webhook
// GET ORDERS

orderRoute.get("/", isAdmin, async (req, res) => {
  const query = req.query.new;
  try {
    const orders = query
      ? await Order.find().sort({ _id: -1 }).limit(4)
      : await Order.find().sort({ _id: -1 });
    res.status(200).send(orders);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

//UPDATE AN ORDER
orderRoute.put("/:id", isAdmin, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).send(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

orderRoute.get("/findOne/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (req.user._id === order.userId || !req.user.isAdmin)
      return res.status(403).send("access denied. Not authorized...");
    res.status(200).send(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET ORDERS STATS

orderRoute.get("/stats", isAdmin, async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYY-MM-DD HH:MM:SS");

  try {
    const orders = await Order.aggregate([
      {
        $match: { createdAt: { $gte: new Date(previousMonth) } },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).send(orders);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// GET INCOME SALES
orderRoute.get("/income/stats", isAdmin, async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYY-MM-DD HH:MM:SS");

  try {
    const income = await Order.aggregate([
      {
        $match: { createdAt: { $gte: new Date(previousMonth) } },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          sales: "$total",
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$sales" },
        },
      },
    ]);
    res.status(200).send(income);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
orderRoute.get("/week-sales", async (req, res) => {
  const last7Days = moment()
    .day(moment().day() - 7)
    .format("YYY-MM-DD HH:MM:SS");

  try {
    const income = await Order.aggregate([
      {
        $match: { createdAt: { $gte: new Date(last7Days) } },
      },
      {
        $project: {
          day: { $dayOfWeek: "$createdAt" },
          sales: "$total",
        },
      },
      {
        $group: {
          _id: "$day",
          total: { $sum: "$sales" },
        },
      },
    ]);
    res.status(200).send(income);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
export default orderRoute;
