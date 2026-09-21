import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import HeroSearch from "./components/HeroSearch.jsx";
import CategoryFilter from "./components/CategoryFilter.jsx";
import ProductCard from "./components/ProductCard.jsx";
import LucieChat from "./components/LucieChat.jsx";
import { getListings } from "./services/api.js";

const categories = ["All", "Electronics", "Phones", "Computers", "Gaming", "Home", "Fashion"];

function App() {
  const [listings, setListings] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getListings()
      .then((data) => {
        if (isMounted) {
          setListings(data);
          setError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return listings.filter((listing) => {
      const categoryMatch = activeCategory === "All" || listing.category === activeCategory;
      const searchableText = [
        listing.title,
        listing.category,
        listing.description,
        listing.location,
        listing.condition,
        ...(listing.tags || [])
      ]
        .join(" ")
        .toLowerCase();

      return categoryMatch && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeCategory, listings, query]);

  return (
    <div className="app-shell">
      <Header query={query} onQueryChange={setQuery} />
      <main>
        <HeroSearch query={query} onQueryChange={setQuery} />
        <section className="marketplace-section" aria-labelledby="featured-heading">
          <div className="section-inner">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Fresh local listings</p>
                <h2 id="featured-heading">Explore the marketplace</h2>
              </div>
              <span className="result-count">
                {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
              </span>
            </div>

            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {isLoading && <div className="state-panel">Loading listings...</div>}
            {error && <div className="state-panel error">{error}</div>}
            {!isLoading && !error && filteredListings.length === 0 && (
              <div className="state-panel">No listings match your search yet.</div>
            )}

            <div className="product-grid">
              {filteredListings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <LucieChat />
    </div>
  );
}

export default App;

