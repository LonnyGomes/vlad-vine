import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
  inject,
  computed,
  effect,
  signal,
} from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment';
import { ImageFeed } from '../services/image-feed';
import { ImageResult } from 'parse-photos';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class Map implements OnInit, OnDestroy {
  private imgFeed = inject(ImageFeed);
  private mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private map?: mapboxgl.Map;
  private currentPopup?: mapboxgl.Popup;
  private darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  terrainEnabled = signal<boolean>(false);
  terrainButtonTitle = computed(() => (this.terrainEnabled() ? '3D' : '2D'));

  currentImageIndex = computed(
    () => `${this.imgFeed.mapIndex() + 1} / ${this.imgFeed.images().length}`,
  );
  imageIsSelected = computed(() => this.imgFeed.mapIndex() !== -1);

  // Computed property to get the appropriate map style based on dark mode
  private getMapStyle() {
    return this.darkModeQuery.matches ? this.imgFeed.mbStyleDark : this.imgFeed.mbStyleLight;
  }

  constructor() {
    effect(() => {
      const index = this.imgFeed.mapIndex();
      const images = this.imgFeed.images();

      const isDarkMode = this.darkModeQuery.matches;
      const strokeColor = isDarkMode ? '#CCCCCC' : '#FFFFFF';

      // Update selected circle color
      if (this.map && this.map.getLayer('imagesLayer')) {
        const selectedImageId = images[index]?.id ?? -1;
        const primaryColor = this.getCssVariableValue('--primary-color');
        const selectedColor = this.getCssVariableValue('--primary-color-dark');

        this.map.setPaintProperty('imagesLayer', 'circle-stroke-color', [
          'case',
          ['==', ['get', 'id'], selectedImageId],
          selectedColor,
          strokeColor,
        ]);

        this.map.setPaintProperty('imagesLayer', 'circle-color', [
          'case',
          ['==', ['get', 'id'], selectedImageId],
          strokeColor,
          primaryColor,
        ]);
      }

      // we don't want to zoom anywhere, -1 means no image selected
      if (index == -1) {
        return;
      }

      if (this.map && images[index]) {
        const currentImage = images[index];
        const { longitude, latitude } = currentImage;

        this.map.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          pitch: 60, // Angle the camera (0-85 degrees)
          bearing: 0, // Rotation (0-360 degrees)
          essential: true,
          // duration: 2500, // Smooth 2.5 second animation
        });

        // Open popup for the current image
        this.openPopupForImage(currentImage);
      }
    });

    // Listen for dark mode changes and update map style
    this.darkModeQuery.addEventListener('change', (e) => {
      if (this.map) {
        const newStyle = e.matches ? this.imgFeed.mbStyleDark : this.imgFeed.mbStyleLight;
        this.map.setStyle(newStyle);

        // Re-add terrain and image layer after style change
        this.map.once('styledata', () => {
          if (this.terrainEnabled()) {
            this.addTerrain();
          }
          this.addImageRoute();
          this.addImageLayer();
        });
      }
    });
  }

  ngOnInit() {
    mapboxgl.accessToken = environment.mapboxAccessToken;

    this.map = new mapboxgl.Map({
      container: this.mapContainer().nativeElement,
      style: this.getMapStyle(), // Use style based on dark mode
      center: [-50, 0],
      zoom: 0,
      pitch: 0, // Start with angled perspective
      bearing: 0, // Initial rotation
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl());

    // Load images and add markers
    this.map.on('load', () => {
      // Force map to resize to ensure it fits the container properly
      // setTimeout(() => {
      //   this.map?.resize();
      // }, 100);

      if (!this.imageIsSelected()) {
        this.map!.zoomTo(1);
        this.map!.panTo([-50, 30]); // prefer western hemisphere start
      }

      // Add Mapbox Terrain DEM source
      if (this.map!.getSource('mapbox-dem')) {
        this.map!.removeSource('mapbox-dem');
      }

      this.map?.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });

      if (this.terrainEnabled()) {
        this.addTerrain();
      }
      this.addImageRoute();
      this.addImageLayer();
    });
  }

  getCssVariableValue(varName: string): string {
    const rootStyles = getComputedStyle(document.documentElement);
    return rootStyles.getPropertyValue(varName).trim();
  }

  private addTerrain() {
    if (!this.map) return;

    // Set the terrain on the map with exaggeration for better visibility
    this.map.setTerrain({
      source: 'mapbox-dem',
      exaggeration: 1.5, // Makes elevation changes more visible (1.0 = realistic)
    });

    // Add sky layer with better lighting for terrain
    // this.map.addLayer({
    //   id: 'sky',
    //   type: 'sky',
    //   paint: {
    //     'sky-type': 'atmosphere',
    //     'sky-atmosphere-sun': [0.0, 90.0], // Sun directly overhead for even lighting
    //     'sky-atmosphere-sun-intensity': 10, // Reduced intensity for softer shadows
    //   },
    // });
  }

  private addImageLayer() {
    const imageGeoJSON = this.imgFeed.imagePoints();

    // Check if source already exists and remove it
    if (this.map!.getSource('imagesSource')) {
      this.map!.removeLayer('imagesLayer');
      this.map!.removeSource('imagesSource');
    }

    this.map!.addSource('imagesSource', {
      type: 'geojson',
      data: imageGeoJSON,
    });

    // Get CSS variable values from the document
    const primaryColor = this.getCssVariableValue('--primary-color');
    const selectedColor = this.getCssVariableValue('--primary-color-dark') || '#1e40af'; // Darker blue fallback

    // Determine stroke color based on dark mode
    const isDarkMode = this.darkModeQuery.matches;
    const strokeColor = isDarkMode ? '#CCCCCC' : '#FFFFFF';

    // Get selected image ID (use -1 if no selection)
    const selectedImageId = this.imgFeed.images()[this.imgFeed.mapIndex()]?.id ?? -1;

    // Add a layer to render the points
    this.map!.addLayer({
      id: 'imagesLayer',
      type: 'circle',
      source: 'imagesSource',
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'case',
          ['==', ['get', 'id'], selectedImageId],
          selectedColor,
          primaryColor,
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': strokeColor,
        'circle-opacity': 0.9, // Slightly transparent to see map underneath
        'circle-emissive-strength': 1,
      },
    });

    // Add popup on click
    this.map!.on('click', 'imagesLayer', (e) => {
      const id = e.features?.[0].properties?.['id'] || '';
      if (id) {
        this.imgFeed.setMapIndexByImageId(Number(id));
      }
    });

    // Change cursor on hover
    this.map!.on('mouseenter', 'imagesLayer', () => {
      this.map!.getCanvas().style.cursor = 'pointer';
    });
    this.map!.on('mouseleave', 'imagesLayer', () => {
      this.map!.getCanvas().style.cursor = '';
    });
  }

  private addImageRoute() {
    const primaryColor = this.getCssVariableValue('--primary-color');
    const routeGeoJSON = this.imgFeed.imageRoute();

    // Check if source already exists and remove it
    if (this.map!.getSource('imageRouteSource')) {
      this.map!.removeLayer('imageRouteLayer');
      this.map!.removeSource('imageRouteSource');
    }

    this.map!.addSource('imageRouteSource', {
      type: 'geojson',
      data: routeGeoJSON,
    });

    // Add a layer to render the route line
    this.map!.addLayer({
      id: 'imageRouteLayer',
      type: 'line',
      source: 'imageRouteSource',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': primaryColor,
        'line-width': 4,
        'line-opacity': 0.8,
        'line-emissive-strength': 1,
        'line-dasharray': [2, 2],
      },
    });
  }

  private openPopupForImage(image: ImageResult) {
    if (!this.map) return;

    // Remove existing popup if any
    if (this.currentPopup) {
      this.currentPopup.remove();
    }

    const { longitude, latitude, formattedName, geoName, imageThumb, altitude, timestamp } = image;
    const title = formattedName || geoName || '';

    // Format date as DD Mmm YYYY
    const date = timestamp ? new Date(timestamp) : null;
    const formattedDate = date
      ? date.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '';

    // Format altitude if it exists
    const altitudeText = altitude ? `${Math.round(altitude).toLocaleString()} ft` : '';

    if (longitude && latitude && imageThumb) {
      this.currentPopup = new mapboxgl.Popup({
        maxWidth: '300px',
        className: 'map-image-popup',
        closeOnClick: false, // Keep popup open when navigating
      })
        .setLngLat([longitude, latitude])
        .setHTML(
          `<div class="popup-container">
            <img class="popup-image" src="${imageThumb}" alt="${title}">
            <div class="popup-title">${title}</div>
            <div class="popup-metadata">
              ${formattedDate ? `<div class="popup-date">${formattedDate}</div>` : ''}
              ${altitudeText ? `<div class="popup-altitude">${altitudeText}</div>` : ''}
            </div>
          </div>`
        )
        .addTo(this.map);
    }
  }

  next() {
    this.imgFeed.nextMapIndex();
  }

  prev() {
    this.imgFeed.prevMapIndex();
  }

  ngOnDestroy() {
    // Clean up event listener
    this.darkModeQuery.removeEventListener('change', () => {});
    this.map?.remove();
  }

  toggleTerrain() {
    if (!this.map) return;

    const currentTerrain = this.map.getTerrain();
    if (this.terrainEnabled()) {
      this.map.setTerrain(null);
      this.terrainEnabled.set(false);
    } else {
      if (currentTerrain) {
        this.map.setTerrain(null);
      }
      this.terrainEnabled.set(true);
    }

    if (currentTerrain) {
      this.map.setTerrain(null);
    } else {
      this.addTerrain();
    }
  }
}
