/* ================================================================
   FATE v1 — Village Passives & Handicap System (3.1.0)
   Loads after game.js and life.js. Expansion only: every hook wraps
   an existing global. Old saves migrate (no handicap = none).
   ================================================================ */
(function(){
"use strict";
if(window.FATE)return;
if(typeof addStat!=="function"||typeof VILLAGES!=="object")return;

/* ---- village passives ---- */
var VPASS={
 konoha:{t:"Balanced",d:"+10% learning speed · +5% chakra control growth · +5% friendship development · more teamwork events",team:true,learn:1.10},
 suna:{t:"Survival",d:"+10% survival in dangerous moments · +10% Wind affinity discovery · better outcomes in harsh places",survive:1.10},
 kiri:{t:"Combat",d:"+10% combat growth · +10% Water affinity discovery · +5% mission stealth edge",combat:1.10,mission:2},
 kumo:{t:"Physical",d:"+10% speed growth · +10% taijutsu development · +5% stamina",phys:true},
 iwa:{t:"Resilience",d:"+10% defense growth · +10% endurance · 5% less stat loss from failure",loss:0.95},
 ame:{t:"Adaptability",d:"+10% intelligence growth · stronger missions in bad conditions · more rare encounters",mission:8,rare:true},
 oto:{t:"Experimental",d:"+10% jutsu development · +5% chance of unusual abilities · faster research paths",jutsu:1.10,odd:0.03}
};
var HC=[
 {id:"fragile",n:"Fragile Constitution",ic:"🩹",r:"common",d:"Your body heals slowly and tires fast. Endurance grows slower, healing takes longer. Medical, precision and technical paths open wider.",pen:{endurance:-14,strength:-4}},
 {id:"slow",n:"Slow Learner",ic:"🐢",r:"common",d:"Techniques take longer to stick: all learning is 15% slower. Discipline grows at full speed, and patient, disciplined paths open wider.",pen:{intelligence:-8}},
 {id:"low_chakra",n:"Low Chakra Reserves",ic:"🕯️",r:"common",d:"Your chakra pool runs shallow: chakra growth is slower. Efficiency and control paths open wider.",pen:{chakra:-22}},
 {id:"one_eyed",n:"One-Eyed",ic:"👁️",r:"uncommon",d:"You see the world through one eye. Perception grows slower and some ranged work is harder, until you build your own way of seeing.",pen:{perception:-16}},
 {id:"suppress",n:"Chakra Suppression",ic:"⛓️",r:"uncommon",d:"Something sealed at birth keeps your chakra from answering. Jutsu and chakra growth start heavily restricted. A mystery waits for anyone who investigates.",pen:{}},
 {id:"missing_arm",n:"Missing Arm",ic:"🦾",r:"rare",d:"You were born with one arm. Two-handed styles and heavy weapons are restricted; fighting and strength grow slower. Adaptation and perception open wider.",pen:{strength:-16,kenjutsu:-10}},
 {id:"mobility",n:"Mobility Impairment",ic:"🦯",r:"rare",d:"Your legs never fully answered. Speed and endurance grow slower and running drills are modified. Chakra movement and adaptation storylines open wider.",pen:{speed:-18,endurance:-8}},
 {id:"blind",n:"Born Blind",ic:"🌑",r:"legendary",d:"You have never seen. Vision-based work is limited; perception grows very slowly at first. A unique sensory path and rare storylines open for those who walk it.",pen:{perception:-30,chakraControl:4}}
];
var HCW={common:10,uncommon:5,rare:2.2,legendary:0.7};
var RCOL={common:"#8a8f98",uncommon:"#3fb3a8",rare:"#d4555f",legendary:"#d3a94c"};
function byId(id){for(var i=0;i<HC.length;i++)if(HC[i].id===id)return HC[i];return null}
function pid(){return (G&&G.vpassive&&G.vpassive.id)||G.village||null}
function hcid(){return (G&&G.handicap&&G.handicap.id)||null}
function adapt(){return (G&&G.handicap&&G.handicap.adap)||0}

/* ---- gameplay hooks ---- */
function gainMult(k){
  var m=1,p=pid();
  if(p==="konoha"){if(k==="chakraControl")m*=1.05}
  else if(p==="kumo"){if(k==="speed"||k==="taijutsu")m*=1.10;else if(k==="endurance")m*=1.05}
  else if(p==="kiri"){if(k==="taijutsu")m*=1.10}
  else if(p==="iwa"){if(k==="endurance")m*=1.10;else if(k==="strength")m*=1.05}
  else if(p==="ame"){if(k==="intelligence")m*=1.10}
  else if(p==="oto"){if(k==="ninjutsu")m*=1.10;else if(k==="genjutsu")m*=1.05}
  var h=G&&G.handicap;if(h){
    var a=adapt();
    if(h.id==="missing_arm"){if(k==="kenjutsu")m*=a>=50?0.7:0.5;else if(k==="strength"||k==="taijutsu")m*=a>=50?0.85:0.6;else if(k==="perception")m*=1.05}
    else if(h.id==="mobility"){if(k==="speed")m*=a>=50?0.8:0.6;else if(k==="endurance")m*=0.85;else if(k==="chakraControl")m*=1.05}
    else if(h.id==="one_eyed"){if(k==="perception")m*=a>=40?1.10:0.7;else if(k==="discipline")m*=1.05}
    else if(h.id==="blind"){if(k==="perception")m*=a>=25?1.25:0.4;else if(k==="chakraControl")m*=1.10}
    else if(h.id==="fragile"){if(k==="endurance")m*=0.85;else if(k==="intelligence")m*=1.05}
    else if(h.id==="low_chakra"){if(k==="chakra")m*=0.85;else if(k==="chakraControl")m*=1.10}
    else if(h.id==="suppress"){if(a<25&&(k==="chakra"||k==="ninjutsu"))m*=0.6;else if(a>=75&&(k==="chakra"||k==="ninjutsu"))m*=1.15}
    else if(h.id==="slow"){if(k!=="discipline")m*=0.85}
  }
  return m;
}
var _as=addStat;
window.addStat=function(k,v){
  if(!G||!G.stats){return _as(k,v)}
  if(v>0){var m=gainMult(k);if(m!==1)v=Math.max(1,Math.round(v*m))}
  else if(v<0){
    var p=pid();
    if(p==="iwa")v=Math.round(v*0.95);
    if(G.handicap&&G.handicap.id==="missing_arm"&&(k==="strength"||k==="kenjutsu"))v=Math.round(v*0.95);
  }
  if(v>0&&k==="health"&&G.handicap&&G.handicap.id==="fragile")v=Math.max(1,Math.round(v*0.8));
  return _as(k,v);
};
var _tg=trainGain;
window.trainGain=function(k,base){
  var lm=1,p=pid();
  if(p==="konoha")lm*=1.10;
  if(G&&G.handicap&&G.handicap.id==="slow")lm*=0.85;
  return _tg(k,base*lm);
};
var _die=dieOf;
window.dieOf=function(cause){
  if(G&&G.alive&&pid()==="suna"&&!/old age|illness|sickness|age/i.test(cause)&&G.fateSaved!==G.age&&chance(0.10)){
    G.fateSaved=G.age;
    fbig("Survival instincts forged in the desert hold. You refuse to fall here.","rare");
    tl(G.age,"Survived "+cause+" by a thread the desert would not let break.");
    return;
  }
  return _die(cause);
};
var _tnd=tryNatureDiscover;
window.tryNatureDiscover=function(){
  var r=_tnd();
  if(r)return true;
  var p=pid();
  var boost=0;
  if(p==="suna"&&G.nature&&/wind/i.test(String(G.nature)))boost=0.10;
  else if(p==="kiri"&&G.nature&&/water/i.test(String(G.nature)))boost=0.10;
  if(boost&&G.age>=7&&!G.natureKnown&&chance(boost)){
    G.natureKnown=true;
    fbig("Chakra nature discovered: "+G.nature+". Your affinity runs in the blood of your village, and the paper proves it.","rare");
    tl(G.age,"Discovered "+G.nature+" release.");
    return true;
  }
  return false;
};
var _tka=tryKGAwake;
window.tryKGAwake=function(){
  var r=_tka();
  if(r||pid()!=="oto"||!G.kkg||G.kkgKnown)return r;
  if(chance(0.03)){
    var kg=KKG[G.kkg];
    if(kg&&G.age>=kg.minAge){
      G.kkgKnown=true;
      for(var k in kg.boost)addStat(k,kg.boost[k]);
      fbig("Something unusual answers in your chakra — "+G.kkg+" awakens, and the Sound researchers take notes.","rare");
      tl(G.age,"Awakened the "+G.kkg+" kekkei genkai.");
      return true;
    }
  }
  return r;
};
var _ru=relUp;
window.relUp=function(n,v){
  if(n&&v>0&&pid()==="konoha")v=Math.round(v*1.05);
  return _ru(n,v);
};
window.FATE_missionSelf=function(rank){
  var s=0,p=pid(),h=G&&G.handicap;
  if(p==="kiri")s+=2;
  if(p==="ame"){var era=ERAS.find(function(e){return e.id===G.eraId});if(era&&era.war>0.05)s+=8}
  if(h){var a=adapt();
    if(h.id==="missing_arm")s+=(a>=50?-2:-4);
    else if(h.id==="mobility")s+=(a>=50?-2:-4);
    else if(h.id==="blind")s+=(a>=50?-3:-6);
    else if(h.id==="one_eyed")s+=(a>=40?-1:-2);
    else if(h.id==="fragile")s+=(a>=50?0:-2);
    else if(h.id==="suppress")s+=(a>=50?2:-2);
    else if(h.id==="low_chakra")s+=(a>=50?1:-1);
  }
  return s;
};

/* ---- handicap state helpers ---- */
function fAdapt(n){
  if(!G||!G.handicap)return;
  var before=G.handicap.adap||0;
  G.handicap.adap=Math.min(100,before+n);
  var after=G.handicap.adap;
  [[25,"You are learning to live around it."],[50,"Adaptation milestone: your own way works."],[75,"You have turned this disadvantage into a craft."],[100,"Fully adapted. What was a limitation is now a discipline."]].forEach(function(m){
    if(before<m[0]&&after>=m[0]){fbig("Adaptation "+m[0]+"% — "+m[1],"rare");tl(G.age,"Adaptation reached "+m[0]+"% of "+(byId(G.handicap.id)||{}).n+".")}
  });
}

/* ---- FATE event templates (run through the life scene engine) ---- */
function relAlive(kind){return (G.relationships||[]).filter(function(n){return n.alive&&(!kind||n.kind===kind)})}
function relAny(){return (G.relationships||[]).filter(function(n){return n.alive})}
(function addTPL(){
 if(!window.LIFE||!LIFE.TPL)return;
 var T=window.LIFE.TPL;
 function P(o){T.push(o)}

/* fragile */
P({id:"fate_fragile_1",cat:"Handicap",rar:"common",w:8,gate:function(){return hcid()==="fragile"&&G.age>=5},
 build:function(){var n=pick(relAlive().length?relAlive():[null])||null;
  return{t:"The Long Recovery",cat:"Handicap",loc:"Clinic",art:"🩹",
   lines:["A hard season ends in the clinic bed. The healer says what they always say: a body like yours needs more rest than most."],
   choices:[
    {t:"Read everything in the clinic",res:["The healer's shelves become your library. You learn more about bodies than most students learn about jutsu."],fn:function(){FX.add("intelligence",4);fAdapt(10);FX.tr("disciplined",4)}},
    {t:"Watch the medics work",res:["You memorize their hands. Something about steady work on fragile frames starts to feel like a calling."],fn:function(){fAdapt(10);FX.tr("calm",4);FX.add("intelligence",2)}},
    {t:"Hate the bed quietly",res:["The walls are the enemy. You decide, lying still, that patience is a skill too."],fn:function(){FX.add("happiness",-2);FX.tr("willful",3);fAdapt(6)}}
   ]}}});
P({id:"fate_fragile_2",cat:"Handicap",rar:"uncommon",w:6,gate:function(){return hcid()==="fragile"&&G.age>=10&&(G.handicap.adap||0)<60},
 build:function(){return{t:"Building Slowly",cat:"Handicap",loc:"Training Grounds",art:"🩹",
   lines:["You cannot train like the others. So you build a plan of your own: small loads, perfect rest, no wasted motion."],
   choices:[
    {t:"Train the body in small measures",res:["Slowly, the body answers. Not much. But it answers."],fn:function(){FX.add("endurance",3);fAdapt(14);FX.add("health",2)}},
    {t:"Train the mind instead",res:["While others spar, you study. Your precision becomes the thing people notice."],fn:function(){FX.add("intelligence",3);fAdapt(10)}},
    {t:"Study field medicine",res:["A clinic elder takes an interest. A fragile frame that knows medicine is not a weak frame at all."],fn:function(){FX.add("intelligence",2);fAdapt(12);if(G.sensei&&G.sensei.alive)FX.rel(G.sensei,5)}}
   ]}}});

/* slow learner */
P({id:"fate_slow_1",cat:"Handicap",rar:"common",w:8,gate:function(){return hcid()==="slow"&&G.age>=6},
 build:function(){return{t:"Lessons That Won't Land",cat:"Handicap",loc:"Academy",art:"🐢",
   lines:["The class moves on. You are still on yesterday's page, mouthing the same three hand signs."],
   choices:[
    {t:"Stay after class, again",res:["The instructor finds you still practicing when the lamps go out. That earns a longer look than any exam score."],fn:function(){FX.add("discipline",4);fAdapt(10);if(G.academy&&G.academy.instructor)FX.rel(G.academy.instructor,6)}},
    {t:"Invent your own way in",res:["You build the lesson backward, from the answer to the steps. It takes twice as long and sticks twice as deep."],fn:function(){FX.add("intelligence",3);fAdapt(10);FX.tr("calm",3)}},
    {t:"Pretend you don't care",res:["The shrug fools nobody, least of all you."],fn:function(){FX.add("happiness",-2);fAdapt(4)}}
   ]}}});
P({id:"fate_slow_2",cat:"Handicap",rar:"rare",w:5,gate:function(){return hcid()==="slow"&&G.age>=12&&(G.handicap.adap||0)>=30},
 build:function(){return{t:"Your Own Pace",cat:"Handicap",loc:"Academy",art:"🐢",
   lines:["Years of extra hours land at once. A technique the class abandoned months ago finally blooms under your hands, complete and clean."],
   choices:[
    {t:"Let them see it",res:["The instructor stops mid-sentence. Some students learn slow and learn forever. You are becoming the second kind."],fn:function(){FX.add("discipline",4);FX.add("willpower",3);fAdapt(15);tl(G.age,"A slow-built technique finally bloomed, complete and clean.")}},
    {t:"Keep it quiet, keep working",res:["You file it away like a blade. It will be there when you need it."],fn:function(){FX.add("discipline",3);FX.tr("calm",4);fAdapt(12)}}
   ]}}});

/* low chakra */
P({id:"fate_lowch_1",cat:"Handicap",rar:"common",w:8,gate:function(){return hcid()==="low_chakra"&&G.age>=7},
 build:function(){return{t:"The Paper Barely Moves",cat:"Handicap",loc:"Academy",art:"🕯️",
   lines:["The chakra paper trembles in your hands and stays dry. Around you, papers ignite, soak, and split."],
   choices:[
    {t:"Stretch every drop",res:["If the well is shallow, you learn not to spill. Your control becomes the thing instructors point at."],fn:function(){FX.add("chakraControl",4);fAdapt(12);FX.tr("disciplined",3)}},
    {t:"Ask about efficiency",res:["The sensei leans in. 'Small reserves,' they say, 'are how the best water-users start.' The lesson runs long."],fn:function(){fAdapt(12);if(G.academy&&G.academy.instructor)FX.rel(G.academy.instructor,6);FX.add("chakraControl",2)}},
    {t:"Feel the gap",res:["You walk home slower than usual. The gap is real. So is the decision you make about it."],fn:function(){FX.add("happiness",-3);FX.tr("ambitious",4);fAdapt(6)}}
   ]}}});

/* one-eyed */
P({id:"fate_oneeyed_1",cat:"Handicap",rar:"uncommon",w:7,gate:function(){return hcid()==="one_eyed"&&G.age>=5},
 build:function(){return{t:"The Throwing Drill",cat:"Handicap",loc:"Training Grounds",art:"👁️",
   lines:["Every shuriken drifts left. Depth is a rumor to you. The other kids have stopped pretending not to watch."],
   choices:[
    {t:"Rebuild your stance from zero",res:["You move your whole body until the eye agrees with the arm. The drift shrinks. Your way, not theirs."],fn:function(){FX.add("chakraControl",2);fAdapt(12);FX.tr("disciplined",3)}},
    {t:"Wear the patch openly",res:["You tie the patch on like a banner. A few of the older students nod. One laughs. You note which."],fn:function(){fAdapt(10);FX.tr("brave",4);FX.add("happiness",1)}},
    {t:"Say nothing and keep missing",res:["The misses pile up. So does something harder to name."],fn:function(){FX.add("happiness",-2);FX.tr("willful",3);fAdapt(6)}}
   ]}}});

/* blind */
P({id:"fate_blind_1",cat:"Handicap",rar:"legendary",w:9,gate:function(){return hcid()==="blind"&&G.age>=4},
 build:function(){var n=relAlive().length?pick(relAlive()):null;
  return{t:"The World Through Sound",cat:"Handicap",loc:"Home",art:"🌑",
   lines:["You have never seen light. You know the house by its sounds: the third stair that creaks, the wind that means the market is open."+(n?" "+n.name.split(" ")[0]+"'s footsteps come to you from the doorway.":"")],
   choices:[
    {t:"Sit and listen to everything",res:["Layers of sound. You begin sorting them like other children sort colors."],fn:function(){FX.add("perception",3);fAdapt(14);FX.tr("calm",4)}},
    {t:"Rage at the dark",res:["The dark wins today. But rage is fuel, and you pocket some of it."],fn:function(){FX.add("happiness",-4);FX.tr("willful",5);fAdapt(8)}},
    {t:n?"Take their hand":"Take the offered hand",res:["You walk the garden together, and they describe everything. You memorize it better than they said it."],fn:function(){if(n){FX.rel(n,10);FX.mem(n,"they walked you through the garden, describing everything","befriended")}fAdapt(10)}}
   ]}}});
P({id:"fate_blind_2",cat:"Handicap",rar:"legendary",w:6,gate:function(){return hcid()==="blind"&&G.age>=10&&(G.handicap.adap||0)>=25&&!(G.flags&&G.flags.senseOpen)},
 build:function(){return{t:"Chakra Where Sight Would Be",cat:"Handicap",loc:"Training Grounds",art:"🌑",
   lines:["An old jonin watches you navigate the yard by sound and something in their face changes. 'You are already half a sensor,' they say. 'Nobody told you?'"],
   choices:[
    {t:"Learn to feel chakra instead of seeing",res:["Hours a day, you press your chakra outward like a hand in the dark. Walls. People. Rain. The world rebuilds itself in your mind, different but whole.",],fn:function(){G.flags=G.flags||{};G.flags.senseOpen=true;fAdapt(20);FX.add("perception",4);FX.add("chakraControl",3);tl(G.age,"Began true sensory training. A blind shinobi's path opened.")}},
    {t:"Ask what a blind shinobi can become",res:["The jonin talks until sunset: sensors, interrogators, trackers who never need light. A list of doors most people never see."],fn:function(){fAdapt(15);FX.add("intelligence",3);FX.tr("ambitious",4)}}
   ]}}});

/* missing arm */
P({id:"fate_missarm_1",cat:"Handicap",rar:"rare",w:8,gate:function(){return hcid()==="missing_arm"&&G.age>=6},
 build:function(){return{t:"The Empty Sleeve",cat:"Handicap",loc:"Village",art:"🦾",
   lines:["Children stare. Adults look away too carefully. Your sleeve hangs where an arm should have been, from birth, like a sentence nobody finished."],
   choices:[
    {t:"Meet their eyes",res:["You hold the stare until it breaks. Something in you sets like concrete."],fn:function(){FX.tr("brave",5);fAdapt(10);FX.add("willpower",2)}},
    {t:"Laugh first",res:["You make the joke before they can. It lands. For a moment you are just the funny kid."],fn:function(){FX.add("happiness",2);fAdapt(8);FX.tr("charming",3)}},
    {t:"Hide the sleeve all season",res:["Long sleeves in summer. The hiding costs more than the arm ever did."],fn:function(){FX.add("happiness",-3);fAdapt(5);FX.tr("shorttempered",3)}}
   ]}}});
P({id:"fate_missarm_2",cat:"Handicap",rar:"rare",w:6,gate:function(){return hcid()==="missing_arm"&&G.age>=10&&(G.handicap.adap||0)<50},
 build:function(){return{t:"One-Armed Forms",cat:"Handicap",loc:"Training Grounds",art:"🦾",
   lines:["The standard kata needs two hands. The standard kata does not know you."],
   choices:[
    {t:"Break every form and rebuild it",res:["Pain, repetition, invention. By winter your one-armed forms are on the wall for others to copy."],fn:function(){fAdapt(16);FX.add("strength",3);FX.add("health",-2);tl(G.age,"Your one-armed forms were posted for other students.")}},
    {t:"Find your own style with a jonin",res:["A retired jonin with the same old wound drills you at dawn. 'Adaptation is a jutsu,' they say. 'Most never learn it.'"],fn:function(){fAdapt(14);FX.add("taijutsu",3);if(G.sensei&&G.sensei.alive)FX.rel(G.sensei,5)}},
    {t:"Turn to precision work",res:["Wire, seals, one-handed signs done slowly and perfectly. The penmanship of a killer."],fn:function(){fAdapt(12);FX.add("chakraControl",3);FX.add("intelligence",2)}}
   ]}}});

/* mobility */
P({id:"fate_mobility_1",cat:"Handicap",rar:"rare",w:8,gate:function(){return hcid()==="mobility"&&G.age>=6},
 build:function(){return{t:"Race Day",cat:"Handicap",loc:"Academy",art:"🦯",
   lines:["The annual footrace. Your legs have never fully answered. The starting line is fifty feet of honest ground."],
   choices:[
    {t:"Race anyway",res:["You finish last to the loudest cheer of the day. Something about it rearranges you."],fn:function(){fAdapt(12);FX.tr("brave",5);FX.add("happiness",2)}},
    {t:"Ask to run the strategy instead",res:["You call the race from the map table, and your calls win it. The instructor says nothing, but writes something down."],fn:function(){fAdapt(10);FX.add("intelligence",3)}},
    {t:"Watch from the side",res:["You watch. You count what watching costs."],fn:function(){FX.add("happiness",-3);fAdapt(5);FX.tr("ambitious",3)}}
   ]}}});
P({id:"fate_mobility_2",cat:"Handicap",rar:"rare",w:6,gate:function(){return hcid()==="mobility"&&G.age>=9},
 build:function(){return{t:"Chakra to the Soles",cat:"Handicap",loc:"Training Grounds",art:"🦯",
   lines:["An elderly shinobi on a walking cane watches your drills. 'Legs are optional,' they say, and walks across the pond."],
   choices:[
    {t:"Learn the chakra walk",res:["Weeks of falling into water. Then one evening you do not fall. You walk a pond like a street."],fn:function(){fAdapt(18);FX.add("chakraControl",4);tl(G.age,"Learned to move by chakra where legs would not carry you.")}},
    {t:"Build the upper body instead",res:["Rope climbs, one-armed carries, an upper body like a winch. Nobody passes you on the wall anymore."],fn:function(){fAdapt(12);FX.add("strength",4)}}
   ]}}});

/* suppression */
P({id:"fate_suppress_1",cat:"Handicap",rar:"uncommon",w:8,gate:function(){return hcid()==="suppress"&&G.age>=8},
 build:function(){return{t:"The Chakra That Won't Answer",cat:"Handicap",loc:"Training Grounds",art:"⛓️",
   lines:["You reach for chakra the way everyone taught you. It does not come. Deep in your center, something turns over in its sleep and settles again. This is not weakness. This is a lock."],
   choices:[
    {t:"Pry at the seal",res:["You find the edges of it, a lattice of ink-deep chakra laid over you before memory. Someone did this on purpose. You stop, breathing hard. Now you know.",],fn:function(){G.flags=G.flags||{};G.flags.suppressAsked=true;fAdapt(10);FX.add("intelligence",2);tl(G.age,"Found the edges of a birth seal on your own chakra.")}},
    {t:"Tell your parents",res:["Your mother goes white. Your father leaves the room and comes back older. They know something. They will not say what. Yet."],fn:function(){G.flags=G.flags||{};G.flags.suppressAsked=true;var p=relAlive("father").concat(relAlive("mother"));if(p.length){FX.rel(p[0],6);FX.mem(p[0],"you told them about the seal on your chakra","befriended")}fAdapt(8)}},
    {t:"Live with it quietly",res:["You say nothing. The lock stays. So does your silence, which is its own kind of strength."],fn:function(){FX.tr("calm",5);FX.add("willpower",2);fAdapt(6)}}
   ]}}});
P({id:"fate_suppress_2",cat:"Handicap",rar:"rare",w:6,gate:function(){return hcid()==="suppress"&&G.age>=13&&G.flags&&G.flags.suppressAsked&&(G.handicap.adap||0)<75},
 build:function(){return{t:"What Was Sealed",cat:"Handicap",loc:"Village Archive",art:"⛓️",
   lines:["A record, a midwife's note, a name that was struck through. The seal was placed the night you were born, by someone who signed with a mark nobody recognizes anymore."],
   choices:[
    {t:"Push your chakra against the lattice",res:["It resists. Then, for one breath, it gives. Something enormous moves behind it and settles. The lock is not forever, and now it knows you are coming."],fn:function(){fAdapt(20);FX.add("chakra",3);tl(G.age,"For one breath, the seal on your chakra gave.")}},
    {t:"Hunt the signature instead",res:["Whoever wrote that mark was a master. You begin, quietly, to become someone who can read their work."],fn:function(){fAdapt(15);FX.add("intelligence",4);FX.tr("ambitious",4)}},
    {t:"Leave the seal be",res:["Some doors are locked for reasons. You decide to be strong enough first. You train like someone who knows what waits."],fn:function(){fAdapt(10);FX.add("willpower",3);FX.add("discipline",3)}}
   ]}}});

/* village + handicap synergies */
P({id:"syn_kumo_missarm",cat:"Handicap",rar:"rare",w:7,gate:function(){return G.village==="kumo"&&hcid()==="missing_arm"&&G.age>=8},
 build:function(){return{t:"One Arm, One Storm",cat:"Handicap",loc:"Kumogakure",art:"⚡",
   lines:["A Cloud trainer watches you fail a two-hand exercise, then throws the manual in the fire. 'The Cloud does not train the shape it wants. It trains the body it has. Yours.'"],
   choices:[
    {t:"Train the Cloud way",res:["Dawn to dusk, rebuilt around one arm. Your balance becomes a weapon and your footwork a rumor."],fn:function(){fAdapt(20);FX.add("taijutsu",4);FX.add("speed",2);tl(G.age,"Cloud trainers rebuilt your style around one arm.")}},
    {t:"Prove the manual right first",res:["You master the standard forms one-handed before touching theirs. When you finally switch, you do it as an equal."],fn:function(){fAdapt(15);FX.add("willpower",3);FX.add("strength",2)}}
   ]}}});
P({id:"syn_iwa_fragile",cat:"Handicap",rar:"uncommon",w:7,gate:function(){return G.village==="iwa"&&hcid()==="fragile"&&G.age>=8},
 build:function(){return{t:"Stone Hearth",cat:"Handicap",loc:"Iwagakure",art:"⛰️",
   lines:["Stone medics put you on a regimen older than the village wall: heavy food, slow lifts, mountain air, patience. 'Stone is not hard,' the elder says. 'Stone is patient.'"],
   choices:[
    {t:"Follow the regimen to the letter",res:["A year of it. The fragile frame steadies into something the mountain would recognize as its own."],fn:function(){fAdapt(18);FX.add("endurance",4);FX.add("health",4)}},
    {t:"Learn the medicine as you heal",res:["You turn your own recovery into coursework. Two medics start calling you 'the resident'."],fn:function(){fAdapt(14);FX.add("intelligence",4);FX.add("health",2)}}
   ]}}});
P({id:"syn_kiri_oneeyed",cat:"Handicap",rar:"uncommon",w:7,gate:function(){return G.village==="kiri"&&hcid()==="one_eyed"&&G.age>=8},
 build:function(){return{t:"Mist Reader",cat:"Handicap",loc:"Kirigakure",art:"🌫️",
   lines:["In the Mist, everyone is half-blind. The difference is that you have trained for it since birth. A hunter-nin notices, and takes you into the fog for a week."],
   choices:[
    {t:"Learn to hunt by sound in fog",res:["You come back able to name a man's rank by his breathing. The hunter-nin says one word: 'Again.'"],fn:function(){fAdapt(20);FX.add("perception",4);tl(G.age,"Trained a week in fog with the hunter-nin. You hear ranks now.")}},
    {t:"Turn the missing eye into an edge",res:["Depth was a crutch. You learn angles, timing, misdirection. Your strikes start landing from where eyes don't look."],fn:function(){fAdapt(15);FX.add("taijutsu",3);FX.add("intelligence",2)}}
   ]}}});
P({id:"syn_konoha_slow",cat:"Handicap",rar:"uncommon",w:7,gate:function(){return G.village==="konoha"&&hcid()==="slow"&&G.age>=6},
 build:function(){var t=(G.academy&&G.academy.instructor&&G.academy.instructor.alive)?G.academy.instructor:(G.sensei&&G.sensei.alive?G.sensei:null);
  return{t:"The Patient Student",cat:"Handicap",loc:"Konohagakure",art:"🍃",
   lines:["The Leaf keeps records of students who stay after class. Yours is getting thick. A senior jonin with time on their hands asks to see what all those hours add up to."+(t?" "+t.name.split(" ")[0]+" watches from the door.":"")],
   choices:[
    {t:"Show everything",res:["Slow, complete, unshakeable. The jonin closes your notebook like a verdict. 'The Leaf has enough geniuses. It never has enough of you.'"],fn:function(){fAdapt(18);FX.add("discipline",4);if(t){FX.rel(t,10);FX.mem(t,"they saw your years of quiet after-class work","befriended")}}},
    {t:"Ask them to teach you properly",res:["They agree on one condition: never skip the boring parts. You never do."],fn:function(){fAdapt(15);FX.add("intelligence",3);if(t)FX.rel(t,6)}}
   ]}}});
P({id:"syn_suna_mobility",cat:"Handicap",rar:"uncommon",w:7,gate:function(){return G.village==="suna"&&hcid()==="mobility"&&G.age>=7},
 build:function(){return{t:"Sand Walker",cat:"Handicap",loc:"Sunagakure",art:"🏜️",
   lines:["The desert does not care how you arrive, only that you survive it. A Sand scout who has crossed the sea of sand eleven times hands you a staff. 'The dunes make walkers of everyone. We just start earlier.'"],
   choices:[
    {t:"Cross the near dunes with them",res:["Heat, rhythm, the staff finding purchase. You learn the desert's pace, which is slower than running and faster than dying."],fn:function(){fAdapt(18);FX.add("endurance",4);tl(G.age,"Crossed the near dunes. The desert's pace is yours now.")}},
    {t:"Learn the sand's chakra instead",res:["The scout teaches you to feel the ground shift before it shifts. Your feet learn to trust chakra over muscle."],fn:function(){fAdapt(15);FX.add("chakraControl",3);FX.add("perception",2)}}
   ]}}});
P({id:"syn_ame_lowch",cat:"Handicap",rar:"uncommon",w:7,gate:function(){return G.village==="ame"&&hcid()==="low_chakra"&&G.age>=7},
 build:function(){return{t:"Rain Efficiency",cat:"Handicap",loc:"Amegakure",art:"🌧️",
   lines:["In the Rain, jutsu are currency and nobody wastes a coin. An instructor from the towers drills you in the art of the half-cost technique. 'Small reserves,' they say, 'win long wars.'"],
   choices:[
    {t:"Master the half-cost forms",res:["Every jutsu you will ever learn, you learn lean. In a war of attrition, you become the last one standing."],fn:function(){fAdapt(18);FX.add("chakraControl",4);FX.add("ninjutsu",2);tl(G.age,"Mastered half-cost techniques in the Rain fashion.")}},
    {t:"Study what the towers know",res:["Rain archives on chakra economy, sealed behind permissions you should not have. The librarian decides not to notice."],fn:function(){fAdapt(14);FX.add("intelligence",4);FX.tr("reckless",2)}}
   ]}}});
P({id:"syn_oto_suppress",cat:"Handicap",rar:"rare",w:8,gate:function(){return G.village==="oto"&&hcid()==="suppress"&&G.age>=9},
 build:function(){return{t:"The Sealed Chord",cat:"Handicap",loc:"Otogakure",art:"🔊",
   lines:["The Sound's researchers hear the word 'seal' the way sharks hear blood. A masked envoy offers you a wing of the facility, a stipend, and one promise: they will find what locked you, even if they have to go through you."],
   choices:[
    {t:"Accept the research",res:["Weeks of resonance work. The seal does not break, but it hums, and for the first time your chakra answers in a whisper."],fn:function(){fAdapt(25);FX.add("chakra",4);tl(G.age,"Sound researchers resonated the seal. Your chakra whispered back.")}},
    {t:"Refuse and study alone",res:["You want your lock opened by your own hands. It will take longer. It will be yours."],fn:function(){fAdapt(15);FX.add("willpower",4);FX.tr("disciplined",4)}},
    {t:"Let them think you agreed",res:["You accept the stipend and read everything they bring, telling them nothing true. Sound taught you one thing early: information is the only jutsu everyone can learn."],fn:function(){fAdapt(12);FX.add("intelligence",4);FX.tr("cunning",4)}}
   ]}}});

/* village flavor */
P({id:"fate_team_leaf",cat:"Academy",rar:"common",w:7,gate:function(){return G.village==="konoha"&&(G.academy&&G.academy.enrolled)&&G.age>=8},
 build:function(){var mates=(G.academy&&G.academy.classmates||[]).filter(function(n){return n.alive});
  return{t:"Team Exercise Week",cat:"Academy",loc:"Leaf Academy",art:"🍃",
   lines:["The Leaf trains teams before it trains heroes. This week the academy splits every class into squads that eat, drill and fail together."+(mates.length?" "+pick(mates).name.split(" ")[0]+" ends up on your side of the net.":"")],
   choices:[
    {t:"Carry the team",res:["You take the hardest drills twice. By Friday, they follow you without being asked."],fn:function(){FX.add("taijutsu",2);FX.add("leadership",2);rep(1)}},
    {t:"Learn to read the whole squad",res:["You stop watching your own feet. The formation starts breathing as one unit, and the instructor notices who made it breathe."],fn:function(){FX.add("intelligence",2);FX.add("chakraControl",1);rep(1)}},
    {t:"Make it fun",res:["The drills become a game, the game becomes a tradition, and years later your class still tells it wrong."],fn:function(){FX.add("happiness",3);if(mates.length){var m=pick(mates);FX.rel(m,8);FX.mem(m,"the academy drill game you invented","befriended")}}}
   ]}}});
P({id:"fate_rare_ame",cat:"Village",rar:"rare",w:4,gate:function(){return G.village==="ame"&&G.age>=10},
 build:function(){return{t:"A Stranger Under the Tower",cat:"Village",loc:"Amegakure",art:"🌧️",
   lines:["Rain hides people as well as buildings. This one has been standing in the same downpour for two hours, watching the tower, and has not gotten wet in a way you cannot explain."],
   choices:[
    {t:"Stand in the rain beside them",res:["They talk without turning. 'The rain remembers everyone who serves it.' When you look away and back, they are gone. Your chakra feels louder for a week."],fn:function(){FX.add("chakra",3);FX.add("perception",2);tl(G.age,"Met a stranger in the rain who could not get wet.")}},
    {t:"Report the stranger",res:["The tower takes it seriously. Too seriously. You are thanked, watched, and never told why."],fn:function(){rep(2);FX.add("intelligence",2)}},
    {t:"Follow them",res:["You lose them at the canal. But on the way home you find a paper seal on your door, folded in a shape you have never seen. It is warm."],fn:function(){FX.add("intelligence",3);fAdapt(6);tl(G.age,"Followed the stranger. A warm paper seal was left on your door.")}}
   ]}}});
})();

/* ================================================================
   CREATOR UI — village passive cards + CHOOSE YOUR FATE step
   ================================================================ */
var CH={hc:null,mode:null};
function hcCard(h){
  var col=RCOL[h.r];
  return '<div class="fate-card'+(CH.hc&&CH.hc.id===h.id?" sel":"")+'" data-h="'+h.id+'" style="--rc:'+col+'">'+
    '<div class="fate-top"><span class="fate-ic">'+h.ic+'</span><span class="fate-rar" style="color:'+col+';border-color:'+col+'">'+h.r+'</span></div>'+
    '<b>'+h.n+'</b><p>'+h.d+'</p></div>';
}
window.FATE={
 open:function(){
  CC.step="fate";ccClear();
  ["#cc-intro","#cc-pane-name","#cc-village","#cc-era","#cc-roll","#cc-clan","#cc-fate","#cc-final"].forEach(function(id,n){
    var p=$(id);if(p)p.classList.toggle("on",n===6);
  });
  var dots=$("#cc-prog");if(dots){var is=dots.querySelectorAll("i");is.forEach(function(d,i){d.classList.toggle("on",i<=5)});dots.style.opacity="1";}
  var pane=$("#cc-fate");
  pane.innerHTML='<p class="cc-kicker">Fate</p>'+
   '<h2 class="serif">Choose your <em>fate</em></h2>'+
   '<p class="cc-fate-quote">"Not every shinobi begins on equal footing. Some are born with limitations that change how they survive, learn, and grow."</p>'+
   '<div class="fate-actions">'+
    '<button class="btn fate-act" id="fate-pick"><b>Choose My Handicap</b><small>see every fate</small></button>'+
    '<button class="btn fate-act" id="fate-random"><b>Random Handicap</b><small>let fate decide</small></button>'+
    '<button class="btn fate-act" id="fate-none"><b>No Handicap</b><small>a whole, able body</small></button>'+
   '</div>'+
   '<div class="fate-grid" id="fate-grid" hidden></div>'+
   '<div class="fate-detail" id="fate-detail" hidden></div>'+
   '<div class="cc-nav"><button class="btn" id="fate-go"><b>Continue</b><small>To your life</small></button></div>';
  CH={hc:null,mode:null};
  $("#fate-pick").onclick=function(){var g=$("#fate-grid");g.hidden=!g.hidden;g.innerHTML=HC.map(hcCard).join("");
    g.querySelectorAll(".fate-card").forEach(function(c){c.onclick=function(){choose(HC.find(function(x){return x.id===c.dataset.h}))}});};
  $("#fate-random").onclick=function(){choose(randomHC())};
  $("#fate-none").onclick=function(){choose(null)};
  $("#fate-go").onclick=function(){
    if(CH.mode!=="none"&&CH.hc)CC.fate={id:CH.hc.id,rar:CH.hc.r};else CC.fate=null;
    ccFinalGo();
  };
 },
 villCard:function(k){
  var v=VPASS[k];if(!v)return"";
  return '<div class="cc-pass">✦ <b>'+v.t+'</b> — '+v.d+'</div>';
 },
 summaryHTML:function(){
  if(!CC.village)return"";
  var v=VPASS[CC.village];if(!v)return"";
  var s='<br><b>Birth & Traits</b><br>Village passive: '+v.t+' — '+v.d;
  if(CC.fate){var h=byId(CC.fate.id);if(h)s+='<br>Handicap: '+h.ic+' '+h.n+' <span style="color:'+RCOL[h.r]+'">('+h.r+')</span>';}
  else s+='<br>Handicap: none';
  return s;
 },
 stampPending:function(P){
  if(!P)return;
  P.vpassive={id:CC.village||P.village,t:(VPASS[CC.village]||{}).t||"",d:(VPASS[CC.village]||{}).d||""};
  if(CC.fate){
    var h=byId(CC.fate.id);
    if(h){P.handicap={id:h.id,rar:h.r,adap:0};
      for(var k in h.pen){if(P.stats[k]!=null)P.stats[k]=clamp(P.stats[k]+h.pen[k],0,100)}}
  }
 },
 profilePanel:function(){
  if(!G)return document.createElement("div");
  var p=panel("birth & traits","village passive & fate");
  var kv=el("div","kv");
  var v=G.vpassive&&VPASS[G.vpassive.id];
  var rows=[];
  if(v)rows.push(["Village passive",v.t]);
  if(G.handicap){var h=byId(G.handicap.id)||{n:G.handicap.id,r:G.handicap.rar};
    rows.push(["Handicap",h.n]);
    rows.push(["Rarity",G.handicap.rar]);
    var a=G.handicap.adap||0;
    var lbl=a>=100?"fully adapted":a>=75?"a craft":a>=50?"your own way works":a>=25?"learning to live around it":"just beginning";
    rows.push(["Adaptation",a+"% — "+lbl]);
    var eff=[];var g=["missing_arm","mobility","blind","one_eyed","fragile","low_chakra","suppress","slow"];
    eff.push(a>=50?"adaption is easing the effects":"effects active in training and missions");
    rows.push(["Effects",eff.join(", ")]);
  }else rows.push(["Handicap","none"]);
  rows.forEach(function(r){kv.appendChild(el("b",null,r[0]));kv.appendChild(el("span",null,String(r[1])))});
  p.appendChild(kv);
  return p;
 }
};
function choose(h){
  CH.hc=h;CH.mode=h?"pick":"none";
  var d=$("#fate-detail");
  if(!h){d.hidden=false;d.innerHTML='<p class="fate-note">No handicap. A whole, able body — and none of the paths that only open through limitation.</p>';return}
  d.hidden=false;
  var col=RCOL[h.r];
  d.innerHTML='<div class="fate-pick" style="--rc:'+col+'"><div class="fate-top"><span class="fate-ic">'+h.ic+'</span><span class="fate-rar" style="color:'+col+';border-color:'+col+'">'+h.r+'</span></div><b>'+h.n+'</b><p>'+h.d+'</p><p class="fate-adapt">Adaptation: handicaps are never removed by leveling. You adapt through choices, years, and rare events.</p></div>';
}
function randomHC(){
  var pool=[];HC.forEach(function(h){pool.push([h,HCW[h.r]])});
  return weighted(pool);
}

/* ---- save integration ---- */
var _ser=window.serializeG;
window.serializeG=function(){
  var o=_ser();
  try{o.vpassive=G?G.vpassive:null;o.handicap=G?G.handicap:null;o.fateSaved=G?G.fateSaved:null}catch(e){}
  return o;
};
var _des=window.deserializeG;
window.deserializeG=function(o){
  var g=_des(o);
  try{
    g.vpassive=(o&&o.vpassive)||{id:g.village,t:(VPASS[g.village]||{}).t||"",d:(VPASS[g.village]||{}).d||""};
    if(g.vpassive&&!g.vpassive.t)g.vpassive.t=(VPASS[g.village]||{}).t||"";
    g.handicap=(o&&o.handicap)||null;
    if(g.handicap&&byId(g.handicap.id))g.handicap.rar=g.handicap.rar||byId(g.handicap.id).r;
    g.fateSaved=(o&&o.fateSaved)||null;
    g.flags=o&&o.flags?o.flags:(g.flags||{});
  }catch(e){}
  return g;
};

/* ---- adaptation accrual per year ---- */
var _au=window.ageUp;
window.ageUp=function(){
  _au();
  try{
    if(G&&G.alive&&G.handicap){
      var before=G.handicap.adap||0;
      G.handicap.adap=Math.min(100,before+2);
      var after=G.handicap.adap;
      [[25,"You are learning to live around it."],[50,"Adaptation milestone: your own way works."],[75,"You have turned this disadvantage into a craft."],[100,"Fully adapted. What was a limitation is now a discipline."]].forEach(function(m){
        if(before<m[0]&&after>=m[0]){fbig("Adaptation "+m[0]+"% — "+m[1],"rare");tl(G.age,"Adaptation reached "+m[0]+"% of "+(byId(G.handicap.id)||{}).n+".")}
      });
    }
  }catch(e){}
};
})();
