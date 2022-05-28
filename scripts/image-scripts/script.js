const sharp = require('sharp');
const fs = require('fs');
const sizeOf = require('image-size');
const { joinImages } = require('join-images');
const PNG = require('pngjs').PNG;
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const { 
  songsWithPageSeeping, 
  songWithTwoPages, 
  pageWithTwoSongs, 
  pageWithThreeSongs 
} = require('./constants');

const log = console.log;

const sfogFolderPath = './Songs-for-our-Generation_2015';
const croppedFilePath = './croppedSfogImages';
const finalImagePath = './sfogImages'
const croppedWidth = 1300;
const croppedHeight = 1682;

if (fs.existsSync(croppedFilePath)){
  fs.rmSync(croppedFilePath, { recursive: true, force: true });
}
fs.mkdirSync(croppedFilePath);

async function cropImage(imgPath, newFilePath, region) {
  const cropped = await sharp(imgPath)
    .extract(region);
  return cropped.toFile(newFilePath);
}

function getCropImagePromiseArray(calculatingWhiteSpaceBar, croppingBar) {
  return fs.readdirSync(sfogFolderPath).map((image, index) => {
    // don't include the first 16 pages and the last page
    if (![...Array(16).keys(), 283].includes(index)) {
      const imagePath = `${sfogFolderPath}/${image}`;
      // image name doesn't matter because we need to process it more anyways
      const newFilePath = `${croppedFilePath}/${index}.png`;
      const imageSize = sizeOf(imagePath);
      const {
        topWhitespace,
        bottomWhitespace,
        leftWhitespace, 
        rightWhitespace
      } = getAmountOfWhitespace(imagePath);
      const region = {
        left: leftWhitespace,
        top: topWhitespace,
        width: imageSize.width - leftWhitespace - rightWhitespace,
        height: imageSize.height - topWhitespace - bottomWhitespace
      };
      calculatingWhiteSpaceBar.increment();
      return cropImage(imagePath, newFilePath, region).then(() => croppingBar.increment());
    }
  })
}

async function main() {
  const bar1 = new cliProgress.SingleBar({
    format: colors.blue('{bar}') + ' {percentage}% || ETA: {eta}s || {value}/{total} images',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  const bar2 = new cliProgress.SingleBar({
    format: colors.blue('{bar}') + ' {percentage}% || ETA: {eta}s || {value}/{total} images',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  log(colors.green('CALCULATING WHITE SPACE...'));
  bar1.start(267, 0);
  const cropPromises = getCropImagePromiseArray(bar1, bar2);
  bar1.stop();
  log('')
  log(colors.green('CROPPING IMAGES...'));
  bar2.start(267, 0);
  await Promise.all(cropPromises);
  bar2.stop();
  log('Finished cropping');

  // if (fs.existsSync(finalImagePath)) {
  //   fs.rmSync(finalImagePath, { recursive: true, force: true });
  // }
  // fs.mkdirSync(finalImagePath);
  // let finalImagePromises = [];
  // let currentIndex = 0;
  // let currentSong = 1;
  // const allCroppedImagePaths = fs.readdirSync(croppedFilePath).map((imgpath) => `${croppedFilePath}/${imgpath}`);

  // while (currentIndex < allCroppedImagePaths.length) {
  //   let increaseIndex = 1;
  //   let increaseSong = 1;
  
  //   if (songsWithPageSeeping.includes(currentSong)) {
  //     increaseIndex = 2;
  //     increaseSong = 2;
  //   } else if (songWithTwoPages.includes(currentSong)) {
  //     increaseIndex = 2;
  //   } else if (pageWithTwoSongs.includes(currentSong)) {
  //     increaseSong = 2;
  //   } else if (currentSong in pageWithThreeSongs) {
  //     increaseSong = 3;
  //   } else {
  //     const finalSongImage = sharp(allCroppedImagePaths[currentIndex])
  //       .toFile(`${finalImagePath}/SFOG_${String(currentSong).padStart(3, '0')}.png`);
  //     finalImagePromises.push(finalSongImage);
  //   }
  //   currentIndex += increaseIndex;
  //   currentSong += increaseSong;
  // }
  // log('Starting to crop and merge images')
  // await Promise.all(finalImagePromises);
  // log('Done')
}

main();




// // joinImages(['SFOG_010.png', 'SFOG_011.png'], {offset: -100}).then((img) => {
// //   // Save image as file
// //   img.toFile('out.png');
// // });





/**
 * @typedef {Object} imgWhitespace
 * @property {number} topWhitespace    - Amount of white space on the top of image
 * @property {number} bottomWhitespace - Amount of white space on the bomttom of image
 * @property {number} leftWhitespace   - Amount of white space on the left of image
 * @property {number} rightWhitespace  - Amount of white space on the right of image
 */

/**
 * Return pixels of white space for top, bottom, left and right of an image
 * @param  {string} imgPath path to image
 * @return {imgWhitespace} amount of whitespace on the four sides of the image
 */
function getAmountOfWhitespace(imgPath) {

  let imgFile = fs.readFileSync(imgPath);
  const png = PNG.sync.read(imgFile);
  const pngData = png.data;
  const booleanPixelArray = [];
  
  // build boolean pixel array depending on if the pixel is white or not
  for (let i = 0; i < pngData.length; i += 4) {
    // skip the fourth value (alpha channel) we don't care about that
    booleanPixelArray.push([pngData[i], pngData[i + 1], pngData[i + 2]].every((num) => num === 255));
  }

  const pngMatrix = []
  for (let i = 0; i < booleanPixelArray.length; i += png.width) {
    const row = booleanPixelArray.slice(i, i + png.width);
    pngMatrix.push(row);
  }

  let topWhitespace;
  let bottomWhitespace;

  for (let i = 0; i < pngMatrix.length; i++) {
    if (!pngMatrix[i].every((isWhite) => isWhite)) {
        topWhitespace = i
        break;
    }
  }

  for (let i = pngMatrix.length - 1; i >= 0; i--) {
    if (!pngMatrix[i].every((isWhite) => isWhite)) {
      bottomWhitespace = pngMatrix.length - i - 1;
      break
    }
  }
  
  let leftWhitespace;
  let rightWhitespace;
  
  for (let i = 0; i < png.width; i++) {
    const column = getColumnOfMatrix(pngMatrix, i);
    const columnAllWhite = column.every((isWhite) => isWhite);
    if (!columnAllWhite) {
      leftWhitespace = i;
      break;
    }
  }

  for (let i = png.width - 1; i >= 0; i--) {
    const column = getColumnOfMatrix(pngMatrix, i);
    const columnAllWhite = column.every((isWhite) => isWhite);
    if (!columnAllWhite) {
      rightWhitespace = png.width - i - 1;
      break;
    }
  }

  return {
    topWhitespace,
    bottomWhitespace,
    leftWhitespace,
    rightWhitespace
  }
}

function getColumnOfMatrix(matrix, columnIndex) {
  return matrix.map(arr => arr[columnIndex])
}