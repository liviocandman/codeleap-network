import responses
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from .models import Like, Comment

CODELEAP_API_URL = "https://dev.codeleap.co.uk/careers/"

class PostBFFProxyTests(TestCase):
    """Tests for the BFF Proxy Architecture in PostViewSet."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="password")
        self.dummy_external_posts = {
            "count": 2,
            "next": None,
            "previous": None,
            "results": [
                {
                    "id": 100,
                    "username": "CodeLeap",
                    "created_datetime": "2023-01-01T00:00:00Z",
                    "title": "Post 100",
                    "content": "External content 1"
                },
                {
                    "id": 101,
                    "username": "CodeLeap",
                    "created_datetime": "2023-01-02T00:00:00Z",
                    "title": "Post 101",
                    "content": "External content 2"
                }
            ]
        }

    @responses.activate
    def test_list_proxies_codeleap_and_appends_social_features(self):
        # Mock external API
        responses.add(
            responses.GET,
            CODELEAP_API_URL,
            json=self.dummy_external_posts,
            status=200
        )

        # Add local DB social features
        Like.objects.create(user=self.user, post_id=100)
        Comment.objects.create(user=self.user, post_id=100, content="Local Comment")

        # Fetch from our Django BFF
        response = self.client.get("/careers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        results = response.data.get("results")
        self.assertEqual(len(results), 2)
        
        # Verify Post 100 merged successfully with SQLite data
        post_100 = next(p for p in results if p["id"] == 100)
        self.assertEqual(post_100["likes_count"], 1)
        self.assertEqual(post_100["comments_count"], 1)
        self.assertEqual(post_100["comments"][0]["content"], "Local Comment")
        self.assertEqual(post_100["comments"][0]["username"], "testuser")
        
        # Verify Post 101 is clean
        post_101 = next(p for p in results if p["id"] == 101)
        self.assertEqual(post_101["likes_count"], 0)
        self.assertEqual(post_101["comments_count"], 0)
        self.assertEqual(len(post_101["comments"]), 0)

    @responses.activate
    def test_authenticated_user_sees_is_liked_by_me(self):
        responses.add(
            responses.GET,
            f"{CODELEAP_API_URL}100/",
            json=self.dummy_external_posts["results"][0],
            status=200
        )
        
        Like.objects.create(user=self.user, post_id=100)
        
        # Unauthenticated request
        response_unauth = self.client.get("/careers/100/")
        self.assertFalse(response_unauth.data["is_liked_by_me"])
        
        # Authenticated request
        self.client.force_authenticate(user=self.user)
        response_auth = self.client.get("/careers/100/")
        self.assertTrue(response_auth.data["is_liked_by_me"])

    @responses.activate
    def test_create_proxy_passthrough(self):
        payload = {"username": "new", "title": "T", "content": "C"}
        mock_response = {"id": 102, **payload}
        
        responses.add(
            responses.POST,
            CODELEAP_API_URL,
            json=mock_response,
            status=201
        )
        
        resp = self.client.post("/careers/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["id"], 102)

    @responses.activate
    def test_update_proxy_passthrough(self):
        responses.add(
            responses.PATCH,
            f"{CODELEAP_API_URL}100/",
            json={"id": 100, "title": "Patched"},
            status=200
        )
        resp = self.client.patch("/careers/100/", {"title": "Patched"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["title"], "Patched")

    @responses.activate
    def test_delete_proxy_passthrough(self):
        responses.add(
            responses.DELETE,
            f"{CODELEAP_API_URL}100/",
            status=204
        )
        resp = self.client.delete("/careers/100/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_local_like_endpoint(self):
        self.client.force_authenticate(user=self.user)
        # Add Like
        resp = self.client.post("/careers/500/like/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(Like.objects.filter(post_id=500, user=self.user).exists())
        
        # Remove Like
        resp_del = self.client.delete("/careers/500/like/")
        self.assertEqual(resp_del.status_code, status.HTTP_200_OK)
        self.assertFalse(Like.objects.filter(post_id=500, user=self.user).exists())

    def test_local_comment_endpoint(self):
        self.client.force_authenticate(user=self.user)
        # Create Comment
        resp = self.client.post("/careers/600/comments/", {"content": "BFF Comment"})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Comment.objects.filter(post_id=600, content="BFF Comment").exists())
        
        # Get Comments bypasses proxy and returns only local DB comments
        resp_get = self.client.get("/careers/600/comments/")
        self.assertEqual(resp_get.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_get.data), 1)
        self.assertEqual(resp_get.data[0]["content"], "BFF Comment")
