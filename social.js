/* SOCIAL — hearts & voices: life events, dialogue, relationships, choices, consequences, personality
   Additive layer over LIFE. Nothing existing is removed, reset, or broken; old saves load clean. */
var SOCIAL=(function(){
"use strict";
var FX=LIFE.FX;

/* ============================== helpers ============================== */
function E(){return LIFE.ensure(G)}
function fn(n){return n&&n.name?n.name.split(" ")[0]:"someone"}
function T(k){return LIFE.trait(k)}
function v(n){return LIFE.voiceFor(n)}
function knownAlive(){return (G.relationships||[]).filter(function(n){return n.alive})}
function byKindS(k){return (G.relationships||[]).filter(function(x){return x.kind===k&&x.alive})}
function fam(){return (G.family&&G.family.parents||[]).filter(function(n){return n.alive})}
function placeFor(n){
  if(!n)return "somewhere quiet";
  if(n.kind==="rival")return "The training field";
  if(n.kind==="teacher")return "The academy yard";
  if(n.kind==="sibling"||n.kind==="parent"||n.kind==="guardian")return "Home";
  if(n.kind==="spouse")return "Home";
  if(n.kind==="sensei")return "The training ground";
  return pick(["The market","The ramen stand","A quiet rooftop","The riverbank","The training field"]);
}
function pool(){
  var all=knownAlive().filter(function(n){return n.rel!=null});
  if(!all.length)return null;
  return pick(all);
}

/* ============================== seeds: choices leave consequences ============================== */
function seed(id,d){var g=E();if(!g)return;g.seeds=g.seeds||{};g.seeds[id]={age:G.age,d:d||{}}}
function hasSeed(id){var g=E();return !!(g&&g.seeds&&g.seeds[id])}
function seedData(id){var g=E();return g&&g.seeds&&g.seeds[id]?g.seeds[id].d||{}:{}}
function socLog(id){var g=E();if(!g)return;g.socRecent=g.socRecent||[];g.socRecent.push(id);if(g.socRecent.length>24)g.socRecent=g.socRecent.slice(-24)}
function socAgain(id,span){var g=E();var a=(g&&g.socRecent)||[];return a.slice(-(span||8)).indexOf(id)>=0}

/* ============================== stages & identity ============================== */
var STAGE=[{min:85,l:"bonded to you"},{min:80,l:"best friend"},{min:60,l:"close friend"},
  {min:40,l:"good friend"},{min:20,l:"friend"},{min:0,l:"acquaintance"},
  {min:-25,l:"strained"},{min:-60,l:"rivalrous"},{min:-101,l:"enemy"}];
function stageOf(n){
  var r=n&&n.rel!=null?n.rel:0;
  for(var i=0;i<STAGE.length;i++){if(r>=STAGE[i].min)return STAGE[i].l}
  return "enemy";
}
var ARCH=[
  {n:"The Shield",need:{loyal:60,compassionate:45},line:"When things go wrong, people look for you first."},
  {n:"The Blade",need:{ruthless:60,ambitious:50},line:"You decided what you want, and what you will spend to get it."},
  {n:"The Storm",need:{reckless:60,brave:45},line:"You live loud. Some years you barely survive yourself."},
  {n:"The Shadow",need:{calm:60,intelligent:50},line:"You watch, you wait, and you are rarely surprised."},
  {n:"The Hearth",need:{compassionate:65},line:"People are warmer for knowing you."},
  {n:"The Anchor",need:{disciplined:65},line:"You are the steady one. It costs more than they know."},
  {n:"The Spark",need:{confident:60,shorttempered:45},line:"You burn bright and never apologize for it."},
  {n:"The Wanderer",need:{reckless:50,confident:50},line:"Rules are suggestions you decline to read."},
  {n:"Unwritten",need:{},line:"The shape of you is still forming."}];
function identity(g){
  if(!g||!g.traits)return {n:"Unwritten",line:"The shape of you is still forming."};
  var keys=Object.keys(g.traits).sort(function(a,b){return g.traits[b]-g.traits[a]});
  for(var i=0;i<ARCH.length;i++){
    var ok=true,need=ARCH[i].need;
    for(var k in need){if((g.traits[k]||0)<need[k]){ok=false;break}}
    if(ok)return ARCH[i];
  }
  return ARCH[ARCH.length-1];
}
function traitLabel(k){var M={brave:"bold",cowardly:"cautious",loyal:"loyal",selfish:"selfish",compassionate:"kind",
  ruthless:"cold",disciplined:"disciplined",lazy:"restless",confident:"confident",arrogant:"proud",
  intelligent:"sharp",reckless:"reckless",calm:"calm",shorttempered:"fiery",ambitious:"ambitious"};return M[k]||k}

/* ============================== dialogue engine ============================== */
/* A conversation is a chain of turn scenes played through the existing event card.
   Each turn: the NPC speaks, you answer. Your answer's reply opens the next turn. */
function startConv(n,script,auto){
  if(!n||!script||!script.turns||!script.turns.length)return;
  function queueTurn(i,openLine){
    var t=script.turns[i];
    if(!t)return;
    var lines=[];
    if(openLine)lines.push({name:first(n),say:openLine});
    (Array.isArray(t.say)?t.say:[t.say]).forEach(function(x){lines.push({name:first(n),say:x})});
    var s={t:script.title||"A Conversation",cat:script.cat||"Conversation",
      loc:script.loc||placeFor(n),rar:script.rar||"common",lines:lines,choices:[]};
    var opts=(t.opts||[]).filter(function(o){return !o.need||o.need()});
    if(!opts.length)opts=[{t:"Say nothing"}];
    opts.forEach(function(o){
      s.choices.push({t:o.t,d:o.d,fn:function(){
        if(o.fx){try{o.fx()}catch(e){}}
        var next=(o.goto!=null)?o.goto:(o.end?null:i+1);
        if(next!=null&&script.turns[next])queueTurn(next,o.reply);
        else if(o.reply)LIFE.queue({t:script.title||"A Conversation",cat:script.cat||"Conversation",
          loc:script.loc||placeFor(n),lines:[{name:first(n),say:o.reply}]});
      }});
    });
    LIFE.queue(s);
  }
  socLog(script.id||"conv");
  queueTurn(0,null);
  if(!auto)LIFE.playScenes();
}
/* trait-gated option helper: d carries the trait chip so the player sees why it exists */
function chip(k,txt){return traitLabel(k)+" \u00b7 "+txt}

/* ============================== conversation bank ============================== */
/* Each theme builds a script shaped by the person's voice, your standing, and shared memories. */
function convFx(n,rel,tr,happy,mem,what,tone){
  return function(){
    if(rel)FX.rel(n,rel);
    if(tr)Object.keys(tr).forEach(function(k){FX.tr(k,tr[k])});
    if(happy)FX.add("happiness",happy);
    if(mem)FX.mem(n,what||mem,tone||"befriended");
  };
}
function talk_catchup(n){
  var vv=v(n),r=n.rel||0,m=LIFE.npcRecall(n);
  var opener=(r<-25?vv.cold:r>=55?vv.warm:vv.hi)[0];
  return {id:"catchup",title:"Catching Up",cat:"Conversation",loc:placeFor(n),turns:[
    {say:opener+" "+pick(["\"You look different. Older.\"","\"So. What's new with you?\"","\"I was just thinking about you, actually.\"","\"Walk with me.\""]),
     opts:[
      {t:"\"Same as ever. You?\"",fx:convFx(n,4,{calm:2},2),reply:pick(["\"Same. That's either a good sign or a rut. Haven't decided.\"","\"Busy. The usual. It's good to see your face though.\""])},
      {t:"Tell them what you've been training",fx:convFx(n,5,{confident:3},2),reply:pick(["\"Show me sometime. I'll be honest about how it looks.\"","\"That's a heavy path. Don't lose yourself carrying it.\""])},
      {t:"\"Honestly? It's been a hard year.\"",need:function(){return (G.stats&&G.stats.happiness)<55},fx:convFx(n,8,{compassionate:0},1),reply:pick(["\"...Come here. Sit. Talk to me, actually talk.\"","\"I figured. You wear it in your shoulders. Start from the beginning.\""]),d:"honest \u00b7 opens up"},
      {t:"Just sit with them a while",fx:convFx(n,3,null,3),reply:pick(["You talk about nothing for an hour. It is not nothing.","\"This is nice,\" they admit. \"We should do it more.\""])}
    ]},
    {say:pick(["\"There's something I've been meaning to say.\"","\"Hey. Whatever happens with your career... don't disappear on me.\"","\"You know I've got your back, right? Say it back sometime.\""]),
     opts:[
      {t:"\"I know. Same for you.\"",fx:convFx(n,7,null,3,"a promise between you","loyal"),reply:"\"Good.\" A nod that settles something in both of you."},
      {t:"\"You'd really back me? Even if it costs you?\"",fx:convFx(n,5,{intelligent:2}),reply:pick(["\"Don't make it a test. But yes.\"","\"Within reason. I'm loyal, not a fool. Mostly.\""])},
      {t:"Deflect with a joke",fx:convFx(n,2,{confident:2},2),reply:pick(["They laugh. \"You're impossible.\"","\"One of these days I'll get a straight answer out of you.\""])}
    ]}
  ]};
}
function talk_train(n){
  return {id:"train",title:"Training Together",cat:"Training",loc:placeFor(n),turns:[
    {say:pick(["\"Show me where you are. Warm up first, I'm not carrying anyone.\"","\"Five rounds. Then food.\"","\"You came to sweat or to talk? Perfect. Both.\""]),
     opts:[
      {t:"Match them step for step",fx:convFx(n,6,{disciplined:5},1),reply:pick(["\"Good. Again.\" By the end neither of you can lift your arms.","They nod once at the end. From them, that's a standing ovation."])},
      {t:"Ask them to correct your form",fx:convFx(n,5,{intelligent:4},1),reply:"They break your stance down without mercy and rebuild it better. You'll feel this in the morning, in a good way."},
      {t:"Turn it into a contest",need:function(){return T("reckless")>45||T("confident")>50},d:chip("confident","raises the stakes"),fx:convFx(n,4,{reckless:4,confident:3},2),reply:pick(["\"Loser carries the gear home.\" You lose. Loudly.","You win by a breath. They demand a rematch before you've caught yours."])},
      {t:"Stop early and talk instead",fx:convFx(n,3,{lazy:3},3),reply:"\"Hydration is a technique,\" they declare, lying flat on the dirt. You believe them."}
    ]},
    {say:"\"One more thing.\" "+fn(n)+" looks at you straight. \"When it's real out there, what do you fall back on?\"",
     opts:[
      {t:"\"The people waiting for me to come back.\"",fx:convFx(n,8,{loyal:5}),reply:"\"Then you'll always get back up. Good answer.\""},
      {t:"\"Instinct. I trust what my body learned.\"",fx:convFx(n,5,{disciplined:4}),reply:"\"Then drill until your instinct can't be wrong.\""},
      {t:"\"Nothing. I just refuse to lose.\"",fx:convFx(n,3,{shorttempered:4,ambitious:3}),reply:"\"Refusal breaks, eventually. Build something under it.\""}
    ]}
  ]};
}
function talk_deep(n){
  var m=LIFE.npcRecall(n);
  return {id:"deep",title:"Somewhere Quiet",cat:"Conversation",loc:pick(["A quiet rooftop","The riverbank at dusk","The old shrine steps"]),turns:[
    {say:pick(["\"Do you ever think about what we're actually for?\"","\"Can I say something I don't say out loud?\"","\"Some nights the quiet is too loud. You know?\""]),
     opts:[
      {t:"\"Yeah. More than I let on.\"",fx:convFx(n,7,{calm:3},1),reply:"\"Okay.\" They settle in like a weight came off. \"Then listen: I keep waiting for someone to notice I'm tired all the time.\""},
      {t:"\"Talk to me. I'm listening.\"",fx:convFx(n,8,{compassionate:4},1),reply:pick(["They talk for a long time. When they finish, they look lighter and slightly embarrassed. You promise to keep it.","\"Nobody usually asks twice.\" They tell you the real answer."])},
      {t:"\"Everyone's for themselves, mostly.\"",need:function(){return T("ruthless")>55||T("selfish")>55},d:chip("ruthless","cold honesty"),fx:convFx(n,-3,{ruthless:3}),reply:"\"...That's one answer.\" The evening gets shorter."}
    ]},
    {say:pick(["\"Don't tell anyone I said that. Deal?\"","\"Thanks. You're easy to talk to. It's annoying.\"","\"Anyway. Forget I said anything.\""]),
     opts:[
      {t:"\"Deal. It stays with me.\"",fx:convFx(n,6,null,2,"they trusted you with something heavy","befriended"),reply:"They exhale like they'd been holding that for years. Something settled between you tonight."},
      {t:"\"Never forget it, never repeat it.\"",fx:convFx(n,7,{loyal:4},2,"a secret kept for them","befriended"),reply:"\"That's the strangest way to say yes I've ever heard. ...Thanks.\""},
      {t:"Remember it for later",need:function(){return T("ruthless")>60},d:chip("ruthless","files it away"),fx:function(){FX.tr("intelligent",3);seed("soc_leverage",{id:n.id,who:n.name})},reply:"You smile and say the right thing. Somewhere in you, a drawer slides shut."}
    ]}
  ]};
}
function talk_vent(n){
  return {id:"vent",title:"Getting It Out",cat:"Conversation",loc:placeFor(n),turns:[
    {say:pick(["\"You've got that look. Out with it.\"","\"Who do I need to glare at?\"","\"Rough one, huh?\""]),
     opts:[
      {t:"Let it all out",fx:convFx(n,7,{calm:2},5,"you leaned on them when it counted","befriended"),reply:pick(["They listen all the way through without fixing anything. Somehow that fixes most of it.","\"Yeah. That's heavy.\" They sit with you in it instead of talking you out of it."])},
      {t:"Bite it back",need:function(){return T("disciplined")>55},d:chip("disciplined","holds the line"),fx:convFx(n,2,{disciplined:4},-1),reply:"\"You don't have to be stone with me.\" They don't push, but they notice."},
      {t:"Ask what they'd do",fx:convFx(n,5,{intelligent:3},3),reply:pick(["Their answer is simpler than yours and better.","\"Half of it. Sleep on the other half. That's my whole wisdom.\""])},
      {t:"\"It's nothing.\"",fx:convFx(n,-1,{cowardly:2}),reply:"\"It's never nothing with that face.\" They let it go. Today."}
    ]}
  ]};
}
function talk_memory(n){
  var m=LIFE.npcRecall(n),r=n.rel||0;
  return {id:"memory",title:"An Old Thread",cat:"Memory",loc:placeFor(n),turns:[
    {say:m?pick(["\"I keep thinking about that year.\"","\"You remember when we first really met?\"","\"We've been through more than most people know.\""]):pick(["\"It's strange. We've known each other for so little time and it already matters.\""]),
     opts:[
      {t:"\"Tell me your version of it.\"",fx:convFx(n,6,{intelligent:3},2),reply:pick(["Their version has details yours never had. You listen like it's a new story.","\"You cried, for the record,\" they say, grinning. \"I was dignified.\""])},
      {t:"\"Whatever happened then, I'm glad it led here.\"",need:function(){return r>=30},fx:convFx(n,8,{loyal:4},3),reply:pick(["They look away first. \"...Yeah. Me too.\"","\"Careful. I'll start believing you.\""])}
    ].concat(m&&(m.tone==="insulted"||m.tone==="betrayed")?[
      {t:"\"I was wrong back then. I'm saying it properly now.\"",fx:function(){FX.rel(n,14);FX.mem(n,"the apology you finally gave","befriended");FX.add("happiness",2)},reply:pick(["A long quiet. \"Okay,\" they say finally. \"Okay.\" The word costs them something and gives it back.","\"Took you long enough.\" Their shoulders drop anyway."])}]:[]),
     },
    {say:pick(["\"Anyway. Thanks for coming by.\"","\"Same time next week?\"","\"Don't be a stranger.\""]),
     opts:[
      {t:"\"Wouldn't miss it.\"",fx:convFx(n,4,null,2),reply:"You wouldn't. That's the whole point of people like this."},
      {t:"\"Next time, my treat.\"",need:function(){return (G.ryo||0)>=50},fx:function(){FX.ryo(-50);FX.rel(n,6);FX.add("happiness",2)},reply:"\"Expensive taste for a shinobi.\" They accept anyway."}
    ]}
  ]};
}
function talk_gift(n){
  return {id:"gift",title:"A Small Gift",cat:"Friendship",loc:placeFor(n),turns:[
    {say:pick(["\"What's that look for? You never bring me things.\"","\"Is that for me? You're weird. I love it.\"","\"You didn't have to.\""]),
     opts:[
      {t:"\"Saw it and thought of you.\"",need:function(){return (G.ryo||0)>=60},fx:function(){FX.ryo(-60);FX.rel(n,10);FX.mem(n,"the gift out of nowhere","gift");FX.add("happiness",3)},reply:pick(["They hold it a beat too long. \"Okay. Wow. Thanks.\"","They try to play it cool and fail completely."])},
      {t:"\"Made it myself. Don't laugh.\"",need:function(){return (G.ryo||0)>=10},fx:function(){FX.ryo(-10);FX.rel(n,12);FX.mem(n,"the thing you made for them","gift");FX.add("happiness",3);FX.tr("compassionate",3)},reply:"They don't laugh. They keep it somewhere they can see it, which is its own answer."},
      {t:"Change your mind and keep it",fx:convFx(n,-2,{selfish:3}),reply:"You pocket it. They pretend not to notice, and notice."}
    ]}
  ]};
}
function talk_spar(n){
  return {id:"spar",title:"The Challenge",cat:"Rivalry",loc:"The training field",turns:[
    {say:pick(["\"You're here. Good. I was starting to think you got careful.\"","\"One match. Clean. No excuses after.\"","\"Ready to lose in front of everyone?\""]),
     opts:[
      {t:"\"All out. Right now.\"",fx:function(){FX.rel(n,5);FX.tr("brave",6);FX.add("taijutsu",3);FX.add("health",-5);FX.rep(3)},reply:pick(["You lose by a hair and both of you know the rematch is coming.","You win, barely. They take it harder than they show."]),d:"brutal \u00b7 real stakes"},
      {t:"\"First. Why do you keep finding me?\"",fx:function(){FX.rel(n,8);FX.tr("intelligent",4)},reply:pick(["\"Because everyone else bores me,\" they say, too honest to take back.","\"Because you're the only one who gets better when it's hard.\""]),d:"asks why"},
      {t:"Hold back and study them",need:function(){return T("intelligent")>55},d:chip("sharp","reads the fight"),fx:function(){FX.rel(n,3);FX.tr("intelligent",5);FX.add("perception",3)},reply:"You lose the bout and win the ledger. You know their rhythm now. They'll never be a surprise again."},
      {t:"\"Not today.\"",fx:function(){FX.rel(n,-4)},reply:"\"...Coward's hour,\" they say, and don't push it. This time."}
    ]}
  ]};
}
function talk_confess(n){
  return {id:"confess",title:"Before You Lose the Nerve",cat:"Romance",loc:placeFor(n),rar:"uncommon",turns:[
    {say:pick(["\"You're acting strange today.\"","\"Why are you looking at me like that?\"","\"Okay, out with it. You've got a face.\""]),
     opts:[
      {t:"\"I like you. More than I should've let myself.\"",fx:function(){
          var odds=clamp((n.rel||0)+T("confident")/4-20,20,92);
          if(chance(odds/100)){n.romance=true;FX.rel(n,12);FX.mem(n,"the confession under the quiet sky","befriended");
            FX.hist("Told "+n.name+" how you feel. They felt the same.","romance",true);FX.add("happiness",8);FX.tl(G.age,"You and "+fn(n)+" became something more.");
            feed("Some things you only get to say once. You said it, and it was true.","big");}
          else{FX.rel(n,-6);FX.mem(n,"the confession that didn't land","insulted");FX.add("happiness",-5);
            feed(fn(n)+" cares about you, but not that way. You carry it with your head up.","bad");}
          n._confessed=true;},reply:"",d:"everything \u00b7 no going back"},
      {t:"Overthink it and say something else",fx:convFx(n,0,{cowardly:3}),reply:"\"You're weird today,\" they decide, and drop it. The moment closes quietly behind you."},
      {t:"Wait for a better day",fx:function(){FX.tr("calm",3)},reply:"There will be a better day. There had better be."}
    ]}
  ]};
}
function talk_confront(n){
  return {id:"confront",title:"Clearing the Air",cat:"Relationship",loc:placeFor(n),rar:"uncommon",turns:[
    {say:pick(["\"You want to say something. Say it.\"","\"This cold war is stupid. Talk.\"","\"I know you still think about it. So do I.\""]),
     opts:[
      {t:"\"I'm done carrying it. Truce?\"",fx:function(){FX.rel(n,16);FX.mem(n,"the truce nobody else believed in","befriended");FX.hist("Made peace with "+n.name,"friendship",true)},reply:pick(["A slow nod. \"Truce. Don't make me regret the word.\"","\"...Fine. But I'm watching you.\" A beginning, anyway."])},
      {t:"\"We're not friends. We don't have to be enemies either.\"",fx:function(){FX.rel(n,8);FX.tr("calm",4)},reply:"\"Cold, but honest. I can live with honest.\""},
      {t:"Say what they did, exactly",fx:function(){FX.rel(n,4);FX.tr("brave",5)},reply:pick(["They don't apologize. But they don't deny it either, and that's rarer.","\"Okay,\" they say quietly. \"You're right.\""])}
    ]}
  ]};
}
function talk_family(n){
  return {id:"family",title:"Around the Table",cat:"Family",loc:"Home",turns:[
    {say:pick(["\"Sit. Eat. You're all bones and ambition.\"","\"Your mother keeps asking about you. Tell me something good.\"","\"You've been gone too much. The chair misses you.\""]),
     opts:[
      {t:"\"Work's good. I'm getting stronger every month.\"",fx:convFx(n,6,{ambitious:3},3),reply:pick(["\"Good. Just don't get so strong you forget where the rice bowl lives.\"","They glow like they trained you personally."])},
      {t:"Ask about when they were young",fx:convFx(n,7,{intelligent:3},3,"an evening of family stories","befriended"),reply:pick(["The story has three versions and they all contradict. You get the true one last.","\"I was worse than you,\" they admit. \"Worse, and luckier.\""])},
      {t:"\"I'll be honest. It's been heavy lately.\"",fx:convFx(n,9,{compassionate:2},4,"the night you told the truth at dinner","befriended"),reply:"They push the good portion onto your plate without a word. It is the loudest kindness in the world."}
    ]}
  ]};
}
function pickTalk(n){
  var r=n.rel||0,cands=[];
  if(n.kind==="rival"||r<10)cands.push([talk_spar,4]);
  if(r<=-25)cands.push([talk_confront,5]);
  if(r>=15)cands.push([talk_catchup,6]);
  if(r>=25)cands.push([talk_train,5]);
  if(r>=40)cands.push([talk_deep,4]);
  if((G.stats&&G.stats.happiness)<50)cands.push([talk_vent,5]);
  if(r>=45&&LIFE.npcRecall(n))cands.push([talk_memory,4]);
  if(r>=30&&(G.ryo||0)>=50)cands.push([talk_gift,2]);
  if(r>=50&&G.age>=13&&!n.romance&&!n._confessed&&(n.kind==="classmate"||n.kind==="teammate"))cands.push([talk_confess,3]);
  if(n.kind==="parent"||n.kind==="sibling"||n.kind==="guardian"||n.kind==="spouse")cands.push([talk_family,6]);
  if(!cands.length)cands.push([talk_catchup,1]);
  return weighted(cands)(n);
}
function talkWith(n){
  if(!n||!G||!G.alive)return;
  E();
  startConv(n,pickTalk(n));
  FX.add("fatigue",1);
}

/* ============================== new life event templates ============================== */
(function(){
var TT=LIFE.TPL;
/* first words (age 3-5, once) */
TT.push({id:"soc_first_word",cat:"Family",rar:"common",w:4,once:true,gate:function(){return G.age>=3&&G.age<=5&&fam().length},
 build:function(){var n=pick(fam());
  return{t:"First Words",cat:"Family",loc:"Home",art:"🗣️",
   lines:["Something happens this year that the family will retell at every gathering: your first real sentence.",
    "You point at "+n.name.split(" ")[0]+" and manage a whole thought."],
   choices:[
    {t:"\"I see you.\"",res:["Simple, direct, and it lands so hard that "+n.name.split(" ")[0]+" has to leave the room for a moment."],fn:function(){FX.rel(n,10);FX.mem(n,"your first words, aimed at them","befriended");FX.hist("Spoke your first words to "+n.name,"family",true)}},
    {t:"\"More.\"",res:["The house decides this is hilarious. It becomes your name for a year."],fn:function(){FX.add("happiness",3);FX.rel(n,5)}}
   ]}}});
/* the new kid */
TT.push({id:"soc_new_kid",cat:"Academy",rar:"common",w:5,once:true,gate:function(){return G.age>=5&&G.age<=10},
 build:function(){
  return{t:"The New Kid",cat:"Academy",loc:G.villageName+" Academy",art:"🎒",
   lines:["A student nobody knows stands alone in the yard, doing a very bad job of looking comfortable.",
    "Three options present themselves, the way they always do."],
   choices:[
    {t:"Walk over and say hi",res:["Their name is "+pick(["Renji","Suki","Taro","Miharu","Kenzo","Ayame"])+". By lunch they have a spot at your table, and a story about why their family moved that they only half-finish."],
     fn:function(){var k=newNPC({age:G.age,kind:"classmate",village:G.village,rel:ri(35,55)});k.rank=inAcademy()?"Academy Student":k.rank;G.relationships.push(k);
       FX.mem(k,"the day you were the first to walk over","befriended");FX.hist("Befriended the new kid, "+k.name.split(" ")[0],"friendship",false);
       FX.pend("soc_new_friend",G.age+ri(2,4),{id:k.id});FX.add("happiness",3);FX.tr("compassionate",3)}},
    {t:"Watch from a distance",res:["You keep your book open and your eyes up. They notice you noticing. Nothing else happens today."],fn:function(){FX.add("perception",2)}},
    {t:"Ignore them completely",res:["Someone else gets there first. The new kid finds their people, and it wasn't you."],fn:function(){FX.tr("cowardly",3);FX.add("happiness",-1)}}
   ]}}});
/* found item */
TT.push({id:"soc_found_item",cat:"Discovery",rar:"common",w:5,gate:function(){return G.age>=6&&byKindS("classmate").length&&!socAgain("soc_found_item",10)},
 build:function(){var n=pick(byKindS("classmate"));
  return{t:"Not Yours",cat:"Discovery",loc:"The academy yard",art:"💰",
   lines:["A small pouch lies in the grass, dropped and unclaimed. Inside: "+ri(150,400)+" ryō and a charm with "+n.name.split(" ")[0]+"'s name scratched into it.",
    "Nobody saw you pick it up."],
   choices:[
    {t:"Return it",res:["You find "+n.name.split(" ")[0]+" and hand it over whole. The charm's name does the explaining for you."],
     fn:function(){FX.rel(n,14);FX.mem(n,"you returned what everyone else would have kept","saved");FX.rep(3);FX.add("happiness",2)}},
    {t:"Keep the ryō, return the charm",res:["You hand over the charm \"found in the grass.\" The ryō goes in your pocket and stays there for years."],
     fn:function(){FX.ryo(ri(150,400));FX.rep(-2);FX.tr("selfish",5);seed("soc_kept_item",{id:n.id,who:n.name})}},
    {t:"Leave it where it lies",res:["Someone honest finds it, or someone dishonest does. Either way it wasn't yours to steer."],fn:function(){FX.tr("disciplined",3)}}
   ]}}});
/* friend shares a secret */
TT.push({id:"soc_secret_shared",cat:"Friendship",rar:"uncommon",w:4,gate:function(){return G.age>=9&&knownAlive().some(function(n){return (n.rel||0)>=55})},
 build:function(){var n=knownAlive().filter(function(x){return (x.rel||0)>=55})[0];
  return{t:"A Secret Between Two",cat:"Friendship",loc:placeFor(n),art:"🤫",
   lines:[fn(n)+" pulls you somewhere nobody walks and tells you something they've never told anyone.",
    "Their voice never shakes, which is how you know how much it cost."],
   choices:[
    {t:"\"It stays between us.\"",res:["\"I know,\" they say. \"That's why it's yours now.\""],
     fn:function(){FX.rel(n,10);FX.mem(n,"the secret they trusted you with","befriended");seed("soc_secret_keeper",{id:n.id,who:n.name});FX.add("willpower",2)}},
    {t:"Keep it, but let it harden you",res:["You keep the secret and the distance. Some knowledge is a weight you carry alone."],
     fn:function(){FX.rel(n,4);FX.tr("calm",3);FX.tr("cowardly",2)}},
    {t:"Tell one person you trust",res:["\"Just one,\" you promise yourself. Secrets are never satisfied with one."],
     fn:function(){FX.rel(n,-18);FX.mem(n,"the secret that traveled","betrayed");seed("soc_spread",{id:n.id,who:n.name})}}
   ]}}});
/* the promise */
TT.push({id:"soc_promise",cat:"Family",rar:"uncommon",w:3,once:true,gate:function(){return G.age>=8&&(G.household!=="orphan"?fam().length:true)},
 build:function(){var n=(fam()[0]||byKindS("guardian")[0]||byKindS("teacher")[0]);if(!n)return{t:"A Promise Asked",cat:"Family",lines:["Someone asks something of you."],choices:[]};
  return{t:"A Promise Asked",cat:"Family",loc:"Home",art:"🤲",
   lines:[fn(n)+" sits you down with the seriousness of someone rehearsing. There is a thing they need from you, someday, and they need your word now.",
    "\"Whatever you become, "+pick(["don't carry my debts into your own house","look after the ones who stay small","finish what this family started","keep our name honest"])+"\""],
   choices:[
    {t:"Give your word",res:["You promise. "+fn(n)+" nods once, satisfied, and never speaks of it again. You will."],
     fn:function(){FX.rel(n,10);FX.tr("loyal",8);seed("soc_promise",{id:n.id,who:n.name});FX.hist("Gave "+fn(n)+" your word on the thing that matters","family",true);FX.pend("soc_promise_due",G.age+ri(6,12),{id:n.id,who:n.name})}},
    {t:"\"I can't promise that.\"",res:["The silence after is long. \"Honest, at least,\" they finally say. It costs you both something."],
     fn:function(){FX.rel(n,-4);FX.tr("confident",5)}}
   ]}}});
/* festival stranger */
TT.push({id:"soc_festival_stranger",cat:"Rare",rar:"rare",w:2,once:true,gate:function(){return G.age>=10},
 build:function(){
  return{t:"The Lantern Stranger",cat:"Rare",loc:"The lantern festival",art:"🏮",
   lines:["The festival is loud and gold and everyone is somebody's cousin. Except one figure by the last lantern stall, hooded, watching the crowd like weather.",
    "They speak without turning: \"You walk like someone who will matter. I like to meet those early.\""],
   choices:[
    {t:"\"Who are you?\"",res:["A laugh, low and genuinely amused. \"Early. Ask me at the right age.\" They press a lantern charm into your hand and are simply not there anymore."],
     fn:function(){FX.hist("Met a stranger at the festival who said you would matter","rare event",true);seed("soc_stranger_face",{});FX.pend("soc_stranger_return",G.age+ri(5,9),{});FX.tr("intelligent",3)}},
    {t:"\"I don't matter. I'm nobody.\"",res:["\"Every legend says that at your age. It's practically the uniform.\" They leave a charm on the stall anyway."],
     fn:function(){FX.hist("Was told, by a stranger, that legends start as nobodies","rare event",false);FX.pend("soc_stranger_return",G.age+ri(5,9),{})}},
    {t:"Walk away without a word",res:["The night swallows them. You think about it for years."],fn:function(){FX.tr("disciplined",3)}}
   ]}}});
/* dinner row with two voices */
TT.push({id:"soc_dinner_row",cat:"Family",rar:"common",w:4,gate:function(){return G.age>=8&&fam().length>=1},
 build:function(){var n=pick(fam());var o=fam().filter(function(x){return x!==n})[0];
  var lines=[pick(["The dinner starts quiet, which is never a good sign.","The rice is passed in silence, and then someone spoils it."])];
  lines.push({name:fn(n),say:pick(["\"Your grades came up in conversation today. Not kindly.\"","\"The neighbors talk. You know that, right?\"","\"You missed your uncle's naming day. Where were you?\""])});
  if(o)lines.push({name:fn(o),say:pick(["\"Not at the table.\"","\"Let it go. It's dinner.\"","They say nothing, which is its own vote."])});
  return{t:"A Dinner With Edges",cat:"Family",loc:"Home",art:"🍚",lines:lines,
   choices:[
    {t:"Answer honestly, even the hard parts",res:["The truth doesn't end the argument, but it ends the performance. Afterward, "+fn(n)+" leaves extra food by your door without a word."],
     fn:function(){FX.rel(n,7);FX.tr("brave",4);FX.add("happiness",1)}},
    {t:"Apologize and mean it",res:["Whatever it was, it gets forgiven faster than you expected. Families are like that when the apology is real."],
     fn:function(){FX.rel(n,9);FX.tr("compassionate",3)}},
    {t:"Push back, hard",res:["The table detonates. You are right about the facts and wrong about the moment, which you learn later."],
     fn:function(){FX.rel(n,-9);FX.tr("shorttempered",6);FX.tr("confident",3)}},
    {t:"Eat in silence, let it pass",res:["The silence holds until dessert. Victory by endurance."],fn:function(){FX.tr("disciplined",4);FX.add("happiness",-1)}}
   ]}}});
/* kept-item echo: word gets out years later */
TT.push({id:"soc_echo_kept",cat:"Consequence",rar:"uncommon",w:3,gate:function(){return hasSeed("soc_kept_item")&&!hasSeed("soc_kept_paid")},
 build:function(){var d=seedData("soc_kept_item");
  return{t:"What You Kept",cat:"Consequence",loc:"The market",art:"🪙",
   lines:["It surfaces the way old things do: over tea, in passing. \""+((d.who||"Someone").split(" ")[0])+" finally mentioned the year their money went missing.\"",
    "They're not accusing. They're remembering. Somehow that's worse."],
   choices:[
    {t:"Pay it back, with interest",res:["The amount lands in their hands with no explanation needed. Old ledgers close quietly, and something in you stands straighter."],
     fn:function(){FX.ryo(-300);FX.rep(4);FX.add("happiness",3);FX.tr("compassionate",5);seed("soc_kept_paid",{});FX.hist("Repaid the ryō you kept as a child","consequence",true)}},
    {t:"Let it stay buried",res:["You laugh along. The drawer in you stays shut, but you hear it rattle for a while."],
     fn:function(){FX.tr("selfish",4);FX.add("happiness",-2)}}
   ]}}});
/* spread-secret echo: the secret you spread finds its way back */
TT.push({id:"soc_echo_spread",cat:"Consequence",rar:"uncommon",w:3,gate:function(){return hasSeed("soc_spread")&&!hasSeed("soc_spread_paid")},
 build:function(){var d=seedData("soc_spread");
  return{t:"What Travels",cat:"Consequence",loc:placeFor({kind:"classmate"}),art:"💬",
   lines:["They found out. Of course they found out: \""+((d.who||"Someone").split(" ")[0])+" trusted you,\" someone says, not unkindly, which is the worst way to hear it.",
    "You watch them across the yard and they watch you back, and neither of you pretends."],
   choices:[
    {t:"Own it to their face",res:["You say what you did, plainly, with no cushion. It doesn't fix it. It's the only version of sorry that counts."],
     fn:function(){var n=byId(d.id);if(n)FX.rel(n,8);FX.tr("brave",6);seed("soc_spread_paid",{});FX.hist("Owned a betrayal out loud","consequence",true)}},
    {t:"Avoid them forever",res:["You plan your days around their absence. The secret cost more than it ever bought."],
     fn:function(){var n=byId(d.id);if(n)FX.rel(n,-6);FX.add("happiness",-3);seed("soc_spread_paid",{})}}
   ]}}});
/* new-friend echo: the kid you befriended returns the favor years later */
TT.push({id:"soc_echo_friend",cat:"Friendship",rar:"uncommon",w:3,gate:function(){return G.age>=12&&hasSeed("soc_secret_keeper")},
 build:function(){var d=seedData("soc_secret_keeper");
  return{t:"What Loyalty Buys",cat:"Friendship",loc:placeFor({kind:"classmate"}),art:"🤝",
   lines:["You're cornered by "+pick(["three older genin with a point to prove","a bad rumor with legs","a situation that got out of hand fast"])+" — and then "+((d.who||"Someone").split(" ")[0])+" is simply there.",
    "\"They're with me,\" they say, and something about how they say it ends the conversation."],
   choices:[
    {t:"\"You didn't have to do that.\"",res:["\"You kept my secret for me,\" they say. \"This is what that buys.\" Loyalty, it turns out, is a currency."],
     fn:function(){var n=byId(d.id);if(n)FX.rel(n,10);FX.add("happiness",4);FX.hist("Was stood up for by "+((d.who||"someone").split(" ")[0]),"friendship",false)}}
   ]}}});
/* stranger return */
TT.push({id:"soc_echo_stranger",cat:"Rare",rar:"rare",w:3,gate:function(){return hasSeed("soc_stranger_face")&&G.age>=15},
 build:function(){
  return{t:"The Stranger Again",cat:"Rare",loc:"A road at dusk",art:"🌑",
   lines:["Same hooded figure, older roads. \""+pick(["You've been training like someone angry at a wall. Who?","Your name crossed a desk I respect. Congratulations and be careful.","You look like someone who found an answer. Was it worth the question?"])+"\"",
    "They don't threaten. They inform. \"When you're strong enough to be interesting, people stop being kind. Some of them won't knock.\""],
   choices:[
    {t:"\"Then I'll get stronger than interesting.\"",res:["\"Good answer. Wrong tense,\" they say, and vanish into the dusk like they were never standing in it."],
     fn:function(){FX.tr("ambitious",8);FX.hist("Was warned by the hooded stranger that strength draws eyes","rare event",true)}},
    {t:"\"Why keep finding me?\"",res:["\"I knew your family,\" they say simply. \"That's all you get today.\" It is not all you want."],
     fn:function(){FX.tr("intelligent",6);FX.hist("Learned the hooded stranger knew your family","rare event",true)}},
    {t:"Draw a weapon",res:["The figure regards the blade like a child showing a drawing. \"Later,\" they promise, and are gone. You believe them."],
     fn:function(){FX.tr("brave",5);FX.tr("reckless",4);FX.hist("Drew on the hooded stranger and was told 'later'","rare event",false)}}
   ]}}});
/* promise due */
TT.push({id:"soc_echo_promise",cat:"Family",rar:"major",w:3,gate:function(){return hasSeed("soc_promise")},
 build:function(){var d=seedData("soc_promise");
  return{t:"The Promise Comes Due",cat:"Family",loc:"Home",art:"🕯️",
   lines:["The promise you made as a child sits up in its chair and looks at you. "+((d.who||"Someone").split(" ")[0])+"'s words, all those years ago, haven't aged a day.",
    "It's time to decide what your word was worth."],
   choices:[
    {t:"Keep it, whatever it costs",res:["You honor the promise. It costs real things: time, coin, a path not taken. You sleep like a stone afterward, every night after."],
     fn:function(){FX.tr("loyal",10);FX.rep(5);FX.add("happiness",4);FX.hist("Kept the promise made as a child","family",true);FX.mile("promise_kept","Kept your word, years later")}},
    {t:"Explain why you can't",res:["You tell the truth about the promise and the life you actually have. Forgiveness comes, or something like it. The promise is laid down with care rather than broken with silence."],
     fn:function(){FX.tr("confident",5);FX.add("happiness",1);FX.hist("Set down the childhood promise, openly","family",false)}}
   ]}}});
})();  /* end template section */

function byId(id){return (G.relationships||[]).filter(function(n){return n.id===id})[0]}

/* ============================== delayed social consequences ============================== */
function pending(p){
  if(!G||!G.alive)return;
  if(p.k==="soc_new_friend"){var n=byId(p.d.id);if(n&&n.alive&&chance(.6)){FX.rel(n,6);
    LIFE.queue({t:"The Friend Who Stayed",cat:"Friendship",loc:placeFor(n),rar:"uncommon",
      lines:[fn(n)+" shows up at your door with "+pick(["two bowls of something hot","a broken sandal and a story","news they couldn't tell anyone else"])+" and no reason except that they thought of you.",
        "\"We're still doing this, right? Being friends?\""],
      choices:[{t:"\"Obviously.\"",res:["Some friendships are decisions. This one keeps getting made.","You both laugh, and the years keep not mattering."],fn:function(){FX.rel(n,8)}}]})}}
  else if(p.k==="soc_stranger_return"){if(chance(.5))LIFE.queue({t:"A Charm You Kept",cat:"Rare",rar:"rare",
    lines:["Cleaning your things, you find the lantern charm from the festival years ago. It is warm, faintly, for exactly as long as you hold it.",
      "You put it back exactly where it was."],choices:[{t:"Keep it safe",res:["Some gifts you don't question. You just keep them close."],fn:function(){FX.add("willpower",2)}}]})}
  else if(p.k==="soc_promise_due"){/* handled by template gate, nothing needed */}}

/* ============================== stage scenes (bond / feud / becoming) ============================== */
function bondScene(n){
  LIFE.queue({t:"Someone Who Stays",cat:"Friendship",rar:"uncommon",loc:placeFor(n),
    lines:["It's one of those weeks where everything lands wrong, and "+fn(n)+" shows up anyway, "+pick(["with food you didn't ask for","with nothing to say and nowhere else to be","and sits through the whole storm with you"])+"."],
    choices:[
      {t:"Let them all the way in",res:["You tell them the true version, the one you don't say. They don't flinch and they don't fix it. They just stay. Some people are proof the world is worth it."],
       fn:function(){FX.rel(n,6);FX.add("happiness",6);FX.mem(n,"the night you let them all the way in","befriended");FX.hist(fn(n)+" became one of the people who truly know you","friendship",true)}},
      {t:"Keep it light, enjoy the company",res:["You laugh about small things until late. It heals differently, but it heals."],
       fn:function(){FX.rel(n,3);FX.add("happiness",3)}}
    ]});
}
function feudScene(n){
  LIFE.queue({t:"The Feud",cat:"Rivalry",rar:"uncommon",loc:placeFor(n),
    lines:["It's been building for years and everyone can see it. "+fn(n)+" stops you in the street with a look that says today is the day."],
    choices:[
      {t:"\"Last chance. We end this or we end each other.\"",res:["The argument is long, loud, and honest for the first time in years. What's left afterward isn't friendship, but it isn't war either."],
       fn:function(){FX.rel(n,22);FX.mem(n,"the day the feud almost ended","defied");FX.hist("Confronted "+fn(n)+" about the years of bad blood","rivalry",true)}},
      {t:"Say nothing. Walk past.",res:["You keep walking. The feud graduates from noise to institution. Everyone in your year knows which sides to stand on."],
       fn:function(){FX.rel(n,-10);FX.tr("ruthless",4);FX.hist("Let the feud with "+fn(n)+" harden into something permanent","rivalry",false)}}
    ]});
}
function crushScene(n){
  n._socAsked=1;
  LIFE.queue({t:"What This Is Becoming",cat:"Romance",rar:"uncommon",loc:placeFor(n),
    lines:["Lately every conversation with "+fn(n)+" leaves you thinking about it for hours after. They've started noticing the way you notice them."],
    choices:[
      (function(){var ch={t:"Tell them. Tonight.",d:"no going back",fn:function(){var odds=clamp((n.rel||0)+T("confident")/4-15,25,92);if(chance(odds/100)){n.romance=true;FX.rel(n,10);FX.mem(n,"the night it became real","befriended");FX.hist("You and "+fn(n)+" became more than friends","romance",true);FX.add("happiness",8);FX.tl(G.age,"You and "+fn(n)+" became something more.");ch.res=["You say it. The quiet after lasts one heartbeat, and then they say it back. The world reorganizes itself around one true sentence."];}else{FX.rel(n,-5);FX.mem(n,"the night you said it and it didn't land","insulted");FX.add("happiness",-4);ch.res=["You say it. They're kind about it, which hurts worse. \"I don't want to lose what we are,\" they say, and you both pretend that's a comfort."];}}};return ch})(),,
      {t:"Keep it folded up for now",res:["Some feelings you carry like a coin in a pocket. Warm. Unspent."],
       fn:function(){FX.tr("calm",3)}}
    ]});
}

/* ============================== yearly social tick ============================== */
function tick(g){
  if(!g||!g.alive||!g.relationships)return;
  E(g);
  var people=knownAlive();
  /* one stage scene at most per year */
  for(var i=0;i<people.length;i++){
    var n=people[i],r=n.rel||0;
    if(r>=85&&!n._socBond){n._socBond=1;bondScene(n);break}
    if(r<=-60&&!n._socFeud){n._socFeud=1;feudScene(n);break}
  }
  /* feelings that grow on their own */
  if(G.age>=13&&chance(.18)){
    var cands=people.filter(function(n){return (n.rel||0)>=70&&!n.romance&&!n._socAsked&&!n._confessed&&(n.kind==="classmate"||n.kind==="teammate")});
    if(cands.length&&chance(.5))crushScene(pick(cands));
  }
  /* an ordinary encounter with someone who knows you */
  if(chance(.2)){
    var familiar=people.filter(function(n){return (n.rel||0)>-60&&!socAgain("p:"+n.id,10)});
    if(familiar.length){var who=pick(familiar);socLog("p:"+who.id);
      var script=pickTalk(who);script.auto=true;startConv(who,script,true)}
  }
}

/* ============================== the people view ============================== */
var KIND_ICON={rival:"\u2694\ufe0f",spouse:"\ud83d\udc8d",teacher:"\ud83c\udf93",classmate:"\ud83d\udcdA",
  sibling:"\ud83d\udc6b",parent:"\ud83c\udfe0",guardian:"\ud83c\udfe0",sensei:"\ud83e\udd77",child:"\ud83e\udd8b",teammate:"\ud83e\udd4a"};
function renderPeople(){
  var w=el("div");
  if(!G||!G.relationships){var p0=el("div","panel");p0.appendChild(el("div","tag","the people in this life"));p0.appendChild(el("div","ftxt","No one knows you yet. That changes."));w.appendChild(p0);var h=$("vpane");if(h){h.innerHTML="";h.appendChild(w)}return}
  E();
  var idn=identity(G);
  var head=el("div","panel");
  head.appendChild(el("div","tag","the people in this life"));
  head.appendChild(el("h3","serif",idn.n));
  head.appendChild(el("div","dbio",idn.line));
  var traits=Object.keys(G.traits||{}).sort(function(a,b){return (G.traits[b]||0)-(G.traits[a]||0)}).slice(0,4).map(traitLabel).join(" \u00b7 ");
  if(traits)head.appendChild(el("div","dbio","Read as: "+traits));
  w.appendChild(head);
  var alive=knownAlive().slice().sort(function(a,b){return (b.rel||0)-(a.rel||0)});
  if(!alive.length){var pe=el("div","panel");pe.appendChild(el("div","ftxt","No one knows you yet. That changes."));w.appendChild(pe)}
  var grid=el("div","pgrid");
  alive.forEach(function(n){
    E();if(LIFE.ensureNPC)LIFE.ensureNPC(n);
    var c=el("div","pcard");
    var top=el("div","pc-top");
    top.appendChild(el("span","pc-ico",KIND_ICON[n.kind]||"\ud83e\udd1d"));
    var nm=el("div","pc-nm");nm.appendChild(el("b",null,n.name));
    nm.appendChild(el("span","pc-kind",(n.kind||"someone")+" \u00b7 age "+(n.age!=null?n.age:"?")));
    top.appendChild(nm);c.appendChild(top);
    var lab=el("div","pc-stage",stageOf(n));
    if((n.rel||0)>=60)lab.className+=" good";else if((n.rel||0)<=-25)lab.className+=" bad";
    c.appendChild(lab);
    var bar=el("div","bondbar");var fill=el("div","bondfill");
    fill.style.width=(((n.rel||0)+100)/2)+"%";bar.appendChild(fill);c.appendChild(bar);
    var last=n.mems&&n.mems.length?n.mems[n.mems.length-1]:null;
    c.appendChild(el("div","pc-mem",last?("Age "+last.age+" \u2014 "+last.what):"No history between you yet"));
    var acts=el("div","pc-acts");
    var b1=el("button","socbtn","Spend time");b1.onclick=function(){talkWith(n)};
    acts.appendChild(b1);
    if(n.kind==="rival"||(n.rel||0)<10){var b2=el("button","socbtn","Face them");b2.onclick=function(){startConv(n,talk_spar(n))};acts.appendChild(b2)}
    if((n.rel||0)<=-25&&n.rel!=null){var b3=el("button","socbtn","Clear the air");b3.onclick=function(){startConv(n,talk_confront(n))};acts.appendChild(b3)}
    if((n.rel||0)>=50&&G.age>=13&&!n.romance&&!n._confessed&&(n.kind==="classmate"||n.kind==="teammate")){var b4=el("button","socbtn warm","Tell them how you feel");b4.onclick=function(){startConv(n,talk_confess(n))};acts.appendChild(b4)}
    c.appendChild(acts);
    grid.appendChild(c);
  });
  w.appendChild(grid);
  var hint=el("div","panel");hint.appendChild(el("div","ftxt","Conversations cost a little energy and change how people see you. What you say out here comes back later, one way or another."));
  w.appendChild(hint);
  var h2=$("vpane");if(h2){h2.innerHTML="";h2.appendChild(w)}
}

/* ============================== record identity panel ============================== */
function appendIdentity(){
  var holder=$("vpane");if(!holder)return;
  var idn=identity(G);if(!idn||idn.n==="Unwritten")return;
  var p=el("div","panel");p.appendChild(el("div","tag","who you are becoming"));
  p.appendChild(el("h3","serif",idn.n));
  p.appendChild(el("div","dbio",idn.line));
  holder.insertBefore(p,holder.firstChild);
}

/* ============================== init ============================== */
function init(){
  try{
    var css=document.createElement("style");css.id="soc-css";
    css.textContent=".pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}"+
      ".pcard{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);border-radius:14px;padding:13px;display:flex;flex-direction:column;gap:8px}"+
      ".pc-top{display:flex;gap:10px;align-items:center}.pc-ico{font-size:20px}"+
      ".pc-nm{display:flex;flex-direction:column;line-height:1.25}.pc-kind{font-size:11px;opacity:.65}"+
      ".pc-stage{font-size:11.5px;font-weight:700;letter-spacing:.04em}"+
      ".pc-stage.good{color:#7fc58a}.pc-stage.bad{color:#e08a95}"+
      ".bondbar{height:6px;border-radius:3px;background:rgba(255,255,255,.09);overflow:hidden}"+
      ".bondfill{height:100%;background:linear-gradient(90deg,#a83d51,#d3a94c);border-radius:3px}"+
      ".pc-mem{font-size:12px;opacity:.75;line-height:1.35;min-height:16px}"+
      ".pc-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}"+
      ".socbtn{border:1px solid rgba(255,255,255,.18);background:transparent;color:var(--text,#ddd);border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer}"+
      ".socbtn:hover{border-color:#d3a94c;color:#d3a94c}.socbtn.warm{border-color:#b3455a;color:#e08a95}";
    document.head.appendChild(css);
    if(typeof NAV!=="undefined"&&typeof NAV.splice==="function"&&!NAV.some(function(x){return x[0]==="people"}))NAV.splice(NAV.length-1,0,["people","People","\ud83d\udc65"]);
    if(typeof renderView==="function"){
      var _rv=renderView;
      window.renderView=function(){
        if(typeof VIEW!=="undefined"&&VIEW==="people"){renderPeople();return}
        if(typeof VIEW!=="undefined"&&VIEW==="story"){LIFE.renderStory();try{appendIdentity()}catch(e){}return}
        _rv();
      };
    }
  }catch(e){}
}
return {tick:tick,pending:pending,talkWith:talkWith,startConv:startConv,seed:seed,hasSeed:hasSeed,
  stageOf:stageOf,identity:identity,renderPeople:renderPeople,init:init};
})();
SOCIAL.init();
