import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-doc-welcome-card',
    imports: [],
    templateUrl: './doc-welcome-card.component.html',
    styleUrl: './doc-welcome-card.component.scss'
})
export class DocWelcomeCardComponent {

}
