from django.urls import path

from .views import imie_nazwisko

urlpatterns = [
    path('zadanie1/', imie_nazwisko),
]
