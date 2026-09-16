export function ConfigWarning({ message }: { message: string }) {
  return (
    <div className="rounded-xl2 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
      <span className="font-medium">Setup needed: </span>
      {message}
    </div>
  );
}
