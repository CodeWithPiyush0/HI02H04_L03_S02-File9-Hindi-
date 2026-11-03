/* Content corrections transcribed from HI02H04_L03_S02_review.pptx.
   The standard lesson shell remains in index.html/app.js/style.css. */
window.applyJalebiPptReview = function(card){
  if(!card || card.skill_code !== "HI02H04_L03_S02") return;
  const byId = id => card.slides.find(slide => slide.id === id);
  // Updated 480 x 250 poem illustrations supplied for the six reading pages.
  Object.assign(card.assets.image, {
    scene_1: "assets/Images/halwai_480x250.png",
    scene_2: "assets/Images/jalebi_480x250.png",
    scene_3: "assets/Images/muniya_jalebi_480x250.png",
    scene_4: "assets/Images/muniyya_jalebi_480x250.png",
    scene_5: "assets/Images/muniya_mummy_money_480x250.png",
    scene_6: "assets/Images/muniya_jalebi_khaayi_480x250.png"
  });
  ["T1","T2","T3","T4","T5","T6"].forEach(id=>{const s=byId(id);if(s)s.prompt_hi="कविता पढ़िए";});
  card.assets.audio.vo_mic_intro="assets/Audio/vo_mic_intro.ogg";
  card.assets.audio_text.vo_mic_intro="इस बटन पर टैप कीजिए और वाक्य पढ़िए।";
  ["T1","T2","T3","T4","T5","T6"].forEach(id=>{
    const s=byId(id);if(s)s.audio.prompt=id==="T1"?"vo_mic_intro":null;
  });
  if(byId("T7")) byId("T7").prompt_hi="कविता फिर से सुनिए।";
  if(byId("T8")) byId("T8").prompt_hi="कढ़ाई-मिठाई, तुकांत शब्द हैं।";
  if(byId("T9")) byId("T9").prompt_hi="जलेबी-चाशनी, तुकांत शब्द नहीं हैं।";
  if(byId("G1")) byId("G1").prompt_hi="आई की आवाज़ वाले सभी शब्दों पर टैप कीजिए।";
  const makePick = (id, prompt, target, options) => ({
    id, phase:"guided", eis:"iconic", type:"RHYME_PICK", prompt_hi:prompt,
    audio:{target_word:target.audio || null, try_again:"vo_r_try", hint:"vo_r_hint", reveal:"vo_r_reveal"},
    data:{target, options, textOnly:true}, signals:{on_complete:["rhyme_pick_first_try"]}
  });

  // Guided slides 14–18: make each correct answer and displayed prompt match the PPT.
  const g2=byId("G2");
  g2.prompt_hi="कढ़ाई का तुकांत शब्द पहचानिए।";
  g2.data.target={word_hi:"कढ़ाई",emoji:"🍳",img:"opt_kadai",audio:"vo_o_opt_kadai"};
  g2.data.options=[
    {word_hi:"नचाई",correct:true,audio:"vo_pw_16"},
    {word_hi:"चूल्हा",audio:"vo_o_opt_chulha"},
    {word_hi:"जलेबी",audio:"vo_o_opt_jalebi"}
  ];
  g2.data.textOnly=true;
  g2.audio.prompt=null;

  const g3=byId("G3"), g4=byId("G4"), g5=byId("G5");
  Object.assign(g3,{type:"RHYME_YESNO",prompt_hi:"मिठाई-चूल्हा, क्या यह तुकांत शब्द हैं?",audio:{yes:"vo_ans_yes",no:"vo_ans_no",try_again:"vo_r_try",hint:"vo_r_hint",reveal:"vo_r_reveal"},data:{
    a:{word_hi:"मिठाई",emoji:"🍬",img:"opt_mithai",audio:"vo_o_opt_mithai"},
    b:{word_hi:"चूल्हा",emoji:"🔥",img:"opt_chulha",audio:"vo_o_opt_chulha"},rhymes:false
  }});
  Object.assign(g4,makePick("G4","हलवाई का तुकांत शब्द पहचानिए।",
    {word_hi:"हलवाई",emoji:"👨‍🍳",audio:"vo_o_opt_halwai"},[
      {word_hi:"रजाई",correct:true,audio:"vo_o_opt_rajai"},
      {word_hi:"पैसे",audio:"vo_o_opt_paise"},
      {word_hi:"जलेबी",audio:"vo_o_opt_jalebi"}
    ]));
  Object.assign(g5,makePick("G5","तुकांत शब्द चुनकर वाक्य पूरा कीजिए — जंगल में नाच रहा था मोर, तभी वहाँ आया एक ____।",
    {word_hi:"मोर",emoji:"🦚"},[
      {word_hi:"चोर",correct:true},{word_hi:"शेर"},{word_hi:"हाथी"}
    ]));
  const g6=makePick("G6","तुकांत शब्द चुनकर वाक्य पूरा कीजिए — बंदर खा रहा था केला, पास ही लगा था एक ____।",
    {word_hi:"केला",emoji:"🍌"},[
      {word_hi:"मेला",correct:true},{word_hi:"पेड़"},{word_hi:"फूल"}
    ]);
  const practiceQuestions=[
    {prompt_hi:"राजा का तुकांत शब्द पहचानिए।",target:{word_hi:"राजा",emoji:"👑"},options:[{word_hi:"रानी"},{word_hi:"बाजा",correct:true},{word_hi:"मुकुट"}]},
    {prompt_hi:"रात के साथ कौन-सा शब्द तुकांत है?",target:{word_hi:"रात",emoji:"🌙"},options:[{word_hi:"दिन"},{word_hi:"बात",correct:true},{word_hi:"तारा"}]},
    {prompt_hi:"फूल के साथ कौन-सा शब्द तुकांत है?",target:{word_hi:"फूल",emoji:"🌼"},options:[{word_hi:"धूल",correct:true},{word_hi:"पत्ता"},{word_hi:"पेड़"}]},
    {prompt_hi:"पानी के साथ कौन-सा शब्द तुकांत है?",target:{word_hi:"पानी",emoji:"💧"},options:[{word_hi:"दूध"},{word_hi:"रानी",correct:true},{word_hi:"गिलास"}]},
    {prompt_hi:"गाना के साथ कौन-सा शब्द तुकांत है?",target:{word_hi:"गाना",emoji:"🎵"},options:[{word_hi:"दाना",correct:true},{word_hi:"गीत"},{word_hi:"ढोल"}]},
    {prompt_hi:"हाथ के साथ कौन-सा शब्द तुकांत है?",target:{word_hi:"हाथ",emoji:"✋"},options:[{word_hi:"पैर"},{word_hi:"नाक"},{word_hi:"साथ",correct:true}]}
  ];
  const practice={id:"P1",phase:"practice",eis:"enactive",type:"RHYME_BOXES",
    prompt_hi:"डिब्बे को खोलने के लिए उसपर टैप कीजिए।",audio:{},data:{questions:practiceQuestions}};
  // The PPT ends the six-box activity with the celebration; remove the older, different practice set.
  const firstPractice=card.slides.findIndex(slide=>slide.id==="P1");
  const celebration=byId("CEL");
  card.slides.splice(firstPractice,card.slides.length-firstPractice,practice,celebration);
  const guidedIndex=card.slides.findIndex(slide=>slide.id==="G5");
  card.slides.splice(guidedIndex+1,0,g6);
  // Checklist: guided questions go from lower to higher rigour with same types grouped —
  // yes/no judgement, then word picks, then sentence picks, then finding all rhymes in the poem.
  const guidedOrder=["G3","G2","G4","G5","G6","G1"];
  const guidedSlides=guidedOrder.map(byId);
  const firstGuided=Math.min(...guidedSlides.map(s=>card.slides.indexOf(s)));
  card.slides=card.slides.filter(s=>!guidedOrder.includes(s.id));
  card.slides.splice(firstGuided,0,...guidedSlides);
  card.phase_distribution={tutorial:10,guided:7,practice:3};
  if(celebration){
    celebration.prompt_hi="शाबाश! आपने कर दिखाया।";
    celebration.audio.prompt="vo_celebrate";
  }
  // Exact header copy, prompt VO and three hints from the PPT's recommendation column.
  const pptAudio=window.JALEBI_PPT_AUDIO || {};
  Object.entries(pptAudio).forEach(([id,text])=>{
    card.assets.audio[id]="assets/Audio/"+id+".ogg";card.assets.audio_text[id]=text;
  });
  card.assets.audio.vo_landing=card.assets.audio.vo_ppt_landing;
  // PT2: the VO says the whole line, but only "चलिए, साथ में करें!" is shown — when that phrase starts (~3.45s).
  Object.assign(byId("PT2").data,{caption_hi:"चलिए, साथ में करें!",caption_at:3.45});
  // First poem page (halwai): the supplied video plays in place of the still picture, same box.
  // The halwai sets the kadhai once (0–4.2s); after that the clip holds him still and only the fire moves,
  // so it loops from 4.2s.
  Object.assign(byId("T1").data.passage,{video:"assets/Video/halwai_scene.mp4",video_poster:"assets/Video/halwai_scene_poster.jpg",video_loop_from:4.2});
  // Second poem page (jalebi in the kadhai): supplied video in place of the still picture, same box.
  // Plays once and stops on its last frame (jalebis done, hands out of shot).
  Object.assign(byId("T2").data.passage,{video:"assets/Video/jalebi_scene.mp4",video_poster:"assets/Video/jalebi_scene_poster.jpg",video_once:true});
  const pt1=byId("PT1");
  pt1.prompt_hi=pt1.data.headline_hi="ध्यान से देखिए और मेरे साथ पढ़िए। चलिए, शुरू करें।";
  pt1.audio.prompt="vo_ppt_tutorial";
  const t7=byId("T7");t7.audio.prompt="vo_ppt_t7_words";t7.audio.explain=null;t7.audio.conclude="vo_ppt_t7_conclude";
  byId("T8").audio.prompt="vo_ppt_t8";byId("T8").data.a.word_hi="कढ़ाई";
  byId("T9").audio.prompt="vo_ppt_t9";
  const g1=byId("G1");delete g1.data.image_id;delete g1.data.portrait;
  g1.audio.prompt="vo_ppt_g1_prompt";g1.audio.hint="vo_ppt_g1_hint2";g1.audio.correct="vo_ppt_g1_correct";
  ["G2","G3","G4","G5","G6"].forEach(id=>{
    const s=byId(id),prefix="vo_ppt_"+id.toLowerCase();
    Object.assign(s.audio,{prompt:prefix+"_prompt",try_again:prefix+"_hint1",hint:prefix+"_hint2",reveal:prefix+"_hint3"});
    s.data.pptFeedback=true;
  });
  ["G5","G6"].forEach(id=>byId(id).prompt_hi="तुकांत शब्द चुनकर वाक्य पूरा कीजिए।");
  byId("G5").data.sentence_hi="जंगल में नाच रहा था मोर,\nतभी वहाँ आया एक ____।";
  byId("G6").data.sentence_hi="बंदर खा रहा था केला,\nपास ही लगा था एक ____।";
  const wordAudio=word=>{
    const index=window.JALEBI_PPT_WORDS.indexOf(word);
    return index<0?null:"vo_ppt_word_"+index;
  };
  ["G5","G6"].forEach(id=>{
    const s=byId(id);s.data.target.audio=wordAudio(s.data.target.word_hi);
    s.data.options.forEach(o=>o.audio=wordAudio(o.word_hi));
    s.data.options.forEach((o,i)=>o.emoji=(id==="G5"?["🕵️","🦁","🐘"]:["🎡","🌳","🌼"])[i]);
    s.data.textOnly=false;
  });
  practice.audio.prompt="vo_ppt_boxes_intro";
  practiceQuestions.forEach((q,i)=>{
    q.audio={prompt:"vo_ppt_box"+(i+1),hint:"vo_ppt_box"+(i+1)+"_hint2"};
    q.target.audio=wordAudio(q.target.word_hi);
    q.options.forEach(o=>o.audio=wordAudio(o.word_hi));
  });
  celebration.audio.prompt="vo_ppt_celebrate";
  // Keep the displayed spelling consistent with the review's कढ़ाई throughout the poem.
  const fixSpelling=obj=>{
    Object.keys(obj).forEach(k=>{if(typeof obj[k]==="string")obj[k]=obj[k].replace(/कड़ाई/g,"कढ़ाई");else if(obj[k]&&typeof obj[k]==="object")fixSpelling(obj[k]);});
  };
  card.slides.forEach(fixSpelling);
  // User-supplied replacements for the question and option illustrations.
  const replacementImages={
    "चोर":["opt_chor","opt_chor-replacement.png"],
    "हलवाई":["opt_halwai","opt_halwai-replacement-v2.png"],
    "शेर":["opt_sher","opt_sher-replacement.png"],
    "हाथी":["opt_hathi","opt_hathi-replacement.webp"],
    "राजा":["opt_raja","opt_raja-replacement.webp"],
    "रात":["opt_raat","opt_raat-replacement.webp"],
    "गाना":["opt_gaana","opt_gaana-replacement.webp"],
    "पानी":["opt_paani_new","opt_paani-replacement.webp"],
    "हाथ":["opt_haath","opt_haath-replacement.webp"],
    "मेला":["opt_mela","opt_mela-replacement.webp"],
    "पेड़":["opt_ped","opt_ped-replacement.webp"],
    "फूल":["opt_phool","opt_phool-replacement.webp"]
  };
  Object.values(replacementImages).forEach(([key,file])=>card.assets.image[key]="assets/Images/"+file);
  const assignReplacement=obj=>{
    if(obj.word_hi&&replacementImages[obj.word_hi])obj.img=replacementImages[obj.word_hi][0];
    Object.values(obj).forEach(value=>{if(value&&typeof value==="object")assignReplacement(value);});
  };
  card.slides.forEach(assignReplacement);
  // Show the complete poem as two consecutive four-line pages.
  const reviewIndex=card.slides.findIndex(s=>s.id==="T7");
  const allLines=t7.data.lines;
  const firstLines=allLines.slice(0,4),lastLines=allLines.slice(4);
  const firstCount=firstLines.flatMap(l=>l.words).filter(w=>w.rhyme).length;
  const totalCount=allLines.flatMap(l=>l.words).filter(w=>w.rhyme).length;
  const secondPage=JSON.parse(JSON.stringify(t7));
  secondPage.id="T7B";
  secondPage.data={...secondPage.data,lines:lastLines,pptPoemPage:2,rhymeOffset:firstCount,rhymeTotal:totalCount};
  secondPage.audio.explain=null;
  secondPage.audio.prompt=null;
  t7.data={...t7.data,lines:firstLines,pptPoemPage:1,rhymeOffset:0,rhymeTotal:totalCount};
  t7.audio.conclude=null;
  card.slides.splice(reviewIndex+1,0,secondPage);
  card.phase_distribution.tutorial++;
  // Earn the trophy after opening all six gifts, before the existing final VO screen.
  card.assets.image.trophy_reward="assets/UI/trophy-reward.png";
  const reward={id:"REWARD",phase:"practice",eis:"iconic",type:"TROPHY_REWARD",
    prompt_hi:"शाबाश! सभी डिब्बे खुल गए।",audio:{},data:{image:"trophy_reward"}};
  card.slides.splice(card.slides.findIndex(s=>s.id==="CEL"),0,reward);
  card.phase_distribution=card.slides.reduce((counts,s)=>{counts[s.phase]=(counts[s.phase]||0)+1;return counts;},{});
};
