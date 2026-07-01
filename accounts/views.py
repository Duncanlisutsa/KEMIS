from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user

    role = None

    if user.groups.exists():
        role = user.groups.first().name

    return Response({
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": role
    })