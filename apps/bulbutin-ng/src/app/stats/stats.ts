import { Component, inject, computed } from '@angular/core';
import { ImageFeed } from '../services/image-feed';

@Component({
  selector: 'app-stats',
  imports: [],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats {
  private imgFeed = inject(ImageFeed);
  private stats = this.imgFeed.stats;
  countries = computed(() => this.imgFeed.stats().countries);
  states = computed(() => this.imgFeed.stats().states);
  altitude = computed(() => this.imgFeed.stats().altitude);
  totals = computed(() => this.imgFeed.stats().totals);
}
