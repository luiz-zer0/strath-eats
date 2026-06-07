from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StallViewSet, MenuItemViewSet, OrderViewSet, AdminStatsViewSet
from .views import trigger_stk_push, mpesa_callback

router = DefaultRouter()
router.register(r'stalls', StallViewSet)
router.register(r'menu-items', MenuItemViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'stats', AdminStatsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stk-push/', trigger_stk_push, name='stk_push'),          
    path('mpesa-callback/', mpesa_callback, name='mpesa_callback')
]
