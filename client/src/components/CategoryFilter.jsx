function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="category-row" id="categories" role="list" aria-label="Marketplace categories">
      {categories.map((category) => (
        <button
          key={category}
          className={activeCategory === category ? "category-pill active" : "category-pill"}
          onClick={() => onCategoryChange(category)}
          type="button"
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;

