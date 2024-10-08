const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

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
  groupId: Number,
  channel: Number,
  message: String,
  imageUrl: String, // For chat images
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Define a user schema for profile pictures
const userSchema = new mongoose.Schema({
  username: String,
  profilePictureUrl: String // URL of the profile picture
});

const User = mongoose.model('User', userSchema);

// Configure file storage for images (chat and profile pictures)
const storage = multer.diskStorage({
  destination: './uploads/', // Directory where uploaded files will be stored
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Unique file naming
  }
});

const upload = multer({ storage: storage });

app.use(express.static('./uploads')); // Serve uploaded files statically
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Enable CORS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route for uploading chat images
app.post('/api/upload', upload.single('chatImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Send the image URL back to the client
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Route for uploading profile pictures
app.post('/api/uploadProfilePicture', upload.single('profilePicture'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { username } = req.body;
  const profilePictureUrl = `/uploads/${req.file.filename}`;

  // Save the profile picture URL in the user document
  const user = await User.findOneAndUpdate(
    { username },
    { profilePictureUrl },
    { new: true, upsert: true } // Create new document if not found
  );

  res.json({ profilePictureUrl: user.profilePictureUrl });
});

// Real-time messaging setup with Socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200", // Your Angular app URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"],
    credentials: true
  }
});

// Socket.io connection setup
io.on('connection', (socket) => {
  console.log('User connected: ', socket.id);

  // Handle joining a channel and send message history
  socket.on('joinChannel', async ({ groupId, channel }) => {
    console.log(`User ${socket.id} joined group ${groupId}, channel ${channel}`);
    socket.join(`${groupId}-${channel}`); // Join the specific room based on group and channel

    try {
      const messages = await Message.find({ groupId, channel }).sort({ timestamp: 1 }).exec();
      socket.emit('messageHistory', messages.map(m => ({
        message: m.message,
        imageUrl: m.imageUrl, // Send image URL if exists
        timestamp: m.timestamp
      })));
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  });

  // Handle sending a message (with or without image)
  socket.on('message', async ({ groupId, channel, message, imageUrl }) => {
    console.log(`Message received in group ${groupId}, channel ${channel}:`, message, imageUrl);

    try {
      const newMessage = new Message({ groupId, channel, message, imageUrl });
      await newMessage.save();

      // Broadcast the message to all users in the same group and channel
      io.to(`${groupId}-${channel}`).emit('message', {
        message,
        imageUrl,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle disconnect event
  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
