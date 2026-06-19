from src.llm.provider import LLMProvider

class MockProvider(LLMProvider):
    def generate(self, prompt: str) -> str:
        return """
        {
          "root_cause_fixed": true,
          "introduced_new_issues": false,
          "confidence": 0.95,
          "concepts_demonstrated": ["imports"],
          "concepts_missing": [],
          "summary": "The circular import was correctly resolved.",
          "feedback": ["Great work fixing the dependency loop."],
          "recommended_skill_updates": {"imports": 10}
        }
        """
