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
import { ImageFeed } from '../services/image-feed';
import { getCSSColor } from '../../utils/getCSSColor';

@Component({
  selector: 'app-altitude-chart',
  standalone: true,
  templateUrl: './altitude-chart.html',
  styleUrl: './altitude-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AltitudeChart implements AfterViewInit, OnDestroy {
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

    const altitudeData = images
      .filter((img) => img.altitude != null)
      .map((img) => [new Date(img.timestamp).getTime(), img.altitude!]);

    if (!altitudeData.length) {
      return;
    }

    const options: Highcharts.Options = {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        renderTo: container.nativeElement,
        marginTop: 0,
      },
      title: {
        text: '',
        style: {
          color: getCSSColor('--text-color'),
        },
      },
      xAxis: {
        type: 'datetime',
        labels: {
          style: {
            color: getCSSColor('--text-color'),
          },
        },
      },
      yAxis: {
        title: {
          text: 'Altitude (feet)',
          style: {
            color: getCSSColor('--text-color'),
          },
        },
        labels: {
          style: {
            color: getCSSColor('--text-color'),
          },
        },
      },
      series: [
        {
          type: 'line',
          name: 'Altitude',
          data: altitudeData as any,
          color: getCSSColor('--primary-color'),
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
    // Clean up listeners and destroy chart
    if (this.darkModeListener) {
      this.darkModeQuery.removeEventListener('change', this.darkModeListener);
    }
    const chart = this.chart();
    if (chart) {
      chart.destroy();
    }
  }
}
