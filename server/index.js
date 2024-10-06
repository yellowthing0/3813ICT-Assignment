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
  channel: Number,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// In-memory message storage for channels
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

// Serve static files for the Angular app
app.use(express.static('../dist/discord-like-app'));

// Socket.io setup for real-time messaging and channels
io.on('connection', (socket) => {
  console.log('User connected: ', socket.id);

  // Handle joining a channel and send message history
  socket.on('joinChannel', async (channel) => {
    console.log(`User ${socket.id} joined channel ${channel}`);
    socket.join(channel); // Join the specific channel

    // Fetch message history from MongoDB and send to the user
    const messages = await Message.find({ channel }).sort({ timestamp: 1 }).exec();
    socket.emit('messageHistory', messages.map(m => m.message)); // Send the message history
  });

  // Handle sending a message to a specific channel
  socket.on('message', async ({ channel, message }) => {
    console.log(`Message received in channel ${channel}:`, message);

    // Save the message to MongoDB
    const newMessage = new Message({ channel, message });
    await newMessage.save();

    // Broadcast the message to all users in the same channel
    io.to(channel).emit('message', message);
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
