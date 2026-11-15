import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReporteService } from './reporte.service';
import { CommunityApi } from '../../communities/infrastructure/community-api';

describe('Sprint 3 service contracts', () => {
  let reports: ReporteService;
  let communities: CommunityApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    reports=TestBed.inject(ReporteService);communities=TestBed.inject(CommunityApi);
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('delegates report ownership to the authenticated service', () => {
    reports.crearReporte({userId:999,type:'TEST'}).subscribe();
    const request=http.expectOne(r=>r.method==='POST');
    expect(request.request.body.userId).toBeUndefined();request.flush({id:1});
  });
  it('delegates community ownership to the authenticated service', () => {
    communities.createCommunity({ownerId:999,name:'Test'}).subscribe();
    const request=http.expectOne(r=>r.method==='POST');
    expect(request.request.body.ownerId).toBeUndefined();request.flush({id:1});
  });
  it('sends multipart evidence without forcing a JSON content type', () => {
    const file=new File(['%PDF-1.4'],'sample.pdf',{type:'application/pdf'});
    reports.subirEvidencia(1,file).subscribe();
    const request=http.expectOne(r=>r.url.endsWith('/incidents/1/evidences'));
    expect(request.request.body instanceof FormData).toBe(true);
    expect(request.request.headers.has('Content-Type')).toBe(false);request.flush({id:'file'});
  });
  it('preserves paginated results instead of assuming an array', () => {
    let total=0;
    reports.pagina(2).subscribe(result=>total=result.totalElements);
    const request=http.expectOne(r=>r.params.get('page')==='2');
    expect(request.request.params.get('paged')).toBe('true');
    request.flush({content:[],totalElements:101,totalPages:3});expect(total).toBe(101);
  });
  it('propagates forbidden state changes to the caller', () => {
    let code=0;
    reports.actualizarEstado(1,'RESOLVED').subscribe({error:e=>code=e.status});
    http.expectOne(r=>r.url.endsWith('/1/status')).flush({}, {status:403,statusText:'Forbidden'});
    expect(code).toBe(403);
  });
});
