import { Component, input } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { DateFormatPipe } from '../pipes/date-format.pipe';
import { ImageResult } from 'parse-photos';

@Component({
  selector: 'app-image-card',
  imports: [DateFormatPipe, DecimalPipe, NgOptimizedImage],
  templateUrl: './image-card.html',
  styleUrl: './image-card.scss',
})
export class ImageCard {
  image = input.required<ImageResult>();
}
