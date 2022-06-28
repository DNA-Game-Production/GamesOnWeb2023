import { Scene } from "babylonjs";
import { sphere1 } from "../main";
import { Health } from "../meshWithHealth";
import { distance } from "../tools";
import { Avatar } from "./avatar";

export class Monster extends Avatar {

    constructor(scene: Scene, avatar_username: string, username: string, p?: { bulletDelay?: number, health?: Health }) {
        super(scene, avatar_username, username, p)
    }

    hit(hitmode: number) {
        switch (hitmode) {

            case 0:
                console.log("entering monster hitmode 0");

                /* TODO : Monster hit by spawning a hitbox ahead */

                // var hitbox = MeshBuilder.CreateBox("hit", { size: 2 });
                // var direction_monster = this.getDirection(Axis.Z);
                // hitbox.lookAt(hitbox.position.add(direction_monster));
                // var position_monster = this.position;
                // hitbox.position = new Vector3(
                //     position_monster.x + (direction_monster.x * 0.5),
                //     position_monster.y + (direction_monster.y * 0.5),
                //     position_monster.z + (direction_monster.z * 0.5))

                // if (sphere1) {
                //     if (hitbox.intersectsPoint(sphere1.position)) {
                //         console.log("player should take damage!");
                //         sphere1.take_damage(this, 10);
                //     }
                // }
                // setTimeout(() => hitbox.dispose(), 500);

                if (sphere1 && distance(sphere1.position, this.position) < 1.5) sphere1.take_damage(this, 10);
                break;

            default:
                console.log("tried hitting with mode " + hitmode + ", but " + this + " does not have such mode");
                break;

        }
    }
}