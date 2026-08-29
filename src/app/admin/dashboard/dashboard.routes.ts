import { Route } from '@angular/router';
import { MainComponent } from './main/main.component';
import { Dashboard2Component } from './dashboard2/dashboard2.component';
import { DashboardComponent as StudentDashboard } from 'app/student/dashboard/dashboard.component';
import { DashboardComponent } from 'app/teacher/dashboard/dashboard.component';
import { Page404Component } from 'app/authentication/page404/page404.component';
import { LibraryDashboardComponent } from './library-dashboard/library-dashboard.component';
import { TransportDashboardComponent } from './transport-dashboard/transport-dashboard.component';
export const DASHBOARD_ROUTE: Route[] = [
  {
    path: '',
    redirectTo: 'main',
    pathMatch: 'full',
  },
  {
    path: 'main',
    component: MainComponent,
  },
  {
    path: 'dashboard2',
    component: Dashboard2Component,
  },
  {
    path: 'teacher-dashboard',
    component: DashboardComponent,
  },
  {
    path: 'student-dashboard',
    component: StudentDashboard,
  },
  {
    path: 'library-dashboard',
    component: LibraryDashboardComponent,
  },
  {
    path: 'transport-dashboard',
    component: TransportDashboardComponent,
  },
  { path: '**', component: Page404Component },
];
