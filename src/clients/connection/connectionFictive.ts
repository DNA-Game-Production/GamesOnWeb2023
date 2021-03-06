import { Vector3 } from "babylonjs";
import { generate_zombie_wave } from "../../indexServer";
import { AvatarFictive } from "../babylon/avatars/avatarFictif";
import { createBasicShape } from "../babylon/others/tools";
import { SceneFictive } from "../babylon/scene/sceneFictive";
import { ConnectionSoft, receiveContent, serverMessages } from "./connectionSoft";

export let zombie_counter = 0;
export let ws: ConnectionServer;

const port = "8080"

export class ConnectionServer extends ConnectionSoft<AvatarFictive, AvatarFictive, SceneFictive>{
  constructor(scene: SceneFictive) {
    super("ws://127.0.0.1:" + port, scene)
  }

  onOpen(evt?: Event | undefined) {
    this.setEventListener()
  }
  onError() {
    throw new Error("IA-Server can't connect to server !");
  }
  set_username(messageReceived: any): void {
    throw new Error("Method not implemented.");
  }
  login(messageReceived: any): void {
    // throw new Error("Method not implemented.");
  }
  message(messageReceived: any): void {
    throw new Error("Method not implemented.");
  }
  monster_data(messageReceived: any): void {
    // throw new Error("Method not implemented.");
  }
  move_monster(messageReceived: any): void {
    throw new Error("Method not implemented.");
  }
  damage_monster(messageReceived: any): void {
    throw new Error("Method not implemented.");
  }
  fire_bullet(messageReceived: any): void {
    throw new Error("Method not implemented.");
  }
  position(messageReceived: any): void {
    let messageContent: receiveContent = JSON.parse(messageReceived.content);
    let avatar_to_update = this.player_list.get(messageContent.username);
    if (avatar_to_update === undefined) {
      this.player_list.set(messageContent.username, new AvatarFictive(this.scene!, messageContent.username, createBasicShape(messageContent.username, this.scene!), { currentHealth: messageContent.health }));
      avatar_to_update = this.player_list.get(messageContent.username);
    }
    if (avatar_to_update) {
      avatar_to_update.shape.position = new Vector3(messageContent.pos_x, messageContent.pos_y, messageContent.pos_z)
    }
  }

  hour(messageReceived: any): void {
    let hour = messageReceived.content;
    //tue les monstres de nuit quand le jour se l??ve
    if (hour == 8) {
      for (const value of this.night_monster_list.values()) {
        value.dispose();
      }
      this.night_monster_list.clear();
      zombie_counter = 0;
      ws.send(JSON.stringify({
        route: serverMessages.KILL_ALL_NIGHT_MONSTER,
        content: ""
      }
      ))
    }
    if (hour == 22) {
      generate_zombie_wave()
    }
    // console.log(hour);

  }

  spawn_monster(messageReceived: any): void {
    throw new Error("Method not implemented.");
  }

  monster_hit(messageReceived: any): void {
    throw new Error("Method not implemented.");
  }

  static setGlobalWebSocket(scene: SceneFictive): void {
    ws = new ConnectionServer(scene);
  }
}

export function setCounter(value: number) {
  zombie_counter = value
}