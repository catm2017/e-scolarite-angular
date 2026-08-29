import {
  Router,
  NavigationEnd,
  RouterLinkActive,
  RouterLink,
} from '@angular/router';
import { NgClass } from '@angular/common';
import { Component, ElementRef, OnInit, Renderer2, HostListener, DOCUMENT, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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

const PRIMARY_ROUTES: RouteInfo[] = [
  { path: '', title: 'SCOLARITÉ', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Tableau de bord', iconType: 'material-icons-outlined', icon: 'space_dashboard', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'dashboard' },
  { path: '', title: 'Dossiers élèves', iconType: 'material-icons-outlined', icon: 'folder_shared', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'registrations' },
  { path: '', title: 'Inscriptions & transferts', iconType: 'material-icons-outlined', icon: 'how_to_reg', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'enrollments' },
  { path: '', title: 'Élèves', iconType: 'material-icons-outlined', icon: 'groups', class: '', groupTitle: false, badge: '326', badgeClass: 'badge bg-blue sidebar-badge', role: [], submenu: [], workspaceView: 'students' },
  { path: '', title: 'Tuteurs', iconType: 'material-icons-outlined', icon: 'family_restroom', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'guardians' },
  { path: '', title: 'Classes', iconType: 'material-icons-outlined', icon: 'class', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'classes' },
  { path: '', title: 'Séries', iconType: 'material-icons-outlined', icon: 'account_tree', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'series' },
  { path: '', title: 'ADMINISTRATION', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Personnel', iconType: 'material-icons-outlined', icon: 'badge', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'staff' },
  { path: '', title: 'Absences du personnel', iconType: 'material-icons-outlined', icon: 'event_busy', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'staff-attendance' },
  { path: '', title: 'PÉDAGOGIE', iconType: '', icon: '', class: '', groupTitle: true, badge: '', badgeClass: '', role: [], submenu: [] },
  { path: '', title: 'Matières', iconType: 'material-icons-outlined', icon: 'menu_book', class: '', groupTitle: false, badge: '', badgeClass: '', role: [], submenu: [], workspaceView: 'subjects' },
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
  { path: '', title: 'Établissements', iconType: 'material-icons-outlined', icon: 'account_balance', class: '', groupTitle: false, badge: '7', badgeClass: 'badge bg-blue sidebar-badge', role: [], submenu: [], workspaceView: 'establishments' },
  { path: '', title: 'Campus', iconType: 'material-icons-outlined', icon: 'location_city', class: '', groupTitle: false, badge: '3', badgeClass: 'badge bg-blue sidebar-badge', role: [], submenu: [], workspaceView: 'campuses' },
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
  private cdr = inject(ChangeDetectorRef);

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
  constructor() {
    super();
    this.elementRef.nativeElement.closest('body');
    this.subs.sink = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isPrimaryWorkspace = event.urlAfterRedirects.startsWith(
          '/institut/etablissements/'
        );
        this.isInstituteWorkspace = event.urlAfterRedirects === '/institut';
        if (this.isPrimaryWorkspace || this.isInstituteWorkspace) {
          this.configureWorkspaceNavigation();
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
    this.isPrimaryWorkspace = this.router.url.startsWith(
      '/institut/etablissements/'
    );
    this.isInstituteWorkspace = this.router.url === '/institut';

    if (this.isPrimaryWorkspace || this.isInstituteWorkspace) {
      this.configureWorkspaceNavigation();
      this.userFullName = 'Aminata Ndiaye';
      this.userImg = './assets/images/user/admin.jpg';
      this.userType = 'Administratrice';
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

  selectPrimaryView(view?: string): void {
    if (view) {
      this.primaryWorkspace.selectView(view as PrimaryView);
    }
  }

  selectInstituteView(view?: string): void {
    if (view) {
      this.instituteWorkspace.selectView(view as InstituteView);
    }
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
    this.sidebarItems = this.isPrimaryWorkspace ? PRIMARY_ROUTES : INSTITUTE_ROUTES;
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
