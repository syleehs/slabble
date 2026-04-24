-- Day-N retention: of users who played on day D, how many came back on
-- day D+1, D+7, D+30. "Played" = submitted a guess on that day.
--
-- Reads the last 60 days. For longer windows, widen the dt filter.

WITH plays AS (
  SELECT DISTINCT
    anon_user_id,
    DATE(FROM_ISO8601_DATE(dt)) AS play_date
  FROM slabble.events
  WHERE event_type = 'guess_submitted'
    AND dt >= DATE_FORMAT(CURRENT_DATE - INTERVAL '60' DAY, '%Y-%m-%d')
),
cohort AS (
  SELECT play_date AS cohort_date, anon_user_id FROM plays
),
returns AS (
  SELECT
    c.cohort_date,
    c.anon_user_id,
    MAX(CASE WHEN p.play_date = c.cohort_date + INTERVAL '1'  DAY THEN 1 ELSE 0 END) AS d1,
    MAX(CASE WHEN p.play_date = c.cohort_date + INTERVAL '7'  DAY THEN 1 ELSE 0 END) AS d7,
    MAX(CASE WHEN p.play_date = c.cohort_date + INTERVAL '30' DAY THEN 1 ELSE 0 END) AS d30
  FROM cohort c
  LEFT JOIN plays p ON p.anon_user_id = c.anon_user_id
  GROUP BY c.cohort_date, c.anon_user_id
)
SELECT
  cohort_date,
  COUNT(*)                                                   AS cohort_size,
  ROUND(100.0 * SUM(d1)  / COUNT(*), 1)                      AS d1_retention_pct,
  ROUND(100.0 * SUM(d7)  / COUNT(*), 1)                      AS d7_retention_pct,
  ROUND(100.0 * SUM(d30) / COUNT(*), 1)                      AS d30_retention_pct
FROM returns
GROUP BY cohort_date
ORDER BY cohort_date DESC;
