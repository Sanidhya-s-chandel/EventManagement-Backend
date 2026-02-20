const mongoose = require("mongoose");
require("dotenv").config(); 

const MONGO_URI = process.env.MONGO_DB_URI;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const SERVER_SELECTION_TIMEOUT_MS = 20000;

let attempts = 0;

const connectWithRetry = async () => {
    try {
        console.log(`🔌 Connecting to MongoDB... (Attempt: ${attempts + 1})`);
        await mongoose.connect(MONGO_URI, {
            dbName: "EventManagement",
            maxPoolSize: 25,
            serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
            socketTimeoutMS: 45000
        });

        console.log("✅ MongoDB connected successfully");
    } catch (err) {
        attempts++;
        console.error(`❌ Connection failed (Attempt ${attempts}): ${err.message}`);

        if (attempts < MAX_RETRIES) {
            console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
            setTimeout(connectWithRetry, RETRY_DELAY_MS);
        } else {
            console.error("❌ Max retries reached. Exiting application.");
            process.exit(1);
        };
    };
};

connectWithRetry();

const db = mongoose.connection;
module.exports = db;