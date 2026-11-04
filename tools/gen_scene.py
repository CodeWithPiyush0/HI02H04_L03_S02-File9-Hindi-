"""Draws a poem page's picture fresh at the picture box's own shape (487 x 254, ~1.93:1), in natural proportions.

Build v1's six pictures (480 x 250) were drawn at another shape and squeezed into the box - faces, bodies and the round
jalebis came out too wide (user 2026-11-03: "the images feel stretched"). Un-stretching them kept their distorted
drawing, so each picture is drawn again: Gemini (gemini-2.5-flash-image) gets v1's picture only as the reference for the
characters, the art style and the colours, plus the scene (the poem's line), and draws it at 21:9; the middle is cropped
to the box's shape and saved at 2x for sharp screens:

    python tools/gen_scene.py scene_1 scene_3 ...      -> assets/images/<id>.webp (966 x 500)
    python tools/gen_scene.py --out DIR scene_1        -> writes there instead (to review first)

Source: _archive_v1/assets/Images/<v1 file>. Key: GEMINI_KEY from the environment (.env - never written here).
"""
import base64, io, json, os, sys, time, urllib.error, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MODEL = "gemini-2.5-flash-image"
BOX = 487 / 254
MUNIYA = ("Muniya, a little Indian girl of about six with dark hair in two low pigtails, a yellow kurta with small orange "
          "flowers and a pink dupatta")
HALWAI = "a jolly, round Indian halwai (sweet-maker) with a big black moustache, a red kurta and a green dhoti"
SCENES = {
    "scene_1": ("halwai_480x250.png", f"हलवाई ने आग सुलगाई। फिर चूल्हे पर धरी कढ़ाई। - {HALWAI} at his sweet shop in a sunny village "
                "market, lighting the fire in a clay chulha and setting a big black iron kadhai (wok) on it; flames under the kadhai."),
    "scene_2": ("jalebi_480x250.png", f"कढ़ाई में जलेबी नचाई। फिर जलेबी को चाशनी पिलाई। - seen from a little above: the halwai's hands "
                "squeezing batter from a cloth into hot oil in the black kadhai on the chulha, round jalebi spirals frying; beside it "
                "a brass bowl of golden sugar syrup with jalebis soaking in it."),
    "scene_3": ("muniya_jalebi_480x250.png", f"मुनिया जलेबी देख खिलखिलाई। - {MUNIYA}, chin on her hands at the sweet-shop counter, "
                "laughing with joy as she watches the halwai frying jalebis in the kadhai; a tray of jalebis on the counter."),
    "scene_4": ("muniyya_jalebi_480x250.png", f"आँख नचाई, लार टपकाई। - {MUNIYA}, chin on her hands at the counter, rolling her eyes "
                "playfully sideways towards a big brass tray piled with jalebis, licking her lips "
                "hungrily with the tip of her tongue, her mouth watering at the sight (a big hungry, greedy smile)."),
    "scene_5": ("muniya_mummy_money_480x250.png", f"घर से पैसे लेकर आई। - {MUNIYA} at the door of her home, happily taking money "
                "from her mother's hand (only the mother's arm with bangles is seen, reaching from the doorway); a courtyard with flowers."),
    "scene_6": ("muniya_jalebi_khaayi_480x250.png", f"जी भर कर जलेबी खाई। - {MUNIYA} at the sweet shop happily eating a jalebi, eyes "
                "closed with delight, a big brass tray of jalebis in front of her; a sunny village market behind."),
}
PROMPT = ("Draw a new children's picture-book illustration of this scene from a Hindi poem: {scene}\n"
          "Use the attached picture ONLY as the reference for the characters' look, the warm painterly cartoon style and the "
          "colours. That reference is DISTORTED - squashed and stretched sideways, so its faces, bodies and round things look "
          "too wide. Do not copy its proportions: draw every head, face, eye, body and every round jalebi, bowl and kadhai with "
          "natural, correct proportions (jalebis are round spirals). Wide 21:9 frame; keep the characters and the main "
          "action inside the middle 80% of the width, whole heads in frame. No text, no letters, no signs, no borders.")


def gemini(png, prompt, key):
    body = {"contents": [{"parts": [{"inlineData": {"mimeType": "image/png", "data": base64.b64encode(png).decode()}},
                                    {"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "21:9"}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    data = json.loads(urllib.request.urlopen(req, timeout=240).read().decode())
    for c in data.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            if "inlineData" in p:
                return base64.b64decode(p["inlineData"]["data"])
    raise RuntimeError("no image: " + json.dumps(data)[:300])


def one(sid, key, out):
    src, scene = SCENES[sid]
    im = Image.open(os.path.join(ROOT, "_archive_v1", "assets", "Images", src)).convert("RGB")
    buf = io.BytesIO(); im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(buf, "PNG")
    for attempt in range(4):
        try:
            wide = Image.open(io.BytesIO(gemini(buf.getvalue(), PROMPT.format(scene=scene), key))).convert("RGB"); break
        except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError) as e:
            print(" ", sid, "retry", attempt + 1, str(e)[:120], flush=True); time.sleep(6 * (attempt + 1))
    else:
        raise SystemExit(f"{sid}: no image")
    w, h = wide.size
    cw = min(w, round(h * BOX)); x0 = (w - cw) // 2                       # the middle, at the box's shape - no resize of one axis only
    pic = wide.crop((x0, 0, x0 + cw, h)).resize((966, 500), Image.LANCZOS)
    os.makedirs(out, exist_ok=True)
    pic.save(os.path.join(out, sid + ".webp"), "WEBP", quality=88, method=6)
    print("ok", sid, f"{w}x{h} -> 966x500", flush=True)


if __name__ == "__main__":
    key = os.environ.get("GEMINI_KEY")
    if not key:
        sys.exit("set GEMINI_KEY in the environment (see .env)")
    args = sys.argv[1:]; out = os.path.join(ROOT, "assets", "images")
    if "--out" in args:
        i = args.index("--out"); out = args[i + 1]; del args[i:i + 2]
    for sid in args or list(SCENES):
        one(sid, key, out)
