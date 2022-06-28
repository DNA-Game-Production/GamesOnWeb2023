import { Engine, GroundMesh, MeshBuilder, Scene } from "babylonjs";
import { AvaterInterface as AvatarInterface } from "../../../AvatarInterface";

export class MyScene extends Scene {
    gravityIntensity: number;
    ground: GroundMesh | undefined;
    grassTaskCounter: number;

    constructor(engine: Engine) {
        // This creates a basic Babylon Scene object (non-mesh)
        super(engine)

        this.createGround();

        this.gravityIntensity = -0.02;
        this.collisionsEnabled = true;
        this.grassTaskCounter = 0;
    }

    createGround() {
        const groundName = "ground1";
        const heightmapTexture = "http://localhost:3000/textures/aerial_rocks_04_rough_8k.jpg";

        const groundWidth = 100;
        const groundLenght = 100;

        const groundMinheight = -1;
        const groundMaxheight = 2;

        let groundOptions = () => {
            return {
                width: groundWidth,
                height: groundLenght,
                subdivisions: 32,
                minHeight: groundMinheight,
                maxHeight: groundMaxheight,

                onReady: () => onGroundCreated(),
            }
        }

        // var ground = MeshBuilder.CreateGround(
        //     groundName,
        //     groundOptions(),
        // )

        var ground = MeshBuilder.CreateGroundFromHeightMap(
            groundName,
            heightmapTexture,
            groundOptions(),
            this
        );


        let onGroundCreated = () => {
            ground.position.y -= groundMaxheight;
            ground.checkCollisions = true;
            this.ground = ground;
            console.log("ground: " + ground);
            console.log("ground y: " + ground.position.y);
            ground.isPickable = true
        }
    }

    applyGravity(mesh: AvatarInterface) {
        // mesh.moveWithCollisions(new Vector3(0, -0.5, 0))
        if (mesh) {
            var hits = this.multiPickWithRay(mesh.ray, (m) => { return m.isPickable });
            console.log({ hits });


            var filtered = (hits?.filter(e => (mesh?.shape === undefined) || (mesh?.shape != undefined && e.pickedMesh?.name !== mesh?.shape.name)))

            console.log({ filtered });


            //if object detected but to high
            if (filtered !== undefined && filtered.length > 0) {
                console.log("If first branch", filtered);

                var hit = filtered[0]
                if (hit !== null && hit.pickedPoint && mesh.position.y > hit.pickedPoint.y + 1.2) {
                    mesh.position.y += mesh.gravity_acceleration;
                } else {
                    mesh.gravity_acceleration = this.gravityIntensity;
                    mesh.canJump = true;
                }
                //else above the void
            } else {
                console.log("Going down ?");

                mesh.position.y += mesh.gravity_acceleration * 2;
                // mesh.gravity_acceleration += this.gravityIntensity * 0.2;
            }
        }
    }
};