import exifr from "exifr";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import geocoder from "local-reverse-geocoder";
import emojiFlags from "emoji-flags";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, "../images");
const outputFilename = path.resolve(__dirname, "../images.json");

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

const processImages = async (basePath) => {
  await initGeocoder();
  const files = await fs.readdir(basePath);
  const extentions = [".jpg", ".jpeg", ".png", ".tiff", ".heic"];
  const images = files.filter((file) =>
    extentions.includes(path.extname(file).toLowerCase()),
  );
  const results = await images
    .map(async (image) => {
      const imagePath = path.join(basePath, image);
      const metadata = await extractMetadata(imagePath);
      return { image, ...metadata };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return Promise.all(results);
};

processImages(imagesDir)
  .then((results) => {
    console.log("Final Results:", results);
    return fs.writeFile(outputFilename, JSON.stringify(results, null, 2));
  })
  .catch((error) => {
    console.error("Error processing images:", error);
  });
