import React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import omit from "lodash/omit";

const isObject = (v) => (typeof v == "object" && v !== null); // object or array
const listValue = (v, title) => (isObject(v) ? v : {value: v, title: (title !== undefined ? title : v)});

const mapListValues = (listValues, mapFn) => {
    let ret = [];
    if (Array.isArray(listValues)) {
        for (let v of listValues) {
            const lv = mapFn(listValue(v));
            if (lv != null)
                ret.push(lv);
        }
    } else {
        for (let value in listValues) {
            const lv = mapFn(listValue(value, listValues[value]));
            if (lv != null)
                ret.push(lv);
        }
    }
    return ret;
};


export default ({listValues, value, setValue, allowCustomValues, readonly, placeholder, customProps}) => {
    const renderOptions = () =>
        mapListValues(listValues, ({title, value}) => {
            return <MenuItem key={value} value={value}>{title}</MenuItem>;
        });

    const onChange = e => {
        if (e.target.value === undefined)
            return;
        setValue(e.target.value);
    };

    const renderValue = (selectedValue) => {
        if (!readonly && selectedValue == null)
            return placeholder;
        return getListValueTitle(selectedValue);
    };

    const getListValueTitle = (selectedValue) =>
        mapListValues(listValues, ({title, value}) =>
            (value === selectedValue ? title : null)
        )
            .filter(v => v !== null)
            .shift();

    const hasValue = value != null;

    return (
        <FormControl>
            <Select
                variant="filled"
                autoWidth
                displayEmpty
                placeholder={!readonly ? placeholder : ""}
                onChange={onChange}
                value={hasValue ? value : ""}
                disabled={readonly}
                readOnly={readonly}
                renderValue={renderValue}
                {...omit(customProps, ["showSearch", "input"])}
            >
                {renderOptions()}
            </Select>
        </FormControl>
    );
};
