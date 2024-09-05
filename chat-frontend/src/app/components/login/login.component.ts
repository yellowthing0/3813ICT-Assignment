import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private userService: UserService) {}

  // Handle login
  login() {
    console.log('Login attempt with:', this.username, this.password);

    if (this.username.trim() && this.password.trim()) {
      // Call the login API via UserService
      this.userService.login(this.username, this.password).subscribe({
        next: (response) => {
          console.log('Login successful:', response);

          // If login is successful, store the user data
          this.userService.setUser(response.user);

          // Navigate to the groups page
          this.router.navigate(['/group']);
        },
        error: (err) => {
          console.error('Login error:', err);
          this.errorMessage = 'Invalid username or password. Please try again.';
        },
      });
    } else {
      this.errorMessage = 'Both username and password are required.';
      console.log('Login failed: Missing username or password');
    }
  }
}
