import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import {
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexTooltip,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type FeeChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  colors: string[];
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fee-payment-overview',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatDividerModule,
    NgApexchartsModule
],
  templateUrl: './fee-payment-overview.component.html',
  styleUrls: ['./fee-payment-overview.component.scss'],
})
export class FeePaymentOverviewComponent implements OnInit {
  public feeChartOptions!: Partial<FeeChartOptions>;

  // Payment summary data
  paymentSummary = {
    paid: 65,
    pending: 20,
    overdue: 10,
    partial: 5,
    total: 100,
  };

  ngOnInit(): void {
    this.initChart();
  }

  initChart(): void {
    this.feeChartOptions = {
      series: [
        this.paymentSummary.paid,
        this.paymentSummary.pending,
        this.paymentSummary.overdue,
        this.paymentSummary.partial,
      ],
      chart: {
        type: 'donut',
        height: 240,
      },
      labels: ['Paid', 'Pending', 'Overdue', 'Partial'],
      colors: ['#4CAF50', '#2196F3', '#F44336', '#FF9800'],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        offsetY: 0,
        height: 60,
      },
      dataLabels: {
        enabled: false,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
      tooltip: {
        y: {
          formatter: function (val) {
            return val + '%';
          },
        },
      },
    };
  }
}
