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
  selector: 'app-country-chart',
  standalone: true,
  templateUrl: './country-chart.html',
  styleUrl: './country-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryChart implements AfterViewInit, OnDestroy {
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

    // Count photos per country
    const countryMap = new Map<string, { flag: string; countryName: string; count: number }>();

    images.forEach((img) => {
      const key = img.countryCode;
      if (countryMap.has(key)) {
        const existing = countryMap.get(key)!;
        existing.count += 1;
      } else {
        countryMap.set(key, {
          flag: img.flag,
          countryName: img.countryName,
          count: 1,
        });
      }
    });

    // Transform to chart data format
    const chartData = Array.from(countryMap.values())
      .sort((a, b) => b.count - a.count)
      .map((country) => ({
        name: `${country.flag}`,
        countryName: country.countryName,
        flag: country.flag,
        y: country.count,
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
          text: 'Countries',
          style: {
            color: textColor,
            fontWeight: 'bold',
            fontSize: '16px',
          },
        },
        labels: {
          style: {
            color: textColor,
            fontSize: '32px',
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
          return `<b>${point.flag} ${point.countryName}</b><br/>Photos: ${point.y}`;
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
          pointPadding: 0.2,
          groupPadding: 0.2,
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
