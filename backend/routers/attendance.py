import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from database import call_procedure

router = APIRouter(prefix="/attendance", tags=["Attendance"])

class CheckInRequest(BaseModel):
    uye_id: str = Field(..., min_length=1)

class CheckOutRequest(BaseModel):
    log_id: str = Field(..., min_length=1)

def generate_next_log_id():
    try:
        results = call_procedure("gym_GirisCikislariGetir")
        logs = results[0] if results else []
        max_num = 0
        for l in logs:
            lid = l.get("log_id") or ""
            if lid.startswith("LOG") and lid[3:].isdigit():
                num = int(lid[3:])
                if num > max_num:
                    max_num = num
        return f"LOG{max_num + 1:03d}"
    except Exception:
        return f"LOG_{str(uuid.uuid4())[:8]}"

@router.get("/")
def get_attendance_logs():
    try:
        results = call_procedure("gym_GirisCikislariGetir")
        return results[0] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/checkin", status_code=201)
def check_in_member(req: CheckInRequest):
    try:
        # First check if the member has an active open check-in (not checked out yet)
        results = call_procedure("gym_GirisCikislariGetir")
        logs = results[0] if results else []
        for l in logs:
            if l.get("uye_id") == req.uye_id and l.get("cikis_zamani") is None:
                raise HTTPException(
                    status_code=400,
                    detail="Hata: Bu üye zaten giriş yapmış durumda. Önce çıkış yapmalıdır."
                )

        new_log_id = generate_next_log_id()
        call_procedure("gym_GirisYap", (new_log_id, req.uye_id))
        return {"message": "Üye girişi başarıyla kaydedildi.", "log_id": new_log_id}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        msg = str(e)
        if "Hata" in msg or "HATA" in msg:
            if "Hata:" in msg:
                msg = msg.split("Hata:")[1].strip()
            elif "HATA:" in msg:
                msg = msg.split("HATA:")[1].strip()
            raise HTTPException(status_code=400, detail=msg)
        raise HTTPException(status_code=400, detail=msg)

@router.post("/checkout")
def check_out_member(req: CheckOutRequest):
    try:
        call_procedure("gym_CikisYap", (req.log_id,))
        return {"message": "Üye çıkışı başarıyla kaydedildi."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
