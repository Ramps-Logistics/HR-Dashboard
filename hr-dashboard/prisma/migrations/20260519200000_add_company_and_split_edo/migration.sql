-- Add `company` column (defaulted to "Ramps Logistics") to every table that carries a country dimension.
ALTER TABLE "Vacancy"              ADD COLUMN "company" TEXT NOT NULL DEFAULT 'Ramps Logistics';
ALTER TABLE "CriticalRecruitment"  ADD COLUMN "company" TEXT NOT NULL DEFAULT 'Ramps Logistics';
ALTER TABLE "DisciplinaryCase"     ADD COLUMN "company" TEXT NOT NULL DEFAULT 'Ramps Logistics';
ALTER TABLE "ContractChange"       ADD COLUMN "company" TEXT NOT NULL DEFAULT 'Ramps Logistics';
ALTER TABLE "MedicalEnrollment"    ADD COLUMN "company" TEXT NOT NULL DEFAULT 'Ramps Logistics';
ALTER TABLE "EapReferral"          ADD COLUMN "company" TEXT NOT NULL DEFAULT 'Ramps Logistics';

-- Backfill: any historical row stored as "El Dorado Offshore TT"/"El Dorado Offshore GY" becomes
-- the matching country + company = 'EDO'. Default 'Ramps Logistics' covers the rest.
UPDATE "Vacancy"             SET company = 'EDO', country = 'Trinidad and Tobago' WHERE country = 'El Dorado Offshore TT';
UPDATE "Vacancy"             SET company = 'EDO', country = 'Guyana'              WHERE country = 'El Dorado Offshore GY';

UPDATE "CriticalRecruitment" SET company = 'EDO', country = 'Trinidad and Tobago' WHERE country = 'El Dorado Offshore TT';
UPDATE "CriticalRecruitment" SET company = 'EDO', country = 'Guyana'              WHERE country = 'El Dorado Offshore GY';

UPDATE "DisciplinaryCase"    SET company = 'EDO', country = 'Trinidad and Tobago' WHERE country = 'El Dorado Offshore TT';
UPDATE "DisciplinaryCase"    SET company = 'EDO', country = 'Guyana'              WHERE country = 'El Dorado Offshore GY';

UPDATE "ContractChange"      SET company = 'EDO', country = 'Trinidad and Tobago' WHERE country = 'El Dorado Offshore TT';
UPDATE "ContractChange"      SET company = 'EDO', country = 'Guyana'              WHERE country = 'El Dorado Offshore GY';

UPDATE "MedicalEnrollment"   SET company = 'EDO', country = 'Trinidad and Tobago' WHERE country = 'El Dorado Offshore TT';
UPDATE "MedicalEnrollment"   SET company = 'EDO', country = 'Guyana'              WHERE country = 'El Dorado Offshore GY';

UPDATE "EapReferral"         SET company = 'EDO', country = 'Trinidad and Tobago' WHERE country = 'El Dorado Offshore TT';
UPDATE "EapReferral"         SET company = 'EDO', country = 'Guyana'              WHERE country = 'El Dorado Offshore GY';
