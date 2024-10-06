import { ChangeDetectorRef, Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service'; // Adjusted path
import Peer, { MediaConnection } from 'peerjs';

@Component({
  selector: 'app-channels',
  standalone: true,
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ChannelsComponent implements OnInit, AfterViewInit {
  channels = [
    { id: 1, name: 'Text' },
    { id: 2, name: 'Voice' }
  ];
  selectedChannel?: number;
  groupId?: number;
  messages: string[] = [];
  newMessage = '';

  // Voice chat
  peer!: Peer;
  myStream!: MediaStream;
  currentCall?: MediaConnection;
  peerId: string = '';
  connectedPeerId: string = '';

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Group ID is ready in ngOnInit
    this.groupId = +this.route.snapshot.paramMap.get('groupId')!;
    console.log('Group ID: ', this.groupId);
  }

  ngAfterViewInit(): void {
    // Only after the view has rendered, initialize socket connections
    this.initializeSocket();
  }

  initializeSocket(): void {
    console.log('Initializing socket...');

    // Receive message history
    this.socketService.listenEvent('messageHistory').subscribe((messageHistory: string[]) => {
      console.log('Message history received: ', messageHistory);
      this.messages = messageHistory;
      this.cdr.detectChanges(); // Ensure view is updated
    });

    // Listen for incoming messages
    this.socketService.listenEvent('message').subscribe((message: string) => {
      console.log('Message received from server: ', message);
      this.messages.push(message);

      // Manually trigger change detection to update the view
      this.cdr.detectChanges();
    });

    // Connection events
    this.socketService.listenEvent('connect').subscribe(() => {
      console.log('Socket connected');
    });
    this.socketService.listenEvent('disconnect').subscribe(() => {
      console.log('Socket disconnected');
    });
  }

  // Select the text or voice channel
  onChannelSelect(channelId: number): void {
    this.selectedChannel = channelId;
    this.messages = []; // Clear messages when switching channels

    if (this.selectedChannel === 2) {
      this.initializePeer();
    }

    // Join the selected channel
    this.socketService.emitEvent('joinChannel', this.selectedChannel);
  }

  // Send a message (text chat)
  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.socketService.emitEvent('message', { channel: this.selectedChannel, message: this.newMessage });
      this.newMessage = '';
    }
  }

  // Initialize Peer.js for voice chat
  initializePeer(): void {
    console.log('Initializing Peer...');
    this.peer = new Peer();

    this.peer.on('open', (id: string) => {
      this.peerId = id;
      console.log(`Peer ID: ${id}`);
    });

    // Answer incoming calls
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

  // Start a voice call
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

  // Play the audio stream in the browser
  playAudioStream(stream: MediaStream): void {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    document.body.appendChild(audio);
  }

  // End the current voice call
  endCall(): void {
    if (this.currentCall) {
      this.currentCall.close();
      this.myStream.getTracks().forEach((track) => track.stop());
      this.currentCall = undefined;
    }
  }
}
