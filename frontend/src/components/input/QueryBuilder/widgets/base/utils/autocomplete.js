
const isObject = (v) => (typeof v == "object" && v !== null); // object or array
const listValue = (v, title) => (isObject(v) ? v : {value: v, title: (title !== undefined ? title : v)});

// convert {<value>: <title>, ..} or [value, ..] to normal [{value, title}, ..]
export const listValuesToArray = (listValuesObj) => {
    if (!isObject(listValuesObj))
        return listValuesObj;
    if (Array.isArray(listValuesObj))
        return listValuesObj.map(v => listValue(v));

    let listValuesArr = [];
    for (let v in listValuesObj) {
        const title = listValuesObj[v];
        listValuesArr.push(listValue(v, title));
    }
    return listValuesArr;
};

export function sleep(delay) {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

export const mapListValues = (listValues, mapFn) => {
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

export const simulateAsyncFetch = (all, cPageSize = 0, delay = 1000) => async (search, offset, meta) => {
    const pageSize = meta.pageSize != undefined ? meta.pageSize : cPageSize;
    const filtered = listValuesToArray(all)
        .filter(({title}) => search == null ? true : title.toUpperCase().indexOf(search.toUpperCase()) != -1);
    const pages = pageSize ? Math.ceil(filtered.length / pageSize) : 0;
    const currentOffset = offset || 0;
    const currentPage = pageSize ? Math.ceil(currentOffset / pageSize) : null;
    const values = pageSize ? filtered.slice(currentOffset, currentOffset + pageSize) : filtered;
    const newOffset = pageSize ? currentOffset + values.length : null;
    const hasMore = pageSize ? (newOffset < filtered.length) : false;
    console.debug("simulateAsyncFetch", {
        search, offset, values, hasMore, filtered
    });
    await sleep(delay);
    return {
        values,
        hasMore
    };
};

export const mergeListValues = (values, newValues, toStart = false) => {
    if (!newValues)
        return values;
    const old = values || [];
    const newFiltered = newValues.filter(v => old.find(av => av.value == v.value) == undefined);
    const merged = toStart ? [...newFiltered, ...old] : [...old, ...newFiltered];
    return merged;
};

export const listValueToOption = (lv) => {
    if (lv == null) return null;
    const {title, value, disabled, groupTitle, renderTitle} = lv;
    let option = {title, value};
    if (disabled)
        option.disabled = disabled;
    if (groupTitle)
        option.groupTitle = groupTitle;
    if (renderTitle)
        option.renderTitle = renderTitle;
    return option;
};

export const getListValue = (selectedValue, listValues) =>
    mapListValues(listValues, (lv) => (lv.value === selectedValue ? lv : null))
        .filter(v => v !== null)
        .shift();
