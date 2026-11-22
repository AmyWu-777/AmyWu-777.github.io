/* Photo-referenced, individually modelled miniature. No change to the reader. */
(()=>{
 const trigger=[...document.querySelectorAll('.book-slot')].find(e=>e.querySelector('.spine-title')?.textContent==='Latent Fear');
 if(!trigger)return;
 const overlay=document.createElement('div');overlay.className='room-preview';overlay.setAttribute('aria-hidden','true');overlay.innerHTML='<div class="room-preview-stage"><div class="room-preview-caption">A LITTLE ROOM · LATENT FEAR</div></div>';document.body.append(overlay);
 let hovered=false,focused=false,blocked=false,timer,engine,loading,raf=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function hide(){clearTimeout(timer);overlay.classList.remove('is-visible');cancelAnimationFrame(raf);raf=0;}
 function prepare(){return engine?Promise.resolve(engine):(loading||(loading=build().then(value=>engine=value).catch(error=>{loading=null;throw error})));}
 async function show(){if(blocked||document.querySelector('dialog[open]'))return;try{engine=await prepare();if(!(hovered||focused)||blocked)return;overlay.classList.add('is-visible');cancelAnimationFrame(raf);engine.resize();engine.draw(0);if(!reduced.matches){const start=performance.now();function frame(t){engine.draw((t-start)/1000);raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame)}}catch(e){console.warn('Miniature preview unavailable',e);hide();}}
 function queue(){clearTimeout(timer);timer=setTimeout(show,220)}
 trigger.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;hovered=true;blocked=false;queue()});
 trigger.addEventListener('pointerleave',()=>{hovered=false;if(!focused)hide()});
 trigger.addEventListener('focus',()=>{focused=trigger.matches(':focus-visible');if(focused)queue()});
 trigger.addEventListener('blur',()=>{focused=false;hide()});
 trigger.addEventListener('click',()=>{blocked=true;hide()},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){blocked=true;hide()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hide()});
 window.addEventListener('resize',()=>engine?.resize());
 // Start assets independently of opening the book; recover entry during page loading.
 prepare().then(()=>{if(trigger.matches(':hover')){hovered=true;queue()}}).catch(e=>console.warn('Miniature preload deferred',e));
 trigger.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'&&!hovered){hovered=true;blocked=false;queue()}});
 async function build(){
 const T=await import('./vendor/three.module.js');
 const stage=overlay.querySelector('.room-preview-stage');
 let renderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true})}catch{const {softwareRenderer}=await import('./room-software-renderer.js');renderer=softwareRenderer(T)}renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;stage.prepend(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,100);camera.position.set(1.45,4.7,13.9);camera.lookAt(0,1.2,0);
 scene.add(new T.HemisphereLight(0xfff4df,0x57473f,1.55));const sun=new T.DirectionalLight(0xffefdd,2.0);sun.position.set(-3,9,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-6;sun.shadow.camera.right=6;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-6;sun.shadow.normalBias=.035;scene.add(sun);const fill=new T.DirectionalLight(0xd3e1f3,.7);fill.position.set(5,4,-5);scene.add(fill);
 const room=new T.Group();scene.add(room);
 let seed=47;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 // Rectified UV samples from Amy's original photographs. Source pixels remain untouched.
 const photos=await Promise.all(['miniature/room-front.jpg','miniature/room-detail.jpg'].map(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d').drawImage(image,0,0);return c}));
 function sample(photo,quad,w=512,h=512){const src=photos[photo],data=src.getContext('2d').getImageData(0,0,src.width,src.height).data,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),out=ctx.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=x/(w-1),v=y/(h-1),px=(1-v)*((1-u)*quad[0][0]+u*quad[1][0])+v*((1-u)*quad[3][0]+u*quad[2][0]),py=(1-v)*((1-u)*quad[0][1]+u*quad[1][1])+v*((1-u)*quad[3][1]+u*quad[2][1]),sx=Math.min(src.width-2,Math.max(0,Math.floor(px))),sy=Math.min(src.height-2,Math.max(0,Math.floor(py))),fx=px-sx,fy=py-sy,at=(y*w+x)*4;for(let k=0;k<3;k++){const a=(sy*src.width+sx)*4+k;out.data[at+k]=data[a]*(1-fx)*(1-fy)+data[a+4]*fx*(1-fy)+data[a+src.width*4]*(1-fx)*fy+data[a+src.width*4+4]*fx*fy}out.data[at+3]=255}ctx.putImageData(out,0,0);const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();return tex}
 const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 const wallMap=sample(1,[[48,58],[475,55],[478,325],[48,325]],768,768),floorMap=sample(1,rect(220,1285,300,120),768,384),woodMap=sample(1,[[381,785],[648,742],[658,778],[396,830]],512,128),clothMap=sample(1,rect(832,690,150,220),256,384),silverMap=sample(1,[[412,1120],[683,1204],[680,1260],[407,1170]],512,192);
 const screens=[sample(0,[[226,243],[308,247],[310,691],[222,684]],256,768),sample(0,[[349,235],[431,224],[431,705],[348,696]],256,768),sample(0,[[468,285],[504,274],[695,674],[636,704]],256,768)];
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.86,...extra});
 const wood=mat('#ffffff',{map:woodMap,bumpMap:woodMap,bumpScale:.009,roughness:.91}),wall=mat('#ffffff',{map:wallMap,bumpMap:wallMap,bumpScale:.009}),paper=mat('#b9a68a'),floor=mat('#ffffff',{map:floorMap,bumpMap:floorMap,bumpScale:.006}),screen=mat('#ffffff',{map:screens[0],side:T.DoubleSide}),cream=mat('#e6e0d5'),dark=mat('#211a18'),black=mat('#ffffff',{map:clothMap,bumpMap:clothMap,bumpScale:.007,roughness:.98,side:T.DoubleSide}),silver=mat('#ffffff',{map:silverMap,bumpMap:silverMap,bumpScale:.021,metalness:.25,roughness:.68}),leafMat=mat('#72733b',{side:T.DoubleSide}),red=clay('#b92132',1),purple=clay('#49304f',2);
 function clay(color,phase){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),im=ctx.createImageData(256,256),base=new T.Color(color);base.convertLinearToSRGB();
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const u=x/256*Math.PI*2,v=y/256*Math.PI*2,n=.9+.055*Math.sin(u*3+Math.sin(v*2)+phase)+.035*Math.cos(v*5-u*2)+(rand()-.5)*.07,mark=.018*Math.sin(70*Math.hypot(x/256-.35,y/256-.45));const i=(y*256+x)*4;im.data[i]=255*base.r*(n+mark);im.data[i+1]=255*base.g*(n+mark);im.data[i+2]=255*base.b*(n+mark);im.data[i+3]=255}ctx.putImageData(im,0,0);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return mat('#ffffff',{map,bumpMap:map,bumpScale:.004,roughness:.73});
 }
 red.map=sample(1,rect(438,615,24,25),128,128);purple.map=sample(1,rect(511,608,32,33),128,128);
 function clayFruit(x,y,z,r,material,stretch=[1,.9,1],phase=0){const g=new T.SphereGeometry(r,32,24),a=g.attributes.position;for(let i=0;i<a.count;i++){const px=a.getX(i)/r,py=a.getY(i)/r,pz=a.getZ(i)/r,theta=Math.atan2(pz,px),f=1+.045*Math.sin(theta*5+phase)*(1-py*py)+.027*Math.sin(px*8+py*5+phase)*Math.cos(pz*6);a.setXYZ(i,px*r*f,py*r*(1-.13*Math.pow(Math.abs(py),8)),pz*r*f)}g.computeVertexNormals();const f=mesh(g,material,x,y,z);f.scale.set(...stretch);return f;}
 function mesh(g,m,x,y,z,parent=room){const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a}
 function box(w,h,d,m,x,y,z,parent=room){let geo;if(((m===wood||m===silver)&&Math.min(w,h,d)>.025)||(Math.min(w,h,d)>.12&&w<2)){const r=m===wood?Math.min(.042,w*.34,h*.34,d*.34):Math.min(.065,w*.3,h*.3,d*.3),sh=new T.Shape(),a=-w/2+r,b=-h/2+r,W=w-2*r,H=h-2*r;const cr=Math.min(.09,W*.23,H*.23);sh.moveTo(a+cr,b);sh.lineTo(a+W-cr,b);sh.quadraticCurveTo(a+W,b,a+W,b+cr);sh.lineTo(a+W,b+H-cr);sh.quadraticCurveTo(a+W,b+H,a+W-cr,b+H);sh.lineTo(a+cr,b+H);sh.quadraticCurveTo(a,b+H,a,b+H-cr);sh.lineTo(a,b+cr);sh.quadraticCurveTo(a,b,a+cr,b);sh.closePath();geo=new T.ExtrudeGeometry(sh,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:5,curveSegments:8,steps:1});geo.translate(0,0,-d/2+r)}else geo=new T.BoxGeometry(w,h,d,w>1?8:1,h>1?6:1,d>1?6:1);if(m===wall){const uv=geo.attributes.uv,p=geo.attributes.position,n=geo.attributes.normal;for(let i=0;i<uv.count;i++){const u=Math.abs(n.getX(i))>.5?(p.getZ(i)+z+1.7)/2.5:(p.getX(i)+x+3)/2.5;uv.setXY(i,u,(p.getY(i)+y)/2.8)}}if(m===wood){const uv=geo.attributes.uv,p=geo.attributes.position,n=geo.attributes.normal;for(let i=0;i<uv.count;i++){const X=p.getX(i)/w+.5,Y=p.getY(i)/h+.5,Z=p.getZ(i)/d+.5;const faceX=Math.abs(n.getX(i))>.5,faceY=Math.abs(n.getY(i))>.5;uv.setXY(i,h>w?Y:(faceX?Z:X),h>w?(faceX?Z:X):(faceY?Z:Y))}}return mesh(geo,m,x,y,z,parent)}
 function ball(x,y,z,s,m,parent=room){return mesh(new T.SphereGeometry(s,20,14),m,x,y,z,parent)}
 function tube(points,r,m,parent=room){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(30,points.length*8),r,8,false),m,0,0,0,parent)}
 box(6.35,.18,3.75,cream,0,0,0);box(6,.06,3.45,floor,0,.12,0);
 // Three solid walls, with a real opening framed into the rear wall.
 box(6,.95,.10,wall,0,.65,-1.68);box(6,.85,.10,wall,0,2.75,-1.68);box(1.45,1.2,.1,wall,-2.275,1.725,-1.68);box(3.05,1.2,.1,wall,1.475,1.725,-1.68);
 box(.09,3,3.4,wall,-3,1.65,0);box(.09,3,3.4,wall,3,1.65,0);
 // Newspaper covers the outside, as in the rear photograph.
 box(.013,3,3.4,paper,-3.051,1.65,0);box(.013,3,3.4,paper,3.051,1.65,0);
 box(6,.95,.012,paper,0,.65,-1.741);box(6,.85,.012,paper,0,2.75,-1.741);box(1.45,1.2,.012,paper,-2.275,1.725,-1.741);box(3.05,1.2,.012,paper,1.475,1.725,-1.741);
 for(const x of [-3.06,3.06])for(const z of [-1.7,1.72])box(.045,3.08,.045,cream,x,1.65,z);
 box(6.15,.045,.06,cream,0,3.16,-1.7);for(const x of [-3.04,3.04])box(.04,.045,3.45,cream,x,3.16,0);
 for(const y of [1.12,2.32])box(1.65,.065,.14,wood,-.75,y,-1.65);for(const x of [-1.55,.05])box(.065,1.2,.14,wood,x,1.72,-1.65);
 const mirror=mat('#89918e',{metalness:.82,roughness:.16});box(1.52,1.05,.025,mirror,-.75,1.72,-1.72);
 // A dark wooden wardrobe behind the hand-drawn folding screen.
 box(1.05,2.45,.65,wood,-2.12,1.4,-1.1);box(.91,2.3,.04,dark,-2.12,1.4,-.75);
 let panelIndex=0;function panel(x,z,ry,lean=0){const g=new T.Group();g.position.set(x,.17,z);g.rotation.set(lean,ry,lean);room.add(g);const ink=screen.clone();ink.map=screens[panelIndex++];box(.73,2.65,.045,ink,0,1.325,0,g);for(const a of [-.405,.405])box(.075,2.75,.09,wood,a,1.325,0,g);for(const y of [-.015,2.665])box(.86,.07,.09,wood,0,y,0,g)}
 panel(-2.35,.26,-.22);panel(-1.64,.37,.55);panel(-.81,.65,-.35,-.27);
 // Silver box, slatted wooden table, handmade clay still life.
 box(1.65,.55,1.22,silver,1.75,.46,.88);box(1.72,.07,1.28,silver,1.75,.77,.88);box(1.65,.018,1.23,dark,1.75,.63,.88);

 box(1.72,.14,.85,wood,1.105,1.28,.12);for(let i=0;i<18;i++)box(.003,.003,.85,dark,.29+i*.095,1.352,.12);
 for(const x of [.35,1.83])for(const z of [-.21,.45]){const leg=mesh(new T.CylinderGeometry(.039,.031,1.08,12),wood,x,.71,z);leg.rotation.z=x<.7?.015:-.012;}
 let bowl=mesh(new T.SphereGeometry(.27,28,16,0,Math.PI*2,Math.PI/2,Math.PI/2),cream,.7,1.53,.14);bowl.scale.y=.6;
 for(let i=0;i<3;i++){const x=.57+i*.13,z=.12-i*.07,e=clayFruit(x,1.54,z,.11,purple,[.68,.63,2.1],i);e.rotation.y=.5+i*.65;const tip=new T.Vector3(0,0,-.21).applyAxisAngle(new T.Vector3(0,1,0),e.rotation.y);tube([[x+tip.x,1.55,z+tip.z],[x+tip.x-.02,1.57,z+tip.z-.055]],.018,leafMat);for(let k=0;k<4;k++){const l=clayFruit(x+tip.x+.025*Math.cos(k*1.57),1.55,z+tip.z+.025*Math.sin(k*1.57),.033,leafMat,[.5,.3,1.4],k);l.rotation.y=k*1.57}}
 for(const [i,p] of [[.55,1.59,.24],[.86,1.59,.13],[.99,1.435,.42],[2.12,1.46,.25]].entries()){clayFruit(...p,.083,red,[1,.91,.94],i);tube([[p[0],p[1]+.065,p[2]],[p[0]+.009,p[1]+.076,p[2]-.004]],.008,mat('#674032'));}
 mesh(new T.CylinderGeometry(.07,.09,.21,20),mat('#9b522e'),.36,1.46,.23);ball(.36,1.58,.23,.07,leafMat);
 mesh(new T.CylinderGeometry(.08,.065,.2,24),cream,.63,1.47,-.13);mesh(new T.CylinderGeometry(.063,.063,.005,24),mat('#71452c'),.63,1.573,-.13);
 const handle=mesh(new T.TorusGeometry(.062,.018,8,20),cream,.73,1.49,-.13);handle.rotation.y=.3;
 ball(.93,1.47,-.17,.08,cream).scale.y=1.5;mesh(new T.CylinderGeometry(.035,.045,.09,16),cream,.93,1.59,-.17);
 // Soft fabric: an actual curved surface draped across the concealed furniture.
 // Cloth rests on the enlarged table, then the box lid, and drops only beyond its front edge.
 const clothGeo=new T.PlaneGeometry(1,1,64,80),pos=clothGeo.attributes.position;
 function clothPoint(u,v){
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
 // Uneven diagonal hem, gathered folds, and a sagging back corner.
 const corner=Math.pow(Math.abs(2*u-1),8),hemRound=.16*corner*smooth((v-.78)/.22);
 const x=1.1+u*1.73+.035*Math.sin(v*8+u*4),z=-1.18+v*(2.94+.10*Math.sin(u*4.8)+.06*u)-hemRound;
 let y=1.39+.22*(1-smooth((z+1.18)/.8));
 y-=.50*smooth((z-.56)/.69);
 y-=.55*smooth((z-1.57)/.33);
 const drape=smooth((z-.55)/1.05),phase=u*19+1.7*Math.sin(v*4)+v*2;
 const folds=(.039*Math.sin(phase)+.015*Math.sin(u*30-v*6)+.005*Math.cos(u*48+v*9))*(.35+.65*drape);
 y+=folds;
 // A cloth-thickness clearance above both supports, including rounded folds.
 if(x<1.98&&z<.56&&z>-.33)y=Math.max(y,1.371+.006*Math.sin(u*22));
 if(x<2.64&&x>.88&&z>.23&&z<1.55)y=Math.max(y,.837+.014*Math.sin(u*19)**2);
 return [x,y,z];}
 for(let i=0;i<pos.count;i++)pos.setXYZ(i,...clothPoint(pos.getX(i)+.5,pos.getY(i)+.5));clothGeo.computeVertexNormals();mesh(clothGeo,black,0,0,0);
 const hem=[];for(let j=0;j<=64;j++)hem.push(clothPoint(j/64,1));tube(hem,.006,black);
 // Folded paper lamp and climbing ivy.
 mesh(new T.CylinderGeometry(.22,.25,.08,24),cream,2.3,1.6,-1.05);mesh(new T.CylinderGeometry(.035,.05,.6,16),wood,2.3,1.91,-1.05);mesh(new T.CylinderGeometry(.17,.35,.62,5,1,true),mat('#d6cbbb',{side:T.DoubleSide}),2.3,2.32,-1.05);
 for(let n=0;n<3;n++){const pts=[];for(let j=0;j<18;j++){let y=.45+j*.15,x=n===0?2.85:n===1?1.7-y*.48:2.9,z=n===2?.9-y*.75:-1.53;pts.push([x+.09*Math.sin(j),y,z]);if(j%2===0){const shape=new T.Shape();shape.moveTo(0,-.14);shape.bezierCurveTo(-.16,-.03,-.14,.12,0,.16);shape.bezierCurveTo(.13,.11,.17,-.02,0,-.14);const geo=new T.ShapeGeometry(shape,6),p=geo.attributes.position;for(let k=0;k<p.count;k++)p.setZ(k,.035*Math.sin(p.getY(k)*12)+Math.abs(p.getX(k))*.2);geo.computeVertexNormals();const leaf=mesh(geo,leafMat,x+.12*Math.cos(j),y,z+.08);leaf.rotation.set(.2*Math.cos(j),.25*Math.sin(j),j*.9)}}tube(pts,.013,mat('#75613d'))}
 // Iridescent optical disc, leaning at the edge of the black fabric.
 const cd=new T.Group();cd.position.set(.02,.69,.35);cd.rotation.set(.18,-.7,-.35);room.add(cd);const discMap=sample(1,[[103,650],[184,607],[212,1023],[105,1105]],256,512);mesh(new T.RingGeometry(.07,.58,64),mat('#ffffff',{map:discMap,metalness:.55,roughness:.3,side:T.DoubleSide}),0,0,0,cd)
 // Three helically wound strands, with a frayed tassel outside the open front.
 const ropePts=[[-2.82,.48,.35],[-2.68,.26,1],[-1.9,.24,1.27],[-1.1,.23,1.37],[-.6,.18,1.9],[-.3,.05,2.25]];const path=new T.CatmullRomCurve3(ropePts.map(p=>new T.Vector3(...p)));
 for(let k=0;k<3;k++){let pts=[];for(let j=0;j<150;j++){const p=path.getPoint(j/149),a=j*.53+k*Math.PI*2/3;pts.push([p.x+.032*Math.cos(a),p.y+.032*Math.sin(a),p.z])}tube(pts,.037,cream)}
 for(let i=0;i<22;i++)tube([[-.3,.05,2.22],[-.3+(rand()-.5)*.16,.03,2.4],[-.3+(rand()-.5)*.28,-.02,2.52+rand()*.2]],.009,cream);
const shadeCanvas=document.createElement('canvas');shadeCanvas.width=shadeCanvas.height=128;const shadeCtx=shadeCanvas.getContext('2d'),gradient=shadeCtx.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'rgba(44,27,19,.27)');gradient.addColorStop(1,'rgba(44,27,19,0)');shadeCtx.fillStyle=gradient;shadeCtx.fillRect(0,0,128,128);const contact=new T.Mesh(new T.PlaneGeometry(7.8,5),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadeCanvas),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=-.14;if(!renderer.software)room.add(contact);
 function resize(){const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
 let last=-1;function draw(t){if(renderer.software&&t!==0&&t-last<.09)return;last=t;room.rotation.y=.035+Math.sin(t*.18)*.10;renderer.render(scene,camera)}
 resize();return{resize,draw};
 }
})();
