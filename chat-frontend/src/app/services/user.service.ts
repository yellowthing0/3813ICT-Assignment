import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user: any = null;
  private apiUrl = 'http://localhost:5000';  // Correct backend URL

  constructor(private http: HttpClient) {}

  setUser(user: any) {
    this.user = user;
  }

  getUser() {
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

  clearUser() {
    this.user = null;
  }
}
