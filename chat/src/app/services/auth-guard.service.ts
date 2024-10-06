// app/services/auth-guard.service.ts
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(private authService: AuthService) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    return user && user.role === 'Super Admin';
  }
}
