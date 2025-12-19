# Plan de Implementación: Sistema de Generación Automática de Cartas PDF

## Resumen Ejecutivo

Sistema para generar automáticamente tres tipos de cartas en PDF:
1. **Carta de Responsabilidad - LAPTOP**: Entrega de equipos portátiles
2. **Carta de Responsabilidad - TELÉFONO**: Entrega de dispositivos móviles
3. **Carta de Descuento**: Para casos de pérdida/robo de dispositivos

**Stack tecnológico:** Django + ReportLab (backend), Next.js + TypeScript (frontend)

---

## 1. Serializers (Backend)

**Archivo:** `backend/apps/assignments/serializers.py`

### 1.1 Serializer para Carta de Responsabilidad

```python
class ResponsibilityLetterSerializer(serializers.Serializer):
    # Selección de empresa
    company_key = serializers.ChoiceField(
        choices=['pompeyo_carrasco', 'pompeyo_automoviles'],
        default='pompeyo_carrasco'
    )

    # Campos comunes
    jefatura_nombre = serializers.CharField(max_length=200, required=False, allow_blank=True)

    # Campos para LAPTOP
    procesador = serializers.CharField(max_length=100, required=False, allow_blank=True)
    disco_duro = serializers.CharField(max_length=100, required=False, allow_blank=True)
    memoria_ram = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tiene_dvd = serializers.BooleanField(default=False)
    tiene_cargador = serializers.BooleanField(default=True)
    tiene_bateria = serializers.BooleanField(default=True)
    tiene_mouse = serializers.BooleanField(default=False)
    tiene_candado = serializers.BooleanField(default=False)

    # Campos para TELÉFONO
    plan_telefono = serializers.CharField(max_length=200, required=False, allow_blank=True)
    minutos_disponibles = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tiene_audifonos = serializers.BooleanField(default=False)
```

### 1.2 Serializer para Carta de Descuento

```python
class DiscountLetterSerializer(serializers.Serializer):
    # Selección de empresa
    company_key = serializers.ChoiceField(
        choices=['pompeyo_carrasco', 'pompeyo_automoviles'],
        default='pompeyo_carrasco'
    )

    monto_total = serializers.DecimalField(max_digits=10, decimal_places=0, min_value=1)
    numero_cuotas = serializers.IntegerField(min_value=1, max_value=24)
    mes_primera_cuota = serializers.CharField(max_length=20)

    def validate_mes_primera_cuota(self, value):
        meses_validos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        if value not in meses_validos:
            raise serializers.ValidationError('Mes inválido')
        return value
```

---

## 2. Generador de PDFs (Backend)

### 2.1 Dependencias
**Archivo:** `backend/requirements.txt`

```
reportlab>=4.0.0
Pillow>=10.0.0
```

### 2.2 Servicio de Generación
**Archivo:** `backend/apps/assignments/pdf_generator.py` (NUEVO)

**Clase principal:** `PDFLetterGenerator`

**Constantes:**
- `LOGO_PATH`: `/docs/logo.png`
- **COMPANIES**: Diccionario con información de las 2 empresas:
  ```python
  COMPANIES = {
      'pompeyo_carrasco': {
          'name': 'Pompeyo Carrasco SPA',
          'rut': '81.318.700-0'
      },
      'pompeyo_automoviles': {
          'name': 'Pompeyo Carrasco Automóviles SPA',
          'rut': '85.164.100-9'
      }
  }
  ```

**Estructura de todas las cartas (formato único):**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [LOGO POMPEYO CARRASCO]                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [TÍTULO DE LA CARTA]                     │
│                 (varía según tipo de carta)                 │
│                                                             │
│  En Santiago [FECHA], entre la Empresa [EMPRESA_NAME]      │
│  RUT: [EMPRESA_RUT] y don(a) [NOMBRE_EMPLEADO]             │
│  RUT: [RUT_EMPLEADO]...                                     │
│                                                             │
│  [CONTENIDO ESPECÍFICO DE LA CARTA]                        │
│  - Carta Responsabilidad Laptop: specs del laptop          │
│  - Carta Responsabilidad Teléfono: datos del teléfono      │
│  - Carta Descuento: detalles de cuotas                     │
│                                                             │
│                                                             │
│                ________________________                     │
│                 FIRMA DEL TRABAJADOR                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Departamento de Informática y Redes . Empresas Pompeyo    │
│  Carrasco                                                   │
└─────────────────────────────────────────────────────────────┘
```

**Métodos:**

1. `__init__(company_key='pompeyo_carrasco')` → Constructor que recibe la empresa seleccionada
2. `_format_date_spanish(date)` → "04 de Julio del 2025"
3. `_format_currency(amount)` → "$100.000"
4. `_draw_base_template(canvas, title)` → **Dibuja header + footer + título (COMÚN A TODAS)**
   - Header: Logo Pompeyo Carrasco (arriba izquierda)
   - Footer: "Departamento de Informática y Redes . Empresas Pompeyo Carrasco" (abajo)
   - Título centrado
5. `_draw_laptop_content(canvas, assignment, extra_data)` → Contenido específico laptop
6. `_draw_phone_content(canvas, assignment, extra_data)` → Contenido específico teléfono
7. `_draw_discount_content(canvas, assignment, discount_data)` → Contenido específico descuento
8. `generate_laptop_responsibility_letter(assignment, extra_data)` → Usa template + contenido laptop
9. `generate_phone_responsibility_letter(assignment, extra_data)` → Usa template + contenido teléfono
10. `generate_discount_letter(assignment, discount_data)` → Usa template + contenido descuento

**Nota:** Todos los métodos de generación usarán `self.company_name` y `self.company_rut` configurados en el constructor.

**Mapeo de campos (recibidos desde el formulario en `extra_data`):**

**LAPTOP:**
- Fecha → `datetime.now()` formateada
- Empleado → `assignment.empleado_detail.{nombre_completo, rut}`
- Equipo → `f"{dispositivo.marca} {dispositivo.modelo}"`
- N/S → `dispositivo.numero_serie`
- Procesador → `extra_data['procesador']` (del formulario)
- Disco Duro → `extra_data['disco_duro']` (del formulario)
- Memoria → `extra_data['memoria_ram']` (del formulario)
- Accesorios → `"SI" if extra_data['tiene_X'] else "NO"` (del formulario)

**TELÉFONO:**
- Campos base igual que laptop
- IMEI → `dispositivo.imei`
- Plan → `extra_data['plan_telefono']` (del formulario)
- Minutos → `extra_data['minutos_disponibles']` (del formulario)
- Nº Teléfono → `dispositivo.numero_telefono`
- Jefatura → `extra_data['jefatura_nombre']` (del formulario)
- Cargo → `empleado_detail.cargo`
- Sucursal → `empleado_detail.sucursal_detail.nombre`
- Costo → `dispositivo.get_valor_depreciado()` formateado

**DESCUENTO:**
- Lugar → "Santiago" (fijo)
- Fecha → actual formateada
- Monto total → `discount_data['monto_total']`
- Concepto → `f"{tipo} {marca} {modelo}"`
- Empleado → nombre, RUT
- Cuotas → `discount_data['numero_cuotas']`
- Mes → `discount_data['mes_primera_cuota']`
- Monto cuota → `monto_total / numero_cuotas` (calculado)

---

## 3. Endpoints REST (Backend)

**Archivo:** `backend/apps/assignments/views.py`

### 3.1 Generate Responsibility Letter

```python
@action(detail=True, methods=['post'], url_path='generate-responsibility-letter')
def generate_responsibility_letter(self, request, pk=None):
    """
    POST /api/assignments/assignments/{id}/generate-responsibility-letter/
    Body: ResponsibilityLetterSerializer data (campos del formulario)
    Retorna: PDF como blob (application/pdf)
    """
```

**Validaciones:**
- Asignación debe estar ACTIVA
- Tipo dispositivo debe ser LAPTOP o TELEFONO
- Validar datos con `ResponsibilityLetterSerializer`

**Proceso:**
1. Validar request.data con `ResponsibilityLetterSerializer`
2. Extraer `company_key` de los datos validados
3. Obtener assignment con relaciones (`select_related`)
4. Detectar tipo de dispositivo
5. Crear instancia de `PDFLetterGenerator(company_key=company_key)`
6. Generar PDF correspondiente pasando `extra_data` del formulario
7. Retornar `HttpResponse` con content_type='application/pdf'

### 3.2 Generate Discount Letter

```python
@action(detail=True, methods=['post'], url_path='generate-discount-letter')
def generate_discount_letter(self, request, pk=None):
    """
    POST /api/assignments/assignments/{id}/generate-discount-letter/
    Body: {monto_total, numero_cuotas, mes_primera_cuota}
    Side Effect: Cambia device.estado a 'ROBO'
    """
```

**Validaciones:**
- Asignación ACTIVA
- DiscountLetterSerializer válido

**Proceso:**
1. Validar input con `DiscountLetterSerializer`
2. Extraer `company_key` de los datos validados
3. Crear instancia de `PDFLetterGenerator(company_key=company_key)`
4. Generar PDF
5. **Cambiar estado dispositivo a ROBO** usando `device.change_status('ROBO', user=request.user)`
6. Registrar en auditoría
7. Retornar PDF

**Permisos:** ADMIN y OPERADOR (ambos pueden generar cartas de descuento)

---

## 4. Frontend - API Client

### 4.1 Extensión de ApiClient
**Archivo:** `frontend/lib/api-client.ts`

**Nuevo método:**

```typescript
async downloadBlob(endpoint: string, data?: unknown, filename?: string): Promise<void> {
  // 1. POST request con JSON body
  // 2. Recibir response como blob
  // 3. Extraer filename de Content-Disposition header
  // 4. Crear URL temporal y disparar descarga
  // 5. Limpiar recursos
}
```

---

## 5. Frontend - Servicios

### 5.1 Assignment Service
**Archivo:** `frontend/lib/services/assignment-service.ts`

**Nuevos métodos:**

```typescript
async generateResponsibilityLetter(
  assignmentId: number,
  letterData: ResponsibilityLetterData
): Promise<void> {
  await apiClient.downloadBlob(
    `/assignments/assignments/${assignmentId}/generate-responsibility-letter/`,
    letterData,
    `carta_responsabilidad_${assignmentId}.pdf`
  )
}

async generateDiscountLetter(
  assignmentId: number,
  data: DiscountLetterData
): Promise<void> {
  await apiClient.downloadBlob(
    `/assignments/assignments/${assignmentId}/generate-discount-letter/`,
    data,
    `carta_descuento_${assignmentId}.pdf`
  )
}
```

### 5.2 Tipos TypeScript
**Archivo:** `frontend/lib/types.ts`

**Nuevos tipos:**

```typescript
export interface ResponsibilityLetterData {
  // Selección de empresa
  company_key: 'pompeyo_carrasco' | 'pompeyo_automoviles'

  // Campos comunes
  jefatura_nombre?: string

  // Campos para LAPTOP
  procesador?: string
  disco_duro?: string
  memoria_ram?: string
  tiene_dvd?: boolean
  tiene_cargador?: boolean
  tiene_bateria?: boolean
  tiene_mouse?: boolean
  tiene_candado?: boolean

  // Campos para TELÉFONO
  plan_telefono?: string
  minutos_disponibles?: string
  tiene_audifonos?: boolean
}

export interface DiscountLetterData {
  // Selección de empresa
  company_key: 'pompeyo_carrasco' | 'pompeyo_automoviles'

  monto_total: number
  numero_cuotas: number
  mes_primera_cuota: string
}

// Tipo auxiliar para opciones de empresas
export interface CompanyOption {
  value: 'pompeyo_carrasco' | 'pompeyo_automoviles'
  label: string
  rut: string
}
```

---

## 6. Frontend - Componentes

### 6.1 Nuevo Modal: Carta de Responsabilidad
**Archivo:** `frontend/components/modals/responsibility-letter-modal.tsx` (NUEVO)

**Características:**
- **Select de empresa** al inicio (Pompeyo Carrasco SPA o Pompeyo Carrasco Automóviles SPA)
- Detecta automáticamente si es LAPTOP o TELEFONO según `assignment.dispositivo_detail.tipo_equipo`
- Muestra campos condicionales según el tipo
- Para LAPTOP: inputs procesador, disco_duro, memoria_ram + checkboxes accesorios
- Para TELEFONO: inputs plan_telefono, minutos_disponibles, jefatura_nombre + checkboxes
- Submit llama a `assignmentService.generateResponsibilityLetter()`

**Estados relevantes:**
```typescript
const [companyKey, setCompanyKey] = useState<'pompeyo_carrasco' | 'pompeyo_automoviles'>('pompeyo_carrasco')
const [tipoDispositivo, setTipoDispositivo] = useState<string>("")
// Estados para campos LAPTOP
const [procesador, setProcesador] = useState<string>("")
const [discoDuro, setDiscoDuro] = useState<string>("")
// ... etc para cada campo
```

**Constante de empresas:**
```typescript
const COMPANY_OPTIONS: CompanyOption[] = [
  { value: 'pompeyo_carrasco', label: 'Pompeyo Carrasco SPA', rut: '81.318.700-0' },
  { value: 'pompeyo_automoviles', label: 'Pompeyo Carrasco Automóviles SPA', rut: '85.164.100-9' }
]
```

### 6.2 Nuevo Modal: Carta de Descuento
**Archivo:** `frontend/components/modals/discount-letter-modal.tsx` (NUEVO)

**Características:**
- **Select de empresa** al inicio (Pompeyo Carrasco SPA o Pompeyo Carrasco Automóviles SPA)
- Pre-llena `monto_total` con `valor_depreciado` del dispositivo
- Calcula automáticamente `monto_cuota` = total / cuotas
- Select para mes (12 meses en español)
- Input numérico para cuotas (1-24)
- **Advertencia destacada:** Cambio de estado a ROBO
- Submit llama a `assignmentService.generateDiscountLetter()`

**Estados:**
```typescript
const [companyKey, setCompanyKey] = useState<'pompeyo_carrasco' | 'pompeyo_automoviles'>('pompeyo_carrasco')
const [montoTotal, setMontoTotal] = useState<string>("")
const [numeroCuotas, setNumeroCuotas] = useState<string>("4")
const [mesPrimeraCuota, setMesPrimeraCuota] = useState<string>("")
const [montoCuota, setMontoCuota] = useState<number>(0)
```

**Constante de empresas:**
```typescript
const COMPANY_OPTIONS: CompanyOption[] = [
  { value: 'pompeyo_carrasco', label: 'Pompeyo Carrasco SPA', rut: '81.318.700-0' },
  { value: 'pompeyo_automoviles', label: 'Pompeyo Carrasco Automóviles SPA', rut: '85.164.100-9' }
]
```

**useEffect:** Calcular cuota al cambiar monto/cuotas

### 6.3 Página de Detalle de Asignación
**Archivo:** `frontend/app/dashboard/assignments/[id]/page.tsx`

**Modificaciones:**

1. **Nuevos estados:**
```typescript
const [isResponsibilityModalOpen, setIsResponsibilityModalOpen] = useState(false)
const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
```

2. **Nuevos botones** (solo si `estado_asignacion === "ACTIVA"`):
```typescript
{/* Carta de Responsabilidad - solo LAPTOP o TELEFONO */}
{(device?.tipo_equipo === "LAPTOP" || device?.tipo_equipo === "TELEFONO") && (
  <Button variant="outline" onClick={() => setIsResponsibilityModalOpen(true)}>
    <FileText className="mr-2 h-4 w-4" />
    Generar Carta de Responsabilidad
  </Button>
)}

{/* Carta de Descuento */}
<Button variant="outline" onClick={() => setIsDiscountModalOpen(true)}>
  <FileText className="mr-2 h-4 w-4" />
  Generar Carta de Descuento
</Button>
```

3. **Modales al final:**
```typescript
<ResponsibilityLetterModal
  open={isResponsibilityModalOpen}
  onClose={() => setIsResponsibilityModalOpen(false)}
  assignment={assignment}
/>

<DiscountLetterModal
  open={isDiscountModalOpen}
  onClose={() => setIsDiscountModalOpen(false)}
  onSuccess={loadAssignment}
  assignment={assignment}
/>
```

---

## 7. Validaciones y Manejo de Errores

### Backend

**Carta de Responsabilidad:**
- ✅ Asignación ACTIVA
- ✅ Tipo dispositivo LAPTOP o TELEFONO
- ✅ Empleado ACTIVO
- ✅ Validar datos del formulario con `ResponsibilityLetterSerializer`

**Carta de Descuento:**
- ✅ Asignación ACTIVA
- ✅ Monto total > 0
- ✅ Cuotas: 1-24
- ✅ Mes válido
- ✅ Dispositivo no ya en ROBO

### Frontend

**Mensajes específicos:**
```typescript
catch (error: any) {
  if (error.message.includes('tipo de dispositivo')) {
    toast({ title: "Tipo no soportado", description: "Solo laptops y teléfonos" })
  } else if (error.message.includes('activa')) {
    toast({ title: "Asignación inactiva" })
  }
}
```

### Permisos

- **Carta Responsabilidad:** ADMIN y OPERADOR
- **Carta Descuento:** ADMIN y OPERADOR (ambos pueden generar, aunque cambia estado crítico a ROBO)

---

## 8. Orden de Implementación (7-9 días)

### Paso 1: Serializers Backend (0.5 días)
1. Crear `ResponsibilityLetterSerializer` en `backend/apps/assignments/serializers.py`
2. Crear `DiscountLetterSerializer` en el mismo archivo
3. Probar validaciones en Django shell

### Paso 2: Backend PDF (3-4 días)
1. Instalar dependencias: `pip install reportlab Pillow`
2. Crear `pdf_generator.py` con clase `PDFLetterGenerator`
3. Implementar método `generate_laptop_responsibility_letter()`
4. Implementar método `generate_phone_responsibility_letter()`
5. Implementar método `generate_discount_letter()`
6. Probar generación desde Django shell

### Paso 3: Endpoints REST (1 día)
1. Implementar `@action generate_responsibility_letter` en `AssignmentViewSet`
2. Implementar `@action generate_discount_letter` con cambio de estado a ROBO
3. Agregar lógica de auditoría
4. Probar con Postman/curl

### Paso 4: Frontend - API (0.5 días)
1. Agregar método `downloadBlob()` a ApiClient
2. Extender assignmentService con 2 métodos nuevos
3. Actualizar types.ts con `ResponsibilityLetterData` y `DiscountLetterData`

### Paso 5: Frontend - Componentes (2-3 días)
1. Crear `responsibility-letter-modal.tsx` con formulario dinámico según tipo dispositivo
2. Crear `discount-letter-modal.tsx` con cálculo automático de cuotas
3. Actualizar `frontend/app/dashboard/assignments/[id]/page.tsx` (botones + modales)
4. Probar flujos end-to-end

### Paso 6: Testing Integral (1-2 días)
1. Generar carta laptop con todos los campos
2. Generar carta teléfono con todos los campos
3. Generar carta descuento + verificar cambio estado ROBO
4. Verificar formato fechas español y moneda CLP
5. Probar campos vacíos/opcionales
6. Verificar auditoría registrada
7. Probar validaciones y errores
8. Verificar permisos ADMIN vs OPERADOR

### Paso 7: Refinamiento (1 día)
1. Ajustar layout PDF para coincidir exactamente con plantillas
2. Documentar endpoints en README o Swagger
3. Code review
4. Actualizar guías de usuario si existen

---

## 9. Archivos Críticos

### Backend
- `backend/apps/assignments/serializers.py` - Nuevos serializers: `ResponsibilityLetterSerializer` y `DiscountLetterSerializer`
- `backend/apps/assignments/pdf_generator.py` - **NUEVO** - Servicio de generación de PDFs
- `backend/apps/assignments/views.py` - Agregar @action methods para generación de cartas
- `backend/requirements.txt` - Agregar reportlab, Pillow

### Frontend
- `frontend/lib/api-client.ts` - Método downloadBlob
- `frontend/lib/types.ts` - Nuevos interfaces: `ResponsibilityLetterData` y `DiscountLetterData`
- `frontend/lib/services/assignment-service.ts` - Nuevos métodos para generación de cartas
- `frontend/components/modals/responsibility-letter-modal.tsx` - **NUEVO** - Modal con formulario dinámico
- `frontend/components/modals/discount-letter-modal.tsx` - **NUEVO** - Modal para carta de descuento
- `frontend/app/dashboard/assignments/[id]/page.tsx` - Botones y modales

### Recursos
- `docs/logo.png` - Logo corporativo (ya existe)
- `docs/RESPOSABILIDAD_LAPTOP_SPA.pdf` - Plantilla de referencia
- `docs/RESPOSABILIDAD_TELEFONO_SPA.pdf` - Plantilla de referencia
- `docs/DESCUENTO_SPA.pdf` - Plantilla de referencia

---

## 10. Riesgos y Mitigaciones

**Riesgo 1:** Layout PDF no coincide con plantillas
**Mitigación:** Crear versión inicial, validar con usuarios, iterar ajustes de posicionamiento

**Riesgo 2:** Cambio accidental de estado a ROBO
**Mitigación:** Modal con advertencia clara, requiere confirmación, solo ADMIN, auditoría

**Riesgo 3:** Campos vacíos en formularios
**Mitigación:** Todos los campos son opcionales, mensajes claros de qué falta si es necesario

---

## Notas Finales

- **Logo:** Usar `/docs/logo.png` en encabezado de TODAS las cartas
- **Formato fechas:** Español, "04 de Julio del 2025"
- **Formato moneda:** CLP, "$100.000" (punto como separador de miles)
- **Lugar:** Fijo "Santiago" en todas las cartas
- **Firma:** Las cartas son para imprimir y firmar físicamente (no firma digital)
- **Estado carta:** Se actualiza manualmente a FIRMADA después de recibir documento físico
