ALTER TABLE "tickets"
ADD COLUMN "idempotency_key" VARCHAR(100),
ADD COLUMN "idempotency_hash" CHAR(64);

CREATE UNIQUE INDEX "tickets_user_id_idempotency_key_key"
ON "tickets"("user_id", "idempotency_key");
