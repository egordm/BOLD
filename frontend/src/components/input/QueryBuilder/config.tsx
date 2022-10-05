import MuiWidgets from "./widgets/base";
import { BaseWidget, BasicConfig } from 'react-awesome-query-builder';
import React from "react";
import TermPOWidget from "./widgets/TermPOWidget";
import TermPVWidget from "./widgets/TermPVWidget";
import TermPWidget from "./widgets/TermPWidget";

const {
  MuiBooleanWidget,
  MuiTextWidget,
  MuiTextAreaWidget,
  MuiDateWidget,
  MuiTimeWidget,
  MuiDateTimeWidget,
  MuiMultiSelectWidget,
  MuiSelectWidget,
  MuiNumberWidget,
  MuiSliderWidget,
  MuiRangeWidget,
  MuiAutocompleteWidget,

  MuiFieldSelect,
  MuiFieldAutocomplete,
  MuiConjs,
  MuiSwitch,
  MuiButton,
  MuiButtonGroup,
  MuiValueSources,

  MuiProvider,
  MuiConfirm,
  MuiUseConfirm,
} = MuiWidgets;

export const stringifyForDisplay = (v) => (v == null ? "NULL" : v.toString());


const settings = {
  ...BasicConfig.settings,

  renderField: (props) => props?.customProps?.showSearch
    ? <MuiFieldAutocomplete label="Subject" {...props} />
    : <MuiFieldSelect label="Subject" {...props} />,
  renderOperator: (props) => <MuiFieldSelect label="Operator" {...props} />,
  renderFunc: (props) => <MuiFieldSelect {...props} />,
  renderConjs: (props) => <MuiConjs {...props} />,
  renderSwitch: (props) => <MuiSwitch {...props} />,
  renderButton: (props) => <MuiButton {...props} />,
  renderButtonGroup: (props) => <MuiButtonGroup {...props} />,
  renderValueSources: (props) => <MuiValueSources {...props} />,
  renderProvider: (props) => <MuiProvider {...props} />,
  renderConfirm: MuiConfirm,
  useConfirm: MuiUseConfirm,
};

interface WidgetType extends BaseWidget {
  [key: string]: any;
}

const widgets: WidgetType[] = {
  ...BasicConfig.widgets,
  text: {
    ...BasicConfig.widgets.text,
    factory: (props) => <MuiTextWidget {...props} />,
  },
  textarea: {
    ...BasicConfig.widgets.textarea,
    factory: (props) => <MuiTextAreaWidget {...props} />,
  },
  number: {
    ...BasicConfig.widgets.number,
    factory: (props) => <MuiNumberWidget {...props} />,
  },
  multiselect: {
    ...BasicConfig.widgets.multiselect,
    factory: (props) => {
      return (props.asyncFetch || props.showSearch)
        ? <MuiAutocompleteWidget multiple {...props} />
        : <MuiMultiSelectWidget {...props} />;
    },
  },
  select: {
    ...BasicConfig.widgets.select,
    factory: (props) => {
      return (props.asyncFetch || props.showSearch)
        ? <MuiAutocompleteWidget {...props} />
        : <MuiSelectWidget {...props} />;
    },
  },
  slider: {
    ...BasicConfig.widgets.slider,
    factory: (props) => <MuiSliderWidget {...props} />,
  },
  boolean: {
    ...BasicConfig.widgets.boolean,
    factory: (props) => <MuiBooleanWidget {...props} />,
  },
  date: {
    ...BasicConfig.widgets.date,
    factory: (props) => <MuiDateWidget {...props} />,
  },
  time: {
    ...BasicConfig.widgets.time,
    factory: (props) => <MuiTimeWidget {...props} />,
  },
  datetime: {
    ...BasicConfig.widgets.datetime,
    factory: (props) => <MuiDateTimeWidget {...props} />,
  },

  rangeslider: {
    type: "number",
    jsType: "number",
    valueSrc: "value",
    factory: (props) => <MuiRangeWidget {...props} />,
    valueLabel: "Range",
    valuePlaceholder: "Select range",
    valueLabels: [
      { label: "Number from", placeholder: "Enter number from" },
      { label: "Number to", placeholder: "Enter number to" },
    ],
    formatValue: (val, fieldDef, wgtDef, isForDisplay) => {
      return isForDisplay ? stringifyForDisplay(val) : JSON.stringify(val);
    },
    singleWidget: "slider",
    toJS: (val, fieldSettings) => (val),
  },

  filter: {
    // @ts-ignore
    type: "text",
    valueSrc: "value",
    fieldSettings: {
      propertyLabel: 'Filter values of',
      objectLabel: 'Matching values'
    },
    factory: (props) => <TermPOWidget {...props} />,
  },
  filterPath: {
    // @ts-ignore
    type: "text",
    valueSrc: "value",
    fieldSettings: {
      propertyLabel: 'Filter paths of',
      objectLabel: 'Matching values'
    },
    factory: (props) => <TermPOWidget {...props} />,
  },
  groupBy: {
    type: "text",
    valueSrc: "value",
    fieldSettings: {
      propertyLabel: 'Group by',
      objectLabel: 'Take values',
      objectValue: 'All',
      showObject: true,
    },
    factory: (props) => <TermPWidget {...props} />,
  },
  groupByTemporally: {
    type: "text",
    valueSrc: "value",
    fieldSettings: {
      propertyLabel: 'Group temporally by',
      objectLabel: 'Use values as timestamps',
      objectValue: 'All',
      showObject: true,
    },
    factory: (props) => <TermPWidget {...props} />,
  },
  wildcardBy: {
    type: "text",
    valueSrc: "value",
    fieldSettings: {
      propertyLabel: 'Select Predicate Values Into',
      objectLabel: 'Variable',
      showObject: true,
    },
    factory: (props) => <TermPVWidget {...props} />,
  },
};


const types = {
  ...BasicConfig.types,
  number: {
    ...BasicConfig.types.number,
    widgets: {
      ...BasicConfig.types.number.widgets,
      rangeslider: {
        opProps: {
          between: {
            isSpecialRange: true,
          },
          not_between: {
            isSpecialRange: true,
          }
        },
        operators: [
          "between",
          "not_between",
          "is_empty",
          "is_not_empty",
        ],
      }
    },
  },

  subject_term: {
    defaultOperator: "equal",
    mainWidget: "text",
    widgets: {
      filter: {
        operators: [
          "filter",
        ],
        widgetProps: {},
        opProps: {},
      },
      filterPath: {
        operators: [
          "filterPath",
        ],
        widgetProps: {},
        opProps: {},
      },
      groupBy: {
        operators: [
          "groupBy",
        ],
        widgetProps: {},
        opProps: {},
      },
      groupByTemporally: {
        operators: [
          "groupByTemporally",
        ],
        widgetProps: {},
        opProps: {},
      },
      wildcardBy: {
        operators: [
          "wildcardBy",
        ],
        widgetProps: {},
        opProps: {},
      },
    },
  }
};

export const wildcardField = {
  label: 'Wildcard',
  type: "subject_term",
  fieldSettings: {
    label: 'Filter values of',
  } as any,
  valueSources: [ "value" ],
}

const operators = {
  ...BasicConfig.operators,
  filter: {
    label: "Filter",
    labelForFormat: "Filter",
    jsonLogic: "filter",
  },
  filterPath: {
    label: "Filter path",
    labelForFormat: "Filter path",
    jsonLogic: "filter_path",
  },
  groupBy: {
    label: "Group By",
    labelForFormat: "Group By",
    jsonLogic: "group_by",
  },
  groupByTemporally: {
    label: "Group By Temporally",
    labelForFormat: "Group By Temporally",
    jsonLogic: "group_by_temporal",
  },
  wildcardBy: {
    label: "Select Into",
    labelForFormat: "Select Into",
    jsonLogic: "wildcard_by",
  },
}

const fields = () => {
  const fields = {};
  for (let i = 0; i < 10; i++) {
    fields[`var${i}`] = {
      ...wildcardField,
      label: `var${i}`,
    }
  }
  return fields;
}

export const QueryBuilderConfig = {
  ...BasicConfig,
  types,
  widgets,
  settings,
  operators,
  fields: fields(),
};

