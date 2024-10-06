import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Group {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  // Mock group data - this should come from an API
  private groups: Group[] = [
    { id: 1, name: 'Group 1', description: 'This is Group 1' },
    { id: 2, name: 'Group 2', description: 'This is Group 2' },
    { id: 3, name: 'Group 3', description: 'This is Group 3' },
  ];

  constructor() {}

  // Method to fetch groups (mocked here with an Observable)
  getGroups(): Observable<Group[]> {
    return of(this.groups);
  }
}
