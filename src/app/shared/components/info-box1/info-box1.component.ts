import { NgClass } from '@angular/common';
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-info-box1',
    imports: [MatProgressBarModule, NgClass],
    templateUrl: './info-box1.component.html',
    styleUrl: './info-box1.component.scss'
})
export class InfoBox1Component {
  readonly cardClass = input<string>('');
  readonly iconClass = input<string>('');
  readonly title = input<string>('');
  readonly value = input<string | number>('');
  readonly progressValue = input<number>(0);
  readonly progressClass = input<string>('');
  readonly percentageChange = input<number>(0);
}
