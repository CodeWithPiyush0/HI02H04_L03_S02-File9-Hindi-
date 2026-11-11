"""The lesson's voice-over manifest - lesson_vo_manifest.xlsx (the format of MTG2A01_L04_S02's, File7).

Four sheets:
  VO Manifest     every clip where it is heard, in game order (start screen, transitions, pages 1-16, celebration):
                  page, screen, #, Audio ID, the Hindi script (spoken exactly), what it is, when it plays, the other
                  pages that play the same recording, duration, status
  Recording list  each recording once, in the order it is first heard, with its file name
  Sound effects   the sound files the lesson plays (supplied, not recorded)
  Recording spec  scope, folder, format, how to put new recordings in

Reads card.json (the build's own text and the page order) and the clips on disk (durations).
    python tools/gen_vo_manifest.py
"""
import json, os, subprocess
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CARD = json.load(open(os.path.join(ROOT, "card.json"), encoding="utf-8"))
TEXT = CARD["assets"]["audio_text"]
VO_DIR = os.path.join(ROOT, "assets", "voiceover")
SFX_DIR = os.path.join(ROOT, "assets", "sfx")
OUT = os.path.join(ROOT, "lesson_vo_manifest.xlsx")
TITLE = CARD["title"]["hi"] + " (" + CARD["skill_code"] + ")"

# where each clip came from (CHANGES.md)
NEW_TTS = {"vo_mic_intro", "vo_pt_guided", "vo_yes", "vo_no"}                       # Gemini "Kore", tools/build_vo.py
CUT = {"vo_g2_prompt", "vo_g3_prompt", "vo_g4_prompt", "vo_g5_prompt", "vo_g6_prompt"}  # cut to end at the question (SME 2026-11-09)
STAND_IN = {"vo_g5_correct_tmp": "vo_g5_correct", "vo_g6_correct_tmp": "vo_g6_correct"}
# the user's new takes (2026-11-10): the WAV masters in _vo_source/, encoded into assets/voiceover/
SRC_DIR = os.path.join(ROOT, "_vo_source")
NEW_TAKE = {f[:-4] for f in os.listdir(SRC_DIR) if f.endswith(".wav")} if os.path.isdir(SRC_DIR) else set()


def duration(path):
    try:
        return round(float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                          capture_output=True, text=True).stdout.strip()), 2)
    except Exception:
        return None


def on_disk(cid):
    return os.path.exists(os.path.join(VO_DIR, cid + ".ogg"))


def status(cid):
    if not on_disk(cid):
        return "MISSING - to record"
    if cid in NEW_TAKE:
        return "New take (_vo_source/)"
    if cid in STAND_IN:
        return "Stand-in (cut from this lesson's clips) - until " + STAND_IN[cid] + " is recorded"
    if cid == "vo_cel":
        return "Copied (File3 vo_cel_prompt, Gemini Kore)"
    if cid == "vo_g5_prompt":
        return "TTS (Gemini, Kore) - cut to the question"
    if cid in CUT:
        return "v1 clip - cut to the question"
    if cid in NEW_TTS:
        return "TTS (Gemini, Kore)"
    return "v1 clip (unchanged)"


def clean(t):
    return str(t).replace("।", "").replace(",", "").replace("!", "").replace("?", "").strip()


# ---- what each clip is and when it plays, page by page (the build's behaviour, app.js JalebiModules) ----
def page_rows(s, page_no):
    """the clips of one page in the order they are heard: [(screen suffix or None, audio id, what, when)]"""
    au, d, ty = s.get("audio", {}), s.get("data", {}), s["type"]
    out = []
    def add(cid, what, when, screen=None):
        if cid:
            out.append((screen, cid, what, when))

    if ty == "POEM_READ":
        if au.get("intro"):
            add(au["intro"], "mic instruction", "as the page opens; the hand points at the mic (the speaker replays it before the poem is read)")
        add(au.get("idle"), "inactivity reminder",
            "7s with no tap on the mic: this line again with the hand on the mic, again every 7s while idle"
            + ("" if au.get("intro") else " (the speaker plays it too, before the poem is read)"))
        for n, l in enumerate(d["lines"], 1):
            add(l["audio"], "poem line" + (" %d of %d" % (n, len(d["lines"])) if len(d["lines"]) > 1 else ""),
                ("after the child taps the mic: the words light one by one while the child reads (no voice), then " if n == 1 else "next; ")
                + "the line is read, each word lit (orange) as it is said" + ("; then the next button (the speaker reads the lines again)" if n == len(d["lines"]) else ""))
    elif ty == "POEM_RECAP":
        lines = [l for part in d["parts"] for l in part]
        half = len(d["parts"][0])
        for n, l in enumerate(lines, 1):
            add(l["audio"], "poem line %d of %d" % (n, len(lines)),
                ("as the page opens: the whole poem in one go, " if n == 1 else
                 "the second half's lines come into the same box (only the lines change); " if n == half + 1 else "next; ")
                + "each word lit as it is said; a rhyme word flies onto the तुकांत शब्द board as it is said")
        add(au.get("words"), "the board's words - intro", "after the poem; the board is full")
        seen = []
        for l in lines:
            for w in l["words"]:
                if w.get("rhyme") and clean(w["t"]) not in [x[0] for x in seen]:
                    seen.append((clean(w["t"]), w["audio"]))
        for t, cid in seen:
            add(cid, "board word «%s»" % t, "one by one: its place on the board lights (orange) as it is said")
        add(au.get("conclude"), "what तुकांत means", "after the words; then the next button (the speaker plays the whole page again)")
    elif ty == "MEET_RHYME":
        lights = "the cards light as their words are said"
        if d.get("ending"):
            lights += "; each word's «%s» lights orange as it is said, both again on «आई»" % d["ending"]
        elif d["a"].get("ending"):
            lights += "; «%s» of %s and «%s» of %s light orange as each word is said" % (d["a"]["ending"], d["a"]["word"], d["b"]["ending"], d["b"]["word"])
        add(au.get("prompt"), "the two words - " + ("they rhyme" if d.get("rhymes") else "they do not rhyme"),
            "as the page opens; " + lights + "; then the next button (the speaker replays it)")
        for w in (d["a"], d["b"]):
            add(w["audio"], "word «%s»" % w["word"], "after the line: its card tapped - its word")
    elif ty == "FIND_RHYME":
        add(au.get("prompt"), "page instruction", "as the page opens; 0/6 over the poem (said again after 7s idle and by the speaker)")
        seen = []
        for l in d["lines"]:
            for w in l["words"]:
                if w["audio"] in seen:
                    continue
                seen.append(w["audio"])
                if w.get("rhyme"):
                    add(w["audio"], "word «%s» - an आई word" % clean(w["t"]),
                        "tapped: it turns green and gets its number, the counter goes up, the right sound; then its word")
                else:
                    add(w["audio"], "word «%s» - not an आई word" % clean(w["t"]),
                        "tapped: the wrong sound and a wiggle, then its word")
        add(au.get("hint2"), "Hint 2 (2nd wrong tap in a row)",
            "after the word; the hand then guides to the next आई word (the others are off until it is found)")
        add(au.get("correct"), "all 6 found", "confetti; then the next page")
    elif ty == "RHYME_PICK":
        right = next(o for o in d["options"] if o.get("correct"))
        if d.get("sentence"):
            add(au.get("prompt"), "the question - the sentence with its blank",
                "as the page opens; each word of the sentence lights as it is said, the blank on «खाली जगह»; then the 3 picture "
                "cards come in one by one, silently (said again after 7s idle and by the speaker)")
        else:
            add(au.get("prompt"), "the question", "as the page opens; then the 3 options come in one by one, silently "
                "(said again after 7s idle and by the speaker)")
            add(d["target"]["audio"], "word «%s»" % d["target"]["word"], "its picture tapped - its word")
        add(au.get("hint1"), "Hint 1 (1st wrong answer)", "after the wrong sound and the wiggle (a wrong card is not coloured)")
        if all(o.get("hint2") and on_disk(o["hint2"]) for o in d["options"]):
            for o in d["options"]:
                add(o["hint2"], "Hint 2 (2nd wrong answer) - «%s»" % o["word"], "the options said again one by one, left to right; this card lit orange while it is said")
        else:
            add(au.get("hint2"), "Hint 2 (2nd wrong answer)", "the options said again, each card lighting orange as it is said")
        add(au.get("hint3"), "Hint 3 (3rd wrong answer)", "the other cards fade and lock; only the right card stays")
        if d.get("sentence"):
            add(right["audio"], "correct answer - «%s»" % right["word"],
                "the card turns green, flies into the blank and only its word stays above the dashes; the other cards go, "
                "the sentence moves to the middle, confetti; then the word")
            if au.get("correct"):
                add(au["correct"], "the sentence said again",
                    "after the word: each word lit as it is said - plays as soon as the file is in assets/voiceover/")
            if au.get("correct_tmp") and not on_disk(au.get("correct") or ""):
                add(au["correct_tmp"], "the sentence said again (stand-in)",
                    "plays now in place of %s (no «सही वाक्य है»), each word lit as it is said; then the next page" % au.get("correct"))
        else:
            add(right["audio"], "correct answer - «%s»" % right["word"],
                "the card turns green, the others go, confetti; then the word; then the next page")
    elif ty == "RHYME_YESNO":
        right = d["yes"] if d.get("rhymes") else d["no"]
        add(au.get("prompt"), "the question", "as the page opens; then हाँ / नहीं come in one by one, silently "
            "(said again after 7s idle and by the speaker)")
        for w in (d["a"], d["b"]):
            add(w["audio"], "word «%s»" % w["word"], "its picture tapped - its word")
        add(au.get("hint1"), "Hint 1 (1st wrong answer)", "after the wrong sound and the wiggle (a wrong card is not coloured)")
        for w in (d["a"], d["b"]):
            add(w["audio"], "Hint 2 (2nd wrong answer) - «%s»" % w["word"], "the two words said again, left to right; this picture lit orange while it is said")
        add(au.get("hint3"), "Hint 3 (3rd wrong answer)", "the other card fades and locks; only the right one stays")
        add(right["audio"], "correct answer - «%s»" % right["word"], "the card turns green, the other goes, confetti; then the word; then the next page")
    elif ty == "RING_TOSS":
        for qi, q in enumerate(d["questions"], 1):
            scr = "  (Q%d %s)" % (qi, q["target"]["word"])
            right = next(o for o in q["options"] if o.get("correct"))
            add(q["audio"]["prompt"], "question %d of %d" % (qi, len(d["questions"])),
                ("as the page opens" if qi == 1 else "after the last star") + "; the picture hangs on the stall, then the 3 "
                "bottles come in one by one, silently; Swifty's beak moves with the voice" + ("; the hand shows the right bottle for a moment" if qi == 1 else "")
                + " (said again after 7s idle and by the speaker)", scr)
            add(q["target"]["audio"], "word «%s»" % q["target"]["word"], "its picture tapped - its word", scr)
            for o in q["options"]:
                add(o["audio"], "Hint 2 (2nd wrong answer) - «%s»" % o["word"],
                    "the bottles' words said again left to right, each bottle lighting orange as it is said (the bottles are shuffled, so the order changes)", scr)
            add(au.get("hint3"), "Hint 3 (3rd wrong answer)",
                "the other bottles lock, the hand points at the right bottle; then this line - plays as soon as the file is in assets/voiceover/", scr)
            add(right["audio"], "correct answer - «%s»" % right["word"],
                "the ring drops over the bottle, a star flies to the board; then the word" + ("; after the 6th star: confetti, then the celebration" if qi == len(d["questions"]) else ""), scr)
    elif ty == "CELEBRATION":
        add(au.get("prompt"), "celebration", "the celebration screen: Swiftee jumps on «शाबाश», then says the line lip-synced")
    return out


# ---- the game order ----
GATE = {"tutorial": ("vo_pt_tutorial", "«चलिए, शुरू करें!»"), "guided": ("vo_pt_guided", "«चलिए, साथ में करें!»"),
        "practice": ("vo_pt_practice", "«अब आपकी बारी!»")}
slides = CARD["slides"]
order = [("Start screen", "Start screen", [("vo_landing", ("greeting",
          "the start screen: Swiftee's greeting - on the first tap anywhere on the screen (browsers allow no sound before a tap) or on the speaker"))])]
phase, gates = None, 0
for i, s in enumerate(slides):
    if s.get("phase") != phase and s.get("phase") in GATE:
        phase = s["phase"]; gates += 1
        cid, line = GATE[phase]
        order.append(("Transition %d" % gates, "before page %d" % (i + 1),
                      [(cid, ("transition line", "Swiftee rises talking; " + line + " wipes in as it is said"))]))
    page = "Celebration" if s["type"] == "CELEBRATION" else "Page %d" % (i + 1)
    screen = s["id"] + " · " + s["type"]
    rows = page_rows(s, i + 1)
    # one block per screen (the ring toss has a screen per question)
    blocks = {}
    for suffix, cid, what, when in rows:
        blocks.setdefault(screen + (suffix or ""), []).append((cid, (what, when)))
    for scr, r in blocks.items():
        order.append((page, scr, r))

# where else each recording is heard
heard = {}
for page, screen, rows in order:
    for cid, _ in rows:
        heard.setdefault(cid, [])
        if page not in heard[cid]:
            heard[cid].append(page)

DUR = {cid: duration(os.path.join(VO_DIR, cid + ".ogg")) if on_disk(cid) else "-" for cid in heard}

manifest = []
n = 0
for page, screen, rows in order:
    for k, (cid, (what, when)) in enumerate(rows, 1):
        n += 1
        also = ", ".join(p for p in heard[cid] if p != page)
        manifest.append(([n, page, screen, k, cid, TEXT.get(cid, ""), what, when, also, DUR[cid], status(cid)], status(cid)))

recordings, listed = [], set()
for page, screen, rows in order:
    for cid, _ in rows:
        if cid not in listed:
            listed.add(cid)
            recordings.append(([len(recordings) + 1, cid, cid + ".ogg", TEXT.get(cid, ""), ", ".join(heard[cid]), DUR[cid], status(cid)], status(cid)))
# in the card but never heard (kept for safety)
unheard = sorted(k for k in CARD["assets"]["audio"] if k.startswith("vo_") and k not in heard)

SFX = [("sfx_play", "Play button on the start screen - on the press", "Start"),
       ("sfx_next", "Next arrow (pages 1-9) - on a real press", "1-9"),
       ("sfx_gate_whoosh", "The three transition screens - as each opens", "transitions"),
       ("sfx_tap", "The mic button - on the tap, before the child reads", "1-6"),
       ("sfx_correct", "Right answer / a right word found", "10-16"),
       ("sfx_wrong", "Wrong answer / a wrong word tapped (with the wiggle)", "10-16"),
       ("sfx_confetti", "With every confetti burst", "10-16"),
       ("sfx_nudge", "When the hand nudge comes in", "1-6, 10, 16"),
       ("sfx_whoosh", "Ring toss - the ring thrown at a bottle", "16"),
       ("sfx_star_pop_new", "Ring toss - a star landing on the board", "16"),
       ("bgm", "Background music - from the play button on, dipped under the voice; paused while the tab is hidden", "all")]
sfx_rows = []
for sid, what, pages in SFX:
    f = os.path.join(SFX_DIR, sid + ".ogg")
    sfx_rows.append(([sid, "assets/sfx/" + sid + ".ogg", what, pages, duration(f) if os.path.exists(f) else "MISSING"], None))
f = os.path.join(VO_DIR, "sfx_celebrate.ogg")
sfx_rows.append((["sfx_celebrate", "assets/voiceover/sfx_celebrate.ogg", "Celebration screen - as it opens", "Celebration",
                  duration(f) if os.path.exists(f) else "MISSING"], None))
unused_sfx = sorted(x[:-4] for x in os.listdir(SFX_DIR) if x.endswith(".ogg") and x[:-4] not in [r[0][0] for r in sfx_rows])

# ---- the workbook ----
thin = Side(style="thin", color="C9CED6"); box = Border(left=thin, right=thin, top=thin, bottom=thin)
hfill = PatternFill("solid", fgColor="1F4E79"); DEV = "Nirmala UI"
PAGE_FILL = {"Start screen": "EAF2FB", "Celebration": "FFF4D6"}


def sheet(ws, title, sub, head, widths, data, dev_col=None, wrap_cols=(), center=(), freeze="E5", fill=None):
    ws.append([title]); ws["A1"].font = Font(bold=True, size=14, color="1F4E79")
    ws.append([sub]); ws["A2"].font = Font(italic=True, size=10, color="555555")
    ws.append([])
    ws.append(head)
    for c in range(1, len(head) + 1):
        cell = ws.cell(row=4, column=c)
        cell.font = Font(bold=True, color="FFFFFF"); cell.fill = hfill; cell.border = box
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    for row, meta in data:
        ws.append(row); r = ws.max_row
        for c in range(1, len(head) + 1):
            cell = ws.cell(row=r, column=c); cell.border = box
            if fill: cell.fill = PatternFill("solid", fgColor=fill(row))
            cell.alignment = Alignment(vertical="center", wrap_text=(c in wrap_cols), horizontal="center" if c in center else None)
            if dev_col and c == dev_col:
                cell.font = Font(name=DEV, size=12, bold=True)
        if meta and meta.startswith("MISSING"):
            ws.cell(row=r, column=len(head)).font = Font(bold=True, color="B03A2E")
    for i, w in enumerate(widths):
        ws.column_dimensions[chr(65 + i)].width = w
    if freeze: ws.freeze_panes = freeze


def page_fill(row):
    p = str(row[1])
    if p.startswith("Transition"): return "EEF7EE"
    return PAGE_FILL.get(p, "FFFFFF" if int(row[0]) % 2 else "F7F9FC")


n_pages = sum(1 for s in slides if s["type"] != "CELEBRATION")
wb = Workbook()
ws = wb.active; ws.title = "VO Manifest"
sheet(ws, TITLE + " - lesson vo",
      "Start screen -> transitions and pages 1-%d in game order -> celebration. On each page: what plays as it opens, the steps, "
      "the words said on a tap, the 1st / 2nd / 3rd wrong answer (Hint 1, 2, 3), then the correct answer." % n_pages,
      ["S.No", "Page", "Screen", "#", "Audio ID", "Hindi script (spoken exactly)", "What it is", "When it plays", "Same recording also on",
       "Duration (s)", "Status"],
      [6, 13, 30, 4, 22, 50, 30, 62, 22, 10, 22], manifest, dev_col=6, wrap_cols=(3, 6, 7, 8, 9, 11), center=(1, 4, 10), fill=page_fill)
sheet(wb.create_sheet("Recording list"), "Recording list - each recording once, in the order it is first heard",
      "%d recordings. Record each once; the file name is the Audio ID + .ogg, in assets/voiceover/." % len(recordings),
      ["S.No", "Audio ID", "File name", "Hindi script (spoken exactly)", "Plays on", "Duration (s)", "Status"],
      [6, 22, 24, 54, 44, 10, 22], recordings, dev_col=4, wrap_cols=(4, 5, 7), center=(1, 6))
sheet(wb.create_sheet("Sound effects"), "Sound effects and music (supplied - not recorded)",
      "Only the files the lesson plays. The small interface sounds (taps, a card appearing / popping, the ring moving) are made "
      "in the browser (WebAudio) - no file." + (" In assets/sfx/ but not played: " + ", ".join(unused_sfx) + "." if unused_sfx else ""),
      ["Audio ID", "File name", "What it is / where it plays", "Page(s)", "Duration (s)"],
      [20, 38, 84, 12, 11], sfx_rows, wrap_cols=(3,), center=(5,), freeze=None)
sp = wb.create_sheet("Recording spec")
gate_n = sum(1 for o in order if o[0].startswith("Transition"))
ids = ", ".join(s["id"] for s in slides if s["type"] != "CELEBRATION")
missing = [r[0][1] for r in recordings if r[1].startswith("MISSING")]
SPEC = [
    (TITLE + " - recording spec", None), (None, None),
    ("Scope", "The whole lesson - start screen, %d transitions, %d pages (%s), celebration." % (gate_n, n_pages, ids)),
    ("Order", "Game order. On each page: what plays as it opens, the steps, the words said when tapped, then the 1st / 2nd / 3rd "
              "wrong answer (Hint 1, 2, 3) and the correct answer. A recording heard on more than one page is listed on each "
              "('Same recording also on'). The ring toss (page 16) has a screen per question; its 1st wrong answer has no line "
              "(the ring bounces off), its Hint 2 is the bottles' own words."),
    ("Clips", "%d rows, %d distinct recordings (see 'Recording list')." % (len(manifest), len(recordings)) +
              (" In the card but not heard in this build (not listed): " + ", ".join(unheard) + "." if unheard else "")),
    ("To record", ("Not on disk yet (the game skips them until they are): " + ", ".join(missing) + ".")
                  if missing else "Nothing - every clip is on disk."),
    ("New takes in", "%d clips are the new takes of 2026-11-10 / 11 (Status 'New take'); their WAV masters are in _vo_source/. "
                     "The others are still the earlier clips." % sum(1 for r in recordings if r[1].startswith("New take"))),
    ("Folder", "assets/voiceover/<Audio ID>.ogg - the file name is the Audio ID."),
    ("Voice", "The new takes (_vo_source/, 2026-11-10); the clips without a new take are the earlier Gemini TTS ones (voice Kore, tools/build_vo.py)."),
    ("Format", "Ogg/Opus, 48 kHz mono, 32 kbps; 0.28 s before the voice, 0.36 s after; -18.5 LUFS (two-pass loudnorm)."),
    ("Register", "आप form throughout (the celebration line is the team's standard «तुमने»)."),
    ("Script", "Record exactly the text in the Hindi script column - it is the build's own text. The question clips end at the "
               "question: the options come in silently (SME 2026-11-09)."),
    ("Timing", "Several pages light words as they are said (the poem lines, the sentences, the hint 2 lines, the two words on "
               "pages 8-9). The times are measured from each clip's pauses: after new recordings run  python tools/lessons.py  "
               "so they are measured again from the new takes."),
    ("Celebration", "Swiftee's lip-sync on the celebration line is measured from vo_cel.ogg by tools/lessons.py (tools/make_lipsync.py) - "
                    "re-run it after a new take of vo_cel."),
    ("New takes", "Keep the same file name, put it in assets/voiceover/, then:  python tools/lessons.py  and  node tools/gen_asset_sizes.js  "
                  "(bump the ?v= stamp in index.html so browsers fetch the new audio)."),
    ("Regenerate", "python tools/gen_vo_manifest.py"),
]
for r, (a, b_) in enumerate(SPEC, 1):
    sp.cell(row=r, column=1, value=a); sp.cell(row=r, column=2, value=b_)
    sp.cell(row=r, column=1).font = Font(bold=True, size=14 if r == 1 else 11, color="1F4E79" if b_ is None else "000000")
    if b_:
        sp.cell(row=r, column=2).font = Font(name=DEV, size=11)
        sp.cell(row=r, column=2).alignment = Alignment(wrap_text=True, vertical="top")
        sp.cell(row=r, column=1).alignment = Alignment(vertical="top")
sp.column_dimensions["A"].width = 16; sp.column_dimensions["B"].width = 120

wb.save(OUT)
print("lesson_vo_manifest.xlsx: %d rows, %d recordings%s" % (len(manifest), len(recordings), ("; MISSING: " + ", ".join(missing)) if missing else ""))
if unheard:
    print("in the card, not heard:", ", ".join(unheard))
if unused_sfx:
    print("sfx not played:", ", ".join(unused_sfx))
