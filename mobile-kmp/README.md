# talks123 mobile app (Kotlin Multiplatform)

This is a starter Kotlin Multiplatform setup so the app can target **Android + iOS**.

## Features wired
- fetch trending books (`/api/trending`)
- fetch search (`/api/search?q=`)
- post reviews (`/api/books/reviews`)

## Next steps
1. Open in Android Studio (KMP plugin)
2. Set API base URL in `ApiConfig.kt`
3. Generate iOS target with KMP wizard and reuse shared module
4. Add auth cookie/session handling in Ktor client (Darwin + OkHttp engines)
