package com.docscanner.smartcopy.ui.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home_screen")
    object PreviewFilter : Screen("preview_filter_screen/{docId}") {
        fun createRoute(docId: String = "sample_1") = "preview_filter_screen/$docId"
    }
}
