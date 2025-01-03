from locust import HttpUser, task, between
import json


class PerformanceTests(HttpUser):
    wait_time = between(1, 3)

    @task(1)
    def test_tavily_search(self):
        sample_query = "What is the capital of France?"
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        res = self.client.post(f"/search/?query={sample_query}", headers=headers)
        print("res", res.json())
