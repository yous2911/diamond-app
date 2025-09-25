import YouTubeEmbed from "../ui/YouTubeEmbed";

export default function FullPresentation() {
  return (
    <section id="presentation" className="py-20 px-6 md:px-10 border-y border-white/10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-sora text-4xl md:text-5xl mb-4">
          Notre Mission, Expliquée en Vidéo
        </h2>
        <p className="text-white/75 max-w-2xl mx-auto mb-10">
          Découvrez comment RevEd réinvente l'apprentissage grâce à une méthode fondée sur la science et un engagement pour l'impact social.
        </p>
        <YouTubeEmbed
          embedId="VOTRE_ID_YOUTUBE_ICI" // <-- METTEZ L'ID DE VOTRE VIDÉO
          poster="/img/presentation-thumbnail.jpg" // L'IMAGE DE PRÉSENTATION
          title="Présentation complète de RevEd"
        />
      </div>
    </section>
  );
}









