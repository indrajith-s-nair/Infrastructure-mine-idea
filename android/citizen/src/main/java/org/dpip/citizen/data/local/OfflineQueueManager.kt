package org.dpip.citizen.data.local

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import org.dpip.citizen.data.model.CitizenReportDraft
import java.util.UUID

object OfflineQueueManager {
    private const val PREF_NAME = "dpip_citizen_offline_queue"
    private const val KEY_DRAFTS = "queued_drafts"
    private lateinit var prefs: SharedPreferences
    private val gson = Gson()

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    @Synchronized
    fun enqueueDraft(draft: CitizenReportDraft) {
        val drafts = getAllDrafts().toMutableList()
        drafts.add(0, draft)
        saveDrafts(drafts)
    }

    @Synchronized
    fun markSynced(draftId: String, publicTrackingId: String) {
        val drafts = getAllDrafts().toMutableList()
        val index = drafts.indexOfFirst { it.id == draftId }
        if (index != -1) {
            val updated = drafts[index].copy(isSynced = true, publicTrackingId = publicTrackingId)
            drafts[index] = updated
            saveDrafts(drafts)
        }
    }

    @Synchronized
    fun getAllDrafts(): List<CitizenReportDraft> {
        val json = prefs.getString(KEY_DRAFTS, null) ?: return emptyList()
        return try {
            val type = object : TypeToken<List<CitizenReportDraft>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    @Synchronized
    private fun saveDrafts(drafts: List<CitizenReportDraft>) {
        val json = gson.toJson(drafts)
        prefs.edit().putString(KEY_DRAFTS, json).apply()
    }
}
