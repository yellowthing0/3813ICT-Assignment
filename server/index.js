const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer'); // Multer for file uploads
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chatApp').then(() => {
  console.log('Connected to MongoDB');
  createTestUser();  // Create test user when server starts
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Define User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePictureUrl: String,
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next();
  });
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Define Message model
const messageSchema = new mongoose.Schema({
  groupId: Number,
  channel: Number,
  message: String,
  imageUrl: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Function to create a test user
const createTestUser = async () => {
  try {
    const existingUser = await User.findOne({ username: '1' });
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    const testUser = new User({
      username: '1',
      password: '1',  // This will be hashed before saving
      profilePictureUrl: ''  // No profile picture for now
    });

    await testUser.save();
    console.log('Test user with username and password "1" created successfully');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

// Configure file storage for images using Multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });  // Now upload is defined

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('./uploads')); // Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route for user login with JWT
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for fetching the current user's profile picture
app.get('/api/user/:username/profilePicture', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (user && user.profilePictureUrl) {
      res.json({ profilePictureUrl: user.profilePictureUrl });
    } else {
      res.json({ profilePictureUrl: null }); // No profile picture available
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for updating user password
app.post('/api/updatePassword', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    // Hash the new password before saving
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for uploading profile pictures
app.post('/api/updateProfilePicture', upload.single('profilePicture'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { username } = req.body;
  const profilePictureUrl = `/uploads/${req.file.filename}`;

  try {
    const user = await User.findOneAndUpdate(
      { username },
      { profilePictureUrl },
      { new: true }
    );

    res.json({ profilePictureUrl: user.profilePictureUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for uploading chat images
app.post('/api/upload', upload.single('chatImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Real-time messaging with Socket.io
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

  socket.on('joinChannel', async ({ groupId, channel }) => {
    console.log(`User ${socket.id} joined group ${groupId}, channel ${channel}`);
    socket.join(`${groupId}-${channel}`);

    try {
      const messages = await Message.find({ groupId, channel }).sort({ timestamp: 1 }).exec();
      socket.emit('messageHistory', messages.map(m => ({
        message: m.message,
        imageUrl: m.imageUrl,
        timestamp: m.timestamp
      })));
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  });

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

// Start the server
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
