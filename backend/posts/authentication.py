import firebase_admin
from firebase_admin import credentials, auth
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings

class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        
        id_token = parts[1]

        try:
            # Verify the token against Firebase
            decoded_token = auth.verify_id_token(id_token)
        except Exception as e:
            raise AuthenticationFailed(f"Invalid Firebase token: {str(e)}")

        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        
        if not uid:
            raise AuthenticationFailed("Firebase token missing UID")

        # Get or create the user in the local Django database
        # For this network, we can use the email (split before @) or just UID as username
        # if username wasn't already configured. Let's use email prefix + uid slice to be safe.
        username = email.split('@')[0] if email else f"user_{uid[:6]}"
        
        user, created = User.objects.get_or_create(
            username=uid, # Use uid as the definitive identifier in our DB
            defaults={
                'email': email or '',
                'first_name': username
            }
        )

        return (user, decoded_token)

class DummyUsernameAuthentication(BaseAuthentication):
    """Fallback for local testing when Firebase keys aren't available."""
    def authenticate(self, request):
        username = request.META.get("HTTP_X_USERNAME")
        if not username:
            return None
            
        user, created = User.objects.get_or_create(username=username)
        return (user, None)
