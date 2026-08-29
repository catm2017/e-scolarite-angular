import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { RouterLink } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    imports: [RouterLink, FeatherModule]
})
export class BreadcrumbComponent {
  readonly title = input.required<string>();
  readonly items = input.required<string[]>();
  readonly active_item = input.required<string>();
  readonly homeLink = input('/admin/dashboard/main');
  readonly showTitle = input(true);
  readonly homeClicked = output<void>();

  constructor() {
    //constructor
  }
}
