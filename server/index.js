// server/index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors'); // Enable CORS for development
const mongoose = require('mongoose'); // Add mongoose for MongoDB

const app = express();
const server = http.createServer(app);

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chatApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Define a message schema and model
const messageSchema = new mongoose.Schema({
  groupId: Number,  // Add group ID to distinguish between different groups
  channel: Number,  // Channel number (Text or Voice)
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Socket.io setup for real-time messaging and channels
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
app.use(cors());

// Serve static files for the Angular app
app.use(express.static('../dist/discord-like-app'));

// Socket.io setup for real-time messaging and channels
io.on('connection', (socket) => {
  console.log('User connected: ', socket.id);

  // Handle joining a channel and send message history
  socket.on('joinChannel', async ({ groupId, channel }) => {
    console.log(`User ${socket.id} joined group ${groupId}, channel ${channel}`);
    socket.join(`${groupId}-${channel}`); // Join a room specific to the group and channel

    // Fetch message history from MongoDB and send to the user
    try {
      const messages = await Message.find({ groupId, channel }).sort({ timestamp: 1 }).exec();
      socket.emit('messageHistory', messages.map(m => ({
        message: m.message,
        timestamp: m.timestamp
      }))); // Send the message history
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  });

  // Handle sending a message to a specific channel and group
  socket.on('message', async ({ groupId, channel, message }) => {
    console.log(`Message received in group ${groupId}, channel ${channel}:`, message);

    // Save the message to MongoDB
    try {
      const newMessage = new Message({ groupId, channel, message });
      await newMessage.save();

      // Broadcast the message to all users in the same group and channel
      io.to(`${groupId}-${channel}`).emit('message', { message, timestamp: new Date() });
    } catch (error) {
      console.error('Error saving message:', error);
    }
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
