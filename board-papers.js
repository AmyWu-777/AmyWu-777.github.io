/* Dedicated loose-paper reader. Art, Digital Art and console cases keep their readers. */
(()=>{
 const modal=document.createElement('dialog');modal.className='board-papers';modal.setAttribute('aria-label','Board game collection');
 modal.innerHTML='<header class="bp-toolbar"><span class="bp-name"></span><button class="bp-close" aria-label="Close board game">Close ×</button></header><div class="bp-stage"><div class="bp-stack"></div></div><footer class="bp-nav"><button class="bp-prev">← Previous</button><span class="bp-count" aria-live="polite"></span><button class="bp-next">Next →</button></footer>';
 document.body.append(modal);
 const stage=modal.querySelector('.bp-stage'),stack=modal.querySelector('.bp-stack'),prev=modal.querySelector('.bp-prev'),next=modal.querySelector('.bp-next'),close=modal.querySelector('.bp-close'),count=modal.querySelector('.bp-count');
 let sheets=[],index=0,busy=false,session=0,trigger=null,oldOverflow='',launch=null;
 const animations=new Set(),reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const atDepth=n=>`translate3d(${n*2}px,${n*4}px,${-n*7}px) rotateZ(${n*.22}deg)`;
 function motion(node,frames,options={}){const a=node.animate(frames,{duration:1050,easing:'cubic-bezier(.38,0,.22,1)',fill:'forwards',...options});animations.add(a);const done=a.finished.then(()=>true,()=>false);return {done,stop(){a.cancel();animations.delete(a)}};}
 function controls(){prev.disabled=busy||index===0;next.disabled=busy||index===sheets.length-1;count.textContent=`${String(index+1).padStart(2,'0')} / ${String(sheets.length).padStart(2,'0')}`;stack.setAttribute('aria-busy',String(busy));}
 function settle(){sheets.forEach((sheet,i)=>{const depth=(i-index+sheets.length)%sheets.length;sheet.style.transform=atDepth(depth);sheet.dataset.front=String(depth===0);sheet.setAttribute('aria-hidden',String(depth!==0));sheet.inert=depth!==0;});}
 function makeSheet(page,i,title){const sheet=document.createElement('article');if(page.ratio)sheet.style.aspectRatio=page.ratio;sheet.className='bp-sheet';sheet.setAttribute('aria-label',`${title}, sheet ${i+1}`);const front=document.createElement('div');front.className='bp-face bp-face-front';const back=document.createElement('div');back.className='bp-face bp-back';back.setAttribute('aria-hidden','true');const content=document.createElement('div');content.className='bp-content';
  if(page.title){const h=document.createElement('h2');h.textContent=page.title;content.append(h)}
  if(page.image){const img=new Image();img.src=page.image;img.alt=page.imageAlt||`${title}, sheet ${i+1}`;content.append(img)}
  if(page.text){const p=document.createElement('p');p.textContent=page.text;content.append(p)}
  if(page.link){const a=document.createElement('a');a.href=page.link;a.textContent=page.linkLabel||'Explore project';a.target='_blank';a.rel='noopener noreferrer';content.append(a)}
  front.append(content);sheet.append(front,back);return sheet;
 }
 async function open(project,source){if(modal.open)return;const token=++session;trigger=source;index=0;busy=true;oldOverflow=document.body.style.overflow;
  const rect=source.getBoundingClientRect(),volumeTransform=getComputedStyle(source.querySelector('.board-volume')).transform,capTransform=getComputedStyle(source.querySelector('.board-cap')).transform,color=getComputedStyle(source).getPropertyValue('--box-color');
  // Three empty loose sheets reserve space until this project receives artwork.
  const pages=project.pages?.length?project.pages:[{},{},{}];
  sheets=pages.map((p,i)=>makeSheet(p,i,project.title));stack.replaceChildren(...sheets);const ratio=pages[0]?.ratio||'2048 / 962';stage.style.aspectRatio=ratio;settle();controls();modal.querySelector('.bp-name').textContent=project.title;modal.setAttribute('aria-label',`${project.title}, loose instruction sheets`);modal.showModal();document.body.style.overflow='hidden';close.focus();
  if(reduced()){busy=false;controls();return;}
  stack.style.visibility='hidden';
  launch=source.cloneNode(true);launch.classList.add('bp-launch-box');launch.removeAttribute('aria-label');launch.setAttribute('aria-hidden','true');launch.tabIndex=-1;launch.style.setProperty('--box-color',color);Object.assign(launch.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});modal.append(launch);source.style.visibility='hidden';
  const box=launch,volume=box.querySelector('.board-volume'),cap=box.querySelector('.board-cap');
  const boxLift=motion(volume,[{transform:volumeTransform},{transform:'translateY(-24px) translateZ(-90px) rotateX(13deg) rotateY(-26deg)'}],{duration:480});
  const lid=motion(cap,[{transform:capTransform},{transform:'translateY(-9px) rotateX(-3deg)'}],{duration:460,delay:100});
  const fold=document.createElement('div');fold.className='bp-fold';fold.setAttribute('aria-hidden','true');
  // A sheet folded twice: horizontal half, then vertical half inside both halves.
  for(const halfName of ['top','bottom']){
   const half=document.createElement('div');half.className=`bp-fold-half bp-fold-${halfName}`;
   for(const side of ['left','right']){const panel=document.createElement('div');panel.className=`bp-quarter bp-quarter-${side}`;panel.innerHTML='<div class="bp-fold-front"></div><div class="bp-fold-back"></div>';half.append(panel)}
   fold.append(half);
  }
  stage.append(fold);
  const bounds=stage.getBoundingClientRect(),dx=rect.left+rect.width/2-(bounds.left+bounds.width/2),dy=rect.top-8-(bounds.top+bounds.height/2),scale=Math.min(.25,rect.width*1.7/bounds.width);
  const flight=motion(fold,[
   {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale}) rotateX(18deg) rotateZ(-8deg)`,opacity:0,offset:0},
   {transform:`translate3d(${dx}px,${dy-30}px,30px) scale(${scale}) rotateX(12deg) rotateZ(-9deg)`,opacity:1,offset:.13},
   {transform:`translate3d(${dx*.38}px,${dy*.23-32}px,90px) scale(.64) rotateX(-9deg) rotateZ(-5deg)`,opacity:1,offset:.52},
   {transform:'translate3d(-4px,-8px,14px) scale(1) rotateX(2deg) rotateZ(.6deg)',opacity:1,offset:.85},
   {transform:'translate3d(0,0,1px) scale(1) rotateX(0deg) rotateZ(0deg)',opacity:1,offset:1}
  ],{duration:1800,delay:230,easing:'cubic-bezier(.3,.05,.22,1)',fill:'both'});
  const unfolding=[];
  unfolding.push(motion(fold.querySelector('.bp-fold-bottom'),[
   {transform:'translateZ(3px) rotateX(179deg)'},
   {transform:'translateZ(2px) rotateX(78deg)',offset:.48},
   {transform:'translateZ(0) rotateX(-2deg)',offset:.88},
   {transform:'translateZ(0) rotateX(0deg)'}
  ],{duration:920,delay:430,fill:'both'}));
  fold.querySelectorAll('.bp-quarter-right').forEach((panel,i)=>unfolding.push(motion(panel,[
   {transform:'translateZ(2px) rotateY(-179deg)'},
   {transform:'translateZ(2px) rotateY(-82deg) rotateX(3deg)',offset:.48},
   {transform:'translateZ(0) rotateY(2deg) rotateX(-1deg)',offset:.88},
   {transform:'translateZ(0) rotateY(0deg) rotateX(0deg)'}
  ],{duration:1000,delay:850+i*70,fill:'both'})));
  // A small lag at the free corners makes the surface yield as the creases release.
  fold.querySelectorAll('.bp-fold-front,.bp-fold-back').forEach((face,i)=>unfolding.push(motion(face,[
   {borderRadius:'2px',filter:'brightness(.98)'},
   {borderRadius:`${i%2?9:3}px ${i%2?3:9}px 5px 3px`,filter:'brightness(1.015)',offset:.45},
   {borderRadius:'2px',filter:'brightness(1)'}
  ],{duration:1000,delay:850,fill:'both'})));
  const boxFade=motion(box,[{opacity:1},{opacity:0}],{duration:400,delay:700});
  await flight.done;if(token!==session)return;
  source.style.visibility='';stack.style.visibility='';
  // Match the unfolded sheet to the real top sheet before revealing the artwork.
  const content=sheets[0].querySelector('.bp-content');const reveal=motion(content,[{opacity:0},{opacity:1}],{duration:350});
  const dissolve=motion(fold,[{opacity:1},{opacity:0}],{duration:240});await dissolve.done;if(token!==session)return;
  fold.remove();box.remove();launch=null;[boxLift,lid,flight,...unfolding,boxFade,dissolve].forEach(a=>a.stop());await reveal.done;reveal.stop();if(token!==session)return;busy=false;controls();
 }
 async function turn(delta){if(busy||!modal.open||index+delta<0||index+delta>=sheets.length)return;busy=true;controls();const token=session,target=index+delta,oldIndex=index;
  if(reduced()){index=target;settle();busy=false;controls();return;}
  const moving=sheets[delta>0?index:target],distance=stage.clientWidth*.70,last=sheets.length-1;
  // Clear the stack's side before crossing its depth plane, avoiding sliced/intersecting sheets.
  const outward=[
   {transform:atDepth(0),offset:0},
   {transform:`translate3d(${distance*.62}px,-22px,170px) scale(.85) rotateY(-22deg) rotateZ(2deg)`,offset:.23},
   {transform:`translate3d(${distance}px,-16px,160px) scale(.55) rotateY(-58deg) rotateZ(3deg)`,offset:.40},
   {transform:`translate3d(${distance}px,4px,-180px) scale(.55) rotateY(-58deg) rotateZ(2deg)`,offset:.64},
   {transform:`translate3d(${distance*.50}px,10px,-190px) scale(.86) rotateY(-18deg) rotateZ(1deg)`,offset:.82},
   {transform:atDepth(last),offset:1}
  ];
  // Previous mirrors the same route on the left, from behind to the front.
  const frames=delta>0?outward:outward.slice().reverse().map(f=>({...f,offset:1-f.offset,transform:f.transform.replace(/translate3d\(([-\d.]+)px/,(_,x)=>`translate3d(${-Number(x)}px`).replace(/rotateY\(([-\d.]+)deg\)/,(_,a)=>`rotateY(${-Number(a)}deg)`).replace(/rotateZ\(([-\d.]+)deg\)/,(_,a)=>`rotateZ(${-Number(a)}deg)`)}));
  if(delta<0){frames[0].transform=atDepth(last);frames[frames.length-1].transform=atDepth(0);}
  const moves=[motion(moving,frames,{duration:1150,easing:'cubic-bezier(.35,.05,.28,1)'})];
  for(let i=0;i<sheets.length;i++){if(sheets[i]===moving)continue;const before=(i-oldIndex+sheets.length)%sheets.length,after=(i-target+sheets.length)%sheets.length;moves.push(motion(sheets[i],[{transform:atDepth(before)},{transform:atDepth(after)}],{duration:1150}));}
  await Promise.all(moves.map(a=>a.done));if(token!==session)return;index=target;settle();moves.forEach(a=>a.stop());busy=false;controls();
 }
 prev.onclick=()=>turn(-1);next.onclick=()=>turn(1);close.onclick=()=>modal.close();
 modal.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();turn(1)}else if(e.key==='ArrowLeft'){e.preventDefault();turn(-1)}});
 modal.addEventListener('close',()=>{session++;animations.forEach(a=>a.cancel());animations.clear();launch?.remove();launch=null;stage.querySelectorAll('.bp-fold').forEach(n=>n.remove());stack.style.visibility='';trigger&&(trigger.style.visibility='');document.body.style.overflow=oldOverflow;busy=false;trigger?.focus();});
 window.BoardPapers={open};
})();
