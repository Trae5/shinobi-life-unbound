
// Shinobi Sprint - a tiny three.js demo game
(function () {
  var D = document;
  var scene, camera, renderer, clock;
  var player, playerGroup, vy = 0, yaw = 0, grounded = true;
  var keys = {}, joy = { x: 0, y: 0, active: false };
  var orbs = [], score = 0, TOTAL = 20, timeLeft = 120;
  var started = false, ended = false;
  var actx = null;
  var orbitYaw = 0, orbitPitch = 0.4, orbitDistance = 10, cameraReady = false; var cameraTarget = new THREE.Vector3();

  function $(id) { return D.getElementById(id); }

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8ec9ef);
    scene.fog = new THREE.Fog(0x8ec9ef, 70, 190);

    camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 600);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    D.body.appendChild(renderer.domElement);
    clock = new THREE.Clock();

    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x3f5f3f, 0.95));
    var sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(45, 70, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
    sun.shadow.camera.far = 250;
    scene.add(sun);

    buildWorld();
    buildPlayer();
    spawnOrbs();
    bindInput();
    bindUI();

    addEventListener("resize", function () {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    animate();
  }

  function buildWorld() {
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshLambertMaterial({ color: 0x4c8c4a })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // a dirt training ring in the middle
    var ring = new THREE.Mesh(
      new THREE.CircleGeometry(14, 40),
      new THREE.MeshLambertMaterial({ color: 0xb59a6a })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.receiveShadow = true;
    scene.add(ring);

    // village buildings around the edge
    var bColors = [0xc46b4e, 0x8a6b4a, 0x6b7f8a, 0x9a6b8a];
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2 + 0.3;
      var r = 55 + (i % 3) * 14;
      var w = 6 + (i % 4) * 3, h = 7 + (i % 5) * 3, d = 6 + ((i + 2) % 4) * 3;
      var b = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color: bColors[i % bColors.length] })
      );
      b.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      b.rotation.y = -a;
      b.castShadow = true; b.receiveShadow = true;
      scene.add(b);
      // roof
      var roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(w, d) * 0.85, 4, 4),
        new THREE.MeshLambertMaterial({ color: 0x37424e })
      );
      roof.position.set(b.position.x, h + 2, b.position.z);
      roof.rotation.y = Math.PI / 4 - a;
      roof.castShadow = true;
      scene.add(roof);
    }

    // torii gate at the spawn
    var red = new THREE.MeshLambertMaterial({ color: 0xd0342c });
    var post = new THREE.CylinderGeometry(0.4, 0.5, 7, 10);
    var p1 = new THREE.Mesh(post, red); p1.position.set(-4, 3.5, -6);
    var p2 = new THREE.Mesh(post, red); p2.position.set(4, 3.5, -6);
    var bar = new THREE.Mesh(new THREE.BoxGeometry(11, 0.8, 1), red);
    bar.position.set(0, 7.2, -6);
    var bar2 = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, 0.8), red);
    bar2.position.set(0, 5.8, -6);
    [p1, p2, bar, bar2].forEach(function (m) { m.castShadow = true; scene.add(m); });

    // trees
    for (var t = 0; t < 34; t++) {
      var ta = Math.random() * Math.PI * 2;
      var tr = 18 + Math.random() * 78;
      var tx = Math.cos(ta) * tr, tz = Math.sin(ta) * tr;
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.5, 3, 7),
        new THREE.MeshLambertMaterial({ color: 0x6b4a2f })
      );
      trunk.position.set(tx, 1.5, tz);
      var crown = new THREE.Mesh(
        new THREE.ConeGeometry(2.4, 6, 8),
        new THREE.MeshLambertMaterial({ color: 0x2f6b34 })
      );
      crown.position.set(tx, 6, tz);
      trunk.castShadow = crown.castShadow = true;
      scene.add(trunk); scene.add(crown);
    }

    // training dummies in the ring
    for (var d2 = 0; d2 < 4; d2++) {
      var da = (d2 / 4) * Math.PI * 2;
      var dummy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 2.4, 8),
        new THREE.MeshLambertMaterial({ color: 0xd9c08f })
      );
      dummy.position.set(Math.cos(da) * 7, 1.2, Math.sin(da) * 7);
      dummy.castShadow = true;
      scene.add(dummy);
    }
  }

  // Articulated shinobi made from lightweight Three.js primitives.
  function buildPlayer() {
    playerGroup = new THREE.Group();
    var rig = new THREE.Group();
    playerGroup.add(rig);
    var cloth = new THREE.MeshLambertMaterial({ color: 0x263452 });
    var accent = new THREE.MeshLambertMaterial({ color: 0xb72f43 });
    var skin = new THREE.MeshLambertMaterial({ color: 0xe9b78e });
    var hair = new THREE.MeshLambertMaterial({ color: 0x20202b });
    var metal = new THREE.MeshLambertMaterial({ color: 0xc7d2d9 });
    var dark = new THREE.MeshLambertMaterial({ color: 0x151d2b });
    function part(parent, geometry, material, x, y, z) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    }
    function box(parent, w, h, d, material, x, y, z) {
      return part(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z);
    }
    function limb(parent, x, y, upperLength, lowerLength, upperWidth, lowerWidth) {
      var upper = new THREE.Group();
      upper.position.set(x, y, 0);
      parent.add(upper);
      part(upper, new THREE.CylinderGeometry(upperWidth, upperWidth * 0.8, upperLength, 8), cloth, 0, -upperLength / 2, 0);
      var lower = new THREE.Group();
      lower.position.y = -upperLength;
      upper.add(lower);
      part(lower, new THREE.CylinderGeometry(lowerWidth, lowerWidth * 0.85, lowerLength, 8), cloth, 0, -lowerLength / 2, 0);
      return { upper: upper, lower: lower };
    }
    // Pelvis, chest, neck and expressive, slightly oversized head.
    part(rig, new THREE.SphereGeometry(0.36, 12, 8), cloth, 0, 1.08, 0).scale.set(1.2, 0.65, 0.7);
    var chest = part(rig, new THREE.CylinderGeometry(0.46, 0.32, 0.83, 8), cloth, 0, 1.55, 0);
    chest.scale.z = 0.68;
    box(rig, 0.68, 0.12, 0.51, accent, 0, 1.18, 0);
    part(rig, new THREE.CylinderGeometry(0.14, 0.16, 0.22, 8), skin, 0, 2.06, 0);
    part(rig, new THREE.SphereGeometry(0.43, 16, 12), skin, 0, 2.44, 0).scale.set(1, 1.08, 0.9);
    var cap = part(rig, new THREE.SphereGeometry(0.45, 12, 8), hair, 0, 2.75, 0);
    cap.scale.set(1.04, 0.43, 0.95);
    part(rig, new THREE.ConeGeometry(0.18, 0.35, 5), hair, -0.25, 2.87, 0.05).rotation.z = 0.35;
    part(rig, new THREE.ConeGeometry(0.18, 0.39, 5), hair, 0.14, 2.89, 0.08).rotation.z = -0.2;
    part(rig, new THREE.CylinderGeometry(0.445, 0.445, 0.14, 16), accent, 0, 2.63, 0).scale.z = 0.91;
    box(rig, 0.38, 0.12, 0.035, metal, 0, 2.63, -0.41);
    box(rig, 0.14, 0.06, 0.02, dark, 0, 2.63, -0.434);
    part(rig, new THREE.SphereGeometry(0.045, 8, 6), dark, -0.15, 2.44, -0.376);
    part(rig, new THREE.SphereGeometry(0.045, 8, 6), dark, 0.15, 2.44, -0.376);
    // Shoulder and hip pivots let arms and legs move independently.
    var leftArm = limb(rig, -0.49, 1.93, 0.45, 0.43, 0.14, 0.11);
    var rightArm = limb(rig, 0.49, 1.93, 0.45, 0.43, 0.14, 0.11);
    part(leftArm.lower, new THREE.SphereGeometry(0.12, 8, 6), skin, 0, -0.46, 0);
    part(rightArm.lower, new THREE.SphereGeometry(0.12, 8, 6), skin, 0, -0.46, 0);
    var leftLeg = limb(rig, -0.22, 1.08, 0.49, 0.45, 0.17, 0.13);
    var rightLeg = limb(rig, 0.22, 1.08, 0.49, 0.45, 0.17, 0.13);
    box(leftLeg.lower, 0.26, 0.18, 0.42, dark, 0, -0.49, -0.08);
    box(rightLeg.lower, 0.26, 0.18, 0.42, dark, 0, -0.49, -0.08);
    buildPlayer.rig = { model: rig, leftArm: leftArm, rightArm: rightArm, leftLeg: leftLeg, rightLeg: rightLeg, phase: 0 };
    playerGroup.position.set(0, 0, 6);
    scene.add(playerGroup);
    // The selector changes shared materials without rebuilding meshes.
    var chooser = D.createElement('label');
    chooser.textContent = 'Outfit: ';
    Object.assign(chooser.style, { position: 'fixed', top: '64px', right: '12px', zIndex: '5', color: 'white', background: 'rgba(15,20,35,.85)', padding: '6px', borderRadius: '6px', font: '14px sans-serif' });
    var select = D.createElement('select');
    select.setAttribute('aria-label', 'Shinobi outfit colors');
    [['Navy / Red', 'navy'], ['Forest / Teal', 'forest']].forEach(function (choice) {
      var option = D.createElement('option'); option.textContent = choice[0]; option.value = choice[1]; select.appendChild(option);
    });
    select.addEventListener('change', function () {
      var forest = select.value === 'forest';
      cloth.color.setHex(forest ? 0x284c42 : 0x263452);
      accent.color.setHex(forest ? 0x36b4a5 : 0xb72f43);
    });
    chooser.appendChild(select);
    D.body.appendChild(chooser);
  }

  function updatePlayer(dt) {
    var rig = buildPlayer.rig;
    var ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    var iz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
    var moving = started && !ended && Math.hypot(ix, iz) > 0.1;
    var running = moving && !!(keys.ShiftLeft || keys.ShiftRight);
    if (moving) rig.phase += dt * (running ? 15 : 9);
    var swing = moving && grounded ? Math.sin(rig.phase) * (running ? 0.8 : 0.55) : 0;
    var ease = Math.min(1, dt * 12);
    rig.leftLeg.upper.rotation.x += (swing - rig.leftLeg.upper.rotation.x) * ease;
    rig.rightLeg.upper.rotation.x += (-swing - rig.rightLeg.upper.rotation.x) * ease;
    rig.leftArm.upper.rotation.x += (-swing * 0.75 - rig.leftArm.upper.rotation.x) * ease;
    rig.rightArm.upper.rotation.x += (swing * 0.75 - rig.rightArm.upper.rotation.x) * ease;
    rig.leftLeg.lower.rotation.x += (Math.max(0, -swing) * 0.45 - rig.leftLeg.lower.rotation.x) * ease;
    rig.rightLeg.lower.rotation.x += (Math.max(0, swing) * 0.45 - rig.rightLeg.lower.rotation.x) * ease;
    rig.leftArm.lower.rotation.x += (-0.16 - rig.leftArm.lower.rotation.x) * ease;
    rig.rightArm.lower.rotation.x += (-0.16 - rig.rightArm.lower.rotation.x) * ease;
    rig.model.position.y = moving && grounded ? Math.abs(Math.sin(rig.phase)) * 0.035 : Math.sin(clock.elapsedTime * 2) * 0.025;
  }

  function spawnOrbs() {
    orbs.forEach(function (o) { scene.remove(o.mesh); });
    orbs = [];
    score = 0;
    $("score").textContent = "0";
    for (var i = 0; i < TOTAL; i++) {
      var x, z, ok = false;
      while (!ok) {
        var a = Math.random() * Math.PI * 2;
        var r = 10 + Math.random() * 75;
        x = Math.cos(a) * r; z = Math.sin(a) * r;
        ok = true;
        for (var j = 0; j < orbs.length; j++) {
          if (orbs[j].mesh.position.distanceTo(new THREE.Vector3(x, 1.2, z)) < 8) { ok = false; break; }
        }
      }
      var orb = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.55, 0),
        new THREE.MeshLambertMaterial({ color: 0x66e0ff, emissive: 0x1e7fa8 })
      );
      orb.position.set(x, 1.2, z);
      scene.add(orb);
      orbs.push({ mesh: orb, alive: true });
    }
  }

  function bindInput() {
    addEventListener("keydown", function (e) {
      keys[e.code] = true;
      if (e.code === "Space") doJump();
      if (e.code === "KeyR") reset();
    });
    addEventListener("keyup", function (e) { keys[e.code] = false; });

    var joyEl = $("joy"), knob = $("knob"), joyId = null, cx = 0, cy = 0;
    joyEl.addEventListener("pointerdown", function (e) {
      joyId = e.pointerId;
      var r = joyEl.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      joy.active = true;
      joyEl.setPointerCapture(joyId);
    });
    joyEl.addEventListener("pointermove", function (e) {
      if (e.pointerId !== joyId) return;
      var dx = e.clientX - cx, dy = e.clientY - cy;
      var len = Math.hypot(dx, dy), max = 42;
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      knob.style.left = (33 + dx) + "px";
      knob.style.top = (33 + dy) + "px";
      joy.x = dx / max; joy.y = dy / max;
    });
    function joyEnd(e) {
      if (e.pointerId !== joyId) return;
      joyId = null; joy.active = false; joy.x = 0; joy.y = 0;
      knob.style.left = "33px"; knob.style.top = "33px";
    }
    joyEl.addEventListener("pointerup", joyEnd);
    joyEl.addEventListener("pointercancel", joyEnd);

    $("jump").addEventListener("pointerdown", function (e) { e.preventDefault(); doJump(); });
  }

  function bindUI() {
    $("startBtn").addEventListener("click", function () {
      $("overlay").style.display = "none";
      if (!actx && window.AudioContext) actx = new AudioContext();
      if (actx && actx.state === "suspended") actx.resume();
      started = true;
    });
  }

  function doJump() {
    if (started && !ended && grounded) { vy = 11; grounded = false; }
  }

  function reset() {
    playerGroup.position.set(0, 0, 6);
    vy = 0; yaw = 0; timeLeft = 120; ended = false;
    spawnOrbs();
    $("overlay").style.display = "none";
  }

  function beep(up) {
    if (!actx) return;
    try {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(up ? 880 : 220, actx.currentTime);
      o.frequency.exponentialRampToValueAtTime(up ? 1320 : 110, actx.currentTime + 0.12);
      g.gain.setValueAtTime(0.08, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.15);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.16);
    } catch (err) {}
  }

  function finish(msg) {
    ended = true;
    var card = $("card");
    card.innerHTML = "<h1>" + msg + "</h1><p>Score: " + score + " / " + TOTAL +
      "</p><p>Tap R or reload to play again.</p>";
    $("overlay").style.display = "flex";
  }

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var p = playerGroup.position;

    if (started && !ended) {
      var ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
      var iz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
      var len = Math.hypot(ix, iz);
      if (len > 1) { ix /= len; iz /= len; }
      var sprint = !!(keys.ShiftLeft || keys.ShiftRight);
      var speed = sprint ? 11 : 6.5;
      // camera looks from +z, so forward is -z
      p.x += ix * speed * dt;
      p.z -= iz * speed * dt;
      p.x = Math.max(-100, Math.min(100, p.x));
      p.z = Math.max(-100, Math.min(100, p.z));

      if (len > 0.1) {
        var target = Math.atan2(ix, iz);
        var diff = target - yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        yaw += diff * Math.min(1, dt * 12);
        playerGroup.rotation.y = yaw;
        if (grounded) playerGroup.position.y = Math.abs(Math.sin(clock.elapsedTime * 12)) * 0.08;
      }

      vy -= 30 * dt;
      p.y += vy * dt;
      if (p.y <= 0) { p.y = 0; vy = 0; grounded = true; }

      for (var i = 0; i < orbs.length; i++) {
        var o = orbs[i];
        if (!o.alive) continue;
        o.mesh.rotation.y += dt * 2.4;
        o.mesh.rotation.x += dt * 1.1;
        if (o.mesh.position.distanceTo(p) < 1.8) {
          o.alive = false;
          scene.remove(o.mesh);
          score++;
          $("score").textContent = String(score);
          beep(true);
          if (score === TOTAL) finish("YOU WIN 🏆");
        }
      }

      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; finish("TIME'S UP"); }
      $("time").textContent = String(Math.ceil(timeLeft));
    }

    camera.position.set(p.x, p.y + camOffset.y, p.z + camOffset.z);
    camera.lookAt(p.x, p.y + 1.6, p.z);
    updatePlayer(dt);
    renderer.render(scene, camera);
  }

  var originalBuildPlayer = buildPlayer, originalBindInput = bindInput, originalReset = reset; buildPlayer = function () { originalBuildPlayer(); var r = buildPlayer.rig, model = r.model; model.children[4].scale.set(1.08, 1.1, 0.95); model.children[6].visible = false; model.children[7].visible = false; var ink = new THREE.MeshLambertMaterial({color: 0x171b28}), white = new THREE.MeshLambertMaterial({color: 0xf8f4ed}), skin2 = new THREE.MeshLambertMaterial({color: 0xe9b78e}), pants = new THREE.MeshLambertMaterial({color: 0x1a2634}), hair2 = model.children[5].material; function detail(parent, w, h, d, mat, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.position.set(x,y,z); parent.add(m); return m; } [-1,1].forEach(function(s) { detail(model, 0.14, 0.085, 0.025, white, s*0.15, 2.44, -0.395); detail(model, 0.052, 0.073, 0.03, ink, s*0.15, 2.44, -0.416); var brow = detail(model, 0.15, 0.025, 0.02, ink, s*0.15, 2.515, -0.391); brow.rotation.z = s*0.13; }); detail(model, 0.12, 0.018, 0.02, ink, 0, 2.29, -0.395); var fringe = detail(model, 0.38, 0.11, 0.08, hair2, 0, 2.73, -0.34); fringe.rotation.z = -0.12; detail(model, 0.035, 0.67, 0.025, ink, 0, 1.58, -0.315); detail(model, 0.17, 0.08, 0.04, ink, 0, 1.18, -0.28); [r.leftLeg, r.rightLeg].forEach(function(leg) { leg.upper.children[0].material = pants; leg.lower.children[0].material = pants; detail(leg.lower, 0.22, 0.06, 0.13, skin2, 0, -0.43, -0.23); detail(leg.lower, 0.23, 0.04, 0.065, ink, 0, -0.39, -0.18); }); }; bindInput = function () { originalBindInput(); var c = renderer.domElement, active = null, lastX = 0, lastY = 0; c.style.touchAction = 'none'; c.addEventListener('pointerdown', function(e) { if (e.pointerType === 'mouse' && e.button !== 0) return; active = e.pointerId; lastX = e.clientX; lastY = e.clientY; c.setPointerCapture(active); }); c.addEventListener('pointermove', function(e) { if (e.pointerId !== active) return; orbitYaw -= (e.clientX-lastX)*0.006; orbitPitch = Math.max(0.08, Math.min(1.15, orbitPitch + (e.clientY-lastY)*0.006)); lastX=e.clientX; lastY=e.clientY; }); function endOrbit(e) { if (e.pointerId === active) active = null; } c.addEventListener('pointerup',endOrbit); c.addEventListener('pointercancel',endOrbit); c.addEventListener('lostpointercapture',endOrbit); c.addEventListener('wheel',function(e) { e.preventDefault(); orbitDistance = Math.max(5,Math.min(20,orbitDistance*Math.exp(e.deltaY*0.001))); },{passive:false}); }; reset = function () { originalReset(); grounded = true; started = true; cameraReady = false; }; bindUI = function () { $('startBtn').addEventListener('click', function () { $('overlay').style.display='none'; started=true; try { if (!actx && window.AudioContext) actx = new AudioContext(); if (actx && actx.state === 'suspended') { var resume = actx.resume(); if (resume && resume.catch) resume.catch(function() {}); } } catch (err) { console.warn('Audio unavailable',err); } }); }; animate = function () { requestAnimationFrame(animate); var dt = Math.min(clock.getDelta(),0.05), p = playerGroup.position; if (started && !ended) { var ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x, iz=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y, len=Math.hypot(ix,iz); if (len>1) {ix/=len; iz/=len;} var dx=ix*Math.cos(orbitYaw)-iz*Math.sin(orbitYaw), dz=-ix*Math.sin(orbitYaw)-iz*Math.cos(orbitYaw), speed=(keys.ShiftLeft||keys.ShiftRight)?11:6.5; p.x=Math.max(-100,Math.min(100,p.x+dx*speed*dt)); p.z=Math.max(-100,Math.min(100,p.z+dz*speed*dt)); if (len>0.1) { var target=Math.atan2(-dx,-dz), diff=target-yaw; while(diff>Math.PI) diff-=Math.PI*2; while(diff < -Math.PI) diff+=Math.PI*2; yaw+=diff*Math.min(1,dt*12); playerGroup.rotation.y=yaw; } vy-=30*dt; p.y+=vy*dt; if(p.y<=0) {p.y=0; vy=0; grounded=true;} for(var i=0;i<orbs.length;i++) {var o=orbs[i]; if(!o.alive) continue; o.mesh.rotation.y+=dt*2.4; o.mesh.rotation.x+=dt*1.1; if(o.mesh.position.distanceTo(p)<1.8) {o.alive=false; scene.remove(o.mesh); score++; $('score').textContent=String(score); beep(true); if(score===TOTAL) finish('YOU WIN 🏆');}} if(!ended) {timeLeft-=dt; if(timeLeft<=0) {timeLeft=0; finish("TIME'S UP");}} $('time').textContent=String(Math.ceil(timeLeft)); } var horizontal=orbitDistance*Math.cos(orbitPitch); cameraTarget.set(p.x+Math.sin(orbitYaw)*horizontal,Math.max(0.35,p.y+1.6+orbitDistance*Math.sin(orbitPitch)),p.z+Math.cos(orbitYaw)*horizontal); if(!cameraReady) {camera.position.copy(cameraTarget); cameraReady=true;} else camera.position.lerp(cameraTarget,1-Math.exp(-5*dt)); camera.position.y=Math.max(0.35,camera.position.y); camera.lookAt(p.x,p.y+1.6,p.z); updatePlayer(dt); renderer.render(scene,camera); }; init();
})();
