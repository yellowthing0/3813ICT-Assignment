const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Peer = require('peer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Peer server setup
const peerServer = Peer.ExpressPeerServer(server, {
  debug: true,
});

app.use('/peerjs', peerServer);

// Use bodyParser middleware to parse JSON requests
app.use(bodyParser.json());
app.use(cors());
// Simulated user data
const users = [
  {
    username: 'superadmin',
    email: 'superadmin@example.com',
    id: 1,
    roles: ['Super Admin'],
    groups: ['Group1', 'Group2'],
    password: 'superadminpass',
  },
  {
    username: 'groupadmin',
    email: 'groupadmin@example.com',
    id: 2,
    roles: ['Group Admin'],
    groups: ['Group1'],
    password: 'groupadminpass',
  },
  {
    username: 'user1',
    email: 'user1@example.com',
    id: 3,
    roles: ['User'],
    groups: ['Group1'],
    password: '123',
  },
  {
    username: 'user2',
    email: 'user2@example.com',
    id: 4,
    roles: ['User'],
    groups: ['Group2'],
    password: '123',
  },
  {
    username: 'user3',
    email: 'user3@example.com',
    id: 5,
    roles: ['User'],
    groups: ['Group3'],
    password: '123',
  },
];

// Simple route to test the server
app.get('/', (req, res) => {
  res.send('Chat System Backend Running');
});

// Login endpoint to verify user credentials
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find the user by username and password
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Socket connection
io.on('connection', (socket) => {
  console.log('New user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
