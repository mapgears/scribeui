from __future__ import with_statement
from alembic import context
from sqlalchemy import engine_from_config
from sqlalchemy.engine.base import Engine
from logging.config import fileConfig
from pyramid.paster import get_appsettings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

from scribeui_pyramid.modules.app.sqla import Base
# users module
from scribeui_pyramid.modules.workspaces.models import *
from scribeui_pyramid.modules.main.models import *

fileConfig(config.config_file_name)

engine = engine_from_config(config.get_section('app:main'), 'sqlalchemy.')

target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    context.configure(url=engine.url)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    if isinstance(engine, Engine):
        connection = engine.connect()
    else:
        raise Exception(
            'Expected engine instance got %s instead' % type(engine)
        )

    context.configure(
                connection=connection,
                target_metadata=target_metadata
                )

    try:
        with context.begin_transaction():
            context.run_migrations()
    finally:
        connection.close()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
