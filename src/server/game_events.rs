use tokio::time::{sleep, Duration};
use tungstenite::Message;

pub mod monster;

use crate::{MonsterList, PeerMap};
use monster::*;

pub async fn game_events(peer_map: PeerMap, monster_list: MonsterList) {
    let mut hour = 20.0;
    let mut zombie_counter = 0;

    loop {
        sleep(Duration::from_millis(500)).await;

        //update server hour
        hour += 0.25;
        if hour >= 24.0 {
            hour = 0.0;
        }
        println!("hour: {}", hour);

        //Spawn monsters at night start, remove them at day start
        if hour == 7.0 {
            clear_all_monsters(monster_list.clone(), &mut zombie_counter)
        }

        let peers = peer_map.lock().unwrap();
        let broadcast_recipients = peers.iter().map(|(_, ws_sink)| ws_sink);
        let monster_list = monster_list.lock().unwrap();

        //BROADCAST TO ALL CLIENTS
        for recp in broadcast_recipients {
            //send hour to all clients
            let username_message = format!(r#" {{"route": "hour", "content": "{}"}} "#, hour);
            recp.unbounded_send(Message::from(username_message))
                .unwrap();

            //send updated monster data to all clients
            if hour > 22.0 || hour < 21.0 {
                for monster in monster_list.values() {
                    recp.unbounded_send(Message::from(monster_message_data(monster)))
                        .unwrap();
                }
            }
        }
    }
}
