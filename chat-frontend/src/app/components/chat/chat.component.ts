import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';  // Import Location for backward navigation

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ChatComponent {
  group: string | null = null;
  channel: string | null = null;
  messageText: string = '';
  messages: string[] = [];

  constructor(private router: Router, private location: Location) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.group = navigation.extras.state['group'];
      this.channel = navigation.extras.state['channel'];
    }
  }

  sendMessage() {
    if (this.messageText.trim()) {
      this.messages.push(this.messageText);
      this.messageText = '';
    }
  }

  // Add a method to go back to the previous page
  goBack() {
    this.location.back();  // Navigate to the previous page
  }
}
