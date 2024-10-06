// app/components/chat/chat.component.ts
import { Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  message: string = '';
  messages: string[] = [];

  constructor(private socket: Socket) { }

  ngOnInit() {
    // Listen for incoming messages
    this.socket.fromEvent<string>('message').subscribe(msg => {
      this.messages.push(msg);
    });
  }

  sendMessage() {
    if (this.message) {
      // Emit message to server
      this.socket.emit('message', this.message);
      this.message = '';
    }
  }
}
