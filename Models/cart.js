const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
            pname: { type: String, required: true },
            photo: { type: String, required: true, default: "https://3.imimg.com/data3/HT/AC/MY-8217758/chemical-reagent.jpg" },
            number: { type: Number, required: true },
            price: { type: Number, required: true },
            total: { type: Number, required: true }
        }
    ],
    subTotal: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now() }
})


module.exports = mongoose.model('Cart', cartSchema);