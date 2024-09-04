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
  }
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
