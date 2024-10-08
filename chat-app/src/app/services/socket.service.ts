import { Injectable, ApplicationRef } from '@angular/core';
import { Observable, first } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor(private http: HttpClient, private appRef: ApplicationRef) {
    // Initialize the socket but don't connect automatically
    this.socket = io('http://localhost:3000', { autoConnect: false });

    // Wait for the app to be stable (finished booting) before connecting the socket
    this.appRef.isStable
      .pipe(first((isStable) => isStable))
      .subscribe(() => {
        console.log('Angular app is stable, connecting to the socket...');
        this.socket.connect(); // Connect to the WebSocket server
      });
  }

  // Emit an event to the server
  emitEvent(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  // Listen for an event from the server
  listenEvent(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
    });
  }

  // Disconnect from the socket
  disconnect() {
    this.socket.disconnect();
  }

  // Upload image to the server with Authorization token
  uploadImage(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token'); // Retrieve the JWT token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Add Authorization header with the token
    });

    return this.http.post('http://localhost:3000/api/upload', formData, { headers });
  }
}
