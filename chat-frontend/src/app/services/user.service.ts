import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface User {
  username: string;
  roles: string[];
  groups: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user: User | null = null;
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  setUser(user: User) {
    if (user && Array.isArray(user.roles)) {
      this.user = user;
    } else {
      console.error('Invalid user roles format');
    }
  }

  getUser(): User | null {
    return this.user;
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      catchError(error => {
        console.error('Error logging in:', error);
        return throwError(() => new Error('Error logging in.'));
      })
    );
  }

  changeUserRole(username: string, action: 'promote' | 'demote'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/${username}/role`, { action, currentUser: this.user?.username }).pipe(
      catchError(error => {
        console.error('Error changing user role:', error);
        return throwError(() => new Error('Error changing user role.'));
      })
    );
  }

  createUser(newUser: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, { newUser, currentUser: this.user?.username }).pipe(
      catchError(error => {
        console.error('Error creating user:', error);
        return throwError(() => new Error('Error creating user.'));
      })
    );
  }

  deleteUser(username: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${username}`, { body: { currentUser: this.user?.username } }).pipe(
      catchError(error => {
        console.error('Error deleting user:', error);
        return throwError(() => new Error('Error deleting user.'));
      })
    );
  }

  clearUser() {
    this.user = null;
  }
}
