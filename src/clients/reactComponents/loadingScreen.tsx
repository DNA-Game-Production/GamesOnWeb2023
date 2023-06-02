import { Component, ReactNode } from "react";
import { Col, ProgressBar, Row } from "react-bootstrap";
import { ModelEnum } from "../babylon/avatars/classes/models";
import { SECTION } from "./main";

type Props = { setSection: (section: SECTION) => void }

export class ReactLoadingScreen extends Component<Props, { content: number, end: boolean }> {
  constructor(props: Props) {
    super(props)
    this.state = {
      content: 0,
      end: false
    }
  }

  updateContent() {
    let content = ((1 - ModelEnum.remainingLoad / ModelEnum.totalLoad) * 100);
    this.setState({ content });
    if (ModelEnum.remainingLoad === 0) {
      setTimeout(() => {
        this.setState({ end: true })
      }, 1500);
      setTimeout(() => {
        this.props.setSection("GAME");
      }, 8000);
    }
  }

  numToStr() {
    return this.state.end ? "You are about to enter the game!" : "Loading:" + this.state.content.toFixed(2) + "%"
  }

  render(): ReactNode {
    let rowParam = "justify-content-center px-3 text-white "
    return <Col className="col-xl-4 col-md-6 col-9">
      <Row className={rowParam}>{this.numToStr()} </Row>
      <ProgressBar animated now={this.state.content} className="p-0" />
    </Col>
  }
}


