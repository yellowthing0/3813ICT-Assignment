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
  imageUrl: String, // Add for image URLs
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Define a user schema for profile pictures
const userSchema = new mongoose.Schema({
  username: String,
  profilePictureUrl: String // URL of the profile picture
});

const User = mongoose.model('User', userSchema);

// Configure file storage for images
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(express.static('./uploads'));
app.use(express.json());
app.use(cors());

// Image upload route for chat images
app.post('/api/upload', upload.single('chatImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Image upload route for profile pictures
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
    { new: true, upsert: true }
  );

  res.json({ profilePictureUrl: user.profilePictureUrl });
});

// Socket.io setup for real-time messaging and channels
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('User connected: ', socket.id);

  // Handle joining a channel and send message history
  socket.on('joinChannel', async ({ groupId, channel }) => {
    console.log(`User ${socket.id} joined group ${groupId}, channel ${channel}`);
    socket.join(`${groupId}-${channel}`);

    try {
      const messages = await Message.find({ groupId, channel }).sort({ timestamp: 1 }).exec();
      socket.emit('messageHistory', messages.map(m => ({
        message: m.message,
        imageUrl: m.imageUrl, // Send image URL
        timestamp: m.timestamp
      })));
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  });

  // Handle sending a message to a specific channel and group
  socket.on('message', async ({ groupId, channel, message, imageUrl }) => {
    console.log(`Message received in group ${groupId}, channel ${channel}:`, message, imageUrl);

    try {
      const newMessage = new Message({ groupId, channel, message, imageUrl });
      await newMessage.save();

      io.to(`${groupId}-${channel}`).emit('message', {
        message,
        imageUrl,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
