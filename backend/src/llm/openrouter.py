import os
import time
from typing import Optional
from openai import OpenAI, RateLimitError
from src.llm.provider import LLMProvider

class OpenRouter(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found")
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
        )

    def generate(self, prompt: str, max_retries: int = 3) -> str:
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model="meta-llama/llama-3.2-3b-instruct:free",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                )
                return response.choices[0].message.content
            except RateLimitError as e:
                if attempt == max_retries - 1:
                    raise e
                
                # Try to get retry time from error, default to exponential backoff
                wait_time = e.body.get("metadata", {}).get("retry_after_seconds", 2 ** attempt)
                print(f"Rate limited. Retrying in {wait_time} seconds (attempt {attempt + 1}/{max_retries})...")
                time.sleep(float(wait_time))
        return ""

