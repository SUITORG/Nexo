from fastapi import Header, HTTPException
from config import API_AUTH_TOKEN


async def verify_token(authorization: str = Header(None)):
    if not API_AUTH_TOKEN:
        return
    if not authorization:
        raise HTTPException(401, "Authorization header required")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or token != API_AUTH_TOKEN:
        raise HTTPException(401, "Invalid token")
