import { Injectable, signal } from '@angular/core';
import { ImageModel } from '../models/image.model';
import { FeatureCollection } from 'geojson';
// Import directly from parse-photos static JSON export
import { imageDataResultsJSON, genGeoJSONPoints } from 'parse-photos/shared';
import { ImageDataResults } from 'parse-photos/types';

@Injectable({
  providedIn: 'root',
})
export class ImageFeed {
  readonly images = signal<ImageModel[]>([]);
  readonly imagePoints = signal<FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });

  constructor() {
    this.loadImages();
  }

  private loadImages() {
    // Access the images array from the ImageDataResults structure
    const rawImages = (imageDataResultsJSON as ImageDataResults).images;

    const processedImages = rawImages.map((curImg: any) => ({
      ...curImg,
      image: `assets/images/${curImg.image}`,
      timestamp: new Date(curImg.timestamp).toLocaleString(),
    })) as ImageModel[];

    const imagesPoints = genGeoJSONPoints(rawImages);
    this.images.set(processedImages);
    this.imagePoints.set(imagesPoints);

    // const geoJsonPoints: FeatureCollection = {
    //   type: 'FeatureCollection',
    //   features: processedImages.map((img) => ({
    //     type: 'Feature',
    //     geometry: {
    //       type: 'Point',
    //       coordinates: [img.longitude, img.latitude],
    //     },
    //     properties: {
    //       title: img.formattedName || img.geoName,
    //     },
    //   })),
    // };
    // this.imagePoints.set(geoJsonPoints);
  }
}
