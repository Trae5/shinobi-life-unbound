/* ============================================================
   clan_blood.js — The Bloodline & Awakening Overhaul (v1.3.0)
   Lifetime clan progression for every clan: dojutsu engines
   (Sharingan, Byakugan, Ketsuryugan), Mangekyo / Eternal /
   Rinnegan / Tenseigan evolutions, unique ladders for every
   non-eye clan, hidden childhood events, hidden potential,
   clan-exclusive choices, and a redesigned Bloodline menu.
   All state lives on G.bl; existing saves are migrated, never reset.
   ============================================================ */
window.BL=(function(){
var API={};

/* ---------------- tiny utils ---------------- */
function S(k){return (G&&G.stats&&typeof G.stats[k]==="number")?G.stats[k]:0}
function P(){return pick.apply(null,arguments)}
function log(txt){fbig(txt,"rare")}
function hist(txt,kind){var bl=ensure();if(!bl)return;bl.history.push({age:G.age,txt:txt,k:kind||""});if(bl.history.length>120)bl.history=bl.history.slice(-120)}
function mAdd(key,amt){var bl=ensure();if(!bl)return;bl.mastery[key]=Math.min(100,(bl.mastery[key]||0)+amt)}
function mLvl(key){var bl=ensure();return bl?Math.round(bl.mastery[key]||0):0}
function flag(k,v){var bl=ensure();if(!bl)return;bl.flags[k]=v===undefined?true:v}
function hasFlag(k){var bl=ensure();return !!(bl&&bl.flags[k])}
function potAdd(n){var bl=ensure();if(!bl)return;bl.pot=Math.max(1,Math.min(99,bl.pot+n))}
function pot(){var bl=ensure();return bl?bl.pot:0}
function rankN(){try{return rankRank()}catch(e){return 0}}
function lvl(){try{return (G.rpg&&G.rpg.level)||1}catch(e){return 1}}
function unlockedAdd(n,d,active){var bl=ensure();if(!bl)return;if(!bl.unlocked.some(function(u){return u.n===n})){bl.unlocked.push({n:n,d:d,a:!!active})}}
function grantTitle(t){var bl=ensure();if(!bl)return;if(!includes(bl.titles,t)){bl.titles.push(t);log("TITLE EARNED — "+t)}}

/* ---------------- state & migration ---------------- */
function rarityBonus(r){return {mythical:16,legendary:11,epic:7,rare:4,uncommon:2,common:1,secret:18}[r]||1}
function freshBl(cl){
  var p=26+((G.stats&&G.stats.potential)||4)*4+ri(0,22)+rarityBonus(cl?cl.r:"common");
  p=Math.max(22,Math.min(99,p));
  return {v:1,pot:p,eye:null,mastery:{},unlocked:[],flags:{},titles:[],history:[],events:[],
    uses:0,cd:{},deadSeen:{},mTotal:0,combatWins:0,combatLoss:0,branchOpen:false,branch:null,
    stage:0,lvl:0,secretSeen:[]};
}
function clanOfSafe(){try{return clanOf()}catch(e){return null}}
function initEyeFromLegacy(cl,bl){
  var stage=G.rank==="Genin"?1:(rankN()>=2?2:1);
  bl.eye={kind:cl.kg,tomoe:cl.kg==="Sharingan"?stage:0,awakenedAge:G.age,vis:100,ms:null,msAb:null,ems:false};
  hist("The blood you carried before the archives were rewritten is honored: your "+cl.kg+" was already awake.","legacy");
}
function ensure(){
  if(!G||!G.stats)return null;
  if(!G.bl||typeof G.bl!=="object"||!G.bl.pot){
    var cl=clanOfSafe();
    G.bl=freshBl(cl);
    if(cl&&cl.kg&&G.kkgKnown)initEyeFromLegacy(cl,G.bl);
    hist("The elders read your blood against the old registry. Its promise is sealed; even to you.","birth");
  }
  return G.bl;
}
API.ensure=ensure;
API.pot=pot;

/* ---------------- eye paths ---------------- */
var EYE_PATHS={
 "Sharingan":{
  clan:"Uchiha",minAge:8,
  stageNames:["1 Tomoe","2 Tomoe","3 Tomoe"],
  awakenBoost:{genjutsu:8,perception:8,ninjutsu:4},
  tomoeReq:[{age:12,mastery:22,flagAny:["protect","rival","surge","exceptional"],p:.4},
            {age:15,mastery:48,flagAny:["loss","pressure","exceptional","protect"],p:.26},
            {age:17,mastery:72,flagAny:["loss","combat","pressure","surge"],p:.17}],
  msReq:{age:14,mastery:85,pot:55,p:.045,needGrief:true},
  copyLine:"It copies what it witnesses.",
  hint:"The wheel turns when the heart is struck hard enough.",
  msHint:"A wheel that spins no further wants to become something else entirely."},
 "Byakugan":{
  clan:"Hyuga",minAge:5,
  stageNames:["Perception Mastery","Advanced Mastery","Byakugan Pinnacle"],
  awakenBoost:{perception:10,taijutsu:5},
  masteryStat:["perception","taijutsu"],
  awakenP:function(){return hasFlag("lesson")?.09:.03},
  hint:"The elders say the eyes open for those who look without fear.",
  msHint:null},
 "Ketsuryugan":{
  clan:"Chinoike",minAge:8,
  stageNames:["Crimson Awakening","Hypnotic Mastery","Blood Moon Pinnacle"],
  awakenBoost:{perception:8,genjutsu:7},
  masteryStat:["perception","genjutsu"],
  awakenP:function(){return hasFlag("bloodmoon")?.08:.035},
  hint:"The valley remembers what its children's eyes can do.",
  msHint:null}
};
function eyePath(){var cl=clanOfSafe();if(!cl||!cl.kg)return null;return EYE_PATHS[cl.kg]||null}

/* ---------------- mangekyo pattern + abilities ---------------- */
var MS_PATTERNS=["Amaranth Spiral","Eclipse Pinwheel","Six-Petal Higanbana","Triple Flame Ring","Twin Kama Wheel","Storm Lotus","Bone Lantern","Ashen Compass","Drowned Sun","Paper Lantern Cracking","Wisteria Wheel","Silent Comet"];
var MS_ABILITIES=[
 {id:"slip",n:"Slipping Between Spaces",d:"Space-time: fold the distance to somewhere you can already picture. Costs a great deal of chakra.",ch:24,fx:function(){addStat("speed",2);addStat("agility",1);hist("You folded space and arrived before your own echo.","ms");return "The world folds. You are simply elsewhere."}},
 {id:"second",n:"A Second Inside the Second",d:"Genjutsu: place a mind inside a minute that lasts as long as you want it to.",ch:20,fx:function(){addStat("genjutsu",3);hist("You bent a mind inside a stolen minute.","ms");return "They will not remember the minute you gave them."}},
 {id:"undying",n:"Flames That Do Not Die",d:"Black flame: what it touches keeps burning until nothing remains to burn.",ch:26,fx:function(){addStat("ninjutsu",3);hist("You set something on fire in a way that cannot be undone.","ms");return "The black flame clings and will not be argued out."}},
 {id:"whisper",n:"A Whisper That Feels Like Your Own Thought",d:"Suggestion: a single gentle rewrite of someone's intent. Once in a long while.",ch:18,fx:function(){addStat("intelligence",2);addStat("genjutsu",1);hist("Someone acted on a thought that was not quite theirs.","ms");return "They will believe it was their own idea."}},
 {id:"guardian",n:"The Guardian of Bone and Flame",d:"Summon the armored figure of your chakra. Enormous power, enormous drain.",ch:34,fx:function(){addStat("taijutsu",2);addStat("endurance",2);G.stats.chakra=Math.max(4,G.stats.chakra-6);hist("The guardian stood over you and the ground remembers.","ms");return "It rises, vast and slow, and takes your chakra as toll."}},
 {id:"starve",n:"The Stolen Spark",d:"Absorb a technique aimed at you and make its chakra yours.",ch:14,fx:function(){G.stats.chakra=Math.min(rpgChakraMax(),G.stats.chakra+14);hist("You drank a technique that was meant to end you.","ms");return "Their jutsu arrives and quietly becomes yours."}},
 {id:"river",n:"The River Runs Backward",d:"Rewind a moment of the battlefield a few seconds for everyone but you.",ch:30,fx:function(){addStat("chakraControl",2);hist("For three seconds, the world moved the wrong way.","ms");return "The moment unspools and reties itself around your choice."}},
 {id:"hollow",n:"The Hollow Bell",d:"Silence a sense in everyone who hears it. Eyes, ears, or chakra sense.",ch:16,fx:function(){addStat("genjutsu",2);addStat("perception",1);hist("You rang a bell no one else was permitted to hear.","ms");return "For a moment, everyone is deaf except you."}}
];
function rpgChakraMax(){try{return rpgCalc().maxCh}catch(e){return G.stats.chakra}}
function pickMSAbility(){
  var used=MS_ABILITIES.filter(function(a){return true});
  var n=ri(0,MS_ABILITIES.length-1);return MS_ABILITIES[n];
}
function pickPattern(){
  var bl=ensure();
  var pool=MS_PATTERNS.filter(function(p){return !(bl.patterns||[]).includes(p)});
  if(!pool.length)pool=MS_PATTERNS;
  var p=P(pool);
  bl.patterns=bl.patterns||[];bl.patterns.push(p);
  return p;
}

/* ---------------- grief & triggers ---------------- */
function scanDeaths(){
  var bl=ensure();if(!bl)return;
  (G.relationships||[]).forEach(function(n){
    if(n&&n.alive===false&&!bl.deadSeen[n.id]){
      bl.deadSeen[n.id]=true;
      var deep=(n.rel||0)>=75||(n.kind==="guardian")||(n.kind==="sibling")||(n.kind==="spouse")||(n.kind==="child");
      flag("loss");
      if(deep){flag("griefDeep");flag("griefName",(n.first||"someone")+" "+(n.last||""));}
      hist("Mourning: "+(n.first||"someone")+" "+(n.last||"")+" did not live to see this year.","loss");
    }
  });
}
function combatNote(win,tier,ctx){
  var bl=ensure();if(!bl)return;
  if(win){bl.combatWins++;flag("combat");
    if(tier>=4||(ctx==="exam"&&tier>=3))flag("exceptional");
    mAdd("dojo",1.5);
  }else{bl.combatLoss++;flag("pressure")}
}
API.combatNote=combatNote;

/* ---------------- awakening: eye clans ---------------- */
function triggerWeight(){
  var w=0,f=ensure()?ensure().flags:{};
  ["protect","rival","surge","exceptional","loss","pressure","combat"].forEach(function(k){if(f[k])w++});
  w+=Math.min(4,Math.floor((ensure().combatWins||0)/5));
  return w;
}
function tryEyeAwaken(){
  var ep=eyePath();if(!ep)return false;
  var bl=ensure();
  if(bl.eye||G.kkgKnown)return false;
  if(G.age<ep.minAge)return false;
  var w=triggerWeight();
  if(ep.clan==="Uchiha"&&w<3)return false;           /* the eye only answers the heart */
  var p=typeof ep.awakenP==="function"?ep.awakenP():(0.02+Math.min(.28,w*.022));
  p+=Math.min(.08,pot()/1000);
  if(!chance(p))return false;
  bl.eye={kind:clanOfSafe().kg,tomoe:0,awakenedAge:G.age,vis:100,ms:null,msAb:null,ems:false,lineage:hasFlag("otsutsukiLine")};
  G.kkgKnown=true;
  var kg=KKG[G.kkg]||{};for(var k in (kg.boost||{}))addStat(k,kg.boost[k]||0);
  if(!includes(G.achievements,"kkg"))award("kkg");
  if(G.clanName)rep(3);
  var kind=clanOfSafe().kg;
  if(kind==="Sharingan"){
    bl.eye.tomoe=1;
    modal("THE WHEEL TURNS","Bloodline","It happens in a breath you will never get back. The world splits into lines of chakra and motion, and when your sight settles, red is turning in your eyes.\n\nSHARINGAN — 1 TOMOE awakened.\n\nThe eye copies what it witnesses, reads intent in the shoulders before the fist moves, and sees chakra where others see only people. This is where it begins. Where it ends is not written yet.",
      [{t:"Open your eyes",fn:function(){log("The Sharingan is awake — 1 tomoe.");}}]);
    tl(G.age,"Awakened the Sharingan (1 tomoe).");
    grantTitle("Awakened Wheel");
  }else if(kind==="Byakugan"){
    modal("THE PALE VEIL LIFTS","Bloodline","Your instructor taps a wrapped post behind your back and asks what you see. You tell him. You are right, including the part you should not have been able to know.\n\nBYAKUGAN awakened.\n\nNearly three-sixty degrees of the world, chakra moving beneath skin like rivers under ice. The Gentle Fist finally has its map.",
      [{t:"See everything",fn:function(){log("The Byakugan is awake.");}}]);
    tl(G.age,"Awakened the Byakugan.");
    grantTitle("All-Seeing");
  }else{
    modal("CRIMSON, AND OLDER","Bloodline","There is a copper taste in the air and the sunset looks wrong. In a puddle you catch your reflection: your eyes have gone the red of old blood, with a pupil like a pressed flower.\n\nKETSURYUGAN awakened.\n\nThe valley's gift: eyes that hypnotize the living and set chakra in earth and air alight.",
      [{t:"Meet your own eyes",fn:function(){log("The Ketsuryugan is awake.");}}]);
    tl(G.age,"Awakened the Ketsuryugan.");
    grantTitle("Valley's Red");
  }
  bl.unlocked.push({n:kind+" — Awakened",d:"The bloodline sight. Passive: perception, prediction and chakra-reading in every fight, plus the path to deeper evolutions.",a:false});
  hist("BLOODLINE AWAKENED: "+kind+".","awaken");
  return true;
}
/* tomoe / mastery stage progression */
function tryEyeStageUp(){
  var ep=eyePath(),bl=ensure();if(!ep||!bl.eye)return false;
  var kind=bl.eye.kind;
  if(kind==="Sharingan"){
    var t=bl.eye.tomoe;
    if(t>=3)return false;
    var r=ep.tomoeReq[t];
    if(!r)return false;
    if(G.age<r.age||mLvl(kind)<r.mastery)return false;
    var ok=r.flagAny.some(function(k){return hasFlag(k)});
    if(!ok)return false;
    if(!chance(r.p))return false;
    bl.eye.tomoe=t+1;
    var gain=[{perception:3,genjutsu:2},{perception:3,ninjutsu:2,genjutsu:2},{perception:4,genjutsu:3,ninjutsu:2,chakraControl:2}][t];
    for(var k in gain)addStat(k,gain[k]);
    var names=["The eye grows its second tomoe.","The wheel nears completion — a third tomoe turns.","THREE TOMOE. The Sharingan is complete."];
    log(names[t]);
    tl(G.age,"Sharingan: "+(t+1)+" tomoe.");
    hist("The Sharingan deepens to "+(t+1)+" tomoe.","stage");
    if(t+1===3)grantTitle("Completed Wheel");
    return true;
  }
  /* Byakugan / Ketsuryugan style mastery stages */
  var names2=ep.stageNames,idx=Math.min(bl.eye.stage||0,names2.length-1);
  var need=[35,65,92][idx];
  if(mLvl(kind)<need||G.age<8)return false;
  if(!chance(.5))return false;
  bl.eye.stage=idx+1;
  var g2={perception:3,chakraControl:1};
  for(var k2 in g2)addStat(k2,g2[k2]);
  log("Your "+kind+" deepens: "+names2[idx+1]!==undefined?names2[idx]:"");
  log(kind+" mastery rises: "+names2[Math.min(idx+1,names2.length-1)]+".");
  hist("The "+kind+" deepens toward "+names2[Math.min(idx+1,names2.length-1)]+".","stage");
  if(idx+1>=names2.length-1)grantTitle(kind+" Master");
  return true;
}

/* ---------------- mangekyo / EMS / rinnegan / tenseigan ---------------- */
function tryMangekyo(){
  var ep=eyePath(),bl=ensure();if(!ep||!bl.eye||bl.eye.ms)return false;
  if(bl.eye.kind!=="Sharingan")return false;
  if(bl.eye.tomoe<3||G.age<ep.msReq.age||mLvl("Sharingan")<ep.msReq.mastery||pot()<ep.msReq.pot)return false;
  if(ep.msReq.needGrief&&!hasFlag("griefDeep"))return false;
  if(!chance(ep.msReq.p))return false;
  var ab=pickMSAbility(),pattern=pickPattern();
  bl.eye.ms={pattern:pattern,ab:ab.id,abName:ab.n,awakenedAge:G.age};
  bl.eye.vis=100;
  addStat("genjutsu",3);addStat("perception",3);
  unlockedAdd("Mangekyo: "+ab.n,ab.d,true);
  var lost=bl.flags.griefName||"someone the clan still names quietly";
  modal("THE EYE OPENS FURTHER","Bloodline","Grief does its work quietly and then, one morning, it is not quiet at all.\n\nSince "+lost+", the world has looked like a room with the furniture moved. Today the vertigo has a shape: your Sharingan spins past its final tomoe into a pattern no one else has ever carried.\n\nMANGEKYO SHARINGAN — "+pattern+"\nUnique ability unlocked: "+ab.n+"\n\n"+ab.d+"\n\nThe clan's oldest records whisper the price: these eyes spend vision with every use, and what vision is spent does not come back.",
    [{t:"Bear it",fn:function(){log("MANGEKYO SHARINGAN awakened — "+pattern+".");}}]);
  tl(G.age,"Awakened the Mangekyo Sharingan ("+pattern+").");
  hist("MANGEKYO SHARINGAN — "+pattern+". The price is vision, and it is already being paid.","ms");
  grantTitle(pattern);
  if(!includes(G.achievements,"kkg"))award("kkg");
  return true;
}
function tryEmsOffer(){
  var bl=ensure();if(!bl.eye||!bl.eye.ms||bl.eye.ems||hasFlag("emsOffered"))return false;
  if(bl.eye.vis>42)return false;
  var kin=(G.relationships||[]).some(function(n){return n.alive&&n.rel>=80&&(n.kind==="sibling"||n.kind==="parent"||n.kind==="guardian")});
  if(!kin&&pot()<85)return false;
  if(!chance(.05))return false;
  flag("emsOffered");
  var giver=kin?"A kinsman of the main line, whose own eyes burned out years ago, has kept one thing in a sealed lacquer box":"In the clan's sealed archive there is a lacquer box older than the village, holding one eye from an ancestor whose pattern matches yours";
  modal("THE KINSMAN'S GIFT","Bloodline",giver+". A Mangekyo, awakened by someone who loved you enough to leave it behind.\n\nThe rite is old, and the clan has performed it twice in its history. Your vision can be made whole. It will never be only your own sight again.\n\nSome things in this world are inherited twice.",
    [{t:"Accept the transplant",fn:function(){
        bl.eye.ems=true;bl.eye.vis=100;
        addStat("perception",4);addStat("chakraControl",3);
        grantTitle("Eternal Wheel");
        log("ETERNAL MANGEKYO SHARINGAN — your vision is restored, and it will not fade again.");
        tl(G.age,"Received the Eternal Mangekyo Sharingan.");
        hist("EMS: the kinsman's eye took root. Vision restored. Stability beyond what one eye can hold.","ems");
      }},
     {t:"Refuse — your eyes stay yours",fn:function(){
        potAdd(2);hist("Refused the transplant. The dimming is yours, and so is the eye.","ems");fbig("You keep your failing light. The elders do not argue; they only look at you differently after.","");}}]);
  return true;
}
function tryRinnegan(){
  var cl=clanOfSafe();if(!cl)return false;
  var bl=ensure();
  if(bl.eye&&bl.eye.rinnegan)return false;
  if(cl.n!=="Otsutsuki"&&cl.n!=="Hagoromo")return false;
  if(lvl()<40||S("chakra")<100||S("chakraControl")<85||rankN()<7||pot()<95)return false;
  if(!hasFlag("sageShrine"))return false;
  if(!chance(.02))return false;
  bl.rinnegan=true;
  if(bl.eye)bl.eye.rinnegan=true;
  addStat("chakra",10);addStat("chakraControl",5);addStat("ninjutsu",5);
  unlockedAdd("Rinnegan","The sage's own wheel: all five nature transformations at once, gravitational dominion, the paths between realms. It changes what a shinobi is.",true);
  modal("THE SAGE'S WHEEL","Bloodline","The shrine beneath the old seal has been waiting for a specific kind of blood, and yours finally answers it.\n\nThe ripple spreads through both eyes at once: six concentric circles, violet and absolute.\n\nRINNEGAN — the eye that predates the villages. Gravity answers you. So do the paths between things.\n\nThere are perhaps a handful of beings per age who should hold this. You are one.",
    [{t:"Accept what you are",fn:function(){log("THE RINNEGAN AWAKENS.");}}]);
  tl(G.age,"Awakened the Rinnegan.");
  hist("RINNEGAN. The lineage completes itself.","rinnegan");
  grantTitle("Six Paths");
  return true;
}
function tryTenseigan(){
  var cl=clanOfSafe();if(!cl||cl.n!=="Hyuga")return false;
  var bl=ensure();
  if(bl.eye&&bl.eye.tenseigan)return false;
  if(!hasFlag("otsutsukiLine"))return false;
  if(mLvl("Byakugan")<90||lvl()<35||rankN()<7||pot()<90)return false;
  if(!chance(.025))return false;
  bl.tenseigan=true;if(bl.eye)bl.eye.tenseigan=true;
  addStat("chakra",12);addStat("perception",5);addStat("chakraControl",5);
  unlockedAdd("Tenseigan","The pale wheel: chakra mode of pure life-force, the power to pull the moon's argument into the world. The Otsutsuki inheritance, answered in a Hyuga body.",true);
  modal("THE PALE WHEEL","Bloodline","The ancestor you have dreamed of since childhood stands where no one stands, and this time she is close enough to touch your brow.\n\nLight runs through your Byakugan like dawn through water and settles as a wheel of pale blue.\n\nTENSEIGAN — the other eye the Otsutsuki left behind. Life-force made law.",
    [{t:"Let it finish",fn:function(){log("THE TENSEIGAN AWAKENS.");}}]);
  tl(G.age,"Awakened the Tenseigan.");
  hist("TENSEIGAN. The pale wheel answers the Hyuga blood.","tenseigan");
  grantTitle("Pale Wheel");
  return true;
}

/* ---------------- clan-exclusive childhood events ---------------- */
var GENERIC_EV=[
 {id:"g_shrine",t:"The clan shrine",d:"You are small enough to stand under the shrine eaves. An elder lets you hold the family registry, just for a moment, and watches your hands more than the paper.",c:[
   {t:"Hold it carefully",fx:function(){potAdd(1);hist("You held the registry steady. The elder noticed.","event")}},
   {t:"Ask what the marks mean",fx:function(){mAdd("dojo",3);hist("You asked the right question at the wrong age. The elder liked it.","event")}}]},
 {id:"g_blood",t:"First sign of the blood",d:"Something happens during drills that should not be possible yet. The instructor stops mid-sentence and does not tell you to do it again.",c:[
   {t:"Try to do it again",fx:function(){potAdd(2);addStat("chakraControl",1);flag("surge");hist("You did it again. Nobody explained it.","event")}},
   {t:"Pretend nothing happened",fx:function(){flag("hidden");potAdd(1);hist("You learned early to keep things to yourself.","event")}}]},
 {id:"g_rival",t:"A cousin with something to prove",d:"A clan cousin your age decides you are the benchmark to beat, loudly and often.",c:[
   {t:"Meet the rivalry head-on",fx:function(){flag("rival");addStat("taijutsu",2);hist("The rivalry started early and never really stopped.","event")}},
   {t:"Refuse the contest",fx:function(){addStat("discipline",2);hist("You let the rivalry cool. It did not.","event")}}]},
 {id:"g_protect",t:"The younger ones",d:"A younger clan child wanders somewhere they should not. You are the closest person, and the first sound they make is your name.",c:[
   {t:"Go after them",fx:function(){flag("protect");addStat("endurance",1);potAdd(2);hist("You went in after a smaller child without deciding to.","event")}},
   {t:"Call for the adults first",fx:function(){addStat("intelligence",1);hist("You made the grown-up call. It worked. It still nags at you.","event")}}]},
 {id:"g_expect",t:"The family's arithmetic",d:"At a clan dinner the adults do the quiet math of bloodlines over your head, and you are old enough to notice.",c:[
   {t:"Show them what they hope for",fx:function(){potAdd(1);flag("expect");hist("You performed for the table. It felt like standing on a roof edge.","event")}},
   {t:"Ask why it matters",fx:function(){addStat("intelligence",1);hist("You asked the clan what its blood was for. Nobody had a short answer.","event")}}]},
 {id:"g_night",t:"A night you keep",d:"Something happens that year that the clan never speaks of again. You carry a piece of it.",c:[
   {t:"Face it",fx:function(){flag("pressure");potAdd(2);hist("You faced the thing the clan does not name.","event")}},
   {t:"Bury it deep",fx:function(){flag("hidden");potAdd(1);hist("You buried it. Buried things grow.","event")}}]}
];
function fireClanEvent(lo,hi){
  var cl=clanOfSafe(),bl=ensure();if(!cl)return;
  var pool=(BL_EVENTS[cl.n]||[]).concat(GENERIC_EV).filter(function(e){
    return G.age>=e.min&&G.age<=(e.max||13)&&!bl.events.includes(e.id)});
  if(!pool.length)return;
  var e=P(pool);
  var choices=e.c.map(function(c){return {t:c.t,fn:function(){bl.events.push(e.id);c.fx();STAT_SNAP=statSnapshot();render()}}});
  modal("CLAN — "+cl.n,e.t,e.d,choices);
}
API.fireClanEvent=fireClanEvent;

/* ---------------- unique ladders: every non-eye clan ---------------- */
function stage(name,req,line){return {n:name,req:req||{},line:line||""}}
var BL_LADDERS={
 Uzumaki:{m:"Sealing Arts",stats:["chakra","endurance"],stages:[
  stage("Vital Spark",{age:6,chakra:40},"Your reserves outgrow your shirt size."),
  stage("Chain Initiate",{age:10,chakra:60,mastery:25},"You form the first true sealing chain, gold and wavering."),
  stage("Fuinjutsu Adept",{age:14,rank:1,mastery:50},"Storage seals answer you without a brush."),
  stage("Keeper of the Spiral",{age:17,rank:2,mastery:70},"The clan's spiral sits in your chest like a second heartbeat.")],
  branch:{n:"Adamantine Awakening",hint:"There is a chain your mother's mothers refused to teach. The reason is carved on a drowned stone.",req:{age:18,mastery:85,pot:70},p:.03},
  ev:[
   {id:"uz1",t:"The red hair",d:"Market children have never seen hair like yours and say so, loudly, until an old woman with the same hair tells them whose village it came from.",c:[
    {t:"Wear the name proudly",fx:function(){potAdd(2);addStat("willpower",1);hist("You learned to hold your head up under strange eyes.","event")}},
    {t:"Ask about the drowned village",fx:function(){mAdd("Sealing Arts",5);hist("You asked about Uzushiogakure. The old woman talked for an hour.","event")}}]},
   {id:"uz2",t:"Your first seal",d:"A mishandled storage seal spills an ancestor's field kit across the floor, and you see exactly how the strokes failed.",c:[
    {t:"Repair it by feel",fx:function(){mAdd("Sealing Arts",8);flag("surge");hist("You repaired a seal the adults had given up on.","event")}},
    {t:"Study the failure",fx:function(){addStat("intelligence",2);mAdd("Sealing Arts",4);hist("You studied why it broke instead of fixing it fast.","event")}}]},
   {id:"uz3",t:"The knot that will not slip",d:"A traveling merchant begs the clan for a parley seal. Every adult is busy. You are eleven and standing too close.",c:[
    {t:"Attempt the seal",fx:function(){if(chance(.6)){mAdd("Sealing Arts",10);potAdd(2);hist("Your parley seal held for three days. Nobody found out who made it.","event")}else{addStat("discipline",1);hist("Your first parley seal smudged. You started over four times.","event")}}},
    {t:"Fetch an elder",fx:function(){addStat("reputation",1);hist("You knew when a job was bigger than you.","event")}}]}]},
 Senju:{m:"Wood Release",stats:["chakra","health"],stages:[
  stage("Deep Roots",{age:7,chakra:45},"Your chakra pools instead of spilling."),
  stage("Sapling Sign",{age:12,chakra:70,mastery:30},"A seed in your palm cracks open without soil or water."),
  stage("Grovekeeper",{age:16,rank:2,mastery:55},"You can hold a sapling's shape in your hand for minutes at a time."),
  stage("Hashirama's Echo",{age:20,rank:3,mastery:75},"The elders stop calling it a lost art when you are in the room.")],
  branch:{n:"True Wood Release",hint:"The First's forest still has one gate no Senju has opened in three generations.",req:{age:20,mastery:92,pot:88,chakra:95},p:.02},
  ev:[
   {id:"sj1",t:"The founder's garden",d:"The clan keeps a garden the village thinks is a park. An elder walks you through it and names trees that died a century ago.",c:[
    {t:"Remember the names",fx:function(){addStat("intelligence",2);potAdd(1);hist("You memorized the garden's dead.","event")}},
    {t:"Touch the oldest trunk",fx:function(){mAdd("Wood Release",6);flag("surge");hist("The old trunk warmed under your hand. The elder pretended not to see.","event")}}]},
   {id:"sj2",t:"Something green in winter",d:"You are sick with a fever, and by morning the frost on your windowsill has a fern growing through it.",c:[
    {t:"Show your guardian",fx:function(){mAdd("Wood Release",8);flag("exceptional");hist("Ferns in winter. The healer wrote nothing down and burned her notes.","event")}},
    {t:"Keep it secret",fx:function(){flag("hidden");mAdd("Wood Release",4);hist("The fern dried up when you hid it. Its secret did not.","event")}}]},
   {id:"sj3",t:"Weight of the name",d:"A village official visits the household and cannot meet the elders' eyes. You are twelve, pouring tea, and everyone pretends this is normal.",c:[
    {t:"Pour perfectly",fx:function(){addStat("discipline",2);hist("You poured the tea like a clan older than villages. You are.","event")}},
    {t:"Ask him why he came",fx:function(){addStat("intelligence",2);potAdd(1);hist("You asked the official his business. The adults let you.","event")}}]}]},
 Nara:{m:"Shadow Arts",stats:["intelligence"],stages:[
  stage("Shadow Sense",{age:6,intelligence:35},"You notice your shadow moves a half-beat early."),
  stage("Shadow Binder",{age:11,intelligence:50,mastery:25},"A deer's shadow holds still when you frown at it."),
  stage("Tactician's Hand",{age:15,rank:1,mastery:50},"Formation problems from the clan library solve themselves in your head."),
  stage("Shadow Strategist",{age:18,rank:2,mastery:70},"The clan asks your read before its elders give theirs.")],
  branch:{n:"Shadow Stitching",hint:"The antler tincture has a final recipe no scroll records. The deer know.",req:{age:17,intelligence:80,mastery:88},p:.025},
  ev:[
   {id:"nr1",t:"The deer garden",d:"Clan children are taught patience by feeding deer that tolerate them the way mountains tolerate weather.",c:[
    {t:"Sit still until they come",fx:function(){addStat("discipline",2);mAdd("Shadow Arts",4);hist("You out-patience a deer. First benchmark of a Nara.","event")}},
    {t:"Race them instead",fx:function(){addStat("speed",1);hist("You lost to deer. Everyone does. You laughed anyway.","event")}}]},
   {id:"nr2",t:"Cloud classification",d:"A grandmother teaches cloud-watching as serious tactical education. You are tested. There is a right answer.",c:[
    {t:"Name the formations",fx:function(){addStat("intelligence",2);hist("Cumulus, tactical, troublesome. The grandmother approved.","event")}},
    {t:"Ask why clouds matter",fx:function(){addStat("intelligence",1);mAdd("Shadow Arts",3);hist("You asked why. The answer was a lesson about indirect angles.","event")}}]},
   {id:"nr3",t:"The troublesome problem",d:"A mission ledger has an error that cost the clan a contract. You find it in an evening the adults planned to spend a week.",c:[
    {t:"Point it out plainly",fx:function(){flag("exceptional");addStat("intelligence",2);hist("You found the ledger error. The auditor was not grateful. The clan was.","event")}},
    {t:"Let the adults find it",fx:function(){addStat("discipline",1);hist("You kept your mouth shut and your notes. They saved them later.","event")}}]}]},
 Yamanaka:{m:"Mind Arts",stats:["intelligence","chakraControl"],stages:[
  stage("Flower Sense",{age:6,chakraControl:35},"You feel moods in a room like temperature."),
  stage("Mind Walker",{age:11,mastery:28,chakraControl:50},"The clan's sensing flower blooms toward your palm."),
  stage("Signal Adept",{age:15,rank:1,mastery:52},"Your telepathic relays arrive without static."),
  stage("Mind's Florist",{age:18,rank:2,mastery:72},"You arrange minds the way the clan arranges flowers.")],
  branch:{n:"The Mind's Palace",hint:"Every Yamanaka learns to walk into minds. One door in your own house stays locked even from you.",req:{age:18,mastery:90,pot:75,willpower:70},p:.02},
  ev:[
   {id:"ym1",t:"The flower test",d:"Clan children hold the sensing flower and report what it feels. Most children feel weather. Yours looks back.",c:[
    {t:"Report it honestly",fx:function(){mAdd("Mind Arts",8);flag("surge");hist("The sensing flower looked back. The proctors took a long lunch after.","event")}},
    {t:"Report something small",fx:function(){flag("hidden");potAdd(1);hist("You downsold the flower. The truth kept its weight.","event")}}]},
   {id:"ym2",t:"A customer's grief",d:"The family shop serves a widow who talks to her flowers. Your mother serves her tea like the grief is normal, because here it is.",c:[
    {t:"Sit with the widow",fx:function(){addStat("willpower",2);hist("You sat with a stranger's grief and did not flinch.","event")}},
    {t:"Learn the shop's craft",fx:function(){mAdd("Mind Arts",5);addStat("intelligence",1);hist("You learned what flowers say that people cannot.","event")}}]},
   {id:"ym3",t:"The mind's manners",d:"An elder drills the clan's first law into you: a mind you enter is a home you visit. You leave it as you found it.",c:[
    {t:"Take the oath",fx:function(){mAdd("Mind Arts",6);addStat("discipline",2);hist("You swore the Yamanaka's first law.","event")}},
    {t:"Ask what happens to oath-breakers",fx:function(){addStat("intelligence",1);hist("The elder's answer had three words and a long silence.","event")}}]}]},
 Aburame:{m:"Colony Bond",stats:["endurance","chakraControl"],stages:[
  stage("First Tenants",{age:5,endurance:30},"The kikaichu settle and their hum becomes ordinary."),
  stage("Symbiote Adept",{age:10,mastery:26,endurance:45},"Feeding the colony costs you almost nothing now."),
  stage("Swarm Commander",{age:14,rank:1,mastery:50},"A thousand bodies answer one thought."),
  stage("Hive Sovereign",{age:17,rank:2,mastery:70},"Your colony scouts report in chakra-script only you read.")],
  branch:{n:"The Deep Colony",hint:"There is a chamber under every Aburame house that no one opens, and something in it remembers your grandmother.",req:{age:16,mastery:85,endurance:75},p:.025},
  ev:[
   {id:"ab1",t:"The settling",d:"The colony's hum in your ears is loudest at night, the year it first takes hold. An elder teaches you the breathing that makes it quiet.",c:[
    {t:"Learn the breathing",fx:function(){mAdd("Colony Bond",7);addStat("discipline",1);hist("The hum is ordinary now. Mostly.","event")}},
    {t:"Listen to it instead",fx:function(){mAdd("Colony Bond",4);flag("surge");hist("You listened to the colony's rhythm and it told you things.","event")}}]},
   {id:"ab2",t:"Insects as neighbors",d:"Village children dare each other to touch you. One of them actually does, and a kikaichu stings her on reflex. She cries. You feel it too.",c:[
    {t:"Apologize and explain",fx:function(){addStat("reputation",2);hist("You explained the colony to a crying girl. She nodded and came back to play.","event")}},
    {t:"Withdraw into the hive",fx:function(){addStat("endurance",1);flag("hidden");hist("You decided people were for later.","event")}}]},
   {id:"ab3",t:"The host's fever",d:"A breeding cycle overheats your blood. The healers work a full night. The colony does something none of the elders have seen to help.",c:[
    {t:"Trust the colony",fx:function(){mAdd("Colony Bond",10);potAdd(2);hist("The colony fought its own fever with you.","event")}},
    {t:"Let the healers work",fx:function(){addStat("health",2);hist("Medicine did what instinct could not.","event")}}]}]},
 Inuzuka:{m:"Partner Bond",stats:["speed","endurance"],stages:[
  stage("First Howl",{age:6,speed:30},"The ninken pup picks you back."),
  stage("Pack Runner",{age:11,mastery:26,speed:45},"You read the partner's ears like a map."),
  stage("Fang Coordinated",{age:14,rank:1,mastery:50},"Four-legged technique holds for a full mission."),
  stage("Alpha Bond",{age:17,rank:2,mastery:70},"Scent-tracking a day old comes easy to the pair of you.")],
  branch:{n:"The Pact of Two Hearts",hint:"The clan's oldest grave holds a partner buried standing up. Nobody explains the orientation.",req:{age:16,mastery:85,speed:75},p:.03},
  ev:[
   {id:"in1",t:"The choosing",d:"The pups are lined up in the clan kennels, and clan children are told to stand still and let a partner pick them. One pup ignores the line entirely.",c:[
    {t:"Accept the maverick",fx:function(){mAdd("Partner Bond",8);potAdd(1);hist("The pup that ignored the line chose you.","event")}},
    {t:"Wait for protocol",fx:function(){addStat("discipline",1);hist("You let the handlers arrange it. The maverick waited too.","event")}}]},
   {id:"in2",t:"First blood together",d:"Your partner takes a cut meant for you during a training exercise and does not even stop running. You do.",c:[
    {t:"Match its courage",fx:function(){mAdd("Partner Bond",9);flag("protect");hist("You stopped stopping when your partner didn't.","event")}},
    {t:"Carry it home",fx:function(){mAdd("Partner Bond",5);addStat("endurance",2);hist("You carried your partner home and it pretended to mind.","event")}}]},
   {id:"in3",t:"The scent that should not be there",d:"On a border run the pair of you catch a scent the treaty says is impossible this far south.",c:[
    {t:"Investigate",fx:function(){flag("exceptional");mAdd("Partner Bond",6);hist("The impossible scent led somewhere and the report went to the Hokage's desk.","event")}},
    {t:"Mark and report",fx:function(){addStat("intelligence",1);hist("You did the disciplined thing. The adults took it seriously.","event")}}]}]},
 Akimichi:{m:"Body Arts",stats:["strength","endurance"],stages:[
  stage("Calorie Sense",{age:6,strength:30},"You understand hunger as fuel, not feeling."),
  stage("Expansion Adept",{age:11,mastery:26,strength:45},"The Multi-Size Technique holds longer than a breath."),
  stage("Butterfly Barrage",{age:15,rank:1,mastery:50},"Human boulder, human wall, human avalanche. All you."),
  stage("Clan Pillar",{age:18,rank:2,mastery:70},"The clan's formation breaks toward you now.")],
  branch:{n:"The Three Colored Pills",hint:"The red pill has a legend attached, and the legend has a shelf-life.",req:{age:17,mastery:88,strength:85},p:.025},
  ev:[
   {id:"ak1",t:"The clan table",d:"Akimichi dinners are drills with chopsticks. Your appetite is treated as aptitude.",c:[
    {t:"Clean your plate",fx:function(){addStat("strength",2);mAdd("Body Arts",4);hist("You ate like it was training. It was.","event")}},
    {t:"Learn the family recipes",fx:function(){addStat("intelligence",1);mAdd("Body Arts",3);hist("You learned why the recipes matter: every dish is a dose.","event")}}]},
   {id:"ak2",t:"Too big for the door",d:"Your first successful expansion wedges you in the academy doorway. The class takes photographs with their memories.",c:[
    {t:"Laugh it off",fx:function(){addStat("happiness",2);hist("You laughed in the doorframe. The class laughed with you, not at you.","event")}},
    {t:"Master the reversal",fx:function(){mAdd("Body Arts",7);hist("You shrank back clean. Second try, perfect.","event")}}]},
   {id:"ak3",t:"The supply run",d:"A clan storehouse needs restocking and the adults test you with a cart sized for two.",c:[
    {t:"Haul it alone",fx:function(){addStat("strength",2);addStat("endurance",1);hist("You hauled the double cart. Your shoulders remember.","event")}},
    {t:"Make two trips",fx:function(){addStat("discipline",1);hist("Two tidy trips. The quartermaster approved.","event")}}]}]},
 Kaguya:{m:"Dead Bone Pulse",stats:["strength","endurance"],stages:[
  stage("First Bone",{age:7,strength:35},"A bone ridge rises under your skin like a promise."),
  stage("Dance Adept",{age:12,mastery:30,strength:55},"The bone dance stops hurting you and starts moving you."),
  stage("Bone Weaponmaster",{age:15,rank:1,mastery:55},"Every bone in your body is a weapon rack."),
  stage("Shikotsumyaku Sovereign",{age:18,rank:2,mastery:75},"The clan's dances live in your spine.")],
  branch:{n:"The Complete Dance",hint:"The clan's last complete dance killed its last dancer. The steps survive. So does the warning.",req:{age:18,mastery:90,strength:88,pot:80},p:.02},
  ev:[
   {id:"kg1",t:"Never bleed in public",d:"The first clan rule you learn is about your own blood, and the second is about who cleans it up.",c:[
    {t:"Follow both rules",fx:function(){addStat("discipline",2);hist("You learned to bleed privately.","event")}},
    {t:"Ask what happens if you don't",fx:function(){addStat("intelligence",1);potAdd(1);hist("You asked. The answer was a story about hunters.","event")}}]},
   {id:"kg2",t:"The bone dance lesson",d:"An uncle teaches the first dance on a beach where the sand is black. He never says why the sand is black.",c:[
    {t:"Learn the steps exactly",fx:function(){mAdd("Dead Bone Pulse",9);hist("You learned the first dance on black sand.","event")}},
    {t:"Ask about the sand",fx:function(){addStat("intelligence",1);potAdd(1);hist("He answered with the whole story. You wished he hadn't.","event")}}]},
   {id:"kg3",t:"Village eyes",d:"The village watches the clan the way one watches a knife on a table. You feel it at school, at market, everywhere but home.",c:[
    {t:"Be unremarkable",fx:function(){addStat("discipline",1);addStat("reputation",1);hist("You gave the village nothing to watch.","event")}},
    {t:"Be excellent anyway",fx:function(){flag("exceptional");potAdd(2);hist("You decided to be worth watching.","event")}}]}]}
};
BL_LADDERS.Otsutsuki={m:"Celestial Lineage",stats:["chakra","chakraControl"],stages:[
 stage("Outsider Blood",{age:8,chakra:55},"Your chakra reads as foreign to every sensor trained on village stock."),
 stage("Celestial Vessel",{age:14,chakra:80,mastery:35},"Your body holds more chakra than your frame explains politely."),
 stage("Byakuya no Ken",{age:18,rank:4,mastery:60},"You begin to perceive the world the way the old carvings describe."),
 stage("Approaching Divinity",{age:22,rank:7,mastery:80},"Village archives seal your file behind the Kage's own stamp.")],
 branch:{n:"The Ancestral Voice",hint:"The family crest has a nineteenth syllable nobody pronounces.",req:{age:20,mastery:90,pot:95},p:.015},
 ev:[
  {id:"ot1",t:"The unplaced language",d:"Your grandmother sings a lullaby no scholar can place. You hum it back before you can talk properly.",c:[
   {t:"Sing it whole",fx:function(){potAdd(3);flag("surge");hist("You sang a language that predates villages and it came naturally.","event")}},
   {t:"Ask what it means",fx:function(){addStat("intelligence",2);hist("She answered in the same tongue. You understood anyway.","event")}}]},
  {id:"ot2",t:"Too much chakra",d:"A routine academy reading breaks the proctor's instrument. He apologizes to you.",c:[
   {t:"Stay calm",fx:function(){addStat("chakra",3);mAdd("Celestial Lineage",6);hist("The proctor's gauge cracked. He marked it 'equipment fault'.","event")}},
   {t:"Fear your own depth",fx:function(){flag("pressure");potAdd(1);hist("You learned your depth frightens instruments and people equally.","event")}}]}]};
BL_LADDERS.Hagoromo={m:"Sage Legacy",stats:["chakraControl","willpower"],stages:[
 stage("Scripture Blood",{age:8,chakraControl:50},"Pilgrims' blessings warm your hands like weather."),
 stage("Sage Novice",{age:14,mastery:35,chakraControl:70},"Stillness comes to you like a native language."),
 stage("Spirit Binder",{age:18,rank:4,mastery:60},"You perceive spirits at the edge of every room."),
 stage("Heir of the Sage",{age:22,rank:7,mastery:80},"The scriptures describe your posture exactly.")],
 branch:{n:"The Sage's Staff",hint:"Somewhere the pilgrims stopped, a staff waited a thousand years for a grip it recognizes.",req:{age:20,mastery:90,pot:95},p:.015},
 ev:[
  {id:"hg1",t:"Pilgrims at the door",d:"Pilgrims ask your family for blessings. Your parents stopped turning them away years ago. You are the youngest and they bow to you anyway.",c:[
   {t:"Bless them clumsily",fx:function(){potAdd(2);addStat("willpower",1);hist("You blessed a pilgrim with a child's words. She wept.","event")}},
   {t:"Hide behind the door",fx:function(){flag("hidden");hist("Some inheritances arrive whether you watch them or not.","event")}}]},
  {id:"hg2",t:"The truth of the name",d:"An archive scholar goes white reading your family name, then lies about why. You are nine and you notice.",c:[
   {t:"Remember the lie",fx:function(){addStat("intelligence",2);flag("hidden");hist("You caught a scholar's lie about your own name.","event")}},
   {t:"Ask your parents",fx:function(){potAdd(1);mAdd("Sage Legacy",5);hist("Your parents told you a version of the truth. It was enough, for now.","event")}}]}]};
BL_LADDERS.Jugo={m:"Sage Transformation",stats:["strength","endurance"],stages:[
 stage("The Quiet Days",{age:7,strength:40},"Your moods have weather patterns."),
 stage("First Surge",{age:12,mastery:30,strength:60},"The surge takes you once and gives you back changed."),
 stage("Control Techniques",{age:15,rank:2,mastery:55},"You can direct a surge instead of surviving one."),
 stage("Master of Two Natures",{age:18,mastery:78},"The curse and the gift obey the same hand now.")],
 branch:{n:"The Full Transformation",hint:"The clan's elders never complete it. The clan's elders are also alive.",req:{age:17,mastery:90,strength:85,willpower:75},p:.02},
 ev:[
  {id:"jg1",t:"Far from the main roads",d:"Your family lives outside town by choice and by warning. A village child follows you home and sees why.",c:[
   {t:"Send them home gently",fx:function(){addStat("willpower",2);hist("You walked the child to the road and said nothing about why.","event")}},
   {t:"Show them around",fx:function(){addStat("reputation",1);potAdd(1);hist("One village child knows now, and keeps the secret like a treasure.","event")}}]},
  {id:"jg2",t:"The shake in your hands",d:"Some weeks your hands shake with borrowed natural energy that has nowhere to go. An elder shows you the door it goes through.",c:[
   {t:"Learn the door",fx:function(){mAdd("Sage Transformation",8);addStat("discipline",2);hist("The energy learned a route. Your hands steadied.","event")}},
   {t:"Fight it alone",fx:function(){addStat("endurance",2);flag("pressure");hist("You fought it alone and won ugly.","event")}}]}]};
BL_LADDERS.Sarutobi={m:"Will of Fire",stats:["willpower","ninjutsu"],stages:[
 stage("The Fire's Name",{age:7,willpower:35},"You learn why the village calls the clan its fire."),
 stage("Element Generalist",{age:13,mastery:30,ninjutsu:45},"Two natures answer your hands before you specialize."),
 stage("Hokage's Contemporaries",{age:16,rank:2,mastery:55},"The village leadership knows your name the old way."),
 stage("Will Made Law",{age:19,rank:3,mastery:72},"Younger shinobi orient on you in a crisis.")],
 branch:{n:"The Second's Notebook",hint:"Your grandfather's teacher kept a notebook. Half of it is burned. Your family has the other half.",req:{age:18,mastery:85,intelligence:75},p:.025},
 ev:[
  {id:"sr1",t:"Grandfather's war stories",d:"Your grandfather served the Second Hokage and tells it plainly, which is worse than telling it bravely.",c:[
   {t:"Listen fully",fx:function(){addStat("willpower",2);mAdd("Will of Fire",5);hist("You heard the war plainly told and stayed in the room.","event")}},
   {t:"Ask the hard question",fx:function(){addStat("intelligence",2);hist("You asked what he would have done differently. He answered.","event")}}]},
  {id:"sr2",t:"The village's oldest trust",d:"A door in the administration opens for your family name without appointments. You are taken along, and told to remember.",c:[
   {t:"Remember everything",fx:function(){addStat("intelligence",2);potAdd(1);hist("You remembered. It was tested later.","event")}},
   {t:"Watch the people instead",fx:function(){addStat("perception",2);hist("You watched faces instead of papers. Different lesson, same weight.","event")}}]}]};
BL_LADDERS.Kurama={m:"Illusion Craft",stats:["genjutsu","intelligence"],stages:[
 stage("Second Sight",{age:7,genjutsu:35},"You see the seam in every illusion a room holds."),
 stage("Weaver",{age:12,mastery:32,genjutsu:55},"Your first true illusion holds three minds at once."),
 stage("Mind Sculptor",{age:15,rank:2,mastery:58},"The clan's warning stories stop being about other people."),
 stage("Master of the Unseen",{age:18,rank:3,mastery:75},"Illusion and reality have a border only you patrol.")],
 branch:{n:"Burning the Candle",hint:"The clan's power burns minds, including their own. The family portraits' eyes are painted closed for a reason.",req:{age:17,mastery:88,genjutsu:85},p:.02},
 ev:[
  {id:"kr1",t:"Paintings that are real",d:"Your aunt paints scenes no one else can see. You look at one too long and smell its rain.",c:[
   {t:"Step into it",fx:function(){mAdd("Illusion Craft",8);flag("surge");potAdd(2);hist("You walked into an aunt's painting and came back wet.","event")}},
   {t:"Look away first",fx:function(){addStat("discipline",2);hist("You looked away in time. You still remember the smell.","event")}}]},
  {id:"kr2",t:"The clan's caution",d:"The elders teach genjutsu the way other clans teach knife safety: slowly, with first aid prepared.",c:[
   {t:"Follow every precaution",fx:function(){mAdd("Illusion Craft",5);addStat("discipline",2);hist("You learned illusion with the safety on.","event")}},
   {t:"Sneak the advanced text",fx:function(){if(chance(.5)){mAdd("Illusion Craft",10);potAdd(2);flag("exceptional");hist("The advanced text answered you early.","event")}else{flag("pressure");addStat("health",-2);hist("The advanced text gave you a nosebleed and a warning.","event")}}}]}]};
BL_LADDERS.Hatake={m:"White Fang Style",stats:["speed","kenjutsu"],stages:[
 stage("The White Scabbard",{age:8,speed:35},"The blade above the shrine hums when you pass."),
 stage("Fang Draw",{age:13,mastery:32,speed:55},"Your draw is measured in afterimages."),
 stage("Blade Legacy",{age:16,rank:2,mastery:58},"Sensei from other clans ask who taught you."),
 stage("White Fang's Heir",{age:19,rank:3,mastery:75},"The blade leaves the shrine with your name on the wrap.")],
 branch:{n:"The Forbidden Draw",hint:"There is a technique the white scabbard's last owner swore never to teach again.",req:{age:18,mastery:88,speed:85},p:.022},
 ev:[
  {id:"ht1",t:"The shrine blade",d:"A white chokuto hangs above the family shrine. Children are told not to touch it. You are told when you may.",c:[
   {t:"Wait for the year",fx:function(){mAdd("White Fang Style",7);addStat("discipline",2);hist("You waited for the year you were allowed. The blade remembered the patience.","event")}},
   {t:"Touch it early",fx:function(){if(chance(.5)){mAdd("White Fang Style",9);flag("exceptional");hist("The blade let you hold it. Nobody knows you did.","event")}else{addStat("discipline",1);hist("You were caught. The scolding lasted a season.","event")}}}]}]};
BL_LADDERS.Yuki={m:"Ice Release",stats:["ninjutsu","chakraControl"],stages:[
 stage("Cold Hands",{age:8,chakraControl:40},"Frost blooms where you dream."),
 stage("Ice Adept",{age:13,mastery:32,ninjutsu:55},"The ice dome holds its shape without trembling."),
 stage("Glacier Field",{age:16,rank:2,mastery:58},"You freeze a training ground solid in one exhale."),
 stage("Silent Winter",{age:19,rank:3,mastery:75},"Hunters' stories are about your family again.")],
 branch:{n:"The Hunter's Bane",hint:"The technique the hunters taught your family to fear has a counter only your blood remembers.",req:{age:17,mastery:88,pot:72},p:.022},
 ev:[
  {id:"yk1",t:"Kept quiet",d:"Your family never talks about why they moved to the coast. A schoolmate asks. The table goes silent in a specific way.",c:[
   {t:"Change the subject",fx:function(){addStat("discipline",1);hist("You learned to protect the family's silence at dinner.","event")}},
   {t:"Ask at home",fx:function(){potAdd(2);mAdd("Ice Release",4);hist("At home, they told you about the hunters. You slept with the window shut for a year.","event")}}]},
  {id:"yk2",t:"First frost sign",d:"You sneeze and the well water freezes over. The adults exchange one long look and start your real training that night.",c:[
   {t:"Train in secret",fx:function(){mAdd("Ice Release",9);flag("surge");hist("Night training began before day training did.","event")}},
   {t:"Refuse the night drills",fx:function(){addStat("willpower",1);hist("You chose your own pace. The clan adjusted, mostly.","event")}}]}]};
BL_LADDERS.Terumi={m:"Lava Release",stats:["ninjutsu","endurance"],stages:[
 stage("Heat Tolerance",{age:9,endurance:40},"Boiling springs feel like baths to you."),
 stage("Molten Adept",{age:14,mastery:34,ninjutsu:55},"Your lava blob lands where you mean it."),
 stage("Boil Mastery",{age:17,rank:2,mastery:60},"The acid mist obeys radius and duration both."),
 stage("Vapor Sovereign",{age:20,rank:3,mastery:78},"Two natures braided, steady as weather.")],
 branch:{n:"The Fifth Mist",hint:"There is a fifth state your clan's scrolls promise and no record confirms.",req:{age:19,mastery:88,ninjutsu:85},p:.02},
 ev:[
  {id:"tm1",t:"The hot spring incident",d:"You bathe in a spring marked dangerous and come out wrinkled, unharmed, and extremely pleased with yourself.",c:[
   {t:"Do it again next week",fx:function(){mAdd("Lava Release",6);addStat("endurance",2);hist("The dangerous spring is your bath now.","event")}},
   {t:"Tell the elders",fx:function(){addStat("reputation",1);hist("The elders tested your tolerance formally. It was off their charts.","event")}}]}]};
BL_LADDERS.Darui={m:"Storm Release",stats:["ninjutsu","speed"],stages:[
 stage("Static Sense",{age:9,speed:38},"Storm fronts itch in your teeth."),
 stage("Beam Adept",{age:14,mastery:34,ninjutsu:55},"Your laser cuts a prayer flag at thirty paces."),
 stage("Storm Lantern",{age:17,rank:2,mastery:60},"You braid lightning into sustained beams."),
 stage("Black Lightning",{age:20,rank:3,mastery:78},"The Raikage's own technique answers your blood.")],
 branch:{n:"The King of Clouds",hint:"The third Raikage's black lightning has one more color past black that no scroll names.",req:{age:19,mastery:90,ninjutsu:88},p:.02},
 ev:[
  {id:"dr1",t:"The storm that followed you",d:"A dry-season storm builds directly over the academy field during your entrance drill and nobody can explain it.",c:[
   {t:"Own it",fx:function(){mAdd("Storm Release",7);flag("surge");hist("The storm attended your drill personally.","event")}},
   {t:"Apologize",fx:function(){addStat("happiness",1);hist("You apologized to the proctors. They were too busy staring to hear it.","event")}}]}]};
BL_LADDERS.Hoshigaki={m:"Shark Arts",stats:["strength","endurance"],stages:[
 stage("Gill Sense",{age:9,endurance:38},"You breathe water easier than the instructors expect."),
 stage("Shark Skin",{age:14,mastery:34,strength:58},"Your skin toughens against blades a grade at a time."),
 stage("Water Hunter",{age:17,rank:2,mastery:60},"You fight underwater like the other fighters can't breathe."),
 stage("Samehada's Whisper",{age:20,rank:3,mastery:78},"Sentient blades consider you worth arguing with.")],
 branch:{n:"The Deep Maw",hint:"The clan's oldest member stopped aging at forty and will not discuss the ocean trench he visited.",req:{age:19,mastery:88,endurance:85},p:.02},
 ev:[{id:"hs1",t:"Teeth like the family",d:"Your adult teeth come in serrated. The dentist writes 'genetic' and leaves quickly.",c:[
  {t:"Grin about it",fx:function(){addStat("happiness",2);mAdd("Shark Arts",5);hist("You smiled with the family's teeth and meant it.","event")}},
  {t:"Keep your mouth closed",fx:function(){flag("hidden");hist("You learned to smile without showing why.","event")}}]}]};
BL_LADDERS.Iburi={m:"Smoke Body",stats:["endurance","chakraControl"],stages:[
 stage("Smoke Lungs",{age:9,endurance:38},"Cave drafts answer your breathing."),
 stage("Partial Form",{age:14,mastery:34,endurance:55},"An arm becomes smoke and returns obedient."),
 stage("Full Dissolution",{age:17,rank:2,mastery:60},"Blades pass through you and close on nothing."),
 stage("Cave Master",{age:20,rank:3,mastery:78},"Smoke obeys you indoors and out.")],
 branch:{n:"The Windless Cave",hint:"There is one chamber where the smoke form becomes permanent. The clan's elders stopped going in.",req:{age:18,mastery:90,chakraControl:85},p:.02},
 ev:[{id:"ib1",t:"The cave draft",d:"A clan child is taught to read cave air before letters. You get lost in the tunnels once and the draft walks you out.",c:[
  {t:"Trust the draft",fx:function(){mAdd("Smoke Body",7);hist("The cave's air knew the way out and lent it to you.","event")}},
  {t:"Panic and run",fx:function(){addStat("endurance",1);hist("You ran blind and survived. The clan marked your route for next time.","event")}}]}]};
BL_LADDERS.Tsuchigumo={m:"Forbidden Barriers",stats:["intelligence","chakraControl"],stages:[
 stage("Barrier Sense",{age:9,intelligence:40},"You feel the seams in every barrier you walk through."),
 stage("Seal Apprentice",{age:14,mastery:34,intelligence:58},"Your first barrier holds a boar, then holds longer."),
 stage("Barrier Master",{age:17,rank:2,mastery:62},"The clan's forbidden formulae stop being forbidden shapes to you."),
 stage("Keeper of the Vault",{age:20,rank:3,mastery:80},"The clan trusts you with what the seals are for.")],
 branch:{n:"The Unbreakable Formula",hint:"The clan vault holds one formula written backwards, and nobody has explained the ink.",req:{age:19,mastery:90,intelligence:90},p:.018},
 ev:[{id:"ts1",t:"The sealed door",d:"The clan estate has one door that is always sealed and never explained. You ask at age eight, and at nine, and at ten.",c:[
  {t:"Keep asking",fx:function(){potAdd(2);flag("hidden");hist("You kept asking about the sealed door. Eventually the answers changed.","event")}},
  {t:"Stop asking",fx:function(){addStat("discipline",2);hist("You learned the clan's oldest skill: not asking.","event")}}]}]};
BL_LADDERS.Hozuki={m:"Hydrification",stats:["endurance","chakraControl"],stages:[
 stage("Water Hands",{age:9,chakraControl:40},"Your fingers ripple like pond water when you are tired."),
 stage("Partial Liquefaction",{age:14,mastery:34,endurance:55},"A blade passes through your shoulder and finds nothing."),
 stage("Full Hydrification",{age:17,rank:2,mastery:60},"You pour yourself through a grate and reform."),
 stage("The Living Water",{age:20,rank:3,mastery:78},"Weapons break on you and argue about it.")],
 branch:{n:"The Oil of the Second",hint:"The clan's archives mention an oil that makes the form permanent. The archives then stop mentioning it.",req:{age:18,mastery:90,endurance:85},p:.02},
 ev:[{id:"hz1",t:"Do not drink the seawater",d:"The clan's first lesson is about water's opinion of your body. You learn it at a beach, practically.",c:[
  {t:"Master the lesson",fx:function(){mAdd("Hydrification",6);hist("You learned what water does to you before it mattered.","event")}},
  {t:"Learn it the hard way",fx:function(){addStat("endurance",1);flag("pressure");hist("The seawater lesson cost you a fever and a story.","event")}}]}]};
BL_LADDERS.Yotsuki={m:"Storm Endurance",stats:["endurance","strength"],stages:[
 stage("Cloud Country Spine",{age:9,endurance:40},"Cold that bends other children straightens you."),
 stage("Unbroken Stance",{age:14,mastery:34,strength:58},"You do not move. That is the technique."),
 stage("Lightning Endurance",{age:17,rank:2,mastery:60},"Your body channels current without cooking."),
 stage("The Storm's Own",{age:20,rank:3,mastery:78},"The Raikage's guard studies your posture.")],
 branch:{n:"The Unmoved Mountain",hint:"Your grandmother once stood through a bombardment. The place she stood still hasn't grown grass.",req:{age:18,mastery:88,endurance:90},p:.02},
 ev:[{id:"yt1",t:"The mountain training",d:"Cloud children train on mountains that laugh at gear lists. You are given boots two sizes too big and told to grow.",c:[
  {t:"Wear them and climb",fx:function(){addStat("endurance",3);mAdd("Storm Endurance",5);hist("You grew into the boots by climbing.","event")}},
  {t:"Improvise wrappings",fx:function(){addStat("intelligence",1);hist("You fixed the boots yourself. The clan approved of the thinking.","event")}}]}]};
BL_LADDERS.Kamizuru={m:"Bee Arts",stats:["chakraControl","endurance"],stages:[
 stage("First Hive",{age:9,chakraControl:38},"The bees accept your chakra as a queen's."),
 stage("Honey Arsenal",{age:14,mastery:34,chakraControl:55},"Wax bombs obey pinch and palm."),
 stage("Swarm General",{age:17,rank:2,mastery:58},"A thousand wings fly in your formation."),
 stage("Bee Keeper of Kumo",{age:20,rank:3,mastery:76},"The hive's memory is yours to query.")],
 branch:{n:"The Queen's Line",hint:"Every Kamizuru child is stung once by the queen. Yours hesitated, and the elders saw it.",req:{age:17,mastery:88,chakraControl:85},p:.022},
 ev:[{id:"km1",t:"Stung twice",d:"Clan children get stung twice: once to learn, once to choose. You are at the choosing.",c:[
  {t:"Take the sting gladly",fx:function(){mAdd("Bee Arts",7);addStat("willpower",1);hist("You chose the hive back. It heard you.","event")}},
  {t:"Ask what the bees get",fx:function(){addStat("intelligence",1);mAdd("Bee Arts",3);hist("You asked about the bees' side of the bargain. Nobody had asked before.","event")}}]}]};
BL_LADDERS.Kedoin={m:"Copy Technique",stats:["chakraControl","perception"],stages:[
 stage("Double Vision",{age:9,perception:38},"You can hold a face in memory like a mask."),
 stage("Copy Adept",{age:14,mastery:34,chakraControl:55},"You wear another's body for a full hour."),
 stage("Mirror Master",{age:17,rank:2,mastery:58},"Infiltration tasks come to the clan by name."),
 stage("The Library of Faces",{age:20,rank:3,mastery:76},"You hold forty bodies in reserve.")],
 branch:{n:"The Original Face",hint:"The clan's founder copied so completely he forgot his own face. His memoir is just a list of other people.",req:{age:18,mastery:90,perception:85},p:.02},
 ev:[{id:"kd1",t:"Whose smile is that",d:"You catch your reflection practicing someone else's father's smile and cannot remember picking it up.",c:[
  {t:"Shake it off",fx:function(){addStat("willpower",2);mAdd("Copy Technique",5);hist("You learned to put borrowed faces down.","event")}},
  {t:"Study it",fx:function(){mAdd("Copy Technique",8);potAdd(1);hist("You studied the borrowed smile until it answered questions.","event")}}]}]};
BL_LADDERS.Fuma={m:"Wind Steel",stats:["speed","kenjutsu"],stages:[
 stage("Fūma Shuriken",{age:9,speed:38},"The great shuriken folds for you like a fan."),
 stage("Wind Edge",{age:14,mastery:34,speed:55},"Your wind chakra sharpens steel without touching it."),
 stage("Chakra Blades",{age:17,rank:2,mastery:58},"The clan's chakra-forged blades sing for you."),
 stage("Fūma Vanguard",{age:20,rank:3,mastery:76},"Rival clans keep records of your family's draws.")],
 branch:{n:"The Phantom Volley",hint:"The clan's lost technique threw nine shadows with one blade. The math survives; the thrower didn't.",req:{age:18,mastery:88,speed:88},p:.02},
 ev:[{id:"fm1",t:"The great shuriken",d:"You are assigned to carry the giant shuriken on a clan march. It is half your height.",c:[
  {t:"Carry it the whole way",fx:function(){addStat("endurance",2);mAdd("Wind Steel",5);hist("You carried the great shuriken and grew a shoulder to match.","event")}},
  {t:"Learn its folding trick",fx:function(){mAdd("Wind Steel",7);addStat("intelligence",1);hist("You mastered the fold ahead of schedule.","event")}}]}]};
BL_LADDERS.Sasori={m:"Puppet Genius",stats:["intelligence","kenjutsu"],stages:[
 stage("First Marionette",{age:9,intelligence:38},"Carved wood moves on your chakra strings."),
 stage("Poison Master",{age:14,mastery:34,intelligence:58},"Your compounds have no simple antidote."),
 stage("Puppeteer Adept",{age:17,rank:2,mastery:60},"Ten puppets, ten strings, one mind."),
 stage("Human Puppetry",{age:20,rank:3,mastery:78},"The clan's darkest art waits in your workshop, unasked.")],
 branch:{n:"The Eternal Stage",hint:"The workshop's back room has a frame the clan measures everyone against, once.",req:{age:19,mastery:92,intelligence:90,pot:80},p:.015},
 ev:[{id:"ss1",t:"The workshop rules",d:"The clan workshop has three rules. The third one is crossed out and rewritten every generation.",c:[
  {t:"Read the third rule closely",fx:function(){potAdd(2);flag("hidden");hist("You read the third rule as it was written and as it was rewritten.","event")}},
  {t:"Follow the first two only",fx:function(){addStat("discipline",2);hist("You decided some rules were for later, or never.","event")}}]}]};
BL_LADDERS.Onikuma={m:"Bear Strength",stats:["strength","endurance"],stages:[
 stage("Bear Grip",{age:9,strength:40},"You bend a kunai absently and get scolded for the kunai."),
 stage("Ursa Adept",{age:14,mastery:34,strength:58},"Clan wrestling bouts stop being fair."),
 stage("Mountain Frame",{age:17,rank:2,mastery:60},"You carry loads that retire pack animals."),
 stage("The Demon Bear's Heir",{age:20,rank:3,mastery:78},"The clan's name stops being a joke in the archives.")],
 branch:{n:"The Winter Slumber",hint:"The clan sleeps one full week each winter. Nobody who has slept it will say what they dreamed.",req:{age:18,mastery:88,strength:88},p:.022},
 ev:[{id:"on1",t:"The double load",d:"A clan elder loads you with firewood meant for two and watches what your body decides.",c:[
  {t:"Carry it all",fx:function(){addStat("strength",3);mAdd("Bear Strength",5);hist("Your body decided correctly.","event")}},
  {t:"Make two trips",fx:function(){addStat("discipline",1);hist("Two trips. The elder nodded and said nothing, which was worse.","event")}}]}]};
BL_LADDERS.Hoki={m:"Scholar's Speed",stats:["intelligence","speed"],stages:[
 stage("Fast Reader",{age:9,intelligence:38},"You read at the speed of being turned loose in an archive."),
 stage("Archive Runner",{age:14,mastery:34,speed:55},"You retrieve any scroll in the tower before the clerk's tea cools."),
 stage("Strategist's Library",{age:17,rank:2,mastery:58},"Your citations beat rival analysts to the answer."),
 stage("The Living Index",{age:20,rank:3,mastery:76},"Village archives ask you where things are.")],
 branch:{n:"The Burned Wing",hint:"One wing of the great library was burned on purpose. The catalogue entry survives. The reason is filed under 'pests'.",req:{age:18,mastery:88,intelligence:88},p:.02},
 ev:[{id:"hk1",t:"The overdue scroll",d:"A hundred-year-old scroll comes due and the fine is owed by your family. You go to settle it.",c:[
  {t:"Read it before returning",fx:function(){mAdd("Scholar's Speed",7);potAdd(1);hist("You read the overdue scroll before paying its fine. Worth it.","event")}},
  {t:"Pay the fine in full",fx:function(){addStat("discipline",1);hist("You paid the century's fine without opening it. The clerk was impressed either way.","event")}}]}]};
BL_LADDERS.Kohaku={m:"Clear Spirit",stats:["willpower","chakraControl"],stages:[
 stage("Amber Calm",{age:9,willpower:38,"genjutsu":0},"Illusions slide off you like rain off wax."),
 stage("Spirit Guard",{age:14,mastery:34,willpower:58},"The clan's meditation quiets a whole room."),
 stage("Unclouded Master",{age:17,rank:2,mastery:58},"Mental interference breaks against your surface."),
 stage("The Still Pool",{age:20,rank:3,mastery:76},"Your clarity becomes teachable, which is rare.")],
 branch:{n:"The Perfect Mirror",hint:"The clan's founder achieved a mind so clear it reflected attacks back. The technique's cost is written in his diary's last entry.",req:{age:18,mastery:90,willpower:88},p:.02},
 ev:[{id:"kh1",t:"The mirror meditation",d:"Clan children meditate facing a mirror until the face stops moving. Yours stops first try. The instructor restarts the hour to make sure.",c:[
  {t:"Hold the stillness",fx:function(){mAdd("Clear Spirit",8);flag("surge");hist("The mirror stilled on your first attempt. The instructor double-checked everything after.","event")}},
  {t:"Ask why it matters",fx:function(){addStat("intelligence",1);mAdd("Clear Spirit",4);hist("You asked. The answer took three sessions and was worth it.","event")}}]}]};
BL_LADDERS.Izuno={m:"Scroll Fortune",stats:["intelligence","chakraControl"],stages:[
 stage("Scroll Sense",{age:9,intelligence:38},"Scrolls practically unroll themselves near you."),
 stage("Fortune Reader",{age:14,mastery:34,intelligence:55},"Your divinations come true often enough to be annoying."),
 stage("Battle Scrollmaster",{age:17,rank:2,mastery:58},"You fight from inside a whirling page barrier."),
 stage("Keeper of the Lucky Scroll",{age:20,rank:3,mastery:76},"The clan's luck runs through your fingers.")],
 branch:{n:"The Unwritten Page",hint:"The clan's great scroll has one blank page. Elders who peek write nothing and change the subject.",req:{age:18,mastery:88,intelligence:85,pot:75},p:.02},
 ev:[{id:"iz1",t:"The market divination",d:"The clan reads fortunes at the festival stall. A stranger's fortune comes out blank, and the elders close the stall early.",c:[
  {t:"Note who it was",fx:function(){addStat("perception",2);potAdd(1);hist("You remembered the stranger with the blank fortune. So did the elders.","event")}},
  {t:"Forget it",fx:function(){addStat("happiness",1);hist("Some fortunes are better unread.","event")}}]}]};
BL_LADDERS.Fujimori={m:"Barrier Arts",stats:["chakraControl","endurance"],stages:[
 stage("Thin Veil",{age:9,chakraControl:38},"Your first barrier bends but holds."),
 stage("Warded Adept",{age:14,mastery:34,chakraControl:55},"You seal a room against intruders between heartbeats."),
 stage("Fortress Hand",{age:17,rank:2,mastery:58},"Village posts request your barriers by name."),
 stage("The Quiet Wall",{age:20,rank:3,mastery:76},"Your barriers hold without your attention.")],
 branch:{n:"The Negative Space",hint:"A barrier protects what is inside it. The clan's lost art protects what is outside it.",req:{age:18,mastery:88,chakraControl:85},p:.02},
 ev:[{id:"fj1",t:"The castle duty",d:"Your family has guarded the feudal lord's castle for generations, a fact the village half-remembers and the clan never forgets.",c:[
  {t:"Learn the castle's history",fx:function(){addStat("intelligence",1);mAdd("Barrier Arts",5);hist("You learned why the family keeps the castle duty.","event")}},
  {t:"Practice on the estate walls",fx:function(){mAdd("Barrier Arts",7);hist("You warded the estate wall alone at night. Nobody noticed, which was the point.","event")}}]}]};
BL_LADDERS.Yotsuya={m:"Puppetry",stats:["intelligence","chakraControl"],stages:[
 stage("First Strings",{age:9,chakraControl:38},"Your chakra strings hold a teacup, then a doll."),
 stage("Puppetwright",{age:14,mastery:34,intelligence:55},"Your first full puppet takes shape in the workshop."),
 stage("Troupe Master",{age:17,rank:2,mastery:58},"Three puppets move as one performer."),
 stage("The Hidden Hand",{age:20,rank:3,mastery:76},"Audiences cannot find the puppeteer.")],
 branch:{n:"The Living Marionette",hint:"The clan's oldest puppet has a hinged compartment nobody has opened since the founder's funeral.",req:{age:18,mastery:90,intelligence:85},p:.02},
 ev:[{id:"ys1",t:"The traveling show",d:"The clan performs puppet theater at festivals as cover and craft both. You are given the smallest role.",c:[
  {t:"Play it perfectly",fx:function(){mAdd("Puppetry",6);addStat("happiness",1);hist("Your smallest role got the biggest laugh.","event")}},
  {t:"Watch the strings",fx:function(){mAdd("Puppetry",7);hist("You studied the master's strings instead of the stage.","event")}}]}]};
BL_LADDERS.Ishikawa={m:"Earth Release",stats:["strength","endurance"],stages:[
 stage("Stone Sense",{age:9,strength:38},"You feel faults in rock like false notes in a song."),
 stage("Earth Adept",{age:14,mastery:34,endurance:55},"Your earth wall takes a direct jutsu and stands."),
 stage("Quarrymaster",{age:17,rank:2,mastery:58},"The terrain becomes your weapon rack."),
 stage("Mountain's Heir",{age:20,rank:3,mastery:76},"Your family's name is on the village's oldest foundation stone.")],
 branch:{n:"The Gravemaster's Seal",hint:"The first Earth Shadow's burial cairn answers to one bloodline. The clan keeps which one quiet.",req:{age:18,mastery:88,strength:85},p:.02},
 ev:[{id:"is1",t:"The family quarry",d:"The clan quarry built half the village walls. You are taught to read stone the way farmers read weather.",c:[
  {t:"Learn the stone",fx:function(){mAdd("Earth Release",6);hist("You learned the quarry's language of cracks and seams.","event")}},
  {t:"Split your first boulder",fx:function(){addStat("strength",2);mAdd("Earth Release",5);hist("The boulder split clean. Your form didn't. Both improved.","event")}}]}]};
BL_LADDERS.Amagiri={m:"Wind and Path",stats:["speed","perception"],stages:[
 stage("Weather Reader",{age:9,perception:38},"You smell rain an hour before the sky does."),
 stage("Pathfinder",{age:14,mastery:34,speed:55},"You find routes through country maps call impossible."),
 stage("Wind Scout",{age:17,rank:2,mastery:58},"Your reports arrive before the fog lifts."),
 stage("The Grey Vanguard",{age:20,rank:3,mastery:76},"Villages you pass through start naming roads after you.")],
 branch:{n:"The Second Horizon",hint:"A scout who walks far enough reports a horizon that moves when followed. The clan believes them.",req:{age:18,mastery:88,speed:85},p:.02},
 ev:[{id:"am1",t:"The washed-out road",d:"A trade road floods and the village's routes tangle. You, at nine, spot the bypass everyone else missed.",c:[
  {t:"Speak up",fx:function(){flag("exceptional");addStat("perception",2);hist("Your bypass saved a week of freight. The quartermaster remembers names.","event")}},
  {t:"Draw the map instead",fx:function(){addStat("intelligence",1);hist("Your map went up the chain. Your name didn't, yet.","event")}}]}]};
BL_LADDERS.Kurosawa={m:"Administration",stats:["intelligence","willpower"],stages:[
 stage("Ledger Sense",{age:9,intelligence:38},"You find the error in any column on sight."),
 stage("Department Adept",{age:14,mastery:34,intelligence:55},"Your paperwork moves through three departments a day."),
 stage("Policy Hand",{age:17,rank:2,mastery:58},"Village budgets bend toward your annotations."),
 stage("The Grey Eminence",{age:20,rank:3,mastery:76},"Hokage meetings pause when you enter with a folder.")],
 branch:{n:"The Vault Key",hint:"The treasury's deepest vault has a lock keyed to a bloodline. The paymaster's ledgers hint at which.",req:{age:18,mastery:88,intelligence:88},p:.02},
 ev:[{id:"kw1",t:"The tax season",d:"Your family's accounting house handles shinobi pay disputes. You watch a jonin argue a stipend and lose to a spreadsheet.",c:[
  {t:"Learn the spreadsheet",fx:function(){mAdd("Administration",7);hist("You learned why the spreadsheet won. It always does.","event")}},
  {t:"Sneak the jonin a win",fx:function(){addStat("reputation",1);hist("You found the jonin a legitimate win. He remembered it.","event")}}]}]};
BL_LADDERS.Tachibana={m:"Endurance and Society",stats:["endurance","willpower"],stages:[
 stage("Long Breath",{age:9,endurance:38},"Your family outlasts everyone at anything."),
 stage("Social Spine",{age:14,mastery:34,willpower:55},"You carry a conversation through any room."),
 stage("The Patient Blade",{age:17,rank:2,mastery:58},"Your endurance wins fights before they start."),
 stage("House of Standing",{age:20,rank:3,mastery:76},"The clan's standing opens doors jutsu cannot.")]
 branch:{n:"The Century Promise",hint:"The clan keeps promises whose due dates are a century out. One is nearly due.",req:{age:18,mastery:88,willpower:85},p:.02},
 ev:[{id:"tc1",t:"The long dinner",d:"A clan engagement dinner runs nine hours. You are the youngest there and the last to be excused.",c:[
  {t:"Last the full nine hours",fx:function(){addStat("endurance",2);mAdd("Endurance and Society",5);hist("You outlasted the adults at their own dinner. They noticed.","event")}},
  {t:"Study the politics",fx:function(){addStat("intelligence",1);hist("You mapped who owed whom by the third hour.","event")}}]}]};
BL_LADDERS.Shirakami={m:"Scholarship",stats:["intelligence","chakraControl"],stages:[
 stage("White-Faced Scholar",{age:9,intelligence:38},"You finish the academy's reading list early and ask for more."),
 stage("Archive Adept",{age:14,mastery:34,intelligence:55},"The clan's private archive admits you."),
 stage("Theory Weaver",{age:17,rank:2,mastery:58},"Your papers circulate beyond the village."),
 stage("The White Library",{age:20,rank:3,mastery:76},"Scholars make pilgrimages to your desk.")]
 branch:{n:"The Sealed Folio",hint:"The archive's sealed folio is catalogued with a title and no contents. The librarian who last opened it stopped teaching.",req:{age:18,mastery:88,intelligence:90},p:.02},
 ev:[{id:"sh1",t:"The white study",d:"The clan's study is painted white on purpose: no color for the mind to lean on. You are handed your first slate and chalk.",c:[
  {t:"Fill the slate",fx:function(){mAdd("Scholarship",6);hist("You filled a slate a day. The clan counted them.","event")}},
  {t:"Empty it instead",fx:function(){addStat("intelligence",1);hist("You learned the harder half: what to erase.","event")}}]}]};
BL_LADDERS.Lee={m:"Gate Arts",stats:["taijutsu","endurance"],stages:[
 stage("Third Gate Touch",{age:9,taijutsu:40},"For one second, the gate opens and you see what speed really is."),
 stage("Gate Novice",{age:14,mastery:34,taijutsu:58},"You open the first gate in training without injury."),
 stage("Leaf Style Master",{age:17,rank:2,mastery:58},"Your taijutsu has no ninjutsu to hide behind and doesn't need any."),
 stage("Gate Master",{age:20,rank:3,mastery:76},"Six gates open in sequence, safely, once.")],
 branch:{n:"The Eighth Gate's Shadow",hint:"The clan's scrolls describe the eighth gate so its bearer can recognize the moment and refuse it.",req:{age:19,mastery:92,taijutsu:92,pot:85},p:.015},
 ev:[{id:"le1",t:"The impossible lap",d:"A clan elder bets you cannot do a thousand laps. You are halfway when he stops watching, which is the test.",c:[
  {t:"Finish all thousand",fx:function(){addStat("taijutsu",3);mAdd("Gate Arts",6);hist("You finished the thousandth lap to an empty field. That was the point.","event")}},
  {t:"Stop when it hurts",fx:function(){addStat("endurance",1);hist("You stopped. The elder nodded. 'Good. Come back tomorrow.'","event")}}]}]};
BL_LADDERS.Ryu={m:"Dragon Spirit",stats:["strength","chakra"],stages:[
 stage("Dragon Blood",{age:9,strength:38},"Your temper has scales."),
 stage("Scaled Adept",{age:14,mastery:34,strength:58},"Your skin hardens like lacquered armor under stress."),
 stage("Dragon Roar",{age:17,rank:2,mastery:58},"Your voice carries chakra that breaks formation."),
 stage("The Ascending Coil",{age:20,rank:3,mastery:76},"The clan's dragon forms answer you in sequence.")],
 branch:{n:"The Coiled Crown",hint:"The clan's ancestral hoard holds one scale that predates the clan. It is warm.",req:{age:18,mastery:88,strength:88},p:.02},
 ev:[{id:"ry1",t:"The ridge crest",d:"Clan children climb the dragon-back ridge at dawn. Most stop at the third crest. You keep going.",c:[
  {t:"Climb past the third crest",fx:function(){addStat("endurance",2);mAdd("Dragon Spirit",7);potAdd(1);hist("You climbed past where the clan's stories start.","event")}},
  {t:"Watch the sunrise from three",fx:function(){addStat("happiness",1);hist("You took the view. It was a good one.","event")}}]}]};
BL_LADDERS.Shimura={m:"Wind Discipline",stats:["taijutsu","discipline"],stages:[
 stage("Rooted Stance",{age:8,discipline:35},"The clan's discipline sits in you like a spine."),
 stage("Wind Adept",{age:13,mastery:30,taijutsu:50},"Your wind chakra cuts a leaf clean at ten paces."),
 stage("The Quiet Blade",{age:16,rank:2,mastery:52},"You are trusted with the techniques the name carries."),
 stage("Shimura Standard",{age:19,rank:3,mastery:70},"The clan's standard is what younger cousins measure against.")],
 branch:{n:"The Old Root",hint:"The clan's founders served something older than the village. The shrine's back wall remembers what the front one forgets.",req:{age:18,mastery:85,discipline:80},p:.02},
 ev:[{id:"sm1",t:"The fan crest",d:"Your family keeps its crest covered in public and wears it open at home. You learn both reasons in the same week.",c:[
  {t:"Keep both reasons",fx:function(){potAdd(2);flag("hidden");hist("You learned why the crest hides, and why it doesn't always.","event")}},
  {t:"Wear it open at school",fx:function(){addStat("willpower",2);hist("You wore the crest openly. The reactions taught you more than the lessons did.","event")}}]}]};
BL_LADDERS.Vex={m:"The Void",stats:["chakra","willpower"],stages:[
 stage("The Quiet Hunger",{age:6,chakra:50},"Something in you drinks light at the edges."),
 stage("Void Touch",{age:12,mastery:40,chakra:75},"You can make a room forget what was in it."),
 stage("Null Adept",{age:16,rank:3,mastery:65},"Jutsu aimed at you arrive weakened, confused."),
 stage("The Hollow Throne",{age:20,rank:7,mastery:85},"The void recognizes its own and makes room.")],
 branch:{n:"The Unmaking",hint:"There is a word the void knows that nothing else survives. The clan's rule is that you never learn it young.",req:{age:22,mastery:95,pot:99},p:.01},
 ev:[{id:"vx1",t:"The shadow that listens",d:"Your shadow moves against the light sometimes, and only when it wants something. The clan says that is normal. The clan says this to itself, mostly.",c:[
  {t:"Speak to it",fx:function(){potAdd(4);mAdd("The Void",8);flag("surge");hist("You spoke to your shadow. It answered in your own voice.","event")}},
  {t:"Never look at it directly",fx:function(){addStat("willpower",2);flag("hidden");hist("You learned the discipline of not-looking. It holds. For now.","event")}}]}]};
BL_LADDERS.Rin={m:"Primordial Blood",stats:["chakra","health"],stages:[
 stage("The Old Blood",{age:6,chakra:55},"Your blood remembers something older than chakra."),
 stage("First Ascent",{age:12,mastery:40,chakra:80},"Your body takes a form your ancestors wore."),
 stage("Primordial Adept",{age:16,rank:3,mastery:65},"The forest goes quiet when you are angry."),
 stage("The Returning Tide",{age:20,rank:7,mastery:85},"The age bends around your presence now.")]
 branch:{n:"The First Shape",hint:"The clan's full form was seen once in recorded history. The record survives. The village that saw it does not.",req:{age:22,mastery:95,pot:99},p:.01},
 ev:[{id:"rn1",t:"The forest's silence",d:"Birds leave a mile radius around you some mornings. Your family calls this 'a quiet morning' and goes back to sleep.",c:[
  {t:"Walk into the silence",fx:function(){potAdd(4);mAdd("Primordial Blood",8);flag("surge");hist("You walked into the quiet and the quiet walked with you.","event")}},
  {t:"Stay in bed",fx:function(){addStat("willpower",1);flag("hidden");hist("You stayed under the blanket. The quiet waited outside, politely.","event")}}]}]};
/* eye-clan events */
var BL_EVENTS={
 Uchiha:[
  {id:"uc1",t:"The fire watch",d:"An elder shows you the clan's fan crest and the old words for fire. The lesson has a second part nobody your age usually receives.",c:[
   {t:"Accept the second part",fx:function(){potAdd(3);mAdd("Sharingan",5);hist("You received the fire lesson's second part, years early.","event")}},
   {t:"Keep to the usual lessons",fx:function(){addStat("discipline",1);hist("You stayed with your age group's lessons. The elder nodded once.","event")}}]},
  {id:"uc2",t:"A cousin's brilliance",d:"A cousin two years older already carries two tomoe and the clan makes no secret of the comparison.",c:[
   {t:"Match it in your own time",fx:function(){flag("rival");addStat("genjutsu",2);hist("You chose the long path against a brilliant cousin.","event")}},
   {t:"Study under them",fx:function(){mAdd("Sharingan",6);hist("You apprenticed yourself to the cousin's pace. They noticed and softened.","event")}}]},
  {id:"uc3",t:"The covered crest",d:"You are followed home by shinobi who pretend to be buying skewers. They watch the clan's covered crest and take notes.",c:[
   {t:"Report it",fx:function(){addStat("perception",2);flag("pressure");hist("You reported the watchers. The clan knew already and watched them back.","event")}},
   {t:"Watch them back",fx:function(){addStat("perception",3);potAdd(1);hist("You watched the watchers. One of them noticed, and smiled.","event")}}]}],
 Hyuga:[
  {id:"hy1",t:"Main house, branch house",d:"You learn which house you were born to, and what the seal on a cousin's brow means, in the same afternoon.",c:[
   {t:"Ask everything",fx:function(){addStat("intelligence",2);flag("lesson");hist("You asked about the seal. The answer stayed with you.","event")}},
   {t:"Absorb it silently",fx:function(){addStat("discipline",2);flag("lesson");hist("You absorbed the house's rules without a word. The elders approved.","event")}}]},
  {id:"hy2",t:"Gentle fist, first form",d:"The gentle fist's first form is taught with a rice paper screen. You are told to strike the chakra point through it without tearing the paper.",c:[
   {t:"Strike true",fx:function(){mAdd("Byakugan",8);addStat("taijutsu",2);hist("Paper intact, point struck. The instructor's eyebrows rose.","event")}},
   {t:"Strike until it tears",fx:function(){addStat("taijutsu",3);hist("The screen tore. Your form improved by the tenth attempt.","event")}}]},
  {id:"hy3",t:"Perception exams",d:"The clan's perception exams put children in sealed rooms and ask what they can name without eyes. You name things on the far side of walls.",c:[
   {t:"Report everything",fx:function(){mAdd("Byakugan",9);flag("exceptional");hist("The perception exam proctor wrote your result twice to be sure.","event")}},
   {t:"Understate it",fx:function(){flag("hidden");potAdd(1);hist("You gave the exam a modest answer. The truth kept growing.","event")}}]}],
 Chinoike:[
  {id:"cn1",t:"The valley's story",d:"An elder tells the clan's story plainly: the exile, the valley, the eyes. Children are expected to hear it without flinching.",c:[
   {t:"Hear it without flinching",fx:function(){potAdd(2);addStat("willpower",2);hist("You heard the valley's story and did not look away.","event")}},
   {t:"Ask what happened after",fx:function(){addStat("intelligence",1);potAdd(1);hist("You asked what came after the exile. The elder was glad someone did.","event")}}]},
  {id:"cn2",t:"Blood moon over the water",d:"A red moon rises over the valley's lake the night of your ninth year. The elders gather the clan at the shore and wait to see whose eyes answer it.",c:[
   {t:"Look into the water",fx:function(){flag("bloodmoon");mAdd("Ketsuryugan",7);hist("You met the blood moon in still water. Something looked back.","event")}},
   {t:"Keep your eyes down",fx:function(){addStat("discipline",1);flag("bloodmoon");hist("You kept your eyes down. The moon found you anyway, eventually.","event")}}]}]
};

/* ---------------- non-eye ladder engine ---------------- */
function reqMet(req){
  var ok=true;
  for(var k in req){
    if(k==="age"){ok=ok&&G.age>=req[k]}
    else if(k==="rank"){ok=ok&&rankN()>=req[k]}
    else if(k==="mastery"){ok=ok&&mAdd&&mLvl(currentM())>=req[k]}
    else if(k==="pot"){ok=ok&&pot()>=req[k]}
    else{ok=ok&&S(k)>=req[k]}
  }
  return ok;
}
function currentM(){var cl=clanOfSafe();return (cl&&BL_LADDERS[cl.n])?BL_LADDERS[cl.n].m:(cl&&cl.kg)||"Clan Mastery"}
function ladderTick(cl){
  var bl=ensure();if(!cl)return;
  var L=BL_LADDERS[cl.n];if(!L)return;
  var stg=bl.stage||0;
  if(stg<L.stages.length){
    var s=L.stages[stg];
    if(reqMet(s.req)&&chance(.5)){
      bl.stage=stg+1;
      var gains={};(L.stats||[]).forEach(function(k){gains[k]=2});
      for(var k in gains)addStat(k,gains[k]);
      unlockedAdd(L.m+" — "+s.n,(s.line||"")+" Passive: your "+L.stats.join(" and ")+" respond faster to training.",false);
      log("CLAN PROGRESSION — "+cl.n+": "+s.n+". "+(s.line||""));
      tl(G.age,"Clan progression: "+s.n+".");
      hist(L.m+" advances to "+s.n+".","stage");
      if(stg+1>=L.stages.length)grantTitle(cl.n+" "+["","Adept","Veteran","Elder","Pillar"][Math.min(4,L.stages.length)]||"Elder");
    }
  }else if(L.branch&&!bl.branchOpen){
    var b=L.branch;
    if(reqMet(b.req)&&chance(b.p)){
      bl.branchOpen=true;bl.branch=b.n;
      var g2={};(L.stats||[]).forEach(function(k){g2[k]=4});
      for(var k2 in g2)addStat(k2,g2[k2]);
      unlockedAdd(b.n,"A rare branch of the "+cl.n+" bloodline, opened by a lifetime of the clan's work. "+(b.hint||""),false);
      log("RARE BRANCH UNLOCKED — "+b.n+". "+(b.hint||""));
      tl(G.age,"Unlocked a rare clan branch: "+b.n+".");
      hist("Rare branch: "+b.n+".","branch");
      grantTitle(b.n);
    }
  }
}
/* KKG clans (Wood/Ice/Bone/Lava/Storm) also tick the ladder */
function kkgTick(cl){ladderTick(cl)}

/* ---------------- the Bloodline & Clan menu ---------------- */
var CSS_INJECTED=false;
function injectCss(){
  if(CSS_INJECTED)return;CSS_INJECTED=true;
  var s=document.createElement("style");
  s.textContent=".bl-wrap{margin:0 0 14px}.bl-row{display:flex;align-items:center;gap:8px;margin:6px 0}.bl-bar{flex:1;height:8px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden}.bl-bar>i{display:block;height:100%;background:linear-gradient(90deg,#8a5a2b,#dfb963);border-radius:6px}.bl-stage{padding:8px 10px;border:1px solid rgba(255,255,255,.09);border-radius:10px;margin:6px 0;background:rgba(255,255,255,.02)}.bl-stage.locked{opacity:.62}.bl-stage b{color:#dfb963}.bl-stage small{display:block;color:#9aa0a6;margin-top:2px}.bl-tomoe{font-size:20px;letter-spacing:4px;color:#c0392b}.bl-tomoe.dim{color:#4a2a2a}.bl-hint{color:#8fa5b5;font-style:italic}.bl-abil{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.07)}.bl-abil:last-child{border-bottom:0}.bl-use{white-space:nowrap}.bl-miles{max-height:170px;overflow-y:auto}.bl-eye{font-size:22px;text-align:center;padding:6px 0;letter-spacing:5px;color:#c0392b}.bl-eye .dim{color:#4a2a2a}.bl-flag{font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid rgba(223,185,99,.4);color:#dfb963;margin-right:6px}";
  document.head.appendChild(s);
}
function stageList(){
  var cl=clanOfSafe(),bl=ensure();if(!cl)return [];
  if(cl.kg&&EYE_PATHS[cl.kg]){
    var ep=EYE_PATHS[cl.kg],eye=bl.eye,out=[];
    if(ep.clan==="Uchiha"){
      var stages=["Dormant","1 Tomoe","2 Tomoe","3 Tomoe"];
      for(var i=0;i<4;i++){
        var unlocked=eye?(i===0||eye.tomoe>=i):false;
        var line=i===0?"The wheel sleeps in every Uchiha. It opens for the heart, never the calendar."
          :["","Perception sharpens: movement reading, early chakra sight, small combat prediction.","Reaction and prediction deepen: technique observation, better combat reads, genjutsu recognition.","Advanced prediction and perception, higher copying potential, genjutsu proficiency, full Sharingan mastery."][i];
        out.push({n:stages[i],unlocked:unlocked,line:line});
      }
    }else{
      var stages2=["Dormant"].concat(ep.stageNames);
      var mL=mLvl(cl.kg);
      for(var j=0;j<stages2.length;j++){
        var needArr=[0,35,65,92];
        var un2=eye?(j===0||(bl.eye.stage>=j-1&&mL>=needArr[j])):false;
        var lines=["The eyes open for those who look without fear. The elders teach looking, early and often.","Chakra perception, sight range, precision: the eye learns its range.","Chakra pathway perception and combat awareness. The Gentle Fist gains its map.","Pinnacle: near-total battlefield reading at clan-record range."];
        if(cl.kg==="Ketsuryugan")lines=["The valley's eyes sleep in your blood and wake near the water, under the right moon.","Crimson awakening: hypnotic gaze, chakra sense through earth and air.","Hypnotic mastery: layered illusions, resonance with the valley's wards.","Blood moon pinnacle: the valley's full inheritance, spoken of only in exile stories."];
        out.push({n:stages2[j],unlocked:un2,line:lines[Math.min(j,lines.length-1)]});
      }
    }
    return out;
  }
  var L=BL_LADDERS[cl.n];if(!L)return [];
  var out2=[];
  for(var i2=0;i2<L.stages.length;i2++){
    out2.push({n:L.stages[i2].n,unlocked:(bl.stage||0)>i2,line:L.stages[i2].line});
  }
  if(L.branch)out2.push({n:L.branch.n,unlocked:bl.branchOpen,line:"Locked. "+L.branch.hint,locked:true});
  return out2;
}
function eyeDisplay(){
  var cl=clanOfSafe(),bl=ensure();if(!cl||!cl.kg||!EYE_PATHS[cl.kg])return null;
  var eye=bl.eye;
  if(!eye)return {t:"Dormant",sub:cl.kg+" sleeps in your blood.",dots:null};
  if(eye.kind==="Sharingan"){
    var t=eye.tomoe,dots="";
    for(var i=1;i<=3;i++)dots+='<span class="'+(i<=t?"":"dim")+'">◉</span>';
    var head=eye.ms?"Mangekyo Sharingan":"Sharingan — "+t+" Tomoe";
    var sub=(eye.ems?"ETERNAL · ":"")+(eye.patterns&&eye.patterns.length&&eye.ms?"Pattern: "+eye.patterns[eye.patterns.length-1]+" · ":"")+"Vision "+Math.round(eye.vis)+"%";
    return {t:head,sub:sub,dots:dots};
  }
  if(eye.kind==="Byakugan")return {t:eye.stage>=3?"Byakugan Pinnacle":(EYE_PATHS.Byakugan.stageNames[eye.stage||0]||"Byakugan — Awakened"),sub:"Mastery "+mLvl("Byakugan")+"%"+(eye.tenseigan?" · TENSEIGAN":""),dots:null};
  return {t:eye.stage>=2?"Blood Moon Pinnacle":(EYE_PATHS.Ketsuryugan.stageNames[eye.stage||0]||"Ketsuryugan — Awakened"),sub:"Mastery "+mLvl("Ketsuryugan")+"%",dots:null};
}
function hintRow(t,d){var row=el("div","bl-stage locked");row.appendChild(el("b",null,t));row.appendChild(el("small","bl-hint",d));return row}
API.render=function(){
  var cl=clanOfSafe();if(!cl)return null;
  var bl=ensure();if(!bl)return null;
  injectCss();
  var col=rarityColor(cl.r);
  var p=panel("bloodline","Bloodline — The "+cl.n+" Clan");
  var top=el("div","clan-detail");
  var emb=el("div","cc-emb");emb.style.setProperty("--rc",col);emb.textContent=CLAN_KANJI[cl.n]||cl.n.charAt(0).toUpperCase();
  top.appendChild(emb);
  var right=el("div","clan-detailbody");
  var rb=el("span","cc-rar",(cl.secret?"SECRET":cl.r.toUpperCase())+" BLOODLINE");rb.style.setProperty("--rc",col);right.appendChild(rb);
  var ed=eyeDisplay();
  right.appendChild(el("div","cc-spec",ed?ed.t+" · "+ed.sub:cl.spec));
  right.appendChild(el("p","mtext",cl.d));
  top.appendChild(right);p.appendChild(top);
  if(ed&&ed.dots){var eyeRow=el("div","bl-eye");eyeRow.innerHTML=ed.dots;p.appendChild(eyeRow)}
  if(cl.pas){
    var tb=el("div","clan-block");
    tb.appendChild(el("b","clan-blocktitle","Inherited trait — "+cl.pas.n+" (always active)"));
    tb.appendChild(el("div","mtext",cl.pas.d));
    p.appendChild(tb);
  }
  var potRow=el("div","bl-row");
  potRow.appendChild(el("b",null,"Bloodline potential"));
  var pb=el("div","bl-bar");var pi=document.createElement("i");pi.style.width=Math.round(bl.pot/2)+"%";pb.appendChild(pi);
  potRow.appendChild(pb);
  potRow.appendChild(el("span","muted",bl.pot>=85?"exceptional":bl.pot>=65?"strong":bl.pot>=45?"present":"quiet"));
  p.appendChild(potRow);
  var mkey=currentM();
  var mRow=el("div","bl-row");
  mRow.appendChild(el("b",null,mkey+" mastery"));
  var mb=el("div","bl-bar");var mi=document.createElement("i");mi.style.width=mLvl(mkey)+"%";mb.appendChild(mi);
  mRow.appendChild(mb);
  mRow.appendChild(el("span","muted",mLvl(mkey)+"%"));
  p.appendChild(mRow);
  var sb=el("div","clan-block");
  sb.appendChild(el("b","clan-blocktitle","Progression stages"));
  stageList().forEach(function(s){
    var row=el("div","bl-stage"+(s.unlocked?"":" locked"));
    row.appendChild(el("b",null,(s.unlocked?"✦ ":"")+(s.locked&&!s.unlocked?"??? — "+s.n.replace(/^Locked\. /,""):s.n)));
    row.appendChild(el("small",null,s.line||""));
    sb.appendChild(row);
  });
  p.appendChild(sb);
  var evb=el("div","clan-block");
  evb.appendChild(el("b","clan-blocktitle","Deeper evolutions"));
  var ep2=eyePath();
  if(ep2&&ep2.clan==="Uchiha"&&bl.eye){
    if(!bl.eye.ms)evb.appendChild(hintRow("???","A wheel that spins no further wants to become something else entirely. The clan's records stop being records at this point."));
    else if(!bl.eye.ems)evb.appendChild(hintRow("The eternal wheel","Vision once spent does not return. Unless. The clan performed a rite twice in its history, and sealed the third account."));
  }
  if((cl.n==="Otsutsuki"||cl.n==="Hagoromo")&&!bl.rinnegan){
    evb.appendChild(hintRow("The sage's wheel","The lineage predates the villages. One eye predates the lineage. The shrine beneath the old seal has been waiting."));
  }
  if(cl.n==="Hyuga"&&!bl.tenseigan){
    if(!hasFlag("otsutsukiLine"))evb.appendChild(hintRow("???","Somewhere in the clan's recorded history, a pale-haired stranger married in and stayed exactly one winter."));
    else evb.appendChild(hintRow("The pale wheel","The other inheritance. It answers blood plus mastery plus something the elders will not name."));
  }
  if(cl.n==="Chinoike"&&bl.eye)evb.appendChild(hintRow("The drowned valley","The eyes' full power was demonstrated once, on a valley. The demonstration is why the clan is called extinct."));
  var L2=BL_LADDERS[cl.n];
  if(L2&&L2.branch&&!bl.branchOpen)evb.appendChild(hintRow("A rare branch",""+L2.branch.hint));
  if(!evb.lastChild||evb.lastChild.tagName==="B")evb.appendChild(el("div","mtext","The elders say this blood's deep evolutions are not written where children read."));
  p.appendChild(evb);
  if(bl.unlocked.length){
    var ab=el("div","clan-block");
    ab.appendChild(el("b","clan-blocktitle","Abilities unlocked in this life"));
    bl.unlocked.forEach(function(u){
      var row=el("div","bl-abil");
      var who=el("div","who");
      who.appendChild(el("b",null,u.n));
      who.appendChild(el("span",null,u.d||""));
      row.appendChild(who);
      if(u.n.indexOf("Mangekyo:")===0){
        var btn=el("button","btn small bl-use","Use");
        btn.onclick=function(){useMangekyo()};
        row.appendChild(btn);
      }
      ab.appendChild(row);
    });
    p.appendChild(ab);
  }
  if(bl.titles.length){
    var tr=el("div","bl-row");
    bl.titles.forEach(function(t){tr.appendChild(el("span","bl-flag",t))});
    p.appendChild(tr);
  }
  if(cl.hist)p.appendChild(el("div","mtext",cl.hist));
  if(bl.history.length){
    var hb=el("div","clan-block");
    hb.appendChild(el("b","clan-blocktitle","Lifetime clan milestones"));
    var list=el("div","bl-miles");
    bl.history.slice(-14).reverse().forEach(function(h){
      var row=el("div","list-row");
      var who=el("div","who");
      who.appendChild(el("b",null,"Age "+h.age));
      who.appendChild(el("span",null,h.txt));
      row.appendChild(who);
      if(h.k){var tag=el("span","rar",h.k);tag.style.color=col;row.appendChild(tag)}
      list.appendChild(row);
    });
    hb.appendChild(list);p.appendChild(hb);
  }
  return p;
};

/* ---------------- hooks & init ---------------- */
function wrapRenderClan(){
  if(typeof renderClan!=="function")return;
  var orig=renderClan;
  window.renderClan=function(){
    var wasEmpty=false;
    try{orig()}catch(e){throw e}
    try{
      var cl=clanOfSafe();
      if(cl&&!CLAN_UI.detail){
        var v=document.querySelector("#view-clan");
        if(v){
          var p=API.render();
          if(p){
            var first=v.firstElementChild;
            if(first)v.insertBefore(p,first);else v.appendChild(p);
          }
        }
      }
    }catch(e){console.warn("bl render",e)}
  };
}
function wrapAgeUp(){
  if(typeof ageUp!=="function")return;
  var orig=window.ageUp;
  window.ageUp=function(){
    STAT_SNAP=STAT_SNAP||statSnapshot();
    var r=orig.apply(this,arguments);
    try{if(G&&G.alive)API.ageYear()}catch(e){console.warn("bl year",e)}
    return r;
  };
}
function wrapCombat(){
  function post(win){
    try{
      var tier=RC&&RC.e&&RC.e.tier||1,ctx=RC&&RC.ctx||"";
      API.combatNote(win,tier,ctx);
    }catch(e){}
  }
  if(typeof rcWin==="function"&&!window.rcWin.__bl){var a=rcWin;window.rcWin=function(){post(true);return a.apply(this,arguments)};window.rcWin.__bl=1}
  if(typeof rcLose==="function"&&!window.rcLose.__bl){var b=rcLose;window.rcLose=function(){post(false);return b.apply(this,arguments)};window.rcLose.__bl=1}
}
function wrapClanChange(){
  if(typeof changeClan!=="function")return;
  var orig=window.changeClan;
  window.changeClan=function(c){
    var old=G.bl;
    var r=orig.apply(this,arguments);
    try{
      G.bl=freshBl(clanOfSafe());
      if(old&&old.history)G.bl.history=old.history.slice(-6);
      hist("The blood changes. The old blood sleeps; the new blood wakes.","change");
      STAT_SNAP=statSnapshot();
    }catch(e){}
    return r;
  };
}
function init(){
  if(window.__BL_INIT)return;window.__BL_INIT=true;
  var tries=0;
  var t=setInterval(function(){
    tries++;
    var ok=typeof renderClan==="function"&&typeof ageUp==="function"&&typeof rcWin==="function";
    if(ok||tries>120){
      clearInterval(t);
      if(ok){wrapRenderClan();wrapAgeUp();wrapCombat();wrapClanChange()}
      if(G&&G.stats){ensure();STAT_SNAP=statSnapshot()}
    }
  },100);
}
API.init=init;
API.hint=hintRow;
return API;
})();
window.addEventListener("load",function(){try{BL.init()}catch(e){}});
if(document.readyState==="complete"){try{BL.init()}catch(e){}}
