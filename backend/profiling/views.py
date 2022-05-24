from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.request import Request

from profiling.profilers.sparql_profiler import AnalyticalProfiler
from profiling.services.sparql.parsing import parse_term, parse_multiterm


@api_view(['POST'])
def filtered_distribution(request: Request, database: str):
    data = request.data

    props = parse_multiterm(data['props'])
    filters = [
        (parse_multiterm(fp), parse_multiterm(fv))
        for fp, fv in data['filters']
    ]
    n_bins = data.get('n_bins', -1)

    profiler = AnalyticalProfiler.from_database(database)
    result = profiler.filtered_distribution(props, filters, n_bins)

    return JsonResponse({
        'result': result,
    })
