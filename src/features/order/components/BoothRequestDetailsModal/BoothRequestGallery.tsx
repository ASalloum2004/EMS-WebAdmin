import { useEffect, useState } from "react";
import { GalleryIcon } from "../../../../assets/icons/orderIcons";
import type { I18nDictionary } from "../../../../i18n";
import "./BoothRequestGallery.scss";

interface BoothRequestGalleryProps {
  images: string[];
  language: "en" | "ar";
  t: I18nDictionary;
}

export function BoothRequestGallery({
  images,
  language,
  t,
}: BoothRequestGalleryProps) {
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    setFailedImageUrls(new Set());
  }, [images]);

  const visibleImages = images.filter((image) => !failedImageUrls.has(image));

  if (visibleImages.length === 0) {
    return (
      <div
        aria-label={t.order.details.gallery.title}
        className="booth-request-details-modal__gallery"
        role="img"
      >
        <GalleryIcon aria-hidden="true" size={30} strokeWidth={1.6} />
        <span>
          <strong>{t.order.details.gallery.title}</strong>
          <small>{t.order.details.gallery.description}</small>
        </span>
      </div>
    );
  }

  const numberFormatter = new Intl.NumberFormat(
    language === "ar" ? "ar-SY" : "en-US",
  );

  return (
    <section
      aria-label={t.order.details.gallery.title}
      className="booth-request-details-modal__gallery booth-request-details-modal__gallery--images"
    >
      <ul className="booth-request-details-modal__gallery-images">
        {visibleImages.map((image, index) => (
          <li key={image}>
            <img
              alt={t.order.details.gallery.imageAlt.replace(
                "{{number}}",
                numberFormatter.format(index + 1),
              )}
              loading="lazy"
              onError={() => {
                setFailedImageUrls((currentUrls) => {
                  const nextUrls = new Set(currentUrls);
                  nextUrls.add(image);
                  return nextUrls;
                });
              }}
              src={image}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
