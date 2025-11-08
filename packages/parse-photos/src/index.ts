import exifr from "exifr";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import geocoder from "local-reverse-geocoder";
import emojiFlags from "emoji-flags";

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
  altitude: number;
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
  adminName2: string;
  geoDistance: number;
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

const extractMetadata = async (imagePath: string): Promise<ImageMetadata> => {
  const metadata = await exifr.parse(imagePath);

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
    altitude: GPSAltitude,
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

processImages(imagesDir)
  .then((results) => {
    const totalCountries = calcTotalCountries(results);
    const totalStates = calcTotalUSStates(results);
    console.log("Final Results:", totalCountries, totalStates);
    return fs.writeFile(outputFilename, JSON.stringify(results, null, 2));
  })
  .catch((error) => {
    console.error("Error processing images:", error);
  });
