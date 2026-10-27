import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { currentUserId } from '@/lib/session';

export const reviewScreens = ['home', 'files', 'upload', 'shared', 'profile'] as const;
export type ReviewScreen = typeof reviewScreens[number];
export function reviewSearch(input: Record<string, unknown>): { screen: ReviewScreen } {
  return { screen: reviewScreens.find(screen => screen === input.screen) ?? 'home' };
}
export type ReviewFile = { id: string; name: string; file_type: string; size: number; created_at: string };
export const sessionOptions = queryOptions({
  queryKey: ['mobileapp-review', 'session'],
  queryFn: currentUserId,
  staleTime: 0,
});
export function accountOptions(uid: string | null) {
  return queryOptions({
    queryKey: ['mobileapp-review', 'account', uid],
    queryFn: async () => {
      if (!uid) return null;
      const { data: profile, error } = await supabase.from('profiles')
        .select('display_name,email,premium_tier,premium_until').eq('id', uid).single();
      if (error) throw new Error('Could not load your account. Please try again.');
      const files: ReviewFile[] = [];
      for (let start = 0; ; start += 1000) {
        const { data, error: fileError } = await supabase.from('files')
          .select('id,name,file_type,size,created_at').eq('owner_id', uid)
          .order('created_at', { ascending: false }).order('id').range(start, start + 999);
        if (fileError) throw new Error('Could not load your files. Please try again.');
        files.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      return { profile, files };
    },
    staleTime: 30_000,
    retry: 1,
  });
}