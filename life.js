/* ==================================================================
   LIFE v3 — Life Events · Dialogue · Relationships · Personality
   Modular expansion for Shinobi: Life Unbound. Loads after game.js.
   Adds: dynamic event engine, scene system, dialogue engine with NPC
   memory, personality development, deep relationships, academy life,
   rivals, talents, milestones, delayed consequences, life record,
   year summary. Preserves every existing system and save.
   ================================================================== */
var LIFE=(function(){
"use strict";
var VER=3;

/* ============================== state ============================== */
function ensure(g){
  if(!g)return null;
  if(g.lifeV===VER)return g;
  if(!g.traits)seedTraits(g);
  g.pending=g.pending||[];
  g.history=g.history||[];
  g.milestones=g.milestones||{};
  g.talents=g.talents||[];
  g.memLedger=g.memLedger||[];
  g.recentEvents=g.recentEvents||[];
  g.academyClassIds=g.academyClassIds||[];
  g.lifeV=VER;
  return g;
}
function pack(g){
  g=ensure(g);
  return {lifeV:VER,traits:g.traits,pending:g.pending,history:g.history,milestones:g.milestones,
    talents:g.talents,memLedger:g.memLedger.slice(0,60),recentEvents:g.recentEvents.slice(-40),
    academyClassIds:g.academyClassIds};
}
function unpack(g,o){
  ensure(g);
  if(o&&o.lifeV){
    g.traits=o.traits||g.traits;g.pending=o.pending||[];g.history=o.history||[];
    g.milestones=o.milestones||{};g.talents=o.talents||[];g.memLedger=o.memLedger||[];
    g.recentEvents=o.recentEvents||[];g.academyClassIds=o.academyClassIds||[];g.lifeV=o.lifeV;
  }
  return g;
}

/* ============================== traits ============================== */
var TRAITS=["brave","cowardly","loyal","selfish","compassionate","ruthless","disciplined","lazy",
  "confident","arrogant","intelligent","reckless","calm","short-tempered","ambitious"];
var TRAIT_LABEL={brave:"Brave",cowardly:"Cautious",loyal:"Loyal",selfish:"Selfish",
  compassionate:"Compassionate",ruthless:"Ruthless",disciplined:"Disciplined",lazy:"Lazy",
  confident:"Confident",arrogant:"Arrogant",intelligent:"Sharp-minded",reckless:"Reckless",
  calm:"Calm",shorttempered:"Short-tempered",ambitious:"Ambitious"};
var SEED={
  "Brash":{reckless:40,shorttempered:25,brave:20,calm:-20},
  "Calm":{calm:45,shorttempered:-25,disciplined:15},
  "Cunning":{intelligent:25,ruthless:15,ambitious:20},
  "Gloomy":{calm:10,shorttempered:-10,arrogant:-10},
  "Hot-blooded":{shorttempered:40,brave:25,reckless:20},
  "Kind":{compassionate:45,loyal:25,selfish:-25,ruthless:-30},
  "Lazy":{lazy:45,disciplined:-30},
  "Loner":{selfish:20,loyal:-15,confident:-10},
  "Stoic":{calm:40,disciplined:30,shorttempered:-30},
  "Ambitious":{ambitious:45,ruthless:10,selfish:15},
  "Playful":{reckless:20,compassionate:15,lazy:10},
  "Devoted":{loyal:45,compassionate:25,ambitious:-15},
  "Fearless":{brave:45,confident:30,cowardly:-40},
  "Gentle":{compassionate:40,ruthless:-35,shorttempered:-25,brave:10}
};
function seedTraits(g){
  var t={};
  TRAITS.forEach(function(k){t[k]=35});
  var seed=SEED[g.personality?g.personality.n:"Kind"]||{};
  for(var k in seed)t[k]=clamp(t[k]+seed[k],0,100);
  /* stats shape the starting character */
  t.disciplined=clamp(t.disciplined+(g.stats.discipline-50)/4,0,100);
  t.confident=clamp(t.confident+(g.stats.confidence-50)/4,0,100);
  t.intelligent=clamp(t.intelligent+(g.stats.intelligence-45)/4,0,100);
  t.shorttempered=clamp(t.shorttempered+(g.stats.aggression-35)/4,0,100);
  t.compassionate=clamp(t.compassionate+(g.stats.compassion-45)/4,0,100);
  t.loyal=clamp(t.loyal+(g.stats.loyalty-50)/4,0,100);
  g.traits=t;
  return t;
}
function trait(k){var g=ensure(G);return g&&g.traits?clamp(g.traits[k]||35,0,100):35}
function traitUp(k,v){
  var g=ensure(G);if(!g||!g.traits||!g.traits.hasOwnProperty(k))return;
  var before=g.traits[k];
  g.traits[k]=clamp(g.traits[k]+v,0,100);
  return g.traits[k]-before;
}
function topTraits(n){
  var g=ensure(G);if(!g||!g.traits)return[];
  var keys=TRAITS.slice().sort(function(a,b){return g.traits[b]-g.traits[a]});
  return keys.slice(0,n||3).map(function(k){return{t:k,v:g.traits[k]}});
}
/* vague drift lines, shown only sometimes and only for big shifts */
var DRIFT={
  brave:"Something in you stopped flinching.",cowardly:"You learn what your limits look like.",
  loyal:"You know exactly who you stand with.",selfish:"You look out for yourself first. It suits you.",
  compassionate:"You notice people hurting before they say it.",ruthless:"A colder math settles into you.",
  disciplined:"Your days take on a harder shape.",lazy:"You let things slide. It shows.",
  confident:"You carry yourself differently now.",arrogant:"You stop doubting. Mostly about yourself.",
  intelligent:"The world reads easier than it used to.",reckless:"Consequences feel like other people's problem.",
  calm:"Your pulse stays slow while others spiral.",shorttempered:"Your patience is a fuse, and it shortens.",
  ambitious:"You want more. You keep saying it quietly."
};
function drift(){
  var g=ensure(G);if(!g||!g.traits)return;
  var top=topTraits(3);
  if(!top.length)return;
  if(chance(.4)){var k=top[0].t;if(DRIFT[k]&&chance(.5))feed(DRIFT[k],"")}
}

/* ============================== npc depth ============================== */
function ensureNPC(n){
  if(!n)return null;
  if(!n.bond)n.bond={trust:clamp(n.rel==null?20:n.rel,0,100),respect:clamp(40+(n.skill||3)*5,0,100),talks:0};
  if(!n.mems)n.mems=[];
  return n;
}
function remember(npc,what,tone){
  var g=ensure(G);if(!g||!npc)return;
  ensureNPC(npc);
  npc.mems.push({age:G.age,what:what,tone:tone||"neutral"});
  if(npc.mems.length>6)npc.mems=npc.mems.slice(-6);
  g.memLedger.push({age:G.age,who:npc.name,what:what,tone:tone||"neutral"});
  if(g.memLedger.length>80)g.memLedger=g.memLedger.slice(-80);
}
/* NPC remembers: finds a memory, weighted to strongest tone */
var TONE_WORDS={
  helped:"the time you helped them",saved:"the time you pulled them out of trouble",
  insulted:"the words you said to them",betrayed:"what you did to them",
  defied:"the time you stood against them",befriended:"everything you two have been through",
  defeated:"the time you beat them",gift:"the gift you gave them",
  taught:"what you taught them",lost:"the person they lost"
};
function npcRecall(npc){
  ensureNPC(npc);
  var m=npc.mems;
  if(!m.length)return null;
  var strong=m.filter(function(x){return x.tone!=="neutral"});
  var mem=strong.length?strong[strong.length-1]:m[m.length-1];
  return mem;
}
function relLabel(n){
  var r=n.rel==null?0:n.rel;
  if(r>=80)return"closest friend";if(r>=60)return"close friend";if(r>=40)return"friend";
  if(r>=20)return"friendly";if(r>=0)return"acquaintance";if(r>=-25)return"strained";
  if(r>=-60)return"rivalrous";return"enemy";
}

/* ============================== dialogue voices ============================== */
/* personalities bucket into voices; each voice has greeting registers by standing */
var VOICES={
  bold:{n:"bold",hi:["Well, look who it is.","You again. Good.","Finally, someone worth talking to."],
    warm:["Been hoping you'd come by.","There you are. I saved you a seat."],
    cold:["You've got nerve showing up.","I don't have time for this."],
    lines:["You talk like someone who's never been hit. It's refreshing.","If we're doing this, we're doing it loud.","I'd rather apologize later than ask permission now.","Say what you mean. I don't do riddles."]},
  steady:{n:"steady",hi:["You're here. Good.","Sit, if you're staying.","I wondered when you'd come."],
    warm:["It's good to see you. Truly.","You've been away too long."],
    cold:["Say what you came to say.","This doesn't concern you."],
    lines:["Think it through. Then move.","The village doesn't reward hurry.","I've watched you grow. That counts for something.","Panic is a debt you pay later."]},
  sharp:{n:"sharp",hi:["Ah. The variable arrives.","I predicted this conversation three days ago.","You're late. Obviously."],
    warm:["You continue to surprise me. Keep doing that.","Of everyone, you're the one I don't mind being wrong about."],
    cold:["Every word you say is a debt now.","I know what you did. We both do."],
    lines:["Everyone in this room wants something. I at least admit mine.","Power is information. You have neither.","Consider who benefits before you believe anything.","I could help you. The question is what it would cost you."]},
  warm:{n:"warm",hi:["Hey! I was hoping I'd run into you.","There you are!","You look like you've got a story."],
    warm:["It's so good to see you.","I kept thinking I should check on you."],
    cold:["...Fine. What do you want.","I heard what happened. I don't want to talk about it."],
    lines:["You look tired. Eat something, seriously.","My door's open. It always is, for you.","Everyone deserves someone in their corner. I'll be yours.","Whatever weight you're carrying, set half of it down here."]},
  distant:{n:"distant",hi:["...","You found me. Rare.","Most people don't bother."],
    warm:["You're the only one who keeps coming back. I noticed.","...Stay a while. If you want."],
    cold:["Don't.","I have nothing to say to you."],
    lines:["I keep my own counsel. It's safer for everyone.","The rain doesn't ask permission either.","People leave. I stopped memorizing faces.","If you need me, you know where I am. I won't be there."]},
  easy:{n:"easy",hi:["Yo!","Well well, look who wandered in.","Hey hey, perfect timing."],
    warm:["My favorite person, no contest.","Took you long enough!"],
    cold:["Oh. It's you.","We're not doing this today."],
    lines:["I could train today. I probably won't.","Life's short. Nap anyway.","Want to hear something ridiculous? I have several.","Count me in, unless it involves running."]}
};
function voiceFor(n){
  var p=(n.personality||"").toLowerCase();
  if(/brash|hot-blooded|fearless/.test(p))return VOICES.bold;
  if(/calm|stoic/.test(p))return VOICES.steady;
  if(/cunning|ambitious/.test(p))return VOICES.sharp;
  if(/kind|devoted|gentle/.test(p))return VOICES.warm;
  if(/gloomy|loner/.test(p))return VOICES.distant;
  return VOICES.easy;
}
function greet(n){
  ensureNPC(n);
  var v=voiceFor(n),r=n.rel==null?0:n.rel;
  var m=npcRecall(n);
  var bank;
  if(m&&(m.tone==="betrayed"||m.tone==="insulted"||m.tone==="defied")&&r<25)bank=v.cold;
  else if(m&&(m.tone==="helped"||m.tone==="saved"||m.tone==="befriended"||m.tone==="gift")&&r>15)bank=v.warm;
  else if(r>=55)bank=v.warm;
  else if(r<=-35)bank=v.cold;
  else bank=v.hi;
  return pick(bank);
}

/* ============================== scene runner ============================== */
var SCENEQ=[],SCENE_ON=false,SCENE_CARD=false;
var RAR={"common":["Common","#8a8f98"],"uncommon":["Uncommon","#3fb3a8"],"rare":["Rare","#d4555f"],
  "legendary":["Legendary","#d3a94c"],"secret":["Secret","#a06cd5"],"major":["Milestone","#d3a94c"]};
function queue(s){ensure(G);s.age=G.age;SCENEQ.push(s)}

function sceneDone(){
  if(SCENEQ.length){SCENE_ON=true;setTimeout(playScene,220)}
  else{SCENE_ON=false;finishYear()}
}
function finishYear(){
  if(!G||!G.alive){SCENEQ=[];SCENE_ON=false;return}
  if(SCENEQ.length){if(!SCENE_ON){SCENE_ON=true;playScene()}return}
  waitForModal(yearSummary);
}
function waitForModal(cb){
  var m=$("#modal"),card=$("#eventCard");
  var busy=(m&&m.classList.contains("on"))||(card&&card.style.display!=="none"&&!SCENE_CARD);
  if(busy){setTimeout(function(){waitForModal(cb)},380);return}
  cb();
}
function playScene(){
  if(!G||!G.alive){SCENEQ=[];SCENE_ON=false;return}
  if(!SCENEQ.length){sceneDone();return}
  var s=SCENEQ[0];
  waitForModal(function(){
    if(!G||!G.alive){SCENEQ=[];SCENE_ON=false;return}
    renderScene(s);
  });
}
function sceneHeader(s){
  var c=$("#eventCard");
  c.style.display="block";CARD_HOLD=false;c.innerHTML="";
  var head=el("div","sc-head");
  head.appendChild(el("span","ek",s.cat||"Event"));
  var rar=RAR[s.rar||"common"];
  if(rar)head.appendChild(el("span","sc-rar",rar[0])).style.borderColor=rar[1],head.lastChild.style.color=rar[1];
  c.appendChild(head);
  c.appendChild(el("h3","serif",s.t||"A moment"));
  var meta=el("div","sc-meta");
  var bits=["Age "+G.age];
  if(G.villageName)bits.push(G.villageName);
  if(s.loc)bits.push(s.loc);
  var yr="";
  if(G.era)yr=G.era.name;
  meta.textContent=bits.join(" · ")+(yr?" · "+yr:"");
  c.appendChild(meta);
  if(s.art){var a=el("div","sc-art",s.art);c.appendChild(a)}
}
function sceneBody(s){
  var c=$("#eventCard");
  (s.lines||[]).forEach(function(l){
    if(typeof l==="string")c.appendChild(el("p","sc-line",l));
    else if(l&&l.say){
      var d=el("div","sc-dlg");
      d.appendChild(el("div","sc-face",l.name?l.name.charAt(0):"?"));
      var b=el("div","sc-bubble");
      b.appendChild(el("b","sc-who",l.name||""));
      b.appendChild(el("span",null,l.say));
      d.appendChild(b);c.appendChild(d);
    }
  });
}
function sceneChoices(s){
  var c=$("#eventCard");
  var box=el("div","sc-choices");
  (s.choices||[]).forEach(function(ch){
    var b=el("button","sc-choice");
    b.appendChild(el("b",null,ch.t));
    if(ch.d)b.appendChild(el("small",null,ch.d));
    b.onclick=function(){
      box.innerHTML="";
      var res=[];
      if(ch.fn){try{ch.fn()}catch(e){}}
      if(ch.res)res=Array.isArray(ch.res)?ch.res:[ch.res];
      res.forEach(function(r){c.appendChild(el("p","sc-res",r))});
      var done=el("button","sc-choice sc-continue",ch.then||"Continue");
      done.onclick=function(){SCENE_CARD=false;SCENEQ.shift();sceneDone()};
      c.appendChild(done);
      drift();render();
    };
    box.appendChild(b);
  });
  if(!s.choices||!s.choices.length){
    var done=el("button","sc-choice sc-continue","Continue");
    done.onclick=function(){SCENE_CARD=false;SCENEQ.shift();sceneDone()};
    box.appendChild(done);
  }
  c.appendChild(box);
}
function renderScene(s){
  if(!s){SCENEQ.shift();sceneDone();return}
  SCENE_CARD=true;
  sceneHeader(s);sceneBody(s);sceneChoices(s);
  if(s.onshow){try{s.onshow()}catch(e){}}
}

/* ============================== year summary ============================== */
var SN=null;
function snapshot(){
  var g=ensure(G);if(!g)return;
  var rels={};
  g.relationships.forEach(function(n){rels[n.id]=n.rel||0});
  SN={stats:JSON.parse(JSON.stringify(g.stats||{})),rels:rels,ach:(g.achievements||[]).length,
    talents:(g.talents||[]).length,hist:(g.history||[]).length,events:[],sceneN:0};
}
function statName(k){return k.charAt(0).toUpperCase()+k.slice(1).replace(/([A-Z])/g," $1").trim()}
function yearSummary(){
  if(!G||!G.alive||!SN){return}
  var g=ensure(G),rows=[];
  Object.keys(SN.stats).forEach(function(k){
    if(g.stats&&g.stats[k]!=null){
      var d=Math.round(g.stats[k]-SN.stats[k]);
      if(Math.abs(d)>=3)rows.push({t:statName(k)+(d>0?" +"+d:" "+d),cls:d>0?"up":"down"});
    }
  });
  var relrows=[];
  g.relationships.forEach(function(n){
    var before=SN.rels[n.id];
    if(before!=null){
      var d=(n.rel||0)-before;
      if(Math.abs(d)>=6)relrows.push({n:n,d:d});
    }
  });
  var newAch=g.achievements.slice(SN.ach);
  var newTal=g.talents.slice(SN.talents).length;
  var upNext=g.pending.filter(function(p){return p.atAge>g.age}).sort(function(a,b){return a.atAge-b.atAge})[0];
  var c=$("#eventCard");
  c.style.display="block";c.innerHTML="";
  var head=el("div","sc-head");
  head.appendChild(el("span","ek","Year Summary"));
  c.appendChild(head);
  c.appendChild(el("h3","serif","Age "+g.age+" — "+(g.era?g.era.name:"")));
  var wrap=el("div","sc-summary");
  function block(title,items,fn){
    if(!items.length)return;
    var b=el("div","sc-sumblock");
    b.appendChild(el("b","sc-sumtitle",title));
    items.forEach(function(x){b.appendChild(fn(x))});
    wrap.appendChild(b);
  }
  block("This year",(SN.events.length?SN.events:["A quiet year — not every year needs to be loud."]),function(x){
    var r=el("div","sc-sumrow");r.appendChild(el("span",null,x));return r});
  block("Growth",rows,function(x){
    var r=el("div","sc-sumrow "+(x.cls==="up"?"sup":"sdown"));r.appendChild(el("span",null,x.t));return r});
  block("Bonds shifted",relrows,function(x){
    var r=el("div","sc-sumrow "+(x.d>0?"sup":"sdown"));
    r.appendChild(el("span",null,x.n.name.split(" ")[0]+" ("+(x.d>0?"+":"")+x.d+") "+relLabel(x.n)));return r});
  block("New discoveries",newTal?["A talent revealed itself."]:[],function(x){
    var r=el("div","sc-sumrow sup");r.appendChild(el("span",null,x));return r});
  block("Honors",newAch,function(x){
    var r=el("div","sc-sumrow sup");r.appendChild(el("span",null,"🎖 "+x));return r});
  if(upNext)block("On the horizon",["Something waits at age "+upNext.atAge+"…"],function(x){
    var r=el("div","sc-sumrow sdown");r.appendChild(el("span",null,x));return r});
  c.appendChild(wrap);
  SCENE_CARD=true;
  var done=el("button","sc-choice sc-continue","Continue your life");
  done.onclick=function(){SCENE_CARD=false;closeCard();SN=null;render()};
  c.appendChild(done);
  render();
}

/* ============================== effects helpers ============================== */
var FX={
  add:function(k,v){try{addStat(k,v)}catch(e){}},
  tr:function(k,v){traitUp(k,v)},
  rel:function(n,v){relUp(n,v);ensureNPC(n)},
  rep:function(v){try{rep(v)}catch(e){}},
  ryo:function(v){try{addRyo(v)}catch(e){}},
  mem:function(n,what,tone){remember(n,what,tone)},
  pend:function(kind,atAge,data){var g=ensure(G);g.pending.push({k:kind,atAge:atAge,d:data||{}})},
  hist:function(txt,kind,major){
    var g=ensure(G);g.history.push({age:G.age,txt:txt,kind:kind||"event",major:!!major});
    if(g.history.length>200)g.history=g.history.slice(-200);
    if(major)tl(G.age,txt);
  },
  mile:function(key,label){
    var g=ensure(G);if(g.milestones[key])return false;
    g.milestones[key]={age:G.age,label:label};
    g.history.push({age:G.age,txt:label,kind:"milestone",major:true});
    tl(G.age,label);
    return true;
  },
  talent:function(name,tier,txt){
    var g=ensure(G);
    var dupe=g.talents.some(function(t){return t.t===name});
    if(dupe)return false;
    g.talents.push({t:name,tier:tier,age:G.age});
    g.history.push({age:G.age,txt:txt||("Discovered a talent: "+name+" ("+tier+")."),kind:"talent",major:true});
    tl(G.age,txt||"Talent discovered: "+name);
    feed(txt||("You discover something in yourself: "+name+" ("+tier+")."),"rare");
    return true;
  },
  feed:function(t,cls){fbig(t,cls||"")},
  tl:function(t){tl(G.age,t)}
};
function hasTraitOver(k,v){return trait(k)>=v}
function famAlive(){return G.family.parents.filter(function(n){return n.alive})}
function sibs(){return byKind("sibling").filter(function(n){return n.alive})}
function adultsIn(){return famAlive().concat(byKind("guardian")).filter(function(n){return n&&n.alive})}
function classmates(){var g=ensure(G);return G.relationships.filter(function(n){return n.kind==="classmate"&&n.alive})}
function teacher(){return byKind("teacher")[0]}

/* ============================== delayed consequences ============================== */
function duePending(){
  var g=ensure(G),out=[];
  g.pending=g.pending.filter(function(p){
    if(p.atAge<=G.age){out.push(p);return false}
    return true;
  });
  return out;
}
var PENDING_HANDLERS={
  rival_return:function(p){
    var r=byKind("rival")[0];
    if(!r||!r.alive)return;
    var gap=G.age-(p.d.age||G.age);
    queue({t:"The Rival Returns",cat:"Rivalry",rar:"uncommon",loc:"The mission hall",art:"⚔️",
      lines:[r.name.split(" ")[0]+" walks back into your life after "+(gap>1?gap+" years":"a year")+" away.",
        "They look different. Stronger, maybe. Or just older. They see you and stop."],
      say:{name:r.name.split(" ")[0],say:greet(r)},
      choices:[
        {t:"Greet them like nothing happened",res:["Some bridges hold without repairs."],
          fn:function(){FX.rel(r,10);FX.mem(r,"you welcomed them back without grudges","befriended")}},
        {t:"Ask how they've been",res:[pick([r.name.split(" ")[0]+" talks about the years away. It wasn't kind out there.","They show you a scar you've never seen and don't explain it."])],
          fn:function(){FX.rel(r,6);FX.pend("rival_report",G.age+ri(2,4),{id:r.id})}},
        {t:"Keep your distance",res:["You nod once and move on. They watch you go a beat too long."],
          fn:function(){FX.rel(r,-6)}}
      ]});
  },
  rival_report:function(p){
    var r=byKind("rival")[0];
    if(!r||!r.alive)return;
    var good=chance(.55);
    queue({t:"News of Your Rival",cat:"Rivalry",rar:"common",
      lines:["Word travels through the ranks about "+r.name.split(" ")[0]+": "+(good?pick(["a promotion earned the hard way","a mission saved by their quick thinking","a new technique people whisper about"]):pick(["a failed mission with questions attached","an injury that benched them for a season","a reputation turning sour in the wrong circles"])+".")],
      choices:[
        {t:"Feel something about it",res:[good?"You're not sure if it's pride or something older and meaner.":"You'd never say it out loud. A small part of you is glad."],fn:function(){FX.tr("ambitious",good?5:3)}},
        {t:"Send word",res:[good?"They send back two words: 'Watch me.'":"No reply comes. You didn't really expect one."],fn:function(){if(good)FX.rel(r,8)}}
      ]});
  },
  memory_echo:function(p){
    var n=G.relationships.filter(function(x){return x.id===p.d.id&&x.alive})[0];
    if(!n)return;
    var mem=npcRecall(n);
    queue({t:"An Old Memory",cat:"Memory",rar:"common",
      lines:["You cross paths with "+n.name.split(" ")[0]+" and something old passes between you.",
        mem?("They remember "+(TONE_WORDS[mem.tone]||"that day")+", age "+mem.age+". You can see it in how they hold your gaze."):"Time has layered itself over whatever used to be between you."],
      choices:[
        {t:"Bring it up",res:[pick([n.name.split(" ")[0]+" laughs like it just happened.","They wave it off, but their eyes stay soft a moment too long."])],
          fn:function(){FX.rel(n,8);FX.mem(n,"you brought up the past warmly","befriended")}},
        {t:"Let it stay unspoken",res:["Some things land better as silence."],fn:function(){FX.rel(n,3)}}
      ]});
  },
  invitation:function(p){
    queue({t:"An Unusual Invitation",cat:"Rare",rar:"rare",art:"✉️",
      lines:["A sealed letter, no signature, wax the color of old blood. Inside: an invitation to "+pick(["a gathering of retired shinobi in the hills","a private demonstration at the academy after hours","a dinner where, the note insists, 'the right people will be present'"]),
        "No one else seems to have received one."],
      choices:[
        {t:"Go",res:[pick(["You spend one strange, memorable night among people who knew your grandparents by first name.","The gathering is real. So is the warning one of the guests gives you on the way out: 'People will notice you attended.'"])],
          fn:function(){FX.rep(4);FX.hist("Attended an invitation that arrived with no signature","rare event",true);FX.pend("whispers",G.age+ri(1,3),{})}},
        {t:"Burn it",res:["The letter burns green for a moment before it catches properly. You decide not to think about that."],fn:function(){FX.tr("disciplined",4)}}
      ]});
  },
  whispers:function(p){
    queue({t:"Someone Noticed",cat:"Political",rar:"uncommon",
      lines:["A council aide stops you in the street. Polite. Unhurried. 'The office is reviewing records from the past few years. Some names came up.' Yours was one of them."],
      choices:[
        {t:"Cooperate fully",res:["The questions are dull and endless. You answer every one. Whatever file they keep on you gets thinner or thicker; you never learn which."],fn:function(){FX.rep(3)}},
        {t:"Say as little as possible",res:["The aide smiles like they expected that, thanks you for your time, and leaves you to imagine the worst."],fn:function(){FX.tr("disciplined",3)}}
      ]});
  },
  old_debt:function(p){
    queue({t:"An Old Debt",cat:"Consequence",rar:"uncommon",art:"🪙",
      lines:["A courier tracks you down with a ledger entry older than your career: "+p.d.who+" has called in a favor from years ago."],
      choices:[
        {t:"Pay it",res:["It costs you, and it costs you quietly. The ledger closes."],fn:function(){FX.ryo(-p.d.amt||-200);FX.rep(2)}},
        {t:"Refuse",res:["You send the courier away. Somewhere, a name gets a mark next to it."],fn:function(){FX.rep(-5);FX.pend("collector",G.age+ri(1,2),{who:p.d.who})}}
      ]});
  },
  collector:function(p){
    queue({t:"The Collector",cat:"Consequence",rar:"rare",art:"🌑",
      lines:["A figure is waiting by your door in the evening. They don't introduce themselves. They only say: '"+(p.d.who||"Someone")+"'s patience ended."],
      choices:[
        {t:"Stand your ground",res:["It doesn't become the fight they wanted. You don't blink, and eventually they leave. But you sleep with a blade by the door now."],fn:function(){FX.tr("brave",8);FX.add("health",-6);FX.hist("Refused a debt collector to their face","consequence",true)}},
        {t:"Settle it properly",res:["You pay what's owed plus the insult tax. It stings, but the night ends quietly."],fn:function(){FX.ryo(-400);FX.rep(-2)}}
      ]});
  },
  growth_spurt:function(p){
    queue({t:"A Growth Year",cat:"Training",rar:"uncommon",
      lines:["Something clicks this year. Techniques that used to fight you now flow like they were always yours."],
      choices:[
        {t:"Push while it lasts",res:["You train past exhaustion and the gains hold. Sore, grinning, stronger."],fn:function(){FX.add("chakraControl",4);FX.add("ninjutsu",4);FX.add("strength",2)}},
        {t:"Trust the slow way",res:["You let the feeling settle instead of chasing it. It doesn't fade. It deepens."],fn:function(){FX.add("chakra",3);FX.add("willpower",3)}}
      ]});
  },
  grief:function(p){
    var n=G.relationships.filter(function(x){return x.id===p.d.id})[0];
    if(!n)return;
    queue({t:"Grief",cat:"Tragedy",rar:"major",art:"🕯️",
      lines:[n.name.split(" ")[0]+" is gone.",
        pick(["The house is too quiet in the mornings now.","You keep setting out two cups before you remember.","Everyone says the same useless words. You nod along."]),
        "You carry it. That is what people do."],
      choices:[
        {t:"Let it in",res:["You grieve properly, for as long as it takes. Some mornings are worse. You get up anyway."],fn:function(){FX.add("happiness",-5);FX.tr("compassionate",5);FX.hist("Lost "+n.name+" and learned what grief weighs","tragedy",true)}},
        {t:"Throw yourself into training",res:["You train until your hands shake. It doesn't fix anything, but the hours pass."],fn:function(){FX.add("happiness",-3);FX.add("taijutsu",3);FX.tr("disciplined",5)}}
      ]});
  },
  mentor_return:function(p){
    var n=G.relationships.filter(function(x){return x.id===p.d.id&&x.alive})[0];
    if(!n)return;
    queue({t:"The Mentor's Lesson",cat:"Friendship",rar:"uncommon",
      lines:[n.name.split(" ")[0]+" finds you mid-practice, watches in silence, then says one sentence that rearranges something."],
      say:{name:n.name.split(" ")[0],say:pick(["'Stop copying my form. Find yours.'","'You've been fighting your own strengths. Why?'","'Talent is a rumor until the work proves it. Prove it.'"])},
      choices:[
        {t:"Ask what they see in you",res:[pick(["'Someone the village hasn't figured out yet. Don't let them name you too early.'","'A stubbornness I've only seen twice before. Both of those people mattered.'"])],fn:function(){FX.rel(n,6);FX.add("willpower",2)}},
        {t:"Just train harder",res:["You don't say much. You don't have to. They nod once and stay to watch."],fn:function(){FX.add("chakraControl",2);FX.add("taijutsu",2)}}
      ]});
  }
};
function processPending(){
  var g=ensure(G);
  duePending().forEach(function(p){
    var h=PENDING_HANDLERS[p.k];
    if(h){try{h(p)}catch(e){}}
  });
}

/* ============================== engine tick (per year) ============================== */
function tick(){
  var g=ensure(G);
  if(!g||!g.alive)return;
  snapshot();
  processPending();
  /* legacy events keep their existing behavior */
  var er=Math.random(),nEv=er<.2?0:er<.82?1:2,fired=0;
  while(fired<nEv){
    var e=pickEvent();if(!e)break;
    SN.events.push(cap(e.t||"an event"));e.run();fired++;
  }
  if(!fired&&!SCENEQ.length)feed("A quiet year. Not every year needs to be loud.","");
  /* story scenes */
  var roll=Math.random();
  var nScenes=roll<.3?0:roll<.85?1:2;
  if(g.milestones&&g.age===6)nScenes=Math.max(nScenes,1);
  var used={};
  while(nScenes>0){
    var t=pickTemplate(used);
    if(!t)break;
    used[t.id]=true;
    markRecent(t.id);
    SCENEQ.push(t.build());
    nScenes--;
  }
  /* milestone detection */
  checkMilestones();
  /* relationship drift thresholds */
  checkRelMilestones();
}
function markRecent(id){
  var g=ensure(G);g.recentEvents.push(id);
  if(g.recentEvents.length>40)g.recentEvents=g.recentEvents.slice(-40);
}
function recently(id,span){
  var g=ensure(G);var arr=g.recentEvents||[];
  return arr.slice(-((span||6))).indexOf(id)>=0;
}
function pickTemplate(used){
  var bag=[];
  TPL.forEach(function(t){
    if(used&&used[t.id])return;
    if(recently(t.id,t.once?100:5))return;
    var ok=false;
    try{ok=!t.gate||t.gate()}catch(e){ok=false}
    if(ok)bag.push([t,t.w||6]);
  });
  if(!bag.length)return null;
  return weighted(bag);
}

/* ============================== event templates ============================== */
/* shape: {id,cat,rar,w,once,gate(),build()->scene} */
var TPL=[];

/* ---- FAMILY ---- */
TPL.push({id:"fam_pride",cat:"Family",rar:"common",w:7,gate:function(){return famAlive().length&&G.age>=4},
 build:function(){var n=pick(famAlive());var prouder=trait("disciplined")>50||st("intelligence")>50;
  return{t:"Quiet Pride",cat:"Family",loc:"Home",art:"🏡",
   lines:[n.name.split(" ")[0]+" thinks you're asleep. You hear them "+pick(["telling the neighbor about you","reading your old drawing again","standing in your doorway a moment too long"])+"."+ (prouder?" They don't say any of it to your face.":" You hear your name, and then a laugh.")],
   choices:[
    {t:"Say nothing, remember it",res:["You keep your eyes closed. Some warmth you don't interrupt."],fn:function(){FX.rel(n,6);FX.add("happiness",2)}},
    {t:"Walk out and hug them",res:[n.name.split(" ")[0]+" freezes, then holds on longer than either of you expected."],fn:function(){FX.rel(n,10);FX.mem(n,"the hug in the doorway","befriended");FX.add("happiness",3)}}
  ]}}});
TPL.push({id:"fam_argument",cat:"Family",rar:"common",w:6,gate:function(){return famAlive().length>0&&G.age>=8},
 build:function(){var n=pick(famAlive());var topic=pick(["the money that month","your future","the clan's expectations","a relative nobody mentions anymore","the way the house keeps falling apart"]);
  return{t:"A Door Slammed",cat:"Family",loc:"Home",art:"🚪",
   lines:["The argument starts over "+topic+" and ends with "+n.name.split(" ")[0]+"'s door shut hard enough to rattle the wall."],
   choices:[
    {t:"Apologize through the door",res:["A long silence. Then: 'Come eat. It's getting cold.' Nothing is fixed, but dinner happens.",],
     fn:function(){FX.rel(n,8);FX.tr("compassionate",5);FX.mem(n,"the apology through the door","befriended")}},
    {t:"Slam your own door louder",res:["The house holds a contest of echoes for an hour. You win. Nobody wanted to."],
     fn:function(){FX.rel(n,-8);FX.tr("shorttempered",8);FX.tr("reckless",4)}},
    {t:"Sit alone with it",res:["You learn something about holding your tongue that night."],
     fn:function(){FX.tr("calm",6);FX.add("happiness",-2)}}
  ]}}});
TPL.push({id:"fam_tradition",cat:"Family",rar:"common",w:5,gate:function(){return G.age>=6&&famAlive().length>0},
 build:function(){var n=pick(famAlive());
  return{t:"Family Tradition",cat:"Family",loc:"Home",art:"🏮",
   lines:["Every year the family does it the same way: "+pick(["salt over the threshold before the first frost","names written on paper lanterns and set on the river","the eldest serving the youngest first, always","a walk to the old shrine, rain or not"])+".",
    "This year it's explained to you properly, like you're old enough to carry it."],
   choices:[
    {t:"Carry it seriously",res:[n.name.split(" ")[0]+" watches you do it right and says nothing, which is how you know it landed."],fn:function(){FX.rel(n,7);FX.tr("loyal",5)}},
    {t:"Ask why it started",res:["The story is older than the village. You're the first in years to ask."],fn:function(){FX.rel(n,5);FX.add("intelligence",2)}}
  ]}}});
TPL.push({id:"fam_secret",cat:"Family",rar:"rare",w:2,once:true,gate:function(){return G.age>=10&&(G.clanName||G.household!=="orphan")},
 build:function(){var n=pick(adultsIn().length?adultsIn():famAlive());
  return{t:"A Locked Drawer",cat:"Family",rar:"rare",loc:"Home",art:"🔐",
   lines:["Cleaning the back room, you find a drawer that's always been locked. Today it isn't. Inside: "+pick(["a photo of two shinobi you've never met, faces cut out of another copy","a scroll with a name scratched out and yours written under it in different ink","an old hitai-ate from a village that isn't yours","letters addressed to a name you've never heard spoken"]),
    n.name.split(" ")[0]+" appears in the doorway. They see what's in your hands."],
   choices:[
    {t:"Ask them outright",res:["The answer is short, and true, and changes how you see the house you grew up in.","'Someday,' they say. 'Not today.' It's the first time they've ever postponed the truth to you instead of around you."],
     fn:function(){FX.hist("Found something the family kept locked away","family secret",true);FX.pend("fam_secret2",G.age+ri(3,6),{id:n.id})}},
    {t:"Put it back and say nothing",res:["You return the drawer to exactly how it was. You're a different person walking out of that room."],fn:function(){FX.tr("disciplined",6);FX.tr("intelligent",4);FX.hist("Found a family secret and kept it","family secret",false)}},
    {t:"Take one thing",res:["You pocket a single paper. Some questions you have to carry yourself."],fn:function(){FX.tr("reckless",6);FX.hist("Took one item from the family's locked drawer","family secret",false)}}
  ]}}});
TPL.push({id:"fam_hardship",cat:"Family",rar:"common",w:5,gate:function(){return G.age>=5&&(G.familyWealth==="poor"||G.familyWealth==="modest")&&famAlive().length},
 build:function(){var n=pick(famAlive());
  return{t:"A Lean Winter",cat:"Family",loc:"Home",art:"❄️",
   lines:["The money runs out before the winter does. Meals get smaller and nobody discusses it. "+n.name.split(" ")[0]+" comes home with "+pick(["an extra job","burned hands from a second shift","a debt they don't explain"])+"."],
   choices:[
    {t:"Find work yourself",res:["You carry, sweep, haul and hush about it. The household notice. So do your hands."],fn:function(){FX.ryo(ri(80,200));FX.tr("disciplined",6);FX.add("endurance",2);FX.rel(n,8)}},
    {t:"Give them what you've saved",res:["They refuse it twice. The third time, they take it. Neither of you talks about the third time."],fn:function(){FX.ryo(-100);FX.rel(n,12);FX.tr("compassionate",6);FX.mem(n,"the coins you gave up","befriended")}},
    {t:"Train harder instead",res:["You decide the best thing you can give the family is a future worth something."],fn:function(){FX.tr("ambitious",7);FX.add("taijutsu",2)}}
  ]}}});
TPL.push({id:"fam_birthday",cat:"Celebration",rar:"common",w:4,gate:function(){return famAlive().length>0},
 build:function(){var n=pick(famAlive());
  return{t:"Your Birthday",cat:"Celebration",loc:"Home",art:"🎂",
   lines:["The house does what it can: "+pick(["a cake with your name spelled almost right","a hand-sewn pouch for your gear","a morning where nobody yells, which is its own kind of gift","one candle and a wish nobody says out loud"])+".",
    n.name.split(" ")[0]+": '"+pick(["Another year. You're getting too good at them.","You were so small. Look at you now.","Make this one worth remembering.","We're proud of you. I don't say it enough."])+"'"],
   choices:[
    {t:"Thank them",res:["The day ends warm. Simple and warm."],fn:function(){FX.rel(n,6);FX.add("happiness",4)}},
    {t:"Ask about the year you were born",res:["You get a story you've never heard, about the night you arrived and who was there."],fn:function(){FX.rel(n,5);FX.add("intelligence",2);FX.hist("Learned the story of your own birth night","family",false)}}
  ]}}});

/* ---- CHILDHOOD ---- */
TPL.push({id:"child_dare",cat:"Childhood",rar:"common",w:7,gate:function(){return G.age>=5&&G.age<=9},
 build:function(){return{t:"The Forbidden Roof",cat:"Childhood",loc:"The market district",art:"🏚️",
  lines:["The older kids dare each other onto the roof of the "+pick(["grain warehouse","old shrine","mission hall"])+" that everyone's been told a hundred times to leave alone.",
   "They look at you. Waiting to see which kind of kid you are."],
  choices:[
   {t:"Go up first",res:["The tiles hold. The view is worth it. Someone's mother catches you all coming down and the lectures last a week.",
     "But you went first. The other kids remember that."],fn:function(){FX.tr("brave",8);FX.tr("reckless",6);FX.add("agility",2);FX.rep(2)}},
   {t:"Talk them out of it",res:["Half listen. One kid falls two tiles and cries. You get them down safe. The mothers decide you're the responsible one, which is only half true."],
    fn:function(){FX.tr("compassionate",5);FX.tr("calm",5);FX.add("intelligence",2)}},
   {t:"Walk away",res:["You go practice leaf-sticking instead. It's less glorious and more useful."],fn:function(){FX.tr("disciplined",6);FX.add("chakraControl",2)}}
 ]}}});
TPL.push({id:"child_market",cat:"Childhood",rar:"common",w:6,gate:function(){return G.age>=4&&G.age<=10},
 build:function(){return{t:"The Fruit Stall",cat:"Childhood",loc:"The market",art:"🍎",
  lines:["A fruit pyramid wobbles as you pass. Only your hand is anywhere near it. The vendor is already shouting."],
  choices:[
   {t:"Own it",res:["You pay what you have and apologize twice. The vendor remembers your face kindly after that."],fn:function(){FX.tr("loyal",4);FX.rep(2);FX.ryo(-20)}},
   {t:"Run",res:["You get three streets before your lungs file complaints. It works. Nobody's proud of you, including you."],fn:function(){FX.add("speed",2);FX.tr("reckless",4)}},
   {t:"Point at the actual culprit — a cat",res:["The cat, guilty and unbothered, licks its paw. Laughter defuses the whole street. The vendor gives you a free apple for the show."],fn:function(){FX.add("happiness",3);FX.add("intelligence",2)}}
 ]}}});
TPL.push({id:"child_wander",cat:"Discovery",rar:"uncommon",w:4,gate:function(){return G.age>=5&&G.age<=10},
 build:function(){return{t:"Where the Paths Split",cat:"Discovery",loc:"The woods beyond the wall",art:"🌲",
  lines:["Chasing something that isn't important anymore, you end up further out than you've ever been, where the forest path splits three ways. The air is different here. Quieter.",
   "You could be back before dark. Or not."],
  choices:[
   {t:"Explore a little more",res:["You find "+pick(["a dried-up creek bed that would make a perfect secret training spot","an old shrine stone with names scratched into it, weathered to anonymity","the bones of a campfire from a war most people have forgotten"])+". You mark the way home carefully."],
    fn:function(){FX.add("perception",3);FX.tr("reckless",4);FX.hist("Found a hidden place beyond the village walls","discovery",false);FX.pend("hidden_place",G.age+2,{})}},
   {t:"Head home now",res:["You make it back as the lamps come on. Your absence went unnoticed, which is its own lesson."],fn:function(){FX.tr("disciplined",4)}}
 ]}}});

/* ---- ACADEMY ---- */
TPL.push({id:"acad_bully",cat:"Academy",rar:"common",w:9,gate:function(){return inAcademy()&&!recently("acad_bully",8)},
 build:function(){var target=classmates().length?pick(classmates()):null;
  var nm=target?target.name.split(" ")[0]:"a boy from another class";
  return{t:"A Problem at the Academy",cat:"Academy",loc:G.villageName+" Academy",art:"📜",
   lines:["You arrive at the academy and notice three students surrounding "+nm+". One of them turns toward you."],
   say:{name:"The tallest one",say:"'Stay out of this. Nobody asked you.'"},
   choices:[
    {t:"Stand up for "+nm,res:["It costs you a split lip and earns you something better: "+nm+" looks at you like you hung the moon, and the three learn that some kids don't scare cheap."],
     fn:function(){FX.tr("brave",10);FX.tr("compassionate",5);FX.rep(3);if(target){FX.rel(target,18);FX.mem(target,"you stood up for them when nobody else would","saved");FX.pend("ally_debt",G.age+ri(2,5),{id:target.id})}FX.hist("Defended "+nm+" from academy bullies","academy",true)}},
    {t:"Call a teacher",res:["Adults descend. The bullies scatter. "+nm+" avoids your eyes after — protected, but seen needing it."],
     fn:function(){FX.tr("calm",5);if(target){FX.rel(target,2);FX.mem(target,"you got a teacher but they felt small","neutral")}FX.add("intelligence",1)}},
    {t:"Challenge the biggest one",res:["'Me instead.' The yard goes silent. You lose the fight but set the terms of it, and somehow that reads as strength.",
     "You walk home with a bloody nose and a reputation."],fn:function(){FX.tr("brave",8);FX.tr("reckless",6);FX.add("taijutsu",2);FX.add("health",-4);FX.rep(4);if(target)FX.rel(target,10)}},
    {t:"Talk to them instead",res:["You ask the three, genuinely, why him. The question lands wrong in the right way. They drift off without the fight anyone came to see."],
     fn:function(){FX.tr("intelligent",5);FX.tr("compassionate",3);if(target)FX.rel(target,8)}},
    {t:"Walk away",res:["You keep walking. The sounds follow you to class. Something about yourself takes a year to look at straight."],
     fn:function(){FX.tr("cowardly",10);FX.add("happiness",-3);if(target)FX.rel(target,-12)}
    }
  ]}}});
TPL.push({id:"acad_exam_stress",cat:"Academy",rar:"common",w:6,gate:function(){return inAcademy()&&G.academy&&(G.academy.grades||50)<60},
 build:function(){return{t:"Falling Behind",cat:"Academy",loc:G.villageName+" Academy",art:"📉",
  lines:["The instructor hands back the last written exam. Your score is not the problem. It is the entire problem.",
   "The others file out talking about graduation. The room gets very quiet."],
  choices:[
   {t:"Ask the teacher for help",res:["They stay late with you twice a week. It's humbling and it works."],fn:function(){var t=teacher();if(t)FX.rel(t,10);FX.add("intelligence",4);if(G.academy)G.academy.grades=clamp((G.academy.grades||50)+12,0,100);FX.tr("disciplined",6)}},
   {t:"Train alone all winter",res:["You drill until the material stops being an enemy. Nobody helps. Nobody has to."],fn:function(){FX.add("intelligence",3);FX.add("willpower",3);if(G.academy)G.academy.grades=clamp((G.academy.grades||50)+8,0,100);FX.tr("disciplined",4)}},
   {t:"Cheat off the smartest kid",res:["You pass the retake. "+(classmates().length?"The classmate whose paper you borrowed notices. Says nothing. Looks at you differently ever after.":"Nobody catches you. You know, though.")],
    fn:function(){var t=classmates()[0];if(t){FX.rel(t,-10);FX.mem(t,"you copied off their exam","insulted")}FX.tr("ruthless",5);FX.tr("cowardly",5);if(G.academy)G.academy.grades=clamp((G.academy.grades||50)+10,0,100)}}
  ]}}});
TPL.push({id:"acad_prodigy",cat:"Academy",rar:"uncommon",w:4,gate:function(){return inAcademy()&&st("ninjutsu")>=30&&st("intelligence")>=45},
 build:function(){var t=teacher();
  return{t:"The Instructor Keeps You After",cat:"Academy",loc:G.villageName+" Academy",art:"🌟",
   lines:["'Everyone out.' The room empties. The instructor looks at you differently than they look at the others.",
    "'"+pick(["I've been teaching for a long time. I've seen three students like you. Two of them mattered.","You learn in weeks what takes most of them years. That's not a compliment. It's a responsibility.","The council will hear your name soon. Decide now what you want them to hear."])+"'"],
   choices:[
    {t:"Ask to be pushed harder",res:["The training gets heavier immediately. You asked for it. You get it."],fn:function(){FX.add("chakraControl",3);FX.add("ninjutsu",3);FX.tr("disciplined",5);if(t)FX.rel(t,8);FX.mile("prodigy","Marked out as a prodigy at the academy")}},
    {t:"Say you want to protect people",res:["The instructor studies you a long moment. 'Good. Then the strength has somewhere to go.'"],fn:function(){FX.tr("compassionate",6);FX.tr("loyal",4);if(t)FX.rel(t,6)}},
    {t:"Ask what happened to the third student",res:["'That,' they say, gathering their papers, 'depends entirely on you.'"],fn:function(){FX.add("intelligence",3);FX.hist("Asked the instructor about the prodigy who came before","academy",false)}}
  ]}}});
TPL.push({id:"acad_friend",cat:"Friendship",rar:"common",w:8,gate:function(){return (inAcademy()||G.age<12)&&classmates().length&&!G.milestones.firstFriend},
 build:function(){var n=pick(classmates());
  return{t:"The Kid Who Shares",cat:"Friendship",loc:G.villageName+" Academy",art:"🤝",
   lines:[n.name.split(" ")[0]+", from the desk by the window, splits their "+pick(["lunch in half without being asked","umbrella in the downpour","stash of dried plums three days running"])+" and says the least surprising thing in the world: 'You're alright, you know that?'",
    "Something starts here, if you let it."],
   choices:[
    {t:"Let it become a friendship",res:["You eat together every day after that. Years from now you'll both pretend it was nothing, and both know it wasn't."],
     fn:function(){FX.rel(n,20);FX.mem(n,"the first split lunch","befriended");FX.mile("firstFriend","Made a first real friend: "+n.name.split(" ")[0]);G.bestFriend=G.bestFriend||n.id;FX.pend("friend_deep",G.age+ri(3,6),{id:n.id})}},
    {t:"Keep it light",res:["You share the joke, not the friendship. It stays pleasant for years."],fn:function(){FX.rel(n,6);FX.tr("selfish",3)}}
  ]}}});
TPL.push({id:"acad_sparring",cat:"Training",rar:"common",w:7,gate:function(){return inAcademy()},
 build:function(){return{t:"Sparring Class",cat:"Training",loc:G.villageName+" Academy",art:"🥋",
  lines:["Pairs are drawn by lot. Your opponent is "+(byKind("rival")[0]?"a familiar face, smirking already":"someone you've never fought"),
   "The instructor calls start."],
  choices:[
   {t:"Fight clean and patient",res:["You read their rhythm and take the round with control. The instructor nods once — the highest grade they give.",
     "Win: your fundamentals sharpen."],fn:function(){FX.add("taijutsu",3);FX.add("chakraControl",1);FX.tr("disciplined",4)}},
   {t:"Go all out from the bell",res:["Raw and reckless wins the exchange, mostly. You also eat a counter that rings your ears for a day.",
     "Victory, but a bruising lesson with it."],fn:function(){FX.add("taijutsu",2);FX.add("health",-3);FX.tr("reckless",6);FX.tr("brave",4)}},
   {t:"Lose on purpose to study them",res:["You eat two hits you could have blocked and watch everything instead. Afterward you can copy their footwork from memory."],
    fn:function(){FX.add("perception",4);FX.add("intelligence",2);FX.tr("cunning"!==""?"calm":"calm",4)}}
 ]}}});

/* ---- RIVALRY ---- */
TPL.push({id:"riv_first",cat:"Rivalry",rar:"uncommon",w:7,gate:function(){return G.age>=7&&G.age<=14&&!G.rival},
 build:function(){var n=newNPC({age:G.age,kind:"rival",rel:ri(-15,5),village:G.village});
  n.rank=inAcademy()?"Academy Student":"Child";n.skill=Math.max(n.skill,5);n.bond=null;
  G.relationships.push(n);G.rival=n.id;
  return{t:"The One to Beat",cat:"Rivalry",loc:G.villageName,art:"⚔️",
   lines:[n.name.split(" ")[0]+" "+n.name.split(" ")[1]+" — "+pick(["same age, better scores, knows it","fast in a way that makes teachers nod","mouthy, talented, and aware of both","quiet, relentless, always one rep ahead"])+".",
    "The first time you're ranked against each other, something settles into place. A shape to your ambitions."],
   choices:[
    {t:"Declare the rivalry out loud",res:["You say it in front of everyone. They laugh once, then stop laughing. From now on, everything is measured against them."],
     fn:function(){FX.rel(n,-4);FX.tr("ambitious",8);FX.tr("confident",5);FX.mile("firstRival","Declared a lifelong rivalry with "+n.name.split(" ")[0]);FX.hist("Rivalry began with "+n.name,"rivalry",true);FX.pend("rival_return",G.age+ri(4,7),{id:n.id,age:G.age})}},
    {t:"Keep it to yourself",res:["No announcement. Just work. Every score they post, you answer."],
     fn:function(){FX.tr("disciplined",7);FX.tr("ambitious",5);FX.mile("firstRival","A quiet rivalry with "+n.name.split(" ")[0]+" began");FX.hist("Rivalry began with "+n.name,"rivalry",true)}},
    {t:"Try to make peace instead",res:["You offer a handshake. They take it after a pause that lasts a year, and the rivalry survives it anyway, just with manners."],
     fn:function(){FX.rel(n,10);FX.tr("compassionate",4);FX.mile("firstRival","Rivalry and respect both began with "+n.name.split(" ")[0]);FX.hist("Rivalry began with "+n.name,"rivalry",true)}}
  ]}}});
TPL.push({id:"riv_challenge",cat:"Rivalry",rar:"common",w:8,gate:function(){return byKind("rival")[0]&&byKind("rival")[0].alive&&G.age>=8},
 build:function(){var r=byKind("rival")[0];
  var myPower=st("taijutsu")+st("speed")+st("chakraControl");
  var win=myPower+ri(0,25)>ri(50,90);
  return{t:"The Challenge",cat:"Rivalry",loc:pick(["the training field","the old bridge","behind the academy"]),art:"⚔️",
   lines:[r.name.split(" ")[0]+" is waiting for you after class, arms crossed. 'You. Me. Right now.'",
    "Not a question."],
   choices:[
    {t:"Fight",res:[win?"You win. Not by much, and they'll claim otherwise forever, but you win. It changes something between you that no score ever did.":"You lose. Cleanly. They're better today, and they make sure you know it. The walk home is long and educational."],
     fn:function(){if(win){FX.rel(r,-6);FX.tr("confident",8);FX.mem(r,"you beat them in the challenge","defeated")}else{FX.rel(r,-8);FX.add("confidence",-0);FX.add("health",-5);FX.tr("disciplined",5);FX.mem(r,"they beat you and made sure you knew it","defied")}FX.add("taijutsu",2)}},
    {t:"Refuse — say it's not worth it",res:["'Coward,' they call after you. Maybe. The word follows you for a season."],
     fn:function(){FX.tr("cowardly",6);FX.rel(r,-4)}},
    {t:"Offer a real match — tournament rules",res:["They hesitate. Rules mean witnesses, witnesses mean stakes. They agree. The tournament committee gets its first entry forms that evening."],
     fn:function(){FX.tr("ambitious",5);FX.pend("rival_tourney",G.age+ri(1,2),{id:r.id})}}
  ]}}});
TPL.push({id:"riv_tourney",cat:"Rivalry",rar:"uncommon",w:6,gate:function(){return byKind("rival")[0]&&byKind("rival")[0].alive&&G.age>=8},
 build:function(){var r=byKind("rival")[0];var win=st("taijutsu")+st("ninjutsu")+st("speed")+ri(0,30)>ri(70,110);
  return{t:"Tournament Day",cat:"Rivalry",loc:"The tournament grounds",art:"🏆",
   lines:["The bracket was posted a week ago. Everyone knew which two names the final would hold.",
    "The stands are full. The bell rings."],
   choices:[
    {t:"Fight for the win",res:[win?"You take the final. "+r.name.split(" ")[0]+" shakes your hand with a grip that promises a rematch. The crowd remembers your name for a month.":"You lose the final by a single exchange. Second place, and everyone saw. It burns in a way that keeps you training for years."],
     fn:function(){if(win){FX.rep(6);FX.tr("confident",6);FX.mile("tourneyWin","Won the academy tournament against "+r.name.split(" ")[0])}else{FX.rel(r,-4);FX.tr("ambitious",6);FX.add("happiness",-3)}FX.add("taijutsu",3)}},
    {t:"Fight, then help them up either way",res:["The match is vicious and honest. Whoever wins, you're the one who reaches down. The crowd cheers both of you. Some rivalries get tangled up with respect."],
     fn:function(){FX.rel(r,12);FX.tr("compassionate",5);FX.rep(3)}}
  ]}}});
TPL.push({id:"riv_grown",cat:"Rivalry",rar:"uncommon",w:4,gate:function(){var r=byKind("rival")[0];return r&&r.alive&&G.age-r.age>=0&&(G.age>=16)},
 build:function(){var r=byKind("rival")[0];
  return{t:"Years Later, The Same Eyes",cat:"Rivalry",rar:"uncommon",loc:"The mission hall",art:"👁️",
   lines:["You haven't squared off with "+r.name.split(" ")[0]+" in years. They're "+(r.rank||"grown")+" now. Stronger or worn down by the road, hard to tell at first.",
    "They say your name like no time passed at all."],
   choices:[
    {t:"Compare paths honestly",res:["You talk for hours. Some of what they built shames you. Some of what you built surprises them. You part as equals, which neither of you expected."],
     fn:function(){FX.rel(r,14);FX.mem(r,"the long talk about the years apart","befriended")}},
    {t:"Spar one more time, for old times",res:["It's different now — skill against skill, not anger against anger. You both grin halfway through."],fn:function(){FX.rel(r,8);FX.add("taijutsu",3)}},
    {t:"Notice how far ahead they've gotten",res:["The gap is real. You spend the walk home deciding what to do about it."],fn:function(){FX.tr("ambitious",8);FX.add("happiness",-2)}}
  ]}}});

/* ---- CLAN ---- */
TPL.push({id:"clan_pressure",cat:"Clan",rar:"common",w:6,gate:function(){return G.clanName&&G.age>=8},
 build:function(){return{t:"Clan Expectations",cat:"Clan",loc:"The "+G.clanName+" compound",art:"🔻",
  lines:["The clan elder summons you. The message is the same in every generation: the "+G.clanName+" name, the techniques, the standard. 'Your generation is measured by what you become.'"],
  choices:[
   {t:"Accept the weight",res:["You bow. You mean it. The training doubles."],fn:function(){FX.tr("disciplined",7);FX.add("chakraControl",2);FX.rep(2)}},
   {t:"Ask what happens to clan members who fail",res:["A silence. 'They live elsewhere,' the elder says, and writes your name in the ledger anyway."],fn:function(){FX.add("intelligence",3);FX.tr("ambitious",4)}},
   {t:"Say you'll carry the name your own way",res:["Scandal in the compound. Respect in the streets. Both follow you home."],fn:function(){FX.tr("reckless",5);FX.tr("confident",6);FX.rep(3)}}
  ]}}});
TPL.push({id:"clan_recognition",cat:"Clan",rar:"uncommon",w:4,gate:function(){return G.clanName&&rankRank()>=2&&st("reputation")>=40&&!G.milestones.clanRec},
 build:function(){return{t:"The Clan Head's Nod",cat:"Clan",loc:"The "+G.clanName+" compound",art:"🎖️",
  lines:["The head of the "+G.clanName+" clan stops you in the compound yard. In front of everyone.",
   "'Your name has reached places names don't usually reach. The clan sees you now.'"],
  choices:[
   {t:"Bow and thank them",res:["Proper, correct, noted. The elders approve of you in the specific way they approve of assets."],fn:function(){FX.mile("clanRec","Formally recognized by the "+G.clanName+" clan");FX.rep(5);FX.tr("disciplined",4)}},
   {t:"Ask what the clan needs from you",res:["'Eventually?' The head smiles. 'Everything.'"],fn:function(){FX.mile("clanRec","Formally recognized by the "+G.clanName+" clan");FX.tr("ambitious",5);FX.rep(4)}}
  ]}}});
TPL.push({id:"clan_kg_trial",cat:"Clan",rar:"rare",w:3,gate:function(){return G.kkg&&!G.kkgKnown&&G.age>=8},
 build:function(){return{t:"The Blood Remembers",cat:"Clan",rar:"rare",loc:"The training ground, late",art:"🌀",
  lines:["You've been drilling until your chakra runs ragged. Then, in the space between one seal and the next, something older than training opens its eye inside you.",
   "The "+(G.kkg)+" doesn't wake gently. It wakes like it's been waiting."],
  choices:[
   {t:"Reach for it",res:["It answers. The world reads differently for a full minute, and you understand why your bloodline was feared.",
     "Your kekkei genkai is awake, and it knows you."],fn:function(){G.kkgKnown=true;FX.talent(G.kkg+" awakened","legendary","Awakened the "+G.kkg);FX.add("chakra",-5);FX.add("chakraControl",4);FX.hist("Awakened the "+G.kkg,"bloodline",true);try{if(typeof award==="function")award("kg_awake")}catch(e){}}},
   {t:"Seal it away for now",res:["You close your eyes and step back from the edge. It doesn't leave. It just waits, patient as blood."],fn:function(){FX.tr("disciplined",6);FX.pend("kg_trial",G.age+ri(2,4),{})}}
  ]}}});

/* ---- VILLAGE & WORLD ---- */
TPL.push({id:"vil_war_drills",cat:"War",rar:"common",w:6,gate:function(){return G.villageState.warActive&&G.age>=6},
 build:function(){return{t:"The War Drums",cat:"War",loc:G.villageName,art:"🔥",
  lines:["The gates double their guards. Weapons flow to the front and the market goes quiet in the way markets do when everyone's son is deployable.",
   "You hear more than one mother arguing with a recruiter this week."],
  choices:[
   {t:"Volunteer for support duty",res:["You carry stretchers, run messages, learn what 'the front' actually smells like. The village notices who stepped up."],fn:function(){FX.rep(5);FX.add("endurance",3);FX.tr("compassionate",4);FX.add("health",-3)}},
   {t:"Train like the war is coming for you",res:["You train with a desperation the peace years never taught you."],fn:function(){FX.add("taijutsu",3);FX.add("ninjutsu",2);FX.tr("brave",5)}},
   {t:"Keep your head down",res:["You get very good at being unremarkable. It's a survival skill. It costs something too."],fn:function(){FX.tr("cowardly",5);FX.add("happiness",-2)}}
  ]}}});
TPL.push({id:"vil_festival",cat:"Celebration",rar:"common",w:6,gate:function(){return !G.villageState.warActive&&G.age>=5},
 build:function(){return{t:"Festival Night",cat:"Celebration",loc:G.villageName+" streets",art:"🎆",
  lines:["Lanterns everywhere, grilled squid smoke, drums from the shrine steps. The whole village is out and nobody is talking about missions.",
   "Someone's grandmother pulls you into a dance you don't know and won't let you apologize."],
  choices:[
   {t:"Lose yourself in it",res:["For one night the war, the academy and the future all wait outside the lantern light. You remember this night for the rest of your life."],fn:function(){FX.add("happiness",6);FX.rep(1)}},
   {t:"Work the festival stalls",res:["You spend the night carrying, cooking, hauling. You see the festival from the other side and pocket an honest wage."],fn:function(){FX.ryo(ri(60,150));FX.tr("disciplined",4)}},
   {t:"Slip away to train while the village sleeps",res:["The training grounds are yours alone, lit by festival glow. Two hours of perfect silence and perfect focus."],fn:function(){FX.add("chakraControl",3);FX.tr("disciplined",5)}}
  ]}}});
TPL.push({id:"vil_politics",cat:"Political",rar:"uncommon",w:4,gate:function(){return G.age>=14&&rankRank()>=2},
 build:function(){return{t:"Two Councilors, One Room",cat:"Political",loc:"The council annex",art:"🏛️",
  lines:["You're asked to escort documents between two councilors who haven't spoken directly in years. Both use the trip to sound you out about the other.",
   "Whatever you say in that corridor will travel further than you will."],
  choices:[
   {t:"Stay neutral, deliver the papers",res:["You say nothing worth repeating. Both councilors decide you're discreet. That reputation is worth more than either faction's favor."],fn:function(){FX.rep(3);FX.tr("calm",4)}},
   {t:"Back the one whose policies you believe in",res:["You speak plainly. One councilor gains an ally and one gains a grudge, and now you have both."],fn:function(){FX.rep(chance(.5)?4:-3);FX.tr("brave",5)}},
   {t:"Listen more than you speak",res:["By the end you know things about the village's future that aren't public yet. You keep them."],fn:function(){FX.add("intelligence",4);FX.tr("intelligent",4)}}
  ]}}});
TPL.push({id:"vil_refugee",cat:"Village",rar:"uncommon",w:4,gate:function(){return G.age>=8&&(G.villageState.warActive||G.era.war>.1)},
 build:function(){return{t:"The Road Full of Families",cat:"Village",loc:"The main gate",art:"🚶",
  lines:["Refugees from the border villages arrive in a slow, exhausted line. The aid stations are short on hands and long on need.",
   "A girl your age carries everything she owns in one bundle and hasn't spoken since arrival."],
  choices:[
   {t:"Give what you can — time, food, hands",res:["Weeks of it. The girl starts speaking again in month two. Her first full sentence is thanks, and it's aimed at you."],
    fn:function(){FX.tr("compassionate",8);FX.rep(4);FX.mem(null,"","",  "helped");FX.hist("Helped refugee families at the gate","village",true)}},
   {t:"Sign up with the guard rotation",res:["You stand gate watch through the worst of it, learning names and faces and how to spot the desperate ones lying about their papers."],fn:function(){FX.add("perception",4);FX.rep(3);FX.tr("disciplined",4)}},
   {t:"Focus on your training — others are handling it",res:["It's true, others are handling it. The thought sits differently at night."],fn:function(){FX.tr("selfish",6);FX.add("happiness",-2)}}
  ]}}});

/* ---- MISSIONS, INJURY, EXAMS, PROMOTION ---- */
TPL.push({id:"mis_first",cat:"Missions",rar:"uncommon",w:6,gate:function(){return G.rank==="Genin"&&!G.milestones.firstMission},
 build:function(){return{t:"First Real Mission",cat:"Missions",loc:"The mission desk",art:"📜",
  lines:["D-rank your whole career until today. The jonin at the desk slides the scroll across with two words: 'Escort. Widow.'",
   "Three days out, two days back, a cart road with known bandit traffic."],
  choices:[
   {t:"Take it seriously from the first step",res:["You watch the treeline like your teacher taught. The bandits probe the column twice and find nothing worth their blood.",
     "The widow pays in dried fish and an obscene tip. First mission: flawless."],fn:function(){FX.ryo(ri(80,150));FX.rep(3);FX.mile("firstMission","Completed a first flawless escort mission");FX.add("perception",3)}},
   {t:"Learn from the jonin leading it",res:["You spend the trip watching how they move, read terrain, place watches. Half the lessons you won't understand for years."],
    fn:function(){FX.add("perception",4);FX.add("intelligence",3);FX.mile("firstMission","First mission completed, eyes open the whole way")}},
   {t:"Take a foolish risk to prove yourself",res:["You scout ahead alone against orders. It works. It also terrifies the jonin, who files a note about judgment alongside the mission report."],
    fn:function(){FX.tr("reckless",8);FX.add("perception",2);FX.rep(1);FX.mile("firstMission","First mission done, with a mark on your file for recklessness")}}
  ]}}});
TPL.push({id:"inj_recovery",cat:"Injury & Recovery",rar:"common",w:5,gate:function(){return st("health")<65&&G.age>=8},
 build:function(){return{t:"The Long Recovery",cat:"Injury & Recovery",loc:"The hospital wing",art:"🩹",
  lines:["The medic says 'weeks' in the tone people use for 'months'. The ceiling above your cot has one water stain shaped like a fox.",
   "Visitors come. Some bring fruit. One brings a training schedule you could do lying down."],
  choices:[
   {t:"Do the lying-down training",res:["Slow chakra cycling, five hours a day. Boredom becomes discipline becomes control."],fn:function(){FX.add("chakraControl",4);FX.add("health",6)}},
   {t:"Read everything they'll bring you",res:["Strategy, cartography, history. The body heals. The mind sprints."],fn:function(){FX.add("intelligence",4);FX.add("health",4)}},
   {t:"Sneak out to train early",res:["You make it two days before the medics catch you. The wound reopens. Everyone is furious and nobody is surprised."],fn:function(){FX.add("health",-8);FX.add("taijutsu",2);FX.tr("reckless",7)}}
  ]}}});
TPL.push({id:"exam_chunin",cat:"Exams",rar:"uncommon",w:5,gate:function(){return G.rank==="Chunin"===false&&G.rank==="Genin"&&G.age>=14&&st("reputation")>=35},
 build:function(){return{t:"Chunin Exam Rumors",cat:"Exams",loc:"The academy bulletin",art:"📋",
  lines:["The postings go up: chunin selection exams, three stages, sponsors required. Your name gets mentioned by two different jonin before you've even decided.",
   "It's early. Very early. People fail these exams in ways that follow them."],
  choices:[
   {t:"Put your name in",res:["The exam hall is colder than rumors promised. You survive the first stage on nerve and the second on preparation. The third is where you find out who you are.",
     (ri(0,9)>4?"You pass. Chunin, young, and no one will ever quite believe how.":"You fail the third stage. The proctor's words follow you out: 'Next cycle. You'll be ready, and you'll hate that I was right.'")],
     fn:function(){var passed=ri(0,9)>4;if(passed){FX.mile("chuninAttempt","Passed the chunin exams early");FX.rep(8);try{promote("Chunin","Promoted to Chunin on the exam stage.")}catch(e){}}else{FX.tr("disciplined",6);FX.add("happiness",-4);FX.pend("exam_redemption",G.age+ri(2,3),{})}}},
   {t:"Wait — get stronger first",res:["You watch that cycle's failures from the stands. Half of them never come back from what the third stage showed them."],fn:function(){FX.tr("calm",5);FX.add("intelligence",3)}}
  ]}}});
TPL.push({id:"prom_hero",cat:"Promotion",rar:"uncommon",w:5,gate:function(){return rankRank()>=2&&st("reputation")>=55&&!G.milestones.heroSalute},
 build:function(){return{t:"Your Name, Out Loud",cat:"Promotion",loc:"The mission hall",art:"🎖️",
  lines:["A mission report gets read aloud in the hall — your operation, your decisions, the outcome. Commanders repeat your name to each other like a coin they're testing.",
   "Afterward, a jonin you've never spoken to nods at you across the room. Just that."],
  choices:[
   {t:"Stand there and take it",res:["You've learned that moment matters more than any speech. Your file gets a mark that opens doors."],fn:function(){FX.mile("heroSalute","Named aloud in the mission hall");FX.rep(6);FX.tr("confident",5)}},
   {t:"Credit your team first",res:["You name every name but your own. It goes around the village twice by dinner. The team would follow you off a cliff now."],
    fn:function(){FX.mile("heroSalute","Named aloud in the mission hall — and gave the credit away");FX.rep(4);if(G.teammates&&G.teammates.length)G.teammates.forEach(function(n){FX.rel(n,10)})}}
  ]}}});

/* ---- TRAGEDY & LOSS ---- */
TPL.push({id:"trag_battle_loss",cat:"Tragedy",rar:"rare",w:3,once:false,gate:function(){return G.villageState.warActive&&rankRank()>=2&&G.age>=14&&!recently("trag_battle_loss",10)},
 build:function(){var team=G.teammates&&G.teammates.filter(function(n){return n.alive});
  var n=team&&team.length?pick(team):null;
  return{t:"The Roll Call",cat:"Tragedy",rar:"rare",loc:"The memorial stone",art:"🕯️",
   lines:["The casualty list goes up on the hall wall. You read it three times hoping the name changes.",
    n?n.name.split(" ")[0]+" isn't coming back. The mission reports call it 'an acceptable loss.' You were there. It wasn't acceptable. It was arithmetic.":"Someone from your graduating class isn't coming back. You'd almost stopped writing to them."],
   choices:[
    {t:"Carry it — visit the stone every year",res:["You do. For decades. The village learns your face at that wall."],fn:function(){if(n){n.alive=false;FX.mem(n,"","")}FX.add("happiness",-6);FX.tr("compassionate",6);FX.hist("Lost "+(n?n.name:"a classmate")+" to the war","tragedy",true)}},
    {t:"Turn grief into ferocity",res:["Something in you goes quiet and hard. Your next three missions are flawless and merciless. The medics start checking on you."],
     fn:function(){if(n)n.alive=false;FX.add("happiness",-4);FX.tr("ruthless",8);FX.tr("disciplined",5);FX.hist("Lost "+(n?n.name:"a classmate")+" to the war","tragedy",true)}},
    {t:"Blame the command structure — out loud",res:["You say it in the hall where everyone can hear. Half the room agrees. The other half writes your name down for different reasons."],
     fn:function(){if(n)n.alive=false;FX.rep(chance(.5)?4:-6);FX.tr("brave",7);FX.hist("Publicly blamed command for the losses","political",true)}}
  ]}}});
TPL.push({id:"trag_orphan_day",cat:"Family",rar:"uncommon",w:4,gate:function(){return G.household==="orphan"&&G.age>=6&&!recently("trag_orphan_day",6)},
 build:function(){return{t:"The Orphanage Ledger",cat:"Family",loc:"The orphanage",art:"🕯️",
  lines:["The matron keeps a ledger of every child's parents. Yours takes up half a line. On the hard days you find yourself reading it anyway.",
   "Today she catches you at it, and doesn't pretend not to."],
  choices:[
   {t:"Ask her about them",res:["She tells you what she remembers: small things, true things. The smell of your father's soap. Your mother's terrible singing. You hold them both."],
    fn:function(){FX.add("happiness",2);FX.tr("compassionate",4);FX.hist("Learned small true things about your parents","family",false)}},
   {t:"Close the ledger yourself",res:["'Someday,' you tell the book, 'I'll give you a better ending.'"],fn:function(){FX.tr("ambitious",7);FX.tr("disciplined",4)}},
   {t:"Say nothing and walk away",res:["Some doors you're not ready to open. The matron lets you have that."],fn:function(){FX.add("happiness",-2)}}
  ]}}});

/* ---- ROMANCE (age-gated, tasteful) ---- */
TPL.push({id:"rom_meet",cat:"Romance",rar:"uncommon",w:5,gate:function(){return G.age>=16&&G.alive&&!recently("rom_meet",6)},
 build:function(){var n=newNPC({age:G.age+ri(-2,3),kind:"romance",rel:ri(10,25),village:G.village});G.relationships.push(n);
  return{t:"Someone New",cat:"Romance",loc:pick(["the market bridge","the training field at dusk","the mission hall steps","the library"]),art:"🌸",
   lines:["You keep ending up at the same place at the same time as "+n.name.split(" ")[0]+", "+pick(["a genin from another squad","a medic-in-training with ink-stained fingers","a weapon shop clerk who knows every blade by name","a chunin with a laugh that carries"])+"."],
   say:{name:n.name.split(" ")[0],say:pick(["'Third time this week. Are you following me, or is the village just small?'","'You train like you're angry at something. Want to talk about it, or race about it?'","'You're the one who [did that thing everyone mentions]. I had you pictured taller.'","'I saved you the last dumpling. That's practically a marriage proposal where I'm from.'"])},
   choices:[
    {t:"Stay and talk",res:["The conversation runs long. You both miss what you were supposed to be doing."],fn:function(){FX.rel(n,12);FX.pend("rom_bloom",G.age+ri(1,3),{id:n.id})}},
    {t:"Trade names and move on",res:["A name, a nod, a door left open somewhere in the future."],fn:function(){FX.rel(n,5)}},
    {t:"Tease them back",res:["They laugh like they weren't expecting to. They look at you differently after that."],fn:function(){FX.rel(n,10);FX.tr("confident",4);FX.pend("rom_bloom",G.age+ri(1,2),{id:n.id})}}
  ]}}});
TPL.push({id:"rom_bloom",cat:"Romance",rar:"uncommon",w:2,gate:function(){return false}, /* reached only via pending */
 build:function(){return{t:"",cat:"Romance",lines:[],choices:[]}}});

/* ---- LEGENDARY / RARE / SECRET ---- */
TPL.push({id:"leg_sage",cat:"Legendary",rar:"legendary",w:1,once:true,gate:function(){return G.age>=9&&(st("chakra")>=45||G.kkgKnown||trait("disciplined")>=60)},
 build:function(){return{t:"The Wanderer Who Shouldn't Exist",cat:"Legendary",rar:"legendary",loc:"The old mountain road",art:"🌙",
  lines:["You meet an old traveler on the high road. Their chakra is like weather. Their eyes have seen villages that no longer exist.",
   "They look at you the way smiths look at ore."],
  say:{name:"The wanderer",say:pick(["'Hmm. Unfinished. That's not an insult. Most people finish far too early.'","'The village will teach you to be useful. Ask me and I'll teach you to be free. The two lessons hate each other.'","'Your chakra hums like a struck bell. Who taught you to listen to it?'"])},
  choices:[
   {t:"Ask for one lesson",res:["One lesson. A single breathing pattern that changes how chakra moves through you forever. They're gone before you finish thanking them.",
     "Nobody believes the story. Your chakra control tells the truth anyway."],fn:function(){FX.add("chakraControl",6);FX.add("chakra",4);FX.talent("The Wanderer's Breath","legendary","Learned a breathing art from a legendary wanderer");FX.hist("Met a legendary wanderer on the mountain road and learned a breathing art","legendary event",true)}},
   {t:"Ask who they are",res:["'Nobody, lately,' they say, and the words carry a weight of titles laid down. They walk on. You never learn more."],fn:function(){FX.add("intelligence",3);FX.hist("Met and spoke with a legendary wanderer","legendary event",true)}},
   {t:"Offer them food and your fire",res:["You share your lunch by the roadside like they're anyone. They eat slowly and talk about weather. It's the most ordinary extraordinary hour of your life."],
    fn:function(){FX.tr("compassionate",5);FX.add("willpower",2);FX.pend("sage_gift",G.age+ri(3,6),{})}}
  ]}}});
TPL.push({id:"sec_scroll",cat:"Secret",rar:"secret",w:1,once:true,gate:function(){return inAcademy()&&(trait("reckless")>=45||st("intelligence")>=50)},
 build:function(){return{t:"The Sealed Section",cat:"Secret",rar:"secret",loc:"The academy archive",art:"🔒",
  lines:["The archive's back wall has a seal on it that isn't on any diagram. It's old. It's weaker than it looks. It is absolutely off limits.",
   "You are alone in the archive, and nobody is coming for an hour."],
  choices:[
   {t:"Break the seal",res:["Inside: one scroll, half-burned, describing a technique the village classified three wars ago. You read it twice before your nerve returns. The knowledge is in you now. So is the risk."],
    fn:function(){FX.tr("reckless",8);FX.add("ninjutsu",5);FX.hist("Broke the archive seal and read a classified scroll","secret event",true);FX.pend("scroll_consequences",G.age+ri(1,3),{})}},
   {t:"Memorize the seal instead",res:["You photograph it with your mind and leave everything untouched. A problem for a smarter day."],fn:function(){FX.add("intelligence",4);FX.tr("disciplined",5)}},
   {t:"Walk away",res:["Some doors are locked for reasons that outlive the people who locked them. You go practice forms."],fn:function(){FX.tr("disciplined",6)}}
  ]}}});
TPL.push({id:"rare_traveler",cat:"Unexpected Encounter",rar:"rare",w:2,once:false,gate:function(){return G.age>=10},
 build:function(){return{t:"The Mysterious Traveler",cat:"Unexpected Encounter",rar:"rare",loc:"The border road",art:"🌫️",
  lines:["A traveler with a hidden blade and an accent from a village that burned down decades ago asks to share your fire.",
   "In exchange for dinner they offer one true thing. Just one. You choose the question."],
  choices:[
   {t:"Ask about your clan",res:["They talk for an hour about the "+(G.clanName||"old families")+" — the feuds, the exiles, the one branch that vanished without records. Some of it explains your family more than you'd like."],
    fn:function(){FX.add("intelligence",4);FX.hist("Learned forgotten clan history from a border traveler","discovery",false)}},
   {t:"Ask how to get stronger",res:["'Stop training what's already strong. The weakness is where the ceiling is.' You spend a month proving them right."],fn:function(){var weak=["genjutsu","medical","kenjutsu","chakraControl"].sort(function(a,b){return st(a)-st(b)})[0];FX.add(weak,5)}},
   {t:"Ask nothing — just share the fire",res:["You eat in comfortable silence. They leave at dawn leaving exact payment and a carved wooden bird."],fn:function(){FX.tr("calm",4);G.flags=G.flags||{};G.flags.woodenBird=true}}
  ]}}});
TPL.push({id:"betray_teammate",cat:"Betrayal",rar:"rare",w:2,once:false,gate:function(){var t=G.teammates&&G.teammates.filter(function(n){return n.alive});return t&&t.length&&rankRank()>=2&&!recently("betray_teammate",12)},
 build:function(){var n=pick(G.teammates.filter(function(x){return x.alive}));
  return{t:"The Wrong Hand",cat:"Betrayal",rar:"rare",loc:"The drop point",art:"🌑",
   lines:["The intel your squad was sold was wrong. Deliberately wrong. The ambush knew exactly where you'd be.",
    "Someone fed it to them. The trail is thin, but it's there, and it ends close to home."],
   choices:[
    {t:"Investigate quietly",res:["Three weeks of quiet work. The trail ends at "+n.name.split(" ")[0]+"'s door. You don't confront them. You file what you found and watch them get assigned away from you forever."],
     fn:function(){FX.tr("calm",6);FX.tr("intelligent",5);FX.rel(n,-40);FX.mem(n,"you discovered their betrayal and said nothing","betrayed");FX.hist("Discovered "+n.name.split(" ")[0]+"'s betrayal","betrayal",true)}},
    {t:"Confront them directly",res:["'Why.' They don't deny it. Money, they say, or family, or fear — the reason barely matters. You report them yourself.",
     "The village thanks you for your service in a tone that means 'this will follow you'."],fn:function(){FX.tr("loyal",8);FX.tr("brave",6);FX.rel(n,-60);FX.rep(4);FX.hist("Confronted and reported "+n.name.split(" ")[0]+"'s betrayal","betrayal",true)}},
    {t:"Refuse to believe it",res:["You bury the evidence. The squad never knows how close it came. Some nights you still check the drop points twice."],
     fn:function(){FX.tr("selfish",5);FX.add("happiness",-4);FX.rel(n,0)}}
  ]}}});
TPL.push({id:"disc_talent_nin",cat:"Training",rar:"uncommon",w:4,gate:function(){return G.age>=7&&st("ninjutsu")>=25&&!G.talents.some(function(t){return t.t==="Seal-shaper"})},
 build:function(){return{t:"Your Hands Move First",cat:"Training",loc:"The practice field",art:"🌀",
  lines:["Mid-drill, your hand seals blur past what your mind is tracking. The jutsu lands before you've finished thinking it.",
   "You stand very still, then do it again to make sure."],
  choices:[
   {t:"Chase the feeling",res:["Hours vanish. When you surface, the field is dark and your fingers ache and something new lives in your hands."],
    fn:function(){FX.talent("Seal-shaper","rare","Your hand seals run faster than thought");FX.add("ninjutsu",4)}},
   {t:"Slow down and study it",res:["You rebuild the motion piece by piece until it obeys intention instead of instinct. Slower. Deeper."],fn:function(){FX.talent("Methodical seals","uncommon","You build techniques with deliberate precision");FX.add("chakraControl",4)}}
  ]}}});
TPL.push({id:"disc_talent_lead",cat:"Training",rar:"uncommon",w:3,gate:function(){return rankRank()>=2&&st("leadership")>=25&&!G.talents.some(function(t){return t.t==="Field Commander"})},
 build:function(){return{t:"Everyone Looked at You",cat:"Training",rar:"uncommon",loc:"A collapsed corridor",art:"🎖️",
  lines:["The tunnel came down. In the dust and screaming, before anyone decided anything, they all looked at you.",
   "And you knew what to say. That's a talent. The academy has no class for it."],
  choices:[
   {t:"Accept it",res:["Command is a weight you'll carry for decades. You lift it."],fn:function(){FX.talent("Field Commander","rare","People follow your voice in chaos");FX.add("leadership",6);FX.rep(3)}},
   {t:"Shake it off — you're a blade, not a banner",res:["You hand the moment to the squad leader and take point instead. Both paths are real. You picked yours."],fn:function(){FX.add("taijutsu",3);FX.tr("loyal",5)}}
  ]}}});

/* ============================== pending: remaining handlers ============================== */
PENDING_HANDLERS.friend_deep=function(p){
  var n=G.relationships.filter(function(x){return x.id===p.d.id&&x.alive})[0];if(!n)return;
  queue({t:"The Friendship Gets Real",cat:"Friendship",rar:"uncommon",
    lines:["Something happens to "+n.name.split(" ")[0]+"'s family — "+pick(["a bankruptcy in slow motion","an illness nobody names out loud","a debt with men attached to it"])+" — and you find out because you're the one they called.",
     "Not their squad. Not their sensei. You."],
    choices:[
     {t:"Show up with everything you have",res:["You spend your savings, your week and your reputation on it. They don't forget. Neither does anyone who heard."],
      fn:function(){FX.rel(n,20);FX.mem(n,"you showed up when it counted","saved");FX.add("happiness",2)}},
     {t:"Be there in the ways that cost less",res:["You can't fix it. You cook, you listen, you keep them company at the hospital. It's enough. It has to be."],fn:function(){FX.rel(n,10);FX.tr("compassionate",5)}}
    ]});
};
PENDING_HANDLERS.ally_debt=function(p){
  var n=G.relationships.filter(function(x){return x.id===p.d.id&&x.alive})[0];if(!n)return;
  queue({t:"They Remember",cat:"Friendship",rar:"common",
    lines:[n.name.split(" ")[0]+" tracks you down between classes. 'You stood up for me once. Word gets around about people like that.'",
     "They want to train with you. Every week. Starting now."],
    choices:[
     {t:"Agree — train together weekly",res:["It becomes the fixed point of your weeks. Your taijutsu grows; so does something harder to measure."],
      fn:function(){FX.rel(n,12);FX.add("taijutsu",2);FX.add("willpower",2);FX.pend("rival_return",G.age+ri(4,6),{id:n.id,age:G.age})}},
     {t:"Agree, but keep your own methods",res:["You train in the same yard and let the styles stay different. Comparison sharpens you both."],fn:function(){FX.rel(n,6);FX.add("taijutsu",1)}}
    ]});
};
PENDING_HANDLERS.rom_bloom=function(p){
  var n=G.relationships.filter(function(x){return x.id===p.d.id&&x.alive})[0];if(!n)return;
  queue({t:"Something Real",cat:"Romance",rar:"uncommon",art:"🌸",
    lines:["Months of the same market bridge, the same training field, the same jokes that are only half jokes.",
     n.name.split(" ")[0]+" says it plainly, no poetry: 'I like you. I'd like to see where this goes. If you want that too.'"],
    choices:[
     {t:"Yes",res:["You start something real, built at walking pace. The village notices within a month. Your mother is thrilled, which is mortifying and wonderful.",
       "They become part of your life's architecture."],fn:function(){FX.rel(n,25);if(!G.family.spouse&&G.age>=18){G.family.spouse=n;n.kind="spouse";FX.hist("Began a life with "+n.name,"romance",true)}else{FX.hist("Fell for "+n.name,"romance",true)}G.bestFriend=G.bestFriend||n.id}},
     {t:"Not yet — say so honestly",res:["'Ask me again in a year,' you say, and mean it kindly. They nod once. The bridge keeps its schedule."],fn:function(){FX.rel(n,5);FX.pend("rom_bloom",G.age+ri(2,3),{id:n.id})}},
     {t:"No",res:["You're honest. It stings them more than they show. The market bridge changes its schedule."],fn:function(){FX.rel(n,-15);FX.add("happiness",-2)}}
    ]});
};
PENDING_HANDLERS.hidden_place=function(p){
  queue({t:"The Secret Training Spot",cat:"Discovery",rar:"uncommon",art:"🌲",
    lines:["You go back to the split path and make the hidden place yours: "+pick(["cleared ground, a water barrel hauled out in three trips, a post to beat","a flat stone that turns out to be ideal for balance work","a cliff face with holds nobody else knows"])+"."],
    choices:[
     {t:"Train there in secret",res:["A private place to fail loudly. Your control improves; so does your poker face."],fn:function(){FX.add("chakraControl",3);FX.add("taijutsu",2);G.flags=G.flags||{};G.flags.secretSpot=true}},
     {t:"Show one person",res:["You bring the one person you trust most. It changes the place a little and the friendship a lot."],
      fn:function(){var bf=G.relationships.filter(function(x){return x.id===(G.bestFriend||"")&&x.alive})[0]||classmates()[0]||sibs()[0];if(bf){FX.rel(bf,15);FX.mem(bf,"you showed them your secret place","befriended")}}}
    ]});
};
PENDING_HANDLERS.fam_secret2=function(p){
  var n=G.relationships.filter(function(x){return x.id===p.d.id&&x.alive})[0];if(!n)return;
  queue({t:"What the Drawer Meant",cat:"Family",rar:"rare",art:"🔐",
    lines:[n.name.split(" ")[0]+" finally keeps the promise from years ago. Over one long evening, the locked drawer becomes a story: the relative nobody named, the oath, the reason the family locks things.",
     "You're being handed the keys, and the weight that comes with them."],
    choices:[
     {t:"Accept the family truth",res:["You carry it now. It changes how you see the house, the name, yourself."],fn:function(){FX.tr("intelligent",4);FX.tr("loyal",6);FX.hist("Inherited the family's hidden story","family secret",true)}},
     {t:"Ask what they want you to do with it",res:["'Nothing, yet. Just hold it.' You hold it."],fn:function(){FX.tr("calm",5);FX.rel(n,10)}}
    ]});
};
PENDING_HANDLERS.kg_trial=function(p){
  queue({t:"The Blood Stirs Again",cat:"Clan",rar:"rare",art:"🌀",
    lines:["It's back — the pressure behind your eyes, the old blood testing the lock you built. Patient. Certain."],
    choices:[
     {t:"Open it this time",res:["The "+(G.kkg||"bloodline")+" wakes fully. It's not power that arrives so much as permission."],
      fn:function(){G.kkgKnown=true;FX.talent((G.kkg||"Bloodline")+" awakened","legendary","Awakened the "+(G.kkg||"bloodline"));FX.hist("Awakened the "+(G.kkg||"bloodline"),"bloodline",true);try{if(typeof award==="function")award("kg_awake")}catch(e){}}},
     {t:"Hold the lock another year",res:["You keep the door shut. It respects the lock, and you, a little more each year."],fn:function(){FX.tr("disciplined",7);FX.pend("kg_trial",G.age+ri(2,3),{})}}
    ]});
};
PENDING_HANDLERS.exam_redemption=function(p){
  queue({t:"Next Cycle",cat:"Exams",rar:"uncommon",art:"📋",
    lines:["The chunin exam postings go up again. The proctor who failed you is supervising registrations. They remember you; you can see it.",
     "'Back,' they say. It isn't a question."],
    choices:[
     {t:"Sign again",res:[(ri(0,9)>3?"You pass. Properly this time, no luck in it anywhere. The proctor writes your name without comment, which from them is a parade.":"The third stage takes you again. But you go further than last cycle, and the proctor nods as you leave. 'Closer.'")],
      fn:function(){var passed=ri(0,9)>3;if(passed){FX.mile("chuninPass","Passed the chunin exams");FX.rep(8);try{promote("Chunin","Promoted to Chunin on the exam stage.")}catch(e){}}else{FX.tr("disciplined",7)}}},
     {t:"Not this cycle",res:["You walk past the desk. The proctor doesn't stop you. The word 'next' settles in for another year."],fn:function(){FX.add("happiness",-2)}}
    ]});
};
PENDING_HANDLERS.rival_tourney=function(p){
  var t=TPL.find(function(x){return x.id==="riv_tourney"});
  if(t)SCENEQ.push(t.build());
};
PENDING_HANDLERS.scroll_consequences=function(p){
  queue({t:"The Archive Knows",cat:"Secret",rar:"rare",art:"🔒",
    lines:["A quiet summons. The archive seal was repaired last month — professionally, and with a note in the log: 'authorized readers only.'",
     "The archivist doesn't accuse. They just leave a form on the table and two doors open: report your knowledge, or claim ignorance."],
    choices:[
     {t:"Report it",res:["You're fined a season's stipend and quietly respected for it. The scroll's contents are added to your authorized studies — legally, now."],fn:function(){FX.ryo(-200);FX.rep(3);FX.tr("loyal",5)}},
     {t:"Claim ignorance",res:["The archivist nods slowly, writes something, and lets you go. You keep the technique. You also keep watching the door for a year."],fn:function(){FX.tr("cunning"===""?"calm":"calm",5);FX.pend("whispers",G.age+ri(2,4),{})}}
    ]});
};
PENDING_HANDLERS.sage_gift=function(p){
  queue({t:"Left at Your Door",cat:"Legendary",rar:"legendary",art:"🌙",
    lines:["A wrapped bundle waits on your step with no note. Inside: a practice weapon of impossible make, light as a rumor and balanced like a promise.",
     "You know exactly who left it. There's no one left to thank."],
    choices:[
     {t:"Train with it every day",res:["The weapon teaches as much as any teacher. Your form sharpens around it like water finding a channel."],
      fn:function(){FX.add("kenjutsu",5);FX.add("speed",3);FX.talent("Heir of the Wanderer","legendary","Training with a weapon left by a legendary wanderer")}},
     {t:"Keep it wrapped — some gifts are tests",res:["You leave it safe and train as before. Years later you unwrap it, ready, and it fits your hand like it was measured for you."],fn:function(){FX.tr("disciplined",6);FX.pend("sage_gift",G.age+ri(4,6),{})}}
    ]});
};
PENDING_HANDLERS.fam_grief=function(p){};

/* ============================== academy classroom ============================== */
function seedClassroom(){
  var g=ensure(G);
  if(!G.academy||G.academy._class)return;
  var made=[];
  for(var i=0;i<ri(4,6);i++){
    var n=newNPC({age:G.age,kind:"classmate",village:G.village,rel:ri(10,40)});
    n.rank="Academy Student";n.clan=chance(.3)?rollClanSafe():null;G.relationships.push(n);made.push(n);
  }
  var t=newNPC({age:ri(27,48),kind:"teacher",village:G.village,rel:ri(25,45),job:"academy instructor"});
  t.rank="Chunin";t.skill=ri(6,9);G.relationships.push(t);
  G.academy._class=true;g.academyClassIds=made.concat([t]).map(function(n){return n.id});
}
function rollClanSafe(){try{return rollClan(G.village).n}catch(e){return null}}

/* ============================== milestones ============================== */
function checkMilestones(){
  var g=ensure(G);
  if(G.age===G.villageData.academyAge&&inAcademy())FX.mile("academyFirstDay","First day at the "+G.villageName+" Academy");
  if(G.rank==="Genin"&&!G.milestones.graduated)FX.mile("graduated","Graduated from the academy");
  if(G.teammates&&G.teammates.length&&!G.milestones.team)FX.mile("team","Assigned to a three-man squad");
  if(G.sensei&&!G.milestones.mentor)FX.mile("mentor","Began training under "+G.sensei.name.split(" ")[0]);
  if(G.missionStats&&G.missionStats.total>=1&&!G.milestones.firstMission)FX.mile("firstMission","Completed a first mission");
  if(G.missionStats&&G.missionStats.fail>=1&&!G.milestones.firstFail)FX.mile("firstFail","Survived a first real failure on a mission");
  if(G.rank==="Chunin"&&!G.milestones.chunin)FX.mile("chunin","Promoted to Chunin");
  if(G.rank==="Jonin"&&!G.milestones.jonin)FX.mile("jonin","Promoted to Jonin");
  if(G.rival&&!G.milestones.firstRival){var r=G.relationships.filter(function(n){return n.id===G.rival})[0];if(r)FX.mile("firstRival","A rivalry with "+r.name.split(" ")[0])}
}
function checkRelMilestones(){
  G.relationships.forEach(function(n){
    if(!n.alive)return;ensureNPC(n);
    if(n.rel>=80&&!n._close){n._close=true;fbig(n.name.split(" ")[0]+" has become one of the closest people in your life.","good");
      if(!G.bestFriend){G.bestFriend=n.id;fbig("You'd call "+n.name.split(" ")[0]+" your best friend now.","good")}}
    if(n.rel<=-40&&!n._enemy){n._enemy=true;fbig(n.name.split(" ")[0]+" has become something worse than a stranger to you.","bad")}
  });
}

/* ============================== life record view ============================== */
function renderStory(){
  var g=ensure(G);
  var w=el("div");
  var p=el("div","panel");
  p.appendChild(el("div","tag","life record"));
  p.appendChild(el("h3","serif",G.name+" — Life Record"));
  p.appendChild(el("div","dbio",(G.rank||"")+" · "+(G.villageName||"")+" · "+(G.clanName?G.clanName+" clan":"no clan")+" · "+(G.era?G.era.name:"")));
  var traits=topTraits(3).map(function(x){return TRAIT_LABEL[x.t]||x.t});
  if(traits.length)p.appendChild(el("div","dbio","Shaped by: "+traits.join(", ")));
  if(G.bio)p.appendChild(el("div","dbio",G.bio));
  w.appendChild(p);
  /* talents */
  if(g.talents&&g.talents.length){
    var tp=el("div","panel");tp.appendChild(el("div","tag","talents & bloodlines"));
    g.talents.forEach(function(t){
      var r=el("div","fentry");
      r.appendChild(el("span","fico",t.tier==="legendary"?"🌟":t.tier==="rare"?"✨":"🔸"));
      var b=el("div","fbody");b.appendChild(el("div","fage","Age "+t.age+" · "+t.tier));
      b.appendChild(el("div","ftxt",t.t));r.appendChild(b);tp.appendChild(r);
    });
    w.appendChild(tp);
  }
  /* bonds */
  var alive=G.relationships.filter(function(n){return n.alive});
  var sig=alive.filter(function(n){return Math.abs(n.rel||0)>=40||n.kind==="rival"||n.kind==="spouse"||n.kind==="teacher"}).sort(function(a,b){return Math.abs(b.rel||0)-Math.abs(a.rel||0)}).slice(0,8);
  if(sig.length){
    var rp=el("div","panel");rp.appendChild(el("div","tag","the people in this life"));
    sig.forEach(function(n){
      var r=el("div","fentry");
      r.appendChild(el("span","fico",n.kind==="rival"?"⚔️":n.kind==="spouse"?"💍":n.kind==="teacher"?"🎓":n.kind==="classmate"?"📚":"🤝"));
      var b=el("div","fbody");b.appendChild(el("div","fage",n.name+" · "+relLabel(n)));
      var last=n.mems&&n.mems.length?n.mems[n.mems.length-1]:null;
      b.appendChild(el("div","ftxt",last?("Age "+last.age+" — "+last.what):"No history yet"));
      r.appendChild(b);rp.appendChild(r);
    });
    w.appendChild(rp);
  }
  /* the record itself */
  var hp=el("div","panel");hp.appendChild(el("div","tag","the story so far"));
  var entries=(g.history||[]).slice().sort(function(a,b){return a.age-b.age});
  if(G.bio)entries.unshift({age:0,txt:"Born in "+(G.villageName||"an unknown village")+". "+(G.household==="orphan"?"Orphaned at birth.":G.family&&G.family.parents.length?"Raised by "+G.family.parents.filter(function(n){return n.alive}).map(function(n){return n.name.split(" ")[0]}).join(" and ")+".":"")});
  if(!entries.length)hp.appendChild(el("div","fentry","The story is still being written."));
  entries.forEach(function(h){
    var r=el("div","fentry"+(h.major?" hl":""));
    r.appendChild(el("span","fico",h.kind==="milestone"?"⭐":h.kind==="talent"?"✨":h.kind==="tragedy"?"🕯️":h.kind==="rivalry"?"⚔️":h.kind==="romance"?"🌸":h.kind==="bloodline"?"🌀":"•"));
    var b=el("div","fbody");b.appendChild(el("div","fage","Age "+h.age));
    b.appendChild(el("div","ftxt",h.txt));r.appendChild(b);hp.appendChild(r);
  });
  w.appendChild(hp);
  var holder=$("#vpane")||w;holder.innerHTML="";holder.appendChild(w);
}

/* ============================== init & hooks ============================== */
function init(){
  try{
    if(typeof NAV!=="undefined"&&typeof switchView==="function"){
      if(!NAV.some(function(x){return x[0]==="story"}))NAV.splice(NAV.length-1,0,["story","Record","📖"]);
    }
    if(typeof renderView==="function"){
      var _rv=renderView;
      window.renderView=function(){if(VIEW==="story"){renderStory();return}_rv()};
    }
    if(typeof enrollAcademy==="function"){
      var _en=enrollAcademy;
      window.enrollAcademy=function(){_en();try{seedClassroom()}catch(e){}};
    }
    if(typeof serializeG==="function"){
      var _ser=serializeG;
      window.serializeG=function(){var o=_ser();try{var p=pack(G);for(var k in p)o[k]=p[k]}catch(e){}return o};
    }
    if(typeof deserializeG==="function"){
      var _des=deserializeG;
      window.deserializeG=function(o){var g=_des(o);try{unpack(g,o&&o.life)}catch(e){ensure(g)}return g};
    }
    if(typeof ageUp==="function"){
      var _au=ageUp;
      window.ageUp=function(){_au();if(G&&G.alive&&!SCENE_ON)finishYear()};
    }
  }catch(e){}
}
return {tick:tick,ensure:ensure,pack:pack,unpack:unpack,init:init,queue:queue,yearSummary:yearSummary,finishYear:finishYear,playScenes:function(){if(SCENEQ.length&&!SCENE_ON){SCENE_ON=true;playScene()}},trait:trait,voiceFor:voiceFor,greet:greet,remember:remember,seedClassroom:seedClassroom,renderStory:renderStory,get pendingHandlers(){return PENDING_HANDLERS}};
})();
LIFE.init();
