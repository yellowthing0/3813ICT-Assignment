import { ChangeDetectorRef, Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service';
import Peer, { MediaConnection } from 'peerjs';
import { Location } from '@angular/common';

@Component({
  selector: 'app-channels',
  standalone: true,
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.css'],
  imports: [CommonModule, FormsModule],
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
  selectedFile?: File;  // <-- Track selected image file

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
        imageUrl: msg.imageUrl,
        timestamp: new Date(msg.timestamp).toLocaleString()
      }));
      this.cdr.detectChanges();
    });

    this.socketService.listenEvent('message').subscribe((message: any) => {
      console.log('Message received from server: ', message);
      this.messages.push({
        message: message.message,
        imageUrl: message.imageUrl,
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

  onChannelSelect(channelId: number): void {
    this.selectedChannel = channelId;
    this.messages = [];

    if (this.selectedChannel === 2) {
      this.initializePeer();
    }

    if (this.groupId && this.selectedChannel) {
      this.socketService.emitEvent('joinChannel', {
        groupId: this.groupId,
        channel: this.selectedChannel
      });
    }
  }

  // Handle file selection for image upload
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  sendMessage(): void {
    if (this.selectedFile) {
      // If an image is selected, upload it first
      const formData = new FormData();
      formData.append('chatImage', this.selectedFile);

      this.socketService.uploadImage(formData).subscribe((response: any) => {
        const imageUrl = response.imageUrl;
        this.emitMessage(imageUrl); // Send the image URL in the message
      });

      this.selectedFile = undefined; // Reset selected file after upload
    } else {
      // If no image, just send the text message
      this.emitMessage();
    }
  }

  // Emit message with or without an image URL
  emitMessage(imageUrl?: string): void {
    this.socketService.emitEvent('message', {
      groupId: this.groupId,
      channel: this.selectedChannel,
      message: this.newMessage || '', // Send empty string if no message
      imageUrl: imageUrl || null // Send image URL or null
    });
    this.newMessage = ''; // Clear the message input
  }

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
