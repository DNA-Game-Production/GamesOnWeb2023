import { Component, ReactNode } from "react";
import { Button, Col, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import Row from "react-bootstrap/esm/Row";
import { PLAYER_CLASSES_LIST, PLAYER_CLASSES_TYPE } from "../babylon/avatars/classes/classesTypes";
import { ConnectionClient } from "../connection/connectionClient";
import { SECTION } from "./main";

type State = {
  name: string,
  class: PLAYER_CLASSES_TYPE
}

type Props = { setSection: (section: SECTION) => void }

export class ReactLogin extends Component<Props, State> {
  constructor(p: Props) {
    super(p);
    this.state = {
      name: "",
      class: PLAYER_CLASSES_LIST[0]
    }
  }

  goToLoadingPanel() {
    var audio = new Audio('/audio/track1-day.mp3');
    audio.loop = true;
    audio.volume = 0.1;
    audio.play();
    ConnectionClient.setGlobalWebSocket(this.state.class, this.state.name)
    this.props.setSection("LOADING")
  }

  render(): ReactNode {
    let bgOpaque = (b: boolean) => {
      document.getElementById('bgIsland')!.style.opacity = b ? "0.4" : "1";
    }
    let rowParam = "justify-content-center px-3 text-white text-center "
    return <div style={{
      // backgroundImage: `url("./img/bg.jpg")`
    }} id="bgIsland" className="d-flex align-items-center justify-content-center fullHeight container-fluid">
      <Col className="col-xl-4 col-md-6 col-9">
        <Row className={rowParam}>
          Hi curious explorer !
        </Row>
        <Row className={rowParam} id="story">
          Because of humanity's <pre>greed and avidity,</pre> the planet ran out of resources and society collapsed.<br /> Your are a survivor who took refuge on an archipelago, and have nothing but your will and body to defend yourself.<br /> Your goal is to survive the hostile environment, but be careful: <br /> monsters spawn at night.
        </Row>
        <Row className={rowParam + "mb-3"}>  But before : </Row>

        <Row className={rowParam}>

          <InputGroup size="sm" className="mb-3">
            <InputGroup.Text className="w-25">Your class:</InputGroup.Text>

            <Form.Select
              defaultValue={PLAYER_CLASSES_LIST[0]}
              onChange={e =>
                this.setState({ class: e.currentTarget.value as PLAYER_CLASSES_TYPE })
              }
              style={{ backgroundImage: "none" }}
            >
              <option disabled hidden>{PLAYER_CLASSES_LIST[0]}</option>
              {/* {PLAYER_CLASSES_LIST.map((option, index) => {
                return <option key={index} >
                  {option}
                </option>
              })} */}
            </Form.Select>
          </InputGroup>
        </Row>

        <Row className={rowParam}>
          <InputGroup size="sm" className="mb-3">
            <InputGroup.Text className="w-25">Your name: </InputGroup.Text>
            <Form.Control
              aria-label="Small"
              aria-describedby="inputGroup-sizing-sm"
              autoFocus

              onChange={e => {
                let val = e.currentTarget.value;
                if (val.match(/^([a-z0-9A-Z]|-)*$/) === null) {
                  e.currentTarget.value = val.substring(0, val.length - 1)
                }
                this.setState({ name: e.currentTarget.value! })
              }}

              onKeyDown={e => {
                if (e.key === "Enter" || e.key === "NumpadEnter") {
                  this.goToLoadingPanel()
                }
              }}
            />
          </InputGroup>
          <OverlayTrigger
            key="top"
            placement="top"
            overlay={
              <Tooltip id={`tooltip-top`}>
                <ul>
                  <li> Z : walk forward </li>
                  <li> Z + SHIFT : run forward </li>
                  <li> S : walk backward </li>
                  <li> Q : rotate left </li>
                  <li> D : rotate right </li>
                  <li> Move Mouse: rotate </li>
                  <li> Left Click : Punch </li>
                  <li> Right Click : Throw </li>
                  <li> SPACE : jump </li>
                  <li> SPACE (while falling) : deploy glider </li>
                  <li> ENTER : open the in-game chat </li>
                </ul>
              </Tooltip>
            }
          >
            <Button id="accessButton" className="btn-sm mainButtons" onMouseEnter={() => bgOpaque(true)}
              onMouseLeave={() => bgOpaque(false)}>Controls</Button>
          </OverlayTrigger>
          <Button onClick={this.goToLoadingPanel.bind(this)} id="accessButton" className="btn-sm mainButtons">Enter</Button>
        </Row>
      </Col>
    </div>
  }
}