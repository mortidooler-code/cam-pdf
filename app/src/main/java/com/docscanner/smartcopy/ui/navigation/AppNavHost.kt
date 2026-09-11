package com.docscanner.smartcopy.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.docscanner.smartcopy.ui.screens.CropScreen
import com.docscanner.smartcopy.ui.screens.HomeScreen
import com.docscanner.smartcopy.ui.screens.PreviewFilterScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = modifier
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToCrop = { docId ->
                    navController.navigate(Screen.Crop.createRoute(docId))
                },
                onNavigateToPreview = { docId ->
                    navController.navigate(Screen.PreviewFilter.createRoute(docId))
                }
            )
        }

        composable(
            route = Screen.Crop.route,
            arguments = listOf(
                navArgument("docId") {
                    type = NavType.StringType
                    defaultValue = "temp_doc"
                }
            )
        ) { backStackEntry ->
            val docId = backStackEntry.arguments?.getString("docId") ?: "temp_doc"
            CropScreen(
                docId = docId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onCropConfirmed = {
                    navController.navigate(Screen.PreviewFilter.createRoute(docId))
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
                onNavigateToCrop = {
                    navController.navigate(Screen.Crop.createRoute(docId))
                }
            )
        }
    }
}
