import { CommonModule } from '@angular/common';
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-statistic-card1',
    imports: [MatCardModule, CommonModule],
    templateUrl: './statistic-card1.component.html',
    styleUrl: './statistic-card1.component.scss'
})
export class StatisticCard1Component {
  readonly title = input<string>('');
  readonly value = input<string | number>('');
  readonly percentage = input<string | number>('');
  readonly increase = input<boolean>(true);
  readonly imageUrl = input<string>('');
}
