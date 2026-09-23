import { BidiModule } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { RightSidebarService } from '@core';
import { MainLayoutComponent } from '../../../layout/app-layout/main-layout/main-layout.component';
import { HeaderComponent } from '../../../layout/header/header.component';
import { RightSidebarComponent } from '../../../layout/right-sidebar/right-sidebar.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import {
  EstablishmentWorkspaceType,
  PrimaryWorkspaceService,
} from '../../primary-school/primary-workspace.service';

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
export class EstablishmentLayoutComponent extends MainLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspace = inject(PrimaryWorkspaceService);

  constructor() {
    super();

    // Le layout est créé avant les pages métier : le contexte est donc juste
    // dès le premier rendu du navtop, de la sidebar et du contenu.
    const routeType = this.route.snapshot.data['establishmentType'];
    if (this.isEstablishmentType(routeType)) {
      this.workspace.configureEstablishment(routeType);
    } else {
      this.workspace.synchronizeFromUrl(this.router.url);
    }
    this.subs.sink = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.workspace.synchronizeFromUrl(event.urlAfterRedirects));
  }

  private isEstablishmentType(value: unknown): value is EstablishmentWorkspaceType {
    return value === 'daara' || value === 'prescolaire' || value === 'primary' || value === 'college' || value === 'lycee';
  }
}
