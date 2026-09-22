import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import areas, auth, billing, collectors, customers, dashboard, payments, plans

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(title="Cable TV Customer Management System", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(areas.router)
app.include_router(plans.router)
app.include_router(collectors.router)
app.include_router(customers.router)
app.include_router(billing.router)
app.include_router(payments.router)
app.include_router(dashboard.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
