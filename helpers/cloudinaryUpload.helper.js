const cloudinary = require('@config/cloudinary.config');

/**
 * Uploads a file (path, buffer, or base64 string) to Cloudinary.
 * @param {string|Buffer} file - The file path or base64 string.
 * @param {string} folder - Optional folder name in Cloudinary.
 * @returns {Promise<string>} - Resolves to the uploaded image URL.
 */


// Function to upload a single image
const uploadToCloudinary = async (file, folder = 'customers/profile_images') => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder,
            resource_type: 'image',
            transformation: [
                // { width: 300, height: 300, crop: 'fill' },   // Remove this line if you don't want to resize 
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ],
        });

        return result.secure_url;
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        throw new Error('Cloudinary upload failed');
    };
};

// Function to upload multiple images
const uploadImagesToCloudinary = async (imagePaths) => {
    const uploadedImageURLs = await Promise.all(
        imagePaths.map(imagePath => uploadToCloudinary(imagePath))
    );

    return uploadedImageURLs.filter(url => url !== null);
};

module.exports = { uploadToCloudinary, uploadImagesToCloudinary };