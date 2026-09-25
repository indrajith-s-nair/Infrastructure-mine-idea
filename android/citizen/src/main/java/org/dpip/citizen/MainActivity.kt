package org.dpip.citizen

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.ReportProblem
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.dpip.citizen.data.local.OfflineQueueManager
import org.dpip.citizen.ui.MyReportsScreen
import org.dpip.citizen.ui.ReportCivicProblemScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    CitizenAppRoot()
                }
            }
        }
    }
}

@Composable
fun CitizenAppRoot() {
    var currentScreen by remember { mutableStateOf("HOME") }
    var lastSubmittedId by remember { mutableStateOf<String?>(null) }
    val drafts = remember(currentScreen) { OfflineQueueManager.getAllDrafts() }

    when (currentScreen) {
        "REPORT_PROBLEM" -> {
            ReportCivicProblemScreen(
                onNavigateBack = { currentScreen = "HOME" },
                onSubmitSuccess = { id ->
                    lastSubmittedId = id
                    currentScreen = "HOME"
                }
            )
        }
        "MY_REPORTS" -> {
            MyReportsScreen(
                onNavigateBack = { currentScreen = "HOME" }
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
                    text = "DPIP Citizen Portal",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Digital Public Infrastructure Platform",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Government Direct Citizen Redressal & Resolution Channel",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline
                )

                if (lastSubmittedId != null) {
                    Spacer(modifier = Modifier.height(18.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        modifier = Modifier.fillMaxWidth(0.92f)
                    ) {
                        Text(
                            text = "✓ Grievance submitted successfully!\nReference: $lastSubmittedId",
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(14.dp),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Action 1: Report Civic Problem
                Button(
                    onClick = { currentScreen = "REPORT_PROBLEM" },
                    modifier = Modifier
                        .fillMaxWidth(0.92f)
                        .height(54.dp)
                ) {
                    Icon(Icons.Default.ReportProblem, contentDescription = null)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("Report Civic Problem", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Action 2: Check Status / My Reports
                OutlinedButton(
                    onClick = { currentScreen = "MY_REPORTS" },
                    modifier = Modifier
                        .fillMaxWidth(0.92f)
                        .height(54.dp)
                ) {
                    Icon(Icons.Default.Assignment, contentDescription = null)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("Check Status / My Reports", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Offline Queue Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    modifier = Modifier.fillMaxWidth(0.92f)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "Offline-First Engine Status",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Queued Local Reports: ${drafts.filter { !it.isSynced }.size} pending sync",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Total Reports Tracked: ${drafts.size}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.outline
                        )
                    }
                }
            }
        }
    }
}
