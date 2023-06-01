import { Engine, FollowCamera, Vector3 } from "babylonjs";
import { username, wsClient } from "../connection/connectionClient";
import { windowExists } from "../reactComponents/tools";
import { Player } from "./avatars/classes/heroes/player";
import { Plant } from "./avatars/classes/monsters/plant";

import { initializeInputListeners, inputEffects } from "./avatars/inputListeners";
import { adjustCameraPosition } from "./others/tools";
import { SceneClient } from "./scene/sceneClient";

export var canvas: HTMLCanvasElement;
export var engine: Engine;
export var scene: SceneClient;
export var sphere1: Player | undefined;
export var renderTimeRatio: number = 1;

let doneOnce = false;

export var startRenderLoop = function (engine: Engine) {

  setInterval(() => {
    console.log(engine.getFps().toFixed() + " fps")
    console.log("state: " + sphere1?.shape.position);
  }, 2000)

  engine.runRenderLoop(function () {
    if (scene && scene.activeCamera) {
      scene.render();
      renderTimeRatio = engine.getDeltaTime() / (1000 / 60)
      // console.log(engine.getFps().toFixed() + " fps");
      scene.projectileList.forEach(e => e.update())
      if (sphere1) inputEffects(sphere1)
      if (sphere1) adjustCameraPosition(scene, sphere1)
    }
  })

  engine.resize()

  createHealingPlants()
}

function createHealingPlants() {
  wsClient.plant_list.set("plant1", new Plant(scene, "plant1", new Vector3(2, scene.getHeightAtPoint(2, 2), 2)))
  wsClient.plant_list.set("plant2", new Plant(scene, "plant2", new Vector3(32, scene.getHeightAtPoint(32, 18), 18)))
  wsClient.plant_list.set("plant3", new Plant(scene, "plant3", new Vector3(62, scene.getHeightAtPoint(62, -173), -173)))
  wsClient.plant_list.set("plant4", new Plant(scene, "plant4", new Vector3(10.5, scene.getHeightAtPoint(10.5, -190.3), -190.3)))
  wsClient.plant_list.set("plant5", new Plant(scene, "plant5", new Vector3(336, scene.getHeightAtPoint(336, 129), 129)))
  wsClient.plant_list.set("plant6", new Plant(scene, "plant6", new Vector3(343, scene.getHeightAtPoint(343, 70), 70)))
  wsClient.plant_list.set("plant7", new Plant(scene, "plant7", new Vector3(176, scene.getHeightAtPoint(176, 4), 4)))
  wsClient.plant_list.set("plant8", new Plant(scene, "plant8", new Vector3(145, scene.getHeightAtPoint(145, 491), 491)))
}

var createDefaultEngine = function () { return new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };

export let initFunction = async function () {
  if (doneOnce) return
  doneOnce = true
  canvas = document.getElementById("canvas") as HTMLCanvasElement

  // initChat();

  var asyncEngineCreation = async function () {
    try {
      return createDefaultEngine();
    } catch (e) {
      console.error("the available createEngine function failed. Creating the default engine instead");
      return createDefaultEngine();
    }
  }

  engine = await asyncEngineCreation();
  // engine.displayLoadingUI();
  console.log("Loading screen");

  if (!engine) throw new Error('engine should not be null.');
  //startRenderLoop(engine, canvas);

  let scene = new SceneClient(engine);
  scene.skipPointerMovePicking = true
  //scene.assetManager?.load();
  //Here load all models

  setWindowParams()
  if (windowExists()) initializeInputListeners();
  return scene
};

export function set_my_sphere() {
  sphere1?.dispose();
  console.log("Setting sphere");

  let player_sphere = wsClient.player_list.get(username);
  if (player_sphere) {
    //scene.setActiveCameraByName(player_sphere.cameraAvatar.name)
    sphere1 = player_sphere;

    let cameraBuilder = new FollowCamera(sphere1.name + "Camera", sphere1.shape.position.multiply(new Vector3(1, -1, 1)), scene, sphere1.shape);
    cameraBuilder.rotationOffset = 180;
    // cameraBuilder.maxZ = 100;
    scene.activeCamera = cameraBuilder;
    scene.setPostProcessFilters()
  }
}

export function setScene(e: SceneClient | undefined) {
  if (e === undefined) {
    throw new Error("Undefined Scene")
  } else {
    scene = e
    setWindowParams()
  }
}

function setWindowParams() {
  if (windowExists()) {
    (window as any).playerList = wsClient.player_list;

    // Resize
    (window as any).addEventListener("resize", function () {
      engine.resize();
    });
    (window as any).engine = engine;

    (window as any).scene = scene;
  }
}


