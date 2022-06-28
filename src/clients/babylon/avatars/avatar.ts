import { Color3, Mesh, MeshBuilder, Ray, Scene, StandardMaterial, Vector3 } from "babylonjs";
import { AvaterInterface } from "../../../AvatarInterface";
import { windowExists } from "../../reactComponents/tools";
import { Health, MeshWithHealth } from "../meshWithHealth";
import { ModelEnum } from "../models";
import { shadowGenerator } from "../scene/scene";
import { createLabel } from "../tools";

export class Avatar extends MeshWithHealth implements AvaterInterface {
  speed_coeff: number;
  shape: Mesh | undefined;
  didSomething: Boolean;
  oldPosition: Vector3;
  isJumping: boolean;
  canJump: boolean;
  timeJumping: number;
  lastShoot?: number;
  ray: Ray;
  jumpRay: Ray;
  gravity_acceleration: number;

  constructor(scene: Scene, avatar_username: string, username: string, p?: { bulletDelay?: number, health?: Health }) {
    super(avatar_username, scene, p?.health);

    this.gravity_acceleration = 0;
    let model;
    if (windowExists() && this.name.includes("zombie") && ModelEnum.PumpkinMonster.rootMesh != undefined) {
      model = ModelEnum.PumpkinMonster.rootMesh?.clone();

    } else {
      if (this.name.includes("zombie")) {
        console.log("TODO: Create zombie only after the import of model is finished OR change dynamically the shape when loading done")
      }
      model = MeshBuilder.CreateCylinder(this.name + "sp1", { diameter: 0.5, height: 2 }, scene);
      let queue = MeshBuilder.CreateSphere(this.name + "sp2", { segments: 16, diameter: 0.3 }, scene);

      if (avatar_username !== username) {
        model.checkCollisions = true;
      }
      var myMaterial = new StandardMaterial("myMaterial", scene);

      myMaterial.diffuseColor = new Color3(0.3, 0.5, 1);
      model.material = myMaterial;
      model.parent = this;
      model.addChild(queue)
      queue.position = new Vector3(0, 0, -0.3);
    }

    this.name = avatar_username
    // let sphere = MeshBuilder.CreateCylinder(this.name + "sp1", { diameter: 0.5, height: 2 }, scene);
    // let queue = MeshBuilder.CreateSphere(this.name + "sp2", { segments: 16, diameter: 0.3 }, scene);
    this.addChild(model);

    this.ellipsoid = new Vector3(0.5, 1, 0.5);
    this.checkCollisions = true;

    this.shape = model;

    // sphere.parent = this;
    // this.addChild(sphere)
    // this.addChild(queue)
    // queue.position = new Vector3(0, 0, -0.3);
    // this.sphere = sphere;

    this.speed_coeff = 0.20;
    this.didSomething = false;

    let plane = createLabel(this.name, this);
    this.addChild(plane)


    this.position = new Vector3(0, 1, 0);
    this.oldPosition = this.position.clone();


    this.ray = new Ray(this.position, new Vector3(0, -1, 0), 1.2);
    this.jumpRay = new Ray(this.position, new Vector3(0, 1, 0), 1.2);

    this.isJumping = false;
    this.canJump = true;
    this.timeJumping = 250;

    shadowGenerator?.addShadowCaster(this)
  }
  setRayPosition() {
    throw new Error("Method not implemented.");
  }

  dispose(): void {
    super.dispose()
  }

}