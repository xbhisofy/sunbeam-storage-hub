// Share concurrent reads only; do not cache settled account data or mutations.
export function dedupeReads<T>(fetcher: (userId: string) => Promise<T>) {
  const pending = new Map<string, Promise<T>>();
  return (userId: string): Promise<T> => {
    const existing = pending.get(userId);
    if (existing) return existing;
    const request = Promise.resolve().then(() => fetcher(userId));
    pending.set(userId, request);
    const clear = () => { if (pending.get(userId) === request) pending.delete(userId); };
    void request.then(clear, clear);
    return request;
  };
}