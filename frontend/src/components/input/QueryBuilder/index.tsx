import { Button } from "@mui/material";
import { useMemo, useState } from 'react';
import type { Field, RuleGroupType } from 'react-querybuilder';
import { formatQuery, QueryBuilder } from 'react-querybuilder';
import { usePrefixes, useReportContext } from "../../../providers/ReportProvider";
import { controlClassnames, controlElements, operators, translations } from "./config";
import './styles.css';
import { partialToSparql, queryToSparql } from "./sparql";

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
}: {
  value: RuleGroupType,
  setValue: (tree: RuleGroupType) => void
}) => {
  const prefixes = usePrefixes();
  const { report } = useReportContext();

  const context = useMemo(() => {
    const vars = new Set<string>();
    vars.add('main')
    if (value?.combinator) {
      collectVars(value, vars);
    }

    return {
      variables: Array.from(vars),
      prefixes,
      datasetId: report?.dataset?.id,
    }
  }, [ value, prefixes, report ]);

  return (
    <div>
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
      <h4>Query</h4>
      <pre>
        <code>{queryToSparql(value as any).toString()}</code>
      </pre>
      <pre>
        <code>{formatQuery(value, 'json')}</code>
      </pre>
    </div>
  );
};


const collectVars = (group: RuleGroupType | any, vars: Set<string>) => {
  if (group.variable?.value) {
    vars.add(group.variable.value);
  }

  if (group?.value?.input?.variable?.value) {
    vars.add(group.value.input.variable.value);
  }

  if (group?.value?.predicate?.variable?.value) {
    vars.add(group.value.predicate.variable.value);
  }

  if (group.rules) {
    for (const rule of group.rules) {
      collectVars(rule, vars);
    }
  }
}
