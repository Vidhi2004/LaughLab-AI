import json
from urllib.request import urlopen, Request
from flask import Flask, jsonify

app = Flask(__name__)

REDDIT_URL = "https://www.reddit.com/r/memes/top.json"


def fetch_reddit_memes(limit=5):
    """
    Fetches top memes from the Reddit /r/memes subreddit using urllib.
    :param limit: Number of memes to fetch.
    :return: A list of meme image URLs.
    """
    headers = {"User-Agent": "MemeFetcher/0.1"}
    params = f"?limit={limit}"
    url = REDDIT_URL + params

    try:
        request = Request(url, headers=headers)
        with urlopen(request) as response:
            if response.status == 200:
                data = json.load(response)
                return [
                    post["data"]["url"]
                    for post in data["data"]["children"]
                    if post["data"].get("post_hint") == "image"
                ]
            else:
                print(f"Error: {response.status}")
                return []
    except Exception as e:
        print(f"Error fetching memes: {e}")
        return []


@app.route('/recommend-memes', methods=['POST'])
def recommend_memes():
    """
    API endpoint to recommend memes.
    """
    meme_urls = fetch_reddit_memes()

    if not meme_urls:
        return jsonify({"error": "No memes found"}), 500

    return jsonify([{"url": url} for url in meme_urls])


if __name__ == "__main__":
    app.run(debug=True, port=5000)
