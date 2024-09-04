import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule], // Import CommonModule for *ngFor
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
})
export class GroupComponent {
  groups = [
    { id: 1, name: 'Group 1' },
    { id: 2, name: 'Group 2' },
  ];

  constructor(private router: Router) {}

  selectGroup(group: any) {
    this.router.navigate(['/chat']);
  }
}
