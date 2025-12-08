export default function UrgencyBanner() {
  return (
    <div className="bg-gradient-to-r from-cognitive-gold/20 to-orange-400/20 border-2 border-cognitive-gold/40 rounded-xl p-4 mb-6 animate-pulse">
      <div className="text-center">
        <p className="text-text-dark font-bold">
          ⏰ <strong>PLACES LIMITÉES :</strong> Il ne reste que <span className="text-cognitive-gold font-bold text-xl">8 places</span> pour le Founders&apos; Circle de septembre
        </p>
        <p className="text-text-medium text-sm mt-1">Les 42 premières familles ont déjà rejoint le programme</p>
      </div>
    </div>
  );
}