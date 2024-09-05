import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = 'http://localhost:5000';  // Use the correct backend URL

  constructor(private http: HttpClient) {}

  // Fetch all groups (admin access only)
  getAllGroups(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/groups`).pipe(
      catchError(error => {
        console.error('Error fetching all groups:', error);
        return throwError(() => new Error('Error fetching groups.'));
      })
    );
  }
}
