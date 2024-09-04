import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  username: string;
  email: string;
  id: number;
  roles: string[];
  groups: string[];
  password: string;
}

interface Group {
  name: string;
  members: User[];
}

@Component({
  selector: 'app-group',
  standalone: true,
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  imports: [CommonModule, FormsModule] // Add FormsModule here
})
export class GroupComponent {
  currentUser: User | null = null;
  selectedUser: User | null = null;

  allGroups: Group[] = [
    { name: 'Group1', members: [] },
    { name: 'Group2', members: [] },
    { name: 'Group3', members: [] },
  ];

  users: User[] = [
    {
      username: 'superadmin',
      email: 'superadmin@example.com',
      id: 1,
      roles: ['Super Admin'],
      groups: ['Group1', 'Group2'],
      password: 'superadminpass'
    },
    {
      username: 'groupadmin',
      email: 'groupadmin@example.com',
      id: 2,
      roles: ['Group Admin'],
      groups: ['Group1'],
      password: 'groupadminpass'
    },
    {
      username: 'user1',
      email: 'user1@example.com',
      id: 3,
      roles: ['User'],
      groups: ['Group1'],
      password: 'user1pass'
    },
    {
      username: 'user2',
      email: 'user2@example.com',
      id: 4,
      roles: ['User'],
      groups: ['Group2'],
      password: 'user2pass'
    },
    {
      username: 'user3',
      email: 'user3@example.com',
      id: 5,
      roles: ['User'],
      groups: ['Group3'],
      password: 'user3pass'
    }
  ];

  constructor(private router: Router) {
    this.currentUser = this.users.find(user => user.username === 'superadmin') || null; // Simulate login as 'superadmin'
    this.populateGroups(); // Populate groups based on user info
  }

  populateGroups() {
    // Clear previous members
    this.allGroups.forEach(group => (group.members = []));

    // Populate group members based on predefined users
    this.users.forEach(user => {
      user.groups.forEach(groupName => {
        const group = this.allGroups.find(g => g.name === groupName);
        if (group) {
          group.members.push(user);
        }
      });
    });
  }

  get visibleGroups(): Group[] {
    if (!this.currentUser) return [];
    if (this.currentUser.roles.includes('Super Admin')) {
      return this.allGroups; // Super Admin can see all groups
    }
    // Regular users and group admins can only see their groups
    return this.allGroups.filter(group =>
      group.members.some(member => member.id === this.currentUser?.id)
    );
  }

  canManageUsers(group: Group): boolean {
    if (!this.currentUser) return false;
    // Super Admin can manage all groups, Group Admin can manage their own groups
    return (
      this.currentUser.roles.includes('Super Admin') ||
      (this.currentUser.roles.includes('Group Admin') && this.currentUser.groups.includes(group.name))
    );
  }

  leaveGroup(group: Group) {
    if (!this.currentUser) return;

    group.members = group.members.filter(member => member.id !== this.currentUser?.id);
    this.currentUser.groups = this.currentUser.groups.filter(g => g !== group.name);
  }

  addUserToGroup(group: Group, user: User | null) {
    if (this.canManageUsers(group) && user && !group.members.includes(user)) {
      group.members.push(user);
      user.groups.push(group.name);
    }
  }

  removeUserFromGroup(group: Group, user: User) {
    if (this.canManageUsers(group) && user) {
      group.members = group.members.filter(member => member.id !== user.id);
      user.groups = user.groups.filter(g => g !== group.name);
    }
  }

  createGroup(groupName: string) {
    if (this.currentUser && (this.currentUser.roles.includes('Group Admin') || this.currentUser.roles.includes('Super Admin'))) {
      const newGroup = { name: groupName, members: [] };
      this.allGroups.push(newGroup);
    }
  }
}
