from pydantic import BaseModel
from typing import Dict, List, Optional

class TableStatus(BaseModel):
    name: str
    row_count: int
    columns: List[str]

class DbStatusResponse(BaseModel):
    status: str
    database_url_masked: str
    dialect: str
    total_records: int
    tables: Dict[str, TableStatus]
