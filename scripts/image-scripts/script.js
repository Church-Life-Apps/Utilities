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
const finalImagePath = './sfogImages';
const tempFolder = './temp';
const tempFolder2 = './temptwo';
const paddingLeft = 50;
const paddingRight = 50;
const paddingTop = 50;
const paddingBottom = 50;
// if (fs.existsSync(croppedFilePath)){
//   fs.rmSync(croppedFilePath, { recursive: true, force: true });
// }
// fs.mkdirSync(croppedFilePath);

async function main() {
  // const bar1 = bar();
  // const bar2 = bar();
  // log(colors.green('CALCULATING WHITE SPACE...'));
  // bar1.start(267, 0);
  // const cropPromises = getCropImagePromiseArray(bar1, bar2);
  // bar1.stop();
  // log('');
  // log(colors.green('CROPPING IMAGES...'));
  // bar2.start(267, 0);
  // await Promise.all(cropPromises);
  // bar2.stop();
  // log('Finished cropping');

  if (fs.existsSync(finalImagePath)) {
    fs.rmSync(finalImagePath, { recursive: true, force: true });
  }
  fs.mkdirSync(finalImagePath);
  let finalImagePromises = [];
  let currentIndex = 0;
  let currentSong = 1;
  const allCroppedImagePaths = fs.readdirSync(croppedFilePath).map((imgpath) => `${croppedFilePath}/${imgpath}`);
  // sort the image paths to be in order
  allCroppedImagePaths.sort((a, b) => {
    return +a.split('/')[2].split('.')[0] - +b.split('/')[2].split('.')[0];
  })
  while (currentIndex < allCroppedImagePaths.length) {
    let increaseIndex = 1;
    let increaseSong = 1;
  
    if (songsWithPageSeeping.includes(currentSong)) {
      // console.log(currentSong);
      increaseIndex = 2;
      increaseSong = 2;
    } else if (songWithTwoPages.includes(currentSong)) {
      // console.log(currentSong);
      increaseIndex = 2;
    } else if (currentSong in pageWithTwoSongs) {
      // console.log(currentSong);
      increaseSong = 2;
    } else if (currentSong in pageWithThreeSongs) {
      await handleThreeSongOnePage(allCroppedImagePaths[currentIndex]);
      await cropThreeSongOnePage('./temp');
      pushThreeSongToArry(finalImagePromises, currentSong);
      increaseSong = 3;
    } else {
      finalImagePromises.push(padImageFileWithWhitespace(
        allCroppedImagePaths[currentIndex],
        `${finalImagePath}/SFOG_${String(currentSong).padStart(3, '0')}.png`)
      );
    }
    currentIndex += increaseIndex;
    currentSong += increaseSong;
  }
  log('Starting to crop and merge images');
  await Promise.all(finalImagePromises);
  log('Done');
}

main();
function padImageFileWithWhitespace(filePath, outputPath) {
  return sharp(filePath)
    .extend({
      top: paddingTop,
      left: paddingLeft,
      bottom: paddingBottom, 
      right: paddingRight,
      background: { r: 255, g: 255, b: 255 }
    })
    .toFile(outputPath);
}

async function pushThreeSongToArry(arr, currentSong) {
  let filePaths = fs.readdirSync('./ok');
  let index = 0;
  for (const filePath of filePaths) {
    const contents = await padImageFileWithWhitespace(
      `./ok/${filePath}`,
      `${finalImagePath}/SFOG_${String(currentSong + index).padStart(3, '0')}.png`);
    console.log(contents);
    index++;
  }
};

async function cropThreeSongOnePage(filePath) {
  return fs.readdirSync(filePath).map((image, index) => {
    const imagePath = `${filePath}/${image}`;
    const newFilePath = `./ok/${index + 1}.png`;
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
    return cropImage(imagePath, newFilePath, region);
  })
}

async function handleThreeSongOnePage(imgPath) {
  if (fs.existsSync('./temp')) {
    fs.rmSync('./temp', { recursive: true, force: true });
  }
  fs.mkdirSync('./temp');
  const imageSize = sizeOf(imgPath);
  const p1 = cropImage(imgPath, './temp/1.png',{
    left: 0,
    top: 0,
    width: imageSize.width,
    height: 527
  });
  const p2 = cropImage(imgPath, './temp/2.png',{
    left: 0,
    top: 527,
    width: imageSize.width,
    height: 500
  });  
  const p3 = cropImage(imgPath, './temp/3.png',{
    left: 0,
    top: 1027,
    width: imageSize.width,
    height: imageSize.height - 500 - 527
  });
  return Promise.all([p1, p2, p3])
}

/**
 * @typedef {Object} region describes the region to extract using pixel values
 * @property {number} left    - zero-indexed offset from left edge
 * @property {number} top     - zero-indexed offset from top edge
 * @property {number} width   - width of region to extract
 * @property {number} height  - height of region to extract
 */

/**
 * Crop and write image to provided file path
 * @param  {string} imgPath path to image
 * @param  {string} newFilePath output path
 * @param  {region} region how much to crop
 * @return {Promise} Promise represent cropping and writing to new file 
 */
async function cropImage(imgPath, newFilePath, region) {
  return sharp(imgPath)
    .extract(region)
    .toFile(newFilePath);
}

/**
 * Loops through images (ignoring some) and calculates the image white space and addes the cropping task to a promise array
 * @param  {} calculatingWhiteSpaceBar progress bar instance for calculating white space
 * @param  {} croppingBar progress bar instance for cropping
 * @return {Promise[]} Array of cropImage promises
 */
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

function bar() {
  return new cliProgress.SingleBar({
    format: colors.blue('{bar}') + ' {percentage}% || ETA: {eta}s || {value}/{total} images',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
}