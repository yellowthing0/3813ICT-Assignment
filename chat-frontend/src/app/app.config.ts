import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig = {
  providers: [provideRouter(appRoutes)] // Provide the routes to the application
};
