// server/index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files for the Angular app
app.use(express.static('../dist/discord-like-app'));

io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for joinChannel event
  socket.on('joinChannel', ({ groupId, channelId }) => {
    console.log(`User joined group ${groupId}, channel ${channelId}`);
    socket.join(`${groupId}-${channelId}`);
  });

  // Listen for messages in the channel
  socket.on('message', ({ groupId, channelId, content }) => {
    console.log(`Message received in group ${groupId}, channel ${channelId}: ${content}`);
    io.to(`${groupId}-${channelId}`).emit('message', content);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
