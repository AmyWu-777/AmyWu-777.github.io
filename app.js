const {profile,categories}=window.CABINET;
const $=id=>document.getElementById(id);
$('tagline').textContent=profile.tagline;
$('profile-line').textContent=`${profile.discipline} · ${profile.school} · ${profile.graduation}`;
$('footer-name').textContent=profile.name;
$('title').replaceChildren(document.createTextNode(`${profile.name}’s `),Object.assign(document.createElement('em'),{textContent:'Cabinet'}),Object.assign(document.createElement('span'),{className:'title-star',textContent:'✧'}));
const dialog=$('book-dialog');let activeBook=null,pageIndex=0,returnFocus=null,turning=false,turnAnimation=null,openingAnimations=[];
let readerSession=0,revealAnimations=[];
let studiesObserver=null,researchObserver=null;
const imageReady=new Map();
function preloadImage(src){
 if(!imageReady.has(src)){
  const img=new Image();img.src=src;
  const ready=img.decode().catch(()=>{});imageReady.set(src,ready);
 }
 return imageReady.get(src);
}
function preloadPage(p){return Promise.all([...new Set([...(p.artworks||[]).map(a=>a.image),...Object.values(p.replacementImages||{}).map(a=>a.image),...(p.items||[]).flat().map(a=>a.image),p.image,p.poster,p.referenceImage,p.moodImage,p.bw,p.colour,p.markers,p.gouache].filter(Boolean))].map(preloadImage));}
const readerTemplates=[...document.querySelectorAll('#open-book > .page')].map(p=>p.innerHTML);
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
const isTouch=()=>matchMedia('(hover: none)').matches;
if(isTouch())$('hint').textContent='Tap a spine to see its cover · Tap again to open · Swipe for more';
categories.forEach((category,ci)=>{
 const bay=element('div','bay');bay.setAttribute('role','group');bay.setAttribute('aria-label',category.name);
 category.books.forEach((book,bi)=>{
  const slot=element('button','book-slot');slot.classList.toggle('dvd-slot',book.layout==='dvd');slot.type='button';slot.setAttribute('aria-label',`${book.title}, ${category.name}. Open ${book.layout==='dvd'?'DVD collection':'book'}`);slot.setAttribute('aria-haspopup','dialog');
  slot.style.setProperty('--color',book.color);slot.style.setProperty('--h',`${Math.round(book.height*.92)}px`);slot.style.setProperty('--t',`${Math.round(book.width*1.16)}px`);if(book.ink)slot.style.setProperty('--book-ink',book.ink);
  const volume=element('span','volume');volume.setAttribute('aria-hidden','true');
  const front=element('span','face cover');front.append(element('span','cover-category',category.name),element('span','cover-title',book.title),element('span','cover-symbol',book.symbol),element('span','cover-author',profile.name.toUpperCase()));
  const spine=element('span','face spine');spine.append(element('span','spine-symbol',book.symbol),element('span','spine-title',book.title),element('span','spine-no',String(bi+1).padStart(2,'0')));
  volume.append(front,spine,element('span','face back'),element('span','face page-side'),element('span','face page-top'),element('span','face page-bottom'));const lift=element('span','book-lift');lift.append(volume);slot.append(lift);bay.append(slot);
  slot.addEventListener('click',()=>{if(isTouch()&&!slot.classList.contains('is-peeking')){document.querySelectorAll('.is-peeking').forEach(e=>e.classList.remove('is-peeking'));slot.classList.add('is-peeking');return;}openBook({...book,category:category.name},slot);});
 });$('bays').append(bay);
});
function defaultPages(book){return [
 {label:'Inside the collection',title:'A place for this project.',text:`This is a sample book for ${book.kind.toLowerCase()}. Your finished project will live here, with its own images, story, and details.`,note:'Sample content · Ready to be replaced with your work.'},
 {label:'The process',title:'From an idea to a little world.',text:'Use these pages for early sketches, experiments, and the choices that shaped the final piece. A few images and a short reflection can tell the story.',note:'This book can grow with your project. More pages can be added.'},
 {label:'The finished piece',title:'Take a closer look.',text:'Your photographs, film, artwork, or playable game link can be added on this page.',note:'Images, video files, and project links are supported.'}
];}
function fitBookLabels(){
 document.querySelectorAll('.spine-title,.cover-title').forEach(label=>{
  let size=label.classList.contains('spine-title')?17:25;
  label.style.fontSize=`${size}px`;
  while(size>9&&(label.scrollHeight>label.clientHeight+1||label.scrollWidth>label.clientWidth+1)){
   size-=.5;label.style.fontSize=`${size}px`;
  }
 });
}
fitBookLabels();document.fonts.ready.then(fitBookLabels);
window.addEventListener('resize',fitBookLabels);
function openBook(book,trigger){readerSession++;turning=false;activeBook=book;pageIndex=0;returnFocus=trigger;$('open-book').classList.toggle('is-opening',trigger.classList.contains('book-slot')&&!matchMedia('(prefers-reduced-motion: reduce)').matches);renderPage();dialog.showModal();document.body.style.overflow='hidden';$('close-book').focus();if(trigger.classList.contains('book-slot'))animateOpening(book,trigger);}
function pageSnapshot(page){
 const copy=page.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
 copy.querySelectorAll('video').forEach(v=>{v.removeAttribute('autoplay');v.pause();});return copy;
}
// A sheet is made of connected narrow sections; changing their tangents bends
// the paper continuously while keeping its spine attached to the book.
function softPaper({source,destination,delta=1,duration=1450,delay=0,order=0,fan=false}){
 const spread=$('open-book'),narrow=matchMedia('(max-width:560px)').matches;
 const right=spread.querySelector('.page-right');
 const w=right.offsetWidth,h=right.offsetHeight;
 const sheet=element('div','soft-sheet');sheet.setAttribute('aria-hidden','true');
 sheet.style.left=narrow?(delta>0?'0':`${w}px`):'50%';
 sheet.style.top=narrow?`${spread.querySelector('.page-left').offsetHeight}px`:'0';
 sheet.style.height=`${h}px`;sheet.style.zIndex=String(50-order);
 const count=14,step=w/count,parts=[];
 for(let i=0;i<count;i++){
  const strip=element('div','paper-segment');strip.style.width=`${step+.45}px`;strip.style.height=`${h}px`;
  for(const back of [false,true]){
   const face=element('div',back?'paper-back':'paper-front');
   const page=pageSnapshot(back?destination:source);page.classList.add('paper-content');
   const sample=back?(delta>0?count-i-1:i):(delta>0?i:count-i-1);
   Object.assign(page.style,{width:`${w}px`,height:`${h}px`,left:`${-sample*step}px`});
   face.append(page);strip.append(face);
  }
  sheet.append(strip);parts.push(strip);
 }
 spread.append(sheet);
 let raf=0,done=false,resolve;const finished=new Promise(r=>resolve=r);
 const start=performance.now()+delay;
 function finish(){if(done)return;done=true;cancelAnimationFrame(raf);sheet.remove();resolve();}
 function frame(now){
  const t=Math.max(0,Math.min(1,(now-start)/duration));
  const p=t*t*(3-2*t),wave=Math.sin(Math.PI*p);
  let x=0,z=0;sheet.style.zIndex=String(p<.5?50-order:30+order);
  for(let i=0;i<count;i++){
   const a=(delta>0?-1:1)*Math.PI*p+(delta>0?1:-1)*wave*(i/count-.5)*.95;
   const orient=a;
   const y=wave*Math.sin(i/count*Math.PI)*(fan?5:9);
   // Backward sheets grow left from the same center hinge.
   const px=delta>0?x:-(x+Math.cos(a)*step),pz=delta>0?z:-(z-Math.sin(a)*step);
   parts[i].style.transform=`translate3d(${px}px,${y}px,${pz+wave*5}px) rotateY(${orient}rad)`;
   parts[i].style.setProperty('--paper-shade',String(wave*(.05+.11*i/count)));
   x+=Math.cos(a)*step;z-=Math.sin(a)*step;
  }
  if(t>=1){finish();return;}raf=requestAnimationFrame(frame);
 }
 frame(performance.now());return {finished,cancel:finish};
}
async function animateOpening(book,trigger){
 if(book.layout==='dvd'){await animateDVDOpening();return;}
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 turning=true;const session=readerSession;
 const ready=Promise.all([...document.querySelectorAll('#open-book > .page img')].map(img=>img.decode().catch(()=>{})));
 const spread=$('open-book'),left=spread.querySelector('.page-left'),right=spread.querySelector('.page-right');
 const controls=dialog.querySelector('.reader-footer');controls.inert=true;
 const sheets=[];
 for(let i=0;i<2;i++){
  const blank=element('section','page magic-paper');
  sheets.push(softPaper({source:blank,destination:blank,duration:850,delay:i*130,order:i,fan:true}));
 }
 openingAnimations=sheets;
 await Promise.allSettled([...sheets.map(a=>a.finished),ready]);
 if(session!==readerSession||!dialog.open)return;
 openingAnimations=[];
 const veils=[left,right].map(page=>{
  const veil=element('div','opening-veil');veil.setAttribute('aria-hidden','true');page.append(veil);return veil;
 });
 spread.classList.remove('is-opening');
 revealAnimations=veils.map(veil=>veil.animate([{opacity:1},{opacity:0}],{duration:580,easing:'cubic-bezier(.25,.1,.25,1)',fill:'forwards'}));
 await Promise.allSettled(revealAnimations.map(a=>a.finished));
 veils.forEach(v=>v.remove());
 if(session!==readerSession||!dialog.open)return;
 revealAnimations=[];controls.inert=false;turning=false;
}

function renderGallery(p,pages){
 dialog.classList.add('gallery-reader');
 dialog.removeAttribute('aria-labelledby');dialog.setAttribute('aria-label',activeBook.title);
 $('reader-category').textContent=`${activeBook.category.toUpperCase()} / ${activeBook.title}`;
 [...document.querySelectorAll('#open-book > .page')].forEach((page,i)=>{
  page.classList.add('gallery-page');page.replaceChildren();
  const art=p.artworks[i];
  if(!art){page.append(element('span','gallery-end','✧'));page.setAttribute('aria-label','End of sketchbook');return;}
  page.setAttribute('aria-label',art.caption);
  const figure=element('figure','sketch-figure');
  const stage=element('div','sketch-stage');
  const frame=element('div','sketch-frame'+(art.portraitMat?' portrait-mat':''));
  const img=element('img');img.src=art.image;img.alt=art.caption;img.decoding='async';
  frame.append(img);stage.append(frame);
  const caption=element('figcaption','sketch-caption');caption.lang='en';
  caption.append(element('span','',art.caption),element('span','sketch-folio',String(pageIndex*2+i+1).padStart(2,'0')));
  figure.append(stage,caption);page.append(figure);
 });
 $('page-count').textContent=`${pageIndex+1} / ${pages.length}`;
 $('prev-page').disabled=pageIndex===0;$('next-page').disabled=pageIndex===pages.length-1;
 for(const nearby of [pages[pageIndex-1],pages[pageIndex+1]])if(nearby)preloadPage(nearby);
}
function studyImage(src,alt){
 const img=element('img');
 // Reserve each study's natural ratio before loading or taking a turning-page snapshot.
 const sizes={'latent-fear/black-white.jpg':[1156,1323],'latent-fear/colour-study.jpg':[1100,768],'latent-fear/markers.jpg':[744,447],'latent-fear/gouache.jpg':[743,439],'latent-fear/final-composition.jpg':[1133,1455]};
 if(sizes[src]){[img.width,img.height]=sizes[src];img.style.aspectRatio=sizes[src].join(' / ');}
 img.src=src;img.alt=alt;return img;
}
function renderStudies(p,pages){
 dialog.classList.add('project-reader');dialog.removeAttribute('aria-label');dialog.setAttribute('aria-labelledby','book-title');
 $('reader-category').textContent='ART / LATENT FEAR';
 const [left,right]=document.querySelectorAll('#open-book > .page');left.replaceChildren();right.replaceChildren();
 left.classList.add('studies-page');right.classList.add('final-art-page');
 const studies=element('div','studies-grid');
 const bw=element('section','study-column');const bwHead=element('div','study-header');bwHead.append(element('span','study-index','STUDY 01'),element('h3','study-heading','Black and White'));bw.append(bwHead);
 const bwArt=element('div','study-images');bwArt.append(studyImage(p.bw,'Black-and-white study of an unknown dark doorway'));bw.append(bwArt,element('p','study-note',p.bwNote));
 const colour=element('section','study-column');const colourHead=element('div','study-header');colourHead.append(element('span','study-index','STUDY 02'),element('h3','study-heading','Color'));colour.append(colourHead);
 const colourArt=element('div','study-images colour-comparison');colourArt.append(studyImage(p.colour,'Main colour study of a childhood play space'));
 const pair=element('div','medium-pair');
 for(const [src,label] of [[p.markers,'Markers'],[p.gouache,'Gouache']]){const figure=element('figure');figure.append(studyImage(src,label+' study'),element('figcaption','medium-caption',label));pair.append(figure);}
 colourArt.append(pair);const colourStage=element('div','colour-stage');colourStage.append(colourArt);colour.append(colourStage);
 const notes=element('div','study-notes');p.colourNotes.forEach(t=>notes.append(element('p','study-note',t)));colour.append(notes);studies.append(bw,colour);
 const explanation=element('section','composition-copy');const title=element('h2','composition-heading',p.title);title.id='book-title';explanation.append(title);p.paragraphs.forEach(t=>explanation.append(element('p','',t)));left.append(studies,explanation);
 const finalImage=studyImage(p.image,p.artworkTitle);
 const finalFigure=element('figure','mood-figure');
 finalFigure.append(finalImage,element('figcaption','project-caption',p.artworkTitle));right.append(finalFigure);
 // Scale the complete colour layout, including its internal spaces, as one object.
 let colourLayoutWidth=0;
 const alignStudies=()=>{
  if(!left.isConnected||!bwArt.offsetWidth)return;
  if(!colourLayoutWidth){colourLayoutWidth=colourStage.clientWidth;colourArt.style.width=`${colourLayoutWidth}px`;}
  // Compute geometry from source ratios, never from first-load image measurements.
  const ratio=img=>Number(img.getAttribute('height'))/Number(img.getAttribute('width'));
  const bwImage=bwArt.querySelector('img');
  const artHeight=bwArt.clientWidth*ratio(bwImage);
  bwImage.style.height=`${artHeight}px`;bwArt.style.height=`${artHeight}px`;
  const mainImage=colourArt.firstElementChild;
  const mainHeight=colourLayoutWidth*ratio(mainImage);
  mainImage.style.height=`${mainHeight}px`;
  const groupGap=parseFloat(getComputedStyle(colourArt).rowGap)||0;
  const pairGap=parseFloat(getComputedStyle(pair).columnGap)||0;
  const thumbnailWidth=(colourLayoutWidth-pairGap)/2;
  const thumbnails=[...pair.querySelectorAll('img')];
  thumbnails.forEach(img=>{img.style.height=`${thumbnailWidth*ratio(img)}px`;});
  const groupArtBottom=mainHeight+groupGap+Math.max(...thumbnails.map(img=>thumbnailWidth*ratio(img)));
  if(groupArtBottom>0){
   const scale=Math.min(colourStage.clientWidth/colourLayoutWidth,artHeight/groupArtBottom);
   colourArt.style.transform=`scale(${scale})`;
   colourArt.style.left=`${(colourStage.clientWidth-colourLayoutWidth*scale)/2}px`;
   colourArt.style.top=`${artHeight-groupArtBottom*scale}px`;
   colourStage.style.height=`${artHeight}px`;
  }
  const finalWidth=finalImage.naturalWidth||Number(finalImage.getAttribute('width'));
  const finalHeight=finalImage.naturalHeight||Number(finalImage.getAttribute('height'));
  if(finalWidth&&matchMedia('(min-width:561px)').matches){
   const style=getComputedStyle(right);
   const top=parseFloat(style.paddingTop),bottom=parseFloat(style.paddingBottom);
   const width=right.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
   const height=right.clientHeight-top-bottom;
   const drawnHeight=Math.min(height,width*finalHeight/finalWidth);
   left.style.paddingBottom=`${bottom+(height-drawnHeight)/2+24}px`;
  }else left.style.removeProperty('padding-bottom');
 };
 studiesObserver=new ResizeObserver(alignStudies);
 [left,right,bwArt].forEach(node=>studiesObserver.observe(node));
 // Finish layout synchronously so the animation clones the final scaled group.
 alignStudies();
 // Loading and decoding no longer alter this group's position or scale.
 $('page-count').textContent=`${pageIndex+1} / ${pages.length}`;$('prev-page').disabled=pageIndex===0;$('next-page').disabled=pageIndex===pages.length-1;
}
// Original files fit inside stable frames; intrinsic dimensions are known before decoding.
function originalArtwork(asset){
 const img=studyImage(asset.image,asset.alt);
 img.width=asset.width;img.height=asset.height;
 Object.assign(img.style,{left:'0',top:'0',width:'100%',height:'100%',objectFit:asset.fit||'contain',objectPosition:asset.position||'center'});
 if(asset.rotation)img.style.transform=`rotate(${asset.rotation}deg)`;
 if(asset.crop){
  const [x,y,w,h]=asset.crop;
  Object.assign(img.style,{left:(-x/w*100)+'%',top:(-y/h*100)+'%',width:(asset.width/w*100)+'%',height:(asset.height/h*100)+'%',objectFit:'fill'});
 }
 if(asset.fadeRight){
  const fade='linear-gradient(to right, #000 0%, #000 36%, rgba(0,0,0,.8) 48%, rgba(0,0,0,.35) 62%, rgba(0,0,0,.16) 72%, rgba(0,0,0,.04) 90%, transparent 100%)';
  img.style.maskImage=fade;img.style.webkitMaskImage=fade;
 }
 return img;
}
function renderResearch(p,pages){
 dialog.classList.add('project-reader');dialog.removeAttribute('aria-label');dialog.setAttribute('aria-labelledby','book-title');
 $('reader-category').textContent='ART / LATENT FEAR';
 const paperPages=[...document.querySelectorAll('#open-book > .page')];
 const stages=paperPages.map(page=>{page.replaceChildren();page.classList.add('research-page');const stage=element('div','research-stage');page.append(stage);return stage;});
 const put=(stage,node,x,y,w,h)=>{Object.assign(node.style,{left:x+'px',top:y+'px',width:w+'px'});if(h)node.style.height=h+'px';stage.append(node);return node;};
 const title=element('h2','research-title',p.title);title.id='book-title';put(stages[0],title,54,47,610,36);
 put(stages[0],element('p','research-body',p.paragraphs[0]),54,84,606,70);
 put(stages[0],element('p','research-body',p.paragraphs[1]),54,168,606,90);
 put(stages[0],element('h3','research-subtitle',p.reflectionTitle),54,296,606,32);
 put(stages[0],element('p','research-body',p.reflection[0]),54,328,606,70);
 put(stages[0],element('p','research-body',p.reflection[1]),54,412,606,60);
 // Display the artwork regions from the supplied board at their original proportions.
 const artwork=(stage,crop,x,y,alt,key)=>{
  const frame=element('div','research-art');const asset=p.replacementImages?.[key];
  const img=asset?originalArtwork(asset):studyImage(p.referenceImage,alt);
  if(!asset)Object.assign(img.style,{left:-crop[0]+'px',top:-crop[1]+'px'});frame.append(img);
  put(stage,frame,x,y,crop[2],crop[3]);
 };
 artwork(stages[0],[171,586,388,292],54,496,'The Menaced Assassin by René Magritte');
 artwork(stages[0],[587,586,185,131],470,496,'Harlequin’s Carnival by Joan Miró','fig2');
 artwork(stages[0],[587,737,184,142],470,647,'The Eye of Silence by Max Ernst','fig3');
 put(stages[0],element('span','research-figure-label','Fig.1'),54,790,388,22);
 put(stages[0],element('span','research-figure-label','Fig.2'),470,627,185,20);
 put(stages[0],element('span','research-figure-label','Fig.3'),470,789,184,20);
 p.artNotes.forEach((text,i)=>put(stages[0],element('p','research-art-note',text),59,819+i*18,606,18));
 artwork(stages[1],[900,154,602,755],65,64,'An empty tiled passage with shallow water and fluorescent lighting');
 put(stages[1],element('div','research-image-title',p.imageTitle),65,829,602,24);
 put(stages[1],element('p','research-image-caption',p.imageCaption),65,851,602,20);
 const fit=()=>paperPages.forEach((page,i)=>{
  const scale=Math.min(page.clientWidth/718,page.clientHeight/921);
  stages[i].style.transform=`translate(-50%,-50%) scale(${scale})`;
 });
 researchObserver=new ResizeObserver(fit);paperPages.forEach(page=>researchObserver.observe(page));fit();
 $('page-count').textContent=`${pageIndex+1} / ${pages.length}`;
 $('prev-page').disabled=pageIndex===0;$('next-page').disabled=pageIndex===pages.length-1;
}
function renderReferenceBoard(p,pages){
 dialog.classList.add('project-reader');dialog.removeAttribute('aria-label');dialog.setAttribute('aria-labelledby','book-title');
 $('reader-category').textContent=`${activeBook.category || 'Art'} / ${activeBook.title}`.toUpperCase();
 const paperPages=[...document.querySelectorAll('#open-book > .page')];
 const stages=paperPages.map((page,i)=>{
  page.replaceChildren();page.classList.add('research-page');
  const stage=element('div','research-stage');
  Object.assign(stage.style,{width:p.canvas[0]+'px',height:p.canvas[1]+'px'});
  page.append(stage);
  p.items[i].forEach(item=>{
   const [x,y,w,h]=item.box;let node;
   if(item.kind==='art'){
    node=element('div','research-art');const img=item.image?originalArtwork(item):studyImage(p.referenceImage,p.title+' — artwork');if(item.blend)node.style.mixBlendMode=item.blend;
    if(!item.image)Object.assign(img.style,{left:-x+'px',top:-y+'px',width:'1546px',height:'1080px'});node.append(img);
   }else{
    const heading=['title','subtitle'].includes(item.kind);
    node=element(heading?(item.kind==='title'?'h2':'h3'):'p','board-text',item.text);
    const serif=heading||item.kind==='caption';
    Object.assign(node.style,{fontFamily:serif?'var(--serif)':'var(--sans)',fontSize:item.size+'px',fontWeight:item.kind==='title'?'600':item.kind==='subtitle'?'600':'400',lineHeight:heading?'1.15':'1.25',textAlign:item.align,color:item.color||(item.kind==='caption'?'#705d49':'#4d3429'),whiteSpace:'pre-line',textWrap:'wrap',letterSpacing:'0'});
    if(item.kind==='title')node.id='book-title';
   }
   Object.assign(node.style,{left:(x-p.origins[i][0])+'px',top:(y-p.origins[i][1])+'px',width:w+'px'});
   if(h)node.style.height=h+'px';stage.append(node);
  });return stage;
 });
 const fit=()=>paperPages.forEach((page,i)=>{const scale=Math.min(page.clientWidth/p.canvas[0],page.clientHeight/p.canvas[1]);stages[i].style.transform=`translate(-50%,-50%) scale(${scale})`;});
 researchObserver=new ResizeObserver(fit);paperPages.forEach(page=>researchObserver.observe(page));fit();
 $('page-count').textContent=`${pageIndex+1} / ${pages.length}`;
 $('prev-page').disabled=pageIndex===0;$('next-page').disabled=pageIndex===pages.length-1;
}
function renderExploration(p,pages){
 if(p.type==='reference-board'){renderReferenceBoard(p,pages);return;}
 if(p.type==='studies'){renderStudies(p,pages);return;}
 if(p.type==='research'){renderResearch(p,pages);return;}
 if(pages[pageIndex+1])preloadPage(pages[pageIndex+1]);
 dialog.classList.add('project-reader');dialog.removeAttribute('aria-label');dialog.setAttribute('aria-labelledby','book-title');
 $('reader-category').textContent='ART / LATENT FEAR';
 const [left,right]=document.querySelectorAll('#open-book > .page');
 left.replaceChildren();right.replaceChildren();left.classList.add('mood-page');right.classList.add('exploration-page');
 const mood=element('figure','mood-figure');
 const moodImage=element('img');moodImage.src=p.moodImage;moodImage.alt='Latent Fear mood board: a collage of childhood references, everyday objects, and unsettling imagery.';
 mood.append(moodImage,element('figcaption','project-caption','Mood Board'));left.append(mood);
 const title=element('h2','exploration-title',p.title);title.id='book-title';
 const study=element('figure','study-figure');const img=element('img');img.src=p.image;img.alt='Early Latent Fear studies in color, form, drawing, painting, and collage.';study.append(img);
 const text=element('div','exploration-text');p.paragraphs.forEach(t=>text.append(element('p','',t)));
 right.append(title,study,text);
 $('page-count').textContent=`${pageIndex+1} / ${pages.length}`;
 $('prev-page').disabled=pageIndex===0;$('next-page').disabled=pageIndex===pages.length-1;
}
function renderPage(){
 if(researchObserver){researchObserver.disconnect();researchObserver=null;}
 if(studiesObserver){studiesObserver.disconnect();studiesObserver=null;}
 if(dialog.classList.contains('gallery-reader')||dialog.classList.contains('project-reader')||dialog.classList.contains('dvd-reader')){
  dialog.classList.remove('gallery-reader','project-reader','dvd-reader');dialog.removeAttribute('aria-label');dialog.setAttribute('aria-labelledby','book-title');
  [...document.querySelectorAll('#open-book > .page')].forEach((page,i)=>{page.classList.remove('gallery-page','mood-page','exploration-page','studies-page','final-art-page','research-page','dvd-tray','dvd-info');page.removeAttribute('aria-label');page.style.removeProperty('padding-bottom');page.innerHTML=readerTemplates[i];});
  if(artwork.complete&&artwork.naturalWidth)$('page-art').classList.add('has-art');
 }
 if(activeBook.layout==='dvd'){renderDVD(activeBook.pages[pageIndex],activeBook.pages);return;}
 if(activeBook.layout==='gallery'){renderGallery(activeBook.pages[pageIndex],activeBook.pages);return;}
 if(activeBook.layout==='exploration'){renderExploration(activeBook.pages[pageIndex],activeBook.pages);return;}
 const pages=activeBook.pages||defaultPages(activeBook),p=pages[pageIndex];
 $('reader-category').textContent=activeBook.category.toUpperCase();$('book-kicker').textContent=activeBook.kind;
 $('book-title').textContent=activeBook.title;$('page-caption').textContent=activeBook.subtitle;
 $('page-art').style.setProperty('--page-color',activeBook.color);$('page-art').firstElementChild.textContent=activeBook.symbol;
 $('sheet-label').textContent=p.label;$('sheet-title').textContent=p.title;
 const body=$('sheet-body');body.replaceChildren();if(p.text)body.append(element('p','',p.text));
 if(p.image){const img=element('img');img.src=p.image;img.alt=p.imageAlt||activeBook.title;body.append(img);}
 if(p.video){const video=element('video');video.src=p.video;video.controls=true;video.preload='metadata';body.append(video);}
 if(p.link){const a=element('a','',p.linkLabel||'View project');a.href=p.link;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}
 if(p.note)body.append(element('p','note',p.note));
 $('page-number').textContent=String((pageIndex+1)*2).padStart(2,'0');$('page-count').textContent=`${pageIndex+1} / ${pages.length}`;
 $('prev-page').disabled=pageIndex===0;$('next-page').disabled=pageIndex===pages.length-1;
}
function closeBook(){dialog.close();}
$('close-book').addEventListener('click',closeBook);
dialog.addEventListener('close',()=>{readerSession++;turning=false;revealAnimations.forEach(a=>a.cancel());revealAnimations=[];dialog.querySelector('.reader-footer').inert=false;dialog.querySelectorAll('.opening-veil,.stationary-page').forEach(n=>n.remove());$('open-book').classList.remove('is-opening');document.body.style.overflow='';turnAnimation?.cancel();openingAnimations.forEach(a=>a.cancel());dialog.querySelectorAll('video').forEach(v=>v.pause());returnFocus?.focus({preventScroll:true});});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeBook();}});
async function changePage(delta){
 const pages=activeBook.pages||defaultPages(activeBook);
 if(turning||pageIndex+delta<0||pageIndex+delta>=pages.length)return;
 turning=true;
 const session=readerSession,controls=dialog.querySelector('.reader-footer');controls.inert=true;
 // Decode the upcoming artwork before changing either visible page.
 await preloadPage(pages[pageIndex+delta]);
 if(session!==readerSession||!dialog.open)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){pageIndex+=delta;renderPage();controls.inert=false;turning=false;return;}
 const spread=$('open-book'),narrow=matchMedia('(max-width:560px)').matches;
 const source=pageSnapshot(spread.querySelector(narrow||delta>0?'.page-right':'.page-left'));
 const landing=spread.querySelector(narrow||delta<0?'.page-right':'.page-left');
 const stationary=pageSnapshot(landing);stationary.classList.add('stationary-page');stationary.setAttribute('aria-hidden','true');
 Object.assign(stationary.style,{left:`${landing.offsetLeft}px`,top:`${landing.offsetTop}px`,width:`${landing.offsetWidth}px`,height:`${landing.offsetHeight}px`});
 pageIndex+=delta;renderPage();
 const destination=pageSnapshot(spread.querySelector(narrow||delta<0?'.page-right':'.page-left'));
 // Keep the old landing page in place until the turning sheet covers it.
 if(!narrow)spread.append(stationary);
 turnAnimation=activeBook.layout==='dvd'?hardTray({source,destination,delta}):softPaper({source,destination,delta,duration:1550});
 await turnAnimation.finished;stationary.remove();
 if(session!==readerSession||!dialog.open)return;
 turnAnimation=null;controls.inert=false;turning=false;
}
$('prev-page').addEventListener('click',()=>changePage(-1));$('next-page').addEventListener('click',()=>changePage(1));
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();changePage(1);}if(e.key==='ArrowLeft'){e.preventDefault();changePage(-1);}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.book-slot'))document.querySelectorAll('.is-peeking').forEach(el=>el.classList.remove('is-peeking'));});
// Optional shared illustration. The site remains usable while the artwork loads.
const artwork=new Image();artwork.onload=()=>{$('page-art')?.classList.add('has-art');document.querySelectorAll('.cover').forEach((e,i)=>{if(i===0||i===4||i===8)e.classList.add('illustrated');});};artwork.src='cover-flat.png';
