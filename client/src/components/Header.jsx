function Header({ query, onQueryChange }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="brand" aria-label="MarketPlace home">
          <span className="brand-mark">M</span>
          <span className="brand-name">MarketPlace</span>
        </a>

        <label className="header-search">
          <span className="sr-only">Search marketplace</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search phones, laptops, guitars..."
          />
        </label>

        <nav className="header-nav" aria-label="Primary navigation">
          <a href="#categories">Categories</a>
          <a href="#sell">Sell</a>
          <a href="#login">Login</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;

