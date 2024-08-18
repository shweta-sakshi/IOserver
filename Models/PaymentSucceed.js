const mongoose = require('mongoose');

const paymentSucceededSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    paymentId: {
        type: String,
        required: true
    },
    item:
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
        pname: { type: String, required: true },
        photo: { type: String, required: true, default: "https://3.imimg.com/data3/HT/AC/MY-8217758/chemical-reagent.jpg" },
        number: { type: Number, required: true },
        price: { type: Number, required: true },
    },
    paymentStatus: {
        type: String,
        required: true
    },
    ShippingAddress: {
        type: String,
        required: true
    },
    DeliveryStatus: {
        type: String,
        default: "Order Placed"
    },
    paymentDate: {
        type: Date,
        default: Date.now()
    }
})

module.exports = new mongoose.model('PaymentSucceeded', paymentSucceededSchema);