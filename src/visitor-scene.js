import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export async function createVisitorScene(canvas, isEnabled) {
  await RAPIER.init();
  const host = canvas.closest('.visitor-pass');
  const stage = host.querySelector('.visitor-stage');
  const handle = document.createElement('button');
  handle.className = 'visitor-drag-handle';
  handle.setAttribute('aria-label', 'Drag visitor pass anywhere on screen. Press Enter to replay its drop.');
  canvas.classList.add('visitor-overlay');
  document.body.append(canvas, handle);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 100);
  camera.position.set(0, .1, 11);
  camera.lookAt(0, .1, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x514837, 2.5));
  const light = new THREE.DirectionalLight(0xfff2df, 3);
  light.position.set(-3, 4, 6); scene.add(light);
  const orangeLight = new THREE.DirectionalLight(0xff8a38, 2.4);
  orangeLight.position.set(3, 1, 4); scene.add(orangeLight);

  const world = new RAPIER.World({ x: 0, y: -30, z: 0 });
  world.timestep = 1 / 60;
  world.numSolverIterations = 8;
  const origin = { x: 0, y: 0, z: 0 };
  const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 3.4, 0));
  const links = Array.from({ length: 3 }, (_, i) => {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation((i + 1) * .45, 3.4, 0).setLinearDamping(4).setAngularDamping(4));
    world.createCollider(RAPIER.ColliderDesc.ball(.07).setCollisionGroups(0).setMass(.12), body);
    return body;
  });
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(1.35, 1.5, 0).setLinearDamping(4).setAngularDamping(4).setCcdEnabled(true));
  world.createCollider(RAPIER.ColliderDesc.cuboid(1.2, 1.65, .045).setMass(1).setCollisionGroups(0), body);
  let ropeLength = .7;
  let ropeJoints = [];
  function stretch(length) {
    ropeJoints.forEach(joint => world.removeImpulseJoint(joint, true));
    ropeLength = length;
    ropeJoints = [fixed, ...links.slice(0, 2)].map((previous, i) =>
      world.createImpulseJoint(RAPIER.JointData.rope(length, origin, origin), previous, links[i], true));
  }
  stretch(.7);
  world.createImpulseJoint(RAPIER.JointData.spherical(origin, { x: 0, y: 1.9, z: 0 }), links[2], body, true);

  const badge = new THREE.Group(); scene.add(badge);
  const metal = new THREE.MeshStandardMaterial({ color: 0x858b88, metalness: 1, roughness: .24 });
  const cardMetal = new THREE.MeshPhysicalMaterial({ color: 0x77756f, metalness: .95, roughness: .25, clearcoat: .35, clearcoatRoughness: .2 });
  const card = new THREE.Mesh(new RoundedBoxGeometry(2.4, 3.3, .09, 4, .09), cardMetal);
  badge.add(card);
  const artwork = document.createElement('canvas'); artwork.width = 720; artwork.height = 990;
  const ctx = artwork.getContext('2d');
  const texture = new THREE.CanvasTexture(artwork); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  // Anodized metal with a restrained reflection that shifts as the badge swings.
  const faceMaterial = new THREE.MeshPhysicalMaterial({ map: texture, metalness: .7, roughness: .38, envMapIntensity: .3, clearcoat: .25, clearcoatRoughness: .22 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.32, 3.22), faceMaterial); face.position.z = .047; badge.add(face);
  const back = face.clone(); back.rotation.y = Math.PI; back.position.z = -.047; badge.add(back);
  const slot = new THREE.Mesh(new RoundedBoxGeometry(.48, .095, .02, 2, .035), new THREE.MeshBasicMaterial({ color: 0x030403 }));
  slot.position.set(0, 1.48, .07); badge.add(slot);
  const clip = new THREE.Mesh(new THREE.TorusGeometry(.15, .035, 8, 20), metal);
  clip.scale.y = 1.65; clip.position.set(0, 1.72, .055); badge.add(clip);
  const clasp = new THREE.Mesh(new RoundedBoxGeometry(.27, .15, .13, 3, .025), metal);
  clasp.position.set(0, 1.93, 0); badge.add(clasp);

  function setName(name) {
    const gradient = ctx.createLinearGradient(0, 0, 720, 990);
    gradient.addColorStop(0, '#1b1e19'); gradient.addColorStop(.55, '#0a0c09'); gradient.addColorStop(1, '#191c16');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 720, 990);
    ctx.strokeStyle = 'rgba(210,195,175,.035)'; ctx.lineWidth = 1;
    for (let y = 2; y < 990; y += 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(720, y); ctx.stroke();
    }
    ctx.strokeStyle = '#44483a'; ctx.lineWidth = 2; ctx.strokeRect(14, 14, 692, 962);
    ctx.fillStyle = '#f1eee4'; ctx.font = 'bold 118px Arial'; ctx.fillText('k.n', 52, 166);
    ctx.fillStyle = '#afad9c'; ctx.font = '19px monospace'; ctx.fillText('KUNAL NISHAD / PORTFOLIO', 57, 219);
    ctx.fillStyle = '#eeeade'; ctx.font = 'bold 56px Arial'; ctx.fillText('Good to have', 52, 305); ctx.fillText('you here.', 52, 369);
    ctx.save(); ctx.beginPath(); ctx.rect(24, 410, 672, 330); ctx.clip();
    for (let i = 0; i < 11; i++) {
      const spread = 38 + i * 36;
      ctx.strokeStyle = i === 4 ? '#b77e49' : '#373e2e'; ctx.lineWidth = i === 4 ? 2 : 1.5;
      ctx.beginPath(); ctx.moveTo(360-spread*1.6,410); ctx.lineTo(360,410+spread); ctx.lineTo(360+spread*1.6,410); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(360-spread*1.6,745); ctx.lineTo(360,745-spread); ctx.lineTo(360+spread*1.6,745); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#ebad73'; ctx.font = '18px monospace'; ctx.fillText('ALL ACCESS', 55, 805);
    ctx.fillStyle = '#eeeade'; let size = 43; const label = name || 'VISITOR';
    do { ctx.font = `500 ${size--}px Arial`; } while (ctx.measureText(label).width > 610 && size > 15);
    ctx.fillText(label, 53, 868);
    ctx.fillStyle = '#888d7d'; ctx.font = '17px monospace'; ctx.fillText('GUEST / 001', 55, 940); ctx.fillText('2026', 606, 940);
    texture.needsUpdate = true; canvas.dataset.name = label; draw();
  }
  const strapArt = document.createElement('canvas'); strapArt.width = 128; strapArt.height = 512;
  const strapCtx = strapArt.getContext('2d'); strapCtx.fillStyle = '#161a13'; strapCtx.fillRect(0, 0, 128, 512);
  strapCtx.strokeStyle = '#535746'; strapCtx.lineWidth = 2;
  strapCtx.strokeRect(6, 0, 116, 512);
  strapCtx.fillStyle = '#c1c2af'; strapCtx.font = 'bold 38px Arial'; strapCtx.textAlign = 'center';
  for (const y of [85, 255, 425]) { strapCtx.save(); strapCtx.translate(64, y); strapCtx.rotate(-Math.PI/2); strapCtx.fillText('k.n', 0, 12); strapCtx.restore(); }
  const strapTexture = new THREE.CanvasTexture(strapArt); strapTexture.colorSpace = THREE.SRGBColorSpace;
  const strapGeometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(33 * 2 * 3), uv = new Float32Array(33 * 2 * 2), indices = [];
  for (let i = 0; i <= 32; i++) { uv.set([0, i / 32, 1, i / 32], i * 4); if (i < 32) { const j=i*2; indices.push(j,j+1,j+2,j+1,j+3,j+2); } }
  strapGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
  strapGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); strapGeometry.setIndex(indices);
  const strap = new THREE.Mesh(strapGeometry, new THREE.MeshBasicMaterial({ map: strapTexture, side: THREE.DoubleSide })); strap.frustumCulled = false; scene.add(strap);
  const curve = new THREE.CatmullRomCurve3(Array.from({length:4},()=>new THREE.Vector3())); curve.curveType = 'chordal';
  const position = new THREE.Vector3();
  let entrance = 0, entranceVelocity = 0;
  const corner = new THREE.Vector3();
  function draw() {
    scene.position.y = entrance;
    badge.position.copy(body.translation()); badge.quaternion.copy(body.rotation());
    [fixed,...links].forEach((link,i)=>curve.points[i].copy(link.translation()));
    for (let i=0;i<=32;i++) {
      curve.getPoint(i/32, position);
      vertices.set([position.x-.095,position.y,position.z,position.x+.095,position.y,position.z], i*6);
    }
    strapGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene,camera);
    const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const x of [-1.2, 1.2]) for (const y of [-1.65, 1.65]) {
      corner.set(x,y,0).applyMatrix4(badge.matrixWorld).project(camera);
      const px = (corner.x+1)*innerWidth/2, py = (1-corner.y)*innerHeight/2;
      bounds.left=Math.min(bounds.left,px); bounds.right=Math.max(bounds.right,px);
      bounds.top=Math.min(bounds.top,py); bounds.bottom=Math.max(bounds.bottom,py);
    }
    Object.assign(handle.style,{left:`${bounds.left}px`,top:`${bounds.top}px`,width:`${bounds.right-bounds.left}px`,height:`${bounds.bottom-bounds.top}px`});
    const rect = stage.getBoundingClientRect();
    const visible = dragging || rect.bottom > 0 && rect.top < innerHeight;
    canvas.style.visibility = visible ? 'visible' : 'hidden';
    handle.style.visibility = visible && isEnabled() ? 'visible' : 'hidden';
    canvas.dataset.screenTop = bounds.top.toFixed(1);
    canvas.dataset.position = `${badge.position.x.toFixed(3)},${badge.position.y.toFixed(3)}`;
  }
  function settle() {
    entrance=0; entranceVelocity=0; stretch(.7);
    links.forEach((link,i)=> { link.setTranslation({x:0,y:3.4-(i+1)*.7,z:0},true); link.setLinvel(origin,true); link.setAngvel(origin,true); });
    body.setTranslation({x:0,y:-.6,z:0},true); body.setRotation({x:0,y:0,z:0,w:1},true); body.setLinvel(origin,true); body.setAngvel(origin,true);
  }
  function drop() {
    release();
    stretch(.7);
    entrance=(Math.max(0,stage.getBoundingClientRect().top)+stage.clientHeight)/pixelsPerUnit+3;
    entranceVelocity=0;
    links.forEach((link,i)=> { link.setTranslation({x:(i+1)*.45,y:3.4,z:0},true); link.setLinvel(origin,true); link.setAngvel(origin,true); });
    body.setTranslation({x:1.35,y:1.5,z:0},true); body.setRotation({x:0,y:0,z:-.08,w:Math.sqrt(1-.08**2)},true); body.setLinvel(origin,true); body.setAngvel(origin,true);
  }
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0,0,1),0);
  const hitPoint = new THREE.Vector3(), offset = new THREE.Vector3();
  let dragging = false, pointerId = null;
  function ray(event) {
    const rect=canvas.getBoundingClientRect(); pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1); raycaster.setFromCamera(pointer,camera);
  }
  handle.addEventListener('pointerdown', event=> {
    if (!isEnabled() || event.button !== 0) return;
    ray(event); if (!raycaster.intersectObject(card).length) return;
    event.preventDefault(); dragging=true; pointerId=event.pointerId;
    raycaster.ray.intersectPlane(plane,hitPoint); offset.copy(hitPoint).sub(badge.position); offset.y-=entrance;
    body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);
    handle.setPointerCapture(pointerId); handle.style.cursor='grabbing'; canvas.dataset.dragging='true';
  });
  handle.addEventListener('pointermove', event=> {
    ray(event);
    if (!dragging) { canvas.style.cursor=isEnabled() && raycaster.intersectObject(card).length ? 'grab':'auto'; return; }
    if (!raycaster.ray.intersectPlane(plane,hitPoint)) return;
    hitPoint.sub(offset); hitPoint.y-=entrance;
    const length=Math.max(.7,Math.hypot(hitPoint.x,hitPoint.y+1.9-3.4)/3);
    if (Math.abs(length-ropeLength)>.01) stretch(length);
    body.setNextKinematicTranslation({x:hitPoint.x,y:hitPoint.y,z:0}); links.forEach(link=>link.wakeUp());
  });
  function release() {
    if (!dragging) return;
    dragging=false; body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
    if (pointerId !== null && handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
    pointerId=null; handle.style.cursor='grab'; canvas.dataset.dragging='false';
  }
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>handle.addEventListener(type,release));
  handle.addEventListener('keydown',event=>{if(isEnabled() && (event.key==='Enter' || event.key===' ')){event.preventDefault();drop();}});
  let running=false, frame=0, last=0, accumulator=0;
  function render(now) {
    if (!running) return;
    accumulator+=Math.min((now-last)/1000,.05); last=now;
    while(accumulator>=1/60) {
      if (Math.abs(entrance)>.001 || Math.abs(entranceVelocity)>.001) {
        entranceVelocity+=(-90*entrance-17*entranceVelocity)/60;
        entrance+=entranceVelocity/60;
      }
      if (!dragging && ropeLength>.7) stretch(Math.max(.7,ropeLength-(ropeLength-.7)*.06-.001));
      if (!dragging) { const rotation=body.rotation(), velocity=body.angvel(); body.setAngvel({x:velocity.x,y:velocity.y-.25*rotation.y,z:velocity.z},false); }
      world.step(); accumulator-=1/60;
    }
    draw(); frame=requestAnimationFrame(render);
  }
  let pixelsPerUnit=75;
  function layout() {
    const rect=stage.getBoundingClientRect();
    pixelsPerUnit=rect.height/5.9;
    camera.left=-innerWidth/pixelsPerUnit/2; camera.right=-camera.left;
    camera.top=innerHeight/pixelsPerUnit/2; camera.bottom=-camera.top;
    camera.position.set((innerWidth/2-rect.left-rect.width/2)/pixelsPerUnit,(rect.top+rect.height/2-innerHeight/2)/pixelsPerUnit+.1,11);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  }
  function resize() {
    const width=innerWidth, height=innerHeight;
    if (!width || !height) return;
    renderer.setSize(width,height,false); layout(); draw();
  }
  new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize',resize);
  window.addEventListener('scroll',()=>{layout();draw();},{passive:true});
  layout();
  if (!isEnabled()) settle(); else drop();
  setName(''); resize();
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();setRunning(false);host.dataset.renderer='fallback';canvas.style.display='none';handle.style.display='none';});
  canvas.addEventListener('webglcontextrestored',()=>{host.dataset.renderer='webgl';canvas.style.display='';handle.style.display='';resize();setRunning(isEnabled() && !document.hidden);});
  function setRunning(value) {
    cancelAnimationFrame(frame); running=value; canvas.dataset.running=String(value);
    if (!value) { release(); if (!isEnabled()) {settle();draw();} return; }
    last=performance.now(); accumulator=0; frame=requestAnimationFrame(render);
  }
  return {setName,setRunning,drop};
}
