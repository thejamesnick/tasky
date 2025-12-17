-- SQL Script to cleanup duplicate daily sheets
-- This keeps the LATEST sheet for each (Group/Title + Date) combination and deletes the older duplicates.

-- 1. Identify duplicates based on group_id and target_date (or title if group_id is missing/messy)
-- We want to keep the one with the most recent created_at.

DELETE FROM sheets
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY 
          COALESCE(group_id::text, title), -- Group by ID or Title if ID is null
          target_date 
        ORDER BY created_at DESC -- Keep the latest one
      ) as rn
    FROM sheets
    WHERE target_date = CURRENT_DATE::text -- Only clean today's mess (or remove this line to clean history too)
       OR target_date = to_char(now(), 'YYYY-MM-DD')
  ) duplicates
  WHERE duplicates.rn > 1 -- Delete anything that isn't the #1 latest
);
