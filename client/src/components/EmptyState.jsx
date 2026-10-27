export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm">
      {Icon && <Icon className="h-12 w-12 text-earth" />}
      <h3 className="mt-3 text-lg font-semibold text-earth">{title}</h3>
      {text && <p className="mt-1 text-sm text-stone-500">{text}</p>}
      {children && <div className="mt-4 w-full">{children}</div>}
    </div>
  );
}
