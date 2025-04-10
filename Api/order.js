const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../Middleware/catchAsyncErrors");
const { authenticate, authenticateSeller } = require("../Middleware/authentication");
const Order = require("../Models/orderSchema");
const Shop = require("../Models/shopSchema");
const Product = require("../Models/productSchema");

// create new order
router.post(
    "/create-order",
    authenticate,
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

            // group cart items by shopId
            const shopItemsMap = new Map();

            for (const item of cart) {
                const shopId = item.shopId;
                if (!shopItemsMap.has(shopId)) {
                    shopItemsMap.set(shopId, []);
                }
                shopItemsMap.get(shopId).push(item);
            }

            // create an order for each shop
            const orders = [];

            for (const [shopId, items] of shopItemsMap) {
                const order = await Order.create({
                    cart: items,
                    shippingAddress,
                    user,
                    totalPrice,
                    paymentInfo,
                });
                orders.push(order);
            }

            res.status(201).json({
                success: true,
                orders,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// get all orders of seller
router.get(
    "/get-seller-all-orders/:shopId",
    authenticate,
    catchAsyncErrors(async (req, res, next) => {
        try {
            const orders = await Order.find({
                "cart.shopId": req.params.shopId,
            }).sort({
                createdAt: -1,
            });

            res.status(200).json({
                success: true,
                orders,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

//get orders of user.
router.get('/orders', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await paymentDetails.find({ user: userId });
        res.status(201).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(400).json({ error });
    }
})

module.exports = router;