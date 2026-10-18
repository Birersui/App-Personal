# Mis Finanzas

App personal, **offline y sin login**, para llevar ingresos, deudas y notas.
Los datos se guardan en un archivo **SQLite real** en tu propio dispositivo.

## Funciones

- **Ingresos**: monto, descripción, categoría y fecha.
- **Gastos**: monto, descripción, categoría y fecha. Botón **clonar** para repetir un gasto.
- **Deudas**: monto total, vencimiento, notas, registro de **pagos parciales** con historial, **liquidar** y **clonar** (sumando 14, 15 o los días que quieras).
- **Presupuestos por categoría**: límite mensual con barra de progreso y aviso al excederte.
- **Movimientos recurrentes**: sueldo, renta, suscripciones que se registran solos cada X días.
- **Notas**: título, contenido y color (se adapta al tema).
- **Deshacer** al borrar (toast con opción de recuperar).
- **Resumen**: disponible (ingresos − gastos − deuda), totales, ingresos vs salidas (6 meses), estado de deudas y gasto por categoría.
- **Tema claro / oscuro / sistema**, con botón rápido en la cabecera.
- **Paletas de color**: azul, verde, morado, amarillo y rojo.
- **Recordatorios**: vencimientos próximos/vencidos dentro de la app y notificaciones locales en Android.
- **Respaldo**: exportar/importar en `.sqlite` (copia exacta) o `.json` (portable).

Todo se guarda localmente:

| Plataforma | Dónde vive el `.sqlite` |
|---|---|
| Web / PWA | Almacenamiento del navegador (IndexedDB vía `@capacitor/filesystem`) |
| Android (APK) | Carpeta privada de datos de la app |

## Estructura

```
src/            # código fuente (JS + CSS)
  db.js         # esquema SQLite y consultas
  store.js      # persistencia del archivo .sqlite
  charts.js     # gráficos en canvas (sin librerías externas)
  backup.js     # exportar / importar
  reminders.js  # notificaciones locales
  main.js       # UI y navegación
www/            # salida del build (lo que se sirve / empaqueta)
scripts/        # build, íconos y pruebas
.github/workflows/  # compilación automática del APK y publicación PWA
```

## Uso en local

```bash
npm install      # dependencias + copia de sql.js
npm run build    # genera www/ (bundle + íconos)
npm run serve    # sirve en http://localhost:8080
npm test         # pruebas de la capa de datos
```

## Opción A — PWA (instalar ya, sin compilar)

1. Sube el repo a GitHub.
2. Activa **Settings → Pages → Build and deployment → GitHub Actions**.
3. El workflow `pages.yml` publica la app en `https://TU_USUARIO.github.io/TU_REPO/`.
4. Abre esa URL en el navegador del teléfono → menú → **Añadir a pantalla de inicio**.

Funciona offline. En iOS/Android queda como app instalada.

## Opción B — APK (app Android real)

No necesitas Android Studio ni el SDK: GitHub lo compila en la nube.

1. Sube el repo a GitHub (rama `main`).
2. Ve a **Actions → Build APK (Android)**. Se ejecuta al hacer push o manualmente con **Run workflow**.
3. Al terminar, descarga el artefacto **`mis-finanzas-apk`** (contiene `app-debug.apk`).
4. Pásalo al teléfono e instálalo (activa "Instalar apps de origen desconocido").

Para compilar en tu PC en lugar de la nube:

```bash
npm install
npm run build
npx cap add android
npm run patch:android   # permisos de notificaciones/alarmas exactas
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

> El APK de **debug** es instalable y suficiente para uso personal. Para firmar una
> versión *release* necesitas generar un keystore y añadirlo al workflow.

## Datos y privacidad

- No hay servidor, ni cuentas, ni telemetría. Nada sale del dispositivo.
- **Exporta seguido** tu respaldo (`.sqlite`) desde Ajustes → Respaldo.
- Borrar los datos de la app elimina la base de datos: guarda copias.
