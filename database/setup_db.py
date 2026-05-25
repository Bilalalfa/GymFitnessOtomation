import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "Bilal12345",
    "database": "gym_otomasyonu"
}

statements = [
    # ── SCHEMA ADJUSTMENTS ──────────────────────────────────────────────────
    """
    ALTER TABLE gym_uye_giris_cikis MODIFY COLUMN cikis_zamani datetime NULL DEFAULT NULL;
    """,
    """
    ALTER TABLE gym_uye_giris_cikis MODIFY COLUMN sure_dakika int NULL DEFAULT NULL;
    """,
    
    # ── FUNCTIONS ─────────────────────────────────────────────────────────────
    
    # 1. fn_UyeAktifMidir: Check if member has active membership today
    """
    DROP FUNCTION IF EXISTS fn_UyeAktifMidir;
    """,
    """
    CREATE FUNCTION fn_UyeAktifMidir(p_uye_id VARCHAR(64))
    RETURNS TINYINT(1)
    DETERMINISTIC
    READS SQL DATA
    BEGIN
        DECLARE v_count INT DEFAULT 0;
        SELECT COUNT(*) INTO v_count
        FROM gym_uye_uyelikleri
        WHERE uye_id = p_uye_id
          AND durum = 'Aktif'
          AND bitis_tarihi >= NOW();
        RETURN IF(v_count > 0, 1, 0);
    END
    """,

    # 2. fn_KalanGun: Get remaining days of active membership
    """
    DROP FUNCTION IF EXISTS fn_KalanGun;
    """,
    """
    CREATE FUNCTION fn_KalanGun(p_uye_id VARCHAR(64))
    RETURNS INT
    DETERMINISTIC
    READS SQL DATA
    BEGIN
        DECLARE v_kalan INT DEFAULT 0;
        SELECT DATEDIFF(bitis_tarihi, NOW()) INTO v_kalan
        FROM gym_uye_uyelikleri
        WHERE uye_id = p_uye_id
          AND durum = 'Aktif'
          AND bitis_tarihi >= NOW()
        ORDER BY bitis_tarihi DESC
        LIMIT 1;
        RETURN IFNULL(v_kalan, 0);
    END
    """,

    # 3. fn_ToplamGelir: Total sum of all payments
    """
    DROP FUNCTION IF EXISTS fn_ToplamGelir;
    """,
    """
    CREATE FUNCTION fn_ToplamGelir()
    RETURNS FLOAT
    DETERMINISTIC
    READS SQL DATA
    BEGIN
        DECLARE v_toplam FLOAT DEFAULT 0.0;
        SELECT COALESCE(SUM(odeme_tutari), 0.0) INTO v_toplam FROM gym_odemeler;
        RETURN v_toplam;
    END
    """,

    # ── TRIGGERS ──────────────────────────────────────────────────────────────
    
    # 1. tg_gym_giris_kontrol: Block attendance if membership is expired
    """
    DROP TRIGGER IF EXISTS tg_gym_giris_kontrol;
    """,
    """
    CREATE TRIGGER tg_gym_giris_kontrol
    BEFORE INSERT ON gym_uye_giris_cikis
    FOR EACH ROW
    BEGIN
        DECLARE v_aktif TINYINT(1);
        SET v_aktif = fn_UyeAktifMidir(NEW.uye_id);
        IF v_aktif = 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Hata: Bu üyenin aktif bir üyeliği bulunmamaktadır veya süresi dolmuştur. Giriş yapılamaz.';
        END IF;
    END
    """,

    # 2. tg_gym_cakisma_kontrol: Prevent overlapping active memberships
    """
    DROP TRIGGER IF EXISTS tg_gym_cakisma_kontrol;
    """,
    """
    CREATE TRIGGER tg_gym_cakisma_kontrol
    BEFORE INSERT ON gym_uye_uyelikleri
    FOR EACH ROW
    BEGIN
        DECLARE v_cakisma INT DEFAULT 0;
        IF NEW.durum = 'Aktif' THEN
            SELECT COUNT(*) INTO v_cakisma
            FROM gym_uye_uyelikleri
            WHERE uye_id = NEW.uye_id
              AND durum = 'Aktif'
              AND bitis_tarihi >= NEW.baslangic_tarihi
              AND baslangic_tarihi <= NEW.bitis_tarihi;
            IF v_cakisma > 0 THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Hata: Üyenin belirtilen tarihler arasında zaten aktif bir üyeliği bulunmaktadır.';
            END IF;
        END IF;
    END
    """,

    # 3. tg_giris_cikis_sure_hesapla (BEFORE INSERT): Override existing if needed
    """
    DROP TRIGGER IF EXISTS tg_giris_cikis_sure_hesapla;
    """,
    """
    CREATE TRIGGER tg_giris_cikis_sure_hesapla
    BEFORE INSERT ON gym_uye_giris_cikis
    FOR EACH ROW
    BEGIN
        IF NEW.cikis_zamani IS NOT NULL THEN
            SET NEW.sure_dakika = TIMESTAMPDIFF(MINUTE, NEW.giris_zamani, NEW.cikis_zamani);
        ELSE
            SET NEW.sure_dakika = NULL;
        END IF;
    END
    """,

    # 4. tg_gym_giris_cikis_sure_hesapla_update: Recalculate duration on check-out (UPDATE)
    """
    DROP TRIGGER IF EXISTS tg_gym_giris_cikis_sure_hesapla_update;
    """,
    """
    CREATE TRIGGER tg_gym_giris_cikis_sure_hesapla_update
    BEFORE UPDATE ON gym_uye_giris_cikis
    FOR EACH ROW
    BEGIN
        IF NEW.cikis_zamani IS NOT NULL THEN
            SET NEW.sure_dakika = TIMESTAMPDIFF(MINUTE, NEW.giris_zamani, NEW.cikis_zamani);
        END IF;
    END
    """,

    # ── PROCEDURES ────────────────────────────────────────────────────────────

    # 1. gym_UyeSil
    """
    DROP PROCEDURE IF EXISTS gym_UyeSil;
    """,
    """
    CREATE PROCEDURE gym_UyeSil(IN p_uye_id VARCHAR(64))
    BEGIN
        DELETE FROM gym_uyeler WHERE uye_id = p_uye_id;
    END
    """,

    # 2. gym_PaketEkle
    """
    DROP PROCEDURE IF EXISTS gym_PaketEkle;
    """,
    """
    CREATE PROCEDURE gym_PaketEkle(
        IN p_paket_id VARCHAR(64),
        IN p_paket_adi VARCHAR(250),
        IN p_sure_ay INT,
        IN p_paket_fiyati FLOAT
    )
    BEGIN
        INSERT INTO gym_uyelik_paketleri (paket_id, paket_adi, sure_ay, paket_fiyati)
        VALUES (p_paket_id, p_paket_adi, p_sure_ay, p_paket_fiyati);
    END
    """,

    # 3. gym_PaketGuncelle
    """
    DROP PROCEDURE IF EXISTS gym_PaketGuncelle;
    """,
    """
    CREATE PROCEDURE gym_PaketGuncelle(
        IN p_paket_id VARCHAR(64),
        IN p_paket_adi VARCHAR(250),
        IN p_sure_ay INT,
        IN p_paket_fiyati FLOAT
    )
    BEGIN
        UPDATE gym_uyelik_paketleri
        SET paket_adi = p_paket_adi, sure_ay = p_sure_ay, paket_fiyati = p_paket_fiyati
        WHERE paket_id = p_paket_id;
    END
    """,

    # 4. gym_PaketSil
    """
    DROP PROCEDURE IF EXISTS gym_PaketSil;
    """,
    """
    CREATE PROCEDURE gym_PaketSil(IN p_paket_id VARCHAR(64))
    BEGIN
        DELETE FROM gym_uyelik_paketleri WHERE paket_id = p_paket_id;
    END
    """,

    # 5. gym_PaketleriGetir
    """
    DROP PROCEDURE IF EXISTS gym_PaketleriGetir;
    """,
    """
    CREATE PROCEDURE gym_PaketleriGetir()
    BEGIN
        SELECT paket_id, paket_adi, sure_ay, paket_fiyati FROM gym_uyelik_paketleri ORDER BY paket_fiyati ASC;
    END
    """,

    # 6. gym_UyelikEkle
    """
    DROP PROCEDURE IF EXISTS gym_UyelikEkle;
    """,
    """
    CREATE PROCEDURE gym_UyelikEkle(
        IN p_uyelik_id VARCHAR(64),
        IN p_uye_id VARCHAR(64),
        IN p_paket_id VARCHAR(64),
        IN p_baslangic_tarihi DATETIME
    )
    BEGIN
        DECLARE v_sure INT;
        DECLARE v_bitis DATETIME;

        -- Validate member exists
        IF NOT EXISTS (SELECT 1 FROM gym_uyeler WHERE uye_id = p_uye_id) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Hata: Üye bulunamadı. Önce üye kaydı yapılmalıdır.';
        END IF;

        -- Validate package exists
        SELECT sure_ay INTO v_sure FROM gym_uyelik_paketleri WHERE paket_id = p_paket_id;
        IF v_sure IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Hata: Geçersiz paket. Paket sistemde tanımlı değil.';
        END IF;

        SET v_bitis = DATE_ADD(p_baslangic_tarihi, INTERVAL v_sure MONTH);

        INSERT INTO gym_uye_uyelikleri (uyelik_id, uye_id, paket_id, baslangic_tarihi, bitis_tarihi, durum)
        VALUES (p_uyelik_id, p_uye_id, p_paket_id, p_baslangic_tarihi, v_bitis, 'Aktif');
    END
    """,

    # 7. gym_UyelikleriGetir
    """
    DROP PROCEDURE IF EXISTS gym_UyelikleriGetir;
    """,
    """
    CREATE PROCEDURE gym_UyelikleriGetir()
    BEGIN
        -- Auto-update expired memberships
        UPDATE gym_uye_uyelikleri SET durum='Pasif'
        WHERE bitis_tarihi < NOW() AND durum='Aktif';

        SELECT uu.uyelik_id, uu.uye_id, uu.paket_id, uu.baslangic_tarihi, uu.bitis_tarihi, uu.durum,
               CONCAT(u.adi, ' ', u.soyadi) AS uye_ad_soyad, u.tckn, p.paket_adi, p.sure_ay, p.paket_fiyati
        FROM gym_uye_uyelikleri uu
        JOIN gym_uyeler u ON uu.uye_id = u.uye_id
        JOIN gym_uyelik_paketleri p ON uu.paket_id = p.paket_id
        ORDER BY uu.baslangic_tarihi DESC;
    END
    """,

    # 8. gym_OdemeEkle
    """
    DROP PROCEDURE IF EXISTS gym_OdemeEkle;
    """,
    """
    CREATE PROCEDURE gym_OdemeEkle(
        IN p_odeme_id VARCHAR(64),
        IN p_uye_id VARCHAR(64),
        IN p_odeme_tarihi DATETIME,
        IN p_odeme_tutari FLOAT,
        IN p_odeme_turu VARCHAR(25),
        IN p_aciklama VARCHAR(250)
    )
    BEGIN
        -- Validate member
        IF NOT EXISTS (SELECT 1 FROM gym_uyeler WHERE uye_id = p_uye_id) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Hata: Üye bulunamadı.';
        END IF;

        -- Validate payment type (support both Indonesian and Turkish translations of checkout type)
        IF p_odeme_turu NOT IN ('Tunai', 'Kartu Kredit', 'Transfer Bank', 'Nakit', 'Kredi Kartı', 'Banka Havalesi') THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Hata: Geçersiz ödeme türü. Sadece Nakit, Kredi Kartı veya Banka Havalesi kabul edilir.';
        END IF;

        INSERT INTO gym_odemeler (odeme_id, uye_id, odeme_tarihi, odeme_tutari, odeme_turu, aciklama)
        VALUES (p_odeme_id, p_uye_id, p_odeme_tarihi, p_odeme_tutari, p_odeme_turu, p_aciklama);
    END
    """,

    # 9. gym_OdemeleriGetir
    """
    DROP PROCEDURE IF EXISTS gym_OdemeleriGetir;
    """,
    """
    CREATE PROCEDURE gym_OdemeleriGetir()
    BEGIN
        SELECT o.odeme_id, o.uye_id, o.odeme_tarihi, o.odeme_tutari, o.odeme_turu, o.aciklama,
               CONCAT(u.adi, ' ', u.soyadi) AS uye_ad_soyad, u.tckn
        FROM gym_odemeler o
        JOIN gym_uyeler u ON o.uye_id = u.uye_id
        ORDER BY o.odeme_tarihi DESC;
    END
    """,

    # 10. gym_GirisYap
    """
    DROP PROCEDURE IF EXISTS gym_GirisYap;
    """,
    """
    CREATE PROCEDURE gym_GirisYap(
        IN p_log_id VARCHAR(64),
        IN p_uye_id VARCHAR(64)
    )
    BEGIN
        INSERT INTO gym_uye_giris_cikis (log_id, uye_id, giris_zamani, cikis_zamani, sure_dakika)
        VALUES (p_log_id, p_uye_id, NOW(), NULL, NULL);
    END
    """,

    # 11. gym_CikisYap
    """
    DROP PROCEDURE IF EXISTS gym_CikisYap;
    """,
    """
    CREATE PROCEDURE gym_CikisYap(
        IN p_log_id VARCHAR(64)
    )
    BEGIN
        UPDATE gym_uye_giris_cikis
        SET cikis_zamani = NOW()
        WHERE log_id = p_log_id AND cikis_zamani IS NULL;
    END
    """,

    # 12. gym_GirisCikislariGetir
    """
    DROP PROCEDURE IF EXISTS gym_GirisCikislariGetir;
    """,
    """
    CREATE PROCEDURE gym_GirisCikislariGetir()
    BEGIN
        SELECT gc.log_id, gc.uye_id, gc.giris_zamani, gc.cikis_zamani, gc.sure_dakika,
               CONCAT(u.adi, ' ', u.soyadi) AS uye_ad_soyad, u.tckn
        FROM gym_uye_giris_cikis gc
        JOIN gym_uyeler u ON gc.uye_id = u.uye_id
        ORDER BY gc.giris_zamani DESC
        LIMIT 200;
    END
    """,

    # 13. gym_DashboardOzeti
    """
    DROP PROCEDURE IF EXISTS gym_DashboardOzeti;
    """,
    """
    CREATE PROCEDURE gym_DashboardOzeti()
    BEGIN
        -- Auto-passivate expired memberships
        UPDATE gym_uye_uyelikleri SET durum='Pasif'
        WHERE bitis_tarihi < NOW() AND durum='Aktif';

        SELECT
            (SELECT COUNT(*) FROM gym_uyeler) AS ToplamUye,
            (SELECT COUNT(*) FROM gym_uye_uyelikleri WHERE durum='Aktif' AND bitis_tarihi >= NOW()) AS AktifUyelik,
            (SELECT COUNT(*) FROM gym_uye_giris_cikis WHERE DATE(giris_zamani) = CURDATE()) AS BugunGiris,
            (SELECT COALESCE(SUM(odeme_tutari), 0) FROM gym_odemeler WHERE MONTH(odeme_tarihi) = MONTH(CURDATE()) AND YEAR(odeme_tarihi) = YEAR(CURDATE())) AS BuAyGelir,
            fn_ToplamGelir() AS ToplamGelir;
    END
    """,

    # 14. gym_UyelerHepsi (recreate with clean names)
    """
    DROP PROCEDURE IF EXISTS gym_UyelerHepsi;
    """,
    """
    CREATE PROCEDURE gym_UyelerHepsi()
    BEGIN
        SELECT 
            uye_id,
            tckn,
            pasaport,
            adi,
            soyadi,
            telefon, 
            mail,
            kayit_tarihi,
            fn_UyeAktifMidir(uye_id) AS aktif_mi,
            fn_KalanGun(uye_id) AS kalan_gun
        FROM gym_uyeler
        ORDER BY uye_id DESC;
    END
    """
]

def run():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("Connected to database successfully. Applying SQL schema objects...")
        for stmt in statements:
            stmt_clean = stmt.strip()
            if not stmt_clean:
                continue
            try:
                cursor.execute(stmt_clean)
                conn.commit()
            except Error as e:
                print(f"Failed to execute statement:\n{stmt_clean}\nError: {e}")
                # Don't abort on drop queries failing if they are expected, but abort on create query failures
                if not stmt_clean.startswith("DROP"):
                    raise e
        print("All database objects applied successfully!")
        cursor.close()
        conn.close()
    except Error as e:
        print("Database setup failed:", e)

if __name__ == "__main__":
    run()
