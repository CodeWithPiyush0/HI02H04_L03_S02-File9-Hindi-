/* [pause] user 2026-10-23: "when I switch tab or minimise the browser the game should be paused, and when I come back it
   should resume". While the page is hidden: every timer the game set is frozen with the time it had left (the steps of a
   page, its waits, its 7s reminders, the clip watchdogs), every animation (CSS and WAAPI) is paused, the voice, the sound
   effects and the music pause and WebAudio is suspended. Back on the page all of it carries on from where it stopped -
   the voice-synced steps follow the clip's own time, so they stay in sync. (setInterval is left alone: the blinks and
   twinkles it drives already skip a hidden page.) */
const GamePause = (function(){
  const _st = window.setTimeout.bind(window), _ct = window.clearTimeout.bind(window);
  const T = new Map(); let seq = 1e7, paused = false, anims = [], media = [], ctxs = [];
  const arm = (id, t)=>{ t.at = performance.now(); t.real = _st(()=>{ T.delete(id); t.fn(...t.args); }, t.ms); };
  window.setTimeout = function(fn, ms, ...args){
    if(typeof fn !== "function") return _st(fn, ms);
    const id = ++seq, t = { fn, args, ms: Math.max(0, +ms || 0), at: 0, real: 0 };
    T.set(id, t); if(!paused) arm(id, t); return id; };
  window.clearTimeout = function(id){ const t = T.get(id); if(t){ _ct(t.real); T.delete(id); } else _ct(id); };
  function pause(){
    if(paused) return; paused = true; const now = performance.now();
    T.forEach(t =>{ _ct(t.real); t.ms = Math.max(0, t.ms - (now - t.at)); });
    try{ anims = document.getAnimations().filter(a => a.playState === "running"); anims.forEach(a => a.pause()); }catch(e){ anims = []; }
    media = [...document.querySelectorAll("audio, video")].concat(typeof voEl !== "undefined" ? [voEl] : [],
              typeof _sfxPool !== "undefined" ? _sfxPool : [], (typeof BGM !== "undefined" && BGM.el) ? [BGM.el] : []);
    media = [...new Set(media)].filter(m => m && !m.paused && !m.ended); media.forEach(m =>{ try{ m.pause(); }catch(e){} });
    ctxs = [typeof _juiceAC !== "undefined" ? _juiceAC : null, typeof _actx !== "undefined" ? _actx : null].filter(c => c && c.state === "running");
    ctxs.forEach(c =>{ try{ c.suspend(); }catch(e){} });
  }
  function resume(){
    if(!paused) return; paused = false;
    ctxs.forEach(c =>{ try{ c.resume(); }catch(e){} }); ctxs = [];
    media.forEach(m =>{ try{ m.play().catch(()=>{}); }catch(e){} }); media = [];
    anims.forEach(a =>{ try{ if(a.playState === "paused") a.play(); }catch(e){} }); anims = [];
    T.forEach((t, id)=> arm(id, t));
  }
  document.addEventListener("visibilitychange", ()=>{ if(document.hidden) pause(); else resume(); });
  return { pause, resume, get paused(){ return paused; } };
})();
const CARD = JSON.parse(document.getElementById('cardData').textContent);
  const AUDIO_EXT = (CARD.assets && CARD.assets.audio_ext) || "ogg";  // Ogg/Opus (every lesson's audio since 2026-10-06; Chrome/Edge/Firefox, Safari 18.4+)
  const IMG_EXT   = (CARD.assets && CARD.assets.img_ext)   || "webp"; // WebP (all still art; Chrome/Edge/Firefox/Safari 14+) — twin of AUDIO_EXT (fixes A3)
  const ENGINE_VERSION = "2026.07.16i-r4-unified";  // ENGINE STAMP — the receipt (verify_bundle.py) asserts a built game carries THIS exact string; a stale/divergent engine → hard FAIL, so the wrong engine can never silently ship. BUMP IN LOCKSTEP with engine_guard.py + swiftpal_build.py + unified_build.py + verify_bundle.py on EVERY engine change (r2: drag/pattern feedback standard + PHASE_TRANSITION; r3c: off-white toybox bg, dual-coded counting options numeral+hand, full-body landing mascot, true-corner square/rect; r3d: Swiftie mouth-stops-when-silent (still frame), Arabic display numerals 1/2/3, landing shows full 1..n hand row, volume-chip aligned in header pill); r4: additive number-sequence path modules MEET_SEQUENCE + SEQUENCE_COMPLETE + SEQUENCE_NEXT (MTKGA01_L02_S04 "completes a number sequence within 20") — purely additive, existing lessons untouched. r4-landing (16c): landing recomposed to match reference — small corner mascot (230px, was 300), content re-centered (dropped padding-left:300 right-shift hack), VO chip moved from top-right to the mascot's shoulder (left:150/bottom:34, 58px). CSS-only; supersedes the 16b right-shift overlap fix.; 16d: TRUNK MERGE — unified the two diverged engine lines at base 12d: the 15e mechanics trunk (CONSERVE_COUNT + COUNT_ACTION + COUNT_DRAG_MATCH + ORDER_BY_WEIGHT + PICK_SET_BY_NUMBER, per_row/dense count-set grouping, bigNumCell numeral-only test options, title_first landing order) + the 16c r4 design trunk (boot loader, peek phase-transition, concept-strip landing, DS header, flat CTAs, sunburst/star-burst celebration, recomposed corner-mascot landing). Nothing dropped from either line. 16e: landing count-hero hand sizing FIXED — the .sg-hero sizing selectors never matched (template uses .sg-art); hands rendered natural-size, overflowing the card (title pushed outside the box, numeral-1 hidden behind the mascot — user-visible on MTKGA01_L02_S01). Retargeted to .sg-art .sg-hand/.sg-hand-cell/.sg-hand-num (112px; image-hero landings untouched). CSS-only. 16f: INTRO strip fit-or-wrap — old sizing assumed 1220px + a -100px breakout and punched wide strips (10 numerals, 7+ letters) through the tut-frame borders; now sized to the frame (960) and wrapping into two balanced rows below the 110px touch floor. Fixes MTKGA01_L02_S01 s00 (user-caught live) AND the HIKGH04_P2 letter-row daylight item.
  try { window.SWIFTPAL_ENGINE = ENGINE_VERSION; } catch(e){}
const $ = id => document.getElementById(id);

/* ---------- 1. SCALE THE 1333x750 STAGE - ON EVERY SCREEN ----------
   [responsive] (review 2026-10-01: "make my game all screen responsive"). The lesson is ONE fixed 1333x750 stage,
   scaled as a whole to the largest size the screen holds (contain-fit) and never re-laid-out: in a measuring game
   the sizes ARE the content (each object is exactly n blocks long), so nothing may reflow on a phone. Every other
   shape of screen is handled AROUND the stage:
   - viewport-fit=cover (index.html): the page fills the whole screen, notch and home bar included, and the STAGE is
     fitted inside the safe area (env(safe-area-inset-*)) - no button ever sits under a notch or the home bar.
   - the bands a stage leaves (above and below it on a 4:3 iPad, beside it on a 20:9 phone) show the slide's OWN
     backdrop, mirrored at the stage's edge (bleed below): the room, the yard, the fridge door simply carry on.
   - a phone or tablet held upright: a "turn it" card over the lesson (html.ask-rotate); a voice line that was
     speaking waits for the turn back, then goes on.
   - a phone/tablet BROWSER goes full screen on the play tap, and stays landscape where it can (Android).
   Pointer maths everywhere reads --scale at the moment it runs, so drags stay exact at every size. */
const Screen = (function(){
  const root = document.documentElement;
  let probe = null, asking = false, heldVO = false, bleedQueued = false;
  function safe(){
    if(!probe){ probe = document.createElement("div"); probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
        "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
      (document.body || root).appendChild(probe); }
    const cs = getComputedStyle(probe);
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  function touch(){ try{ return matchMedia("(pointer: coarse)").matches; }catch(e){ return false; } }
  function fit(){
    const vw = (window.visualViewport ? window.visualViewport.width  : root.clientWidth)  || window.innerWidth;
    const vh = (window.visualViewport ? window.visualViewport.height : root.clientHeight) || window.innerHeight;
    const sa = safe(), aw = Math.max(1, vw - sa.l - sa.r), ah = Math.max(1, vh - sa.t - sa.b);
    // contain-fit, scaling UP to fill the screen (no 1x cap, no margin) so a 16:9 viewport is covered edge-to-edge
    const s = Math.min(aw / 1333, ah / 750);
    root.style.setProperty("--scale", s);
    root.style.setProperty("--safe-dx", (sa.l - sa.r) / 2 + "px");   // centred in the safe area, not the whole screen
    root.style.setProperty("--safe-dy", (sa.t - sa.b) / 2 + "px");
    root.classList.toggle("bands-x", vw - 1333 * s > 1);              // (QA hooks: which bands the bleed fills)
    root.classList.toggle("bands-y", vh - 750 * s > 1);
    rotate(touch() && vh > vw * 1.1);
  }
  function rotate(on){
    if(on === asking) return;
    asking = on; root.classList.toggle("ask-rotate", on);
    try{                                                              // (voEl: the one VO element, below - not there yet on the first fit)
      if(on && !voEl.paused && !voEl.ended){ voEl.pause(); heldVO = true; }
      else if(!on && heldVO){ heldVO = false; voEl.play().catch(()=>{}); }
    }catch(e){}
  }
  /* a phone/tablet browser: full screen, landscape-locked where the browser can (Android Chrome). Called from a tap.
     Never on a desktop, inside an embedding page, or in a host app's WebView - those run the screen themselves. */
  function fullscreen(){
    try{
      const bridge = window.SwiftPAL && window.SwiftPAL._platform;
      if(!touch() || window.self !== window.top || (bridge && bridge !== "web") || /; wv\)/.test(navigator.userAgent)) return;
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      if(!req || document.fullscreenElement || document.webkitFullscreenElement) return;
      const lock = ()=>{ try{ screen.orientation.lock("landscape").catch(()=>{}); }catch(e){} };
      const p = req.call(root, { navigationUI: "hide" });
      if(p && p.then) p.then(lock, ()=>{}); else lock();
    }catch(e){}
  }
  /* the bands: 8 mirrored copies of the stage's own backdrop around it (index.html #stageBleed), kept in step with every
     change of it - a slide's data-bg and --horizon, the tutorial's white, the landing's and the end's transparency.
     While a hint card dims the stage, they dim with it (.dim). */
  function bleed(){
    bleedQueued = false;
    const st = document.getElementById("stage"), b = document.getElementById("stageBleed");
    if(!st || !b) return;
    /* (review 2026-10-07 "fix these line cuts": at a fractional --scale the stage's background COLOUR was painted to its
       very edge but its picture stopped short of the last device column, so the colour - the floor's, under every room
       picture - showed as a 1px line down the stage's right side. The colour now lies on an underlay 1px inside the
       stage (.stage-wrap.bg-under::before, --stage-bg) and the stage's own is transparent: the edge column is picture
       + band only. The wrap is not observed, so toggling its class to read the slide's colour starts no loop.) */
    const wrap = st.parentElement; wrap.classList.remove("bg-under");
    const cs = getComputedStyle(st), color = cs.backgroundColor;
    const css = "background-color:" + color + ";background-image:" + cs.backgroundImage + ";background-size:" + cs.backgroundSize +
                ";background-position:" + cs.backgroundPosition + ";background-repeat:" + cs.backgroundRepeat;
    wrap.style.setProperty("--stage-bg", color); wrap.classList.add("bg-under");
    if(b._css === css) return;
    b._css = css; b.dataset.bg = st.dataset.bg || "";
    for(const i of b.children) i.style.cssText = css;
  }
  function queueBleed(){ if(!bleedQueued){ bleedQueued = true; requestAnimationFrame(bleed); } }
  function watch(){
    const st = document.getElementById("stage");
    if(!st || !window.MutationObserver) return;
    const mo = new MutationObserver(queueBleed);
    mo.observe(st, { attributes: true, attributeFilter: ["class", "style", "data-bg"] });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const ra = document.getElementById("rotateAsk"); if(ra) ra.addEventListener("click", fullscreen);   // Android: the tap itself turns the screen
    queueBleed();
  }
  window.addEventListener("resize", fit);
  window.addEventListener("load", fit);
  if(window.visualViewport) window.visualViewport.addEventListener("resize", fit);
  fit(); watch();
  return { fit: fit, fullscreen: fullscreen, bleed: queueBleed };
})();

/* ---------- 2. SIGNAL BUS + OFFLINE TELEMETRY ---------- */
/* TELEMETRY: offline self-capture. Every signal is buffered to localStorage so
   the run survives a reload / works with NO host app. A full results record can
   be pulled via GameBus.downloadResults() (or the ?dev=1 button on the end
   screen). If `endpoint` is set AND the device is online, the final record is
   also POSTed — left null so the lesson is fully offline by default. */
const TELEMETRY = {
  endpoint: null,   // e.g. "https://lrs.example.com/swiftpal" — null = offline only
  storageKey: "swiftpal:run:" + CARD.skill_code + "_" + (CARD.part_label || "P1")
};
/* ===== QA CHECKLIST [14]: xAPI VERB LAYER =================================
   The engine emits 36 GameBus signals but none of the seven required xAPI
   verbs. This layer maps the ones that already have a signal and fires the
   rest explicitly. context echoes context_id / journey_id / medium straight
   off the launch URL and always carries skill_code. */
const XAPI = window.XAPI = (function(){
  var q; try{ q = new URLSearchParams(location.search); }catch(e){ q = { get:function(){ return null; } }; }
  var startedAt = Date.now();
  var ctx = { skill_code: CARD.skill_code, lo_code: CARD.lo_code,
              context_id: q.get("context_id"), journey_id: q.get("journey_id"),
              medium: q.get("medium") || CARD.medium || "hi" };
  /* [QA 14] question_format per answerable slide type (HI01's enum). */
  var QUESTION_FORMAT = { PV_SUB:"mcq", MENTAL_SUB:"mcq" };
  var log = [], fired = {};
  /* send(verb, object, result): builds the standard { verb, object, result, context } statement
     (HI01 shape) and hands it to the platform bridge - SwiftPAL.sendEvent -> Android / iOS / web.
     Falls back to a direct postMessage only if the bridge is absent (standalone dev).
     context echoes context_id / journey_id / medium off the launch URL, always carries skill_code,
     and on a slide-level verb adds question_id / question_index / template / question_format / phase. */
  function send(verb, object, result){
    var o = object || {}, sl = null;
    try{ if(o.slide_id) sl = CARD.slides.find(function(x){ return x.id === o.slide_id; }) || null; }catch(e){}
    var c = Object.assign({}, ctx, { session_ms: Date.now() - startedAt });
    if(sl){ Object.assign(c, { question_id: sl.id, question_index: CARD.slides.indexOf(sl), template: sl.type,
                               question_format: (sl.data && sl.data.answer === "numpad") ? "numeric_input" : (QUESTION_FORMAT[sl.type] || null), phase: sl.phase }); }
    var statement = { verb: verb, object: o, result: result || {}, context: c };
    log.push(Object.assign({ ts: Date.now() }, statement));
    try{
      if(window.SwiftPAL && typeof window.SwiftPAL.sendEvent === "function") window.SwiftPAL.sendEvent(statement);
      else window.parent && window.parent.postMessage({ type:"swiftpal:xapi", statement: statement }, "*");
    }catch(e){}
    try{ console.log("[xapi]", verb, statement); }catch(e){}
    return statement;
  }
  return { ctx:ctx, log:log, send:send,
           once:function(v,o,r){ if(fired[v]) return null; fired[v]=1; return send(v,o,r); },
           hasFired:function(v){ return !!fired[v]; } };
})();
/* signal -> verb, for the three that already have a 1:1 signal */
const XAPI_MAP = { slide_entered:"screen_viewed", hint_shown:"hint_used", audio_replay:"audio_replayed" };
const XAPI_ANSWERABLE = ["FIND_RHYME","RHYME_PICK","RHYME_YESNO","RHYME_BOXES"];   /* slide types that send question_started */

/* [QA 01] The game's internal bus is GameBus (window.GameBus). The global SwiftPAL name belongs to
   the platform bridge (swiftpal-bridge.js, loaded first), which XAPI.send() hands each statement to.
   This bus used to be called SwiftPAL itself, which took the name the host bridge needs. */
const GameBus = window.GameBus = {
  signals: [],
  validatorReport: { missing_signals: [], errors: [], passed: false },
  firedSet: new Set(),
  startedAt: Date.now(),
  emit(name, payload){
    const evt = Object.assign({
      ts: Date.now(),
      skill_code: CARD.skill_code,
      lo_code: CARD.lo_code,
      signal: name
    }, payload || {});
    this.signals.push(evt);
    this.firedSet.add(name);
    /* [14] fan the mapped signals out as xAPI verbs */
    /* a MANUAL hint_shown is a bulb tap, whose hint_used the capture listener on #hintBtn already
       sent - mapping it too would log the verb twice ([QA 14] no duplicated verbs). */
    /* [QA 14] one verb per screen, as HI01 does: an answerable slide sends question_started
       (mountSlide), everything else screen_viewed - never both for the same slide. */
    try{ if(XAPI_MAP[name] && !(name === "hint_shown" && payload && payload.manual)
            && !(name === "slide_entered" && payload && XAPI_ANSWERABLE.indexOf(payload.type) >= 0))
           XAPI.send(XAPI_MAP[name], { slide_id: payload && payload.slide_id }, payload || {}); }catch(e){}
    try{ console.log("[signal]", name, evt); }catch(e){}
    /* [QA 14] NOISE CONTROL (as HI01): the raw signal firehose is DEV-ONLY. Production hosts receive
       only the 7 xAPI verbs through the bridge. */
    if(new URLSearchParams(location.search).has("dev")){
      try{ window.parent?.postMessage({type:"swiftpal:signal", payload: evt}, "*"); }catch(e){}
    }
    this.persist();
  },
  /* full results record (used for download / POST / end-of-lesson dump) */
  exportResults(){
    const ms = (typeof state!=="undefined") ? state.masteryAttempts : 0;
    const mh = (typeof state!=="undefined") ? state.masteryHits : 0;
    return {
      skill_code: CARD.skill_code, lo_code: CARD.lo_code, part: CARD.part_label || null,
      started_at: this.startedAt, exported_at: Date.now(),
      mastery: { hits: mh, attempts: ms, score: ms ? mh/ms : 0 },
      validatorReport: this.validatorReport,
      signals: this.signals
    };
  },
  /* silent: flush the running buffer to localStorage (survives reload / offline) */
  persist(){
    try{ localStorage.setItem(TELEMETRY.storageKey, JSON.stringify(this.exportResults())); }
    catch(e){ /* private mode / quota — non-fatal, postMessage + memory still work */ }
  },
  /* pull the run as a JSON file (teacher/dev; not in the child's flow) */
  downloadResults(){
    try{
      const blob = new Blob([JSON.stringify(this.exportResults(), null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = CARD.skill_code + "_" + (CARD.part_label||"P1") + "_results.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=> URL.revokeObjectURL(url), 1000);
    }catch(e){ console.error("[telemetry] download failed", e); }
  }
};

/* ---------- 3. AUDIO ---------- */
let isPlaying=false, currentAudio=null;
function setPlaying(on){
  // the dynamic Swiftie sits header-left; the audio chips pulse to signal playback. r4/F1: share the
  // .playing toggle across the header chip AND the tut-card replay chip (the header is hidden in the
  // tut frame, so the in-card .tut-audio is the only visible affordance and must react to VO too).
  isPlaying=on;
  document.body.classList.toggle("vo-busy", !!on);   // user 2026-10-26: while a voice line plays nothing on the page takes a tap (style.css)
  bgmDuck();
  /* [QA 05] only the chip the audio is actually coming FROM animates, and only one at a time.
     It used to pulse every chip for every sound - option words, feedback, the count-aloud. */
  const src = on && currentAudio ? srcOf(currentAudio) : null;
  const from = on ? chipFor(src) : null;
  document.querySelectorAll(".audio-chip, .tut-audio, .sg-vo").forEach(c => c.classList.toggle("playing", c === from));
  if(typeof pvChipPaint === "function" && state && state.seqTalk) pvChipPaint();   // (the page still talking: the chip's pulse stays on)
  swApplyPose();   // freeze/unfreeze Swiftie's mouth: animate only while a clip is sounding
}
/* [QA 15] ONE reusable VO element, not a new Audio() per clip. Every clip used to get its own
   element and none was ever released: ~150 live media players by the last question, and the
   renderer crashed there on every full playthrough (Android WebViews cap players far lower).
   _playTok retires a superseded clip's callbacks, so a stopped clip can never fire onEnd late. */
const voEl = new Audio(); voEl.preload = "auto";
let _playTok = 0;
/* chipFor(src): the ONE chip a clip belongs to, or null. The landing greeting belongs to the
   landing chip; a slide's own lines (prompt / ask / conclude ...) to that slide's chip - the in-card
   tutorial chip when the tutorial frame is up, else the header chip. Feedback, option words and
   the count-aloud belong to no chip, so no chip moves for them. */
const _FEEDBACK_KEYS = { correct:1, try_again:1, hint:1, hint1:1, reveal:1, sfx:1 };
function chipFor(src){
  if(!src || typeof CARD === "undefined") return null;
  const gate = document.getElementById("startGate");
  if(gate && !gate.classList.contains("hidden")){
    const land = (CARD.assets && CARD.assets.audio && CARD.assets.audio.vo_landing) || "";
    return land && src.indexOf(land) >= 0 ? document.getElementById("sgVo") : null;
  }
  const sl = CARD.slides[state.idx];
  if(!sl || !sl.audio) return null;
  const own = Object.keys(sl.audio).some(k => !_FEEDBACK_KEYS[k] && src === audioFor(sl, k));
  if(!own) return null;
  return document.querySelector("#slideHost .tut-audio") || document.getElementById("audioChip");
}
/* [QA 11] replay-chip guard (HI01 [24a N8]): a replay tap while a clip is sounding is ignored.
   play() stops the current clip, and a paused clip never fires its end callback - so a replay
   mid-count froze DEMO_COUNT (आगे never unlocked) and mid-answer-word lost the auto-advance.
   The tap still reports audio_replayed (flagged ignored), so every tap is logged. */
function replayTap(slide, src){
  state.audioReplays++;
  const busy = isPlaying || state.speakerLive === false;
  GameBus.emit("audio_replay", { slide_id: slide ? slide.id : "landing", phase: slide ? slide.phase : "landing",
    count: state.audioReplays, src: src, ignored_while_playing: busy });
  return !busy;
}
function stopAudio(){
  _playTok++;
  if(currentAudio){ try{ currentAudio.pause(); }catch(e){} currentAudio=null; }
  setPlaying(false);
}
/* play(src, onEnd): real clip if the path exists; silent beat if missing/blocked. */
function play(src, onEnd){
  stopAudio(); setPlaying(true);
  const tok = _playTok;
  let done=false; const fire=()=>{ if(done || tok !== _playTok) return; done=true; currentAudio=null; setPlaying(false); if(onEnd) onEnd(); };
  if(src){
    const a = voEl; currentAudio = a;
    let retried = false;
    a.onended = fire;
    /* the clip's blob: copy failed (Assets): the file's own URL, once; anything else - a silent beat, then on */
    a.onerror = ()=>{ if(tok !== _playTok) return;
      if(!retried && /^blob:/.test(a.src)){ retried = true; a.src = src; a.play().catch(()=>{ if(tok === _playTok) setTimeout(fire, 1200); }); return; }
      setTimeout(fire, 1200); };
    a.setAttribute("data-asset", src);
    a.src = Assets.url(src); setPlaying(true);   // re-apply now the src is known, so the right chip lights
    a.play().catch(()=>{ if(tok === _playTok) setTimeout(fire, 1200); });
    /* WATCHDOG: whatever waits on this clip's end (आगे, the next line, the play button) can never be stranded by a clip
       that stalls mid-way or never reports `ended`: the clip's remaining length + 3s grace, re-armed while it is still
       really moving on. No length yet (metadata stuck): 15s. */
    let lastT = -1;
    const watch = ()=>{ if(done || tok !== _playTok) return;
      const left = isFinite(a.duration) && a.duration > 0 ? (a.duration - a.currentTime) / (a.playbackRate || 1) : 12;
      setTimeout(()=>{ if(done || tok !== _playTok) return;
        if(!a.paused && !a.ended && a.currentTime > lastT + 0.05){ lastT = a.currentTime; watch(); } else fire(); }, Math.max(0, left) * 1000 + 3000);
    };
    watch();
  } else { setTimeout(fire, 800); }
}
/* playSfx(id): fire-and-forget sound effect that can overlap the spoken VO (does NOT touch
   currentAudio / the play() chain). Two pooled elements, reused - never one per call.
   Silently no-ops if the file is missing or playback is blocked. */
const _sfxPool = [new Audio(), new Audio(), new Audio(), new Audio()]; let _sfxNext = 0;
function playSfx(id, onEnd){
  if(!id) return;
  try{
    const a = _sfxPool[_sfxNext++ % _sfxPool.length];
    a.pause(); a.volume = 0.7; a.onended = onEnd ? ()=>{ a.onended = null; onEnd(); } : null;
    const f = "assets/voiceover/" + id + "." + AUDIO_EXT;
    a.onerror = ()=>{ a.onerror = null; if(/^blob:/.test(a.src)){ a.src = f; a.play().catch(()=>{}); } };   // blob: copy failed - the file, once
    a.setAttribute("data-asset", f); a.src = Assets.url(f);
    a.play().catch(()=>{});
  }catch(e){}
}
/* ---------- game-feel: procedural SFX (no audio files) + success particle burst ----------
   WebAudio resumes on the first user tap (autoplay policy), so taps/answers always sound. */
let _juiceAC = null;
function _ac(){ if(!_juiceAC){ try{ _juiceAC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} }
  if(_juiceAC && _juiceAC.state === "suspended"){ try{ _juiceAC.resume(); }catch(e){} } return _juiceAC; }
function _tone(freqs, type, dur, vol){ const c = _ac(); if(!c) return; const t0 = c.currentTime;
  freqs.forEach((f, i)=>{ const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    const t = t0 + i*(dur/freqs.length); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur/freqs.length); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur/freqs.length); }); }
const sfxTap       = ()=> _tone([520], "sine", 0.09, 0.09);
/* ===== QA checklist 2026-10-05: the STANDARD SFX + background music, as files in assets/sfx/ =====
   sfx_correct / sfx_wrong (correct + incorrect feedback), sfx_confetti (with every confetti burst), sfx_play (the play
   button), sfx_nudge (a soft, encouraging chime with each nudge hand), bgm (the lesson's background track, from the play
   tap on) and bgm_game (the practice game's track - the lesson track carries on if it is not shipped). A file that
   is missing or blocked is silent; correct / wrong fall back to the old procedural tones so feedback is never mute. */
const SFX_DIR = "assets/sfx/";
function playSfxFile(name, vol, fallback){
  try{
    const a = _sfxPool[_sfxNext++ % _sfxPool.length];
    a.pause(); a.volume = vol == null ? 0.8 : vol;
    const f = SFX_DIR + name + "." + AUDIO_EXT;
    /* its blob: copy failed (Assets): the file's own URL, once; the file itself failed: the procedural fallback */
    a.onerror = ()=>{ if(/^blob:/.test(a.src)){ a.src = f; a.play().catch(()=>{}); return; } a.onerror = null; if(fallback) fallback(); };
    a.setAttribute("data-asset", f); a.src = Assets.url(f);
    a.play().catch(()=>{});
  }catch(e){ if(fallback) fallback(); }
}
const sfxCorrect   = ()=> playSfxFile("sfx_correct", 0.8, ()=> _tone([660, 880, 1180], "sine", 0.42, 0.13));
const sfxWrongSoft = ()=> playSfxFile("sfx_wrong", 0.6, ()=> _tone([300, 235], "triangle", 0.20, 0.08));   // gentle, never harsh
/* 2026-10-07: the team's Standard SFX pack (correct / incorrect / confetti / play / next). Its confetti is mastered
   ~8dB hotter than the kit's and lands on top of sfx_correct + the VO, so it plays lower to sit under them. */
const sfxConfetti  = ()=> playSfxFile("sfx_confetti", 0.45);
const sfxPlay      = ()=> playSfxFile("sfx_play", 0.9);
const sfxNext      = ()=> playSfxFile("sfx_next", 0.9);   // the आगे tap (a disabled आगे fires no click, so no sound)
const sfxNudge     = ()=> playSfxFile("sfx_nudge", 0.45);
/* background music: one looping element, started by the play tap (never before it), ducked under every VO clip,
   paused while the app is in the background. bgmFor(phase) picks the track: the practice game has its own. */
/* 2026-10-07: bgm.ogg is the team's "Standard Background Music 2" (bouncy, seamless 4-min loop; "1" is an 18s lo-fi loop
   that would repeat ~30x a lesson). Its quietness is BAKED INTO THE FILE (-33 LUFS, ~14.5dB under the VO's -18.5): iOS
   Safari ignores media .volume, so a loud file would play at full VO level there. VOL/DUCK only add the dip under VO
   (0.35 = -9dB, ~24dB under the voice); the dip is a short fade, not a jump, so the bed never pumps. */
var BGM = { el: null, track: "", VOL: 0.3, DUCK: 0.1, raf: 0 };   // user 2026-10-23: the music at 30 % (was 100 %); under the voice 0.1 (was .35 of 1 - the same dip)   // (var: setPlaying, above, may reach it)
function bgmDuck(){
  if(!BGM || !BGM.el) return;
  const el = BGM.el, from = el.volume, to = isPlaying ? BGM.DUCK : BGM.VOL, ms = to < from ? 180 : 600, t0 = performance.now();
  cancelAnimationFrame(BGM.raf);
  const step = now =>{ if(BGM.el !== el) return; const k = Math.max(0, Math.min(1, (now - t0) / ms));   // (a frame's timestamp can be a little BEFORE t0: k < 0 set volume > 1 and threw - BGM duck clamp
    el.volume = from + (to - from) * k; if(k < 1) BGM.raf = requestAnimationFrame(step); };
  BGM.raf = requestAnimationFrame(step);
}
function bgmFor(phase){
  const want = phase === "practice" ? "bgm_game" : "bgm";
  if(!BGM.el || BGM.track === want) return;
  bgmPlay(want, ()=>{ if(want !== "bgm" && BGM.track !== "bgm") bgmPlay("bgm"); });          // no game track shipped: keep the lesson one
}
function bgmPlay(track, onMissing){
  /* only a track that ships (ASSET_SIZES = the files on disk): bgm.ogg / bgm_game.ogg are not in this lesson yet, and
     asking for them was a 404 on every play tap. Drop a file into assets/sfx/ and run tools/gen_asset_sizes.js. */
  if(!Object.prototype.hasOwnProperty.call(ASSET_SIZES, SFX_DIR + track + "." + AUDIO_EXT)){ if(onMissing) onMissing(); return; }
  try{
    const old = BGM.el; if(old){ old.pause(); old.onerror = null; }
    const a = new Audio(); a.loop = true; a.preload = "auto";
    a.onerror = ()=>{ a.onerror = null; if(BGM.el === a && onMissing) onMissing(); };
    a.src = Assets.url(SFX_DIR + track + "." + AUDIO_EXT);
    a.volume = isPlaying ? BGM.DUCK : BGM.VOL;   // start at the right level - a new track never fades in from 1
    BGM.el = a; BGM.track = track; bgmDuck();
    a.play().catch(()=>{});
  }catch(e){}
}
function bgmStart(){ if(!BGM.el) bgmPlay("bgm"); }
/* (the music pauses / resumes with the rest of the game while the page is hidden: GamePause, at the top) */
/* dynamic Swiftie buddy: swap pose + a little pop on every reaction (correct/wrong/explain/celebrate) */
// [20a mascot-01] moods -> production EXPRESSIONS (head webp), not idle-gif basenames.
//   Ported verbatim from HI01H01_L02_S04_dist (its app lines 2474-2493) together with the
//   .mascot-wrap > .mascot-circle > .mascot-img markup. The old sw_anim_*.gif scheme and the
//   isPlaying mouth-coupling go with it - heads are now driven by setSwMood alone.
const SW_POSE = { talk:"talking", point:"talking", idle:"talking", happy:"celebrate", celebrate:"celebrate",
                  hint:"hint", teach:"hint", idea:"hint", tryagain:"tryagain" };
const SW_STILL = (() => { try { const q=new URLSearchParams(location.search);
  return q.has("still") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch(e){ return false; } })();
let swMood = "point", _celebUrl = "", _celebKey = null;
function swApplyPose(){ /* [20a] retired: heads no longer couple to isPlaying (setSwMood drives them). */ }
function setSwMood(m){ swMood = m;
  const img = document.getElementById("swBuddyImg"), w = document.getElementById("swBuddy");
  if(!img) return;
  const expr = SW_POSE[m] || "talking";
  const animated = expr !== "talking" && !SW_STILL;   // resting face is the static talking head
  img.onerror = () => { img.onerror = null; img.src = "assets/mascot.webp"; };   // [mascot-10]
  const src = "assets/" + (animated ? "gif/" : "") + "sw_head_" + expr + (animated ? "_anim" : "") + ".webp";
  /* [mascot-08] replay play-once: a slide's first cheer plays from frame 0 - a fresh blob: URL of the one download
     ([loading]: it was "?r=<slide start>", a new 380KB download on every slide that cheered) */
  if(animated && expr === "celebrate"){
    if(_celebKey !== state.slideStart){ if(_celebUrl.indexOf("blob:") === 0) URL.revokeObjectURL(_celebUrl);
      _celebUrl = Assets.fresh(src); _celebKey = state.slideStart; }
    img.src = _celebUrl;
  } else img.src = src;
  if(w){ w.dataset.expr = expr; w.classList.toggle("anim", animated);
         w.classList.remove("react"); void w.offsetWidth; w.classList.add("react"); } }   // .react pop kept from MTG
/* ===== FLN ANIMATION KIT: confetti (call site) BEGIN =====
   Recipe 7 REPLACES the correct-answer celebration rather than tuning it, so the
   two-sided .conf-shot cannon below is retired to _confettiCannonOld. The kit
   gates itself to guided/practice/mastery, so the phase of the live slide is
   passed through; in tutorial the tile-level confirm (recipe 19) is the feedback.
   The old function is kept, unreferenced, so the change is reversible in one line. */
function confettiCannon(){
  var sl = CARD.slides[state.idx] || {};
  /* [13] the kit's recipe 7 with its own shapes (star 40%, rectangle, line, square), sizes, depth and fall - review
     2026-09-30: "all square-shaped and not covering the full horizontal space". It falls over the WHOLE window
     (#fxLayer, body-level: the stage is letterboxed and clips at its edges), so ~100 pieces keep the density of the
     kit's 80 across the wider field. phases:[] because the checklist asks for confetti on every correct answer,
     including tutorial. The palette is the kit's own VIBGYOR pairs. */
  /* fall: seconds to cross the window, before the depth divisor - the kit's [1.1, 1.8] made ~40% slower (review
     2026-09-30: "reduce its speed a bit"); pieces cross in ~1.4-3.5s, the burst clears in ~3.8s */
  FLNMotion.confetti.burst({
    host: "#fxLayer", phase: sl.phase, phases: [], count: 100, fall: [1.6, 2.6]
  });
  sfxConfetti();   // QA checklist 2026-10-05: the standard confetti SFX with the standard confetti
}
// pitch climbs one step per block — HEAR the count
/* slide audio path: per slide, we look at slide.audio.prompt / .phoneme / etc.
   In this v0.1 the embedded card holds short ids; the compiler would replace
   them with base64 data URIs. We resolve to assets/voiceover/{id}.mp3 with fallback. */
function audioFor(slide, key){
  if(!slide.audio || !slide.audio[key]) return null;
  return "assets/voiceover/" + slide.audio[key] + "." + AUDIO_EXT;
}
/* Play a SEQUENCE of audio sources back-to-back. Each one finishes (or
   falls back to silent beat if missing) before the next starts. */
function playChain(srcs, i, onDone){
  i = i || 0;
  if(i >= srcs.length){ if(onDone) onDone(); return; }
  play(srcs[i], () => playChain(srcs, i+1, onDone));
}
/* On slide mount, play prompt → phoneme/word_name → instruction in order.
   KG learners can't read prompt_hi — the chain gives them both the
   instruction AND the cue (letter sound or picture name) audibly.
   onDone fires after the whole chain finishes (used to gate the नav button). */
function autoPlayChain(slide, onDone){
  const order = ["prompt","phoneme","shape_name","word_name","instruction"];
  const chain = [];
  for(const k of order){
    const src = audioFor(slide, k);
    if(src) chain.push(src);
  }
  if(chain.length) playChain(chain, 0, onDone);
  else if(onDone) onDone();
}

/* nav button: enable/disable the kit-style pill. When it becomes active (the
   activity is done) but the child doesn't tap आगे, the hand-nudge points at it. */
function setNavActive(on){
  const btn = $("navBtn");
  btn.disabled = !on;
  btn.classList.toggle("active", on);
  /* user 2026-10-26 (page 1: the "?" and the next button pulsed together) - as HI02H11_L02_S02's r138: while the VISIBLE next
     button pulses, every other animation on the page is stopped (.nav-live in the styles) */
  document.body.classList.toggle("nav-live", !!on && btn.style.display !== "none");
  clearTimeout(state.navNudgeTimer);
  if(on) state.navNudgeTimer = setTimeout(nudgeNavBtn, 4500);
}
function nudgeNavBtn(){
  /* [04] QA CHECKLIST: "Nudge hand only ever points at interactive tiles/objects
     - never at आगे, शुरू करें, or any other button." This pointed it straight at
     #navBtn, so it is now a no-op. Kept as a function because setNavActive()
     schedules it and several modules clear its timer. */
  return;
  /* eslint-disable no-unreachable */
  const btn = $("navBtn");
  if(!btn.classList.contains("active") || state.hintActive) return;
  const nh = $("nudgeHand");
  const r = btn.getBoundingClientRect();
  const sw = document.querySelector(".slide-stage").getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  nh.style.left = ((r.left - sw.left)/scale + r.width/scale/2 - 48) + "px";
  nh.style.top  = ((r.top  - sw.top )/scale + r.height/scale/2 - 6) + "px";
  nh.classList.add("show");
}

/* ---------- 4. STATE ---------- */
const state = {
  idx: 0,
  slideStart: Date.now(),
  attempts: 0,
  audioReplays: 0,
  hintUsed: false,
  nudgeUsed: false,
  scaffoldLevel: 0,   // 0 none, 1 nudge, 2 hint, 3 reveal
  selectedKey: null,
  locked: false,
  hintActive: false,
  masteryHits: 0,
  masteryAttempts: 0,
  nudgeTimer: null
};
/* [QA 06] SCORE = first-try correctness over every ANSWERABLE question (guided + practice here).
   It used to count only phase==="mastery" slides - this card has none, so hits/attempts stayed
   0/0 and every run scored 0. recordResult() is called once per question when it resolves
   (right tap, or the reveal), from COUNT_HOW_MANY and MAKE_SET alike; a slide can only be
   scored once, so a replayed/re-entered slide can never be double-counted (no off-by-one). */
function recordResult(slide, firstTry){
  state.scored = state.scored || {};
  if(!slide || Object.prototype.hasOwnProperty.call(state.scored, slide.id)) return;
  state.scored[slide.id] = !!firstTry;
  state.masteryAttempts++; if(firstTry) state.masteryHits++;
}

/* ---------- 5. NUDGE ----------
   target may be a CSS selector OR an element. Used ONLY for flow guidance
   (e.g. the "listen" button / prompt) — never to point at the correct answer. */
/* QA checklist 2026-10-05: "inactivity nudges are activated after 7 seconds" - one value for every idle nudge in the
   lesson (the card's nudge_timeout_ms, per phase, says the same) */
const IDLE_MS = 7000;
function startNudge(slide, target){
  clearTimeout(state.nudgeTimer);
  if(!target) return;
  const ms = (CARD.scaffold_rules.nudge_timeout_ms || {})[slide.phase] || IDLE_MS;
  if(!ms) return;
  state.nudgeTimer = setTimeout(()=>{
    if(state.locked || state.hintActive) return;
    const el = (typeof target === "string") ? document.querySelector(target) : target;
    if(!el) return;
    if(!placeNudge(el)) return;
    state.nudgeUsed = true;
    state.scaffoldLevel = Math.max(state.scaffoldLevel, 1);
    GameBus.emit("nudge_invoked", { slide_id: slide.id, phase: slide.phase });
  }, ms);
}
function stopNudge(){
  clearTimeout(state.nudgeTimer);
  $("nudgeHand").classList.remove("show");
}
/* [QA 12] THE HAND SITS BELOW ITS TARGET, NEVER ON IT, NEVER ON A BUTTON.
   #nudgeHand is 86x108 and nudge_hand_new.svg (75x94) fills it at scale 1.1467, which puts the
   fingertip at (34.2, 15.8) inside the box (kit recipe 4 geometry). The old code dropped the box
   -56px / -30px INTO the target, i.e. the fingertip 24-50px inside the tile and the hand over it.
   Now the FINGERTIP lands 8px below the target's bottom edge, and, as HI01 [28j] does, below any
   label text sitting under the target in the same column. It is clamped inside the stage
   (never flipped above - it points UP, so above a target it would point away), and if the box
   would still overlap any button other than its own target it is not shown at all.
   References .slide-stage (the nudge's positioning context), not .stage (~140px header off). */
const NH = { W:86, H:108, TIP_X:34.2, TIP_Y:15.8, GAP:8 };
function placeNudge(el){
  const nh = $("nudgeHand"), host = document.querySelector(".slide-stage");
  if(!el || !nh || !host || !el.getBoundingClientRect) return false;
  const r = el.getBoundingClientRect(), sw = host.getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  const cx = (r.left - sw.left)/scale + r.width/scale/2;
  let tipY = (r.bottom - sw.top)/scale + NH.GAP;
  const tile = el.closest(".opt-cell, .count-item, .ms-item, .q-cell, .tut-card") || el.parentElement;
  if(tile){
    tile.querySelectorAll(".lbl, .opt-label, .count-badge, .pic-label").forEach(t => {
      const tr = t.getBoundingClientRect();
      if(tr.width < 2 || tr.height < 2 || tr.right < r.left || tr.left > r.right) return;
      const tb = (tr.bottom - sw.top)/scale + NH.GAP;
      if(tb > tipY) tipY = tb;
    });
  }
  const stageW = sw.width/scale, stageH = sw.height/scale;
  const left = Math.max(0, Math.min(stageW - NH.W, cx - NH.TIP_X));
  const top  = Math.max(0, Math.min(stageH - NH.H, tipY - NH.TIP_Y));
  nh.style.left = left + "px"; nh.style.top = top + "px";
  // never covering a button: test the hand's final box against every button except its target
  const hr = { l: sw.left + left*scale, t: sw.top + top*scale, r: sw.left + (left + NH.W)*scale, b: sw.top + (top + NH.H)*scale };
  /* A button in the hand's box: the hand is CUT OFF 4px above that button's top edge (clip-path),
     so it reads as tucked behind the button and never draws over it. On the tutorial slides आगे
     sits right under the unit row, so a plain "hide if it overlaps" rule hid the tutorial hand
     entirely. If the cut would leave less than 40% of the hand (fingertip + finger), it is hidden. */
  let cutTop = Infinity;
  [...document.querySelectorAll("button, .nav-btn, .audio-chip, .tut-audio, .hint-btn")].forEach(b => {
    if(b === el || b.contains(el) || el.contains(b)) return;
    const br = b.getBoundingClientRect();
    if(br.width < 2 || br.height < 2 || getComputedStyle(b).visibility === "hidden") return;
    if(br.left < hr.r && br.right > hr.l && br.top < hr.b && br.bottom > hr.t) cutTop = Math.min(cutTop, br.top);
  });
  nh.style.clipPath = "";
  if(cutTop !== Infinity){
    const keep = (cutTop - 4 - hr.t) / scale;                 // design px of the hand left visible
    if(keep < NH.H * 0.4){ nh.classList.remove("show"); return false; }
    /* only the BOTTOM is cut: the tap ripple (kit recipe 4) spreads up to ~55px above and around the box */
    nh.style.clipPath = "inset(-60px -60px " + Math.max(0, NH.H - keep).toFixed(1) + "px -60px)";
  }
  if(!nh.classList.contains("show")) sfxNudge();   // QA checklist 2026-10-05: an encouraging SFX with every nudge
  nh.classList.add("show");
  return true;
}

/* ---------- 8. TAP-OPTION HELPER (shared by 5 slide types) ---------- */
function mountTapOptions({slide, host, signalName, stimulus, options, isCorrect, optionRenderer, columnsHint, mastery, hintAction, nudgeTarget, shuffle, onCorrect, onWrong, reask}){
  state.attempts = 0; state.selectedKey = null; state.locked = false;
  state.audioReplays = 0; state.hintUsed = false; state.nudgeUsed = false; state.scaffoldLevel = 0;
  // idle hand-nudge target: defaults to the stimulus (re-listen), but a slide can pass
  // nudgeTarget:null to suppress it entirely (e.g. "how many?" — nothing to re-tap).
  const _nudge = (nudgeTarget !== undefined) ? nudgeTarget : (stimulus || null);
  // optional custom hint (runs on the live slide instead of a text popup), e.g. a
  // count-demonstration. Wrapped to block option taps while it plays.
  const runHint = hintAction ? (after)=>{ state.hintActive = true; hintAction(()=>{ state.hintActive = false; if(after) after(); }); } : null;

  // Shuffle options once so the correct answer isn't pinned to one position (engine-wide anti
  // positional-bias — otherwise "always tap the same spot" can pass mastery). Opt out with
  // shuffle:false for inherently-ordered options (e.g. a number line).
  const _opts = (shuffle === false) ? options.slice()
    : (function(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; })(options);

  const wrap = document.createElement("div"); wrap.className = "q-row";
  if(stimulus){ wrap.appendChild(stimulus); }
  const grid = document.createElement("div");
  const cols = columnsHint || (_opts.length <= 2 ? 2 : _opts.length <= 3 ? 3 : 4);
  grid.className = "opt-grid cols-" + cols;
  _opts.forEach((opt, i) => {
    const cell = optionRenderer(opt, i);
    cell.classList.add("opt-cell");
    cell.dataset.key = String(i);
    cell.onclick = ()=>{
      /* [10] a wrong card must stay tappable - the .crossed early-return is gone.
         .correct still blocks, because the slide is locked once it is answered. */
      if(state.locked || state.hintActive || cell.classList.contains("correct")) return;
      stopNudge();
      // SME rule: SPEAK THE TAPPED WORD on EVERY tap (right or wrong), then the feedback — never two
      // voices at once (buzz/confetti are sfx, they ride alongside the word). opt.audio = word clip id.
      // Fallback wiring for LETTER options (SME: the tapped item's own sound speaks EVERYWHERE): options
      // authored as {letter:"आ"} carry no audio id, but the slide's data.phonemes map has each letter's
      // clip — derive it here centrally so every TAP_LETTER_* / mastery module inherits speak-on-tap
      // without per-module or per-card changes. Explicit opt.audio always wins.
      const _aid = opt.audio ||
                   (opt.letter && slide.data && slide.data.phonemes && slide.data.phonemes[opt.letter]) || null;
      const _word = _aid ? ("assets/voiceover/" + _aid + "." + AUDIO_EXT) : null;
      const _afterWord = (cb)=>{ if(_word) play(_word, cb); else cb(); };
      if(isCorrect(opt, i)){
        state.locked = true; cell.classList.add("correct"); FLNMotion.correctSelect.play(cell);
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase },
             { is_correct:true, attempt: state.attempts + 1, score: state.attempts === 0 ? 1 : 0 }); }catch(e){}   /* kit recipe 19 - tile-level confirm; runs WITH the confetti, not instead of it */
        sfxCorrect(); confettiCannon(); setSwMood("happy");
        if(onCorrect) onCorrect(opt, cell);      // [kit] slide-level flourish (e.g. the result plate)
        recordResult(slide, state.attempts === 0);   // [QA 06] every answerable slide scores, not only "mastery"
        GameBus.emit(signalName, { slide_id: slide.id, phase: slide.phase, value: true,
          first_try: state.attempts === 0, attempts: state.attempts + 1,
          scaffold_level: state.scaffoldLevel, latency_ms: Date.now()-state.slideStart });
        _afterWord(()=> setTimeout(()=> completeSlide(true), 700));   // speak the word → then advance (confetti is the reward)
      } else {
        state.attempts++; cell.classList.add("crossed");
        /* [10] QA CHECKLIST: the wrong card auto-reverts after ~900ms and STAYS
           TAPPABLE, so this is the kit's transient .play() (release), no longer
           .out() (elimination). .play() releases at dur*1500+40 then fades over
           260ms = ~900ms at the default .4s beat, which is the spec figure.
           The .crossed class is left on only so existing logic still reads it;
           its dim/lock/cross are neutralised in style.css. */
        FLNMotion.wrongSelect.play(cell, { then: function(){ cell.classList.remove("crossed"); } });
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase },
             { is_correct:false, attempt: state.attempts, score: 0 }); }catch(e){}
        sfxWrongSoft(); setSwMood("tryagain");
        if(onWrong) onWrong(opt, cell);          // [kit] slide-level cue (e.g. gap vs overlap)
        // (do NOT count masteryAttempts here — the correct branch counts one attempt PER ITEM.)
        GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
        // LAYERED SCAFFOLD (A1): L1 re-listen → L2 hint → L3 REVEAL at max_attempts (never stuck).
        const _maxA = (CARD.scaffold_rules && CARD.scaffold_rules.max_attempts) || 3;
        $("hintBtn").classList.add("show","hint-glow");
        _afterWord(()=>{   // speak the tapped word FIRST, then the layered feedback VO (no overlap)
          if(state.attempts >= _maxA){ revealAnswer("wrong"); }
          else if(state.attempts >= 2){ state.scaffoldLevel = Math.max(state.scaffoldLevel, 2);
            GameBus.emit("hint_shown", { slide_id: slide.id, manual: false });   // [QA 14] auto hint -> hint_used
            if(runHint) runHint(); else play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); }
          else { state.scaffoldLevel = Math.max(state.scaffoldLevel, 1);
            /* [QA 05] rung 1 = RE-LISTEN: the try-again line, then the question itself again
               (reask:false = the try-again line only, where the deck's incorrect feedback is just that line) */
            play(audioFor(slide, "try_again") || null, ()=>{ if(reask !== false && !state.locked && !state.hintActive) play(audioFor(slide, "prompt") || null, ()=>{}); }); }
        });
      }
    };
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);
  host.appendChild(wrap);

  // ---- layered-hint helpers (A1/B2): reveal-on-max + a wired manual hint button ----
  function _correctCell(){ return [...grid.querySelectorAll(".opt-cell")].find(c => isCorrect(_opts[+c.dataset.key], +c.dataset.key)); }
  function revealAnswer(reason){
    if(state.locked) return; state.locked = true; state.scaffoldLevel = 3; setSwMood("hint");
    const el = _correctCell();
    [...grid.querySelectorAll(".opt-cell")].forEach(c => { if(c !== el) c.classList.add("faded"); });
    if(el) el.classList.add("correct", "ck-correct", "reveal-pulse");   // [QA 10] the spec green border, never the tick badge
    recordResult(slide, false);
    GameBus.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts, reason });
    play(audioFor(slide, "reveal") || audioFor(slide, "correct") || audioFor(slide, "try_again") || null,
      ()=> setTimeout(()=> completeSlide(false), 800));
  }
  $("hintBtn").onclick = ()=>{ if(state.locked || state.hintActive) return;
    state.hintUsed = true; if(state.attempts < 1) state.attempts = 1;
    GameBus.emit("hint_shown", { slide_id: slide.id, manual: true });
    if(runHint) runHint(); else play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); };

  startNudge(slide, _nudge);
  // Tap-to-answer standard (lead review): a WRONG tap = soft buzz + ✕ + that card LOCKS (can't re-tap);
  // a RIGHT tap = confetti cannons + Swiftie cheer, then auto-advance. No select-then-आगे for pick questions.
  $("navBtn").style.display = "none"; setNavActive(false);
}

/* ---------- 10. RENDER HELPERS ---------- */
/* Render a picture as the real PNG (assets/<key>.png); if the file is
   missing it falls back to the emoji. Pass the image id (e.g. "pic_anaar"). */
function imgOrEmoji(imgKey, emoji, imgClass, emojiClass){
  if(imgKey){
    const fb = String(emoji||"❓").replace(/'/g,"");
    return `<img class="${imgClass}" src="assets/${imgKey}.${IMG_EXT}" alt="" `+
      `onerror="var s=document.createElement('span');s.className='${emojiClass}';s.textContent='${fb}';this.replaceWith(s);">`;
  }
  return `<span class="${emojiClass}">${emoji||"❓"}</span>`;
}
/* ordering/seriation render (MTKGA02_L02_S02): an object at a given magnitude. by="size" scales the
   picture uniformly; by="length" draws a content-true rounded bar of width∝mag; by="weight" shows the
   picture at a uniform size (weight is not visual — the child uses known heaviness / the balance cue). */
function imgOrEmojiSized(img, emoji, px){
  const fb = String(emoji||"❓").replace(/'/g,"");
  if(img) return `<img class="ord-obj-img" style="width:${px}px;height:${px}px" src="assets/${img}.${IMG_EXT}" alt="" `+
    `onerror="var s=document.createElement('span');s.className='ord-obj-emoji';s.style.fontSize='${Math.round(px*0.82)}px';s.textContent='${fb}';this.replaceWith(s);">`;
  return `<span class="ord-obj-emoji" style="font-size:${Math.round(px*0.82)}px">${emoji||"❓"}</span>`;
}
function renderOrdObj(o, by){
  if(by === "length"){ const w = {1:130,2:210,3:300}[o.mag] || 200;
    return `<div class="ord-bar" style="width:${w}px;background:${o.color||"#F5A623"}"></div>`; }
  // size AND weight scale the picture by visual magnitude — so a BIG-but-LIGHT balloon looks big and
  // tempts the child (bigger=heavier misconception), while the small stone is the correct heaviest pick.
  const px = {1:80, 2:116, 3:154}[o.mag] || 116;
  return imgOrEmojiSized(o.img, o.emoji, px);
}

/* shape helpers (maths): render circle/square/triangle/rectangle as inline SVG in
   any colour / size / rotation (LO: recognise regardless of orientation or size).
   No image assets needed — shapes are pure geometry, so the sample renders offline. */
function shapeSVG(shape, opts){
  opts = opts || {};
  const color = opts.color || "#386AF6";
  const size  = opts.size  || 120;
  const rot   = opts.rotate || 0;
  let inner = "";
  if(shape === "circle")         inner = `<circle cx="50" cy="50" r="42" fill="${color}"/>`;
  else if(shape === "square")    inner = `<rect x="12" y="12" width="76" height="76" rx="0" fill="${color}"/>`;   // TRUE corners — teachable geometry is never rounded
  else if(shape === "triangle")  inner = `<polygon points="50,9 91,89 9,89" fill="${color}"/>`;
  else if(shape === "rectangle") inner = `<rect x="6" y="28" width="88" height="44" rx="0" fill="${color}"/>`;    // TRUE corners
  const g = rot ? `<g transform="rotate(${rot} 50 50)">${inner}</g>` : inner;
  return `<svg class="shape-svg" viewBox="0 0 100 100" width="${size}" height="${size}" `+
         `xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
}

/* VISUAL-FIRST quantity: a HAND showing n fingers up (assets/hand_1..5) — pre-reader,
   NO number-word text. Falls back to the numeral only if n is outside 1..5 or the art is missing. */
function fingerCount(n, cls){ cls = cls || "finger-hand";
  if(!(n>=1 && n<=5)) return `<span class="num-glyph">${n}</span>`;
  return `<img class="${cls}" src="assets/hand_${n}.png" alt="" ` +
    `onerror="var s=document.createElement('span');s.className='num-glyph';s.textContent='${n}';this.replaceWith(s);">`;
}
/* DISPLAY numeral: ALWAYS Arabic (1 2 3) on screen — kids learn the universal digit.
   Spoken VO stays Hindi (एक/दो/तीन) via the separate vo_num_/vo_total_ audio files. */
function devNumeral(n){ return String(n); }

/* ---------- 10b. DEVANAGARI GLYPH INK-CENTERING ----------
   Devanagari glyphs carry matras above (ओ, औ, अं) and below (ऋ) the shirorekha,
   so plain flex `align-items:center` leaves them sitting high with a gap below —
   and the offset differs per glyph. Measure each glyph's real ink box (canvas
   actualBoundingBox) + its baseline in the DOM, then translateY so the INK is
   truly centred in its tile/box. Font-agnostic; recomputed on mount + fonts.ready. */
let _inkCtx = null;
function centerInkGlyph(span){
  if(!span || !span.parentElement) return;
  const glyph = (span.textContent || "").trim();
  if(!glyph) return;
  const box = span.parentElement;
  const cs = getComputedStyle(span);
  const fpx = parseFloat(cs.fontSize);
  if(!fpx) return;
  _inkCtx = _inkCtx || document.createElement("canvas").getContext("2d");
  _inkCtx.font = `${cs.fontWeight} ${fpx}px ${cs.fontFamily}`;
  const m = _inkCtx.measureText(glyph);
  const a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
  if(!isFinite(a) || !isFinite(d)) return;
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  span.style.transform = "";   // reset before measuring baseline
  const probe = document.createElement("span");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;";
  span.appendChild(probe);
  const baseScreen = probe.getBoundingClientRect().top;
  span.removeChild(probe);
  const br = box.getBoundingClientRect();
  if(br.height < 5) return;    // not laid out yet
  const boxCenter = br.top + br.height/2;
  const inkCenter = baseScreen + ((d - a)/2) * scale;   // screen px
  const dy = (boxCenter - inkCenter) / scale;           // css px to move glyph down
  span.style.transform = `translateY(${dy}px)`;
}
function centerAllGlyphs(root){
  (root || document).querySelectorAll(".ink-glyph").forEach(centerInkGlyph);
}


/* ---------- 12. SLIDE MODULES ---------- */
/* ---------- [jalebi] HI02H04_L03_S02 जलेबी - the lesson's own screens on MTG2A01_L04_S01's shell (user 2026-11-03:
   "follow the same structure in all the files"). The shell is File6's, unchanged: landing, header band + Swiftie, the
   tutorial frame, the yellow → button, the phase gates, confetti, the nudge hand, the end screen, the dev menu. These
   modules are the deck's pages (HI02H04_L03_S02_review(Updated).pptx); CSS [jalebi].
   JK = the page kit (as File6's PVK.ctx): a page's run context - its VO one line at a time, cues fired as the line reaches
   them, waits that end when the page is left - the speaker rule, and the shell's shake / glow / pop. ---------- */
/* the idle hand TOUCHES what it points at (File6, user 2026-10-15): the fingertip lands on the target's lower part */
placeNudge = (function(base){
  return function(el){
    const nh = $("nudgeHand"), host = document.querySelector(".slide-stage");
    if(!el || !nh || !host || !el.getBoundingClientRect) return base(el);
    const r = el.getBoundingClientRect(), sw = host.getBoundingClientRect();
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
    const w = r.width / scale, h = r.height / scale, cx = (r.left - sw.left) / scale + w / 2;
    const tipY = (r.top - sw.top) / scale + h - Math.min(h * 0.35, 26);
    const stageW = sw.width / scale, stageH = sw.height / scale;
    nh.style.left = Math.max(0, Math.min(stageW - NH.W, cx - NH.TIP_X)) + "px";
    nh.style.top = Math.max(0, Math.min(stageH - NH.H, tipY - NH.TIP_Y)) + "px";
    nh.style.clipPath = "";
    if(!nh.classList.contains("show")) sfxNudge();
    nh.classList.add("show");
    return true;
  };
})(placeNudge);
/* File6's small WebAudio sounds (throttled): tap - a button; appear - something comes in; move - a page slides */
const PVSFX = (function(){
  const last = {}, ok = (k, ms)=>{ const t = performance.now(); if(last[k] && t - last[k] < ms) return false; last[k] = t; return true; };
  function tone(f0, f1, dur, vol, type, at){ const c = _ac(); if(!c) return; const t0 = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.03); }
  function noise(dur, f0, f1, vol, type, at){ const c = _ac(); if(!c) return; const t0 = c.currentTime + (at || 0), n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0); for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = type || "bandpass"; f.Q.value = 1.1;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * .25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(t0); s.stop(t0 + dur + 0.02); }
  return {
    tap(){ if(!ok("tap", 40)) return; tone(1500, 950, .05, .13, "triangle"); noise(.03, 3400, 2600, .12); },
    appear(){ if(!ok("appear", 55)) return; tone(240, 560, .11, .16, "sine"); tone(480, 1120, .09, .05, "triangle", .01); },
    move(){ if(!ok("move", 150)) return; noise(.22, 700, 2300, .09, "bandpass"); }
  };
})();
const JK = (function(){
  const reduce = ()=> !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const wait = ms => new Promise(r => setTimeout(r, reduce() ? Math.min(ms, 60) : ms));
  const src = id => id ? "assets/voiceover/" + id + "." + AUDIO_EXT : null;
  function add(parent, tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls;
    if(html != null) e.innerHTML = html; if(parent) parent.appendChild(e); return e; }
  /* the pop-in plays once and its class goes (File6 PVK.pop) */
  function pop(e){ if(!e) return; e.classList.remove("pv-pop"); void e.offsetWidth; e.classList.add("pv-pop");
    const end = ev =>{ if(ev.animationName !== "pvPop") return; e.removeEventListener("animationend", end); e.classList.remove("pv-pop"); };
    e.addEventListener("animationend", end); }
  /* the kit's lateral buzz (recipes 11/20): +-9px decaying, .4s, on `translate` */
  function shake(el, amp){ if(!el || reduce()) return; const a = amp || 9;
    el.animate([{ translate: "0 0" }, { translate: -a + "px 0" }, { translate: a + "px 0" }, { translate: -a * .67 + "px 0" },
                { translate: a * .67 + "px 0" }, { translate: "0 0" }], { duration: 400, easing: "ease-in-out" }); }
  /* the kit's hint glow (recipe 12): a green ring, three soft pulses */
  function softGlow(el){ if(!el) return null;
    return el.animate([{ boxShadow: "0 0 0 0 rgba(0,177,50,0), 0 0 0 0 rgba(0,177,50,0)" },
                       { boxShadow: "0 0 0 8px rgba(0,177,50,.32), 0 10px 26px rgba(0,177,50,.34)" },
                       { boxShadow: "0 0 0 0 rgba(0,177,50,0), 0 0 0 0 rgba(0,177,50,0)" }],
                      { duration: 1100, iterations: reduce() ? 1 : 3, easing: "ease-in-out" }); }
  /* where each word of a line is said, as fractions of its clip: by the words' length (spaces + danda as short beats),
     inside the clip's lead and tail */
  function wordFracs(words){
    const w = words.map(t => t.replace(/[।,!?]/g, "").length + 1), tot = w.reduce((a, b)=> a + b, 0) || 1;
    let acc = 0; return w.map(x =>{ const f = .08 + .82 * acc / tot; acc += x; return f; });
  }
  function ctx(slide, root){
    const STOP = {};
    const C = { slide, root, STOP, cur: null, seq: false, waits: [],
      alive: ()=> CARD.slides[state.idx] === slide && root.isConnected,
      guard(){ if(!C.alive()) throw STOP; },
      has: role => !!audioFor(slide, role),
      wait: ms => wait(ms).then(()=> C.guard()),
      say(role, cues){ return C.clip(audioFor(slide, role), cues, role); },
      sayId(id, cues){ return C.clip(src(id), cues, null); },
      clip(s, cues, role){
        cues = (cues || []).filter(c => c && c[0] != null && isFinite(c[0])).sort((p, q)=> p[0] - q[0]);
        let i = 0; const fireTo = f =>{ while(i < cues.length && cues[i][0] <= f){ try{ cues[i][1](); }catch(e){ console.error(e); } i++; } };
        return new Promise(res =>{
          if(!C.alive()) return res();
          if(role && s) C.cur = role;
          fireTo(0);
          if(!s){ const t0 = performance.now(); const tick = ()=>{ if(!C.alive()) return res(); const f = (performance.now() - t0) / 700;
              fireTo(f); if(f >= 1) res(); else requestAnimationFrame(tick); }; if(cues.length) requestAnimationFrame(tick); else res(); return; }
          let raf = 0;
          const tick = ()=>{ if(!C.alive()) return; const d = voEl.duration;
            if(isFinite(d) && d > 0 && srcOf(voEl) === s) fireTo(voEl.currentTime / d); raf = requestAnimationFrame(tick); };
          play(s, ()=>{ cancelAnimationFrame(raf); fireTo(1); res(); });
          raf = requestAnimationFrame(tick);
        }).then(()=> C.guard());
      }
    };
    return C;
  }
  const run = (C, fn)=>{ C.seq = true;
    return fn().catch(e =>{ if(e !== C.STOP) console.error("[jalebi]", e); }).finally(()=>{ C.seq = false; }); };
  /* [QA BUG_09 / 04 / 07, as File6 pvReplay] the page's speaker takes a tap only while the page WAITS FOR THE CHILD (or
     its flow has ended) - never while the page talks, never once it is answered. replay: what a tap says. */
  function speaker(C, replay){
    state.replayAudio = ()=>{ if(isPlaying || !C.alive()) return;
      if(replay) run(C, replay); else if(C.cur) C.say(C.cur).catch(()=>{}); };
    const sync = ()=>{ if(!C.alive()) return false;
      const waiting = C.waits.some(w => w.live() && !w.busy());
      state.speakerLive = !state.slideDone && !state.locked && (!C.seq || waiting);
      state.seqTalk = !!C.seq && !waiting && !state.slideDone;
      pvChipPaint(); return true; };
    sync(); const iv = setInterval(()=>{ if(!sync()) clearInterval(iv); }, 120);
  }
  /* 7s without a tap (IDLE_MS, the QA checklist's one value): fn, then again 7s later while the child stays idle */
  function idle(C, fn){
    let t = 0, on = false;
    const arm = ()=>{ clearTimeout(t); on = true; t = setTimeout(()=>{ if(!on || !C.alive()) return;
      Promise.resolve(fn()).then(()=>{ if(on) arm(); }, ()=>{}); }, IDLE_MS); };
    return { arm, stop(){ on = false; clearTimeout(t); } };
  }
  /* a picture + its word, as a card (the MEET cards, the question's word, the yes / no pair) */
  function wordCard(parent, w, cls){
    const c = add(parent, "button", "jl-card " + (cls || "")); c.type = "button";
    if(w.img) add(c, "img", "jl-card-pic").src = w.img;
    add(c, "span", "jl-card-word").textContent = w.word;
    return c;
  }
  return { reduce, wait, src, add, pop, shake, softGlow, wordFracs, ctx, run, speaker, idle, wordCard };
})();
function pvChipPaint(){
  const chip = document.querySelector("#slideHost .tut-audio") || document.getElementById("audioChip"); if(!chip) return;
  chip.classList.toggle("chip-wait", state.speakerLive === false);
  if(state.seqTalk) chip.classList.add("playing");
  else if(!isPlaying) chip.classList.remove("playing");
}

/* ---- [jalebi] where a word is said in a clip: its measured speech (tools/lessons.py assets.audio_timing) and its line
   (assets.audio_text), the words placed as the poem karaoke places them (jlWordSchedule - defined below, hoisted). The
   words are found in the line in order; fromEnd: from the line's end (the options are listed last). -> fractions of the
   clip, for C.clip's cues; null when unknown. ---- */
function jlWordFracs(id, words, fromEnd){
  const A = CARD.assets || {}, tm = (A.audio_timing || {})[id], text = (A.audio_text || {})[id];
  if(!tm || !text || !tm.d) return words.map(()=> null);
  const toks = text.split(/\s+/).filter(Boolean).map(t => ({ textContent: t }));
  const sched = jlWordSchedule(toks, tm), clean = t => String(t).replace(/[।,!?;:“”"'—-]/g, "");
  const at = new Array(words.length).fill(-1);
  if(fromEnd){ let j = toks.length - 1;
    for(let k = words.length - 1; k >= 0; k--){ while(j >= 0 && clean(toks[j].textContent) !== clean(words[k])) j--; at[k] = j; j--; } }
  else { let j = 0;
    words.forEach((w, k)=>{ while(j < toks.length && clean(toks[j].textContent) !== clean(w)) j++; at[k] = j < toks.length ? j : -1; j++; }); }
  return at.map(i => i >= 0 && sched[i] ? sched[i][0] / tm.d : null);
}
/* a card lights for a moment as the voice says its word (hint 2: "नचाई, चूल्हा, जलेबी") */
function jlSayGlow(el){ if(!el) return; el.classList.remove("say-glow"); void el.offsetWidth; el.classList.add("say-glow"); setTimeout(()=> el.classList.remove("say-glow"), 900); }

/* ---- [jalebi] the answer step of every question page: options, the help ladder, the right answer ----
   As File6's answer cards (PVK.mcq): the options come in one by one as the voice names them (user 2026-11-04; M.show,
   driven by the page); a wrong card shakes with its amber rim and the wrong sound (no word over it), then the deck's
   hints in turn - 1 the first hint, 2 the options said again, each lighting as it is said, 3 the others fade and lock,
   the right card lights (File6's WA3), and the third hint is said; the right card turns green, the others go, SFX +
   confetti + Swiftie cheers, then its word. 7s idle: the question again. keep_order: the cards stand in the order the
   voice names them. cfg: { options:[{word, img, audio, correct}], keep_order, pictures, ref, ladder: async (n, M) =>,
   reask: async =>, onRight: async (card, opt) =>, onReady: M =>, signal, key } -> a promise of the number of wrong taps */
function jlPick(C, parent, cfg){
  return new Promise(res =>{
    const slide = C.slide, row = JK.add(parent, "div", "jl-opts" + (cfg.pictures ? " pics" : "") + (cfg.ref ? " ref" : ""));
    let opts = cfg.options.slice();
    if(!cfg.keep_order){
      const mix = ()=>{ const o = cfg.options.slice(); for(let i = o.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
      const key = o => o.map(x => x.word).join(), seen = jlPick.last || (jlPick.last = {}), id = cfg.key || slide.id;
      opts = mix(); for(let n = 0; n < 12 && seen[id] && key(opts) === seen[id]; n++) opts = mix();
      seen[id] = key(opts);
    }
    const els = opts.map(o =>{ const b = JK.add(row, "button", "jl-opt"); b.type = "button"; b._o = o;
      if(cfg.pictures && o.img){ JK.add(b, "img", "jl-opt-pic").src = o.img; }
      JK.add(b, "span", "jl-opt-word").textContent = o.word; return b; });
    const right = els.find(b => b._o.correct);
    let wrong = 0, busy = true, over = false;
    const W = { live: ()=> !over, busy: ()=> busy }; C.waits.push(W);
    const M = { row, els, right,
      show(b){ if(b && !b.classList.contains("in")){ b.classList.add("in"); PVSFX.appear(); } },
      showAll(){ els.forEach(b => M.show(b)); },
      byWord: w => els.find(b => b._o.word === w),
      lock(){ els.forEach(x =>{ if(x !== right){ x.classList.add("faded", "locked"); x.disabled = true; } }); right.classList.add("hint-on"); JK.softGlow(right); } };
    const idle = JK.idle(C, async ()=>{ if(busy || over) return; busy = true; await (cfg.reask ? cfg.reask() : C.say("prompt")); busy = false; });
    async function onWrong(b){
      wrong++; busy = true; idle.stop(); stopNudge();
      try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: false, attempt: wrong, score: 0 }); }catch(e){}
      GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: wrong });
      state.attempts = wrong; state.scaffoldLevel = Math.min(3, wrong);
      stopAudio(); sfxWrongSoft(); setSwMood("tryagain");                // the wrong sound, heard on its own
      b.classList.add("wrong"); JK.shake(b, 9); setTimeout(()=> b.classList.remove("wrong"), 900);
      await C.wait(750);
      /* (QA BUG_06: Swiftee stays sad through the whole wrong-answer sequence - the hint too; back to normal after it) */
      await cfg.ladder(wrong, M);
      if(C.alive() && !over){ busy = false; setSwMood("point"); idle.arm(); }
    }
    async function onRight(b){
      over = true; busy = true; idle.stop(); stopNudge();
      b.classList.remove("hint-on"); b.classList.add("correct");
      els.forEach(x =>{ if(x !== b) x.classList.add("pv-gone"); });
      try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: true, attempt: wrong + 1, score: wrong === 0 ? 1 : 0 }); }catch(e){}
      GameBus.emit(cfg.signal || "rhyme_pick_correct", { slide_id: cfg.key || slide.id, phase: slide.phase, value: wrong === 0, first_try: wrong === 0, attempts: wrong + 1, latency_ms: Date.now() - state.slideStart });
      sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
      if(cfg.onRight) await cfg.onRight(b, b._o);
      await C.sayId(b._o.audio);
      await C.wait(500);
      res(wrong);
    }
    els.forEach(b => b.addEventListener("click", ()=>{
      if(busy || over || !C.alive() || b.classList.contains("locked") || !b.classList.contains("in")) return;
      PVSFX.tap();
      (b === right ? onRight(b) : onWrong(b)).catch(()=>{});
    }));
    M.ready = ()=>{ M.showAll(); busy = false; idle.arm(); };
    if(cfg.onReady) cfg.onReady(M); else { M.showAll(); M.ready(); }
  });
}
/* the question's line, the options coming in as it names them (its last words), then the child's turn */
function jlAskWithOptions(C, M, role, extra, onFirstOption){
  const id = C.slide.audio && C.slide.audio[role], f = jlWordFracs(id, M.els.map(b => b._o.word), true);
  setSwMood("talk");
  const cues = M.els.map((b, i)=> [f[i], ()=>{ if(i === 0 && onFirstOption) onFirstOption(); M.show(b); }]).concat(extra || []);
  return C.say(role, cues).then(()=>{ if(onFirstOption) onFirstOption(); setSwMood("point"); M.ready(); }, ()=>{});
}
/* hint 2: the options (or the pictures) said again, each lighting as it is said. items: [[element, word], ...] */
function jlSayWithGlow(C, role, items){
  const id = C.slide.audio && C.slide.audio[role], f = jlWordFracs(id, items.map(x => x[1]), false);
  return C.say(role, items.map((x, i)=> [f[i], ()=> jlSayGlow(x[0])]));
}

/* ---- [jalebi] pages 3-8 (T1-T6): HI02H04_L03_S01 (आलू-मालू-कालू) page 1's story-reading page, as it is (user 2026-11-03:
   "size of image and its container, text size, font, text animation, mic button and its logic, hand nudge etc should also
   be same as that repo") - inside File6's frame, under File6's heading, over File6's →. Its mic art (audio_button.svg,
   recoloured yellow, navy glyph; while the child reads the glyph fades into the same pill with voice bars), its hand
   (nudge_hand.webp, 96px, tilted 34deg, bobbing), its word karaoke (orange #FF8A00 + 1.1x: a steady WORD_MS beat while
   the child reads, the recording's own measured timing while the voice reads). ---- */
const JL_MIC_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAACxgAAAsYBJG9eggAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAldSURBVHic7Z17rB5FGYeflx5a2h7ElnspmApIsCm0qTRIpAgWUALaBm8UE0NUVNqg1cQbJbG1RmMETRSa1BQNBC9JwaLQtCJq1HilisXYxoq20pYeqaeQlgKe9rz+MXvg5HDOzux+uzs738yTzF873zu/mfl9e5mZ3RFVpdsRkVnAImABMB2YBkwYkU2B/wJ7gC3AA8BGVT3YoNTGkW41QNbp7wcWAmeWDPMC8AhwP3Cvqr5YkbzW0HUGEJHXAF8ArgeOqjD0TuBWjBEGK4zrla4xgIhMBW4BlvDK03uV/AX4jKpurLGMxugKA4jIXGA95vreFN8Elqnq4QbLrJzgDSAi1wFrgYkeiv8Z8C5V7fdQdiVUeY1sFDF8Cfgufjof4DLgjyIy01P5HRPsGUBEvgh8zreOjL3ABaq6y7eQogRpABFZDNzrW8cINgMXq+rzvoUUIbhLgIjMw1zz28Zc4C7fIooSlAFE5HjM3f4xvrWMwXtFZJlvEUUIygCY5/xTfYuw8HkROcG3CFeCMUA2wneTbx0OvApY7luEK8EYAFhFvSN8VfJREZnhW4QLQRggm9i53reOAowHVvoW4UIQBgAWA+JbREGuFZFJvkXYCMUA7/AtoAQTgSt9i7DRegOIyFnAub51lGShbwE2Wm8A4O2+BXTA1SLS41tEHiEY4FLfAjpgKnC+bxF5hGCAJuf466DV+kMwwDTfAjqk1fpbbQARORo40beODkkG6IBTCe/5fySn+RaQR9sNMMW3gApodR3aboDQ//3Q8jq03QCJmkkGiJxkgMhJBoicZIDISQaInGSAyEkGiJxkgMhJBoicZIDISQaInGSAyEkGiJxkgMhJBoicZIDISQaInGSAyEkGiJxkgMhJBoicZIDISQaInGSAyEkGiJxkgMhJBoicZIDISQaInGSAyEkGiJxkgMhJBoicZIDISQaInGSAyEkGiJxGvmSdbaJ0DrBDVXc3UWaoiMgEYCbwP2Bb3XsT13oGEJFJIrIGeBr4NbBLRB4SkZPrLDdUROR9mF1INwOPA0+IyGW1FqqqtSXgDkBHST8l27XU8vvZY/w+pLTesa0uAQZH+f1BYEZdfVTbGUBEJgMfGePwW4BZdZUdKMsY/auik4EP11VonZeA11vin+cQ40hFWnziWoe5Ocdq+7PUaYADluOnO8Toq0KIZ6x1EJFx5H9W3taWpanTAE9ZjrtsAfs0MFCBFp/scchzMvl9YWvL0tRmAFV9FnghJ4t1IwU1d0d7KxPlBxcD2NqitjaoeyAoT7jrThouDdhmojZA3qnL1QD/rEKIR55wyGNri/AuARl5znXdBn5DFUI8sV1Vtzvk69ozQJ7w8dmW8DY2EO7j4HrHfGdbjgdrANvp27orqKr2A7+qRk7jWA2Q7Sz61pwsB4B9lSkaQd0G+Inl+CLHOD/qVIgH+oDfOeS7BHh1zvGHVXWwGkmvpFYDqOoWYFdOlotFZKpDqHuocTCkJlY7dpxtZ/QHqxAzFk2sB8i7iesBrrEFUNV9wFcqU1Q/fcBtjnnzDKDUfBPchAEeshx3vQzcTo2PQxWzQlUP2jKJyBzgjJwsj6pqrcPhTRjgEeDFnONXiMixtiCqeghYUZmq+tgOfMsx77WW47We/oF61wMMm+veRP6c+QrHOD3Azy2xfKYB4FLHukwB9lviza29bxoywM2Wih4ETnGMdTzwjxZ09mjppgJt8lVLrN04LJoJxQDHAf2WCq8uEO9c4JkWdPjwdGcB/WdgJsry4n2qkb5popCs0rdYKjwAvK5AvCsxCyd9d7xilrj1FNB+tyVeHzCp2wxwLGZEK6/i9xWMOR+zZsBn598NTCig+XzM0HZezGWN9UtTBWWV/7RDgy4oGHMGZgVt0x1/hIKnaWAc8AtL3D3AxG41wOTs9JbXAPuA1xaM2wvc32Dn9wNXl6j/1xxiL220T5osLGuETzg0wuNAb4nYlwN/qrHjn8eMSE4poe0Gh/hPUuByEqoBJgI7HBpjPSUegzBLqxdjZiKrPN1/Bzi9ZJ3fiBkMs5VzQ+P90XSBWYPMc2yQVR2U0QMswLycsqtEpw9g7u6XAtM70DEdM59vK+8HPvpCMpGNIyJLgW84ZL1RVV2HVscqS4ALMIaYjlmBM5QmYzpoz7C0Bdigqvs7LPckYCMwx5L178AbVLX5GU8frhv27/gebv/G24BxPrWWqNtsYKdD3Q4Bs7zp9NxIvcBWRxNsAI7z3bGO9Xon8JxjvRq/7rfGAFljzcTMBbg01lbgbN+ac+oiwEpGf8lztHSXd82+BWQN9x7gsGOj9QOLfGsepQ6nAD90rIMCf6DBAZ9WGyBrwIWY52zXBvwlcGELdPdi1im4nsUUeJgS4xxdbYCsMedTfJZvHQUmkSrUejSwBPvI5sj0fWC877ZupQGyhj0P8yhWpFEHgDubuD/ADGRdh1n5U0SjYh57j/LdxsOTt3GAPERkBmZJ+Vklfr4VeCBLv9cKKph94+gazALOKzAmKMqtqrqqUy1V00oDwEuDKPcBb+ogzF7gx5glaTsxZ5Y+VR3zTaNsfeLQINEczL3JRZiZvDIcAm5W1bUlf18rrTUAvDSCdyPwZfJfnijCIPAfXh71ew5zBz8N875ib0XlgBm7WKKqOyqMWSmtNsAQ2VfFbsdM8oTAbuDjqrrOtxAbQRhgCBG5HFgNnOlbyxgcwUw+LVcf4/olCMoAACJyDGZl0RLgRM9yhlDMzOFnVXWzbzFFCM4AQ4jIeMxd+Ycws3yjfWKtbp4Cvg2sVdUgP2QRrAGGkz02fgCz6sb1yyNlGcQ8VawBHtSaP+VaN11hgCGyz61dhRlRnJ2lEzoMexjYBjwG/BlYp6r/7jBma+gqA4yGiJzGy2aYjTHHSTk/+Q1mXeFjWfqrqua92xg0XW+AkYjI14GP5WSZoqrPNKXHN2m/gMhJBoicZIDISQaInGSAyEkGiJxkgMhJBoicZIDICWokMFsh9EHg3Zg1AWUMPBXztZKxeBIz4VOUZ4FHgZWqurPE770QmgHWYKZ/28wBYJ6qbvMtxIVgDCAiFwK/9a3DkY2q+jbfIlwI6R7gzb4FFOCi7HLVekIyQEhTsgNVvI/QBCEZYBNmcUYIbPItwJVgDKCqfwOWYxZgtpl/AZ/0LcKVYG4ChxCR+Zh3886hXQbej9kh5A51+FR8W/g/+bQMXD5Hz/sAAAAASUVORK5CYII=";
const JL_READ_MIC = '<svg viewBox="0 0 58 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g class="mic"><rect x="8" y="4" width="41.1559" height="44" rx="20.578" fill="url(#jlMicGrad)"/><rect x="6" y="2" width="45.1559" height="48" rx="22.578" stroke="white" stroke-width="4"/><g transform="translate(28.58 26) scale(1.3) translate(-28.58 -26)"><g mask="url(#jlMicMask)"><rect x="17.9111" y="15.3335" width="21.434" height="21.434" fill="#0B3D8C"/></g></g></g><g class="mic-wave"><rect x="8" y="4" width="41.1559" height="44" rx="20.578" fill="url(#jlMicGrad)"/><rect x="6" y="2" width="45.1559" height="48" rx="22.578" stroke="white" stroke-width="4"/><g fill="#0B3D8C" transform="translate(-2.42 0)"><rect x="22.9" y="22" width="2.2" height="8" rx="1.1"/><rect x="26.4" y="19" width="2.2" height="14" rx="1.1"/><rect x="29.9" y="17" width="2.2" height="18" rx="1.1"/><rect x="33.4" y="19" width="2.2" height="14" rx="1.1"/><rect x="36.9" y="22" width="2.2" height="8" rx="1.1"/></g></g><defs><linearGradient id="jlMicGrad" x1="0" y1="4" x2="0" y2="48" gradientUnits="userSpaceOnUse"><stop stop-color="#FFD24E"/><stop offset=".55" stop-color="#FCB717"/><stop offset="1" stop-color="#F2A80F"/></linearGradient><mask id="jlMicMask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="20" y="18" width="17" height="16"><image href="' + JL_MIC_PNG + '" x="20.5781" y="18" width="16" height="16" preserveAspectRatio="none"/></mask></defs></svg>';
const JL_WORD_MS = 1100;   // the reference's WORD_MS: while the child reads, every word stays lit this long
/* the reference's wordScheduleFor: per-word [start, end) ms that follows the voice - the words cut into phrases at their
   punctuation, the recording's spoken stretches merged across their shortest pauses to one per phrase, and inside a
   stretch the words share its time by length */
function jlWordSchedule(words, tm){
  const wt = w => Math.max(1, Array.from((w.textContent || "").replace(/[“”"‘’,।!?;:—-]/g, "")).length);
  const phrases = []; let cur = [];
  words.forEach((w, i)=>{ cur.push(i); if(/[,।!?;:”"]$/.test((w.textContent || "").trim()) || i === words.length - 1){ phrases.push(cur); cur = []; } });
  let segs = (tm.segs || [[tm.s, tm.e]]).map(x => x.slice());
  while(segs.length > phrases.length && segs.length > 1){
    let k = 0, best = Infinity;
    for(let i = 0; i < segs.length - 1; i++){ const g = segs[i + 1][0] - segs[i][1]; if(g < best){ best = g; k = i; } }
    segs.splice(k, 2, [segs[k][0], segs[k + 1][1]]);
  }
  const spans = segs.length === phrases.length ? segs.map((sg, i)=> [sg, phrases[i]]) : [[[tm.s, tm.e], words.map((_, i)=> i)]];
  const out = new Array(words.length);
  spans.forEach(([[a, b], idxs])=>{ const tot = idxs.reduce((n, i)=> n + wt(words[i]), 0); let t = a;
    idxs.forEach(i =>{ const d = (b - a) * wt(words[i]) / tot; out[i] = [t, t + d]; t += d; }); });
  return out;
}
/* the reference's evWordKaraoke: readingMs = the child reading (an even beat per word); else it follows the clip that
   plays - by its measured timing (tm), or by the words' length. Returns the stop function. */
function jlKaraoke(words, readingMs, tm){
  if(!words.length) return ()=>{};
  const weights = words.map(w => readingMs ? 1 : Math.max(1, Array.from(w.textContent || "").length + (/[।!?]$/.test(w.textContent) ? 3 : /[,;:]$/.test(w.textContent) ? 1 : 0)));
  const total = weights.reduce((a, b)=> a + b, 0), t0 = performance.now(), fallback = readingMs || Math.max(900, total * 65);
  const sched = !readingMs && tm ? jlWordSchedule(words, tm) : null;
  let active = -1;
  const show = n =>{ if(n === active) return; words.forEach((w, i)=> w.classList.toggle("now", i === n)); active = n; };
  const iv = setInterval(()=>{
    if(!words[0].isConnected){ clearInterval(iv); return; }
    const a = currentAudio, live = !readingMs && a && isFinite(a.duration) && a.duration > 0 && !a.paused;
    if(live && sched){ const ms = a.currentTime * 1000; let n = -1; for(let i = 0; i < sched.length; i++) if(ms >= sched[i][0]) n = i; show(n); return; }
    const p = live ? a.currentTime / a.duration : (performance.now() - t0) / fallback;
    const target = Math.min(.999, Math.max(0, p)) * total; let acc = 0, n = words.length - 1;
    for(let i = 0; i < weights.length; i++){ acc += weights[i]; if(target < acc){ n = i; break; } }
    show(n);
  }, 40);
  return ()=>{ clearInterval(iv); words.forEach(w => w.classList.remove("now")); };
}
/* a poem line as word spans; rhyme: indices of its rhyme words (orange) */
function jlLine(parent, line, cls){
  const row = JK.add(parent, "div", "jl-line " + (cls || ""));
  row._w = line.words.map((w, i)=>{ if(i) row.appendChild(document.createTextNode(" "));
    const s = JK.add(row, "span", "jl-w" + (w.rhyme ? " jl-rhyme" : "")); s.textContent = w.t; s._w = w; return s; });
  row._audio = line.audio;
  return row;
}
/* one line read to the child: its clip, each word lit as it is said */
function jlNarrate(C, row){
  const f = JK.wordFracs(row._w.map(s => s.textContent));
  const on = s =>{ row._w.forEach(x => x.classList.remove("say")); s.classList.add("say"); };
  row.classList.add("now");
  return C.sayId(row._audio, row._w.map((s, i)=> [f[i], ()=> on(s)])).finally(()=>{
    row._w.forEach(x => x.classList.remove("say")); row.classList.remove("now"); });
}

/* the question's picture, as HI02H04_L03_S01's question page (its page 14: a 560 x 315 white picture box under the header,
   user 2026-11-03) - here with the word under the picture, inside the same box. It says its word when tapped. */
function jlQPic(parent, w){
  const c = JK.add(parent, "button", "jl-qpic"); c.type = "button";
  const im = JK.add(JK.add(c, "div", "jl-qpic-img"), "img"); im.src = w.img; im.alt = "";
  JK.add(c, "span", "jl-qpic-name").textContent = w.word;
  return c;
}

/* an ending of a word lit on its own (page 8's "ाई"): the word's span gets an orange copy of itself on top, clipped on
   the left at the width of the word without its ending - so the ending (its matra too) is coloured, the shaping untouched */
function jlEnding(span, ending){
  const word = span ? span.textContent : "";
  if(!span || !word.endsWith(ending)) return null;
  span.classList.add("jl-endw");
  const hl = JK.add(span, "span", "jl-end"); hl.textContent = word; hl.setAttribute("aria-hidden", "true");
  const fit = ()=>{ const m = JK.add(span, "span", "jl-measure"); m.textContent = word.slice(0, -ending.length);
    const w = m.offsetWidth; m.remove(); hl.style.clipPath = "inset(-30% -12% -30% " + w + "px)"; };
  fit(); if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  return hl;
}

const JalebiModules = {
  POEM_READ: {
    /* deck pages 3-8 - "आइए कविता पढ़ें।": the page's picture and its lines (the deck's rhyme words in orange), as
       HI02H04_L03_S01's story page (user 2026-11-03): the picture on top, the sentence box under it, the mic left of the box.
       Its logic: page 3 says "इस बटन पर टैप कीजिए और कविता पढ़िए।" with the hand on the mic. The mic pulses while it waits;
       7s with nothing happening -> that line again + the hand (every page). A tap: the tap sound, the glyph turns into
       voice bars, the words light one by one at WORD_MS each (the child reads - no listening, user 2026-11-03), then the
       voice reads the lines (each word lit with the voice); the mic greys out; then →. The speaker: before reading, the
       line + the hand; after, the lines again; never while the child reads.
       data: { image, lines:[{words:[{t, rhyme}], audio}], ms_per_word }. audio: intro (page 3), idle. */
    mount(host, slide){
      const d = slide.data, C = JK.ctx(slide, host), TM = (CARD.assets && CARD.assets.audio_timing) || {};
      state.ownsAudio = true; setNavActive(false); setSwMood("point");
      const card = host.closest(".tut-card"); if(card) card.classList.add("jl-read-card");
      const wrap = JK.add(host, "div", "jl-read");
      const pic = JK.add(wrap, "div", "jl-read-pic");
      const im = JK.add(pic, "img", "jl-read-img"); im.src = d.image; im.alt = "";
      const cap = JK.add(wrap, "div", "jl-read-cap" + (d.lines.length > 1 ? " wrap" : ""));
      const rows = d.lines.map(l => jlLine(cap, l));
      const words = rows.flatMap(r => r._w);
      const mic = JK.add(cap, "button", "jl-rmic", JL_READ_MIC); mic.type = "button"; mic.setAttribute("aria-label", "कविता पढ़ने के लिए माइक्रोफ़ोन");
      const hand = JK.add(wrap, "div", "jl-hand", '<img src="assets/images/nudge_hand_ref.webp" alt="">');
      let mode = "ready", idleT = 0, stopWords = ()=>{};
      /* the reference's pointNudgeAt on the mic: the hand centred on it, its fingertip just above its lower edge */
      const pointAt = ()=>{
        const k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
        const r = mic.getBoundingClientRect(), w = wrap.getBoundingClientRect();
        hand.style.left = ((r.left - w.left) / k + r.width / k / 2 - 48) + "px";
        hand.style.top = ((r.bottom - w.top) / k - 2 - 8 - 4 - 6) + "px";
        hand.classList.add("show");
      };
      const hideHand = ()=> hand.classList.remove("show");
      const armIdle = ()=>{
        clearTimeout(idleT);
        if(!C.alive() || mode !== "ready") return;
        idleT = setTimeout(()=>{
          if(!C.alive() || mode !== "ready") return;
          if(isPlaying){ armIdle(); return; }
          GameBus.emit("idle_vo_replay", { slide_id: slide.id });
          pointAt(); play(audioFor(slide, "idle"), armIdle);
        }, IDLE_MS);
      };
      const W = { live: ()=> mode === "ready" || mode === "done", busy: ()=> false }; C.waits.push(W);
      const narrate = async ()=>{
        if(!C.alive() || mode === "narrating") return;
        clearTimeout(idleT); stopWords(); hideHand();
        mode = "narrating"; mic.classList.remove("p2-rec"); mic.classList.add("p2-rec-done"); mic.disabled = true;
        setNavActive(false); setSwMood("talk");
        for(const r of rows){
          stopWords = jlKaraoke(r._w, 0, TM[r._audio]);
          await C.sayId(r._audio);
          stopWords();
        }
        mode = "done"; setSwMood("point"); setNavActive(true);
      };
      mic.onclick = ()=>{
        if(!C.alive() || mic.disabled || mode !== "ready") return;
        clearTimeout(idleT); stopAudio(); stopNudge(); hideHand(); stopWords();
        playSfxFile("sfx_tap", 0.7, ()=> _tone([520], "sine", 0.09, 0.09));   // the button-press sound (the reference's sfx_tap)
        mode = "reading"; setNavActive(false); mic.classList.add("p2-rec");
        GameBus.emit("poem_read", { slide_id: slide.id, phase: slide.phase });
        const readMs = words.length * (d.ms_per_word || JL_WORD_MS);
        stopWords = jlKaraoke(words, readMs);
        JK.run(C, async ()=>{ await C.wait(readMs + 300); stopWords(); await narrate(); });
      };
      JK.speaker(C, async ()=>{
        if(mode === "ready"){ clearTimeout(idleT); pointAt(); await C.say(C.has("intro") ? "intro" : "idle"); armIdle(); }
        else if(mode === "done") await narrate();
      });
      if(C.has("intro")){ setSwMood("talk"); requestAnimationFrame(()=>{ if(C.alive()) pointAt(); });
        C.say("intro").then(()=>{ setSwMood("point"); armIdle(); }, ()=>{}); }
      else armIdle();
    }
  },

  POEM_RECAP: {
    /* deck page 9 - "कविता फिर से सुनिए।", on ONE page (user 2026-11-03), the poem in two halves of four lines (eight lines do
       not fit the box): the first half is read again one by one (each word lit with the voice, as pages 3-8), then "अब इन
       शब्दों को सुनिए। इन सभी शब्दों के अंत में आई की आवाज़ है, आइए सुनते हैं।", then its words of the deck's ten turn orange
       one by one, each said; then - no tap - the box fades to the second half: read, its words, then what तुकांत means;
       then →. No counter. data: { parts:[[line ...], [line ...]] } (line: {words:[{t, rhyme, audio}], audio}; rhyme: one of
       the ten). audio: words (after the first half's lines), conclude (at the end). */
    mount(host, slide){
      const d = slide.data, C = JK.ctx(slide, host), TM = (CARD.assets && CARD.assets.audio_timing) || {};
      state.ownsAudio = true; setNavActive(false); setSwMood("point");
      const box = JK.add(JK.add(host, "div", "jl-recap"), "div", "jl-recap-box");
      let rows = [];
      const show = part =>{ box.innerHTML = ""; rows = part.map(l => jlLine(box, l)); };
      const swap = async part =>{ box.classList.add("out"); await C.wait(320); show(part); box.classList.remove("out"); await C.wait(380); };
      const W = { live: ()=> !C.seq, busy: ()=> false }; C.waits.push(W);
      const half = async (i, part)=>{
        if(i) await swap(part);
        for(const r of rows){
          const stop = jlKaraoke(r._w, 0, TM[r._audio]);
          try{ await C.sayId(r._audio); } finally{ stop(); }
          await C.wait(180);
        }
        await C.wait(250);
        if(i === 0 && C.has("words")) await C.say("words");
        for(const sp of rows.flatMap(r => r._w.filter(x => x._w.rhyme))){
          sp.classList.add("found"); JK.pop(sp); PVSFX.appear();
          await C.sayId(sp._w.audio); await C.wait(260);
        }
      };
      const all = async ()=>{
        setNavActive(false); show(d.parts[0]);
        await C.wait(300); setSwMood("talk");
        for(let i = 0; i < d.parts.length; i++){ await half(i, d.parts[i]); if(i < d.parts.length - 1) await C.wait(500); }
        if(C.has("conclude")){ setSwMood("teach"); await C.say("conclude"); }
        setSwMood("point"); setNavActive(true);
      };
      show(d.parts[0]);
      JK.speaker(C, all);
      JK.run(C, all);
    }
  },

  MEET_RHYME: {
    /* deck pages 10-11: two words, their pictures - "दोनों शब्द ध्यान से सुनिए- कढ़ाई- मिठाई ..." - each card lights as its
       word is said (cues from tools/lessons.py); nothing between them (user 2026-11-03: no ♪ / ≠). After the line a
       card says its word when tapped; then →. data: { a:{word, img, audio}, b, rhymes, cues:{a, b} }. audio: prompt. */
    mount(host, slide){
      const d = slide.data, C = JK.ctx(slide, host), CU = d.cues || {};
      state.ownsAudio = true; setNavActive(false); setSwMood("point");
      const row = JK.add(host, "div", "jl-meet");
      const A = JK.wordCard(row, d.a, "big");
      const B = JK.wordCard(row, d.b, "big");      // (no ♪ / ≠ between them - user 2026-11-03)
      let open = false;
      const W = { live: ()=> open, busy: ()=> false }; C.waits.push(W);
      /* data.ending (page 8, user 2026-11-04): the rhyming ending "ाई" of each word lights orange as the word is said, and both
         again on "आई" - an orange copy of the word over it, clipped to start where the ending starts (a colour change inside
         the word would not reach the ा: Devanagari shapes ढ़ा / ठा as one) */
      const ends = d.ending ? [A, B].map(c => jlEnding(c.querySelector(".jl-card-word"), d.ending)) : [];
      const endOn = (e, on)=>{ if(!e) return; e.classList.toggle("on", on); if(on) JK.pop(e); };
      [[A, d.a], [B, d.b]].forEach(([c, w])=> c.onclick = ()=>{ if(!open || isPlaying || !C.alive()) return; PVSFX.tap();
        c.classList.add("lit"); C.sayId(w.audio).then(()=> c.classList.remove("lit"), ()=>{}); });
      const all = async ()=>{
        open = false; ends.forEach(e => endOn(e, false)); await C.wait(300); setSwMood("talk");
        const lit = (c, on)=> c.classList.toggle("lit", on);
        /* where the two words (and "आई") are said - measured from the clip; the lesson's estimate if not */
        const f = jlWordFracs(slide.audio.prompt, d.ending ? [d.a.word, d.b.word, "आई"] : [d.a.word, d.b.word], false);
        const fa = f[0] != null ? f[0] : CU.a, fb = f[1] != null ? f[1] : CU.b;
        await C.say("prompt", [[fa, ()=>{ lit(A, true); endOn(ends[0], true); }], [fb, ()=>{ lit(A, false); lit(B, true); endOn(ends[1], true); }],
                               [fb != null ? fb + .12 : CU.b_end, ()=> lit(B, false)],
                               [f[2], ()=> ends.forEach(e => endOn(e, true))]]);
        lit(A, false); lit(B, false); open = true; setSwMood("point"); setNavActive(true);
      };
      JK.speaker(C, all);
      JK.run(C, all);
    }
  },

  FIND_RHYME: {
    /* deck page 13 (guided): the poem's first four lines, no picture; "आई की आवाज़ वाले शब्द पहचानिए।" - every word says
       itself when tapped. An आई word turns green and counts; a wrong word is said and wiggles (help 1), the 2nd wrong
       tap in a row adds "इस शब्द के अंत में आई की आवाज़ नहीं है।" (help 2), from the 3rd one an आई word not found yet glows
       too. All found: confetti, "शाबाश! आपने सभी तुकांत शब्द पहचान लिए।". 7s idle: the instruction again.
       data: { lines:[{words:[{t, rhyme, audio}]}] }. audio: prompt, hint2, correct. */
    mount(host, slide){
      const d = slide.data, C = JK.ctx(slide, host);
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point");
      const wrap = JK.add(host, "div", "jl-find");
      const poem = JK.add(wrap, "div", "jl-poem");             // (no counter - user 2026-11-03)
      const rows = d.lines.map(l => jlLine(poem, l, "chip"));
      const chips = rows.flatMap(r => r._w);
      chips.forEach(s => s.setAttribute("role", "button"));
      const targets = chips.filter(s => s._w.rhyme);
      let found = 0, wrong = 0, streak = 0, busy = true, over = false;
      const paint = ()=>{};
      const W = { live: ()=> !over, busy: ()=> busy }; C.waits.push(W);
      const idle = JK.idle(C, async ()=>{ if(busy || over) return; busy = true; await C.say("prompt"); busy = false; });
      chips.forEach(s => s.addEventListener("click", ()=>{
        if(busy || over || !C.alive()) return;
        busy = true; idle.stop(); PVSFX.tap();
        JK.run(C, async ()=>{
          if(s._w.rhyme){
            if(!s.classList.contains("found")){ s.classList.add("found"); s.classList.remove("hint-on"); JK.pop(s); found++; streak = 0; paint(); sfxCorrect(); }
            await C.sayId(s._w.audio);
            if(found === targets.length){
              over = true; state.locked = true; recordResult(slide, wrong === 0);
              try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: true, attempt: wrong + 1, score: wrong === 0 ? 1 : 0 }); }catch(e){}
              GameBus.emit("rhyme_find_done", { slide_id: slide.id, phase: slide.phase, value: wrong === 0, first_try: wrong === 0, wrong_taps: wrong });
              try{ confettiCannon(); }catch(e){} setSwMood("happy");
              await C.say("correct"); await C.wait(500);
              completeSlide(wrong === 0); return;
            }
          } else {
            wrong++; streak++; state.attempts = wrong; state.scaffoldLevel = Math.min(3, streak);
            GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: wrong });
            stopAudio(); sfxWrongSoft(); setSwMood("tryagain"); s.classList.add("wrong"); JK.shake(s, 7); setTimeout(()=> s.classList.remove("wrong"), 900);
            await C.wait(450);                                   // the wrong sound first, then the word (user 2026-11-04)
            await C.sayId(s._w.audio);
            if(streak >= 2){ await C.wait(200); await C.say("hint2"); }
            if(streak >= 3){ const t = targets.find(x => !x.classList.contains("found")); if(t){ t.classList.add("hint-on"); JK.softGlow(t); } }
            setSwMood("point");
          }
          busy = false; idle.arm();
        });
      }));
      JK.speaker(C, async ()=>{ idle.stop(); busy = true; await C.say("prompt"); busy = false; idle.arm(); });
      JK.run(C, async ()=>{ await C.wait(350); setSwMood("talk"); await C.say("prompt"); setSwMood("point"); busy = false; idle.arm(); });
    }
  },

  RHYME_PICK: {
    /* deck pages 14, 21 and the two sentences (guided): the word (its picture + word) or the sentence with its blank,
       and three options - words only (pages 14, 21) or picture + word (the sentences). The deck's ladder: hint 1, hint 2
       (the options said), hint 3 (the answer said - the right card lights, the others fade). A sentence's right word flies
       into its blank. data: { target:{word, img, audio} | sentence:[before, after], options, pictures }.
       audio: prompt, hint1, hint2, hint3. */
    mount(host, slide){
      const d = slide.data, C = JK.ctx(slide, host);
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point");
      const wrap = JK.add(host, "div", "jl-q" + (d.sentence ? "" : " ref-q"));
      let blank = null;
      /* the sentence as word spans (user 2026-11-05: each word lights as the voice reads it; the blank on "खाली जगह") */
      const sentWords = [];
      if(d.sentence){ const s = JK.add(wrap, "div", "jl-sentence");
        d.sentence.forEach(l =>{ const p = JK.add(s, "div", "jl-sent-line");
          l.split(/\s+/).filter(Boolean).forEach((t, i)=>{ if(i) p.appendChild(document.createTextNode(" "));
            if(t.indexOf("____") >= 0){ blank = JK.add(p, "span", "jl-blank"); blank._say = "खाली"; sentWords.push(blank);
              const rest = t.replace("____", ""); if(rest) p.appendChild(document.createTextNode(rest)); }
            else { const w = JK.add(p, "span", "jl-sw"); w.textContent = t; w._say = t; sentWords.push(w); } }); }); }
      else { const t = jlQPic(JK.add(wrap, "div", "jl-qpics"), d.target); t.onclick = ()=>{ if(!isPlaying && C.alive() && !state.locked){ PVSFX.tap(); C.sayId(d.target.audio).catch(()=>{}); } }; }
      JK.speaker(C);
      JK.run(C, async ()=>{
        await C.wait(250);
        const wrong = await jlPick(C, wrap, { options: d.options, pictures: !!d.pictures, ref: !d.sentence, keep_order: true,
          /* user 2026-11-04: 1st wrong - hint 1; 2nd - the options said again, each lighting as it is said; 3rd - the others
             are disabled, then hint 3 */
          ladder: async (n, M)=>{ if(n === 1) await C.say("hint1");
            else if(n === 2) await jlSayWithGlow(C, "hint2", M.els.map(b => [b, b._o.word]));
            else { M.lock(); await C.say("hint3"); } },
          onRight: async b =>{ if(!blank) return;
            const a = b.getBoundingClientRect(), z = blank.getBoundingClientRect(), k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
            const fly = b.querySelector(".jl-opt-word"); fly.style.transition = "translate .6s cubic-bezier(.3,.8,.3,1)";
            const fr = fly.getBoundingClientRect();
            fly.style.translate = ((z.left + z.width / 2 - fr.left - fr.width / 2) / k) + "px " + ((z.top + z.height / 2 - fr.top - fr.height / 2) / k) + "px";
            await C.wait(620); blank.textContent = b._o.word; blank.classList.add("filled"); JK.pop(blank); b.style.visibility = "hidden"; },
          onReady: M =>{
            /* the sentence read: each of its words lit as it is said (found in the line in order, after the instruction) */
            const f = sentWords.length ? jlWordFracs(slide.audio.prompt, sentWords.map(w => w._say), false) : [];
            const on = w =>{ sentWords.forEach(x => x.classList.toggle("now", x === w)); };
            const extra = sentWords.map((w, i)=> [f[i], ()=> on(w)]);
            const last = f.filter(x => x != null).pop();
            if(last != null) extra.push([last + .06, ()=>{}]);
            return jlAskWithOptions(C, M, "prompt", extra, ()=> on(null));
          } });
        recordResult(slide, wrong === 0);
        completeSlide(wrong === 0);
      });
    }
  },

  RHYME_YESNO: {
    /* deck page 20: "मिठाई- चूल्हा, क्या यह तुकांत शब्द हैं?" - the two words (each says itself when tapped), हाँ / नहीं.
       The deck's three hints, as RHYME_PICK. data: { a, b, rhymes, yes:{word, audio}, no }. audio: prompt, hint1-3. */
    mount(host, slide){
      const d = slide.data, C = JK.ctx(slide, host);
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point");
      const wrap = JK.add(host, "div", "jl-q ref-q");
      const pair = JK.add(wrap, "div", "jl-qpics two"), pics = [];
      [d.a, d.b].forEach((w, i)=>{
        const c = jlQPic(pair, w); pics.push([c, w.word]); c.onclick = ()=>{ if(!isPlaying && C.alive() && !state.locked){ PVSFX.tap(); C.sayId(w.audio).catch(()=>{}); } }; });
      JK.speaker(C);
      JK.run(C, async ()=>{
        await C.wait(250);
        const wrong = await jlPick(C, wrap, { keep_order: true, ref: true, signal: "rhyme_judge_correct",
          options: [{ ...d.yes, correct: d.rhymes === true }, { ...d.no, correct: d.rhymes === false }],
          /* user 2026-11-04 (as pages 11 / 13): hint 2 says "मिठाई, चूल्हा।" - each picture lights as it is said */
          ladder: async (n, M)=>{ if(n === 1) await C.say("hint1");
            else if(n === 2) await jlSayWithGlow(C, "hint2", pics);
            else { M.lock(); await C.say("hint3"); } },
          onReady: M => jlAskWithOptions(C, M, "prompt") });
        recordResult(slide, wrong === 0);
        completeSlide(wrong === 0);
      });
    }
  },

  RHYME_BOXES: {
    /* deck pages 19 (x6), as a game (user 2026-11-05: "more interesting for kids and gamified" - the jalebi shop journey):
       a winding market path with the six gift boxes (six colours) at its stops and the halwai's shop at its end. Muniya
       walks the path - the stretch she walks turns gold behind her - and stops beside the next box, which bounces;
       "डिब्बे को खोलने के लिए उस पर टैप कीजिए।" (7s idle: the hand on that box + the line again). A tapped box opens and its
       question comes up (pages 11-13's layout: the word's picture box, three answers coming in as they are said). Help
       (the deck): 1 the wrong word wiggles with the wrong sound, 2 the options said again, each lighting, 3 the hand on
       the right word. Answered: back to the path, the box open with its tick, Muniya walks on; after the sixth she walks
       to the shop, the halwai's sign bounces, confetti - then the trophy.
       data: { path:[[x, y] start, 6 stops, shop], boxes:[{hue}], questions:[{prompt_hi, audio:{prompt, hint2}, target,
       options}], closed, open, muniya, shop, plate }. audio: prompt. */
    mount(host, slide){
      const d = slide.data, C = JK.ctx(slide, host), Q = d.questions, P = d.path, NS = "http://www.w3.org/2000/svg";
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point");
      const wrap = JK.add(host, "div", "jl-journey"), map = JK.add(wrap, "div", "jl-map");
      const svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "jl-map-svg"); svg.setAttribute("viewBox", "0 0 1253 500");
      svg.setAttribute("width", "1253"); svg.setAttribute("height", "500"); map.appendChild(svg);
      const path = (dd, cls)=>{ const e = document.createElementNS(NS, "path"); e.setAttribute("d", dd); e.setAttribute("class", cls); svg.appendChild(e); return e; };
      /* the path through its points, smooth (Catmull-Rom as cubic Béziers), one segment per stretch */
      const pt = i => P[Math.max(0, Math.min(P.length - 1, i))];
      const seg = i =>{ const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        return "M" + p1 + " C" + c1 + " " + c2 + " " + p2; };
      const whole = P.slice(0, -1).map((_, i)=> seg(i)).join(" ");
      path(whole, "jl-road-edge"); path(whole, "jl-road"); path(whole, "jl-road-dash");
      const lit = P.slice(0, -1).map((_, i)=>{ const e = path(seg(i), "jl-road-lit"); e.style.setProperty("--len", e.getTotalLength()); return e; });
      const startPad = JK.add(map, "div", "jl-start"); startPad.style.left = P[0][0] + "px"; startPad.style.top = P[0][1] + "px";
      /* the six boxes at the stops, the shop at the end */
      const boxes = Q.map((q, i)=>{ const b = JK.add(map, "button", "jl-gift jl-stop"); b.type = "button"; b.disabled = true;
        b.style.left = P[i + 1][0] + "px"; b.style.top = P[i + 1][1] + "px"; b.style.setProperty("--hue", (d.boxes[i] && d.boxes[i].hue || 0) + "deg");
        b.setAttribute("aria-label", "डिब्बा " + (i + 1));
        b.innerHTML = '<span class="jl-gift-vis"><img class="gift-closed" src="' + d.closed + '" alt=""><img class="gift-ribbon gift-ribbon-left" src="' + d.closed + '" alt="">' +
          '<img class="gift-ribbon gift-ribbon-right" src="' + d.closed + '" alt=""><img class="gift-open" src="' + d.open + '" alt=""></span><span class="jl-gift-tick">✓</span>';
        return b; });
      const end = P[P.length - 1], shop = JK.add(map, "div", "jl-shop");
      shop.style.left = end[0] + "px"; shop.style.top = end[1] + "px";
      shop.innerHTML = '<div class="jl-awning"></div><div class="jl-sign"><img src="' + d.shop + '" alt=""></div><img class="jl-plate" src="' + d.plate + '" alt="">';
      /* Muniya: her feet beside the stop she is at (start: on the start pad; boxes: left of the box; shop: left of the shop) */
      const mu = JK.add(map, "img", "jl-muniya"); mu.src = d.muniya; mu.alt = "मुनिया"; mu.draggable = false;
      const OFF = k => k === 0 ? [0, 34] : k === P.length - 1 ? [-118, 86] : [-78, 50];
      const place = (x, y)=>{ mu.style.left = x + "px"; mu.style.top = y + "px"; };
      place(P[0][0] + OFF(0)[0], P[0][1] + OFF(0)[1]);
      /* a walk from point k to k + 1 along the path, three little hops on the way; the stretch turns gold behind her */
      const walk = k => new Promise(res =>{
        const e = lit[k], L = e.getTotalLength(), o0 = OFF(k), o1 = OFF(k + 1), N = 30, HOPS = 3, frames = [];
        for(let j = 0; j <= N; j++){ const t = j / N, p = e.getPointAtLength(L * t), h = Math.abs(Math.sin(t * Math.PI * HOPS)) * 22;
          frames.push({ left: (p.x + o0[0] + (o1[0] - o0[0]) * t) + "px", top: (p.y + o0[1] + (o1[1] - o0[1]) * t - h) + "px" }); }
        e.classList.add("on"); PVSFX.move();
        [1, 2, 3].forEach(n => setTimeout(()=>{ if(C.alive()) PVSFX.appear(); }, (1500 / HOPS) * n - 40));
        const last = frames[frames.length - 1];
        const fin = ()=>{ place(parseFloat(last.left), parseFloat(last.top)); res(); };
        const an = JK.reduce() ? null : mu.animate(frames, { duration: 1500, easing: "linear" });
        if(an) an.onfinish = fin; else fin();
      });
      let at = -1, cur = null, busy = true;
      const header = t =>{ $("promptText").textContent = t; };
      const W = { live: ()=> cur === null && at >= 0 && !state.locked, busy: ()=> busy }; C.waits.push(W);
      const idle = JK.idle(C, async ()=>{ if(busy || cur !== null || at < 0) return; placeNudge(boxes[at]); busy = true; await C.say("prompt"); busy = false; });
      /* the box Muniya stands at bounces and asks to be opened */
      const invite = async ()=>{
        boxes.forEach((b, i)=>{ b.classList.toggle("next", i === at); b.disabled = i !== at; });
        header(slide.prompt_hi); setSwMood("talk"); busy = true; await C.say("prompt"); setSwMood("point"); busy = false; idle.arm();
      };
      const quest = JK.add(wrap, "div", "jl-quest"); quest.hidden = true;
      boxes.forEach((b, i)=> b.addEventListener("click", ()=>{
        if(busy || i !== at || cur !== null || !C.alive()) return;
        busy = true; idle.stop(); stopNudge(); stopAudio(); cur = i; b.classList.remove("next"); b.disabled = true;
        playSfxFile("sfx_gift_open", 0.8); b.classList.add("is-opening");
        JK.run(C, async ()=>{
          await C.wait(1000);
          const q = Q[i], qs = { ...slide, id: slide.id + "_box" + (i + 1), audio: q.audio };
          const QC = { ...C, slide: qs, say: (role, cues)=> C.clip(audioFor(qs, role), cues, role) };
          quest.innerHTML = ""; quest.hidden = false; quest.classList.remove("out"); void quest.offsetWidth; quest.classList.add("in");
          header(q.prompt_hi);
          const box = JK.add(JK.add(quest, "div", "jl-quest-in"), "div", "jl-q ref-q");
          const t = jlQPic(JK.add(box, "div", "jl-qpics"), q.target);
          t.onclick = ()=>{ if(!isPlaying && C.alive()){ PVSFX.tap(); C.sayId(q.target.audio).catch(()=>{}); } };
          busy = false;
          const wrong = await jlPick(QC, box, { options: q.options, key: qs.id, signal: "rhyme_box_correct", ref: true,
            ladder: async (n, M)=>{ if(n === 2) await jlSayWithGlow(QC, "hint2", M.els.map(x => [x, x._o.word])); else if(n >= 3) placeNudge(M.right); },
            /* the question, then each option comes in as its own word is said (user 2026-11-04) */
            onReady: M =>{ setSwMood("talk"); QC.say("prompt").then(async ()=>{
              for(const x of M.els){ M.show(x); await C.sayId(x._o.audio); await C.wait(150); }
              setSwMood("point"); M.ready(); }).catch(()=>{}); } });
          stopNudge(); recordResult(qs, wrong === 0);
          b.classList.remove("is-opening"); b.classList.add("solved");
          quest.classList.remove("in"); quest.classList.add("out"); await C.wait(380); quest.hidden = true; quest.innerHTML = ""; cur = null;
          header(slide.prompt_hi); JK.pop(b.querySelector(".jl-gift-tick")); PVSFX.appear();
          await C.wait(350);
          if(i === Q.length - 1){
            busy = true; state.locked = true;
            await walk(i + 1);                                    // to the shop
            shop.classList.add("cheer"); sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
            GameBus.emit("rhyme_boxes_done", { slide_id: slide.id, phase: slide.phase });
            await C.wait(1900); completeSlide(true); return;
          }
          await walk(i + 1); at = i + 1;
          await invite();
        });
      }));
      JK.speaker(C, async ()=>{ if(cur !== null) return; idle.stop(); await C.say("prompt"); idle.arm(); });
      JK.run(C, async ()=>{
        await C.wait(300);
        boxes.forEach((b, i)=> setTimeout(()=>{ if(C.alive()){ JK.pop(b); PVSFX.appear(); } }, i * 120));
        await C.wait(900);
        await walk(0); at = 0;
        await invite();
      });
    }
  },

  TROPHY_REWARD: {
    /* deck page 28 (after the six boxes): the trophy, its three stars pop in one by one with the fanfare, then the
       celebration. data: { image }. */
    mount(host, slide){
      const d = slide.data, C = JK.ctx(slide, host);
      state.ownsAudio = true; state.locked = true; setNavActive(false); $("navBtn").style.display = "none"; state.replayAudio = ()=>{};
      const root = JK.add(host, "div", "trophy-reward-stage");
      const art = JK.add(root, "div", "trophy-reward-art"); art.setAttribute("role", "img"); art.setAttribute("aria-label", "सुनहरी ट्रॉफी");
      const img = cls =>{ const i = JK.add(art, "img", cls); i.src = d.image; i.alt = ""; i.draggable = false; return i; };
      img("trophy-reward-base");
      const stars = ["left", "middle", "right"].map(p => img("trophy-reward-star trophy-star-" + p));
      JK.run(C, async ()=>{
        await C.wait(250); art.classList.add("is-entered"); playSfxFile("sfx_trophy_fanfare", 0.8);
        for(const s of stars){ await C.wait(650); s.classList.add("is-revealed"); playSfxFile("sfx_star_pop_new", 0.8); }
        await C.wait(1500); root.classList.add("is-exiting"); await C.wait(400);
        completeSlide(true);
      });
    }
  },

  CELEBRATION: {
    /* HI02H11_L02_S02's end screen (user 2026-10-23: "exact same"): no text, the sunburst and the star burst, the
       celebration sound, the arrow there from the start; Swifty is the celebration kit's (below): she jumps and cheers
       first, then says the line, lip-synced. Our line ("शाबाश! अब आप संख्याएँ घटाना सीख गए हैं।") and the arrow's
       hand-off to the host stay. */
    mount(host, slide){
      playSfx(slide.audio && slide.audio.sfx ? slide.audio.sfx : "sfx_celebrate");
      const et = $("endTitle"); if(et) et.textContent = "";
      const st = $("endSubtitle"); if(st) st.textContent = "";
      const es = $("endScreen"); es.classList.add("show", "hint-glow");
      document.body.classList.add("is-end");
      const c = $("confetti"); c.innerHTML = "";
      starBurst();
      const masteryScore = state.masteryAttempts ? (state.masteryHits / state.masteryAttempts) : 0;
      GameBus.emit("mastery_score", { value: masteryScore, hits: state.masteryHits, attempts: state.masteryAttempts });
      GameBus.emit("lesson_completed", { skill_code: CARD.skill_code, total_signals: GameBus.signals.length });
      runValidator();
      setNavActive(false);
      const eb = $("endBtn"); eb.classList.add("show", "hint-glow");
      state.endBtnPending = false;
      if(new URLSearchParams(location.search).has("dev") && !$("dlResults")){
        const dl = document.createElement("button"); dl.id = "dlResults"; dl.textContent = "⬇ results JSON";
        dl.style.cssText = "position:absolute;bottom:20px;left:20px;z-index:5;font-family:var(--font-hi);font-weight:700;font-size:16px;padding:8px 16px;border-radius:12px;border:2px solid #B7DCFB;background:#fff;color:var(--navy);cursor:pointer;";
        dl.onclick = ()=> GameBus.downloadResults();
        es.appendChild(dl);
      }
      eb.onclick = ()=>{
        if(eb.dataset.done === "1") return;
        eb.dataset.done = "1"; eb.disabled = true;
        const firstTryScore = state.masteryAttempts ? (state.masteryHits / state.masteryAttempts) : 0;
        XAPI.once("activity_completed",
          { skill_code: CARD.skill_code, part: CARD.part_label },
          { completed: true, completion: true, progress: 100, score: firstTryScore,
            first_try_correct: state.masteryHits, questions: state.masteryAttempts,
            duration_ms: Date.now() - GameBus.startedAt });
        GameBus.emit("proceed_next", { skill_code: CARD.skill_code, part: CARD.part_label });
        try{ window.parent?.postMessage({type:"swiftpal:proceed", skill_code:CARD.skill_code, part:CARD.part_label}, "*"); }catch(e){}
      };
    }
  }
};
const SlideModules = JalebiModules;
/* ---------- [jalebi landing] the first screen: the lesson's title art in File6's landing card (its sky, frame, Swiftee,
   speaker and play button). The title is painted in the art, so the engine's text title stays for screen readers only.
   No intro animation: the play button arrives when the greeting ends (the shell's "sg-intro-done" rule). ---------- */
const JLanding = {
  files(h){ return h && h.src ? [h.src.replace(/^assets\//, "")] : []; },
  intro(){ window.__sgIntroDone = true; document.dispatchEvent(new Event("sg-intro-done")); }
};


/* VACHAN (एकवचन/बहुवचन) + any 2-category attribute reuse the GENERIC gender modules — identical
   mechanic, just different labels. A vachan game authors these types with the category in the
   "gender" field (e.g. "S"/"P"), the two labels, and (for pairs) f=singular / m=plural; it then
   inherits immediate tap-to-answer feedback, speak-word-on-tap, layered hints, and the engine
   guard for free. Named *_VACHAN (not *_NUMBER) to avoid colliding with MEET_NUMBER = counting. */

/* ---------- 13. CONTROLLER ---------- */
/* ===== FLN ANIMATION KIT: star-burst (call site) BEGIN =====
   Recipe 8 is a RETUNE of the function below, which was already the shipped
   HI01H05 original: fewer and slower (150 ticks / decay .975 / startV 14 /
   32 stars + 8 circles / spin .18 / shots 0-220-440, against 100 / .96 / 22 /
   80 + 20 / .3 / 0-150-300). Travel distance is held at ~547px so it still
   fills the same area - only the density and pace change.
   The original is kept as _starBurstOld, unreferenced, to make this reversible. */
function starBurst(){ FLNMotion.starBurst.fire({ host: "#confetti" }); }
function clearHost(){
  document.body.classList.remove("is-end");   // r4: clear immersive end state when leaving celebration
  /* user 2026-10-23: going back from the celebration (dev menu) left its Swifty on screen - the end screen, its button and
     the kit's Swifty are put away whenever another page mounts */
  { const es = $("endScreen"); if(es) es.classList.remove("show", "hint-glow");
    const eb = $("endBtn"); if(eb){ eb.classList.remove("show", "hint-glow"); eb.disabled = false; delete eb.dataset.done; }
    const cb = document.getElementById("celBox"); if(cb) cb.innerHTML = "";
    const cf = $("confetti"); if(cf) cf.innerHTML = ""; state.endBtnPending = false; }
  $("slideHost").innerHTML = "";
  $("hintBtn").classList.remove("show");
  $("hintBtn").disabled = false;
  setNavActive(false);
  stopNudge();
  stopAudio();
}

/* [loading] a slide mounts once its own files are in (Assets.whenSlide: at once, same tick, when they already are).
   The token keeps the LAST request: two quick jumps never mount the older slide on top of the newer. */
let _mountTok = 0;
function mountSlide(idx){ const t = ++_mountTok; Assets.whenSlide(idx, ()=>{ if(t !== _mountTok) return;
    /* from one question to the next (guided / practice, same phase): the old screen slides out, the new one slides in */
    const cur = CARD.slides[state.idx], nx = CARD.slides[idx], host = $("slideHost");
    const q = s => s && (s.phase === "guided" || s.phase === "practice") && s.type !== "CELEBRATION";
    if(host && cur && q(cur) && q(nx) && idx === state.idx + 1 && cur.phase === nx.phase && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)){
      host.classList.remove("q-in"); host.classList.add("q-out"); try{ PVSFX.move(); }catch(e){}
      setTimeout(()=>{ if(t !== _mountTok) return; host.classList.remove("q-out"); window.__qIn = true; mountSlideNow(idx); }, 340);
    } else mountSlideNow(idx); }); }
function mountSlideNow(idx){
  state.idx = idx;
  state.slideStart = Date.now();
  state.attempts = 0; state.selectedKey = null; state.locked = false;
  state.hintUsed = false; state.nudgeUsed = false; state.scaffoldLevel = 0; state.hintActive = false;
  state.audioReplays = 0; state.gateNavUntilAudio = false; state.endBtnPending = false;
  state.speakerLive = undefined; state.seqTalk = false; state.slideDone = false;   // [QA BUG_09/07] the speaker, per page
  state.replayAudio = null;   // a module may set a slide-specific replay (e.g. teach slides whose
                              // audio roles aren't in the autoPlayChain order); else the chip replays the chain
  state.ownsAudio = false;    // a module that drives its OWN audio sequence sets this → skip autoPlayChain
                              // (else the auto prompt-chain stomps/truncates the module's timed VO)
  const slide = CARD.slides[idx];
  bgmFor(slide.phase);        // QA checklist 2026-10-05: the practice game gets its own music (when shipped)
  /* [14] question_started - only on slides that actually ask something */
  try{ if(XAPI_ANSWERABLE.indexOf(slide.type) >= 0)
         XAPI.send("question_started", { slide_id: slide.id, type: slide.type, phase: slide.phase }); }catch(e){}
  clearHost();

  // header prompt
  $("promptText").textContent = slide.prompt_hi || "";

  // Hint button stays HIDDEN until the learner makes a wrong attempt, then it is
  // exposed (graduated scaffold). Mastery uses the SAME scaffold — not excluded.
  $("hintBtn").classList.remove("show");
  $("hintBtn").style.display = "";
  $("navBtn").style.display = "";        // restored by default; tap-to-answer slides hide it themselves
  $("navBtn").style.left = "";           // (T3 sets its own place for it: beside the door - every other slide, bottom centre)
  // [16i] DEFAULT nav wiring — a module that enables आगे without overriding onclick still advances.
  // (DEMO_COUNT shipped an enabled-but-dead button; auto-INTRO inherited an unfulfillable tap guard.)
  /* one tap completes the slide: a 2nd tap while the confetti lands (before the next slide mounts) sent slide_completed again */
  { let navDone = false; $("navBtn").onclick = ()=>{ if(navDone || state.idx !== idx) return; navDone = true; setNavActive(false); completeSlide(true); }; }
  setSwMood("point");                    // Swiftie turns to present each new slide

  GameBus.emit("slide_entered", { slide_id: slide.id, phase: slide.phase, eis: slide.eis, type: slide.type, idx });

  // audio chip = replay the slide audio. Prefer a module-supplied replay (teach slides own their
  // count_intro/explain sequence, which autoPlayChain deliberately skips), else replay the chain.
  $("audioChip").onclick = ()=>{
    if(!replayTap(slide, "header_chip")) return;
    if(state.replayAudio) state.replayAudio(); else autoPlayChain(slide);
  };

  // mount the type
  const mod = SlideModules[slide.type];
  if(!mod){ console.error("[engine] no module for", slide.type); return; }
  // [engine JS] r4/F1 TEACHING FRAME: tutorial slides mount inside a grid-paper .tut-card (header hidden,
  // prompt in-card, standing Swiftie bottom-left + shoulder audio chip). Type-agnostic — any tutorial-phase
  // module renders into the card. Non-tutorial slides mount bare into slideHost as before.
  const isTut = (slide.phase === "tutorial" && slide.type !== "PHASE_TRANSITION" && slide.type !== "CELEBRATION");
  $("stage").classList.toggle("tut", isTut);
  // data.no_head: no header band / Swiftie on this slide - its instruction is its VO only (P4, review 2026-10-07)
  $("stage").classList.toggle("no-head", !!(slide.data && slide.data.no_head));
  document.body.classList.toggle("tut-page", isTut);
  // a slide's own backdrop (data.bg, CSS .stage[data-bg]) - only while that slide is up; its module sets --horizon
  $("stage").dataset.bg = (slide.data && slide.data.bg) || ""; $("stage").style.removeProperty("--horizon");
  let mountHost = $("slideHost");
  if(isTut){
    const card = document.createElement("div"); card.className = "tut-card";
    card.innerHTML = `<div class="tut-prompt">${slide.prompt_hi || ""}</div>` +
      `<img class="tut-mascot" src="assets/start_mascot.webp" alt="" onerror="this.style.display='none'">` +
      /* [05][11] QA CHECKLIST: the in-slide speaker chip is the inline SVG -
         gradient + white ring + wave arcs - never a flat PNG. Verbatim HI01. */
      `<span class="tut-audio" role="button" aria-label="फिर से सुनो"><svg viewBox="0 0 62 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Audio"><g filter="url(#tutChipShadow)"><rect x="8" y="4" width="46" height="44" rx="22" fill="url(#tutChipGrad)"/><rect x="6" y="2" width="50" height="48" rx="24" stroke="white" stroke-width="4"/><path d="M29.8466 19.0574C29.8804 19.0524 29.9145 19.0496 29.9487 19.0488C30.6094 19.0317 31.0021 19.5124 31.0015 20.1414C31.0008 20.9661 31.0003 21.7911 31.0005 22.6158L31.001 27.7212L31.0009 30.5591C31.0009 31.0364 31.0122 31.5472 30.9863 32.0228C30.9662 32.2709 30.902 32.4608 30.7251 32.643C30.3831 32.9952 29.8337 33.0842 29.4386 32.7671C29.0784 32.4781 28.7473 32.1159 28.4181 31.7862L26.4414 29.8087C26.1771 29.5426 25.9071 29.2636 25.6339 29.0081C25.0227 28.9649 24.3645 29.017 23.7487 28.9979C23.445 28.9885 23.1625 29.0211 22.8589 28.9606C22.3751 28.8616 22.0618 28.4823 22.0642 27.9824C22.0706 26.5937 22.0287 25.1949 22.0828 23.8081C22.0884 23.6626 22.2302 23.4334 22.3309 23.3252C22.454 23.1907 22.6146 23.0963 22.792 23.0543C23.0567 22.9904 23.5328 23.016 23.8224 23.0128C24.4143 23.0063 25.0171 23.0277 25.609 23.0073C25.6794 22.9529 25.8505 22.7743 25.919 22.706L26.5305 22.0945L28.5396 20.0838C28.9157 19.7059 29.3217 19.1749 29.8466 19.0574Z" fill="white"/><path class="wv wv2" d="M36.2367 18.6905C36.8783 18.6449 37.3041 19.231 37.6725 19.6829C38.7675 21.0046 39.4982 22.5894 39.7923 24.2804C40.2503 26.8763 39.6548 29.5478 38.1378 31.7035C37.8393 32.1274 37.508 32.5324 37.149 32.9063C36.9404 33.1236 36.7646 33.2558 36.4622 33.3081C36.2013 33.3412 35.9378 33.2717 35.7272 33.1144C35.5185 32.9615 35.3816 32.7298 35.3483 32.4733C35.2786 31.9235 35.5696 31.6821 35.8914 31.3297C36.0448 31.1639 36.1901 30.9908 36.3269 30.811C38.3669 28.136 38.4986 24.4654 36.6555 21.6511C36.4826 21.3899 36.2966 21.1376 36.0984 20.8951C35.8252 20.5652 35.3947 20.2691 35.3472 19.8184C35.2845 19.2225 35.6439 18.768 36.2367 18.6905Z" fill="white"/><path class="wv wv1" d="M33.3868 21.5044C33.9769 21.4549 34.2563 21.7845 34.5981 22.1981C35.1982 22.924 35.6149 23.7691 35.8211 24.6886C36.171 26.2384 35.8867 27.8637 35.0314 29.2026C34.7421 29.6568 34.2333 30.3745 33.6937 30.4946C33.1633 30.5437 32.6759 30.2927 32.5495 29.7376C32.3921 29.0462 32.9849 28.6956 33.3274 28.1763C34.2088 26.833 34.1932 25.0908 33.288 23.7635C33.0747 23.4522 32.6159 23.0564 32.5518 22.7133C32.4377 22.1027 32.7745 21.619 33.3868 21.5044Z" fill="white"/></g><defs><filter id="tutChipShadow" x="0" y="0" width="62" height="60" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="4"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter><linearGradient id="tutChipGrad" x1="8" y1="26" x2="54" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#1987FC"/><stop offset="1" stop-color="#1565F4"/></linearGradient></defs></svg></span>`;
    const inner = document.createElement("div"); inner.className = "tut-content";
    card.insertBefore(inner, card.querySelector(".tut-mascot"));
    card.querySelector(".tut-audio").onclick = ()=>{
      if(!replayTap(slide, "tut_chip")) return;
      if(state.replayAudio) state.replayAudio(); else autoPlayChain(slide);
    };
    $("slideHost").appendChild(card);
    mountHost = inner;
  }
  mod.mount(mountHost, slide);
  // game-feel: animate the slide content in on every mount
  { const _sh = $("slideHost"), qi = !!window.__qIn; window.__qIn = false; _sh.classList.remove("slide-in", "q-in"); void _sh.offsetWidth; _sh.classList.add(qi ? "q-in" : "slide-in"); }

  // vertically ink-centre every Devanagari glyph once the slide has laid out
  requestAnimationFrame(()=> centerAllGlyphs($("slideHost")));

  // play the full VO chain automatically (prompt → phoneme/word_name → instruction).
  // If the slide gated its nav button on audio, enable it once the chain finishes
  // (so students can't skip before hearing it). SKIP when the module owns its audio
  // (state.ownsAudio) — else this chain stomps/truncates the module's own timed VO.
  if(!state.ownsAudio){
    autoPlayChain(slide, ()=>{
      if(state.gateNavUntilAudio) setNavActive(true);
      if(state.endBtnPending){ $("endBtn").classList.add("show"); state.endBtnPending = false; }
    });
  }
}

/* ---------- [engine JS] r4/P1 PHASE-TRANSITION PEEK GATE (Shruti's peek beat) ----------
   An automatic interstitial fired ON A PHASE BOUNDARY (not a slide type): blur the stage, Swiftie
   peeks up from the bottom under a big headline, hold ≥2s, then mount the next slide. Kept ALONGSIDE
   our journey-map PHASE_TRANSITION module (a distinct, author-placed slide type) — the gate below
   skips PHASE_TRANSITION + CELEBRATION so the two never double-fire. */
function afterConfetti(fn){
  /* ===== FLN ANIMATION KIT: confetti (advance gate) BEGIN =====
     Recipe 7 renders into .fx-confetti, not the retired .conf-shot, so this gate
     was about to poll for an element that can no longer exist and wave every
     slide straight through mid-celebration. FLNMotion.confetti.after() is the
     kit's own version of this poll, with the same 8s cap. */
  FLNMotion.confetti.after(fn);
  /* ===== FLN ANIMATION KIT: confetti (advance gate) END ===== */
}
/* onscreen headline per gate (display only; distinct from any narration). Eligibility = phase IN this map. */
const PHASE_GATE_TITLE = { tutorial:"चलिए, शुरू करें!", guided:"चलिए, साथ में करें!", practice:"अब आपकी बारी!" };   // HI02H11_L02_S02's headlines (user 2026-10-23: "exact same")   // QA checklist 2026-10-05: the headlines are exactly the lines Swiftie speaks (each VO is now that line alone), so the text appears only as she says it
const PHASE_GATE_VO    = { tutorial:"vo_pt_tutorial", guided:"vo_pt_guided", practice:"vo_pt_practice" };
const ANIM_ASSETS = ["loader.webp", "new_landing_swiftee_anim.webp", "peeking_talk_up.webp", "sw_head_celebrate_anim.webp", "sw_head_hint_anim.webp", "sw_head_tryagain_anim.webp"];
/* [gate] THE THREE TRANSITION SCREENS OF HI02H11_L02_S02 (its r142 - Hindi-game-gender-identify's screen), user 2026-10-23:
   "extract the same all three transition". Rule for rule:
   - Swifty is peeking_talk_up.webp (900x900, already up and talking), bottom-anchored, square, 52.8% of the window's
     height (max 624px, never wider than the screen); a .3s lift in (pgUpIn); on the first screen he sinks out (pgPeekDown).
   - a soft whoosh as the screen opens (its sfx_gate_whoosh).
   - the magenta headline with the white stroke is blank until Swifty says it, then wipes in left to right (pgWipe, .9s):
     PHASE_GATE_CUE_MS = where the line starts in OUR clips (each is the line alone: speech at 0.28s), counted from when
     the clip is heard; _fitGateTitle keeps it off his head on any screen.
   - the screen lets go when the line ends (he is shown at least 1.2s, the line whole for at least .7s), with a 12s
     watchdog; the next button is off while it is up; no remount if the child has moved on.
   Our lines (PHASE_GATE_TITLE) and clips (vo_pt_*) are unchanged. Every screen starts the bird from frame 0: a fresh
   blob: URL of the one download (Assets.fresh). */
const PEEK_UP_SRC = "assets/gif/peeking_talk_up.webp";
const PHASE_GATE_CUE_MS = { tutorial: 4200, guided: 250, practice: 680 };   // where the headline is said in OUR clips (HI02H04_L03_S02, 2026-11-03; measured from their pauses - vo_pt_guided is the headline alone)
function _fitGateTitle(){
  try{
    const t = $("phaseGateTitle"), im = $("phaseGateImg"), g = $("phaseGate");
    if(!t || !im || !t.textContent || !g || !g.classList.contains("show")){ window.removeEventListener("resize", _fitGateTitle); return; }
    t.style.removeProperty("top"); t.style.scale = "";
    const ir = im.getBoundingClientRect(); if(!ir.height) return;
    const crest = ir.top + ir.height * 0.38, GAP = 12, EDGE = 8, W = window.innerWidth;
    const tr = t.getBoundingClientRect();
    let sc = Math.min(1, (W - 2 * EDGE) / tr.width);                   // never wider than the screen
    if(tr.top + tr.height * sc > crest - GAP){                          // reaches the bird: lift it
      const room = crest - GAP - EDGE;
      sc = Math.min(sc, room / tr.height);
      sc = Math.max(0.35, sc);
      const top = Math.max(EDGE, crest - GAP - tr.height * sc);
      t.style.setProperty("top", top + "px", "important");
    }
    if(sc < 0.999){ t.style.transformOrigin = "50% 0"; t.style.scale = String(sc); }
  }catch(e){}
}
let _peekUrl = "";
const _gatedPhases = new Set();   // each phase gate plays ONCE (Start→tutorial, →guided, →practice)
let _gateToken = 0;
function phaseBlurTransition(cb, toPhase){
  const tok = ++_gateToken;
  const _idxAtGateOpen = (typeof state !== "undefined") ? state.idx : -1;
  stopNudge(); stopAudio();
  const gate = $("phaseGate"), img = $("phaseGateImg"), cv = $("phaseGateCv");
  if(cv) cv.style.display = "none";
  let _peekStart = Date.now();
  gate.classList.toggle("pg-talk", toPhase === "tutorial");   /* carries the sink on the first gate */
  gate.classList.add("pg-up");
  if(img){ img.style.display = ""; img.removeAttribute("src"); void img.offsetWidth;
           img.onload = function(){ _peekStart = Date.now(); };
           const old = _peekUrl; img.src = _peekUrl = Assets.fresh(PEEK_UP_SRC);
           if(old && old.indexOf("blob:") === 0) setTimeout(()=> URL.revokeObjectURL(old), 1000); }
  const title = $("phaseGateTitle");
  if(title){ title.textContent = ""; title.classList.remove("pg-pop"); title.style.removeProperty("top"); title.style.scale = ""; }
  $("stage").classList.add("blurred", "gating");
  document.body.classList.add("gating");
  gate.classList.add("show");
  playSfxFile("sfx_gate_whoosh", 0.7);   /* the screen changes - a soft swish, well before Swifty speaks */
  GameBus.emit("phase_transition", { to: toPhase });
  const closeGate = ()=>{ gate.classList.remove("show"); $("stage").classList.remove("blurred", "gating"); document.body.classList.remove("gating"); };
  setNavActive(false);
  let _gateDone = false, _capT = null, _capAt = 0;
  const finishGate = ()=>{
    if(_gateDone) return;                       // cb() must mount the next slide exactly once
    _gateDone = true;
    gate.classList.add("pg-sink");
    setTimeout(()=> _tearDownGate(), gate.classList.contains("pg-talk") ? 340 : 0);
  };
  const _tearDownGate = ()=>{
    gate.classList.remove("show", "pg-sink");
    clearTimeout(_capT); if(title){ title.textContent = ""; title.classList.remove("pg-pop"); }
    $("stage").classList.remove("blurred");
    if(cb && (_idxAtGateOpen < 0 || state.idx === _idxAtGateOpen)) cb();   // mounts the next slide
    $("stage").classList.remove("gating");      // header returns once the slide is in
    document.body.classList.remove("gating");
  };
  const GATE_WATCHDOG_MS = 12000;
  setTimeout(()=>{ if(tok === _gateToken) finishGate(); }, GATE_WATCHDOG_MS);
  const voId = PHASE_GATE_VO[toPhase];
  const voSrc = (voId && CARD.assets && CARD.assets.audio && CARD.assets.audio[voId]) || null;
  /* the headline arrives with its words: PHASE_GATE_CUE_MS into the clip, counted from when it is heard */
  const _cue = PHASE_GATE_CUE_MS[toPhase];
  const _capText = PHASE_GATE_TITLE[toPhase] || "";
  const _armCaption = ()=>{
    if(!title || !_capText) return;
    const show = ()=>{
      if(tok !== _gateToken || _gateDone) return;
      _capAt = Date.now();
      title.textContent = _capText; title.classList.remove("pg-pop"); void title.offsetWidth; title.classList.add("pg-pop");
      _fitGateTitle(); window.addEventListener("resize", _fitGateTitle);
    };
    if(_cue == null || !voSrc){ _capT = setTimeout(show, 0); return; }
    const t0 = performance.now();
    (function waitVoice(){
      if(tok !== _gateToken) return;
      const on = !!(currentAudio && !currentAudio.paused && currentAudio.currentTime > 0);
      if(on || performance.now() - t0 > 1500){ _capT = setTimeout(show, _cue); return; }
      requestAnimationFrame(waitVoice);
    })();
  };
  _armCaption();
  play(voSrc, ()=>{
    if(tok !== _gateToken){ closeGate(); return; }               // a newer gate superseded us
    const PEEK_MS = 1200;                                          // he is shown at least this long
    const CAP_HOLD_MS = 1600;                                      // and the line whole for .7s (wipe .9s + .7s)
    (function waitPeek(){
      if(tok !== _gateToken){ closeGate(); return; }
      const left = Math.max(PEEK_MS - (Date.now() - _peekStart), _capAt ? CAP_HOLD_MS - (Date.now() - _capAt) : 0);
      if(left > 0){ setTimeout(waitPeek, Math.min(left, 120)); return; }
      finishGate();
    })();
  });
}

function completeSlide(success){
  state.slideDone = true; state.speakerLive = false; state.seqTalk = false;   // [QA BUG_07] answered: the speaker takes no tap
  const slide = CARD.slides[state.idx];
  GameBus.emit("slide_completed", {
    slide_id: slide.id, phase: slide.phase, success: !!success,
    attempts: state.attempts + (success ? 1 : 0), latency_ms: Date.now()-state.slideStart,
    scaffold_level: state.scaffoldLevel, hint_used: state.hintUsed,
    nudge_used: state.nudgeUsed, audio_replays: state.audioReplays
  });
  if(state.idx >= CARD.slides.length - 1){
    // last slide is CELEBRATION; nothing more
    return;
  }
  // advance only AFTER the correct-answer confetti has landed (to the gate AND to the next slide alike).
  const fromIdx = state.idx, nextIdx = state.idx + 1;
  const next = CARD.slides[nextIdx];
  if(next && next.phase !== slide.phase && next.type !== "CELEBRATION" && next.type !== "PHASE_TRANSITION"
     && PHASE_GATE_TITLE[next.phase] && !_gatedPhases.has(next.phase)){
    _gatedPhases.add(next.phase);
    afterConfetti(()=>{ if(state.idx === fromIdx) Assets.whenSlide(nextIdx, ()=>{                   // [loading] the gate + that slide's files
      if(state.idx === fromIdx) phaseBlurTransition(()=> mountSlide(nextIdx), next.phase); }, next.phase); });
    return;
  }
  afterConfetti(()=>{ if(state.idx === fromIdx) mountSlide(nextIdx); });
}

/* ---------- 14. VALIDATOR (runtime self-check) ---------- */
function runValidator(){
  const missing = (CARD.signals_expected || []).filter(s => !GameBus.firedSet.has(s));
  GameBus.validatorReport.missing_signals = missing;
  GameBus.validatorReport.passed = missing.length === 0;
  console.log("[validator]", GameBus.validatorReport);
  try{ window.parent?.postMessage({type:"swiftpal:lesson_complete", signals: GameBus.signals, validatorReport: GameBus.validatorReport}, "*"); }catch(e){}
  // offline self-capture: write the final record to localStorage; optionally POST
  // it to a learning-record endpoint if one is configured AND the device is online.
  GameBus.persist();
  if(TELEMETRY.endpoint && navigator.onLine){
    try{ fetch(TELEMETRY.endpoint, {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(GameBus.exportResults()), keepalive:true}).catch(()=>{}); }catch(e){}
  }
  // dev banner
  if(new URLSearchParams(location.search).has("dev")){
    const b = $("devBanner");
    if(missing.length === 0){ b.textContent = "✓ all expected signals fired"; b.className = "dev-banner show ok"; }
    else { b.textContent = "✗ missing signals: " + missing.join(", "); b.className = "dev-banner show"; }
  }
}

/* ---------- [engine JS] r4/#2 DATA-DRIVEN LANDING CONCEPT STRIP ----------
   A landing_hero of kind "concept_strip" renders N visual-example tiles from card data, so any game
   declares its landing preview in card.json instead of hand-editing HTML. Tile types: discs (size),
   bars (length), balance (weight — equal-size objects, heavier lower, never a size cue), image. */
const SG_BALANCE_SVG =
  '<svg viewBox="0 0 124 112" xmlns="http://www.w3.org/2000/svg">' +
  '<line x1="62" y1="30" x2="62" y2="86" stroke="#8AA0C8" stroke-width="6" stroke-linecap="round"/>' +
  '<polygon points="62,60 44,100 80,100" fill="#8AA0C8"/>' +
  '<g transform="rotate(-13 62 34)">' +
  '<rect x="14" y="30" width="96" height="11" rx="5.5" fill="#4EA3F0"/>' +
  '<circle cx="22" cy="20" r="14" fill="#FBD24B" stroke="#D9A21A" stroke-width="2.5"/>' +
  '<circle cx="102" cy="20" r="14" fill="#98A2B3" stroke="#5B6577" stroke-width="2.5"/>' +
  '</g></svg>';
function conceptTileHTML(c){
  const lbl = c && c.label ? ` aria-label="${c.label}"` : "";   // a11y only; not shown (pre-reader → visual+VO)
  switch(c && c.type){
    case "discs": {
      const sizes = c.sizes || [34, 54, 76];
      return `<div class="sg-ex sg-ex-size" role="img"${lbl}>` +
        sizes.map(s => `<span class="sg-disc" style="width:${s}px;height:${s}px"></span>`).join("") + `</div>`;
    }
    case "bars": {
      const widths = c.widths || [42, 72, 102];
      return `<div class="sg-ex sg-ex-len" role="img"${lbl}>` +
        widths.map(w => `<span class="sg-bar" style="width:${w}px"></span>`).join("") + `</div>`;
    }
    case "balance":
      return `<div class="sg-ex sg-ex-wt" role="img"${lbl}>` + SG_BALANCE_SVG + `</div>`;
    case "image":
      return `<div class="sg-ex" role="img"${lbl}><img src="${c.src}" alt="${c.label || ''}"></div>`;
    default:
      return "";
  }
}

/* ---------- 14b. ASSETS: THE LANDING FIRST, THEN EVERY FILE OF THE LESSON ----------
   The white boot loader holds only until the LANDING's own files are in (tag CRIT: its art, the title font, the play
   button, the greeting + Swiftee's wave) - so the first screen comes up fast. Then every other file in ASSET_SIZES (all
   shipped files, generated from disk) streams in behind the landing while the greeting plays, so nothing loads
   mid-lesson. (A loading bar in the play button's place was tried on 2026-10-06 and taken out at review: "remove this
   loader". The play tap needs no gate of its own - slide 0 mounts through whenSlide, below, which waits for its files.)
     - queue: the landing's files first (nothing else starts until they are in), then SMALLEST FIRST - pictures,
       backdrops and clips land in the first seconds and never wait behind the big animated WebPs. 5 at a time.
     - a fetched file is kept as a Blob: an <img> / <audio> that is later given that file's path gets a blob: URL of it
       instead (the MutationObserver below; play() for the voice element), so "loaded" really means local. A blob: URL
       that fails falls back, once, to the file's own URL. CSS url() backgrounds read the same bytes from the HTTP
       cache the fetch just filled.
     - NEVER BLOCKS: a failed, stalled (STALL_MS without a byte) or over-long (CAP_MS) transfer is aborted and counts as
       done - the element keeps its original src and loads it the normal way. file:// (fetch blocked) is done at once.
   Assets.whenSlide(i, fn): fn runs once slide i's own files are in (same tick when they already are - almost always, as
   the files arrive while the greeting plays); a spinner shows after 300ms and after 8s fn runs anyway. Animations that must restart from frame 0
   (the peeking gate, the cheers) get a fresh blob: URL per restart (Assets.fresh) - no ?r= re-downloads.
   ?noprefetch (QA only) turns the queue off, so a slide's own requests can be watched.
   Formats (2026-10-06): images WebP, audio Ogg/Opus, fonts WOFF2 - Chrome / Edge / Firefox, and Safari 17+ (Ogg Opus
   from Safari 18.4). */
/* @asset-sizes:begin (generated by tools/gen_asset_sizes.js - do not edit by hand) */
const ASSET_SIZES = {
  "assets/bgdeco_spark.svg": 220,
  "assets/bgdeco_star.svg": 391,
  "assets/bgdeco_star_o.svg": 448,
  "assets/btn-play-round-waiting.svg": 2655,
  "assets/btn-play-round.svg": 2645,
  "assets/celebration/cel_idle.webp": 651146,
  "assets/celebration/cel_shabaash.webp": 684852,
  "assets/celebration/cel_talk.webp": 650742,
  "assets/end_screen.webp": 33634,
  "assets/fonts/baloo2-600.woff2": 87020,
  "assets/fonts/baloo2-700.woff2": 86108,
  "assets/fonts/baloo2-800.woff2": 74512,
  "assets/gif/loader.webp": 137428,
  "assets/gif/new_landing_swiftee_anim.webp": 641710,
  "assets/gif/peeking_talk_up.webp": 1561680,
  "assets/gif/sw_head_celebrate_anim.webp": 293618,
  "assets/gif/sw_head_hint_anim.webp": 316076,
  "assets/gif/sw_head_tryagain_anim.webp": 313414,
  "assets/images/chor.webp": 56536,
  "assets/images/chulha.webp": 28890,
  "assets/images/gaana.webp": 25690,
  "assets/images/gift_closed.webp": 41398,
  "assets/images/gift_open.webp": 53534,
  "assets/images/haath.webp": 17160,
  "assets/images/halwai_cover.webp": 38388,
  "assets/images/hathi.webp": 24844,
  "assets/images/map_muniya.webp": 38354,
  "assets/images/mela.webp": 15830,
  "assets/images/nudge_hand_ref.webp": 10828,
  "assets/images/obj_chashni.webp": 34328,
  "assets/images/obj_jalebi.webp": 38068,
  "assets/images/obj_kadai.webp": 27472,
  "assets/images/obj_mithai.webp": 41800,
  "assets/images/paani.webp": 31354,
  "assets/images/ped.webp": 8838,
  "assets/images/phool.webp": 8322,
  "assets/images/raat.webp": 23818,
  "assets/images/raja.webp": 84064,
  "assets/images/scene_1.webp": 44158,
  "assets/images/scene_2.webp": 65134,
  "assets/images/scene_3.webp": 60734,
  "assets/images/scene_4.webp": 64736,
  "assets/images/scene_5.webp": 69758,
  "assets/images/scene_6.webp": 60058,
  "assets/images/sher.webp": 32356,
  "assets/images/title_art.webp": 212930,
  "assets/images/trophy.webp": 80732,
  "assets/last_swifty_end.webp": 1779506,
  "assets/last_swifty_still.webp": 26456,
  "assets/mascot.webp": 8006,
  "assets/nudge_fx_ring_inner.svg": 786,
  "assets/nudge_fx_ring_outer.svg": 769,
  "assets/nudge_fx_sparks.svg": 2476,
  "assets/nudge_hand_new.svg": 6860,
  "assets/sfx/bgm.ogg": 1443997,
  "assets/sfx/sfx_confetti.ogg": 11582,
  "assets/sfx/sfx_correct.ogg": 10099,
  "assets/sfx/sfx_gate_whoosh.ogg": 22384,
  "assets/sfx/sfx_gift_open.ogg": 57809,
  "assets/sfx/sfx_next.ogg": 1538,
  "assets/sfx/sfx_nudge.ogg": 3537,
  "assets/sfx/sfx_play.ogg": 3094,
  "assets/sfx/sfx_star_pop_new.ogg": 7310,
  "assets/sfx/sfx_tap.ogg": 940,
  "assets/sfx/sfx_trophy_fanfare.ogg": 72097,
  "assets/sfx/sfx_whoosh.ogg": 3670,
  "assets/sfx/sfx_wrong.ogg": 6095,
  "assets/start_card.webp": 1024,
  "assets/start_mascot.webp": 18020,
  "assets/startnew_bg_plain.webp": 24446,
  "assets/sw_head_celebrate.webp": 41998,
  "assets/sw_head_hint.webp": 36812,
  "assets/sw_head_talking.webp": 37384,
  "assets/sw_head_tryagain.webp": 48836,
  "assets/voiceover/sfx_celebrate.ogg": 8344,
  "assets/voiceover/vo_box1.ogg": 21890,
  "assets/voiceover/vo_box1_hint2.ogg": 19200,
  "assets/voiceover/vo_box2.ogg": 23027,
  "assets/voiceover/vo_box2_hint2.ogg": 16949,
  "assets/voiceover/vo_box3.ogg": 23107,
  "assets/voiceover/vo_box3_hint2.ogg": 18077,
  "assets/voiceover/vo_box4.ogg": 23358,
  "assets/voiceover/vo_box4_hint2.ogg": 20249,
  "assets/voiceover/vo_box5.ogg": 23750,
  "assets/voiceover/vo_box5_hint2.ogg": 19351,
  "assets/voiceover/vo_box6.ogg": 22865,
  "assets/voiceover/vo_box6_hint2.ogg": 18691,
  "assets/voiceover/vo_box_intro.ogg": 25617,
  "assets/voiceover/vo_cel.ogg": 14809,
  "assets/voiceover/vo_g1_correct.ogg": 33932,
  "assets/voiceover/vo_g1_hint2.ogg": 26445,
  "assets/voiceover/vo_g1_prompt.ogg": 39029,
  "assets/voiceover/vo_g2_hint1.ogg": 44610,
  "assets/voiceover/vo_g2_hint2.ogg": 21780,
  "assets/voiceover/vo_g2_hint3.ogg": 41343,
  "assets/voiceover/vo_g2_prompt.ogg": 39789,
  "assets/voiceover/vo_g3_hint1.ogg": 40776,
  "assets/voiceover/vo_g3_hint2.ogg": 15656,
  "assets/voiceover/vo_g3_hint3.ogg": 46504,
  "assets/voiceover/vo_g3_prompt.ogg": 37899,
  "assets/voiceover/vo_g4_hint1.ogg": 45363,
  "assets/voiceover/vo_g4_hint2.ogg": 20781,
  "assets/voiceover/vo_g4_hint3.ogg": 41649,
  "assets/voiceover/vo_g4_prompt.ogg": 40150,
  "assets/voiceover/vo_g5_hint1.ogg": 43255,
  "assets/voiceover/vo_g5_hint2.ogg": 19372,
  "assets/voiceover/vo_g5_hint3.ogg": 39611,
  "assets/voiceover/vo_g5_prompt.ogg": 47545,
  "assets/voiceover/vo_g6_hint1.ogg": 43386,
  "assets/voiceover/vo_g6_hint2.ogg": 17925,
  "assets/voiceover/vo_g6_hint3.ogg": 39846,
  "assets/voiceover/vo_g6_prompt.ogg": 76978,
  "assets/voiceover/vo_l1.ogg": 9866,
  "assets/voiceover/vo_l2.ogg": 9547,
  "assets/voiceover/vo_l3.ogg": 10571,
  "assets/voiceover/vo_l4.ogg": 11321,
  "assets/voiceover/vo_l5.ogg": 12958,
  "assets/voiceover/vo_l6.ogg": 11600,
  "assets/voiceover/vo_l7.ogg": 7221,
  "assets/voiceover/vo_l8.ogg": 9378,
  "assets/voiceover/vo_landing.ogg": 44218,
  "assets/voiceover/vo_mic_intro.ogg": 11261,
  "assets/voiceover/vo_no.ogg": 3635,
  "assets/voiceover/vo_o_chashni.ogg": 4379,
  "assets/voiceover/vo_o_chulha.ogg": 4225,
  "assets/voiceover/vo_o_halwai.ogg": 5138,
  "assets/voiceover/vo_o_jalebi.ogg": 4361,
  "assets/voiceover/vo_o_kadai.ogg": 4296,
  "assets/voiceover/vo_o_mithai.ogg": 3367,
  "assets/voiceover/vo_o_paise.ogg": 4730,
  "assets/voiceover/vo_o_rajai.ogg": 5471,
  "assets/voiceover/vo_pt_guided.ogg": 7403,
  "assets/voiceover/vo_pt_practice.ogg": 6268,
  "assets/voiceover/vo_pt_tutorial.ogg": 39345,
  "assets/voiceover/vo_pw_00.ogg": 3890,
  "assets/voiceover/vo_pw_01.ogg": 3045,
  "assets/voiceover/vo_pw_02.ogg": 3414,
  "assets/voiceover/vo_pw_03.ogg": 4151,
  "assets/voiceover/vo_pw_04.ogg": 2214,
  "assets/voiceover/vo_pw_05.ogg": 2444,
  "assets/voiceover/vo_pw_06.ogg": 2739,
  "assets/voiceover/vo_pw_07.ogg": 5482,
  "assets/voiceover/vo_pw_08.ogg": 3226,
  "assets/voiceover/vo_pw_09.ogg": 3544,
  "assets/voiceover/vo_pw_10.ogg": 4248,
  "assets/voiceover/vo_pw_11.ogg": 3946,
  "assets/voiceover/vo_pw_12.ogg": 2818,
  "assets/voiceover/vo_pw_13.ogg": 4564,
  "assets/voiceover/vo_pw_14.ogg": 2795,
  "assets/voiceover/vo_pw_15.ogg": 3560,
  "assets/voiceover/vo_pw_16.ogg": 3913,
  "assets/voiceover/vo_pw_17.ogg": 3288,
  "assets/voiceover/vo_pw_18.ogg": 3050,
  "assets/voiceover/vo_pw_19.ogg": 3755,
  "assets/voiceover/vo_pw_20.ogg": 4258,
  "assets/voiceover/vo_pw_21.ogg": 3198,
  "assets/voiceover/vo_pw_22.ogg": 2964,
  "assets/voiceover/vo_pw_23.ogg": 3851,
  "assets/voiceover/vo_pw_24.ogg": 3559,
  "assets/voiceover/vo_pw_25.ogg": 3612,
  "assets/voiceover/vo_pw_26.ogg": 3831,
  "assets/voiceover/vo_pw_27.ogg": 4281,
  "assets/voiceover/vo_pw_28.ogg": 3259,
  "assets/voiceover/vo_pw_29.ogg": 4930,
  "assets/voiceover/vo_t7_conclude.ogg": 97736,
  "assets/voiceover/vo_t7_words.ogg": 50680,
  "assets/voiceover/vo_t8.ogg": 71169,
  "assets/voiceover/vo_t9.ogg": 98743,
  "assets/voiceover/vo_word_0.ogg": 12609,
  "assets/voiceover/vo_word_1.ogg": 12593,
  "assets/voiceover/vo_word_10.ogg": 12649,
  "assets/voiceover/vo_word_11.ogg": 12723,
  "assets/voiceover/vo_word_12.ogg": 12754,
  "assets/voiceover/vo_word_13.ogg": 12209,
  "assets/voiceover/vo_word_14.ogg": 12420,
  "assets/voiceover/vo_word_15.ogg": 8426,
  "assets/voiceover/vo_word_16.ogg": 12429,
  "assets/voiceover/vo_word_17.ogg": 12804,
  "assets/voiceover/vo_word_18.ogg": 12498,
  "assets/voiceover/vo_word_19.ogg": 12569,
  "assets/voiceover/vo_word_2.ogg": 12898,
  "assets/voiceover/vo_word_20.ogg": 13136,
  "assets/voiceover/vo_word_21.ogg": 12723,
  "assets/voiceover/vo_word_22.ogg": 12546,
  "assets/voiceover/vo_word_23.ogg": 12643,
  "assets/voiceover/vo_word_24.ogg": 12420,
  "assets/voiceover/vo_word_25.ogg": 12857,
  "assets/voiceover/vo_word_26.ogg": 12111,
  "assets/voiceover/vo_word_27.ogg": 12668,
  "assets/voiceover/vo_word_28.ogg": 13110,
  "assets/voiceover/vo_word_3.ogg": 12473,
  "assets/voiceover/vo_word_4.ogg": 12487,
  "assets/voiceover/vo_word_5.ogg": 12566,
  "assets/voiceover/vo_word_6.ogg": 12704,
  "assets/voiceover/vo_word_7.ogg": 12731,
  "assets/voiceover/vo_word_8.ogg": 12778,
  "assets/voiceover/vo_word_9.ogg": 12814,
  "assets/voiceover/vo_yes.ogg": 3377
};
/* @asset-sizes:end */
const Assets = (function(){
  const CRIT = -3, GATE = -2, UI = -1, REST = 999;
  const CONCURRENCY = 5, STALL_MS = 15000, CAP_MS = 90000, CRIT_CAP_MS = 20000;
  let q; try{ q = new URLSearchParams(location.search); }catch(e){ q = { has: ()=> false }; }
  const OFF = q.has("noprefetch");
  const HTTP = /^https?:$/.test(location.protocol);           // file:// can't fetch(): every element loads its own file there
  const items = new Map(), perSlide = [], blobs = new Map(), urls = new Map();
  let seq = 0, active = 0, started = false, hold = false;
  const A = (CARD.assets || {});
  const known = src => Object.prototype.hasOwnProperty.call(ASSET_SIZES, src);
  const vo = id => (A.audio && typeof A.audio[id] === "string" && A.audio[id].indexOf("assets/") === 0) ? A.audio[id]
                                                                                                      : "assets/voiceover/" + id + "." + AUDIO_EXT;
  const art = f => "assets/" + (ANIM_ASSETS.indexOf(f) >= 0 ? "gif/" : "") + f;
  const TYPES = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", ogg: "audio/ogg", woff2: "font/woff2" };
  const typeOf = src => TYPES[(src.split("?")[0].split(".").pop() || "").toLowerCase()] || "";
  /* a font file is "in" once the face is ready to draw too (fetched bytes + document.fonts.load: no swap later) */
  const faceOf = src =>{ const m = /baloo2-(\d+)\.woff2$/.exec(src); return m ? m[1] + " 1em 'Baloo 2'" : null; };
  function add(src, tag){
    if(!src || !known(src)) return null;                       // not shipped: never requested (no 404s)
    let it = items.get(src);
    if(it){ if(tag < it.tag) it.tag = tag; return it; }
    it = { src: src, tag: tag, n: seq++, st: 0, size: ASSET_SIZES[src] || 1, cbs: [] };   // st: 0 queued, 1 loading, 2 in
    items.set(src, it); return it;
  }
  function ready(){ if(OFF) return true; if(!items.size) return false; for(const it of items.values()) if(it.st !== 2) return false; return true; }
  function finish(it){
    if(it.st === 2) return;
    if(it.st === 1) active--;
    it.st = 2;
    /* an <img data-src> in index.html that only needs its picture later gets it now (it used to start downloading
       with the page, ahead of the landing's own files) */
    document.querySelectorAll('img[data-src="' + it.src + '"]').forEach(im =>{ im.src = it.src; im.removeAttribute("data-src"); });
    it.cbs.splice(0).forEach(f =>{ try{ f(); }catch(e){} });
    pump();
  }
  function load(it){
    it.st = 1; active++;
    if(!HTTP){ finish(it); return; }
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    let stallT = 0, capT = 0, over = false;
    const end = blob =>{
      if(over) return; over = true; clearTimeout(stallT); clearTimeout(capT);
      if(blob) blobs.set(it.src, blob);
      const face = faceOf(it.src);
      if(!face || !document.fonts || !document.fonts.load) return finish(it);
      const t = setTimeout(()=> finish(it), 3000);
      document.fonts.load(face).then(()=>{ clearTimeout(t); finish(it); }, ()=>{ clearTimeout(t); finish(it); });
    };
    const abort = ()=>{ try{ if(ctl) ctl.abort(); }catch(e){} end(null); };   // stalled / too long: counts as done
    const arm = ()=>{ clearTimeout(stallT); stallT = setTimeout(abort, STALL_MS); };
    capT = setTimeout(abort, it.tag <= CRIT ? CRIT_CAP_MS : CAP_MS); arm();
    fetch(it.src, ctl ? { signal: ctl.signal } : undefined).then(r =>{
      if(!r.ok) throw new Error("HTTP " + r.status);
      const len = +r.headers.get("content-length");
      if(len > 0 && !r.headers.get("content-encoding")) it.size = len;
      const type = typeOf(it.src) || r.headers.get("content-type") || "";
      if(!r.body || !r.body.getReader) return r.blob().then(b => new Blob([b], { type: type }));
      const rd = r.body.getReader(), parts = [];
      const next = ()=> rd.read().then(c =>{
        if(c.done) return new Blob(parts, { type: type });
        parts.push(c.value); arm();
        return next();
      });
      return next();
    }).then(end, ()=> end(null));
  }
  function pump(){
    if(OFF || !started) return;
    let crit = false;
    for(const it of items.values()) if(it.tag <= CRIT && it.st !== 2){ crit = true; break; }
    /* the landing's files (CRIT) and anything a waiting slide asked for (GATE) by tag; the rest smallest first */
    const rank = it => it.tag <= GATE ? it.tag : 0;
    while(active < CONCURRENCY){
      let best = null;
      for(const it of items.values())
        if(it.st === 0 && (!best || rank(it) < rank(best) || (rank(it) === rank(best) && (it.size < best.size || (it.size === best.size && it.n < best.n))))) best = it;
      if(!best || ((crit || hold) && best.tag > CRIT)) return;   // the landing's own files have the line to themselves
      load(best);
    }
  }
  function whenDone(srcs, cb){
    const pend = srcs.map(s => items.get(s)).filter(it => it && it.st !== 2);
    let left = pend.length;
    if(!left){ cb(); return; }
    pend.forEach(it => it.cbs.push(()=>{ if(--left === 0) cb(); }));
  }
  /* the engine art a slide's KIND draws, which its card data does not name: the blocks, the people, the end screen */
  function slideArt(s){
    const d = s.data || {}, out = [], img = f => out.push("assets/" + f + "." + IMG_EXT);
    if(s.type !== "CELEBRATION") out.push("assets/nudge_hand_new.svg");
    (d.count_clips || []).forEach(id => out.push(vo(id)));
    if(s.type === "CELEBRATION"){ img("end_screen"); img("last_swifty_still"); img("last_swifty_end"); out.push(vo("sfx_celebrate")); }
    if(s.phase === "tutorial" && s.type !== "CELEBRATION") img("start_mascot");      // the tutorial card's Swiftie
    return out;
  }
  const PEEK = art("peeking_talk_up.webp");
  const FONTS = ["assets/fonts/baloo2-800.woff2", "assets/fonts/baloo2-700.woff2", "assets/fonts/baloo2-600.woff2"];
  function gateFiles(phase){ return [PEEK, vo(PHASE_GATE_VO[phase])].filter(Boolean); }
  function init(){
    if(items.size) return;
    /* CRIT: the landing - what the boot loader waits for */
    ["startnew_bg_plain.webp", "start_card.webp",
     "btn-play-round-waiting.svg", "btn-play-round.svg", "bgdeco_star.svg", "bgdeco_star_o.svg", "bgdeco_spark.svg",
     ...JLanding.files(CARD.landing_hero)].forEach(f => add("assets/" + f, CRIT));
    add(art("new_landing_swiftee_anim.webp"), CRIT);                                // Swiftee's wave (sgMascotPlayer reads its Blob)
    add(FONTS[0], CRIT);                                                            // the title's weight; the others next
    add(vo("vo_landing"), CRIT);
    /* each slide, in lesson order: whenSlide's lists */
    const ids = Object.keys(A.audio || {});
    (CARD.slides || []).forEach((s, i)=>{
      const t = JSON.stringify(s), list = FONTS.slice();                            // (every slide: no text in a fallback face)
      (t.match(/assets\/[\w\/.\-]+\.(?:webp|png|svg|jpg|gif|ogg|mp3)/g) || []).forEach(src => list.push(src));
      ids.forEach(k =>{ if(t.indexOf('"' + k + '"') >= 0) list.push(vo(k)); });
      slideArt(s).forEach(src => list.push(src));
      const prev = CARD.slides[i - 1];
      if(PHASE_GATE_TITLE[s.phase] && (!prev || prev.phase !== s.phase)) gateFiles(s.phase).forEach(src => list.push(src));
      perSlide[i] = [...new Set(list)].filter(known);
      perSlide[i].forEach(src => add(src, i));
    });
    /* ...and EVERY other shipped file: the bar reaches 100% only when the whole lesson is local */
    Object.keys(ASSET_SIZES).forEach(src => add(src, REST));
  }
  /* the spinner: a slide that is still waiting for its own files */
  let waiting = 0;
  function spin(on){
    let el = document.getElementById("assetWait");
    if(!el){ el = document.createElement("div"); el.id = "assetWait"; el.className = "asset-wait"; el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); }
    waiting = Math.max(0, waiting + (on ? 1 : -1));
    el.classList.toggle("show", waiting > 0);
  }
  function whenSlide(i, cb, phase){
    if(OFF || !perSlide[i]){ cb(); return; }
    const srcs = perSlide[i].concat(phase ? gateFiles(phase) : []);
    const pend = srcs.filter(s =>{ const it = items.get(s); return it && it.st !== 2; });
    if(!pend.length){ cb(); return; }
    pend.forEach(s =>{ const it = items.get(s); if(it.st === 0 && it.tag > GATE) it.tag = GATE; });   // jump the queue
    start();
    let fired = false, spun = false;
    const t0 = setTimeout(()=>{ if(!fired){ spun = true; spin(true); } }, 300);
    const go = ()=>{ if(fired) return; fired = true; clearTimeout(t0); clearTimeout(t1); if(spun) spin(false); cb(); };
    const t1 = setTimeout(go, 8000);
    whenDone(pend, go);
  }
  function start(){ if(!started){ started = true; init(); } pump(); }
  /* critical(extra, cb): cb once the landing's own files are in, and the extra promise (Swiftee's wave) has settled */
  function critical(extra, cb){
    init(); hold = true; start();
    const crit = [...items.values()].filter(it => it.tag <= CRIT).map(it => it.src);
    let left = 2; const one = ()=>{ if(--left === 0) release(); };
    const release = ()=>{ if(!hold) return; hold = false; pump(); cb(); };
    whenDone(crit, one);
    if(extra && extra.then) extra.then(one, one); else one();
    setTimeout(release, 10000);                                  // (the boot loader's own watchdog lifts it then too)
  }
  /* blobOf(src): a promise of the file's Blob (null when it could not be fetched) - sgMascotPlayer's one download */
  function blobOf(src){
    return new Promise(res =>{
      if(!HTTP || !known(src)) return res(null);
      init(); const it = items.get(src);
      const give = ()=> res(blobs.get(src) || null);
      if(!it || it.st === 2) give(); else it.cbs.push(give);
    });
  }
  /* url(src): one shared blob: URL of a fetched file, else the file's own path */
  function url(src){
    if(!blobs.has(src)) return src;
    if(!urls.has(src)) urls.set(src, URL.createObjectURL(blobs.get(src)));
    return urls.get(src);
  }
  /* a fresh blob: URL of a fetched animation (it plays from frame 0), else the file with a cache-bust (file://) */
  function fresh(src){ const b = blobs.get(src); return b ? URL.createObjectURL(b) : src + "?r=" + Date.now(); }
  /* ---- blob: swap: an <img>/<audio>/<video> given a fetched file's path shows the local copy instead. Only at the
     moment it is given the path (never a picture already on screen: no flash), and not on the landing card, whose
     pencil rules match its src. data-asset keeps the path (srcOf). A blob: URL that errors goes back, once, to the
     file's own URL (and a playing clip resumes). */
  function swap(el){
    if(!el || el._noBlob || !el.getAttribute) return;
    const s = el.getAttribute("src");
    if(!s || !blobs.has(s) || (el.closest && el.closest("#startGate"))) return;
    el.setAttribute("data-asset", s);
    if(!el._blobFallback){
      el._blobFallback = true;
      el.addEventListener("error", function onErr(){
        if(!/^blob:/.test(el.getAttribute("src") || "")) return;
        el.removeEventListener("error", onErr); el._noBlob = true;
        const playing = el.tagName !== "IMG" && el._wantPlay;
        el.setAttribute("src", el.getAttribute("data-asset"));
        if(playing && el.play) el.play().catch(()=>{});
      });
      if(el.tagName !== "IMG"){ el.addEventListener("play", ()=>{ el._wantPlay = true; }); el.addEventListener("pause", ()=>{ el._wantPlay = false; }); }
    }
    el.setAttribute("src", url(s));
  }
  const SWAP_SEL = "img[src],audio[src],video[src],source[src]";
  if(HTTP && !OFF && typeof MutationObserver === "function"){
    new MutationObserver(recs =>{
      for(const r of recs){
        if(r.type === "attributes"){ if(r.target.matches && r.target.matches(SWAP_SEL)) swap(r.target); continue; }
        r.addedNodes.forEach(n =>{
          if(n.nodeType !== 1) return;
          if(n.matches(SWAP_SEL)) swap(n);
          if(n.firstElementChild) n.querySelectorAll(SWAP_SEL).forEach(swap);
        });
      }
    }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
  }
  return { CRIT: CRIT, GATE: GATE, UI: UI, REST: REST, start: start, critical: critical, whenSlide: whenSlide,
           ready: ready, blob: src => blobs.get(src) || null, blobOf: blobOf, url: url, fresh: fresh };
})();
/* srcOf(el): the file an element shows - its path, even while it plays a blob: URL of it (Assets) */
function srcOf(el){ return el ? (el.getAttribute("data-asset") || el.getAttribute("src") || "") : ""; }

/* ---------- 15. BOOT ---------- */
function boot(){
  /* [14] activity_launched - once, at mount */
  try{ XAPI.once("activity_launched", { skill_code: CARD.skill_code, title: (CARD.title&&CARD.title.en)||"" }); }catch(e){}
  // god-mode visual theme (opt-in via CARD.theme) — warms the whole stage; scoped CSS under .thm-*
  if(CARD.theme) $("stage").classList.add("thm-" + CARD.theme);
  // banner title = skill name only (strip "(भाग…)" and the ": letters" list)
  $("sgTitle").textContent = (CARD.title.hi || "").split(/[:：(]/)[0].trim();
  // VISUAL-FIRST landing hero: SHOW the concept (shapes row / a finger-hand / an image), not just the title text
  (function(){ const hero = CARD.landing_hero, el = $("sgHero"); if(!hero || !el) return;
    if(hero.kind === "concept_strip"){
      // r4/#2: each cell is a .sg-acell (keeps the staggered fingerPop pop-in) wrapping a visual example.
      el.innerHTML = (hero.cells || []).map(c => `<div class="sg-acell">${conceptTileHTML(c)}</div>`).join("");
      /* HI01 PARITY: the early `return` here kept MTG's own landing type scale - 60px title and a
         150px content margin - by skipping the .compact / .has-hero classes every other hero kind
         adds. That is the whole remaining title-size and spacing gap against HI01, which runs the
         42px compact title and a 120px has-hero margin. Falling through instead of returning. */
    }
    if(hero.kind === "shapes" && typeof shapeSVG === "function")
      el.innerHTML = (hero.shapes||[]).map(s=> shapeSVG(s.shape, {color:s.color, size:104, rotate:s.rotate||0})).join("");
    else if(hero.kind === "count"){
      // counting game: preview the WHOLE 1..n sequence — a row of hands (1,2,3…), each with its Arabic numeral
      const hi = Math.min(Math.max(parseInt(hero.n,10)||3, 1), 5);   // clamp to available hand art (1..5)
      let cells = "";
      for(let i=1;i<=hi;i++){
        cells += `<div class="sg-hand-cell">${fingerCount(i, "sg-hand")}<span class="sg-hand-num">${devNumeral(i)}</span></div>`;
      }
      el.innerHTML = cells;
    }
    else if(hero.kind === "image") el.innerHTML = `<img src="${hero.src}" alt="">`;
    else if(hero.kind === "art") $("startGate").classList.add("sg-art-card");   // [jalebi landing] the card's own art (CSS)
    /* MTG2A01_L04_S01: the deck's page 1 shows "20 − 10 = ?" - a small equation pill over the sibling's castle scene
       (landing_hero.eq: [a, op, b]); it pops in with the greeting, before the children arrive */
    if(hero.kind === "pv_story" && hero.eq && el.innerHTML){ const sg = el.querySelector("#sgp");
      const n = (v, c)=> '<span class="sgq-n ' + (c || "") + '">' + v + '</span>', o = t => '<span class="sgq-op">' + t + '</span>';
      if(sg) sg.insertAdjacentHTML("afterbegin", '<div class="sgq">' + n(hero.eq[0]) + o(hero.eq[1]) + n(hero.eq[2]) + o("=") + n("?", "sgq-q") + '</div>');  const ct = el.closest(".sg-content"); if(ct) ct.classList.add("has-eq"); }
    if(el.innerHTML){ el.classList.add("show"); $("sgTitle").classList.add("compact");
      const c = el.closest && el.closest(".sg-content"); if(c){ c.classList.add("has-hero");
        // SME (S01 review deck): landing reads TITLE first, image BELOW it, image smaller.
        if(hero.title_first) c.classList.add("title-first"); } }
  })();

  // ----- landing-screen welcome VO (lead review) -----
  // A warm greeting on the title screen. Autoplay is often blocked before a gesture, so we also
  // (a) expose a pulsing 🔊 "listen" button, and (b) fire it on the first pointer-down. The whole
  // greeting lives HERE now (not on slide 0), which also kills the old overlap glitch where the
  // landing VO and slide-0 VO could talk over each other.
  const landSrc = (CARD.assets && CARD.assets.audio && CARD.assets.audio["vo_landing"]) || ("assets/voiceover/vo_landing." + AUDIO_EXT);
  /* ---- PLAY BUTTON WAITS FOR THE GREETING, THEN POPS (as HI02H11_L01_S01, the reference game) ----
     While the landing greeting speaks, the play button is shown but DISABLED in its grey waiting art
     (btn-play-blob-waiting.svg) - a bright button that ignores taps reads as broken. When the greeting
     ENDS it swaps to the gold art with a one-shot pop + gold ring (.sg-pop), and becomes tappable.
     If the child then does nothing for 5s it starts the strong idle pulse (.idle-pulse, the reference's
     sgBtnPulseStrong); any tap on the landing restarts that 5s timer.
     "Heard" means the clip really played to its end (voEl.ended). When the browser BLOCKS autoplay the
     button stays grey and the child's first tap - anywhere, the grey button included - starts the
     greeting, so the pop still lands exactly when the greeting ends. Never strands the child: an 18s
     watchdog releases the button even if the greeting never reports back at all.
     NB the waiting state is .sg-waiting + aria-disabled, NOT the disabled attribute - a disabled
     button swallows the tap that has to start a blocked greeting. */
  let _greetingHeard = false, _startIdleT = 0, _startWatchT = 0, _starting = false;
  const onLandingNow = ()=> { const g = $("startGate"); return g && !g.classList.contains("hidden"); };
  const startWaiting = ()=>{ const b = $("sgBtn"); return !b || b.classList.contains("sg-waiting"); };
  const disarmStartPulse = ()=>{ clearTimeout(_startIdleT); _startIdleT = 0; const b = $("sgBtn"); if(b) b.classList.remove("idle-pulse"); };
  const armStartPulse = ()=>{
    disarmStartPulse();
    /* QA checklist 2026-10-05: "the Play button pulsates immediately after the VO is complete" - it starts pulsing as
       its one-shot pop settles (was: only after 5s untouched) */
    _startIdleT = setTimeout(()=>{ const b = $("sgBtn"); if(b && !startWaiting() && onLandingNow()) b.classList.add("idle-pulse"); }, 600);
  };
  const setStartBtnReady = (ready)=>{
    const b = $("sgBtn"); if(!b) return;
    const img = b.querySelector("img");
    const was = !startWaiting();
    b.disabled = false;
    b.classList.toggle("sg-waiting", !ready);
    b.setAttribute("aria-disabled", ready ? "false" : "true");
    if(img) img.src = ready ? "assets/btn-play-round.svg" : "assets/btn-play-round-waiting.svg";   // HI02H11_L01_S01's round play button (review 2026-10-06)
    if(!ready){ disarmStartPulse(); b.classList.remove("sg-pop"); return; }
    if(!was){ b.classList.remove("sg-pop"); void b.offsetWidth; b.classList.add("sg-pop");
      setTimeout(()=> b.classList.remove("sg-pop"), 900); }
    armStartPulse();
  };
  setStartBtnReady(false);   // grey + disabled from first paint, until the greeting has been heard
  /* [landing intro] the gold pop waits for the whole intro too (title words -> cubes -> lines, "sg-intro-done"),
     so the button is the LAST thing to arrive (review 2026-09-29). The 18s watchdog still forces it - never stranded. */
  let _releasePending = false;
  const releaseStart = (force)=>{ if(!force && !window.__sgIntroDone){ _releasePending = true; return; }
    clearTimeout(_startWatchT); _releasePending = false; if(onLandingNow()) setStartBtnReady(true); };
  document.addEventListener("sg-intro-done", ()=>{ if(_releasePending) releaseStart(); });
  const playLanding = ()=>{
    if(!onLandingNow()) return;
    document.dispatchEvent(new Event("sg-greeting-start"));                  // (the cube row's watchdog counts from here)
    clearTimeout(_startWatchT); _startWatchT = setTimeout(()=> releaseStart(true), 18000);   // watchdog (forces it; 18s: the intro now starts on "आज", ends ~13.5s)
    /* released only when the greeting was really heard; a blocked/failed start leaves it grey for the
       child's first tap (or the watchdog) */
    /* review 2026-10-05: "why is the sound box getting disabled - this should not happen anywhere in the game": the
       speaker is never greyed out (the QA checklist's disabled-while-the-greeting-speaks state is gone). A tap while the
       greeting is still playing is ignored, as on every speaker (replayTap), so it never restarts the line mid-way. */
    play(landSrc, ()=>{ if(voEl.ended){ _greetingHeard = true; releaseStart(); } });
  };
  // any tap on the landing restarts the 5s idle timer (only once the button is live)
  window.addEventListener("pointerdown", ()=>{ if(onLandingNow() && !startWaiting()) armStartPulse(); }, true);
  const sgVo = $("sgVo"); if(sgVo) sgVo.onclick = (e)=>{ e.stopPropagation();
    if(replayTap(null, "landing_chip")) playLanding(); };   // [QA 11] the landing chip reports audio_replayed too
  /* ---- [landing mascot player] (review 2026-09-29: "swifty is getting glitched ... at the starting only"). Measured
     on the landing with a frame-by-frame screen recording: in about half the loads Chrome paints NOTHING where Swifty
     is for 1-2 frames, exactly when the <img>'s animated WebP (alpha) steps to its next frame while the landing
     is busy starting up - with the original HI01 file too. A canvas cannot blink like that: it keeps its last picture
     until the next one is drawn. So where the browser can decode the file itself (WebCodecs ImageDecoder), Swifty is
     drawn on a canvas at its displayed size, the next frame always decoded ahead. Anything missing or failing (no
     ImageDecoder, a decode error, not ready when the loader lifts) keeps the plain <img> and its restart below.
     [loading] ONE download (2026-10-01): the clip used to be fetched for the decoder AND pulled by the <img src> beside
     it - 1.6MB twice on the landing's critical path, and once more by the ?r= restart. The <img> has only a data-src
     now: the file is fetched once (index.html starts it with the page, on http(s)), the decoder reads those bytes,
     and the <img> path shows them as a blob: URL. file:// can't fetch(): there the plain <img src>, as before.
     `ready` settles once Swiftee can be shown - one of the things the boot loader waits for. ---- */
  const sgMascotPlayer = (()=>{
    const img = document.querySelector(".sg-mascot");
    if(!img) return null;
    const url = img.getAttribute("data-src") || (img.getAttribute("src") || "").split("?")[0], TYPE = "image/webp";
    let dec = null, count = 0, first = null, ok = false, dead = false, blob = null, blobUrl = "", pending = true;
    const shown = ()=> new Promise(res =>{
      if(img.complete && img.naturalWidth) return res();
      img.onload = ()=> res(); img.onerror = ()=>{ img.style.display = "none"; res(); };
    });
    const show = src =>{ img.removeAttribute("data-src"); img.src = src; return shown(); };
    const ready = (async ()=>{                                     // fetch + decode start at once, under the loader
      let buf = null;
      try{ const b = await Assets.blobOf(url); if(b){ blob = new Blob([b], { type: TYPE }); buf = await blob.arrayBuffer(); } }catch(e){}   // the loader's one download (Assets, CRIT)
      if(!buf){ pending = false; return show(url); }
      try{
        if(typeof ImageDecoder !== "undefined" && !(ImageDecoder.isTypeSupported && !(await ImageDecoder.isTypeSupported(TYPE)))){
          dec = new ImageDecoder({ data: buf, type: TYPE });
          await dec.tracks.ready; count = dec.tracks.selectedTrack.frameCount;
          first = (await dec.decode({ frameIndex: 0 })).image;
          ok = count > 0 && !dead;
        }
      }catch(e){ ok = false; }
      pending = false;
      if(!ok) return show(blobUrl = URL.createObjectURL(blob));
    })().catch(()=>{ ok = false; pending = false; });
    function start(){                                              // the loader lifting; false = keep the <img>
      if(!ok || !img.isConnected){ dead = true; return false; }
      try {
        const r = img.getBoundingClientRect(), W = Math.max(1, Math.round(r.width * (window.devicePixelRatio || 1)));
        const H = Math.max(1, Math.round(W * first.displayHeight / first.displayWidth));
        const cv = document.createElement("canvas"); cv.className = img.className; cv.width = W; cv.height = H;
        cv.setAttribute("role", "img"); cv.setAttribute("aria-label", img.getAttribute("alt") || "");
        const ctx = cv.getContext("2d"); ctx.imageSmoothingQuality = "high";
        const draw = f => { ctx.clearRect(0, 0, W, H); ctx.drawImage(f, 0, 0, W, H); };   // one task: never shown half-drawn
        draw(first); img.replaceWith(cv);
        let i = 0, cur = first, due = performance.now() + (cur.duration || 90000) / 1000;   // VideoFrame.duration is in us
        let next = count > 1 ? dec.decode({ frameIndex: 1 }) : null;
        const step = async ()=>{
          if(!next){ cur.close(); dec.close(); return; }             // plays once: the last frame stays drawn
          let n; try { n = (await next).image; } catch(e){ return; }  // a failed decode: the frame on show simply stays
          const wait = due - performance.now();
          if(wait > 1) await new Promise(res => setTimeout(res, wait));
          draw(n); cur.close(); cur = n; i++;
          due = Math.max(due, performance.now() - 30) + (n.duration || 90000) / 1000;
          next = i + 1 < count ? dec.decode({ frameIndex: i + 1 }) : null;   // decoded while this one is on show
          step();
        };
        step();
        return true;
      } catch(e){ dead = true; return false; }
    }
    /* the plain <img>: the wave from frame 0 again - a fresh blob: URL of the same bytes (file://: a cache-bust of the
       local file). Still downloading (the watchdog lifted the loader first): it shows from frame 0 when it lands. */
    function restart(){
      if(!img.isConnected || pending) return;
      const old = blobUrl;
      if(blob){ img.src = blobUrl = URL.createObjectURL(blob); if(old) URL.revokeObjectURL(old); }
      else img.src = url + "?r=" + Date.now();
    }
    return { start, restart, ready };
  })();
  // ---- [engine JS] r4/P2 boot loader: the loader until the LANDING's own files are in (Assets: CRIT + Swiftee's wave),
  // then it dismisses ITSELF into the landing (NO tap gate) - the rest of the lesson keeps loading behind the landing.
  // A 10s watchdog never strands the child; .done dedups the two. The same handler adds body.loaded (unblocks the
  // concept-strip stagger) and fires the landing VO. play() absorbs an autoplay block; the pulsing 🔊 chip is the fallback.
  // ===== QA CHECKLIST [02]: PRELOAD BEFORE THE START SCREEN - since 2026-10-01 only what the START SCREEN shows. It
  // used to be every image and clip of the lesson ([loading], Assets); each slide now waits for its own files instead
  // (mountSlide), so art and VO still never pop in mid-lesson. A FAILED ASSET COUNTS AS DONE: a 404 never strands. ----
  (function(){
    const bl = $("bootLoader");
    if(!bl){ document.body.classList.add("loaded"); playLanding(); Assets.start(); return; }
    const ready = ()=>{
      if(bl.classList.contains("done")) return;   // the files + the watchdog both land here → dedup
      bl.classList.add("done");
      document.body.classList.add("loaded");       // starts the .sg-acell pop chain
      /* [QA 03] the landing wave plays ONCE (the .webp's loop count is 1). It decodes under the loader, so without a
         restart the one wave would be spent before the child sees it: the moment the loader lifts it starts again
         from frame 0 - on the canvas player, or a fresh blob: URL of the same bytes (no second download). */
      if(sgMascotPlayer && !sgMascotPlayer.start()) sgMascotPlayer.restart();
      playLanding();
      setTimeout(()=> bl.remove(), 450);
    };
    Assets.critical(sgMascotPlayer && sgMascotPlayer.ready, ready);
    setTimeout(ready, 10000);   // hard watchdog: never strand the child on the loader
  })();
  // landing VO best-effort on first interaction too (some browsers block autoplay pre-gesture)
  /* ...but not when the greeting has already been heard or is playing now, and never on the play button
     itself - tapping the live gold button used to restart the greeting a split second before its click
     silenced it again. */
  window.addEventListener("pointerdown", function once(ev){ window.removeEventListener("pointerdown", once);
    if(ev && ev.target && ev.target.closest && ev.target.closest("#sgBtn")) return;
    if(!_greetingHeard && !isPlaying) playLanding(); }, { once:true });

  $("sgBtn").onclick = ()=>{
    if(startWaiting()){                 // still waiting for the greeting: a tap can only START it
      if(!_greetingHeard && !isPlaying) playLanding();
      return;
    }
    if(_starting) return;  // a second tap while slide 0's files finish loading
    disarmStartPulse(); clearTimeout(_startWatchT);
    stopAudio();          // silence the landing greeting BEFORE slide 0 speaks (no VO overlap)
    sfxPlay();            // QA checklist 2026-10-05: the standard play button SFX
    bgmStart();           // ...and the background music starts on this tap (never before it)
    _ac();                // unlock/resume WebAudio on the start gesture so the first clip never clips
    Screen.fullscreen();  // [responsive] a phone/tablet browser: the whole screen, held in landscape (Android)
    // [engine JS] r4/P1: peek gate into the tutorial. The landing stays visible-and-BLURRED behind the
    // peeking Swiftie + "चलिए शुरू करें"; it hides once the tutorial mounts (in the callback).
    // [loading] the gate's Swiftie and slide 0 are almost always in long before this tap; if not, a spinner holds here.
    _starting = true;
    Assets.whenSlide(0, ()=>{
      _gatedPhases.add("tutorial");
      phaseBlurTransition(()=>{
        _starting = false;
        $("startGate").classList.add("hidden");
        document.body.classList.remove("is-start");   // blue bg only on the title screen
        mountSlide(0);
      }, "tutorial");
    }, "tutorial");
  };

  // tapping आगे clears any pending nav-nudge, and sounds the standard next-button SFX
  $("navBtn").addEventListener("click", ()=>{ clearTimeout(state.navNudgeTimer); stopNudge(); sfxNext(); });
  /* [12][14] QA CHECKLIST: "hint_used event fires on every bulb tap." Each slide
     module rebinds $("hintBtn").onclick with its own `if(state.locked ...) return`
     guard, and only two of those seven handlers ever emitted hint_shown - so most
     bulb taps sent nothing. This capture-phase listener sits ahead of all of them
     and is the single place the verb is raised. */
  $("hintBtn").addEventListener("click", ()=>{
    const sl = CARD.slides[state.idx] || {};
    state.hintUsed = true;
    try{ XAPI.send("hint_used", { slide_id: sl.id, phase: sl.phase, type: sl.type },
                   { attempt: state.attempts }); }catch(e){}
  }, true);
  // [engine JS] r4 dev jump: ?slide=N skips the loader+gate and mounts slide N directly (QA/capture only)
  (function(){
    const j = parseInt(new URLSearchParams(location.search).get("slide"), 10);
    if(isNaN(j)) return;
    const bl = $("bootLoader"); if(bl) bl.remove();
    document.body.classList.add("loaded");
    $("startGate").classList.add("hidden");
    document.body.classList.remove("is-start");
    mountSlide(Math.max(0, Math.min(j, CARD.slides.length - 1)));
  })();
  // when the web font finishes loading, re-centre glyphs (metrics change vs fallback)
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(()=> centerAllGlyphs()); }
  // dev banner if ?dev=1 — show empty initially
  /* [QA 01] ?dev=1 JUMP PANEL. This engine revision shipped the dev BANNER but
     never the slide navigator - HI01 gained it in a later block (its line 7503)
     that MTG predates, which is why ?dev=1 looked like it "did nothing" here.
     buildDevNav() is ported verbatim; ?nav=1 is accepted too, as in HI01. */
  if(new URLSearchParams(location.search).has("dev") || new URLSearchParams(location.search).has("nav")){
    $("devBanner").textContent = "engine ready · slides=" + CARD.slides.length;
    $("devBanner").className = "dev-banner show";
    buildDevNav();
  }
}
/* ===== FLN ANIMATION KIT: core BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion = window.FLNMotion || {};
  M.still = function(){
    try{ return document.documentElement.classList.contains("no-anim") ||
      (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch(_){ return false; }
  };
  M.scale = function(){
    try{ return parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue("--scale")) || 1; }catch(_){ return 1; }
  };
  M.rect = function(r, sw){                    // screen rect -> stage coords (R1/R2)
    var s = M.scale();
    if(document.documentElement.classList.contains("rotated")){
      return { left:(r.top - sw.top)/s, top:(sw.right - r.right)/s, w:r.height/s, h:r.width/s };
    }
    return { left:(r.left - sw.left)/s, top:(r.top - sw.top)/s, w:r.width/s, h:r.height/s };
  };
  M.guard = function(fn){                      // R4
    try{ fn(); }catch(e){ try{ console.warn("[animation-kit]", e && e.message); }catch(_){} }
  };
  var _actx = null;
  M.audio = function(){
    try{
      var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
      _actx = _actx || new AC();
      if(_actx.state === "suspended") _actx.resume();
      return _actx;
    }catch(_){ return null; }
  };
  M.ready = function(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };
})();
/* ===== FLN ANIMATION KIT: core END ===== */

/* ===== FLN ANIMATION KIT: sky-drift BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;

  function build(o){
    var sky = typeof o.container === "string" ? document.querySelector(o.container) : o.container;
    if(!sky) return null;
    sky.textContent = "";
    var maxSize = 0, frag = document.createDocumentFragment();

    /* [landing card clear] every lane STARTS just outside the centre card, never behind it.
       The sky and the card share the viewport centre (body flex-centres the stage, the gate
       flex-centres the card), so per lane: distance from centre to where the ray leaves the
       card box (1114x456 design px x --scale) + the element's half-size + a gap, in vmax.
       Before this every star launched at a flat r0 = 22vmax - well inside the card - and slid
       out from under it. */
    var clear = null;
    if(o.avoid && document.querySelector(o.avoid)){
      var sc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
      var vmaxPx = Math.max(document.documentElement.clientWidth, document.documentElement.clientHeight) / 100 || 1;
      clear = { hw:(o.avoidBox[0] / 2) * sc / vmaxPx, hh:(o.avoidBox[1] / 2) * sc / vmaxPx, gap:o.avoidGap * sc / vmaxPx };
    }
    function startR(cos, sin, size){
      if(!clear) return o.r0;
      var t = Math.min(Math.abs(cos) > 1e-6 ? clear.hw / Math.abs(cos) : Infinity,
                       Math.abs(sin) > 1e-6 ? clear.hh / Math.abs(sin) : Infinity);
      return Math.max(o.r0, t + size * 0.75 + clear.gap);   // 0.75: half-size + the glow halo
    }

    o.layers.forEach(function(L, li){
      for(var i = 0; i < o.lanes; i++){
        var a = ((360 / o.lanes) * i + L.rot) * Math.PI / 180;
        var cos = Math.cos(a), sin = Math.sin(a);
        var size = +((o.size[0] + Math.random() * (o.size[1] - o.size[0])) * L.scale).toFixed(2);
        if(size > maxSize) maxSize = size;
        var dur = +(o.dur[0] + Math.random() * (o.dur[1] - o.dur[0])).toFixed(1);
        var el = document.createElement("i"), r0 = startR(cos, sin, size);
        el.className = o.shapes[(i + li) % o.shapes.length];
        el.style.cssText =
          "--s:"  + size + "vmax;" +
          "--x1:" + (r0 * cos).toFixed(2) + "vmax;--y1:" + (r0 * sin).toFixed(2) + "vmax;" +
          "--x2:" + (o.r1 * cos).toFixed(2) + "vmax;--y2:" + (o.r1 * sin).toFixed(2) + "vmax;" +
          "--t:"  + dur + "s;" +
          "--d:-" + (Math.random() * dur).toFixed(1) + "s;" +     // negative = de-sync
          "--g:"  + (o.glow[0] + Math.random() * (o.glow[1] - o.glow[0])).toFixed(1) + "s;" +
          "--gd:-" + (Math.random() * 4).toFixed(1) + "s;" +
          "--o:"  + (o.opacity[0] + Math.random() * (o.opacity[1] - o.opacity[0])).toFixed(2) + ";";
        frag.appendChild(el);
      }
    });
    sky.appendChild(frag);

    // collision proof: lane arc at the tightest radius must be >= 1.5x the largest element
    var arc = (2 * Math.PI * o.r0) / o.lanes, ok = arc >= maxSize * 1.5;
    if(!ok && o.warn !== false){
      console.warn("[animation-kit] sky lanes too tight: arc " + arc.toFixed(2) +
        "vmax vs element " + maxSize.toFixed(2) + "vmax. Reduce lanes or size.");
    }
    return { arc:arc, maxSize:maxSize, safe:ok, count:sky.children.length };
  }

  M.sky = {
    defaults: {
      container:".sg-sky", lanes:29,
      layers:[{rot:0,scale:1},{rot:6.2,scale:0.62},{rot:-6.2,scale:0.55}],
      r0:22, r1:72, size:[0.8,2.6], dur:[18,34], glow:[3.0,4.8],
      opacity:[0.62,0.92], shapes:["s1","s2","s3","s4","s5"], warn:true,
      avoid:".sg-card", avoidBox:[1114,456], avoidGap:24   // [landing card clear] design px
    },
    init: function(opts){
      var o = Object.assign({}, this.defaults, opts || {}), res = null;
      this._last = opts;
      M.guard(function(){ res = build(o); });
      return res;
    }
  };
  M.ready(function(){ M.guard(function(){ if(!window.__skyManual) M.sky.init(); }); });
  /* the card's size in vmax changes with aspect ratio (rotation, split-screen), so re-plan the
     lanes after a resize settles - otherwise start points drift back inside the card. */
  var skyRz = 0;
  window.addEventListener("resize", function(){
    clearTimeout(skyRz);
    skyRz = setTimeout(function(){ M.guard(function(){ if(!window.__skyManual) M.sky.init(M.sky._last); }); }, 250);
  });
})();
/* ===== FLN ANIMATION KIT: sky-drift END ===== */

/* ===== FLN ANIMATION KIT: sky-burst BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;

  function boom(o){                      // sine thud + noise tail + square crackles
    var actx = M.audio(); if(!actx) return;
    try{
      var t = actx.currentTime, out = actx.createGain();
      out.gain.value = o.volume; out.connect(actx.destination);

      var tg = actx.createGain();
      tg.gain.setValueAtTime(0.9, t);
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      tg.connect(out);
      var osc = actx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);
      osc.connect(tg); osc.start(t); osc.stop(t + 0.18);

      var n = actx.sampleRate * 0.45;
      var buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
      for(var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
      var src = actx.createBufferSource(); src.buffer = buf;

      for(var c = 0; c < o.crackles; c++){
        var cg = actx.createGain(), ct = t + 0.10 + Math.random() * 0.30;
        cg.gain.setValueAtTime(0.0001, ct);
        cg.gain.exponentialRampToValueAtTime(0.18, ct + 0.006);
        cg.gain.exponentialRampToValueAtTime(0.0001, ct + 0.07);
        cg.connect(out);
        var co = actx.createOscillator();
        co.type = "square";
        co.frequency.setValueAtTime(1500 + Math.random() * 2200, ct);
        co.connect(cg); co.start(ct); co.stop(ct + 0.08);
      }
      var bp = actx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 3400; bp.Q.value = 0.8;
      var ng = actx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      src.connect(bp); bp.connect(ng); ng.connect(out); src.start(t + 0.02);
    }catch(_){}
  }

  function pop(el, r, o){
    el.classList.add("popped");
    // respawn on the next FLIGHT lap - the glow cycle is much shorter, so filter by name
    el.addEventListener("animationiteration", function back(e){
      if(e.animationName !== "sgFly") return;
      el.classList.remove("popped");
      el.removeEventListener("animationiteration", back);
    });

    var kind = "k-dot", cls = el.classList;
    for(var ci = 0; ci < cls.length; ci++){ if(o.kind[cls[ci]]) kind = o.kind[cls[ci]]; }

    var bs = Math.max(11, r.width);
    var b = document.createElement("div");
    b.className = "sg-burst " + kind;
    b.style.left = (r.left + r.width / 2) + "px";
    b.style.top  = (r.top  + r.height / 2) + "px";
    b.style.setProperty("--bs", bs + "px");
    b.appendChild(document.createElement("div")).className = "fl";

    var k = 0;
    for(var g = 0; g < o.rings.length; g++){
      var R = o.rings[g], off = Math.random() * Math.PI * 2;
      for(var i = 0; i < R.n; i++, k++){
        var a = off + i / R.n * Math.PI * 2;
        var dist = bs * R.rad * (0.78 + Math.random() * 0.44);
        var p = document.createElement("i");
        p.style.cssText =
          "--ps:"  + (bs * R.size * (0.8 + Math.random() * 0.5)).toFixed(1) + "px;" +
          "--dx:"  + (Math.cos(a) * dist).toFixed(1) + "px;" +
          "--dy:"  + (Math.sin(a) * dist).toFixed(1) + "px;" +
          "--gy:"  + (dist * o.gravity).toFixed(1) + "px;" +
          "--sd:"  + (R.dur + Math.random() * 0.22).toFixed(2) + "s;" +
          "--sdl:" + (Math.random() * 0.06).toFixed(3) + "s;" +
          "color:" + o.hues[k % o.hues.length];
        b.appendChild(p);
      }
    }
    document.body.appendChild(b);
    if(o.sound) boom(o);
    setTimeout(function(){ b.remove(); }, o.life);
  }

  M.skyBurst = {
    defaults: {
      container:".sg-sky", when:["is-start","is-end"],
      rings:[{n:9,rad:3.1,size:.58,dur:.80},{n:7,rad:1.8,size:.78,dur:.62}],
      hues:["#FCB717","#3B7DD8","#21A74A","#E5484D","#7048D6","#F1781D"],
      kind:{s1:"k-star",s2:"k-star",s3:"k-spark",s4:"k-dot",s5:"k-dot"},
      gravity:0.42, pad:12, padRatio:0.7, minAlpha:0.08, life:1200,
      sound:true, volume:0.22, crackles:4
    },
    init: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        var sky = typeof o.container === "string"
          ? document.querySelector(o.container) : o.container;
        if(!sky) return;
        // capture phase: .sg-sky is pointer-events:none, so hit-test by rect (R6)
        document.addEventListener("pointerdown", function(e){
          if(M.still()) return;
          if(!o.when.some(function(c){ return document.body.classList.contains(c); })) return;
          var els = sky.querySelectorAll("i:not(.popped)");
          for(var i = 0; i < els.length; i++){
            var el = els[i], r = el.getBoundingClientRect();
            if(r.width < 2) continue;
            var pad = Math.max(o.pad, r.width * o.padRatio);   // ~4px targets need slack
            if(e.clientX < r.left - pad || e.clientX > r.right  + pad ||
               e.clientY < r.top  - pad || e.clientY > r.bottom + pad) continue;
            if(parseFloat(getComputedStyle(el).opacity) < o.minAlpha) continue;
            // claim the tap, or it also fires the button under the star
            e.stopPropagation(); e.preventDefault();
            pop(el, r, o);
            return;
          }
        }, true);
      });
    }
  };
  M.ready(function(){ M.guard(function(){ M.skyBurst.init(); }); });
})();
/* ===== FLN ANIMATION KIT: sky-burst END ===== */

/* ===== FLN ANIMATION KIT: still-switch BEGIN ===== */
/* R5, second half. The kit's M.still() and the shipped starBurst both READ
   html.no-anim, but nothing in this activity ever SET it and there was no
   ?still=1 handler at all - so the kill-switch was unreachable. */
(function(){ "use strict";
  try{
    var q = new URLSearchParams(location.search);
    if(q.has("still") || (window.matchMedia &&
       matchMedia("(prefers-reduced-motion: reduce)").matches)){
      document.documentElement.classList.add("no-anim");
    }
  }catch(_){}
})();
/* ===== FLN ANIMATION KIT: still-switch END ===== */

/* ===== FLN ANIMATION KIT: nudge BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function place(el, o){
    var nh = document.getElementById(o.hand); if(!nh || !el) return;
    var host = document.querySelector(o.host); if(!host) return;
    var r = el.getBoundingClientRect(), sw = host.getBoundingClientRect(), s = M.scale();
    nh.style.left = ((r.left - sw.left)/s + r.width/s/2 + o.dx) + "px";
    nh.style.top  = ((r.top  - sw.top )/s + r.height/s   + o.dy) + "px";
    nh.classList.add("show");
  }
  M.nudge = {
    defaults:{ hand:"nudgeHand", host:".slide-stage", dx:-34.2, dy:-7.8, oneHand:true },   /* [QA 12] fingertip 8px below target */
    pointAt: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        if(o.oneHand) document.querySelectorAll(".demo-hand").forEach(function(h){ h.remove(); });
        place(el, o);
      });
    },
    after: function(target, ms, opts){            // returns cancel()
      var o = Object.assign({}, this.defaults, opts || {}), t = null;
      M.guard(function(){
        if(!ms || M.still()) return;
        t = setTimeout(function(){
          var el = (typeof target === "string") ? document.querySelector(target) : target;
          if(el) place(el, o);
        }, ms);
      });
      return function(){ clearTimeout(t); };
    },
    hide: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      var nh = document.getElementById(o.hand); if(nh) nh.classList.remove("show");
    }
  };
})();
/* ===== FLN ANIMATION KIT: nudge END ===== */

/* ===== FLN ANIMATION KIT: confetti BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function rnd(a, b){ return a + Math.random() * (b - a); }

  M.confetti = {
    defaults: {
      host:".stage-inner", count:80, stagger:0.35,
      fall:[1.1,1.8], drift:45, sway:[10,34], bob:[3,7],
      rockT:[0.6,1.2], tumbleT:[0.75,1.5], tumbleShare:0.22,
      amp:[28,52], yaw:30, depth:[0.75,1.15], tilt:25,
      /* weighted: star 40%, rectangle 20%, line 20%, square 20%.
         Repeat an entry to weight it - the array is sampled uniformly. */
      shapes:["st","st","st","st","rc","rc","ln","ln","sq","sq"],
      /* VIBGYOR. Front/back pairs - the back is the SAME hue darkened, never a
         different hue, or it reads as two pieces flickering instead of one turning. */
      colors:[["#8B2FC9","#5E1C8C"],   /* violet */
              ["#3F51B5","#27358A"],   /* indigo */
              ["#1E88E5","#135FA6"],   /* blue   */
              ["#22B24C","#157A34"],   /* green  */
              ["#FFD21E","#D9A800"],   /* yellow */
              ["#FF8A1E","#C75F00"],   /* orange */
              ["#E5322D","#A81F1B"]],  /* red    */
      phases:["guided","practice","mastery"]   /* [] disables phase gating */
    },
    burst: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        /* confetti ONLY on activity phases - never tutorials, demos, landing, transitions */
        if(o.phases.length && o.phase && o.phases.indexOf(o.phase) < 0) return;
        var host = document.querySelector(o.host); if(!host) return;

        var dist = host.clientHeight + 60, maxLife = 0;
        var wrap = document.createElement("div");
        wrap.className = "fx-confetti";

        for(var i = 0; i < o.count; i++){
          var z     = rnd(o.depth[0], o.depth[1]);        /* depth */
          var fall  = rnd(o.fall[0], o.fall[1]) / z;      /* nearer = bigger = faster */
          var delay = rnd(0, o.stagger);
          if(fall + delay > maxLife) maxLife = fall + delay;
          var pair = o.colors[i % o.colors.length];
          /* most pieces flutter (face stays visible); a minority go end-over-end */
          /* Two regimes, and a real plate moves DIFFERENTLY in each:
             flutter = zigzags hard, almost no net sideways drift;
             tumble  = autorotation gives a steady lateral force, so it barely
                       zigzags but drifts consistently to one side. */
          var flutter = Math.random() > o.tumbleShare;
          var rockT   = flutter ? rnd(o.rockT[0], o.rockT[1])
                                : rnd(o.tumbleT[0], o.tumbleT[1]);
          var sway    = flutter ? rnd(o.sway[0], o.sway[1]) : rnd(2, 8);
          var drift   = flutter ? rnd(-o.drift/2.5, o.drift/2.5) : rnd(-o.drift, o.drift);
          var bob     = flutter ? rnd(o.bob[0], o.bob[1]) : rnd(2, 4);

          /* set every property once - they inherit down to .w and .f */
          var p = document.createElement("i"); p.className = "p";
          p.style.cssText =
            "--x:"     + rnd(-2, 98).toFixed(1) + "%;" +
            "--dist:"  + dist + "px;" +
            "--fall:"  + fall.toFixed(2) + "s;" +
            "--delay:" + delay.toFixed(2) + "s;" +
            "--drift:" + drift.toFixed(0) + "px;" +
            "--sway:"  + sway.toFixed(0) + "px;" +
            "--bob:"   + bob.toFixed(1) + "px;" +
            "--rockT:" + rockT.toFixed(2) + "s;" +
            /* capped short of 90deg: even at max tilt the face still reads */
            "--amp:"   + Math.round(rnd(o.amp[0], o.amp[1])) + "deg;" +
            "--yaw:"   + Math.round(rnd(-o.yaw, o.yaw)) + "deg;" +
            "--tilt:"  + Math.round(rnd(-o.tilt, o.tilt)) + "deg;" +
            "--z:"     + z.toFixed(2) + ";" +
            "--dim:"   + (0.72 + (z - o.depth[0]) /
                          (o.depth[1] - o.depth[0]) * 0.28).toFixed(2) + ";" +
            /* shapes stay legible by ASPECT RATIO, not size - see the shape table */
            "--c:"     + pair[0] + ";--c2:" + pair[1] + ";";

          var w = document.createElement("i"); w.className = "w";
          var f = document.createElement("i");
          f.className = "f " + o.shapes[Math.floor(Math.random() * o.shapes.length)] +
                        (flutter ? "" : " tum");
          w.appendChild(f); p.appendChild(w); wrap.appendChild(p);
        }
        host.appendChild(wrap);
        /* lifetime is computed, not hard-coded - a longer fall cannot be cut off */
        setTimeout(function(){ wrap.remove(); }, (maxLife + 0.3) * 1000);
      });
    },
    /* stops a slide advancing mid-celebration. 8s safety cap. */
    after: function(fn){
      var started = Date.now();
      (function check(){
        if(!document.querySelector(".fx-confetti") || Date.now() - started > 8000){ fn(); return; }
        setTimeout(check, 200);
      })();
    }
  };
})();
/* ===== FLN ANIMATION KIT: confetti END ===== */

/* ===== FLN ANIMATION KIT: star-burst BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  M.starBurst = {
    defaults:{ host:"#confetti", w:1333, h:750,
      colors:["#FFE400","#FFBD00","#E89400","#FFCA6C","#FDFFB8"],
      /* retuned: fewer, slower, longer. Travel distance is held at ~547px so the
         burst still fills the same area - only the density and pace changed. */
      ticks:150, decay:0.975, startV:14, shots:[0,220,440], spin:0.18,
      stars:32, starScale:1.8, circles:8, circleScale:1.0 },
    fire: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        var host = document.querySelector(o.host); if(!host) return;
        var cv = document.createElement("canvas");
        cv.width = o.w; cv.height = o.h;                 // design grid, scaled by CSS
        cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
        host.appendChild(cv);
        var ctx = cv.getContext("2d"), parts = [];

        function starPath(r){
          ctx.beginPath();
          for(var i = 0; i < 10; i++){
            var rad = (i % 2 === 0) ? r : r/2, a = Math.PI/5*i - Math.PI/2;
            ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a)*rad, Math.sin(a)*rad);
          }
          ctx.closePath();
        }
        function add(n, scalar, shape){
          for(var i = 0; i < n; i++){
            var a = Math.random()*Math.PI*2;
            parts.push({ x:cv.width/2, y:cv.height/2, ax:Math.cos(a), ay:Math.sin(a),
              vel:o.startV*(0.5 + Math.random()), tick:0, scalar:scalar, shape:shape,
              color:o.colors[Math.floor(Math.random()*o.colors.length)],
              rot:Math.random()*Math.PI*2, spin:(Math.random()-.5)*o.spin });
          }
        }
        function shoot(){ add(o.stars, o.starScale, "star"); add(o.circles, o.circleScale, "circle"); }
        o.shots.forEach(function(ms){ ms ? setTimeout(shoot, ms) : shoot(); });

        /* derived from the LAST shot, so retiming the shots cannot end the loop
           before they have all fired. A hard-coded 30 breaks if shots move later. */
        var minFrames = Math.max.apply(null, o.shots) / 16 + 20;
        var frames = 0;
        (function frame(){
          ctx.clearRect(0, 0, cv.width, cv.height);
          var alive = false;
          for(var i = 0; i < parts.length; i++){
            var p = parts[i];
            if(p.tick >= o.ticks) continue;
            alive = true;
            p.x += p.ax*p.vel; p.y += p.ay*p.vel; p.vel *= o.decay;
            p.rot += p.spin; p.tick++;
            ctx.globalAlpha = 1 - p.tick/o.ticks;
            ctx.fillStyle = p.color;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            if(p.shape === "star"){ starPath(8*p.scalar); ctx.fill(); }
            else { ctx.beginPath(); ctx.arc(0, 0, 6*p.scalar, 0, Math.PI*2); ctx.fill(); }
            ctx.restore();
          }
          frames++;
          if(alive || frames < minFrames) requestAnimationFrame(frame);  // survive delayed shots
          else setTimeout(function(){ cv.remove(); }, 300);
        })();
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: star-burst END ===== */

/* ===== FLN ANIMATION KIT: correct-select BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function mk(cls){ var i = document.createElement("i"); i.className = cls; return i; }

  /* Every deferred step is parked ON THE TILE so clear() can cancel it. Without this
     a second play inherits the FIRST play's pending timers and they strip the state
     off the new beat part-way through. Owning the timers is what makes these safely
     re-fireable, which the 2-attempt ladder needs. */
  function later(el, fn, ms){ (el._selT = el._selT || []).push(setTimeout(fn, ms)); }

  /* Tempo lives in CSS (--fx-beat / --fx-reward) so the two effects cannot drift
     apart. JS reads it rather than keeping a second copy, and only writes --ckT or
     --wgT when a caller explicitly passes `dur`. Custom properties do not resolve
     calc(), so the two numbers are read and multiplied here rather than reading
     the composed value. */
  function tempo(el){
    var cs = getComputedStyle(el);
    function num(p, d){
      var v = parseFloat(cs.getPropertyValue(p));
      if(!v && v !== 0) return d;
      return v > 20 ? v / 1000 : v;              /* tolerate ms as well as s */
    }
    var beat = num("--fx-beat", 0.4);
    return { beat: beat, reward: beat * (parseFloat(cs.getPropertyValue("--fx-reward")) || 2) };
  }

  M.answer = {
    clear: function(el){
      if(!el) return;
      if(el._selT){ for(var j = 0; j < el._selT.length; j++) clearTimeout(el._selT[j]); }
      el._selT = [];
      el.classList.remove("ck-correct", "wg-wrong", "wg-out", "wg-rel");
      var fx = el.querySelectorAll(".ck-fx,.wg-fx");
      for(var i = 0; i < fx.length; i++) fx[i].remove();
    }
  };

  M.correctSelect = {
    defaults:{ crown:5 },      /* dur comes from CSS unless you pass one */
    play: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;                 /* forced reflow - restarts the pop */
        var dur = o.dur || tempo(el).reward;            /* CSS owns the tempo */
        if(o.dur) el.style.setProperty("--ckT", dur + "s");

        var fx = mk("ck-fx");

        if(o.crown && !M.still()){
          var cr = mk("ck-crown");
          /* clientWidth is layout px INSIDE the scaled stage - design px already.
             getBoundingClientRect() would come back multiplied by --scale (R1). */
          var w = el.clientWidth || 96, h = el.clientHeight || 96;
          var rx = w * 0.46, ry = h * 0.46;               /* the tile's own edge */
          for(var i = 0; i < o.crown; i++){
            var t  = (o.crown === 1) ? 0.5 : i / (o.crown - 1);
            var a  = (-158 + t * 136 + rnd(-7, 7)) * Math.PI / 180;   /* TOP arc */
            var x0 = Math.cos(a) * rx, y0 = Math.sin(a) * ry;
            var out = rnd(.20, .34);
            var s = mk("");
            s.style.cssText =
              "--ss:" + rnd(7, 12).toFixed(1) + "px;" +
              "--x0:" + x0.toFixed(1) + "px;" +
              "--y0:" + y0.toFixed(1) + "px;" +
              "--sx:" + (x0 + Math.cos(a) * w * out).toFixed(1) + "px;" +
              "--sy:" + (y0 + Math.sin(a) * h * out).toFixed(1) + "px;" +
              "--sr:" + Math.round(rnd(-140, 140)) + "deg;";
            cr.appendChild(s);
          }
          fx.appendChild(cr);
        }

        /* class FIRST: the border and the pop are the feedback, and they must not
           wait on ~9 nodes of decoration being built. Measured 45ms of dead time
           before any pixel moved when this ran the other way round. */
        el.classList.add("ck-correct");
        el.appendChild(fx);
        /* Only the TRANSIENT layers are swept. .ck-correct stays: the green outline
           is the correct-mark and it belongs to the tile until the slide advances. */
        later(el, function(){
          var t = fx.querySelectorAll(".ck-crown");
          for(var i = 0; i < t.length; i++) t[i].remove();
        }, dur * 1050);
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: correct-select END ===== */

/* ===== FLN ANIMATION KIT: wrong-select BEGIN ===== */
/* needs the `later`, `tempo` and `M.answer.clear` helpers from recipe 19 */
(function(){ "use strict";
  var M = window.FLNMotion;
  function mk(cls){ var i = document.createElement("i"); i.className = cls; return i; }
  function later(el, fn, ms){ (el._selT = el._selT || []).push(setTimeout(fn, ms)); }
  /* ---- KIT PATCH (install-time), not part of the published block ----------
     Recipe 20's header says it "needs the `later`, `tempo` and `M.answer.clear`
     helpers from recipe 19". It re-declares `mk` and `later` in this IIFE but not
     `tempo`, which is local to recipe 19's IIFE - so both play() and out() threw
     `ReferenceError: tempo is not defined`. M.guard swallows it, so the wrong
     answer beat was silently DEAD rather than visibly broken. Verified with node
     before patching. Remove this once the kit block carries the helper itself. */
  function tempo(el){
    var cs = getComputedStyle(el);
    function num(p, d){
      var v = parseFloat(cs.getPropertyValue(p));
      if(!v && v !== 0) return d;
      return v > 20 ? v / 1000 : v;              /* tolerate ms as well as s */
    }
    var beat = num("--fx-beat", 0.4);
    return { beat: beat, reward: beat * (parseFloat(cs.getPropertyValue("--fx-reward")) || 2) };
  }

  M.wrongSelect = {
    defaults:{},               /* dur comes from CSS unless you pass one */

    /* transient: shakes, holds red, then RELEASES */
    play: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;
        var dur = o.dur || tempo(el).beat;              /* CSS owns the tempo */
        if(o.dur) el.style.setProperty("--wgT", dur + "s");
        el.classList.add("wg-wrong");          /* class first - see recipe 19 */
        var fx = mk("wg-fx"); fx.appendChild(mk("wg-pulse"));
        el.appendChild(fx);
        /* RELEASE on a timeout, never on animationend: under the reduced-motion kill
           switch animationend never fires and the tile would stay red forever - on
           exactly the devices least able to recover from it. (R5, second half.)
           .wg-rel goes on BEFORE .wg-wrong comes off so the border has something to
           transition with. */
        later(el, function(){
          el.classList.add("wg-rel");
          el.classList.remove("wg-wrong");
          var f = el.querySelector(".wg-fx"); if(f) f.remove();
          later(el, function(){
            el.classList.remove("wg-rel");
            if(o.then) o.then();
          }, 260);
        }, dur * 1500 + 40);
      });
    },

    /* elimination: shakes once, recedes, and STAYS recessed. No auto-clear. */
    out: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;
        var dur = o.dur || tempo(el).beat;
        if(o.dur) el.style.setProperty("--wgT", dur + "s");
        el.classList.add("wg-out");
        var fx = mk("wg-fx"); fx.appendChild(mk("wg-pulse"));
        el.appendChild(fx);
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: wrong-select END ===== */

/* ===== FLN ANIMATION KIT: object-outline BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  var ST = ["is-correct", "is-wrong", "is-muted"];

  M.objectOutline = {
    /* state is just a class - both engines read the same ones */
    set: function(el, state){
      M.guard(function(){
        if(!el) return;
        for(var i = 0; i < ST.length; i++) el.classList.remove(ST[i]);
        void el.offsetWidth;                  /* restart - as in recipe 19 */
        if(state) el.classList.add("is-" + state);
      });
    },
    correct: function(el){ this.set(el, "correct"); },
    muted:   function(el){ this.set(el, "muted"); },
    reset:   function(el){ if(el && el._olT) clearTimeout(el._olT); this.set(el, ""); },

    /* wrong RELEASES back to idle white - the child has another attempt, exactly
       as the tile does in recipe 20. Timeout, never animationend: under the
       reduced-motion kill-switch animationend never fires. */
    wrong: function(el, opts){
      var o = opts || {}, self = this;
      M.guard(function(){
        if(!el) return;
        self.set(el, "wrong");
        var v = parseFloat(getComputedStyle(el).getPropertyValue("--olT")) || 0.4;
        if(v > 20) v = v / 1000;
        if(el._olT) clearTimeout(el._olT);
        el._olT = setTimeout(function(){
          el.classList.remove("is-wrong");
          if(o.then) o.then();
        }, v * 1500 + 40);
      });
    },

    /* OPTIONAL, and read the caveat. A rectangular hit box over an irregular sprite
       steals taps meant for whatever is behind it - two overlapping characters and
       the child taps the wrong one. This tests the tap against the sprite's ALPHA.
       It FAILS OPEN: reading pixels back taints the canvas on file://, which is how
       the activities ship, so there it always returns true and you are back to the
       bounding box. Treat it as a dev-server nicety, not a guarantee - the reliable
       fix is z-order and not overlapping the tappable parts in the first place. */
    alphaHit: function(img, clientX, clientY){
      var r = img.getBoundingClientRect();
      if(clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom)
        return false;
      if(img._olA === undefined){
        try{
          var w = Math.min(img.naturalWidth, 256);
          var h = Math.round(img.naturalHeight * w / img.naturalWidth);
          var c = document.createElement("canvas"); c.width = w; c.height = h;
          var x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
          img._olA = x.getImageData(0, 0, w, h);
        }catch(e){ img._olA = null; }         /* tainted - fail OPEN */
      }
      if(!img._olA) return true;
      var d = img._olA;
      var px = Math.floor((clientX - r.left) / r.width  * d.width);
      var py = Math.floor((clientY - r.top)  / r.height * d.height);
      return d.data[(py * d.width + px) * 4 + 3] > 24;
    }
  };
})();
/* ===== FLN ANIMATION KIT: object-outline END ===== */

/* [engine JS] DEV NAV — a review/QA slide navigator. Shows ONLY with ?dev=1 or ?nav=1 (children never
   see it). Jump to any slide by dropdown, step ◀▶, first/last, or back to the landing. Uses the
   engine's own mountSlide + state.idx; a light poll keeps the label synced when the game self-advances. */
function buildDevNav(){
  if(document.getElementById("devNav")) return;
  const bar = document.createElement("div"); bar.id = "devNav"; bar.className = "dev-nav";
  const mk = (txt, title)=>{ const b = document.createElement("button"); b.className = "dev-nav-btn"; b.textContent = txt; if(title) b.title = title; return b; };
  const land = mk("⌂", "landing"), first = mk("⏮", "first"), prev = mk("◀", "prev"), next = mk("▶", "next"), last = mk("⏭", "last");
  const sel = document.createElement("select"); sel.className = "dev-nav-sel"; sel.title = "jump to slide";
  CARD.slides.forEach((s, i)=>{ const o = document.createElement("option"); o.value = i; o.textContent = (i+1) + ". " + s.id + " · " + s.type; sel.appendChild(o); });
  const lbl = document.createElement("span"); lbl.className = "dev-nav-lbl";
  const cur = ()=> (state && typeof state.idx === "number") ? state.idx : 0;
  const leaveStart = ()=>{ const sg = $("startGate"); if(sg) sg.classList.add("hidden"); document.body.classList.remove("is-start"); document.body.classList.add("loaded"); const bl = $("bootLoader"); if(bl) bl.remove(); };
  const sync = ()=>{ const i = cur(); const s = CARD.slides[i]; if(document.activeElement !== sel) sel.value = i;
    lbl.textContent = (i+1) + "/" + CARD.slides.length + (s ? " · " + s.id : ""); };
  const go = (i)=>{ i = Math.max(0, Math.min(i, CARD.slides.length - 1)); leaveStart(); mountSlide(i); sync(); };
  land.onclick = ()=>{ const sg = $("startGate"); if(sg){ sg.classList.remove("hidden"); document.body.classList.add("is-start"); } };
  first.onclick = ()=> go(0); prev.onclick = ()=> go(cur() - 1); next.onclick = ()=> go(cur() + 1); last.onclick = ()=> go(CARD.slides.length - 1);
  sel.onchange = ()=> go(parseInt(sel.value, 10));
  bar.append(land, first, prev, sel, lbl, next, last);
  document.body.appendChild(bar);
  setInterval(sync, 300); sync();
}

boot();

/* ---------- [landing dust] sunlit dust motes on the first screen ----------
   Real dust in a sunbeam, not sprites on rails:
   - VISIBLE ONLY WHERE LIT. Each speck's brightness = the sunlight at its position:
     a falloff spilling down-right from the sun (.sg-sun, read live), so motes
     glint near the window and fade out toward the shaded right side.
   - DRIFTS ON AIR, NOT ON THE LIGHT. Light does not push dust: motion = a slow room
     draught from the window (down-right) + smooth per-particle turbulence + a tiny
     gravity settle + damping (dust is light, drag dominates). No straight paths.
   - TUMBLES. Flakes glint as they rotate to face the sun: brightness pulses ^3.
   - DEPTH. z 0..1: far = tiny, sharp, slow, dim; near = larger, softer (out of
     focus), faster across the screen (parallax). Most dust is far.
   - COMES FROM THE WINDOW (review 2026-09-29: "the particles coming from the direction of
     sunlight?" - 80 dim specks drifting ~5px/s were too faint to see): the draught blows ALONG the
     light (26deg, down-right), most specks re-enter in the sunlit window and fade in there, and
     there are more, slightly larger, brighter specks.
   Pauses off the landing and when the tab is hidden; one static frame under
   prefers-reduced-motion. Coordinates are .sg-fx-local design px (1096x438). */
(function(){
  const cv = document.getElementById("sgDust"); if(!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d"), W = 1096, H = 438, N = 120;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // soft round sprite (one draw per mote); small sizes read as crisp points
  const spr = document.createElement("canvas"); spr.width = spr.height = 32;
  (function(){ const g = spr.getContext("2d"), r = g.createRadialGradient(16,16,0,16,16,16);
    r.addColorStop(0, "rgba(255,251,236,1)"); r.addColorStop(.45, "rgba(255,244,215,.75)");
    r.addColorStop(1, "rgba(255,236,196,0)"); g.fillStyle = r; g.fillRect(0,0,32,32); })();

  /* light field = the sun (the .sg-sun anchor, read live) spilling into the room: an
     elongated falloff pointing down-right from the window (~26deg, the angle of the
     painted wall streak) - bright near the window, gone by the shaded right side. */
  let sun = { x:170, y:70 };
  const LA = 26 * Math.PI / 180, LC = Math.cos(LA), LS = Math.sin(LA);
  function readSun(){
    const f = document.querySelector(".sg-fx .sg-sun");
    if(f) sun = { x:f.offsetLeft, y:f.offsetTop };            // .sg-sun is a 0x0 anchor AT the sun
  }
  function light(x, y){
    const dx = x - sun.x, dy = y - sun.y;
    const s = dx * LC + dy * LS, c = -dx * LS + dy * LC;       // along / across the spill
    const sa = s >= 0 ? s / 520 : s / 150;                     // reaches far into the room, little behind the sun
    return Math.exp(-(sa * sa + (c / 230) * (c / 230)));
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(p, fresh){
    p.z = Math.pow(Math.random(), 1.8);                        // bias far
    // start anywhere on screen the first time; later mostly re-enter IN the sunlit window (fading in there,
    // so they visibly come out of the light), the rest from the window-side edges
    const r0 = Math.random();
    if(fresh){ p.x = rnd(-20, W * .75); p.y = rnd(-10, H); }
    else if(r0 < .7){ p.x = sun.x + rnd(-130, 70); p.y = sun.y + rnd(-60, 90); }
    else if(r0 < .85){ p.x = rnd(-30, -5); p.y = rnd(0, H * .6); }
    else { p.x = rnd(0, W * .4); p.y = rnd(-30, -5); }
    p.vx = rnd(-2, 2); p.vy = rnd(-2, 2);
    p.r  = 1.1 + p.z * 3.4;                                    // radius px
    p.f1 = rnd(.07, .19); p.f2 = rnd(.11, .27); p.ph1 = rnd(0, 6.3); p.ph2 = rnd(0, 6.3);
    p.spin = rnd(.6, 2.2); p.sph = rnd(0, 6.3);
    p.fade = fresh ? 1 : 0;                                    // ease in after respawn
    return p;
  }
  const P = Array.from({length:N}, () => spawn({}, true));

  function fit(){
    const sc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
    const k = Math.min(sc * (window.devicePixelRatio || 1), 2);  // cap backing store for low-end GPUs
    cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    readSun();
    if(reduce) draw(8);                                        // resizing clears the canvas
  }

  function step(p, t, dt){
    const par = .45 + p.z * .9;                                // parallax: near crosses faster
    // room draught from the window, ALONG the light (LA) + slow global gusts
    const ws = 13 + 4 * Math.sin(t * .09);
    const wx = ws * LC, wy = ws * LS + 1.2 * Math.sin(t * .07 + 1.3);
    // smooth turbulence (two incommensurate sines per axis = no visible loop)
    const tx = 7 * Math.sin(t * p.f1 + p.ph1) + 4 * Math.sin(t * p.f2 * 1.7 + p.ph2);
    const ty = 6 * Math.cos(t * p.f2 + p.ph2) + 3 * Math.sin(t * p.f1 * 2.3 + p.ph1);
    const g  = .8 + p.z * .9;                                  // settling: heavier near flakes sink a touch faster
    // drag toward the local air velocity (dust has almost no inertia) + Brownian jitter
    const k = 1 - Math.exp(-1.6 * dt);
    p.vx += ((wx + tx) - p.vx) * k + rnd(-1, 1) * 6 * dt;
    p.vy += ((wy + ty + g) - p.vy) * k + rnd(-1, 1) * 6 * dt;
    p.x += p.vx * par * dt; p.y += p.vy * par * dt;
    if(p.fade < 1) p.fade = Math.min(1, p.fade + dt / 1.5);
    if(p.x > W + 20 || p.y > H + 20 || p.x < -40 || p.y < -40) spawn(p, false);
  }

  function draw(t){
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for(const p of P){
      const L = light(p.x, p.y);
      if(L < .02) continue;                                    // in shade: invisible, like real dust
      const glint = .5 + .5 * Math.pow(Math.max(0, Math.sin(t * p.spin + p.sph)), 3);
      const depth = .45 + .55 * (1 - Math.abs(p.z - .35));     // far dim, very near slightly defocused
      const a = Math.min(1, L * 1.7) * glint * depth * p.fade;
      if(a < .02) continue;
      const d = p.r * 2 * (p.z > .7 ? 1.35 : 1);               // near = out-of-focus blur disc
      ctx.globalAlpha = p.z > .7 ? a * .6 : a;
      ctx.drawImage(spr, p.x - d / 2, p.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  let last = 0, t = 0;
  function frame(now){
    requestAnimationFrame(frame);
    if(!document.body.classList.contains("is-start")){ last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now; t += dt;
    for(const p of P) step(p, t, dt);
    draw(t);
  }

  fit();
  window.addEventListener("resize", () => { clearTimeout(fit._t); fit._t = setTimeout(fit, 200); });
  window.addEventListener("load", fit);
  if(reduce){ for(let i = 0; i < 240; i++) for(const p of P) step(p, i / 30, 1 / 30); draw(8); }
  else requestAnimationFrame(frame);
})();

JLanding.intro();   // [jalebi landing] no intro animation: the play button follows the greeting

/* ==== HI02H11_L02_S02's celebration Swiftie (user 2026-10-23): its kit player + its wrapper, as they are ==== */
/* ============================================================================================
   SWIFTIE CELEBRATION KIT — player (framework-free, no dependencies)
   ============================================================================================
   Plays the three celebration sheets (cel_shabaash / cel_talk / cel_idle) lip-synced to a voice-over.

     SwiftieCelebration.play({
       host:     <element>,                 // where Swiftie goes (she fills its height)
       meta:     <cel_meta.json object>,    // frame size, grid, open-mouth frames, roles
       base:     "assets/UI/celebration/",  // folder the three .webp sheets are served from
       bits:     "0001111...",              // lip-sync track from make_lipsync.py (25 ms per char)
       step_ms:  25,
       // THE CLOCK — give ONE of these:
       audio:    <HTMLAudioElement>,        // best: time = audio.currentTime
       isSounding: ()=> bool                // or: true while the VO is sounding (timer starts then)
     })  -> { stop() }

   Timeline (all from the VO clock):
     before the first sound   shabaash 0-5    standing, mouth shut
     first word («शाबाश!»)    shabaash 6-29   the jump, mouth open — stretched to that word
     the pause after it       shabaash 30-35  lands, mouth shut
     rest of the line         talk sheet: a cursor walks the sheet forward (so the body keeps moving)
                              but only lands on frames whose mouth matches the track at that instant
     after the VO             idle sheet, mouth-shut frames only, looping
   Measured on MTG2A04_L01_S01: mouth = VO in 99.6-100 % of samples; every miss within one paint.
   ============================================================================================ */
(function(global){
  "use strict";
  function play(o){
    const M = o.meta, base = (o.base || "").replace(/\/?$/, "/");
    const bits = o.bits || "", step = o.step_ms || 25;
    const S = M.shabaash, T = M.talk, I = M.idle, COLS = M.cols || 6, N = M.frames || 36;
    const OPEN = new Set(T.open);
    let stopped = false;

    const sp = document.createElement("div");
    sp.className = "swc-sprite";
    sp.innerHTML = '<div class="swc-art"></div>';
    o.host.appendChild(sp);
    const art = sp.firstChild;
    art.style.aspectRatio = M.fw + " / " + M.fh;
    [S, T, I].forEach(s => { const i = new Image(); i.src = base + s.src; });   /* warm all three */

    let cur = "";
    const show = (sheet, i)=>{
      const url = base + sheet.src;
      if(url !== cur){ art.style.backgroundImage = 'url("' + url + '")'; cur = url; }
      const c = i % COLS, r = Math.floor(i / COLS);
      art.style.backgroundPosition = (c * 100 / (COLS - 1)) + "% " + (r * 100 / (COLS - 1)) + "%";
      sp.dataset.sheet = sheet === S ? "shabaash" : (sheet === I ? "idle" : "talk"); sp.dataset.f = i;
    };
    show(S, S.pre[0]);

    const loud = (t)=> bits.charAt(Math.floor(t / step)) === "1";
    const GAP = Math.round(200 / step);                       /* a 200 ms silence ends the first word */
    let s0 = bits.indexOf("1"), e0 = s0, gap = 0;
    for(let k = s0; k >= 0 && k < bits.length; k++){ if(bits[k] === "1"){ e0 = k; gap = 0; } else if(++gap >= GAP) break; }
    const speechStart = Math.max(0, s0) * step, wordEnd = (e0 + 1) * step;
    const ns = bits.indexOf("1", e0 + GAP), nextStart = ns < 0 ? wordEnd : ns * step;
    const lenMs = bits.length * step;
    const seg = (list, t, a, b)=> list[Math.min(list.length - 1, Math.max(0, Math.floor((t - a) / Math.max(1, b - a) * list.length)))];

    const idle = ()=>{ let j = 0; (function tick(){ if(stopped || !sp.isConnected) return;
      show(I, I.loop[j % I.loop.length]); j++; setTimeout(tick, 110); })(); };

    /* the clock */
    let t0 = 0, started = false;
    /* audio.currentTime advances in coarse steps in some browsers, so it only ANCHORS a smooth clock:
       t0 is set once from it when the clip starts; after that time is performance.now() - t0 */
    const t_now = ()=> performance.now() - t0;
    const sounding = ()=> o.audio ? (!o.audio.paused && !o.audio.ended) : !!(o.isSounding && o.isSounding());
    const waitStart = performance.now();
    let cursor = 0, curOpen = null, lastStep = 0;
    (function frame(){
      if(stopped || !sp.isConnected) return;
      const now = performance.now();
      if(!started){
        if(sounding() && (!o.audio || o.audio.currentTime > 0)){ started = true; t0 = now - (o.audio ? o.audio.currentTime * 1000 : 0); }
        else if(now - waitStart > 1800){ idle(); return; }            /* the VO never started */
        else { requestAnimationFrame(frame); return; }
      }
      const t = t_now(); sp.dataset.t = Math.round(t);
      if(!sounding() || t > lenMs + 400){ idle(); return; }
      if(t < speechStart) show(S, seg(S.pre, t, 0, speechStart));
      else if(t < wordEnd) show(S, seg(S.word, t, speechStart, wordEnd));
      else if(t < nextStart) show(S, seg(S.post, t, wordEnd, nextStart));
      else {
        const want = loud(t + 16);                        /* one paint ahead: the frame shows on the NEXT paint */
        if(want !== curOpen || now - lastStep > 80){      /* at once on a mouth change, else every 80 ms */
          let k = 1;
          while(k < N && OPEN.has((cursor + k) % N) !== want) k++;
          cursor = (cursor + k) % N; show(T, cursor); curOpen = want; lastStep = now;
        }
      }
      requestAnimationFrame(frame);
    })();
    return { el: sp, stop(){ stopped = true; } };
  }
  global.SwiftieCelebration = { play };
})(window);


/* [r85] THE CELEBRATION SWIFTIE - the kit's README wrapper, verbatim in intent. The engine's
   CELEBRATION module is wrapped, not edited: it still does everything it did (sfx, sunburst, stars,
   the arrow), then the stock .end-mascot is hidden and a 300x358 host takes its place - the mascot's
   own 358 px layout height, so the arrow below it keeps its exact size and position.
   The clock is the clip's own - see THE CLOCK below. */
(function(){
  if(typeof SlideModules === "undefined" || !SlideModules.CELEBRATION || typeof CARD === "undefined"
     || !CARD.end_anim || typeof SwiftieCelebration === "undefined") return;
  const EA = CARD.end_anim;
  /* the three sheets (~2 MB) are fetched quietly 12 s after the lesson loads, so on a first visit
     they are in the cache long before the last page: the kit only starts loading them when the
     celebration mounts, and on a slow connection the jump (350 ms in) would play before its sheet
     had arrived. Kept referenced so the cached copies are not dropped. */
  const _warm = [];
  const warm = ()=> [EA.meta.shabaash, EA.meta.talk, EA.meta.idle].forEach(s => {
    const i = new Image(); i.decoding = "async"; i.src = EA.base + s.src; _warm.push(i); });
  const arm = ()=> setTimeout(warm, 12000);
  if(document.readyState === "complete") arm(); else window.addEventListener("load", arm);
  /* THE CLOCK. The kit takes `audio` - anything with paused / ended / currentTime - and anchors
     itself as  t0 = now - currentTime  the first time it sees the clip sounding. Measured here: the
     celebration mounts in a burst of work (sunburst, stars, sound), the page's main thread stalls
     150-330 ms right as the clip starts, and a yes/no "sounding" signal is only noticed on the first
     frame AFTER the stall - which put the whole lip-sync 170-1470 ms late when opened as a file.
     So the clock below reports how long the clip has really been audible, from the moment it
     became so, however late the next frame runs:
       · Web Audio (served): when the engine started the source, + the context's output latency
       · <audio> (opened as a file): the element's own "playing" event timestamp */
  const _st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function(when){
    try{ const c = this.context;
      this.__swcAt = performance.now() + ((when && when > c.currentTime) ? (when - c.currentTime) * 1000 : 0)
                     + ((c.baseLatency || 0) + (c.outputLatency || 0)) * 1000; }catch(e){}
    return _st.apply(this, arguments);
  };
  const heardAt = ()=>{
    const a = currentAudio;
    if(a){
      if(!a.__swc){ a.__swc = true;
        a.addEventListener("playing", (e)=>{ a.__swcAt = e.timeStamp - a.currentTime * 1000; }); }
      return a.paused ? null : (a.__swcAt != null ? a.__swcAt
                               : (a.currentTime > 0 ? performance.now() - a.currentTime * 1000 : null));
    }
    return (typeof currentVoiceSource !== "undefined" && currentVoiceSource) && currentVoiceSource.__swcAt != null ? currentVoiceSource.__swcAt : null;
  };
  const clock = {
    get paused(){ return !isPlaying || heardAt() == null; },
    get ended(){ return !isPlaying; },
    get currentTime(){ const t = heardAt(); return t == null ? 0 : Math.max(0, performance.now() - t) / 1000; }
  };
  const _cel = SlideModules.CELEBRATION.mount;
  SlideModules.CELEBRATION.mount = function(host, slide){
    const r = _cel.apply(this, arguments);
    const img = document.querySelector("#endScreen .end-mascot");
    let box = document.getElementById("celBox");
    if(!box && img){ box = document.createElement("div"); box.id = "celBox";
      /* the stock mascot's OWN layout height, measured before it is hidden: 330 px wide at its
         516x476 art is 357.72 px, not the kit's 358 - and 0.28 px is a whole screen pixel of arrow
         movement at 1920x1080. Falls back to the kit's 358 if the stock art never loaded. */
      const h = 357.72;   // (HI02H11's stock mascot box: 330px wide at its 516x476 art - ours has other art, so its number is taken)
      box.style.cssText = "width:300px;height:" + h + "px;position:relative;z-index:2";
      img.parentNode.insertBefore(box, img); }
    if(!box) return r;
    if(img) img.style.display = "none";
    box.innerHTML = "";
    /* [r106] SHE JUMPS AND CELEBRATES FIRST, THEN SPEAKS. Yasir: "in the last celebration screen Swifty
       jumps and celebrates, then starts speaking - the VO should only play when she starts speaking".
       So the line is NOT played by the page on arrival (ownsAudio): the jump - the kit's own शाबाश
       sheet, its standing frames and its jump frames - plays first, silent but for the celebration
       sound; then the line starts and the kit's player takes over, with a track arranged so that it
       finishes the landing over the clip's lead-in and then lip-syncs the WHOLE line on the talk
       sheet (a 25 ms stand-in "first word" stops the kit spending the real first words on a jump). */
    state.ownsAudio = true;
    const M = EA.meta, S = M.shabaash, COLS = M.cols || 6;
    const sp = document.createElement("div"); sp.className = "swc-sprite";
    sp.innerHTML = '<div class="swc-art"></div>'; box.appendChild(sp);
    const art = sp.firstChild; art.style.aspectRatio = M.fw + " / " + M.fh;
    art.style.backgroundImage = 'url("' + EA.base + S.src + '")';
    const showF = (i)=>{ const c = i % COLS, rr = Math.floor(i / COLS);
      art.style.backgroundPosition = (c * 100 / (COLS - 1)) + "% " + (rr * 100 / (COLS - 1)) + "%";
      sp.dataset.sheet = "shabaash"; sp.dataset.f = i; };
    const frames = S.pre.concat(S.word), FMS = 45;          /* ~22 fps: 30 frames, 1.35 s */
    showF(frames[0]);
    const bits = EA.track.bits, lead = Math.max(0, bits.indexOf("1"));
    const step = EA.track.step_ms || 25;
    const bits2 = "1" + "00000000" + bits.slice(lead);      /* stand-in word, 200 ms gap, the line */
    const shift = (9 - lead) * step / 1000;                 /* keeps the line on the clip's clock */
    const clock2 = {
      get paused(){ return clock.paused; }, get ended(){ return clock.ended; },
      get currentTime(){ const t = clock.currentTime; return t > 0 ? Math.max(0.001, t + shift) : 0; }
    };
    const t0 = performance.now();
    (function jump(){
      if(!sp.isConnected || CARD.slides[state.idx] !== slide) return;
      const k = Math.floor((performance.now() - t0) / FMS);
      if(k < frames.length){ showF(frames[k]); requestAnimationFrame(jump); return; }
      /* the jump is over: the line starts, and the kit takes over the moment it is sounding */
      const src = (typeof audioFor === "function") ? audioFor(slide, "prompt") : null;
      if(src) play(src, ()=>{});
      const h = SwiftieCelebration.play({ host: box, meta: M, base: EA.base, bits: bits2, step_ms: step, audio: clock2 });
      h.el.style.animation = "none"; h.el.style.position = "absolute"; h.el.style.inset = "0";
      h.el.style.visibility = "hidden";
      (function swap(){
        if(!h.el.isConnected) return;
        if(h.el.dataset.t !== undefined || h.el.dataset.sheet === "idle"){ h.el.style.visibility = ""; sp.remove(); return; }
        requestAnimationFrame(swap);
      })();
    })();
    return r;
  };
})();
