/**
 * Online reverse geocoder using Google Geocoding API
 * This is a drop-in replacement for the local geocoder
 * Provides highly accurate results and better rate limits
 *
 * Setup:
 * 1. Get a Google Maps API key from https://console.cloud.google.com/
 * 2. Enable the Geocoding API
 * 3. Set environment variable: GOOGLE_MAPS_API_KEY=your_api_key
 *
 * Usage: Simply replace the import in utils.ts:
 * From: import { geocode, initGeocoder } from "./geocoder.js";
 * To:   import { geocode, initGeocoder } from "./geocoder-online.js";
 */

import "dotenv/config";

import emojiFlags from "emoji-flags";

export interface GeocodeResult {
  name: string;
  countryCode: string;
  countryName: string;
  adminName1: string;
  adminName2?: string;
  flag: string;
  distance: number;
}

interface GoogleGeocodingResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
  error_message?: string;
}

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Initialize the online geocoder
 * Validates that API key is set
 */
export function initGeocoder(): Promise<void> {
  if (!API_KEY) {
    console.warn("WARNING: GOOGLE_MAPS_API_KEY environment variable not set!");
    console.warn("Please set it to use Google Geocoding API.");
    console.warn("Geocoding will fail without a valid API key.");
  } else {
    console.log("Online geocoder ready (using Google Geocoding API)");
  }
  return Promise.resolve();
}

/**
 * Reverse geocode coordinates using Google Geocoding API
 * @param longitude Longitude in decimal degrees
 * @param latitude Latitude in decimal degrees
 * @returns Geocoded location information
 */
export async function geocode(
  longitude: number,
  latitude: number,
): Promise<GeocodeResult> {
  if (!API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY environment variable is not set");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as GoogleGeocodingResponse;

    if (data.status !== "OK") {
      if (data.status === "ZERO_RESULTS") {
        throw new Error("No results found for these coordinates");
      }
      throw new Error(
        `Google Geocoding API error: ${data.status}${data.error_message ? " - " + data.error_message : ""}`,
      );
    }

    if (!data.results || data.results.length === 0) {
      throw new Error("No results returned from Google Geocoding API");
    }

    const result = data.results[0];
    const components = result.address_components;

    console.log("results", JSON.stringify(result.address_components, null, 2));
    // Extract components by type
    const getComponent = (types: string[]): string => {
      const component = components.find((c) =>
        types.some((type) => c.types.includes(type)),
      );
      return component?.long_name || "";
    };

    const getShortComponent = (types: string[]): string => {
      const component = components.find((c) =>
        types.some((type) => c.types.includes(type)),
      );
      return component?.short_name || "";
    };

    // Extract location information
    const locality = getComponent(["locality"]);
    const premise = getComponent(["premise"]);
    const sublocality = getComponent(["sublocality", "sublocality_level_1"]);
    const administrativeArea2 = getComponent(["administrative_area_level_2"]);
    const administrativeArea1 = getComponent(["administrative_area_level_1"]);
    const country = getComponent(["country"]);
    const countryCode = getShortComponent(["country"]).toUpperCase();

    // Determine the best name (city/town)
    const name =
      premise || locality || sublocality || administrativeArea2 || "Unknown";

    // Get emoji flag and full country name
    const flagData = emojiFlags.countryCode(countryCode);
    const flag = flagData?.emoji || "🏳️";
    const countryName = flagData?.name || country || "Unknown";

    // Admin level 1 (state/province)
    const adminName1 = administrativeArea1;

    // Admin level 2 (county)
    const adminName2 = administrativeArea2 || undefined;

    // Distance is 0 for online geocoding as it returns exact location
    const distance = 0;

    return {
      name,
      countryCode,
      countryName,
      adminName1,
      adminName2,
      flag,
      distance,
    };
  } catch (error) {
    console.error(`Geocoding failed for ${latitude}, ${longitude}:`, error);

    // Fallback to basic info if geocoding fails
    return {
      name: "Unknown",
      countryCode: "XX",
      countryName: "Unknown",
      adminName1: "",
      adminName2: undefined,
      flag: "🏳️",
      distance: 0,
    };
  }
}

/**
 * Batch geocode multiple coordinates
 * Google API has generous rate limits, so this is much faster than Nominatim
 * @param coordinates Array of [longitude, latitude] pairs
 * @returns Array of geocoded results in the same order
 */
export async function geocodeBatch(
  coordinates: Array<{ longitude: number; latitude: number }>,
): Promise<GeocodeResult[]> {
  console.log(`Batch geocoding ${coordinates.length} locations...`);
  const results: GeocodeResult[] = [];

  for (let i = 0; i < coordinates.length; i++) {
    const { longitude, latitude } = coordinates[i];
    console.log(
      `Geocoding ${i + 1}/${coordinates.length}: ${latitude}, ${longitude}`,
    );

    const result = await geocode(longitude, latitude);
    results.push(result);

    // Small delay to be respectful to the API (though Google's limits are generous)
    if (i < coordinates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
    }
  }

  console.log("Batch geocoding complete");
  return results;
}
