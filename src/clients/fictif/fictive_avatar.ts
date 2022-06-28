import { Color3, Mesh, MeshBuilder, Ray, RayHelper, Scene, Vector3 } from "babylonjs";
import { AvaterInterface } from "../../AvatarInterface";

export class Avatar extends Mesh implements AvaterInterface {
    sphere: Mesh;
    speed_coeff: number;
    currentHealth: number;
    maxHealth: number;
    canJump = false;
    ray: Ray;
    shape: Mesh | undefined;
    gravity_acceleration: number;
    rayHelper: RayHelper;


    constructor(scene: Scene, avatar_username: string, health?: number) {
        super(avatar_username, scene);
        this.name = avatar_username
        health ? this.currentHealth = health : this.currentHealth = 100;
        this.maxHealth = this.currentHealth;

        let sphere = MeshBuilder.CreateCylinder(this.name + "sp1", { diameter: 0.5, height: 2 }, scene);
        let queue = MeshBuilder.CreateSphere(this.name + "sp2", { segments: 16, diameter: 0.3 }, scene);

        this.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.checkCollisions = true;
        sphere.checkCollisions = true;
        this.gravity_acceleration = -0.05;

        sphere.parent = this;
        this.addChild(sphere)
        this.addChild(queue)
        queue.position = new Vector3(0, 0, -0.3);
        this.sphere = sphere;
        this.shape = this.sphere
        this.speed_coeff = 0.20;
        this.position = new Vector3(0, 1, 0);
        this.ray = new Ray(this.position, new Vector3(0, -1, 0), 1.2);
        this.rayHelper = new RayHelper(this.ray);
        this.rayHelper.show(scene, Color3.Red());
    }
    dispose(): void {
        super.dispose()
        this.rayHelper.dispose()
    }

    setRayPosition() {
        this.ray.origin = this.position
    }

}