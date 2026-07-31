-- Seed Data for Cortex (Questions, Achievements, Daily Puzzles)

-- 1. Insert 10 Achievements
INSERT INTO public.achievements (key, title, description) VALUES
  ('first_win', 'First Victory', 'Win your first live 1v1 battle duel'),
  ('streak_7', '7 Day Streak', 'Maintain a brain training workout streak for 7 consecutive days'),
  ('streak_30', '30 Day Veteran', 'Maintain a workout streak for 30 days'),
  ('speed_demon', 'Sub-1.5s Speed', 'Answer a math challenge in under 1.5 seconds'),
  ('perfect_run', 'Flawless Victory', 'Win a 10-question match with 100% accuracy'),
  ('rating_1400', 'Division 1 Candidate', 'Reach an Elo rating of 1,400'),
  ('rating_1600', 'Grandmaster Mind', 'Reach an Elo rating of 1,600'),
  ('puzzle_master', 'Cross-Math Solver', 'Solve 10 daily Cross-Math puzzles'),
  ('night_owl', 'Observatory Shift', 'Complete a session between midnight and 4 AM'),
  ('battle_50', 'Centurion Athlete', 'Complete 50 live multiplayer duels')
ON CONFLICT (key) DO NOTHING;

-- 2. Insert Sample Math Questions (Batch generator structure)
DO $$
DECLARE
  i INT;
  op1 INT;
  op2 INT;
  ans INT;
  opt1 INT;
  opt2 INT;
  opt3 INT;
BEGIN
  FOR i IN 1..200 LOOP
    op1 := floor(random() * 90 + 10)::INT;
    op2 := floor(random() * 12 + 2)::INT;
    ans := op1 * op2;
    opt1 := ans + floor(random() * 10 + 1)::INT;
    opt2 := ans - floor(random() * 10 + 1)::INT;
    opt3 := ans + 20;

    INSERT INTO public.questions (type, prompt, options, answer, difficulty)
    VALUES (
      'math',
      op1 || ' × ' || op2,
      jsonb_build_array(ans, opt1, opt2, opt3),
      ans::text,
      CASE WHEN op1 > 50 THEN 2 ELSE 1 END
    );
  END LOOP;
END $$;

-- 3. Insert Daily Puzzles
INSERT INTO public.daily_puzzles (puzzle, solution, date) VALUES
  (
    '{"grid": [["8", "*", "6", "=", "48"], ["/", "", "-", "", ""], ["?", "-", "3", "=", "1"], ["=", "", "=", "", ""], ["2", "", "3", "", ""]]}',
    '4',
    CURRENT_DATE
  )
ON CONFLICT (date) DO NOTHING;
