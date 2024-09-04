const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { PeerServer } = require('peer'); // Import PeerServer from the 'peer' package

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the Angular app from the frontend directory
app.use(express.static('../frontend/dist/frontend'));

// Socket.io setup
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Peer.js server setup
const peerServer = PeerServer({ port: 9000, path: '/peerjs' });

app.use('/peerjs', peerServer);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
