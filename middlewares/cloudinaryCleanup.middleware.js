const cloudinary = require("cloudinary").v2;

const getUploadedFiles = (req) => {
    const files = [];

    if (req.file) { files.push(req.file); }

    if (Array.isArray(req.files)) {
        files.push(...req.files);
    } else if (req.files && typeof req.files === "object") {
        for (const fileArray of Object.values(req.files)) {
            files.push(...fileArray);
        }
    }

    return [
        ...new Map(
            files
                .filter((file) => file.filename)
                .map((file) => [file.filename, file])
        ).values()
    ];
};

module.exports.cloudinaryCleanup = async (err, req, res, next) => {
    const files = getUploadedFiles(req);

    try {
        await Promise.all(
            files.map((file) =>
                cloudinary.uploader.destroy(file.filename, {
                    resource_type: file.resource_type || "image"
                })
            )
        );

        console.log("Cloudinary cleanup successful for files:", files.map((file) => file.filename));
    } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError);
    }

    next(err);
};
