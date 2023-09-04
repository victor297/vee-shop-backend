import express from "express";
import cors from "cors";
import products from "./products.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import register from "./routes/register.js";
import login from "./routes/login.js";
import stripeRoute from "./routes/stripe.js";
import productRoute from "./routes/products.js";
import usersRoute from "./routes/users.js";
import orderRoute from "./routes/orders.js";

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

app.use("/api/register", register);
app.use("/api/login", login);
app.use("/api/stripe", stripeRoute);
app.use("/api/products", productRoute);
app.use("/api/users", usersRoute);
app.use("/api/orders", orderRoute);

app.get("/", (req, res) => {
  res.send("welcome to our online shop api");
});

app.get("/products", (req, res) => {
  res.send(products);
});

const port = process.env.PORT || 5000;
const uri = process.env.DB_URI;
app.listen(port, console.log(`server running on port ${port}`));

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connection Sucessful"))
  .catch((err) => console.log("mongoDB connection failed", err.messgae));
