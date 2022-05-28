const sharp = require('sharp');
const fs = require('fs');
const sizeOf = require('image-size');
const { joinImages } = require('join-images');
const { fromPath } = require("pdf2pic");
const PNG = require('pngjs').PNG;
const { 
  songsWithPageSeeping, 
  songWithTwoPages, 
  pageWithTwoSongs, 
  pageWithThreeSongs 
} = require('./constants');
let xd = fs.readFileSync('SFOG_010.png');
const png = PNG.sync.read(xd);
const pngData = png.data
const array = []
for (let i = 0; i < pngData.length; i += 4) {
  array.push([pngData[i], pngData[i + 1], pngData[i + 2]].every((num) => num === 255))
}
const chunked = []
for (let i = 0; i < array.length; i += png.width) {
  const chunk = array.slice(i, i + png.width);
  chunked.push(chunk.every((isWhite) => isWhite))
}
console.log(png)
console.log(chunked)

// console.log(png.every((val) => val === 255))
// console.log(sheeeeesh.every((val) => val === 255))

// for (let i = 0; i < png.length; i++) {
//   console.log(png[i])
// }
// const specimen1 = "./Songs-for-our-Generation_2015.pdf";
// const outputDirectory = "./sheesh";


// const sfogFolderPath = './Songs-for-our-Generation_2015';
// const croppedFilePath = './croppedSfogImages';
// const finalImagePath = './sfogImages'
// const croppedWidth = 1300;
// const croppedHeight = 1682;

// if (fs.existsSync(croppedFilePath)){
//   fs.rmSync(croppedFilePath, { recursive: true, force: true });
// }
// fs.mkdirSync(croppedFilePath);

// async function cropImage(imgPath, newFilePath) {
//   const imageSize = sizeOf(imgPath);

//   const cropped = await sharp(imgPath)
//     .extract({ 
//       left: (imageSize.width - croppedWidth) / 2,
//       top: (imageSize.height - croppedHeight) / 2, 
//       width: croppedWidth, 
//       height: croppedHeight 
//     });
//   return cropped.toFile(newFilePath);
// }

// function getCropImagePromiseArray() {
//   return fs.readdirSync(sfogFolderPath).map((image, index) => {
//     // don't include the first 16 pages and the last page
//     if (![...Array(16).keys(), 283].includes(index)) {
//       const imagePath = `${sfogFolderPath}/${image}`;
//       // image name doesn't matter because we need to process it more anyways
//       const newFilePath = `${croppedFilePath}/${index}.png`;
//       return cropImage(imagePath, newFilePath);
//     }
//   })
// }

// // function extract(imgPath, startHeight, imageLength, finalFilePath) {
// //   const imageSize = sizeOf(imgPath);
// //   const cropped = await sharp(imgPath)
// //   .extract({ 
// //     left: (imageSize.width - croppedWidth) / 2,
// //     top: (imageSize.height - croppedHeight) / 2, 
// //     width: croppedWidth, 
// //     height: croppedHeight 
// //   });
// // }

// async function main() {
//   const cropPromises = getCropImagePromiseArray();
//   console.log('Start cropping');
//   await Promise.all(cropPromises);
//   console.log('Finished cropping');

//   if (fs.existsSync(finalImagePath)) {
//     fs.rmSync(finalImagePath, { recursive: true, force: true });
//   }
//   fs.mkdirSync(finalImagePath);
//   let finalImagePromises = [];
//   let currentIndex = 0;
//   let currentSong = 1;
//   const allCroppedImagePaths = fs.readdirSync(croppedFilePath).map((imgpath) => `${croppedFilePath}/${imgpath}`);

//   while (currentIndex < allCroppedImagePaths.length) {
//     let increaseIndex = 1;
//     let increaseSong = 1;
  
//     if (songsWithPageSeeping.includes(currentSong)) {
//       increaseIndex = 2;
//       increaseSong = 2;
//     } else if (songWithTwoPages.includes(currentSong)) {
//       increaseIndex = 2;
//     } else if (pageWithTwoSongs.includes(currentSong)) {
//       increaseSong = 2;
//     } else if (currentSong in pageWithThreeSongs) {
//       increaseSong = 3;
//     } else {
//       const finalSongImage = sharp(allCroppedImagePaths[currentIndex])
//         .toFile(`${finalImagePath}/SFOG_${String(currentSong).padStart(3, '0')}.png`);
//       finalImagePromises.push(finalSongImage);
//     }
//     currentIndex += increaseIndex;
//     currentSong += increaseSong;
//   }
//   console.log('Starting to crop and merge images')
//   await Promise.all(finalImagePromises);
//   console.log('Done')
// }

// main();




// // joinImages(['SFOG_010.png', 'SFOG_011.png'], {offset: -100}).then((img) => {
// //   // Save image as file
// //   img.toFile('out.png');
// // });