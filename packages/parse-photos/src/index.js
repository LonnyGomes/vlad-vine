import exifr from "exifr";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import geocoder from "local-reverse-geocoder";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, "../images");

const initGeocoder = () => {
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
      (err) => {
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

const geocode = async (longitude, latitude) => {
  return new Promise((resolve, reject) => {
    const coords = [{ latitude, longitude }];
    geocoder.lookUp(coords, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      const [nearest] = res[0];
      const { name, countryCode, admin1Code, admin2Code, distance } = nearest;

      resolve({
        name,
        countryCode,
        adminName1: admin1Code ? admin1Code.name : "",
        adminName2: admin2Code ? admin2Code.name : "",
        distance,
      });
    });
  });
};

const extractMetadata = async (imagePath) => {
  const metadata = await exifr.parse(imagePath);

  const kmhToMph = (kmh) => {
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
    adminName1,
    adminName2,
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
    adminName1,
    adminName2,
    geoDistance,
  };
};

const processImages = async (basePath) => {
  await initGeocoder();
  const files = await fs.readdir(basePath);
  const extentions = [".jpg", ".jpeg", ".png", ".tiff", ".heic"];
  const images = files.filter((file) =>
    extentions.includes(path.extname(file).toLowerCase()),
  );
  const results = await images.map(async (image) => {
    const imagePath = path.join(basePath, image);
    const metadata = await extractMetadata(imagePath);
    return { image, ...metadata };
  });

  return Promise.all(results);
};

processImages(imagesDir)
  .then((results) => {
    console.log("Final Results:", results);
  })
  .catch((error) => {
    console.error("Error processing images:", error);
  });
