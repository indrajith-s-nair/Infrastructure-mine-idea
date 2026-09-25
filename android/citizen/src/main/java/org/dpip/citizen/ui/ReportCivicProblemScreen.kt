package org.dpip.citizen.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.dpip.citizen.data.local.OfflineQueueManager
import org.dpip.citizen.data.model.CitizenReportDraft
import org.dpip.citizen.data.network.CitizenApiService
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportCivicProblemScreen(
    onNavigateBack: () -> Unit,
    onSubmitSuccess: (String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("ROADS_PATHS") }
    var latitude by remember { mutableStateOf(13.0827) } // Chennai default
    var longitude by remember { mutableStateOf(80.2707) }
    var wardName by remember { mutableStateOf("Ward 114 - Anna Nagar") }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val categories = listOf(
        "ROADS_PATHS" to "🛣️ Roads & Potholes",
        "WATER_SUPPLY" to "🚰 Water Supply & Leaks",
        "SEWAGE_DRAINAGE" to "🌊 Sewage & Storm Drains",
        "SOLID_WASTE" to "🗑️ Solid Waste & Garbage",
        "LIGHTING_GRID" to "💡 Streetlights & Electrical",
        "HEALTH_POLLUTION" to "🏥 Public Health & Sanitation"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Report Civic Problem", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp, vertical = 12.dp)
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "State Public Infrastructure Grievance",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary
            )

            // Category Selector
            Text("Select Category", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                categories.chunked(2).forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        row.forEach { (code, label) ->
                            val isSelected = selectedCategory == code
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { selectedCategory = code },
                                shape = RoundedCornerShape(8.dp),
                                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                tonalElevation = if (isSelected) 4.dp else 1.dp
                            ) {
                                Text(
                                    text = label,
                                    modifier = Modifier.padding(10.dp),
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }

            // Title Input
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Short Problem Title") },
                placeholder = { Text("e.g. Broken water main flooding Main Road") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            // Description Input
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Detailed Description") },
                placeholder = { Text("Describe location details, severity, hazard level...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp),
                maxLines = 4
            )

            // GPS & Location Box
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("GPS Geolocation", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        TextButton(onClick = {
                            // Simulate GPS refresh
                            latitude = 13.0827 + (Math.random() - 0.5) * 0.01
                            longitude = 80.2707 + (Math.random() - 0.5) * 0.01
                        }) {
                            Text("Auto-Locate", fontSize = 12.sp)
                        }
                    }
                    Text(
                        text = "Lat: ${"%.5f".format(latitude)}, Lng: ${"%.5f".format(longitude)}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Administrative Ward: $wardName",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Voice & Camera Attachment Controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = { /* Camera picker action */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Add Photo", fontSize = 12.sp)
                }
                OutlinedButton(
                    onClick = { /* Voice recording action */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Mic, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Voice Note", fontSize = 12.sp)
                }
            }

            if (errorMessage != null) {
                Text(
                    text = errorMessage ?: "",
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp
                )
            }

            // Submit Button
            Button(
                onClick = {
                    if (title.isBlank() || description.isBlank()) {
                        errorMessage = "Please enter both a title and description."
                        return@Button
                    }
                    errorMessage = null
                    isSubmitting = true

                    val draftId = UUID.randomUUID().toString()
                    val draft = CitizenReportDraft(
                        id = draftId,
                        title = title,
                        description = description,
                        categoryCode = selectedCategory,
                        latitude = latitude,
                        longitude = longitude,
                        wardName = wardName
                    )

                    // 1. Immediately store in offline queue (Offline-First Architecture)
                    OfflineQueueManager.enqueueDraft(draft)

                    // 2. Attempt asynchronous network sync
                    coroutineScope.launch {
                        try {
                            val api = CitizenApiService.create()
                            val body = mapOf(
                                "title" to title,
                                "description" to description,
                                "category_code" to selectedCategory,
                                "latitude" to latitude,
                                "longitude" to longitude,
                                "ward_name" to wardName,
                                "ingestion_channel" to "MOBILE"
                            )
                            val res = api.submitReport(body)
                            if (res.isSuccessful) {
                                val publicId = res.body()?.get("public_id") as? String ?: "DPI-${draftId.take(8).uppercase()}"
                                OfflineQueueManager.markSynced(draftId, publicId)
                                onSubmitSuccess(publicId)
                            } else {
                                // Queued for retry
                                onSubmitSuccess("QUEUED-OFFLINE-${draftId.take(6)}")
                            }
                        } catch (e: Exception) {
                            // Network failure, already queued offline
                            onSubmitSuccess("QUEUED-OFFLINE-${draftId.take(6)}")
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                enabled = !isSubmitting,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Submit Civic Report", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
            }

            Text(
                text = "✓ Offline-Ready: Reports submitted while offline are queued locally and automatically synced once connectivity returns.",
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
