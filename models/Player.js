const mongoose = require('mongoose');

// Define the Player schema
const playerSchema = new mongoose.Schema({
    level: {
        type: Number,
        required: true,
        default: 1,
    },
    experience: {
        type: Number,
        required: true,
        default: 0,
    },
    powers: {
        type: [String],
        default: [],
    },
    inventory: {
        type: [String],
        default: [],
    },
});

// Export the Player model
module.exports = mongoose.model('Player', playerSchema);