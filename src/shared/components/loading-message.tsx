export function LoadingMessage({ message }: { message: string }) {
  return (
    <p role="status" className="text-zinc-500">
      {message}
    </p>
  );
}
