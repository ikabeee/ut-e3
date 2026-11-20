-- Every player entered in the KOF keeps the ticket, also the ones that did not check in. The tickets that a no-show
-- voided come back to the raffle, except for an excluded visitor (the exclusion voids it) and for a visitor already
-- drawn (all their tickets stay out of the drum, RF-52, RN-05).
UPDATE "raffle_tickets"
SET "status" = 'active'
WHERE "milestone" = 0
  AND "status" = 'voided'
  AND "visitor_id" IN (SELECT e."visitor_id" FROM "tournament_entries" e WHERE e."status" = 'no_show')
  AND "visitor_id" IN (SELECT v."id" FROM "visitors" v WHERE v."excluded_at" IS NULL)
  AND "visitor_id" NOT IN (SELECT t."visitor_id" FROM "raffle_tickets" t WHERE t."status" = 'drawn');
