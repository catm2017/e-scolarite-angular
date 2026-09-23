import { BidiModule } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RightSidebarService } from '@core';
import { MainLayoutComponent } from '../../../layout/app-layout/main-layout/main-layout.component';
import { HeaderComponent } from '../../../layout/header/header.component';
import { RightSidebarComponent } from '../../../layout/right-sidebar/right-sidebar.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

/** Le profil enseignant utilise le même squelette global que tous les espaces métier. */
@Component({
  selector: 'app-teacher-layout',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, RightSidebarComponent, BidiModule, RouterOutlet],
  providers: [RightSidebarService],
  templateUrl: './teacher-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherLayoutComponent extends MainLayoutComponent {}
