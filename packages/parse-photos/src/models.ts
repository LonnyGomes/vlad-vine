import type { FeatureCollection } from "geojson";

export interface ImageResult {
  id: number;
  image: string;
  imageThumb: string;
  altitude?: number;
  timestamp: Date;
  speed: number;
  make: string;
  model: string;
  latitude: number;
  longitude: number;
  geoName: string;
  formattedName: string;
  countryCode: string;
  countryName: string;
  flag: string;
  adminName1: string;
  adminName2?: string;
  geoDistance: number;
  distance: number;
}

export interface CountryInfo {
  countryCode: string;
  countryName: string;
  flag: string;
}

export interface AltitudeStats {
  min: number;
  max: number;
  average: number;
}

export interface ImageDataResults {
  altitudeStats: AltitudeStats;
  countryTotals: CountryInfo[];
  distanceTraveled: number;
  images: ImageResult[];
  imagesPoints: FeatureCollection;
  usTotals: string[];
}

export interface StatusAltitude {
  min: number;
  max: number;
  average: number;
}

export interface StatsTotals {
  images: number;
  countries: number;
  us: number;
}

export interface Stats {
  altitude: StatusAltitude;
  totals: StatsTotals;
  countries: CountryInfo[];
  distanceTraveled: number;
  states: string[];
}
