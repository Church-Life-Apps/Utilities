const sharp = require('sharp');
const fs = require('fs');
const sizeOf = require('image-size');
const { joinImages } = require('join-images');
const { mainModule } = require('process');

const sfogFolderPath = './Songs-for-our-Generation_2015';
const croppedFilePath = './croppedSfogImages';
const finalImagePath = './sfogImages'
const croppedWidth = 1300;
const croppedHeight = 1682;
const songsWithPageSeeping = [15, 57, 80, 243]
const songWithTwoPages = [10, 17, 20, 23, 26, 63, 114, 123, 150, 165, 168, 175, 178, 181, 186, 197, 200, 201, 204, 211, 226, 227, 234, 245, 246, 249]
const pageWithTwoSongs = [137, 139, 144, 146, 218, 220]
const pageWithThreeSongs = [141]

if (!fs.existsSync(croppedFilePath)){
  fs.mkdirSync(croppedFilePath);
}

async function cropImage(imgPath, newFilePath) {
  const imageSize = sizeOf(imgPath);

  const cropped = await sharp(imgPath)
    .extract({ 
      left: (imageSize.width - croppedWidth) / 2,
      top: (imageSize.height - croppedHeight) / 2, 
      width: croppedWidth, 
      height: croppedHeight 
    });
  return cropped.toFile(newFilePath);
}

let cropPromises = []
let currentSong = 


fs.readdirSync(sfogFolderPath).forEach((image, index) => {
  const imagePath = `${sfogFolderPath}/${image}`;
  const newFilePath = `${croppedFilePath}/SFOG_${String(index + 1).padStart(3, '0')}.png`;
  cropPromises.push(cropImage(imagePath, newFilePath));
})

async function main() {
  let cropResponse = await Promise.all(cropPromises);
  console.log(cropResponse)
  fs.readdirSync(sfogFolderPath).forEach((image, index) => {
    const imagePath = `${sfogFolderPath}/${image}`;
    const newFilePath = `${croppedFilePath}/SFOG_${String(index + 1).padStart(3, '0')}.png`;
    cropPromises.push(cropImage(imagePath, newFilePath));
  })
}

main();




// joinImages(['SFOG_010.png', 'SFOG_011.png'], {offset: -100}).then((img) => {
//   // Save image as file
//   img.toFile('out.png');
// });