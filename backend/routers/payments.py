import datetime
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from database import call_procedure

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentCreate(BaseModel):
    uye_id: str = Field(..., min_length=1)
    odeme_tutari: float = Field(..., gt=0)
    odeme_turu: str = Field(...) # 'Nakit', 'Kredi Kartı', 'Banka Havalesi'
    aciklama: Optional[str] = Field("", max_length=250)

def generate_next_payment_id():
    try:
        results = call_procedure("gym_OdemeleriGetir")
        payments = results[0] if results else []
        max_num = 0
        for p in payments:
            pid = p.get("odeme_id") or ""
            if pid.startswith("PAY") and pid[3:].isdigit():
                num = int(pid[3:])
                if num > max_num:
                    max_num = num
        return f"PAY{max_num + 1:03d}"
    except Exception:
        return f"PAY_{str(uuid.uuid4())[:8]}"

@router.get("/")
def get_all_payments():
    try:
        results = call_procedure("gym_OdemeleriGetir")
        return results[0] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/total")
def get_total_payments():
    try:
        results = call_procedure("gym_OdemelerToplam")
        if results and results[0]:
            # The column is called "Kasadaki Toplam Para"
            row = results[0][0]
            val = list(row.values())[0]
            return {"total": val or 0.0}
        return {"total": 0.0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/balance/{uye_id}")
def get_member_balance(uye_id: str):
    try:
        results = call_procedure("gym_UyeBakiye", (uye_id,))
        if results and results[0]:
            row = results[0][0]
            val = list(row.values())[0]
            return {"balance": val or 0.0}
        return {"balance": 0.0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", status_code=201)
def create_payment(payment: PaymentCreate):
    # Validate payment type in Python as well
    valid_types = ['Nakit', 'Kredi Kartı', 'Banka Havalesi', 'Tunai', 'Kartu Kredit', 'Transfer Bank']
    if payment.odeme_turu not in valid_types:
        raise HTTPException(
            status_code=400,
            detail="Hata: Geçersiz ödeme türü. Sadece Nakit, Kredi Kartı veya Banka Havalesi kabul edilir."
        )
    
    try:
        new_id = generate_next_payment_id()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        call_procedure("gym_OdemeEkle", (
            new_id,
            payment.uye_id,
            now_str,
            payment.odeme_tutari,
            payment.odeme_turu,
            payment.aciklama or ""
        ))
        return {"message": "Ödeme kaydı başarıyla eklendi.", "odeme_id": new_id}
    except Exception as e:
        msg = str(e)
        if "Hata" in msg or "HATA" in msg:
            if "Hata:" in msg:
                msg = msg.split("Hata:")[1].strip()
            elif "HATA:" in msg:
                msg = msg.split("HATA:")[1].strip()
            raise HTTPException(status_code=400, detail=msg)
        raise HTTPException(status_code=400, detail=msg)

@router.delete("/{odeme_id}")
def delete_payment(odeme_id: str):
    try:
        call_procedure("gym_OdemeSil", (odeme_id,))
        return {"message": "Ödeme kaydı başarıyla silindi."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
