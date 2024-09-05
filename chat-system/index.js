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
    username: 'groupadmin',
    password: 'groupadminpass',
    roles: ['Admin'],
    groups: ['Group 4', 'Group 5']
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
  console.log('Received request for all groups');  // Add this log
  res.json({
    success: true,
    groups: ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5']
  });
});



// Invite a user to a group (Group Admin route)
app.post('/api/groups/:group/invite', (req, res) => {
  const { group } = req.params;
  const { invitedUsername, invitingUsername } = req.body;

  const invitingUser = users.find(u => u.username === invitingUsername);
  const invitedUser = users.find(u => u.username === invitedUsername);

  if (invitingUser && invitingUser.roles.includes('Admin') && invitedUser) {
    // Add the invited user to the group
    invitedUser.groups.push(group);
    return res.json({
      success: true,
      message: `${invitedUsername} has been added to ${group}`,
      user: invitedUser
    });
  } else {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to invite users or the user does not exist'
    });
  }
});

// Remove a user from a group (Group Admin route)
app.post('/api/groups/:group/remove', (req, res) => {
  const { group } = req.params;
  const { removedUsername, removingUsername } = req.body;

  const removingUser = users.find(u => u.username === removingUsername);
  const removedUser = users.find(u => u.username === removedUsername);

  if (removingUser && removingUser.roles.includes('Admin') && removedUser) {
    // Remove the user from the group
    removedUser.groups = removedUser.groups.filter(g => g !== group);
    return res.json({
      success: true,
      message: `${removedUsername} has been removed from ${group}`,
      user: removedUser
    });
  } else {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to remove users or the user does not exist'
    });
  }
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
