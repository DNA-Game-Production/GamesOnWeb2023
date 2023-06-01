import { Axis, Color3, InstancedMesh, Mesh, MeshBuilder, Ray, StandardMaterial, TrailMesh, Vector3 } from "babylonjs";
import { scene, sphere1 } from "../../main";
import { SceneSoft } from "../../scene/sceneSoft";
import { Player } from "../classes/heroes/player";
import { ModelEnum } from "../classes/models";

export class Glider {

    gliderRay: Ray
    //gliderInstance: InstancedMesh | undefined
    mergedmodel = Mesh.MergeMeshes((ModelEnum.Glider.rootMesh?.clone() as Mesh).getChildMeshes() as Mesh[]) as Mesh;
    player: Player
    trailHandlers: TrailHandler[]

    constructor(player: Player) {
        this.player = player
        this.gliderRay = new Ray(this.player.shape.position, new Vector3(0, -1, 0), 6);

        this.mergedmodel.setAbsolutePosition(new Vector3(0, -100, -100))
        this.mergedmodel.isPickable = false
        this.mergedmodel.checkCollisions = false
        this.mergedmodel.computeWorldMatrix(true);

        //SET UP TRAIL MATERIAL
        let trailMaterial = new StandardMaterial("sourceMat", scene)
        trailMaterial.emissiveColor = trailMaterial.diffuseColor = Color3.White();
        trailMaterial.specularColor = Color3.Black();
        trailMaterial.alpha = 0.2;

        //CREATE TRAIL HANDLERS
        this.trailHandlers = [
            new TrailHandler(trailMaterial, new Vector3(3.6, 1.1, -0.7)),
            new TrailHandler(trailMaterial, new Vector3(-3.6, 1.1, -0.7))
        ]
    }

    switchGlide() {
        if (this.player.getStatus() !== "Falling" && this.player.getStatus() !== "Gliding") return
        if (this.player.getStatus() !== "Gliding") {
            //USE RAYCAST TO CHECK IF GROUND IS FAR ENOUGH.
            var hits = this.player.shape.getScene().multiPickWithRay(this.gliderRay, (m) => { return m.isPickable });
            var filtered = hits?.filter(e => (e.pickedMesh?.name !== this.player.shape?.name) && (e.pickedMesh?.name !== this.player.shape.getChildMeshes()[0].name))
            if (filtered !== undefined && filtered.length > 0) { return }

            //UPDATE STATUS AND UPDATE LASTGROUND POINT FOR FALL DAMAGE
            this.player.update_status("Gliding")
            this.player.shape.onCollide = function (mesh) {
                console.log("collide while gliding");
                if (sphere1) {
                    if (sphere1.getStatus() !== "Gliding") sphere1.shape.onCollide = function (mesh) { return }
                    else sphere1.switchGlide()
                }
            }
            this.player.updateLastGround()
            this.player.gravity_acceleration = SceneSoft.gravityIntensity * 3
        } else {
            this.player.updateLastGround()
            this.player.shape.onCollide = function (mesh) { return }
            this.player.update_status("Falling")
        }
    }

    deployGlider(on: boolean) {
        if (on) {
            //SPAWN GLIDER MODEL
            this.mergedmodel.setDirection(this.player.shape.getDirection(Axis.Z))
            this.mergedmodel.position = this.player.shape.position.add(new Vector3(0, 1.45, 0)).subtract(this.player.shape.getDirection(Axis.Z).normalize().scale(0.4))
            this.mergedmodel.computeWorldMatrix(true);
            this.player.shape.addChild(this.mergedmodel)
            //DISPLAY TRAILS
            this.trailHandlers.forEach(trailHandler => trailHandler.switchTrailOn(this.mergedmodel))
        } else {
            this.trailHandlers.forEach(trailHandler => trailHandler.switchTrailOff())
            this.player.shape.removeChild(this.mergedmodel)
            this.mergedmodel.setAbsolutePosition(new Vector3(0, -100, -100))
        }
    }

}

class TrailHandler {
    trailMaterial: StandardMaterial
    trailEmitter: Mesh | undefined
    trailMesh: TrailMesh | undefined
    offset: Vector3

    constructor(material: StandardMaterial, offset: Vector3) {
        //SET UP TRAIL MATERIAL
        this.trailMaterial = material
        this.trailMaterial.emissiveColor = this.trailMaterial.diffuseColor = Color3.White();
        this.trailMaterial.specularColor = Color3.Black();
        this.trailMaterial.alpha = 0.2;
        this.offset = offset
    }

    switchTrailOn(parent: Mesh) {

        this.trailEmitter = MeshBuilder.CreateBox("airstreak", { size: 0.05 });
        if (parent) this.trailEmitter.parent = parent
        this.trailEmitter.isVisible = false
        this.trailEmitter.isPickable = false
        this.trailEmitter.checkCollisions = false
        this.trailEmitter.position = this.trailEmitter.position.add(this.offset)

        this.trailMesh = new TrailMesh("airTrail", this.trailEmitter, scene, 0.01, 30);
        this.trailMesh.material = this.trailMaterial

        this.trailMesh.start(); //Starts the trailing mesh.
    }

    switchTrailOff() {
        this.trailMesh?.dispose()
        this.trailEmitter?.dispose()
    }
}