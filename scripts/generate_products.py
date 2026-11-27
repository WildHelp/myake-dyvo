import os
import json
import html
import shutil
import urllib.request
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

BASE = "https://wildhelp.github.io/myake-dyvo/"
API = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_KEY"]

ROOT = Path("products")
TEMP = Path("products_generated")


def esc(value):
    return html.escape(str(value or ""), quote=True)


def get_products():
    products = []
    offset = 0

    while True:
        url = (
            API + "/rest/v1/products"
            "?select=id,name,description,price,image_url,stock"
            "&is_published=eq.true"
            "&order=id.asc"
            f"&limit=500&offset={offset}"
        )

        request = urllib.request.Request(
            url,
            headers={
                "apikey": KEY,
                "Accept": "application/json"
            }
        )

        with urllib.request.urlopen(
            request, timeout=30
        ) as response:
            rows = json.load(response)

        if not isinstance(rows, list):
            raise RuntimeError("Invalid products response")

        products.extend(rows)

        if len(rows) < 500:
            break

        offset += len(rows)

    return products


def create_page(product):
    pid = int(product["id"])
    name = product.get("name") or "В'язана іграшка"

    description = product.get("description") or (
        "Авторська в'язана іграшка ручної роботи від Яни."
    )

    price = float(product["price"])
    image = product.get("image_url") or ""

    if urlparse(image).scheme != "https":
        image = ""

    available = int(product.get("stock") or 0) > 0

    status = (
        "В наявності"
        if available
        else "Немає в наявності"
    )

    canonical = BASE + f"products/{pid}/"
    shop_url = BASE + f"?product={pid}"

    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": name,
        "description": description,
        "url": canonical,
        "brand": {
            "@type": "Brand",
            "name": "М’яке диво від Яни"
        },
        "offers": {
            "@type": "Offer",
            "url": shop_url,
            "price": price,
            "priceCurrency": "UAH",
            "availability": (
                "https://schema.org/InStock"
                if available else
                "https://schema.org/OutOfStock"
            )
        }
    }

    if image:
        schema["image"] = image

    structured = json.dumps(
        schema, ensure_ascii=False
    ).replace("<", "\\u003c")

    photo = (
        f'<img src="{esc(image)}" alt="{esc(name)}">'
        if image else ""
    )

    page = f"""<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#fff9f2">
<title>{esc(name)} — М'яке диво від Яни</title>
<meta name="description" content="{esc(description[:160])}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" type="image/png" sizes="192x192" href="https://wildhelp.github.io/myake-dyvo/favicon.png">
<link rel="apple-touch-icon" href="https://wildhelp.github.io/myake-dyvo/apple-touch-icon.png">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="product">
<meta property="og:title" content="{esc(name)}">
<meta property="og:description" content="{esc(description[:200])}">
<meta property="og:image" content="{esc(image)}">
<meta property="og:url" content="{canonical}">
<meta property="og:locale" content="uk_UA">
<script type="application/ld+json">{structured}</script>

<style>
* {{
  box-sizing:border-box;
}}

body {{
  margin:0;
  background:#fff6f7;
  color:#503d49;
  font:16px/1.6 system-ui,sans-serif;
}}

header {{
  padding:22px;
  text-align:center;
  background:#fffaf6;
  border-bottom:1px solid #eadbd6;
}}

header a {{
  color:#503d49;
  text-decoration:none;
  font:bold 26px Georgia,serif;
}}

header small {{
  display:block;
  color:#897b80;
}}

main {{
  max-width:850px;
  margin:30px auto;
  padding:20px;
}}

article {{
  background:white;
  border:1px solid #eadbd6;
  border-radius:28px;
  padding:24px;
  box-shadow:0 15px 50px #503d4910;
}}

img {{
  width:100%;
  max-height:550px;
  object-fit:contain;
  border-radius:20px;
  background:#fff9f2;
}}

h1 {{
  font:bold 34px Georgia,serif;
}}

.price {{
  font-size:30px;
  font-weight:bold;
  color:#a43e65;
}}

.description {{
  white-space:pre-wrap;
}}

.status {{
  color:#897b80;
  font-weight:600;
}}

.button {{
  display:block;
  text-align:center;
  padding:15px;
  margin-top:15px;
  border-radius:16px;
  background:#a43e65;
  color:white;
  font-weight:bold;
  text-decoration:none;
}}

.secondary {{
  background:#fff6f8;
  color:#a43e65;
  border:1px solid #e5c6d1;
}}

footer {{
  text-align:center;
  padding:30px;
  color:#897b80;
}}
</style>
</head>

<body>

<header>
<a href="{BASE}">♡ М'яке диво</a>
<small>В'язані іграшки від Яни</small>
</header>

<main>
<article>

{photo}

<h1>{esc(name)}</h1>

<div class="price">{price:g} грн</div>

<p class="status">{status}</p>

<p class="description">{esc(description)}</p>

<a class="button" href="{shop_url}">
Переглянути товар у магазині
</a>

<a class="button secondary" href="{BASE}">
Усі іграшки
</a>

</article>
</main>

<footer>
М'яке диво від Яни ♡
<br>
Іграшки ручної роботи з любов'ю
</footer>

</body>
</html>
"""

    folder = TEMP / str(pid)

    folder.mkdir(
        parents=True,
        exist_ok=True
    )

    (folder / "index.html").write_text(
        page,
        encoding="utf-8"
    )

    return canonical


def main():
    products = get_products()

    if TEMP.exists():
        shutil.rmtree(TEMP)

    TEMP.mkdir()

    urls = [BASE]

    for product in products:
        urls.append(create_page(product))

    namespace = (
        "http://www.sitemaps.org/schemas/sitemap/0.9"
    )

    ET.register_namespace("", namespace)

    sitemap = ET.Element(
        f"{{{namespace}}}urlset"
    )

    for address in urls:
        node = ET.SubElement(
            sitemap,
            f"{{{namespace}}}url"
        )

        ET.SubElement(
            node,
            f"{{{namespace}}}loc"
        ).text = address

    ET.ElementTree(sitemap).write(
        "sitemap_generated.xml",
        encoding="utf-8",
        xml_declaration=True
    )

    if ROOT.exists():
        shutil.rmtree(ROOT)

    TEMP.rename(ROOT)

    Path("sitemap_generated.xml").replace(
        "sitemap.xml"
    )

    print(f"Generated {len(products)} product pages")
    print("Sitemap updated successfully")


if __name__ == "__main__":
    main()
