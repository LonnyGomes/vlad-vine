import {
  Component,
  inject,
  signal,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import * as Highcharts from 'highcharts';
import 'highcharts/modules/heatmap';
import { ImageFeed } from '../services/image-feed';
import { getCSSColor } from '../../utils/getCSSColor';

@Component({
  selector: 'app-time-chart',
  imports: [],
  templateUrl: './time-chart.html',
  styleUrl: './time-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeChart implements AfterViewInit, OnDestroy {
  private imageFeed = inject(ImageFeed);
  private chartContainer = viewChild<ElementRef>('chartContainer');
  private chart = signal<Highcharts.Chart | null>(null);
  private darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private darkModeListener: any;

  ngAfterViewInit() {
    this.renderChart();

    // Listen for dark mode changes to re-render
    this.darkModeListener = () => {
      this.renderChart();
    };
    this.darkModeQuery.addEventListener('change', this.darkModeListener);
  }

  private renderChart() {
    const container = this.chartContainer();
    const images = this.imageFeed.images();

    if (!container || !images.length) {
      return;
    }

    // Process data: create heatmap data [hour, dayOfWeek, count]
    const timeData: number[][] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Initialize counts
    const counts: { [key: string]: number } = {};

    images.forEach((img) => {
      const date = new Date(img.timestamp);
      const day = date.getDay(); // 0-6 (Sunday-Saturday)
      const hour = date.getHours(); // 0-23
      const key = `${hour}-${day}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    // Convert to array format for heatmap [x (hour), y (day), value (count)]
    Object.keys(counts).forEach((key) => {
      const [hour, day] = key.split('-').map(Number);
      timeData.push([Number(hour), Number(day), counts[key]]);
    });

    if (!timeData.length) {
      return;
    }

    const options: Highcharts.Options = {
      chart: {
        type: 'heatmap',
        backgroundColor: 'transparent',
        renderTo: container.nativeElement,
        marginTop: 20,
        marginRight: 20,
        marginBottom: 60,
        marginLeft: 120,
      },
      title: {
        text: '',
      },
      xAxis: {
        title: {
          text: 'Hour of Day',
          style: {
            color: getCSSColor('--text-color'),
            fontWeight: 'bold',
            fontSize: '14px',
          },
        },
        min: 0,
        max: 23,
        tickInterval: 1,
        lineColor: getCSSColor('--text-color'),
        tickColor: getCSSColor('--text-color'),
        labels: {
          style: {
            color: getCSSColor('--text-color'),
          },
        },
      },
      yAxis: {
        title: {
          text: 'Day of Week',
          style: {
            color: getCSSColor('--text-color'),
            fontWeight: 'bold',
            fontSize: '14px',
          },
        },
        categories: days,
        reversed: false,
        lineColor: getCSSColor('--text-color'),
        tickColor: getCSSColor('--text-color'),
        labels: {
          style: {
            color: getCSSColor('--text-color'),
          },
        },
      },
      tooltip: {
        formatter: function (this: any) {
          const hour = this.point.x;
          const day = days[this.point.y];
          const count = this.point.value;
          return `<b>${day}</b><br/>Hour: ${hour}:00<br/>Photos: ${count}`;
        },
      },
      colorAxis: {
        min: 0,
        minColor: getCSSColor('--background-color'),
        maxColor: getCSSColor('--primary-color'),
        showInLegend: false,
      },
      series: [
        {
          type: 'heatmap',
          name: 'Photos',
          data: timeData as any,
          borderWidth: 1,
          borderColor: getCSSColor('--background-color'),
          dataLabels: {
            enabled: true,
            color: 'contrast',
            style: {
              fontSize: '11px',
              fontWeight: 'normal',
              textOutline: 'none',
            },
          },
        },
      ],
      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
    };

    const existingChart = this.chart();
    if (existingChart) {
      existingChart.destroy();
    }

    const newChart = new Highcharts.Chart(options);
    this.chart.set(newChart);
  }

  ngOnDestroy() {
    this.darkModeQuery.removeEventListener('change', this.darkModeListener);
    const existingChart = this.chart();
    if (existingChart) {
      existingChart.destroy();
    }
  }
}
