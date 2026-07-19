import time
import requests
from datetime import datetime

API_URL = "http://localhost:8000/api/v1/activities"


def send_event(event):
    try:
        requests.post(API_URL, json=event)
    except Exception as e:
        print("sync failed:", e)


def collect_fake_events():
    events = []

    try:
        with open("agent/data/commands.log", "r") as f:
            lines = f.readlines()

        if not lines:
            return []

        line = lines[-1].strip()

        timestamp, command = line.split("|", 1)

        events.append(
            {
                "type": "terminal",
                "title": command,
                "description": "",
                "source": "agent",
                "metadata": {},
                "occurred_at": datetime.utcnow().isoformat(),
                "project_id": "28492bf4-5752-421a-b97c-a9bb5e21b1bd",
                "tag_ids": [],
            }
        )

    except Exception as e:
        print("collect failed:", e)

    return events


def run():
    while True:
        events = collect_fake_events()

        for e in events:
            send_event(e)
            print("sent:", e["title"])

        time.sleep(60)  # batch every minute


if __name__ == "__main__":
    run()
