'use client';

import { useState } from 'react';
import { PlayCircle } from 'lucide-react';

type YouTubeEmbedProps = {
  embedId: string;
  poster: string;
  title: string;
};

export default function YouTubeEmbed({ embedId, poster, title }: YouTubeEmbedProps) {
  const [isClicked, setIsClicked] = useState(false);

  if (isClicked) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${embedId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsClicked(true)}
      className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg cursor-pointer group"
      style={{
        backgroundImage: `url(${poster})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors duration-300">
        <PlayCircle
          size={80}
          className="text-cognitive-gold/80 group-hover:text-cognitive-gold transition-all duration-300 transform group-hover:scale-110"
        />
      </div>
      <p className="sr-only">Lancer la vidéo : {title}</p>
    </div>
  );
}





