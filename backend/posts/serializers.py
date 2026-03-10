from rest_framework import serializers
from .models import Like, Comment

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "username", "content", "created_datetime", "post_id"]
        read_only_fields = ["id", "created_datetime"]
