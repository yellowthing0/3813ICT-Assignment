import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-group',
  standalone: true,
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  imports: [CommonModule]
})
export class GroupComponent {
  user: any = null;
  availableGroups: string[] = [];
  selectedGroup: string | null = null;  // To store the selected group
  channels: string[] = [];  // To store the channels for the selected group

  constructor(private route: ActivatedRoute, private router: Router) {
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
      this.availableGroups = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'];
    } else {
      this.availableGroups = this.user.groups;  // Assuming user.groups is an array of group names
    }
  }

  // Method to load channels when a group is selected
  selectGroup(group: string) {
    this.selectedGroup = group;

    // For demonstration purposes, we'll hardcode the channels, but in a real application,
    // you would likely fetch this data from an API based on the selected group.
    if (group === 'Group 1') {
      this.channels = ['Channel 1', 'Channel 2', 'Channel 3'];
    } else if (group === 'Group 2') {
      this.channels = ['Channel A', 'Channel B', 'Channel C'];
    } else {
      this.channels = ['Default Channel 1', 'Default Channel 2'];
    }
  }

  // Method to handle channel selection
  selectChannel(channel: string) {
    console.log(`Selected channel: ${channel} in group: ${this.selectedGroup}`);
    // Navigate to the chat component with the selected channel
    this.router.navigate(['/chat'], { state: { group: this.selectedGroup, channel } });
  }
}
