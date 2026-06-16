"""sprint1_user_tables

Revision ID: fd431669c7a7
Revises: bde8833b2e78
Create Date: 2026-06-16 22:35:11.307096

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fd431669c7a7'
down_revision: Union[str, Sequence[str], None] = 'bde8833b2e78'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # ---------------- USERS ----------------

    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )

    # ---------------- USER TABLES ----------------

    op.create_table(
        'hint_usage',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('incident_id', sa.String(), nullable=False),
        sa.Column('hint_level', sa.Integer(), nullable=False),
        sa.Column(
            'used_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'user_incidents',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('incident_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('first_attempt_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('best_score', sa.Float(), nullable=False),
        sa.Column('attempts_count', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('user_id', 'incident_id')
    )

    op.create_table(
        'user_progress',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('current_incident_id', sa.String()),
        sa.Column('incidents_completed', sa.Integer(), nullable=False),
        sa.Column('total_attempts', sa.Integer(), nullable=False),
        sa.Column('hints_used', sa.Integer(), nullable=False),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('user_id')
    )

    op.create_table(
        'user_skills',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('skill_name', sa.String(), nullable=False),
        sa.Column('mastery_score', sa.Float(), nullable=False),
        sa.Column('attempts_on_skill', sa.Integer(), nullable=False),
        sa.Column('successes_on_skill', sa.Integer(), nullable=False),
        sa.Column(
            'last_updated',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('user_id', 'skill_name')
    )

    op.create_table(
        'attempt_files',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('attempt_id', sa.UUID(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(['attempt_id'], ['attempts.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # ---------------- MODIFY ATTEMPTS ----------------

    op.drop_constraint(
        'attempts_incident_id_fkey',
        'attempts',
        type_='foreignkey'
    )

    op.add_column(
        'attempts',
        sa.Column('user_id', sa.UUID(), nullable=False)
    )

    op.add_column(
        'attempts',
        sa.Column('attempt_number', sa.Integer(), nullable=False)
    )

    op.add_column(
        'attempts',
        sa.Column('passed', sa.Boolean(), nullable=False)
    )

    op.add_column(
        'attempts',
        sa.Column('score', sa.Float(), nullable=False)
    )

    op.add_column(
        'attempts',
        sa.Column('feedback', sa.Text(), nullable=False)
    )

    op.alter_column(
        'attempts',
        'incident_id',
        type_=sa.String()
    )

    op.create_foreign_key(
        None,
        'attempts',
        'users',
        ['user_id'],
        ['id']
    )

    op.drop_column(
        'attempts',
        'submission'
    )

    op.alter_column(
        'llm_evaluations',
        'created_at',
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False
    )

    op.alter_column(
        'attempts',
        'created_at',
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False
    )

    # NOW SAFE

    op.drop_table('incidents')


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('llm_evaluations', 'created_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=False)
    op.add_column('attempts', sa.Column('submission', sa.TEXT(), autoincrement=False, nullable=False))
    op.drop_constraint(None, 'attempts', type_='foreignkey')
    op.alter_column('attempts', 'created_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=False)
    op.alter_column('attempts', 'incident_id',
               existing_type=sa.String(),
               type_=sa.UUID(),
               existing_nullable=False)
    op.drop_column('attempts', 'feedback')
    op.drop_column('attempts', 'score')
    op.drop_column('attempts', 'passed')
    op.drop_column('attempts', 'attempt_number')
    op.drop_column('attempts', 'user_id')
    op.create_table('incidents',
    sa.Column('id', sa.UUID(), autoincrement=False, nullable=False),
    sa.Column('slug', sa.VARCHAR(length=255), autoincrement=False, nullable=False),
    sa.Column('title', sa.VARCHAR(length=255), autoincrement=False, nullable=False),
    sa.Column('description', sa.TEXT(), autoincrement=False, nullable=False),
    sa.Column('difficulty', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('public_spec_path', sa.VARCHAR(length=500), autoincrement=False, nullable=False),
    sa.Column('private_spec_path', sa.VARCHAR(length=500), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('incidents_pkey')),
    sa.UniqueConstraint('slug', name=op.f('incidents_slug_key'), postgresql_include=[], postgresql_nulls_not_distinct=False)
    )
    op.drop_table('attempt_files')
    op.drop_table('user_skills')
    op.drop_table('user_progress')
    op.drop_table('user_incidents')
    op.drop_table('hint_usage')
    op.drop_table('users')
    # ### end Alembic commands ###
