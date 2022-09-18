import { Autocomplete, Chip, Grid, TextField } from "@mui/material";
import React, { useState } from "react";
import { Dataset } from "../../types/datasets";
import { formatUUIDShort } from "../../utils/formatting";
import { useFetchList } from "../../utils/pagination";


export const DatasetSelectInput = (props: {
  onValueChange?: (value: Dataset[]) => void,
}) => {
  const {
    onValueChange,
    ...rest
  } = props;

  const [ value, setValueInternal ] = useState<Dataset[]>([]);
  const [ options, setOptions ] = useState<readonly Dataset[]>([]);

  const setValue = (value: Dataset[]) => {
    setValueInternal(value);
    onValueChange(value);
  }


  const { setQuery } = useFetchList<Dataset>('/datasets/', {}, {
    onSuccess: results => {
      let newOptions: readonly Dataset[] = [];

      if (value) {
        newOptions = [...value];
      }

      if (results) {
        newOptions = [...newOptions, ...results];
      }

      setOptions(newOptions);
    }
  }, {
    state: 'IMPORTED',
  });

  const optionLabel = (option: Dataset) => (
    typeof option === 'string' ? option : `${formatUUIDShort(option.id)} - ${option.name} (${option.mode})`
  )

  return (
    <Autocomplete
      {...rest}
      getOptionLabel={optionLabel}
      multiple
      limitTags={1}
      options={options}
      autoComplete
      includeInputInList
      value={value}
      onChange={(event: any, newValue: Dataset[] | null) => {
        if (newValue.length > 1) {
          newValue = [newValue[newValue.length - 1]];
        }

        setValue([
          ...newValue.filter((option) => options.find((candidate) => candidate.id === option.id)),
        ]);
      }}
      onInputChange={(event, newInputValue) => {
        setQuery(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Dataset" fullWidth/>
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            key={index}
            label={optionLabel(option)}
            {...getTagProps({ index })}
          />
        ))
      }
    />
  );
}
