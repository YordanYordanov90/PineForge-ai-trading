CREATE INDEX "collections_user_id_created_at_idx" ON "collections" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "scripts_user_id_created_at_idx" ON "scripts" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "scripts_user_id_is_starred_idx" ON "scripts" USING btree ("user_id","is_starred");--> statement-breakpoint
CREATE INDEX "scripts_user_id_collection_id_idx" ON "scripts" USING btree ("user_id","collection_id");