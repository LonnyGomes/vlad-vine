import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
  inject,
  computed,
  effect,
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

  currentImageIndex = computed(
    () => `${this.imgFeed.mapIndex() + 1} / ${this.imgFeed.images().length}`,
  );

  // Computed property to get the appropriate map style based on dark mode
  private getMapStyle() {
    return this.darkModeQuery.matches ? this.imgFeed.mbStyleDark : this.imgFeed.mbStyleLight;
  }

  constructor() {
    effect(() => {
      const index = this.imgFeed.mapIndex();
      const images = this.imgFeed.images();
      if (this.map && images[index]) {
        const currentImage = images[index];
        const { longitude, latitude } = currentImage;

        this.map.flyTo({
          center: [longitude, latitude],
          zoom: 15,
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
          this.addTerrain();
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
      center: [-77.0369, 38.9072], // Default center (Washington DC)
      zoom: 9,
      pitch: 45, // Start with angled perspective
      bearing: 0, // Initial rotation
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl());

    // Load images and add markers
    this.map.on('load', () => {
      this.addTerrain();
      this.addImageLayer();
    });
  }

  private addTerrain() {
    if (!this.map) return;

    // Add Mapbox Terrain DEM source
    this.map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });

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
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary-color').trim();

    // Determine stroke color based on dark mode
    const isDarkMode = this.darkModeQuery.matches;
    const strokeColor = isDarkMode ? '#CCCCCC' : '#FFFFFF';

    // Add a layer to render the points
    this.map!.addLayer({
      id: 'imagesLayer',
      type: 'circle',
      source: 'imagesSource',
      paint: {
        'circle-radius': 8,
        'circle-color': primaryColor, // Use CSS variable
        'circle-stroke-width': 3,
        'circle-stroke-color': strokeColor,
        'circle-opacity': 0.9, // Slightly transparent to see map underneath
        'circle-emissive-strength': 1,
      },
    });

    // Add popup on click
    this.map!.on('click', 'imagesLayer', (e) => {
      // const coordinates = (e.features![0].geometry as any).coordinates.slice();
      const id = e.features?.[0].properties?.['id'] || '';
      if (id) {
        const image = this.imgFeed.getImageById(Number(id));
        if (image) {
          this.openPopupForImage(image);
        }
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

  private openPopupForImage(image: ImageResult) {
    if (!this.map) return;

    // Remove existing popup if any
    if (this.currentPopup) {
      this.currentPopup.remove();
    }

    const { longitude, latitude, formattedName, geoName, image: imagePath } = image;
    const title = formattedName || geoName || '';

    if (longitude && latitude && imagePath) {
      this.currentPopup = new mapboxgl.Popup({
        maxWidth: '300px',
        className: 'map-image-popup',
        closeOnClick: false, // Keep popup open when navigating
      })
        .setLngLat([longitude, latitude])
        .setHTML(
          `<div class="popup-container">
            <img class="popup-image" src="${imagePath}" alt="${title}">
            <div class="popup-title">${title}</div>
          </div>`,
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
}
