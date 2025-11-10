// Production environment - uses environment variables set in Netlify
// Set MAPBOX_ACCESS_TOKEN in Netlify's environment variables
// The MAPBOX_ACCESS_TOKEN constant is defined at build time via angular.json
declare const MAPBOX_ACCESS_TOKEN: string;

export const environment = {
  production: true,
  mapboxAccessToken: typeof MAPBOX_ACCESS_TOKEN !== 'undefined' ? MAPBOX_ACCESS_TOKEN : '',
};
