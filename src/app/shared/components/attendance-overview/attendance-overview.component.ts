import { Component, OnInit, Input, input, computed, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import {
  ChartComponent,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexLegend,
  ApexDataLabels,
  ApexTooltip,
  ApexStates,
  ApexTheme,
  ApexPlotOptions,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type AttendanceChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  states: ApexStates;
  theme: ApexTheme;
  colors: string[];
};

export interface AttendanceData {
  className: string;
  present: number;
  absent: number;
  late: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-attendance-overview',
  templateUrl: './attendance-overview.component.html',
  styleUrls: ['./attendance-overview.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    NgApexchartsModule,
    MatIconModule,
  ],
})
export class AttendanceOverviewComponent implements OnInit {
  readonly chart = viewChild.required<ChartComponent>('chart');
  public chartOptions!: Partial<AttendanceChartOptions>;

  readonly title = input('Attendance');
  readonly attendanceData = input<AttendanceData[]>([]);
  readonly processedAttendanceData = computed(() => {
    const data = this.attendanceData();
    return data && data.length > 0 ? data : this.defaultAttendanceData;
  });

  selectedClass: string = '';
  classes: string[] = [];
  currentData: { present: number; absent: number; late: number } = {
    present: 0,
    absent: 0,
    late: 0,
  };

  // Default attendance data if none is provided
  defaultAttendanceData: AttendanceData[] = [
    {
      className: 'Grade 10A',
      present: 85,
      absent: 10,
      late: 5,
    },
    {
      className: 'Grade 11B',
      present: 78,
      absent: 15,
      late: 7,
    },
    {
      className: 'Grade 12C',
      present: 92,
      absent: 5,
      late: 3,
    },
    {
      className: 'Grade 10B',
      present: 80,
      absent: 12,
      late: 8,
    },
    {
      className: 'Grade 11A',
      present: 75,
      absent: 18,
      late: 7,
    },
  ];

  constructor() {}

  ngOnInit(): void {

    // Extract class names
    this.classes = this.processedAttendanceData().map((data) => data.className);

    // Set initial selected class
    if (this.classes.length > 0) {
      this.selectedClass = this.classes[0];
      this.updateChartData();
    }
  }

  updateChartData(): void {
    // Find the selected class data
    const selectedData = this.processedAttendanceData().find(
      (data) => data.className === this.selectedClass,
    );

    if (selectedData) {
      this.currentData = {
        present: selectedData.present,
        absent: selectedData.absent,
        late: selectedData.late,
      };

      this.initChart();
    }
  }

  onClassChange(): void {
    this.updateChartData();
  }

  private initChart(): void {
    this.chartOptions = {
      series: [
        this.currentData.present,
        this.currentData.absent,
        this.currentData.late,
      ],
      chart: {
        type: 'donut',
        height: 270,
        fontFamily: 'Roboto, sans-serif',
      },
      labels: ['Present', 'Absent', 'Late'],
      colors: ['#4CAF50', '#F44336', '#FF9800'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontWeight: 600,
                offsetY: -10,
              },
              value: {
                show: true,
                fontSize: '20px',
                fontWeight: 400,
                formatter: function (val) {
                  return val + '%';
                },
              },
              total: {
                show: true,
                label: 'Total',
                formatter: function (w) {
                  return (
                    w.globals.seriesTotals.reduce((a: number, b: number) => {
                      return a + b;
                    }, 0) + '%'
                  );
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '14px',
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
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
    };
  }

  getTotalStudents(): number {
    const selectedData = this.processedAttendanceData().find(
      (data) => data.className === this.selectedClass,
    );
    if (selectedData) {
      return selectedData.present + selectedData.absent + selectedData.late;
    }
    return 0;
  }
}
