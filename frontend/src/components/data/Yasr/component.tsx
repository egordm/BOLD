import { default as YasrTable, Config as YasrConfig } from "@triply/yasr";
import _ from "lodash";
import React from "react";

export type YasrResult = {
  data: string;
  contentType: string;
  status: number;
  executionTime: number;
}


export class Yasr extends React.Component<{
  result?: YasrResult;
  prefixes?: { [prefix: string]: string };
}, {}> {
  containerRef: React.RefObject<HTMLDivElement>;
  table: YasrTable;

  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
  }

  componentDidMount = () => {
    this.initialize();
  }

  initialize = () => {
    const config: Partial<YasrConfig> = {
      prefixes: this.props.prefixes || undefined,
    }

    this.table = new YasrTable(this.containerRef.current, config);
    if (this.props.result) {
      this.table.setResponse(this.props.result);
    }
  }

  componentWillUnmount = () => {
    if (this.table) {
      this.table.destroy();
    }
  }

  UNSAFE_componentWillReceiveProps = (nextProps) => {
    if (this.table && nextProps.result) {
      this.table.setResponse(nextProps.result);
    }

    if (this.table && !_.isEqual(this.props.prefixes, nextProps.prefixes)) {
      this.table.destroy();
      this.initialize();
    }
  }

  render() {
    return <div ref={this.containerRef}/>;
  }
}
