const styles: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  approved: "bg-accent text-accent-foreground",
  paid: "bg-primary text-primary-foreground",
  rejected: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${styles[status] ?? styles["pending"]}`}>{status}</span>;
}
