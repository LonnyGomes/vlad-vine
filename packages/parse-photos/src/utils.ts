import path from "node:path";
import fs from "node:fs/promises";
import exifr from "exifr";
import sharp from "sharp";
import type { ImageResult, ImageDataResults } from "./models.js";
import { geocode, initGeocoder } from "./geocoder-online.js";
import {
  calcTotalCountries,
  calcAltitudes,
  calcTotalUSStates,
  genGeoJSONPoints,
} from "./shared.js";

async function extractMetadata(
  imagePath: string,
  id: number,
  homeCoords: readonly [lon: number, lat: number],
): Promise<ImageResult> {
  const metadata = await exifr.parse(imagePath);
  const image = path.basename(imagePath);
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

  const distance = haversineDistance(longitude, latitude, ...homeCoords);

  const output = JSON.stringify(metadata, null, 2);
  if (!DateTimeOriginal) {
    throw new Error(
      `Image ${image} is missing DateTimeOriginal EXIF data:\n ${output}`,
    );
  }

  const {
    name: geoName,
    countryCode,
    countryName,
    adminName1,
    adminName2,
    flag,
    distance: geoDistance,
  } = await geocode(longitude, latitude);

  // generate formatted name based on if US or not
  const formattedName =
    countryCode === "US"
      ? `${geoName}, ${adminName1}`
      : `${geoName}, ${countryName}`;

  // Generate thumbnail
  // Create thumbnails directory if it doesn't exist
  const basePath = path.dirname(imagePath);
  await fs.mkdir(basePath, { recursive: true });

  console.log(`Processing ${image}...`);
  const { thumbName: imageThumb } = await generateThumbnail(
    imagePath,
    basePath,
  );

  return {
    id,
    image,
    imageThumb,
    altitude: GPSAltitude ? metersToFeet(GPSAltitude) : undefined,
    timestamp: DateTimeOriginal,
    speed: GPSSpeed ? kmhToMph(GPSSpeed) : 0,
    make: Make,
    model: Model,
    latitude,
    longitude,
    geoName,
    formattedName,
    countryCode,
    countryName,
    flag,
    adminName1,
    adminName2,
    geoDistance,
    distance,
  };
}

/**
 * Uses the haversine formula (great-circle distance on a sphere)
 * to Calculate the great-circle ("as the crow flies") distance between two lat/lon pairs.
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

/**
 * Generate a 600x600 center-cropped thumbnail in WebP format
 * @param imagePath Path to the source image
 * @param outputDir Directory where the thumbnail should be saved
 * @returns Path to the generated thumbnail
 */
async function generateThumbnail(
  imagePath: string,
  outputDir: string,
): Promise<{ thumbPath: string; thumbName: string }> {
  const filename = path.basename(imagePath);
  const parsedName = path.parse(filename);
  const thumbName = `thumb-${parsedName.name}.webp`;
  const thumbPath = path.join(outputDir, thumbName);

  await sharp(imagePath)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(600, 600, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  return { thumbPath, thumbName };
}

export async function processImages(
  basePath: string,
  homeCoords: readonly [lon: number, lat: number],
): Promise<ImageDataResults> {
  await initGeocoder();
  const files = await fs.readdir(basePath);
  const extensions = [".jpg", ".jpeg", ".png", ".tiff", ".heic"];
  const imageFiles = files.filter((file) =>
    extensions.includes(path.extname(file).toLowerCase()),
  );

  // Process all images in parallel (without distance calculation)
  const promises = imageFiles.map(async (image, id) => {
    const imagePath = path.join(basePath, image);
    const metadata = await extractMetadata(imagePath, id, homeCoords);
    return metadata;
  });

  const results = await Promise.all(promises);

  // Sort by timestamp FIRST
  const images = results.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  // NOW calculate cumulative distance in chronological order (oldest to newest)
  let totalDistance = 0;
  let prevCoord: [number, number] = [...homeCoords];

  // Iterate in reverse (oldest to newest) to calculate distance traveled
  for (let i = images.length - 1; i >= 0; i--) {
    const image = images[i];
    if (image.longitude !== undefined && image.latitude !== undefined) {
      const distance = haversineDistance(
        prevCoord[0],
        prevCoord[1],
        image.longitude,
        image.latitude,
      );
      totalDistance += distance;
      prevCoord = [image.longitude, image.latitude];
    }
  }

  console.log(`Total Distance Traveled: ${Math.round(totalDistance)} miles`);

  const countryTotals = calcTotalCountries(results);
  const usTotals = calcTotalUSStates(results);
  const altitudeStats = calcAltitudes(results);
  const imagesPoints = genGeoJSONPoints(results);

  return {
    altitudeStats,
    countryTotals,
    images,
    usTotals,
    imagesPoints,
    distanceTraveled: totalDistance,
  };
}
