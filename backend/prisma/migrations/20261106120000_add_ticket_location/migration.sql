-- Add a location code for each damage report.
ALTER TABLE "tickets" ADD COLUMN "location" TEXT NOT NULL DEFAULT 'K1';
