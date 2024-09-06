const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const users = [
  {
    username: "superadmin",
    password: "superadminpass",
    roles: ["Super Admin"],
    groups: ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"],
  },
  {
    username: "groupadmin",
    password: "groupadminpass",
    roles: ["Admin"],
    groups: ["Group 4", "Group 5"],
  },
  {
    username: "user1",
    password: "user1pass",
    roles: ["User"],
    groups: ["Group 1", "Group 2"],
  },
  {
    username: "user2",
    password: "user2pass",
    roles: ["User"],
    groups: ["Group 3", "Group 4"],
  },
  {
    username: "user3",
    password: "user3pass",
    roles: ["User"],
    groups: ["Group 1", "Group 3"],
  },
];

let groups = ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"];

// Mock data for group channels
const groupChannels = {
  "Group 1": ["Channel 1", "Channel 2"],
  "Group 2": ["Channel A", "Channel B"],
  "Group 3": [],
  "Group 4": ["Channel X", "Channel Y"],
  "Group 5": ["Channel Z"],
};

// Route to fetch channels for a specific group
app.get("/api/groups/:groupName/channels", (req, res) => {
  const { groupName } = req.params;

  if (groupChannels[groupName]) {
    res.json({ success: true, channels: groupChannels[groupName] });
  } else {
    res.status(404).json({
      success: false,
      message: "Group not found or no channels available",
    });
  }
});

// Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.json({
      success: true,
      user: {
        username: user.username,
        roles: user.roles,
        groups: user.groups,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }
});

// Fetch all groups (Admin route)
app.get("/api/groups", (req, res) => {
  res.json({ success: true, groups });
});

// Create a new group (Admin route)
app.post("/api/groups", (req, res) => {
  const { groupName, username } = req.body;
  const user = users.find((u) => u.username === username);

  if (user && user.roles.includes("Admin")) {
    if (!groups.includes(groupName)) {
      groups.push(groupName);
      res.json({
        success: true,
        message: `Group ${groupName} created successfully.`,
        groups,
      });
    } else {
      res
        .status(400)
        .json({
          success: false,
          message: `Group ${groupName} already exists.`,
        });
    }
  } else {
    res
      .status(403)
      .json({
        success: false,
        message: "You are not authorized to create groups.",
      });
  }
});

// Delete a group (Admin route)
app.delete("/api/groups/:groupName", (req, res) => {
  const { groupName } = req.params;
  const { username } = req.query;

  const user = users.find((u) => u.username === username);

  if (user && user.roles.includes("Admin")) {
    if (groups.includes(groupName)) {
      groups = groups.filter((group) => group !== groupName);

      users.forEach((user) => {
        user.groups = user.groups.filter((group) => group !== groupName);
      });

      return res.json({
        success: true,
        message: `Group ${groupName} deleted successfully.`,
        groups,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `Group ${groupName} not found.`,
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete groups.",
    });
  }
});

// Promote or demote a user (Super Admin route)
app.post("/api/users/:username/role", (req, res) => {
  const { username } = req.params;
  const { action, currentUser } = req.body;

  const superAdmin = users.find((u) => u.username === currentUser);

  if (superAdmin && superAdmin.roles.includes("Super Admin")) {
    const userToUpdate = users.find((u) => u.username === username);

    if (userToUpdate) {
      if (action === "promote") {
        if (!userToUpdate.roles.includes("Admin")) {
          userToUpdate.roles.push("Admin");
        }
      } else if (action === "demote") {
        userToUpdate.roles = userToUpdate.roles.filter(
          (role) => role !== "Admin"
        );
      }
      res.json({ success: true, user: userToUpdate });
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  } else {
    res.status(403).json({
      success: false,
      message: "You are not authorized to promote/demote users.",
    });
  }
});

// Create a new user (Super Admin route)
app.post("/api/users", (req, res) => {
  const { newUser, currentUser } = req.body;

  const superAdmin = users.find((u) => u.username === currentUser);

  if (superAdmin && superAdmin.roles.includes("Super Admin")) {
    if (!users.some((user) => user.username === newUser.username)) {
      users.push(newUser);
      res.json({ success: true, message: "User created successfully", users });
    } else {
      res.status(400).json({ success: false, message: "User already exists." });
    }
  } else {
    res.status(403).json({
      success: false,
      message: "You are not authorized to create users.",
    });
  }
});

// Delete a user (Super Admin route)
app.delete("/api/users/:username", (req, res) => {
  const { username } = req.params;
  const { currentUser } = req.body;

  const superAdmin = users.find((u) => u.username === currentUser);

  if (superAdmin && superAdmin.roles.includes("Super Admin")) {
    const userIndex = users.findIndex((u) => u.username === username);

    if (userIndex !== -1) {
      users.splice(userIndex, 1);
      res.json({ success: true, message: "User deleted successfully", users });
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  } else {
    res.status(403).json({
      success: false,
      message: "You are not authorized to delete users.",
    });
  }
});

// Fetch users by group
app.get("/api/groups/:group/users", (req, res) => {
  const groupName = decodeURIComponent(req.params.group);
  const groupUsers = users.filter((user) => user.groups.includes(groupName));

  if (groupUsers.length > 0) {
    res.json({ success: true, users: groupUsers.map((user) => user.username) });
  } else {
    res
      .status(404)
      .json({ success: false, message: "No users found for this group" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
