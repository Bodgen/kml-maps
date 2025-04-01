import { Injectable, signal } from '@angular/core';
import { IOverlayGround } from '../interfaces/overlay-ground.interface';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  overlays = signal<IOverlayGround[]>([])

  getMap(map: string): void {
    fetch(`${map}.kml`)
      .then(response => {
        console.log(response)
        return response.text()
      })
      .then(kmlText => {
        this.setOverlays(this.parseKMLFolders(kmlText));
      });
  }

  setOverlays(overlays: IOverlayGround[]): void {
    this.overlays.set(overlays);
  }

  private parseKMLFolders(kmlString: string): IOverlayGround[] {
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlString, 'text/xml');
    const folders = kmlDoc.querySelectorAll('Folder');
    const overlays: any[] = [];

    folders.forEach(folder => {
      const latLonBox = folder.querySelector('GroundOverlay > LatLonBox');
      const icon = folder.querySelector('GroundOverlay > Icon > href');

      if (latLonBox && icon && icon.textContent) {
        const south = parseFloat(latLonBox.querySelector('south')?.textContent || '0');
        const west = parseFloat(latLonBox.querySelector('west')?.textContent || '0');
        const north = parseFloat(latLonBox.querySelector('north')?.textContent || '0');
        const east = parseFloat(latLonBox.querySelector('east')?.textContent || '0');

        overlays.push({
          imageUrl: icon.textContent.trim(),
          southWest: { lat: south, lng: west },
          northEast: { lat: north, lng: east }
        });
      }
    });

    return overlays;
  }
}
