import ProductImage from "./ProductImage.jsx";

function ChatProductCard({ product }) {
  return (
    <article className="chat-product-card">
      <ProductImage src={product.image} alt={product.title} compact />
      <div>
        <h4>{product.title}</h4>
        <p className="chat-price">${product.price.toLocaleString()}</p>
        <p className="chat-meta">
          {product.condition} · {product.location}
        </p>
      </div>
    </article>
  );
}

export default ChatProductCard;

