from django.apps import AppConfig


class AssignmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.assignments'
    verbose_name = 'Asignaciones y Solicitudes'

    def ready(self):
        """
        Importar señales cuando la aplicación esté lista.
        """
        import apps.assignments.signals
