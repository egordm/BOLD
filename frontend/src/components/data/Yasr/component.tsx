import { default as YasrTable, Config as YasrConfig, Parser, PersistentConfig as YasrPersistentConfig } from "@triply/yasr";
import _ from "lodash";
import React from "react";


export class Yasr extends React.Component<{
  result?: Parser.ResponseSummary;
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
      errorRenderers: [
        // Add default renderers to the end, to give our custom ones priority.
        ...(YasrTable.defaults.errorRenderers || []),
      ],
    }

    const settings: YasrPersistentConfig = {
      pluginsConfig: {
        table: {
          pageSize: 20,
        }
      }
    }

    this.table = new YasrTable(this.containerRef.current, config, settings);
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
