import { Injectable, signal } from '@angular/core';
import { ImageModel } from '../models/image.model';
import { FeatureCollection, Feature } from 'geojson';
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

  private geoJsonPoints: FeatureCollection = {
    type: 'FeatureCollection',
    features: this.rawImages.map((img) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [img.longitude, img.latitude],
      },
      properties: {
        title: img.formattedName,
      },
    })),
  };

  readonly images = signal<ImageModel[]>(this.rawImages);
  readonly imagePoints = signal<FeatureCollection>(this.geoJsonPoints);
}
