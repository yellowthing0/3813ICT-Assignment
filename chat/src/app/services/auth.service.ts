import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: any;

  constructor() {}

  // Simple login logic - replace with real authentication later
  login(username: string, password: string): boolean {
    if (username === 'super' && password === '123') {
      this.currentUser = { username, role: 'Super Admin' };
      return true;
    }
    return false;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is logged in
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }
}
