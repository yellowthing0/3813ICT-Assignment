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
    userId?: string;
  }[] = [];
  newMessage = '';
  selectedFile?: File;

  peer!: Peer;
  myStream!: MediaStream;
  currentCall?: MediaConnection;
  peerId: string = '';
  remotePeerId: string = '1';
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
        token = localStorage.getItem('token');
      }

      this.socketService.emitEvent('authenticate', token);
    });

    this.socketService
      .listenEvent('messageHistory')
      .subscribe((messageHistory: any[]) => {
        console.log('Message history received: ', messageHistory);
        this.messages = messageHistory.map((msg) => ({
          username: msg.username || 'Unknown User',
          message: msg.message,
          imageUrl: msg.imageUrl,
          profilePictureUrl: msg.profilePictureUrl,
          userId: msg.userId,
          timestamp: new Date(msg.timestamp).toLocaleString(),
        }));
        this.cdr.detectChanges();
      });

    this.socketService.listenEvent('message').subscribe((message: any) => {
      console.log('Message received from server: ', message);
      this.messages.push({
        username: message.username || 'Unknown User',
        message: message.message,
        imageUrl: message.imageUrl,
        profilePictureUrl: message.profilePictureUrl,
        userId: message.userId,
        timestamp: new Date(message.timestamp).toLocaleString(),
      });
      this.cdr.detectChanges();
    });

    this.socketService
      .listenEvent('profilePictureUpdated')
      .subscribe((data: any) => {
        console.log('Profile picture updated for user:', data.userId);

        this.messages.forEach((msg) => {
          if (msg.userId === data.userId) {
            msg.profilePictureUrl = data.profilePictureUrl;
          }
        });
        this.cdr.detectChanges();
      });

    this.socketService.listenEvent('disconnect').subscribe(() => {
      console.log('Socket disconnected');
    });
  }

  onChannelSelect(channelId: number): void {
    this.selectedChannel = channelId;

    this.messages = [];

    if (this.groupId && this.selectedChannel) {
      this.socketService.emitEvent('joinChannel', {
        groupId: this.groupId,
        channel: this.selectedChannel,
      });

      this.socketService
        .listenEvent('messageHistory')
        .subscribe((history: any[]) => {
          console.log('Received message history:', history);

          this.messages = history.map((msg) => ({
            username: msg.username || 'Unknown User',
            message: msg.message,
            imageUrl: msg.imageUrl,
            profilePictureUrl: msg.profilePictureUrl,
            timestamp: new Date(msg.timestamp).toLocaleString(),
            userId: msg.userId
          }));

          this.cdr.detectChanges();
        });
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  sendMessage(): void {
    if (this.newMessage.trim() || this.selectedFile) {
      let token: string | null = '';

      if (isPlatformBrowser(this.platformId)) {
        token = localStorage.getItem('token');
      }

      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('chatImage', this.selectedFile);

        this.socketService.uploadImage(formData).subscribe((response: any) => {
          this.socketService.emitEvent('message', {
            groupId: this.groupId,
            channel: this.selectedChannel,
            message: this.newMessage,
            imageUrl: response.imageUrl,
          });
          this.newMessage = '';
          this.selectedFile = undefined;
        });
      } else {
        this.socketService.emitEvent('message', {
          groupId: this.groupId,
          channel: this.selectedChannel,
          message: this.newMessage,
          imageUrl: '',
        });
        this.newMessage = '';
      }
    }
  }

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
    if (imageUrl && imageUrl !== '') {
      return `http://localhost:3000${imageUrl}`;
    }
    return '';
  }

  getProfileImageUrl(profilePictureUrl: string | undefined): string {
    if (profilePictureUrl && profilePictureUrl !== '') {
      // Serve profile pictures from the backend server (localhost:3000)
      return `http://localhost:3000${profilePictureUrl}`;
    } else {
      // Serve default profile picture from backend assets
      return `http://localhost:3000/assets/default-profile.png`; // Adjust to match backend's port and path
    }
  }


  goBack(): void {
    this.location.back();
  }
}
