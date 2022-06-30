// Global Variables
let camera, scene, renderer;
let floor, geometry, material, object, floorMesh, light, axes, texture;
let gui;
let stats;

// Controls
let obControl, afControl;

// Rotation Values
let rot_x = 0.01;
let rot_y = 0.02;
let alpha = 0;

// Animation
// 1/ Bounce
let clock = new THREE.Clock();
let time = 0;
let delta = 0;

// Settings
const settings = {
  display: {
    scale: 2,
    autoRotate: false,
    showAxes: true,
  },
  geometry: {
    shape: "cube",
    material: "basic",
  },
  camera: {
    x: 0,
    y: 4,
    z: 17,
    fov: 80,
    near: 0.01,
    far: 3,
  },
  light: {
    enable: true,
    autoRotate: false,
    shadow: true,
    autoMove: false,
    x: 3,
    y: 4,
    z: 0,
  },
  affine: {
    mode: "none",
  },
  animation: {
    type: "none",
    value: 2,
  },
  bonus: {
    text: "Hello World",
    textGeometry: {
      size: 1,
      height: 0.1,
      curveSegments: 1,
    },
  },
};

const init = () => {
  // Setup Camera
  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.1,
    20
  );
  camera.position.set(0, 4, 17);
  scene = new THREE.Scene();

  // Create Main Object
  geometry = new THREE.BoxBufferGeometry(2, 2, 2);
  material = new THREE.MeshPhongMaterial({ color: 0xffff });
  object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = false;
  object.name = "object";

  // floor
  floor = new THREE.PlaneBufferGeometry(32, 32, 32, 32);
  let floorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  floorMesh = new THREE.Mesh(floor, floorMat);
  floorMesh.receiveShadow = true;
  floorMesh.rotation.x = -Math.PI / 2.0;
  floorMesh.name = "floor";
  floorMesh.position.set(0, -5, 0);

  // light
  light = new THREE.PointLight(0xffffff, 4, 200);
  light.name = "light";
  light.position.set(-4, 4, 3.4);
  light.castShadow = true;

  const helper = new THREE.PointLightHelper(light);
  scene.add(helper);

  // axesHelper
  axes = new THREE.GridHelper(100, 2);
  axes.name = "axes";

  // Add Object to Scene
  scene.add(object);
  scene.add(light);
  scene.add(floorMesh);
  scene.add(axes);

  // Create Statistic fps Frame
  stats = new Stats();
  document.body.appendChild(stats.dom);

  // Render Canvas Element
  const canvas = document.querySelector("#canvas");
  renderer = new THREE.WebGLRenderer({ canvas });

  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  // controls
  let controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 1;
  controls.minDistance = 1;
  controls.maxDistance = 10;

  afControl = new THREE.TransformControls(camera, renderer.domElement);
  afControl.addEventListener("change", () => {
    renderer.render(scene, camera);
  });
  afControl.addEventListener("dragging-changed", (event) => {
    controls.enabled = !event.value;
  });

  //afControl.attach(mesh);
  scene.add(afControl);
  window.addEventListener("resize", onWindowResize, false);
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

const render = () => {
  requestAnimationFrame(render);

  if (settings["display"].autoRotate === true) {
    object.rotation.x += 0.02;
    object.rotation.y += 0.02;
  }

  if (settings["light"].autoRotate === true) {
    alpha = Math.PI * 0.005 + alpha;
    let new_x = Math.sin(alpha) * 3;
    let new_z = Math.cos(alpha) * 3;

    light.position.set(new_x, light.position.y, new_z);
    if (alpha == 2 * Math.PI) alpha = 0;
  }

  if (settings["animation"].type === "bounce") {
    delta = clock.getDelta();
    time += delta;
    object.rotation.x = time * 4;
    object.position.y =
      2 +
      floorMesh.position.y +
      settings["animation"].value +
      Math.abs(Math.sin(time * 3)) * 2;
    object.position.z = Math.cos(time) * 4;
    renderer.render(scene, camera);
    stats.update();
  } else if (settings["animation"].type === "circle") {
    delta = clock.getDelta();
    time += delta;
    object.position.x = settings["animation"].value * Math.cos(time) + 0;
    object.position.z = settings["animation"].value * Math.sin(time) + 0;
    renderer.render(scene, camera);
    stats.update();
  } else {
    renderer.render(scene, camera);
    stats.update();
  }
};

const Cockpit = () => {
  // Init Control Table
  gui = new dat.GUI();
  const placeHolder = {
    textField: "Image URL ",
  };

  // 1/ Display Control (Scale - Show Axes - Auto Rotate)
  control = gui.addFolder("Display");
  control.add(settings["display"], "scale", 0.1, 4, 0.05).onChange(() => {
    object.scale.set(
      settings["display"].scale,
      settings["display"].scale,
      settings["display"].scale
    );
  });

  control.add(settings["display"], "showAxes").onChange(() => {
    axes.visible = !!settings["display"].showAxes;
  });

  control.add(settings["display"], "autoRotate");

  // 2/ Geometry, Materials Selection
  control = gui.addFolder("Geometry");
  control
    .add(settings["geometry"], "shape", [
      "cube",
      "sphere",
      "cone",
      "cylinder",
      "wheel",
      "teapot",
    ])
    .onChange(handleGeometry);

  control
    .add(settings["geometry"], "material", [
      "basic",
      "point",
      "lines",
      "solid",
      // "pink",
      // "yellow",
      // "purple",
    ])
    .onChange(handleMaterial);

  control.add(placeHolder, "textField").onFinishChange((value) => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "Anonymous";
    texture = loader.load(String(value));
    console.log(value);
    material = new THREE.MeshBasicMaterial({
      map: texture,
    });
    material.needsUpdate = true;
    updateObject(geometry, material);
  });

  // 3/ Camera Control: x, y, z, field of view, near, far
  control = gui.addFolder("Camera");
  control.add(settings["camera"], "x", -50, 50, 0.05).onChange(() => {
    camera.position.x = settings["camera"].x;
  });
  control.add(settings["camera"], "y", -50, 50, 0.05).onChange(() => {
    camera.position.y = settings["camera"].y;
  });
  control.add(settings["camera"], "z", -50, 50, 0.05).onChange(() => {
    camera.position.z = settings["camera"].z;
  });
  control.add(camera, "fov", 1, 180, 0.1).onChange(() => {
    camera.updateProjectionMatrix();
  });
  control.add(camera, "near", 0.1, 10, 0.1).onChange(() => {
    camera.updateProjectionMatrix();
  });
  control.add(camera, "far", 0.1, 150, 0.1).onChange(() => {
    camera.updateProjectionMatrix();
  });

  // 4/ Affine Transform
  control = gui.addFolder("Affine Transform");
  control
    .add(settings["affine"], "mode", ["none", "translate", "scale", "rotate"])
    .onChange(handleAffineTransform);

  // 5/ Light Control
  control = gui.addFolder("Light Control");
  control.addColor(new ColorGUIHelper(light, "color"), "value").name("color");
  control.add(settings["light"], "enable").onChange(() => {
    light.visible = !!settings["light"].enable;
  });
  control.add(settings["light"], "autoRotate");
  control.add(light, "decay", 0, 4, 0.01);
  control.add(light, "power", 0, 150);
  control.add(settings["light"], "x", -50, 50, 0.1).onChange(() => {
    light.position.x = settings["light"].x;
  });
  control.add(settings["light"], "y", -50, 50, 0.1).onChange(() => {
    light.position.y = settings["light"].y;
  });
  control.add(settings["light"], "z", -50, 50, 0.1).onChange(() => {
    light.position.z = settings["light"].z;
  });

  control = gui.addFolder("Animation");
  control.add(settings["animation"], "type", ["bounce", "circle"]);
  control.add(settings["animation"], "value", -10, 10, 0.1);

  control = gui.addFolder("Bonus");
  control.add(settings["bonus"], "text").onChange(textGeometryGenerate);
  control
    .add(settings["bonus"].textGeometry, "size", -5, 5, 0.1)
    .onChange(textGeometryGenerate);
  control
    .add(settings["bonus"].textGeometry, "height", -5, 5, 0.1)
    .onChange(textGeometryGenerate);
  control
    .add(settings["bonus"].textGeometry, "curveSegments", -5, 5, 0.1)
    .onChange(textGeometryGenerate);
  control
    .add(settings["geometry"], "material", [
      "basic",
      "point",
      "lines",
      "solid",
      // "pink",
      // "yellow",
      // "purple",
    ])
    .onChange(handleMaterial);

  control.add(placeHolder, "textField").onFinishChange((value) => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "Anonymous";
    texture = loader.load(String(value));
    console.log(value);
    material = new THREE.MeshBasicMaterial({
      map: texture,
    });
    material.needsUpdate = true;
    updateObject(geometry, material);
  });
};

// Geometry: Cube, Sphere, Cone, Cylinder, Wheel, Teapot
const handleGeometry = () => {
  switch (settings["geometry"].shape) {
    case "cube":
      geometry = new THREE.BoxBufferGeometry(2, 2, 2);
      break;
    case "sphere":
      geometry = new THREE.SphereBufferGeometry(1.5, 100, 100);
      break;
    case "cone":
      geometry = new THREE.ConeBufferGeometry(2, 2, 20, 20);
      break;
    case "cylinder":
      geometry = new THREE.CylinderBufferGeometry(1.5, 1.5, 2, 20, 20);
      break;
    case "wheel":
      geometry = new THREE.TorusBufferGeometry(1, 0.5, 20, 20);
      break;
    case "teapot":
      geometry = new THREE.TeapotBufferGeometry(
        1,
        true,
        true,
        true,
        true,
        true
      );
      break;

    default:
      geometry = new THREE.BoxBufferGeometry(2, 2, 2);
      break;
  }
  updateObject(geometry, material);
};

// Material: Point, Lines, Solid
const handleMaterial = () => {
  switch (settings["geometry"].material) {
    case "basic":
      material = new THREE.MeshPhongMaterial({ color: 0xffff });
      break;
    case "point":
      material = new THREE.PointsMaterial({
        color: 0xffff,
        size: 0.1,
      });
      break;
    case "lines":
      material = new THREE.MeshNormalMaterial();
      material.wireframe = true;
      break;
    case "solid":
      material = new THREE.MeshNormalMaterial();
      break;
    case "pink":
      texture = new THREE.TextureLoader();
      material = new THREE.MeshBasicMaterial({
        map: texture.load("./texutres/pink-flower.jpg"),
      });
      break;
    case "yellow":
      texture = new THREE.TextureLoader();
      material = new THREE.MeshBasicMaterial({
        map: texture.load("./texutres/yellow-flower.jpg"),
      });
      break;
    case "purple":
      texture = new THREE.TextureLoader();
      material = new THREE.MeshBasicMaterial({
        map: texture.load("./texutres/purple-flower.jpg"),
      });
      break;
  }
  geometry.center();
  updateObject(geometry, material);
};

// Affine: Translate, Scale, Rotate
const handleAffineTransform = () => {
  switch (settings["affine"].mode) {
    case "none":
      console.log(settings["affine"]);
      console.log("detached");
      afControl.detach();
      break;
    case "translate":
      console.log("translate");
      afControl.setMode("translate");
      afControl.attach(object);
      break;
    case "rotate":
      afControl.setMode("rotate");
      afControl.attach(object);
      break;
    case "scale":
      afControl.setMode("scale");
      afControl.attach(object);
      break;
  }
};

// Bonus
const textGeometryGenerate = () => {
  const loader = new THREE.FontLoader();

  loader.load("fonts/helvetiker_regular.typeface.json", (font) => {
    geometry = new THREE.TextGeometry(settings["bonus"].text, {
      font: font,
      ...settings["bonus"].textGeometry,
    });
  });
  console.log(geometry);
  geometry.center();
  updateObject(geometry, material);
};

// Utilities (clearObject, updateObject)
const clearObject = () => {
  scene.children = scene.children.filter(
    (element) => element.name !== "object"
  );
};

const updateObject = (newShape, newMaterial) => {
  clearAffineTransform();
  clearObject();

  object = new THREE.Mesh(newShape, newMaterial);
  if (settings["geometry"].material === "point") {
    object = new THREE.Points(newShape, newMaterial);
  }
  if (settings["light"].shadow === true) {
    object.castShadow = true;
    object.receiveShadow = false;
  }
  object.name = "object";
  scene.add(object);
};

const clearAffineTransform = () => {
  afControl.detach();
  settings["affine"].mode = "none";
};

class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return `#${this.object[this.prop].getHexString()}`;
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}

// Main
const main = () => {
  init();
  render();
  Cockpit();
};

main();
