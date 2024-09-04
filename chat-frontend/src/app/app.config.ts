import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes'; // Ensure this points to your routes file
import { provideHttpClient, withFetch } from '@angular/common/http';  // Make sure this is imported

export const appConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withFetch()),
  ]
};
