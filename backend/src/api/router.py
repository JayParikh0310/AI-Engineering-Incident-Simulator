"""
Main API router.
"""

from fastapi import APIRouter

from src.api.v1.auth import router as auth_router
from src.api.v1.health import router as health_router
from src.api.v1.incidents import router as incidents_router

api_router = APIRouter()

# Create a v1 router to group all v1 endpoints
v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(health_router)
v1_router.include_router(incidents_router)

# Include v1_router into the main api_router
api_router.include_router(v1_router)
