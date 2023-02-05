import React, {useMemo} from "react";
import {useCellContext} from "../../../../providers/CellProvider";
import {usePrefixes} from "../../../../providers/DatasetProvider";
import {MarkdownCellType} from "../../../../types/notebooks";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import MDEditor from "@uiw/react-md-editor";
import {codeEdit, codeLive, codePreview, divider, fullscreen} from "@uiw/react-md-editor";

const wrapExecute = (updateFn, executeFn) => (state, api, dispatch, executeCommandState, shortcuts) => {
    updateFn();
    executeFn(state, api, dispatch, executeCommandState, shortcuts);
}

export const MarkdownWidget = () => {
    const {cell, cellRef, outputs, setCell} = useCellContext();
    const {source, preview} = cell as MarkdownCellType;
    const prefixes = usePrefixes();

    const content = useMemo(() => {
        const setPreview = (preview) => {
            setCell({
                ...cellRef.current,
                preview
            } as any)
        }

        return (
            <MDEditor
                preview={preview as any || 'live'}
                value={source || ''}
                extraCommands={[
                    {
                        ...codeEdit,
                        execute: wrapExecute(() => setPreview('edit'), codeEdit.execute)
                    },
                    {
                        ...codeLive,
                        execute: wrapExecute(() => setPreview('live'), codeLive.execute)
                    },
                    {
                        ...codePreview,
                        execute: wrapExecute(() => setPreview('preview'), codePreview.execute)
                    },
                    divider, fullscreen
                ]}
                onChange={(value, event, state) => {
                    setCell({
                        ...cellRef.current,
                        source: value,
                        preview: state.preview,
                    } as any)
                }}/>
        );
    }, [source, prefixes]);

    const result = useMemo(() => {


        return null;
    }, [outputs, prefixes]);

    return (
        <>
            {content}
            {result}
        </>
    )
}
