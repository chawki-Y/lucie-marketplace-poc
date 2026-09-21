import { useState } from "react";

function ProductImage({ src, alt, compact = false }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={compact ? "product-image compact" : "product-image"}>
      {!failed && src ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="image-fallback" aria-label={alt}>
          MarketPlace
        </div>
      )}
    </div>
  );
}

export default ProductImage;

