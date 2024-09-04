import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ChatComponent } from './components/chat/chat.component';
import { GroupComponent } from './components/group/group.component';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent }, // Login page
  { path: 'chat', component: ChatComponent },   // Chat page
  { path: 'groups', component: GroupComponent }, // Group page
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default redirection to login
  { path: '**', redirectTo: '/login' } // Wildcard for unknown paths
];
