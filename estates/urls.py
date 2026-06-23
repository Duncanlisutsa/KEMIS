from rest_framework.routers import DefaultRouter
from .views import EstateViewSet, UnitViewSet

router = DefaultRouter()

router.register(r'estates', EstateViewSet)
router.register(r'units', UnitViewSet)

urlpatterns = router.urls