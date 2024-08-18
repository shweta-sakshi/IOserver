const mongoose = require('mongoose');
require("dotenv").config()

//storing connection string in DB variable
const DB = process.env.DBURL

//connecting to database
mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Database connected")).catch((errr) => {
    console.log(errr);
})