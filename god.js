/* ============================================================
   GOD MODE — OWNER ONLY (Shinobi: Life Unbound)
   Access: Admin button (title + game screens) -> password ->
   owner Google account verification. Everything is gated on
   both. Regular players can reach the password box and no
   further; the panel itself never renders for them.
   ============================================================ */
window.GOD=(function(){
'use strict';
var OWNER_UID='Gb2MYzFu5sV2Rr8d1cGWMI90K4e2';
var PW_HASH='12943308b9bcec58449829c7c131e576f3eb949fdebd174e0fa1059b7fb55853';
var CFG_KEY='slu_god_cfg',LOG_KEY='slu_god_log',OK_KEY='slu_owner_ok';
var FB={apiKey:'AIzaSyA6EnB41g34TnhhLNJcx8OA2vmTrShwoi4',authDomain:'shinobi-life-unbound.firebaseapp.com',projectId:'shinobi-life-unbound',storageBucket:'shinobi-life-unbound.firebasestorage.app',messagingSenderId:'231893959325',appId:'1:231893959325:web:4dc77151958863c51b0a74'};
var cfg=loadCfg(),ownerApp=null,open=false,tab='character';
function loadCfg(){try{var c=JSON.parse(localStorage.getItem(CFG_KEY)||'{}');return c&&typeof c==='object'?c:{}}catch(e){return {}}}
function saveCfg(){try{localStorage.setItem(CFG_KEY,JSON.stringify(cfg))}catch(e){}}
function logs(){try{return JSON.parse(localStorage.getItem(LOG_KEY)||'[]')}catch(e){return []}}
function log(action,detail){
  var l=logs();l.unshift({when:new Date().toISOString(),action:action,detail:detail==null?'':String(detail)});
  if(l.length>400)l.length=400;try{localStorage.setItem(LOG_KEY,JSON.stringify(l))}catch(e){}
  try{if(ownerApp&&ownerApp.auth().currentUser){ownerApp.firestore().collection('saves').doc(OWNER_UID).collection('god_log').doc(Date.now()+'-'+Math.floor(Math.random()*1e6)).set({when:new Date().toISOString(),action:action,detail:String(detail||'')}).catch(function(){})}}catch(e){}
}
function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2)}).join('')})}
/* ---------- hooks into game systems (safe no-ops for normal players) ---------- */
function hooks(){
  if(window.rpgJutCd&&!(window.__godCd)){window.__godCd=1;var oc=rpgJutCd;rpgJutCd=function(j){return cfg.noCd?0:oc(j)}}
  if(window.rpgJutCost&&!(window.__godCost)){window.__godCost=1;var oj=rpgJutCost;rpgJutCost=function(j){return cfg.infChakra?0:oj(j)}}
  if(window.rcDealDamage&&!(window.__godDmg)){window.__godDmg=1;var od=rcDealDamage;rcDealDamage=function(d,msg){try{if(cfg.oneHit)d=99999;else if(cfg.dmgMult)d=Math.round(d*cfg.dmgMult)}catch(e){}return od(d,msg)}}
  if(window.rollClan&&!(window.__godRoll)){window.__godRoll=1;var oroll=rollClan;rollClan=function(v,q){if(cfg.forceClan){var c=CLANS.find(function(x){return x.n===cfg.forceClan});if(c){if(!q)logClanRoll(c,'roll',CC.clanHistory);return c}}return oroll(v,q)}}
  if(window.secretRollClan&&!(window.__godSecret)){window.__godSecret=1;var os=secretRollClan;secretRollClan=function(){if(cfg.forceClan){var c=CLANS.find(function(x){return x.n===cfg.forceClan&&x.secret});if(c)return c}return os()}}
}
function topoff(){
  try{if(!G||!G.alive)return;var f=false;
    if(cfg.infStamina&&G.stats){G.stats.stamina=999;f=true}
    if(cfg.infChakra&&G.stats){G.stats.chakra=Math.max(G.stats.chakra||0,99);f=true}
    if(cfg.infStamina&&G.rpg)G.rpg.fatigue=0;
    if(cfg.godMode&&window.RC&&RC.p&&RC.pHP!=null&&RC.pHP<(rpgCalc?rpgCalc().maxHp:9999))RC.pHP=rpgCalc().maxHp;
    if(cfg.noCd&&window.RC&&RC.cd){for(var k in RC.cd)RC.cd[k]=0}
  }catch(e){}
}
setInterval(topoff,4000);
hooks();
/* ---------- access ---------- */
function gate(passwordInput,done){
  sha(passwordInput).then(function(h){
    if(h!==PW_HASH){return done('wrong')}
    if(sessionStorage.getItem(OK_KEY)==='1'){return done(null)}
    verifyOwner(function(err){done(err)});
  }).catch(function(){done('wrong')});
}
function verifyOwner(done){
  try{
    if(!ownerApp)ownerApp=firebase.apps.find(function(a){return a.name==='slu-owner-app'})||firebase.initializeApp(FB,'slu-owner-app');
    var auth=ownerApp.auth();
    var u=auth.currentUser;
    if(u&&u.uid===OWNER_UID){sessionStorage.setItem(OK_KEY,'1');return done(null)}
    var p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
    auth.signInWithPopup(p).then(function(r){
      if(r.user&&r.user.uid===OWNER_UID){sessionStorage.setItem(OK_KEY,'1');log('owner-verified','uid '+OWNER_UID);done(null)}
      else{log('access-denied','wrong account');done('wrongacct')}
    }).catch(function(e){log('sign-in-failed',e&&e.message||'');done('signin')});
  }catch(e){done('signin')}
}
function wireButtons(){
  var mk=function(txt,cls){
    var b=document.createElement('button');b.type='button';b.textContent=txt;
    if(cls)b.className=cls;b.id='btn-god';b.title='Admin';
    b.style.cssText='background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.4));border:1px solid rgba(211,169,76,.35);border-radius:9px;color:#dfb963;font:700 11px system-ui,sans-serif;letter-spacing:.14em;cursor:pointer;padding:7px 12px';
    return b;
  };
  var t=document.getElementById('btn-settings');
  if(t&&t.parentNode&&!document.getElementById('btn-god-title')){
    var b=mk('🛡 ADMIN');b.id='btn-god-title';b.addEventListener('click',openGate);t.parentNode.insertBefore(b,t);
  }
  var g=document.getElementById('btn-gear');
  if(g&&g.parentNode&&!document.getElementById('btn-god-game')){
    var b2=mk('🛡');b2.id='btn-god-game';b2.style.padding='8px 11px';b2.addEventListener('click',openGate);
    g.parentNode.insertBefore(b2,g);
  }
}
new MutationObserver(wireButtons).observe(document.documentElement,{childList:true,subtree:true});
wireButtons();
/* ---------- panel ---------- */
var EL={};
function mk(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function cssInject(){
  if(document.getElementById('godcss'))return;
  var s=mk('style');s.id='godcss';
  s.textContent="#gp{position:fixed;inset:0;z-index:2147483000;background:#0a0709;color:#e8dcc2;font:13px/1.5 system-ui,sans-serif;display:none;overflow:auto}#gp.on{display:block}#gp .gp-hd{display:flex;align-items:center;gap:12px;padding:14px 20px;background:linear-gradient(180deg,#1a1016,#0a0709);border-bottom:1px solid rgba(211,169,76,.35);position:sticky;top:0;z-index:5}#gp .gp-hd h1{margin:0;font:900 20px Georgia,serif;color:#dfb963;letter-spacing:.08em}#gp .gp-hd .gp-badge{font:700 10px system-ui;letter-spacing:.2em;color:#0a0709;background:#dfb963;border-radius:4px;padding:3px 8px}#gp .gp-hd .gp-who{color:#9a8d74;font-size:11px}#gp .gp-close{margin-left:auto;border:1px solid rgba(211,169,76,.4);background:none;color:#dfb963;border-radius:8px;padding:8px 14px;cursor:pointer;font:700 12px system-ui}#gp .gp-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:10px 20px;border-bottom:1px solid rgba(211,169,76,.18);position:sticky;top:61px;background:#0d090c;z-index:4}#gp .gp-tab{border:1px solid rgba(211,169,76,.25);background:none;color:#cbb98a;border-radius:7px;padding:7px 12px;cursor:pointer;font:700 11px system-ui;letter-spacing:.08em}#gp .gp-tab.on{background:#dfb963;color:#0a0709}#gp .gp-body{padding:18px 22px 120px;max-width:980px}#gp .gp-card{border:1px solid rgba(211,169,76,.18);border-radius:12px;padding:14px 16px;margin-bottom:14px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(0,0,0,.35))}#gp .gp-card h3{margin:0 0 10px;font:800 13px system-ui;letter-spacing:.1em;color:#dfb963;text-transform:uppercase}#gp .gp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}#gp label{display:flex;flex-direction:column;gap:3px;font-size:11px;color:#9a8d74;letter-spacing:.04em}#gp input[type=number],#gp input[type=text],#gp select{background:#160f13;border:1px solid rgba(211,169,76,.3);border-radius:7px;color:#e8dcc2;padding:7px 9px;font:600 13px system-ui}#gp .gp-row{display:flex;align-items:center;gap:10px;margin:7px 0}#gp .gp-tog{display:flex;align-items:center;gap:8px;font-size:12px;color:#d8cdb4;padding:6px 10px;border:1px solid rgba(211,169,76,.15);border-radius:8px;background:rgba(255,255,255,.02);cursor:pointer}#gp .gp-tog input{accent-color:#dfb963;width:16px;height:16px}#gp .gp-act{background:#dfb963;color:#0a0709;border:0;border-radius:8px;padding:9px 16px;font:800 12px system-ui;letter-spacing:.08em;cursor:pointer}#gp .gp-ghost{background:none;color:#dfb963;border:1px solid rgba(211,169,76,.4);border-radius:8px;padding:9px 14px;font:700 12px system-ui;cursor:pointer}#gp .gp-red{background:#5c1620;color:#ffb3b3;border:1px solid rgba(255,80,80,.4);border-radius:8px;padding:9px 14px;font:700 12px system-ui;cursor:pointer}#gp .gp-ft{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(0deg,#0a0709 70%,rgba(10,7,9,.9));border-top:1px solid rgba(211,169,76,.3);padding:12px 20px;display:flex;gap:10px;flex-wrap:wrap;z-index:5}#gp .gp-note{color:#9a8d74;font-size:11px}#gp .gp-flash{position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#dfb963;color:#0a0709;font:800 13px system-ui;padding:10px 18px;border-radius:9px;z-index:2147483100;box-shadow:0 8px 30px rgba(0,0,0,.6)}#gp textarea{background:#160f13;border:1px solid rgba(211,169,76,.3);border-radius:7px;color:#e8dcc2;padding:8px;font:12px ui-monospace,monospace;width:100%;min-height:110px}#gp .gp-log{max-height:260px;overflow:auto;font:11px ui-monospace,monospace;background:#120c10;border:1px solid rgba(211,169,76,.15);border-radius:8px;padding:10px}#gp .gp-log div{padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04);color:#c9bfa8}";
  document.head.appendChild(s);
}
function flash(m){var f=mk('div','gp-flash');f.textContent=m;document.body.appendChild(f);setTimeout(function(){f.remove()},1900)}
function card(parent,title){var c=mk('div','gp-card');c.appendChild(mk('h3',null,title));parent.appendChild(c);return c}
function num(label,val,id){var l=mk('label');l.textContent=label;var i=document.createElement('input');i.type='number';i.value=val;i.id=id||'';l.appendChild(i);return l}
function txt(label,val,id){var l=mk('label');l.textContent=label;var i=document.createElement('input');i.type='text';i.value=val==null?'':val;i.id=id||'';l.appendChild(i);return l}
function sel(label,opts,val,id){var l=mk('label');l.textContent=label;var s=document.createElement('select');s.id=id||'';opts.forEach(function(o){var op=document.createElement('option');op.value=o;op.textContent=o;if(String(o)===String(val))op.selected=true;s.appendChild(op)});l.appendChild(s);return l}
function tog(label,checked){var w=mk('label','gp-tog');var i=document.createElement('input');i.type='checkbox';i.checked=!!checked;w.appendChild(i);w.appendChild(document.createTextNode(label));w.__input=i;return w}
function act(label,fn,cls){var b=mk('button',cls||'gp-act',label);b.addEventListener('click',fn);return b}
function g(id){var e=document.getElementById(id);return e?e.value.trim():''}
function gn(id,f){var v=parseFloat(g(id));return isNaN(v)?f:v}
function needLife(){if(!G||!G.alive){flash('No active life. Start or load a life first.');return false}return true}
function persist(msg){try{if(G&&G.alive)saveSlot('auto')}catch(e){}if(msg)flash(msg);log('apply',msg||'changes applied')}
/* ---------- tabs ---------- */
var TABS=[['character','Character'],['stats','Stats'],['chakra','Chakra'],['blood','Bloodlines'],['jutsu','Jutsu'],['luck','Luck'],['prog','Progression'],['abuse','Admin Abuse'],['save','Save & Restore']];
var APPLY={};
function statName(k){return k.replace(/([A-Z])/g,' $1').replace(/^./,function(c){return c.toUpperCase()})}
function clanOptions(){return CLANS.map(function(c){return c.n})}
function applyCharacter(){
  if(!needLife())return;
  var f=g('gp-c-first'),l=g('gp-c-last'),a=gn('gp-c-age',G.age),r=g('gp-c-rank'),v=g('gp-c-village'),cl=g('gp-c-clan'),p=g('gp-c-pers'),pot=gn('gp-c-pot',G.stats.potential||5);
  if(f)G.first=f;if(l)G.last=l;
  if(a&&a>0)G.age=Math.round(a);
  if(r){G.rank=r;G.career=r}
  if(v&&VILLAGES[v])G.village=v;
  if(cl){var c=CLANS.find(function(x){return x.n===cl});
    if(c){G.clanName=c.n;G.clan=c;G.clanless=false;if(!includes(G.secretSeen||[],c.n))G.secretSeen.push(c.n);logClanRoll(c,'owner-set',G.clanHistory)}}
  if(p)G.personality=p;
  if(G.stats&&pot>0)G.stats.potential=Math.min(11,pot);
  var lv=gn('gp-c-lv',null),xp=gn('gp-c-xp',null),sp=gn('gp-c-sp',null);
  if(G.rpg){if(lv!=null)G.rpg.level=Math.max(1,Math.round(lv));if(xp!=null)G.rpg.xp=Math.round(xp);if(sp!=null)G.rpg.skillPts=Math.round(sp)}
  if(r&&!G.academy)rpgInit(G);
  persist('Character updated');try{render()}catch(e){}
}
function tabCharacter(root){
  if(!G||!G.alive){root.appendChild(mk('p','gp-note','No active life. Start or load a life, then this tab fills with its live values.'));return}
  var c=card(root,'Identity');
  var gd=mk('div','gp-grid');
  gd.appendChild(txt('First name',G.first,'gp-c-first'));
  gd.appendChild(txt('Last name',G.last,'gp-c-last'));
  gd.appendChild(num('Age',G.age,'gp-c-age'));
  gd.appendChild(sel('Rank',['Newborn','Child','Academy Student','Genin','Chunin','Jonin','ANBU','Kage','Rogue','Missing-nin','Civilian','Retired'],G.rank,'gp-c-rank'));
  gd.appendChild(sel('Village',Object.keys(VILLAGES),G.village,'gp-c-village'));
  gd.appendChild(txt('Personality / trait',G.personality,'gp-c-pers'));
  gd.appendChild(num('Potential (1-11)',(G.stats&&G.stats.potential)||5,'gp-c-pot'));
  c.appendChild(gd);
  var cd=mk('div','gp-grid');cd.style.marginTop='10px';
  cd.appendChild(num('Level',(G.rpg&&G.rpg.level)||1,'gp-c-lv'));
  cd.appendChild(num('XP',(G.rpg&&G.rpg.xp)||0,'gp-c-xp'));
  cd.appendChild(num('Skill points',(G.rpg&&G.rpg.skillPts)||0,'gp-c-sp'));
  c.appendChild(cd);
  var cc=card(root,'Clan (searchable, includes secret clans)');
  var ci=document.createElement('input');ci.type='text';ci.id='gp-c-clan';ci.setAttribute('list','gp-clanlist');ci.value=G.clanName||'';ci.placeholder='type to search all clans';
  cc.appendChild(ci);
  var dl=document.createElement('datalist');dl.id='gp-clanlist';
  clanOptions().forEach(function(n){var o=document.createElement('option');o.value=n;dl.appendChild(o)});
  cc.appendChild(dl);cc.appendChild(mk('p','gp-note','Every clan including Vex and Rin. Type part of a name and pick it.'));
  APPLY.character=applyCharacter;
}
function applyStats(){
  if(!needLife())return;
  var n=0;
  Object.keys(G.stats||{}).forEach(function(k){
    var v=parseFloat(g('gp-st-'+k));
    if(!isNaN(v)){G.stats[k]=v;n++}
  });
  persist(n+' stats set');try{render()}catch(e){}
}
function maxStats(){
  if(!needLife())return;
  Object.keys(G.stats||{}).forEach(function(k){
    if(k==='potential')G.stats[k]=11;else if(k==='happiness'||k==='confidence'||k==='loyalty'||k==='reputation')G.stats[k]=100;else if(k==='aggression')G.stats[k]=1;else G.stats[k]=100;
  });
  persist('Every stat maxed');try{render()}catch(e){}
}
function tabStats(root){
  if(!needLife()){root.appendChild(mk('p','gp-note','Stats load when a life is active.'));return}
  var c=card(root,'Every stat (live values)');
  var gd=mk('div','gp-grid');
  Object.keys(G.stats||{}).forEach(function(k){gd.appendChild(num(statName(k),G.stats[k],'gp-st-'+k))});
  c.appendChild(gd);
  var row=mk('div','gp-row');row.style.marginTop='10px';
  row.appendChild(act('Max every stat',maxStats));
  row.appendChild(act('Apply stats',applyStats));
  c.appendChild(row);
  APPLY.stats=applyStats;
}
function applyChakra(){
  if(!needLife())return;
  var ch=parseFloat(g('gp-ch-cur')),cm=parseFloat(g('gp-ch-max')),cc2=parseFloat(g('gp-ch-cc'));
  if(!isNaN(ch))G.stats.chakra=ch;
  if(!isNaN(cm)&&cm>=0)G.stats.chakraMax=cm;
  if(!isNaN(cc2))G.stats.chakraControl=cc2;
  cfg.infChakra=document.getElementById('gp-ch-inf').checked;
  cfg.noCd=document.getElementById('gp-ch-nolim').checked?true:cfg.noCd;
  saveCfg();
  persist('Chakra controls updated');
}
function tabChakra(root){
  if(!needLife()){root.appendChild(mk('p','gp-note','Chakra loads when a life is active.'));return}
  var c=card(root,'Reserves');
  var gd=mk('div','gp-grid');
  gd.appendChild(num('Current chakra',G.stats.chakra||0,'gp-ch-cur'));
  gd.appendChild(num('Max chakra',(G.stats.chakraMax!=null)?G.stats.chakraMax:(G.stats.chakra||0),'gp-ch-max'));
  gd.appendChild(num('Chakra control',G.stats.chakraControl||0,'gp-ch-cc'));
  c.appendChild(gd);
  var c2=card(root,'Limitations');
  var t1=tog('Infinite chakra (techniques cost nothing)',cfg.infChakra);t1.querySelector('input').id='gp-ch-inf';c2.appendChild(t1);
  var t2=tog('Remove chakra limitations (never runs dry, ever)',cfg.infChakra);t2.querySelector('input').id='gp-ch-nolim';c2.appendChild(t2);
  c2.appendChild(mk('p','gp-note','Limitation removals apply instantly and stick until you reset them.'));
  var row=mk('div','gp-row');row.appendChild(act('Apply chakra',applyChakra));c2.appendChild(row);
  APPLY.chakra=applyChakra;
}
function applyBlood(){
  if(!needLife())return;
  var k=g('gp-bl-kkg'),nat=g('gp-bl-nat'),sec=g('gp-bl-sec'),stg=gn('gp-bl-stage',null),ek=g('gp-bl-ekind'),es=gn('gp-bl-estage',null);
  if(k==='None'){G.kkg=null;G.kkgKnown=false}
  else if(k&&KKG[k]){G.kkg=k;G.kkgKnown=true;var b=KKG[k].boost||{};for(var kk in b){if(G.stats[kk]==null)G.stats[kk]=0;G.stats[kk]+=b[kk]}}
  if(document.getElementById('gp-bl-lat').checked){G.latentKG=k&&k!=='None'?k:(G.kkg||'Sharingan')}
  if(nat){G.nature=nat;G.natureKnown=true}
  if(sec)G.secondary=sec;
  var bl=G.bl;
  if(bl){
    if(stg!=null)bl.stage=Math.max(0,Math.round(stg));
    if(!bl.eye&&ek)bl.eye={kind:ek,stage:0,ms:false,ems:false};
    if(bl.eye){
      if(ek)bl.eye.kind=ek;
      if(es!=null)bl.eye.stage=Math.max(0,Math.round(es));
      bl.eye.ms=document.getElementById('gp-bl-ms').checked?true:!!bl.eye.ms;
      bl.eye.ems=document.getElementById('gp-bl-ems').checked?true:!!bl.eye.ems;
      if(document.getElementById('gp-bl-rin').checked){bl.eye.kind='Rinnegan';bl.eye.stage=3}
      if(document.getElementById('gp-bl-ten').checked){bl.eye.kind='Tenseigan';bl.eye.stage=3}
    }
  }
  persist('Bloodline updated');try{render()}catch(e){}
}
function instantEvolve(){
  if(!needLife())return;
  var bl=G.bl;
  if(bl){bl.stage=(bl.stage||0)+1;persist('Bloodline ladder advanced to stage '+bl.stage);try{render()}catch(e){}}
  else{persist('No bloodline state on this life yet')}
}
function allEyes(){
  if(!needLife())return;
  var bl=G.bl=G.bl||{stage:0,events:[],flags:{}};
  bl.eye=bl.eye||{kind:'Sharingan',stage:0};
  bl.eye.stage=3;bl.eye.ms=true;bl.eye.ems=true;
  persist('Every eye stage unlocked: stage 3, Mangekyo and Eternal active');
}
function unlockAllJutsu(){
  if(!needLife())return;
  var r=rpgInit(G);
  RPG.JUTSU.forEach(function(j){r.jutsu[j.n]={mastery:100}});
  persist('All '+RPG.JUTSU.length+' jutsu unlocked at max mastery');
}
function applyJutsu(){
  if(!needLife())return;
  var n=g('gp-j-sel'),m=gn('gp-j-mas',null);
  if(n){var r=rpgInit(G);r.jutsu[n]={mastery:(m!=null?m:100)};persist(n+' unlocked'+(m!=null?' at mastery '+m+'%':' at max mastery'))}
}
function tabJutsu(root){
  if(!needLife()){root.appendChild(mk('p','gp-note','Jutsu loads when a life is active.'));return}
  var c=card(root,'Bulk');
  var row=mk('div','gp-row');
  row.appendChild(act('Unlock ALL jutsu (max mastery)',unlockAllJutsu));
  c.appendChild(row);
  var c2=card(root,'Single technique');
  var names=RPG.JUTSU.map(function(j){return j.n});
  c2.appendChild(sel('Technique',names,names[0],'gp-j-sel'));
  c2.appendChild(num('Mastery % (0-100)',100,'gp-j-mas'));
  var row2=mk('div','gp-row');row2.appendChild(act('Unlock / set mastery',applyJutsu));c2.appendChild(row2);
  APPLY.jutsu=applyJutsu;
}
function applyLuck(){
  var v=gn('gp-l-luck',null);if(v!=null&&v>=0)cfg.luckMult=v;
  var sv=gn('gp-l-secret',null);if(sv!=null&&sv>=0)cfg.secretOddsMult=sv;
  ['uncommon','rare','epic','legendary','mythical'].forEach(function(r){
    var m=parseFloat(g('gp-l-'+r));if(!isNaN(m)&&m>=0){cfg.oddsMult=cfg.oddsMult||{};cfg.oddsMult[r]=m}
  });
  if(document.getElementById('gp-l-rare').checked){cfg.oddsMult=cfg.oddsMult||{};['epic','legendary','mythical'].forEach(function(r){cfg.oddsMult[r]=Math.max(cfg.oddsMult[r]||1,5)})}
  var fc=g('gp-l-force');cfg.forceClan=(fc&&fc!=='None')?fc:null;
  if(document.getElementById('gp-l-reroll').checked&&typeof CC!=='undefined'){CC.clanSpins=999}
  cfg.rerollFree=document.getElementById('gp-l-reroll').checked;
  saveCfg();
  try{
    var cc=clanCfg();cc.luckMult=cfg.luckMult||1;cc.secretOddsMult=cfg.secretOddsMult;cc.oddsMult=cfg.oddsMult;
    localStorage.setItem(CLAN_CFG_KEY,JSON.stringify(cc));
  }catch(e){}
  persist('Luck controls updated'+(cfg.forceClan?' (forced clan: '+cfg.forceClan+')':''));
}
function tabLuck(root){
  var c=card(root,'Roll luck');
  var gd=mk('div','gp-grid');
  gd.appendChild(num('Luck multiplier (1 = normal)',cfg.luckMult||1,'gp-l-luck'));
  gd.appendChild(num('Secret clan odds multiplier',cfg.secretOddsMult||1,'gp-l-secret'));
  ['uncommon','rare','epic','legendary','mythical'].forEach(function(r){gd.appendChild(num(statName(r)+' odds multiplier',(cfg.oddsMult&&cfg.oddsMult[r])||1,'gp-l-'+r))});
  c.appendChild(gd);
  var c2=card(root,'Force outcomes');
  c2.appendChild(sel('Force clan roll (owner only)',['None'].concat(clanOptions()),cfg.forceClan||'None','gp-l-force'));
  var t1=tog('Force rare event outcomes (rare tiers x5)',false);t1.querySelector('input').id='gp-l-rare';c2.appendChild(t1);
  var t2=tog('Unlimited clan rerolls',cfg.rerollFree);t2.querySelector('input').id='gp-l-reroll';c2.appendChild(t2);
  c2.appendChild(mk('p','gp-note','Roll luck and forced clans touch only your own rolls on this device. Nothing here is global unless you write it to the global config in the admin panel.'));
  var row=mk('div','gp-row');row.appendChild(act('Apply luck',applyLuck));c2.appendChild(row);
  APPLY.luck=applyLuck;
}
function maxChakra(){
  if(!needLife())return;
  G.stats.chakra=999;G.stats.chakraMax=999;G.stats.chakraControl=100;
  persist('Chakra maxed: 999 reserves, control 100');try{render()}catch(e){}
}
function maxLevel(){
  if(!needLife())return;
  var r=rpgInit(G);r.level=60;r.xp=rpgXpFor(60);r.skillPts=Math.max(r.skillPts,40);
  persist('Level 60, XP topped, 40 skill points');try{render()}catch(e){}
}
function applyProg(){
  if(!needLife())return;
  var lv=gn('gp-p-lv',null),xp=gn('gp-p-xp',null),sp=gn('gp-p-sp',null),ry=gn('gp-p-ryo',null),rp=gn('gp-p-rep',null);
  var r=rpgInit(G);
  if(lv!=null)r.level=Math.max(1,Math.round(lv));
  if(xp!=null)r.xp=Math.round(xp);
  if(sp!=null)r.skillPts=Math.round(sp);
  if(ry!=null)G.ryo=Math.round(ry);
  if(rp!=null)G.reputation=Math.round(rp);
  var ms=g('gp-p-missions'),inv=g('gp-p-inv');
  try{if(ms)G.missionStats=JSON.parse(ms)}catch(e){flash('Mission JSON was invalid, skipped')}
  try{if(inv)G.inventory=JSON.parse(inv)}catch(e){flash('Inventory JSON was invalid, skipped')}
  persist('Progression updated');try{render()}catch(e){}
}
function unlockAllAch(){
  try{var glob=loadJSON(LS_ACH,{});ACHIEVEMENTS.forEach(function(a){glob[a.id]=true;if(G&&!includes(G.achievements||[],a.id))G.achievements.push(a.id)});saveJSON(LS_ACH,glob);persist('Every title and badge unlocked')}catch(e){flash('Could not unlock achievements')}
}
function tabProg(root){
  if(!needLife()){root.appendChild(mk('p','gp-note','Progression loads when a life is active.'));return}
  var c=card(root,'Direct controls');
  var gd=mk('div','gp-grid');
  gd.appendChild(num('Level',(G.rpg&&G.rpg.level)||1,'gp-p-lv'));
  gd.appendChild(num('XP',(G.rpg&&G.rpg.xp)||0,'gp-p-xp'));
  gd.appendChild(num('Skill points',(G.rpg&&G.rpg.skillPts)||0,'gp-p-sp'));
  gd.appendChild(num('Ryo (money)',G.ryo||0,'gp-p-ryo'));
  gd.appendChild(num('Reputation',G.reputation||0,'gp-p-rep'));
  c.appendChild(gd);
  c.appendChild(mk('p','gp-note','Mission record JSON'));
  var t1=document.createElement('textarea');t1.id='gp-p-missions';t1.value=JSON.stringify(G.missionStats||{});c.appendChild(t1);
  c.appendChild(mk('p','gp-note','Inventory JSON (array)'));
  var t2=document.createElement('textarea');t2.id='gp-p-inv';t2.value=JSON.stringify(G.inventory||[]);c.appendChild(t2);
  var row=mk('div','gp-row');row.appendChild(act('Apply progression',applyProg));row.appendChild(act('Unlock all titles & badges',unlockAllAch,'gp-ghost'));c.appendChild(row);
  var c2=card(root,'Quick presets');
  var pr=mk('div','gp-row');pr.style.flexWrap='wrap';
  pr.appendChild(act('Max Stats',maxStats));
  pr.appendChild(act('Max Chakra',maxChakra));
  pr.appendChild(act('Max Level',maxLevel));
  pr.appendChild(act('All Jutsu',unlockAllJutsu));
  pr.appendChild(act('All Eyes',allEyes));
  pr.appendChild(act('Full Unlock',fullUnlock));
  pr.appendChild(act('Legendary Shinobi',legendaryShinobi));
  pr.appendChild(act('GOD MODE',godPreset,'gp-red'));
  c2.appendChild(pr);
  APPLY.prog=applyProg;
}
function fullUnlock(){
  if(!needLife())return;
  maxStats();maxChakra();maxLevel();unlockAllJutsu();allEyes();unlockAllAch();
  var r=rpgInit(G);['strength','speed','agility','endurance','intelligence','perception','taijutsu','ninjutsu','genjutsu','kenjutsu','sealSpeed'].forEach(function(k){G.stats[k]=100});
  persist('FULL UNLOCK: every stat, chakra, level 60, all jutsu, all eyes, all badges');
}
function legendaryShinobi(){
  if(!needLife())return;
  fullUnlock();
  var leg=CLANS.filter(function(c){return c.r==='legendary'});
  if(leg.length){var c=pick(leg);G.clanName=c.n;G.clan=c;G.clanless=false}
  G.ryo=Math.max(G.ryo||0,1000000);
  persist('LEGENDARY SHINOBI build applied: '+ (G.clan?G.clan.n:'') +', everything maxed, 1,000,000 ryo');
}
function godPreset(){
  cfg.godMode=true;cfg.oneHit=true;cfg.infStamina=true;cfg.infChakra=true;cfg.noCd=true;cfg.dmgMult=10;saveCfg();
  persist('GOD MODE: invincible, one-hit, infinite chakra and stamina, no cooldowns, 10x damage');
}
function tabAbuse(root){
  if(!needLife()){root.appendChild(mk('p','gp-note','Admin Abuse effects need an active life.'));return}
  var c=card(root,'Owner-only effects (your character only)');
  var rows=mk('div','gp-row');rows.style.flexWrap='wrap';
  rows.appendChild(act('Random OP ability',abuseOpAbility));
  rows.appendChild(act('Spawn random rare rewards',abuseRewards));
  rows.appendChild(act('Random secret clan',abuseSecretClan));
  rows.appendChild(act('Randomly max a stat',abuseMaxStat));
  rows.appendChild(act('Trigger rare awakening',abuseAwaken));
  rows.appendChild(act('Temporary GOD MODE (5 min)',abuseTempGod,'gp-red'));
  rows.appendChild(act('Absurd build',abuseAbsurd,'gp-red'));
  c.appendChild(rows);
  var c2=card(root,'Special announcement');
  c2.appendChild(txt('Announcement text','OWNER ONLINE. TREAD LIGHTLY.','gp-ab-msg'));
  c2.appendChild(act('Fire announcement',abuseAnnounce));
  APPLY.abuse=function(){return true};
}
function abuseOpAbility(){
  var pool=RPG.JUTSU.filter(function(j){return j.rank==='S'||j.rank==='A'});
  var j=pick(pool.length?pool:RPG.JUTSU);
  var r=rpgInit(G);r.jutsu[j.n]={mastery:100};
  if(!includes(r.loadout||[],j.n))r.loadout.push(j.n);
  persist('OP ability granted: '+j.n+' ('+j.rank+'-rank, max mastery)');
  try{fbig('A forbidden technique burns itself into your hands: '+j.n+'.','rare')}catch(e){}
}
function abuseRewards(){
  var pool=['Legendary kunai of the First Flame','Scroll: Secret Technique Fragment','Chakra-steel vambraces','Sealed scroll of the founder','Kage robe (ceremonial)','Ryujin blade shard','Medic kit, elite grade',' pouch of one thousand ryod'];
  var n=3+Math.floor(Math.random()*3),got=[];
  for(var i=0;i<n;i++){var it=pick(pool);if(!includes(G.inventory||[],it)){G.inventory=G.inventory||[];G.inventory.push(it);got.push(it)}}
  persist('Rare rewards spawned: '+got.join(', '));
  try{fbig('The vault opens: '+got.length+' rare rewards materialize.','rare')}catch(e){}
}
function abuseSecretClan(){
  var secs=CLANS.filter(function(c){return c.secret});
  if(!secs.length)return persist('No secret clans on file');
  var c=pick(secs);
  G.clanName=c.n;G.clan=c;G.clanless=false;
  if(!includes(G.secretSeen||[],c.n))G.secretSeen.push(c.n);
  logClanRoll(c,'owner-secret',G.clanHistory);
  persist('Secret clan granted: '+c.n);
  try{fbig('The forbidden name answers: '+c.n+'.','rare')}catch(e){}
  try{render()}catch(e){}
}
function abuseMaxStat(){
  var ks=Object.keys(G.stats||{});if(!ks.length)return;
  var k=pick(ks);G.stats[k]=(k==='potential')?11:100;
  persist('Maxed one stat at random: '+k);
  try{render()}catch(e){}
}
function abuseAwaken(){
  var bl=G.bl=G.bl||{stage:0,events:[],flags:{}};
  bl.stage=(bl.stage||0)+1;
  if(bl.eye){bl.eye.stage=Math.min(3,(bl.eye.stage||0)+1)}
  persist('Rare awakening triggered: ladder stage '+bl.stage+(bl.eye?', eye stage '+bl.eye.stage:''));
  try{fbig('Something old opens its eye inside you. Your bloodline AWAKENS.','rare')}catch(e){}
  try{render()}catch(e){}
}
function abuseTempGod(){
  cfg.godMode=true;saveCfg();
  persist('Temporary GOD MODE on for 5 minutes');
  try{fbig('You are untouchable. For five minutes.','rare')}catch(e){}
  setTimeout(function(){cfg.godMode=false;saveCfg();log('temp-god-expired','5 minutes elapsed')},300000);
}
function abuseAbsurd(){
  legendaryShinobi();
  cfg.godMode=true;cfg.oneHit=true;cfg.infChakra=true;cfg.infStamina=true;cfg.noCd=true;cfg.dmgMult=100;saveCfg();
  persist('ABSURD BUILD: legendary clan, everything maxed, 100x damage, GOD MODE on');
  try{fbig('Reality bends. You are the build.','rare')}catch(e){}
}
function abuseAnnounce(){
  var m=g('gp-ab-msg')||'OWNER ONLINE.';
  try{fbig(m,'rare')}catch(e){}
  log('announcement',m);flash('Announcement fired');
}
/* ---------- save & restore ---------- */
function slotList(){try{var s=slots();var out=[];for(var i=0;i<6;i++){out.push(i+(s[i]&&s[i].g?' · '+(s[i].g.first||'?')+' '+(s[i].g.last||'')+' (age '+(s[i].g.age||'?')+')':' · empty'))}return out}catch(e){return ['0','1','2','3','4','5']}}
function backupKey(){return 'slu_god_backup_'+gn('gp-s-slot',0)}
function saveOwnerBuild(){
  var idx=gn('gp-s-slot',0);
  var data;
  if(G&&G.alive)data={g:serializeG(),when:new Date().toISOString()};
  else{var s=slots();data=s[idx]||null}
  if(!data){flash('Nothing to back up');return}
  try{localStorage.setItem(backupKey(),JSON.stringify(data));log('owner-build-saved','slot '+idx);flash('Owner build saved (slot '+idx+')')}catch(e){flash('Backup failed: storage full')}
}
function restorePrevBuild(){
  if(!confirm('Restore the previous owner build? The current state of that slot is replaced.'))return;
  try{
    var raw=localStorage.getItem(backupKey());
    if(!raw){flash('No backup on file yet. Save Owner Build first.');return}
    var data=JSON.parse(raw);var idx=gn('gp-s-slot',0);
    if(G&&G.alive){deserializeG(data.g);try{render()}catch(e){}}
    saveSlot(idx,{g:data.g,when:new Date().toISOString()});
    log('owner-build-restored','slot '+idx);flash('Previous build restored');closePanel();
  }catch(e){flash('Restore failed')}
}
function resetToNormal(){
  if(!confirm('Reset to normal? This clears every God Mode toggle (god mode, one-hit, infinite resources, luck forcing) for this character.'))return;
  cfg={};saveCfg();
  try{var cc=clanCfg();delete cc.luckMult;delete cc.oddsMult;delete cc.secretOddsMult;localStorage.setItem(CLAN_CFG_KEY,JSON.stringify(cc))}catch(e){}
  if(CC&&CC.clanSpins)CC.clanSpins=3;
  log('reset-to-normal','god flags cleared');flash('Reset to normal done');
}
function tabSave(root){
  var c=card(root,'Slots');
  c.appendChild(sel('Slot for save / restore operations',slotList(),'0','gp-s-slot'));
  var c2=card(root,'Owner build');
  var row=mk('div','gp-row');
  row.appendChild(act('Save Owner Build',saveOwnerBuild));
  row.appendChild(act('Restore Previous Build',restorePrevBuild,'gp-ghost'));
  row.appendChild(act('Reset to Normal',resetToNormal,'gp-red'));
  c2.appendChild(row);
  c2.appendChild(mk('p','gp-note','A backup is snapshotted automatically before destructive applies too. Owner settings persist across refresh and relog.'));
  var c3=card(root,'Export / import build JSON');
  var t=document.createElement('textarea');t.id='gp-s-json';t.placeholder='Paste a build JSON here, or export one below';c3.appendChild(t);
  var r2=mk('div','gp-row');
  r2.appendChild(act('Export current state',function(){
    try{var s=slots();var idx=gn('gp-s-slot',0);var d=(G&&G.alive)?{g:serializeG(),when:new Date().toISOString()}:s[idx];
      document.getElementById('gp-s-json').value=JSON.stringify(d||{},null,1);flash('Exported to the box above')}
    catch(e){flash('Export failed')}
  },'gp-ghost'));
  r2.appendChild(act('Import into slot',function(){
    try{var d=JSON.parse(g('gp-s-json'));if(!d||!d.g)throw 0;
      if(!confirm('Write this JSON into slot '+gn('gp-s-slot',0)+'?'))return;
      saveSlot(gn('gp-s-slot',0),{g:d.g,when:new Date().toISOString()});
      log('build-imported','slot '+gn('gp-s-slot',0));flash('Imported');closePanel();
    }catch(e){flash('Import failed: not a build JSON')}
  },'gp-red'));
  c3.appendChild(r2);
  var c4=card(root,'Private change log');
  var lg=mk('div','gp-log');
  logs().slice(0,120).forEach(function(e){lg.appendChild(mk('div',null,e.when.replace('T',' ').slice(0,19)+' · '+e.action+(e.detail?' · '+e.detail:'')))});
  if(!logs().length)lg.appendChild(mk('div',null,'No changes logged yet.'));
  c4.appendChild(lg);
  var r3=mk('div','gp-row');r3.appendChild(act('Clear local log',function(){localStorage.setItem(LOG_KEY,'[]');flash('Local log cleared');refresh()},'gp-ghost'));c4.appendChild(r3);
  APPLY.save=function(){return true};
}
/* ---------- panel skeleton ---------- */
function buildPanel(){
  if(document.getElementById('gp'))return;
  cssInject();
  var p=mk('div');p.id='gp';
  var hd=mk('div','gp-hd');
  hd.appendChild(mk('span','gp-badge','OWNER ONLY'));
  hd.appendChild(mk('h1',null,'Developer Control Room'));
  hd.appendChild(mk('span','gp-who','verified owner account'));
  var cl=mk('button','gp-close','CLOSE ✕');cl.addEventListener('click',closePanel);hd.appendChild(cl);
  p.appendChild(hd);
  var tb=mk('div','gp-tabs');
  TABS.forEach(function(t){
    var b=mk('button','gp-tab',t[1]);b.dataset.tab=t[0];
    b.addEventListener('click',function(){tab=t[0];openTab(tab)});
    tb.appendChild(b);
  });
  p.appendChild(tb);
  p.appendChild(mk('div','gp-body'));
  var ft=mk('div','gp-ft');
  ft.appendChild(act('APPLY CHANGES',function(){if(APPLY[tab])APPLY[tab]()}));
  ft.appendChild(act('Reset to Normal',resetToNormal,'gp-ghost'));
  ft.appendChild(act('Save Owner Build',saveOwnerBuild,'gp-ghost'));
  ft.appendChild(act('Restore Previous Build',restorePrevBuild,'gp-ghost'));
  p.appendChild(ft);
  document.body.appendChild(p);
  EL.panel=p;
}
function openTab(t){
  var body=EL.panel.querySelector('.gp-body');body.innerHTML='';
  EL.panel.querySelectorAll('.gp-tab').forEach(function(b){b.classList.toggle('on',b.dataset.tab===t)});
  var builders={character:tabCharacter,stats:tabStats,chakra:tabChakra,blood:tabBloodUI,jutsu:tabJutsu,luck:tabLuck,prog:tabProg,abuse:tabAbuse,save:tabSave};
  (builders[t]||function(){})();
}
function openPanel(){buildPanel();open=true;EL.panel.classList.add('on');document.body.style.overflow='hidden';openTab(tab);log('panel-opened','')}
function closePanel(){open=false;if(EL.panel)EL.panel.classList.remove('on');document.body.style.overflow='';try{render()}catch(e){}}
function openGate(){
  if(open)closePanel();
  if(sessionStorage.getItem(OK_KEY)==='1'){openPanel();return}
  var ov=mk('div');ov.id='gp-gate';
  ov.style.cssText='position:fixed;inset:0;z-index:2147483500;background:rgba(5,3,5,.92);display:grid;place-items:center';
  var box=mk('div');
  box.style.cssText='background:#120c10;border:1px solid rgba(211,169,76,.4);border-radius:14px;padding:26px;width:min(360px,90vw);text-align:center';
  box.appendChild(mk('h3',null,'<span style="color:#dfb963;font:900 16px Georgia,serif;letter-spacing:.1em">🛡 ADMIN ACCESS</span>'));
  var inp=document.createElement('input');inp.type='password';inp.placeholder='Password';
  inp.style.cssText='width:100%;margin:14px 0;padding:10px 12px;background:#0a0709;border:1px solid rgba(211,169,76,.35);border-radius:8px;color:#e8dcc2;font:700 15px system-ui;text-align:center';
  box.appendChild(inp);
  var msg=mk('p','gp-note','Password, then your owner account. Wrong password does nothing.');
  box.appendChild(msg);
  var r=mk('div','gp-row');r.style.justifyContent='center';
  var go=act('UNLOCK',function(){
    gate(inp.value,function(err){
      if(err==='wrong'){inp.value='';inp.style.borderColor='#c33';msg.textContent='Wrong password.';return}
      if(err==='wrongacct'){msg.textContent='Password ok, but that Google account is not the owner account. Sign in with the owner account.';return}
      if(err==='signin'){msg.textContent='Could not complete the sign-in. Close this and try again.';return}
      ov.remove();openPanel();
    });
  });
  var cancel=act('Cancel',function(){ov.remove()},'gp-ghost');
  r.appendChild(go);r.appendChild(cancel);box.appendChild(r);
  ov.appendChild(box);document.body.appendChild(ov);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')go.click()});
  setTimeout(function(){inp.focus()},80);
}
function tabBloodUI(root){
  if(!needLife()){root.appendChild(mk('p','gp-note','Bloodlines load when a life is active.'));return}
  var c=card(root,'Kekkei Genkai & natures');
  var gd=mk('div','gp-grid');
  gd.appendChild(sel('Kekkei Genkai',['None'].concat(Object.keys(KKG)),G.kkg||'None','gp-bl-kkg'));
  var lat=mk('label','gp-tog');lat.innerHTML='<input type="checkbox" id="gp-bl-lat"'+(G.latentKG?' checked':'')+'> Mark as latent (dormant, can stir later)';
  gd.appendChild(lat);
  gd.appendChild(txt('Chakra nature',G.nature||'','gp-bl-nat'));
  gd.appendChild(txt('Secondary nature',G.secondary||'','gp-bl-sec'));
  c.appendChild(gd);
  var bl=G.bl||{};
  var c2=card(root,'Eye stage (direct control)');
  var gd2=mk('div','gp-grid');
  gd2.appendChild(num('Ladder stage',bl.stage||0,'gp-bl-stage'));
  gd2.appendChild(txt('Eye kind (Sharingan, Byakugan, Rinnegan...)',(bl.eye&&bl.eye.kind)||'','gp-bl-ekind'));
  gd2.appendChild(num('Eye stage (0-3)',(bl.eye&&bl.eye.stage)||0,'gp-bl-estage'));
  c2.appendChild(gd2);
  var tr=mk('div','gp-row');tr.style.flexWrap='wrap';
  tr.appendChild(tog('Mangekyo active',(bl.eye&&bl.eye.ms)||false)).querySelector('input').id='gp-bl-ms';
  tr.appendChild(tog('Eternal Mangekyo',(bl.eye&&bl.eye.ems)||false)).querySelector('input').id='gp-bl-ems';
  tr.appendChild(tog('Force Rinnegan',false)).querySelector('input').id='gp-bl-rin';
  tr.appendChild(tog('Force Tenseigan',false)).querySelector('input').id='gp-bl-ten';
  c2.appendChild(tr);
  var row=mk('div','gp-row');
  row.appendChild(act('Apply bloodline',applyBlood));
  row.appendChild(act('Instant evolve (+1 stage)',instantEvolve,'gp-ghost'));
  row.appendChild(act('All Eyes (max)',allEyes,'gp-ghost'));
  c2.appendChild(row);
  c2.appendChild(mk('p','gp-note','These bypass every awakening requirement and age gate. Awakening bypass = the stages are simply set.'));
  APPLY.blood=applyBlood;
}
function refresh(){openTab(tab)}
return {open:openPanel,close:closePanel,opened:function(){return open},cfg:cfg};
})();
