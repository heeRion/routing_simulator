let deviceCounter = 0;
let devices = [];
let connections = [];
let selectedDevice = null;
let isConnecting = false;
let connectStart = null;

function addDevice(type) {
    const workspace = document.getElementById('workspace');
    const device = document.createElement('div');
    device.className = `device ${type}`;
    device.innerText = type.charAt(0).toUpperCase() + type.slice(1);
    device.style.top = '50px';
    device.style.left = '50px';
    device.setAttribute('draggable', true);
    device.setAttribute('data-id', deviceCounter);
    deviceCounter++;
    
    device.addEventListener('dragstart', dragStart);
    device.addEventListener('dragend', dragEnd);
    device.addEventListener('click', () => selectDevice(device));

    devices.push({ id: deviceCounter, type: type, x: 50, y: 50, ip: '', subnet: '' });
    workspace.appendChild(device);
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
}

function dragEnd(e) {
    const id = e.target.getAttribute('data-id');
    const device = devices.find(d => d.id == id);
    device.x = e.target.offsetLeft;
    device.y = e.target.offsetTop;
    updateConnections();
}

function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const device = devices.find(d => d.id == id);
    const elem = document.querySelector(`[data-id='${id}']`);
    elem.style.left = `${e.clientX - 30}px`;
    elem.style.top = `${e.clientY - 30}px`;
    device.x = e.clientX - 30;
    device.y = e.clientY - 30;
    updateConnections();
}

function selectDevice(device) {
    if (isConnecting) {
        if (connectStart) {
            createConnection(connectStart, device);
            isConnecting = false;
            connectStart = null;
        }
    } else {
        selectedDevice = devices.find(d => d.id == device.getAttribute('data-id'));
        openModal();
    }
}

function connectDevices() {
    isConnecting = true;
}

function createConnection(device1, device2) {
    const connectionLayer = document.getElementById('connectionLayer');
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const device1Pos = device1.getBoundingClientRect();
    const device2Pos = device2.getBoundingClientRect();

    line.setAttribute('x1', device1Pos.left + 30);
    line.setAttribute('y1', device1Pos.top + 30);
    line.setAttribute('x2', device2Pos.left + 30);
    line.setAttribute('y2', device2Pos.top + 30);
    line.classList.add('connection');

    connectionLayer.appendChild(line);
    connections.push({ from: device1.getAttribute('data-id'), to: device2.getAttribute('data-id'), line: line });
}

function updateConnections() {
    connections.forEach(conn => {
        const device1 = document.querySelector(`[data-id='${conn.from}']`).getBoundingClientRect();
        const device2 = document.querySelector(`[data-id='${conn.to}']`).getBoundingClientRect();
        conn.line.setAttribute('x1', device1.left + 30);
        conn.line.setAttribute('y1', device1.top + 30);
        conn.line.setAttribute('x2', device2.left + 30);
        conn.line.setAttribute('y2', device2.top + 30);
    });
}

function startSimulation() {
    console.log('Starting simulation...');
    devices.forEach(device => {
        console.log(`Device ${device.id} (${device.type}) - IP: ${device.ip}, Subnet: ${device.subnet}`);
    });
    connections.forEach(conn => {
        console.log(`Connection from ${conn.from} to ${conn.to}`);
    });
    if (connections.length > 0) {
        console.log('Simulating packet transmission...');
    }
}

function openModal() {
    document.getElementById('propertyModal').style.display = 'block';
    document.getElementById('ip').value = selectedDevice.ip;
    document.getElementById('subnet').value = selectedDevice.subnet;
}

function closeModal() {
    document.getElementById('propertyModal').style.display = 'none';
}

function saveProperties() {
    selectedDevice.ip = document.getElementById('ip').value;
    selectedDevice.subnet = document.getElementById('subnet').value;
    closeModal();
}
