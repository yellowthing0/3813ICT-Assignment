// app/services/auth.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: any;

  login(username: string, password: string) {
    // Mock user login - replace this with real authentication
    if (username === 'super' && password === '123') {
      this.currentUser = { role: 'Super Admin' };
    } else {
      // Logic for other roles (Group Admin, User)
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }
}
