// tone: "amber" (default) or "red" (red is for emergencies ONLY)
export default function AlertCard({ icon: Icon, title, message, tone = 'amber' }) {
  const border = tone === 'red' ? 'border-danger' : 'border-accent';
  const color = tone === 'red' ? 'text-danger' : 'text-accent';
  return (
    <div className={`card flex items-start gap-3 border-l-4 ${border}`}>
      {Icon && <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${color}`} />}
      <div>
        <p className="font-semibold text-earth">{title}</p>
        {message && <p className="text-sm text-stone-600">{message}</p>}
      </div>
    </div>
  );
}
