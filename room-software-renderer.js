// Canvas projection of the same 3D meshes for browsers without WebGL.
export function softwareRenderer(T){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');let w=1,h=1,ratio=1;const maps=new WeakMap();
 const light=new T.Vector3(-3,9,6).normalize();
 return {domElement:canvas,shadowMap:{},capabilities:{getMaxAnisotropy:()=>1},software:true,
 setPixelRatio:r=>{ratio=1},setSize:(a,b)=>{w=Math.round(a);h=Math.round(b);canvas.width=w;canvas.height=h;},
 render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);camera.matrixWorldInverse.copy(camera.matrixWorld).invert();const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=[];
 scene.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry,p=geo.attributes.position,uv=geo.attributes.uv,idx=geo.index,verts=[];const normalMatrix=new T.Matrix3().getNormalMatrix(o.matrixWorld);for(let i=0;i<p.count;i++){let v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld),q=v.clone().applyMatrix4(vp);verts.push({x:(q.x+1)*w/2,y:(1-q.y)*h/2,z:q.z,v})}
 const n=idx?idx.count:p.count;for(let i=0;i<n;i+=3){const ids=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),a=verts[ids[0]],b=verts[ids[1]],c=verts[ids[2]];if(a.z>1||b.z>1||c.z>1)continue;const cross=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);const m=Array.isArray(o.material)?o.material[0]:o.material;if(cross>=0&&m.side!==T.DoubleSide)continue;if(Math.abs(cross)<.035)continue;let norm=new T.Vector3().subVectors(b.v,a.v).cross(new T.Vector3().subVectors(c.v,a.v)).normalize();if(cross>0)norm.negate();const shade=.53+.47*Math.max(0,norm.dot(light));const color=m.color.clone().convertLinearToSRGB();faces.push({a,b,c,z:(a.z+b.z+c.z)/3,color:`rgb(${Math.round(color.r*255*shade)},${Math.round(color.g*255*shade)},${Math.round(color.b*255*shade)})`,map:m.map?.image,uv:uv?ids.map(id=>[uv.getX(id),1-uv.getY(id)]):null,shade})}});
 const image=ctx.createImageData(w,h),pixels=image.data,depth=new Float32Array(w*h);depth.fill(Infinity);
 for(const f of faces){const {a,b,c}=f,den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<.001)continue;
 const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
 let tex;if(f.map){tex=maps.get(f.map);if(!tex){tex=f.map.getContext('2d').getImageData(0,0,f.map.width,f.map.height);maps.set(f.map,tex)}}const rgb=f.color.match(/\d+/g).map(Number);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,k=1-u-v;if(u<0||v<0||k<0)continue;const z=u*a.z+v*b.z+k*c.z,index=y*w+x;if(z>=depth[index])continue;depth[index]=z;let r=rgb[0],g=rgb[1],bl=rgb[2];if(tex){const tx=Math.min(tex.width-1,Math.max(0,Math.floor((((u*f.uv[0][0]+v*f.uv[1][0]+k*f.uv[2][0])%1+1)%1)*tex.width))),ty=Math.min(tex.height-1,Math.max(0,Math.floor((((u*f.uv[0][1]+v*f.uv[1][1]+k*f.uv[2][1])%1+1)%1)*tex.height))),ti=(ty*tex.width+tx)*4,shade=.7+f.shade*.3;r=tex.data[ti]*shade;g=tex.data[ti+1]*shade;bl=tex.data[ti+2]*shade}pixels[index*4]=r;pixels[index*4+1]=g;pixels[index*4+2]=bl;pixels[index*4+3]=255}
 }ctx.putImageData(image,0,0);
 }}
}
