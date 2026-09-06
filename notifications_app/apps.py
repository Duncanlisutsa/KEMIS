from django.apps import AppConfig


class NotificationsAppConfig(AppConfig):
    name = 'notifications_app'

    def ready(self):
        from . import signals  # noqa: F401  (registers the post_save email hook)