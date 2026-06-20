"""
FastAPI application entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.router import api_router

app = FastAPI(
    title="AI Engineering Incident Simulator",
    version="0.1.0",
)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ai-engineering-incident-simulator.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)