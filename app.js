
const express = require('express');
const cors = require('cors');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const app = express();
const port = process.env.PORT || 8080;

// CORS対応
app.use(cors());

// DynamoDB設定（リージョンは必要に応じて変更）
const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const tableName = 'kjtxt-translate-tb';

// 全件取得API（順序指定：skj → jkj）
app.get('/kjtxts', async (req, res) => {
    try {
        const command = new ScanCommand({ TableName: tableName });
        const data = await dynamodb.send(command);

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
        const command = new GetCommand({
            TableName: tableName,
            Key: { skj: skj }
        });
        const data = await dynamodb.send(command);

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
