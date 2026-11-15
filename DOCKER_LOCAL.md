# Frontend Docker — Sprint 3

Angular se compila con Node 24 y se sirve con Nginx. `/api/v1` se reenvía al Gateway; los contextos Account, Emergencies, Incidents y Communities se ejecutan de forma independiente. Nginx conserva Authorization, Idempotency-Key y carga multipart; `/healthz` comprueba su disponibilidad.

El Compose se administra desde el backend. Iniciar allí `scripts/Start-DockerLocal.ps1`; ajustar `FRONTEND_BUILD_CONTEXT` en su `.env.docker` si los repositorios se clonan con otros nombres. Abrir http://localhost:4201. El Gateway se publica en http://localhost:8085/api/v1. No hay un acceso hardcodeado: registrar una cuenta local o utilizar una cuenta sintética existente.

El conjunto predeterminado contiene diez contenedores: frontend, Gateway, cuatro servicios y cuatro bases. El monolito es opcional e histórico. Los avisos llegan a Communities independiente. Los usuarios y datos del MySQL nativo no se importan automáticamente a Docker.

Validar con `npm run build`, `npm run test:sprint3`, `npm run test:account` y `npm run test:emergencies`. El backend incluye `verify_sprint3_docker.py` para integración real, `verify_sprint3_quality.py` para carga local acotada y `verify_sprint3_restore.py` para restauración aislada. Consultar `docs/DOCKER_LOCAL.md` en el backend para preparación, alcance y resultados. Las cifras históricas del Sprint 2 no describen la ejecución actual.

No se afirma despliegue cloud, ejecución CI/CD, clasificación automática de riesgo, push ni rastreo GPS continuo. Los secretos no se guardan en la imagen ni en Git.
