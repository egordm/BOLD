import _ from "lodash";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Builder,
  ImmutableTree,
  JsonTree,
  Query,
  Utils as QbUtils,
  Config,
  JsonGroup
} from "react-awesome-query-builder";
import { usePrefixes, useReportContext } from "../../../providers/ReportProvider";
import { QueryBuilderConfig, wildcardField } from "./config";

const queryValue = { "id": QbUtils.uuid(), "type": "group" };


export default ({ initialValue, setValue }: {
  initialValue: JsonTree,
  setValue: (tree: JsonTree) => void
}) => {
  const { report } = useReportContext();
  const prefixes = usePrefixes();

  const [ config, setConfigInternal ] = React.useState<Config>({
    ...QueryBuilderConfig,
    settings: {
      ...QueryBuilderConfig.settings,
      notebook: {
        datasetId: report?.dataset?.id,
        prefixes,
      }
    }
  } as any);
  const configRef = React.useRef(config);
  const setConfig = useCallback((config) => {
    configRef.current = config;
    setConfigInternal(config);
  }, []);

  const treeRef = React.useRef<ImmutableTree>(QbUtils.checkTree(QbUtils.loadTree(initialValue ?? DEFAULT_VALUE), config));

  useEffect(() => {
    setConfig({
      ...configRef.current,
      settings: {
        ...configRef.current.settings,
        notebook: {
          datasetId: report?.dataset?.id,
          prefixes,
        }
      }
    } as any)
  }, [ report?.dataset?.id, prefixes ]);

  const onChange = useCallback((immutableTree, config) => {
    treeRef.current = immutableTree;
    const jsonTree = QbUtils.getTree(immutableTree);
    setValue(jsonTree);
    setConfig(config);
  }, []);

  const renderBuilder = useCallback((props) => (
    <div className="query-builder-container">
      <div className="query-builder qb-lite">
        <Builder {...props} />
      </div>
    </div>
  ), []);

  return (
    <Query
      {...config}
      value={treeRef.current}
      onChange={onChange}
      renderBuilder={renderBuilder}
    />
  )
}

const DEFAULT_VALUE: JsonGroup = {
  "id": QbUtils.uuid(),
  "type": "group",
  "children1": {
    "aab89a88-4567-489a-bcde-f1838dc13e4c": {
      "type": "rule",
      // "id": QbUtils.uuid(),
      "properties": {
        "field": "var0",
        "operator": "groupBy",
        "value": [
          null
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "text"
        ]
      }
    } as any
  }
};
