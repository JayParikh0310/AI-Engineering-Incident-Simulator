import os
from dotenv import load_dotenv
from src.llm.openrouter import OpenRouter

# Load variables from .env
load_dotenv(dotenv_path="backend/.env")

def test_llm_connectivity():
    try:
        llm = OpenRouter()
        prompt = "Reply with only the word 'pong'."
        response = llm.generate(prompt)
        print(f"LLM Response: {response.strip()}")
        assert response.strip().lower() == "pong"
        print("LLM Connectivity Test Passed!")
    except Exception as e:
        print(f"LLM Connectivity Test Failed: {e}")

if __name__ == "__main__":
    test_llm_connectivity()
