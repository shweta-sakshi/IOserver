const express = require("express");
const { authenticate, authenticateSeller } = require("../Middleware/authentication");
const catchAsyncErrors = require("../Middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../Models/productSchema");
const Order = require("../Models/orderSchema");
const Shop = require("../Models/shopSchema.js")
const upload = require("../Middleware/multer.js");
const ErrorHandler = require("../utils/ErrorHandler");

// create product
router.post(
    "/create-product",
    authenticateSeller,
    upload.single("file"),
    catchAsyncErrors(async (req, res, next) => {
        const { pname, price, category, description, quantity, manufacturing, expiry } = req.body;
        let cloudinaryResponse = null;

        if (!pname || !price || !category || !quantity || !manufacturing || !expiry) {
            return res.status(422).json({ error: "Title and body required" });
        }
        try {
            // Check if file was uploaded and use the local file path\
            console.log("here is the information about file in backend")
            console.log(req.file)
            if (req.file) {
                const localFilePath = req.file.path;
                // Upload the local file to Cloudinary

                cloudinaryResponse = await uploadOnCloudinary(localFilePath);
            }

            const newProduct = new Product({
                pname, price, category, quantity, manufacturing, expiry, description,
                photo: cloudinaryResponse ? cloudinaryResponse.url : "",
                shop: req.rootSeller
            })

            newProduct.shop.password = undefined;
            newProduct.shop.cpassword = undefined;
            newProduct.shop.tokens = undefined;

            //save the post.
            const createProduct = await newProduct.save();

            //send success response.
            res.status(201).json({ status: 201, createProduct });

        } catch (error) {
            console.log(error)
            return next(new ErrorHandler(error.message, 500))
        }
    })
);

// get all products of a shop
router.get(
    "/get-all-products-shop/:id",
    catchAsyncErrors(async (req, res, next) => {
        try {
            console.log(`params: ${req.params}`)
            console.log(`this is body: ${req.body}`)
            const products = await Product.find({ shopId: req.params.id });

            res.status(201).json({
                success: true,
                products,
            });
        } catch (error) {
            console.log(error)
            req.send(400).json({ error })
        }
    })
);

// delete product of a shop
router.delete(
    "/delete-shop-product/:id",
    authenticateSeller,
    catchAsyncErrors(async (req, res, next) => {
        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return next(new ErrorHandler("Product is not found with this id", 404));
            }

            for (let i = 0; 1 < product.images.length; i++) {
                const result = await cloudinary.v2.uploader.destroy(
                    product.images[i].public_id
                );
            }

            await product.remove();

            res.status(201).json({
                success: true,
                message: "Product Deleted successfully!",
            });
        } catch (error) {
            return next(new ErrorHandler(error, 400));
        }
    })
);

// get all products
router.get(
    "/get-all-products",
    catchAsyncErrors(async (req, res, next) => {
        try {
            const products = await Product.find().sort({ createdAt: -1 });
            res.status(201).json({
                success: true,
                products,
            });
        } catch (error) {
            console.log(error)
            return next(new ErrorHandler(error, 400));
        }
    })
);

module.exports = router;