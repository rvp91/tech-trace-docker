"""
Validadores personalizados para el módulo de empleados.
"""
from django.core.exceptions import ValidationError
import re


def validate_rut(value):
    """
    Valida el formato y dígito verificador de un RUT chileno.

    Formatos aceptados:
    - 12345678-9
    - 12.345.678-9

    Args:
        value (str): RUT a validar

    Raises:
        ValidationError: Si el RUT no tiene un formato válido o el dígito verificador es incorrecto
    """
    if not value:
        raise ValidationError("El RUT es obligatorio")

    # Remover puntos y guiones, dejar solo números y posible K
    rut_clean = value.replace('.', '').replace('-', '').upper()

    # Validar formato básico (7-8 dígitos + dígito verificador)
    if not re.match(r'^\d{7,8}[0-9K]$', rut_clean):
        raise ValidationError(
            "El RUT debe tener el formato XX.XXX.XXX-X o XXXXXXXX-X (ej: 12.345.678-9 o 12345678-9)"
        )

    # Separar número y dígito verificador
    rut_number = rut_clean[:-1]
    dv_provided = rut_clean[-1]

    # Calcular dígito verificador
    reversed_digits = map(int, reversed(str(rut_number)))
    factors = [2, 3, 4, 5, 6, 7]

    s = 0
    for i, digit in enumerate(reversed_digits):
        s += digit * factors[i % 6]

    remainder = s % 11
    dv_calculated = 11 - remainder

    # Convertir el dígito verificador calculado a string
    if dv_calculated == 11:
        dv_calculated = '0'
    elif dv_calculated == 10:
        dv_calculated = 'K'
    else:
        dv_calculated = str(dv_calculated)

    # Comparar dígito verificador
    if dv_provided != dv_calculated:
        raise ValidationError(
            f"El dígito verificador del RUT es incorrecto. Debe ser {dv_calculated}"
        )

    return value


def format_rut(rut):
    """
    Formatea un RUT a su forma estándar con puntos y guión.

    Args:
        rut (str): RUT sin formato

    Returns:
        str: RUT formateado (ej: 12.345.678-9)
    """
    # Remover puntos y guiones existentes
    rut_clean = rut.replace('.', '').replace('-', '').upper()

    # Separar número y dígito verificador
    rut_number = rut_clean[:-1]
    dv = rut_clean[-1]

    # Formatear con puntos
    formatted = ""
    for i, digit in enumerate(reversed(rut_number)):
        if i > 0 and i % 3 == 0:
            formatted = "." + formatted
        formatted = digit + formatted

    return f"{formatted}-{dv}"
