from dotenv import load_dotenv
import os
import time
from typing import Optional
from groq import Groq, RateLimitError
# from openai import OpenAI, RateLimitError
from src.llm.provider import LLMProvider

class OpenRouter(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            # raise ValueError("OPENROUTER_API_KEY not found")
            raise ValueError("GROQ_API_KEY not found")
        # self.client = OpenAI(
        #     base_url="https://openrouter.ai/api/v1",
        #     api_key=self.api_key,
        # )
        self.client = Groq(api_key=self.api_key)

    def generate(self, prompt: str, max_retries: int = 3) -> str:
        for attempt in range(max_retries):
            try:
                # response = self.client.chat.completions.create(
                #     model="qwen/qwen3-next-80b-a3b-instruct:free",
                #     messages=[{"role": "user", "content": prompt}],
                #     temperature=0.1,
                # )
                chat_completion = self.client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                )
                return chat_completion.choices[0].message.content
            except RateLimitError as e:
                if attempt == max_retries - 1:
                    raise e
                
                # Simple exponential backoff for Groq
                wait_time = 2 ** attempt
                print(f"Rate limited. Retrying in {wait_time} seconds (attempt {attempt + 1}/{max_retries})...")
                time.sleep(float(wait_time))
        return ""
