/**
 * Chain spellings copied from Changuito apps/web/lib/retailers.ts.
 * The TypeScript original stays in changuito/retailers.ts.
 * changuito/units.ts is the key file used for the model benchmark.
 * This object is what the page actually renders.
 */
export const RETAILER_NAMES = {
  dia: 'Día',
  carrefour: 'Carrefour',
  jumbo: 'Jumbo',
  disco: 'Disco',
};

/**
 * Sample shelf prices in Argentine centavos. Not a live supermarket quote.
 * `available: false` is a chain that lists the product but cannot sell it.
 */
export const SAMPLE_PRODUCTS = [
  {
    id: 'leche',
    name: 'Leche descremada La Serenísima 1 L',
    offers: [
      { chainId: 'dia', sku: 'dia-leche-1', priceCentavos: 189_900, available: true },
      { chainId: 'carrefour', sku: 'crr-leche-1', priceCentavos: 174_500, available: true },
      { chainId: 'jumbo', sku: 'jmb-leche-1', priceCentavos: 205_000, available: true },
      { chainId: 'disco', sku: 'dsc-leche-1', priceCentavos: 139_000, available: false },
    ],
  },
  {
    id: 'yerba',
    name: 'Yerba mate Playadito 1 kg',
    offers: [
      { chainId: 'dia', sku: 'dia-yerba-1', priceCentavos: 498_000, available: true },
      { chainId: 'carrefour', sku: 'crr-yerba-1', priceCentavos: 512_900, available: false },
      { chainId: 'jumbo', sku: 'jmb-yerba-1', priceCentavos: 475_000, available: true },
      { chainId: 'disco', sku: 'dsc-yerba-1', priceCentavos: 489_500, available: true },
    ],
  },
];

export function productById(id) {
  return SAMPLE_PRODUCTS.find((product) => product.id === id) ?? SAMPLE_PRODUCTS[0];
}

/**
 * Rank offers for one product. Unavailable lines stay visible but never win.
 * Prices are integers (centavos) so the comparison is not a float.
 */
export function compareOffers(offers) {
  const ranked = [...offers].sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return a.priceCentavos - b.priceCentavos;
  });
  const inStock = ranked.filter((offer) => offer.available);
  const cheapest = inStock[0] ?? null;
  const spreadCentavos =
    inStock.length >= 2 ? inStock[inStock.length - 1].priceCentavos - inStock[0].priceCentavos : null;
  return { ranked, cheapest, spreadCentavos };
}

export function formatArs(centavos) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(centavos / 100);
}
