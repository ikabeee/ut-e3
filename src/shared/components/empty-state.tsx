export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-black/20 p-8 text-center text-zinc-500 dark:border-white/20">
      {message}
    </p>
  );
}
