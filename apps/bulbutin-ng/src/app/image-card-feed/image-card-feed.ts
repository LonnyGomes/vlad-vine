import { Component, inject } from '@angular/core';
import { ImageCard } from '../image-card/image-card';
import { ImageFeed } from '../services/image-feed';
import { ImageResult } from 'parse-photos';
import { Router } from '@angular/router';

@Component({
  selector: 'app-image-card-feed',
  imports: [ImageCard],
  templateUrl: './image-card-feed.html',
  styleUrl: './image-card-feed.scss',
})
export class ImageCardFeed {
  private imgFeed = inject(ImageFeed);
  private router = inject(Router);
  images = this.imgFeed.images;
}
