function HeroSearch({ query, onQueryChange }) {
  function handleSubmit(event) {
    event.preventDefault();
    document.getElementById("featured-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">Local deals, smarter discovery</p>
          <h1>Find what you're looking for.</h1>
          <p>
            Browse fictional listings across Lebanon, then ask Lucie to narrow the options by budget,
            category, condition, or location.
          </p>
        </div>

        <form className="hero-search" onSubmit={handleSubmit}>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Try: iPhone under $500"
            aria-label="Search marketplace listings"
          />
          <button type="submit">Search</button>
        </form>
      </div>
    </section>
  );
}

export default HeroSearch;

