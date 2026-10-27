export default function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex flex-col items-center text-center">
      {Icon && <Icon className="h-6 w-6 text-earth" />}
      <p className="mt-1 text-2xl font-bold text-brand">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}
