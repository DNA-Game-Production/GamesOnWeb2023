import { ArcRotateCamera, Axis, Engine, PointLight, Vector3 } from "babylonjs";
import { AvaterInterface as AvatarInterface } from "./AvatarInterface";
import { MyScene } from "./clients/babylon/scene/fictive_myScene";
import { Avatar } from "./clients/fictif/fictive_avatar";
import { receiveContent, serverMessages } from "./clients/fictif/fictive_connectionWS";
import { distance } from "./clients/fictif/fictive_tools";

var night_monster_list: Map<string, AvatarInterface> = new Map();
var player_list: Map<string, AvatarInterface> = new Map();
var zombie_counter: number;
var scene: MyScene;
var ws: WebSocket

export var canvas: HTMLCanvasElement;

export function main() {

  // var BABYLON = require("../../dist/preview release/babylon.max");
  // var LOADERS = require("../../dist/preview release/loaders/babylonjs.loaders");
  // var XMLHttpRequest = require('xhr2');
  // var xhr = new XMLHttpRequest();

  var canvas = document.getElementById("canvas") as HTMLCanvasElement
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  var engine = new Engine(canvas);
  scene = new MyScene(engine)
  var light = new PointLight("Omni", new Vector3(20, 20, 100), scene);
  var camera = new ArcRotateCamera("Camera", 0, 0.8, 15, Vector3.Zero(), scene);
  camera.attachControl(true);


  engine.runRenderLoop(() => scene.render());


  zombie_counter = 0;

  var port = "8080"
  var adr = "ws://127.0.0.1:" + port
  ws = new WebSocket(adr);

  ws.onerror = () => {
    console.log("error trying to connect to socket on " + adr);
  };


  //we start our request process when the connection is established
  ws.onopen = () => {

    //ecoute les infos zombie du serveur
    ws.addEventListener('message', function (event) {
      let messageReceived = JSON.parse(event.data);
      switch (messageReceived.route) {

        //logout route: dispose player's avatar, remove player's entry in the player_list map
        case serverMessages.LOGOUT: {
          let avatar_to_disconnect = player_list.get(messageReceived.content);
          if (avatar_to_disconnect !== undefined) avatar_to_disconnect.dispose();
          player_list.delete(messageReceived.content);
          console.log("LOGIN OUT: " + messageReceived.content);
          break;
        }

        //position: add the player if they aren't in our list yet, move the avatar to the input position
        case serverMessages.POSITION: {
          let messageContent: receiveContent = JSON.parse(messageReceived.content);
          let avatar_to_update = player_list.get(messageContent.username);
          if (avatar_to_update === undefined) {
            player_list.set(messageContent.username, new Avatar(scene, messageContent.username, messageContent.health));
            avatar_to_update = player_list.get(messageContent.username);
          }
          if (avatar_to_update) {
            avatar_to_update.position = new Vector3(messageContent.pos_x, messageContent.pos_y, messageContent.pos_z)
          }
          break;
        }

        //kill_monster: kill the monster with passed username
        case serverMessages.KILL_MONSTER: {
          console.log("killing monster " + messageReceived.content);
          let monster_to_kill = night_monster_list.get(messageReceived.content);
          if (monster_to_kill !== undefined) monster_to_kill.dispose();
          night_monster_list.delete(messageReceived.content);
          break;
        }

        //handle hour event
        case serverMessages.HOUR: {
          let hour = messageReceived.content;
          //tue les monstres de nuit si il fait jour
          if (hour == 7) {
            for (const value of night_monster_list.values()) {
              value.dispose();
            }
            night_monster_list.clear();
            zombie_counter = 0;
          }
          if (hour == 22) {
            generate_zombie_wave()
          }
        }

        //default
        default: { }
      }
    })

    // engine.runRenderLoop(function () {
    //   if (scene && scene.activeCamera) {
    //     for (const monster of night_monster_list.values()) {
    //       //scene.applyGravity(monster);
    //       monster.moveWithCollisions(monster.getDirection(Axis.Z).scale(monster.speed_coeff));
    //       console.log("monster " + monster.name + " pos: " + monster.position);
    //     }
    //   }
    // });

    setInterval(() => {
      for (const monster of night_monster_list.values()) {
        // monster.moveWithCollisions(monster.getDirection(Axis.Z).scale(monster.speed_coeff));
        scene.applyGravity(monster);
        monster.setRayPosition();
      }
    }, 1000 / 60)

    setInterval(() => {
      for (const monster of night_monster_list.values()) {
        zombie_apply_AI(monster);
      }
    },
      100)
  }
}

function zombie_apply_AI(monster: AvatarInterface) {
  let player_to_target: AvatarInterface | null = nearest_player(monster);
  if (player_to_target) {
    monster.lookAt(new Vector3(player_to_target.position.x, monster.position.y, player_to_target.position.z));
    if (distance(monster.position, player_to_target.position) < 2) {
      ws.send(
        JSON.stringify({
          route: serverMessages.MONSTER_HIT,
          content: JSON.stringify({
            username: monster.name,
            hitmode: 0
          })
        })
      )
    }
  }
  monster.computeWorldMatrix(true);
  // monster.position.x += monster.getDirection(Axis.Z)._x
  // monster.position.z += monster.getDirection(Axis.Z)._z
  monster.moveWithCollisions(monster.getDirection(Axis.Z).scale(monster.speed_coeff * 6))
  ws.send(
    JSON.stringify({
      route: serverMessages.MOVE_MONSTER,
      content: JSON.stringify({
        username: monster.name,
        pos_x: monster.position.x,
        pos_y: monster.position.y,
        pos_z: monster.position.z,
        direction: JSON.stringify(monster.getDirection(Axis.Z))
      })
    }))
  if (monster.name === "zombie0")
    console.log("" + monster.name + " : " + monster.position);

}

function generate_zombie_wave() {
  var counter_after_wave = Math.round(Math.random() * 3) + 3 + zombie_counter

  while (zombie_counter < counter_after_wave) {
    spawn_zombie(zombie_counter + Math.random() * 5, 1, zombie_counter + Math.random() * 5);
  }
}

function spawn_zombie(pos_x: number, pos_y: number, pos_z: number) {
  let generated_zombie = new Avatar(scene, "zombie" + zombie_counter);
  generated_zombie.position = new Vector3(pos_x, pos_y, pos_z);
  night_monster_list.set(generated_zombie.name, generated_zombie);
  generated_zombie.computeWorldMatrix(true);
  ws.send(JSON.stringify({
    route: serverMessages.SPAWN_MONSTER,
    content: JSON.stringify({
      pos_x: generated_zombie.position.x,
      pos_y: generated_zombie.position.y,
      pos_z: generated_zombie.position.z,
      username: generated_zombie.name,
      direction: JSON.stringify(generated_zombie.getDirection(Axis.Z)),
      health: generated_zombie.currentHealth,
    })
  }))
  zombie_counter++
}

function nearest_player(monster: AvatarInterface) {
  var nearest_player: AvatarInterface | null = null;
  var dist = Infinity
  for (var player of player_list.values()) {
    let dist_to_player = distance(monster.position, player.position);
    if (dist_to_player < dist) {
      dist = dist_to_player
      nearest_player = player
    }
  }
  return nearest_player
}
