import { Route } from '@angular/router';
import { Page404Component } from '../authentication/page404/page404.component';
import { ParentDashboardComponent } from './dashboard/parent-dashboard.component';

export const PARENT_ROUTE: Route[] = [
  {
    path: 'dashboard',
    component: ParentDashboardComponent,
  },
  { path: '**', component: Page404Component },
];
