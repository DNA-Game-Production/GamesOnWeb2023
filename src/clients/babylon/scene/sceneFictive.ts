import { Engine, GroundMesh, MeshBuilder } from "babylonjs";
import { SceneSoft } from "./sceneSoft";

export class SceneFictive extends SceneSoft {
    gravityIntensity: number;
    ground: GroundMesh | undefined;
    grassTaskCounter: number;

    constructor(engine: Engine) {
        // This creates a basic Babylon Scene object (non-mesh)
        super(engine)

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

        // let groundOptions = () => {
        //     return {
        //         width: groundWidth,
        //         height: groundLenght,
        //         subdivisions: 32,
        //         minHeight: groundMinheight,
        //         maxHeight: groundMaxheight,

        //         onReady: () => onGroundCreated(),
        //     }
        // }

        // var ground = MeshBuilder.CreateGround(
        //     groundName,
        //     groundOptions(),
        // )

        // var ground = MeshBuilder.CreateGroundFromHeightMap(
        //     groundName,
        //     heightmapTexture,
        //     groundOptions(),
        //     this
        // );


        // let onGroundCreated = () => {
        //     ground.position.y -= groundMaxheight;
        //     ground.checkCollisions = true;
        //     this.ground = ground;
        //     console.log("ground: " + ground);
        //     console.log("ground y: " + ground.position.y);
        //     ground.isPickable = true
        // }
    }
};