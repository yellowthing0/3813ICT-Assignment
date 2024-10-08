import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [ReactiveFormsModule, CommonModule], // Import ReactiveFormsModule
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  profilePicturePreview: string | ArrayBuffer | null = null;
  currentProfilePicture: string = '';  // Stores the current profile picture URL

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.profileForm = this.fb.group({
      profilePicture: [null]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Fetch the current profile picture from the server on initialization
    this.getCurrentProfilePicture();
  }

  // Fetch the current profile picture from the backend
  getCurrentProfilePicture(): void {
    const username = 'your-username'; // Replace with actual username
    this.http.get(`http://localhost:3000/api/user/${username}/profilePicture`)
      .subscribe((response: any) => {
        this.currentProfilePicture = response.profilePictureUrl || 'assets/default-profile.png'; // Use default if none
      }, error => {
        console.error('Error fetching profile picture:', error);
        this.currentProfilePicture = 'assets/default-profile.png'; // Use default in case of error
      });
  }

  onProfilePictureSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePicturePreview = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    }

    this.profileForm.patchValue({
      profilePicture: file
    });
  }

  updateProfilePicture(): void {
    const formData = new FormData();
    formData.append('profilePicture', this.profileForm.get('profilePicture')?.value);

    this.http.post('http://localhost:3000/api/updateProfilePicture', formData).subscribe(
      (response: any) => {
        console.log('Profile picture updated:', response);
        this.getCurrentProfilePicture(); // Refresh the current profile picture after update
      },
      (error) => {
        console.error('Error updating profile picture:', error);
      }
    );
  }

  updatePassword(): void {
    const formData = {
      username: 'your-username', // Replace with actual username
      oldPassword: this.passwordForm.get('oldPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    this.http.post('http://localhost:3000/api/updatePassword', formData).subscribe(
      (response: any) => {
        console.log('Password updated:', response);
      },
      (error) => {
        console.error('Error updating password:', error);
      }
    );
  }
}
