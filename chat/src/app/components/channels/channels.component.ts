import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChannelService, Channel } from '../../services/channel.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channels',
  standalone: true,
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.css'],
  imports: [CommonModule]
})
export class ChannelsComponent implements OnInit {
  groupId!: number;  // Non-null assertion operator to ensure the groupId will be assigned
  channels: Channel[] = [];

  constructor(private route: ActivatedRoute, private channelService: ChannelService, private router: Router) {}

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('groupId');
    this.groupId = groupId ? +groupId : 0;  // Handle possible null value

    // Fetch channels for this group
    this.channelService.getChannels(this.groupId).subscribe((channels) => {
      this.channels = channels;
    });
  }

  goToTextChannel(channelId: number): void {
    this.router.navigate([`/groups/${this.groupId}/channels/${channelId}/text`]);
  }

  goToVoiceChannel(channelId: number): void {
    this.router.navigate([`/groups/${this.groupId}/channels/${channelId}/voice`]);
  }
}
