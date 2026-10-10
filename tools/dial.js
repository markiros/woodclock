
const C=200, NS='http://www.w3.org/2000/svg';
const variants=[
 {id:'A',name:'Орех и латунь',desc:'Тёплый американский орех, полированный золотой безель, прикладные индексы-бруски, стрелки Бреге.',
  wood:['#6b3f22','#3a1d0c'],freq:'0.005 0.11',bezel:'gold',marks:'bars',hands:'breguet',sec:'gold',glass:'dome'},
 {id:'B',name:'Эбен и римские',desc:'Почти чёрное эбеновое дерево, гравированные римские цифры в золоте, тонкие стрелки-листья.',
  wood:['#2a1d17','#0d0806'],freq:'0.004 0.14',bezel:'gold-fluted',marks:'roman',hands:'leaf',sec:'gold',glass:'flat'},
 {id:'C',name:'Светлый клён',desc:'Светлый клён с золотой минутной дорожкой, арабские цифры Bodoni, гранёные стрелки дофин.',
  wood:['#c99c68','#8a5a2e'],freq:'0.006 0.09',bezel:'wood',marks:'arabic',hands:'dauphine',sec:'dark',glass:'dome'},
 {id:'D',name:'Маркетри',desc:'Двенадцать секторов из ореха и клёна вразбежку волокон, золотые точки, стрелки-шпаги под выпуклым стеклом.',
  wood:['#7a4826','#3d200e'],wood2:['#c49563','#7d5228'],freq:'0.005 0.12',bezel:'gold',marks:'dots',hands:'sword',sec:'gold',glass:'dome',marquetry:true},
 {id:'E',name:'Вокзальные',desc:'Белый циферблат, светло-серый корпус со стыками, крупные квадратные цифры, чёрные стрелки-бруски.',
  face:'white',bezel:'plastic',marks:'station',hands:'baton',sec:'black',glass:'flat'},
 {id:'F',name:'Слоновая кость',desc:'Корпус цвета слоновой кости, белый циферблат, крупные арабские цифры, минутная дорожка с ромбами, гирлянда роз, стрелки с прорезью.',
  face:'white',bezel:'ivory',marks:'classic',hands:'slot',sec:'thin',glass:'flat'},
 {id:'G',name:'Красное дерево',desc:'Тот же рисунок, что у «Слоновой кости», но корпус и циферблат из тёмного красного дерева, цифры, дорожка, гирлянда и стрелки в золоте.',
  wood:['#5c1d10','#220703'],freq:'0.005 0.1',bezel:'mahogany',marks:'classic',ink:'gold',hands:'slot',sec:'thin-gold',glass:'dome'},
 {id:'H',name:'Тёмный лак',desc:'Рисунок «Слоновой кости» — белый циферблат, чёрные цифры, гирлянда роз — в рамке из тёмного лакированного дерева.',
  face:'white',bezel:'lacquer',marks:'classic',hands:'slot',sec:'thin',glass:'flat'},
 {id:'I',name:'Бронзовое кружево',desc:'Ажурная рама под античную бронзу — взята с фото без изменений. Белый циферблат с полосатым диском, крупные цифры, букет розовых роз, чёрные стрелки-пики.',
  face:'white',marks:'ornate',hands:'fleur',sec:'thin',glass:'flat',scale:.82,
  // рама вырезана из фото без изменений: центр отверстия (cx,cy) и сторона квадрата size — в px исходника, k — единиц viewBox на px
  frame:{href:'frames/filigree.png',cx:591.851,cy:592.161,size:1184,k:.3356}},
 {id:'J',name:'Неон',desc:'Без корпуса, прямо на чёрном экране: яркие зелёные часовые метки, тусклые минутные штрихи, светящиеся мятные стрелки и тонкая зелёная секундная.',
  face:'none',bezel:'none',marks:'neon',hands:'neon',sec:'neon',glass:'none'},
 {id:'K',name:'Неон, пунктир',desc:'Копия «Неона», но секундная стрелка — пунктир из светящихся зелёных точек.',
  face:'none',bezel:'none',marks:'neon',hands:'neon',sec:'neon-dots',glass:'none'},
];

function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent&&parent.appendChild(e);return e}

function grainFilter(defs,id,dark,freq,seed){
  const f=el('filter',{id,x:'0',y:'0',width:'100%',height:'100%'},defs);
  el('feTurbulence',{type:'fractalNoise',baseFrequency:freq,numOctaves:'4',seed},f);
  const r=parseInt(dark.slice(1,3),16)/255,g=parseInt(dark.slice(3,5),16)/255,b=parseInt(dark.slice(5,7),16)/255;
  el('feColorMatrix',{type:'matrix',values:`0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 2.2 0 0 0 -0.75`},f);
}
function woodLayer(parent,defs,p,base,dark,freq,seed,rot,clip){
  const id=`g${p}${seed}`;grainFilter(defs,id,dark,freq,seed);
  const g=el('g',clip?{'clip-path':`url(#${clip})`}:{},parent);
  const inner=el('g',{transform:`rotate(${rot} ${C} ${C})`},g);
  el('rect',{x:-60,y:-60,width:520,height:520,fill:base},inner);
  el('rect',{x:-60,y:-60,width:520,height:520,filter:`url(#${id})`,opacity:.85},inner);
  return g;
}
// чайная роза: лепестки по кругу, чашечка, спираль внутренних лепестков
const ROSE={
  natural:{o:[['0','#f6d698'],['.6','#d9954a'],['1','#a85e26']],m:[['0','#fde6b0'],['.55','#e2a456'],['1','#9c5420']],
           leaf:[['0','#9aa85a'],['1','#4c5c22']],line:'#6b3210',edge:'#7a3c12',rib:'#3e4a1a',hi:'#fbe2a8',core:'#7a3a12',bud:'#c9773a',sepal:'#5d6d2c',twig:['#8a7a50','#9a8a5a']},
  gold:{o:[['0','#fff0bf'],['.55','#d9ad55'],['1','#8a6020']],m:[['0','#fff6d6'],['.5','#e8c46e'],['1','#9a6e22']],
        leaf:[['0','#e2c172'],['1','#7c5a1c']],line:'#6e4a14',edge:'#6e4a14',rib:'#5a3a10',hi:'#fff3c8',core:'#6e4a14',bud:'#d9ad55',sepal:'#9a7428',twig:['#c9a050','#b8903e']},
};
ROSE.pink={o:[['0','#fcd9d4'],['.6','#eea3a0'],['1','#cc7378']],m:[['0','#ffecea'],['.55','#f2aaa6'],['1','#c46e74']],
  leaf:[['0','#b9cdb0'],['1','#6f9070']],line:'#c27a7c',edge:'#c98688',rib:'#5d7a5e',hi:'#fff6f4',core:'#c06a70',bud:'#8a2d44',sepal:'#6f9070',twig:['#8fa889','#9fb598']};
function rose(parent,p,x,y,r,rot,c){
  const g=el('g',{transform:`translate(${x} ${y}) rotate(${rot})`},parent);
  for(let i=0;i<6;i++)
    el('ellipse',{cx:r*.42,cy:0,rx:r*.6,ry:r*.48,fill:`url(#roseO${p})`,stroke:c.edge,'stroke-width':.45,'stroke-opacity':.7,transform:`rotate(${i*60+15})`},g);
  el('circle',{cx:0,cy:0,r:r*.68,fill:`url(#roseM${p})`,stroke:c.edge,'stroke-width':.4,'stroke-opacity':.6},g);
  // внутренние лепестки — дуги со смещёнными центрами, чтобы читались как спираль, а не мишень
  [[.58,200,.1],[.46,330,.12],[.34,90,.12],[.22,220,.1]].forEach(([k,a0,o])=>{
    const R=r*k,a=a0*Math.PI/180,b=(a0+170)*Math.PI/180,m=(a0+85)*Math.PI/180;
    const cx=-r*o*Math.cos(m),cy=-r*o*Math.sin(m);
    el('path',{d:`M${cx+R*Math.cos(a)} ${cy+R*Math.sin(a)} A${R} ${R} 0 0 1 ${cx+R*Math.cos(b)} ${cy+R*Math.sin(b)} Q${cx} ${cy} ${cx+R*Math.cos(a)} ${cy+R*Math.sin(a)} Z`,
      fill:c.hi,opacity:.35},g);
    el('path',{d:`M${cx+R*Math.cos(a)} ${cy+R*Math.sin(a)} A${R} ${R} 0 0 1 ${cx+R*Math.cos(b)} ${cy+R*Math.sin(b)}`,fill:'none',stroke:c.line,'stroke-width':.6,'stroke-linecap':'round',opacity:.75},g);
  });
  el('circle',{cx:0,cy:0,r:r*.12,fill:c.core},g);
}
function leaf(parent,p,x,y,len,rot,c){
  const g=el('g',{transform:`translate(${x} ${y}) rotate(${rot})`},parent);
  el('path',{d:`M0 0 Q${len*.45} ${-len*.34} ${len} 0 Q${len*.45} ${len*.34} 0 0 Z`,fill:`url(#leaf${p})`,stroke:c.rib,'stroke-width':.4},g);
  el('path',{d:`M0 0 L${len*.85} 0`,stroke:c.rib,'stroke-width':.35,opacity:.7},g);
}
function bud(parent,x,y,r,rot,c){
  const g=el('g',{transform:`translate(${x} ${y}) rotate(${rot})`},parent);
  el('ellipse',{cx:0,cy:0,rx:r*.7,ry:r,fill:c.bud,stroke:c.edge,'stroke-width':.4},g);
  el('path',{d:`M${-r*.75} ${r*.2} Q0 ${r*1.6} ${r*.75} ${r*.2} Q0 ${r*.9} ${-r*.75} ${r*.2} Z`,fill:c.sepal},g);
}
// букет розовых роз справа снизу от центра, чуть размыт — под акварель
function bouquet(parent,defs,p){
  const c=ROSE.pink;
  const ro=el('radialGradient',{id:`roseO${p}`,cx:'.3',cy:'.5',r:'.8'},defs); c.o.forEach(([o,k])=>el('stop',{offset:o,'stop-color':k},ro));
  const rm=el('radialGradient',{id:`roseM${p}`,cx:'.38',cy:'.32',r:'.75'},defs); c.m.forEach(([o,k])=>el('stop',{offset:o,'stop-color':k},rm));
  const lf=el('linearGradient',{id:`leaf${p}`,x1:'0',y1:'0',x2:'1',y2:'1'},defs); c.leaf.forEach(([o,k])=>el('stop',{offset:o,'stop-color':k},lf));
  const wc=el('filter',{id:`wc${p}`,x:'-10%',y:'-10%',width:'120%',height:'120%'},defs); el('feGaussianBlur',{stdDeviation:'.3'},wc);
  const g=el('g',{filter:`url(#wc${p})`,transform:'translate(222 262) scale(1.32) translate(-222 -262)'},parent);
  ['M226 256 Q244 236 262 214','M214 266 Q190 262 168 272','M226 276 Q238 290 252 296'].forEach(d=>el('path',{d,fill:'none',stroke:c.twig[0],'stroke-width':.7},g));
  for(const [x,y,l,a] of [[205,268,16,175],[196,262,14,198],[186,273,13,160],[176,266,12,190],[168,276,10,165],
                          [240,241,11,-55],[250,229,10,-30],[256,221,9,-75],[244,234,9,-110],[262,214,8,-50],
                          [240,284,12,60],[222,288,11,100],[258,270,12,15],[250,290,9,40]])
    leaf(g,p,x,y,l,a,c);
  // белые соцветия гортензии
  for(const [x,y] of [[246,246],[252,242],[249,252],[256,249],[242,252],[258,256],[252,258],[262,250],[245,240]]){
    const f=el('g',{transform:`translate(${x} ${y})`},g);
    for(let i=0;i<4;i++) el('ellipse',{cx:0,cy:-1.6,rx:1.3,ry:1.8,fill:'#fbf4e8',stroke:'#e0cfb6','stroke-width':.3,transform:`rotate(${i*90+20})`},f);
    el('circle',{cx:0,cy:0,r:.6,fill:'#e2c08e'},f);
  }
  bud(g,232,247,3,15,c); bud(g,259,262,2.6,40,c); bud(g,213,283,2.4,-30,c); bud(g,190,252,2.2,-40,c);
  rose(g,p,198,257,6,30,c); rose(g,p,227,280,7.5,-40,c); rose(g,p,241,264,11,-20,c); rose(g,p,213,263,12,10,c);
}
function garland(parent,defs,p,c){
  const ro=el('radialGradient',{id:`roseO${p}`,cx:'.3',cy:'.5',r:'.8'},defs);
  c.o.forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},ro));
  const rm=el('radialGradient',{id:`roseM${p}`,cx:'.38',cy:'.32',r:'.75'},defs);
  c.m.forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},rm));
  const lf=el('linearGradient',{id:`leaf${p}`,x1:'0',y1:'0',x2:'1',y2:'1'},defs);
  c.leaf.forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},lf));
  const g=el('g',{transform:'translate(200 262) scale(1.15) translate(-200 -266)'},parent);
  // веточки
  [['M136 266 Q160 248 196 262',c.twig[0]],['M264 264 Q240 246 204 260',c.twig[0]],['M150 276 Q176 284 196 272',c.twig[1]],['M250 275 Q226 285 204 272',c.twig[1]]]
    .forEach(([d,c])=>el('path',{d,fill:'none',stroke:c,'stroke-width':.6},g));
  for(const [x,y,a] of [[140,262,-160],[146,254,-120],[156,272,150],[258,260,-20],[252,252,-60],[246,272,30],[170,280,160],[230,281,20]])
    leaf(g,p,x,y,5,a,c);
  // листья
  for(const [x,y,l,a] of [[188,268,15,160],[212,268,15,20],[196,254,12,-110],[206,276,12,70],[170,256,12,-150],[230,256,12,-30],
                          [176,272,11,150],[224,273,11,30],[148,262,11,-170],[252,260,11,-10],[160,252,9,-120],[240,250,9,-60]])
    leaf(g,p,x,y,l,a,c);
  bud(g,172,248,3.6,-25,c); bud(g,229,247,3.4,25,c); bud(g,140,256,3,-50,c); bud(g,261,254,3,50,c);
  rose(g,p,156,260,7.5,10,c); rose(g,p,163,268,5.5,40,c);
  rose(g,p,246,258,7.5,-20,c); rose(g,p,238,267,5.5,60,c);
  rose(g,p,183,263,9,-30,c); rose(g,p,218,264,9.5,25,c); rose(g,p,200,266,13,5,c); rose(g,p,210,278,5.5,80,c);
}
function neonLine(parent,p,x1,y1,x2,y2,w,core,glow,halo=true){
  const a={x1,y1,x2,y2,'stroke-linecap':'round'};
  if(halo) el('line',{...a,stroke:'#14402a','stroke-width':w+5,opacity:.55},parent);
  if(glow) el('line',{...a,stroke:glow,'stroke-width':w+3,opacity:.45,filter:`url(#ng${p})`},parent);
  el('line',{...a,stroke:core,'stroke-width':w},parent);
}
function goldGrad(defs,id,a=135){
  const lg=el('linearGradient',{id,gradientTransform:`rotate(${a} .5 .5)`},defs);
  [['0','#7c5518'],['.22','#f3dc96'],['.45','#b8862e'],['.62','#fff1c2'],['.8','#c89b45'],['1','#6e4a14']]
   .forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},lg));
}

function build(v){
  const svg=el('svg',{viewBox:'0 0 400 400',role:'img','aria-label':`Циферблат ${v.name}`});
  const defs=el('defs',{},svg), p=v.id;
  goldGrad(defs,`gold${p}`);goldGrad(defs,`goldR${p}`,315);
  el('clipPath',{id:`dial${p}`},defs).appendChild(el('circle',{cx:C,cy:C,r:150}));
  const sh=el('filter',{id:`sh${p}`,x:'-30%',y:'-30%',width:'160%',height:'160%'},defs);
  el('feDropShadow',{dx:'3',dy:'5',stdDeviation:'3','flood-color':'#000','flood-opacity':'.55'},sh);
  const sh2=el('filter',{id:`shs${p}`,x:'-30%',y:'-30%',width:'160%',height:'160%'},defs);
  el('feDropShadow',{dx:'1',dy:'1.5',stdDeviation:'.8','flood-color':'#000','flood-opacity':'.6'},sh2);

  const zk=v.scale||1, zoom=g=>zk===1?g:el('g',{transform:`translate(${C} ${C}) scale(${zk}) translate(${-C} ${-C})`},g);
  const root=svg; const dial=el('g',{'data-layer':'dial'},svg); { const svg=dial;
  // корпус / тень (у фото-рамы тень — фильтром по её силуэту)
  const neon=v.marks==='neon';  // общий для J и K
  if(neon){ const f=el('filter',{id:`ng${p}`,x:'-50%',y:'-50%',width:'200%',height:'200%'},defs); el('feGaussianBlur',{stdDeviation:'2.2'},f); }
  if(!v.frame&&v.bezel!=='none') el('circle',{cx:C,cy:C+8,r:186,fill:'#000',opacity:.45,filter:`url(#sh${p})`},svg);
  // безель
  if(v.bezel==='none'){
    // без корпуса: часы прямо на чёрном фоне заставки
  }else if(v.frame){
    // рама — вырезанное фото (tools/frames), рисуется поверх циферблата в конце слоя dial
  }else if(v.bezel==='ivory'){
    const iv=el('linearGradient',{id:`iv${p}`,x1:'0',y1:'0',x2:'1',y2:'1'},defs);
    [['0','#fffcf2'],['.5','#efe6d0'],['1','#c8b996']].forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},iv));
    const ivr=el('linearGradient',{id:`ivr${p}`,x1:'0',y1:'0',x2:'1',y2:'1'},defs);
    [['0','#cfc2a2'],['.5','#ece3cc'],['1','#fffbf0']].forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},ivr));
    el('circle',{cx:C,cy:C,r:184,fill:`url(#iv${p})`},svg);              // внешний валик
    el('circle',{cx:C,cy:C,r:183.5,fill:'none',stroke:'#b3a585','stroke-width':1},svg);
    el('circle',{cx:C,cy:C,r:178,fill:'none',stroke:'#fffdf6','stroke-width':2,opacity:.6},svg);
    el('circle',{cx:C,cy:C,r:171,fill:`url(#ivr${p})`},svg);             // желобок
    el('circle',{cx:C,cy:C,r:166,fill:`url(#iv${p})`},svg);              // внутренний валик
    el('circle',{cx:C,cy:C,r:160,fill:`url(#ivr${p})`},svg);             // скос к циферблату
  }else if(v.bezel==='mahogany'||v.bezel==='lacquer'){
    // один профиль валиков; mahogany — с золотыми кантами, lacquer — темнее и с глянцевыми бликами лака
    const lac=v.bezel==='lacquer';
    el('clipPath',{id:`bz${p}`},defs).appendChild(el('circle',{cx:C,cy:C,r:184}));
    woodLayer(svg,defs,p,lac?'#3d1a0c':'#6a2414',lac?'#0f0402':'#260803','0.11 0.006','7',0,`bz${p}`);
    const lt=el('linearGradient',{id:`mhl${p}`,x1:'0',y1:'0',x2:'1',y2:'1'},defs);
    [['0','#fff','.22'],['.5','#fff','0'],['1','#000','.45']].forEach(([o,c,a])=>el('stop',{offset:o,'stop-color':c,'stop-opacity':a},lt));
    const dk=el('linearGradient',{id:`mhd${p}`,x1:'0',y1:'0',x2:'1',y2:'1'},defs);
    [['0','#000','.45'],['.5','#000','.1'],['1','#fff','.18']].forEach(([o,c,a])=>el('stop',{offset:o,'stop-color':c,'stop-opacity':a},dk));
    el('circle',{cx:C,cy:C,r:184,fill:`url(#mhl${p})`},svg);            // внешний валик
    el('circle',{cx:C,cy:C,r:183,fill:'none',stroke:'#1a0502','stroke-width':2,opacity:.7},svg);
    el('circle',{cx:C,cy:C,r:178,fill:'none',stroke:'#ffd9b0','stroke-width':1.5,opacity:.18},svg);
    el('circle',{cx:C,cy:C,r:171,fill:`url(#mhd${p})`},svg);            // желобок
    if(!lac) el('circle',{cx:C,cy:C,r:168.5,fill:'none',stroke:`url(#gold${p})`,'stroke-width':2.5},svg); // золотой кант
    el('circle',{cx:C,cy:C,r:166,fill:`url(#mhl${p})`},svg);            // внутренний валик
    if(lac){
      // лак: узкие блики на валиках сверху-слева и мягкий отсвет снизу-справа
      const arc=(r,a0,a1)=>{const A=a0*Math.PI/180,B=a1*Math.PI/180;
        return `M${C+r*Math.cos(A)} ${C+r*Math.sin(A)} A${r} ${r} 0 0 1 ${C+r*Math.cos(B)} ${C+r*Math.sin(B)}`};
      el('path',{d:arc(179,190,280),fill:'none',stroke:'#fff','stroke-width':3,'stroke-linecap':'round',opacity:.32},svg);
      el('path',{d:arc(179,205,255),fill:'none',stroke:'#fff','stroke-width':1.6,'stroke-linecap':'round',opacity:.5},svg);
      el('path',{d:arc(163,195,270),fill:'none',stroke:'#fff','stroke-width':2,'stroke-linecap':'round',opacity:.28},svg);
      el('path',{d:arc(176,20,70),fill:'none',stroke:'#ffd8b8','stroke-width':2,'stroke-linecap':'round',opacity:.12},svg);
      el('circle',{cx:C,cy:C,r:158,fill:'none',stroke:'#140603','stroke-width':4},svg);              // тёмный край у циферблата
      el('circle',{cx:C,cy:C,r:156.3,fill:'none',stroke:'#e9e6df','stroke-width':.8,opacity:.8},svg); // светлая кромка циферблата
    }else el('circle',{cx:C,cy:C,r:158,fill:'none',stroke:`url(#gold${p})`,'stroke-width':5},svg); // золотое кольцо у циферблата
  }else if(v.bezel==='plastic'){
    const pg=el('linearGradient',{id:`pl${p}`,x1:'0',y1:'0',x2:'1',y2:'1'},defs);
    [['0','#f4f5f3'],['.5','#dfe1de'],['1','#b9bcb8']].forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},pg));
    const pi=el('linearGradient',{id:`pli${p}`,x1:'0',y1:'0',x2:'1',y2:'1'},defs);
    [['0','#b4b7b3'],['1','#f2f3f1']].forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},pi));
    el('circle',{cx:C,cy:C,r:184,fill:`url(#pl${p})`},svg);
    el('circle',{cx:C,cy:C,r:183.5,fill:'none',stroke:'#9a9d99','stroke-width':1},svg);
    el('circle',{cx:C,cy:C,r:162,fill:`url(#pli${p})`},svg);           // внутренний скос корпуса
    for(let k=0;k<4;k++){                                                 // стыки корпуса на 12/3/6/9
      const g=el('g',{transform:`rotate(${k*90} ${C} ${C})`},svg);
      el('rect',{x:C-7,y:C-184,width:14,height:20,fill:'#e9eae8'},g);
      el('line',{x1:C-7,y1:C-184,x2:C-7,y2:C-164,stroke:'#a9aca8','stroke-width':1},g);
      el('line',{x1:C+7,y1:C-184,x2:C+7,y2:C-164,stroke:'#fbfbfa','stroke-width':1},g);
    }
  }else if(v.bezel==='wood'){
    el('clipPath',{id:`bz${p}`},defs).appendChild(el('circle',{cx:C,cy:C,r:184}));
    woodLayer(svg,defs,p,'#9a6a3c','#4a2a12','0.12 0.006','7',0,`bz${p}`);
    el('circle',{cx:C,cy:C,r:183,fill:'none',stroke:'#3a2210','stroke-width':2,opacity:.6},svg);
    el('circle',{cx:C,cy:C,r:156,fill:'none',stroke:`url(#gold${p})`,'stroke-width':7},svg);
  }else{
    el('circle',{cx:C,cy:C,r:184,fill:`url(#gold${p})`},svg);
    el('circle',{cx:C,cy:C,r:172,fill:`url(#goldR${p})`},svg);
    if(v.bezel==='gold-fluted') for(let i=0;i<120;i++){
      const a=i*3*Math.PI/180;
      el('line',{x1:C+174*Math.sin(a),y1:C-174*Math.cos(a),x2:C+183*Math.sin(a),y2:C-183*Math.cos(a),stroke:i%2?'#fff3c8':'#6e4a14','stroke-width':1.6,opacity:.55},svg);
    }
    el('circle',{cx:C,cy:C,r:158,fill:`url(#gold${p})`},svg);
  }
  { const svg=zoom(dial);
  // дерево циферблата
  if(v.marquetry){
    for(let i=0;i<12;i++){
      const a0=(i*30-15)*Math.PI/180,a1=(i*30+15)*Math.PI/180;
      el('clipPath',{id:`m${p}${i}`},defs).appendChild(el('path',{d:`M${C} ${C}L${C+170*Math.sin(a0)} ${C-170*Math.cos(a0)}A170 170 0 0 1 ${C+170*Math.sin(a1)} ${C-170*Math.cos(a1)}Z`}));
      const w=i%2?v.wood2:v.wood;
      const g=woodLayer(svg,defs,p,w[0],w[1],v.freq,String(10+i),i*30,`m${p}${i}`);
      g.setAttribute('clip-path',`url(#m${p}${i})`);
      const wrap=el('g',{'clip-path':`url(#dial${p})`},svg);wrap.appendChild(g);
    }
    for(let i=0;i<12;i++){const a=(i*30-15)*Math.PI/180;
      el('line',{x1:C,y1:C,x2:C+150*Math.sin(a),y2:C-150*Math.cos(a),stroke:'#d8b46a','stroke-width':.8,opacity:.7},svg)}
  }else if(v.face==='none'){
  }else if(v.face==='white'){
    el('circle',{cx:C,cy:C,r:v.frame?160:156,fill:'#fbfbf9'},svg);   // под фото-рамой — с запасом под её край
  }else{
    woodLayer(svg,defs,p,v.wood[0],v.wood[1],v.freq,'3',8,`dial${p}`);
  }
  // виньетка внутри
  const vg=el('radialGradient',{id:`vig${p}`},defs);
  el('stop',{offset:'.72','stop-color':'#000','stop-opacity':0},vg);el('stop',{offset:'1','stop-color':'#000','stop-opacity':v.face==='white'?.16:.5},vg);
  if(v.face!=='none') el('circle',{cx:C,cy:C,r:150,fill:`url(#vig${p})`},svg);

  // разметка
  const printed=neon||v.marks==='station'||v.marks==='ornate'||(v.marks==='classic'&&v.ink!=='gold');
  const marks=el('g',printed?{}:{filter:`url(#shs${p})`},svg);
  if(neon){
    // минутные штрихи тусклые, часовые метки — яркие скруглённые бруски с ореолом
    for(let i=0;i<60;i++){ if(i%5===0) continue;
      const g=el('g',{transform:`rotate(${i*6} ${C} ${C})`},marks);
      el('line',{x1:C,y1:C-190,x2:C,y2:C-185,stroke:'#1d6a40','stroke-width':1.1,'stroke-linecap':'butt'},g);
    }
    for(let h=0;h<12;h++){
      const g=el('g',{transform:`rotate(${h*30} ${C} ${C})`},marks);
      neonLine(g,p,C,C-189,C,C-174,3.4,'#38e47d',null);
    }
  }
  if(v.marks==='ornate'){
    // светлая дорожка, диск в тонкую вертикальную полоску, крупные цифры, букет
    el('circle',{cx:C,cy:C,r:147,fill:'none',stroke:'#ddd5c6','stroke-width':.6},marks);
    el('circle',{cx:C,cy:C,r:142,fill:'none',stroke:'#ddd5c6','stroke-width':.6},marks);
    for(let i=0;i<60;i++) el('line',{x1:C,y1:C-147,x2:C,y2:C-(i%5===0?139:142),stroke:i%5===0?'#c9bfad':'#ddd5c6','stroke-width':i%5===0?1:.6,transform:`rotate(${i*6} ${C} ${C})`},marks);
    const pt=el('pattern',{id:`str${p}`,patternUnits:'userSpaceOnUse',width:2.6,height:10},defs);
    el('rect',{x:0,y:0,width:2.6,height:10,fill:'#f7f4ee'},pt); el('rect',{x:0,y:0,width:.8,height:10,fill:'#e4ddd0'},pt);
    el('circle',{cx:C,cy:C,r:82,fill:`url(#str${p})`},marks);
    for(let h=0;h<12;h++){
      const a=h*30*Math.PI/180, R=113;
      const t=el('text',{x:C+R*Math.sin(a),y:C-R*Math.cos(a)+1,'text-anchor':'middle','dominant-baseline':'central',
        'font-family':"'Bodoni 72', 'Bodoni Moda', Didot, serif",'font-weight':400,'font-size':46,'letter-spacing':h>9||h===0?-2:0,fill:'#141414'},marks);
      t.textContent=h===0?12:h;
    }
    bouquet(marks,defs,p);
  }
  if(v.marks==='classic'){
    const gold=v.ink==='gold', ln=gold?'#e6c77e':'#2a2a2a', ln2=gold?'#c9a050':'#8d8d8d', fg=gold?`url(#gold${p})`:'#141414';
    // минутная дорожка: две тонкие линии, штрихи, ромбы на пятиминутках
    el('circle',{cx:C,cy:C,r:146,fill:'none',stroke:ln,'stroke-width':gold?.8:.6},marks);
    el('circle',{cx:C,cy:C,r:141,fill:'none',stroke:ln,'stroke-width':gold?.8:.6},marks);
    for(let i=0;i<60;i++){
      const a=i*6;
      if(i%5===0) el('path',{d:`M${C} ${C-147} L${C+2} ${C-143.5} L${C} ${C-140} L${C-2} ${C-143.5} Z`,fill:fg,transform:`rotate(${a} ${C} ${C})`},marks);
      else el('line',{x1:C,y1:C-146,x2:C,y2:C-141,stroke:ln,'stroke-width':gold?.8:.6,transform:`rotate(${a} ${C} ${C})`},marks);
    }
    for(let h=0;h<12;h++){
      const a=h*30*Math.PI/180, R=114;
      const t=el('text',{x:C+R*Math.sin(a),y:C-R*Math.cos(a)+1,'text-anchor':'middle','dominant-baseline':'central',
        'font-family':"'Bodoni 72', 'Bodoni Moda', Didot, serif",'font-weight':400,'font-size':42,'letter-spacing':h>9||h===0?-1.5:0,fill:fg},marks);
      t.textContent=h===0?12:h;
    }
    // внутренний двойной круг и виньетка-завиток вместо логотипа
    el('circle',{cx:C,cy:C,r:80,fill:'none',stroke:ln2,'stroke-width':.6},marks);
    el('circle',{cx:C,cy:C,r:78.2,fill:'none',stroke:ln2,'stroke-width':.35,opacity:.7},marks);
    el('path',{d:`M${C-22} ${C-62} Q${C-11} ${C-66} ${C-3} ${C-62} M${C+22} ${C-62} Q${C+11} ${C-66} ${C+3} ${C-62}`,fill:'none',stroke:gold?ln:'#555','stroke-width':.6},marks);
    el('path',{d:`M${C} ${C-64.5} L${C+2.2} ${C-62} L${C} ${C-59.5} L${C-2.2} ${C-62} Z`,fill:gold?fg:'#444'},marks);
    garland(marks,defs,p,gold?ROSE.gold:ROSE.natural);
  }
  if(v.marks==='station'){
    for(let i=0;i<60;i++){
      const big=i%5===0, a=i*6;
      el('rect',{x:C-(big?2.6:1.1),y:C-150,width:big?5.2:2.2,height:big?17:9,fill:'#141414',transform:`rotate(${a} ${C} ${C})`},marks);
    }
    for(let h=0;h<12;h++){
      const a=h*30*Math.PI/180, R=h===0?106:112;
      const t=el('text',{x:C+R*Math.sin(a),y:C-R*Math.cos(a)+1,'text-anchor':'middle','dominant-baseline':'central',
        'font-family':'Orbitron, Eurostile, sans-serif','font-weight':700,'font-size':38,fill:'#141414'},marks);
      t.textContent=h===0?12:h;
    }
  }
  const ink=v.marks==='arabic'?'#3b2412':`url(#gold${p})`;
  // минутная дорожка
  for(let i=0;i<60;i++){
    if(printed)break;
    if(v.marks==='bars'&&i%5===0)continue;
    const a=i*6*Math.PI/180,r1=144,r2=i%5===0?134:139;
    el('line',{x1:C+r1*Math.sin(a),y1:C-r1*Math.cos(a),x2:C+r2*Math.sin(a),y2:C-r2*Math.cos(a),stroke:v.marks==='arabic'?'#3b2412':'#e6c77e','stroke-width':i%5===0?2.2:1,opacity:v.marks==='roman'?.55:.9},marks);
  }
  if(v.marks==='arabic'){
    el('circle',{cx:C,cy:C,r:144,fill:'none',stroke:`url(#gold${p})`,'stroke-width':1.5},marks);
    el('circle',{cx:C,cy:C,r:133,fill:'none',stroke:`url(#gold${p})`,'stroke-width':1.2},marks);
  }
  const roman=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
  for(let h=0;h<12;h++){
    const a=h*30*Math.PI/180, s=Math.sin(a), c=Math.cos(a);
    if(v.marks==='bars'){
      const w=h%3===0?9:6;
      el('rect',{x:C-w/2,y:C-138,width:w,height:h%3===0?30:22,rx:1.5,fill:`url(#gold${p})`,transform:`rotate(${h*30} ${C} ${C})`},marks);
      if(h%3===0) el('rect',{x:C-1,y:C-135,width:2,height:24,fill:'#5a3a10',opacity:.6,transform:`rotate(${h*30} ${C} ${C})`},marks);
    }else if(v.marks==='roman'){
      const t=el('text',{x:C+112*s,y:C-112*c,'text-anchor':'middle','dominant-baseline':'central',
        'font-family':'Cormorant Garamond, Georgia, serif','font-weight':700,'font-size':h%3===0?30:24,fill:`url(#gold${p})`,
        transform:`rotate(${h*30} ${C+112*s} ${C-112*c})`},marks);t.textContent=roman[h];
    }else if(v.marks==='arabic'){
      const t=el('text',{x:C+110*s,y:C-110*c,'text-anchor':'middle','dominant-baseline':'central',
        'font-family':'Bodoni Moda, Didot, serif','font-weight':600,'font-size':h%3===0?30:22,fill:'#2e1b0c'},marks);t.textContent=h===0?12:h;
    }else if(v.marks==='dots'){
      el('circle',{cx:C+132*s,cy:C-132*c,r:h%3===0?7.5:5,fill:`url(#gold${p})`},marks);
      if(h%3===0)el('circle',{cx:C+132*s-2,cy:C-132*c-2,r:2.2,fill:'#fff6d6',opacity:.8},marks);
    }
  }
  if(v.marks==='roman'){
    el('circle',{cx:C,cy:C,r:86,fill:'none',stroke:`url(#gold${p})`,'stroke-width':.8,opacity:.6},marks);
  }

  }
  if(v.frame){ const f=v.frame;
    el('image',{href:f.href,x:C-f.cx*f.k,y:C-f.cy*f.k,width:f.size*f.k,height:f.size*f.k,filter:`url(#sh${p})`},svg);
  }
  }
  // стрелки
  const hc=v.hands==='dauphine'?'#2a170a':(v.hands==='baton'||v.hands==='fleur'||(v.hands==='slot'&&v.ink!=='gold'))?'#161616':`url(#gold${p})`;
  const slotFill=v.ink==='gold'?'#2a0a04':'#f7f5ee';
  const H={
    breguet:{h:`M197 214 L197 145 A13 13 0 1 1 203 145 L203 214 Z M200 141 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z M196 126 L200 104 L204 126 Z`,
             m:`M198 218 L198 95 A11 11 0 1 1 202 95 L202 218 Z M200 92 m-6.5 0 a6.5 6.5 0 1 0 13 0 a6.5 6.5 0 1 0 -13 0 Z M197.5 80 L200 62 L202.5 80 Z`},
    leaf:{h:`M200 216 C189 186 191 140 200 112 C209 140 211 186 200 216 Z`,m:`M200 218 C192 180 193 110 200 64 C207 110 208 180 200 218 Z`},
    dauphine:{h:`M200 212 L191 200 L200 116 L209 200 Z`,m:`M200 214 L193 200 L200 64 L207 200 Z`},
    baton:{h:`M195 226 L195 108 L205 108 L205 226 Z`,m:`M196.5 228 L196.5 62 L203.5 62 L203.5 228 Z`},
    // часовая: основание, кольцо (внутренний контур в обратную сторону — дырка при nonzero), стержень с прорезью
    slot:{h:`M194.5 214 L196 179 L204 179 L205.5 214 Z M189 168 A11 11 0 1 1 211 168 A11 11 0 1 1 189 168 Z M193 168 A7 7 0 1 0 207 168 A7 7 0 1 0 193 168 Z M196.5 158 L196.5 120 L200 108 L203.5 120 L203.5 158 Z`,
          hs:`M198.4 154 L198.4 123 L200 118 L201.6 123 L201.6 154 Z`,
          m:`M195.5 226 L196.5 186 L203.5 186 L204.5 226 Z M197 187 L197.4 82 L200 64 L202.6 82 L203 187 Z`,
          ms:`M198.7 180 L198.7 96 L201.3 96 L201.3 180 Z`},
    // пики: стержень + наконечник-пика; у минутной хвост-якорь с шариками (дуги — штрихом в mt)
    fleur:{nz:1,
           h:`M197.6 214 L198.4 160 L201.6 160 L202.4 214 Z M198.4 160 C188 152 192 138 200 112 C208 138 212 152 201.6 160 Z`,
           m:`M198 234 L198.8 108 L201.2 108 L202 234 Z M198.8 108 C191 100 194 88 200 66 C206 88 209 100 201.2 108 Z M186.8 236 a3.2 3.2 0 1 0 6.4 0 a3.2 3.2 0 1 0 -6.4 0 Z M206.8 236 a3.2 3.2 0 1 0 6.4 0 a3.2 3.2 0 1 0 -6.4 0 Z`,
           mt:`M200 230 Q194 229 190 236 M200 230 Q206 229 210 236`},
    sword:{h:`M200 222 L193 202 L195 122 L200 104 L205 122 L207 202 Z`,m:`M200 224 L195 202 L196.5 76 L200 60 L203.5 76 L205 202 Z`},
  }[v.hands];
  const hh=el('g',{'data-layer':'hour'},svg), mh=el('g',{'data-layer':'minute'},svg), sh3=el('g',{'data-layer':'second'},svg);
  const hi=zoom(hh), mi=zoom(mh), si=zoom(sh3);
  if(v.hands==='neon'){
    neonLine(hi,p,C,C+18,C,C-102,4.2,'#b8ffd4','#5dff9c');
    neonLine(mi,p,C,C+20,C,C-156,3.2,'#b8ffd4','#5dff9c');
    if(v.sec==='neon-dots'){
      // пунктир: точки с шагом 7 от хвоста до кончика, на кончике точка крупнее
      for(let y=C+35;y>=C-164;y-=7){ el('circle',{cx:C,cy:y,r:3.6,fill:'#2dff80',opacity:.3,filter:`url(#ng${p})`},si); el('circle',{cx:C,cy:y,r:1.5,fill:'#2dff80'},si); }
      el('circle',{cx:C,cy:C-171,r:5.5,fill:'#2dff80',opacity:.3,filter:`url(#ng${p})`},si); el('circle',{cx:C,cy:C-171,r:2.3,fill:'#7dffb0'},si);
    }else neonLine(si,p,C,C+35,C,C-171,1.3,'#2dff80','#2dff80');
  }else{
  el('path',{d:H.h,fill:hc,'fill-rule':(H.hs||H.nz)?'nonzero':'evenodd'},hi);
  el('path',{d:H.m,fill:hc,'fill-rule':(H.ms||H.nz)?'nonzero':'evenodd'},mi);
  if(H.hs) el('path',{d:H.hs,fill:slotFill},hi);
  if(H.ms) el('path',{d:H.ms,fill:slotFill},mi);
  if(H.mt) el('path',{d:H.mt,fill:'none',stroke:hc,'stroke-width':2.2,'stroke-linecap':'round'},mi);
  if(v.hands==='dauphine'){ // грань
    el('path',{d:'M200 212 L200 116 L209 200 Z',fill:'#d8b46a',opacity:.35},hi);
    el('path',{d:'M200 214 L200 64 L207 200 Z',fill:'#d8b46a',opacity:.35},mi);
  }
  }
  const sc=v.sec==='dark'?'#7a1e14':(v.sec==='black'||v.sec==='thin')?'#161616':'#e9cf8a';
  if(v.sec.startsWith('neon')){}
  else if(v.sec.startsWith('thin')) el('path',{d:'M199.4 230 L199.5 62 L200.5 62 L200.6 230 Z',fill:sc},si);
  else{
    el('rect',{x:199.2,y:68,width:1.6,height:170,fill:sc},si);
    el('circle',{cx:C,cy:226,r:5,fill:sc},si);
  }
  if(!v.sec.startsWith('neon')) el('circle',{cx:C,cy:C,r:4.5,fill:sc},si);
  { const svg=zoom(el('g',{'data-layer':'cap'},root));
  // втулка
  if(v.hands==='neon'){
    el('circle',{cx:C,cy:C,r:13,fill:'#5dff9c',opacity:.22,filter:`url(#ng${p})`},svg);
    el('circle',{cx:C,cy:C,r:5.2,fill:'#c6ffde'},svg);
  }else if(v.hands==='baton'||v.hands==='fleur'){
    el('circle',{cx:C,cy:C,r:5,fill:'#161616',filter:`url(#shs${p})`},svg);
    el('circle',{cx:C,cy:C,r:1.6,fill:'#6a6a6a'},svg);
  }else{
    el('circle',{cx:C,cy:C,r:7,fill:`url(#gold${p})`,filter:`url(#shs${p})`},svg);
    el('circle',{cx:C,cy:C,r:2.2,fill:'#5a3a10'},svg);
  }

  }
  if(v.glass!=='none'){ const svg=zoom(el('g',{'data-layer':'glass'},root));
  // стекло
  const gl=el('radialGradient',{id:`gl${p}`,cx:'.38',cy:'.32',r:'.75'},defs);
  el('stop',{offset:'0','stop-color':'#fff','stop-opacity':v.glass==='dome'?.10:.05},gl);
  el('stop',{offset:'.6','stop-color':'#fff','stop-opacity':0},gl);
  el('stop',{offset:'1','stop-color':'#000','stop-opacity':.22},gl);
  el('circle',{cx:C,cy:C,r:157,fill:`url(#gl${p})`},svg);
  const hl=el('linearGradient',{id:`hl${p}`,x1:'0',y1:'0',x2:'0',y2:'1'},defs);
  el('stop',{offset:'0','stop-color':'#fff','stop-opacity':v.glass==='dome'?.38:.2},hl);el('stop',{offset:'1','stop-color':'#fff','stop-opacity':0},hl);
  if(v.glass==='dome') el('path',{d:'M78 168 A126 126 0 0 1 300 92 A150 110 0 0 0 78 168 Z',fill:`url(#hl${p})`},svg);
  else el('path',{d:'M90 120 L130 80 L310 260 L270 300 Z',fill:`url(#hl${p})`,opacity:.35,'clip-path':`url(#dial${p})`},svg);
  el('ellipse',{cx:262,cy:300,rx:28,ry:6,fill:'#fff',opacity:.06,transform:'rotate(-38 262 300)'},svg);
  el('circle',{cx:C,cy:C,r:157,fill:'none',stroke:'#fff',opacity:.18,'stroke-width':1},svg);

  }
  return {svg,hh,mh,sh:sh3};
}

