#!/usr/bin/env python3
"""Рендерит пресеты циферблатов из dial.js в PNG-слои + preset.json.

Каждый слой обрезается по непрозрачной области; опорная точка (ось вращения)
записывается в preset.json как доля от размеров картинки, считая от левого
верхнего угла. Размеры слоёв — в долях от полного холста (canvas = 400 ед.).
"""
import json, os, sys
from pathlib import Path
from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / "WoodClock" / "Presets")
PX = 1600            # итоговый холст, px (4x от viewBox 400)
UNIT = PX / 400      # px на единицу viewBox

PRESETS = {  # variant id -> (folder, name, english name)
    "C": ("maple", "Светлый клён", "Maple"),
    "A": ("walnut", "Орех и латунь", "Walnut & Brass"),
    "B": ("ebony", "Эбен и римские", "Ebony Roman"),
    "D": ("marquetry", "Маркетри", "Marquetry"),
    "E": ("station", "Вокзальные", "Station"),
    "F": ("ivory", "Слоновая кость", "Ivory Rose"),
    "G": ("mahogany", "Красное дерево", "Mahogany & Gold"),
    "H": ("lacquer", "Тёмный лак", "Lacquered Rose"),
    "I": ("filigree", "Бронзовое кружево", "Bronze Filigree"),
    "J": ("neon", "Неон", "Neon"),
    "K": ("neon_dots", "Неон, пунктир", "Neon Dotted"),
}
ONLY = set(sys.argv[2:])  # необязательно: id вариантов, напр. `render.py WoodClock/Presets F`
# тени стрелок (в единицах viewBox): dx, dy (вниз), blur, opacity
SHADOW = {"hour": (3, 5, 3, .55), "minute": (3, 5, 3, .55), "second": (1, 1.5, .8, .6)}
LAYERS = ["dial", "hour", "minute", "second", "cap", "glass"]
NO_SHADOW = {"J", "K"}    # неон на чёрном: тень стрелок только притушила бы свечение разметки

page_html = f"""<!doctype html><html><head><meta charset="utf-8">
<style>html,body{{margin:0;background:transparent}} svg{{display:block}}</style></head>
<body><div id="host"></div><script>{(HERE / 'dial.js').read_text()}
window.renderVariant = id => {{
  const v = variants.find(x => x.id === id);
  const c = build(v);
  c.svg.setAttribute('width', {PX}); c.svg.setAttribute('height', {PX});
  const host = document.getElementById('host'); host.innerHTML = ''; host.appendChild(c.svg);
}};
window.showLayer = name => {{
  document.querySelectorAll('[data-layer]').forEach(g => {{
    g.style.display = g.dataset.layer === name ? '' : 'none';
    g.removeAttribute('transform');
  }});
}};
</script></body></html>"""


def crop(img, pad):
    bbox = img.getchannel("A").point(lambda a: 255 if a > 2 else 0).getbbox()
    if bbox is None:
        return None, None
    x0, y0, x1, y1 = bbox
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(PX, x1 + pad), min(PX, y1 + pad)
    return img.crop((x0, y0, x1, y1)), (x0, y0)


def shadow_of(img, blur, opacity):
    a = img.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    a = a.point(lambda v: int(v * opacity))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh.putalpha(a)
    return sh


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = HERE / "_page.html"
    tmp.write_text(page_html)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": PX, "height": PX}, device_scale_factor=1)
        pg.goto(tmp.as_uri())
        pg.evaluate("document.fonts.ready")
        for vid, (folder, name, name_en) in PRESETS.items():
            if ONLY and vid not in ONLY:
                continue
            d = OUT / folder
            d.mkdir(exist_ok=True)
            pg.evaluate(f"renderVariant('{vid}')")
            # дождаться растровых рам (<image> в SVG)
            pg.evaluate("Promise.all([...document.querySelectorAll('image')].map(i=>new Promise(r=>{const m=new Image();m.onload=m.onerror=r;m.src=i.getAttribute('href')})))")
            pg.wait_for_timeout(300)
            meta = {"id": folder, "name": name, "nameEn": name_en, "canvas": 400, "layers": []}
            for layer in LAYERS:
                pg.evaluate(f"showLayer('{layer}')")
                raw = d / "_raw.png"
                pg.locator("svg").screenshot(path=str(raw), omit_background=True)
                img = Image.open(raw).convert("RGBA")
                assert img.size == (PX, PX), img.size
                entry = {"name": layer, "file": f"{layer}.png"}
                (d / f"{layer}.png").unlink(missing_ok=True)
                (d / f"{layer}_shadow.png").unlink(missing_ok=True)
                if crop(img, 0)[0] is None:  # слоя нет у варианта (например, стекла у неона)
                    continue
                if layer in SHADOW and vid not in NO_SHADOW:
                    dx, dy, blur, op = SHADOW[layer]
                    img, (x0, y0) = crop(img, int(blur * UNIT * 3))
                    shadow_of(img, blur * UNIT, op).save(d / f"{layer}_shadow.png", optimize=True)
                    entry["shadow"] = {"file": f"{layer}_shadow.png", "offset": [dx / 400, dy / 400]}
                    entry["rotates"] = layer
                elif layer in SHADOW:
                    img, (x0, y0) = crop(img, 2)
                    entry["rotates"] = layer
                else:
                    img, (x0, y0) = crop(img, 2)
                w, h = img.size
                entry["size"] = [w / PX, h / PX]
                entry["anchor"] = [(PX / 2 - x0) / w, (PX / 2 - y0) / h]  # от левого верхнего угла
                img.save(d / f"{layer}.png", optimize=True)
                meta["layers"].append(entry)
            raw.unlink()
            # превью для окна настроек
            pg.evaluate("document.querySelectorAll('[data-layer]').forEach(g=>g.style.display='')")
            pg.evaluate("""(() => { const s=document.querySelectorAll('[data-layer]');
              const r=(n,a)=>document.querySelector(`[data-layer=${n}]`).setAttribute('transform',`rotate(${a} 200 200)`);
              r('hour',304); r('minute',48); r('second',150); })()""")
            pg.locator("svg").screenshot(path=str(d / "preview.png"), omit_background=True)
            Image.open(d / "preview.png").resize((400, 400), Image.LANCZOS).save(d / "preview.png", optimize=True)
            (d / "preset.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
            print("ok", folder)
        b.close()
    tmp.unlink()


if __name__ == "__main__":
    main()
