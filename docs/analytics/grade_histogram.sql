-- Distribution of guessed grades for the most recent puzzle, plus the actual
-- grade for context. Useful for spotting puzzles that are too easy or too hard.
--
-- Replace :game and :puzzle to query a specific puzzle. The defaults below
-- pick the latest puzzle for the requested game.

WITH guesses AS (
  SELECT
    game,
    puzzle_number,
    CAST(JSON_EXTRACT_SCALAR(props, '$.guess')        AS INTEGER) AS guess,
    CAST(JSON_EXTRACT_SCALAR(props, '$.actual_grade') AS INTEGER) AS actual_grade,
    CAST(JSON_EXTRACT_SCALAR(props, '$.diff')         AS INTEGER) AS diff
  FROM slabble.events
  WHERE event_type = 'guess_submitted'
    AND dt >= DATE_FORMAT(CURRENT_DATE - INTERVAL '30' DAY, '%Y-%m-%d')
    AND game = 'pokemon'   -- :game
),
target AS (
  SELECT game, MAX(puzzle_number) AS puzzle_number FROM guesses GROUP BY game
)
SELECT
  g.game,
  g.puzzle_number,
  MAX(g.actual_grade)              AS actual_grade,
  g.guess,
  COUNT(*)                         AS n,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY g.game, g.puzzle_number), 1) AS pct,
  AVG(g.diff)                      AS avg_diff
FROM guesses g
JOIN target t ON g.game = t.game AND g.puzzle_number = t.puzzle_number
GROUP BY g.game, g.puzzle_number, g.guess
ORDER BY g.guess;
