package org.dpip.citizen.data.model

data class CitizenReportDraft(
    val id: String,
    val title: String,
    val description: String,
    val categoryCode: String,
    val latitude: Double,
    val longitude: Double,
    val wardName: String = "",
    val photoUri: String? = null,
    val audioUri: String? = null,
    val timestamp: Long = System.currentTimeMillis(),
    var isSynced: Boolean = false,
    var publicTrackingId: String? = null
)

data class ReportStatusItem(
    val publicId: String,
    val title: String,
    val category: String,
    val status: String,
    val severity: String,
    val urgency: String,
    val createdAt: String,
    val departmentName: String?,
    val visionVerificationStatus: String?,
    val slaHoursRemaining: Int?
)

data class ServiceCategoryItem(
    val code: String,
    val name: String,
    val icon: String
)
