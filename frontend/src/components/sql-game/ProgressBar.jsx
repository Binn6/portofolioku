export function ProgressBar({ solved, total }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0
  return (
    <div className="relative w-full h-[3px] bg-[#0a0a0a] flex-shrink-0">
      <div
        className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #00CC33 0%, #00FF41 60%, #00FFAA 100%)',
          boxShadow: '0 0 8px rgba(0,255,65,0.7), 0 0 2px rgba(0,255,65,1)',
        }}
      />
      {pct > 0 && pct < 100 && (
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${pct}%`, background: '#00FF41', boxShadow: '0 0 6px #00FF41' }}
        />
      )}
    </div>
  )
}
