from django.urls import path

from .views import konkatowanie

urlpatterns = [
    path('zadanie2/<str:napisA>/<str:napisB>/', konkatowanie),
]
