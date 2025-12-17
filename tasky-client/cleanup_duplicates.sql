-- SQL Script to cleanup duplicate daily sheets
-- This keeps the LATEST sheet for each (Group/Title + Date) combination and deletes the older duplicates.
-- Fixed type casting for DATE column.

DELETE FROM sheets
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY 
          COALESCE(group_id::text, title), -- Group by ID or Title 
          target_date 
        ORDER BY created_at DESC -- Keep the latest one
      ) as rn
    FROM sheets
    WHERE target_date = CURRENT_DATE -- Works if target_date is DATE type
  ) duplicates
  WHERE duplicates.rn > 1 -- Delete anything that isn't the #1 latest
);
