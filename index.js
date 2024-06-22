const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://admin:admin123@cluster0.qswwdgs.mongodb.net/API?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Trip Schema
const TripSchema = new mongoose.Schema({
    trip_number: { type: String, required: true },
    schedule: { type: String, required: true },
    initial_stop: { type: String, required: true },
    final_stop: { type: String, required: true },
    route: { type: String, required: true },
    stops: [{
        stop_name: { type: String, required: true },
        arrival_time: { type: String, required: true }
    }]
});

// Define Bus Schema
const BusSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bus_number: { type: String, required: true, unique: true },
    bus_type: { type: String, required: true },
    trips: [TripSchema]
});

// Create models
const Bus = mongoose.model('Bus', BusSchema);
const Trip = mongoose.model('Trip', TripSchema);

// Routes

// Add a new bus
app.post('/api/buses', async (req, res) => {
    const { name, bus_number, bus_type } = req.body;

    if (!name || !bus_number || !bus_type) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const existingBus = await Bus.findOne({ bus_number });

        if (existingBus) {
            return res.status(400).json({ message: 'Bus with this bus_number already exists' });
        }

        const newBus = new Bus({
            name,
            bus_number,
            bus_type
        });

        const savedBus = await newBus.save();
        res.status(201).json(savedBus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all buses
app.get('/api/buses', async (req, res) => {
    try {
        const buses = await Bus.find();
        res.json(buses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get bus by bus_number
app.get('/api/buses/:busNumber', async (req, res) => {
    const { busNumber } = req.params;

    try {
        const bus = await Bus.findOne({ bus_number: busNumber });

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json(bus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update bus by bus_number
app.put('/api/buses/:busNumber', async (req, res) => {
    const { busNumber } = req.params;
    const { name, bus_number, bus_type } = req.body;

    if (!name || !bus_number || !bus_type) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const updatedBus = await Bus.findOneAndUpdate(
            { bus_number: busNumber },
            { name, bus_number, bus_type },
            { new: true }
        );

        if (!updatedBus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json(updatedBus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete bus by bus_number
app.delete('/api/buses/:busNumber', async (req, res) => {
    const { busNumber } = req.params;

    try {
        const deletedBus = await Bus.findOneAndDelete({ bus_number: busNumber });

        if (!deletedBus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json({ message: 'Bus deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new trip to a bus
app.post('/api/buses/:busNumber/trips', async (req, res) => {
    const { busNumber } = req.params; // Correctly named busNumber

    // Destructure trip details from req.body
    const { trip_number, schedule, initial_stop, final_stop, route, stops } = req.body;

    // Check if any required field is missing
    if (!trip_number || !schedule || !initial_stop || !final_stop || !route || !stops) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create a new trip object
    const newTrip = {
        trip_number,
        schedule,
        initial_stop,
        final_stop,
        route,
        stops
    };

    try {
        // Find the bus by bus_number
        const bus = await Bus.findOne({ bus_number: busNumber }); // Use busNumber here

        // If bus is not found, return 404 error
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // Push the new trip to the bus's trips array
        bus.trips.push(newTrip);

        // Save the bus with the new trip
        const savedBus = await bus.save();

        // Respond with the updated bus object
        res.status(201).json(savedBus);
    } catch (err) {
        // Handle any errors and respond with an error message
        res.status(500).json({ message: err.message });
    }
});

// Get all trips of a bus
app.get('/api/buses/:busNumber/trips', async (req, res) => {
    const { busNumber } = req.params;

    try {
        const bus = await Bus.findOne({ bus_number: busNumber });

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        res.json(bus.trips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a trip of a bus by trip_number
app.put('/api/buses/:busNumber/trips/:tripNumber', async (req, res) => {
    const { busNumber, tripNumber } = req.params;
    const { trip_number, schedule, initial_stop, final_stop, route, stops } = req.body;

    if (!trip_number || !schedule || !initial_stop || !final_stop || !route || !stops) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const bus = await Bus.findOne({ bus_number: busNumber });

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        const tripIndex = bus.trips.findIndex(trip => trip.trip_number === tripNumber);

        if (tripIndex === -1) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        bus.trips[tripIndex] = {
            trip_number,
            schedule,
            initial_stop,
            final_stop,
            route,
            stops
        };

        const savedBus = await bus.save();
        res.json(savedBus.trips[tripIndex]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a trip of a bus by trip_number
app.delete('/api/buses/:busNumber/trips/:tripNumber', async (req, res) => {
    const { busNumber, tripNumber } = req.params;

    try {
        const bus = await Bus.findOne({ bus_number: busNumber });

        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        const updatedTrips = bus.trips.filter(trip => trip.trip_number !== tripNumber);
        bus.trips = updatedTrips;

        await bus.save();
        res.json({ message: 'Trip deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get buses by stop_name and show entire trips containing the stop
app.get('/api/buses/stop/:stopName', async (req, res) => {
    const { stopName } = req.params;

    try {
        // Find buses that have at least one trip with the specified stop name
        const buses = await Bus.find({ 'trips.stops.stop_name': stopName });

        if (buses.length === 0) {
            return res.status(404).json({ message: 'No buses found for the given stop name' });
        }

        // Extract and return the entire trips that include the specified stop
        const trips = [];
        buses.forEach(bus => {
            bus.trips.forEach(trip => {
                trip.stops.forEach(stop => {
                    if (stop.stop_name === stopName) {
                        trips.push(trip);
                    }
                });
            });
        });

        res.json(trips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get trips based on from stop_name and to stop_name
app.get('/api/trips', async (req, res) => {
    const { fromStopName, toStopName } = req.query;

    try {
        // Find trips where the stops array contains both fromStopName and toStopName
        // and ensure fromStopName occurs before toStopName in the stops array
        const trips = await Trip.find({
            'stops.stop_name': fromStopName,
            'stops.stop_name': toStopName,
            'stops.arrival_time': { $lt: new Date() } // Optionally, filter by arrival time if needed
        })
        .sort('stops.arrival_time'); // Sort by arrival time if required

        // Filter trips to ensure fromStopName occurs before toStopName in the stops array
        const filteredTrips = trips.filter(trip => {
            const fromIndex = trip.stops.findIndex(stop => stop.stop_name === fromStopName);
            const toIndex = trip.stops.findIndex(stop => stop.stop_name === toStopName);
            return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
        });

        res.json(filteredTrips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
