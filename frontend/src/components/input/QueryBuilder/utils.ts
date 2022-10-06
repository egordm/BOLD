import { RuleGroupType } from "react-querybuilder";

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

export const collectVarsFromGroup = (group: RuleGroupType | any): string[] => {
  const vars = new Set<string>();
  vars.add('main');
  if (group?.combinator) {
    collectVars(group, vars);
  }
  return Array.from(vars);
}
