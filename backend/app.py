import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import call_procedure
from routers import members, packages, memberships, payments, attendance
from mysql.connector import Error

app = FastAPI(
    title="Olympus Fitness Center API",
    description="Python FastAPI | MySQL Stored Procedures & Triggers | N-Tier Architecture",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local testing convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(members.router)
app.include_router(packages.router)
app.include_router(memberships.router)
app.include_router(payments.router)
app.include_router(attendance.router)

@app.get("/dashboard", tags=["Dashboard"])
def get_dashboard_summary():
    try:
        results = call_procedure("gym_DashboardOzeti")
        if results and results[0]:
            return results[0][0]
        return {
            "ToplamUye": 0,
            "AktifUyelik": 0,
            "BugunGiris": 0,
            "BuAyGelir": 0,
            "ToplamGelir": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Olympus Fitness Center API is running 🏋️"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
