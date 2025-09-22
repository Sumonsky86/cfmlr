# Cefem – Centro Familiar de Especialidades Médicas

Este proyecto es el sitio web oficial de **Cefem – Centro Familiar de Especialidades Médicas** (Las Rosas, Santa Fe).  
El sitio está desarrollado con **[Astro](https://astro.build/)** y **[TailwindCSS](https://tailwindcss.com/)**, optimizado para velocidad, performance y escalabilidad.

Incluye:
- **Landing page institucional** con información de la clínica.
- **Sección de especialidades y servicios médicos.**
- **Blog de salud preventiva** con guías e información útil para pacientes.
- **Integración con WhatsApp** para solicitar turnos de manera rápida.
- **Mapa de ubicación** optimizado para performance.
- **Portal del Paciente (en desarrollo):** acceso seguro a resultados de estudios e informes médicos.

---

## 🚀 Tecnologías utilizadas

- **Astro** – Framework web estático e híbrido.
- **TailwindCSS** – Estilos rápidos y personalizables.
- **TypeScript** – Tipado para mayor robustez.
- **Markdown Content Collections** – Gestión de contenidos (posts, guías, novedades).
- **Google Maps Embed** (sin API key) – Ubicación de la clínica.
- **Optimización SEO y Lighthouse** – Carga rápida y buen puntaje en performance.

---

## ⚙️ Instalación

1) Instalá las dependencias:
```bash
npm install
```

2) Desarrollo local:
```bash
npm run dev
```

3) Verificación de tipos y build:
```bash
npm run check
npm run build
```

4) Preview del build:
```bash
npm run preview
```

Sugerido: configurar `site` en `astro.config.mjs` y datos en `src/data/config.ts` (nombre, URL, redes sociales) para SEO correcto.
