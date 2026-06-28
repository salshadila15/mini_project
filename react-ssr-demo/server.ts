import express from 'express';
import render from './src/entry-server';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 5173;

app.use('*', async (req, res) => {
    const html = render();

    const template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'), 
        'utf-8',
    );

    const finalHtml = template.replace('<!--app-->', html);
    res.send(finalHtml);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
