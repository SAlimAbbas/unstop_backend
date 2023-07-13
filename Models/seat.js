const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true,
  },
  booked: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("Seat", seatSchema);
