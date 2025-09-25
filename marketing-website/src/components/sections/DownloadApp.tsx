import Button from "../ui/Button";

export default function DownloadApp() {
  return (
    <section className="relative py-20 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-indigo-900/30">
      <div className="absolute inset-0 bg-gradient-to-b from-deep-space/0 via-deep-space/40 to-deep-space"/>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-sora text-4xl md:text-5xl font-extrabold text-white mb-6">
            Téléchargez l'application
            <span className="block text-cognitive-gold">sur tous vos appareils</span>
          </h2>
          <p className="text-white/85 text-lg md:text-xl max-w-3xl mx-auto">
            Accédez à votre apprentissage personnalisé partout, à tout moment. 
            Disponible sur iOS, Android et navigateur web.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Web App */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:border-cognitive-gold/50 transition-all duration-300">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Application Web</h3>
            <p className="text-white/80 mb-6">
              Accès instantané depuis n'importe quel navigateur. 
              Aucune installation requise.
            </p>
            <Button 
              aria-label="Accéder à l'application web"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              🚀 Lancer l'app web
            </Button>
          </div>

          {/* iOS App - Direct Download */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:border-cognitive-gold/50 transition-all duration-300">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">iOS</h3>
            <p className="text-white/80 mb-6">
              Téléchargement direct - 100% gratuit. 
              Aucune commission, plus d'argent pour aider les élèves.
            </p>
            <Button 
              aria-label="Télécharger l'app iOS directement"
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800"
            >
              📱 Télécharger iOS
            </Button>
          </div>

          {/* Android App - Direct Download */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:border-cognitive-gold/50 transition-all duration-300">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.5559L4.841 5.9037a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Android</h3>
            <p className="text-white/80 mb-6">
              Téléchargement direct - 100% gratuit. 
              Aucune commission, plus d'argent pour aider les élèves.
            </p>
            <Button 
              aria-label="Télécharger l'app Android directement"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              🤖 Télécharger Android
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-cognitive-gold/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="text-white font-semibold mb-2">Synchronisation</h4>
            <p className="text-white/70 text-sm">Progression sauvegardée partout</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-cognitive-gold/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <h4 className="text-white font-semibold mb-2">Gamification</h4>
            <p className="text-white/70 text-sm">XP, niveaux, mascotte 3D</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-cognitive-gold/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h4 className="text-white font-semibold mb-2">Analytics</h4>
            <p className="text-white/70 text-sm">Rapports détaillés pour parents</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-cognitive-gold/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <h4 className="text-white font-semibold mb-2">Sécurité</h4>
            <p className="text-white/70 text-sm">Données protégées RGPD</p>
          </div>
        </div>

        {/* Social Impact Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full">
            <span className="text-green-400 font-semibold">
              💝 100% des revenus vont aux élèves défavorisés
            </span>
          </div>
          <p className="text-white/70 text-sm mt-4">
            Aucune commission d'app store = plus d'argent pour aider les enfants dans le besoin
          </p>
        </div>
      </div>
    </section>
  );
}
