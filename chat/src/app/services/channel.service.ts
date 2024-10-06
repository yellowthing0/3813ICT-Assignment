import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Channel {
  id: number;
  name: string;
  description: string;
  groupId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  // Mock channel data for different groups
  private channels: Channel[] = [
    { id: 1, name: 'General', description: 'General discussion', groupId: 1 },
    { id: 2, name: 'Random', description: 'Random chat', groupId: 1 },
    { id: 3, name: 'Announcements', description: 'Important announcements', groupId: 2 },
    { id: 4, name: 'General', description: 'General group discussion', groupId: 3 }
  ];

  constructor() {}

  // Fetch channels for a specific group
  getChannels(groupId: number): Observable<Channel[]> {
    const groupChannels = this.channels.filter(channel => channel.groupId === groupId);
    return of(groupChannels);
  }
}
