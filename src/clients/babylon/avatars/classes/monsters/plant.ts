import { Scene, Vector3 } from "babylonjs";
import { wsClient } from "../../../../connection/connectionClient";
import { serverMessages } from "../../../../connection/connectionSoft";
import { Avatar } from "../../avatarHeavy";
import { ModelEnum } from "../models";

export class Plant extends Avatar {

    constructor(scene: Scene, avatar_username: string, position: Vector3) {
        super(scene, avatar_username, ModelEnum.Plant.intrinsicParameterMesh)
        this.shape.position = position
    }

    take_damage(source: Vector3, amount: number, knockback_power = 1) {
        if (!this.takeHits) return
        wsClient.send(
            JSON.stringify({
                route: serverMessages.REMOVE_PLANT,
                content: this.name
            }))
        console.log("sending remove on " + this.name);

    }
}