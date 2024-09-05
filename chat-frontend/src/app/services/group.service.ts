import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';  // Import `catchError` and `pipe`

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private apiUrl = 'http://localhost:5000/api';  // Ensure this matches your backend URL

  constructor(private http: HttpClient) {}

  // Fetch all groups (for Admins)
  getAllGroups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/groups`).pipe(
      catchError(error => {
        console.error('Error fetching all groups', error);
        return throwError(() => new Error('Error fetching all groups.'));
      })
    );
  }

  // Fetch users in a specific group
  getUsersInGroup(group: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/groups/${group}/users`).pipe(
      catchError(error => {
        console.error('Error fetching users for group', error);
        return throwError(() => new Error('Error fetching users for group.'));
      })
    );
  }

  // Create a new group
  createGroup(groupName: string, username: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups`, { groupName, username }).pipe(
      catchError(error => {
        console.error('Error creating group', error);
        return throwError(() => new Error('Error creating group.'));
      })
    );
  }

  // Delete a group
  deleteGroup(groupName: string, username: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/groups/${groupName}?username=${username}`).pipe(
      catchError(error => {
        console.error('Error deleting group', error);
        return throwError(() => new Error('Error deleting group.'));
      })
    );
  }

  // Invite a user to a group
  inviteUserToGroup(groupName: string, invitedUsername: string, invitingUsername: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/${groupName}/invite`, { invitedUsername, invitingUsername }).pipe(
      catchError(error => {
        console.error('Error inviting user to group', error);
        return throwError(() => new Error('Error inviting user to group.'));
      })
    );
  }

  // Remove a user from a group
  removeUserFromGroup(groupName: string, removedUsername: string, removingUsername: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/${groupName}/remove`, { removedUsername, removingUsername }).pipe(
      catchError(error => {
        console.error('Error removing user from group', error);
        return throwError(() => new Error('Error removing user from group.'));
      })
    );
  }
}
