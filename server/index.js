const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer"); // Multer for file uploads
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();
const server = http.createServer(app);

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/chatApp")
  .then(() => {
    console.log("Connected to MongoDB");
    createTestUser(); // Create test user when server starts
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePictureUrl: String,
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next();
  });
});

const User = mongoose.model("User", userSchema);

// Define Message model
const messageSchema = new mongoose.Schema({
  groupId: Number,
  channel: Number,
  message: String,
  imageUrl: String,
  timestamp: { type: Date, default: Date.now },
  profilePictureUrl: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Add this reference to the User model
});


const Message = mongoose.model("Message", messageSchema);

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.static("./uploads")); // Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (token) {
    jwt.verify(token, "your_secret_key", (err, user) => {
      if (err) {
        return res.sendStatus(403); // Invalid token
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // No token provided
  }
};

// Function to create a test user
const createTestUser = async () => {
  try {
    const existingUser = await User.findOne({ username: "1" });
    if (existingUser) {
      console.log("Test user already exists");
      return;
    }

    const testUser = new User({
      username: "1",
      password: "1", // This will be hashed before saving
      profilePictureUrl: "", // No profile picture for now
    });

    await testUser.save();
    console.log(
      'Test user with username and password "1" created successfully'
    );
  } catch (error) {
    console.error("Error creating test user:", error);
  }
};

// Configure file storage for images using Multer
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

// Route for user login with JWT
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token with userId included
    const token = jwt.sign({ userId: user._id }, "your_secret_key", {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Route for fetching the current user's profile picture (Protected)
app.get(
  "/api/user/:username/profilePicture",
  authenticateJWT,
  async (req, res) => {
    const { username } = req.params;
    try {
      const user = await User.findOne({ username });
      if (user && user.profilePictureUrl) {
        res.json({ profilePictureUrl: user.profilePictureUrl });
      } else {
        // Provide a default profile picture if none exists
        res.json({ profilePictureUrl: "/assets/default-profile.png" }); // Adjust path as necessary
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Route for updating user password (Protected)
app.post("/api/updatePassword", authenticateJWT, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ _id: req.user.userId });
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // Hash the new password before saving
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Route for uploading profile pictures (Protected)
app.post(
  "/api/updateProfilePicture",
  authenticateJWT,
  upload.single("profilePicture"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;

    try {
      const user = await User.findOneAndUpdate(
        { _id: req.user.userId },
        { profilePictureUrl },
        { new: true }
      );

      res.json({ profilePictureUrl: user.profilePictureUrl });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Route for uploading chat images (Protected)
app.post(
  "/api/upload",
  authenticateJWT,
  upload.single("chatImage"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  }
);

// Real-time messaging with Socket.io (Optional JWT check if needed)
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  // Handle setting the userId on socket connect, based on the JWT token
  socket.on("authenticate", (token) => {
    jwt.verify(token, "your_secret_key", async (err, decoded) => {
      if (err) {
        console.log("JWT authentication failed:", err);
        socket.disconnect();
      } else {
        socket.userId = decoded.userId; // Store the userId in the socket
        console.log(
          `User ID ${socket.userId} authenticated on socket ${socket.id}`
        );
      }
    });
  });

  socket.on("joinChannel", async ({ groupId, channel }) => {
    console.log(`User ${socket.id} joined group ${groupId}, channel ${channel}`);
    socket.join(`${groupId}-${channel}`);
  
    try {
      const messages = await Message.find({ groupId, channel })
        .sort({ timestamp: 1 })
        .populate("user", "username") // Make sure to populate username from user
        .exec();
  
      socket.emit(
        "messageHistory",
        messages.map((m) => ({
          username: m.user.username, // Include the username
          message: m.message,
          imageUrl: m.imageUrl,
          profilePictureUrl: m.profilePictureUrl,
          timestamp: m.timestamp,
        }))
      );
    } catch (error) {
      console.error("Error fetching message history:", error);
    }
  });
  

  socket.on("message", async ({ groupId, channel, message, imageUrl }) => {
    try {
      const user = await User.findById(socket.userId);
      const profilePictureUrl =
        user?.profilePictureUrl || "/assets/default-profile.png";
      const username = user?.username || "Unknown User"; // Fetch the username

      const newMessage = new Message({
        groupId,
        channel,
        message,
        imageUrl,
        profilePictureUrl,
      });
      await newMessage.save();

      // Emit the message including the username
      io.to(`${groupId}-${channel}`).emit("message", {
        username, // Include the username in the message data
        message,
        imageUrl,
        profilePictureUrl,
        timestamp: new Date(), // Keep timestamp for backend consistency
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
