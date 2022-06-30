import { Mesh, MeshBuilder, Ray, Scene, Vector3 } from "babylonjs";
import { AvatarSoft } from "./avatarSoft";
import { Health } from "./meshWithHealth";

export class AvatarFictive extends AvatarSoft {
    shape: Mesh;

    constructor(scene: Scene, avatar_username: string, health?: Health) {
        super(scene, avatar_username, { health });
        this.name = avatar_username

        let sphere = MeshBuilder.CreateCylinder(this.name + "sp1", { diameter: 0.5, height: 2 }, scene);
        let queue = MeshBuilder.CreateSphere(this.name + "sp2", { segments: 16, diameter: 0.3 }, scene);

        this.ellipsoid = new Vector3(0.5, 1, 0.5);
        this.checkCollisions = true;
        // sphere.checkCollisions = true;
        this.gravity_acceleration = -0.05;

        sphere.parent = this;
        this.addChild(sphere)
        this.addChild(queue)
        queue.position = new Vector3(0, 0, -0.3);
        this.shape = sphere;
        this.shape = this.shape
        this.speed_coeff = 0.20;
        this.position = new Vector3(0, 1, 0);
        this.ray = new Ray(this.position, new Vector3(0, -1, 0), 1.2);
    }
    dispose(): void {
        super.dispose()
    }
}