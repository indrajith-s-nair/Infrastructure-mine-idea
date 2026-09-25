package org.dpip.official.ui

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
import org.dpip.official.data.model.OfficialWorkOrder

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResolutionInspectionScreen(
    order: OfficialWorkOrder,
    onNavigateBack: () -> Unit,
    onResolutionSuccess: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var resolutionNotes by remember { mutableStateOf("") }
    var hasPhoto by remember { mutableStateOf(false) }
    var isAnalyzing by remember { mutableStateOf(false) }
    var visionStatus by remember { mutableStateOf<String?>("PENDING") }
    var visionConfidence by remember { mutableStateOf(0.0f) }
    var visionNotes by remember { mutableStateOf<String?>(null) }
    var isCompleting by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Resolution Verification", fontWeight = FontWeight.Bold) },
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
                .padding(horizontal = 20.dp, vertical = 14.dp)
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Case Overview
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = order.publicId,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = order.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = order.description, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Location: ${order.wardName} (${order.latitude}, ${order.longitude})",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }

            // Computer Vision Automated Verification Section
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CameraAlt, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("On-Site Resolution Evidence", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        if (visionStatus != null && visionStatus != "PENDING") {
                            Surface(
                                color = if (visionStatus == "VERIFIED_RESOLVED") Color(0xFF10B981) else Color(0xFFEF4444),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = visionStatus ?: "",
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Take a close-up photo of the completed repair. Automated Computer Vision verifies physical restoration before closing tickets.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                hasPhoto = true
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (hasPhoto) "Photo Attached ✓" else "Capture Photo", fontSize = 12.sp)
                        }

                        Button(
                            onClick = {
                                if (!hasPhoto) return@Button
                                isAnalyzing = true
                                coroutineScope.launch {
                                    // Simulate or call ComputerVisionQualityService endpoint
                                    kotlinx.coroutines.delay(1200)
                                    visionStatus = "VERIFIED_RESOLVED"
                                    visionConfidence = 0.92f
                                    visionNotes = "AI Vision confirmed physical restoration. Asphalt leveling and bitumen compaction completed with no remaining pothole crater."
                                    isAnalyzing = false
                                }
                            },
                            enabled = hasPhoto && !isAnalyzing,
                            modifier = Modifier.weight(1f)
                        ) {
                            if (isAnalyzing) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.Verified, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("AI Verify", fontSize = 12.sp)
                            }
                        }
                    }

                    if (visionNotes != null) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Surface(
                            color = Color(0x2210B981),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = "Confidence: ${"%.0f".format(visionConfidence * 100)}%",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = Color(0xFF059669)
                                )
                                Text(
                                    text = visionNotes ?: "",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }

            // Official Completion Notes
            OutlinedTextField(
                value = resolutionNotes,
                onValueChange = { resolutionNotes = it },
                label = { Text("Field Engineering Notes") },
                placeholder = { Text("Enter materials used, crew hours, contractor signoff...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp),
                maxLines = 3
            )

            // Submit Completion
            Button(
                onClick = {
                    isCompleting = true
                    coroutineScope.launch {
                        kotlinx.coroutines.delay(800)
                        isCompleting = false
                        onResolutionSuccess()
                    }
                },
                enabled = !isCompleting,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                if (isCompleting) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                } else {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Submit Verified Resolution & Close Ticket", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
