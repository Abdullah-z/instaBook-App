package modules.nearbychat

import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*
import com.google.android.gms.tasks.Tasks
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.nio.charset.StandardCharsets
import java.util.concurrent.ExecutionException

class NearbyChatModule : Module() {

  companion object {
    const val TAG = "NearbyChatModule"
    const val SERVICE_ID = "com.circles.nearbychat"
  }

  private val connectedEndpoints = mutableMapOf<String, String>()
  // File transfer tracking
  private val incomingFilePayloads = mutableMapOf<Long, Payload>()
  private val incomingFileMeta = mutableMapOf<Long, Triple<String, String, String>>() // payloadId -> (endpointId, senderName, filename)
  // Track payloads whose transfer is fully complete (SUCCESS fired)
  // We only process (copy + emit) after SUCCESS because onPayloadReceived(FILE)
  // fires when the download STARTS, not ends.
  private val completedFilePayloadIds = mutableSetOf<Long>()

  private val payloadCallback = object : PayloadCallback() {
    override fun onPayloadReceived(endpointId: String, payload: Payload) {
      Log.d(TAG, "Payload received: id=${payload.id} type=${payload.type}")
      when (payload.type) {
        Payload.Type.BYTES -> {
          val raw = String(payload.asBytes()!!, StandardCharsets.UTF_8)
          if (raw.startsWith("FILE_META:")) {
            // Format: FILE_META:<payloadId>:<senderName>:<filename>
            val body = raw.removePrefix("FILE_META:")
            val parts = body.split(":", limit = 3)
            if (parts.size == 3) {
              val payloadId = parts[0].toLongOrNull() ?: return
              incomingFileMeta[payloadId] = Triple(endpointId, parts[1], parts[2])
              Log.d(TAG, "File meta received: payloadId=$payloadId sender=${parts[1]} file=${parts[2]}")
              
              // Only process if the file transfer already completed (SUCCESS fired).
              // If the transfer is still in progress, processFilePayload will be called
              // from the SUCCESS branch of onPayloadTransferUpdate instead.
              if (completedFilePayloadIds.contains(payloadId)) {
                Log.d(TAG, "File transfer already complete for $payloadId, processing now")
                processFilePayload(payloadId)
              } else {
                Log.d(TAG, "File transfer still in progress for $payloadId, waiting for SUCCESS")
              }
            }
          } else {
            val parts = raw.split("|", limit = 2)
            val senderName = if (parts.size > 1) parts[0] else connectedEndpoints[endpointId] ?: "Unknown"
            val message = if (parts.size > 1) parts[1] else raw
            sendEvent("onMessageReceived", mapOf(
              "endpointId" to endpointId,
              "senderName" to senderName,
              "message" to message,
              "timestamp" to System.currentTimeMillis()
            ))
          }
        }
        Payload.Type.FILE -> {
          Log.d(TAG, "Incoming file payload started: id=${payload.id}")
          incomingFilePayloads[payload.id] = payload
          // Do NOT call processFilePayload here — transfer not yet complete.
          // onPayloadTransferUpdate SUCCESS is the correct trigger.
        }
        else -> {}
      }
    }

    override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
      when (update.status) {
        PayloadTransferUpdate.Status.IN_PROGRESS -> {
          sendEvent("onImageProgress", mapOf(
            "payloadId" to update.payloadId,
            "bytesTransferred" to update.bytesTransferred,
            "totalBytes" to update.totalBytes,
            "status" to "progress"
          ))
        }
        PayloadTransferUpdate.Status.SUCCESS -> {
          Log.d(TAG, "Payload SUCCESS: id=${update.payloadId}")
          if (incomingFilePayloads.containsKey(update.payloadId)) {
            // Mark as complete, then process.
            // If metadata hasn't arrived yet, processFilePayload will return early;
            // it will be called again from the BYTES handler once meta arrives.
            completedFilePayloadIds.add(update.payloadId)
            processFilePayload(update.payloadId)
          }
        }
        PayloadTransferUpdate.Status.FAILURE -> {
          incomingFilePayloads.remove(update.payloadId)
          incomingFileMeta.remove(update.payloadId)
          completedFilePayloadIds.remove(update.payloadId)
          Log.e(TAG, "File transfer FAILED for payloadId=${update.payloadId}")
        }
        else -> {}
      }
    }
  }

  private fun processFilePayload(payloadId: Long) {
    val filePayload = incomingFilePayloads[payloadId] ?: return
    val meta = incomingFileMeta[payloadId] ?: return
    
    // Both payload and meta are here. Now wait for SUCCESS status if not already success
    // Actually, processFilePayload is called from SUCCESS or when meta arrives after file.
    
    try {
      val ctx = appContext.reactContext ?: return
      val payloadFile = filePayload.asFile() ?: return
      val uri = payloadFile.asUri()
      
      if (uri == null) {
        Log.e(TAG, "payload Uri is null for payload $payloadId")
        return
      }

      // Create a stable destination in cacheDir
      val destFile = File(ctx.cacheDir, "nearby_img_${System.currentTimeMillis()}.jpg")
      
      Log.d(TAG, "Copying received file from Uri $uri to ${destFile.absolutePath}")
      ctx.contentResolver.openInputStream(uri)?.use { input ->
        destFile.outputStream().use { output ->
          input.copyTo(output)
        }
      }
      
      // Remove from maps after successful processing
      incomingFilePayloads.remove(payloadId)
      incomingFileMeta.remove(payloadId)
      completedFilePayloadIds.remove(payloadId)
      
      Log.d(TAG, "✅ File processed successfully: ${destFile.absolutePath}")
      sendEvent("onImageReceived", mapOf(
        "endpointId" to meta.first,
        "senderName" to meta.second,
        "filePath" to destFile.absolutePath,
        "fileName" to meta.third,
        "timestamp" to System.currentTimeMillis()
      ))
    } catch (e: Exception) {
      Log.e(TAG, "processFilePayload error: ${e.message}")
    }
  }

  private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
    override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
      Log.d(TAG, "Connection initiated from $endpointId (${info.endpointName})")
      connectedEndpoints[endpointId] = info.endpointName
      appContext.reactContext?.let { ctx ->
        Nearby.getConnectionsClient(ctx).acceptConnection(endpointId, payloadCallback)
          .addOnSuccessListener { Log.d(TAG, "Accepted connection from $endpointId") }
          .addOnFailureListener { Log.e(TAG, "Accept failed: ${it.message}") }
      }
    }

    override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
      if (result.status.isSuccess) {
        Log.d(TAG, "Connected to $endpointId (${connectedEndpoints[endpointId]})")
        sendEvent("onConnected", mapOf("endpointId" to endpointId, "name" to (connectedEndpoints[endpointId] ?: "")))
      } else {
        Log.w(TAG, "Connection to $endpointId failed: code=${result.status.statusCode}")
        connectedEndpoints.remove(endpointId)
        sendEvent("onConnectionFailed", mapOf("endpointId" to endpointId, "statusCode" to result.status.statusCode))
      }
    }

    override fun onDisconnected(endpointId: String) {
      Log.d(TAG, "Disconnected from $endpointId")
      connectedEndpoints.remove(endpointId)
      sendEvent("onDisconnected", mapOf("endpointId" to endpointId))
    }
  }

  private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
    override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
      Log.d(TAG, "Endpoint found: $endpointId name=${info.endpointName}")
      sendEvent("onPeerFound", mapOf("endpointId" to endpointId, "name" to info.endpointName))
    }

    override fun onEndpointLost(endpointId: String) {
      Log.d(TAG, "Endpoint lost: $endpointId")
      connectedEndpoints.remove(endpointId)
      sendEvent("onPeerLost", mapOf("endpointId" to endpointId))
    }
  }

  override fun definition() = ModuleDefinition {
    Name("NearbyChat")

    Events("onPeerFound", "onPeerLost", "onConnected", "onDisconnected",
           "onMessageReceived", "onConnectionFailed", "onImageReceived", "onImageProgress")

    AsyncFunction("startAdvertising") { name: String ->
      val ctx = appContext.reactContext ?: throw Exception("No Android context available")
      val wifiManager = ctx.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
      if (!wifiManager.isWifiEnabled) {
        throw Exception("WIFI_REQUIRED: WiFi radio is OFF. Please turn WiFi ON in your quick settings — you do NOT need to connect to any network.")
      }
      val options = AdvertisingOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build()
      try {
        Tasks.await(Nearby.getConnectionsClient(ctx).startAdvertising(name, SERVICE_ID, connectionLifecycleCallback, options))
        Log.d(TAG, "✅ Advertising started as '$name'")
      } catch (e: ExecutionException) {
        throw Exception("Advertising failed: ${e.cause?.message ?: e.message}")
      }
    }

    AsyncFunction("startDiscovery") { name: String ->
      val ctx = appContext.reactContext ?: throw Exception("No Android context available")
      val options = DiscoveryOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build()
      try {
        Tasks.await(Nearby.getConnectionsClient(ctx).startDiscovery(SERVICE_ID, endpointDiscoveryCallback, options))
        Log.d(TAG, "✅ Discovery started")
      } catch (e: ExecutionException) {
        throw Exception("Discovery failed: ${e.cause?.message ?: e.message}")
      }
    }

    AsyncFunction("stopAll") {
      val ctx = appContext.reactContext ?: return@AsyncFunction Unit
      try {
        Nearby.getConnectionsClient(ctx).stopAllEndpoints()
        Nearby.getConnectionsClient(ctx).stopAdvertising()
        Nearby.getConnectionsClient(ctx).stopDiscovery()
        connectedEndpoints.clear()
        incomingFilePayloads.clear()
        incomingFileMeta.clear()
        completedFilePayloadIds.clear()
        Log.d(TAG, "✅ Stopped all Nearby activity")
      } catch (e: Exception) {
        Log.e(TAG, "stopAll error: ${e.message}")
      }
    }

    AsyncFunction("connectToEndpoint") { endpointId: String, name: String ->
      val ctx = appContext.reactContext ?: throw Exception("No Android context available")
      connectedEndpoints[endpointId] = name
      try {
        Tasks.await(Nearby.getConnectionsClient(ctx).requestConnection(name, endpointId, connectionLifecycleCallback))
        Log.d(TAG, "✅ Connection requested to $endpointId")
      } catch (e: ExecutionException) {
        connectedEndpoints.remove(endpointId)
        throw Exception("Connect failed: ${e.cause?.message ?: e.message}")
      }
    }

    AsyncFunction("sendMessage") { endpointId: String, message: String, senderName: String ->
      val ctx = appContext.reactContext ?: throw Exception("No Android context available")
      val payload = Payload.fromBytes("$senderName|$message".toByteArray(StandardCharsets.UTF_8))
      Tasks.await(Nearby.getConnectionsClient(ctx).sendPayload(endpointId, payload))
    }

    AsyncFunction("sendBroadcast") { message: String, senderName: String ->
      val ctx = appContext.reactContext ?: throw Exception("No Android context available")
      val payload = Payload.fromBytes("$senderName|$message".toByteArray(StandardCharsets.UTF_8))
      val tasks = connectedEndpoints.keys.map { id ->
        Nearby.getConnectionsClient(ctx).sendPayload(id, payload)
      }
      if (tasks.isNotEmpty()) Tasks.await(Tasks.whenAll(tasks))
    }

    // ── Send image file to a specific endpoint
    AsyncFunction("sendImageFile") { endpointId: String, filePath: String, senderName: String ->
      val ctx = appContext.reactContext ?: throw Exception("No Android context available")
      val file = File(filePath)
      if (!file.exists()) throw Exception("Image file not found: $filePath")

      try {
        val pfd = android.os.ParcelFileDescriptor.open(file, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
        // NOTE: Do NOT close pfd here. Payload.fromFile() transfers ownership to the
        // Nearby Connections SDK, which closes it automatically once the transfer completes.
        val filePayload = Payload.fromFile(pfd)
        // Send metadata BYTES first so receiver knows what's coming
        val meta = "FILE_META:${filePayload.id}:$senderName:${file.name}"
        val metaPayload = Payload.fromBytes(meta.toByteArray(StandardCharsets.UTF_8))

        Tasks.await(Nearby.getConnectionsClient(ctx).sendPayload(endpointId, metaPayload))
        Tasks.await(Nearby.getConnectionsClient(ctx).sendPayload(endpointId, filePayload))
        Log.d(TAG, "✅ Image file queued for send to $endpointId (payloadId=${filePayload.id})")
      } catch (e: ExecutionException) {
        throw Exception("Image send failed: ${e.cause?.message ?: e.message}")
      }
    }

    // ── Broadcast image to all connected endpoints
    AsyncFunction("broadcastImageFile") { filePath: String, senderName: String ->
      val ctx = appContext.reactContext ?: throw Exception("No Android context available")
      val file = File(filePath)
      if (!file.exists()) throw Exception("Image file not found: $filePath")

      connectedEndpoints.keys.forEach { endpointId ->
        try {
          // Each endpoint needs its OWN PFD + payload instance.
          // Do NOT close the pfd — the SDK takes ownership and closes it after transfer.
          val pfd = android.os.ParcelFileDescriptor.open(file, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
          val filePayload = Payload.fromFile(pfd)
          val meta = "FILE_META:${filePayload.id}:$senderName:/room/${file.name}"
          val metaPayload = Payload.fromBytes(meta.toByteArray(StandardCharsets.UTF_8))
          
          Tasks.await(Nearby.getConnectionsClient(ctx).sendPayload(endpointId, metaPayload))
          Tasks.await(Nearby.getConnectionsClient(ctx).sendPayload(endpointId, filePayload))
          Log.d(TAG, "✅ Image file queued for broadcast to $endpointId (payloadId=${filePayload.id})")
        } catch (e: Exception) {
          Log.e(TAG, "Broadcast image to $endpointId failed: ${e.message}")
        }
      }
    }
  }
}
