import clsx from "clsx";
import { ActionButton } from "./custom/ActionButton";
import { RuleGroup } from "./custom/RuleGroup";
import { ValueEditor } from "./custom/ValueEditor";
import { materialControlElements } from './theme';
import { defaultTranslations } from "react-querybuilder";
import { Rule } from "./custom/Rule";


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

export const operators = [
  { name: 'filter', label: 'filter' },
  { name: 'filter_path', label: 'filter path' },
  { name: 'datatype', label: 'datatype' },
  // { name: 'group_prim', label: 'group primary' },
  // { name: 'group_sec', label: 'group secondary' },
]
