# Plan: Fix Flujo de Mantenimiento Urgente

## Problema Actual

El flujo de "mantenimiento urgente" está **incompleto**:

✅ **Funciona**: ASIGNADO → MANTENIMIENTO (via `send-to-maintenance`)
- El endpoint permite enviar a mantenimiento aunque haya asignación activa
- La asignación permanece ACTIVA (empleado sigue responsable del dispositivo)

❌ **Bloqueado**: MANTENIMIENTO → ASIGNADO/DISPONIBLE
- El endpoint `mark-available` rechaza el retorno si hay asignación activa
- Error: "No se puede marcar como disponible un dispositivo con asignación activa"
- **No hay forma de regresar el dispositivo al empleado después de repararlo**

## Escenario Problemático

```
1. Dispositivo ASIGNADO a empleado → Requiere reparación urgente
2. Admin usa "Enviar a Mantenimiento Urgente"
   Estado: MANTENIMIENTO, Assignment: ACTIVA ✅
3. Dispositivo reparado → Admin quiere devolverlo al empleado
4. Admin usa "Marcar como Disponible"
   ERROR: Bloqueado por validación de asignación activa ❌
```

## Decisión del Usuario

**El dispositivo debe volver a ASIGNADO** manteniendo la asignación activa.
- El empleado sigue siendo responsable durante el mantenimiento
- Después de la reparación, el dispositivo regresa al empleado sin cerrar la asignación
- No se requiere crear una nueva asignación

## Objetivo

Crear un nuevo endpoint que permita retornar un dispositivo de MANTENIMIENTO a ASIGNADO cuando hay una asignación activa.

## Solución Propuesta

### Opción A: Nuevo Endpoint `return-from-maintenance` (RECOMENDADA)

Crear un nuevo endpoint específico para retornar dispositivos de mantenimiento urgente.

#### Nuevo Endpoint: `POST /api/devices/{id}/return-from-maintenance/`

**Archivo**: `backend/apps/devices/views.py`

**Ubicación**: Añadir después del endpoint `mark-available` (aprox. línea 180)

**Propósito**: Retornar un dispositivo de MANTENIMIENTO a ASIGNADO cuando tiene asignación activa

**Validaciones**:
1. ✅ Solo desde estado MANTENIMIENTO
2. ✅ DEBE tener asignación activa (validación inversa a `mark-available`)
3. ✅ No permitir si está en estado final (BAJA, ROBO)

**Lógica**:
```python
@action(detail=True, methods=['post'], url_path='return-from-maintenance')
def return_from_maintenance(self, request, pk=None):
    """
    Retorna un dispositivo de mantenimiento urgente al estado ASIGNADO.
    Solo válido cuando el dispositivo tiene una asignación activa.
    """
    device = self.get_object()
    observaciones = request.data.get('observaciones', '').strip()

    # VALIDACIÓN 1: Solo desde MANTENIMIENTO
    if device.estado != 'MANTENIMIENTO':
        return Response({
            'error': 'Solo se pueden retornar dispositivos que están en MANTENIMIENTO'
        }, status=status.HTTP_400_BAD_REQUEST)

    # VALIDACIÓN 2: No desde estados finales (ya cubierto por validación 1, pero por consistencia)
    if device.estado in Device.FINAL_STATES:
        return Response({
            'error': f'No se puede cambiar el estado de un dispositivo en {device.estado}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # VALIDACIÓN 3: DEBE tener asignación activa
    if not device.has_active_assignment():
        return Response({
            'error': 'Este dispositivo no tiene asignación activa. '
                    'Use "Marcar como Disponible" para dispositivos sin asignación.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Cambiar estado a ASIGNADO con auditoría
    device.change_status('ASIGNADO', user=request.user)

    # Serializar y retornar
    serializer = DeviceSerializer(device)
    return Response({
        'message': f'Dispositivo retornado de mantenimiento. Ahora está ASIGNADO nuevamente.',
        'device': serializer.data
    })
```

**Parámetros**: `{ observaciones?: string }` (opcional)

**Retorna**:
```json
{
  "message": "Dispositivo retornado de mantenimiento. Ahora está ASIGNADO nuevamente.",
  "device": { /* Device serializado */ }
}
```

---

### Modificación al Endpoint Existente `mark-available`

**Archivo**: `backend/apps/devices/views.py` (línea 128-180)

**Cambio**: Mejorar mensaje de error para guiar al usuario

**Antes**:
```python
if device.has_active_assignment():
    return Response({
        'error': 'No se puede marcar como disponible un dispositivo con asignación activa. '
                'Debe registrar la devolución primero.'
    })
```

**Después**:
```python
if device.has_active_assignment():
    return Response({
        'error': 'No se puede marcar como disponible un dispositivo con asignación activa. '
                'Si el dispositivo está en mantenimiento urgente, use "Retornar de Mantenimiento". '
                'Si quiere finalizar la asignación, registre la devolución primero.'
    }, status=status.HTTP_400_BAD_REQUEST)
```

---

### Resumen de Endpoints Después del Fix

| Endpoint | Desde | Hacia | Requiere Asignación | Uso |
|----------|-------|-------|-------------------|-----|
| `send-to-maintenance` | DISPONIBLE/ASIGNADO | MANTENIMIENTO | No | Mantenimiento preventivo o urgente |
| `mark-available` | MANTENIMIENTO | DISPONIBLE | ❌ NO debe tener | Reparación completada (sin asignación) |
| `return-from-maintenance` ✨ NEW | MANTENIMIENTO | ASIGNADO | ✅ DEBE tener | Retorno de mantenimiento urgente |
| `mark-as-retired` | DISPONIBLE/ASIGNADO/MANTENIMIENTO | BAJA | ⚠️ Si tiene, se finaliza automáticamente | Dar de baja dispositivo |

---

## Frontend

### 1. Añadir Método al Service Layer

**Archivo**: `frontend/lib/services/device-service.ts`

**Ubicación**: Añadir después del método `markAvailable` (aprox. línea 125)

```typescript
async returnFromMaintenance(id: number, data?: { observaciones?: string }): Promise<{ message: string; device: Device }> {
  return apiClient.post<{ message: string; device: Device }>(`/devices/${id}/return-from-maintenance/`, data || {})
},
```

### 2. Modificar DeviceModal - Lógica Condicional de Botones

**Archivo**: `frontend/components/modals/device-modal.tsx`

**Ubicación**: Sección "Acciones de Estado" (líneas 586-625)

**Cambio**: Dividir el botón de MANTENIMIENTO en dos opciones

**Antes**:
```tsx
{device.estado === "MANTENIMIENTO" && (
  <Button type="button" variant="outline" size="sm" onClick={handleMarkAvailable}>
    <CheckCircle className="mr-2 h-4 w-4" />
    Marcar como Disponible
  </Button>
)}
```

**Después**:
```tsx
{device.estado === "MANTENIMIENTO" && (
  <>
    {device.asignacion_activa ? (
      // Caso: Mantenimiento urgente (tiene asignación)
      <Button type="button" variant="outline" size="sm" onClick={handleReturnFromMaintenance}>
        <RotateCw className="mr-2 h-4 w-4" />
        Retornar de Mantenimiento
      </Button>
    ) : (
      // Caso: Mantenimiento preventivo (sin asignación)
      <Button type="button" variant="outline" size="sm" onClick={handleMarkAvailable}>
        <CheckCircle className="mr-2 h-4 w-4" />
        Marcar como Disponible
      </Button>
    )}
  </>
)}
```

**Nota**: Requiere que el campo `asignacion_activa` esté disponible en el objeto Device del frontend.

### 3. Añadir Handler en DeviceModal

**Archivo**: `frontend/components/modals/device-modal.tsx`

**Ubicación**: Después del handler `handleMarkAvailable` (aprox. línea 211)

```typescript
const handleReturnFromMaintenance = () => {
  setActionModal({ open: true, type: "return-from-maintenance" })
}
```

### 4. Modificar Switch en handleActionConfirm

**Archivo**: `frontend/components/modals/device-modal.tsx`

**Ubicación**: Dentro del switch del handler `handleActionConfirm` (aprox. línea 224-243)

**Añadir nuevo case**:
```typescript
case "return-from-maintenance":
  response = await deviceService.returnFromMaintenance(device.id, {
    observaciones: data.observaciones,
  })
  break
```

### 5. Actualizar DeviceActionModal Props

**Archivo**: `frontend/components/modals/device-modal.tsx`

**Ubicación**: Props del DeviceActionModal (líneas 642-671)

**Añadir case en title**:
```typescript
title={
  actionModal.type === "maintenance"
    ? "Enviar a Mantenimiento"
    : actionModal.type === "available"
    ? "Marcar como Disponible"
    : actionModal.type === "return-from-maintenance"
    ? "Retornar de Mantenimiento"
    : "Dar de Baja"
}
```

**Añadir case en description**:
```typescript
description={
  actionModal.type === "maintenance"
    ? /* ... */
    : actionModal.type === "available"
    ? "El dispositivo será marcado como disponible y estará listo para ser asignado nuevamente."
    : actionModal.type === "return-from-maintenance"
    ? "El dispositivo será retornado al estado ASIGNADO. La asignación permanecerá activa y el empleado volverá a tener el dispositivo."
    : "El dispositivo será dado de baja permanentemente. Por favor, indique el motivo de la baja."
}
```

**Añadir case en confirmButtonText**:
```typescript
confirmButtonText={
  actionModal.type === "maintenance"
    ? "Enviar a Mantenimiento"
    : actionModal.type === "available"
    ? "Marcar Disponible"
    : actionModal.type === "return-from-maintenance"
    ? "Retornar al Empleado"
    : "Dar de Baja"
}
```

### 6. Actualizar TypeScript Type Definition

**Archivo**: `frontend/components/modals/device-modal.tsx`

**Ubicación**: Definición del estado `actionModal` (aprox. línea 35)

**Antes**:
```typescript
const [actionModal, setActionModal] = useState<{
  open: boolean
  type: "maintenance" | "available" | "retired" | null
}>({ open: false, type: null })
```

**Después**:
```typescript
const [actionModal, setActionModal] = useState<{
  open: boolean
  type: "maintenance" | "available" | "return-from-maintenance" | "retired" | null
}>({ open: false, type: null })
```

### 7. Añadir Import de Icono

**Archivo**: `frontend/components/modals/device-modal.tsx`

**Ubicación**: Imports de iconos (línea 15)

**Añadir**: `RotateCw`

```typescript
import { Info, DollarSign, AlertTriangle, Wrench, CheckCircle, Trash2, RotateCw } from "lucide-react"
```

---

## Backend: Consideración sobre `asignacion_activa`

El objeto `Device` en el frontend necesita saber si tiene asignación activa para mostrar el botón correcto.

### Opción 1: Añadir campo al Serializer (RECOMENDADA)

**Archivo**: `backend/apps/devices/serializers.py`

**Añadir SerializerMethodField**:

```python
class DeviceSerializer(serializers.ModelSerializer):
    # ... campos existentes ...
    asignacion_activa = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = [
            # ... campos existentes ...
            'asignacion_activa',
        ]
        read_only_fields = [
            # ... campos existentes ...
            'asignacion_activa',
        ]

    def get_asignacion_activa(self, obj):
        """Retorna True si el dispositivo tiene asignación activa"""
        return obj.has_active_assignment()
```

### Opción 2: Derivar en Frontend

Verificar si `history.active_assignments > 0` en el frontend. Menos óptimo porque requiere cargar el historial.

---

## Archivos a Modificar

### Backend (Django)

1. **`backend/apps/devices/views.py`**
   - Línea ~180: Añadir nuevo endpoint `return_from_maintenance`
   - Línea ~160: Mejorar mensaje de error en `mark_available`

2. **`backend/apps/devices/serializers.py`**
   - Añadir campo `asignacion_activa` como SerializerMethodField

### Frontend (Next.js/React)

3. **`frontend/lib/services/device-service.ts`**
   - Línea ~125: Añadir método `returnFromMaintenance`

4. **`frontend/components/modals/device-modal.tsx`**
   - Línea 15: Añadir import `RotateCw`
   - Línea 35: Actualizar type definition de `actionModal`
   - Línea ~211: Añadir handler `handleReturnFromMaintenance`
   - Línea ~235: Añadir case en switch de `handleActionConfirm`
   - Línea ~600: Modificar lógica condicional de botones MANTENIMIENTO
   - Líneas 646-669: Actualizar props de DeviceActionModal (title, description, confirmButtonText)

5. **`frontend/lib/types.ts`**
   - Añadir campo `asignacion_activa?: boolean` al interface `Device`

---

## Diagrama de Flujo Completo Después del Fix

```
FLUJOS DISPONIBLES:

1. MANTENIMIENTO PREVENTIVO (Sin asignación):
   DISPONIBLE → [send-to-maintenance] → MANTENIMIENTO → [mark-available] → DISPONIBLE

2. MANTENIMIENTO URGENTE (Con asignación) ✨ FIXED:
   ASIGNADO → [send-to-maintenance] → MANTENIMIENTO → [return-from-maintenance] → ASIGNADO

   Detalles:
   - Asignación permanece ACTIVA durante todo el flujo
   - Empleado sigue siendo responsable del dispositivo
   - No se requiere crear nueva asignación al retornar

3. DAR DE BAJA:
   DISPONIBLE → [mark-as-retired] → BAJA (final)
   MANTENIMIENTO → [mark-as-retired] → BAJA (final)

4. FLUJOS AUTOMÁTICOS (Sin cambios):
   - Crear asignación: DISPONIBLE → ASIGNADO (signal)
   - Devolver en buen estado: ASIGNADO → DISPONIBLE (Return + signal)
   - Devolver con daños: ASIGNADO → MANTENIMIENTO (Return + signal)
   - Reportar robo: ASIGNADO → ROBO (carta de descuento)
```

---

## Casos de Uso Cubiertos

| Caso | Flujo | Observaciones |
|------|-------|---------------|
| Mantenimiento preventivo | DISPONIBLE → MANT → DISPONIBLE | via mark-available |
| Mantenimiento urgente | ASIGNADO → MANT → ASIGNADO ✅ | via return-from-maintenance (NEW) |
| Reparación con devolución | ASIGNADO → MANT (Return) → DISPONIBLE | via signal + mark-available |
| Dar de baja disponible | DISPONIBLE → BAJA | via mark-as-retired |
| Dar de baja en mant | MANT → BAJA | via mark-as-retired |
| Robo/pérdida | ASIGNADO → ROBO | via carta de descuento |

---

## Beneficios de Esta Solución

✅ **Flujo completo**: Ya no queda bloqueado el retorno desde mantenimiento urgente
✅ **Validación robusta**: Cada endpoint valida el contexto apropiado (con/sin asignación)
✅ **UX Clara**: Botones condicionales según estado del dispositivo
✅ **Auditoría completa**: Todos los cambios usan `change_status()`
✅ **Mensajes guía**: Si el usuario se equivoca de acción, el error le indica qué hacer
✅ **Backward compatible**: No rompe flujos existentes

---

## Alternativas Consideradas y Rechazadas

### ❌ Alternativa 1: Permitir mark-available con asignación activa
**Problema**: Inconsistente. `mark-available` implica que el dispositivo queda sin dueño, pero la asignación sigue activa.

### ❌ Alternativa 2: Auto-finalizar asignación al enviar a mantenimiento
**Problema**: Rompe el caso de uso de "mantenimiento urgente". El empleado pierde la responsabilidad del dispositivo durante la reparación.

### ✅ Alternativa 3: Nuevo endpoint específico (SELECCIONADA)
**Ventajas**:
- Semánticamente claro: "return" implica regresar al estado previo
- Validaciones específicas y explícitas
- No modifica comportamiento de endpoints existentes
- UX intuitiva: botón diferente según contexto

---

## Testing Requerido

### Backend
1. ✅ `return-from-maintenance` permite MANTENIMIENTO → ASIGNADO con asignación activa
2. ✅ `return-from-maintenance` rechaza si NO hay asignación activa
3. ✅ `return-from-maintenance` rechaza si no está en MANTENIMIENTO
4. ✅ `mark-available` rechaza si HAY asignación activa (sin cambios)
5. ✅ `send-to-maintenance` permite desde ASIGNADO (sin cambios)
6. ✅ Auditoría se registra correctamente en todos los endpoints

### Frontend
7. ✅ Botón "Retornar de Mantenimiento" visible cuando MANTENIMIENTO + asignación activa
8. ✅ Botón "Marcar como Disponible" visible cuando MANTENIMIENTO + sin asignación
9. ✅ Modal de confirmación muestra mensaje correcto según acción
10. ✅ Después de retornar, dispositivo aparece como ASIGNADO

---

## Impacto y Riesgos

### Impacto
- **Cambios mínimos**: Solo 1 nuevo endpoint + validación mejorada + campo calculado
- **No breaking**: Los flujos existentes no se modifican
- **UX mejorada**: Usuarios ya no quedan bloqueados

### Riesgos
- **Bajo**: Solo añade funcionalidad nueva, no modifica lógica existente
- **Testing**: Validar que los flujos automáticos (signals) sigan funcionando
- **Frontend**: Requiere que `asignacion_activa` esté disponible en el serializer

---

## Notas de Implementación

1. El campo `asignacion_activa` debe añadirse al serializer ANTES de los cambios en frontend
2. El endpoint `return-from-maintenance` debe ser idempotente (permitir múltiples llamadas)
3. Considerar añadir observaciones al log de auditoría si se proporcionan
4. El icono `RotateCw` (rotar en sentido contrario al reloj) representa visualmente "regresar al estado anterior"

---

## Resumen Ejecutivo

**Problema**: Flujo de mantenimiento urgente incompleto - no hay forma de retornar el dispositivo al empleado.

**Solución**:
- Nuevo endpoint `return-from-maintenance` para MANTENIMIENTO → ASIGNADO (con asignación)
- Mantener `mark-available` para MANTENIMIENTO → DISPONIBLE (sin asignación)
- UX condicional: botón correcto según contexto

**Resultado**: Flujo completo y simétrico para mantenimiento urgente
    # ...
    read_only_fields = [
        'id',
        'created_at',
        'updated_at',
        'created_by',
        'estado',  # ← AÑADIR AQUÍ
        'sucursal_detail',
        # ...
    ]
```

**Impacto**:
- El campo `estado` NO se puede modificar via PATCH /devices/{id}/
- Solo se puede cambiar via los nuevos endpoints de acción
- Los signals siguen funcionando normalmente (usan `change_status()` directamente)

#### 2. Eliminar validaciones de cambio de estado

Eliminar las validaciones de las líneas 220-236 en `DeviceSerializer.validate()`:
- Ya no son necesarias porque el campo es read-only
- Las validaciones se mueven a cada endpoint específico

### Backend: Mantener Flujos Automáticos

Los signals y carta de descuento NO cambian:

✅ **Signal `assignment_post_save`**: DISPONIBLE → ASIGNADO (sigue funcionando)
✅ **Signal `return_post_save`**: ASIGNADO → DISPONIBLE/MANTENIMIENTO (sigue funcionando)
✅ **Carta de descuento**: ASIGNADO → ROBO (sigue funcionando)

Estos flujos YA usan `change_status()` por lo que YA tienen auditoría.

### Frontend: Campo Estado Solo Lectura

#### 1. Modificar DeviceModal

**Archivo**: `frontend/components/modals/device-modal.tsx`

**Cambios en el Select de estado** (líneas 348-380):

```tsx
<Select
  value={field.value}
  onValueChange={field.onChange}
  disabled={true}  // ← SIEMPRE DESHABILITADO
>
  {/* ... opciones ... */}
</Select>
```

**Mensaje informativo** (añadir después del Select):

```tsx
<p className="text-xs text-muted-foreground mt-1">
  Los cambios de estado se realizan a través de las acciones en la página de detalle del dispositivo.
</p>
```

#### 2. Crear Botones de Acción en Página de Detalle

**Archivo**: `frontend/app/dashboard/devices/[id]/page.tsx`

**Añadir sección de acciones** (después de la información del dispositivo):

```tsx
{/* Acciones de Estado */}
<div className="flex gap-2 mt-4">
  {device.estado === 'DISPONIBLE' && (
    <Button onClick={handleSendToMaintenance}>
      <Wrench className="mr-2 h-4 w-4" />
      Enviar a Mantenimiento
    </Button>
  )}

  {device.estado === 'ASIGNADO' && (
    <Button onClick={handleSendToMaintenance}>
      <Wrench className="mr-2 h-4 w-4" />
      Enviar a Mantenimiento Urgente
    </Button>
  )}

  {device.estado === 'MANTENIMIENTO' && (
    <Button onClick={handleMarkAvailable}>
      <CheckCircle className="mr-2 h-4 w-4" />
      Marcar como Disponible
    </Button>
  )}

  {(device.estado === 'DISPONIBLE' || device.estado === 'MANTENIMIENTO') && (
    <Button variant="destructive" onClick={handleRetire}>
      <Trash2 className="mr-2 h-4 w-4" />
      Dar de Baja
    </Button>
  )}
</div>
```

**Notas**:
- Los botones solo se muestran cuando la acción es válida para el estado actual
- Cada botón abre un modal de confirmación con campos para motivo/observaciones
- Después de ejecutar la acción, recarga el dispositivo para mostrar el nuevo estado

#### 3. Crear Servicio para Nuevos Endpoints

**Archivo**: `frontend/lib/services/device-service.ts`

Añadir nuevos métodos:

```typescript
export const deviceService = {
  // ... métodos existentes ...

  sendToMaintenance: (id: number, data: { motivo: string; observaciones?: string }) =>
    apiClient.post(`/devices/${id}/send-to-maintenance/`, data),

  markAvailable: (id: number, data: { observaciones?: string }) =>
    apiClient.post(`/devices/${id}/mark-available/`, data),

  markAsRetired: (id: number, data: { motivo: string; observaciones?: string }) =>
    apiClient.post(`/devices/${id}/mark-as-retired/`, data),
}
```

### Casos de Uso Cubiertos

#### ✅ Flujos Automáticos (Sin Cambios)

1. **Asignar dispositivo**: DISPONIBLE → ASIGNADO (signal)
2. **Devolver en buen estado**: ASIGNADO → DISPONIBLE (signal via Return)
3. **Devolver con daños**: ASIGNADO → MANTENIMIENTO (signal via Return)
4. **Reportar robo**: ASIGNADO → ROBO (carta de descuento)

#### ✅ Flujos Administrativos (Nuevos Endpoints)

5. **Mantenimiento preventivo**: DISPONIBLE → MANTENIMIENTO (botón)
6. **Mantenimiento urgente**: ASIGNADO → MANTENIMIENTO (botón, asignación sigue activa)
7. **Salir de mantenimiento**: MANTENIMIENTO → DISPONIBLE (botón)
8. **Dar de baja**: DISPONIBLE/MANTENIMIENTO → BAJA (botón)

#### ❌ Bloqueados

9. **ASIGNADO → DISPONIBLE**: Debe usar devolución
10. **ASIGNADO → BAJA**: Debe devolver primero
11. **BAJA/ROBO → cualquier estado**: Estados finales inmutables

## Archivos a Modificar

### Backend (Django)

1. **`backend/apps/devices/serializers.py`**
   - Línea 91-104: Añadir `'estado'` a `read_only_fields`
   - Líneas 220-236: Eliminar validaciones de cambio de estado (ya no necesarias)

2. **`backend/apps/devices/views.py`**
   - Añadir 3 nuevos `@action` decorators en `DeviceViewSet`:
     - `send_to_maintenance` (POST)
     - `mark_available` (POST)
     - `mark_as_retired` (POST)
   - Cada uno debe:
     - Validar transición permitida
     - Llamar a `device.change_status(nuevo_estado, user=request.user)`
     - Retornar device actualizado con serializer

### Frontend (Next.js/React)

3. **`frontend/components/modals/device-modal.tsx`**
   - Línea 355: Cambiar `disabled={isEstadoFinal}` por `disabled={true}`
   - Añadir mensaje informativo debajo del Select

4. **`frontend/app/dashboard/devices/[id]/page.tsx`**
   - Añadir sección de botones de acción condicionales
   - Implementar handlers con modales de confirmación
   - Añadir imports necesarios (iconos, modales)

5. **`frontend/lib/services/device-service.ts`**
   - Añadir 3 nuevos métodos para los endpoints de acción

6. **`frontend/components/modals/` (NUEVO)**
   - Crear `device-action-modal.tsx`: Modal reutilizable para confirmar acciones
   - Campos: motivo (required para maintenance/retired), observaciones (optional)

## Beneficios

### 🎯 Auditoría Completa
- **TODOS** los cambios de estado ahora usan `change_status()`
- Registro completo de quién, cuándo y por qué cambió cada estado
- Trazabilidad total en `AuditLog`

### 🔒 Control y Validación
- Cada acción tiene sus propias validaciones específicas
- No se puede "saltarse" el flujo usando edición manual
- Transiciones de estado explícitas y documentadas

### 👥 UX Mejorada
- Acciones claras con nombres descriptivos
- Usuario sabe exactamente qué hace cada botón
- Campo de estado siempre visible pero protegido
- Mensajes de confirmación con contexto

### 📊 Consistencia
- Una sola forma de cambiar estado para cada caso
- Flujos automáticos y manuales claramente separados
- Menos confusión sobre cuándo usar qué

## Impacto y Riesgos

### Impacto

**Cambios Breaking**:
- ❌ El campo `estado` ya NO es editable via PATCH
- ❌ Frontend debe usar nuevos endpoints

**Sin Breaking Changes**:
- ✅ Signals siguen funcionando igual
- ✅ Carta de descuento sigue funcionando
- ✅ Return sigue funcionando
- ✅ GET endpoints sin cambios

### Riesgos

**Bajo**:
- Solo añade endpoints nuevos y hace un campo read-only
- No modifica lógica existente de signals
- Los flujos correctos actuales no se rompen

**Migración Frontend**:
- Requiere actualizar DeviceModal
- Requiere crear nueva página de detalle con botones
- Requiere crear modales de confirmación

## Alternativas Consideradas

### ❌ Alternativa 1: Mantener edición manual con auditoría
**Rechazada porque**:
- Sigue permitiendo cambios arbitrarios
- No mejora la UX
- Dificulta validaciones específicas por transición

### ❌ Alternativa 2: TODO via devoluciones
**Rechazada porque**:
- Demasiado complejo para casos administrativos simples
- Crear "asignaciones administrativas" es overhead innecesario
- No refleja la realidad operativa

### ✅ Alternativa 3: Acciones específicas (Seleccionada)
**Por qué**:
- Balance perfecto entre control y flexibilidad
- UX clara e intuitiva
- Auditoría completa garantizada
- Validaciones específicas por caso de uso

## Orden de Implementación

### Fase 1: Backend (Crítico)
1. Modificar `DeviceSerializer` → `estado` read-only
2. Crear 3 nuevos endpoints en `DeviceViewSet`
3. Eliminar validaciones obsoletas de `DeviceSerializer.validate()`
4. Verificar que signals siguen funcionando

### Fase 2: Frontend (UI)
5. Modificar `DeviceModal` → campo estado disabled
6. Crear `DeviceActionModal` para confirmaciones
7. Añadir métodos en `device-service.ts`
8. Actualizar página de detalle con botones de acción

### Fase 3: Testing
9. Probar cada endpoint con diferentes estados
10. Verificar auditoría se registra correctamente
11. Probar signals no se rompieron
12. Testing end-to-end en frontend

## Consideraciones Adicionales

### Estados Finales (BAJA, ROBO)
- Siguen siendo inmutables
- No hay endpoints para salir de estos estados
- Son estados "de fin de vida" del dispositivo

### Mantenimiento con Asignación Activa
- Flujo actual se **mantiene**
- Permite ASIGNADO → MANTENIMIENTO
- La asignación sigue ACTIVA (el dispositivo sigue asignado al empleado)
- Al salir de mantenimiento puede volver a ASIGNADO (via edición manual por ahora)
- **Nota**: Considerar en el futuro añadir endpoint `return-from-maintenance` para este flujo

### Compatibilidad con Fixtures/Seeds
- Al hacer `estado` read-only, los fixtures/seeds deben:
  - Crear dispositivos con `estado='DISPONIBLE'` por defecto
  - O usar `force_insert=True` si necesitan estados específicos
  - O crear via ORM usando `change_status()` después de crear

## Documentación Requerida

1. **README actualizado**: Documentar nuevos endpoints de acción
2. **Comentarios en código**: Explicar por qué `estado` es read-only
3. **Guía de usuario**: Cómo cambiar estados via botones de acción
4. **Notas de release**: Avisar del breaking change en API

---

## Resumen Ejecutivo

**Problema**: Campo `estado` editable manualmente causa falta de auditoría e inconsistencias.

**Solución**:
- Campo `estado` pasa a **solo lectura**
- Crear **3 endpoints específicos** para acciones administrativas
- **Botones de acción** en frontend en lugar de campo editable
- **Auditoría completa** garantizada via `change_status()`

**Resultado**: Sistema más robusto, trazable y con mejor UX.
