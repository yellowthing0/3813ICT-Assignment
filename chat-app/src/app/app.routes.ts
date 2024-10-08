import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard'; // Import the AuthGuard

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'groups',
    loadComponent: () => import('./components/groups/groups.component').then(m => m.GroupsComponent)
  },
  {
    path: 'groups/:groupId/channels',
    loadComponent: () => import('./components/channels/channels.component').then(m => m.ChannelsComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  }
];
