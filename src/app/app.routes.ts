import { Route } from '@angular/router';

export const APP_ROUTE: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./prototype/landing/landing.component').then(
        (component) => component.LandingComponent,
      ),
  },
  {
    path: 'saas',
    loadComponent: () =>
      import('./prototype/saas-console/saas-console.component').then(
        (component) => component.SaasConsoleComponent,
      ),
  },
  {
    path: 'institut/site-web',
    loadComponent: () =>
      import('./prototype/site-editor/site-editor.component').then(
        (component) => component.SiteEditorComponent,
      ),
  },
  {
    path: 'institut/etablissements/primaire',
    loadComponent: () =>
      import(
        './prototype/layouts/establishment-layout/establishment-layout.component'
      ).then((component) => component.EstablishmentLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./prototype/primary-school/primary-school.component').then(
            (component) => component.PrimarySchoolComponent,
          ),
      },
    ],
  },
  {
    path: 'institut/etablissements/college',
    loadComponent: () =>
      import(
        './prototype/layouts/establishment-layout/establishment-layout.component'
      ).then((component) => component.EstablishmentLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./prototype/college-school/college-school.component').then(
            (component) => component.CollegeSchoolComponent,
          ),
      },
    ],
  },
  {
    path: 'institut/etablissements/lycee',
    loadComponent: () =>
      import(
        './prototype/layouts/establishment-layout/establishment-layout.component'
      ).then((component) => component.EstablishmentLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./prototype/high-school/high-school.component').then(
            (component) => component.HighSchoolComponent,
          ),
      },
    ],
  },
  {
    path: 'institut',
    loadComponent: () =>
      import(
        './prototype/layouts/establishment-layout/establishment-layout.component'
      ).then((component) => component.EstablishmentLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./prototype/institute-console/institute-console.component').then(
            (component) => component.InstituteConsoleComponent,
          ),
      },
    ],
  },
  {
    path: 'demo/joyau-du-savoir/connexion',
    loadComponent: () =>
      import('./prototype/site-access/site-access.component').then(
        (component) => component.SiteAccessComponent,
      ),
  },
  {
    path: 'demo/joyau-du-savoir',
    loadComponent: () =>
      import('./prototype/school-site/school-site.component').then(
        (component) => component.SchoolSiteComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
