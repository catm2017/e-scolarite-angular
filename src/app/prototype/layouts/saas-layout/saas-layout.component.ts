import { BidiModule } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RightSidebarService } from '@core';
import { MainLayoutComponent } from '../../../layout/app-layout/main-layout/main-layout.component';
import { HeaderComponent } from '../../../layout/header/header.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { RightSidebarComponent } from '../../../layout/right-sidebar/right-sidebar.component';

/** Même squelette et même moteur de thème que les espaces métier. */
@Component({
  selector: 'app-saas-layout',
  imports: [HeaderComponent, SidebarComponent, RightSidebarComponent, BidiModule, RouterOutlet],
  providers: [RightSidebarService],
  template: `<app-header /><app-sidebar /><app-right-sidebar />
    <div [dir]="direction"><router-outlet /></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaasLayoutComponent extends MainLayoutComponent {}
