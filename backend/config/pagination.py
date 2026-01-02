"""
Configuración personalizada de paginación para Django REST Framework.
"""
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Paginador estándar que permite al cliente especificar el tamaño de página.

    - Tamaño por defecto: 20 registros
    - Tamaño máximo: 1000 registros (para exportaciones)
    - Query param: page_size
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000
