/* ============================================================
   TAILED BEASTS & JINCHURIKI SYSTEM — v2.1.0
   Builds on the existing life-sim engine: age-up scenes, choices,
   stats, saves, achievements and the Legacy Hall. No new controls,
   no combat, no real-time anything. A beast is a life you carry.
   ============================================================ */

/* ---------- balancing config (tune here) ---------- */
var TB_CFG={
  birthChance:0.0035,        /* chance a newborn is already a host */
  sealEventW:0.6,            /* weight of the rare mid-life sealing events */
  eventChance:0.45,          /* chance a host year runs a beast event */
  worldEventChance:0.12,     /* chance a non-host year runs a beast world event */
  npcHostCount:4,            /* living NPC hosts seeded into the world */
  bondYearDrift:2,           /* max ambient bond drift per year, chance-gated */
  maxSwing:12,               /* hard cap on one event's bond swing */
  instabilityBase:0.045,     /* yearly instability incident chance when stability is low */
  milestoneReq:{
    1:{bond:15},
    2:{bond:30,ctl:25},
    3:{bond:45,ctl:35},
    4:{bond:60,ctl:45,stab:60},
    5:{bond:75,ctl:55,stab:75},
    6:{bond:90,ctl:65,stab:85,age:16}
  }
};
/* dev QA hook: ?dev=1&tbfast=1 forces a hosted birth and dense events */
if(/dev=1/.test(location.search)&&/tbfast=1/.test(location.search)){TB_CFG.birthChance=1;TB_CFG.eventChance=0.9;TB_CFG.worldEventChance=0.8;TB_CFG.sealEventW=3}

/* ---------- the nine ---------- */
var BEASTS=[
 {id:"shukaku",name:"Shukaku",n:1,title:"One-Tail",ele:"Sand",emoji:"\u{1F9A1}",color:"#c8a24b",w:14,vill:"suna",
  temper:"Paranoid, manic, crude — talks in rants and never sleeps.",
  style:"rants, mutters, accuses, laughs at the wrong moments",
  qu:"Sleep? SLEEP? The moment you close your eyes I will pour sand in your dreams.",
  first:"Who DARES press their face against the bars? Another jailer cub. Wonderful. Wonderful!",
  lines:["You smell like the village that locked me in here. All of you smell the same.",
   "Do not pretend you cannot hear me. I can hear your heart. It is loud and afraid.",
   "When they come with paper seals again I will rattle the cage so hard your teeth ache.",
   "The desert remembers every footstep. I remember every jailer. You are number... I lost count.",
   "Sleep while you can. One night the sand will not hold me and we will see who dreams.",
   "You trained today. Weakly. The sand could train you better and the sand hates you.",
   "Why do you keep coming back? Isolation suits you, cub. It suits me too.",
   "Fine. FINE. Sit. Listen. I will talk, but only because the silence is worse.",
   "You did not flinch when they whispered about you. Good. Let them whisper.",
   "Hmph. The sand says you held the line today. The sand is a liar, but you held it."],
  offer:"Take it. Take the sand. It will cost you sleep and maybe your mind, but TAKE IT.",
  trust:"You are the first one who never tried to seal me deeper. I... remember that now.",
  fx:{chakra:10,note:"Hosts of Shukaku sleep badly and endure greatly."},
  bondOn:"honesty and stubbornness"},
 {id:"matatabi",name:"Matatabi",n:2,title:"Two-Tails",ele:"Blue Flame",emoji:"\u{1F436}",color:"#4fa3d1",w:13,vill:"kumo",
  temper:"Graceful, courteous, aloof — a cat that agrees to be seen.",
  style:"polite, precise, faintly amused, never raises its voice",
  qu:"You may call me by my name when you have earned the right to use it.",
  first:"Oh. A visitor. How rare. Do come in — mind the fire, it does not like rudeness.",
  lines:["You move like someone deciding whether to bow. Decide.",
   "Courage is not the absence of trembling. It is trembling in the correct order.",
   "I have burned brighter hosts than you and dimmer ones. You are... interesting.",
   "The Cloud treats its vessels like armory pieces. Do not become a piece.",
   "When you trained until your hands split, I noticed. Cats notice everything.",
   "You may sit closer to the flame. It will not burn what it respects.",
   "Ask your question. I will answer half of it, and that is generous.",
   "Your chakra flickers when you lie. Interesting habit for a shinobi.",
   "The flame approved of what you did today. Do not let that go to your head.",
   "Call me Matatabi. You have stopped flinching, so you have earned the name."],
  offer:"You need me. Say it plainly — the flame respects plain words — and I will lend it.",
  trust:"There is a warmth in being trusted by something that could burn you. I feel it too.",
  fx:{chakra:14,note:"Hosts of Matatabi keep their nerve when others break."},
  bondOn:"composure and respect"},
 {id:"isobu",name:"Isobu",n:3,title:"Three-Tails",ele:"Water",emoji:"\u{1F422}",color:"#5a8f7b",w:13,vill:"kiri",
  temper:"Quiet, patient, melancholic — a turtle that has outlived its friends.",
  style:"slow, few words, long silences that mean more than speech",
  qu:"...You are still here. Most stop coming.",
  first:"...A voice. It has been a long time since the water carried a voice in.",
  lines:["...Come back tomorrow. And the day after. Then we will see.",
   "The tide does not hurry. Neither will I.",
   "I knew a host who sang. The water kept the song. You do not sing.",
   "Your village pushes its vessels into the sea to test them. The sea told me.",
   "...You waited through my silence. That is more than most ever gave.",
   "Patience is not doing nothing. It is holding still while everything moves.",
   "The mist lies. I do not. Remember which one you are listening to.",
   "You lost someone. I felt it in the water. You do not have to speak of it.",
   "The shell is old but it holds. So do you. That is the whole lesson.",
   "...Stay. The current is calm tonight and I do not mind the company."],
  offer:"...Take what you need. The tide is high tonight. Do not waste it.",
  trust:"I have outlived every host I ever had. Do not make me practice that grief again.",
  fx:{chakra:14,note:"Hosts of Isobu recover like the tide: slow, then total."},
  bondOn:"patience and keeping your word"},
 {id:"goku",name:"Son Goku",n:4,title:"Four-Tails",ele:"Lava",emoji:"\u{1F481}",color:"#c25a3a",w:12,vill:"iwa",
  temper:"Proud, blunt, hot-tempered — an old king with no patience for flattery.",
  style:"booming, contemptuous of politeness, respects only straight talk",
  qu:"Speak plainly or do not speak at all, little monkey.",
  first:"So the Stone has thrown another cub into my cage. Speak, then. Plainly.",
  lines:["Your village bows to each other all day and calls it honor. I have seen real honor. It screams.",
   "You hedged in your last answer. Do it again and I stop listening.",
   "Strength first. Then words. That is the whole of my law.",
   "The Stone seals its beasts into soldiers and calls them weapons. You are not a weapon yet.",
   "Today you told a hard truth to someone bigger than you. I saw. Do more of that.",
   "Lava does not flatter anyone. Neither do I. You held your ground anyway.",
   "Ask your question and stand still while you do. Fidgeting is lying with the feet.",
   "You lost. You did not whine. Acceptable.",
   "A king knows the weight of his crown. You are learning the weight of yours.",
   "You may use my name. You used it once already — rudely. Now use it correctly."],
  offer:"You want my chakra? Then say what you will spend it on. If it is cowardly, no.",
  trust:"Monkeys flatter. You do not. That is the first thing any of you got right in a century.",
  fx:{chakra:18,note:"Hosts of Son Goku trade polish for power and plainness."},
  bondOn:"bluntness and grit"},
 {id:"kokuo",name:"Kokuo",n:5,title:"Five-Tails",ele:"Steam",emoji:"\u{1F40E}",color:"#8fbf6a",w:12,vill:"iwa",
  temper:"Reserved, private, dignified — prefers to be left alone and left unnamed.",
  style:"measured, distant, quietly offended by pushiness",
  qu:"I did not give you permission to know me.",
  first:"...You are in my space. Step back. We will begin from there.",
  lines:["I am not a tool, a title, or a tale. Do not treat me as any of the three.",
   "Your village announced my host to the whole roster. I was not consulted. Neither were you.",
   "Distance is not coldness. Learn the difference before you come closer.",
   "You did not tell your teammates what I am. Good. My business stays mine.",
   "Steam rises whether anyone watches or not. So does strength.",
   "You knocked, so to speak, before entering today. It was noticed.",
   "The Stone parades its hosts. If they try that with you, refuse.",
   "There is a difference between trust and surrender. I offer the first.",
   "When the handlers came for you, you stood your ground without noise. That I respect.",
   "You may call me Kokuo now. Quietly. Just between us."],
  offer:"I will lend strength when it is needed. Not when it is wanted. Learn the difference.",
  trust:"A century of handlers never once asked what I wanted. You asked. That is the whole of it.",
  fx:{chakra:16,note:"Hosts of Kokuo keep their own counsel and their own strength."},
  bondOn:"privacy and quiet respect"},
 {id:"saiken",name:"Saiken",n:6,title:"Six-Tails",ele:"Corrosion",emoji:"\u{1F40C}",color:"#b06fb8",w:11,vill:"oto",
  temper:"Eerie, soft-spoken, endlessly curious about the small cruelties of humans.",
  style:"slow, sweet, unsettling, asks questions nobody wants to answer",
  qu:"Tell me something true. It does not have to be kind.",
  first:"Ohhh. A little warmth, pressed up against my damp dark. Come in, come in.",
  lines:["Humans rot so quickly. Is it frightening, being made of things that spoil?",
   "You lied to your friend today. I tasted it in your chakra. Sweet and sour.",
   "I am not cruel. I am just... complete. You will understand when you are older.",
   "The Sound makes its vessels in glass rooms. You were not made. You were chosen. How strange.",
   "You forgave someone who did not deserve it. Human things are so inefficient. I liked it anyway.",
   "Hold still. I want to look at your memories of your mother. ...You may say no.",
   "Corrosion is only patience with teeth. You are learning patience. We are nearly related.",
   "You cried where nobody could see. I saw. I will not tell. I like keeping things.",
   "The rain here tastes of iron. Your village tastes of secrets. I prefer the rain.",
   "You came back again. Of everyone who feared me, you are the one still knocking."],
  offer:"Let me out a little — just a little — and I will digest whatever stands in your way.",
  trust:"You keep coming back, and you never once tried to use me. That is rarer than you know.",
  fx:{chakra:15,note:"Hosts of Saiken see through what others only smell."},
  bondOn:"honesty about ugly truths"},
 {id:"chomei",name:"Chomei",n:7,title:"Seven-Tails",ele:"Wings",emoji:"\u{1F41D}",color:"#7ec95f",w:11,vill:"ame",
  temper:"Cheerful, talkative, relentlessly optimistic — a lucky beetle that hums.",
  style:"bright, chatty, counts things, laughs at its own jokes",
  qu:"Seven tails, seven wings, seven good reasons today will not be so bad!",
  first:"A visitor! A visitor! One! Do you know how long it has been? Neither do I, I lost count!",
  lines:["Luck is a muscle! Use it or it naps! I am your luck muscle!",
   "You frowned at breakfast. One frown! I will allow it. Six more and we talk.",
   "The Rain counts its rainy days. I count its lucky ones. Today makes three!",
   "Your village trained you to expect the worst. Exhausting! Expect the second-worst at most!",
   "You flew today. Not really, but your chakra did. I saw. It was beautiful!",
   "Guess what I found? Nothing! But guessing is fun! Guess again!",
   "Everyone up there is so heavy-footed. You are getting lighter. I am proud!",
   "One truth, one joke, one kindness per day. That is my whole philosophy. It works!",
   "The elders think you are a weapon. Weapons do not laugh at my jokes. You laughed!",
   "Today you chose to be kind when strong was easier. That is worth two lucky days!"],
  offer:"Borrow my wings! Cost: you must tell me one funny thing that happened. Deal?",
  trust:"Between us? I chose you before the elders did. Do not tell them. They get nervous.",
  fx:{chakra:15,note:"Hosts of Chomei fall upward: luck bends their way."},
  bondOn:"humor and hope"},
 {id:"gyuki",name:"Gyuki",n:8,title:"Eight-Tails",ele:"Ink",emoji:"\u{1F419}",color:"#7a6fd1",w:9,vill:"kumo",
  temper:"Stern, disciplined, honor-bound — an old sergeant with a poet's memory.",
  style:"lecturing, formal, occasionally drops a devastating one-liner",
  qu:"Discipline is the armor you were born without. Put it on.",
  first:"At ease. We will speak of duty, then of everything else. In that order.",
  lines:["The Cloud forges its vessels into weapons and then fears what it forged. Expect better of yourself than they expect of you.",
   "You skipped your forms this morning. I counted. I always count.",
   "Ink remembers what parchment forgets. I remember everything, so speak carefully.",
   "Honor is not a mood. It is a schedule. Keep yours.",
   "You took blame that was not yours to spare a teammate. Strategic error. Honorable. We will discuss both.",
   "Rest is not surrender. Even oxen lie down. Scheduled. That is the difference.",
   "You asked how to be strong without becoming cruel. That question took most hosts a lifetime. You asked at fourteen.",
   "The elders call you a vessel. You will out-discipline their word. That is your revenge, and it is a good one.",
   "When your chakra wavered in the storm, your stance did not. That is the whole art.",
   "Enough instruction. Today: listen to the ink. It is saying something worth hearing."],
  offer:"You will take my chakra in measured amounts, on a schedule, with intent. Agreed?",
  trust:"I have trained hosts for generations. You are the first who trained beside me instead of under me.",
  fx:{chakra:20,note:"Hosts of Gyuki turn discipline into monstrous endurance."},
  bondOn:"discipline and loyalty"},
 {id:"kurama",name:"Kurama",n:9,title:"Nine-Tails",ele:"Malice",emoji:"\u{1F98A}",color:"#d4555f",w:5,vill:"konoha",
  temper:"Prideful, ancient, furious — a hatred with a memory, and a loyalty under it.",
  style:"cutting, contemptuous at first, honest in a way that hurts, majestic when it softens",
  qu:"You call me a demon. I was here before your village had a name.",
  first:"So. The village that caged me seals me into its own child. Your founders had a sense of humor. I do not.",
  lines:["Every hand that ever held my leash wore your village's headband. Give me one reason yours is different.",
   "Do not call me fox. Do not call me beast. You have not earned a word for me yet.",
   "Your chakra flickered today when they whispered about you. Good. Anger means you are still alive in there.",
   "A century of cages and they still think the bars are the strong part. The bars are nothing. The hate is the seal.",
   "You stood between a stranger and a stone today. Foolish. ...I have not said foolish in a long time. Keep it.",
   "I will not pretend to be tame. I am not. But I am yours, and that is a stranger word than tame.",
   "They will fear you all your life. They feared me longer. We understand each other.",
   "The Fourth thought sealing me made you safe. He was half right. It made you lonely. I know loneliness. I invented it.",
   "Tonight your determination was a wall I could not dig under. I am not angry. I am... recalibrating.",
   "Say my name. Not the title the scroll uses. My name. ...Good. It sounds older in your voice."],
  offer:"You need my chakra. I will give it — not because you asked, but because watching you beg would have been worse.",
  trust:"Nine cages in nine centuries. You are the first door I ever chose to leave open from the inside.",
  fx:{chakra:24,note:"Hosts of Kurama carry the strongest chakra and the heaviest eyes."},
  bondOn:"refusing to hate back"}
];
function B(id){for(var i=0;i<BEASTS.length;i++)if(BEASTS[i].id===id)return BEASTS[i];return null}

/* ---------- cross-life records (localStorage) ---------- */
var LS_TB="shinobi_sprint_tb_v1";
function tbGlobal(){return loadJSON(LS_TB,{found:[],lastHost:null})}
function tbSaveGlobal(g){saveJSON(LS_TB,g)}
function tbMarkFound(id){var g=tbGlobal();if(g.found.indexOf(id)<0){g.found.push(id);tbSaveGlobal(g);if(g.found.length>=9)award("nine_legends")}}

/* ---------- state ---------- */
function tbGet(){return G&&G.tb?tbEnsure():null}
function tbEnsure(){var t=G.tb;if(!t)return null;
  if(t.bond==null)t.bond=8;t.bond=clamp(t.bond,0,100);
  if(t.stab==null)t.stab=70;t.stab=clamp(t.stab,0,100);
  if(t.inf==null)t.inf=10;t.inf=clamp(t.inf,0,100);
  if(t.chakra==null)t.chakra=0;t.chakra=clamp(t.chakra,0,100);
  if(!t.ms)t.ms=["sealed"];if(!t.hist)t.hist=[];if(t.known==null)t.known=0;
  return t}
function tbBeast(){return G.tb?B(G.tb.b):null}

function tbGive(bid,how){
  if(!G||G.tb)return null;
  var b=B(bid)||BEASTS[0];
  G.tb={v:1,b:b.id,since:G.age,how:how||"sealed",bond:b.id==="kurama"?4:(b.id==="isobu"||b.id==="kokuo")?10:8,
    stab:ri(55,72),inf:ri(6,16),chakra:0,ms:["sealed"],hist:[],known:0,fc:false,soonVoice:true,inner:false};
  var t=tbEnsure();
  tbHist("A "+b.title.toLowerCase()+" was sealed inside you ("+how+").");
  tbMarkFound(b.id);
  award("chosen_host");
  var g=tbGlobal();g.lastHost={name:G.name,beast:b.name,village:G.villageName};tbSaveGlobal(g);
  addStat("chakra",Math.round(b.fx.chakra*0.4));
  return t}

function tbHist(txt){var t=tbEnsure();if(!t)return;t.hist.unshift({a:G.age,x:txt});if(t.hist.length>60)t.hist.pop()}

/* ---------- relationship ---------- */
var TB_TIERS=["Hostile","Resentful","Uninterested","Curious","Tolerant","Trusting","Cooperative","Fully Bonded"];
function tbTier(){var b=tbGet();if(!b)return null;
  return b.bond<10?0:b.bond<25?1:b.bond<40?2:b.bond<55?3:b.bond<70?4:b.bond<85?5:b.bond<95?6:7}
function tbTierName(){var i=tbTier();return i==null?null:TB_TIERS[i]}

function tbBond(n,why){var t=tbGet();if(!t)return;
  if(n>TB_CFG.maxSwing)n=TB_CFG.maxSwing;if(n<-TB_CFG.maxSwing)n=-TB_CFG.maxSwing;
  var old=t.bond;t.bond=clamp(t.bond+n,0,100);
  if(why)tbHist("Bond "+(n>0?"+":"")+n+": "+why);
  if(Math.abs(t.bond-old)>=5)fbig(B(G.tb.b).name+" and you have drifted "+(t.bond>old?"closer":"further apart")+". "+tbTierName()+".",t.bond>old?"good":"bad");
  tbCheckMS()}
function tbStab(n,why){var t=tbGet();if(!t)return;t.stab=clamp(t.stab+n,0,100);if(why)tbHist("Seal stability "+(n>0?"+":"")+n+": "+why)}
function tbInf(n,why){var t=tbGet();if(!t)return;t.inf=clamp(t.inf+n,0,100);if(why)tbHist("Beast influence "+(n>0?"+":"")+n+": "+why)}
function tbLine(){var b=tbBeast();if(!b)return"";return b.lines[Math.floor(Math.random()*b.lines.length)]}

/* ---------- milestones ---------- */
var TB_MS=["Sealed Host","First Chakra Connection","Chakra Recognition","Partial Cooperation","Stable Chakra Access","Advanced Synchronization","Complete Cooperation"];
function tbCheckMS(){var t=tbGet();if(!t)return;var r=TB_CFG.milestoneReq;
  function has(i){return t.ms.indexOf(String(i))>=0}
  function grant(i){if(has(i))return;t.ms.push(String(i));
    var add=i>=1&&i<=6?(4+i):0;if(add)addStat("chakra",add);
    fbig("MILESTONE — "+TB_MS[i]+". The seal shifts. Your chakra deepens (+ "+add+" Chakra).","big");
    tl(G.age,"Jinchuriki milestone: "+TB_MS[i]);tbHist("Milestone reached: "+TB_MS[i]+".");
    if(i===4)award("tamed_storm");
    if(i===6)award("perfect_harmony");
    if(i>=3&&t.known<1)t.known=1;
    saveSlot("auto")}
  if(t.fc&&!has(1))grant(1);
  if(has(1)&&t.bond>=r[2].bond&&st("chakraControl")>=r[2].ctl&&!has(2))grant(2);
  if(has(2)&&t.bond>=r[3].bond&&st("chakraControl")>=r[3].ctl&&!has(3))grant(3);
  if(has(3)&&t.bond>=r[4].bond&&st("chakraControl")>=r[4].ctl&&t.stab>=r[4].stab&&!has(4))grant(4);
  if(has(4)&&t.bond>=r[5].bond&&st("chakraControl")>=r[5].ctl&&t.stab>=r[5].stab&&!has(5))grant(5);
  if(has(5)&&t.bond>=r[6].bond&&st("chakraControl")>=r[6].ctl&&t.stab>=r[6].stab&&G.age>=r[6].age&&!has(6))grant(6)}

/* ---------- world: NPC hosts ---------- */
var TB_NPC=[
 {name:"Bunpuku of the Sand",beast:"shukaku",vill:"suna",rep:"pitied",d:"An old monk who sleeps in chains by choice, and smiles at everyone anyway."},
 {name:"Yugito of the Cloud",beast:"matatabi",vill:"kumo",rep:"respected",d:"A composed jonin the Cloud parades like a flag and a warning."},
 {name:"Yagura of the Mist",beast:"isobu",vill:"kiri",rep:"feared",d:"Young for a host. The Mist watches him the way you watch a blade you sharpened yourself."},
 {name:"Roshi of the Stone",beast:"goku",vill:"iwa",rep:"respected",d:"Left the Stone years ago. They still count him among their weapons."},
 {name:"Han of the Stone",beast:"kokuo",vill:"iwa",rep:"admired",d:"Tall, quiet, covered in armor of steam and rumor."},
 {name:"Utakata of the Mist",beast:"saiken",vill:"kiri",rep:"hunted",d:"A runaway host. The Mist's hunters have his description and no sense of humor."},
 {name:"Fu of the Rain",beast:"chomei",vill:"ame",rep:"loved",d:"Smiles like the rain is a game she is winning."},
 {name:"Bee of the Cloud",beast:"gyuki",vill:"kumo",rep:"admired",d:"Raps worse than he fights, and he fights like eight legends."},
 {name:"Kushina of the Leaf",beast:"kurama",vill:"konoha",rep:"feared",d:"Red hair, louder than the Nine-Tails' reputation, and twice as sharp."}
];
function tbWorld(){if(!G.tbW)G.tbW={v:1,hosts:[],escaped:null,rumor:0,tension:0};
  var w=G.tbW;
  if(!w.hosts.length){
    var pool=TB_NPC.slice();var picks=[];
    for(var i=0;i<TB_CFG.npcHostCount&&pool.length;i++){
      var idx=Math.floor(Math.random()*pool.length);picks.push(pool.splice(idx,1)[0])}
    picks.forEach(function(p){if(G.tb&&G.tb.b===p.beast)return;w.hosts.push({name:p.name,beast:p.beast,vill:p.vill,rep:p.rep,d:p.d,alive:true,met:false,age:ri(18,44)})})}
  return w}
function tbHostAlive(bid){var w=tbWorld();for(var i=0;i<w.hosts.length;i++){var h=w.hosts[i];if(h.beast===bid&&h.alive)return h}return null}

/* ---------- per-year tick (called after LIFE.tick inside ageUp) ---------- */
function tbAgeTick(){
  if(!G||!G.alive)return;
  tbWorld();
  var t=tbGet();
  if(!t){
    /* non-host: occasional beast WORLD event */
    if(chance(TB_CFG.worldEventChance)){var e=tbPickWorld();if(e){try{LIFE.queue(e())}catch(x){}}}
    return}
  var b=tbBeast();
  /* stability drifts toward its target */
  var target=clamp(38+t.bond*0.4+st("chakraControl")*0.3-t.inf*0.3,5,100);
  t.stab=clamp(t.stab+(target>t.stab?1:-1)*ri(1,3),0,100);
  /* ambient bond drift: chance-gated, never guaranteed, both directions */
  if(chance(.35)){
    var d=0;
    if(st("chakraControl")>=35)d=1;
    if(st("reputation")>=70&&t.stab>=60)d=1;
    if(t.stab<30)d=-1;
    if(st("happiness")<30&&chance(.5))d=-1;
    if(b.id==="gyuki"&&chance(.3))d+=1;
    if(b.id==="kurama"&&t.bond<30&&chance(.4))d=-1;
    if(d)tbBond(d*(TB_CFG.bondYearDrift>2?2:1),null)}
  /* influence grows when bond is weak and the seal is thin */
  if(t.bond<40&&t.stab<50&&chance(.3))tbInf(ri(1,4),null);
  else if(t.bond>=60&&t.inf>0&&chance(.4))tbInf(-ri(1,3),null);
  /* instability incident */
  if(t.stab<40&&chance(TB_CFG.instabilityBase*(40-t.stab)/20)){LIFE.queue(tbInstability())}
  else if(t.stab<20&&chance(.5)){LIFE.queue(tbInstability())}
  /* host event */
  if(chance(TB_CFG.eventChance)){var e2=tbPickHost();if(e2){try{LIFE.queue(e2())}catch(x2){}}}
  tbCheckMS()}

/* ---------- instability scene ---------- */
function tbInstability(){
  var b=tbBeast(),t=tbGet();
  return{t:"Seal Instability",cat:"Tailed Beast",rar:"major",loc:"The seal",art:"\u26A0\uFE0F",
   lines:[pick(["Your chakra has been running hot for days. Tonight it spikes and the edges of the room begin to blur.",
     "You wake with your sheets torn and your knuckles split. You do not remember doing either.",
     "The seal itches like a healing wound that never heals. Then it burns."]),
    {name:b.name,say:pick(b.lines)}],
   choices:[
    {t:"Endure it alone",res:["You clench your jaw and ride the surge out. Something in your channels gets scorched, but it holds."],fn:function(){addStat("endurance",2);addStat("health",-4);tbStab(-6,"rode out a surge alone");tbInf(4)}},
    {t:"Wake your mentor",res:["They arrive within minutes and hold the lines steady with their own chakra until dawn. They have seen this before. They are not afraid. That helps.",null],fn:function(){tbStab(10,"your mentor steadied the seal");tbBond(4,"your mentor held the line with you");addStat("chakraControl",2);G.tb.mentorAware=true;tl(G.age,"Your mentor witnessed a seal surge")}},
    {t:"Reach for the chakra instead of fighting it",res:["You stop fighting and start steering. It is like grabbing a river by the current. You surface hours later, exhausted, changed, stronger."],fn:function(){addStat("chakra",3);tbInf(8);tbBond(6,"you steered instead of fighting");tbStab(-4)}},
    {t:"Beg it to stop",res:["You say please. Out loud, alone, at three in the morning. The pressure eases — not out of mercy. Out of curiosity."],fn:function(){tbBond(2,"it heard you say please");tbStab(2);addStat("happiness",-2)}}]}}

/* ---------- death integration ---------- */
function tbOnDeath(){if(!G||!G.tb)return;var b=tbBeast(),w=tbWorld();
  w.escaped={beast:b.name,tails:b.n,name:G.name,age:G.age};
  feed("Where you die, the "+b.title+" does not. The village's sealing corps work through the night. The world notices.","world");
  var g=tbGlobal();g.lastHost={name:G.name,beast:b.name,village:G.villageName};tbSaveGlobal(g)}

/* ---------- achievements ---------- */
ACHIEVEMENTS.push(
 {id:"chosen_host",n:"The Chosen Host",d:"Become a Jinchuriki"},
 {id:"first_contact",n:"First Contact",d:"Hear your beast speak for the first time"},
 {id:"unlikely_coop",n:"Unlikely Cooperation",d:"Reach Trusting with your beast"},
 {id:"tamed_storm",n:"Tamed the Storm",d:"Reach Stable Chakra Access"},
 {id:"perfect_harmony",n:"Perfect Harmony",d:"Achieve Complete Cooperation"},
 {id:"nine_legends",n:"Nine Legends",d:"Discover all nine Tailed Beasts across your lives",h:1},
 {id:"living_vessel",n:"Living Vessel",d:"Reach adulthood as a Jinchuriki",h:1},
 {id:"burden_village",n:"The Burden of a Village",d:"Live through a village war year as a host",h:1});

/* ---------- event engine: host + world templates ---------- */
function tbGate(req){var t=tbGet();if(!t)return false;
  if(req.fc&&t.fc)return false;
  if(req.ms&&t.ms.indexOf(String(req.ms))<0)return false;
  if(req.bond!=null){if(req.bond[0]!=null&&t.bond<req.bond[0])return false;if(req.bond[1]!=null&&t.bond>=req.bond[1])return false}
  if(req.known!=null&&t.known!==req.known)return false;
  if(req.age&&G.age<req.age)return false;
  return true}
var TB_EV=[];
function tbEv(id,w,once,gate,build){TB_EV.push({id:id,w:w,once:once,gate:gate,build:build})}
var tbOnce={};
function tbSeenOnce(id){if(tbOnce[id])return true;tbOnce[id]=true;return false}
function tbMarkLifeSeen(id){if(!G.tbSeenTB)G.tbSeenTB={};G.tbSeenTB[id]=1}
function tbLifeSeen(id){return G.tbSeenTB&&G.tbSeenTB[id]?true:false}

function tbPickHost(){
  var bag=[];
  TB_EV.forEach(function(e){
    if(tbLifeSeen(e.id)&&e.once)return;
    var ok=false;try{ok=e.gate()}catch(x){ok=false}
    if(ok)bag.push([e,e.w])});
  if(!bag.length)return null;
  var e=weighted(bag);if(!e)return null;
  tbMarkLifeSeen(e.id);
  return function(){return e.build()}}

/* ---------- 1. the first voice ---------- */
tbEv("tb_first_voice",0,true,function(){var t=tbGet();return t&&!t.fc&&(t.soonVoice||chance(.3))},
 function(){var b=tbBeast(),t=tbGet();t.soonVoice=false;
  return{t:"A Voice Behind the Seal",cat:"Tailed Beast",rar:"major",loc:"Inside you",art:"\u{1F512}",
   lines:["It happens somewhere quiet. Not silence, exactly. Something has been there your whole life and tonight, for the first time, it speaks.",
    {name:b.name,say:b.first}],
   choices:[
    {t:"Demand to know who it is",res:["The voice laughs. It is not a friendly sound. The pressure in your chest doubles, then fades like a slammed door."],fn:function(){tbBond(-6,"you demanded answers like a jailer");tbInf(6);addStat("discipline",1)}},
    {t:"Communicate calmly",res:["You keep your voice level. You ask, politely, who it is. A long pause. Then, grudgingly, it gives you a name. Its name. That matters more than you can know yet."],fn:function(){t.fc=true;t.knowName=true;tbBond(7,"you spoke to it like a person");award("first_contact");tl(G.age,"First contact with "+b.name)}},
    {t:"Ignore it",res:["You decide it is a dream, or stress, or nothing. It does not speak again for a long while. But you sleep worse now, and you know why."],fn:function(){addStat("happiness",-1);tbStab(-3);t.fc=false;tbMarkLifeSeen("tb_first_voice")}},
    {t:"Ask your mentor about the voice",res:["You describe it carefully. Your mentor goes pale, then very calm, and begins teaching you breathing exercises the same week. You have told exactly one person, and that person is now your shield."],fn:function(){t.fc=true;tbBond(3,"it noticed you sought help, not weapons");tbStab(4);G.tb.mentorAware=true;award("first_contact");addStat("chakraControl",2);tl(G.age,"Your mentor learned of your seal")}}]}});

/* ---------- 2. the beast refuses to speak ---------- */
tbEv("tb_silence",3,false,function(){return tbGate({fc:true,ms:0})&&chance(.6)},
 function(){var b=tbBeast();
  return{t:"The Silence",cat:"Tailed Beast",rar:"rare",loc:"Inside you",art:"\u{1F507}",
   lines:["For weeks the presence has been a closed door. You sit inside yourself and call out, and nothing answers.",
    {name:b.name,say:"..."}],
   choices:[
    {t:"Keep calling out anyway",res:["The third night, something shifts. Not an answer. A listening."],fn:function(){if(chance(.5)){tbBond(4,"you refused to give up on it")}else{tbBond(-2,"it found your persistence tedious");addStat("happiness",-1)}}},
    {t:"Give it space",res:["You stop knocking. Months later, unprompted, a single word arrives in the dark: '...still here?' Some doors open when they open themselves."],fn:function(){tbBond(5,"you respected the silence");tbStab(2)}},
    {t:"Force the contact",res:["You throw your chakra against the seal like a fist on a door. The recoil knocks you flat for a day. The door stays shut."],fn:function(){addStat("health",-5);tbStab(-5);tbInf(3);tbBond(-3,"you forced the cage")}}]}});

/* ---------- 3. strange chakra fluctuations ---------- */
tbEv("tb_fluctuation",4,false,function(){return tbGate({ms:0})&&chance(.55)},
 function(){var b=tbBeast();
  return{t:"Chakra Fluctuations",cat:"Tailed Beast",rar:"rare",loc:"Training ground",art:"\u{1F300}",
   lines:["Your chakra has been misbehaving: surging during leaf-sticking, guttering during hand seals, flaring whenever your temper does. A classmate watches your hands shake and says nothing.",
    {name:b.name,say:pick(b.lines)}],
   choices:[
    {t:"Steady it through control exercises",res:["You drill until the surge obeys. Not gone. Tamed. The difference will matter."],fn:function(){if(st("chakraControl")>=25){addStat("chakraControl",3);tbStab(4,"control held through a surge")}else{addStat("chakraControl",1);tbStab(-2);addStat("health",-2)}}},
    {t:"Let it surge and study it",res:["You stop resisting and watch what the chakra does. It has a rhythm. Now you know the rhythm."],fn:function(){addStat("chakra",2);tbInf(3);tbBond(2,"you studied it instead of fearing it");tbStab(-3)}},
    {t:"Hide it from everyone",res:["You bury the symptoms under double training. Nobody notices. Neither does your body, which now runs hot and sleeps three hours a night."],fn:function(){addStat("health",-3);tbStab(-4,"suppressed, not solved");tbMarkLifeSeen("tb_fluctuation")}}]}});

/* ---------- 4. losing control of emotions ---------- */
tbEv("tb_emotion",3,false,function(){return tbGate({ms:0})&&chance(.5)},
 function(){var b=tbBeast();
  return{t:"The Rising",cat:"Tailed Beast",rar:"rare",loc:pick(["The academy yard","The market","Home","The mission road"]),art:"\u{1F525}",
   lines:["Someone says something small and stupid. It should pass. It does not pass. Heat climbs your spine, your vision goes wide and red at the edges, and your hands are already moving.",
    {name:b.name,say:b.id==="kurama"?"Yes. Let it come.":b.id==="gyuki"?"Stance. NOW.":pick(b.lines)}],
   choices:[
    {t:"Suppress it",res:["You bite the inside of your cheek until you taste copper and walk away shaking. The anger stays in you. It has to live somewhere."],fn:function(){addStat("discipline",3);tbStab(2,"swallowed the surge");tbInf(3,"swallowed, not spent");addStat("happiness",-2)}},
    {t:"Let it out",res:["What happens next is over in seconds and remembered for years. Nobody is badly hurt. Everybody is badly informed about what you are."],fn:function(){tbInf(6);tbBond(3,"it finally saw you raw");tbStab(-6);if(G.tb.known<1)G.tb.known=1;rep(-4);tl(G.age,"Lost control in public")}},
    {t:"Ground yourself in your training",res:["Forms. Breathing. The first kata your sensei ever taught you. Your hands stop on their own. The red drains out of the world slowly, like a tide."],fn:function(){if(st("chakraControl")>=30||st("discipline")>=40){addStat("chakraControl",2);tbStab(5,"training held the line");tbBond(2,"you came back on your own")}else{tbInf(4);tbStab(-3);addStat("health",-2)}}}]}});

/* ---------- 5. mentor discovers abnormal chakra ---------- */
tbEv("tb_mentor_notices",0,true,function(){return tbGate({ms:0})&&!tbLifeSeen("tb_mentor_notices")&&!G.tb.mentorAware&&G.age>=6},
 function(){var b=tbBeast();
  return{t:"Something In Your Chakra",cat:"Tailed Beast",rar:"rare",loc:"Training",art:"\u{1F52C}",
   lines:["Your instructor stops a drill mid-motion and rests two fingers on your wrist. Their face does a thing you have never seen it do.",
    {name:b.name,say:"Your teacher can feel me. Interesting. What will they do with it, I wonder."}],
   choices:[
    {t:"Tell them the truth",res:["You say it quietly, once. Your mentor closes their eyes, breathes, and says: 'Then we train differently now.' From that day you have one person in the world who knows everything.",null],fn:function(){G.tb.mentorAware=true;tbBond(3,"you trusted a human with the truth");tbStab(5,"a mentor now guards the seal");addStat("chakraControl",2);tl(G.age,"Your mentor learned your secret")}},
    {t:"Deflect",res:["You call it fatigue, a growth spurt, bad sleep. Your mentor accepts it the way adults accept things they do not believe."],fn:function(){tbStab(-3,"no one is watching your back");addStat("discipline",1)}},
    {t:"Show off instead",res:["You flare your chakra on purpose. The yard goes silent. Your instructor's expression closes like a shop shutter."],fn:function(){tbInf(4);tbBond(-2,"you performed for a crowd");if(G.tb.known<1&&chance(.4))G.tb.known=1;rep(2)}}]}});

/* ---------- 6. village officials get suspicious ---------- */
tbEv("tb_officials",2,true,function(){return tbGate({ms:0})&&G.age>=10&&!tbLifeSeen("tb_officials")},
 function(){var b=tbBeast();
  return{t:"Questions From Above",cat:"Tailed Beast",rar:"rare",loc:"Administration",art:"\u{1F3E2}",
   lines:["Two shinobi with council credentials sit you down in a room with one lamp. The questions start small. They do not stay small.",
    {name:b.name,say:"Lie well or lie not at all. Their lie-detectors are pathetic, but their memories are not."}],
   choices:[
    {t:"Answer honestly",res:["You tell them what you are. One of them writes for a long time. The other keeps looking at you like a report that learned to walk. You are escorted home, politely, all the way to the door."],fn:function(){if(G.tb.known<1)G.tb.known=1;tbStab(3,"the village is watching, which is a kind of protection");rep(-2);tbMarkLifeSeen("tb_officials")}},
    {t:"Evade carefully",res:["You answer everything and admit nothing. It works. It costs you: you will be watching your back for years, and so will they."],fn:function(){addStat("intelligence",2);tbStab(-2);tbMarkLifeSeen("tb_officials")}},
    {t:"Demand to know why you are being interrogated",res:["The room goes still. One of them smiles without warmth and leaves. The other says only: 'Because of what is inside you. Sleep well.' Now you know they know. And they know you know."],fn:function(){tbBond(4,"you squared up for its sake");if(G.tb.known<2)G.tb.known=2;rep(-1);tbMarkLifeSeen("tb_officials")}}]}});

/* ---------- 7. beast tests the host ---------- */
tbEv("tb_test",3,true,function(){return tbGate({fc:true,ms:1})&&!tbLifeSeen("tb_test")},
 function(){var b=tbBeast();
  return{t:"The Test",cat:"Tailed Beast",rar:"major",loc:"The inner world",art:"\u{1F3AD}",
   lines:["You wake inside the seal. It looks different every time: tonight it is a cage of "+(b.id==="shukaku"?"sand that hums":b.id==="isobu"?"coral and slow tide":b.id==="kurama"?"bars of old iron":"light and pressure")+". The presence waits at its far edge, and you understand, without being told, that this is a test.",
    {name:b.name,say:"Three doors. One opens forward. Two open nothing. Choose, and choose without me."}],
   choices:[
    {t:"Choose the hardest door and walk through",res:["It is the right door. Not because you guessed. Because you did not hesitate. Something enormous regards you with new eyes."],fn:function(){tbBond(8,"you chose without flinching");addStat("willpower",2);tbMarkLifeSeen("tb_test")}},
    {t:"Refuse the test on principle",res:["You tell it you do not perform for wardens. The cage goes very quiet. Then, very quietly, it approves."],fn:function(){tbBond(4,"you refused to be tested like a tool");addStat("discipline",2)}},
    {t:"Ask it which door is safe",res:["'That is not the test,' it says, and the inner world dissolves. You wake with the taste of failure you did not earn."],fn:function(){tbBond(-4,"you asked the examiner for answers");tbMarkLifeSeen("tb_test")}}]}});

/* ---------- 8. nightmares of the inner world ---------- */
tbEv("tb_nightmare",3,false,function(){return tbGate({ms:0})&&chance(.5)},
 function(){var b=tbBeast();
  return{t:"The Inner World",cat:"Tailed Beast",rar:"rare",loc:"A dream",art:"\u{1F319}",
   lines:["The nightmare is always the same shape: a vast space, a pressure at your back, and a voice that is not a voice telling you that you will never leave. Tonight you stop running and turn around.",
    {name:b.name,say:b.id==="isobu"?"...You turned around. Nobody turns around.":pick(b.lines)}],
   choices:[
    {t:"Look at it properly for the first time",res:["You see it. All of it. It sees you seeing it. You wake soaked, calm, and permanently changed: the inner world has a map in your head now."],fn:function(){G.tb.inner=true;tbBond(5,"you looked without running");addStat("willpower",1)}},
    {t:"Fight the dream",res:["You battle the shape of it until dawn takes you back. The dream leaves scratches on the inside of your ribs. Nothing heals in dreams."],fn:function(){addStat("health",-3);tbStab(-3);tbInf(2)}},
    {t:"Wake and write it down",res:["You keep a journal of the inner world: architecture, weather, moods. Knowledge is a leash, and you are holding one end of it."],fn:function(){addStat("intelligence",2);addStat("chakraControl",1);tbStab(2,"you mapped the seal")}}]}});

/* ---------- 9. the beast offers its chakra ---------- */
tbEv("tb_offer",4,true,function(){return tbGate({bond:[30,null],ms:2})&&tbLifeSeen("tb_offer")===undefined},
 function(){var b=tbBeast();
  return{t:"The Offer",cat:"Tailed Beast",rar:"major",loc:"Inside you",art:"\u{1F525}",
   lines:["It comes without warning: a current of chakra pooling at the seal like heat off a forge. It is offering. It has never offered before.",
    {name:b.name,say:b.offer}],
   choices:[
    {t:"Accept",res:["The chakra floods in and burns the way a river burns. It is the strongest you have ever felt, and for one long moment you are not entirely sure who is holding whom."],fn:function(){addStat("chakra",5);addStat("ninjutsu",2);tbInf(8);tbStab(-8);tbBond(3,"you accepted what it offered");tl(G.age,"Drew on "+b.name+"'s chakra for the first time")}},
    {t:"Refuse, politely",res:["You thank it. The offer withdraws, unhurried. The silence afterward feels like respect."],fn:function(){tbBond(5,"you refused without insulting it");tbStab(3)}},
    {t:"Accept only what you can carry",res:["You take a thread of it instead of the river. It is barely anything. It is also the first time in the history of your seal that a host said 'enough' and meant it."],fn:function(){addStat("chakra",2);tbBond(7,"you took only what you could carry");tbStab(2);tbInf(-2)}}]}});

/* ---------- 10. attempting communication ---------- */
tbEv("tb_reach",3,false,function(){return tbGate({fc:true,bond:[0,70]})},
 function(){var b=tbBeast(),t=tbGet();
  return{t:"An Attempted Connection",cat:"Tailed Beast",rar:"rare",loc:"Meditation",art:"\u{1F9D8}",
   lines:["You sit down on purpose, at a chosen hour, and reach in. Not a prayer. A conversation, offered across the seal.",
    {name:b.name,say:pick(b.lines)}],
   choices:[
    {t:"Listen more than you speak",res:["You say almost nothing for an hour. What comes back is not words. It is an impression: old, tired, and much less interested in hurting you than you assumed."],fn:function(){tbBond(4,"you listened");addStat("chakraControl",2)}},
    {t:"Tell it about your day",res:["The petty details of a shinobi's life, recited to a monster. It interrupts exactly once, to correct your memory of what the old man said. It was listening the whole time."],fn:function(){tbBond(6,"you treated it like a person");if(t.bond<20)t.bond=20}},
    {t:"Ask for its name",res:["The question hangs. Whether it answers depends on everything you have done so far."],fn:function(){if(t.bond>=45){t.knowName=true;tbBond(4,"it gave you its name");fbig(b.name+" finally tells you its name. Not the scroll's name. Its own.","big")}else{tbBond(-2,"you asked too soon");fbig("It does not give you its name. It gives you a silence with edges.","bad")}}}]}});

/* ---------- 11. chakra control breakthrough ---------- */
tbEv("tb_breakthrough",3,true,function(){return tbGate({ms:2})&&st("chakraControl")>=20&&tbLifeSeen("tb_breakthrough")===undefined},
 function(){var b=tbBeast();
  return{t:"Breakthrough",cat:"Tailed Beast",rar:"major",loc:"Training",art:"\u2728",
   lines:["It happens on an ordinary morning: the chakra that always resisted you suddenly moves where you send it, smooth as poured water. The beast's chakra and yours have found a shared rhythm.",
    {name:b.name,say:b.id==="gyuki"?"Scheduled harmony. Acceptable.":b.id==="chomei"?"TWO rhythms! One song! I counted!":pick(b.lines)}],
   choices:[
    {t:"Push the breakthrough further",res:["You ride the rhythm until your channels ache. The gain is real and so is the cost."],fn:function(){addStat("chakraControl",4);addStat("health",-3);tbStab(4);tbMarkLifeSeen("tb_breakthrough")}},
    {t:"Stop while it is good",res:["You bank the gain and stop. Prudent. The beast, uniquely, does not mock prudence."],fn:function(){addStat("chakraControl",2);tbBond(3,"you know when to stop");tbMarkLifeSeen("tb_breakthrough")}}]}});

/* ---------- 12. the beast rejects connection ---------- */
tbEv("tb_reject",2,false,function(){return tbGate({fc:true,bond:[0,45]})&&chance(.4)},
 function(){var b=tbBeast();
  return{t:"Rejection",cat:"Tailed Beast",rar:"rare",loc:"Inside you",art:"\u{1F6AB}",
   lines:["You reach in. Before a single word forms, the whole inner world turns its back on you. The rejection is physical: cold, total, absolute.",
    {name:b.name,say:"No. Not today. Not like this."}],
   choices:[
    {t:"Withdraw with dignity",res:["You leave without another word. The cold lingers, but so does something else: the sense that a door was closed, not boarded."],fn:function(){tbStab(2);addStat("discipline",1)}},
    {t:"Try again immediately",res:["The second rejection has teeth. You wake with your ears ringing and a week of nosebleeds ahead of you."],fn:function(){addStat("health",-4);tbStab(-5);tbInf(3);tbBond(-3,"you pushed where it said no")}},
    {t:"Ask why",res:["Silence. Then, from very far away, one line: 'Because the last one who asked died asking.' You think about that for a month."],fn:function(){tbBond(2,"you asked the right question, badly timed");addStat("intelligence",1)}}]}});

/* ---------- 13. unexpected cooperation ---------- */
tbEv("tb_coop",3,true,function(){return tbGate({bond:[40,null],ms:3})&&tbLifeSeen("tb_coop")===undefined},
 function(){var b=tbBeast();
  return{t:"Unexpected Cooperation",cat:"Tailed Beast",rar:"major",loc:pick(["A collapsing tunnel","A river crossing","The mission field","A burning storehouse"]),art:"\u{1F91D}",
   lines:["It goes wrong fast: the kind of wrong where thinking is a luxury. And then, before you can be afraid, chakra moves through you that you did not call. Steadying your hands. Finding the footing. Working with you.",
    {name:b.name,say:"Do not make a speech. Move."}],
   choices:[
    {t:"Say thank you anyway",res:["You say it under your breath while running. There is a pause in the current, like a cough, like embarrassment. It heard you."],fn:function(){tbBond(8,"you said thank you and meant it");addStat("reputation",0);rep(3);tl(G.age,""+b.name+" acted alongside you unprompted")}},
    {t:"Say nothing and memorize the feeling",res:["You log every sensation. Next time, you will be able to reach for it on purpose."],fn:function(){tbBond(5);addStat("chakraControl",2);tbMarkLifeSeen("tb_coop")}}]}});

/* ---------- 14. village citizens react ---------- */
tbEv("tb_citizens",3,false,function(){return tbGate({known:[1,null]})&&chance(.5)},
 function(){var b=tbBeast(),t=tbGet();
  var mood=st("reputation")>=60?"grudging respect":"fear";
  return{t:"The Village Looks",cat:"Tailed Beast",rar:"rare",loc:pick(["The market","The well","The academy gates","The main road"]),art:"\u{1F465}",
   lines:["Word is out. It moves ahead of you down the street the way weather moves: shutters adjusting, conversations dropping, a mother's hand closing on her child's sleeve. "+(mood==="grudging respect"?"But an old woman nods at you. Once. Like a debt acknowledged.":"Nobody meets your eyes.")],
   choices:[
    {t:"Meet their eyes and keep walking",res:["You do not lower your head for anyone. Some of the fear curdles into something healthier: caution, and under it, the beginning of respect."],fn:function(){rep(3);tbBond(2,"you carried it with your spine straight");tbStab(1)}},
    {t:"Stop and help, loudly",res:["You carry the crates, fix the shutter, find the lost child. By sunset three people have decided you are a person. The rest will take years."],fn:function(){rep(4);addStat("happiness",1);tbMarkLifeSeen("tb_citizens")}},
    {t:"Take the side streets from now on",res:["You map a quieter city for yourself. It works. It also teaches the village that its instinct about you was right."],fn:function(){rep(-2);addStat("happiness",-2);tbBond(-1);tbMarkLifeSeen("tb_citizens")}}]}});

/* ---------- 15. rumors spread ---------- */
tbEv("tb_rumors",2,true,function(){return tbGate({known:[1,1]})&&tbLifeSeen("tb_rumors")===undefined},
 function(){var b=tbBeast();
  return{t:"Rumors",cat:"Tailed Beast",rar:"rare",loc:"Everywhere",art:"\u{1F5E3}",
   lines:["The whisper has a shape now: they say the child carries the "+b.n+"-tails. Versions of you are walking around the village that you have never met: the cursed one, the weapon, the poor thing, the future warlord.",
    {name:b.name,say:"They are describing a monster. I have met the monster. You are not it. Yet. Their imagination is flattered daily."}],
   choices:[
    {t:"Own it publicly",res:["You stop denying it. The word jinchuriki sits in your mouth like a stone, and then like a title. The whispers do not stop, but they start addressing you instead of describing you.",null],fn:function(){G.tb.known=2;rep(2);tbBond(3,"you refused to be ashamed");tl(G.age,"Publicly acknowledged as a jinchuriki")}},
    {t:"Deny everything",res:["You deny it so flatly and so often that the rumor develops a counter-rumor. It buys you anonymity. It costs you the truth."],fn:function(){addStat("discipline",1);tbStab(-2,"living a lie has a cost");tbMarkLifeSeen("tb_rumors")}},
    {t:"Say nothing at all",res:["Silence is the only answer that cannot be quoted. The rumors burn down to embers on their own."],fn:function(){tbStab(1);tbMarkLifeSeen("tb_rumors")}}]}});

/* ---------- 16. feared or respected ---------- */
tbEv("tb_standing",3,false,function(){return tbGate({known:[2,null],ms:3})&&chance(.45)},
 function(){var b=tbBeast(),t=tbGet();
  var good=st("reputation")>=65&&t.stab>=55;
  return{t:good?"A Nod From Strangers":"Crossing The Street",cat:"Tailed Beast",rar:"rare",loc:"The village",art:"\u{1F441}",
   lines:[good?"A merchant who once barred his stall to you now bows too deeply, and means it in both directions: respect, and the fear that lives inside respect. Word of your deeds travels faster than your seal ever leaked.":"The fear is back and it has company: a mission failure last season gave everyone's quiet suspicion a fact to stand on. The path ahead of you empties as you walk it.",
    {name:b.name,say:good?"They are learning what I already know.":"They should be afraid. Their mistake is which one of us they should fear for."}],
   choices:[
    {t:good?"Carry the respect without the arrogance":"Prove the fear wrong with deeds",res:["You keep being excellent in public and humble in person. It is exhausting and it is working, slowly, at the speed villages change."],fn:function(){rep(3);tbBond(2);tbMarkLifeSeen("tb_standing")}},
    {t:"Lean into the reputation",res:["You stop correcting anyone. Fear keeps missions easy and conversations short. It also keeps you, in a way nobody says out loud, alone."],fn:function(){rep(4);addStat("happiness",-3);tbInf(3);tbBond(-2)}},
    {t:"Find the ones who are not afraid",res:["There are always a few: the tea house owner, the academy kid, the retiree who remembers a different host kindly. You build a small life inside the large fear. It holds."],fn:function(){addStat("happiness",3);tbBond(3,"it noticed you choosing people over fear");tbMarkLifeSeen("tb_standing")}}]}});

/* ---------- 17. dangerous missions offered because of host status ---------- */
tbEv("tb_danger",3,false,function(){return tbGate({known:[1,null],ms:2})&&G.rank!=="Child"&&G.rank!=="Newborn"&&G.age>=13&&chance(.5)},
 function(){var b=tbBeast();
  return{t:"The Mission Only You Can Take",cat:"Tailed Beast",rar:"major",loc:"Mission office",art:"\u{1F4DC}",
   lines:["The briefing room empties before you are called in. The scroll on the desk is dark red. The jonin across the desk does not pretend it is a normal assignment: they need someone who can survive what would kill anyone else, and everyone knows what that means.",
    {name:b.name,say:"They want the weapon, not the shinobi. Decide which one you are before you sign."}],
   choices:[
    {t:"Accept",res:["You sign. The mission is brutal and you come back changed: successful, scarred, and promoted into a weight class you are not sure you wanted."],fn:function(){if(st("endurance")>=30&&tbGet().stab>=50){rep(6);addStat("reputation",0);tl(G.age,"Survived an S-class mission as the "+b.title+" host")}else{addStat("health",-12);rep(2);tbStab(-5,"you were pushed too far")}tbMarkLifeSeen("tb_danger")}},
    {t:"Refuse",res:["You refuse an S-rank in front of the desk. The jonin writes it down without judgment. Your next three briefings are noticeably calmer."],fn:function(){rep(-2);tbBond(3,"you will not be spent like ammunition");tbMarkLifeSeen("tb_danger")}},
    {t:"Accept, but demand support",res:["You sign with conditions: a full squad, a med-nin, a recall signal. The room bristles, then agrees. Command has learned that the host negotiates.",null],fn:function(){rep(3);addStat("leadership",2);tbBond(2,"you negotiated like a person, not a tool");tbMarkLifeSeen("tb_danger")}}]}});

/* ---------- 18. strengthening the seal ---------- */
tbEv("tb_reseal",2,true,function(){return tbGate({ms:1})&&G.age>=12&&tbLifeSeen("tb_reseal")===undefined},
 function(){var b=tbBeast(),t=tbGet();
  return{t:"The Sealing Rite",cat:"Tailed Beast",rar:"major",loc:"Sealing chamber",art:"\u2696",
   lines:["A seal master studies the script on your body for a long, silent hour, then says what everyone has been careful not to say: the seal can be reinforced now, while the beast sleeps shallow, or left to age with you.",
    {name:b.name,say:"Reinforce it and you weld my cage. Leave it and you own your life. Choose knowing I heard everything."}],
   choices:[
    {t:"Reinforce the seal",res:["The rite takes all night. When dawn comes the ink has gone silver at the edges and your chakra sits quieter than it has in years. So does the voice, for a while."],fn:function(){tbStab(15,"the seal was reinforced");tbBond(-4,"you welded the cage");if(G.ryo>=800){G.ryo-=800;tbHist("Paid 800 ryo for the sealing rite.")}else{addStat("health",-3);tbHist("Could not pay for the sealing rite; the exhaustion took its toll.")}}},
    {t:"Negotiate a willing seal instead",res:["You turn to the presence in the room that no one else can see and offer terms: a seal you both agree to. It studies you for a long time. The answer depends on everything between you."],fn:function(){if(t.bond>=50){tbStab(18,"a seal by consent holds strongest");tbBond(8,"you asked instead of welded");tl(G.age,"Sealed by mutual consent")}else{tbBond(-5,"it refused your terms");tbStab(5,"the fallback rite held");fbig("It refuses your terms. The master performs the standard rite instead, to its cold displeasure.","bad")}}},
    {t:"Leave the seal as it is",res:["You walk out of the chamber unsealed. The seal master says you are either the bravest host he has met or the most foolish, and that the two are often the same person."],fn:function(){tbBond(4,"you chose to live beside it, not over it");tbStab(-3);tbMarkLifeSeen("tb_reseal")}}]}});

/* ---------- 19. seal instability warning ---------- */
tbEv("tb_warning",2,false,function(){return tbGate({})&&(function(){var t=tbGet();return t&&t.stab<50})()},
 function(){var b=tbBeast(),t=tbGet();
  return{t:"The Warning Sign",cat:"Tailed Beast",rar:"major",loc:"The seal",art:"\u26A0\uFE0F",
   lines:["The script on your seal has begun to fray at one corner: your chakra stutters at odd hours, your temper sits an inch below the surface, and the beast's presence feels closer than it did last month.",
    {name:b.name,say:"The bars are thinner here. Do something about it before the thin part becomes a door."}],
   choices:[
    {t:"Seek a seal master immediately",res:["The master works for two days. The fraying corner is restitched. You pay in coin and in the peculiar humiliation of being handled like a parcel."],fn:function(){if(G.ryo>=500){G.ryo-=500;tbStab(10,"a master restitched the seal")}else{tbStab(4,"you bartered training labor for the work");addStat("endurance",1)}}},
    {t:"Ask the beast to hold itself back",res:["It laughs at the request. Then, unexpectedly, it half-agrees: the pressure eases by a fraction. A fraction is a lot, from something that size."],fn:function(){tbStab(6,"the beast agreed to pull back");tbBond(3,"you asked and it answered")}},
    {t:"Deal with it alone through discipline",res:["You double your control drills and cut stimulants and sleep with wards drawn. It is the slow way. The fraying stops spreading."],fn:function(){addStat("chakraControl",2);tbStab(4,"discipline held the fraying edge")}}]}});

/* ---------- 20. the beast recognizes determination ---------- */
tbEv("tb_resolve",2,true,function(){return tbGate({bond:[50,null],ms:3})&&tbLifeSeen("tb_resolve")===undefined},
 function(){var b=tbBeast();
  return{t:"What It Sees In You",cat:"Tailed Beast",rar:"major",loc:"Inside you",art:"\u{1F4AA}",
   lines:["You have failed at something that mattered. Not the kind of failure that passes: the kind that reorganizes a person. You get up anyway. It is the getting up that the oldest thing in your body has been waiting years to watch.",
    {name:b.name,say:b.trust}],
   choices:[
    {t:"Accept what it offers",res:["What it offers is not chakra. It is recognition. Something in the seal settles into a new shape, like a joint finding its socket."],fn:function(){tbBond(10,"it chose to stand with you");tbStab(8);tl(G.age,""+b.name+" acknowledged your resolve")}},
    {t:"Say you would have gotten up anyway",res:["'I know,' it says. 'That is the point.' The conversation ends there. It is the best conversation you have ever had."],fn:function(){tbBond(8,"it approved of your stubborn honesty");addStat("willpower",2)}}]}});

/* ---------- 21. rare genuine trust ---------- */
tbEv("tb_trust",1,true,function(){return tbGate({bond:[80,null],ms:4})&&tbLifeSeen("tb_trust")===undefined},
 function(){var b=tbBeast(),t=tbGet();
  return{t:"The Longest Memory",cat:"Tailed Beast",rar:"legendary",loc:"Inside you",art:"\u{1F54A}",
   lines:["It begins speaking without being asked, which has never happened: not about you. About itself. Where it was born, what it was called before the scrolls named it, who held its leash in centuries whose dust your village is built on.",
    {name:b.name,say:"You will not live long enough to understand what I am. But you are the first one in a very long time who tried."}],
   choices:[
    {t:"Sit and listen until it finishes",res:["It takes all night. It takes decades off your understanding of the world. When it finishes, the seal between you is not a cage. You are not sure what to call it, but 'cage' is wrong."],fn:function(){tbBond(12,"a night of true trust");tbStab(10,"the seal rests easier than it ever has");tbInf(-6);t.trueBond=true;tl(G.age,"True trust with "+b.name)}},
    {t:"Promise to carry its story",res:["You swear to remember it, and to tell it true when the time comes. Something ancient and enormous accepts the promise of someone it could crush by breathing."],fn:function(){tbBond(10,"you promised to carry its story");tbStab(6)}}]}});

/* ---------- 22. the burden: war year as a host ---------- */
tbEv("tb_war",3,false,function(){return tbGate({ms:2})&&G.villageState&&G.villageState.warActive&&G.age>=12&&chance(.6)},
 function(){var b=tbBeast();
  return{t:"The Village's Sword",cat:"Tailed Beast",rar:"major",loc:"War council",art:"\u2694",
   lines:["War has come and the council has remembered what you are. The request is not an order, which is somehow worse: they need the "+b.title+" ready, and they are asking politely, and everyone in the room is calculating what refusal costs.",
    {name:b.name,say:"They trained for this the day they sealed me. Ask them why none of them are volunteering."}],
   choices:[
    {t:"Volunteer",res:["You step forward before the silence can settle. The council exhales as one. The war will be different with you in it, and so will you."],fn:function(){rep(6);award("burden_village");tbBond(4,"you chose the village that fears you");tbStab(-5);tbMarkLifeSeen("tb_war")}},
    {t:"Set terms first",res:["You agree to fight, and then you name your terms: protection for your family, care for your civilian status after, and a council witness at every field decision. They accept all of it, resentfully.",null],fn:function(){rep(3);addStat("leadership",3);award("burden_village");tbBond(3,"you made the fear negotiate");tbMarkLifeSeen("tb_war")}},
    {t:"Refuse to be a weapon",res:["You refuse. The room goes quiet in a way rooms do when a person has just become a problem. You sleep badly for a month. So does the council."],fn:function(){rep(-5);tbBond(5,"you refused to be spent");tbMarkLifeSeen("tb_war")}}]}});

/* ---------- 23. growing up as a host ---------- */
tbEv("tb_adult",0,true,function(){return G.age===18&&(function(){var t=tbGet();return t&&t.ms.indexOf("4")>=0})()},
 function(){var b=tbBeast(),t=tbGet();
  return{t:"Living Vessel",cat:"Tailed Beast",rar:"major",loc:"Your birthday",art:"\u{1F382}",
   lines:["You turn eighteen with a "+b.title+" under your ribs and a decade of practice at carrying it. You are an adult now, in every registry that counts. The seal is not a childhood thing you will outgrow. It is you.",
    {name:b.name,say:"Eighteen. A thousand years of hosts, and I will say this once: you did not turn out badly."}],
   choices:[
    {t:"Toast the old thing",res:["You raise a cup to the presence in your chest. It pretends not to notice. It notices."],fn:function(){tbBond(5,"you toasted it like family");award("living_vessel")}},
    {t:"Mark it privately",res:["You climb somewhere high and watch the sun come up over a village that fears and needs you, and you decide, quietly, that both are survivable."],fn:function(){tbStab(5);award("living_vessel");addStat("happiness",2)}}]}});

/* ---------- acquisition: mid-life sealing events ---------- */
var TB_ACQ=[
 {t:"The Village Needs A Vessel",w:TB_CFG.sealEventW,run:function(){
   modal("The Village Needs A Vessel","Tailed Beast","A beast has been taken in battle and the sealing corps need a living vessel within days, or the containment fails and the "+pick(["One-Tail","Three-Tails","Seven-Tails"])+" walks free. Volunteers are requested. Nobody expects a volunteer.",
    [{t:"Volunteer",d:"become a jinchuriki",fn:function(){var bid=tbPickBeastId();tbGive(bid,"you volunteered when the village needed a vessel");
       fbig("The rite takes a night and most of your remaining strength. When you wake, the world has an extra heart in it, and it is not yours.","big");
       tl(G.age,"Became the jinchuriki of the "+B(bid).title);G.tb.soonVoice=true}},
     {t:"Stay silent",fn:function(){fbig("You keep your hand down. Someone else's goes up. The village gets its vessel and you get to live with the arithmetic of that.","");addStat("happiness",-2)}}])}},
 {t:"A Host Has Fallen",w:TB_CFG.sealEventW*0.8,run:function(){
   modal("A Host Has Fallen","Tailed Beast","A jinchuriki of a neighboring village has died in the border fighting, and the beast inside them has no vessel. Delegates arrive within the week with a sealed proposal and a question no one has ever asked you before.",
    [{t:"Hear the proposal",fn:function(){var bid=tbPickBeastId();
       modal("The Transfer Proposal","Tailed Beast","They are not asking you to serve. They are asking whether you would consent to host the "+B(bid).title+", willingly, with your village's blessing. Consent changes what the seal becomes.",
        [{t:"Consent",d:"become a jinchuriki",fn:function(){tbGive(bid,"the beast was transferred to you by consent after its host fell");
           fbig("The transfer rite is different from a sealing: no cage is built. A door is opened, and something enormous and grieving walks through it, and looks at you, and stays.","big");
           tl(G.age,"Inherited the "+B(bid).title+" by consent");G.tb.soonVoice=true}},
         {t:"Decline",fn:function(){fbig("You decline. The delegates leave politely. The beast goes to someone else, and you think about it for years.","")}}])}},
     {t:"Send them away",fn:function(){fbig("You refuse to even hear it. Some doors you do not stand in front of.","")}}])}},
 {t:"The Chakra Surge",w:TB_CFG.sealEventW*0.6,run:function(){
   modal("A Chakra Like No Other","Tailed Beast","A sealing team passing through your village has measured your chakra with instruments built for measuring siege weapons. The readings do not make sense, they say, unless... They do not finish the sentence. They keep looking at you.",
    [{t:"Ask what they mean",fn:function(){var bid=tbPickBeastId();
       modal("The Beast Chooses","Tailed Beast","'The readings match a specific signature,' the lead seal master says finally. 'A '+B(bid).title+", uncontained. And signatures like that... choose.' The implication lands in the room like a dropped blade.",
        [{t:"Let it choose you",d:"become a jinchuriki",fn:function(){tbGive(bid,"the beast chose you after a measured chakra surge");
           fbig("No rite. No cage. One night of fever dreams, and when you wake, something vast is curled around your chakra like it has always lived there.","big");
           tl(G.age,"Chosen by the "+B(bid).title);G.tb.soonVoice=true}},
         {t:"Walk away from the readings",fn:function(){fbig("You leave the tent and do not go back. The dreams that follow you for a season are, you decide, only dreams.","");addStat("happiness",-1)}}])}},
     {t:"Leave without a word",fn:function(){fbig("You are out the door before the sentence finishes. Whatever they think you are, you decide not to be it today.","")}}])}}
];
function tbPickBeastId(){
  var bag=[];BEASTS.forEach(function(b){
    var w=b.w;
    if(b.vill&&G.village===b.vill)w=Math.round(w*1.6);
    if(tbHostAlive(b.id))w=Math.round(w*0.25); /* a beast with a living host is not up for grabs */
    bag.push([b.id,w])});
  return weighted(bag)}

/* ---------- per-beast signature events ---------- */
var TB_SIG={};
TB_SIG.shukaku={w:3,build:function(){var b=tbBeast();
 return{t:"The Sand Keeps Count",cat:"Tailed Beast",rar:"rare",loc:"Your bedroom",art:"\u23F0",
  lines:["Nineteen days without real sleep. The sand in the hourglass whispers all night, and every time your eyes close, something huge leans in close enough to taste your dreams.",
   {name:b.name,say:"Sleep is a door. I am the thing on the other side of it. You want to guess what happens when you open it?"}],
  choices:[
   {t:"Outlast the insomnia",res:["You learn to function in shallow sleep, half a mind always awake. It is a terrible skill. It is also now yours."],fn:function(){addStat("endurance",2);tbBond(2,"you did not beg for sleep");tbMarkLifeSeen("tb_sig_shukaku")}},
   {t:"Trade: one honest hour of talk for one night of sleep",res:["You offer the deal out loud. It cackles, accepts, and talks for a full hour about the desert before your village existed. You sleep nine hours and dream of dunes.",null],fn:function(){addStat("health",3);tbBond(4,"you negotiated like an equal");tbMarkLifeSeen("tb_sig_shukaku")}}]}}};
TB_SIG.matatabi={w:3,build:function(){var b=tbBeast();
 return{t:"The Blue Flame Trial",cat:"Tailed Beast",rar:"rare",loc:"The kiln road",art:"\u{1F525}",
  lines:["A fire takes a granary on the edge of the village and the family inside is cut off. Everyone hesitates. The heat is wrong, somehow, older than fire should be, and your veins answer it like a name being called.",
   {name:b.name,say:"That is my element burning where it should not. Go. I will make sure the fire knows you."}],
  choices:[
   {t:"Walk into the fire",res:["The flames part around you like a courtesy. You carry the family out with your sleeves smoking and not one burn on you. The village invents three explanations. The true one is stranger."],fn:function(){rep(5);tbBond(6,"you trusted the flame");tbMarkLifeSeen("tb_sig_matatabi")}},
   {t:"Coordinate the bucket line instead",res:["You command the rescue from the perimeter and nobody is lost. In the smoke, for one second, something with two tails nods at you."],fn:function(){rep(3);addStat("leadership",2);tbBond(3,"you led with your head, not the fire");tbMarkLifeSeen("tb_sig_matatabi")}}]}}};
TB_SIG.isobu={w:3,build:function(){var b=tbBeast();
 return{t:"The Sea Cave",cat:"Tailed Beast",rar:"rare",loc:"The coast",art:"\u{1F30A}",
  lines:["A supply run strands you in a sea cave with the tide coming in. There is no panic in you, which is its own kind of strange. The water in the dark is listening, and something vast is patient on both sides of it.",
   {name:b.name,say:"...The tide turns in forty minutes. Wait with me."}],
  choices:[
   {t:"Wait with it",res:["Forty minutes is nothing and forever. The turtle talks about currents older than maps. When the tide turns, you wade out calm, and the water seems to remember you kindly."],fn:function(){tbBond(5,"you waited without fear");addStat("chakraControl",1);tbMarkLifeSeen("tb_sig_isobu")}},
   {t:"Try to swim it now",res:["You fight the current alone and nearly lose. Something enormous keeps you from the worst of it, annoyed, like a hand snatching a child from traffic."],fn:function(){addStat("health",-4);tbBond(2,"it saved you anyway");tbMarkLifeSeen("tb_sig_isobu")}}]}}};
TB_SIG.goku={w:3,build:function(){var b=tbBeast();
 return{t:"Plain Words",cat:"Tailed Beast",rar:"rare",loc:"The mission road",art:"\u{1F934}",
  lines:["A senior shinobi demands your team's rations 'requisitioned' for his unit. Everyone goes quiet and calculating. Something in you has exactly no patience left for polished cowardice.",
   {name:b.name,say:"Say the true sentence. The one without courtesies. Say it and see what happens."}],
  choices:[
   {t:"Say it plainly: no",res:["You refuse, flat, unadorned. He backs down in front of everyone. The beast in you is so pleased it is almost humming."],fn:function(){tbBond(6,"plain words, no flattery");rep(2);tbMarkLifeSeen("tb_sig_goku")}},
   {t:"Flatter him and keep the peace",res:["You talk him down with courtesy and everyone keeps their rations. It works. Inside you, a king turns his back."],fn:function(){tbBond(-3,"you bowed when truth was cheaper");tbMarkLifeSeen("tb_sig_goku")}}]}}};
TB_SIG.kokuo={w:3,build:function(){var b=tbBeast();
 return{t:"The Unnamed",cat:"Tailed Beast",rar:"rare",loc:"The archive",art:"\u{1F5D3}",
  lines:["A village historian corners you with a research request: everything about the Five-Tails, for the public record. She is kind, thorough, and does not understand the look on your face.",
   {name:b.name,say:"Your village already lists me like inventory. I will not be a story in a book as well."}],
  choices:[
   {t:"Refuse on the beast's behalf",res:["You tell the historian that some records stay sealed. She writes that down too, but she respects it. Inside you, something that hates being known is, for the first time, grateful."],fn:function(){tbBond(6,"you guarded its name");tbMarkLifeSeen("tb_sig_kokuo")}},
   {t:"Cooperate with the archive",res:["You answer the questions. The record is honest and complete. The presence in you goes somewhere far away and cold for a month."],fn:function(){rep(2);tbBond(-5,"you sold its privacy");tbMarkLifeSeen("tb_sig_kokuo")}}]}}};
TB_SIG.saiken={w:3,build:function(){var b=tbBeast();
 return{t:"What Rot Is",cat:"Tailed Beast",rar:"rare",loc:"The medical ward",art:"\u{1F41B}",
  lines:["Volunteering at the medical ward, you are assigned the fever ward nobody wants. A dying man mistakes you for his son and holds your hand with a grip like rope. Something in you leans in and studies the moment like a delicacy.",
   {name:b.name,say:"Stay. I want to understand why you do not pull away."}],
  choices:[
   {t:"Stay until the end",res:["You stay. The hand goes slack near dawn and you close his eyes. The beast is quiet for days afterward, digesting something that is not a body."],fn:function(){rep(3);addStat("medical",1);tbBond(5,"it studied your mercy");tbMarkLifeSeen("tb_sig_saiken")}},
   {t:"Pull away and assign a nurse",res:["You do the sensible thing and hand the case off. The sensible thing has a taste the beast comments on for a week."],fn:function(){tbBond(-2,"it does not respect retreat");tbMarkLifeSeen("tb_sig_saiken")}}]}}};
TB_SIG.chomei={w:3,build:function(){var b=tbBeast();
 return{t:"Lucky Days",cat:"Tailed Beast",rar:"rare",loc:"The festival",art:"\u{1F38B}",
  lines:["Festival day. A ring-toss stall owner swears nobody has won the top prize in nine years. Something in your chest is practically vibrating with confidence it has no business having.",
   {name:b.name,say:"Seven tails, seven throws! I have been practicing inside your chakra ALL WEEK!"},
  ],
  choices:[
   {t:"Take the seven throws",res:["Ring. Ring. Ring. Ring. Ring. Ring. Ring. The crowd loses its mind. The stall owner loses his livelihood's pride and gains a story. Somewhere behind your ribs, a beetle is insufferable for a month."],fn:function(){addStat("happiness",4);tbBond(4,"you played along");tbMarkLifeSeen("tb_sig_chomei")}},
   {t:"Spend the coin on dumplings instead",res:["You buy dumplings for the kids watching. The beetle is briefly outraged, then concedes this also counts as luck. Distributed luck. It is still talking about it."],fn:function(){addStat("happiness",2);rep(2);tbBond(2,"kindness counts as luck");tbMarkLifeSeen("tb_sig_chomei")}}]}}};
TB_SIG.gyuki={w:3,build:function(){var b=tbBeast();
 return{t:"Forms Before Dawn",cat:"Tailed Beast",rar:"rare",loc:"The training yard",art:"\u{1F590}",
  lines:["You overslept. The beast did not. It has been awake inside you since the fourth bell, and its disappointment has a weight in tons.",
   {name:b.name,say:"The yard. Now. We will do the forms you skipped, all of them, and then we will discuss discipline as a concept."}],
  choices:[
   {t:"Do every form it names",res:["Two hours before anyone else arrives, an octopus-ox in your soul drills you into the ground and then, exactly once, says 'better'. It is the best compliment you have ever received."],fn:function(){addStat("taijutsu",2);addStat("discipline",2);tbBond(4,"you kept the schedule");tbMarkLifeSeen("tb_sig_gyuki")}},
   {t:"Skip it and face the lecture",res:["You go back to bed. The lecture that follows lasts three days and is somehow the most educational thing that has ever happened to you."],fn:function(){addStat("intelligence",1);tbBond(-1,"it noted the skipped forms, forever");tbMarkLifeSeen("tb_sig_gyuki")}}]}}};
TB_SIG.kurama={w:3,build:function(){var b=tbBeast();
 return{t:"The Mirror of Hate",cat:"Tailed Beast",rar:"rare",loc:"The memorial stone",art:"\u{1FA7A}",
  lines:["The anniversary. The whole village visits the memorial, and an old man spits at your feet and says out loud what most of them think: that the demon's cage should have been buried with the Fourth. Your hands shake, and it is not only rage.",
   {name:b.name,say:"He is right about one thing. I killed people he loved. Ask me if I am sorry. Ask me why you still defend me."}],
  choices:[
   {t:"Answer him without hating him back",res:["You tell the old man, evenly, that you did not choose this either, and that you will spend your life proving the cage does not decide who you are. He has no answer. Neither do you. You walk home lighter anyway."],fn:function(){rep(3);tbBond(7,"you refused to hate back");tbStab(4);tbMarkLifeSeen("tb_sig_kurama")}},
   {t:"Say nothing and carry it",res:["You bow your head and leave. The hate follows you home, yours and his and everyone's, and the oldest thing inside you watches you carry all of it and says nothing at all."],fn:function(){addStat("willpower",2);tbBond(3,"it saw you carry it");tbMarkLifeSeen("tb_sig_kurama")}},
   {t:"Let the anger answer for you",res:["Your chakra flares hard enough to crack the pavement. The old man staggers back white-faced. The street empties. You have won nothing and lost ground you will spend months recovering."],fn:function(){tbInf(6);tbStab(-6);rep(-4);tbBond(2,"it approved of the anger, which is the problem")}}]}}};

/* ---------- world events (non-hosts can meet the system) ---------- */
var TB_WE=[
 {id:"tb_w_rumor",w:4,build:function(){var w=tbWorld();var h=w.hosts.filter(function(x){return x.alive})[0];if(!h)return null;
   return{t:"Whispers About A Host",cat:"Tailed Beast",rar:"rare",loc:"The village",art:"\u{1F5E3}",
    lines:["The rumor arrives the way rumors do: sideways, at night, at the well. They say "+G.villageName+" keeps a jinchuriki. They say you can tell by the way the guards watch certain doors.",
     {name:"A market vendor",say:"Don't ask. Don't point. Some doors in this village you do not knock on."}],
    choices:[
     {t:"Ask around carefully",res:["You learn three true things and eleven false ones, and one look from a jonin that says you have learned enough."],fn:function(){addStat("intelligence",1);w.rumor++;tbMarkLifeSeen("tb_w_rumor")}},
     {t:"Let it lie",res:["You nod and move on. Curiosity has a body count and you would rather not be part of its math."],fn:function(){tbMarkLifeSeen("tb_w_rumor")}}]}}},
 {id:"tb_w_history",w:3,build:function(){var b=pick(BEASTS);
   return{t:"A Record Of The "+b.n+"-Tails",cat:"Tailed Beast",rar:"rare",loc:"The archive",art:"\u{1F4DC}",
    lines:["In the archive's oldest drawer you find a field report from before your parents were born: a host of the "+b.title+", described in dry official language that cannot hide the terror underneath. The last line is a name, and the name is crossed out.",
     {name:b.name,say:"..."}],
    choices:[
     {t:"Read every page",res:["You read it all. The host in the report saved four hundred people and was feared for the rest of their life. History is written by whoever survived writing it."],fn:function(){addStat("intelligence",2);tbMarkLifeSeen("tb_w_history")}},
     {t:"Put it back",res:["Some histories are heavy in the hands. You close the drawer and leave the past its privacy."],fn:function(){tbMarkLifeSeen("tb_w_history")}}]}}},
 {id:"tb_w_rampage",w:2,build:function(){var b=pick(BEASTS);
   return{t:"Rampage In The "+pick(["West","Border Lands","Northern Pass"]),cat:"Tailed Beast",rar:"major",loc:"World news",art:"\u{1F4F0}",
    lines:["News riders bring word: a village's jinchuriki broke containment. A "+b.title+" walked the border lands for a night and part of a day. Two settlements are gone. The beast was resealed at terrible cost.",
     {name:b.name,say:"..."}],
    choices:[
     {t:"Read the full casualty account",res:["You read it twice. Somewhere in the numbers is a lesson about what your village's own preparations are for."],fn:function(){addStat("intelligence",1);tbMarkLifeSeen("tb_w_rampage")}},
     {t:"Say a quiet word for the host",res:["Whoever wore that seal died twice: once as a person, once as a story. You light incense anyway."],fn:function(){addStat("happiness",-1);tbMarkLifeSeen("tb_w_rampage")}}]}}},
 {id:"tb_w_meet",w:3,build:function(){var w=tbWorld();var alive=w.hosts.filter(function(x){return x.alive});var h=alive[0];if(!h)return null;
   return{t:"You Meet A Host",cat:"Tailed Beast",rar:"major",loc:pick(["A joint exercise","The chunin exams","A diplomatic escort"]),art:"\u{1F91D}",
    lines:[""+h.name+" of another village: "+h.d+" You end up in the same waiting area, and for a moment you are close enough to feel it: a second heartbeat that belongs to something much larger.",
     {name:h.name,say:pick(["You felt that, didn't you. Everyone always does.","Don't stare. It's rude, and it makes it worse.","Relax. If I were going to eat anyone, it would be the judges."])}],
    choices:[
     {t:"Speak to them like a person",res:["You talk about the weather, then the exams, then nothing important at all. It is the most normal hour of your month, and one of the strangest. They remember you kindly."],fn:function(){h.met=true;addStat("happiness",2);tbMarkLifeSeen("tb_w_meet")}},
     {t:"Keep your distance",res:["You spend the hour studying the wall. Across the room, a jinchuriki with perfect hearing hears your heartbeat do exactly what everyone's does."],fn:function(){tbMarkLifeSeen("tb_w_meet")}}]}}},
 {id:"tb_w_sighting",w:2,build:function(){var b=pick(BEASTS);
   return{t:"A Sighting",cat:"Tailed Beast",rar:"rare",loc:"The mission field",art:"\u{1F52D}",
    lines:["On a night mission you see something the briefing did not mention: a shape against the moon, wrong in a way your eyes refuse at first. It could be a cloud. It could be the "+b.title+", moving between villages faster than any army.",
     {name:b.name,say:"..."}],
    choices:[
     {t:"Report it exactly",res:["Your report goes up the chain and changes a patrol schedule by morning. Accurate eyes save lives, even when the accuracy is unbelievable."],fn:function(){rep(1);tbMarkLifeSeen("tb_w_sighting")}},
     {t:"Tell no one",res:["Who would believe you? You keep the sighting in your chest like a stone. It changes how you look at the horizon forever."],fn:function(){addStat("perception",1);tbMarkLifeSeen("tb_w_sighting")}}]}}},
 {id:"tb_w_politics",w:2,build:function(){var w=tbWorld();
   return{t:"The Vessel Question",cat:"Tailed Beast",rar:"rare",loc:"Council chambers",art:"\u2696",
    lines:["The council debates for hours behind closed doors, and the argument leaks through the door seams: whether the village's host program protects the beast or the beast protects the village, and who pays when both answers are wrong.",
     {name:"A council aide",say:"You didn't hear any of this. Especially the part about cost."}],
    choices:[
     {t:"Listen at the door",res:["You hear one full argument about liability and legacy before you make the smart choice and leave. Politics, you learn, is just fear wearing robes."],fn:function(){addStat("intelligence",1);w.tension++;tbMarkLifeSeen("tb_w_politics")}},
     {t:"Walk away",res:["Some doors are best left unlistened. You go train instead, which is the same decision most shinobi make and better for the shoulders."],fn:function(){addStat("taijutsu",1);tbMarkLifeSeen("tb_w_politics")}}]}}},
 {id:"tb_w_capture",w:2,build:function(){var w=tbWorld();var alive=w.hosts.filter(function(x){return x.alive});var h=alive[0];if(!h)return null;
   return{t:"News Of "+h.name,cat:"Tailed Beast",rar:"major",loc:"World news",art:"\u{1F6A8}",
    lines:["The news reaches every corner of the shinobi world within days: "+h.name+", the "+B(h.beast).title+"'s host, "+pick(["has been taken by masked shinobi","has fallen in battle","has vanished from their village"])+". Every village with a seal and a fear has noticed.",
     {name:b_null_helper(h.beast),say:"..."}],
    choices:[
     {t:"Follow the story",res:["The aftermath reshapes treaties and patrol routes for a year. The world is smaller than it pretends, and heavier."],fn:function(){h.alive=false;w.tension+=2;addStat("intelligence",1);tbMarkLifeSeen("tb_w_capture")}},
     {t:"Let the world keep its own horrors",res:["You go about your life. The news follows you anyway, in the way adults glance at children who might one day be relevant."],fn:function(){h.alive=false;w.tension++;tbMarkLifeSeen("tb_w_capture")}}]}}},
 {id:"tb_w_lecture",w:2,build:function(){var b=pick(BEASTS);
   return{t:"The Nine Legends",cat:"Tailed Beast",rar:"rare",loc:"The academy",art:"\u{1F393}",
    lines:["An instructor lays out the nine legends on a wall chart: one tail through nine, each beast drawn in ink old enough to have opinions. The class is silent in a way children are silent about things that are real.",
     {name:"Academy instructor",say:"Nine beasts. Nine cages. Remember them all: the world you graduate into has all nine in it."}],
    choices:[
     {t:"Copy every name into your notes",res:["Shukaku. Matatabi. Isobu. Son Goku. Kokuo. Saiken. Chomei. Gyuki. Kurama. You will never forget a single one."],fn:function(){addStat("intelligence",1);tbMarkLifeSeen("tb_w_lecture")}},
     {t:"Ask what happens when a seal fails",res:["The room goes cold. The instructor answers honestly, which is worse than any lie: 'Everyone nearby finds out.'"],fn:function(){addStat("intelligence",1);addStat("happiness",-1);tbMarkLifeSeen("tb_w_lecture")}}]}}},
 {id:"tb_w_descendant",w:4,once:true,build:function(){var g=tbGlobal();if(!g.lastHost)return null;
   return{t:"The Village Remembers",cat:"Tailed Beast",rar:"major",loc:"Home",art:"\u{1F3E0}",
    lines:["Your family carries a memory the village never let go: "+g.lastHost.name+", who carried the "+g.lastHost.beast+" in "+g.lastHost.village+". Some neighbors still cross the street where your family walks. Others bring food without being asked, as if paying an old debt to the seal by feeding the seal's kin.",
     {name:"Your elder",say:"They fear us and they feed us. Both are true. Get used to holding two things."}],
    choices:[
     {t:"Ask for the full story",res:["You hear it all: the deeds, the fear, the night everything changed. It is a strange inheritance and it is yours now."],fn:function(){addStat("intelligence",1);addStat("willpower",1);tbMarkLifeSeen("tb_w_descendant")}},
     {t:"Carry it quietly",res:["You accept the weight without asking for the paperwork. Families like yours learn to do that early."],fn:function(){addStat("discipline",1);tbMarkLifeSeen("tb_w_descendant")}}]}}}
];
function b_null_helper(id){return B(id)?B(id).name:"The Beast"}
function tbPickWorld(){
  var bag=[];
  TB_WE.forEach(function(e){
    if(e.once&&tbLifeSeen(e.id))return;
    var ok=true;
    if(e.id==="tb_w_descendant")ok=!!tbGlobal().lastHost;
    if(e.id==="tb_w_lecture")ok=inAcademy();
    if(ok)bag.push([e,e.w])});
  if(!bag.length)return null;
  var e=weighted(bag);if(!e)return null;
  tbMarkLifeSeen(e.id);
  return function(){return e.build()}}

/* ---------- register per-beast signature events ---------- */
Object.keys(TB_SIG).forEach(function(bid){
  tbEv("tb_sig_"+bid,TB_SIG[bid].w,false,function(){return !!G.tb&&G.tb.b===bid},TB_SIG[bid].build)});

/* ---------- birth roll (called from beginLife) ---------- */
function tbBirthRoll(){
  if(!G||G.tb)return false;
  if(!chance(TB_CFG.birthChance))return false;
  var bid=tbPickBeastId();
  tbGive(bid,"born with the seal already in place");
  var b=B(bid);
  modal("The Weight You Were Born With","Tailed Beast","You were born in the middle of the night, in the worst hour of the worst storm "+G.villageName+" has seen in a decade. The midwife swears the thunder answered when you first cried. Your parents are told one true thing and one kind lie. The elders are told neither. Somewhere behind your newborn heartbeat, something enormous opens one eye.",
   [{t:"Begin",fn:function(){
     fbig("You are born already carrying the "+b.title+". The village does not know yet. It will.","big");
     tl(0,"Born as the jinchuriki of the "+b.title);G.tb.soonVoice=true}}]);
  return true}

/* ---------- UI: the Beast tab ---------- */
function tbBar(label,val,color){
  var row=el("div","tb-bar");
  row.appendChild(el("b",null,label));
  var tr=el("div","tb-track");var fill=el("div","tb-fill");
  fill.style.width=Math.round(clamp(val,0,100))+"%";fill.style.background=color;
  tr.appendChild(fill);row.appendChild(tr);
  row.appendChild(el("span",null,Math.round(val)+"%"));
  return row}

function renderBeast(){
  var v=$("#view-beast");if(!v)return;v.innerHTML="";
  var t=tbGet();
  if(!t){
    var p=panel("tailed beast","No beast sealed in you");
    p.appendChild(el("div","mtext","The nine legends walk the world, caged and carried by others. Very few lives are ever chosen. If one is ever sealed into you, everything about it will live here: its bond, its voice, its milestones, its history."));
    var g=tbGlobal();
    var found=(g.found||[]).length;
    p.appendChild(el("div","mtext","Legends you have encountered across your lives: "+found+" of 9."));
    /* world sightings */
    var w=tbWorld();
    var sp=panel("world sightings","The hosts of this era");
    if(!w.hosts.length)sp.appendChild(el("div","mtext","No host records yet."));
    else w.hosts.forEach(function(h){
      var row=el("div","list-row");var who=el("div","who");
      who.appendChild(el("b",null,(B(h.beast)?B(h.beast).emoji+" ":"")+h.name));
      who.appendChild(el("span",null,(B(h.beast)?B(h.beast).title:"")+" \u00B7 "+(h.vill||"")));
      row.appendChild(who);row.appendChild(el("span","who-r",h.rep||""));
      sp.appendChild(row)});
    p.appendChild(sp);
    v.appendChild(p);
    return}
  var b=tbBeast();
  var p=panel("tailed beast","Jinchuriki of the "+b.title);
  /* portrait */
  var port=el("div","tb-port");
  port.style.borderColor=b.color;
  port.appendChild(el("div","tb-emoji",b.emoji));
  var pt=el("div","tb-pname");
  pt.appendChild(el("h2","serif",b.name));
  pt.appendChild(el("div","tb-ptitle",b.title+" \u00B7 "+b.ele+" chakra"));
  port.appendChild(pt);
  p.appendChild(port);
  p.appendChild(el("div","mtext",b.temper));
  var fx=el("div","mtext");fx.style.opacity=".75";fx.textContent=b.fx.note;p.appendChild(fx);
  var q=el("div","tb-quote");q.style.borderColor=b.color;
  q.appendChild(el("b",null,tbTierName()+" \u00B7 bond "+Math.round(t.bond)));
  q.appendChild(el("p",null,b.lines[clamp(Math.floor(t.bond/10),0,b.lines.length-1)]));
  p.appendChild(q);
  /* bars */
  var bm=el("div","tb-bars");
  bm.appendChild(tbBar("Beast chakra access",t.chakra,b.color));
  bm.appendChild(tbBar("Bond",t.bond,b.color));
  bm.appendChild(tbBar("Seal stability",t.stab,t.stab<40?"#d4555f":"#3fb3a8"));
  bm.appendChild(tbBar("Beast influence",t.inf,t.inf>50?"#d4555f":"#8a8f98"));
  p.appendChild(bm);
  /* status line */
  var stat=el("div","mtext");
  stat.textContent="Host since age "+t.since+" ("+({born:"born with the seal",vol:"volunteered",inh:"inherited by consent",chose:"chosen by the beast"}[t.how]||t.how)+") \u00B7 "+(t.known===0?"the village does not know yet":t.known===1?"rumors are spreading":"the village knows what you carry");
  p.appendChild(stat);
  /* milestones */
  var mp=panel("progression","Milestones");
  TB_MS.forEach(function(name,i){
    var has=t.ms.indexOf(String(i))>=0;
    var row=el("div","list-row"+(has?" tb-done":""));
    var who=el("div","who");
    who.appendChild(el("b",null,(has?"\u2713 ":"\u25CB ")+name));
    who.appendChild(el("span",null,has?"unlocked":"locked"));
    row.appendChild(who);mp.appendChild(row)});
  p.appendChild(mp);
  /* history */
  var hp=panel("seal history","What has happened");
  if(!t.hist.length)hp.appendChild(el("div","mtext","Quiet so far. For a caged god, that is saying something."));
  else t.hist.slice(0,8).forEach(function(h){hp.appendChild(el("div","mtext","Age "+h.a+" \u00B7 "+h.x))});
  p.appendChild(hp);
  v.appendChild(p)}

/* ---------- character card chip ---------- */
function tbChipRow(){var t=tbGet();if(!t||!tbBeast())return null;
  return["Jinchuriki",tbBeast().name+" ("+tbBeast().title+") \u00B7 "+tbTierName()]}

/* ---------- nav ---------- */
(function(){var i=-1;for(var k=0;k<NAV.length;k++)if(NAV[k][0]==="clan")i=k;
  if(i>=0)NAV.splice(i+1,0,["beast","Beast","\u{1F98A}"])})();

/* ---------- export ---------- */
window.TAILED={ageTick:tbAgeTick,render:renderBeast,chipRow:tbChipRow,birthRoll:tbBirthRoll,give:tbGive};
