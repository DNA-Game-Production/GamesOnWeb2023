import { AbstractMesh, Axis, Mesh, MeshBuilder, Vector3 } from "babylonjs";
import { wsClient } from "../../../../connection/connectionClient";
import { scene, sphere1 } from "../../../main";
import { getAvatarByShape } from "../../../others/tools";
import { AvatarSoft } from "../../avatarSoft";
import { Projectile } from "../projectile";

export class StoneProjectile extends Projectile {
    constructor(myShooter: AvatarSoft, displayOnly: Boolean, opt: { damage?: number, range?: number, speed?: number, direction?: Vector3, position?: Vector3 }) {
        var directionShooter = myShooter.shape.getDirection(Axis.Z)
        var defaultAngle = new Vector3(directionShooter.x, (myShooter.offset_dir_y + 0.3), directionShooter.z)
        super(
            myShooter,
            displayOnly,
            opt.damage || 10,
            opt.range || 50,
            opt.speed || 0.40,
            undefined,
            { direction: opt.direction || defaultAngle, position: opt.position })
    }

    collide(mesh: AbstractMesh | undefined) {
        if (!this.displayOnly && mesh) {
            var monster = getAvatarByShape(mesh, [wsClient.monster_list])
            if (monster) {
                monster.take_damage(this.shape.position, this.damage)
            }
            var player = getAvatarByShape(mesh, [wsClient.player_list])
            if (player && player !== sphere1) {
                player.take_damage(this.shape.position, this.damage)
            }
        }
        this.dispose()
    }

    createShape(): Mesh {
        let sphere = MeshBuilder.CreateSphere(this.name, {
            diameter: 0.3,
            segments: 16
        }, scene);
        return sphere
    }

    update(): void {
        this.angle.y -= 0.02
        super.update()
    }
}