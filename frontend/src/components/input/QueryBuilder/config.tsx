import clsx from "clsx";
import { Prefixes } from "../../../types/sparql";
import { ActionButton } from "./custom/ActionButton";
import { RuleGroup } from "./custom/RuleGroup";
import { ValueEditor } from "./custom/ValueEditor";
import { materialControlElements } from './theme';
import { defaultTranslations } from "react-querybuilder";
import { Rule } from "./custom/Rule";
import { OperatorType } from "./types";


export const controlElements = {
  ...materialControlElements,
  addGroupAction: (props) => (<ActionButton type="addGroup" {...props as any}/>),
  addRuleAction: (props) => (<ActionButton type="addRule" {...props as any}/>),
  removeGroupAction: (props) => (<ActionButton type="delGroup" {...props as any}/>),
  removeRuleAction: (props) => (<ActionButton type="delRule" {...props as any}/>),
  ruleGroup: RuleGroup,
  valueEditor: ValueEditor,
  rule: Rule
}

export const translations = {
  ...defaultTranslations,
  "addGroup": {
    "label": "ADD GROUP",
    "title": "Add group"
  },
  "addRule": {
    "label": "ADD RULE",
    "title": "Add rule"
  },
}

export const controlClassnames = {
  queryBuilder: 'query-builder',
  ruleGroup: clsx('group', 'group-or-rule'),
  rule: clsx('rule', 'group-or-rule'),
  header: 'group--header',
  body: 'group--children',
  dragHandle: clsx('qb-drag-handler', 'rule--drag-handler')
}

export const operators: { name: OperatorType, label: string }[] = [
  { name: 'filter', label: 'filter' },
  { name: 'datatype', label: 'datatype' },
  { name: 'operator', label: 'operator' },
  { name: 'subclass_of', label: 'subclass of' },
  { name: 'instance_of', label: 'instance of' },
  { name: 'function', label: 'function' },
]


export interface QueryContext {
  variables: string[],
  prefixes: Prefixes,
  datasetId: string,
  wikidata: boolean,
}
