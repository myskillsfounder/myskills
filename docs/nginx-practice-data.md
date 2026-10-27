# Serving the practice data (Masala Mart)

AI-Powered Data Analytics' tasks open free practice files at
`https://myskills.org.in/practice-data/masala-mart/…` (`orders.csv`, `orders_raw.csv`, `customers.csv`,
`products.csv`). They are in `public/practice-data/`, so every deploy copies them into `dist/`. They come from
`scripts/make-masala-mart.mjs`, which uses a fixed seed, so the numbers in the task hints stay true.

Google Sheets (`IMPORTDATA`) and Google Colab (`pd.read_csv`) can read them as they are. The SQL tasks use DuckDB
in the browser (shell.duckdb.org), which reads a file from another site only if that site allows it with a CORS
header. That needs one change to nginx.

## The change (once, on the VPS)

In the `server { … }` block for myskills.org.in (in `/etc/nginx/sites-available/…`), add this **before** the
`location /` block that sends every address to `index.html`:

```nginx
# Practice data for the course tasks: the files themselves (never the app),
# readable by browser tools such as the DuckDB shell.
location ^~ /practice-data/ {
    try_files $uri $uri/index.html =404;
    types { text/csv csv; text/html html; }
    add_header Access-Control-Allow-Origin "*" always;
    add_header Cache-Control "public, max-age=3600" always;
}
```

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Check it

```bash
curl -sI https://myskills.org.in/practice-data/masala-mart/orders.csv
```

It should show `HTTP/1.1 200`, `Content-Type: text/csv` and `Access-Control-Allow-Origin: *`. If it shows
`text/html`, the address is still going to the app: check that the block is above `location /` and that the deploy
has copied `dist/practice-data/`.

Then, in https://shell.duckdb.org:

```sql
SELECT COUNT(*) FROM 'https://myskills.org.in/practice-data/masala-mart/orders.csv';
```

It should return **2030**.
