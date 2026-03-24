'use strict';

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://localhost/toblocks', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Express setup
app.get('/', (req, res) => {
    res.send('TOBLOCKS Game Server');
});

// Socket.io setup
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
