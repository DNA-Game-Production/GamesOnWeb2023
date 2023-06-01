import { Axis, Engine, NullEngine, PointLight, Vector3 } from "babylonjs";
import { AvatarFictive } from "./clients/babylon/avatars/avatarFictif";
import { AvatarSoft } from "./clients/babylon/avatars/avatarSoft";
import { ModelEnum } from "./clients/babylon/avatars/classes/models";
import { giveMonsterName } from "./clients/babylon/avatars/classes/monsters/namesMonsters";
import { distance } from "./clients/babylon/others/tools";
import { SceneFictive } from "./clients/babylon/scene/sceneFictive";
import { ConnectionServer, ws } from "./clients/connection/connectionFictive";
import { position, serverMessages } from "./clients/connection/connectionSoft";
import { windowExists } from "./clients/reactComponents/tools";

var scene: SceneFictive;
var doOne = true

export var canvas: HTMLCanvasElement;

export function main() {
  // console.log(123);

  if (doOne) doOne = false
  else return

  var engine: Engine

  if (windowExists()) {
    engine = new Engine(canvas);
    scene = new SceneFictive(engine)
    scene.activeCamera?.attachControl(true)
    new PointLight("Omni", new Vector3(20, 20, 100), scene);
    var light = new PointLight("pointLight", new Vector3(1, 10, 1), scene);
  } else {
    engine = new NullEngine();
    scene = new SceneFictive(engine)
  }


  engine.runRenderLoop(() => {
    scene.render()
  });

  var port = process ? process.argv[2] : "8080"
  ConnectionServer.setGlobalWebSocket(scene, port)

  setInterval(() => {
    if (ws.monster_list.size > 0) {
      // let fps = engine.getFps()
      // console.log(fps.toFixed() + " fps");
      // let fpsRatio = 60 / engine.getFps()
      for (const monster of ws.monster_list.values()) {
        // monster.applyGravity(10 * fpsRatio)
        monster.applyGravity(30)
        zombie_apply_AI(monster);
      }
      ws.send(make_pos_list_msg());
    }
  },
    100)
}

function make_pos_list_msg() {
  let message = []
  for (const monster of ws.monster_list.values()) {
    message.push(
      JSON.stringify({
        username: monster.name,
        pos_x: monster.shape.position.x,
        pos_y: monster.shape.position.y,
        pos_z: monster.shape.position.z,
        direction: JSON.stringify(monster.shape.getDirection(Axis.Z)),
        status: monster.getStatus()
      })
    )
  }
  return JSON.stringify({
    route: serverMessages.MONSTER_POSITION_LIST,
    content: JSON.stringify(message)
  })
}


function zombie_apply_AI(monster: AvatarSoft) {

  monster.setRayPosition()

  let player_to_target: AvatarSoft | null = nearest_player(monster);
  if (player_to_target) {
    //zombie looks at the nearest player
    monster.shape.lookAt(new Vector3(player_to_target.shape.position.x, monster.shape.position.y, player_to_target.shape.position.z));
    //zombie hit if the nearest player is in his range
    if (monster.canHit && distance(monster.shape.position, player_to_target.shape.position) < 2.5) {
      ws.send(
        JSON.stringify({
          route: serverMessages.MONSTER_HIT,
          content: JSON.stringify({
            username: monster.name,
            hitmode: "ATTACK_0"
          })
        })
      )
      monster.update_status("Punching")
      monster.canHit = false;
      monster.canMove = false;
      setTimeout(() => {
        if (monster) monster.canHit = true
        if (monster) monster.canMove = true
      }, 2000)
    } else if (monster.canMove && distance(monster.shape.position, player_to_target.shape.position) > 2.5) {
      var direction = monster.shape.getDirection(Axis.Z);
      monster.shape.moveWithCollisions(direction.scale(monster.speed_coeff * 6));
      monster.update_status("Running")
    }
  }
  monster.shape.computeWorldMatrix(true);
}

export function generate_zombie_wave() {
  console.log(ws.player_list.values());

  for (var player of ws.player_list.values()) {

    //for (var i = 0; i < 3; i++) {
    var zombie_x = Math.random() > 0.5 ? player.shape.position.x + 5 + Math.random() * 10 : player.shape.position.x - 5 - Math.random() * 10
    var zombie_z = Math.random() > 0.5 ? player.shape.position.z + 5 + Math.random() * 10 : player.shape.position.z - 5 - Math.random() * 10
    var zombie_y = 0
    var height = scene.getHeightAtPoint(zombie_x, zombie_z)
    if (!height) break;
    if (height) zombie_y = height + 3
    spawn_zombie({
      pos_x: zombie_x,
      pos_y: zombie_y,
      pos_z: zombie_z
    });
    //}
  }
}

function spawn_zombie({ pos_x, pos_y, pos_z }: position) {
  let name = giveMonsterName()
  // TODO : here we should pass the monster class
  let generated_zombie = new AvatarFictive(scene, name, ModelEnum.NightMonster.intrinsicParameterMesh);
  generated_zombie.shape.position = new Vector3(pos_x, pos_y, pos_z);
  ws.monster_list.set(generated_zombie.name, generated_zombie);
  generated_zombie.shape.computeWorldMatrix(true);
  ws.send(JSON.stringify({
    route: serverMessages.SPAWN_MONSTER,
    content: JSON.stringify({
      pos_x: generated_zombie.shape.position.x,
      pos_y: generated_zombie.shape.position.y,
      pos_z: generated_zombie.shape.position.z,
      username: generated_zombie.name,
      direction: JSON.stringify(generated_zombie.shape.getDirection(Axis.Z)),
      health: generated_zombie.currentHealth,
    })
  }))
}

function nearest_player(monster: AvatarSoft) {
  var nearest_player: AvatarSoft | null = null;
  var dist = Infinity
  for (var player of ws.player_list.values()) {
    let dist_to_player = distance(monster.shape.position, player.shape.position);
    if (dist_to_player < dist) {
      dist = dist_to_player
      nearest_player = player
    }
  }
  return nearest_player
}

