# Modo Debug para PDFs

## Descripción

El generador de PDFs ahora incluye un modo debug que muestra bordes rojos alrededor de cada sección del documento, permitiendo visualizar exactamente dónde está posicionado cada elemento.

## Cómo Activar el Modo Debug

### Desde la Interfaz de Usuario (Recomendado)

La forma más fácil es usar el checkbox **"Modo debug"** que aparece en los modales de generación de cartas:

1. Abre el modal de **Carta de Responsabilidad** o **Carta de Descuento**
2. Marca el checkbox **"Modo debug (mostrar bordes de secciones)"**
3. Completa los demás campos del formulario
4. Haz clic en **"Generar Carta"**
5. El PDF se descargará con bordes rojos mostrando cada sección

### Desde la API (Para Testing Backend)

También puedes activar el modo debug directamente desde la URL del endpoint:

#### Carta de Responsabilidad
```
GET /api/assignments/{id}/generate-responsibility-letter/?debug=true
```

#### Carta de Descuento
```
GET /api/assignments/{id}/generate-discount-letter/?debug=true
```

## Qué Muestra el Modo Debug

El modo debug muestra bordes rojos alrededor de las siguientes secciones:

### Header
- **HEADER**: Área completa del encabezado
- **LOGO**: Área del logo de la empresa
- **TITULO**: Área del título de la carta
- **FOOTER**: Área del pie de página

### Cartas de Responsabilidad (Laptop/Teléfono)
- **INTRO**: Párrafo introductorio
- **PRIMERO**: Sección completa de la cláusula primera
- **SPECS**: Especificaciones del equipo
- **CLAUSULAS**: Secciones SEGUNDO, TERCERO, CUARTO, QUINTO
- **DECLARACION**: Declaración final
- **FIRMA**: Área de firma

### Cartas de Descuento
- **FECHA**: Fecha en la esquina superior derecha
- **TITULO**: Título "Acuerdo / Autorización de Descuento"
- **PARRAFO 1**: Primer párrafo de autorización
- **CONCEPTO**: Concepto y monto del descuento
- **DETALLES**: Detalles del trabajador y cuotas
- **TEXTO FINAL**: "La presente autorización es irrevocable"
- **FIRMA**: Área de firma

## Capturas de Pantalla

### Modal con Checkbox de Debug Mode

Cuando abres cualquiera de los modales de generación de cartas, verás el checkbox justo debajo de la selección de empresa:

```
┌─────────────────────────────────────────┐
│ Generar Carta de Responsabilidad        │
├─────────────────────────────────────────┤
│                                         │
│ Empresa: [Pompeyo Carrasco SPA ▼]      │
│                                         │
│ ☑ Modo debug (mostrar bordes)          │
│                                         │
│ [... resto del formulario ...]         │
│                                         │
│              [Generar Carta]            │
└─────────────────────────────────────────┘
```

## Notas Importantes

- El modo debug está **DESACTIVADO por defecto**
- Los bordes rojos son solo visuales y no afectan el contenido del PDF
- Cada borde está etiquetado con el nombre de la sección en rojo pequeño
- Úsalo para ajustar posicionamiento, márgenes y espaciado
- **Recuerda desactivarlo en producción** (no incluyas `debug=true` en URLs finales)

## Ajustes Comunes

Una vez que veas los bordes, puedes ajustar:

1. **Posicionamiento**: Modificar valores de `x` e `y` en `c.drawString()` o `c.drawImage()`
2. **Espaciado**: Ajustar valores de `y_position -= X*inch`
3. **Tamaños**: Modificar `width` y `height` en `c.drawImage()`
4. **Márgenes**: Ajustar valores de `0.75*inch` (margen izquierdo/derecho)

## Ejemplo de Ajuste

Si ves que el logo está muy pegado al borde superior:

```python
# Antes
c.drawImage(img, 0.75*inch, height - 1.5*inch, ...)

# Después (más espacio superior)
c.drawImage(img, 0.75*inch, height - 1.8*inch, ...)
```
