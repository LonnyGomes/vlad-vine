import { Component, OnInit, OnDestroy, ElementRef, viewChild, inject } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment.local';
import { ImageFeed } from '../services/image-feed';

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

  ngOnInit() {
    mapboxgl.accessToken = environment.mapboxAccessToken;

    this.map = new mapboxgl.Map({
      container: this.mapContainer().nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-77.0369, 38.9072], // Default center (Washington DC)
      zoom: 9,
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl());
    //
    // Load images and add markers
    const imageGeoJSON = this.imgFeed.imagePoints();
    this.map.on('load', () => {
      this.map!.addSource('imagesSource', {
        type: 'geojson',
        data: imageGeoJSON,
      });

      // Add a layer to render the points
      this.map!.addLayer({
        id: 'imagesLayer',
        type: 'circle',
        source: 'imagesSource',
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF5722',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // Add popup on click
      this.map!.on('click', 'imagesLayer', (e) => {
        const coordinates = (e.features![0].geometry as any).coordinates.slice();
        const title = e.features?.[0].properties?.['title'] || '';
        if (coordinates && title) {
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${title}</strong>`)
            .addTo(this.map!);
        }
      });

      // Change cursor on hover
      this.map!.on('mouseenter', 'imagesLayer', () => {
        this.map!.getCanvas().style.cursor = 'pointer';
      });
      this.map!.on('mouseleave', 'imagesLayer', () => {
        this.map!.getCanvas().style.cursor = '';
      });
    });
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
