import { useNavigate } from "react-router-dom";

interface ImageLink {
  imageUrl: string;
  alt: string;
  link: string;
  title?: string;
}

interface ImageLandingPageProps {
  images: ImageLink[];
}

export function ImageLandingPage({ images }: ImageLandingPageProps) {
  const navigate = useNavigate();

  const handleImageClick = (link: string) => {
    // Se o link começa com http, abrir em nova aba
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.open(link, "_blank");
    } else {
      // Caso contrário, navegar usando react-router
      navigate(link);
    }
  };

  return (
    <div className="w-full h-screen overflow-y-auto bg-gray-900">
      <div className="flex flex-col gap-0">
        {images.map((item, index) => (
          <div
            key={index}
            onClick={() => handleImageClick(item.link)}
            className="group relative cursor-pointer overflow-hidden w-full flex items-center justify-center px-60 sm:px-6 lg:px-60 py-2"
          >
            <img
              src={item.imageUrl}
              alt={item.alt}
              className="w-full max-h-screen object-contain transition-transform duration-300 group-hover:scale-105 rounded-lg sm:rounded-xl lg:rounded-2xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

