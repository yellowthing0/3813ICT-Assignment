const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// In-memory message storage for channels
const messages = { 1: [], 2: [] };

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files for the Angular app
app.use(express.static('../dist/discord-like-app'));

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle joining a channel
  socket.on('joinChannel', (channel) => {
    console.log(`User ${socket.id} joined channel ${channel}`);
    socket.join(channel);

    // Send existing message history for the channel
    if (messages[channel]) {
      socket.emit('messageHistory', messages[channel]); // Send the message history to the user
    } else {
      socket.emit('messageHistory', []); // Send an empty array if no messages exist
    }
  });

  // Handle sending a message to a specific channel
  socket.on('message', ({ channel, message }) => {
    console.log(`Message received in channel ${channel}:`, message);
    
    // Save the message in the appropriate channel
    if (!messages[channel]) {
      messages[channel] = []; // Initialize if the channel has no messages
    }
    messages[channel].push(message);

    // Broadcast the message to all users in the same channel
    io.to(channel).emit('message', message);
  });

  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
