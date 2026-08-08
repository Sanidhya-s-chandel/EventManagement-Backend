const response = require("@helpers/response.helper");
const AppError = require("@helpers/AppError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");
const { generateSeatLayout } = require("@helpers/generateSeatLayout.helper")
const { generateEventId } = require("@helpers/customIdGenerator.helper");
const { Event, Category } = require("@models/index.model");
const queryExecutor = require("@utils/queryExecutor.util");


module.exports.createEventController = catchAsyncError(async (req, res) => {
    console.log("New Event is being created...");

    const { title, description, category, location, date, time, rowConfig, pricingConfig, isPaid } = req.body;

    if (!title || !description || !category || !location || !date || !time || !rowConfig || !pricingConfig) {

        console.log("Missing required fields.");
        throw new AppError("Please provide all required event details", 400);
    }

    console.log("Validating category...");

    const [categoryDoc, eventId] = await Promise.all([Category.findById(category).select("name").lean(), generateEventId(category)]);

    console.log(`Generated Event ID: ${eventId}`);

    if (!categoryDoc) {

        console.log(`Category not found with id: ${category}`);
        throw new AppError("Invalid category selected", 404);
    }

    console.log(`Category Found: ${categoryDoc.name}`);

    const eventDate = new Date(date);

    if (isNaN(eventDate.getTime())) {
        console.log("Invalid event date format.");
        throw new AppError("Invalid event date", 400);
    }

    if (eventDate < new Date()) {

        console.log(`Past date detected: ${eventDate}`);
        throw new AppError("Event date cannot be in the past", 400);
    }

    console.log(`Event Date Validated: ${eventDate}`);

    let parsedLocation;
    let parsedRowConfig;
    let parsedPricingConfig;

    try {

        console.log("Inside the try block for the parsing of string to JSON.");

        parsedLocation = typeof location === "string" ? JSON.parse(location) : location;
        parsedRowConfig = typeof rowConfig === "string" ? JSON.parse(rowConfig) : rowConfig;
        parsedPricingConfig = typeof pricingConfig === "string" ? JSON.parse(pricingConfig) : pricingConfig;

    } catch (error) {

        console.log("Failed to parse JSON payloads.");
        throw new AppError("Invalid location, rowConfig or pricingConfig format", 400);
    }

    console.log("Location, Row Config and Pricing Config Parsed Successfully.");

    const seatLayout = generateSeatLayout(parsedRowConfig, parsedPricingConfig);
    const totalSeats = seatLayout.length;

    console.log(`Generated ${totalSeats} Seats Successfully.`);


    const bannerImage = req.files?.bannerImage?.[0]?.path || "";
    const galleryImages = req.files?.galleryImages?.map(file => file.path) || [];

    console.log(`Banner Uploaded: ${bannerImage ? "YES" : "NO"}`);
    console.log(`Gallery Images Uploaded: ${galleryImages.length}`);

    console.log("Creating the final Event Object to insert the Data into the DB..");

    const eventObj = new Event({
        eventId,
        title,
        description,
        organizer: req.user._id,
        category,
        location: parsedLocation,
        bannerImage,
        galleryImages,
        date: eventDate,
        time,
        totalSeats,
        availableSeats: totalSeats,
        seatLayout,
        isPaid,
        price: isPaid ? Math.min(...Object.values(parsedPricingConfig)) : 0,
        approvalStatus: req.user.role === "admin" ? "approved" : "pending"
    });

    await eventObj.save();

    console.log(`Event Created Successfully: ${eventId}`);

    return response.created(res, "Event created successfully", eventObj);
});

module.exports.getEventController = catchAsyncError(async (req, res) => {

    console.log("GET EVENT REQUEST");

    const { eventId: requestedEventId } = req.params;

    console.log(`Requested Event ID: ${requestedEventId}`);

    if (!requestedEventId?.trim()) {

        console.log("❌ Event ID is missing.");
        throw new AppError("Event ID is required", 400);
    }

    console.log("Searching for the event...");

    const event = await Event.findOne({ eventId: requestedEventId })
        .populate("category", "name description icon")
        .populate("organizer", "firstName lastName email profileImage role")
        .lean();

    if (!event) {

        console.log(`❌ Event not found with Event ID: ${requestedEventId}`);
        throw new AppError("Event not found", 404);
    }

    console.log(`✅ Event Found: ${event.title}`);
    console.log(`Organizer: ${event.organizer.firstName} ${event.organizer.lastName}`);
    console.log(`Category: ${event.category.name}`);

    return response.success(res, "Event fetched successfully", event);
});

module.exports.getAllEventController = catchAsyncError(async (req, res) => {

    const { search, category, isPaid, approvalStatus, sort } = req.query;

    const filter = {};

    if (category)
        filter.category = category;

    if (approvalStatus)
        filter.approvalStatus = approvalStatus;

    if (isPaid !== undefined)
        filter.isPaid = isPaid === "true";

    if (search) {
        filter.$or = [
            {
                title: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: search,
                    $options: "i"
                }
            }
        ];
    }

    const query = Event.find(filter)
        .sort(sort || "-createdAt")
        .populate("category", "name icon")
        .populate("organizer", "firstName lastName profileImage")
        .select(EVENT_CARD_FIELDS)
        .lean();

    const result = await queryExecutor(query, req.query);

    return response.success(res, "Events fetched successfully", result);
});

module.exports.updateEventController = catchAsyncError(async (req, res) => {

    console.log("UPDATE EVENT REQUEST");

    const { eventId: requestedEventId } = req.params;

    console.log(`Requested Event ID: ${requestedEventId}`);

    if (!requestedEventId?.trim()) {

        console.log("❌ Event ID is missing.");
        throw new AppError("Event ID is required.", 400);
    }

    console.log("Searching for the event...");

    const event = await Event.findOne({ eventId: requestedEventId });

    if (!event) {

        console.log(`❌ Event not found with Event ID: ${requestedEventId}`);
        throw new AppError("Event not found.", 404);
    }

    console.log(`✅ Event Found: ${event.title}`);

    if (req.user.role !== "admin" && event.organizer.toString() !== req.user._id.toString()) {

        console.log("❌ Unauthorized update attempt.");
        throw new AppError("You are not authorized to update this event.", 403);
    }

    const { title, description, category, location, date, time, rowConfig, pricingConfig, isPaid } = req.body;

    if (rowConfig || pricingConfig) {

        console.log("❌ Seat layout update attempted.");
        throw new AppError("Seat layout and pricing configuration cannot be modified once the event is created.", 400);
    }

    const updateData = {};

    if (title)
        updateData.title = title.trim();

    if (description)
        updateData.description = description.trim();

    if (time)
        updateData.time = time;

    if (typeof isPaid !== "undefined")
        updateData.isPaid = isPaid === "true";

    if (date) {
        const eventDate = new Date(date);

        if (isNaN(eventDate.getTime())) {
            console.log("❌ Invalid event date.");
            throw new AppError("Invalid event date.", 400);
        }

        if (eventDate < new Date()) {

            console.log("❌ Event date cannot be in the past.");
            throw new AppError("Event date cannot be in the past.", 400);
        }

        updateData.date = eventDate;
    }

    if (category) {

        console.log("Validating category...");

        const categoryExists = await Category.exists({ name: category });

        if (!categoryExists) {
            console.log("❌ Invalid category selected.");
            throw new AppError("Invalid category selected.", 404);
        }

        updateData.category = category;
    }

    try {
        if (location) {
            updateData.location = typeof location === "string" ? JSON.parse(location) : location;
        }

    } catch (error) {

        console.log("❌ Failed to parse location.");
        throw new AppError("Invalid location payload.", 400);
    }

    if (req.files?.bannerImage) {

        console.log("Updating banner image...");
        await deleteFromCloudinary(event.bannerImage);

        updateData.bannerImage = req.files.bannerImage[0].path;

    }

    if ("galleryImagesToKeep" in req.body) {

        console.log("Processing gallery image update...");

        let galleryImagesToKeep = req.body.galleryImagesToKeep;

        if (typeof galleryImagesToKeep === "string") {

            galleryImagesToKeep = JSON.parse(galleryImagesToKeep);
        }

        const newGalleryImages = req.files?.galleryImages?.map(file => file.path) || [];

        if (galleryImagesToKeep.length === 0 && newGalleryImages.length === 0) {

            console.log("❌ Event must contain at least one gallery image.");
            throw new AppError("At least one gallery image is required.", 400);
        }

        const imagesToDelete = event.galleryImages.filter(image => !galleryImagesToKeep.includes(image));

        if (imagesToDelete.length) {

            console.log(`Deleting ${imagesToDelete.length} gallery image(s)...`);
            await Promise.all(imagesToDelete.map(image => deleteFromCloudinary(image)));
        }

        updateData.galleryImages = [
            ...galleryImagesToKeep,
            ...newGalleryImages
        ];
    }

    console.log("Applying updates...");

    Object.assign(event, updateData);

    console.log("Saving updated event...");

    await event.save();

    console.log(`✅ Event Updated Successfully: ${event.eventId}`);

    return response.success(res, "Event updated successfully.", event);
});

module.exports.deleteEventController = catchAsyncError(async (req, res) => {

    console.log("DELETE EVENT REQUEST");

    const { eventId: requestedEventId } = req.params;

    if (!requestedEventId?.trim()) {

        console.log("❌ Event ID not provided.");
        throw new AppError("Event ID is required.", 400);
    }

    console.log(`Requested Event ID: ${requestedEventId}`);

    console.log("Searching for event...");

    const event = await Event.findOne({ eventId: requestedEventId });

    if (!event) {

        console.log("❌ Event not found.");
        throw new AppError("Event not found.", 404);
    }

    console.log(`✅ Event Found: ${event.title}`)

    if (req.user.role !== "admin" && event.organizer.toString() !== req.user._id.toString()) {

        console.log("❌ Unauthorized delete attempt.");
        throw new AppError("You are not authorized to delete this event.", 403);
    }

    if (event.bannerImage) {

        console.log("Deleting banner image...");
        await deleteFromCloudinary(event.bannerImage);
    }

    if (event.galleryImages?.length) {

        console.log(`Deleting ${event.galleryImages.length} gallery image(s)...`);
        await Promise.all(event.galleryImages.map(image => deleteFromCloudinary(image)));
    }

    console.log("Deleting event from database...");

    await event.deleteOne();

    console.log(`✅ Event Deleted Successfully: ${requestedEventId}`);

    return response.success(res, "Event deleted successfully.");
});