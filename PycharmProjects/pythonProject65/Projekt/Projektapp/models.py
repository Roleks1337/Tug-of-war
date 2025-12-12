from django.db import models
from django.utils import timezone
from datetime import date
from django.contrib import admin


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return self.name


class ProjectManager:
    def __init__(self, project: Project):
        self.project = project

    def days_remaining(self):
        today = date.today()
        if self.project.end_date < today:
            return 0
        return (self.project.end_date - today).days


class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'days_remaining')
    search_fields = ('name', 'description')
    list_filter = ('start_date', 'end_date')

    def days_remaining(self, obj):
        from datetime import date
        today = date.today()
        if obj.end_date < today:
            return 0
        return (obj.end_date - today).days
    days_remaining.short_description = 'Days Remaining'

admin.site.register(Project, ProjectAdmin)
