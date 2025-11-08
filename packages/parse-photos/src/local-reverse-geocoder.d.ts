declare module "local-reverse-geocoder" {
  export interface InitOptions {
    load?: {
      dumpDirectory?: string;
      admin1?: boolean;
      admin2?: boolean;
      admin2And4?: boolean;
      alternateNames?: boolean;
    };
  }

  export interface LookupCoordinates {
    latitude: number;
    longitude: number;
  }

  export interface AdminCode {
    name: string;
    asciiName: string;
    geoNameId: string;
  }

  export interface GeocodedResult {
    geoNameId: string;
    name: string;
    asciiName: string;
    alternateNames: string;
    latitude: string;
    longitude: string;
    featureClass: string;
    featureCode: string;
    countryCode: string;
    cc2: string;
    admin1Code: AdminCode;
    admin2Code: AdminCode;
    admin3Code: string;
    admin4Code: string;
    population: string;
    elevation: string;
    dem: string;
    timezone: string;
    modificationDate: string;
    distance: number;
  }

  export function init(
    options: InitOptions,
    callback: (err: Error | null) => void,
  ): void;

  export function lookUp(
    coordinates: LookupCoordinates[],
    callback: (err: Error | null, res: GeocodedResult[][]) => void,
  ): void;

  const geocoder: {
    init: typeof init;
    lookUp: typeof lookUp;
  };

  export default geocoder;
}
