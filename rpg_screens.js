/* ============================ RPG OVERHAUL v5: screens ============================ */
/* RPG hub tab: train, jutsu, chakra, spar, missions, exams, skill tree */
var RPG_TAB="train";
function rpgOpen(tab){RPG_TAB=tab||RPG_TAB||"train";var d=el("#rpg-screen");if(!d){d=document.createElement("div");d.id="rpg-screen";d.className="rpg-screen";document.body.appendChild(d)}rpgRender();d.style.display="flex"}
function rpgClose(){var d=el("#rpg-screen");if(d)d.style.display="none";if(VIEW==="rpg"){VIEW="home";try{render()}catch(e){}}}
function rpgRender(){
  var d=el("#rpg-screen");if(!d)return;var r=rpgInit(G);
  var subs=[["train","Train"],["jutsu","Jutsu"],["chakra","Chakra"],["spar","Spar"],["missions","Missions"],["exams","Exams"],["skills","Skill Tree"]];
  d.innerHTML="<div class='rpg-wrap'><div class='rpg-head'><span class='rpg-title'>The Way of the Shinobi</span><span class='rpg-meta'>Lv "+r.level+" · "+r.xp+" / "+rpgXpFor(r.level+1)+" XP · "+r.skillPts+" SP · "+(G.rank||"Academy")+"</span><button class='rpg-x' onclick='rpgClose()'>✕</button></div><div class='rpg-subnav'>"+subs.map(function(s){return "<button class='rpg-sub"+(RPG_TAB===s[0]?" on":"")+"' onclick='RPG_TAB=\""+s[0]+"\";rpgRender()'>"+s[1]+"</button>"}).join("")+"</div><div class='rpg-body' id='rpg-body'></div></div>";
  var b=el("#rpg-body");
  if(RPG_TAB==="train")rpgBodyTrain(b);
  else if(RPG_TAB==="jutsu")rpgBodyJutsu(b);
  else if(RPG_TAB==="chakra")rpgBodyChakra(b);
  else if(RPG_TAB==="spar")rpgBodySpar(b);
  else if(RPG_TAB==="missions")rpgBodyMissions(b);
  else if(RPG_TAB==="exams")rpgBodyExams(b);
  else if(RPG_TAB==="skills")rpgBodySkills(b);
}
function rpgUnlocked(a){
  var r=G.rpg,u=a.unlock||{};
  if(u.lvl&&r.level<u.lvl)return false;
  if(u.stat)for(var k in u.stat){if(rpgStat(k)<u.stat[k])return false}
  return true;
}
function rpgBodyTrain(b){
  var r=G.rpg;
  b.innerHTML="<p class='rpg-note'>Training costs stamina, sharpens a stat through a live drill, and pays XP. Repeat the same drill in a row and the gains taper off — vary your routine. Current fatigue: "+Math.round(r.fatigue||0)+"%"+((r.fatigue||0)>=50?" (heavy — gains reduced)":"")+"</p>";
  RPG.TRAIN.forEach(function(a){
    var un=rpgUnlocked(a);
    var card=document.createElement("div");card.className="rpg-card"+(un?"":" locked");
    var tc=r.trainCount[a.n]||0;
    card.innerHTML="<div class='rc-top'><b>"+a.n+"</b><span class='rpg-chip'>"+a.stat+"</span></div><p>"+a.desc+"</p><div class='rpg-foot'><span>−"+a.stam+" stamina · +"+a.xp+" XP"+(tc?" · trained "+tc+"× (gains "+Math.round(Math.max(0.3,1-tc*0.06)*100)+"%)":"")+"</span>"+(un?"<button class='rpg-btn'>Train</button>":"<span class='rpg-lock'>🔒 needs "+(a.unlock.lvl?"lvl "+a.unlock.lvl:"")+((a.unlock.lvl&&a.unlock.stat)?" + ":"")+Object.keys(a.unlock.stat||{}).map(function(k){return k+" "+a.unlock.stat[k]}).join(", ")+"</span>")+"</div>";
    if(un)card.querySelector("button").onclick=function(){rpgTrain(a)};
    b.appendChild(card);
  });
}
/* ---------- jutsu ---------- */
function rpgBodyJutsu(b){
  var r=G.rpg;
  var known=Object.keys(r.jutsu||{});
  var slots=rpgRankSlots()+rpgPassive().slots;
  b.innerHTML="<div class='rpg-loadout'><b>Loadout "+(r.loadout||[]).length+" / "+slots+" equipped</b><p class='rpg-note'>Combat uses only your equipped techniques. Tap a known jutsu to equip or unequip it; slots grow with rank.</p><div class='rpg-lo'>"+(r.loadout||[]).map(function(n){return "<span class='rpg-chip on'>"+n+"</span>"}).join("")+"</div></div>";
  var learnable=[],knownList=[];
  RPG.JUTSU.forEach(function(j){
    var has=!!r.jutsu[j.n];
    var el=canLearnReq(j);
    if(has)knownList.push(j);else if(el)learnable.push(j);
  });
  knownList.sort(function(x,y){return RPG.RANKS.indexOf(x.rank)-RPG.RANKS.indexOf(y.rank)});
  b.insertAdjacentHTML("beforeend","<h3 class='rpg-h3'>Known techniques ("+knownList.length+")</h3>");
  knownList.forEach(function(j){b.appendChild(rpgJutCard(j,true))});
  b.insertAdjacentHTML("beforeend","<h3 class='rpg-h3'>Learnable now ("+learnable.length+")</h3>");
  if(!learnable.length)b.insertAdjacentHTML("beforeend","<p class='rpg-note'>Nothing is within reach yet. Train your stats, raise your rank, find a teacher, or earn scrolls in the field.</p>");
  learnable.forEach(function(j){b.appendChild(rpgJutCard(j,false))});
  b.insertAdjacentHTML("beforeend","<h3 class='rpg-h3'>Beyond reach ("+(RPG.JUTSU.length-knownList.length-learnable.length)+")</h3><p class='rpg-note'>The library holds "+RPG.JUTSU.length+" techniques across "+([...new Set(RPG.JUTSU.map(function(j){return j.cat}))].length)+" disciplines. Everything locked lists what it demands.</p>");
  RPG.JUTSU.filter(function(j){return !r.jutsu[j.n]&&!canLearnReq(j)}).forEach(function(j){b.appendChild(rpgJutCard(j,false,true))});
}
function canLearnReq(j){
  var r=G.rpg;
  if(j.learn==="clan")return G.clanName&&j.req.clan===G.clanName&&r.level>=(j.req.lvl||1);
  if(j.req.clan)return false;
  if(j.req.lvl&&r.level<j.req.lvl)return false;
  if(j.req.el&&!(r.affinity===j.req.el||(r.extraEls||[]).indexOf(j.req.el)>=0))return false;
  if(j.req.stat)for(var k in j.req.stat){if(rpgStat(k)<j.req.stat[k])return false}
  if(j.learn==="scroll")return (r.scrolls||[]).indexOf(j.n)>=0;
  if(j.learn==="event")return false; /* events unlock these */
  return true;
}
function rpgReqText(j){
  var parts=[];var r=G.rpg;
  if(j.req.lvl)parts.push("level "+j.req.lvl);
  if(j.req.clan)parts.push(j.req.clan+" blood");
  if(j.req.el)parts.push(j.req.el+" affinity");
  if(j.req.stat)for(var k in j.req.stat)parts.push(k+" "+j.req.stat[k]);
  return parts.join(" · ");
}
function rpgJutCard(j,known,locked){
  var r=G.rpg;var st=r.jutsu[j.n]||{mastery:0};
  var card=document.createElement("div");card.className="rpg-card jut r"+j.rank.toLowerCase()+(known?"":" unknown");
  var m=st.mastery||0;
  var learnHow={self:"self-taught",scroll:"requires a scroll",clan:"clan teaching","event":"earned through deeds"}[j.learn]||"taught";
  var teacherName=j.learn.indexOf("teacher:")===0?(RPG.TEACHERS.filter(function(t){return t.id===j.learn.split(":")[1]})[0]||{}).n:null;
  card.innerHTML="<div class='rc-top'><b>"+j.n+"</b><span class='rj r"+j.rank.toLowerCase()+"'>"+j.rank+"</span><span class='rpg-chip'>"+j.cat+(j.el?" · "+j.el:"")+"</span></div><p>"+j.desc+"</p><div class='jut-stats'><span>"+rpgJutCost(j)+" chakra</span><span>cd "+rpgJutCd(j)+"</span><span>pow "+j.pow.toFixed(1)+"</span>"+(known?"<span>"+rpgMasteryTier(m)+" · "+m+"%</span>":"")+"</div>"+(known?"<div class='mbar'><i style='width:"+m+"%'></i></div><div class='rpg-foot'><span>"+(rpgMasteryTier(m)==="Mastered"?"Mastered — its full potential is yours":"Practice to deepen mastery (more power, less cost, faster recovery)")+"</span>"+(rpgMasteryTier(m)!=="Mastered"?"<button class='rpg-btn'>Practice</button>":"")+(r.loadout.indexOf(j.n)>=0?"<button class='rpg-btn ghost'>Unequip</button>":"<button class='rpg-btn ghost'>Equip</button>")+"</div>":"<div class='rpg-foot'><span>Requires: "+(rpgReqText(j)||"nothing more")+"</span>"+(!locked&&!j.req.clan&&j.learn!=="event"?"<button class='rpg-btn'>Learn"+(teacherName?" from "+teacherName:"")+"</button>":"<span class='rpg-lock'>"+learnHow+"</span>")+"</div>");
  if(known){
    var pb=card.querySelector(".rpg-foot .rpg-btn");if(pb&&!rpgMasteryTier(m).includes("Mastered"))pb.onclick=function(){rpgPracticeJutsu(j)};
    var eb=card.querySelectorAll(".rpg-foot .rpg-btn")[rpgMasteryTier(m)!=="Mastered"?1:0];
    if(eb)eb.onclick=function(){rpgToggleEquip(j.n)};
  }else if(!locked&&!j.req.clan&&j.learn!=="event"){
    card.querySelector(".rpg-foot .rpg-btn").onclick=function(){rpgLearnJutsu(j)};
  }
  return card;
}
function rpgToggleEquip(n){
  var r=G.rpg;var slots=rpgRankSlots()+rpgPassive().slots;
  var i=r.loadout.indexOf(n);
  if(i>=0){r.loadout.splice(i,1);fbig(n+" unequipped.")}
  else if(r.loadout.length>=slots){toast("Loadout full ("+slots+" slots). Unequip something first.")}
  else{r.loadout.push(n);fbig(n+" equipped for combat.")}
  rpgRender();
}
function rpgLearnJutsu(j){
  var r=G.rpg;
  if(j.learn==="scroll"){var i=r.scrolls.indexOf(j.n);if(i>=0)r.scrolls.splice(i,1)}
  if(j.learn.indexOf("teacher:")===0){var cost=40+RPG.RANKS.indexOf(j.rank)*45;if((G.ryo||0)<cost){toast("A teacher wants "+cost+" ryō for this lesson.");return}G.ryo-=cost}
  r.jutsu[j.n]={mastery:0,age:G.age};
  if(r.loadout.length<rpgRankSlots()+rpgPassive().slots)r.loadout.push(j.n);
  rpgAddXp(15);
  fbig("You learned "+j.n+"!"+(j.learn.indexOf("teacher:")===0?" Your sensei drills the form into you over days of practice.":""));
  rpgRender();
}
function rpgPracticeJutsu(j){
  var r=G.rpg;
  if((G.stats.stamina||10)<8){toast("Too drained to practice. Rest first.");return}
  G.stats.stamina=Math.max(0,(G.stats.stamina||10)-8);
  r.fatigue=Math.min(100,(r.fatigue||0)+6);
  var aff=(r.affinity===j.el||(r.extraEls||[]).indexOf(j.el)>=0)?1.15:1;
  rpgMinigame({n:"Practice: "+j.n,type:"sequence"},function(score){
    var gain=(2+score*0.08)*aff*Math.max(0.3,1-(r.jutsu[j.n].mastery/100));
    r.jutsu[j.n].mastery=Math.min(100,Math.round((r.jutsu[j.n].mastery+gain)*10)/10);
    var xp=Math.round(10+score*0.15);rpgAddXp(xp);
    fbig("Practice — "+j.n+": "+Math.round(score)+" drill score. Mastery +"+gain.toFixed(1)+"% → "+r.jutsu[j.n].mastery+"% · +"+xp+" XP");
    rpgRender();
  });
}
/* ---------- chakra ---------- */
function rpgBodyChakra(b){
  var s=G.stats,r=G.rpg;
  var chMax=rpgCalc().maxCh,cur=Math.round(s.chakra||0);
  var clan=G.clan||null;
  b.innerHTML="<div class='rpg-card'><div class='rc-top'><b>Chakra Development</b></div><div class='cbar hp'><i style='width:"+Math.min(100,cur/chMax*100)+"%'></i></div><div class='cgrid'><span>Current chakra</span><b>"+cur+" / "+chMax+"</b><span>Chakra capacity</span><b>"+Math.round(s.chakraMax||20)+"</b><span>Chakra control</span><b>"+Math.round(s.chakraControl||10)+"</b><span>Chakra recovery</span><b>"+Math.round(s.chakraRecovery||10)+" /turn</b><span>Efficiency</span><b>"+Math.max(0,100-Math.round(rpgPassive().chakraEff||0))+"% cost</b><span>Output</span><b>+"+Math.round(rpgPassive().jutPow||0)+"% technique power</b></div><p class='rpg-note'>Progress: "+Math.max(0,chMax-cur)+" chakra to your next milestone. Capacity grows through meditation; control through drills, tree climbing and water walking.</p></div>";
  var bonuses=[];
  if(clan&&clan.pas){bonuses.push("Clan passive — "+clan.pas.n+": "+clan.pas.d)}
  var vill=(G.village||"").toLowerCase();
  bonuses.push("Village — "+G.village+": village birth passive applies to learning and survival.");
  if(r.affinity)bonuses.push("Elemental affinity — "+r.affinity+(r.extraEls&&r.extraEls.length?" + "+r.extraEls.join(", "):"")+": matching-element jutsu learn faster and hit harder.");
  if(!r.affFound)bonuses.push("Affinity: undiscovered. A chakra paper test at the academy will reveal your nature.");
  b.insertAdjacentHTML("beforeend","<h3 class='rpg-h3'>Active bonuses</h3>"+bonuses.map(function(x){return "<div class='rpg-card'><p>"+x+"</p></div>"}).join(""));
  if(!r.affFound&&rpgStat("chakraControl")>=12){
    var t=document.createElement("button");t.className="rpg-btn wide";t.textContent="Take the chakra paper test";
    t.onclick=function(){
      var pool=["Fire","Water","Wind","Earth","Lightning"];
      var bias={Konohagakure:"Fire",Sunagakure:"Wind",Kirigakure:"Water",Iwagakure:"Earth",Kumogakure:"Lightning",Amegakure:"Water",Otougakure:"Earth"}[G.village];
      var el2=(Math.random()<0.5&&bias)?bias:pool[Math.floor(Math.random()*pool.length)];
      r.affFound=true;r.affinity=el2;
      fbig("You press chakra into the paper. It "+({Fire:"ignites and burns",Water:"soaks and wilts",Wind:"splits in two",Earth:"crumbles to dust",Lightning:"crinkles and folds"}[el2])+". Your nature is "+el2+".");
      rpgAddXp(20);rpgRender();
    };
    b.appendChild(t);
  }
}
/* ---------- spar ---------- */
function rpgBodySpar(b){
  var r=G.rpg;
  b.innerHTML="<p class='rpg-note'>Sparring is live combat: every turn is yours to choose. It pays training XP, sharpens taijutsu, stokes rivalries, and tests new jutsu with no real wounds.</p><div class='rpg-diff'><button class='rpg-sub on' data-d='easy'>Easy</button><button class='rpg-sub' data-d='normal'>Normal</button><button class='rpg-sub' data-d='hard'>Hard</button></div>";
  var diff="easy";r._sparDiff=r._sparDiff||"easy";
  b.querySelectorAll(".rpg-diff .rpg-sub").forEach(function(x){if(x.dataset.d===r._sparDiff)x.classList.add("on");else if(x.dataset.d!==r._sparDiff)x.classList.remove("on");
    x.onclick=function(){r._sparDiff=x.dataset.d;rpgRender()}});
  [["academy","Spar an academy student","A fellow student, still learning their feet."],["teammate","Spar your teammate","Your own squadmate. They know your habits."],["rival","Challenge your rival","Personal. Pride on the line."],["jonin","Challenge an elite jonin","Way above your weight. Glory or bruises."]].forEach(function(o){
    var e=RPG.ENEMIES.filter(function(x){return x.id===o[0]})[0];
    var c=document.createElement("div");c.className="rpg-card";
    c.innerHTML="<div class='rc-top'><b>"+o[1]+"</b><span class='rpg-chip'>T"+e.tier+" · +"+e.xp+" XP</span></div><p>"+o[2]+"</p><div class='rpg-foot'><span></span><button class='rpg-btn'>Spar</button></div>";
    c.querySelector("button").onclick=function(){rpgClose();rpgCombatStart({enemyId:o[0],context:"spar",diff:G.rpg._sparDiff||"easy",onEnd:function(res){rpgOpen("spar")}})};
    b.appendChild(c);
  });
}
/* ---------- missions ---------- */
RPG.MISSIONS=[
{id:"patrolD",rank:"D",n:"Village Patrol",type:"patrol",desc:"Walk the perimeter. Report what moves.",stages:[["choice","You find a torn satchel on the path.",["Take it to the lost post (+reputation, +2 rep)","Open it (small ryō, −1 rep)"]],["combat","bandit","A scavenger thinks you are easy prey."]],req:{lvl:4},xp:60,ryō:80},
{id:"escortC",rank:"C",n:"Escort Duty",type:"escort",desc:"Guard a merchant caravan to the border.",stages:[["choice","The merchant begs a shortcut through wolf country.",["Take the long road (+stamina test later, safe)","Short cut (ambush chance)"]],["combat","bandit","Bandits hit the rear cart at dusk."],["skill","Tracking","Keep the trail through the night."]],req:{lvl:8},xp:140,ryō:220},
{id:"trackC",rank:"C",n:"Tracking Run",type:"tracking",desc:"Follow a stolen-goods trail into the hills.",stages:[["skill","Perception","Read the ground for sign."],["combat","rogue","The thief doubles back with friends."]],req:{lvl:9},xp:150,ryō:240},
{id:"investB",rank:"B",n:"Investigation",type:"investigation",desc:"A merchant family is missing. Find out why.",stages:[["choice","A witness will talk only off the record.",["Press gently (+Int check, truth)","Pay for the name (−300 ryō, truth)"]],["combat","rogue","Whoever did it does not want company."]],req:{lvl:13},xp:260,ryō:420},
{id:"captureB",rank:"B",n:"Capture Contract",type:"capture",desc:"Bring a rogue chunin in alive.",stages:[["combat","chunin","The rogue fights to stay free."],["choice","They beg for a second chance mid-fight.",["Show mercy (+reputation, they surrender)","Refuse (bonus ryō, −reputation)"]]],req:{lvl:16},xp:380,ryō:600},
{id:"survivalA",rank:"A",n:"Survival Exercise",type:"survival",desc:"A week behind enemy lines, no support.",stages:[["skill","Stamina","Endure the crossing."],["combat","chunin","A patrol finds your camp."],["combat","boss","Their commander takes it personally."]],req:{lvl:20},xp:700,ryō:1100},
{id:"assassA",rank:"A",n:"A-Rank Sabotage",type:"combat",desc:"Disrupt an enemy supply line. Quietly, or not.",stages:[["combat","rogue","Sentries on the ridge."],["combat","chunin","The garrison commander."]],req:{lvl:22},xp:800,ryō:1300},
{id:"warS",rank:"S",n:"S-Rank: The War Front",type:"boss",desc:"The village calls on you where the war is thickest.",stages:[["combat","chunin","First line of resistance."],["combat","boss","The enemy ace."]],req:{lvl:26},xp:1500,ryō:2500}
];
function rpgBodyMissions(b){
  var r=G.rpg,myRank=(G.rank||"");
  var rankIdx={"Academy Student":0,Genin:1,"Chunin":2,"Jonin":3,Anbu:4};
  var mine=rankIdx[myRank]==null?1:rankIdx[myRank];
  b.innerHTML="<p class='rpg-note'>Missions run in stages: choices, skill checks, and live combat. Your rank and level gate the board. Completed: "+((r.missions||[]).length)+".</p>";
  RPG.MISSIONS.forEach(function(m){
    var gated=r.level<(m.req.lvl||1);
    var c=document.createElement("div");c.className="rpg-card"+(gated?" locked":"");
    c.innerHTML="<div class='rc-top'><b>"+m.n+"</b><span class='rj r"+m.rank.toLowerCase()+"'>"+m.rank+"</span></div><p>"+m.desc+"</p><div class='rpg-foot'><span>+"+m.xp+" XP · +"+m.ryō+" ryō · scroll chance"+(gated?" · needs level "+m.req.lvl:"")+"</span>"+(gated?"":"<button class='rpg-btn'>Accept</button>")+"</div>";
    if(!gated)c.querySelector("button").onclick=function(){rpgRunMission(m)};
    b.appendChild(c);
  });
}
function rpgRunMission(m){
  rpgClose();var st=0,r=G.rpg;var rew={xp:m.xp,ryō:m.ryō};
  function next(){
    if(st>=m.stages.length){finish(true);return}
    var s=m.stages[st];st++;
    if(s[0]==="choice"){rpgChoice(s[1],s[2],function(i){if(i===0)rew.rep=(rew.rep||0)+2;if(i===1&&m.id==="patrolD")rew.ryō+=40;if(m.id==="investB"&&i===1)rew.ryō-=300;next()})}
    else if(s[0]==="skill"){var stat=s[1];var ok=rpgStat(stat)>=30+st*6;rpgMsg(s[2]+" ("+stat+" check, your "+rpgStat(stat)+")",ok?"You handle it with skill.":"It goes badly, but you push through.");setTimeout(next,1400)}
    else if(s[0]==="combat"){rpgMsg(s[2],null);setTimeout(function(){rpgCombatStart({enemyId:s[1],context:"mission",diff:m.rank==="S"?"hard":"normal",onEnd:function(res){if(!res.win){finish(false);return}next()}})},900)}
  }
  function finish(won){
    var rec={m:m.n,rank:m.rank,when:G.age,won:won};
    r.missions.push(rec);
    if(won){rpgAddXp(rew.xp);G.ryo=(G.ryo||0)+rew.ryō;G.reputation=(G.reputation||0)+(rew.rep||2);
      var scroll=null;if(["C","B","A","S"].indexOf(m.rank)>=0&&Math.random()<0.4){var pool=RPG.JUTSU.filter(function(j){return j.learn==="scroll"&&j.req.lvl<=(r.level||1)+1});if(pool.length)scroll=pool[Math.floor(Math.random()*pool.length)].n;r.scrolls.push(scroll)}
      fbig("Mission complete — "+m.n+": +"+rew.xp+" XP, +"+rew.ryō+" ryō, +"+(rew.rep||2)+" reputation"+(scroll?", scroll: "+scroll:"")+".")}
    else{fbig("Mission failed — "+m.n+". You made it home. +"+Math.round(m.xp*0.2)+" XP for surviving.");rpgAddXp(Math.round(m.xp*0.2));G.reputation=Math.max(0,(G.reputation||0)-1)}
    if(typeof render==="function")render();
  }
  next();
}
/* ---------- exams ---------- */
RPG.QUIZ=[["Which element beats Water?","Earth","Fire","Wind",0],["Which element beats Lightning?","Wind","Fire","Earth",0],["Substitution technique is used to…","Evade one attack","Heal wounds","Boost speed",0],["Chakra control is trained best by…","Climbing trees with chakra soles","Eating more","Running laps",1],["A genin team is typically led by a…","Jonin sensei","Academy student","Civilian",0],["Which rank is the highest mission rank here?","S-rank","A-rank","B-rank",0],["Hand seals are used to…","Shape chakra into techniques","Store weapons","Send messages",0],["The safest response to an unknown trap is…","Detour quietly","Spring it","Dance on it",0],["Medical chakra is usually which nature blend?","Yang","Fire","Lightning",0],["A shinobi's first duty is…","The mission","Lunch","Sleep",0]];
function rpgBodyExams(b){
  var r=G.rpg;
  var lastGrad=(r.exams||[]).filter(function(x){return x.k==="grad"});
  var lastChunin=(r.exams||[]).filter(function(x){return x.k==="chunin"});
  b.innerHTML="<p class='rpg-note'>Exams are played, not watched: written tests, live chakra trials and real bouts. Fail one and you can re-take it a year later.</p>";
  var cards=[];
  var lastFail=(r.exams||[]).filter(function(x){return x.k==="grad"&&!x.pass}).slice(-1)[0];
  var gradOk=!G.examDone||(G.examDone==="failed"&&G.age>(lastFail?lastFail.age:-1));
  cards.push({k:"grad",n:"Academy Graduation",d:"Written test, chakra control trial, practical technique test, final bout.",need:gradOk,note:G.examDone==="passed"?"Passed — you wear the headband.":G.examDone==="failed"?"You failed. Re-take it once a year has passed.":"Required to graduate.",go:rpgExamGrad});
  cards.push({k:"chunin",n:"Chunin Exams",d:"Written exam, survival stage, tournament bracket.",need:(G.rank==="Genin")&&r.level>=10,note:G.rank==="Genin"?"Open at level 10.":"Requires Genin rank.",go:rpgExamChunin});
  ["Jonin","Anbu"].forEach(function(rk){
    if(G.rank==="Chunin"&&rk==="Jonin"&&r.level>=18)cards.push({k:"rank"+rk,n:"Jonin Advancement",d:"A special mission, a live evaluation and a ranked bout.",need:true,note:"Open at level 18.",go:function(){rpgExamRank("Jonin")}});
    if(G.rank==="Jonin"&&rk==="Anbu"&&r.level>=24)cards.push({k:"rankAnbu",n:"Anbu Selection",d:"A masked trial in the dark.",need:true,note:"Open at level 24.",go:function(){rpgExamRank("Anbu")}});
  });
  cards.forEach(function(c){
    var d=document.createElement("div");d.className="rpg-card"+(c.need?"":" locked");
    d.innerHTML="<div class='rc-top'><b>"+c.n+"</b></div><p>"+c.d+"</p><div class='rpg-foot'><span>"+c.note+"</span>"+(c.need?"<button class='rpg-btn'>Begin</button>":"")+"</div>";
    if(c.need)d.querySelector("button").onclick=c.go;
    b.appendChild(d);
  });
}
function rpgExamGrad(){
  rpgClose();var r=G.rpg;var score=0;
  rpgQuiz("Academy written test",3,function(s1){
    score+=s1;
    rpgMsg("Chakra control trial — hold the flow steady.",null);
    setTimeout(function(){rpgMinigame({n:"Chakra control trial",type:"hold"},function(s2){
      score+=Math.round(s2/100*2);
      rpgMsg("Practical: show your technique against a live opponent.",null);
      setTimeout(function(){
        var jutsuOk=(Object.keys(r.jutsu||{}).length>0);
        rpgCombatStart({enemyId:"academy",context:"exam",diff:"easy",onEnd:function(res){
          score+=res.win?3:0;
          var pass=score>=5;
          r.exams.push({k:"grad",age:G.age,score:score,pass:pass});
          if(pass){G.examDone="passed";if(G.rank==="Academy Student"||!G.rank){promote&&promote("Genin","You passed the academy exams.")}
            rpgAddXp(120);fbig("GRADUATION PASSED — score "+score+"/8. You are a shinobi of the village now.")}
          else{G.examDone="failed";fbig("Graduation failed — score "+score+"/8. Train for a year and try again.")}
          if(typeof render==="function")render();
        }});if(!jutsuOk)rcLog&&0;
      },900);
    })},900);
  });
}
function rpgExamChunin(){
  rpgClose();var r=G.rpg;
  rpgQuiz("Chunin written exam",5,function(s1){
    rpgMsg("Survival stage: days in the training grounds, hunted.",null);
    setTimeout(function(){
      rpgCombatStart({enemyId:"rogue",context:"exam",diff:"normal",onEnd:function(res1){
        if(!res1.win){r.exams.push({k:"chunin",age:G.age,pass:false});fbig("Eliminated in the survival stage. The exams are done for this year.");return}
        rpgMsg("Tournament: your bracket match begins.",null);
        setTimeout(function(){
          rpgCombatStart({enemyId:"teammate",context:"exam",diff:"hard",onEnd:function(res2){
            var pass=res2.win;
            r.exams.push({k:"chunin",age:G.age,written:s1,pass:pass});
            if(pass){promote&&promote("Chunin","You took the Chunin Exams and won your bracket.");rpgAddXp(400)}
            else fbig("You fell in the tournament. Written score "+s1+"/5. The experience counts for something.");
            if(typeof render==="function")render();
          }});
        },900);
      }});
    },900);
  });
}
function rpgExamRank(rk){
  rpgClose();var r=G.rpg;
  rpgCombatStart({enemyId:"jonin",context:"exam",diff:"hard",onEnd:function(res){
    var ok=res.win&&rpgStat("ninjutsu")>=25&&rpgStat("taijutsu")>=20;
    r.exams.push({k:rk,age:G.age,pass:ok});
    if(ok){promote&&promote(rk,"The evaluation board approves your advancement.");rpgAddXp(600)}
    else fbig("Advancement denied. The board wants more from you first.");
    if(typeof render==="function")render();
  }});
}
/* ---------- skill tree ---------- */
function rpgBodySkills(b){
  var r=G.rpg,p=rpgPassive();
  b.innerHTML="<p class='rpg-note'>Skill points come from levels. Build your shinobi your own way — nothing here is linear. Points available: <b>"+r.skillPts+"</b></p>";
  RPG.SKILLTREE.branches.forEach(function(br){
    var col=document.createElement("div");col.className="rpg-branch";
    col.innerHTML="<div class='rc-top'><b>"+br.n+"</b></div><p class='rpg-note'>"+br.desc+"</p>";
    RPG.SKILLTREE.nodes.filter(function(n){return n.b===br.id}).forEach(function(n){
      var owned=r.skills[n.id];
      var ready=!owned&&n.req.every(function(x){return r.skills[x]});
      var d=document.createElement("div");d.className="rpg-node"+(owned?" owned":ready?" ready":" locked");
      d.innerHTML="<div class='rc-top'><b>"+n.n+"</b><span class='rpg-chip'>"+n.cost+" SP</span></div><p>"+n.desc+"</p>"+(owned?"<span class='rpg-lock'>owned</span>":ready?"<button class='rpg-btn'>Unlock</button>":"<span class='rpg-lock'>requires "+n.req.map(function(x){return (RPG.SKILLTREE.nodes.filter(function(y){return y.id===x})[0]||{}).n||x}).join(", ")+"</span>");
      if(ready)d.querySelector("button").onclick=function(){
        if(r.skillPts<n.cost){toast("Not enough skill points.");return}
        r.skillPts-=n.cost;r.skills[n.id]=true;fbig(n.n+" unlocked: "+n.desc);rpgRender();
      };
      col.appendChild(d);
    });
    b.appendChild(col);
  });
}
/* ---------- shared dialogs ---------- */
function rpgChoice(q,opts,cb){
  var d=document.createElement("div");d.className="rpg-modal";
  d.innerHTML="<div class='rpg-card'><p class='mg-q'>"+q+"</p></div>";
  var c=d.querySelector(".rpg-card");
  opts.forEach(function(o,i){var btn=document.createElement("button");btn.className="rpg-btn wide";btn.textContent=o;btn.onclick=function(){d.remove();cb(i)};c.appendChild(btn)});
  document.body.appendChild(d);
}
function rpgMsg(t,sub){
  var d=document.createElement("div");d.className="rpg-modal";
  d.innerHTML="<div class='rpg-card'><p class='mg-q'>"+t+"</p>"+(sub?"<p class='rpg-note'>"+sub+"</p>":"")+"<button class='rpg-btn wide'>Continue</button></div>";
  d.querySelector("button").onclick=function(){d.remove()};document.body.appendChild(d);
}
function rpgQuiz(titleN,count,done){
  var d=document.createElement("div");d.className="rpg-modal";var qs=[];var pool=RPG.QUIZ.slice();
  for(var i=0;i<count;i++){qs.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0])}
  var c=document.createElement("div");c.className="rpg-card";d.appendChild(c);document.body.appendChild(d);
  var qi=0,right=0;
  function ask(){
    if(qi>=count){d.remove();done(right);return}
    var q=qs[qi];c.innerHTML="<p class='rpg-note'>"+titleN+" — question "+(qi+1)+" / "+count+"</p><p class='mg-q'>"+q[0]+"</p>";
    var opts=q.slice(1,4);var order=[0,1,2].sort(function(){return Math.random()-0.5});
    order.forEach(function(oi){var b=document.createElement("button");b.className="rpg-btn wide";b.textContent=opts[oi];
      b.onclick=function(){if(oi===q[4])right++;qi++;ask()};c.appendChild(b)});
  }ask();
}
