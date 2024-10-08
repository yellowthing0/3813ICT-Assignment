import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  errorMessage: string = '';

  constructor(private formBuilder: FormBuilder, private router: Router, private http: HttpClient) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    const { username, password } = this.loginForm.value;

    // Send login request to server
    this.http.post('http://localhost:3000/api/login', { username, password }).subscribe(
      (response: any) => {
        // Store JWT token in local storage
        localStorage.setItem('token', response.token);
        this.router.navigate(['/groups']);
      },
      (error) => {
        this.errorMessage = 'Invalid username or password';
      }
    );
  }
}
