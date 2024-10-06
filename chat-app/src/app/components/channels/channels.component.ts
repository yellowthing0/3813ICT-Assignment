import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Socket } from 'ngx-socket-io';
import Peer, { MediaConnection } from 'peerjs'; // Import MediaConnection explicitly

@Component({
  selector: 'app-channels',
  standalone: true,
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ChannelsComponent implements OnInit {
  channels = [
    { id: 1, name: 'text' },
    { id: 2, name: 'voice' }
  ];
  selectedChannel?: number; // Track selected channel ID
  groupId?: number;
  messages: string[] = []; // Store chat messages
  newMessage = ''; // Bound to input field for sending messages

  // Voice chat related
  peer!: Peer;
  myStream!: MediaStream;
  currentCall?: MediaConnection; // Use MediaConnection type
  peerId: string = ''; // Store peer ID for connection
  connectedPeerId: string = ''; // The peer ID to connect to

  constructor(private route: ActivatedRoute, private socket: Socket) {}

  ngOnInit(): void {
    console.log('ngOnInit started');
    this.groupId = +this.route.snapshot.paramMap.get('groupId')!;
    console.log('Group ID: ', this.groupId);

    // Listen for incoming messages
    this.socket.on('message', (message: string) => {
      console.log('Message received from server: ', message);
      this.messages.push(message);
    });

    // Listen for message history when joining a channel
    this.socket.on('messageHistory', (history: string[]) => {
      console.log('Message history received: ', history);
      this.messages = history;
    });

    // Debugging Socket connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error: ', err);
    });

    // Initialize Peer.js for voice chat with a delay to avoid blocking the UI thread
    console.log('Initializing Peer...');
    setTimeout(() => {
      this.initializePeer();
    }, 2000); // Delay by 2 seconds
  }

  // Handle text channel selection
  onChannelSelect(channelId: number): void {
    this.selectedChannel = channelId;
    this.messages = []; // Reset messages when switching channels

    // Emit event to join the selected channel
    this.socket.emit('joinChannel', channelId);
  }

  // Send a new chat message
  sendMessage(): void {
    if (this.newMessage.trim()) {
      console.log('Sending message to server: ', this.newMessage);
      this.socket.emit('message', { channel: this.selectedChannel, message: this.newMessage }); // Emit the message to the server
      this.newMessage = ''; // Clear the input field
    }
  }

  // Initialize Peer.js for voice chat
  initializePeer(): void {
    this.peer = new Peer(); // Initialize a new Peer instance
    console.log('Peer initialized');

    // Get the peer ID when the connection is established
    this.peer.on('open', (id: string) => {
      this.peerId = id;
      console.log(`Peer ID: ${id}`);
    });

    // Answer incoming calls
    this.peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        call.answer(stream); // Answer the call with our audio stream
        this.myStream = stream;

        call.on('stream', (remoteStream: MediaStream) => { // Specify the type for remoteStream
          this.playAudioStream(remoteStream); // Play the remote stream
        });
      });
    });
  }

  // Start a voice call
  startCall(): void {
    if (this.connectedPeerId.trim()) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        this.myStream = stream;
        this.currentCall = this.peer.call(this.connectedPeerId, stream);

        this.currentCall.on('stream', (remoteStream: MediaStream) => { // Specify the type for remoteStream
          this.playAudioStream(remoteStream); // Play the remote stream
        });
      });
    }
  }

  // Play the audio stream in the browser
  playAudioStream(stream: MediaStream): void {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    document.body.appendChild(audio); // Add the audio element to the body
  }

  // End the current voice call
  endCall(): void {
    if (this.currentCall) {
      this.currentCall.close(); // End the call
      this.myStream.getTracks().forEach((track) => track.stop()); // Stop the local audio stream
      this.currentCall = undefined;
    }
  }
}
