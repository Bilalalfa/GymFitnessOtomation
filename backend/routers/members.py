import datetime
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from database import call_procedure
from mysql.connector import Error

router = APIRouter(prefix="/members", tags=["Members"])

class MemberCreate(BaseModel):
    tckn: str = Field(..., min_length=11, max_length=11)
    pasaport: Optional[str] = Field("", max_length=25)
    adi: str = Field(..., min_length=1, max_length=64)
    soyadi: str = Field(..., min_length=1, max_length=64)
    telefon: str = Field(..., min_length=1, max_length=25)
    mail: str = Field(..., min_length=1, max_length=250)

class MemberUpdate(MemberCreate):
    pass

def generate_next_uye_id():
    try:
        results = call_procedure("gym_UyelerHepsi")
        members = results[0] if results else []
        max_num = 0
        for m in members:
            uid = m.get("uye_id") or m.get("ID") or ""
            if uid.startswith("U") and uid[1:].isdigit():
                num = int(uid[1:])
                if num > max_num:
                    max_num = num
        return f"U{max_num + 1:03d}"
    except Exception:
        return f"U_{str(uuid.uuid4())[:8]}"

@router.get("/")
def get_all_members():
    try:
        results = call_procedure("gym_UyelerHepsi")
        return results[0] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
def search_members(q: str):
    try:
        results = call_procedure("gym_UyeBul", (q,))
        return results[0] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{uye_id}")
def get_member(uye_id: str):
    try:
        # Check if there is an explicit procedure, otherwise filter in python
        results = call_procedure("gym_UyelerHepsi")
        members = results[0] if results else []
        for m in members:
            # support both lowercase and uppercase keys depending on SQL procedure aliases
            mid = m.get("uye_id") or m.get("ID")
            if mid == uye_id:
                return m
        raise HTTPException(status_code=404, detail="Üye bulunamadı.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", status_code=201)
def create_member(member: MemberCreate):
    try:
        new_id = generate_next_uye_id()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        call_procedure("gym_UyeEkle", (
            new_id,
            member.tckn,
            member.pasaport or "",
            member.adi,
            member.soyadi,
            member.telefon,
            member.mail,
            now_str
        ))
        return {"message": "Üye başarıyla eklendi.", "uye_id": new_id}
    except Exception as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=409, detail="TCKN, Pasaport veya E-posta adresi sistemde zaten kayıtlı.")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{uye_id}")
def update_member(uye_id: str, member: MemberUpdate):
    try:
        # Check if member exists
        results = call_procedure("gym_UyelerHepsi")
        members = results[0] if results else []
        found = False
        reg_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for m in members:
            mid = m.get("uye_id") or m.get("ID")
            if mid == uye_id:
                found = True
                # Preserve the original registration date
                rd = m.get("kayit_tarihi") or m.get("Kayıt Tarihi")
                if rd:
                    if isinstance(rd, datetime.datetime) or isinstance(rd, datetime.date):
                        reg_date = rd.strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        reg_date = str(rd)
                break
        if not found:
            raise HTTPException(status_code=404, detail="Güncellenmek istenen üye bulunamadı.")

        call_procedure("gym_UyeGuncelle", (
            uye_id,
            member.tckn,
            member.pasaport or "",
            member.adi,
            member.soyadi,
            member.telefon,
            member.mail,
            reg_date
        ))
        return {"message": "Üye başarıyla güncellendi."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{uye_id}")
def delete_member(uye_id: str):
    try:
        call_procedure("gym_UyeSil", (uye_id,))
        return {"message": "Üye başarıyla silindi."}
    except Exception as e:
        if "foreign key constraint" in str(e).lower() or "1451" in str(e):
            raise HTTPException(status_code=400, detail="Bu üye silinemez çünkü aktif üyelikleri, ödemeleri veya giriş-çıkış kayıtları bulunmaktadır.")
        raise HTTPException(status_code=400, detail=str(e))
