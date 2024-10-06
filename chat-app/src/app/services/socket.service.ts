// src/app/services/socket.service.ts
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class SocketService extends Socket {
  constructor() {
    super({
      url: 'http://localhost:3000', // Your backend's Socket.io server URL
      options: {
        transports: ['websocket'], // Prefer WebSocket transport
      },
    });
  }

  // Listen for new messages from a channel
  getMessage() {
    return this.fromEvent('message');
  }

  // Join a specific channel
  joinChannel(channel: string) {
    this.emit('joinChannel', channel);
  }

  // Send a message to a specific channel
  sendMessage(channel: string, message: string) {
    this.emit('message', { channel, message });
  }
}
