// app.routes.ts or app-routing.module.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { GroupsComponent } from './components/groups/groups.component';
import { AuthGuardService } from './services/auth-guard.service';
import { ChannelsComponent } from './components/channels/channels.component';
import { TextChannelComponent } from './components/text-channel/text-channel.component';
import { VoiceChannelComponent } from './components/voice-channel/voice-channel.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirect root to login
  { path: 'login', component: LoginComponent },         // Login route
  { path: 'groups', component: GroupsComponent, canActivate: [AuthGuardService] }, // Groups route with guard
  { path: 'groups/:groupId/channels', component: ChannelsComponent }, // Channels route with dynamic group ID
  { path: 'groups/:groupId/channels/:channelId/text', component: TextChannelComponent }, // Text channel
  { path: 'groups/:groupId/channels/:channelId/voice', component: VoiceChannelComponent }, //Voice channel
];

// Make sure your router module is correctly imported
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
