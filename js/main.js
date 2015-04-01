var camera, scene, renderer;
var effect, controls;
var element, container;
var box;
var textMesh;

var world = null;

var clock = new THREE.Clock();

var isleft = false;
var isright = false;
var isup = false;
var isdown = false;
var direction = 0;

window.addEventListener("keydown", function(e) {
if (e.keyCode == 37) {  // left key
  isleft = true;
}
if(e.keyCode == 38) { // up key
  isup = true;
}
if(e.keyCode == 39) { // right key
  isright = true;
}
if(e.keyCode == 40) { // down key
  isdown = true;
}
});
window.addEventListener("keyup", function(e) {
if (e.keyCode == 37) {  // left key
  isleft = false;
} 
if(e.keyCode == 38) { // up key
  isup = false;
} 
if(e.keyCode == 39) { // right key
  isright = false;
} 
if(e.keyCode == 40) { // down key
  isdown = false;
}

});

var StartDate;
var StageData;
var CarData;
window.addEventListener('DOMContentLoaded', function() {
  StartDate = Date.now();
  var XMLHttp = new XMLHttpRequest();
  XMLHttp.open("GET", "stage/1.json", false);
  XMLHttp.send(null);
  StageData = JSON.parse(XMLHttp.responseText);
  XMLHttp.open("GET", "car/" + localStorage.getItem("car") + ".json", false);
  XMLHttp.send(null);
  CarData = JSON.parse(XMLHttp.responseText);
  handling = CarData.handling;
  maxspeed = CarData.maxspeed;
  acceleration = CarData.acceleration;
  brake = CarData.brake;
  tire = CarData.tire;

  initCannon();
  initThree();
  animateScene();
});

function initThree() {
  initScene();
  initRenderer();
  //initControls();

  window.addEventListener('resize', onWindowResize, false);
  onWindowResize();

}

function initRenderer() {
  // レンダラーを作成する
  // renderer = new THREE.WebGLRenderer({});

  // // レンダラーを HTML 上に設置する
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(800, 600);
  renderer.setClearColor(0x000000, 1);

      initShadow();

  document.body.appendChild(renderer.domElement);
  renderer.render(scene, camera);
  element = renderer.domElement;
  container = document.getElementById('tutorial');
  container.appendChild(element);

  effect = new THREE.StereoEffect(renderer);
}

function initShadow() {
  // light.castShadow = true;
  // mesh.castShadow = true;
  // mesh.receiveShadow = true;
  // viewPlane.receiveShadow = true;
  // viewPlane.castShadow = true;
  // renderer.shadowMapEnabled = true;
  //   renderer.shadowMapType = THREE.PCFShadowMap;

}
function initCannon() {
  //Cannonの世界を生成
  world = new CANNON.World();

  //重力を設定
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.NaiveBroadphase();

  world.solver.iterations = 10;
  world.solver.tolerance = 0.1;

  //地面用にPlaneを生成
  // var plane = new CANNON.Plane();

  // //Planeの剛体を質量0で生成する
  // ground= new CANNON.Body({
  //   mass: 0,
  //   sha
  var groundMat = new CANNON.Material('groundMat');

  var carMat = new CANNON.Material('cubeMat');

  phyPlane = new CANNON.Body({mass: 0, material: groundMat});
  phyPlane.position.x = 0;
  phyPlane.position.y = 0;
  phyPlane.position.z = 0;

  phyPlane.addShape(new CANNON.Plane());
  phyPlane.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
  //ground.addShape(plane);
  //X軸に90度（つまり地面）に回転
  // ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  // world.add(ground);
  world.add(phyPlane);
  //Boxのシェイプを生成
  var cubeSize = 1;
  //shape = new CANNON.Box(new CANNON.Vec3(cubeSize, cubeSize, cubeSize));

  //質量は1
  var mass = 1;
  body = new CANNON.Body({
  mass: 1000, // kg
  //position: new CANNON.Vec3(0, 10,0), // m
  //shape: shape
  material: carMat
  });
  body.addShape(new CANNON.Sphere(1));
  body.position.y = 2;
  body.position.x = -100;
  body.position.z = -5;
  // Z軸に10の角速度を設定
  //body.angularVelocity.set(0, 0, 10);
  // 減衰率
  body.angularDamping = 1;
  //Z軸に10の角速度を設定
  // body.angularVelocity.set(0, 0, 10);
  // body.angularDamping = 0.1;
  world.add(body);
  var CM = new CANNON.ContactMaterial(
    groundMat,carMat,{
    friction: 0,
    restitution: 0  
  });

  world.addContactMaterial(CM);

}

var BlockGeom = new THREE.Geometry();
function createBlock(x, y, z) {
  // CANNON.js
  var block1 = new CANNON.Body({ mass:0, position: new CANNON.Vec3(x,y,z)});
  block1.addShape(new CANNON.Box(new CANNON.Vec3(2,2,2)));
  //block1.quaternion.set(0,r,0);
  world.add(block1);

  // THREE.js
  var block1_ = new THREE.Mesh(
    new THREE.BoxGeometry(2*2,2*2,2*2)/*,
    new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/crate.gif")
    })*/
  );
// var block1_ = new THREE.BoxGeometry(2*2, 2*2, 2*2);
  block1_.position.set(x,y,z);
  //THREE.GeometryUtils.merge(BlockGeom, block1_);
  block1_.updateMatrix();
  BlockGeom.merge(block1_.geometry, block1_.matrix);
  //scene.add(block1_);
}
function addBlock() {
  var b = new THREE.Mesh(BlockGeom, new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/crate.gif")}));
  b.castShadow = true;
  scene.add(b);
}
function createSlope(x,y,z,r) {

  // CANNON.js
  var block1 = new CANNON.Body({ mass:0, position: new CANNON.Vec3(x,y,z)});
  block1.addShape(new CANNON.Box(new CANNON.Vec3(3, 0.5, 4)));
  var q = new CANNON.Quaternion();
  q.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 8);
  var q2 = new CANNON.Quaternion();
  q2.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
  block1.quaternion = q;
  world.add(block1);

  // THREE.js
  var block1_ = new THREE.Mesh(
    new THREE.BoxGeometry(3*2,0.5*2,4*2),
    new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/brick_diffuse.jpg")
    })
  );
  block1_.position.set(x,y,z);
  block1_.rotation.set(0, 0, Math.PI / 8);
  block1_.castShadow = true;
  scene.add(block1_);
}
function initScene() {
// シーンを作成する
scene = new THREE.Scene();

// // 軸を表示する
// var axis = new THREE.AxisHelper(1000);
// scene.add(axis);

// カメラを作成する
camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
//camera = new THREE.PerspectiveCamera(30, 800 / 600, 1, 10000);
//camera.position.set(0, 30, 0);
camera.position.set(Math.cos(Math.PI / 5) * 30, 5, Math.sin(Math.PI / 5) * 30);
//camera.lookAt(new THREE.Vector3(0,0,0));
scene.add(camera);

// 光を作成する
light = new THREE.HemisphereLight(0x999999, 0x777777, 1);
//light = new THREE.DirectionalLight(0x999999, 1);
light.position.set(0, 100, 0);
scene.add(light);

// テクスチャを定義しておく
// var texture = THREE.ImageUtils.loadTexture(
//   'textures/Park2/negx.jpg'
// );
// texture.wrapS = THREE.RepeatWrapping;       // 繰り返しの設定(X)
// texture.wrapT = THREE.RepeatWrapping;       // 繰り返しの設定(Y)
// texture.repeat = new THREE.Vector2(50, 50); // 繰り返し間隔の設定

// 地面を追加する

// var texture1 = THREE.ImageUtils.loadTexture(
//   'textures/brick_diffuse.jpg'
//   );
// texture1.wrapS = THREE.RepeatWrapping;
// texture1.wrapT = THREE.RepeatWrapping;
// texture1.repeat = new THREE.Vector2(50,50);
   // var materials =  [new THREE.MeshBasicMaterial({
   //    map: THREE.ImageUtils.loadTexture("textures/skybox/px.jpg"),
   //    side: THREE.BackSide
   //  }),new THREE.MeshBasicMaterial({
   //    map: THREE.ImageUtils.loadTexture("textures/skybox/nx.jpg"),
   //    side: THREE.BackSide
   //  }),new THREE.MeshBasicMaterial({
   //    map: THREE.ImageUtils.loadTexture("textures/skybox/py.jpg"),
   //    side: THREE.BackSide
   //  }),new THREE.MeshBasicMaterial({
   //    map: THREE.ImageUtils.loadTexture("textures/skybox/ny.jpg"),
   //    side: THREE.BackSide
   //  }),new THREE.MeshBasicMaterial({
   //    map: THREE.ImageUtils.loadTexture("textures/skybox/pz.jpg"),
   //    side: THREE.BackSide
   //  }),new THREE.MeshBasicMaterial({
   //    map: THREE.ImageUtils.loadTexture("textures/skybox/nz.jpg"),
   //    side: THREE.BackSide
   //  })];
   var materials =  [new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/sunny/Sunny2_front.png"),
      side: THREE.BackSide
    }),new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/sunny/Sunny2_back.png"),
      side: THREE.BackSide
    }),new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/sunny/Sunny2_up.png"),
      side: THREE.BackSide
    }),new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/sunny/Sunny2_down.png"),
      side: THREE.BackSide
    }),new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/sunny/Sunny2_right.png"),
      side: THREE.BackSide
    }),new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("textures/sunny/Sunny2_left.png"),
      side: THREE.BackSide
    })];

  box =  new THREE.Mesh(
    new THREE.BoxGeometry(500,500,500),
    new THREE.MeshFaceMaterial(materials)
  );
  box.position.set(0, 0, 0);
  scene.add(box);

viewPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshBasicMaterial({map:THREE.ImageUtils.loadTexture("textures/course2.png")})
  );
viewPlane.rotation.x = -Math.PI/2;
viewPlane.position.y = 1/2;
scene.add(viewPlane);

mesh = new THREE.Object3D();
town = new THREE.JSONLoader() 
town.load('model/' + CarData.car, function(geometry,m) {
  mesh = new THREE.Mesh(geometry,
   // new THREE.MeshNormalMaterial()
   new THREE.MeshFaceMaterial(m)
   );
  mesh.scale = new THREE.Vector3(1,1,1);
  mesh.position.y = 10;
  mesh.position.x = 10;
  //geometry.materials[0].ambient = geometry.materials[0].color;
  scene.add(mesh);

});

// mesh = new THREE.Mesh(
//   new THREE.SphereGeometry(1),
//   new THREE.MeshBasicMaterial()
// );
// scene.add(mesh);
// sphere = new THREE.Mesh(
//   new THREE.SphereGeometry(5,20,20),
//   new THREE.MeshPhongMaterial({
//     color: "yellow"
//   })
// );
// sphere.position.set(6,6,6);
// scene.add(sphere);


camera.position.set(-5,10,5); 

// var light = new THREE.HemisphereLight(0x999999, 0x777777, 0.6);
// light.position.set(0,100,0).normalize();
// light.castShadow = true;
// scene.add(light);

  // サーキット
  for (var i = 0; i < StageData.blocks.length; i++) {
    if (StageData.blocks[i][2]) {
      createSlope(StageData.blocks[i][0], 1, StageData.blocks[i][1], StageData.blocks[i][2]);
    } else {
      createBlock(StageData.blocks[i][0], 2, StageData.blocks[i][1]);
    }
  }
  for (i = -150; i < 150; i += 299) {
    for (var j = -150; j < 150; j += 4) {
      createBlock(i, 2, j);
    }
  }
  for (i = -150; i < 150; i += 299) {
    for (j = -150; j < 150; j += 4) {
      createBlock(j, 2, i);
    }
  }
  addBlock();
  // createBlock(4,2,4);
  // createBlock(4,2,8);
  // createBlock(4,2,12);
  // createBlock(4,2,16);
  // createBlock(4,2,20);
  // createBlock(4,2,24);
  // createBlock(-2,2,24);
  // createBlock(-6,2,24);
  // createBlock(-10,2,24);
  // createBlock(-14,2,24);
  // createBlock(-18,2,24);
  // createBlock(-22,2,24);
  // createBlock(-26,2,24);
  // createBlock(-30,2,24);
  // createBlock(-34,2,24);
  // createBlock(-38,2,24);
  // createBlock(-38,2,22);
  // createBlock(-38,2,8);
  // createBlock(-38,2,4);
  // createBlock(-42,2,2);
  // createBlock(-44,2,2);
  // createBlock(-48,2,2);

  // createBlock(-22,2,24);
  // createBlock(-22,2,8);
  // createBlock(-22,2,4);
  // createBlock(-22,2,0);
  // createBlock(-22,2,-4);
  // createBlock(-22,2,-8);
  // createBlock(-22,2,-22);
  // createBlock(-22,2,-24);
  // createBlock(-26,2,-24);
  // createBlock(-32,2,-24);
  // createBlock(-36,2,-24);
  // createBlock(-38,2,-24);
  // createBlock(-42,2,-24);
  // createBlock(-42,2,-24);
  // createBlock(-44,2,-24);
  // createBlock(-46,2,-24);
  // createBlock(-48,2,-24);
  // createBlock(-52,2,-24);
  // createBlock(-52,2,-24);
  // createBlock(-54,2,-24);
  // createBlock(-56,2,-24);
  // createBlock(-58,2,-24);
  // createBlock(-62,2,-24);
  // createBlock(-62,2,-22);
  // createBlock(-62,2,-22);
  // createBlock(-62,2,-8);
  // createBlock(-62,2,-6);
  // createBlock(-62,2,-4);
  // createBlock(-62,2,-2);
  // createBlock(-62,2,2);
  // createBlock(-62,2,2);
  // createBlock(-62,2,4);
  // createBlock(-62,2,6);
  // createBlock(-62,2,8);
  // createBlock(-62,2,22);
  // createBlock(-62,2,22);
  // createBlock(-62,2,24);
  // createBlock(-62,2,26);
  // createBlock(-62,2,28);
  // createBlock(-62,2,22);

  // ゴールのあたり判定
  //createBlock(90, 1, 0);
  //createBlock(130, 1, 0);
  // createBlock(3,3,3);
  // createBlock(-110, 2, 0);

  //   var block1 = new CANNON.Body({ mass:0, position: new CANNON.Vec3(-110, 2, 0)});
  // block1.addShape(new CANNON.Box(new CANNON.Vec3(2,2,2)));
  // //block1.quaternion.set(0,r,0);
  // world.add(block1);
  // block1_test = new THREE.Mesh(
  //   new THREE.BoxGeometry(2*2,2*2,2*2),
  //   new THREE.MeshBasicMaterial({
  //     map: THREE.ImageUtils.loadTexture("textures/crate.gif")
  //   })
  // );
  // block1_test.position.set(-110, 1, 0);
  // scene.add(block1_test);

  // blocktest = new THREE.Mesh(
  //   new THREE.BoxGeometry(40, 1, 1),
  //   new THREE.MeshBasicMaterial()
  // );
  // blocktest.position.set(-90, 2, 0);
  // scene.add(blocktest);
  ray = new THREE.Raycaster(new THREE.Vector3(-90, 1, 0), new THREE.Vector3(-1, 0, 0));
  ray2 = new THREE.Raycaster(new THREE.Vector3(90, 1, 0), new THREE.Vector3(1, 0, 0));
// var geometry = new THREE.Geometry();
//       geometry.vertices.push(new THREE.Vector3(-90, 1, 0));
//       geometry.vertices.push(new THREE.Vector3(-130, 1, 0));
//   var rayline = new THREE.Line(geometry, new THREE.LineBasicMaterial({ linewidth: 5, color: "purple"}));
//   scene.add(rayline);
  //scene.add(ray);
//正面マテリアルの生成
 var materialFront = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

//側面マテリアルの生成
 var materialSide = new THREE.MeshBasicMaterial( { color: 0x000088 } );
materialArray = [ materialFront, materialSide ];

//テキスト
//  textGeom = new THREE.TextGeometry( "Time: 00:00", 
//         {
//                 size: 5, height: 2, curveSegments: 3,
//                 font: "helvetiker", weight: "normal", style: "normal",
//                 bevelThickness: 1, bevelSize: 0, bevelEnabled: true,
//                 material: 0, extrudeMaterial: 1
//         });
        
//         var textMaterial = new THREE.MeshFaceMaterial(materialArray);
//         textMesh = new THREE.Mesh(textGeom, textMaterial );
//         textMesh.position.set(-80, 5, 0);
//         textMesh.rotation.y = THREE.Math.degToRad(180);
// //シーンオブジェクトに追加      
//         scene.add(textMesh);      
CreateText('Time: 00:00');
      }
function CreateText(text) {
  if (textMesh) {
        scene.remove(textMesh);
                textMesh = 'undefined';
    // textMesh.geometry.dispose();
    // textMesh.material.materials[0].dispose();
    // textMesh.material.materials[1].dispose();

  }
 textGeom = new THREE.TextGeometry( text, 
        {
                size: 5, height: 2, curveSegments: 3,
                font: "helvetiker", weight: "normal", style: "normal",
                bevelThickness: 1, bevelSize: 0, bevelEnabled: true,
                material: 0, extrudeMaterial: 1
        });
        
        var textMaterial = new THREE.MeshFaceMaterial(materialArray);
        textMesh = new THREE.Mesh(textGeom, textMaterial );
        textMesh.position.set(-80, 5, 50);
        textMesh.rotation.y = THREE.Math.degToRad(180);
//シーンオブジェクトに追加      
  scene.add(textMesh);      
}
function initControls() {
// 操作を設定する
controls = new THREE.OrbitControls(camera, element);
// カメラの設定
controls.rotateUp(Math.PI / 4);
controls.target.set(
  camera.position.x + 0.1,
  camera.position.y,
  camera.position.z
  );
controls.noZoom = true;
controls.noPan = true;
}
// スマホ操作を設定する
function setOrientationControls(e) {
  if (!e.alpha) {
    return;
  }
  controls = new THREE.DeviceOrientationControls(camera, true);
  controls.connect();
  controls.update();
  element.addEventListener('click', fullscreen, false);
  window.removeEventListener('deviceorientation', setOrientationControls, true);
}
window.addEventListener('deviceorientation', setOrientationControls, true);


function updateCamera() {
  camera.updateProjectionMatrix();
}

function updateControls(dt) {
  controls.update(dt);
}

function updateRenderer(dt) {
  if (effect) {
    effect.render(scene, camera);
  } else {
    renderer.render(scene, camera);
  }
}
var timeStep = 1/60;

var ez = 0;
var prevez = 0;
var speed = 0;
var intersectCount = -1;
var timeChangeCount = 0;
var isGoal = false;
var isCheckerFlag = false;
var lap = 0;

var handling = 2; // ハンドリング
var maxspeed = 100; // 最高速度
var acceleration = 0.5; // 加速
var brake = 2; // ブレーキ
var tire = 0.1; // タイヤ : アクセルをしないと減るスピード
function animateScene(t) {
  // animateScene 関数を毎フレーム呼び出す
  requestAnimationFrame(animateScene);
  world.step(timeStep);
  //updateCamera();
  //updateControls(clock.getDelta());
  updateRenderer(clock.getDelta());

  // 時間の表示
  timeChangeCount++;
  if (timeChangeCount == 10 && !isGoal) {
    timeChangeCount = 0;
    CreateText("Time:" + (Math.floor(((Date.now() - StartDate) / 10)) / 100).toString());
  }
  //ChangeTime(sec);
  // timeElem.textContent = sec.toString();
   if (isGoal) {
    // if (speed > 20) speed = 20;
    // else speed += 0.3;
    speed = 0;
  } else if (isup) {
    //if (ez < 0.5) ez += 0.01;
    if (speed < maxspeed) speed += acceleration;
  } 
  else if (isdown) {
    //if (ez > -0.5) ez -= 0.01;
    if (speed > 0) speed -= brake;
    else speed = 0
  } else {
    if (speed > 0) speed -= tire;
  }
  if (isleft) {
    direction += handling;
  } 
  if (isright) {
    direction -= handling;
  }
    mesh.castShadow = true;
    var angle = (direction) * Math.PI / 180; // ラジアンへ 円周率÷180
    body.velocity.set(Math.sin(angle) * speed,body.velocity.y,Math.cos(angle) * speed);
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
    mesh.rotation.y = THREE.Math.degToRad(direction);

  frontVec = new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));
  var frontPosX3 = frontVec.clone().multiplyScalar(3);
  var frontNegX3 = frontVec.clone().multiplyScalar(-10);
  var lookAtPos = mesh.position.clone().add(frontPosX3);
  var cameraPos = mesh.position.clone().add(frontNegX3);
  camera.position.set(cameraPos.x,cameraPos.y + 6,cameraPos.z);
  camera.lookAt( lookAtPos);

  var obj = ray.intersectObjects([mesh]);
  // if (intersectCount === -1) {
  //   intersectCount = obj.length;
  // } else {
    if (obj.length > 0) {
      if (!isCheckerFlag) {
        isCheckerFlag = true;
        lap++;
        if (lap === 4) {
          isGoal = true;
          CreateText("GOAL!!: " + (Math.floor(((Date.now() - StartDate) / 10)) / 100).toString());
        }
      } 
    }
  var obj2 = ray2.intersectObjects([mesh]);
  // if (intersectCount === -1) {
  //   intersectCount = obj.length;
  // } else {
    if (obj2.length > 0) {
      if (isCheckerFlag) {
        isCheckerFlag = false;
      } 
    }
  // }
}

function onWindowResize() {
// ウィンドウサイズを求める
var width = container.offsetWidth;
var height = container.offsetHeight;
console.log('width : ' + width, 'height : ' + height);

// ウィンドウサイズに合わせてカメラを更新する
camera.aspect = width / height;
updateCamera();
// ウィンドウサイズに合わせてレンダラーを更新する
if (effect) {
  effect.setSize(width, height);
} else {
  renderer.setSize(width, height);
}
}

function fullscreen() {
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  }
}

