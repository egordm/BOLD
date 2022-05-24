from django.test import TestCase

from profiling.profilers.sparql_profiler import AnalyticalProfiler
from profiling.services.sparql import Term, IRILiteral


class SPARQLTests(TestCase):

    def test_search(self):
        profiler = AnalyticalProfiler.from_database('yago')
        result = profiler.filtered_distribution(
            [IRILiteral('http://yago-knowledge.org/resource/infobox/en/ethnicity')],
            [(
                [IRILiteral('http://yago-knowledge.org/resource/isCitizenOf')],
                [IRILiteral('http://yago-knowledge.org/resource/United_States')],
            )],
            n_bins=10
        )

        print(result)
