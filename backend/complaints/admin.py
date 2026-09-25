from django.contrib import admin
from django.utils.html import format_html
from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        'tracking_code',
        'status_badge',
        'user_display',
        'address_truncated',
        'has_voice_note',
        'has_media',
        'created_at',
        'resolved_at'
    )
    list_filter = ('status', 'created_at', 'resolved_at')
    search_fields = ('tracking_code', 'description', 'address', 'user__name', 'user__email')
    readonly_fields = (
        'tracking_code',
        'created_at',
        'updated_at',
        'voice_note_player',
        'media_preview',
        'resolution_proof_preview'
    )

    fieldsets = (
        ('Grievance Identifier & Status', {
            'fields': ('tracking_code', 'status', 'user', 'created_at', 'updated_at')
        }),
        ('Complaint Details', {
            'fields': ('description', 'address', 'latitude', 'longitude')
        }),
        ('Citizen Evidence Attachments', {
            'fields': ('voice_note', 'voice_note_player', 'media_file', 'media_preview')
        }),
        ('Official Resolution Output', {
            'fields': ('admin_notes', 'resolution_proof', 'resolution_proof_preview', 'resolved_at')
        }),
    )

    def user_display(self, obj):
        return obj.user.name if obj.user else "Anonymous Citizen"
    user_display.short_description = "Citizen"

    def address_truncated(self, obj):
        return obj.address[:40] + "..." if len(obj.address) > 40 else obj.address
    address_truncated.short_description = "Location Address"

    def has_voice_note(self, obj):
        return bool(obj.voice_note)
    has_voice_note.boolean = True
    has_voice_note.short_description = "Voice Note"

    def has_media(self, obj):
        return bool(obj.media_file)
    has_media.boolean = True
    has_media.short_description = "Attached Files"

    def status_badge(self, obj):
        colors = {
            'PENDING': '#f59e0b',
            'IN_PROGRESS': '#3b82f6',
            'RESOLVED': '#10b981',
            'REJECTED': '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            f'<span style="background-color: {color}; color: white; padding: 3px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{obj.get_status_display()}</span>'
        )
    status_badge.short_description = "Status"

    def voice_note_player(self, obj):
        if obj.voice_note:
            return format_html(
                f'<audio controls src="{obj.voice_note.url}" style="width: 100%; max-width: 350px;"></audio>'
            )
        return "No voice note attached."
    voice_note_player.short_description = "Audio Player"

    def media_preview(self, obj):
        if obj.media_file:
            url = obj.media_file.url
            if any(url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
                return format_html(
                    f'<a href="{url}" target="_blank"><img src="{url}" style="max-height: 200px; border-radius: 8px; border: 1px solid #ccc;"/></a>'
                )
            return format_html(f'<a href="{url}" target="_blank" class="button">View Attached Document</a>')
        return "No media attached."
    media_preview.short_description = "Media Preview"

    def resolution_proof_preview(self, obj):
        if obj.resolution_proof:
            url = obj.resolution_proof.url
            if any(url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
                return format_html(
                    f'<a href="{url}" target="_blank"><img src="{url}" style="max-height: 200px; border-radius: 8px; border: 1px solid #10b981;"/></a>'
                )
            return format_html(f'<a href="{url}" target="_blank" class="button">View Resolution Proof Document</a>')
        return "No resolution proof uploaded."
    resolution_proof_preview.short_description = "Resolution Proof Preview"
