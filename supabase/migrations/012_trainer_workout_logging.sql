-- Allow trainers to log workout sessions and set logs on behalf of clients.

DROP POLICY IF EXISTS "workout_sessions_client_rw" ON public.workout_sessions;
CREATE POLICY "workout_sessions_client_rw" ON public.workout_sessions
  FOR ALL TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer())
  WITH CHECK (client_id = auth.uid() OR public.is_trainer());

DROP POLICY IF EXISTS "set_logs_client_rw" ON public.set_logs;
CREATE POLICY "set_logs_client_rw" ON public.set_logs
  FOR ALL TO authenticated
  USING (
    public.is_trainer()
    OR EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.client_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_trainer()
    OR EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.client_id = auth.uid()
    )
  );
