package com.docscanner.smartcopy

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.compose.rememberNavController
import com.docscanner.smartcopy.ui.navigation.AppNavHost
import com.docscanner.smartcopy.ui.theme.SmartDocScannerTheme

class MainActivity : ComponentActivity() {

    // درخواست مجوز دوربین نیتیو اندروید
    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Toast.makeText(this, "دسترسی دوربین تأیید شد", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "برای اسکن مستقیم مدارک به مجوز دوربین نیاز است", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            SmartDocScannerTheme {
                val navController = rememberNavController()

                Surface(
                    modifier = Modifier.fillMaxSize()
                ) {
                    AppNavHost(
                        navController = navController,
                        onLaunchCamera = {
                            checkAndRequestCameraPermission()
                        },
                        onLaunchGallery = {
                            // باز کردن گالری
                        }
                    )
                }
            }
        }
    }

    private fun checkAndRequestCameraPermission() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.CAMERA
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }
}
