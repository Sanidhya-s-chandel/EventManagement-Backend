const cloudinary = require("@config/cloudinary.config");

const deleteFromCloudinary = async (imageUrl) => {

    try {

        if (!imageUrl) return;

        const urlParts = imageUrl.split("/");
        const fileWithExtension = urlParts[urlParts.length - 1];

        const publicIdWithoutExtension = fileWithExtension.split(".")[0];

        const folderPath = urlParts
            .slice(urlParts.indexOf("upload") + 2, -1)
            .join("/");

        const publicId = `${folderPath}/${publicIdWithoutExtension}`;

        console.log(`Deleting Cloudinary Asset: ${publicId}`);

        await cloudinary.uploader.destroy(publicId);

        console.log("Cloudinary asset deleted successfully.");

    } catch (error) {

        console.error("Cloudinary delete failed:", error.message);
    }
};

module.exports = deleteFromCloudinary;