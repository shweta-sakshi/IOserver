const mongoose = require("mongoose");
require("dotenv").config()
const { ObjectId } = mongoose.Schema.Types
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keySecret = process.env.SECRETKEY;

//Schema:
const User = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: Number,
        require: true,
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
        type: String,
        default: ""
    },
    role: {
        type: String,
        default: "User",
    },
    Avatar: {
        type: String,
        default:
            "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
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
User.pre("save", async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
        this.cpassword = await bcrypt.hash(this.cpassword, 12);
    }

    next()
});

//Token generator
User.methods.generateAuthtoken = async function () {/* add generateAuthtoken method to usrSchema */
    try {
        //create JWT for authentication
        let token1 = jwt.sign({ _id: this._id }, keySecret, {
            //token expire after one day
            expiresIn: "1d"
        });

        //adding value to the token array of user schema
        this.tokens = this.tokens.concat({ token: token1 })
        await this.save();
        return token1;

    } catch (err) {
        console.log(`in gernerateAuthtoken ${err}`);
        res.status(422).json(err);
    }
}

//creating model in collection Called User using User and store it in usrdb variable
const usrdb = new mongoose.model("Users", User);

module.exports = usrdb;