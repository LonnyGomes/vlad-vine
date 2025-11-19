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
  selector: 'app-model-chart',
  standalone: true,
  templateUrl: './model-chart.html',
  styleUrl: './model-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelChart implements AfterViewInit, OnDestroy {
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

    // Count photos per model
    const modelMap = new Map<string, number>();

    images.forEach((img) => {
      const model = img.model || 'Unknown';
      modelMap.set(model, (modelMap.get(model) || 0) + 1);
    });

    // Transform to chart data format
    const chartData = Array.from(modelMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([model, count]) => ({
        name: model,
        y: count,
      }));

    const options: Highcharts.Options = {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        renderTo: container.nativeElement,
        borderWidth: 0,
        marginTop: 0,
      },
      title: {
        text: '',
        style: {
          color: getCSSColor('--text-color'),
        },
      },
      tooltip: {
        formatter: function (this: any) {
          const point = this.point;
          return `<b>${point.name}</b><br/>Photos: ${point.y} (${point.percentage.toFixed(1)}%)`;
        },
      },
      plotOptions: {
        pie: {
          innerSize: '60%',
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.percentage:.1f}%',
            style: {
              textOutline: 'none',
              color: getCSSColor('--text-color'),
              fontSize: '14px',
              fontWeight: 'bold',
            },
          },
          borderWidth: 0,
        },
      },
      series: [
        {
          type: 'pie',
          name: 'Models',
          data: chartData as any,
        },
      ],
      credits: {
        enabled: false,
      },
      legend: {
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
