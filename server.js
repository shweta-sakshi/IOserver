const express = require('express')
const cookieParser = require("cookie-parser");
const user = require('./Api/user');
const Shop = require('./Api/Shop.js');
const order = require('./Api/order.js');
const payment = require('./Api/payment.js');
const product = require('./Api/product.js');
const cart = require('./Api/cart.js');
const bodyParser = require('body-parser');

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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})