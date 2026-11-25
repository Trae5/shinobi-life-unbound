/* ============================================================ */
/* TRAINING OVERHAUL — v1.2.4 "Every Drill Is A Game"            */
/* BitLife-style, text/menu driven. No 3D, no real-time world.   */
/* Each activity has its own mechanic, grades D-S, mastery,      */
/* personal records and rank-scaled difficulty tiers.            */
/* ============================================================ */
var TRN=(function(){
"use strict";
/* ---------- state ---------- */
function init(){
  var r=rpgInit(G);
  if(!r.trainMast)r.trainMast={};
  if(!r.trainRec)r.trainRec={};
  if(!r.trainTier)r.trainTier={};
  if(!r.trainHist)r.trainHist=[];
  if(!r.trainCount)r.trainCount={};
  return r;
}
/* ---------- grades ---------- */
function grade(score){return score>=93?"S":score>=82?"A":score>=65?"B":score>=45?"C":"D"}
function gradeCol(g){return g==="S"?"#ffd700":g==="A"?"#6fcf97":g==="B"?"#4aa3df":g==="C"?"#e7c36a":"#e05656"}
/* ---------- tiers ---------- */
function rankN(){var rk=(G.rank||"Academy Student").toLowerCase();
  if(/anbu|kage|sage/i.test(rk))return 5;if(/jonin/i.test(rk))return 4;
  if(/chunin|chuunin/i.test(rk))return 3;if(/genin/i.test(rk))return 2;return 1}
function tierFor(a){
  var rn=rankN(),lvl=(G.rpg&&G.rpg.level)||1,ok=[],T=TIERS;
  for(var i=0;i<T.length;i++){var t=T[i];
    if(t.minRank<=rn&&lvl>=(t.minLvl||1)&&ok.length<T.length)ok.push(t)}
  return ok;
}
function tierMaxFor(a){var ts=tierFor(a);return ts.length?ts[ts.length-1]:TIERS[0]}
var TIERS=[
 {id:"beginner",n:"Beginner",minRank:1,minLvl:1,mult:1.0,rounds:3,zW:18,seq:4,spd:1.0},
 {id:"intermediate",n:"Intermediate",minRank:2,minLvl:4,mult:1.45,rounds:5,zW:13,seq:5,spd:1.3},
 {id:"advanced",n:"Advanced",minRank:3,minLvl:10,mult:2.0,rounds:7,zW:9,seq:7,spd:1.65},
 {id:"elite",n:"Elite",minRank:4,minLvl:18,mult:2.8,rounds:9,zW:6,seq:9,spd:2.1}
];
function mastery(id){var r=init();return Math.min(100,Math.round(r.trainMast[id]||0))}
function rec(id){var r=init();return r.trainRec[id]||(r.trainRec[id]={best:0})}
/* ---------- session limits (anti-spam) ---------- */
function spendSession(a){
  var r=init();
  if((G.stats.stamina||10)<a.stam*0.5){toast("Too exhausted to train. Rest or sleep first.");return false}
  var tc=r.trainCount[a.n]||0;var dim=Math.max(0.3,1-tc*0.06);
  r.trainCount[a.n]=tc+1;
  r.fatigue=Math.min(100,(r.fatigue||0)+Math.round(a.stam*0.5));
  G.stats.stamina=Math.max(0,(G.stats.stamina||10)-a.stam*0.4);
  return dim;
}
/* ---------- shared reward + result plumbing ---------- */
function finish(a,tier,res){
  /* res: {score 0..100, acc 0..100, rounds, roundsDone, mistakes, streak, extraLabel, extraVal, recKey, recVal, notes[]} */
  var r=init();
  var dim=Math.max(0.3,1-((r.trainCount[a.n]||1)-1)*0.06);
  var q=0.4+0.6*(res.score/100);
  var g=Math.max(0.2,(2+a.xp*0.06)*tier.mult*dim*q*rpgFatigueMul());
  var cur=(G.stats[a.stat]||0);
  var soft=Math.max(0.35,1-Math.pow(cur/120,2)*0.6);
  g*=soft;
  G.stats[a.stat]=Math.round((cur+g)*10)/10;
  var xpg=Math.round(a.xp*q*dim*tier.mult);
  var lvl0=r.level;rpgAddXp(xpg);
  /* mastery */
  var m0=mastery(a.id);
  var mg=Math.max(0.2,(res.score/100)*3.2*(1-m0/130));
  var m1=Math.min(100,Math.round((m0+mg)*10)/10);
  r.trainMast[a.id]=m1;
  /* records */
  var rec0=rec(a.id),newRec=false,recKey=res.recKey||"best";
  var val=res.recVal==null?res.score:res.recVal;
  if(res.recLower){ if(rec0[recKey]==null||val<rec0[recKey]){rec0[recKey]=val;newRec=true} }
  else if(val>=(rec0[recKey]||0)){if(val>(rec0[recKey]||0))newRec=true;rec0[recKey]=val}
  if(res.acc!=null&&res.acc>(rec0.acc||0)){rec0.acc=Math.round(res.acc);newRec=newRec||rec0.acc>0}
  if(res.streak!=null&&res.streak>(rec0.streak||0))rec0.streak=res.streak;
  r.trainHist.unshift({act:a.n,grade:grade(res.score),score:Math.round(res.score),when:new Date().toISOString()});
  if(r.trainHist.length>12)r.trainHist.length=12;
  showResult(a,tier,res,grade(res.score),g,xpg,m0,m1,newRec);
  if(typeof LIFE!=="undefined"&&LIFE.log)LIFE.log("Trained: "+a.n+" ("+grade(res.score)+" grade)");
}
function showResult(a,tier,res,gr,g,xpg,m0,m1,newRec){
  var d=el("#minigame")||rpgMgCreate();d.style.display="flex";d.innerHTML="";
  var box=document.createElement("div");box.className="mg-box trn-res";d.appendChild(box);
  function line(k,v){return "<div class='tr-l'><span>"+k+"</span><b>"+v+"</b></div>"}
  var notes=(res.notes||[]).map(function(n){return "<li>"+n+"</li>"}).join("");
  box.innerHTML=
   "<div class='tr-big' style='color:"+gradeCol(gr)+"'>"+gr+"</div>"+
   "<div class='tr-bigsub'>TRAINING COMPLETE</div>"+
   "<div class='tr-act'>"+a.n+" · "+tier.n+"</div>"+
   line("Session score",Math.round(res.score)+" / 100")+
   (res.rounds!=null?line("Rounds completed",(res.roundsDone==null?res.rounds:res.roundsDone)+" / "+res.rounds):"")+
   (res.acc!=null?line((res.accLabel||"Accuracy"),Math.round(res.acc)+"%"):"")+
   (res.streak!=null?line("Best streak",res.streak):"")+
   (res.mistakes!=null?line("Mistakes made",res.mistakes):"")+
   (res.extraLabel?line(res.extraLabel,res.extraVal||"—"):"")+
   "<div class='tr-div'></div>"+
   line(a.stat+" gain","+"+g.toFixed(1)+" → "+G.stats[a.stat])+
   line("XP earned","+"+xpg+(rpgInit(G).level>0?" (Lv "+rpgInit(G).level+")":""))+
   line("Drill mastery","+"+(m1-m0).toFixed(1)+"% → "+m1+"%")+
   line("Personal best",newRec?"<span style='color:#ffd700'>NEW RECORD!</span>":(rec(a.id)[res.recKey||"best"]||res.score)+" pts")+
   (notes?"<ul class='tr-notes'>"+notes+"</ul>":"")+
   "<div class='tr-btns'><button class='rpg-btn' id='trn-retry'>Train again</button><button class='rpg-btn ghost' id='trn-back'>Return to training menu</button></div>";
  box.querySelector("#trn-back").onclick=function(){d.style.display="none";if(typeof rpgRender==="function")rpgRender()};
  box.querySelector("#trn-retry").onclick=function(){d.style.display="none";run(a,tier)};
}
/* ---------- mini-game shell ---------- */
function shell(title,sub,onBuild){
  var wrap=el("#minigame")||rpgMgCreate();
  wrap.style.display="flex";wrap.innerHTML="";
  var box=document.createElement("div");box.className="mg-box";wrap.appendChild(box);
  box.innerHTML="<div class='mg-title'>"+title+"</div><div class='mg-sub'>"+sub+"</div>";
  var stage=document.createElement("div");box.appendChild(stage);
  var ft=document.createElement("div");ft.className="mg-tries";box.appendChild(ft);
  st=stage;foot=ft;
  onBuild(stage,ft);
  return {box:box,stage:stage,foot:ft,
    end:function(score,res){wrap.style.display="none";finish(ACT_BY_ID[curAct],tierCur,res||{score:score})}};
}
var ACT_BY_ID={},curAct=null,tierCur=null,st=null,foot=null; /* current minigame stage/foot: drill helpers declared outside their shell() callback read these */
function wrapOff(){var d=el("#minigame");if(d)d.style.display="none"}
function shellEnd(score,res){wrapOff();finish(ACT_BY_ID[curAct],tierCur,res||{score:score})}
function run(a,tier){
  if(a.id!=="spar"){var ok=spendSession(a);if(ok===false)return}
  curAct=a.id;tierCur=tier;
  MG[a.mg](a,tier);
}
/* ============================================================ */
/* THE FIFTEEN MECHANICS                                         */
/* ============================================================ */
var MG={};
/* 1. Chakra Meditation — focus meter, moving indicator + target zone, streaks */
MG.meditate=function(a,tier){
  var rounds=tier.rounds,s=[];
  shell("Chakra Meditation","Press FOCUS when the marker crosses the gold zone. Streaks pay bonus.",
   function(st,foot){
    function round(i,streak){
      st.innerHTML="<div class='mg-bar'><div class='mg-zone'></div><div class='mg-mark'></div></div><button class='mg-btn'>FOCUS</button><div class='mg-round'>Round "+(i+1)+" / "+rounds+(streak>1?" · streak ×"+streak:"")+"</div>";
      var zone=st.querySelector(".mg-zone"),mark=st.querySelector(".mg-mark");
      var zw=Math.max(5,tier.zW*(1-mastery("med")/400)),zl=25+Math.random()*50;
      zone.style.left=zl+"%";zone.style.width=zw+"%";
      var pos=0,dir=1,run=true,hit=false;
      var iv=setInterval(function(){pos+=dir*(2.2*tier.spd+Math.random());if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}mark.style.left=pos+"%"},16);
      st.querySelector(".mg-btn").onclick=function(){
        if(!run)return;run=false;clearInterval(iv);
        var d=Math.abs(pos-(zl+zw/2));var sc=Math.max(0,Math.round(100-d*(300/zw)));
        if(sc>=70)streak++;else streak=0;hit=true;s.push(sc);
        foot.textContent=sc>=85?"Perfect focus! "+sc:sc>=60?"Focused. "+sc:sc>=40?"Slipped a little. "+sc:"Mind wandered. "+sc;
        setTimeout(function(){if(i+1<rounds)round(i+1,streak);else{
          var avg=s.reduce(function(x,y){return x+y},0)/s.length;
          var bonus=Math.min(15,Math.max(0,(Math.max.apply(null,s)>=90?8:0)+(s.filter(function(x){return x>=70}).length-1)*3));
          shellEnd(Math.min(100,avg+bonus),{score:Math.min(100,avg+bonus),rounds:rounds,roundsDone:rounds,acc:avg,accLabel:"Focus accuracy",streak:Math.max(0,s.filter(function(x){return x>=70}).length),mistakes:s.filter(function(x){return x<45}).length});
        }},450);
      };
    }
    round(0,0);
  });
  function shellEnd(score,res){curAct="med";tierCur=tier;finish(ACT_BY_ID.med,tier,res)}
};
/* 8. Taijutsu Practice — reactive combo chains: pick the right response in time */
MG.taijutsu=function(a,tier){
  var chainLen=tier.seq-2,moves=["Attack","Dodge","Block","Counter","Follow-up"],good=0,bad=0,mist=0,notes=[];
  var sh=shell("Taijutsu Practice","Drill the combo: when a move flashes, answer with the NEXT move in the chain before the window closes.",
   function(st,foot){start()});
  function start(){
    seq=[];for(var i=0;i<chainLen;i++)seq.push(moves[Math.floor(Math.random()*moves.length)]);
    sh.foot.textContent="Chain length "+chainLen+(mastery("tai")>=40?" · advanced combos unlocked":"")+" · streak record "+(rec("tai").streak||0);
    step(0);
  }
  var seq=[];
  function step(i){
    if(i>=seq.length){var sc=Math.max(10,Math.min(100,Math.round(good/(good+bad||1)*88+8)));
      shellEnd(sc,{score:sc,rounds:seq.length,roundsDone:good,acc:good/(good+bad||1)*100,accLabel:"Combo accuracy",streak:bestRun,mistakes:mist,notes:notes});return}
    var need=seq[i];
    sh.stage.innerHTML="<div class='mg-q'>Move "+(i+1)+": your opponent shows <b>"+(seq[i-1]||"an opening")+"</b>. Answer with:</div><div class='mg-keys'>"+moves.map(function(x){return "<button class='mg-key'>"+x+"</button>"}).join("")+"</div><div class='tr-bar'><i id='tj-w'></i></div>";
    var btns=sh.stage.querySelectorAll(".mg-key"),answered=false,t0=Date.now();
    var w=Math.max(700,1900-tiersIndex(tier)*250);
    var fill=sh.stage.querySelector("#tj-w");var fiv=setInterval(function(){fill.style.width=Math.max(0,100-(Date.now()-t0)/w*100)+"%"},50);
    var tmo=setTimeout(function(){if(!answered){answered=true;clearInterval(fiv);bad++;mist++;sh.foot.textContent="Too slow — the opening closed.";setTimeout(function(){step(i+1)},400)}},w);
    btns.forEach(function(b){b.onclick=function(){if(answered)return;answered=true;clearTimeout(tmo);clearInterval(fiv);
      if(b.textContent===need){good++;bestRun=Math.max(bestRun,good);sh.foot.textContent="Clean. "+b.textContent.toLowerCase()+" lands."}
      else{bad++;mist++;bestRun=0;sh.foot.textContent="Broken flow — "+need.toLowerCase()+" was the answer.";notes.push("Move "+(i+1)+": answered "+b.textContent.toLowerCase()+" where "+need.toLowerCase()+" was needed.")}
      setTimeout(function(){step(i+1)},380)}})
  }
  var bestRun=0;
}
/* 9. Target Practice — appearing targets, distance tiers, streaks */
MG.targets=function(a,tier){
  var sh=shell("Target Practice","Hit every target before it fades. Small targets are far ones: more points.",
   function(st,foot){
    st.innerHTML="<div class='mg-field' id='tp-f'></div>";
    var fld=st.querySelector("#tp-f"),hit=0,miss=0,pts=0,streak=0,best=0,dur=10000+tier.rounds*800,t0=Date.now();
    foot.textContent="12 targets · gold = far (+3) · silver = mid (+2) · copper = near (+1)";
    var spawned=0,need=12;
    function spawn(){
      if(Date.now()-t0>dur||spawned>=need+6){
        var sc=Math.max(5,Math.min(100,Math.round(pts*4.2)));
        shellEnd(sc,{score:sc,rounds:spawned,roundsDone:hit,acc:hit/(hit+miss||1)*100,accLabel:"Hit accuracy",streak:best,mistakes:miss,extraLabel:"Points",extraVal:pts});return}
      spawned++;
      var t=document.createElement("div");t.className="mg-target";
      var kind=Math.random();var val=kind<0.3?3:kind<0.65?2:1;
      var size=val===3?26:val===2?34:44;
      t.style.width=size+"px";t.style.height=size+"px";
      t.style.left=(5+Math.random()*85)+"%";t.style.top=(5+Math.random()*78)+"%";
      if(val===3)t.style.background="radial-gradient(circle,#ffd76a,#f2994a)";
      else if(val===2)t.style.background="radial-gradient(circle,#cfd8e3,#8fa3b8)";
      else t.style.background="radial-gradient(circle,#d8a06a,#a8743e)";
      t.onclick=function(){hit++;pts+=val;streak++;best=Math.max(best,streak);t.remove();foot.textContent="hits "+hit+" · points "+pts+" · streak "+streak};
      var life=Math.max(600,1500/tier.spd);
      setTimeout(function(){if(t.parentNode){miss++;streak=0;t.remove();foot.textContent="hits "+hit+" · points "+pts+" · streak "+streak}},life);
      fld.appendChild(t);
      setTimeout(spawn,Math.max(300,700/tier.spd)+Math.random()*300);
    }
    spawn();
  });
}
/* 10. Kunai Accuracy — rounds with distance + aim + timing */
MG.kunai=function(a,tier){
  var rounds=tier.rounds,notes=[],pts=0,bulls=0;
  var sh=shell("Kunai Accuracy","Read the distance, set your aim, release inside the window.",
   function(st,foot){round(0)});
  function round(i){
    if(i>=rounds){var sc=Math.max(5,Math.min(100,Math.round(pts*2.2)));shellEnd(sc,{score:sc,rounds:rounds,roundsDone:rounds,acc:(bulls/rounds)*100,accLabel:"Bullseye rate",extraLabel:"Total points",extraVal:pts,recKey:"best",recVal:sc,notes:notes});return}
    var dist=10+Math.floor(Math.random()*30)+tier.rounds*2;
    var per=Math.max(0.35,1-dist/70);
    sh.stage.innerHTML="<div class='mg-q'>Round "+(i+1)+": target at "+dist+" paces.</div><div class='mg-bar'><div class='mg-zone'></div><div class='mg-mark'></div></div><button class='mg-btn'>THROW</button>";
    var zone=sh.stage.querySelector(".mg-zone"),mark=sh.stage.querySelector(".mg-mark");
    var zw=Math.max(5,Math.round(tier.zW*per*1.2)),zl=20+Math.random()*60;zone.style.left=zl+"%";zone.style.width=zw+"%";
    var pos=0,dir=1,go=true;
    var iv=setInterval(function(){pos+=dir*(2.4*tier.spd);if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}mark.style.left=pos+"%"},16);
    sh.stage.querySelector(".mg-btn").onclick=function(){
      if(!go)return;go=false;clearInterval(iv);
      var d=Math.abs(pos-(zl+zw/2));var acc=Math.max(0,Math.round(100-d*(320/zw)));
      var p=acc>=88?5:acc>=70?3:acc>=50?2:acc>=30?1:0;
      if(p===5){bulls++;notes.push("Round "+(i+1)+": dead center at "+dist+" paces.")}
      else if(p===0)notes.push("Round "+(i+1)+": buried in the dirt.");
      pts+=p;sh.foot.textContent=acc>=88?"BULLSEYE! +5":acc>=70?"On the ring. +3":acc>=50?"Grazed it. +2":acc>=30?"Near miss. +1":"Missed. +0";
      setTimeout(function(){round(i+1)},500);
    };
  }
}
/* 11. Hand Seal Practice — memorize, reproduce; length scales with mastery */
MG.seals=function(a,tier){
  var sh=shell("Hand Seal Practice","Memorize the seal sequence, then repeat it before the timer runs out.",
   function(st,foot){round(0)});
  var syms=["▮","▯","◈","◉","✦","☰","∿","✕"];
  var len=Math.min(9,tier.seq+Math.floor(mastery("seal")/25));
  function round(i){
    var seq=[];for(var k=0;k<len;k++)seq.push(Math.floor(Math.random()*syms.length));
    sh.stage.innerHTML="<div class='mg-seq'>"+seq.map(function(x){return syms[x]}).join(" ")+"</div><div class='mg-round'>Sequence "+(i+1)+" · "+len+" seals · memorize</div>";
    setTimeout(function(){
      sh.stage.innerHTML="<div class='mg-seq' id='hs-in'></div><div class='mg-keys'>"+syms.map(function(x,ix){return "<button class='mg-key' data-i='"+ix+"'>"+x+"</button>"}).join("")+"</div><div class='tr-bar'><i id='hs-w'></i></div>";
      var input=[],mist=0,t0=Date.now(),w=3000+len*900;
      var fill=sh.stage.querySelector("#hs-w");var fiv=setInterval(function(){var r=Math.max(0,100-(Date.now()-t0)/w*100);fill.style.width=r+"%";if(r<=0){clearInterval(fiv);finishRound(false)}},60);
      sh.stage.querySelectorAll(".mg-key").forEach(function(b){b.onclick=function(){
        var ix=+b.dataset.i;input.push(ix);
        if(seq[input.length-1]!==ix){mist++;clearInterval(fiv);finishRound(false);return}
        sh.stage.querySelector("#hs-in").textContent=input.map(function(x){return syms[x]}).join(" ");
        if(input.length===seq.length){clearInterval(fiv);finishRound(true)}}});
      function finishRound(ok){
        var speed=Math.max(0,Math.round(100-(Date.now()-t0)/w*100));
        var sc=ok?Math.max(30,Math.min(100,Math.round(60+len*4+speed*0.3))):Math.max(10,Math.round((input.length/len)*55));
        if(i+1<2&&ok){sh.foot.textContent="Clean! Next sequence is longer.";len++;setTimeout(function(){round(i+1)},500)}
        else shellEnd(sc,{score:sc,rounds:2,roundsDone:ok?2:1,acc:ok?100:Math.round(input.length/len*100),accLabel:"Sequence accuracy",mistakes:mist,extraLabel:"Seals per sequence",extraVal:len,recKey:"seq",recVal:len});
      }
    },1300+len*220);
  }
}
/* 12. Jutsu Practice — stage-based per-jutsu mastery (Familiarization→Mastery) */
var JSTAGES=["Familiarization","Execution","Stability","Refinement","Mastery"];
function jStage(m){return Math.min(4,Math.floor(m/20))}
MG.jutsu=function(a,tier){
  var r=init();
  var known=Object.keys(r.jutsu||{});
  if(!known.length){shellStatic("Jutsu Practice","You know no techniques to drill yet. Learn one from the Jutsu tab first.",null);return}
  shellPick("Jutsu Practice","Choose a technique to drill. Each has its own mastery, from Familiarization to Mastery.",
    known.map(function(n){var j=RPG.JUTSU.filter(function(x){return x.n===n})[0]||{rank:"E",el:null};
      return {label:n+" · "+j.rank+" · "+Math.round(r.jutsu[n].mastery)+"% · "+JSTAGES[jStage(r.jutsu[n].mastery)],fn:function(){drill(n)}}}));
  function drill(n){
    var j=RPG.JUTSU.filter(function(x){return x.n===n})[0];
    var st=r.jutsu[n],m0=st.mastery||0,aff=((r.affinity===j.el)||(r.extraEls||[]).indexOf(j.el)>=0)?1.15:1;
    var stage=JSTAGES[jStage(m)];
    /* two-part check: short seal sequence + one clean release press */
    var RANKN={E:2,D:3,C:4,B:5,A:6,S:6};
    var seqLen=Math.min(6,(RANKN[j.rank]||2)+Math.floor(tiersIndex(tierCur)/2));
    var syms=["▮","▯","◈","◉","✦","☰"];
    var seq=[];for(var k=0;k<seqLen;k++)seq.push(Math.floor(Math.random()*syms.length));
    var sh=shell("Jutsu Practice: "+n,"Stage: "+stage+" · "+seqLen+" seals, then one clean release.",
      function(st2,foot){
        var t0=Date.now();
        st2.innerHTML="<div class='mg-seq'>"+seq.map(function(x){return syms[x]}).join(" ")+"</div><div class='mg-round'>memorize…</div>";
        setTimeout(function(){
          st2.innerHTML="<div class='mg-seq' id='jp-in'></div><div class='mg-keys'>"+syms.map(function(x,ix){return "<button class='mg-key' data-i='"+ix+"'>"+x+"</button>"}).join("")+"</div><div class='mg-round' id='jp-s'>reproduce the seals</div>";
          var input=[],broke=false;
          st2.querySelectorAll(".mg-key").forEach(function(b){b.onclick=function(){
            if(broke)return;var ix=+b.dataset.i;input.push(ix);
            if(seq[input.length-1]!==ix){broke=true;st2.querySelector("#jp-s").textContent="Seals fumbled. Reduced progress.";setTimeout(release,600);return}
            st2.querySelector("#jp-in").textContent=input.map(function(x){return syms[x]}).join(" ");
            if(input.length===seq.length){st2.querySelector("#jp-s").textContent="Now release: press inside the band.";releaseBar()}
          }});
          function releaseBar(){
            st2.innerHTML+="<div class='mg-bar'><div class='mg-zone'></div><div class='mg-mark'></div></div><button class='mg-btn'>RELEASE</button>";
            var zone=st2.querySelector(".mg-zone"),mark=st2.querySelector(".mg-mark");
            var zw=Math.max(7,tierCur.zW+4),zl=30+Math.random()*40;zone.style.left=zl+"%";zone.style.width=zw+"%";
            var pos=0,dir=1,go=true;
            var iv=setInterval(function(){pos+=dir*(2.5*tierCur.spd);if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}mark.style.left=pos+"%"},16);
            st2.querySelector(".mg-btn").onclick=function(){if(!go)return;go=false;clearInterval(iv);
              var d=Math.abs(pos-(zl+zw/2));var rel=Math.max(0,Math.round(100-d*3));done(rel)}
          }
          function release(){done(20)}
          function done(rel){
            var sealAcc=input.length===seq.length?100:Math.round(input.length/seq.length*60);
            var sc=Math.max(5,Math.min(100,Math.round((sealAcc*0.55+rel*0.45))));
            var gain=(2+sc*0.09)*aff*Math.max(0.3,1-m0/100);
            if(sc<40)gain*=0.4; /* failed attempts give reduced progress, not nothing */
            st.mastery=Math.min(100,Math.round((m0+gain)*10)/10);
            var xp=Math.round(12+sc*0.18*tierCur.mult);rpgAddXp(xp);
            var m1=st.mastery;
            wrapOff();finish(ACT_BY_ID.jut,tierCur,{score:sc,rounds:2,roundsDone:sc>=40?2:1,acc:sealAcc,accLabel:"Seal accuracy",mistakes:broke?1:0,extraLabel:"Stage",extraVal:JSTAGES[jStage(m1)],recKey:"best",recVal:sc,notes:broke?["The seals broke mid-form — mastery still crept forward."]:[]});
          }
        },1100+seqLen*200);
      });
  }
}
/* 13. Genjutsu Drills — spot the false detail, rounds ramp */
MG.genjutsu=function(a,tier){
  var banks=[
   {s:"The lane at dusk: three lanterns glow, a dog dozes by the well, a woman waters flowers. Something is wrong.",qs:["The lanterns (you passed only two coming in)","The dog","The flowers"],a:0},
   {s:"Your squadmate waves from across the field. He wears the squad flak jacket, calls your name, and stands where the sun casts no shadow.",qs:["The flak jacket","The missing shadow","The wave"],a:1},
   {s:"The tea house: steam curls from cups, chairs sit at tables, and the crowd is utterly silent.",qs:["The steam","The chairs","The silence"],a:2},
   {s:"A river runs uphill beside the road. A hawk fights the wind above it. Your boots are dry.",qs:["The hawk","The dry boots","The uphill river"],a:2},
   {s:"The memory of last winter: snow on the roofs, your breath fogging, and cicadas singing.",qs:["The snow","The cicadas","Your breath"],a:1},
   {s:"A letter in your mentor's hand: every word correct, but the ink is still wet on a letter posted last week.",qs:["The handwriting","The wet ink","The words"],a:1},
   {s:"A roadside market: vendors call out, coins change hands, and everyone's mouth moves without sound.",qs:["The coins","The soundless mouths","The vendors"],a:1}
  ];
  var rounds=tier.rounds,ok=0,mist=0,notes=[];
  var sh=shell("Genjutsu Drills","Break the illusion: find the detail that could not be real.",
   function(st,foot){round(0)});
  function round(i){
    if(i>=rounds){var sc=Math.max(8,Math.min(100,Math.round(ok/rounds*86+8)));
      shellEnd(sc,{score:sc,rounds:rounds,roundsDone:ok,acc:ok/rounds*100,accLabel:"Illusions broken",mistakes:mist,notes:notes});return}
    var b=banks[Math.floor(Math.random()*banks.length)];
    var order=[0,1,2].sort(function(){return Math.random()-0.5});
    sh.stage.innerHTML="<div class='mg-q'>"+b.s+"</div><div class='mg-keys'>"+order.map(function(oi){return "<button class='mg-key'>"+b.qs[oi]+"</button>"}).join("")+"</div>";
    sh.foot.textContent="Round "+(i+1)+" / "+rounds+" · difficulty rises with each";
    sh.stage.querySelectorAll(".mg-key").forEach(function(btn){btn.onclick=function(){
      var right=b.qs[b.a]===btn.textContent;
      if(right){ok++;sh.foot.textContent="The illusion cracks and sloughs away."}
      else{mist++;sh.foot.textContent="The false detail held you. It was: "+b.qs[b.a].toLowerCase();notes.push("Round "+(i+1)+": missed — "+b.qs[b.a].toLowerCase())}
      setTimeout(function(){round(i+1)},700)}})
  }
}
/* 14. Tactical Training — mission simulations, decisions shape outcome */
MG.tactical=function(a,tier){
  var sims=[
   {s:"Your two-man patrol finds fresh tracks: three travelers, hours old, heading toward a farming hamlet your village trades with.",q:"What is the call?",o:[
     ["Track them immediately","Bold — you might catch them, or meet three armed strangers alone."],
     ["Report and shadow at a distance","Patient — you keep the hamlet safe and stay unseen."],
     ["Head them off at the hamlet","Cagey — you choose the ground."]],best:2},
   {s:"Ambush: darts from the treeline, your teammate down but breathing, the shooters unseen.",q:"Your move?",o:[
     ["Drag your teammate and run","Practical — you live to fight later."],
     ["Pop smoke and counterattack into the trees","Aggressive — high risk, high reward."],
     ["Defensive circle and call for backup","Sound — but slow."]],best:1},
   {s:"Escort: the merchant insists on a night shortcut through wolf country to save a day.",q:"You decide:",o:[
     ["Refuse and take the long road","Safe — the client grumbles but arrives."],
     ["Agree, doubled watch","Compromise — risk spread."],
     ["Agree, you scout ahead alone","Dangerous — you split the party."]],best:0},
   {s:"Scouting: you count eight campfires but only four men move between them.",q:"Read it:",o:[
     ["Eight fighters, report numbers","Literal — and wrong."],
     ["Decoys: roughly four real, report the ruse","Correct — fires lie, men don't."],
     ["Ignore it and push on","Reckless."]],best:1},
   {s:"Retreat: the squad is spent, the objective unmet, and the extraction window closes in an hour.",q:"Command:",o:[
     ["Push one more hour for the objective","Greed — the squad may not hold."],
     ["Withdraw in good order","Right — survivors can try again."],
     ["Split: half withdraw, half push","Worst — divided they die."]],best:1}
  ];
  var rounds=Math.min(4,Math.max(2,tier.rounds-3)),ok=0,mist=0,notes=[];
  var sh=shell("Tactical Training","Mission simulations. Read the scenario, make the call. Your intelligence tips the odds.",
   function(st,foot){round(0)});
  function round(i){
    if(i>=rounds){var iq=rpgStat("intelligence");var sc=Math.max(8,Math.min(100,Math.round(ok/rounds*72+Math.min(20,iq*0.2)+6)));
      shellEnd(sc,{score:sc,rounds:rounds,roundsDone:ok,acc:ok/rounds*100,accLabel:"Correct calls",mistakes:mist,notes:notes});return}
    var s=sims[Math.floor(Math.random()*sims.length)];
    var order=[0,1,2].sort(function(){return Math.random()-0.5});
    sh.stage.innerHTML="<div class='mg-q'>"+s.s+"</div><p class='mg-q'>"+s.q+"</p><div class='mg-keys'>"+order.map(function(oi){return "<button class='mg-key'>"+s.o[oi][0]+"</button>"}).join("")+"</div>";
    sh.foot.textContent="Simulation "+(i+1)+" / "+rounds;
    sh.stage.querySelectorAll(".mg-key").forEach(function(btn){btn.onclick=function(){
      var oi=-1;for(var k=0;k<s.o.length;k++)if(s.o[k][0]===btn.textContent)oi=k;
      if(oi===s.best){ok++;sh.foot.textContent=s.o[oi][1]}
      else{mist++;var pen=Math.random()<Math.min(0.5,rpgStat("intelligence")/100)?0.5:1;
        sh.foot.textContent=(pen<1?"Messy, but recoverable: ":"Costly. ")+s.o[oi][1];notes.push("Sim "+(i+1)+": chose "+s.o[oi][0].toLowerCase()+" — "+s.o[oi][1])}
      setTimeout(function(){round(i+1)},900)}})
  }
}
/* 15. Sparring — wired to the live combat engine, records saved */
MG.spar=function(a,tier){
  var opts=[["academy","Spar an academy student","Still learning their feet."],["teammate","Spar your teammate","Knows your habits."],["rival","Challenge your rival","Personal."],["jonin","Challenge an elite jonin","Above your weight."]];
  var avail=opts.filter(function(o){var e=RPG.ENEMIES.filter(function(x){return x.id===o[0]})[0];return e&&e.tier<=rankN()+1});
  shellPick("Sparring","A live opponent. Records, wins and losses are kept. Good defense and reads earn progress even in a loss.",
    avail.map(function(o){return {label:o[1],fn:function(){startSpar(o[0],o[1])}}}));
  function startSpar(id,label){
    var r=init();
    rpgClose();
    rpgCombatStart({enemyId:id,context:"spar",diff:r._sparDiff||"normal",onEnd:function(res){
      var rec0=rec("spar");rec0.wins=(rec0.wins||0)+(res.win?1:0);rec0.losses=(rec0.losses||0)+(res.win?0:1);
      var score=res.win?(tierCur.mult>=2?92:80):(res.turns>=8?52:30); /* performance: even a long loss earns */
      var dim=spendSession(ACT_BY_ID.spar);if(dim===false){rpgOpen("train");return}
      var q=0.4+0.6*(score/100);
      var g=Math.max(0.2,(2+ACT_BY_ID.spar.xp*0.06)*tierCur.mult*dim*q*rpgFatigueMul());
      var cur=(G.stats.taijutsu||0);var soft=Math.max(0.35,1-Math.pow(cur/120,2)*0.6);g*=soft;
      G.stats.taijutsu=Math.round((cur+g)*10)/10;
      var xpg=Math.round(ACT_BY_ID.spar.xp*q*dim*tierCur.mult);rpgAddXp(xpg);
      var m0=mastery("spar");var mg2=Math.max(0,(score/100)*3.2*(1-m0/130));r.trainMast.spar=Math.min(100,Math.round((m0+mg2)*10)/10);
      rec0.best=Math.max(rec0.best||0,score);
      r.trainHist.unshift({act:"Sparring",grade:grade(score),score:score,when:new Date().toISOString(),note:(res.win?"W vs "+res.foe:"L vs "+res.foe)});
      if(r.trainHist.length>12)r.trainHist.length=12;
      rpgOpen("train");
      showResult(ACT_BY_ID.spar,tierCur,{score:score,extraLabel:"Opponent",extraVal:res.foe+(res.win?" — won":" — lost")+(res.turns?" in "+res.turns+" turns":"")},grade(score),g,xpg,m0,r.trainMast.spar,res.win);
    }});
  }
}
/* 2. Chakra Control Exercises — stabilize the drifting flow */
MG.control=function(a,tier){
  var rounds=tier.rounds,s=[],streak=0,best=0,mist=0;
  shell("Chakra Control Exercises","The flow drifts. Press STABILIZE while the marker rides the band. Clean holds build a streak bonus.",
   function(st,foot){round(0,0)});
  function round(i,streak){
    st.innerHTML="<div class='mg-bar'><div class='mg-zone'></div><div class='mg-mark'></div></div><button class='mg-btn'>STABILIZE</button><div class='mg-round'>Round "+(i+1)+" / "+rounds+(streak>1?" · steady ×"+streak:"")+"</div>";
    var zone=st.querySelector(".mg-zone"),mark=st.querySelector(".mg-mark");
    var zw=Math.max(5,tier.zW*(1-mastery("ctrl")/350)),zl=22+Math.random()*55;
    zone.style.left=zl+"%";zone.style.width=zw+"%";
    var pos=0,dir=1,go=true;
    var iv=setInterval(function(){pos+=dir*(2.6*tier.spd+Math.random()*0.8);if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}mark.style.left=pos+"%"},16);
    st.querySelector(".mg-btn").onclick=function(){
      if(!go)return;go=false;clearInterval(iv);
      var d=Math.abs(pos-(zl+zw/2));var sc=Math.max(0,Math.round(100-d*(320/zw)));
      if(sc>=65)streak++;else{streak=0;mist++}
      best=Math.max(best,streak);s.push(sc);
      foot.textContent=sc>=85?"Locked steady. "+sc:sc>=60?"Held. "+sc:sc>=35?"Wobbled. "+sc:"The flow spilled. "+sc;
      setTimeout(function(){
        if(i+1<rounds)round(i+1,streak);
        else{
          var avg=s.reduce(function(x,y){return x+y},0)/s.length;
          var bonus=Math.min(15,Math.max(0,(Math.max.apply(null,s)>=90?6:0)+(s.filter(function(x){return x>=65}).length>=3?9:0)));
          shellEnd(Math.min(100,avg+bonus),{score:Math.min(100,avg+bonus),rounds:rounds,roundsDone:rounds,acc:avg,accLabel:"Stability",streak:best,mistakes:mist});
        }
      },450);
    };
  }
};
/* 3. Tree Climbing — checkpoint climb, pick your output */
MG.tree=function(a,tier){
  var total=4+tier.rounds,notes=[],chk=0,slips=0,good=0,asked=0;
  var conds=[
   ["slick with sap","High","Glue your feet with a strong flow."],
   ["rough and easy to grip","Low","A light flow is plenty here."],
   ["wet from the rain","Balanced","Steady middle flow keeps your grip."],
   ["cracked and crumbling","Low","Push hard and you'll blow chunks loose."],
   ["sweating with condensation","High","Only a strong flow bites into this."],
   ["dry and sun-warmed","Balanced","Even output, no surprises."]];
  shell("Tree Climbing","Read the bark at each checkpoint and pick your chakra output. Wrong output risks a slip: two and the climb is over.",
   function(st,foot){next()});
  function next(){
    if(chk>=total||slips>=2){
      var sc=Math.max(5,Math.min(100,Math.round(chk/total*78+(asked?good/asked:0)*22)));
      shellEnd(sc,{score:sc,rounds:total,roundsDone:chk,acc:asked?good/asked*100:0,accLabel:"Reads right",mistakes:slips,extraLabel:"Highest checkpoint",extraVal:chk+" / "+total,recKey:"stage",recVal:chk,notes:notes});
      return}
    var c=conds[Math.floor(Math.random()*conds.length)];asked++;
    st.innerHTML="<div class='mg-q'>Checkpoint "+(chk+1)+" of "+total+": the bark is <b>"+c[0]+"</b>. "+c[2]+"</div><div class='mg-keys'><button class='mg-key'>Low</button><button class='mg-key'>Balanced</button><button class='mg-key'>High</button></div>";
    foot.textContent="Checkpoint "+(chk+1)+" / "+total+" · slips "+slips+" / 2 · best climb "+(rec("tree").stage||0);
    st.querySelectorAll(".mg-key").forEach(function(b){
      b.onclick=function(){
        var pick=b.textContent;
        if(pick===c[1]){good++;chk++;foot.textContent="Clean step up. Checkpoint "+chk+".";notes.push("Checkpoint "+chk+": "+pick.toLowerCase()+" output on bark "+c[0]+".")}
        else{
          var ctl=rpgStat("chakraControl");var hold=Math.random()<Math.min(0.6,ctl/90);
          if(hold){notes.push("Checkpoint "+(chk+1)+": wrong output ("+pick.toLowerCase()+"), but control held the grip.");foot.textContent="Wrong output. You hang on by habit."}
          else{slips++;chk=Math.max(0,chk-1);foot.textContent="You slip and slide back. "+slips+" / 2 slips.";notes.push("Slipped on bark "+c[0]+" — "+pick.toLowerCase()+" output was wrong.")}
        }
        setTimeout(next,650);
      }});
  }
};
/* 4. Water Walking — changing conditions round by round */
MG.water=function(a,tier){
  var rounds=tier.rounds,notes=[],dist=0,ok=0;
  var conds=[
   ["glass-calm","Hold steady","The mirror surface wants an even flow."],
   ["wind-rippled","Raise output","Ripples steal bite; push more flow down."],
   ["choppy from dock traffic","Raise output","Chop knocks your feet around; answer with force."],
   ["a tugging current","Hold steady","The current carries you; a heavy flow punches through it."],
   ["a wake rolling under","Ease off","A big wake rewards a soft, quick flow."],
   ["warm and thin","Ease off","Thin water barely holds; less flow keeps you floating."]];
  shell("Water Walking","Conditions change every round. Pick the right adjustment and keep crossing; wrong calls cost footing.",
   function(st,foot){round(0)});
  function round(i){
    if(i>=rounds){
      var sc=Math.max(5,Math.min(100,Math.round(dist/(rounds*3)*70+(ok/rounds)*30)));
      shellEnd(sc,{score:sc,rounds:rounds,roundsDone:ok,acc:ok/rounds*100,accLabel:"Right calls",mistakes:rounds-ok,extraLabel:"Distance crossed",extraVal:dist+" paces",recKey:"dist",recVal:dist,notes:notes});
      return}
    var c=conds[Math.floor(Math.random()*conds.length)];
    st.innerHTML="<div class='mg-q'>Round "+(i+1)+": the water is <b>"+c[0]+"</b>. "+c[2]+"</div><div class='mg-keys'><button class='mg-key'>Raise output</button><button class='mg-key'>Hold steady</button><button class='mg-key'>Ease off</button></div>";
    foot.textContent="Distance "+dist+" paces · round "+(i+1)+" / "+rounds+" · best "+(rec("water").dist||0)+" paces";
    st.querySelectorAll(".mg-key").forEach(function(b){
      b.onclick=function(){
        var pick=b.textContent;
        if(pick===c[1]){ok++;dist+=3;foot.textContent="Solid footing. +3 paces ("+dist+")."}
        else{
          var rc=rpgStat("chakraRecovery");var keep=Math.random()<Math.min(0.6,rc/90);
          if(keep){foot.textContent="Wrong call. You wobble but stay up.";notes.push("Round "+(i+1)+": "+pick.toLowerCase()+" on "+c[0]+" water. Wobbled.")}
          else{dist=Math.max(0,dist-3);foot.textContent="You lose your footing and wade back.";notes.push("Round "+(i+1)+": went down on "+c[0]+" water.")}
        }
        setTimeout(function(){round(i+1)},650);
      }});
  }
};
/* 5. Weight Training — pick your load, earn every rep */
MG.weights=function(a,tier){
  var loads=[[0,"Light bar","",0],[15,"Moderate bar","strength 15",8],[30,"Heavy bar","strength 30",16],[50,"Crushing bar","strength 50",24]];
  var reps=tier.rounds+2;
  shellPick("Weight Training","Pick your load, then earn every rep on the timing bar. Heavier loads pay more.",
    loads.map(function(l){return {label:l[1]+(l[2]?" · needs "+l[2]:""),fn:function(){doSet(l)}}}));
  function doSet(l){
    var str=rpgStat("strength");
    if(str<l[0]){toast("That bar is too heavy for you yet. Build strength first.");run(ACT_BY_ID.wgt,tierCur);return}
    var sh2=shell("Weight Training · "+l[1],"Press LIFT as the marker crosses the power band. "+reps+" reps. Cramps shrink the band; a second wind opens it.",
      function(st,foot){rep(0,0)});
    function rep(i,good){
      st.innerHTML="<div class='mg-bar'><div class='mg-zone'></div><div class='mg-mark'></div></div><button class='mg-btn'>LIFT</button><div class='mg-round'>Rep "+(i+1)+" / "+reps+" · "+l[1]+"</div>";
      var zone=st.querySelector(".mg-zone"),mark=st.querySelector(".mg-mark");
      var ev="";
      if(i>0&&Math.random()<0.25)ev=Math.random()<0.5?"cramp":"wind";
      var zw=Math.max(6,tier.zW*(1-mastery("wgt")/400)*(ev==="cramp"?0.55:ev==="wind"?1.4:1));
      var zl=20+Math.random()*58;zone.style.left=zl+"%";zone.style.width=zw+"%";
      if(ev)foot.textContent=ev==="cramp"?"A cramp tightens. Band shrinks this rep.":"Second wind! The band opens up.";
      var pos=0,dir=1,go=true;
      var iv=setInterval(function(){pos+=dir*(2.5*tier.spd);if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}mark.style.left=pos+"%"},16);
      st.querySelector(".mg-btn").onclick=function(){
        if(!go)return;go=false;clearInterval(iv);
        var d=Math.abs(pos-(zl+zw/2));var hit=Math.round(100-d*(300/zw))>=55;
        if(hit)good++;
        foot.textContent=hit?"Rep "+(i+1)+" clean. "+good+" so far.":"Rep "+(i+1)+" came out sloppy.";
        setTimeout(function(){
          if(i+1<reps)rep(i+1,good);
          else{
            var sc=Math.max(5,Math.min(100,Math.round(good/reps*70+l[3]+(good===reps?8:0))));
            shellEnd(sc,{score:sc,rounds:reps,roundsDone:good,acc:good/reps*100,accLabel:"Clean reps",mistakes:reps-good,extraLabel:"Load",extraVal:l[1],recKey:"reps",recVal:good,notes:good===reps?["Every rep clean on the "+l[1].toLowerCase()+". Coach nods."]:[]});
          }
        },400);
      };
    }
  }
};
/* 6. Sprint Training — flash prompts, hurdles, reaction records */
MG.sprint=function(a,tier){
  var n=tier.seq*2,best=9999,miss=0,ok=0;
  shell("Sprint Training","Answer each flash: open track means RUN, a hurdle means JUMP. Your fastest reaction is the record.",
    function(st,foot){go(0)});
  function go(i){
    if(i>=n){
      var sc=Math.max(5,Math.min(100,Math.round(ok/n*70+Math.max(0,30-(best>=9999?60:best/12)))));
      var rr={score:sc,rounds:n,roundsDone:ok,acc:ok/n*100,accLabel:"Clean reactions",mistakes:miss,extraLabel:"Fastest reaction",extraVal:best>=9999?"—":best+" ms"};
      if(best<9999){rr.recKey="time";rr.recVal=best;rr.recLower=true}
      shellEnd(sc,rr);return}
    var hurdle=Math.random()<0.4;
    st.innerHTML="<div class='mg-q'>"+(hurdle?"A hurdle rises. JUMP!":"Track open. RUN!")+"</div><div class='mg-keys'><button class='mg-key'>RUN</button><button class='mg-key'>JUMP</button></div><div class='tr-bar'><i id='sp-w'></i></div>";
    var t0=Date.now();var w=Math.max(500,1400-tiersIndex(tier)*220);
    var fill=st.querySelector("#sp-w");var fiv=setInterval(function(){var rr2=Math.max(0,100-(Date.now()-t0)/w*100);fill.style.width=rr2+"%";if(rr2<=0){settle(null)}},40);
    var resolved=false;
    st.querySelectorAll(".mg-key").forEach(function(b){b.onclick=function(){
      if(resolved)return;
      var rt=Date.now()-t0;
      var right=(hurdle&&b.textContent==="JUMP")||(!hurdle&&b.textContent==="RUN");
      settle(right?rt:null);
    }});
    function settle(rt){
      if(resolved)return;resolved=true;clearInterval(fiv);
      if(rt==null){miss++;foot.textContent="Late. The moment passed."}
      else{ok++;if(rt<best)best=rt;foot.textContent=rt<250?"Explosive. "+rt+" ms":rt<420?"Good read. "+rt+" ms":"Slow off the line. "+rt+" ms"}
      setTimeout(function(){go(i+1)},350);
    }
  }
};
/* 7. Endurance Training — stages, push on or bank it */
MG.endurance=function(a,tier){
  var total=3+tier.rounds,cleared=0,notes=[];
  shell("Endurance Training","Clear stages one press at a time. After each stage: push on for a bigger haul, or bank what you've earned.",
    function(st,foot){stage(1)});
  function stage(i){
    var w=Math.max(480,1600-tiersIndex(tier)*260-i*90);
    st.innerHTML="<div class='mg-q'>Stage "+i+" of "+total+". Legs burning. Press HOLD while the marker rides the band.</div><div class='mg-bar'><div class='mg-zone'></div><div class='mg-mark'></div></div><button class='mg-btn'>HOLD</button>";
    var zone=st.querySelector(".mg-zone"),mark=st.querySelector(".mg-mark");
    var zw=Math.max(6,tier.zW*(1-mastery("end")/400)),zl=22+Math.random()*54;
    zone.style.left=zl+"%";zone.style.width=zw+"%";
    foot.textContent="Stages cleared "+cleared+" · best run "+(rec("end").stage||0);
    var pos=0,dir=1,go=true;
    var iv=setInterval(function(){pos+=dir*(2.3*tier.spd+i*0.12);if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}mark.style.left=pos+"%"},16);
    st.querySelector(".mg-btn").onclick=function(){
      if(!go)return;go=false;clearInterval(iv);
      var d=Math.abs(pos-(zl+zw/2));var sc=Math.round(100-d*(300/zw));
      if(sc>=50){
        cleared=i;foot.textContent="Stage "+i+" held.";
        if(i>=total){endRun(true,"The full course. Nothing left in the tank.");return}
        st.innerHTML="<div class='mg-q'>Stage "+i+" cleared. Push on, or bank it?</div><div class='mg-keys'><button class='mg-key'>Push on</button><button class='mg-key'>Bank it</button></div>";
        st.querySelectorAll(".mg-key").forEach(function(b){b.onclick=function(){
          if(b.textContent==="Push on")setTimeout(function(){stage(i+1)},250);
          else endRun(true,"Banked the session with legs to spare.")
        }});
      } else {notes.push("Fell out at stage "+i+".");endRun(false,"Your legs give out.")}
    };
  }
  function endRun(banked,how){
    var sc=Math.max(5,Math.min(100,Math.round(cleared/total*82+(banked?8:0))));
    shellEnd(sc,{score:sc,rounds:total,roundsDone:cleared,extraLabel:"Stages cleared",extraVal:cleared+" / "+total,recKey:"stage",recVal:cleared,notes:notes.concat([how])});
  }
};

/* static + pick helpers */
function shellStatic(t,s,fn){var sh=shell(t,s,function(st){st.innerHTML="<p class='mg-q'>Nothing to train yet.</p>"});if(fn)fn(sh)}
function shellPick(t,s,opts){
  var sh=shell(t,s,function(st){
    st.innerHTML="<div class='mg-keys'>"+opts.map(function(o,i){return "<button class='mg-key' data-i='"+i+"'>"+o.label+"</button>"}).join("")+"</div>";
    st.querySelectorAll(".mg-key").forEach(function(b){b.onclick=function(){wrapOff();opts[+b.dataset.i].fn()}})});
}
if(!window.__trnPatched){window.__trnPatched=true;
  var _origShowResult=showResult;
}
/* ============================================================ */
/* ACTIVITY REGISTRY + TRAINING MENU UI                          */
/* ============================================================ */
function tiersIndex(t){return TIERS.indexOf(t)}
var ACTS=[
 {id:"med",n:"Chakra Meditation",stat:"chakraMax",mg:"meditate",group:"Chakra",stam:8,xp:12,desc:"Sink into stillness: catch the flow in the gold band, round after round.",req:{}},
 {id:"ctrl",n:"Chakra Control Exercises",stat:"chakraControl",mg:"control",group:"Chakra",stam:10,xp:14,desc:"Shape a drifting flow. Stabilize at the right moment or watch it spill.",req:{}},
 {id:"tree",n:"Tree Climbing",stat:"chakraControl",mg:"tree",group:"Chakra",stam:12,xp:16,desc:"Checkpoint climb: read the bark, pick your output, don't slip.",req:{rank:2}},
 {id:"water",n:"Water Walking",stat:"chakraRecovery",mg:"water",group:"Chakra",stam:14,xp:18,desc:"Cross changing water round by round. Conditions punish the wrong output.",req:{rank:2,stat:{chakraControl:15}}},
 {id:"wgt",n:"Weight Training",stat:"strength",mg:"weights",group:"Physical",stam:14,xp:15,desc:"Pick your load, then earn every rep on the timing bar. Heavier loads unlock as you grow.",req:{}},
 {id:"spr",n:"Sprint Training",stat:"speed",mg:"sprint",group:"Physical",stam:12,xp:15,desc:"Flash prompts and hurdles. Reaction time is your record.",req:{}},
 {id:"end",n:"Endurance Training",stat:"stamina",mg:"endurance",group:"Physical",stam:10,xp:18,desc:"Stages that only get harder. Push on or bank what you've earned.",req:{rank:2}},
 {id:"tai",n:"Taijutsu Practice",stat:"taijutsu",mg:"taijutsu",group:"Combat & Skill",stam:12,xp:15,desc:"Answer each flash with the right response before the window closes. Chains, not buttons.",req:{}},
 {id:"tp",n:"Target Practice",stat:"perception",mg:"targets",group:"Combat & Skill",stam:8,xp:14,desc:"Targets fade fast. Far gold targets pay triple.",req:{lvl:2}},
 {id:"kun",n:"Kunai Accuracy",stat:"perception",mg:"kunai",group:"Combat & Skill",stam:10,xp:16,desc:"Distance changes every round; so does the width of your release window.",req:{lvl:4}},
 {id:"seal",n:"Hand Seal Practice",stat:"sealSpeed",mg:"seals",group:"Combat & Skill",stam:8,xp:14,desc:"Memorize the sequence, reproduce it under the clock. Sequences grow with mastery.",req:{}},
 {id:"jut",n:"Jutsu Practice",stat:"ninjutsu",mg:"jutsu",group:"Combat & Skill",stam:14,xp:18,desc:"Drill a known technique through five mastery stages, Familiarization to Mastery.",req:{lvl:4}},
 {id:"gen",n:"Genjutsu Drills",stat:"genjutsu",mg:"genjutsu",group:"Combat & Skill",stam:10,xp:16,desc:"Find the detail that could not be real before the illusion sets.",req:{lvl:5,stat:{genjutsu:10}}},
 {id:"tac",n:"Tactical Training",stat:"intelligence",mg:"tactical",group:"Combat & Skill",stam:6,xp:16,desc:"Mission simulations. Your calls decide the outcome, for better or worse.",req:{lvl:2}},
 {id:"spar",n:"Sparring",stat:"taijutsu",mg:"spar",group:"Combat & Skill",stam:20,xp:24,desc:"Live combat against a real opponent. Wins, losses and long wars are all recorded.",req:{lvl:3}}
];
ACTS.forEach(function(a){ACT_BY_ID[a.id]=a});
function recSummary(id){
  var rr=rec(id),parts=[];
  if(rr.best)parts.push("best "+Math.round(rr.best));
  if(rr.acc)parts.push(rr.acc+"% acc");
  if(rr.streak)parts.push("streak "+rr.streak);
  if(rr.stage)parts.push("chkpt "+rr.stage);
  if(rr.dist)parts.push(rr.dist+" paces");
  if(rr.time)parts.push(rr.time+"s");
  if(rr.seq)parts.push(rr.seq+" seals");
  if(rr.wins!=null)parts.push(rr.wins+"W / "+(rr.losses||0)+"L");
  return parts.join(" · ");
}
function reqText(a){
  var t=[];
  if(a.req.lvl)t.push("lvl "+a.req.lvl);
  if(a.req.rank)t.push(["academy","genin","chunin","jonin","anbu"][a.req.rank-1]+"+");
  if(a.req.stat)for(var k in a.req.stat)t.push(k+" "+a.req.stat[k]);
  return t.join(" + ");
}
function met(a){
  var r=init();
  if(a.req.lvl&&r.level<a.req.lvl)return false;
  if(a.req.rank&&rankN()<a.req.rank)return false;
  if(a.req.stat)for(var k in a.req.stat)if(rpgStat(k)<a.req.stat[k])return false;
  return true;
}
function render(b){
  init();
  var r=init();
  var groups=[["Chakra",null],["Physical",null],["Combat & Skill",null]];
  var hist=r.trainHist||[];
  var histLine=hist.length?hist.slice(0,4).map(function(h){return "<span class='tr-hist'>"+h.act+" <b style='color:"+gradeCol(h.grade)+"'>"+h.grade+"</b></span>"}).join(""):"";
  b.innerHTML="<p class='rpg-note'>Every drill is its own game now: read each brief, play the mechanic, and your grade decides the gains. Same drill in a row tapers off, and heavy fatigue blunts everything. Current fatigue: "+Math.round(r.fatigue||0)+"%"+((r.fatigue||0)>=50?" (heavy — gains reduced)":"")+"</p>"+
   (histLine?"<div class='tr-histrow'><span class='tr-histlbl'>Recent sessions:</span>"+histLine+"</div>":"");
  groups.forEach(function(g){
    var list=ACTS.filter(function(a){return a.group===g[0]});
    var h=document.createElement("div");h.className="tr-ghead";h.textContent=g[0].toUpperCase();b.appendChild(h);
    list.forEach(function(a){
      var un=met(a);
      var card=document.createElement("div");card.className="rpg-card"+(un?"":" locked");
      var lockTiers=TIERS.filter(function(t){return tierFor(a).indexOf(t)<0}).map(function(t){
        return "<span class='tr-tier locked'>🔒 "+t.n+"</span>"}).join("");
      var tiersHTML=un?(tierFor(a).map(function(t){
        return "<button class='tr-tier' data-t='"+t.id+"'>"+t.n+"</button>"}).join("")+lockTiers):TIERS.map(function(t){
        return "<span class='tr-tier locked'>🔒 "+t.n+"</span>"}).join("");
      var m=mastery(a.id);
      card.innerHTML="<div class='rc-top'><b>"+a.n+"</b><span class='rpg-chip'>"+a.stat+"</span></div>"+
        "<p>"+a.desc+"</p>"+
        "<div class='tr-mbar'><i style='width:"+m+"%'></i></div>"+
        "<div class='tr-mmeta'>"+(m?"drill mastery "+m+"%":"untrained")+(recSummary(a.id)?" · "+recSummary(a.id):"")+"</div>"+
        "<div class='tr-foot2'><span>−"+a.stam+" stamina · up to +"+a.xp+" XP</span><div class='tr-tiers'>"+tiersHTML+"</div></div>"+
        (un?"":"<div class='rpg-lock'>🔒 needs "+reqText(a)+"</div>");
      if(un)card.querySelectorAll(".tr-tier:not(.locked)").forEach(function(btn){
        var t=TIERS.filter(function(x){return x.id===btn.dataset.t})[0];
        btn.onclick=function(){run(a,t)}});
      b.appendChild(card);
    });
  });
}
/* expose */
return {init:init,render:render,run:run,ACTS:ACTS,grade:grade,mastery:mastery,rec:rec,TIERS:TIERS};
})();
