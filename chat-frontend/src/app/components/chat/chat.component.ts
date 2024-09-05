import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // Import HttpClient
import { Location } from '@angular/common';  // Import Location for backward navigation

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ChatComponent implements OnInit {
  group: string | null = null;
  channel: string | null = null;
  messageText: string = '';
  messages: string[] = [];
  users: string[] = [];  // Store the list of users

  constructor(private router: Router, private http: HttpClient, private location: Location) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.group = navigation.extras.state['group'];
      this.channel = navigation.extras.state['channel'];
    }
  }

  ngOnInit(): void {
    // Fetch users for the group
    if (this.group) {
      this.http.get<{ success: boolean, users: string[] }>(`http://localhost:5000/api/groups/${this.group}/users`)
        .subscribe(response => {
          if (response.success) {
            this.users = response.users;  // Set the users list dynamically
          }
        }, error => {
          console.error('Error fetching users for group:', error);
        });
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
