"""HI02H04_L03_S02 - जलेबी, page by page (SME deck HI02H04_L03_S02_review(Updated).pptx), on MTG2A01_L04_S01's shell.

The one place the content lives: every slide, its on-screen text and its VO lines. Writes
    card.json               - the card (also embedded in index.html, <script id="cardData">)
    tools/vo_script.json    - clip id -> Hindi line, for tools/build_vo.py
and copies index.html to HI02H04_L03_S02.html (the same game under the skill code's name).

    python tools/lessons.py

Lines are the deck's, verbatim (कढ़ाई throughout, as the deck spells it). Clips carried over from build v1
(_archive_v1, Gemini "Kore") keep the line they were recorded with; tools/build_vo.py renders only the new ones.
"""
import json, os, re, shutil, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

VO = {}          # clip id -> line


def vo(cid, line):
    if cid in VO and VO[cid] != line:
        raise SystemExit(f"clip {cid} given two different lines")
    VO[cid] = line
    return cid


# ---- shared lines -------------------------------------------------------------------------------------
vo("vo_landing", "नमस्ते दोस्त, मैं हूँ स्विफ्टी। आज हम एक कविता पढ़ेंगे, जलेबी।")                  # deck page 1
# the three phase gates (the shell's transition screens): deck pages 2, 12, 18
vo("vo_pt_tutorial", "ध्यान से देखिए और मेरे साथ पढ़िए। चलिए, शुरू करें।")
vo("vo_pt_guided", "चलिए, साथ में करें।")                                                          # updated deck p12
vo("vo_pt_practice", "वाह! अब आपकी बारी।")

# the poem's words, as build v1 recorded them one by one (vo_pw_NN)
PW = ["आँख", "आई", "आग", "कढ़ाई", "कर", "को", "खाई", "खिलखिलाई", "घर", "चाशनी", "चूल्हे", "जलेबी", "जी", "टपकाई", "देख",
      "धरी", "नचाई", "ने", "पर", "पिलाई", "पैसे", "फिर", "भर", "मुनिया", "में", "लार", "लेकर", "सुलगाई", "से", "हलवाई"]
for i, w in enumerate(PW):
    vo(f"vo_pw_{i:02d}", w)
# the deck's other words (sentences, boxes), build v1's vo_ppt_word_N
WORDS = ["चोर", "शेर", "हाथी", "मोर", "मेला", "पेड़", "फूल", "केला", "राजा", "रानी", "बाजा", "मुकुट", "रात", "दिन", "बात", "तारा",
         "धूल", "पत्ता", "पानी", "दूध", "गिलास", "गाना", "दाना", "गीत", "ढोल", "हाथ", "पैर", "नाक", "साथ"]
for i, w in enumerate(WORDS):
    vo(f"vo_word_{i}", w)
OBJ = {"kadai": "कढ़ाई", "mithai": "मिठाई", "jalebi": "जलेबी", "chashni": "चाशनी", "chulha": "चूल्हा", "halwai": "हलवाई",
       "rajai": "रजाई", "paise": "पैसे"}
for k, w in OBJ.items():
    vo(f"vo_o_{k}", w)


def wd(w):
    """the clip of a word: the poem's, else the deck's, else the object's"""
    w = w.strip("।,")
    if w in PW: return f"vo_pw_{PW.index(w):02d}"
    if w in WORDS: return f"vo_word_{WORDS.index(w)}"
    for k, x in OBJ.items():
        if x == w: return f"vo_o_{k}"
    raise SystemExit("no clip for " + w)


IMG = lambda k: f"assets/images/{k}.webp"
POEM = [("हलवाई ने आग सुलगाई।", "vo_l1"), ("फिर चूल्हे पर धरी कढ़ाई।", "vo_l2"), ("कढ़ाई में जलेबी नचाई।", "vo_l3"),
        ("फिर जलेबी को चाशनी पिलाई।", "vo_l4"), ("मुनिया जलेबी देख खिलखिलाई।", "vo_l5"), ("आँख नचाई, लार टपकाई।", "vo_l6"),
        ("घर से पैसे लेकर आई।", "vo_l7"), ("जी भर कर जलेबी खाई।", "vo_l8")]
for text, cid in POEM:
    vo(cid, text)


def line(i, rhyme, audio=False):
    """poem line i (0-based); rhyme = the word indices to light (the deck's 'Highlight' for that line)"""
    text, cid = POEM[i]
    return {"audio": cid, "words": [dict({"t": w, "rhyme": j in rhyme}, **({"audio": wd(w)} if audio else {}))
                                    for j, w in enumerate(text.split())]}


slides = []

# ---- TUTORIAL ------------------------------------------------------------------------------------------
# deck pages 3-8 - "आइए कविता पढ़ें।" (updated deck); the mic and its line on page 3; highlights as the deck lists them
READ = [  # (lines, rhyme words per line, picture)
    ([0, 1], [[3], [4]], {"image": IMG("scene_1")}),     # pictures, not videos (user 2026-11-03: a lighter file)
    ([2, 3], [[3], [4]], {"image": IMG("scene_2")}),
    ([4], [[3]], {"image": IMG("scene_3")}),
    ([5], [[3]], {"image": IMG("scene_4")}),       # "Highlight- टपकाई" (only)
    ([6], [[4]], {"image": IMG("scene_5")}),
    ([7], [[4]], {"image": IMG("scene_6")}),
]
for n, (ls, rh, pic) in enumerate(READ, 1):
    idle = vo("vo_mic_intro", "इस बटन पर टैप कीजिए और कविता पढ़िए।")
    au = {"intro": idle, "idle": idle} if n == 1 else {"idle": idle}     # the 7s reminder on every page (as HI02H04_L03_S01)
    slides.append({"id": f"T{n}", "phase": "tutorial", "eis": "iconic", "type": "POEM_READ", "prompt_hi": "आइए कविता पढ़ें।",
                   "audio": au, "data": dict(pic, lines=[line(i, r) for i, r in zip(ls, rh)], ms_per_word=1100)})

# deck page 9 - "कविता फिर से सुनिए।": the whole poem again, then the deck's ten words (हलवाई ... खाई; its list has
# नचाई once - line 3's), then what तुकांत means
RECAP = [[0, 3], [4], [0, 3], [4], [3], [3], [4], [4]]
slides.append({"id": "T7", "phase": "tutorial", "eis": "iconic", "type": "POEM_RECAP", "prompt_hi": "कविता फिर से सुनिए।",
               "audio": {"words": vo("vo_t7_words", "अब इन शब्दों को सुनिए। इन सभी शब्दों के अंत में आई की आवाज़ है। आइए सुनते हैं।"),
                         "conclude": vo("vo_t7_conclude", "जिन शब्दों की अंतिम आवाज़ एक जैसी होती है, वह शब्द तुक वाले शब्द यानी तुकांत कहलाते हैं। "
                                                          "इस कविता में जिन शब्दों के अंत में आई की आवाज़ आ रही है, वह सभी तुकांत शब्द हैं।")},
               "data": {"lines": [line(i, r, audio=True) for i, r in enumerate(RECAP)]}})

# deck pages 10-11
slides.append({"id": "T8", "phase": "tutorial", "eis": "iconic", "type": "MEET_RHYME", "prompt_hi": "कढ़ाई-मिठाई, तुकांत शब्द हैं।",
               "audio": {"prompt": vo("vo_t8", "दोनों शब्द ध्यान से सुनिए। कढ़ाई, मिठाई। इन दोनों शब्दों के अंत में आई की आवाज़ है, इसलिए यह तुकांत शब्द हैं।")},
               "data": {"a": {"word": "कढ़ाई", "img": IMG("kadai"), "audio": "vo_o_kadai"},
                        "b": {"word": "मिठाई", "img": IMG("mithai"), "audio": "vo_o_mithai"}, "rhymes": True}})
slides.append({"id": "T9", "phase": "tutorial", "eis": "iconic", "type": "MEET_RHYME", "prompt_hi": "जलेबी-चाशनी, तुकांत शब्द नहीं हैं।",
               "audio": {"prompt": vo("vo_t9", "दोनों शब्द ध्यान से सुनिए। जलेबी, चाशनी। यह दोनों मीठी चीजें हैं, लेकिन इन दोनों शब्दों के अंत में "
                                                "आने वाली आवाज़ अलग है, इसलिए यह तुकांत शब्द नहीं हैं।")},
               "data": {"a": {"word": "जलेबी", "img": IMG("jalebi"), "audio": "vo_o_jalebi"},
                        "b": {"word": "चाशनी", "img": IMG("chashni"), "audio": "vo_o_chashni"}, "rhymes": False}})

# ---- GUIDED (the deck's order: pages 13, 14, 20, 21, then the two sentences) ------------------------------
slides.append({"id": "G1", "phase": "guided", "eis": "iconic", "type": "FIND_RHYME", "prompt_hi": "आई की आवाज़ वाले शब्द पहचानिए।",
               "audio": {"prompt": vo("vo_g1_prompt", "इन पंक्तियों में, आई की आवाज़ वाले सभी शब्दों पर टैप कीजिए।"),
                         "hint2": vo("vo_g1_hint2", "इस शब्द के अंत में आई की आवाज़ नहीं है।"),
                         "correct": vo("vo_g1_correct", "शाबाश! आपने सभी तुकांत शब्द पहचान लिए।")},
               "data": {"lines": [line(i, r, audio=True) for i, r in enumerate([[0, 3], [4], [0, 3], [4]])]}})


def hints(g, target, opts, answer, h1=None):
    return {"hint1": vo(f"vo_g{g}_hint1", h1 or f"शब्दों को बोलकर देखिए। {target} से मिलती हुई आवाज़ वाला शब्द पहचानिए।"),
            "hint2": vo(f"vo_g{g}_hint2", ", ".join(opts) + "।"),
            "hint3": vo(f"vo_g{g}_hint3", f"{target} और {answer} दोनों तुकांत शब्द हैं। {answer} शब्द पर टैप कीजिए।")}


def opts(words, answer, pics=None):
    return [dict({"word": w, "audio": wd(w)}, **({"correct": True} if w == answer else {}), **({"img": IMG(pics[i])} if pics else {}))
            for i, w in enumerate(words)]


# deck page 14 - words only ("option me image nhi deni bs word dena hai")
slides.append({"id": "G2", "phase": "guided", "eis": "iconic", "type": "RHYME_PICK", "prompt_hi": "कढ़ाई का तुकांत शब्द पहचानिए।",
               "audio": dict(prompt=vo("vo_g2_prompt", "कढ़ाई का तुकांत शब्द पहचानिए। नचाई, चूल्हा, जलेबी।"),
                             **hints(2, "कढ़ाई", ["नचाई", "चूल्हा", "जलेबी"], "नचाई")),
               "data": {"target": {"word": "कढ़ाई", "img": IMG("kadai"), "audio": "vo_o_kadai"}, "options": opts(["नचाई", "चूल्हा", "जलेबी"], "नचाई")}})
# deck page 20 - हाँ / नहीं
slides.append({"id": "G3", "phase": "guided", "eis": "iconic", "type": "RHYME_YESNO", "prompt_hi": "मिठाई- चूल्हा, क्या यह तुकांत शब्द हैं?",
               "audio": {"prompt": vo("vo_g3_prompt", "मिठाई, चूल्हा, क्या यह तुकांत शब्द हैं? हाँ, नहीं।"),
                         "hint1": vo("vo_g3_hint1", "शब्दों को बोलकर देखिए। क्या दोनों शब्दों की अंतिम आवाज़ समान है?"),
                         "hint2": vo("vo_g3_hint2", "मिठाई, चूल्हा।"),
                         "hint3": vo("vo_g3_hint3", "मिठाई और चूल्हा दोनों की अंतिम आवाज़ अलग-अलग है। यह तुकांत शब्द नहीं हैं।")},
               "data": {"a": {"word": "मिठाई", "img": IMG("mithai"), "audio": "vo_o_mithai"},
                        "b": {"word": "चूल्हा", "img": IMG("chulha"), "audio": "vo_o_chulha"}, "rhymes": False,
                        "yes": {"word": "हाँ", "audio": vo("vo_yes", "हाँ।")}, "no": {"word": "नहीं", "audio": vo("vo_no", "नहीं।")}}})
# deck page 21 (first) - words only, as page 14
slides.append({"id": "G4", "phase": "guided", "eis": "iconic", "type": "RHYME_PICK", "prompt_hi": "हलवाई का तुकांत शब्द पहचानिए।",
               "audio": dict(prompt=vo("vo_g4_prompt", "हलवाई का तुकांत शब्द पहचानिए। रजाई, पैसे, जलेबी।"),
                             **hints(4, "हलवाई", ["रजाई", "पैसे", "जलेबी"], "रजाई")),
               "data": {"target": {"word": "हलवाई", "img": IMG("halwai"), "audio": "vo_o_halwai"}, "options": opts(["रजाई", "पैसे", "जलेबी"], "रजाई")}})
# deck page 21 (second / third) - the sentences, "image with text" options; the updated deck's new VO on the first
slides.append({"id": "G5", "phase": "guided", "eis": "iconic", "type": "RHYME_PICK", "prompt_hi": "तुकांत शब्द चुनकर वाक्य पूरा कीजिए।",
               "audio": dict(prompt=vo("vo_g5_prompt", "अब इस वाक्य को सही तुकांत शब्द चुनकर पूरा कीजिए। जंगल में नाच रहा था मोर। तभी वहाँ आया एक, खाली जगह। चोर, शेर, हाथी।"),
                             **hints(5, "मोर", ["चोर", "शेर", "हाथी"], "चोर")),
               "data": {"sentence": ["जंगल में नाच रहा था मोर,", "तभी वहाँ आया एक ____।"], "pictures": True,
                        "options": opts(["चोर", "शेर", "हाथी"], "चोर", ["chor", "sher", "hathi"])}})
slides.append({"id": "G6", "phase": "guided", "eis": "iconic", "type": "RHYME_PICK", "prompt_hi": "तुकांत शब्द चुनकर वाक्य पूरा कीजिए।",
               "audio": dict(prompt=vo("vo_g6_prompt", "तुकांत शब्द चुनकर वाक्य पूरा कीजिए। बंदर खा रहा था केला। पास ही लगा था एक, खाली जगह। मेला, पेड़, फूल।"),
                             **hints(6, "केला", ["मेला", "पेड़", "फूल"], "मेला")),
               "data": {"sentence": ["बंदर खा रहा था केला,", "पास ही लगा था एक ____।"], "pictures": True,
                        "options": opts(["मेला", "पेड़", "फूल"], "मेला", ["mela", "ped", "phool"])}})

# ---- PRACTICE: the six boxes (deck pages 19 x6), the trophy (page 28), the celebration (page 29) ------------
BOX = [("राजा का तुकांत शब्द पहचानिए।", "राजा", "raja", ["रानी", "बाजा", "मुकुट"], "बाजा"),
       ("रात के साथ कौन-सा शब्द तुकांत है?", "रात", "raat", ["दिन", "बात", "तारा"], "बात"),
       ("फूल के साथ कौन-सा शब्द तुकांत है?", "फूल", "phool", ["धूल", "पत्ता", "पेड़"], "धूल"),
       ("पानी के साथ कौन-सा शब्द तुकांत है?", "पानी", "paani", ["दूध", "रानी", "गिलास"], "रानी"),
       ("गाना के साथ कौन-सा शब्द तुकांत है?", "गाना", "gaana", ["दाना", "गीत", "ढोल"], "दाना"),
       ("हाथ के साथ कौन-सा शब्द तुकांत है?", "हाथ", "haath", ["पैर", "नाक", "साथ"], "साथ")]
questions = [{"prompt_hi": q, "audio": {"prompt": vo(f"vo_box{i}", q), "hint2": vo(f"vo_box{i}_hint2", ", ".join(o) + "।")},
              "target": {"word": t, "img": IMG(k), "audio": wd(t)}, "options": opts(o, a)}
             for i, (q, t, k, o, a) in enumerate(BOX, 1)]
slides.append({"id": "P1", "phase": "practice", "eis": "enactive", "type": "RHYME_BOXES", "prompt_hi": "डिब्बे को खोलने के लिए उसपर टैप कीजिए।",
               "audio": {"prompt": vo("vo_box_intro", "डिब्बे को खोलने के लिए उस पर टैप कीजिए।"),
                         "next": vo("vo_box_next", "किसी भी एक डिब्बे पर टैप कीजिए।")},
               "data": {"next_hi": "किसी भी एक डिब्बे पर टैप कीजिए।", "closed": IMG("gift_closed"), "open": IMG("gift_open"),
                        # six colours of the one box (user 2026-11-03): red, orange, green, blue, purple, pink
                        "boxes": [{"hue": h} for h in (0, 32, 110, 205, 262, 312)], "questions": questions}})
slides.append({"id": "REWARD", "phase": "practice", "eis": "iconic", "type": "TROPHY_REWARD", "prompt_hi": "",
               "audio": {}, "data": {"image": IMG("trophy"), "no_head": True}})
slides.append({"id": "CEL", "phase": "practice", "eis": "enactive", "type": "CELEBRATION", "prompt_hi": "",
               "audio": {"prompt": vo("vo_cel", "शाबाश! आपने तुकांत शब्द पहचानना सीख लिया।")}, "data": {}})

# ---- checks ------------------------------------------------------------------------------------------
for s in slides:
    d = s["data"]
    for o in d.get("options", []):
        assert o["audio"] in VO, o
    if "options" in d:
        assert sum(1 for o in d["options"] if o.get("correct")) == 1, s["id"]
for q in questions:
    assert sum(1 for o in q["options"] if o.get("correct")) == 1, q
assert sum(1 for w in slides[6]["data"]["lines"] for x in w["words"] if x["rhyme"]) == 10    # the deck's ten words

phase_n = {}
for s in slides:
    phase_n[s["phase"]] = phase_n.get(s["phase"], 0) + 1


# ---- VO-synced cues: where a word is said in its clip (File6's frac) -------------------------------------
def clip_len(cid):
    f = os.path.join(ROOT, "assets", "voiceover", cid + ".ogg")
    if not os.path.exists(f):
        return None
    try:
        return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
                                    capture_output=True, text=True).stdout.strip())
    except Exception:
        return None


def weight(t):
    return len(re.sub(r"[।,.!?—]", "oo", t))


def frac(cid, phrase, after=None):
    text = VO[cid]; i0 = text.index(after) + len(after) if after else 0
    i = text.index(phrase, i0); dur = clip_len(cid)
    pos = weight(text[:i]) / weight(text)
    if not dur:
        return round(.06 + .88 * pos, 3)
    return round((0.28 + pos * (dur - 0.28 - 0.36)) / dur, 3)


def timing(cid):
    """where the voice starts / ends and its spoken stretches between pauses, in ms - the form HI02H04_L03_S01's
    story karaoke follows ({s, e, segs}); measured with ffmpeg silencedetect"""
    f = os.path.join(ROOT, "assets", "voiceover", cid + ".ogg")
    dur = clip_len(cid)
    if not dur:
        return None
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", f, "-af", "silencedetect=n=-38dB:d=0.12", "-f", "null", "-"],
                         capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    ev = [(k, float(v)) for k, v in re.findall(r"silence_(start|end): ([0-9.]+)", err)]
    quiet, start = [], None
    for k, v in ev:
        if k == "start": start = v
        elif start is not None: quiet.append((start, v)); start = None
    if start is not None: quiet.append((start, dur))
    segs, t = [], 0.0
    for a, b in quiet:
        if a - t > 0.05: segs.append([round(t * 1000), round(a * 1000)])
        t = b
    if dur - t > 0.05: segs.append([round(t * 1000), round(dur * 1000)])
    return {"s": segs[0][0], "e": segs[-1][1], "segs": segs} if segs else None


AUDIO_TIMING = {cid: timing(cid) for _, cid in POEM}
AUDIO_TIMING = {k: v for k, v in AUDIO_TIMING.items() if v}

for s in slides:
    if s["type"] == "MEET_RHYME":
        d, cid = s["data"], s["audio"]["prompt"]; a, b = d["a"]["word"], d["b"]["word"]
        d["cues"] = {"a": frac(cid, a), "a_end": frac(cid, b, after=a), "b": frac(cid, b, after=a),
                     "b_end": frac(cid, "।", after=b)}

AUDIO_IDS = sorted(set(VO) | {"sfx_celebrate"})
card = {
    "version": "0.2",
    "skill_code": "HI02H04_L03_S02",
    "lo_code": "HI02H04_L03",
    "grade": "G2",
    "attribute": "H04",
    "skill_type": "CORE",
    "part_label": "",
    "theme": "toybox",
    "title": {"hi": "जलेबी", "en": "Rhyming words in a poem - Jalebi"},
    "landing_hero": {"kind": "art", "src": IMG("title_art")},
    "skill_description_hi": "एक कविता पढ़कर/सुनकर उसमें आए समान तुकांत शब्दों की पहचान करता है।",
    "credits": "कविता: मधु बी. जोशी · © प्रथम एजुकेशन फ़ाउंडेशन (StoryWeaver), CC BY 4.0",
    "phase_distribution": phase_n,
    "scaffold_rules": {"nudge_timeout_ms": {"tutorial": 7000, "guided": 7000, "practice": 7000, "independent": 7000},
                       "max_attempts": 3},
    "signals_expected": ["slide_entered", "slide_completed", "poem_read", "rhyme_find_done", "rhyme_pick_correct",
                         "rhyme_judge_correct", "rhyme_box_correct", "rhyme_boxes_done", "mastery_score", "lesson_completed"],
    "assets": {"audio_ext": "ogg", "img_ext": "webp",
               "audio": {k: f"assets/voiceover/{k}.ogg" for k in AUDIO_IDS},
               "audio_text": {k: VO[k] for k in sorted(VO)},
               "audio_timing": AUDIO_TIMING},
    "slides": slides,
}

# the celebration Swiftie (File6's kit, as it is); its lip-sync track measured from OUR celebration line
import importlib.util as _ilu
_cel = os.path.join(ROOT, "assets", "voiceover", "vo_cel.ogg")
_bits, _ms = "", 0
if os.path.exists(_cel):
    _spec = _ilu.spec_from_file_location("make_lipsync", os.path.join(HERE, "make_lipsync.py")); _ml = _ilu.module_from_spec(_spec); _spec.loader.exec_module(_ml)
    _bits, _ms = _ml.lipsync(_cel)
card["end_anim"] = {"base": "assets/celebration/", "vo": "vo_cel",
    "meta": {"cols": 6, "frames": 36, "fw": 329, "fh": 440,
             "shabaash": {"src": "cel_shabaash.webp", "pre": [0, 1, 2, 3, 4, 5], "word": list(range(6, 30)), "post": list(range(30, 36))},
             "talk": {"src": "cel_talk.webp", "open": [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32]},
             "idle": {"src": "cel_idle.webp", "loop": [0, 1, 2, 3, 4, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]}},
    "track": {"bits": _bits, "step_ms": 25, "ms": _ms}}

with open(os.path.join(ROOT, "card.json"), "w", encoding="utf-8") as f:
    json.dump(card, f, ensure_ascii=False, indent=1)
with open(os.path.join(HERE, "vo_script.json"), "w", encoding="utf-8") as f:
    json.dump({k: VO[k] for k in sorted(VO)}, f, ensure_ascii=False, indent=1)

# embed the card in index.html, and keep the page title in step
idx = os.path.join(ROOT, "index.html")
html = open(idx, encoding="utf-8").read()
blob = json.dumps(card, ensure_ascii=False, indent=1)
html, n = re.subn(r'(<script type="application/json" id="cardData">\n).*?(\n</script>)',
                  lambda m: m.group(1) + blob + m.group(2), html, count=1, flags=re.S)
assert n == 1, "cardData block not found in index.html"
html = re.sub(r"<title>.*?</title>", f"<title>SwiftPAL · {card['skill_code']} · {card['title']['hi']}</title>", html, count=1)
open(idx, "w", encoding="utf-8", newline="\n").write(html)
shutil.copyfile(idx, os.path.join(ROOT, "HI02H04_L03_S02.html"))
missing = [k for k in sorted(VO) if not os.path.exists(os.path.join(ROOT, "assets", "voiceover", k + ".ogg"))]
print(f"card: {len(slides)} slides {phase_n} · {len(VO)} VO lines" + (f" · to render: {missing}" if missing else ""))
