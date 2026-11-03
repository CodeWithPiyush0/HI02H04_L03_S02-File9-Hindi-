/* PPT-specific interactions for Jalebi. Shared chrome, buttons and SFX remain in app.js. */
(()=>{
  const src=id=>id?`assets/Audio/${id}.${AUDIO_EXT}`:null;
  function session(host){
    let alive=true;const timers=[];
    const previousCleanup=state.activityCleanup;
    state.activityCleanup=()=>{alive=false;timers.forEach(clearTimeout);if(previousCleanup)previousCleanup();};
    return {
      valid:()=>alive&&host.isConnected,
      later(fn,ms){timers.push(setTimeout(()=>{if(alive&&host.isConnected)fn();},ms));},
      voice(id,done=()=>{}){if(!alive)return;if(!id){done();return;}play(src(id),()=>{if(alive&&host.isConnected)done();});}
    };
  }
  function wiggle(el,s){el.classList.remove('ppt-wiggle');void el.offsetWidth;el.classList.add('ppt-wiggle');s.later(()=>el.classList.remove('ppt-wiggle'),500);}
  function controls(){state.ownsAudio=true;state.locked=false;state.attempts=0;state.scaffoldLevel=0;$('navBtn').style.display='none';$('hintBtn').style.display='none';setNavActive(false);}
  function pick(host,slide,{box=false,onSolved=null,introDelay=0}={}){
    const d=slide.data,s=session(host);controls();
    const root=document.createElement('div');root.className='ppt-choice-stage';
    const stimulus=document.createElement('div');stimulus.className='ppt-choice-stimulus';
    if(d.sentence_hi){stimulus.classList.add('ppt-sentence');stimulus.textContent=d.sentence_hi;}
    else if(slide.type==='RHYME_YESNO'){
      stimulus.classList.add('ppt-choice-pair');
      [d.a,d.b].forEach(w=>{const item=document.createElement('div');item.className='ppt-stimulus-word';item.innerHTML=imgOrEmoji(w.img,w.emoji,'ppt-word-picture','ppt-word-emoji')+`<span>${w.word_hi}</span>`;item.onclick=()=>{if(!busy){setSwMood('talk');s.voice(w.audio);}};stimulus.appendChild(item);});
    }else{
      const w=d.target;
      stimulus.innerHTML=imgOrEmoji(w.img,w.emoji,'ppt-word-picture','ppt-word-emoji')+`<span>${w.word_hi}</span>`;
      stimulus.onclick=()=>{if(!busy){setSwMood('talk');s.voice(w.audio);}};
    }
    root.appendChild(stimulus);
    const options=slide.type==='RHYME_YESNO'?[{word_hi:'हाँ',audio:slide.audio.yes,correct:d.rhymes===true},{word_hi:'नहीं',audio:slide.audio.no,correct:d.rhymes===false}]:d.options;
    const grid=document.createElement('div');grid.className='ppt-choice-grid';
    const buttons=[];let busy=false,solved=false;
    const disable=on=>{busy=on;buttons.forEach(b=>b.disabled=on||solved);};
    const ready=()=>disable(false);   // no hand on question screens: it pointed at the word, not an action
    const intro=()=>{if(busy||solved)return;setSwMood('talk');disable(true);s.voice(slide.audio.prompt,ready);};
    options.forEach(o=>{
      const b=document.createElement('button');b.type='button';b.className='rhyme-text-choice ppt-choice';
      if(!d.textOnly&&(o.img||o.emoji)){
        const icon=document.createElement('span');icon.className='ppt-option-picture';
        if(o.img)icon.innerHTML=imgOrEmoji(o.img,o.emoji,'ppt-option-image','ppt-option-emoji');else icon.textContent=o.emoji;
        b.appendChild(icon);
      }
      const label=document.createElement('span');label.textContent=o.word_hi;b.appendChild(label);
      b.onclick=()=>{
        if(busy||solved)return;disable(true);stopNudge();
        if(o.correct){
          solved=true;state.locked=true;b.classList.add('ppt-correct');sfxCorrect();
          if(!box)confettiCannon();setSwMood('happy');
          if(box){state.masteryAttempts++;if(state.attempts===0)state.masteryHits++;}
          SwiftPAL.emit(slide.type==='RHYME_YESNO'?'rhyme_judge_first_try':'rhyme_pick_first_try',{slide_id:slide.id,phase:slide.phase,first_try:state.attempts===0,attempts:state.attempts+1,value:true});
          s.voice(o.audio,()=>s.later(()=>onSolved?onSolved():completeSlide(true),600));
        }else{
          state.attempts++;state.scaffoldLevel=Math.min(3,state.attempts);wiggle(b,s);sfxWrongSoft();setSwMood('tryagain');
          SwiftPAL.emit('answer_wrong',{slide_id:slide.id,phase:slide.phase,attempts:state.attempts});
          s.voice(o.audio,()=>{
            const layer=Math.min(3,state.attempts);
            if(layer===3){const correct=buttons.find((_,i)=>options[i].correct);correct.classList.add('ppt-answer-glow');}
            const hint=box?(layer===1?slide.audio.prompt:layer===2?slide.audio.hint:null):(layer===1?slide.audio.try_again:layer===2?slide.audio.hint:slide.audio.reveal);
            s.voice(hint,ready);
          });
        }
      };
      b.classList.add('ppt-enter');
      buttons.push(b);grid.appendChild(b);
    });
    root.appendChild(grid);
    host.appendChild(root);state.replayAudio=intro;
    // Options enter one by one, each with a pop SFX, before the prompt VO starts.
    disable(true);
    const reveal=()=>{buttons.forEach((b,i)=>s.later(()=>{b.classList.add('ppt-enter-in');playSfx('sfx_star_pop_new');},i*380));s.later(()=>{busy=false;intro();},buttons.length*380+200);};
    if(introDelay)s.later(reveal,introDelay);else reveal();
  }
  ['RHYME_PICK','RHYME_YESNO'].forEach(type=>{
    const previous=SlideModules[type].mount;
    SlideModules[type].mount=(host,slide)=>slide.data.pptFeedback?pick(host,slide):previous(host,slide);
  });
  const previousFind=SlideModules.FIND_RHYME.mount;
  function reviewPoemPage(host,slide){
    const d=slide.data,s=session(host),first=d.pptPoemPage===1;
    const root=document.createElement('div');root.className='fr-stage ppt-review-page';
    const right=document.createElement('div');right.className='fr-right';
    const counter=document.createElement('div');counter.className='fr-count';
    const poem=document.createElement('div');poem.className='fr-poem ppt-review-poem';
    const rows=[],targets=[];let found=0,running=false,finished=false;
    d.lines.forEach(line=>{
      const row=document.createElement('div');row.className='fr-line';
      line.words.forEach(w=>{const chip=document.createElement('span');chip.className='fr-word';chip.textContent=w.text;row.appendChild(chip);if(w.rhyme)targets.push({chip,word:w});});
      rows.push(row);poem.appendChild(row);
    });
    right.appendChild(counter);right.appendChild(poem);root.appendChild(right);host.appendChild(root);
    const count=()=>counter.textContent=`🎵 ${(d.rhymeOffset||0)+found} / ${d.rhymeTotal}`;count();
    state.ownsAudio=true;state.locked=false;$('hintBtn').style.display='none';
    const nav=$('navBtn');nav.style.display=first?'none':'';setNavActive(false);
    nav.onclick=()=>{if(finished&&!nav.disabled)completeSlide(true);};
    const done=()=>{
      running=false;finished=true;setSwMood('point');
      if(first)s.later(()=>completeSlide(true),450);else setNavActive(true);
    };
    const showWords=i=>{
      if(i>=targets.length){s.voice(slide.audio.conclude,done);return;}
      const target=targets[i];target.chip.classList.add('found','pop');found++;count();
      s.voice(target.word.audio,()=>s.later(()=>showWords(i+1),250));
    };
    // Read-along: the whole poem is visible from the start; as each line's VO plays, its words jump
    // one by one in step with the voice (karaoke glow on the word being read).
    const allChips=()=>rows.flatMap(row=>[...row.querySelectorAll('.fr-word')]);
    const hideWords=()=>allChips().forEach(c=>c.classList.remove('pw-in','pw-speak'));
    const bounceLine=i=>{
      const chips=[...rows[i].querySelectorAll('.fr-word')];
      const a=currentAudio,dur=a&&isFinite(a.duration)&&a.duration>0?a.duration*1000-(a.currentTime||0)*1000:2200;
      const step=Math.max(200,Math.min(560,(dur*0.88)/Math.max(1,chips.length)));
      chips.forEach((c,k)=>s.later(()=>{
        c.classList.remove('pw-in');void c.offsetWidth;c.classList.add('pw-in','pw-speak');
        s.later(()=>c.classList.remove('pw-speak'),Math.max(180,step-40));
        s.later(()=>c.classList.remove('pw-in'),700);
      },k*step));
    };
    const read=i=>{
      rows.forEach(row=>row.classList.remove('now'));
      if(i>=rows.length){allChips().forEach(c=>c.classList.remove('pw-speak'));setSwMood('teach');s.voice(slide.audio.explain,()=>showWords(0));return;}
      rows[i].classList.add('now');s.voice(d.lines[i].audio,()=>s.later(()=>read(i+1),200));
      s.later(()=>bounceLine(i),80);   // let the clip report its duration first
    };
    const replay=()=>{
      if(running)return;running=true;finished=false;found=0;count();setNavActive(false);
      targets.forEach(t=>t.chip.classList.remove('found','pop'));setSwMood('talk');
      rows.forEach(row=>row.classList.remove('now'));hideWords();
      s.voice(slide.audio.prompt,()=>read(0));
    };
    state.replayAudio=replay;replay();
  }
  SlideModules.FIND_RHYME.mount=(host,slide)=>{
    if(slide.data.pptPoemPage){reviewPoemPage(host,slide);return;}
    if(slide.id!=='G1'){previousFind(host,slide);return;}
    const s=session(host);controls();
    const root=document.createElement('div');root.className='ppt-find-stage';
    const count=document.createElement('div');count.className='fr-count';root.appendChild(count);
    const poem=document.createElement('div');poem.className='fr-poem ppt-find-poem';
    const chips=[];let found=0,busy=false,streak=0;
    slide.data.lines.forEach(line=>{
      const row=document.createElement('div');row.className='fr-line';
      line.words.forEach(w=>{const b=document.createElement('button');b.type='button';b.className='fr-word';b.textContent=w.text;b._word=w;b._found=false;chips.push(b);row.appendChild(b);});
      poem.appendChild(row);
    });
    root.appendChild(poem);host.appendChild(root);
    const total=chips.filter(c=>c._word.rhyme).length;
    const update=()=>count.textContent=`🎵 ${found} / ${total}`;update();
    const disable=on=>{busy=on;chips.forEach(c=>c.disabled=on);};
    const ready=()=>disable(false);   // no hand here either: it pointed at the middle of the poem
    const intro=()=>{if(busy||state.locked)return;setSwMood('talk');disable(true);s.voice(slide.audio.prompt,ready);};
    chips.forEach(c=>c.onclick=()=>{
      if(busy||state.locked)return;disable(true);
      if(c._word.rhyme){
        if(!c._found){c._found=true;c.classList.add('found');found++;streak=0;update();sfxCorrect();}
        s.voice(c._word.audio,()=>{
          if(found===total){state.locked=true;confettiCannon();setSwMood('happy');SwiftPAL.emit('rhyme_find_done',{slide_id:slide.id,phase:slide.phase,first_try:state.attempts===0,wrong_taps:state.attempts,value:true});s.voice(slide.audio.correct,()=>s.later(()=>completeSlide(true),600));}
          else disable(false);
        });
      }else{
        state.attempts++;streak++;state.scaffoldLevel=Math.min(3,streak);wiggle(c,s);sfxWrongSoft();
        SwiftPAL.emit('answer_wrong',{slide_id:slide.id,phase:slide.phase,attempts:state.attempts});
        s.voice(c._word.audio,()=>{
          if(streak>=3){const target=chips.find(b=>b._word.rhyme&&!b._found);if(target)target.classList.add('ppt-answer-glow');}
          // Layer 1 repeats the task; layer 2 explains why and models the आई ending with a found
          // (or, if none yet, a target) word; layer 3 additionally glows the next rhyme word.
          if(streak===1){s.voice(slide.audio.prompt,ready);return;}
          const model=chips.find(b=>b._word.rhyme&&b._found)||chips.find(b=>b._word.rhyme);
          s.voice(slide.audio.hint,()=>{if(streak===2&&model){model.classList.add('ppt-answer-glow');s.voice(model._word.audio,()=>{model.classList.remove('ppt-answer-glow');ready();});}else ready();});
        });
      }
    });
    state.replayAudio=intro;intro();
  };
  SlideModules.RHYME_BOXES.mount=(host,slide)=>{
    controls();const s=session(host),questions=slide.data.questions,solved=new Set();
    host.classList.add('gift-box-activity');
    const cleanup=state.activityCleanup;
    state.activityCleanup=()=>{host.classList.remove('gift-box-activity');cleanup();};
    const board=document.createElement('div');board.className='rhyme-box-board gift-box-board';
    const status=document.createElement('div');status.className='rhyme-box-status';
    const answer=document.createElement('div');answer.className='rhyme-box-answer';
    const fade=document.createElement('div');fade.className='gift-box-fade';fade.setAttribute('aria-hidden','true');
    host.appendChild(status);host.appendChild(board);host.appendChild(answer);host.appendChild(fade);
    let busy=false;
    const gift=(i)=>{
      const opened=solved.has(i),button=document.createElement('button');
      button.type='button';button.className='rhyme-box gift-box'+(opened?' solved':'');
      button.disabled=opened;button.setAttribute('aria-label',`डिब्बा ${i+1}${opened?', खुला हुआ, उत्तर पूरा है':''}`);
      button.innerHTML='<span class="gift-visual"><img class="gift-closed" src="assets/UI/gift-box-closed.png" alt=""><img class="gift-open" src="assets/UI/gift-box-open.png" alt=""><img class="gift-ribbon gift-ribbon-left" src="assets/UI/gift-box-closed.png" alt=""><img class="gift-ribbon gift-ribbon-right" src="assets/UI/gift-box-closed.png" alt=""></span>'+`<span class="gift-label">डिब्बा ${i+1}${opened?' · ✓':''}</span>`;
      button.onclick=()=>{if(!busy&&!solved.has(i))openGift(i,button);};return button;
    };
    function draw(final=false){
      if(!s.valid())return;
      board.hidden=false;board.classList.remove('is-asking');board.innerHTML='';answer.hidden=true;answer.innerHTML='';
      status.textContent=`डिब्बे खोलिए · ${solved.size}/${questions.length}`;
      $('promptText').textContent=solved.size?'किसी भी एक डिब्बे पर टैप कीजिए।':slide.prompt_hi;
      const buttons=[];
      questions.forEach((q,i)=>{const button=gift(i);buttons.push(button);board.appendChild(button);});
      // A new instruction is not answer feedback: never carry the previous happy pose into its VO.
      const ready=()=>{busy=false;buttons.forEach((b,i)=>b.disabled=solved.has(i));startNudge(slide,()=>buttons.find(b=>!b.disabled));};
      const intro=()=>{if(busy||final)return;setSwMood('talk');busy=true;buttons.forEach(b=>b.disabled=true);s.voice(slide.audio.prompt,ready);};
      // After the first box, "किसी भी एक डिब्बे पर टैप कीजिए।" is header text only — no VO, since the
      // task was already introduced at the start of the activity.
      busy=false;
      if(final){state.replayAudio=()=>{};return;}
      if(solved.size){setSwMood('point');state.replayAudio=()=>{};ready();}
      else{state.replayAudio=intro;intro();}
    }
    function openGift(i,button){
      if(busy||solved.has(i))return;
      busy=true;board.querySelectorAll('button').forEach(b=>b.disabled=true);state.replayAudio=()=>{};
      playSfx('sfx_gift_open');button.classList.add('is-opening');
      s.later(()=>fade.classList.add('show'),750);
      s.later(()=>{
        ask(i);
        requestAnimationFrame(()=>{if(s.valid())fade.classList.remove('show');});
      },1150);
    }
    function ask(i){
      const q=questions[i];board.hidden=true;answer.hidden=false;answer.innerHTML='';
      $('promptText').textContent=q.prompt_hi;
      const qSlide={...slide,type:'RHYME_PICK',id:slide.id+'_box'+(i+1),audio:q.audio,data:{...q,textOnly:true}};
      pick(answer,qSlide,{box:true,introDelay:450,onSolved:()=>{
        solved.add(i);if(solved.size===questions.length){draw(true);$('promptText').textContent='शाबाश! सभी डिब्बे खुल गए।';confettiCannon();s.later(()=>completeSlide(true),1600);}
        else draw();
      }});
    }
    draw();
  };
  SlideModules.TROPHY_REWARD={mount(host,slide){
    controls();const s=session(host),sounds=new Set();
    state.locked=true;state.replayAudio=()=>{};clearConfetti();
    const cleanup=state.activityCleanup;
    state.activityCleanup=()=>{sounds.forEach(sound=>{sound.pause();sound.onended=null;});sounds.clear();cleanup();};
    const root=document.createElement('div');root.className='trophy-reward-stage';
    const art=document.createElement('div');art.className='trophy-reward-art';
    art.setAttribute('role','img');art.setAttribute('aria-label','सुनहरी ट्रॉफी');
    const imageSrc=CARD.assets.image[slide.data.image];
    const images=[];
    const image=className=>{const img=document.createElement('img');img.className=className;img.src=imageSrc;img.alt='';img.draggable=false;images.push(img);art.appendChild(img);return img;};
    image('trophy-reward-base');
    const stars=['left','middle','right'].map(position=>image('trophy-reward-star trophy-star-'+position));
    root.appendChild(art);host.appendChild(root);
    let started=false;
    const start=()=>{
      if(started||!s.valid())return;started=true;art.classList.add('is-entered');
      // Victory fanfare as the trophy enters (~3.4s, ends before the slide exits at 3.9s).
      const fanfare=playSfx('sfx_trophy_fanfare');
      if(fanfare&&typeof fanfare.pause==='function'){sounds.add(fanfare);fanfare.onended=()=>sounds.delete(fanfare);}
      stars.forEach((star,i)=>s.later(()=>{
        star.classList.add('is-revealed');art.dataset.stars=String(i+1);
        art.setAttribute('aria-label',`सुनहरी ट्रॉफी और ${i+1} सितारे`);
        const sound=playSfx('sfx_star_pop_new');
        if(sound&&typeof sound.pause==='function'){sounds.add(sound);sound.onended=()=>sounds.delete(sound);}
      },650+i*650));
      // Let the third bounce settle, hold the reward, then smoothly enter the final screen.
      s.later(()=>root.classList.add('is-exiting'),3500);
      s.later(()=>completeSlide(true),3900);
    };
    // decode() can stall while the page isn't painting; never leave the child stuck on the trophy.
    Promise.race([Promise.all(images.map(img=>img.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,1500))]).then(start);
  }};
})();
