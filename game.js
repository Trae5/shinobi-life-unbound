/* Shinobi: Life Unbound (v2, Life & Legacy)
   A Naruto-universe life simulator. Vanilla JS, no dependencies. */
(function(){
"use strict";

/* ============================ utilities ============================ */
var D=document;
function $(id){return D.getElementById(String(id).replace(/^#/,""))}
function el(tag,cls,txt){var e=D.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
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
  iwa:{name:"Iwagakure",label:"the Hidden Stone",kan:"土",kage:"Tsuchikage",academyAge:9}
};

/* ============================ data: clans & bloodlines ============================ */
/* r: rarity tier — mythical, legendary, rare, uncommon, common. spec + flavor + KG link. */
var CLANS=[
  {n:"Uchiha",r:"legendary",spec:"Fire · Genjutsu",kg:"Sharingan",v:"konoha",
   d:"The village's most feared name since the massacre-in-waiting. Their eyes see through lies and copy what they witness.",
   hist:"Your family keeps its fan crest covered in public."},
  {n:"Hyuga",r:"legendary",spec:"Gentle Fist · Perception",kg:"Byakugan",v:"konoha",
   d:"The oldest pure bloodline in the Leaf, split between main house and branch, bound by the Caged Bird seal.",
   hist:"You were born into the branch house's quiet discipline."},
  {n:"Senju",r:"mythical",spec:"Wood Release · Vitality",kg:"Wood Release",v:"konoha",
   d:"The clan that founded the Leaf. Its direct line was thought gone for a generation.",
   hist:"Elders still bow when your family name is spoken."},
  {n:"Uzumaki",r:"rare",spec:"Sealing Arts · Endurance",kg:null,v:"konoha",
   d:"Red-haired survivors of a drowned village, famous for enormous life force and fūinjutsu.",
   hist:"Your mother's red hair turns heads in the market."},
  {n:"Sarutobi",r:"rare",spec:"All-rounder · Willpower",kg:null,v:"konoha",
   d:"A clan of strong-willed shinobi with deep ties to the village leadership, called the fire of the Leaf.",
   hist:"Your grandfather served the second Hokage directly."},
  {n:"Nara",r:"uncommon",spec:"Shadow Arts · Strategy",kg:null,v:"konoha",
   d:"Lazy geniuses who tend deer and shadow techniques, and solve every problem with the least effort possible.",
   hist:"The family deer pen is older than the village walls."},
  {n:"Akimichi",r:"uncommon",spec:"Body Expansion · Strength",kg:null,v:"konoha",
   d:"Big appetites, bigger bodies, and secret calorie-control techniques passed down three generations.",
   hist:"Dinner at your house feeds twelve and there are four of you."},
  {n:"Yamanaka",r:"uncommon",spec:"Mind Arts · Sensory",kg:null,v:"konoha",
   d:"Florists by day, mind-walkers by trade. Their shop has served the village for sixty years.",
   hist:"The flower shop is the family front and the family pride."},
  {n:"Aburame",r:"uncommon",spec:"Kikaichū · Tracking",kg:null,v:"konoha",
   d:"Quiet hosts of living insects. Few words, many kikaichū, unbreakable contracts.",
   hist:"At your naming ceremony, beetles were given a home in your skin."},
  {n:"Inuzuka",r:"uncommon",spec:"Ninken · Tracking",kg:null,v:"konoha",
   d:"Loud, loyal, and always smelling faintly of dog. Every child is paired with a ninja hound at six.",
   hist:"Your puppy sleeps in your bed and guards your socks."},
  {n:"Kurama",r:"rare",spec:"Genjutsu Mastery",kg:null,v:"konoha",
   d:"A small clan whose genjutsu once shook nations. Their power burns minds, including their own.",
   hist:"Your aunt paints scenes no one else can see, and they are always real."},
  {n:"Hatake",r:"rare",spec:"Kenjutsu · Speed",kg:null,v:"konoha",
   d:"A legacy of white-fanged shinobi. The name still carries weight and a white scabbard.",
   hist:"A white chokutō hangs above the family shrine."},
  {n:"Shimura",r:"common",spec:"Wind Release · Discipline",kg:null,v:"konoha",
   d:"An old founding family of strict teachers and council loyalists.",
   hist:"Family dinners begin with the village oath."},
  {n:"Fuma",r:"common",spec:"Shurikenjutsu",kg:null,v:"konoha",
   d:"A widespread clan of shuriken specialists scattered across the land of Fire.",
   hist:"Your uncle claims the clan once served a daimyō. Nobody can prove it."},
  {n:"Yuki",r:"rare",spec:"Ice Release",kg:"Ice Release",v:"kiri",
   d:"Ice-release carriers, once hunted in the Mist. They keep their kekkei genkai quiet.",
   hist:"Your family never talks about why they moved to the coast."},
  {n:"Hozuki",r:"uncommon",spec:"Hydrification",kg:null,v:"kiri",
   d:"Mist shinobi who can turn their bodies to water and carry swords in gourds.",
   hist:"Family legend says a great-grandfather was executed with a oiled gourd on his back."},
  {n:"Hoshigaki",r:"uncommon",spec:"Shark Arts · Strength",kg:null,v:"kiri",
   d:"Saw-toothed sharks of the Mist coastline. Samehada's previous wielders came from here.",
   hist:"Your father's teeth are filed to points. Yours will be too, in time."},
  {n:"Kaguya",r:"rare",spec:"Shikotsumyaku",kg:"Dead Bone Pulse",v:"kiri",
   d:"A violent, nearly extinct bloodline of bone dancers. The village tolerates what it cannot tame.",
   hist:"You were told never to bleed in public."},
  {n:"Terumi",r:"rare",spec:"Lava & Boil Release",kg:"Lava Release",v:"kiri",
   d:"Lava and boil release run in this flashy Mist line, alongside theatrical confidence.",
   hist:"Your family hosts the loudest festivals on the coast."},
  {n:"Yotsuya",r:"common",spec:"Puppetry",kg:null,v:"suna",
   d:"Sand-country scholars turned puppeteers, keeping three workshops in the artisan quarter.",
   hist:"Your first toy was a one-armed marionette."},
  {n:"Sasori",r:"rare",spec:"Puppet Genius · Poison",kg:null,v:"suna",
   d:"A bloodline of genius puppeteers and quiet tinkerers. Their workshops smell of lacquer and oil.",
   hist:"The workshop door has thirty locks and your family knows twenty-nine."},
  {n:"Kedoin",r:"uncommon",spec:"Copy Technique",kg:null,v:"suna",
   d:"Desert wanderers said to mimic any jutsu they see once. Proof is thin; pride is not.",
   hist:"Your grandmother insists she once copied a Kage's technique. Once."},
  {n:"Yotsuki",r:"uncommon",spec:"Lightning · Endurance",kg:null,v:"kumo",
   d:"Cloud-country mountain folk who never sell out their allies, at any price.",
   hist:"The family motto is stitched inside every jacket: never sell out."},
  {n:"Darui",r:"rare",spec:"Storm Release",kg:"Storm Release",v:"kumo",
   d:"Storm-release carriers with a talent for deadpan loyalty and black lightning.",
   hist:"Your father can split raindrops with a finger beam. He does parties."},
  {n:"Kamizuru",r:"uncommon",spec:"Bee Arts",kg:null,v:"iwa",
   d:"Bee-keepers of the Stone, old rivals of a certain Leaf clan that kept beetles instead.",
   hist:"The hives behind the house hum through every season."},
  {n:"Ishikawa",r:"common",spec:"Earth Release",kg:null,v:"iwa",
   d:"Stone-country quarriers with earth-release in their bones and dust in everything.",
   hist:"Your family carved the tunnel under the west gate."},
  {n:"Amagiri",r:"common",spec:"Wind · Scouting",kg:null,v:null,
   d:"A minor rain-country family of scouts and couriers, scattered across three villages.",
   hist:"Your relatives write letters from three different countries."},
  {n:"Fujimori",r:"common",spec:"Barrier Arts",kg:null,v:null,
   d:"Wisteria farmers with a flair for barrier basics and patient hands.",
   hist:"The wisteria trellis out back is a training tool, not decoration."},
  {n:"Kurosawa",r:"common",spec:"Administration",kg:null,v:null,
   d:"Ink-makers and ledger keepers for the village administration. Respectable, unglamorous, essential.",
   hist:"Your father can smell a forged seal from across a room."},
  {n:"Tachibana",r:"common",spec:"Endurance",kg:null,v:null,
   d:"Bathhouse owners with surprisingly sturdy constitutions and endless gossip.",
   hist:"You grew up hauling water before sunrise."},
  {n:"Shirakami",r:"common",spec:"Scholarship",kg:null,v:null,
   d:"A bookish family of archivists and part-time exorcists of small hauntings.",
   hist:"The family library holds one scroll nobody is allowed to open."}
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
  "Boil Release":{clans:[],minAge:12,minPot:7,boost:{ninjutsu:6,endurance:4},desc:"Corrosive acid mist."}
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
  {id:"hidden_friend",n:"The Village's Shadow",d:"Befriend a canon legend"}
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
function rollClan(village){
  var pool=CLANS.filter(function(c){return !c.v||c.v===village});
  var w={mythical:0.7,legendary:2.2,rare:5,uncommon:9,common:14};
  return weighted(pool.map(function(c){return [c,w[c.r]]}));
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
    clanData=chance(.42)?rollClan(village):null;
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
  family.parents.push(newNPC({first:rollName("m"),last:last,age:parentsAge,rel:65,kind:"father",clan:clanData?clanData.n:null,bio:"Your father."}));
  family.parents.push(newNPC({first:rollName("f"),last:last,age:parentsAge-ri(0,5),rel:70,kind:"mother",clan:chance(.4)?(clanData?clanData.n:null):null,bio:"Your mother."}));
  var sibRoll=ri(0,3);
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
    parentsAge:parentsAge,
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
    bio:makeBio({first:first,last:last,clanName:clanData?clanData.n:null,clanSpec:clanData?clanData.spec:"",villageName:v.name,eraName:era.name,familyWealth:familyWealth,stats:stats,familyHistory:familyHistory,relocated:relocated}),
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
function st(k){return G.stats[k]}
function addStat(k,v){if(G.stats[k]!=null){G.stats[k]=clamp(G.stats[k]+v,0,100);if(k==="health"&&G.stats[k]<=0){dieOf("wounds")}}}
function addRyo(n){G.ryo=Math.max(0,(G.ryo||0)+n)}
function rep(n){G.reputation=clamp(G.reputation+n,0,100)}
function feed(txt,cls){G.feed.unshift({age:G.age,txt:txt,cls:cls||""})}
function fbig(txt,cls){feed(txt,cls||"big")}
function tl(age,txt){G.timeline.push({age:age,txt:txt})}
function isChild(){return G.age<6}
function inAcademy(){return G.academy&&G.academy.enrolled}
function rankRank(){return {"Newborn":0,"Child":0,"Academy Student":1,"Genin":2,"Chunin":3,"Jonin":4,"ANBU":5,"Kage":6,"Rogue":4,"Missing-nin":4,"Civilian":0,"Retired":0}[G.rank]||0}
function adult(){return G.age>=18}

/* ============================ relationships ============================ */
function relOf(n){return n?n.rel:0}
function relUp(n,v){if(!n)return;n.rel=clamp(n.rel+v,-100,100)}
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
  if(isChild())pools.push("child");
  else if(inAcademy())pools.push("academy");
  else if(G.rank==="Genin")pools.push("genin");
  else pools.push("shinobi");
  if(G.rogue)pools.push("rogue");
  if(G.retired)pools.push("retired");
  if(adult())pools.push("adult");
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
];
EVS.academy=[
 {t:"class exam",w:5,run:function(){var score=Math.round(st("intelligence")*.6+st("discipline")*.3+st("taijutsu")*.1+luck());
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
EVS.career=[];

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
  modal("Mission Briefing","Mission — "+rank+"-Rank","“"+tpl.t+"”\n\n"+tpl.brief+(G.rogue?"\n\nNo village stands behind this one. There is only you and the target.":"")+"\n\nReward: "+money(pay)+(squad.length?"\nSquad: "+squad.map(function(n){return n.name.split(" ")[0]}).join(", "):"")+(G.sensei&&G.sensei.alive&&rank!=="S"?" · Sensei: "+G.sensei.name.split(" ")[0]:""),
    tpl.prep.map(function(p,i){return {t:p[0],d:p[1],i:i}}).concat([{t:"Decline the mission",decline:true}]),
    function(choice){
      if(!choice||choice.decline){fbig("You decline the "+rank+"-rank mission.");render();return}
      runMission(choice,tpl);
    });
}
function runMission(choice,tpl){
  var rank=choice.rank,pay=choice.pay,teamScore=choice.team||0;
  var prepBonus=choice.i===0?2:0;
  var self=Math.round(st("taijutsu")*.25+st("ninjutsu")*.25+st("intelligence")*.2+st("chakraControl")*.15+st("endurance")*.15);
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
    var inj=pick(INJURIES);addStat("health",-inj.sev*ri(6,14));addStat("happiness",-3);
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
  G.academy={enrolled:true,sensei:pick(["Daichi","Katsuro","Emi","Haruto","Rin","Yukio","Mei"])+" "+pick(SURNAMES),grades:50,attendance:60,years:0};
  G.rank="Academy Student";G.career="Academy Student";
  fbig("You enroll in the Academy at age "+aAge+". Instructor "+G.academy.sensei+" takes attendance like it's a blood oath.","big");
  tl(aAge,"Enrolled in the Academy");
}
function graduateCheck(){
  var a=G.academy;
  var score=a.grades*.5+st("taijutsu")*.2+st("ninjutsu")*.2+st("chakraControl")*.3;
  var pass=score>=55;
  a.enrolled=false;
  if(pass){
    var order=ri(1,30);
    G.rank="Genin";G.career="Genin";
    tl(G.age,"Graduated the Academy");
    if(order<=2){award("top_student");fbig("GRADUATION — You rank "+(order===1?"FIRST":"second")+" in the class. The headband ceremony is short; your parents are loud.","rare")}
    else fbig("GRADUATION — You tie your headband and try not to shake. You are a genin of "+G.villageName+".","good");
    assignTeam();
  }else if(G.age>=16){
    a.enrolled=false;G.rank="Civilian";G.career=pick(["farmhand","shop clerk","courier","dock worker"]);
    fbig("You age out of the Academy without graduating. Life continues outside the headband: work, family, quieter streets.","bad");
    tl(G.age,"Left the Academy without graduating");
  }else{
    a.enrolled=true;a.years++;
    fbig("You fail the graduation exam and repeat the year. The classroom looks smaller the second time.","bad");
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
function ageUp(){
  if(!G||!G.alive)return;
  var acts=AGEUP_SPENT;if(acts>0){AGEUP_SPENT=0}
  G.age++;
  npcAge();
  G.villageState.warYear=false;
  /* era conflict cadence */
  var eraWar=G.era.war;
  if(G.eraId==="naruto"||G.eraId==="shippuden"){if(G.age%7===0)G.villageState.warActive=chance(.5)}
  else if(chance(eraWar*.7))G.villageState.warActive=true;
  else if(chance(.3))G.villageState.warActive=false;
  /* natural drift */
  addStat("happiness",chance(.5)?1:-1);
  if(G.fatigue>0)G.fatigue=Math.max(0,G.fatigue-20);
  if(st("health")<70)addStat("health",2);
  if(G.age<=5){addStat("strength",1);addStat("intelligence",1)}
  else if(inAcademy()){G.academy.years++;addStat("taijutsu",2);addStat("chakraControl",2);addStat("intelligence",1);
    G.academy.attendance=clamp((G.academy.attendance||60)+ri(-5,6),0,100);
    if(G.age>=G.villageData.academyAge+5||st("ninjutsu")>=35)graduateCheck();
  }
  else if(G.rank==="Genin"){addStat("taijutsu",ri(1,3));addStat("ninjutsu",ri(1,3))}
  else if(rankRank()>=3){addStat("ninjutsu",1);addStat("intelligence",1);if(chance(.3))addStat("leadership",2)}
  if(G.age>30){if(chance(.3))addStat("strength",-1);if(chance(.25))addStat("speed",-1);if(G.age>50&&chance(.4))addStat("endurance",-1)}
  if(G.retired&&G.age>60&&chance(.25))addStat("health",-3);
  /* NPC aging & deaths */
  G.relationships.forEach(npcPass);
  var kid=byKind("child")[0];
  if(kid&&kid.age>=18&&!includes(G.achievements,"family_man"))award("family_man");
  if(G.age>=90&&!includes(G.achievements,"centenarian"))award("centenarian");
  if(G.villageState.warActive&&rankRank()>=1&&!includes(G.achievements,"war_survivor")&&G.age>12)award("war_survivor");
  /* discovery */
  var woke=tryKGAwake();
  if(!woke)tryNatureDiscover();
  /* school enrollment trigger */
  if(G.age===G.villageData.academyAge&&!inAcademy()&&G.rank==="Child"){enrollAcademy()}
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
    var nEv=1+(chance(.35)?1:0);
    var fired=0;
    while(fired<nEv){
      var e=pickEvent();if(!e)break;
      e.run();fired++;
    }
    if(!fired)fbig("A quiet year. Not every year needs to be loud.");
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
  var out={v:2,cid:c.cid,born:c.born,first:c.first,last:c.last,gender:c.gender,eraId:c.eraId,village:c.village,clanName:c.clanName,
    familyWealth:c.familyWealth,familyHistory:c.familyHistory,personality:c.personality,latentKG:c.latentKG,
    kkg:c.kkg,kkgKnown:c.kkgKnown,nature:c.nature,natureKnown:c.natureKnown,secondary:c.secondary,
    age:c.age,alive:c.alive,rank:c.rank,career:c.career,stats:c.stats,ryo:c.ryo,fatigue:c.fatigue,
    academy:c.academy,missionStats:c.missionStats,reputation:c.reputation,bounty:c.bounty,rogue:c.rogue,
    rogueYears:c.rogueYears,priorRank:c.priorRank,achievements:c.achievements,feed:c.feed,timeline:c.timeline,
    villageState:c.villageState,retired:c.retired,retiredYear:c.retiredYear,bestFriend:c.bestFriend,
    clanLeader:c.clanLeader,examDone:c.examDone,jutsu:c.jutsu,inventory:c.inventory,deathCause:c.deathCause,
    relationships:c.relationships,teammateIds:c.teammates.map(function(n){return n.id}),
    senseiId:c.sensei?c.sensei.id:null,familyIds:{spouse:c.family.spouse?c.family.spouse.id:null,kids:c.family.kids.map(function(n){return n.id})},
    students:c.students.map(function(n){return n.id}),rival:G.rival,bio:c.bio};
  return out;
}
function deserializeG(o){
  var c=G=generateLife({first:o.first,last:o.last,gender:o.gender,era:o.eraId,village:o.village});
  ["age","alive","rank","career","ryo","fatigue","missionStats","reputation","bounty","rogue","rogueYears",
   "priorRank","achievements","feed","timeline","villageState","retired","retiredYear","bestFriend",
   "clanLeader","examDone","jutsu","inventory","deathCause","bio","kkg","kkgKnown","nature","natureKnown",
   "familyWealth","familyHistory","latentKG","cid","born"].forEach(function(k){c[k]=o[k]});
  c.stats=o.stats;c.academy=o.academy;
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
  var l=legacyLog();l.unshift(entry);if(l.length>60)l=l.slice(0,60);
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
  pushLegacy({name:G.name,grade:g.g,score:g.score,rank:G.rank,age:G.age,village:G.villageName,era:G.eraName,rogue:G.rogue,kkg:G.kkgKnown,date:new Date().toISOString()});
  saveSlot("last");
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
var NAV=[["home","Home","🏠"],["character","Character","👤"],["family","Family","👨‍👩‍👦"],["academy","Academy","📜"],["missions","Missions","⚔️"],["clan","Clan","🔻"],["inventory","Inventory","🎒"],["settings","Settings","⚙️"]];
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
  ["home","character","family","academy","missions","clan","inventory","settings"].forEach(function(v){
    $("#view-"+v).classList.toggle("on",VIEW===v);
  });
  if(VIEW==="home")renderHome();
  else if(VIEW==="character")renderCharacter();
  else if(VIEW==="family")renderFamily();
  else if(VIEW==="academy")renderAcademy();
  else if(VIEW==="missions")renderMissions();
  else if(VIEW==="clan")renderClan();
  else if(VIEW==="inventory")renderInventory();
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
    ab("📚","Study","grades · intelligence",function(){addStat("intelligence",3);G.academy.grades=clamp((G.academy.grades||50)+3,0,100);fbig("You study until the lamp gutters. Your grades climb.","good")});
    ab("🥋","Train taijutsu","combat",function(){addStat("taijutsu",3);fbig("You drill forms until your arms feel like noodles.","good")});
    ab("🌀","Chakra control","the leaf never lies",function(){addStat("chakraControl",3);fbig(chance(.5)?"The leaf sticks. It is a small thing that feels enormous.":"The leaf falls four times before it sticks. You keep at it.","good")});
    ab("🔥","Practice ninjutsu","seals",function(){addStat("ninjutsu",2);addStat("chakra",1);fbig("Your hands remember the seals a little faster each week.","good")});
    ab("✋","Learn a technique","jutsu list",function(){showJutsuModal()});
  }else{
    ab("🥋","Train taijutsu","combat",function(){addStat("taijutsu",2+Math.floor(G.stats.growth/6));G.fatigue=clamp(G.fatigue+8,0,100);fbig("You train until sweat stings your eyes.","good")});
    ab("🌀","Chakra control","control",function(){addStat("chakraControl",2+Math.floor(G.stats.growth/6));G.fatigue=clamp(G.fatigue+6,0,100);fbig("You sit under the waterfall until your hands stop shaking.","good")});
    ab("📖","Study strategy","intelligence",function(){addStat("intelligence",2);fbig("You read old campaign maps and strategy scrolls.","good")});
    ab("🗡️","Weapon drills","kenjutsu",function(){addStat("kenjutsu",2);fbig("A thousand cuts at the wooden post. The post loses.","good")});
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
  addStat("health",8);G.fatigue=Math.max(0,G.fatigue-30);addStat("happiness",1);
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
  var v=$("#view-char");v.innerHTML="";
  var p=panel("shinobi record",G.rogue?"Missing-nin File":G.rank+" — "+G.career);
  var kv=el("div","kv");
  [["Name",G.name],["Age",G.age],["Village",G.villageName],["Clan",G.clanName||"none"],["Bloodline",G.kkg?(G.kkgKnown?G.kkg+" (awakened)":G.kkg+" (dormant)"):"none"],["Chakra nature",G.natureKnown?G.nature:"undiscovered"],["Personality",G.personality.n+" — "+G.personality.d],["Missions",G.missionStats.total+" ("+G.missionStats.success+" success, "+G.missionStats.fail+" failed)"],["Reputation",Math.round(G.reputation)]].forEach(function(r){
    kv.appendChild(el("b",null,r[0]));kv.appendChild(el("span",null,String(r[1])));
  });
  p.appendChild(kv);
  var acts=el("div","acts");acts.style.marginTop="12px";
  var b1=el("button","act");b1.appendChild(el("b",null,"✋ Jutsu"));b1.appendChild(el("span",null,"learn & train techniques"));b1.onclick=showJutsuModal;acts.appendChild(b1);
  if(rankRank()>=3&&!G.retired){var b2=el("button","act");b2.appendChild(el("b",null,"🎓 Retire"));b2.appendChild(el("span",null,"with honors"));b2.onclick=showRetire;acts.appendChild(b2)}
  p.appendChild(acts);
  v.appendChild(p);
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
function renderClan(){
  var v=$("#view-clan");v.innerHTML="";
  if(!G.clanName){
    var p=panel("clan","No Clan");
    p.appendChild(el("div","mtext","You are clanless. Your name is yours alone, and your deeds will have to speak louder than a crest."));
    v.appendChild(p);return;
  }
  var c=G.clan;
  var p=panel(c.r+" clan","The "+c.n+" Clan");
  p.appendChild(el("div","mtext",(c.d||"")+"\n\nSpecialty: "+c.spec+(c.kg?"\nBloodline: "+c.kg+(G.kkgKnown?" — AWAKENED":" — dormant, if it is in you at all"):"")+"\n\n"+G.familyHistory));
  var mastered=Object.keys(G.jutsu).filter(function(id){var j=JUTSU.find(function(x){return x.id===id});return j&&j.clan===c.n}).length;
  p.appendChild(el("div","mtext","Clan techniques mastered: "+mastered+"."));
  v.appendChild(p);
}
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
      if(id==="pill"){G.fatigue=Math.max(0,G.fatigue-40);fbig("You bite down on the soldier pill. Fatigue washes away.","good")}
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
    who.appendChild(el("span",null,e.rank+" · died at "+e.age+" · "+e.village+" · "+e.era+" · "+e.score+" legacy"));
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
var RARITY_COLOR={mythical:"#a06cd5",legendary:"#d3a94c",rare:"#d4555f",uncommon:"#3fb3a8",common:"#8a8f98"};
var CLAN_KANJI={Uchiha:"\u6247",Hyuga:"\u65e5",Senju:"\u5343",Uzumaki:"\u6e29",Sarutobi:"\u733f",Nara:"\u5948",Akimichi:"\u79cb",Yamanaka:"\u5c71",Aburame:"\u6cb9",Inuzuka:"\u72ac",Kurama:"\u978d",Hatake:"\u7551",Shimura:"\u5fd7",Fuma:"\u98a8",Yuki:"\u96ea",Hozuki:"\u9b3c"};
var CC_BAD=["fuck","shit","bitch","asshole","dick","cunt","nigg","fag","slut","whore","rape","porn","sex","cock","pussy","nazi","hitler"];
function ccTimer(fn,ms){CC.timers.push(setTimeout(fn,ms))}
function ccClear(){CC.timers.forEach(clearTimeout);CC.timers=[]}
function ccShow(step){
  CC.step=step;ccClear();
  var order={intro:0,name:1,village:2,era:3,roll:4,clan:5,final:6};
  ["#cc-intro","#cc-pane-name","#cc-village","#cc-era","#cc-roll","#cc-clan","#cc-final"].forEach(function(id,n){
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
  $("#cc-vill-err").textContent="";$("#cc-vills").innerHTML="";$("#cc-era-err").textContent="";$("#cc-eras").innerHTML="";$("#cc-spin").textContent="";$("#cc-spin").classList.remove("slow");$("#cc-spin").style.display="";
  $("#cc-clancard").hidden=true;$("#cc-clancard").innerHTML="";
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
  var desc={konoha:"The village hidden in the leaves. Fire country's heart, home of the Hokage and the strongest names in shinobi history.",suna:"The village hidden in sand. Hard desert life forges patient, deadly shinobi.",kiri:"The village hidden in mist. A ruthless past, and the quiet survivors it left.",kumo:"The village hidden in clouds. Prideful and strong, perched above the storms.",iwa:"The village hidden in stone. Unyielding earth, stubborn wills, immovable defense."};
  Object.keys(VILLAGES).forEach(function(k){
    var v=VILLAGES[k];
    var d=document.createElement("div");d.className="cc-vill";d.dataset.v=k;
    d.innerHTML='<span class="vk">'+v.kan+'</span><b>'+v.name+'</b><small>'+(v.label.replace("the ",""))+'</small><p>'+(desc[k]||"")+'</p>';
    d.onclick=function(){
      wrap.querySelectorAll(".cc-vill").forEach(function(c){c.classList.remove("sel")});
      d.classList.add("sel");CC.village=k;$("#cc-vill-err").textContent="";
    };
    wrap.appendChild(d);
  });
}
function ccForge(){
  CC.gender=chance(.5)?"m":"f";
  CC.eraId=(CC.eraId&&CC.eraId!=="r")?CC.eraId:pick(ERAS).id;
  CC.origin=pick(ORIGINS);
  CC.trait=pick(TRAITS);
  CC.clanRoll=chance(.42)?rollClan(CC.village):null;
  CC.last=CC.clanRoll?CC.clanRoll.n:pick(SURNAMES);
  $("#c-gender").value=CC.gender;
  $("#c-era").value=CC.eraId;
  $("#c-village").value=CC.village;
  $("#c-clan").value=CC.clanRoll?CC.clanRoll.n:"none";
  $("#c-first").value=CC.name;
  $("#c-last").value=CC.last;
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
  var spin=$("#cc-spin"),card=$("#cc-clancard");
  card.hidden=true;card.innerHTML="";spin.style.display="";spin.classList.remove("slow");
  $("#cc-clan-kick").textContent=CC.clanRoll?"Bloodline roll":"Bloodline roll";
  if(!CC.clanRoll){
    spin.textContent="—";
    ccTimer(function(){spin.style.display="none";ccShowClanCard(null)},900);
    return;
  }
  var pool=CLANS.map(function(c){return c.n});
  var t=0,delay=70,stop=1900;
  function tick(){
    spin.textContent=pick(pool);
    t+=delay;delay=Math.min(320,delay*1.18);
    if(t<stop)ccTimer(tick,delay);
    else{
      spin.classList.add("slow");spin.textContent=CC.clanRoll.n;
      ccTimer(function(){spin.style.display="none";ccShowClanCard(CC.clanRoll)},650);
    }
  }
  tick();
}
function ccShowClanCard(c){
  var card=$("#cc-clancard");
  var html;
  if(!c){
    html='<div class="cc-emb" style="--rc:#8a8f98;--rg:rgba(138,143,152,.25)">\u6c11</div>'+
      '<span class="cc-rar" style="--rc:#8a8f98">Civilian</span>'+
      '<h4>No clan</h4>'+
      '<p class="cc-desc">No bloodline claimed you at birth. Your name is '+CC.last+', and your story is entirely yours to write.</p>';
  }else{
    var col=RARITY_COLOR[c.r]||"#8a8f98";
    var emb=CLAN_KANJI[c.n]||c.n.charAt(0).toUpperCase();
    html='<div class="cc-emb" style="--rc:'+col+';--rg:'+col.replace(")",", .3)").replace("#","rgba(").replace("rgb","#")+'">'+emb+'</div>'+
      '<span class="cc-rar" style="--rc:'+col+'">'+c.r+'</span>'+
      '<h4>Clan '+c.n+'</h4>'+
      '<div class="cc-spec">'+c.spec+(c.kg?" · Kekkei genkai: "+c.kg:"")+'</div>'+
      '<p class="cc-desc">'+c.d+'</p>';
  }
  html+='<div class="cc-nav"><button class="btn" id="cc-clan-next"><b>Continue</b><small>To your life</small></button></div>';
  card.innerHTML=html;card.hidden=false;
  $("#cc-clan-next").onclick=ccToFinal;
}
function ccToFinal(){
  rollPreview();
  var era=ERAS.find(function(e){return e.id===CC.eraId});
  var s='<b>'+CC.name+' '+CC.last+'</b><br>'+
    VILLAGES[CC.village].name+' · '+VILLAGES[CC.village].label+'<br>'+
    era.name+' · '+(CC.gender==="m"?"Male":"Female")+'<br>'+'Origin: '+CC.origin+'<br>Trait: '+CC.trait+'<br>'+
    (CC.clanRoll?('Clan '+CC.clanRoll.n+' · '+CC.clanRoll.r):'No clan · civilian')+
    (PENDING&&PENDING.kkg?'<br>Bloodline: '+PENDING.kkg+' (dormant)':'');
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
  if(!G.cid)G.cid="c"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  G.born=Date.now();
  $("#screen-creator").classList.remove("on");
  $("#screen-game").classList.add("on");
  feed("You were born: "+G.name+" of "+(G.clanName?"clan "+G.clanName+" in ":"")+G.villageName+", "+G.eraName+".","big");
  tl(0,G.bio);
  saveSlot("auto");
  VIEW="home";VTAB="feed";render();
}
function newLife(){
  $("#screen-title").classList.remove("on");
  $("#screen-creator").classList.add("on");
  fillCreator();
  ccReset();ccBuildVills();
  rollPreview();
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
var UPDATES=[{d:"Nov 22, 2026",t:"Pickable Era & Fate Rolls",b:"The creator now asks which era you are born into (or let the dice decide), and the dice of birth roll a family origin and a personality trait into every life. They show in the forging, the final summary and your biography. Version 1.2.0."},{d:"Nov 22, 2026",t:"Version 1.1.0",b:"Version numbering is in effect: the last number bumps for small updates, the middle one for kinda big updates, the first one for huge ones. Today's batch (rebrand, creator overhaul, menu rework, intro every load) puts the game at 1.1.0."},{d:"Nov 22, 2026",t:"Intro Every Load",b:"The opening title sequence now plays on every visit and refresh, not just the first one. SKIP and Begin your story still get you straight in when you want to skip it."},
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
  $("#btn-ageup").onclick=function(){AGEUP_SPENT=0;ageUp()};
  $("#btn-reroll").onclick=rollPreview;
  $("#btn-begin").onclick=beginLife;
  $("#cc-go").onclick=function(){ccShow("name");$("#cc-name").focus()};
  $("#cc-name-next").onclick=ccNameNext;
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
      if(id==="btn-ach"){var lines=ACHIEVEMENTS.map(function(x){return x.n+" ("+x.d+")"}).join("\n");modalSafe("Achievements","Achievements","Twenty-two honors a shinobi can earn in a single life:\n\n"+lines)}
      else if(id==="btn-settings"){modalSafe("Settings","Settings","Version 1.2.0\n\nAutosave: every age-up lands in the first empty slot.\nSaves live in this browser only.\n\nCareful: clearing your browser data clears every life you have lived.",[{t:"Reset all data",d:"Deletes every save and legacy record",fn:function(){if(confirm("Delete ALL saves and legacy records? This cannot be undone.")){try{localStorage.removeItem(LS_SLOTS);localStorage.removeItem(LS_LEGACY);localStorage.removeItem(LS_ACH)}catch(e){}toast("All data cleared");setTitleRyo()}}},{t:"Close"}])}
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
wireTitle();
})();
