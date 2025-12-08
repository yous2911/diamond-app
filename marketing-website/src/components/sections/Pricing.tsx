import Button from "../ui/Button";
import UrgencyBanner from "../ui/UrgencyBanner";

function PriceCard({ title, price, children, cta, isPopular = false, guarantee }: { 
  title: string; 
  price: string; 
  children: React.ReactNode; 
  cta: string; 
  isPopular?: boolean;
  guarantee?: string;
}) {
  return (
    <div className={`rounded-3xl border-2 p-8 flex flex-col relative ${
      isPopular 
        ? 'border-cognitive-gold bg-gradient-to-br from-cognitive-gold/20 to-cognitive-gold/5 shadow-2xl shadow-cognitive-gold/30' 
        : 'border-text-medium/20 bg-warm-white'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-cognitive-gold text-text-dark px-4 py-2 rounded-full text-sm font-bold shadow-lg">
          🏆 EXCLUSIF FONDATEURS
        </div>
      )}
      <h4 className="font-sora text-2xl mb-2 text-text-dark">{title}</h4>
      <div className="text-5xl font-extrabold text-cognitive-gold mb-4">
        {price}<span className="text-base text-text-medium font-normal">/mois</span>
      </div>
      <ul className="text-text-dark space-y-3 mb-6 list-none">
        {children}
      </ul>
      {guarantee && (
        <div className="bg-gradient-to-r from-spark-turquoise/20 to-mastery-blue/20 border-2 border-spark-turquoise/30 rounded-lg p-3 mb-4">
          <p className="text-text-dark text-sm text-center font-medium">✅ {guarantee}</p>
        </div>
      )}
      <Button className="mt-auto" aria-label={`Choisir l&apos;offre ${title}`}>{cta}</Button>
    </div>
  );
}

export default function Pricing() {
  return (
    <section className="py-20 px-6 bg-warm-white">
      <div className="max-w-6xl mx-auto">
        <h3 className="font-sora text-3xl md:text-4xl mb-8 text-center text-text-dark">Investissement dans l&apos;avenir de votre enfant</h3>
        <p className="text-center text-text-medium mb-8 text-lg">Moins cher qu&apos;un cours particulier (€40/h) • Plus efficace que 4h d&apos;écrans</p>
        
        <UrgencyBanner />
        
        <div className="grid md:grid-cols-2 gap-8">
          <PriceCard 
            title="Standard" 
            price="€30" 
            cta="Commencer immédiatement"
            guarantee="30 jours satisfait ou remboursé"
          >
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>Accès complet à l&apos;app (web + mobile)</span></li>
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>462 exercices avec répétition espacée</span></li>
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>Rapport de progrès hebdomadaire</span></li>
            <li className="flex items-start gap-2"><span className="text-spark-turquoise">🌍</span> <span><strong>1 abonnement acheté = 1 accès offert à un enfant méritant</strong></span></li>
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>Participation au mouvement d&apos;équité éducative</span></li>
          </PriceCard>
          
          <PriceCard 
            title="Maîtrise & Impact" 
            price="€100" 
            cta="Postuler au Founders&apos; Circle"
            isPopular={true}
            guarantee="60 jours + consultation gratuite 20min"
          >
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>Toutes les fonctions Standard</span></li>
            <li className="flex items-start gap-2"><span className="text-spark-turquoise">🌍</span> <span><strong>Impact amplifié : 3 enfants soutenus par votre abonnement</strong></span></li>
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>Rapports cognitifs détaillés (PDF)</span></li>
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>Accès direct à l&apos;équipe + nouveautés</span></li>
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span><strong>EXCLUSIF:</strong> 3 sessions coaching (20min)</span></li>
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>Certificat d&apos;impact social annuel</span></li>
            <li className="flex items-start gap-2"><span className="text-cognitive-gold">✅</span> <span>Garantie maîtrise ou remboursé</span></li>
          </PriceCard>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-text-medium text-sm mb-4">*Annulable à tout moment. Garantie Maîtrise (voir conditions).</p>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto mt-6">
            <div className="bg-gradient-to-br from-cognitive-gold/10 to-cognitive-gold/5 border-2 border-cognitive-gold/20 rounded-lg p-4">
              <p className="text-cognitive-gold font-bold mb-2">💡 ROI Familial:</p>
              <p className="text-text-dark text-sm">30 min/jour = 15h/semaine économisées en devoirs</p>
            </div>
            <div className="bg-gradient-to-br from-spark-turquoise/10 to-spark-turquoise/5 border-2 border-spark-turquoise/20 rounded-lg p-4">
              <p className="text-spark-turquoise font-bold mb-2">🌍 Impact Social:</p>
              <p className="text-text-dark text-sm">Votre abonnement = Accès gratuit pour des enfants méritants</p>
            </div>
          </div>
          
          <div className="mt-8 bg-gradient-to-r from-cognitive-gold/20 to-mastery-blue/20 border-2 border-cognitive-gold/30 rounded-xl p-6 max-w-3xl mx-auto">
            <p className="text-text-dark text-lg font-bold mb-2">
              🏆 Founders&apos; Circle = Double Impact
            </p>
            <p className="text-text-medium text-sm">
              Excellence éducative pour votre enfant + Impact social amplifié + Communauté de parents engagés
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}





