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
    if (this.username.trim() && this.password.trim()) {
      this.userService.login(this.username, this.password).subscribe({
        next: (response) => {
          if (response.user && response.user.roles) {
            this.userService.setUser(response.user);
            this.router.navigate(['/group']);
          } else {
            this.errorMessage = 'Invalid response format.';
          }
        },
        error: (err) => {
          this.errorMessage = 'Invalid username or password.';
        }
      });
    } else {
      this.errorMessage = 'Both username and password are required.';
    }
  }
}
