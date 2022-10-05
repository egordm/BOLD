import { Field, isOptionGroupArray, OptionGroup, standardClassnames, ValidationResult } from "react-querybuilder";

export const filterFieldsByComparator = (
  field: Field,
  fields: Field[] | OptionGroup<Field>[],
  operator: string
) => {
  if (!field.comparator) {
    const filterOutSameName = (f: Field) => f.name !== field.name;
    if (isOptionGroupArray(fields)) {
      return fields.map(og => ({ ...og, options: og.options.filter(filterOutSameName) }));
    }
    return fields.filter(filterOutSameName);
  }

  const filterByComparator = (fieldToCompare: Field) => {
    if (field.name === fieldToCompare.name) {
      return false;
    }
    if (typeof field.comparator === 'string') {
      return field[field.comparator] === fieldToCompare[field.comparator];
    }
    return field.comparator!(fieldToCompare, operator);
  };

  if (isOptionGroupArray(fields)) {
    return fields
      .map(og => ({ ...og, options: og.options.filter(filterByComparator) }))
      .filter(og => og.options.length > 0);
  }

  return fields.filter(filterByComparator);
};

export const getValidationClassNames = (validationResult: boolean | ValidationResult) => {
  const valid =
    typeof validationResult === 'boolean'
      ? validationResult
      : typeof validationResult === 'object' && validationResult !== null
        ? validationResult.valid
        : null;
  return typeof valid === 'boolean'
    ? valid
      ? standardClassnames.valid
      : standardClassnames.invalid
    : '';
};
