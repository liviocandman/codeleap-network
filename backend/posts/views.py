import requests
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Like, Comment
from .serializers import CommentSerializer


CODELEAP_API_URL = "https://dev.codeleap.co.uk/careers/"


class PostViewSet(viewsets.ViewSet):
    """
    Backend-For-Frontend (BFF) proxy ViewSet for the CodeLeap Public API.
    Handles standard CRUD by passing through to CodeLeap.
    Augments posts with local DB social features (Likes, Comments).
    """
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def _augment_post(self, post_data, user=None):
        """Helper to append local social features to an external CodeLeap post"""
        post_id = post_data.get("id")
        
        # Aggregate logic
        likes_count = Like.objects.filter(post_id=post_id).count()
        comments_count = Comment.objects.filter(post_id=post_id).count()
        
        is_liked = False
        if user and user.is_authenticated:
            is_liked = Like.objects.filter(post_id=post_id, user=user).exists()
            
        comments = Comment.objects.filter(post_id=post_id).order_by("created_datetime")
        
        post_data["likes_count"] = likes_count
        post_data["comments_count"] = comments_count
        post_data["is_liked_by_me"] = is_liked
        post_data["comments"] = CommentSerializer(comments, many=True).data
        
        return post_data

    def list(self, request):
        limit = request.query_params.get("limit", 20)
        offset = request.query_params.get("offset", 0)
        
        # Pass params upstream
        resp = requests.get(CODELEAP_API_URL, params={"limit": limit, "offset": offset})
        if not resp.ok:
            return Response(resp.json() if resp.text else {}, status=resp.status_code)
            
        data = resp.json()
        
        # Augment the list of results
        for post in data.get("results", []):
            self._augment_post(post, request.user)
            
        return Response(data)

    def retrieve(self, request, pk=None):
        resp = requests.get(f"{CODELEAP_API_URL}{pk}/")
        if not resp.ok:
            return Response(resp.json() if resp.text else {}, status=resp.status_code)
            
        post_data = self._augment_post(resp.json(), request.user)
        return Response(post_data)

    def create(self, request):
        resp = requests.post(CODELEAP_API_URL, json=request.data)
        return Response(resp.json() if resp.text else {}, status=resp.status_code)

    def partial_update(self, request, pk=None):
        resp = requests.patch(f"{CODELEAP_API_URL}{pk}/", json=request.data)
        return Response(resp.json() if resp.text else {}, status=resp.status_code)

    def destroy(self, request, pk=None):
        resp = requests.delete(f"{CODELEAP_API_URL}{pk}/")
        # DELETE often returns 204 No Content
        return Response(status=resp.status_code)

    # --- SOCIAL FEATURES (Local SQLite based) ---

    @action(detail=True, methods=['post', 'delete'])
    def like(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required to like"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if request.method == 'POST':
            Like.objects.get_or_create(user=request.user, post_id=pk)
            return Response({"status": "liked"})
        elif request.method == 'DELETE':
            Like.objects.filter(user=request.user, post_id=pk).delete()
            return Response({"status": "unliked"})

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        if request.method == 'GET':
            comments = Comment.objects.filter(post_id=pk).order_by("created_datetime")
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            if not request.user.is_authenticated:
                return Response({"error": "Authentication required to comment"}, status=status.HTTP_401_UNAUTHORIZED)
            
            content = request.data.get('content')
            if not content:
                return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            comment = Comment.objects.create(user=request.user, post_id=pk, content=content)
            serializer = CommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
