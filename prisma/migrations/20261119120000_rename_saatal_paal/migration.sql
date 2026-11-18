-- The game of stand ZT-S4 is called "Saatal Paal" (S15). The seed only fills an empty catalog, so a database seeded
-- before the rename keeps "Saatan Paal": this fixes the name and the alt texts of its images. The slug (saatan-paal)
-- and the image paths stay, so the links and the files keep working. A name the sysadmin already changed is kept, and
-- running it again changes nothing.
UPDATE "games" SET "name" = 'Saatal Paal' WHERE "slug" = 'saatan-paal' AND "name" = 'Saatan Paal';

UPDATE "game_images"
SET "alt" = REPLACE("alt", 'Saatan Paal', 'Saatal Paal')
WHERE "alt" LIKE '%Saatan Paal%'
  AND "game_id" IN (SELECT "id" FROM "games" WHERE "slug" = 'saatan-paal');
