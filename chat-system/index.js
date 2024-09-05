const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());  // Enable CORS
app.use(bodyParser.json());  // Parse incoming JSON requests

// In-memory user database (for testing)
const users = [
  {
    username: 'superadmin',
    password: 'superadminpass',
    roles: ['Admin'],
    groups: ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5']
  },
  {
    username: 'user1',
    password: 'user1pass',
    roles: ['User'],
    groups: ['Group 1', 'Group 2']
  },
  {
    username: 'user2',
    password: 'user2pass',
    roles: ['User'],
    groups: ['Group 3', 'Group 4']
  },
  {
    username: 'user3',
    password: 'user3pass',
    roles: ['User'],
    groups: ['Group 1', 'Group 3']
  },
];

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Log the incoming request payload for debugging
  console.log('Login attempt:', req.body);

  // Check if user exists
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Respond with the user data if login is successful
    return res.json({
      success: true,
      user: {
        username: user.username,
        roles: user.roles,
        groups: user.groups
      }
    });
  } else {
    // Log failed login attempt
    console.error('Invalid login attempt:', req.body);

    // Respond with 401 Unauthorized if credentials are invalid
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
});

// Fetch all groups (Admin route)
app.get('/api/groups', (req, res) => {
  // Assuming only admins can call this
  res.json({
    success: true,
    groups: ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5']
  });
});

// Fetch users by group
app.get('/api/groups/:group/users', (req, res) => {
  const groupName = decodeURIComponent(req.params.group);  // Decode the group name

  // Filter users who belong to the requested group
  const groupUsers = users.filter(user => user.groups.includes(groupName));

  if (groupUsers.length > 0) {
    // Return the list of users in that group
    res.json({
      success: true,
      users: groupUsers.map(user => user.username)  // Return only usernames
    });
  } else {
    // Return an error if no users are found
    res.status(404).json({
      success: false,
      message: 'No users found for this group'
    });
  }
});




// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
