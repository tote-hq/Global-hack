import { createServer } from 'node:http';

import { RETAILER_NAMES, compareOffers, formatArs, productById, SAMPLE_PRODUCTS } from './lib/compare.mjs';

const PORT = Number(process.env.PORT) || 3124;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function page(productId) {
  const product = productById(productId);
  const { ranked, cheapest, spreadCentavos } = compareOffers(product.offers);
  const rows = ranked
    .map((offer) => {
      const isWinner = cheapest && offer.sku === cheapest.sku;
      const chain = RETAILER_NAMES[offer.chainId] ?? offer.chainId;
      const status = offer.available ? 'Hay stock' : 'Sin stock';
      const cell = (label, value) =>
        `<td><span class="cell-label">${escapeHtml(label)}</span> ${escapeHtml(value)}</td>`;
      return `<tr${isWinner ? ' class="winner"' : ''}>
        <th scope="row">${escapeHtml(chain)}</th>
        ${cell('SKU', offer.sku)}
        ${cell('Precio', formatArs(offer.priceCentavos))}
        ${cell('Stock', status)}
        ${cell('Resultado', isWinner ? 'Más barata con stock' : '—')}
      </tr>`;
    })
    .join('\n');

  const choices = SAMPLE_PRODUCTS.map((item) => {
    const checked = item.id === product.id ? ' checked' : '';
    return `<label class="choice">
      <input type="radio" name="product" value="${escapeHtml(item.id)}"${checked} />
      <span>${escapeHtml(item.name)}</span>
    </label>`;
  }).join('\n');

  const summary = cheapest
    ? `La más barata con stock es ${RETAILER_NAMES[cheapest.chainId]} a ${formatArs(cheapest.priceCentavos)}.`
    : 'Ninguna cadena tiene stock en este ejemplo.';
  const spread = spreadCentavos === null ? '' : ` La diferencia entre la más barata y la más cara con stock es ${formatArs(spreadCentavos)}.`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Comparar cadenas · Global Hack Week</title>
  <style>
    :root {
      --ink: #2a1a14;
      --muted: #4a332c;
      --bg: #fafaf7;
      --surface: #ffffff;
      --line: rgba(42, 26, 20, 0.18);
      --sun: #f4b942;
      --warn: #7a2e12;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100dvh;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      line-height: 1.45;
    }
    a { color: var(--ink); }
    :focus { outline: none; }
    :focus-visible {
      outline: 3px solid var(--ink);
      outline-offset: 3px;
    }
    .wrap { max-width: 52rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
    h1 { font-size: 1.75rem; line-height: 1.2; margin: 0.25rem 0 0.5rem; }
    .lede { color: var(--muted); max-width: 40rem; }
    form { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; margin: 1.25rem 0; }
    .choice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 44px;
      min-width: 44px;
      padding: 0.5rem 0.75rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 999px;
    }
    button {
      min-height: 44px;
      padding: 0.5rem 1rem;
      border: 0;
      border-radius: 999px;
      background: var(--ink);
      color: var(--bg);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    [data-testid="ghw-compare"] {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 1rem;
    }
    table { width: 100%; border-collapse: collapse; }
    caption { text-align: left; font-weight: 700; margin-bottom: 0.75rem; }
    th, td { text-align: left; padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--line); vertical-align: top; }
    .winner { background: var(--sun); }
    .cell-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .note { color: var(--muted); }
    .warn { color: var(--warn); font-weight: 700; }
    @media (max-width: 640px) {
      table, thead, tbody, tr, th, td { display: block; }
      thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      th[scope="row"] { font-weight: 700; font-size: 1.05rem; }
      .cell-label {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip: auto;
        display: block;
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 700;
      }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <p><a href="/ghw">Global Hack Week</a></p>
    <h1>Comparar un producto entre cadenas</h1>
    <p class="lede">Precios de ejemplo, no una cotización en vivo. La página elige la cadena más barata que tiene stock. Los nombres de las cadenas salen de Changuito.</p>
    <form method="get" action="/ghw">
      <fieldset>
        <legend>Producto de ejemplo</legend>
        ${choices}
      </fieldset>
      <button type="submit">Comparar</button>
    </form>
    <section data-testid="ghw-compare" aria-labelledby="compare-title">
      <h2 id="compare-title" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">Resultado</h2>
      <p data-testid="ghw-summary">${escapeHtml(summary + spread)}</p>
      <table>
        <caption>${escapeHtml(product.name)}</caption>
        <thead>
          <tr>
            <th scope="col">Cadena</th>
            <th scope="col">SKU</th>
            <th scope="col">Precio</th>
            <th scope="col">Stock</th>
            <th scope="col">Resultado</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p class="note">Disco puede figurar más barato y quedar fuera si no hay stock. El ganador se marca con texto, no solo con color.</p>
    </section>
  </main>
</body>
</html>`;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
  if (url.pathname === '/' || url.pathname === '/ghw') {
    const product = url.pathname === '/' ? 'leche' : url.searchParams.get('product');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page(product));
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('No está acá.');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`ghw listening on http://127.0.0.1:${PORT}/ghw`);
});
