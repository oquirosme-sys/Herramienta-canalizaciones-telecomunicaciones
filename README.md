# Cálculo de canalizaciones para telecomunicaciones

Herramienta web (HTML + JavaScript, sin dependencias ni compilación) basada en la hoja
**"Calculo canalizaciones de telecomunicaciones REV1.xlsx"**. Calcula y documenta:

- **Canalizaciones**: canasta (Panduit / Cablofil), escalera, aeroducto y ducto de fibra (FiberRunner).
  Canalización recomendada, número de parte, selección manual y % de llenado real.
- **Tuberías**: diámetro según NEC 2020 Cap. 9 Tabla 1 (53 % / 31 % / 40 %), tamaño mínimo 3/4",
  advertencias de mezcla de cables, innerduct, jam ratio, longitud > 30 m y más de 2 curvas.
- **Organizadores de cable**: horizontales, verticales y en gabinete.
- **Memoria de cálculo**: datos del proyecto, criterios, tipos de cable, resumen por nivel,
  tramos por tamaño, tuberías por diámetro, organizadores y detalle de tramos. Imprimible / PDF / CSV.

## Uso

1. Abrir `index.html` (GitHub Pages o doble clic en el archivo).
2. Pestaña **Proyecto**: datos del proyecto, tipos de cable, % de llenado, marcas y **niveles**.
3. Cada nivel crea su propia pestaña (N01, N02, S1, AZOTEA…) para llenar los tramos.
4. Pestaña **Memoria de cálculo**: resúmenes automáticos del edificio o de un nivel.

Los proyectos se guardan automáticamente en el navegador. **Exportar / Importar** (.json) permite
respaldarlos o compartirlos.

## Administración (`admin.html`)

Solo administradores: tipos de cable y medios de transmisión, tipos de canalización, **marcas** y
productos (canastas, escaleras, aeroductos, ductos), tipos y tamaños de tubería, organizadores,
opciones de % de llenado y criterios NEC.

> Contraseña provisional: `Sinergia2026` (cámbiela en *Respaldo y seguridad*).
> Es solo una barrera de interfaz local; la seguridad real (usuarios y rol administrador)
> se implementará con Supabase Auth + RLS.

Mientras no exista la base de datos, el catálogo modificado se guarda en el navegador del
administrador. Para publicarlo a todos: *Exportar catálogo* y reemplazar el contenido de
`js/catalog-default.js`.

## Estructura

```
index.html              Herramienta (Proyecto, niveles, Memoria de cálculo, Ayuda)
admin.html              Administración de catálogos
css/styles.css          Estilos (claro / oscuro / impresión)
js/config.js            Configuración (versión, hash de contraseña, claves Supabase)
js/catalog-default.js   Catálogo por defecto extraído del Excel (pestañas ocultas)
js/storage.js           Capa de datos (localStorage hoy, Supabase en el paso 2)
js/calc.js              Motor de cálculo (fórmulas del Excel)
js/ui.js                Utilidades de interfaz
js/app.js               Lógica de la herramienta
js/admin.js             Lógica del panel de administración
```

## Publicar en GitHub Pages

1. Subir el contenido de esta carpeta al repositorio.
2. *Settings → Pages → Deploy from a branch →* `main` / raíz.

## Siguiente etapa: Supabase

`js/storage.js` concentra todo el acceso a datos con funciones `async`
(`listProjects`, `getProject`, `saveProject`, `deleteProject`, `getCatalog`, `saveCatalog`,
`auth.login`, `auth.isAdmin`…). Al conectar Supabase solo se reemplaza ese archivo y se completan
`supabaseUrl` / `supabaseAnonKey` en `js/config.js`.

## Referencias

ANSI/TIA-569-E · BICSI TDMM 14.ª ed. · NEC 2020 (NFPA 70) Cap. 9 Tabla 1 y Art. 376.22(A) ·
Catálogos Panduit y Legrand Cablofil.
