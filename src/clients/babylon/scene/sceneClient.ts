import { Axis, BlurPostProcess, DirectionalLight, Engine, HemisphericLight, ImageProcessingPostProcess, Matrix, Mesh, MeshBuilder, Quaternion, SceneLoader, ShadowGenerator, Sprite, SpriteManager, StandardMaterial, Texture, Vector2, Vector3 } from "babylonjs";
import { SkyMaterial, WaterMaterial } from "babylonjs-materials";
import { Projectile } from "../avatars/weapons/projectile";
import { scene, sphere1 } from "../main";
import { ModelEnum } from "../avatars/classes/models";
import { createWall } from "../others/tools";
import { SceneSoft } from "./sceneSoft";
import { Animation, AnimationGroup } from "babylonjs";

export var light: DirectionalLight;
export var hemiLight: HemisphericLight;
export var water: Mesh;
export var shadowGenerator: ShadowGenerator | null;
// export var pos_forest: Vector3
export var pos_canyon: Vector3
export var pos_snow: Vector3
// export var pos_lowPo: Vector3
export var pos_volcan: Vector3
export var pos_mossy: Vector3

export var skyMaterial: SkyMaterial
export var nightskyMaterial: StandardMaterial

export class SceneClient extends SceneSoft {
    shadowGenerator: ShadowGenerator | null;
    water: Mesh;
    waterMaterial: WaterMaterial | undefined;
    waterBlurPostProcess: BlurPostProcess | undefined;
    postProcess: ImageProcessingPostProcess | undefined;
    hitVignetteAnimation: AnimationGroup | undefined;
    fadinVignetteAnimation: AnimationGroup | undefined;
    grassTaskCounter: number;
    treeTaskCounter: number;
    cactusTaskCounter: number;
    projectileList: Projectile[];

    constructor(engine: Engine) {
        // This creates a basic Babylon Scene object (non-mesh)
        super(engine)
        this.createLight();
        this.water = this.createSea();

        this.shadowGenerator = this.createShadows();
        this.shadowGenerator.addShadowCaster(createWall(this));
        shadowGenerator = this.shadowGenerator;

        this.fogMode = BABYLON.Scene.FOGMODE_EXP;
        this.fogDensity = 0.0005;

        this.createSkybox();
        this.createNightBox();

        // this.createSprites();

        ModelEnum.createAllModels(this);

        this.collisionsEnabled = true;
        this.grassTaskCounter = 0;
        this.treeTaskCounter = 0;
        this.cactusTaskCounter = 0;

        this.beforeRender = () => {
            if (sphere1) {
                sphere1.isJumping ? sphere1.applyJump() : sphere1.applyGravity();
            }
            if (scene.activeCamera && sphere1) {
                if (sphere1.shape.position.y + 0.5 < water.position.y) {
                    if (this.waterBlurPostProcess === undefined) this.waterBlurPostProcess = new BlurPostProcess("Horizontal blur", new Vector2(1.0, 0), 64, 1.0, scene.activeCamera);
                    sphere1.underwater(true)

                } else {
                    if (this.waterBlurPostProcess !== undefined) {
                        this.waterBlurPostProcess.dispose();
                        this.waterBlurPostProcess = undefined;
                    }
                    sphere1.underwater(false)
                }
            }
        }

        this.projectileList = []
    }

    /*configureAssetManager() {
        let assetsManager = new AssetsManager(this);
        assetsManager.onProgress = function (remainingCount, totalCount, lastFinishedTask) {
            engine.loadingUIText = "Loading... " + lastFinishedTask.name + " (" + (totalCount - remainingCount) + "/" + totalCount + ")"
        }

        assetsManager.onFinish = function (tasks) {
            startRenderLoop(engine)
        }

        return assetsManager;
    }*/

    createSkybox() {
        skyMaterial = new SkyMaterial("skyMaterial", this);
        skyMaterial.backFaceCulling = false;
        skyMaterial.inclination = 0
        skyMaterial.rayleigh = 10

        const skybox = MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, this);
        skybox.material = skyMaterial;
        skybox.applyFog = false
    }

    createNightBox() {
        nightskyMaterial = new StandardMaterial("skyBox", this);
        nightskyMaterial.backFaceCulling = false;
        nightskyMaterial.reflectionTexture = new Texture("./img/NightSkybox.png", scene, true);
        nightskyMaterial.reflectionTexture.coordinatesMode = Texture.FIXED_EQUIRECTANGULAR_MODE;
        nightskyMaterial.disableLighting = true;
        nightskyMaterial.alpha = 0

        const nightbox = MeshBuilder.CreateBox("nightsky", { size: 8000.0 }, this);
        nightbox.material = nightskyMaterial;
        nightbox.applyFog = false
    }

    createLight() {
        light = new DirectionalLight("light1", new Vector3(-1, -2, -1), this);
        light.position = new Vector3(0, 40, 0);

        // Default intensity is 1.
        light.intensity = 1;

        hemiLight = new HemisphericLight("light2", new Vector3(0, 1, 0), this);
        hemiLight.intensity = 0.35;
    }

    createGround() {
        ModelEnum.addLoadingTask(this.groundsData.length)
        for (const ground of this.groundsData) {
            this.loadGround("models/", ground.modelID, ground.meshName, ground.position)
        }
    }

    loadGround(path: string, modelID: string, meshName: string, position: Vector3, scaling = 100) {
        SceneLoader.Append(path, modelID, this, (scene) => {
            let ground = scene.getMeshByName(meshName) as Mesh;
            ground.scaling = new Vector3(scaling, scaling, scaling)
            ground.checkCollisions = true;
            ground.position = position;
            ground.freezeWorldMatrix();
            ground.receiveShadows = true;
            ground.isPickable = true;
            // ground.material?.freeze()
            this.grounds!.push(ground.name);

            this.setUpForGrass();
            this.waterMaterial!.addToRenderList(ground);
            ModelEnum.loadingDone();
        });
    }

    createSprites() {
        var spriteManagerTrees = new SpriteManager("grassesManager", "./textures/herb.png", 2000, 800, this);

        //Creation of 2000 trees at random positions
        for (var i = 0; i < 2000; i++) {
            let herb = new Sprite("herb", spriteManagerTrees);
            herb.height = Math.random() * 2
            herb.width = Math.random() * 2
            herb.position.x = Math.random() * 50 - 25;
            herb.position.z = Math.random() * 50 - 25;
            herb.position.y = 0.5;
        }
    }

    createShadows(): ShadowGenerator {
        let shadowGenerator = new ShadowGenerator(1024, light);
        shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_LOW;
        shadowGenerator.darkness = 0.2;

        //Makes the shadow blurred (but shadow disappear if above a mesh)
        // shadowGenerator.useBlurExponentialShadowMap = true;
        // shadowGenerator.useKernelBlur = true;
        // shadowGenerator.blurKernel = 4;
        // shadowGenerator.blurScale = 1;

        //Transparent mesh
        // shadowGenerator.transparencyShadow = true;
        // shadowGenerator.enableSoftTransparentShadow = true;
        return shadowGenerator
    }

    createSea(): Mesh {
        //water ground
        ModelEnum.addLoadingTask(1);
        this.water = MeshBuilder.CreateGround("waterMesh", { height: 2000, width: 2000, subdivisions: 32 }, this);
        this.water.position.y = -24;
        this.water.isPickable = false;

        this.waterMaterial = new WaterMaterial("waterMaterial", this, new Vector2(256, 256));
        this.waterMaterial.backFaceCulling = false;
        this.waterMaterial.bumpTexture = new Texture("./textures/waterbump.png", this, undefined, undefined, undefined, () => {
            ModelEnum.loadingDone();
        });
        this.waterMaterial.windForce = -5;
        this.waterMaterial.waveHeight = 0.1;
        this.waterMaterial.bumpHeight = 0.1;
        this.waterMaterial.waveLength = 0.1;
        this.waterMaterial.colorBlendFactor = 0;
        this.water.material = this.waterMaterial;

        water = this.water

        var water_ground = this.createWaterGround()
        var material = new StandardMaterial("water_round_mat", scene)
        material.alpha = 1;
        material.diffuseColor = new BABYLON.Color3(146 / 255, 115 / 255, 82 / 255);
        water_ground.material = material
        this.grounds!.push(water_ground.name);
        this.waterMaterial!.addToRenderList(water_ground);

        return this.water;
    }

    /*createSky() {
        this.clearColor = new Color4(135 / 255, 206 / 255, 235 / 255, 1);
    }*/


    setUpForGrass() {
        //Grounds + Grass
        if (!(++this.grassTaskCounter < this.groundsData.length + 1)) this.grassGeneration()
    }

    setUpForTree() {
        if (!(++this.treeTaskCounter < 1)) this.treeGeneration()
    }

    setUpForCactus() {
        if (!(++this.cactusTaskCounter < 1)) this.cactusGeneration()
    }

    private grassGeneration() {
        ModelEnum.addLoadingTask(1);
        var model = ModelEnum.Grass.rootMesh;

        if (model !== undefined) {
            model.scaling = new Vector3(1, 1, 1);
            model.addLODLevel(50, null)

            //Creation of 400 herbs at random positions, scaling and orientation
            for (let i = 0; i < 200; i++) {

                let x = Math.random() * 200 - 100;
                let z = Math.random() * 200 - 100;
                let height = this.getHeightAtPoint(x, z);

                if (height !== undefined) {
                    this.createInstance(model, x, height, z);
                }
            }

            ModelEnum.loadingDone();
        }
    }

    private treeGeneration() {
        ModelEnum.addLoadingTask(1);
        var model = ModelEnum.PineTree.rootMesh;

        if (model !== undefined) {
            let childs = model.getChildMeshes() as Mesh[];

            let c1 = childs[0];
            let c2 = childs[1];

            let c1m = Mesh.MergeMeshes([c1]);
            let c2m = Mesh.MergeMeshes([c2]);
            c1m?.setAbsolutePosition(new Vector3(0, -100, -100))
            c2m?.setAbsolutePosition(new Vector3(0, -100, -100))

            c1m?.simplify(
                [
                    { quality: 0.3, distance: 50, optimizeMesh: true },
                    { quality: 0.05, distance: 100, optimizeMesh: true },
                ],
                false,
                BABYLON.SimplificationType.QUADRATIC,
                function () {
                    console.log("LOD troncs finished");
                },
            );
            c2m?.simplify(
                [
                    { quality: 0.3, distance: 50, optimizeMesh: true },
                    { quality: 0.05, distance: 100, optimizeMesh: true },
                ],
                false,
                BABYLON.SimplificationType.QUADRATIC,
                function () {
                    console.log("LOD feuillages finished");
                },
            );

            // c1m?.addLODLevel(100, null)
            // c2m?.addLODLevel(100, null)

            /* POSITION TREES FROM STOCKED LIST */

            this.treePositions.forEach((positionData, index) => {
                let x = positionData.x
                let z = positionData.z
                let height = this.getHeightAtPoint(x, z);

                if (height !== undefined && model !== undefined && c1m && c2m) {
                    // let matrix = this.createThinInstance(c1m, x, height, z);
                    let matrix = this.createInstance(c1m, x, height, z)
                    var collider = MeshBuilder.CreateCylinder("tree" + index, { height: 4, diameter: 0.6 }, scene)
                    collider.position = new Vector3(x, height + 1.2, z)
                    collider.checkCollisions = true
                    collider.isVisible = false
                    // this.createThinInstance(c2m, x, height, z, matrix);
                    this.createInstance(c2m, x, height, z, matrix);
                }
            })

            /* GENERATE RANDOM TREE POSITION */

            // for (let i = 0; i < 300; i++) {
            //     let x = Math.random() * 150 - 75;
            //     let z = Math.random() * 150 - 75;
            //     let height = this.getHeightAtPoint(x, z);
            //     console.log("{ x: ", (Math.round(x * 100) / 100).toFixed(2), ", z: ", (Math.round(z * 100) / 100).toFixed(2), " }");


            //     if (height !== undefined && model !== undefined && c1m && c2m) {
            //         // let matrix = this.createThinInstance(c1m, x, height, z);
            //         let matrix = this.createInstance(c1m, x, height, z)
            //         var collider = MeshBuilder.CreateCylinder("arbre", { height: 4, diameter: 0.6 }, scene)
            //         collider.position = new Vector3(x, height + 1.2, z)
            //         collider.checkCollisions = true
            //         collider.isVisible = false
            //         // this.createThinInstance(c2m, x, height, z, matrix);
            //         this.createInstance(c2m, x, height, z, matrix);
            //     }

            // }
            // this.treePositions.forEach(position => {
            //     let x = position.x;
            //     let z = position.z;
            //     let height = this.getHeightAtPoint(x, z);

            //     if (height !== undefined && model !== undefined && c1m && c2m) {
            //         let matrix = this.createThinInstance(c1m, x, height, z);
            //         this.createThinInstance(c2m, x, height, z, matrix);
            //     }
            // });

            ModelEnum.loadingDone();
        }

    }

    private cactusGeneration() {
        ModelEnum.addLoadingTask(1);
        var model = ModelEnum.Cactus.rootMesh;

        if (model !== undefined) {
            let childs = model.getChildMeshes() as Mesh[];

            //THIS LINE INDUCE UNWANTED SPAWN
            let mergedmodel = Mesh.MergeMeshes(childs);
            mergedmodel?.setAbsolutePosition(new Vector3(0, -100, -100))

            mergedmodel?.simplify(
                [
                    { quality: 0.2, distance: 50, optimizeMesh: true },
                    { quality: 0.05, distance: 100, optimizeMesh: true },
                ],
                false,
                BABYLON.SimplificationType.QUADRATIC,
                function () {
                    console.log("LOD cactus finished");
                },
            );

            /* GENERATE RANDOM CACTUS POSITION */

            for (let i = 0; i < 10; i++) {
                let x = Math.random() * 150 - 75 + 400;
                let z = Math.random() * 150 - 75 + 100;
                let height = this.getHeightAtPoint(x, z);
                console.log("{ x: ", (Math.round(x * 100) / 100).toFixed(2), ", z: ", (Math.round(z * 100) / 100).toFixed(2), " }");

                if (height !== undefined && model !== undefined && mergedmodel) {
                    this.createInstance(mergedmodel, x, height, z)
                    var collider = MeshBuilder.CreateCylinder("cactus", { height: 2, diameter: 2 }, scene)
                    collider.position = new Vector3(x, height + 1, z)
                    collider.checkCollisions = true
                    collider.isVisible = false
                }

            }

            ModelEnum.loadingDone();
        }
    }

    private createThinInstance(model: Mesh, x: number, height: number, z: number, transformMatrix?: Matrix): Matrix {
        if (transformMatrix !== undefined) {
            model.thinInstanceAdd(transformMatrix);
            return transformMatrix;
        }

        //Parameters
        let scaleRatio = 3 - Math.random() * 2.5
        let scalingVector = new Vector3(scaleRatio, scaleRatio, scaleRatio);
        let rotationQuaternion = Quaternion.RotationAxis(Axis.Y, Math.random() * Math.PI);
        let translationVector = new Vector3(x, height - 0.2, z);
        let scaleRotateTranslateMatrix = Matrix.Compose(scalingVector, rotationQuaternion, translationVector);

        //Creation of thin instance
        model.thinInstanceAdd(scaleRotateTranslateMatrix);
        return scaleRotateTranslateMatrix;
    }

    private createInstance(model: Mesh, x: number, height: number, z: number, p?: { scale: Vector3, rotation: Quaternion }) {

        //Parameters
        let scaleRatio = 3 - Math.random() * 1.5
        let scalingVector = p ? p.scale : new Vector3(scaleRatio, scaleRatio, scaleRatio);
        let rotationQuaternion = p ? p.rotation : Quaternion.RotationAxis(Axis.Y, Math.random() * Math.PI);


        //Creation of thin instance
        var instance = model.createInstance("instance")
        instance.position = new Vector3(x, height, z)
        instance.rotationQuaternion = rotationQuaternion
        instance.scaling = scalingVector

        //UNCOMMENT HERE TO ADD SHADOWS TO TREE
        //shadowGenerator?.addShadowCaster(instance);

        instance.freezeWorldMatrix()
        instance.isPickable = false
        // if (instance.material) instance.material.needDepthPrePass = true
        // instance.material?.freeze()
        instance.doNotSyncBoundingInfo = true;

        return { scale: scalingVector, rotation: rotationQuaternion };
    }

    setPostProcessFilters() {
        //Post Process when taking damage
        this.postProcess = new ImageProcessingPostProcess("postProcess", 1.0, this.activeCamera);

        this.executeWhenReady(() => {
            this.switchPostProcessStatus(this.postProcess, false)
        })

        this.hitVignetteAnimation = new AnimationGroup("vignetteHitAnimGroup");
        this.hitVignetteAnimation.addTargetedAnimation(this.createVignetteHitAnimation([{ frame: 0, value: 0 }, { frame: 8, value: 3 }, { frame: 10, value: 0 }], "vignetteWeight"), this.postProcess);

        this.fadinVignetteAnimation = new AnimationGroup("vignetteFadinAnimGroup");
        this.fadinVignetteAnimation.addTargetedAnimation(this.createVignetteHitAnimation([{ frame: 0, value: 1 }, { frame: 240, value: 0 }, { frame: 360, value: 0 }, { frame: 500, value: 1 }], "exposure"), this.postProcess);
    }

    setPostProcessTo(type: string) {
        if (this.postProcess === undefined) return
        switch (type) {
            case "fadin":
                this.postProcess.vignetteWeight = 0;
                this.postProcess.vignetteStretch = 50
                this.postProcess.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
                this.postProcess.vignetteEnabled = true;
                break;
            case "hit":
                this.postProcess.vignetteWeight = 0;
                this.postProcess.vignetteStretch = 2
                this.postProcess.vignetteColor = new BABYLON.Color4(255 / 255, 0, 0, 0);
                this.postProcess.vignetteEnabled = true;
                break;
            case "underwater":
                this.postProcess.vignetteWeight = 40;
                this.postProcess.vignetteStretch = 1;
                this.postProcess.vignetteColor = new BABYLON.Color4(0, 0, 1, 0);
                this.postProcess.vignetteEnabled = true;
            default:
                console.log("error try to setPostProcessTo(" + type + ")");
        }
    }

    createVignetteHitAnimation(values: { frame: number, value: number }[], effect: string) {
        var animationVignette = new Animation("animationVignette", effect, 60, Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE);

        var keys: { frame: number; value: number; }[] = [];

        values.forEach(value => keys.push(value))

        animationVignette.setKeys(keys);
        return animationVignette
    }

    triggerPostProcessAnimation(postProcessType: string, animations: AnimationGroup | undefined) {
        if (animations !== undefined) {
            this.setPostProcessTo(postProcessType)
            this.switchPostProcessStatus(this.postProcess, true)
            animations.goToFrame(0)
            animations.play(false)
            animations.onAnimationGroupEndObservable.add(() => {
                if (this && this.activeCamera !== undefined) {
                    this.switchPostProcessStatus(this.postProcess, false)
                }
            })
        }
    }

    switchPostProcessStatus(postProcess: ImageProcessingPostProcess | undefined, on: boolean) {
        if (postProcess) {
            if (on) this.switchPostProcessStatus(postProcess, false)
            on ? this.activeCamera?.attachPostProcess(postProcess) : this.activeCamera?.detachPostProcess(postProcess)
            postProcess.imageProcessingConfiguration.isEnabled = on;
        }
    }

}
