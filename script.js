// DOM Elements
const startPage = document.getElementById('start-page');
const cameraPage = document.getElementById('camera-page');
const collagePage = document.getElementById('collage-page');
const startButton = document.getElementById('start');
const backToStartButton = document.getElementById('back-to-start');
const backToCameraButton = document.getElementById('back-to-camera');
const startCapturingButton = document.getElementById('start-capturing');
const video = document.getElementById('video');
const countdownDiv = document.getElementById('countdown');
const takenPhotosDiv = document.getElementById('taken-photos');
const previewDiv = document.getElementById('preview');
const photoCountSpan = document.getElementById('photo-count');
const colorButtons = document.querySelectorAll('.color-button');
const layoutButtons = document.querySelectorAll('.layout-button');
const takeNewPicturesButton = document.getElementById('take-new-pictures');
const downloadCollageButton = document.getElementById('download-collage');
const shareCollageButton = document.getElementById('share-collage');
const filterButtons = document.querySelectorAll('.filter-button');
const effectButtons = document.querySelectorAll('.effect-button');
const loadingOverlay = document.getElementById('loading-overlay');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const errorCloseButton = document.getElementById('error-close');

// State variables
let photosTaken = 0;
let countdownInterval;
let stream;
let currentFilter = 'none';
let currentEffect = 'none';
let currentLayout = 'grid';
let currentBorderColor = 'mistyrose';
let isCapturing = false;

// Create hidden canvas for photo processing
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// Photo effects configuration
const photoEffects = {
  none: {},
  vintage: {
    filter: 'sepia(80%) contrast(120%) brightness(90%)',
    overlay: 'rgba(139, 69, 19, 0.3)'
  },
  dramatic: {
    filter: 'contrast(150%) brightness(80%) saturate(120%)',
    overlay: 'rgba(0, 0, 0, 0.2)'
  },
  warm: {
    filter: 'sepia(30%) brightness(110%) saturate(130%)',
    overlay: 'rgba(255, 165, 0, 0.2)'
  }
};

// Layout configurations
const layoutConfigs = {
  grid: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  diamond: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    transform: 'rotate(45deg)'
  },
  cross: {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px'
  }
};

// Initialize the application
function init() {
  setupEventListeners();
  checkCameraSupport();
}

// Setup all event listeners
function setupEventListeners() {
  // Navigation
  startButton.addEventListener('click', startPhotobooth);
  backToStartButton.addEventListener('click', goToStart);
  backToCameraButton.addEventListener('click', goToCamera);
  
  // Camera controls
  startCapturingButton.addEventListener('click', startPhotoCapture);
  
  // Photo options
  filterButtons.forEach(button => {
    button.addEventListener('click', () => selectFilter(button));
  });
  
  effectButtons.forEach(button => {
    button.addEventListener('click', () => selectEffect(button));
  });
  
  // Collage options
  colorButtons.forEach(button => {
    button.addEventListener('click', () => selectBorderColor(button));
  });
  
  layoutButtons.forEach(button => {
    button.addEventListener('click', () => selectLayout(button));
  });
  
  // Actions
  takeNewPicturesButton.addEventListener('click', takeNewPictures);
  downloadCollageButton.addEventListener('click', downloadCollage);
  shareCollageButton.addEventListener('click', shareCollage);
  errorCloseButton.addEventListener('click', hideError);
  
  // Touch events for mobile
  downloadCollageButton.addEventListener('touchstart', downloadCollage);
  shareCollageButton.addEventListener('touchstart', shareCollage);
}

// Check if camera is supported
function checkCameraSupport() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError('Camera is not supported in this browser');
    return false;
  }
  return true;
}

// Start the photobooth
function startPhotobooth() {
  if (!checkCameraSupport()) return;
  
  startPage.style.display = 'none';
  cameraPage.style.display = 'flex';
  startCamera();
}

// Go back to start page
function goToStart() {
  stopCamera();
  resetState();
  cameraPage.style.display = 'none';
  startPage.style.display = 'flex';
}

// Go back to camera page
function goToCamera() {
  collagePage.style.display = 'none';
  cameraPage.style.display = 'flex';
  startCamera();
}

// Start camera
function startCamera() {
  showLoading('Starting camera...');
  
  navigator.mediaDevices.getUserMedia({ 
    video: { 
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    } 
  })
  .then(mediaStream => {
    stream = mediaStream;
    video.srcObject = stream;
    
    return video.play();
  })
  .then(() => {
    hideLoading();
    updatePhotoCount();
    console.log('Camera started successfully');
  })
  .catch(error => {
    hideLoading();
    console.error('Camera error:', error);
    showError(`Camera access failed: ${error.message}`);
  });
}

// Start photo capture sequence
function startPhotoCapture() {
  if (isCapturing) return;
  
  isCapturing = true;
  startCapturingButton.disabled = true;
  startCapturingButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturing...';
  
  takePhotos();
}

// Take photos sequence
function takePhotos() {
  if (photosTaken >= 4) {
    finishPhotoSession();
    return;
  }

  let count = 3;
  countdownDiv.textContent = count;
  countdownDiv.style.display = 'block';

  countdownInterval = setInterval(() => {
    count--;
    countdownDiv.textContent = count;
    
    if (count <= 0) {
      clearInterval(countdownInterval);
      countdownDiv.style.display = 'none';
      capturePhoto();
      photosTaken++;
      updatePhotoCount();
      
      if (photosTaken < 4) {
        setTimeout(takePhotos, 1000);
      } else {
        setTimeout(finishPhotoSession, 1000);
      }
    }
  }, 1000);
}

// Capture a single photo
function capturePhoto() {
  try {
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas and draw video frame
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply current filter
    if (currentFilter !== 'none') {
      context.filter = currentFilter;
      context.drawImage(canvas, 0, 0);
    }
    
    // Convert to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Create photo elements
    createPhotoElement(photoDataUrl, 'taken-photos');
    createPhotoElement(photoDataUrl, 'preview');
    
  } catch (error) {
    console.error('Photo capture error:', error);
    showError('Failed to capture photo');
  }
}

// Create photo element
function createPhotoElement(photoDataUrl, containerId) {
  const container = document.getElementById(containerId);
  const img = document.createElement('img');
  const imgContainer = document.createElement('div');
  
  img.src = photoDataUrl;
  img.classList.add('photo');
  img.style.filter = currentFilter;
  
  // Apply photo effect
  if (currentEffect !== 'none') {
    const effect = photoEffects[currentEffect];
    img.style.filter = `${img.style.filter} ${effect.filter}`;
    
    if (effect.overlay) {
      imgContainer.style.position = 'relative';
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${effect.overlay};
        pointer-events: none;
        border-radius: inherit;
      `;
      imgContainer.appendChild(overlay);
    }
  }
  
  imgContainer.classList.add('photo-container');
  imgContainer.appendChild(img);
  
  // Add animation
  imgContainer.style.opacity = '0';
  imgContainer.style.transform = 'scale(0.8)';
  imgContainer.style.transition = 'all 0.3s ease';
  
  container.appendChild(imgContainer);
  
  // Trigger animation
  setTimeout(() => {
    imgContainer.style.opacity = '1';
    imgContainer.style.transform = 'scale(1)';
  }, 100);
}

// Finish photo session
function finishPhotoSession() {
  isCapturing = false;
  startCapturingButton.disabled = false;
  startCapturingButton.innerHTML = '<i class="fas fa-camera"></i> Start Capturing';
  
  cameraPage.style.display = 'none';
  collagePage.style.display = 'flex';
  
  updateCollagePreview();
  stopCamera();
}

// Update photo count display
function updatePhotoCount() {
  photoCountSpan.textContent = photosTaken;
}

// Update collage preview
function updateCollagePreview() {
  const previewContainer = document.getElementById('preview');
  const images = document.querySelectorAll("#taken-photos .photo-container");
  
  previewContainer.innerHTML = '';
  
  images.forEach((container, index) => {
    const newContainer = container.cloneNode(true);
    const img = newContainer.querySelector('img');
    
    // Ensure image is loaded
    if (img.complete) {
      previewContainer.appendChild(newContainer);
    } else {
      img.onload = () => previewContainer.appendChild(newContainer);
    }
  });
  
  applyLayout();
}

// Apply selected layout
function applyLayout() {
  const previewContainer = document.getElementById('preview');
  const layout = layoutConfigs[currentLayout];
  
  Object.assign(previewContainer.style, layout);
  
  // Special handling for cross layout
  if (currentLayout === 'cross') {
    const photos = previewContainer.querySelectorAll('.photo-container');
    if (photos.length === 4) {
      photos[1].style.gridColumn = '2';
      photos[2].style.gridColumn = '2';
    }
  }
}

// Select filter
function selectFilter(button) {
  // Remove active class from all filter buttons
  filterButtons.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected button
  button.classList.add('active');
  
  // Update current filter
  currentFilter = button.getAttribute('data-filter');
  
  // Apply filter to video
  video.style.filter = currentFilter;
  
  // Update existing photos
  updateExistingPhotos();
}

// Select effect
function selectEffect(button) {
  // Remove active class from all effect buttons
  effectButtons.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected button
  button.classList.add('active');
  
  // Update current effect
  currentEffect = button.getAttribute('data-effect');
  
  // Update existing photos
  updateExistingPhotos();
}

// Select border color
function selectBorderColor(button) {
  // Remove active class from all color buttons
  colorButtons.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected button
  button.classList.add('active');
  
  // Update current border color
  currentBorderColor = button.getAttribute('data-color');
  
  // Apply border color to collage preview
  document.querySelectorAll(".preview-container .photo").forEach(photo => {
    photo.style.borderColor = currentBorderColor;
  });
}

// Select layout
function selectLayout(button) {
  // Remove active class from all layout buttons
  layoutButtons.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected button
  button.classList.add('active');
  
  // Update current layout
  currentLayout = button.getAttribute('data-layout');
  
  // Apply layout
  applyLayout();
}

// Update existing photos with new filter/effect
function updateExistingPhotos() {
  const photos = document.querySelectorAll('.photo');
  photos.forEach(photo => {
    photo.style.filter = currentFilter;
    
    if (currentEffect !== 'none') {
      const effect = photoEffects[currentEffect];
      photo.style.filter = `${photo.style.filter} ${effect.filter}`;
    }
  });
}

// Download collage
function downloadCollage() {
  const collagePreview = document.querySelector(".preview-container");
  
  if (!collagePreview || collagePreview.innerHTML.trim() === "") {
    showError("No photos to download");
    return;
  }
  
  showLoading('Creating your collage...');
  
  // Use dom-to-image library
  if (typeof domtoimage !== 'undefined') {
    domtoimage.toPng(collagePreview, { 
      quality: 0.95,
      bgcolor: '#ffffff'
    })
    .then(function (dataUrl) {
      hideLoading();
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `photobooth-collage-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(function (error) {
      hideLoading();
      console.error('Download error:', error);
      showError('Failed to create collage');
    });
  } else {
    hideLoading();
    showError('Download feature not available');
  }
}

// Share collage
function shareCollage() {
  const collagePreview = document.querySelector(".preview-container");
  
  if (!collagePreview || collagePreview.innerHTML.trim() === "") {
    showError("No photos to share");
    return;
  }
  
  showLoading('Preparing to share...');
  
  // Use dom-to-image to create shareable image
  if (typeof domtoimage !== 'undefined') {
    domtoimage.toBlob(collagePreview, { 
      quality: 0.95,
      bgcolor: '#ffffff'
    })
    .then(function (blob) {
      hideLoading();
      
      // Check if Web Share API is supported
      if (navigator.share) {
        const file = new File([blob], 'photobooth-collage.png', { type: 'image/png' });
        navigator.share({
          title: 'My Photobooth Collage',
          text: 'Check out my awesome photobooth collage!',
          files: [file]
        }).catch(error => {
          console.log('Share cancelled or failed:', error);
        });
      } else {
        // Fallback: copy to clipboard or show download
        showError('Sharing not supported. Use download instead.');
      }
    })
    .catch(function (error) {
      hideLoading();
      console.error('Share error:', error);
      showError('Failed to prepare collage for sharing');
    });
  } else {
    hideLoading();
    showError('Sharing feature not available');
  }
}

// Take new pictures
function takeNewPictures() {
  collagePage.style.display = 'none';
  cameraPage.style.display = 'flex';
  
  resetState();
  startCamera();
}

// Reset application state
function resetState() {
  photosTaken = 0;
  currentFilter = 'none';
  currentEffect = 'none';
  currentLayout = 'grid';
  currentBorderColor = 'mistyrose';
  isCapturing = false;
  
  // Reset UI
  takenPhotosDiv.innerHTML = '';
  previewDiv.innerHTML = '';
  updatePhotoCount();
  
  // Reset button states
  filterButtons.forEach(btn => btn.classList.remove('active'));
  filterButtons[0].classList.add('active');
  
  effectButtons.forEach(btn => btn.classList.remove('active'));
  effectButtons[0].classList.add('active');
  
  colorButtons.forEach(btn => btn.classList.remove('active'));
  colorButtons[0].classList.add('active');
  
  layoutButtons.forEach(btn => btn.classList.remove('active'));
  layoutButtons[0].classList.add('active');
  
  startCapturingButton.disabled = false;
  startCapturingButton.innerHTML = '<i class="fas fa-camera"></i> Start Capturing';
  
  // Clear video filter
  video.style.filter = 'none';
}

// Stop camera
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
  }
}

// Show loading overlay
function showLoading(message = 'Loading...') {
  loadingOverlay.querySelector('p').textContent = message;
  loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
  loadingOverlay.style.display = 'none';
}

// Show error modal
function showError(message) {
  errorMessage.textContent = message;
  errorModal.style.display = 'flex';
}

// Hide error modal
function hideError() {
  errorModal.style.display = 'none';
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && stream) {
    video.play().catch(err => {
      console.error("Error resuming video after visibility change: ", err);
    });
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  if (currentLayout) {
    applyLayout();
  }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);