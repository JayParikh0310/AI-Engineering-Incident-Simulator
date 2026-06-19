from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, create_engine
from alembic import context
from dotenv import load_dotenv
import os

load_dotenv()  # loads your .env file

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from src.db.base import Base
from src.models import *

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = os.getenv("DATABASE_URL")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    url = os.getenv("DATABASE_URL")
    print("ALEMBIC URL:", url)
    
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()