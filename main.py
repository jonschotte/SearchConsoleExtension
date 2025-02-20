from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import requests
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()


class SimilarityRequest(BaseModel):
    url: str
    keywords: List[str]


def fetch_url_content(url: str) -> str:
    """Fetches webpage content from the given URL."""
    response = requests.get(url)
    return response.text.lower()


def compute_similarity(page_text, keywords):
    if not page_text.strip():
        return []

    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([page_text] + keywords)
    cosine_similarities = cosine_similarity(vectors[0], vectors[1:])

    return [{"keyword": kw, "similarity": float(cosine_similarities[0][i])} for i, kw in enumerate(keywords)]


@app.post("/cosine-similarity/")
async def cosine_similarity_endpoint(request: SimilarityRequest):
    """Receives a request with a URL and keywords, then calculates cosine similarity."""
    url_content = fetch_url_content(request.url)
    return compute_similarity(url_content, request.keywords)
