from typing import List, Tuple

from typing_extensions import Self

from data.services.stardog_api import StardogApi
from profiling.services.sparql import Term, SelectQuery, Var, Alias, COUNT, Triple, DESC, Values

MultiTerm = List[Term]


class AnalyticalProfiler:
    stardog: StardogApi

    def __init__(self, stardog: StardogApi):
        self.stardog = stardog

    @staticmethod
    def from_database(database: str) -> Self:
        return AnalyticalProfiler(StardogApi.from_database(database))

    def filtered_distribution(
        self,
        props: MultiTerm,
        filters: List[Tuple[MultiTerm, MultiTerm]],
        n_bins: int = -1,
    ):
        # TODO: or statements should also be considered
        binding_counter = 0
        bindings = []

        def add_binding(values: MultiTerm):
            nonlocal binding_counter
            var = Var(f'b{binding_counter}')
            bindings.append(Values(var, values))
            binding_counter += 1
            return var

        props = add_binding(props)
        filters = [
            (add_binding(fp), add_binding(fv))
            for fp, fv in filters
        ]

        query = SelectQuery(
            vars=[Var('v'), Alias(COUNT(Var('v')), Var('count'))],
            where=[
                *bindings,
                Triple(Var('s'), props, Var('v')),
                *[Triple(Var('s'), fp, fv) for (fp, fv) in filters]
            ],
            group=[Var('v')],
            order=[DESC(Var('count'))],
            limit=n_bins if n_bins > 0 else None
        )

        result = self.stardog.query(str(query))
        values = [
            {
                'v': row['v']['value'],
                'count': int(row['count']['value']),
            }
            for row in result['results']['bindings']
        ]

        if n_bins > 0:
            total_query = SelectQuery(
                vars=[Alias(COUNT(Var('v')), Var('count'))],
                where=[
                    *bindings,
                    Triple(Var('s'), props, Var('v')),
                    *[Triple(Var('s'), fp, fv) for (fp, fv) in filters]
                ]
            )
            result = self.stardog.query(str(total_query))
            total = int(result['results']['bindings'][0]['count']['value'])
            value_total = sum(v['count'] for v in values)
            values.append({
                'v': 'other',
                'count': total - value_total,
            })

        return values
