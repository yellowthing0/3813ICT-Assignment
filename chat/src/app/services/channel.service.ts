import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Channel {
  id: number;
  name: string;
  description: string;
  groupId: number;
  type: 'text' | 'voice'; // Type of channel: text or voice
}

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  // Mock channel data with text and voice channels
  private channels: Channel[] = [
    { id: 1, name: 'General Text', description: 'Text chat for Group 1', groupId: 1, type: 'text' },
    { id: 2, name: 'Voice Channel 1', description: 'Voice chat for Group 1', groupId: 1, type: 'voice' },
    { id: 3, name: 'Random Text', description: 'Random text chat', groupId: 1, type: 'text' },
    { id: 4, name: 'General Voice', description: 'Voice chat for Group 2', groupId: 2, type: 'voice' },
    { id: 5, name: 'Announcements', description: 'Text chat for announcements', groupId: 2, type: 'text' },
  ];

  constructor() {}

  // Fetch channels for a specific group
  getChannels(groupId: number): Observable<Channel[]> {
    const groupChannels = this.channels.filter(channel => channel.groupId === groupId);
    return of(groupChannels);
  }
}
