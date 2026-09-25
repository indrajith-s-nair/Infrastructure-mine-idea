package org.dpip.official.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.dpip.official.data.model.OfficialWorkOrder

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkOrdersScreen(
    onNavigateBack: () -> Unit,
    onSelectOrder: (OfficialWorkOrder) -> Unit
) {
    var selectedFilter by remember { mutableStateOf("ALL") }

    val sampleOrders = remember {
        listOf(
            OfficialWorkOrder(
                id = "wo-001",
                publicId = "DPI-2026-TN-4A1B2C",
                title = "Deep asphalt pothole causing traffic diversion",
                description = "Severe bituminous breakdown outside Metro station gate 2.",
                categoryName = "Roads & Pavements",
                severity = "HIGH",
                status = "IN_PROGRESS",
                wardName = "Ward 114 - Anna Nagar",
                latitude = 13.0827,
                longitude = 80.2707,
                isSlaBreached = false
            ),
            OfficialWorkOrder(
                id = "wo-002",
                publicId = "DPI-2026-TN-9X8Y7Z",
                title = "Burst 300mm water main pressure leakage",
                description = "Potable water flooding arterial junction for 6 hours.",
                categoryName = "Water Supply",
                severity = "EMERGENCY",
                status = "ACKNOWLEDGED",
                wardName = "Ward 118 - T. Nagar",
                latitude = 13.0418,
                longitude = 80.2341,
                isSlaBreached = true
            ),
            OfficialWorkOrder(
                id = "wo-003",
                publicId = "DPI-2026-TN-3K2M1P",
                title = "Streetlight circuit failure entire corridor",
                description = "12 consecutive poles non-functional on 4th Avenue.",
                categoryName = "Streetlight Grid",
                severity = "MEDIUM",
                status = "IN_PROGRESS",
                wardName = "Ward 105 - Kodambakkam",
                latitude = 13.0512,
                longitude = 80.2209,
                isSlaBreached = false
            )
        )
    }

    val filteredOrders = when (selectedFilter) {
        "BREACHED" -> sampleOrders.filter { it.isSlaBreached }
        "HIGH" -> sampleOrders.filter { it.severity in listOf("HIGH", "EMERGENCY") }
        else -> sampleOrders
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Field Work Orders Queue", fontWeight = FontWeight.Bold) },
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
                .padding(horizontal = 16.dp, vertical = 10.dp)
        ) {
            // Filter Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedFilter == "ALL",
                    onClick = { selectedFilter = "ALL" },
                    label = { Text("All (${sampleOrders.size})") }
                )
                FilterChip(
                    selected = selectedFilter == "HIGH",
                    onClick = { selectedFilter = "HIGH" },
                    label = { Text("Emergency / High") }
                )
                FilterChip(
                    selected = selectedFilter == "BREACHED",
                    onClick = { selectedFilter = "BREACHED" },
                    label = { Text("⚠️ SLA At Risk") }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredOrders) { order ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectOrder(order) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = order.publicId,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    if (order.isSlaBreached) {
                                        Surface(
                                            color = Color(0xFFEF4444),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = "SLA BREACH",
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                                color = Color.White,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                    Surface(
                                        color = if (order.severity == "EMERGENCY") Color(0xFFEF4444) else Color(0xFFF59E0B),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = order.severity,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                            color = Color.White,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = order.title,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = order.description,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 2
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${order.categoryName} • ${order.wardName}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.outline
                                )
                                Button(
                                    onClick = { onSelectOrder(order) },
                                    modifier = Modifier.height(36.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp)
                                ) {
                                    Text("Inspect & Resolve", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
