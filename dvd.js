// The film collection shares the reader controls, with rigid trays instead of paper.
function renderDVD(film,pages){
 dialog.classList.add('dvd-reader');dialog.setAttribute('aria-labelledby','book-title');
 $('reader-category').textContent='SHORT FILMS / THE TWO-DISC COLLECTION';
 const [left,right]=document.querySelectorAll('#open-book > .page');
 left.replaceChildren();right.replaceChildren();left.classList.add('dvd-tray');right.classList.add('dvd-info');
 const no=String(pageIndex+1).padStart(2,'0');
 left.append(element('span','dvd-tray-label',"AMY'S COLLECTION · SHORT FILM"));
 const cradle=element('div','dvd-cradle');
 const disc=element('button','dvd-disc');disc.type='button';disc.disabled=!film.videoUrl;disc.setAttribute('aria-label',film.videoUrl?'Play '+film.title:film.title+' — film coming soon');
 disc.append(element('span','dvd-disc-index','DISC '+no),element('span','dvd-disc-name',film.title),element('span','dvd-disc-hub'),element('span','dvd-disc-edition',film.date||film.year||''));
 cradle.append(disc);left.append(cradle,element('span','dvd-tray-foot','A small collection of moving images.'));
 right.append(element('span','dvd-kicker','SHORT FILM / '+no));
 const title=element('h2','dvd-film-title',film.title);title.id='book-title';right.append(title);
 right.append(element('div','dvd-meta',[film.date||film.year,film.duration].filter(Boolean).join(' · ')));
 const still=element('button','dvd-still');still.type='button';still.setAttribute('aria-label','Watch '+film.title);still.onclick=()=>playDVD(film,still);
 if(film.poster){const img=element('img');img.src=film.poster;img.alt=film.title+' — film still';still.append(img);}else{still.append(element('span','dvd-frame-icon','▻'),element('span','dvd-still-label','FILM STILL / '+no));}
 still.append(element('span','dvd-watch','▶  Watch film'));
 right.append(still);
 if(film.caption)right.append(element('p','dvd-cover-caption',film.caption));
 right.append(element('p','dvd-description',film.description||'Film details coming soon.'));
 if(film.videoUrl)disc.onclick=()=>playDVD(film);
 right.append(element('span','dvd-info-foot','AMY’S CABINET / FILM COLLECTION'));
 $('page-count').textContent=`Disc ${pageIndex+1} / ${pages.length}`;
 $('prev-page').disabled=pageIndex===0;$('next-page').disabled=pageIndex===pages.length-1;
}
function hardTray({source,destination,delta=1,duration=1150}){
 const spread=$('open-book'),narrow=matchMedia('(max-width:560px)').matches,right=spread.querySelector('.page-right');
 const w=right.offsetWidth,h=right.offsetHeight,leaf=element('div','dvd-turn');leaf.setAttribute('aria-hidden','true');
 Object.assign(leaf.style,{width:w+'px',height:h+'px',left:narrow?'0':(delta>0?'50%':'0'),top:narrow?spread.querySelector('.page-left').offsetHeight+'px':'0',transformOrigin:delta>0?'left center':'right center'});
 for(const [page,back] of [[source,false],[destination,true]]){
  const face=element('div','dvd-turn-face'+(back?' dvd-turn-back':''));const copy=pageSnapshot(page);Object.assign(copy.style,{width:w+'px',height:h+'px'});face.append(copy);leaf.append(face);
 }
 spread.append(leaf);
 const animation=leaf.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${delta>0?-180:180}deg)`}],{duration,easing:'cubic-bezier(.35,.05,.22,1)',fill:'forwards'});
 const finished=animation.finished.catch(()=>{}).then(()=>leaf.remove());return {finished,cancel(){animation.cancel();leaf.remove();}};
}
async function animateDVDOpening(){
 const spread=$('open-book');spread.classList.remove('is-opening');
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 turning=true;const session=readerSession,controls=dialog.querySelector('.reader-footer');controls.inert=true;
 const cover=element('section','page dvd-opening-cover');cover.append(element('span','dvd-kicker','AMY’S CABINET'),element('h2','','Short Films'),element('span','dvd-cover-disc','◉'),element('span','','A TWO-DISC COLLECTION'));
 const a=hardTray({source:cover,destination:spread.querySelector('.page-left'),duration:1050});openingAnimations=[a];
 await a.finished;if(session!==readerSession||!dialog.open)return;openingAnimations=[];controls.inert=false;turning=false;
}
function playDVD(film,trigger=document.activeElement){
 let src='';
 try{
  const u=new URL(film.videoUrl);
  if(u.hostname==='drive.google.com'){
   const id=u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1];if(id)src='https://drive.google.com/file/d/'+id+'/preview';
  }else{
   const id=u.hostname==='youtu.be'?u.pathname.slice(1):(['youtube.com','www.youtube.com'].includes(u.hostname)?u.searchParams.get('v')||u.pathname.split('/').pop():'');
   if(/^[\w-]{11}$/.test(id||''))src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1';
  }
 }catch{return;}if(!src)return;
 const player=element('dialog','dvd-player');player.setAttribute('aria-label',film.title+' — video player');
 const bar=element('div','dvd-player-bar'),close=element('button','dvd-player-close','← Back to collection');close.type='button';
 bar.append(element('span','',film.title),close);
 const frame=element('iframe');frame.title=film.title+' video';frame.src=src;frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;
 close.onclick=()=>player.close();
 player.append(bar,frame);document.body.append(player);
 player.addEventListener('close',()=>{frame.src='about:blank';player.remove();if(trigger?.isConnected)trigger.focus({preventScroll:true});});
 player.showModal();close.focus();
}
