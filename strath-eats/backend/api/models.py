from django.db import models

class Stall(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    color = models.CharField(max_length=50)
    hours = models.CharField(max_length=50)
    vendor_name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    id = models.AutoField(primary_key=True)
    stall = models.ForeignKey(Stall, on_delete=models.CASCADE, related_name='menu')
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    available = models.BooleanField(default=True)
    category = models.CharField(max_length=50)
    portions = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.stall.name})"


class Order(models.Model):
    ORDER_STATUS = [
        ('paid', 'Paid'),
        ('accepted', 'Accepted'),
        ('ready', 'Ready'),
        ('picked_up', 'Picked up'),
    ]

    FULFILLMENT_MODE = [
        ('dine_in', 'Dine-in'),
        ('takeaway', 'Takeaway'),
    ]

    id = models.CharField(max_length=50, unique=True, primary_key=True)
    user = models.CharField(max_length=100)
    stall = models.ForeignKey(Stall, on_delete=models.CASCADE, related_name='orders')
    items = models.JSONField()
    total = models.IntegerField()
    mode = models.CharField(max_length=20, choices=FULFILLMENT_MODE)
    pickup_time = models.CharField(max_length=10)
    status = models.CharField(max_length=20, choices=ORDER_STATUS)
    ready_for_pickup = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.user}"


class AdminStats(models.Model):
    total_orders = models.IntegerField(default=0)
    total_revenue = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    active_stalls = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Admin Stats"

    def __str__(self):
        return "System Statistics"
