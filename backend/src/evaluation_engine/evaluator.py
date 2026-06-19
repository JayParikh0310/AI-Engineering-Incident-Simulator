import json
import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from src.llm.openrouter import OpenRouter
from src.llm.provider import LLMProvider
from src.schemas.evaluation_schema import LLMEvaluationSchema
from src.repositories.attempt_repository import AttemptRepository
from src.models.attempt import Attempt
from src.models.llm_evaluation import LLMEvaluation

class Evaluator:
    def __init__(self, db: Session, provider: Optional[LLMProvider] = None):
        self.db = db
        self.llm = provider or OpenRouter()
        self.repo = AttemptRepository(db)

    def evaluate_attempt(self, attempt_id: uuid.UUID, incident_data: Dict[str, Any], user_files: Dict[str, str]) -> LLMEvaluationSchema:
        # 1. Build prompt
        prompt = self._build_prompt(incident_data, user_files)
        
        # 2. Call LLM
        raw_response = self.llm.generate(prompt)
        
        # 3. Parse & Validate
        parsed_data = self._parse_json(raw_response)
        evaluation = LLMEvaluationSchema(**parsed_data)
        
        # 4. Save evaluation
        self._save_evaluation(attempt_id, raw_response, parsed_data)
        
        # 5. Apply pass/fail to attempt
        passed = evaluation.root_cause_fixed and not evaluation.introduced_new_issues
        self._update_attempt(attempt_id, passed, evaluation.summary)
        
        return evaluation

    def _build_prompt(self, incident_data: Dict[str, Any], user_files: Dict[str, str]) -> str:
        # Construct the prompt as discussed
        return f"""
You must act as an evaluation engine.
Analyze the user's attempt to fix the incident and provide ONLY a valid JSON response.
Do NOT include any conversational text, explanations, or markdown formatting.

Incident:
Title: {incident_data['title']}
Scenario: {incident_data['scenario']}
Logs: {incident_data['logs']}

Golden Files:
{json.dumps(incident_data['golden_files'])}

User Submission:
{json.dumps(user_files)}

Output MUST be a JSON object matching this schema:
{{
  "root_cause_fixed": boolean,
  "introduced_new_issues": boolean,
  "confidence": float,
  "concepts_demonstrated": [string],
  "concepts_missing": [string],
  "summary": string,
  "feedback": [string],
  "recommended_skill_updates": {{ "skill_name": int }}
}}
"""

    def _parse_json(self, raw_response: str) -> Dict[str, Any]:
        # Clean response if LLM added markdown code blocks
        clean_json = raw_response.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)

    def _save_evaluation(self, attempt_id: uuid.UUID, raw: str, parsed: Dict[str, Any]):
        eval_record = LLMEvaluation(
            attempt_id=attempt_id,
            model_name="qwen-2.5-coder-32b-instruct",
            prompt_version="v1",
            raw_response=raw,
            parsed_response=parsed
        )
        self.db.add(eval_record)
        self.db.commit()

    def _update_attempt(self, attempt_id: uuid.UUID, passed: bool, feedback: str):
        attempt = self.db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if attempt:
            attempt.passed = passed
            attempt.feedback = feedback
            self.db.commit()
