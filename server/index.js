const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();
const server = http.createServer(app);
module.exports = app; 
// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/chatApp")
  .then(() => {
    console.log("Connected to MongoDB");
    createTestUsers(); // Create test users when server starts
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
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the User model
});

const Message = mongoose.model("Message", messageSchema);

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.static("./uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (token) {
    jwt.verify(token, "your_secret_key", (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Function to create test users
const createTestUsers = async () => {
  try {
    const users = [
      { username: "user", password: "user", profilePictureUrl: "" },
      { username: "user2", password: "user2", profilePictureUrl: "" },
      { username: "super", password: "super", profilePictureUrl: "" },
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        console.log(`User ${userData.username} already exists`);
        continue;
      }

      const newUser = new User(userData);
      await newUser.save();
      console.log(`User ${userData.username} created successfully`);
    }
  } catch (error) {
    console.error("Error creating test users:", error);
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
        res.json({ profilePictureUrl: "/assets/default-profile.png" });
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

      // Emit to all clients that the profile picture has been updated
      io.emit("profilePictureUpdated", {
        userId: user._id,
        profilePictureUrl: user.profilePictureUrl,
      });
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

// Add this to your server.js
app.get("/api/groups/:groupId/users", authenticateJWT, async (req, res) => {
  const { groupId } = req.params;
  try {
    // Fetch users for the given groupId. Replace this with your actual logic to fetch users in a group.
    const users = await User.find({ groups: groupId }).select(
      "username profilePictureUrl"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching group users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Real-time messaging with Socket.io
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

  // Authenticate user with JWT token when connecting
  socket.on("authenticate", (token) => {
    jwt.verify(token, "your_secret_key", async (err, decoded) => {
      if (err) {
        console.log("JWT authentication failed:", err);
        socket.disconnect(); // Disconnect the socket if authentication fails
      } else {
        socket.userId = decoded.userId; // Store the userId in the socket
        console.log(
          `User ID ${socket.userId} authenticated on socket ${socket.id}`
        );
      }
    });
  });

  // Handle user joining a group and channel
  socket.on("joinChannel", async ({ groupId, channel }) => {
    if (!socket.userId) {
      console.log("User not authenticated");
      return; // Ensure that the user is authenticated before joining a channel
    }

    console.log(
      `User ${socket.id} (ID: ${socket.userId}) joined group ${groupId}, channel ${channel}`
    );
    socket.join(`${groupId}-${channel}`); // Join the specific group/channel room

    try {
      // Fetch existing messages for this group and channel
      const messages = await Message.find({ groupId, channel })
        .sort({ timestamp: 1 })
        .populate("user", "username profilePictureUrl") // Populate username and profile picture from the User model
        .exec();

      // Send the message history to the user who joined the channel
      socket.emit(
        "messageHistory",
        messages.map((m) => ({
          username: m.user?.username || "Unknown User",
          message: m.message,
          imageUrl: m.imageUrl,
          profilePictureUrl:
            m.user?.profilePictureUrl || "/assets/default-profile.png",
          timestamp: m.timestamp,
          userId: m.user?._id || null, // Include userId to handle profile updates
        }))
      );
    } catch (error) {
      console.error("Error fetching message history:", error);
    }
  });

  // Handle sending a new message
  socket.on(
    "message",
    async ({ token, groupId, channel, message, imageUrl }) => {
      try {
        const decoded = jwt.verify(token, "your_secret_key"); // Verify the token for each message
        const user = await User.findById(decoded.userId); // Use the userId from the token
        if (!user) {
          console.log("User not found");
          return;
        }

        const profilePictureUrl =
          user.profilePictureUrl || "/assets/default-profile.png";
        const username = user.username || "Unknown User";

        // Save the new message in the database
        const newMessage = new Message({
          groupId,
          channel,
          message,
          imageUrl,
          profilePictureUrl,
          user: user._id, // Link the message to the user
        });
        await newMessage.save();

        // Broadcast the message to all users in the group/channel
        io.to(`${groupId}-${channel}`).emit("message", {
          username,
          message,
          imageUrl,
          profilePictureUrl,
          userId: user._id,
          timestamp: new Date(),
        });

        console.log(
          "Broadcasting message to group",
          groupId,
          "channel",
          channel,
          "from user",
          username
        );
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  );

  // Handle user logout
  socket.on("logout", () => {
    console.log(`User logged out from socket ${socket.id}`);
    socket.userId = null;
  });

  // Handle user disconnect
  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.id} disconnected: ${reason}`);
    socket.userId = null;
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
