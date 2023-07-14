const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("./database");

const Seat = require("./Models/seat");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 8080;

// Initialize seat data
async function initializeCoach() {
  const totalSeats = 80;

  try {
    await Seat.deleteMany(); // Clear any existing seat data

    for (let i = 1; i <= totalSeats; i++) {
      const seat = new Seat({
        number: i,
        booked: false,
      });
      await seat.save();
    }

    console.log("Seat data initialized successfully.");
  } catch (error) {
    console.error("Error initializing seat data:", error);
  }
}

// Call the function to initialize the seat data
// initializeCoach();

// API endpoint for reserving seats
app.post("/seats", async (req, res) => {
  try {
    const numSeats = req.body.numSeats;

    if (numSeats <= 0 || numSeats > 7) {
      res.status(400).json({ error: "Invalid number of seats" });
      return;
    }

    // Find the seats that are not already booked
    const availableSeats = await Seat.find({ booked: false });

    if (numSeats > availableSeats.length) {
      res.status(400).json({ error: "Not enough seats available" });
      return;
    }

    let reservedSeats = [];

    // Find a row with enough consecutive available seats
    let consecutiveSeats = [];
    for (const seat of availableSeats) {
      consecutiveSeats.push(seat);
      if (consecutiveSeats.length === numSeats) {
        reservedSeats = consecutiveSeats;
        break;
      }
      if (seat.number % 7 === 0 || seat.booked) {
        consecutiveSeats = [];
      }
    }

    // If no complete row is available, book nearby seats
    if (reservedSeats.length === 0) {
      const remainingSeats = availableSeats.filter((seat) => !seat.booked);
      reservedSeats = remainingSeats.slice(0, numSeats);
    }

    // Update the reserved seats as booked in the database
    for (const seat of reservedSeats) {
      seat.booked = true;
      await seat.save();
    }

    res
      .status(200)
      .json({ message: "Seats reserved successfully", reservedSeats });
  } catch (error) {
    console.error("Error reserving seats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/all-seats", async (req, res) => {
  try {
    const getReserveSeats = await Seat.find();
    // const reservedSeatIndices = getReserveSeats.map((seat) => seat.number);
    res.json(getReserveSeats);
  } catch (error) {
    console.error("Error retrieving booked seats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/deleteseats", async (req, res) => {
  try {
    await Seat.updateMany({ booked: true }, { booked: false });
    res.status(200).json({ message: "Seats cleared successfully" });
  } catch (error) {
    console.error("Error clearing seats:", error);
    res.status(500).json({ error: "An error occurred while clearing seats" });
  }
  // initializeCoach();
});

app.listen(port, () => {
  initializeCoach();
  console.log(`Server running on http://localhost:${port}`);
});
