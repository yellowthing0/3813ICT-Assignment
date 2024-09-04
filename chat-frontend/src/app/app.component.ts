import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router'; // Import Router and RouterOutlet
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { LoginComponent } from './components/login/login.component';
import { GroupComponent } from './components/group/group.component';
import { RouterModule, Routes } from '@angular/router';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // Only RouterOutlet should be here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'chat-frontend';

  constructor(private router: Router) {} // Inject Router for navigation

  // Function to log the navigation and navigate to the route
  logNavigation(page: string) {
    console.log(`${page} link clicked`);
    this.router.navigate([`/${page.toLowerCase()}`]); // Manually navigate to the route
  }
}
