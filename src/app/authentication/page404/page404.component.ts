import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-page404',
    templateUrl: './page404.component.html',
    styleUrls: ['./page404.component.scss'],
    imports: [
        FormsModule,
        MatButtonModule,
        RouterLink,
    ]
})
export class Page404Component {
  constructor() {
    // constructor
  }
}
