# parse-photos

A TypeScript package for parsing and processing GPS-tagged travel photos, extracting EXIF metadata, and performing reverse geocoding to create rich, interactive travel visualizations.

## Features

- **EXIF Metadata Extraction**: Extract GPS coordinates, altitude, timestamps, speed, and camera information from photos
- **Reverse Geocoding**: Convert coordinates to location names using Google Geocoding API with country, state/region, and emoji flags
- **Thumbnail Generation**: Auto-generate optimized 600x600 WebP thumbnails with center cropping
- **Distance Calculation**: Calculate total miles traveled using the Haversine formula (great-circle distance)
- **GeoJSON Export**: Generate GeoJSON FeatureCollections for map visualizations (points and route lines)
- **Statistics Aggregation**: Compute altitude stats, unique countries visited, and US states visited
- **Browser-Friendly Exports**: Static JSON data accessible in frontend applications without Node.js filesystem APIs
- **Full TypeScript Support**: Comprehensive type definitions for all data structures

## Prerequisites

### Google Maps API Key

This package uses the Google Geocoding API for reverse geocoding. You need to:

1. Create a Google Cloud project
2. Enable the Geocoding API
3. Generate an API key following [these instructions](https://developers.google.com/maps/documentation/routes/get-api-key)

Once you have your API key, create a `.env` file in `packages/parse-photos`:

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Usage

### Processing Photos (CLI)

1. Place your GPS-tagged photos in the `images/` directory
2. (Optional) Update `homeCoordinates` in `src/index.ts` to set your home base location
3. Build and run:

```bash
npm run build
npm start
```

This will:
- Extract EXIF data from all images
- Perform reverse geocoding for each location
- Generate optimized WebP thumbnails
- Calculate statistics (altitude, countries, states, total distance)
- Generate GeoJSON data for mapping
- Save all results to `images.json`

### Watch Mode (Development)

```bash
npm run watch
```

Automatically rebuilds TypeScript when files change.

### As a Library in Your Application

The package provides browser-friendly static exports that work in frontend frameworks like Angular, React, or Vue.

#### Import Processed Data (Recommended for Frontend)

```typescript
// Import the pre-processed JSON data and utility functions
import { 
  imageDataResultsJSON,  // Static JSON data
  genGeoJSONPoints,      // Generate GeoJSON point features
  genGeoJSONRoute        // Generate GeoJSON route line
} from 'parse-photos/shared';

// Import types
import type { ImageResult, Stats } from 'parse-photos/types';

// Use the data directly (no async loading needed)
const images = imageDataResultsJSON.images;
const countries = imageDataResultsJSON.countryTotals;
const altitude = imageDataResultsJSON.altitudeStats;

// Generate GeoJSON for map visualization
const points = genGeoJSONPoints(images);
const route = genGeoJSONRoute(images);
```

#### Import Types Only

```typescript
import type { 
  ImageResult, 
  ImageDataResults, 
  CountryInfo,
  AltitudeStats,
  Stats 
} from 'parse-photos/types';
```

#### Import Node.js Functions (Server-Side Only)

```typescript
import { loadImageData, saveImageData, processImages } from 'parse-photos';

// Load processed data (async, reads from filesystem)
const data = await loadImageData();

// Process new images
const results = await processImages('./images', [-77.01, 38.89]);
await saveImageData(results);
```

## Exported Types

### `ImageResult`
Complete metadata for a single image including:
- `image`: filename
- `altitude`: altitude in feet
- `timestamp`: Date object
- `speed`: speed in mph
- `make`, `model`: camera info
- `latitude`, `longitude`: GPS coordinates
- `geoName`, `countryCode`, `countryName`, `flag`: location info
- `adminName1`, `adminName2`: administrative regions
- `distance`: distance from home in miles
- `geoDistance`: geocoding distance

### `ImageDataResults`
Complete results including:
- `images`: array of `ImageResult`
- `countryTotals`: array of visited countries
- `usTotals`: array of visited US states
- `altitudeStats`: min, max, and average altitudes

### `CountryInfo`
Country information:
- `countryCode`: ISO country code
- `countryName`: full country name
- `flag`: emoji flag

### `AltitudeStats`
Altitude statistics:
- `min`: minimum altitude
- `max`: maximum altitude
- `average`: average altitude

## API

### Data Functions

#### `loadImageData(): Promise<ImageDataResults>`
Loads and parses the processed image data from `images.json`. Automatically revives Date objects.

#### `saveImageData(data: ImageDataResults): Promise<void>`
Saves image data to `images.json`.

#### `getImagesJsonPath(): string`
Returns the absolute path to `images.json`.

### Utility Functions

#### `processImages(basePath: string, homeCoords: readonly [lon, lat]): Promise<ImageDataResults>`
Processes all images in a directory and returns complete results.

#### `calcTotalCountries(images: ImageResult[]): CountryInfo[]`
Calculates unique countries from image data.

#### `calcTotalUSStates(images: ImageResult[]): string[]`
Calculates unique US states from image data.

#### `calcAltitudes(images: ImageResult[]): AltitudeStats`
Calculates altitude statistics from image data.

## Output

The package generates `images.json` containing all processed image data in the `ImageDataResults` format.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Watch for changes
npm run watch

# Build TypeScript
npm run build

# Type check
npx tsc --noEmit
```

## License

ISC
