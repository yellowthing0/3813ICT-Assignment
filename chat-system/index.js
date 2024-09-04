const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Peer = require('peer');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Peer server setup
const peerServer = Peer.ExpressPeerServer(server, {
  debug: true,
});

app.use('/peerjs', peerServer);

// Simple route
app.get('/', (req, res) => {
  res.send('Chat System Backend Running');
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
