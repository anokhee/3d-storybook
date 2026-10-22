// Every story file in stories/, loaded up front, for the Catalog. Kept in
// its own plain-JS file: Vite rewrites `import.meta.glob` by parsing the
// file it sits in, and the dev server's story indexer trips over that
// when the same file also holds JSX.
export const modules = import.meta.glob("../*.stories.jsx", { eager: true });
