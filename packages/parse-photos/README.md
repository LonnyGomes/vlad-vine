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
Complete metadata for a single processed image:

```typescript
interface ImageResult {
  id: number;                 // Unique identifier
  image: string;              // Original filename
  imageThumb: string;         // Generated thumbnail filename (WebP)
  altitude?: number;          // Altitude in feet (optional)
  timestamp: Date;            // Photo timestamp
  speed: number;              // GPS speed in mph
  make: string;               // Camera manufacturer
  model: string;              // Camera model
  latitude: number;           // GPS latitude
  longitude: number;          // GPS longitude
  geoName: string;            // City/locality name
  formattedName: string;      // "City, State" (US) or "City, Country"
  countryCode: string;        // ISO country code (e.g., "US")
  countryName: string;        // Full country name
  flag: string;               // Emoji flag (e.g., "🇺🇸")
  adminName1: string;         // State/province name
  adminName2?: string;        // County/district (optional)
  geoDistance: number;        // Distance from geocoder (meters)
  distance: number;           // Distance from home in miles
}
```

### `ImageDataResults`
Complete processing results including all images and computed statistics:

```typescript
interface ImageDataResults {
  images: ImageResult[];              // All processed images
  countryTotals: CountryInfo[];       // Unique countries visited
  usTotals: string[];                 // Unique US states visited
  altitudeStats: AltitudeStats;       // Min, max, average altitude
  imagesPoints: FeatureCollection;    // GeoJSON point features
  distanceTraveled: number;           // Total miles traveled
}
```

### `CountryInfo`
Information about a visited country:

```typescript
interface CountryInfo {
  countryCode: string;  // ISO code (e.g., "FR")
  countryName: string;  // Full name (e.g., "France")
  flag: string;         // Emoji flag (e.g., "🇫🇷")
}
```

### `AltitudeStats`
Altitude statistics across all images:

```typescript
interface AltitudeStats {
  min: number;      // Minimum altitude in feet
  max: number;      // Maximum altitude in feet
  average: number;  // Average altitude in feet
}
```

### `Stats`
Frontend-friendly statistics interface:

```typescript
interface Stats {
  altitude: {
    min: number;
    max: number;
    average: number;
  };
  totals: {
    images: number;
    countries: number;
    us: number;
  };
  countries: CountryInfo[];
  states: string[];
  distanceTraveled: number;
}
```

## API Reference

### Shared Functions (Browser & Node.js)

#### `genGeoJSONPoints(images: ImageResult[]): FeatureCollection`
Converts an array of ImageResult objects into a GeoJSON FeatureCollection of Point features for map visualization.

**Returns**: GeoJSON FeatureCollection with point features containing:
- `geometry`: Point coordinates `[longitude, latitude]`
- `properties.title`: Formatted location name
- `properties.id`: Image ID
- `properties.image`: Image filename

```typescript
import { genGeoJSONPoints } from 'parse-photos/shared';

const points = genGeoJSONPoints(images);
// Use with Mapbox, Leaflet, etc.
```

#### `genGeoJSONRoute(images: ImageResult[]): Feature`
Generates a GeoJSON Feature with a LineString geometry representing the travel route connecting all photo locations in chronological order.

**Returns**: GeoJSON Feature with LineString geometry

```typescript
import { genGeoJSONRoute } from 'parse-photos/shared';

const route = genGeoJSONRoute(images);
// Display as a line on the map
```

#### `calcTotalCountries(images: ImageResult[]): CountryInfo[]`
Calculates the unique countries visited from image data.

```typescript
import { calcTotalCountries } from 'parse-photos/shared';

const countries = calcTotalCountries(images);
// [{ countryCode: 'US', countryName: 'United States', flag: '🇺🇸' }, ...]
```

#### `calcTotalUSStates(images: ImageResult[]): string[]`
Extracts unique US states visited (filters for `countryCode === 'US'`).

```typescript
import { calcTotalUSStates } from 'parse-photos/shared';

const states = calcTotalUSStates(images);
// ['California', 'New York', 'Texas', ...]
```

#### `calcAltitudes(images: ImageResult[]): AltitudeStats`
Computes altitude statistics (min, max, average) from images with altitude data.

```typescript
import { calcAltitudes } from 'parse-photos/shared';

const stats = calcAltitudes(images);
// { min: 0, max: 14505, average: 1234 }
```

### Data Functions (Node.js Only)

#### `loadImageData(): Promise<ImageDataResults>`
Asynchronously loads and parses `images.json`. Automatically revives Date objects from ISO strings.

**Note**: This uses Node.js filesystem APIs and won't work in browsers.

```typescript
import { loadImageData } from 'parse-photos';

const data = await loadImageData();
```

#### `saveImageData(data: ImageDataResults): Promise<void>`
Saves processed image data to `images.json` with pretty-printing.

```typescript
import { saveImageData } from 'parse-photos';

await saveImageData(results);
```

#### `getImagesJsonPath(): string`
Returns the absolute path to `images.json`.

```typescript
import { getImagesJsonPath } from 'parse-photos';

const path = getImagesJsonPath();
```

### Processing Functions (Node.js Only)

#### `processImages(basePath: string, homeCoords: readonly [lon, lat]): Promise<ImageDataResults>`
Main processing function that:
1. Reads all image files from `basePath`
2. Extracts EXIF metadata
3. Performs reverse geocoding via Google API
4. Generates WebP thumbnails
5. Calculates distances and statistics
6. Returns complete `ImageDataResults`

**Parameters**:
- `basePath`: Directory containing images
- `homeCoords`: `[longitude, latitude]` of home base for distance calculations

```typescript
import { processImages, saveImageData } from 'parse-photos';

const results = await processImages('./photos', [-77.01, 38.89]);
await saveImageData(results);
```

## Supported Image Formats

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- TIFF (`.tiff`)
- HEIC (`.heic`) - Apple iPhone photos

## Supported Image Formats

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- TIFF (`.tiff`)
- HEIC (`.heic`) - Apple iPhone photos

## Output

The package generates `images.json` in the package root containing:

```json
{
  "images": [...],           // Array of ImageResult objects
  "countryTotals": [...],    // Unique countries visited
  "usTotals": [...],         // Unique US states visited
  "altitudeStats": {...},    // Altitude min/max/average
  "imagesPoints": {...},     // GeoJSON FeatureCollection
  "distanceTraveled": 1234   // Total miles traveled
}
```

This JSON file is:
- Used by frontend applications via `imageDataResultsJSON` export
- Human-readable (pretty-printed with 2-space indentation)
- Version-controlled (commit it to track your journeys!)

## Technical Details

### Distance Calculations

The package uses the **Haversine formula** to calculate great-circle distances between GPS coordinates:

```
a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Where:
- φ = latitude in radians
- λ = longitude in radians
- R = Earth's radius (6,371 km)

Results are converted from kilometers to miles and accumulated as you move from photo to photo chronologically.

### Thumbnail Generation

Thumbnails are generated using Sharp:
- **Size**: 600×600 pixels
- **Format**: WebP (80% quality)
- **Cropping**: Center-crop to maintain aspect ratio
- **Rotation**: Auto-rotates based on EXIF orientation
- **Naming**: `thumb-{original-name}.webp`

### Geocoding

Uses Google Geocoding API to convert coordinates to human-readable locations:
- Extracts locality (city/town)
- Identifies administrative regions (state/province, county)
- Determines country with ISO code
- Adds emoji flags via `emoji-flags` package
- Smart formatting: "City, State" for US, "City, Country" elsewhere

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode (rebuilds on change)
npm run watch

# Run the photo processor
npm start

# Type checking only
npx tsc --noEmit
```

## Project Structure

```
parse-photos/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── utils.ts              # Core image processing
│   ├── geocoder-online.ts    # Google Geocoding API
│   ├── data.ts               # JSON file operations
│   ├── shared.ts             # Browser-friendly exports
│   ├── models.ts             # TypeScript interfaces
│   └── lib.ts                # Main package exports
├── images/                   # Place your photos here
├── images.json               # Generated output
└── package.json
```

## Integration Examples

### Angular Example

```typescript
// src/app/services/image-feed.ts
import { Injectable, signal } from '@angular/core';
import { imageDataResultsJSON, genGeoJSONPoints } from 'parse-photos/shared';
import type { ImageResult } from 'parse-photos/types';

@Injectable({ providedIn: 'root' })
export class ImageFeed {
  readonly images = signal<ImageResult[]>(imageDataResultsJSON.images);
  readonly mapPoints = signal(genGeoJSONPoints(imageDataResultsJSON.images));
}
```

### React Example

```typescript
// hooks/useImageData.ts
import { useMemo } from 'react';
import { imageDataResultsJSON } from 'parse-photos/shared';

export function useImageData() {
  const images = useMemo(() => imageDataResultsJSON.images, []);
  const countries = useMemo(() => imageDataResultsJSON.countryTotals, []);
  
  return { images, countries };
}
```

## Dependencies

### Runtime
- `exifr` - EXIF metadata extraction
- `sharp` - Image thumbnail generation (WebP)
- `emoji-flags` - Country emoji flags
- `geojson` - TypeScript types for GeoJSON

### Google Maps API
- Requires a valid API key in `.env`
- Uses Geocoding API for reverse geocoding
- See [pricing details](https://developers.google.com/maps/documentation/geocoding/usage-and-billing)

## License

ISC
