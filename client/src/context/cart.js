import { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const CartContext = createContext();
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let res = localStorage.getItem("auth");
    if (res) {
      let userData = JSON.parse(res);
      const idList = userData.user.cart;

      // Use Promise.all to wait for all the promises to resolve
      const cartItemsPromises = idList.map(async (item) => {
        const p = await axios.get(
          `${process.env.REACT_APP_API}/api/product/get-productbyid/${item}`
        );
        return p.data.product; // Return the product, not pushing into cartItems
      });

      // Use Promise.all to wait for all the promises to resolve
      Promise.all(cartItemsPromises)
        .then((cartItems) => {
          setCart(cartItems); // Now you have the actual values in cartItems array
          console.log(cartItems);
        })
        .catch((error) => {
          console.error(error);
        });
    }

    // let existingCartItem = localStorage.getItem("cart");
    // if (existingCartItem) setCart(JSON.parse(existingCartItem));
  }, [cart]);

  return (
    <CartContext.Provider value={[cart, setCart]}>
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };
