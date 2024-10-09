import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

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
  currentProfilePicture: string = ''; // Stores the current profile picture URL
  userId: string = ''; // Initialize userId (you may need to fetch this from JWT or user data)
  username: string = ''; // Add this property
  profilePictureUrl: string = 'http://localhost:4200/assets/default-profile.png'; // Add this property with a default value

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private socketService: SocketService,
    @Inject(PLATFORM_ID) private platformId: Object // Inject the platform ID
  ) {
    this.profileForm = this.fb.group({
      profilePicture: [null],
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Assume the username is stored in localStorage when the user logs in
    this.username = localStorage.getItem('username') || ''; // Set the username from localStorage
    this.loadCurrentProfilePicture();
  }


  // Load the current profile picture on init
  async loadCurrentProfilePicture() {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      try {
        const response: any = await this.http
          .get(
            `http://localhost:3000/api/user/${this.username}/profilePicture`,
            { headers }
          )
          .toPromise();
        this.profilePictureUrl =
          response.profilePictureUrl ||
          'http://localhost:4200/assets/default-profile.png';
      } catch (error) {
        console.error('Error loading profile picture:', error);
        this.profilePictureUrl =
          'http://localhost:4200/assets/default-profile.png'; // Fallback to default on error
      }
    } else {
      console.error('No token found');
      this.profilePictureUrl =
        'http://localhost:4200/assets/default-profile.png'; // Fallback if no token is found
    }
  }

  // Handle profile picture selection
  onProfilePictureSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicturePreview = reader.result;
      };
      reader.readAsDataURL(file);
      this.profileForm.patchValue({ profilePicture: file });
    }
  }

  updateProfilePicture(): void {
    const formData = new FormData();
    formData.append(
      'profilePicture',
      this.profileForm.get('profilePicture')?.value
    );

    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`, // Include the JWT token in the header
    });

    this.http
      .post('http://localhost:3000/api/updateProfilePicture', formData, {
        headers,
      })
      .subscribe(
        (response: any) => {
          console.log('Profile picture updated:', response);

          // Update the current profile picture with the new one
          this.currentProfilePicture = response.profilePictureUrl;

          // Emit the change to the chat system
          this.socketService.emitEvent('profilePictureUpdated', {
            userId: this.userId,
            profilePictureUrl: response.profilePictureUrl,
          });
        },
        (error) => {
          console.error('Error updating profile picture:', error);
        }
      );
  }

  // Decode JWT manually to get the userId
  getUserIdFromToken(): string {
    if (isPlatformBrowser(this.platformId)) {
      // Ensure this runs only in the browser
      const token = localStorage.getItem('token');
      if (token) {
        // JWT tokens have 3 parts separated by dots (header, payload, and signature).
        // We only need the payload part, which is the second part (index 1).
        const payload = token.split('.')[1];
        const decodedPayload = atob(payload); // Base64 decode
        const parsedPayload = JSON.parse(decodedPayload); // Convert JSON string to an object
        return parsedPayload.userId; // Extract and return the userId from the decoded payload
      }
    }
    return '';
  }

  // Update password logic
  updatePassword(): void {
    const oldPassword = this.passwordForm.get('oldPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;

    this.http
      .post('http://localhost:3000/api/updatePassword', {
        oldPassword,
        newPassword,
      })
      .subscribe(
        (response) => {
          console.log('Password updated successfully');
          this.passwordForm.reset(); // Reset the form after successful update
        },
        (error) => {
          console.error('Error updating password:', error);
        }
      );
  }
}
