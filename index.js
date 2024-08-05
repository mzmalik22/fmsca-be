require("dotenv").config();

const { initDb } = require("./db");
const { initServer } = require("./server");
const { parseRecords } = require("./seeders/FMSCA_records");

// Initialize database
initDb();

// - Only uncomment this line when you need the data to be refreshed in the db
parseRecords().then(() => console.log("Seeding finished"));

// Start the server
initServer();
