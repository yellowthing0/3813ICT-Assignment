import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // Import HttpClient
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';  // Import CommonModule for ngIf

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, CommonModule]  // No need for HttpClientModule in standalone component
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private http: HttpClient) {}  // Inject HttpClient
  login() {
    const loginPayload = { username: this.username, password: this.password };

    console.log('Sending login request with payload:', loginPayload);  // Log the payload

    // Use the backend's URL directly
    const backendUrl = 'http://localhost:5000/login';

    // Send the request to the backend
    this.http.post<{ success: boolean, user: any }>(backendUrl, loginPayload)
      .subscribe({
        next: (response) => {
          console.log('Login response:', response);

          if (response.success) {
            this.router.navigate(['/groups'], { state: { user: response.user } });
          } else {
            this.errorMessage = 'Invalid username or password';
          }
        },
        error: (err) => {
          console.error('Login request error:', err);
          this.errorMessage = 'Login failed. Please check your credentials or try again later.';
        }
      });
  }


}
