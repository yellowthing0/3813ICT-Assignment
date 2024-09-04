import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf

interface User {
  username: string;
  email: string;
  id: number;
  roles: string[];
  groups: string[];
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule] // Add CommonModule for ngIf
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

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

  constructor(private router: Router) {}

  login() {
    const foundUser = this.users.find(user => user.username === this.username && user.password === this.password);
    if (foundUser) {
      this.router.navigate(['/groups']);
    } else {
      this.errorMessage = 'Invalid username or password';
    }
  }
}
