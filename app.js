
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


// CORS対応（必要に応じて）
app.use(cors());

// DynamoDB設定（リージョンは必要に応じて変更）
AWS.config.update({ region: 'ap-northeast-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = 'kjtxt-translate-tb';

// 全件取得API（順序指定：skj → jkj）
app.get('/kjtxts', async (req, res) => {
    try {
        const data = await dynamodb.scan({ TableName: tableName }).promise();
        if (!data.Items || data.Items.length === 0) {
            res.status(404).json("record not found");
        } else {
            const orderedItems = data.Items.map(item => ({
                skj: item.skj,
                jkj: item.jkj
            }));
            res.status(200).json(orderedItems);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ID指定取得API（jkjのみ返す）
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
        if (data.Item && data.Item.jkj !== undefined) {
            res.status(200).json({ jkj: data.Item.jkj });
        } else {
            res.status(404).json("record not found");
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// サーバ起動
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
