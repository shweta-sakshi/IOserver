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

//A webhook is a way for backend to receive real-time updates from an external service 
// without needing to request data repeatedly.

router.post('/webhooks', express.raw({ type: 'application/json' }), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.async_payment_failed':
            const checkoutSessionAsyncPaymentFailed = event.data.object;
            console.log("checkout.session.async_payment_failed", checkoutSessionAsyncPaymentFailed);
            // Then define and call a function to handle the event checkout.session.async_payment_failed
            break;
        case 'checkout.session.completed':
            const checkoutSessionCompleted = event.data.object;
            console.log("checkout.session.completed", checkoutSessionCompleted);
            handleCheckoutSession(checkoutSessionCompleted);
            // Then define and call a function to handle the event checkout.session.completed
            break;
        // other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

const handleCheckoutSession = async (session) => {
    const userId = session.client_reference_id;
    console.log("inside handleCheckoutSession" + userId);

    const CartItems = await Cart.findOne({ user: userId });

    // Save payment details in database.
    CartItems.items.map(async (item) => {
        const newpayment = new paymentDetails({
            user: userId,
            paymentId: session.id,
            item: {
                productId: item.productId,
                pname: item.pname,
                photo: item.photo,
                number: item.number,
                price: item.price,
            },
            paymentStatus: "success",
            ShippingAddress: session.shipping ? session.shipping.address : null,
        });
        await newpayment.save();
    });

    console.log("Payment details saved");


    // Clear items from cart after purchase.
    CartItems.items = [];
    CartItems.subTotal = 0;
    await CartItems.save();

    console.log("Cart items cleared");
};

router.get(
    "/stripeapikey",
    catchAsyncErrors(async (req, res, next) => {
        res.status(200).json({ stripeApikey: process.env.STRIPE_API_KEY });
    })
);


module.exports = router;