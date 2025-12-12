from django.shortcuts import render
from .models import Project, ProjectManager


def project_list(request):
    projects = Project.objects.all()
    projects_data = []
    for p in projects:
        pm = ProjectManager(p)
        projects_data.append({
            "name": p.name,
            "description": p.description,
            "start_date": p.start_date,
            "end_date": p.end_date,
            "days_remaining": pm.days_remaining()
        })
    return render(request, "project_list.html", {"projects": projects_data})
