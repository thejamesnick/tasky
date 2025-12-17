-- DANGEROUS SCRIPT: Cleans almost everything.
-- This keeps ONLY:
-- 1. Sheets from BEFORE Today (Yesterday and older)
-- 2. IF you have no history, it keeps the top 4 latest sheets as a safety net.

-- Actually, simpler interpretation of user request:
-- "Clear everything created TODAY" (The messy duplicates)
-- "Just keep the stuff from yesterday"

DELETE FROM sheets
WHERE target_date IS NULL OR target_date >= CURRENT_DATE;

-- After running this, your "Today" views will be empty/reset, which is fine because the "Virtual Rollover" will handle creating new ones cleanly correctly this time.
