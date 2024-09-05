import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // Import FormsModule for ngModel
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule, FormsModule]  // Add CommonModule and FormsModule
})
export class ChatComponent {
  group: string | null = null;
  channel: string | null = null;
  messageText: string = '';  // Add messageText property for two-way binding
  messages: string[] = [];  // Store chat messages

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.group = navigation.extras.state['group'];
      this.channel = navigation.extras.state['channel'];
    }
  }

  // Define the sendMessage method
  sendMessage() {
    if (this.messageText.trim()) {
      // Add the new message to the messages array
      this.messages.push(this.messageText);
      this.messageText = '';  // Clear the input field after sending the message
    }
  }
}
