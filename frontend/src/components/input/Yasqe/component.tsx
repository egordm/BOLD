import { StreamLanguage } from "@codemirror/language";
import { sparql } from "@codemirror/legacy-modes/mode/sparql";
import { default as YasqeEditor, PartialConfig as YasqeConfig } from "@triply/yasqe";
import { Config } from "@triply/yasqe/src";
import CodeMirror from "@uiw/react-codemirror/esm";
import { useEffect, useRef } from "react";
import "@triply/yasgui/build/yasgui.min.css";
import { editorTheme } from "../../../theme";
import React from "react";
import _, { debounce } from "lodash";


// export const Yasqe = (props: {
//   value: string;
//   onChange?: (value: string) => void;
// }) => {
//   const container = useRef();
//   const editorRef = useRef<YasqeClass>();
//
//   const config: Partial<YasqeConfig> = {
//     editorHeight: "300px",
//   }
//
//   useEffect(() => {
//     if (container.current) {
//       editorRef.current = new YasqeClass(container.current, config);
//       this.codeMirror.on('change', this.codemirrorValueChanged);
//     }
//     return () => {};
//   }, [ ]);
//
//   return (
//     <div ref={container}/>
//   )
// }

function normalizeLineEndings(str) {
  if (!str) return str;
  return str.replace(/\r\n|\r/g, '\n');
}


export class Yasqe extends React.Component<{
  defaultValue?: string;
  value?: string;
  preserveScrollPosition?: boolean;
  options: Partial<YasqeConfig>
  onChange?: (value: string, change: boolean) => void;
  onFocusChange?: (focused: boolean) => void;
  onCursorActivity?: (cursor) => void;
  onScroll?: (scrollInfo) => void;
  prefixes?: { [prefix: string]: string };
  editorRef?: React.MutableRefObject<YasqeEditor>;
}, {
  isFocused: boolean;
}> {
  containerRef: React.RefObject<HTMLDivElement>;
  editor: YasqeEditor;

  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
  }

  static defaultProps = {
    preserveScrollPosition: false,
  }

  static defaultState = {
    isFocused: false,
  }

  UNSAFE_componentWillMount = () => {
    this.UNSAFE_componentWillReceiveProps = debounce(this.UNSAFE_componentWillReceiveProps, 0);
  }

  componentDidMount() {
    const config: Partial<YasqeConfig> = {
      editorHeight: "300px",
      pluginButtons: false,
      showQueryButton: false,
      createShareableLink: false,
      queryingDisabled: true as any,
      resizeable: false,
    }

    this.editor = new YasqeEditor(this.containerRef.current, config);
    this.editor.on('change', this.editorValueChanged as any);
    this.editor.on('cursorActivity', this.cursorActivity as any);
    this.editor.on('focus', this.focusChanged.bind(this, true));
    this.editor.on('blur', this.focusChanged.bind(this, false));
    this.editor.on('scroll', this.scrollChanged as any);
    this.editor.setValue(this.props.defaultValue || this.props.value || '');
    this.editor.addPrefixes(this.props.prefixes || {});

    if (this.props.editorRef) {
      this.props.editorRef.current = this.editor;
    }
  }

  componentWillUnmount = () => {
    if (this.editor) {
      this.editor.destroy();
      if (this.props.editorRef) {
        this.props.editorRef.current = null;
      }
    }
  }

  UNSAFE_componentWillReceiveProps = (nextProps) => {
    if (this.editor && nextProps.prefix !== undefined && !_.isEqual(this.props.prefixes, nextProps.prefixes)) {
      this.editor.addPrefixes(nextProps.prefixes || {});
    }

    if (this.editor && nextProps.value !== undefined && nextProps.value !== this.props.value && normalizeLineEndings(this.editor.getValue()) !== normalizeLineEndings(nextProps.value)) {
      if (this.props.preserveScrollPosition) {
        var prevScrollPosition = this.editor.getScrollInfo();
        this.editor.setValue(nextProps.value);
        this.editor.scrollTo(prevScrollPosition.left, prevScrollPosition.top);
      } else {
        this.editor.setValue(nextProps.value);
      }
    }
    if (typeof nextProps.options === 'object') {
      for (let optionName in nextProps.options) {
        if (nextProps.options.hasOwnProperty(optionName)) {
          this.setOptionIfChanged(optionName, nextProps.options[optionName]);
        }
      }
    }
  }

  setOptionIfChanged = (optionName, newValue) => {
    console.log('setOptionIfChanged', optionName, newValue);
    const oldValue = this.editor.getOption(optionName);
    if (!_.isEqual(oldValue, newValue)) {
      this.editor.setOption(optionName, newValue);
    }
  }

  focus = () => {
    if (this.editor) {
      this.editor.focus();
    }
  }

  focusChanged = (focused) => {
    this.setState({
      isFocused: focused,
    });
    this.props.onFocusChange && this.props.onFocusChange(focused);
  }

  cursorActivity = (cm) => {
    this.props.onCursorActivity && this.props.onCursorActivity(cm);
  }

  scrollChanged = (cm) => {
    this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
  }

  editorValueChanged = (doc, change) => {
    if (this.props.onChange && change.origin !== 'setValue') {
      this.props.onChange(doc.getValue(), change);
    }
  }

  render() {
    return <div ref={this.containerRef}/>;
  }
}
