"""
FastAPI application entrypoint.
"""

from fastapi import FastAPI

from src.api.router import api_router

app = FastAPI(
    title="AI Engineering Incident Simulator",
    version="0.1.0",
)

app.include_router(api_router)