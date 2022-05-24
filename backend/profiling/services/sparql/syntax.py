from dataclasses import dataclass
from typing import Any, Union, List, Optional


@dataclass
class Prefix:
    prefix: str
    uri: str

    def __str__(self):
        return f"PREFIX {self.prefix}: <{self.uri}>"

    def __getattr__(self, item):
        return f"{self.prefix}:{item}"


@dataclass
class Expression:
    pass


@dataclass
class Literal(Expression):
    value: Any

    def __str__(self):
        return f'{self.value}'


@dataclass
class NumberLiteral(Literal):
    pass


@dataclass
class StringLiteral(Literal):
    def __str__(self):
        return f'"{self.value}"'


@dataclass
class IRILiteral(Literal):
    def __str__(self):
        return f'<{self.value}>'


Term = Union[Literal]


@dataclass
class Var(Expression):
    name: str

    def __str__(self):
        return f"?{self.name}"


@dataclass
class Alias(Expression):
    expr: Expression
    alias: Var

    def __str__(self):
        return f"({self.expr} AS {self.alias})"


@dataclass
class FuncCall(Expression):
    name: str
    args: List[Expression]

    def __post_init__(self):
        if not isinstance(self.args, list):
            self.args = [self.args]

    def __str__(self):
        return f"{self.name}({', '.join(map(str, self.args))})"


NamedFunc = lambda name: lambda args: FuncCall(name, args)
COUNT = NamedFunc('COUNT')

DESC = NamedFunc('DESC')
ASC = NamedFunc('ASC')


@dataclass
class Statement:
    pass


@dataclass
class Triple(Statement):
    s: Union[Var, Term]
    p: Union[Var, Term]
    v: Union[Var, Term]

    def __str__(self):
        return f"{self.s} {self.p} {self.v}"


@dataclass
class Values(Statement):
    var: Var
    values: List[Term]

    def __str__(self):
        return f"VALUES {self.var} {{ {' '.join(str(v) for v in self.values)} }}"


@dataclass
class SelectQuery:
    vars: List[Union[Var, Alias]]
    where: List[Statement]
    group: Optional[List[Union[Expression]]] = None
    order: Optional[List[Expression]] = None
    limit: Optional[int] = None
    offset: Optional[int] = None

    def __str__(self):
        NL = '\n'

        vars = ' '.join(map(str, self.vars))
        where = NL.join(map(lambda x: f'{x}.', self.where))
        group = f'GROUP BY {NL.join(map(str, self.group))}' if self.group else ''
        order = f'ORDER BY {NL.join(map(str, self.order))}' if self.order else ''
        limit = f'LIMIT {self.limit}' if self.limit else ''
        offset = f'OFFSET {self.offset}' if self.offset else ''

        return f'SELECT \n{vars} \nWHERE {{\n{where}\n}} \n{group} \n{order} \n{limit} \n{offset} \n'
