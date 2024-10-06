import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import Peer from 'peerjs';

@Component({
  selector: 'app-voice-channel',
  standalone: true,
  templateUrl: './voice-channel.component.html',
  styleUrls: ['./voice-channel.component.css'],
  imports: [CommonModule]
})
export class VoiceChannelComponent implements OnInit, OnDestroy {
  groupId!: number;
  channelId!: number;
  peer: Peer;
  peerId!: string;
  connectedPeerId!: string;
  localStream!: MediaStream;
  remoteStream!: MediaStream;

  constructor(private route: ActivatedRoute) {
    // Create a new Peer instance with a random ID
    this.peer = new Peer(undefined, { host: 'localhost', port: 9000, path: '/' });
  }

  ngOnInit(): void {
    this.groupId = +this.route.snapshot.paramMap.get('groupId')!;
    this.channelId = +this.route.snapshot.paramMap.get('channelId')!;

    // Get the peer ID of the current user
    this.peer.on('open', (id) => {
      this.peerId = id;
    });

    // Listen for incoming voice calls
    this.peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        this.localStream = stream;
        call.answer(stream); // Answer the call with the local audio stream
        call.on('stream', (remoteStream) => {
          this.remoteStream = remoteStream;
          this.playStream('remoteAudio', remoteStream); // Play the remote stream
        });
      });
    });
  }

  // Call another peer
  callPeer(): void {
    if (this.connectedPeerId) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        this.localStream = stream;
        const call = this.peer.call(this.connectedPeerId, stream); // Call the connected peer
        call.on('stream', (remoteStream) => {
          this.remoteStream = remoteStream;
          this.playStream('remoteAudio', remoteStream); // Play the remote stream
        });
      });
    }
  }

  // Helper function to play the audio stream
  playStream(elementId: string, stream: MediaStream): void {
    const audioElement = document.getElementById(elementId) as HTMLAudioElement;
    audioElement.srcObject = stream;
    audioElement.play();
  }

  ngOnDestroy(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop()); // Stop local stream
    }
    this.peer.destroy(); // Clean up peer instance on component destroy
  }
}
