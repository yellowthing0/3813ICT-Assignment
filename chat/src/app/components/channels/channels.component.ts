import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  channels: Channel[] = [];
  groupId: number;

  constructor(private route: ActivatedRoute, private channelService: ChannelService) {}

  ngOnInit(): void {
    // Get the groupId from the route params
    this.groupId = +this.route.snapshot.paramMap.get('groupId');

    // Fetch channels for this group
    this.channelService.getChannels(this.groupId).subscribe((channels) => {
      this.channels = channels;
    });
  }
}
