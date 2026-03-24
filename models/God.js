const mongoose = require('mongoose');

// Define the schema for gods/deities
const godSchema = new mongoose.Schema({
    name: { type: String, required: true },
    powers: { type: [String], required: true },
    location: { type: String, default: 'underground' },
    createdAt: { type: Date, default: Date.now }
});

// Create the model
const God = mongoose.model('God', godSchema);

module.exports = God;
