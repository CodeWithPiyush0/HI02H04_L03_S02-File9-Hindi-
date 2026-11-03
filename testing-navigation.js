/* Dev-only review controls. Reloading each jump clears old audio and activity timers. */
(()=>{
  const params=new URLSearchParams(location.search);
  if(params.get('dev')!=='1'&&params.get('nav')!=='1')return;
  const bar=document.createElement('nav');
  bar.className='testing-navigation';
  bar.setAttribute('aria-label','Game testing navigation');
  bar.innerHTML='<span>Dev</span><button type="button" data-target="-1" title="Title screen">⌂</button><button type="button" data-target="0" title="First screen">⏮</button><button type="button" data-step="-1">← Previous</button><select aria-label="Jump to screen"></select><output aria-live="polite"></output><button type="button" data-step="1">Next →</button><button type="button" data-target="'+(CARD.slides.length-1)+'" title="Last screen">⏭</button>';
  document.body.appendChild(bar);
  const previous=bar.querySelector('[data-step="-1"]');
  const next=bar.querySelector('[data-step="1"]');
  const select=bar.querySelector('select');
  const titleOption=document.createElement('option');
  titleOption.value='-1';titleOption.textContent='Title screen';select.appendChild(titleOption);
  CARD.slides.forEach((slide,i)=>{
    const option=document.createElement('option');
    option.value=String(i);option.textContent=`${i+1}. ${slide.id} · ${slide.type}`;
    select.appendChild(option);
  });
  const position=()=>document.body.classList.contains('is-start')?-1:state.idx;
  const refresh=()=>{
    const i=position();
    previous.disabled=i<0;
    next.disabled=i>=CARD.slides.length-1;
    if(document.activeElement!==select)select.value=String(i);
    bar.querySelector('output').textContent=i<0?'Title':`${i+1}/${CARD.slides.length} · ${CARD.slides[i].id}`;
  };
  const go=target=>{
    const i=Math.max(-1,Math.min(CARD.slides.length-1,target));
    const url=new URL(location.href);
    url.searchParams.set('testScreen',String(i));
    location.assign(url.href);
  };
  bar.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||button.disabled)return;
    go(button.dataset.target!==undefined?Number(button.dataset.target):position()+Number(button.dataset.step));
  });
  select.addEventListener('change',()=>go(Number(select.value)));
  const originalMount=mountSlide;
  mountSlide=function(i){originalMount(i);refresh();};
  const requested=params.get('testScreen');
  if(requested!==null&&/^\d+$/.test(requested)&&Number(requested)<CARD.slides.length){
    document.getElementById('startGate').classList.add('hidden');
    document.body.classList.remove('is-start');
    const i=Number(requested);
    if(i>0 && CARD.slides[i].type==='PHASE_TRANSITION') mountSlide(i-1);
    mountSlide(i);
  }
  refresh();
  setInterval(refresh,300);
})();
