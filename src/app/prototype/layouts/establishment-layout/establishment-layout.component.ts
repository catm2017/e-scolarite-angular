import { BidiModule } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RightSidebarService } from '@core';
import { MainLayoutComponent } from '../../../layout/app-layout/main-layout/main-layout.component';
import { HeaderComponent } from '../../../layout/header/header.component';
import { RightSidebarComponent } from '../../../layout/right-sidebar/right-sidebar.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

/**
 * Layout des espaces métier d'un établissement.
 *
 * Il compose le squelette central du template. Les futurs sous-espaces
 * (primaire, collège, lycée, daara, université…) peuvent ainsi partager la
 * topbar et le thème tout en fournissant leur propre navigation métier.
 */
@Component({
  selector: 'app-establishment-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    SidebarComponent,
    RightSidebarComponent,
    BidiModule,
    RouterOutlet,
  ],
  providers: [RightSidebarService],
  templateUrl: './establishment-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstablishmentLayoutComponent extends MainLayoutComponent {}
