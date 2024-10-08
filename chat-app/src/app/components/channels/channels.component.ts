import { ChangeDetectorRef, Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SocketService } from '../../services/socket.service';
import Peer, { MediaConnection } from 'peerjs';
import { Location } from '@angular/common';

@Component({
  selector: 'app-channels',
  standalone: true,
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule],
})
export class ChannelsComponent implements OnInit, AfterViewInit {
  channels = [
    { id: 1, name: 'Text' },
    { id: 2, name: 'Voice' }
  ];
  selectedChannel?: number;
  groupId?: number;
  messages: { message: string, timestamp: string, imageUrl?: string }[] = [];
  newMessage = '';
  selectedFile?: File; // Store the selected image file

  // Voice chat
  peer!: Peer;
  myStream!: MediaStream;
  currentCall?: MediaConnection;
  peerId: string = '';
  connectedPeerId: string = '';

  private initializedSocket = false;

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.groupId = +this.route.snapshot.paramMap.get('groupId')!;
    console.log('Group ID: ', this.groupId);
  }

  ngAfterViewInit(): void {
    if (!this.initializedSocket) {
      this.initializeSocket();
      this.initializedSocket = true;
    }
  }

  initializeSocket(): void {
    console.log('Initializing socket...');

    this.socketService.listenEvent('messageHistory').subscribe((messageHistory: any[]) => {
      console.log('Message history received: ', messageHistory);
      this.messages = messageHistory.map((msg) => ({
        message: msg.message,
        imageUrl: msg.imageUrl ? this.getImageUrl(msg.imageUrl) : undefined, // Handle image URL
        timestamp: new Date(msg.timestamp).toLocaleString()
      }));
      this.cdr.detectChanges();
    });

    this.socketService.listenEvent('message').subscribe((message: any) => {
      console.log('Message received from server: ', message);
      this.messages.push({
        message: message.message,
        imageUrl: message.imageUrl ? this.getImageUrl(message.imageUrl) : undefined, // Handle image URL
        timestamp: new Date(message.timestamp).toLocaleString()
      });
      this.cdr.detectChanges();
    });

    this.socketService.listenEvent('connect').subscribe(() => {
      console.log('Socket connected');
    });
    this.socketService.listenEvent('disconnect').subscribe(() => {
      console.log('Socket disconnected');
    });
  }

  // Handle channel selection and joining
  onChannelSelect(channelId: number): void {
    this.selectedChannel = channelId;
    this.messages = []; // Clear previous messages

    if (this.selectedChannel === 2) {
      this.initializePeer(); // Initialize Peer.js for voice chat
    }

    // Join the selected channel
    if (this.groupId && this.selectedChannel) {
      this.socketService.emitEvent('joinChannel', {
        groupId: this.groupId,
        channel: this.selectedChannel
      });
    }
  }

  // Function to handle file selection
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0]; // Get the selected file
  }

  // Function to send a message (text or with image)
  sendMessage(): void {
    if (this.newMessage.trim() || this.selectedFile) {
      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('chatImage', this.selectedFile);

        // Upload image to server and send the message with imageUrl
        this.socketService.uploadImage(formData).subscribe((response: any) => {
          this.socketService.emitEvent('message', {
            groupId: this.groupId,
            channel: this.selectedChannel,
            message: this.newMessage,
            imageUrl: response.imageUrl // Include uploaded image URL
          });
          this.newMessage = '';
          this.selectedFile = undefined; // Reset the file input after upload
        });
      } else {
        // Send message without image
        this.socketService.emitEvent('message', {
          groupId: this.groupId,
          channel: this.selectedChannel,
          message: this.newMessage,
          imageUrl: '' // Empty when no image is sent
        });
        this.newMessage = '';
      }
    }
  }

  // Function to get full image URL
  getImageUrl(imageUrl: string): string {
    return `http://localhost:3000${imageUrl}`; // Load image from backend server (localhost:3000)
  }

  // Peer.js related functions (for voice chat)
  initializePeer(): void {
    console.log('Initializing Peer...');
    this.peer = new Peer();

    this.peer.on('open', (id: string) => {
      this.peerId = id;
      console.log(`Peer ID: ${id}`);
    });

    this.peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        call.answer(stream);
        this.myStream = stream;

        call.on('stream', (remoteStream: MediaStream) => {
          this.playAudioStream(remoteStream);
        });
      });
    });
  }

  startCall(): void {
    if (this.connectedPeerId.trim()) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        this.myStream = stream;
        this.currentCall = this.peer.call(this.connectedPeerId, stream);

        this.currentCall.on('stream', (remoteStream: MediaStream) => {
          this.playAudioStream(remoteStream);
        });
      });
    }
  }

  playAudioStream(stream: MediaStream): void {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    document.body.appendChild(audio);
  }

  endCall(): void {
    if (this.currentCall) {
      this.currentCall.close();
      this.myStream.getTracks().forEach((track) => track.stop());
      this.currentCall = undefined;
    }
  }

  goBack(): void {
    this.location.back();
  }
}
