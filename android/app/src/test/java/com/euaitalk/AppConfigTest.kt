package com.euaitalk

import org.junit.Test
import org.junit.Assert.*

/**
 * Unit tests for BuildConfig and app constants
 */
class AppConfigTest {
    
    @Test
    fun testServerUrlIsConfigured() {
        // BuildConfig.SERVER_URL should be set from build.gradle
        assertNotNull("SERVER_URL should not be null", BuildConfig.SERVER_URL)
        assertTrue("SERVER_URL should not be empty", BuildConfig.SERVER_URL.isNotEmpty())
    }
    
    @Test
    fun testApplicationIdIsCorrect() {
        assertEquals("Application ID should match", "com.euaitalk", BuildConfig.APPLICATION_ID)
    }
    
    @Test
    fun testBuildTypeIsValid() {
        // Build type should be either debug or release
        assertTrue(
            "Build type should be debug or release",
            BuildConfig.BUILD_TYPE == "debug" || BuildConfig.BUILD_TYPE == "release"
        )
    }
    
    @Test
    fun testVersionCodeIsPositive() {
        assertTrue("Version code should be positive", BuildConfig.VERSION_CODE > 0)
    }
    
    @Test
    fun testVersionNameIsNotEmpty() {
        assertNotNull("Version name should not be null", BuildConfig.VERSION_NAME)
        assertTrue("Version name should not be empty", BuildConfig.VERSION_NAME.isNotEmpty())
    }
    
    @Test
    fun testDebugFlagConsistency() {
        // In debug builds, DEBUG should be true; in release builds, it should be false
        if (BuildConfig.BUILD_TYPE == "debug") {
            assertTrue("DEBUG should be true in debug builds", BuildConfig.DEBUG)
        } else if (BuildConfig.BUILD_TYPE == "release") {
            assertFalse("DEBUG should be false in release builds", BuildConfig.DEBUG)
        }
    }
}
