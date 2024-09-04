import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';  // Import CommonModule
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-group',
  standalone: true,
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  imports: [CommonModule]  // Add CommonModule to imports
})
export class GroupComponent {
  user: any = null;  // To store the logged-in user information
  availableGroups: string[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {
    // Access the user data passed from the login page
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['user']) {
      this.user = navigation.extras.state['user'];
      this.setupGroupsForUser();
    } else {
      console.error('No user data found in navigation state');
    }
  }

  // Set available groups based on user roles or group access
  setupGroupsForUser() {
    if (this.user?.roles.includes('Admin')) {
      // If the user is an admin, show all groups
      this.availableGroups = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'];
    } else {
      // If the user is a regular user, only show their specific groups
      this.availableGroups = this.user.groups;  // Assuming user.groups is an array of group names
    }
  }
}
