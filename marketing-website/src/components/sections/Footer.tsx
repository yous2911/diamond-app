export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 py-10 px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-white/70">
        <div>
          <p className="font-sora text-2xl font-bold text-cognitive-gold">RevEd</p>
          <p className="mt-3">La fierté de maîtriser. La sérénité des parents.</p>
        </div>
        <div>
          <p className="font-sora text-white mb-3">Produit</p>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Comment ça marche</a></li>
            <li><a href="#" className="hover:underline">Rapports parents</a></li>
          </ul>
        </div>
        <div>
          <p className="font-sora text-white mb-3">Légal</p>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Confidentialité</a></li>
            <li><a href="#" className="hover:underline">CGU & Garantie</a></li>
            <li><a href="#" className="hover:underline">Mentions légales</a></li>
          </ul>
        </div>
        <div>
          <p className="font-sora text-white mb-3">Contact</p>
          <ul className="space-y-2">
            <li><a href="mailto:contact@reved.app" className="hover:underline">contact@reved.app</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 text-xs text-white/50">© {year} RevEd. Tous droits réservés.</div>
    </footer>
  );
}



