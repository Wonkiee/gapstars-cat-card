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
const BASE_URL = 'https://cataas.com/';
const GET_CAT_PATH = 'cat/says/';
const ENCODING_TYPE = 'binary';
const IMAGE_NAME = 'cat-card';
const IMAGE_EXTENSIONS = {
  JPEG: 'jpeg',
  JPG: 'jpg'
}
const firstRequest = {
  url: `${BASE_URL}${GET_CAT_PATH}${greeting}?width=${width}&height=${height}&color${color}&s=${size}`,
  encoding: ENCODING_TYPE
};
const secondRequest = {
  url: `${BASE_URL}${GET_CAT_PATH}${who}?width=${width}&height=${height}&color${color}&s=${size}`,
  encoding: ENCODING_TYPE
};

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
 * Sends a get request and gets the response.
 * 
 * @param  {Object} req - request details.
 */
const sendGetRequest = (req) => {
  return new Promise((resolve, reject) => {
    return request.get(req, (err, res, body) => {
      if (err) {
        console.log(`Error when retrieving the response for the first request: ${err}`);
        return reject(err);
      }
      console.log(`Received response for the request with status: ${res.statusCode}`);
      return resolve(body);
    });
  });
}

/**
 * This function fetches the images form the server.
 *
 * @param  {Object} firstReq - First request object.
 * @param  {Object} secondReq - Second request object.
 */
const getImages = async (firstReq, secondReq) => {
  try {
    const firstResponse = await sendGetRequest(firstReq);
    const secondResponse = await sendGetRequest(secondReq);
    return Promise.resolve([firstResponse, secondResponse]);
  }
  catch (error) {
    console.log(`Error wen fetching images from the server. Error: ${error}`);
    return Promise.reject(error);
  }
};

/**
 * This method binds images together.
 *
 * @param  {Object} imageObjArray - Image objects to be bounded.
 */
const bindImages = (imageObjArray) => (
  new Promise((resolve, reject) =>
    blend(imageObjArray, {
      width: width * 2,
      height: height,
      format: IMAGE_EXTENSIONS.jpeg,
    }, (err, data) => {
      if (err) {
        console.log(`Error while binding images. Error: ${err}`);
        return reject(err);
      }
      console.log('The file binding was successfull!');
      return resolve(data);
    })
  )
);

/**
 * This method writes image data to a file
 *
 * @param  {Object} data - Data to be saved.
 * @param  {Object} imageDetails - Image details
 */
const saveImages = (data, imageDetails) => {
  if (!imageDetails || !imageDetails.name || !imageDetails.extension) {
    return Promise.reject("Image details are missing");
  }
  const fileOut = join(process.cwd(), `/${imageDetails.name}.${imageDetails.extension}`);
  return new Promise ((resolve, reject) => (
      writeFile(fileOut, data, ENCODING_TYPE, (err) => {
        if (err) {
          console.log(`Error while saving the file. Error: ${err}`);
          return reject(err);
        }
        console.log('The file was saved!');
        return resolve(true);
      })
    )
  )
}

/**
 * This function fetches 2 cat images and bind those together and forms a card.
 * User can create the card with a custom name and extension. Default name and extensions will be used
 * if those are not provided.
 *
 * @param  {Object} imageDetails - contains image details
 */
const createCatCard = async (imageDetails) => {
  console.log("Start Cat Card Creation...");
  try {
    const images =  await getImages(firstRequest, secondRequest);
    const data = await bindImages(getImageObjectArrayForBinding(images));
    await saveImages(data, {
      name: imageDetails.name,
      extension: imageDetails.extension
    });
  }
  catch (error) {
    console.log(`Cat Card creation is unsuccessful. Error: ${error}`);
  }
}

createCatCard({
  name: IMAGE_NAME,
  extension: IMAGE_EXTENSIONS.JPG
});
