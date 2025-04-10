const express = require('express');
const router = express.Router();
const Cart = require('../Models/cart.js');
const { authenticate } = require('../Middleware/authentication.js');

// Add item to cart
router.post('/addtocart', authenticate, async (req, res) => {
    const { product } = req.body;
    let userCart = await Cart.findOne({ user: req.userId });
    if (!userCart) {
        const newCart = new Cart({ user: req.userId });
        await newCart.save();
        userCart = newCart;
    }

    try {
        const itemIndex = userCart.items.findIndex(item => item.productId.toString() === product._id);

        if (itemIndex != -1) {
            return res.status(200).json({ message: 'Item already added to cart' });
        } else {
            userCart.items.push({ productId: product._id, pname: product.pname, photo: product.photo, number: product.number, price: product.price, total: product.price * product.number });
            userCart.subTotal = userCart.items.map(item => item.total).reduce((acc, next) => acc + next);
            await userCart.save();
            res.status(201).json({ message: 'Item added to cart' });
        }

    } catch (error) {
        console.log("add to cart error: " + error);
    }
});

//get item from cart
router.get('/getitemsfromcart', authenticate, async (req, res) => {

    try {
        const CartItems = await Cart.findOne({ user: req.userId });
        // console.log(CartItems);
        if (CartItems)
            res.status(200).json({ CartItems, message: "cart item is fetched" })
        else
            res.status(201).json({ message: "No Items added to Cart" });
    } catch (error) {
        console.log(error);
        res.status(422).json({ error: error });
    }

});

// Remove item from cart
router.post('/removefromcart', authenticate, async (req, res) => {
    const { product } = req.body;
    const productId = product._id;

    try {
        const cart = await Cart.findOne({ user: req.userId });
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex !== -1) {

            cart.items.splice(itemIndex, 1);

            cart.subTotal = cart.items.length > 0
                ? cart.items.map(item => item.total).reduce((acc, next) => acc + next, 0)
                : 0;
            await cart.save();
            res.status(200).json({ message: 'Item removed from cart' });

        } else {
            res.status(404).json({ message: 'Item is no longer in cart' });
        }
    } catch (error) {
        console.log("error");
        console.log(error);
    }
});

module.exports = router;
