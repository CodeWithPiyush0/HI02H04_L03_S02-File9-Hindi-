"""One-time import of the v1 Jalebi assets (_archive_v1/assets) into the File6 shell's layout:
assets/images/*.webp, assets/video/*, assets/voiceover/<id>.ogg, assets/sfx/*. Never overwrites."""
import os, shutil
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD = os.path.join(ROOT, "_archive_v1", "assets")
def put(src, dst):
    s, d = os.path.join(OLD, src), os.path.join(ROOT, "assets", dst)
    if os.path.exists(d): return
    os.makedirs(os.path.dirname(d), exist_ok=True)
    if d.endswith(".webp") and not s.endswith(".webp"):
        Image.open(s).save(d, "WEBP", quality=90, method=6)
    else:
        shutil.copyfile(s, d)
IMG = {
    "scene_1": "Images/halwai_480x250.png", "scene_2": "Images/jalebi_480x250.png", "scene_3": "Images/muniya_jalebi_480x250.png", "scene_4": "Images/muniyya_jalebi_480x250.png",
    "scene_5": "Images/muniya_mummy_money_480x250.png", "scene_6": "Images/muniya_jalebi_khaayi_480x250.png",
    "kadai": "Images/opt_kadai.webp", "mithai": "Images/opt_mithai.webp", "jalebi": "Images/opt_jalebi.webp",
    "chashni": "Images/opt_chashni.webp", "chulha": "Images/opt_chulha.webp", "halwai": "Images/opt_halwai-replacement-v2.png",
    "chor": "Images/opt_chor-replacement.png", "sher": "Images/opt_sher-replacement.png", "hathi": "Images/opt_hathi-replacement.webp",
    "mela": "Images/opt_mela-replacement.webp", "ped": "Images/opt_ped-replacement.webp", "phool": "Images/opt_phool-replacement.webp",
    "raja": "Images/opt_raja-replacement.webp", "raat": "Images/opt_raat-replacement.webp", "paani": "Images/opt_paani-replacement.webp",
    "gaana": "Images/opt_gaana-replacement.webp", "haath": "Images/opt_haath-replacement.webp",
    "gift_closed": "UI/gift-box-closed.png", "gift_open": "UI/gift-box-open.png", "trophy": "UI/trophy-reward.png",
    "title_art": "UI/jalebi-title-screen-v4.webp",
}
for k, v in IMG.items(): put(v, f"images/{k}.webp")
for f in ("sfx_gift_open", "sfx_trophy_fanfare", "sfx_star_pop_new"): put(f"Audio/{f}.ogg", f"sfx/{f}.ogg")
VO = {"vo_landing": "vo_ppt_landing", "vo_pt_tutorial": "vo_ppt_tutorial", "vo_pt_practice": "vo_pt_practice",
      "vo_t7_words": "vo_ppt_t7_words", "vo_t7_conclude": "vo_ppt_t7_conclude", "vo_t8": "vo_ppt_t8", "vo_t9": "vo_ppt_t9",
      "vo_g1_prompt": "vo_ppt_g1_prompt", "vo_g1_hint2": "vo_ppt_g1_hint2", "vo_g1_correct": "vo_ppt_g1_correct",
      "vo_box_intro": "vo_ppt_boxes_intro", "vo_box_next": "vo_ppt_boxes_next"}
VO.update({f"vo_l{i}": f"vo_l{i}" for i in range(1, 9)})
VO.update({f"vo_pw_{i:02d}": f"vo_pw_{i:02d}" for i in range(30)})
VO.update({f"vo_word_{i}": f"vo_ppt_word_{i}" for i in range(29)})
for g in range(2, 7):
    for r in ("prompt", "hint1", "hint2", "hint3"):
        if g == 5 and r == "prompt": continue                     # (new line - updated deck)
        VO[f"vo_g{g}_{r}"] = f"vo_ppt_g{g}_{r}"
for b in range(1, 7):
    VO[f"vo_box{b}"] = f"vo_ppt_box{b}"; VO[f"vo_box{b}_hint2"] = f"vo_ppt_box{b}_hint2"
for w in ("kadai", "mithai", "jalebi", "chashni", "chulha", "halwai", "rajai", "paise"): VO[f"vo_o_{w}"] = f"vo_o_opt_{w}"
for k, v in VO.items(): put(f"Audio/{v}.ogg", f"voiceover/{k}.ogg")
print(len(IMG), "images,", len(VO), "VO clips")
