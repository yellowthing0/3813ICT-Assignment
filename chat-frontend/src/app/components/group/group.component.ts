import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';  // Import Location for backward navigation
import { GroupService } from '../../services/group.service';  // Make sure to use the service
import { UserService } from '../../services/user.service';
import { HttpClient } from '@angular/common/http'; // Import HttpClient

@Component({
  selector: 'app-group',
  standalone: true,
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  imports: [CommonModule]
})
export class GroupComponent implements OnInit {
  user: any = null;
  availableGroups: string[] = [];
  selectedGroup: string | null = null;
  channels: string[] = [];
  usersInGroup: string[] = [];  // This stores users of the selected group

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private groupService: GroupService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.user = this.userService.getUser();
    if (this.user) {
      this.setupGroupsForUser();
    } else {
      console.error('No user data found');
    }
  }

  setupGroupsForUser() {
    if (this.user?.roles.includes('Admin')) {
      // Fetch all groups from the API for Admins
      this.groupService.getAllGroups().subscribe({
        next: (response) => {
          this.availableGroups = response.groups;
        },
        error: (error) => {
          console.error('Error fetching all groups', error);
        }
      });
    } else {
      // Non-admin users only see their own groups
      this.availableGroups = this.user.groups;
    }
  }

  selectGroup(group: string) {
    this.selectedGroup = group;

    // Fetch users for the selected group
    this.groupService.getUsersInGroup(group).subscribe({
      next: (response) => {
        this.usersInGroup = response.users;
      },
      error: (error) => {
        console.error('Error fetching users for group', error);
      }
    });

    // Set channels based on selected group
    if (group === 'Group 1') {
      this.channels = ['Channel 1', 'Channel 2', 'Channel 3'];
    } else if (group === 'Group 2') {
      this.channels = ['Channel A', 'Channel B', 'Channel C'];
    } else {
      this.channels = ['Default Channel 1', 'Default Channel 2'];
    }
  }

  // Add the missing selectChannel method
  selectChannel(channel: string) {
    // Navigate to the chat component and pass group and channel information
    this.router.navigate(['/chat'], { state: { group: this.selectedGroup, channel } });
  }

  goBack() {
    this.location.back();  // This will navigate to the previous page in the browser history
  }
}

