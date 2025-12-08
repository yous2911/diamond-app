export default function ForgettingCurve() {
  return (
    <div className="relative w-full aspect-[4/3] bg-white rounded-xl border border-slate-100 shadow-sm p-6 overflow-hidden">
      {/* Titre interne */}
      <div className="absolute top-6 left-6 z-10">
        <h4 className="text-sm font-bold text-slate-900">Rétention Mémoire</h4>
        <p className="text-xs text-slate-500">Sans vs Avec RevEd</p>
      </div>
      <svg viewBox="0 0 400 300" className="w-full h-full overflow-visible">
        {/* Grille de fond */}
        <line x1="40" y1="260" x2="380" y2="260" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="40" y1="40" x2="40" y2="260" stroke="#e2e8f0" strokeWidth="1" />
        
        {/* Labels Axes */}
        <text x="380" y="275" textAnchor="end" fontSize="11" fill="#64748b" fontWeight="500">Temps</text>
        <text x="25" y="150" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="500" transform="rotate(-90 25 150)">Rétention</text>
        
        {/* Courbe 1 : L&apos;oubli naturel (Rouge/Gris) */}
        <path 
          d="M40,50 Q100,200 380,250" 
          fill="none" 
          stroke="#cbd5e1" 
          strokeWidth="2" 
          strokeDasharray="4 4"
        />
        <text x="300" y="240" fontSize="11" fill="#94a3b8" fontWeight="500">Oubli naturel</text>
        
        {/* Rappel 1 (RevEd) */}
        <path d="M40,50 Q80,100 120,180" fill="none" stroke="#3b82f6" strokeWidth="3" />
        <circle cx="120" cy="180" r="4" fill="#3b82f6" />
        <line x1="120" y1="180" x2="120" y2="50" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
        
        {/* Rappel 2 */}
        <path d="M120,50 Q200,80 220,140" fill="none" stroke="#3b82f6" strokeWidth="3" />
        <circle cx="220" cy="140" r="4" fill="#3b82f6" />
        <line x1="220" y1="140" x2="220" y2="50" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
        
        {/* Rappel 3 (Consolidation Or) */}
        <path d="M220,50 Q300,60 380,70" fill="none" stroke="#d97706" strokeWidth="3" />
        <circle cx="380" cy="70" r="4" fill="#d97706" />
        
        {/* Zone de réussite */}
        <path d="M220,50 L380,70 L380,260 L220,260 Z" fill="url(#goldGradient)" opacity="0.1" />
        
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#d97706" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
      {/* Badge Flottant */}
      <div className="absolute top-1/2 right-8 bg-white/90 backdrop-blur border border-amber-100 shadow-lg rounded-lg p-2 text-xs font-semibold text-amber-700">
        ✨ Ancrage durable
      </div>
    </div>
  );
}

