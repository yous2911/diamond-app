export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t-2 border-text-medium/10 py-10 px-8 bg-warm-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-text-medium">
        <div>
          <p className="font-sora text-2xl font-bold text-cognitive-gold">RevEd</p>
          <p className="mt-3 text-text-dark">La fierté de maîtriser. La sérénité des parents.</p>
        </div>
        <div>
          <p className="font-sora text-text-dark mb-3 font-bold">Produit</p>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-cognitive-gold transition-colors">Comment ça marche</a></li>
            <li><a href="#" className="hover:text-cognitive-gold transition-colors">Rapports parents</a></li>
          </ul>
        </div>
        <div>
          <p className="font-sora text-text-dark mb-3 font-bold">Légal</p>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-cognitive-gold transition-colors">Confidentialité</a></li>
            <li><a href="#" className="hover:text-cognitive-gold transition-colors">CGU & Garantie</a></li>
            <li><a href="#" className="hover:text-cognitive-gold transition-colors">Mentions légales</a></li>
          </ul>
        </div>
        <div>
          <p className="font-sora text-text-dark mb-3 font-bold">Contact</p>
          <ul className="space-y-2">
            <li><a href="mailto:contact@reved.app" className="hover:text-cognitive-gold transition-colors">contact@reved.app</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 text-xs text-text-medium">© {year} RevEd. Tous droits réservés.</div>
    </footer>
  );
}





