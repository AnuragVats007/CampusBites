import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const CartPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  //total price
  const totalPrice = () => {
    try {
      let total = 0;
      cart?.map((item) => {
        total = total + item.price;
      });
      return total.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    } catch (error) {
      // console.log(error);
    }
  };
  //detele item
  const removeCartItem = async (pid) => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API}/api/auth/editcart`,
        {
          email: auth.user.email,
          productId: pid,
        }
      );
      if (res.data.success) {
        const myCart = cart.reduce(
          (acc, p) => {
            if (JSON.stringify(p._id) === JSON.stringify(pid)) {
              if (acc.count > 0) {
                acc.cart.push(p);
              }
              acc.count++;
            } else {
              acc.cart.push(p);
            }
            return acc;
          },
          { cart: [], count: 0 }
        );
        const myCart_ = myCart.cart;
        setCart(myCart_);
        localStorage.setItem("cart", JSON.stringify([...myCart_]));
        // changing size of cart
        localStorage.setItem("cartSize", JSON.stringify(myCart_?.length));
        window.location.reload(true);
      }
    } catch (error) {
      // console.log(error);
    }
  };

  //get payment gateway token
  const getToken = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/product/braintree/token`
      );
      setClientToken(data?.clientToken);
    } catch (error) {
      // console.log(error);
    }
  };
  // get cart
  async function fetchProducts(cartItems) {
    const cart = await Promise.all(
      cartItems.map(async (p) => {
        try {
          const res = await axios.get(
            `${process.env.REACT_APP_API}/api/product/get-productbyid/${p}`
          );
          return res.data.product;
        } catch (error) {
          console.error(`Error fetching product with ID ${p}:`, error);
          return null; // or some default value indicating an error
        }
      })
    );
    // 'cart' now contains an array of product data obtained from the API for each cart item
    return cart;
  }
  const getCart = async () => {
    const cartItems = JSON.parse(localStorage.getItem("cartItemsId"));
    const cart_ = await fetchProducts(cartItems);
    setCart([...cart_, ...cart]);
    localStorage.setItem("cart", JSON.stringify([...cart_, ...cart]));
  };
  useEffect(() => {
    getToken();
    if (JSON.parse(localStorage.getItem("isCartLoaded")) === 0) {
      getCart();
      localStorage.setItem("isCartLoaded", JSON.stringify(1));
    }
  }, [auth?.token]);

  //handle payments
  const handlePayment = async () => {
    try {
      setLoading(true);
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post(
        `${process.env.REACT_APP_API}/api/product/braintree/payment`,
        {
          nonce,
          cart,
        }
      );
      setLoading(false);
      localStorage.removeItem("cart");
      setCart([]);
      await axios.put(`${process.env.REACT_APP_API}/api/auth/deletecart`, {
        email: auth.user.email,
      });
      localStorage.setItem("cartSize", JSON.stringify(0));
      // console.log(auth);
      // if(auth?.user?.role===0)  // to check as orders can't be placed from admin accounts...
      navigate("/dashboard/user/orders");
      toast.success("Payment Completed Successfully ");
    } catch (error) {
      // console.log(error);
      setLoading(false);
    }
  };
  return (
    <Layout title={"Cart"}>
      <div className=" cart-page">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user
                ? "Hello Guest"
                : `Hello  ${auth?.token && auth?.user?.name}`}
              <p className="text-center">
                {/* {cart?.length
                  ? `You have ${cart.length} items in your cart ${
                      auth?.token ? "" : "please login to checkout !"
                    }`
                  : " Your Cart Is Empty"} */}
                {auth?.token
                  ? `You have ${cart.length} items in your cart.`
                  : "please login to checkout !"}
              </p>
            </h1>
          </div>
        </div>
        <div className="container ">
          <div className="row ">
            <div className="col-md-7  p-0 m-0">
              {cart?.map((p) => (
                <div className="row card flex-row" key={p._id}>
                  <div className="col-md-4">
                    <img
                      src={`${process.env.REACT_APP_API}/api/product/product-photo/${p._id}`}
                      className="card-img-top"
                      alt={p.name}
                      width="100%"
                      height={"130px"}
                    />
                  </div>
                  <div className="col-md-4">
                    <p>{p.name}</p>
                    <p>{p.description.substring(0, 30)}</p>
                    <p>Price : {p.price}</p>
                  </div>
                  <div className="col-md-4 cart-remove-btn">
                    <button
                      className="btn btn-danger"
                      onClick={() => removeCartItem(p._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-md-5 cart-summary ">
              <h2>Cart Summary</h2>
              <p>Total | Checkout | Payment</p>
              <hr />
              <h4>Total : {totalPrice()} </h4>
              {auth?.user?.address ? (
                <>
                  <div className="mb-3">
                    <h4>Current Address</h4>
                    <h5>{auth?.user?.address}</h5>
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  {auth?.token ? (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() =>
                        navigate("/login", {
                          state: "/cart",
                        })
                      }
                    >
                      Plase Login to checkout
                    </button>
                  )}
                </div>
              )}
              <div className="mt-2">
                {!clientToken || !auth?.token || !cart?.length ? (
                  ""
                ) : (
                  <>
                    <DropIn
                      options={{
                        authorization: clientToken,
                        paypal: {
                          flow: "vault",
                        },
                      }}
                      onInstance={(instance) => setInstance(instance)}
                    />

                    <button
                      className="btn btn-primary"
                      onClick={handlePayment}
                      disabled={loading || !instance || !auth?.user?.address}
                    >
                      {loading ? "Processing ...." : "Make Payment"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
