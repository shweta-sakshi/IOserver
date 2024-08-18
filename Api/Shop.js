const express = require('express');
const path = require("path");
const router = new express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendMail = require("../utils/sendMail.js");
const sendShopToken = require("../utils/sendSellerToken.js");
const Shop = require("../Models/shopSchema.js");
const { authenticateSeller } = require("../Middleware/authentication.js");
const upload = require("../Middleware/multer.js");
const CatchAsyncErrors = require("../Middleware/catchAsyncErrors.js");
const uploadOnCloudinary = require("../utils/Cloudinary.js");
const ErrorHandler = require("../Middleware/error.js");
const fs = require("fs");

//for Seller registration
router.post("/seller-SignUp", upload.single("file"), async (req, res) => {
    // console.log(req.body);

    const { sname, email, phonenumber, password, cpassword, address, gstin } = req.body

    let cloudinaryResponse = null;

    if (!sname || !email || !phonenumber || !password || !cpassword || !address || !gstin) {
        console.log("fill all the details");
        res.status(422).json({ error: "fill all the details" });
    }

    try {
        const sellerEmail = await Shop.findOne({ email });

        if (sellerEmail) {
            console.log("user already exist");
            res.status(422).json({ error: "This Email/phone already Exist" });
        } else if (password != cpassword) {
            console.log("confirm password doesn't match")
            res.status(422).json({ error: "Confirm password doesn't match" });
        } else {
            if (req.file) {
                const localFilePath = req.file.path;
                // Upload the local file to Cloudinary
                cloudinaryResponse = await uploadOnCloudinary(localFilePath);
            }

            const finalSeller = {
                sname, email, phonenumber, password, cpassword, address, gstin,
                Avatar: cloudinaryResponse ? cloudinaryResponse.url : ""
            };

            console.log(finalSeller);
            //To verify Email account before creating user account
            const ActivationToken = createActivationToken(finalSeller);
            const activationUrl = `http://localhost:5173/seller/activation/${ActivationToken}`
            console.log(activationUrl)
            try {
                await sendMail({
                    email: finalSeller.email,
                    subject: "Activate your Chemical Hub Shop",
                    message: `Shop ${finalSeller.sname} will be activated when you click on the link within 5 minutes: ${activationUrl}`
                })
                res.status(201).json({
                    success: true,
                    message: "Please check your mail to activate Shop"
                })
            } catch (error) {
                console.log("here is the error in sending mail" + error)
                res.status(500).json(error);
            }

        }

    } catch (error) {
        console.log("error in here" + error)
        res.status(422).json(error);
    }
});

//create Shop Activation Token
const createActivationToken = (finalSeller) => {
    return jwt.sign(finalSeller, process.env.ACTIVATION_SECRETKEY, {
        expiresIn: "5m",
    })
}

//Activate Seller
router.post("/seller/activation", CatchAsyncErrors(async (req, res, next) => {
    console.log("verification start");
    try {
        const { activation_token } = req.body
        const newSeller = await jwt.verify(activation_token, process.env.ACTIVATION_SECRETKEY)

        if (!newSeller) {
            return next(new ErrorHandler("Invatid Token"))
        }

        const { sname, email, phonenumber, password, cpassword, address, gstin, Avatar } = newSeller

        const seller = await Shop.findOne({ email });
        if (seller) {
            res.status(400).json("Seller already exists");
        }

        const StoreSeller = await Shop({
            sname, phonenumber, email, password, cpassword, address, gstin, Avatar
        });

        await StoreSeller.save()

        try {
            await sendMail({
                email: email,
                subject: "Shop Activated",
                message: `${sname} Shop has been created successfully, Thankyou for choosing Chemical Hub`
            })
            res.status(201).json({
                success: true,
                message: "Shop created you can login now"
            })
        } catch (error) {
            console.log("error in sending msg" + error)
            return next(new ErrorHandler(error.message, 500))
        }

        sendShopToken(seller, 201, res); 

    } catch (error) {
        console.log(error)
        res.status(500).json(error.message);
    }
}))

//for seller Login
router.post("/seller-SignIn", async (req, res) => {

    const { email, password } = req.body

    if (!email || !password) {
        res.stataus(422).json({ message: "fill all the details" });
    }

    try {
        //changed
        const sellerValid = await Shop.findOne({ email: email });

        if (sellerValid) {
            const isMatch = await bcrypt.compare(password, sellerValid.password)

            if (!isMatch) {
                res.status(422).json({ message: "incorrect details" });
            } else {
                //we will be using JWT(token) for authentication through headers
                //Token generate
                const token = await sellerValid.generateAuthtoken();

                //we will use this token to generate cookie and use it in frontend

                //cookie generate
                res.cookie("sellercookie", token, {
                    expires: new Date(Date.now() + 9000000),
                    httpOnly: true
                });

                const result = {
                    sellerValid,
                    token
                }
                res.status(201).json({ status: 201, result });
            }
        }
    } catch (err) {
        res.status(401).json(err);
        console.log(`${err}`);
    }
})

//seller valid
router.get("/validseller", authenticateSeller, async (req, res) => {
    try {
        const ValidSellerOne = await Shop.findOne({ _id: req.sellerId });
        res.status(201).json({ status: 201, ValidSellerOne });
    } catch (err) {
        //console.log("err");
        res.status(401).json({ status: 401, err });
    }
});

//seller signout
//if seller doesn't have token then we can't logout them
router.get("/sellersignOut", authenticateSeller, async (req, res) => {
    try {

        //clear token
        req.rootSeller.tokens = req.rootSeller.tokens.filter((curelem) => {
            return curelem.token !== req.token
        });

        //clear cookie
        const cookies = Object.keys(req.cookies);
        cookies.forEach(cookie => {
            res.clearCookie(cookie, { path: "/" });
        });

        try {
            await req.rootSeller.save();
        } catch (error) {
            console.log("error while logout");
        }

        res.status(201).json({ status: 201, message: "Logout Complete" });

    } catch (error) {
        res.status(401).json({ status: 401, error });
    }
});

module.exports = router;


/* 
seller signup-->get activation token on mail---->click on activation link in mail---->
seller shop created---->seller get successful shop creation mail------>seller can login with the same mail-Id and password------>
sellers get verified---->token created in cookies--->seller can logout / can remain loggedin for 1 day----->
seller will be verified with token----->cookies will be deleted.
*/