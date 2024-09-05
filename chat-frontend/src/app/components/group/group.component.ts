import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { GroupService } from '../../services/group.service';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';  // Add FormsModule

@Component({
  selector: 'app-group',
  standalone: true,
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  imports: [CommonModule, FormsModule]  // Add FormsModule here
})
export class GroupComponent implements OnInit {
  user: any = null;
  availableGroups: string[] = [];
  selectedGroup: string | null = null;
  channels: string[] = [];
  usersInGroup: string[] = [];
  newGroupName: string = '';
  newUsername: string = '';

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
      this.groupService.getAllGroups().subscribe({
        next: (response) => {
          this.availableGroups = response.groups;
        },
        error: (error) => {
          console.error('Error fetching all groups', error);
        }
      });
    } else {
      this.availableGroups = this.user.groups;
    }
  }

  selectGroup(group: string) {
    this.selectedGroup = group;

    this.groupService.getUsersInGroup(group).subscribe({
      next: (response: any) => {
        this.usersInGroup = response.users;
      },
      error: (error: any) => {
        console.error('Error fetching users for group', error);
      }
    });

    this.channels = ['Default Channel 1', 'Default Channel 2'];
  }

  selectChannel(channel: string) {
    this.router.navigate(['/chat'], { state: { group: this.selectedGroup, channel } });
  }

  createGroup() {
    if (this.newGroupName) {
      this.groupService.createGroup(this.newGroupName, this.user.username).subscribe({
        next: (response: any) => {
          this.availableGroups = response.groups;
          this.newGroupName = ''; // Clear the input after creating the group
        },
        error: (error: any) => {
          console.error('Error creating group', error);
        }
      });
    }
  }

  deleteGroup() {
    if (this.selectedGroup) {
      this.groupService.deleteGroup(this.selectedGroup, this.user.username).subscribe({
        next: (response: any) => {
          this.availableGroups = response.groups;
          this.selectedGroup = null;
        },
        error: (error: any) => {
          console.error('Error deleting group', error);
        }
      });
    }
  }


  addUserToGroup() {
    if (this.newUsername && this.selectedGroup) {
      this.groupService.inviteUserToGroup(this.selectedGroup, this.newUsername, this.user.username).subscribe({
        next: () => {
          this.newUsername = '';
          this.selectGroup(this.selectedGroup!); // Refresh the group users
        },
        error: (error: any) => {
          console.error('Error adding user to group', error);
        }
      });
    }
  }

  removeUserFromGroup(username: string) {
    if (this.selectedGroup) {
      this.groupService.removeUserFromGroup(this.selectedGroup, username, this.user.username).subscribe({
        next: () => {
          this.selectGroup(this.selectedGroup!); // Refresh the group users
        },
        error: (error: any) => {
          console.error('Error removing user from group', error);
        }
      });
    }
  }

  goBack() {
    this.location.back();
  }
}
