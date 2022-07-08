from django.views.generic import TemplateView

index = TemplateView.as_view(template_name='index.html')
datasets = TemplateView.as_view(template_name='datasets.html')
reports = TemplateView.as_view(template_name='reports.html')
report = TemplateView.as_view(template_name='report/[rid].html')
tasks = TemplateView.as_view(template_name='tasks.html')
lodc = TemplateView.as_view(template_name='lodc.html')
triplydb = TemplateView.as_view(template_name='triplydb.html')

