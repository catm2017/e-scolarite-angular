import { BidiModule } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RightSidebarService } from '@core';
import { MainLayoutComponent } from '../../../layout/app-layout/main-layout/main-layout.component';
import { HeaderComponent } from '../../../layout/header/header.component';
import { RightSidebarComponent } from '../../../layout/right-sidebar/right-sidebar.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

/** Layout commun aux comptes tuteurs et élèves. */
@Component({
  selector: 'app-family-layout',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, RightSidebarComponent, BidiModule, RouterOutlet],
  providers: [RightSidebarService],
  templateUrl: './family-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyLayoutComponent extends MainLayoutComponent {}
