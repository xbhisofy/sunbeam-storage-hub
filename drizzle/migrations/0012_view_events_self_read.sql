-- Let each user read their own view history (for the app's Recent section).
create policy "viewer reads own events" on public.view_events
  for select to authenticated
  using (auth.uid() = viewer_id);
