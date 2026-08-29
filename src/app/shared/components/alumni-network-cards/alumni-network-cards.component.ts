import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface AlumniStat {
  title: string;
  value: string;
  subText: string;
  icon: string;
  colorClass: string;
  bgClass: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-alumni-network-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './alumni-network-cards.component.html',
  styleUrl: './alumni-network-cards.component.scss',
})
export class AlumniNetworkCardsComponent {
  public stats: AlumniStat[] = [
    {
      title: 'Active Alumni',
      value: '2,840+',
      subText: '↑ 14% this year',
      icon: 'people',
      colorClass: 'text-primary',
      bgClass: 'bg-primary-subtle',
    },
    {
      title: 'Employment Rate',
      value: '94.2%',
      subText: 'Global top tier',
      icon: 'work',
      colorClass: 'text-success',
      bgClass: 'bg-success-subtle',
    },
    {
      title: 'Funds Donated',
      value: '$342.5K',
      subText: 'For library upgrade',
      icon: 'monetization_on',
      colorClass: 'text-warning',
      bgClass: 'bg-warning-subtle',
    },
    {
      title: 'Active Mentors',
      value: '187 Staff',
      subText: 'Providing career prep',
      icon: 'school',
      colorClass: 'text-danger',
      bgClass: 'bg-danger-subtle',
    },
  ];
}
