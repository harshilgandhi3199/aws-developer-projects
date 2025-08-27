const AWS = require('aws-sdk');
const { getAWSCredentials } = require('../../common/utils/credentials');
const { DYNAMODB_TABLE } = require('../../common/constants/index');

// Configure AWS SDK
getAWSCredentials();
AWS.config.update({ region: 'us-east-1' });

const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Function to create an item in DynamoDB
 * @param {Object} item - The item to be added to the table
 * @returns {Promise} - Promise representing the result of the operation
 */
const createItem = async (item) => {
    const params = {
        TableName: DYNAMODB_TABLE,
        Item: item,
    };
    return dynamoDB.put(params).promise();
};

/**
 * Function to get an item from DynamoDB
 * @param {String} id - The ID of the item to retrieve
 * @returns {Promise} - Promise representing the retrieved item
 */
const getItem = async (id) => {
    const params = {
        TableName: DYNAMODB_TABLE,
        Key: { id },
    };
    const result = await dynamoDB.get(params).promise();
    return result.Item;
};

/**
 * Function to delete an item from DynamoDB
 * @param {String} id - The ID of the item to delete
 * @returns {Promise} - Promise representing the result of the operation
 */
const deleteItem = async (id) => {
    const params = {
        TableName: DYNAMODB_TABLE,
        Key: { id },
    };
    return dynamoDB.delete(params).promise();
};

module.exports = {
    createItem,
    getItem,
    deleteItem,
};