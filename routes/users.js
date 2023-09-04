import User from "../models/user.js";
import { auth, isUser, isAdmin } from "../middleware/auth.js";
import moment from "moment";
import express from "express";

const usersRoute = express();

//GET ALL USERS
usersRoute.get("/", isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ _id: -1 });
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

//DELETE
usersRoute.delete("/:id", isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    res.status(200).send(deletedUser);
  } catch (err) {
    res.status(500).send(err);
  }
});

usersRoute.get("/find/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

//UPDATE USER

usersRoute.put("/:id", isUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!(user.email === req.body.email)) {
      const emailInUse = await User.findOne({ email: req.body.email });
      if (emailInUse)
        return res.status(400).send("that email is already taken...");
    }
    if (req.body.password && user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      user.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        isAdmin: req.body.isAdmin,
        password: req.body.password,
      },
      { new: true }
    );
    res.status(200).send({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

usersRoute.get("/stats", isAdmin, async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYY-MM-DD HH:MM:SS");

  try {
    const users = await User.aggregate([
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
    res.status(200).send(users);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

export default usersRoute;
