import { Injectable, signal } from '@angular/core';
import { FeatureCollection } from 'geojson';
// Import directly from parse-photos static JSON export
import { imageDataResultsJSON, genGeoJSONPoints } from 'parse-photos/shared';
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
  readonly stats = signal<Stats>({
    altitude: { min: 0, max: 0, average: 0 },
    totals: { images: 0, countries: 0, us: 0 },
    countries: [],
    states: [],
    distanceTraveled: 0,
  });
  readonly mapIndex = signal<number>(0);

  mbStyleLight = 'mapbox://styles/uknowho/cmhq41w0s009101s54ierbhb1';
  mbStyleDark = 'mapbox://styles/uknowho/cmi0p4mkx00f601s106i63bms';

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

  private loadData() {
    // Access the images array from the ImageDataResults structure
    const jsonResults = imageDataResultsJSON as ImageDataResults;
    const rawImages = jsonResults.images;

    const processedImages = rawImages.map((curImg: any) => ({
      ...curImg,
      image: `assets/bulbutin-images/${curImg.image}`,
      timestamp: new Date(curImg.timestamp).toLocaleString(),
    })) as ImageResult[];

    const imagesPoints = genGeoJSONPoints(rawImages);
    this.images.set(processedImages);
    this.imagePoints.set(imagesPoints);

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

    console.log('Image stats:', stats);

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
