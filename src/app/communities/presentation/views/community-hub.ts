import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { UserStore } from '../../../account/application/user-store';

@Component({
  standalone: true,
  imports: [FormsModule, DatePipe, JsonPipe, RouterLink],
  template: `
    <h1>Comunidades</h1>
    <p><a routerLink="/app/avisos">Contactos de confianza y avisos recibidos</a></p>
    @if(error()){<p role="alert">{{error()}}</p>}
    <h2>Crear comunidad</h2>
    <label>Nombre <input [(ngModel)]="name" maxlength="100"></label>
    <label>Descripción <input [(ngModel)]="description" maxlength="255"></label>
    <label><input type="checkbox" [(ngModel)]="privateGroup"> Privada (visible para su propietario)</label>
    <button (click)="create()" [disabled]="!name.trim()">Crear</button>
    @for(c of communities();track c.id){
      <article>
        <h3>{{c.name}}</h3><p>{{c.description}}</p><p>{{c.isPrivate?'Privada':'Pública'}}</p>
        @if(c.ownerId===user.user()?.id){<button (click)="remove(c.id)">Eliminar comunidad</button>}
        @if(!c.member && !c.isPrivate){<button (click)="join(c.id)">Unirme</button>}
        @if(c.member || c.ownerId===user.user()?.id){
          <button (click)="select(c.id)">Ver solicitudes de apoyo</button>
          @if(c.ownerId!==user.user()?.id){<button (click)="leave(c.id)">Salir</button>}
        }
      </article>
    }
    @if(selected){
      <h2>Apoyo en la comunidad {{selected}}</h2>
      <p>Las solicitudes se comparten con miembros de esta comunidad.</p>
      <input aria-label="Solicitud de apoyo" [(ngModel)]="supportText" maxlength="1000">
      <button (click)="support()" [disabled]="!supportText.trim()">Solicitar apoyo</button>
      @for(r of requests();track r.id){<article><p>{{r.description}} — {{r.status}}</p><button (click)="resolve(r.id)" [disabled]="r.status!=='ACTIVE'">Resolver</button></article>}
    }
    <h2>Permisos de monitoreo</h2>
    <p>Comparte tus alertas activas durante una hora con un contacto aceptado. No habilita rastreo GPS continuo.</p>
    <label>Contacto <select [(ngModel)]="target"><option value="">Seleccionar</option>@for(p of directory();track p.accountId){<option [value]="p.accountId">{{p.name}}</option>}</select></label>
    <button (click)="grant()" [disabled]="!target">Autorizar mis alertas por una hora</button>
    @for(g of grants();track g.id){
      <article><p>{{person(g.owner_account_id)}} → {{person(g.recipient_account_id)}}. Hasta {{g.expires_at | date:'short'}}</p>
      @if(g.owner_account_id===user.user()?.accountId && !g.revoked){<button (click)="revoke(g.id)">Revocar permiso</button>}
      @if(g.recipient_account_id===user.user()?.accountId && !g.revoked){<button (click)="monitor(g.owner_account_id)">Consultar alertas autorizadas</button>}</article>
    }
    @if(monitoring()!==null){<h3>Alertas activas autorizadas</h3><pre>{{monitoring() | json}}</pre>}
  `,
  styles: [`:host{display:block;max-width:1000px;margin:auto;padding:24px;background:white;color:#17212b;border-radius:12px}label{display:block;margin:12px 0}input,select,button{padding:8px;margin:4px}article{border:1px solid #ddd;border-radius:8px;padding:12px;margin:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}[role=alert]{color:#a00}`],
})
export class CommunityHub implements OnInit {
  private http=inject(HttpClient); user=inject(UserStore);
  private base=environment.serverBaseUrl+environment.apiBasePath;
  communities=signal<any[]>([]);requests=signal<any[]>([]);grants=signal<any[]>([]);directory=signal<any[]>([]);
  monitoring=signal<unknown|null>(null);error=signal('');name='';description='';privateGroup=false;selected=0;supportText='';target='';
  ngOnInit(){this.refresh();this.http.get<any[]>(this.base+'/account/directory').subscribe({next:v=>this.directory.set(v.filter(p=>p.accountId!==this.user.user()?.accountId)),error:()=>this.fail()});}
  person(id:string){return id===this.user.user()?.accountId?'Tú':this.directory().find(p=>p.accountId===id)?.name??id;}
  fail(){this.error.set('No se pudo completar la operación. Comprueba tu sesión, vínculo, permisos y vigencia.');this.monitoring.set(null);}
  refresh(){this.http.get<any[]>(this.base+'/communities').subscribe({next:v=>this.communities.set(v),error:()=>this.fail()});this.http.get<any[]>(this.base+'/communities/monitoring-grants').subscribe({next:v=>this.grants.set(v),error:()=>this.fail()});}
  private action(req:import('rxjs').Observable<unknown>,next?:()=>void){req.subscribe({next:()=>{this.error.set('');next?.();this.refresh();},error:()=>this.fail()});}
  create(){this.action(this.http.post(this.base+'/communities',{name:this.name,description:this.description,isPrivate:this.privateGroup}),()=>{this.name='';this.description='';});}
  remove(id:number){if(confirm('¿Eliminar esta comunidad y sus solicitudes de apoyo?'))this.action(this.http.delete(this.base+'/communities/'+id),()=>{if(this.selected===id){this.selected=0;this.requests.set([]);}});}
  join(id:number){this.action(this.http.post(this.base+'/communities/'+id+'/members/me',{}));}
  leave(id:number){this.action(this.http.delete(this.base+'/communities/'+id+'/members/me'),()=>{this.selected=0;this.requests.set([]);});}
  select(id:number){this.selected=id;this.http.get<any[]>(this.base+'/communities/'+id+'/support-requests').subscribe({next:v=>this.requests.set(v),error:()=>this.fail()});}
  support(){this.action(this.http.post(this.base+'/communities/'+this.selected+'/support-requests',{description:this.supportText}),()=>{this.supportText='';this.select(this.selected);});}
  resolve(id:string){this.action(this.http.put(this.base+'/communities/'+this.selected+'/support-requests/'+id+'/resolve',{}),()=>this.select(this.selected));}
  grant(){this.action(this.http.post(this.base+'/communities/monitoring-grants',{accountId:this.target,scope:'EMERGENCY_STATUS',expiresAt:new Date(Date.now()+3600000).toISOString()}));}
  revoke(id:string){this.action(this.http.delete(this.base+'/communities/monitoring-grants/'+id),()=>this.monitoring.set(null));}
  monitor(id:string){this.monitoring.set(null);this.http.get<unknown>(this.base+'/communities/monitoring/'+id).subscribe({next:v=>{this.error.set('');this.monitoring.set(v);},error:()=>this.fail()});}
}
