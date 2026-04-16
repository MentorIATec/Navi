# Navi Webapp

## Variables de entorno

Copia `.env.example` a `.env.local` para desarrollo local o configura la variable en tu hosting:

```bash
VITE_API_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

La clave de escritura admin no debe ir en `.env` del frontend. Configúrala así:

1. En Google Apps Script, crea `NAVI_ADMIN_SECRET` en **Script Properties**
2. En `/admin > Configuración`, pega esa misma clave en **Conexión con Google Sheets**

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

- El frontend usa `BrowserRouter`.
- Si despliegas en Vercel con raíz en `webapp/`, el archivo `vercel.json` ya incluye el rewrite necesario para servir `index.html` en todas las rutas.
- Si despliegas en otra plataforma, debes configurar el equivalente para evitar `404` en rutas como `/admin` o `/seleccion-metas`.

## Estado beta

- Dominio beta activo: `https://faro-me.vercel.app`
- Proyecto Vercel enlazado al repositorio `MentorIATec/Navi` con raíz en `webapp/`
- Commit base de la beta: `2dbb7f9`
- `VITE_API_URL` configurada en Vercel apuntando al Apps Script activo

### Smoke test post-deploy

Rutas verificadas con `200`:

- `/`
- `/resultados`
- `/check-in`
- `/seleccion-metas`
- `/plan-accion`
- `/admin`

### Pendientes de la siguiente fase

- Autenticación institucional real para mentoría y administración
- Permisos resueltos del lado servidor, no solo en cliente
- Check-in con contexto de sesión/mentor mediante token opaco
- Reducir duplicación de lógica entre frontend y Apps Script

## Documentación piloto

- `webapp/docs/pilot-mentors-overview.md`
- `webapp/docs/pilot-invitation-email.md`
- `webapp/docs/pilot-presential-session-guide.md`
- `webapp/docs/pilot-technical-setup.md`
- `webapp/docs/pilot-faq.md`
