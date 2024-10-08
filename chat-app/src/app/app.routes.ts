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
    loadComponent: () => import('./components/groups/groups.component').then(m => m.GroupsComponent),
    canActivate: [AuthGuard] // Protect the 'groups' route with the AuthGuard
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard] // Protect the 'profile' route with the AuthGuard
  }
];
