export default function LoadingSpinner({ message = 'Processing...' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="w-8 h-8 border-2 border-military-500 border-t-accent rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-mono">{message}</p>
    </div>
  );
}

export function InlineSpinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
  );
}
