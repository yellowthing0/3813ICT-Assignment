import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core'; // Import correctly
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule

import { AppComponent } from './app/app.component'; // Import your main component
import { routes } from './app/app.routes'; // Import your routes

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Provide routes
    importProvidersFrom(HttpClientModule)  // Provide HttpClientModule
  ]
}).catch(err => console.error(err));
