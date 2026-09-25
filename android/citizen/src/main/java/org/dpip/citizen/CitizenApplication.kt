package org.dpip.citizen

import android.app.Application
import org.dpip.citizen.data.local.OfflineQueueManager

class CitizenApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        OfflineQueueManager.init(this)
    }
}
