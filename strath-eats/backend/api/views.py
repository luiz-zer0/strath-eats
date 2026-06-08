from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Stall, MenuItem, Order, AdminStats
from .serializers import StallSerializer, MenuItemSerializer, OrderSerializer, AdminStatsSerializer


class StallViewSet(viewsets.ModelViewSet):
    queryset = Stall.objects.prefetch_related('menu')
    serializer_class = StallSerializer


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    @action(detail=False, methods=['get'])
    def by_stall(self, request):
        stall_id = request.query_params.get('stall_id')
        if stall_id:
            orders = Order.objects.filter(stall_id=stall_id)
            serializer = self.get_serializer(orders, many=True)
            return Response(serializer.data)
        return Response({'error': 'stall_id required'}, status=status.HTTP_400_BAD_REQUEST)


class AdminStatsViewSet(viewsets.ModelViewSet):
    queryset = AdminStats.objects.all()
    serializer_class = AdminStatsSerializer



import os
import base64
import json
import requests
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

# Safaricom configuration
CONSUMER_KEY = os.environ.get('MPESA_CONSUMER_KEY')
CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET')
SHORTCODE = os.environ.get('MPESA_SHORTCODE')
PASSKEY = os.environ.get('MPESA_PASSKEY')

def get_mpesa_access_token():
    """Authenticates with Safaricom and gets a temporary access token."""
    api_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    r = requests.get(api_url, auth=(CONSUMER_KEY, CONSUMER_SECRET))

    if r.status_code != 200:
        print(f"DEBUG: Token request failed with {r.status_code}: {r.text}")

    return r.json()['access_token']
    

@api_view(['POST'])
@permission_classes([AllowAny])
def trigger_stk_push(request):
    """Triggered by React when the student clicks 'Pay via M-Pesa'"""
    phone = request.data.get('phone')
    amount = request.data.get('amount')
    order_id = request.data.get('order_id') # The Firestore Order ID
    
    if not phone or not amount or not order_id:
        return Response({"error": "Phone, amount, and order_id are required."}, status=400)

    # Clean the phone number (Convert 07... to 2547...)
    if phone.startswith('0'):
        phone = '254' + phone[1:]

    access_token = get_mpesa_access_token()
    api_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Generate timestamp and password exactly how Safaricom requires it
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password_str = f"{SHORTCODE}{PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode('utf-8')).decode('utf-8')

    payload = {
        "BusinessShortCode": SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone,
        "PartyB": SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": " https://strath-eats.onrender.com/api/mpesa-callback/", 
        "AccountReference": "StrathEats",
        "TransactionDesc": f"Payment for order {order_id}"
    }

    try:
        response = requests.post(api_url, json=payload, headers=headers)
        response_data = response.json()

        print("DEBUG - Keys received from Safaricom:", list(response_data.keys()))
        print("DEBUG - Full Response Object:", response_data)
        
        checkout_request_id = response_data.get('CheckoutRequestID')
        if checkout_request_id:
            return Response({"message": "STK Push sent!", "checkout_request_id": checkout_request_id})
        else:
            return Response({"error": "ID missing", "raw_response": response_data}, status=400)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)
        
    # except Exception as e:
    #     return Response({"error": str(e)}, status=500)
    #     return Response({
    #         "message": "STK Push sent!", 
    #         "checkout_request_id": checkout_request_id
    #     })
        





@api_view(['POST'])
@permission_classes([AllowAny])
def mpesa_callback(request):
    """Safaricom sends the digital receipt here after the student types their PIN"""
    # Safaricom sends data inside a 'Body' -> 'stkCallback' structure
    callback_data = request.data.get('Body', {}).get('stkCallback', {})
    
    result_code = callback_data.get('ResultCode')
    checkout_request_id = callback_data.get('CheckoutRequestID')
    
    if result_code == 0:
        # SUCCESS! The student paid.
        # Here is where we will write the code to update Firestore to "st: paid"
        print(f"✅ SUCCESS: Payment {checkout_request_id} went through!")
    else:
        # FAILED! (Student cancelled, wrong PIN, no balance)
        print(f"❌ FAILED: Payment {checkout_request_id} failed.")

    # Safaricom expects a simple "I received it" response
    return Response({"ResultCode": 0, "ResultDesc": "Accepted"})