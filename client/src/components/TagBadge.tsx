export default function TagBadge({ name }: { name: string }) {
  return (
    <span className="px-1.5 py-0.5 bg-slate-100 rounded-full text-[10px] text-slate-500">
      {name}
    </span>
  );
}
