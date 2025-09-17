export default function UrgencyBanner() {
  return (
    <div className="bg-gradient-to-r from-red-900/30 to-orange-600/30 border border-red-400/40 rounded-xl p-4 mb-6 animate-pulse">
      <div className="text-center">
        <p className="text-red-200 font-medium">
          ⏰ <strong>PLACES LIMITÉES :</strong> Il ne reste que <span className="text-cognitive-gold font-bold">8 places</span> pour le Founders' Circle de septembre
        </p>
        <p className="text-red-300 text-sm mt-1">Les 42 premières familles ont déjà rejoint le programme</p>
      </div>
    </div>
  );
}