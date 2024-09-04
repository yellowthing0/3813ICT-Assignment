import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule], // Import CommonModule and FormsModule
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  messages = [
    { username: 'User1', text: 'Hello!' },
    { username: 'User2', text: 'Hi there!' },
  ];
  messageText = '';

  sendMessage() {
    if (this.messageText.trim()) {
      this.messages.push({ username: 'You', text: this.messageText });
      this.messageText = ''; // Clear the input
    }
  }
}
