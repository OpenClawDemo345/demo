package com.talks123.books

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class BooksApi {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

    suspend fun trending(): List<Book> =
        client.get("${ApiConfig.BASE_URL}/api/trending").body()

    suspend fun search(q: String): List<Book> =
        client.get("${ApiConfig.BASE_URL}/api/search") { parameter("q", q) }.body()

    suspend fun submitReview(body: ReviewRequest) {
        client.post("${ApiConfig.BASE_URL}/api/books/reviews") {
            contentType(ContentType.Application.Json)
            setBody(body)
        }
    }
}
