import { isDevMode } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'app/app.component';
import { appConfig } from 'app/app.config';
import { provideServiceWorker } from '@angular/service-worker';

bootstrapApplication(AppComponent, {...appConfig, providers: [...appConfig.providers, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })]}).catch((err) =>
  console.error(err)
);
