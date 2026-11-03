# HI02H04_L03_S02 — CHANGES (updated review → build v2)

Source: `HI02H04_L03_S02_review(Updated).pptx` (29 deck slides, same pages as `HI02H04_L03_S02_review.pptx` with 13 notes changed).
Base for layout / buttons / transitions / end screen / logic / dev menu: `MTG2A01_L04_S01 (File6 Maths)`, as instructed (user 2026-11-03).
Build v1 (the previous developer's) is kept in `_archive_v1/`.

Status vocabulary: ✅ DONE · ⚑ FLAGGED-BACK · ⏳ PENDING · N/C (deck slide asks nothing).

## Checklist

| # | Deck slide · page | Target | Change (from the deck) | Status · proof |
|---|---|---|---|---|
| 0 | user brief | whole game | Rebuild on File6's shell: landing card, header band + Swiftie, tutorial frame, yellow → button, phase gates, confetti, nudge hand, end screen, dev menu (`?dev=1`) | ✅ shell copied unchanged; Jalebi screens are `app.js [jalebi]` + `style.css [jalebi]`; all 18 screens mount with 0 console errors |
| 1 | S1 cover | — | N/C | — |
| 2 | S2 overview (v1) | — | N/C (describes v1) | — |
| 3 | S3 · p1 landing | landing | Title जलेबी; VO "नमस्ते दोस्त, मैं हूँ swiftee, आज हम एक कविता पढ़ेंगे- जलेबी।" | ✅ title art in File6's card; `vo_landing` |
| 4 | S4 · p2 gate 1 | tutorial gate | "ध्यान से देखिए और मेरे साथ पढ़िए, चलिए शुरू करें।" | ✅ `vo_pt_tutorial`; headline "चलिए, शुरू करें!" as Swiftee says it (click-tested) |
| 5 | S5 · p3 | T1 | Heading "आइए कविता पढ़ें।"; mic VO "इस बटन पर टैप कीजिए और कविता पढ़िए।"; mic glows; waves while the child reads; words light one by one; **after the child's reading** the line VO; then → | ✅ new `vo_mic_intro`; mic glow → orange + waves → words at reading pace → VO with karaoke → → (click-tested). Reading = timer (user 2026-11-03: "keep fake timer", 0.9 s/word) |
| 5a | S5 · p3 | T1 | Highlight सुलगाई- कढ़ाई; "use reference image" | ✅ orange rhyme words; v1's art drawn from the reference picture (video) |
| 6–10 | S6–S10 · p4–8 | T2–T6 | Heading "आइए कविता पढ़ें।"; text + VO per page; highlight नचाई-पिलाई / खिलखिलाई / टपकाई / आई / खाई; reference image | ✅ |
| 10a | user 2026-11-03 | T1–T6 | Placement inside the frame as HI02H04_L03_S01 (आलू-मालू-कालू) page 1: picture on top, sentence box under it, mic left of the box; heading, frame and → stay File6's. Pictures instead of videos (lighter file) | ✅ v1's 480×250 stills for pages 3–4 (`scene_1`, `scene_2`); `assets/video` removed; page 1 click-tested |
| 10b | user 2026-11-03 | T1–T6 | Picture + box sizes, text size/font, text animation, mic button + its logic, hand nudge as that repo | ✅ its values: picture 487×254, box 491 (min 92), 28px/700 Baloo 2, karaoke #FF8A00 ×1.1 (1100 ms/word while the child reads; measured voice timing while the VO reads), its yellow mic pill → voice bars → grey, its hand (`nudge_hand_ref.webp`, 96px, 34°, bob), its tap sound (`sfx_tap`), its logic (page 3: line + hand; every page: 7 s idle → line + hand; speaker before = line + hand, after = lines again). Picture 18px from the card top, box at 305px (the reference's places) |
| 10c | user 2026-11-03 | T1–T6; all tutorial pages | "remove heading, the next button is getting out of the main container" | ✅ no heading on T1–T6; → lifted 33px on every tutorial page (File6's 89px put it 3px below the frame) - now 20px inside the frame's bottom edge |
| 11 | S11 · p9 | T7 | Heading "कविता फिर से सुनिए।"; whole poem VO again; then "अब इन शब्दों को सुनिए…"; the 10 words (हलवाई … खाई); then the तुकांत explanation | ✅ one page (user 2026-11-03), order poem → words line → 10 words one by one → explanation |
| 12 | S12 · p10 | T8 | "कढ़ाई-मिठाई, तुकांत शब्द हैं।" + VO | ✅ cards light as each word is said |
| 13 | S13 · p11 | T9 | "जलेबी-चाशनी, तुकांत शब्द नहीं हैं।" + VO | ✅ |
| 14 | S14 · p12 gate 2 | guided gate | "transition- चलिए, साथ में करें।" | ✅ new `vo_pt_guided` (the line alone) (click-tested) |
| 15 | S15 · p13 | G1 | Text "आई की आवाज़ वाले शब्द पहचानिए।"; VO "इन पंक्तियों में…"; tap = word's sound; wrong = sound + wiggle; hint 2 VO; correct VO; no image | ✅ first 4 lines, 6 words; 3rd wrong in a row also lights a word to find (click-tested) |
| 16 | S16 · p14 | G2 | कढ़ाई — नचाई / चूल्हा / जलेबी, words only; hints 1–3 | ✅ 3rd hint lights नचाई, fades the others (click-tested) |
| 17 | S17 · p20 | G3 | मिठाई- चूल्हा — हाँ / नहीं; hints 1–3 | ✅ new `vo_yes`, `vo_no` (the cards say हाँ / नहीं) |
| 18 | S18 · p21 | G4 | हलवाई — रजाई / पैसे / जलेबी; hints 1–3 | ✅ words only (as p14) |
| 19 | S19 · p21 | G5 | मोर sentence, picture + word options; **new VO** "अब इस वाक्य को सही तुकांत शब्द चुनकर पूरा कीजिए।" | ✅ new `vo_g5_prompt`; चोर flies into the blank (click-tested) |
| 20 | S20 · p21 | G6 | केला sentence, picture + word options | ✅ |
| 21 | S21 · p18 gate 3 | practice gate | "lead's line verbatim" | ✅ "वाह! अब आपकी बारी।" |
| 22 | S22 · p19 | P1 | "डिब्बे को खोलने के लिए उसपर टैप कीजिए।"; 6 boxes, **अलग-अलग फल/मिठाई/रंग**; box 1 राजा (+ picture) रानी/बाजा/मुकुट; hint 1 wiggle, 2 options VO, 3 nudge | ✅ six colours (user 2026-11-03); hand on the right word at hint 3 (click-tested) |
| 23–27 | S23–S27 · p19 | P1 | "किसी भी एक डिब्बे पर टैप कीजिए।"; boxes 2–6 (रात, फूल, पानी, गाना, हाथ) with their pictures | ✅ header + VO after each box |
| 28 | S28 | REWARD | After all answers the trophy, then the celebration | ✅ no header |
| 29 | S29 · p26 | CEL | "शाबाश ! आपने तुकांत शब्द पहचानना सीख लिया।" | ✅ new `vo_cel`, File6's celebration Swiftie lip-synced to it |

## Where the deck was read a certain way (please confirm)

| Where | Deck | Built as |
|---|---|---|
| Guided order | Slide order: find-all (p13) → कढ़ाई → मिठाई-चूल्हा → हलवाई → मोर → केला | Deck order (v1 had moved find-all to the end) |
| G4 options | Not stated | Words only, as G2 |
| P1 board VO | "किसी भी एक डिब्बे पर टैप कीजिए।" listed like box 1's VO | Spoken + shown after each box |
| Gate headlines | p2 / p12 / p18 lines | File6's gate: the short headline shows as Swiftee says it |

## New VO (Gemini TTS "Kore", tools/build_vo.py — EAR-CHECK before delivery)
`vo_mic_intro`, `vo_pt_guided`, `vo_g5_prompt`, `vo_yes`, `vo_no`, `vo_cel`. Every other clip is v1's recording, unchanged.

## Rebuilding
```
python tools/lessons.py          # card.json + tools/vo_script.json; embeds the card in index.html, copies HI02H04_L03_S02.html
python tools/build_vo.py         # renders any VO line not yet on disk (GEMINI_KEY in the environment; ffmpeg)
node tools/gen_asset_sizes.js    # the preload manifest - after ANY asset change
```
Dev: `index.html?slide=N` opens slide N; `?dev=1` adds the slide navigator.
