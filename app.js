const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const port = process.env.PORT || 3000;

// DynamoDB設定（リージョンは必要に応じて変更）
AWS.config.update({ region: 'ap-northeast-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = 'kjtxt-translate-tb';

// 全件取得API
app.get('/kjtxts', async (req, res) => {
    try {
        const data = await dynamodb.scan({ TableName: tableName }).promise();
        if (!data.Items || data.Items.length === 0) {
            res.status(500).json("record not found");
        } else {
            res.status(200).json(data.Items);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ID指定取得API
app.get('/kjtxt', async (req, res) => {
    const skj = req.query.skj;
    if (!skj) {
        return res.status(400).json({ error: "Missing 'skj' parameter" });
    }

    try {
        const params = {
            TableName: tableName,
            Key: { skj: skj }
        };
        const data = await dynamodb.get(params).promise();
        if (data.Item) {
            res.status(200).json(data.Item);
        } else {
            res.status(500).json("record not found");
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// サーバ起動
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});