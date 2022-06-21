export function main() {
  let ws = new WebSocket("wss://mmoactiongameserver.herokuapp.com/");

  ws.onerror = () => {
    console.log("error trying to connect to socket on wss://mmoactiongameserver.herokuapp.com/");

  };


  //we start our request process when the connection is established
  ws.onopen = (e) => {
    //Ask username to user and removes " and ' characters. If user fails to give a username, give them a random id
    setInterval(() => { ws.send("keepalive") }, 5000);
  };
}
