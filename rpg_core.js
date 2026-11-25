/* ============================ RPG OVERHAUL v5: core systems ============================ */
/* training, minigames, chakra dev, jutsu learning/mastery, loadouts, affinity, skill tree */
function rpgInit(G){
  if(!G.rpg){
    G.rpg={xp:0,level:1,skillPts:0,skills:{},affinity:null,affFound:false,extraEls:[],
      jutsu:{},loadout:[],scrolls:[],teachers:{},trainCount:{},fatigue:0,
      exams:[],missions:[],combat:{wins:0,losses:0,spars:0,record:[]}};
    var gs=G.stats||{};
    ["stamina","perception","sealSpeed"].forEach(function(k){if(gs[k]==null)gs[k]=10});
    G.stats=gs;
  }
  var r=G.rpg;
  if(r.loadout==null)r.loadout=[];if(r.scrolls==null)r.scrolls=[];
  if(r.exams==null)r.exams=[];if(r.missions==null)r.missions=[];
  if(r.combat==null)r.combat={wins:0,losses:0,spars:0,record:[]};
  if(!Object.keys(r.jutsu).length&&!(r.loadout&&r.loadout.length)){
    ["Basic Kunai Strike","Shuriken Throw","Clone Technique","Substitution Technique","Transformation Technique","Escape Art"].forEach(function(n){r.jutsu[n]={mastery:0,age:G.age||0}});
    r.loadout=["Basic Kunai Strike","Clone Technique","Shuriken Throw"];
  }
  return r;
}
function rpgXpFor(l){return Math.floor(120*Math.pow(l,1.45))}
function rpgAddXp(n){
  var r=G.rpg;if(!r)return;r.xp+=Math.max(0,Math.round(n));
  var ups=0;while(r.level<60&&r.xp>=rpgXpFor(r.level+1)){r.level++;ups++;r.skillPts+=1}
  if(ups){fbig("Level up! You are now level "+r.level+(r.skillPts?" — "+r.skillPts+" skill point"+(r.skillPts>1?"s":"")+" to spend in the Skill Tree.":""))}
  return ups;
}
function rpgRankSlots(){var rk=(G.rank||"");if(/Hokage|Kage|Anbu/i.test(rk))return 8;if(/Jonin/i.test(rk))return 7;if(/Chunin/i.test(rk))return 5;if(/Genin/i.test(rk))return 4;return 3}
function rpgPassive(){
  var a={jutPow:0,cdCut:0,crit:0,counter:0,def:0,eva:0,init:0,chakraEff:0,pen:0,shieldMul:0,hpRegen:0,genRes:0,genPow:0,elLearn:0,elPow:0,slots:0,stat:{}};
  var r=G.rpg||{};
  (r.skills?Object.keys(r.skills):[]).forEach(function(id){
    var nd=null;RPG.SKILLTREE.nodes.forEach(function(n){if(n.id===id)nd=n});
    if(!nd)return;var e=nd.eff;
    for(var k in e){if(k==="slots")a.slots+=e[k];else if(RPG.NEWSTATS.indexOf(k)>=0||["ninjutsu","taijutsu","genjutsu","strength","speed","intelligence","chakraControl"].indexOf(k)>=0)a.stat[k]=(a.stat[k]||0)+e[k];else if(a[k]!=null)a[k]+=e[k]}
  });
  /* clan passive feeds chakra growth */
  return a;
}
function rpgStat(name){
  var base=(G.stats&&G.stats[name])||0;
  var p=rpgPassive();base+=p.stat[name]||0;
  return Math.round(base);
}
/* ---------- training ---------- */
function rpgFatigueMul(){var f=(G.rpg&&G.rpg.fatigue)||0;return f>=80?0.5:f>=50?0.75:f>=25?0.9:1}
function rpgTrain(act){
  var r=rpgInit(G);
  if((G.stats.stamina||10)<act.stam*0.5){toast("Too exhausted to train. Rest or sleep first.");return}
  var tc=r.trainCount[act.n]||0;var dim=Math.max(0.3,1-tc*0.06); /* diminishing returns */
  r.trainCount[act.n]=tc+1;r.fatigue=Math.min(100,(r.fatigue||0)+Math.round(act.stam*0.5));
  G.stats.stamina=Math.max(0,(G.stats.stamina||10)-act.stam*0.4);
  rpgMinigame(act,function(score){ /* score 0..100 */
    var q=0.4+0.6*(score/100);
    var base=(act.type==="combat")?3:2+act.xp*0.06; /* stat gain */
    var gain=Math.max(0.2,base*dim*q*rpgFatigueMul());
    var statName=act.stat;
    var cur=(G.stats[statName]||0);
    var soft=Math.max(0.35,1-Math.pow(cur/120,2)*0.6); /* soft cap */
    gain*=soft;
    G.stats[statName]=Math.round((cur+gain)*10)/10;
    var xpg=Math.round(act.xp*q*dim);
    var before=rpgXpFor(r.level+1);
    rpgAddXp(xpg);
    if(act.type!=="combat")if(typeof spendAgeMinutes==="function")spendAgeMinutes(20);
    rpgShowTrainResult(act,score,statName,G.stats[statName],gain,xpg);
  });
}
function spendAgeMinutes(m){/* time advances per year in this sim; drills already cost stamina+fatigue */}
/* ---------- minigames ---------- */
function rpgMinigame(act,done){
  var wrap=el("#minigame")||rpgMgCreate();
  wrap.style.display="flex";wrap.innerHTML="";
  var box=document.createElement("div");box.className="mg-box";wrap.appendChild(box);
  function finish(score){wrap.style.display="none";done(score)}
  function title(t,sub){box.innerHTML="<div class='mg-title'>"+t+"</div><div class='mg-sub'>"+sub+"</div>"}
  if(act.type==="timing"){ /* sweeping bar: stop it in the zone */
    title(act.n,"Tap STOP when the marker is in the gold zone");
    var z='<div class="mg-bar"><div class="mg-zone"></div><div class="mg-mark"></div></div><button class="mg-btn">STOP</button><div class="mg-tries"></div>';
    box.innerHTML+=z;var tries=3,scores=[];
    var zone=box.querySelector(".mg-zone"),mark=box.querySelector(".mg-mark"),triesEl=box.querySelector(".mg-tries");
    function round(){
      var zx=30+Math.random()*40;zone.style.left=zx+"%";zone.style.width=(14+Math.random()*8)+"%";
      var pos=0,dir=1,run=true;
      var iv=setInterval(function(){pos+=dir*(2.2+Math.random()*1.6);if(pos>=100){pos=100;dir=-1}if(pos<=0){pos=0;dir=1}mark.style.left=pos+"%"},16);
      box.querySelector(".mg-btn").onclick=function(){
        if(!run)return;run=false;clearInterval(iv);
        var zw=parseFloat(zone.style.width);var zl=parseFloat(zone.style.left);
        var d=Math.abs(pos-(zl+zw/2));var s=Math.max(0,Math.round(100-d*3));
        scores.push(s);tries--;
        triesEl.textContent=scores.join(" · ")+"   ("+tries+" left)";
        if(tries>0)setTimeout(round,500);else setTimeout(function(){finish(Math.round(scores.reduce(function(a,b){return a+b},0)/scores.length))},400);
      };
    }round();
  }else if(act.type==="reaction"){
    title(act.n,"Hit the flash the instant it appears — 3 rounds");
    var pad=document.createElement("div");pad.className="mg-pad";box.appendChild(pad);
    var res=document.createElement("div");res.className="mg-tries";box.appendChild(res);
    var tries=3,times=[],tm=null;
    function round(){
      pad.textContent="wait for it…";pad.className="mg-pad";
      tm=setTimeout(function(){
        pad.textContent="TAP!";pad.className="mg-pad go";
        var t0=Date.now();
        pad.onclick=function(){pad.onclick=null;clearTimeout(tm);var dt=Date.now()-t0;times.push(Math.max(0,Math.round(100-(dt-160)/14)));tries--;res.textContent=times.join(" · ")+"   ("+tries+" left)";if(tries>0)setTimeout(round,700);else finish(Math.round(times.reduce(function(a,b){return a+b},0)/times.length))};
      },600+Math.random()*1800);
      pad.onclick=function(){clearTimeout(tm);tries--;res.textContent="Too early! ("+tries+" left)";if(tries>0)setTimeout(round,700);else finish(20)};
    }round();
  }else if(act.type==="targets"){
    title(act.n,"Hit every target before it fades — 12 seconds");
    var fld=document.createElement("div");fld.className="mg-field";box.appendChild(fld);
    var res=document.createElement("div");res.className="mg-tries";box.appendChild(res);
    var hit=0,miss=0,t0=Date.now();
    function spawn(){
      if(Date.now()-t0>12000){var s=Math.max(0,Math.round(hit*10-miss*5));setTimeout(function(){finish(s)},200);return}
      var t=document.createElement("div");t.className="mg-target";
      t.style.left=(5+Math.random()*85)+"%";t.style.top=(5+Math.random()*80)+"%";
      t.onclick=function(){hit++;t.remove();res.textContent="hits "+hit+" · misses "+miss};t.ontransitionend=null;
      fld.appendChild(t);
      setTimeout(function(){if(t.parentNode){miss++;t.remove();res.textContent="hits "+hit+" · misses "+miss}},900+Math.random()*500);
      setTimeout(spawn,520+Math.random()*380);
    }spawn();
  }else if(act.type==="sequence"){
    title(act.n,"Memorize the seal sequence, then repeat it");
    var syms=["▮","▯","◈","◉","✦","☰"];
    var seq=[],idx=0,shown=false;
    var disp=document.createElement("div");disp.className="mg-seq";box.appendChild(disp);
    var res=document.createElement("div");res.className="mg-tries";box.appendChild(res);
    var len=4+Math.floor(Math.random()*3);
    for(var i=0;i<len;i++)seq.push(Math.floor(Math.random()*syms.length));
    disp.textContent=seq.map(function(x){return syms[x]}).join(" ");
    setTimeout(function(){disp.textContent="—".repeat?seq.map(function(){return "· "}).join(""):"";shown=true;res.textContent="now repeat it";disp.textContent="";},1900);
    var input=[];
    var keys=document.createElement("div");keys.className="mg-keys";box.appendChild(keys);
    syms.forEach(function(s,i){var b=document.createElement("button");b.className="mg-key";b.textContent=s;
      b.onclick=function(){if(!shown)return;input.push(i);disp.textContent=input.map(function(x){return syms[x]}).join(" ");
        if(input[input.length-1]!==seq[input.length-1]){res.textContent="sequence broken";setTimeout(function(){finish(Math.round(Math.max(20,(input.length/len)*70)))},600);return}
        if(input.length===seq.length){var s2=Math.max(30,Math.round(100-len*6));setTimeout(function(){finish(s2)},500)}};
      keys.appendChild(b)});
  }else if(act.type==="hold"){
    title(act.n,"Keep the chakra flow steady — click to add, it leaks on its own");
    var bwrap=document.createElement("div");bwrap.className="mg-holdbar";box.appendChild(bwrap);
    var fill=document.createElement("div");fill.className="mg-fill";bwrap.appendChild(fill);
    var res=document.createElement("div");res.className="mg-tries";box.appendChild(res);
    var v=20,goal=100,t0=Date.now(),over=0;
    var iv=setInterval(function(){v-=0.7;if(v<0)v=0;fill.style.width=v+"%";if(Date.now()-t0>9000){clearInterval(iv);var s=Math.max(10,Math.round(100-over*4-(100-Math.abs(v-90))*0));finish(Math.max(10,Math.round(100-over*4)))}},80);
    bwrap.onclick=function(){v+=6;if(v>105){over++;v=105}fill.style.width=v+"%"};
    res.textContent="hold it in the green, don't overfill";
  }else if(act.type==="endurance"){
    title(act.n,"Tap as fast as you can — 6 seconds");
    var pad=document.createElement("div");pad.className="mg-pad";box.appendChild(pad);pad.textContent="TAP";
    var res=document.createElement("div");res.className="mg-tries";box.appendChild(res);
    var n=0,t0=null,iv=null;
    pad.onclick=function(){if(!t0){t0=Date.now();iv=setInterval(function(){var left=Math.max(0,6-Math.floor((Date.now()-t0)/1000));res.textContent=n+" taps · "+left+"s";if(left<=0){clearInterval(iv);pad.onclick=null;finish(Math.max(20,Math.min(100,n*2.4)))}},200)}n++;pad.textContent=n};
  }else if(act.type==="puzzle"){
    title(act.n,"Read the scenario. Pick the right call.");
    var qs=[["A stronger genin blocks the only road and demands your supplies.","Fight","Stall and talk","Sprint past"],["Your teammate is bleeding and enemies are near.","Heal first","Fight first","Scout first"],["You spot a trap on the path ahead.","Detour quietly","Spring it deliberately","Mark it and wait"],["An exam question: which element beats Water?","Fire","Earth","Lightning"],["An exam question: which element beats Lightning?","Wind","Earth","Fire"]];
    var q=qs[Math.floor(Math.random()*qs.length)];
    var qq=document.createElement("div");qq.className="mg-q";qq.textContent=q[0];box.appendChild(qq);
    var keys=document.createElement("div");keys.className="mg-keys";box.appendChild(keys);
    var right=1+Math.floor(Math.random()*3);
    for(var i=1;i<4;i++)(function(i){var b=document.createElement("button");b.className="mg-key";b.textContent=q[i];
      b.onclick=function(){finish(i===right?100:25)};keys.appendChild(b)})(i);
  }else{finish(60)}
}
function rpgMgCreate(){
  var d=document.createElement("div");d.id="minigame";d.className="mg-overlay";document.body.appendChild(d);return d;
}
function rpgShowTrainResult(act,score,stat,newVal,gain,xpg){
  var grade=score>=85?"Flawless":score>=65?"Sharp":score>=45?"Solid":"Rough";
  fbig("Training complete — "+act.n+": "+grade+" ("+score+"). "+stat+" +"+gain.toFixed(1)+" → "+newVal+" · +"+xpg+" XP");
}
