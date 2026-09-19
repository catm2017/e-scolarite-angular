import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Route, Router } from '@angular/router';
import { catchError, map, of, timeout } from 'rxjs';
import { CentralApiService } from './prototype/central-api.service';

const siteWebInstitutGuard: CanActivateFn = () => {
  const api = inject(CentralApiService);
  return api.souscriptionValidee()
    ? true
    : inject(Router).createUrlTree(['/institut'], { queryParams: { vue: 'souscription' } });
};

const espaceEtablissementGuard: CanActivateFn = () => {
  const api = inject(CentralApiService);
  const router = inject(Router);
  if (!api.souscriptionValidee()) {
    return router.createUrlTree(['/institut'], { queryParams: { vue: 'souscription' } });
  }

  const destinationSelonCampus = (campus: ReadonlyArray<{ statut: string }>) =>
    campus.some((item) => item.statut === 'actif')
      ? true
      : router.createUrlTree(['/institut'], { queryParams: { vue: 'campuses' } });

  // Après le premier chargement, les campus sont déjà maintenus par le service
  // central. Une réentrée dans primaire/collège/lycée ne doit donc plus être
  // suspendue à une nouvelle requête /institut/espace.
  if (api.espaceInstitutCharge()) {
    return destinationSelonCampus(api.campusInstitut());
  }

  return api.espaceInstitut().pipe(
    // Évite qu'une indisponibilité locale du backend immobilise indéfiniment
    // la navigation Angular lors du tout premier accès direct à un espace.
    timeout({ first: 8_000 }),
    map((espace) => destinationSelonCampus(espace.campus)),
    catchError((erreur: HttpErrorResponse) => of(
      erreur.status === 401 || erreur.status === 419
        ? router.createUrlTree(['/connexion'], { queryParams: { session: 'expiree' } })
        : router.createUrlTree(['/institut']),
    )),
  );
};

/**
 * Une seule configuration de route est conservée par espace métier.
 *
 * Le segment `:vue` change dans l'URL, mais Angular réutilise la même instance
 * du composant. Les signaux du workspace sélectionnent alors la rubrique sans
 * reconstruire le très gros composant ni relancer tous ses appels API.
 */
const PAGES_PRIMAIRE: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
  {
    path: ':vue',
    loadComponent: () => import('./prototype/primary-school/primary-school.component')
      .then((component) => component.PrimarySchoolComponent),
  },
];

const PAGES_COLLEGE: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
  {
    path: ':vue',
    loadComponent: () => import('./prototype/college-school/college-school.component')
      .then((component) => component.CollegeSchoolComponent),
  },
];

const PAGES_LYCEE: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
  {
    path: ':vue',
    loadComponent: () => import('./prototype/high-school/high-school.component')
      .then((component) => component.HighSchoolComponent),
  },
];

const PAGES_INSTITUT: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
  {
    path: ':vue',
    loadComponent: () => import('./prototype/institute-console/institute-console.component')
      .then((component) => component.InstituteConsoleComponent),
  },
];

export const APP_ROUTE: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./prototype/public-portal/public-portal.component').then(
        (component) => component.PublicPortalComponent,
      ),
  },
  {
    path: 'saas',
    loadComponent: () =>
      import('./prototype/layouts/saas-layout/saas-layout.component').then(
        (component) => component.SaasLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
      { path: ':vue', loadComponent: () => import('./prototype/saas-console/saas-console.component').then(c => c.SaasConsoleComponent) },
    ],
  },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./prototype/central-auth/central-auth.component').then(
        (component) => component.CentralAuthComponent,
      ),
  },
  {
    path: 'activation-compte',
    loadComponent: () =>
      import('./prototype/account-activation/account-activation.component').then(
        (component) => component.AccountActivationComponent,
      ),
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () => import('./prototype/forgot-password/forgot-password.component').then((component) => component.ForgotPasswordComponent),
  },
  {
    path: 'adhesion',
    loadComponent: () =>
      import('./prototype/adhesion/adhesion.component').then(
        (component) => component.AdhesionComponent,
      ),
  },
  {
    path: 'institut/site-web',
    canActivate: [siteWebInstitutGuard],
    loadComponent: () =>
      import('./prototype/site-editor/site-editor.component').then(
        (component) => component.SiteEditorComponent,
      ),
  },
  {
    path: 'institut',
    loadComponent: () =>
      import(
        './prototype/layouts/establishment-layout/establishment-layout.component'
      ).then((component) => component.EstablishmentLayoutComponent),
    // Le layout reste vivant pendant les allers-retours entre l'espace parent
    // et les espaces métier. Seul le contenu du router-outlet est remplacé.
    // Cela évite de recréer la sidebar, le navtop et le panneau de thème à
    // chaque navigation, source de lenteurs et de rendus instables.
    children: [
      {
        path: 'etablissements/primaire',
        data: { establishmentType: 'primary' },
        canActivate: [espaceEtablissementGuard],
        children: PAGES_PRIMAIRE,
      },
      {
        path: 'etablissements/college',
        data: { establishmentType: 'college' },
        canActivate: [espaceEtablissementGuard],
        children: PAGES_COLLEGE,
      },
      {
        path: 'etablissements/lycee',
        data: { establishmentType: 'lycee' },
        canActivate: [espaceEtablissementGuard],
        children: PAGES_LYCEE,
      },
      ...PAGES_INSTITUT,
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
