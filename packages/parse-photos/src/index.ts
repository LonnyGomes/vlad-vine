import exifr from "exifr";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import geocoder from "local-reverse-geocoder";
import emojiFlags from "emoji-flags";

const homeCoordinates = [-77.01011939679307, 38.8898568078552] as const;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, "../images");
const outputFilename = path.resolve(__dirname, "../images.json");

interface GeocodeResult {
  name: string;
  countryCode: string;
  countryName: string;
  adminName1: string;
  adminName2?: string;
  flag: string;
  distance: number;
}

interface ImageMetadata {
  altitude?: number;
  timestamp: Date;
  speed: number;
  make: string;
  model: string;
  latitude: number;
  longitude: number;
  geoName: string;
  countryCode: string;
  countryName: string;
  flag: string;
  adminName1: string;
  adminName2?: string;
  geoDistance: number;
  distance: number;
}

interface ImageResult extends ImageMetadata {
  image: string;
}

interface CountryInfo {
  countryCode: string;
  countryName: string;
  flag: string;
}

const initGeocoder = (): Promise<void> => {
  console.log("Initializing geocoder...");
  return new Promise((resolve, reject) => {
    geocoder.init(
      {
        load: {
          dumpDirectory: path.resolve(__dirname, "..", "geocoder-dump"),
          admin1: true,
          admin2: true,
          admin2And4: false,
          alternateNames: false,
        },
      },
      (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }
        console.log("Geocoder initialized");
        resolve();
      },
    );
  });
};

const geocode = async (
  longitude: number,
  latitude: number,
): Promise<GeocodeResult> => {
  return new Promise((resolve, reject) => {
    const coords = [{ latitude, longitude }];
    geocoder.lookUp(coords, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      // retreive reverse geolookup
      const [nearest] = res[0];
      const { name, countryCode, admin1Code, admin2Code, distance } = nearest;

      const { emoji: flag, name: countryName } =
        emojiFlags.countryCode(countryCode);

      resolve({
        name,
        countryCode,
        countryName,
        adminName1: admin1Code ? admin1Code.name : "",
        adminName2: admin2Code ? admin2Code.name : "",
        flag,
        distance,
      });
    });
  });
};

/**
 * Uses the haversine formula (great-circle distance on a sphere)
 * to Calculate the great-circle (“as the crow flies”) distance between two lat/lon pairs.
 * a = sin²(Δφ/2) + cos φ1 * cos φ2 * sin²(Δλ/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 *
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @returns Distance in mile
 */
function haversineDistance(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const kmsToMiles = (km: number) => Math.round(km * 0.621371);

  const R = 6371; // Earth radius in km
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c;
  return kmsToMiles(d);
}

const extractMetadata = async (imagePath: string): Promise<ImageMetadata> => {
  const metadata = await exifr.parse(imagePath);
  const metersToFeet = (meters: number): number => Math.round(meters * 3.28084);
  const kmhToMph = (kmh: number): number => {
    return kmh * 0.621371;
  };

  const {
    GPSSpeed,
    GPSAltitude,
    latitude,
    longitude,
    DateTimeOriginal,
    Make,
    Model,
  } = metadata;

  const distance = haversineDistance(longitude, latitude, ...homeCoordinates);

  const {
    name: geoName,
    countryCode,
    countryName,
    adminName1,
    adminName2,
    flag,
    distance: geoDistance,
  } = await geocode(longitude, latitude);

  return {
    altitude: GPSAltitude ? metersToFeet(GPSAltitude) : undefined,
    timestamp: DateTimeOriginal,
    speed: GPSSpeed ? kmhToMph(GPSSpeed) : 0,
    make: Make,
    model: Model,
    latitude,
    longitude,
    geoName,
    countryCode,
    countryName,
    flag,
    adminName1,
    adminName2,
    geoDistance,
    distance,
  };
};

const processImages = async (basePath: string): Promise<ImageResult[]> => {
  await initGeocoder();
  const files = await fs.readdir(basePath);
  const extentions = [".jpg", ".jpeg", ".png", ".tiff", ".heic"];
  const images = files.filter((file) =>
    extentions.includes(path.extname(file).toLowerCase()),
  );
  const promises = images.map(async (image) => {
    const imagePath = path.join(basePath, image);
    const metadata = await extractMetadata(imagePath);
    return { image, ...metadata };
  });

  const results = await Promise.all(promises);
  return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const calcTotalCountries = (images: ImageResult[]): CountryInfo[] => {
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
};

const calcTotalUSStates = (images: ImageResult[]): string[] => {
  const totalStates = images
    .filter((curImage) => curImage.countryCode === "US")
    .map((curImage) => curImage.adminName1);

  return [...new Set(totalStates)];
};

const calcAltitudes = (images: ImageResult[]) => {
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
};

processImages(imagesDir)
  .then((results) => {
    const totalCountries = calcTotalCountries(results);
    const totalStates = calcTotalUSStates(results);
    // Example usage:
    // const distKm = haversineDistance(
    //   -111.68191068929804,
    //   33.4663351671049,
    //   ...homeCoordinates,
    // );
    // console.log(`Distance: ${distKm.toFixed(2)} miles`);

    const altitudeStats = calcAltitudes(results);
    console.log("Altitude Stats:", altitudeStats);
    console.log("Final Results:", totalCountries, totalStates);
    return fs.writeFile(outputFilename, JSON.stringify(results, null, 2));
  })
  .catch((error) => {
    console.error("Error processing images:", error);
  });
