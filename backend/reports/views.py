import openai

from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.decorators import api_view
from rest_framework.request import Request
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from backend.settings import OPENAPI_KEY
from reports.models import Report
from reports.serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    pagination_class = LimitOffsetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['notebook']

    def perform_create(self, serializer):
        serializer.save(dataset_id=self.request.data['dataset'])


@swagger_auto_schema(methods=['post'], request_body=openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'prompt': openapi.Schema(type=openapi.TYPE_STRING, description="GPT prompt"),
    }
))
@api_view(['POST'])
def gpt_prompt(request: Request):
    if not request.data.get('prompt', None):
        raise Exception('No prompt provided')

    if not OPENAPI_KEY:
        raise Exception('OpenAI API key not set')

    openai.api_key = OPENAPI_KEY

    response = openai.Completion.create(
        model="code-davinci-002",
        prompt=request.data['prompt'],
        temperature=0,
        max_tokens=150,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        stop=["#", ";"]
    )

    return JsonResponse(response.to_dict())
