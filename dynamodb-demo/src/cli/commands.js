const { DynamoDB } = require('aws-sdk');
const { getCredentials } = require('../../common/utils/credentials');
const { configureAWS } = require('../../common/utils/aws-config');

configureAWS(getCredentials());

const dynamoDB = new DynamoDB();

const createTable = async (tableName) => {
    const params = {
        TableName: tableName,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' } // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    try {
        const data = await dynamoDB.createTable(params).promise();
        console.log('Table created:', data);
    } catch (error) {
        console.error('Error creating table:', error);
    }
};

const listTables = async () => {
    try {
        const data = await dynamoDB.listTables().promise();
        console.log('Tables:', data.TableNames);
    } catch (error) {
        console.error('Error listing tables:', error);
    }
};

module.exports = {
    createTable,
    listTables
};