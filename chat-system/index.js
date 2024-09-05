const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
  }
];

let groups = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'];

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.json({
      success: true,
      user: {
        username: user.username,
        roles: user.roles,
        groups: user.groups
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
});

// Fetch all groups (Admin route)
app.get('/api/groups', (req, res) => {
  res.json({ success: true, groups });
});

// Create a new group (Admin route)
app.post('/api/groups', (req, res) => {
  const { groupName, username } = req.body;
  const user = users.find(u => u.username === username);

  if (user && user.roles.includes('Admin')) {
    if (!groups.includes(groupName)) {
      groups.push(groupName);
      res.json({ success: true, message: `Group ${groupName} created successfully.`, groups });
    } else {
      res.status(400).json({ success: false, message: `Group ${groupName} already exists.` });
    }
  } else {
    res.status(403).json({ success: false, message: 'You are not authorized to create groups.' });
  }
});

// Delete a group (Admin route)
app.delete('/api/groups/:groupName', (req, res) => {
  const { groupName } = req.params;
  const { username } = req.query;  // Get the username from the query params

  const user = users.find(u => u.username === username);

  if (user && user.roles.includes('Admin')) {
    if (groups.includes(groupName)) {
      // Remove group from groups array
      groups = groups.filter(group => group !== groupName);

      // Remove the group from all users
      users.forEach(user => {
        user.groups = user.groups.filter(group => group !== groupName);
      });

      return res.json({
        success: true,
        message: `Group ${groupName} deleted successfully.`,
        groups
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `Group ${groupName} not found.`
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to delete groups.'
    });
  }
});



// Invite a user to a group (Admin route)
app.post('/api/groups/:group/invite', (req, res) => {
  const { group } = req.params;
  const { invitedUsername, invitingUsername } = req.body;

  const invitingUser = users.find(u => u.username === invitingUsername);
  const invitedUser = users.find(u => u.username === invitedUsername);

  if (invitingUser && invitingUser.roles.includes('Admin') && invitedUser) {
    invitedUser.groups.push(group);
    res.json({ success: true, message: `${invitedUsername} has been added to ${group}`, user: invitedUser });
  } else {
    res.status(403).json({ success: false, message: 'You are not authorized to invite users or the user does not exist' });
  }
});

// Remove a user from a group (Admin route)
app.post('/api/groups/:group/remove', (req, res) => {
  const { group } = req.params;
  const { removedUsername, removingUsername } = req.body;

  const removingUser = users.find(u => u.username === removingUsername);
  const removedUser = users.find(u => u.username === removedUsername);

  if (removingUser && removingUser.roles.includes('Admin') && removedUser) {
    removedUser.groups = removedUser.groups.filter(g => g !== group);
    res.json({ success: true, message: `${removedUsername} has been removed from ${group}`, user: removedUser });
  } else {
    res.status(403).json({ success: false, message: 'You are not authorized to remove users or the user does not exist' });
  }
});

// Fetch users by group
app.get('/api/groups/:group/users', (req, res) => {
  const groupName = decodeURIComponent(req.params.group);
  const groupUsers = users.filter(user => user.groups.includes(groupName));

  if (groupUsers.length > 0) {
    res.json({ success: true, users: groupUsers.map(user => user.username) });
  } else {
    res.status(404).json({ success: false, message: 'No users found for this group' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
