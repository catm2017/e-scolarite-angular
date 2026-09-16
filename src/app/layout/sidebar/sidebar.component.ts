import {
  Router,
  NavigationEnd,
  RouterLinkActive,
  RouterLink,
} from '@angular/router';
import { NgClass } from '@angular/common';
import { Component, ElementRef, OnInit, Renderer2, HostListener, DOCUMENT, inject, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { AuthService, Role } from '@core';
import { RouteInfo } from './sidebar.metadata';
import { TranslateModule } from '@ngx-translate/core';
import { NgScrollbar } from 'ngx-scrollbar';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { SidebarService } from './sidebar.service';
import { NgxPermissionsModule } from 'ngx-permissions';
import {
  PrimaryView,
  PrimaryWorkspaceService,
} from '../../prototype/primary-school/primary-workspace.service';
import {
  InstituteView,
  InstituteWorkspaceService,
} from '../../prototype/institute-console/institute-workspace.service';
import { CentralApiService } from '../../prototype/central-api.service';

const PRIMARY_ROUTES: RouteInfo[] = [
  { path: '', title: 'SCOLARITÉ', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Tableau de bord', iconType: 'material-icons-outlined', icon: 'space_dashboard', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'dashboard' },
  { path: '', title: 'Dossiers élèves', iconType: 'material-icons-outlined', icon: 'folder_shared', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'registrations' },
  { path: '', title: 'Inscriptions, réinscriptions & transferts', iconType: 'material-icons-outlined', icon: 'how_to_reg', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'enrollments' },
  { path: '', title: 'Élèves', iconType: 'material-icons-outlined', icon: 'groups', class: '', groupTitle: false, badge: '', badgeClass: 'badge bg-blue sidebar-badge', role: [], submenu: [], workspaceView: 'students' },
  { path: '', title: 'Tuteurs', iconType: 'material-icons-outlined', icon: 'family_restroom', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'guardians' },
  { path: '', title: 'Classes', iconType: 'material-icons-outlined', icon: 'class', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'classes' },
  { path: '', title: 'Séries', iconType: 'material-icons-outlined', icon: 'account_tree', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'series' },
  { path: '', title: 'ADMINISTRATION', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Personnel', iconType: 'material-icons-outlined', icon: 'badge', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'staff' },
  { path: '', title: 'Absences du personnel', iconType: 'material-icons-outlined', icon: 'event_busy', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'staff-attendance' },
  { path: '', title: 'PÉDAGOGIE', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Matières', iconType: 'material-icons-outlined', icon: 'menu_book', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'subjects' },
  { path: '', title: 'Matières par classe', iconType: 'material-icons-outlined', icon: 'account_tree', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'class-subjects' },
  { path: '', title: 'Programmes & leçons', iconType: 'material-icons-outlined', icon: 'auto_stories', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'curriculum' },
  { path: '', title: 'Enseignants', iconType: 'material-icons-outlined', icon: 'co_present', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'teachers' },
  { path: '', title: 'Configurer l’emploi du temps', iconType: 'material-icons-outlined', icon: 'edit_calendar', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'timetable-builder' },
  { path: '', title: 'Emploi du temps', iconType: 'material-icons-outlined', icon: 'calendar_month', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'timetable' },
  { path: '', title: 'Séances', iconType: 'material-icons-outlined', icon: 'fact_check', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'attendance' },
  { path: '', title: 'Évaluations', iconType: 'material-icons-outlined', icon: 'edit_note', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'assessments' },
  { path: '', title: 'Notes et bulletins', iconType: 'material-icons-outlined', icon: 'description', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'reports' },
  { path: '', title: 'FINANCES', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Tarification scolaire', iconType: 'material-icons-outlined', icon: 'sell', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'fees' },
  { path: '', title: 'Encaissements', iconType: 'material-icons-outlined', icon: 'point_of_sale', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'payments' },
  { path: '', title: 'Paramétrage des dépenses', iconType: 'material-icons-outlined', icon: 'tune', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'expense-settings' },
  { path: '', title: 'Dépenses', iconType: 'material-icons-outlined', icon: 'north_east', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'expenses' },
  { path: '', title: 'Finances', iconType: 'material-icons-outlined', icon: 'account_balance_wallet', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'finance' },
  { path: '', title: 'CONFIGURATION', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Paramètres', iconType: 'material-icons-outlined', icon: 'settings', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'settings' },
];

const INSTITUTE_ROUTES: RouteInfo[] = [
  { path: '', title: 'PILOTAGE', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Vue d’ensemble', iconType: 'material-icons-outlined', icon: 'space_dashboard', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'overview' },
  { path: '', title: 'Établissements', iconType: 'material-icons-outlined', icon: 'account_balance', class: '', groupTitle: false, badge: '', badgeClass: 'badge bg-blue sidebar-badge', role: [], submenu: [], workspaceView: 'establishments' },
  { path: '', title: 'Campus', iconType: 'material-icons-outlined', icon: 'location_city', class: '', groupTitle: false, badge: '', badgeClass: 'badge bg-blue sidebar-badge', role: [], submenu: [], workspaceView: 'campuses' },
  { path: '', title: 'Transferts d’élèves', iconType: 'material-icons-outlined', icon: 'swap_horiz', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'student-transfers' },
  { path: '', title: 'Utilisateurs & accès', iconType: 'material-icons-outlined', icon: 'manage_accounts', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'users' },
  { path: '', title: 'Rôles & permissions', iconType: 'material-icons-outlined', icon: 'admin_panel_settings', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'roles' },
  { path: '', title: 'ÉQUIPE & RESSOURCES', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Personnel institut', iconType: 'material-icons-outlined', icon: 'badge', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'staff' },
  { path: '', title: 'Enseignants', iconType: 'material-icons-outlined', icon: 'co_present', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'teachers' },
  { path: '', title: 'Salles & espaces', iconType: 'material-icons-outlined', icon: 'meeting_room', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'spaces' },
  { path: '', title: 'Traçabilité', iconType: 'material-icons-outlined', icon: 'manage_history', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'activity-log' },
  { path: '', title: 'INSTITUT', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '/institut/site-web', title: 'Site web', iconType: 'material-icons-outlined', icon: 'language', class: '', groupTitle: false, badge: 'Nouveau', badgeClass: 'badge bg-blue sidebar-badge', role: [], submenu: [] },
  { path: '', title: 'Souscription', iconType: 'material-icons-outlined', icon: 'tune', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'subscription' },
  { path: '', title: 'Factures', iconType: 'material-icons-outlined', icon: 'receipt_long', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'subscription-invoices' },
  { path: '', title: 'Paramètres', iconType: 'material-icons-outlined', icon: 'settings', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'settings' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    NgScrollbar,
    RouterLinkActive,
    RouterLink,
    NgClass,
    TranslateModule,
    NgxPermissionsModule,
  ],
})
export class SidebarComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit
{
  private document = inject<Document>(DOCUMENT);
  private renderer = inject(Renderer2);
  elementRef = inject(ElementRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  readonly primaryWorkspace = inject(PrimaryWorkspaceService);
  readonly instituteWorkspace = inject(InstituteWorkspaceService);
  private readonly centralApi = inject(CentralApiService);
  private cdr = inject(ChangeDetectorRef);
  private readonly campusBadgeEffect = effect(() => {
    this.centralApi.campusInstitut();
    this.centralApi.etablissementsInstitut();
    this.centralApi.accesUtilisateur();
    if (this.isInstituteWorkspace) {
      this.configureWorkspaceNavigation();
      this.cdr.markForCheck();
    }
  });

  public sidebarItems!: RouteInfo[];
  public innerHeight?: number;
  public bodyTag!: HTMLElement;
  listMaxHeight?: string;
  listMaxWidth?: string;
  userFullName?: string;
  userImg?: string;
  userType?: string;
  headerHeight = 60;
  currentRoute?: string;
  isPrimaryWorkspace = false;
  isInstituteWorkspace = false;
  isSaasWorkspace = false;
  readonly saasNavigation = [
    { path: '/saas/tableau-de-bord', title: 'Vue d’ensemble', icon: 'space_dashboard' },
    { path: '/saas/etablissements', title: 'Établissements', icon: 'apartment' },
    { path: '/saas/adhesions', title: 'Adhésions', icon: 'how_to_reg' },
    { path: '/saas/activations-comptes', title: 'Activations de comptes', icon: 'verified_user' },
    { path: '/saas/tarification', title: 'Tarification et packages', icon: 'sell' },
    { path: '/saas/factures-souscriptions', title: 'Factures de souscription', icon: 'receipt_long' },
    { path: '/saas/abonnements', title: 'Abonnements', icon: 'subscriptions' },
    { path: '/saas/annees-scolaires', title: 'Années scolaires', icon: 'calendar_month' },
  ];
  constructor() {
    super();
    this.elementRef.nativeElement.closest('body');
    this.subs.sink = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.mettreAJourContexteNavigation(event.urlAfterRedirects);
        if (this.isInstituteWorkspace) {
          this.instituteWorkspace.synchronizeFromUrl(event.urlAfterRedirects);
        }
        if (this.isPrimaryWorkspace || this.isInstituteWorkspace || this.isSaasWorkspace) {
          this.configureWorkspaceNavigation();
          this.actualiserProfilEspace();
        }
        // close sidebar on mobile screen after menu select
        this.renderer.removeClass(this.document.body, 'overlay-open');
      }
        this.cdr.markForCheck();
    });
  }
  @HostListener('window:resize', ['$event'])
  windowResizecall(_event?: Event) {
    this.setMenuHeight();
    this.checkStatuForResize(false);
  }
  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.renderer.removeClass(this.document.body, 'overlay-open');
    }
  }
  callToggleMenu(event: Event, length: number) {
    if (length > 0) {
      const parentElement = (event.target as HTMLInputElement).closest('li');
      const activeClass = parentElement?.classList.contains('active');

      if (activeClass) {
        this.renderer.removeClass(parentElement, 'active');
      } else {
        this.renderer.addClass(parentElement, 'active');
      }
    }
  }
  ngOnInit() {
    this.mettreAJourContexteNavigation(this.router.url);
    if (this.isInstituteWorkspace) {
      this.instituteWorkspace.synchronizeFromUrl(this.router.url);
    }

    if (this.isPrimaryWorkspace || this.isInstituteWorkspace || this.isSaasWorkspace) {
      this.configureWorkspaceNavigation();
      this.actualiserProfilEspace();
      this.userImg = './assets/images/user/admin.jpg';
      this.initLeftSidebar();
      this.bodyTag = this.document.body;
      return;
    }

    if (this.authService.currentUser()) {
      const userRole = this.authService.currentUser().roles?.[0]?.name;
      this.userFullName = this.authService.currentUser().name;
      this.userImg =
        './assets/images/user/' + this.authService.currentUser().avatar;

      this.subs.sink = this.sidebarService
        .getRouteInfo()
        .subscribe((routes: RouteInfo[]) => {
          this.sidebarItems = routes;
          this.cdr.markForCheck();
        });
      if (userRole === Role.Admin) {
        this.userType = this.capitalizeString(Role.Admin);
      } else if (userRole === Role.Teacher) {
        this.userType = this.capitalizeString(Role.Teacher);
      } else if (userRole === Role.Student) {
        this.userType = this.capitalizeString(Role.Student);
      } else if (userRole === Role.Parent) {
        this.userType = this.capitalizeString(Role.Parent);
      } else {
        this.userType = this.capitalizeString(Role.Admin);
      }
    }

    this.initLeftSidebar();
    this.bodyTag = this.document.body;
  }

  private actualiserProfilEspace(): void {
    const user = this.centralApi.utilisateur();
    this.userFullName = user ? `${user.prenom} ${user.nom}`.trim() : 'Utilisateur connecté';
    this.userType = this.isSaasWorkspace ? 'Administration E-Scolarité' : this.isInstituteWorkspace ? 'Administrateur institut' : 'Utilisateur établissement';
    this.userImg = './assets/images/user/admin.jpg';
  }

  selectPrimaryView(view?: string): void {
    if (view) {
      const requestedView = view as PrimaryView;
      const destination = this.primaryWorkspace.canAccessView(requestedView) ? requestedView : 'settings';
      void this.router.navigateByUrl(this.primaryWorkspace.cheminVue(destination));
    }
  }

  isPrimaryItemAccessible(item: RouteInfo): boolean {
    if (item.groupTitle || !item.workspaceView) return true;
    return this.primaryWorkspace.canAccessView(item.workspaceView as PrimaryView);
  }

  selectInstituteView(view?: string): void {
    if (view && this.instituteWorkspace.canAccessView(view)) {
      void this.router.navigateByUrl(this.instituteWorkspace.cheminVue(view as InstituteView));
    }
  }

  isInstituteItemAccessible(item: RouteInfo): boolean {
    if (item.groupTitle) return true;
    if (item.title === 'Site web') {
      return this.instituteWorkspace.hasFeature('gestion_site_web')
        && this.centralApi.permissionUtilisateurAutorisee('gestion_site_web', 'institut');
    }
    if (item.workspaceView) return this.instituteWorkspace.canAccessView(item.workspaceView);
    return this.instituteWorkspace.canAccessPath(item.path);
  }

  isInstituteViewActive(view?: string): boolean {
    const activeView = this.instituteWorkspace.activeView();
    return activeView === view ||
      (view === 'users' && activeView === 'user-detail') ||
      (view === 'roles' && activeView === 'role-detail') ||
      (view === 'staff' && activeView === 'staff-detail') ||
      (view === 'teachers' && activeView === 'teacher-detail');
  }

  isPrimaryViewActive(view?: string): boolean {
    const activeView = this.primaryWorkspace.activeView();
    return activeView === view ||
      (view === 'students' && activeView === 'student-detail') ||
      (view === 'guardians' && activeView === 'guardian-detail') ||
      (view === 'teachers' && activeView === 'teacher-detail') ||
      (view === 'staff' && activeView === 'staff-detail');
  }

  isWorkspaceItemVisible(view?: string): boolean {
    return view !== 'series' || this.primaryWorkspace.establishmentType() === 'lycee';
  }

  private configureWorkspaceNavigation(): void {
    this.sidebarItems = this.isPrimaryWorkspace
      ? PRIMARY_ROUTES
      : INSTITUTE_ROUTES.map((item) => {
        if (item.title === 'Campus') {
          const total = this.centralApi.campusInstitut().length;
          return { ...item, badge: total ? String(total) : '' };
        }
        if (item.title === 'Établissements') {
          const total = this.centralApi.etablissementsInstitut().filter((etablissement) => etablissement.active).length;
          return { ...item, badge: total ? String(total) : '' };
        }
        return item;
      });
  }

  private mettreAJourContexteNavigation(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.isSaasWorkspace = path === '/saas' || path.startsWith('/saas/');
    this.isPrimaryWorkspace = path.startsWith('/institut/etablissements/');
    this.isInstituteWorkspace = path.startsWith('/institut')
      && !this.isPrimaryWorkspace
      && path !== '/institut/site-web';
  }

  initLeftSidebar() {
    // Set menu height
    this.setMenuHeight();
    this.checkStatuForResize(true);
  }
  setMenuHeight() {
    this.innerHeight = window.innerHeight;
    const height = this.innerHeight - this.headerHeight;
    this.listMaxHeight = height + '';
    this.listMaxWidth = '500px';
  }
  isOpen() {
    return this.bodyTag.classList.contains('overlay-open');
  }
  checkStatuForResize(_firstTime: boolean) {
    if (window.innerWidth < 1025) {
      this.renderer.addClass(this.document.body, 'ls-closed');
    } else {
      this.renderer.removeClass(this.document.body, 'ls-closed');
    }
  }
  mouseHover() {
    const body = this.elementRef.nativeElement.closest('body');
    if (body.classList.contains('submenu-closed')) {
      this.renderer.addClass(this.document.body, 'side-closed-hover');
      this.renderer.removeClass(this.document.body, 'submenu-closed');
    }
  }
  mouseOut() {
    const body = this.elementRef.nativeElement.closest('body');
    if (body.classList.contains('side-closed-hover')) {
      this.renderer.removeClass(this.document.body, 'side-closed-hover');
      this.renderer.addClass(this.document.body, 'submenu-closed');
    }
  }
  logout() {
    this.subs.sink = this.authService.logout().subscribe((res) => {
      if (!res.success) {
        this.router.navigate(['/authentication/signin']);
      }
        this.cdr.markForCheck();
    });
  }

  capitalizeString(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
