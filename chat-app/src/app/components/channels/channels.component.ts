import {
  ChangeDetectorRef,
  Component,
  OnInit,
  AfterViewInit,
  Inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { SocketService } from '../../services/socket.service';
import Peer, { MediaConnection } from 'peerjs';
import { Location } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
    { id: 2, name: 'Voice/Video' },
  ];
  selectedChannel?: number;
  groupId?: number;
  messages: {
    username: string;
    message: string;
    timestamp: string;
    imageUrl?: string;
    profilePictureUrl?: string;
  }[] = [];
  newMessage = '';
  selectedFile?: File; // For image upload

  // Voice and video chat
  peer!: Peer;
  myStream!: MediaStream;
  currentCall?: MediaConnection;
  peerId: string = '';
  remotePeerId: string = '1'; // Set the peer ID to '1'
  localVideoStream?: MediaStream;
  remoteVideoStream?: MediaStream;

  private initializedSocket = false;

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
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

    this.socketService.listenEvent('connect').subscribe(() => {
      console.log('Socket connected');

      let token: string | null = '';

      if (isPlatformBrowser(this.platformId)) {
        token = localStorage.getItem('token'); // Retrieve JWT token from localStorage
      }

      if (token) {
        // Authenticate the socket connection with the token
        this.socketService.emitEvent('authenticate', token);
      } else {
        console.error('No JWT token found for socket authentication');
      }
    });


    // Listening to message history from the server
    this.socketService
      .listenEvent('messageHistory')
      .subscribe((messageHistory: any[]) => {
        console.log('Message history received: ', messageHistory);
        this.messages = messageHistory.map((msg) => ({
          username: msg.username || 'Unknown User',
          message: msg.message,
          imageUrl: msg.imageUrl, // Handle image URLs
          profilePictureUrl: msg.profilePictureUrl, // Handle profile picture URL
          timestamp: new Date(msg.timestamp).toLocaleString(),
        }));
        this.cdr.detectChanges();
      });

    // Listening to new incoming messages
    this.socketService.listenEvent('message').subscribe((message: any) => {
      console.log('Message received from server: ', message);
      this.messages.push({
        username: message.username || 'Unknown User',
        message: message.message,
        imageUrl: message.imageUrl, // Handle image URLs
        profilePictureUrl: message.profilePictureUrl, // Handle profile picture URL
        timestamp: new Date(message.timestamp).toLocaleString(),
      });
      this.cdr.detectChanges();
    });

    // Listening to disconnect events
    this.socketService.listenEvent('disconnect').subscribe(() => {
      console.log('Socket disconnected');
    });
  }

  // Handle channel selection and joining
  onChannelSelect(channelId: number): void {
    this.selectedChannel = channelId;

    // Clear previous messages (client-side) only if this is a new channel
    this.messages = [];

    // Fetch and load previous chat history
    if (this.groupId && this.selectedChannel) {
      this.socketService.emitEvent('joinChannel', {
        groupId: this.groupId,
        channel: this.selectedChannel,
      });

      // Wait for message history response from the server
      this.socketService.listenEvent('messageHistory').subscribe((history: any[]) => {
        console.log('Received message history:', history);

        this.messages = history.map((msg) => ({
          username: msg.username || 'Unknown User',
          message: msg.message,
          imageUrl: msg.imageUrl,
          profilePictureUrl: msg.profilePictureUrl,
          timestamp: new Date(msg.timestamp).toLocaleString(),
        }));

        // Append the messages to the chat view
        this.cdr.detectChanges();
      });
    }
  }


  // Handle file selection for image upload
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0]; // Get the selected file
  }

  // Send text or image message
  sendMessage(): void {
    if (this.newMessage.trim() || this.selectedFile) {
      let token: string | null = '';

      // Check if code is running in the browser
      if (isPlatformBrowser(this.platformId)) {
        token = localStorage.getItem('token'); // Get JWT token from localStorage only in the browser
      }

      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('chatImage', this.selectedFile);

        // Upload image to server and send message with imageUrl
        this.socketService.uploadImage(formData).subscribe((response: any) => {
          this.socketService.emitEvent('message', {
            groupId: this.groupId,
            channel: this.selectedChannel,
            message: this.newMessage,
            imageUrl: response.imageUrl, // Include uploaded image URL
          });
          this.newMessage = '';
          this.selectedFile = undefined; // Reset after upload
        });
      } else {
        // Send message without image
        this.socketService.emitEvent('message', {
          groupId: this.groupId,
          channel: this.selectedChannel,
          message: this.newMessage,
          imageUrl: '', // No image
        });
        this.newMessage = '';
      }
    }
  }

  // Peer.js for voice and video chat
  initializePeer(): void {
    console.log('Initializing Peer...');
    this.peer = new Peer();

    this.peer.on('open', (id: string) => {
      this.peerId = id;
      console.log(`Peer ID: ${id}`);
    });

    this.peer.on('call', (call) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          this.localVideoStream = stream;
          this.displayVideo('local-video', stream); // Display local video

          call.answer(stream); // Answer the call with our local stream

          call.on('stream', (remoteStream: MediaStream) => {
            this.remoteVideoStream = remoteStream;
            this.displayVideo('remote-video', remoteStream); // Display remote video
          });
        });
    });
  }

  // Start a video call to peer with ID '1'
  startCall(): void {
    if (this.remotePeerId) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          this.localVideoStream = stream;
          this.displayVideo('local-video', stream); // Display local video

          this.currentCall = this.peer.call(this.remotePeerId, stream);

          this.currentCall.on('stream', (remoteStream: MediaStream) => {
            this.remoteVideoStream = remoteStream;
            this.displayVideo('remote-video', remoteStream); // Display remote video
          });

          this.currentCall.on('error', (err) => {
            console.error('Error during call:', err);
          });

          this.currentCall.on('close', () => {
            console.log('Call ended');
          });
        })
        .catch((error) => {
          console.error('Error accessing media devices:', error);
        });
    }
  }

  // Play the video stream
  displayVideo(elementId: string, stream: MediaStream): void {
    const videoElement = document.getElementById(elementId) as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.play();
    }
  }

  // End the current video call
  endCall(): void {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = undefined;
    }

    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach((track) => track.stop());
    }

    if (this.remoteVideoStream) {
      this.remoteVideoStream.getTracks().forEach((track) => track.stop());
    }
  }

  // Fetch the chat image from the backend
  getChatImageUrl(imageUrl: string | undefined): string {
    if (imageUrl && imageUrl !== '') {
      // Serve chat images from the backend server (localhost:3000/uploads/)
      return `http://localhost:3000${imageUrl}`;
    }
    return ''; // Return an empty string or add a placeholder URL
  }

  // Fetch the profile image from the frontend assets folder
  getProfileImageUrl(profilePictureUrl: string | undefined): string {
    if (profilePictureUrl && profilePictureUrl !== '') {
      // Serve profile pictures from the assets (frontend at localhost:4200)
      return `http://localhost:4200${profilePictureUrl}`;
    } else {
      // If no profile picture URL, use the default one from assets
      return `http://localhost:4200/assets/default-profile.png`;
    }
  }

  goBack(): void {
    this.location.back();
  }
}
