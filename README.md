# Modern Photobooth 🎭📸

A modern, feature-rich photobooth web application that creates beautiful photo collages with real-time filters and effects.

## ✨ Features

### 🎥 **Camera & Capture**
- **High-quality camera access** with HD video support
- **Automatic photo capture** with 3-second countdown
- **4-photo sequence** for perfect collage creation
- **Real-time preview** of captured photos

### 🎨 **Photo Filters**
- **None** - Clean, original photos
- **Black & White** - Classic monochrome look
- **Vintage** - Retro sepia tones
- **High Contrast** - Dramatic, bold images
- **Color Shift** - Creative hue rotation
- **Invert** - Artistic negative effect

### ✨ **Photo Effects**
- **None** - Original photo appearance
- **Vintage** - Warm, nostalgic tones with overlay
- **Dramatic** - High contrast with dark overlay
- **Warm** - Enhanced warm colors with orange tint

### 🖼️ **Collage Layouts**
- **Grid** - Classic 2x2 grid layout
- **Diamond** - Rotated diamond arrangement
- **Cross** - Creative cross pattern layout

### 🎨 **Customization**
- **6 border colors** (Pink, Black, Maroon, Blue, Grey, Green)
- **Real-time preview** of all changes
- **Instant updates** when switching options

### 💾 **Export & Share**
- **High-quality PNG download** with custom filename
- **Web Share API** support for mobile sharing
- **Social media ready** image format

## 🚀 Getting Started

### Prerequisites
- Modern web browser with camera support
- HTTPS connection (required for camera access)
- Camera permissions granted

### Installation
1. Clone or download the project files
2. Open `index.html` in a web browser
3. Grant camera permissions when prompted
4. Start creating amazing photo collages!

### Usage

#### 1. **Start the Photobooth**
- Click the "Start Photobooth" button
- Grant camera permissions
- Wait for camera to initialize

#### 2. **Take Photos**
- Click "Start Capturing" to begin
- Get ready for the 3-second countdown
- 4 photos will be taken automatically
- Watch your photo gallery fill up in real-time

#### 3. **Apply Filters & Effects**
- **Filters**: Choose from 6 different photo filters
- **Effects**: Apply artistic overlays and color adjustments
- All changes are applied in real-time

#### 4. **Customize Your Collage**
- **Border Color**: Choose from 6 beautiful border options
- **Layout**: Select from 3 different arrangement styles
- **Preview**: See changes instantly in the collage preview

#### 5. **Download & Share**
- **Download**: Save your collage as a high-quality PNG
- **Share**: Use the share button for mobile sharing
- **New Photos**: Start over with fresh photos

## 🛠️ Technical Details

### Built With
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **JavaScript ES6+** - Modern JavaScript features
- **Canvas API** - Photo processing and manipulation
- **MediaDevices API** - Camera access and video streaming
- **dom-to-image** - High-quality image export

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### Performance Features
- **Optimized canvas operations** for smooth performance
- **Efficient photo processing** with minimal memory usage
- **Responsive design** for all device sizes
- **Touch-friendly interface** for mobile devices

## 🔧 Customization

### Adding New Filters
```javascript
// Add to photoEffects object in script.js
newFilter: {
  filter: 'your-css-filter-here',
  overlay: 'rgba(r, g, b, a)' // Optional overlay
}
```

### Adding New Layouts
```javascript
// Add to layoutConfigs object in script.js
newLayout: {
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '20px',
  // Add custom CSS properties
}
```

### Changing Colors
```css
/* Modify CSS custom properties in styles.css */
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  /* ... other colors */
}
```

## 🐛 Bug Fixes & Improvements

### Fixed Issues
- ✅ **Camera access errors** - Better error handling and user feedback
- ✅ **Filter application bugs** - Filters now properly apply to captured photos
- ✅ **Photo quality issues** - Improved canvas operations and image processing
- ✅ **Mobile responsiveness** - Better touch support and mobile layout
- ✅ **Memory leaks** - Proper cleanup of camera streams and intervals

### New Features
- 🆕 **Photo effects system** with artistic overlays
- 🆕 **Multiple layout options** for creative collages
- 🆕 **Real-time photo preview** during capture
- 🆕 **Loading states** and progress indicators
- 🆕 **Error handling** with user-friendly messages
- 🆕 **Share functionality** for mobile devices
- 🆕 **Photo counter** showing progress
- 🆕 **Navigation buttons** for better UX
- 🆕 **Touch events** for mobile devices

## 📱 Mobile Experience

- **Touch-optimized** interface
- **Responsive design** for all screen sizes
- **Mobile camera** support
- **Touch gestures** for better interaction
- **Web Share API** integration

## 🎯 Future Enhancements

- [ ] **Video recording** capability
- [ ] **More photo effects** and filters
- [ ] **Custom collage templates**
- [ ] **Social media integration**
- [ ] **Cloud storage** for photos
- [ ] **Print integration**
- [ ] **QR code sharing**
- [ ] **Background music** during capture

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Kundyz** - [Portfolio](https://kundyzs.github.io/My-Dev-Portfolio/)

---

**Enjoy creating amazing photo collages! 📸✨**
