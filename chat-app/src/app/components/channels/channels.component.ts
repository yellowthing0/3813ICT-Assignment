import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service';
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

  constructor(private route: ActivatedRoute, private socketService: SocketService) {}

  ngOnInit(): void {
    this.groupId = +this.route.snapshot.paramMap.get('groupId')!;
    console.log('Group ID: ', this.groupId);
  }

  ngAfterViewInit(): void {
    this.initializeSocket();
  }

  initializeSocket(): void {
    // Listen for incoming messages and message history
    this.socketService.listenEvent('messageHistory').subscribe((messageHistory: string[]) => {
      console.log('Message history received: ', messageHistory);
      this.messages = messageHistory;
    });

    this.socketService.listenEvent('message').subscribe((message: string) => {
      console.log('Message received from server: ', message);
      this.messages.push(message);
    });

    console.log('Socket connected');
  }

  onChannelSelect(channelId: number): void {
    this.selectedChannel = channelId;
    this.messages = [];
    if (this.selectedChannel === 2) {
      this.initializePeer();
    }
    this.socketService.emitEvent('joinChannel', this.selectedChannel);
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.socketService.emitEvent('message', { channel: this.selectedChannel, message: this.newMessage });
      this.newMessage = '';
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
}
