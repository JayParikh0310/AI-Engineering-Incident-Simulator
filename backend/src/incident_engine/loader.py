import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from src.schemas.incident_schema import IncidentPublic, IncidentPrivate, IncidentFull


# Get the project root directory (assuming backend/src/incident_engine/loader.py)
DEFAULT_INCIDENTS_DIR = Path(__file__).parent.parent.parent.parent / "incidents"

class IncidentLoader:
    def __init__(self, incidents_dir: Optional[str] = None):
        if incidents_dir:
            self.incidents_dir = Path(incidents_dir).resolve()
        else:
            self.incidents_dir = DEFAULT_INCIDENTS_DIR.resolve()
        
        self.incidents: Dict[str, IncidentFull] = {}
        self._load_all()

    def _load_all(self):
        """Scans the incidents directory and loads all valid incidents."""
        if not self.incidents_dir.exists():
            print(f"Warning: Incidents directory not found at {self.incidents_dir}")
            return

        for incident_path in self.incidents_dir.iterdir():
            if incident_path.is_dir():
                incident_id = incident_path.name
                try:
                    incident = self._load_incident(incident_path)
                    if incident:
                        self.incidents[incident_id] = incident
                except Exception as e:
                    print(f"Error loading incident {incident_id}: {e}")

    def _load_incident(self, path: Path) -> Optional[IncidentFull]:
        """Loads metadata for a single incident."""
        public_path = path / "public.json"
        private_path = path / "private.json"

        if not public_path.exists() or not private_path.exists():
            return None

        with open(public_path, "r") as f:
            public_data = json.load(f)
            public_meta = IncidentPublic(**public_data)

        with open(private_path, "r") as f:
            private_data = json.load(f)
            private_meta = IncidentPrivate(**private_data)

        return IncidentFull(public=public_meta, private=private_meta)

    def get_incident(self, incident_id: str) -> Optional[IncidentFull]:
        return self.incidents.get(incident_id)

    def list_incidents(self) -> List[IncidentPublic]:
        return [inc.public for inc in self.incidents.values()]

    def get_broken_files(self, incident_id: str) -> Dict[str, str]:
        """Loads all files from the 'broken' directory for an incident."""
        return self._load_files(incident_id, "broken")

    def get_golden_files(self, incident_id: str) -> Dict[str, str]:
        """Loads all files from the 'golden' directory for an incident."""
        return self._load_files(incident_id, "golden")

    def _load_files(self, incident_id: str, subfolder: str) -> Dict[str, str]:
        files = {}
        path = self.incidents_dir / incident_id / subfolder
        if not path.exists():
            return files

        for file_path in path.rglob("*"):
            if file_path.is_file():
                # Store relative path as key
                relative_path = file_path.relative_to(path).as_posix()
                with open(file_path, "r", encoding="utf-8") as f:
                    files[relative_path] = f.read()
        return files


# Global instance
loader = IncidentLoader(incidents_dir=os.getenv("INCIDENTS_DIR"))
