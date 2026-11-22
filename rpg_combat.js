/* ============================ RPG OVERHAUL v5: combat engine ============================ */
/* interactive turn-based combat: jutsu picker, AI, statuses, effects, sparring/missions/exams */
var RC=null;
function rpgCalc(){
  var s=G.stats,p=rpgPassive(),r=G.rpg;
  var lvl=r.level||1;
  var maxHp=Math.round(80+lvl*12+(s.health||50)*0.8+(s.strength||10)*0.5+p.def*2);
  var maxCh=Math.round(Math.max(20,(s.chakraMax||20)+(s.chakraControl||10)*0.5+lvl*2));
  var maxSt=Math.round(Math.max(10,(s.stamina||10)+lvl*1.5));
  var atk=Math.round(6+lvl*1.2+(s.strength||10)*0.35+p.jutPow/100*8);
  var def=Math.round(2+lvl*0.6+(s.taijutsu||10)*0.12+p.def);
  var spd=Math.round(6+lvl*0.8+(s.speed||10)*0.35+p.init/10);
  return {maxHp:maxHp,maxCh:maxCh,maxSt:maxSt,atk:atk,def:def,spd:spd,p:p};
}
function rpgJutState(n){
  var r=G.rpg;var m=(r.jutsu[n]&&r.jutsu[n].mastery)||0;
  var j=null;RPG.JUTSU.forEach(function(x){if(x.n===n)j=x});return {j:j,m:m};
}
function rpgMasteryTier(m){return m>=70?"Mastered":m>=40?"Proficient":m>=20?"Practiced":"Learned"}
function rpgJutCost(j){
  var r=G.rpg,m=(r.jutsu[j.n]&&r.jutsu[j.j?j.j.n:j.n]?0:0),mm=(r.jutsu[j.n]&&r.jutsu[j.n].mastery)||0,p=rpgPassive();
  var c=j.cost*(1-mm*0.002)*(1-p.chakraEff/100*0.5);return Math.max(1,Math.round(c));
}
function rpgJutCd(j){var mm=(G.rpg.jutsu[j.n]&&G.rpg.jutsu[j.n].mastery)||0;var p=rpgPassive();return Math.max(0,Math.round(j.cd*(1-mm*0.015)*(1-p.cdCut/100)))}
function rpgJutPow(j){
  var mm=(G.rpg.jutsu[j.n]&&G.rpg.jutsu[j.n].mastery)||0,p=rpgPassive();
  var s=G.stats;var sc=j.cat==="Taijutsu"?(s.taijutsu||10)*0.06:(j.cat==="Genjutsu"?(s.genjutsu||10)*0.05:(s.ninjutsu||10)*0.06);
  var elM=(j.el&&rpgPassive().elPow/100+ (G.rpg.affinity===j.el?0.12:0))||0;
  var pow=j.pow*(1+sc/10)*(1+mm*0.004)*(1+p.jutPow/100)*(1+elM);
  return pow;
}
function rpgHasJutsu(n){return !!(G.rpg&&G.rpg.jutsu[n])}
function rpgEnemyScale(e,diff){
  var c=rpgCalc(),lvl=G.rpg.level||1,mul={easy:0.7,normal:1,hard:1.35}[diff]||1;
  var lvlMul=1+Math.max(0,(lvl-1))*0.04;
  return {n:e.n,tier:e.tier,hp:Math.round(e.hp*mul*lvlMul),chakra:Math.round(e.chakra*mul),atk:Math.round(e.atk*mul*lvlMul),def:Math.round(e.def*mul),spd:e.spd,ai:e.ai,xp:Math.round(e.xp*mul),ryō:e.ryō||0,jutsu:e.jutsu||[],maxHp:Math.round(e.hp*mul*lvlMul)};
}
/* combat start. opts: {enemyId|enemyObj, context:'spar'|'mission'|'exam'|'event', diff, onEnd(res)} */
function rpgCombatStart(opts){
  var e=opts.enemyObj?rpgEnemyScale(opts.enemyObj,opts.diff||"normal"):rpgEnemyScale(RPG.ENEMIES.filter(function(x){return x.id===opts.enemyId})[0],opts.diff||"normal");
  if(!e){toast("No opponent found.");return}
  var c=rpgCalc();
  RC={ctx:opts.context||"event",diff:opts.diff||"normal",onEnd:opts.onEnd||null,
    turn:1,pHp:c.maxHp,pCh:Math.round(c.maxCh*0.7),pSt:c.maxSt,eHP:e.hp,e:e,
    pDef:0,pEva:0,pBuffAtk:0,pBuffDef:0,eBuffAtk:0,eBuffDef:0,eSeal:0,pSeal:0,
    cd:{},pStatus:[],eStatus:[],log:[],over:false,chargeTurns:0,analyze:0,retreats:0};
  if(opts.context==="spar"){G.rpg.combat.spars=(G.rpg.combat.spars||0)+1}
  rpgCombatUI();
  rcLog("A "+e.n+" stands across the field. Your move.");
}
function rcLog(t){
  if(!RC)return;RC.log.push(t);var box=el("#rc-log");if(box){box.innerHTML=RC.log.slice(-40).map(function(x){return "<div class='rc-line'>"+x+"</div>"}).join("");box.scrollTop=box.scrollHeight}
}
function rpgCombatUI(){
  var old=el("#rpg-combat");if(old)old.remove();
  var d=document.createElement("div");d.id="rpg-combat";d.className="rc-overlay";document.body.appendChild(d);
  d.innerHTML="<div class='rc-stage' id='rc-stage'><div class='rc-col you'><div class='rc-name'>You</div><div class='rc-bar hp'><i id='rc-php'></i></div><div class='rc-bar ch'><i id='rc-pch'></i></div><div class='rc-bar st'><i id='rc-pst'></i></div><div class='rc-nums' id='rc-pnums'></div><div class='rc-status' id='rc-pstatus'></div></div><div class='rc-vs'>VS</div><div class='rc-col foe'><div class='rc-name' id='rc-ename'></div><div class='rc-bar hp foe'><i id='rc-ehp'></i></div><div class='rc-nums' id='rc-enums'></div><div class='rc-status' id='rc-estatus'></div><div class='rc-intent' id='rc-eintent'></div></div></div><div class='rc-log' id='rc-log'></div><div class='rc-actions' id='rc-actions'></div><div class='rc-jutsu' id='rc-jutsu' style='display:none'></div>";
  rpgCombatRender();
}
function rpgCombatRender(){
  if(!RC)return;var c=rpgCalc();
  var q=function(s){return el(s)};
  q("#rc-php").style.width=Math.max(0,RC.pHP/c.maxHp*100)+"%";q("#rc-pch").style.width=Math.max(0,RC.pCh/c.maxCh*100)+"%";q("#rc-pst").style.width=Math.max(0,RC.pSt/c.maxSt*100)+"%";
  q("#rc-ehp").style.width=Math.max(0,RC.eHP/RC.e.maxHp*100)+"%";q("#rc-ename").textContent=RC.e.n+" · T"+RC.e.tier;
  q("#rc-pnums").textContent=Math.max(0,Math.round(RC.pHP))+" HP · "+Math.round(RC.pCh)+" chakra · "+Math.round(RC.pSt)+" stamina";
  q("#rc-enums").textContent=Math.max(0,Math.round(RC.eHP))+" HP · "+Math.round(RC.e.chakra)+" chakra · atk "+RC.e.atk;
  q("#rc-pstatus").innerHTML=rcStatusHtml(RC.pStatus);q("#rc-estatus").innerHTML=rcStatusHtml(RC.eStatus);
  q("#rc-eintent").textContent=RC.analyze?("intent: "+RC.eIntent+" · ai "+RC.e.ai):"";
  var acts=el("#rc-actions");
  acts.innerHTML="";
  [["Attack",rcActAttack],["Taijutsu",rcActTai],["Jutsu",rcOpenJutsu],["Defend",rcActDefend],["Substitute",rcActSub],["Charge Chakra",rcActCharge],["Items",rcActItems],["Analyze",rcActAnalyze],["Retreat",rcActRetreat]].forEach(function(a){
    var b=document.createElement("button");b.className="rc-btn";b.textContent=a[0];b.onclick=function(){if(!RC||RC.over)return;a[1]()};acts.appendChild(b)});
}
function rcStatusHtml(list){
  if(!list||!list.length)return "";
  return list.map(function(s){return "<span class='rc-chip "+s.k+"'>"+s.k+(s.dur?" "+s.dur:"")+"</span>"}).join("");
}
function rcActAttack(){
  var c=rpgCalc();var dmg=Math.round((c.atk*0.8+(G.stats.strength||10)*0.2)*(1+RC.pBuffAtk/100)*(Math.random()<c.p.crit/100?1.5:1));
  rcDealDamage(dmg,"You close in and strike: "+dmg+" damage.");
  rcEndPlayerTurn();
}
function rcActTai(){
  var c=rpgCalc();var cost=8;if(RC.pSt<cost){rcLog("Not enough stamina for a taijutsu combo.");rpgCombatRender();return}
  RC.pSt-=cost;var combo=1+Math.min(2,(G.stats.taijutsu||10)/40);
  var dmg=Math.round((c.atk*0.9*combo)*(1+RC.pBuffAtk/100)*(Math.random()<c.p.crit/100?1.6:1));
  rcDealDamage(dmg,"A "+(combo>2?"three-hit":"heavy")+" taijutsu chain lands: "+dmg+" damage.");
  rcEndPlayerTurn();
}
function rcOpenJutsu(){
  var jd=el("#rc-jutsu");jd.style.display="flex";jd.innerHTML="";
  var lo=(G.rpg.loadout||[]);
  if(!lo.length){jd.innerHTML="<div class='rc-jnote'>No jutsu equipped. Visit the Jutsu screen to build a loadout.</div><button class='rc-btn' onclick='this.parentNode.style.display=\"none\"'>Close</button>";return}
  lo.forEach(function(n){
    var st=rpgJutState(n);var j=st.j;if(!j)return;var cd=RC.cd[n]||0;var cost=rpgJutCost(j);
    var b=document.createElement("button");b.className="rc-jbtn r"+j.rank.toLowerCase()+(cd>0?" cd":"");
    b.innerHTML="<b>"+j.n+"</b> <span class='rj'>"+j.rank+"</span><br><small>"+cost+" chakra · pow "+j.pow.toFixed(1)+" · cd "+rpgJutCd(j)+(cd>0?" · ON COOLDOWN ("+cd+")":" · "+rpgMasteryTier(st.m)+" "+st.m+"%")+"</small><br><small>"+j.desc+"</small>";
    if(cd>0){b.disabled=true}else{b.onclick=function(){jd.style.display="none";rcCastJutsu(j)}}
    jd.appendChild(b)});
  var cl=document.createElement("button");cl.className="rc-btn";cl.textContent="Close";cl.onclick=function(){jd.style.display="none"};jd.appendChild(cl);
}
function rcCastJutsu(j){
  var cost=rpgJutCost(j);
  if(RC.pCh<cost){rcLog("Not enough chakra for "+j.n+" ("+cost+" needed).");rpgCombatRender();return}
  RC.pCh-=cost;RC.cd[j.n]=rpgJutCd(j)+1;
  var pw=rpgJutPow(j);var c=rpgCalc();
  rpgCombatFx(j.cat,j.el||j.cat);
  if(j.cat==="Genjutsu"||j.eff.t==="genji"){
    if(Math.random()<0.35+((G.stats.genjutsu||10)/100)){rcStatus(RC.e,"stun",j.eff.v||1);rcLog("Your "+j.n+" takes hold of their mind. They stagger.")}
    else{rcLog("They shake off the "+j.n+".")}
    if(j.pow>0){var d=Math.round(pw*c.atk*0.5);rcDealDamage(d,j.n+" lands while their guard is down: "+d+" damage.")}
    rcEndPlayerTurn();return;
  }
  switch(j.eff.t){
    case "dmg":var d=Math.round(pw*c.atk*(1+RC.pBuffAtk/100)*(Math.random()<c.p.crit/100?1.5:1));rcDealDamage(d,"You weave seals and release "+j.n+": "+d+" damage.");break;
    case "multi":var tot=0,msg=[];for(var i=0;i<j.eff.v;i++){var d2=Math.round(pw*c.atk*0.55*(0.8+Math.random()*0.4));tot+=d2;msg.push(d2)}rcDealDamage(tot,j.n+" strikes in a chain ("+msg.join(", ")+"): "+tot+" total.");break;
    case "heal":var h=Math.round(j.eff.v*(1+(G.stats.chakraControl||10)/60));RC.pHP=Math.min(c.maxHp,RC.pHP+h);rcLog(j.n+" knits your wounds: +"+h+" HP.");break;
    case "regen":rcStatus(RC.p,"regen",j.eff.dur,{v:j.eff.v});rcLog(j.n+" surrounds you with healing chakra.");break;
    case "shield":var sv=Math.round(j.eff.v*(1+c.p.shieldMul/100));RC.pDef+=sv;rcLog(j.n+" hardens around you: a "+sv+" point guard.");break;
    case "buffAtk":RC.pBuffAtk+=j.eff.v;rcStatus(RC.p,"atkup",j.eff.dur,{v:j.eff.v});rcLog(j.n+" surges through you: +"+j.eff.v+"% attack.");break;
    case "buffDef":RC.pBuffDef+=j.eff.v;rcStatus(RC.p,"defup",j.eff.dur,{v:j.eff.v});rcLog(j.n+" wraps your guard: +"+j.eff.v+"% defense.");break;
    case "buffEva":RC.pEva+=j.eff.v;rcStatus(RC.p,"evaup",j.eff.dur,{v:j.eff.v});rcLog(j.n+" blurs your outline: harder to hit.");break;
    case "debuffAtk":rcStatus(RC.e,"atkdown",j.eff.dur,{v:j.eff.v});rcLog(j.n+" clouds their mind: their attacks weaken.");break;
    case "debuffDef":rcStatus(RC.e,"defdown",j.eff.dur,{v:j.eff.v});rcLog(j.n+" leaves them exposed: their guard weakens.");break;
    case "stun":rcStatus(RC.e,"stun",j.eff.v);rcLog(j.n+" locks them in place for "+j.eff.v+" turn"+(j.eff.v>1?"s":"")+".");break;
    case "drain":var dv=Math.round(j.eff.v);RC.e.chakra=Math.max(0,RC.e.chakra-dv);RC.pCh=Math.min(c.maxCh,RC.pCh+Math.round(dv*0.6));rcLog(j.n+" drains "+dv+" of their chakra into you.");break;
    case "dot":rcStatus(RC.e,"dot",j.eff.dur,{v:j.eff.v});rcLog(j.n+" leaves a lingering wound that will bleed each turn.");break;
    case "seal":RC.eSeal+=j.eff.v;rcLog(j.n+" seals their technique: they lose "+j.eff.v+" jutsu turns.");break;
    case "summon":var sd=Math.round(pw*c.atk*0.35);rcDealDamage(sd,"Your summon strikes from the flank: "+sd+" damage.");break;
    case "gates":RC.pBuffAtk+=40;RC.pStatus.push({k:"gates",dur:4,v:40});rcLog("The gate opens. Power floods out — your body will pay for this.");break;
    case "analyze":RC.analyze=1;rcLog("You read their stance and breathing. Their intent is visible.");break;
    case "cleanse":RC.pStatus=RC.pStatus.filter(function(s){return s.k!=="dot"&&s.k!=="stun"});rcLog(j.n+" slips you free of holds and lingering wounds.");break;
    case "evade":RC.pEva+=100;rcLog("You swap with a log. The next attack finds nothing.");break;
    default:var d3=Math.round(pw*c.atk*0.8);rcDealDamage(d3,j.n+" hits: "+d3+" damage.");
  }
  if(j.eff.st&&j.eff.t==="dmg"&&Math.random()<0.4){rcStatus(RC.e,j.eff.st,2,{v:8});rcLog("The technique leaves a mark: "+j.eff.st+".")}
  if(j.eff.self&&j.rank==="S"){RC.pHP=Math.max(1,RC.pHP-Math.round(c.maxHp*0.15));rcLog("The forbidden technique takes its price from you.")}
  rcEndPlayerTurn();
}
function rcDealDamage(d,msg){
  var e=RC.e;var eDef=Math.max(0,e.def*(1+RC.eBuffDef/100)*(1-rpgPassive().pen/100));
  var final=Math.max(1,Math.round(d*(1-eDef/100)-eDef*0.3));
  e.hp-=final;rcLog(msg+" ("+final+" through guard)");
  if(e.hp<=0)rcWin();
}
function rcStatus(who,k,dur,extra){
  var list=who==="p"?RC.pStatus:RC.eStatus;
  var ex=Object.assign({k:k,dur:dur},extra||{});list.push(ex);
}
function rcEndPlayerTurn(){
  if(!RC||RC.over)return;
  for(var k in RC.cd){RC.cd[k]=Math.max(0,RC.cd[k]-1)}
  rcTickStatuses("p");if(RC.over)return;
  setTimeout(rcEnemyTurn,700);
}
function rcTickStatuses(who){
  var c=rpgCalc();
  var list=who==="p"?RC.pStatus:RC.eStatus;
  list.forEach(function(s){
    if(s.k==="dot"||s.k==="burn"||s.k==="bleed"){if(who==="p"){RC.pHP-=s.v}else{RC.e.hp-=s.v}rcLog((who==="p"?"You":"They")+" bleed "+s.v+" from a lingering wound.")}
    if(s.k==="regen"&&who==="p"){RC.pHP=Math.min(c.maxHp,RC.pHP+s.v);rcLog("Healing chakra restores "+s.v+" HP.")}
    if(s.k==="numb"&&who==="e"){RC.e.spd=Math.max(2,RC.e.spd-2)}
    if(s.k==="atkup"&&s.dur<=0){RC.pBuffAtk-=s.v}
    if(s.k==="defup"&&s.dur<=0){RC.pBuffDef-=s.v}
    if(s.k==="evaup"&&s.dur<=0){RC.pEva-=s.v}
  });
  list.forEach(function(s){s.dur--});
  RC[who==="p"?"pStatus":"eStatus"]=list.filter(function(s){return s.dur>0||["dot"].indexOf(s.k)<0&&false});
  RC.pStatus=RC.pStatus.filter(function(s){return s.dur>0});
  RC.eStatus=RC.eStatus.filter(function(s){return s.dur>0});
  if(RC.pHP<=0){rcLose();return}if(RC.e.hp<=0){rcWin();return}
  rpgCombatRender();
}
function rcEnemyTurn(){
  if(!RC||RC.over)return;
  var stunned=RC.eStatus.some(function(s){return s.k==="stun"});
  if(stunned){rcLog("They struggle against the hold and lose their turn.");rcStatusesEndRound();return}
  if(RC.eSeal>0){RC.eSeal--;rcLog("Their jutsu is sealed and fizzles this turn.")}
  var e=RC.e,c=rpgCalc();
  var available=(e.jutsu||[]).filter(function(n){return rpgHasJutsu(n)||true});
  var useJut=e.chakra>=25&&available.length&&Math.random()<({basic:0.25,aggressive:0.4,smart:0.55}[e.ai]||0.3);
  var dmg=0,msg="";
  if(e.hp<e.maxHp*0.25&&e.ai==="smart"&&Math.random()<0.5){msg="They fall back behind a hard guard.";RC.eBuffDef+=25;RC.e.chakra=Math.min(999,e.chakra+10)}
  else if(e.chakra<12&&Math.random()<0.6){msg="They kneel and gather chakra.";e.chakra+=Math.round(e.chakraMax*0.25)}
  else if(useJut){var jn=available[Math.floor(Math.random()*available.length)];var jj=null;RPG.JUTSU.forEach(function(x){if(x.n===jn)jj=x});
    if(jj){e.chakra-=Math.round(jj.cost*0.8);dmg=Math.round(e.atk*jj.pow*0.9);msg="They unleash "+jj.n+"!"}
    else{dmg=Math.round(e.atk*0.9);msg="They strike."}}
  else{dmg=Math.round(e.atk*(0.8+Math.random()*0.4)*(1+RC.eBuffAtk/100));msg="They attack."}
  var eva=Math.max(0,Math.min(90,RC.pEva+(G.stats.speed||10)*0.5));
  if(Math.random()*100<eva){rcLog(msg+" You read it and slip aside: no damage.")}
  else{
    var pd=Math.max(0,c.def*(1+RC.pBuffDef/100));
    var final=Math.max(1,Math.round(dmg*(1-pd/(pd+60))-pd*0.2));
    if(RC.pDef>0){var absorbed=Math.min(RC.pDef,final);RC.pDef-=absorbed;final-=absorbed;rcLog(msg+" Your guard absorbs "+absorbed+".")}
    RC.pHP-=final;rcLog(msg+" ("+final+" damage to you)");
  }
  if(RC.pHP<=0){rcLose();return}
  rcStatusesEndRound();
}
function rcStatusesEndRound(){
  RC.turn++;
  for(var k in RC.cd){RC.cd[k]=Math.max(0,RC.cd[k]-1)}
  RC.pCh=Math.min(rpgCalc().maxCh,RC.pCh+Math.round(rpgCalc().maxCh*0.04+(G.stats.chakraRecovery||10)*0.15));
  rpgCombatRender();
  if(RC&&RC.over)return;
  setTimeout(function(){},0);
}
function rcWin(){
  if(!RC||RC.over)return;RC.over=true;
  var e=RC.e,r=G.rpg;
  var xp=e.xp,ryō=e.ryō||0;
  r.combat.wins=(r.combat.wins||0)+1;r.combat.record.push({when:new Date().toISOString(),foe:e.n,res:"win",ctx:RC.ctx});
  var scrollChance=RC.ctx==="mission"&&e.tier>=3?0.35:e.tier>=4?0.3:0.12;
  var scroll=null;
  if(Math.random()<scrollChance){var pool=RPG.JUTSU.filter(function(j){return j.learn==="scroll"&&j.req.lvl<=(r.level||1)+2});if(pool.length)scroll=pool[Math.floor(Math.random()*pool.length)].n}
  rpgAddXp(xp);
  if(ryō&&G.money!=null)G.money+=ryō;
  var msg="<div class='rc-over'><h3>Victory</h3><p>You defeated the "+e.n+" in "+RC.turn+" turns.</p><p>+"+xp+" XP"+(ryō?" · +"+ryō+" ryō":"")+(scroll?" · scroll: "+scroll:"")+"</p></div>";
  if(scroll){r.scrolls=r.scrolls||[];r.scrolls.push(scroll);rcLog("You find a scroll among their things: "+scroll+".")}
  rcShowOver(msg);
}
function rcLose(){
  if(!RC||RC.over)return;RC.over=true;
  var e=RC.e,r=G.rpg;
  r.combat.losses=(r.combat.losses||0)+1;r.combat.record.push({when:new Date().toISOString(),foe:e.n,res:"loss",ctx:RC.ctx});
  rpgAddXp(Math.round(e.xp*0.3));
  var hp=Math.max(5,Math.round(rpgCalc().maxHp*0.15));G.stats.health=Math.max(5,hp);
  rcShowOver("<div class='rc-over lose'><h3>Defeat</h3><p>The "+e.n+" overwhelms you. You wake later, bruised but alive.</p><p>+"+Math.round(e.xp*0.3)+" XP for the lesson. Health restored to a crawl.</p></div>");
}
function rcShowOver(html){
  var d=el("#rpg-combat");
  var box=document.createElement("div");box.className="rc-overwrap";box.innerHTML=html+"<button class='rc-btn done'>Continue</button>";
  d.appendChild(box);box.querySelector(".done").onclick=function(){
    var res={win:!RC.lost,foe:RC.e.n,ctx:RC.ctx,turns:RC.turn};
    var cb=RC.onEnd;RC=null;d.remove();
    if(cb)cb(res);
    else{VIEW="home";VTAB="feed";if(typeof render==="function")render()}
  };
}
function rcActDefend(){RC.pBuffDef+=30;RC.pStatus.push({k:"defup",dur:2,v:30});RC.pCh=Math.min(rpgCalc().maxCh,RC.pCh+8);rcLog("You set a firm guard and steady your breathing.");rcEndPlayerTurn()}
function rcActSub(){var cost=10;if(RC.pCh<cost){rcLog("Not enough chakra to substitute.");rpgCombatRender();return}RC.pCh-=cost;RC.pEva+=100;RC.pStatus.push({k:"evaup",dur:1,v:100});rcLog("Substitution: a log takes your place.");rcEndPlayerTurn()}
function rcActCharge(){RC.pCh=Math.min(rpgCalc().maxCh,RC.pCh+Math.round(rpgCalc().maxCh*0.22+(G.stats.chakraControl||10)*0.3));rcLog("You gather chakra into your core.");rcEndPlayerTurn()}
function rcActAnalyze(){RC.analyze=1;RC.eIntent="assessing";rcLog("You study their stance: rank, breathing, tells.");rcEndPlayerTurn()}
function rcActRetreat(){
  if(RC.ctx==="exam"){rcLog("There is no walking out of an exam bout.");rpgCombatRender();return}
  var chance=RC.ctx==="spar"?1:(0.4+(G.stats.speed||10)*0.02);
  if(Math.random()<chance){rcLog("You break contact and vanish into the terrain.");RC.lost=true;RC.over=true;rcShowOver("<div class='rc-over'><h3>Retreat</h3><p>You disengage alive. No reward, no loss beyond pride.</p></div>")}
  else{rcLog("They cut off your escape!");rcEndPlayerTurn()}
}
function rcActItems(){
  var inv=(G.rpg.items)||[];var heals=inv.filter(function(i){return i&&i.heal});
  if(!heals.length){rcLog("You carry no usable items.");rpgCombatRender();return}
  var it=heals[0];RC.pHP=Math.min(rpgCalc().maxHp,RC.pHP+it.heal);inv.splice(inv.indexOf(it),1);rcLog("You use "+(it.n||"a ration")+": +"+it.heal+" HP.");rcEndPlayerTurn();
}
function rpgCombatFx(cat,elName){
  var st=el("#rc-stage");if(!st)return;
  var cls="fx-"+String(elName||cat||"").toLowerCase().replace(/[^a-z]/g,"");
  var f=document.createElement("div");f.className="rc-fx "+cls;st.appendChild(f);
  setTimeout(function(){f.remove()},900);
}
