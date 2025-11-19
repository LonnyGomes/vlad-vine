import { Component, inject, computed } from '@angular/core';
import { ImageFeed } from '../services/image-feed';
import { StatsCard } from '../stats-card/stats-card';
import { AltitudeChart } from '../altitude-chart/altitude-chart';
import { CountryChart } from '../country-chart/country-chart';
import { ModelChart } from '../model-chart/model-chart';
import { StateChart } from '../state-chart/state-chart';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-stats',
  imports: [StatsCard, AltitudeChart, CountryChart, ModelChart, StateChart, DecimalPipe],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats {
  private imgFeed = inject(ImageFeed);
  countries = computed(() => this.imgFeed.stats().countries);
  states = computed(() => this.imgFeed.stats().states);
  altitude = computed(() => this.imgFeed.stats().altitude);
  totals = computed(() => this.imgFeed.stats().totals);
  distanceTraveled = computed(() => this.imgFeed.stats().distanceTraveled);
}
