// Cette configuration est utilisée par `ng serve` et par
// `ng build --configuration development` via `fileReplacements`.

export const environment = {
  production: false,
  // Le front appelle directement le backend, comme en production.
  // Laravel doit autoriser http://localhost:4200 dans CORS_ALLOWED_ORIGINS.
  apiUrl: 'http://e-scolarite.local/api',
  publicUrl: 'http://e-scolarite.local',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
