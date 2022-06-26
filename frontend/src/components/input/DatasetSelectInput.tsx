import { Autocomplete, Chip, Grid, TextField } from "@mui/material";
import React, { useState } from "react";
import { Dataset } from "../../types/datasets";
import { useFetchList } from "../../utils/api";


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
  });

  return (
    <Autocomplete
      {...rest}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.name
      }
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
            label={option.name}
            {...getTagProps({ index })}
          />
        ))
      }
    />
  );
}
