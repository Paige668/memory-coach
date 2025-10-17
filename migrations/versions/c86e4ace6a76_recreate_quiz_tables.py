"""recreate quiz tables

Revision ID: c86e4ace6a76
Revises: 966352db6d30
Create Date: 2025-10-14 21:08:28.981740

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c86e4ace6a76'
down_revision = '966352db6d30'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('memories', schema=None) as batch_op:
        # ① Allow null first (very critical)
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))

        # ② Index as usual
        batch_op.create_index('ix_memories_user_id', ['user_id'], unique=False)

        # ③ Foreign key must have a name (SQLite requirement)
        batch_op.create_foreign_key('fk_memories_user_id_users', 'users', ['user_id'], ['id'])


    # ### end Alembic commands ###


def downgrade():
    with op.batch_alter_table('memories', schema=None) as batch_op:
        batch_op.drop_constraint('fk_memories_user_id_users', type_='foreignkey')
        batch_op.drop_index('ix_memories_user_id')
        batch_op.drop_column('user_id')


    # ### end Alembic commands ###
