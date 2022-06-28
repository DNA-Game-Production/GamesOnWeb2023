import { AnimationGroup, Color3, IParticleSystem, Mesh, MeshBuilder, PointLight, Skeleton, StandardMaterial, Vector3, ShadowGenerator } from "babylonjs";
import { scene, sphere1 } from "./main";
import { MySceneClient } from "./scene/scene";

import 'babylonjs-loaders';
import { createFire } from "./particules";
import { createFireAnimation } from "./particules";
export var shadowGeneratorCampfire: ShadowGenerator;
export class ModelEnum {
    static PumpkinMonster = new ModelEnum("pumpkin_monster", "gltf", 2);
    static Grass = new ModelEnum("grass", "gltf", 0.02);
    static Campfire = new ModelEnum("campfire", "gltf", 0.25);

    name: string;
    extension: string;
    scaling: number;
    rootMesh: Mesh | undefined
    particules: IParticleSystem[] = [];
    skeletons: Skeleton[] = [];



    constructor(name: string, extension: string, scaling: number) {
        this.name = name;
        this.extension = extension;
        this.scaling = scaling;
    }

    createModel(scene: MySceneClient) {
        //A priori, all gltf extension file will be (automatically) named "scene", else the same name of the respective folder
        let meshTask = scene.assetManager.addMeshTask(this.name + "_task", "", "models/" + this.name + "/", (this.extension == "gltf" ? "scene" : this.name) + "." + this.extension);
        meshTask.onSuccess = (task) => {
            this.callback(task.loadedMeshes, task.loadedParticleSystems, task.loadedSkeletons, task.loadedAnimationGroups)
        }

    }

    callback(meshes: any[], particules: IParticleSystem[], skeletons: Skeleton[], animations: AnimationGroup[]) {
        switch (this.name) {
            case "grass":
                let myMeshes = [...meshes];
                myMeshes.forEach(m => {
                    if (m.material) {
                        m.material.backFaceCulling = true;
                        m.flipFaces(true);
                        //m.material.transparencyMode = 1;
                    }
                })
                myMeshes.shift();
                //Merging of all twig of grass in an unique mesh
                let model = Mesh.MergeMeshes(myMeshes);
                if (model) {
                    this.rootMesh = model;
                    scene.setUpForGrass();
                }
                break;
            case "pumpkin_monster":

                meshes[0].scaling = new Vector3(this.scaling, this.scaling, this.scaling);
                //meshes[0].position = new Vector3(15, 0, 20);

                meshes[0].position.y -= 1.5;
                this.rootMesh = meshes[0];

                let eye = MeshBuilder.CreateSphere(this.name + "_eye", { segments: 8, diameter: 0.06 }, scene);
                eye.position = new Vector3(0.122, 1.108, 0.125)
                eye.parent = this.rootMesh!;
                // let light = new PointLight(this.name + "_light", new Vector3(0, 0, 0), scene);

                // light.diffuse = new Color3(1, 0.5, 0);
                // light.range = 0.5;
                // light.intensity = 0.8;
                // light.parent = eye;

                var eyeMaterial = new StandardMaterial(this.name + "_material", scene);

                eyeMaterial.diffuseColor = new Color3(1, 0.5, 0);
                eyeMaterial.emissiveColor = new Color3(1, 0.5, 0);
                eye.material = eyeMaterial;

                let eye2 = eye.clone();
                eye2.position = new Vector3(-0.11, 1.08, 0.15)
                break;

            case "campfire":
                meshes[0].position = new Vector3(10, -0.5, 10);
                let campfireLight = new PointLight(this.name + "_light", meshes[0].position.add(new Vector3(0, 0.5, 0.8)), scene);
                shadowGeneratorCampfire = new ShadowGenerator(128, campfireLight);
                shadowGeneratorCampfire.filteringQuality = ShadowGenerator.QUALITY_LOW;
                shadowGeneratorCampfire.darkness = 0;

                shadowGeneratorCampfire.addShadowCaster(sphere1!);

                campfireLight.diffuse = new Color3(1, 0.5, 0);
                campfireLight.specular = new Color3(1, 0.5, 0);
                campfireLight.range = 15;
                let animFireLight = createFireAnimation();
                campfireLight.animations.push(animFireLight);
                scene.beginAnimation(campfireLight, 0, 100, true);

                campfireLight.intensity = 1;
                createFire(meshes[0]);
            // campfireLight.parent = meshes[0];

            default:
                meshes[0].scaling = new Vector3(this.scaling, this.scaling, this.scaling);
                this.rootMesh = meshes[0];
                break;
        }



    }

    static createAllModels(scene: MySceneClient) {
        var allModels = [this.PumpkinMonster, this.Grass]
        allModels.forEach(m => m.createModel(scene))
    }
}