package org.dpip.citizen.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Search
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
import org.dpip.citizen.data.network.CitizenApiService

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyReportsScreen(
    onNavigateBack: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var searchId by remember { mutableStateOf("") }
    var searchResult by remember { mutableStateOf<Map<String, Any>?>(null) }
    var isSearching by remember { mutableStateOf(false) }
    var searchError by remember { mutableStateOf<String?>(null) }

    val localDrafts = remember { OfflineQueueManager.getAllDrafts() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Track My Reports & Status", fontWeight = FontWeight.Bold) },
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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Tracking Search Bar
            item {
                Text(
                    text = "Track by Public Tracking Code",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = searchId,
                        onValueChange = { searchId = it },
                        placeholder = { Text("e.g. DPI-2026-TN-...") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    Button(
                        onClick = {
                            if (searchId.isBlank()) return@Button
                            isSearching = true
                            searchError = null
                            coroutineScope.launch {
                                try {
                                    val api = CitizenApiService.create()
                                    val res = api.trackReport(searchId.trim())
                                    if (res.isSuccessful) {
                                        searchResult = res.body()
                                    } else {
                                        searchError = "No civic report found with reference $searchId"
                                        searchResult = null
                                    }
                                } catch (e: Exception) {
                                    searchError = "Unable to connect to state server. Check internet connection."
                                    searchResult = null
                                } finally {
                                    isSearching = false
                                }
                            }
                        },
                        modifier = Modifier.height(56.dp)
                    ) {
                        Icon(Icons.Default.Search, contentDescription = null)
                    }
                }

                if (isSearching) {
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }

                if (searchError != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(searchError ?: "", color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }

                // Search Result Card
                if (searchResult != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = searchResult?.get("public_id") as? String ?: searchId,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                val status = searchResult?.get("status") as? String ?: "OPEN"
                                Surface(
                                    color = if (status == "RESOLVED") Color(0xFF10B981) else Color(0xFF3B82F6),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = status,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = searchResult?.get("title") as? String ?: "Civic Issue",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Category: ${searchResult?.get("category") ?: "General"} | Severity: ${searchResult?.get("severity") ?: "MEDIUM"}",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                            val dept = searchResult?.get("department") as? String
                            if (dept != null) {
                                Text(
                                    text = "Assigned Department: $dept",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            val visionStatus = searchResult?.get("vision_verification_status") as? String
                            if (visionStatus != null && visionStatus != "PENDING") {
                                Spacer(modifier = Modifier.height(6.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Color(0xFF10B981),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "AI Vision Verified: $visionStatus",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF059669)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Local Queued & Historical Reports
            item {
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "My Queued & Recent Reports (${localDrafts.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            if (localDrafts.isEmpty()) {
                item {
                    Text(
                        text = "No civic reports filed yet on this device.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 13.sp
                    )
                }
            } else {
                items(localDrafts) { draft ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = draft.publicTrackingId ?: "DRAFT-${draft.id.take(8)}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = if (draft.isSynced) MaterialTheme.colorScheme.primary else Color(0xFFF59E0B)
                                )
                                Surface(
                                    color = if (draft.isSynced) Color(0xFF10B981) else Color(0xFFF59E0B),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = if (draft.isSynced) "SYNCED" else "QUEUED OFFLINE",
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = draft.title,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = draft.description,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 2
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${draft.wardName} • Category: ${draft.categoryCode}",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }
    }
}
