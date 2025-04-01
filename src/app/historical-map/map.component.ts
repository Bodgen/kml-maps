import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MapService } from '../services/map.service';

@Component({
  selector: 'app-map',
  templateUrl: 'map.component.html',
  styleUrl: 'map.component.scss',
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class MapComponent implements OnInit {
  map: google.maps.Map | undefined;
  kmzLayer: google.maps.KmlLayer | undefined;
  opacity: number = 1.0;
  isDisplayLayer = signal(false);
  selectedMap = signal<string>('')
  groundOverlay: google.maps.GroundOverlay | undefined;
  mapService = inject(MapService);
  groundOverlays: google.maps.GroundOverlay[] = [];
  kmlMapValue = new Map([
    ['ulyanovsk_Mende-1versta', 'https://drive.google.com/uc?export=download&id=1-eDorBrVXvOrQncdFcpU_O5yZ64YjfmM'],
    ['ukraine_kyiv_obl-1942', 'https://drive.google.com/uc?export=download&id=1pUAy1Z93H-eGTR08p6qged8f70YX55Gt']
  ]);

  kmlMapForParseValue = new Map([
    ['ukraine_kyiv_obl-1942', 'map-1'],
    ['ulyanovsk_Mende-1versta', 'map']
  ]);

  constructor() {
    effect((value) => {
      if (this.selectedMap() || this.isDisplayLayer()) {
        this.loadKmlAndCreateOverlay();
      }
    });

    effect(() => {
      if(!this.isDisplayLayer()) {
        this.clearAllOverlays();
      } else {
        this.addGroundOverlays();
      }
    });

    effect(() => {
      this.mapService.overlays() && this.addGroundOverlays();
    });
  }

  ngOnInit(): void {
    this.loadMap();

  }

  selectMap(map: string): void {
    this.selectedMap.set(map);
    this.isDisplayLayer.set(true);
    this.mapService.getMap(this.kmlMapForParseValue.get(map)!);
  }

  loadMap() {
    //TODO: insert GOOGLE API KEY
    const loader = new Loader({
      apiKey: 'AIzaSyCh3_1k-YyoAbKNFP-an6OabE7zmpTR1dY',
      version: 'weekly',
      libraries: ['geometry', 'places']
    });

    loader.load().then(() => {
      this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: { lat: 54, lng: 30 },
        zoom: 9,
      });
    });
  }

  loadKmlAndCreateOverlay() {
    this.kmzLayer = new google.maps.KmlLayer({
      url: this.kmlMapValue.get(this.selectedMap())!.toString(),
      preserveViewport: true,
      suppressInfoWindows: false,
      clickable: true,
      map: this.map!,
      screenOverlays: true,
    });

    this.kmzLayer.addListener('status_changed', () => {
      const status = this.kmzLayer?.getStatus();

      if (status === 'OK') {
        console.log('KML uploaded successfully');
        this.addGroundOverlays();
      } else {
        console.error('Error with KML:', status);
      }
    });
  }

  updateOpacity() {
    if (this.groundOverlays.length) {
      this.groundOverlays.forEach(i => i.setOpacity(this.opacity));
    }

    this.groundOverlay?.setOpacity(this.opacity);
  }

  addGroundOverlays() {
    if (!this.map) return;
    const combinedBounds = new google.maps.LatLngBounds();

    this.mapService.overlays().forEach(overlay => {
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(overlay.southWest.lat, overlay.southWest.lng),
        new google.maps.LatLng(overlay.northEast.lat, overlay.northEast.lng)
      );

      combinedBounds.union(bounds);
      const groundOverlay = new google.maps.GroundOverlay(overlay.imageUrl, bounds, {
        clickable: false,
        opacity: this.opacity,
      });
      groundOverlay.setMap(this.map!);
      this.groundOverlays.push(groundOverlay);
    });
    this.map!.fitBounds(combinedBounds);
    this.map!.setZoom(this.map.getZoom()! + 1);
    this.kmzLayer?.setMap(null);
  }

  clearAllOverlays() {
    if (this.groundOverlays && this.groundOverlays.length > 0) {
      this.groundOverlays.forEach(overlay => {
        overlay.setMap(null);
      });
      this.groundOverlays = [];
    }
    if (this.kmzLayer) {
      this.kmzLayer.setMap(null);
    }
  }
}
