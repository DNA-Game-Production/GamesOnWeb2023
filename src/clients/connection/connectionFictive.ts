import { Vector3 } from "babylonjs";
import { generate_zombie_wave } from "../../indexServer";
import { AvatarFictive } from "../babylon/avatars/avatarFictif";
import { ModelEnum } from "../babylon/avatars/classes/models";
import { SceneFictive } from "../babylon/scene/sceneFictive";
import { ConnectionSoft, knockbackContent, receiveContent, serverMessages } from "./connectionSoft";

export let ws: ConnectionServer;

export class ConnectionServer extends ConnectionSoft<AvatarFictive, AvatarFictive, AvatarFictive, SceneFictive>{
  constructor(scene: SceneFictive, port: string) {
    super("ws://127.0.0.1:" + port, scene)
  }

  onOpen(evt?: Event | undefined) {
    this.setEventListener()
  }
  onError() {
    throw new Error("IA-Server can't connect to server !");
  }
  set_username(messageReceived: any): void {
  }
  login(messageReceived: any): void {
    // throw new Error("Method not implemented.");
  }
  message(messageReceived: any): void {
  }
  monster_data(messageReceived: any): void {
    // throw new Error("Method not implemented.");
  }
  move_monster(messageReceived: any): void {
  }
  damage_monster(messageReceived: any): void {
  }
  player_hit(messageReceived: any): void {
  }
  position(messageReceived: any): void {
    let messageContent: receiveContent = JSON.parse(messageReceived.content);
    let avatar_to_update = this.player_list.get(messageContent.username);
    if (avatar_to_update === undefined) {
      this.player_list.set(messageContent.username, new AvatarFictive(this.scene!, messageContent.username, ModelEnum.PumpkinMonster.intrinsicParameterMesh));
      avatar_to_update = this.player_list.get(messageContent.username);
    }
    if (avatar_to_update) {
      avatar_to_update.shape.position = new Vector3(messageContent.pos_x, messageContent.pos_y, messageContent.pos_z)
    }
  }

  hour(messageReceived: any): void {
    let hour = messageReceived.content;

    //tue les monstres de nuit quand le jour se lève
    if (hour === "8") {
      for (const value of this.monster_list.values()) {
        value.dispose();
      }
      this.monster_list.clear();
      ws.send(JSON.stringify({
        route: serverMessages.KILL_ALL_NIGHT_MONSTER,
        content: ""
      }))
    }
    if (hour === "22" || hour === "1" || hour === "4") {
      generate_zombie_wave()
    }
    // console.log(hour);

  }

  spawn_monster(messageReceived: any): void {
  }

  monster_hit(messageReceived: any): void {
  }

  knockback_monster(messageReceived: any): void {
    let messageContent: knockbackContent = JSON.parse(messageReceived.content);
    let monster = this.monster_list.get(messageContent.username)
    if (monster) {
      let direction_knockback = new Vector3(messageContent.direction._x, messageContent.direction._y, messageContent.direction._z)
      monster.knockback(direction_knockback, messageContent.power)
    }
  }

  static setGlobalWebSocket(scene: SceneFictive, port: string): void {
    ws = new ConnectionServer(scene, port);
  }
}