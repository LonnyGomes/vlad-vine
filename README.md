# VladVine 🌍

> A travel photography visualization platform showcasing journeys across the globe

**VladVine**  is a monorepo project that tracks alustrius travels of Bulbutin, interactive visualizations. 

## 🎯 Project Vision

This monorepo is designed to implement the same travel visualization application across multiple modern frontend frameworks, starting with Angular. The goal is to explore different architectural approaches, performance characteristics, and developer experiences while maintaining feature parity. The application includes a dynamic range of interactions, including map visualization, charting, and image processing.

### Implemented Frameworks

- ✅ **Angular 20** - [`apps/bulbutin-ng`](./apps/bulbutin-ng) - *Current implementation*

### Planned Frameworks

- ⏳ **Vue** - Coming soon
- ⏳ **React** - Coming soon

## 🌟 Features

### Photo Processing & Metadata Extraction
- **EXIF Data Parsing**: Extracts GPS coordinates, altitude, timestamps, and camera information
- **Reverse Geocoding**: Converts coordinates to human-readable locations with country/state data
- **Smart Thumbnails**: Auto-generates optimized 600x600 WebP thumbnails
- **Distance Tracking**: Calculates total miles traveled using the Haversine formula
- **Country & State Analytics**: Automatic aggregation of visited locations

### Interactive Visualizations
- **3D Map View**: Mapbox GL JS with terrain, 3D perspective, and dynamic camera angles
  - Dashed route lines connecting photo locations
  - Interactive photo markers with popups
  - Dark mode support with custom map styles
- **Photo Feed**: Neumorphic-styled card grid with lazy loading
- **Statistics Dashboard**: 
  - Country distribution bar chart with emoji flags
  - US state distribution chart
  - Camera model donut chart with mobile table fallback
  - Altitude scatter chart (elevation over time)

### Progressive Web App (PWA)
- **iOS-Optimized**: Safe area insets, bounce scroll prevention, portrait orientation lock
- **Native-like UX**: Touch-friendly interactions, smooth animations
- **Neumorphic Design**: Subtle depth effects with light/dark mode support
- **Responsive**: Adaptive layouts for mobile, tablet, and desktop

## 📁 Repository Structure

```
bulbutin/
├── apps/
│   └── bulbutin-ng/          # Angular 20 implementation (VladVine)
│       ├── src/
│       │   ├── app/
│       │   │   ├── home/            # Landing page
│       │   │   ├── map/             # 3D Mapbox visualization
│       │   │   ├── image-card-feed/ # Photo grid view
│       │   │   ├── stats/           # Analytics dashboard
│       │   │   ├── services/        # Image data service
│       │   │   └── ...
│       │   ├── assets/              # Static images & data
│       │   └── styles.scss          # Global styles
│       └── public/                  # Static assets
│
└── packages/
    └── parse-photos/         # Shared photo processing library
        ├── src/
        │   ├── utils.ts      # Core EXIF extraction & processing
        │   ├── geocoder.ts   # Offline reverse geocoding
        │   ├── shared.ts     # Browser-friendly exports
        │   └── models.ts     # TypeScript interfaces
        └── images/           # Source photos (not in git)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Mapbox Access Token** - [Sign up for free](https://account.mapbox.com/auth/signup/)

### Quick Start (Angular Implementation)

1. **Clone the repository**
   ```bash
   git clone https://github.com/LonnyGomes/bulbutin.git
   cd bulbutin/apps/bulbutin-ng
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment** (first time only)
   ```bash
   npm run setup
   ```
   Follow the prompts to configure your Mapbox access token.

4. **Start the development server**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200/`

### Processing Your Own Photos

The `parse-photos` package extracts metadata from your travel photos:

```bash
cd packages/parse-photos
npm install
```

#### Google Routes API

The Google Routes API is used to determine the geo coord location. You must first generate an API key by following [these instructions](https://developers.google.com/maps/documentation/routes/get-api-key). Once your key is generated, create a `.env` file in in `packages/parse-photos`. The `.env` file should be structured as follows:

```env
GOOGLE_MAPS_API_KEY=<API_KEY>
```

Where the `<API_KEY>` placeholder is replaced with the key 

- Place your photos in packages/parse-photos/images/
- Update homeCoordinates in src/index.ts (optional)

```
npm run build
```

This generates `images.json` with processed metadata and GeoJSON data.

## 🛠️ Technology Stack

### Frontend (Angular)
- **Angular 20**: Standalone components, signals, computed properties
- **Mapbox GL JS 3.x**: 3D terrain visualization with custom styling
- **Highcharts 12.x**: Data visualization charts
- **TypeScript**: Strict mode with full type safety
- **SCSS**: Custom properties for theming

### Data Processing
- **exifr**: EXIF metadata extraction
- **sharp**: Image thumbnail generation (WebP)
- **local-reverse-geocoder**: Offline geocoding
- **emoji-flags**: Country flag emojis

### Build & Deploy
- **Angular CLI**: Development server and build optimization
- **Netlify**: Serverless deployment with environment variables

## 📊 Data Flow

```
Photo Collection
    ↓
EXIF Extraction (GPS, altitude, timestamp, camera)
    ↓
Reverse Geocoding (location names, flags)
    ↓
GeoJSON Generation (points & routes)
    ↓
Statistics Calculation (distances, aggregations)
    ↓
images.json (static data bundle)
    ↓
Angular App (visualization layer)
```

## 🎨 Design Philosophy

- **Neumorphic UI**: Soft shadows and highlights create subtle depth without harsh borders
- **Mobile-First**: Touch-optimized with iOS safe areas and orientation locking
- **Dark Mode**: System preference detection with custom Mapbox styles
- **Data-Driven**: All visualizations dynamically generated from photo metadata

## 📝 Development Guidelines

See individual framework implementation READMEs for specific guidelines:
- [Angular Guidelines](./apps/bulbutin-ng/AGENTS.md)

## 🤝 Contributing

Contributions are welcome! Whether you want to:
- Add a photo
- Add a new framework implementation
- Improve existing visualizations
- Fix bugs or enhance features
- Improve documentation

Please open an issue or pull request.

## 📄 License

This project is licensed under the MIT License - see individual package LICENSE files for details.

---

**Built with ❤️ by [Lonny Gomes](https://github.com/LonnyGomes)**

*Follow Bulbutin's adventures at [vladvine.lonnygomes.com](https://vladvine.lonnygomes.com)*
