
from pydantic import BaseModel, HttpUrl


class RepositoryBase(BaseModel):
    name: str
    url: HttpUrl

class RepositoryCreate(RepositoryBase):
    pass

class Repository(RepositoryBase):
    id: str
    local_path: str
    status: str = "pending" # pending, syncing, ready, error

    class Config:
        from_attributes = True
