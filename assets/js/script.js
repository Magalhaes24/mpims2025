// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDn843xz8_5KVyUNN4kQvikveyJErXKxuA",
  authDomain: "mpims2025.firebaseapp.com",
  projectId: "mpims2025",
  storageBucket: "mpims2025.appspot.com",
  messagingSenderId: "851547625194",
  appId: "1:851547625194:web:8b42bd3d5302763a68e993"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);
const storage = firebase.storage(app);

const camera = document.getElementById("camera");
const photoCanvas = document.getElementById("photoCanvas");
const captureButton = document.getElementById("captureButton");

// Check and Ask for Camera Permissions
window.onload = async () => {
  const cameraAccess = localStorage.getItem("cameraAccess");

  if (cameraAccess === null) {
    // Ask for permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      localStorage.setItem("cameraAccess", "granted");
      startCamera(stream);
    } catch (error) {
      localStorage.setItem("cameraAccess", "denied");
      console.error("Camera access denied: ", error);
    }
  } else if (cameraAccess === "granted") {
    // Automatically start camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      startCamera(stream);
    } catch (error) {
      console.error("Error accessing camera: ", error);
    }
  }
};

// Start Camera Stream
function startCamera(stream) {
  camera.srcObject = stream;
  camera.style.display = "block";
  captureButton.style.display = "block";
}

// Capture Photo
captureButton.addEventListener("click", () => {
  const context = photoCanvas.getContext("2d");
  photoCanvas.width = camera.videoWidth;
  photoCanvas.height = camera.videoHeight;
  context.drawImage(camera, 0, 0, photoCanvas.width, photoCanvas.height);

  // Show the photo
  photoCanvas.style.display = "block";
});

// Upload Media
async function uploadMedia() {
  const description = document.getElementById("description").value;
  const status = document.getElementById("status");
  const fileInput = document.getElementById("mediaFile");

  if (!description) {
    status.textContent = "Please provide a description.";
    status.style.color = "red";
    return;
  }

  let file, fileName;

  if (fileInput.files[0]) {
    // Upload selected file
    file = fileInput.files[0];
    fileName = Date.now() + "_" + file.name;
  } else if (photoCanvas.style.display !== "none") {
    // Upload captured photo
    const blob = await new Promise((resolve) => photoCanvas.toBlob(resolve));
    file = blob;
    fileName = Date.now() + "_photo.png";
  } else {
    status.textContent = "Please select or capture a file.";
    status.style.color = "red";
    return;
  }

  const storageRef = storage.ref().child(`uploads/${fileName}`);
  const docRef = db.collection("photos"); // Use the "photos" collection

  try {
    // Upload to Firebase Storage
    await storageRef.put(file);
    const fileUrl = await storageRef.getDownloadURL();

    // Save metadata to Firestore
    await docRef.add({
      description: description,
      fileUrl: fileUrl,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    status.textContent = "Upload successful!";
    status.style.color = "green";

    // Clear the form
    fileInput.value = "";
    document.getElementById("description").value = "";
    photoCanvas.style.display = "none";
  } catch (error) {
    console.error("Error uploading file: ", error);
    status.textContent = "Error uploading file.";
    status.style.color = "red";
  }
}
