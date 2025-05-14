from django.http import HttpResponse


def konkatowanie(request, napisA, napisB):
    wynik = napisA + napisB
    return HttpResponse(f"Wynik: {wynik}")