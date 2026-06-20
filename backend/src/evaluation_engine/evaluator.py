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
        import difflib

        golden_files = incident_data["golden_files"]
        broken_files = incident_data["broken_files"]

        # Diff 1: what did the user actually change from the broken version?
        user_changes = {}
        for filename, broken_content in broken_files.items():
            user_content = user_files.get(filename, "")
            diff = list(difflib.unified_diff(
                broken_content.splitlines(),
                user_content.splitlines(),
                fromfile=f"broken/{filename}",
                tofile=f"user/{filename}",
                lineterm=""
            ))
            user_changes[filename] = "\n".join(diff) if diff else "NO CHANGES MADE"

        # Diff 2: what does the correct fix look like?
        correct_fix = {}
        for filename, broken_content in broken_files.items():
            golden_content = golden_files.get(filename, "")
            diff = list(difflib.unified_diff(
                broken_content.splitlines(),
                golden_content.splitlines(),
                fromfile=f"broken/{filename}",
                tofile=f"golden/{filename}",
                lineterm=""
            ))
            correct_fix[filename] = "\n".join(diff) if diff else "NO CHANGES NEEDED"

        user_changes_text = "\n\n".join(
            f"--- {fname} ---\n{diff}" for fname, diff in user_changes.items()
        )
        correct_fix_text = "\n\n".join(
            f"--- {fname} ---\n{diff}" for fname, diff in correct_fix.items()
        )

        # Build controlled skill list from private.json
        skills = incident_data.get("skills_tested", [])
        skill_names = [s["name"] for s in skills]
        skills_list = ", ".join(skill_names)

        return f"""You are a STRICT code evaluation engine. You must evaluate whether the user fixed the actual bug.

INCIDENT: {incident_data['title']}
ERROR LOGS: {incident_data['logs']}
ROOT BUG DESCRIPTION: {incident_data['root_cause']}

WHAT THE USER CHANGED (diff from broken to their submission):
{user_changes_text}

WHAT THE CORRECT FIX LOOKS LIKE (diff from broken to golden):
{correct_fix_text}

EVALUATION INSTRUCTIONS:
Step 1: Look at "WHAT THE USER CHANGED". If all files show "NO CHANGES MADE", root_cause_fixed MUST be false.
Step 2: Determine if the user's change actually resolves the ERROR LOGS shown above.
Step 3: The user does NOT need to match the golden fix exactly — but their change must genuinely fix the reported error.
Step 4: If the user changed something unrelated to the error, root_cause_fixed is false.
Step 5: If the user deleted code or broke something, check introduced_new_issues.

BE STRICT. Do not invent reasons to pass the user. The error logs are ground truth — if their change would not stop those errors, it fails.

SKILL SCORING RULES:
- You MUST only use these exact skill names, no others: {skills_list}
- Score each skill 0-10 based on how well the user demonstrated understanding of it
- If root_cause_fixed is true, scores should generally be 6-10
- If root_cause_fixed is false, scores should generally be 0-4

Respond ONLY with valid JSON, no markdown:
{{
"root_cause_fixed": boolean,
"introduced_new_issues": boolean,
"confidence": float between 0 and 1,
"concepts_demonstrated": [list of strings],
"concepts_missing": [list of strings],
"summary": "one sentence — what did the user change and does it fix the error?",
"feedback": [2-3 specific feedback strings],
"recommended_skill_updates": {{"skill_name": score_0_to_10}}
}}"""

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
