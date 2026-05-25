import datetime
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from database import call_procedure

router = APIRouter(prefix="/memberships", tags=["Memberships"])

class MembershipCreate(BaseModel):
    uye_id: str = Field(..., min_length=1)
    paket_id: str = Field(..., min_length=1)
    baslangic_tarihi: str = Field(...) # Expected format: YYYY-MM-DD

def generate_next_membership_id():
    try:
        results = call_procedure("gym_UyelikleriGetir")
        memberships = results[0] if results else []
        max_num = 0
        for m in memberships:
            mid = m.get("uyelik_id") or ""
            if mid.startswith("MS") and mid[2:].isdigit():
                num = int(mid[2:])
                if num > max_num:
                    max_num = num
        return f"MS{max_num + 1:03d}"
    except Exception:
        return f"MS_{str(uuid.uuid4())[:8]}"

@router.get("/")
def get_all_memberships():
    try:
        results = call_procedure("gym_UyelikleriGetir")
        return results[0] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/member/{uye_id}")
def get_member_memberships(uye_id: str):
    try:
        results = call_procedure("gym_UyeUyelikler", (uye_id,))
        return results[0] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", status_code=201)
def create_membership(membership: MembershipCreate):
    try:
        new_id = generate_next_membership_id()
        # Ensure beginning date format is clean
        start_date = membership.baslangic_tarihi
        # We can parse the date string to verify it is valid
        try:
            parsed_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            # If it is valid, we convert to datetime string YYYY-MM-DD 00:00:00
            start_date_str = parsed_dt.strftime("%Y-%m-%d 00:00:00")
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı. YYYY-MM-DD formatında olmalıdır.")

        call_procedure("gym_UyelikEkle", (
            new_id,
            membership.uye_id,
            membership.paket_id,
            start_date_str
        ))
        return {"message": "Üyelik kaydı başarıyla oluşturuldu.", "uyelik_id": new_id}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        # Check database trigger/procedure exceptions (Turkish messages raised via SIGNAL SQLSTATE)
        msg = str(e)
        if "Hata" in msg or "HATA" in msg:
            # Clean up mysql connector prefix
            if "Hata:" in msg:
                msg = msg.split("Hata:")[1].strip()
            elif "HATA:" in msg:
                msg = msg.split("HATA:")[1].strip()
            raise HTTPException(status_code=400, detail=msg)
        raise HTTPException(status_code=400, detail=msg)
