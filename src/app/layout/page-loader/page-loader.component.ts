import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { BackendLoadingService } from '../../core/service/backend-loading.service';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-page-loader',
    templateUrl: './page-loader.component.html',
    styleUrls: ['./page-loader.component.scss'],
    imports: [LoadingBarModule]
})
export class PageLoaderComponent {
  readonly backendLoading = inject(BackendLoadingService);
}
