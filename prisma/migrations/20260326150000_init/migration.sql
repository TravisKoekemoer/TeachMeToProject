CREATE TABLE "signals" (
  "id" TEXT NOT NULL,
  "platform_signal_id" TEXT NOT NULL,
  "author_handle" TEXT NOT NULL,
  "author_display_name" TEXT,
  "post_text" TEXT NOT NULL,
  "post_url" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL,
  "raw_json" JSONB NOT NULL,
  "matched_rule" TEXT,
  "ingestion_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "signal_analyses" (
  "id" TEXT NOT NULL,
  "signal_id" TEXT NOT NULL,
  "cluster_id" TEXT,
  "sport" TEXT,
  "city" TEXT,
  "state" TEXT,
  "country" TEXT,
  "user_type" TEXT,
  "skill_level" TEXT,
  "lead_intent_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "urgency_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commercial_relevance_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sentiment" TEXT,
  "relevance_status" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "signal_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audience_clusters" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sport" TEXT NOT NULL,
  "geo_scope" TEXT NOT NULL,
  "audience_type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "confidence_score" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audience_clusters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audience_recipes" (
  "id" TEXT NOT NULL,
  "cluster_id" TEXT NOT NULL,
  "audience_name" TEXT NOT NULL,
  "target_sport" TEXT NOT NULL,
  "target_location" TEXT NOT NULL,
  "target_user_type" TEXT NOT NULL,
  "keyword_targets" TEXT[] NOT NULL,
  "conversation_targets" TEXT[] NOT NULL,
  "exclusions" TEXT[] NOT NULL,
  "suggested_landing_page" TEXT NOT NULL,
  "ad_angle" TEXT NOT NULL,
  "cta" TEXT NOT NULL,
  "confidence_score" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audience_recipes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rules" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "query_text" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sport" TEXT NOT NULL,
  "geography_hint" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "signals_platform_signal_id_key" ON "signals"("platform_signal_id");
CREATE UNIQUE INDEX "signal_analyses_signal_id_key" ON "signal_analyses"("signal_id");
CREATE UNIQUE INDEX "audience_recipes_cluster_id_key" ON "audience_recipes"("cluster_id");

CREATE INDEX "signals_created_at_idx" ON "signals"("created_at");
CREATE INDEX "signal_analyses_sport_relevance_status_idx" ON "signal_analyses"("sport", "relevance_status");
CREATE INDEX "signal_analyses_lead_intent_score_idx" ON "signal_analyses"("lead_intent_score");
CREATE INDEX "signal_analyses_processed_at_idx" ON "signal_analyses"("processed_at");
CREATE INDEX "audience_clusters_sport_idx" ON "audience_clusters"("sport");
CREATE INDEX "audience_recipes_target_sport_idx" ON "audience_recipes"("target_sport");

ALTER TABLE "signal_analyses"
  ADD CONSTRAINT "signal_analyses_signal_id_fkey"
  FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "signal_analyses"
  ADD CONSTRAINT "signal_analyses_cluster_id_fkey"
  FOREIGN KEY ("cluster_id") REFERENCES "audience_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audience_recipes"
  ADD CONSTRAINT "audience_recipes_cluster_id_fkey"
  FOREIGN KEY ("cluster_id") REFERENCES "audience_clusters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

