# Frontend Sprint 3

El frontend Docker está disponible en http://localhost:4201. El Nginx de su contenedor dirige `/api/v1` al Gateway y este enruta Incidents y Communities a sus aplicaciones independientes. El Compose se administra desde el repositorio backend; consultar `docs/SPRINT_3_LOCAL.md` allí.

- `/app/reportes`: reportes paginados, severidad declarada, consulta de archivos privados, cambios de estado y eliminación autorizada.
- `/app/crear-reporte`: creación con coordenadas y adjunto opcional PNG/JPEG/PDF hasta 5 MB. Si falla la carga después de guardar el reporte se puede reintentar el adjunto sin volver a crear el reporte.
- `/app/comunidades`: creación de comunidades, membresía pública, solicitudes de apoyo, permisos temporales de monitoreo y revocación. Sustituye la pantalla que mostraba información comunitaria simulada.
- `/app/avisos`: conserva contactos de confianza, preferencias y bandeja de avisos; ahora usa Communities extraído.

Los identificadores del propietario no se envían como autoridad desde la interfaz: el backend resuelve la cuenta autenticada. Los errores 401/403 se conservan; no existe acceso hardcodeado.

```powershell
npm run build
npm run test:sprint3
npm run test:account
npm run test:emergencies
```

Se verificaron 5 pruebas del contrato Sprint 3, 8 regresiones Account y 8 Emergencies. El backend incluye además verificaciones reales del conjunto Docker. El build presenta avisos heredados por tamaño de CSS y Leaflet CommonJS; no impiden la compilación.

No se afirma clasificación automática de riesgo, chat, push, seguimiento GPS continuo ni invitación a comunidades privadas. Los mapas dependen de mosaicos externos; el geocodificador tiene tiempo máximo y puede usar coordenadas como dirección de respaldo.
