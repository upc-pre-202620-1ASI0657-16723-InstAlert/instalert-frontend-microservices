import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { EmergencyHttpAdapter } from '../../emergencies/infrastructure/adapters/emergency-http.adapter';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private emergencies = inject(EmergencyHttpAdapter);
  private incidentsUrl = `${environment.serverBaseUrl}${environment.apiBasePath}${environment.incidentsEndpointPath}`;
  private riskZonesUrl = `${environment.serverBaseUrl}${environment.apiBasePath}${environment.riskZonesEndpointPath}`;

  constructor(private http: HttpClient) {}

  getReportes(): Observable<any[]> {
    return this.http.get<any[]>(this.incidentsUrl);
  }

  getRiskZones(): Observable<any[]> {
    return of([]); // Risk classification needs approved rules; report map remains available.
  }

  getEmergencies(): Observable<any[]> {
    return this.emergencies.getHistory();
  }

  crearReporte(reporte: any): Observable<any> {
    const {userId, ...body}=reporte;
    return this.http.post<any>(this.incidentsUrl, body);
  }
  subirEvidencia(id: number, file: File): Observable<any> {
    const body=new FormData();body.append('file',file);
    return this.http.post(`${this.incidentsUrl}/${id}/evidences`,body);
  }
  evidencias(id: number): Observable<any[]> {return this.http.get<any[]>(`${this.incidentsUrl}/${id}/evidences`);}
  descargarEvidencia(id:number,key:string):Observable<Blob>{return this.http.get(`${this.incidentsUrl}/${id}/evidences/${key}`,{responseType:'blob'});}
  pagina(page:number):Observable<any>{return this.http.get(this.incidentsUrl,{params:{paged:true,page,size:50}});}


  eliminarReporte(id: string | number) {
    return this.http.delete(`${this.incidentsUrl}/${id}`);
  }

  actualizarEstado(id: string | number, status: string): Observable<any> {
    return this.http.put<any>(`${this.incidentsUrl}/${id}/status`, { status });
  }
}
