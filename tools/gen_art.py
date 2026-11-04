"""The lesson's pictures, all drawn in ONE cute animated cartoon style (user 2026-11-03: "cute animated, the art style of
each image should be the same in all the images") with Gemini (gemini-2.5-flash-image). Nothing is based on build v1's
pictures (those were squeezed into their boxes - their distortion kept coming back when used as a reference).

    python tools/gen_art.py chars                 -> tools/art/chars.png    (मुनिया + हलवाई, the one look every scene uses)
    python tools/gen_art.py scenes [poem_1 ...]   -> assets/images/poem_N.webp, 966 x 500 (the picture box's shape, 1.932:1)
    python tools/gen_art.py objects [obj_kadai .] -> assets/images/obj_*.webp, 600 x 600 (the word cards, white ground)
    --out DIR                                     -> write there instead (to review first)

Style reference: the game's own mascot (assets/start_mascot.webp). Scenes get chars.png too, so मुनिया and the हलवाई look
the same on every page. Scenes are drawn at 21:9 and only CROPPED to the box's shape - never resized on one axis.
Key: GEMINI_KEY from the environment (.env - never written here).
"""
import base64, io, json, os, sys, time, urllib.error, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MODEL = "gemini-2.5-flash-image"
BOX = 487 / 254
STYLE = ("cute animated cartoon style, like a modern animated film for young children: soft rounded shapes, cute proportions "
         "with slightly big heads and big sparkly expressive eyes, smooth soft shading, warm bright cheerful colours, gentle "
         "light, clean uncluttered backgrounds - the same rendering style as the attached mascot (the duckling Swiftee)")
MUNIYA = ("Muniya, a cute little Indian girl of about six: big round dark eyes, rosy cheeks, dark hair in two low pigtails with "
          "red hair ties, a yellow kurta with small orange flowers and a pink dupatta")
HALWAI = ("the halwai, a cute chubby cheerful Indian sweet-maker: round friendly face, a big curly black moustache, a little hair "
          "on a mostly bald head, a red kurta, a green dhoti and a white towel on his shoulder")
CHARS = (f"A character design sheet on a plain white background: {MUNIYA}, and {HALWAI}. Both standing side by side, full body, "
         f"front view, smiling. Correct, natural cartoon proportions. Style: {STYLE}. No text, no labels.")
SCENES = {   # the poem's line on that page, and what the picture shows
    "poem_1": "हलवाई ने आग सुलगाई। फिर चूल्हे पर धरी कढ़ाई। - the halwai at his little sweet shop in a sunny Indian village market, "
              "sitting by a clay chulha with a fire burning in it, happily setting a big black iron kadhai (wok) on the chulha. ONLY the "
              "halwai is in this picture - Muniya is not in it",
    "poem_2": "कढ़ाई में जलेबी नचाई। फिर जलेबी को चाशनी पिलाई। - the halwai making jalebis: squeezing batter from a cloth in round "
              "spirals into hot oil in the black kadhai on the chulha, golden round jalebi spirals frying; beside him a brass bowl "
              "of golden sugar syrup (chashni) with jalebis soaking in it. ONLY the halwai is in this picture - Muniya is not in it",
    "poem_3": "मुनिया जलेबी देख खिलखिलाई। - Muniya at the sweet-shop counter laughing with joy, hands on her cheeks, watching the "
              "halwai fry round golden jalebis in the kadhai; a plate of jalebis on the counter",
    "poem_4": "आँख नचाई, लार टपकाई। - Muniya at the counter, chin on her hands, her eyes rolling playfully sideways towards a big "
              "brass tray piled with round golden jalebis, with a big hungry grin and the tip of her tongue peeking out, dreaming of eating "
              "them. Only Muniya is in this picture",
    "poem_5": "घर से पैसे लेकर आई। - Muniya at the door of her home, happily taking a few rupee notes from her mother's hand (only "
              "the mother's arm with bangles is seen, reaching out from the doorway); a sunny courtyard with flower pots. The halwai is not in it",
    "poem_6": "जी भर कर जलेबी खाई। - Muniya at the sweet shop happily eating a round golden jalebi, eyes closed with delight, "
              "a big brass tray of round jalebis in front of her. Only Muniya is in this picture",
}
OBJECTS = {
    "obj_kadai": "a big black iron kadhai (Indian wok) with two round handles, empty, seen slightly from above",
    "obj_mithai": "a round brass plate with Indian sweets: orange laddoos and white-and-pink barfi pieces",
    "obj_jalebi": "a small plate with three round golden-orange jalebi spirals, glossy with syrup",
    "obj_chashni": "a brass bowl filled with golden, shiny sugar syrup (chashni), a small spoon in it",
}


def gemini(prompt, refs, aspect, key):
    parts = [{"inlineData": {"mimeType": "image/png", "data": base64.b64encode(r).decode()}} for r in refs] + [{"text": prompt}]
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    data = json.loads(urllib.request.urlopen(req, timeout=240).read().decode())
    for c in data.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            if "inlineData" in p:
                return Image.open(io.BytesIO(base64.b64decode(p["inlineData"]["data"]))).convert("RGB")
    raise RuntimeError("no image: " + json.dumps(data)[:300])


def png(path):
    im = Image.open(path).convert("RGBA"); bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    buf = io.BytesIO(); bg.convert("RGB").save(buf, "PNG"); return buf.getvalue()


def make(name, prompt, refs, aspect, key):
    for attempt in range(4):
        try:
            return gemini(prompt, refs, aspect, key)
        except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError) as e:
            print(" ", name, "retry", attempt + 1, str(e)[:120], flush=True); time.sleep(6 * (attempt + 1))
    raise SystemExit(f"{name}: no image")


if __name__ == "__main__":
    key = os.environ.get("GEMINI_KEY")
    if not key:
        sys.exit("set GEMINI_KEY in the environment (see .env)")
    args = sys.argv[1:]; out = None
    if "--out" in args:
        i = args.index("--out"); out = args[i + 1]; del args[i:i + 2]
    mode, names = (args[0] if args else "scenes"), args[1:]
    mascot = png(os.path.join(ROOT, "assets", "start_mascot.webp"))
    chars_png = os.path.join(HERE, "art", "chars.png")
    if mode == "chars":
        im = make("chars", CHARS, [mascot], "16:9", key)
        os.makedirs(os.path.dirname(chars_png), exist_ok=True); im.save(chars_png); print("ok chars", im.size)
    elif mode == "scenes":
        dst = out or os.path.join(ROOT, "assets", "images"); os.makedirs(dst, exist_ok=True)
        refs = [mascot, open(chars_png, "rb").read()]
        for n in names or list(SCENES):
            p = (f"Draw one picture-book illustration for this line of a Hindi children's poem: {SCENES[n]}.\n"
                 f"The characters must look exactly like the attached character sheet ({MUNIYA}; {HALWAI}) - same faces, "
                 f"hair, clothes, colours. Style: {STYLE}. Natural, correct cartoon proportions - nothing stretched or squashed; "
                 "jalebis, bowls and the kadhai are round. Wide 21:9 frame; keep the characters and the action in the middle "
                 "80% of the width, whole heads in the frame. No text, no letters, no signs, no borders.")
            im = make(n, p, refs, "21:9", key)
            w, h = im.size; cw = min(w, round(h * BOX)); x0 = (w - cw) // 2          # crop only - the box's shape
            im.crop((x0, 0, x0 + cw, h)).resize((966, 500), Image.LANCZOS).save(os.path.join(dst, n + ".webp"), "WEBP", quality=88, method=6)
            print("ok", n, f"{w}x{h} -> 966x500", flush=True)
    elif mode == "objects":
        dst = out or os.path.join(ROOT, "assets", "images"); os.makedirs(dst, exist_ok=True)
        for n in names or list(OBJECTS):
            p = (f"Draw {OBJECTS[n]}, alone, centred, filling most of the picture, on a plain pure white background with a very "
                 f"soft shadow under it. Style: {STYLE}. Natural proportions. No text, no people, no borders.")
            im = make(n, p + " Exactly the same cartoon style as the attached character sheet (its outlines, flat soft shading "
                      "and colours) - not realistic, not glossy 3D.", [open(chars_png, "rb").read()], "1:1", key)
            im.resize((600, 600), Image.LANCZOS).save(os.path.join(dst, n + ".webp"), "WEBP", quality=88, method=6)
            print("ok", n, flush=True)
    else:
        sys.exit("mode: chars | scenes | objects")
