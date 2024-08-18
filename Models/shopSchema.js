const mongoose = require("mongoose");
require("dotenv").config()
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keySecret = process.env.SECRETKEY;

//ShopSchema
const ShopSchema = new mongoose.Schema({
    sname: {
        type: String,
        required: true,
        trim: true
    },
    phonenumber: {
        type: String,
        require: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        require: true,
        unique: true,
        minlength: 6
    },
    cpassword: {
        type: String,
        require: true,
        minlength: 6
    },
    address: {
        type: String
    },
    role: {
        type: String,
        default: "Seller",
    },
    Description: {
        type: String,
    },
    Avatar: {
        type: String,
        require: true,
    },
    gstin: {
        type: String,
        required: true,
    },
    withdrawMethod: {
        type: Object,
    },
    availableBalance: {
        type: Number,
        default: 0,
    },
    transections: [
        {
            amount: {
                type: Number,
                required: true,
            },
            status: {
                type: String,
                default: "Processing",
            },
            createdAt: {
                type: Date,
                default: Date.now(),
            },
            updatedAt: {
                type: Date,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    resetPasswordToken: String,
    resetPasswordTime: Date,
    //use at the time of login.
    tokens: [
        {
            token: {
                type: String,
                required: true,
            }
        }
    ]
});

//password hashing
ShopSchema.pre("save", async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
        this.cpassword = await bcrypt.hash(this.cpassword, 12);
    }

    next()
});

//Token generator
ShopSchema.methods.generateAuthtoken = async function (req, res) {/* add generateAuthtoken method to ShopSchema */
    try {
        //create JWT for authentication
        let token1 = jwt.sign({ _id: this._id }, keySecret, {
            //token expire after one day
            expiresIn: "1d"
        });

        //adding value to the token array of shopschema
        this.tokens = this.tokens.concat({ token: token1 })
        await this.save();
        return token1;

    } catch (err) {
        res.status(422).json(err);
    }
}

//creating model in collection Called shops using Shop and store it in shopdb variable
const shopdb = new mongoose.model("Shops", ShopSchema);

//To remove duplicate index.
// shopdb.collection.dropIndex('phonNumber_1', function (err, result) {
//     if (err) {
//         console.error("index not found");
//     } else {
//         console.log('Index dropped');
//     }
// })

module.exports = shopdb;