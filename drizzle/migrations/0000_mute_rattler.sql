CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(200),
	"content" text NOT NULL,
	"version" integer DEFAULT 1,
	"parent_id" integer,
	"is_starred" boolean DEFAULT false,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"collection_id" integer,
	"model" varchar(100),
	"account_balance" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255),
	"plan" varchar(20) DEFAULT 'free',
	"generations_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;