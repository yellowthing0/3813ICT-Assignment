import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Channel {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  // Example method to fetch channels for a group
  getChannels(groupId: number): Observable<Channel[]> {
    // Simulated data; replace this with actual HTTP call
    const channels: Channel[] = [
      { id: 1, name: 'text' },
      { id: 2, name: 'voice' }
    ];

    return of(channels); // Use 'of' to simulate observable for now
  }
}
