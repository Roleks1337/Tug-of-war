from django.http import HttpResponse


def imie_nazwisko(request):
    return HttpResponse("Wiktor Wójcik")
