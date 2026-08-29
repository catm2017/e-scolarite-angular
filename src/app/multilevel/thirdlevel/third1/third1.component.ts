import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-third1',
    templateUrl: './third1.component.html',
    styleUrls: ['./third1.component.scss'],
    imports: [BreadcrumbComponent]
})
export class Third1Component {
  breadscrums = [
    {
      title: 'Third 1',
      items: ['Multilevel', 'Third level'],
      active: 'Third 1',
    },
  ];

  constructor() {
    //constructor
  }
}
