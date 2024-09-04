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
  imports: [CommonModule, FormsModule]
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
    // Simulate login
    this.currentUser = this.users.find(user => user.username === 'user1') || null;
    this.populateGroups();
  }

  populateGroups() {
    this.allGroups.forEach(group => (group.members = []));
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
      return this.allGroups; // Super Admin sees all groups
    }
    return this.allGroups.filter(group =>
      group.members.some(member => member.id === this.currentUser?.id)
    );
  }

  // Check if the current user can manage users in this group (Admins only)
  canManageUsers(group: Group): boolean {
    if (!this.currentUser) return false;
    return (
      this.currentUser.roles.includes('Super Admin') ||
      (this.currentUser.roles.includes('Group Admin') && this.currentUser.groups.includes(group.name))
    );
  }

  // Check if the current user is a regular user
  isRegularUser(): boolean {
    return this.currentUser?.roles.includes('User') || false;
  }

  // Leave group functionality for regular users
  leaveGroup(group: Group) {
    if (!this.currentUser || !this.isRegularUser()) return; // Only users can leave groups

    group.members = group.members.filter(member => member.id !== this.currentUser?.id);
    this.currentUser.groups = this.currentUser.groups.filter(g => g !== group.name);
  }

  // Admins can add users to their groups
  addUserToGroup(group: Group, user: User | null) {
    if (this.canManageUsers(group) && user && !group.members.includes(user)) {
      group.members.push(user);
      user.groups.push(group.name);
    }
  }

  // Admins can remove users from their groups
  removeUserFromGroup(group: Group, user: User) {
    if (this.canManageUsers(group) && user) {
      group.members = group.members.filter(member => member.id !== user.id);
      user.groups = user.groups.filter(g => g !== group.name);
    }
  }

  // Admins can create groups
  createGroup(groupName: string) {
    if (this.currentUser && (this.currentUser.roles.includes('Group Admin') || this.currentUser.roles.includes('Super Admin'))) {
      const newGroup = { name: groupName, members: [] };
      this.allGroups.push(newGroup);
    }
  }
}
