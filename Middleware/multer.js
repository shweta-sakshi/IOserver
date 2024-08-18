const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './utils/StoreFiles')
    },
    filename: function (req, file, cb) {
        console.log("inside multer")
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname)
        console.log("file name created");
    }
})

const upload = multer({ storage: storage });
module.exports = upload;