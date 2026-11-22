(()=>{
 const slots=[...document.querySelectorAll('.bay[aria-label="Digital Art"] .book-slot')];
 const books=window.CABINET.categories[1].books;
 const modal=document.createElement('dialog');modal.className='digital-folio';modal.setAttribute('aria-label','Digital Art landscape folio');
 modal.innerHTML='<header class="folio-bar"><span class="folio-name"></span><button class="folio-close" aria-label="Close folio">Close ×</button></header><div class="folio-stage"><div class="folio-paper" aria-label="Blank artwork page"></div></div><footer class="folio-nav"><button class="folio-prev" aria-label="Previous page">↑ Previous</button><span aria-live="polite"></span><button class="folio-next" aria-label="Next page">Next ↑</button></footer>';
 document.body.append(modal);let index=0,active=0,busy=false,trigger=null,animation=null;
 const stage=modal.querySelector('.folio-stage'),paper=modal.querySelector('.folio-paper'),count=modal.querySelector('.folio-nav span'),prev=modal.querySelector('.folio-prev'),next=modal.querySelector('.folio-next');
 const update=()=>{const pages=books[active].pages||[];const total=pages.length;count.textContent=`${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;prev.disabled=index===0;next.disabled=index===total-1;paper.replaceChildren();if(pages[index]?.image){const image=document.createElement('img');image.src=pages[index].image;image.alt=pages[index].imageAlt||`${books[active].title}, image ${index+1}`;paper.append(image)}paper.setAttribute('aria-label',`${books[active].title}, page ${index+1}`)};
 slots.forEach((slot,i)=>{slot.classList.add('digital-slot');const volume=slot.querySelector('.volume');for(let layer=0;layer<48;layer++){const sheet=document.createElement('span');sheet.className='digital-page-layer';sheet.setAttribute('aria-hidden','true');sheet.style.setProperty('--depth',String(.46-layer*.92/47));volume.append(sheet);}slot.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();trigger=slot;active=i;index=0;modal.style.setProperty('--folio-accent',books[i].color);modal.querySelector('.folio-name').textContent=books[i].title;update();modal.showModal();document.body.style.overflow='hidden';modal.querySelector('.folio-close').focus();},true)});
 async function turn(delta){if(busy||index+delta<0||index+delta>=(books[active].pages||[]).length)return;busy=true;prev.disabled=next.disabled=true;
 const target=books[active].pages[index+delta];if(target?.image){const preload=new Image();preload.src=target.image;await preload.decode().catch(()=>{});if(!modal.open){busy=false;return}}
 const source=paper.cloneNode(true);index+=delta;update();prev.disabled=next.disabled=true;const destination=paper.cloneNode(true);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const leaf=document.createElement('div');leaf.className='folio-hard-leaf';leaf.setAttribute('aria-hidden','true');
 for(const [copy,back] of [[delta>0?source:destination,false],[delta>0?destination:source,true]]){const face=document.createElement('div');face.className='folio-leaf-face'+(back?' folio-leaf-back':'');copy.classList.remove('folio-turning');if(back){copy.replaceChildren();copy.style.background='#ede8dc'}face.append(copy);leaf.append(face)}
 if(delta<0){paper.replaceChildren(...Array.from(source.childNodes,n=>n.cloneNode(true)))}
 stage.querySelectorAll('.folio-parked').forEach(n=>n.remove());stage.append(leaf);
 const frames=[{transform:'translateZ(2px) rotateX(0deg)'},{transform:'translateZ(2px) rotateX(180deg)',offset:.55},{transform:'translateZ(-6px) rotateX(360deg)'}];
 animation=leaf.animate(delta>0?frames:frames.slice().reverse().map((f,i)=>({...f,offset:[0,.45,1][i]})),{duration:1650,easing:'cubic-bezier(.35,.12,.25,1)',fill:'forwards'});
 await animation.finished.catch(()=>{});if(delta<0&&modal.open)paper.replaceChildren(...Array.from(destination.childNodes,n=>n.cloneNode(true)));if(delta>0&&modal.open){leaf.classList.add('folio-parked')}else{leaf.remove()}}
 busy=false;prev.disabled=index===0;next.disabled=index===books[active].pages.length-1;}
 prev.onclick=()=>turn(-1);next.onclick=()=>turn(1);modal.querySelector('.folio-close').onclick=()=>modal.close();modal.addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();turn(1)}if(['ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();turn(-1)}});modal.addEventListener('close',()=>{animation?.cancel();stage.querySelectorAll('.folio-turning,.folio-hard-leaf').forEach(n=>n.remove());busy=false;document.body.style.overflow='';trigger?.focus()});
})();
