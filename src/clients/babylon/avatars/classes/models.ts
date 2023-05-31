import { AssetContainer, Axis, Color3, InstantiatedEntries, Mesh, MeshBuilder, PointLight, SceneLoader, ShadowGenerator, StandardMaterial, Vector3 } from "babylonjs";
import 'babylonjs-loaders';
import { sendLogin, wsClient } from "../../../connection/connectionClient";
import { loadingRef } from '../../../reactComponents/main';
import { windowExists } from '../../../reactComponents/tools';
import { engine, startRenderLoop } from "../../main";
import { createFire, createFireAnimation } from "../../others/particules";
import { SceneClient } from "../../scene/sceneClient";
import { intrinsicModelProperties, intrinsicModelPropertiesOptional, intrinsicProperties } from './intrinsicProp';

export var shadowGeneratorCampfire: ShadowGenerator;

interface duplicateModel { duplicateModel: () => InstantiatedEntries }

export type intrinsicModelPropertiesD = Readonly<Required<intrinsicModelProperties>> & duplicateModel

export class ModelEnum {
    static Mage = new ModelEnum(intrinsicProperties.Mage);
    static Warrior = new ModelEnum(intrinsicProperties.Warrior);
    // static Assassin = new ModelEnum(intrinsicProperties.Assassin);
    // static Archer = new ModelEnum(intrinsicProperties.Archer);
    // static Healer = new ModelEnum(intrinsicProperties.Healer);
    static PumpkinMonster = new ModelEnum(intrinsicProperties.PumpkinMonster);


    static Campfire = new ModelEnum(intrinsicProperties.Campfire);
    static Grass = new ModelEnum(intrinsicProperties.Grass);
    static PineTree = new ModelEnum(intrinsicProperties.PineTree);
    static Cactus = new ModelEnum(intrinsicProperties.Cactus)
    static Glider = new ModelEnum(intrinsicProperties.Glider)

    static Ranger = new ModelEnum(intrinsicProperties.Ranger);
    static NightMonster = new ModelEnum(intrinsicProperties.NightMonster)

    rootMesh: Mesh | undefined
    private container: AssetContainer = new AssetContainer();

    readonly intrinsicParameterMesh: intrinsicModelPropertiesD;

    //Grounds + Water texture + All models + Grass generation
    static totalLoad: number = 0;
    static remainingLoad: number = ModelEnum.totalLoad;



    constructor(p: intrinsicModelPropertiesOptional) {
        this.intrinsicParameterMesh = {
            ...p,
            duplicateModel: () => this.duplicate(this.container)
        }
    }

    createModel(scene: SceneClient) {
        const { className, scaling, fileExtension } = this.intrinsicParameterMesh
        SceneLoader.LoadAssetContainer("models/" + className + "/", className + "." + fileExtension, scene, (container) => {
            let meshes = container.meshes as Mesh[]
            let animations = container.animationGroups
            this.container = container;
            this.rootMesh = meshes[0] as Mesh;
            this.rootMesh.scaling = new Vector3(scaling, scaling, scaling);
            this.rootMesh.name = className;

            let model;

            ModelEnum.loadingDone();

            switch (className) {
                case "Grass":
                    meshes.forEach(m => {
                        if (m.material) {
                            m.material.backFaceCulling = true;
                            m.flipFaces(true);
                        }
                    })
                    meshes.shift();

                    //Merging of all twig of grass in an unique mesh
                    model = Mesh.MergeMeshes(meshes, false);
                    if (model) {
                        this.rootMesh = model;
                        scene.setUpForGrass();
                    }
                    break;

                case "PumpkinMonster":
                    this.rootMesh.position.y -= 0.5;
                    this.rootMesh.rotate(Axis.Y, Math.PI)

                    //left eye
                    let left_eye = MeshBuilder.CreateSphere(className + "_left_eye", { segments: 8, diameter: 0.06 }, scene);
                    left_eye.position = new Vector3(0.122, 1.108, 0.125);
                    left_eye.parent = this.rootMesh;

                    var eyeMaterial = new StandardMaterial(className + "_material", scene);

                    eyeMaterial.diffuseColor = new Color3(1, 0.5, 0);
                    eyeMaterial.emissiveColor = new Color3(1, 0.5, 0);
                    left_eye.material = eyeMaterial;

                    //right eye
                    let right_eye = left_eye.clone(className + "_right_eye");
                    right_eye.position = new Vector3(-0.11, 1.08, 0.15)
                    break;

                case "NightMonster":
                    this.rootMesh.rotate(Axis.Y, Math.PI)
                    this.rootMesh.scaling = new Vector3(2, 2, 2)
                    meshes.forEach(m => {
                        m.isPickable = false;
                        m.checkCollisions = false;
                    });
                    animations[0].stop();
                    break;

                case "Campfire":
                    this.rootMesh.position = new Vector3(5, -0.5, 5);

                    //campfire light
                    let campfireLight = new PointLight(className + "_light", this.rootMesh.position.add(new Vector3(0, 0.5, 0.8)), scene);
                    campfireLight.diffuse = new Color3(1, 0.5, 0);
                    campfireLight.specular = new Color3(1, 0.5, 0);
                    campfireLight.range = 15;
                    campfireLight.intensity = 1;
                    campfireLight.parent = this.rootMesh;

                    //campfire shadow (only over the player)
                    shadowGeneratorCampfire = new ShadowGenerator(128, campfireLight);
                    shadowGeneratorCampfire.filteringQuality = ShadowGenerator.QUALITY_LOW;
                    shadowGeneratorCampfire.darkness = 0;

                    //campfire light animation
                    let animFireLight = createFireAnimation();
                    campfireLight.animations.push(animFireLight);
                    scene.beginAnimation(campfireLight, 0, 100, true);

                    //fire effect
                    createFire(this.rootMesh);
                    break;

                case "Mage":
                    this.rootMesh.rotate(Axis.Y, Math.PI);
                    meshes.forEach(m => {
                        m.isPickable = false;
                        m.checkCollisions = false;
                    });
                    break;

                case "Ranger":
                    this.rootMesh.rotate(Axis.Y, Math.PI);
                    this.rootMesh.scaling = new Vector3(1.5, 1.5, 1.5)
                    meshes.forEach(m => {
                        m.isPickable = false;
                        m.checkCollisions = false;
                    });
                    animations[0].stop();
                    break;

                case "Glider":
                    this.rootMesh.rotate(Axis.Y, Math.PI);
                    this.rootMesh.scaling = new Vector3(0.025, 0.025, 0.025)
                    meshes.forEach(m => {
                        m.isPickable = false;
                        m.checkCollisions = false;
                    });
                    break;

                case "Warrior":
                    meshes.forEach(m => {
                        m.isPickable = false;
                        m.checkCollisions = false;
                    });
                    break;

                case "PineTree":
                    scene.setUpForTree();
                    break;

                case "Cactus":
                    scene.setUpForCactus();
                    break;
            }
        })
    }

    duplicate(container: AssetContainer) {
        let entries = container.instantiateModelsToScene(undefined, false, { doNotInstantiate: true });
        return entries;
    }

    static createAllModels(scene: SceneClient) {
        var allModels = [
            this.Ranger, //this.Mage, this.Warrior, 
            // this.Assassin, this.Archer, this.Healer, 
            this.PumpkinMonster, this.NightMonster, this.Grass, this.Campfire, this.PineTree, this.Cactus, this.Glider
        ];
        ModelEnum.addLoadingTask(allModels.length)
        allModels.forEach(m => m.createModel(scene));
    }

    static addLoadingTask(quantity: number) {
        ModelEnum.totalLoad += quantity;
        ModelEnum.remainingLoad += quantity;
    }

    static loadingDone() {
        if (windowExists()) {
            ModelEnum.remainingLoad--;
            loadingRef.current!.updateContent()

            if (ModelEnum.remainingLoad === 0) {
                setTimeout(() => {
                    wsClient.setEventListener()
                    sendLogin();
                    startRenderLoop(engine);
                }, 5000);
            }
        }
    }

}