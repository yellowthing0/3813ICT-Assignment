import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-groups',
  standalone: true,
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
  imports: [CommonModule]
})
export class GroupsComponent {
  groups = [
    { id: 1, name: 'Group 1' },
    { id: 2, name: 'Group 2' }
  ];

  constructor(private router: Router) {}

  onGroupSelect(groupId: number): void {
    this.router.navigate([`/groups/${groupId}/channels`]);
  }
}
