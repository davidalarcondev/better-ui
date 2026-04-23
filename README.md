# better-ui

CLI scaffold "better-ui" — Project Doctor minimal scaffold.

Quick start

1. Instala dependencias:

   npm install

2. Ejecuta el escaneo (por defecto escribirá report.json):

   npm run scan -- --out report.json

Explicación rápida
- `src/cli.ts` define el comando `scan` usando commander.
- `src/scanners/eslintScanner.ts` usa la API programática de ESLint para analizar archivos y devolver un resumen.
- `src/reporters/jsonReporter.ts` escribe un `report.json` con la lista de archivos y sus mensajes.

Siguientes pasos recomendados

- Añadir reglas ESLint o permitir usar un .eslintrc local.
- Implementar --fix para aplicar arreglos automáticamente (usando ESLint.programmatic fix).
- Añadir más scanners (CSS, imágenes, accesibilidad).
