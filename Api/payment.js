const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../Middleware/catchAsyncErrors");
const Order = require('../Models/orderSchema');
const { authenticate } = require("../Middleware/authentication");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/payment", authenticate,
    catchAsyncErrors(async (req, res, next) => {
        const { items, customer } = req.body;

        // Create a new Stripe Checkout session.
        try {
            const userId = String(req.userId);
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: items.map(item => ({
                    price_data: {
                        currency: 'inr',  // You can use any currency for testing
                        product_data: {
                            name: item.pname,
                        },
                        unit_amount: item.price * 100,
                    },
                    quantity: item.quantity,
                })),
                billing_address_collection: 'required',
                shipping_address_collection: {
                    allowed_countries: ['IN', 'US', 'CA'],
                },
                mode: 'payment',
                success_url: `${req.headers.origin}/success`,
                cancel_url: `${req.headers.origin}/cancel`,
                client_reference_id: userId,
            });

            // console.log("Stripe session created:", session);
            res.status(200).json({ id: session.id });
        } catch (error) {
            console.error("Error creating Stripe session:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    })
)

//A webhook is a way for your backend to receive real-time updates from an external service 
// without needing to request data repeatedly.

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        try {
            const userId = session.client_reference_id;
            const paymentId = session.id;
            const amountPaid = session.amount_total / 100; // Convert cents to INR
            const paymentStatus = session.payment_status;

            // Fetch line items to get product details
            const lineItems = await stripe.checkout.sessions.listLineItems(paymentId);

            const items = lineItems.data.map(item => ({
                productId: item.price.id,
                pname: item.description,
                price: item.amount_total / 100,
                quantity: item.quantity,
            }));

            // Save order in database
            const newOrder = new Order({
                userId,
                paymentId,
                items,
                totalAmount: amountPaid,
                paymentStatus: paymentStatus === "paid" ? "Completed" : "Pending"
            });

            await newOrder.save();
            console.log("✅ Order saved to database:", newOrder);

        } catch (error) {
            console.error("Error saving order:", error);
            return res.status(500).json({ error: "Failed to save order" });
        }
    }

    res.status(200).json({ received: true });
});

router.get(
    "/stripeapikey",
    catchAsyncErrors(async (req, res, next) => {
        res.status(200).json({ stripeApikey: process.env.STRIPE_API_KEY });
    })
);


module.exports = router;