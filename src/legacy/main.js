import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

/* PASS 20 — LOS ANGELES PREMIERE DISTRICT VERTICAL SLICE */

/* ============================================================
   CONTINENTAL '26 — PASS 20 Los Angeles premiere refinement of the 2026 World Cup
   Architectural stations, readable entrances, richer crowds, and a new arcade midway.
   One file. No assets. Everything below is generated in code.
   ============================================================ */

const $=id=>document.getElementById(id);
window.addEventListener('error',e=>{const d=$('err');d.style.display='block';d.textContent+=(e.message||e)+'\n';});

/* ---------------- config ---------------- */
const CFG={
  seaY:0, dayLen:240, camFar:7000,
  fogDay:0.00075, fogNight:0.0009,
  flySpeed:55, flyMin:12, flyMax:200,
  walk:7, sprint:14, jumpV:9.5, grav:26, eye:2.7,
  landAlt:90, cityR:210,
};

/* ---------------- city table ---------------- */
/* rot: stadium yaw. py: plateau height. ko: knockout tier. */
const CITIES=[
 {id:'mex', name:'Mexico City',        stadium:'Estadio Azteca',          x:-220, z:660,  py:48, rot: 0.3, hero:true,  biome:'mex',  ko:null,
   rounds:['Group stage, opening match','Round of 32','Round of 16']},
 {id:'gdl', name:'Guadalajara',        stadium:'Estadio Akron',           x:-460, z:600,  py:42, rot:-0.4, hero:false, biome:'mex',  ko:null,
   rounds:['Group stage']},
 {id:'mty', name:'Monterrey',          stadium:'Estadio BBVA',            x:-330, z:400,  py:32, rot: 2.97,hero:false, biome:'mex',  ko:null,
   rounds:['Group stage','Round of 32']},
 {id:'la',  name:'Los Angeles',        stadium:'SoFi Stadium',            x:-700, z:160,  py:11, rot: 0.5, hero:false, biome:'ca',   ko:'QF',
   rounds:['Group stage','Round of 32','Quarterfinal']},
 {id:'sf',  name:'San Francisco Bay',  stadium:"Levi's Stadium",          x:-820, z:-80,  py:13, rot:-0.6, hero:false, biome:'ca',   ko:null,
   rounds:['Group stage','Round of 32']},
 {id:'sea', name:'Seattle',            stadium:'Lumen Field',             x:-700, z:-330, py:14, rot: 0.2, hero:false, biome:'pnw',  ko:null,
   rounds:['Group stage','Round of 32','Round of 16']},
 {id:'van', name:'Vancouver',          stadium:'BC Place',                x:-780, z:-560, py:10, rot: 0.0, hero:true,  biome:'pnw',  ko:null,
   rounds:['Group stage','Round of 32','Round of 16']},
 {id:'kc',  name:'Kansas City',        stadium:'Arrowhead Stadium',       x:0,    z:-40,  py:15, rot: 0.8, hero:false, biome:'plains',ko:'QF',
   rounds:['Group stage','Round of 32','Quarterfinal']},
 {id:'dal', name:'Dallas',             stadium:'AT&T Stadium',            x:-60,  z:300,  py:16, rot:-0.3, hero:false, biome:'tex',  ko:'SF',
   rounds:['Group stage','Round of 32','Round of 16','Semifinal']},
 {id:'hou', name:'Houston',            stadium:'NRG Stadium',             x:-80,  z:500,  py:8,  rot: 0.9, hero:false, biome:'tex',  ko:null,
   rounds:['Group stage','Round of 32','Round of 16']},
 {id:'atl', name:'Atlanta',            stadium:'Mercedes-Benz Stadium',   x:420,  z:320,  py:18, rot: 0.1, hero:false, biome:'se',   ko:'SF',
   rounds:['Group stage','Round of 32','Round of 16','Semifinal']},
 {id:'mia', name:'Miami',              stadium:'Hard Rock Stadium',       x:620,  z:600,  py:6,  rot:-0.7, hero:false, biome:'tropic',ko:'QF',
   rounds:['Group stage','Round of 32','Quarterfinal','Third place match']},
 {id:'tor', name:'Toronto',            stadium:'BMO Field',               x:330,  z:-380, py:12, rot: 0.6, hero:false, biome:'ne',   ko:null,
   rounds:['Group stage','Round of 32']},
 {id:'bos', name:'Boston',             stadium:'Gillette Stadium',        x:820,  z:-420, py:10, rot:-0.9, hero:false, biome:'ne',   ko:'QF',
   rounds:['Group stage','Round of 32','Quarterfinal']},
 {id:'phi', name:'Philadelphia',       stadium:'Lincoln Financial Field', x:480,  z:-100, py:10, rot: 0.4, hero:false, biome:'ne',   ko:null,
   rounds:['Group stage','Round of 32','Round of 16']},
 {id:'ny',  name:'New York / New Jersey', stadium:'MetLife Stadium',      x:640,  z:-220, py:9,  rot:-0.35,hero:true,  biome:'ne',   ko:'F',
   rounds:['Group stage','Round of 32','Round of 16','The Final']},
];
const CITY={}; CITIES.forEach(c=>CITY[c.id]=c);
const RIBBON_ORDER=['la','kc','dal','atl','mia','bos','ny'];

/* ---------------- noise ---------------- */
function hash2(x,y){const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);}
function vnoise(x,y){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return hash2(xi,yi)*(1-u)*(1-v)+hash2(xi+1,yi)*u*(1-v)+hash2(xi,yi+1)*(1-u)*v+hash2(xi+1,yi+1)*u*v;
}
function fbm(x,y,o=4){let a=0,w=.5,f=1;for(let i=0;i<o;i++){a+=w*vnoise(x*f,y*f);w*=.5;f*=2.03;}return a;}
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const smoothstep=(a,b,t)=>{t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);};
const TAU=Math.PI*2;

/* ---------------- continent mask ---------------- */
const BLOBS=CITIES.map(c=>({x:c.x,z:c.z,r:c.hero?300:240}));
BLOBS.push(
 {x:0,   z:0,   r:700},{x:0,  z:-300,r:600},{x:-500,z:200,r:500},
 {x:400, z:200, r:500},{x:-600,z:-300,r:450},{x:500,z:-250,r:450},
 {x:0,   z:500, r:500},
 {x:860, z:-180,r:110},        /* manhattan mass */
 {x:760, z:-30, r:50},         /* liberty point   */
);
const CUTS=[
 {x:755,z:-300,r:60,s:1.7},{x:772,z:-210,r:62,s:1.7},{x:788,z:-120,r:66,s:1.7}, /* hudson */
 {x:830,z:20,  r:90,s:1.3},       /* the harbor behind liberty */
 {x:-940,z:-690,r:130,s:1.4},     /* vancouver inlet  */
 {x:-1010,z:-130,r:140,s:1.5},    /* sf bay           */
 {x:760,z:660,r:150,s:1.25},      /* miami shore      */
 {x:1000,z:-500,r:130,s:1.3},     /* boston harbor    */
];
function maskField(x,z){
  let f=0;
  for(const b of BLOBS){const dx=x-b.x,dz=z-b.z;f+=Math.exp(-(dx*dx+dz*dz)/(b.r*b.r));}
  for(const c of CUTS){const dx=x-c.x,dz=z-c.z;f-=c.s*Math.exp(-(dx*dx+dz*dz)/(c.r*c.r));}
  f+=(fbm(x*.003+7.3,z*.003+2.1,3)-.5)*.3;
  return f;
}
/* mountain weight: garnish ranges at the park edges only */
function mtnW(x,z){
  let w=fbm(x*.0024+11,z*.0024+5,3);
  w=Math.pow(clamp(w*1.5-.42,0,1),1.6);
  const west=smoothstep(-620,-950,x)*.9;
  const east=smoothstep(680,980,x)*smoothstep(-160,-480,z)*.3;
  const mexi=smoothstep(560,760,z)*smoothstep(-300,-600,x)*.55;
  return clamp(w*(0.12+west+east+mexi),0,1);
}
function terrainH(x,z){
  const f=maskField(x,z);
  const t=smoothstep(.34,.62,f);
  if(t<=0) return -16;
  let h=-16+t*24;                                     /* seabed to lowland */
  const m=mtnW(x,z)*t;
  h+=m*(50+120*Math.pow(fbm(x*.006+3,z*.006+9,4),1.4));
  h+=t*10*fbm(x*.012+1,z*.012+4,3);
  /* highland lift under the mexican cluster */
  h+=t*26*smoothstep(340,600,z)*smoothstep(60,-220,x);
  /* flatten city plateaus */
  for(const c of CITIES){
    const dx=x-c.x,dz=z-c.z,d=Math.sqrt(dx*dx+dz*dz);
    const R1=c.hero?200:160,R2=R1+100;
    if(d<R2){const w=1-smoothstep(R1,R2,d);h=lerp(h,c.py,w);}
  }
  return h;
}
/* ---------------- renderer & world scene ---------------- */
const renderer=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.setSize(Math.max(innerWidth,320),Math.max(innerHeight,240));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
/* HDR post chain: real bloom on genuine emitters only (threshold 1.0) */
let composer=null,bloomPass=null,bloomOn=true;
function buildComposer(){
  const w=Math.max(innerWidth,320),h=Math.max(innerHeight,240);
  const rt=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType});
  composer=new EffectComposer(renderer,rt);
  composer.addPass(new RenderPass(scene,camera));
  bloomPass=new UnrealBloomPass(new THREE.Vector2(w/2,h/2),.35,.5,1.0);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xbfd6e8,CFG.fogDay);
const camera=new THREE.PerspectiveCamera(62,Math.max(innerWidth,320)/Math.max(innerHeight,240),0.55,CFG.camFar);
camera.position.set(0,2400,2600);

const hemi=new THREE.HemisphereLight(0xcfe4ff,0x8a7a5a,0.75); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dc,2.2); scene.add(sun); scene.add(sun.target);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-170;sun.shadow.camera.right=170;
sun.shadow.camera.top=170;sun.shadow.camera.bottom=-170;
sun.shadow.camera.near=400;sun.shadow.camera.far=1500;
sun.shadow.bias=-0.0005;
sun.shadow.normalBias=0.6;
const stadiumLight=new THREE.PointLight(0xeaf2ff,0,320,1.6); scene.add(stadiumLight);

/* ---------------- sky dome ---------------- */
const skyUni={cTop:{value:new THREE.Color(0x4a8fd0)},cMid:{value:new THREE.Color(0x8fbede)},
  cHaze:{value:new THREE.Color(0xd8ecf3)},cBelow:{value:new THREE.Color(0x9cb4c4)},
  cSun:{value:new THREE.Color(0xfff3d0)},sunDir:{value:new THREE.Vector3(0,1,0)},uGlow:{value:1}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(4600,24,16),new THREE.ShaderMaterial({
  uniforms:skyUni,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 vP;uniform vec3 cTop,cMid,cHaze,cBelow,cSun,sunDir;uniform float uGlow;
   void main(){vec3 d=normalize(vP);
    /* four-stop ramp: below-horizon, haze band, mid sky, zenith */
    vec3 c=mix(cBelow,cHaze,smoothstep(-.22,.005,d.y));
    c=mix(c,cMid,smoothstep(.015,.16,d.y));
    c=mix(c,cTop,smoothstep(.16,.55,d.y));
    vec3 sd=normalize(sunDir);
    float dt=dot(d,sd);
    /* sun glow, swelling near the horizon */
    float low=1.6-abs(sd.y)*1.2;
    c+=cSun*pow(max(dt,0.),24.)*1.1*uGlow*low;
    c+=cSun*pow(max(dt,0.),3.)*.16*uGlow*low;
    c+=cSun*smoothstep(.99955,.99985,dt)*2.6*uGlow;
    gl_FragColor=vec4(c,1.);}`
}));
sky.frustumCulled=false; scene.add(sky);

/* stars */
{
  const n=1400,pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const a=hash2(i,3)*TAU,e=Math.acos(hash2(i,7)*.98);
    const r=4300;
    pos[i*3]=r*Math.sin(e)*Math.cos(a);pos[i*3+1]=Math.abs(r*Math.cos(e))+60;pos[i*3+2]=r*Math.sin(e)*Math.sin(a);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  var stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xcfe0ff,size:5,sizeAttenuation:true,transparent:true,opacity:0,fog:false,depthWrite:false}));
  stars.frustumCulled=false;scene.add(stars);
}

/* the galactic band: a denser lane of faint stars, fading at dawn */
var bandStars;
{
  const n=2400,pos=new Float32Array(n*3);
  const c=Math.cos(.9),s=Math.sin(.9),r=4250;
  for(let i=0;i<n;i++){
    const a=hash2(i,21)*TAU;
    const off=(hash2(i,22)+hash2(i,23)+hash2(i,24)-1.5)*.26;
    const x=Math.cos(a),y=Math.sin(off),z=Math.sin(a);
    const y2=y*c-z*s,z2=y*s+z*c;
    pos[i*3]=x*r;pos[i*3+1]=Math.abs(y2)*r*.92+50;pos[i*3+2]=z2*r;
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  bandStars=new THREE.Points(g,new THREE.PointsMaterial({color:0xaebfd8,size:2.6,sizeAttenuation:true,
    transparent:true,opacity:0,fog:false,depthWrite:false}));
  bandStars.frustumCulled=false;scene.add(bandStars);
}
/* sun lens flare */
const flareSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex(128,'rgba(255,240,200,.9)','rgba(255,236,190,0)'),
  transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,fog:false}));
flareSpr.scale.set(300,300,1);scene.add(flareSpr);
const flareGhost=new THREE.Sprite(flareSpr.material.clone());
flareGhost.scale.set(90,90,1);scene.add(flareGhost);
/* environment reflections captured from the procedural sky */
const pmrem=new THREE.PMREMGenerator(renderer);
const envScene=new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,16,12),sky.material));
let envRT=null,envDayT=-9;
function refreshEnv(){
  if(envRT&&Math.abs(dayT-envDayT)<.02)return;
  envDayT=dayT;
  const old=envRT;
  envRT=pmrem.fromScene(envScene,0,1,60);
  scene.environment=envRT.texture;
  if(old)old.dispose();
}
/* sun shaft rays for dawn and dusk */
const rayTex=(()=>{
  const cv=document.createElement('canvas');cv.width=cv.height=256;
  const g=cv.getContext('2d');g.translate(128,128);
  for(let i=0;i<14;i++){
    g.rotate(TAU/14);
    const gr=g.createLinearGradient(0,0,126,0);
    gr.addColorStop(0,'rgba(255,235,190,.5)');gr.addColorStop(1,'rgba(255,235,190,0)');
    g.fillStyle=gr;
    g.beginPath();g.moveTo(0,0);g.lineTo(126,-7);g.lineTo(126,7);g.closePath();g.fill();
  }
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
})();
const raySpr=new THREE.Sprite(new THREE.SpriteMaterial({map:rayTex,transparent:true,opacity:0,
  blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,fog:false}));
raySpr.scale.set(950,950,1);scene.add(raySpr);
/* moon */
const moon=new THREE.Mesh(new THREE.SphereGeometry(52,16,12),
  new THREE.MeshBasicMaterial({color:0xe4eaf2,fog:false,transparent:true,opacity:0}));
scene.add(moon);
const moonGlowMat=new THREE.SpriteMaterial({map:softTex(128,'rgba(180,200,235,.7)','rgba(180,200,235,0)'),
  color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const moonGlow=new THREE.Sprite(moonGlowMat);
moonGlow.scale.set(340,340,1);scene.add(moonGlow);

/* soft drifting clouds (billboard planes, canvas texture) */
function softTex(sz,inner,outer){
  const cv=document.createElement('canvas');cv.width=cv.height=sz;const g=cv.getContext('2d');
  const gr=g.createRadialGradient(sz/2,sz/2,sz*.05,sz/2,sz/2,sz*.5);
  gr.addColorStop(0,inner);gr.addColorStop(1,outer);
  g.fillStyle=gr;g.fillRect(0,0,sz,sz);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const cloudTex=softTex(128,'rgba(255,255,255,.85)','rgba(255,255,255,0)');
/* sky clouds: composites of overlapping lobes, lighter tops, flat shaded bottoms */
function makeCloudTex(seed){
  const W2=256,H2=128;
  const cv=document.createElement('canvas');cv.width=W2;cv.height=H2;
  const g=cv.getContext('2d');
  const n=4+Math.floor(hash2(seed,1)*3);
  for(let i=0;i<n;i++){
    const cx=W2*(.18+.64*hash2(seed,i*2+2));
    const cy=H2*(.42+.26*hash2(seed,i*2+3));
    const r=H2*(.26+.3*hash2(seed,i*2+4));
    const gr=g.createRadialGradient(cx,cy-r*.18,r*.1,cx,cy,r);
    gr.addColorStop(0,'rgba(255,255,255,.95)');
    gr.addColorStop(.7,'rgba(246,249,253,.5)');
    gr.addColorStop(1,'rgba(246,249,253,0)');
    g.fillStyle=gr;g.beginPath();g.arc(cx,cy,r,0,TAU);g.fill();
  }
  g.globalCompositeOperation='source-atop';
  const bg2=g.createLinearGradient(0,H2*.5,0,H2);
  bg2.addColorStop(0,'rgba(150,160,180,0)');
  bg2.addColorStop(1,'rgba(138,148,170,.5)');
  g.fillStyle=bg2;g.fillRect(0,0,W2,H2);
  g.globalCompositeOperation='source-over';
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const cloudTexes=[makeCloudTex(1),makeCloudTex(7),makeCloudTex(13)];
const clouds=[];
{
  for(let i=0;i<26;i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTexes[i%3],transparent:true,depthWrite:false,fog:false}));
    const x=(hash2(i,11)-.5)*3400,z=(hash2(i,13)-.5)*2800;
    s.position.set(x,520+hash2(i,17)*300,z);
    const w=420+hash2(i,19)*520;
    s.scale.set(w,w*(.22+hash2(i,29)*.16),1);
    s.material.opacity=.34+hash2(i,23)*.3;
    scene.add(s);clouds.push(s);
  }
}

/* ---------------- terrain ---------------- */
const BIOME_COL={
  pnw:new THREE.Color(0x40694c), ca:new THREE.Color(0xb2a562), mex:new THREE.Color(0xac9a60),
  tex:new THREE.Color(0xc6a878), plains:new THREE.Color(0x8fae5f), se:new THREE.Color(0x619455),
  tropic:new THREE.Color(0x7cb56a), ne:new THREE.Color(0x639659),
};
function biomeColorAt(x,z,h,out){
  /* weighted by distance to cities, defaulted by latitude */
  let r=0,g=0,b=0,wt=0,wMax=0;
  for(const c of CITIES){
    const dx=x-c.x,dz=z-c.z,d2=dx*dx+dz*dz;
    const w=Math.exp(-d2/(340*340));
    if(w>wMax)wMax=w;
    const col=BIOME_COL[c.biome];
    r+=col.r*w;g+=col.g*w;b+=col.b*w;wt+=w;
  }
  const south=smoothstep(-450,640,z);
  const base=new THREE.Color().setRGB(lerp(.36,.66,south),lerp(.56,.6,south),lerp(.33,.35,south));
  if(wt>0.02){const k=clamp(wt,0,1);out.setRGB(lerp(base.r,r/wt,k),lerp(base.g,g/wt,k),lerp(base.b,b/wt,k));}
  else out.copy(base);
  /* groomed park lawn inside the lands */
  out.lerp(new THREE.Color(0x74a85e),smoothstep(.35,.9,wMax)*.4);
  /* altitude: rock and snow */
  const rockA=smoothstep(70,120,h),snowA=smoothstep(135,175,h);
  out.lerp(new THREE.Color(0x8b8578),rockA);
  out.lerp(new THREE.Color(0xeef2f5),snowA);
  /* farmland patchwork across the plains belt */
  {
    const fx=smoothstep(-380,-220,x)*(1-smoothstep(380,560,x));
    const fz=smoothstep(-640,-500,z)*(1-smoothstep(-380,-240,z));
    const farm=fx*fz*smoothstep(38,22,h)*(1-smoothstep(60,90,h))*(1-smoothstep(.5,.85,wMax));
    if(farm>0.02){
      const cs=88;
      const ci=Math.floor(x/cs),cj=Math.floor(z/cs);
      const r=hash2(ci*3.7,cj*7.3);
      const FIELD=[0xc9b268,0x7fa84f,0x5d8a3f,0xb09a6a,0x93a955];
      out.lerp(new THREE.Color(FIELD[Math.floor(r*5)%5]),farm*.6);
      /* faint section roads between the fields */
      const ex=Math.abs(x/cs-Math.round(x/cs)),ez2=Math.abs(z/cs-Math.round(z/cs));
      if(ex<.025||ez2<.025)out.multiplyScalar(1-farm*.22);
    }
  }
  /* the drawn coastline: a full beach band ringing the island */
  const sand=1-smoothstep(1.8,6.4,h);
  if(h>-3) out.lerp(new THREE.Color(z>350?0xe8d5a6:0xe2cfa2),sand*.95);
  /* crisp foam hugging the waterline */
  if(h>-.7&&h<.5)out.lerp(new THREE.Color(0xeef6f2),.6*(1-Math.abs((h+.1)/.6)));
  /* painterly grain: two low octaves so slopes shade smoothly, no speckle */
  const n=(fbm(x*.006,z*.006,2)-.5)+(fbm(x*.0015+40,z*.0015+9,2)-.5)*.7;
  out.offsetHSL(n*.015,n*.04,n*.05);
  return out;
}
{
  const W=3600,D=3000,SX=240,SZ=200;
  const geo=new THREE.PlaneGeometry(W,D,SX,SZ);
  geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,col=new Float32Array(pos.count*3);
  const c=new THREE.Color();
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i);
    const h=terrainH(x,z);
    pos.setY(i,h);
    biomeColorAt(x,z,h,c);
    /* slope shading: darken steep faces, lift sunny flats */
    if(h>-2){
      const e=6;
      const gx=(terrainH(x+e,z)-terrainH(x-e,z))/(2*e);
      const gz=(terrainH(x,z+e)-terrainH(x,z-e))/(2*e);
      const slope=Math.min(Math.hypot(gx,gz),1.2);
      c.multiplyScalar(1.04-slope*.30);
    }
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  geo.computeVertexNormals();
  var terrain=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
  terrain.receiveShadow=true;
  scene.add(terrain);
}
/* underside rock: the floating island illusion */
{
  const W=3600,D=3000,SX=96,SZ=80;
  const geo=new THREE.PlaneGeometry(W,D,SX,SZ);
  geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,col=new Float32Array(pos.count*3);
  const cTop=new THREE.Color(0x54483c),cBot=new THREE.Color(0x241f1a);
  const c=new THREE.Color();
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i);
    const f=maskField(x,z),t=smoothstep(.30,.62,f);
    const depth=18+t*(200+240*fbm(x*.0035+9,z*.0035+2,3));
    pos.setY(i,-depth);
    c.copy(cTop).lerp(cBot,clamp(depth/380,0,1));
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true,side:THREE.DoubleSide}));
  scene.add(m);
}
/* ---------------- water ---------------- */
const waterUni={uTime:{value:0},uLight:{value:1},
  cDeep:{value:new THREE.Color(0x16537a)},cShal:{value:new THREE.Color(0x2f8fb0)},
  cTrop:{value:new THREE.Color(0x2fd4c4)},trop:{value:new THREE.Vector2(740,650)},
  uSunDir:{value:new THREE.Vector3(0,1,0)},uCamPos:{value:new THREE.Vector3()}};
{
  const geo=new THREE.PlaneGeometry(7600,6400,80,68);
  geo.rotateX(-Math.PI/2);
  /* per-vertex shore proximity from the island mask: turquoise shallows to navy deeps */
  {
    const pa=geo.attributes.position;
    const sh=new Float32Array(pa.count);
    for(let i=0;i<pa.count;i++)sh[i]=smoothstep(.12,.40,maskField(pa.getX(i),pa.getZ(i)));
    geo.setAttribute('aShore',new THREE.BufferAttribute(sh,1));
  }
  const mat=new THREE.ShaderMaterial({
    uniforms:Object.assign({fogColor:{value:scene.fog.color},fogDensity:{value:CFG.fogDay}},waterUni),
    transparent:true,
    vertexShader:`uniform float uTime;attribute float aShore;varying float vShore;varying vec3 vW;varying float vFogZ;
      void main(){vec3 p=position;
        p.y+=0.55*sin(uTime*.7+position.x*.015)+0.4*sin(uTime*.9+position.z*.02);
        vShore=aShore;
        vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;
        vec4 mv=viewMatrix*w;vFogZ=-mv.z;
        gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uTime,uLight,fogDensity;uniform vec3 cDeep,cShal,cTrop,fogColor,uSunDir,uCamPos;uniform vec2 trop;varying vec3 vW;varying float vFogZ;varying float vShore;
      float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
        return mix(mix(h2(i),h2(i+vec2(1,0)),u.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),u.x),u.y);}
      void main(){
        float n=vn(vW.xz*.012+uTime*.05);
        vec3 c=mix(cDeep,cShal,n*.3+vShore*.6);
        /* shallow turquoise hugging every coast */
        c=mix(c,vec3(.16,.66,.60),vShore*vShore*.55);
        float td=1.-smoothstep(160.,420.,distance(vW.xz,trop));
        c=mix(c,cTrop,td*.75);
        /* caustic web near the tropics */
        float ca=pow(abs(sin(vW.x*.11+uTime*.8)*sin(vW.z*.10-uTime*.7)),6.);
        c+=vec3(.5,.9,.85)*ca*td*.35;
        float sp=step(.982,vn(vW.xz*.06-uTime*.12));
        c+=vec3(1.,.95,.8)*sp*.5*uLight;
        /* sun glitter: a specular streak that stretches at low sun */
        {
          vec2 tf=normalize(vW.xz-uCamPos.xz);
          vec2 sxz=normalize(uSunDir.xz+vec2(1e-4));
          float al=max(dot(tf,sxz),0.);
          float low=1.-clamp(uSunDir.y*1.8,0.,1.);
          float streak=pow(al,mix(90.,14.,low));
          c+=vec3(1.,.88,.66)*streak*(.22+sp*1.6)*(.25+low*.9)*uLight;
        }
        /* fine animated shimmer riding the swell */
        float sh=pow(vn(vW.xz*.16+vec2(uTime*.3,-uTime*.22)),7.);
        c+=vec3(.85,.95,1.)*sh*.4*uLight;
        c*=mix(.14,1.,uLight);
        float f=1.-exp(-fogDensity*fogDensity*vFogZ*vFogZ);
        c=mix(c,fogColor,clamp(f,0.,1.));
        gl_FragColor=vec4(c,.96);}`
  });
  var water=new THREE.Mesh(geo,mat);water.position.y=CFG.seaY;water.renderOrder=1;scene.add(water);
}
/* ---------------- shared materials ---------------- */
const MAT={
  opaque:new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true,side:THREE.DoubleSide}),
  glass:new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,transparent:true,opacity:.45,side:THREE.DoubleSide,metalness:.15,roughness:.18,envMapIntensity:1.1,depthWrite:false}),
  glow:new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),
  gold:new THREE.MeshStandardMaterial({color:0xe8b84b,metalness:.95,roughness:.28,envMapIntensity:1.2,emissive:0x33240a}),
  seat:new THREE.MeshLambertMaterial({color:0xffffff}),
};
MAT.glow.side=THREE.DoubleSide;

/* ---------------- geometry batcher ---------------- */
const PRIM={
  box:new THREE.BoxGeometry(1,1,1),
  cyl:new THREE.CylinderGeometry(.5,.5,1,10),
  cyl6:new THREE.CylinderGeometry(.5,.5,1,6),
  tube:new THREE.CylinderGeometry(.5,.5,1,5),
  cone:new THREE.ConeGeometry(.5,1,8),
  cone4:new THREE.ConeGeometry(.5,1,4),
  sph:new THREE.SphereGeometry(.5,10,7),
  sphLo:new THREE.SphereGeometry(.5,6,5),
  ico:new THREE.IcosahedronGeometry(.5,0),
  ring:new THREE.CylinderGeometry(.5,.5,1,24,1,true),
  disc:new THREE.CylinderGeometry(.5,.5,1,24),
};
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v3=new THREE.Vector3(),_s3=new THREE.Vector3();
// Shared world-up axis. Pass 21's New York helpers use this outside buildCity,
// while the original monolith only declared a block-local copy inside buildCity.
const Y=new THREE.Vector3(0,1,0);
const NI=g=>g.index?g.toNonIndexed():g;
class Batch{
  constructor(){this.list=[];}
  /* add(geo, color, x,y,z, [ry, sx,sy,sz, rx,rz]) */
  add(geo,color,x,y,z,ry=0,sx=1,sy=1,sz=1,rx=0,rz=0){
    const g=geo.index?geo.toNonIndexed():geo.clone();
    _e.set(rx,ry,rz);_q.setFromEuler(_e);_v3.set(x,y,z);_s3.set(sx,sy,sz);
    _m4.compose(_v3,_q,_s3);g.applyMatrix4(_m4);
    const n=g.attributes.position.count,col=new Float32Array(n*3);
    const c=(color instanceof THREE.Color)?color:new THREE.Color(color);
    for(let i=0;i<n;i++){col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));
    if(!g.attributes.uv){const uv=new Float32Array(n*2);g.setAttribute('uv',new THREE.BufferAttribute(uv,2));}
    this.list.push(g);return this;
  }
  addRaw(g){this.list.push(g);return this;}
  build(mat,shadow){
    if(!this.list.length)return null;
    const g=mergeGeometries(this.list,false);
    this.list.length=0;
    const m=new THREE.Mesh(g,mat);
    if(shadow){m.castShadow=true;m.receiveShadow=true;}
    return m;
  }
}

/* ---------------- world registries ---------------- */
const colliders=[];      /* {x,z,r,h,y}   solid cylinders, world coords */
const platforms=[];      /* {x0,x1,z0,z1,y} walkable decks              */
const anims=[];          /* {u:(t,dt)=>{}}                              */
const particleSys=[];    /* gated particle systems                      */
const treeReq={con:[],leaf:[],palm:[],agave:[],pop:[],shrub:[]};
const stadiums={};       /* id -> {center:V3, bowl:{rx,rz,rot,rOut}, entrance:V3, pitchY, name} */
let flagVerts=null;      /* filled by FlagField */
let rocketRef=null,wheelRefs=null,bellRef=null,ggRef=null;  /* living-landmark handles */
let shakeT=0,photoMode=false,photoShot=false;

function addCollider(x,z,r,h,y){colliders.push({x,z,r,h,y});}

/* ---------------- flags & bunting (one draw call, waving in shader) ---------------- */
const flagField={pos:[],col:[],amp:[],phase:[],
  /* rectangular flag: base pos, yaw, w,h, color(s) */
  flag(x,y,z,yaw,w,h,c1,c2){
    const cA=new THREE.Color(c1),cB=new THREE.Color(c2||c1);
    const SU=5,SV=3;
    const dx=Math.cos(yaw),dz=Math.sin(yaw);
    const ph=hash2(x,z)*TAU;
    for(let i=0;i<SU;i++)for(let j=0;j<SV;j++){
      const u0=i/SU,u1=(i+1)/SU,v0=j/SV,v1=(j+1)/SV;
      const corners=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
      const idx=[0,1,2,0,2,3];
      for(const k of idx){
        const[u,v]=corners[k];
        this.pos.push(x+dx*u*w,y+v*h,z+dz*u*w);
        const c=(v>.5)?cA:cB;
        this.col.push(c.r,c.g,c.b);
        this.amp.push(u*u*1.4);
        this.phase.push(ph+u*2.6);
      }
    }
  },
  /* bunting string of small triangles between two points */
  bunting(x1,y1,z1,x2,y2,z2,n){
    const cols=[0xe8b84b,0xd94f54,0x3fa66a,0x3f7fd9,0xe8e6df,0xd977b8];
    for(let i=0;i<n;i++){
      const t=(i+.5)/n,sag=Math.sin(t*Math.PI)*1.6;
      const x=lerp(x1,x2,t),y=lerp(y1,y2,t)-sag,z=lerp(z1,z2,t);
      const c=new THREE.Color(cols[i%cols.length]);
      const dx=(x2-x1),dz=(z2-z1),L=Math.sqrt(dx*dx+dz*dz)||1;
      const ux=dx/L*.9,uz=dz/L*.9;
      const ph=hash2(i,x1)*TAU;
      const tri=[[x-ux,y,z-uz],[x+ux,y,z+uz],[x,y-1.5,z]];
      for(const p of tri){this.pos.push(p[0],p[1],p[2]);this.col.push(c.r,c.g,c.b);this.amp.push(.5);this.phase.push(ph);}
    }
  },
  build(){
    if(!this.pos.length)return null;
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(this.pos),3));
    g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(this.col),3));
    g.setAttribute('aAmp',new THREE.BufferAttribute(new Float32Array(this.amp),1));
    g.setAttribute('aPhase',new THREE.BufferAttribute(new Float32Array(this.phase),1));
    flagUni.uTime={value:0};
    const mat=new THREE.ShaderMaterial({uniforms:flagUni,side:THREE.DoubleSide,
      vertexShader:`attribute float aAmp,aPhase;varying vec3 vC;varying float vSh;uniform float uTime;
        void main(){vC=color;vec3 p=position;
          float w=sin(uTime*4.2+aPhase)*aAmp;
          p.x+=w*.35;p.z+=w*.35;p.y+=cos(uTime*4.2+aPhase)*aAmp*.12;
          vSh=.82+.18*sin(uTime*4.2+aPhase+1.3);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader:`varying vec3 vC;varying float vSh;uniform float uLight;
        void main(){gl_FragColor=vec4(vC*vSh*mix(.25,1.,uLight),1.);}`,
      vertexColors:true});
    return new THREE.Mesh(g,mat);
  }
};
const flagUni={uLight:{value:1}};

/* ---------------- pitch texture (shared) ---------------- */
function makePitchTex(){
  const w=512,h=336,cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const g=cv.getContext('2d');
  /* mown stripes */
  for(let i=0;i<12;i++){g.fillStyle=i%2?'#3f8f43':'#48a04c';g.fillRect(i*w/12,0,w/12+1,h);}
  g.strokeStyle='rgba(255,255,255,.92)';g.lineWidth=3;
  const mx=26,my=22;
  g.strokeRect(mx,my,w-2*mx,h-2*my);
  g.beginPath();g.moveTo(w/2,my);g.lineTo(w/2,h-my);g.stroke();
  g.beginPath();g.arc(w/2,h/2,46,0,TAU);g.stroke();
  g.beginPath();g.arc(w/2,h/2,4,0,TAU);g.fillStyle='#fff';g.fill();
  /* boxes */
  for(const s of[1,-1]){
    const bx=s>0?mx:w-mx;
    g.strokeRect(Math.min(bx,bx+s*88),h/2-70,88,140);
    g.strokeRect(Math.min(bx,bx+s*34),h/2-32,34,64);
    g.beginPath();g.arc(bx+s*58,h/2,3,0,TAU);g.fillStyle='#fff';g.fill();
  }
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const pitchTex=makePitchTex();
/* subtle tiling paving for the promenade and its plazas */
const pavTex=(()=>{
  const cv=document.createElement('canvas');cv.width=cv.height=128;
  const g=cv.getContext('2d');
  g.fillStyle='#cfc4ac';g.fillRect(0,0,128,128);
  for(let i=0;i<340;i++){
    const x=hash2(i,1)*128,y=hash2(i,2)*128,v=(hash2(i,3)-.5)*18;
    g.fillStyle=`rgba(${120+v|0},${112+v|0},${94+v|0},.35)`;
    g.fillRect(x,y,2.2,2.2);
  }
  g.strokeStyle='rgba(90,84,70,.30)';g.lineWidth=1.4;
  for(let k=0;k<=4;k++){
    g.beginPath();g.moveTo(k*32,0);g.lineTo(k*32,128);g.stroke();
    g.beginPath();g.moveTo(0,k*32);g.lineTo(128,k*32);g.stroke();
  }
  const t=new THREE.CanvasTexture(cv);
  t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);
  return t;
})();
MAT.paved=new THREE.MeshLambertMaterial({map:pavTex,vertexColors:true,flatShading:true});
const pitchGeo=new THREE.PlaneGeometry(56,34);pitchGeo.rotateX(-Math.PI/2);
const pitchMat=new THREE.MeshLambertMaterial({map:pitchTex});


/* Pass 19 — Estadio Azteca receives a dedicated, physically shaded match surface. */
function makeAztecaPitchMaterial(){
  const W=1024,H=624;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const g=cv.getContext('2d');
  const bump=document.createElement('canvas');bump.width=W;bump.height=H;
  const bg=bump.getContext('2d');
  /* layered mowing: broad broadcast bands plus fine blade direction. */
  for(let i=0;i<18;i++){
    const x=i*W/18,w=W/18+1;
    const grad=g.createLinearGradient(x,0,x+w,0);
    const a=i%2?'#205f31':'#28713a',b=i%2?'#2c7b3e':'#1f6532';
    grad.addColorStop(0,a);grad.addColorStop(.52,b);grad.addColorStop(1,a);g.fillStyle=grad;g.fillRect(x,0,w,H);
  }
  /* fine grass and organic wear. */
  for(let i=0;i<28000;i++){
    const x=hash2(i,191)*W,y=hash2(i,193)*H;
    const light=hash2(i,197)>.52;
    g.strokeStyle=light?'rgba(180,225,164,.055)':'rgba(4,37,16,.08)';
    g.lineWidth=.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+.8,y+(hash2(i,199)-.5)*3);g.stroke();
    const v=118+Math.floor(hash2(i,211)*64);bg.fillStyle=`rgb(${v},${v},${v})`;bg.fillRect(x,y,1,1);
  }
  function wear(nx,ny,rx,ry,a){
    const gr=g.createRadialGradient(nx,ny,0,nx,ny,Math.max(rx,ry));
    gr.addColorStop(0,`rgba(183,151,93,${a})`);gr.addColorStop(.55,`rgba(106,92,57,${a*.36})`);gr.addColorStop(1,'rgba(0,0,0,0)');
    g.save();g.translate(nx,ny);g.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry));g.fillStyle=gr;g.beginPath();g.arc(0,0,Math.max(rx,ry),0,TAU);g.fill();g.restore();
  }
  wear(W*.5,H*.5,55,35,.11);wear(W*.825,H*.5,35,72,.15);wear(W*.175,H*.5,35,72,.11);
  for(let i=0;i<150;i++){
    const x=W*.5+(hash2(i,219)-.5)*W*.72,y=H*.5+(hash2(i,223)-.5)*H*.72;
    g.fillStyle='rgba(196,173,122,.07)';g.beginPath();g.ellipse(x,y,1+hash2(i,227)*4,.6+hash2(i,229)*2,hash2(i,233)*TAU,0,TAU);g.fill();
  }
  /* regulation paint with subtle edge feathering. */
  const mx=47,my=44,line=5;
  function paintLines(alpha,width){g.strokeStyle=`rgba(247,248,239,${alpha})`;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';}
  paintLines(.18,11);g.strokeRect(mx,my,W-2*mx,H-2*my);g.beginPath();g.moveTo(W/2,my);g.lineTo(W/2,H-my);g.stroke();
  paintLines(.94,line);g.strokeRect(mx,my,W-2*mx,H-2*my);g.beginPath();g.moveTo(W/2,my);g.lineTo(W/2,H-my);g.stroke();
  for(const soft of[true,false]){
    paintLines(soft?.16:.94,soft?10:line);
    g.beginPath();g.arc(W/2,H/2,84,0,TAU);g.stroke();
    for(const side of[-1,1]){
      const gx=side<0?mx:W-mx;
      const px=side<0?mx:W-mx-170;
      const sx=side<0?mx:W-mx-66;
      g.strokeRect(px,H/2-128,170,256);g.strokeRect(sx,H/2-57,66,114);
      g.beginPath();g.arc(gx+side*111,H/2,3.8,0,TAU);g.fillStyle=`rgba(247,248,239,${soft?.16:.94})`;g.fill();
      g.beginPath();g.arc(gx+side*111,H/2,58,side<0?-1.05:Math.PI-1.05,side<0?1.05:Math.PI+1.05);g.stroke();
    }
  }
  g.beginPath();g.arc(W/2,H/2,4,0,TAU);g.fillStyle='rgba(247,248,239,.96)';g.fill();
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());
  const bumpTex=new THREE.CanvasTexture(bump);bumpTex.anisotropy=tex.anisotropy;
  return new THREE.MeshStandardMaterial({map:tex,bumpMap:bumpTex,bumpScale:.038,roughness:.88,metalness:0,color:0xffffff,envMapIntensity:.22});
}
const aztecaPitchMat=makeAztecaPitchMaterial();

/* Pass 20 — SoFi receives a cooler, tightly groomed broadcast surface. */
function makeSoFiPitchMaterial(){
  const W=1024,H=624,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const g=cv.getContext('2d'),bump=document.createElement('canvas');bump.width=W;bump.height=H;
  const bg=bump.getContext('2d');
  for(let i=0;i<20;i++){
    const x=i*W/20,w=W/20+1;
    const gr=g.createLinearGradient(x,0,x+w,0);
    const a=i%2?'#1f6b39':'#277744',b=i%2?'#2d8148':'#226f3d';
    gr.addColorStop(0,a);gr.addColorStop(.5,b);gr.addColorStop(1,a);g.fillStyle=gr;g.fillRect(x,0,w,H);
  }
  for(let i=0;i<24000;i++){
    const x=hash2(i,311)*W,y=hash2(i,313)*H;
    g.strokeStyle=hash2(i,317)>.5?'rgba(177,224,184,.05)':'rgba(5,35,19,.065)';
    g.lineWidth=.55;g.beginPath();g.moveTo(x,y);g.lineTo(x+.7,y+(hash2(i,319)-.5)*2.7);g.stroke();
    const v=120+Math.floor(hash2(i,323)*72);bg.fillStyle=`rgb(${v},${v},${v})`;bg.fillRect(x,y,1,1);
  }
  /* faint cool reflections from the suspended screen. */
  const halo=g.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.38);
  halo.addColorStop(0,'rgba(113,205,228,.055)');halo.addColorStop(.62,'rgba(81,157,193,.018)');halo.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=halo;g.fillRect(0,0,W,H);
  const mx=47,my=44,line=5;
  function paint(a,w){g.strokeStyle=`rgba(248,250,244,${a})`;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';}
  paint(.16,11);g.strokeRect(mx,my,W-2*mx,H-2*my);g.beginPath();g.moveTo(W/2,my);g.lineTo(W/2,H-my);g.stroke();
  paint(.95,line);g.strokeRect(mx,my,W-2*mx,H-2*my);g.beginPath();g.moveTo(W/2,my);g.lineTo(W/2,H-my);g.stroke();
  for(const soft of[true,false]){
    paint(soft?.15:.95,soft?10:line);g.beginPath();g.arc(W/2,H/2,84,0,TAU);g.stroke();
    for(const side of[-1,1]){
      const gx=side<0?mx:W-mx,px=side<0?mx:W-mx-170,sx=side<0?mx:W-mx-66;
      g.strokeRect(px,H/2-128,170,256);g.strokeRect(sx,H/2-57,66,114);
      g.beginPath();g.arc(gx+side*111,H/2,3.8,0,TAU);g.fillStyle=`rgba(248,250,244,${soft?.15:.95})`;g.fill();
      g.beginPath();g.arc(gx+side*111,H/2,58,side<0?-1.05:Math.PI-1.05,side<0?1.05:Math.PI+1.05);g.stroke();
    }
  }
  g.beginPath();g.arc(W/2,H/2,4,0,TAU);g.fillStyle='rgba(248,250,244,.96)';g.fill();
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());
  const bumpTex=new THREE.CanvasTexture(bump);bumpTex.anisotropy=tex.anisotropy;
  return new THREE.MeshStandardMaterial({map:tex,bumpMap:bumpTex,bumpScale:.032,roughness:.82,metalness:0,color:0xffffff,envMapIntensity:.28});
}
const sofiPitchMat=makeSoFiPitchMaterial();

/* Pass 21 — MetLife gets a championship surface with cool broadcast highlights. */
function makeMetLifePitchMaterial(){
  const W=1024,H=624,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const g=cv.getContext('2d'),bump=document.createElement('canvas');bump.width=W;bump.height=H;
  const bg=bump.getContext('2d');
  for(let i=0;i<24;i++){
    const x=i*W/24,w=W/24+1;
    const gr=g.createLinearGradient(x,0,x+w,0);
    const a=i%2?'#175833':'#1d673a',b=i%2?'#246f40':'#195d35';
    gr.addColorStop(0,a);gr.addColorStop(.5,b);gr.addColorStop(1,a);
    g.fillStyle=gr;g.fillRect(x,0,w,H);
  }
  /* premium close-cut grain and a slight damp night sheen */
  for(let i=0;i<30000;i++){
    const x=hash2(i,401)*W,y=hash2(i,409)*H;
    g.strokeStyle=hash2(i,419)>.5?'rgba(189,231,192,.047)':'rgba(3,31,16,.075)';
    g.lineWidth=.55;g.beginPath();g.moveTo(x,y);g.lineTo(x+.7,y+(hash2(i,421)-.5)*2.4);g.stroke();
    const v=116+Math.floor(hash2(i,431)*76);bg.fillStyle=`rgb(${v},${v},${v})`;bg.fillRect(x,y,1,1);
  }
  const cool=g.createLinearGradient(0,0,W,H);
  cool.addColorStop(0,'rgba(74,121,190,.035)');cool.addColorStop(.48,'rgba(0,0,0,0)');cool.addColorStop(1,'rgba(255,205,91,.03)');
  g.fillStyle=cool;g.fillRect(0,0,W,H);
  const mx=47,my=44,line=5;
  function paint(a,w){g.strokeStyle=`rgba(249,250,244,${a})`;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';}
  paint(.17,11);g.strokeRect(mx,my,W-2*mx,H-2*my);g.beginPath();g.moveTo(W/2,my);g.lineTo(W/2,H-my);g.stroke();
  paint(.96,line);g.strokeRect(mx,my,W-2*mx,H-2*my);g.beginPath();g.moveTo(W/2,my);g.lineTo(W/2,H-my);g.stroke();
  for(const soft of[true,false]){
    paint(soft?.16:.96,soft?10:line);g.beginPath();g.arc(W/2,H/2,84,0,TAU);g.stroke();
    for(const side of[-1,1]){
      const gx=side<0?mx:W-mx,px=side<0?mx:W-mx-170,sx=side<0?mx:W-mx-66;
      g.strokeRect(px,H/2-128,170,256);g.strokeRect(sx,H/2-57,66,114);
      g.beginPath();g.arc(gx+side*111,H/2,3.8,0,TAU);g.fillStyle=`rgba(249,250,244,${soft?.16:.96})`;g.fill();
      g.beginPath();g.arc(gx+side*111,H/2,58,side<0?-1.05:Math.PI-1.05,side<0?1.05:Math.PI+1.05);g.stroke();
    }
  }
  g.beginPath();g.arc(W/2,H/2,4,0,TAU);g.fillStyle='rgba(249,250,244,.97)';g.fill();
  /* final-night center medallion: subtle enough to still read as real turf */
  g.save();g.translate(W/2,H/2);g.strokeStyle='rgba(255,216,116,.2)';g.lineWidth=8;g.beginPath();g.arc(0,0,62,0,TAU);g.stroke();
  g.fillStyle='rgba(255,235,178,.14)';g.font='900 24px "Segoe UI",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('THE FINAL',0,4);g.restore();
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy());
  const bumpTex=new THREE.CanvasTexture(bump);bumpTex.anisotropy=tex.anisotropy;
  return new THREE.MeshPhysicalMaterial({map:tex,bumpMap:bumpTex,bumpScale:.034,roughness:.76,metalness:0,clearcoat:.035,clearcoatRoughness:.78,color:0xffffff,envMapIntensity:.34});
}
const metlifePitchMat=makeMetLifePitchMaterial();

/* Pass 22 — Dallas uses a crisp indoor broadcast surface with a cool roof sheen. */
const dallasPitchMat=metlifePitchMat.clone();
dallasPitchMat.color=new THREE.Color(0xeaf3ee);
dallasPitchMat.roughness=.69;
dallasPitchMat.clearcoat=.055;
dallasPitchMat.envMapIntensity=.42;
const miamiPitchMat=sofiPitchMat.clone();
miamiPitchMat.color=new THREE.Color(0xe8fff2);
miamiPitchMat.roughness=.78;
miamiPitchMat.envMapIntensity=.36;
const seattlePitchMat=metlifePitchMat.clone();
seattlePitchMat.color=new THREE.Color(0xddeee5);
seattlePitchMat.roughness=.58;
seattlePitchMat.clearcoat=.12;
seattlePitchMat.clearcoatRoughness=.48;
seattlePitchMat.envMapIntensity=.5;

/* ---------------- plaque texture ---------------- */
function makePlaqueTex(city){
  const cv=document.createElement('canvas');cv.width=512;cv.height=340;
  const g=cv.getContext('2d');
  g.fillStyle='#101a3d';g.fillRect(0,0,512,340);
  g.strokeStyle='#e8b84b';g.lineWidth=6;g.strokeRect(12,12,488,316);
  g.strokeStyle='rgba(232,184,75,.4)';g.lineWidth=2;g.strokeRect(22,22,468,296);
  g.fillStyle='#e8b84b';g.font='700 15px "Segoe UI",sans-serif';g.textAlign='center';
  g.fillText('C O N T I N E N T A L   ’26',256,52);
  g.fillStyle='#ffffff';g.font='800 34px "Segoe UI",sans-serif';
  g.fillText(city.stadium.toUpperCase(),256,102);
  g.fillStyle='#aab6e6';g.font='600 20px "Segoe UI",sans-serif';
  g.fillText(city.name,256,134);
  g.strokeStyle='#e8b84b';g.beginPath();g.moveTo(150,152);g.lineTo(362,152);g.stroke();
  g.fillStyle='#e8d9ae';g.font='500 21px Georgia,serif';
  city.rounds.forEach((r,i)=>g.fillText(r,256,190+i*34));
  if(city.ko==='F'){g.fillStyle='#ffd97a';g.font='700 16px "Segoe UI",sans-serif';g.fillText('★  ★  ★',256,316);}
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}

/* ---------------- text texture helper (signs) ---------------- */
function textTex(text,fg,bg,font,w=512,h=128){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const g=cv.getContext('2d');
  if(bg){g.fillStyle=bg;g.fillRect(0,0,w,h);}
  g.fillStyle=fg;g.font=font||('900 '+(h*.62|0)+'px "Segoe UI",sans-serif');
  g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}

/* ---------------- particles (gated by camera distance) ---------------- */
const dotTex=softTex(64,'rgba(255,255,255,1)','rgba(255,255,255,0)');
function makeParticles(n,color,size,opacity,additive){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  const m=new THREE.PointsMaterial({color,size,map:dotTex,transparent:true,opacity,
    depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});
  const p=new THREE.Points(g,m);p.frustumCulled=false;return p;
}
/* rain / smoke / fountain / confetti updaters register into particleSys:
   {mesh, ax,az, r:activeRadius, u:(t,dt)=>{}} */
/* ============================================================
   STADIUMS — sixteen silhouettes
   Builders work in stadium-local coords (rotated later by city.rot).
   ============================================================ */
function defaultBowl(){return{rx0:40,rz0:26,rows:12,dr:1.7,dy:1.28,y0:2.0,pitchY:0,
  rOutX:63,rOutZ:49,colors:[0x3f7fd9,0xd94f54,0xe8e6df],pylons:true,rim:false};}

function tier(B,color,rBot,rTop,h,y0,squish,rSeg=24){
  const g=new THREE.CylinderGeometry(rTop,rBot,h,rSeg,1,true);
  B.add(g,color,0,y0+h/2,0,0,1,1,squish);
}
function makeCanopy(w,d,seg,fn,clipEllipse){
  const g=new THREE.PlaneGeometry(w,d,seg,seg);
  g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    let x=p.getX(i),z=p.getZ(i);
    if(clipEllipse){
      const r=Math.sqrt((2*x/w)*(2*x/w)+(2*z/d)*(2*z/d));
      if(r>1){x/=r;z/=r;p.setX(i,x);p.setZ(i,z);}
    }
    p.setY(i,fn(x/w,z/d));
  }
  g.computeVertexNormals();
  return g;
}
function arcBeam(B,color,x1,x2,z,yBase,hApex,n,thick){
  for(let i=0;i<n;i++){
    const t0=i/n,t1=(i+1)/n;
    const xa=lerp(x1,x2,t0),xb=lerp(x1,x2,t1);
    const ya=yBase+hApex*Math.sin(t0*Math.PI),yb=yBase+hApex*Math.sin(t1*Math.PI);
    const mx=(xa+xb)/2,my=(ya+yb)/2,len=Math.hypot(xb-xa,yb-ya);
    const ang=Math.atan2(yb-ya,xb-xa);
    B.add(PRIM.box,color,mx,my,z,0,len*1.06,thick,thick,0,ang);
  }
}
function ellipsePerim(a,b){return Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)));}

const STADIUM_BUILDERS={
/* ---- Estadio Azteca: brutalist concrete tiers, cantilevered roof ring ---- */
mex(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0xf2c744,0x2b56a4,0xd94f54];b.pylons=false;b.rim=true;
  b.rOutX=70;b.rOutZ=55;
  const conc=0x99907f,dark=0x82796b;
  tier(S.O,conc,62,66,12,0,.78);
  tier(S.O,conc,66,71,11,12,.78);
  tier(S.O,dark,71,75,11,23,.78);
  /* cantilevered roof ring, sloping inward */
  {const g=new THREE.CylinderGeometry(60,80,6,24,1,true);S.O.add(g,0x8a8173,0,37,0,0,1,1,.8);}
  /* buttress fins */
  for(let i=0;i<18;i++){
    const a=i/18*TAU,x=Math.cos(a)*72,z=Math.sin(a)*57;
    S.O.add(PRIM.box,0x8d8476,x,14,z,-a,10,28,2.6);
  }
  /* dark window band */
  tier(S.G,0x223047,66.5,66.5,4,13,.78);
},
/* ---- Estadio Akron: volcanic grass berm, tilted white roof ring ---- */
gdl(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0xd94f54,0xe8e6df,0x1a1a1a];b.pylons=false;b.rim=true;
  b.rOutX=80;b.rOutZ=64;
  tier(S.O,0x7fa050,84,58,16,0,.8,28);   /* the berm */
  tier(S.O,0xe9e7e0,58,60,8,16,.8);
  /* tilted floating roof ring */
  {const g=new THREE.CylinderGeometry(46,64,3.5,24,1,true);
   S.O.add(g,0xf2f2ee,0,33,0,0,1,1,.8,0.10);}
  for(let i=0;i<12;i++){const a=i/12*TAU;
    S.O.add(PRIM.cyl,0xdad8d0,Math.cos(a)*58,24,Math.sin(a)*46,0,1.4,17,1.4,0.12*Math.sin(a),0.12*Math.cos(a));}
},
/* ---- Estadio BBVA: swooping aluminum roof, open end framing the saddle ---- */
mty(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0x2456a8,0xe8e6df,0xf2c744];b.pylons=false;b.rim=true;
  b.rOutX=68;b.rOutZ=52;
  tier(S.O,0xb9bdc4,60,66,14,0,.78);
  tier(S.G,0x2a3850,62,62,5,5,.78);
  /* swooping aluminum roof: rises toward -x, opens toward the saddle at +x */
  /* high crest at -x, long swoop diving toward the saddle view at +x */
  const roof=makeCanopy(138,116,18,(u,v)=>
    30+20*(.5-u)-16*Math.abs(v)-(u>.2?(u-.2)*60:0),true);
  S.O.add(roof,0xd7dbe0,-6,0,0);
  for(let i=0;i<7;i++){const x=-62+i*14;
    S.O.add(PRIM.cyl,0xc8ccd2,x,17,-52,0,1.6,34,1.6,0.25);
    S.O.add(PRIM.cyl,0xc8ccd2,x,17,52,0,1.6,34,1.6,-0.25);}
},
/* ---- SoFi: layered ETFE canopy, structural ribs, and suspended Oculus ---- */
la(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0xf2c744,0x22347a,0xe8e6df];b.pitchY=-6;b.y0=-3.5;b.pylons=false;b.rim=true;
  b.rOutX=82;b.rOutZ=65;
  tier(S.O,0xe8e9ea,64,69,10,0,.8);
  tier(S.G,0x2a4058,66,66,4,4,.8);
  /* two translucent skins make the roof read as a real layered membrane. */
  const roofFn=(u,v)=>{const r=Math.sqrt(u*u*4+v*v*4);return 27+16*Math.cos(clamp(r,0,1)*Math.PI*.5)+9*Math.sin((u+.5)*Math.PI)-6*u;};
  const shell=makeCanopy(174,138,26,roofFn,true);S.G.add(shell,0xdfeef7,0,0,0);
  const upper=makeCanopy(168,132,24,(u,v)=>roofFn(u,v)+1.15+.65*Math.cos((u-v)*Math.PI),true);S.G.add(upper,0xf1f8fb,0,0,0);
  /* perimeter compression ring and radial roof ribs. */
  for(let i=0;i<32;i++){
    const a0=i/32*TAU,a1=(i+1)/32*TAU;
    const x0=Math.cos(a0)*83,z0=Math.sin(a0)*65,x1=Math.cos(a1)*83,z1=Math.sin(a1)*65;
    const mx=(x0+x1)/2,mz=(z0+z1)/2,len=Math.hypot(x1-x0,z1-z0),ry=-Math.atan2(z1-z0,x1-x0);
    S.O.add(PRIM.box,0xf3f4f4,mx,24.5,mz,ry,len*1.04,.72,.72);
    if(i%2===0){
      const ix=Math.cos((a0+a1)/2)*31,iz=Math.sin((a0+a1)/2)*23;
      const dx=mx-ix,dz=mz-iz,rl=Math.hypot(dx,dz),rr=-Math.atan2(dz,dx);
      S.O.add(PRIM.box,0xd7dce0,(mx+ix)/2,27.5,(mz+iz)/2,rr,rl,.38,.52,0,-.08*Math.sin((a0+a1)/2));
    }
  }
  /* more, thinner columns improve scale and keep the canopy visually airborne. */
  for(let i=0;i<24;i++){
    const a=i/24*TAU,x=Math.cos(a)*77,z=Math.sin(a)*61;
    S.O.add(PRIM.cyl,0xf4f4f2,x,14,z,0,.78,29,.78,-0.16*Math.sin(a),0.16*Math.cos(a));
  }
  /* the suspended Oculus: catwalk, twin rings, and individual screen tiles. */
  {const cat=new THREE.TorusGeometry(26.5,.38,5,48);cat.rotateX(Math.PI/2);S.O.add(cat,0x4e5968,0,18,0,0,1,1,.68);
   const r1=new THREE.TorusGeometry(24.5,1.15,8,48);r1.rotateX(Math.PI/2);S.E.add(r1,0x9fe9ff,0,17.1,0,0,1,1,.68);
   const r2=new THREE.TorusGeometry(21.7,.6,6,48);r2.rotateX(Math.PI/2);S.E.add(r2,0xffd97a,0,15.8,0,0,1,1,.68);
   for(let i=0;i<40;i++){
     const a=i/40*TAU,x=Math.cos(a)*23.1,z=Math.sin(a)*15.7,ry=-a-Math.PI/2;
     S.E.add(PRIM.box,i%5===0?0xffd97a:0x83dcff,x,16.6,z,ry,3.25,1.55,.16);
   }
  }
  /* field-level LED boards and camera gantries. */
  for(const z of[-27,27])for(let x=-42;x<=42;x+=12)S.E.add(PRIM.box,(x/12)%2?0x7fd8ff:0xffd97a,x,-4.4,z,0,10,.42,.18);
  for(const x of[-48,48])S.O.add(PRIM.box,0x202936,x,5,0,0,2,15,4);
},
/* ---- Levi's: open bowl, suite tower with rooftop deck ---- */
sf(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0xb03040,0xd8b25a,0xe8e6df];b.pylons=true;
  b.rOutX=64;b.rOutZ=50;
  tier(S.O,0xc9c5bc,58,63,13,0,.78);
  /* suite tower along -z side */
  S.O.add(PRIM.box,0xe9e7e2,0,15,-56,0,92,30,14);
  S.G.add(PRIM.box,0x39506b,0,15,-49.5,0,88,24,2);
  S.O.add(PRIM.box,0xf4f4f0,0,31.5,-56,0,98,2.5,20);      /* roof deck  */
  S.O.add(PRIM.box,0x6f9a4e,0,33.5,-60,0,90,1.5,7);       /* green roof */
  for(let i=0;i<7;i++)S.O.add(PRIM.cyl,0xd8d8d2,-42+i*14,15,-47,0,1.2,30,1.2);
},
/* ---- Lumen Field: twin arched roofs, open middle ---- */
sea(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0x1d3f6e,0x3fa66a,0xe8e6df];b.pylons=false;b.rim=true;
  b.rOutX=68;b.rOutZ=54;
  tier(S.O,0xb6bcc2,58,64,13,0,.78);
  for(const sz of[-1,1]){
    const roof=makeCanopy(150,32,14,(u)=>20+21*Math.cos(u*Math.PI*.92));
    S.O.add(roof,0xdde1e4,0,0,sz*40);
    arcBeam(S.O,0x9aa2ab,-74,74,sz*26,18,23,12,1.6);
    for(let i=0;i<6;i++){const x=-65+i*26;
      S.O.add(PRIM.cyl,0xa8afb6,x,10,sz*52,0,1.6,20,1.6);}
  }
  S.O.add(PRIM.box,0x8e969e,-80,24,0,0,7,48,7);  /* north tower */
  S.E.add(PRIM.box,0x9fd8ff,-80,45,0,0,7.6,3,7.6);
  /* Pass 24: exposed steel rhythm, glass concourses, and supporter light. */
  for(const sz of[-1,1])for(let x=-60;x<=60;x+=15){
    S.O.add(PRIM.box,0x69747d,x,13,sz*54,0,1.05,24,2.2,0,0,(x/60)*.08);
    S.E.add(PRIM.box,(Math.round(x/15)&1)?0x5acb5a:0x68b8ff,x,8,sz*55.2,0,.16,8,.16);
  }
  S.G.add(PRIM.box,0x7897a8,72,14,0,0,2.4,24,62);
  S.G.add(PRIM.box,0x7897a8,-72,14,0,0,2.4,24,62);
  for(const sz of[-1,1])S.E.add(PRIM.box,0xb9e7ff,0,39,sz*39.2,0,118,.16,.18);
},
/* ---- BC Place: white dome with a crown of masts ---- */
van(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0x2456a8,0xe8e6df,0x77c4e8];b.pylons=false;b.rim=true;
  b.rOutX=72;b.rOutZ=58;
  tier(S.O,0xc9cdd2,62,68,15,0,.8);
  tier(S.G,0x27354e,64,64,5,4,.8);
  /* the white cap */
  {const g=new THREE.SphereGeometry(66,20,10,0,TAU,0,Math.PI*.32);
   S.O.add(g,0xf4f6f8,0,-32,0,0,1,1.05,.8);}
  /* crown of masts and cables */
  for(let i=0;i<18;i++){
    const a=i/18*TAU,x=Math.cos(a)*70,z=Math.sin(a)*56;
    S.O.add(PRIM.cyl,0xf8f9fa,x*1.02,24,z*1.02,0,1,26,1,-0.3*Math.sin(a),0.3*Math.cos(a));
    /* cable from mast tip toward crown center */
    const tx=x*1.02-Math.sin(a)*0,tipY=37,ty=tipY;
    const cx=(x*1.02+0)/2,cy=(ty+30)/2,cz=(z*1.02+0)/2;
    const len=Math.hypot(x*1.02,ty-30,z*1.02);
    const yaw=Math.atan2(-(z*1.02),-(x*1.02));
    const pitch=Math.atan2(ty-30,Math.hypot(x*1.02,z*1.02));
    S.O.add(PRIM.tube,0xe8ecef,cx,cy,cz,yaw,len,0.3,0.3,0,pitch);
  }
  S.E.add(PRIM.sph,0xbfe8ff,0,31,0,0,4,4,4);
},
/* ---- Arrowhead: scalloped upper bowl ---- */
kc(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0xc42e3a,0xc42e3a,0xf2c744];b.pylons=true;
  b.rOutX=66;b.rOutZ=52;
  tier(S.O,0xb8b0a6,56,62,12,0,.78);
  /* scalloped rim: 48 segments rising and falling in 8 waves */
  for(let i=0;i<48;i++){
    const a=i/48*TAU,x=Math.cos(a)*63,z=Math.sin(a)*49.5;
    const h=7+6*Math.abs(Math.sin(a*4));
    S.O.add(PRIM.box,0xe2ddd3,x,12+h/2,z,-a+Math.PI/2,8.6,h,2.4);
  }
},
/* ---- AT&T Stadium: monumental arches over a glass hall ---- */
dal(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0x22347a,0xc0c6ce,0xe8e6df];b.pylons=false;b.rim=true;
  b.rOutX=80;b.rOutZ=62;
  tier(S.O,0xcfd3d8,66,72,20,0,.78);
  tier(S.G,0x3a4c66,68,70,12,4,.78);
  /* roof shell */
  const roof=makeCanopy(158,124,14,(u,v)=>24+10*Math.cos(u*Math.PI)*Math.cos(v*Math.PI*.8),true);
  S.O.add(roof,0xdce0e4,0,0,0);
  /* the two great arches */
  arcBeam(S.O,0xc8cdd3,-88,88,-16,2,66,18,3.4);
  arcBeam(S.O,0xc8cdd3,-88,88,16,2,66,18,3.4);
  /* glass end walls */
  S.G.add(PRIM.box,0x9fc4dd,-76,15,0,0,3,28,84);
  S.G.add(PRIM.box,0x9fc4dd,76,15,0,0,3,28,84);
  /* Pass 22: layered silver facade, giant end portals, and structural scale. */
  for(const sx of[-1,1]){
    for(let z=-45;z<=45;z+=9)S.O.add(PRIM.box,0x8e979f,sx*78,15,z,0,2.2,27,1.05);
    S.O.add(PRIM.box,0x1b2e55,sx*79.4,13,0,0,.8,17,38);
    S.E.add(PRIM.box,0x7fd8ff,sx*79.9,21,0,0,.16,.18,34);
  }
  for(const sz of[-1,1]){
    for(let x=-62;x<=62;x+=12)S.O.add(PRIM.box,0xaab1b8,x,14,sz*59,0,1.15,24,2.1);
    S.O.add(PRIM.box,0x202f49,0,10,sz*60.3,0,50,14,.8);
  }
  /* arch crowns remain readable from the Grand Circuit. */
  for(const x of[-62,-42,-22,0,22,42,62])S.E.add(PRIM.box,0xd8eeff,x,41,-16,0,7,.16,.22);
},
/* ---- NRG: crisp white box, split retractable roof ---- */
hou(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0x1d3f6e,0xc42e3a,0xe8e6df];b.pylons=false;b.rim=true;
  b.rOutX=70;b.rOutZ=56;
  S.O.add(PRIM.box,0xe6e8ea,0,11,0,0,132,22,102);
  S.G.add(PRIM.box,0x35507a,0,11,-52,0,110,14,3);
  S.O.add(PRIM.box,0xd6dade,-33,24,0,0,62,3,104);   /* split roof halves */
  S.O.add(PRIM.box,0xd6dade,33,24,0,0,62,3,104);
  S.O.add(PRIM.box,0xaab2ba,0,26,-51,0,140,2.2,3);  /* rails */
  S.O.add(PRIM.box,0xaab2ba,0,26,51,0,140,2.2,3);
  for(const sx of[-1,1])for(const sz of[-1,1])
    S.O.add(PRIM.cyl,0xcdd2d6,sx*62,11,sz*47,0,6,22,6);
},
/* ---- Mercedes-Benz: pinwheel petal roof ---- */
atl(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0xc42e3a,0x1a1a1a,0xe8e6df];b.pylons=false;b.rim=true;
  b.rOutX=72;b.rOutZ=60;
  for(let i=0;i<8;i++){
    const a=i/8*TAU,x=Math.cos(a)*58,z=Math.sin(a)*50;
    S.O.add(PRIM.box,0x53555c,x,13,z,-a+Math.PI/2,52,26,3);
    S.G.add(PRIM.box,0x2c3a52,x*.94,13,z*.94,-a+Math.PI/2,44,18,1.6);
  }
  /* petals */
  for(let i=0;i<8;i++){
    const a=i/8*TAU+0.18,x=Math.cos(a)*30,z=Math.sin(a)*27;
    S.O.add(PRIM.box,0xb9c0c9,x,28+((i%2)?1.2:0),z,-a+0.42,48,1.8,20,0,0.10);
  }
  /* halo ring board */
  {const g=new THREE.TorusGeometry(20,1.6,6,28);g.rotateX(Math.PI/2);
   S.E.add(g,0xffe9a8,0,22,0);}
},
/* ---- Hard Rock: floating flat canopy on slender pylons ---- */
mia(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0x0aa7a0,0xf2632f,0xe8e6df];b.pylons=false;b.rim=true;
  b.rOutX=70;b.rOutZ=56;
  tier(S.O,0xdad7ce,58,64,14,0,.78);
  /* flat rectangular canopy with an open middle */
  const cw=150,cd=118,hw=88,hd=56,cy=32;
  S.O.add(PRIM.box,0xe4e7e9,0,cy,-(hd/2+(cd-hd)/4),0,cw,2.6,(cd-hd)/2);
  S.O.add(PRIM.box,0xe4e7e9,0,cy, (hd/2+(cd-hd)/4),0,cw,2.6,(cd-hd)/2);
  S.O.add(PRIM.box,0xe4e7e9,-(hw/2+(cw-hw)/4),cy,0,0,(cw-hw)/2,2.6,hd);
  S.O.add(PRIM.box,0xe4e7e9, (hw/2+(cw-hw)/4),cy,0,0,(cw-hw)/2,2.6,hd);
  for(const sx of[-1,1])for(const sz of[-1,1]){
    S.O.add(PRIM.cyl,0xf2f3f4,sx*66,cy/2,sz*50,0,2.4,cy,2.4,0.12*sz,-0.12*sx);
    S.O.add(PRIM.cyl,0xf2f3f4,sx*52,cy/2,sz*54,0,2.4,cy,2.4,0.12*sz,-0.12*sx);
  }
  S.E.add(PRIM.box,0x35e0d2,0,cy-1.6,-hd/2,0,hw,0.7,0.7);  /* aqua trim  */
  S.E.add(PRIM.box,0x35e0d2,0,cy-1.6, hd/2,0,hw,0.7,0.7);
  /* Pass 23: coral counter-light, canopy fins, and open-air festival scale. */
  S.E.add(PRIM.box,0xff6f91,0,cy-2.35,-hd/2-.25,0,hw*.72,.18,.2);
  S.E.add(PRIM.box,0xff6f91,0,cy-2.35, hd/2+.25,0,hw*.72,.18,.2);
  for(const sx of[-1,1])for(let z=-42;z<=42;z+=12){
    S.O.add(PRIM.box,0xd9dedf,sx*71,16,z,0,1.15,27,3.2,0,0,sx*.055);
    S.E.add(PRIM.box,(Math.round(z/12)&1)?0x35e0d2:0xff6f91,sx*72,10,z,0,.16,9,.18);
  }
  for(let x=-56;x<=56;x+=14)S.E.add(PRIM.box,(x/14)%2?0x35e0d2:0xff6f91,x,cy-.22,-58.7,0,7,.15,.16);
},
/* ---- BMO Field: intimate, two roofed stands ---- */
tor(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.rows=8;b.colors=[0xb02532,0x8a8d93,0xe8e6df];b.pylons=true;
  b.rOutX=58;b.rOutZ=44;
  tier(S.O,0xc3c0b9,50,55,9,0,.76);
  for(const sz of[-1,1]){
    S.O.add(PRIM.box,0xd9dcdf,0,20,sz*38,0,104,1.8,20,0,0,sz*0.06);
    for(let i=0;i<6;i++)S.O.add(PRIM.cyl,0xa9adb2,-45+i*18,10,sz*45,0,1.3,20,1.3);
  }
},
/* ---- Gillette: the lighthouse and the bridge ---- */
bos(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0x1d3f6e,0xc0c6ce,0xc42e3a];b.pylons=true;
  b.rOutX=64;b.rOutZ=50;
  tier(S.O,0xc6c9cd,56,62,13,0,.78);
  /* lighthouse at the open north end */
  S.O.add(PRIM.cyl,0xf1f2f3,-58,17,0,0,9,34,9);
  S.G.add(PRIM.cyl,0x9fc4dd,-58,36,0,0,7,5,7);
  S.O.add(PRIM.cone,0xb02532,-58,41.5,0,0,8,5,8);
  S.E.add(PRIM.sph,0xfff2b8,-58,36,0,0,3,3,3);
  /* pedestrian bridge */
  arcBeam(S.O,0xd8d8d4,-84,-34,14,10,10,8,2);
  S.O.add(PRIM.box,0xcfcfc9,-59,10,14,0,50,1.4,6);
},
/* ---- Lincoln Financial: crescent wings and X braces ---- */
phi(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.colors=[0x0c4433,0x9aa2ab,0xe8e6df];b.pylons=true;
  b.rOutX=66;b.rOutZ=52;
  tier(S.O,0xb4b8bd,58,63,13,0,.78);
  for(const sz of[-1,1]){
    const wing=makeCanopy(120,26,12,(u)=>17+9*Math.cos(u*Math.PI*.9));
    S.O.add(wing,0xd4d8db,0,0,sz*38);
  }
  for(const sx of[-1,1])for(const sz of[-1,1]){
    const x=sx*58,z=sz*44;
    S.O.add(PRIM.box,0x6a7078,x,11,z,0,2.2,26,2.2,0,sx*sz*0.5);
    S.O.add(PRIM.box,0x6a7078,x,11,z,0,2.2,26,2.2,0,-sx*sz*0.5);
  }
},
/* ---- MetLife: the grand grey drum, home of the final ---- */
ny(ctx){
  const S=ctx.S,b=ctx.bowl=defaultBowl();
  b.rows=14;b.colors=[0x274468,0x3e6a4e,0xe8e6df];b.pylons=false;b.rim=true;
  b.rOutX=78;b.rOutZ=62;b.rx0=42;b.rz0=28;
  tier(S.O,0xb7bac0,66,74,24,0,.79);
  /* vertical aluminum louvers */
  for(let i=0;i<44;i++){
    const a=i/44*TAU,x=Math.cos(a)*73,z=Math.sin(a)*57.7;
    S.O.add(PRIM.box,0xd9dce0,x,12.5,z,-a+Math.PI/2+.35,5.4,25,0.9);
  }
  tier(S.G,0x2c3c58,69,72,7,5,.79);
  /* layered championship crown and facade lighting */
  {const g=new THREE.TorusGeometry(70,0.9,6,64);g.rotateX(Math.PI/2);
   S.E.add(g,0xffd97a,0,24.6,0,0,1,1,.79);}
  {const g=new THREE.TorusGeometry(74.6,0.42,5,64);g.rotateX(Math.PI/2);
   S.E.add(g,0x7fd8ff,0,20.9,0,0,1,1,.79);}
  /* four substantial corner towers prevent the bowl reading as a simple cylinder */
  for(const sx of[-1,1])for(const sz of[-1,1]){
    S.O.add(PRIM.box,0xaeb3ba,sx*61,13,sz*47,0,8.5,26,8.5);
    S.O.add(PRIM.box,0x424a56,sx*61,13,sz*51.5,0,5.4,20,.9);
    S.G.add(PRIM.box,0x7893ad,sx*61,14.5,sz*52.05,0,3.9,13.2,.18);
    S.E.add(PRIM.box,(sx===sz?0xffd97a:0x7fd8ff),sx*61,23.4,sz*52.2,0,4.6,.24,.2);
  }
  /* horizontal datum bands and diagonal bracing give the skin believable depth */
  for(const y of[6.2,12.5,18.8])for(const sz of[-1,1])
    S.O.add(PRIM.box,0xc8ccd1,0,y,sz*58.1,0,133,.55,.72);
  for(const sx of[-1,1])for(let i=-4;i<=4;i++){
    const z=i*10.5;
    S.O.add(PRIM.box,0x7f8792,sx*72.2,12.3,z,0,.55,18,.65,0,sx*(i%2?.27:-.27));
  }
},
};
/* ---------------- interior bowl: seats, pitch, gate, plaque ---------------- */
const seatGeo=new THREE.BoxGeometry(.78,.6,.68);
const fanGeo=(()=>{
  const torso=new THREE.BoxGeometry(.5,.6,.34);torso.translate(0,.3,0);
  const head=new THREE.SphereGeometry(.17,6,5);head.translate(0,.72,0);
  return mergeGeometries([NI(torso),NI(head)],false);
})();

function makeTensionGoalNet(sign,pitchTop){
  const group=new THREE.Group();
  const pts=[];
  const gx=sign*25,back=gx+sign*1.45,z0=-4.1,z1=4.1,h=2.6;
  const seg=(a,b)=>pts.push(a.x,a.y,a.z,b.x,b.y,b.z);
  /* back mesh */
  for(let i=0;i<=10;i++){
    const z=lerp(z0,z1,i/10);seg({x:back,y:pitchTop,z},{x:back,y:pitchTop+h,z});
  }
  for(let j=0;j<=6;j++){
    const y=pitchTop+h*j/6;seg({x:back,y,z:z0},{x:back,y,z:z1});
  }
  /* roof and side tension lines */
  for(let i=0;i<=10;i++){
    const z=lerp(z0,z1,i/10);seg({x:gx,y:pitchTop+h,z},{x:back,y:pitchTop+h,z});
  }
  for(const z of[z0,z1]){
    for(let j=0;j<=6;j++){
      const y=pitchTop+h*j/6;seg({x:gx,y,z},{x:back,y,z});
    }
    for(let i=0;i<=4;i++){
      const x=lerp(gx,back,i/4);seg({x,y:pitchTop,z},{x,y:pitchTop+h,z});
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xf3f6f7,transparent:true,opacity:.54,depthWrite:false}));
  line.renderOrder=2;group.add(line);return group;
}

function buildBowlInterior(ctx,sGroup){
  const b=ctx.bowl,S=ctx.S,city=ctx.city;
  const topR=b.rx0+b.rows*b.dr,topRz=b.rz0+b.rows*b.dr,topY=b.y0+b.rows*b.dy;
  /* plaza paving grounds the stadium: light apron with a darker contact ring */
  S.O.add(PRIM.disc,0xc4bdad,0,.07,0,0,(b.rOutX+30)*2,.14,(b.rOutZ+30)*2);
  S.O.add(PRIM.disc,0x9d968a,0,.10,0,0,(b.rOutX+7)*2,.14,(b.rOutZ+7)*2);
  /* soft light cone over the bowl, visible at night */
  {const g=new THREE.CylinderGeometry(7,b.rx0*.92,topY+26,18,1,true);
   S.E.add(g,0x161c22,0,(topY+26)/2+1,0,0,1,1,b.rz0/b.rx0);}
  /* concrete under-structure */
  {const g=new THREE.CylinderGeometry(topR,b.rx0,topY-b.pitchY,24,1,true);
   S.O.add(g,0x9a958c,0,b.pitchY+(topY-b.pitchY)/2,0,0,1,1,(topRz)/(topR));}
  /* concourse cap: closes the gap between bowl top and the outer wall */
  {const rg=new THREE.RingGeometry(topR-1,Math.max(b.rOutX,topR+2)+1,24);
   rg.rotateX(-Math.PI/2);
   const sq=((topRz-1)/(topR-1)+(b.rOutZ+1)/(b.rOutX+1))/2;
   S.O.add(rg,0xb3aea3,0,topY+.6,0,0,1,1,sq);}
  /* apron + pitch */
  S.O.add(PRIM.disc,0x3c7a40,0,b.pitchY,0,0,(b.rx0)*2,.3,(b.rz0)*2);
  const pm=new THREE.Mesh(pitchGeo,city.id==='mex'?aztecaPitchMat:(city.id==='la'?sofiPitchMat:(city.id==='ny'?metlifePitchMat:(city.id==='dal'?dallasPitchMat:(city.id==='mia'?miamiPitchMat:(city.id==='sea'?seattlePitchMat:pitchMat))))));
  pm.position.y=b.pitchY+.32;pm.receiveShadow=true;sGroup.add(pm);
  if(city.id==='mex'){
    /* walkout reveal: a quiet line of floor lights from tunnel to the pitch */
    for(let z=b.rz0+1;z>9;z-=2.15){
      for(const x of[-2.4,2.4])S.E.add(PRIM.box,0xffd97a,x,b.pitchY+.39,z,0,.13,.05,.88);
    }
    /* photography positions and broadcast carpet sell match-night scale */
    for(const x of[-18,-14,-10,-6,6,10,14,18]){
      S.O.add(PRIM.box,0x20242b,x,b.pitchY+.48,15.8,0,.9,.58,.75);
      S.G.add(PRIM.sph,0x5c6f80,x,b.pitchY+1.08,15.5,0,.35,.28,.45);
    }
    const rg=new THREE.RingGeometry(5.1,5.28,64);rg.rotateX(-Math.PI/2);
    S.E.add(rg,0xffd97a,18.2,b.pitchY+.37,0);
  }else if(city.id==='la'){
    /* SoFi walkout: cyan and gold runway lights mirror the exterior Neon Mile. */
    for(let z=b.rz0+2;z>8;z-=1.9){
      for(const x of[-2.8,2.8])S.E.add(PRIM.box,x<0?0x7fd8ff:0xffd97a,x,b.pitchY+.39,z,0,.12,.05,.72);
    }
    /* broadcast camera nests, sideline cable cams, and a clean premiere circle. */
    for(const x of[-20,-12,12,20]){
      S.O.add(PRIM.box,0x1c2430,x,b.pitchY+.52,16.2,0,1.15,.62,.82);
      S.G.add(PRIM.sph,0x627689,x,b.pitchY+1.18,15.8,0,.4,.3,.5);
    }
    for(const z of[-15.6,15.6])S.E.add(PRIM.box,z<0?0x7fd8ff:0xffd97a,0,b.pitchY+.43,z,0,48,.08,.12);
    const rg=new THREE.RingGeometry(4.9,5.08,64);rg.rotateX(-Math.PI/2);S.E.add(rg,0x7fd8ff,-18.2,b.pitchY+.37,0);
  }
  /* seats, and the crowd sitting in them */
  const mats=[],cols=[],fanMats=[],fanCols=[];
  const palette=b.colors.map(c=>new THREE.Color(c));
  const FANCOL=palette.concat([new THREE.Color(0xe8e2d4),new THREE.Color(0x3a3f48),new THREE.Color(0x8a5a44)]);
  for(let i=0;i<b.rows;i++){
    const a=b.rx0+i*b.dr,bz=b.rz0+i*b.dr,y=b.y0+i*b.dy;
    const per=ellipsePerim(a,bz),n=Math.max(24,Math.floor(per/1.06));
    for(let j=0;j<n;j++){
      const t=j/n*TAU;
      const x=Math.cos(t)*a,z=Math.sin(t)*bz;
      _e.set(0,-t+Math.PI/2+Math.PI,0);_q.setFromEuler(_e);
      _v3.set(x,y,z);_s3.set(1,1,1);
      _m4.compose(_v3,_q,_s3);mats.push(_m4.clone());
      const sector=Math.floor(t/TAU*10);
      let c=palette[sector%palette.length];
      if(hash2(i*57+j,city.x)<.06)c=palette[(sector+1)%palette.length];
      cols.push(c);
      /* a fan in roughly half the seats */
      if(hash2(j*3.1+i*7.7,city.x*1.3)<.48){
        _v3.set(x,y+.32,z);
        _m4.compose(_v3,_q,_s3);fanMats.push(_m4.clone());
        fanCols.push(FANCOL[Math.floor(hash2(j*1.7,i*5.1+city.z)*FANCOL.length)%FANCOL.length]);
      }
    }
  }
  const smat=MAT.seat.clone();smat.transparent=true;
  const im=new THREE.InstancedMesh(seatGeo,smat,mats.length);
  for(let i=0;i<mats.length;i++){im.setMatrixAt(i,mats[i]);im.setColorAt(i,cols[i]);}
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
  sGroup.add(im);
  ctx.seats=im;
  const fmat=MAT.seat.clone();fmat.transparent=true;
  const fim=new THREE.InstancedMesh(fanGeo,fmat,fanMats.length);
  for(let i=0;i<fanMats.length;i++){fim.setMatrixAt(i,fanMats[i]);fim.setColorAt(i,fanCols[i]);}
  fim.instanceMatrix.needsUpdate=true;if(fim.instanceColor)fim.instanceColor.needsUpdate=true;
  sGroup.add(fim);
  ctx.fans=fim;
  /* floodlights */
  if(b.pylons){
    for(const q of[[1,1],[1,-1],[-1,1],[-1,-1]]){
      const x=q[0]*(topR+8),z=q[1]*(topRz+6);
      S.O.add(PRIM.cyl,0xb9bdc2,x,topY/2+6,z,0,1.8,topY+12,1.8);
      S.O.add(PRIM.box,0x74797f,x,topY+14,z,Math.atan2(-z,-x),1.6,7,10);
      S.E.add(PRIM.box,0xdff2ff,x,topY+14,z,Math.atan2(-z,-x),2.0,6.4,9.4);
      ctx.flood.push([x,topY+14,z]);
    }
  }
  if(b.rim){
    const g=new THREE.TorusGeometry(topR-1,0.8,5,40);g.rotateX(Math.PI/2);
    S.E.add(g,0xdff2ff,0,topY+1.5,0,0,1,1,topRz/topR);
    ctx.flood.push([0,topY+2,0]);
  }
  /* arrival architecture: readable gate, security lanes, and a true threshold */
  const ez=b.rOutZ+9;
  S.O.add(PRIM.box,0x3f4751,-7.2,4.8,ez,0,2.2,10.5,2.2);
  S.O.add(PRIM.box,0x3f4751, 7.2,4.8,ez,0,2.2,10.5,2.2);
  S.O.add(PRIM.box,0x19253d, 0,10.2,ez,0,17,2.2,3.2);
  S.E.add(PRIM.box,0xffd98a,0,10.35,ez-1.68,0,15.8,.35,.12);
  S.G.add(PRIM.box,0x8fc0dc,0,8.8,ez-1.72,0,10.5,1.2,.09);
  /* turnstiles */
  for(const x of[-4.5,-1.5,1.5,4.5]){
    S.O.add(PRIM.cyl,0x8f99a4,x,1.2,ez+1,0,.35,2.2,.35);
    S.O.add(PRIM.box,0xd9dde2,x,1.65,ez+1,0,2.1,.12,.12,0,.55);
    S.E.add(PRIM.box,0x62d58a,x,2.28,ez+.65,0,.45,.16,.12);
  }
  /* security booths and queue rails */
  for(const x of[-9.4,9.4]){
    S.O.add(PRIM.box,0x27344a,x,1.55,ez+2.5,0,2.8,3.1,3.2);
    S.G.add(PRIM.box,0x8fc0dc,x,2.05,ez+.84,0,2.2,1.25,.08);
  }
  for(const x of[-6,-3,0,3,6])for(const z of[ez+5,ez+9])S.O.add(PRIM.cyl,0xaeb5bd,x,1,z,0,.1,2,.1);
  for(const z of[ez+5,ez+9])S.O.add(PRIM.box,0x8e98a4,0,1.25,z,0,13,.08,.08);
  /* broad arrival carpet with a gold center inlay */
  S.O.add(PRIM.box,0xa9a294,0,.2,ez+11,0,13,.5,26);
  S.E.add(PRIM.box,0xffd97a,0,.48,ez+11,0,.25,.04,24);
  /* signed player tunnel inside the bowl: exit is only active here */
  const ix=0,iz=b.rz0+4.6;
  S.O.add(PRIM.box,0x171c27,ix,b.pitchY+2.05,iz+1.4,0,9.2,4.1,4.8);
  S.O.add(PRIM.box,0x4d535c,ix-5.2,b.pitchY+2.1,iz+1.4,0,1.2,4.2,5);
  S.O.add(PRIM.box,0x4d535c,ix+5.2,b.pitchY+2.1,iz+1.4,0,1.2,4.2,5);
  S.E.add(PRIM.box,0xffd97a,ix,b.pitchY+4.45,iz-.95,0,8.8,.25,.12);
  for(const x of[-3,-1,1,3])S.E.add(PRIM.box,0xdff2ff,x,b.pitchY+3.55,iz+2.1,0,1.2,.08,.18);
  S.E.add(PRIM.disc,0x5c4a1e,ix,b.pitchY+.5,iz-.4,0,5.6,.08,5.6);
  ctx.insideExitLocal={x:ix,z:iz-.4};
  /* plaque on a stand */
  {
    const tex=makePlaqueTex(city);
    const pg=new THREE.PlaneGeometry(7.5,5);
    const pmst=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({map:tex}));
    pmst.position.set(11,3.6,ez+4.1);
    sGroup.add(pmst);
    S.O.add(PRIM.box,0x494540,11,1.5,ez+3.6,0,1,3,.6);
    S.O.add(PRIM.box,0x24304e,11,3.6,ez+3.8,0,8.1,5.6,.4);
  }
  /* readable exterior marquee */
  {
    const cv=document.createElement('canvas');cv.width=640;cv.height=180;const g=cv.getContext('2d');
    g.fillStyle='#0a132c';g.fillRect(0,0,640,180);g.strokeStyle='#e8b84b';g.lineWidth=6;g.strokeRect(8,8,624,164);
    g.fillStyle='#e8b84b';g.font='700 18px "Segoe UI",sans-serif';g.textAlign='center';g.fillText('WELCOME TO',320,43);
    g.fillStyle='#fff';g.font='800 40px "Segoe UI",sans-serif';g.fillText(city.stadium.toUpperCase(),320,98);
    g.fillStyle='#aebbe6';g.font='600 17px "Segoe UI",sans-serif';g.fillText('GATES OPEN  •  FOLLOW THE GOLD LINE',320,137);
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(12.8,3.6),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
    sign.position.set(0,10.2,b.rOutZ+7.28);sGroup.add(sign);
  }
  /* ---------- match-day dressing ---------- */
  const pitchTop=b.pitchY+.34;
  /* goals: posts, crossbar, wireframe net */
  ctx.nets=[];
  for(const s of[-1,1]){
    const gx=s*25;
    S.O.add(PRIM.cyl,0xf4f4f2,gx,pitchTop+1.3,-4.1,0,.26,2.6,.26);
    S.O.add(PRIM.cyl,0xf4f4f2,gx,pitchTop+1.3, 4.1,0,.26,2.6,.26);
    S.O.add(PRIM.box,0xf4f4f2,gx,pitchTop+2.62,0,0,.26,.24,8.5);
    const net=makeTensionGoalNet(s,pitchTop);
    sGroup.add(net);
    ctx.nets.push(net);
    /* shallow side nets */
    S.O.add(PRIM.box,0xdfe3e6,gx+s*.6,pitchTop+2.55,-4.1,0,1.3,.06,.06);
    S.O.add(PRIM.box,0xdfe3e6,gx+s*.6,pitchTop+2.55, 4.1,0,1.3,.06,.06);
  }
  /* corner flags */
  for(const cx of[-25,25])for(const cz of[-14.7,14.7]){
    S.O.add(PRIM.cyl,0xf0ede4,cx,pitchTop+.8,cz,0,.08,1.6,.08);
    S.O.add(PRIM.box,0xf2c744,cx+.45,pitchTop+1.45,cz,0,.85,.5,.06);
  }
  /* benches with roofs */
  for(const sx of[-1,1]){
    S.O.add(PRIM.box,0x3a4148,sx*9,pitchTop+.5,-17.6,0,8,.9,1.1);
    S.G.add(PRIM.box,0x9fc4dd,sx*9,pitchTop+2.2,-17.9,0,9,.18,2.2);
    S.O.add(PRIM.cyl,0x8a8e94,sx*9-4.2,pitchTop+1.2,-18.6,0,.14,2.2,.14);
    S.O.add(PRIM.cyl,0x8a8e94,sx*9+4.2,pitchTop+1.2,-18.6,0,.14,2.2,.14);
  }
  /* ad boards ringing the pitch */
  {
    const AD=[0xf0f0f0,0x0aa7a0,0xe8b84b,0x22347a];
    let bi=0;
    for(let x=-24;x<=24;x+=8)for(const sz of[-1,1]){
      S.O.add(PRIM.box,AD[bi++%4],x,pitchTop+.45,sz*16.2,0,7.4,.9,.22);
      S.E.add(PRIM.box,0x35424e,x,pitchTop+.95,sz*16.2,0,7.4,.1,.24);
    }
    for(let z=-12;z<=12;z+=8)for(const sx of[-1,1]){
      S.O.add(PRIM.box,AD[bi++%4],sx*28,pitchTop+.45,z,0,.22,.9,7.4);
      S.E.add(PRIM.box,0x35424e,sx*28,pitchTop+.95,z,0,.24,.1,7.4);
    }
  }
  /* broadcast cameras, stewards, ball racks, and a universal LED ribbon */
  for(const p of[[-12,-18],[12,-18],[-20,17],[20,17]]){
    S.O.add(PRIM.cyl,0x444a52,p[0],pitchTop+1.05,p[1],0,.12,2.1,.12);
    S.O.add(PRIM.box,0x222833,p[0],pitchTop+2.2,p[1],0,1.25,.75,.75);
    S.O.add(PRIM.cyl,0x59616a,p[0]-1,pitchTop+.62,p[1]-.6,0,.08,1.25,.08,0,0,.32);
    S.O.add(PRIM.cyl,0x59616a,p[0]+1,pitchTop+.62,p[1]-.6,0,.08,1.25,.08,0,0,-.32);
  }
  for(const p of[[-24,-10],[-24,10],[24,-10],[24,10],[-8,18],[8,18]]){
    S.O.add(PRIM.box,0xf1c84b,p[0],pitchTop+1.05,p[1],0,.72,1.25,.45);
    S.O.add(PRIM.sph,0xd6a884,p[0],pitchTop+1.95,p[1],0,.42,.42,.42);
    S.O.add(PRIM.box,0x20252c,p[0],pitchTop+.3,p[1],0,.64,.6,.38);
  }
  for(const x of[-5,-3.3,-1.6,0,1.6,3.3,5])S.O.add(PRIM.sph,0xf4f4f2,x,pitchTop+.5,18.1,0,.42,.42,.42);
  {const rg=new THREE.TorusGeometry(topR-2.2,.34,5,48);rg.rotateX(Math.PI/2);S.E.add(rg,0x3f9cff,0,topY-1.2,0,0,1,1,topRz/topR);}
  /* scoreboard above the west end */
  {
    const cv=document.createElement('canvas');cv.width=512;cv.height=288;
    const g=cv.getContext('2d');
    g.fillStyle='#0c1430';g.fillRect(0,0,512,288);
    g.strokeStyle='#e8b84b';g.lineWidth=5;g.strokeRect(8,8,496,272);
    g.fillStyle='#e8b84b';g.font='700 15px "Segoe UI",sans-serif';g.textAlign='center';
    g.fillText('C O N T I N E N T A L   ’26',256,40);
    g.fillStyle='#fff';g.font='800 40px "Segoe UI",sans-serif';
    g.fillText(city.name.toUpperCase(),256,96);
    g.strokeStyle='rgba(232,184,75,.5)';g.beginPath();g.moveTo(120,116);g.lineTo(392,116);g.stroke();
    g.fillStyle='#e8d9ae';g.font='500 23px Georgia,serif';
    city.rounds.forEach((r2,i)=>g.fillText(r2,256,152+i*32));
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
    const sb=new THREE.Mesh(new THREE.PlaneGeometry(17,9.6),
      new THREE.MeshBasicMaterial({map:tex}));
    sb.position.set(-(topR+5),topY+7,0);
    sb.rotation.y=Math.PI/2;
    sGroup.add(sb);
    S.O.add(PRIM.box,0x24304e,-(topR+5.4),topY+7,0,0,.5,10.4,17.8);
    S.O.add(PRIM.cyl,0x8a8e94,-(topR+5),topY/2+1,-6,0,.7,topY+4,.7);
    S.O.add(PRIM.cyl,0x8a8e94,-(topR+5),topY/2+1, 6,0,.7,topY+4,.7);
    S.E.add(PRIM.box,0xffd97a,-(topR+5.3),topY+12.2,0,0,.3,.5,17.9);
  }
  /* festive flag ring around the stadium (world coords, done in buildCity) */
  ctx.entranceLocal=new THREE.Vector3(0,0,ez);
}

/* ============================================================
   LANDMARKS
   ============================================================ */
let CUR=null; /* city being built, for auto collision */
function building(B,E,x,z,w,h,d,ry,cWall,cWin){
  B.add(PRIM.box,cWall,x,h/2,z,ry,w,h,d);
  if(CUR)addCollider(CUR.x+x,CUR.z+z,Math.max(w,d)*.62,h,CUR.py);
  const n=Math.max(1,Math.floor(h/7));
  for(let i=0;i<n;i++){
    const y=4+i*(h-6)/n;
    E.add(PRIM.box,cWin,x,y,z,ry,w+.35,1.1,d+.35);
  }
}
const LANDMARKS={
/* ---- Mexico City: Ángel column, colonial plaza, the volcano ---- */
mex(ctx){
  const O=ctx.O,E=ctx.E,G=ctx.G,y=ctx.yAt;
  /* Ángel de la Independencia */
  const ax=-150,az=40;
  O.add(PRIM.disc,0xcabf9e,ax,1.5,az,0,34,3,34);
  O.add(PRIM.disc,0xb8ad8c,ax,4,az,0,22,3,22);
  O.add(PRIM.box,0xd8cfae,ax,8,az,0,10,6,10);
  O.add(PRIM.cyl,0xd8cfae,ax,26,az,0,5.2,36,5.2);
  O.add(PRIM.box,0xd8cfae,ax,45.5,az,0,7,3,7);
  E.add(PRIM.sph,0xffd97a,ax,49.5,az,0,3.4,5,1.2);          /* golden angel */
  E.add(PRIM.box,0xffd97a,ax-2.4,50,az,0,3.4,.5,1.8,0,.5);  /* wings */
  E.add(PRIM.box,0xffd97a,ax+2.4,50,az,0,3.4,.5,1.8,0,-.5);
  /* colonial blocks */
  const pals=[0xc46a4c,0xd8975a,0xb85a62,0xd8c27a,0x9a6a8a];
  for(let i=0;i<16;i++){
    const a=i/16*TAU,r=150+hash2(i,2)*60;
    const x=Math.cos(a)*r,z=Math.sin(a)*r*.8+30;
    if(Math.hypot(x-ax,z-az)<45||z<-40&&Math.abs(x)<90)continue;
    building(O,E,x,z,14+hash2(i,3)*10,8+hash2(i,5)*10,12,a,pals[i%5],0xffd27f);
  }
  /* cathedral-ish tower pair on the plaza */
  for(const s of[-1,1]){O.add(PRIM.box,0xd8cfae,ax+s*22,9,az-30,0,7,18,7);
    O.add(PRIM.cone,0xb8863f,ax+s*22,21,az-30,0,7,6,7);}
  /* Popocatépetl on the horizon */
  const vx=240,vz=170,vy=y(vx,vz);
  O.add(PRIM.cone,0x6e6258,vx,vy+80,vz,0,260,160,240);
  O.add(PRIM.cone,0xf2f4f6,vx,vy+138,vz,0,92,45,85);
  ctx.smoke.push({x:vx,y:vy+162,z:vz,r:1200,w:22,rise:19,drift:7,c:0xbcb4ac,size:22});
  /* papel picado strings across the plaza */
  for(let i=0;i<5;i++){
    const a1=i/5*TAU,a2=a1+TAU/5;
    flagField.bunting(ctx.wx(Math.cos(a1)*95),ctx.city.py+9,ctx.wz(Math.sin(a1)*80+20),
                      ctx.wx(Math.cos(a2)*95),ctx.city.py+9,ctx.wz(Math.sin(a2)*80+20),12);
    O.add(PRIM.cyl,0x7a5a3a,Math.cos(a1)*95,4.5,Math.sin(a1)*80+20,0,.7,9,.7);
  }
  ctx.confetti={x:0,z:20,r:130};
  /* the tethered ride balloon */
  {
    const bg=new THREE.Group();
    const env=new THREE.Mesh(new THREE.SphereGeometry(7,12,10),new THREE.MeshLambertMaterial({color:0xd94f54,flatShading:true}));
    env.scale.y=1.15;env.position.y=14;env.castShadow=true;bg.add(env);
    const bk=new THREE.Mesh(new THREE.BoxGeometry(2.6,2,2.6),new THREE.MeshLambertMaterial({color:0x7a5a3a}));
    bk.position.y=3;bg.add(bk);
    bg.position.set(80,0,-40);ctx.group.add(bg);
    anims.push({u:(t)=>{bg.position.y=Math.sin(t*.7)*.5;}});
  }
  for(let i=0;i<9;i++)ctx.tree('leaf',Math.cos(i)*120+30,Math.sin(i*2.4)*100+40,1,0x5d8a4a);
},
/* ---- Guadalajara: twin yellow spires, agave rows ---- */
gdl(ctx){
  const O=ctx.O,E=ctx.E;
  const cx=140,cz=-30;
  O.add(PRIM.box,0xe3d3b2,cx,10,cz,0,34,20,22);              /* nave */
  O.add(PRIM.box,0xd8c8a4,cx,22,cz,0,10,8,22);
  for(const s of[-1,1]){
    O.add(PRIM.box,0xe8dab8,cx+s*13,17,cz+14,0,8,34,8);
    O.add(PRIM.cone,0xe8c33f,cx+s*13,39.5,cz+14,0,9,11,9);   /* the yellow spires */
    E.add(PRIM.sph,0xffe9a8,cx+s*13,45.5,cz+14,0,1.2,1.2,1.2);
  }
  O.add(PRIM.cone,0xc9a23a,cx,30,cz-6,0,11,10,11);           /* central dome cap */
  /* agave fields in ordered rows */
  for(let r=0;r<7;r++)for(let i=0;i<10;i++){
    const x=-60+i*16+((r%2)?8:0),z=110+r*13;
    ctx.tree('agave',x+hash2(i,r)*4,z+hash2(r,i)*4,.8+hash2(i,r+9)*.5,0x6fa3a0);
  }
  for(let i=0;i<8;i++)ctx.tree('leaf',-150+hash2(i,4)*80,-90+hash2(i,8)*100,1,0x628c4c);
},
/* ---- Monterrey: Cerro de la Silla, the saddle ---- */
mty(ctx){
  const O=ctx.O,y=ctx.yAt;
  const mx=-230,mz=-40,my=y(mx,mz);
  /* two peaks with the saddle dip between them */
  O.add(PRIM.cone,0x94836b,mx-40,my+72,mz,0,150,144,128,0,0.06);
  O.add(PRIM.cone,0x8b7a62,mx+50,my+59,mz+10,.6,136,118,120,0,-0.08);
  O.add(PRIM.box,0x907f67,mx+3,my+30,mz+3,.2,96,61,88);      /* the ridge between */
  O.add(PRIM.cone,0xa08e73,mx-40,my+120,mz,0,35,35,29);
  O.add(PRIM.cone,0x99876c,mx+50,my+102,mz+8,0,32,30,27);
  /* dry scrub */
  for(let i=0;i<14;i++)ctx.tree('agave',-120+hash2(i,3)*240,90+hash2(i,7)*80,.7,0x87a06a);
  for(let i=0;i<6;i++)ctx.tree('leaf',-160+hash2(i,9)*100,-60+hash2(i,5)*120,.9,0x7a9a54);
},
/* ---- Los Angeles: the sign on the hill, palm boulevard ---- */
la(ctx){
  const O=ctx.O,E=ctx.E,y=ctx.yAt;
  const hx=170,hz=-95,hy=y(hx,hz);
  O.add(PRIM.cone,0xa89a6a,hx,hy+23,hz,0,200,46,160);        /* the hill */
  O.add(PRIM.cone,0x9a8f62,hx-60,hy+16,hz+35,.5,145,32,120);
  const signTex=textTex('HOLLYWOOD','#f4f4f0',null,'900 72px "Arial Black",sans-serif',1024,128);
  const sg=new THREE.PlaneGeometry(86,11);
  const sm=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({map:signTex,transparent:true,side:THREE.DoubleSide}));
  sm.position.set(hx+6,hy+34,hz+78);sm.rotation.y=0.15;sm.rotation.x=-0.12;
  ctx.group.add(sm);
  /* palm boulevard leading to the gate */
  for(let i=0;i<9;i++)for(const s of[-1,1]){
    ctx.tree('palm',s*16,74+i*14,1+hash2(i,s)*.3,0x5d9152);
  }
  /* deco towers */
  building(O,E,150,40,16,34,14,.2,0xd8cfc2,0xffd27f);
  building(O,E,176,70,13,24,12,-.1,0xc9bfae,0xffd27f);
  building(O,E,132,86,11,18,11,.4,0xbfb4a4,0xffd27f);
},
/* ---- SF: the Golden Gate over the fog ---- */
sf(ctx){
  const O=ctx.O,E=ctx.E,y=ctx.yAt,city=ctx.city;
  /* bridge spanning the cut to the west */
  const bx=-165,bz=-95,yaw=-0.7;
  const dirx=Math.cos(yaw),dirz=Math.sin(yaw);
  const span=220,deckY=30;
  const org=0xd0553a;
  /* towers */
  for(const t of[-0.5,0.5]){
    const tx=bx+dirx*span*t*.55,tz=bz+dirz*span*t*.55;
    for(const s of[-1,1]){
      O.add(PRIM.box,org,tx-dirz*s*5,y(tx,tz)/2+31,tz+dirx*s*5,yaw,2.6,62-y(tx,tz)*0+62,2.6);
    }
    for(const yy of[18,34,50])O.add(PRIM.box,org,tx,yy,tz,yaw,3,3.4,13);
  }
  /* deck */
  O.add(PRIM.box,0xb8452e,bx,deckY,bz,yaw,span,2,10);
  /* main cables: two parabolas */
  for(const s of[-1,1]){
    for(let i=0;i<16;i++){
      const t0=i/16-.5,t1=(i+1)/16-.5;
      const sag=(tt)=>deckY+4+44*Math.pow(Math.abs(tt)/.5,2)*(Math.abs(tt)>.275?1:0)+(Math.abs(tt)<=.275?34*(1-Math.pow(tt/.275,2))*0+44*Math.pow(Math.abs(tt)/.5,2):0);
      const yA=deckY+4+52*Math.pow(t0/.5,2),yB=deckY+4+52*Math.pow(t1/.5,2);
      const xa=bx+dirx*span*t0,za=bz+dirz*span*t0;
      const xb=bx+dirx*span*t1,zb=bz+dirz*span*t1;
      const mx=(xa+xb)/2,mzz=(za+zb)/2,myy=(yA+yB)/2;
      const len=Math.hypot(xb-xa,yB-yA,zb-za);
      const pitch=Math.atan2(yB-yA,Math.hypot(xb-xa,zb-za));
      O.add(PRIM.tube,org,mx-dirz*s*5,myy,mzz+dirx*s*5,-yaw,len,.5,.5,0,pitch);
      if(i%2)O.add(PRIM.tube,org,(xa)-dirz*s*5,(yA+deckY)/2,za+dirx*s*5,0,.25,yA-deckY,.25);
    }
  }
  /* walkable deck */
  platforms.push({x0:city.x+bx-Math.abs(dirx)*span/2-6,x1:city.x+bx+Math.abs(dirx)*span/2+6,
                  z0:city.z+bz-Math.abs(dirz)*span/2-6,z1:city.z+bz+Math.abs(dirz)*span/2+6,
                  y:city.py+deckY+1});
  /* railings and the mid-span photo plaque */
  for(let i=0;i<9;i++){
    const t=(i/8-.5)*.92;
    const rx2=bx+dirx*span*t,rz2=bz+dirz*span*t;
    for(const s of[-1,1]){
      O.add(PRIM.box,0xb8452e,rx2-dirz*s*4.6,deckY+2.2,rz2+dirx*s*4.6,-yaw,span*.115,1.5,.22);
      addCollider(city.x+rx2-dirz*s*4.6,city.z+rz2+dirx*s*4.6,1.2,3.4,city.py+deckY+1);
    }
  }
  O.add(PRIM.box,0x24304e,bx+2,deckY+2.6,bz,-yaw,.35,1.5,2.2);
  ggRef={lift:{x:city.x+bx+dirx*104,z:city.z+bz+dirz*104},
         mid:{x:city.x+bx,z:city.z+bz},deckY:city.py+deckY+1};
  /* fog bank */
  ctx.fogBank={x:bx,z:bz,yaw};
  /* painted ladies row */
  const pals=[0x9ab5d8,0xd8a9c0,0xc8d8a9,0xe8d0a0,0xb0a0d0];
  for(let i=0;i<7;i++){
    building(O,E,90+i*15,80,10,13+hash2(i,1)*5,11,0,pals[i%5],0xffd27f);
    O.add(PRIM.cone4,0x6a6a72,90+i*15,20+hash2(i,1)*5,80,Math.PI/4,10,6,11);
  }
  building(O,E,150,-40,15,44,15,.3,0xc9c5bc,0xffd27f); /* downtown */
  building(O,E,175,-15,12,32,12,.1,0xb8b4ac,0xffd27f);
  O.add(PRIM.cone,0xd8d4cc,128,-52+56,0,0,16,56,16);   /* transamerica-ish spire */
},
/* ---- Seattle: the Needle in the evergreens ---- */
sea(ctx){
  const O=ctx.O,E=ctx.E,G=ctx.G;
  const nx=150,nz=-60;
  for(let i=0;i<3;i++){const a=i/3*TAU;
    O.add(PRIM.cyl,0xe8e9ea,nx+Math.cos(a)*7,26,nz+Math.sin(a)*7,0,1.8,52,1.8,0.12*Math.sin(a),-0.12*Math.cos(a));}
  O.add(PRIM.cyl,0xdcdee0,nx,30,nz,0,3.4,60,3.4);
  O.add(PRIM.disc,0xe8e9ea,nx,56,nz,0,26,3,26);              /* saucer */
  G.add(PRIM.disc,0x5a7890,nx,58.4,nz,0,20,2,20);
  O.add(PRIM.cone,0xdcdee0,nx,62,nz,0,8,5,8);
  O.add(PRIM.cyl,0xc8cacc,nx,66,nz,0,.8,6,.8);
  E.add(PRIM.sph,0xff6a5a,nx,69.5,nz,0,1.4,1.4,1.4);
  /* evergreen forest */
  for(let i=0;i<46;i++){
    const a=hash2(i,1)*TAU,r=95+hash2(i,2)*110;
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(z>60&&Math.abs(x)<40)continue;
    ctx.tree('con',x,z,.9+hash2(i,3)*.9,0x2e5940);
  }
  ctx.rain={x:0,z:0,r:900};
},
/* ---- Vancouver: mountains, harbor, the seaplane ---- */
van(ctx){
  const O=ctx.O,E=ctx.E,y=ctx.yAt,city=ctx.city;
  /* coastal range across the north */
  const peaks=[[-140,-260,150,120],[10,-300,190,150],[170,-260,160,120],[-260,-220,120,90]];
  for(const p of peaks){
    const py=y(p[0],p[1]);
    O.add(PRIM.cone,0x5d6b5e,p[0],py+p[3]*.48,p[1],hash2(p[0],1)*3,p[2],p[3],p[2]*.9);
    O.add(PRIM.cone,0xeef2f5,p[0],py+p[3]*.83,p[1],hash2(p[0],1)*3,p[2]*.34,p[3]*.34,p[2]*.31);
  }
  /* gastown-ish waterfront blocks */
  const pals=[0x8a5a44,0x9a6a50,0x7a6a58];
  for(let i=0;i<8;i++)building(O,E,-140+i*17,-90,12,10+hash2(i,6)*14,12,0,pals[i%3],0xffd27f);
  building(O,E,120,30,14,40,14,.4,0x9fc4cd,0xbfe8ff);    /* glass tower */
  building(O,E,148,58,12,30,12,.1,0x8fb4c0,0xbfe8ff);
  /* seaplane dock and pier toward the inlet */
  const dx=-176,dz=-196;
  O.add(PRIM.box,0x7a6a52,dx,y(dx,dz)+2.5,dz,0.4,26,1,5);
  for(let i=0;i<6;i++)O.add(PRIM.cyl,0x5d5142,dx-10+i*5,y(dx,dz)+1,dz+2-i*2,0,.8,4,.8);
  /* white sails pavilion on the waterfront (canada-place-ish) */
  const px=-60,pz=-140,pyv=y(px,pz);
  O.add(PRIM.box,0xd8d4cc,px,pyv+4,pz,0.2,40,7,12);
  for(let i=0;i<5;i++)O.add(PRIM.cone4,0xf6f7f8,px-16+i*8,pyv+11,pz,0.2+Math.PI/4,9,8,9);
  building(O,E,90,-40,13,36,13,.3,0x9fc4cd,0xbfe8ff);
  building(O,E,64,-70,11,26,11,.1,0x8fb4c0,0xbfe8ff);
  ctx.seaplane={x:city.x+dx-20,z:city.z+dz-30};
  /* forest */
  for(let i=0;i<30;i++){
    const a=hash2(i,5)*TAU,r=110+hash2(i,6)*120;
    ctx.tree('con',Math.cos(a)*r,Math.sin(a)*r*.7+40,1+hash2(i,7)*.8,0x35634a);
  }
},
/* ---- Kansas City: Union Station, fountains, drifting smoke ---- */
kc(ctx){
  const O=ctx.O,E=ctx.E;
  const ux=150,uz=30;
  O.add(PRIM.box,0xcfc4ac,ux,10,uz,0,56,20,18);              /* grand hall */
  O.add(PRIM.box,0xbfb49c,ux-30,7,uz,0,18,14,16);
  O.add(PRIM.box,0xbfb49c,ux+30,7,uz,0,18,14,16);
  for(let i=0;i<3;i++)E.add(PRIM.box,0xffd9a0,ux-14+i*14,10,uz+9.4,0,8,12,.5); /* arched windows */
  O.add(PRIM.box,0x8a8274,ux,21,uz,0,60,2,22);
  /* fountain pools */
  ctx.fountain={x:ux,z:uz+40};
  O.add(PRIM.disc,0x9fc0cc,ux,0.6,uz+40,0,30,1.2,18);
  O.add(PRIM.ring,0xcfc4ac,ux,1.2,uz+40,0,31,2.4,19);
  /* BBQ smokehouse */
  O.add(PRIM.box,0x6a4a34,80,4,110,0.3,14,8,10);
  O.add(PRIM.cyl,0x3a3430,84,11,108,0,1.6,8,1.6);
  ctx.smoke.push({x:84,y:16,z:108,r:700,w:14,rise:9,drift:5,c:0x9a938c,size:9});
  ctx.smoke.push({x:76,y:12,z:114,r:700,w:8,rise:7,drift:4,c:0xa8a09a,size:7});
  for(let i=0;i<12;i++)ctx.tree('leaf',-120+hash2(i,2)*260,-140+hash2(i,4)*90,1,0x6f9a4e);
},
/* ---- Dallas: Reunion Tower and the longhorns ---- */
dal(ctx){
  const O=ctx.O,E=ctx.E;
  const rx=160,rz=-40;
  for(let i=0;i<4;i++){const a=i/4*TAU;
    O.add(PRIM.cyl,0xb8bcc2,rx+Math.cos(a)*3.4,27,rz+Math.sin(a)*3.4,0,1.5,54,1.5);}
  O.add(PRIM.sph,0x6a7078,rx,56,rz,0,14,14,14);
  /* the glowing lattice ball */
  for(let i=0;i<42;i++){
    const a=hash2(i,1)*TAU,e=Math.acos(2*hash2(i,2)-1);
    E.add(PRIM.sph,0xffe9a8,rx+7.4*Math.sin(e)*Math.cos(a),56+7.4*Math.cos(e),rz+7.4*Math.sin(e)*Math.sin(a),0,.9,.9,.9);
  }
  building(O,E,120,-90,16,46,16,.2,0x9aa8b8,0xbfe8ff);
  building(O,E,150,-110,13,34,13,-.2,0x8a98a8,0xbfe8ff);
  /* longhorn silhouettes in the scrub */
  for(let i=0;i<5;i++){
    const x=-140-hash2(i,3)*60,z=90+i*22;
    O.add(PRIM.box,0x2e2620,x,3.4,z,hash2(i,5)*1,7,3.6,1.6);       /* body  */
    O.add(PRIM.box,0x2e2620,x+3.4,4.6,z,hash2(i,5)*1,1.6,3,1.4);   /* head  */
    O.add(PRIM.box,0x241e18,x+3.4,6.2,z,hash2(i,5)*1+Math.PI/2,.5,.5,9); /* horns */
    for(const l of[-2.4,2.4])O.add(PRIM.box,0x2e2620,x+l,1.2,z,0,.8,2.4,.8);
  }
  for(let i=0;i<10;i++)ctx.tree('agave',-100+hash2(i,7)*220,130+hash2(i,9)*70,.7,0x8a9a5a);
},
/* ---- Houston: the Saturn V ---- */
hou(ctx){
  const O=ctx.O,E=ctx.E;
  const sx=150,sz=20;
  O.add(PRIM.disc,0xb8b4ac,sx,1,sz,0,40,2,40);
  /* the rocket itself lives in its own group so it can fly */
  {
    const RB=new Batch();
    RB.add(PRIM.cyl,0xf2f3f4,0,26,0,0,7,52,7);
    RB.add(PRIM.cyl,0x1c1c1e,0,14,0,0,7.2,4,7.2);
    RB.add(PRIM.cyl,0x1c1c1e,0,40,0,0,7.2,3,7.2);
    RB.add(PRIM.cyl,0xe8e9ea,0,56,0,0,5,8,5);
    RB.add(PRIM.cone,0x2e2e30,0,64.5,0,0,4.4,9,4.4);
    RB.add(PRIM.cyl,0xd0d2d4,0,72,0,0,.8,7,.8);
    for(let i=0;i<4;i++){const a=i/4*TAU+.4;
      RB.add(PRIM.cone4,0xd94f30,Math.cos(a)*7,4,Math.sin(a)*7,-a,4,8,1);}
    const rg=new THREE.Group();
    rg.add(RB.build(MAT.opaque,true));
    rg.position.set(sx,0,sz);
    ctx.group.add(rg);
    rocketRef={g:rg};
  }
  /* red gantry */
  O.add(PRIM.box,0xb84a3a,sx+14,34,sz,0,4,68,4);
  for(let i=0;i<6;i++)O.add(PRIM.box,0xb84a3a,sx+10.5,8+i*11,sz,0,7,1,1.4);
  E.add(PRIM.sph,0xff8a6a,sx+14,69,sz,0,1.2,1.2,1.2);
  building(O,E,-150,60,18,30,18,.3,0x9aa4b0,0xbfe8ff);
  building(O,E,-125,90,14,22,14,0,0x8a94a0,0xbfe8ff);
  for(let i=0;i<8;i++)ctx.tree('leaf',-80+hash2(i,2)*200,120+hash2(i,4)*60,1,0x5d9152);
},
/* ---- Atlanta: SkyView wheel and the peach ---- */
atl(ctx){
  const O=ctx.O,E=ctx.E,city=ctx.city;
  const wx=150,wz=10;
  /* ferris wheel: animated group */
  const wheel=new THREE.Group();wheel.position.set(wx,26,wz);
  const wg=new Batch();
  {const g=new THREE.TorusGeometry(20,.9,6,36);wg.add(g,0xe8e9ea,0,0,0);}
  for(let i=0;i<10;i++){const a=i/10*TAU;
    wg.add(PRIM.box,0xd0d2d4,Math.cos(a)*10,Math.sin(a)*10,0,0,20,.7,.7,0,a);}
  wheel.add(wg.build(MAT.opaque,true));
  const gondolas=[];
  const gonGeo=new THREE.BoxGeometry(3,3.6,2.4);
  const gonCols=[0xd94f54,0x3f7fd9,0xf2c744,0x3fa66a,0xd977b8,0x35c4d0];
  for(let i=0;i<10;i++){
    const gm=new THREE.Mesh(gonGeo,new THREE.MeshLambertMaterial({color:gonCols[i%6]}));
    gondolas.push(gm);wheel.add(gm);
  }
  ctx.group.add(wheel);
  wheelRefs={wheel,gondolas,city:ctx.city};
  for(const s of[-1,1])O.add(PRIM.box,0xb8bcc2,wx+s*8,13,wz,0,2,26,2,0,s*.3);
  anims.push({u:(t)=>{
    wheel.rotation.z=t*.14;
    for(let i=0;i<10;i++){const a=i/10*TAU+t*.14;
      gondolas[i].position.set(Math.cos(a-t*.14+t*.14)*0,0,0);
      const ax=Math.cos(i/10*TAU)*20,ay=Math.sin(i/10*TAU)*20;
      gondolas[i].position.set(ax,ay-2.8,0);
      gondolas[i].rotation.z=-wheel.rotation.z;}
  }});
  /* the giant peach */
  O.add(PRIM.cyl,0x9a9488,110,10,80,0,3,20,3);
  O.add(PRIM.sph,0xf2905a,110,24,80,0,15,14,15);
  O.add(PRIM.sph,0xe87a4a,113,24,80,0,12,13.4,14);
  O.add(PRIM.box,0x4a7a3a,110,32,80,.4,7,.8,3,0,.3);
  building(O,E,-150,-60,17,50,17,.2,0x8a98a8,0xbfe8ff);
  building(O,E,-120,-90,14,38,14,-.1,0x9aa8b8,0xbfe8ff);
  building(O,E,-165,-95,12,28,12,.3,0x7a8898,0xbfe8ff);
  for(let i=0;i<16;i++)ctx.tree('leaf',-60+hash2(i,2)*220,110+hash2(i,4)*80,1.1,0x4d8a44);
},
/* ---- Miami: the pastel deco strip ---- */
mia(ctx){
  const O=ctx.O,E=ctx.E;
  const pals=[[0x7fd8d0,0x35c4d0],[0xf2a0b8,0xf26a90],[0xf2d890,0xf2b84a],[0xb8a0e0,0x9a7ad0],[0x90d8a0,0x4ab86a]];
  for(let i=0;i<8;i++){
    const x=100+i*20,z=60;
    const p=pals[i%5];
    O.add(PRIM.box,p[0],x,7+i%3,z,0,15,14+(i%3)*4,13);
    O.add(PRIM.box,0xf8f8f4,x,15.5+(i%3)*2.5,z,0,16,1,14);       /* parapet   */
    E.add(PRIM.box,p[1],x,8,z+7,0,13,.8,.6);                      /* neon band */
    E.add(PRIM.box,p[1],x-7.8,8,z,0,.6,.8,12);
  }
  /* lifeguard hut + beach */
  O.add(PRIM.box,0xf2c744,190,4.5,130,-.4,6,5,6);
  O.add(PRIM.cone4,0x35c4d0,190,8.5,130,-.4+Math.PI/4,9,4,9);
  for(let i=0;i<14;i++){
    const a=hash2(i,1)*TAU,r=80+hash2(i,3)*110;
    ctx.tree('palm',Math.cos(a)*r+60,Math.sin(a)*r*.7+50,1+hash2(i,5)*.4,0x4d9a52);
  }
  ctx.confetti={x:140,z:60,r:110};
},
/* ---- Toronto: the CN Tower ---- */
tor(ctx){
  const O=ctx.O,E=ctx.E,G=ctx.G;
  const tx=140,tz=-20;
  O.add(PRIM.cyl,0xc9cdd2,tx,55,tz,0,9,110,9);
  {const g=new THREE.CylinderGeometry(3.2,7.5,110,10,1,true);O.add(g,0xb9bdc2,tx,55,tz);}
  O.add(PRIM.disc,0xd9dce0,tx,112,tz,0,17,5,17);          /* main pod   */
  G.add(PRIM.disc,0x4a6078,tx,116,tz,0,13,3,13);
  O.add(PRIM.disc,0xc9cdd2,tx,132,tz,0,7,3,7);            /* skypod     */
  O.add(PRIM.cyl,0xb9bdc2,tx,148,tz,0,1,26,1);
  E.add(PRIM.sph,0xff5a5a,tx,161.5,tz,0,1.4,1.4,1.4);
  E.add(PRIM.ring,0xa8d8ff,tx,112,tz,0,35,2.4,35);        /* pod glow   */
  building(O,E,95,40,15,42,15,.2,0x8a98a8,0xbfe8ff);
  building(O,E,120,66,13,32,13,-.2,0x9aa8b8,0xbfe8ff);
  building(O,E,80,72,11,24,11,.1,0x7a8898,0xbfe8ff);
  for(let i=0;i<10;i++)ctx.tree('leaf',-140+hash2(i,2)*120,60+hash2(i,4)*100,1,0x5d8a4a);
},
/* ---- Boston: Zakim cables and the harbor light ---- */
bos(ctx){
  const O=ctx.O,E=ctx.E,y=ctx.yAt;
  /* Zakim bridge */
  const bx=130,bz=40,yaw=.5;
  const dirx=Math.cos(yaw),dirz=Math.sin(yaw);
  O.add(PRIM.box,0xd0d2d4,bx,14,bz,-yaw,130,1.6,9);
  for(const t of[-.28,.28]){
    const px=bx+dirx*130*t,pz=bz+dirz*130*t;
    /* inverted-Y pylon */
    for(const s of[-1,1])O.add(PRIM.box,0xe8e9ea,px-dirz*s*3,22,pz+dirx*s*3,-yaw,1.8,44,1.8,0,s*.12);
    O.add(PRIM.box,0xe8e9ea,px,48,pz,-yaw,1.8,12,1.8);
    /* cable fans */
    for(let i=1;i<=5;i++){
      const dd=i*9;
      for(const s2 of[-1,1]){
        const ax=px+dirx*dd*s2,az=pz+dirz*dd*s2;
        const len=Math.hypot(dd,36);
        const pitch=Math.atan2(36,dd*s2);
        O.add(PRIM.tube,0xf0f1f2,(px+ax)/2,32,(pz+az)/2,-yaw,.3,0,.3,0,0);
        O.add(PRIM.tube,0xf0f1f2,(px+ax)/2,(14+50)/2,(pz+az)/2,-yaw+(s2<0?Math.PI:0),len,.28,.28,0,Math.atan2(36,dd));
      }
    }
  }
  /* lighthouse on the point */
  const lx=210,lz=-120,ly=y(lx,lz);
  O.add(PRIM.cyl,0xf2f3f4,lx,ly+11,lz,0,6.5,22,5);
  O.add(PRIM.cyl,0xc42e3a,lx,ly+11,lz,0,6.6,7,5.1);
  O.add(PRIM.cyl,0x2e2e30,lx,ly+23.5,lz,0,4,3,4);
  E.add(PRIM.sph,0xfff2b8,lx,ly+23.5,lz,0,2.6,2.2,2.6);
  ctx.beacon={x:lx,y:ly+23.5,z:lz};
  /* brownstones */
  const pals=[0x8a5a44,0x9a6a50,0x7a5a48];
  for(let i=0;i<7;i++)building(O,E,-150+i*16,90,12,12+hash2(i,6)*6,12,0,pals[i%3],0xffd27f);
  for(let i=0;i<10;i++)ctx.tree('leaf',-100+hash2(i,2)*200,-120+hash2(i,4)*70,1,0x5d8a4a);
},
/* ---- Philadelphia: the Bell and Independence Hall ---- */
phi(ctx){
  const O=ctx.O,E=ctx.E,G=ctx.G;
  const hx=-150,hz=10;
  /* Independence Hall */
  O.add(PRIM.box,0x9a5a44,hx,8,hz,0,40,16,16);            /* brick hall  */
  O.add(PRIM.cone4,0x5a5a62,hx,18.5,hz,Math.PI/4,40,5,17);
  O.add(PRIM.box,0x9a5a44,hx,20,hz,0,10,10,10);           /* tower base  */
  O.add(PRIM.box,0xf2f3f4,hx,28,hz,0,7,8,7);              /* clock stage */
  const clockTex=textTex('XII','#1a1a24','#f4ead2','700 40px Georgia',128,128);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;
    const cm=new THREE.Mesh(new THREE.CircleGeometry(2.4,20),new THREE.MeshBasicMaterial({map:clockTex}));
    cm.position.set(hx+Math.sin(a)*3.6,29,hz+Math.cos(a)*3.6);cm.rotation.y=a;
    ctx.group.add(cm);}
  O.add(PRIM.cone,0xe8e9ea,hx,36,hz,0,8,8,8);
  O.add(PRIM.cyl,0xd0d2d4,hx,41,hz,0,.8,4,.8);
  /* the Liberty Bell under a glass pavilion */
  const bx=-100,bz=62;
  G.add(PRIM.box,0xbfd8e0,bx,6,bz,0,16,12,14);
  O.add(PRIM.box,0x6a7078,bx,12.3,bz,0,17,1,15);
  {const bellGeo=new THREE.LatheGeometry(
     [new THREE.Vector2(.2,0),new THREE.Vector2(2.6,.4),new THREE.Vector2(3.1,1.2),new THREE.Vector2(2.5,3.4),new THREE.Vector2(1.5,4.4),new THREE.Vector2(.6,4.8)],14);
   const bg=new THREE.Group();
   const bm=new THREE.Mesh(bellGeo,new THREE.MeshLambertMaterial({color:0x8a6a3a,flatShading:true}));
   bm.position.y=-4.9;bm.castShadow=true;bg.add(bm);
   const crack=new THREE.Mesh(new THREE.BoxGeometry(.24,3.4,.2),new THREE.MeshLambertMaterial({color:0x3a3026}));
   crack.position.set(0,-4.3,2.6);crack.rotation.z=.22;bg.add(crack);
   bg.position.set(bx,7.9,bz);        /* pivot at the yoke */
   ctx.group.add(bg);
   bellRef={g:bg,city:ctx.city};}
  O.add(PRIM.box,0x5a4a34,bx,8.2,bz,0,7,.9,.9);
  const pals=[0x8a5a44,0x9a6a50];
  for(let i=0;i<6;i++)building(O,E,-140+i*17,80,12,11+hash2(i,6)*7,12,0,pals[i%2],0xffd27f);
  for(let i=0;i<9;i++)ctx.tree('leaf',-90+hash2(i,2)*220,-110+hash2(i,4)*60,1,0x5d8a4a);
},
/* ---- NY/NJ: Liberty, the skyline, the stage for the final ---- */
ny(ctx){
  const O=ctx.O,E=ctx.E,y=ctx.yAt,city=ctx.city;
  /* Statue of Liberty on her island (world offset toward the harbor cut) */
  const sx=120,sz=190;                       /* south, near liberty point  */
  const sy=y(sx,sz);
  const teal=0x5fb8a8;
  O.add(PRIM.box,0xb0a890,sx,sy+5,sz,0,16,10,16);
  O.add(PRIM.box,0xc0b8a0,sx,sy+12,sz,0,10,4,10);
  O.add(PRIM.cyl,teal,sx,sy+22,sz,0,5,16,5);            /* robed figure */
  O.add(PRIM.sph,teal,sx,sy+31.5,sz,0,3.4,3.8,3.4);
  for(let i=0;i<7;i++){const a=i/7*Math.PI-Math.PI/2;   /* crown */
    O.add(PRIM.box,teal,sx+Math.sin(a)*2.6,sy+34.5,sz-Math.cos(a)*1.2,0,.5,2.6,.5,0,-a*.6);}
  O.add(PRIM.cyl,teal,sx+4.4,sy+34,sz,0,1.2,14,1.2,0,-.5);  /* raised arm */
  E.add(PRIM.sph,0xffd97a,sx+7.6,sy+42,sz,0,2,2.6,2);       /* the torch  */
  O.add(PRIM.box,teal,sx-3.4,sy+24,sz-2,0,2.4,5,3);         /* tablet     */
  /* Manhattan skyline across the water */
  const mx=225,mz=35;
  const skl=[[0,0,14,58],[18,6,12,44],[-20,-4,13,50],[36,2,11,36],[-38,4,12,40],
             [8,22,10,30],[-12,24,11,34],[26,-18,10,28],[-30,-20,10,26],[46,-8,9,22],[54,10,9,26]];
  for(const s of skl){
    const bx2=mx+s[0]*1.6,bz2=mz+s[1]*1.6,by=y(bx2,bz2);
    building(O,E,bx2,bz2,s[2],s[3],s[2],hash2(s[0],s[1])*.4,new THREE.Color().setHSL(.58,.12,.42+hash2(s[0],7)*.14),0xbfe8ff);
  }
  /* one spire */
  const ex=mx+2,ez=mz+2,ey=y(ex,ez);
  O.add(PRIM.box,0x9aa8b8,ex,ey+62,ez,.2,10,10,10);
  O.add(PRIM.cone,0xb8c4d0,ex,ey+72,ez,.2,7,10,7);
  O.add(PRIM.cyl,0xd0d8e0,ex,ey+81,ez,0,.9,10,.9);
  E.add(PRIM.sph,0xffe9a8,ex,ey+86.5,ez,0,1.3,1.3,1.3);
  /* festival plaza before the gate */
  for(let i=0;i<6;i++){
    const a=i/6*TAU,px=Math.cos(a)*105,pz=Math.sin(a)*88;
    O.add(PRIM.cyl,0xd0d2d4,px,7,pz,0,.9,14,.9);
    flagField.flag(city.x+px,city.py+11,city.z+pz,a+1.2,7,4.4,[0xe8b84b,0xd94f54,0x3f7fd9,0x3fa66a,0xe8e6df,0x9a7ad0][i],0xe8e6df);
  }
  ctx.confetti={x:0,z:0,r:160};
  for(let i=0;i<8;i++)ctx.tree('leaf',-150+hash2(i,2)*120,120+hash2(i,4)*80,1,0x5d8a4a);
},
};
/* ============================================================
   PARTICLE FACTORIES
   ============================================================ */
function addSmoke(s){ /* {x,y,z world, r, w(spread), rise, drift, c, size} */
  const n=26,p=makeParticles(n,s.c,s.size,.5,false);
  scene.add(p);
  const seed=hash2(s.x,s.z)*10;
  particleSys.push({mesh:p,ax:s.x,az:s.z,r:s.r,u:(t)=>{
    const a=p.geometry.attributes.position.array;
    for(let i=0;i<n;i++){
      const life=(t*.09+i/n+seed)%1;
      a[i*3]=s.x+(hash2(i,1)-.5)*s.w*life+s.drift*life*life*3;
      a[i*3+1]=s.y+life*s.rise*3;
      a[i*3+2]=s.z+(hash2(i,2)-.5)*s.w*life;
    }
    p.geometry.attributes.position.needsUpdate=true;
    p.material.opacity=.4;
  }});
}
function addRain(cx,cz,cy){
  const n=700,p=makeParticles(n,0x9db6c6,1.6,.5,false);
  scene.add(p);
  const a=p.geometry.attributes.position.array;
  for(let i=0;i<n;i++){a[i*3]=cx+(hash2(i,1)-.5)*460;a[i*3+1]=cy+hash2(i,2)*160;a[i*3+2]=cz+(hash2(i,3)-.5)*460;}
  particleSys.push({mesh:p,ax:cx,az:cz,r:900,u:(t,dt)=>{
    for(let i=0;i<n;i++){
      a[i*3+1]-=68*dt;
      if(a[i*3+1]<cy-4){a[i*3+1]=cy+150+hash2(i,t)*16;a[i*3]=cx+(hash2(i,t+1)-.5)*460;a[i*3+2]=cz+(hash2(i,t+2)-.5)*460;}
    }
    p.geometry.attributes.position.needsUpdate=true;
  }});
}
function addFountain(cx,cz,cy){
  const n=90,p=makeParticles(n,0xcfe8f2,1.2,.5,true);
  scene.add(p);
  particleSys.push({mesh:p,ax:cx,az:cz,r:600,u:(t)=>{
    const a=p.geometry.attributes.position.array;
    for(let i=0;i<n;i++){
      const jet=i%5,life=(t*.5+i/n)%1;
      const jx=cx+(jet-2)*9,v0=13+jet%3*2.5;
      a[i*3]=jx+(hash2(i,4)-.5)*2*life;
      a[i*3+1]=cy+1+v0*life-16*life*life;
      a[i*3+2]=cz+(hash2(i,6)-.5)*2*life;
    }
    p.geometry.attributes.position.needsUpdate=true;
  }});
}
function addConfetti(cx,cz,cy,r){
  const n=170,g=new THREE.BufferGeometry();
  const pos=new Float32Array(n*3),col=new Float32Array(n*3);
  const cols=[0xe8b84b,0xd94f54,0x3fa66a,0x3f7fd9,0xe8e6df,0xd977b8].map(c=>new THREE.Color(c));
  for(let i=0;i<n;i++){const c=cols[i%6];col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({vertexColors:true,size:1.1,map:dotTex,transparent:true,opacity:.7,depthWrite:false}));
  p.frustumCulled=false;scene.add(p);
  particleSys.push({mesh:p,ax:cx,az:cz,r:700,u:(t)=>{
    for(let i=0;i<n;i++){
      const life=(t*.05+i/n)%1,ang=t*.6+i;
      pos[i*3]=cx+Math.cos(ang)*(6+hash2(i,1)*r);
      pos[i*3+1]=cy+90-life*88;
      pos[i*3+2]=cz+Math.sin(ang*.9)*(6+hash2(i,2)*r);
    }
    g.attributes.position.needsUpdate=true;
  }});
}
function addFogBank(cx,cz,cy,yaw){
  const mat=new THREE.SpriteMaterial({map:cloudTex,color:0xdfe8ec,transparent:true,opacity:.4,depthWrite:false});
  for(let i=0;i<7;i++){
    const s=new THREE.Sprite(mat.clone());
    const off=(i-3)*46;
    s.position.set(cx+Math.cos(yaw)*off,cy+8+hash2(i,3)*10,cz+Math.sin(yaw)*off);
    s.scale.set(150+hash2(i,1)*90,44,1);
    s.material.opacity=.26+hash2(i,5)*.2;
    scene.add(s);
    anims.push({u:(t)=>{s.position.y=cy+10+Math.sin(t*.14+i)*5;}});
  }
}
function addBeacon(wx,wy,wz){
  const pivot=new THREE.Group();pivot.position.set(wx,wy,wz);
  const beam=new THREE.Mesh(new THREE.BoxGeometry(70,1.2,1.2),
    new THREE.MeshBasicMaterial({color:0xfff2b8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  beam.position.x=35;pivot.add(beam);scene.add(pivot);
  anims.push({u:(t)=>{pivot.rotation.y=t*.9;beam.material.opacity=nightAmt*.5;}});
}
function addSeaplane(wx,wz){
  const g=new THREE.Group();
  const b=new Batch();
  b.add(PRIM.sph,0xf2f3f4,0,0,0,0,7.5,2.4,2.6);          /* fuselage */
  b.add(PRIM.box,0xf2c744,0,1,0,0,1.6,1.2,9.4);          /* wing     */
  b.add(PRIM.box,0xf2f3f4,-3.4,1.2,0,0,1.6,1.6,3.6);     /* tail     */
  b.add(PRIM.box,0xd94f54,-3.6,2,0,0,1.4,1.6,.4);
  for(const s of[-1,1]){
    b.add(PRIM.box,0xd0d2d4,.4,-2,s*1.6,0,6.4,.7,.9);    /* floats   */
    b.add(PRIM.cyl,0x9aa0a6,.4,-1.2,s*1.6,0,.3,1.4,.3);
  }
  g.add(b.build(MAT.opaque,true));
  const prop=new THREE.Mesh(new THREE.BoxGeometry(.3,4.6,.5),new THREE.MeshLambertMaterial({color:0x3a3a3e}));
  prop.position.set(3.9,0,0);g.add(prop);
  scene.add(g);
  const wy=CFG.seaY;
  anims.push({u:(t)=>{
    const T=(t*.025)%1;               /* 40 s circuit */
    let alt,spd;
    const a=T*TAU;
    const R=T<.25?60+T*4*60:120;      /* spiral out then cruise */
    if(T<.18){alt=.8;}                 /* taxi   */
    else if(T<.34){alt=.8+(T-.18)/.16*46;} /* climb */
    else if(T<.9){alt=48+Math.sin(T*20)*2;} /* cruise */
    else{alt=48-(T-.9)/.1*47;}
    g.position.set(wx+Math.cos(a)*R,wy+alt,wz+Math.sin(a)*R);
    g.rotation.y=-a-Math.PI/2;
    g.rotation.z=T>.18&&T<.9?-.25:0;
    prop.rotation.x=t*40;
  }});
}
/* birds */
function addBirds(){
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array([-1.6,0,.4, 0,0,-.6, 0,0,.2,  1.6,0,.4, 0,0,-.6, 0,0,.2]);
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.computeVertexNormals();
  const flocks=[[CITY.van.x+60,CITY.van.py+120,CITY.van.z-120],[CITY.sf.x-160,CITY.sf.py+90,CITY.sf.z-100],
    [CITY.mia.x+120,CITY.mia.py+70,CITY.mia.z+90],[CITY.ny.x+200,CITY.ny.py+110,CITY.ny.z+300],
    [CITY.mex.x+280,CITY.mex.py+230,CITY.mex.z+230]];
  const n=flocks.length*8;
  const im=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:0x2a2a30,side:THREE.DoubleSide}),n);
  im.frustumCulled=false;scene.add(im);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),EU=new THREE.Euler(),V=new THREE.Vector3(),SC=new THREE.Vector3(1,1,1);
  anims.push({u:(t)=>{
    let k=0;
    for(let f=0;f<flocks.length;f++){
      const[fx,fy,fz]=flocks[f];
      for(let i=0;i<8;i++){
        const a=t*.35+i*.8+f*2,r=26+i*4;
        V.set(fx+Math.cos(a)*r,fy+Math.sin(t*.9+i)*6+i*1.5,fz+Math.sin(a)*r);
        EU.set(0,-a,Math.sin(t*9+i)*.5);Q.setFromEuler(EU);
        M.compose(V,Q,SC);im.setMatrixAt(k++,M);
      }
    }
    im.instanceMatrix.needsUpdate=true;
  }});
}

/* hot-air balloons drifting over the continent */
function addBalloons(){
  const spots=[
    [CITY.mex.x+150,CITY.mex.z-120],[CITY.ny.x-180,CITY.ny.z+160],[CITY.van.x+220,CITY.van.z+180],
    [CITY.kc.x-160,CITY.kc.z+220],[CITY.atl.x+120,CITY.atl.z-200],[CITY.la.x+260,CITY.la.z-80],
    [CITY.dal.x+200,CITY.dal.z-160],
  ];
  const COLS=[0xd94f54,0xf2c744,0x3f7fd9,0x3fa66a,0xd977b8,0xf2905a,0x35c4d0];
  spots.forEach((s,i)=>{
    const g=new THREE.Group();
    const env=new THREE.Mesh(new THREE.SphereGeometry(9,12,10),
      new THREE.MeshLambertMaterial({color:COLS[i%7],flatShading:true}));
    env.scale.y=1.15;g.add(env);
    const band=new THREE.Mesh(new THREE.SphereGeometry(9.15,12,4,0,TAU,Math.PI*.38,Math.PI*.2),
      new THREE.MeshLambertMaterial({color:0xf0ede4,flatShading:true}));
    band.scale.y=1.15;g.add(band);
    const basket=new THREE.Mesh(new THREE.BoxGeometry(3.4,2.6,3.4),
      new THREE.MeshLambertMaterial({color:0x7a5a3a,flatShading:true}));
    basket.position.y=-13.6;g.add(basket);
    for(const q of[[1,1],[1,-1],[-1,1],[-1,-1]]){
      const c=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,4.6,3),
        new THREE.MeshBasicMaterial({color:0x4a4038}));
      c.position.set(q[0]*1.4,-10.8,q[1]*1.4);g.add(c);
    }
    g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
    scene.add(g);
    const ph=hash2(i,9)*TAU,R=80+hash2(i,4)*100,alt=130+hash2(i,6)*90;
    anims.push({u:(t)=>{
      const a=t*.02+ph;
      g.position.set(s[0]+Math.cos(a)*R,alt+Math.sin(t*.3+ph)*8,s[1]+Math.sin(a)*R);
      g.rotation.y=t*.05+ph;
    }});
  });
}

/* ============================================================
   CITY ASSEMBLY
   ============================================================ */
const EXTRA_COL={ /* big landmark cones: [lx,lz,r,h] */
  mex:[[240,170,115,180],[-150,40,17,12]],
  mty:[[-230,-40,120,140]],
  la:[[170,-95,85,50]],
  sea:[[150,-60,10,60]],
  tor:[[140,-20,10,110]],
  atl:[[110,80,15,32]],
  hou:[[150,20,8,60]],
};
function buildCity(city){
  CUR=city;
  const group=new THREE.Group();
  group.position.set(city.x,city.py,city.z);
  const ctx={
    city,group,
    O:new Batch(),G:new Batch(),E:new Batch(),
    S:{O:new Batch(),G:new Batch(),E:new Batch()},
    smoke:[],flood:[],
    yAt:(lx,lz)=>terrainH(city.x+lx,city.z+lz)-city.py,
    wx:lx=>city.x+lx, wz:lz=>city.z+lz,
    col:(lx,lz,r,h)=>addCollider(city.x+lx,city.z+lz,r,h,city.py),
    tree:(type,lx,lz,s,c)=>{
      const wx=city.x+lx,wz=city.z+lz;
      treeReq[type].push({x:wx,z:wz,y:terrainH(wx,wz),s,c});
    },
  };
  STADIUM_BUILDERS[city.id](ctx);
  const sGroup=new THREE.Group();
  sGroup.rotation.y=city.rot;
  group.add(sGroup);
  buildBowlInterior(ctx,sGroup);
  LANDMARKS[city.id](ctx);

  /* --- common festive dressing --- */
  const b=ctx.bowl;
  for(let i=0;i<10;i++){
    const a=i/10*TAU;
    const v=new THREE.Vector3(Math.cos(a)*(b.rOutX+22),0,Math.sin(a)*(b.rOutZ+22)).applyAxisAngle(Y,city.rot);
    ctx.O.add(PRIM.cyl,0xd0d2d4,v.x,6.5,v.z,0,.7,13,.7);
    const hue=[0xe8b84b,0xd94f54,0x3fa66a,0x3f7fd9,0xe8e6df,0xd977b8,0x35c4d0,0xf2905a][i%8];
    flagField.flag(city.x+v.x,city.py+10.2,city.z+v.z,a+.8,5.5,3.4,hue,0xe8e6df);
    if(i%2===0){
      const v2=new THREE.Vector3(Math.cos(a+TAU/10)*(b.rOutX+22),0,Math.sin(a+TAU/10)*(b.rOutZ+22)).applyAxisAngle(Y,city.rot);
      flagField.bunting(city.x+v.x,city.py+12,city.z+v.z,city.x+v2.x,city.py+12,city.z+v2.z,10);
    }
  }
  /* streetlights on the plaza, with warm pools of light at night */
  for(let i=0;i<6;i++){
    const a=i/6*TAU+.3;
    const x=Math.cos(a)*130,z=Math.sin(a)*112;
    ctx.O.add(PRIM.cyl,0x8a8e94,x,4,z,0,.5,8,.5);
    ctx.E.add(PRIM.sph,0xffd98a,x,8.4,z,0,1.6,1.2,1.6);
    ctx.E.add(PRIM.disc,0x5c4a1e,x,.3,z,0,12,.1,12);
  }
  /* flower beds between the lights */
  {
    const FLW=[0xe86a8a,0xf2c744,0xe8e6df,0xd94f54,0x9a7ad0];
    for(let i=0;i<6;i++){
      const a=i/6*TAU+.82;
      const x=Math.cos(a)*128,z=Math.sin(a)*110;
      ctx.O.add(PRIM.disc,0x4a3a2c,x,.3,z,0,9,.5,6);
      for(let f=0;f<8;f++){
        const fx=x+(hash2(f,i)-.5)*7,fz=z+(hash2(i,f*3)-.5)*4.5;
        ctx.O.add(PRIM.sph,FLW[(f+i)%5],fx,.75,fz,0,.75,.55,.75);
      }
      ctx.O.add(PRIM.sph,0x4d8a44,x+1.5,.7,z+1,0,1.1,.7,1.1);
      ctx.O.add(PRIM.sph,0x4d8a44,x-2,.68,z-1,0,.9,.6,.9);
    }
  }
  /* festival village: striped market tents ringing the stadium */
  {
    const entA=Math.atan2(Math.cos(city.rot),Math.sin(city.rot)); /* entrance bearing */
    const TENT=[0xd94f54,0x3f7fd9,0xf2c744,0x3fa66a,0xd977b8];
    const R1=Math.max(b.rOutX,b.rOutZ)+42;
    for(let i=0;i<9;i++){
      const a=i/9*TAU+.22;
      let da=Math.abs(a-((entA+TAU)%TAU));da=Math.min(da,TAU-da);
      if(da<.55)continue;                       /* keep the gate approach clear */
      const x=Math.cos(a)*R1+ (hash2(i,city.x)-.5)*14;
      const z=Math.sin(a)*(R1*.86)+(hash2(i,city.z)-.5)*14;
      const yaw=hash2(i,3)*TAU;
      ctx.O.add(PRIM.box,0xf0ede4,x,1.4,z,yaw,5.4,2.8,5.4);
      ctx.O.add(PRIM.cone4,TENT[i%5],x,4.6,z,yaw+Math.PI/4,8.4,3.8,8.4);
      ctx.O.add(PRIM.cyl,0x9a8f80,x,6.8,z,0,.22,2.4,.22);
      flagField.flag(city.x+x,city.py+7.6,city.z+z,yaw,2.6,1.6,TENT[(i+2)%5],0xe8e6df);
    }
  }
  /* build batches */
  const mo=ctx.O.build(MAT.opaque,true);if(mo)group.add(mo);
  const mg=ctx.G.build(MAT.glass,false);if(mg)group.add(mg);
  const me=ctx.E.build(MAT.glow,false);if(me)group.add(me);
  const so=ctx.S.O.build(MAT.opaque,true);if(so)sGroup.add(so);
  const sg=ctx.S.G.build(MAT.glass,false);if(sg)sGroup.add(sg);
  const se=ctx.S.E.build(MAT.glow,false);if(se)sGroup.add(se);
  scene.add(group);

  /* entrance in world space */
  const ent=ctx.entranceLocal.clone().applyAxisAngle(Y,city.rot);
  ent.x+=city.x;ent.z+=city.z;ent.y=city.py;
  stadiums[city.id]={
    city,center:new THREE.Vector3(city.x,city.py+b.pitchY,city.z),
    entrance:ent,bowl:b,rot:city.rot,group,sGroup,seats:ctx.seats,fans:ctx.fans,nets:ctx.nets,insideExitLocal:ctx.insideExitLocal,
    flood:ctx.flood.map(f=>{const v=new THREE.Vector3(f[0],f[1],f[2]).applyAxisAngle(Y,city.rot);
      return new THREE.Vector3(v.x+city.x,v.y+city.py,v.z+city.z);}),
  };
  /* landmark colliders */
  (EXTRA_COL[city.id]||[]).forEach(c=>addCollider(city.x+c[0],city.z+c[1],c[2],c[3],city.py));
  /* deferred effects */
  ctx.smoke.forEach(s=>addSmoke({...s,x:city.x+s.x,z:city.z+s.z,y:city.py+s.y}));
  if(ctx.rain)addRain(city.x+ctx.rain.x,city.z+ctx.rain.z,city.py);
  if(ctx.fountain)addFountain(city.x+ctx.fountain.x,city.z+ctx.fountain.z,city.py);
  if(ctx.confetti)addConfetti(city.x+ctx.confetti.x,city.z+ctx.confetti.z,city.py,ctx.confetti.r*.5);
  if(ctx.seaplane)addSeaplane(ctx.seaplane.x,ctx.seaplane.z);
  if(ctx.fogBank)addFogBank(city.x+ctx.fogBank.x,city.z+ctx.fogBank.z,city.py+20,ctx.fogBank.yaw);
  if(ctx.beacon)addBeacon(city.x+ctx.beacon.x,city.py+ctx.beacon.y,city.z+ctx.beacon.z);
  CUR=null;
  return group;
}

const cityGroups=[];
for(const c of CITIES)cityGroups.push(buildCity(c));
addBirds();
addBalloons();

/* Pass 19 — authored Azteca match-night layer. */
const aztecaMatch={lights:[],targets:[],savedDayT:null,active:false,feedbackT:0};
{
  const st=stadiums.mex;
  const upAxis=new THREE.Vector3(0,1,0);
  const target=new THREE.Object3D();target.position.set(st.center.x,st.city.py+st.bowl.pitchY+.5,st.center.z);scene.add(target);
  const localLights=[[-47,31,-34],[-47,31,34],[47,31,-34],[47,31,34]];
  for(const p of localLights){
    const v=new THREE.Vector3(p[0],p[1],p[2]).applyAxisAngle(upAxis,st.rot);
    const L=new THREE.SpotLight(0xeaf4ff,0,170,Math.PI*.23,.48,1.25);
    L.position.set(st.center.x+v.x,st.city.py+st.bowl.pitchY+v.y,st.center.z+v.z);L.target=target;
    L.castShadow=false;scene.add(L);aztecaMatch.lights.push(L);
    const bank=new THREE.Mesh(new THREE.BoxGeometry(4.2,1.25,.35),new THREE.MeshBasicMaterial({color:0xeef7ff,toneMapped:false}));
    bank.position.copy(L.position);bank.lookAt(target.position);scene.add(bank);
  }
  /* slim in-world challenge board beside the spot: no floating instruction card. */
  const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const g=cv.getContext('2d');
  g.fillStyle='#071126';g.fillRect(0,0,1024,256);g.fillStyle='#e8b84b';g.fillRect(0,0,12,256);
  g.font='800 50px Segoe UI, sans-serif';g.fillStyle='#fff';g.fillText('PENALTY SHOOTOUT',54,78);
  g.font='700 22px Segoe UI, sans-serif';g.fillStyle='#e8b84b';g.fillText('5 KICKS  •  AIM  •  HOLD SPACE  •  RELEASE',56,130);
  g.font='600 18px Segoe UI, sans-serif';g.fillStyle='#aebbea';g.fillText('A / D adds curve while charging',56,176);
  g.font='800 22px Segoe UI, sans-serif';g.fillStyle='#fff';g.fillText('STEP INTO THE GOLD RING',56,218);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(10.5,2.62),new THREE.MeshBasicMaterial({map:t,toneMapped:false}));
  const sw=[0,0];fromStadLocal(st,13.4,-6.8,sw);sign.position.set(sw[0],st.city.py+st.bowl.pitchY+2.1,sw[1]);sign.rotation.y=st.rot+Math.PI/2;scene.add(sign);
  aztecaMatch.sign=sign;
}

/* Pass 20 — authored SoFi premiere-night lighting and arrival architecture. */
const laPremiere={lights:[],targets:[],beams:[],savedDayT:null,active:false,screenT:0};
{
  const st=stadiums.la,targetBase=new THREE.Vector3(st.center.x,st.city.py+st.bowl.pitchY+2,st.center.z);
  const localLights=[[-68,18,-47],[-68,18,47],[68,18,-47],[68,18,47]];
  for(let i=0;i<localLights.length;i++){
    const p=localLights[i],v=new THREE.Vector3(p[0],p[1],p[2]).applyAxisAngle(Y,st.rot);
    const target=new THREE.Object3D();target.position.copy(targetBase);scene.add(target);
    const L=new THREE.SpotLight(i%2?0x9fe9ff:0xffe1a0,0,220,Math.PI*.19,.62,1.05);
    L.position.set(st.center.x+v.x,st.city.py+st.bowl.pitchY+v.y,st.center.z+v.z);L.target=target;L.castShadow=false;scene.add(L);
    laPremiere.lights.push(L);laPremiere.targets.push(target);
    const bank=new THREE.Mesh(new THREE.BoxGeometry(3.8,1,.34),new THREE.MeshBasicMaterial({color:i%2?0xcaf5ff:0xffe8b0,toneMapped:false}));
    bank.position.copy(L.position);bank.lookAt(target.position);scene.add(bank);
  }
  /* exterior premiere arch, aligned with the real stadium entrance. */
  const ent=st.entrance,dir=new THREE.Vector3().subVectors(st.center,ent);dir.y=0;dir.normalize();
  const side=new THREE.Vector3(-dir.z,0,dir.x),archPos=ent.clone().addScaledVector(dir,-7),yaw=Math.atan2(dir.x,dir.z);
  const g=new THREE.Group();g.position.copy(archPos);g.rotation.y=yaw;scene.add(g);
  const B=new Batch(),E=new Batch();
  for(const x of[-7.2,7.2])B.add(PRIM.box,0xf1f2f2,x,4,0,0,.75,8,.75);
  B.add(PRIM.box,0xe7e9eb,0,8.05,0,0,15.2,.75,.9);
  E.add(PRIM.box,0x7fd8ff,0,7.58,-.52,0,13.2,.11,.12);
  E.add(PRIM.box,0xffd97a,0,8.54,.52,0,13.2,.08,.1);
  const bm=B.build(MAT.opaque,true),em=E.build(MAT.glow,false);if(bm)g.add(bm);if(em)g.add(em);
  const tx=textTex('LOS ANGELES  •  PREMIERE NIGHT','#ffffff','#101a30','850 54px "Segoe UI",sans-serif',1024,128);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(12.8,1.6),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));sign.position.set(0,8.05,-.52);g.add(sign);
  laPremiere.arch=g;laPremiere.archPos=archPos;laPremiere.archSide=side;
  /* a double-sided in-bowl premiere slate suspended beneath the Oculus. */
  const sc=document.createElement('canvas');sc.width=1024;sc.height=256;const sg=sc.getContext('2d');
  const grd=sg.createLinearGradient(0,0,1024,0);grd.addColorStop(0,'#10244a');grd.addColorStop(.5,'#151a35');grd.addColorStop(1,'#401b39');sg.fillStyle=grd;sg.fillRect(0,0,1024,256);
  sg.fillStyle='#7fd8ff';sg.fillRect(0,0,1024,8);sg.fillStyle='#ffd97a';sg.fillRect(0,248,1024,8);
  sg.textAlign='center';sg.fillStyle='#fff';sg.font='900 66px "Segoe UI",sans-serif';sg.fillText('LOS ANGELES',512,104);
  sg.fillStyle='#ffd97a';sg.font='750 27px "Segoe UI",sans-serif';sg.fillText('QUARTERFINAL  •  PREMIERE NIGHT',512,164);
  sg.fillStyle='#aeeeff';sg.font='650 19px "Segoe UI",sans-serif';sg.fillText('THE WORLD IS WATCHING',512,210);
  const stx=new THREE.CanvasTexture(sc);stx.colorSpace=THREE.SRGBColorSpace;
  const slate=new THREE.Mesh(new THREE.PlaneGeometry(13.8,3.45),new THREE.MeshBasicMaterial({map:stx,toneMapped:false,side:THREE.DoubleSide}));
  slate.position.set(st.center.x,st.city.py+st.bowl.pitchY+17.1,st.center.z);slate.rotation.y=st.rot;scene.add(slate);laPremiere.slate=slate;
}

/* Pass 21 — New York / New Jersey Final Night authored layer. */
const nyFinal={lights:[],targets:[],savedDayT:null,active:false,t:0,flashers:[],arch:null,scoreboard:null};
{
  const st=stadiums.ny,targetBase=new THREE.Vector3(st.center.x,st.city.py+st.bowl.pitchY+1.7,st.center.z);
  const localLights=[[-70,34,-48],[-70,34,48],[70,34,-48],[70,34,48],[0,38,-59],[0,38,59]];
  for(let i=0;i<localLights.length;i++){
    const p=localLights[i],v=new THREE.Vector3(p[0],p[1],p[2]).applyAxisAngle(Y,st.rot);
    const target=new THREE.Object3D();target.position.copy(targetBase);scene.add(target);
    const L=new THREE.SpotLight(i%3===1?0xffd98a:0xdcecff,0,245,Math.PI*.205,.52,1.05);
    L.position.set(st.center.x+v.x,st.city.py+st.bowl.pitchY+v.y,st.center.z+v.z);
    L.target=target;L.castShadow=false;scene.add(L);
    nyFinal.lights.push(L);nyFinal.targets.push(target);
    const bank=new THREE.Mesh(new THREE.BoxGeometry(4.6,1.15,.38),
      new THREE.MeshBasicMaterial({color:i%3===1?0xffe3a2:0xecf6ff,toneMapped:false}));
    bank.position.copy(L.position);bank.lookAt(target.position);scene.add(bank);
  }

  /* Champions Avenue: environmental guidance from the plaza to the actual gate. */
  const ent=st.entrance,dir=new THREE.Vector3().subVectors(st.center,ent);dir.y=0;dir.normalize();
  const side=new THREE.Vector3(-dir.z,0,dir.x),archPos=ent.clone().addScaledVector(dir,-9),yaw=Math.atan2(dir.x,dir.z);
  const arch=new THREE.Group();arch.position.copy(archPos);arch.rotation.y=yaw;scene.add(arch);
  const B=new Batch(),E=new Batch();
  for(const x of[-8.4,8.4]){
    B.add(PRIM.box,0xc7cbd0,x,5,0,0,1.05,10,1.05);
    E.add(PRIM.box,x<0?0x7fd8ff:0xffd97a,x,5,-.6,0,.16,8.2,.12);
  }
  B.add(PRIM.box,0xe0e2e5,0,10.1,0,0,18.2,1.0,1.15);
  E.add(PRIM.box,0xffd97a,0,9.48,-.64,0,15.6,.12,.12);
  E.add(PRIM.box,0x7fd8ff,0,10.7,.64,0,15.6,.09,.1);
  const bm=B.build(MAT.opaque,true),em=E.build(MAT.glow,false);if(bm)arch.add(bm);if(em)arch.add(em);
  const at=textTex('THE FINAL  •  NEW YORK / NEW JERSEY','#ffffff','#0a1229','900 58px "Segoe UI",sans-serif',1280,144);
  const as=new THREE.Mesh(new THREE.PlaneGeometry(15.8,1.78),new THREE.MeshBasicMaterial({map:at,toneMapped:false}));
  as.position.set(0,10.08,-.66);arch.add(as);nyFinal.arch=arch;

  const avenue=new THREE.Group();scene.add(avenue);
  for(let i=0;i<12;i++){
    const d=16+i*6.3,center=ent.clone().addScaledVector(dir,-d);
    for(const s of[-1,1]){
      const p=center.clone().addScaledVector(side,s*6.1);
      const base=new THREE.Mesh(new THREE.CylinderGeometry(.2,.28,2.4,10),new THREE.MeshLambertMaterial({color:0x7e8792}));
      base.position.set(p.x,st.city.py+1.2,p.z);base.castShadow=true;avenue.add(base);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),new THREE.MeshBasicMaterial({
        color:s<0?0x7fd8ff:0xffd97a,transparent:true,opacity:.92,toneMapped:false}));
      cap.position.set(p.x,st.city.py+2.55,p.z);avenue.add(cap);
    }
  }

  /* In-bowl final scoreboard — spectacle, not instructions. */
  const cv=document.createElement('canvas');cv.width=1280;cv.height=360;const g=cv.getContext('2d');
  const grd=g.createLinearGradient(0,0,1280,0);grd.addColorStop(0,'#08132d');grd.addColorStop(.5,'#182747');grd.addColorStop(1,'#20162b');
  g.fillStyle=grd;g.fillRect(0,0,1280,360);g.fillStyle='#7fd8ff';g.fillRect(0,0,1280,9);g.fillStyle='#ffd97a';g.fillRect(0,351,1280,9);
  g.textAlign='center';g.fillStyle='#fff';g.font='900 82px "Segoe UI",sans-serif';g.fillText('THE FINAL',640,139);
  g.fillStyle='#ffd97a';g.font='800 31px "Segoe UI",sans-serif';g.fillText('NEW YORK / NEW JERSEY  •  CONTINENTAL ’26',640,209);
  g.fillStyle='#bfd0f6';g.font='650 23px "Segoe UI",sans-serif';g.fillText('ONE MATCH  •  ONE TROPHY  •  ONE LAST MOMENT',640,274);
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  const board=new THREE.Mesh(new THREE.PlaneGeometry(16.6,4.68),new THREE.MeshBasicMaterial({map:tx,toneMapped:false,side:THREE.DoubleSide}));
  board.position.set(st.center.x,st.city.py+st.bowl.pitchY+21.4,st.center.z);board.rotation.y=st.rot;scene.add(board);nyFinal.scoreboard=board;

  /* Quiet, physical game sign beside the penalty ring. */
  const sc=document.createElement('canvas');sc.width=1024;sc.height=256;const sg=sc.getContext('2d');
  sg.fillStyle='#071126';sg.fillRect(0,0,1024,256);sg.fillStyle='#ffd97a';sg.fillRect(0,0,12,256);
  sg.font='900 52px "Segoe UI",sans-serif';sg.fillStyle='#fff';sg.fillText('FINAL PRESSURE',54,78);
  sg.font='760 22px "Segoe UI",sans-serif';sg.fillStyle='#ffd97a';sg.fillText('FIVE KICKS  •  THE WORLD IS WATCHING',56,130);
  sg.font='620 18px "Segoe UI",sans-serif';sg.fillStyle='#b9c8ec';sg.fillText('Aim  •  hold SPACE  •  A / D adds curve',56,176);
  sg.font='850 22px "Segoe UI",sans-serif';sg.fillStyle='#fff';sg.fillText('STEP INTO THE GOLD RING',56,219);
  const stx=new THREE.CanvasTexture(sc);stx.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(10.8,2.7),new THREE.MeshBasicMaterial({map:stx,toneMapped:false}));
  const sw=[0,0];fromStadLocal(st,13.3,-6.7,sw);sign.position.set(sw[0],st.city.py+st.bowl.pitchY+2.12,sw[1]);sign.rotation.y=st.rot+Math.PI/2;scene.add(sign);

  /* Tiny spectator-camera flashes around the bowl. */
  const flashTex=softTex(64,'rgba(255,250,218,.92)','rgba(255,246,205,0)');
  for(let i=0;i<22;i++){
    const a=i/22*TAU+hash2(i,811)*.15,r=48+hash2(i,813)*17;
    const v=new THREE.Vector3(Math.cos(a)*r,8+hash2(i,817)*13,Math.sin(a)*r).applyAxisAngle(Y,st.rot);
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:flashTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
    spr.position.set(st.center.x+v.x,st.city.py+st.bowl.pitchY+v.y,st.center.z+v.z);spr.scale.set(1.8,1.8,1);scene.add(spr);
    nyFinal.flashers.push(spr);
  }
}

/* Pass 22 — Dallas / AT&T Stadium: enclosed-event scale and Power Play. */
const dallasEvent={lights:[],targets:[],savedDayT:null,active:false,t:0,halo:null,haloMat:null,pulse:0};
{
  const st=stadiums.dal,targetBase=new THREE.Vector3(st.center.x,st.city.py+st.bowl.pitchY+1.4,st.center.z);
  const localLights=[[-67,37,-43],[-67,37,43],[67,37,-43],[67,37,43],[0,43,-48],[0,43,48]];
  for(let i=0;i<localLights.length;i++){
    const p=localLights[i],v=new THREE.Vector3(p[0],p[1],p[2]).applyAxisAngle(Y,st.rot);
    const target=new THREE.Object3D();target.position.copy(targetBase);scene.add(target);
    const L=new THREE.SpotLight(i<4?0xe6f2ff:0x7fd8ff,0,250,Math.PI*.19,.52,1.05);
    L.position.set(st.center.x+v.x,st.city.py+st.bowl.pitchY+v.y,st.center.z+v.z);
    L.target=target;L.castShadow=false;scene.add(L);dallasEvent.lights.push(L);dallasEvent.targets.push(target);
  }

  /* Monumental entrance portal and low floor studs do all arrival guidance. */
  const ent=st.entrance,dir=new THREE.Vector3().subVectors(st.center,ent);dir.y=0;dir.normalize();
  const side=new THREE.Vector3(-dir.z,0,dir.x),portalPos=ent.clone().addScaledVector(dir,-8),yaw=Math.atan2(dir.x,dir.z);
  const portal=new THREE.Group();portal.position.copy(portalPos);portal.rotation.y=yaw;scene.add(portal);
  const B=new Batch(),E=new Batch();
  for(const x of[-9.2,9.2]){B.add(PRIM.box,0xaeb5bc,x,6,0,0,1.45,12,1.55);E.add(PRIM.box,0x7fd8ff,x,6,-.82,0,.15,10,.12);}
  B.add(PRIM.box,0xd5d9dd,0,12.1,0,0,20,1.2,1.7);E.add(PRIM.box,0xeaf6ff,0,11.35,-.9,0,17.4,.14,.13);
  const bm=B.build(MAT.opaque,true),em=E.build(MAT.glow,false);if(bm)portal.add(bm);if(em)portal.add(em);
  const pt=textTex('DALLAS  •  AT&T STADIUM','#ffffff','#101d36','900 58px "Segoe UI",sans-serif',1280,144);
  const ps=new THREE.Mesh(new THREE.PlaneGeometry(16.8,1.9),new THREE.MeshBasicMaterial({map:pt,toneMapped:false}));ps.position.set(0,12.08,-.92);portal.add(ps);
  for(let i=0;i<13;i++){
    const c=ent.clone().addScaledVector(dir,-15-i*6.2);
    for(const s of[-1,1]){
      const p=c.clone().addScaledVector(side,s*5.4);
      const stud=new THREE.Mesh(new THREE.CylinderGeometry(.25,.31,.12,12),new THREE.MeshBasicMaterial({color:0x7fd8ff,toneMapped:false}));
      stud.position.set(p.x,st.city.py+.18,p.z);scene.add(stud);
    }
  }

  /* The Texas Halo: a four-sided suspended screen, intentionally oversized. */
  const cv=document.createElement('canvas');cv.width=1280;cv.height=360;const g=cv.getContext('2d');
  const grad=g.createLinearGradient(0,0,1280,0);grad.addColorStop(0,'#08152b');grad.addColorStop(.5,'#16345d');grad.addColorStop(1,'#09172d');
  g.fillStyle=grad;g.fillRect(0,0,1280,360);g.fillStyle='#dbeaff';g.fillRect(0,0,1280,9);g.fillStyle='#7fd8ff';g.fillRect(0,351,1280,9);
  g.textAlign='center';g.fillStyle='#fff';g.font='900 78px "Segoe UI",sans-serif';g.fillText('POWER PLAY',640,137);
  g.fillStyle='#8fdfff';g.font='800 30px "Segoe UI",sans-serif';g.fillText('DALLAS  •  SEMIFINAL NIGHT',640,205);
  g.fillStyle='#c9d5e7';g.font='650 22px "Segoe UI",sans-serif';g.fillText('CONTROL THE POWER  •  OWN THE MOMENT',640,274);
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  const haloMat=new THREE.MeshBasicMaterial({map:tx,toneMapped:false,side:THREE.DoubleSide,color:0xffffff});dallasEvent.haloMat=haloMat;
  const halo=new THREE.Group();halo.position.set(st.center.x,st.city.py+st.bowl.pitchY+20.8,st.center.z);halo.rotation.y=st.rot;scene.add(halo);
  for(const rz of[0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(17.5,4.9),haloMat);panel.rotation.y=rz;panel.position.set(Math.sin(rz)*7.4,0,Math.cos(rz)*7.4);halo.add(panel);
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(10.4,.22,8,48),new THREE.MeshBasicMaterial({color:0x7fd8ff,toneMapped:false}));ring.rotation.x=Math.PI/2;halo.add(ring);
  dallasEvent.halo=halo;

  /* A physical pitch-side marker; the live prompt remains only “E Power Play”. */
  const signTex=textTex('POWER PLAY  •  FIVE SHOTS','#ffffff','#0b1830','900 54px "Segoe UI",sans-serif',1024,128);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(9.8,1.65),new THREE.MeshBasicMaterial({map:signTex,toneMapped:false}));
  const sw=[0,0];fromStadLocal(st,13.2,-6.7,sw);sign.position.set(sw[0],st.city.py+st.bowl.pitchY+1.5,sw[1]);sign.rotation.y=st.rot+Math.PI/2;scene.add(sign);
}

/* Pass 23 — Miami Tropical Festival: sunset canopy and Neon Crossbar. */
const miamiFestival={lights:[],targets:[],edgeMats:[],savedDayT:null,active:false,t:0,pulse:0};
{
  const st=stadiums.mia,targetBase=new THREE.Vector3(st.center.x,st.city.py+st.bowl.pitchY+1.4,st.center.z);
  const colors=[0x35e0d2,0xff6f91,0xffd27a,0x9b7bff];
  const localLights=[[-62,34,-45],[-62,34,45],[62,34,-45],[62,34,45]];
  for(let i=0;i<localLights.length;i++){
    const p=localLights[i],v=new THREE.Vector3(p[0],p[1],p[2]).applyAxisAngle(Y,st.rot);
    const target=new THREE.Object3D();target.position.copy(targetBase);scene.add(target);
    const L=new THREE.SpotLight(colors[i],0,220,Math.PI*.2,.62,1.05);
    L.position.set(st.center.x+v.x,st.city.py+st.bowl.pitchY+v.y,st.center.z+v.z);L.target=target;scene.add(L);
    miamiFestival.lights.push(L);miamiFestival.targets.push(target);
  }

  /* Palm-lined sunset promenade with low light shells instead of UI arrows. */
  const ent=st.entrance,dir=new THREE.Vector3().subVectors(st.center,ent);dir.y=0;dir.normalize();
  const side=new THREE.Vector3(-dir.z,0,dir.x),gatePos=ent.clone().addScaledVector(dir,-7),yaw=Math.atan2(dir.x,dir.z);
  const gate=new THREE.Group();gate.position.copy(gatePos);gate.rotation.y=yaw;scene.add(gate);
  const B=new Batch(),E=new Batch();
  for(const x of[-8,8]){B.add(PRIM.cyl,0xf4eee2,x,4.6,0,0,.7,9.2,.7);E.add(PRIM.ring,x<0?0x35e0d2:0xff6f91,x,8.9,0,0,1.5,.22,1.5);}
  B.add(PRIM.box,0xf3eee4,0,9.2,0,0,17,.65,1);E.add(PRIM.box,0xffd27a,0,8.75,-.55,0,14.5,.12,.12);
  const bm=B.build(MAT.opaque,true),em=E.build(MAT.glow,false);if(bm)gate.add(bm);if(em)gate.add(em);
  const gt=textTex('MIAMI  •  TROPICAL NIGHT','#ffffff','#11344b','900 58px "Segoe UI",sans-serif',1280,144);
  const gs=new THREE.Mesh(new THREE.PlaneGeometry(14.8,1.7),new THREE.MeshBasicMaterial({map:gt,toneMapped:false}));gs.position.set(0,9.15,-.57);gate.add(gs);
  for(let i=0;i<11;i++){
    const c=ent.clone().addScaledVector(dir,-15-i*6.4);
    for(const s of[-1,1]){
      const p=c.clone().addScaledVector(side,s*5.6);
      const shell=new THREE.Mesh(new THREE.SphereGeometry(.28,10,7),new THREE.MeshBasicMaterial({color:s<0?0x35e0d2:0xff6f91,toneMapped:false}));
      shell.position.set(p.x,st.city.py+.35,p.z);scene.add(shell);
    }
  }

  /* Four luminous canopy ribbons form one restrained music visualizer. */
  for(let i=0;i<4;i++){
    const mat=new THREE.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.42,toneMapped:false});miamiFestival.edgeMats.push(mat);
    const strip=new THREE.Mesh(new THREE.BoxGeometry(i<2?88:.18,.16,i<2?.18:56),mat);
    const local=i===0?[0,31.2,-28.6]:i===1?[0,31.2,28.6]:i===2?[-44.2,31.2,0]:[44.2,31.2,0];
    const v=new THREE.Vector3(local[0],local[1],local[2]).applyAxisAngle(Y,st.rot);strip.position.set(st.center.x+v.x,st.city.py+v.y,st.center.z+v.z);strip.rotation.y=st.rot;scene.add(strip);
  }
  const signTex=textTex('NEON CROSSBAR','#ffffff','#12364c','900 58px "Segoe UI",sans-serif',1024,128);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(9.2,1.55),new THREE.MeshBasicMaterial({map:signTex,toneMapped:false}));
  const sw=[0,0];fromStadLocal(st,-4.8,13.7,sw);sign.position.set(sw[0],st.city.py+st.bowl.pitchY+1.48,sw[1]);sign.rotation.y=st.rot;scene.add(sign);
}

/* Pass 24 — Seattle Rain City: wet steel, glass, and supporter pressure. */
const seattleRain={lights:[],targets:[],savedDayT:null,active:false,t:0,pulse:0,wetMats:[]};
{
  const st=stadiums.sea,targetBase=new THREE.Vector3(st.center.x,st.city.py+st.bowl.pitchY+1.5,st.center.z);
  const localLights=[[-60,36,-42],[-60,36,42],[60,36,-42],[60,36,42]];
  for(let i=0;i<localLights.length;i++){
    const p=localLights[i],v=new THREE.Vector3(p[0],p[1],p[2]).applyAxisAngle(Y,st.rot);
    const target=new THREE.Object3D();target.position.copy(targetBase);scene.add(target);
    const L=new THREE.SpotLight(i%2?0x5acb5a:0xb9e7ff,0,225,Math.PI*.19,.66,1.08);
    L.position.set(st.center.x+v.x,st.city.py+st.bowl.pitchY+v.y,st.center.z+v.z);L.target=target;scene.add(L);
    seattleRain.lights.push(L);seattleRain.targets.push(target);
  }
  const ent=st.entrance,dir=new THREE.Vector3().subVectors(st.center,ent);dir.y=0;dir.normalize();
  const side=new THREE.Vector3(-dir.z,0,dir.x);
  const gatePos=ent.clone().addScaledVector(dir,-7),yaw=Math.atan2(dir.x,dir.z),gate=new THREE.Group();gate.position.copy(gatePos);gate.rotation.y=yaw;scene.add(gate);
  const B=new Batch(),E=new Batch();
  for(const x of[-7.6,7.6]){B.add(PRIM.box,0x68747d,x,5.2,0,0,1,10.4,1);E.add(PRIM.box,x<0?0x68b8ff:0x5acb5a,x,5.2,-.58,0,.13,8.6,.12);}
  B.add(PRIM.box,0xaeb8bf,0,10.45,0,0,16.2,.8,1.1);const bm=B.build(MAT.opaque,true),em=E.build(MAT.glow,false);if(bm)gate.add(bm);if(em)gate.add(em);
  const tx=textTex('SEATTLE  •  RAIN CITY','#ffffff','#102330','900 58px "Segoe UI",sans-serif',1280,144);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(13.8,1.55),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));sign.position.set(0,10.42,-.62);gate.add(sign);
  /* Reflective pavement strips lead to the actual entrance. */
  for(let i=0;i<12;i++){
    const c=ent.clone().addScaledVector(dir,-15-i*6.1);
    for(const s of[-1,1]){
      const p=c.clone().addScaledVector(side,s*4.8),mat=new THREE.MeshPhysicalMaterial({color:s<0?0x4c95c9:0x398d54,roughness:.18,metalness:.05,clearcoat:.8,transparent:true,opacity:.74});
      const tile=new THREE.Mesh(new THREE.BoxGeometry(.7,.08,2.8),mat);tile.position.set(p.x,st.city.py+.16,p.z);tile.rotation.y=yaw;scene.add(tile);seattleRain.wetMats.push(mat);
    }
  }
  const gameTex=textTex('RAIN RUN','#ffffff','#112932','900 62px "Segoe UI",sans-serif',1024,128);
  const gameSign=new THREE.Mesh(new THREE.PlaneGeometry(8.2,1.4),new THREE.MeshBasicMaterial({map:gameTex,toneMapped:false}));
  const sw=[0,0];fromStadLocal(st,-17,-8.2,sw);gameSign.position.set(sw[0],st.city.py+st.bowl.pitchY+1.42,sw[1]);gameSign.rotation.y=st.rot;scene.add(gameSign);
}

/* ============================================================
   THE PROMENADE: golden road on the ground, park fabric between lands
   ============================================================ */
{
  const PO=new Batch(),PE=new Batch(),PV=new Batch();
  const ROUTES=[];
  for(let i=0;i<RIBBON_ORDER.length-1;i++)ROUTES.push([RIBBON_ORDER[i],RIBBON_ORDER[i+1],true]);
  [['van','sea'],['sea','sf'],['sf','la'],['gdl','mex'],['mex','mty'],['mty','dal'],
   ['hou','dal'],['hou','atl'],['tor','kc'],['tor','ny'],['phi','ny'],['phi','kc']]
   .forEach(s=>ROUTES.push([s[0],s[1],false]));
  const TENT=[0xd94f54,0x3f7fd9,0xf2c744,0x3fa66a,0xd977b8];
  ROUTES.forEach(([a,b,gold],si)=>{
    const A=CITY[a],B=CITY[b];
    const dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz);
    const ux=dx/L,uz=dz/L,px=-uz,pz=ux;
    const ry=-Math.atan2(uz,ux);
    const w=gold?11:7;
    const step=26;
    for(let t=130/L;t<1-130/L;t+=step/L){
      const x=A.x+dx*t,z=A.z+dz*t;
      const h=terrainH(x,z);
      if(h<1.5)continue;
      PV.add(PRIM.box,gold?0xd9c9a2:0xc9c2b0,x,h+.22,z,ry,step+2,.4,w);
      if(gold)PE.add(PRIM.box,0x6a5a26,x,h+.5,z,ry,step+2,.1,1.6);
      const k=Math.round(t*L/step);
      if(k%3===0){
        const s=(k%6===0)?1:-1;
        const lx=x+px*s*(w/2+2),lz=z+pz*s*(w/2+2);
        PO.add(PRIM.cyl,0x8a8e94,lx,h+3.5,lz,0,.45,7,.45);
        PE.add(PRIM.sph,0xffd98a,lx,h+7.3,lz,0,1.3,1,1.3);
        PE.add(PRIM.disc,0x574618,lx,h+.55,lz,0,9,.1,9);
      }
      if(k%2===1){
        const s=(k%4===1)?1:-1;
        const tx=x+px*s*(w/2+9),tz=z+pz*s*(w/2+9);
        const cc=new THREE.Color(0x5d9152);
        cc.offsetHSL((hash2(si,k)-.5)*.08,0,(hash2(k,si*3)-.5)*.1);
        treeReq[z>250?'palm':(z<-200?'con':'leaf')].push({x:tx,z:tz,y:terrainH(tx,tz),s:.8+hash2(k,si)*.5,c:cc});
      }
    }
    /* mid-route rest plaza, with an archway gate on the golden road */
    const mx=A.x+dx*.5,mz=A.z+dz*.5,mh=terrainH(mx,mz);
    if(mh>1.5){
      PV.add(PRIM.disc,0xcfc4ac,mx,mh+.28,mz,0,gold?56:36,.3,gold?56:36);
      if(gold){
        for(const s of[-1,1]){
          PO.add(PRIM.box,0xe3d8bc,mx+px*s*10,mh+7,mz+pz*s*10,ry,2.6,14,2.6);
          PE.add(PRIM.box,0xffd97a,mx+px*s*10,mh+14.3,mz+pz*s*10,ry,3,1,3);
          addCollider(mx+px*s*10,mz+pz*s*10,1.8,14,mh);
        }
        PO.add(PRIM.box,0xe3d8bc,mx,mh+15,mz,ry,4,2.4,23);
        flagField.bunting(mx+px*10,mh+14,mz+pz*10,mx-px*10,mh+14,mz-pz*10,8);
        for(let q=0;q<4;q++){
          const a2=q/4*TAU+.6;
          const sx2=mx+Math.cos(a2)*38,sz2=mz+Math.sin(a2)*38;
          const hh=terrainH(sx2,sz2);
          PO.add(PRIM.box,0xf0ede4,sx2,hh+1.3,sz2,a2,4.6,2.6,4.6);
          PO.add(PRIM.cone4,TENT[(q+si)%5],sx2,hh+4.2,sz2,a2+Math.PI/4,7,3.2,7);
          addCollider(sx2,sz2,3.4,5,hh);
        }
        addFountain(mx,mz,mh);
      }
    }
  });
  const pm=PO.build(MAT.opaque,true);if(pm)scene.add(pm);
  const pv=PV.build(MAT.paved,true);if(pv)scene.add(pv);
  const pe=PE.build(MAT.glow,false);if(pe)scene.add(pe);
}

/* ---------------- night glow halos on the big emitters ---------------- */
const glowSprites=[];
let glowLevel=1;
function addGlow(x,y,z,scale,color){
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,
    opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  s.position.set(x,y,z);s.scale.set(scale,scale,1);
  scene.add(s);glowSprites.push(s);
}
for(const id in stadiums){
  const st=stadiums[id];
  st.flood.slice(0,2).forEach(f=>addGlow(f.x,f.y+2,f.z,st.flood.length>1?20:34,0xa8cdf5));
}
addGlow(CITY.ny.x,CITY.ny.py+101,CITY.ny.z,46,0xffd97a);   /* the trophy */

/* ---------------- night fireworks over the knockout cities ---------------- */
const fireworks=[];
{
  const FW=[0xffd97a,0xff6a5a,0x7fd8ff,0xd977b8,0x9fff9a];
  for(let k=0;k<3;k++){
    const n=130,g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
    const p=new THREE.Points(g,new THREE.PointsMaterial({color:0xffd97a,size:1.6,map:dotTex,
      transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    p.frustumCulled=false;scene.add(p);
    const vel=[];for(let i=0;i<n;i++)vel.push(new THREE.Vector3());
    fireworks.push({mesh:p,vel,t:-1,n,
      fire(x,y,z,color){
        this.t=0;p.material.color.setHex(color);
        const a=g.attributes.position.array;
        for(let i=0;i<this.n;i++){
          a[i*3]=x;a[i*3+1]=y;a[i*3+2]=z;
          const az=hash2(i,x)*TAU,el=Math.acos(2*hash2(i,y)-1);
          const sp=8+hash2(i,z)*8;
          this.vel[i].set(sp*Math.sin(el)*Math.cos(az),sp*Math.cos(el),sp*Math.sin(el)*Math.sin(az));
        }
      },
      u(dt){
        if(this.t<0)return;
        this.t+=dt;
        const a=g.attributes.position.array;
        for(let i=0;i<this.n;i++){
          this.vel[i].y-=6*dt;
          a[i*3]+=this.vel[i].x*dt;a[i*3+1]+=this.vel[i].y*dt;a[i*3+2]+=this.vel[i].z*dt;
        }
        g.attributes.position.needsUpdate=true;
        p.material.opacity=Math.max(0,.9*(1-this.t/2.3));
        if(this.t>2.3)this.t=-1;
      }});
  }
  let fwT=2;
  const KO=CITIES.filter(c=>c.ko);
  anims.push({u:(t,dt)=>{
    for(const f of fireworks)f.u(dt);
    if(nightAmt<.5||phase!=='play')return;
    fwT-=dt;
    if(fwT<=0){
      fwT=3.5+Math.random()*4;
      const f=fireworks.find(f2=>f2.t<0);
      if(f){
        const c=KO[Math.floor(Math.random()*KO.length)];
        f.fire(c.x+(Math.random()-.5)*140,c.py+130+Math.random()*70,
               c.z+(Math.random()-.5)*140,FW[Math.floor(Math.random()*FW.length)]);
      }
    }
  }});
}
/* ============================================================
   THE GRAND CIRCUIT: a coaster through all sixteen bowls
   ============================================================ */
const TOUR=['van','sea','sf','la','gdl','mex','mty','hou','mia','atl','phi','ny','bos','tor','kc','dal'];
const THROUGH=new Set(TOUR);
/* Track profiles are authored per stadium rather than relying on one magic height.
   "open" and "gap" routes dive through a clear centerline; "dive" routes clear a
   roof ring/canopy before dropping through its opening; "over" routes clear the
   complete roof silhouette with a real safety margin. */
const TRACK_PROFILE={
  van:{kind:'open',center:13,rim:22,opening:38}, sea:{kind:'gap',center:11,rim:34,opening:44,offsetZ:12},
  sf:{kind:'gap',center:11,rim:32,opening:44}, la:{kind:'dive',center:14,rim:48,opening:42},
  gdl:{kind:'dive',center:12,rim:48,opening:38,axis:'z'}, mex:{kind:'dive',center:12,rim:53,opening:49,axis:'z'},
  mty:{kind:'open',center:13,rim:24,opening:38,axis:'z'}, hou:{kind:'gap',center:12,rim:30,opening:40},
  mia:{kind:'dive',center:14,rim:49,opening:36}, atl:{kind:'dive',center:14,rim:45,opening:30},
  phi:{kind:'gap',center:11,rim:37,opening:43}, ny:{kind:'open',center:11,rim:36,opening:44},
  bos:{kind:'open',center:11,rim:39,opening:43,axis:'z'}, tor:{kind:'gap',center:11,rim:35,opening:41},
  kc:{kind:'open',center:11,rim:36,opening:44,axis:'z'}, dal:{kind:'open',center:14,rim:25,opening:42},
};
function trackAxisFor(c,prev,next){
  /* Stadium builders live in local space. Most traversals use the pitch's long
     axis; a venue can opt into its local Z axis when a signature structure sits
     on the end line (Gillette's lighthouse/bridge). */
  const pr=TRACK_PROFILE[c.id]||{},co=Math.cos(c.rot),si=Math.sin(c.rot);
  const axis=pr.axis==='z'?new THREE.Vector3(si,0,co):new THREE.Vector3(co,0,-si);
  const route=new THREE.Vector3(next.x-prev.x,0,next.z-prev.z).normalize();
  if(axis.dot(route)<0)axis.negate();
  return axis;
}
function inStadiumEnvelope(x,z,margin=12){
  for(const c of CITIES){
    const st=stadiums[c.id];if(!st)continue;
    const dx=x-c.x,dz=z-c.z,co=Math.cos(c.rot),si=Math.sin(c.rot);
    const lx=co*dx-si*dz,lz=si*dx+co*dz;
    const rx=st.bowl.rOutX+margin,rz=st.bowl.rOutZ+margin;
    if((lx*lx)/(rx*rx)+(lz*lz)/(rz*rz)<1)return true;
  }
  return false;
}
function makeStationMarqueeTex(city){
  const cv=document.createElement('canvas');cv.width=512;cv.height=192;
  const g=cv.getContext('2d');
  const bg=g.createLinearGradient(0,0,0,192);bg.addColorStop(0,'#17274c');bg.addColorStop(1,'#071126');
  g.fillStyle=bg;g.fillRect(0,0,512,192);
  g.strokeStyle='#e8b84b';g.lineWidth=6;g.strokeRect(8,8,496,176);
  g.fillStyle='#e8b84b';g.font='700 18px "Segoe UI",sans-serif';g.textAlign='center';g.fillText('G R A N D   C I R C U I T',256,42);
  g.fillStyle='#fff';g.font='800 38px "Segoe UI",sans-serif';g.fillText(city.name.toUpperCase(),256,96);
  g.fillStyle='#aebbe6';g.font='600 17px "Segoe UI",sans-serif';g.fillText('BOARDING  •  ALL-PARK TOUR',256,132);
  g.fillStyle='#ffd97a';g.fillRect(116,153,280,4);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
const coaster=(()=>{
  const pts=[],stations=[],entryFar=[];
  const n=TOUR.length;
  /* A normalized clearance field for routing station spurs and connector legs. */
  function stadiumNorm(x,z,c,margin=30){
    const st=stadiums[c.id],dx=x-c.x,dz=z-c.z,co=Math.cos(c.rot),si=Math.sin(c.rot);
    const lx=co*dx-si*dz,lz=si*dx+co*dz;
    const rx=st.bowl.rOutX+margin,rz=st.bowl.rOutZ+margin;
    return Math.sqrt((lx*lx)/(rx*rx)+(lz*lz)/(rz*rz));
  }
  function segmentClearance(A,B,margin=22,steps=18){
    let best=1e9;
    for(let k=0;k<=steps;k++){
      const t=k/steps,x=lerp(A.x,B.x,t),z=lerp(A.z,B.z,t);
      for(const c of CITIES)best=Math.min(best,stadiumNorm(x,z,c,margin));
    }
    return best;
  }
  function maxTerrainAlong(A,B,steps=14){
    let h=-1e9;
    for(let k=0;k<=steps;k++){
      const t=k/steps;h=Math.max(h,terrainH(lerp(A.x,B.x,t),lerp(A.z,B.z,t)));
    }
    return h;
  }
  /* Entry/exit reach contracts automatically when neighboring cities are close.
     This prevents one city's far approach from intruding into the next bowl. */
  for(let i=0;i<n;i++){
    const c=CITY[TOUR[i]],prev=CITY[TOUR[(i+n-1)%n]],next=CITY[TOUR[(i+1)%n]];
    const dir=trackAxisFor(c,prev,next),st=stadiums[c.id],pr=TRACK_PROFILE[c.id];
    const outer=st?(pr.axis==='z'?st.bowl.rOutZ:st.bowl.rOutX):76;
    const co=Math.cos(c.rot),si=Math.sin(c.rot);
    const localX=new THREE.Vector3(co,0,-si),localZ=new THREE.Vector3(si,0,co);
    const anchor=new THREE.Vector3(c.x,c.py,c.z)
      .addScaledVector(localX,pr.offsetX||0).addScaledVector(localZ,pr.offsetZ||0);
    const prevDist=Math.hypot(c.x-prev.x,c.z-prev.z),nextDist=Math.hypot(next.x-c.x,next.z-c.z);
    const entryD=Math.max(outer+26,Math.min(outer+72,prevDist*.46));
    const exitD=Math.max(outer+26,Math.min(outer+72,nextDist*.46));
    const farY=c.py+(pr.kind==='over'?pr.roof+4:pr.rim+13);
    const p=new THREE.Vector3(anchor.x-dir.x*entryD,farY,anchor.z-dir.z*entryD);
    const leadD=entryD+22;
    const lead=new THREE.Vector3(anchor.x-dir.x*leadD,farY+4,anchor.z-dir.z*leadD);
    entryFar.push({c,dir,outer,pr,anchor,entryD,exitD,p,lead});
  }
  function chooseStation(info,farOut){
    const {c,dir,outer,exitD}=info;
    const side=new THREE.Vector3(-dir.z,0,dir.x);
    const lateral=outer*.72+30,fwd=Math.max(outer+36,exitD-12);
    const candidates=[];
    for(const sign of[-1,1])for(const fd of[fwd,outer+30,outer+10])for(const lm of[1,1.35]){
      const x=c.x+dir.x*fd+side.x*sign*lateral*lm;
      const z=c.z+dir.z*fd+side.z*sign*lateral*lm;
      candidates.push(new THREE.Vector3(x,Math.max(terrainH(x,z)+5,CFG.seaY+5),z));
    }
    let best=candidates[0],bestScore=-1e9;
    for(const P of candidates){
      let point=1e9;for(const other of CITIES)point=Math.min(point,stadiumNorm(P.x,P.z,other,30));
      const path=segmentClearance(farOut,P,20);
      const dry=terrainH(P.x,P.z)>1.5?5:-30;
      const score=Math.min(point,path)*10+dry-Math.hypot(P.x-farOut.x,P.z-farOut.z)*.004;
      if(score>bestScore){bestScore=score;best=P;}
    }
    return best;
  }
  for(let i=0;i<n;i++){
    const info=entryFar[i],{c,dir,outer,pr,anchor,p:entry}=info;
    const nextEntry=entryFar[(i+1)%n];
    const add=(d,y)=>pts.push(new THREE.Vector3(anchor.x+dir.x*d,c.py+y,anchor.z+dir.z*d));
    /* The lead point forces the spline to settle onto the venue axis before it
       reaches any roof or bowl geometry. */
    pts.push(info.lead.clone(),entry.clone());
    if(pr.kind==='over'){
      add(-(outer+18),pr.roof);
      add(-Math.max(30,outer*.45),pr.roof+4);
      add(0,pr.roof+7);
      add(Math.max(30,outer*.45),pr.roof+4);
      add(outer+18,pr.roof);
    }else{
      const center=pr.center,opening=pr.opening;
      add(-(outer+14),pr.rim);
      if(pr.kind==='dive'){
        add(-(opening+8),pr.rim-1);
        add(-(opening-10),center+8);
      }else add(-opening,center+6);
      add(0,center);
      if(pr.kind==='dive'){
        add(opening-10,center+8);
        add(opening+8,pr.rim-1);
      }else add(opening,center+6);
      add(outer+14,pr.rim);
    }
    const farOutY=c.py+(pr.kind==='over'?pr.roof+4:pr.rim+10);
    const farOut=new THREE.Vector3(anchor.x+dir.x*info.exitD,farOutY,anchor.z+dir.z*info.exitD);
    pts.push(farOut);
    const stationPoint=chooseStation(info,farOut);
    /* Flatten the spline through the station so it cannot undershoot the lawn. */
    const inDir=stationPoint.clone().sub(farOut);inDir.y=0;
    if(inDir.lengthSq()<1)inDir.copy(dir);else inDir.normalize();
    const stationIn=stationPoint.clone().addScaledVector(inDir,-18);
    stationIn.y=Math.max(terrainH(stationIn.x,stationIn.z)+7,stationPoint.y+1.2);
    /* Leave the platform by moving farther away from the venue, then climb at
       that safe x/z position. Long connector legs can pass over scenery, never
       through it. */
    const away=stationPoint.clone().sub(new THREE.Vector3(c.x,stationPoint.y,c.z));away.y=0;
    if(away.lengthSq()<1)away.set(-dir.z,0,dir.x);else away.normalize();
    const stationOut=stationPoint.clone().addScaledVector(away,22);
    stationOut.y=Math.max(terrainH(stationOut.x,stationOut.z)+7,stationPoint.y+1.2);
    const lift=stationPoint.clone().addScaledVector(away,34);
    const dx=nextEntry.lead.x-lift.x,dz=nextEntry.lead.z-lift.z,L=Math.max(1,Math.hypot(dx,dz));
    const px=-dz/L,pz=dx/L;
    function obstacleClearance(A,B){
      let clear=1e9;
      for(let q=0;q<=20;q++){
        const t=q/20,x=lerp(A.x,B.x,t),z=lerp(A.z,B.z,t);
        /* Catmull-Rom rounds beyond its control polygon, so keep a generous
           horizontal buffer around scenery instead of merely clearing its mesh. */
        for(const col of colliders)clear=Math.min(clear,Math.hypot(x-col.x,z-col.z)-col.r-26);
      }
      return clear;
    }
    let connector=null,bestConnectorScore=-1e9;
    for(const offset of[0,-54,54,-90,90,-132,132]){
      const cand=new THREE.Vector3((lift.x+nextEntry.lead.x)*.5+px*offset,0,(lift.z+nextEntry.lead.z)*.5+pz*offset);
      const clear=Math.min(obstacleClearance(lift,cand),obstacleClearance(cand,nextEntry.lead));
      const score=clear-Math.abs(offset)*.035;
      if(score>bestConnectorScore){bestConnectorScore=score;connector=cand;}
    }
    const routeTerrain=Math.max(maxTerrainAlong(lift,connector),maxTerrainAlong(connector,nextEntry.lead));
    /* Keep connectors brisk and close to the park. Terrain still wins when it
       genuinely needs clearance, but ordinary legs no longer climb into the sky. */
    const cruiseY=Math.max(74,routeTerrain+26,stationPoint.y+32,nextEntry.lead.y+5);
    lift.y=cruiseY;connector.y=cruiseY+1+hash2(i,49)*4;
    pts.push(stationIn,stationPoint,stationOut,lift,connector);
    stations.push({id:c.id,x:stationPoint.x,y:stationPoint.y,z:stationPoint.z});
  }
  /* Centripetal interpolation avoids the overshoot and self-kinks produced by
     a low-tension uniform Catmull-Rom on unevenly spaced control points. */
  const curve=new THREE.CatmullRomCurve3(pts,true,'centripetal');
  curve.arcLengthDivisions=3600;curve.updateArcLengths();
  const len=curve.getLength();
  const SAMP=1800;
  const sp=[];for(let i=0;i<=SAMP;i++)sp.push(curve.getPointAt(i/SAMP));
  stations.forEach(st=>{
    let bu=0,bd=1e9;const v=new THREE.Vector3(st.x,st.y,st.z);
    for(let i=0;i<=SAMP;i++){const d=sp[i].distanceToSquared(v);if(d<bd){bd=d;bu=i/SAMP;}}
    st.u=bu;
    /* Platform and interaction coordinates are snapped to the final curve, not
       the authored control point, so the train never appears beside its rails. */
    const p=sp[Math.round(bu*SAMP)];st.x=p.x;st.y=p.y;st.z=p.z;
  });
  /* Horizon-safe track frames. A pure rotation-minimising frame can accumulate
     roll around a long closed spline; that is what let the train slowly become
     upside down even though the centerline contained no intentional inversion.

     Here the rail up-vector is rebuilt from world up at every sample. On the
     rare near-vertical section, the previous frame is parallel-transported
     through the singularity, then naturally settles upright again. The result
     can still bank like a coaster, but it cannot acquire an accidental 180°
     roll over the course of the lap. */
  const tans=[],sides=[],ups=[];
  const worldUp=new THREE.Vector3(0,1,0),qTransport=new THREE.Quaternion();
  const projectedUp=new THREE.Vector3(),transportedSide=new THREE.Vector3();
  for(let i=0;i<SAMP;i++){
    const ip=(i-1+SAMP)%SAMP,inext=(i+1)%SAMP;
    const t=new THREE.Vector3().subVectors(sp[inext],sp[ip]).normalize();
    tans.push(t);
  }
  for(let i=0;i<SAMP;i++){
    const t=tans[i];
    projectedUp.copy(worldUp).addScaledVector(t,-worldUp.dot(t));
    let side,up;
    if(projectedUp.lengthSq()>.018){
      projectedUp.normalize();
      side=new THREE.Vector3().crossVectors(t,projectedUp).normalize();
      up=new THREE.Vector3().crossVectors(side,t).normalize();
    }else if(i>0){
      /* Near a vertical tangent world-up projection is undefined. Preserve the
         previous orientation only for this short interval—never for the whole lap. */
      qTransport.setFromUnitVectors(tans[i-1],t);
      transportedSide.copy(sides[i-1]).applyQuaternion(qTransport);
      transportedSide.addScaledVector(t,-transportedSide.dot(t));
      if(transportedSide.lengthSq()<1e-5)transportedSide.crossVectors(t,new THREE.Vector3(0,0,1));
      side=transportedSide.normalize().clone();
      up=new THREE.Vector3().crossVectors(side,t).normalize();
      /* Keep the chosen half-space continuous while passing the vertical point. */
      if(up.dot(ups[i-1])<0){side.negate();up.negate();}
    }else{
      side=new THREE.Vector3().crossVectors(t,new THREE.Vector3(0,0,1));
      if(side.lengthSq()<1e-5)side.set(1,0,0);else side.normalize();
      up=new THREE.Vector3().crossVectors(side,t).normalize();
    }
    sides.push(side);ups.push(up);
  }
  /* Add restrained physical banking from local curvature. Because the unbanked
     frame is horizon-safe, this ±24° bank cannot carry the train through 90° or
     invert the rider. Every rail, tie, support, train and seat uses this frame. */
  for(let i=0;i<SAMP;i++){
    const ip=(i-1+SAMP)%SAMP,inext=(i+1)%SAMP;
    const cr=new THREE.Vector3().crossVectors(tans[ip],tans[inext]);
    const turn=Math.atan2(ups[i].dot(cr),clamp(tans[ip].dot(tans[inext]),-1,1));
    const bank=clamp(-turn*8.5,-.42,.42);
    sides[i].applyAxisAngle(tans[i],bank);
    ups[i].applyAxisAngle(tans[i],bank);
  }
  sides[SAMP]=sides[0].clone();ups[SAMP]=ups[0].clone();tans[SAMP]=tans[0].clone();
  function frameAt(u,tOut=new THREE.Vector3(),sOut=new THREE.Vector3(),uOut=new THREE.Vector3()){
    const f=((u%1)+1)%1*SAMP,i=Math.floor(f),j=(i+1)%SAMP,a=f-i;
    tOut.copy(tans[i]).lerp(tans[j],a).normalize();
    sOut.copy(sides[i]).lerp(sides[j],a);sOut.addScaledVector(tOut,-sOut.dot(tOut)).normalize();
    uOut.crossVectors(sOut,tOut).normalize();
    return{tangent:tOut,side:sOut,up:uOut};
  }
  /* Station architecture follows the final rail tangent. Keeping platforms and
     signs axis-aligned was another source of apparent track/model clipping. */
  {
    const t=new THREE.Vector3(),sd=new THREE.Vector3(),u=new THREE.Vector3();
    stations.forEach(st=>{
      frameAt(st.u,t,sd,u);
      const th=new THREE.Vector3(t.x,0,t.z);if(th.lengthSq()<1e-5)th.set(1,0,0);else th.normalize();
      const sh=new THREE.Vector3(sd.x,0,sd.z);if(sh.lengthSq()<1e-5)sh.set(-th.z,0,th.x);else sh.normalize();
      st.tx=th.x;st.tz=th.z;st.sx=sh.x;st.sz=sh.z;
      st.yaw=Math.atan2(-th.z,th.x);
      st.dismountX=st.x+sh.x*4.6;st.dismountZ=st.z+sh.z*4.6;
    });
  }
  /* knockout route, rebuilt locally (the sky ribbon is created later) */
  const ribCurve=new THREE.CatmullRomCurve3(
    RIBBON_ORDER.map(id=>{const c=CITY[id];return new THREE.Vector3(c.x,c.py+95,c.z);}),
    false,'catmullrom',.35);
  const rib=[];for(let i=0;i<=160;i++)rib.push(ribCurve.getPointAt(i/160));
  const railMat=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.82,roughness:.3,envMapIntensity:1.15});
  const railGeo=new THREE.CylinderGeometry(.19,.19,1,10,1,false);railGeo.rotateZ(Math.PI/2);
  const rails=new THREE.InstancedMesh(railGeo,railMat,SAMP*2);
  const spineMat=new THREE.MeshStandardMaterial({color:0x59616a,metalness:.7,roughness:.42,envMapIntensity:.75});
  const spine=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.24,.34),spineMat,SAMP);
  const ties=new THREE.InstancedMesh(new THREE.BoxGeometry(.9,.18,3.7),new THREE.MeshLambertMaterial({color:0x707780}),Math.floor(SAMP/3)+2);
  const supMat=new THREE.MeshLambertMaterial({color:0x9da5ae});
  const supCols=new THREE.InstancedMesh(new THREE.CylinderGeometry(.5,.68,1,8),supMat,420);
  const supCaps=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),supMat,210);
  const gold=new THREE.Color(0xe8b84b),silver=new THREE.Color(0xe4e8ec);
  const M=new THREE.Matrix4(),MID=new THREE.Vector3(),PA=new THREE.Vector3(),PB=new THREE.Vector3();
  const X=new THREE.Vector3(),Yv=new THREE.Vector3(),Zv=new THREE.Vector3(),top=new THREE.Vector3();
  let ri=0,spi=0,ti=0,ci=0,bi=0;
  function segmentMatrix(a,b,side,up,out,extra=.14){
    X.subVectors(b,a);const segLen=X.length();X.normalize();
    Zv.copy(side).addScaledVector(X,-side.dot(X)).normalize();
    Yv.crossVectors(Zv,X).normalize();Zv.crossVectors(X,Yv).normalize();
    out.makeBasis(X.clone().multiplyScalar(segLen+extra),Yv,Zv);
    out.setPosition((a.x+b.x)*.5,(a.y+b.y)*.5,(a.z+b.z)*.5);
  }
  for(let i=0;i<SAMP;i++){
    MID.addVectors(sp[i],sp[i+1]).multiplyScalar(.5);
    let isGold=false;
    for(const r of rib){if(MID.distanceToSquared(r)<6400){isGold=true;break;}}
    for(const s of[-1,1]){
      PA.copy(sp[i]).addScaledVector(sides[i],s*1.16).addScaledVector(ups[i],.16);
      PB.copy(sp[i+1]).addScaledVector(sides[i+1],s*1.16).addScaledVector(ups[i+1],.16);
      segmentMatrix(PA,PB,sides[i],ups[i],M,.18);
      rails.setMatrixAt(ri,M);rails.setColorAt(ri,isGold?gold:silver);ri++;
    }
    PA.copy(sp[i]).addScaledVector(ups[i],-.34);
    PB.copy(sp[i+1]).addScaledVector(ups[i+1],-.34);
    segmentMatrix(PA,PB,sides[i],ups[i],M,.16);spine.setMatrixAt(spi++,M);
    if(i%3===0){
      M.makeBasis(tans[i],ups[i],sides[i]);
      M.setPosition(sp[i].x+ups[i].x*.02,sp[i].y+ups[i].y*.02,sp[i].z+ups[i].z*.02);
      ties.setMatrixAt(ti++,M);
    }
    if(i%13===0&&ci+2<=420&&bi<210){
      top.copy(sp[i]).addScaledVector(ups[i],-.78);
      let blocked=inStadiumEnvelope(top.x,top.z,16);
      if(!blocked){for(const st of stations){if((top.x-st.x)**2+(top.z-st.z)**2<22*22){blocked=true;break;}}}
      if(!blocked){for(const col of colliders){const rr=col.r+3;if((top.x-col.x)**2+(top.z-col.z)**2<rr*rr){blocked=true;break;}}}
      if(!blocked){
        const feet=[];let valid=true;
        for(const s of[-1,1]){
          const fx=top.x+sides[i].x*s*2.45,fz=top.z+sides[i].z*s*2.45;
          const g=Math.max(terrainH(fx,fz),CFG.seaY);
          const h=top.y-g;
          if(h<4||h>180){valid=false;break;}
          feet.push({x:fx,z:fz,g,h});
        }
        if(valid){
          for(const f of feet){
            M.identity();M.makeScale(1,f.h,1);M.setPosition(f.x,f.g+f.h*.5,f.z);
            supCols.setMatrixAt(ci++,M);
          }
          M.makeBasis(sides[i].clone().multiplyScalar(5.5),ups[i].clone().multiplyScalar(.34),tans[i].clone().multiplyScalar(.52));
          M.setPosition(top.x,top.y-.16,top.z);supCaps.setMatrixAt(bi++,M);
        }
      }
    }
  }
  rails.count=ri;spine.count=spi;ties.count=ti;supCols.count=ci;supCaps.count=bi;
  for(const im of[rails,spine,ties,supCols,supCaps])im.instanceMatrix.needsUpdate=true;
  if(rails.instanceColor)rails.instanceColor.needsUpdate=true;
  scene.add(spine);scene.add(rails);scene.add(ties);scene.add(supCols);scene.add(supCaps);
  /* boarding stations — full attraction architecture, not bare platforms */
  const SB=new Batch(),SG=new Batch(),SE=new Batch();
  stations.forEach(st=>{
    const city=CITY[st.id],signX=st.x+st.sx*7.2,signZ=st.z+st.sz*7.2;
    const wx=(lx,lz)=>st.x+st.tx*lx+st.sx*lz,wz=(lx,lz)=>st.z+st.tz*lx+st.sz*lz;
    /* raised deck, safety strip, platform spine and tactile edge */
    SB.add(PRIM.box,0xcfc4ac,st.x,st.y-1.55,st.z,st.yaw,16,1.5,10);
    SB.add(PRIM.box,0x59616a,wx(0,-4.45),st.y-.74,wz(0,-4.45),st.yaw,16,.16,.55);
    SE.add(PRIM.box,0xffd97a,wx(0,-4.15),st.y-.58,wz(0,-4.15),st.yaw,15.5,.08,.17);
    /* canopy with a glazed center strip */
    for(const lx of[-6.5,6.5])for(const lz of[-3.8,3.8])
      SB.add(PRIM.cyl,0x69727e,wx(lx,lz),st.y+2.65,wz(lx,lz),0,.28,6.8,.28);
    SB.add(PRIM.box,0x202b43,st.x,st.y+6.05,st.z,st.yaw,16.5,.45,10.5);
    SG.add(PRIM.box,0x91b9d4,st.x,st.y+6.28,st.z,st.yaw,8.8,.12,10.1);
    for(const lz of[-4.75,4.75])SE.add(PRIM.box,0xffd97a,st.x+st.sx*lz,st.y+5.78,st.z+st.sz*lz,st.yaw,15.8,.09,.12);
    /* queue rails: two switchback lanes on the landward side */
    for(const lz of[1.15,3.05,4.7]){
      for(let lx=-6;lx<=6;lx+=2)SB.add(PRIM.cyl,0xb9c0c8,wx(lx,lz),st.y+.15,wz(lx,lz),0,.09,1.9,.09);
      SB.add(PRIM.box,0x8e98a4,wx(0,lz),st.y+.55,wz(0,lz),st.yaw,12.3,.09,.09);
      SB.add(PRIM.box,0x8e98a4,wx(0,lz),st.y+1.25,wz(0,lz),st.yaw,12.3,.09,.09);
    }
    /* turnstiles and operator booth */
    for(const lx of[-2.1,0,2.1]){
      SB.add(PRIM.cyl,0x9099a4,wx(lx,1.9),st.y+.3,wz(lx,1.9),0,.32,1.25,.32);
      SB.add(PRIM.box,0xd9dde2,wx(lx,1.9),st.y+.9,wz(lx,1.9),st.yaw,1.55,.1,.1,0,.45);
    }
    SB.add(PRIM.box,0x27344a,wx(5.4,2.7),st.y+1.15,wz(5.4,2.7),st.yaw,2.2,2.5,2.7);
    SG.add(PRIM.box,0x8fc0dc,wx(5.38,1.28),st.y+1.55,wz(5.38,1.28),st.yaw,1.75,1.15,.08);
    /* illuminated city pylon */
    SB.add(PRIM.box,0x24304e,signX,st.y+1.9,signZ,st.yaw,.65,4.8,5.7);
    SE.add(PRIM.box,0xffd97a,signX,st.y+4.2,signZ,st.yaw,.72,.32,5.95);
    addCollider(signX,signZ,1.35,5,st.y);
    const tex=makeStationMarqueeTex(city);
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(5.25,1.97),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
    panel.position.set(signX+st.sx*.36,st.y+2.3,signZ+st.sz*.36);panel.rotation.y=st.yaw+Math.PI/2;scene.add(panel);
    /* overhead platform number and directional chevrons */
    for(const side of[-1,1]){
      const cx=wx(side*5.9,-3.85),cz=wz(side*5.9,-3.85);
      SE.add(PRIM.box,side<0?0x7fd8ff:0xffd97a,cx,st.y+.2,cz,st.yaw,2.25,.06,.42);
    }
    const hx=Math.abs(Math.cos(st.yaw))*8+Math.abs(Math.sin(st.yaw))*5;
    const hz=Math.abs(Math.sin(st.yaw))*8+Math.abs(Math.cos(st.yaw))*5;
    platforms.push({x0:st.x-hx,x1:st.x+hx,z0:st.z-hz,z1:st.z+hz,y:st.y-.8});
    const footX=st.x-st.tx*10,footZ=st.z-st.tz*10,g0=terrainH(footX,footZ);
    const steps=Math.max(2,Math.ceil((st.y-.8-g0)/.82));
    for(let k=1;k<=steps;k++){
      const sy=g0+k*(st.y-.8-g0)/steps;
      const d=8+(steps-k+.5)*1.35;
      const cx=st.x-st.tx*d,cz=st.z-st.tz*d;
      SB.add(PRIM.box,0xbfb9ab,cx,sy-.38,cz,st.yaw,1.5,.76,6.4);
      for(const q of[-1,1])SB.add(PRIM.cyl,0x8d959f,cx+st.sx*q*2.8,sy+.48,cz+st.sz*q*2.8,0,.08,1.7,.08);
      const shx=Math.abs(Math.cos(st.yaw))*.75+Math.abs(Math.sin(st.yaw))*3.2;
      const shz=Math.abs(Math.sin(st.yaw))*.75+Math.abs(Math.cos(st.yaw))*3.2;
      platforms.push({x0:cx-shx,x1:cx+shx,z0:cz-shz,z1:cz+shz,y:sy});
    }
  });
  const sm=SB.build(MAT.opaque,true);if(sm)scene.add(sm);
  const sg=SG.build(MAT.glass,false);if(sg)scene.add(sg);
  const se=SE.build(MAT.glow,false);if(se)scene.add(se);
  /* the biggest drop, for the ride photo */
  let uDrop=.5,best=0,minTerrainClear=1e9,maxTrackY=-1e9,overIntrusions=0,corridorMisses=0,colliderIntrusions=0;
  const bowlPasses=new Set();
  const corridorMissCities=new Set(),colliderHits=[];
  let minUprightAlignment=1,invertedFrameSamples=0;
  for(let i=0;i<SAMP;i++){
    projectedUp.copy(worldUp).addScaledVector(tans[i],-worldUp.dot(tans[i]));
    if(projectedUp.lengthSq()>.018){
      projectedUp.normalize();
      const align=ups[i].dot(projectedUp);
      minUprightAlignment=Math.min(minUprightAlignment,align);
      if(align<0)invertedFrameSamples++;
    }
    const d=sp[i].y-sp[Math.min(SAMP,i+10)].y;if(d>best){best=d;uDrop=(i+5)/SAMP;}
    minTerrainClear=Math.min(minTerrainClear,sp[i].y-terrainH(sp[i].x,sp[i].z));
    maxTrackY=Math.max(maxTrackY,sp[i].y);
    for(const c of CITIES){
      const st=stadiums[c.id],pr=TRACK_PROFILE[c.id],dx=sp[i].x-c.x,dz=sp[i].z-c.z,co=Math.cos(c.rot),si=Math.sin(c.rot);
      const lx=co*dx-si*dz,lz=si*dx+co*dz,inside=(lx*lx)/(st.bowl.rOutX*st.bowl.rOutX)+(lz*lz)/(st.bowl.rOutZ*st.bowl.rOutZ)<1;
      if(!inside)continue;
      const safeTop=pr.kind==='over'?pr.roof:pr.rim;
      const corridorDelta=pr.axis==='z'?Math.abs(lx-(pr.offsetX||0)):Math.abs(lz-(pr.offsetZ||0));
      if(sp[i].y<=c.py+pr.rim+2&&corridorDelta<10)bowlPasses.add(c.id);
      if(sp[i].y<c.py+safeTop-1){
        if(pr.kind==='over')overIntrusions++;
        else if(corridorDelta>12){corridorMisses++;corridorMissCities.add(c.id);}
      }
    }
    for(const col of colliders){
      const rr=col.r+1.4;
      if((sp[i].x-col.x)**2+(sp[i].z-col.z)**2<rr*rr&&sp[i].y<col.y+col.h+3&&sp[i].y>col.y-2){
        colliderIntrusions++;
        if(colliderHits.length<24)colliderHits.push({i,x:+sp[i].x.toFixed(1),y:+sp[i].y.toFixed(1),z:+sp[i].z.toFixed(1),cx:+col.x.toFixed(1),cz:+col.z.toFixed(1),r:+col.r.toFixed(1)});
        break;
      }
    }
  }
  const audit={length:+len.toFixed(1),minTerrainClear:+minTerrainClear.toFixed(2),maxTrackY:+maxTrackY.toFixed(1),overIntrusions,corridorMisses,colliderIntrusions,
    minUprightAlignment:+minUprightAlignment.toFixed(3),invertedFrameSamples,
    bowlPasses:[...bowlPasses],bowlPassCount:bowlPasses.size,
    corridorMissCities:[...corridorMissCities],colliderHits,
    supportColumns:ci,supportCaps:bi,samples:SAMP};
  return{curve,len,stations,railMat,spineMat,uDrop,frameAt,audit};
})();

/* the car you sit in */
scene.add(camera);
const carMesh=(()=>{
  const B=new Batch();
  B.add(PRIM.box,0xb02532,0,-.95,-1.5,0,1.7,.5,1.1);
  B.add(PRIM.box,0x2c3238,0,-.72,-1.15,0,1.5,.14,.5);
  B.add(PRIM.cyl,0x8a8e94,-.55,-.62,-1.05,0,.07,.5,.07,-.6);
  B.add(PRIM.cyl,0x8a8e94,.55,-.62,-1.05,0,.07,.5,.07,-.6);
  const m=B.build(MAT.opaque,false);
  m.visible=false;camera.add(m);return m;
})();
/* a roaming train rides the circuit whenever you are not aboard */
const trainShared={u:.5};
{
  const cars=[];
  for(let i=0;i<3;i++){
    const B=new Batch();
    B.add(PRIM.box,i?0xe8e6df:0xb02532,0,.55,0,0,4.6,1.1,2.2);
    B.add(PRIM.box,0x2c3238,0,1.15,0,0,3.6,.5,1.8);
    const m=B.build(MAT.opaque,true);
    scene.add(m);cars.push(m);
  }
  let tu=0.5;
  const TP=new THREE.Vector3(),TT=new THREE.Vector3(),TS=new THREE.Vector3(),TU=new THREE.Vector3(),TM=new THREE.Matrix4();
  anims.push({u:(t,dt)=>{
    const hide=mode==='ride';
    tu=(tu+28*dt/coaster.len)%1;
    trainShared.u=tu;
    for(let i=0;i<3;i++){
      const m=cars[i];
      m.visible=!hide;
      if(hide)continue;
      const u=(tu-i*5.2/coaster.len+1)%1;
      coaster.curve.getPointAt(u,TP);
      coaster.frameAt(u,TT,TS,TU);
      m.position.copy(TP).addScaledVector(TU,.92);
      TM.makeBasis(TT,TU,TS);
      m.quaternion.setFromRotationMatrix(TM);
    }
  }});
}
/* clouds cast real drifting shadows via invisible casters */
const cloudShadows=[];
{
  const mat=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});
  clouds.forEach((c,i)=>{
    if(i%2)return;
    const g=new THREE.CircleGeometry(90+hash2(i,2)*90,10);
    g.rotateX(-Math.PI/2);
    const m=new THREE.Mesh(g,mat);
    m.castShadow=true;
    m.position.set(c.position.x,c.position.y-60,c.position.z);
    scene.add(m);cloudShadows.push({m,c});
  });
}
const ride={on:false,u:0,v:18,boost:1,dismount:false,holdE:0,dist:0,
  bYaw:0,bPitch:0,oYaw:0,oPitch:0,lastMouse:0,clackT:0};
const rideT=new THREE.Vector3(),rideS=new THREE.Vector3(),rideU=new THREE.Vector3();
const rideCamS=new THREE.Vector3(),rideCamU=new THREE.Vector3(),rideWorldUp=new THREE.Vector3(0,1,0);
const rideM=new THREE.Matrix4(),rideTargetQ=new THREE.Quaternion(),rideViewQ=new THREE.Quaternion();
const rideLookQ=new THREE.Quaternion(),rideLookEuler=new THREE.Euler(0,0,0,'YXZ');
function startRide(id){
  const st=coaster.stations.find(s=>s.id===id)||coaster.stations[0];
  ride.on=true;ride.u=st.u;ride.dist=0;
  ride.v=12;ride.dismount=false;ride.holdE=0;ride.photoDone=false;
  coaster.frameAt(st.u,rideT,rideS,rideU);
  rideCamS.copy(rideS);rideCamU.copy(rideU);
  /* Last-resort camera guard: even if a future authored element introduces a
     malformed frame, the rider's view is never allowed into the lower hemisphere. */
  if(Math.abs(rideT.y)<.985&&rideCamU.dot(rideWorldUp)<0){rideCamS.negate();rideCamU.negate();}
  ride.bYaw=Math.atan2(-rideT.x,-rideT.z);ride.bPitch=Math.asin(clamp(rideT.y,-1,1));
  rideM.makeBasis(rideCamS,rideCamU,rideT.clone().negate());
  rideViewQ.setFromRotationMatrix(rideM);
  ride.oYaw=0;ride.oPitch=0;
  mode='ride';ballDeactivate();carMesh.visible=true;
  updateHud();
  showBanner('THE GRAND CIRCUIT','press E to hop off at the next station');
}
function endRide(st){
  ride.on=false;carMesh.visible=false;
  camera.fov=68;camera.updateProjectionMatrix();
  mode='ground';
  player.pos.set(st.dismountX??st.x,st.y+CFG.eye,st.dismountZ??st.z);
  player.vel.set(0,0,0);player.vy=0;player.roll=0;
  syncLook();updateHud();
  if(ridePhoto)flashHint('your ride photo, press Enter to save');
}
function bailRide(){
  ride.on=false;carMesh.visible=false;
  const p=player.pos;
  mode='flight';player.vel.set(0,0,0);player.roll=0;
  syncLook();updateHud();
  land();
}
function updateRide(dt){
  const cur=coaster.curve;
  const p=cur.getPointAt(ride.u);
  const p2=cur.getPointAt((ride.u+.0008)%1);
  const slope=(p2.y-p.y)/Math.max(.6,p2.distanceTo(p));
  ride.v+=(-22*slope)*dt;
  ride.v+=(52-ride.v)*.75*dt;   /* fast lift and short waits between bowls */
  if(ride.dismount){
    /* glide into the platform: harder brakes the closer the station */
    let near=1e9;
    for(const st of coaster.stations){
      let du=Math.abs(ride.u-st.u);du=Math.min(du,1-du);
      near=Math.min(near,du*coaster.len);
    }
    const tv=near<70?6:13;
    ride.v+=(tv-ride.v)*1.6*dt;
  }
  ride.v=clamp(ride.v,9,70);
  const step=ride.v*ride.boost*dt;
  ride.dist+=step;
  const u0=ride.u;
  ride.u=(ride.u+step/coaster.len)%1;
  /* the on-ride camera fires once per lap at the big drop */
  if(!ride.photoDone&&((u0<coaster.uDrop&&ride.u>=coaster.uDrop)||(u0>ride.u&&coaster.uDrop>u0))){
    ride.photoDone=true;ridePhotoPending=true;
  }
  const np=cur.getPointAt(ride.u);
  coaster.frameAt(ride.u,rideT,rideS,rideU);
  /* Seat height follows the track normal, not world Y. On steep drops this is
     the difference between riding above the rails and having them slice through
     the camera. Rumble also lives in the local up/side plane. */
  player.pos.copy(np).addScaledVector(rideU,2.08);
  camPos.copy(player.pos);camera.position.copy(camPos);
  const now=performance.now(),r=ride.v*.0035;
  camera.position.addScaledVector(rideU,(Math.sin(now*.047)+Math.sin(now*.083))*r*.5);
  camera.position.addScaledVector(rideS,Math.sin(now*.061)*r*.4);
  const tYaw=Math.atan2(-rideT.x,-rideT.z),tPitch=Math.asin(clamp(rideT.y,-1,1));
  let dy=tYaw-ride.bYaw;if(dy>Math.PI)dy-=TAU;if(dy<-Math.PI)dy+=TAU;
  const ks=1-Math.exp(-dt*5);
  ride.bYaw+=dy*ks;ride.bPitch+=(tPitch-ride.bPitch)*ks;
  /* mouse is a head-look offset; the car and its bank remain locked to the rails */
  if(now-ride.lastMouse>1200){
    const kd=1-Math.exp(-dt*1.2);
    ride.oYaw-=ride.oYaw*kd;ride.oPitch-=ride.oPitch*kd;
  }
  player.yaw=ride.bYaw+ride.oYaw;
  player.pitch=clamp(ride.bPitch+ride.oPitch,-1.35,1.35);
  player.tYaw=player.yaw;player.tPitch=player.pitch;
  rideCamS.copy(rideS);rideCamU.copy(rideU);
  if(Math.abs(rideT.y)<.985&&rideCamU.dot(rideWorldUp)<0){rideCamS.negate();rideCamU.negate();}
  rideM.makeBasis(rideCamS,rideCamU,rideT.clone().negate());
  rideTargetQ.setFromRotationMatrix(rideM);
  rideViewQ.slerp(rideTargetQ,1-Math.exp(-dt*7));
  rideLookEuler.set(ride.oPitch,ride.oYaw,0,'YXZ');rideLookQ.setFromEuler(rideLookEuler);
  camera.quaternion.copy(rideViewQ).multiply(rideLookQ);
  player.roll=camera.rotation.z;
  /* speed widens the view */
  const fovT=62+8*clamp((ride.v-30)/32,0,1);
  if(Math.abs(camera.fov-fovT)>.1){camera.fov+=(fovT-camera.fov)*(1-Math.exp(-dt*3));camera.updateProjectionMatrix();}
  /* chain-lift click-clack on slow climbs */
  if(slope>.12&&ride.v<26){
    ride.clackT-=dt;
    if(ride.clackT<=0){ride.clackT=.24;audio&&audio.clack&&audio.clack();}
  }
  /* hold E bails, tap E dismounts at the next station */
  if(keys.KeyE){ride.holdE+=dt;if(ride.holdE>1){bailRide();return;}}
  else ride.holdE=0;
  if(ride.dismount&&ride.v<12){
    for(const st of coaster.stations){
      let du=Math.abs(ride.u-st.u);du=Math.min(du,1-du);
      if(du*coaster.len<14){endRide(st);return;}
    }
  }
}
/* ---------------- sailboats in the harbors ---------------- */
{
  const spots=[[-940,-660],[-1000,-140],[760,680],[990,-470],[820,30],[720,700]];
  const SAIL=[0xf4f4f2,0xf2c744,0xd94f54,0x7fd8ff,0xf4f4f2,0xd977b8];
  spots.forEach((s,i)=>{
    const g=new THREE.Group();
    const B=new Batch();
    B.add(PRIM.box,0xf0ede4,0,.5,0,0,4.2,.8,1.5);
    B.add(PRIM.box,0x8a5a44,0,1,0,0,3.4,.25,1.1);
    B.add(PRIM.cyl,0xc9c2b0,.2,3.2,0,0,.12,4.6,.12);
    B.add(PRIM.cone4,SAIL[i%6],-.8,3.4,0,Math.PI/4,.1,3.6,2.2);
    g.add(B.build(MAT.opaque,true));
    g.scale.setScalar(1.9);
    scene.add(g);
    const ph=hash2(i,4)*TAU,R=22+hash2(i,8)*30;
    anims.push({u:(t)=>{
      const a=t*.05+ph;
      g.position.set(s[0]+Math.cos(a)*R,CFG.seaY+.15+Math.sin(t*.8+ph)*.25,s[1]+Math.sin(a)*R);
      g.rotation.y=-a;
      g.rotation.z=Math.sin(t*.7+ph)*.06;
    }});
  });
}
/* ============================================================
   LIVING LANDMARKS: interactions, rides, photo mode
   ============================================================ */
const interactions=[];
function addInteract(x,z,label,fn,r=14,cooldown=6){interactions.push({x,z,r,label,fn,cooldown,cd:0});}
function nearInteract(){
  let best=null,bd=1e9;
  for(const it of interactions){
    const d=Math.hypot(player.pos.x-it.x,player.pos.z-it.z);
    if(d<it.r&&d<bd){bd=d;best=it;}
  }
  return best;
}

function niceAction(s){return s.replace(/^./,m=>m.toUpperCase());}
let lastActionId='',tourInteracted=false;
function getContextAction(){
  if(phase!=='play'||ch.phase||camTween||photoMode||$('map').classList.contains('on')||$('parkGuide').classList.contains('on'))return null;
  if(mode==='ride')return{id:'ride',key:'E',type:'Grand Circuit',title:ride.dismount?'Dismount queued':'Dismount at next station',sub:'Hold E for one second only in an emergency',kind:'ride'};
  if(mode==='flight'){
    const g=groundAt(player.pos.x,player.pos.z,player.pos.y);
    if(player.pos.y-g<CFG.landAlt)return{id:'land',key:'F',type:'Travel',title:'Land here',sub:'Continue exploring on foot',kind:'land'};
    return null;
  }
  if(mode==='ground'){
    const st=coaster.stations.find(s=>Math.hypot(player.pos.x-s.x,player.pos.z-s.z)<11.5);
    if(st)return{id:'station_'+st.id,key:'E',type:'Signature ride',title:'Board the Grand Circuit',sub:(CITY[st.id]?.name||'This city')+' station · full park tour',kind:'station',st};
    const sid=nearEntrance();
    if(sid)return{id:'stadium_'+sid,key:'E',type:'Stadium',title:'Enter '+CITY[sid].stadium,sub:'Four playable football challenges inside',kind:'stadium',sid};
    const it=nearInteract();
    if(it&&it.cd<=0)return{id:'it_'+interactions.indexOf(it),key:'E',type:/dash|challenge|game/i.test(it.label)?'Game':'Experience',title:niceAction(it.label),sub:'Press once to begin',kind:'interaction',it};
  }
  if(mode==='inside'){
    const pg=pitchPrompt();
    if(pg){
      const mexFlag=player.insideId==='mex'&&pg.label==='penalty shootout';
      const nyFlag=player.insideId==='ny'&&pg.label==='penalty shootout';
      const dalFlag=player.insideId==='dal'&&pg.label==='penalty shootout';
      const miaFlag=player.insideId==='mia'&&pg.label==='crossbar challenge';
      const seaFlag=player.insideId==='sea'&&pg.label==='dribble slalom';
      return{id:'pitch_'+pg.label,key:'E',type:mexFlag?'Azteca match night':(nyFlag?'The Final':(dalFlag?'Dallas event':(seaFlag?'Rain City':'Stadium game'))),
        title:mexFlag?'Take five penalties':(nyFlag?'Take the final five':(dalFlag?'Power Play':(miaFlag?'Neon Crossbar':(seaFlag?'Rain Run':niceAction(pg.label))))),sub:'',kind:'pitch',pg};
    }
    const st=stadiums[player.insideId];
    if(st&&st.insideExitLocal){
      toStadLocal(st,player.pos.x,player.pos.z,_lo);
      if(Math.hypot(_lo[0]-st.insideExitLocal.x,_lo[1]-st.insideExitLocal.z)<5.8)
        return{id:'exit_'+player.insideId,key:'E',type:'Concourse',title:'Return to the park',sub:'Use the signed player tunnel',kind:'exit'};
    }
    return null;
  }
  return null;
}
function performContextAction(a=getContextAction()){
  if(!a)return false;
  if(a.kind==='ride'){ride.dismount=true;flashHint('dismount queued for the next station');}
  else if(a.kind==='land')land();
  else if(a.kind==='station')startRide(a.st.id);
  else if(a.kind==='stadium')enterStadium(a.sid);
  else if(a.kind==='interaction'){a.it.fn();a.it.cd=a.it.cooldown;}
  else if(a.kind==='pitch')a.pg.start(player.insideId);
  else if(a.kind==='exit')exitStadium();
  if(!tourInteracted&&['station','stadium','interaction','pitch'].includes(a.kind)){tourInteracted=true;}
  return true;
}
function updateActionPrompt(){
  const el=$('contextHint'),a=getContextAction();
  if(!a){el.classList.remove('on');lastActionId='';return;}
  el.querySelector('.contextKey').textContent=a.key;
  el.querySelector('.contextType').textContent=a.type;
  el.querySelector('.contextTitle').textContent=a.title;
  el.classList.add('on');
  lastActionId=a.id;
}


const FIRST_VISIT=[
  ['Look around','Click the world to capture the mouse, then look around freely.'],
  ['Fly toward a city','Use WASD and the mouse. City names appear when you enter their airspace.'],
  ['Land safely','Descend near the ground and press F. The camera will settle onto the lawn.'],
  ['Approach a glowing attraction','Walk toward a station, stadium gate, gold marker, or the Kansas City dash.'],
  ['Use a nearby attraction','When the small gold key cue appears, press that key. Signs and floor markings show where to stand.'],
];
let tourStep=0,tourDone=false;
function showTour(){
  if(save&&save.d.tips&&save.d.tips.parkTour){tourDone=true;return;}
  $('mission').classList.add('on');renderTour();
}
function renderTour(){
  if(tourDone)return;
  const d=FIRST_VISIT[tourStep];
  $('mission').querySelector('.missionTitle').textContent=d[0];
  $('mission').querySelector('.missionBody').textContent=d[1];
  $('mission').querySelector('.missionCount').textContent=(tourStep+1)+' / '+FIRST_VISIT.length;
  $('mission').querySelector('.missionFill').style.width=((tourStep+1)/FIRST_VISIT.length*100)+'%';
}
function completeTour(){
  if(tourDone)return;tourDone=true;
  save.d.tips.parkTour=1;save.w();addPoints(50);
  $('mission').querySelector('.missionTitle').textContent='You are ready';
  $('mission').querySelector('.missionBody').textContent='Explore freely. Tab opens the Park Guide whenever you need it. +50 points';
  $('mission').querySelector('.missionCount').textContent='DONE';
  $('mission').querySelector('.missionFill').style.width='100%';
  setTimeout(()=>$('mission').classList.remove('on'),3500);
}
function updateTour(){
  if(tourDone||phase!=='play')return;
  let next=tourStep;
  if(tourStep===0&&pointerLocked)next=1;
  else if(tourStep===1&&nearestCity(player.pos.x,player.pos.z).dist<CFG.cityR)next=2;
  else if(tourStep===2&&mode==='ground')next=3;
  else if(tourStep===3&&getContextAction()&&mode!=='flight')next=4;
  else if(tourStep===4&&tourInteracted){completeTour();return;}
  if(next!==tourStep){tourStep=next;renderTour();audio&&audio.chime();}
}
$('missionClose').addEventListener('click',()=>{tourDone=true;save.d.tips.parkTour=1;save.w();$('mission').classList.remove('on');});
function updateGuide(){
  $('guideStamps').textContent=stamps.size+' / 16';$('guideStars').textContent=starCount()+' / '+GOAL_STARS;
  $('guidePins').textContent=save.d.pins.length+' / 30';$('guidePoints').textContent=save.d.points.toLocaleString();
}
function openGuide(){
  if(phase!=='play')return;
  if($('map').classList.contains('on'))closeMap();
  document.exitPointerLock&&document.exitPointerLock();updateGuide();$('parkGuide').classList.add('on');
}
function closeGuide(){
  $('parkGuide').classList.remove('on');requestLock();
}
function toggleGuide(){ $('parkGuide').classList.contains('on')?closeGuide():openGuide(); }
$('guideBtn').addEventListener('click',toggleGuide);$('guideClose').addEventListener('click',closeGuide);
$('parkGuide').addEventListener('mousedown',e=>{if(e.target===$('parkGuide'))closeGuide();});
function flare(x,y,z,color){const f=fireworks.find(f2=>f2.t<0);if(f)f.fire(x,y,z,color);}
/* timed path rides: the wheel and the balloon reuse this */
let pathRide=null;
function startPathRide(curve,T,back){pathRide={curve,T,t:0,back};mode='pathride';updateHud();}
function updatePathRide(dt){
  pathRide.t+=dt;
  const u=clamp(pathRide.t/pathRide.T,0,.999);
  const p=pathRide.curve.getPointAt(u);
  player.pos.copy(p);camPos.copy(p);
  camera.position.copy(p);
  camera.rotation.set(player.pitch,player.yaw,0);
  if(pathRide.t>=pathRide.T){
    const b=pathRide.back;pathRide=null;
    mode='ground';
    player.pos.set(b.x,b.y,b.z);player.vel.set(0,0,0);player.vy=0;
    syncLook();updateHud();
  }
}
/* rocket launch sequence */
let rocketSeq=null;
anims.push({u:(t,dt)=>{
  if(!rocketSeq||!rocketRef)return;
  rocketSeq.t+=dt;const T=rocketSeq.t,g=rocketRef.g;
  if(T>=5&&T<13){
    const a=T-5;
    g.position.y=a*a*3.4;
    if(a<3){const pf=Math.floor(T*2.5);
      if(pf!==rocketSeq.pf){rocketSeq.pf=pf;
        flare(CITY.hou.x+150+(hash2(pf,1)-.5)*14,CITY.hou.py+8,CITY.hou.z+20+(hash2(pf,3)-.5)*14,0xb8b4ac);}}
    shakeT=Math.max(shakeT,.5*(1-a/8));
  }else if(T>=13&&T<15)g.visible=false;
  else if(T>=15&&T<45){g.visible=true;g.position.y=130*(1-(T-15)/30);}
  else if(T>=45){g.position.y=0;rocketSeq=null;}
}});
/* liberty bell swing */
let bellT=-1;
anims.push({u:(t,dt)=>{
  if(bellT<0||!bellRef)return;
  bellT+=dt;
  bellRef.g.rotation.z=Math.sin(bellT*6.5)*.38*Math.exp(-bellT*.8);
  if(bellT>5){bellRef.g.rotation.z=0;bellT=-1;}
}});
/* register every interaction in world coordinates */
{
  const C=CITY;
  addInteract(C.hou.x+150,C.hou.z+20,'launch the rocket',()=>{
    if(rocketSeq)return;
    rocketSeq={t:0,pf:-1};
    audio&&audio.countdown();
    showBanner('LAUNCH SEQUENCE','T minus five seconds');
  },22,55);
  addInteract(C.atl.x+150,C.atl.z+10,'ride the SkyView wheel',()=>{
    const cx=C.atl.x+150,cy=C.atl.py+26,cz=C.atl.z+10;
    const pts=[];for(let i=0;i<=12;i++){const a=-Math.PI/2+i/12*TAU;
      pts.push(new THREE.Vector3(cx+Math.cos(a)*20,cy+Math.sin(a)*20,cz));}
    startPathRide(new THREE.CatmullRomCurve3(pts,false,'catmullrom',.1),45,
      {x:cx,y:C.atl.py+CFG.eye,z:cz+26});
    showBanner('SKYVIEW','one slow turn over Atlanta');
  },16,10);
  addInteract(C.mex.x+80,C.mex.z-40,'balloon tour of the highland',()=>{
    const m=C.mex;
    const pts=[new THREE.Vector3(m.x+80,m.py+6,m.z-40),
      new THREE.Vector3(m.x+30,m.py+110,m.z-120),
      new THREE.Vector3(C.gdl.x,C.gdl.py+120,C.gdl.z),
      new THREE.Vector3(C.mty.x,C.mty.py+110,C.mty.z+40),
      new THREE.Vector3(m.x+150,m.py+90,m.z+90),
      new THREE.Vector3(m.x+80,m.py+8,m.z-40)];
    startPathRide(new THREE.CatmullRomCurve3(pts,false,'catmullrom',.3),60,
      {x:m.x+80,y:m.py+CFG.eye,z:m.z-36});
    showBanner('ALOFT','sixty seconds over the Mexican lands');
  },14,10);
  addInteract(C.phi.x-100,C.phi.z+62,'ring the Liberty Bell',()=>{
    bellT=0;shakeT=Math.max(shakeT,.25);
    audio&&audio.bell(1);
  },12,4);
  if(ggRef){
    ggRef.end2={x:2*ggRef.mid.x-ggRef.lift.x,z:2*ggRef.mid.z-ggRef.lift.z};
    const deckAt=f=>new THREE.Vector3(lerp(ggRef.lift.x,ggRef.mid.x,f),ggRef.deckY+CFG.eye,lerp(ggRef.lift.z,ggRef.mid.z,f));
    const gLift=(fromX,fromZ,up)=>{
      const g0=terrainH(fromX,fromZ);
      const top=deckAt(.12);
      if(!up)top.set(fromX,Math.max(g0,CFG.seaY)+CFG.eye,fromZ);
      const base=up?new THREE.Vector3(fromX,g0+CFG.eye,fromZ):deckAt(.12);
      const pts=up?[base,new THREE.Vector3(base.x,ggRef.deckY+4,base.z),top]
                  :[base,new THREE.Vector3(top.x,ggRef.deckY-8,top.z),top];
      startPathRide(new THREE.CatmullRomCurve3(pts,false,'catmullrom',.2),2.5,
        {x:top.x,y:top.y,z:top.z});
      showBanner('GOLDEN GATE',up?'the fog rolls under the deck':'back to the shore');
      audio&&audio.chime();
    };
    addInteract(ggRef.lift.x,ggRef.lift.z,'ride up to the deck',()=>gLift(ggRef.lift.x,ggRef.lift.z,true),16,4);
    addInteract(ggRef.lift.x*.98+ggRef.mid.x*.02,ggRef.lift.z*.98+ggRef.mid.z*.02,'descend to the shore',()=>{
      const g0=terrainH(ggRef.lift.x,ggRef.lift.z);
      startPathRide(new THREE.CatmullRomCurve3([deckAt(.1),new THREE.Vector3(ggRef.lift.x,(ggRef.deckY+g0)/2,ggRef.lift.z),
        new THREE.Vector3(ggRef.lift.x,g0+CFG.eye,ggRef.lift.z)],false,'catmullrom',.2),2.5,
        {x:ggRef.lift.x,y:g0+CFG.eye,z:ggRef.lift.z});
      audio&&audio.chime();
    },9,4);
    addInteract(ggRef.end2.x,ggRef.end2.z,'descend to the far shore',()=>{
      const g0=Math.max(terrainH(ggRef.end2.x,ggRef.end2.z),CFG.seaY);
      startPathRide(new THREE.CatmullRomCurve3([new THREE.Vector3(ggRef.end2.x,ggRef.deckY+CFG.eye,ggRef.end2.z),
        new THREE.Vector3(ggRef.end2.x,g0+CFG.eye,ggRef.end2.z)],false,'catmullrom',.2),2,
        {x:ggRef.end2.x,y:g0+CFG.eye,z:ggRef.end2.z});
      audio&&audio.chime();
    },12,4);
    addInteract(ggRef.mid.x,ggRef.mid.z,'photo plaque',()=>{
      showBanner('MID SPAN','press P for photo mode');
      audio&&audio.chime();
    },10,4);
  }
  const t2=(id,lx,lz,label,fn)=>{const c=C[id];addInteract(c.x+lx,c.z+lz,label,fn,15,5);};
  t2('dal',160,-40,'light Reunion Tower',()=>{flare(C.dal.x+160,C.dal.py+56,C.dal.z-40,0xffe9a8);audio&&audio.chime();});
  t2('bos',210,-120,'sound the harbor light',()=>{flare(C.bos.x+210,C.bos.py+26,C.bos.z-120,0xfff2b8);audio&&audio.horn();});
  t2('kc',150,70,'surge the fountains',()=>{flare(C.kc.x+150,C.kc.py+9,C.kc.z+70,0x9fd8ff);audio&&audio.wave();});
  t2('gdl',140,-16,'toll the cathedral bells',()=>{audio&&audio.bell(3);});
  t2('van',-176,-196,'wave off the seaplane',()=>{audio&&audio.horn();flare(C.van.x-176,C.van.py+10,C.van.z-196,0xbfe8ff);});
  t2('sea',150,-60,'pulse the Needle',()=>{flare(C.sea.x+150,C.sea.py+62,C.sea.z-60,0xdff2ff);audio&&audio.chime();});
  t2('tor',140,-20,'flash the CN beacon',()=>{flare(C.tor.x+140,C.tor.py+150,C.tor.z-20,0xff6a5a);audio&&audio.chime();});
  t2('mex',-150,40,'light the Ángel torch',()=>{flare(C.mex.x-150,C.mex.py+50,C.mex.z+40,0xffd97a);audio&&audio.chime();});
  t2('mia',190,130,'listen to the surf',()=>{audio&&audio.wave();flare(C.mia.x+190,C.mia.py+8,C.mia.z+130,0x35e0d2);});
  t2('mty',-230,-40,'saddle viewpoint',()=>{showBanner('CERRO DE LA SILLA','the saddle above the park');audio&&audio.chime();});
  t2('phi',-150,10,'chime the hall clock',()=>{audio&&audio.bell(2);});
  t2('la',170,-30,'sweep the sign spotlight',()=>{flare(C.la.x+176,C.la.py+40,C.la.z-17,0xf4f4f0);audio&&audio.chime();});
  t2('ny',120,190,"flare the Liberty torch",()=>{flare(C.ny.x+128,C.ny.py+42,C.ny.z+190,0xffd97a);audio&&audio.chime();});
}
/* photo mode */
function togglePhoto(){
  photoMode=!photoMode;
  document.body.classList.toggle('photo',photoMode);
  [hudEl,speedEl,hintEl,bannerEl,$('lockHint')].forEach(el=>el.style.visibility=photoMode?'hidden':'');
}
/* ============================================================
   PASS 11: save, points, stars, the goal arc, challenge scaffolding
   ============================================================ */
const save=(()=>{
  const data={stamps:[],stars:{},points:0,bests:{},pins:[],tips:{},goal:false};
  try{
    const raw=localStorage.getItem('c26save');
    if(raw)Object.assign(data,JSON.parse(raw));
  }catch(e){}
  return{
    d:data,
    w(){try{data.dayT=+dayT.toFixed(3);localStorage.setItem('c26save',JSON.stringify(data));}catch(e){}},
  };
})();
const GOAL_STARS=24;
let nyTotem=null;
function starCount(){
  let n=0;
  for(const k in save.d.stars){const s=save.d.stars[k];n+=(s.s?1:0)+(s.b?1:0)+(s.g?1:0);}
  return n;
}
function addStar(id,kind){
  const s=save.d.stars[id]||(save.d.stars[id]={});
  if(s[kind])return false;
  s[kind]=1;save.w();
  flashHint('star earned, '+starCount()+' / '+GOAL_STARS);
  checkGoal();updateHud();
  return true;
}
function addPoints(n){save.d.points+=n;save.w();updateHud();}
function checkGoal(){
  if(save.d.goal||starCount()<GOAL_STARS)return;
  save.d.goal=true;save.w();
  showBanner('THE FINAL AWAITS','MetLife Stadium is calling');
  if(nyTotem)nyTotem.material.color.setHex(0xffd97a);
  audio&&audio.pitchRoar();
  goalBurst.fire(player.pos.x,player.pos.y+6,player.pos.z);
}
/* reusable stadium-local scratch arrays.
   These must be initialized before any game-pad/challenge setup calls pkW(). */
const _lo=[0,0],_wo=[0,0];

/* one reusable challenge shell; results return directly to the world. */
const ch={phase:null,def:null};
function startChallenge(def){
  /* The world is the menu: stepping onto a signed pad and pressing E starts immediately. */
  ch.def=def;ch.phase='run';requestLock();def.begin();
  if(def.cue)flashHint(def.cue);
}
function chResult(big,lines,medals){
  const title=ch.def?.title||'Challenge complete';
  const summary=document.createElement('div');summary.innerHTML=lines||'';
  chEnd();
  showBanner(big,title);
  const plain=summary.textContent?.replace(/\s+/g,' ').trim();
  if(plain)flashHint(plain);
}
function chEnd(){
  const d=ch.def;ch.phase=null;ch.def=null;
  d&&d.cleanup&&d.cleanup();
  updateHud();requestLock();
}
/* ---------------- game one: the penalty shootout ---------------- */
const keeper=(()=>{
  const g=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0xc98f6d,roughness:.78});
  const shirt=new THREE.MeshStandardMaterial({color:0x18a05d,roughness:.62});
  const dark=new THREE.MeshStandardMaterial({color:0x121820,roughness:.78});
  const sock=new THREE.MeshStandardMaterial({color:0xeef4f5,roughness:.7});
  const glove=new THREE.MeshStandardMaterial({color:0xf5d64f,roughness:.55});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.78,6,12),shirt);torso.scale.set(1.12,1,.66);torso.position.y=1.72;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.31,16,12),skin);head.position.y=2.72;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.315,14,9,0,TAU,0,Math.PI*.44),dark);hair.position.y=2.79;g.add(hair);
  const shorts=new THREE.Mesh(new THREE.BoxGeometry(1.0,.55,.58),dark);shorts.position.y=.86;g.add(shorts);
  function limb(mat,r,len){const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,5,9),mat);m.geometry.translate(0,-len*.5,0);return m;}
  const aL=limb(shirt,.115,.92),aR=limb(shirt,.115,.92);aL.position.set(-.62,2.27,0);aR.position.set(.62,2.27,0);aL.rotation.z=-.28;aR.rotation.z=.28;g.add(aL,aR);
  const handL=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),glove),handR=handL.clone();handL.position.set(0,-1.02,0);handR.position.set(0,-1.02,0);aL.add(handL);aR.add(handR);
  const legL=limb(skin,.13,.82),legR=limb(skin,.13,.82);legL.position.set(-.27,.73,0);legR.position.set(.27,.73,0);g.add(legL,legR);
  const bootL=new THREE.Mesh(new THREE.BoxGeometry(.3,.16,.58),dark),bootR=bootL.clone();bootL.position.set(-.27,.11,-.12);bootR.position.set(.27,.11,-.12);g.add(bootL,bootR);
  const sockL=new THREE.Mesh(new THREE.CylinderGeometry(.13,.12,.42,10),sock),sockR=sockL.clone();sockL.position.set(-.27,.48,0);sockR.position.set(.27,.48,0);g.add(sockL,sockR);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  g.visible=false;scene.add(g);
  return{g,aL,aR,handL,handR,legL,legR,base:new THREE.Vector3()};
})();
const reticle=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0x7fd8ff,transparent:true,opacity:0,depthWrite:false,depthTest:false}));
reticle.scale.set(.9,.9,1);scene.add(reticle);
const pk={on:false};
function pkW(st,lx,lz){fromStadLocal(st,lx,lz,_wo);return{x:_wo[0],z:_wo[1]};}
function nearPenaltySpot(){
  if(mode!=='inside')return false;
  const st=stadiums[player.insideId];
  toStadLocal(st,player.pos.x,player.pos.z,_lo);
  return Math.abs(_lo[0]-18.2)<5&&Math.abs(_lo[1])<5;
}
function startShootout(id){
  const st=stadiums[id],isFinal=id==='ny',isPower=id==='dal';
  const diff=isFinal?3:(st.city.ko==='SF'?2:(st.city.ko==='QF'?1:0));
  startChallenge({
    title:isFinal?'FINAL PRESSURE':(isPower?'POWER PLAY':'PENALTY SHOOTOUT'),
    cue:isPower?'aim · hold Space · release inside the power window':'aim · hold Space · A / D curve · release to strike',
    rules:isFinal?`Five kicks beneath the championship lights.<br>Aim with the mouse. Hold SPACE to charge, release to shoot.<br>The keeper reads late, so placement and curve matter.`:
      `Five kicks at ${st.city.stadium}.<br>Aim with the mouse. Hold SPACE to charge, release to shoot.<br>Soft shots get saved; overcooked ones clear the bar.`,
    medals:'3 goals bronze &nbsp;·&nbsp; 4 silver &nbsp;·&nbsp; 5 gold, with a top corner',
    begin(){
      pk.on=true;pk.st=st;pk.finalMode=isFinal;pk.powerMode=isPower;pk.diff=diff;pk.kick=0;pk.scored=0;pk.top=false;pk.results=[];pk.spin=0;pk.feedback='';
      pk.state='aim';pk.charge=0;pk.t=0;
      pk.gy=st.city.py+st.bowl.pitchY+.34;
      const sp=pkW(st,15.2,0),gp=pkW(st,25,0);
      player.pos.set(sp.x,pk.gy+CFG.eye,sp.z);
      player.yaw=Math.atan2(-(gp.x-sp.x),-(gp.z-sp.z));player.pitch=-.02;syncLook();
      pkPlaceBall();
      const kp=pkW(st,24.5,0);
      keeper.base.set(kp.x,pk.gy,kp.z);
      keeper.g.position.copy(keeper.base);
      keeper.g.rotation.set(0,Math.atan2(sp.x-kp.x,sp.z-kp.z),0);
      keeper.g.visible=true;
      $('shootHud').querySelector('.shootName').textContent=isFinal?'Final Pressure':(isPower?'Power Play':'Penalty Shootout');
      if(isFinal){ball.material.emissive.setHex(0x2b1b03);ball.material.emissiveIntensity=.13;}
      $('pbar').classList.add('on');$('shootHud').classList.add('on');
      updateShootHud();showShotFeedback(isFinal?'The final five':(isPower?'Control the power':'Five kicks'));
    },
    tick(dt){pkTick(dt);},
    abort(){pkCleanup();},
    cleanup(){pkCleanup();},
  });
}
function updateShootHud(){
  if(!pk.on)return;
  $('shootScore').textContent=`Kick ${Math.min(pk.kick+1,5)} / 5 · ${pk.scored} goal${pk.scored===1?'':'s'}`;
  const pips=[...$('shootPips').children];
  pips.forEach((el,i)=>{el.className=pk.results[i]||'';});
  const v=pk.spin||0;$('shootCurve').textContent=Math.abs(v)<.14?'Neutral':(v<0?'Left '+Math.round(Math.abs(v)*100)+'%':'Right '+Math.round(Math.abs(v)*100)+'%');
}
function showShotFeedback(text,dur=900){
  const el=$('shotFeedback');el.textContent=text;el.classList.add('on');
  aztecaMatch.feedbackT=performance.now()+dur;
}

function pkPlaceBall(){
  const bp=pkW(pk.st,18.2,0);
  ballS.vel.set(0,0,0);ballS.celebrating=false;
  ball.position.set(bp.x,pk.gy+.36,bp.z);
}
function pkCleanup(){
  pk.on=false;pk.finalMode=false;pk.powerMode=false;
  ball.material.emissive.setHex(0x000000);ball.material.emissiveIntensity=1;
  keeper.g.visible=false;keeper.g.rotation.z=0;keeper.aL.rotation.z=-.28;keeper.aR.rotation.z=.28;keeper.legL.rotation.z=0;keeper.legR.rotation.z=0;
  reticle.material.opacity=0;
  $('pbar').classList.remove('on');$('shootHud').classList.remove('on');$('shotFeedback').classList.remove('on');
}
function goalAim(st,maxY){
  const cp=Math.cos(player.pitch);
  const d={x:-Math.sin(player.yaw)*cp,y:Math.sin(player.pitch),z:-Math.cos(player.yaw)*cp};
  const c=Math.cos(st.rot),s=Math.sin(st.rot);
  const ldx=d.x*c-d.z*s,ldz=d.x*s+d.z*c;
  toStadLocal(st,ball.position.x,ball.position.z,_lo);
  const t=ldx>.08?(25-_lo[0])/ldx:99;
  return{az:clamp(_lo[1]+ldz*t,-4.6,4.6),ay:clamp(1.1+d.y*t*1.1,.3,maxY),valid:t<60,t};
}
/* the four pitch games share spaced trigger spots */
const PITCH_GAMES=[
  {lx:18.2,lz:0,r:5,label:'penalty shootout',start:id=>startShootout(id)},
  {lx:0,lz:9.5,r:4,label:'crossbar challenge',start:id=>startCrossbar(id)},
  {lx:-21,lz:-12,r:4.5,label:'dribble slalom',start:id=>startSlalom(id)},
  {lx:0,lz:0,r:3.2,label:'keepy-uppy',start:id=>startKeepy(id)},
];
function pitchPrompt(){
  if(mode!=='inside')return null;
  const st=stadiums[player.insideId];
  toStadLocal(st,player.pos.x,player.pos.z,_lo);
  let best=null,bd=1e9;
  for(const g of PITCH_GAMES){
    const d=Math.hypot(_lo[0]-g.lx,_lo[1]-g.lz);
    if(d<g.r&&d<bd){bd=d;best=g;}
  }
  return best;
}
function pkShoot(a){
  const st=pk.st,p=pk.charge;
  pk.state='flight';pk.ft=0;pk.resolved=false;pk.savedDone=false;
  let ay=a.ay;const az=a.az;
  if(p>.92)ay+=(p-.92)*34;
  const T=.55-.22*clamp((p-.3)/.7,0,1);
  pk.T=T;
  pk.aimTop=ay>1.85&&Math.abs(az)>2.4&&ay<2.45;
  pk.postHit=(Math.abs(Math.abs(az)-4.02)<.16&&ay<2.62)||(Math.abs(ay-2.58)<.13&&Math.abs(az)<4.1);
  pk.spin=clamp(pk.spin||0,-1,1);
  const side=az>1?1:(az<-1?-1:0);
  const read=Math.random()<(.28+.16*pk.diff);
  pk.dive=read?side:[-1,0,1][Math.floor(Math.random()*3)];
  const unsavable=(ay>1.9&&ay<2.45)||(Math.abs(az)>3.05&&p>=.45);
  pk.saved=!pk.postHit&&ay<2.45&&!unsavable&&pk.dive===side&&(p<.42||Math.random()<.68+.1*pk.diff);
  if(p<.42&&side===0&&pk.dive===0)pk.saved=true;
  toStadLocal(st,ball.position.x,ball.position.z,_lo);
  const lvx=(25.7-_lo[0])/T,lvz=(az-_lo[1])/T,lvy=(ay-.36)/T+12*T;
  const c=Math.cos(st.rot),s=Math.sin(st.rot);
  ballS.vel.set(lvx*c+lvz*s,lvy,-lvx*s+lvz*c);
  ballS.squash=.3;
  audio&&audio.thump();
  reticle.material.opacity=0;
}
function pkTick(dt){
  pk.t+=dt;
  const st=pk.st;
  if(pk.state==='aim'||pk.state==='charge'){
    const a=goalAim(st,2.45);
    const rp=pkW(st,25,a.az);
    reticle.position.set(rp.x,pk.gy+a.ay,rp.z);
    reticle.material.opacity=a.valid?.85:.2;
    keeper.g.position.copy(keeper.base);
    keeper.g.rotation.z=Math.sin(pk.t*2.2)*.025;
    keeper.legL.rotation.z=.07+Math.sin(pk.t*3)*.035;keeper.legR.rotation.z=-.07-Math.sin(pk.t*3)*.035;
    if(keys.Space){
      pk.state='charge';
      pk.charge=Math.min(1,pk.charge+dt*.78);
      const curveInput=(keys.KeyD?1:0)-(keys.KeyA?1:0);
      pk.spin+=(curveInput-pk.spin)*(1-Math.exp(-dt*6));
      $('pbar').firstElementChild.style.width=(pk.charge*100)+'%';updateShootHud();
    }else if(pk.state==='charge')pkShoot(a);
  }else if(pk.state==='flight'){
    pk.ft+=dt;
    const e=clamp(pk.ft/.5,0,1)*(2-clamp(pk.ft/.5,0,1));
    const dz2=pk.dive*3.15*e;
    keeper.g.position.set(keeper.base.x+dz2*Math.sin(st.rot),pk.gy-(pk.dive?.28*e:0),keeper.base.z+dz2*Math.cos(st.rot));
    keeper.g.rotation.z=-pk.dive*.78*e;
    keeper.aL.rotation.z=-.28+pk.dive*e*1.05;keeper.aR.rotation.z=.28+pk.dive*e*1.05;
    /* Magnus-like lateral bend in stadium-local space. */
    if(pk.ft<pk.T*1.08&&Math.abs(pk.spin)>.02){
      const c=Math.cos(st.rot),ss=Math.sin(st.rot);
      let vx=ballS.vel.x*c-ballS.vel.z*ss,vz=ballS.vel.x*ss+ballS.vel.z*c;
      vz+=pk.spin*5.8*dt*(1-clamp(pk.ft/pk.T,0,1));
      ballS.vel.set(vx*c+vz*ss,ballS.vel.y,-vx*ss+vz*c);
    }
    if(pk.postHit&&!pk.postDone&&pk.ft>=pk.T*.82){
      pk.postDone=true;pk.saved=false;ballS.vel.multiplyScalar(.44);ballS.vel.y=Math.max(2.5,ballS.vel.y*.25);
      audio&&audio.ping();showShotFeedback('Off the frame');shakeT=Math.max(shakeT,.24);
    }
    if(pk.saved&&!pk.savedDone&&pk.ft>=pk.T*.72){
      pk.savedDone=true;
      const c=Math.cos(st.rot),s=Math.sin(st.rot);
      let vx=ballS.vel.x*c-ballS.vel.z*s,vz=ballS.vel.x*s+ballS.vel.z*c;
      vx=-Math.abs(vx)*.35;vz*=.3;
      ballS.vel.set(vx*c+vz*s,3.5,-vx*s+vz*c);
      audio&&audio.ooh();
    }
    if(ballS.celebrating&&!pk.resolved){
      pk.resolved=true;pk.scored++;pk.results[pk.kick]='goal';if(pk.aimTop)pk.top=true;
      showShotFeedback(pk.finalMode?(pk.aimTop?'Final top corner':'Final goal'):(pk.aimTop?'Top corner':'Goal'));
      if(pk.finalMode)nyFinalGoalVolley(pk.scored);
      if(pk.powerMode)dallasPowerPulse(pk.scored);
      updateShootHud();shakeT=Math.max(shakeT,pk.finalMode?.18:.12);
    }
    if(pk.ft>2.1){
      if(!pk.resolved){
        pk.results[pk.kick]='miss';
        if(pk.saved){showShotFeedback('Saved');audio&&audio.ooh();}
        else if(!pk.postHit){showShotFeedback('Miss');audio&&audio.ooh();}
      }
      pk.kick++;updateShootHud();
      pk.resolved=false;pk.saved=false;pk.savedDone=false;pk.postDone=false;pk.postHit=false;
      keeper.g.rotation.z=0;keeper.aL.rotation.z=-.28;keeper.aR.rotation.z=.28;keeper.legL.rotation.z=0;keeper.legR.rotation.z=0;
      keeper.g.position.copy(keeper.base);
      pk.charge=0;pk.spin=0;$('pbar').firstElementChild.style.width='0%';
      pkPlaceBall();
      if(pk.kick>=5)pkFinish();
      else pk.state='aim';
    }
  }
}
function nyFinalGoalVolley(seed=1){
  const st=stadiums.ny;
  for(let i=0;i<2;i++){
    const f=fireworks.find(x=>x.t<0);if(!f)break;
    f.fire(st.center.x+(i?1:-1)*(52+seed*5),st.city.py+92+i*17,st.center.z+(i?34:-38),
      i?0xffd97a:0x7fd8ff);
  }
  for(let i=0;i<nyFinal.flashers.length;i++){
    if(hash2(i,seed*37)>.72)nyFinal.flashers[i].material.opacity=.9;
  }
}
function dallasPowerPulse(seed=1){
  dallasEvent.pulse=1;
  shakeT=Math.max(shakeT,.16);
  const st=stadiums.dal,f=fireworks.find(x=>x.t<0);
  if(f)f.fire(st.center.x+(seed%2?58:-58),st.city.py+78,st.center.z+(seed%2?-30:34),0x7fd8ff);
}
function pkFinish(){
  const n=pk.scored,wasFinal=!!pk.finalMode,wasPower=!!pk.powerMode;
  const medal=n>=5&&pk.top?'gold':(n>=4?'silver':(n>=3?'bronze':null));
  const pts=medal==='gold'?400:medal==='silver'?200:medal==='bronze'?100:25;
  addPoints(pts);
  const id=pk.st.city.id;
  if(medal)addStar(id,'b');
  if(medal==='gold')addStar(id,'g');
  const bk='pk_'+id,best=save.d.bests[bk]||0;
  if(n>best){save.d.bests[bk]=n;save.w();}
  if(medal==='gold'){
    audio&&audio.pitchRoar();goalBurst.fire(ball.position.x,pk.gy+4,ball.position.z);
    if(wasFinal){nyFinalGoalVolley(9);nyFinalGoalVolley(15);}
    if(wasPower){dallasPowerPulse(9);dallasPowerPulse(15);}
  }
  pkCleanup();
  chResult(n+' / 5',
    (wasFinal?'FINAL NIGHT · ':(wasPower?'DALLAS POWER PLAY · ':''))+(medal?medal.toUpperCase()+' medal':'no medal')+' · +'+pts+' points<br>best at this ground: '+Math.max(n,best)+' / 5',
    pk.top?'top corner finish ✓':'');
}
/* ---------------- game: crossbar challenge ---------------- */
const cb={on:false};
const cbBar=(()=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,8.6),new THREE.MeshBasicMaterial({color:0xffffff}));
  m.visible=false;scene.add(m);return m;
})();
function startCrossbar(id){
  const st=stadiums[id],isNeon=id==='mia';
  startChallenge({
    title:isNeon?'NEON CROSSBAR':'CROSSBAR CHALLENGE',
    rules:`Five strikes at the bar of ${st.city.stadium}, stepping back each attempt.<br>Aim with the mouse, hold SPACE to charge, release to shoot.`,
    medals:'2 hits bronze &nbsp;·&nbsp; 3 silver &nbsp;·&nbsp; 4 gold &nbsp;·&nbsp; posts count half',
    begin(){
      cb.on=true;cb.st=st;cb.neonMode=isNeon;cb.i=0;cb.score=0;cb.pts=0;cb.t=0;
      cb.gy=st.city.py+st.bowl.pitchY+.34;
      cb.D=[12,16,20,25,30];
      cbSetup();
      $('pbar').classList.add('on');
    },
    hudText:()=>`crossbar · attempt ${Math.min(cb.i+1,5)}/5 · hits ${cb.score} · from ${cb.D[Math.min(cb.i,4)]}`,
    tick(dt){cbTick(dt);},
    abort(){cbCleanup();},
    cleanup(){cbCleanup();},
  });
}
function cbSetup(){
  const st=cb.st,d=cb.D[cb.i];
  const bp=pkW(st,25-d,0);
  ballS.vel.set(0,0,0);ballS.celebrating=false;
  ball.position.set(bp.x,cb.gy+.36,bp.z);
  const sp=pkW(st,25-d-3,0);
  player.pos.set(sp.x,cb.gy+CFG.eye,sp.z);
  const gp=pkW(st,25,0);
  player.yaw=Math.atan2(-(gp.x-sp.x),-(gp.z-sp.z));player.pitch=.08;syncLook();
  cb.state='aim';cb.charge=0;
}
function cbCleanup(){cb.on=false;cb.neonMode=false;reticle.material.opacity=0;cbBar.visible=false;$('pbar').classList.remove('on');}
function cbShoot(a){
  const st=cb.st,p=cb.charge;
  cb.state='flight';cb.ft=0;cb.resolved=null;
  toStadLocal(st,ball.position.x,ball.position.z,_lo);
  cb.prevLx=_lo[0];cb.prevLz=_lo[1];cb.prevY=ball.position.y;
  let ay=a.ay;
  if(p>.92)ay+=(p-.92)*30;
  const T=(.5-.2*clamp((p-.3)/.7,0,1))*(.7+cb.D[cb.i]/25);
  let lvx=(25.6-_lo[0])/T;
  if(p<.35)lvx*=.5+p;
  const lvz=(a.az-_lo[1])/T,lvy=(ay-.36)/T+12*T;
  const c=Math.cos(st.rot),s=Math.sin(st.rot);
  ballS.vel.set(lvx*c+lvz*s,lvy,-lvx*s+lvz*c);
  ballS.squash=.3;audio&&audio.thump();
  reticle.material.opacity=0;
  cb.charge=0;$('pbar').firstElementChild.style.width='0%';
}
function cbTick(dt){
  cb.t+=dt;
  const st=cb.st;
  if(cb.state==='aim'||cb.state==='charge'){
    const a=goalAim(st,3.4);
    const rp=pkW(st,25,a.az);
    reticle.position.set(rp.x,cb.gy+a.ay,rp.z);
    reticle.material.opacity=a.valid?.85:.2;
    if(keys.Space){cb.state='charge';cb.charge=Math.min(1,cb.charge+dt*.85);
      $('pbar').firstElementChild.style.width=(cb.charge*100)+'%';}
    else if(cb.state==='charge')cbShoot(a);
  }else if(cb.state==='flight'){
    cb.ft+=dt;
    toStadLocal(st,ball.position.x,ball.position.z,_lo);
    const lx=_lo[0],lz=_lo[1];
    if(!cb.resolved&&cb.prevLx<25&&lx>=25){
      const f=(25-cb.prevLx)/Math.max(.001,lx-cb.prevLx);
      const y=cb.prevY+(ball.position.y-cb.prevY)*f-cb.gy;
      const z=cb.prevLz+(lz-cb.prevLz)*f;
      if(Math.abs(y-2.62)<=.66&&Math.abs(z)<=4.35){
        cb.resolved='bar';cb.score+=1;cb.pts+=cb.D[cb.i]*10;
        audio&&audio.ping();
        cbWobble();
        ballS.vel.multiplyScalar(-.3);ballS.vel.y=Math.abs(ballS.vel.y)*.4+2;
      }else if(y<2.4&&Math.abs(Math.abs(z)-4.1)<=.55){
        cb.resolved='post';cb.score+=.5;cb.pts+=cb.D[cb.i]*5;
        audio&&audio.ping();
        ballS.vel.x*=-.3;ballS.vel.z*=-.3;
      }
    }
    cb.prevLx=lx;cb.prevLz=lz;cb.prevY=ball.position.y;
    if(cb.ft>2.0){
      cb.i++;
      if(cb.i>=5)cbFinish();
      else cbSetup();
    }
  }
}
function cbWobble(){
  const st=cb.st,wp=pkW(st,25,0);
  cbBar.position.set(wp.x,cb.gy+2.62,wp.z);
  cbBar.rotation.set(0,st.rot,0);
  cbBar.scale.set(1,1,1);
  cbBar.visible=true;
  netWobs.push({mesh:cbBar,t:0});
  if(cb.neonMode){miamiFestival.pulse=1;shakeT=Math.max(shakeT,.1);}
  setTimeout(()=>{cbBar.visible=false;},950);
}
function cbFinish(){
  const n=cb.score,wasNeon=!!cb.neonMode;
  const medal=n>=4?'gold':n>=3?'silver':n>=2?'bronze':null;
  const pts=cb.pts+(medal==='gold'?150:medal==='silver'?75:medal==='bronze'?40:10);
  addPoints(pts);
  const id=cb.st.city.id;
  if(medal)addStar(id,'b');
  if(medal==='gold')addStar(id,'g');
  const bk='cb_'+id,best=save.d.bests[bk]||0;
  if(n>best){save.d.bests[bk]=n;save.w();}
  if(medal==='gold'){audio&&audio.pitchRoar();if(wasNeon)miamiFestival.pulse=1.4;}
  cbCleanup();
  chResult(n+' hits',(wasNeon?'MIAMI NEON CROSSBAR · ':'')+(medal?medal.toUpperCase()+' medal':'no medal')+' · +'+pts+' points<br>best here: '+Math.max(n,best),'');
}
/* ---------------- game: dribble slalom ---------------- */
const sl={on:false,objs:[]};
const SL_GOLD=19,SL_SILVER=22,SL_BRONZE=26;   /* my clean harness run: 17.3 s, +10/25/50 percent */
function startSlalom(id){
  const st=stadiums[id],isRain=id==='sea';
  startChallenge({
    title:isRain?'RAIN RUN':'DRIBBLE SLALOM',
    rules:`Dribble the ball through the lit gates, then across the finish.<br>Missed gate +2 s · toppled cone +1 s.`,
    medals:`gold ${SL_GOLD}s &nbsp;·&nbsp; silver ${SL_SILVER}s &nbsp;·&nbsp; bronze ${SL_BRONZE}s`,
    begin(){sl.rainMode=isRain;slBegin(st);},
    hudText:()=>{
      const t=sl.started?((performance.now()-sl.t0)/1000+sl.pen):0;
      return `slalom · gate ${Math.min(sl.gi+1,sl.gates.length)}/${sl.gates.length} · ${t.toFixed(1)}s`;
    },
    tick(dt){slTick(dt);},
    abort(){slCleanup();},
    cleanup(){slCleanup();},
  });
}
function slBegin(st){
  sl.on=true;sl.st=st;sl.gi=0;sl.pen=0;sl.started=false;sl.done=false;sl.prevBx=undefined;
  sl.gy=st.city.py+st.bowl.pitchY+.34;
  slClear();
  sl.gates=[{x:-14,z:-6},{x:-6,z:6},{x:2,z:-6},{x:10,z:6},{x:17,z:-4},{x:22.5,z:0,fin:true}];
  const coneGeo=new THREE.ConeGeometry(.45,1.1,7);
  sl.cones=[];
  sl.gates.forEach(g2=>{
    g2.missed=false;
    const w2=g2.fin?3.4:2.3;
    for(const s of[-1,1]){
      const wp=pkW(st,g2.x,g2.z+s*w2);
      const m=new THREE.Mesh(coneGeo,new THREE.MeshLambertMaterial({color:0xf2632f,flatShading:true}));
      m.position.set(wp.x,sl.gy+.55,wp.z);
      m.castShadow=true;scene.add(m);
      sl.objs.push(m);
      sl.cones.push({m,tipped:false,x:wp.x,z:wp.z});
    }
    const mk=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0x35e0d2,transparent:true,opacity:.9,depthWrite:false}));
    const gp=pkW(st,g2.x,g2.z);
    mk.position.set(gp.x,sl.gy+3.4,gp.z);mk.scale.set(2.2,2.2,1);
    scene.add(mk);sl.objs.push(mk);
    g2.mk=mk;
  });
  const bp=pkW(st,-20,-12);
  ballS.vel.set(0,0,0);ball.position.set(bp.x,sl.gy+.36,bp.z);
  const pp=pkW(st,-22.5,-13);
  player.pos.set(pp.x,sl.gy+CFG.eye,pp.z);
  const g1=pkW(st,-14,-6);
  player.yaw=Math.atan2(-(g1.x-pp.x),-(g1.z-pp.z));player.pitch=-.1;syncLook();
}
function slClear(){sl.objs.forEach(o=>scene.remove(o));sl.objs.length=0;}
function slCleanup(){sl.on=false;sl.rainMode=false;slClear();}
function slTick(dt){
  const st=sl.st;
  toStadLocal(st,ball.position.x,ball.position.z,_lo);
  const bx=_lo[0],bz=_lo[1];
  if(!sl.started&&ballS.vel.lengthSq()>.3){sl.started=true;sl.t0=performance.now();}
  sl.gates.forEach((g2,i)=>{
    g2.mk.material.color.setHex(i===sl.gi?0x35e0d2:(g2.missed?0xd94f54:0x9aa2ab));
    g2.mk.material.opacity=i===sl.gi?.95:.45;
  });
  if(sl.gi<sl.gates.length&&sl.prevBx!==undefined){
    const g2=sl.gates[sl.gi];
    if(sl.prevBx<g2.x&&bx>=g2.x){
      const w2=g2.fin?3.4:2.3;
      if(Math.abs(bz-g2.z)>w2){g2.missed=true;sl.pen+=2;}
      sl.gi++;
      if(sl.rainMode)seattleRain.pulse=1;
      if(sl.gi>=sl.gates.length)slFinish();
    }
  }
  sl.prevBx=bx;
  for(const cn of sl.cones){
    if(cn.tipped)continue;
    const db=Math.hypot(ball.position.x-cn.x,ball.position.z-cn.z);
    const dp=Math.hypot(player.pos.x-cn.x,player.pos.z-cn.z);
    if(db<.85||dp<1.15){
      cn.tipped=true;sl.pen+=1;
      cn.m.rotation.z=1.35;cn.m.position.y=sl.gy+.32;
      netWobs.push({mesh:cn.m,t:0});
      audio&&audio.thump();
    }
  }
}
function slFinish(){
  if(sl.done)return;sl.done=true;
  const wasRain=!!sl.rainMode;
  const t=(performance.now()-sl.t0)/1000+sl.pen;
  const medal=t<=SL_GOLD?'gold':t<=SL_SILVER?'silver':t<=SL_BRONZE?'bronze':null;
  const pts=medal==='gold'?300:medal==='silver'?160:medal==='bronze'?90:20;
  addPoints(pts);
  const id=sl.st.city.id;
  if(medal)addStar(id,'b');
  if(medal==='gold')addStar(id,'g');
  const bk='sl_'+id,best=save.d.bests[bk]||999;
  if(t<best){save.d.bests[bk]=+t.toFixed(1);save.w();}
  if(medal==='gold'){audio&&audio.pitchRoar();if(wasRain)seattleRain.pulse=1.5;}
  slCleanup();
  chResult(t.toFixed(1)+'s',(wasRain?'SEATTLE RAIN RUN · ':'')+(medal?medal.toUpperCase()+' medal':'no medal')+' · +'+pts+' points<br>best here: '+Math.min(t,best).toFixed(1)+'s','');
}
/* ---------------- game: keepy-uppy ---------------- */
const ku={on:false};
function startKeepy(id){
  const st=stadiums[id];
  startChallenge({
    title:'KEEPY-UPPY',
    rules:`Keep the ball in the air. Click or tap SPACE to pop it up as it falls.<br>It drifts a little more with every touch.`,
    medals:'10 bronze &nbsp;·&nbsp; 25 silver &nbsp;·&nbsp; 50 gold',
    begin(){
      ku.on=true;ku.st=st;ku.streak=0;ku.pts=0;ku.sp=false;ku.ended=false;
      ku.gy=st.city.py+st.bowl.pitchY+.34;
      const bp=pkW(st,0,0);
      ballS.vel.set(0,0,0);ball.position.set(bp.x,ku.gy+.36,bp.z);
      const pp=pkW(st,-1.8,0);
      player.pos.set(pp.x,ku.gy+CFG.eye,pp.z);
      player.yaw=Math.atan2(-(bp.x-pp.x),-(bp.z-pp.z));player.pitch=-.35;syncLook();
    },
    hudText:()=>`keepy-uppy · streak ${ku.streak}`,
    click(){kuTouch();},
    tick(dt){
      if(keys.Space&&!ku.sp)kuTouch();
      ku.sp=keys.Space;
    },
    abort(){ku.on=false;},
    cleanup(){ku.on=false;},
  });
}
function kuTouch(){
  if(!ku.on||ku.ended)return;
  const d=Math.hypot(ball.position.x-player.pos.x,ball.position.z-player.pos.z);
  if(d>3.6||ball.position.y-ku.gy>3.4)return;
  ku.streak++;
  ku.pts+=5*(1+Math.floor(ku.streak/10));
  const n=ku.streak*.14;
  ballS.vel.y=7.2+Math.random()*.8;
  ballS.vel.x=(player.pos.x-ball.position.x)*.55+(Math.random()-.5)*n;
  ballS.vel.z=(player.pos.z-ball.position.z)*.55+(Math.random()-.5)*n;
  ballS.squash=.22;
  audio&&audio.thump();
}
function kuGround(){
  if(!ku.on||ku.ended||ku.streak===0)return;
  ku.ended=true;ku.on=false;
  const n=ku.streak;
  const medal=n>=50?'gold':n>=25?'silver':n>=10?'bronze':null;
  const pts=ku.pts+(medal?{gold:200,silver:100,bronze:50}[medal]:0);
  addPoints(pts);
  const id=ku.st.city.id;
  if(medal)addStar(id,'b');
  if(medal==='gold')addStar(id,'g');
  const bk='ku_'+id,best=save.d.bests[bk]||0;
  if(n>best){save.d.bests[bk]=n;save.w();}
  if(medal==='gold')audio&&audio.pitchRoar();
  chResult(n+' touches',(medal?medal.toUpperCase()+' medal':'no medal')+' · +'+pts+' points<br>best here: '+Math.max(n,best),'');
}

/* ---------------- pitch game pads: the game menu lives in the world ---------------- */
const gamePadMeshes=[];
function gamePadTexture(label,color){
  const cv=document.createElement('canvas');cv.width=cv.height=512;const g=cv.getContext('2d');
  g.clearRect(0,0,512,512);g.translate(256,256);
  const gr=g.createRadialGradient(0,0,25,0,0,226);gr.addColorStop(0,'rgba(7,15,34,.72)');gr.addColorStop(.76,'rgba(7,15,34,.5)');gr.addColorStop(1,'rgba(7,15,34,0)');
  g.fillStyle=gr;g.beginPath();g.arc(0,0,228,0,TAU);g.fill();
  g.strokeStyle=color;g.lineWidth=13;g.globalAlpha=.9;g.beginPath();g.arc(0,0,190,0,TAU);g.stroke();
  g.globalAlpha=1;g.fillStyle='#ffe29a';g.font='800 64px Segoe UI, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('E',0,-44);
  g.fillStyle='#ffffff';g.font='700 29px Segoe UI, sans-serif';g.letterSpacing='2px';g.fillText(label.toUpperCase(),0,40);
  g.fillStyle='rgba(205,218,255,.8)';g.font='600 18px Segoe UI, sans-serif';g.fillText('CHALLENGE',0,77);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
{
  const specs=[['Penalty',0xffc95f],['Crossbar',0x7fd8ff],['Slalom',0x35e0d2],['Keepy',0xd99cff]];
  const tex=specs.map(x=>gamePadTexture(x[0],x[1]));
  const finalTex=gamePadTexture('Final','#ffd97a');
  for(const id in stadiums){const st=stadiums[id];PITCH_GAMES.forEach((pg,i)=>{
    fromStadLocal(st,pg.lx,pg.lz,_wo);
    const padTex=id==='ny'&&i===0?finalTex:tex[i];
    const m=new THREE.Mesh(new THREE.PlaneGeometry(6.4,6.4),new THREE.MeshBasicMaterial({map:padTex,transparent:true,opacity:.72,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    m.position.set(_wo[0],st.city.py+st.bowl.pitchY+.05,_wo[1]);m.rotation.set(-Math.PI/2,0,st.rot);m.renderOrder=3;scene.add(m);gamePadMeshes.push(m);
  });}
  anims.push({u:(t)=>{const o=.62+.12*Math.sin(t*2.2);for(const m of gamePadMeshes)m.material.opacity=o;}});
}

/* ---------------- game five: promenade dash ---------------- */
const dash={on:false,objs:[]};
const DASH_GOLD=24,DASH_SILVER=31,DASH_BRONZE=40;
function dashRoute(){
  const c=CITY.kc;
  return [[145,100],[208,78],[228,14],[198,-62],[132,-104],[72,-58],[70,18],[108,82],[145,100]].map(p=>({x:c.x+p[0],z:c.z+p[1]}));
}
function startDash(){
  startChallenge({
    title:'PROMENADE DASH',
    rules:'Sprint through the seven illuminated gates in order. The course loops around Kansas City and returns to the start.<br>Use WASD and hold Shift to sprint.',
    medals:`gold ${DASH_GOLD}s &nbsp;·&nbsp; silver ${DASH_SILVER}s &nbsp;·&nbsp; bronze ${DASH_BRONZE}s`,
    begin(){dashBegin();},
    hudText:()=>`promenade dash · gate ${Math.min(dash.i,7)}/7 · ${dash.t.toFixed(1)}s`,
    tick(dt){dashTick(dt);},abort(){dashCleanup();},cleanup(){dashCleanup();},
  });
}
function dashBegin(){
  dash.on=true;dash.route=dashRoute();dash.i=1;dash.t=0;dash.done=false;dash.objs=[];
  const geo=new THREE.TorusGeometry(2.55,.18,8,36);
  dash.route.slice(1,-1).forEach((p,i)=>{
    const n=dash.route[i+2]||dash.route[i+1],ang=Math.atan2(n.x-p.x,n.z-p.z);
    const y=Math.max(terrainH(p.x,p.z),CFG.seaY)+2.7;
    const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:i===0?0xffd97a:0x7fd8ff,transparent:true,opacity:.78,blending:THREE.AdditiveBlending,depthWrite:false}));
    m.position.set(p.x,y,p.z);m.rotation.y=ang;m.renderOrder=4;scene.add(m);dash.objs.push(m);
    const halo=new THREE.PointLight(i===0?0xffd97a:0x7fd8ff,.55,18,2);halo.position.copy(m.position);scene.add(halo);dash.objs.push(halo);
  });
  const a=dash.route[0],b=dash.route[1],gy=Math.max(terrainH(a.x,a.z),CFG.seaY);
  mode='ground';player.insideId=null;player.pos.set(a.x,gy+CFG.eye,a.z);player.vel.set(0,0,0);player.vy=0;
  player.yaw=Math.atan2(-(b.x-a.x),-(b.z-a.z));player.pitch=.02;syncLook();camera.fov=68;camera.updateProjectionMatrix();
  showBanner('PROMENADE DASH','seven gates · hold Shift to sprint');
}
function dashTick(dt){
  if(!dash.on||dash.done)return;dash.t+=dt;
  const target=dash.route[dash.i];
  if(target&&Math.hypot(player.pos.x-target.x,player.pos.z-target.z)<4.2){
    audio&&audio.chime();
    const ring=dash.objs[(dash.i-1)*2];if(ring&&ring.material){ring.material.color.setHex(0x62f5a1);ring.scale.setScalar(1.18);}
    dash.i++;
    if(dash.i>=dash.route.length-1)dashFinish();
  }
  dash.objs.forEach((o,i)=>{if(o.isMesh)o.rotation.z+=dt*(i%2?.4:.65);});
}
function dashCleanup(){dash.on=false;dash.objs.forEach(o=>scene.remove(o));dash.objs.length=0;}
function dashFinish(){
  if(dash.done)return;dash.done=true;const t=dash.t;
  const medal=t<=DASH_GOLD?'gold':t<=DASH_SILVER?'silver':t<=DASH_BRONZE?'bronze':null;
  const pts=medal==='gold'?350:medal==='silver'?190:medal==='bronze'?100:30;addPoints(pts);
  if(medal)addStar('_dash','s');if(medal==='gold')addStar('_dash','g');
  const best=save.d.bests.dash||999;if(t<best){save.d.bests.dash=+t.toFixed(1);save.w();}
  if(medal==='gold'){audio&&audio.pitchRoar();goalBurst.fire(player.pos.x,player.pos.y+5,player.pos.z);}
  dashCleanup();chResult(t.toFixed(1)+'s',(medal?medal.toUpperCase()+' medal':'no medal')+' · +'+pts+' points<br>personal best: '+Math.min(t,best).toFixed(1)+'s','');
}
addInteract(CITY.kc.x+145,CITY.kc.z+100,'start the Promenade Dash',startDash,17,4);

/* ---------------- midway game: Neon Target Gallery — LA flagship ---------------- */
const neonGallery=(()=>{
  const st=coaster.stations.find(s=>s.id==='la'),g=new THREE.Group();
  let best=null,bestScore=-1e9;
  for(const sign of[-1,1])for(const sideD of[22,27,32])for(const along of[-8,0,8]){
    const cx=st.x+st.sx*sideD*sign+st.tx*along,cz=st.z+st.sz*sideD*sign+st.tz*along,h=terrainH(cx,cz);
    const score=(h>1.5?100:-100)+h-Math.abs(along)*.15-Math.abs(sideD-27)*.2;
    if(score>bestScore){bestScore=score;best={x:cx,z:cz,h};}
  }
  const x=best.x,z=best.z,y=Math.max(best.h,CFG.seaY)+.2;
  const face=new THREE.Vector3(st.x-x,0,st.z-z).normalize(),yaw=Math.atan2(face.x,face.z);
  g.position.set(x,y,z);g.rotation.y=yaw;scene.add(g);
  const B=new Batch(),E=new Batch();
  B.add(PRIM.box,0x182133,0,1.5,-3.2,0,15,3,2.35);
  B.add(PRIM.box,0x7b4a67,0,.35,0,0,16,.7,9.5);
  B.add(PRIM.box,0xe7ddcc,0,1.25,2.7,0,15,1.1,1.5);
  for(const sx of[-7,7])B.add(PRIM.cyl,0x68717a,sx,3.8,1.8,0,.25,7.6,.25);
  B.add(PRIM.box,0x111b32,0,7.25,-.45,0,16,.6,8.1);
  /* real target rails and a lower service catwalk. */
  for(const yy of[2.3,3.65,5]){
    B.add(PRIM.box,0x4b5666,0,yy,-4.48,0,13.2,.12,.18);
    for(const xx of[-5.15,-1.72,1.72,5.15])B.add(PRIM.cyl,0x75808a,xx,yy,-4.45,0,.09,.55,.09);
  }
  B.add(PRIM.box,0x2b3442,0,1.46,-4.35,0,13.4,.28,.42);
  for(let i=-7;i<=7;i++)E.add(PRIM.sph,i%2?0x7fd8ff:0xff5ca8,i,6.9,3.22,0,.24,.24,.24);
  E.add(PRIM.box,0xffd97a,0,6.38,-4.02,0,14.4,.15,.11);
  E.add(PRIM.disc,0x7fd8ff,0,.74,7.2,0,3.6,.08,3.6);
  /* floor lane quietly teaches where to stand without a card. */
  for(let zz=3.7;zz<=8.3;zz+=.85)E.add(PRIM.box,zz%1.7<.1?0xffd97a:0x7fd8ff,0,.77,zz,0,.12,.035,.48);
  const bm=B.build(MAT.opaque,true),em=E.build(MAT.glow,false);if(bm)g.add(bm);if(em)g.add(em);
  const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const cg=cv.getContext('2d');
  const gr=cg.createLinearGradient(0,0,1024,0);gr.addColorStop(0,'#101c3f');gr.addColorStop(.5,'#431744');gr.addColorStop(1,'#101c3f');cg.fillStyle=gr;cg.fillRect(0,0,1024,256);
  cg.strokeStyle='#ffd97a';cg.lineWidth=8;cg.strokeRect(10,10,1004,236);cg.textAlign='center';cg.fillStyle='#fff';cg.font='900 68px "Segoe UI",sans-serif';cg.fillText('NEON TARGET GALLERY',512,105);
  cg.fillStyle='#7fd8ff';cg.font='700 26px "Segoe UI",sans-serif';cg.fillText('CLICK THE LIVE TARGET  •  CHAIN HITS  •  GOLD TARGET = BONUS',512,161);
  cg.fillStyle='#d9e0fb';cg.font='650 20px "Segoe UI",sans-serif';cg.fillText('STEP ON THE CYAN DISC TO PLAY',512,208);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(14.3,3.58),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));sign.position.set(0,5.2,-4.04);g.add(sign);
  const targets=[],colors=[0xff5ca8,0x7fd8ff,0xffd97a,0x70e69c];
  for(let i=0;i<12;i++){
    const mat=new THREE.MeshStandardMaterial({color:0x18213a,emissive:0x03050a,emissiveIntensity:1,metalness:.42,roughness:.28});
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.63,.14,10,26),mat);ring.position.set(-4.8+(i%4)*3.2,2.32+Math.floor(i/4)*1.36,-4.39);g.add(ring);
    const core=new THREE.Mesh(new THREE.CircleGeometry(.46,24),new THREE.MeshBasicMaterial({color:0x11182a,toneMapped:false}));core.position.copy(ring.position);core.position.z+=.04;g.add(core);
    targets.push({ring,core,base:ring.position.clone(),color:colors[i%colors.length],phase:hash2(i,811)*TAU});
  }
  const standLocal=new THREE.Vector3(0,CFG.eye,8.2),worldStand=standLocal.clone().applyAxisAngle(Y,yaw).add(new THREE.Vector3(x,y,z));
  return{x,z,y,yaw,g,targets,worldStand,st};
})();

/* The Neon Mile links SoFi to the arcade with architecture and light, not pop-up directions. */
const laDistrict=(()=>{
  const A=stadiums.la.entrance.clone(),B=new THREE.Vector3(neonGallery.x+Math.sin(neonGallery.yaw)*7,0,neonGallery.z+Math.cos(neonGallery.yaw)*7);
  const dx=B.x-A.x,dz=B.z-A.z,L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L,px=-uz,pz=ux,ry=-Math.atan2(uz,ux);
  const O=new Batch(),E=new Batch();
  for(let d=5;d<L-5;d+=5.5){
    const x=A.x+ux*d,z=A.z+uz*d,h=Math.max(terrainH(x,z),CFG.seaY);
    O.add(PRIM.box,0x242b35,x,h+.16,z,ry,5.7,.28,4.8);
    E.add(PRIM.box,d%11<6?0x7fd8ff:0xffd97a,x+px*1.85,h+.34,z+pz*1.85,ry,5.45,.055,.11);
    E.add(PRIM.box,d%11<6?0xffd97a:0x7fd8ff,x-px*1.85,h+.34,z-pz*1.85,ry,5.45,.055,.11);
  }
  for(const d of[9,L*.32,L*.64,L-9]){
    const x=A.x+ux*d,z=A.z+uz*d,h=Math.max(terrainH(x,z),CFG.seaY);
    for(const side of[-1,1]){
      O.add(PRIM.cyl,0x3c4654,x+px*side*3.2,h+1.8,z+pz*side*3.2,0,.18,3.6,.18);
      E.add(PRIM.sph,side>0?0x7fd8ff:0xffd97a,x+px*side*3.2,h+3.9,z+pz*side*3.2,0,.55,.42,.55);
    }
  }
  const om=O.build(MAT.opaque,true),em=E.build(MAT.glow,false);if(om)scene.add(om);if(em)scene.add(em);
  return{A,B,L};
})();

const arcade={on:false},arcRay=new THREE.Raycaster(),arcCenter=new THREE.Vector2(0,0);
function arcadeFlash(text,bonus=false){const el=$('arcadeFeedback');el.textContent=text;el.classList.toggle('bonus',bonus);el.classList.remove('on');void el.offsetWidth;el.classList.add('on');arcade.feedbackUntil=performance.now()+650;}
function arcadeSetTarget(){
  let n=Math.floor(Math.random()*neonGallery.targets.length);if(n===arcade.active)n=(n+1)%neonGallery.targets.length;
  arcade.active=n;arcade.window=Math.max(.38,1.08-arcade.hits*.022);arcade.bonus=arcade.hits>0&&arcade.hits%7===6;
  neonGallery.targets.forEach((t,i)=>{
    const on=i===n,hex=arcade.bonus&&on?0xffd97a:t.color;
    t.ring.material.color.setHex(on?hex:0x18213a);t.ring.material.emissive.setHex(on?hex:0x03050a);t.ring.material.emissiveIntensity=on?(arcade.bonus?2.7:2):1;
    t.core.material.color.setHex(on?0xffffff:0x11182a);t.ring.scale.setScalar(on?1.18:1);
  });
}
function arcadeCleanup(){
  arcade.on=false;$('arcadeCrosshair').classList.remove('on','hit');$('arcadeHud').classList.remove('on');$('arcadeFeedback').classList.remove('on','bonus');
  neonGallery.targets.forEach(t=>{t.ring.position.copy(t.base);t.core.position.copy(t.base);t.core.position.z+=.04;t.ring.material.color.setHex(0x18213a);t.ring.material.emissive.setHex(0x03050a);t.ring.material.emissiveIntensity=1;t.core.material.color.setHex(0x11182a);t.ring.scale.setScalar(1);});
  if(laPremiere.arcadeOwned){laPremiere.active=false;laPremiere.arcadeOwned=false;document.body.classList.remove('la-premiere');}
}
function arcadeFinish(){
  const score=arcade.score,accuracy=arcade.shots?Math.round(arcade.hits/arcade.shots*100):0;
  const medal=score>=6000?'gold':score>=3800?'silver':score>=2200?'bronze':null;
  const pts=medal==='gold'?500:medal==='silver'?280:medal==='bronze'?140:40;addPoints(pts);
  if(medal)addStar('midway','b');if(medal==='gold')addStar('midway','g');
  const best=save.d.bests.neonGallery||0;if(score>best){save.d.bests.neonGallery=score;save.w();}
  if(medal==='gold'){goalBurst.fire(neonGallery.x,neonGallery.y+6,neonGallery.z);audio&&audio.pitchRoar();}
  arcadeCleanup();
  chResult(score.toLocaleString(),(medal?medal.toUpperCase()+' medal':'keep the combo alive')+' · +'+pts+' points<br>accuracy '+accuracy+'% · best '+Math.max(score,best).toLocaleString(),`hits ${arcade.hits} · best combo ×${arcade.bestCombo}`);
}
function startNeonGallery(){
  startChallenge({
    title:'NEON TARGET GALLERY',
    begin(){
      arcade.on=true;arcade.time=35;arcade.score=0;arcade.combo=1;arcade.bestCombo=1;arcade.hits=0;arcade.shots=0;arcade.active=-1;arcade.window=1;arcade.bonus=false;arcade.feedbackUntil=0;
      if(!laPremiere.active){laPremiere.active=true;laPremiere.arcadeOwned=true;document.body.classList.add('la-premiere');}
      player.pos.copy(neonGallery.worldStand);player.vel.set(0,0,0);player.vy=0;mode='ground';
      const aim=new THREE.Vector3(0,3.7,-3.8).applyAxisAngle(Y,neonGallery.yaw).add(new THREE.Vector3(neonGallery.x,neonGallery.y,neonGallery.z));
      player.yaw=Math.atan2(-(aim.x-player.pos.x),-(aim.z-player.pos.z));player.pitch=.02;syncLook();
      $('arcadeCrosshair').classList.add('on');$('arcadeHud').classList.add('on');arcadeSetTarget();arcadeFlash('lights up');
    },
    click(){
      if(!arcade.on)return;arcade.shots++;arcRay.setFromCamera(arcCenter,camera);
      const active=neonGallery.targets[arcade.active],hits=arcRay.intersectObjects([active.ring,active.core],false);
      if(hits.length){
        const mult=arcade.combo,base=arcade.bonus?500:100,gain=base*mult;
        arcade.hits++;arcade.score+=gain;arcade.combo=Math.min(15,arcade.combo+1);arcade.bestCombo=Math.max(arcade.bestCombo,arcade.combo);
        active.ring.getWorldPosition(_v3);flare(_v3.x,_v3.y,_v3.z,arcade.bonus?0xffd97a:active.color);
        active.ring.scale.setScalar(1.7);const cr=$('arcadeCrosshair');cr.classList.remove('hit');void cr.offsetWidth;cr.classList.add('hit');
        arcadeFlash(arcade.bonus?'gold target +'+gain:'hit +'+gain,arcade.bonus);audio&&audio.chime();arcadeSetTarget();
      }else{
        arcade.combo=1;arcade.time=Math.max(0,arcade.time-.45);arcadeFlash('miss  −0.45s');audio&&audio.clack&&audio.clack();
      }
    },
    tick(dt){
      if(!arcade.on)return;player.pos.copy(neonGallery.worldStand);player.vel.set(0,0,0);player.vy=0;
      arcade.time-=dt;arcade.window-=dt;
      const now=performance.now()*.001;
      neonGallery.targets.forEach((t,i)=>{
        const active=i===arcade.active,amp=active?(arcade.bonus?.48:.32):.035;
        t.ring.position.x=t.base.x+Math.sin(now*(arcade.bonus?3.4:2.25)+t.phase)*amp;
        t.ring.position.y=t.base.y+Math.cos(now*(arcade.bonus?2.9:1.85)+t.phase)*amp*.55;
        t.core.position.copy(t.ring.position);t.core.position.z+=.04;
      });
      const a=neonGallery.targets[arcade.active],pulse=1.12+Math.sin(performance.now()*.013)*.08;a.ring.scale.lerp(new THREE.Vector3(pulse,pulse,pulse),Math.min(1,dt*10));
      $('arcadeTime').textContent=Math.max(0,arcade.time).toFixed(1);$('arcadeScore').textContent=arcade.score.toLocaleString()+' pts';$('arcadeCombo').textContent='×'+arcade.combo;
      if(arcade.feedbackUntil&&performance.now()>arcade.feedbackUntil){$('arcadeFeedback').classList.remove('on','bonus');arcade.feedbackUntil=0;}
      if(arcade.window<=0){arcade.combo=1;arcadeFlash('target moved');arcadeSetTarget();}
      if(arcade.time<=0)arcadeFinish();
    },
    abort(){arcadeCleanup();},cleanup(){arcadeCleanup();},
  });
}
addInteract(neonGallery.x+Math.sin(neonGallery.yaw)*7,neonGallery.z+Math.cos(neonGallery.yaw)*7,'play the Neon Target Gallery',startNeonGallery,15,3);

/* ============================================================
   PASS 8: wayfinding, passport, ride photo, visitors, finale
   ============================================================ */
/* B1: glowing totems over every station and Tier 1 experience */
const totems=[];
{
  const mk=(x,z,color,h,r)=>{
    const g2=new THREE.CylinderGeometry(r,r*1.9,h,8,1,true);
    const m=new THREE.Mesh(g2,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,
      blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
    m.position.set(x,Math.max(terrainH(x,z),CFG.seaY)+h/2,z);
    scene.add(m);totems.push(m);
  };
  coaster.stations.forEach(s=>{
    mk(s.x,s.z,s.id==='ny'&&save.d.goal?0xffd97a:0x7fd8ff,230,2.2);
    if(s.id==='ny')nyTotem=totems[totems.length-1];
  });
  [[CITY.hou.x+150,CITY.hou.z+20],[CITY.atl.x+150,CITY.atl.z+10],
   [CITY.mex.x+80,CITY.mex.z-40],[CITY.phi.x-100,CITY.phi.z+62],
   [ggRef?ggRef.lift.x:0,ggRef?ggRef.lift.z:0]].forEach(p=>mk(p[0],p[1],0xffd97a,130,1.5));
  anims.push({u:(t)=>{
    /* near-invisible by day, rising through dusk into night */
    const o=(.09+.05*Math.sin(t*1.6))*(glowLevel?1:.25)*(.07+nightAmt*1.15);
    for(const m of totems)m.material.opacity=o;
  }});
}
/* B1: bobbing markers over every interaction */
{
  const icons=[];
  interactions.forEach(it=>{
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xffd97a,transparent:true,opacity:.8,depthWrite:false}));
    const gy=Math.max(terrainH(it.x,it.z),CFG.seaY);
    s.position.set(it.x,gy+7,it.z);s.scale.set(3,3,1);
    scene.add(s);icons.push({s,gy,ph:hash2(it.x,it.z)*TAU});
  });
  anims.push({u:(t)=>{
    const vis=perfLevel<2;
    for(const ic of icons){ic.s.visible=vis;ic.s.position.y=ic.gy+7+Math.sin(t*2.2+ic.ph)*.8;}
  }});
}
/* B1: first-run tips, persisted */
const tips=Object.assign({st:false,land:false,stad:false,night:false},save.d.tips);
function tipOnce(k,msg){
  if(tips[k])return;
  tips[k]=true;save.d.tips=tips;save.w();
  flashHint(msg);
}
/* B2: the passport, persisted, worth a star per city */
const stamps=new Set(save.d.stamps);
function stampCity(id){
  if(stamps.has(id))return;
  stamps.add(id);
  save.d.stamps=[...stamps];save.w();
  flashHint('passport stamped, '+stamps.size+' / 16');
  addPoints(50);
  addStar(id,'s');
  if(stamps.size===16){
    showBanner('PARK CHAMPION','all sixteen grounds visited');
    goalBurst.fire(player.pos.x,player.pos.y+6,player.pos.z);
    audio&&audio.pitchRoar();
  }
}
/* B3: ride photo state */
let ridePhoto=null,ridePhotoPending=false;
/* B4 / PASS 17: a living park — walkers, queues, and visible staff */
{
  const visitorGeo=(()=>{
    const parts=[];
    const torso=new THREE.BoxGeometry(.56,.78,.34);torso.translate(0,1.18,0);parts.push(NI(torso));
    const head=new THREE.SphereGeometry(.22,7,6);head.translate(0,1.86,0);parts.push(NI(head));
    for(const x of[-.17,.17]){const leg=new THREE.BoxGeometry(.16,.72,.18);leg.translate(x,.43,0);parts.push(NI(leg));}
    const bag=new THREE.BoxGeometry(.36,.46,.16);bag.translate(.34,1.18,-.17);parts.push(NI(bag));
    return mergeGeometries(parts,false);
  })();
  const cols=[0xd94f54,0x3f7fd9,0xe8e6df,0xf2c744,0x3fa66a,0x8a5a44,0x874fb5,0x1f8e92];
  const ROUTES=[['la','kc'],['kc','dal'],['dal','atl'],['atl','mia'],['phi','ny'],['tor','ny'],['mex','mty'],['van','sea'],['hou','dal'],['sf','la'],['bos','ny'],['gdl','mex'],['sea','kc'],['atl','phi']];
  const N=84,walkers=new THREE.InstancedMesh(visitorGeo,new THREE.MeshLambertMaterial({color:0xffffff}),N);
  walkers.frustumCulled=false;scene.add(walkers);
  const vs=[];
  for(let i=0;i<N;i++){
    const[Aid,Bid]=ROUTES[i%ROUTES.length],A=CITY[Aid],B=CITY[Bid];
    vs.push({A,B,phase:hash2(i,3),spd:.018+hash2(i,5)*.02,side:(hash2(i,7)-.5)*16,ph:hash2(i,9)*TAU,reverse:hash2(i,17)<.5});
    walkers.setColorAt(i,new THREE.Color(cols[i%cols.length]).offsetHSL(0,(hash2(i,11)-.5)*.16,(hash2(i,13)-.5)*.12));
  }
  if(walkers.instanceColor)walkers.instanceColor.needsUpdate=true;
  const QN=64,queues=new THREE.InstancedMesh(visitorGeo,new THREE.MeshLambertMaterial({color:0xffffff}),QN);
  queues.frustumCulled=false;scene.add(queues);
  const qData=[];let qi=0;
  for(const st of coaster.stations){
    for(let k=0;k<4;k++){
      const row=Math.floor(k/2),col=k%2;
      qData.push({st,lx:-4.8+col*3.2+row*6.2,lz:2.25+row*1.9,ph:hash2(qi,41)*TAU});
      queues.setColorAt(qi++,new THREE.Color(cols[(k+st.id.length)%cols.length]));
    }
  }
  queues.count=qi;if(queues.instanceColor)queues.instanceColor.needsUpdate=true;
  const staffGeo=visitorGeo,staffN=32,staff=new THREE.InstancedMesh(staffGeo,new THREE.MeshLambertMaterial({color:0xf0c53e}),staffN);
  staff.frustumCulled=false;scene.add(staff);
  const staffData=[];
  for(const st of coaster.stations)staffData.push({x:st.x+st.tx*5.4+st.sx*2.7,z:st.z+st.tz*5.4+st.sz*2.7,y:st.y-.72,yaw:st.yaw,ph:hash2(st.x,st.z)*TAU});
  for(const id of Object.keys(stadiums)){
    const st=stadiums[id],v=new THREE.Vector3().subVectors(st.entrance,st.center);v.y=0;v.normalize();
    staffData.push({x:st.entrance.x-v.z*4,z:st.entrance.z+v.x*4,y:st.city.py+.1,yaw:Math.atan2(-v.z,v.x),ph:hash2(st.city.x,77)*TAU});
  }
  staff.count=staffData.length;
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E2=new THREE.Euler(),V=new THREE.Vector3(),S=new THREE.Vector3(1.22,1.22,1.22);
  function easeWalk(u){return u*u*(3-2*u);}
  anims.push({u:(t,dt)=>{
    const visible=perfLevel<2;walkers.visible=queues.visible=staff.visible=visible;if(!visible)return;
    for(let i=0;i<N;i++){
      const v=vs[i],cycle=(t*v.spd+v.phase)%1;
      const ping=cycle<.5?cycle*2:(1-cycle)*2,p=easeWalk(clamp((ping-.07)/.86,0,1));
      const dir=cycle<.5?1:-1,dx=v.B.x-v.A.x,dz=v.B.z-v.A.z,L=Math.max(1,Math.hypot(dx,dz)),px=-dz/L,pz=dx/L;
      const x=lerp(v.A.x,v.B.x,p)+px*v.side,z=lerp(v.A.z,v.B.z,p)+pz*v.side;
      const pause=(ping<.07||ping>.93),bob=pause?0:Math.abs(Math.sin(t*8+v.ph))*.11;
      const y=Math.max(terrainH(x,z),CFG.seaY)+bob;
      E2.set(0,Math.atan2(-dx*dir,-dz*dir)+Math.sin(t*.7+v.ph)*.05,0);Q.setFromEuler(E2);V.set(x,y,z);
      const sway=1+Math.sin(t*4+v.ph)*.025;S.set(1.2,1.2*sway,1.2);M.compose(V,Q,S);walkers.setMatrixAt(i,M);
    }
    walkers.instanceMatrix.needsUpdate=true;
    for(let i=0;i<qData.length;i++){
      const q=qData[i],st=q.st,x=st.x+st.tx*q.lx+st.sx*q.lz,z=st.z+st.tz*q.lx+st.sz*q.lz;
      const y=st.y-.72+Math.abs(Math.sin(t*2.4+q.ph))*.035;
      E2.set(0,st.yaw+Math.sin(t*.45+q.ph)*.18,0);Q.setFromEuler(E2);V.set(x,y,z);S.set(1.18,1.18,1.18);M.compose(V,Q,S);queues.setMatrixAt(i,M);
    }
    queues.instanceMatrix.needsUpdate=true;
    for(let i=0;i<staffData.length;i++){
      const p=staffData[i];E2.set(0,p.yaw+Math.sin(t*.35+p.ph)*.08,Math.sin(t*.9+p.ph)*.018);Q.setFromEuler(E2);
      V.set(p.x,p.y+Math.abs(Math.sin(t*2+p.ph))*.025,p.z);S.set(1.24,1.24,1.24);M.compose(V,Q,S);staff.setMatrixAt(i,M);
    }
    staff.instanceMatrix.needsUpdate=true;
  }});
}
/* golden-hour motes: felt, not seen */
{
  const n=120,g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({color:0xffe9b8,size:.18,map:dotTex,
    transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  p.frustumCulled=false;p.visible=false;scene.add(p);
  const seeds=[];for(let i=0;i<n;i++)seeds.push([hash2(i,1),hash2(i,2),hash2(i,3)]);
  anims.push({u:(t,dt)=>{
    const grounded=mode==='ground'||mode==='inside';
    const elev=Math.sin((dayT-.25)*TAU);
    const golden=clamp(1-Math.abs(elev-.32)*3.2,0,1)*(1-nightAmt);
    const target=(grounded&&perfLevel<2)?golden*.5:0;
    p.material.opacity+=(target-p.material.opacity)*Math.min(1,dt*2);
    if(p.material.opacity<.02){p.visible=false;return;}
    p.visible=true;
    const a=g.attributes.position.array;
    for(let i=0;i<n;i++){
      const s2=seeds[i];
      a[i*3]  =camera.position.x+((s2[0]*80+t*(0.5+s2[2]))%80)-40;
      a[i*3+1]=camera.position.y-5+((s2[1]*12+t*.4)%12)-3;
      a[i*3+2]=camera.position.z+((s2[2]*80+t*.7)%80)-40;
    }
    g.attributes.position.needsUpdate=true;
  }});
}
/* B6: heat shimmer over the Texan flats at midday */
const shimmers=[];
[[CITY.dal.x-40,CITY.dal.z+90],[CITY.hou.x+60,CITY.hou.z+60]].forEach((p,i)=>{
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:0xffe2b8,transparent:true,
    opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  s.position.set(p[0],Math.max(terrainH(p[0],p[1]),CFG.seaY)+4,p[1]);
  s.scale.set(260,18,1);
  scene.add(s);shimmers.push({s,ph:i*2.1});
});
anims.push({u:(t)=>{
  const midday=Math.max(0,1-Math.abs(dayT-.5)*7);
  for(const sh of shimmers){
    sh.s.material.opacity=.055*midday*(perfLevel<2?1:0);
    sh.s.scale.x=250+Math.sin(t*1.3+sh.ph)*22;
    sh.s.position.y+=(Math.sin(t*2.7+sh.ph)*.012);
  }
}});
/* PASS 10: designed approaches and plaza edges */
{
  const AV=new Batch(),AO=new Batch(),AE=new Batch();
  for(const id in stadiums){
    const st2=stadiums[id],c=st2.city;
    const stn=coaster.stations.find(s=>s.id===id);
    if(!stn)continue;
    let dx=stn.x-c.x,dz=stn.z-c.z;
    const L2=Math.hypot(dx,dz);dx/=L2;dz/=L2;
    const px2=-dz,pz2=dx;
    const ry=-Math.atan2(dz,dx);
    /* the avenue: plaza apron out to the boarding station */
    for(let d=118;d<L2-13;d+=17){
      const ax=c.x+dx*d,az=c.z+dz*d;
      const h=terrainH(ax,az);
      if(h<1.5)continue;
      AV.add(PRIM.box,0xd9cdae,ax,h+.24,az,ry,18,.4,10);
      const k=Math.round(d/17);
      if(k%2===0){
        for(const s of[-1,1]){
          const tx=ax+px2*s*8.5,tz=az+pz2*s*8.5;
          treeReq.pop.push({x:tx,z:tz,y:terrainH(tx,tz),s:.9+hash2(k,c.x)*.3,c:new THREE.Color(0x47804a)});
        }
      }else{
        for(const s of[-1,1]){
          const bx2=ax+px2*s*7.4,bz2=az+pz2*s*7.4;
          const bh=terrainH(bx2,bz2);
          AO.add(PRIM.cyl,0x8a8e94,bx2,bh+3.4,bz2,0,.4,6.8,.4);
          AE.add(PRIM.sph,0xffd98a,bx2,bh+7,bz2,0,1.2,.9,1.2);
          flagField.flag(bx2,bh+6.2,bz2,ry,3.2,2,[0xd94f54,0x3f7fd9,0xf2c744,0x3fa66a][k%4],0xe8e6df);
        }
      }
    }
    /* plaza edge: hedge ring with gaps at the gate and the avenue */
    const entA2=Math.atan2(st2.entrance.z-c.z,st2.entrance.x-c.x);
    const avA=Math.atan2(dz,dx);
    for(let i=0;i<26;i++){
      const a=i/26*TAU;
      let d1=Math.abs(a-((entA2+TAU)%TAU));d1=Math.min(d1,TAU-d1);
      let d2=Math.abs(a-((avA+TAU)%TAU));d2=Math.min(d2,TAU-d2);
      if(d1<.42||d2<.42)continue;
      const hx2=c.x+Math.cos(a)*146,hz2=c.z+Math.sin(a)*126;
      const hh=terrainH(hx2,hz2);
      if(hh<1.5)continue;
      treeReq.shrub.push({x:hx2,z:hz2,y:hh,s:1.15+hash2(i,c.x)*.35,c:new THREE.Color(0x4d7a44)});
    }
  }
  const av=AV.build(MAT.paved,true);if(av)scene.add(av);
  const ao=AO.build(MAT.opaque,true);if(ao)scene.add(ao);
  const ae=AE.build(MAT.glow,false);if(ae)scene.add(ae);
}
/* B5: the finale over the final */
let lastFinale=-999,finaleOn=false,finaleT=0,finaleAnnounced=false;
anims.push({u:(t,dt)=>{
  if(finaleOn){
    finaleT+=dt;
    if(Math.floor(finaleT/1.1)!==Math.floor((finaleT-dt)/1.1)){
      const f=fireworks.find(x=>x.t<0);
      if(f)f.fire(CITY.ny.x+(Math.random()-.5)*160,CITY.ny.py+120+Math.random()*90,
        CITY.ny.z+(Math.random()-.5)*160,[0xffd97a,0xff6a5a,0x7fd8ff,0xd977b8][Math.floor(Math.random()*4)]);
      audio&&audio.clack&&audio.clack();
    }
    if(finaleT>20)finaleOn=false;
  }else if(nightAmt>.5&&phase==='play'&&t-lastFinale>240){
    lastFinale=t;finaleOn=true;finaleT=0;
    if(!finaleAnnounced){finaleAnnounced=true;showBanner('THE FINALE','over the final');}
  }
  if(nightAmt>.6&&!tips.night&&phase==='play')tipOnce('night','press P for photo mode');
}});
/* ---------------- game two: the golden pin hunt ---------------- */
const PINS=(()=>{
  const list=[];
  const add=(x,z,y)=>{
    if(y===undefined){
      /* pull shoreline spawns inland until they sit on dry ground */
      let gx=x,gz=z,g=terrainH(gx,gz);
      for(let k=0;k<24&&g<1.6;k++){gx*=.93;gz*=.93;g=terrainH(gx,gz);}
      list.push({x:gx,z:gz,y:g+1.3});
    }else list.push({x,z,y});
  };
  const off={mex:[-150,52],gdl:[140,-8],mty:[-200,-30],la:[176,-30],sf:[150,-40],sea:[150,-48],van:[-140,-90],
             kc:[150,44],dal:[160,-52],hou:[162,20],atl:[110,92],mia:[190,142],tor:[152,-20],bos:[196,-120],phi:[-150,22],ny:[132,200]};
  for(const id in off){const c=CITY[id];add(c.x+off[id][0],c.z+off[id][1]);}
  if(ggRef)add(ggRef.mid.x,ggRef.mid.z,ggRef.deckY+1.5);
  {const s=coaster.stations.find(s2=>s2.id==='kc');add(s.x,s.z-2,s.y+.5);}
  {const p=coaster.curve.getPointAt(coaster.uDrop);add(p.x,p.z,p.y+3);}
  add(CITY.ny.x+120,CITY.ny.z+204);
  add(CITY.bos.x+210,CITY.bos.z-134);
  add(CITY.mex.x+240,CITY.mex.z+170,Math.max(terrainH(CITY.mex.x+240,CITY.mex.z+170),CFG.seaY)+165);
  add(CITY.mty.x-230,CITY.mty.z-40,Math.max(terrainH(CITY.mty.x-230,CITY.mty.z-40),CFG.seaY)+125);
  add(CITY.van.x-196,CITY.van.z-226);
  for(let i=0;i<RIBBON_ORDER.length-1&&list.length<30;i++){
    const A=CITY[RIBBON_ORDER[i]],B=CITY[RIBBON_ORDER[i+1]];
    const mx=(A.x+B.x)/2+8,mz=(A.z+B.z)/2+8;
    if(terrainH(mx,mz)>1.5)add(mx,mz);
  }
  return list.slice(0,30);
})();
const pinMeshes=[];
{
  const geo=new THREE.IcosahedronGeometry(.55,0);
  const mat=new THREE.MeshLambertMaterial({color:0xffd34a,emissive:0x6a4a08,flatShading:true});
  PINS.forEach((p,i)=>{
    const id='pin'+i;
    const m=new THREE.Mesh(geo,mat);
    m.position.set(p.x,p.y,p.z);
    m.visible=!save.d.pins.includes(id);
    scene.add(m);
    pinMeshes.push({m,id,x:p.x,y:p.y,z:p.z,ph:hash2(i,5)*TAU});
  });
  let chimeT=0;
  anims.push({u:(t,dt)=>{
    chimeT-=dt;
    let nearest=1e9;
    for(const p of pinMeshes){
      if(!p.m.visible)continue;
      p.m.position.y=p.y+Math.sin(t*2+p.ph)*.25;
      p.m.rotation.y=t*1.5+p.ph;
      if(phase!=='play')continue;
      const d=Math.hypot(player.pos.x-p.x,player.pos.z-p.z);
      const dy=Math.abs(player.pos.y-p.y);
      if(d<2.5&&dy<3.6)collectPin(p);
      else if(d<20&&dy<24)nearest=Math.min(nearest,d);
    }
    if(nearest<20&&chimeT<=0){chimeT=.9+nearest*.05;audio&&audio.pin&&audio.pin();}
  }});
}
function collectPin(p){
  if(save.d.pins.includes(p.id))return;
  p.m.visible=false;
  save.d.pins.push(p.id);save.w();
  addPoints(25);
  audio&&audio.chime();
  flashHint('golden pin, '+save.d.pins.length+' / 30');
  const n=save.d.pins.length;
  if(n===10||n===20){addPoints(n===10?100:200);showBanner('PIN MILESTONE',n+' of 30 found');}
  if(n>=30){addStar('_pins','g');showBanner('PIN CHAMPION','all thirty found');}
  updateHud();
}

/* ---------------- wild trees across the continent ---------------- */
{
  /* groves with clearings between them, biome chosen per grove */
  const rng=(i,k)=>hash2(i*7.13,k*3.71);
  let placed=0,gi=0;
  while(placed<1050&&gi<4000){
    const i=gi++;
    const gx=(rng(i,1)-.5)*3200,gz=(rng(i,2)-.5)*2600;
    const gh=terrainH(gx,gz);
    if(gh<3||gh>120)continue;
    let nearCity=false;
    for(const c of CITIES){const dx=gx-c.x,dz=gz-c.z;if(dx*dx+dz*dz<185*185){nearCity=true;break;}}
    if(nearCity)continue;
    const north=smoothstep(240,-380,gz),west=smoothstep(-340,-720,gx)*smoothstep(140,-120,gz);
    const conif=Math.max(north,west*.7);
    const socal=smoothstep(0,220,gz)*smoothstep(-620,-880,gx);
    const tropical=smoothstep(300,620,gz)*smoothstep(170,500,gx)+socal;
    const dry=smoothstep(90,380,gz)*smoothstep(90,-380,gx);
    const r=rng(i,3);
    let type='leaf',c=0x5d8a4a;
    if(r<conif*.85){type='con';c=0x2e5940;}
    else if(r<conif*.85+tropical*.7){type='palm';c=0x4d9a52;}
    else if(rng(i,4)<dry*.8){type='agave';c=0x87a06a;}
    const n2=5+Math.floor(rng(i,10)*8);
    for(let k=0;k<n2&&placed<1050;k++){
      const x=gx+(rng(i,20+k)-.5)*46,z=gz+(rng(i,50+k)-.5)*46;
      const h=terrainH(x,z);
      if(h<3||h>120)continue;
      let t2=type,c2=c;
      if(type==='leaf'&&rng(i,80+k)<.24){t2='pop';c2=0x47804a;}
      if(type==='agave'&&rng(i,110+k)<.35){t2='shrub';c2=0x7a9a58;}
      const s=.8+rng(i,140+k)*1.1;
      const cc=new THREE.Color(c2);cc.offsetHSL((rng(i,170+k)-.5)*.06,0,(rng(i,200+k)-.5)*.12);
      treeReq[t2].push({x,z,y:h,s,c:cc});
      placed++;
    }
  }
}
/* tree instancers: trunks + canopies per type */
function buildTreeType(list,trunkGeo,canGeo,trunkCol){
  if(!list.length)return;
  const tIm=new THREE.InstancedMesh(trunkGeo,new THREE.MeshLambertMaterial({color:trunkCol,flatShading:true}),list.length);
  const cIm=new THREE.InstancedMesh(canGeo,new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),list.length);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),EU=new THREE.Euler(),V=new THREE.Vector3(),S=new THREE.Vector3();
  list.forEach((t,i)=>{
    EU.set(0,hash2(t.x,t.z)*TAU,0);Q.setFromEuler(EU);
    V.set(t.x,t.y,t.z);S.set(t.s,t.s,t.s);
    M.compose(V,Q,S);
    tIm.setMatrixAt(i,M);cIm.setMatrixAt(i,M);
    cIm.setColorAt(i,(t.c instanceof THREE.Color)?t.c:new THREE.Color(t.c));
  });
  tIm.instanceMatrix.needsUpdate=true;cIm.instanceMatrix.needsUpdate=true;
  if(cIm.instanceColor)cIm.instanceColor.needsUpdate=true;
  tIm.castShadow=cIm.castShadow=true;
  scene.add(tIm);scene.add(cIm);
}
{
  /* conifer */
  const tg=new THREE.CylinderGeometry(.5,.7,4,5);tg.translate(0,2,0);
  const c1=new THREE.ConeGeometry(3.6,7,7);c1.translate(0,7,0);
  const c2=new THREE.ConeGeometry(2.6,6,7);c2.translate(0,11.4,0);
  buildTreeType(treeReq.con,tg,mergeGeometries([NI(c1),NI(c2)],false),0x5a4633);
  /* broadleaf */
  const tg2=new THREE.CylinderGeometry(.5,.8,4.5,5);tg2.translate(0,2.2,0);
  const b1=new THREE.IcosahedronGeometry(4,0);b1.translate(0,7.4,0);b1.scale(1,.85,1);
  buildTreeType(treeReq.leaf,tg2,NI(b1),0x6a5138);
  /* palm: crown of drooping fronds */
  const tg3=new THREE.CylinderGeometry(.4,.6,9,5);tg3.translate(0,4.5,0);tg3.rotateZ(.06);
  const fr=[];
  for(let i=0;i<6;i++){
    const f=new THREE.ConeGeometry(.85,6.4,4);
    f.scale(1,1,.38);
    f.translate(0,2.9,0);
    const m=new THREE.Matrix4().makeRotationY(i/6*TAU);
    m.multiply(new THREE.Matrix4().makeRotationX(1.95+(i%2)*.22));
    f.applyMatrix4(m);f.translate(0,9.4,0);
    fr.push(NI(f));
  }
  buildTreeType(treeReq.palm,tg3,mergeGeometries(fr,false),0x8a7350);
  /* agave */
  const tg4=new THREE.CylinderGeometry(.3,.5,1,5);tg4.translate(0,.5,0);
  const ag=[];
  for(let i=0;i<7;i++){
    const f=new THREE.ConeGeometry(.7,4.6,4);
    const m=new THREE.Matrix4().makeRotationY(i/7*TAU);
    m.multiply(new THREE.Matrix4().makeRotationX(.7));
    f.translate(0,2.3,0);f.applyMatrix4(m);f.translate(0,.6,0);
    ag.push(NI(f));
  }
  buildTreeType(treeReq.agave,tg4,mergeGeometries(ag,false),0x7a6a4a);
  /* poplar: tall and columnar */
  const tg5=new THREE.CylinderGeometry(.35,.5,3,5);tg5.translate(0,1.5,0);
  const p1=new THREE.ConeGeometry(1.9,11,6);p1.translate(0,8.2,0);
  buildTreeType(treeReq.pop,tg5,NI(p1),0x5a4633);
  /* shrub: low twin blobs */
  const tg6=new THREE.CylinderGeometry(.25,.4,.8,5);tg6.translate(0,.4,0);
  const s1=new THREE.IcosahedronGeometry(2.2,0);s1.translate(-.9,2,0);s1.scale(1,.75,1);
  const s2=new THREE.IcosahedronGeometry(1.6,0);s2.translate(1.3,1.5,.4);s2.scale(1,.8,1);
  buildTreeType(treeReq.shrub,tg6,mergeGeometries([NI(s1),NI(s2)],false),0x6a5138);
}
/* flags: one mesh, one shader */
{const fm=flagField.build();if(fm){fm.frustumCulled=false;scene.add(fm);}}
/* ============================================================
   THE KNOCKOUT RIBBON & THE TROPHY
   ============================================================ */
const ribbonUni={uTime:{value:0},uBoost:{value:1}};
{
  const pts=RIBBON_ORDER.map(id=>{
    const c=CITY[id];
    return new THREE.Vector3(c.x,c.py+95+(id==='ny'?30:0),c.z);
  });
  /* the road rises out of SoFi and dives to the trophy at MetLife */
  const la=CITY.la,ny=CITY.ny;
  pts.unshift(new THREE.Vector3(la.x,la.py+42,la.z));
  pts.push(new THREE.Vector3(ny.x,ny.py+100,ny.z));
  const curve=new THREE.CatmullRomCurve3(pts,false,'catmullrom',.35);
  const tube=new THREE.TubeGeometry(curve,420,4.2,6,false);
  const mat=new THREE.ShaderMaterial({uniforms:ribbonUni,transparent:true,
    blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime,uBoost;
      void main(){
        float flow=.5+.5*sin(vUv.x*220.-uTime*2.6);
        float core=.42+.58*flow;
        vec3 c=vec3(1.,.78,.32)*core+vec3(1.,.95,.7)*pow(flow,6.)*.8;
        gl_FragColor=vec4(c,(.30+.42*flow)*uBoost);}`});
  const ribbon=new THREE.Mesh(tube,mat);ribbon.frustumCulled=false;scene.add(ribbon);
  window.__ribbonCurve=curve;
}
/* beacons over knockout cities */
const beaconMats=[];
for(const c of CITIES){
  if(!c.ko)continue;
  const tier=c.ko==='F'?1:(c.ko==='SF'?.6:.38);
  const g=new THREE.CylinderGeometry(c.ko==='F'?10:6,c.ko==='F'?16:10,360,10,1,true);
  const m=new THREE.MeshBasicMaterial({color:c.ko==='F'?0xffe9a8:0xffd97a,transparent:true,
    opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
  const mesh=new THREE.Mesh(g,m);
  mesh.position.set(c.x,c.py+200,c.z);scene.add(mesh);
  beaconMats.push({m,tier});
}
/* the trophy monument above MetLife */
{
  const c=CITY.ny;
  const tg=new THREE.Group();tg.position.set(c.x,c.py+86,c.z);
  const B=new Batch();
  B.add(PRIM.disc,0xe8b84b,0,-6,0,0,14,2,14);
  B.add(PRIM.cyl,0xe8b84b,0,-2,0,0,4,6,4);
  /* three curved pillars holding the orb */
  for(let i=0;i<3;i++){const a=i/3*TAU;
    B.add(PRIM.tube,0xffd97a,Math.cos(a)*4.5,5,Math.sin(a)*4.5,-a,1.4,13,1.4,0,-.32);}
  const orbGeo=new THREE.IcosahedronGeometry(6,1);
  const pillars=B.build(MAT.gold,true);tg.add(pillars);
  const orb=new THREE.Mesh(orbGeo,MAT.gold);orb.position.y=15;tg.add(orb);
  /* orbiting ring of sparks */
  const ring=new THREE.Mesh(new THREE.TorusGeometry(10,.5,5,40),MAT.gold);
  ring.position.y=15;ring.rotation.x=Math.PI/2.4;tg.add(ring);
  /* the beam of light */
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(3,9,300,10,1,true),
    new THREE.MeshBasicMaterial({color:0xffe9a8,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
  beam.position.y=150;tg.add(beam);
  const glow=new THREE.PointLight(0xffd97a,0,140,1.8);glow.position.y=18;tg.add(glow);
  scene.add(tg);
  anims.push({u:(t)=>{tg.rotation.y=t*.4;ring.rotation.z=t*.7;orb.position.y=15+Math.sin(t*1.2)*.8;
    glow.intensity=1.2+nightAmt*3+Math.sin(t*2)*.3;}});
}

/* ============================================================
   THE BALL: one football, alive in whichever bowl you stand
   ============================================================ */
const ball=(()=>{
  /* Pass 18: physically shaded modern match ball, built procedurally so it
     remains a real rolling 3D object instead of a flat sprite or screenshot. */
  const W=1024,H=512;
  const colorCv=document.createElement('canvas');colorCv.width=W;colorCv.height=H;
  const bumpCv=document.createElement('canvas');bumpCv.width=W;bumpCv.height=H;
  const roughCv=document.createElement('canvas');roughCv.width=W;roughCv.height=H;
  const cg=colorCv.getContext('2d'),bg=bumpCv.getContext('2d'),rg=roughCv.getContext('2d');

  /* warm off-white polyurethane shell with a very subtle tonal falloff */
  const shell=cg.createLinearGradient(0,0,W,H);
  shell.addColorStop(0,'#fbfbf7');shell.addColorStop(.48,'#efefeb');shell.addColorStop(1,'#dedfdb');
  cg.fillStyle=shell;cg.fillRect(0,0,W,H);
  bg.fillStyle='#b9b9b9';bg.fillRect(0,0,W,H);
  rg.fillStyle='#dedede';rg.fillRect(0,0,W,H);

  function panelPath(ctx,cx,cy,r,rot,variant=0){
    const pts=variant%2===0
      ? [[-1.00,-.18],[-.55,-.88],[.20,-.76],[.92,-.22],[.68,.55],[-.05,.92],[-.82,.55]]
      : [[-.92,-.52],[-.18,-.92],[.72,-.64],[.96,.10],[.38,.84],[-.48,.76],[-1.0,.08]];
    ctx.beginPath();
    for(let i=0;i<pts.length;i++){
      const px=pts[i][0]*r,py=pts[i][1]*r;
      const x=cx+px*Math.cos(rot)-py*Math.sin(rot);
      const y=cy+px*Math.sin(rot)+py*Math.cos(rot);
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
  }
  function ringPath(ctx,cx,cy,rx,ry,rot){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.beginPath();
    ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.restore();
  }
  function drawModernPanel(cx,cy,r,rot,variant){
    for(const dx of[-W,0,W]){
      const x=cx+dx;
      /* recessed stitched seam surrounding each bonded panel */
      panelPath(cg,x,cy,r*1.10,rot,variant);
      cg.strokeStyle='rgba(104,108,111,.56)';cg.lineWidth=5;cg.lineJoin='round';cg.stroke();
      panelPath(cg,x,cy,r*1.045,rot,variant);
      cg.strokeStyle='rgba(255,255,255,.72)';cg.lineWidth=2;cg.stroke();

      panelPath(cg,x,cy,r,rot,variant);
      const pg=cg.createLinearGradient(x-r,cy-r,x+r,cy+r);
      pg.addColorStop(0,'#11161c');pg.addColorStop(.52,'#2c333b');pg.addColorStop(1,'#090c10');
      cg.fillStyle=pg;cg.fill();
      cg.save();panelPath(cg,x,cy,r*.94,rot,variant);cg.clip();
      /* subtle woven / pixel pattern like the visual reference */
      for(let yy=cy-r;yy<cy+r;yy+=12){
        for(let xx=x-r;xx<x+r;xx+=12){
          const v=hash2(Math.floor(xx/12)+variant*17,Math.floor(yy/12)+variant*29);
          cg.fillStyle=v>.56?'rgba(185,195,204,.18)':'rgba(0,0,0,.13)';
          cg.fillRect(xx,yy,8,8);
        }
      }
      cg.restore();
      panelPath(cg,x,cy,r*.72,rot+.04,variant);
      cg.strokeStyle='rgba(225,231,235,.17)';cg.lineWidth=2;cg.stroke();

      /* height information: shell high, panel slightly lower, seam deepest */
      panelPath(bg,x,cy,r,rot,variant);bg.fillStyle='#999';bg.fill();
      panelPath(bg,x,cy,r*1.08,rot,variant);bg.strokeStyle='#3d3d3d';bg.lineWidth=8;bg.lineJoin='round';bg.stroke();
      panelPath(bg,x,cy,r*1.02,rot,variant);bg.strokeStyle='#777';bg.lineWidth=2;bg.stroke();

      panelPath(rg,x,cy,r,rot,variant);rg.fillStyle='#b5b5b5';rg.fill();
      panelPath(rg,x,cy,r*1.08,rot,variant);rg.strokeStyle='#f1f1f1';rg.lineWidth=7;rg.stroke();
    }
  }

  /* angular modern-panel distribution on the equirectangular wrap */
  const panels=[
    [.055,.18,.074,-.15,0],[.245,.10,.072,.42,1],[.455,.19,.080,-.48,0],[.695,.105,.074,.30,1],[.885,.20,.080,-.28,0],
    [.145,.48,.085,.50,1],[.355,.39,.077,-.15,0],[.575,.52,.088,.24,1],[.790,.40,.078,-.52,0],[.985,.53,.085,.18,1],
    [.065,.80,.078,-.35,0],[.280,.70,.086,.18,1],[.495,.83,.076,.48,0],[.710,.70,.083,-.22,1],[.925,.82,.078,.32,0]
  ];
  panels.forEach((p,i)=>drawModernPanel(p[0]*W,p[1]*H,p[2]*W,p[3],p[4]));

  /* bonded white-panel seam network — visible in grazing light, not cartoon lines */
  const seams=[
    [.17,.24,.13,.095,.30],[.58,.27,.14,.09,-.24],[.84,.60,.13,.10,.46],[.36,.66,.15,.095,-.38],[.08,.58,.12,.085,.18],
    [.73,.88,.14,.08,-.12],[.48,.03,.13,.075,.10]
  ];
  seams.forEach(([x,y,rx,ry,rot])=>{
    for(const dx of[-W,0,W]){
      ringPath(cg,x*W+dx,y*H,rx*W,ry*H,rot);cg.strokeStyle='rgba(116,120,123,.42)';cg.lineWidth=4;cg.stroke();
      ringPath(cg,x*W+dx,y*H,rx*W-5,ry*H-3,rot);cg.strokeStyle='rgba(255,255,255,.62)';cg.lineWidth=1.5;cg.stroke();
      ringPath(bg,x*W+dx,y*H,rx*W,ry*H,rot);bg.strokeStyle='#4d4d4d';bg.lineWidth=7;bg.stroke();
      ringPath(rg,x*W+dx,y*H,rx*W,ry*H,rot);rg.strokeStyle='#f5f5f5';rg.lineWidth=6;rg.stroke();
    }
  });

  /* micro-pebble grain breaks up the plastic look at close range */
  for(let i=0;i<6200;i++){
    const x=hash2(i,71)*W,y=hash2(i,73)*H,r=.45+hash2(i,79)*1.15;
    const a=.018+hash2(i,83)*.035;
    cg.fillStyle=`rgba(65,68,70,${a})`;cg.beginPath();cg.arc(x,y,r,0,TAU);cg.fill();
    const b=125+Math.floor(hash2(i,89)*40);
    bg.fillStyle=`rgb(${b},${b},${b})`;bg.fillRect(x,y,1.1,1.1);
    const q=190+Math.floor(hash2(i,97)*35);
    rg.fillStyle=`rgb(${q},${q},${q})`;rg.fillRect(x,y,1.1,1.1);
  }

  const tex=new THREE.CanvasTexture(colorCv);tex.colorSpace=THREE.SRGBColorSpace;
  const bumpTex=new THREE.CanvasTexture(bumpCv);
  const roughTex=new THREE.CanvasTexture(roughCv);
  for(const t of[tex,bumpTex,roughTex]){
    t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.ClampToEdgeWrapping;
    t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
  }
  const mat=new THREE.MeshPhysicalMaterial({
    map:tex,bumpMap:bumpTex,bumpScale:.018,roughnessMap:roughTex,
    color:0xffffff,metalness:0,roughness:.78,clearcoat:.16,clearcoatRoughness:.52,
    envMapIntensity:.72
  });
  const m=new THREE.Mesh(new THREE.SphereGeometry(.36,64,48),mat);
  m.castShadow=true;m.receiveShadow=true;m.visible=false;
  m.rotation.set(.18,.34,.06);scene.add(m);

  /* soft physically plausible contact shadow, no hard gray halo */
  const shTex=softTex(160,'rgba(0,0,0,.58)','rgba(0,0,0,0)');
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(1.02,1.02),
    new THREE.MeshBasicMaterial({map:shTex,transparent:true,opacity:.46,depthWrite:false,toneMapped:false}));
  sh.rotation.x=-Math.PI/2;sh.visible=false;sh.renderOrder=3;scene.add(sh);
  m.userData.shadow=sh;
  return m;
})();;
const ballS={vel:new THREE.Vector3(),active:null,celebrating:false,resetT:0,kickReq:false};
let netWobs=[];
/* one reusable goal-burst confetti */
const goalBurst=(()=>{
  const n=90,g=new THREE.BufferGeometry();
  const pos=new Float32Array(n*3),col=new Float32Array(n*3);
  const cols=[0xe8b84b,0xd94f54,0x3fa66a,0x3f7fd9,0xe8e6df,0xd977b8].map(c=>new THREE.Color(c));
  for(let i=0;i<n;i++){const c=cols[i%6];col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({vertexColors:true,size:.9,map:dotTex,transparent:true,opacity:0,depthWrite:false}));
  p.frustumCulled=false;scene.add(p);
  const vel=[];for(let i=0;i<n;i++)vel.push(new THREE.Vector3());
  return{mesh:p,vel,t:-1,
    fire(x,y,z){
      this.t=0;
      const a2=g.attributes.position.array;
      for(let i=0;i<n;i++){
        a2[i*3]=x;a2[i*3+1]=y;a2[i*3+2]=z;
        this.vel[i].set((hash2(i,1)-.5)*10,4+hash2(i,2)*9,(hash2(i,3)-.5)*10);
      }
      p.material.opacity=.95;
    },
    u(dt){
      if(this.t<0)return;
      this.t+=dt;
      const a2=g.attributes.position.array;
      for(let i=0;i<n;i++){
        this.vel[i].y-=14*dt;
        a2[i*3]+=this.vel[i].x*dt;a2[i*3+1]+=this.vel[i].y*dt;a2[i*3+2]+=this.vel[i].z*dt;
      }
      g.attributes.position.needsUpdate=true;
      p.material.opacity=Math.max(0,.95*(1-this.t/1.7));
      if(this.t>1.7)this.t=-1;
    }};
})();
function ballActivate(id){
  const st=stadiums[id];
  ballS.active=id;ballS.celebrating=false;ballS.kickReq=false;
  ballS.vel.set(0,0,0);
  ball.position.set(st.center.x,st.city.py+st.bowl.pitchY+.34+.36,st.center.z);
  ball.visible=true;ball.userData.shadow.visible=true;
}
function ballDeactivate(){ballS.active=null;ball.visible=false;ball.userData.shadow.visible=false;}
const _bl=[0,0],_bw=[0,0];
function updateBall(dt){
  if(!ballS.active||mode!=='inside')return;
  const st=stadiums[ballS.active];
  const groundY=st.city.py+st.bowl.pitchY+.34,r=.36;
  if(ballS.celebrating){
    ballS.resetT-=dt;
    if(ballS.resetT<=0){
      ballS.celebrating=false;
      ballS.vel.set(0,0,0);
      if(pk.on){const b2=pkW(pk.st,18.2,0);ball.position.set(b2.x,groundY+r,b2.z);}
      else ball.position.set(st.center.x,groundY+r,st.center.z);
    }
    return;
  }
  const v=ballS.vel,bp=ball.position;
  /* kick: click or space near the ball, in the camera's facing */
  const pdx=bp.x-player.pos.x,pdz=bp.z-player.pos.z;
  const pd=Math.hypot(pdx,pdz);
  if(pk.on||cb.on||ku.on){ballS.kickReq=false;}
  else if(ballS.kickReq){
    ballS.kickReq=false;
    if(pd<3.0){
      const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
      const loft=6+clamp(player.pitch,0,.7)*8;
      v.set(fx*17,loft,fz*17);
      ballS.squash=.3;
      audio&&audio.thump();
    }
  }else if(pd<1.5&&bp.y-groundY<1.4){
    /* dribble: walking into the ball nudges it along */
    const nx=pdx/(pd||.01),nz=pdz/(pd||.01);
    const ps=Math.hypot(player.vel.x,player.vel.z);
    const push=Math.max(3.4,ps*1.3);
    v.x=nx*push;v.z=nz*push;v.y=Math.max(v.y,1.4);
  }
  /* integrate */
  v.y-=24*dt;
  bp.addScaledVector(v,dt);
  /* ground bounce and rolling friction */
  if(bp.y-r<groundY){
    bp.y=groundY+r;
    if(ku.on)kuGround();
    if(Math.abs(v.y)>1.2){v.y=-v.y*.5;ballS.squash=.28;}
    else v.y=0;
    const f=Math.exp(-dt*1.5);
    v.x*=f;v.z*=f;
  }else{const f=Math.exp(-dt*.06);v.x*=f;v.z*=f;}
  /* squash and recover, contact shadow */
  ballS.squash=Math.max(0,(ballS.squash||0)-dt*1.6);
  ball.scale.set(1+ballS.squash*.5,1-ballS.squash,1+ballS.squash*.5);
  const sh=ball.userData.shadow;
  sh.position.set(bp.x,groundY+.03,bp.z);
  sh.material.opacity=.46*clamp(1-(bp.y-r-groundY)/2.4,0,1);
  /* rectangular walls matching the ad boards, goal mouths open */
  toStadLocal(st,bp.x,bp.z,_bl);
  let lx=_bl[0],lz=_bl[1];
  const inMouth=Math.abs(lz)<4.0&&bp.y-groundY<2.5;
  let hit=false;
  if(Math.abs(lz)>15.8){lz=Math.sign(lz)*15.8;hit='z';}
  if(Math.abs(lx)>26.4&&!inMouth){lx=Math.sign(lx)*26.4;hit='x';}
  if(Math.abs(lx)>27.4){lx=Math.sign(lx)*27.4;hit='x';}  /* the net itself */
  if(hit){
    fromStadLocal(st,lx,lz,_bw);
    bp.x=_bw[0];bp.z=_bw[1];
    /* reflect the blocked axis in stadium space */
    const c=Math.cos(st.rot),s=Math.sin(st.rot);
    let vx=v.x*c-v.z*s,vz=v.x*s+v.z*c;
    if(hit==='z')vz=-vz*.55;else vx=-vx*.55;
    v.x=vx*c+vz*s;v.z=-vx*s+vz*c;
  }
  /* goal! (suppressed while a non-shootout game owns the ball) */
  if(Math.abs(lx)>25.4&&inMouth&&!ballS.celebrating&&!cb.on&&!sl.on&&!ku.on&&!pk.postHit){
    ballS.celebrating=true;ballS.resetT=2.2;
    const net=st.nets[lx>0?1:0];
    if(net)netWobs.push({mesh:net,t:0});
    goalBurst.fire(bp.x,bp.y+2,bp.z);
    showBanner('G O A L','' +st.city.stadium);
    audio&&audio.pitchRoar();
    v.multiplyScalar(.1);
  }
  /* stray ball comes home */
  if(bp.y<groundY-4||Math.abs(lx)>st.bowl.rx0||Math.abs(lz)>st.bowl.rz0){
    ballS.vel.set(0,0,0);
    if(pk.on){const b2=pkW(pk.st,18.2,0);bp.set(b2.x,groundY+r,b2.z);}
    else bp.set(st.center.x,groundY+r,st.center.z);
  }
  /* rolling spin */
  const sp=Math.hypot(v.x,v.z);
  if(sp>.1&&bp.y-r<groundY+.05){
    _v3.set(v.z,0,-v.x).normalize();
    ball.rotateOnWorldAxis(_v3,sp*dt/r);
  }
}
/* ============================================================
   PLAYER, CONTROLS, PHYSICS
   ============================================================ */
let phase='title';            /* title | play                */
let mode='flight';            /* flight | ground | inside    */
let nightAmt=0;
const player={pos:new THREE.Vector3(0,300,560),yaw:0.0,pitch:-0.42,
  tYaw:0.0,tPitch:-0.42,roll:0,bobPhase:0,landDip:0,
  vel:new THREE.Vector3(),vy:0,speed:CFG.flySpeed,onGround:false,insideId:null};
const camPos=new THREE.Vector3().copy(player.pos);
let prevYaw=player.yaw;
camera.rotation.order='YXZ';
const keys={};
let pointerLocked=false;
/* snap look targets and the trailing camera to the player: call after any teleport */
function syncLook(){
  player.tYaw=player.yaw;player.tPitch=player.pitch;
  camPos.copy(player.pos);prevYaw=player.yaw;
}

function groundAt(x,z,yRef){
  let g=terrainH(x,z);
  for(const p of platforms){
    if(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1&&p.y<=yRef-CFG.eye+.95&&p.y>g)g=p.y;
  }
  return g;
}
function nearestCity(x,z){
  let best=null,bd=1e9;
  for(const c of CITIES){const dx=x-c.x,dz=z-c.z,d=dx*dx+dz*dz;if(d<bd){bd=d;best=c;}}
  return{city:best,dist:Math.sqrt(bd)};
}
/* world -> stadium-local: rotate the delta by -rot around Y.
   applyAxisAngle(Y,a) maps [lx,lz] -> [lx*cos a + lz*sin a, -lx*sin a + lz*cos a] */
function toStadLocal(st,x,z,out){
  const dx=x-st.city.x,dz=z-st.city.z;
  out[0]=dx*Math.cos(st.rot)-dz*Math.sin(st.rot);
  out[1]=dx*Math.sin(st.rot)+dz*Math.cos(st.rot);
}
function fromStadLocal(st,lx,lz,out){
  const a=st.rot;
  out[0]=st.city.x+lx*Math.cos(a)+lz*Math.sin(a);
  out[1]=st.city.z-lx*Math.sin(a)+lz*Math.cos(a);
}
function resolveCollisions(dt){
  const p=player.pos;
  /* cylinder colliders */
  for(const c of colliders){
    const dx=p.x-c.x,dz=p.z-c.z,d2=dx*dx+dz*dz,r=c.r+.7;
    if(d2<r*r&&p.y>c.y-2&&p.y<c.y+c.h+2){
      const d=Math.sqrt(d2)||.001;
      p.x=c.x+dx/d*r;p.z=c.z+dz/d*r;
    }
  }
  /* stadium shells */
  for(const id in stadiums){
    const st=stadiums[id],b=st.bowl;
    const dx=p.x-st.city.x,dz=p.z-st.city.z;
    if(dx*dx+dz*dz>250*250)continue;
    toStadLocal(st,p.x,p.z,_lo);
    if(mode==='inside'&&player.insideId===id){
      /* stay on the pitch side of the seats */
      const rx=b.rx0-2,rz=b.rz0-2;
      const e=(_lo[0]*_lo[0])/(rx*rx)+(_lo[1]*_lo[1])/(rz*rz);
      if(e>1){
        const k=1/Math.sqrt(e);
        fromStadLocal(st,_lo[0]*k,_lo[1]*k,_wo);
        p.x=_wo[0];p.z=_wo[1];
      }
    }else if(mode==='ground'){
      const rx=b.rOutX+1.5,rz=b.rOutZ+1.5;
      const e=(_lo[0]*_lo[0])/(rx*rx)+(_lo[1]*_lo[1])/(rz*rz);
      if(e<1){
        const cur=Math.sqrt(e)||.02;
        const k=1/cur;
        fromStadLocal(st,_lo[0]*k,_lo[1]*k,_wo);
        p.x=_wo[0];p.z=_wo[1];
      }
    }
  }
}
function moveDir(){
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0);
  const s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  if(!f&&!s)return null;
  const cy=Math.cos(player.yaw),sy=Math.sin(player.yaw);
  /* forward = (-sin yaw, -cos yaw) on the ground plane */
  return{x:(-sy*f+cy*s),z:(-cy*f-sy*s)};
}
/* look smoothing: mouse writes targets, the camera eases toward them */
function smoothLook(dt){
  const k=1-Math.exp(-dt*(photoMode?5:16));
  player.yaw+=(player.tYaw-player.yaw)*k;
  player.pitch+=(player.tPitch-player.pitch)*k;
}
/* one physics substep: velocities ease toward input targets, never snap */
function physStep(dt){
  const p=player;
  if(mode==='flight'){
    const d=moveDir();
    let tx=0,ty=0,tz=0;
    if(d){
      const sp=Math.sin(p.pitch);
      const f=(keys.KeyW?1:0)-(keys.KeyS?1:0);
      tx=d.x*p.speed;tz=d.z*p.speed;ty=f*sp*p.speed;
    }
    if(keys.KeyQ)ty-=p.speed*.7;
    if(keys.KeyE)ty+=p.speed*.7;
    const hasInput=!!d||keys.KeyQ||keys.KeyE;
    /* brisk ramp up, long glide out: momentum you can feel */
    const k=1-Math.exp(-dt/(hasInput?.38:.95));
    p.vel.x+=(tx-p.vel.x)*k;p.vel.y+=(ty-p.vel.y)*k;p.vel.z+=(tz-p.vel.z)*k;
    p.pos.addScaledVector(p.vel,dt);
    const g=groundAt(p.pos.x,p.pos.z,p.pos.y)+2.2;
    if(p.pos.y<g){p.pos.y=g;p.vel.y=Math.max(0,p.vel.y);}
    if(p.pos.y>1400)p.pos.y=1400;
    p.pos.x=clamp(p.pos.x,-1900,1900);p.pos.z=clamp(p.pos.z,-1600,1600);
  }else{
    const d=(pk.on&&ch.phase==='run')?null:moveDir();
    const spd=(keys.ShiftLeft||keys.ShiftRight)?CFG.sprint:CFG.walk;
    const k=1-Math.exp(-dt/(d?.13:.24));
    p.vel.x+=((d?d.x*spd:0)-p.vel.x)*k;
    p.vel.z+=((d?d.z*spd:0)-p.vel.z)*k;
    /* axis-separated integration: a blocked axis never kills the other,
       so oblique contact slides along the wall */
    p.pos.x+=p.vel.x*dt;resolveCollisions();
    p.pos.z+=p.vel.z*dt;resolveCollisions();
    const wasAir=!p.onGround;
    const vyBefore=p.vy;
    p.vy-=CFG.grav*dt;p.pos.y+=p.vy*dt;
    let g;
    if(mode==='inside'){
      const st=stadiums[p.insideId];
      g=st.city.py+st.bowl.pitchY+.35;
    }else{
      g=groundAt(p.pos.x,p.pos.z,p.pos.y);
      if(g<CFG.seaY-1.2)g=CFG.seaY-1.2;  /* wade, not sink */
      /* the water is a friendly boundary: splash, float, get fished out */
      if(!camTween&&terrainH(p.pos.x,p.pos.z)<CFG.seaY-1&&p.pos.y-CFG.eye<CFG.seaY-.55){
        audio&&audio.wave();
        flare(p.pos.x,CFG.seaY+2,p.pos.z,0x9fd8ff);
        let bst=coaster.stations[0],bd=1e9;
        for(const s of coaster.stations){const d2=(p.pos.x-s.x)**2+(p.pos.z-s.z)**2;if(d2<bd){bd=d2;bst=s;}}
        showBanner('FISHED OUT','back to the nearest station');
        startTween(new THREE.Vector3(bst.x,bst.y-.9+CFG.eye,bst.z),.03,1.6,()=>{
          mode='ground';player.vy=0;player.vel.set(0,0,0);updateHud();
        });
        return;
      }
    }
    if(p.pos.y<=g+CFG.eye){
      const target=g+CFG.eye,dy2=target-p.pos.y;
      /* smooth step-up: big lips lift the camera instead of snapping it */
      p.pos.y=dy2>.3?p.pos.y+Math.min(dy2,(6+dy2*4)*dt):target;
      p.vy=0;
      if(p.pos.y>=target-.03){
        p.pos.y=target;
        if(wasAir&&vyBefore<-7)p.landDip=Math.min(.38,-vyBefore*.022);
        p.onGround=true;
        if(keys.Space&&!photoMode&&ch.phase!=='run'){p.vy=CFG.jumpV;p.onGround=false;}
      }
    }else p.onGround=false;
  }
}
function updateCamera(dt){
  const p=player;
  /* the drone camera trails its target for a cinematic glide */
  if(mode==='flight')camPos.lerp(p.pos,1-Math.exp(-dt*7));
  else camPos.copy(p.pos);
  camera.position.copy(camPos);
  /* footstep bob, silenced in the air and at rest */
  if(mode!=='flight'){
    const v=Math.hypot(p.vel.x,p.vel.z);
    if(p.onGround&&v>.4){
      p.bobPhase+=dt*(5.2+v*.5);
      const a=Math.min(v/CFG.sprint,1);
      camera.position.y+=Math.sin(p.bobPhase*2)*.05*a;
      const sway=Math.cos(p.bobPhase)*.022*a;
      camera.position.x+=sway*Math.cos(p.yaw);
      camera.position.z-=sway*Math.sin(p.yaw);
    }
  }
  /* landing impact dip */
  camera.position.y-=p.landDip;
  p.landDip*=Math.exp(-dt*6.5);
  /* roll: strafe lean on foot, gentle bank in flight */
  const s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  const yr=dt>0?(p.yaw-prevYaw)/dt:0;prevYaw=p.yaw;
  let rollT;
  if(mode==='flight')rollT=clamp(yr*.10,-.14,.14)-s*.035;
  else rollT=-s*.022;
  p.roll+=(rollT-p.roll)*(1-Math.exp(-dt*7));
  if(shakeT>0){
    const nw=performance.now();
    camera.position.x+=Math.sin(nw*.09)*.22*shakeT;
    camera.position.y+=Math.sin(nw*.113)*.18*shakeT;
  }
  camera.rotation.set(p.pitch,p.yaw,p.roll);
}

/* ---------------- mode transitions ---------------- */
const fadeEl=$('fade');
function fadeThrough(color,cb){
  fadeEl.style.background=color;
  fadeEl.style.transition='opacity .35s ease';
  fadeEl.style.opacity=1;
  setTimeout(()=>{cb();fadeEl.style.opacity=0;},380);
}
/* landing and launching glide between the two states instead of cutting */
let camTween=null;
function startTween(toPos,toPitch,dur,after){
  camTween={t:0,dur,fromPos:camPos.clone(),toPos:toPos.clone(),
    fromPitch:player.pitch,toPitch,after};
}
function land(){
  if(camTween)return;
  const p=player.pos;
  const g=groundAt(p.x,p.z,p.y);
  if(p.y-g>CFG.landAlt){flashHint('too high to land, descend first');return;}
  audio&&audio.whoosh();
  startTween(new THREE.Vector3(p.x,g+CFG.eye,p.z),.03,.65,()=>{
    mode='ground';player.vy=0;player.vel.set(0,0,0);
    player.landDip=.22;
    camera.fov=68;camera.updateProjectionMatrix();
    audio&&audio.thump();
    if(!tips.land)setTimeout(()=>tipOnce('land','walk up to glowing markers to play'),900);
    updateHud();
  });
}
function launch(){
  if(camTween)return;
  const p=player.pos;
  audio&&audio.whoosh();
  startTween(new THREE.Vector3(p.x,p.y+26,p.z),Math.min(player.tPitch,-.06),.6,()=>{
    mode='flight';player.vy=0;
    player.vel.set(0,12,0);
    camera.fov=62;camera.updateProjectionMatrix();
    updateHud();
  });
}
function nearEntrance(){
  if(mode!=='ground')return null;
  for(const id in stadiums){
    const st=stadiums[id];
    const d=player.pos.distanceTo(st.entrance);
    if(d<16)return id;
  }
  return null;
}
function enterStadium(id){
  const st=stadiums[id];
  fadeThrough('#000',()=>{
    mode='inside';player.insideId=id;
    if(id==='mex'){
      aztecaMatch.savedDayT=dayT;dayT=.885;aztecaMatch.active=true;document.body.classList.add('azteca-match');
      fromStadLocal(st,0,st.bowl.rz0+3.1,_wo);
      player.pos.set(_wo[0],st.city.py+st.bowl.pitchY+.35+CFG.eye,_wo[1]);
      const ctr=pkW(st,0,0);player.yaw=Math.atan2(-(ctr.x-player.pos.x),-(ctr.z-player.pos.z));player.pitch=.025;
    }else if(id==='la'){
      laPremiere.savedDayT=dayT;dayT=.825;laPremiere.active=true;document.body.classList.add('la-premiere');
      fromStadLocal(st,0,st.bowl.rz0+3.2,_wo);
      player.pos.set(_wo[0],st.city.py+st.bowl.pitchY+.35+CFG.eye,_wo[1]);
      const ctr=pkW(st,0,0);player.yaw=Math.atan2(-(ctr.x-player.pos.x),-(ctr.z-player.pos.z));player.pitch=.018;
    }else if(id==='ny'){
      nyFinal.savedDayT=dayT;dayT=.925;nyFinal.active=true;document.body.classList.add('ny-final');
      fromStadLocal(st,0,st.bowl.rz0+3.4,_wo);
      player.pos.set(_wo[0],st.city.py+st.bowl.pitchY+.35+CFG.eye,_wo[1]);
      const ctr=pkW(st,0,0);player.yaw=Math.atan2(-(ctr.x-player.pos.x),-(ctr.z-player.pos.z));player.pitch=.016;
    }else if(id==='dal'){
      dallasEvent.savedDayT=dayT;dayT=.86;dallasEvent.active=true;document.body.classList.add('dallas-event');
      fromStadLocal(st,0,st.bowl.rz0+3.3,_wo);
      player.pos.set(_wo[0],st.city.py+st.bowl.pitchY+.35+CFG.eye,_wo[1]);
      const ctr=pkW(st,0,0);player.yaw=Math.atan2(-(ctr.x-player.pos.x),-(ctr.z-player.pos.z));player.pitch=.02;
    }else if(id==='mia'){
      miamiFestival.savedDayT=dayT;dayT=.79;miamiFestival.active=true;document.body.classList.add('miami-festival');
      fromStadLocal(st,0,st.bowl.rz0+3.2,_wo);
      player.pos.set(_wo[0],st.city.py+st.bowl.pitchY+.35+CFG.eye,_wo[1]);
      const ctr=pkW(st,0,0);player.yaw=Math.atan2(-(ctr.x-player.pos.x),-(ctr.z-player.pos.z));player.pitch=.02;
    }else if(id==='sea'){
      seattleRain.savedDayT=dayT;dayT=.68;seattleRain.active=true;document.body.classList.add('seattle-rain');
      fromStadLocal(st,0,st.bowl.rz0+3.2,_wo);
      player.pos.set(_wo[0],st.city.py+st.bowl.pitchY+.35+CFG.eye,_wo[1]);
      const ctr=pkW(st,0,0);player.yaw=Math.atan2(-(ctr.x-player.pos.x),-(ctr.z-player.pos.z));player.pitch=.018;
    }else player.pos.set(st.center.x-6,st.city.py+st.bowl.pitchY+.35+CFG.eye,st.center.z);
    player.vel.set(0,0,0);player.vy=0;
    syncLook();
    ballActivate(id);
    stampCity(id);
    if(!tips.stad)setTimeout(()=>tipOnce('stad','read the pitch signs · gold CONCOURSE tunnel returns to the park'),1200);
    showBanner(st.city.stadium,id==='mex'?'MATCH NIGHT · WALKOUT TO THE GOLD RING':
      (id==='la'?'PREMIERE NIGHT · FOLLOW THE CYAN FLOOR LIGHTS':
      (id==='ny'?'THE FINAL · FOLLOW THE GOLD RUNWAY TO FINAL PRESSURE':
      (id==='dal'?'DALLAS EVENT NIGHT · FOLLOW THE BLUE STUDS TO POWER PLAY':
      (id==='mia'?'TROPICAL NIGHT · FOLLOW THE AQUA AND CORAL LIGHTS TO NEON CROSSBAR':
      (id==='sea'?'RAIN CITY · FOLLOW THE WET GREEN LIGHTS TO RAIN RUN':'four pitch games · follow the floor decals'))))));
    audio&&audio.enterRoar();
    updateHud();
  });
}
function exitStadium(){
  const st=stadiums[player.insideId];
  fadeThrough('#000',()=>{
    if(player.insideId==='mex'){
      if(aztecaMatch.savedDayT!==null)dayT=aztecaMatch.savedDayT;
      aztecaMatch.savedDayT=null;aztecaMatch.active=false;document.body.classList.remove('azteca-match');
    }
    if(player.insideId==='la'){
      if(laPremiere.savedDayT!==null)dayT=laPremiere.savedDayT;
      laPremiere.savedDayT=null;laPremiere.active=false;document.body.classList.remove('la-premiere');
    }
    if(player.insideId==='ny'){
      if(nyFinal.savedDayT!==null)dayT=nyFinal.savedDayT;
      nyFinal.savedDayT=null;nyFinal.active=false;document.body.classList.remove('ny-final');
    }
    if(player.insideId==='dal'){
      if(dallasEvent.savedDayT!==null)dayT=dallasEvent.savedDayT;
      dallasEvent.savedDayT=null;dallasEvent.active=false;document.body.classList.remove('dallas-event');
    }
    if(player.insideId==='mia'){
      if(miamiFestival.savedDayT!==null)dayT=miamiFestival.savedDayT;
      miamiFestival.savedDayT=null;miamiFestival.active=false;document.body.classList.remove('miami-festival');
    }
    if(player.insideId==='sea'){
      if(seattleRain.savedDayT!==null)dayT=seattleRain.savedDayT;
      seattleRain.savedDayT=null;seattleRain.active=false;document.body.classList.remove('seattle-rain');
    }
    mode='ground';player.insideId=null;
    const dir=new THREE.Vector3().subVectors(st.entrance,st.center);dir.y=0;dir.normalize();
    player.pos.copy(st.entrance).addScaledVector(dir,4);
    player.pos.y=st.city.py+CFG.eye+.5;
    player.vel.set(0,0,0);player.vy=0;
    syncLook();
    ballDeactivate();
    updateHud();
  });
}
function teleportTo(id){
  const c=CITY[id];
  closeMap();
  fadeThrough('#04060f',()=>{
    mode='flight';player.insideId=null;
    ballDeactivate();
    camera.fov=62;camera.updateProjectionMatrix();
    player.pos.set(c.x,c.py+150,c.z+210);
    player.vel.set(0,0,0);
    player.yaw=0;player.pitch=-0.52;
    syncLook();
    lastBannerCity=null;
    updateHud();
  });
}

/* ---------------- input ---------------- */
addEventListener('keydown',e=>{
  if(phase!=='play')return;
  keys[e.code]=true;
  if(e.code==='Tab'){e.preventDefault();toggleGuide();return;}
  if($('parkGuide').classList.contains('on')){if(e.code==='Escape')closeGuide();return;}
  /* challenges own the keyboard while a run is active */
  if(ch.phase){
    if(ch.phase==='run'&&e.code==='Escape'){
      if(ch.def.abort)ch.def.abort();
      chEnd();
    }
    return;
  }
  if(camTween)return;                 /* no mode changes mid-glide */
  if(e.code==='KeyP')togglePhoto();
  if(photoMode){if(e.code==='Space')photoShot=true;return;}
  if(e.code==='KeyF'){
    if(mode==='flight')land();
    else if(mode==='ground')launch();
    else if(mode==='inside')flashHint('follow the illuminated CONCOURSE tunnel, then press E');
  }
  if(e.code==='KeyE'&&mode!=='flight')performContextAction();
  if(e.code==='KeyM')toggleMap();
  if(e.code==='Enter'&&ridePhoto&&mode!=='ride'){
    const a=document.createElement('a');
    a.href=ridePhoto;a.download='continental26-ride-photo.jpg';a.click();
    ridePhoto=null;flashHint('ride photo saved');
  }
  if(e.code==='Space'&&mode==='inside')ballS.kickReq=true;
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('mousedown',()=>{
  if(ch.phase==='run'&&ch.def&&ch.def.click){ch.def.click();return;}
  if(phase==='play'&&mode==='inside'&&pointerLocked&&!photoMode&&!ch.phase)ballS.kickReq=true;
});
addEventListener('mousemove',e=>{
  if(!pointerLocked||phase!=='play')return;
  if(mode==='ride'){
    ride.oYaw=clamp(ride.oYaw-e.movementX*.0021,-2.1,2.1);
    ride.oPitch=clamp(ride.oPitch-e.movementY*.0021,-1.0,1.0);
    ride.lastMouse=performance.now();
    return;
  }
  player.tYaw-=e.movementX*.0021;
  player.tPitch=clamp(player.tPitch-e.movementY*.0021,-1.45,1.45);
});
document.addEventListener('pointerlockchange',()=>{pointerLocked=document.pointerLockElement===$('gl');});
/* pointer lock can be rejected (recent Esc, etc.) so requests never throw */
function requestLock(){
  if(pointerLocked||phase!=='play'||$('map').classList.contains('on'))return;
  try{
    const r=$('gl').requestPointerLock();
    if(r&&r.catch)r.catch(()=>{});
  }catch(e){}
}
$('gl').addEventListener('click',requestLock);
addEventListener('wheel',e=>{
  if(phase!=='play'||mode!=='flight')return;
  player.speed=clamp(player.speed*(e.deltaY>0?.88:1.14),CFG.flyMin,CFG.flyMax);
});

/* ---------------- HUD, banner, hints ---------------- */
const bannerEl=$('banner'),hintEl=$('hint'),hudEl=$('hud'),speedEl=$('speed');
hudEl.style.display='none';speedEl.style.display='none';
let bannerT=0,lastBannerCity=null,hintT=0;
function showBanner(a,b){
  bannerEl.querySelector('.b1').textContent=a;
  bannerEl.querySelector('.b2').textContent=b;
  bannerEl.classList.add('on');bannerT=performance.now();
}
function flashHint(t){hintEl.textContent=t;hintEl.classList.add('on');hintT=performance.now();}
function updateHud(){
  const vis=phase==='play'?'':'none';
  hudEl.style.display=vis;speedEl.style.display=vis;
  const m=mode==='flight'?'FLIGHT':(mode==='ground'?'ON FOOT':(mode==='ride'?'GRAND CIRCUIT':(mode==='pathride'?'RIDE':'INSIDE')));
  let lines=`<span class="mode">${m}</span><br>`;
  if(mode==='flight')lines+=`<kbd>WASD</kbd> fly &nbsp;<kbd>Q</kbd><kbd>E</kbd> altitude &nbsp;<kbd>F</kbd> land &nbsp;<kbd>M</kbd> map`;
  else if(mode==='ground')lines+=`<kbd>WASD</kbd> walk &nbsp;<kbd>Shift</kbd> sprint &nbsp;<kbd>F</kbd> take off &nbsp;<kbd>Tab</kbd> guide`;
  else if(mode==='ride')lines+=`look around freely &nbsp;<kbd>E</kbd> off at next station &nbsp;hold <kbd>E</kbd> to bail &nbsp;<kbd>P</kbd> photo`;
  else if(mode==='pathride')lines+=`enjoy the view &nbsp;<kbd>P</kbd> photo`;
  else lines+=player.insideId==='mex'?`match night &nbsp;·&nbsp; follow the pitch signs &nbsp;·&nbsp; <span style="color:#ffd97a">gold tunnel exits</span>`:
    (player.insideId==='la'?`premiere night &nbsp;·&nbsp; cyan floor lights lead the bowl &nbsp;·&nbsp; <span style="color:#7fd8ff">gold tunnel exits</span>`:
    (player.insideId==='ny'?`final night &nbsp;·&nbsp; gold runway leads to Final Pressure &nbsp;·&nbsp; <span style="color:#ffd97a">gold tunnel exits</span>`:
    `<kbd>WASD</kbd> dribble &nbsp;<kbd>Space</kbd> / <kbd>Click</kbd> shoot &nbsp;<span style="color:#ffd97a">gold tunnel exits</span>`));
  lines+=`<br><span style="color:#e8b84b;font-size:11px;letter-spacing:.2em">PASSPORT ${stamps.size}/16 &nbsp;★ ${starCount()}/${GOAL_STARS} &nbsp;${save.d.points} PTS &nbsp;PINS ${save.d.pins.length}/30${save.d.pins.length>=30?' ◉':''}</span>`;
  lines+=`<br><span style="color:#8a96c8;font-size:10px;letter-spacing:.16em">${save.d.goal?'THE FINAL AWAITS AT METLIFE':'ROAD TO THE FINAL · earn '+GOAL_STARS+' stars'}</span>`;
  hudEl.innerHTML=lines;
}
function updateHudFrame(){
  if(aztecaMatch.feedbackT&&performance.now()>aztecaMatch.feedbackT){$('shotFeedback').classList.remove('on');aztecaMatch.feedbackT=0;}
  if(mode==='flight'){
    const g=groundAt(player.pos.x,player.pos.z,player.pos.y);
    speedEl.innerHTML=`SPEED ${Math.round(player.speed)}<br>ALT ${Math.max(0,Math.round(player.pos.y-g))}`;
  }else speedEl.innerHTML='';
  /* contextual hints */
  if(performance.now()-hintT>2600){
    if(mode==='flight'){
      const{city,dist}=nearestCity(player.pos.x,player.pos.z);
      const g=groundAt(player.pos.x,player.pos.z,player.pos.y);
      if(dist<CFG.cityR&&player.pos.y-g<CFG.landAlt){hintEl.textContent='press F to land';hintEl.classList.add('on');}
      else hintEl.classList.remove('on');
    }else hintEl.classList.remove('on');
  }
  /* live challenge readout takes over the hint line */
  if(ch.phase==='run'&&ch.def&&ch.def.hudText){
    hintEl.textContent=ch.def.hudText();hintEl.classList.add('on');
  }
  updateActionPrompt();updateTour();
  if(bannerT&&performance.now()-bannerT>3600)bannerEl.classList.remove('on');
  /* persistent recovery hint whenever look is unavailable */
  const needLock=phase==='play'&&!pointerLocked&&!$('map').classList.contains('on')&&!camTween&&!photoMode;
  $('lockHint').classList.toggle('on',needLock);
}
let bannerCheckT=0;
function checkAirspace(t){
  if(t-bannerCheckT<.5)return;bannerCheckT=t;
  const{city,dist}=nearestCity(player.pos.x,player.pos.z);
  if(dist<CFG.cityR&&city!==lastBannerCity){
    lastBannerCity=city;
    showBanner(city.name,city.stadium);
    audio&&audio.chime();
  }else if(dist>CFG.cityR*1.5&&lastBannerCity)lastBannerCity=null;
}
/* ============================================================
   MAP OVERLAY
   ============================================================ */
const mapEl=$('map'),mapCv=$('mapCanvas'),mapCtx=mapCv.getContext('2d');
const MW=760,MH=600,WX=1250,WZ=1000;
const mapBG=document.createElement('canvas');mapBG.width=MW;mapBG.height=MH;
{
  const g=mapBG.getContext('2d');
  const X=x=>(x/WX*.5+.5)*MW, Y=z=>(z/WZ*.5+.5)*MH;
  /* two-tone water with a soft lift under the island */
  g.fillStyle='#123a5e';g.fillRect(0,0,MW,MH);
  const wg=g.createRadialGradient(MW/2,MH/2-20,60,MW/2,MH/2,520);
  wg.addColorStop(0,'rgba(42,104,150,.55)');wg.addColorStop(1,'rgba(18,58,94,0)');
  g.fillStyle=wg;g.fillRect(0,0,MW,MH);
  /* island silhouette: ray-marched from the centroid, smoothed */
  const N=160,rad=[];
  for(let i=0;i<N;i++){
    const a=i/N*TAU;let hit=1300;
    for(let r=120;r<1300;r+=10){
      if(maskField(Math.cos(a)*r,Math.sin(a)*r)<.42){hit=r;break;}
    }
    rad.push(hit);
  }
  const sm=[];
  for(let i=0;i<N;i++){let s=0;for(let k=-3;k<=3;k++)s+=rad[(i+k+N)%N];sm.push(s/7);}
  function outline(scale){
    g.beginPath();
    for(let i=0;i<=N;i++){
      const a=(i%N)/N*TAU,r=sm[i%N]*scale;
      const px=X(Math.cos(a)*r),py=Y(Math.sin(a)*r);
      i?g.lineTo(px,py):g.moveTo(px,py);
    }
    g.closePath();
  }
  outline(1.09);g.fillStyle='rgba(190,220,235,.14)';g.fill();
  outline(1.035);g.fillStyle='rgba(214,232,240,.22)';g.fill();
  outline(1);g.fillStyle='#7fae64';g.fill();
  /* painterly elevation tints, clipped to the island */
  g.save();outline(1);g.clip();
  const hg=g.createRadialGradient(X(-180),Y(560),40,X(-180),Y(560),260);
  hg.addColorStop(0,'rgba(196,168,92,.7)');hg.addColorStop(1,'rgba(196,168,92,0)');
  g.fillStyle=hg;g.fillRect(0,0,MW,MH);
  [[X(20),Y(830),95],[X(-560),Y(340),80],[X(-740),Y(-420),110]].forEach(([mx,my,mr])=>{
    const mg2=g.createRadialGradient(mx,my,6,mx,my,mr);
    mg2.addColorStop(0,'rgba(122,108,92,.75)');mg2.addColorStop(1,'rgba(122,108,92,0)');
    g.fillStyle=mg2;g.fillRect(0,0,MW,MH);
  });
  const ng=g.createLinearGradient(0,Y(-700),0,Y(-100));
  ng.addColorStop(0,'rgba(50,92,66,.55)');ng.addColorStop(1,'rgba(50,92,66,0)');
  g.fillStyle=ng;g.fillRect(0,0,MW,MH);
  g.restore();
  /* spur paths, thin and continuous */
  g.strokeStyle='rgba(240,235,220,.42)';g.lineWidth=1.4;g.lineCap='round';
  [['van','sea'],['sea','sf'],['sf','la'],['gdl','mex'],['mex','mty'],['mty','dal'],
   ['hou','dal'],['hou','atl'],['tor','kc'],['tor','ny'],['phi','ny'],['phi','kc']].forEach(([a,b])=>{
    g.beginPath();g.moveTo(X(CITY[a].x),Y(CITY[a].z));g.lineTo(X(CITY[b].x),Y(CITY[b].z));g.stroke();
  });
  /* the Grand Circuit in silver, the knockout road over it in gold */
  g.lineWidth=2.2;g.strokeStyle='rgba(226,232,238,.8)';
  g.beginPath();
  for(let i=0;i<=260;i++){
    const p=coaster.curve.getPointAt(i/260);
    i?g.lineTo(X(p.x),Y(p.z)):g.moveTo(X(p.x),Y(p.z));
  }
  g.stroke();
  g.lineWidth=3.2;g.strokeStyle='rgba(232,184,75,.95)';
  g.beginPath();
  RIBBON_ORDER.forEach((id,i)=>{const c=CITY[id];i?g.lineTo(X(c.x),Y(c.z)):g.moveTo(X(c.x),Y(c.z));});
  g.stroke();
  /* stations and signature experiences */
  coaster.stations.forEach(s=>{
    g.beginPath();g.arc(X(s.x),Y(s.z),2.6,0,TAU);
    g.fillStyle='#eaf6ff';g.fill();
    g.strokeStyle='#3a7ea8';g.lineWidth=1;g.stroke();
  });
  g.fillStyle='#ffd97a';
  [[CITY.hou.x+150,CITY.hou.z+20],[CITY.atl.x+150,CITY.atl.z+10],[CITY.mex.x+80,CITY.mex.z-40],
   [CITY.phi.x-100,CITY.phi.z+62],[ggRef?ggRef.lift.x:0,ggRef?ggRef.lift.z:0]].forEach(p=>{
    const sx=X(p[0]),sy=Y(p[1]);
    g.beginPath();g.moveTo(sx,sy-4.5);g.lineTo(sx+4,sy+3);g.lineTo(sx-4,sy+3);g.closePath();g.fill();
  });
  /* city markers: drop shadow, gold dot, label pill */
  g.textAlign='center';
  for(const c of CITIES){
    const px=X(c.x),py=Y(c.z);
    g.fillStyle='rgba(8,14,30,.45)';
    g.beginPath();g.arc(px+1.5,py+2,c.hero?6.5:5,0,TAU);g.fill();
    g.beginPath();g.arc(px,py,c.hero?6.5:5,0,TAU);
    g.fillStyle=c.ko?'#ffd97a':'#e8b84b';g.fill();
    g.strokeStyle='#4a3a14';g.lineWidth=1.4;g.stroke();
    const label=c.name.toUpperCase();
    g.font='700 10px "Segoe UI"';
    const tw=g.measureText(label).width;
    g.fillStyle='rgba(10,18,38,.78)';
    g.beginPath();g.roundRect(px-tw/2-6,py-24,tw+12,14,7);g.fill();
    g.fillStyle='#f0e6c8';g.fillText(label,px,py-13.5);
  }
  /* legend: a clean footer bar */
  g.fillStyle='rgba(9,15,34,.92)';g.fillRect(0,MH-34,MW,34);
  g.strokeStyle='rgba(232,184,75,.35)';g.lineWidth=1;
  g.beginPath();g.moveTo(0,MH-33.5);g.lineTo(MW,MH-33.5);g.stroke();
  g.font='600 11px "Segoe UI"';g.textAlign='left';
  g.fillStyle='#eaf6ff';g.beginPath();g.arc(24,MH-17,3,0,TAU);g.fill();
  g.fillStyle='#dfe6ff';g.fillText('station',34,MH-13);
  g.fillStyle='#ffd97a';g.beginPath();g.moveTo(102,MH-21);g.lineTo(106,MH-13);g.lineTo(98,MH-13);g.closePath();g.fill();
  g.fillStyle='#dfe6ff';g.fillText('experience',112,MH-13);
  g.strokeStyle='#e8b84b';g.lineWidth=3;g.beginPath();g.moveTo(196,MH-17);g.lineTo(224,MH-17);g.stroke();
  g.fillStyle='#dfe6ff';g.fillText('knockout road',232,MH-13);
  g.strokeStyle='#e2e8ee';g.lineWidth=2;g.beginPath();g.moveTo(336,MH-17);g.lineTo(364,MH-17);g.stroke();
  g.fillStyle='#dfe6ff';g.fillText('Grand Circuit',372,MH-13);
  g.fillStyle='#fff';g.beginPath();g.arc(474,MH-17,3.5,0,TAU);g.fill();
  g.fillStyle='#dfe6ff';g.fillText('train',484,MH-13);
  g.strokeStyle='#ffd97a';g.lineWidth=2;g.beginPath();g.arc(534,MH-17,5,0,TAU);g.stroke();
  g.fillStyle='#dfe6ff';g.fillText('stamped',546,MH-13);
  g.fillStyle='#7fd8ff';g.beginPath();g.moveTo(618,MH-22);g.lineTo(623,MH-12);g.lineTo(613,MH-12);g.closePath();g.fill();
  g.fillStyle='#dfe6ff';g.fillText('you',630,MH-13);
}
function mapXY(c){return[(c.x/WX*.5+.5)*MW,(c.z/WZ*.5+.5)*MH];}
function drawMap(){
  mapCtx.drawImage(mapBG,0,0);
  /* dynamic layers only: stamped rings, the live train, the player */
  for(const c of CITIES){
    if(!stamps.has(c.id))continue;
    const[sx,sy]=mapXY(c);
    mapCtx.strokeStyle='#ffd97a';mapCtx.lineWidth=2.5;
    mapCtx.beginPath();mapCtx.arc(sx,sy,c.hero?10.5:9,0,TAU);mapCtx.stroke();
  }
  {const tp=coaster.curve.getPointAt(trainShared.u);
   const sx=(tp.x/WX*.5+.5)*MW,sy=(tp.z/WZ*.5+.5)*MH;
   mapCtx.fillStyle='#fff';mapCtx.beginPath();mapCtx.arc(sx,sy,3.5,0,TAU);mapCtx.fill();
   mapCtx.strokeStyle='#3a7ea8';mapCtx.lineWidth=1.2;mapCtx.stroke();}
  /* per-city stars under the labels, and the Final once unlocked */
  mapCtx.font='700 9px "Segoe UI"';mapCtx.textAlign='center';mapCtx.fillStyle='#ffd97a';
  for(const c of CITIES){
    const s=save.d.stars[c.id];if(!s)continue;
    const n=(s.s?1:0)+(s.b?1:0)+(s.g?1:0);
    if(!n)continue;
    const[sx,sy]=mapXY(c);
    mapCtx.fillText('★'.repeat(n),sx,sy+16);
  }
  if(save.d.goal){
    const[sx,sy]=mapXY(CITY.ny);
    mapCtx.font='800 12px "Segoe UI"';
    mapCtx.fillText('★ THE FINAL AWAITS',sx,sy+30);
  }
  /* player marker */
  const px=(player.pos.x/WX*.5+.5)*MW,py=(player.pos.z/WZ*.5+.5)*MH;
  mapCtx.save();mapCtx.translate(px,py);mapCtx.rotate(-player.yaw);
  mapCtx.beginPath();mapCtx.moveTo(0,-9);mapCtx.lineTo(6,7);mapCtx.lineTo(-6,7);mapCtx.closePath();
  mapCtx.fillStyle='#7fd8ff';mapCtx.fill();mapCtx.restore();
}
function toggleMap(){
  if(mapEl.classList.contains('on'))closeMap();
  else{mapEl.classList.add('on');document.exitPointerLock&&document.exitPointerLock();drawMap();}
}
function closeMap(){mapEl.classList.remove('on');requestLock();}
mapCv.addEventListener('click',e=>{
  const r=mapCv.getBoundingClientRect();
  const mx=(e.clientX-r.left)*(MW/r.width),my=(e.clientY-r.top)*(MH/r.height);
  let best=null,bd=1e9;
  for(const c of CITIES){const[px,py]=mapXY(c);const d=(px-mx)**2+(py-my)**2;if(d<bd){bd=d;best=c;}}
  if(best&&bd<32*32)teleportTo(best.id);
});

/* ============================================================
   DAY / NIGHT
   ============================================================ */
const SKY_STOPS=[
 [0.00,0x0a1030,0x16264d,0x8aa0cc,0x0d1530,.08,.34,.97,1],
 [0.21,0x1a2450,0x3f4478,0xd0a0a0,0x262d58,.28,.42,1.00,.8],
 [0.27,0x3a5a94,0xffb066,0xffc890,0xd8a284,1.35,.58,1.08,.15],
 [0.35,0x4a8fd0,0xcfe4f0,0xfff0cc,0xbfd6e8,2.0,.85,1.10,0],
 [0.50,0x3f7fc8,0xd8ecf3,0xfff6dc,0xc6dcec,2.3,.90,1.11,0],
 [0.68,0x4a6fb0,0xffd9a0,0xffe0b0,0xd8c0a8,1.8,.74,1.18,0],
 [0.76,0x2e3f7e,0xff9a5e,0xffb070,0xc08a78,1.1,.55,1.10,.2],
 [0.82,0x141d48,0x4a4478,0xb090a0,0x2a2f58,.28,.42,.99,.8],
 [1.00,0x0a1030,0x16264d,0x8aa0cc,0x0d1530,.08,.34,.97,1],
];
const _cA=new THREE.Color(),_cB=new THREE.Color();
function skyLerp(idx,a,b,t,into){_cA.setHex(a[idx]);_cB.setHex(b[idx]);into.lerpColors(_cA,_cB,t);}
let dayT=(save.d.dayT!==undefined?save.d.dayT:0.60);   /* first impressions get golden hour */
const sunDirV=new THREE.Vector3();
function updateSky(){
  let a=SKY_STOPS[0],b=SKY_STOPS[1];
  for(let i=0;i<SKY_STOPS.length-1;i++)
    if(dayT>=SKY_STOPS[i][0]&&dayT<=SKY_STOPS[i+1][0]){a=SKY_STOPS[i];b=SKY_STOPS[i+1];break;}
  const t=smoothstep(a[0],b[0]===a[0]?a[0]+1e-4:b[0],dayT);
  skyLerp(1,a,b,t,skyUni.cTop.value);
  skyLerp(2,a,b,t,skyUni.cHaze.value);
  skyLerp(3,a,b,t,skyUni.cSun.value);
  skyLerp(4,a,b,t,scene.fog.color);
  /* haze hugs the fog so terrain melts into sky; mid bridges haze and zenith */
  skyUni.cHaze.value.lerp(scene.fog.color,.55);
  skyUni.cMid.value.lerpColors(skyUni.cHaze.value,skyUni.cTop.value,.45);
  skyUni.cBelow.value.copy(scene.fog.color).multiplyScalar(.82);
  const dirI=lerp(a[5],b[5],t),hemiI=lerp(a[6],b[6],t);
  renderer.toneMappingExposure=lerp(a[7],b[7],t);
  nightAmt=lerp(a[8],b[8],t);
  if(aztecaMatch.active)renderer.toneMappingExposure*=1.12;
  if(laPremiere.active)renderer.toneMappingExposure*=1.08;
  if(nyFinal.active)renderer.toneMappingExposure*=1.13;
  if(dallasEvent.active)renderer.toneMappingExposure*=1.1;
  if(miamiFestival.active)renderer.toneMappingExposure*=1.12;
  if(seattleRain.active)renderer.toneMappingExposure*=1.04;
  const elev=Math.sin((dayT-.25)*TAU);
  const az=dayT*TAU+.9;
  const ch=Math.sqrt(Math.max(.06,1-elev*elev));
  sunDirV.set(Math.cos(az)*ch,Math.max(elev,-.25),Math.sin(az)*ch).normalize();
  skyUni.sunDir.value.copy(sunDirV);
  skyUni.uGlow.value=1-nightAmt*.85;
  /* clouds: white at noon, sun-warmed when low, slate at night */
  _cA.setRGB(1,1,1).lerp(skyUni.cSun.value,clamp(1.1-Math.abs(Math.sin((dayT-.25)*TAU))*2,0,1)*.55);
  _cA.lerp(_cB.setHex(0x3a4258),nightAmt);
  for(const cl of clouds)cl.material.color.copy(_cA);
  sun.intensity=dirI;
  sun.color.copy(skyUni.cSun.value);
  hemi.intensity=hemiI;
  /* altitude-adaptive fog: crisp island from on high, atmosphere at ground level */
  const hi=smoothstep(250,650,camera.position.y);
  scene.fog.density=lerp(CFG.fogDay,CFG.fogNight,nightAmt)*(1-hi*.93);
  if(water)water.material.uniforms.fogDensity.value=scene.fog.density;
  waterUni.uSunDir.value.copy(sunDirV);
  waterUni.uCamPos.value.copy(camera.position);
  refreshEnv();
  if(bloomPass)bloomPass.strength=(.13+.30*nightAmt)*(1+hi*.18*(1-nightAmt));
  stars.material.opacity=nightAmt*.9;
  bandStars.material.opacity=nightAmt*.55;
  /* lens flare when looking sunward */
  {
    camera.getWorldDirection(_v3);
    const d=Math.max(_v3.dot(sunDirV),0);
    const k=Math.pow(d,10)*(1-nightAmt);
    flareSpr.position.copy(camera.position).addScaledVector(sunDirV,2500);
    flareSpr.material.opacity=k*.5;
    flareGhost.position.copy(camera.position).addScaledVector(sunDirV,1200).addScaledVector(_v3,600);
    flareGhost.material.opacity=k*.22;
    /* dawn and dusk sun shafts */
    const low=1-clamp(sunDirV.y*2.4,0,1);
    raySpr.position.copy(camera.position).addScaledVector(sunDirV,2400);
    raySpr.material.opacity=k*low*(1-nightAmt)*.42;
  }
  /* Light bars should guide, not flatten the architecture into white strips. */
  MAT.glow.opacity=clamp(nightAmt*(glowLevel ? .42 : .2),0,.42);
  const gOp=nightAmt*.24*glowLevel;
  for(const s of glowSprites)s.material.opacity=gOp;
  const trackGlow=nightAmt>.25?(glowLevel?0x3a3418:0x141208):0x000000;
  coaster.railMat.emissive.setHex(trackGlow);
  coaster.spineMat.emissive.setHex(trackGlow?0x17150d:0x000000);
  ribbonUni.uBoost.value=Math.min(1+.75*nightAmt+hi*.35,1.65);
  flagUni.uLight.value=1-nightAmt*.8;
  waterUni.uLight.value=1-nightAmt*.85;
  for(const bb of beaconMats)bb.m.opacity=bb.tier*(.025+.10*nightAmt);
  /* sun follows the player for tight shadows */
  sun.position.copy(player.pos).addScaledVector(sunDirV,900);
  sun.target.position.copy(player.pos);
  /* moon rides opposite the sun */
  moon.position.copy(player.pos).addScaledVector(sunDirV,-4100);
  moon.position.y=Math.max(moon.position.y,player.pos.y+300);
  moonGlow.position.copy(moon.position);
  moon.material.opacity=nightAmt;
  moonGlowMat.opacity=nightAmt*.55;
  /* nearest stadium floodlight */
  if(nightAmt>.2){
    const st=player.insideId?stadiums[player.insideId]
      :stadiums[nearestCity(player.pos.x,player.pos.z).city.id];
    const dist=Math.hypot(player.pos.x-st.center.x,player.pos.z-st.center.z);
    if(dist<320){
      stadiumLight.position.set(st.center.x,st.city.py+st.bowl.pitchY+34,st.center.z);
      stadiumLight.intensity=9*nightAmt;
      stadiumLight.distance=420;stadiumLight.decay=1.15;
    }else stadiumLight.intensity=0;
  }else stadiumLight.intensity=0;
  const matchOn=aztecaMatch.active?1:0;
  for(const L of aztecaMatch.lights){
    L.intensity+=(matchOn*16-L.intensity)*.12;
    L.color.setHex(0xeaf4ff);
  }
  if(aztecaMatch.active){stadiumLight.intensity=Math.max(stadiumLight.intensity,14);stadiumLight.color.setHex(0xdfeeff);}
  const laOn=laPremiere.active?1:0;
  laPremiere.screenT+=.012;
  for(let i=0;i<laPremiere.lights.length;i++){
    const L=laPremiere.lights[i],tar=laPremiere.targets[i],a=laPremiere.screenT*(.7+i*.08)+i*TAU/laPremiere.lights.length;
    tar.position.set(stadiums.la.center.x+Math.cos(a)*20,stadiums.la.city.py+stadiums.la.bowl.pitchY+2.5,stadiums.la.center.z+Math.sin(a*1.17)*13);
    L.intensity+=(laOn*12-L.intensity)*.1;
  }
  if(laPremiere.active){stadiumLight.intensity=Math.max(stadiumLight.intensity,12);stadiumLight.color.setHex(0xc9f1ff);}
  const nyOn=nyFinal.active?1:0;nyFinal.t+=.013;
  for(let i=0;i<nyFinal.lights.length;i++){
    const L=nyFinal.lights[i],tar=nyFinal.targets[i],a=nyFinal.t*(.42+i*.025)+i*TAU/nyFinal.lights.length;
    tar.position.set(stadiums.ny.center.x+Math.cos(a)*14,stadiums.ny.city.py+stadiums.ny.bowl.pitchY+1.8,
      stadiums.ny.center.z+Math.sin(a*1.09)*9);
    L.intensity+=(nyOn*(i%3===1?14:17)-L.intensity)*.1;
  }
  for(let i=0;i<nyFinal.flashers.length;i++){
    const f=nyFinal.flashers[i];
    f.material.opacity*=.82;
    if(nyFinal.active&&hash2(i,Math.floor(nyFinal.t*13))>.987)f.material.opacity=.68;
  }
  if(nyFinal.active){stadiumLight.intensity=Math.max(stadiumLight.intensity,16);stadiumLight.color.setHex(0xe8f2ff);}
  const dalOn=dallasEvent.active?1:0;dallasEvent.t+=.014;
  for(let i=0;i<dallasEvent.lights.length;i++){
    const L=dallasEvent.lights[i],tar=dallasEvent.targets[i],a=dallasEvent.t*(.34+i*.018)+i*TAU/dallasEvent.lights.length;
    tar.position.set(stadiums.dal.center.x+Math.cos(a)*18,stadiums.dal.city.py+stadiums.dal.bowl.pitchY+1.5,
      stadiums.dal.center.z+Math.sin(a*1.14)*10);
    L.intensity+=(dalOn*(i<4?16:11)-L.intensity)*.1;
  }
  dallasEvent.pulse*=.9;
  if(dallasEvent.haloMat)dallasEvent.haloMat.color.setRGB(1,1,1).lerp(new THREE.Color(0x7fd8ff),dallasEvent.pulse*.55);
  if(dallasEvent.halo)dallasEvent.halo.rotation.y=stadiums.dal.rot+Math.sin(dallasEvent.t*.2)*.025;
  if(dallasEvent.active){stadiumLight.intensity=Math.max(stadiumLight.intensity,15);stadiumLight.color.setHex(0xdbeeff);}
  const miaOn=miamiFestival.active?1:0;miamiFestival.t+=.016;
  for(let i=0;i<miamiFestival.lights.length;i++){
    const L=miamiFestival.lights[i],tar=miamiFestival.targets[i],a=miamiFestival.t*(.52+i*.025)+i*TAU/4;
    tar.position.set(stadiums.mia.center.x+Math.cos(a)*16,stadiums.mia.city.py+stadiums.mia.bowl.pitchY+1.8,
      stadiums.mia.center.z+Math.sin(a*1.22)*10);L.intensity+=(miaOn*13-L.intensity)*.1;
  }
  miamiFestival.pulse*=.91;
  for(let i=0;i<miamiFestival.edgeMats.length;i++)miamiFestival.edgeMats[i].opacity=(miamiFestival.active ? .2 : .035)+miamiFestival.pulse*.16+Math.sin(miamiFestival.t*2.2+i)*.025*miaOn;
  if(miamiFestival.active){stadiumLight.intensity=Math.max(stadiumLight.intensity,13);stadiumLight.color.setHex(0xbdfcff);}
  const seaOn=seattleRain.active?1:0;seattleRain.t+=.015;
  for(let i=0;i<seattleRain.lights.length;i++){
    const L=seattleRain.lights[i],tar=seattleRain.targets[i],a=seattleRain.t*(.38+i*.02)+i*TAU/4;
    tar.position.set(stadiums.sea.center.x+Math.cos(a)*13,stadiums.sea.city.py+stadiums.sea.bowl.pitchY+1.7,
      stadiums.sea.center.z+Math.sin(a*1.16)*9);L.intensity+=(seaOn*14-L.intensity)*.1;
  }
  seattleRain.pulse*=.9;
  for(let i=0;i<seattleRain.wetMats.length;i++)seattleRain.wetMats[i].emissive?.setHex(i%2?0x103820:0x102b40),seattleRain.wetMats[i].emissiveIntensity=.08+seattleRain.pulse*.5;
  if(seattleRain.active){stadiumLight.intensity=Math.max(stadiumLight.intensity,14);stadiumLight.color.setHex(0xcdeeff);}
}

/* ============================================================
   AUDIO — everything synthesized
   ============================================================ */
let audio=null;
function initAudio(){
  try{
    const A=new(window.AudioContext||window.webkitAudioContext)();
    const master=A.createGain();master.gain.value=.85;master.connect(A.destination);
    const noiseBuf=A.createBuffer(1,A.sampleRate*2,A.sampleRate);
    {const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    function loopNoise(){const s=A.createBufferSource();s.buffer=noiseBuf;s.loop=true;s.start();return s;}
    /* wind */
    const windLP=A.createBiquadFilter();windLP.type='lowpass';windLP.frequency.value=320;
    const windG=A.createGain();windG.gain.value=0;
    loopNoise().connect(windLP);windLP.connect(windG);windG.connect(master);
    /* crowd murmur */
    const crowdBP=A.createBiquadFilter();crowdBP.type='bandpass';crowdBP.frequency.value=420;crowdBP.Q.value=.8;
    const crowdBP2=A.createBiquadFilter();crowdBP2.type='lowpass';crowdBP2.frequency.value=900;
    const crowdG=A.createGain();crowdG.gain.value=0;
    loopNoise().connect(crowdBP);crowdBP.connect(crowdBP2);crowdBP2.connect(crowdG);crowdG.connect(master);
    let swell=0,swellT=0;
    function blip(f,t0,dur,g0){
      const o=A.createOscillator(),g=A.createGain();
      o.frequency.value=f;o.type='sine';
      g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(g0,t0+.03);
      g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
      o.connect(g);g.connect(master);o.start(t0);o.stop(t0+dur+.1);
    }
    audio={
      ctx:A,
      update(dt){
        const p=player.pos;
        /* wind by speed and altitude */
        let w;
        if(mode==='flight'){
          const spd=player.vel.length();
          w=.03+Math.min(spd/CFG.flyMax,1)*.12+Math.min(p.y/1200,1)*.04;
          windLP.frequency.value=280+spd*1.6;
        }else if(mode==='ride'){
          const k2=Math.min(ride.v/56,1);
          w=.05+k2*k2*.3;              /* roars hardest on the drops */
          windLP.frequency.value=300+ride.v*18;
        }else w=.015;
        windG.gain.value+=(w-windG.gain.value)*Math.min(dt*3,1);
        /* crowd by proximity */
        let cg=0;
        const{city,dist}=nearestCity(p.x,p.z);
        if(mode==='inside')cg=.30;
        else if(dist<420)cg=Math.pow(1-dist/420,2)*.17;
        swellT-=dt;
        if(swellT<0){swell=Math.random()*.5;swellT=2+Math.random()*4;}
        cg*=(1+swell*Math.sin(performance.now()*.0012));
        crowdG.gain.value+=(cg-crowdG.gain.value)*Math.min(dt*2,1);
      },
      chime(){const t0=A.currentTime;blip(659,t0,.5,.08);blip(880,t0+.12,.7,.07);},
      ooh(){
        const t0=A.currentTime;
        blip(392,t0,.4,.06);blip(311,t0+.14,.6,.07);
        crowdG.gain.cancelScheduledValues(t0);
        crowdG.gain.setValueAtTime(crowdG.gain.value,t0);
        crowdG.gain.linearRampToValueAtTime(.5,t0+.25);
        crowdG.gain.linearRampToValueAtTime(.25,t0+1.4);
      },
      pin(){const t0=A.currentTime;blip(1319,t0,.35,.04);},
      ping(){
        const t0=A.currentTime;
        for(const[f,g2]of[[1180,.09],[1770,.05],[2360,.03]]){
          const o=A.createOscillator(),g=A.createGain();
          o.type='sine';o.frequency.value=f;
          g.gain.setValueAtTime(g2,t0);
          g.gain.exponentialRampToValueAtTime(.0001,t0+.5);
          o.connect(g);g.connect(master);o.start(t0);o.stop(t0+.55);
        }
      },
      clack(){
        const t0=A.currentTime;
        const s=A.createBufferSource();s.buffer=noiseBuf;
        const f=A.createBiquadFilter();f.type='bandpass';f.frequency.value=1600;f.Q.value=6;
        const g=A.createGain();
        g.gain.setValueAtTime(.09,t0);g.gain.exponentialRampToValueAtTime(.001,t0+.06);
        s.connect(f);f.connect(g);g.connect(master);s.start(t0);s.stop(t0+.08);
      },
      countdown(){
        const t0=A.currentTime;
        for(let i=0;i<5;i++)blip(i<4?740:1100,t0+i,.25,.09);
        /* engine rumble */
        const s=A.createBufferSource();s.buffer=noiseBuf;s.loop=true;
        const f=A.createBiquadFilter();f.type='lowpass';f.frequency.value=110;
        const g=A.createGain();
        g.gain.setValueAtTime(0,t0+5);
        g.gain.linearRampToValueAtTime(.5,t0+5.6);
        g.gain.linearRampToValueAtTime(.0001,t0+13);
        s.connect(f);f.connect(g);g.connect(master);
        s.start(t0+5);s.stop(t0+13.2);
      },
      bell(n=1){
        const t0=A.currentTime;
        for(let i=0;i<n;i++){
          const st=t0+i*1.1;
          for(const[f2,g2]of[[262,.16],[396,.09],[524,.05]]){
            const o=A.createOscillator(),g=A.createGain();
            o.type='triangle';o.frequency.value=f2*(1+(i%2)*.002);
            g.gain.setValueAtTime(g2,st);
            g.gain.exponentialRampToValueAtTime(.0001,st+3.2);
            o.connect(g);g.connect(master);o.start(st);o.stop(st+3.4);
          }
        }
      },
      horn(){
        const t0=A.currentTime;
        const o=A.createOscillator(),g=A.createGain();
        o.type='sawtooth';o.frequency.value=112;
        g.gain.setValueAtTime(0,t0);
        g.gain.linearRampToValueAtTime(.12,t0+.25);
        g.gain.setValueAtTime(.12,t0+1.1);
        g.gain.exponentialRampToValueAtTime(.0001,t0+1.8);
        o.connect(g);g.connect(master);o.start(t0);o.stop(t0+2);
      },
      wave(){
        const t0=A.currentTime;
        const s=A.createBufferSource();s.buffer=noiseBuf;s.loop=true;
        const f=A.createBiquadFilter();f.type='bandpass';f.frequency.value=420;f.Q.value=.6;
        const g=A.createGain();
        g.gain.setValueAtTime(0,t0);
        g.gain.linearRampToValueAtTime(.16,t0+.9);
        g.gain.exponentialRampToValueAtTime(.0001,t0+2.8);
        s.connect(f);f.connect(g);g.connect(master);s.start(t0);s.stop(t0+3);
      },
      thump(){
        const o=A.createOscillator(),g=A.createGain();o.type='sine';
        o.frequency.setValueAtTime(90,A.currentTime);o.frequency.exponentialRampToValueAtTime(38,A.currentTime+.25);
        g.gain.setValueAtTime(.3,A.currentTime);g.gain.exponentialRampToValueAtTime(.001,A.currentTime+.3);
        o.connect(g);g.connect(master);o.start();o.stop(A.currentTime+.35);
      },
      whoosh(){
        const s=A.createBufferSource();s.buffer=noiseBuf;
        const f=A.createBiquadFilter();f.type='bandpass';f.Q.value=1.4;
        f.frequency.setValueAtTime(220,A.currentTime);f.frequency.exponentialRampToValueAtTime(2200,A.currentTime+.9);
        const g=A.createGain();g.gain.setValueAtTime(.16,A.currentTime);g.gain.exponentialRampToValueAtTime(.001,A.currentTime+1);
        s.connect(f);f.connect(g);g.connect(master);s.start();s.stop(A.currentTime+1.1);
      },
      enterRoar(){
        const t0=A.currentTime;
        crowdG.gain.cancelScheduledValues(t0);
        crowdG.gain.setValueAtTime(crowdG.gain.value,t0);
        crowdG.gain.linearRampToValueAtTime(.75,t0+.7);
        crowdG.gain.linearRampToValueAtTime(.3,t0+3.5);
        /* stadium horns */
        for(const f of[220,224,331])blip(f,t0+.15,1.6,.05);
      },
      pitchRoar(){
        const t0=A.currentTime;
        crowdG.gain.cancelScheduledValues(t0);
        crowdG.gain.setValueAtTime(crowdG.gain.value,t0);
        crowdG.gain.linearRampToValueAtTime(.95,t0+.5);
        crowdG.gain.linearRampToValueAtTime(.3,t0+4.5);
        blip(440,t0+.1,1.2,.05);blip(554,t0+.25,1.4,.05);blip(659,t0+.4,1.8,.06);
      },
    };
  }catch(err){audio=null;}
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
let pitchRoared={};
function checkPitchMoment(){
  if(mode!=='inside')return;
  const st=stadiums[player.insideId];
  const d=Math.hypot(player.pos.x-st.center.x,player.pos.z-st.center.z);
  if(d<9&&!pitchRoared[player.insideId]){
    pitchRoared[player.insideId]=true;
    showBanner('CENTRE CIRCLE',st.city.stadium+' · '+st.city.name);
    audio&&audio.pitchRoar();
  }
}
/* the old scripted ribbon flyover now boards the Grand Circuit instead */
function flyRibbon(){startRide('la');}

const clock=new THREE.Clock();
let fpsEMA=60,lowFpsT=0,perfReduced=false,perfLevel=0,frames=0;
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.3);
  const t=clock.elapsedTime;
  frames++;
  const fps=1/Math.max(dt,1e-4);
  fpsEMA+=(fps-fpsEMA)*.04;

  dayT=(dayT+dt/CFG.dayLen)%1;
  updateSky();

  if(phase==='title'){
    /* slow aerial drift behind the title card */
    const a=t*.016;
    camera.position.set(Math.sin(a)*120,315+Math.sin(t*.11)*12,560+Math.cos(a)*120);
    camera.lookAt(0,25,-60);
  }else if(camTween){
    camTween.t+=dt;
    const e=smoothstep(0,1,clamp(camTween.t/camTween.dur,0,1));
    camPos.lerpVectors(camTween.fromPos,camTween.toPos,e);
    player.pos.copy(camPos);
    player.pitch=lerp(camTween.fromPitch,camTween.toPitch,e);
    player.tPitch=player.pitch;
    camera.position.copy(camPos);
    player.roll*=Math.exp(-dt*6);
    camera.rotation.set(player.pitch,player.yaw,player.roll);
    if(camTween.t>=camTween.dur){
      const cb=camTween.after;camTween=null;
      player.pos.copy(camPos);prevYaw=player.yaw;
      cb();
    }
  }else if(mode==='ride'){
    smoothLook(dt);
    updateRide(dt);
    checkAirspace(t);
    updateHudFrame();
  }else if(mode==='pathride'){
    smoothLook(dt);
    updatePathRide(dt);
    checkAirspace(t);
    updateHudFrame();
  }else{
    smoothLook(dt);
    /* substep the physics so speed stays identical when frames stretch */
    const steps=Math.min(6,Math.max(1,Math.ceil(dt/.05)));
    const sdt=dt/steps;
    for(let i=0;i<steps;i++){physStep(sdt);updateBall(sdt);}
    if(ch.phase==='run'&&ch.def.tick)ch.def.tick(dt);
    updateCamera(dt);
    checkAirspace(t);
    updateHudFrame();
    checkPitchMoment();
  }

  for(const a of anims)a.u(t,dt);
  for(const it of interactions)if(it.cd>0)it.cd-=dt;
  shakeT=Math.max(0,shakeT-dt*1.1);
  goalBurst.u(dt);
  netWobs=netWobs.filter(nw=>{
    nw.t+=dt;
    const k=Math.sin(nw.t*26)*.14*Math.exp(-nw.t*4);
    nw.mesh.scale.set(1+k,1+k*.6,1);
    if(nw.t>1){nw.mesh.scale.set(1,1,1);return false;}
    return true;
  });
  /* gated particle systems */
  for(const ps of particleSys){
    const dx=camera.position.x-ps.ax,dz=camera.position.z-ps.az;
    const on=dx*dx+dz*dz<ps.r*ps.r;
    ps.mesh.visible=on;
    if(on)ps.u(t,dt);
  }
  /* seats and crowd fade in with distance instead of popping */
  for(const id in stadiums){
    const st=stadiums[id];
    const dx=camera.position.x-st.center.x,dz=camera.position.z-st.center.z;
    const op=1-smoothstep(520,700,Math.sqrt(dx*dx+dz*dz));
    st.seats.visible=op>.02;
    st.seats.material.opacity=op;
    st.fans.visible=op>.02;
    st.fans.material.opacity=op;
  }
  ribbonUni.uTime.value=t;
  waterUni.uTime.value=t;
  flagUni.uTime.value=t;
  sky.position.copy(camera.position);
  clouds.forEach((c,i)=>{c.position.x+=dt*(2+i%3);if(c.position.x>1900)c.position.x=-1900;});
  for(const cs of cloudShadows)cs.m.position.set(cs.c.position.x,cs.c.position.y-60,cs.c.position.z);
  if(audio)audio.update(dt);
  if(mapEl.classList.contains('on'))drawMap();
  /* adaptive quality ladder: bloom, then glow and life, then resolution, then shadows */
  if(perfLevel<4&&phase==='play'&&!document.hidden){
    if(fpsEMA<42)lowFpsT+=dt;else lowFpsT=Math.max(0,lowFpsT-dt*.5);
    if(lowFpsT>3){
      perfLevel++;lowFpsT=0;perfReduced=true;
      if(perfLevel===1)bloomOn=false;
      else if(perfLevel===2)glowLevel=0;
      else if(perfLevel===3)renderer.setPixelRatio(1);
      else{renderer.shadowMap.enabled=false;sun.castShadow=false;}
    }
  }
  if(bloomOn&&composer)composer.render();
  else renderer.render(scene,camera);
  if(ridePhotoPending){
    ridePhotoPending=false;
    ridePhoto=renderer.domElement.toDataURL('image/jpeg',.9);
  }
  if(photoShot){
    photoShot=false;
    const name=nearestCity(camera.position.x,camera.position.z).city.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase();
    const a=document.createElement('a');
    a.href=renderer.domElement.toDataURL('image/jpeg',.92);
    a.download='continental26-'+name+'.jpg';
    a.click();
    flashHint('photo saved');
  }
}

/* ---------------- boot: title straight to flight, fade from black ---------------- */
function begin(){
  if(phase!=='title')return;
  initAudio();
  if(audio&&audio.ctx.state==='suspended')audio.ctx.resume().catch(()=>{});
  $('title').classList.add('gone');
  fadeEl.style.transition='none';
  fadeEl.style.background='#000';
  fadeEl.style.opacity=1;
  phase='play';
  syncLook();
  updateHud();
  requestLock();   /* the Begin click is a valid gesture: look works immediately */
  setTimeout(()=>{
    fadeEl.style.transition='opacity 1s ease';
    fadeEl.style.opacity=0;
  },80);
  showBanner('NORTH AMERICA','follow the golden road to the final');
  $('guideBtn').classList.add('on');showTour();
  audio&&audio.chime();
}
$('begin').addEventListener('click',begin);
$('begin').disabled=false;
let resetArm=false;
$('resetBtn').addEventListener('click',()=>{
  if(!resetArm){resetArm=true;$('resetBtn').textContent='click again to confirm reset';return;}
  try{localStorage.removeItem('c26save');}catch(e){}
  location.reload();
});
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  if(composer){composer.setSize(innerWidth,innerHeight);bloomPass.setSize(innerWidth/2,innerHeight/2);}
});

/* ---------------- debug / verification API ---------------- */
window.__wc={
  ribbonDone:false,
  state:()=>({phase,mode,pos:player.pos.toArray().map(v=>Math.round(v)),yaw:+player.yaw.toFixed(2),
    fps:Math.round(fpsEMA),dayT:+dayT.toFixed(2),inside:player.insideId,frames,perfReduced,perfLevel}),
  posF:()=>player.pos.toArray(),
  audioState:()=>audio?audio.ctx.state:'none',
  tick(n=1){for(let i=0;i<n;i++)animate();},
  frame(w=820){
    const gl=$('gl');
    const cv=document.createElement('canvas');
    cv.width=w;cv.height=Math.round(gl.height/gl.width*w);
    cv.getContext('2d').drawImage(gl,0,0,cv.width,cv.height);
    return cv.toDataURL('image/jpeg',.62);
  },
  begin,
  skipIntro(){ if(phase==='title')begin(); fadeEl.style.opacity=0;
    player.pos.set(0,300,560);player.yaw=0;player.pitch=-.42;syncLook();updateHud();},
  goto(id){const c=CITY[id];if(!c)return'unknown city';
    mode='flight';player.insideId=null;
    player.pos.set(c.x,c.py+150,c.z+210);player.vel.set(0,0,0);
    player.yaw=0;player.pitch=-.5;syncLook();lastBannerCity=null;return'ok';},
  descend(id){const c=CITY[id];if(!c)return'unknown';
    player.pos.set(c.x,c.py+35,c.z+120);player.pitch=-.2;syncLook();return'ok';},
  land,launch,enterNearest(){const id=nearEntrance();if(id){enterStadium(id);return id;}return null;},
  walkToEntrance(id){const st=stadiums[id];if(!st)return'unknown';
    const dir=new THREE.Vector3().subVectors(st.entrance,st.center);dir.y=0;dir.normalize();
    player.pos.copy(st.entrance).addScaledVector(dir,6);
    player.pos.y=st.city.py+CFG.eye+.5;mode='ground';player.vel.set(0,0,0);syncLook();return'ok';},
  exit:exitStadium,
  azteca(){if(phase==='title')begin();setTimeout(()=>{enterStadium('mex');},450);return'ok';},
  startPenalty(){if(mode!=='inside'||player.insideId!=='mex')return'enter mex first';startShootout('mex');return'ok';},
  flyRibbon,
  setDay(v){dayT=v;},
  look(y,p){player.yaw=y;player.pitch=p;syncLook();},
  lookTarget(y,p){player.tYaw=y;player.tPitch=p;},
  setSize(w,h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
    if(composer){composer.setSize(w,h);bloomPass.setSize(w/2,h/2);}},
  bloom(v){bloomOn=v;},
  dbg(){return{shadowMap:renderer.shadowMap.enabled,sunCast:sun.castShadow,sunInt:+sun.intensity.toFixed(2),
    sunPos:sun.position.toArray().map(v=>Math.round(v)),tgt:sun.target.position.toArray().map(v=>Math.round(v))};},
  sunCast(v){sun.castShadow=v;},
  setLocked(v){pointerLocked=v;},
  locked:()=>pointerLocked,
  setPos(x,y,z){player.pos.set(x,y,z);player.vel.set(0,0,0);player.vy=0;syncLook();},
  stations:()=>coaster.stations.map(s=>({id:s.id,u:+((s.u===undefined?-1:s.u)).toFixed(4)})),
  trackAudit:()=>({...coaster.audit}),
  dismountFlag:()=>ride.dismount,
  startRide,rideState:()=>({on:ride.on,u:+ride.u.toFixed(4),v:+ride.v.toFixed(1),dist:Math.round(ride.dist),len:Math.round(coaster.len),mode}),
  rideBoost(v){ride.boost=v;},
  interact(){const it=nearInteract();if(it&&it.cd<=0){it.fn();it.cd=it.cooldown;return it.label;}return null;},
  photo(){togglePhoto();},snap(){photoShot=true;},
  chState:()=>({phase:ch.phase,
    pk:pk.on?{kick:pk.kick,scored:pk.scored,state:pk.state,top:pk.top,diff:pk.diff}:null,
    cb:cb.on?{i:cb.i,score:cb.score,state:cb.state}:null,
    sl:sl.on?{gi:sl.gi,pen:sl.pen,started:sl.started,t:sl.started?+(((performance.now()-sl.t0)/1000)+sl.pen).toFixed(1):0}:null,
    ku:ku.on?{streak:ku.streak}:null}),
  cbSetCharge(v){cb.charge=v;},
  prompt:()=>{const p=pitchPrompt();return p?p.label:null;},
  saveState:()=>({stars:starCount(),points:save.d.points,stamps:stamps.size,pins:save.d.pins.length,
    bests:save.d.bests,goal:save.d.goal}),
  pins:()=>PINS.map((p,i)=>({i,x:Math.round(p.x),y:+p.y.toFixed(1),z:Math.round(p.z),
    ground:+Math.max(terrainH(p.x,p.z),CFG.seaY).toFixed(1)})),
  pkSetCharge(v){pk.charge=v;},
  ballInfo:()=>({active:ballS.active,celebrating:ballS.celebrating,
    pos:ball.position.toArray().map(v=>+v.toFixed(2)),vel:ballS.vel.toArray().map(v=>+v.toFixed(2))}),
  kick(){ballS.kickReq=true;},
  cam(){return{pos:camera.position.toArray(),rot:[camera.rotation.x,camera.rotation.y,camera.rotation.z],
    tween:!!camTween,vel:player.vel.toArray(),onGround:player.onGround,landDip:player.landDip};},
  guide:toggleGuide,action:()=>getContextAction(),dash:()=>dash.on?{i:dash.i,t:+dash.t.toFixed(1)}:null,
  cities:CITIES.map(c=>c.id),
};
document.documentElement.dataset.trackAudit=JSON.stringify(coaster.audit);
buildComposer();
updateHud();
animate();
