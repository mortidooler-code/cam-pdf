package com.docscanner.smartcopy.ui.navigation

import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.docscanner.smartcopy.ui.screens.HomeScreen
import com.docscanner.smartcopy.ui.screens.PreviewFilterScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    onLaunchCamera: () -> Unit = {},
    onLaunchGallery: () -> Unit = {}
) {
    val context = LocalContext.current

    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = modifier
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToPreview = { docId ->
                    navController.navigate(Screen.PreviewFilter.createRoute(docId))
                },
                onLaunchCamera = {
                    onLaunchCamera()
                    // در فاز اول مستقیماً به صفحه پیش‌نمایش جهت تنظیم فیلتر می‌رود
                    navController.navigate(Screen.PreviewFilter.createRoute("camera_scan_new"))
                },
                onLaunchGallery = {
                    onLaunchGallery()
                    navController.navigate(Screen.PreviewFilter.createRoute("gallery_pick_new"))
                }
            )
        }

        composable(
            route = Screen.PreviewFilter.route,
            arguments = listOf(
                navArgument("docId") {
                    type = NavType.StringType
                    defaultValue = "sample_1"
                }
            )
        ) { backStackEntry ->
            val docId = backStackEntry.arguments?.getString("docId") ?: "sample_1"
            PreviewFilterScreen(
                docId = docId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onSaveDocument = { filterType ->
                    Toast.makeText(
                        context,
                        "سند با فیلتر «${filterType.title}» با موفقیت در حافظه ذخیره شد",
                        Toast.LENGTH_SHORT
                    ).show()
                },
                onShareDocument = { filterType ->
                    Toast.makeText(
                        context,
                        "اشتراک‌گذاری نسخه ${filterType.title} آماده شد",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            )
        }
    }
}
