"""
Servicio de generación de PDFs para cartas de responsabilidad y descuento.
Utiliza ReportLab para crear documentos PDF con el formato estándar de las empresas.
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from django.conf import settings
import os


# Constantes de configuración
LOGO_PATH = os.path.join(settings.BASE_DIR.parent, 'docs', 'logo.png')

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


class PDFLetterGenerator:
    """
    Generador de cartas PDF para responsabilidad y descuento.
    """

    def __init__(self, company_key='pompeyo_carrasco'):
        """
        Inicializa el generador con la empresa seleccionada.

        Args:
            company_key: Clave de la empresa ('pompeyo_carrasco' o 'pompeyo_automoviles')
        """
        if company_key not in COMPANIES:
            raise ValueError(f"Empresa no válida: {company_key}")

        company = COMPANIES[company_key]
        self.company_name = company['name']
        self.company_rut = company['rut']

    def _format_date_spanish(self, date):
        """
        Formatea una fecha en español.

        Args:
            date: Objeto datetime

        Returns:
            str: Fecha formateada como "04 de Julio del 2025"
        """
        months = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
            5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
            9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }
        day = str(date.day).zfill(2)
        month = months[date.month]
        year = date.year
        return f"{day} de {month} del {year}"

    def _format_currency(self, amount):
        """
        Formatea un monto como moneda chilena.

        Args:
            amount: Monto numérico

        Returns:
            str: Monto formateado como "$100.000"
        """
        # Convertir a entero y formatear con puntos como separadores de miles
        amount_int = int(amount)
        formatted = f"{amount_int:,}".replace(',', '.')
        return f"${formatted}.-"

    def _draw_base_template(self, c, title):
        """
        Dibuja el template base: header con logo, título y footer.

        Args:
            c: Canvas de ReportLab
            title: Título de la carta
        """
        width, height = letter

        # Header - Logo con efecto marca de agua (60% opacidad)
        if os.path.exists(LOGO_PATH):
            try:
                img = ImageReader(LOGO_PATH)
                c.saveState()
                c.setFillAlpha(0.6)
                c.drawImage(img, 0.75*inch, height - 1.2*inch, width=2*inch, height=0.8*inch, preserveAspectRatio=True, mask='auto')
                c.restoreState()
            except Exception as e:
                print(f"Error al cargar logo: {e}")

        # Título (espacio reducido 25%)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(width/2, height - 1.847*inch, title)

        # Footer - Separado en dos partes
        c.setFont("Helvetica", 9)
        # Texto izquierdo
        c.drawString(0.75*inch, 0.5*inch, "Departamento de Informática y Redes")
        # Texto derecho
        c.drawRightString(width - 0.75*inch, 0.5*inch, "Empresas Pompeyo Carrasco")

    def _draw_laptop_content(self, c, assignment, extra_data):
        """
        Dibuja el contenido específico para carta de responsabilidad de laptop.

        Args:
            c: Canvas de ReportLab
            assignment: Instancia de Assignment
            extra_data: Datos adicionales del formulario
        """
        width, height = letter
        y_position = height - 2.5*inch  # Espacio entre título y contenido
        y_start = y_position

        empleado = assignment.empleado
        dispositivo = assignment.dispositivo
        fecha = datetime.now()

        # Párrafo introductorio
        c.setFont("Helvetica", 11)
        intro_text = (
            f"En Santiago {self._format_date_spanish(fecha)}, entre la Empresa {self.company_name} "
            f"RUT: {self.company_rut} Y don(a) {empleado.nombre_completo} RUT: {empleado.rut} "
            f'en adelante denominado "el (la) trabajador(a)", se ha convenido la siguiente carta de responsabilidad:'
        )

        # Dibujar texto justificado
        y_position = self._draw_justified_text(c, intro_text, 0.75*inch, y_position, width - 1.5*inch)

        y_position -= 0.2*inch

        # PRIMERO
        y_start_primero = y_position
        # Dibujar título en la misma línea
        c.setFont("Helvetica-Bold", 11)
        c.drawString(0.75*inch, y_position, "PRIMERO: ")
        # Preparar y medir para dibujar la primera línea del texto justo después de los dos puntos
        c.setFont("Helvetica", 11)
        primero_text = "Por medio de la presente carta el trabajador declara recibir las siguientes especies de propiedad de la empresa:"
        title_width = c.stringWidth("PRIMERO: ", "Helvetica-Bold", 11)
        gap = 4  # puntos de separación
        first_x = 0.75*inch + title_width + gap

        content_width = width - 1.5*inch
        available_first = content_width - title_width - gap

        words = primero_text.split()
        first_line_words = []
        remaining_words = words[:]
        while remaining_words:
            test = ' '.join(first_line_words + [remaining_words[0]])
            if c.stringWidth(test, "Helvetica", 11) <= available_first:
                first_line_words.append(remaining_words.pop(0))
            else:
                break

        if first_line_words:
            first_line = ' '.join(first_line_words)
            c.drawString(first_x, y_position, first_line)

        from reportlab.lib.units import inch as _inch
        y_position -= 0.18 * _inch

        if remaining_words:
            remaining_text = ' '.join(remaining_words)
            y_position = self._draw_justified_text(c, remaining_text, 0.75*inch, y_position, width - 1.5*inch)

        y_position -= 0.12*inch

        # Especificaciones del equipo
        y_start_specs = y_position
        equipo_marca_modelo = f"{dispositivo.marca} {dispositivo.modelo}"
        specs = [
            ("Equipo Entregado", equipo_marca_modelo),
            ("N/S", dispositivo.numero_serie or "N/A"),
            ("Procesador", extra_data.get('procesador', '') or 'N/A'),
            ("Disco Duro", extra_data.get('disco_duro', '') or 'N/A'),
            ("Memoria", extra_data.get('memoria_ram', '') or 'N/A'),
            ("Unidad DVD", "SI" if extra_data.get('tiene_dvd', False) else "NO"),
            ("Cargador", "Si" if extra_data.get('tiene_cargador', True) else "NO"),
            ("Batería", "Si" if extra_data.get('tiene_bateria', True) else "NO"),
            ("Mouse", "SI" if extra_data.get('tiene_mouse', False) else "NO"),
            ("Candado", "SI" if extra_data.get('tiene_candado', False) else "NO"),
        ]

        for label, value in specs:
            c.setFont("Helvetica", 11)
            c.drawString(0.75*inch, y_position, f"{label}")
            c.setFont("Helvetica", 11)
            c.drawString(2.5*inch, y_position, f": {value}")
            y_position -= 0.18*inch

        y_position -= 0.2*inch

        # Cláusulas siguientes
        clauses = [
            ("SEGUNDO:", "Se deja constancia que el trabajador, deberá responder por cualquier daño o pérdida parcial o total de la(s) especie(s) individualizadas más arriba."),
            ("TERCERO:", "El trabajador autoriza desde ya el descuento en su remuneración mensual, el valor de los gastos en que incurra la empresa para el arreglo o reposición de nuevos equipos y/o accesorios, para el buen desempeño de sus labores."),
            ("CUARTO:", "En el caso de término de la relación laboral, el trabajador se compromete a realizar la devolución del equipamiento y accesorios entregados, siendo el área informática quien evalúe el buen estado de estos."),
            ("QUINTO:", "En el caso de no devolución del equipo y/o accesorios, o una devolución en mal estado de los elemento, el trabajador autoriza desde ya se descuente sobre la totalidad de los emolumentos que resulten del cálculo del finiquito el valor estos productos, a precio de mercado."),
        ]

        for clause_title, clause_text in clauses:
            # Dibujar título (en negrita) en la línea actual
            c.setFont("Helvetica-Bold", 11)
            c.drawString(0.75*inch, y_position, clause_title)
            # Preparar para dibujar la primera línea del texto justo después de los dos puntos
            c.setFont("Helvetica", 11)
            title_width = c.stringWidth(clause_title + ' ', "Helvetica-Bold", 11)
            gap = 4  # puntos de separación entre título y texto
            first_x = 0.75*inch + title_width + gap

            # Disponible para la primera línea (en puntos)
            content_width = width - 1.5*inch
            available_first = content_width - title_width - gap

            # Construir primera línea hasta que no quepa
            words = clause_text.split()
            first_line_words = []
            remaining_words = words[:]
            while remaining_words:
                test = ' '.join(first_line_words + [remaining_words[0]])
                if c.stringWidth(test, c._fontname, c._fontsize) <= available_first:
                    first_line_words.append(remaining_words.pop(0))
                else:
                    break

            # Dibujar primera línea justo después del título
            if first_line_words:
                first_line = ' '.join(first_line_words)
                c.drawString(first_x, y_position, first_line)
            else:
                # Si no entra ninguna palabra en la primera línea, dejar una pequeña separación
                pass

            # Avanzar al siguiente renglón para el resto del texto
            from reportlab.lib.units import inch as _inch
            y_position -= 0.18 * _inch

            # Si quedan palabras, unir y justificar en todo el ancho del contenedor
            if remaining_words:
                remaining_text = ' '.join(remaining_words)
                y_position = self._draw_justified_text(c, remaining_text, 0.75*inch, y_position, width - 1.5*inch)

            y_position -= 0.12*inch

        # Declaración final
        c.setFont("Helvetica", 11)
        final_text = "Declaro recibir a mi entera satisfacción las especies individualizadas en la cláusula primera, y estoy de acuerdo en las exigencias estipulado en esta carta de responsabilidad."
        y_position = self._draw_justified_text(c, final_text, 0.75*inch, y_position, width - 1.5*inch)

        y_position -= 0.1*inch
        final_text2 = "La presente carta se firmar en dos ejemplares, quedando uno en poder del trabajador y el otro en el Depto. de RR.HH."
        y_position = self._draw_justified_text(c, final_text2, 0.75*inch, y_position, width - 1.5*inch)

        # Línea de firma
        y_position = 1.2*inch
        line_x_start = 0.75*inch + (width - 1.5*inch) / 4
        line_x_end = 0.75*inch + 3 * (width - 1.5*inch) / 4
        c.line(line_x_start, y_position, line_x_end, y_position)
        y_position -= 0.2*inch
        c.setFont("Helvetica", 10)
        c.drawCentredString(width/2, y_position, "Nombre Firma Rut del Trabajador")

    def _draw_phone_content(self, c, assignment, extra_data):
        """
        Dibuja el contenido específico para carta de responsabilidad de teléfono.

        Args:
            c: Canvas de ReportLab
            assignment: Instancia de Assignment
            extra_data: Datos adicionales del formulario
        """
        width, height = letter
        y_position = height - 2.5*inch  # Espacio entre título y contenido

        empleado = assignment.empleado
        dispositivo = assignment.dispositivo
        fecha = datetime.now()

        # Párrafo introductorio
        y_start = y_position
        c.setFont("Helvetica", 11)
        intro_text = (
            f"En Santiago {self._format_date_spanish(fecha)}, entre la Empresa {self.company_name}. "
            f"Rut Nº{self.company_rut} y don(a) {empleado.nombre_completo} Rut {empleado.rut} "
            f'en adelante denominado "el (la) trabajador(a)", se ha convenido la siguiente carta de responsabilidad:'
        )

        # Dibujar texto justificado
        y_position = self._draw_justified_text(c, intro_text, 0.75*inch, y_position, width - 1.5*inch)

        y_position -= 0.2*inch

        # PRIMERO
        y_start_primero = y_position
        # Dibujar título en la misma línea
        c.setFont("Helvetica-Bold", 11)
        c.drawString(0.75*inch, y_position, "PRIMERO: ")
        # Preparar y medir para dibujar la primera línea del texto justo después de los dos puntos
        c.setFont("Helvetica", 11)
        primero_text = "Por medio de la presente carta el trabajador declara recibir las siguientes especies de propiedad de la empresa:"
        title_width = c.stringWidth("PRIMERO: ", "Helvetica-Bold", 11)
        gap = 4  # puntos de separación
        first_x = 0.75*inch + title_width + gap

        content_width = width - 1.5*inch
        available_first = content_width - title_width - gap

        words = primero_text.split()
        first_line_words = []
        remaining_words = words[:]
        while remaining_words:
            test = ' '.join(first_line_words + [remaining_words[0]])
            if c.stringWidth(test, "Helvetica", 11) <= available_first:
                first_line_words.append(remaining_words.pop(0))
            else:
                break

        if first_line_words:
            first_line = ' '.join(first_line_words)
            c.drawString(first_x, y_position, first_line)

        from reportlab.lib.units import inch as _inch
        y_position -= 0.18 * _inch

        if remaining_words:
            remaining_text = ' '.join(remaining_words)
            y_position = self._draw_justified_text(c, remaining_text, 0.75*inch, y_position, width - 1.5*inch)

        y_position -= 0.12*inch

        # Tabla 2 columnas x 6 filas con los campos solicitados
        equipo_marca_modelo = f"{dispositivo.marca} {dispositivo.modelo}"
        valor_depreciado = dispositivo.get_valor_depreciado() or 0

        jefatura = extra_data.get('jefatura_nombre', 'N/A')
        cargo = empleado.cargo or 'N/A'
        sucursal = empleado.sucursal.nombre if hasattr(empleado, 'sucursal') and empleado.sucursal else 'N/A'

        table_width = width - 1.5 * inch
        table_x = (width - table_width) / 2
        col_w = table_width / 2
        row_h = 0.22 * inch

        rows = [
            ("Equipo Entregado:", equipo_marca_modelo, "N/S:", dispositivo.numero_serie or 'N/A'),
            ("Plan:", extra_data.get('plan_telefono', 'N/A'), "Minutos Disponibles:", extra_data.get('minutos_disponibles', 'N/A')),
            ("Cargador:", "SI" if extra_data.get('tiene_cargador', True) else "NO", "Audífonos:", "SI" if extra_data.get('tiene_audifonos', False) else "NO"),
            ("N ° de Teléfono:", dispositivo.numero_telefono or 'N/A', "IMEI:", dispositivo.imei or 'N/A'),
            ("Jefatura:", jefatura, "Cargo:", cargo),
            ("Sucursal:", sucursal, "", ""),
        ]

        for left_label, left_val, right_label, right_val in rows:
            # Izquierda: dibujar etiqueta y valor inmediatamente después de los dos puntos
            c.setFont("Helvetica-Bold", 11)
            c.drawString(table_x, y_position, left_label)
            left_label_width = c.stringWidth(left_label + ' ', "Helvetica-Bold", 11)
            c.setFont("Helvetica", 11)
            c.drawString(table_x + left_label_width + 4, y_position, str(left_val))

            # Derecha: dibujar etiqueta y valor inmediatamente después de los dos puntos
            c.setFont("Helvetica-Bold", 11)
            c.drawString(table_x + col_w, y_position, right_label)
            right_label_width = c.stringWidth(right_label + ' ', "Helvetica-Bold", 11)
            c.setFont("Helvetica", 11)
            c.drawString(table_x + col_w + right_label_width + 4, y_position, str(right_val))

            y_position -= row_h

        y_position -= 0.2*inch

        # Cláusulas
        clauses = [
            ("SEGUNDO:", "Se deberá incorporar a la firma de correo electrónico, el número de celular asignado por la empresa. A de más está totalmente prohibido transferir teléfono a otra persona."),
            ("TERCERO:", "Se deja constancia que el trabajador, deberá responder por cualquier daño o pérdida parcial o total de la(s) especie(s) individualizadas más arriba, por lo que autoriza desde ya el descuento en su remuneración mensual, por los gastos en que incurra la empresa para el arreglo o reposición de nuevos equipos y/o accesorios."),
            ("CUARTO:", f"En el caso de término de la relación laboral, el trabajador se compromete a realizar la devolución del equipo y accesorios, entregarlos a su jefe directo, en el caso de No ser así, se descontará del cálculo de su finiquito y este tendrá un costo de:\n\nCosto de Equipo Entregado: {self._format_currency(valor_depreciado)}"),
        ]

        for clause_title, clause_text in clauses:
            # Dibujar título (en negrita) en la línea actual
            c.setFont("Helvetica-Bold", 11)
            c.drawString(0.75*inch, y_position, clause_title)
            # Preparar para dibujar la primera línea del texto justo después de los dos puntos
            c.setFont("Helvetica", 11)
            title_width = c.stringWidth(clause_title + ' ', "Helvetica-Bold", 11)
            gap = 4  # puntos de separación entre título y texto
            first_x = 0.75*inch + title_width + gap

            # Disponible para la primera línea (en puntos)
            content_width = width - 1.5*inch
            available_first = content_width - title_width - gap

            # Construir primera línea hasta que no quepa
            words = clause_text.split()
            first_line_words = []
            remaining_words = words[:]
            while remaining_words:
                test = ' '.join(first_line_words + [remaining_words[0]])
                if c.stringWidth(test, c._fontname, c._fontsize) <= available_first:
                    first_line_words.append(remaining_words.pop(0))
                else:
                    break

            # Dibujar primera línea justo después del título
            if first_line_words:
                first_line = ' '.join(first_line_words)
                c.drawString(first_x, y_position, first_line)
            else:
                # Si no entra ninguna palabra en la primera línea, dejar una pequeña separación
                pass

            # Avanzar al siguiente renglón para el resto del texto
            from reportlab.lib.units import inch as _inch
            y_position -= 0.18 * _inch

            # Si quedan palabras, unir y justificar en todo el ancho del contenedor
            if remaining_words:
                remaining_text = ' '.join(remaining_words)
                y_position = self._draw_justified_text(c, remaining_text, 0.75*inch, y_position, width - 1.5*inch)

            y_position -= 0.12*inch

        # Declaración final
        c.setFont("Helvetica", 11)
        final_text = "Declaro recibir a mi entera satisfacción las especies individualizadas en la cláusula primera, y estoy de acuerdo en las exigencias estipulado en esta carta de responsabilidad."
        y_position = self._draw_justified_text(c, final_text, 0.75*inch, y_position, width - 1.5*inch)

        y_position -= 0.1*inch
        final_text2 = "La presente carta se firmar en dos ejemplares, quedando uno en poder del trabajador y el otro en el Depto. de RR.HH."
        y_position = self._draw_justified_text(c, final_text2, 0.75*inch, y_position, width - 1.5*inch)

        # Línea de firma
        y_position = 1.2*inch
        line_x_start = 0.75*inch + (width - 1.5*inch) / 4
        line_x_end = 0.75*inch + 3 * (width - 1.5*inch) / 4
        c.line(line_x_start, y_position, line_x_end, y_position)
        y_position -= 0.2*inch
        c.setFont("Helvetica", 10)
        c.drawCentredString(width/2, y_position, "Nombre Firma Rut del Trabajador")

    def _draw_discount_content(self, c, assignment, discount_data):
        """
        Dibuja el contenido específico para carta de descuento.

        Args:
            c: Canvas de ReportLab
            assignment: Instancia de Assignment
            discount_data: Datos del descuento (monto, cuotas, mes)
        """
        width, height = letter
        y_position = height - 1.8*inch  # Ajustado para comenzar justo debajo del logo
        y_start_fecha = y_position

        empleado = assignment.empleado
        dispositivo = assignment.dispositivo
        fecha = datetime.now()

        # Fecha en la esquina superior derecha
        c.setFont("Helvetica", 11)
        fecha_str = f"Santiago, {self._format_date_spanish(fecha)}.-"
        c.drawRightString(width - 0.75*inch, y_position, fecha_str)
        y_position -= 0.5*inch

        # Título secundario
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width/2, y_position, "Acuerdo / Autorización de Descuento")
        y_position -= 0.5*inch

        # Párrafo 1
        c.setFont("Helvetica", 11)
        para1 = (
            f"Por la presente, autorizo expresamente a mi empleador {self.company_name}. "
            f"Rut: {self.company_rut}, para que descuente de mis remuneraciones mensuales las cuotas que se "
            f"detallarán más abajo, y en el caso de terminar mi relación laboral, autorizo se descuente el saldo "
            f"del total adeudado con la empresa, con los valores que resulten de los emolumentos de mi finiquito."
        )
        wrapped_para1 = self._wrap_text(para1, 90)
        for line in wrapped_para1:
            c.drawString(0.75*inch, y_position, line)
            y_position -= 0.18*inch

        y_position -= 0.2*inch

        # Párrafo 2 - Concepto
        tipo_concepto = f"{dispositivo.tipo_equipo} {dispositivo.marca} {dispositivo.modelo}"
        monto_formatted = self._format_currency(discount_data['monto_total'])

        para2 = f"El monto total de la deuda es de {monto_formatted}, por el concepto {tipo_concepto}:"
        c.drawString(0.75*inch, y_position, para2)
        y_position -= 0.4*inch

        # Párrafo 3
        para3 = "El monto antes indicado, se dividirá en una cantidad de cuotas autorizadas, la(s) cual(es) se detalla (rán) a continuación."
        wrapped_para3 = self._wrap_text(para3, 90)
        for line in wrapped_para3:
            c.drawString(0.75*inch, y_position, line)
            y_position -= 0.18*inch

        y_position -= 0.3*inch

        # Detalles del descuento
        monto_cuota = int(discount_data['monto_total']) / discount_data['numero_cuotas']

        details = [
            ("NOMBRE TRABAJADOR", empleado.nombre_completo),
            ("R.U.T.", empleado.rut),
            ("Nº DE CUOTAS", str(discount_data['numero_cuotas'])),
            ("MES DE 1era CUOTA", discount_data['mes_primera_cuota']),
            ("MONTO DE CUOTA", self._format_currency(monto_cuota)),
        ]

        for label, value in details:
            c.setFont("Helvetica", 11)
            c.drawString(0.75*inch, y_position, f"{label}")
            c.setFont("Helvetica", 11)
            c.drawString(2.5*inch, y_position, f": {value}")
            y_position -= 0.22*inch

        y_position -= 0.3*inch

        # Texto final
        c.setFont("Helvetica", 11)
        c.drawString(0.75*inch, y_position, "La presente autorización es irrevocable.")
        y_position -= 0.8*inch

        # Línea de firma
        y_position = 1.2*inch
        line_x_start = 0.75*inch + (width - 1.5*inch) / 4
        line_x_end = 0.75*inch + 3 * (width - 1.5*inch) / 4
        c.line(line_x_start, y_position, line_x_end, y_position)
        y_position -= 0.2*inch
        c.setFont("Helvetica", 10)
        c.drawCentredString(width/2, y_position, "FIRMA DEL TRABAJADOR")

    def _draw_justified_text(self, c, text, x, y, max_width, line_height=0.18):
        """
        Dibuja texto justificado distribuyendo espacios uniformemente.

        Args:
            c: Canvas de ReportLab
            text: Texto a dibujar
            x: Posición X inicial
            y: Posición Y inicial
            max_width: Ancho máximo en puntos (ReportLab usa puntos)
            line_height: Altura de línea en pulgadas

        Returns:
            float: Posición Y final después de dibujar el texto
        """
        from reportlab.lib.units import inch

        words = text.split()
        lines = []
        current_line = []

        # Dividir en líneas usando max_width en puntos
        for word in words:
            test_line = current_line + [word]
            test_text = ' '.join(test_line)
            text_width = c.stringWidth(test_text, c._fontname, c._fontsize)

            if text_width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(current_line)
                current_line = [word]

        if current_line:
            lines.append(current_line)

        # Dibujar cada línea justificada (excepto la última)
        current_y = y
        for i, line in enumerate(lines):
            is_last_line = (i == len(lines) - 1)

            if is_last_line or len(line) == 1:
                text_to_draw = ' '.join(line)
                c.drawString(x, current_y, text_to_draw)
            else:
                line_text = ' '.join(line)
                text_width = c.stringWidth(line_text, c._fontname, c._fontsize)
                available_width = max_width

                if text_width < available_width and len(line) > 1:
                    total_extra = available_width - text_width
                    base_space = c.stringWidth(' ', c._fontname, c._fontsize)
                    extra_per_gap = total_extra / (len(line) - 1)
                    space_width = base_space + extra_per_gap

                    current_x = x
                    for j, word in enumerate(line):
                        c.drawString(current_x, current_y, word)
                        word_width = c.stringWidth(word, c._fontname, c._fontsize)
                        current_x += word_width
                        if j < len(line) - 1:
                            current_x += space_width
                else:
                    c.drawString(x, current_y, line_text)

            current_y -= line_height * inch

        return current_y

    def _wrap_text(self, text, max_chars_per_line):
        """
        Divide un texto en líneas respetando palabras completas.

        Args:
            text: Texto a dividir
            max_chars_per_line: Máximo de caracteres por línea

        Returns:
            list: Lista de líneas
        """
        words = text.split()
        lines = []
        current_line = []
        current_length = 0

        for word in words:
            word_length = len(word) + 1  # +1 por el espacio
            if current_length + word_length <= max_chars_per_line:
                current_line.append(word)
                current_length += word_length
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_length = word_length

        if current_line:
            lines.append(' '.join(current_line))

        return lines

    def generate_laptop_responsibility_letter(self, assignment, extra_data):
        """
        Genera una carta de responsabilidad para laptop.

        Args:
            assignment: Instancia de Assignment
            extra_data: Datos adicionales del formulario

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)

        # Dibujar template base
        self._draw_base_template(c, "C A R T A  D E  R E S P O N S A B I L I D A D")

        # Dibujar contenido específico de laptop
        self._draw_laptop_content(c, assignment, extra_data)

        # Finalizar PDF
        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer

    def generate_phone_responsibility_letter(self, assignment, extra_data):
        """
        Genera una carta de responsabilidad para teléfono.

        Args:
            assignment: Instancia de Assignment
            extra_data: Datos adicionales del formulario

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)

        # Dibujar template base
        self._draw_base_template(c, "C A R T A  D E  R E S P O N S A B I L I D A D")

        # Dibujar contenido específico de teléfono
        self._draw_phone_content(c, assignment, extra_data)

        # Finalizar PDF
        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer

    def generate_discount_letter(self, assignment, discount_data):
        """
        Genera una carta de descuento.

        Args:
            assignment: Instancia de Assignment
            discount_data: Datos del descuento (monto_total, numero_cuotas, mes_primera_cuota)

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)

        # Dibujar template base (sin título para la carta de descuento)
        width, height = letter

        # Header - Logo con efecto marca de agua (60% opacidad)
        if os.path.exists(LOGO_PATH):
            try:
                img = ImageReader(LOGO_PATH)
                c.saveState()
                c.setFillAlpha(0.6)
                c.drawImage(img, 0.75*inch, height - 1.5*inch, width=2*inch, height=0.8*inch, preserveAspectRatio=True, mask='auto')
                c.restoreState()
            except Exception as e:
                print(f"Error al cargar logo: {e}")

        # Footer - Separado en dos partes
        c.setFont("Helvetica", 9)
        # Texto izquierdo
        c.drawString(0.75*inch, 0.5*inch, "Departamento de Informática y Redes")
        # Texto derecho
        c.drawRightString(width - 0.75*inch, 0.5*inch, "Empresas Pompeyo Carrasco")

        # Dibujar contenido específico de descuento
        self._draw_discount_content(c, assignment, discount_data)

        # Finalizar PDF
        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer
