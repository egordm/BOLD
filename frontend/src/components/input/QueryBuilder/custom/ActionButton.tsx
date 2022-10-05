import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Button from '@mui/material/Button';
import IconButton from "@mui/material/IconButton";
import React from "react";
import type { ComponentPropsWithoutRef } from 'react';
import type { ActionWithRulesProps } from 'react-querybuilder';

type MaterialActionProps = ActionWithRulesProps & ComponentPropsWithoutRef<typeof Button>;

export const ActionButton = ({
  type,
  className,
  handleOnClick,
  label,
  title,
  disabled,
  disabledTranslation,
  // Props that should not be in extraProps
  testID: _testID,
  rules: _rules,
  level: _level,
  path: _path,
  context: _context,
  validation: _validation,
  ...extraProps
}: MaterialActionProps) => {
  const typeToOnlyIcon = {
    "delGroup": <DeleteIcon/>,
    "delRuleGroup": <DeleteIcon/>,
    "delRule": <DeleteIcon/>,
    "addRuleGroup": <AddIcon/>,
  };
  const typeToIcon = {
    "addRule": <AddIcon/>,
    "addGroup": <AddIcon/>,
    "addRuleGroupExt": <AddIcon/>,
  };
  const typeToColor = {
    "addRule": "primary",
    "addGroup": "primary",
    "delGroup": "primary",
    "delRuleGroup": "primary",
    "delRule": "primary",
  };

  if (typeToOnlyIcon[type])
    return (
      <IconButton
        size="small"
        color={typeToColor[type]}
        disabled={disabled && !disabledTranslation}
        onClick={e => handleOnClick(e)}
        className={className}
      >
        {typeToOnlyIcon[type]}
      </IconButton>
    );
  else
    return (
      <Button
        startIcon={typeToIcon[type]}
        color={typeToColor[type]}
        className={className}
        title={disabledTranslation && disabled ? disabledTranslation.title : title}
        size="small"
        disabled={disabled && !disabledTranslation}
        onClick={e => handleOnClick(e)}
        {...extraProps}>
        {disabledTranslation && disabled ? disabledTranslation.label : label}
      </Button>
    );
}

ActionButton.displayName = 'MaterialActionElement';
