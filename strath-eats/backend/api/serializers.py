from rest_framework import serializers
from .models import Stall, MenuItem, Order, AdminStats


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'price', 'available', 'category', 'portions']


class StallSerializer(serializers.ModelSerializer):
    menu = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Stall
        fields = ['id', 'name', 'category', 'color', 'hours', 'vendor_name', 'menu']


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'user', 'stall', 'items', 'total', 'mode', 'pickup_time', 'status', 'ready_for_pickup', 'created_at']


class AdminStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminStats
        fields = ['total_orders', 'total_revenue', 'active_users', 'active_stalls']
