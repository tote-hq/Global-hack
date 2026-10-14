import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { RETAILER_NAMES, SAMPLE_PRODUCTS, compareOffers, productById } from '../lib/compare.mjs';

test('retailer spellings match the Changuito copy', () => {
  const source = readFileSync(new URL('../changuito/retailers.ts', import.meta.url), 'utf8');
  for (const [id, name] of Object.entries(RETAILER_NAMES)) {
    assert.match(source, new RegExp(`${id}: '${name}'`));
  }
});

test('the cheapest available offer wins, not the cheapest listed price', () => {
  const leche = productById('leche');
  const { cheapest } = compareOffers(leche.offers);
  assert.equal(cheapest.chainId, 'carrefour');
  assert.equal(cheapest.priceCentavos, 174_500);
});

test('an out-of-stock line stays in the ranking and does not set the spread', () => {
  const { ranked, spreadCentavos } = compareOffers(productById('leche').offers);
  assert.equal(ranked.at(-1).chainId, 'disco');
  assert.equal(ranked.at(-1).available, false);
  assert.equal(spreadCentavos, 205_000 - 174_500);
});

test('yerba picks Jumbo and ignores the cheaper-looking missing Carrefour line', () => {
  const { cheapest, ranked } = compareOffers(productById('yerba').offers);
  assert.equal(cheapest.chainId, 'jumbo');
  assert.equal(ranked.filter((offer) => offer.available).length, 3);
});

test('unknown ids fall back to the first sample product', () => {
  assert.equal(productById('no-such').id, SAMPLE_PRODUCTS[0].id);
});

test('no available offer yields a null winner', () => {
  const { cheapest, spreadCentavos } = compareOffers([
    { chainId: 'dia', sku: 'x', priceCentavos: 100, available: false },
  ]);
  assert.equal(cheapest, null);
  assert.equal(spreadCentavos, null);
});
