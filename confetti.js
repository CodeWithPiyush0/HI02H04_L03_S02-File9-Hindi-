/* Emitter for the supplied FLN CSS kit. Shared by every answer and the finale. */
(()=>{
  const colors=["#FCB717","#386AF6","#E55B49","#21A74A","#7048D6","#FF7AC6","#2BC4D8"];
  const shapes=["sq","rc","ln","st"];
  const random=(min,max)=>min+Math.random()*(max-min);
  let layer=null,currentRun=null;

  function sizeLayer(){
    if(!layer)return;
    const scale=Math.min(window.innerWidth/1333,window.innerHeight/750);
    layer.style.setProperty("--scale",scale);
    layer.style.setProperty("--dist",(window.innerHeight+80)+"px");
  }
  function ensureLayer(){
    if(layer&&layer.isConnected)return layer;
    layer=document.createElement("div");layer.className="fx-layer";
    layer.setAttribute("aria-hidden","true");document.body.appendChild(layer);
    sizeLayer();return layer;
  }
  function darken(hex){
    return "#"+hex.slice(1).match(/../g).map(part=>Math.round(parseInt(part,16)*0.62).toString(16).padStart(2,"0")).join("");
  }
  function emit(run){
    const target=ensureLayer(),burst=document.createElement("div");
    burst.className="fx-confetti";
    const fragment=document.createDocumentFragment();
    const scale=Math.min(window.innerWidth/1333,window.innerHeight/750);
    const count=128;
    let lifetime=0;
    for(let i=0;i<count;i++){
      const piece=document.createElement("span"),glide=document.createElement("span"),face=document.createElement("span");
      piece.className="p";glide.className="w";
      face.className="f "+shapes[i%shapes.length]+(Math.random()<0.22?" tum":"");
      const color=colors[i%colors.length],fall=random(3.8,5.2),delay=random(0,0.75);
      const properties={
        "--x":((i+Math.random())/count*100)+"%",
        "--fall":fall+"s","--delay":delay+"s","--rockT":random(0.8,1.6)+"s",
        "--z":random(0.75,1.3),"--dim":random(0.8,1),
        "--sway":(random(12,30)*scale)+"px","--bob":(random(5,13)*scale)+"px",
        "--drift":(random(-65,65)*scale)+"px",
        "--tilt":random(-80,80)+"deg","--yaw":random(-24,24)+"deg","--amp":random(55,78)+"deg",
        "--c":color,"--c2":darken(color)
      };
      Object.entries(properties).forEach(([key,value])=>piece.style.setProperty(key,value));
      glide.appendChild(face);piece.appendChild(glide);fragment.appendChild(piece);
      lifetime=Math.max(lifetime,(fall+delay)*1000);
    }
    burst.appendChild(fragment);target.appendChild(burst);run.bursts.add(burst);
    const timer=setTimeout(()=>{
      run.timers.delete(timer);run.bursts.delete(burst);burst.remove();
      if(!run.continuous&&currentRun===run){currentRun=null;}
      if(layer&&!layer.childElementCount){layer.remove();layer=null;}
    },Math.ceil(lifetime)+100);
    run.timers.add(timer);
  }

  window.confettiCannon=function(options={}){
    if(currentRun)currentRun.stop();
    if(options.sound!==false&&typeof window.playSfx==="function")window.playSfx("sfx_correct_confetti_new");
    const run={continuous:options.continuous===true,bursts:new Set(),timers:new Set(),interval:null};
    run.stop=()=>{
      if(run.interval!==null)clearInterval(run.interval);
      run.timers.forEach(clearTimeout);run.timers.clear();
      run.bursts.forEach(burst=>burst.remove());run.bursts.clear();
      if(currentRun===run)currentRun=null;
      if(layer&&!layer.childElementCount){layer.remove();layer=null;}
    };
    currentRun=run;emit(run);
    // Repeat only when explicitly requested; game celebrations use one burst.
    if(run.continuous)run.interval=setInterval(()=>emit(run),2800);
    return run.stop;
  };
  window.clearConfetti=()=>{if(currentRun)currentRun.stop();};
  window.addEventListener("resize",sizeLayer);
  window.addEventListener("pagehide",window.clearConfetti);
})();
