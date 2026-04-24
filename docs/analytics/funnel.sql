-- Daily funnel: card_viewed -> guess_submitted -> share_clicked, by game.
-- Counts unique users at each stage so we can see drop-off rates.

WITH per_user AS (
  SELECT
    dt,
    game,
    anon_user_id,
    MAX(CASE WHEN event_type = 'card_viewed'      THEN 1 ELSE 0 END) AS viewed,
    MAX(CASE WHEN event_type = 'guess_submitted'  THEN 1 ELSE 0 END) AS guessed,
    MAX(CASE WHEN event_type = 'share_clicked'    THEN 1 ELSE 0 END) AS shared
  FROM slabble.events
  WHERE dt >= DATE_FORMAT(CURRENT_DATE - INTERVAL '14' DAY, '%Y-%m-%d')
  GROUP BY dt, game, anon_user_id
)
SELECT
  dt,
  game,
  SUM(viewed)                                     AS users_viewed,
  SUM(guessed)                                    AS users_guessed,
  SUM(shared)                                     AS users_shared,
  ROUND(100.0 * SUM(guessed) / NULLIF(SUM(viewed),  0), 1) AS view_to_guess_pct,
  ROUND(100.0 * SUM(shared)  / NULLIF(SUM(guessed), 0), 1) AS guess_to_share_pct
FROM per_user
GROUP BY dt, game
ORDER BY dt DESC, game;
