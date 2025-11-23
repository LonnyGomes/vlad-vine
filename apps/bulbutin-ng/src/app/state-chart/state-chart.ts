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
  selector: 'app-state-chart',
  standalone: true,
  templateUrl: './state-chart.html',
  styleUrl: './state-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateChart implements AfterViewInit, OnDestroy {
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

    // Count photos per state
    const stateMap = new Map<string, number>();

    images.forEach((img) => {
      // Only count US states
      if (img.countryCode === 'US' && img.adminName1) {
        const state = img.adminName1;
        stateMap.set(state, (stateMap.get(state) || 0) + 1);
      }
    });

    // Transform to chart data format
    const chartData = Array.from(stateMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([state, count]) => ({
        name: state,
        y: count,
      }));

    // Detect dark mode
    const isDarkMode = this.darkModeQuery.matches;
    const textColor = isDarkMode ? '#e0e0e0' : '#333333';

    const options: Highcharts.Options = {
      chart: {
        type: 'bar',
        backgroundColor: 'transparent',
        renderTo: container.nativeElement,
        borderWidth: 0,
        marginTop: 0,
        marginRight: 30,
      },
      title: {
        text: '',
        style: {
          color: textColor,
        },
      },
      yAxis: {
        title: {
          text: 'Number of Photos',
          style: {
            color: textColor,
            fontWeight: 'bold',
            fontSize: '16px',
          },
        },
        labels: {
          style: {
            color: textColor,
          },
        },
        gridLineColor: isDarkMode ? '#404040' : '#e6e6e6',
      },
      xAxis: {
        type: 'category',
        title: {
          text: 'States',
          style: {
            color: textColor,
            fontWeight: 'bold',
            fontSize: '16px',
          },
        },
        labels: {
          style: {
            color: textColor,
            fontSize: '16px',
          },
        },
        lineColor: getCSSColor('--primary-color'),
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        formatter: function (this: any) {
          const point = this.point;
          return `<b>${point.name}</b><br/>Photos: ${point.y}`;
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Photos',
          data: chartData as any,
        },
      ],
      credits: {
        enabled: false,
      },
      plotOptions: {
        bar: {
          pointPadding: 0.1,
          groupPadding: 0.1,
        },
        series: {
          dataLabels: {
            enabled: true,
            style: {
              textOutline: 'none',
              color: textColor,
              fontSize: '16px',
              fontWeight: 'bold',
            },
          },
          borderWidth: 0,
        },
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
