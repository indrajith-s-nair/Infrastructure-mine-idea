package org.dpip.official.data.model

data class OfficialWorkOrder(
    val id: String,
    val publicId: String,
    val title: String,
    val description: String,
    val categoryName: String,
    val severity: String,
    val status: String,
    val wardName: String,
    val latitude: Double,
    val longitude: Double,
    val isSlaBreached: Boolean = false,
    val visionVerificationStatus: String = "PENDING",
    val visionConfidence: Float = 0.0f
)

data class VisionVerificationResponse(
    val status: String,
    val confidence: Float,
    val notes: String,
    val modelUsed: String
)

data class HotspotSummary(
    val id: String,
    val name: String,
    val category: String,
    val reportsCount: Int,
    val severityScore: Float,
    val recommendedAction: String,
    val estimatedBudgetInr: Double
)
