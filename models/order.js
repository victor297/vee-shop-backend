import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    customerId: { type: String },
    paymentIntendId: { type: String },
    products: [
      // {
      //   productId: { type: String },
      //   quantity: { type: Number, default: 1 },
      //   name: { type: String },
      //   price: { type: String },
      //   brand: { type: String },
      // },
    ],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    shipping: { type: Object, required: true },
    delivery_status: { type: String, default: "pending" },
    payment_status: { type: String, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
