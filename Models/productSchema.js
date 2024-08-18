const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    pname: {
        type: String,
        required: [true, "Please enter your product name!"],
    },
    description: {
        type: String,
        required: [true, "Please enter your product description!"],
    },
    category: {
        type: String,
        required: [true, "Please enter your product category!"],
    },
    quantity: {
        type: Number,
        unit: { type: String, required: true },
        required: true
    },
    manufacturing: {
        type: Date,
        required: true
    },
    expiry: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
    },
    photo: {
        type: String,
        default:
            "https://chemindigest.com/wp-content/uploads/2021/04/specialty-chemicals-6.jpg",
    },
    reviews: [
        {
            user: {
                type: Object,
            },
            rating: {
                type: Number,
            },
            comment: {
                type: String,
            },
            productId: {
                type: String,
            },
            createdAt: {
                type: Date,
                default: Date.now(),
            }
        },
    ],
    ratings: {
        type: Number,
    },
    shopId: {
        type: Object,
        ref: "Shops",
    },
    sold_out: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = mongoose.model("Products", productSchema);