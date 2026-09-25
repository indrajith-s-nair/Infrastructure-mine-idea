package org.dpip.citizen.data.network

import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

interface CitizenApiService {

    @POST("api/complaints/")
    suspend fun submitReport(
        @Body reportData: Map<String, Any>
    ): Response<Map<String, Any>>

    @Multipart
    @POST("api/complaints/")
    suspend fun submitReportMultipart(
        @Part("description") description: RequestBody,
        @Part("address") address: RequestBody,
        @Part("latitude") latitude: RequestBody?,
        @Part("longitude") longitude: RequestBody?,
        @Part("department_category") departmentCategory: RequestBody?,
        @Part mediaFile: MultipartBody.Part?,
        @Part voiceNote: MultipartBody.Part?
    ): Response<Map<String, Any>>

    @GET("api/complaints/track/{trackingCode}/")
    suspend fun trackReport(
        @Path("trackingCode") trackingCode: String
    ): Response<Map<String, Any>>

    @GET("api/complaints/my-complaints/")
    suspend fun getMyReports(
        @Header("Authorization") token: String
    ): Response<Map<String, Any>>

    @POST("api/complaints/{trackingCode}/reopen/")
    suspend fun reopenComplaint(
        @Path("trackingCode") trackingCode: String,
        @Body body: Map<String, String>
    ): Response<Map<String, Any>>

    @GET("api/audit/complaint/{trackingCode}/")
    suspend fun getComplaintAuditTrail(
        @Path("trackingCode") trackingCode: String
    ): Response<Map<String, Any>>

    companion object {
        private const val BASE_URL = "http://10.0.2.2:8000/" // Android Emulator to Host localhost:8000

        fun create(): CitizenApiService {
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
                .create(CitizenApiService::class.java)
        }
    }
}
