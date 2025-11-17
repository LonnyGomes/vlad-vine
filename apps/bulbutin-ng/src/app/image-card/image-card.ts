import { Component, inject, input } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { DateFormatPipe } from '../pipes/date-format.pipe';
import { ImageResult } from 'parse-photos';
import { ImageFeed } from '../services/image-feed';
import { Router } from '@angular/router';

@Component({
  selector: 'app-image-card',
  imports: [DateFormatPipe, DecimalPipe, NgOptimizedImage],
  templateUrl: './image-card.html',
  styleUrl: './image-card.scss',
})
export class ImageCard {
  private imgFeed = inject(ImageFeed);
  private router = inject(Router);

  image = input.required<ImageResult>();

  showImageOnMap(image: ImageResult) {
    this.imgFeed.setMapIndexByImageId(image.id);
    // route to map view
    this.router.navigate(['/map']);
  }
}
