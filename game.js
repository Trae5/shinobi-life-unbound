/* Shinobi: Life Unbound (v2, Life & Legacy)
   A Naruto-universe life simulator. Vanilla JS, no dependencies. */
(function(){
"use strict";

/* ============================ utilities ============================ */
var D=document;
function $(id){return D.getElementById(String(id).replace(/^#/,""))}
function el(tag,cls,txt){if(typeof tag==="string"&&tag.charAt(0)==="#")return $(tag);var e=D.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function rnd(n){return Math.floor(Math.random()*n)}
function pick(a){return a[rnd(a.length)]}
function chance(p){return Math.random()<p}
function ri(a,b){return a+rnd(b-a+1)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function money(n){return Math.round(n||0).toLocaleString("en-US")+" ryō"}
function esc(s){return String(s==null?"":s)}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=rnd(i+1),t=a[i];a[i]=t;a[j]=t}return a}
function weighted(list){
  var tot=0,i;for(i=0;i<list.length;i++)tot+=list[i][1];
  var r=Math.random()*tot;
  for(i=0;i<list.length;i++){r-=list[i][1];if(r<=0)return list[i][0]}
  return list[list.length-1][0];
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function includes(a,v){return a.indexOf(v)>=0}

/* ============================ data: names ============================ */
var NAMES_M=["Akihito","Daichi","Daiki","Eiji","Fumio","Goro","Haru","Haruki","Hiroshi","Isamu","Jiro","Kaito","Kazuo","Kenji","Kenshin","Kichiro","Mamoru","Masaru","Michio","Noboru","Norio","Osamu","Raiden","Renjiro","Ryo","Ryota","Saburo","Shigeo","Shin","Sho","Sota","Takashi","Takeshi","Tatsuya","Tetsuo","Tobio","Tomio","Toshiro","Yasuo","Yohei","Yoshi","Yuji","Zen"];
var NAMES_F=["Aiko","Akemi","Chiyo","Cho","Emi","Eri","Fuyuko","Hana","Haruka","Hideko","Hikari","Hina","Hiroko","Izumi","Kaede","Kana","Kanna","Kasumi","Kazue","Keiko","Kiko","Kotone","Kyou","Mai","Mariko","Masami","Michi","Mika","Mitsuki","Miyo","Momo","Nanami","Naoko","Natsuki","Noriko","Rei","Riko","Rina","Rin","Sachiko","Sakura","Shiori","Sora","Suzu","Tamiko","Teruko","Tsukiko","Ume","Yui","Yuki","Yukiko","Yumi","Yuriko"];
var SURNAMES=["Aburame","Akimichi","Amagiri","Arashiyama","Fujimori","Fuma","Hagane","Haruno","Hatake","Hayashi","Higuma","Hoshigaki","Hyuga","Inari","Inazuma","Inuzuka","Ishikawa","Ito","Kagami","Kagemura","Kamizuru","Kanzaki","Karasuma","Kato","Kawaguchi","Kazamatsuri","Kirishima","Kobayashi","Kori","Kurama","Kurogane","Maeda","Maruboshi","Mibu","Mihara","Mizunoto","Mori","Nagare","Nara","Nishimura","Nozawa","Obata","Ogawa","Otake","Rikimaru","Saeki","Sagara","Saito","Sakamoto","Sarutobi","Sasagawa","Sato","Shimura","Shirakami","Shirogane","Suzumen","Tachibana","Takagi","Takeyama","Tamaru","Tanaka","Toriumi","Tsuchikawa","Tsukino","Uchiha","Ukai","Umegae","Utatane","Yakushi","Yamada","Yamanaka","Yoshino","Yuki","Yurinuki","Senju","Uzumaki"];

/* ============================ data: villages ============================ */
var VILLAGES={
  konoha:{name:"Konohagakure",label:"the Hidden Leaf",kan:"火",kage:"Hokage",academyAge:8},
  suna:{name:"Sunagakure",label:"the Hidden Sand",kan:"風",kage:"Kazekage",academyAge:9},
  kiri:{name:"Kirigakure",label:"the Hidden Mist",kan:"水",kage:"Mizukage",academyAge:9},
  kumo:{name:"Kumogakure",label:"the Hidden Cloud",kan:"雷",kage:"Raikage",academyAge:9},
  iwa:{name:"Iwagakure",label:"the Hidden Stone",kan:"土",kage:"Tsuchikage",academyAge:9},
  ame:{name:"Amegakure",label:"the Hidden Rain",kan:"雨",kage:"Amekage",academyAge:9},
  oto:{name:"Otogakure",label:"the Hidden Sound",kan:"音",kage:"Otokage",academyAge:9}
};

/* ============================ data: clans & bloodlines (v2 overhaul) ============================
   r: common | uncommon | rare | epic | legendary | mythical | secret
   pas: {n, d, flat:{stat:bonus} applied once via st() layer, rel:{...} relative modifiers read live}
   ab: flavor list of clan abilities; techniques live in JUTSU with cat:"Clan".
   secret:true clans never appear in the normal roll pool. */
var CLANS=[
 {n:"Otsutsuki",r:"mythical",spec:"Celestial · Chakra",kg:null,v:null,secret:false,
  d:"A name that predates the villages themselves. Blood this old is not supposed to walk the earth again, and yet here you are.",
  hist:"Your grandmother speaks a language no scholar can place, and the shrine carvings match your family crest exactly.",
  pas:{n:"Celestial Blood",d:"Greatly increased chakra capacity, improved chakra control, faster ability progression, access to unique celestial events.",
   flat:{chakra:16,chakraControl:8,willpower:6},
   rel:{train:{chakra:.3,chakraControl:.25},jutsu:.25,exam:4},
   trig:"chakra"}},
 {n:"Hagoromo",r:"mythical",spec:"Sage Arts · Spirit",kg:null,v:null,secret:false,
  d:"The Sage's name survives in scripture and stone. Your family carries it in blood, and the weight of both.",
  hist:"Pilgrims once stopped at your family's door to be blessed. Your parents stopped telling them to go away.",
  pas:{n:"Sage Legacy",d:"Improved chakra control, faster technique mastery, bonus spiritual stats, unique sage progression events.",
   flat:{chakraControl:9,intelligence:6,willpower:8},
   rel:{jutsu:.3,train:{chakraControl:.25,intelligence:.15},resist:.08},
   trig:"spirit"}},
 {n:"Senju",r:"mythical",spec:"Wood Release · Vitality",kg:"Wood Release",v:"konoha",
  d:"The clan that founded the Leaf. Its direct line was thought gone for a generation.",
  hist:"Elders still bow when your family name is spoken.",
  pas:{n:"Vital Force",d:"Increased health, chakra reserves and stamina, improved recovery, bonus vitality progression.",
   flat:{health:14,chakra:12,endurance:8},
   rel:{train:{health:.2,chakra:.2,endurance:.2},recovery:.3,resist:.1},
   trig:"recovery"}},
 {n:"Uchiha",r:"legendary",spec:"Fire · Genjutsu",kg:"Sharingan",v:"konoha",
  d:"The village's most feared name since the massacre-in-waiting. Their eyes see through lies and copy what they witness.",
  hist:"Your family keeps its fan crest covered in public.",
  pas:{n:"Eyes of Insight",d:"Improved combat awareness, faster reaction and technique mastery, exclusive Sharingan progression and awakening events.",
   flat:{perception:8,genjutsu:7,ninjutsu:5},
   rel:{jutsu:.2,train:{perception:.2,genjutsu:.25},exam:3},
   trig:"combat"}},
 {n:"Hyuga",r:"legendary",spec:"Gentle Fist · Perception",kg:"Byakugan",v:"konoha",
  d:"The oldest pure bloodline in the Leaf, split between main house and branch, bound by the Caged Bird seal.",
  hist:"You were born into the branch house's quiet discipline.",
  pas:{n:"Gentle Vision",d:"Increased perception, improved precision and chakra control, exclusive Byakugan progression.",
   flat:{perception:9,chakraControl:7,taijutsu:5},
   rel:{train:{perception:.25,taijutsu:.15},track:.2,exam:2},
   trig:"precision"}},
 {n:"Uzumaki",r:"legendary",spec:"Sealing Arts · Endurance",kg:null,v:null,
  d:"Red-haired survivors of a drowned village, famous for enormous life force and fūinjutsu.",
  hist:"Your mother's red hair turns heads in the market.",
  pas:{n:"Adamantine Vitality",d:"Massive chakra reserves, increased stamina and vitality, improved recovery, improved sealing technique mastery.",
   flat:{chakra:14,endurance:9,health:8,willpower:5},
   rel:{train:{endurance:.2,chakra:.2},recovery:.35,resist:.12},
   trig:"recovery"},
  ab:["Chakra Pull","Adamantine Sealing Chains","Enhanced Vitality"]},
 {n:"Kaguya",r:"legendary",spec:"Shikotsumyaku",kg:"Dead Bone Pulse",v:"kiri",
  d:"A violent, nearly extinct bloodline of bone dancers. The village tolerates what it cannot tame.",
  hist:"You were told never to bleed in public.",
  pas:{n:"Bone Bloodline",d:"Increased physical durability and power, unique bone-based bloodline progression, exclusive awakening events.",
   flat:{health:10,strength:8,endurance:6},
   rel:{train:{strength:.25,endurance:.2},resist:.1},
   trig:"bone"}},
 {n:"Chinoike",r:"legendary",spec:"Ketsuryūgan · Sight",kg:"Ketsuryūgan",v:null,
  d:"Exiled twice over, a bloodline whose eyes once booby-trapped a valley. The world prefers to remember them as a story.",
  hist:"Your family moved in the night more than once. Nobody asks why anymore.",
  pas:{n:"Bloodline Sight",d:"Improved perception and genjutsu resistance, unique bloodline progression, exclusive clan events.",
   flat:{perception:8,genjutsu:6,intelligence:4},
   rel:{train:{perception:.2,genjutsu:.2},resist:.12,exam:2},
   trig:"sight"}},
 {n:"Jugo",r:"legendary",spec:"Sage Transformation",kg:null,v:null,
  d:"A clan whose bodies drink natural energy and sometimes cannot stop. The curse and the gift wear the same face.",
  hist:"Your family lives far from the main roads, by choice and by warning.",
  pas:{n:"Natural Assimilation",d:"Gains natural energy over time, special awakening progression, increased power during surge events, unique transformation-related events.",
   flat:{strength:9,endurance:8,health:6},
   rel:{train:{strength:.2,endurance:.2},recovery:.15,resist:.08},
   trig:"surge"}},
 {n:"Sarutobi",r:"epic",spec:"All-rounder · Willpower",kg:null,v:"konoha",
  d:"A clan of strong-willed shinobi with deep ties to the village leadership, called the fire of the Leaf.",
  hist:"Your grandfather served the second Hokage directly.",
  pas:{n:"Will of Fire",d:"Bonus elemental mastery, faster technique learning, improved training progression.",
   flat:{willpower:6,ninjutsu:5,intelligence:4},
   rel:{train:{ninjutsu:.2},jutsu:.2,exam:3},
   trig:"training"}},
 {n:"Kurama",r:"epic",spec:"Genjutsu Mastery",kg:null,v:"konoha",
  d:"A small clan whose genjutsu once shook nations. Their power burns minds, including their own.",
  hist:"Your aunt paints scenes no one else can see, and they are always real.",
  pas:{n:"Illusion Prodigy",d:"Stronger genjutsu progression, improved illusion resistance, bonus mental stats.",
   flat:{genjutsu:8,intelligence:5,perception:3},
   rel:{train:{genjutsu:.3},resist:.12,exam:2},
   trig:"illusion"}},
 {n:"Hatake",r:"epic",spec:"Kenjutsu · Speed",kg:null,v:"konoha",
  d:"A legacy of white-fanged shinobi. The name still carries weight and a white scabbard.",
  hist:"A white chokutō hangs above the family shrine.",
  pas:{n:"White Fang Talent",d:"Increased speed, faster mastery, improved combat adaptability.",
   flat:{speed:7,kenjutsu:6,agility:4},
   rel:{train:{speed:.2,kenjutsu:.25},jutsu:.15},
   trig:"blade"}},
 {n:"Yuki",r:"epic",spec:"Ice Release",kg:"Ice Release",v:"kiri",
  d:"Ice-release carriers, once hunted in the Mist. They keep their kekkei genkai quiet.",
  hist:"Your family never talks about why they moved to the coast.",
  pas:{n:"Ice Blood",d:"Improved ice affinity, increased elemental control, unique ice techniques.",
   flat:{ninjutsu:6,chakraControl:5,endurance:3},
   rel:{train:{ninjutsu:.25,chakraControl:.15},resist:.06},
   trig:"ice"}},
 {n:"Terumi",r:"epic",spec:"Lava & Boil Release",kg:"Lava Release",v:"kiri",
  d:"Lava and boil release run in this flashy Mist line, alongside theatrical confidence.",
  hist:"Your family hosts the loudest festivals on the coast.",
  pas:{n:"Elemental Fusion",d:"Improved elemental damage, faster hybrid-element mastery, unique elemental progression.",
   flat:{ninjutsu:7,chakra:5,confidence:4},
   rel:{train:{ninjutsu:.25},jutsu:.15},
   trig:"element"}},
 {n:"Hoshigaki",r:"epic",spec:"Shark Arts · Strength",kg:null,v:"kiri",
  d:"Saw-toothed sharks of the Mist coastline. Samehada's previous wielders came from here.",
  hist:"Your father's teeth are filed to points. Yours will be too, in time.",
  pas:{n:"Aquatic Adaptation",d:"Increased stamina, improved water affinity, better recovery.",
   flat:{endurance:7,strength:5,ninjutsu:3},
   rel:{train:{endurance:.2},recovery:.2},
   trig:"water"}},
 {n:"Darui",r:"epic",spec:"Storm Release",kg:"Storm Release",v:"kumo",
  d:"Storm-release carriers with a talent for deadpan loyalty and black lightning.",
  hist:"Your father can split raindrops with a finger beam. He does parties.",
  pas:{n:"Storm Talent",d:"Lightning mastery, improved elemental efficiency, unique storm-style progression.",
   flat:{ninjutsu:7,speed:4,chakra:4},
   rel:{train:{ninjutsu:.25,speed:.1},jutsu:.1},
   trig:"storm"}},
 {n:"Iburi",r:"epic",spec:"Smoke Body",kg:null,v:null,
  d:"A clan that lived in caves and learned to become the smoke their fires made. Soldiers still fear fog because of them.",
  hist:"Your family never lights a fire without closing the flue first.",
  pas:{n:"Smoke Body",d:"Improved evasion, smoke-based abilities, unique clan progression.",
   flat:{agility:7,speed:4,perception:3},
   rel:{train:{agility:.25},evade:.15},
   trig:"smoke"}},
 {n:"Tsuchigumo",r:"epic",spec:"Forbidden Arts · Barriers",kg:null,v:null,
  d:"Keepers of a barrier technique the great villages would pay wars to own. The family pretends to be farmers.",
  hist:"The cellar door stays locked, and the cellar stays full.",
  pas:{n:"Forbidden Art",d:"Improved barrier mastery, bonus technique power, exclusive clan events.",
   flat:{chakra:6,intelligence:5,chakraControl:4},
   rel:{train:{chakraControl:.2},jutsu:.2,exam:2},
   trig:"barrier"}},
 {n:"Nara",r:"rare",spec:"Shadow Arts · Strategy",kg:null,v:"konoha",
  d:"Lazy geniuses who tend deer and shadow techniques, and solve every problem with the least effort possible.",
  hist:"The family deer pen is older than the village walls.",
  pas:{n:"Strategic Mind",d:"Increased intelligence, better outcomes in strategy-based events, faster planning progression.",
   flat:{intelligence:6,patience:4},
   rel:{train:{intelligence:.2},exam:4,mission:2},
   trig:"strategy"}},
 {n:"Akimichi",r:"rare",spec:"Body Expansion · Strength",kg:null,v:"konoha",
  d:"Big appetites, bigger bodies, and secret calorie-control techniques passed down three generations.",
  hist:"Dinner at your house feeds twelve and there are four of you.",
  pas:{n:"Powerful Build",d:"Increased health, strength and stamina.",
   flat:{health:7,strength:6,endurance:5},
   rel:{train:{strength:.2,endurance:.15}},
   trig:"bulk"}},
 {n:"Yamanaka",r:"rare",spec:"Mind Arts · Sensory",kg:null,v:"konoha",
  d:"Florists by day, mind-walkers by trade. Their shop has served the village for sixty years.",
  hist:"The flower shop is the family front and the family pride.",
  pas:{n:"Mind Arts",d:"Increased mental stats, better social influence, genjutsu resistance.",
   flat:{intelligence:5,confidence:5,chakraControl:3},
   rel:{social:.15,resist:.1,exam:2},
   trig:"mind"}},
 {n:"Aburame",r:"rare",spec:"Kikaichū · Tracking",kg:null,v:"konoha",
  d:"Quiet hosts of living insects. Few words, many kikaichū, unbreakable contracts.",
  hist:"At your naming ceremony, beetles were given a home in your skin.",
  pas:{n:"Colony Bond",d:"Improved tracking and detection, bonus success chances for tracking missions.",
   flat:{perception:5,intelligence:3,endurance:3},
   rel:{track:.3,mission:1,per:.1},
   trig:"hive"}},
 {n:"Inuzuka",r:"rare",spec:"Ninken · Tracking",kg:null,v:"konoha",
  d:"Loud, loyal, and always smelling faintly of dog. Every child is paired with a ninja hound at six.",
  hist:"Your puppy sleeps in your bed and guards your socks.",
  pas:{n:"Beast Instinct",d:"Increased speed, improved tracking, increased awareness.",
   flat:{speed:6,agility:4,perception:4},
   rel:{track:.2,train:{speed:.15},per:.1},
   trig:"beast"}},
 {n:"Hozuki",r:"rare",spec:"Hydrification",kg:null,v:"kiri",
  d:"Mist shinobi who can turn their bodies to water and carry swords in gourds.",
  hist:"Family legend says a great-grandfather was executed with a oiled gourd on his back.",
  pas:{n:"Liquid Body",d:"Improved evasion, resistance to physical status effects, unique clan ability progression.",
   flat:{agility:5,chakraControl:4,endurance:4},
   rel:{evade:.15,resist:.12,jutsu:.1},
   trig:"water"}},
 {n:"Yotsuki",r:"rare",spec:"Lightning · Endurance",kg:null,v:"kumo",
  d:"Cloud-country mountain folk who never sell out their allies, at any price.",
  hist:"The family motto is stitched inside every jacket: never sell out.",
  pas:{n:"Thunder Body",d:"Lightning affinity, increased speed, bonus stamina.",
   flat:{speed:5,endurance:5,strength:3},
   rel:{train:{speed:.15,endurance:.15}},
   trig:"storm"}},
 {n:"Kamizuru",r:"rare",spec:"Bee Arts",kg:null,v:"iwa",
  d:"Bee-keepers of the Stone, old rivals of a certain Leaf clan that kept beetles instead.",
  hist:"The hives behind the house hum through every season.",
  pas:{n:"Hive Mastery",d:"Improved scouting and tracking, bonus sensory abilities.",
   flat:{perception:5,chakraControl:3,intelligence:3},
   rel:{track:.25,per:.12},
   trig:"hive"}},
 {n:"Kedoin",r:"rare",spec:"Copy Technique",kg:null,v:"suna",
  d:"Desert wanderers said to mimic any jutsu they see once. Proof is thin; pride is not.",
  hist:"Your grandmother insists she once copied a Kage's technique. Once.",
  pas:{n:"Mind Guard",d:"Increased mental resistance, improved concentration, reduced negative mental effects.",
   flat:{willpower:5,discipline:4,intelligence:3},
   rel:{resist:.15,exam:2},
   trig:"mind"}},
 {n:"Fuma",r:"rare",spec:"Shurikenjutsu · Wind",kg:null,v:"konoha",
  d:"A widespread clan of shuriken specialists scattered across the land of Fire, with old wind in their wrists.",
  hist:"Your uncle claims the clan once served a daimyō. Nobody can prove it.",
  pas:{n:"Windborn",d:"Increased agility and speed, wind affinity bonus.",
   flat:{agility:5,speed:5,kenjutsu:2},
   rel:{train:{agility:.2,speed:.15}},
   trig:"wind"}},
 {n:"Sasori",r:"rare",spec:"Puppet Genius · Poison",kg:null,v:"suna",
  d:"A bloodline of genius puppeteers and quiet tinkerers. Their workshops smell of lacquer and oil.",
  hist:"The workshop door has thirty locks and your family knows twenty-nine.",
  pas:{n:"Puppet Prodigy",d:"Faster technical mastery, increased crafting and engineering progression, bonus intelligence.",
   flat:{intelligence:5,chakraControl:4,discipline:3},
   rel:{jutsu:.2,train:{intelligence:.15,chakraControl:.15}},
   trig:"craft"}},
 {n:"Onikuma",r:"rare",spec:"Bear Strength",kg:null,v:null,
  d:"Mountain stock from the bear roads: broad backs, heavy hands, and a stare that ends arguments.",
  hist:"Your family wrestles at every festival and wins at most of them.",
  pas:{n:"Heavy Presence",d:"Increased health and strength, improved intimidation and physical progression.",
   flat:{health:6,strength:6,confidence:3},
   rel:{train:{strength:.2,health:.15}},
   trig:"bulk"}},
 {n:"Hoki",r:"rare",spec:"Scholarship · Speed",kg:null,v:null,
  d:"A sharp-minded clan of tacticians and quick studies that produces academy stars a generation at a time.",
  hist:"Your family keeps every report card since the village was founded.",
  pas:{n:"Sharp Mind",d:"Increased intelligence, faster academy progression, improved skill learning.",
   flat:{intelligence:6,discipline:4},
   rel:{exam:4,jutsu:.15,train:{intelligence:.15}},
   trig:"mind"}},
 {n:"Kohaku",r:"rare",spec:"Clear Spirit",kg:null,v:null,
  d:"A steady-blooded clan with old shrine duties. Their chakra runs smooth as lake water.",
  hist:"Your family still sweeps the shrine steps before dawn.",
  pas:{n:"Clear Spirit",d:"Improved chakra control, better resistance to negative events, improved concentration.",
   flat:{chakraControl:6,willpower:4,patience:3},
   rel:{resist:.15,exam:2,train:{chakraControl:.15}},
   trig:"spirit"}},
 {n:"Izuno",r:"rare",spec:"Scroll Arts · Fortune",kg:null,v:"konoha",
  d:"Keepers of the dragon-blaze scroll and a talent for finding rare techniques in odd places.",
  hist:"The family vault holds a scroll that hums when the moon is wrong.",
  pas:{n:"Mystic Talent",d:"Improved rare-technique discovery, bonus chakra efficiency, increased special ability progression.",
   flat:{chakraControl:5,intelligence:4,luck:2},
   rel:{jutsu:.2,exam:2},
   trig:"mystic"}},
 {n:"Fujimori",r:"uncommon",spec:"Barrier Arts",kg:null,v:null,
  d:"Wisteria farmers with a flair for barrier basics and patient hands.",
  hist:"The wisteria trellis out back is a training tool, not decoration.",
  pas:{n:"Natural Talent",d:"Slightly faster learning across the board.",
   flat:{intelligence:3,discipline:2},
   rel:{jutsu:.1,train:{all:.08}},
   trig:"training"}},
 {n:"Yotsuya",r:"uncommon",spec:"Puppetry",kg:null,v:"suna",
  d:"Sand-country scholars turned puppeteers, keeping three workshops in the artisan quarter.",
  hist:"Your first toy was a one-armed marionette.",
  pas:{n:"Adaptable",d:"A small permanent boost to two stats fate favors in you.",
   flat:{luck:2},
   rel:{train:{all:.1},resist:.05},
   trig:"fortune"}},
 {n:"Ishikawa",r:"uncommon",spec:"Earth Release",kg:null,v:"iwa",
  d:"Stone-country quarriers with earth-release in their bones and dust in everything.",
  hist:"Your family carved the tunnel under the west gate.",
  pas:{n:"Hard Worker",d:"Bonus training experience from every session.",
   flat:{endurance:4,discipline:3},
   rel:{train:{all:.12}},
   trig:"training"}},
 {n:"Amagiri",r:"uncommon",spec:"Wind · Scouting",kg:null,v:null,
  d:"A minor rain-country family of scouts and couriers, scattered across three villages.",
  hist:"Your relatives write letters from three different countries.",
  pas:{n:"Quick Recovery",d:"Improved recovery after exhausting events.",
   flat:{agility:3,endurance:2},
   rel:{recovery:.25,resist:.05},
   trig:"recovery"}},
 {n:"Kurosawa",r:"uncommon",spec:"Administration",kg:null,v:null,
  d:"Ink-makers and ledger keepers for the village administration. Respectable, unglamorous, essential.",
  hist:"Your father can smell a forged seal from across a room.",
  pas:{n:"Disciplined",d:"Reduced training failure chances, improved skill progression.",
   flat:{discipline:4,intelligence:2},
   rel:{resist:.08,train:{discipline:.15,intelligence:.1},jutsu:.1},
   trig:"training"}},
 {n:"Tachibana",r:"uncommon",spec:"Endurance · Society",kg:null,v:null,
  d:"Bathhouse owners with surprisingly sturdy constitutions and endless gossip.",
  hist:"You grew up hauling water before sunrise.",
  pas:{n:"Social Grace",d:"Increased reputation gains, improved relationship progression.",
   flat:{confidence:3,compassion:3,endurance:2},
   rel:{rep:.2,social:.15},
   trig:"social"}},
 {n:"Shirakami",r:"uncommon",spec:"Scholarship",kg:null,v:null,
  d:"A bookish family of archivists and part-time exorcists of small hauntings.",
  hist:"The family library holds one scroll nobody is allowed to open.",
  pas:{n:"Focused Spirit",d:"Improved concentration, faster technique learning.",
   flat:{willpower:3,intelligence:3,chakraControl:2},
   rel:{jutsu:.15,exam:2},
   trig:"spirit"}},
 {n:"Lee",r:"uncommon",spec:"Taijutsu",kg:null,v:"konoha",
  d:"No bloodline limit, no shortcuts: a clan that treats hard work itself as the family technique.",
  hist:"Your family trains before the sun and considers that sleeping in.",
  pas:{n:"Taijutsu Discipline",d:"Bonus physical training, faster physical stat progression, improved taijutsu mastery.",
   flat:{taijutsu:5,strength:3,speed:3},
   rel:{train:{taijutsu:.3,strength:.2,speed:.2}},
   trig:"training"}},
 {n:"Ryu",r:"uncommon",spec:"Dragon Spirit",kg:null,v:null,
  d:"A scattered clan that claims descent from a river dragon. The records are thin. The stubbornness is not.",
  hist:"Your family never walks away from anything, which has been good and terrible.",
  pas:{n:"Dragon Spirit",d:"Increased determination, bonus mastery to one nature, unique rare clan events.",
   flat:{willpower:4,ambition:3},
   rel:{jutsu:.12,train:{all:.08},resist:.06},
   trig:"spirit"}},
 {n:"Shimura",r:"common",spec:"Wind Release · Discipline",kg:null,v:"konoha",
  d:"An old founding family of strict teachers and council loyalists.",
  hist:"Family dinners begin with the village oath.",
  pas:{n:"Iron Discipline",d:"Increased discipline, reduced training failure chances. Small, real, and always there.",
   flat:{discipline:4,endurance:2},
   rel:{resist:.08,train:{discipline:.12}},
   trig:"training"}},
 {n:"Vex",r:"secret",spec:"The Void",kg:null,v:null,secret:true,
  d:"Not a clan so much as a debt the world owes something older than it. Those who carry the name do not dream ordinary dreams.",
  hist:"The record of your family begins with a page torn out of every archive that ever held it.",
  pas:{n:"Voidborn",d:"Exclusive progression path, unique scaling bonuses, special events, exclusive abilities and awakenings.",
   flat:{chakra:10,willpower:8,perception:6},
   rel:{jutsu:.3,train:{all:.15},resist:.15},
   trig:"void"}},
 {n:"Rin",r:"secret",spec:"Primordial Blood",kg:null,v:null,secret:true,
  d:"The oldest blood in the register, older than the Sage's scriptures. It wakes slowly, and it never stops growing.",
  hist:"Your family tree has a gap in it shaped like a hundred years.",
  pas:{n:"Primordial Blood",d:"Exclusive awakening progression, extremely high potential, unique events, exclusive abilities, special evolution system.",
   flat:{chakra:12,chakraControl:8,potential:2,endurance:6},
   rel:{jutsu:.3,train:{all:.15},recovery:.25,resist:.12},
   trig:"primordial"}}
];

var CIV_BGS=[
  "Your family runs a small teahouse near the market.",
  "Your parents are farmers on the village's outer terraces.",
  "Your father repairs boats; your mother mends nets.",
  "Your family runs the village bathhouse.",
  "Your parents sell pickles, medicine and gossip from a single stall.",
  "Your family keeps the shrine's grounds and its accounts.",
  "Your father is a carpenter with a reputation for honest joints.",
  "Your mother is a midwife who has caught half the village.",
  "Your family runs a noodle stand famous two streets over.",
  "Your parents work the dye-works and come home blue to the elbows."
];
var SHINOBI_HIST=[
  "Your parents met on a joint mission and never quite stopped arguing about whose plan saved whom.",
  "Your father retired early after an injury nobody discusses; your mother still takes escort contracts.",
  "Your family has served the village since its founding, in unglamorous posts nobody writes songs about.",
  "Your parents were genin teammates who married the year they made chunin.",
  "Your grandmother was a famous kunoichi; her stories are banned at dinner for being unbelievable.",
  "Your family keeps a shrine to a teammate who never came home."
];
var KKG={
  "Sharingan":{clans:["Uchiha"],minAge:8,minPot:7,boost:{genjutsu:8,perception:8,ninjutsu:4},desc:"A red wheel that sees chakra and copies technique."},
  "Byakugan":{clans:["Hyuga"],minAge:5,minPot:4,boost:{perception:10,taijutsu:5},desc:"Pale, all-seeing eyes with near-360° vision."},
  "Wood Release":{clans:["Senju"],minAge:10,minPot:9,boost:{ninjutsu:10,chakra:8},desc:"The First Hokage's forest-making power, thought lost."},
  "Ice Release":{clans:["Yuki"],minAge:9,minPot:6,boost:{ninjutsu:8,chakraControl:5},desc:"Yuki-hiding ice that freezes a battlefield solid."},
  "Dead Bone Pulse":{clans:["Kaguya"],minAge:8,minPot:6,boost:{taijutsu:10,endurance:6},desc:"Bones harder than steel, drawn from the body as weapons."},
  "Lava Release":{clans:["Terumi"],minAge:10,minPot:7,boost:{ninjutsu:8,endurance:4},desc:"Molten rock and scalding mist."},
  "Storm Release":{clans:["Darui"],minAge:10,minPot:7,boost:{ninjutsu:8,speed:4},desc:"Laser-like beams of charged light."},
  "Explosion Release":{clans:[],minAge:12,minPot:7,boost:{ninjutsu:6,strength:4},desc:"Chakra that detonates on contact."},
  "Magnet Release":{clans:[],minAge:12,minPot:7,boost:{ninjutsu:6,perception:4},desc:"Iron sand and floating weapons."},
  "Boil Release":{clans:[],minAge:12,minPot:7,boost:{ninjutsu:6,endurance:4},desc:"Corrosive acid mist."},
  "Ketsuryūgan":{clans:["Chinoike"],minAge:8,minPot:6,boost:{perception:8,genjutsu:7},desc:"Crimson eyes that hypnotize the living and detonate chakra in earth and air."}
};

/* ============================ data: eras ============================ */
var ERAS=[
  {id:"warring",name:"Warring States Period",d:"Clan fights clan across burning fields. There are no villages yet, only bargains and blades.",war:.16,cameos:["Hashirama Senju","Madara Uchiha","Tobirama Senju","Mito Uzumaki"],academy:false},
  {id:"founding",name:"Founding of the Hidden Villages",d:"Hashirama's dream takes shape. The first academy opens its doors; the world holds its breath.",war:.06,cameos:["Hashirama Senju","Madara Uchiha","Tobirama Senju","Mito Uzumaki"],academy:true},
  {id:"early",name:"Early Village Era",d:"The villages grow fat and proud. Tailed beasts are traded like coin. Treaties blur into ambition.",war:.08,cameos:["The First Hokage's students","Kagami Uchiha","Danzo Shimura","Hiruzen Sarutobi"],academy:true},
  {id:"gw1",name:"First Great Ninja War",d:"The first of the great fires. Entire classes graduate early and march east.",war:.14,cameos:["Hiruzen Sarutobi","Danzo Shimura","Tobirama Senju"],academy:true},
  {id:"sw2",name:"Second Great Ninja War",d:"Hanzō rules the rain; the sannin are born in its acid fog. Children grow up fast.",war:.13,cameos:["Jiraiya","Tsunade","Orochimaru","Hanzō of the Salamander","Chiyo"],academy:true},
  {id:"sw3",name:"Third Great Ninja War",d:"Sakumo's shame, Minato's rise, and a war that eats a generation.",war:.13,cameos:["Minato Namikaze","Kushina Uzumaki","Sakumo Hatake","Fugaku Uchiha","A (the future Raikage)"],academy:true},
  {id:"kyubi",name:"Nine-Tails Attack Era",d:"A fox with nine tails broke the Leaf's night once. Everyone remembers where they stood.",war:.05,cameos:["Kakashi Hatake","Might Guy","Kurenai Yuhi","Asuma Sarutobi","Iruka Umino","Hiruzen Sarutobi"],academy:true},
  {id:"naruto",name:"Original Naruto Era",d:"A dead-last in orange won't stay quiet. Chunin exam fever and a sleeping Akatsuki.",war:.05,cameos:["Naruto Uzumaki","Sasuke Uchiha","Sakura Haruno","Kakashi Hatake","Iruka Umino","Rock Lee","Hinata Hyuga"],academy:true},
  {id:"shippuden",name:"Shippuden Era",d:"The Akatsuki move in the open. Sasuke defects; the nations brace for war.",war:.09,cameos:["Naruto Uzumaki","Sasuke Uchiha","Sakura Haruno","Kakashi Hatake","Jiraiya","Tsunade","Shikamaru Nara"],academy:true},
  {id:"postwar",name:"Postwar Era",d:"After the Fourth War, the five villages actually talk to each other. Rebuilding is the new mission.",war:.02,cameos:["Naruto Uzumaki","Sakura Haruno","Kakashi Hatake","Shikamaru Nara","Hinata Hyuga"],academy:true},
  {id:"boruto",name:"Boruto Era",d:"Thunder rail, laptops in the academy, and peace so quiet it itches.",war:.02,cameos:["Naruto Uzumaki","Sasuke Uchiha","Sakura Haruno","Shikamaru Nara","Kakashi Hatake","Rock Lee"],academy:true}
];

/* ============================ data: personality & natures ============================ */
var PERSONALITIES=[
  {n:"Brash",f:{risk:2,discipline:-1},d:"acts first, thinks later"},
  {n:"Calm",f:{discipline:2,patience:2,risk:-1},d:"slow to anger, hard to rush"},
  {n:"Cunning",f:{intelligence:2,risk:1},d:"always three moves ahead"},
  {n:"Gloomy",f:{happiness:-2,intelligence:1},d:"sees the rain in everything"},
  {n:"Hot-blooded",f:{strength:1,risk:2,ambition:1,aggression:2},d:"burns twice as bright, twice as fast"},
  {n:"Kind",f:{loyalty:2,happiness:1,compassion:3},d:"loved by most, underestimated by some"},
  {n:"Lazy",f:{discipline:-2,luck:1},d:"works half as hard, twice as lucky"},
  {n:"Loner",f:{risk:1,loyalty:-1,confidence:-1},d:"keeps their own counsel"},
  {n:"Stoic",f:{discipline:2,happiness:-1,willpower:2},d:"a face like a stone wall"},
  {n:"Ambitious",f:{ambition:3,loyalty:-1},d:"climbs, whatever the cost"},
  {n:"Playful",f:{happiness:2,discipline:-1},d:"a prankster's heart"},
  {n:"Devoted",f:{loyalty:3,ambition:-1,compassion:2},d:"family and village above self"},
  {n:"Fearless",f:{confidence:3,risk:2},d:"has never met a cliff they didn't jump off"},
  {n:"Gentle",f:{aggression:-2,compassion:2},d:"strong hands, softer heart"}
];
var NATURES=["Fire","Wind","Lightning","Earth","Water"];
var NATURE_JUTSU={
  Fire:["Great Fireball","Phoenix Fire","Flame Bullet"],
  Wind:["Wind Blade","Vacuum Palm","Cyclone Kick"],
  Lightning:["Lightning Bolt","Chidori Stream","Thunder Palm"],
  Earth:["Earth Wall","Mud Slides","Stone Fist"],
  Water:["Water Bullet","Water Prison","Mist Veil"]
};

/* ============================ data: jutsu catalog ============================ */
/* tiers: 1 academy, 2 chunin-level, 3 jonin-level */
var JUTSU=[
  {id:"clone",n:"Clone Technique",cat:"Ninjutsu",tier:1,req:{ninjutsu:25},masteryMax:2},
  {id:"transform",n:"Transformation Technique",cat:"Ninjutsu",tier:1,req:{ninjutsu:25},masteryMax:2},
  {id:"substitute",n:"Substitution Jutsu",cat:"Ninjutsu",tier:1,req:{agility:30},masteryMax:2},
  {id:"leafstick",n:"Leaf Sticking Exercise",cat:"Chakra Control",tier:1,req:{chakraControl:15},masteryMax:1},
  {id:"treewalk",n:"Tree Walking Exercise",cat:"Chakra Control",tier:2,req:{chakraControl:45},masteryMax:2},
  {id:"waterwalk",n:"Water Walking Exercise",cat:"Chakra Control",tier:3,req:{chakraControl:65},masteryMax:3},
  {id:"fireball",n:"Fire Release: Great Fireball",cat:"Ninjutsu",tier:2,nature:"Fire",req:{ninjutsu:50,chakra:45},masteryMax:3},
  {id:"windblade",n:"Wind Release: Wind Blade",cat:"Ninjutsu",tier:2,nature:"Wind",req:{ninjutsu:50,agility:40},masteryMax:3},
  {id:"lightningbolt",n:"Lightning Release: Bolt",cat:"Ninjutsu",tier:2,nature:"Lightning",req:{ninjutsu:50,speed:40},masteryMax:3},
  {id:"earthwall",n:"Earth Release: Wall",cat:"Ninjutsu",tier:2,nature:"Earth",req:{ninjutsu:50,endurance:40},masteryMax:3},
  {id:"waterbullet",n:"Water Release: Bullet",cat:"Ninjutsu",tier:2,nature:"Water",req:{ninjutsu:50,chakra:40},masteryMax:3},
  {id:"shadowclone",n:"Shadow Clone Technique",cat:"Ninjutsu",tier:3,req:{ninjutsu:65,chakra:65},masteryMax:3},
  {id:"spiralsphere",n:"Spiral Sphere",cat:"Ninjutsu",tier:3,req:{ninjutsu:70,chakraControl:70},masteryMax:3},
  {id:"gentlefist",n:"Gentle Fist",cat:"Clan",clan:"Hyuga",req:{taijutsu:50,perception:45},masteryMax:3},
  {id:"shadowbind",n:"Shadow Imitation Jutsu",cat:"Clan",clan:"Nara",req:{intelligence:55,chakraControl:45},masteryMax:3},
  {id:"multisize",n:"Multi-Size Technique",cat:"Clan",clan:"Akimichi",req:{strength:55,chakra:50},masteryMax:3},
  {id:"bugweb",n:"Kikaichū Web",cat:"Clan",clan:"Aburame",req:{chakraControl:50,perception:40},masteryMax:3},
  {id:"fangoverfang",n:"Fang Over Fang",cat:"Clan",clan:"Inuzuka",req:{strength:50,speed:50},masteryMax:3},
  {id:"mindwalk",n:"Mind Body Switch",cat:"Clan",clan:"Yamanaka",req:{intelligence:55,chakraControl:50},masteryMax:3},
 {id:"chakrapull",n:"Chakra Pull",cat:"Clan",clan:"Uzumaki",req:{chakra:55,chakraControl:45},masteryMax:3},
 {id:"adamantine",n:"Adamantine Sealing Chains",cat:"Clan",clan:"Uzumaki",req:{chakra:65,willpower:60},masteryMax:3},
 {id:"fireball",n:"Fire Style: Great Fireball",cat:"Clan",clan:"Uchiha",req:{ninjutsu:50,chakra:45},masteryMax:3},
 {id:"sixtyfour",n:"Eight Trigrams Sixty-Four Palms",cat:"Clan",clan:"Hyuga",req:{taijutsu:60,perception:60},masteryMax:3},
 {id:"bonedance",n:"Bone Blade Dance",cat:"Clan",clan:"Kaguya",req:{taijutsu:55,endurance:50},masteryMax:3},
 {id:"hydrify",n:"Hydrification",cat:"Clan",clan:"Hozuki",req:{chakraControl:55,endurance:50},masteryMax:3},
 {id:"icemirror",n:"Demonic Ice Mirrors",cat:"Clan",clan:"Yuki",req:{ninjutsu:55,chakraControl:50},masteryMax:3},
 {id:"shadowstrangle",n:"Shadow Strangle",cat:"Clan",clan:"Nara",req:{intelligence:60,chakraControl:50},masteryMax:3},
 {id:"smokeveil",n:"Smoke Veil",cat:"Clan",clan:"Iburi",req:{chakraControl:50,agility:45},masteryMax:3},
 {id:"wrathbarrier",n:"Wrath Seal Barrier",cat:"Clan",clan:"Tsuchigumo",req:{chakraControl:55,intelligence:55},masteryMax:3},
 {id:"voidstep",n:"Void Step",cat:"Clan",clan:"Vex",req:{chakra:60,perception:55},masteryMax:3},
 {id:"primordialsurge",n:"Primordial Surge",cat:"Clan",clan:"Rin",req:{chakra:60,endurance:55},masteryMax:3},
  {id:"kenjutsu_flow",n:"Flowing Blade Form",cat:"Kenjutsu",tier:2,req:{kenjutsu:45,speed:40},masteryMax:3},
  {id:"mysticalpalm",n:"Mystical Palm Technique",cat:"Medical",tier:2,req:{medical:50,chakraControl:55},masteryMax:3},
  {id:"scalpel",n:"Chakra Scalpel",cat:"Medical",tier:3,req:{medical:65,chakraControl:65},masteryMax:3}
];
var WEAPON_LEVELS=["unarmed","kunai & shuriken","wire & senbon","tantō","katana"];

/* ============================ data: missions ============================ */
var MISSION_TYPES={
  D:["Find a lost pet","Weed a farmer's field","Deliver a parcel across town","Babysit the magistrate's twins","Clean the irrigation ditch","Walk an old lady home","Catch a runaway cart","Rescue a cat from a roof","Tutor a merchant's kid","Repaint the Academy fence"],
  C:["Escort a merchant caravan","Find a missing villager","Deliver sealed documents to a border post","Clear wild boars from the rice terraces","Guard a traveling doctor","Track a stolen crate of ryō","Guide a surveyor through the hills","Capture a runaway debt-forging clerk"],
  B:["Hunt a rogue chunin","Infiltrate a smuggling ring","Escort a noble through bandit country","Sabotage an illegal mine","Capture a bounty target alive","Recover a stolen clan relic","Root out a spy in the trade quarter"],
  A:["Assassinate a warlord's lieutenant","Destroy an enemy supply line","Extract a captured shinobi","Defend the village gate against a raid","Track a missing-nin through the borderlands","Escort the Kage's envoy through war country"],
  S:["Eliminate a Kage-level threat","Recover a forbidden scroll from a sealed temple","Break a prisoner out of an enemy capital","Hunt an S-class missing-nin","Hold a mountain pass against an army"]
};
/* narrative mission templates: briefing, prep options, decision point, outcome by decision quality */
var MTPL=[
  {id:"cat",t:"The Roof Cat",ranks:["D"],
   brief:"A merchant’s cat is stranded on the mission office roof. Two days up there, and the whole street has opinions.",
   prep:[["Climb up slowly","cats respect patience"],["Bring dried fish","bribery is a legitimate tactic"]],
   dec:[{t:"Reach for it gently",q:.6},{t:"Lure it with the fish first",q:.55,alt:"the fish works, mostly"}],
   good:"The cat descends with dignity, as if the plan were its own. The merchant pays, the street applauds.",
   mid:"You get the cat down along with most of the roof tiles.",
   bad:"The cat relocates to a taller roof. Word spreads."},
  {id:"scout",t:"The Missing Scout",ranks:["C","B"],
   brief:"Your squad must find a scout who vanished near the border. Tracks lead toward an unfamiliar forest.",
   prep:[["Move fast and light","you reach the forest by dusk"],["Stock up and probe the perimeter","you map the treeline carefully"]],
   dec:[{t:"Follow the tracks immediately",q:.5},{t:"Investigate the clearing first",q:.4,alt:"you find the scout's dropped flask — a poison trap, dodged"}],
   good:"The scout is alive, dehydrated and muttering about a patrol that shouldn't exist. You carry him home and his report gets three people promoted.",
   mid:"You find the scout's camp torn apart and blood on the ferns.",
   bad:"You follow the trail into an ambush. Whoever took the scout expected company."},
  {id:"caravan",t:"The Merchant's Road",ranks:["C","B"],
   brief:"A grain merchant hires your squad to escort his caravan through bandit country. He keeps looking over his shoulder.",
   prep:[["Ride with the wagons","you blend into the caravan"],["Ride the ridgeline ahead","you watch the road from above"]],
   dec:[{t:"Take the fight head-on",q:.45},{t:"Set an ambush of your own",q:.55,alt:"the bandits walk straight into it"}],
   good:"The bandits break and run. The merchant pays double and writes your sensei a glowing letter.",
   mid:"The lead wagon catches fire and half the grain burns, but everyone lives.",
   bad:"The bandits hit hard and fast. You save the people, not the cargo."},
  {id:"spy",t:"The Quiet Neighbor",ranks:["B","A"],
   brief:"Someone in the trade quarter has been copying village shipping ledgers for a foreign buyer. Find them without a scene.",
   prep:[["Work the taverns and gossip","you learn who owes money to strangers"],["Pull the gate ledgers","you build a list of names"]],
   dec:[{t:"Follow the suspect at night",q:.5},{t:"Confront them directly",q:.3,alt:"it nearly goes wrong, but honesty shakes a confession loose"}],
   good:"The spy is a clerk paying a debt you understand too well. The intel is recovered; the story stays out of the record. Someone important owes you now.",
   mid:"The suspect burns their notes and runs. You catch the person, not the copies.",
   bad:"You are made at the drop. A stranger's kunai leaves a scar and the spy vanishes by boat."},
  {id:"gate",t:"The Long Night Watch",ranks:["A"],
   brief:"War country. Your squad holds a village gate against probing raids until reinforcements arrive at dawn.",
   prep:[["Dig in and rig traps","the earthworks hold"],["Patrol aggressive and loud","you keep the enemy guessing"]],
   dec:[{t:"Hold the gate itself",q:.5},{t:"Fall back to the inner wall",q:.4,alt:"the retreat saves your wounded"}],
   good:"Dawn comes grey and quiet. The gate stands. A jonin commander names your squad in dispatches.",
   mid:"You hold, barely, with two wounded and no artillery left.",
   bad:"The gate falls at the fourth hour. You slow them enough for the evac; the village burns behind you."},
  {id:"hunt",t:"The Missing-nin",ranks:["B","A","S"],
   brief:"A former village shinobi has been sighted in the border hills. Orders: track, confirm, capture if possible.",
   prep:[["Study their old service record","you predict their habits"],["Hire local trackers","you gain eyes in every village"]],
   dec:[{t:"Close for the capture",q:.45},{t:"Shadow them for two days first",q:.6,alt:"you learn their route and take them at the river crossing"}],
   good:"They come quietly at the water's edge, almost relieved. The interrogators are pleased. So is your file.",
   mid:"They fight. You win, but the fight is remembered by both sides.",
   bad:"They were the bait for a larger net. You barely cut your way out."},
  {id:"temple",t:"The Sealed Temple",ranks:["S"],
   brief:"A scroll too dangerous to name sleeps in a temple sealed by the first Kage's own jutsu. Bring it back unopened.",
   prep:[["Study the founding-era seals","you read the old script"],["Bring sealing specialists","the barrier team covers you"]],
   dec:[{t:"Break the seal directly",q:.35},{t:"Find the priests' old keyway",q:.6,alt:"the founders left a maintenance path"}],
   good:"The scroll returns untouched. The council's thanks is brief and enormous.",
   mid:"The seal cracks, the temple groans, and you get the scroll out with seconds to spare.",
   bad:"The temple's guardian wakes. You escape with your lives and a story no one will believe."},
  {id:"sabotage",t:"The Enemy Foundry",ranks:["B","A"],
   brief:"An enemy village casts weapons in a foundry three days inland. Disrupt production without starting an open war.",
   prep:[["Pose as ore traders","you walk in through the front gate"],["Infiltrate at night","you go over the wall"]],
   dec:[{t:"Destroy the smelter",q:.5},{t:"Spoil the ore secretly",q:.65,alt:"the sabotage takes weeks to trace"}],
   good:"Production grinds to a halt for a season and no one can prove why. War delayed is war avoided.",
   mid:"The smelter burns, the alarm rings, and your squad exits through a river.",
   bad:"A patrol catches your squad at the wall. You get out, but a teammate doesn't get out clean."}
];

/* ============================ data: achievements ============================ */
var ACHIEVEMENTS=[
  {id:"top_student",n:"Academy Top Student",d:"Graduate the Academy ranked first in class"},
  {id:"first_mission",n:"First Mission",d:"Complete your first mission"},
  {id:"chunin",n:"Chunin Promotion",d:"Pass the Chunin Exams"},
  {id:"jonin",n:"Jonin Promotion",d:"Make jonin"},
  {id:"anbu",n:"ANBU Operative",d:"Be selected for the ANBU"},
  {id:"kage",n:"Kage",d:"Become the leader of your village"},
  {id:"clan_leader",n:"Clan Leader",d:"Be named head of your clan"},
  {id:"perfect_record",n:"Perfect Mission Record",d:"Complete 10 consecutive missions without a failure"},
  {id:"prodigy",n:"Clan Prodigy",d:"Master three techniques before age 15"},
  {id:"village_hero",n:"Village Hero",d:"Earn 90+ reputation"},
  {id:"legend",n:"Legendary Shinobi",d:"Reach jonin with S-rank reputation"},
  {id:"rogue_legend",n:"Rogue Legend",d:"Reach a bounty of 50,000 ryō"},
  {id:"war_survivor",n:"Survived a War",d:"Live through a village war year"},
  {id:"nature_master",n:"Nature Mastered",d:"Reach full mastery on a chakra-nature technique"},
  {id:"family_man",n:"Family Rooted",d:"Raise a child to adulthood"},
  {id:"kkg",n:"Bloodline Awakened",d:"Awaken a kekkei genkai"},
  {id:"redemption",n:"The Long Road Home",d:"Return to your village after going rogue"},
  {id:"retired",n:"A Quiet Life",d:"Retire from shinobi service alive"},
  {id:"mentor",n:"Sensei",d:"Train a genin squad of your own"},
  {id:"centenarian",n:"A Long Life",d:"Live to age 90"},
  {id:"s_ranked",n:"S-Rank Veteran",d:"Complete an S-rank mission"},
  {id:"hidden_friend",n:"The Village's Shadow",d:"Befriend a canon legend"},
  {id:"early_grad",n:"Ahead of the Class",d:"Graduate the Academy years early",h:1},
  {id:"students_bloom",n:"Full Bloom",d:"A student you trained makes chunin",h:1},
  {id:"guardian_bond",n:"The Hand That Raised You",d:"Earn 90+ closeness with the one who raised you",h:1},
  {id:"dynasty_line",n:"The Line Continues",d:"Begin a life as the child of a past life",h:1},
  {id:"legacy_keeper",n:"Legacy Keeper",d:"As the child of a past life, reach chunin or higher",h:1},
  {id:"full_house",n:"Full House",d:"Raise three or more children with a spouse",h:1}
];

/* ============================ data: items, injuries ============================ */
var ITEMS={
  kunai:{n:"Fine Kunai",d:"Well-balanced. +2 to taijutsu rolls you'll never see.",price:400},
  pill:{n:"Soldier Pill",d:"Restores 40 fatigue instantly.",price:600},
  medkit:{n:"Field Medicine Kit",d:"Heals 25 health over a day. One use.",price:900},
  scroll:{n:"Sealed Scroll",d:"A jutsu reference. +1 training progress on ninjutsu.",price:800},
  charm:{n:"Lucky Charm",d:"Grandmother's. Feels heavier when it matters.",price:500},
  cloak:{n:"Travel Cloak",d:"Warm, plain, and good in rain.",price:300}
};
var INJURIES=[
  {n:"twisted ankle",sev:1},{n:"deep gash",sev:1},{n:"cracked rib",sev:2},
  {n:"burned arm",sev:2},{n:"broken arm",sev:3},{n:"poisoned wound",sev:3},{n:"concussion",sev:2}
];

/* ============================ persistent global state ============================ */
var LS_SLOTS="shinobi_sprint_slots_v2", LS_LEGACY="shinobi_sprint_legacy_v2", LS_ACH="shinobi_sprint_ach_v2";
function loadJSON(k,fb){try{var v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch(e){return fb}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var G=null; /* current life */

/* ============================ life generation ============================ */
function rollName(g){
  return (g==="f"?pick(NAMES_F):pick(NAMES_M));
}
/* ============================ clan system v2: odds, luck, passives ============================ */
var CLAN_RARITIES=["common","uncommon","rare","epic","legendary","mythical","secret"];
var CLAN_ODDS={common:48,uncommon:27,rare:15,epic:7,legendary:2.5,mythical:.5};
var SECRET_CLAN_ODDS=1/2000000; /* per secret clan, per divination */
var CLAN_CFG_KEY="slu_clan_cfg";
function clanCfg(){
  try{var c=JSON.parse(localStorage.getItem(CLAN_CFG_KEY)||"{}");return (c&&typeof c==="object")?c:{}}catch(e){return {}}
}
function clanLuckValue(){
  /* 0..1 — in-life luck stat when a life exists, otherwise the birth luck roll */
  var l=(G&&G.stats&&G.stats.luck!=null)?G.stats.luck:(CC&&CC.luckRoll!=null?CC.luckRoll:5);
  return Math.max(0,Math.min(1,(l-1)/9));
}
function clanRollWeights(){
  /* baseline CLAN_ODDS; luck moves a slice of the common weight up the ladder;
     owner per-rarity multipliers apply on top; caller normalizes over what exists */
  var cfg=clanCfg();
  var w={},r;
  for(r in CLAN_ODDS)w[r]=CLAN_ODDS[r];
  var luckMult=(cfg.luckMult==null?1:cfg.luckMult);
  var shift=Math.min(18,10*clanLuckValue()*luckMult);
  if(shift>0&&w.common>0){w.common-=shift;w.uncommon+=shift*.34;w.rare+=shift*.30;w.epic+=shift*.20;w.legendary+=shift*.11;w.mythical+=shift*.05}
  if(cfg.oddsMult)for(r in cfg.oddsMult){if(w[r]!=null&&typeof cfg.oddsMult[r]==="number")w[r]=Math.max(0,w[r]*cfg.oddsMult[r])}
  return w;
}
function rollClan(village,quiet){
  var pool=CLANS.filter(function(c){return !c.secret&&(!c.v||c.v===village)});
  if(!pool.length)return null;
  var w=clanRollWeights();
  var tiers=CLAN_RARITIES.filter(function(r){return r!=="secret"&&pool.some(function(c){return c.r===r})&&w[r]>0});
  var rar=weighted(tiers.map(function(r){return [r,w[r]]}));
  var c=pick(pool.filter(function(x){return x.r===rar}));
  if(!quiet)logClanRoll(c,"roll",CC.clanHistory);
  return c;
}
function secretRollClan(){
  var pool=CLANS.filter(function(c){return c.secret});
  if(!pool.length)return null;
  var cfg=clanCfg();
  var mult=(cfg.secretOddsMult==null||typeof cfg.secretOddsMult!=="number")?1:cfg.secretOddsMult;
  var c=pick(pool);
  var hit=Math.random()<SECRET_CLAN_ODDS*mult;
  logClanRoll(c,hit?"secret-hit":"secret-miss",G&&G.clanHistory?G.clanHistory:null);
  return hit?c:null;
}
function logClanRoll(c,kind,h){
  if(!c)return;
  if(!h){h=(G&&G.clanHistory)?G.clanHistory:(CC.clanHistory=CC.clanHistory||[])}
  h.unshift({n:c.n,r:c.r,kind:kind||"roll",when:Date.now()});
  if(h.length>30)h.length=30;
}
/* ---- passives: flat bonuses live in the st() layer, derived from the clan — never stored twice, never stack ---- */
function clanOf(){
  if(G&&G.clan)return G.clan;
  var nm=(G&&G.clanName)||null;
  if(!nm)return null;
  return CLANS.find(function(x){return x.n===nm})||null;
}
function clanPas(){var c=clanOf();return c?(c.pas||null):null}
function clanFlat(k){
  var p=clanPas();
  if(!p||!p.flat)return 0;
  var v=p.flat[k];
  if(v==null)return 0;
  if(k==="potential")return v>0?Math.min(v,2):v; /* potential is a 1..11 scale */
  return v;
}
function clanRelNum(key){
  var p=clanPas();
  if(!p||!p.rel)return 0;
  var v=p.rel[key];
  return typeof v==="number"?v:0;
}
function clanTrainMult(k){
  var p=clanPas();
  if(!p||!p.rel||!p.rel.train)return 1;
  var t=p.rel.train;
  var v=(t[k]!=null)?t[k]:((t.all!=null)?t.all:0);
  return 1+v;
}
function fatigueHeal(n){G.fatigue=Math.max(0,G.fatigue-Math.round(n*(1+clanRelNum("recovery"))))}
function clanRelLine(key){
  var n=clanRelNum(key);
  return n?"+"+Math.round(n*100)+"%":"";
}

function rollStats(){
  var s={};
  s.health=ri(70,95);s.chakra=ri(20,50);s.chakraControl=ri(10,30);
  s.strength=ri(10,40);s.speed=ri(10,40);s.agility=ri(10,40);s.endurance=ri(10,40);
  s.intelligence=ri(25,60);s.perception=ri(15,45);
  s.taijutsu=ri(5,20);s.ninjutsu=ri(5,20);s.genjutsu=ri(0,15);s.kenjutsu=ri(0,10);s.medical=0;
  s.discipline=ri(20,60);s.confidence=ri(20,60);s.patience=ri(20,60);s.aggression=ri(10,60);
  s.compassion=ri(20,70);s.leadership=ri(5,30);s.ambition=ri(10,60);s.loyalty=ri(30,70);
  s.happiness=ri(55,85);s.reputation=ri(8,14);
  s.potential=weighted([[ri(3,5),5],[ri(6,7),3],[ri(8,9),1.5],[ri(10,11),0.35]]);
  s.luck=ri(1,10);s.talent=ri(1,10);s.willpower=ri(1,10);
  s.growth=Math.round((s.potential+s.talent)/2);
  return s;
}
function newNPC(o){
  o=o||{};
  var gender=o.gender||pick(["m","f"]);
  var clan=o.clan||chance(.25)?o.clan:null;
  return {
    id:"n"+Math.random().toString(36).slice(2,8),
    name:(o.first||rollName(gender))+" "+(o.last||pick(SURNAMES)),
    gender:gender,
    age:o.age!=null?o.age:ri(20,45),
    clan:o.clan||null,
    rel:o.rel!=null?o.rel:20,
    kind:o.kind||"acquaintance",
    alive:true,
    job:o.job||pick(["farmer","merchant","innkeeper","blacksmith","shinobi","academy teacher","nurse","carpenter","courier","fisher"]),
    rank:o.rank||null,
    personality:pick(PERSONALITIES).n,
    ambition:ri(1,10),
    skill:ri(1,10),
    bio:o.bio||null,
    village:o.village||null
  };
}
function makeBio(c){
  var lines=[];
  var s=c.stats,hist=c.familyHistory;
  lines.push(c.first+" "+c.last+" was born in "+c.villageName+", "+c.eraName+".");
  if(c.clanName){lines.push(hist+" The "+c.clanName+" clan's "+c.clanSpec+" runs in the family blood.");if(c.relocated)lines.push("The family left the clan's home village a generation ago and settled in "+c.villageName+".");}
  else lines.push(hist+" No clan name sits behind yours, only a household that works.");
  var fam=c.familyWealth;
  if(fam==="poor")lines.push("The family is poor; meals are counted and the roof leaks.");
  else if(fam==="modest")lines.push("The family gets by, honest work and honest coin.");
  else if(fam==="comfortable")lines.push("The family lives comfortably above the shop.");
  else lines.push("The family is wealthy, and the neighbors keep score.");
  if(c.household==="orphan")lines.push("Your parents were lost early; your grandmother raised you alone.");
  else if(c.household==="guardian")lines.push("Raised by an aunt and uncle in a house that was never quite yours.");
  else if(c.household==="prestigious")lines.push("The clan compound's gates open for your family before most others.");
  if(s.potential>=9)lines.push("There is something in this child the adults keep glancing at.");
  else if(s.potential<=4)lines.push("Nobody expects much from this child. That is its own kind of freedom.");
  return lines.join(" ");
}
function generateLife(opts){
  opts=opts||{};
  var gender=opts.gender||(chance(.5)?"m":"f");
  var eraId=opts.era&&opts.era!=="r"?opts.era:pick(ERAS).id;
  var era=ERAS.find(function(e){return e.id===eraId});
  var village=opts.village&&opts.village!=="r"?opts.village:pick(Object.keys(VILLAGES));
  var v=VILLAGES[village];
  var clanData=null,clanless=false,clanPicked=false,relocated=false;
  if(opts.clan&&opts.clan!=="r"){
    var found=CLANS.find(function(c){return c.n===opts.clan});
    if(found){clanData=found;clanPicked=true}
    else{clanless=true}
  }else{
    clanData=chance(.42)?rollClan(village,true):null;
  }
  if(clanData&&clanData.v&&clanData.v!==village){
    /* a clan you pick yourself always sticks; only randomly rolled clans respect the village filter */
    if(clanPicked){relocated=true}
    else if(!chance(.3)){clanData=null}
  }
  var wealthRoll=Math.random();
  var familyWealth=wealthRoll<.4?"poor":wealthRoll<.8?"modest":wealthRoll<.95?"comfortable":"wealthy";
  if(clanData&&clanData.r==="mythical")familyWealth="wealthy";
  var stats=rollStats();
  if(clanData){
    var specMap={"Fire · Genjutsu":{genjutsu:10,ninjutsu:6},"Gentle Fist · Perception":{taijutsu:8,perception:8},
      "Wood Release · Vitality":{chakra:10,endurance:8},"Sealing Arts · Endurance":{endurance:8,chakra:6},
      "All-rounder · Willpower":{willpower:4},"Shadow Arts · Strategy":{intelligence:8},
      "Body Expansion · Strength":{strength:10},"Mind Arts · Sensory":{intelligence:6,perception:6},
      "Kikaichū · Tracking":{perception:8,chakraControl:4},"Ninken · Tracking":{speed:6,strength:4},
      "Genjutsu Mastery":{genjutsu:12},"Kenjutsu · Speed":{kenjutsu:8,speed:6},
      "Storm Release":{ninjutsu:6},"Lava & Boil Release":{ninjutsu:6},"Ice Release":{chakraControl:6}};
    var spec=specMap[clanData.spec]||{};
    for(var k in spec)stats[k]=clamp(stats[k]+spec[k],0,100);
  }
  var first=opts.first||rollName(gender);
  var last=clanData?clanData.n:(opts.last||pick(SURNAMES));
  var personality=opts.personality||pick(PERSONALITIES);
  var fmods=personality.f||{};
  for(var pk in fmods)if(stats[pk]!=null)stats[pk]=clamp(stats[pk]+fmods[pk],0,100);
  /* family */
  var parentsAge=ri(21,38);
  var family={parents:[],siblings:[],kids:[],spouse:null};
  var hhRoll=Math.random();
  var household=(clanData&&(clanData.r==="legendary"||clanData.r==="mythical"))?"prestigious":
    hhRoll<.06?"orphan":hhRoll<.14?"guardian":hhRoll<.38?"small":hhRoll<.88?"normal":"large";
  if(household==="orphan"){
    family.parents.push(newNPC({first:rollName("f"),last:last,age:parentsAge+ri(18,28),rel:ri(40,65),kind:"guardian",clan:clanData?clanData.n:null,bio:"The grandmother who took you in."}));
  }else if(household==="guardian"){
    family.parents.push(newNPC({first:rollName(chance(.5)?"m":"f"),last:last,age:parentsAge+ri(8,18),rel:ri(45,70),kind:"guardian",clan:clanData?clanData.n:null,bio:"Your aunt or uncle took you in when your parents were lost."}));
  }else{
    family.parents.push(newNPC({first:rollName("m"),last:last,age:parentsAge,rel:65,kind:"father",clan:clanData?clanData.n:null,bio:"Your father."}));
    family.parents.push(newNPC({first:rollName("f"),last:last,age:parentsAge-ri(0,5),rel:70,kind:"mother",clan:chance(.4)?(clanData?clanData.n:null):null,bio:"Your mother."}));
  }
  if(household!=="orphan"&&household!=="small"&&chance(.3)){
    family.parents.push(newNPC({first:rollName(chance(.5)?"m":"f"),last:last,age:parentsAge+ri(20,35),rel:ri(35,60),kind:"grandparent",clan:clanData?clanData.n:null,bio:"Lives in the room behind the kitchen."}));
  }
  var sibMax=household==="large"?4:household==="small"?1:3;
  var sibRoll=household==="small"?(chance(.4)?1:0):household==="large"?ri(2,sibMax):ri(0,sibMax);
  for(var si=0;si<sibRoll;si++)family.siblings.push(newNPC({first:rollName(chance(.5)?"m":"f"),last:last,age:ri(1,Math.max(2,parentsAge-24)),rel:ri(40,80),kind:"sibling"}));
  var familyHistory=clanData?clanData.hist:pick(SHINOBI_HIST);
  /* latent bloodline chance for clanless rare births */
  var latentKG=null;
  if(!clanData&&chance(.02)){latentKG=pick(["Explosion Release","Magnet Release","Boil Release"])}
  /* chakra nature (hidden until discovered) */
  var nature=pick(NATURES),natureKnown=false,secondary=null;
  var c={
    first:first,last:last,name:first+" "+last,gender:gender,
    eraId:eraId,eraName:era.name,era:era,
    village:village,villageName:v.name,villageLabel:v.label,vkan:v.kan,villageData:v,
    clan:clanData,clanName:clanData?clanData.n:null,clanless:!clanData,
    familyWealth:familyWealth,familyHistory:familyHistory,
    personality:personality,latentKG:latentKG,
    kkg:null,kkgKnown:false,nature:nature,natureKnown:false,secondary:secondary,
    age:0,birthYear:0,alive:true,rank:"Newborn",career:"Newborn",
    stats:stats,
    parentsAge:parentsAge,household:household,trained:{},flags:{},
    family:family,
    relationships:[].concat(family.parents).concat(family.siblings),
    teammates:[],rival:null,sensei:null,students:[],
    jutsu:{},inventory:[],rvo:0,
    fatigue:0,
    academy:null,missionStats:{total:0,success:0,fail:0,streak:0,best:0,byRank:{}},
    reputation:stats.reputation,
    bounty:0,rogue:false,rogueYears:0,
    achievements:[],feed:[],timeline:[],
    villageState:{stability:ri(55,90),prosperity:ri(40,85),warActive:era.war>.1,kage:pick(["Torifu","Kagami","Ebun","Shikuro","Genji"])+" "+v.kage,influence:0,
      warYear:false},
    retired:false,retiredYear:null,
    bio:makeBio({first:first,last:last,clanName:clanData?clanData.n:null,clanSpec:clanData?clanData.spec:"",villageName:v.name,eraName:era.name,familyWealth:familyWealth,stats:stats,familyHistory:familyHistory,relocated:relocated,household:household}),
    legacyParent:null
  };
  c.relationships.forEach(function(n){n.village=village});
  if(clanData&&clanData.kg&&clanData.r==="legendary"&&chance(.85)){
    c.kkg=clanData.kg; /* bloodline carrier; awakening comes later via event */
  }
  if(!c.kkg&&c.latentKG){c.kkg=c.latentKG} /* rare clanless bloodline carriers */
  return c;
}

/* ============================ state helpers ============================ */
function st(k){var v=G.stats[k];if(v==null)return v;var f=clanFlat(k);return f?clamp(v+f,0,100):v}
function addStat(k,v){if(G.stats[k]!=null){G.stats[k]=clamp(G.stats[k]+v,0,100);if(k==="health"&&G.stats[k]<=0){dieOf("wounds")}}}
function addRyo(n){G.ryo=Math.max(0,(G.ryo||0)+n)}
function rep(n){if(n>0)n=Math.round(n*(1+clanRelNum("rep")));G.reputation=clamp(G.reputation+n,0,100)}
function feed(txt,cls){G.feed.unshift({age:G.age,txt:txt,cls:cls||""})}
function fbig(txt,cls){feed(txt,cls||"big")}
function tl(age,txt){G.timeline.push({age:age,txt:txt})}
function isChild(){return G.age<6}
function inAcademy(){return G.academy&&G.academy.enrolled}
function rankRank(){return {"Newborn":0,"Child":0,"Academy Student":1,"Genin":2,"Chunin":3,"Jonin":4,"ANBU":5,"Kage":6,"Rogue":4,"Missing-nin":4,"Civilian":0,"Retired":0}[G.rank]||0}
function adult(){return G.age>=18}

/* ============================ relationships ============================ */
function relOf(n){return n?n.rel:0}
function relUp(n,v){if(!n)return;if(v>0)v=Math.round(v*(1+clanRelNum("social")));n.rel=clamp(n.rel+v,-100,100)}
function npcAge(){G.relationships.forEach(function(n){if(n.alive&&n.kind!=="sibling"&&n.kind!=="child")n.age++})}
function npcPass(n){
  if(!n.alive)return;
  var risk=n.age>65?(n.age-65)*.012:(n.age>50?(n.age-50)*.005:.001);
  if(n.kind==="shinobi"||n.rank)risk+=.004;
  if(chance(risk)){n.alive=false;
    var line={father:"Your father",mother:"Your mother",sibling:"Your sibling",child:"Your child",spouse:"Your spouse"}[n.kind]||n.name;
    fbig(line+" has passed away.","bad");tl(G.age,line+" died.");
    relUp(n,0);addStat("happiness",n.kind==="spouse"||n.kind==="child"?-18:-8);
    if(n.id===G.rival)G.rival=null;
  }
}
function findRel(pred){return G.relationships.filter(pred)}
function byKind(k){return findRel(function(n){return n.kind===k&&n.alive!==false})}

/* ============================ clan & bloodline events ============================ */
function tryKGAwake(){
  if(G.kkgKnown||!G.kkg)return false;
  var kg=KKG[G.kkg];
  if(!kg||G.age<kg.minAge||st("potential")<kg.minPot)return false;
  var p=.06+(st("potential")-kg.minPot)*.03;
  if(G.kkg==="Sharingan")p+=st("aggression")*.001;
  if(chance(p)){
    G.kkgKnown=true;
    for(var k in kg.boost)addStat(k,kg.boost[k]);
    if(!includes(G.achievements,"kkg"))award("kkg");
    fbig("BLOODLINE AWAKENED — "+G.kkg+". "+kg.desc,"rare");
    tl(G.age,"Awakened the "+G.kkg+" kekkei genkai.");
    if(G.clanName)rep(3);
    return true;
  }
  return false;
}
function tryNatureDiscover(){
  if(G.natureKnown)return false;
  if(G.age<7)return false;
  var p=inAcademy()?.35:.12;
  if(chance(p)){
    G.natureKnown=true;
    fbig("Chakra nature discovered: "+G.nature+". Your academy instructor has you practicing paper-cutting exercises.","rare");
    tl(G.age,"Discovered "+G.nature+" release.");
    return true;
  }
  return false;
}

/* ============================ event engine ============================ */
function poolFor(){
  var pools=[];
  if(G.age<5)pools.push("early");
  else if(G.age<8)pools.push("awaken");
  if(isChild())pools.push("child");
  else if(inAcademy())pools.push("academy");
  if(G.age>=6)pools.push("family");
  if(G.age>=6)pools.push("village");
  else if(G.rank==="Genin")pools.push("genin");
  else pools.push("shinobi");
  if(G.rogue)pools.push("rogue");
  if(G.retired)pools.push("retired");
  if(adult())pools.push("adult");
  if(adult()&&!G.rogue&&!G.retired)pools.push("career");
  return pools;
}
var EVS={};/* filled below: {pool: {w:weight, ev:[{t, w, run}]}} */

function runEvent(e){
  var keep=function(){}; /* event provides choices via modal */
  e.run();
}

/* ---------- event helpers ---------- */
function paperModal(title,kind,text,choices,onClose){
  var m=$("#modal"),c=$("#mcard");c.innerHTML="";
  if(!choices||!choices.length){
    var xb=el("button","mcloseX","\u00d7");
    xb.setAttribute("aria-label","Close");
    xb.onclick=function(ev){ev.stopPropagation();m.classList.remove("on");if(onClose)onClose()};
    c.appendChild(xb);
    m.onclick=function(ev){if(ev.target===m){m.classList.remove("on");if(onClose)onClose()}};
  }else{m.onclick=null}
  c.appendChild(el("div","mk",kind||"Event"));
  c.appendChild(el("h3","serif",title));
  var t=el("div","mtext",text);c.appendChild(t);
  var box=el("div","mchoices");
  (choices||[]).forEach(function(ch){
    var b=el("button","mchoice");
    b.appendChild(el("b",null,ch.t));
    if(ch.d)b.appendChild(el("small",null,ch.d));
    b.onclick=function(){
      box.innerHTML="";
      if(ch.res){c.appendChild(el("div","mresult",ch.res))}
      if(ch.fn)ch.fn();
      if(ch.then){var b2=el("button","btn mclose",ch.then[0]||"Continue");b2.onclick=function(){m.classList.remove("on");if(onClose)onClose()};c.appendChild(b2)}
      else{m.classList.remove("on");if(onClose)onClose()}
      render();
    };
    box.appendChild(b);
  });
  if(!choices||!choices.length){var b=el("button","btn mclose","Continue");b.onclick=function(){m.classList.remove("on");if(onClose)onClose()};box.appendChild(b)}
  c.appendChild(box);
  m.classList.add("on");
}
function pickEvent(){
  var pools=poolFor();
  var total=0,bag=[];
  pools.forEach(function(p){
    var set=EVS[p]||[];
    set.forEach(function(e){bag.push({e:e,w:e.w});total+=e.w});
  });
  if(!bag.length)return null;
  var r=Math.random()*total;
  for(var i=0;i<bag.length;i++){r-=bag[i].w;if(r<=0)return bag[i].e}
  return bag[bag.length-1].e;
}

/* ---------- event definitions ---------- */
EVS.child=[
 {t:"first words",w:4,run:function(){fbig(pick(["Your first word is \"no.\"","Your first word is your father's name.","You call the family cat by a name nobody can pronounce."]))}},
 {t:"toddler trouble",w:4,run:function(){var t=pick(["You swallow a pebble. Your mother remains calm. Barely.","You fall down the stairs. It becomes a family story.","You bite another toddler at the market. Nobody presses charges."]);
   if(chance(.3)){addStat("happiness",-4);fbig(t,"bad")}else fbig(t)}},
 {t:"wonder",w:3,run:function(){addStat("intelligence",2);fbig("You spend an afternoon watching ants carry a beetle twice their size and feel the world get bigger.")}},
 {t:"clan tradition",w:2,run:function(){if(G.clanName){fbig("The family performs the "+G.clanName+" clan's traditional rites for your third year. You mostly remember the food.")}else fbig("Your family takes you to the village shrine for your naming blessing.")}},
 {t:"talent glimpse",w:2,run:function(){var s=pick(["strength","speed","agility","intelligence","perception"]);addStat(s,3);
   fbig("Your parents notice you "+pick(["climbing the kitchen shelf","counting coins by sight","outrunning the neighbor's dog","catching flies midair"])+". "+cap(s)+" runs deep.","rare")}},
 {t:"era event: child",w:2,run:function(){if(G.era.war>.1){fbig("Air-raid drills. You learn to hide under tables before you learn your letters.","world");addStat("happiness",-5);addStat("endurance",2)}
   else fbig("A festival fills the streets with lanterns and grilled squid. You are allowed to stay up late.","world")}},
 {t:"sibling day",w:2,run:function(){var s=byKind("sibling");if(!s.length)return;var n=pick(s);
   fbig("You and "+n.name.split(" ")[0]+" "+pick(["build a fort from laundry poles","stage a puppet show for the neighbors","raid the pickle jar","race to the well and back"])+".");relUp(n,6);addStat("happiness",2)}}
,
 {t:"stray pup",w:2,run:function(){modal("The Pup","Childhood","A skinny stray pup has followed you home from the well for three days. It sits at the gate like it pays rent.",
    [{t:"Sneak it food",fn:function(){G.flags.pup=true;addStat("happiness",3);fbig("The pup stays. Your mother pretends not to notice. The pup is now family.","good");tl(G.age,"Took in a stray pup")}},
     {t:"Shoo it away",fn:function(){fbig("It watches you go with an expression you will remember later.","bad");addStat("happiness",-1)}}])}},
 {t:"market mischief",w:2,run:function(){modal("The Market","Childhood","A fruit stall's pyramid wobbles as you pass. Only your hand is anywhere near it.",
    [{t:"Steady the pyramid",fn:function(){addStat("discipline",2);fbig("You catch it one-handed. The stall owner gives you a free pear and a long look.","good")}},
     {t:"Run",fn:function(){if(chance(.5)){fbig("You get three streets away before laughing. Best pear you never paid for.","good")}else{fbig("A shopkeeper catches your sleeve. Your parents hear about it by dinner.","bad");addStat("happiness",-2)}}}])}}
];
EVS.academy=[
 {t:"class exam",w:5,run:function(){var score=Math.round(st("intelligence")*.6+st("discipline")*.3+st("taijutsu")*.1+luck()+clanRelNum("exam"));
   var a=G.academy;
   if(score>=60){a.grades=clamp((a.grades||0)+3,0,100);fbig("You place "+pick(["second","third","near the top"])+" in the written exam. Instructor "+(a.sensei||"Daichi")+" reads your name out.","good")}
   else if(score>=40){a.grades=clamp((a.grades||0)+1,0,100);fbig("You pass the exam solidly. Unspectacular, expected, fine.")}
   else{a.grades=clamp((a.grades||0)-2,0,100);fbig("You blank on the chakra theory section. The paper comes back with red ink and a sigh.","bad")}}},
 {t:"make a friend",w:3,run:function(){if(G.relationships.length>26)return;
   var n=newNPC({age:G.age,kind:"friend",rel:ri(30,55),village:G.village});n.rank="Academy Student";
   G.relationships.push(n);fbig("You befriend "+n.name+", who "+pick(["shares their lunch","dares you to climb the Academy roof","challenges you to a leaf-sticking contest","has the loudest laugh in class"])+".","good");
   if(!G.bestFriend&&chance(.4)){G.bestFriend=n.id;n.kind="best friend";fbig("They become your best friend almost without either of you deciding it.","good")}}},
 {t:"make a rival",w:3,run:function(){if(G.rival)return;
   var n=newNPC({age:G.age,kind:"rival",rel:ri(-20,10),village:G.village});n.rank="Academy Student";n.skill=Math.max(n.skill,4);
   G.relationships.push(n);G.rival=n.id;
   fbig("AN ACADEMY RIVAL — "+n.name+" "+pick(["beats your sparring record by a second","mocks your clan's technique","takes the seat you wanted","calls your family '普通人' by mistake"])+" and becomes the person you measure yourself against.","big");
   tl(G.age,"Rival: "+n.name)}},
 {t:"training montage",w:4,run:function(){var a=G.academy,s=pick(["taijutsu","ninjutsu","agility","chakraControl"]);
   addStat(s,3);a.training=(a.training||0)+1;
   fbig("You drill "+cap(s)+" until your hands shake. Instructor "+(a.sensei||"Daichi")+" nods once, which is a standing ovation.","good")}},
 {t:"trouble",w:3,run:function(){var a=G.academy;
   modal("Detention","Trouble",pick(["You and three others paint the Hokage monument's faces with mustaches. You are the only one caught.","You sneak onto the roof to skip history class and are caught by the janitor, who gives a two-hour lecture.","You turn in a prank transformation jutsu as your exam project. It is technically perfect and completely inappropriate."]),
    [{t:"Accept the punishment quietly",d:"discipline grows",fn:function(){addStat("discipline",3);a.attendance=clamp((a.attendance||0)+1,0,100)}},
     {t:"Blame your classmates",d:"reputation risk",fn:function(){if(chance(.5)){fbig("Your bluff works. You get off with a warning.","good");addStat("confidence",2)}else{fbig("It does not work. Both the class and the instructor now trust you less.","bad");rep(-2);a.grades=clamp((a.grades||0)-3,0,100)}}}])}},
 {t:"sparring class",w:3,run:function(){var opp=byKind("rival")[0];var win=ri(st("taijutsu")+st("speed"),st("taijutsu")+st("speed")+20)>ri(40,70);
   addStat("taijutsu",2);
   if(opp){relUp(opp,win?1:2);
     if(win)fbig("You beat "+opp.name.split(" ")[0]+" in sparring for the first time. The class goes quiet. Their jaw goes tight.","good");
     else fbig(opp.name.split(" ")[0]+" throws you across the mat for the fourth time this month. You learn more losing than winning.")}
   else fbig("Sparring class leaves you bruised and better.")}},
 {t:"learn jutsu offer",w:3,run:function(){var avail=JUTSU.filter(function(j){return canLearn(j)&&!G.jutsu[j.id]});
   if(!avail.length)return;var j=pick(avail);
   modal("Technique","Academy","Instructor "+(G.academy.sensei||"Daichi")+" demonstrates the "+j.n+" and offers to teach it to whoever can show up early enough.",
    [{t:"Learn it",d:"requires "+reqText(j),fn:function(){learnJutsu(j)}},{t:"Not yet"}])}},
 {t:"era event: academy",w:2,run:function(){if(G.era.war>.1){fbig("Half your class graduates early and ships out. The remaining desks feel further apart.","world");addStat("happiness",-4)}
   else if(G.eraId==="boruto")fbig("Class uses electronic tablets now. Your instructor calls them 'the future' with visible suspicion.","world");
   else fbig("A jonin veteran visits class to tell war stories. Half are clearly exaggerated. They are better for it.","world")}}
,
 {t:"group project",w:2,run:function(){var fr=byKind("friend").filter(function(n){return n.alive});var a=G.academy;
   if(fr.length){var n=pick(fr);relUp(n,4);if(a&&a.subj)a.subj.teamwork=clamp(a.subj.teamwork+5,0,100);
     fbig("You and "+n.name.split(" ")[0]+" build the tactical project together. It wins praise and one argument about formation spacing.","good")}
   else{addStat("intelligence",1);fbig("You do the group project alone. It is excellent and slightly lonely.")}}},
 {t:"memorial visit",w:2,run:function(){modal("The Memorial","Academy","Class visits the memorial stone. Your instructor asks what service means. Half the class recites the textbook answer.",
    [{t:"Answer honestly",fn:function(){rep(1);addStat("willpower",1);fbig("You say something quiet and true. Your instructor writes your name down, for better or worse.","good")}},
     {t:"Recite the textbook line",fn:function(){if(G.academy)G.academy.grades=clamp(G.academy.grades+2,0,100);fbig("You recite it perfectly. It is exactly what is expected.","")}}])}}
];
EVS.genin=[
 {t:"team bonding",w:3,run:function(){var t=G.teammates;if(!t.length)return;var n=pick(t);
   relUp(n,5);addStat("happiness",1);
   fbig("Your squad "+pick(["eats dinner together after training","gets lost returning from a D-rank and blames each other for an hour","stays late practicing formation drills","argues about whose fault the last mission was until sensei sighs"])+".")}},
 {t:"sensei's lesson",w:3,run:function(){var s=G.sensei;if(!s)return;var k=pick(["taijutsu","ninjutsu","chakraControl","intelligence"]);
   addStat(k,3);relUp(s,3);fbig("Sensei "+s.name.split(" ")[0]+" teaches you "+pick(["tree-walking without hands","how to read a battlefield","that chakra control beats raw power","how to bandage a wound you caused"])+".","good")}},
 {t:"rival team",w:2,run:function(){var t=G.teammates;if(!t.length)return;
   fbig("Your squad runs into "+pick(["Team "+ri(2,9),"the squad everyone whispers about"])+" at the training grounds. The joint sparring ends "+pick(["with your team ahead","in mutual respect","with sensei confiscating three kunai sets"])+"."),addStat("taijutsu",2)}},
 {t:"chunin exam invite",w:2,run:function(){if(G.age<13||G.examDone)return;
   modal("Chunin Exams","Career","Your sensei has nominated you for the Chunin Exams. Two stages of combat, one of strategy, and paperwork that outlasts all of it.",
    [{t:"Enter the exams",d:"the chance of your life",fn:function(){startChunin()}},{t:"Wait for next cycle",d:"keep training"}])}}
,
 {t:"the weight of it",w:2,run:function(){addStat("happiness",-3);addStat("willpower",2);
   fbig(pick(["Your first real field operation ends. You sit on the wall afterward and understand why the veterans drink tea, not sake.","You see another squad return from a failed operation. Nobody explains anything. Nothing needs explaining."]),"world")}},
 {t:"team friction",w:2,run:function(){var t=G.teammates;if(t.length<2)return;var a=t[0],b=t[1];if(!a.alive||!b.alive)return;
   modal("Squad Friction","Team",a.name.split(" ")[0]+" and "+b.name.split(" ")[0]+" are one stupid remark from a real fight over who carries the mission kit.",
    [{t:"Split the kit yourself",fn:function(){relUp(a,3);relUp(b,3);addStat("leadership",2);fbig("You carry half each and say nothing. It somehow fixes it.","good")}},
     {t:"Let them fight it out",fn:function(){var w=pick([a,b]);relUp(w,2);relUp(w===a?b:a,-4);fbig(w.name.split(" ")[0]+" wins the argument and the bruise. The kit gets split anyway.","bad")}},
     {t:"Make it a race",fn:function(){relUp(a,4);relUp(b,4);addStat("happiness",2);fbig("First pair of legs to camp carries it. They arrive at a dead sprint, laughing.","good")}}])}}
];
EVS.shinobi=[
 {t:"village duty",w:3,run:function(){var k=pick(["patrol the walls","staff the mission desk","train the newest genin intake","review border reports"]);
   fbig("You spend the week on village duty: "+k+". Quiet, necessary, and better pay than expected.");addRyo(ri(150,400));rep(1)}},
 {t:"senior shinobi",w:2,run:function(){if(G.relationships.length>30)return;
   var n=newNPC({age:ri(28,50),kind:"senior",rel:ri(10,35),village:G.village});n.rank=pick(["Chunin","Jonin"]);n.skill=ri(7,10);
   G.relationships.push(n);fbig("You cross paths with "+n.name+", a "+n.rank.toLowerCase()+" "+pick(["who once fought in the war","with a famous scar","known for reading the room like a map","with a bad knee and a good eye"])+".")}},
 {t:"medical training offer",w:2,run:function(){if(G.jutsu.mysticalpalm)return;
   modal("Medical Corps","Career","The medical corps is recruiting shinobi with fine chakra control. Healing saves more lives than any blade.",
    [{t:"Begin medical training",fn:function(){addStat("medical",6);fbig("You begin medical training. Your hands learn patience.","good");G.career="Medical Trainee"}},{t:"Stay on the combat track"}])}},
 {t:"era event: shinobi",w:2,run:function(){if(G.villageState.warActive){fbig("War rations again. The mission board is half red-stamped A-ranks.","world");G.villageState.warYear=true}
   else fbig("The village is at peace long enough for people to complain about small things. It is a good sign.","world")}},
 {t:"politics",w:2,run:function(){var roll=Math.random();
   if(roll<.33){G.villageState.stability=clamp(G.villageState.stability+3,0,100);fbig("The council settles a land dispute with the merchants' guild. Steady hands all around.","world")}
   else if(roll<.66){G.villageState.stability=clamp(G.villageState.stability-4,0,100);fbig("A councilor is caught taking foreign coin. Heads roll, quietly, in the administrative sense.","world")}
   else{G.villageState.prosperity=clamp(G.villageState.prosperity+4,0,100);fbig("A new trade road opens through "+G.villageLabel+". Money moves, so does gossip.","world")}}}
,
 {t:"old rival's report",w:2,run:function(){var rv=byKind("rival")[0];if(!rv||!rv.alive)return;
   fbig("A mission report crosses your desk with "+rv.name.split(" ")[0]+"'s name on it. "+pick(["They did well. You read it twice.","They cut a corner you would have cut. You do not report it.","They took a risk you would not have, and it paid."]),"world")}},
 {t:"border skirmish",w:2,run:function(){if(!G.villageState.warActive)return;var win=ri(st("taijutsu")+st("ninjutsu"),st("taijutsu")+st("ninjutsu")+25)>=ri(55,85);
   if(win){rep(2);addRyo(ri(500,2000));fbig("Border contact: a probing party tests the line at night and your squad holds it. The commendation is one line in a report you will never see.","good");addStat("taijutsu",2)}
   else{var ij=pick(INJURIES);addStat("health",-ij.sev*ri(4,10));rep(1);fbig("Border contact goes badly for your squad. You get everyone back, and a "+ij.n+" for yourself.","bad")}}}
];
EVS.adult=[
 {t:"marriage proposal",w:2,run:function(){if(G.family.spouse||!adult())return;var cand=findRel(function(n){return n.alive&&adult()&&n.age>=18&&(n.kind==="friend"||n.kind==="best friend")&&n.rel>=60&&n.rel<95});
   if(!cand.length)return;var n=pick(cand);
   modal("A Question","Romance","You and "+n.name+" have been close for years. Tonight, over "+pick(["dinner at the noodle stand","a walk along the village wall","the last training session of the day"])+", you realize neither of you is getting younger.",
    [{t:"Ask them to marry you",fn:function(){if(n.rel>=70||chance(.6)){G.family.spouse=n;n.kind="spouse";n.rel=clamp(n.rel+15,-100,100);tl(G.age,"Married "+n.name+".");
       fbig("You marry "+n.name+". The village throws a festival for it; your mother cries into her sleeves.","good")}else{relUp(n,-10);fbig("They say no, gently. The noodle stand dinner continues in a different silence.","bad")}}},
     {t:"Not yet"}])}},
 {t:"a child",w:2,run:function(){if(!G.family.spouse||G.family.kids.length>=4)return;
   var g=chance(.5)?"m":"f";var kid=newNPC({first:rollName(g),last:G.last,age:0,gender:g,rel:75,kind:"child",clan:G.clanName});
   kid.village=G.village;G.relationships.push(kid);G.family.kids.push(kid);
   if(G.family.kids.length>=3&&G.family.spouse)award("full_house");
   fbig("A child is born: "+kid.name+". The whole family finds excuses to visit.","big");tl(G.age,"Child born: "+kid.name);
   addStat("happiness",6)}},
 {t:"career crossroads",w:2,run:function(){if(rankRank()<3)return;
   modal("Crossroads","Career","The village offers you a choice of paths: "+pick(["the ANBU selection trials","a teaching post at the Academy","the intelligence division","leading your own squad"]),
    [{t:"Take the offer",fn:function(){if(rankRank()>=4||st("intelligence")>=55||st("chakraControl")>=55){applyCareerOffer()}else{fbig("The offer goes to someone else this cycle. The selectors note your name for later.","bad")}}},
     {t:"Stay on your current path"}])}},
 {t:"family dinner",w:3,run:function(){var ps=byKind("father").concat(byKind("mother"));
   if(!ps.length||!chance(.7))return;relUp(ps[0],4);addStat("happiness",2);
   fbig("Sunday dinner at your parents'. Your "+pick(["father","mother"])+" still criticizes your posture and still means it kindly.")}}
];
EVS.rogue=[
 {t:"hunted",w:4,run:function(){var enc=ri(st("perception")+st("speed"),st("perception")+st("speed")+30)>ri(60,95);
   if(enc){fbig("Hunters catch your trail at dawn. You lose them across "+pick(["a river","the border marshes","a burning farm road"])+", but your face is now on newer posters.","bad");G.bounty+=ri(1000,3000)}
   else fbig("You move by night and sleep in barns. The bounty on your head rises "+money(ri(500,1500))+" without anyone seeing you at all.");}},
 {t:"rogue work",w:3,run:function(){var take=ri(800,2600)*(1+rankRank()*.2);addRyo(take);
   fbig("You take work from whoever pays: "+pick(["escorting a slaver's rival — you refuse that half","stealing a ledger from a tax house","guarding a smuggler's cargo run","a quiet job for a merchant with enemies"])+". Earned "+money(take)+".","bad")}},
 {t:"an offer",w:2,run:function(){modal("A Voice in the Dark","Rogue","A stranger finds you. \"There are others like you. No village, no chains. Or — \" they slide a document across the table, \"— the amnesty brokers in "+pick(["the Land of Fire's capital","a border temple","the demilitarized zone"])+" buy redemption.\"",
    [{t:"Stay the rogue path",d:"bounty grows",fn:function(){G.bounty+=ri(2000,5000);fbig("You burn the document. The stranger nods like they expected it.","bad")}},
     {t:"Seek redemption",d:"return to your village",fn:function(){if(st("loyalty")>=40||chance(.4)){G.rogue=false;G.rank=G.priorRank||"Genin";G.bounty=0;rep(-10);
       fbig("You walk back through the gates you once fled. The interrogation lasts nine days. In the end, they take you back — watched, demoted, alive.","good");if(!includes(G.achievements,"redemption"))award("redemption")}
       else{fbig("The village refuses you. The gate guards do not even draw weapons; your name is simply no longer theirs.","bad")}}}])}}
];
EVS.retired=[
 {t:"quiet days",w:3,run:function(){addStat("happiness",2);fbig(pick(["You teach neighborhood kids to fish and pretend it's training.","You finally read the books you bought during three wars.","Your garden is the best on the street and you tell nobody.","Old students visit with sake and stories."]))}},
 {t:"old wounds",w:2,run:function(){if(chance(.4)){addStat("health",-4);fbig("An old mission wound aches through the rain.","bad")}else fbig("You feel better than the doctors predicted. You decide not to tell them.")}}
];
EVS.early=[
 {t:"first steps",w:3,run:function(){fbig(pick(["You take your first steps across the kitchen floor and immediately fall into the rice pot.","You walk at nine months. Your grandmother declares it an omen.","You take your first steps chasing the family cat, and she allows it."]))}},
 {t:"first birthday",w:3,run:function(){fbig(pick(["Your first birthday: neighbors crowd in, everyone has an opinion on who you resemble.","You receive a wooden shuriken toy on your birthday. Your mother hides it within the hour.","A family friend brings pickled plums for your birthday. You hate them. Tradition continues."]));relUp(pick(byKind("father").concat(byKind("mother")).concat(byKind("guardian"))),3);addStat("happiness",2)}},
 {t:"personality forms",w:3,run:function(){var p=G.personality;addStat(p.f&&p.f.discipline!=null?"discipline":"willpower",1);
   fbig(pick(["You refuse to share your rice bowl all week. The stubborn streak has roots.","You sit at the edge of the yard watching older kids train, memorizing their footwork.","You laugh so hard at the market juggler that a shopkeeper gives you a free candy. The charm has roots.","You cry at thunder until your father holds you through the whole storm. You stop being afraid of storms."]))}},
 {t:"a quiet year",w:2,run:function(){fbig("Mostly naps, mostly rice, mostly being carried. It is a good year.")}},
 {t:"era event: early",w:2,run:function(){if(G.era.war>.1){fbig("You sleep through a distant siren. Your mother does not.","world");addStat("happiness",-3)}
   else fbig("A street puppet troupe performs the founding of the village. You clap at all the wrong moments.","world")}},
 {t:"childhood fever",w:1,run:function(){addStat("health",-5);fbig("A fever keeps the whole house awake for three nights. Your "+pick(["father","mother","guardian"])+" does not sleep either.","bad");relUp(byKind("mother")[0]||byKind("guardian")[0],5)}}
];
EVS.awaken=[
 {t:"clan fireside",w:.8,run:function(){var c=clanOf();if(!c||!c.pas)return;
   fbig("A family elder sets the record straight: the "+c.n+" way is the "+c.pas.n.toLowerCase()+". \u201cIt is not a gift,\u201d they say. \u201cIt is a duty you were born owing.\u201d")}},
 {t:"uzumaki chains",w:.5,run:function(){if(G.clanName!=="Uzumaki"||G.age<10||(G.flags&&G.flags.chains))return;
   G.flags=G.flags||{};G.flags.chains=true;addStat("chakra",3);
   fbig("BLOODLINE EVENT — your chakra coils flare gold and chains of light coil up your forearms before your grandmother\'s eyes. \"There it is,\" she says, quietly proud. The Adamantine Sealing Chains have acknowledged you.","rare");tl(G.age,"The Adamantine Sealing Chains first manifested")}},
 {t:"jugo surge",w:.5,run:function(){if(G.clanName!=="Jugo"||G.age<12||(G.flags&&G.flags.surge))return;
   G.flags=G.flags||{};G.flags.surge=true;addStat("strength",3);addStat("health",2);
   fbig("BLOODLINE EVENT — natural energy floods you mid-training and your arm warps, just for a breath, into something older. You breathe through it. The clan\'s oldest lesson: the surge is a tide, not a master.","rare");tl(G.age,"Survived your first natural-energy surge")}},
 {t:"otsutsuki dream",w:.4,run:function(){if(G.clanName!=="Otsutsuki"||G.age<8)return;
   addStat("chakraControl",2);addStat("willpower",1);
   fbig("You dream in a script nobody has written for a thousand years, and wake with the stroke order still behind your eyes. Whatever your blood remembers, it is starting to remember you.","rare");tl(G.age,"Dreamed a celestial script older than the villages")}},
 {t:"chinoike blood moon",w:.4,run:function(){if(G.clanName!=="Chinoike"||G.age<10)return;
   addStat("genjutsu",2);addStat("perception",1);
   fbig("A red moon rises over the water and your eyes answer it, crimson and humming. Your mother closes every curtain in the house and says nothing for three days.","rare");tl(G.age,"Your eyes answered a blood moon")}},
 {t:"void whisper",w:.35,run:function(){if(G.clanName!=="Vex"||G.age<9)return;
   addStat("perception",2);addStat("willpower",1);
   fbig("BLOODLINE EVENT — something speaks from the space between two breaths. It knows your name because it gave it. You answer in kind, and the air warms half a degree.","rare");tl(G.age,"Answered the whisper of the void")}},
 {t:"primordial waking",w:.35,run:function(){if(G.clanName!=="Rin"||G.age<11)return;
   addStat("chakra",2);addStat("endurance",2);
   fbig("BLOODLINE EVENT — the oldest blood in the register turns over in its sleep. Your shadow stands when you sit. Your grandmother\'s records gain a page no one wrote.","rare");tl(G.age,"The primordial blood stirred")}},
 {t:"chakra awareness",w:3,run:function(){addStat("chakraControl",2);
   fbig(pick(["You feel something warm behind your navel when you concentrate. Nobody taught you to look for it.","A leaf sticks to your palm without glue. You stare at it for an hour.","You push a pebble with your mind. It moves half a finger-width. Nobody believes you.","You can feel when someone stands behind you before you hear them."]),"rare")}},
 {t:"first talent",w:2,run:function(){var s=pick(["strength","speed","agility","perception"]);addStat(s,3);
   fbig("You "+pick(["outrun every kid on the block","climb the shrine roof before anyone notices","count coins at a glance","catch three dragonflies in a row"])+". "+cap(s)+" shows early.","rare")}},
 {t:"neighborhood friend",w:2,run:function(){if(G.relationships.length>26)return;var n=newNPC({age:G.age,kind:"friend",rel:ri(35,60),village:G.village});
   G.relationships.push(n);fbig("You and "+n.name.split(" ")[0]+", "+pick(["the kid from two doors down","the innkeeper's daughter","the blacksmith's son","the quiet one who never talks first"])+", become inseparable over one summer.","good")}},
 {t:"copying seals",w:2,run:function(){addStat("ninjutsu",1);addStat("chakra",1);
   fbig("You copy hand seals off a passing genin behind the academy wall. You get most of them wrong. Your hands remember anyway.")}},
 {t:"guardian's story",w:2,run:function(){var g=byKind("guardian").concat(byKind("grandparent")).concat(byKind("father"))[0];if(!g)return;relUp(g,4);addStat("happiness",2);
   fbig(g.name.split(" ")[0]+" tells the story of "+pick(["the village's founding","the nine-tails night","your clan's greatest shame and greatest pride","the war they survived"])+" until you fall asleep.")}},
 {t:"afraid of the dark",w:2,run:function(){modal("Night","Childhood","There is something under the bed. There is always something under the bed.",
    [{t:"Look under the bed yourself",fn:function(){addStat("willpower",2);addStat("confidence",1);fbig("It is a folded futon. You decide the dark is allowed to be empty.","good")}},
     {t:"Sleep with the lamp on",fn:function(){addStat("happiness",1);fbig("The lamp burns all night. Nobody mentions the oil cost.","")}}])}}
,
 {t:"elder notices",w:2,run:function(){if(!G.clanName)return;rep(1);addStat("chakraControl",2);
   fbig("An elder of the "+G.clanName+" clan watches you play for a long moment, then speaks to your family behind closed doors. Something has been noticed.","rare");tl(G.age,"A clan elder took an interest in you")}},
 {t:"first loss",w:2,run:function(){addStat("willpower",2);
   fbig(pick(["An older kid from the next district flattens you in a field scrap. You get up. Slowly. That part matters.","You lose a footrace to a kid half a head shorter. You start training the next morning.","You lose your first real spar. You shake hands, then practice until your hands blister."]))}}
];
EVS.family=[
 {t:"parent's advice",w:3,run:function(){var p=byKind("father").concat(byKind("mother")).concat(byKind("guardian")).filter(function(n){return n.alive})[0];if(!p)return;
   var k=pick(["discipline","intelligence","patience","willpower"]);addStat(k,1);relUp(p,3);
   fbig(p.name.split(" ")[0]+" sits you down: "+pick(["\"People forgive a mistake faster than they forgive a lie.\"","\"Talent is rent. Discipline is the deed.\"","\"Eat before every argument.\"","\"The ones who shout loudest have already lost the exchange.\"","\"Never train angry. Angry hands lie.\""]))}},
 {t:"sibling challenge",w:2,run:function(){var s=byKind("sibling").filter(function(n){return n.alive});if(!s.length)return;var n=pick(s);
   modal("Yard Challenge","Family",n.name.split(" ")[0]+" plants feet in the yard and points at you: first one to pin the other trains the loser's chores for a month.",
    [{t:"Accept",fn:function(){var win=ri(st("taijutsu")+st("speed"),st("taijutsu")+st("speed")+20)>=ri(30,70);addStat("taijutsu",2);
       if(win){relUp(n,3);fbig("You pin "+n.name.split(" ")[0]+" in the dust. Dinner is served with extra smugness on your side.","good")}
       else{fbig(n.name.split(" ")[0]+" pins you flat. You do their chores and their push-ups rub off on you: "+cap("taijutsu")+" grows anyway.","bad");addStat("taijutsu",1)}}},
     {t:"Refuse the match",fn:function(){relUp(n,-2);fbig("You walk inside. "+n.name.split(" ")[0]+" calls it a coward's victory for a week.","bad")}}])}},
 {t:"family celebration",w:2,run:function(){relUp(byKind("father")[0],3);relUp(byKind("mother")[0],3);addStat("happiness",3);
   fbig(pick(["Your family celebrates "+pick(["your uncle's promotion","the harvest","your grandmother's birthday","your sibling's Academy acceptance"])+". You eat until it is a medical event.","The whole household stays up late telling stories. You are allowed to listen to the adult ones for the first time."]))}},
 {t:"mentor introduction",w:1,run:function(){if(G.age<10||G.relationships.length>28)return;var kin=byKind("grandparent").concat(byKind("guardian")).concat(byKind("father")).filter(function(n){return n.alive})[0];if(!kin)return;
   var n=newNPC({age:ri(30,55),kind:"mentor",rel:ri(25,45),village:G.village});n.rank=pick(["Chunin","Jonin"]);n.skill=ri(7,10);
   G.relationships.push(n);fbig(kin.name.split(" ")[0]+" introduces you to "+n.name+", an old comrade who agrees to keep an eye on your training.","good");tl(G.age,"Mentor: "+n.name)}},
 {t:"family reputation",w:2,run:function(){var w=G.familyWealth;
   if(w==="poor"){addRyo(ri(80,250));fbig("You spend the week helping "+pick(["the neighbors' harvest","the bathhouse with its deliveries","the market with crates"])+". It is child labor by any honest name, and it puts rice on the table.","")}
   else if(w==="wealthy"){rep(2);fbig("Your family name opens a door: a merchant's son invites you to the academy district's better tutors. Connections compound.","good");addStat("intelligence",1)}
   else if(G.clanName){rep(1);fbig("An elder of the "+G.clanName+" clan notes your existence at the year's gathering. Small nod, long consequences.","")}
   else fbig("Your family's name carries "+pick(["quiet respect","no weight at all","the memory of your grandfather's debts"])+". You inherit all three.")}},
 {t:"sibling career",w:2,run:function(){var s=byKind("sibling").filter(function(n){return n.alive&&n.age>=12});if(!s.length)return;var n=pick(s);
   if(chance(.5)){n.rank="Genin";fbig(n.name.split(" ")[0]+" graduates the Academy. The headband sits on the shrine shelf for a week so everyone can see it.","good")}
   else{fbig(n.name.split(" ")[0]+" takes up "+pick(["apprentice work at the forge","the family's ledgers","a post at the mission desk"])+". Not every path wears a headband.")}}}
];
EVS.village=[
 {t:"festival",w:2,run:function(){addStat("happiness",3);
   fbig(pick(["The "+pick(["firefly","harvest","founding-day","lantern"])+" festival fills the streets. You spend your entire allowance in one evening and regret nothing.","A festival weekend: wooden sword stalls, grilled squid, and a tournament you watch from a fence post with your whole chest.","The village dances in the square. Your father pretends he does not. Your father dances."]),"world")}},
 {t:"academy news",w:1,run:function(){if(!inAcademy())return;fbig(pick(["The Academy posts this year's graduation numbers. The class below yours is frighteningly good.","A new instructor arrives from the capital with new methods and old scars.","The Academy roof is repaired after three years of 'temporary' patchwork."]),"world")}},
 {t:"promotion news",w:2,run:function(){fbig(pick(["A jonin from your district is named to the village's honor roll. Everyone suddenly practices harder.","A new chunin class is announced at the ceremony grounds. You know two of the names.","The "+G.villageData.kage+"'s annual address praises the village's newest graduates by name."]),"world")}},
 {t:"trade news",w:2,run:function(){G.villageState.prosperity=clamp(G.villageState.prosperity+ri(-2,3),0,100);
   fbig(pick(["Caravan season: the market is loud, full, and overpriced.","A grain shipment from the coast arrives early. Prices drop and everyone cooks elaborately.","The trade road south is washed out by rains. Merchants grumble; the mission desk quietly adds escort work."]),"world")}},
 {t:"border rumor",w:1,run:function(){if(G.era.war<.08)return;fbig(pick(["Rumor: patrols doubled at the border. Nobody says why out loud.","A wounded shinobi squad passes through the village at night. The ward stays quiet about it.","War council lanterns burn late at the "+G.villageData.kage+"'s tower."]),"world")}}
,
 {t:"wandering sage",w:.4,run:function(){var sp=pick(["strength","speed","intelligence","chakraControl","willpower"]);addStat(sp,3);
   fbig("A wanderer with dusty sandals and a sword wrapped in linen watches you train, corrects one detail of your stance, and is gone before you turn around. "+cap(sp)+" takes a lasting step.","rare");tl(G.age,"A wandering sage corrected your form")}},
 {t:"temple scroll",w:.4,run:function(){addStat("chakraControl",2);addStat("intelligence",2);
   fbig("A monk at the hill temple lets you copy one page of a breathing scroll. It reads like poetry and works like training.","rare")}},
 {t:"sick season",w:.5,run:function(){addStat("health",-4);fbig("A fever goes through the village for a month. The medics work double shifts; the market goes quiet.","bad")}},
 {t:"kage summit",w:.3,run:function(){if(G.eraId==="warring")return;
   fbig("A five-village summit makes the news: "+pick(["trade roads reopen","a joint statement on missing-nin","a border arbitration nobody expected to succeed"])+". The world moves, mostly sideways.","world");
   G.villageState.prosperity=clamp(G.villageState.prosperity+2,0,100)}}
];
EVS.career=[];
/* v5.1.0 career pool: real paths for working adults */
EVS.career=[
 {t:"career review",w:3,run:function(){var r=rankRank();
   if(r<=1){addRyo(ri(100,300));addStat("discipline",1);fbig("Your squad file gets its annual stamp: dependable. Dependable pays the rent and buys the good kunai.")}
   else{var raise=ri(600,1800)*(1+r*.3);addRyo(raise);rep(1);fbig("Annual review: your pay grade steps up "+money(raise)+" a year and your name moves up the duty roster. Someone up top is watching your record.","good")}}},
 {t:"jonin review board",w:2,run:function(){if(rankRank()!==3||G.age<20)return;if(G.missionStats.total<15||G.reputation<55)return;
   modal("Jonin Review Board","Career","Three senior jonin, one closed room, your whole file on the table. A jonin vest is not a reward; it is a sentence you serve for the rest of your career.",
    [{t:"Sit for the review",d:"everything you have built",fn:function(){var pass=(st("taijutsu")+st("ninjutsu")+st("intelligence")+st("leadership")*1.5+G.missionStats.success*2+ri(0,60))>=290;
       if(pass){promote("Jonin","JONIN — The vest is heavy in a way you did not expect. You are trusted with other people's children now.");award("jonin")}
       else{fbig("JONIN REVIEW — Close. The board's note reads 'promising, not yet.' It stings less than it should, because you know they are right.","bad");rep(1)}}},
     {t:"Withdraw the file",d:"come back stronger"}])}},
 {t:"a student's success",w:2,run:function(){var s=(G.students||[]).filter(function(n){return n.alive});if(!s.length)return;var n=pick(s);
   if(n.rank==="Genin"&&chance(.45)){n.rank="Chunin";award("students_bloom");rep(2);fbig("Your student "+n.name.split(" ")[0]+" makes chunin. You pretend to be calm about it. You are not calm about it.","rare")}
   else fbig(n.name.split(" ")[0]+" reports solid progress this year. You read the field report twice and keep it.")}},
 {t:"teaching rotation",w:2,run:function(){if(rankRank()<3)return;if(chance(.5))return;
   modal("The Academy Calls","Career","The Academy asks for senior shinobi to run a training rotation. It pays less than the mission board and matters more.",
    [{t:"Take the rotation",d:"shape the next class",fn:function(){addStat("leadership",3);rep(1);addRyo(ri(200,500));fbig("You spend a season teaching. Twelve children learn to fall without crying about it. You remember every one of them.","good");tl(G.age,"Taught an Academy training rotation")}},
     {t:"Stay on missions"}])}},
 {t:"war field promotion",w:1.5,run:function(){if(!G.villageState.warActive||rankRank()!==2)return;if(!chance(.45))return;
   promote("Chunin","FIELD PROMOTION — Your squad leader falls mid-operation. You take the squad, finish the mission, and the paperwork catches up with you at the hospital.");award("chunin")}},
 {t:"the pension papers",w:1,run:function(){if(G.age<48||G.retired||G.rogue)return;if(rankRank()<2||G.reputation<40)return;
   modal("Pension Papers","Career","The retirement office sends papers you have been ignoring for years. A modest pension, a small house stipend, and mornings that belong to you.",
    [{t:"Sign the papers",d:"retire with honor",fn:function(){G.retired=true;G.retiredYear=G.age;G.career="Retired Shinobi";award("retired");fbig("You sign. The clerk stamps it twice. Walking out, your shoulders sit lower than they have in decades.","good");tl(G.age,"Retired from active service")}},
     {t:"Stay on the roster",d:"not done yet"}])}},
 {t:"civilian path",w:3,run:function(){if(G.rank!=="Civilian")return;
   if(G.age>=25&&chance(.4)){G.career="Shop Owner";addRyo(ri(1500,4000));rep(1);fbig("You open your own "+pick(["noodle stand","tool shop","cloth stall","courier post"])+". The first month is terrifying. The second month is profit.","good");tl(G.age,"Opened a business: "+G.career)}
   else{addRyo(ri(200,600));fbig("Work is steady this year: "+pick(["the harvest comes in heavy","the docks run triple shifts","a merchant takes you on full-time"])+". It is an honest living, and it is yours.")}}},
 {t:"council commendation",w:1,run:function(){if(rankRank()<3||G.reputation<70)return;addRyo(ri(800,2000));rep(2);
   fbig("A commendation arrives under the "+G.villageData.kage+"'s seal: "+pick(["your conduct in the last operation","years of quiet service","a rescue nobody else would attempt"])+". It goes in a frame. Your family pretends not to brag.","rare");tl(G.age,"Received a council commendation")}}
];

/* v5.1.0: deeper life event variety */
EVS.child.push(
 {t:"the hideout",w:2,run:function(){var s=byKind("sibling").filter(function(n){return n.alive});if(!s.length)return;var n=pick(s);
   relUp(n,6);addStat("happiness",3);addStat("discipline",1);
   fbig("You and "+n.name.split(" ")[0]+" build a hideout "+pick(["behind the shrine","under the floorboards of the shed","in the hollow tree by the creek"])+". The password is stupid. You would die for it.","good");tl(G.age,"Built a hideout with "+n.name.split(" ")[0])}},
 {t:"grandmother's garden",w:2,run:function(){var g=byKind("grandparent").concat(byKind("guardian")).filter(function(n){return n.alive})[0];if(!g)return;
   relUp(g,4);addStat("willpower",1);
   fbig(g.name.split(" ")[0]+" puts a trowel in your hand and teaches you patience the long way: "+pick(["one tomato at a time","pulling weeds until your back aches","waiting three weeks for one sprout"])+".")}},
 {t:"the kage's parade",w:1,run:function(){addStat("happiness",3);addStat("confidence",1);
   fbig("The "+G.villageData.kage+"'s parade passes your street. You stand on your toes the whole time. That night you announce, loudly, what you will be someday. The family lets you have it.","world");tl(G.age,"Watched the "+G.villageData.kage+"'s parade from the front row")}}
);
EVS.academy.push(
 {t:"exam season",w:3,run:function(){var a=G.academy;if(!a)return;
   modal("Exam Season","Academy","Written exams in two weeks. The library is packed, the training yards are packed, and everyone has a theory about the right way to prepare.",
    [{t:"Cram the theory",d:"grades up, sleep down",fn:function(){a.grades=clamp((a.grades||0)+3,0,100);addStat("happiness",-1);fbig("You cram until the lanterns burn out. The theory paper bends to you. You sleep for a day and a half after.","good")}},
     {t:"Drill the practicals",d:"body over paper",fn:function(){addStat("taijutsu",2);addStat("agility",1);a.grades=clamp((a.grades||0)+1,0,100);fbig("You drill shuriken and sparring until your hands know the answers. The written part goes fine. The practical goes great.","good")}},
     {t:"Rest properly",d:"steady wins",fn:function(){addStat("health",2);addStat("happiness",2);a.grades=clamp((a.grades||0)+1,0,100);fbig("You sleep eight hours a night like some kind of radical. The exams go exactly as well as you are: solidly.","good")}}])}},
 {t:"rival's challenge",w:2,run:function(){var rv=byKind("rival")[0];if(!rv||!rv.alive)return;
   modal("A Public Challenge","Rivalry",rv.name.split(" ")[0]+" steps into the training circle in front of the whole class and points: 'You. Right now. Unless you have an excuse ready.'",
    [{t:"Step in",fn:function(){var win=ri(st("taijutsu")+st("speed"),st("taijutsu")+st("speed")+25)>=ri(45,80);addStat("taijutsu",2);
       if(win){addStat("confidence",2);rep(1);relUp(rv,2);fbig("You win by a hair in front of everyone. "+rv.name.split(" ")[0]+" shakes your hand hard enough to hurt, which is their way of saying 'next time'.","good")}
       else{addStat("willpower",2);relUp(rv,3);fbig("You lose, cleanly and publicly. "+rv.name.split(" ")[0]+" nods once, almost respectful. You are in the training yard before sunrise tomorrow.","bad")}}},
     {t:"Walk away",fn:function(){relUp(rv,-3);addStat("happiness",-1);fbig("You walk. Some of the class understands. "+rv.name.split(" ")[0]+" does not, and says so for a week.","bad")}}])}},
 {t:"club day",w:2,run:function(){var a=G.academy;if(!a||a.club)return;
   var club=pick(["shuriken club","tactics society","endurance running club","calligraphy and sealwork circle"]);
   a.club=club;var s=pick(["taijutsu","intelligence","endurance","chakraControl"]);addStat(s,2);addStat("happiness",1);
   fbig("You join the "+club+". It meets "+pick(["at dawn, which is a crime","twice a week behind the east hall","in an unofficial classroom that smells like old scrolls"])+". "+cap(s)+" grows and so does your circle.","good");tl(G.age,"Joined the "+club)}},
 {t:"study group",w:2,run:function(){var fr=byKind("friend").filter(function(n){return n.alive});if(!fr.length)return;var n=pick(fr);
   var a=G.academy;if(a)a.grades=clamp((a.grades||0)+2,0,100);relUp(n,4);
   fbig("You and "+n.name.split(" ")[0]+" start a study group that is half studying and half arguing about hand seals. The arguing is the part that works.","good")}}
);
EVS.genin.push(
 {t:"the trust test",w:1.5,run:function(){var s=G.sensei;if(!s||!s.alive)return;
   modal("Sensei's Test","Team",s.name.split(" ")[0]+" schedules a 'routine assessment' at dawn, then takes you two-thirds of the way up the cliff and asks what you would do if the mission and your squad could not both survive.",
    [{t:"Answer honestly",fn:function(){relUp(s,8);addStat("willpower",2);fbig("You answer with the truth, ugly parts included. "+s.name.split(" ")[0]+" nods slowly. Something between you settles into place for good.","good");tl(G.age,"Passed your sensei's trust test")}},
     {t:"Give the textbook answer",fn:function(){relUp(s,2);fbig("You recite the manual. "+s.name.split(" ")[0]+" writes something in your file that you are never allowed to read.","bad")}}])}},
 {t:"first C-rank jitters",w:2,run:function(){if(G.missionStats.total>2)return;
   addStat("discipline",1);fbig("The night before your first C-rank, nobody sleeps. Your teammate laughs too loudly. You polish the same kunai forty times. By morning it is just work, which is the whole secret.","good")}}
);
EVS.shinobi.push(
 {t:"the war draft",w:1.5,run:function(){if(G.age<15||!G.era||G.era.war<.12)return;if(G.villageState&&G.villageState.drafted)return;
   G.villageState=G.villageState||{};G.villageState.drafted=true;
   modal("The Draft","War","Notice comes down through the channels: able shinobi are called to the border. Your name is on the list. It was always going to be.",
    [{t:"Volunteer for the front line",d:"where it counts",fn:function(){rep(3);addStat("taijutsu",2);addStat("willpower",2);
       if(chance(.25)){var ij=pick(INJURIES);addStat("health",-ij.sev*ri(3,7));fbig("The front line teaches its lessons in ink and bandages. You come back with a "+ij.n+" and a field promotion candidacy.","bad")}
       else fbig("You serve at the front for a season. You come back thinner, harder, and with stories you will tell for the rest of your life.","world");tl(G.age,"Served a tour at the front during the war")}},
     {t:"Request garrison duty",d:"hold the walls",fn:function(){addRyo(ri(300,900));addStat("discipline",2);fbig("You hold the walls all winter. Less glory, more boring, and every village needs someone boring and reliable at the gate.","good")}}])}},
 {t:"mentor's passing",w:1,run:function(){var cands=byKind("mentor").concat(byKind("sensei")).filter(function(n){return n.alive&&n.age>=58});if(!cands.length)return;var n=pick(cands);
   n.alive=false;addStat("willpower",3);addStat("happiness",-5);
   fbig(n.name.split(" ")[0]+" dies "+pick(["in the autumn, quietly, between one cup of tea and the next","at their post, the way they always said they wanted","surrounded by students, arguing to the last about your footwork"])+". The village lowers its flags. You carry their last lesson everywhere now.","world");tl(G.age,"Lost "+n.name)}},
 {t:"the scar",w:1,run:function(){if(G.flags&&G.flags.scarred)return;addStat("health",-6);addStat("willpower",4);
   G.flags=G.flags||{};G.flags.scarred=true;
   var spot=pick(["across the ribs","from shoulder to elbow","over the left eye","across both hands"]);
   fbig("The wound closes but the scar stays: "+spot+". It aches before rain. Medic-nin can fix most things; they cannot fix a story your body now tells.","bad");tl(G.age,"Carried out a wound that left a permanent scar")}},
 {t:"a summons",w:1,run:function(){if(rankRank()<3||G.reputation<70)return;
   modal("A Summons","Honor","A courier finds you with a summons: the "+G.villageData.kage+"'s council wants you in the tower, "+pick(["this evening","at first bell","before the third hour"]),
    [{t:"Answer the summons",fn:function(){rep(2);addRyo(ri(500,1500));fbig("The meeting is short. A difficult task, a longer leash, and trust in writing. You walk out taller than you walked in.","rare");tl(G.age,"Summoned to the "+G.villageData.kage+"'s council")}},
     {t:"Send regrets",fn:function(){rep(-1);fbig("You decline. The courier's face says the council does not often hear that word.","bad")}}])}}
);
EVS.adult.push(
 {t:"anniversary",w:3,run:function(){var sp=G.family.spouse;if(!sp||!sp.alive)return;
   relUp(sp,5);addStat("happiness",2);
   fbig("Your anniversary with "+sp.name.split(" ")[0]+": "+pick(["you recreate the first dinner, badly, on purpose","they find the gift you hid three months ago in eleven minutes","you walk the village wall at night like you did before the wedding","the whole family pretends the meal is normal and fails beautifully"])+".","good");tl(G.age,"Celebrated an anniversary with "+sp.name.split(" ")[0])}},
 {t:"spouse's dream",w:2,run:function(){var sp=G.family.spouse;if(!sp||!sp.alive)return;
   var d=pick(["open a tea house","take a posting in the border garrison","train for the chunin exams late","write the village's first cookbook"]);
   modal("Their Dream","Family",sp.name.split(" ")[0]+" brings it up over dinner, the careful way people bring up things they have wanted for years: "+d+".",
    [{t:"Help make it happen",d:"it costs something",fn:function(){addRyo(-500);relUp(sp,8);addStat("happiness",2);fbig("You empty some savings and a lot of evenings into it. Watching them light up is worth both.","good");tl(G.age,"Helped "+sp.name.split(" ")[0]+" pursue their dream")}},
     {t:"Talk them out of it",d:"steady, not kind",fn:function(){relUp(sp,-6);fbig("You list the risks until the dream folds itself away. Dinner ends early. The subject does not come up again, which is not the same as gone.","bad")}}])}},
 {t:"the in-laws",w:2,run:function(){var sp=G.family.spouse;if(!sp||!sp.alive)return;rep(1);addStat("happiness",1);
   fbig("Dinner with "+sp.name.split(" ")[0]+"'s family: "+pick(["your mother-in-law interrogates you like a border guard and hugs you like a son at the door","you catch their father telling your story, slightly improved, to the neighbors","it goes so smoothly someone must have briefed everyone in advance"])+".","good")}}
);
EVS.family.push(
 {t:"the heirloom",w:1.5,run:function(){var g=byKind("grandparent").concat(byKind("guardian")).filter(function(n){return n.alive})[0];if(!g||G.age<10)return;
   addStat("willpower",2);tl(G.age,"Received the family heirloom");
   fbig(g.name.split(" ")[0]+" takes you aside and presses the family's "+pick(["old war tag","worn prayer beads","twin-pronged kunai","travel-worn ledger of names"])+" into your hands. 'It has outlived better people than us. Make it proud.'","rare");}},
 {t:"sibling in trouble",w:2,run:function(){var s=byKind("sibling").filter(function(n){return n.alive&&n.age>=10});if(!s.length)return;var n=pick(s);
   modal("The Broken Window","Family",n.name.split(" ")[0]+" appears at your door, pale: the merchant guild's front window, a thrown kunai, a dare gone sideways. The guild master is asking who did it.",
    [{t:"Cover for them",fn:function(){relUp(n,8);addStat("discipline",-2);addRyo(-ri(50,150));fbig("You take the blame and the fine. "+n.name.split(" ")[0]+" owes you one forever, and knows it.","good")}},
     {t:"March them to apologize",fn:function(){relUp(n,-4);addStat("discipline",3);fbig("You drag them to the guild master yourself. The apology is genuine and mortifying. Your parents hear about both parts.","good")}},
     {t:"Stay out of it",fn:function(){addStat("happiness",-1);fbig("You keep your hands clean. "+n.name.split(" ")[0]+" handles it alone, and something small between you goes quiet for a year.","bad")}}])}}
);
EVS.village.push(
 {t:"the nine-tails night",w:.3,run:function(){if(G.eraId!=="kyubi"||G.village!=="konoha"||G.age<5)return;if(G.flags&&G.flags.foxtale)return;
   G.flags=G.flags||{};G.flags.foxtale=true;addStat("happiness",-6);addStat("willpower",4);
   fbig("One night the sky over the village turns the color of a wound. A fox with nine tails stands taller than the towers, and a yellower light answers it. The village survives, changed. Everyone remembers where they stood; now you do too.","world");tl(G.age,"Survived the Nine-Tails night",true)}},
 {t:"the first academy class",w:.4,run:function(){if(G.eraId!=="founding"||G.age<8||!inAcademy())return;
   addStat("intelligence",2);tl(G.age,"Attended the first academy class of the village");
   fbig("Your class is among the first the new academy has ever taught. The instructor is a war veteran with no textbook, so he teaches what he lived. Nobody misses a word.","world")}},
 {t:"clan raid",w:.4,run:function(){if(G.eraId!=="warring")return;
   modal("Burning at the Edge","War","Smoke rises from the far fields: a rival clan's riders, here for grain and for the message burning grain sends.",
    [{t:"Stand and fight",fn:function(){var win=ri(st("taijutsu")+st("speed"),st("taijutsu")+st("speed")+20)>=ri(50,80);
       if(win){addStat("taijutsu",3);rep(2);fbig("You fight at the treeline with the adults. The riders take nothing and leave two of their own. The village learns your name early.","good");tl(G.age,"Helped repel a rival clan's raid")}
       else{var ij=pick(INJURIES);addStat("health",-ij.sev*ri(3,8));addStat("willpower",3);fbig("You hold longer than anyone expected, and pay for it: a "+ij.n+". The granary survives. So do you.","bad")}}},
     {t:"Get the little ones to the cellar",fn:function(){addStat("discipline",2);relUp(byKind("mother")[0]||byKind("guardian")[0]||{name:"The village"},4);fbig("You spend the raid in the dark with the smallest children, keeping them quiet with a story you invent as you go. Every adult notices who kept the children calm.","good")}}])}},
 {t:"akatsuki rumor",w:.3,run:function(){if(G.eraId!=="shippuden")return;
   addStat("perception",1);fbig("Travelers whisper at the inn about robed strangers with cloud-marked cloaks "+pick(["asking after jinchuriki","buying information and not paying","seen twice where rumors say once"])+". The mission board quietly redoubles the escort rates.","world")}}
);
EVS.awaken.push(
 {t:"dormant bloodline stirs",w:.25,run:function(){if(!G.kkg||G.kkgKnown)return;
   if(tryKGAwake())return;
   fbig("You dream of a pattern you cannot name and wake with your hands folded in a seal nobody taught you. Whatever sleeps in your blood turns over and goes back to sleep. For now.","rare")}}
);

/* ============================ jutsu & training ============================ */
function reqText(j){
  var parts=[];
  if(j.req)for(var k in j.req)parts.push(cap(k)+" "+j.req[k]);
  if(j.nature)parts.push(j.nature+" nature");
  if(j.clan)parts.push(j.clan+" clan");
  return parts.join(", ")||"basic skill";
}
function canLearn(j){
  if(j.req)for(var k in j.req){if((st(k)||0)<j.req[k])return false}
  if(j.nature&&j.nature!==G.nature)return false;
  if(j.clan&&j.clan!==G.clanName)return false;
  if(j.cat==="Medical"&&st("medical")<20&&j.tier>=2)return false;
  return true;
}
function learnJutsu(j){
  if(!canLearn(j)){toast("Not yet: requires "+reqText(j));return}
  G.jutsu[j.id]={mastery:0,progress:0};
  addStat(j.cat==="Medical"?"medical":j.cat==="Kenjutsu"?"kenjutsu":j.cat==="Clan"?"ninjutsu":"ninjutsu",3);
  fbig("You learn the "+j.n+".","good");tl(G.age,"Learned "+j.n);
}
function trainJutsu(j){
  var rec=G.jutsu[j.id];if(!rec)return;
  var gain=1+Math.floor(st("intelligence")/40)+st("talent")*.1;
  rec.progress+=gain;
  var need=60+rec.mastery*40;
  if(rec.progress>=need&&rec.mastery<j.masteryMax){
    rec.mastery++;rec.progress=0;
    fbig(j.n+" reaches "+["","practiced","mastered","perfected"][rec.mastery]+" level.","good");
    if(rec.mastery>=3&&j.nature&&!includes(G.achievements,"nature_master"))award("nature_master");
    if(rec.mastery>=3&&G.age<15&&!includes(G.achievements,"prodigy")){
      var mastered=Object.keys(G.jutsu).filter(function(id){var j2=JUTSU.find(function(x){return x.id===id});return G.jutsu[id].mastery>=3}).length;
      if(mastered>=3)award("prodigy");
    }
    addStat(j.nature?"ninjutsu":j.cat==="Medical"?"medical":j.cat==="Kenjutsu"?"kenjutsu":"chakraControl",2);
  }
  addStat("chakraControl",1);
}
function trainGain(k,base){
  var c=(G.trained[k]||0);G.trained[k]=c+1;
  var g=Math.max(1,Math.round(base/(1+c*.25)));
  g=Math.max(1,Math.round(g*clanTrainMult(k)));
  addStat(k,g);
  if(G.fatigue>=80&&chance(.15*(1-Math.min(.75,clanRelNum("resist"))))){addStat("health",-3);fbig("You train through exhaustion and pay for it: something pulls in your shoulder.","bad")}
  return g;
}
function jutsuListForTab(){
  return JUTSU.map(function(j){
    var rec=G.jutsu[j.id];
    var can=canLearn(j);
    return {j:j,rec:rec,can:can};
  });
}

/* ============================ missions (narrative) ============================ */
function availRanks(){
  var r=rankRank();
  if(G.rogue)return ["B","A","S"];
  if(r===0)return [];
  if(r===1)return ["D"];
  if(r===2)return ["D","C"];
  if(r===3)return ["C","B","A"];
  return ["B","A","S"];
}
function startMission(rank){
  var tpl=pick(MTPL.filter(function(m){return includes(m.ranks,rank)}));
  if(!tpl){ /* generic */
    var type=pick(MISSION_TYPES[rank]);
    tpl={id:"generic",t:type,ranks:[rank],
      brief:({D:"A routine village task that nobody important wants to do.",C:"A real mission beyond the walls, with real weather.",
        B:"Something the council wants handled quietly.",A:"A knife's-edge operation the village cannot be seen running.",S:"A matter the Kage discusses personally."})[rank],
      prep:[["Prepare carefully","you go in ready"],["Move immediately","you beat expectations to the field"]],
      dec:[{t:"Commit fully",q:.5},{t:"Hold back and assess",q:.45,alt:"your caution pays off once"}],
      good:"The mission ends cleanly. Your report gets a short approving note.",
      mid:"It ends mostly clean, with one expensive lesson attached.",
      bad:"It goes sideways. You get out, but not everything does."};
  }
  var pay={D:ri(80,200),C:ri(400,900),B:ri(2000,4500),A:ri(9000,18000),S:ri(35000,70000)}[rank];
  var squad=[].concat(G.teammates).filter(function(n){return n.alive});
  var teamScore=squad.reduce(function(s,n){return s+n.skill},0)+(G.sensei&&G.sensei.alive&&rank!=="S"?G.sensei.skill*.5:0);
  modal("Mission Briefing","Mission — "+rank+"-Rank","“"+tpl.t+"”\n\n"+tpl.brief+(G.rogue?"\n\nNo village stands behind this one. There is only you and the target.":"")+"\n\nReward: "+money(pay)+(squad.length?"\nSquad: "+squad.map(function(n){return n.name.split(" ")[0]}).join(", "):"")+(G.sensei&&G.sensei.alive&&rank!=="S"?" · Sensei: "+G.sensei.name.split(" ")[0]:"")+(G.spec?"\nSpecialization: "+specName():"")+(G.fatigue>=70?"\nYou go in exhausted. It will cost you.":""),
    tpl.prep.map(function(p,i){return {t:p[0],d:p[1],i:i}}).concat([{t:"Decline the mission",decline:true}]),
    function(choice){
      if(!choice||choice.decline){fbig("You decline the "+rank+"-rank mission.");render();return}
      runMission(Object.assign({},choice,{rank:rank,pay:pay,team:teamScore}),tpl);
    });
}
function runMission(choice,tpl){
  var rank=choice.rank,pay=choice.pay,teamScore=choice.team||0;
  var prepBonus=choice.i===0?2:0;
  var self=Math.round(st("taijutsu")*.25+st("ninjutsu")*.25+st("intelligence")*.2+st("chakraControl")*.15+st("endurance")*.15);
  if(G.spec==="combat"||G.spec==="intel")self+=3;else if(G.spec==="tracking")self+=2;else if(G.spec==="support")self+=1;
  if(G.fatigue>=70)self-=5;
  if(window.FATE_missionSelf)self+=FATE_missionSelf(rank);
  self+=clanRelNum("mission");
  var roll=ri(1,100);
  var target=({D:25,C:45,B:60,A:72,S:82}[rank])-prepBonus-Math.floor(teamScore*.8);
  var ok=roll+self>=target;
  var dec=pick(tpl.dec);
  modal("In the Field","Mission","The mission is underway. "+(rank==="S"?"Everything about this operation is one bad decision from catastrophe.":"")+tpl.brief+"\n\nA decision point: "+dec.t,
    tpl.dec.map(function(d,idx){return {t:d.t,d:d.alt||null,idx:idx}}).concat([{t:"Abort and withdraw",abort:true}]),
    function(sel){
      if(sel&&sel.abort){rep(-1);fbig("You withdraw from the field. The mission goes uncompleted.","bad");render();return}
      var dq=sel&&sel.idx!=null?tpl.dec[sel.idx].q:.4;
      var total=roll*.4+self*.4+teamScore*3+(sel&&sel.idx!=null?dq*30:0);
      var outcome=total>=target+18?"great":ok?"good":total>=target-15?"partial":"bad";
      finishMission(tpl,rank,pay,outcome);
      render();
    });
}
function finishMission(tpl,rank,pay,outcome){
  pay=pay||0;
  var ms=G.missionStats;
  var outTxt="",outCls="";
  ms.total++;ms.byRank[rank]=(ms.byRank[rank]||0)+1;
  if(outcome==="great"||outcome==="good"){
    addRyo(pay);rep(rank==="D"?1:rank==="C"?2:rank==="B"?4:rank==="A"?7:12);
    ms.success++;ms.streak++;ms.best=Math.max(ms.best,ms.streak);
    outTxt=(tpl.t?tpl.t+" — ":"")+"MISSION COMPLETE ("+rank+"-rank). "+tpl.good;outCls="good";fbig(outTxt,outCls);
    addStat("happiness",3);addStat("reputation",0);
    if(rank==="S"&&!includes(G.achievements,"s_ranked"))award("s_ranked");
    if(!includes(G.achievements,"first_mission"))award("first_mission");
    if(ms.streak>=10&&!includes(G.achievements,"perfect_record"))award("perfect_record");
    if(chance(.3)){var item=pick(Object.keys(ITEMS));G.inventory.push(item);fbig("You recover "+ITEMS[item].n+" as salvage.","good")}
  }else if(outcome==="partial"){
    var half=Math.round(pay*.5);addRyo(half);rep(rank==="D"?0:rank==="C"?1:rank==="B"?2:rank==="A"?3:5);
    ms.success++;ms.streak=0;
    outTxt="MISSION PARTIAL — "+tpl.mid;outCls="";fbig(outTxt,outCls);
  }else{
    ms.fail++;ms.streak=0;
    rep(rank==="D"?-1:rank==="C"?-2:rank==="B"?-4:rank==="A"?-6:-10);
    outTxt="MISSION FAILED — "+tpl.bad;outCls="bad";fbig(outTxt,outCls);
    var inj=pick(INJURIES);addStat("health",-Math.round(inj.sev*(G.spec==="medical"?.6:1)*ri(6,14)));addStat("happiness",-3);
    fbig("You take a "+inj.n+" in the process.","bad");
  }
  G.fatigue=clamp(G.fatigue+ri(15,30),0,100);
  if(rank!=="D")addStat("taijutsu",1);
  if(rank==="S"&&G.rank==="Jonin"&&st("reputation")>=75&&chance(.25))promote("Kage","The council convenes an emergency session. When it ends, you are the Kage.");
  if(outTxt&&typeof eventResult==="function")eventResult(outTxt,outCls);
}

/* ============================ academy, career, promotion ============================ */
function enrollAcademy(){
  var aAge=G.villageData.academyAge;
  G.academy={enrolled:true,sensei:pick(["Daichi","Katsuro","Emi","Haruto","Rin","Yukio","Mei"])+" "+pick(SURNAMES),grades:50,attendance:60,years:0,subj:{chakra:ri(20,50),taijutsu:ri(20,50),shuriken:ri(20,50),tactics:ri(20,50),history:ri(20,50),stealth:ri(20,50),teamwork:ri(20,50)}};
  G.rank="Academy Student";G.career="Academy Student";
  fbig("You enroll in the Academy at age "+aAge+". Instructor "+G.academy.sensei+" takes attendance like it's a blood oath.","big");
  tl(aAge,"Enrolled in the Academy");
}
var SPECS=[
 {id:"combat",n:"Combat",d:"front-line specialist"},
 {id:"tracking",n:"Tracking",d:"hunter of marks"},
 {id:"medical",n:"Medical",d:"healer"},
 {id:"intel",n:"Intelligence",d:"analyst and codebreaker"},
 {id:"support",n:"Support",d:"the one who holds the team together"},
 {id:"instructor",n:"Instructor Track",d:"the one who builds the next generation"}
];
function specName(){var s=SPECS.find(function(x){return x.id===G.spec});return s?s.n:null}
function offerSpec(){
  if(G.spec)return;
  modal("Specialization","Career","The assignment desk asks which path you intend to walk. It goes in your file, and your file follows you.",
    SPECS.map(function(sp){return {t:sp.n,d:sp.d,fn:function(){G.spec=sp.id;tl(G.age,"Specialization: "+sp.n);
      fbig("Specialization recorded: "+sp.n+". "+pick(["The desk clerk stamps your file twice, impressed or alarmed.","Your sensei reads the form and raises one eyebrow.","It suits you. Or it will, in ten years."]),"good")}}}));
}
var GRAD=null;
function graduateExam(forced){
  var a=G.academy;
  var text="Final exams are posted: the written chakra theory paper, the shuriken range, the taijutsu circle, and the clone technique in front of the whole class."+(forced?"":" Instructor "+(a.sensei||"Daichi")+" thinks you could take them a year early.");
  modal("Graduation Assessment","Academy",text,forced?[{t:"Take the exam",fn:function(){runGraduation()}}]:[
    {t:"Take the exam early",d:"jump the gun",fn:function(){runGraduation()}},
    {t:"Wait another year",d:"repeat the year, train more"}]);
}
function runGraduation(){
  var a=G.academy;
  var score=a.grades*.5+st("taijutsu")*.2+st("ninjutsu")*.2+st("chakraControl")*.3+st("talent")*1.5+st("intelligence")*.15;
  a.enrolled=false;
  var order=ri(1,30);
  if(score>=55){
    G.rank="Genin";G.career="Genin";
    tl(G.age,"Graduated the Academy");
    if(score>=80){fbig("GRADUATION — SPECIAL RECOGNITION. The examiners flag your file for accelerated development and your name goes up on the Academy board in gold ink.","rare");tl(G.age,"Graduated with special recognition")}
    else if(order<=2){award("top_student");fbig("GRADUATION — You rank "+(order===1?"FIRST":"second")+" in the class. The headband ceremony is short; your parents are loud.","rare")}
    else fbig("GRADUATION — You tie your headband and try not to shake. You are a genin of "+G.villageName+".","good");
    if(G.age<G.villageData.academyAge+4){if(!includes(G.achievements,"early_grad"))award("early_grad");fbig("You graduate years ahead of your age group. The other parents look at you differently now.","rare")}
    assignTeam();
    offerSpec();
  }else if(G.age>=16){
    a.enrolled=false;G.rank="Civilian";G.career=pick(["farmhand","shop clerk","courier","dock worker"]);
    fbig("You age out of the Academy without graduating. Life continues outside the headband: work, family, quieter streets.","bad");
    tl(G.age,"Left the Academy without graduating");
  }else{
    a.enrolled=true;a.years++;
    fbig("You fail the graduation assessment and repeat the year. The classroom looks smaller the second time.","bad");
  }
}
function assignTeam(){
  var sensei=newNPC({age:ri(24,42),kind:"sensei",rel:ri(35,60),village:G.village});sensei.rank="Jonin";sensei.skill=ri(7,10);
  G.relationships.push(sensei);G.sensei=sensei;
  G.teammates=[];
  for(var i=0;i<2;i++){var t=newNPC({age:G.age,kind:"teammate",rel:ri(25,55),village:G.village});t.rank="Genin";t.skill=ri(3,8);
    G.relationships.push(t);G.teammates.push(t)}
  fbig("SQUAD ASSIGNMENT — Team "+ri(3,40)+": you, "+G.teammates[0].name.split(" ")[0]+", "+G.teammates[1].name.split(" ")[0]+". Sensei: "+sensei.name+".","big");
  tl(G.age,"Assigned to a genin squad under "+sensei.name);
}
function startChunin(){
  G.examDone=true;
  var a=G.academy||{};
  var p1=st("taijutsu")+st("ninjutsu")+ri(0,40);
  var p2=st("intelligence")*2+ri(0,50);
  var p3=st("discipline")+st("leadership")+ri(0,40);
  var pass=p1>=90&&p2>=90&&p3>=70;
  tl(G.age,"Entered the Chunin Exams");
  if(pass){
    promote("Chunin","CHUNIN EXAMS — You pass all three stages. The proctor reads your name and something in your chest settles.");
    award("chunin");
  }else{
    var near=p1+p2+p3>=270;
    if(near){fbig("CHUNIN EXAMS — You fall in the final stage, close enough that the proctors note your file for early consideration next cycle.","bad")}
    else fbig("CHUNIN EXAMS — You are eliminated in "+pick(["the forest stage","the tournament bracket","the written round"])+". Your squad comforts you badly and honestly.","bad");
    G.examDone=true;
  }
}
function applyCareerOffer(){
  var opts=[];
  if(rankRank()>=4)opts.push(["ANBU","You accept the mask. Your name stops appearing on mission rosters.","anbu"]);
  else opts.push(["Squad Leader","You take your own genin squad.","mentor"]);
  opts.push(["Instructor","You teach the next class of Academy students.",""]);
  opts.push(["Intelligence Division","You join the analysts and codebreakers.",""]);
  var o=pick(opts);
  G.career=o[0];
  if(o[0]==="ANBU"){G.rank="ANBU";award("anbu")}
  if(o[0]==="Squad Leader"){award("mentor");
    var s1=newNPC({age:ri(12,13),kind:"student",rel:45,village:G.village});s1.rank="Genin";s1.skill=ri(3,6);
    var s2=newNPC({age:ri(12,14),kind:"student",rel:40,village:G.village});s2.rank="Genin";s2.skill=ri(3,6);
    G.students=[s1,s2];G.relationships.push(s1,s2);
    fbig("SQUAD ASSIGNMENT — Your own genin squad: "+s1.name.split(" ")[0]+" and "+s2.name.split(" ")[0]+". Now you are the one who sighs at training.","good");
  }
  fbig("CAREER — "+o[1],o[2]==="anbu"?"rare":"good");
  tl(G.age,"Career: "+o[0]);
}
function promote(rank,msg){
  G.rank=rank;G.career=rank;
  if(G.legacyParent&&rankRank()>=3&&!includes(G.achievements,"legacy_keeper"))award("legacy_keeper");
  if(msg)fbig(msg,"good");tl(G.age,"Promoted to "+rank);
  rep(rank==="Chunin"?5:rank==="Jonin"?8:rank==="Kage"?30:2);
  addStat("confidence",3);
  if(rank==="Jonin")award("jonin");
  if(rank==="Kage"){award("kage");G.villageState.kage=G.name+" ("+G.villageData.kage+")"}
}
function careerProgress(){
  var r=rankRank();
  if(G.rogue||G.retired)return;
  if(G.rank==="Genin"&&G.age>=16&&st("reputation")>=45&&(G.missionStats.byRank.C||0)>=3&&chance(.5)){
    modal("Promotion Review","Career","A jonin review board has flagged your file: mission record, field reports, and a quiet nod from your sensei. Chunin consideration, outside exam season.",
      [{t:"Accept the promotion",fn:function(){promote("Chunin","PROMOTED — The headband is stitched. You are a chunin of "+G.villageName+".");award("chunin")}},
       {t:"Take the exams properly instead",d:"wait for exam season"}]);
  }
  if(G.rank==="Chunin"&&G.age>=19&&(G.missionStats.byRank.B||0)>=3&&(st("reputation")>=55)&&chance(.35)){
    modal("Special Promotion","Career","For sustained field excellence, the council moves your name to the jonin registry.",
      [{t:"Accept",fn:function(){promote("Jonin","PROMOTED — jonin. The flak jacket fits heavier than you expected.")}},
       {t:"Decline for now"}]);
  }
  if(G.rank==="Jonin"&&!G.rogue&&G.age>=22&&st("reputation")>=60&&chance(.2)&&rankRank()===4){
    modal("ANBU Selection","Career","A robed figure leaves a black-ops summons at your door. No names are used. Nobody will ever discuss this meeting.",
      [{t:"Accept the mask",fn:function(){promote("ANBU","ANBU — You are given a porcelain mask and a list of names. One of them is familiar.","rare");award("anbu")}},
       {t:"Stay jonin"}]);
  }
  if(G.clanName&&G.age>=30&&rankRank()>=3&&!G.clanLeader&&chance(.08)){
    G.clanLeader=true;award("clan_leader");
    fbig("CLAN LEADERSHIP — The "+G.clanName+" elders name you clan head.","rare");tl(G.age,"Named head of the "+G.clanName+" clan");
  }
  if(G.rank!=="Kage"&&rankRank()>=4&&G.age>=35&&st("reputation")>=80&&G.villageState.influence>=50&&chance(.06)){
    modal("Kage Consideration","The council's whispers","Your name is in the room when the council discusses succession.",
      [{t:"Pursue it",fn:function(){if(st("reputation")>=85||chance(.5)){promote("Kage","THE "+G.villageData.kage.toUpperCase()+" — The hat is heavier than any flak jacket. You are "+G.villageData.kage+" now.")}
        else fbig("The council chooses another. You keep your rank and your pride, mostly.","bad")}},
       {t:"Step back"}]);
  }
  if(adult()&&rankRank()>=2&&G.age>=28&&!G.priorRank)G.priorRank=G.rank;
}

/* ============================ rogue path ============================ */
function goRogue(reason){
  G.rogue=true;G.priorRank=G.rank;G.rank="Rogue";G.rogueYears=0;
  G.bounty=Math.max(3000,rankRank()*4000);
  if(G.sensei)relUp(G.sensei,-40);
  G.teammates.forEach(function(t){relUp(t,-30)});
  byKind("father").concat(byKind("mother")).forEach(function(p){relUp(p,-25)});
  rep(-15);
  fbig("YOU ABANDON THE VILLAGE — "+reason+" Your face goes on the boards by week's end: "+money(G.bounty)+" bounty.","big");
  tl(G.age,"Went missing-nin. "+reason);
}
function rogueOffer(){
  if(G.rogue||G.retired||rankRank()<1)return;
  modal("The other road","Crossroads","You stand at the village gate at dusk, four days after "+pick(["the tribunal blames you for the failed operation","your teammate's funeral","the council voids your mission report","a letter arrives with your father's debts attached"])+". Nobody is watching. The road out is open.",
    [{t:"Walk away and go missing-nin",d:"no return guaranteed",fn:function(){goRogue(pick(["Betrayal stings worse than exile.","The village stopped being home before you stopped being theirs.","You cannot un-see what the council buried."]))}},
     {t:"Stay",d:"the road stays open another year"}]);
}

/* ============================ age up ============================ */
function luck(){return st("luck")}
function npcProgress(){
  byKind("sibling").concat(byKind("child")).forEach(function(n){if(n.alive)n.age++});
  G.relationships.forEach(function(n){
    if(!n.alive)return;
    var k=n.kind;
    if(k!=="friend"&&k!=="best friend"&&k!=="rival"&&k!=="teammate"&&k!=="student")return;
    if(chance(.5))n.skill=clamp((n.skill||3)+1,0,10);
    if(n.rank==="Academy Student"&&n.age>=12&&chance(.45)){n.rank="Genin";if(k==="rival")feed(n.name.split(" ")[0]+" graduates the Academy ahead of schedule. The gap widens.","world")}
    else if(n.rank==="Genin"&&n.age>=16&&chance(.22)){n.rank="Chunin";
      if(k==="rival")feed(n.name.split(" ")[0]+" makes chunin. The rivalry sharpens.","world");
      if(k==="teammate")fbig(n.name.split(" ")[0]+" makes chunin and moves to a new squad. You spar on holidays now.","world")}
    else if(n.rank==="Chunin"&&n.age>=22&&chance(.12))n.rank="Jonin";
    if(k==="student"&&n.rank==="Chunin"&&!includes(G.achievements,"students_bloom"))award("students_bloom");
  });
  var rv=byKind("rival")[0];
  if(rv&&rv.alive&&chance(.1))fbig("Your rival "+rv.name.split(" ")[0]+" "+pick(["survives an encounter that would have ended anyone else","earns a mention in the mission reports","turns down an offer you would have taken"])+".","world");
}
function ageUp(){
  try{if(G&&G.rpg){G.rpg.fatigue=Math.max(0,(G.rpg.fatigue||0)-40);G.rpg.trainCount={}}else if(G){rpgInit(G)}}catch(e){}
  if(!G||!G.alive)return;
  var acts=AGEUP_SPENT;if(acts>0){AGEUP_SPENT=0}
  G.age++;
  npcAge();
  npcProgress();
  G.villageState.warYear=false;
  /* era conflict cadence */
  var eraWar=G.era.war;
  if(G.eraId==="naruto"||G.eraId==="shippuden"){if(G.age%7===0)G.villageState.warActive=chance(.5)}
  else if(chance(eraWar*.7))G.villageState.warActive=true;
  else if(chance(.3))G.villageState.warActive=false;
  /* natural drift */
  addStat("happiness",chance(.5)?1:-1);
  if(G.fatigue>0)fatigueHeal(20);
  if(st("health")<70)addStat("health",2);
  if(G.age<=5){addStat("strength",1);addStat("intelligence",1)}
  else if(inAcademy()){G.academy.years++;addStat("taijutsu",2);addStat("chakraControl",2);addStat("intelligence",1);
    G.academy.attendance=clamp((G.academy.attendance||60)+ri(-5,6),0,100);
    if(G.age>=G.villageData.academyAge+5||st("ninjutsu")>=35)GRAD={forced:G.age>=G.villageData.academyAge+5};
  }
  else if(G.rank==="Genin"){addStat("taijutsu",ri(1,3));addStat("ninjutsu",ri(1,3));if(G.spec==="combat")addStat("taijutsu",1);else if(G.spec==="medical")addStat("medical",1);else if(G.spec==="intel")addStat("intelligence",1);else if(G.spec==="tracking")addStat("perception",1);else if(G.spec==="instructor")addStat("leadership",1)}
  else if(rankRank()>=3){addStat("ninjutsu",1);addStat("intelligence",1);if(chance(.3))addStat("leadership",2)}
  if(G.age>30){if(chance(.3))addStat("strength",-1);if(chance(.25))addStat("speed",-1);if(G.age>50&&chance(.4))addStat("endurance",-1)}
  if(G.retired&&G.age>60&&chance(.25))addStat("health",-3);
  /* NPC aging & deaths */
  G.relationships.forEach(npcPass);
  var kid=byKind("child")[0];
  if(kid&&kid.age>=18&&!includes(G.achievements,"family_man"))award("family_man");
  if(G.age>=90&&!includes(G.achievements,"centenarian"))award("centenarian");
  var gdn=byKind("guardian").concat(byKind("grandparent")).filter(function(n){return n.alive})[0];if(gdn&&gdn.rel>=90&&!includes(G.achievements,"guardian_bond"))award("guardian_bond");
  if(G.villageState.warActive&&rankRank()>=1&&!includes(G.achievements,"war_survivor")&&G.age>12)award("war_survivor");
  /* discovery */
  var woke=tryKGAwake();
  if(!woke)tryNatureDiscover();
  /* school enrollment trigger */
  if(G.age===G.villageData.academyAge&&!inAcademy()&&G.rank==="Child"){enrollAcademy();try{if(window.LIFE&&LIFE.seedClassroom)LIFE.seedClassroom()}catch(e){}}
  if(G.rank==="Newborn"&&G.age===1){G.rank="Child";G.career="Child of the "+(G.clanName||G.last)+" Household"}
  /* retirement offer */
  if(G.age>=48&&rankRank()>=3&&!G.retired&&!G.rogue&&chance(.25)){
    modal("The Long Service Letter","Career","After years of service, the retirement office writes: full pension, honors, a house on the hill if you want it. Or keep the vest another decade.",
      [{t:"Retire",fn:function(){G.retired=true;G.retiredYear=G.age;G.career="Retired Shinobi";award("retired");fbig("You hang up the vest. The pension is modest; the mornings are yours.","good");tl(G.age,"Retired from active service")}},
       {t:"Keep serving"}]);
  }
  if(G.age>=55&&!G.retired&&!G.rogue&&rankRank()>=1&&chance(.15)){G.retired=true;G.retiredYear=G.age;G.career="Retired Shinobi";
    fbig("Age and knees reach an agreement. You retire from active service.","");tl(G.age,"Retired from active service")}
  /* rogue year */
  if(G.rogue){G.rogueYears++;if(G.rogueYears>8&&chance(.1)){dieOf("a hunter's blade")}}
  /* death by age */
  var deathRisk=0;
  if(G.age>55)deathRisk=(G.age-55)*.004;
  if(G.age>75)deathRisk=(G.age-55)*.009;
  if(st("health")<40)deathRisk+=.08;
  if(G.villageState.warActive&&rankRank()>=1&&!G.retired)deathRisk+=.03;
  if(chance(deathRisk))dieOf(G.age>70?"old age":pick(["illness","a mission gone wrong","an illness the medics could not break"]));
  /* events */
  if(G.alive){
    if(window.LIFE&&LIFE.tick){LIFE.tick()}
    else{
      var er=Math.random();var nEv=er<.16?0:er<.8?1:2;
      var fired=0;
      while(fired<nEv){
        var e=pickEvent();if(!e)break;
        e.run();fired++;
      }
      if(!fired)fbig("A quiet year. Not every year needs to be loud.");
    }
    /* career progression offers */
    if(!G.rogue)careerProgress();
    if(!G.rogue&&rankRank()>=2&&G.age>=13&&chance(.05))rogueOffer();
    /* influence */
    if(st("reputation")>=60)G.villageState.influence=clamp(G.villageState.influence+2,0,100);
    /* achievements check */
    if(st("reputation")>=90&&!includes(G.achievements,"village_hero"))award("village_hero");
    if(G.rank==="Jonin"&&st("reputation")>=80&&!includes(G.achievements,"legend"))award("legend");
    if(G.bounty>=50000&&!includes(G.achievements,"rogue_legend"))award("rogue_legend");
    if(G.bestFriend&&!G.bestFriendAwarded){var bf=findRel(function(n){return n.id===G.bestFriend})[0];
      if(bf&&!bf.alive){G.bestFriendAwarded=true;fbig("You visit the grave of your best friend. Some weights never redistribute.","bad")}}
    if(G.sensei&&!G.sensei.alive)G.sensei=null;
    if(GRAD&&G.alive&&inAcademy()){var gr=GRAD;GRAD=null;graduateExam(gr.forced)}
    else GRAD=null;
    saveSlot("auto");
  }
  render();
}
var AGEUP_SPENT=0;
function dieOf(cause){
  if(!G||!G.alive)return;
  G.alive=false;G.deathCause=cause;
  feed("You die at age "+G.age+" of "+cause+".","bad");
  showDeath();
}

/* ============================ achievements ============================ */
function award(id){
  if(includes(G.achievements,id))return;
  G.achievements.push(id);
  var a=ACHIEVEMENTS.find(function(x){return x.id===id});
  if(a){fbig("ACHIEVEMENT — "+a.n,"ach");toast("Achievement: "+a.n)}
  var glob=loadJSON(LS_ACH,{});
  glob[id]=(glob[id]||0)+1;
  saveJSON(LS_ACH,glob);
}

/* ============================ saves ============================ */
function slots(){return loadJSON(LS_SLOTS,[])}
function saveSlot(idx,data){
  var all=slots();
  if(!data){
    data={g:serializeG(),when:new Date().toISOString()};
  }
  all[idx]=data;
  saveJSON(LS_SLOTS,all);
}
function serializeG(){
  var c=G;
  var out={v:3,cid:c.cid,born:c.born,first:c.first,last:c.last,gender:c.gender,eraId:c.eraId,village:c.village,clanName:c.clanName,
    familyWealth:c.familyWealth,familyHistory:c.familyHistory,personality:c.personality,latentKG:c.latentKG,
    kkg:c.kkg,kkgKnown:c.kkgKnown,nature:c.nature,natureKnown:c.natureKnown,secondary:c.secondary,
    age:c.age,alive:c.alive,rank:c.rank,career:c.career,stats:c.stats,ryo:c.ryo,fatigue:c.fatigue,
    academy:c.academy,missionStats:c.missionStats,reputation:c.reputation,bounty:c.bounty,rogue:c.rogue,
    rogueYears:c.rogueYears,priorRank:c.priorRank,achievements:c.achievements,feed:c.feed,timeline:c.timeline,
    villageState:c.villageState,retired:c.retired,retiredYear:c.retiredYear,bestFriend:c.bestFriend,
    clanLeader:c.clanLeader,examDone:c.examDone,jutsu:c.jutsu,inventory:c.inventory,deathCause:c.deathCause,
    relationships:c.relationships,teammateIds:c.teammates.map(function(n){return n.id}),
    senseiId:c.sensei?c.sensei.id:null,familyIds:{spouse:c.family.spouse?c.family.spouse.id:null,kids:c.family.kids.map(function(n){return n.id})},
    students:c.students.map(function(n){return n.id}),rival:G.rival,bio:c.bio,household:c.household,trained:c.trained||{},flags:c.flags||{},spec:c.spec||null,clanHistory:c.clanHistory||[],secretSeen:c.secretSeen||[],rpg:c.rpg||null};
  return out;
}
function deserializeG(o){
  var c=G=generateLife({first:o.first,last:o.last,gender:o.gender,era:o.eraId,village:o.village});
  ["age","alive","rank","career","ryo","fatigue","missionStats","reputation","bounty","rogue","rogueYears",
   "priorRank","achievements","feed","timeline","villageState","retired","retiredYear","bestFriend",
   "clanLeader","examDone","jutsu","inventory","deathCause","bio","kkg","kkgKnown","nature","natureKnown",
   "familyWealth","familyHistory","latentKG","cid","born"].forEach(function(k){c[k]=o[k]});
  c.stats=o.stats;c.academy=o.academy;
  if(!c.household)c.household=o.household||"normal";
  c.trained=o.trained||{};c.flags=o.flags||{};
  c.clanName=o.clanName||null;
  if(c.clanName){var cl=CLANS.find(function(x){return x.n===c.clanName});
    if(cl)c.clan=cl;
    else c.clan={n:c.clanName,r:"common",spec:"Unknown bloodline",kg:null,v:null,
      d:"An old clan whose records were lost in an archive fire.",hist:"",ab:[],
      pas:{n:"Old Blood",d:"The records were lost; the blood remembers.",flat:{},rel:{}}}}
  c.clanHistory=Array.isArray(o.clanHistory)?o.clanHistory:[];
  c.secretSeen=Array.isArray(o.secretSeen)?o.secretSeen:[];
  c.rpg=o.rpg||null;try{if(window.rpgInit)rpgInit(c)}catch(e){}
  c.clanless=!c.clanName;
  if(c.academy&&!c.academy.subj)c.academy.subj={chakra:50,taijutsu:50,shuriken:50,tactics:50,history:50,stealth:50,teamwork:50};
  c.spec=o.spec||null;
  c.family.spouse=c.relationships.find(function(n){return n.id===o.familyIds.spouse})||null;
  c.family.kids=c.relationships.filter(function(n){return includes(o.familyIds.kids,n.id)});
  c.teammates=c.relationships.filter(function(n){return includes(o.teammateIds,n.id)});
  c.sensei=c.relationships.find(function(n){return n.id===o.senseiId})||null;
  c.students=c.relationships.filter(function(n){return includes(o.students,n.id)});
  return c;
}
function deleteSlot(idx){
  var all=slots();all.splice(idx,1);saveJSON(LS_SLOTS,all);
}
function legacyLog(){return loadJSON(LS_LEGACY,[])}
function pushLegacy(entry){
  var l=legacyLog();l.unshift(entry);if(l.length>100)l=l.slice(0,100);
  saveJSON(LS_LEGACY,l);
}

/* ============================ death, biography, legacy ============================ */
function gradeOf(){
  var s=0;
  s+=Math.min(30,G.missionStats.total*1.5);
  s+=Math.min(20,(G.missionStats.success/(G.missionStats.total||1))*15);
  s+=Math.min(15,G.reputation*.15);
  s+=rankRank()*3;
  s+=Math.min(10,G.jutsu?Object.keys(G.jutsu).length*.8:0);
  s+=Math.min(10,(G.achievements.length||0)*1.2);
  if(G.kkgKnown)s+=4;
  if(G.clanLeader)s+=4;
  if(G.rogue)s-=2;
  if(G.retired)s+=2;
  if(G.family.kids.length)s+=2;
  var g=s>=55?"S":s>=40?"A":s>=26?"B":s>=14?"C":"D";
  return {g:g,score:Math.round(s)};
}
function lifeBiography(){
  var g=gradeOf();
  var lines=[];
  lines.push(G.bio);
  var careerLine=G.rogue?"a missing-nin hunted across three borders":G.retired?"retired from active service, "+(G.age-G.retiredYear)+" years ago":G.rank==="Kage"?"the "+G.villageData.kage+" of "+G.villageName:"a "+G.rank.toLowerCase()+" of "+G.villageName;
  lines.push("They died at "+G.age+" as "+careerLine+", of "+G.deathCause+".");
  lines.push("Lifetime record: "+G.missionStats.success+" successful of "+G.missionStats.total+" missions. Reputation "+Math.round(G.reputation)+".");
  if(Object.keys(G.jutsu).length)lines.push("Techniques learned: "+Object.keys(G.jutsu).map(function(id){var j=JUTSU.find(function(x){return x.id===id});return j?j.n:id}).join(", ")+".");
  if(G.achievements.length)lines.push("Honors: "+G.achievements.map(function(id){var a=ACHIEVEMENTS.find(function(x){return x.id===id});return a?a.n:id}).join(", ")+".");
  if(G.family.spouse)lines.push("They married "+G.family.spouse.name+".");
  if(G.family.kids.length)lines.push("They are survived by "+(G.family.kids.length>1?G.family.kids.length+" children":G.family.kids[0].name)+".");
  lines.push("Life grade: "+g.g+" ("+g.score+" legacy points).");
  return lines.join("\n\n");
}
function showDeath(){
  var g=gradeOf();
  pushLegacy({name:G.name,grade:g.g,score:g.score,rank:G.rank,priorRank:G.priorRank,career:G.career,age:G.age,clan:G.clanName,deathCause:G.deathCause,village:G.villageName,era:G.eraName,rogue:G.rogue,kkg:G.kkgKnown,achievements:(G.achievements||[]).map(function(id){var a=ACHIEVEMENTS.find(function(x){return x.id===id});return a?a.n:id}),missionStats:G.missionStats,ryo:G.ryo,reputation:G.reputation,bounty:G.bounty,biography:lifeBiography(),timeline:G.timeline,spouse:G.family.spouse?G.family.spouse.name:null,kids:G.family.kids.filter(function(k){return k.alive}).map(function(k){return k.name}),spec:G.spec?specName():null,jutsuMastered:G.jutsu?Object.keys(G.jutsu).filter(function(id){return G.jutsu[id]&&G.jutsu[id].mastery>=3}).length:0,talents:(G.talents||[]).map(function(t){return t.t}),date:new Date().toISOString()});
  var deadIds=loadJSON("shinobi_sprint_dead_v1",{})||{};if(G.cid){deadIds[G.cid]=true;saveJSON("shinobi_sprint_dead_v1",deadIds)}   if(typeof clearActiveDeathSlot==="function")clearActiveDeathSlot();
  var card=$("#deathCard");card.innerHTML="";
  card.appendChild(el("div","tag","the end of a life"));
  card.appendChild(el("h2","serif",G.name));
  card.appendChild(el("div","dgrade",g.g+" — "+g.score+" legacy"));
  card.appendChild(el("div",null,"Died at "+G.age+" in "+G.eraName+", "+G.villageName+" ("+G.deathCause+")"));
  var bio=el("div","dbio",lifeBiography());card.appendChild(bio);
  var btns=el("div","dbtns");
  var aliveKids=G.family.kids.filter(function(k){return k.alive});
  var b1=el("button","btn",aliveKids.length?"Continue as "+aliveKids[0].name.split(" ")[0]:"New Life");
  b1.onclick=function(){
    if(aliveKids.length){startAsDescendant(aliveKids[0])}else{newLife()}
  };
  var b2=el("button","btn ghost","Legacy Hall");
  b2.onclick=showLegacy;
  btns.appendChild(b1);btns.appendChild(b2);
  card.appendChild(btns);
  $("#screen-game").classList.remove("on");
  $("#screen-death").classList.add("on");
}
function startAsDescendant(kid){
  var opts={first:kid.name.split(" ")[0],last:G.last,gender:kid.gender,era:G.eraId,village:G.village,
    clan:G.clanName||undefined};
  var child=generateLife(opts);
  child.bio="Child of "+G.name+". "+child.bio;
  child.familyWealth=G.familyWealth==="wealthy"?"comfortable":G.familyWealth;
  child.familyHistory="Your parent was "+(G.rank==="Kage"?"the "+G.villageData.kage+" of "+G.villageName:"a "+G.rank.toLowerCase()+" of "+G.villageName)+" whose name still opens doors.";
  child.legacyParent={name:G.name,rank:G.rank,grade:gradeOf().g};
  if(!includes(child.achievements,"dynasty_line"))child.achievements.push("dynasty_line");
  /* legacy rewards: an honored parent's name and purse follow the child */
  var lg=gradeOf().g||"";
  if(lg.indexOf("A")===0){
    child.ryo+=ri(800,2500);child.stats.reputation=clamp((child.stats.reputation||0)+8,0,100);
    child.familyHistory+=" An honored name in the line opens doors and purses: the family sends you off with savings and a reputation that arrives before you do.";
  }
  /* inheritance: some stats seed from parent, never maxed */
  ["chakra","intelligence","taijutsu","ninjutsu","chakraControl"].forEach(function(k){
    child.stats[k]=clamp(Math.round((child.stats[k]+G.stats[k]*.25)/1.1),0,80);
  });
  child.stats.potential=clamp(Math.max(child.stats.potential,G.stats.potential-ri(1,3)),1,11);
  if(G.kkgKnown&&chance(.25)){child.kkg=G.kkg}
  if(chance(.5))child.nature=G.nature;
  child.familyHistory+=child.clanName?" The clan line continues.":"";
  G=child;
  $("#screen-death").classList.remove("on");
  $("#screen-game").classList.add("on");
  feed("You begin life as the child of "+opts.first+" "+G.last+".","big");
  tl(0,"Born to "+opts.first+" "+G.last+", carrying the family line.");
  saveSlot("auto");
  render();
}


/* ============================ UI: dashboard ============================ */
var CARD_HOLD=false, VIEW="home", VTAB="feed";
var NAV=[["home","Home","🏠"],["character","Character","👤"],["family","Family","👨‍👩‍👦"],["academy","Academy","📜"],["missions","Missions","⚔️"],["rpg","Train","🥋"],["clan","Clan","🔻"],["inventory","Inventory","🎒"],["people","People","👥"],["story","Record","📖"],["settings","Settings","⚙️"]];
var QUOTES={
  Brash:"I'll become stronger… no matter what.",
  Calm:"The blade is last. The mind is first.",
  Cunning:"Every fight is won before it starts.",
  Gloomy:"The rain follows me. I've stopped arguing.",
  "Hot-blooded":"Show me something worth burning for!",
  Kind:"I carry my village with me.",
  Lazy:"Effort is a shortcut around thinking.",
  Loner:"I walk alone. It's faster.",
  Stoic:"Duty is not a choice.",
  Ambitious:"Watch the top. That's where I'm heading.",
  Playful:"A prank a day keeps the gloom away.",
  Devoted:"Family first. Always.",
  Fearless:"Cliffs are just invitations.",
  Gentle:"Strength that heals counts double."
};
var ICONS=[
  [/mission|rank mission|reward|s-rank/i,"🏆"],[/friend|rival|marry|married|spouse|relationship|dinner|talk/i,"🤝"],
  [/academy|study|class|exam|graduat|instructor|school/i,"📖"],[/born|birth|child|son|daughter/i,"👶"],
  [/die|died|death|passed away|funeral|grave/i,"🥀"],[/war|raid|attack|garrison|battle/i,"⚔️"],
  [/village|council|politic|trade road|kage/i,"🏘️"],[/jutsu|technique|natur|chakra|bloodline|kekkei/i,"🌀"],
  [/rogue|missing|bounty|hunter|amnesty/i,"🌙"],[/ryo|coin|pay|merchant/i,"🪙"],[/wound|injur|scar|bled/i,"🩹"],
  [/achiev|legend|hero|promot|honor|clan head|anbu/i,"🎖️"]
];
function iconFor(t){for(var i=0;i<ICONS.length;i++)if(ICONS[i][0].test(t))return ICONS[i][1];return "🌀"}
function yearsAgo(e){var d=G.age-e.age;if(d<=0)return "just now";if(d===1)return "1 year ago";return d+" years ago"}
function toast(msg){var t=$("#toast");t.textContent=msg;t.classList.add("on");clearTimeout(toast._h);toast._h=setTimeout(function(){t.classList.remove("on")},2200)}
window.toast=toast; /* expose for the RPG layer (rpg files call toast() outside this closure) */
function modal(title,kind,text,choices,cb){
  var card=$("#eventCard");card.style.display="block";CARD_HOLD=false;
  card.innerHTML="";
  var k=el("span","ek",(kind||"Event"));card.appendChild(k);
  card.appendChild(el("h3","serif",title));
  card.appendChild(el("div","etext",text));
  var box=el("div","echoices");
  (choices||[]).forEach(function(ch){
    var b=el("button","echoice",ch.t);
    b.onclick=function(){
      box.innerHTML="";
      if(ch.fn){ch.fn();if(CARD_HOLD)return;closeCard();render();return}
      if(cb){cb(ch);if(CARD_HOLD)return;closeCard();render();return}
      closeCard();render();
    };
    box.appendChild(b);
  });
  if(!choices||!choices.length){var b=el("button","echoice","Continue");b.onclick=function(){closeCard();render()};box.appendChild(b)}
  card.appendChild(box);
}
function eventResult(txt,cls){
  var card=$("#eventCard");
  if(!card||card.style.display==="none")return;
  CARD_HOLD=true;
  var old=card.querySelector(".eresult");if(old)old.remove();
  var r=el("div","eresult",txt);card.appendChild(r);
  var b=el("button","echoice","Continue");
  b.onclick=function(){closeCard();render()};
  card.appendChild(b);
}
function closeCard(){var card=$("#eventCard");card.style.display="none";card.innerHTML="";CARD_HOLD=false}

function render(){
  if(!G)return;
  if(!G.rpg)try{rpgInit(G)}catch(e){}
  $("#t-name").textContent=G.name;
  $("#t-age").textContent="Age: "+G.age;
  $("#t-village").innerHTML=esc(G.villageData.name)+"<small>Village</small>";
  $("#t-clan").innerHTML=esc(G.clanName||"No clan")+"<small>Clan</small>";
  $("#t-rank").innerHTML=esc(G.rogue?"Rogue":G.rank)+"<small>Rank</small>";
  $("#t-era").innerHTML=esc(G.era.name)+"<small>Era</small>";
  $("#t-ryo").textContent="🪙 "+money(G.ryo);
  var notifs=G.feed.filter(function(e){return /big|good|bad|rare|ach/.test(e.cls)}).slice(0,5);
  var bd=$("#bellDot");bd.textContent=notifs.length;bd.style.display=notifs.length?"":"none";
  renderChar();renderGoals();renderRels();renderNotifs();renderNav();renderView();
}
function statRow2(name,val,color){
  var d=el("div","srow2");
  d.appendChild(el("b",null,name));
  var b=el("div","bar2");var i=el("i");i.className=color;i.style.width=clamp(val,0,100)+"%";b.appendChild(i);d.appendChild(b);
  d.appendChild(el("span",null,String(Math.round(val))));
  return d;
}
function renderChar(){
  var c=$("#charCard");c.innerHTML="";
  var p=el("div","portrait");
  p.appendChild(el("div","face",G.first.charAt(0)));
  p.appendChild(el("span","pk",(G.clanName?G.clanName+" clan · ":"")+G.villageLabel));
  c.appendChild(p);
  c.appendChild(el("div","quote","\u201C"+(QUOTES[G.personality.n]||"Every life writes its own story.")+"\u201D"));
  var s=G.stats;
  var g=el("div","statgrid");
  g.appendChild(statRow2("Health",s.health,"c-red"));
  g.appendChild(statRow2("Chakra",s.chakra,"c-sky"));
  g.appendChild(statRow2("Happiness",s.happiness,"c-jade"));
  g.appendChild(statRow2("Intelligence",s.intelligence,"c-sky"));
  g.appendChild(statRow2("Strength",s.strength,"c-orange"));
  g.appendChild(statRow2("Agility",s.agility,"c-jade"));
  g.appendChild(statRow2("Chakra Control",s.chakraControl,"c-violet"));
  g.appendChild(statRow2("Ninjutsu",s.ninjutsu,"c-teal"));
  g.appendChild(statRow2("Taijutsu",s.taijutsu,"c-orange"));
  g.appendChild(statRow2("Genjutsu",s.genjutsu,"c-sky"));
  g.appendChild(statRow2("Discipline",s.discipline,"c-sky"));
  g.appendChild(statRow2("Reputation",s.reputation,"c-gold"));
  c.appendChild(g);
  var bn=el("div","bnrow");
  var b1=el("div","bnbox"+(G.kkgKnown?" hot":""));
  b1.appendChild(el("small",null,"Bloodline"));
  b1.appendChild(el("b",null,G.kkg?(G.kkgKnown?G.kkg:G.kkg+" (dormant)"):"None"));
  bn.appendChild(b1);
  var b2=el("div","bnbox"+(G.natureKnown?" hot":""));
  b2.appendChild(el("small",null,"Nature"));
  b2.appendChild(el("b",null,G.natureKnown?(G.nature+(G.secondary?" + "+G.secondary:"")):"Unknown"));
  bn.appendChild(b2);
  c.appendChild(bn);
}
function goalsList(){
  var gs=[],s=G.stats,vs=G.villageState;
  if(G.age<G.villageData.academyAge)gs.push(["Enroll in the Academy",Math.round(G.age/G.villageData.academyAge*100)]);
  else if(inAcademy())gs.push(["Graduate the Academy",clamp(Math.round(G.academy.grades),0,100)]);
  else if(G.rank==="Genin")gs.push(["Become a Chunin",clamp(Math.round(G.missionStats.total*8+s.reputation/2),0,100)]);
  else if(G.rank==="Chunin")gs.push(["Make Jonin",clamp(Math.round((G.missionStats.byRank.B||0)*15+s.reputation/2),0,100)]);
  else if(G.rank==="Jonin"&&!G.rogue)gs.push(["Reach the ANBU or council",clamp(Math.round(s.reputation),0,100)]);
  if(G.rogue)gs.push(["Survive the hunt",clamp(Math.round(100-G.bounty/600),0,100)]);
  var fam=0;if(G.family.spouse)fam+=45;fam+=G.family.kids.length*18;gs.push(["Build a strong family",clamp(fam,0,100)]);
  var best=0;Object.keys(G.jutsu).forEach(function(id){var j=JUTSU.find(function(x){return x.id===id});if(j&&j.nature)best=Math.max(best,G.jutsu[id].mastery/j.masteryMax*100)});
  gs.push(["Master a chakra nature",Math.round(best)]);
  gs.push(["Serve the village",clamp(Math.round(s.reputation),0,100)]);
  return gs.slice(0,3);
}
function renderGoals(){
  var c=$("#goalsCard");c.innerHTML="";
  var t=el("div","ptitle");t.appendChild(el("span","dot2"));t.appendChild(el("span",null,"Your Goals"));c.appendChild(t);
  goalsList().forEach(function(g){
    var d=el("div","goal");
    d.appendChild(el("b",null,g[0]));
    var bar=el("div","gbar");var i=el("i");i.style.width=clamp(g[1],0,100)+"%";bar.appendChild(i);d.appendChild(bar);
    d.appendChild(el("small",null,Math.round(g[1])+" / 100"));
    c.appendChild(d);
  });
}
function renderRels(){
  var c=$("#relCard");c.innerHTML="";
  var t=el("div","ptitle");t.appendChild(el("span","dot2"));t.appendChild(el("span",null,"Relationships"));c.appendChild(t);
  var list=G.relationships.filter(function(n){return n.alive}).sort(function(a,b){return b.rel-a.rel}).slice(0,4);
  if(!list.length)c.appendChild(el("div","mtext","No one yet."));
  list.forEach(function(n){
    var row=el("div","relrow");
    row.appendChild(el("div","rava",n.name.charAt(0)));
    var who=el("div","who");
    who.appendChild(el("b",null,n.name));
    who.appendChild(el("span",null,cap(n.kind||"friend")+" · "+n.rel));
    row.appendChild(who);
    row.appendChild(el("span",null,"›"));
    row.style.cursor="pointer";row.onclick=function(){switchView("family")};
    c.appendChild(row);
  });
}
function renderNotifs(){
  var c=$("#notifCard");c.innerHTML="";
  var t=el("div","ptitle");t.appendChild(el("span","dot2"));t.appendChild(el("span",null,"Notifications"));c.appendChild(t);
  var list=G.feed.filter(function(e){return /big|good|bad|rare|ach/.test(e.cls)}).slice(0,4);
  if(!list.length)c.appendChild(el("div","mtext","All quiet."));
  list.forEach(function(e){
    var d=el("div","notif");
    d.appendChild(el("span","star","★"));
    var b=el("div");b.appendChild(el("div",null,esc(e.txt.length>90?e.txt.slice(0,88)+"…":e.txt)));d.appendChild(b);
    c.appendChild(d);
  });
}
function renderNav(){
  var n=$("#bottomnav");n.innerHTML="";
  NAV.forEach(function(it){
    var b=el("button","nitem"+(VIEW===it[0]?" on":""));
    b.appendChild(el("i",null,it[2]));b.appendChild(el("span",null,it[1]));
    b.onclick=function(){switchView(it[0])};
    n.appendChild(b);
  });
}
function switchView(v){VIEW=v;render()}
function renderView(){
  ["home","character","family","academy","missions","clan","inventory","people","story","settings"].forEach(function(v){
    $("#view-"+v).classList.toggle("on",VIEW===v);
  });
  var aw=document.querySelector(".ageupwrap");if(aw)aw.style.display=(VIEW==="home")?"":"none";
  if(VIEW==="home")renderHome();
  else if(VIEW==="character")renderCharacter();
  else if(VIEW==="family")renderFamily();
  else if(VIEW==="academy")renderAcademy();
  else if(VIEW==="missions")renderMissions();
  else if(VIEW==="rpg")rpgOpen();
  else if(VIEW==="clan")renderClan();
  else if(VIEW==="inventory")renderInventory();
  else if(VIEW==="people"){if(window.SOCIAL&&SOCIAL.renderPeople){try{SOCIAL.renderPeople()}catch(e){}}}
  else if(VIEW==="story"){if(window.LIFE&&LIFE.renderStory){try{LIFE.renderStory()}catch(e){}}}
  else if(VIEW==="settings")renderSettings();
}
/* ---------- home: feed tabs ---------- */
var VTABS=[["feed","Life Feed","☰"],["activities","Activities","★"],["news","News","📣"],["timeline","Timeline","🕐"]];
function renderHome(){
  var tb=$("#vtabs");tb.innerHTML="";
  VTABS.forEach(function(t){
    var b=el("button","vtab"+(VTAB===t[0]?" on":""));
    b.appendChild(el("span",null,t[2]+" "+t[1]));
    b.onclick=function(){VTAB=t[0];renderHome()};
    tb.appendChild(b);
  });
  var p=$("#vpane");p.innerHTML="";
  if(VTAB==="feed")p.appendChild(feedPane(null));
  else if(VTAB==="news")p.appendChild(feedPane(/world/));
  else if(VTAB==="timeline")p.appendChild(timelinePane());
  else if(VTAB==="activities")p.appendChild(activitiesPane());
}
function feedPane(filter){
  var f=el("div","feed");
  var list=G.feed.filter(function(e){return !filter||filter.test(e.cls)});
  if(!list.length)f.appendChild(el("div","fentry","Nothing here yet."));
  list.slice(0,60).forEach(function(e){
    var d=el("div","fentry "+(e.cls||""));
    d.appendChild(el("span","fico",iconFor(e.txt)));
    var body=el("div","fbody");
    body.appendChild(el("div","fage","Age "+e.age));
    body.appendChild(el("div","ftxt",esc(e.txt)));
    d.appendChild(body);
    d.appendChild(el("span","fwhen",yearsAgo(e)));
    f.appendChild(d);
  });
  return f;
}
function timelinePane(){
  var f=el("div","feed");
  var items=G.timeline.slice().reverse();
  if(!items.length)f.appendChild(el("div","fentry","Everything still ahead."));
  items.forEach(function(t){
    var d=el("div","fentry");
    d.appendChild(el("span","fico","🕐"));
    var body=el("div","fbody");
    body.appendChild(el("div","fage","Age "+t.age));
    body.appendChild(el("div","ftxt",esc(t.txt)));
    d.appendChild(body);f.appendChild(d);
  });
  return f;
}
/* ---------- activities (shared by home tab + academy view) ---------- */
function activitiesPane(){
  var w=el("div");
  var acts=el("div","acts");
  var spent=AGEUP_SPENT>=2;
  function ab(icon,title,sub,fn){
    var b=el("button","act");if(spent)b.setAttribute("disabled","disabled");
    b.appendChild(el("b",null,icon+" "+title));b.appendChild(el("span",null,sub));
    b.onclick=function(){fn();AGEUP_SPENT++;render()};
    acts.appendChild(b);
  }
  var r=rankRank();
  if(isChild()){
    ab("🏃","Play outside","strength · happiness",function(){addStat("strength",2);addStat("happiness",3);addStat("agility",1);fbig("You spend the day "+pick(["climbing trees","racing the neighbor kids","playing ninja tag","fishing at the creek"])+".","good")});
    ab("📖","Listen to stories","intelligence",function(){addStat("intelligence",2);addStat("happiness",1);fbig("Your "+pick(["grandmother","uncle","mother"])+" tells stories of the old wars. Some are true.","good")});
    ab("👪","Family time","happiness",function(){familyTime()});
  }else if(inAcademy()){
    ab("📚","Study","grades · intelligence",function(){addStat("intelligence",3);G.academy.grades=clamp((G.academy.grades||50)+3,0,100);var sk=pick(Object.keys(G.academy.subj||{tactics:1}));G.academy.subj[sk]=clamp((G.academy.subj[sk]||50)+4,0,100);fbig("You study until the lamp gutters. Your grades climb, and "+cap(sk)+" class gets the best of it.","good")});
    ab("🥋","Train taijutsu","combat",function(){addStat("taijutsu",3);fbig("You drill forms until your arms feel like noodles.","good")});
    ab("🌀","Chakra control","the leaf never lies",function(){addStat("chakraControl",3);fbig(chance(.5)?"The leaf sticks. It is a small thing that feels enormous.":"The leaf falls four times before it sticks. You keep at it.","good")});
    ab("🔥","Practice ninjutsu","seals",function(){addStat("ninjutsu",2);addStat("chakra",1);fbig("Your hands remember the seals a little faster each week.","good")});
    ab("✋","Learn a technique","jutsu list",function(){showJutsuModal()});
  }else{
    ab("🥋","Train taijutsu","combat · fatigues",function(){var g=trainGain("taijutsu",2+Math.floor(G.stats.growth/6));G.fatigue=clamp(G.fatigue+8,0,100);fbig("You train until sweat stings your eyes. (+"+g+" taijutsu — gains slow the more you drill the same thing.)","good")});
    ab("🌀","Chakra control","control · fatigues",function(){var g=trainGain("chakraControl",2+Math.floor(G.stats.growth/6));G.fatigue=clamp(G.fatigue+6,0,100);fbig("You sit under the waterfall until your hands stop shaking. (+"+g+" chakra control)","good")});
    ab("📖","Study strategy","intelligence",function(){var g=trainGain("intelligence",2);G.fatigue=clamp(G.fatigue+3,0,100);fbig("You read old campaign maps and strategy scrolls. (+"+g+" intelligence)","good")});
    ab("🗡️","Weapon drills","kenjutsu · fatigues",function(){var g=trainGain("kenjutsu",2);G.fatigue=clamp(G.fatigue+6,0,100);fbig("A thousand cuts at the wooden post. The post loses. (+"+g+" kenjutsu)","good")});
    ab("🏃","Conditioning","speed · endurance · fatigues",function(){var g=trainGain("speed",1);var g2=trainGain("endurance",1);G.fatigue=clamp(G.fatigue+9,0,100);fbig("Ridge runs at dawn. Your legs file a complaint. (+"+g+" speed, +"+g2+" endurance)","good")});
    ab("🧘","Meditate","willpower · recovery",function(){addStat("willpower",1);fatigueHeal(10);fbig("You sit with your own head for an hour. It is harder than running.","good")});
    ab("✋","Jutsu training","techniques",function(){showJutsuModal()});
    ab("💤","Rest","recover",function(){rest()});
  }
  if(G.age>=6)ab("👥","Socialize","relationships",function(){switchView("family")});
  if(r>=1||G.rogue)ab("🛒","Market","buy supplies",function(){showShop()});
  w.appendChild(acts);
  if(spent){var n=el("div","panel");n.style.marginTop="10px";n.appendChild(el("div","mtext","You've used both actions this year. AGE UP when you're ready."));w.appendChild(n)}
  return w;
}
function familyTime(){
  var ps=byKind("father").concat(byKind("mother")).filter(function(n){return n.alive});
  var sibs=byKind("sibling").filter(function(n){return n.alive});
  var all=ps.concat(sibs);
  if(!all.length){fbig("The house is quiet. You keep your own company.");AGEUP_SPENT++;render();return}
  var n=pick(all);relUp(n,5);addStat("happiness",2);
  fbig("You spend the day with "+n.name.split(" ")[0]+": "+pick(["cooking together","fixing the fence","a long walk past the fields","cards by the stove","training in the yard"])+".","good");
  AGEUP_SPENT++;render();
}
function rest(){
  addStat("health",8);fatigueHeal(30);addStat("happiness",1);
  fbig("You rest properly for once.","good");AGEUP_SPENT++;render();
}
/* ---------- view renderers ---------- */
function panel(tag,title){
  var p=el("div","panel");
  if(tag){p.appendChild(el("div","tag",tag))}
  if(title)p.appendChild(el("h3","serif",title));
  return p;
}
function renderCharacter(){
  var v=$("#view-character");v.innerHTML="";
  var p=panel("shinobi record",G.rogue?"Missing-nin File":G.rank+" — "+G.career);
  var kv=el("div","kv");
  [["Name",G.name],["Age",G.age],["Village",G.villageName],["Clan",G.clanName||"none"],["Bloodline",G.kkg?(G.kkgKnown?G.kkg+" (awakened)":G.kkg+" (dormant)"):"none"],["Chakra nature",G.natureKnown?G.nature:"undiscovered"],["Personality",G.personality.n+" — "+G.personality.d],["Specialization",G.spec?specName():"none"],["Household",G.household||"normal"],["Missions",G.missionStats.total+" ("+G.missionStats.success+" success, "+G.missionStats.fail+" failed)"],["Reputation",Math.round(G.reputation)]].forEach(function(r){
    kv.appendChild(el("b",null,r[0]));kv.appendChild(el("span",null,String(r[1])));
  });
  p.appendChild(kv);
  var acts=el("div","acts");acts.style.marginTop="12px";
  var b1=el("button","act");b1.appendChild(el("b",null,"✋ Jutsu"));b1.appendChild(el("span",null,"learn & train techniques"));b1.onclick=showJutsuModal;acts.appendChild(b1);
  if(rankRank()>=3&&!G.retired){var b2=el("button","act");b2.appendChild(el("b",null,"🎓 Retire"));b2.appendChild(el("span",null,"with honors"));b2.onclick=showRetire;acts.appendChild(b2)}
  p.appendChild(acts);
  v.appendChild(p);
  if(window.FATE)v.appendChild(FATE.profilePanel());
  v.appendChild(jutsuPanel());
}
function jutsuPanel(){
  var p=panel("techniques","Jutsu");
  var list=jutsuListForTab().filter(function(x){return x.can||x.rec});
  if(!list.length){p.appendChild(el("div","mtext","No techniques available to you yet. Train your fundamentals."))}
  list.slice(0,14).forEach(function(x){
    var row=el("div","list-row");
    var who=el("div","who");
    who.appendChild(el("b",null,x.j.n));
    who.appendChild(el("span",null,x.rec?("mastery "+x.rec.mastery+"/"+x.j.masteryMax+" · progress "+Math.round(x.rec.progress)):("needs: "+reqText(x.j))));
    row.appendChild(who);
    var acts=el("div","list-acts");
    if(!x.rec){var b=el("button","btn small","Learn");b.onclick=function(){learnJutsu(x.j);render()};acts.appendChild(b)}
    else{var b2=el("button","btn small ghost","Train");b2.onclick=function(){trainJutsu(x.j);G.fatigue=clamp(G.fatigue+6,0,100);AGEUP_SPENT++;render()};acts.appendChild(b2)}
    row.appendChild(acts);p.appendChild(row);
  });
  return p;
}
function relRow(n,interactive){
  var row=el("div","list-row");
  row.appendChild(el("div","rava",n.name.charAt(0)));
  var who=el("div","who");
  who.appendChild(el("b",null,n.name+(n.alive?"":" †")));
  who.appendChild(el("span",null,cap(n.kind||"friend")+(n.rank?" · "+n.rank:"")+" · age "+n.age+" · "+(n.personality||"")+" · rel "+n.rel));
  row.appendChild(who);
  var bar=el("div","relbar"+(n.kind==="spouse"?" love":""));
  var i=el("i");i.style.width=clamp((n.rel+100)/2,0,100)+"%";bar.appendChild(i);
  row.appendChild(bar);
  if(interactive&&n.alive){
    var acts=el("div","list-acts");
    function rb(l,fn){var b=el("button","btn small ghost",l);b.onclick=function(){fn()};acts.appendChild(b)}
    rb("Talk",function(){relUp(n,3);AGEUP_SPENT++;fbig("You talk with "+n.name.split(" ")[0]+".");render()});
    rb("Train",function(){addStat("taijutsu",1);relUp(n,2);AGEUP_SPENT++;fbig("You train with "+n.name.split(" ")[0]+".");render()});
    rb("Spar",function(){var win=ri(st("taijutsu"),st("taijutsu")+30)>ri(40,80);addStat("taijutsu",2);
      if(win){relUp(n,2);fbig("You beat "+n.name.split(" ")[0]+" in a spar.","good")}else{relUp(n,1);fbig(n.name.split(" ")[0]+" takes the spar. You take the lesson.","bad")}
      AGEUP_SPENT++;render()});
    rb("Gift",function(){if(G.ryo<200){toast("Not enough ryō for a gift");return}addRyo(-200);relUp(n,8);AGEUP_SPENT++;fbig("You give "+n.name.split(" ")[0]+" a small gift. It lands well.","good");render()});
    if(n.rel<20)rb("Apologize",function(){relUp(n,12);AGEUP_SPENT++;fbig("You make things right with "+n.name.split(" ")[0]+", as far as words can.","good");render()});
    row.appendChild(acts);
  }
  return row;
}
function renderFamily(){
  var v=$("#view-family");v.innerHTML="";
  var p=panel("household","The "+(G.clanName||G.last)+" Household");
  var kv=el("div","kv");
  [["Wealth",G.familyWealth],["History",G.familyHistory],["Village",G.villageName],["Era",G.eraName]].forEach(function(r){
    kv.appendChild(el("b",null,r[0]));kv.appendChild(el("span",null,String(r[1])));
  });
  p.appendChild(kv);v.appendChild(p);
  var p2=panel("your people","Everyone");
  G.relationships.filter(function(n){return n.alive}).sort(function(a,b){return b.rel-a.rel}).slice(0,14).forEach(function(n){p2.appendChild(relRow(n,true))});
  if(!G.relationships.length)p2.appendChild(el("div","mtext","No one yet. Life will introduce you."));
  v.appendChild(p2);
}
function renderAcademy(){
  var v=$("#view-academy");v.innerHTML="";
  if(inAcademy()){
    var p=panel("academy record","Academy — class of "+(G.age+1));
    var a=G.academy;
    var kv=el("div","kv");
    [["Instructor",a.sensei],["Grades",Math.round(a.grades)+"/100"],["Attendance",Math.round(a.attendance||0)+"/100"],["Years enrolled",a.years+1]].forEach(function(r){
      kv.appendChild(el("b",null,r[0]));kv.appendChild(el("span",null,String(r[1])));
    });
    p.appendChild(kv);v.appendChild(p);
  }else if(G.rank==="Genin"||rankRank()>=2){
    var p2=panel("advanced training","Dojo");
  }else{
    var p3=panel("academy","Not enrolled");
    p3.appendChild(el("div","mtext",G.age<G.villageData.academyAge?"You enroll at age "+G.villageData.academyAge+".":"Your Academy days are behind you."));
    v.appendChild(p3);
  }
  v.appendChild(activitiesPane());
}
function renderMissions(){
  var v=$("#view-missions");v.innerHTML="";
  var p=panel(G.rogue?"rogue contracts":"mission board",G.rogue?"Contracts":"Available missions");
  var ranks=availRanks();
  var acts=el("div","acts");
  if(!ranks.length){p.appendChild(el("div","mtext",G.retired?"You are retired. The board is someone else's problem now.":"No missions available at your rank yet."))}
  ranks.forEach(function(rk){
    var b=el("button","act");
    b.appendChild(el("b",null,"⚔️ "+rk+"-Rank"));
    b.appendChild(el("small",null,pick(MISSION_TYPES[rk])));
    b.onclick=function(){startMission(rk)};
    acts.appendChild(b);
  });
  p.appendChild(acts);
  var kv=el("div","kv");kv.style.marginTop="12px";
  kv.appendChild(el("b",null,"Record"));
  kv.appendChild(el("span",null,G.missionStats.success+" success · "+G.missionStats.fail+" failed · streak "+G.missionStats.streak));
  p.appendChild(kv);
  v.appendChild(p);
  if(rankRank()>=1&&!G.rogue){
    var p2=panel("career","Service record");
    var kv2=el("div","kv");
    [["Rank",G.rank],["Career",G.career],["Reputation",Math.round(G.reputation)],["Best streak",G.missionStats.best]].forEach(function(r){
      kv2.appendChild(el("b",null,r[0]));kv2.appendChild(el("span",null,String(r[1])));
    });
    p2.appendChild(kv2);v.appendChild(p2);
  }
}
/* ============================ clan UI v2: collection, details, registry ============================ */
var CLAN_UI={q:"",rar:null,detail:null};
function rarityColor(r){return RARITY_COLOR[r]||"#8a8f98"}
function capFirst(s){return s?s.charAt(0).toUpperCase()+s.slice(1):""}
function statLabel(k){return capFirst(String(k).replace(/([A-Z])/g," $1").trim())}
function clanBuffLines(p){
  var out=[];
  if(p&&p.flat)for(var k in p.flat){var v=p.flat[k];if(v)out.push((v>0?"+":"")+v+" "+statLabel(k))}
  if(p&&p.rel){
    var t=p.rel.train||{},k2;
    for(k2 in t){var m=Math.round(t[k2]*100);if(m)out.push("+"+m+"% "+statLabel(k2).toLowerCase()+" training")}
    if(p.rel.jutsu)out.push("+"+Math.round(p.rel.jutsu*100)+"% technique mastery speed");
    if(p.rel.recovery)out.push("+"+Math.round(p.rel.recovery*100)+"% recovery from exhaustion");
    if(p.rel.resist)out.push("+"+Math.round(p.rel.resist*100)+"% resistance to harm and setbacks");
    if(p.rel.rep)out.push("+"+Math.round(p.rel.rep*100)+"% reputation gains");
    if(p.rel.social)out.push("+"+Math.round(p.rel.social*100)+"% bond growth");
    if(p.rel.exam)out.push("+"+p.rel.exam+" exam performance");
    if(p.rel.mission)out.push("+"+p.rel.mission+" mission performance");
    if(p.rel.track)out.push("+"+Math.round(p.rel.track*100)+"% tracking effectiveness");
    if(p.rel.evade)out.push("+"+Math.round(p.rel.evade*100)+"% evasion");
  }
  if(!out.length)out.push("Steady blood, steady work: no modifiers beyond your own effort.");
  return out;
}
function clanTechniquesFor(n){return JUTSU.filter(function(j){return j.clan===n})}
function clanMiniCard(c,owned){
  var col=rarityColor(c.r);
  var d=el("div","clan-mini"+(owned?" owned":""));
  d.style.borderColor=col+"55";
  var b=el("b",null,c.secret?(includes(G.secretSeen||[],c.n)?c.n:"???"):c.n);
  b.style.color=col;d.appendChild(b);
  d.appendChild(el("span","rar",c.secret?"secret":c.r));
  if(c.pas&&!c.secret)d.appendChild(el("span","pas",c.pas.n));
  else if(c.secret&&includes(G.secretSeen||[],c.n))d.appendChild(el("span","pas",c.pas.n));
  d.onclick=function(){CLAN_UI.detail=c;CLAN_UI.q="";CLAN_UI.rar=null;render()};
  return d;
}
function changeClan(c){
  var old=G.clanName;
  G.clanName=c.n;G.clan=c;G.clanless=false;
  if(!G.secretSeen)G.secretSeen=[];
  if(!includes(G.secretSeen,c.n))G.secretSeen.push(c.n);
  logClanRoll(c,"secret-join",G.clanHistory);
  fbig("BLOODLINE REWRITTEN — the "+c.n+" name is yours now. "+c.pas.n+" settles into you like a second spine.","rare");
  tl(G.age,"Joined the "+c.n+" clan"+(old?" (was "+old+")":"")+".");
  rep(5);render();
}
function renderClanDetail(v,c){
  var col=rarityColor(c.r);
  var back=el("button","btn small ghost","\u2190 Back to the registry");
  back.onclick=function(){CLAN_UI.detail=null;render()};
  v.appendChild(back);
  var owned=!!(G.clanName===c.n);
  var seen=c.secret?includes(G.secretSeen||[],c.n):true;
  var p=panel((c.secret?"secret":c.r)+" clan"+(owned?" · your clan":""),"Clan "+c.n);
  if(!seen){v.appendChild(p);p.appendChild(el("div","mtext","This entry is sealed. Some names are only given, never found."));return}
  var top=el("div","clan-detail");
  var emb=el("div","cc-emb");emb.style.setProperty("--rc",col);emb.textContent=CLAN_KANJI[c.n]||c.n.charAt(0).toUpperCase();
  top.appendChild(emb);
  var right=el("div","clan-detailbody");
  right.appendChild(el("span","cc-rar","clan "+c.n.toUpperCase()));right.lastChild.style.setProperty("--rc",col);
  right.appendChild(el("div","cc-spec",c.spec+(c.kg?" · Kekkei genkai: "+c.kg:"")));
  right.appendChild(el("p","mtext",c.d));
  top.appendChild(right);p.appendChild(top);
  if(c.hist)p.appendChild(el("div","mtext",c.hist));
  if(c.pas){
    var pas=el("div","clan-block");
    pas.appendChild(el("b","clan-blocktitle","Passive — "+c.pas.n));
    pas.appendChild(el("div","mtext",c.pas.d));
    var ul=el("ul","clan-effects");
    clanBuffLines(c.pas).forEach(function(l){ul.appendChild(el("li",null,l))});
    pas.appendChild(ul);
    p.appendChild(pas);
  }
  if(c.ab&&c.ab.length){
    var ab=el("div","clan-block");
    ab.appendChild(el("b","clan-blocktitle","Clan abilities"));
    var ul2=el("ul","clan-effects");
    c.ab.forEach(function(l){ul2.appendChild(el("li",null,l))});
    ab.appendChild(ul2);p.appendChild(ab);
  }
  var techs=clanTechniquesFor(c.n);
  if(techs.length){
    var tb=el("div","clan-block");
    tb.appendChild(el("b","clan-blocktitle","Clan techniques"));
    techs.forEach(function(j){
      var rec=G.jutsu[j.id];
      var row=el("div","list-row");
      var who=el("div","who");
      who.appendChild(el("b",null,j.n+(rec?" · mastered rank "+rec.m+"/"+j.masteryMax:"")));
      who.appendChild(el("span",null,"Requires "+Object.keys(j.req||{}).map(function(k){return j.req[k]+" "+statLabel(k).toLowerCase()}).join(", ")));
      row.appendChild(who);
      row.appendChild(el("span","rar",rec?"unlocked":"locked"));
      tb.appendChild(row);
    });
    p.appendChild(tb);
  }
  p.appendChild(el("div","mtext",owned?"This blood is yours.":"Not yours yet. Clans are rolled at birth, granted by the village's archives, or found where they should not be."));
  v.appendChild(p);
}
function renderClan(){
  var v=$("#view-clan");v.innerHTML="";
  if(CLAN_UI.detail){renderClanDetail(v,CLAN_UI.detail);return}
  var c=clanOf();
  if(!c){
    var p0=panel("clan","No Clan");
    p0.appendChild(el("div","mtext","You are clanless. Your name is yours alone, and your deeds will have to speak louder than a crest. Every clan in the registry is listed below; only birth, blood, or the forbidden registry can give you one."));
    v.appendChild(p0);
  }else{
    var col=rarityColor(c.r);
    var p=panel((c.secret?"secret":c.r)+" clan"+(G.kkgKnown?" · bloodline awakened":""),"The "+c.n+" Clan");
    var top=el("div","clan-detail");
    var emb=el("div","cc-emb");emb.style.setProperty("--rc",col);emb.textContent=CLAN_KANJI[c.n]||c.n.charAt(0).toUpperCase();
    top.appendChild(emb);
    var right=el("div","clan-detailbody");
    var rb=el("span","cc-rar",c.secret?"SECRET":c.r.toUpperCase());rb.style.setProperty("--rc",col);right.appendChild(rb);
    right.appendChild(el("div","cc-spec",c.spec+(c.kg?" · "+c.kg+(G.kkgKnown?" — AWAKENED":" — dormant"):"")));
    right.appendChild(el("p","mtext",c.d));
    top.appendChild(right);p.appendChild(top);
    if(c.pas){
      var pas=el("div","clan-block");
      pas.appendChild(el("b","clan-blocktitle","Passive — "+c.pas.n+" (always active)"));
      pas.appendChild(el("div","mtext",c.pas.d));
      var ul=el("ul","clan-effects");
      clanBuffLines(c.pas).forEach(function(l){ul.appendChild(el("li",null,l))});
      pas.appendChild(ul);p.appendChild(pas);
    }
    if(c.ab&&c.ab.length){
      var ab=el("div","clan-block");
      ab.appendChild(el("b","clan-blocktitle","Clan abilities"));
      var ul2=el("ul","clan-effects");
      c.ab.forEach(function(l){ul2.appendChild(el("li",null,l))});
      ab.appendChild(ul2);p.appendChild(ab);
    }
    var mastered=Object.keys(G.jutsu).filter(function(id){var j=JUTSU.find(function(x){return x.id===id});return j&&j.clan===c.n}).length;
    var total=clanTechniquesFor(c.n).length;
    p.appendChild(el("div","mtext","Clan techniques mastered: "+mastered+(total?" of "+total:"")+"."+((!G.kkgKnown&&c.kg)?" Your bloodline may still wake, in its own time.":"")));
    v.appendChild(p);
  }
  /* collection */
  var pc=panel("registry","Clan collection — "+CLANS.filter(function(x){return !x.secret}).length+" clans");
  var bar=el("div","clan-filterbar");
  var q=el("input","clan-search");q.placeholder="Search clans…";q.value=CLAN_UI.q;
  q.oninput=function(){CLAN_UI.q=q.value.toLowerCase();redrawCollection(pc)};
  bar.appendChild(q);
  RARITY_ORDER.forEach(function(r){
    var chip=el("button","clan-chip"+(CLAN_UI.rar===r?" on":""),r);
    chip.style.setProperty("--rc",rarityColor(r));
    chip.onclick=function(){CLAN_UI.rar=(CLAN_UI.rar===r?null:r);render()};
    bar.appendChild(chip);
  });
  pc.appendChild(bar);
  var gridWrap=el("div","clan-gridwrap");
  pc.appendChild(gridWrap);
  pc.__redraw=function(){ /* fill grid per current filters */
    gridWrap.innerHTML="";
    var list=CLANS.filter(function(x){
      if(x.secret)return includes(G.secretSeen||[],x.n);
      if(CLAN_UI.rar&&x.r!==CLAN_UI.rar)return false;
      if(CLAN_UI.q&&x.n.toLowerCase().indexOf(CLAN_UI.q)<0)return false;
      return true;
    });
    if(!list.length)gridWrap.appendChild(el("div","mtext","No clans match."));
    list.forEach(function(x){gridWrap.appendChild(clanMiniCard(x,G.clanName===x.n))});
  };
  pc.__redraw();
  v.appendChild(pc);
  /* roll history */
  var hist=G.clanHistory||[];
  if(hist.length){
    var ph=panel("rolls","Roll history");
    hist.slice(0,12).forEach(function(h){
      var row=el("div","list-row");
      var who=el("div","who");
      who.appendChild(el("b",null,h.n));
      who.appendChild(el("span",null,new Date(h.when).toLocaleDateString()));
      row.appendChild(who);
      var tag=el("span","rar",h.kind);tag.style.color=rarityColor(h.r);
      row.appendChild(tag);ph.appendChild(row);
    });
    v.appendChild(ph);
  }
  /* forbidden registry */
  var pf=panel("forbidden","Forbidden Registry");
  pf.appendChild(el("div","mtext","Two names are struck from every roll in the land. They cannot be rolled at birth. The registry keeps a rite for them, and the odds are exactly what the stories say: one in two million."));
  var seen=(G.secretSeen||[]);
  if(seen.length){
    var sg=el("div","clan-gridwrap");
    CLANS.filter(function(x){return x.secret&&includes(seen,x.n)}).forEach(function(x){sg.appendChild(clanMiniCard(x,G.clanName===x.n))});
    pf.appendChild(sg);
  }
  var bsec=el("button","btn small","Perform the forbidden divination");
  bsec.onclick=function(){
    var hit=secretRollClan();
    if(hit){
      if(!G.secretSeen)G.secretSeen=[];
      if(!includes(G.secretSeen,hit.n))G.secretSeen.push(hit.n);
      modal("The Void Answers","SECRET CLAN — "+hit.n,hit.d+"\n\nPassive: "+hit.pas.n+" — "+hit.pas.d+"\n\nTake this name as your own? Your current clan" + (G.clanName?" ("+G.clanName+")":"") + " would be set aside.",
        [{t:"Claim "+hit.n,fn:function(){changeClan(hit)}},
         {t:"Walk away",fn:function(){fbig("You step back from the edge. The feeling follows you for days.","");render()}}]);
    }else{
      fbig(pick(["The smoke gives you nothing tonight.","You cast the bones and read only your own face.","Something watched. Nothing answered."]),"");
    }
    render();
  };
  pf.appendChild(bsec);
  v.appendChild(pf);
}
var RARITY_ORDER=["common","uncommon","rare","epic","legendary","mythical","secret"];

function renderInventory(){
  var v=$("#view-inventory");v.innerHTML="";
  var p=panel("pouch","Inventory — "+money(G.ryo));
  var buy=el("button","btn small ghost","🛒 Open market");
  buy.onclick=showShop;p.appendChild(buy);
  if(!G.inventory.length)p.appendChild(el("div","mtext","Empty pockets, shinobi heart."));
  G.inventory.forEach(function(id){
    var it=ITEMS[id];if(!it)return;
    var row=el("div","list-row");
    var who=el("div","who");who.appendChild(el("b",null,it.n));who.appendChild(el("span",null,it.d));
    row.appendChild(who);
    var b=el("button","btn small","Use");
    b.onclick=function(){
      G.inventory.splice(G.inventory.indexOf(id),1);
      if(id==="pill"){fatigueHeal(40);fbig("You bite down on the soldier pill. Fatigue washes away.","good")}
      else if(id==="medkit"){addStat("health",25);fbig("You dress your wounds properly.","good")}
      else if(id==="scroll"){var recs=Object.keys(G.jutsu);if(recs.length){G.jutsu[recs[0]].progress+=10;fbig("You study the scroll; progress on your technique improves.","good")}else{addStat("intelligence",2);fbig("You read it twice and feel sharper.","good")}}
      else if(id==="kunai"){addStat("taijutsu",1);fbig("You put the fine kunai through its paces.","good")}
      else toast(it.n+" kept.");
      AGEUP_SPENT++;render();
    };
    row.appendChild(b);p.appendChild(row);
  });
  v.appendChild(p);
}
function renderSettings(){
  var v=$("#view-settings");v.innerHTML="";
  var p=panel("saves","Save slots");
  var all=slots();
  for(var i=0;i<6;i++){
    var s=all[i];
    var row=el("div","list-row");
    var who=el("div","who");
    who.appendChild(el("b",null,"Slot "+(i+1)+(s?" — "+s.g.name+" (age "+s.g.age+", "+s.g.rank+")":" — empty")));
    who.appendChild(el("span",null,s?new Date(s.when).toLocaleString():"autosaves land in the first empty slot"));
    row.appendChild(who);
    if(s){
      var lb=el("button","btn small","Load");lb.onclick=function(idx){return function(){loadGame(idx)}}(i);
      var db=el("button","btn small ghost","Delete");db.onclick=function(idx){return function(){
        if(!confirm("Delete slot "+(idx+1)+"? This cannot be undone."))return;
        deleteSlot(idx);renderSettings();
      }}(i);
      row.appendChild(lb);row.appendChild(db);
    }else{
      var sb=el("button","btn small ghost","Save here");
      sb.onclick=function(idx){return function(){saveSlot(idx);toast("Saved to slot "+(idx+1));renderSettings()}}(i);
      row.appendChild(sb);
    }
    p.appendChild(row);
  }
  v.appendChild(p);
  var backup=panel("save-data","Save protection");
  backup.appendChild(el("span","muted","Cloud saves sync automatically when available. A local recovery copy is also kept on this browser. Export a backup before clearing browser data or changing devices."));
  var backupActs=el("div","acts");
  var exportBtn=el("button","btn","Export backup");exportBtn.onclick=function(){try{var data={app:"Shinobi Life Unbound",format:1,exportedAt:new Date().toISOString(),slots:slots()};var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="shinobi-life-unbound-backup-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);toast("Backup exported")}catch(e){toast("Couldn't export backup")}};
  var importBtn=el("button","btn ghost","Import backup");importBtn.onclick=function(){var input=document.createElement("input");input.type="file";input.accept="application/json,.json";input.onchange=function(){var file=input.files&&input.files[0];if(!file)return;if(file.size>4*1024*1024){toast("That file is too large to be a backup");return}var reader=new FileReader();reader.onload=function(){try{var raw=JSON.parse(reader.result);if(!raw||typeof raw!=="object"||raw.app!=="Shinobi Life Unbound"||!Array.isArray(raw.slots))throw Error("Invalid backup");if(raw.format!=null&&raw.format!==1)throw Error("Unsupported format");var deep=function(v){if(Array.isArray(v)){var o=[];for(var i=0;i<v.length&&i<2000;i++)o[i]=deep(v[i]);return o}if(v&&typeof v==="object"){var o={};for(var k in v){if(k==="__proto__"||k==="constructor"||k==="prototype")continue;o[k]=deep(v[k])}return o}return v};var data=deep(raw);var good=[],ok=0;for(var n=0;n<6;n++){var entry=data.slots[n];var pass=false;if(entry&&typeof entry==="object"&&entry.g&&typeof entry.g==="object"&&typeof entry.g.first==="string"&&entry.g.first&&typeof entry.g.age==="number"&&entry.g.stats&&typeof entry.g.stats==="object"&&typeof entry.g.alive==="boolean"&&entry.g.timeline===undefined||entry&&entry.g&&entry.g.timeline){pass=true;try{JSON.stringify(entry)}catch(e2){pass=false}}good[n]=pass?entry:null;if(pass)ok++}if(!ok){toast("No valid saves found in that file");return}if(!confirm("Import this backup? "+ok+" valid save"+(ok===1?"":"s")+" found. Existing slots will be replaced by the backup."))return;for(var n=0;n<6;n++){if(good[n])saveSlot(n,good[n]);else deleteSlot(n)}saveJSON("shinobi_sprint_local_recovery_v1",slots());toast("Backup imported: "+ok+" save"+(ok===1?"":"s"));renderSettings()}catch(e){toast("Invalid or unsupported backup file")}};reader.readAsText(file)};input.click()};
  backupActs.appendChild(exportBtn);backupActs.appendChild(importBtn);backup.appendChild(backupActs);
  backup.appendChild(el("span","muted","Recovery copy: "+(loadJSON("shinobi_sprint_local_recovery_v1",null)?"available":"created on your next save")));
  v.appendChild(backup);
  var p2=panel("game","Options");
  var acts=el("div","acts");
  var b1=el("button","act");b1.appendChild(el("b",null,"🏛️ Legacy Hall"));b1.appendChild(el("span",null,"past lives"));b1.onclick=showLegacy;acts.appendChild(b1);
  var b2=el("button","act");b2.appendChild(el("b",null,"🚪 Title screen"));b2.appendChild(el("span",null,"back to the start"));b2.onclick=function(){$("#screen-game").classList.remove("on");$("#screen-title").classList.add("on")};acts.appendChild(b2);
  p2.appendChild(acts);v.appendChild(p2);
}

/* ============================ legacy hall ============================ */
function showLegacy(){
  $("#screen-death").classList.remove("on");
  $("#screen-game").classList.remove("on");
  $("#screen-legacy").classList.add("on");
  var l=legacyLog();
  var card=$("#legacyCard");card.innerHTML="";
  card.appendChild(el("div","tag","generations"));
  card.appendChild(el("h2","serif","Legacy Hall"));
  if(!l.length)card.appendChild(el("div","dbio","No lives recorded yet. Every life that ends leaves its story here."));
  l.forEach(function(e){
    var row=el("div","lrow");
    row.appendChild(el("div","grade",e.grade));
    var who=el("div","who");
    who.appendChild(el("b",null,e.name+(e.kkg?" · "+e.kkg:"")+(e.rogue?" · missing-nin":"")));
    who.appendChild(el("span",null,e.rank+" · died at "+e.age+" · "+e.village+" · "+e.era+" · "+e.score+" legacy"));     if(e.clan)who.appendChild(el("span",null,"Clan: "+e.clan));     if(e.deathCause)who.appendChild(el("span",null,"Cause of death: "+e.deathCause));     if(e.priorRank||e.career)who.appendChild(el("span",null,"Career: "+(e.career||e.rank)+(e.priorRank?" · Previous rank: "+e.priorRank:"")));     if(e.spec)who.appendChild(el("span",null,"Specialization: "+e.spec));     if(e.spouse)who.appendChild(el("span",null,"Married: "+e.spouse));     if(e.kids&&e.kids.length)who.appendChild(el("span",null,"Children: "+e.kids.join(", ")));     if(e.jutsuMastered)who.appendChild(el("span",null,"Techniques mastered: "+e.jutsuMastered));     if(e.talents&&e.talents.length)who.appendChild(el("span",null,"Talents: "+e.talents.join(", ")));     if(e.achievements&&e.achievements.length)who.appendChild(el("span",null,"Achievements: "+e.achievements.join(", ")));     if(e.biography)who.appendChild(el("div","dbio",e.biography));
    row.appendChild(who);
    card.appendChild(row);
  });
  var b=el("button","btn","Back");b.onclick=function(){$("#screen-legacy").classList.remove("on");$("#screen-title").classList.add("on")};
  card.appendChild(b);
}

/* ============================ title, creator, init ============================ */
function fillCreator(){
  var es=$("#c-era");es.innerHTML="";
  var o=el("option",null,"Random era");o.value="r";es.appendChild(o);
  ERAS.forEach(function(e){var o2=el("option",null,e.name);o2.value=e.id;es.appendChild(o2)});
  var vs=$("#c-village");vs.innerHTML="";
  var o3=el("option",null,"Random village");o3.value="r";vs.appendChild(o3);
  Object.keys(VILLAGES).forEach(function(k){var o4=el("option",null,VILLAGES[k].name);o4.value=k;vs.appendChild(o4)});
  var cs=$("#c-clan");cs.innerHTML="";
  var o5=el("option",null,"Random (weighted)");o5.value="r";cs.appendChild(o5);
  var o6=el("option",null,"No clan (civilian)");o6.value="none";cs.appendChild(o6);
  CLANS.forEach(function(c){var o7=el("option",null,c.n+" ("+c.r+")");o7.value=c.n;cs.appendChild(o7)});
}

/* ============================ cinematic multi-step creator ============================ */
var CC={step:"intro",name:"",village:null,eraId:null,eraPicked:false,gender:null,clanRoll:null,origin:null,trait:null,last:"",timers:[]};
var ORIGINS=["born to a farming family on the village outskirts","born to a merchant family that deals in silk and steel","born to two active-duty shinobi; you saw more of the mission hall than a crib","orphaned at birth and raised in the village orphanage","the youngest child of a lesser shinobi household","born above a teahouse your family runs near the mission hall","born during a border scare, with the village gates shut for a week","born into a family of potters who quietly still forge shinobi tools"];
var TRAITS=["stubborn to a fault","quiet, but you miss nothing","reckless, in the way that gets people promoted or killed","a natural liar with an honest face","gentle in a house of blades","hungry to prove something","lazy, right up until it matters","too honest for a career in espionage","lucky at cards, unlucky in everything else","obsessed with stories of old heroes"];
var RARITY_COLOR={common:"#8a8f98",uncommon:"#3fae6a",rare:"#4d8fd1",epic:"#9b59d0",legendary:"#d3a94c",mythical:"#c22b45",secret:"#b04ad6"};
var CLAN_KANJI={Uchiha:"\u6247",Hyuga:"\u65e5",Senju:"\u5343",Uzumaki:"\u6e29",Sarutobi:"\u733f",Nara:"\u5948",Akimichi:"\u79cb",Yamanaka:"\u5c71",Aburame:"\u6cb9",Inuzuka:"\u72ac",Kurama:"\u978d",Hatake:"\u7551",Shimura:"\u5fd7",Fuma:"\u98a8",Yuki:"\u96ea",Hozuki:"\u9b3c",Kaguya:"\u304b",Terumi:"\u7167",Darui:"\u96f7",Kamizuru:"\u8702",Kedoin:"\u5f71",Yotsuki:"\u96f2",Yotsuya:"\u4eba",Ishikawa:"\u77f3",Amagiri:"\u96e8",Fujimori:"\u85e4",Kurosawa:"\u9ed2",Tachibana:"\u6a58",Shirakami:"\u767d",Otsutsuki:"\u5927",Hagoromo:"\u7fbd",Chinoike:"\u8840",Jugo:"\u5492",Iburi:"\u7159",Tsuchigumo:"\u571f",Onikuma:"\u9b3c",Hoki:"\u5b9d",Kohaku:"\u7425",Izuno:"\u6cc9",Lee:"\u674e",Ryu:"\u9f8d",Vex:"\u865a",Rin:"\u6797"};
var CC_BAD=["fuck","shit","bitch","asshole","dick","cunt","nigg","fag","slut","whore","rape","porn","sex","cock","pussy","nazi","hitler"];
function ccTimer(fn,ms){CC.timers.push(setTimeout(fn,ms))}
function ccClear(){CC.timers.forEach(clearTimeout);CC.timers=[]}
function ccShow(step){
  CC.step=step;ccClear();
  var order={intro:0,name:1,gender:2,village:3,era:4,roll:5,clan:6,fate:7,final:8};
  ["#cc-intro","#cc-pane-name","#cc-gender","#cc-village","#cc-era","#cc-roll","#cc-clan","#cc-fate","#cc-final"].forEach(function(id,n){
    var p=$(id);if(p)p.classList.toggle("on",order[step]===n);
  });
  var dots=$("#cc-prog");if(dots){
    var idx=order[step]-1;
    dots.querySelectorAll("i").forEach(function(d,i){d.classList.toggle("on",i<=idx)});
    dots.style.opacity=order[step]===0?"0":"1";
  }
}
function ccReset(){
  ccClear();
  CC={step:"intro",name:"",village:null,gender:null,eraId:null,clanRoll:null,last:"",timers:[]};
  ["#c-first","#c-last"].forEach(function(id){$(id).value=""});
  ["#c-gender","#c-era","#c-village","#c-clan"].forEach(function(id){$(id).value=id==="#c-clan"?"r":"r"});
  $("#cc-name").value="";$("#cc-name-err").textContent="";$("#cc-nameprev").innerHTML="";
  $("#cc-genders").querySelectorAll(".cc-vill").forEach(function(c){c.classList.remove("sel")});$("#cc-gender-err").textContent="";
  $("#cc-vill-err").textContent="";$("#cc-vills").innerHTML="";$("#cc-era-err").textContent="";$("#cc-eras").innerHTML="";$("#cc-spin").textContent="";$("#cc-spin").classList.remove("slow");$("#cc-spin").style.display="";
  $("#cc-clancard").hidden=true;$("#cc-clancard").innerHTML="";
  var sb=$("#cc-spin-btn");if(sb){sb.hidden=true;sb.disabled=false}var cf=$("#cc-clanless");if(cf)cf.hidden=true;var sl=$("#cc-spinsleft");if(sl)sl.textContent="";
  ccShow("intro");
}
function ccNameOK(n){
  n=(n||"").trim();
  if(n.length<2||n.length>16)return false;
  if(!/^[A-Za-z][A-Za-z' -]*$/.test(n))return false;
  var l=n.toLowerCase();
  for(var i=0;i<CC_BAD.length;i++)if(l.indexOf(CC_BAD[i])>=0)return false;
  return true;
}
function ccBuildVills(){
  var wrap=$("#cc-vills");wrap.innerHTML="";
  var desc={konoha:"The village hidden in the leaves. Fire country's heart, home of the Hokage and the strongest names in shinobi history.",suna:"The village hidden in sand. Hard desert life forges patient, deadly shinobi.",kiri:"The village hidden in mist. A ruthless past, and the quiet survivors it left.",kumo:"The village hidden in clouds. Prideful and strong, perched above the storms.",iwa:"The village hidden in stone. Unyielding earth, stubborn wills, immovable defense.",ame:"The village hidden in rain. Endless rain, endless adaptation: a village that endures anything and forgets nothing.",oto:"The village hidden in sound. New, restless, experimental: where forbidden research and strange talents find a home."};
  Object.keys(VILLAGES).forEach(function(k){
    var v=VILLAGES[k];
    var d=document.createElement("div");d.className="cc-vill";d.dataset.v=k;
    d.innerHTML='<span class="vk">'+v.kan+'</span><b>'+v.name+'</b><small>'+(v.label.replace("the ",""))+'</small><p>'+(desc[k]||"")+'</p>';
    if(window.FATE)d.insertAdjacentHTML("beforeend",window.FATE.villCard(k));
    d.onclick=function(){
      wrap.querySelectorAll(".cc-vill").forEach(function(c){c.classList.remove("sel")});
      d.classList.add("sel");CC.village=k;$("#cc-vill-err").textContent="";
    };
    wrap.appendChild(d);
  });
}
function ccForge(){
  CC.gender=(CC.genderWanted==="m"||CC.genderWanted==="f")?CC.genderWanted:(chance(.5)?"m":"f");
  CC.eraId=(CC.eraId&&CC.eraId!=="r")?CC.eraId:pick(ERAS).id;
  CC.origin=pick(ORIGINS);
  CC.trait=pick(TRAITS);
  $("#c-gender").value=CC.gender;
  $("#c-era").value=CC.eraId;
  $("#c-village").value=CC.village;
  $("#c-clan").value="none";
  $("#c-first").value=CC.name;
  var era=ERAS.find(function(e){return e.id===CC.eraId});
  var lines=["Rolling the dice of birth…","Body and spirit: sealed.",(CC.eraPicked?"The era takes shape: "+era.name+".":"The era finds you: "+era.name+"."),"A household waits in "+VILLAGES[CC.village].label+"…","Fate whispers: you were "+CC.origin+".","They already say you are "+CC.trait+"."];
  var i=0;
  function next(){
    if(i<lines.length){$("#cc-forgeline").textContent=lines[i];i++;ccTimer(next,460)}
    else ccTimer(function(){ccShow("clan");ccClanReveal()},420);
  }
  next();
}
function ccClanReveal(){
  CC.clanSpins=3;CC.clanCur=null;if(!CC.clanHistory)CC.clanHistory=[];CC.luckRoll=ri(1,10);
  var spin=$("#cc-spin"),card=$("#cc-clancard");
  card.hidden=true;card.innerHTML="";
  spin.style.display="";spin.classList.remove("slow");spin.textContent="\u00b7 \u00b7 \u00b7";
  $("#cc-clan-kick").textContent="Bloodline roll";
  $("#cc-spinsleft").textContent="3 spins left";
  var b=$("#cc-spin-btn");b.hidden=false;b.disabled=false;b.onclick=ccDoSpin;
  var f=$("#cc-clanless");f.hidden=false;
}
function ccDoSpin(){
  if(!CC.clanSpins)return;
  var b=$("#cc-spin-btn");b.disabled=true;
  CC.clanSpins--;
  $("#cc-spinsleft").textContent=CC.clanSpins===2?"2 spins left":CC.clanSpins===1?"1 spin left":"last spin";
  var spin=$("#cc-spin"),card=$("#cc-clancard");
  card.hidden=true;card.innerHTML="";
  spin.style.display="";spin.classList.remove("slow");
  var pool=CLANS.filter(function(c){return !c.v||c.v===CC.village}).map(function(c){return c.n});
  var rolled=rollClan(CC.village);
  var t=0,delay=70,stop=1600;
  function tick(){
    spin.textContent=pick(pool);
    t+=delay;delay=Math.min(300,delay*1.18);
    if(t<stop)ccTimer(tick,delay);
    else{
      spin.classList.add("slow");spin.textContent=rolled.n;
      ccTimer(function(){spin.style.display="none";ccShowClanCard(rolled)},550);
    }
  }
  tick();
}
function ccSpinAgain(){
  CC.clanCur=null;
  var card=$("#cc-clancard");card.hidden=true;card.innerHTML="";
  $("#cc-spin").style.display="";$("#cc-spin").classList.remove("slow");
  var b=$("#cc-spin-btn");b.disabled=false;
  ccDoSpin();
}
function ccKeepClan(c){
  CC.clanRoll=c;
  CC.last=c?c.n:pick(SURNAMES);
  $("#c-clan").value=c?c.n:"none";
  $("#c-last").value=CC.last;
  var spin=$("#cc-spin");spin.style.display="none";
  $("#cc-spin-btn").hidden=true;$("#cc-clanless").hidden=true;$("#cc-spinsleft").textContent="";
  ccToFinal();
}
function ccShowClanCard(c){
  var card=$("#cc-clancard");
  if(!c){ccKeepClan(null);return}
  CC.clanCur=c;
  var col=RARITY_COLOR[c.r]||"#8a8f98";
  var emb=CLAN_KANJI[c.n]||c.n.charAt(0).toUpperCase();
  var html='<div class="cc-emb" style="--rc:'+col+'">'+emb+'</div>'+
    '<span class="cc-rar" style="--rc:'+col+'">'+c.r+'</span>'+
    '<h4>Clan '+c.n+'</h4>'+
    '<div class="cc-spec">'+c.spec+(c.kg?" \u00b7 Kekkei genkai: "+c.kg:"")+'</div>'+
    '<p class="cc-desc">'+c.d+'</p>'+
    (c.pas?'<div class="cc-pas"><b>Passive — '+c.pas.n+'</b><br>'+c.pas.d+'</div>':'')+
    '<div class="cc-clanacts">'+
      '<button class="btn cc-next" id="cc-keep"><b>Keep this clan</b><small>it becomes your surname</small></button>'+
      (CC.clanSpins>0?'<button class="btn ghost" id="cc-again"><b>Spin again</b><small>'+CC.clanSpins+' spin'+(CC.clanSpins===1?"":"s")+' left</small></button>':'')+
    '</div>';
  card.innerHTML=html;card.hidden=false;
  card.classList.remove("rar-flash");
  if(c.r==="legendary"||c.r==="mythical"||c.r==="secret")void card.offsetWidth,card.classList.add("rar-flash");
  $("#cc-keep").onclick=function(){ccKeepClan(c)};
  var a=$("#cc-again");if(a)a.onclick=ccSpinAgain;
}
function ccToFinal(){
  if(window.FATE&&window.FATE.open){window.FATE.open();return}
  ccFinalGo();
}
function ccFinalGo(){
  rollPreview();
  if(window.FATE&&PENDING)window.FATE.stampPending(PENDING);
  var era=ERAS.find(function(e){return e.id===CC.eraId});
  var s='<b>'+CC.name+' '+CC.last+'</b><br>'+
    VILLAGES[CC.village].name+' · '+VILLAGES[CC.village].label+'<br>'+
    era.name+' · '+(CC.gender==="m"?"Male":"Female")+'<br>'+'Origin: '+CC.origin+'<br>Trait: '+CC.trait+'<br>'+
    (CC.clanRoll?('Clan '+CC.clanRoll.n+' · '+CC.clanRoll.r):'No clan · civilian')+
    (PENDING&&PENDING.kkg?'<br>Bloodline: '+PENDING.kkg+' (dormant)':'');
  if(window.FATE)s+=window.FATE.summaryHTML();
  $("#cc-finalsum").innerHTML=s;
  $("#cc-bio").textContent=PENDING?PENDING.bio:"";
  ccShow("final");
}

function ccNameNext(){
  var v=$("#cc-name").value.trim();
  if(!v){$("#cc-name-err").textContent="Give your shinobi a name first.";return}
  if(!ccNameOK(v)){$("#cc-name-err").textContent=v.length>16?"Sixteen letters or fewer.":"A plain name, 2-16 letters, nothing rude.";return}
  CC.name=v.charAt(0).toUpperCase()+v.slice(1);
  $("#c-first").value=CC.name;
  ccShow("gender");
  if(!$("#cc-genders").children.length)ccBuildGenders();
}
function ccBuildGenders(){
  var wrap=$("#cc-genders");wrap.innerHTML="";
  [["m","\u2642","Boy","male","Born a boy of the shinobi world. Your name and your story follow from here."],
   ["f","\u2640","Girl","female","Born a girl of the shinobi world. Your name and your story follow from here."],
   ["r","\uD83C\uDFB2","Let Fate Decide","the dice choose","The dice of birth decide whether you are born a boy or a girl."]].forEach(function(c){
    var d=document.createElement("div");d.className="cc-vill";d.dataset.g=c[0];
    d.innerHTML='<span class="vk">'+c[1]+'</span><b>'+c[2]+'</b><small>'+c[3]+'</small><p>'+c[4]+'</p>';
    d.onclick=function(){
      wrap.querySelectorAll(".cc-vill").forEach(function(x){x.classList.remove("sel")});
      d.classList.add("sel");CC.genderPick=c[0];$("#cc-gender-err").textContent="";
    };
    wrap.appendChild(d);
  });
}
function ccGenderNext(){
  if(!CC.genderPick){$("#cc-gender-err").textContent="Choose a body, or let fate decide.";return}
  CC.genderWanted=CC.genderPick;
  ccShow("village");
  if(!$("#cc-vills").children.length)ccBuildVills();
}
function ccBuildEras(){
  var wrap=$("#cc-eras");wrap.innerHTML="";
  var cards=[{id:"r",name:"Random Era",small:"let fate decide",d:"The dice choose the age you are born into."}];
  ERAS.forEach(function(e){
    cards.push({id:e.id,name:e.name,small:e.war>.12?"age of war":(e.war>.05?"unsettled age":"relative peace"),d:e.d});
  });
  cards.forEach(function(c){
    var d=document.createElement("div");d.className="cc-vill";d.dataset.v=c.id;
    d.innerHTML='<span class="vk">'+(c.id==="r"?"\uD83C\uDFB2":"\u23F3")+'</span><b>'+c.name+'</b><small>'+c.small+'</small><p>'+c.d+'</p>';
    d.onclick=function(){
      wrap.querySelectorAll(".cc-vill").forEach(function(x){x.classList.remove("sel")});
      d.classList.add("sel");CC.eraId=c.id;CC.eraPicked=(c.id!=="r");$("#cc-era-err").textContent="";
    };
    wrap.appendChild(d);
  });
}
function ccEraNext(){
  if(!CC.eraId){$("#cc-era-err").textContent="Pick the era you are born into, or let fate decide.";return}
  ccShow("roll");ccForge();
}
function ccVillNext(){
  if(!CC.village){$("#cc-vill-err").textContent="Pick the village you are born into.";return}
  ccShow("era");
  if(!$("#cc-eras").children.length)ccBuildEras();
}

var PENDING=null;
function rollPreview(){
  var opts={first:$("#c-first").value,last:$("#c-last").value,gender:$("#c-gender").value,era:$("#c-era").value,village:$("#c-village").value,clan:$("#c-clan").value};
  if(opts.first==="")delete opts.first;
  if(opts.last===""||opts.last==="none")delete opts.last;
  if(opts.clan==="none"){opts.clan="__none__"}
  PENDING=generateLife(opts);
  if(CC.origin&&CC.trait){var oCap=CC.origin.charAt(0).toUpperCase()+CC.origin.slice(1);PENDING.bio+=" "+oCap+", and people already say you are "+CC.trait+".";}
  $("#bioPreview").textContent=PENDING.bio+"\n\nFamily: "+PENDING.family.parents.map(function(p){return p.name}).join(" & ")+(PENDING.family.siblings.length?" · "+PENDING.family.siblings.length+" sibling(s)":"")+"\nWealth: "+PENDING.familyWealth+(PENDING.clanName?"\nClan: "+PENDING.clanName+" ("+PENDING.clan.r+")":"\nClan: none")+"\nChakra nature: hidden until discovered\nBloodline: "+(PENDING.kkg?"possible ("+PENDING.kkg+")":"none");
}
function beginLife(){
  if(!PENDING)rollPreview();
  G=PENDING;PENDING=null;
  G.clanHistory=CC.clanHistory||[];G.secretSeen=G.secretSeen||[];CC.clanHistory=[];CC.luckRoll=null;
  if(!G.cid)G.cid="c"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  G.born=Date.now();
  $("#screen-creator").classList.remove("on");
  $("#screen-game").classList.add("on");
  feed("You were born: "+G.name+" of "+(G.clanName?"clan "+G.clanName+" in ":"")+G.villageName+", "+G.eraName+".","big");
  tl(0,G.bio);
  saveSlot("auto");
  VIEW="home";VTAB="feed";render();
}
/* ============================ cinematic new-life intro ============================ */
var CINE_LINES=[
 {t:"In a world where villages are built upon strength\u2026",at:1800},
 {t:"Where clans carry bloodlines passed down for generations\u2026",at:6000},
 {t:"And where the name you are born with can shape your future\u2026",at:10200},
 {t:"Not every shinobi is destined for greatness.",at:16400},
 {t:"Some are forgotten.",at:20000},
 {t:"Some become legends.",at:22200},
 {t:"And some change the world without ever intending to.",at:24600},
 {t:"Your story doesn\u2019t begin with a choice of power.",at:30200},
 {t:"It begins with a birth.",at:33400},
 {t:"A name.",at:39600},
 {t:"A village.",at:41600},
 {t:"A bloodline you never chose.",at:43600},
 {t:"Everything else\u2026",at:46400},
 {t:"\u2026is up to you.",at:48400}
];
var CINE_TOTAL=52100;
var CINE=null;
function cineNarrator(){return null}
function cineSay(text){/* narrator voice removed: subtitles carry the lines */}
function cineSub(t){var el2=$("#cine-sub");if(!el2)return;el2.classList.remove("show");void el2.offsetWidth;el2.textContent=t;el2.classList.add("show")}
function cineAudio(){
  try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    var ac=new AC();var master=ac.createGain();master.gain.value=0;master.connect(ac.destination);
    master.gain.setTargetAtTime(1,ac.currentTime,1.2);
    var len=2*ac.sampleRate,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<len;i++)d[i]=Math.random()*2-1;
    var src=ac.createBufferSource();src.buffer=buf;src.loop=true;
    var lp=ac.createBiquadFilter();lp.type="lowpass";lp.frequency.value=420;
    var wg=ac.createGain();wg.gain.value=.04;
    src.connect(lp);lp.connect(wg);wg.connect(master);src.start();
    var lfo=ac.createOscillator();lfo.frequency.value=.07;
    var lg=ac.createGain();lg.gain.value=.03;lfo.connect(lg);lg.connect(wg.gain);lfo.start();
    var mg=ac.createGain();mg.gain.value=0;mg.connect(master);
    [[110,"sine",1],[164.81,"sine",1],[220.5,"triangle",.35]].forEach(function(pr,ix){
      var o=ac.createOscillator();o.type=pr[1];o.frequency.value=pr[0];o.detune.value=ix*4-4;
      var og=ac.createGain();og.gain.value=pr[2];o.connect(og);og.connect(mg);o.start()});
    mg.gain.setTargetAtTime(.05,ac.currentTime,14);
    [[8,523.25],[27,659.25]].forEach(function(b){setTimeout(function(){
      if(!CINE)return;
      var o=ac.createOscillator();o.type="sine";o.frequency.value=b[1];
      var g2=ac.createGain();g2.gain.value=0;
      g2.gain.setTargetAtTime(.06,ac.currentTime,.02);g2.gain.setTargetAtTime(0,ac.currentTime+.25,.9);
      o.connect(g2);g2.connect(master);o.start();o.stop(ac.currentTime+4)},b[0]*1000)});
    return {ac:ac,g:master}}catch(e){return null}
}
function cineHeart(a){if(!a)return;try{var ac=a.ac;
  for(var k=0;k<4;k++){[0,.42].forEach(function(off){
    var t=ac.currentTime+k*1.15+off;
    var o=ac.createOscillator();o.type="sine";o.frequency.setValueAtTime(62,t);o.frequency.exponentialRampToValueAtTime(40,t+.18);
    var g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(k===0?.5:.32,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.3);
    o.connect(g);g.connect(a.g);o.start(t);o.stop(t+.35)})}}catch(e){}}
function cineEnd(){if(!CINE)return;var d=CINE.done;CINE.stopped=true;CINE.timers.forEach(clearTimeout);
  try{if(window.speechSynthesis)speechSynthesis.cancel()}catch(e){}
  if(CINE.ac){var a=CINE.ac;try{a.g.gain.setTargetAtTime(0,a.ac.currentTime,.25)}catch(e){}
    setTimeout(function(){try{a.ac.close()}catch(e){}},700)}
  CINE=null;
  var c=$("#cine");if(c){c.classList.remove("on","out");c.hidden=true}
  var sb=$("#cine-sub");if(sb){sb.classList.remove("show");sb.textContent=""}
  if(d)d()}
function cinePlay(done){
  var c=$("#cine");if(!c){if(done)done();return}
  if(CINE)cineEnd();
  CINE={done:done||null,timers:[],stopped:false,ac:cineAudio(),nar:cineNarrator()};
  var sk=$("#cine-skip");if(sk)sk.onclick=cineEnd;
  c.hidden=false;c.classList.remove("out");c.classList.add("on");
  var grps=[".g1",".g2",".g3",".g4",".g5"].map(function(q){return c.querySelector(q)});
  var marks=[[0,0],[9800,1],[15600,2],[29400,3],[36500,4]];
  marks.forEach(function(m){CINE.timers.push(setTimeout(function(){if(!CINE)return;
    grps.forEach(function(g,j){if(g)g.classList.toggle("on",j===m[1])})},m[0]))});
  CINE_LINES.forEach(function(L){CINE.timers.push(setTimeout(function(){if(CINE&&!CINE.stopped){cineSub(L.t);cineSay(L.t)}},L.at))});
  CINE.timers.push(setTimeout(function(){if(CINE)cineHeart(CINE.ac)},36500));
  CINE.timers.push(setTimeout(function(){if(CINE&&!CINE.stopped){$("#cine").classList.add("out");CINE.timers.push(setTimeout(cineEnd,1700))}},50500));
}
function newLife(){
  cinePlay(function(){
    $("#screen-title").classList.remove("on");
    $("#screen-creator").classList.add("on");
    fillCreator();
    ccReset();ccBuildVills();
    rollPreview();
  });
}
function loadGame(idx){
  var all=slots();
  var s=all[idx];
  if(!s){toast("Empty slot");return}
  try{deserializeG(s.g)}catch(e){toast("That save is from an older version and can't load.");return}
  $("#screen-title").classList.remove("on");
  $("#screen-game").classList.add("on");
  if(!G.alive){showDeath();return}
  VIEW="home";VTAB="feed";closeCard();render();
}
function allIndex(s){var all=slots();for(var i=0;i<all.length;i++)if(all[i]===s)return i;return 0}
/* update log: every pushed update gets an entry here, the title chip reads the newest one */
var UPDATES=[
{d:"Nov 24, 2026",t:"The Training Overhaul",b:"Version 1.2.2. Every drill is its own game now. Fifteen training activities each got a bespoke mechanic: chakra meditation is a focus meter with streak bonuses, control exercises drift and spill, tree climbing reads bark condition checkpoint by checkpoint, water walking changes conditions every round, weights scale by load and rank, sprints are pure reaction with hurdles, endurance stages pay more the longer you push, taijutsu drills answer combos before the window closes, targets and kunai test distance and timing, hand seals grow with mastery, jutsu practice drills each technique through five mastery stages, genjutsu drills hide one impossible detail per scene, tactical sims grade your calls, and sparring keeps a full win-loss record. Grades now run D through S with full session results: score, accuracy, mistakes, stat gains, XP, drill mastery, personal records and NEW RECORD flashes. Difficulty tiers (Beginner, Intermediate, Advanced, Elite) unlock with rank and stats, mastery and records persist in every save slot, and anti-farm rules (fatigue, tapering, soft caps) keep grinding honest."},
{d:"Nov 24, 2026",t:"The Deeper Life Update",b:"Version 5.1.0. The simulator goes deeper on every axis. Careers become a real path: a new career event pool runs promotion boards, war field promotions, teaching rotations, student successes, civilian trades, council honors and a real retirement decision. Academy life gains exam season preparation choices, club days, study groups and rival challenges with stakes. Family life deepens: hideouts, gardens, heirlooms, a sibling who needs covering for, and a long night caring for a sick parent. Marriage gains anniversaries, a spouse's dream to support or discourage, and in-law dinners. Life-changing events land: war drafts, the loss of a mentor, scars that stay, and a summons from the Kage's council. Rare bloodline stirrings can wake a dormant kekkei genkai years early. Hidden history events fire by era: the Nine-Tails night in Konoha, the founding era's first academy class, warring-states clan raids, and Akatsuki rumors. Three new generational honors: The Line Continues, Legacy Keeper, and Full House. Descendants of high-honor lives now inherit family savings and a name that arrives before they do. The Legacy Hall keeps spouse, children, specialization, mastered techniques and talents for up to 100 past lives. Save import is hardened against malformed files, and every version display now reads the same number."},
{d:"Nov 22, 2026",t:"The RPG Overhaul",b:"Version 5.0.0. Life Unbound is now a playable shinobi RPG. A new Train tab opens The Way of the Shinobi: fifteen live drills (timing bars, reaction flashes, moving targets, seal sequences, steadiness holds, endurance taps, tactical calls and live sparring) that train twelve stats, chakra capacity, control, recovery, strength, speed, stamina, taijutsu, ninjutsu, genjutsu, intelligence, hand seal speed and perception, with XP, levels, fatigue and diminishing returns that reward a varied routine. A jutsu library of 64 techniques across 16 disciplines and ranks E through S: learn them from six teachers, from scrolls won on missions, from your clan, or through deeds, then practice them from Learned to Mastered, cutting cost and cooldown while raising power, and equip a loadout sized to your rank. Chakra development has a real progression screen and the chakra paper test reveals your elemental affinity. Interactive turn-based combat: attack, taijutsu chains, your equipped jutsu, defend, substitution, chakra charging, items, analysis and retreat against enemies whose behavior reads rank, health and chakra, with status effects, cooldowns and elemental visuals. Sparring against academy students, teammates, your rival and elite jonin at three difficulties. Missions from D to S run in playable stages with choices, skill checks and real combat. Exams are played: the graduation written test, chakra trial and practical bout, the full Chunin exam with survival and a tournament bracket, and jonin and Anbu advancement. A nine-branch skill tree spends level points your way. The life simulator drives it all: age, rank, clan, village, bonds and reputation shape what you can learn and who you meet. Saves migrate safely and nothing resets."},{d:"Nov 22, 2026",t:"The Complete Clan Overhaul",b:"Version 4.1.0. The clan system is rebuilt from the ground up. Seven rarity tiers: common, uncommon, rare, epic, legendary, mythical, and two secret clans that cannot appear in normal rolls at all. A full roster of 45 clans, adding the Otsutsuki, Hagoromo, Chinoike, Jugo, Iburi, Tsuchigumo, Onikuma, Hoki, Kohaku, Izuno, Lee and Ryu bloodlines, with Uzumaki now correctly Legendary. Every clan carries a real, named passive that touches actual math: stats, training speed, technique mastery, exams, missions, recovery, reputation, bond growth, tracking, evasion and resistances. Bonuses are derived live from your clan, so they can never stack or duplicate across refreshes, saves or age-ups. Weighted clan rolls now run at 48 / 27 / 15 / 7 / 2.5 / 0.5 percent, shifted by luck and owner controls, with clan roll history kept on your record. Twelve new clan techniques to unlock, from the Adamantine Sealing Chains to the Sixty-Four Palms. The clan tab is a new collection: search, rarity filters, full clan cards with passives and abilities, and a Forbidden Registry where the secret clans can be found at one in two million. Existing saves migrate safely: your clan stays yours, only its rarity label updates to the new scale."},{d:"Nov 22, 2026",t:"Age Up Never Leaves The Top",b:"Version 4.0.6. The AGE UP button is now a true pinned header: it lives at the very top of the game screen on every tab, sits just below the status bar instead of covering it, and never scrolls away no matter how far down you go. One year is always one tap away. Everything else is untouched."},{d:"Nov 22, 2026",t:"Talks Fix & Scene Continue",b:"Version 4.0.5. Fixed the two bugs QA caught in live play: every conversation from the People tab (Spend time, Face them and the rest) opens again, an internal name helper had gone missing and silenced them all; and the Continue button after an event summary now dismisses properly, so the year summary and the next year always load instead of waiting forever. Also tuned the title intro to hand you to the main menu on its own after about 6 seconds."},{d:"Nov 22, 2026",t:"Mission Board Fix",b:"Version 4.0.4. Fixed the mission board: the briefing lost track of the mission's rank and reward before the field, so outcomes miscalculated and pay, reputation and the record could not update. Missions now resolve at the right rank and reward, and every success and failure lands in the record. Also fixed loading a save: lives were reloading with a fresh random clan roll, so the clan tab could say you were clanless when you were not. Your real clan is now kept across saves."},{d:"Nov 22, 2026",t:"Age Up Moves To The Top",b:"Version 4.0.3. The AGE UP button now sits at the very top of the home screen and stays pinned there while you scroll, so one year is always one tap away. No more scrolling down for it. Everything else is untouched."},{d:"Nov 22, 2026",t:"Bridge Fix Round Two",b:"Version 4.0.2. The wiring bug behind the last fix had more strands: a second batch of the game core (year events, ranks, bonds, academy, the fate system) was still out of reach of the story and fate layers, so AGE UP could still die mid-year and the CHOOSE YOUR FATE step could fail to appear. Every connection is exposed now and verified live: age up runs the full year, the fate roll shows after the clan reveal, and People, Record and Character all open. Saves untouched."},
{d:"Nov 22, 2026",t:"Age-Up Fix & The People Tab",b:"Version 4.0.1. Fixed the bug that made AGE UP do nothing when clicked: the new Hearts & Voices systems could not reach the game core, so the click died silently before a single year passed. It now ages you up every time, runs the year\u2019s events and closes with the Year Summary. The People tab and the Record tab are really on the bottom bar now (and the Character tab opens again), and enrolling in the Academy fills your classroom with people to talk to. Everything else is untouched."},
{d:"Nov 22, 2026",t:"Hearts & Voices",b:"Version 4.0.0. Shinobi: Life Unbound is now a true life simulator. A new People tab puts everyone in this life on one screen: bond meters, what each person remembers about you, and a Spend time button that opens real conversations where your answers branch and every reply is shaped by who they are. Six voices (bold, steady, sharp, warm, distant, easygoing) speak and remember differently. Choices leave seeds: keep the pouch you found, spread a friend's secret, give your word as a child, and the consequences come back years later. Personality deepens: your dominant traits unlock new dialogue options and decide who you are becoming, from The Shield to The Storm. New life events (first words, the new kid, a dinner with edges, the lantern stranger) and bond and feud milestones now fire on their own. Existing saves, menus, character systems and progression are untouched."},
{d:"Nov 22, 2026",t:"Roll Your Own Clan",b:"Version 3.2.0. The bloodline is yours to roll now. After the dice of birth forge your origin and trait, the clan step hands you three spins: each one rolls a real clan from your village\u2019s bloodline pool at full rarity odds, you keep the one you want or spin again, and the clan you keep becomes your surname. Used all three? You keep the last roll. Rather walk alone? A quiet option lets you stay clanless, a civilian with nothing but your own name. Village pools still respect their lands, rare and mythical clans stay rare, and existing saves are untouched."},
  {d:"Nov 22, 2026",t:"Choose Your Gender",b:"Version 3.1.4. The creator asks one more question before the dice roll: a new step between your name and your village, CHOOSE YOUR BODY. Pick a boy, pick a girl, or let fate decide between them. Your choice shapes the first names fate rolls for you and the life the engine builds; let fate decide keeps it a true coin flip. Existing saves are untouched."},{d:"Nov 22, 2026",t:"Narrator Voice Removed",b:"Version 3.1.3. The intro no longer has a spoken narrator voice. The opening lines still play as subtitles over the visuals, wind and score, and Skip Intro works the same as before."},{d:"Nov 22, 2026",t:"Update Chip Fix",b:"Version 3.1.2. Fixed the Latest Update chip and the top of the update log: the newest entries were collapsing into one record, so the chip kept showing an older update. The chip and log now open with the newest entry, one record per update."},{d:"Nov 22, 2026",t:"The Living Title Screen",b:"Version 3.1.1. The title screen is alive now: clouds drift across the sky, the red moon breathes, ground mist rolls through the valley, embers rise, and the hero on the cliff gets wind in his cloak and hair. The scene also slowly breathes behind the menu. The version in the footer now always matches the version pill, no more two numbers on one screen. Small screens and reduced-motion settings fall back to the still image."},{d:"Nov 22, 2026",t:"Village Passives & Fates",b:"Version 3.1.0. Every village now grants a permanent birth passive that touches real math: the Leaf learns 10% faster and bonds easier, the Sand survives danger that kills others and finds Wind affinity more often, the Mist hits harder and reads water, the Cloud grows speed and taijutsu, the Stone endures and loses less to failure, and two new birthplaces join the dice: the Hidden Rain (adaptability, intelligence, rare encounters) and the Hidden Sound (jutsu growth, unusual abilities). After the clan reveal, the creator asks CHOOSE YOUR FATE: pick a handicap, roll a random one at weighted rarity (common, uncommon, rare, legendary), or walk away whole. Eight fates, from Fragile Constitution to Born Blind, each with real restrictions in training and missions, exclusive story events, NPC reactions and village-specific adaptation chains (One Arm One Storm in the Cloud, Stone Hearth, Mist Reader, The Patient Student, Sand Walker, Rain Efficiency, The Sealed Chord). Handicaps are never erased by leveling: adaptation is earned through choices and years, tracked on your record under BIRTH & TRAITS. Saves stay safe and migrate cleanly."},{d:"Nov 22, 2026",t:"The Life Simulator Overhaul — Phase 2",b:"Version 3.0.0. Every year of a life can now unfold as real story scenes: a dynamic event engine reads your age, village, clan, family, personality, reputation, relationships, rank and everything that happened before, then builds events that remember you — with 20+ categories from family and academy life to rivalries, tragedies, celebrations, romance, betrayals, political moves, war years, legendary meetings and genuinely rare secret events. Each scene is a full screen: title, category, rarity, age and location, narration, dialogue with named NPCs, and choices that actually change your life — some consequences land immediately, others wait years in your future and come back for you. NPCs remember what you did for them and to them, and greet you differently ever after. A personality system grows through your decisions (brave, ruthless, calm, reckless and more) instead of being picked at birth. Deep relationships track trust, respect and history, with milestones when bonds shift. Academy life gains real classmates and an instructor, classroom drama, prodigy recognition and exam pressure. Rivals grow on their own for years and return. Talents reveal themselves in tiers, from seal-shaping to a legendary wanderer's gift. A new Year Summary closes every age-up with what changed — stats, bonds, discoveries, honors — and a Life Record page (new Record tab) writes your biography only from what actually happened. Update logs now close with an X or a tap outside, no scrolling required. Existing saves, saves slots, features and menus are untouched; older saves migrate safely."},{d:"Nov 22, 2026",t:"Narrator Fix",b:"Version 2.2.1. The intro narrator now speaks in one consistent English voice at a calm, low pitch for the whole intro, instead of a random voice per line. Softer wind in the mix too."},{d:"Nov 22, 2026",t:"The Cinematic Opening",b:"Version 2.2.0. Starting a new life now opens a cinematic intro: a black screen that fades into animated shots of the world (mountains under the moon, village rooftops with lanterns, a forest patrol) while a narrator speaks the opening lines one at a time, with wind, distant bells, a slow-building score, and a heartbeat before the scroll opens. The narrator picks a random voice on each line where the browser supports it, and subtitles always run alongside. Skip Intro sits on screen the whole time, and settings gains a Replay Intro option. It plays for new lives only: loading a save or continuing goes straight in. About 50 seconds, skippable in one tap."},{d:"Nov 22, 2026",t:"Specializations & Sharper Missions",b:"Version 2.1.0. After graduation the assignment desk asks your specialization: Combat, Tracking, Medical, Intelligence, Support or Instructor Track. It goes in your file, shows on your record, and changes how missions play out: medical shinobi heal through injuries, combat and intelligence sharpen mission rolls, and going in exhausted costs you. Mission briefings now show your specialization and condition. New story events across childhood, academy, squad life and the world, including rare ones: a wandering sage, a temple scroll, a five-village summit, and a stray pup that stays."},{d:"Nov 22, 2026",t:"The Living World Update \u2014 Phase 1",b:"Version 2.0.0. Quiet years and age-gated childhood: ages 0-4 are early childhood, ages 5-7 bring first chakra awareness. New family and village event pools that use your actual household. Real households at birth: orphans, guardians, grandparents, small, large and prestigious families, each shaping your start. Academy subjects tracked per class, and graduation is now a real assessment you choose to take: early graduation, special recognition, or repeating a year. Training gains now have diminishing returns and cost fatigue, with conditioning and meditation added. Friends, rivals, teammates and students age, train and earn promotions on their own. Hidden achievements added. New: when a new version goes live, the game counts down 30 seconds and refreshes itself."},{d:"Nov 22, 2026",t:"Pickable Era & Fate Rolls",b:"The creator now asks which era you are born into (or let the dice decide), and the dice of birth roll a family origin and a personality trait into every life. They show in the forging, the final summary and your biography. Version 1.2.2."},{d:"Nov 22, 2026",t:"Version 1.1.0",b:"Version numbering is in effect: the last number bumps for small updates, the middle one for kinda big updates, the first one for huge ones. Today's batch (rebrand, creator overhaul, menu rework, intro every load) puts the game at 1.1.0."},{d:"Nov 22, 2026",t:"Intro Every Load",b:"The opening title sequence now plays on every visit and refresh, not just the first one. SKIP and Begin your story still get you straight in when you want to skip it."},
 {d:"Nov 22, 2026",t:"New Name",b:"Shinobi Sprint is now SHINOBI: LIFE UNBOUND. Same life sim, bigger name. Title screen, intro, credits, and page title all carry the new banner."},
 {d:"Nov 22, 2026",t:"Opening Title Sequence",b:"A new opening title sequence adds drifting embers, the SHINOBI SPRINT / LIFE OF A SHINOBI title build-in, a tagline, and Begin your story. Tap or skip to continue; a seen flag skips the intro on later loads. Shinobi Sprint is now a life-sim revamp."},
 {d:"Nov 22, 2026",t:"Cross Links",b:"A direct link to Shinobi Legacy now sits in the title footer, so you can jump from the sprint sim to the main game in one tap."},
 {d:"Nov 22, 2026",t:"Life & Legacy",b:"Eras, bloodline awakening, narrative missions, jutsu training, descendant system, a rebuilt dashboard-style game screen, clan surname fix, and a full main-menu rework."},
 {d:"Nov 22, 2026",t:"Clan Surnames",b:"A clan you pick always sticks now and your last name auto-fills with it. Random clan births take the clan surname, and relocated families get a line in your bio."},
 {d:"Nov 22, 2026",t:"First-Pass Life Sim",b:"Shinobi Sprint rebuilt as a full life simulator: birth, family, school, career, missions, aging, death, and a Legacy Hall for finished lives."}
];
function wireTitle(){
  $("#btn-new").onclick=newLife;
  $("#btn-continue").onclick=function(){
    var all=slots(),best=null,bi=-1;
    for(var i=0;i<all.length;i++){if(all[i]&&(!best||all[i].when>best.when)){best=all[i];bi=i}}
    if(!best){toast("No saved life found");return}
    loadGame(bi);
  };
  $("#btn-saves").onclick=saveMenuFromTitle;
  $("#btn-legacy").onclick=showLegacy;
  /* Age-up pinned header: keep the AGE UP bar just below the topbar on every tab */
(function(){var tb=document.querySelector(".topbar"),wrap=document.querySelector(".ageupwrap");if(!tb||!wrap)return;function pin(){var h=tb.getBoundingClientRect().height;if(h>0){document.documentElement.style.setProperty("--au-top",Math.round(h+6)+"px")}}if(window.ResizeObserver){try{new ResizeObserver(pin).observe(tb)}catch(e){}}window.addEventListener("resize",pin);["click","touchend"].forEach(function(ev){document.addEventListener(ev,function(){setTimeout(pin,60)},true)});setTimeout(pin,300);setTimeout(pin,1500)})();
$("#btn-ageup").onclick=function(){AGEUP_SPENT=0;ageUp();try{if(window.LIFE&&LIFE.finishYear&&G&&G.alive)LIFE.finishYear()}catch(e){}};
  $("#btn-reroll").onclick=rollPreview;
  $("#btn-begin").onclick=beginLife;
  $("#cc-go").onclick=function(){ccShow("name");$("#cc-name").focus()};
  $("#cc-name-next").onclick=ccNameNext;
  $("#cc-gender-next").onclick=ccGenderNext;
  $("#cc-vill-next").onclick=ccVillNext;
  $("#cc-era-next").onclick=ccEraNext;
  $("#cc-confirm").onclick=function(){ccClear();beginLife()};
  $("#cc-name").addEventListener("input",function(){
    var v=this.value.trim();
    $("#cc-nameprev").innerHTML=v?('<em>'+v.replace(/[<>&]/g,"")+'</em>'):"";
    $("#cc-name-err").textContent="";
  });
  $("#cc-name").addEventListener("keydown",function(e){if(e.key==="Enter")ccNameNext()});
  $("#btn-bell").onclick=function(){switchView("home");VTAB="feed";render()};
  $("#btn-gear").onclick=function(){switchView("settings")};
  /* cinematic title extras */
  var uc=$("#t-update");
  if(uc){
    var u=UPDATES[0];
    var us=uc.querySelector("span");if(us)us.textContent=u.t+" \u2014 "+u.d;
    uc.title="Tap to open the update log";
    uc.style.cursor="pointer";
    uc.onclick=function(){var log="";for(var i=0;i<UPDATES.length;i++){log+=(i?"\n\n":"")+UPDATES[i].d+" \u2014 "+UPDATES[i].t+"\n"+UPDATES[i].b}modalSafe("Update Log","Updates","What's new in Shinobi: Life Unbound:\n\n"+log)};
  }
  function titleRyo(){var all=slots(),best=null;for(var i=0;i<all.length;i++){if(all[i]&&all[i].g&&(!best||all[i].when>best.when))best=all[i]}return best&&best.g?Math.round(best.g.ryo||0):0}
  function setTitleRyo(){var v=titleRyo().toLocaleString("en-US");var a=$("#t-ryo-val"),b=$("#c-ryo-val");if(a)a.textContent=v;if(b)b.textContent=v}
  setTitleRyo();
  var tr=$("#t-ryo");if(tr)tr.onclick=saveMenuFromTitle;
  var cr=$("#c-ryo");if(cr)cr.onclick=saveMenuFromTitle;
  var bb=$("#btn-back");if(bb)bb.onclick=function(){menuOpen("btn-back")};
  function menuOpen(id){
    try{
      if(id==="btn-ach"){var lines=ACHIEVEMENTS.map(function(x){var got=G&&G.achievements&&includes(G.achievements,x.id);return x.h&&!got?"? ? ? (a hidden honor)":x.n+" ("+x.d+")"}).join("\n");modalSafe("Achievements","Achievements",ACHIEVEMENTS.length+" honors a shinobi can earn in a single life, some hidden until discovered:\n\n"+lines)}
      else if(id==="btn-settings"){modalSafe("Settings","Settings","Version "+GAME_VERSION+"\n\nAuto-update: when a new version goes live, the game starts a 30-second countdown and refreshes itself.\nAutosave: every age-up lands in the first empty slot.\nSaves live in this browser only.\n\nCareful: clearing your browser data clears every life you have lived.",[{t:"Replay Intro",d:"Watch the cinematic opening again",fn:function(){cinePlay(function(){})}},{t:"Reset all data",d:"Deletes every save and legacy record",fn:function(){if(confirm("Delete ALL saves and legacy records? This cannot be undone.")){try{localStorage.removeItem(LS_SLOTS);localStorage.removeItem(LS_LEGACY);localStorage.removeItem(LS_ACH)}catch(e){}toast("All data cleared");setTitleRyo()}}},{t:"Close"}])}
      else if(id==="btn-credits"){modalSafe("Credits","Credits","SHINOBI: LIFE UNBOUND\nA Naruto universe life simulator.\n\nBuilt by Trae5, with a little help from Fo.\n\nEvery life here is fiction. Respect the source material.")}
      else if(id==="btn-exit"){modalSafe("Farewell","Exit","The village will be here when you return.\n\nSafe travels, shinobi.",[{t:"Leave",fn:function(){try{window.close()}catch(e){}setTimeout(function(){toast("Close this tab whenever you're ready")},200)}},{t:"Stay"}])}
      else if(id==="btn-back"){$("#screen-creator").classList.remove("on");$("#screen-title").classList.add("on")}
    }catch(e){try{D.title="ERR menu "+id+": "+(e&&e.message?e.message:String(e))}catch(_){}}
  }
  var ba=$("#btn-ach");if(ba)ba.onclick=function(){menuOpen("btn-ach")};
  var bs=$("#btn-settings");if(bs)bs.onclick=function(){menuOpen("btn-settings")};
  var bc=$("#btn-credits");if(bc)bc.onclick=function(){menuOpen("btn-credits")};
  var bx=$("#btn-exit");if(bx)bx.onclick=function(){menuOpen("btn-exit")};
  D.addEventListener("click",function(e){
    var t=e.target;
    if(t&&t.closest){var b=t.closest("#btn-ach,#btn-settings,#btn-credits,#btn-exit,#btn-back");if(b)menuOpen(b.id)}
  },true);
  Array.prototype.forEach.call(D.querySelectorAll(".dice"),function(b){
    b.onclick=function(){var r=b.getAttribute("data-r");
      if(r==="first")$("#c-first").value=rollName($("#c-gender").value==="f"?"f":"m");
      else $("#c-last").value=($("#c-clan").value!=="r"&&$("#c-clan").value!=="none")?$("#c-clan").value:pick(SURNAMES);
      rollPreview();
    };
  });
  $("#c-clan").addEventListener("change",function(){var v=$("#c-clan").value;if(v!=="r"&&v!=="none")$("#c-last").value=v;rollPreview()});
  ["c-first","c-last","c-gender","c-era","c-village","c-clan"].forEach(function(id){$("#"+id).onchange=rollPreview});
}
function saveMenuFromTitle(){
  var c=$("#mcard");c.innerHTML="";
  c.appendChild(el("div","mk","Save slots"));
  c.appendChild(el("h3","serif","Load a life"));
  var box=el("div");
  var all=slots();
  for(var i=0;i<6;i++){
    var s=all[i];
    var row=el("div","list-row");
    var who=el("div","who");
    who.appendChild(el("b",null,"Slot "+(i+1)+(s?" — "+s.g.name+" (age "+s.g.age+", "+s.g.rank+", "+s.g.eraId+")":" — empty")));
    row.appendChild(who);
    if(s){var lb=el("button","btn small","Load");lb.onclick=function(idx){return function(){$("#modal").classList.remove("on");loadGame(idx)}}(i);
      var db=el("button","btn small ghost","Delete");db.onclick=function(idx){return function(){
        if(!confirm("Delete slot "+(idx+1)+"?"))return;deleteSlot(idx);saveMenuFromTitle();
      }}(i);
      row.appendChild(lb);row.appendChild(db)}
    box.appendChild(row);
  }
  c.appendChild(box);
  var close=el("button","btn mclose","Close");close.onclick=function(){$("#modal").classList.remove("on")};
  c.appendChild(close);
  $("#modal").classList.add("on");
}


/* ============================ overlay modals: jutsu, shop, retire ============================ */
function showJutsuModal(){
  var c=$("#mcard");c.innerHTML="";
  c.appendChild(el("div","mk","Techniques"));
  c.appendChild(el("h3","serif","Jutsu"));
  var box=el("div");
  var list=jutsuListForTab().filter(function(x){return x.can||x.rec});
  if(!list.length)box.appendChild(el("div","mtext","No techniques available yet. Train your fundamentals first."));
  list.forEach(function(x){
    var row=el("div","list-row");
    var who=el("div","who");
    who.appendChild(el("b",null,x.j.n));
    who.appendChild(el("span",null,x.rec?("mastery "+x.rec.mastery+"/"+x.j.masteryMax+" · progress "+Math.round(x.rec.progress)):("needs: "+reqText(x.j))));
    row.appendChild(who);
    var acts=el("div","list-acts");
    if(!x.rec){var b=el("button","btn small","Learn");b.onclick=function(){learnJutsu(x.j);AGEUP_SPENT++;showJutsuModal()};acts.appendChild(b)}
    else{var b2=el("button","btn small ghost","Train");b2.onclick=function(){trainJutsu(x.j);G.fatigue=clamp(G.fatigue+6,0,100);AGEUP_SPENT++;showJutsuModal()};acts.appendChild(b2)}
    row.appendChild(acts);box.appendChild(row);
  });
  c.appendChild(box);
  var close=el("button","btn mclose","Close");close.onclick=function(){$("#modal").classList.remove("on");render()};
  c.appendChild(close);
  $("#modal").classList.add("on");
}
function showShop(){
  var c=$("#mcard");c.innerHTML="";
  c.appendChild(el("div","mk","Village Market"));
  c.appendChild(el("h3","serif","Buy supplies — "+money(G.ryo)));
  var box=el("div");
  Object.keys(ITEMS).forEach(function(id){
    var it=ITEMS[id];
    var row=el("div","list-row");
    var who=el("div","who");who.appendChild(el("b",null,it.n+" — "+money(it.price)));who.appendChild(el("span",null,it.d));
    row.appendChild(who);
    var b=el("button","btn small","Buy");
    b.onclick=function(){
      if(G.ryo<it.price){toast("Not enough ryō");return}
      addRyo(-it.price);G.inventory.push(id);toast("Bought "+it.n);showShop();
    };
    row.appendChild(b);box.appendChild(row);
  });
  c.appendChild(box);
  var close=el("button","btn mclose","Close");close.onclick=function(){$("#modal").classList.remove("on");render()};
  c.appendChild(close);
  $("#modal").classList.add("on");
}
function showRetire(){
  modal("Retirement","Career","Full pension, honors, a house on the hill. The vest comes off on your terms.",
    [{t:"Retire with honors",fn:function(){G.retired=true;G.retiredYear=G.age;G.career="Retired Shinobi";award("retired");fbig("You retire with honors.","good");tl(G.age,"Retired with honors")}},{t:"Keep serving"}]);
}
function modalSafe(){try{paperModal.apply(null,arguments)}catch(e){try{toast("Something went wrong opening that menu") }catch(_){}}}
/* ============================ update watch ============================ */
var GAME_VERSION="1.2.2";
(function(){var fv=document.getElementById("t-ver-text");if(fv)fv.textContent="Version "+GAME_VERSION})();
function updStatus(text,upd){
  var s=document.getElementById("t-status");
  if(!s)return;
  s.classList.toggle("upd",!!upd);
  var t=document.getElementById("t-status-text");
  if(t)t.textContent=text;
}
function startUpdateWatch(){
  function check(){
    try{
      fetch("version.json?cb="+Date.now()).then(function(r){return r.ok?r.json():null}).then(function(d){
        if(d&&d.v){
          if(d.v!==GAME_VERSION){updStatus("Updating \u00b7 new version live",true);beginUpdateCountdown();}
          else updStatus("Online \u00b7 Version "+GAME_VERSION,false);
        }
      }).catch(function(){});
    }catch(e){}
  }
  check();setInterval(check,45000);
}
function beginUpdateCountdown(){
  var o=document.getElementById("upd");
  if(!o||o.classList.contains("on"))return;
  o.classList.add("on");
  var n=30,c=document.getElementById("upd-count");
  var t=setInterval(function(){n--;if(c)c.textContent=n;if(n<=0){clearInterval(t);try{location.reload()}catch(e){}}},1000);
}
/* Cloud saves: legacy device saves are never migrated. */ (function(){var active=null,cloud=null,busy=false,pending={},seq=0,mode='starting',gate=document.createElement('div');gate.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#10090c;color:#dfb963;display:grid;place-items:center;font:18px system-ui';gate.textContent='Starting game...';document.body.appendChild(gate);function status(m){var e=document.getElementById('cloud-status');if(e)e.textContent=m}function pendingKey(){return LS_SLOTS+'_pending'}function mark(k,v){if(!cloud)return;pending[String(k)]={rev:Date.now().toString(36)+'-'+(++seq),value:v};saveJSON(pendingKey(),pending);flush()}function flush(){if(!cloud||busy)return;var keys=Object.keys(pending);if(!keys.length){status('Cloud saves connected');return}busy=true;(async function(){for(var i=0;i<keys.length;i++){var k=keys[i],p=pending[k];if(!p)continue;var fields={};fields[k]=p.value===null?firebase.firestore.FieldValue.delete():p.value;await cloud.set({slots:fields,updatedAt:new Date().toISOString()},{merge:true});if(pending[k]&&pending[k].rev===p.rev){delete pending[k];saveJSON(pendingKey(),pending)}}})().then(function(){busy=false;if(Object.keys(pending).length)flush();else status('Cloud saves connected')},function(){busy=false;status('Cloud unavailable - saves stay on this device')})}var oldLoad=loadGame,oldBegin=beginLife,oldDesc=startAsDescendant;loadGame=function(i){var s=slots()[i],deadIds=loadJSON('shinobi_sprint_dead_v1',{})||{};if(s&&s.g&&(s.g.alive===false||(s.g.cid&&deadIds[s.g.cid]))){deleteSlot(i);toast('That life has ended.');return}if(s)active=Number(i);return oldLoad(i)};beginLife=function(){active=null;return oldBegin.apply(this,arguments)};startAsDescendant=function(){active=null;return oldDesc.apply(this,arguments)};saveSlot=function(idx,data){try{if((data&&data.g&&data.g.alive===false)||(!data&&(!G||G.alive===false)))return;var a=slots();if(!Array.isArray(a))a=[];if(idx==='auto'||idx==='last'){if(active===null){for(var i=0;i<6;i++)if(!a[i]){active=i;break}}if(active===null){toast('All save slots are full. Delete a slot to autosave.');return}idx=active}else active=Number(idx);if(!data){var g=serializeG();g.name=G.name||[g.first,g.last].filter(Boolean).join(' ');data={g:g,when:new Date().toISOString()}}data=JSON.parse(JSON.stringify(data));a[idx]=data;saveJSON(LS_SLOTS,a);saveJSON("shinobi_sprint_local_recovery_v1",a);mark(idx,data)}catch(e){status('Save error - check browser storage')}};deleteSlot=function(i){var a=slots();a[i]=null;saveJSON(LS_SLOTS,a);saveJSON("shinobi_sprint_local_recovery_v1",a);mark(i,null);if(active===Number(i))active=null};window.clearActiveDeathSlot=function(){if(active!==null)deleteSlot(active)};document.addEventListener('click',function(e){var t=e.target;if(!t||!t.closest)return;var action=t.closest('#screen-game button')&&!t.closest('#view-settings');var choice=t.closest('#eventCard .echoice,#mcard .mchoice');if(action||choice)setTimeout(function(){try{if(G&&(document.getElementById('screen-game').classList.contains('on')||document.getElementById('screen-death').classList.contains('on')))saveSlot('auto')}catch(_){}},0)});window.addEventListener('online',flush);function maintenance(){var o=document.createElement('div');o.id='maintenance-screen';o.setAttribute('role','alert');o.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;text-align:center;padding:2rem;background:#10090c;color:#dfb963;font-family:system-ui';var card=document.createElement('div'),h=document.createElement('h1'),p=document.createElement('p'),a=document.createElement('a');h.textContent='UNDER MAINTENANCE';p.textContent='Shinobi: Life Unbound is temporarily offline. Please check back later.';a.href='owner.html';a.textContent='Owner sign in';a.style.color='#dfb963';card.append(h,p,a);o.appendChild(card);document.body.appendChild(o)}function release(){if(gate.parentNode)gate.remove()}var timer=setTimeout(function(){if(mode==='starting'){mode='offline';status('Cloud unavailable - saves stay on this device');release()}},8000);(async function(){try{if(!window.firebase||!firebase.auth||!firebase.firestore)throw Error('Firebase unavailable');var app=firebase.initializeApp({apiKey:'AIzaSyA6EnB41g34TnhhLNJcx8OA2vmTrShwoi4',authDomain:'shinobi-life-unbound.firebaseapp.com',projectId:'shinobi-life-unbound',storageBucket:'shinobi-life-unbound.firebasestorage.app',messagingSenderId:'231893959325',appId:'1:231893959325:web:4dc77151958863c51b0a74'},'shinobi-players'),auth=app.auth(),db=app.firestore();db.settings({ignoreUndefinedProperties:true});var ms=await db.doc('config/maintenance').get({source:'server'});if(mode!=='starting')return;if(ms.exists&&ms.data().enabled===true)maintenance();var user=await new Promise(function(resolve,reject){var unsub=auth.onAuthStateChanged(function(u){unsub();if(u)resolve(u);else auth.signInAnonymously().then(function(c){resolve(c.user)},reject)},reject)});if(mode!=='starting')return;var ref=db.doc('saves/'+user.uid),snap=await ref.get({source:'server'});if(mode!=='starting')return;var remote=snap.exists&&snap.data().slots||{},newKey='shinobi_sprint_cloud_v3_'+user.uid,queued=loadJSON(newKey+'_pending',{})||{},all=[];var deadIds=loadJSON('shinobi_sprint_dead_v1',{})||{};for(var n=0;n<6;n++){var k=String(n),v=queued[k]?queued[k].value:remote[k];if(v&&v.g&&(v.g.alive===false||(v.g.cid&&deadIds[v.g.cid]))){queued[k]={rev:Date.now().toString(36)+'-'+(++seq),value:null};v=null}all[n]=v&&v.g?v:null}saveJSON(newKey+'_pending',queued);LS_SLOTS=newKey;pending=queued;saveJSON(LS_SLOTS,all);saveJSON("shinobi_sprint_local_recovery_v1",all);cloud=ref;mode='cloud';clearTimeout(timer);release();flush();var best=null;all.forEach(function(s){if(s&&s.g&&(!best||s.when>best.when))best=s});['t-ryo-val','c-ryo-val'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=Math.round(best&&best.g.ryo||0).toLocaleString('en-US')})}catch(e){if(mode==='starting'){mode='offline';clearTimeout(timer);status('Cloud unavailable - saves stay on this device');release()}}})()})(); startUpdateWatch();
wireTitle();
/* bridge: expose core helpers + live state to the LIFE/SOCIAL/FATE layers */
try{
  var __exp={"$":$,"rnd":rnd,"pick":pick,"chance":chance,"ri":ri,"clamp":clamp,"el":el,"st":st,"tl":tl,"fbig":fbig,"feed":feed,"weighted":weighted,"newNPC":newNPC,"inAcademy":inAcademy,"cap":cap,
    "addRyo":addRyo,"addStat":addStat,"rep":rep,"relUp":relUp,"promote":promote,"award":award,"byKind":byKind,"rankRank":rankRank,"closeCard":closeCard,"render":render,"renderView":renderView,"switchView":switchView,
    "dieOf":dieOf,"serializeG":serializeG,"deserializeG":deserializeG,"enrollAcademy":enrollAcademy,"ageUp":ageUp,"ccClear":ccClear,"ccFinalGo":ccFinalGo,"rollClan":rollClan,"trainGain":trainGain,
    "tryKGAwake":tryKGAwake,"tryNatureDiscover":tryNatureDiscover,"pickEvent":pickEvent,
    "ERAS":ERAS,"KKG":KKG,"VILLAGES":VILLAGES,"NAV":NAV};
  for(var __k in __exp){try{Object.defineProperty(window,__k,{value:__exp[__k],configurable:true,writable:true})}catch(__e){}}
  Object.defineProperty(window,"G",{get:function(){return G},set:function(__v){G=__v},configurable:true});
  Object.defineProperty(window,"CC",{get:function(){return CC},set:function(__v){CC=__v},configurable:true});
  Object.defineProperty(window,"VIEW",{get:function(){return VIEW},set:function(__v){VIEW=__v},configurable:true});
  Object.defineProperty(window,"CARD_HOLD",{get:function(){return CARD_HOLD},set:function(__v){CARD_HOLD=__v},configurable:true});
}catch(__e){}
})();
