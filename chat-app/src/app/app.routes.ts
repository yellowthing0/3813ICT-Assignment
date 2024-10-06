import { Routes } from '@angular/router';

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
    path: 'groups/:groupId/channels', // Route for channels inside a group
    loadComponent: () => import('./components/channels/channels.component').then(m => m.ChannelsComponent)
  }
];
