const { writeFile } = require('fs');
const { join } = require('path');
const request = require('request');
const blend = require('@mapbox/blend');
const argv = require('minimist')(process.argv.slice(2));

const {
  greeting = 'Hello',
  who = 'You',
  width = 400,
  height = 500,
  color = 'Pink',
  size = 100,
} = argv;
const BASE_URL = 'https://cataas.com/cat/';
const GET_CAT_PATH = 'cat/says/';
const ENCODING_TYPE = 'binary';
const IMAGE_NAME = 'cat-card';
const IMAGE_EXTENSIONS = {
  JPEG: 'jpeg',
  JPG: 'jpg'
}

/**
 * This function forms the image object array to bind images.
 * 
 * @param  {Array} images - Image object array
 */
const getImageObjectArrayForBinding = (images) => {
  return [
    {
      buffer: new Buffer(images[0], ENCODING_TYPE),
      x: 0,
      y: 0,
    },
    {
      buffer: new Buffer(images[1], ENCODING_TYPE),
      x: width,
      y: 0,
    }
  ];
}

/**
 * This function fetches the images form the server.
 * 
 * @param  {Object} firstReq - First request object.
 * @param  {Object} secondReq - Second request object.
 * @param  {Function} callback - callback function
 */
const getImages = (firstReq, secondReq, callback) => {
  return request.get(firstReq, (firstReqError, firstReqRes, firstBody) => {
    if (firstReqError) {
      console.log(`Error when retrieving the response for the first request: ${firstReqError}`);
      return callback(firstReqError);
    }
    console.log(`Received response for first request with status: ${firstReqRes.statusCode}`);
    return request.get(secondReq, (secondReqError, secondReqRes, secondBody) => {
      if (secondReqError) {
        console.log(`Error when retrieving the response for the second request: ${secondReqError}`);
        return callback(secondReqError);
      }
      console.log(`Received response for second request with status: ${secondReqRes.statusCode}`);
      return callback(null, [firstBody, secondBody]);
    });
  });
}

/**
 * This method binds images together.
 *
 * @param  {Object} imageObjArray - Image objects to be bounded.
 * @param  {Function} callback - callback function
 */
const bindImages = (imageObjArray, callback) => {
  return blend(imageObjArray, {
    width: width * 2,
    height: height,
    format: IMAGE_EXTENSIONS.jpeg,
  }, (err, data) => {
    if (err) {
      console.log(`Error while binding images. Error: ${err}`);
      return callback(err);
    }
    console.log('The file binding was successfull!');
    return callback(null, data);
  });
}

/**
 * This method writes image data to a file
 *
 * @param  {Object} data - Data to be saved.
 * @param  {Object} imageDetails - Image details
 * @param  {Function} callback - Callback function.
 */
const saveImage = (data, imageDetails, callback) => {
  if (!imageDetails || !imageDetails.name || !imageDetails.extension) {
    return callback("Image details are missing");
  }
  const fileOut = join(process.cwd(), `/${imageDetails.name}.${imageDetails.extension}`);
  return writeFile(fileOut, data, ENCODING_TYPE, (err) => {
    if (err) {
      console.log(`Error while saving the file. Error: ${err}`);
      return callback(err);
    }
    console.log('The file was saved!');
    return callback(null);
  });
}

/**
 * This function fetches 2 cat images and bind those together and forms a card.
 * User can create the card with a custom name and extension. Default name and extensions will be used
 * if those are not provided.
 *
 * @param {Object} imageDetails - Contains image details
 * @param {Function} callback - Callback function
 */
const createCatCard = (imageDetails, callback) => {
  const firstReq = {
    url: `${BASE_URL}${GET_CAT_PATH}${greeting}?width=${width}&height=${height}&color${color}&s=${size}`,
    encoding: ENCODING_TYPE
  };
  const secondReq = {
    url: `${BASE_URL}${GET_CAT_PATH}${who}?width=${width}&height=${height}&color${color}&s=${size}`,
    encoding: ENCODING_TYPE
  };
  return getImages(firstReq, secondReq, (imageFetchError, images) => {
    if (imageFetchError) {
      return callback(imageFetchError);
    }
    const imageObjArray = getImageObjectArrayForBinding(images);
    return bindImages(imageObjArray, (imageBindError, data) => {
      if (imageBindError) {
        return callback(imageBindError);
      }
      return saveImage(data, {
        name: imageDetails.name,
        extension: imageDetails.extension
      }, (imageSaveError, res) => {
        if (imageSaveError) {
          return callback(imageSaveError);
        }
        return callback(null);
      });
    })
  })
}

console.log("Start Cat Card Creation...");
createCatCard({
  name: IMAGE_NAME,
  extension: IMAGE_EXTENSIONS.JPG
}, (err, res) => {
  if (err) {
    console.log(`Cat Card creation is unsuccessful. Error: ${err}`);
    return;
  }
  console.log("Cat Card creation is completed successfully...!");
});