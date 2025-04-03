// Core Three.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(40, 40, 40);
const target = new THREE.Vector3(0, 20, 0);
camera.lookAt(target);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  physicallyCorrectLights: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5; // Reduced exposure (default was 1.0)
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById("threejs-container").appendChild(renderer.domElement);

const clock = new THREE.Clock();

const loader = new THREE.GLTFLoader();
const loadingContainer = document.getElementById("loading-container");
const threejsContainer = document.getElementById("threejs-container");

// Track loading status
let templeLoaded = false;
let birdsLoaded = false;

// Animation Mixer Variable
let mixer;

// Function to check if both models are loaded
function checkLoadingComplete() {
  if (templeLoaded && birdsLoaded) {
    loadingContainer.style.display = "none"; // Hide loading wheel
    threejsContainer.classList.add("loaded"); // Show Three.js container
  }
}

// Load Static Temple Model
let templeModel;
loader.load(
  "assets/3D Models/raja_rani_temple8_coconut_trees_lawn_trees_buildings_added.glb",
  (gltf) => {
    templeModel = gltf.scene;
    scene.add(templeModel);

    const box = new THREE.Box3().setFromObject(templeModel);
    const center = box.getCenter(new THREE.Vector3());
    templeModel.position.sub(center);
    templeModel.scale.set(1, 1, 1);
    templeModel.position.set(0, 0, 0);

    templeModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.envMap = scene.environment;
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    });

    templeLoaded = true;
    checkLoadingComplete();
  },
  (progress) => {
    // console.log(
    //   `Loading temple: ${((progress.loaded / progress.total) * 100).toFixed(
    //     2
    //   )}%`
    // );
  },
  (error) => {
    console.error("Temple loading failed:", error);
  }
);

// Load Animated Birds Model
let birdsModel;
loader.load(
  "assets/3D Models/konark-sun-temple_animated1.glb",
  (gltf) => {
    birdsModel = gltf.scene;
    scene.add(birdsModel);
    birdsModel.position.set(0, 1, 0);

    birdsModel.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.envMap = scene.environment;
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    });

    mixer = new THREE.AnimationMixer(birdsModel);
    const animations = gltf.animations;
    if (animations && animations.length > 0) {
      animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
      });
    } else {
      console.log("No animations found in birds_animated.glb.");
    }

    birdsLoaded = true;
    checkLoadingComplete();
  },
  (progress) => {
    console.log(
      `Loading birds Model: ${(
        (progress.loaded / progress.total) *
        100
      ).toFixed(2)}%`
    );
  },
  (error) => {
    console.error("Birds loading failed:", error);
  }
);

// HDRI Environment Setup
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.setDataType(THREE.FloatType);
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/syferfontein_1d_clear_puresky_2k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
  },
  undefined,
  (error) => {
    console.error("HDRI loading failed:", error);
  }
);

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 12);
directionalLight.castShadow = true;
// directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
// directionalLight.shadow.camera.left = -100;
// directionalLight.shadow.camera.right = 100;
// directionalLight.shadow.camera.top = 100;
// directionalLight.shadow.camera.bottom = -200;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(-10, 10, -12);
// directionalLight.castShadow = true;
// directionalLight.shadow.mapSize.set(1024, 1024);
// directionalLight.shadow.camera.near = 0.1;
// directionalLight.shadow.camera.far = 50;
// directionalLight.shadow.camera.left = -20;
// directionalLight.shadow.camera.right = 20;
// directionalLight.shadow.camera.top = 20;
// directionalLight.shadow.camera.bottom = -20;
// directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight2);

// Add linear fog
scene.fog = new THREE.Fog(0x625653, 90, 200);

// Orbit Controls Configuration
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 50;
controls.minPolarAngle = Math.PI / 12;
controls.maxPolarAngle = Math.PI / 2 - Math.PI / 12;

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  // if (grassStuff) grassStuff.update();
  controls.update();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  renderer.render(scene, camera);
}

// Initialize everything
// createPlayer();
// addGrassPatches();
animate();

// Window Resize Handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Camera View Transition Function
function setCameraView(position, target) {
  gsap.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration: 1.5,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(target);
      controls.target.copy(target);
      controls.update();
    },
  });
  controls.autoRotate = false;
}

// Button Event Listeners
// const maxDim = 14;
// document.getElementById("wheelView").addEventListener("click", () => {
//   setCameraView(
//     new THREE.Vector3(0, maxDim * 0.5, maxDim * 1.2),
//     new THREE.Vector3(0, 0, 0)
//   );
// });

// document.getElementById("topView").addEventListener("click", () => {
//   setCameraView(
//     new THREE.Vector3(0, maxDim * 4, 0),
//     new THREE.Vector3(0, 0, 0)
//   );
// });

// document.getElementById("frontView").addEventListener("click", () => {
//   setCameraView(
//     new THREE.Vector3(0, maxDim * 0.8, maxDim * 2),
//     new THREE.Vector3(0, 0, 0)
//   );
// });

// document.getElementById("sideView").addEventListener("click", () => {
//   setCameraView(
//     new THREE.Vector3(maxDim * 2, maxDim * 0.8, 0),
//     new THREE.Vector3(0, 0, 0)
//   );
// });

// // Mouse movement for player control
// window.addEventListener("pointermove", (event) => {
//   pointer.set(
//     (event.clientX / window.innerWidth) * 2 - 1,
//     -(event.clientY / window.innerHeight) * 2 + 1
//   );
// });
