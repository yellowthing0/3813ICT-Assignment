import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService, Group } from '../../services/group.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-groups',
  standalone: true,
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
  imports: [CommonModule]
})
export class GroupsComponent implements OnInit {
  groups: Group[] = [];

  constructor(private groupService: GroupService, private router: Router) {}

  ngOnInit(): void {
    this.groupService.getGroups().subscribe((groups) => {
      this.groups = groups;
    });
  }

  // Navigate to the channels of the selected group
  goToGroupChannels(groupId: number): void {
    this.router.navigate([`/groups/${groupId}/channels`]);
  }
}
