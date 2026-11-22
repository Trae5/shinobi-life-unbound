
// Shinobi Sprint - a tiny three.js demo game
(function () {
  var D = document;
  var scene, camera, renderer, clock;
  var player, playerGroup, vy = 0, yaw = 0, grounded = true;
  var keys = {}, joy = { x: 0, y: 0, active: false };
  var orbs = [], score = 0, TOTAL = 20, timeLeft = 120;
  var started = false, ended = false;
  var actx = null;
  var camOffset = new THREE.Vector3(0, 8, 14);

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

  function buildPlayer() {
    playerGroup = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.3, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x232640 })
    );
    body.position.y = 1.15;
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 18, 14),
      new THREE.MeshLambertMaterial({ color: 0xf0c8a0 })
    );
    head.position.y = 2.15;
    var band = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.16, 0.95),
      new THREE.MeshLambertMaterial({ color: 0xd0342c })
    );
    band.position.y = 2.4;
    var scarf = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.12),
      new THREE.MeshLambertMaterial({ color: 0xd0342c })
    );
    scarf.position.set(0, 1.5, 0.42);
    scarf.rotation.x = 0.35;
    [body, head, band, scarf].forEach(function (m) { m.castShadow = true; playerGroup.add(m); });
    playerGroup.position.set(0, 0, 6);
    scene.add(playerGroup);
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
    renderer.render(scene, camera);
  }

  init();
})();
