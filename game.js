/* Shinobi Sprint — Life of a Shinobi
   A Naruto-universe life simulator. Vanilla JS, no dependencies. */
(function(){
"use strict";

/* ============================ utilities ============================ */
var D=document;
function $(id){return D.getElementById(id)}
function el(tag,cls,txt){var e=D.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function rnd(n){return Math.floor(Math.random()*n)}
function pick(a){return a[rnd(a.length)]}
function chance(p){return Math.random()<p}
function ri(a,b){return a+rnd(b-a+1)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function money(n){return n.toLocaleString("en-US")+" ryō"}
function esc(s){return String(s==null?"":s)}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=rnd(i+1),t=a[i];a[i]=t;a[j]=t}return a}
function weighted(list){ /* list of [item, weight] */
  var tot=0,i;for(i=0;i<list.length;i++)tot+=list[i][1];
  var r=Math.random()*tot;
  for(i=0;i<list.length;i++){r-=list[i][1];if(r<=0)return list[i][0]}
  return list[list.length-1][0];
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ============================ data: names ============================ */
var NAMES_M=["Akihito","Daichi","Daiki","Eiji","Fumio","Goro","Haru","Haruki","Hiroshi","Isamu","Jiro","Kaito","Kazuo","Kenji","Kenshin","Kichiro","Mamoru","Masaru","Michio","Noboru","Norio","Osamu","Raiden","Renjiro","Ryo","Ryota","Saburo","Shigeo","Shin","Sho","Sota","Takashi","Takeshi","Tatsuya","Tetsuo","Tobio","Tomio","Toshiro","Yasuo","Yohei","Yoshi","Yuji","Yuu","Zen"];
var NAMES_F=["Aiko","Akemi","Chiyo","Cho","Emi","Eri","Fuyuko","Hana","Haruka","Hideko","Hikari","Hina","Hiroko","Izumi","Kaede","Kana","Kanna","Kasumi","Kazue","Keiko","Kiko","Kotone","Kyou","Mai","Mariko","Masami","Michi","Mika","Mitsuki","Miyo","Momo","Nanami","Naoko","Natsuki","Noriko","Rei","Riko","Rina","Rin","Sachiko","Sakura","Shiori","Sora","Suzu","Tamiko","Teruko","Tsukiko","Ume","Yui","Yuki","Yukiko","Yumi","Yuriko"];
var SURNAMES=["Aburame","Akimichi","Amagiri","Arashiyama","Fujimori","Fuma","Hagane","Haruno","Hatake","Hayashi","Higuma","Hoshigaki","Hyuga","Inari","Inazuma","Inuzuka","Ishikawa","Ito","Kagami","Kagemura","Kamizuru","Kanzaki","Karasuma","Kato","Kawaguchi","Kazamatsuri","Kirishima","Kobayashi","Kori","Kuchiyoshi","Kurama","Kurogane","Maeda","Maruboshi","Mibu","Mihara","Mizunoto","Mori","Nagare","Nara","Nishimura","Nozawa","Obata","Ogawa","Otake","Raiden","Renjiro","Rikimaru","Saeki","Sagara","Saito","Sakamoto","Sarutobi","Sasagawa","Sato","Shimizudani","Shimura","Shirakami","Shirogane","Suzumen","Tachibana","Takagi","Takeyama","Tamaru","Tanaka","Toriumi","Tsuchikawa","Tsukino","Uchiha","Ukai","Umegae","Utatane","Yakushi","Yamada","Yamanaka","Yoshino","Yuki","Yurinuki"];

/* ============================ data: villages & clans ============================ */
var VILLAGES={
  konoha:{name:"Konohagakure",label:"the Hidden Leaf",kan:"火",kage:"Hokage",academyAge:8},
  suna:{name:"Sunagakure",label:"the Hidden Sand",kan:"風",kage:"Kazekage",academyAge:9},
  kiri:{name:"Kirigakure",label:"the Hidden Mist",kan:"水",kage:"Mizukage",academyAge:9},
  kumo:{name:"Kumogakure",label:"the Hidden Cloud",kan:"雷",kage:"Raikage",academyAge:9},
  iwa:{name:"Iwagakure",label:"the Hidden Stone",kan:"土",kage:"Tsuchikage",academyAge:9}
};
/* rarity tiers: 1 = famous bloodline (very rare), 2 = known clan (uncommon), 3 = minor clan, 0 = civilian */
var CLANS=[
  {n:"Uchiha",t:1,b:{ninjutsu:4,genjutsu:2,intelligence:2},v:"konoha",d:"A fading bloodline of ocular power. The village watches Uchiha children closely."},
  {n:"Hyuga",t:1,b:{taijutsu:4,chakraControl:4},v:"konoha",d:"The Byakugan bloodline, bound by strict tradition and the Caged Bird seal."},
  {n:"Otsutsuki",t:1,b:{chakra:6,chakraControl:4,ninjutsu:3},v:null,d:"A name whispered in old scrolls. Almost never heard of among living families."},
  {n:"Sarutobi",t:2,b:{ninjutsu:2,discipline:3},v:"konoha",d:"A clan of strong-willed shinobi with deep ties to the village leadership."},
  {n:"Akimichi",t:2,b:{strength:5,health:2},v:"konoha",d:"Big appetites, bigger bodies, and secret calorie-control techniques."},
  {n:"Nara",t:2,b:{intelligence:4,discipline:2},v:"konoha",d:"Lazy geniuses who tend deer and shadow techniques."},
  {n:"Yamanaka",t:2,b:{chakraControl:3,genjutsu:2},v:"konoha",d:"Florists by day, mind-walkers by trade."},
  {n:"Aburame",t:2,b:{chakraControl:2,intelligence:3},v:"konoha",d:"Quiet hosts of living insects. Few words, many kikaichū."},
  {n:"Inuzuka",t:2,b:{strength:3,agility:3},v:"konoha",d:"Loud, loyal, and always smelling faintly of dog."},
  {n:"Kurama",t:2,b:{genjutsu:5},v:"konoha",d:"A small clan whose genjutsu once shook nations."},
  {n:"Hatake",t:2,b:{taijutsu:2,agility:2,reputation:2},v:"konoha",d:"A legacy of white-fanged shinobi. The name still carries weight."},
  {n:"Yuki",t:2,b:{ninjutsu:3,chakraControl:2},v:"kiri",d:"Ice-release carriers, once hunted in the Mist. They keep their kekkei genkai quiet."},
  {n:"Hozuki",t:2,b:{chakraControl:3,health:2},v:"kiri",d:"Mist shinobi who can turn their bodies to water."},
  {n:"Hoshigaki",t:2,b:{strength:3,health:2},v:"kiri",d:"Saw-toothed sharks of the Mist coastline."},
  {n:"Kaguya",t:2,b:{taijutsu:4,strength:2},v:"kiri",d:"A violent, nearly extinct bloodline of bone dancers."},
  {n:"Terumi",t:2,b:{ninjutsu:3,chakra:2},v:"kiri",d:"Lava and boil release run in this flashy Mist line."},
  {n:"Yotsuya",t:2,b:{intelligence:2,discipline:2},v:"suna",d:"Sand-country scholars turned puppeteers."},
  {n:"Sasori",t:2,b:{intelligence:3,chakraControl:2},v:"suna",d:"A bloodline of genius puppeteers and quiet tinkerers."},
  {n:"Kedoin",t:2,b:{chakra:2,agility:2},v:"suna",d:"Desert wanderers said to mimic any jutsu they see."},
  {n:"Yotsuki",t:2,b:{strength:4},v:"kumo",d:"Cloud-country mountain folk who never sell out their allies."},
  {n:"Darui",t:2,b:{ninjutsu:2,discipline:2},v:"kumo",d:"Storm-release carriers with a talent for deadpan loyalty."},
  {n:"Kamizuru",t:2,b:{chakraControl:3},v:"iwa",d:"Bee-keepers of the Stone, rivals of a certain Leaf clan."},
  {n:"Ishikawa",t:2,b:{strength:2,health:3},v:"iwa",d:"Stone-country quarriers with earth-release in their bones."},
  /* minor clans */
  {n:"Amagiri",t:3,b:{agility:2},v:null,d:"A minor rain-country family of scouts and couriers."},
  {n:"Fujimori",t:3,b:{chakraControl:1,intelligence:1},v:null,d:"Wisteria farmers with a flair for barrier basics."},
  {n:"Kurosawa",t:3,b:{discipline:2},v:null,d:"Ink-makers and ledger keepers for the village administration."},
  {n:"Tachibana",t:3,b:{health:2},v:null,d:"Bathhouse owners with surprisingly sturdy constitutions."},
  {n:"Shirakami",t:3,b:{intelligence:2},v:null,d:"A bookish family of archivists and part-time exorcists."},
  {n:"Umegae",t:3,b:{chakra:1,luck:0},v:null,d:"Plum-candy merchants whose kids always seem to land on their feet."},
  {n:"Karasuma",t:3,b:{agility:2},v:null,d:"Crow-tamers and rooftop messengers."},
  {n:"Mizunoto",t:3,b:{chakraControl:2},v:null,d:"River folk with steady hands and better patience."}
];
var CIV_DUTIES=["farmer","merchant","blacksmith","innkeeper","carpenter","fisher","scholar","weaver","potter","sake brewer","tea house owner","doctor","gate guard","stable hand","noodle cook"];
var SHINOBI_JOBS={genin:"Genin",chunin:"Chunin",jonin:"Jonin",medical:"Medical Ninja",anbu:"ANBU",sensor:"Sensor Ninja",instructor:"Academy Instructor",intel:"Intelligence Division",clanleader:"Clan Leader",hunter:"Hunter-nin",kage:"Kage"};
var PERSONALITIES=[
  {n:"Brash",f:{risk:2,discipline:-1},d:"acts first, thinks later"},
  {n:"Calm",f:{discipline:2,risk:-1},d:"slow to anger, hard to rush"},
  {n:"Cunning",f:{intelligence:2,risk:1},d:"always three moves ahead"},
  {n:"Gloomy",f:{happiness:-2,intelligence:1},d:"sees the rain in everything"},
  {n:"Hot-blooded",f:{strength:1,risk:2,ambition:1},d:"burns twice as bright, twice as fast"},
  {n:"Kind",f:{loyalty:2,happiness:1},d:"loved by most, underestimated by some"},
  {n:"Lazy",f:{discipline:-2,luck:1},d:"works half as hard, twice as lucky"},
  {n:"Loner",f:{risk:1,loyalty:-1},d:"keeps their own counsel"},
  {n:"Stoic",f:{discipline:2,happiness:-1},d:"a face like a stone wall"},
  {n:"Ambitious",f:{ambition:3,loyalty:-1},d:"climbs, whatever the cost"},
  {n:"Playful",f:{happiness:2,discipline:-1},d:"a prankster's heart"},
  {n:"Devoted",f:{loyalty:3,ambition:-1},d:"family and village above self"}
];
var ERAS=[
  {id:"warring",name:"Warring Clans Era",d:"Mercenary clans sell their blades village-less. Childhood is short and sharpened.",war:0.14,cameos:["Hashirama Senju","Madara Uchiha","Tobirama Senju","Mito Uzumaki"],noAcademy:true},
  {id:"sw2",name:"Second Great Ninja War",d:"The great villages bleed. Hanzō rules the rain; children grow up fast.",war:0.12,cameos:["Jiraiya","Tsunade","Orochimaru","Hanzō of the Salamander","Chiyo"]},
  {id:"sw3",name:"Third Great Ninja War",d:"Sakumo's shame, Minato's rise, and a war that eats a generation.",war:0.12,cameos:["Minato Namikaze","Kushina Uzumaki","Sakumo Hatake","Fugaku Uchiha","A (the future Raikage)"]},
  {id:"quiet",name:"The Quiet Years",d:"An uneasy peace before the storm. The Nine-Tails sleeps beneath the Leaf.",war:0.03,cameos:["Kakashi Hatake","Might Guy","Kurenai Yuhi","Asuma Sarutobi","Iruka Umino"]},
  {id:"storm",name:"The Storm Years",d:"A rampage, an invasion, and a boy in orange. Akatsuki moves in the shadows.",war:0.07,cameos:["Naruto Uzumaki","Sasuke Uchiha","Sakura Haruno","Kakashi Hatake","Jiraiya","Tsunade","Shikamaru Nara"]},
  {id:"newgen",name:"New Generation Era",d:"Rail, thunder trains and peace. Ninjas do paperwork and save the world on weekends.",war:0.02,cameos:["Naruto Uzumaki","Sasuke Uchiha","Sakura Haruno","Shikamaru Nara","Kakashi Hatake","Rock Lee"]}
];

/* ============================ data: misc flavor ============================ */
var NATURES=["Fire","Water","Wind","Earth","Lightning"," Yin","Yang"];
var JUTSU_A=["Hidden","Twin","Flying","Silent","Rising","Falling","Split","Crimson","Azure","Iron","Shadow","Whirlwind","Howling","Phantom","Emerald","Ashen"];
var JUTSU_B=["Fang","Palm","Needle","Wave","Cage","Step","Burst","Veil","Fang","Wall","Torrent","Meteor","Lotus","Hound","Storm","Lantern"];
var MISSION_TYPES={
  D:["Find a lost pet","Weed a farmer's field","Deliver a parcel across town","Babysit the magistrate's twins","Clean the irrigation ditch","Walk an old lady home","Catch a runaway cart","Rescue a cat from a roof","Tutor a merchant's kid","Repaint the Academy fence"],
  C:["Escort a merchant caravan","Find a missing villager","Deliver sealed documents to a border post","Clear wild boars from the rice terraces","Guard a traveling doctor","Track a stolen crate of ryo","Guide a surveyor through the hills","Capture a runaway debt-forging clerk"],
  B:["Hunt a rogue chunin","Infiltrate a smuggling ring","Escort a noble through bandit country","Sabotage an illegal mine","Capture a bounty target alive","Recover a stolen clan relic","Root out a spy in the trade quarter"],
  A:["Assassinate a warlord's lieutenant","Destroy an enemy supply line","Extract a captured shinobi","Defend the village gate against a raid","Track a missing-nin through the borderlands","Escort the Kage's envoy through war country"],
  S:["Eliminate a Kage-level threat","Recover a forbidden scroll from a sealed temple","Break a prisoner out of an enemy capital","Hunt an S-class missing-nin","Hold a mountain pass against an army"]
};
var INJURIES=["a sprained wrist","a gashed shoulder","two cracked ribs","a broken ankle","a burn down the arm","a shallow stab wound","a concussion","a poisioned scratch","a shattered kneecap"];

/* ============================ state ============================ */
var SAVE_KEY="shinobi_sprint_v1";
var G=null;            /* current life state (serializable) */
var SLOT=1;            /* active save slot */
var LOG=[],YEAR_TAGS=[];
var PENDING=null;      /* pending modal context */

function newNPC(o){
  var female=chance(.5);
  var n={name:pick(NAMES_F)+" "+pick(SURNAMES),gender:female?"f":"m",age:ri(24,44),
    rel:ri(45,80),personality:pick(PERSONALITIES).n,job:null,alive:true,relation:o.relation,tier:"family",mem:[]};
  if(o.known!==false){n.name=esc(o.name)||n.name;}
  return Object.assign(n,o||{});
}
function relOf(name){for(var i=0;i<G.rel.length;i++)if(G.rel[i].name===name)return G.rel[i];return null}
function addRel(npc){if(!relOf(npc.name))G.rel.push(npc);return npc}

/* ---------- base stats ---------- */
function baseStats(){
  return {health:ri(60,90),chakra:ri(20,60),happiness:ri(55,85),intelligence:ri(20,60),
    strength:ri(15,45),agility:ri(20,55),chakraControl:ri(10,40),ninjutsu:0,taijutsu:ri(10,30),
    genjutsu:ri(0,15),discipline:ri(20,60),reputation:ri(0,10),
    potential:ri(1,10),luck:ri(1,10),risk:ri(1,10),loyalty:ri(4,10),ambition:ri(1,10)};
}

/* ============================ character generation ============================ */
function clanPool(vid){
  var list=[["Civilian",46]];
  var i,c,w;
  for(i=0;i<CLANS.length;i++){
    c=CLANS[i];
    w=c.t===1?1.6:c.t===2?7:18;
    if(c.v===vid)w*=1.7;
    list.push([c.n,w]);
  }
  return list;
}
function clanByName(n){
  if(n==="Civilian")return null;
  for(var i=0;i<CLANS.length;i++)if(CLANS[i].n===n)return CLANS[i];
  return null;
}
function rollFamily(circ,clanName,vid){
  var rich=circ==="wealthy",poor=circ==="poor";
  var f=newNPC({relation:"Father",age:ri(22,42),job:clanName?pick(["shinobi","shinobi","blacksmith","merchant"]):pick(CIV_DUTIES)});
  f.rel=ri(35,90);
  var m=newNPC({relation:"Mother",age:ri(20,40),job:clanName?pick(["shinobi","homemaker","merchant","nurse"]):pick(CIV_DUTIES)});
  m.rel=ri(35,90);
  var fam=[f,m];
  if(circ==="single")fam=[chance(.5)?f:m];
  if(circ==="orphan")fam=[];
  var sibs=circ==="orphan"?0:ri(0,3);
  for(var i=0;i<sibs;i++){
    fam.push(newNPC({relation:chance(.5)?"Brother":"Sister",age:ri(-4,12),job:null}));
  }
  if(circ!=="orphan"&&chance(.6)){
    fam.push(newNPC({relation:"Grandmother",age:ri(56,84),job:"retired"}));
  }
  fam.forEach(function(p){if(p.age<1)p.age=ri(0,4)});
  return fam;
}
function generateLife(opts){
  opts=opts||{};
  var era=opts.era&&opts.era!=="r"?opts.era:pick(ERAS).id;
  var vid=opts.village&&opts.village!=="r"?opts.village:pick(Object.keys(VILLAGES));
  var clanName=opts.clan&&opts.clan!=="r"?opts.clan:weighted(clanPool(vid));
  var clan=clanByName(clanName);
  var female=opts.gender==="m"?false:opts.gender==="f"?true:chance(.5);
  var first=opts.first||pick(female?NAMES_F:NAMES_M);
  var last=clanName&&clanName!=="Civilian"?clanName:(opts.last||pick(SURNAMES));
  var pers=pick(PERSONALITIES);
  var circ=weighted([["ordinary",34],["loving",18],["strict",12],["poor",14],["wealthy",8],["civilian",0],["shinobi",clan?0:10],["single",9],["orphan",5]]);
  var stats=baseStats();
  if(clan){for(var k in clan.b){stats[k]=(stats[k]||0)+clan.b[k]}}
  if(circ==="wealthy")stats.happiness+=5;
  if(circ==="poor"){stats.happiness-=10;stats.strength+=5}
  if(circ==="orphan"){stats.happiness-=15;stats.discipline+=5;stats.loyalty-=2}
  stats.happiness=clamp(stats.happiness,5,95);
  var fam=rollFamily(circ,clanName,vid);
  var eraObj=ERAS.filter(function(e){return e.id===era})[0];
  G={
    v:1,created:Date.now(),
    first:first,last:last,gender:female?"f":"m",
    age:0,village:vid,clan:clanName,era:era,
    eraName:eraObj.name,stats:stats,
    personality:pers.n,persDesc:pers.d,
    rank:"Newborn",occupation:circ==="orphan"?"Ward of the village":"Child of the "+(clanName==="Civilian"?"":clanName+" ")+pick(["household","family"]),
    ryō:circ==="wealthy"?ri(3000,9000):circ==="poor"?ri(0,120):ri(200,1500),
    wealth:circ,academy:null,school:null,
    family:fam,rel:[],friends:[],rivals:[],
    team:null,sensei:null,
    missions:[],missionCount:0,missionsFailed:0,missionsS:0,
    feats:[],timeline:[],feed:[],
    flags:{},rogue:null,wanted:0,deathCause:null,
    senseiName:null,geninYear:null,chuninYear:null,joninYear:null,
    fatigue:0,injury:0,affairs:{},
    actionsLeft:2,
    eraObj:{id:eraObj.id,name:eraObj.name,war:eraObj.war,cameos:eraObj.cameos,noAcademy:!!eraObj.noAcademy},
    usedEvents:{},romance:null,children:[],legacy:{}
  };
  /* academy objects */
  G.academy={enrolled:false,years:0,grades:ri(50,75),attendance:ri(70,95),discipline:ri(50,80),
    ninjutsuTheory:ri(0,25),shurikenjutsu:ri(0,20),exams:0,failed:0,clubs:[],pranks:0};
  G.school={enrolled:G.age>=6,years:0,grades:ri(50,75)};
  /* family into relationships */
  fam.forEach(function(p){G.rel.push(p)});
  if(circ==="orphan"){
    G.rel.push(newNPC({relation:"Guardian",name:"Matron "+pick(SURNAMES),age:ri(45,70),job:"orphanage matron",rel:ri(40,70)}));
  }
  var bdayEra=eraObj.name;
  timeline("Born "+first+" "+last+(clan&&clan.t<=2?" of the "+clanName+" clan":"")+" in "+VILLAGES[vid].name+", "+bdayEra+".","big");
  if(circ==="orphan")timeline("Your parents died before you could know them. You start life in the village orphanage.","big");
  if(circ==="poor")timeline("Your family is poor. Every ryō will matter.","bad");
  if(circ==="wealthy")timeline("Your family is wealthy by local standards.","good");
  if(clan&&clan.t===1)timeline(clan.d+" You carry a famous bloodline.","rare");
  log("You were born "+first+" "+last+(clan?" of clan "+clanName:"")+" in "+VILLAGES[vid].name+", "+eraObj.name+".", "big");
  G.stats.chakra=clamp(G.stats.chakra,5,99);
  return G;
}
function fullName(){return G.first+" "+G.last}
function isShinobiBorn(){return G.clan&&G.clan!=="Civilian"||G.family.some(function(p){return p.job==="shinobi"})}
function stat(n){return G.stats[n]||0}
function bump(n,v){G.stats[n]=clamp((G.stats[n]||0)+v,0,100)}
function addRyo(n){G.ryō=Math.max(0,(G.ryō||0)+n)}
function addRep(n){bump("reputation",n)}
function timeline(txt,kind){G.timeline.unshift({a:G.age,t:txt,k:kind||""})}
function log(txt,kind){G.feed.unshift({a:G.age,t:txt,k:kind||""})}
function toast(msg){var t=$("toast");t.textContent=msg;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("on")},2200)}

/* ============================ event engine ============================ */
/* Event: {id, age:[min,max], w:weight, once:bool, cond:fn(G)bool, f:fn() -> {t:title, x:body, c:[{t,sub,f}]}}
   A choice's f returns a string (result text) and applies effects. */
var EVENTS=[];
function E(o){EVENTS.push(o)}
function rndNPCName(excl){var n;do{n=pick(NAMES_M.concat(NAMES_F))+" "+pick(SURNAMES)}while(excl&&excl.indexOf(n)>=0);return n}

/* ---------- infancy (0-5) ---------- */
E({id:"first_word",age:[1,2],w:8,once:true,f:function(){
  var word=pick(["mama","papa","food","no","leaf","dog","ball","shinobi","mine"]);
  return {t:"First word",x:"Everyone leans in. Your first word is clearly \""+word+".\"",
    c:[{t:"Say it louder",f:function(){bump("happiness",3);return "You bellow \""+word.toUpperCase()+"\" until the neighbors hear. Your parents are delighted."}},
       {t:"Say it quietly once",f:function(){bump("intelligence",1);return "One soft \""+word+"\", and you go back to your blocks. Grandmother declares you a thinker."}}]};
}});
E({id:"chakra_sign",age:[3,5],w:3,once:true,cond:function(){return stat("potential")>=7},f:function(){
  bump("chakra",8);bump("chakraControl",5);
  return {t:"A strange afternoon",x:"You stare at a candle for a long time. It gutters and dies. Your mother drops a plate.",
    c:[{t:"Do it again",f:function(){bump("chakraControl",4);addRep(2);return "The flame bends again. Your family whispers the word \"chakra\" for the first time."},
        },{t:"Pretend nothing happened",f:function(){bump("discipline",2);return "You decide not to spook them twice. The candle trick stays your secret."}}]};
}});
E({id:"sibling_theft",age:[2,5],w:6,f:function(){
  var s=G.family.filter(function(p){return p.relation==="Brother"||p.relation==="Sister"});
  if(!s.length)return null;var sib=pick(s);
  return {t:"Toy politics",x:sib.name+" (age "+sib.age+") takes your "+pick(["wooden kunai","spinning top","best rock","stuffed raccoon dog","snack"])+" and refuses to give it back.",
    c:[{t:"Wail for your parents",f:function(){G.ryō+=0;relOf(sib.name).rel-=3;return "Justice, briefly. "+sib.name+" returns it and calls you a crybaby."}},
       {t:"Take it back by force",f:function(){if(chance(.55+stat("strength")/200)){relOf(sib.name).rel-=6;bump("strength",1);return "You wrench it back. "+sib.name+" respects you slightly more and fears you slightly more too."}return "You get shoved down and come up crying. It was not worth it."}},
       {t:"Trade a snack for it",f:function(){relOf(sib.name).rel+=5;bump("intelligence",1);return "Negotiated like a tiny merchant. "+sib.name+" thinks you're alright now."}}]};
}});
E({id:"family_move",age:[2,5],w:4,once:true,f:function(){
  var d=pick(["to the edge of the village","closer to the market district","out to the farming terraces","up the hill by the shrine","into the old quarter"]);
  return {t:"The family moves",x:"Your parents pack everything and move "+d+".",
    c:[{t:"Be excited about the new room",f:function(){bump("happiness",3);return "You claim the best spot by the window. New start, good mood."}},
       {t:"Cry about leaving",f:function(){bump("happiness",-2);return "You cry for three days. Your mother carries you everywhere. It passes."}}]};
}});

/* ---------- childhood (6-11) ---------- */
E({id:"academy_invite",age:[6,12],w:20,once:true,cond:function(){return !G.academy.enrolled&&G.age>=VILLAGES[G.village].academyAge},f:function(){
  return {t:"Academy enrollment",x:"An Academy instructor comes by the house: it's time to enroll, or at least it's possible. "+(G.wealth==="poor"?"The fee would sting, but the village waivers orphans and the poor.":""),
    c:[{t:"Enroll in the Ninja Academy",f:function(){G.academy.enrolled=true;G.academy.years=0;G.rank="Academy Student";G.occupation="Academy Student";
        timeline("Enrolled in the Ninja Academy of "+VILLAGES[G.village].name+".","good");return "You put on the uniform too big for you. Day one: sitting still is harder than the kunai."}},
      {t:"Stay in ordinary school",f:function(){G.school.enrolled=true;return "Ordinary letters and numbers for you. Your parents seem relieved. The door to the Academy stays open another year."}}]};
}});
E({id:"bully",age:[6,14],w:9,f:function(){
  var b=rndNPCName();return {t:"The bully",x:b+" is older, bigger, and has decided your lunch money funds his dumpling habit.",
    c:[{t:"Fight",f:function(){if(chance(.3+stat("strength")/120+stat("agility")/200)){bump("strength",2);addRep(4);G.rivals.push({name:b,heat:3});return "You bloody his nose in front of everyone. "+b+" never touches you again. Two kids start calling you senpai."}bump("health",-8);bump("happiness",-5);G.rivals.push({name:b,heat:4});return "He folds you like laundry. The dumplings are gone and so is your dignity."}},
      {t:"Pay up",f:function(){G.ryō=Math.max(0,G.ryō-20);bump("happiness",-4);return "Twenty ryō buys peace for a month. It buys a little shame too."}},
      {t:"Outsmart them",f:function(){if(chance(.4+stat("intelligence")/120)){bump("intelligence",2);addRep(3);return "You hand him a pursed bag of pebbles painted gold and vanish. He hears about it from a teacher by afternoon."}return "Your plan has a hole in it, and the hole is you, caught, upside down in a barrel."}},
      {t:"Tell a teacher",f:function(){bump("discipline",1);bump("happiness",-1);return "The teacher handles it. Nobody calls you a snitch to your face, but you hear it once, quietly."}}]};
}});
E({id:"talent_found",age:[6,12],w:6,once:true,cond:function(){return stat("potential")>=6},f:function(){
  var area=weighted([["taijutsu",stat("strength")+stat("agility")],["ninjutsu",stat("chakra")],["genjutsu",stat("intelligence")],["shurikenjutsu",stat("agility")],["strategy",stat("intelligence")+stat("discipline")]])[0];
  return {t:"A talent surfaces",x:"During class drills, something clicks. The instructor stops the whole line to watch you "+(area==="strategy"?"solve a capture exercise three moves early":area==="shurikenjutsu"?"put ten throws in a bucket at ten paces":area==="ninjutsu"?"mold chakra without being taught":"move")+".",
    c:[{t:"Lean into it",f:function(){bump(area==="strategy"?"intelligence":area,4);addRep(3);G.feats.push("Child prodigy in "+cap(area));timeline("Shown a rare talent for "+area+".","rare");return "The word \"prodigy\" gets used. It follows you around now."}},
      {t:"Keep it low-key",f:function(){bump(area==="strategy"?"intelligence":area,2);bump("discipline",2);return "You nod politely and do it average the rest of the day. Nobody suspects the quiet one."}}]};
}});
E({id:"family_argument",age:[4,16],w:7,f:function(){
  var a=pick(G.family);if(!a)return null;
  var topic=pick(["money","your future","a broken vase","whose turn it is to cook","the way you talk back"]);
  return {t:"Raised voices",x:"Your parents argue about "+topic+" late into the night. You hear everything through the paper door.",
    c:[{t:"Stay in bed",f:function(){return "You pull the blanket over your head. In the morning it's as if nothing happened."}},
      {t:"Interrupt and try to make peace",f:function(){if(chance(.4+stat("intelligence")/150)){relOf(a.name).rel+=8;bump("happiness",2);return "You walk in, say something small and true, and they both laugh at how serious you look. Peace."}return "You pick a side at the worst possible moment. Both turn on you for a minute. It passes, barely."}}]};
}});
E({id:"festival",age:[5,99],w:8,f:function(){
  var f=pick(["the village fireworks festival","the harvest lantern night","the Kage's birthday parade","the shrine's fire-walking rite"]);
  return {t:"Festival",x:"It's "+f+". Paper lanterns everywhere, grilled squid smoke, goldfish in bags.",
    c:[{t:"Spend the night eating",f:function(){var c=Math.min(G.ryō,30);G.ryō-=c;bump("happiness",6);return "You eat your weight in yakisoba. Worth every ryō."}},
      {t:"Show off for the crowd",f:function(){if(chance(.5+stat("agility")/150)){addRep(3);bump("happiness",3);return "You backflip off the fountain rail and land it. A stranger gives you a free candy apple."}return "You slip on a spilled drink and take out a lantern stand. The crowd remembers, unfortunately."}},
      {t:"Watch the crowd",f:function(){bump("intelligence",1);bump("happiness",2);return "You people-watch all night and catch three pickpockets working the same street. You say nothing, but you learn."}}]};
}});

/* ---------- academy years ---------- */
E({id:"academy_rival",age:[7,15],w:10,f:function(){
  if(!G.academy.enrolled)return null;var r=rndNPCName();
  if(!G._rival)G._rival=r;
  return {t:"Your academy rival",x:"A classmate named "+G._rival+" claims in front of everyone that you only do well because of family connections.",
    c:[{t:"Challenge them to a spar",f:function(){var win=chance(.35+stat("taijutsu")/130+stat("agility")/250);
        if(win){addRep(5);bump("taijutsu",2);G.rivals.push({name:G._rival,heat:2});return "You take them down clean in under a minute. The crowd of students decides the matter for good."}
        bump("happiness",-4);G.rivals.push({name:G._rival,heat:3});return "They put you on your back in front of everyone. The story grows legs; by tomorrow you lost 10-0."}},
      {t:"Ignore the insult",f:function(){bump("discipline",2);return "You say nothing and beat them on the next exam instead. Silence with results is its own answer."}},
      {t:"Respond verbally",f:function(){if(chance(.5+stat("intelligence")/130)){addRep(3);return "Your comeback is so precise that even their friends laugh at them. You get a week of detentions. Worth it."}bump("happiness",-3);return "You fumble the comeback and they finish you off with an impression. Brutal."}},
      {t:"Ask the instructor to intervene",f:function(){bump("discipline",1);addRep(-2);return "The instructor shuts it down. Some kids call you a snitch behind your back, but the insult stops."}}]};
}});
E({id:"skip_class",age:[8,15],w:6,f:function(){
  if(!G.academy.enrolled)return null;
  return {t:"A perfect day for it",x:"It's warm, the training field is dull, and the river is calling. Class is... optional?",
    c:[{t:"Skip to the river",f:function(){bump("happiness",5);G.academy.attendance-=8;var c=chance(.4);return c?"You swim all day. Perfect. Until the attendance ledger catches you tomorrow.":"You swim all day and slip back before anyone counts heads. Perfect crime."}},
      {t:"Stay and drill",f:function(){bump("discipline",2);G.academy.ninjutsuTheory+=2;return "You drill leaf-sticking until your forehead aches. Boring. Effective."}}]};
}});
E({id:"prank",age:[8,15],w:5,f:function(){
  if(!G.academy.enrolled)return null;
  var target=pick(["the instructor's chair","the exam bell","the girls' changing room door","the headmaster's wig","the school flags"]);
  return {t:"A prank forms in your mind",x:"You have a plan involving "+target+", a tripwire, and paint.",
    c:[{t:"Do it",f:function(){G.academy.pranks++;if(chance(.6)){bump("happiness",4);addRep(2);return "It works beautifully. Legends are told. Nobody can prove anything."}
        bump("discipline",-3);G.academy.discipline-=10;return "You are caught mid-tripwire, paint bucket in hand. The punishment laps you see at dawn are eternal."}},
      {t:"Save it for later",f:function(){bump("intelligence",1);return "Patience. The prank, like a good trap, will keep."}}]};
}});
E({id:"grad_exam",age:[8,18],w:99,once:true,cond:function(){return G.academy.enrolled&&G.academy.years>=2&&G.academy.ninjutsuTheory>=40&&G.academy.shurikenjutsu>=35&&G.academy.grades>=55&&G.age>=VILLAGES[G.village].academyAge+3},f:function(){
  return {t:"Graduation exam",x:"Today is the graduation exam: clone technique, transformation, and three targets with the shuriken. Pass and you wear a hitai-ate.",
    c:[{t:"Take the exam",f:function(){var score=stat("ninjutsu")*.4+G.academy.ninjutsuTheory*.3+stat("chakraControl")*.2+G.academy.grades*.2+ri(-10,15);
        G.academy.exams++;
        if(score>=55){beginGenin();return "The clone splits clean, the transformation holds, all three targets thud. The headband is warm in your hands. You are a shinobi of "+VILLAGES[G.village].name+"."}
        G.academy.failed++;bump("happiness",-8);timeline("Failed the graduation exam.","bad");return "Your clone comes out lopsided and your last shuriken misses wide. Another year at the Academy. The instructor says \"next time\" with kind eyes."}},
      {t:"Wait one more year",f:function(){bump("discipline",1);return "You ask for another year to sharpen. The instructor nods. Some students whisper \"scared\", but you know better."}}]};
}});

/* ---------- genin and beyond ---------- */
E({id:"mission_gone_wrong",age:[12,60],w:7,cond:function(){return G.rank!=="Newborn"&&G.rank!=="Academy Student"&&G.rank!=="Child"&&!G.eraObj.noAcademy},f:function(){
  return {t:"Things go sideways",x:"A routine patrol turns strange: an overturned cart, no horses, and fresh blood on the road.",
    c:[{t:"Investigate",f:function(){if(chance(.5+stat("intelligence")/200)){addRep(4);G.missionCount+=.5;return "It's bandits counting their take. You mark the camp and report it. The recovery operation that follows has your name in the report."}
        bump("health",-10);return "It's an ambush, and you walk into it. You survive by running. Your sensei says you're lucky; it doesn't feel like luck."}},
      {t:"Report back immediately",f:function(){bump("discipline",2);addRep(2);return "You report it within the hour. Textbook. The response team is grateful, if a little bored by now."}},
      {t:"Set a trap and wait",f:function(){if(chance(.4+stat("discipline")/150)){G.missionCount+=1;addRyo(150);addRep(5);return "The bandits come back for the cart. Your trap takes all three. The bounty notice reads well."}bump("health",-6);return "You wait four hours and nothing comes. Then a real patrol finds you asleep at your own tripwire."}}]};
}});
E({id:"war_draft",age:[12,45],w:6,cond:function(){return G.eraObj.war>0.05&&G.rank!=="Newborn"&&G.rank!=="Academy Student"&&!G.flags.rogue},f:function(){
  return {t:"War reaches the village",x:"The war on the borders has reached "+VILLAGES[G.village].name+"'s doors. Manifests go up; names are called.",
    c:[{t:"Answer the call",f:function(){G.flags.veteran=true;addRep(6);if(chance(.3+G.eraObj.war)){bump("health",-ri(10,25));timeline("Wounded in the war effort.","bad");return "The front is nothing like the stories. You come back with "+pick(INJURIES)+" and a campaign ribbon nobody ever asks about."}
        G.missionCount+=2;addRyo(300);timeline("Served in wartime.","big");return "You serve two brutal rotations and come back whole, harder, and decorated."}},
      {t:"Volunteer for support duty",f:function(){addRyo(120);bump("discipline",2);return "You haul stretchers and sort rations. Not glorious, and nobody dies under your hands."}},
      {t:"Dodge it",f:function(){G.flags.dodged=true;addRep(-8);bump("happiness",-3);return "You arrange to be elsewhere each time the crier comes. It works. Some people notice anyway."}}]};
}});
E({id:"romance_meet",age:[18,45],w:9,once:true,cond:function(){return !G.romance},f:function(){
  var n=rndNPCName();var place=pick(["the ramen stand","a mission briefing","the flower shop","your landlord's doorway","the library","a rainy bus stop"]);
  return {t:"Someone new",x:"You keep running into "+n+" around "+place+". Lately the conversations run long.",
    c:[{t:"Ask them out",f:function(){if(chance(.45+stat("reputation")/200)){G.romance={name:n,rel:60};G.rel.push({name:n,relation:"Partner",age:clamp(G.age+ri(-3,4),18,60),personality:pick(PERSONALITIES).n,job:pick(CIV_DUTIES.concat(["shinobi","shinobi"])),rel:60,alive:true,tier:"love"});timeline("Started a relationship with "+n+".","good");return "They say yes. The next month is the best in a long time."}
        bump("happiness",-3);return "They're flattered but seeing someone. The ramen still tastes fine, mostly."}},
      {t:"Keep it friendly",f:function(){G.rel.push({name:n,relation:"Friend",age:clamp(G.age+ri(-3,4),18,60),personality:pick(PERSONALITIES).n,job:pick(CIV_DUTIES),rel:55,alive:true,tier:"friend"});bump("happiness",2);return "A good friend is not a small thing either."}}]};
}});
E({id:"propose",age:[20,70],w:4,cond:function(){return G.romance&&G.romance.rel>70&&!G.flags.married},f:function(){
  return {t:"The question",x:"You have saved up, you have a plan, and "+G.romance.name+" laughs at all your worst jokes. Time to ask.",
    c:[{t:"Propose",f:function(){G.flags.married=true;G.romance.relation="Spouse";timeline("Married "+G.romance.name+".","big");bump("happiness",10);return "A small ceremony at the shrine, too much sake, and a lifetime starting tonight."},
        },{t:"Wait a little longer",f:function(){G.romance.rel-=3;return "You wait. "+G.romance.name+" waits too, though you catch them looking at you strangely once."}}]};
}});
E({id:"child",age:[22,55],w:4,cond:function(){return G.flags.married&&G.children.length<3},f:function(){
  var female=chance(.5);var n=pick(female?NAMES_F:NAMES_M);
  return {t:"A child",x:G.romance.name+" is pregnant. In the spring, your "+(G.children.length===0?"first":"next")+" child arrives.",
    c:[{t:"Name them "+n,f:function(){var c={name:n+" "+G.last,relation:female?"Daughter":"Son",age:0,personality:pick(PERSONALITIES).n,rel:80,alive:true,tier:"child",job:null};G.children.push(c);G.rel.push(c);bump("happiness",8);timeline("Your child "+n+" is born.","big");return "You count ten fingers, ten toes, and one enormous responsibility."}},
      {t:"Let "+G.romance.name+" choose",f:function(){var c={name:pick(female?NAMES_F:NAMES_M)+" "+G.last,relation:female?"Daughter":"Son",age:0,personality:pick(PERSONALITIES).n,rel:80,alive:true,tier:"child",job:null};G.children.push(c);G.rel.push(c);bump("happiness",8);timeline("Your child "+c.name+" is born.","big");return "They choose well. You cry a little and tell nobody."}}]};
}});

/* ---------- elite paths, kage, rogue ---------- */
E({id:"anbu_invite",age:[18,45],w:5,once:true,cond:function(){return (G.rank==="Jonin"||G.rank==="Chunin")&&!G.flags.anbu&&!G.rogue&&stat("reputation")>=60&&stat("loyalty")>=6},f:function(){
  return {t:"A masked visitor",x:"A masked operative waits outside your window at dawn. ANBU has been watching your file. They want you, and they don't ask twice.",
    c:[{t:"Join ANBU",f:function(){G.flags.anbu=true;G.occupation="ANBU Operative";addRep(10);bump("happiness",-3);G.payTier="anbu";timeline("Joined the ANBU.","big");return "You sign papers that mostly say you no longer exist publicly. The mask fits cold."}},
      {t:"Decline",f:function(){bump("loyalty",-1);return "You prefer the sun. The masked visitor nods once and is gone before you finish the sentence."}}]};
}});
E({id:"medical_track",age:[14,50],w:5,once:true,cond:function(){return G.rank==="Chunin"||G.rank==="Genin"&&G.academy.ninjutsuTheory>=60&&!G.flags.medical},f:function(){
  return {t:"The hospital's offer",x:"The hospital needs chakra-surgeon trainees. The pay is steady, the hours are brutal, and saving lives beats taking them.",
    c:[{t:"Train as a medical ninja",f:function(){if(stat("intelligence")>=45&&stat("chakraControl")>=40){G.flags.medical=true;G.occupation="Medical Ninja";G.payTier="medical";timeline("Trained as a medical ninja.","good");return "You learn to knit flesh with chakra. Your first save is a farmer's son. You don't sleep that night, for good reasons."}
        return "Six weeks in, you fail out of the surgical program. The hospital keeps you on as an orderly; the chakra isn't there yet."}},
      {t:"Stay on the combat track",f:function(){bump("taijutsu",2);return "You thank them and keep your blade sharp."}}]};
}});
E({id:"chunin_exam",age:[13,50],w:8,cond:function(){return G.rank==="Genin"&&G.missionCount>=8&&stat("ninjutsu")+stat("taijutsu")>=90&&!G.flags.chuninExamThisYear},f:function(){
  G.flags.chuninExamThisYear=true;
  return {t:"Chunin exam nomination",x:"Your sensei has put your name forward for the Chunin Exams. Three stages: a written gauntlet, a survival course in the Forest of Testing, and tournament finals before the Kages' boxes.",
    c:[{t:"Enter the exams",f:function(){var s=stat("intelligence")*.3+stat("ninjutsu")*.2+stat("taijutsu")*.2+stat("discipline")*.2+stat("reputation")*.1+ri(-15,20);
        if(s>=62){promoteChunin();return "You survive the forest with your scroll, and take your finals match with patience and a borrowed opponent's overconfidence. The box of the "+VILLAGES[G.village].kage+" nods. Chunin."}
        if(s>=45){bump("reputation",5);return "You fall in the finals to a monster from "+pick(Object.keys(VILLAGES))+", but the Kage's box notes your performance. Next time."}
        bump("happiness",-6);return "The written stage eats you alive. You are carried out of the forest on a stretcher. There is always next year."}},
      {t:"Decline this year",f:function(){bump("discipline",1);return "You're not ready and you know it. Your sensei respects the honesty."}}]};
}});
E({id:"kage_candidacy",age:[30,90],w:4,once:true,cond:function(){return G.rank==="Jonin"&&stat("reputation")>=80&&!G.flags.kageCandidacy},f:function(){
  return {t:"A whisper in the tower",x:"The council has been asking about you. The "+VILLAGES[G.village].kage+" is aging, and the village needs its next pillar. Your name is on a short list of three.",
    c:[{t:"Declare candidacy",f:function(){var s=stat("reputation")+stat("loyalty")*3+stat("discipline")*.5+G.missionCount*2;
        if(s>=220){G.flags.kage=true;G.occupation="Kage of "+VILLAGES[G.village].name;G.rank="Kage";addRep(15);timeline("Named "+VILLAGES[G.village].kage+" of "+VILLAGES[G.village].name+".","big");G.feats.push("Became "+VILLAGES[G.village].kage);return "The hat is heavier than anyone admits. The village bows. Your whole life led here."}
        timeline("Ran for "+VILLAGES[G.village].kage+" and lost.","bad");addRep(4);return "The council chooses the other candidate, a woman two decades your senior. She names you to her personal guard. Not the hat. Not yet."}},
      {t:"Stay out of politics",f:function(){bump("happiness",2);return "You have seen what the desk does to legends. You'll keep your boots muddy."}}]};
}});
E({id:"rogue_choice",age:[14,60],w:3,cond:function(){return !G.rogue&&["Genin","Chunin","Jonin","ANBU"].indexOf(G.rank)>=0&&(G.flags.vendetta||stat("happiness")<25||chance(.25))},f:function(){
  return {t:"The knife edge",x:"It has been building: "+(G.flags.vendetta?"the person who ruined your family walks free under the village's protection.":"orders that sit wrong, a justice shaped like paperwork, a village that takes and takes."),
    c:[{t:"Cut the headband",f:function(){becomeRogue("You abandoned "+VILLAGES[G.village].name+" by your own choice.");return "You slash the metal in front of the gate and walk into the dark. By dawn, hunter-nin have your face."}},
      {t:"Stay",f:function(){bump("loyalty",2);bump("happiness",3);G.flags.vendetta=false;return "You put the thought away in a box and sit on the lid. It stays shut. Mostly."}}]};
}});
E({id:"rogue_hunt",age:[14,70],w:12,cond:function(){return G.rogue},f:function(){
  var hunter=rndNPCName();
  return {t:"Hunted",x:"A hunter-nin named "+hunter+" has tracked you for "+ri(2,9)+" days. Tonight they finally close the distance.",
    c:[{t:"Fight",f:function(){var s=stat("ninjutsu")+stat("taijutsu")+stat("agility")/2;
        if(chance(clamp(s/260,.15,.85))){addRep(4);G.wanted+=1;return "You put "+hunter+" down hard enough to live and walk away faster. Your bounty climbs."}
        bump("health",-ri(20,45));if(stat("health")<=0){return "DEATH"}return "You barely escape with "+pick(INJURIES)+". The net is tightening."}},
      {t:"Run deeper into the wilds",f:function(){if(chance(.55)){bump("happiness",-4);return "You run until the dogs lose the scent. Cold, hungry, free."}bump("health",-12);return "You run into a border patrol by accident. It costs you blood to get away."}},
      {t:"Attempt redemption: surrender to the village",f:function(){return "REDEEM"}}]};
}});

/* ============================ systems ============================ */
function beginGenin(){
  G.rank="Genin";G.geninYear=G.age;G.occupation="Genin";
  var t1=rndNPCName(),t2=rndNPCName(),sensei=pickSensei();
  G.team=[{name:t1,rel:ri(40,70)},{name:t2,rel:ri(40,70)}];
  G.team.forEach(function(m){addRel({name:m.name,relation:"Teammate",age:clamp(G.age+ri(-2,2),12,60),personality:pick(PERSONALITIES).n,job:"Genin",rel:m.rel,alive:true,tier:"team"})});
  G.senseiName=sensei;
  addRel({name:sensei,relation:"Sensei",age:ri(24,40),personality:pick(PERSONALITIES).n,job:"Jonin",rel:ri(45,70),alive:true,tier:"sensei"});
  timeline("Graduated the Academy. Assigned to Team "+ri(2,58)+" under "+sensei+", with "+t1+" and "+t2+".","big");
  log("Graduation day. Squad: "+sensei+" (sensei), "+t1+", "+t2+".","big");
}
function pickSensei(){
  if(chance(.12)&&G.eraObj.cameos.length){return pick(G.eraObj.cameos)}
  var pres=["Mighty","Lazy","Cruel","Kind","Strange","Fearless","Silent","Loud","Weary","Brilliant"];
  return pick(pres)+" "+pick(SURNAMES);
}
function promoteChunin(){G.rank="Chunin";G.chuninYear=G.age;G.occupation="Chunin";addRep(8);G.payTier=null;timeline("Promoted to Chunin.","big")}
function promoteJonin(){
  G.rank="Jonin";G.joninYear=G.age;G.occupation="Jonin";addRep(10);timeline("Promoted to Jonin.","big");
}
function becomeRogue(why){
  G.rogue={since:G.age,why:why};G.wanted=1;G.rank="Missing-nin";G.occupation="Missing-nin";
  G.team=null;addRep(-15);timeline("Became a missing-nin. "+why,"big");
}
function ageNPCs(){
  G.rel.forEach(function(r){
    if(!r.alive)return;
    if(r.tier==="child"||r.tier==="family"||r.tier==="love"||r.tier==="friend"||r.tier==="team"||r.tier==="sensei")r.age=(r.age||G.age)+1;
    var deathAge=r.tier==="family"?ri(68,92):ri(60,95);
    if(r.age>deathAge&&chance(.35)){
      r.alive=false;log(r.name+" ("+r.relation+") passed away at "+r.age+".","bad");timeline(r.name+" died.","bad");
      if(r.tier==="family"||r.tier==="love")bump("happiness",-12);
    }
  });
}
function payForRank(){
  var base={Genin:120,Chunin:340,Jonin:600,"ANBU Operative":800,"Medical Ninja":500,"Sensor Ninja":520,"Academy Instructor":420,"Intelligence Division":480}[G.occupation];
  if(G.flags.kage)base=1500;
  if(!base)base=0;
  base+=Math.round(G.missionCount*3);
  addRyo(base);
  return base;
}
function yearGrowth(){
  var s=G.stats;
  if(G.age<=5){s.health+=2;s.strength+=1;s.intelligence+=ri(0,2);s.chakra+=ri(0,2)}
  else if(G.age<=12){s.health+=1;s.strength+=ri(0,2);s.agility+=ri(0,2);s.intelligence+=ri(0,2);s.chakra+=ri(1,3)}
  else if(G.age<=20){s.strength+=ri(0,2);s.agility+=ri(0,1);s.intelligence+=ri(0,1)}
  else if(G.age>40){s.agility=Math.max(0,s.agility-ri(0,2));s.strength=Math.max(0,s.strength-ri(0,1))}
  s.happiness-=ri(0,3);
  if(G.fatigue>0){s.health-=Math.floor(G.fatigue/2)}
  G.fatigue=Math.max(0,G.fatigue-2);
  if(G.injury>0){G.injury--;s.health+=5}
  s.health=clamp(s.health,0,100);
}
function mortality(){
  if(G.age<50)return chance(.004+G.eraObj.war/10);
  var p=(G.age-48)*.006+ (100-stat("health"))*.0025 + (G.occupation==="ANBU Operative"?.01:0);
  return chance(p);
}
function deathSummary(){
  var s=G.stats,ach=G.feats.length;
  var score=s.reputation*.5+G.missionCount*2+ach*8+(G.flags.kage?30:0)+(G.flags.anbu?10:0)+s.loyalty*1.5+s.happiness*.3+Math.min(G.ryō/500,15);
  var grade=score>=200?"S":score>=140?"A":score>=85?"B":score>=40?"C":"D";
  var rank=G.rank||"Genin";
  var bio=fullName()+", born in "+VILLAGES[G.village].name+" during the "+G.eraName+".\n"+
    (G.clan&&G.clan!=="Civilian"?"Born of the "+G.clan+" clan. ":"A civilian-born child. ")+
    "Rose to "+rank+(G.flags.kage?" and the hat of "+VILLAGES[G.village].kage:"")+".\n"+
    G.missionCount+" missions on record"+(G.missionsS?", "+G.missionsS+" of them S-rank":"")+". "+ach+" notable feats.\n"+
    (G.rogue?"Left the village at "+G.rogue.since+" and never looked back. ":"Faithful to "+VILLAGES[G.village].name+" to the end. ")+
    (G.flags.married?"Survived by "+(G.romance?G.romance.name:"a spouse")+(G.children.length?" and "+G.children.length+" child"+(G.children.length>1?"ren":"")+".":". "):"");
  timeline("Died at "+G.age+".", "big");
  return {grade:grade,bio:bio,cause:G.deathCause||"natural causes"};
}

/* ============================ world events ============================ */
var WORLD=[
  {era:"sw2",t:"Border skirmish",x:"Fighting flares on the "+pick(["north","western","eastern"])+" border. Refugee carts clog the main road for a week.",f:function(){if(G.age>=10){bump("happiness",-4);addRep(2);return "You help unload supply carts at the gate. The village notices who shows up."}return "You're too young to help; you watch the fires on the hills from the roof."}},
  {era:"sw3",t:"A legend falls",x:"Word spreads of a great shinobi's death on the front. Flags fly at half-mast.",f:function(){bump("happiness",-3);return "The whole village mourns. Children are warned to train harder."}},
  {era:"quiet",t:"Kyubi memorial",x:"The village holds its annual memorial for the Nine-Tails attack.",f:function(){bump("happiness",1);return "Candles everywhere. You eat festival food in a solemn crowd."}},
  {era:"storm",t:"Akatsuki sighting",x:"A red-cloud cloak was seen in the next country. Curfews tighten; jonin vanish on long assignments.",f:function(){bump("happiness",-3);if(G.rank==="Jonin"&&chance(.3)){addRyo(200);return "Your squad is pulled for emergency watch rotations. Danger pay helps."}return "The village hums with quiet dread."}},
  {era:"newgen",t:"Thunder rail opens",x:"The new thunder rail line opens, connecting the five great villages like never before.",f:function(){bump("happiness",3);addRyo(0);return "Everyone rides it once just to feel the speed. The world feels smaller."}},
  {era:"warring",t:"Clan war truce",x:"Two feuding clans sign a truce at the shrine. Peace, of the temporary kind.",f:function(){bump("happiness",2);return "Markets reopen. Nobody fully trusts it."}}
];
function worldEvent(){
  var pool=WORLD.filter(function(w){return w.era===G.eraObj.id});
  if(!pool.length||!chance(.18))return;
  var w=pick(pool);
  var r=w.f();
  log("World: "+w.t+". "+r,"world");
  timeline(w.t+" — "+r,"world");
}

/* ============================ age up ============================ */
function ageUp(){
  G.age++;
  G.actionsLeft=2;
  G.flags.chuninExamThisYear=false;
  yearGrowth();
  ageNPCs();
  var pay=payForRank();
  if(pay)log("Salary and mission pay: +"+money(pay)+".","");
  worldEvent();
  /* school progression */
  if(G.school.enrolled&&G.age<=12&&!G.academy.enrolled){
    G.school.years++;G.school.grades=clamp(G.school.grades+ri(-2,3),10,100);
  }
  if(G.academy.enrolled){
    G.academy.years++;
    G.academy.grades=clamp(G.academy.grades+ri(-3,3)+(stat("intelligence")>50?1:-1),10,100);
    G.academy.attendance=clamp(G.academy.attendance+ri(-4,2),30,100);
    if(G.academy.years%2===0){var g=ri(2,6);G.academy.ninjutsuTheory+=g;G.academy.shurikenjutsu+=ri(1,5);bump("chakraControl",ri(0,2))}
    if(G.age>=16&&G.academy.enrolled){timeline("Aged out of the Academy without graduating.","bad");log("At "+G.age+", you have aged out of the Academy. The shinobi path closes quietly.","bad");G.academy.enrolled=false;G.rank="Civilian";G.occupation="Civilian"}
  }
  /* rank-specific yearly things */
  if(G.rank==="Genin"&&chance(.3)){var dm=quickMission("D");log(dm.txt,"");}
  /* death */
  if(mortality()){
    G.deathCause=G.age>60?pick(["old age","a long illness","quiet heart failure"]):pick(["an illness the medics lost to","a mission that never came home","the war's long shadow"]);
    return die();
  }
  runEvents();
  autosave();
  render();
}
function die(){
  closeModal();
  var s=deathSummary();
  showDeath(s);
  autosave();
}
/* pick and run 1-2 events */
function runEvents(){
  var cands=EVENTS.filter(function(e){
    if(G.age<e.age[0]||G.age>e.age[1])return false;
    if(e.once&&G.usedEvents[e.id])return false;
    if(e.cond&&!e.cond())return false;
    return true;
  });
  var inv=cands.filter(function(e){return e.id==="academy_invite"});
  if(inv.length){runOne(inv[0]);if(!cands.length)return}
  if(!cands.length){fillerEvent();return}
  var n=chance(.65)?1:2;
  var used={};
  for(var i=0;i<n;i++){
    var avail=cands.filter(function(e){return !used[e.id]});
    if(!avail.length)break;
    var ev=weighted(avail.map(function(e){return [e,e.w||5]}));
    used[ev.id]=true;
    runOne(ev);
  }
}
function runOne(ev){
  if(ev.once)G.usedEvents[ev.id]=true;
  var body=ev.f();
  if(!body){return}
  if(body==="DEATH"){G.deathCause="wounds from a lost fight";return die()}
  if(body==="REDEEM"){redeemRogue();return}
  presentEvent(body);
}
function fillerEvent(){
  var n1=rndNPCName(),n2=rndNPCName();
  var F=[
    function(){bump("happiness",2);return "A quiet year. " + pick(["Good weather, small joys.","You fixed the leaky roof and slept proud.","The neighbor's dog finally likes you."])},
    function(){bump("intelligence",1);return "You read three books this year about "+pick(["chakra theory","old wars","cooking","cloud watching","the founding of the villages"])+"."},
    function(){var f=pick(G.family.filter(function(p){return p.alive}));if(!f)return;relOf(f.name).rel+=3;return f.name+" needed help with "+pick(["the harvest","a stubborn lock","the shop books","a leak"])+" and you stayed all afternoon. It meant something."},
    function(){bump("happiness",-2);return "A hard stretch. "+pick(["Money was tight all season.","A fever went through the house.","The rains came late and the fields suffered."])},
    function(){addRep(1);return "You helped "+n1+" with "+pick(["a move gone wrong","carrying firewood","a lost child found crying","a flat cart wheel"])+" and got a reputation for being decent."},
    function(){return "Nothing much happened this year, and that was fine."}
  ];
  var r=pick(F)();
  log(r,"");
}
function quickMission(rk){
  G.missionCount+=.25;
  var ok=chance(.85);
  if(ok){addRyo(rk==="D"?ri(30,80):200);return {txt:"Mission: "+pick(MISSION_TYPES.D)+". Completed.",ok:true}}
  return {txt:"Mission: "+pick(MISSION_TYPES.D)+". It went badly; no pay.",ok:false};
}

/* ============================ activities ============================ */
function ACTIVITY_LIST(){
  var A=[];
  var s=G.stats;
  if(G.academy.enrolled){
    A.push({id:"study",t:"Study",d:"Hit the books (+grades, intelligence)",f:function(){G.academy.grades=clamp(G.academy.grades+ri(3,8),0,100);bump("intelligence",2);G.actionsLeft--;return "You study until the lamp burns low. Grades climb."}});
    A.push({id:"drill",t:"Train jutsu theory",d:"Hand signs and chakra exercises",f:function(){G.academy.ninjutsuTheory+=ri(2,6);bump("chakraControl",ri(1,3));bump("chakra",2);G.fatigue++;G.actionsLeft--;return "You drill "+pick(JUTSU_A)+" "+pick(JUTSU_B)+" until the hands remember without you."}});
    A.push({id:"social",t:"Make friends",d:"Be someone worth knowing",f:function(){G.actionsLeft--;var n=rndNPCName();
      if(chance(.55+stat("reputation")/300)){addRel({name:n,relation:"Friend",age:clamp(G.age+ri(-2,3),6,60),personality:pick(PERSONALITIES).n,job:G.rank==="Newborn"?null:pick(CIV_DUTIES),rel:ri(45,65),alive:true,tier:"friend"});bump("happiness",3);return "You and "+n+" click over "+pick(["lunch","a training mistake","a shared hatred of morning drills","comics"])+". Friend for life, probably."}
      return "You try; "+n+" is friendly but busy. Some seeds take years."}});
    if(G.age>=8)A.push({id:"shuriken",t:"Shuriken practice",d:"Target range hours (+shurikenjutsu)",f:function(){G.academy.shurikenjutsu+=ri(3,7);bump("agility",1);G.fatigue++;G.actionsLeft--;return "Two hundred throws. The bullseye starts fearing you."}});
  }
  if(G.age>=6&&!G.academy.enrolled&&G.school.enrolled){
    A.push({id:"study",t:"Study",d:"Do your schoolwork properly",f:function(){G.school.grades=clamp(G.school.grades+ri(3,8),0,100);bump("intelligence",2);G.actionsLeft--;return "Clean notes, sharp mind."}});
  }
  if(G.age>=6){
    A.push({id:"play",t:"Play",d:"Be a kid for an afternoon",f:function(){bump("happiness",6);bump("agility",1);G.actionsLeft--;return pick(["An epic game of shinobi-and-scouts till dark.","You build a dam in the creek and defend it honorably.","Kite fights on the ridge. You lose gloriously."])}});
  }
  if(G.age>=10&&!G.eraObj.noAcademy){
    A.push({id:"chakra",t:"Chakra control practice",d:"Leaf-sticking and water walking",f:function(){bump("chakraControl",ri(2,5));bump("chakra",1);G.fatigue++;G.actionsLeft--;return "The leaf trembles, then holds. Small gods of patience."}});
    A.push({id:"taijutsu",t:"Taijutsu training",d:"Strength and conditioning",f:function(){bump("taijutsu",ri(2,5));bump("strength",ri(1,3));G.fatigue+=2;G.actionsLeft--;if(chance(.08)){bump("health",-6);return "You overdo a landing and "+pick(INJURIES)+". Ice, rest, lesson learned."}return "Sweat, soreness, progress."}});
    A.push({id:"meditate",t:"Meditate",d:"Stillness work (+discipline, happiness)",f:function(){bump("discipline",ri(1,3));bump("happiness",2);G.fatigue=Math.max(0,G.fatigue-1);G.actionsLeft--;return "You sit with your breath until the noise settles."}});
  }
  if(G.rank==="Genin"||G.rank==="Chunin"||G.rank==="Jonin"||G.occupation==="ANBU Operative"){
    A.push({id:"ninjutsu",t:"Ninjutsu training",d:"Element and technique work",f:function(){bump("ninjutsu",ri(2,5));bump("chakra",ri(1,3));G.fatigue+=2;G.actionsLeft--;return "You burn through a training log and name a new jutsu aloud: "+pick(JUTSU_A)+" "+pick(JUTSU_B)+" no Jutsu."}});
    if(G.senseiName&&relOf(G.senseiName)&&relOf(G.senseiName).alive)A.push({id:"sensei",t:"Train with "+G.senseiName.split(" ")[0],d:"Sensei's personal attention",f:function(){var sr=relOf(G.senseiName);sr.rel+=6;bump("ninjutsu",ri(2,4));bump("taijutsu",ri(1,3));G.actionsLeft--;return G.senseiName+" drills you mercilessly and buys you dinner after. \""+pick(["Again.","Better.","Faster next time.","You learn quick."])+"\""}});
    if(G.team)A.push({id:"teamtrain",t:"Team training",d:"Squad drills with your team",f:function(){G.team.forEach(function(m){var r=relOf(m.name);if(r)r.rel+=4});bump("taijutsu",2);bump("discipline",1);G.actionsLeft--;return "Formation drills till dusk. The squad moves like one animal now."}});
  }
  if(G.age>=16){
    A.push({id:"job",t:"Take side work",d:"Odd jobs for extra ryō",f:function(){var n=ri(40,120)+(G.wealth==="poor"?20:0);addRyo(n);G.fatigue++;G.actionsLeft--;return "You haul, fetch and fix for "+money(n)+"."}});
  }
  A.push({id:"family",t:"Family time",d:"Spend the day with family",f:function(){G.actionsLeft--;var alive=G.family.filter(function(p){return p.alive});
    if(!alive.length)return "You visit the memorial stone with incense. The dead listen better than most.";
    var p=pick(alive);relOf(p.name).rel+=8;bump("happiness",4);return "A whole afternoon with "+p.name+". "+pick(["You talk about everything and nothing.","They teach you an old family recipe.","You fix the garden together.","They tell stories about your grandparents."])}});
  A.push({id:"rest",t:"Rest",d:"Recover health and fatigue",f:function(){G.actionsLeft--;bump("health",6);G.fatigue=Math.max(0,G.fatigue-2);bump("happiness",2);return "You do absolutely nothing, expertly."}});
  return A;
}

/* ============================ missions ============================ */
function availableRanks(){
  var out=["D"];
  if(G.rank==="Genin"){if(G.missionCount>=6&&stat("reputation")>=15)out.push("C")}
  else if(G.rank==="Chunin"){out.push("C");if(G.missionCount>=14)out.push("B")}
  else if(G.rank==="Jonin"||G.occupation==="ANBU Operative"){out.push("C","B");if(G.missionCount>=25)out.push("A")}
  if(G.rogue)out=["B","A"];/* rogue work */
  if(G.flags.kage)out.push("A","S");
  return out;
}
function runMission(rank){
  var desc=pick(MISSION_TYPES[rank]);
  var risk={D:.04,C:.12,B:.28,A:.45,S:.65}[rank];
  var teamScore=0;
  if(G.team)G.team.forEach(function(m){var r=relOf(m.name);teamScore+=((r&&r.rel)||40)/25});
  var senseiBonus=G.senseiName&&rank!=="D"&&rank!=="C"&&chance(.5)?8:0;
  var relevant=Math.max(stat("ninjutsu"),stat("taijutsu"))*.55+stat("chakraControl")*.25+stat("intelligence")*.15+stat("discipline")*.1;
  var prep=0;
  var roll=relevant*.9+teamScore*3+senseiBonus+stat("luck")*2+ri(-18,18)-risk*40;
  var reward={D:ri(50,120),C:ri(200,450),B:ri(600,1200),A:ri(2000,4500),S:ri(8000,20000)}[rank];
  var out={rank:rank,desc:desc};
  G.fatigue+=2;
  if(roll>=60){
    addRyo(reward);addRep(rank==="D"?1:rank==="C"?3:rank==="B"?6:rank==="A"?10:16);
    G.missionCount++;if(rank==="S")G.missionsS++;
    if(chance(.15)){G.feats.push("Perfect "+rank+"-rank: "+desc);timeline("Flawless "+rank+"-rank mission: "+desc+".","rare")}
    out.result="clean";out.txt=desc+". Executed exactly as planned. The client signs, the village logs it, and "+money(reward)+" lands in your pouch."+((rank==="A"||rank==="S")?" Your name travels further than you do.":"");
  } else if(roll>=35){
    addRyo(Math.round(reward*.7));addRep(rank==="D"?1:2);G.missionCount++;
    out.result="messy";out.txt=desc+". You get it done, but not clean: "+pick(["a civilian saw too much and needed handling","your team took a detour through a hornet's nest","the target moved and you improvised","half the plan fell apart at the river"])+". Paid "+money(Math.round(reward*.7))+".";
  } else if(roll>=18){
    addRyo(Math.round(reward*.3));G.missionCount++;G.missionsFailed++;
    out.result="partial";out.txt=desc+". Partial success at best: "+pick(["the objective survived","you recovered half the cargo","two of three targets","the client got away from you"])+". Pay slashed to "+money(Math.round(reward*.3))+".";
  } else {
    G.missionsFailed++;addRep(rank==="D"?-1:rank==="C"?-2:-5);
    if(chance(risk)){
      var dmg=ri(10,30)+risk*30;bump("health",-Math.round(dmg));
      out.result="wounded";out.txt=desc+". It goes wrong badly: you come home with "+pick(INJURIES)+". No pay. "+(stat("health")<=0?"":"Recovery will take time.");
      if(stat("health")<=0){G.deathCause="wounds from a failed "+rank+"-rank mission";return die()}
    } else {
      out.result="failed";out.txt=desc+". Failed outright: "+pick(["the trail went cold","an ambush scattered the squad","the client lied about everything","you were outplayed"])+". No pay, and the report stings.";
    }
  }
  timeline((G.rogue?"Job":"Mission")+" ("+rank+"-rank): "+out.txt, out.result==="clean"?"good":out.result==="wounded"?"bad":out.result==="failed"?"bad":"");
  log(out.txt,out.result==="clean"?"good":out.result==="wounded"?"bad":out.result==="failed"?"bad":"");
  return out;
}

/* ============================ rogue handling ============================ */
function redeemRogue(){
  G.rogue=null;G.wanted=0;G.rank="Genin";G.occupation="Genin under supervision";
  addRep(-5);bump("happiness",5);timeline("Surrendered to the village and accepted judgment.","big");
  log("You turned yourself in. The council levies a fine, a year of supervised service, and a mark on your record. You're home.","big");
  G.ryō=Math.max(0,G.ryō-500);
}

/* ============================ save system ============================ */
function saveObj(){return {v:1,ts:Date.now(),G:G}}
function slotKey(n){return SAVE_KEY+"_slot_"+n}
function writeSlot(n){
  try{
    if(!G)return false;
    localStorage.setItem(slotKey(n),JSON.stringify(saveObj()));
    return true;
  }catch(e){toast("Save failed: storage unavailable");return false}
}
function readSlot(n){
  try{var raw=localStorage.getItem(slotKey(n));if(!raw)return null;var o=JSON.parse(raw);
    if(!o||!o.G)return null;
    if(o.v!==1){o=migrate(o)}
    return o;
  }catch(e){return null}
}
function migrate(o){
  /* future migrations go here; v1 is current */
  o.v=1;return o;
}
function autosave(){if(G)writeSlot(SLOT)}
function deleteSlot(n){try{localStorage.removeItem(slotKey(n))}catch(e){}}
function anySave(){for(var i=1;i<=6;i++){if(readSlot(i))return i}return 0}

/* ============================ rendering ============================ */
var STAT_META=[
  ["health","Health",""],["chakra","Chakra",""],["happiness","Happiness",""],
  ["intelligence","Intelligence","sky"],["strength","Strength",""],["agility","Agility","sky"],
  ["chakraControl","Chakra Control","gold"],["ninjutsu","Ninjutsu",""],["taijutsu","Taijutsu",""],["genjutsu","Genjutsu",""],["discipline","Discipline","gold"],["reputation","Reputation","gold"]
];
function showScreen(id){document.querySelectorAll(".screen").forEach(function(s){s.classList.remove("on")});$(id).classList.add("on")}
function renderProfile(){
  var s=G.stats,v=VILLAGES[G.village];
  var html='<div class="avatar">'+G.first.charAt(0)+'</div>'+
    '<div class="pname serif">'+esc(fullName())+'</div>'+
    '<div class="pline">'+v.name+' &middot; '+(G.clan==="Civilian"||!G.clan?"no clan":G.clan+" clan")+' &middot; age '+G.age+'</div>'+
    '<div class="prank">'+esc(G.rank)+' &middot; '+esc(G.occupation)+'</div>'+
    '<div class="statlist">';
  STAT_META.forEach(function(m){
    var val=clamp(Math.round(s[m[0]]||0),0,100);
    if(G.age<6&&["ninjutsu","genjutsu","chakraControl","reputation"].indexOf(m[0])>=0&&val===0)return;
    html+='<div class="stat"><div class="srow"><b>'+m[1]+'</b><span>'+val+'</span></div><div class="bar '+m[2]+'"><i style="width:'+val+'%"></i></div></div>';
  });
  html+='</div><div class="famline">'+esc(G.eraName)+'<br>'+
    (G.flags.married&&G.romance?"Married to "+esc(G.romance.name)+". ":"")+
    (G.children.length?G.children.length+" child"+(G.children.length>1?"ren":"")+". ":"")+
    (G.rogue?"WANTED · bounty "+money(G.wanted*2500):"Loyal record")+'</div>';
  $("profilePanel").innerHTML=html;
  $("ryo").textContent="🪙 "+G.ryō.toLocaleString("en-US")+" ryō";
  var sp=$("squadPanel");
  if(G.team||G.senseiName){
    sp.hidden=false;
    var rows="";
    if(G.senseiName){var sr=relOf(G.senseiName);rows+=row(G.senseiName,"Sensei · "+(sr&&sr.alive?"Jonin":"deceased"),sr?sr.rel:0,false)}
    if(G.team)G.team.forEach(function(m){var r=relOf(m.name);rows+=row(m.name,"Teammate · "+(r&&r.alive?"Genin":"gone"),r?r.rel:0,false)});
    sp.innerHTML='<div class="tag" style="margin-bottom:8px">Squad</div>'+rows;
  } else sp.hidden=true;
  function row(n,sub,rel,love){
    return '<div class="list-row"><div class="who"><b>'+esc(n)+'</b><span>'+esc(sub)+'</span></div>'+
      '<div class="relbar '+(love?"love":"")+'"><i style="width:'+clamp(rel,0,100)+'%"></i></div></div>';
  }
}
function renderActions(){
  var A=$("actions");A.innerHTML="";
  var mk=function(id,t,d,fn,primary){var b=el("button","act"+(primary?" primary":""));
    b.innerHTML="<b>"+t+"</b>"+(d?"<span>"+d+"</span>":"");
    b.onclick=function(){fn()};A.appendChild(b)};
  if(G.actionsLeft>0)mk(null,"AGE UP","Advance one year ("+G.actionsLeft+" action"+(G.actionsLeft>1?"s":"")+" left this year) — press after your activities",function(){ageUp()},true);
  else mk(null,"AGE UP","No actions left this year — move time forward",function(){ageUp()},true);
  ACTIVITY_LIST().forEach(function(a){
    if(G.actionsLeft<=0)return;
    mk(a.id,a.t,a.d,function(){doActivity(a)});
  });
  mk(null,"Relationships","People in your life",openRelationships);
  mk(null,"Career & Missions","Rank, missions, progression",openCareer);
  mk(null,"Timeline","Your life so far",openTimeline);
  mk(null,"Menu","Saves and settings",openMenu);
}
function doActivity(a){
  var r=a.f();
  log(r,"");
  if(a.id!=="rest"&&a.id!=="play")bump("happiness",-1);
  autosave();render();
  toast(r.length>90?r.slice(0,88)+"…":r);
}
function renderFeed(){
  var b=$("feedBody");b.innerHTML="";
  G.feed.slice(0,60).forEach(function(f){
    var d=el("div","fentry "+(f.k||""));
    d.innerHTML='<span class="fage">age '+f.a+'</span>'+esc(f.t);
    b.appendChild(d);
  });
  if(!G.feed.length)b.innerHTML='<div class="fentry">Your story starts now.</div>';
}
function render(){renderProfile();renderActions();renderFeed()}

/* ============================ modals ============================ */
function modal(html){$("mcard").innerHTML=html;$("modal").classList.add("on")}
function closeModal(){$("modal").classList.remove("on")}
var EVQ=[];
function presentEvent(body){
  if($("modal").classList.contains("on")){EVQ.push(body);return}
  _showEvent(body);
}
function _nextEvent(){
  var b=EVQ.shift();
  if(b)_showEvent(b);else{closeModal();render();autosave()}
}
function _showEvent(body){
  var html='<div class="mk">'+G.eraName+' · age '+G.age+'</div><h3 class="serif">'+esc(body.t)+'</h3><div class="mtext">'+esc(body.x)+'</div><div class="mchoices"></div>';
  modal(html);
  var box=$("mcard").querySelector(".mchoices");
  body.c.forEach(function(ch){
    var b=el("button","mchoice");
    b.innerHTML="<b>"+esc(ch.t)+"</b>"+(ch.sub?"<small>"+esc(ch.sub)+"</small>":"");
    b.onclick=function(){
      var res=ch.f();
      if(res==="DEATH"){G.deathCause="a choice you could not take back";closeModal();return die()}
      if(res==="REDEEM"){closeModal();redeemRogue();render();return}
      box.innerHTML='<div class="mresult">'+esc(res)+'</div>';
      var c=el("button","btn mclose","Continue");
      c.onclick=function(){_nextEvent()};
      box.appendChild(c);
    };
    box.appendChild(b);
  });
}
function openRelationships(){
  var rows=G.rel.filter(function(r){return r.alive}).map(function(r){
    return '<div class="list-row"><div class="who"><b>'+esc(r.name)+'</b><span>'+esc(r.relation)+' · age '+(r.age||G.age)+' · '+esc(r.personality||"")+'</span></div>'+
      '<div class="relbar'+(r.tier==="love"?" love":"")+'"><i style="width:'+clamp(r.rel||0,0,100)+'%"></i></div>'+
      '<div class="list-acts"><button class="btn small ghost" data-a="talk" data-n="'+esc(r.name)+'">Talk</button><button class="btn small ghost" data-a="gift" data-n="'+esc(r.name)+'">Gift</button></div></div>';
  }).join("");
  var html='<div class="mk">Relationships</div><h3 class="serif">People in your life</h3>'+(rows||'<div class="mtext">No one yet. Life is long.</div>')+'<div class="mchoices" id="relacts"></div>';
  modal(html);
  $("mcard").querySelectorAll("[data-a]").forEach(function(b){
    b.onclick=function(){
      var r=relOf(b.dataset.n);if(!r)return;
      if(b.dataset.a==="talk"){var s=ri(3,9);r.rel+=s;bump("happiness",2);
        toast("You and "+r.name.split(" ")[0]+" talked for hours. +"+s);}
      else{var c=Math.min(G.ryō,50);if(c<10){toast("Not enough ryō for a gift.");return}
        G.ryō-=c;r.rel+=ri(4,10);toast("Gift given to "+r.name.split(" ")[0]+".");}
      autosave();openRelationships();render();
    };
  });
}
function openCareer(){
  var html='<div class="mk">Career</div><h3 class="serif">Duty roster</h3>'+
    '<div class="mtext">Rank: <b>'+esc(G.rank)+'</b> · Missions: <b>'+Math.floor(G.missionCount)+'</b> · Reputation: <b>'+Math.round(stat("reputation"))+'</b><br>'+
    (G.rogue?"You are a missing-nin. Jobs are darker and buyers less honest.":"Available mission ranks: "+availableRanks().join(", ")+"-rank.")+'</div><div class="mchoices" id="miss"></div>';
  modal(html);
  var box=$("mcard").querySelector("#miss");
  availableRanks().forEach(function(rk){
    var b=el("button","mchoice");
    b.innerHTML="<b>"+rk+"-Rank Mission</b><small>"+pick(MISSION_TYPES[rk])+"</small>";
    b.onclick=function(){
      var out=runMission(rk);
      box.innerHTML='<div class="mresult">'+esc(out.txt)+'</div>';
      var c=el("button","btn mclose","Continue");c.onclick=function(){closeModal();render();autosave()};box.appendChild(c);
    };
    box.appendChild(b);
  });
  if(G.rank==="Chunin"&&!G.flags.joninDone&&G.missionCount>=20&&G.age>=17){
    var jb=el("button","mchoice","<b>Apply for Jonin</b><small>Requires sustained excellence. The review board is merciless.</small>");
    jb.onclick=function(){
      var s=stat("reputation")*.5+G.missionCount*1.2+stat("discipline")*.3+stat("ninjutsu")*.2+stat("taijutsu")*.2;
      if(s>=75&&chance(.6)){promoteJonin();box.innerHTML='<div class="mresult">The board votes yes. Jonin. Your own squad assignments await.</div>'}
      else{G.flags.joninDone=false;bump("happiness",-3);box.innerHTML='<div class="mresult">The board declines: "solid, not yet exceptional." Come back with more."</div>'}
      var c=el("button","btn mclose","Continue");c.onclick=function(){closeModal();render();autosave()};box.appendChild(c);
    };
    box.appendChild(jb);
  }
}
function openTimeline(){
  var rows=G.timeline.map(function(t){return '<div class="fentry '+(t.k||"")+'"><span class="fage">age '+t.a+'</span>'+esc(t.t)+'</div>'}).join("");
  modal('<div class="mk">Timeline</div><h3 class="serif">The life so far</h3>'+(rows||'<div class="mtext">It begins.</div>')+'<button class="btn mclose" onclick="void 0">Close</button>');
  $("mcard").querySelector(".mclose").onclick=closeModal;
}
function openMenu(){
  var html='<div class="mk">Menu</div><h3 class="serif">Saves &amp; settings</h3><div class="mchoices" id="slots"></div>';
  modal(html);
  var box=$("mcard").querySelector("#slots");
  for(var i=1;i<=6;i++){
    (function(i){
      var sv=readSlot(i);
      var b=el("button","mchoice");
      b.innerHTML="<b>Slot "+i+"</b><small>"+(sv?esc(sv.G.first+" "+sv.G.last+" · age "+sv.G.age+" · "+sv.G.rank):"empty")+"</small>";
      b.onclick=function(){
        var sub=el("div","mchoices");
        [["Save here",function(){if(G){SLOT=i;writeSlot(i);toast("Saved to slot "+i);openMenu()}}],
         ["Load",function(){var o=readSlot(i);if(!o){toast("Empty slot");return}G=o.G;closeModal();showScreen("screen-game");render();}],
         ["Delete",function(){deleteSlot(i);toast("Slot "+i+" cleared");openMenu()}],
         ["Back",function(){openMenu()}]].forEach(function(x){
          var s=el("button","mchoice","<b>"+x[0]+"</b>");s.onclick=x[1];sub.appendChild(s);
        });
        box.innerHTML="";box.appendChild(sub);
      };
      box.appendChild(b);
    })(i);
  }
  var q=el("button","mchoice","<b>Quit to title</b><small>Your life autosaves</small>");
  q.onclick=function(){if(G)autosave();closeModal();showScreen("screen-title");refreshTitle()};
  box.appendChild(q);
}

/* ============================ death screen ============================ */
function showDeath(s){
  showScreen("screen-death");
  var html='<div class="tag">The life concludes</div><h2 class="serif">'+esc(fullName())+'</h2>'+
    '<div class="dgrade">'+s.grade+'</div>'+
    '<div class="mtext">Died at age '+G.age+' of '+esc(s.cause)+'.</div>'+
    '<div class="dsum">'+
    '<div><b>Rank achieved:</b> '+esc(G.rank)+'</div>'+
    '<div><b>Missions:</b> '+Math.floor(G.missionCount)+(G.missionsS?' · '+G.missionsS+' S-rank':'')+'</div>'+
    '<div><b>Feats:</b> '+(G.feats.length?G.feats.map(esc).join(" · "):"none recorded")+'</div>'+
    '<div><b>Family:</b> '+(G.flags.married&&G.romance?esc(G.romance.name):"never married")+(G.children.length?', '+G.children.length+' child'+(G.children.length>1?"ren":""):'')+'</div>'+
    '<div><b>Wealth:</b> '+money(G.ryō)+'</div>'+
    '</div><div class="dbio">'+esc(s.bio)+'</div>'+
    '<button class="btn" id="btn-again" style="margin-top:20px">Live Another Life</button>';
  $("deathCard").innerHTML=html;
  $("btn-again").onclick=function(){G=null;showScreen("screen-title");refreshTitle()};
}

/* ============================ creator & title ============================ */
function fillCreator(){
  var eraSel=$("c-era");eraSel.innerHTML='<option value="r">Random era</option>';
  ERAS.forEach(function(e){var o=el("option");o.value=e.id;o.textContent=e.name;eraSel.appendChild(o)});
  var vilSel=$("c-village");vilSel.innerHTML='<option value="r">Random village</option>';
  Object.keys(VILLAGES).forEach(function(k){var o=el("option");o.value=k;o.textContent=VILLAGES[k].name;vilSel.appendChild(o)});
  var clanSel=$("c-clan");clanSel.innerHTML='<option value="r">Random (weighted)</option><option value="Civilian">Civilian family</option>';
  CLANS.forEach(function(c){var o=el("option");o.value=c.n;o.textContent=c.n+" ("+(c.t===1?"legendary":c.t===2?"major":"minor")+")";clanSel.appendChild(o)});
}
function rerollCreator(){
  var female=chance(.5);
  $("c-first").value=pick(female?NAMES_F:NAMES_M);
  $("c-last").value=pick(SURNAMES);
  $("c-gender").value=female?"f":"m";
  $("c-era").value=pick(ERAS).id;
  $("c-village").value=pick(Object.keys(VILLAGES));
  var cp=clanPool($("c-village").value);
  var cn=weighted(cp);
  $("c-clan").value=cn==="Civilian"?"Civilian":cn;
}
function refreshTitle(){
  var has=anySave();
  $("btn-continue").disabled=!has;
  $("btn-continue").textContent=has?"Continue":"Continue (no saves)";
}

/* ============================ init ============================ */
function startLife(){
  var first=$("c-first").value.trim()||undefined;
  var last=$("c-last").value.trim()||undefined;
  generateLife({first:first,last:last,gender:$("c-gender").value,era:$("c-era").value,village:$("c-village").value,clan:$("c-clan").value});
  SLOT=firstFreeSlot();
  if(!SLOT){toast("All six slots are full. Your life is running unsaved; save over a slot from the in-game menu.")}
  else writeSlot(SLOT);
  showScreen("screen-game");render();
}
function firstFreeSlot(){for(var i=1;i<=6;i++){if(!readSlot(i))return i}return 0}
function init(){
  fillCreator();
  refreshTitle();
  $("btn-new").onclick=function(){showScreen("screen-creator")};
  $("btn-continue").onclick=function(){
    var best=null,bi=0;
    for(var i=1;i<=6;i++){var o=readSlot(i);if(o&&(!best||o.ts>best.ts)){best=o;bi=i}}
    if(!best)return;
    SLOT=bi;G=best.G;showScreen("screen-game");render();
  };
  $("btn-saves").onclick=openMenu;
  $("btn-reroll").onclick=rerollCreator;
  $("btn-begin").onclick=startLife;
  document.querySelectorAll(".dice").forEach(function(b){
    b.onclick=function(){
      var female=$("c-gender").value==="f";
      if(b.dataset.r==="first")$("c-first").value=pick(female?NAMES_F:NAMES_M);
      else $("c-last").value=pick(SURNAMES);
    };
  });
  $("modal").addEventListener("click",function(e){if(e.target===$("modal")&&!PENDING)closeModal()});
  window.addEventListener("beforeunload",function(){if(G)autosave()});
}
init();
})();
