import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  NgApexchartsModule,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexLegend,
  ApexDataLabels,
  ApexPlotOptions,
  ApexTooltip,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hostel-occupancy-donut',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    NgApexchartsModule,
  ],
  templateUrl: './hostel-occupancy-donut.component.html',
  styleUrl: './hostel-occupancy-donut.component.scss',
})
export class HostelOccupancyDonutComponent {
  public chartOptions!: Partial<ChartOptions>;

  // Extra occupancy metrics for UI details
  public stats = [
    {
      label: 'Boys Block (A)',
      occupied: 180,
      total: 200,
      colorClass: 'text-primary',
    },
    {
      label: 'Girls Block (B)',
      occupied: 195,
      total: 200,
      colorClass: 'text-success',
    },
    {
      label: 'Premium Suite (C)',
      occupied: 35,
      total: 50,
      colorClass: 'text-warning',
    },
  ];

  constructor() {
    this.initChart();
  }

  private initChart(): void {
    this.chartOptions = {
      series: [410, 40, 50],
      chart: {
        height: 240,
        type: 'donut',
        foreColor: '#9aa0ac',
      },
      labels: ['Occupied', 'Available', 'Maintenance'],
      colors: ['#4F86F8', '#3EBE77', '#FDA24C'],
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                color: '#9aa0ac',
                offsetY: -5,
              },
              value: {
                show: true,
                fontSize: '20px',
                fontWeight: 600,
                color: '#9aa0ac',
                offsetY: 5,
                formatter: (val) => `${val} beds`,
              },
              total: {
                show: true,
                label: 'Total Capacity',
                fontSize: '12px',
                color: '#9aa0ac',
                formatter: (w) => {
                  return '500';
                },
              },
            },
          },
        },
      },
      legend: {
        show: true,
        position: 'bottom',
      },
      tooltip: {
        theme: 'dark',
      },
    };
  }
}
