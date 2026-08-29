import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgApexchartsModule, ApexChart, ApexNonAxisChartSeries, ApexResponsive, ApexLegend, ApexDataLabels } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  legend: ApexLegend;
  colors: string[];
  dataLabels: ApexDataLabels;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fee-collection-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, NgApexchartsModule],
  templateUrl: './fee-collection-summary.component.html',
  styleUrls: ['./fee-collection-summary.component.scss']
})
export class FeeCollectionSummaryComponent implements OnInit {
  public chartOptions!: Partial<ChartOptions>;

  stats = {
    totalCollected: 245800,
    totalPending: 42350,
    totalOverdue: 12500,
    collectionRate: 81.8
  };

  ngOnInit() {
    this.initChart();
  }

  initChart() {
    this.chartOptions = {
      series: [this.stats.totalCollected, this.stats.totalPending, this.stats.totalOverdue],
      chart: {
        type: 'donut',
        height: 280,
        foreColor: '#9aa0ac'
      },
      labels: ['Collected', 'Pending', 'Overdue'],
      colors: ['#4CAF50', '#FF9800', '#F44336'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${Math.round(val)}%`
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center'
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    };
  }

  sendReminders() {
    // In production, this would trigger automated fee payment reminders via SMS/Email
  }
}
