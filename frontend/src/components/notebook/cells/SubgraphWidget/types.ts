import { FlexibleTerm } from "../../../input/FlexibleTermInput";


export interface SubgraphWidgetData {
  entity?: FlexibleTerm;
  predicates?: FlexibleTerm;
  anyPredicate?: boolean;
  limit?: number;
  depth?: number;
  output_mode?: string;
}
