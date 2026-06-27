from rest_framework.routers import DefaultRouter
from .views import MaintenanceRequestViewSet

router = DefaultRouter()
router.register(r'', MaintenanceRequestViewSet)

urlpatterns = router.urls