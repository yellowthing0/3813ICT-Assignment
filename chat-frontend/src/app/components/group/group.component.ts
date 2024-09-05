import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { GroupService } from '../../services/group.service';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';

interface User {
  username: string;
  roles: string[];
  groups: string[];
}

@Component({
  selector: 'app-group',
  standalone: true,
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class GroupComponent implements OnInit {
  user: User | null = null;
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;  // New flag for Super Admin check
  availableGroups: string[] = [];
  selectedGroup: string | null = null;
  channels: string[] = [];
  usersInGroup: string[] = [];
  newGroupName: string = '';
  newUsername: string = '';
  newUser = {
    username: '',
    password: '',
    roles: ['User'],
    groups: []  // Ensure 'groups' is initialized as an empty array
  };

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
      this.isAdmin = this.user.roles.includes('Admin');
      this.isSuperAdmin = this.user.roles.includes('Super Admin');  // Check for Super Admin
      this.setupGroupsForUser();
    } else {
      console.error('No user data found');
    }
  }

  setupGroupsForUser() {
    if (this.isSuperAdmin) {
      // Super Admin sees all groups
      this.groupService.getAllGroups().subscribe({
        next: (response) => {
          this.availableGroups = response.groups;
        },
        error: (error) => {
          console.error('Error fetching all groups', error);
        }
      });
    } else if (this.isAdmin) {
      // Group Admin sees only their groups
      this.availableGroups = this.user?.groups || [];
    } else {
      // Regular user sees only their groups
      this.availableGroups = this.user?.groups || [];
    }
  }

  // Promote or demote a user (Super Admin)
  changeUserRole(username: string, action: 'promote' | 'demote') {
    if (this.isSuperAdmin) {
      this.userService.changeUserRole(username, action).subscribe({
        next: (response) => {
          console.log(`${username} has been ${action === 'promote' ? 'promoted to' : 'demoted from'} admin.`);
        },
        error: (error) => {
          console.error(`Error ${action}ing user:`, error);
        }
      });
    }
  }

  // Create a new user (Super Admin)
  createUser() {
    if (this.isSuperAdmin && this.newUser.username && this.newUser.password) {
      this.userService.createUser(this.newUser).subscribe({
        next: (response) => {
          console.log('User created successfully.');
          this.newUser = { username: '', password: '', roles: ['User'], groups: [] };  // Reset fields after user creation
        },
        error: (error) => {
          console.error('Error creating user:', error);
        }
      });
    }
  }

  // Delete a user (Super Admin)
  deleteUser(username: string) {
    if (this.isSuperAdmin) {
      this.userService.deleteUser(username).subscribe({
        next: (response) => {
          console.log(`User ${username} deleted successfully.`);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  selectGroup(group: string) {
    this.selectedGroup = group;
    this.groupService.getUsersInGroup(group).subscribe({
      next: (response) => {
        this.usersInGroup = response.users;
      },
      error: (error) => {
        console.error('Error fetching users for group', error);
      }
    });
  }

  createGroup() {
    if (this.newGroupName.trim() && this.user?.username) {
      this.groupService.createGroup(this.newGroupName, this.user.username).subscribe({
        next: (response) => {
          this.availableGroups = response.groups;
          this.newGroupName = '';  // Clear input after creating the group
        },
        error: (error) => {
          console.error('Error creating group:', error);
        }
      });
    }
  }

  deleteGroup() {
    if (this.selectedGroup && this.user?.username) {
      this.groupService.deleteGroup(this.selectedGroup, this.user.username).subscribe({
        next: (response) => {
          this.availableGroups = response.groups;
          this.selectedGroup = null;  // Clear selection after deletion
        },
        error: (error) => {
          console.error('Error deleting group:', error);
        }
      });
    }
  }

  inviteUser() {
    if (this.selectedGroup && this.newUsername.trim() && this.user?.username) {
      this.groupService.inviteUserToGroup(this.selectedGroup, this.newUsername, this.user.username).subscribe({
        next: (response) => {
          this.usersInGroup = response.users;
          this.newUsername = '';  // Clear input after inviting user
        },
        error: (error) => {
          console.error('Error inviting user to group', error);
        }
      });
    }
  }

  removeUser(username: string) {
    if (this.selectedGroup && username && this.user?.username) {
      this.groupService.removeUserFromGroup(this.selectedGroup, username, this.user.username).subscribe({
        next: (response) => {
          this.usersInGroup = response.users;
        },
        error: (error) => {
          console.error('Error removing user from group', error);
        }
      });
    }
  }

  selectChannel(channel: string) {
    if (this.selectedGroup) {
      this.router.navigate(['/chat'], { state: { group: this.selectedGroup, channel } });
    }
  }

  goBack() {
    this.location.back();
  }
}
