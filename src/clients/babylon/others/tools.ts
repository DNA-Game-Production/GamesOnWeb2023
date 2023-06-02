import { AbstractMesh, Axis, Color3, FollowCamera, Mesh, MeshBuilder, Ray, Scene, StandardMaterial, Vector3 } from "babylonjs";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "babylonjs-gui";
import { wsClient } from "../../connection/connectionClient";
import { windowExists } from "../../reactComponents/tools";
import { Avatar } from "../avatars/avatarHeavy";
import { AvatarSoft } from "../avatars/avatarSoft";
import { PLAYER_CLASSES_TYPE } from "../avatars/classes/classesTypes";
import { Player } from "../avatars/classes/heroes/player";
import { scene, sphere1 } from "../main";
import { Warrior } from "../avatars/classes/heroes/warrior";
import { intrinsicModelProperties } from "../avatars/classes/intrinsicProp";
import { Ranger } from "../avatars/classes/heroes/ranger";
import { Mage } from "../avatars/classes/heroes/mage";

export function makeId(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function distance(a: Vector3, b: Vector3, two_d = false) {
    return Math.sqrt((a.x - b.x) ** 2 + (two_d ? 0 : (a.y - b.y) ** 2) + (a.z - b.z) ** 2);
}

/** Remove elt from L with side effect */
export function removeFromList<T>(elt: T, l: T[]) {
    let pos = l.indexOf(elt)
    if (pos >= 0) l.splice(pos, 1)
}


export function getTimeToString() {
    var today = new Date();
    var hours = today.getHours().toString()
    var minutes = today.getMinutes().toString()
    var time = "[" + (hours.length === 2 ? '' : '0') + hours + ":" + (minutes.length === 2 ? '' : '0') + minutes + "]";
    return time
}

export function isVector3Equal(v1: Vector3, v2: Vector3) {
    return (v1.x === v2.x) && (v1.y === v2.y) && (v1.z === v2.z)
}


export var createLabel = function (text: string, mesh: Avatar, scene: Scene, p?: intrinsicModelProperties) {
    //console.log(p);

    var plane = MeshBuilder.CreatePlane(text + "plane", { size: 5 }, scene);
    plane.billboardMode = Mesh.BILLBOARDMODE_Y;
    plane.position.y = p?.textYAbove || 2.5;

    if (windowExists()) {
        var advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);

        var rect1 = new Rectangle();
        rect1.width = 1;
        rect1.height = 1;
        rect1.cornerRadius = 20;
        rect1.color = "White";
        rect1.thickness = 0;
        rect1.background = "transparent";
        advancedTexture.addControl(rect1);
        rect1.linkWithMesh(mesh.shape);
        rect1.linkOffsetY = -80;

        const label = new TextBlock();
        label.text = text;
        label.color = "white"
        rect1.addControl(label);
        label.fontSize = 80;

        label.outlineWidth = 10;
        label.outlineColor = "black";
    }
    return plane
}


// export function createWall(scene: Scene) {
//     let wall = MeshBuilder.CreateBox("wall", { height: 50, width: 2, depth: 0.2 }, scene);
//     wall.position = new Vector3(10, 1, -10)
//     wall.rotate(Axis.X, Math.PI / 2.5)
//     wall.checkCollisions = true;

//     var wallMaterial = new StandardMaterial("wallMat", scene);

//     wallMaterial.diffuseColor = new Color3(0.6, 0.165, 0.11);
//     wall.material = wallMaterial;

//     wall.receiveShadows = true;
//     return wall
// }

export function createBasicShape(avatar_username: String, scene: Scene, p: intrinsicModelProperties) {
    let model = MeshBuilder.CreateCylinder(avatar_username.toString(), { diameter: p.width ? p.width : 1, height: p.height ? p.height : 2 }, scene);

    var myMaterial = new StandardMaterial("myMaterial", scene);

    myMaterial.diffuseColor = new Color3(0.3, 0.5, 1);
    model.material = myMaterial;
    return model
}

export function adjustCameraPosition(scene: Scene, sphere1: AvatarSoft) {
    let followCam = scene.activeCamera as FollowCamera

    var ray = new Ray(followCam.position.subtract(followCam.getDirection(Axis.Z).scale(2)), followCam.getDirection(Axis.Z), 15);
    var hit = scene.pickWithRay(ray, cameraCollision);
    // console.log("RAY HIT: ", hit?.pickedMesh?.name);

    if (hit) {
        if (hit.pickedMesh !== sphere1.shape) {
            if (hit.pickedPoint) followCam.radius = Math.max(2, distance(sphere1.shape.position, hit.pickedPoint) - 4);
        } else {
            var backRay = new Ray(sphere1.shape.position, followCam.getDirection(Axis.Z).negate().add(new Vector3(0, -0.5, 0)), Math.min(10, followCam.radius + 1));
            var backHit = scene.pickWithRay(backRay, cameraBackCollision)
            // console.log("BACKRAY HIT: ", backHit?.pickedMesh?.name);

            if (followCam.radius < 10) {
                if (!backHit?.pickedPoint) followCam.radius += 0.5;
            }
        }
    }
    if (followCam.radius > 10) followCam.radius = 10;
    // sphere1.shape.visibility = Math.min(followCam.radius / 4, 1);


    sphere1.model!.getChildMeshes().forEach(m => {
        m.visibility = Math.min(followCam.radius / 4, 1);
    })

    sphere1.offset_dir_y = followCam.getDirection(Axis.Z).y + 0.30
}

function cameraCollision(mesh: AbstractMesh) {
    return (scene.grounds.includes(mesh.name) || mesh.name === sphere1?.shape.name)
}

export function cameraBackCollision(mesh: AbstractMesh) {
    return (scene.grounds.includes(mesh.name))
}

export function teleport(mesh: AvatarSoft, position: Vector3, offsetY = 3) {
    var heightGround = scene.getHeightAtPoint(position.x, position.z)
    if (heightGround) {
        mesh.shape.position = new Vector3(position.x, heightGround + offsetY, position.z)
        mesh.setRayPosition()
    } else { console.log("tried to teleport on position without a ground"); }
}

export function getAvatarByShape(shape: AbstractMesh, lists = [wsClient.monster_list, wsClient.player_list]) {
    for (const list of lists) {
        var avatar = list.get(shape.name);
        if (avatar) return avatar;
    }
}

export function getAvatarByName(name: string, lists = [wsClient.monster_list, wsClient.player_list]) {
    var avatar: AvatarSoft | undefined
    for (const list of lists) {
        avatar = list.get(name);
        if (avatar) return avatar;
    }
}

export function isInHitzone(target: AbstractMesh, hitzone: AbstractMesh) {
    return hitzone.intersectsMesh(target)
}

export function isInCone(positionTarget: Vector3, centerHitbox: Vector3, rayon: number, direction: Vector3, hauteur: number, angle: number) {
    if (distance(positionTarget, centerHitbox, true) > rayon) return false;
    // console.log("distance validée");

    if (positionTarget.y > centerHitbox.y + hauteur || positionTarget.y < centerHitbox.y - hauteur) return false;
    // console.log("hauteur validée");

    if (angle >= Math.PI) return true;

    var vector = positionTarget.subtract(centerHitbox)
    direction.normalize()
    vector.normalize()
    var angleTarget = Math.acos((direction.x * vector.x + direction.z * vector.z) / (Math.sqrt(direction.x ** 2 + direction.z ** 2)) * (Math.sqrt(vector.x ** 2 + vector.z ** 2)))

    // if (angleTarget < angle) console.log("angle validé");
    // else console.log("angle pas validé");


    return angleTarget < angle
}

export function playerClassCreator(playerClass: PLAYER_CLASSES_TYPE, username: string): Player {
    //console.log(playerClass);

    switch (playerClass) {
        case "Mage":
            return new Mage(scene, username)
        case "Warrior":
            return new Warrior(scene, username)
        case "Ranger":
            return new Ranger(scene, username)
    }
}

export function shuffle<T>(array: T[]) {
    array.sort(() => Math.random() - 0.5);
}