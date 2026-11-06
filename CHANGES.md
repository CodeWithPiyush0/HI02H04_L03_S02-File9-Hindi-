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
| 10d | user 2026-11-03 (x2) | T1–T6 pictures | "the images feel stretched … still feels stretched, fix it" (container unchanged) | ✅ v1's six pictures were squeezed into 480×250 (pages 1–2 too). Each **drawn fresh** by Gemini (`tools/gen_scene.py`): v1's picture only as the reference for characters / style / colours, the scene from its poem line, natural proportions, 21:9 → centre crop at the box's exact shape (1.932), 966×500 - no axis is ever resized alone. Page 6 redone so she licks her lips / mouth waters (आँख नचाई, लार टपकाई). Originals in `_archive_v1` |
| 12a | user 2026-11-04 | T8, T9 (pages 8–9) + G2, G3 | New pictures supplied (one image of four, `tools/art/Indian Sweets and Syrup Collection.png`): cropped by its transparent gaps → `obj_kadai`, `obj_mithai`, `obj_jalebi`, `obj_chashni` (480×480, transparent). No ♪ / ≠ between the cards | ✅ |
| 12b | user 2026-11-04 | G1 (page 10) | Remove the "0/X" counter; the word box bigger (no blank space) | ✅ chips 46px, box padding 26/54 |
| 12c | user 2026-11-04 | G2–G4 (pages 11–13) | As HI02H04_L03_S01's page 14: picture box 560×315 (white, radius 14, soft shadow) under the header - here with the word inside, under the picture; page 12: two boxes (440 wide); options 344×78, 3px #DADBDF rim, radius 28, 7px grey foot, 32px / 800 navy, 36px apart, row at y 532. New कढ़ाई on page 11 | ✅ measured from the repo served locally; click-tested (hints → lock → right → next) |
| 12d | user 2026-11-04 | G4 (page 13) | The हलवाई of the cover page | ✅ `halwai_cover.webp`, cropped from the cover art (the title sign's edge patched out) |
| 13a | user 2026-11-04 | T8 (page 8) | Light the "ाई" ending of कढ़ाई / मिठाई in sync with the VO | ✅ an orange copy of the word clipped to the ending (a colour change inside the word would miss the ा - shaped with ढ़ / ठ); lit as each word is said, both again on "आई" - timed from the clip (click-tested) |
| 13b | user 2026-11-04 | every page with options | Options appear one by one in sync with their VO; a wrong option shakes with the wrong SFX | ✅ pages 11–15: each option pops in as the prompt names it (measured speech of every clip, `assets.audio_timing`; options in the order they are named); boxes: the question, then each option with its own word; wrong: shake + `sfx_wrong` heard alone (the word is no longer said over it), then the hint (click-tested) |
| 13c | user 2026-11-04 | G2, G4 (pages 11, 13), G3 (12) | 1st wrong: hint 1; 2nd: the options again, each glowing as said; 3rd: the others disabled, then hint 3. Page 12 the same | ✅ page 12's hint 2 ("मिठाई, चूल्हा।") lights the two pictures; the same ladder on 14–15 and the boxes' hint 2 (click-tested) |
| 14a | user 2026-11-05 | G5, G6 (pages 14–15) | The sentence lit in sync with its VO; 1st wrong: wiggle + "शब्दों को बोलकर देखिए, मोर से …"; 2nd: the options read; 3rd: the wrong ones disabled + "मोर और चोर दोनों तुकांत शब्द हैं …" | ✅ each word lights (#FF8A00 ×1.1) as it is said, the blank on "खाली जगह" (measured timing); the ladder as asked, wrong = shake + wrong SFX (click-tested) |
| 14b | user 2026-11-05 (x2) | P1 (page 16) | Redesign the game - gamified, and not a journey ("already used in many of our files") | ✅ **the mela ring-toss stall** (user's pick): a striped stall, the word's picture hanging on it, three bottles on the counter with the option words on tags (coming in as their words are said); a tapped bottle gets the ring thrown at it in an arc - right: it drops over the neck, a jalebi prize flies to Muniya's shelf, she jumps; wrong: it bounces off (wrong SFX, the bottle wobbles), then the deck's helps (2nd: the options read with glow, 3rd: the hand on the right word). Six prizes → Muniya cheers, confetti → trophy. The deck's box lines are not used (no boxes); each question's own VO asks it - a stall instruction VO can be added once the Gemini key works again (402 now). Gift-box art + `vo_box_intro` / `vo_box_next` removed (originals in `_archive_v1`) (played through: wrong ladder, 6/6 → trophy) |
| 14c | user 2026-11-05 | P1 (page 16) | "the assets do not look good - make it more interesting and kid friendly" | ✅ new images can't be generated (Gemini key 402), so drawn in SVG/CSS + v1's mela backdrop (`mela_bg.webp`, from `game_bg_mela`): the mela square behind the page; a red-and-white scalloped canopy with twinkling bulbs, a wooden sign (ring + stars), a polka-dot fabric wall, posts with flags, a wooden counter; the word's picture swings on two ropes; glossy bottles with cute faces (red / blue / green) that wiggle; a candy-striped ring with sparkles on a win; Muniya sways and jumps; a wooden prize board with six plates (played through 6/6) |
| 14d | user 2026-11-05 | P1 (page 16) | Use the user's two images (mela ground, stall) and follow their reference screen | ✅ `ringtoss_bg.webp` (from `bg_for_game.png`) as the page backdrop, `ringtoss_stall.webp` (from `stall.png`, cropped) as the stall - the hand-drawn stall, bulbs, sign and flags removed; the word's picture card hangs over the canopy's edge (cream, gold border); glossy red / blue / green bottles with yellow caps (no faces, as the reference); the words on cream pill tags with gold borders at the counter's edge; a red-and-white ring on the sand in front, thrown flat (it shrinks as it flies, lands on the bottle's shoulder); a cream prize board with gold border - three stars (one lights per two prizes) over six places. Source PNGs and the old `mela_bg.webp` moved to `tools/art/` (so they aren't preloaded). Instruction panel kept (the shell's), not the reference's banner (played through: wrong throw, 6/6, stars 1-2-3 → trophy, 0 errors) |
| 14e | user 2026-11-05 | P1 (page 16) | "the ring does not feel good" - remove the character, put the ring in her place, it should properly go in the bottle | ✅ Muniya removed from the page (her jump/cheer too); the ring rests on the sand at the left. The ring is now two halves (far + near): in the air both in front, on a right throw the far half goes behind the bottle and the near half stays in front, so it drops over the cap, slides down the neck and settles round the shoulder (a small bounce and tilt), the bottle stops rocking and glows, sparkles. Wrong: it clips the cap and bounces back to the sand (played through: wrong throw, 6/6, stars 1-2-3 → trophy, 0 errors) |
| 11 | S11 · p9 | T7 | Heading "कविता फिर से सुनिए।"; whole poem VO again; then "अब इन शब्दों को सुनिए…"; the 10 words (हलवाई … खाई); then the तुकांत explanation | ✅ **one page** (user 2026-11-03), the poem in two halves of four lines in one box - lines read (word karaoke) → "अब इन शब्दों को सुनिए…" → first 6 words → the box fades to lines 5–8 by itself (no tap) → last 4 words → explanation → →; no counter (click-tested) |
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
