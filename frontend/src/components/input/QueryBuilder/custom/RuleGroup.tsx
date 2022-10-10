import clsx from "clsx";
import { Fragment, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  defaultCombinators,
  DNDType, DraggedItem, getParentPath,
  isAncestor,
  pathsAreEqual,
  RuleGroupProps,
  standardClassnames,
  TestID,
  InlineCombinator,
} from 'react-querybuilder';
import { SimpleSelect } from "../../SimpleSelect";
import { VariableInput } from "../../VariableInput";
import { Quantifier, QUANTIFIER_OPTIONS } from "../types";

const c = (...classNames: string[]) => classNames.filter(Boolean).join(' ');

export const RuleGroup = ({
  id,
  path,
  ruleGroup,
  translations,
  schema,
  actions,
  disabled: disabledProp,
  parentDisabled,
  context,
  parent,
  combinator: combinatorProp,
  rules: rulesProp,
  not: notProp,
  ...extraProps
}: RuleGroupProps & { parent: any }) => {
  const {
    classNames,
    combinators,
    controls: {
      dragHandle: DragHandleControlElement,
      combinatorSelector: CombinatorSelectorControlElement,
      notToggle: NotToggleControlElement,
      addRuleAction: AddRuleActionControlElement,
      addGroupAction: AddGroupActionControlElement,
      cloneGroupAction: CloneGroupActionControlElement,
      lockGroupAction: LockGroupActionControlElement,
      removeGroupAction: RemoveGroupActionControlElement,
      ruleGroup: RuleGroupControlElement,
      rule: RuleControlElement,
    },
    createRule,
    createRuleGroup,
    independentCombinators,
    showCombinatorsBetweenRules,
    showNotToggle,
    showCloneButtons,
    showLockButtons,
    validationMap,
    disabledPaths,
  } = schema;
  const { onGroupAdd, onGroupRemove, onPropChange, onRuleAdd, moveRule } = actions;
  const disabled = !!parentDisabled || !!disabledProp;

  const { rules, not, quantifier = 'must' } = ruleGroup ? ruleGroup as any : { rules: rulesProp, not: notProp, quantifier: 'must' };
  let combinator: string = defaultCombinators[0].name;
  if (ruleGroup && 'combinator' in ruleGroup) {
    combinator = ruleGroup.combinator;
  } else if (!ruleGroup) {
    combinator = combinatorProp ?? combinator;
  }

  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLSpanElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [ { isDragging, dragMonitorId }, drag, preview ] = useDrag(
    () => ({
      type: DNDType.ruleGroup,
      item: (): DraggedItem => ({ path }),
      canDrag: !disabled,
      collect: monitor => ({
        isDragging: !disabled && monitor.isDragging(),
        dragMonitorId: monitor.getHandlerId(),
      }),
    }),
    [ disabled, path ]
  );
  const [ { isOver, dropMonitorId }, drop ] = useDrop(
    () => ({
      accept: [ DNDType.rule, DNDType.ruleGroup ],
      canDrop: (item: DraggedItem) => {
        if (disabled) return false;
        const parentItemPath = getParentPath(item.path);
        const itemIndex = item.path[item.path.length - 1];
        // Don't allow drop if 1) item is ancestor of drop target,
        // 2) item is first child and is dropped on its own group header,
        // or 3) the group is dropped on itself
        return !(
          isAncestor(item.path, path) ||
          (pathsAreEqual(path, parentItemPath) && itemIndex === 0) ||
          pathsAreEqual(path, item.path)
        );
      },
      collect: monitor => ({
        isOver: monitor.canDrop() && monitor.isOver(),
        dropMonitorId: monitor.getHandlerId(),
      }),
      drop: (item: DraggedItem, _monitor) => !disabled && moveRule(item.path, [ ...path, 0 ]),
    }),
    [ disabled, moveRule, path ]
  );
  if (path.length > 0) {
    drag(dragRef);
    preview(previewRef);
  }
  drop(dropRef);

  const onCombinatorChange = (value: any) => {
    if (!disabled) {
      onPropChange('combinator', value, path);
    }
  };

  const onVariableChange = (value: any) => {
    if (!disabled) {
      onPropChange('variable' as any, value, path);
    }
  };

  const onIndependentCombinatorChange = (value: any, index: number) => {
    if (!disabled) {
      onPropChange('combinator', value, path.concat([ index ]));
    }
  };

  const onNotToggleChange = (checked: boolean) => {
    if (!disabled) {
      onPropChange('not', checked, path);
    }
  };

  const onQuantifierToggleChange = (quantifier: Quantifier) => {
    if (!disabled) {
      onPropChange('quantifier' as any, quantifier, path);
    }
  };

  const addRule = (event: ReactMouseEvent) => {
    if (disabled) return;

    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      const newRule = createRule();
      onRuleAdd(newRule, path);
    }
  };

  const addGroup = (event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      const newGroup = {
        ...createRuleGroup(),
        'variable': {
          label: 'main',
          value: 'main',
        }
      };
      onGroupAdd(newGroup, path);
    }
  };

  const cloneGroup = (event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      const newPath = [ ...getParentPath(path), path[path.length - 1] + 1 ];
      moveRule(path, newPath, true);
    }
  };

  const toggleLockGroup = (event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    onPropChange('disabled', !disabled, path);
  };

  const removeGroup = (event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      onGroupRemove(path);
    }
  };

  const level = path.length;

  const validationResult = validationMap[id ?? /* istanbul ignore next */ ''];
  const dndDragging = isDragging ? standardClassnames.dndDragging : '';
  const dndOver = isOver ? standardClassnames.dndOver : '';
  const outerClassName = c(
    standardClassnames.ruleGroup,
    classNames.ruleGroup,
    disabled ? standardClassnames.disabled : '',
    dndDragging
  );

  return (
    <div className='group-or-rule-container group-container'>
      <div
        ref={previewRef}
        className={outerClassName}
        data-testid={TestID.ruleGroup}
        data-dragmonitorid={dragMonitorId}
        data-dropmonitorid={dropMonitorId}
        data-rule-group-id={id}
        data-level={level}
        data-path={JSON.stringify(path)}>
        <div ref={dropRef} className={c(standardClassnames.header, classNames.header, dndOver)}>
          {level > 0 && (
            <DragHandleControlElement
              testID={TestID.dragHandle}
              ref={dragRef}
              level={level}
              path={path}
              title={translations.dragHandle.title}
              label={translations.dragHandle.label}
              className={c(standardClassnames.dragHandle, classNames.dragHandle)}
              disabled={disabled}
              context={context}
              validation={validationResult}
            />
          )}
          <div className="group--conjunctions">
            {!showCombinatorsBetweenRules && !independentCombinators && (
              <CombinatorSelectorControlElement
                testID={TestID.combinators}
                options={combinators}
                value={combinator}
                title={translations.combinators.title}
                className={c(standardClassnames.combinators, classNames.combinators)}
                handleOnChange={onCombinatorChange}
                rules={rules}
                level={level}
                path={path}
                disabled={disabled}
                context={context}
                validation={validationResult}
              />
            )}
            {showNotToggle && (
              <SimpleSelect
                variant="filled"
                value={quantifier}
                options={QUANTIFIER_OPTIONS}
                onChange={onQuantifierToggleChange}
                label="Quantifier"
                disabled={disabled}
              />
            )}
            <VariableInput
              sx={{ width: 120 }}
              allowAny={false}
              value={(ruleGroup as any)?.variable}
              label="Variable to filter"
              options={context?.variables}
              onChange={onVariableChange}
            />
          </div>
          <div className={clsx('group--actions', 'group--actions--tr')}>
            <AddRuleActionControlElement
              testID={TestID.addRule}
              label={translations.addRule.label}
              title={translations.addRule.title}
              className={c(standardClassnames.addRule, classNames.addRule)}
              handleOnClick={addRule}
              rules={rules}
              level={level}
              path={path}
              disabled={disabled}
              context={context}
              validation={validationResult}
            />
            <AddGroupActionControlElement
              testID={TestID.addGroup}
              label={translations.addGroup.label}
              title={translations.addGroup.title}
              className={c(standardClassnames.addGroup, classNames.addGroup)}
              handleOnClick={addGroup}
              rules={rules}
              level={level}
              path={path}
              disabled={disabled}
              context={context}
              validation={validationResult}
            />
            {showCloneButtons && path.length >= 1 && (
              <CloneGroupActionControlElement
                testID={TestID.cloneGroup}
                label={translations.cloneRuleGroup.label}
                title={translations.cloneRuleGroup.title}
                className={c(standardClassnames.cloneGroup, classNames.cloneGroup)}
                handleOnClick={cloneGroup}
                rules={rules}
                level={level}
                path={path}
                disabled={disabled}
                context={context}
                validation={validationResult}
              />
            )}

            {showLockButtons && (
              <LockGroupActionControlElement
                testID={TestID.lockGroup}
                label={translations.lockGroup.label}
                title={translations.lockGroup.title}
                className={c(standardClassnames.lockGroup, classNames.lockGroup)}
                handleOnClick={toggleLockGroup}
                rules={rules}
                level={level}
                path={path}
                disabled={disabled}
                disabledTranslation={parentDisabled ? undefined : translations.lockGroupDisabled}
                context={context}
                validation={validationResult}
              />
            )}
            {path.length >= 1 && (
              <RemoveGroupActionControlElement
                testID={TestID.removeGroup}
                label={translations.removeGroup.label}
                title={translations.removeGroup.title}
                className={c(standardClassnames.removeGroup, classNames.removeGroup)}
                handleOnClick={removeGroup}
                rules={rules}
                level={level}
                path={path}
                disabled={disabled}
                context={context}
                validation={validationResult}
              />
            )}
          </div>
        </div>
        <div className={c(standardClassnames.body, classNames.body)}>
          {rules.map((r, idx) => {
            const thisPath = [ ...path, idx ];
            const thisPathDisabled =
              disabled ||
              (typeof r !== 'string' && r.disabled) ||
              disabledPaths.some(p => pathsAreEqual(thisPath, p));
            const key = (typeof r === 'string' ? [ ...thisPath, r ].join('-') : r.id) ?? idx;
            return (
              <Fragment key={key}>
                {idx > 0 && !independentCombinators && showCombinatorsBetweenRules && (
                  <InlineCombinator
                    key={key}
                    options={combinators}
                    value={combinator}
                    title={translations.combinators.title}
                    className={c(standardClassnames.combinators, classNames.combinators)}
                    handleOnChange={onCombinatorChange}
                    rules={rules}
                    level={level}
                    context={context}
                    validation={validationResult}
                    component={CombinatorSelectorControlElement}
                    moveRule={moveRule}
                    path={thisPath}
                    disabled={thisPathDisabled}
                    independentCombinators={independentCombinators}
                  />
                )}
                {typeof r === 'string' ? (
                  <InlineCombinator
                    key={key}
                    options={combinators}
                    value={r}
                    title={translations.combinators.title}
                    className={c(standardClassnames.combinators, classNames.combinators)}
                    handleOnChange={val => onIndependentCombinatorChange(val, idx)}
                    rules={rules}
                    level={level}
                    context={context}
                    validation={validationResult}
                    component={CombinatorSelectorControlElement}
                    moveRule={moveRule}
                    path={thisPath}
                    disabled={thisPathDisabled}
                    independentCombinators={independentCombinators}
                  />
                ) : 'rules' in r ? (
                  <RuleGroupControlElement
                    id={r.id}
                    schema={schema}
                    actions={actions}
                    path={thisPath}
                    translations={translations}
                    ruleGroup={r}
                    rules={r.rules}
                    combinator={'combinator' in r ? r.combinator : undefined}
                    not={!!r.not}
                    disabled={thisPathDisabled}
                    parentDisabled={parentDisabled || disabled}
                    context={context}
                    // @ts-ignore
                    parent={ruleGroup}
                  />
                ) : (
                  <RuleControlElement
                    id={r.id!}
                    rule={r}
                    field={r.field}
                    operator={r.operator}
                    value={r.value}
                    valueSource={r.valueSource}
                    schema={schema}
                    actions={actions}
                    path={thisPath}
                    disabled={thisPathDisabled}
                    parentDisabled={parentDisabled || disabled}
                    translations={translations}
                    context={context}
                    // @ts-ignore
                    parent={ruleGroup}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

RuleGroup.displayName = 'RuleGroup';
