ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "phone" text;--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");