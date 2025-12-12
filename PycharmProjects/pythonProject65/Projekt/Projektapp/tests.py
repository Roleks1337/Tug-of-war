from django.test import TestCase
from django.urls import reverse
from datetime import date, timedelta
from .models import Project, ProjectManager


class ProjectViewTests(TestCase):
    def test_empty_project_list(self):
        response = self.client.get(reverse('project_list'))
        self.assertContains(response, "Brak danych o projektach")

    def test_project_display(self):
        project = Project.objects.create(
            name="Projekt Test",
            description="Opis testowego projektu",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=10)
        )
        response = self.client.get(reverse('project_list'))
        pm = ProjectManager(project)
        self.assertContains(response, project.name)
        self.assertContains(response, project.description)
        self.assertContains(response, project.start_date)
        self.assertContains(response, project.end_date)
        self.assertContains(response, pm.days_remaining())
