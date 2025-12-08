import { Globe, Scale, Users, GraduationCap } from "lucide-react";

export default function ImpactB1G1() {
  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Colonne Gauche : Le Manifeste Noble */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-6">
              Engagement Sociétal
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
              Démocratiser l&apos;excellence,<br/> 
              <span className="text-blue-600">pas l&apos;exigence.</span>
            </h2>
            
            <div className="space-y-6 text-lg text-slate-600">
              <p className="leading-relaxed">
                L&apos;intelligence est universelle, mais l&apos;accès aux meilleures méthodes ne l&apos;est pas.
              </p>
              <p className="leading-relaxed">
                Issu des meilleures pratiques des <strong>grandes écoles internationales</strong>, RevEd rend accessibles à tous des standards pédagogiques élevés. Nous refusons la baisse de niveau par compassion. L&apos;égalité réelle passe par l&apos;accès partagé aux meilleurs outils.
              </p>
            </div>
            {/* Badges d'autorité */}
            <div className="mt-10 grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-slate-900">Standards Élite</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Inspiré des meilleures institutions mondiales</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900">Accès Universel</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">L&apos;excellence pour chaque enfant</span>
              </div>
            </div>
          </div>
          {/* Colonne Droite : La Mécanique (Visuelle) */}
          <div className="relative">
            {/* Carte Principale */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-sm relative z-10">
              <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                Le Pacte d&apos;Égalité
              </h3>
              <p className="text-slate-600 mb-6 text-sm">
                Pour chaque famille qui s&apos;abonne, nous finançons l&apos;accès à la plateforme pour un enfant en zone prioritaire.
              </p>
              
              <div className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Votre enfant</p>
                    <p className="text-xs text-slate-500">Accès Premium</p>
                  </div>
                </div>
                <div className="text-blue-200">➔</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Un autre enfant</p>
                    <p className="text-xs text-slate-500">Accès Financé</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-slate-400 mt-2">
                Même algorithme. Même contenu. Même chance.
              </p>
            </div>
            {/* Décoration d'arrière-plan */}
            <div className="absolute top-4 -right-4 w-full h-full bg-blue-600/5 rounded-2xl -z-0"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
