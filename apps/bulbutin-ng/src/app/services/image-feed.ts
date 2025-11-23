import { Injectable, signal } from '@angular/core';
import { Feature, FeatureCollection } from 'geojson';
// Import directly from parse-photos static JSON export
import { imageDataResultsJSON, genGeoJSONPoints, genGeoJSONRoute } from 'parse-photos/shared';
import { ImageDataResults, ImageResult, Stats } from 'parse-photos/types';

@Injectable({
  providedIn: 'root',
})
export class ImageFeed {
  readonly images = signal<ImageResult[]>([]);
  readonly imagePoints = signal<FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });

  readonly imageRoute = signal<Feature>({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [],
    },
  });
  readonly stats = signal<Stats>({
    altitude: { min: 0, max: 0, average: 0 },
    totals: { images: 0, countries: 0, us: 0 },
    countries: [],
    states: [],
    distanceTraveled: 0,
  });
  readonly mapIndex = signal<number>(-1);

  mbStyleLight = 'mapbox://styles/uknowho/cmhq41w0s009101s54ierbhb1';
  mbStyleDark = 'mapbox://styles/uknowho/cmi1csaap00g001s1g4rjfiqp';
  photosPath = '/assets/bulbutin-images';
  uploadUrl = 'https://github.com/LonnyGomes/vlad-vine/blob/main/packages/parse-photos/UPLOADs.md';

  constructor() {
    this.loadData();
  }

  nextMapIndex() {
    const currentIndex = this.mapIndex();
    const imagesLength = this.images().length;
    const nextIndex = (currentIndex + 1) % imagesLength;

    this.mapIndex.update(() => nextIndex);
  }

  prevMapIndex() {
    const currentIndex = this.mapIndex();
    const imagesLength = this.images().length;
    const prevIndex = (currentIndex - 1 + imagesLength) % imagesLength;
    this.mapIndex.update(() => prevIndex);
  }
  setMapIndexByImageId(index: number) {
    if (index >= 0 && index < this.images().length) {
      for (let i = 0; i < this.images().length; i++) {
        if (this.images()[i].id === index) {
          this.mapIndex.set(i);
          return;
        }
      }
    }
  }

  private loadData() {
    // Access the images array from the ImageDataResults structure
    const jsonResults = imageDataResultsJSON as ImageDataResults;
    const rawImages = jsonResults.images;

    const processedImages = rawImages.map((curImg: any) => ({
      ...curImg,
      image: `${this.photosPath}/${curImg.image}`,
      imageThumb: `${this.photosPath}/${curImg.imageThumb}`,
      timestamp: new Date(curImg.timestamp).toLocaleString(),
    })) as ImageResult[];

    const imagesPoints = genGeoJSONPoints(rawImages);
    this.images.set(processedImages);
    this.imagePoints.set(imagesPoints);

    const imageRoute = genGeoJSONRoute(rawImages);
    this.imageRoute.set(imageRoute);

    const stats: Stats = {
      altitude: {
        min: jsonResults.altitudeStats.min,
        max: jsonResults.altitudeStats.max,
        average: jsonResults.altitudeStats.average,
      },
      totals: {
        images: rawImages.length,
        countries: jsonResults.countryTotals.length,
        us: jsonResults.usTotals.length,
      },
      countries: jsonResults.countryTotals,
      states: jsonResults.usTotals,
      distanceTraveled: jsonResults.distanceTraveled,
    };

    this.stats.set(stats);
  }

  getImageById(id: number): ImageResult | undefined {
    return this.images().find((img) => img.id === id);
  }
}
