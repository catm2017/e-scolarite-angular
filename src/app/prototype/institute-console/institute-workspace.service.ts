import { Injectable, inject, signal } from '@angular/core';
import { CentralApiService } from '../central-api.service';

export type InstituteView =
  | 'overview'
  | 'establishments'
  | 'campuses'
  | 'student-transfers'
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
  | 'subscription-invoices'
  | 'settings';

/**
 * Les libellés internes restent en anglais afin de ne pas casser le métier
 * existant, tandis que les URL restent lisibles et stables en français.
 */
const INSTITUTE_VIEW_PATHS: Record<InstituteView, string> = {
  overview: 'tableau-de-bord',
  establishments: 'etablissements',
  campuses: 'campus',
  'student-transfers': 'transferts-eleves',
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
  'subscription-invoices': 'factures',
  settings: 'parametres',
};

/** État partagé entre le contenu et la navigation de l’espace parent. */
@Injectable({ providedIn: 'root' })
export class InstituteWorkspaceService {
  private readonly api = inject(CentralApiService);
  readonly activeView = signal<InstituteView>('overview');
  readonly subscriptionValidated = signal(this.api.souscriptionValidee());
  readonly activeFeatures = signal<string[]>(this.api.fonctionnalitesActives());

  constructor() {
    // Les droits du compte sont chargés une seule fois pour alimenter la
    // navigation du back-office parent et des espaces d’établissement.
    this.api.chargerAccesUtilisateurInstitut();
  }

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
    if (!view || view === 'overview' || view === 'establishments') return true;
    // L’administrateur de l’institut dispose de tous les accès, y compris
    // lorsque la souscription n’est pas encore configurée.
    if (this.isAdministrateur()) return true;
    const fonctionnalite = this.fonctionnalitePourVue(view);
    if (!fonctionnalite) return this.subscriptionValidated();
    const autorise = this.api.permissionUtilisateurAutorisee(fonctionnalite, 'institut');
    if (view === 'campuses') return autorise;
    // La souscription et les factures restent consultables pour permettre au
    // compte autorisé de régulariser ou renouveler son accès.
    if (view === 'subscription' || view === 'subscription-invoices') return autorise;
    const abonnementValide = this.subscriptionValidated() || this.api.souscriptionValidee();
    return abonnementValide && this.hasFeature(fonctionnalite) && autorise;
  }

  canAccessPath(path?: string): boolean {
    if (!path) return this.subscriptionValidated();
    return this.subscriptionValidated();
  }

  hasFeature(code: string): boolean {
    const fonctionnalites = this.activeFeatures().length ? this.activeFeatures() : this.api.fonctionnalitesActives();
    return (this.subscriptionValidated() || this.api.souscriptionValidee()) && fonctionnalites.includes(code);
  }

  isAdministrateur(): boolean {
    return this.api.accesUtilisateur()?.administrateur === true;
  }

  /** Fonctionnalité commerciale requise par les rubriques du back-office partagé. */
  fonctionnalitePourVue(view?: string): string | null {
    return ({
      'student-transfers': 'gestion_transferts_eleves',
      users: 'gestion_utilisateurs_acces_institut',
      'user-detail': 'gestion_utilisateurs_acces_institut',
      roles: 'gestion_roles_permissions_institut',
      'role-detail': 'gestion_roles_permissions_institut',
      staff: 'gestion_personnels_institut',
      'staff-detail': 'gestion_personnels_institut',
      teachers: 'gestion_enseignants_institut',
      'teacher-detail': 'gestion_enseignants_institut',
      spaces: 'gestion_salles_espaces_institut',
      'activity-log': 'tracabilite_activites_institut',
      campuses: 'gestion_campus_institut',
      subscription: 'gestion_souscriptions_institut',
      'subscription-invoices': 'gestion_factures_institut',
      settings: 'gestion_parametres_institut',
    } as Record<string, string>)[view ?? ''] ?? null;
  }
}
