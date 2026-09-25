package org.dpip.official.data.network

import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

interface OfficialApiService {

    @POST("api/auth/login/")
    suspend fun login(
        @Body credentials: Map<String, String>
    ): Response<Map<String, Any>>

    @GET("api/complaints/officer-inbox/")
    suspend fun getWorkOrders(
        @Header("Authorization") token: String,
        @Query("status") status: String? = null
    ): Response<Map<String, Any>>

    @POST("api/complaints/{trackingCode}/accept/")
    suspend fun acceptComplaint(
        @Header("Authorization") token: String,
        @Path("trackingCode") trackingCode: String
    ): Response<Map<String, Any>>

    @POST("api/complaints/{trackingCode}/decline/")
    suspend fun declineComplaint(
        @Header("Authorization") token: String,
        @Path("trackingCode") trackingCode: String,
        @Body body: Map<String, String>
    ): Response<Map<String, Any>>

    @POST("api/complaints/{trackingCode}/reassign/")
    suspend fun reassignComplaint(
        @Header("Authorization") token: String,
        @Path("trackingCode") trackingCode: String,
        @Body body: Map<String, String>
    ): Response<Map<String, Any>>

    @Multipart
    @POST("api/complaints/{trackingCode}/resolve/")
    suspend fun resolveComplaint(
        @Header("Authorization") token: String,
        @Path("trackingCode") trackingCode: String,
        @Part("action_taken_report") actionTakenReport: RequestBody,
        @Part resolutionProof: MultipartBody.Part
    ): Response<Map<String, Any>>

    @GET("api/gis/hotspots/")
    suspend fun getHotspots(): Response<Map<String, Any>>

    @GET("api/audit/complaint/{trackingCode}/")
    suspend fun getAuditTrail(
        @Path("trackingCode") trackingCode: String
    ): Response<Map<String, Any>>

    companion object {
        private const val BASE_URL = "http://10.0.2.2:8000/"

        fun create(): OfficialApiService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            val client = OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(OfficialApiService::class.java)
        }
    }
}
