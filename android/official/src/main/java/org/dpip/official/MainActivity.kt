package org.dpip.official

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AssignmentTurnedIn
import androidx.compose.material.icons.filled.Engineering
import androidx.compose.material.icons.filled.LocationCity
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.dpip.official.data.model.OfficialWorkOrder
import org.dpip.official.ui.ResolutionInspectionScreen
import org.dpip.official.ui.WorkOrdersScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    OfficialAppRoot()
                }
            }
        }
    }
}

@Composable
fun OfficialAppRoot() {
    var currentScreen by remember { mutableStateOf("HOME") }
    var selectedOrder by remember { mutableStateOf<OfficialWorkOrder?>(null) }
    var resolutionMessage by remember { mutableStateOf<String?>(null) }

    when {
        currentScreen == "INSPECT_ORDER" && selectedOrder != null -> {
            ResolutionInspectionScreen(
                order = selectedOrder!!,
                onNavigateBack = { currentScreen = "WORK_ORDERS" },
                onResolutionSuccess = {
                    resolutionMessage = "Work order ${selectedOrder?.publicId} successfully verified & resolved."
                    currentScreen = "HOME"
                }
            )
        }
        currentScreen == "WORK_ORDERS" -> {
            WorkOrdersScreen(
                onNavigateBack = { currentScreen = "HOME" },
                onSelectOrder = { order ->
                    selectedOrder = order
                    currentScreen = "INSPECT_ORDER"
                }
            )
        }
        else -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "DPIP Field Workforce",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Official Operations & Inspection Suite",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Municipal Department Field Engineering Unit",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline
                )

                if (resolutionMessage != null) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        modifier = Modifier.fillMaxWidth(0.92f)
                    ) {
                        Text(
                            text = "✓ $resolutionMessage",
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(12.dp),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // Official Executive Metrics
                Row(
                    modifier = Modifier.fillMaxWidth(0.92f),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Assigned", fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                            Text("7", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("SLA At Risk", fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                            Text("1", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Verified", fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                            Text("14", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // Button 1: Work Orders & Inspections
                Button(
                    onClick = { currentScreen = "WORK_ORDERS" },
                    modifier = Modifier
                        .fillMaxWidth(0.92f)
                        .height(54.dp)
                ) {
                    Icon(Icons.Default.Engineering, contentDescription = null)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("Assigned Work Orders", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Button 2: Chronic Hotspots & CapEx Projects
                OutlinedButton(
                    onClick = { /* View Hotspots */ },
                    modifier = Modifier
                        .fillMaxWidth(0.92f)
                        .height(54.dp)
                ) {
                    Icon(Icons.Default.LocationCity, contentDescription = null)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("Hotspots & CapEx Initiatives", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
