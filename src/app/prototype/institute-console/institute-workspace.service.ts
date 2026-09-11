import { Injectable, inject, signal } from '@angular/core';
import { CentralApiService } from '../central-api.service';

export type InstituteView =
  | 'overview'
  | 'establishments'
  | 'campuses'
  | 'users'
  | 'user-detail'
  | 'staff'
  | 'staff-detail'
  | 'teachers'
  | 'teacher-detail'
  | 'spaces'
  | 'activity-log'
  | 'roles'
  | 'role-detail'
  | 'assets'
  | 'subscription'
  | 'settings';

/**
 * Les libellés internes restent en anglais afin de ne pas casser le métier
 * existant, tandis que les URL restent lisibles et stables en français.
 */
const INSTITUTE_VIEW_PATHS: Record<InstituteView, string> = {
  overview: 'tableau-de-bord',
  establishments: 'etablissements',
  campuses: 'campus',
  users: 'utilisateurs',
  'user-detail': 'utilisateurs',
  staff: 'personnel',
  'staff-detail': 'personnel',
  teachers: 'enseignants',
  'teacher-detail': 'enseignants',
  spaces: 'salles-espaces',
  'activity-log': 'tracabilite',
  roles: 'roles-permissions',
  'role-detail': 'roles-permissions',
  assets: 'etablissements',
  subscription: 'souscription',
  settings: 'parametres',
};

/** État partagé entre le contenu et la navigation de l’espace parent. */
@Injectable({ providedIn: 'root' })
export class InstituteWorkspaceService {
  private readonly api = inject(CentralApiService);
  readonly activeView = signal<InstituteView>('overview');
  readonly subscriptionValidated = signal(this.api.souscriptionValidee());
  readonly activeFeatures = signal<string[]>(this.api.fonctionnalitesActives());

  selectView(view: InstituteView): void {
    if (!this.canAccessView(view)) return;
    this.activeView.set(view);
  }

  /** Reflète l'URL dans le contenu affiché par le shell de l'institut. */
  synchronizeFromUrl(url: string): InstituteView {
    const path = url.split('?')[0].split('#')[0];
    const segment = path.replace(/^\/institut\/?/, '').split('/')[0];
    const view = (Object.entries(INSTITUTE_VIEW_PATHS)
      .find(([, value]) => value === segment)?.[0] ?? 'overview') as InstituteView;
    this.selectView(view);
    return view;
  }

  cheminVue(view: InstituteView): string {
    return `/institut/${INSTITUTE_VIEW_PATHS[view]}`;
  }

  configureSubscriptionAccess(validated: boolean, features: string[]): void {
    this.subscriptionValidated.set(validated);
    this.activeFeatures.set(features);
    this.api.actualiserAccesSouscription(validated, features);
  }

  canAccessView(view?: string): boolean {
    if (!view || view === 'subscription') return true;
    return this.subscriptionValidated();
  }

  canAccessPath(path?: string): boolean {
    if (!path) return this.subscriptionValidated();
    return this.subscriptionValidated();
  }

  hasFeature(_code: string): boolean {
    // Accès temporairement ouvert après validation, le temps de finaliser le catalogue métier.
    return this.subscriptionValidated();
  }
}
