import type { FeatureCollection } from "geojson";
import type { AltitudeStats, CountryInfo, ImageResult } from "./models";

/**
 * Browser-friendly static export of image data
 * This avoids Node.js fs module issues in browser environments
 */
import type { ImageDataResults } from "./models.js";
import imageDataResults from "../images.json";

// JSON timestamps are strings, so we need to cast appropriately
export const imageDataResultsJSON =
  imageDataResults as unknown as ImageDataResults;

export function calcTotalCountries(images: ImageResult[]): CountryInfo[] {
  const totalCountries = images.reduce(
    (countryHash, curImage) => {
      const { countryCode, flag, countryName } = curImage;

      if (!countryHash[countryCode]) {
        countryHash[countryCode] = {
          countryCode,
          countryName,
          flag,
        };
      }

      return countryHash;
    },
    {} as Record<string, CountryInfo>,
  );

  return Object.values(totalCountries);
}

export function calcTotalUSStates(images: ImageResult[]): string[] {
  const totalStates = images
    .filter((curImage) => curImage.countryCode === "US")
    .map((curImage) => curImage.adminName1);

  return [...new Set(totalStates)];
}

export function calcAltitudes(images: ImageResult[]): AltitudeStats {
  const altitudeStats = {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    total: 0,
    count: 0,
  };

  images.reduce((stats, curImage) => {
    const { altitude } = curImage;
    if (altitude !== undefined) {
      stats.count += 1;
      stats.total += altitude;
      stats.min = Math.min(stats.min, altitude);
      stats.max = Math.max(stats.max, altitude);
    }
    return stats;
  }, altitudeStats);

  const average =
    altitudeStats.count > 0
      ? Math.round(altitudeStats.total / altitudeStats.count)
      : 0;

  return {
    min: altitudeStats.min,
    max: altitudeStats.max,
    average,
  };
}

/**
 * Convert ImageResult array to GeoJSON FeatureCollection of Points
 * @param images Array of ImageResult
 * @returns GeoJSON FeatureCollection
 */
export function genGeoJSONPoints(images: ImageResult[]): FeatureCollection {
  const geoPoints: FeatureCollection = {
    type: "FeatureCollection",
    features: images.map((img) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [img.longitude, img.latitude],
      },
      properties: {
        title: img.formattedName || img.geoName,
        id: img.id,
        image: img.image,
      },
    })),
  };

  return geoPoints;
}
