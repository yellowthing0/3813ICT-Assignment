const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors'); // Enable CORS for development

const app = express();
const server = http.createServer(app);

// In-memory message storage for channels
const messages = {
  1: [], // Text channel messages
  2: []  // Voice channel messages (if needed, otherwise can be left empty)
};

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200", // Your Angular app URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"],
    credentials: true
  }
});

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Serve static files for the Angular app (adjust the path to match your Angular build output)
app.use(express.static('../dist/discord-like-app'));

// Socket.io setup for real-time messaging and channels
io.on('connection', (socket) => {
  console.log('User connected: ', socket.id);

  // Handle joining a channel
  socket.on('joinChannel', (channel) => {
    console.log(`User ${socket.id} joined channel ${channel}`);
    socket.join(channel); // Join the specific channel

    // Send existing messages in the channel
    if (messages[channel]) {
      socket.emit('messageHistory', messages[channel]); // Send the message history
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

  // Handle peer ID sharing for voice chat
  socket.on('peer-id', ({ groupId, peerId }) => {
    console.log(`Peer ID ${peerId} shared in group ${groupId}`);
    // Broadcast the peer ID to other clients in the same group
    socket.broadcast.to(groupId).emit('peer-id', { peerId });
  });

  // Handle disconnect event
  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
  });

  // Handle error event
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// Example simple login route without JWT
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Example: Static username and password (replace with real authentication logic)
  if (username === '1' && password === '1') {
    return res.json({ message: 'Login successful' });
  } else {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
