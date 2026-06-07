from django.core.management.base import BaseCommand
from api.models import Stall, MenuItem, Order, AdminStats


class Command(BaseCommand):
    help = 'Seed the database with dummy cafeteria data'

    def handle(self, *args, **options):
        AdminStats.objects.all().delete()
        Order.objects.all().delete()
        MenuItem.objects.all().delete()
        Stall.objects.all().delete()

        stalls_data = [
            {
                'id': 1,
                'name': 'Mama Grace Kitchen',
                'category': 'Local meals & stews',
                'color': 'rgba(37,99,235,.18)',
                'hours': '08:00–16:00',
                'vendor_name': 'Grace W.',
                'menu': [
                    {'id': 1, 'name': 'Ugali', 'price': 40, 'available': True, 'category': 'Side dish', 'portions': None},
                    {'id': 2, 'name': 'Pilau', 'price': 120, 'available': True, 'category': 'Main dish', 'portions': {'half': 60, 'full': 120}},
                    {'id': 3, 'name': 'Sukuma Wiki', 'price': 50, 'available': True, 'category': 'Vegetable', 'portions': {'half': 25, 'full': 50}},
                    {'id': 4, 'name': 'Chicken stew', 'price': 130, 'available': True, 'category': 'Protein', 'portions': {'half': 70, 'full': 130}},
                    {'id': 5, 'name': 'Beef stew', 'price': 120, 'available': True, 'category': 'Protein', 'portions': {'half': 65, 'full': 120}},
                    {'id': 6, 'name': 'Chapati', 'price': 30, 'available': True, 'category': 'Side dish', 'portions': None},
                    {'id': 7, 'name': 'Rice', 'price': 50, 'available': True, 'category': 'Side dish', 'portions': {'half': 25, 'full': 50}},
                ]
            },
            {
                'id': 2,
                'name': 'Deli Corner',
                'category': 'Wraps, sandwiches & salads',
                'color': 'rgba(240,180,41,.18)',
                'hours': '08:00–17:00',
                'vendor_name': 'James K.',
                'menu': [
                    {'id': 10, 'name': 'Club sandwich', 'price': 160, 'available': True, 'category': 'Main dish', 'portions': None},
                    {'id': 11, 'name': 'Chicken wrap', 'price': 140, 'available': True, 'category': 'Main dish', 'portions': None},
                    {'id': 12, 'name': 'Caesar salad', 'price': 130, 'available': True, 'category': 'Main dish', 'portions': {'half': 70, 'full': 130}},
                    {'id': 13, 'name': 'Tuna sandwich', 'price': 150, 'available': True, 'category': 'Main dish', 'portions': None},
                ]
            },
            {
                'id': 3,
                'name': 'Java Spot',
                'category': 'Beverages & snacks',
                'color': 'rgba(6,182,212,.15)',
                'hours': '07:00–18:00',
                'vendor_name': 'Amina M.',
                'menu': [
                    {'id': 15, 'name': 'Cappuccino', 'price': 80, 'available': True, 'category': 'Beverage', 'portions': None},
                    {'id': 16, 'name': 'Black coffee', 'price': 50, 'available': True, 'category': 'Beverage', 'portions': None},
                    {'id': 17, 'name': 'Masala chai', 'price': 50, 'available': True, 'category': 'Beverage', 'portions': None},
                    {'id': 18, 'name': 'Mandazi', 'price': 20, 'available': True, 'category': 'Snack', 'portions': None},
                    {'id': 19, 'name': 'Mango smoothie', 'price': 120, 'available': True, 'category': 'Beverage', 'portions': None},
                ]
            },
        ]

        for stall_data in stalls_data:
            menu_items = stall_data.pop('menu')
            stall = Stall.objects.create(**stall_data)

            for item_data in menu_items:
                MenuItem.objects.create(stall=stall, **item_data)

        orders_data = [
            {'id': 'ORD-8800', 'user': 'Louis N.', 'stall_id': 1, 'items': ['Pilau (Full)', 'Chicken stew (Half)'], 'total': 250, 'mode': 'dine_in', 'pickup_time': '12:00', 'status': 'paid', 'ready_for_pickup': False},
            {'id': 'ORD-8801', 'user': 'Alex M.', 'stall_id': 1, 'items': ['Pilau (Half)', 'Sukuma Wiki (Full)'], 'total': 120, 'mode': 'dine_in', 'pickup_time': '12:15', 'status': 'paid', 'ready_for_pickup': False},
            {'id': 'ORD-8803', 'user': 'Dr. Ochieng', 'stall_id': 1, 'items': ['Beef stew (Full)', 'Chapati'], 'total': 150, 'mode': 'takeaway', 'pickup_time': '12:30', 'status': 'accepted', 'ready_for_pickup': True},
        ]

        for order_data in orders_data:
            Order.objects.create(**order_data)

        AdminStats.objects.create(
            total_orders=127,
            total_revenue=19840,
            active_users=341,
            active_stalls=3,
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with dummy data'))
