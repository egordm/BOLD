from typing import List, Tuple

from typing_extensions import Self

from data.services.stardog_api import StardogApi
from profiling.services.sparql import Term, SelectQuery, Var, Alias, COUNT, Triple, DESC


class AnalyticalProfiler:
    stardog: StardogApi

    def __init__(self, stardog: StardogApi):
        self.stardog = stardog

    @staticmethod
    def from_database(database: str) -> Self:
        return AnalyticalProfiler(StardogApi.from_database(database))

    def filtered_distribution(
        self,
        prop: Term,
        filter: List[Tuple[Term, Term]],
        n_bins: int = -1,
    ):
        # TODO: or statements should also be considered
        query = SelectQuery(
            vars=[Var('v'), Alias(COUNT(Var('v')), Var('count'))],
            where=[
                Triple(Var('s'), prop, Var('v')),
                *[Triple(Var('s'), fp, fv) for (fp, fv) in filter]
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
                    Triple(Var('s'), prop, Var('v')),
                    *[Triple(Var('s'), fp, fv) for (fp, fv) in filter]
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
