const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('@config/cloudinary.config');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'Event-Management/Profiles',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            resource_type: 'image',
            transformation: [
                { width: 800, crop: "scale" },
                { quality: "auto" },
                { fetch_format: "auto" },
            ],
        };
    },
});


const upload = multer({ storage });

module.exports = upload;