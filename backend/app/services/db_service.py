from sqlalchemy.orm import Session
from sqlalchemy import inspect, text, Engine
from typing import Dict, Optional
from app.core.config import settings
from app.schemas.db import DbStatusResponse, TableStatus

def get_database_status(db: Session, engine: Optional[Engine] = None) -> DbStatusResponse:
    target_engine = engine or db.get_bind()
    inspector = inspect(target_engine)
    table_names = inspector.get_table_names()

    tables: Dict[str, TableStatus] = {}
    total_records = 0

    for name in table_names:
        cols = [c["name"] for c in inspector.get_columns(name)]
        try:
            res = db.execute(text(f"SELECT COUNT(*) FROM {name}")).scalar()
            row_count = int(res) if res is not None else 0
        except Exception:
            row_count = 0

        total_records += row_count
        tables[name] = TableStatus(
            name=name,
            row_count=row_count,
            columns=cols
        )

    # Mask database URL for security (hide credentials if postgresql)
    raw_url = settings.DATABASE_URL
    if "@" in raw_url:
        protocol, rest = raw_url.split("://", 1)
        _, host_db = rest.split("@", 1)
        masked_url = f"{protocol}://***:***@{host_db}"
    else:
        masked_url = raw_url

    dialect_str = getattr(getattr(target_engine, "dialect", None), "name", "sqlite")

    return DbStatusResponse(
        status="healthy",
        database_url_masked=masked_url,
        dialect=dialect_str,
        total_records=total_records,
        tables=tables
    )
