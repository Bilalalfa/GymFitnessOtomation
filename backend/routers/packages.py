import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from database import call_procedure

router = APIRouter(prefix="/packages", tags=["Packages"])

class PackageCreate(BaseModel):
    paket_adi: str = Field(..., min_length=1, max_length=250)
    sure_ay: int = Field(..., gt=0)
    paket_fiyati: float = Field(..., gt=0)

class PackageUpdate(PackageCreate):
    pass

def generate_next_paket_id():
    try:
        results = call_procedure("gym_PaketleriGetir")
        packages = results[0] if results else []
        max_num = 0
        for p in packages:
            pid = p.get("paket_id") or ""
            if pid.startswith("P") and pid[1:].isdigit():
                num = int(pid[1:])
                if num > max_num:
                    max_num = num
        return f"P{max_num + 1:03d}"
    except Exception:
        return f"P_{str(uuid.uuid4())[:8]}"

@router.get("/")
def get_all_packages():
    try:
        results = call_procedure("gym_PaketleriGetir")
        return results[0] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
def search_packages(q: str):
    try:
        results = call_procedure("gym_UyelikPaketiBul", (q,))
        return results[0] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", status_code=201)
def create_package(package: PackageCreate):
    try:
        new_id = generate_next_paket_id()
        call_procedure("gym_PaketEkle", (
            new_id,
            package.paket_adi,
            package.sure_ay,
            package.paket_fiyati
        ))
        return {"message": "Üyelik paketi başarıyla oluşturuldu.", "paket_id": new_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{paket_id}")
def update_package(paket_id: str, package: PackageUpdate):
    try:
        # Check if package exists
        results = call_procedure("gym_PaketleriGetir")
        packages = results[0] if results else []
        found = False
        for p in packages:
            if p.get("paket_id") == paket_id:
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Güncellenmek istenen paket bulunamadı.")

        call_procedure("gym_PaketGuncelle", (
            paket_id,
            package.paket_adi,
            package.sure_ay,
            package.paket_fiyati
        ))
        return {"message": "Üyelik paketi başarıyla güncellendi."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{paket_id}")
def delete_package(paket_id: str):
    try:
        call_procedure("gym_PaketSil", (paket_id,))
        return {"message": "Üyelik paketi başarıyla silindi."}
    except Exception as e:
        if "foreign key constraint" in str(e).lower() or "1451" in str(e):
            raise HTTPException(status_code=400, detail="Bu paket silinemez çünkü bu pakete kayıtlı üyeler bulunmaktadır.")
        raise HTTPException(status_code=400, detail=str(e))
