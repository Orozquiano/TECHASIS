# Techasis

Frontend de gestión de servicios de grúas. Es una aplicación Angular 22.2.2 de una sola página: el inicio de sesión, la captura de servicios y la administración viven en el navegador y consumen la API del backend.

En modo demo no hace falta el backend. La aplicación responde con datos simulados en memoria.

## Requisitos

Instala esto antes de clonar o correr el proyecto:

| Herramienta | Versión |
| --- | --- |
| [Node.js](https://nodejs.org/) | 22.22.3 o superior en la rama 22, 24.15 o superior en la rama 24, o 26 |
| npm | 11. El repositorio fija `npm@11.17.0` en `package.json` |

No hay otras dependencias de sistema. Angular, RxJS, TypeScript y Vitest se instalan con npm.

## Instalación

En la raíz del repositorio:

```bash
npm install
```

Ese comando instala lo declarado en `package.json`:

- Angular 22.2.2 (`@angular/core`, formularios, router y el resto de paquetes `@angular/*`)
- RxJS 7 y `tslib`
- Angular CLI 22.2.2 y el builder de la aplicación
- TypeScript 6, Prettier, Vitest y jsdom, solo para desarrollo y pruebas

## Cómo correrlo

La aplicación queda en [http://localhost:4200/](http://localhost:4200/). Al entrar pide inicio de sesión. La ruta autenticada por defecto es `/newService`.

### Modo demo

No necesita backend. Los datos viven en el navegador y se pierden al recargar.

```bash
npm run start:demo
```

Credenciales:

- Usuario: `1111111111`
- Contraseña: `admin`

### Contra la API

Estos comandos arrancan el servidor de desarrollo y envían las peticiones de `/api` al backend configurado en `proxy.conf.json` (`http://179.0.9.180:8080`).

```bash
npm start
```

Ese es el ambiente local (`development`). También puedes elegir otro:

```bash
npm run start:dev
npm run start:test
npm run start:preprod
```

`dev` usa la misma URL relativa `/api` que el ambiente local. `test`, `preprod` y producción apuntan directo a `http://179.0.9.180:8080/api`.

## Ambientes

| Script | Ambiente | API |
| --- | --- | --- |
| `npm start` | development | `/api`, con proxy al backend |
| `npm run start:dev` | dev | `/api`, con proxy al backend |
| `npm run start:test` | test | `http://179.0.9.180:8080/api` |
| `npm run start:preprod` | preprod | `http://179.0.9.180:8080/api` |
| `npm run start:demo` | demo | simulada en el navegador |

La configuración de cada ambiente está en `src/environments/`. Esos archivos no deben contener secretos: el navegador puede leerlos.

## Compilación

```bash
npm run build
```

Genera la compilación de producción en `dist/`. Variantes:

```bash
npm run build:dev
npm run build:test
npm run build:preprod
npm run build:production
npm run build:demo
npm run build:pages
```

`build:pages` usa el modo demo y publica con la base `/TECHASIS/`.

## Pruebas

```bash
npm test
```

Las pruebas unitarias corren con Vitest.

## Secciones

Tras iniciar sesión, la navegación incluye:

| Ruta | Sección |
| --- | --- |
| `/newService` | Nuevo servicio |
| `/services` | Servicios |
| `/files` | Expedientes |
| `/conciliations` | Conciliación |
| `/reports` | Informes |
| `/ranking` | Ranking |
| `/wachen` | Custodias |
| `/administration` | Administración |
| `/login` | Inicio de sesión |
