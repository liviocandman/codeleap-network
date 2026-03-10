from django.db import models
from django.contrib.auth.models import User


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked_posts")
    post_id = models.IntegerField(db_index=True)
    created_datetime = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "post_id"]

    def __str__(self):
        return f"{self.user.username} likes post {self.post_id}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    post_id = models.IntegerField(db_index=True)
    content = models.TextField()
    created_datetime = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_datetime"]

    def __str__(self):
        return f"Comment by {self.user.username} on post {self.post_id}"
