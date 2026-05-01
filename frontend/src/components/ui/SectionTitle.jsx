export default function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-12">
      <h2 className="font-display text-3xl md:text-4xl font-semibold text-accent mb-3">
        {children}
      </h2>
      {subtitle && (
        <p className="text-accent-muted max-w-xl">{subtitle}</p>
      )}
      <div className="mt-4 h-px w-16 bg-accent-dim" />
    </div>
  )
}
