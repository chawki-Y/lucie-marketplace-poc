import ProductImage from "./ProductImage.jsx";

function ProductCard({ listing }) {
  return (
    <article className="product-card">
      <ProductImage src={listing.image} alt={listing.title} />
      <div className="product-card-body">
        <div>
          <h3>{listing.title}</h3>
          <p className="price">${listing.price.toLocaleString()}</p>
        </div>
        <div className="listing-meta">
          <span>{listing.condition}</span>
          <span>{listing.location}</span>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;

