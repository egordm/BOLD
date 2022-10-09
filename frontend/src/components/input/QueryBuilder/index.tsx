import { useMemo } from 'react';
import type { Field, RuleGroupType } from 'react-querybuilder';
import { formatQuery, QueryBuilder } from 'react-querybuilder';
import { usePrefixes, useReportContext } from "../../../providers/ReportProvider";
import { controlClassnames, controlElements, operators, translations } from "./config";
import './styles.css';
import { queryToSparql } from "./sparql";
import { collectVarsFromGroup } from "./utils";

const INITIAL_FIELDS: Field[] = [
  {
    name: 'Unused',
    label: 'unused',
    defaultOperator: 'filter',
  },
];

const INITIAL_VALUE: RuleGroupType = {
  combinator: 'and',
  variable: {
    value: 'main'
  },
  rules: [
    { field: 'unused', operator: 'filter', value: {} },
  ],
} as any;

export default ({
  value, setValue,
  debug = false,
}: {
  value: RuleGroupType,
  setValue: (tree: RuleGroupType) => void,
  debug?: boolean,
}) => {
  const prefixes = usePrefixes();
  const { report } = useReportContext();

  const context = useMemo(() => {
    return {
      variables: collectVarsFromGroup(value),
      prefixes,
      datasetId: report?.dataset?.id,
      wikidata: report?.dataset?.search_mode === 'WIKIDATA',
    }
  }, [ value, prefixes, report ]);

  return (
    <>
      <div className="query-builder-container">
        <QueryBuilder
          showNotToggle={true}
          controlClassnames={controlClassnames}
          translations={translations}
          fields={INITIAL_FIELDS}
          query={value?.combinator ? value : INITIAL_VALUE}
          onQueryChange={q => setValue(q)}
          controlElements={controlElements}
          operators={operators}
          context={context}
        />
      </div>
      {debug && (<>
        <h4>Query</h4>
        <pre>
          <code>{queryToSparql(value as any).toString()}</code>
        </pre>
        <pre>
          <code>{formatQuery(value, 'json')}</code>
        </pre>
      </>)}

    </>
  );
};


