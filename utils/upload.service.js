const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("@config/cloudinary.config");

const storage = new CloudinaryStorage({
    cloudinary,

    params: async (req, file) => {

        let folder = "Misc";

        switch (file.fieldname) {

            case "profileImage":
                folder = "Profiles";
                break;

            case "icon":
                folder = "Categories";
                break;

            case "bannerImage":
                folder = "Events/Banners";
                break;

            case "galleryImages":
                folder = "Events/Gallery";
                break;

            case "paymentProof":
                folder = "Payments";
                break;

            default:
                folder = "Misc";
        }

        return {
            folder: `Event-Management/${folder}`,
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            resource_type: "image",

            transformation: [
                {
                    width: 800,
                    crop: "scale"
                },
                {
                    quality: "auto"
                },
                {
                    fetch_format: "auto"
                }
            ]
        };
    }
});

module.exports = multer({ storage });