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
    userId?: string; // Add userId property here
  }[] = [];
  newMessage = '';
  selectedFile?: File; // For image upload
  selectedImageUrl: string | undefined; // Add this property
  errorMessage = ''; // Error message handling

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
    this.initializePeer();
  }

  ngAfterViewInit(): void {
    if (!this.initializedSocket) {
      this.initializeSocket();
      this.initializedSocket = true;
    }
  }

  // Initialize Socket connection and setup event listeners
  initializeSocket(): void {
    console.log('Initializing socket...');

    this.socketService.listenEvent('connect').subscribe(() => {
      console.log('Socket connected');
      this.authenticateSocket();
    });

    this.listenToEvents();
  }

  // Authenticate socket connection with JWT
  authenticateSocket(): void {
    let token: string | null = '';

    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }

    if (token) {
      this.socketService.emitEvent('authenticate', token);
    } else {
      console.error('Token not found. Cannot authenticate socket.');
    }
  }

  // Listen to various socket events
  listenToEvents(): void {
    this.socketService.listenEvent('messageHistory').subscribe(
      (messageHistory: any[]) => {
        this.handleMessageHistory(messageHistory);
      },
      (error) => {
        console.error('Error receiving message history:', error);
      }
    );

    this.socketService.listenEvent('message').subscribe(
      (message: any) => {
        this.handleNewMessage(message);
      },
      (error) => {
        console.error('Error receiving new message:', error);
      }
    );

    this.socketService.listenEvent('profilePictureUpdated').subscribe(
      (data: any) => {
        this.updateProfilePicture(data);
      },
      (error) => {
        console.error('Error receiving profile picture update:', error);
      }
    );

    this.socketService.listenEvent('disconnect').subscribe(() => {
      console.log('Socket disconnected');
    });
  }

  // Handle received message history
  handleMessageHistory(messageHistory: any[]): void {
    console.log('Message history received: ', messageHistory);
    this.messages = messageHistory.map((msg) => ({
      username: msg.username || 'Unknown User',
      message: msg.message,
      imageUrl: msg.imageUrl, // Handle image URLs
      profilePictureUrl: msg.profilePictureUrl, // Handle profile picture URL
      timestamp: new Date(msg.timestamp).toLocaleString(),
      userId: msg.userId, // Ensure userId is included
    }));
    this.cdr.detectChanges(); // Update the UI
  }

  // Handle new messages from other users
  // Handle new messages from other users
  handleNewMessage(message: any): void {
    console.log('New message received from server: ', message);
    this.messages.push({
      username: message.username || 'Unknown User',
      message: message.message,
      imageUrl: message.imageUrl, // Handle image URLs
      profilePictureUrl: message.profilePictureUrl, // Handle profile picture URL
      timestamp: new Date(message.timestamp).toLocaleString(),
      userId: message.userId, // Ensure userId is captured
    });
    this.cdr.detectChanges();
  }

  // Update profile picture in the chat when changed by a user
  updateProfilePicture(data: any): void {
    console.log('Profile picture updated for user:', data.userId);
    this.messages.forEach((msg) => {
      if (msg.userId === data.userId) {
        // No more errors, as userId exists
        msg.profilePictureUrl = data.profilePictureUrl; // Update profile picture URL
      }
    });
    this.cdr.detectChanges();
  }

  // Handle channel selection and joining
  onChannelSelect(channelId: number): void {
    this.selectedChannel = channelId;

    this.messages = [];

    if (this.groupId && this.selectedChannel) {
      this.socketService.emitEvent('joinChannel', {
        groupId: this.groupId,
        channel: this.selectedChannel,
      });
    }
  }

  // Handle file selection for image upload
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Send text or image message
  sendMessage(): void {
    if (!this.newMessage.trim() && !this.selectedFile) {
      this.errorMessage = 'Cannot send an empty message.';
      return;
    }

    let token: string | null = '';

    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('chatImage', this.selectedFile);

      this.socketService.uploadImage(formData).subscribe(
        (response: any) => {
          this.socketService.emitEvent('message', {
            token,
            groupId: this.groupId,
            channel: this.selectedChannel,
            message: this.newMessage,
            imageUrl: response.imageUrl,
          });
          this.resetMessage();
        },
        (error) => {
          this.errorMessage = 'Error uploading image.';
          console.error('Error uploading image:', error);
        }
      );
    } else {
      this.socketService.emitEvent('message', {
        token,
        groupId: this.groupId,
        channel: this.selectedChannel,
        message: this.newMessage,
        imageUrl: '',
      });
      this.resetMessage();
    }
  }

  // Reset message input after sending
  resetMessage(): void {
    this.newMessage = '';
    this.selectedFile = undefined;
    this.selectedImageUrl = undefined;
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
          this.displayVideo('local-video', stream);

          call.answer(stream);

          call.on('stream', (remoteStream: MediaStream) => {
            this.remoteVideoStream = remoteStream;
            this.displayVideo('remote-video', remoteStream);
          });
        })
        .catch((error) => {
          console.error('Error accessing media devices:', error);
        });
    });
  }

  startCall(): void {
    if (this.remotePeerId) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          this.localVideoStream = stream;
          this.displayVideo('local-video', stream);

          this.currentCall = this.peer.call(this.remotePeerId, stream);

          this.currentCall.on('stream', (remoteStream: MediaStream) => {
            this.remoteVideoStream = remoteStream;
            this.displayVideo('remote-video', remoteStream);
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

  displayVideo(elementId: string, stream: MediaStream): void {
    const videoElement = document.getElementById(elementId) as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.play();
    }
  }

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

  getChatImageUrl(imageUrl: string | undefined): string {
    return imageUrl ? `http://localhost:3000${imageUrl}` : '';
  }

  getProfileImageUrl(profilePictureUrl: string | undefined): string {
    return profilePictureUrl
      ? `http://localhost:3000${profilePictureUrl}`
      : `http://localhost:4200/assets/default-profile.png`;
  }

  goBack(): void {
    this.location.back();
  }
}
