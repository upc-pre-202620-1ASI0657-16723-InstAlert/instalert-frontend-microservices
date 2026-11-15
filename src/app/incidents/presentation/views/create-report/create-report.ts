import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ReporteService } from '../../../../shared/services/reporte.service';
import { TranslateModule } from '@ngx-translate/core';
import { UserStore } from '../../../../account/application/user-store';

import * as L from 'leaflet';

@Component({
  selector: 'app-crear-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './create-report.html',
  styleUrls: ['./create-report.css'],
})
export class CrearReporteComponent implements OnInit {
  nuevoReporte = {
    tipo: '',
    ubicacion: '',
    descripcion: '',
    lat: -12.1222,
    lng: -77.0298,
    fecha: '',
    severity: '',
    estado: 'red',
    statusText: 'ACTIVA',
  };

  previewUrl: string | null = null;
  selectedFile: File | null=null;
  error = "";
  sending=false;
  createdId:number|null=null;
  private map: any;
  private marker: any;

  constructor(
    private reporteService: ReporteService,
    private router: Router,
    private userStore: UserStore,
  ) {}

  ngOnInit() {
    this.nuevoReporte.ubicacion = `Lat: ${this.nuevoReporte.lat.toFixed(4)}, Lng: ${this.nuevoReporte.lng.toFixed(4)}`;
    this.initMap();
    this.obtenerUbicacionActual();
  }

  private initMap() {
    this.map = L.map('map-form').setView([this.nuevoReporte.lat, this.nuevoReporte.lng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: 'Â© OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker([this.nuevoReporte.lat, this.nuevoReporte.lng], {
      draggable: true,
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();

      this.nuevoReporte.lat = position.lat;
      this.nuevoReporte.lng = position.lng;
      this.nuevoReporte.ubicacion = `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`;
    });
  }

  obtenerUbicacionActual() {
    if (!navigator.geolocation) {
      console.warn('GeolocalizaciÃ³n no soportada por este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.nuevoReporte.lat = lat;
        this.nuevoReporte.lng = lng;
        this.nuevoReporte.ubicacion = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

        this.map.setView([lat, lng], 16);
        this.marker.setLatLng([lat, lng]);
      },
      (error) => {
        console.warn('No se pudo obtener la ubicaciÃ³n actual:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  async cambiarUbicacion() {
    const center = this.map.getCenter();

    this.nuevoReporte.lat = center.lat;
    this.nuevoReporte.lng = center.lng;

    this.marker.setLatLng([center.lat, center.lng]);

    this.nuevoReporte.ubicacion = await this.obtenerDireccionDesdeCoordenadas(
      center.lat,
      center.lng,
    );
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if(file.size>5*1024*1024 || !['image/png','image/jpeg','application/pdf'].includes(file.type)){this.error='Selecciona PNG, JPEG o PDF de hasta 5 MB.';this.selectedFile=null;return;}
      this.selectedFile=file;this.error='';
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async publicarReporte() {
    if(this.sending)return;
    if(this.createdId){this.uploadAndFinish(this.createdId);return;}
    this.sending=true;this.error='';
    const user = this.userStore.user();
    if (!user || !this.userStore.isLoggedIn()) {this.sending=false;return;}
    if (!this.nuevoReporte.fecha) {
      this.nuevoReporte.fecha = new Date().toISOString();
    }
    if(!this.nuevoReporte.tipo.trim() || !this.nuevoReporte.descripcion.trim() || !this.nuevoReporte.severity || !Number.isFinite(Date.parse(this.nuevoReporte.fecha))){
      this.sending=false;this.error='Completa el tipo, la severidad, la descripción y una fecha válida.';return;
    }

    const direccion = await this.obtenerDireccionDesdeCoordenadas(
      this.nuevoReporte.lat,
      this.nuevoReporte.lng,
    );

    this.nuevoReporte.ubicacion = direccion;

    const reporteFinal = {
      userId: user.id,
      type: this.nuevoReporte.tipo,
      severity: this.nuevoReporte.severity.toUpperCase(),
      timeReported: new Date(this.nuevoReporte.fecha).toISOString(),
      address: this.nuevoReporte.ubicacion,
      description: this.nuevoReporte.descripcion,
      status: 'ACTIVE',
      latitude: this.nuevoReporte.lat,
      longitude: this.nuevoReporte.lng,
    };

    this.reporteService.crearReporte(reporteFinal).subscribe({
      next: (saved) => {this.createdId=saved.id;this.uploadAndFinish(saved.id);},
      error: () => {this.sending=false;this.error='No se pudo guardar el reporte. Revisa los campos y vuelve a intentar.';},
    });
  }

  private uploadAndFinish(id:number){
    this.sending=true;
    if(!this.selectedFile){this.sending=false;this.router.navigate(['/app/reportes']);return;}
    this.reporteService.subirEvidencia(id,this.selectedFile).subscribe({
      next:()=>{this.sending=false;this.router.navigate(['/app/reportes']);},
      error:()=>{this.sending=false;this.error='El reporte ya está guardado, pero falló la evidencia. Reintenta para adjuntarla sin crear otro reporte.';},
    });
  }
  private async obtenerDireccionDesdeCoordenadas(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {signal: AbortSignal.timeout(3000)},
      );

      const data = await response.json();
      const address = data.address || {};

      const calle = address.road || address.pedestrian || address.footway || '';
      const numero = address.house_number || '';
      const distrito = address.suburb || address.neighbourhood || address.city_district || '';

      const direccionFormateada = [`${calle} ${numero}`.trim(), distrito]
        .filter(Boolean)
        .join(', ');

      return (
        direccionFormateada || data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
      );
    } catch (error) {
      console.error('Error al obtener direcciÃ³n:', error);
      return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    }
  }
}
