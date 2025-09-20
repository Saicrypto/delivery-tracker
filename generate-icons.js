const sharp = require('sharp');
const fs = require('fs');

// Simple SVG for delivery truck icon
const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="64" fill="#3b82f6"/>
  
  <!-- Delivery truck icon -->
  <g transform="translate(64, 128)">
    <!-- Truck body -->
    <rect x="0" y="160" width="240" height="120" rx="8" fill="white"/>
    <!-- Truck cab -->
    <rect x="240" y="120" width="120" height="160" rx="8" fill="white"/>
    <!-- Truck front -->
    <rect x="360" y="140" width="20" height="120" rx="4" fill="#e5e7eb"/>
    
    <!-- Wheels -->
    <circle cx="80" cy="320" r="32" fill="#374151"/>
    <circle cx="80" cy="320" r="20" fill="#6b7280"/>
    <circle cx="280" cy="320" r="32" fill="#374151"/>
    <circle cx="280" cy="320" r="20" fill="#6b7280"/>
    
    <!-- Delivery boxes in truck -->
    <rect x="20" y="180" width="40" height="40" rx="4" fill="#3b82f6"/>
    <rect x="80" y="180" width="40" height="40" rx="4" fill="#10b981"/>
    <rect x="140" y="180" width="40" height="40" rx="4" fill="#f59e0b"/>
    <rect x="200" y="180" width="40" height="40" rx="4" fill="#ef4444"/>
    
    <!-- Windshield -->
    <rect x="260" y="140" width="80" height="60" rx="4" fill="#dbeafe"/>
    
    <!-- Door handle -->
    <circle cx="340" cy="200" r="4" fill="#6b7280"/>
  </g>
  
  <!-- App title -->
  <text x="256" y="420" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">DT</text>
</svg>
`;

async function generateIcons() {
  try {
    console.log('Generating PWA icons...');
    
    // Create 512x512 icon
    await sharp(Buffer.from(iconSVG))
      .resize(512, 512)
      .png()
      .toFile('public/icon-512x512.png');
    console.log('✅ Created icon-512x512.png');
    
    // Create 192x192 icon
    await sharp(Buffer.from(iconSVG))
      .resize(192, 192)
      .png()
      .toFile('public/icon-192x192.png');
    console.log('✅ Created icon-192x192.png');
    
    // Create 180x180 Apple icon
    await sharp(Buffer.from(iconSVG))
      .resize(180, 180)
      .png()
      .toFile('public/apple-touch-icon.png');
    console.log('✅ Created apple-touch-icon.png');
    
    // Also create a favicon
    await sharp(Buffer.from(iconSVG))
      .resize(32, 32)
      .png()
      .toFile('public/favicon-32x32.png');
    console.log('✅ Created favicon-32x32.png');
    
    console.log('🎉 All icons generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons();
