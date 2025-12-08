import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid md:grid-cols-[2fr,1fr,1fr] gap-8 md:gap-12 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              RevEd
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              La fierté de maîtriser. La sérénité de voir progresser.
            </p>
            <p className="text-xs text-slate-400">
              Plateforme d&apos;entraînement scolaire structurée pour le primaire (CP à CM2).
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">
              Produit
            </h4>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>
                <a href="#comment-ca-marche" className="hover:text-slate-900">
                  Comment ça marche
                </a>
              </li>
              <li>
                <a href="#rapports-parents" className="hover:text-slate-900">
                  Rapports parents
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">
              Légal & Contact
            </h4>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>
                <Link href="/confidentialite" className="hover:text-slate-900">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/conditions" className="hover:text-slate-900">
                  CGU & Garantie
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-slate-900">
                  Mentions légales
                </Link>
              </li>
              <li>
                <a href="mailto:contact@reved.app" className="hover:text-slate-900">
                  contact@reved.app
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} RevEd. Tous droits réservés.
          </p>
          <p className="text-[11px] text-slate-400">
            Conçu pour respecter le rythme réel d&apos;apprentissage de l&apos;enfant.
          </p>
        </div>
      </div>
    </footer>
  );
}
