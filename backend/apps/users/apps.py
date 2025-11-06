from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'Usuarios y Autenticación'

    def ready(self):
        """
        Importar señales cuando la aplicación esté lista.
        """
        import apps.users.signals
