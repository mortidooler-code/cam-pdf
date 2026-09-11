package com.docscanner.smartcopy.ui.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home_screen")
    object Crop : Screen("crop_screen/{docId}") {
        fun createRoute(docId: String = "temp_doc") = "crop_screen/$docId"
    }
    object PreviewFilter : Screen("preview_filter_screen/{docId}") {
        fun createRoute(docId: String = "sample_1") = "preview_filter_screen/$docId"
    }
}
