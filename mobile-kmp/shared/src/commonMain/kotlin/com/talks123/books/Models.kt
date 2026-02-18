package com.talks123.books

import kotlinx.serialization.Serializable

@Serializable
data class Book(
    val rank: Int = 0,
    val title: String = "",
    val author: String = "",
    val link: String = "",
    val bookId: String = "",
    val avgRating: Double = 0.0,
    val ratingsCount: Int = 0,
    val commentsCount: Int = 0,
    val resume: List<String> = emptyList()
)

@Serializable
data class ReviewRequest(
    val bookId: String,
    val title: String,
    val author: String,
    val rating: Int,
    val comment: String = ""
)
