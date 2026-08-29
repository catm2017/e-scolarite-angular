import { Injectable, signal } from '@angular/core';

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

/** État partagé entre le contenu et la navigation de l’espace parent. */
@Injectable({ providedIn: 'root' })
export class InstituteWorkspaceService {
  readonly activeView = signal<InstituteView>('overview');

  selectView(view: InstituteView): void {
    this.activeView.set(view);
  }
}
