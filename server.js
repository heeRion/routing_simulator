const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

let devices = [];
let connections = [];

app.get('/devices', (req, res) => {
    res.json(devices);
});

app.post('/devices', (req, res) => {
    const device = req.body;
    devices.push(device);
    res.status(201).json(device);
});

app.post('/connections', (req, res) => {
    const connection = req.body;
    connections.push(connection);
    res.status(201).json(connection);
});

app.get('/connections', (req, res) => {
    res.json(connections);
});

app.delete('/devices/:id', (req, res) => {
    const id = req.params.id;
    devices = devices.filter(device => device.id !== id);
    connections = connections.filter(conn => conn.from !== id && conn.to !== id);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
