import { Injectable, signal } from '@angular/core';
import { ImageModel } from '../models/image.model';
import imageData from '../../../public/assets/data/images.json';

@Injectable({
  providedIn: 'root',
})
export class ImageFeed {
  private rawImages = (imageData as ImageModel[]).map((curImg) => ({
    ...curImg,
    image: `assets/images/${curImg.image}`,
    timestamp: new Date(curImg.timestamp).toLocaleString(),
    formattedName:
      curImg.countryCode === 'US'
        ? `${curImg.geoName}, ${curImg.adminName1}`
        : `${curImg.geoName}, ${curImg.countryName}`,
  }));

  readonly images = signal<ImageModel[]>(this.rawImages);
}
