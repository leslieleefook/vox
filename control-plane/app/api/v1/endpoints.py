"""REST API endpoints for the Vox Control Plane."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Client, Assistant, PhoneNumber, CallLog
from app.services.redis_service import redis_service
from app.api.v1.schemas import (
    ClientCreate, ClientUpdate, ClientResponse,
    AssistantCreate, AssistantUpdate, AssistantResponse,
    PhoneNumberCreate, PhoneNumberResponse,
    CallLogCreate, CallLogResponse, CallLogListResponse,
    HealthResponse
)

router = APIRouter()


# Health Check
@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """Check system health status."""
    db_status = "healthy"
    redis_status = "healthy"

    # Check database
    try:
        await db.execute(select(1))
    except Exception:
        db_status = "unhealthy"

    # Check Redis
    try:
        if redis_service.client:
            await redis_service.client.ping()
        else:
            redis_status = "not_connected"
    except Exception:
        redis_status = "unhealthy"

    overall_status = "healthy" if db_status == "healthy" and redis_status == "healthy" else "unhealthy"

    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status
    )


# Client endpoints
@router.post("/clients", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new client."""
    import secrets
    client = Client(
        name=data.name,
        api_key=secrets.token_hex(32),
        webhook_url=data.webhook_url
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


@router.get("/clients", response_model=List[ClientResponse])
async def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List all clients."""
    result = await db.execute(select(Client).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a client by ID."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.patch("/clients/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a client."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)

    await db.commit()
    await db.refresh(client)
    return client


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a client."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    await db.delete(client)
    await db.commit()


# Assistant endpoints
@router.post("/assistants", response_model=AssistantResponse, status_code=status.HTTP_201_CREATED)
async def create_assistant(
    data: AssistantCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new assistant."""
    # Verify client exists
    result = await db.execute(select(Client).where(Client.id == data.client_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Client not found")

    assistant = Assistant(**data.model_dump())
    db.add(assistant)
    await db.commit()
    await db.refresh(assistant)
    return assistant


@router.get("/assistants", response_model=List[AssistantResponse])
async def list_assistants(
    client_id: Optional[uuid.UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List assistants, optionally filtered by client."""
    query = select(Assistant)
    if client_id:
        query = query.where(Assistant.client_id == client_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/assistants/{assistant_id}", response_model=AssistantResponse)
async def get_assistant(
    assistant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get an assistant by ID."""
    result = await db.execute(select(Assistant).where(Assistant.id == assistant_id))
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return assistant


@router.patch("/assistants/{assistant_id}", response_model=AssistantResponse)
async def update_assistant(
    assistant_id: uuid.UUID,
    data: AssistantUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an assistant."""
    result = await db.execute(select(Assistant).where(Assistant.id == assistant_id))
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(assistant, key, value)

    # Invalidate cache
    await redis_service.invalidate_assistant(str(assistant_id))

    await db.commit()
    await db.refresh(assistant)
    return assistant


@router.delete("/assistants/{assistant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assistant(
    assistant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete an assistant."""
    result = await db.execute(select(Assistant).where(Assistant.id == assistant_id))
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    await redis_service.invalidate_assistant(str(assistant_id))
    await db.delete(assistant)
    await db.commit()


# Phone Number endpoints
@router.post("/phone-numbers", response_model=PhoneNumberResponse, status_code=status.HTTP_201_CREATED)
async def assign_phone_number(
    data: PhoneNumberCreate,
    db: AsyncSession = Depends(get_db)
):
    """Assign a phone number to an assistant."""
    # Verify assistant exists
    result = await db.execute(select(Assistant).where(Assistant.id == data.assistant_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assistant not found")

    phone = PhoneNumber(**data.model_dump())
    db.add(phone)
    await db.commit()
    await db.refresh(phone)
    return phone


@router.get("/phone-numbers", response_model=List[PhoneNumberResponse])
async def list_phone_numbers(
    assistant_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List phone numbers, optionally filtered by assistant."""
    query = select(PhoneNumber)
    if assistant_id:
        query = query.where(PhoneNumber.assistant_id == assistant_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/phone-numbers/{e164_number}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_phone_number(
    e164_number: str,
    db: AsyncSession = Depends(get_db)
):
    """Unassign a phone number."""
    result = await db.execute(
        select(PhoneNumber).where(PhoneNumber.e164_number == e164_number)
    )
    phone = result.scalar_one_or_none()
    if not phone:
        raise HTTPException(status_code=404, detail="Phone number not found")

    await redis_service.invalidate_phone(e164_number)
    await db.delete(phone)
    await db.commit()


# Call Log endpoints
@router.post("/call-logs", response_model=CallLogResponse, status_code=status.HTTP_201_CREATED)
async def create_call_log(
    data: CallLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a call log entry."""
    call_log = CallLog(**data.model_dump())
    db.add(call_log)
    await db.commit()
    await db.refresh(call_log)
    return call_log


@router.get("/call-logs", response_model=CallLogListResponse)
async def list_call_logs(
    client_id: Optional[uuid.UUID] = Query(None),
    assistant_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List call logs with pagination."""
    query = select(CallLog)
    count_query = select(func.count(CallLog.id))

    if client_id:
        query = query.where(CallLog.client_id == client_id)
        count_query = count_query.where(CallLog.client_id == client_id)
    if assistant_id:
        query = query.where(CallLog.assistant_id == assistant_id)
        count_query = count_query.where(CallLog.assistant_id == assistant_id)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated results
    offset = (page - 1) * page_size
    query = query.order_by(CallLog.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return CallLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/call-logs/{call_id}", response_model=CallLogResponse)
async def get_call_log(
    call_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a call log by ID."""
    result = await db.execute(select(CallLog).where(CallLog.id == call_id))
    call_log = result.scalar_one_or_none()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    return call_log
