CREATE TABLE "ticket_daily_sequences" (
    "date_key" VARCHAR(6) NOT NULL,
    "last_number" INTEGER NOT NULL,

    CONSTRAINT "ticket_daily_sequences_pkey" PRIMARY KEY ("date_key")
);

-- Preserve sequence continuity if codes in the new YYMMDDNNNN format already exist.
INSERT INTO "ticket_daily_sequences" ("date_key", "last_number")
SELECT SUBSTRING("code" FROM 1 FOR 6), MAX(CAST(SUBSTRING("code" FROM 7 FOR 4) AS INTEGER))
FROM "tickets"
WHERE "code" ~ '^[0-9]{10}$'
GROUP BY SUBSTRING("code" FROM 1 FOR 6);
