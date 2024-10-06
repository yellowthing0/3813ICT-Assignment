import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-channel',
  standalone: true,
  templateUrl: './text-channel.component.html',
  styleUrls: ['./text-channel.component.css'],
  imports: [CommonModule, FormsModule], // Remove SocketIoModule here
  providers: [Socket] // Socket provider for real-time communication
})
export class TextChannelComponent implements OnInit {
  groupId!: number;
  channelId!: number;
  message = '';
  messages: string[] = [];

  constructor(private route: ActivatedRoute, private socket: Socket) {}

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('groupId');
    const channelId = this.route.snapshot.paramMap.get('channelId');

    this.groupId = groupId ? +groupId : 0;
    this.channelId = channelId ? +channelId : 0;

    // Join the text channel
    this.socket.emit('joinChannel', { groupId: this.groupId, channelId: this.channelId });

    // Listen for incoming messages
    this.socket.fromEvent<string>('message').subscribe((msg) => {
      this.messages.push(msg);
    });
  }

  sendMessage(): void {
    if (this.message.trim()) {
      this.socket.emit('message', { groupId: this.groupId, channelId: this.channelId, content: this.message });
      this.message = ''; // Clear the input after sending the message
    }
  }
}
