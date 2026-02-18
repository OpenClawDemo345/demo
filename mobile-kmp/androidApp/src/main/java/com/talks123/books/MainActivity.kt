package com.talks123.books

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                val api = remember { BooksApi() }
                val scope = rememberCoroutineScope()
                var count by remember { mutableStateOf(0) }

                LaunchedEffect(Unit) {
                    scope.launch {
                        count = api.trending().size
                    }
                }

                Scaffold(
                    topBar = { TopAppBar(title = { Text("talks123 Books") }) }
                ) { p ->
                    Column(modifier = Modifier.fillMaxSize().padding(p).padding(16.dp)) {
                        Text("KMP app starter connected to backend")
                        Text("Trending books loaded: $count")
                    }
                }
            }
        }
    }
}
