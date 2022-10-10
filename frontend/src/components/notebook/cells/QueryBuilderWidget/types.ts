import { RuleGroupType } from "react-querybuilder";
import { OptionType } from "../../../input/VariableInput";


export interface QueryBuilderData {
  tree: RuleGroupType,
  select: OptionType[],
  limit?: number;

  wikidata?: boolean;
  output_mode?: string;
}
