# Navi · Configuración Técnica del Piloto

## Componentes

- Frontend: Vercel
- Dominio beta: `https://faro-me.vercel.app`
- Backend: Google Apps Script + Google Sheets

## Variables y secretos

### Vercel

- `VITE_API_URL`

Debe apuntar al deployment activo de Apps Script.

### Apps Script

- `NAVI_ADMIN_SECRET`

Debe existir en Script Properties.

### Admin de Navi

En `/admin > Configuración`:
- guardar la URL del Apps Script
- guardar la clave admin local del navegador

## Hojas esperadas

- `Students`
- `Mentors`
- `Users`
- `GoalsCatalog`

## Carga inicial

### Mentores

Cada mentor debe existir en `Users` con:
- correo institucional exacto
- rol correspondiente

### Estudiantes

Cada estudiante debe existir en `Students` con matrícula correcta.

## Validación mínima antes de operar

1. `/admin` carga correctamente
2. `Traer de Sheets` funciona
3. `Guardar catálogo` funciona
4. `/check-in` abre desde el dominio público
5. el QR del panel apunta al dominio público, no a localhost

