const express = require('express')
const cookieParser = require("cookie-parser");
const user = require('./Api/user');
const Shop = require('./Api/Shop.js');
const order = require('./Api/order.js');
const payment = require('./Api/payment.js');
const product = require('./Api/product.js');
const cart = require('./Api/cart.js');
const bodyParser = require('body-parser');

// for webhook
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const CartModule = require("./Models/cart.js");
const paymentDetails = require("./Models/PaymentSucceed.js");

const cors = require("cors");
require("dotenv").config()
require("./Database/conectmongodb.js");

const app = express()
const port = process.env.PORT | 8000

app.use(cookieParser());
app.use(cors());
app.use("/api", (express.json()), user);
app.use("/api", (express.json()), Shop);
app.use("/api", (express.json()), order);
app.use("/api", (express.json()), payment);
app.use("/api", (express.json()), product);
app.use("/api", (express.json()), cart);

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/webhooks', bodyParser.raw({ type: 'application/json' }), async (request, response) => {
    const body = request.body;
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            endpointSecret
        );

    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        console.log("Webhook Error: ", err);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.async_payment_failed':
            const checkoutSessionAsyncPaymentFailed = event.data.object;
            break;
        case 'checkout.session.completed':
            const checkoutSessionCompleted = event.data.object;
            handleCheckoutSession(checkoutSessionCompleted);
            // Then define and call a function to handle the event checkout.session.completed
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

// This function is called when a checkout session is completed.
const handleCheckoutSession = async (session) => {
    const userId = session.client_reference_id;

    const CartItems = await CartModule.findOne({ user: userId });

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
            ShippingAddress: session.shipping_details.address ?
                session.shipping_details.address.city + " " + session.shipping_details.address.line1 + " " + session.shipping_details.address.line2 + " " + session.shipping_details.address.postal_code + " " + session.shipping_details.address.state + " " + session.shipping_details.address.country :
                "null",
        });
        await newpayment.save();
    });

    // Clear items from cart after purchase.
    CartItems.items = [];
    CartItems.subTotal = 0;
    await CartItems.save();

};

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})