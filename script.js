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

// Create a hidden canvas for capturing photos
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// Access the camera
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(s => {
      stream = s;
      video.srcObject = stream;
      video.play();
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
    document.querySelectorAll(".collage-preview .photo").forEach(photo => {
      photo.style.borderColor = color;
    });
  });
});



function startPhotobooth() {
  photosTaken = 0;
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

  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.classList.add('photo');

  // Append the photo to the taken-photos div
  takenPhotosDiv.appendChild(img);

  // Clone the photo and append it to the preview div
  const clonedImg = img.cloneNode(true);
  previewDiv.appendChild(clonedImg);
}

function updateCollagePreview() {
  const images = document.querySelectorAll("#taken-photos img");
  const collagePreview = document.querySelector(".collage-preview");

  collagePreview.innerHTML = ""; // Clear previous images

  images.forEach(img => {
    const newImg = img.cloneNode(true);
    newImg.classList.add("photo");
    
    // Ensure the image is fully loaded before appending
    newImg.onload = () => collagePreview.appendChild(newImg);
    
    collagePreview.appendChild(newImg);
  });
}


function downloadCollage() {
  const collagePreview = document.querySelector(".collage-preview");

  if (!collagePreview || collagePreview.innerHTML.trim() === "") {
    console.error("Collage preview is empty or not loaded.");
    return;
  }

  setTimeout(() => {
    html2canvas(collagePreview, {
      useCORS: true, // Ensures cross-origin images are handled correctly
      allowTaint: true, // Allows tainted images to be drawn
      scale: window.devicePixelRatio || 1, // Ensures high-quality capture
      backgroundColor: null // Transparent background
    }).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'photobooth-collage.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(error => {
      console.error("Error capturing collage:", error);
    });
  }, 500); // Wait a bit to ensure images are loaded
}


function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}