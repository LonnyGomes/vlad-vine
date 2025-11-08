export interface ImageModel {
  image: string;
  altitude?: number;
  timestamp: string;
  speed: number;
  make: string;
  model: string;
  latitude: number;
  longitude: number;
  geoName: string;
  formattedName?: string;
  countryCode: string;
  countryName: string;
  flag: string;
  adminName1: string;
  adminName2?: string;
  geoDistance: number;
}
