const startPage = document.getElementById('start-page');
const cameraPage = document.getElementById('camera-page');
const collagePage = document.getElementById('collage-page');
const startButton = document.getElementById('start');
const startCapturingButton = document.getElementById('start-capturing');
const video = document.getElementById('video');
const countdownDiv = document.getElementById('countdown');
const takenPhotosDiv = document.getElementById('taken-photos');
const previewDiv = document.getElementById('preview');
const colorButtons = document.querySelectorAll('.color-button');
const takeNewPicturesButton = document.getElementById('take-new-pictures');
const downloadCollageButton = document.getElementById('download-collage');
let photosTaken = 0;
let countdownInterval;
let stream;
let currentFilter = 'none';

// Create a hidden canvas for capturing photos
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// Access the camera
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(s => {
      stream = s;
      video.srcObject = stream;
      video.play().catch(err => {
        console.error("Error playing video: ", err);
      });
    })
    .catch(err => {
      console.error("Error accessing the camera: ", err);
      countdownDiv.textContent = "Error accessing the camera.";
    });
}

// Start photobooth
startButton.addEventListener('click', () => {
  startPage.style.display = 'none';
  cameraPage.style.display = 'flex';
  startCamera();
});

// Take new pictures
takeNewPicturesButton.addEventListener('click', () => {
  collagePage.style.display = 'none';
  cameraPage.style.display = 'flex';
  photosTaken = 0;
  takenPhotosDiv.innerHTML = '';
  previewDiv.innerHTML = '';
  startCamera();
});

// Download collage
downloadCollageButton.addEventListener('click', () => {
  downloadCollage();
});

// Border color selection 
colorButtons.forEach(button => {
  button.addEventListener('click', () => {
    const color = button.getAttribute('data-color');

    // Update the border color of all photos inside collage-preview
    document.querySelectorAll(".collage-preview .photo-container").forEach(photo => {
      photo.style.borderColor = color;
    });
  });
});

function startPhotobooth() {
  photosTaken = 0;
  if (video.paused) {
    video.play().catch(err => {
      console.error("Error resuming video: ", err);
    });
  }
  takePhotos();
}

// Start capturing photos
startCapturingButton.addEventListener('click', () => {
  startPhotobooth();
});

function takePhotos() {
  if (photosTaken >= 4) {
    cameraPage.style.display = 'none';
    collagePage.style.display = 'flex';
    updateCollagePreview();
    stopCamera();
    return;
  }

  let count = 3;
  countdownDiv.textContent = count;

  countdownInterval = setInterval(() => {
    count--;
    countdownDiv.textContent = count;
    if (count <= 0) {
      clearInterval(countdownInterval);
      countdownDiv.textContent = ''; // Hide countdown text
      capturePhoto();
      photosTaken++;
      if (photosTaken < 4) {
        setTimeout(takePhotos, 1000);
      } else {
        setTimeout(() => {
          cameraPage.style.display = 'none';
          collagePage.style.display = 'flex';
          updateCollagePreview();
          stopCamera();
        }, 1000);
      }
    }
  }, 1000);
}

function capturePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Apply the current filter to the captured image
  context.filter = currentFilter;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.classList.add('photo');
  img.style.filter = currentFilter; // Apply the filter to the image only

  // Create a container for the image and apply the border
  const imgContainer = document.createElement('div');
  imgContainer.classList.add('photo-container');
  imgContainer.appendChild(img);

  // Append the container to the taken-photos div
  takenPhotosDiv.appendChild(imgContainer);

  // Clone the container and append it to the preview div
  const clonedContainer = imgContainer.cloneNode(true);
  previewDiv.appendChild(clonedContainer);
}

function updateCollagePreview() {
  const images = document.querySelectorAll("#taken-photos .photo-container");
  const collagePreview = document.querySelector(".collage-preview");

  collagePreview.innerHTML = ""; // Clear previous images

  images.forEach(container => {
    const newContainer = container.cloneNode(true);
    const img = newContainer.querySelector('img');
    img.style.filter = currentFilter; // Apply the filter to the image only

    // Ensure the image is fully loaded before appending
    img.onload = () => collagePreview.appendChild(newContainer);
    
    collagePreview.appendChild(newContainer);
  });
}

const filterButtons = document.querySelectorAll('.filter-button');
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.getAttribute('data-filter');
    currentFilter = filter; // Store the selected filter
    video.style.filter = filter; // Apply the filter to the video feed
  });
});

function downloadCollage() {
    const collagePreview = document.querySelector(".collage-preview");
  
    if (!collagePreview || collagePreview.innerHTML.trim() === "") {
      console.error("Collage preview is empty or not loaded.");
      return;
    }
  
    console.log("Starting collage download...");
  
    setTimeout(() => {
      domtoimage.toBlob(collagePreview)
        .then(blob => {
          console.log("Image created successfully.");
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'photobooth-collage.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log("Collage downloaded successfully.");
        })
        .catch(error => {
          console.error("Error capturing collage:", error);
        });
    }, 500); // Wait a bit to ensure images are loaded
  }

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null; // Clear the video source
  }
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && stream) {
    video.play().catch(err => {
      console.error("Error resuming video after visibility change: ", err);
    });
  }
});