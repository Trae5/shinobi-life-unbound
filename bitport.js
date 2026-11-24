/* ============================================================
   BITPORT — the BitShippuden feature port (v2.0.0)
   Adds the three systems Life Unbound was missing:
   1. CODE ECONOMY — redeemable codes, admin-creatable, with a
      vault that pays out the moment a life is active.
   2. BLOODLINE SCORE — a cross-life score fed by achievements,
      combat and seal-chain skill. Never resets.
   3. SEAL CHAIN QTE + WIN% — timed kanji chains boost every
      strike; a live WIN% reads the fight each turn.
   Additive module: wraps existing globals, breaks nothing.
   ============================================================ */
(function(){
"use strict";
function q(s){return document.querySelector(s)}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}

var LS_BLS="shinobi_sprint_bls_v2",LS_USED="shinobi_sprint_codes_used_v2",
    LS_STORE="shinobi_sprint_code_store_v2",LS_VAULT="shinobi_sprint_codevault_v2";

var BLS=lsGet(LS_BLS,null)||{score:0,qteHits:0,qteTries:0};
function blsSave(){lsSet(LS_BLS,BLS)}
function blsAdd(n){BLS.score=Math.max(0,BLS.score+n);blsSave()}

var SEED=[
 {code:"SAGA",ryo:10000,note:"Shinobi Saga launch drop"},
 {code:"BARYON",ryo:5000,stats:{strength:3,endurance:3},note:"Baryon surge"},
 {code:"TOMOE",ryo:3000,stats:{chakraControl:3},note:"Six Tomoe"},
 {code:"HYUGA",ryo:2000,note:"Byakugan blessing"},
 {code:"TOURNAMENT",ryo:4000,stats:{taijutsu:3},note:"Arena victor"}
];
function store(){return lsGet(LS_STORE,[])}
function activeCodes(){
  var out=[],seen={};
  SEED.forEach(function(c){seen[c.code.toUpperCase()]=1;out.push(c)});
  store().forEach(function(c){if(c.active!==false&&!seen[c.code.toUpperCase()]){seen[c.code.toUpperCase()]=1;out.push({code:c.code,ryo:c.ryo||0,stats:c.stats||null,note:c.note||"owner drop"})}});
  return out;
}
function used(){return lsGet(LS_USED,[])}
function vault(){return lsGet(LS_VAULT,{ryo:0,stats:{}})}
function vaultSave(v){lsSet(LS_VAULT,v)}
function statsWorth(v){var n=0;for(var k in (v.stats||{}))n+=(v.stats[k]||0);return n}

function redeem(raw){
  var code=String(raw||"").trim().toUpperCase();
  if(!code)return {ok:false,msg:"Enter a code."};
  var list=activeCodes(),c=null;
  for(var i=0;i<list.length;i++)if(list[i].code.toUpperCase()===code){c=list[i];break}
  if(!c)return {ok:false,msg:"Not a code. Yet."};
  var u=used();
  if(u.indexOf(code)>=0)return {ok:false,msg:"Already redeemed."};
  u.push(code);lsSet(LS_USED,u);
  var v=vault();v.ryo=(v.ryo||0)+(c.ryo||0);
  var s=v.stats||{};for(var k in (c.stats||{}))s[k]=(s[k]||0)+c.stats[k];
  v.stats=s;vaultSave(v);
  blsAdd(5);
  return {ok:true,msg:code+" redeemed — it pays out the moment a life is active."};
}
function drainVault(){
  if(!(window.G&&G.alive))return false;
  var v=vault();if((v.ryo||0)<=0&&!statsWorth(v))return false;
  var got=[];
  if(v.ryo>0&&typeof addRyo==="function"){addRyo(v.ryo);got.push("+"+v.ryo+" ryō")}
  for(var k in (v.stats||{})){var n=v.stats[k];if(n&&typeof addStat==="function"){addStat(k,n);got.push("+"+n+" "+k)}}
  vaultSave({ryo:0,stats:{}});
  try{toast("Code vault paid out: "+got.join(", "))}catch(e){}
  try{hist("A code vault pays out: "+got.join(", ")+".","good")}catch(e){}
  return true;
}
setInterval(drainVault,2000);

/* ---------- BLOODLINE SCORE hooks ---------- */
if(typeof award==="function"){var _award=award;award=function(id){
  var fresh=!(window.G&&G.achievements&&G.achievements.indexOf(id)>=0);
  _award(id);if(fresh)blsAdd(2);
}}
if(typeof rcWin==="function"){var _rcWin=rcWin;rcWin=function(){_rcWin();blsAdd(3)}}
if(typeof rcLose==="function"){var _rcLose=rcLose;rcLose=function(){_rcLose();blsAdd(1)}}

/* ---------- SEAL CHAIN QTE ---------- */
var KANJI=["印","結","臨","兵","闘","者","皆","陣","列","在","前"];
function qteDone(combo){BLS.qteTries=(BLS.qteTries||0)+1;if(combo>0)BLS.qteHits=(BLS.qteHits||0)+1;blsSave()}
function bpQte(done){
  if(!RC||RC.over){done();return}
  var host=q("#rc-actions");if(!host){done();return}
  var box=document.createElement("div");box.id="rc-qte";host.appendChild(box);
  var steps=[1100,900,700],combo=0,i=0,alive=true;
  function finish(){if(!alive)return;alive=false;if(box&&box.parentNode)box.parentNode.removeChild(box);if(RC)RC.qteMult=1+combo*0.12;qteDone(combo);done()}
  function step(){
    if(!alive)return;
    if(i>=steps.length){finish();return}
    var ms=steps[i],k=KANJI[Math.floor(Math.random()*KANJI.length)];
    box.innerHTML="";
    var b=document.createElement("button");b.className="rc-btn qte";b.textContent=k;box.appendChild(b);
    var hit=false,t=null;
    b.onclick=function(){if(hit||!alive)return;hit=true;clearTimeout(t);combo++;i++;b.classList.add("hit");b.textContent=k+" ✓";setTimeout(step,120)};
    t=setTimeout(function(){if(hit||!alive)return;hit=true;i++;b.classList.add("miss");setTimeout(step,120)},ms);
  }
  step();
}
if(typeof rcDealDamage==="function"){var _rcDD=rcDealDamage;rcDealDamage=function(d,m){
  var b=(RC&&RC.qteMult)||1,dd=Math.round(d*b);
  if(b>1&&RC){RC.qteMult=1;m+=" · seal chain ×"+b.toFixed(2)}
  _rcDD(dd,m);
}}
function wrapAct(name){if(typeof window[name]!=="function")return;var _f=window[name];window[name]=function(){
  var a=arguments,self=this;
  if(!RC||RC.over)return _f.apply(self,a);
  var pre=true;
  if(name==="rcCastJutsu"){var j=a[0];try{if(RC.pCh<rpgJutCost(j))pre=false}catch(e){pre=false}}
  if(!pre)return _f.apply(self,a);
  bpQte(function(){_f.apply(self,a)});
}}
["rcActAttack","rcActTai","rcCastJutsu"].forEach(wrapAct);

/* ---------- WIN% ---------- */
function bpWinPct(){
  if(!RC)return 0;var c=rpgCalc();
  var pf=Math.max(0,RC.pHP)/c.maxHp,ef=Math.max(0,RC.eHP)/RC.e.maxHp;
  var skill=BLS.qteTries?BLS.qteHits/BLS.qteTries:0.5;
  var s=50+(pf-ef)*30+(c.atk-RC.e.atk)*1.2+(c.spd-RC.e.spd)*0.8+(RC.pBuffAtk-RC.eBuffAtk)*0.15+(skill-0.5)*8;
  return Math.max(2,Math.min(98,Math.round(s)));
}
if(typeof rpgCombatRender==="function"){var _rcR=rpgCombatRender;rpgCombatRender=function(){
  _rcR();if(!RC)return;
  var w=q("#rc-winp");
  if(!w){w=document.createElement("div");w.id="rc-winp";w.className="rc-winp";var st=q("#rc-stage");(st||document.body).appendChild(w)}
  w.textContent="WIN% "+bpWinPct()+"%";
}}

/* ---------- CODES SCREEN ---------- */
var CSS="#rc-winp{position:absolute;left:50%;transform:translateX(-50%);bottom:8px;font:800 13px system-ui;letter-spacing:.14em;color:#dfb963;background:rgba(7,8,10,.85);border:1px solid rgba(223,185,99,.35);border-radius:999px;padding:5px 14px;z-index:5}"
+".rc-btn.qte{width:84px;height:84px;font-size:38px;border:1px solid rgba(161,38,52,.7);background:#120c10;color:#e8e6e1;font-family:Georgia,serif;border-radius:12px;cursor:pointer}"
+".rc-btn.qte.hit{border-color:#6fcf97;color:#6fcf97}.rc-btn.qte.miss{opacity:.25}"
+"#rc-qte{display:flex;gap:8px;justify-content:center;width:100%;margin-top:8px}"
+"#bp-codes{position:fixed;inset:0;z-index:2147483000;background:rgba(5,6,8,.92);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Georgia,serif}"
+"#bp-codes .bp-card{width:min(430px,94vw);max-height:86vh;overflow:auto;background:#0b0d10;border:1px solid rgba(161,38,52,.5);border-radius:14px;padding:22px;color:#e8e6e1}"
+"#bp-codes h2{margin:0 0 4px;font-size:22px;letter-spacing:.2em;color:#dfb963}#bp-codes .bp-sub{color:#9a9891;font-size:12px;letter-spacing:.12em;margin-bottom:14px}"
+"#bp-codes .bp-bls{display:flex;justify-content:space-between;border:1px solid rgba(223,185,99,.3);border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:13px}"
+"#bp-codes .bp-bls b{color:#dfb963}"
+"#bp-codes .bp-row{display:flex;gap:8px;margin-bottom:6px}#bp-codes input{flex:1;background:#07080a;border:1px solid rgba(161,38,52,.5);border-radius:8px;color:#e8e6e1;padding:10px 12px;font:700 14px system-ui;letter-spacing:.2em;text-transform:uppercase}"
+"#bp-codes button{cursor:pointer}#bp-codes .bp-go{background:#a12634;border:none;color:#fff;font:800 13px system-ui;letter-spacing:.1em;border-radius:8px;padding:10px 16px}"
+"#bp-codes .bp-msg{min-height:18px;font-size:13px;color:#9a9891;margin-bottom:10px}#bp-codes .bp-msg.ok{color:#6fcf97}#bp-codes .bp-msg.no{color:#e07a7a}"
+"#bp-codes .bp-list{display:flex;flex-direction:column;gap:8px}"
+"#bp-codes .bp-code{display:flex;align-items:center;justify-content:space-between;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px}"
+"#bp-codes .bp-code b{font-family:system-ui;letter-spacing:.18em}#bp-codes .bp-code small{color:#9a9891;display:block;margin-top:2px}"
+"#bp-codes .bp-code button{background:none;border:1px solid rgba(223,185,99,.5);color:#dfb963;border-radius:8px;padding:6px 12px;font:800 11px system-ui;letter-spacing:.1em}"
+"#bp-codes .bp-code.used{opacity:.35}#bp-codes .bp-code.used button{display:none}"
+"#bp-codes .bp-tease{margin-top:14px;color:#6d6b66;font-size:12px;font-style:italic}"
+"#bp-codes .bp-close{margin-top:14px;width:100%;background:none;border:1px solid rgba(255,255,255,.2);color:#e8e6e1;border-radius:8px;padding:10px;font:700 13px system-ui;letter-spacing:.1em}";
function showCodes(){
  var old=q("#bp-codes");if(old)old.remove();
  var st=document.createElement("style");st.id="bp-codes-css";st.textContent=CSS;document.head.appendChild(st);
  var d=document.createElement("div");d.id="bp-codes";
  var h='<div class="bp-card"><h2>CODE REDEMPTION</h2><div class="bp-sub">SHINOBI SAGA · LIFE UNBOUND</div>'
   +'<div class="bp-bls"><span>Bloodline Score</span><b>'+BLS.score.toLocaleString("en-US")+'</b></div>'
   +'<div class="bp-row"><input id="bp-in" placeholder="ENTER CODE" maxlength="24"><button class="bp-go" id="bp-go">REDEEM</button></div>'
   +'<div class="bp-msg" id="bp-msg"></div><div class="bp-list" id="bp-list"></div>'
   +'<div class="bp-tease">The next code hides in the next major update. Bloodline Score never resets — it follows your bloodline, not your life.</div>'
   +'<button class="bp-close" id="bp-close">CLOSE</button></div>';
  d.innerHTML=h;document.body.appendChild(d);
  var list=q("#bp-list"),u=used();
  activeCodes().forEach(function(c){
    var isUsed=u.indexOf(c.code.toUpperCase())>=0;
    var row=document.createElement("div");row.className="bp-code"+(isUsed?" used":"");
    var rw=c.ryo?("+"+c.ryo.toLocaleString("en-US")+" ryō"):"";var sn=[];for(var k in (c.stats||{}))sn.push("+"+c.stats[k]+" "+k);
    row.innerHTML='<div><b>'+c.code+'</b><small>'+(c.note||"")+((rw||sn.length)?" · "+[rw].concat(sn).join(" · "):"")+'</small></div>';
    if(!isUsed){var b=document.createElement("button");b.textContent="REDEEM";b.onclick=function(){var r=redeem(c.code);var m=q("#bp-msg");m.textContent=r.msg;m.className="bp-msg "+(r.ok?"ok":"no");if(r.ok){showCodes();drainVault()}};row.appendChild(b)}
    else{var t=document.createElement("span");t.textContent="used";t.style.cssText="color:#6d6b66;font-size:11px;letter-spacing:.1em";row.appendChild(t)}
    list.appendChild(row);
  });
  q("#bp-go").onclick=function(){var r=redeem(q("#bp-in").value);var m=q("#bp-msg");m.textContent=r.msg;m.className="bp-msg "+(r.ok?"ok":"no");if(r.ok){showCodes();drainVault()}};
  q("#bp-in").addEventListener("keydown",function(e){if(e.key==="Enter")q("#bp-go").click()});
  q("#bp-close").onclick=function(){d.remove()};
  d.addEventListener("click",function(e){if(e.target===d)d.remove()});
}
function bindTitle(){
  var b=q("#btn-codes");if(b&&!b._bp){b._bp=1;b.onclick=showCodes}
}
setInterval(bindTitle,1200);

/* ---------- ADMIN API (god.js Codes tab reads this) ---------- */
window.BP={
  BLS:BLS,blsAdd:blsAdd,blsSave:blsSave,
  activeCodes:activeCodes,used:used,redeem:redeem,
  addCode:function(code,ryo,note){code=String(code||"").trim().toUpperCase();if(!code)return false;
    var s=store();s.push({code:code,ryo:Math.max(0,Math.round(ryo||0)),note:note||"",active:true});lsSet(LS_STORE,s);return true},
  setCodeActive:function(code,on){code=String(code||"").toUpperCase();var s=store();for(var i=0;i<s.length;i++)if(s[i].code.toUpperCase()===code){s[i].active=on!==false}lsSet(LS_STORE,s);return true},
  vault:vault,drainVault:drainVault,showCodes:showCodes,winPct:bpWinPct
};
})();
