const cloudinary = require("cloudinary").v2;
const fs = require("fs");
require("dotenv").config()


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        console.log("upload a file on cloudinary");
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        //updated
        console.log("file uploaded on cloudinary")
        await fs.unlinkSync(localFilePath)

        return response;

    } catch (error) {
        console.log(error)
        await fs.unlinkSync(localFilePath)
        // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



module.exports = uploadOnCloudinary;