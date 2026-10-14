from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.core.mail import send_mail
from django.conf import settings
from .models import BugReport


class BugReportView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data

        # Validate required fields
        if not data.get('category'):
            return Response({'error': 'Category is required.'}, status=400)
        if not data.get('description', '').strip():
            return Response({'error': 'Description is required.'}, status=400)

        # Save to database
        report = BugReport.objects.create(
            name=data.get('name', ''),
            email=data.get('email', ''),
            category=data.get('category', ''),
            severity=data.get('severity', 'medium'),
            page=data.get('page', ''),
            description=data.get('description', ''),
            steps=data.get('steps', ''),
        )

        # Build email body
        severity_emoji = {
            'low': '🟢',
            'medium': '🟡',
            'high': '🔴',
        }.get(report.severity, '⚪')

        email_body = f"""
NEW BUG REPORT — PERFECTION UNIVERSE
{'='*50}

{severity_emoji} SEVERITY: {report.severity.upper()}
📁 CATEGORY: {report.category}
📍 PAGE: {report.page or 'Not specified'}
👤 REPORTED BY: {report.name or 'Anonymous'}
📧 EMAIL: {report.email or 'Not provided'}
🕐 TIME: {report.created_at.strftime('%Y-%m-%d %H:%M UTC')}

{'─'*50}
DESCRIPTION:
{report.description}

{'─'*50}
STEPS TO REPRODUCE:
{report.steps or 'Not provided'}

{'─'*50}
Report ID: #{report.id}
View in admin: {settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'localhost'}/admin/bugs/bugreport/{report.id}/change/
        """.strip()

        # Send email — wrapped in try/except so a mail failure
        # doesn't cause the whole submission to fail
        try:
            send_mail(
                subject=f'[{report.severity.upper()}] Bug Report — {report.category}',
                message=email_body,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[settings.BUG_REPORT_EMAIL],
                fail_silently=False,
            )
        except Exception as e:
            # Report still saved to DB even if email fails
            print(f'Bug report email failed: {e}')

        return Response({'success': True, 'id': report.id}, status=201)