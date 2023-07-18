import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;
    const cart = [];
    // validations...
    if (!name) {
      return res.send({ message: "Name is required." });
    }
    if (!email) {
      return res.send({ message: "Email is required." });
    }
    if (!password) {
      return res.send({ message: "Password is required." });
    }
    if (!phone) {
      return res.send({ message: "Phone no. is required." });
    }
    if (!address) {
      return res.send({ message: "Address is required." });
    }
    if (!answer) {
      return res.send({ message: "Answer is required." });
    }
    // check user...
    const existingUser = await userModel.findOne({ email });
    // existing user
    if (existingUser) {
      return res.status(200).json({
        success: false,
        message: "Already Registered Please login",
      });
    }
    // register user
    const hashedPassword = await hashPassword(password);
    // save
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
      cart,
    }).save();

    res.status(201).send({
      success: true,
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    // console.log(`Error in register controller: ${error}`);
    res.status(500).send({
      success: false,
      message: "Error in registration form",
      error,
    });
  }
};

// Login
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation...
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "Please enter email and password",
      });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Invalid Email or Password",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(404).send({
        success: false,
        message: "Invalid Email or Password",
      });
    }
    //token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).send({
      success: true,
      message: "login successfully",
      user: {
        // _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        cart: user.cart,
      },
      token,
    });
  } catch (error) {
    // console.log(`Error in login: ${error}`);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

// update cart
const addItemToCartController = async (req, res) => {
  try {
    const { email, product } = req.body;
    const user = await userModel.findOne({ email });
    if (user) {
      const cart = user.cart;
      cart.push(product);
      await userModel.findByIdAndUpdate(user._id, { cart: cart });
      res.status(200).send({
        success: true,
        message: "Cart updated successfully...",
        user,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Something went wrong...",
      error,
    });
  }
};

// deleteFromCart one item
const deleteFromCartController = async (req, res) => {
  try {
    const { email, productId } = req.body;
    const user = await userModel.findOne({ email });
    if (user) {
      const cart = user.cart;
      console.log(cart);
      let index = -1, cnt = -1;
      cart.forEach((item) => {cnt+=1; if(item===productId) {index = cnt}});
      cart.splice(index, 1);
      await userModel.findByIdAndUpdate(user._id, { cart: cart });
      res.status(200).send({
        success: true,
        message: "Item deleted from cart successfully...",
        user,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Something went wrong...",
      error,
    });
  }
};

// delete whole cart
const emptyCartController = async (req,res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({email});
    if(user){
      await userModel.findByIdAndUpdate(user._id, { cart: [] });
      res.status(200).send({
        success: true,
        message: "Item deleted from cart successfully...",
        user,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Something went wrong...",
      error,
    });
  }
}

// forgot password
const forogotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      res.status(404).send({ message: "Email is required" });
    }
    if (!answer) {
      res.status(404).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      res.status(404).send({ message: "New Password is required" });
    }
    // check...
    const user = await userModel.findOne({ email, answer });
    if (!user) {
      res.status(404).send({
        success: false,
        message: "Wrong email or answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Passwrod reset successfully...",
    });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong...",
      error,
    });
  }
};

// test...
const testController = async (req, res) => {
  // console.log("protected route");
  res.send("Protected route");
};

//update prfile
const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Passsword must be 6 character long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      success: false,
      message: "Error While Updating profile",
      error,
    });
  }
};

//orders getOne
const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};
//orders getAll
const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};

//order status
const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updateing Order",
      error,
    });
  }
};

export {
  registerController,
  loginController,
  addItemToCartController,
  deleteFromCartController,
  emptyCartController,
  testController,
  forogotPasswordController,
  updateProfileController,
  getAllOrdersController,
  getOrdersController,
  orderStatusController,
};
